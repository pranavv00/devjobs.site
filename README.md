<p align="center">
  <img src="public/favicon.svg" alt="DevJobs logo" width="48" height="48" />
</p>

<h1 align="center">DevJobs</h1>

<p align="center">
  <strong>A fast, privacy-first remote developer job aggregator and application tracker.</strong>
  <br />
  Search 2,800+ roles from 8 established job boards — no sign-up required.
</p>

<p align="center">
  <a href="https://www.devjobs.site">Live Site</a> · <a href="#features">Features</a> · <a href="#getting-started">Getting Started</a> · <a href="#architecture">Architecture</a> · <a href="#api-reference">API</a> · <a href="#deployment">Deployment</a>
</p>

---

## Features

- **Unified search** — Query titles, companies, skills, and technologies across We Work Remotely, Remotive, Remote OK, Working Nomads, Jobicy, Himalayas, Arbeitnow, and Arbeitnow UK.
- **Smart filtering** — Filter by location, experience level, employment type, salary disclosure, source board, posting date, and sort order. All filters are URL-shareable and work without JavaScript.
- **Server-side pagination** — The homepage serves 12 listings at a time; the full directory paginates on the server with bounded payloads (~7 KB vs. ~1.8 MB for the full snapshot).
- **Application tracker** — Save jobs, set statuses (saved → applied → interviewing → offer), drag to reorder, and export your shortlist to CSV. Everything stays in your browser's local storage — no account needed.
- **Skill matching** — Enter your tech stack and get a match percentage for every listing, powered by word-boundary matching that won't confuse "Java" with "JavaScript."
- **Related jobs** — Job detail pages suggest up to 3 related roles based on skill and role-term overlap, with deduplication and recency ranking.
- **SEO-optimized** — Server-rendered pages, `JobPosting` structured data (with geographic eligibility), breadcrumbs, RSS feed, XML sitemap, Open Graph/Twitter cards, and category landing pages.
- **Privacy-first analytics** — Vercel Web Analytics with URL sanitization, Do Not Track support, and opt-in engagement events that never transmit search text, saved skills, or destination URLs.
- **Accessible** — Skip-to-content link, ARIA landmarks and labels, focus-visible styles, reduced-motion support, and automated axe accessibility testing.
- **Dual frontend** — Primary Next.js app with ISR, plus an optional Astro static site sharing the same components, styles, and data.

## Tech Stack

| Layer             | Technology                                                                             |
| ----------------- | -------------------------------------------------------------------------------------- |
| **Framework**     | [Next.js 16](https://nextjs.org) (App Router, React 19, TypeScript 5.9)                |
| **Styling**       | Vanilla CSS with custom properties, responsive design, `prefers-reduced-motion`        |
| **Icons**         | [Lucide React](https://lucide.dev)                                                     |
| **Data pipeline** | Python 3.12 scraper with 8 source adapters, atomic JSON writes                         |
| **Testing**       | Node.js test runner, [Playwright](https://playwright.dev) (browser), Python `unittest` |
| **CI/CD**         | GitHub Actions — quality checks on push/PR, scheduled scraping at 00:00/12:00 UTC      |
| **Analytics**     | [Vercel Web Analytics](https://vercel.com/analytics) (opt-in engagement events)        |
| **Hosting**       | [Vercel](https://vercel.com) (primary), [Railway](https://railway.com) (supported)     |

## Getting Started

### Prerequisites

- **Node.js** ≥ 22.12 (Node 22 LTS)
- **Python** ≥ 3.12 (for the scraper only)
- No API keys, database credentials, or environment variables required

### Installation

```sh
git clone https://github.com/pranavv00/devjobs.site.git
cd devjobs.site
npm ci
```

### Development

```sh
npm run dev          # Start dev server at http://localhost:3000
```

Job data comes from the checked-in snapshot (`src/lib/jobs.json`) — no live API calls from the browser.

### Quality Checks

```sh
npm run check        # ESLint (zero warnings) + TypeScript (strict) + 21 regression tests
npm run build        # Optimized production build
npm run verify:build # Validate 38 HTML pages, sitemap, RSS, metadata, and size budgets
npm run format:check # Prettier formatting verification
```

### Browser Tests

```sh
npx playwright install chromium
npm run test:browser
```

Covers search/history, combined filters, saves, cross-tab sync, statuses, CSV export, storage failures, mobile flows, accessibility (axe), and metadata endpoints.

### Python Scraper Tests

```sh
pip install -r agent/requirements.txt
npm run check:python   # 33 unit tests — all source adapters, pagination, retries, safety
```

## Architecture

```
devjobs.site/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Homepage — hero, search, 12 featured jobs
│   │   ├── jobs/
│   │   │   ├── page.tsx          # Directory — server-filtered, paginated
│   │   │   └── [slug]/page.tsx   # Job detail — ISR, structured data, related jobs
│   │   ├── q/[keyword]/page.tsx  # Category landing pages (React, Python, etc.)
│   │   ├── matches/page.tsx      # Skill matching (client-side)
│   │   ├── saved/page.tsx        # Application tracker board
│   │   ├── api/jobs/route.ts     # Public REST API
│   │   ├── feed.xml/route.ts     # RSS 2.0 feed
│   │   ├── sitemap.ts            # Dynamic XML sitemap
│   │   ├── robots.ts             # robots.txt
│   │   └── components/           # Page-specific client components
│   ├── shared/                   # Framework-neutral React components & logic
│   │   ├── jobs.ts               # Types, filtering, matching, slug generation
│   │   ├── data.ts               # Normalization, validation, job database
│   │   ├── storage.ts            # localStorage with migration & cross-tab sync
│   │   ├── seo.ts                # Structured data, RSS, metadata, categories
│   │   ├── sources.ts            # Source registry & syndication rules
│   │   ├── pagination.ts         # Bounded server pagination
│   │   ├── related-jobs.ts       # Skill/role relevance ranking
│   │   ├── analytics.ts          # Privacy-first event tracking
│   │   └── *.tsx                 # Shared UI components
│   └── lib/
│       └── jobs.json             # Bundled job snapshot (~2,885 listings)
├── agent/                        # Python data pipeline
│   ├── main.py                   # CLI entry point
│   ├── scraper.py                # 8 source adapters with pagination
│   ├── normalize.py              # Validation, sanitization, deduplication
│   ├── config.py                 # Source configuration
│   ├── http.py                   # HTTP client with retries & rate limiting
│   └── tests/                    # 33 contract-based unit tests
├── astro-app/                    # Optional static Astro frontend
├── tests/
│   ├── jobs.test.ts              # 21 data/normalization regression tests
│   ├── seo.test.ts               # Structured data & SEO validation
│   └── browser/app.spec.ts       # Playwright E2E browser tests
├── .github/workflows/
│   ├── main.yml                  # CI: lint, typecheck, test, build, verify
│   └── scrape.yml                # Scheduled: scrape → test → commit → push
├── docs/                         # Audit reports, scraper guide
└── scripts/verify_build.py       # Post-build validation (HTML, sitemap, budgets)
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    8 Job Board APIs                          │
│  WWR · Remotive · RemoteOK · WorkingNomads · Jobicy         │
│  Himalayas · Arbeitnow · Arbeitnow UK                       │
└────────────────────────┬────────────────────────────────────┘
                         │ RSS / JSON (twice daily via GitHub Actions)
                         ▼
              ┌─────────────────────┐
              │   Python Scraper    │
              │  Validate, sanitize │
              │  deduplicate, merge │
              └──────────┬──────────┘
                         │ Atomic write
                         ▼
              ┌─────────────────────┐
              │  src/lib/jobs.json  │
              │   ~2,885 listings   │
              └──────────┬──────────┘
                         │ git commit + push
                         ▼
              ┌─────────────────────┐
              │  Vercel / Railway   │
              │  Production build   │
              │  ISR revalidation   │
              └──────────┬──────────┘
                         │
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
       Homepage       /jobs API     RSS Feed
     (12 listings)   (paginated)   (100 items)
```

### Key Design Decisions

- **No database** — The job snapshot is a committed JSON file. Builds are reproducible, and the scraper's atomic writes guarantee consistency.
- **Server-first rendering** — Filtering, pagination, and search run on the server. The homepage GET form works without JavaScript.
- **Source-truthful data** — Salary, location, and employment type come from source API fields, never guessed. `JobPosting` markup requires verified geographic eligibility.
- **Syndication rules** — Remotive and Himalayas listings are excluded from the public API, RSS, and structured data per their distribution policies. They remain fully browsable on the website.
- **Local-only persistence** — Saved jobs, statuses, and skills use `localStorage` with validation, migration, and cross-tab synchronization. No user data leaves the browser.

## API Reference

### `GET /api/jobs`

Returns paginated, filtered job listings (excludes sources with syndication restrictions).

```
GET /api/jobs?q=React&location=US&salary=1&experience=senior&page=1&limit=24
```

**Parameters:**

| Param        | Description                                      |
| ------------ | ------------------------------------------------ |
| `q`          | Search query (titles, companies, skills)         |
| `location`   | Country/region text filter                       |
| `experience` | `junior`, `mid`, `senior`, `lead`, `intern`      |
| `type`       | `FULL_TIME`, `PART_TIME`, `CONTRACTOR`, `INTERN` |
| `days`       | Max age in days (`7`, `14`, `30`)                |
| `salary`     | `1` to show only jobs with disclosed salary      |
| `source`     | Filter by source board name                      |
| `sort`       | `company` for A–Z; default is newest first       |
| `page`       | Page number (default: 1)                         |
| `limit`      | Results per page (default: 24, max: 100)         |

**Response:**

```json
{
  "jobs": [{ "id": "...", "title": "...", "company": "...", ... }],
  "total": 1234,
  "page": 1,
  "limit": 24
}
```

### RSS Feed

```
GET /feed.xml
```

The 100 most recent syndicatable listings in RSS 2.0 format.

## Python Scraper

The data pipeline aggregates listings from 8 source APIs using public RSS and JSON endpoints — no paid APIs, logins, or browser automation.

```sh
python -m agent.main --test                    # Dry run: fetch & validate, no write
python -m agent.main                           # Update src/lib/jobs.json
python -m agent.main --list-sources            # Show configured sources
python -m agent.main --source Jobicy --test    # Test a single source
python -m agent.main --report scrape-report.json  # Generate health report
```

**Reliability features:**

- Connection reuse with ≥1.1s inter-request pacing per host
- Bounded pagination (default 10 pages, configurable up to 50)
- Transient retry with `Retry-After` support (max 2 retries, 30s cap)
- Response size limit (20 MiB decompressed)
- Per-source isolation — one source failure doesn't affect others
- Atomic snapshot writes — the old file is preserved until the new one is complete
- Complete failure protection — the previous snapshot survives when all sources fail

See [docs/SCRAPER.md](docs/SCRAPER.md) for source endpoints, field semantics, and policy details.

## Search & Discovery

### SEO

- Unique `<title>`, `<meta description>`, and canonical URLs per page
- `JobPosting` structured data for eligible listings with verified country data
- `CollectionPage` + `ItemList` schema on directory and category pages
- `BreadcrumbList` schema on job detail pages
- Dynamic XML sitemap excluding personal, archived, and empty-category pages
- RSS 2.0 feed with proper XML escaping
- Open Graph and Twitter Card metadata with social images
- `noindex` on filtered results, saved jobs, and skill matching pages
- Legacy slug/ID redirects via `permanentRedirect`
- Homepage query parameter redirects (`/?q=React` → `/jobs?q=React`)

### Category Pages

8 pre-rendered technology/role landing pages: React, Python, Frontend, Backend, Node.js, React Native, Data Analyst, and Technical Lead.

## Deployment

### Vercel (Primary)

The root `vercel.json` configures Next.js. Set Node.js to version 22.

```sh
npm ci && npm run build
```

### Railway

Uses `npm run start` with `/` as the health check endpoint. See `railway.json`.

### Environment Variables

| Variable                                  | Required | Description                                                                                                   |
| ----------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_ENABLE_ENGAGEMENT_ANALYTICS` | No       | Set to `true` to enable custom interaction events (requires Vercel plan with custom events). Default: `false` |

### Post-Deployment Checklist

- [ ] Verify external source links resolve correctly
- [ ] Test rich results with [Google's Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Confirm social cards render on Twitter/LinkedIn/Slack
- [ ] Test mobile search and filter interactions
- [ ] Verify XML sitemap in Search Console
- [ ] Confirm the scheduled scraper workflow is enabled
- [ ] Monitor build failures from scraper commits

## Astro Frontend (Optional)

A static alternative frontend sharing the same components, styles, and data:

```sh
npm ci --prefix astro-app
npm run build --prefix astro-app     # Generates astro-app/dist
npm run preview --prefix astro-app
```

> **Note:** The Astro app reads a frozen snapshot at build time. Schedule daily rebuilds to keep listings fresh. Deploy only one frontend per production domain.

## Testing Summary

| Suite                  | Count     | Coverage                                                                                           |
| ---------------------- | --------- | -------------------------------------------------------------------------------------------------- |
| **Node.js regression** | 21 tests  | Normalization, filtering, matching, pagination, RSS, schema, storage, CSV, redistribution rules    |
| **Python scraper**     | 33 tests  | All 8 source adapters, pagination, retries, gzip, salary parsing, HTML safety, merge behavior      |
| **Playwright browser** | ~15 specs | Search/history, saves, cross-tab sync, statuses, CSV export, mobile flows, accessibility, metadata |
| **Build verification** | 1 script  | 38 HTML pages, 2,888 sitemap URLs, RSS validity, metadata, semantic structure, size budgets        |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Run `npm run check` and `npm run check:python` before committing
4. Ensure `npm run build && npm run verify:build` passes
5. Open a Pull Request

## License

This project is open source. See the repository for license details.

---

<p align="center">
  Built with Next.js, React, and Python · <a href="https://www.devjobs.site">devjobs.site</a>
</p>
