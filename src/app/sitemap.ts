import type { MetadataRoute } from 'next';
import { getActiveJobs, toSummary } from '@/shared/data';
import { CATEGORIES, absoluteUrl } from '@/shared/seo';
import { DEFAULT_FILTERS, filterJobs } from '@/shared/jobs';
export const revalidate = 3600;
export default function sitemap(): MetadataRoute.Sitemap {
  const jobs = getActiveJobs();
  return [
    ...['/', '/jobs', '/about', '/privacy', '/terms'].map((path) => ({ url: absoluteUrl(path) })),
    ...CATEGORIES.filter(
      (c) => filterJobs(jobs.map(toSummary), { ...DEFAULT_FILTERS, query: c.query }).length,
    ).map((c) => ({ url: absoluteUrl(`/q/${c.slug}`) })),
    ...jobs.map((job) => ({ url: absoluteUrl(`/jobs/${job.slug}`), lastModified: job.posted_at })),
  ];
}
