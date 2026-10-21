"""Fetch and atomically update the single job snapshot used by both frontends."""
import argparse
import json
import logging
import os
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from agent.normalize import canonical_key, clean_html, parse_relative_date, source_identifier, text, valid_job
from agent.scraper import SOURCES, scrape_all_jobs
from agent.config import DEFAULT_MAX_PAGES

logger = logging.getLogger(__name__)
JOBS_FILE = Path(__file__).resolve().parents[1] / "src/lib/jobs.json"


def load_existing_jobs():
    if not JOBS_FILE.exists():
        return []
    # A corrupt snapshot must fail loudly; never overwrite it with a partial run.
    with JOBS_FILE.open(encoding="utf-8") as file:
        jobs = json.load(file)
    if not isinstance(jobs, list):
        raise ValueError("The existing snapshot must contain a JSON array")
    return jobs


def save_jobs(jobs):
    """Replace only after the entire JSON file is written and flushed."""
    JOBS_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=JOBS_FILE.parent, suffix=".tmp", delete=False) as file:
            temporary = Path(file.name)
            json.dump(jobs, file, indent=2, ensure_ascii=False)
            file.write("\n")
            file.flush()
            os.fsync(file.fileno())
        os.replace(temporary, JOBS_FILE)
    finally:
        if temporary and temporary.exists():
            temporary.unlink()
    logger.info("Saved %s jobs to %s", len(jobs), JOBS_FILE)


def is_recent(date_str, max_days=30, now=None):
    now = now or datetime.now(timezone.utc)
    parsed = parse_relative_date(date_str, now=now)
    if not parsed:
        return False
    age = now - datetime.fromisoformat(parsed)
    return timedelta(0) <= age <= timedelta(days=max_days)


def merge_jobs(existing, incoming, now=None):
    now = now or datetime.now(timezone.utc)
    jobs = {}
    source_ids = {}
    for job in [*existing, *incoming]:
        if not valid_job(job):
            continue
        key = canonical_key(job["url"])
        identity = (text(job.get("source")), source_identifier(job.get("source_id")))
        previous_key = source_ids.get(identity, key) if identity[1] else key
        previous = jobs.pop(previous_key, {})
        posted_at = parse_relative_date(job.get("posted_at", ""), now=now)
        # Preserve a known date when a source omits it during a later refresh.
        if not posted_at:
            posted_at = previous.get("posted_at", "")
        updated_at = parse_relative_date(job.get("updated_at", ""), now=now) or previous.get("updated_at", "")
        if not is_recent(posted_at or updated_at, now=now):
            continue
        expires = parse_relative_date(job.get("valid_through") or previous.get("valid_through"), now=now, allow_future=True)
        if expires and datetime.fromisoformat(expires) <= now:
            continue
        normalized = {**previous, **job, "posted_at": posted_at}
        if previous and previous_key == key:
            normalized["url"] = previous["url"]  # Keep URL-derived saved-job IDs stable.
        if updated_at:
            normalized["updated_at"] = updated_at
        if expires:
            normalized["valid_through"] = expires
        if job.get("last_seen_at"):
            normalized["first_seen_at"] = previous.get("first_seen_at") or job.get("first_seen_at") or job["last_seen_at"]
        normalized["description"] = clean_html(str(job.get("description") or previous.get("description") or ""))
        # Remove obsolete pseudo-AI data. The frontend derives tags deterministically.
        normalized.pop("ai_data", None)
        normalized.pop("ai_processed", None)
        jobs[key] = normalized
        if identity[1]:
            source_ids[identity] = key
    return sorted(jobs.values(), key=lambda job: job.get("posted_at") or job.get("updated_at", ""), reverse=True)


def process_all_jobs(test_mode=False, sources=None, max_pages=DEFAULT_MAX_PAGES, report_path=None):
    existing = load_existing_jobs()
    source_report = {}
    incoming = scrape_all_jobs(sources=sources, max_pages=max_pages, report=source_report)
    merged = merge_jobs(existing, incoming)
    recent_incoming = merge_jobs([], incoming)
    report = {
        "finished_at": datetime.now(timezone.utc).isoformat(), "dry_run": test_mode,
        "sources": source_report, "incoming": len(incoming), "recent_incoming": len(recent_incoming),
        "snapshot_jobs": len(merged),
        "coverage": {field: sum(bool(job.get(field)) for job in recent_incoming) for field in (
            "description", "location", "applicant_countries", "salary", "salary_currency", "salary_period",
            "employment_type", "tags", "company_logo", "valid_through", "sections",
        )},
    }
    if report_path:
        path = Path(report_path)
        if path.resolve() == JOBS_FILE.resolve():
            raise ValueError("The report must not overwrite the job snapshot")
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    if not incoming:
        raise RuntimeError("No source returned jobs; preserving the existing snapshot")
    if not merged or not recent_incoming:
        raise RuntimeError("No valid recent jobs were produced; preserving the existing snapshot")
    logger.info("Prepared %s recent jobs (%s incoming records)", len(merged), len(incoming))
    if not test_mode:
        save_jobs(merged)
    return merged


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    parser = argparse.ArgumentParser(description="DevJobs feed aggregator")
    parser.add_argument("--test", action="store_true", help="Fetch and validate without changing the snapshot")
    parser.add_argument("--source", action="append", choices=list(SOURCES), help="Run selected source(s); repeat to combine")
    parser.add_argument("--max-pages", type=int, choices=range(1, 51), default=DEFAULT_MAX_PAGES, metavar="1-50", help="Page budget per paginated source (default: 10)")
    parser.add_argument("--report", type=Path, help="Write a JSON source-health and data-coverage report")
    parser.add_argument("--list-sources", action="store_true", help="Print configured sources and exit")
    args = parser.parse_args()
    if args.list_sources:
        print("\n".join(SOURCES))
    else:
        process_all_jobs(test_mode=args.test, sources=args.source, max_pages=args.max_pages, report_path=args.report)
