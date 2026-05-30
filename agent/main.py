import logging
import argparse
import sys
import json
import os
import re
from typing import List, Dict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from agent.scraper import scrape_all_jobs

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("DevJobsHub")

JOBS_FILE = "src/lib/jobs.json"

def load_existing_jobs() -> List[Dict]:
    """Loads existing jobs from jobs.json if it exists."""
    if os.path.exists(JOBS_FILE):
        try:
            with open(JOBS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading {JOBS_FILE}: {e}")
            return []
    return []

def save_jobs(jobs: List[Dict]):
    """Saves the jobs list to jobs.json."""
    try:
        with open(JOBS_FILE, "w", encoding="utf-8") as f:
            json.dump(jobs, f, indent=2, ensure_ascii=False)
        logger.info(f"Successfully saved {len(jobs)} jobs to {JOBS_FILE}")
    except Exception as e:
        logger.error(f"Error saving {JOBS_FILE}: {e}")

def format_job_locally(text: str) -> Dict:
    """Bullet-first local parser that aggressively extracts clean roles."""
    # 1. Block-to-Newline Conversion
    # Ensure every block element and break becomes a clear newline
    for tag in ['</li>', '</p>', '<br>', '<br/>', '</div>', '</h1>', '</h2>', '<h3>', '<h4>', '</ul>', '</div>']:
        text = text.replace(tag, '\n')
    
    # Strip HTML and normalize
    clean = re.sub(r'<[^>]*>', '', text)
    clean = clean.replace('\r', '\n')
    
    # 2. Extract logical lines and deduplicate
    lines = []
    seen = set()
    for l in clean.split('\n'):
        line = l.strip()
        if len(line) > 10 and line.lower() not in seen:
            lines.append(line)
            seen.add(line.lower())

    # 3. Categorize into buckets
    summary = []
    responsibilities = []
    requirements = []
    
    # Section keywords (headers to skip)
    R_HEADERS = {"responsibilities", "what you'll do", "what you will do", "the role", "tasks", "core responsibilities"}
    Q_HEADERS = {"requirements", "what you need", "qualifications", "who you are", "must have", "skills", "technical dna"}
    
    current_bucket = "summary"
    
    for line in lines:
        low = line.lower()
        
        # Detect Section boundaries (and skip the header line itself)
        is_resp = any(h in low for h in R_HEADERS) and len(line) < 40
        is_req = any(h in low for h in Q_HEADERS) and len(line) < 40
        
        if is_resp:
            current_bucket = "responsibilities"
            continue
        if is_req:
            current_bucket = "requirements"
            continue
            
        # Clean bullet noise
        clean_line = re.sub(r'^[•\-\*■»]\s*', '', line).strip()
        
        if current_bucket == "summary" and len(summary) < 3:
            summary.append(clean_line)
        elif current_bucket == "responsibilities" and len(responsibilities) < 12:
            responsibilities.append(clean_line)
        elif current_bucket == "requirements" and len(requirements) < 12:
            requirements.append(clean_line)

    # 4. Smart Fallback for flat descriptions
    if not responsibilities and not requirements:
        all_bits = [l for l in lines if len(l) > 35]
        summary = all_bits[:2]
        responsibilities = all_bits[2:8]
        requirements = all_bits[8:14]

    return {
        "summary": " ".join(summary[:2]) if summary else "Remote engineering role available.",
        "responsibilities": responsibilities[:8],
        "requirements": requirements[:8],
        "highlights": [l[:80] + "..." for l in (responsibilities + requirements)[:3]],
        "tags": ["Remote", "Software"],
        "is_ai_processed": False
    }

from datetime import datetime, timezone, timedelta

def is_recent(date_str: str, max_days: int = 30) -> bool:
    """Checks if a job's date string is within the allowed freshness window.
    Supports ISO and common RSS formats."""
    from agent.scraper import parse_relative_date
    try:
        # First, normalize the date string
        iso_date = parse_relative_date(date_str)
        job_date = datetime.fromisoformat(iso_date)
        
        if job_date.tzinfo is None:
            job_date = job_date.replace(tzinfo=timezone.utc)
        
        now = datetime.now(timezone.utc)
        diff = now - job_date
        return diff.days <= max_days
    except Exception as e:
        logger.error(f"Error checking freshness for {date_str}: {e}")
        return True # Default to keep if parsing fails

def process_all_jobs(clean_all: bool = False, test_mode: bool = False):
    """Main workflow to scrape, format, and purge old jobs."""
    logger.info(f"Starting DevJobsHub Freshness Cycle... {'(TEST MODE)' if test_mode else ''} {'(FORCE CLEAN ALL)' if clean_all else ''}")
    
    # 1. Scrape new jobs
    new_jobs = scrape_all_jobs()
    
    # 2. Load and Purge existing jobs
    existing_jobs = load_existing_jobs()
    active_jobs = [j for j in existing_jobs if is_recent(j.get("posted_at", ""))]
    logger.info(f"Purged {len(existing_jobs) - len(active_jobs)} stale jobs from database.")
    
    job_map = {job["url"]: job for job in active_jobs if "url" in job}
    
    from agent.scraper import parse_relative_date
    
    # 3. Update database with new scraped data
    for job in new_jobs:
        url = job["url"]
        if url in job_map:
            # Update existing with fresh data (keeping already processed ai_data)
            job_map[url].update(job)
        else:
            job_map[url] = job
            
    # 4. Format & Sanitize
    processed_count = 0
    target_all = list(job_map.values())
    
    for job in target_all:
        url = job["url"]
        
        # Always normalize the date for consistency in database
        job["posted_at"] = parse_relative_date(job.get("posted_at", ""))
        
        # Only keep if recent
        if not is_recent(job["posted_at"]):
            del job_map[url]
            continue

        # Format if new OR missing formatted data OR force cleaning
        if "ai_data" not in job or clean_all:
            if clean_all or "ai_data" not in job:
                logger.info(f"Formatting: {job.get('title')}...")
                job["ai_data"] = format_job_locally(job.get("description", ""))
                job["ai_processed"] = False
                processed_count += 1
            
    merged_jobs = list(job_map.values())
    merged_jobs.sort(key=lambda x: x.get("posted_at", ""), reverse=True)
            
    logger.info(f"Processing complete. {len(merged_jobs)} active jobs in discovery feed.")
    
    # 4. Save
    if not test_mode:
        save_jobs(merged_jobs)
    else:
        logger.info("[TEST MODE] Skipping database save.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DevJobsHub Aggregator")
    parser.add_argument("--clean-all", action="store_true", help="Re-format entire database locally")
    parser.add_argument("--test", action="store_true", help="Run without saving to database")
    args = parser.parse_args()

    process_all_jobs(clean_all=args.clean_all, test_mode=args.test)
