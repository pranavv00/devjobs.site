"""Public feed configuration; no paid endpoints or credentials are used."""
WEWORKREMOTELY_URLS = (
    "https://weworkremotely.com/categories/remote-programming-jobs.rss",
    "https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss",
)
USER_AGENT = "DevJobs/2.0 (+https://www.devjobs.site/about)"
DEFAULT_MAX_PAGES = 10
REQUEST_INTERVAL_SECONDS = 1.1
MAX_RESPONSE_BYTES = 20 * 1024 * 1024
MAX_DESCRIPTION_CHARACTERS = 60000
MAX_RETRIES = 2
