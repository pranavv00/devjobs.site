import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/metadata';
import { getActiveJobs, toSummary } from '@/shared/data';
import { filterJobs, filtersFromParams } from '@/shared/jobs';
import JobsExplorer from '@/shared/JobsExplorer';
import { collectionSchema, serializeJsonLd } from '@/shared/seo';
export const revalidate = 3600;
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  return pageMetadata({
    title: 'Remote developer jobs',
    description:
      'Search remote developer jobs by skill, experience, job type, source, and published salary.',
    path: '/jobs',
    noindex: Object.keys(params).length > 0,
  });
}
export default async function JobsPage({ searchParams }: Props) {
  const values = await searchParams;
  const params = new URLSearchParams(
    Object.entries(values).flatMap(([key, value]) =>
      typeof value === 'string' ? [[key, value]] : [],
    ),
  );
  const jobs = getActiveJobs().map(toSummary);
  const filters = filtersFromParams(params);
  return (
    <div className="page-content">
      <div className="page-heading">
        <p className="eyebrow">Good work is out there</p>
        <h1>Find a role that fits.</h1>
        <p>Remote opportunities, useful filters, and a clear path to the original listing.</p>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            collectionSchema('Remote developer jobs', '/jobs', filterJobs(jobs, filters)),
          ),
        }}
      />
      <JobsExplorer jobs={jobs} initialFilters={filters} />
    </div>
  );
}
