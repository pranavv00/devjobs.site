"""Public-feed adapters. No accounts, page scraping, or browser automation required."""
import logging
from contextlib import nullcontext
from datetime import datetime, timezone
from urllib.parse import urlsplit

from bs4 import BeautifulSoup

from agent.config import DEFAULT_MAX_PAGES, WEWORKREMOTELY_URLS
from agent.http import FeedClient
from agent.normalize import (
    applicant_countries, clean_html, is_developer_role, normalize_job,
    parse_relative_date, salary_details, source_identifier, strings, text, valid_job,
)

logger = logging.getLogger(__name__)


class PaginationLimit(Exception):
    """The configured budget was reached; the fetched pages remain useful."""


def records(payload, key=None):
    value = payload.get(key) if key and isinstance(payload, dict) else payload if key is None else None
    if not isinstance(value, list):
        raise ValueError(f"Expected a list in {key or 'response'}")
    for item in value:
        if isinstance(item, dict):
            yield item
        else:
            logger.warning("Skipping a non-object feed record")


def cursor_pages(client, url, params, max_pages):
    seen = set()
    for _ in range(max_pages):
        data = client.json(url, params=params)
        if not isinstance(data, dict):
            raise ValueError("Expected a JSON feed object")
        yield data
        cursor = data.get("nextCursor")
        if not cursor:
            if data.get("hasMore") is True:
                raise ValueError("Feed says more pages exist but omitted its cursor")
            return
        if not isinstance(cursor, str) or cursor in seen:
            raise ValueError("Source returned an invalid or repeated pagination cursor")
        seen.add(cursor)
        params = {**params, "cursor": cursor}
    raise PaginationLimit(f"Stopped at {max_pages} pages; raise --max-pages for more coverage")


def fetch_weworkremotely(client, max_pages, now):
    failures = 0
    for url in WEWORKREMOTELY_URLS:
        try:
            soup = BeautifulSoup(client.get(url).content, "xml")
            if not soup.find("rss"):
                raise ValueError("Expected an RSS feed")
            for item in soup.find_all("item"):
                def value(name):
                    node = item.find(name)
                    return node.get_text() if node else ""
                title = value("title")
                company, separator, title_part = title.partition(": ")
                yield normalize_job(
                    "WeWorkRemotely", title=title_part if separator else title,
                    company=company if separator else value("company"), url=value("link"),
                    description=value("encoded") or value("description"), posted_at=value("pubDate"),
                    source_id=value("guid"), location=value("region") or value("location"),
                    employment_type=value("type"), salary=value("salary"),
                    categories=["DevOps" if "devops" in url else "Programming"],
                    tags=[node.get_text() for node in item.find_all("category")], now=now,
                )
        except Exception:
            failures += 1
            logger.exception("WWR feed failed: %s", url)
    if failures:
        raise ValueError(f"{failures} WWR category feed(s) failed")


def fetch_remotive(client, max_pages, now):
    data = client.json("https://remotive.com/api/remote-jobs")
    for item in records(data, "jobs"):
        yield normalize_job(
            "Remotive", title=item.get("title"), company=item.get("company_name"), url=item.get("url"),
            description=item.get("description"), posted_at=item.get("publication_date"),
            salary=text(item.get("salary")), location=item.get("candidate_required_location"),
            source_id=source_identifier(item.get("id")), tags=item.get("tags"), categories=[item.get("category", "")],
            employment_type=item.get("job_type"), company_logo=item.get("company_logo"),
            allow_syndication=False, now=now,
        )


def fetch_remoteok(client, max_pages, now):
    for item in records(client.json("https://remoteok.com/api")):
        if "position" not in item:  # Legal notice; do not assume it is always index zero.
            continue
        yield normalize_job(
            "RemoteOK", title=item.get("position"), company=item.get("company"), url=item.get("url"),
            description=item.get("description"), posted_at=item.get("date") or item.get("epoch"),
            source_id=source_identifier(item.get("id")), tags=item.get("tags"), location=item.get("location"),
            company_logo=item.get("company_logo") or item.get("logo"), employment_type=item.get("employment_type"),
            **salary_details(item.get("salary_min"), item.get("salary_max"), item.get("salary_currency"), item.get("salary_period")),
            now=now,
        )


def fetch_workingnomads(client, max_pages, now):
    for item in records(client.json("https://www.workingnomads.com/api/exposed_jobs/")):
        yield normalize_job(
            "WorkingNomads", title=item.get("title"), company=item.get("company_name"), url=item.get("url"),
            description=item.get("description"), posted_at=item.get("pub_date"),
            location=item.get("location"), tags=item.get("tags"), categories=[item.get("category_name", "")],
            salary=text(item.get("salary")), employment_type=item.get("job_type"), now=now,
        )


def fetch_jobicy(client, max_pages, now):
    # Fetch all categories once and filter locally so changing taxonomy slugs do not lose jobs.
    for data in cursor_pages(client, "https://jobicy.com/api/jobs", {"count": 100}, max_pages):
        for item in records(data, "jobs"):
            legacy_salary = "salaryMin" not in item and "salaryMax" not in item
            yield normalize_job(
                "Jobicy", title=item.get("jobTitle"), company=item.get("companyName"), url=item.get("url"),
                description=item.get("jobDescription"), posted_at=item.get("pubDate"), source_id=source_identifier(item.get("id")),
                location=item.get("jobGeo"), employment_type=item.get("jobType"),
                experience_level=text(item.get("jobLevel")), categories=item.get("jobIndustry"),
                company_logo=item.get("companyLogo"), source_excerpt=text(item.get("jobExcerpt")),
                **salary_details(
                    item.get("salaryMin", item.get("annualSalaryMin")), item.get("salaryMax", item.get("annualSalaryMax")),
                    item.get("salaryCurrency"), "annual" if legacy_salary else item.get("salaryPeriod"),
                ), now=now,
            )


def fetch_himalayas(client, max_pages, now):
    for data in cursor_pages(client, "https://himalayas.app/jobs/api", {"limit": 20}, max_pages):
        for item in records(data, "jobs"):
            locations = strings(item.get("locationRestrictions"))
            offsets = item.get("timezoneRestrictions")
            offsets = list(dict.fromkeys(str(x) for x in offsets if isinstance(x, (str, int, float)) and not isinstance(x, bool))) if isinstance(offsets, list) else []
            guid = item.get("guid", "")
            # guid is the canonical Himalayas listing, applicationLink is the required Apply URL.
            yield normalize_job(
                "Himalayas", title=item.get("title"), company=item.get("companyName"), url=guid,
                description=item.get("description"), posted_at="", updated_at=item.get("pubDate"),
                valid_through=item.get("expiryDate"), source_id=guid,
                location=", ".join(locations) if locations else "No country restriction · check time zones",
                applicant_countries=applicant_countries(locations), timezone_restrictions=offsets,
                apply_url=item.get("applicationLink"), company_logo=item.get("companyLogo"),
                employment_type=item.get("employmentType"),
                categories=strings(item.get("categories")) + strings(item.get("parentCategories")),
                source_excerpt=text(item.get("excerpt")), allow_syndication=False,
                **salary_details(item.get("minSalary"), item.get("maxSalary"), item.get("currency"), item.get("salaryPeriod") or "annual"),
                now=now,
            )


def fetch_arbeitnow(client, max_pages, now, uk=False):
    endpoint = f"https://www.arbeitnow.{'co.uk' if uk else 'com'}/api/job-board-api"
    for page in range(1, max_pages + 1):
        data = client.json(endpoint, params={"page": page})
        for item in records(data, "data"):
            yield normalize_job(
                "Arbeitnow UK" if uk else "Arbeitnow", title=item.get("title"), company=item.get("company_name"),
                url=item.get("url"), description=item.get("description"), posted_at=item.get("created_at"),
                source_id=text(item.get("slug")), location=item.get("location"), tags=item.get("tags"),
                employment_type=item.get("job_types"), remote=item.get("remote") is True,
                salary=text(item.get("salary")), now=now,
            )
        links = data.get("links")
        if not isinstance(links, dict):
            raise ValueError("Arbeitnow response omitted pagination links")
        following = links.get("next")
        if not following:
            return
        # Do not request arbitrary URLs from a remote response. Build our own numbered pages.
        if not isinstance(following, str) or urlsplit(following).netloc != urlsplit(endpoint).netloc:
            raise ValueError("Unexpected Arbeitnow pagination host")
        if not data.get("data"):
            raise ValueError("Empty Arbeitnow page advertises a next page")
    raise PaginationLimit(f"Stopped at {max_pages} pages; raise --max-pages for more coverage")


def fetch_arbeitnow_uk(client, max_pages, now):
    yield from fetch_arbeitnow(client, max_pages, now, uk=True)


SOURCES = {
    "WeWorkRemotely": fetch_weworkremotely, "Remotive": fetch_remotive,
    "RemoteOK": fetch_remoteok, "WorkingNomads": fetch_workingnomads,
    "Jobicy": fetch_jobicy, "Himalayas": fetch_himalayas,
    "Arbeitnow": fetch_arbeitnow, "Arbeitnow UK": fetch_arbeitnow_uk,
}


def scrape_all_jobs(sources=None, max_pages=DEFAULT_MAX_PAGES, report=None, client=None, now=None):
    now = now or datetime.now(timezone.utc)
    selected = list(SOURCES) if sources is None else sources
    if not 1 <= max_pages <= 50:
        raise ValueError("max_pages must be between 1 and 50")
    if not selected or any(name not in SOURCES for name in selected):
        raise ValueError("Choose at least one known source")
    report = report if report is not None else {}
    jobs = []
    with nullcontext(client) if client is not None else FeedClient() as http:
        for name in dict.fromkeys(selected):
            result = {"status": "ok", "received": 0, "accepted": 0, "skipped": 0}
            start_requests = http.requests
            try:
                for job in SOURCES[name](http, max_pages, now):
                    result["received"] += 1
                    if (not valid_job(job) or job.get("remote") is not True or
                            not is_developer_role(job["title"], job.get("tags", []) + job.get("categories", []))):
                        result["skipped"] += 1
                        continue
                    if name == "Himalayas" and not job.get("apply_url"):
                        result["skipped"] += 1
                        continue
                    result["accepted"] += 1
                    jobs.append(job)
                if not result["accepted"]:
                    result["status"] = "empty"
            except PaginationLimit as exc:
                result.update(status="capped", error=str(exc))
            except Exception as exc:
                result.update(status="partial" if result["accepted"] else "error", error=f"{type(exc).__name__}: {exc}")
                logger.exception("Source failed: %s", name)
            result["requests"] = http.requests - start_requests
            report[name] = result
            logger.info("%s: %s", name, result)
    return jobs
