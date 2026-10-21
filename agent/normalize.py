"""Conservative normalization: keep source facts and leave missing facts unknown."""
import math
import re
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from html import escape, unescape
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from bs4 import BeautifulSoup

from agent.config import MAX_DESCRIPTION_CHARACTERS


def text(value):
    return BeautifulSoup(value, "html.parser").get_text(" ", strip=True) if isinstance(value, str) else ""


def strings(value):
    if isinstance(value, str):
        value = value.split(",")
    if not isinstance(value, list):
        return []
    return list(dict.fromkeys(text(item)[:100] for item in value if text(item)))[:40]


def source_identifier(value):
    return str(value).strip()[:512] if isinstance(value, (str, int)) and not isinstance(value, bool) else ""


def safe_url(value):
    if not isinstance(value, str) or any(ord(c) < 32 for c in value):
        return ""
    try:
        parsed = urlsplit(value.strip())
        if parsed.scheme not in {"https", "http"} or not parsed.hostname or parsed.username or parsed.password:
            return ""
        _ = parsed.port
        return value.strip()
    except ValueError:
        return ""


def canonical_key(url):
    """Dedupe tracking variants, but leave the original application/source URL intact."""
    parsed = urlsplit(url)
    query = [(k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=True)
             if not k.lower().startswith("utm_") and k.lower() not in {"fbclid", "gclid"}]
    return urlunsplit((parsed.scheme.lower(), parsed.netloc.lower(), parsed.path.rstrip("/"), urlencode(sorted(query)), ""))


def valid_job(job):
    return (isinstance(job, dict) and
            all(isinstance(job.get(key), str) and job[key].strip() for key in ("title", "company", "url")) and
            bool(safe_url(job["url"])))


def parse_relative_date(value, now=None, allow_future=False):
    now = now or datetime.now(timezone.utc)
    if isinstance(value, bool) or value is None:
        return ""
    try:
        if isinstance(value, (int, float)):
            date = datetime.fromtimestamp(value, timezone.utc)
        elif isinstance(value, str) and value.strip():
            value = value.strip()
            match = re.fullmatch(r"(\d+)\s*(day|week|month|hour|minute)s?\s*ago", value.lower())
            if match:
                seconds = {"day": 86400, "week": 604800, "month": 2592000, "hour": 3600, "minute": 60}
                date = now - timedelta(seconds=int(match[1]) * seconds[match[2]])
            elif value.lower() in {"today", "just now", "yesterday"}:
                date = now - timedelta(days=value.lower() == "yesterday")
            else:
                try:
                    date = datetime.fromisoformat(value.replace("Z", "+00:00"))
                except ValueError:
                    date = parsedate_to_datetime(value)
        else:
            return ""
        if date.tzinfo is None:
            date = date.replace(tzinfo=timezone.utc)
        date = date.astimezone(timezone.utc)
        return date.isoformat() if allow_future or date <= now else ""
    except (ValueError, TypeError, OverflowError, OSError):
        return ""


def clean_html(value):
    if not isinstance(value, str) or not value:
        return ""
    # A few feeds HTML-encode their entire descriptions. Decode before sanitizing.
    if not re.search(r"<[a-zA-Z][^>]*>", value) and re.search(r"&lt;(?:p|div|h[1-6]|ul)\b", value):
        value = unescape(value)
    soup = BeautifulSoup(value, "html.parser")
    if not soup.find():
        soup = BeautifulSoup("".join(f"<p>{escape(p.strip()).replace(chr(10), '<br/>')}</p>"
                                     for p in value.split("\n\n") if p.strip()), "html.parser")
    for element in soup(["script", "style", "iframe", "embed", "object", "form", "svg", "math"]):
        element.decompose()
    allowed = {"p", "br", "ul", "ol", "li", "strong", "b", "em", "i", "u", "h1", "h2", "h3", "h4", "h5", "h6"}
    for tag in soup.find_all(True):
        if tag.name in {"div", "section", "article"}:
            tag.name = "p"
        if tag.name not in allowed:
            tag.unwrap()
        else:
            tag.attrs = {}
    result = str(soup)
    if len(result) > MAX_DESCRIPTION_CHARACTERS:
        # Truncate as escaped text, never cut in the middle of HTML tags/entities.
        result = f"<p>{escape(soup.get_text(' ', strip=True)[:MAX_DESCRIPTION_CHARACTERS])}</p><p>[Description truncated]</p>"
    return result


COUNTRIES = {
    "us": "US", "usa": "US", "united states": "US", "united states of america": "US", "united states only": "US",
    "uk": "GB", "united kingdom": "GB", "canada": "CA", "germany": "DE", "france": "FR", "india": "IN",
    "australia": "AU", "netherlands": "NL", "spain": "ES", "portugal": "PT", "brazil": "BR", "mexico": "MX",
    "poland": "PL", "ireland": "IE", "new zealand": "NZ", "sweden": "SE", "norway": "NO", "denmark": "DK",
    "finland": "FI", "switzerland": "CH", "austria": "AT", "italy": "IT", "belgium": "BE", "czechia": "CZ",
    "czech republic": "CZ", "romania": "RO", "greece": "GR", "ukraine": "UA", "estonia": "EE", "lithuania": "LT",
    "latvia": "LV", "singapore": "SG", "japan": "JP", "south korea": "KR", "philippines": "PH", "indonesia": "ID",
    "malaysia": "MY", "vietnam": "VN", "thailand": "TH", "israel": "IL", "south africa": "ZA", "nigeria": "NG",
    "kenya": "KE", "argentina": "AR", "chile": "CL", "colombia": "CO", "peru": "PE", "pakistan": "PK",
    "bangladesh": "BD", "turkey": "TR", "türkiye": "TR", "hungary": "HU", "croatia": "HR", "serbia": "RS",
}
ISO_COUNTRIES = set("AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split())


def applicant_countries(location):
    parts = strings(location.replace(";", ",") if isinstance(location, str) else location)
    countries = [COUNTRIES.get(part.lower()) or (part.upper() if part.upper() in ISO_COUNTRIES else "") for part in parts]
    return list(dict.fromkeys(countries)) if countries and all(countries) else []


EMPLOYMENT_TYPES = {
    "full time": "FULL_TIME", "fulltime": "FULL_TIME", "vollzeit": "FULL_TIME",
    "part time": "PART_TIME", "parttime": "PART_TIME", "teilzeit": "PART_TIME",
    "contract": "CONTRACTOR", "contractor": "CONTRACTOR", "freelance": "CONTRACTOR",
    "internship": "INTERN", "intern": "INTERN", "praktikum": "INTERN",
    "temporary": "TEMPORARY", "volunteer": "VOLUNTEER", "other": "OTHER",
}


def employment_type(value):
    for item in strings(value):
        normalized = re.sub(r"[-_]", " ", item.lower()).strip()
        if normalized in EMPLOYMENT_TYPES:
            return EMPLOYMENT_TYPES[normalized]
    return ""


def is_developer_role(title, tags=()):
    title = text(title).lower()
    # Broad feeds often tag sales/recruiting at software companies as "engineering".
    if re.search(r"\b(sales|recruiter|recruiting|business development|account executive|marketing)\b", title):
        return False
    pattern = r"\b(developer|software|programmer|frontend|front.end|backend|back.end|full.stack|devops|devsecops|sre|qa|test automation|data (engineer|scientist|analyst)|machine learning|ml engineer|ai engineer|platform engineer|cloud engineer|security engineer|site reliability|engineering manager|technical lead|cto|mobile engineer|web engineer|entwickler|softwareentwickler|softwareentwicklung)\b"
    tags = strings(list(tags) if isinstance(tags, tuple) else tags)
    return bool(re.search(pattern, title) or re.search(pattern, " ".join(tags).lower()) or
                any(tag.lower() in {"dev", "development", "programming", "data science", "data science & analytics"} for tag in tags))


def salary_details(minimum=None, maximum=None, currency="", period=""):
    def number(value):
        try:
            result = float(value) if not isinstance(value, bool) else 0
            return result if math.isfinite(result) and result > 0 else None
        except (ValueError, TypeError, OverflowError):
            return None
    minimum, maximum = number(minimum), number(maximum)
    if minimum is None and maximum is None:
        return {}
    if minimum and maximum and minimum > maximum:
        return {}
    currency = text(currency).upper()
    currency = currency if re.fullmatch(r"[A-Z]{3}", currency) else ""
    periods = {"hourly": "HOUR", "hour": "HOUR", "daily": "DAY", "day": "DAY", "weekly": "WEEK", "week": "WEEK", "fortnightly": "FORTNIGHT", "monthly": "MONTH", "month": "MONTH", "yearly": "YEAR", "annual": "YEAR", "annually": "YEAR", "year": "YEAR"}
    period = periods.get(text(period).lower(), "")
    def display(amount):
        return f"{amount:,.2f}".rstrip("0").rstrip(".")
    amount = f"{display(minimum)} – {display(maximum)}" if minimum and maximum else (f"From {display(minimum)}" if minimum else f"Up to {display(maximum)}")
    label = f"{currency} {amount}".strip() if currency else f"{amount} (currency not provided)"
    label += f" / {period.lower()}" if period else " (pay period not provided)"
    return {"salary": label, "salary_min": minimum, "salary_max": maximum, "salary_currency": currency, "salary_period": period}


def description_sections(description):
    """Extract only explicitly headed sections, without inferring candidate facts."""
    soup = BeautifulSoup(description, "html.parser")
    labels = {"requirements": "requirements", "qualifications": "requirements", "what you bring": "requirements", "what you'll bring": "requirements", "responsibilities": "responsibilities", "what you'll do": "responsibilities", "what you will do": "responsibilities", "benefits": "benefits", "what we offer": "benefits", "perks": "benefits"}
    sections = {}
    active = None
    for element in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li"]):
        if element.name == "p" and element.find_parent("li"):
            continue
        value = element.get_text(" ", strip=True)
        key = value.lower().strip(" :")
        if element.name.startswith("h") or key in labels:
            active = labels.get(key)
        elif active and value and not element.find(["p", "li"]):
            sections.setdefault(active, []).append(value[:2000])
    return {key: list(dict.fromkeys(values))[:20] for key, values in sections.items()}


def normalize_job(source, *, title, company, url, description="", posted_at="", now=None, **fields):
    now = now or datetime.now(timezone.utc)
    description = clean_html(description)
    location = text(fields.pop("location", ""))
    job = {
        "title": text(title), "company": text(company), "url": safe_url(url), "source": source,
        "description": description, "posted_at": parse_relative_date(posted_at, now=now),
        "salary": "", "location": location, "applicant_countries": applicant_countries(location),
        "remote": True, "last_seen_at": now.isoformat(),
        **fields,
    }
    for key in ("apply_url", "company_logo", "company_url"):
        if key in job:
            job[key] = safe_url(job[key])
    for key in ("tags", "categories"):
        if key in job:
            job[key] = strings(job[key])
    job["employment_type"] = employment_type(job.get("employment_type"))
    job["sections"] = description_sections(description)
    if "valid_through" in job:
        job["valid_through"] = parse_relative_date(job["valid_through"], now=now, allow_future=True)
    if "updated_at" in job:
        job["updated_at"] = parse_relative_date(job["updated_at"], now=now)
    return job
