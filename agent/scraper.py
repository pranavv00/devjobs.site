import logging
import httpx
import re
import time
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta
from typing import List, Dict

from agent.config import WEWORKREMOTELY_URL, USER_AGENT

logger = logging.getLogger(__name__)

def parse_relative_date(text: str) -> str:
    """Robust parser that converts strings like '2 days ago', '1 week ago',
    or RSS dates into standard ISO timestamps. Returns current time if unparseable."""
    if not text:
        return datetime.now(timezone.utc).isoformat()
    
    now = datetime.now(timezone.utc)
    text = text.lower().strip()

    # Match relative patterns
    match = re.search(r'(\d+)\s*(day|week|month|hour|minute)s?\s*ago', text)
    if match:
        val = int(match.group(1))
        unit = match.group(2)
        if unit == "day":
            delta = timedelta(days=val)
        elif unit == "week":
            delta = timedelta(weeks=val)
        elif unit == "month":
            delta = timedelta(days=val * 30)
        elif unit == "hour":
            delta = timedelta(hours=val)
        elif unit == "minute":
            delta = timedelta(minutes=val)
        else:
            delta = timedelta(0)
        return (now - delta).isoformat()
    
    # Handle "Today" or "Yesterday"
    if "today" in text:
        return now.isoformat()
    if "yesterday" in text:
        return (now - timedelta(days=1)).isoformat()
    
    # Handle standard RSS/HTTP formats (e.g., Wed, 25 Mar 2026 20:21:42 +0000)
    # Using multiple common formats
    formats = [
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S %Z",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%d %H:%M:%S",
        "%b %d, %Y"
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(text, fmt) if "%z" not in fmt and "%Z" not in fmt else datetime.strptime(text, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.isoformat()
        except:
            continue

    return now.isoformat()

def clean_html(html_content: str) -> str:
    """Cleans HTML while preserving safe formatting tags for a premium UI."""
    if not html_content:
        return ""
    
    soup = BeautifulSoup(html_content, "html.parser")
    if not bool(soup.find()):
        paragraphs = html_content.split('\n\n')
        html_content = "".join("<p>{}</p>".format(p.strip().replace('\n', '<br/>')) for p in paragraphs if p.strip())
        soup = BeautifulSoup(html_content, "html.parser")

    for element in soup(["script", "style", "iframe", "embed", "object", "form"]):
        element.decompose()

    allowed_tags = ["p", "br", "ul", "ol", "li", "strong", "b", "em", "i", "u", "h1", "h2", "h3", "h4"]
    for tag in soup.find_all(True):
        if tag.name not in allowed_tags:
            tag.unwrap()
        else:
            tag.attrs = {}

    clean_html = str(soup)
    clean_html = re.sub(r'\n\s*\n', '\n', clean_html)
    limit = 15000
    if len(clean_html) > limit:
        clean_html = clean_html[:limit] + "... [Description truncated]"
    return clean_html

def extract_salary_heuristic(text: str) -> str:
    """Heuristic regex to find salary patterns in raw text."""
    if not text:
        return ""
    # Clean tags for searching
    clean = re.sub(r'<[^>]*>', ' ', text)
    
    # Range pattern: $100,000 - $150,000 or 80k - 120k
    # Handles $, €, £
    patterns = [
        r'([$€£]\d{2,3}(?:,\d{3})*(?:\s*-\s*[$€£]\d{2,3}(?:,\d{3})*))',
        r'([$€£]\d{1,3}k(?:\s*-\s*[$€£]\d{1,3}k))',
        r'([$€£]\d{2,3}(?:,\d{3})*)',
        r'(\d{2,3}(?:,\d{3})*\s*[$€£])'
    ]
    
    for p in patterns:
        match = re.search(p, clean, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return ""

def fetch_weworkremotely() -> List[Dict]:
    """Scrapes WeWorkRemotely RSS feed to get all latest remote jobs."""
    jobs = []
    try:
        headers = {"User-Agent": USER_AGENT}
        response = httpx.get(WEWORKREMOTELY_URL, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "xml")
        items = soup.find_all("item")
        
        for item in items:
            title = item.find("title").text if item.find("title") else ""
            url = item.find("link").text if item.find("link") else ""
            description_html = item.find("description").text if item.find("description") else ""
            pub_date = item.find("pubDate").text if item.find("pubDate") else ""
            
            company = "Unknown"
            job_title = title
            if ": " in title:
                parts = title.split(": ", 1)
                company = parts[0]
                job_title = parts[1]
                
            jobs.append({
                "title": job_title,
                "company": company,
                "description": clean_html(description_html),
                "url": url,
                "source": "WeWorkRemotely",
                "posted_at": parse_relative_date(pub_date),
                "salary": extract_salary_heuristic(description_html)
            })
    except Exception as e:
        logger.error(f"Error fetching WWR: {e}")
    return jobs

def fetch_remotive() -> List[Dict]:
    """Scrapes Remotive.com API for all software dev roles."""
    jobs = []
    try:
        headers = {"User-Agent": USER_AGENT}
        response = httpx.get("https://remotive.com/api/remote-jobs?category=software-dev", headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        for item in data.get("jobs", []): 
            jobs.append({
                "title": item.get("title", ""),
                "company": item.get("company_name", ""),
                "description": clean_html(item.get("description", "")),
                "url": item.get("url", ""),
                "source": "Remotive",
                "posted_at": parse_relative_date(item.get("publication_date", "")),
                "salary": item.get("salary", "")
            })
    except Exception as e:
        logger.error(f"Error fetching Remotive: {e}")
    return jobs

def fetch_remoteok() -> List[Dict]:
    """Scrapes RemoteOK API for all latest development jobs."""
    jobs = []
    try:
        headers = {"User-Agent": USER_AGENT}
        response = httpx.get("https://remoteok.com/api", headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        # RemoteOK returns legal terms in first item, skip it
        for item in data[1:]: 
            # Filter for dev jobs if tags are present
            tags = item.get("tags", [])
            is_dev = any(tag in ["dev", "software engineer", "frontend", "backend", "full stack"] for tag in tags)
            
            if is_dev:
                # Build structured salary for RemoteOK
                salary_str = ""
                s_min = item.get("salary_min", 0)
                s_max = item.get("salary_max", 0)
                if s_min > 0 and s_max > 0:
                    salary_str = f"${s_min:,} - ${s_max:,}"
                elif s_min > 0:
                    salary_str = f"${s_min:,}"

                jobs.append({
                    "title": item.get("position", ""),
                    "company": item.get("company", ""),
                    "description": clean_html(item.get("description", "")),
                    "url": item.get("url", ""),
                    "source": "RemoteOK",
                    "posted_at": parse_relative_date(item.get("date", "")),
                    "salary": salary_str
                })
    except Exception as e:
        logger.error(f"Error fetching RemoteOK: {e}")
    return jobs

def fetch_workingnomads() -> List[Dict]:
    """Scrapes Working Nomads development RSS feed."""
    jobs = []
    try:
        headers = {"User-Agent": USER_AGENT}
        response = httpx.get("https://www.workingnomads.com/jobs/feed/development", headers=headers, timeout=15, follow_redirects=True)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "xml")
        items = soup.find_all("item")
        
        for item in items:
            title = item.find("title").text if item.find("title") else ""
            url = item.find("link").text if item.find("link") else ""
            desc_html = item.find("description").text if item.find("description") else ""
            pub_date = item.find("pubDate").text if item.find("pubDate") else ""
            
            jobs.append({
                "title": title,
                "company": "Working Nomads Listing",
                "description": clean_html(desc_html),
                "url": url,
                "source": "WorkingNomads",
                "posted_at": parse_relative_date(pub_date),
                "salary": extract_salary_heuristic(desc_html)
            })
    except Exception as e:
        logger.error(f"Error fetching WorkingNomads: {e}")
    return jobs

def fetch_jobright() -> List[Dict]:
    """Scrapes JobRight.ai targeted feed."""
    jobs = []
    try:
        url = "https://jobright.ai/remote-jobs/software-engineering/frontend-software-engineer?seniority=2"
        headers = {"User-Agent": USER_AGENT}
        response = httpx.get(url, headers=headers, timeout=20)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        
        for a_tag in soup.find_all("a", href=True):
            if "/job/" in a_tag['href'] or "/jobs/" in a_tag['href']:
                title_text = a_tag.get_text(separator=" ").strip()
                if 5 < len(title_text) < 100:
                    parent = a_tag.parent.parent if a_tag.parent else None
                    desc = parent.get_text(separator="\n").strip() if parent else title_text
                    link = "https://jobright.ai" + a_tag['href'] if a_tag['href'].startswith("/") else a_tag['href']
                    
                    jobs.append({
                        "title": title_text.split("\n")[0][:80],
                        "company": "Jobright Aggregator",
                        "description": clean_html(desc),
                        "url": link,
                        "source": "JobRight",
                        "posted_at": parse_relative_date("") # Usually brand new
                    })
    except Exception as e:
        logger.error(f"Error fetching Jobright: {e}")
        
    unique_jobs = {j["url"]: j for j in jobs}.values()
    return list(unique_jobs)

def scrape_all_jobs() -> List[Dict]:
    """Main entrypoint to aggregate jobs from all sources."""
    logger.info("Starting job scraping with normalized date parsing...")
    all_jobs = []
    
    batches = [
        ("WeWorkRemotely", fetch_weworkremotely),
        ("Remotive", fetch_remotive),
        ("RemoteOK", fetch_remoteok),
        ("WorkingNomads", fetch_workingnomads),
        ("JobRight", fetch_jobright)
    ]
    
    for name, fetch_func in batches:
        try:
            batch = fetch_func()
            logger.info(f"Fetched {len(batch)} from {name}")
            all_jobs.extend(batch)
        except Exception as e:
            logger.error(f"Critical failure fetching from {name}: {e}")
    
    logger.info(f"TOTAL JOBS SCRAPED: {len(all_jobs)}")
    return all_jobs
