# Job ingestion

The scraper now has eight source configurations across seven job boards. It uses public RSS/JSON endpoints without paid APIs, logins, browser automation, or individual-page crawling. Every listing retains its original source URL and attribution.

## Sources

| Source           | Endpoint                                                                                    | Coverage and details                                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| We Work Remotely | `/categories/remote-programming-jobs.rss` and `/categories/remote-devops-sysadmin-jobs.rss` | Dedicated technical feeds; employer from the feed title, full RSS content, categories, and explicit location/type fields when supplied.                                                      |
| Remotive         | `https://remotive.com/api/remote-jobs`                                                      | All categories fetched once, then technical roles selected locally; source tags, employer logo, salary text, employment type, candidate locations.                                           |
| Remote OK        | `https://remoteok.com/api`                                                                  | Broader developer/DevOps/data/QA recognition; source tags, salary bounds, location, logos. Currency and pay period remain unknown unless supplied.                                           |
| Working Nomads   | `https://www.workingnomads.com/api/exposed_jobs/`                                           | JSON replaces the limited RSS adapter; actual company names, complete descriptions, tags, categories, locations, source dates.                                                               |
| Jobicy           | `https://jobicy.com/api/jobs`                                                               | Cursor pagination; seniority, salary bounds/currency/period, employer logos, employment type, country/region eligibility. Supports older annual salary fields as well as current fields.     |
| Himalayas        | `https://himalayas.app/jobs/api`                                                            | Cursor pagination; country/time-zone restrictions, salary, employment type, expiry, and the supplied application link. `pubDate` is an update timestamp, stored separately from publication. |
| Arbeitnow        | `https://www.arbeitnow.com/api/job-board-api`                                               | Numbered pagination; includes only jobs explicitly marked remote and matching technical roles. Stores source tags, employer, employment type, and location.                                  |
| Arbeitnow UK     | `https://www.arbeitnow.co.uk/api/job-board-api`                                             | Same adapter and eligibility checks for the UK feed.                                                                                                                                         |

Relevant upstream references: [WWR RSS](https://weworkremotely.com/remote-job-rss-feed), [Remotive API](https://github.com/remotive-com/remote-jobs-api), [Remote OK feeds](https://remoteok.com/faq), [Jobicy API](https://jobicy.com/jobs-rss-feed), [Himalayas API](https://himalayas.app/api), and [Arbeitnow API](https://www.arbeitnow.com/blog/job-board-api). Response formats and availability can change independently of this repository.

## Commands

Install the existing dependencies from `agent/requirements.txt`, then run from the repository root:

```sh
python -m agent.main --list-sources
python -m agent.main --test --report /tmp/devjobs-scrape-report.json
python -m agent.main --test --source Jobicy --source Himalayas --max-pages 20
python -m agent.main --source 'Arbeitnow UK' --test
python -m agent.main --report scrape-report.json
```

`--test` performs real HTTP requests and normalization but does not replace `src/lib/jobs.json`. `--source` is repeatable. The default is all sources. `--max-pages` defaults to 10 per paginated source and accepts 1–50; it is a request budget, not a promise of exhaustive coverage. The report marks a source `capped` when another page exists beyond that budget. Increase it deliberately after inspecting coverage and upstream rate limits. Each run starts a fresh traversal; there is no persistent cursor checkpoint.

Jobicy discovery currently covers a seven-day upstream window. Himalayas returns at most 20 records per browse page. Arbeitnow includes nontechnical and nonremote jobs, so the number retained can be much smaller than the number retrieved. An empty technical subset does not mean the source is broken.

## Data quality

- Full descriptions retain safe formatting, with a 60,000-character text cap. Script/embed/form/SVG content and HTML attributes are removed. Double-encoded HTML is handled before sanitization.
- `sections` captures requirements, responsibilities, and benefits only under recognized explicit headings. The complete description remains available; the parser does not guess visa policy, education, or years of experience.
- `salary_min`, `salary_max`, `salary_currency`, and `salary_period` come from dedicated API fields. Unknown currency/period is labeled, not inferred from dollar signs or equipment allowances. No conversion or annualization is performed.
- Location text remains as supplied. `applicant_countries` requires an unambiguous list of recognized countries/codes. Employer headquarters and city names are not treated as candidate eligibility.
- `posted_at` is a publication date; `updated_at` is used separately when that is all the source supplies. Himalayas update dates are labeled in the UI and are never emitted as `datePosted` in JobPosting markup.
- `first_seen_at` and `last_seen_at` track ingestion. Appearance in a feed is not independent verification that an employer is still accepting applications. A source expiry is not necessarily an employer's application deadline.
- Canonical URL keys ignore common tracking parameters, and source IDs deduplicate changing URLs. The original source/application links are preserved. Identical company/title text from different boards is not enough evidence to merge two openings.
- Discovery retains records with a known publication/update date within 30 days and excludes passed source expiry dates. Absence from a limited feed is not treated as proof of closure. Known dates/descriptions survive incomplete refreshes; source metadata that is explicitly refreshed can clear a field.

## Requests and failures

Requests reuse connections, wait at least 1.1 seconds between requests to the same host, use timeouts, limit decompressed responses to 20 MiB, and retry transient network/429/5xx failures at most twice. `Retry-After` is respected; waits above 30 seconds defer the source to the next run instead of retrying early. Pagination only calls fixed source endpoints and detects repeated cursor tokens.

Each source runs independently. Successfully parsed pages survive a later failure. The previous snapshot remains intact when all sources fail or no valid recent incoming records exist. Valid recent existing jobs survive individual source failures. Snapshot writes remain atomic.

The JSON report includes per-source status, request/record counts, errors, deduplicated recent incoming count, resulting snapshot size, and field coverage. Statuses are `ok`, `empty`, `capped`, `partial`, or `error`. The scheduled workflow keeps this report as a 14-day artifact, including on a failed run. `ok` means the response parsed, not that every listing has been verified or every optional field exists.

## Application integration

Rich metadata stays in server/build data; listing pages still send compact summaries. Job pages show source-provided employment/seniority, time-zone restrictions, last-seen dates, and listing expiry when available. Source tags participate in search. Application buttons preserve Himalayas' supplied application URL; source attribution links remain separately visible. Company logo URLs are captured but are not automatically loaded from third parties.

Remotive and Himalayas require restrictions on onward distribution. Their listings remain available in on-site discovery but are excluded from the public `/api/jobs`, RSS feed, and JobPosting markup. This also applies to legacy records whose snapshot does not have an explicit policy flag. Structured salary markup is emitted only for eligible sources with complete, validated currency/period/bounds. No signup gate is added.

A successful scrape changes the bundled snapshot. Rebuild the frontend to publish the new data. This change does not itself deploy a site or populate new listings without a successful network run.

## Verification

```sh
python -m unittest discover -s agent/tests -v
npm run check
npm run build
npm run verify:build
```

Source tests use synthetic contract fixtures and `httpx.MockTransport`: all adapters, malformed records, partial failures, cursor/numbered pagination, request caps, retries, gzip, salary units, eligibility, expiry, HTML safety, and merge behavior run without network access. These tests do not replace live upstream checks.

During implementation, official source documentation and example responses were inspected via web browsing. Direct Python requests in this workspace failed DNS resolution, so an end-to-end live scrape and new-listing counts could not be verified. The checked-in job snapshot was not replaced with fixtures or unverified data.
