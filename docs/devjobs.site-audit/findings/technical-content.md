# Technical SEO and content audit

Audit date: November 1, 2026. Target: https://www.devjobs.site. This is the **pre-change baseline**, measured against this checkout and a readable public homepage. Findings may be resolved by the accompanying implementation; the final report should distinguish the two.

The site is a remote developer job directory with a browser-local application tracker. The review uses the [requested Claude SEO audit workflow](https://github.com/AgriciDaniel/claude-seo/blob/main/skills/seo-audit/SKILL.md). Its full runtime was not installed or executed. No Google Search Console, CrUX, Vercel account data, or complete live crawl was available, so no SEO score, Core Web Vitals score, indexing count, or causal explanation of the reported 86% bounce rate is asserted.

## Measured baseline

Measured with the existing TypeScript data normalization code on November 1 at 07:22 UTC:

| Measurement                                            |                        Result |
| ------------------------------------------------------ | ----------------------------: |
| Snapshot listings / currently active listings          |                 2,885 / 2,885 |
| Serialized active browser summaries                    | 1,842,977 bytes, uncompressed |
| Public API eligible listings                           |                         1,486 |
| Listings eligible for existing JobPosting markup       |                           661 |
| Listings without any description                       |                             0 |
| Listings with descriptions shorter than 100 characters |                             1 |
| Curated categories / nonempty categories               |                         8 / 8 |

Source counts: Himalayas 1,269; Jobicy 878; We Work Remotely 381; Arbeitnow 172; Remotive 130; Remote OK 29; Working Nomads 26. The public homepage also displayed 2,885 listings during this review. Counts are time-sensitive because discovery excludes expired and older listings.

## Prioritized findings

### High: initial catalogue payload grows with the entire snapshot

`src/app/page.tsx`, `src/app/jobs/page.tsx`, and `src/app/matches/page.tsx` pass every active summary to client components. The homepage renders only 12 initial cards, but transfers approximately 1.84 MB of serialized job data before JSON escaping or protocol overhead. The existing regression assertion of less than 1 MB is already exceeded.

**Action:** send only visible results on discovery pages and filter/paginate on the server. Preserve server-rendered cards and real crawlable links. Keep the matching page's remaining cost visible if it continues local matching. Test payload limits on actual rendered page data, not an artificial raised catalogue-size threshold.

**Constraint:** `canSyndicate` deliberately excludes Remotive and Himalayas from public API responses, RSS, and JobPosting schema. Onsite discovery includes these sources. Simply replacing onsite filtering with `/api/jobs` would silently hide 1,399 jobs at this baseline; relaxing the API guard would violate the repository's source policy. Use server-rendered onsite pages for the full catalogue. See `src/shared/sources.ts`, `tests/jobs.test.ts`, and `docs/SCRAPER.md`.

**Verification:** inspect initial HTML/RSC payloads, confirm only the requested result page is serialized, and check search/pagination for both restricted sources. [Google's pagination guidance](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading) supports incremental delivery with ordinary links that crawlers can discover.

### High: legacy job redirects are unreachable

`src/app/jobs/[slug]/page.tsx` sets `dynamicParams = false` and generates only canonical slugs. Although `findJob` recognizes old slugs and raw IDs and the page contains a permanent redirect, unknown static parameters are rejected before that page executes. Previously linked aliases therefore cannot use the intended redirect.

**Action:** allow dynamic parameters and retain explicit `notFound()` for genuinely unknown jobs, or generate the required aliases. Test canonical routes, raw IDs, legacy slugs, and an unknown ID in the production build. See the [Next.js route configuration reference](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config).

### High: search intent is below the decorative introduction

The homepage H1 is “Great work. From anywhere.” Search follows the large hero and source strip. The initial visual preview shows noninteractive duplicate sample cards. A visitor seeking a particular skill or country has to find the actual discovery controls. This is an observable interaction cost, not proof of the reported bounce rate's cause.

**Action:** lead with a literal remote developer jobs heading and working search; show source-backed counts and immediate routes into relevant categories. Add a location text filter grounded in supplied location labels, with explicit eligibility caveats rather than inferred geographic eligibility.

**Verification:** inspect narrow and desktop viewports; ensure primary search is immediately visible and keyboard accessible, preserves the URL, and returns relevant jobs.

### Medium: privacy disclosure contradicts analytics implementation

`src/shared/Legal.tsx` says the site does not load third-party analytics scripts; `src/app/layout.tsx` loads `@vercel/analytics/next`. The factual description is out of date.

**Action:** disclose the analytics actually used. If engagement events are added, state their purpose and avoid sending search text, saved skill lists, application statuses, or other personal inputs as event properties. The existing browser-local storage disclosure should remain accurate.

**Verification:** compare privacy copy with analytics component imports and every event payload. This is an implementation consistency finding, not a legal compliance certification.

### Medium: discovery paths stop after a small number of results

`JobsExplorer` initially shows 12 cards and loads more only through a button. Category pages show 24 cards and then point to filtered search. The sitemap does list active jobs, so this is an internal-linking weakness rather than total invisibility. `CategoryLinks` also slices the eight-category list to six, leaving data analyst and technical lead pages without those contextual category links.

**Action:** provide navigable result pages and expose all useful curated categories. Keep category and listing metadata aligned with visible results. If page-number URLs become indexable, provide appropriate self-canonicals instead of canonicalizing every page to page one. Keep arbitrary search/filter combinations out of the index.

**Verification:** follow next/previous links without JavaScript; ensure all eight categories appear in HTML; verify unique canonical URLs and a real 404 or an explicit no-results treatment for invalid pages.

### Medium: job detail pages have little onward discovery

The detail template contains Back to jobs and the apply panel, but no related roles. Visitors landing directly on a role that is unsuitable have no contextual alternative.

**Action:** offer a small set of relevant active roles using supplied technologies or role title, avoid the current job, and link to useful category searches. Keep the application action immediately available on small screens.

**Verification:** related jobs must be active, unique, and linked to real canonical detail pages; do not describe keyword overlap as hiring suitability.

### Operational: refresh and search visibility need deployment verification

The workflow is scheduled twice daily, but the website reads a bundled snapshot. Revalidation only ages the bundled jobs; it cannot ingest new jobs. The current checkout has fresh data, but the workflow-to-Vercel deployment chain was not inspected.

**Action:** verify that successful scraper commits trigger production builds, monitor source-health artifacts and failed deploys, and submit the canonical sitemap in Search Console. Sample schema-eligible job pages in Google's Rich Results Test. Compare successful application handoffs as well as bounce rate.

**Verification:** observe a new source record arriving in production after a scheduled refresh; check Search Console indexing and enhancement reports. Do not reset publication dates to create artificial freshness.

## Existing foundations to preserve

- Canonical origin is centralized as `https://www.devjobs.site`; metadata has absolute social images and RSS discovery.
- Real listings and descriptions render in HTML; descriptions are escaped and JSON-LD protects script delimiters.
- Active, archived, and unknown-date handling is explicit. Archived jobs become noindex and lose JobPosting markup; known expiry is respected.
- JobPosting requires source permission, a genuine publication date, description, and explicit applicant countries. Salary markup uses complete source-supplied units and currency. Do not invent countries, salary values, or expiry dates to increase schema coverage. This is consistent with [Google's JobPosting requirements](https://developers.google.com/search/docs/appearance/structured-data/job-posting).
- Personal pages are noindex and excluded from the sitemap; empty categories are excluded.
- About content explains sourcing, matching, limitations, and correction channels. FAQ content is readable without requiring invented FAQ rich-result claims.
- The source policy guard is tested for legacy as well as current records.
- Robots source allows public crawling and blocks `/api/`; sitemap uses the canonical host. The live robots/sitemap could not be fetched through the web tool, so source inspection does not establish current production headers or CDN behavior.

## Interpreting the reported bounce rate

The user reported 86%; this review did not access the underlying dashboard. [Vercel defines bounce rate](https://vercel.com/docs/analytics) from single-page sessions and explicitly states custom events do not count toward it. Someone who lands on a job and successfully opens the employer's application page may still have a single-page session. Adding artificial pageviews would distort the metric.

Track genuine search submissions, detail views, saves, and outbound application clicks. After deployment, compare the same time windows and traffic/device/landing-page segments. Improvements should aim at successful job discovery and application handoff; neither source changes nor event instrumentation establish a measured reduction in bounce rate.

## AI search and scope limits

Readable listings, source provenance, useful internal links, truthful structured data, and ordinary indexing foundations are the appropriate baseline. [Google's AI feature guidance](https://developers.google.com/search/docs/appearance/ai-features) does not require special AI markup and does not guarantee inclusion. There is no evidence here to assign an AI citation score, backlinks score, or ranking prediction.

This pass inspected relevant route/data/component source, current normalized snapshot counts, tests, deployment workflow definitions, the public homepage, and primary documentation. It did not run a 500-page crawl, validate external application availability, establish rich-result eligibility through Google's live test, inspect real-user performance, or inspect authenticated analytics.
