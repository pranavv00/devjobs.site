import { generateJobSlug, type Job, type JobSummary } from './jobs';
import { canSyndicate } from './sources';

export const SITE_URL = 'https://www.devjobs.site';
export const SITE_DESCRIPTION =
  'Find remote developer jobs, compare published salaries, and track your applications. Browse roles from established job boards with no account required.';
export const absoluteUrl = (path = '/') => new URL(path, SITE_URL).href;
export const serializeJsonLd = (data: unknown) =>
  JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
export const escapeXml = (value: string) =>
  value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(
      /[<>&"']/g,
      (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!,
    );
export const siteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'DevJobs',
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: 'en',
};
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
export function jobSchema(job: Job) {
  // Geographic eligibility is required for remote JobPosting rich results. Never guess it.
  if (
    !canSyndicate(job) ||
    job.dateKind === 'updated' ||
    job.archived ||
    !job.posted_at ||
    !job.description ||
    !job.applicantCountries.length
  )
    return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description
      .split(/\n+/)
      .map((p) => `<p>${escapeXml(p)}</p>`)
      .join(''),
    datePosted: job.posted_at,
    url: absoluteUrl(`/jobs/${job.slug}`),
    identifier: { '@type': 'PropertyValue', name: job.source, value: job.id },
    hiringOrganization: { '@type': 'Organization', name: job.company },
    jobLocationType: 'TELECOMMUTE',
    applicantLocationRequirements: job.applicantCountries.map((name) => ({
      '@type': 'Country',
      name,
    })),
    ...(job.validThrough ? { validThrough: job.validThrough } : {}),
    ...(job.sourceEmploymentType ? { employmentType: job.sourceEmploymentType } : {}),
    ...(job.salaryDetails && job.salaryDetails.period !== 'FORTNIGHT'
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: job.salaryDetails.currency,
            value: {
              '@type': 'QuantitativeValue',
              unitText: job.salaryDetails.period,
              ...(job.salaryDetails.min ? { minValue: job.salaryDetails.min } : {}),
              ...(job.salaryDetails.max ? { maxValue: job.salaryDetails.max } : {}),
            },
          },
        }
      : {}),
  };
}
export function collectionSchema(name: string, path: string, jobs: JobSummary[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: absoluteUrl(path),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: jobs.slice(0, 12).map((job, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${job.title} at ${job.company}`,
        url: absoluteUrl(`/jobs/${job.slug}`),
      })),
    },
  };
}
export function rssFeed(jobs: Job[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>DevJobs — Remote developer jobs</title><link>${SITE_URL}</link><description>${escapeXml(SITE_DESCRIPTION)}</description><language>en-us</language><atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>${jobs
    .filter((job) => !job.archived && canSyndicate(job))
    .slice(0, 100)
    .map((job) => {
      const url = escapeXml(absoluteUrl(`/jobs/${generateJobSlug(job)}`));
      return `<item><title>${escapeXml(`${job.title} at ${job.company}`)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid>${job.posted_at ? `<pubDate>${new Date(job.posted_at).toUTCString()}</pubDate>` : ''}<description>${escapeXml(job.description)}</description></item>`;
    })
    .join('')}</channel></rss>`;
}
export const CATEGORIES = [
  {
    slug: 'react-remote-jobs',
    title: 'Remote React jobs',
    query: 'React',
    description:
      'Explore frontend and full stack roles that mention React. Check each employer’s requirements for React experience, related tooling, and eligible locations.',
  },
  {
    slug: 'python-remote-jobs',
    title: 'Remote Python jobs',
    query: 'Python',
    description:
      'Find Python roles across backend engineering, data, and machine learning. Compare source descriptions and published compensation before applying.',
  },
  {
    slug: 'frontend-remote-jobs',
    title: 'Remote frontend jobs',
    query: 'frontend',
    description:
      'Browse remote frontend engineering roles. Review the required frameworks, accessibility responsibilities, and location restrictions in each listing.',
  },
  {
    slug: 'backend-remote-jobs',
    title: 'Remote backend jobs',
    query: 'backend',
    description:
      'Explore backend roles covering APIs, services, infrastructure, and databases. Check the original listing for seniority and working hours.',
  },
  {
    slug: 'node-remote-jobs',
    title: 'Remote Node.js jobs',
    query: 'Node.js',
    description:
      'Discover roles mentioning Node.js, from backend services to full stack applications. Employer descriptions provide the complete requirements.',
  },
  {
    slug: 'react-native-remote',
    title: 'Remote React Native jobs',
    query: 'React Native',
    description:
      'Find mobile engineering roles using React Native. Review platform expectations, release responsibilities, and location eligibility with the employer.',
  },
  {
    slug: 'data-analyst-remote',
    title: 'Remote data analyst jobs',
    query: 'data analyst',
    description:
      'Explore data analyst roles. Compare the required analytics tools, business responsibilities, and published salaries.',
  },
  {
    slug: 'technical-lead-remote',
    title: 'Remote technical lead jobs',
    query: 'lead',
    description:
      'Browse engineering leadership roles. Check each listing for team responsibilities, technical scope, and seniority expectations.',
  },
] as const;
export const FAQS = [
  {
    question: 'What is DevJobs?',
    answer:
      'DevJobs brings remote job listings from established job boards into one searchable directory. You can filter roles, save interesting jobs, and track your application progress without creating an account.',
  },
  {
    question: 'Can I work from any country?',
    answer:
      'Remote does not always mean worldwide. Employers may limit eligible countries, time zones, or work authorization. Check the location requirements in the full description and on the original job board before applying.',
  },
  {
    question: 'How fresh are the listings?',
    answer:
      'The aggregation workflow is scheduled twice a day. Discovery includes listings published or updated by the source within the last 30 days; update dates are labeled separately. Known expiry dates are respected. A recent date or appearance in a feed does not guarantee that a role is still open; confirm availability at the source.',
  },
  {
    question: 'How does skill matching work?',
    answer:
      'Matching compares your saved skills with the title, detected technologies, and summary of each job. The percentage shows keyword overlap, not your chance of getting hired. You can edit your skills at any time.',
  },
  {
    question: 'Where are my saved jobs stored?',
    answer:
      'Saved jobs, application statuses, and skills stay in this browser’s local storage. They are not synced between devices. Export your jobs as CSV for a backup before clearing browser data.',
  },
];
