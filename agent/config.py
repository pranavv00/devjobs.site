import os
from dotenv import load_dotenv

load_dotenv()

# 🚀 DevJobsHub (pranavv00/devjobs.site) Configuration

# List of RSS feeds / aggregator APIs to check
WEWORKREMOTELY_URL = "https://weworkremotely.com/remote-jobs.rss"

# Scraper Settings
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Frontend Integration (User's live data)
GITHUB_RAW_JOBS_URL = "https://raw.githubusercontent.com/pranavv00/devjobs.site/main/jobs.json"
