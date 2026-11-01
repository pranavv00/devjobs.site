# DevJobs SEO, performance, and discovery audit

Audit date: November 1, 2026. Target: https://www.devjobs.site. Implementation: the Next.js application in this checkout.

The main findings were excessive initial listing data, search below a decorative hero, missing location filtering, unreachable legacy redirects, and limited onward discovery. These have been addressed locally. This report does not claim a production deployment, improved rankings, measured Core Web Vitals, or a reduced bounce rate.

## Evidence and scope

The review used the public homepage, local source and snapshot, generated production HTML, automated checks, and the user’s Vercel screenshot. The screenshot shows Production / Last 7 Days, 504 visitors, 652 page views, and 86% bounce, with a large October 28 traffic spike. It does not identify the landing page, referrer, device, or country responsible for exits.

The requested [Claude SEO toolkit](https://github.com/AgriciDaniel/claude-seo) and its [full-audit workflow](https://github.com/AgriciDaniel/claude-seo/blob/main/skills/seo-audit/SKILL.md) informed the review. Its specialist delegation workflow was used for source auditing and SEO fixes. Permanent installation did **not** complete: the installer could not resolve GitHub from this restricted shell, and automatic approval review rejected elevated network access because escalation is disabled. The toolkit's bundled crawler, PageSpeed, and report runtime were not run. Follow its [installation guide](https://github.com/AgriciDaniel/claude-seo/blob/main/docs/INSTALLATION.md) in an environment with the required network and filesystem access.

This is an evidence-based implementation audit, not a 500-page production crawl. No numeric SEO health score is assigned because crawl, field-performance, Search Console, and backlink evidence is incomplete.

## Implemented findings

| Priority | Finding                                                                                         | Change and verification                                                                                                                                                                                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| High     | The homepage and directory serialized 2,885 job summaries, totaling 1,842,977 bytes.            | The homepage sends 12 visible records; the directory filters on the server and returns 12 records per page. The same first 12 summaries total 7,027 bytes, a 99.62% reduction in **job-summary data**, not total load time. Payload and pagination regressions are covered by tests. |
| High     | Search was below the hero and source strip.                                                     | Search is now the primary homepage action, with a descriptive H1, popular searches, salary/early-career/contract shortcuts, and a native GET form. Removed decorative preview/orbit markup and its unused CSS.                                                                       |
| High     | Listing filters could not search location.                                                      | Added bounded, shareable country/region text filtering against the actual source location. The interface explicitly asks visitors to confirm eligibility. It does not infer work authorization or worldwide eligibility.                                                             |
| High     | `dynamicParams=false` prevented legacy IDs and slugs reaching canonical redirects.              | Enabled on-demand details; retained unknown-route 404 behavior; prerendered 24 recent detail pages, with remaining detail pages generated through ISR. Added HTTP regression coverage, pending execution in an unrestricted browser environment.                                     |
| Medium   | Results after the first 12 required client-only load-more interaction.                          | Added real pagination URLs and GET search fallback. Query, location, salary, source, experience, type, date, and sort are retained in pagination. Old homepage filter URLs redirect to `/jobs`, preserving their query string.                                                       |
| Medium   | Application actions were confined to the separate detail panel.                                 | Added a source application link and salary/date facts near the job title; retained the detailed application panel and saved-job controls.                                                                                                                                            |
| Medium   | Detail pages offered little relevant onward discovery.                                          | Added up to three current related roles, excluding the current job and duplicate employer/title combinations, with a browse-all path. Relevance logic has regression tests.                                                                                                          |
| Medium   | Category links exposed only six of eight pages, and category content lacked practical guidance. | Linked all eight categories, added category-specific guidance and breadcrumb schema. No artificial reviews, unsupported claims, or FAQ rich-result promises.                                                                                                                         |
| Medium   | The privacy page incorrectly said analytics were absent.                                        | Corrected the factual disclosure. Analytics URLs have query strings/fragments removed and honor Do Not Track. Optional events exclude search text, selected skills, job IDs, and destination URLs.                                                                                   |
| Medium   | Bounce was the only supplied engagement metric.                                                 | Prepared optional search, filter, view-job, save/unsave, and application-click events. They remain disabled until `NEXT_PUBLIC_ENABLE_ENGAGEMENT_ANALYTICS=true` is set at build time on a supported Vercel plan. No synthetic page views or timer events.                           |

## Performance evidence

The first production build after the redesign produced a 78,695-byte homepage HTML document and a 29,067-byte homepage RSC file, with 12 server-rendered cards. These are separate uncompressed artifacts; the HTML already contains hydration information, so the sizes should not be added as a total network-transfer claim. Subsequent small analytics/configuration changes may slightly change these values. The final build measurements are recorded in `audit-data.json`.

No new font request, animation library, image dependency, or client search catalogue was added to the primary landing/search flow. The existing `/matches` tool still loads the full summary catalogue to perform private matching in the browser; that deliberate behavior is a remaining payload cost on that route. The optional static Astro frontend also retains its existing client-side catalogue search. The main performance claims apply to the deployed Next.js architecture.

LCP, INP, CLS, Lighthouse scores, mobile appearance, and real network timing have not been measured here. A smaller payload supports a speed improvement but is not a field-performance measurement.

## SEO safeguards retained

- Stable canonical job URLs, per-page metadata, social images, RSS, robots directives, and one canonical origin.
- Noindex for personal, archived, empty-category, and filtered-result pages; sitemap includes current jobs and populated categories.
- JobPosting markup only for supported, active, dated jobs with source-backed country evidence; no invented salaries, addresses, deadlines, or applicant eligibility.
- Remotive and Himalayas redistribution restrictions remain enforced by the public API, RSS, and structured data. Full-site pagination uses rendered website routes, not an expanded public API.
- Source dates stay distinguished from original posting dates. The bundled data is still a snapshot and needs successful scraper-triggered redeployments.

## Validation and limits

- ESLint, TypeScript, and 21 Node regression tests passed.
- 33 Python ingestion/source tests passed.
- Optimized Next.js production build passed.
- Generated-output validation passed for 38 HTML pages, 2,888 unique sitemap URLs in the final check (2,898 initially; ten listings aged out during the audit), RSS, JSON-LD, canonical/social metadata, labels, and core semantics.
- The browser suite now covers mobile search placement, JavaScript-free pagination/search, bounded HTML, and legacy redirects alongside existing saves, history, accessibility, and storage tests.
- Browser verification could not run: localhost connections/listening were denied with `EPERM`, and Chrome launch terminated with `SIGABRT` under the workspace restrictions. No screenshot review or axe pass is claimed.
- Astro dependency installation, type checking (zero errors/warnings; three existing inline-script hints), and its 2,901-page static build passed.
- No Git metadata or configured Vercel deployment access is present in this checkout. No commit, PR, or deployment was made.

## Interpreting the 86% bounce rate

[Vercel defines bounce as single-page sessions divided by total sessions](https://vercel.com/docs/analytics); custom events do not change that calculation. A visitor who lands on a job and follows its application link may have completed the useful task while still counting as a bounce. The screenshot’s traffic spike also makes acquisition source and landing-page breakdowns important before attributing the aggregate to design.

After deployment, compare the same seven-day windows and segment by landing route, mobile/desktop, referrer, and country. Track application-link clicks and saves per visitor as well as discovery-to-detail progression. An application-link click is intent, not a completed application or hire. Custom-event availability and retention depend on the [Vercel plan](https://vercel.com/docs/analytics/custom-events).

## Design and search references

The visual direction keeps the existing brand and uses compact spacing, restrained color, clear type hierarchy, real form controls, and direct paths to listings. [Linear](https://linear.app) informed hierarchy and restraint; [We Work Remotely](https://weworkremotely.com) informed category-led job discovery. Their designs were not copied. The local Apple design skill informed immediate feedback, readable text, reduced-motion support, and touch targets.

Primary guidance: [Google JobPosting requirements](https://developers.google.com/search/docs/appearance/structured-data/job-posting), [Google AI search guidance](https://developers.google.com/search/docs/appearance/ai-features), [Next.js redirects](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects), and [Vercel analytics privacy](https://vercel.com/docs/analytics/privacy-policy).
