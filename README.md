# DevJobs

A remote job directory and browser-based application tracker. The primary app uses Next.js; an optional Astro static frontend uses the same components, business logic, stylesheet, assets, and job snapshot.

## Run locally

Use Node.js 22.12 or newer (Node 22 LTS is used in CI).

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No API keys or database credentials are needed. Job data comes from the checked-in snapshot, not a live request from the browser.

```sh
npm run check       # ESLint, strict TypeScript, regression tests
npm run build
npm run start
```

For browser tests, install Playwright’s browser once:

```sh
npx playwright install chromium
npm run test:browser
```

An existing browser executable can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE`, either in the environment or an ignored `.env.test.local`. CI uses Playwright’s bundled browser. Browser tests cover search/history, combined filters, saves, cross-tab updates, statuses, CSV export, storage failures, mobile flows, accessibility, and metadata endpoints.

## Architecture

- `src/app/`: Next.js routes, metadata, API, error boundaries, RSS, and sitemap.
- `src/shared/`: framework-neutral React components, typed job data, filtering, storage, and SEO helpers. Import `data.ts` only from server/build code; never from client components.
- `src/app/globals.css`: shared responsive design, focus styles, and accessibility preferences.
- `src/lib/jobs.json`: the single source snapshot. Full descriptions remain on detail pages; browser search uses compact summaries.
- `agent/`: Python ingestion, validation, sanitization, and atomic snapshot writes.
- `astro-app/`: optional static frontend. Run from this monorepo, with the parent source included.
- `tests/`, `agent/tests/`: regression coverage and browser scenarios.

Search matches titles, companies, detected technologies, and short summaries. Skills use word boundaries, so “AI” does not match “email,” and “Java” does not match “JavaScript.” Experience/type classification prefers source fields and falls back to text heuristics. Salary keeps source-supplied currency and pay period; currencies and hourly/annual rates are not guessed or combined.

Saved jobs, statuses, and skills use local storage. Legacy saved records are migrated when read. Reads tolerate invalid JSON, writes report storage failures, and changes synchronize between tabs. The application board has a status dropdown as well as drag handles. CSV exports escape spreadsheet formulas.

## Python scraper

Use Python 3.12 (3.10+ syntax is supported).

```sh
python3 -m venv .venv
. .venv/bin/activate
pip install -r agent/requirements.txt
python -m unittest discover -s agent/tests -v
python -m agent.main --test  # fetch and validate; no write
python -m agent.main         # update src/lib/jobs.json
```

The scraper reads We Work Remotely, Remotive, Remote OK, Working Nomads, Jobicy, Himalayas, Arbeitnow, and Arbeitnow UK. It captures full descriptions, source tags, locations, employment types, salary units, seniority, expiry, and application links where supplied. Requests use pacing, bounded pagination, and transient retries. Source IDs and canonical URL keys deduplicate records; partial failures preserve recent existing data; snapshot writes are atomic. Complete failure or an absence of valid recent incoming records preserves the old snapshot.

Use `--list-sources`, repeatable `--source`, `--max-pages` (default 10), and `--report scrape-report.json` to control and inspect a run. See [the scraper guide](docs/SCRAPER.md) for source endpoints, field semantics, policy restrictions, limitations, and verification. The scheduled workflow retains source-health reports as artifacts.

The scheduled workflow runs at 00:00 and 12:00 UTC. It tests the pipeline and commits successful updates. Verify that these commits trigger your hosting provider’s production builds. Both frontends read a bundled snapshot: rebuilding is required for new scraped jobs. Next.js revalidation updates freshness classification, not the underlying snapshot.

## Astro frontend

From the repository root:

```sh
npm ci
npm ci --prefix astro-app
npm run check --prefix astro-app
npm run build --prefix astro-app
npm run preview --prefix astro-app
```

Astro shares `../src/shared`, `../src/app/globals.css`, and `../public`; do not deploy `astro-app` without its parent source. Its data and expiry state are frozen at build time, so schedule successful rebuilds at least daily. Choose one frontend for the production domain.

## API

`GET /api/jobs?q=React&salary=1&page=1&limit=24` returns:

```json
{ "jobs": [], "total": 0, "page": 1, "limit": 24 }
```

Results use compact summaries; `limit` is capped at 100. Sources that prohibit onward distribution (Remotive and Himalayas) are excluded from this public API and RSS; their listings remain visible on the website. Supported filters are `q`, `experience`, `type`, `days`, `salary`, `source`, and `sort`. This replaces the old unbounded array response; update any external consumers accordingly.

## Search and discovery

The canonical origin is `https://www.devjobs.site`, centralized in `src/shared/seo.ts` (and the Astro hosting configuration). Pages include unique metadata, a real social image, source attribution, clear FAQs, and descriptive internal links. The sitemap excludes personal pages, empty categories, and archived jobs. Job details use stable identifiers; old title slugs and IDs redirect to canonical URLs.

JobPosting structured data is emitted only when source policy permits it and the listing has a known publication date, a description, current eligibility, and explicit applicant countries supplied by the source. Source update dates are labeled separately. Complete source salary bounds/currency/period and employment types are included when available; unknown values, addresses, and deadlines are omitted. Listings without sufficient geographic evidence still have readable detail pages and breadcrumbs. This is intentional: truthful markup is more useful than invented eligibility.

AEO/GEO improvements follow the same foundations as search: useful server-rendered content, clear entities, source provenance, readable answers, and accurate metadata. They do not guarantee rankings or AI citations. See [Google’s AI guidance](https://developers.google.com/search/docs/appearance/ai-features) and [JobPosting requirements](https://developers.google.com/search/docs/appearance/structured-data/job-posting).

## Deployment

The root `vercel.json` selects Next.js. Railway uses `npm run start` and `/` for its health check. Set the deployment’s Node version to 22, run `npm ci` and `npm run build`, and use one canonical production domain. Redirect any alternative domain to `www.devjobs.site` at the hosting layer.

The optional Astro app produces `astro-app/dist`. Its Vercel settings apply basic security headers; the Next.js app configures these headers itself. The CSP blocks objects, framing, and foreign base URLs. It is not a strict nonce-based script CSP.

After deploying, verify external source links, rich results for listings with explicit countries, social cards, mobile interactions, and Search Console sitemap coverage. Confirm that the scheduled scraper is enabled and build failures are monitored. Read [the audit and verification record](docs/PRODUCTION_AUDIT.md) for this checkout’s remaining verification limits.
