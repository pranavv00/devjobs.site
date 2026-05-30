import { MetadataRoute } from 'next';
import { getJobsServer } from '@/lib/data-server';
import { generateJobSlug } from '@/lib/utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await getJobsServer();
  const baseUrl = 'https://devjobs.site';

  const jobUrls = jobs.map((job) => ({
    url: `${baseUrl}/jobs/${generateJobSlug(job)}`,
    lastModified: new Date(job.posted_at),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/saved`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...jobUrls,
  ];
}
