import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMetadata } from '@/lib/metadata';
import { getActiveJobs, toSummary } from '@/shared/data';
import { filterJobs, filtersFromParams, filtersToParams } from '@/shared/jobs';
import { paginate } from '@/shared/pagination';
import JobSearch from '@/app/components/JobSearch';
import JobCard from '@/shared/JobCard';
import { collectionSchema, serializeJsonLd } from '@/shared/seo';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
export const revalidate = 3600;
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  return pageMetadata({
    title: 'Remote developer jobs',
    description:
      'Search remote developer jobs by skill, location, experience, job type, source, and published salary. Save your shortlist without signing up.',
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
  const results = paginate(filterJobs(jobs, filters), params.get('page') || undefined);
  const sources = [...new Set(jobs.map((job) => job.source))].sort();
  function pageUrl(page: number) {
    const next = filtersToParams(filters);
    if (page > 1) next.set('page', String(page));
    return `/jobs${next.size ? `?${next}` : ''}`;
  }
  return (
    <div className="page-content directory-page">
      <div className="page-heading">
        <p className="eyebrow">Your next chapter starts here</p>
        <h1>Find your remote developer job.</h1>
        <p>Search by what you do. Filter by what matters. Apply at the source.</p>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            collectionSchema('Remote developer jobs', '/jobs', results.items),
          ),
        }}
      />
      <JobSearch filters={filters} sources={sources} />
      <section id="job-results" aria-labelledby="results-heading">
        <div className="results-toolbar">
          <h2 id="results-heading" aria-live="polite" aria-atomic="true">
            <strong>{results.total.toLocaleString('en-US')}</strong>{' '}
            {results.total === 1 ? 'opportunity' : 'opportunities'}
            {filters.query && <> for “{filters.query}”</>}
            {filters.location && <> · {filters.location}</>}
          </h2>
          <span>
            {filters.sort === 'company' ? 'Sorted by company A–Z' : 'Newest source dates first'}
          </span>
        </div>
        {results.items.length ? (
          <>
            <div className="jobs-grid">
              {results.items.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
            <nav className="pagination" aria-label="Job results pages">
              {results.page > 1 ? (
                <Link
                  prefetch={false}
                  className="button button-secondary"
                  href={pageUrl(results.page - 1)}
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <p>
                Page {results.page} of {results.pages}
                <span>
                  Showing {results.start + 1}–{results.start + results.items.length} of{' '}
                  {results.total.toLocaleString('en-US')}
                </span>
              </p>
              {results.page < results.pages ? (
                <Link
                  prefetch={false}
                  className="button button-secondary"
                  href={pageUrl(results.page + 1)}
                >
                  Next jobs
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          </>
        ) : (
          <div className="empty-state">
            <Search size={32} aria-hidden="true" />
            <h3>No jobs match these filters.</h3>
            <p>Try a broader skill or country, or clear your filters to explore recent roles.</p>
            <Link prefetch={false} href="/jobs" className="button button-secondary">
              Reset all filters
            </Link>
            <div className="empty-suggestions">
              <a href="/q/react-remote-jobs">React jobs</a>
              <a href="/q/python-remote-jobs">Python jobs</a>
              <a href="/jobs?salary=1">Jobs with salary details</a>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
