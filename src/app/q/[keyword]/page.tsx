import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/metadata';
import { notFound } from 'next/navigation';
import { getActiveJobs, toSummary } from '@/shared/data';
import { DEFAULT_FILTERS, filterJobs } from '@/shared/jobs';
import { CATEGORIES, collectionSchema, serializeJsonLd } from '@/shared/seo';
import JobCard from '@/shared/JobCard';
import { CategoryLinks } from '@/shared/DiscoveryContent';
export const revalidate = 3600;
export const dynamicParams = false;
export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ keyword: c.slug }));
}
function getCategory(keyword: string) {
  return CATEGORIES.find((c) => c.slug === keyword);
}
type Props = { params: Promise<{ keyword: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = getCategory((await params).keyword);
  if (!category) return { title: 'Category not found', robots: { index: false } };
  const jobs = filterJobs(getActiveJobs().map(toSummary), {
    ...DEFAULT_FILTERS,
    query: category.query,
  });
  return pageMetadata({
    title: category.title,
    description: category.description,
    path: `/q/${category.slug}`,
    noindex: !jobs.length,
  });
}
export default async function CategoryPage({ params }: Props) {
  const category = getCategory((await params).keyword);
  if (!category) notFound();
  const jobs = filterJobs(getActiveJobs().map(toSummary), {
    ...DEFAULT_FILTERS,
    query: category.query,
  });
  return (
    <div className="page-content">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/jobs">Remote jobs</a>
        <span aria-hidden="true">/</span>
        <span>{category.title}</span>
      </nav>
      <div className="page-heading">
        <p className="eyebrow">Explore by specialty</p>
        <h1>{category.title}</h1>
        <p>{category.description}</p>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(collectionSchema(category.title, `/q/${category.slug}`, jobs)),
        }}
      />
      <p className="results-summary">
        {jobs.length} recent listings. Location eligibility and availability vary by employer.
      </p>
      <div className="jobs-grid">
        {jobs.slice(0, 24).map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
      {!jobs.length && (
        <div className="empty-state">
          <h2>No recent listings in this category.</h2>
          <p>Browse other skills or check again after the next data refresh.</p>
        </div>
      )}
      <div className="load-more">
        <a
          className="button button-secondary"
          href={`/jobs?q=${encodeURIComponent(category.query)}`}
        >
          Explore all matching jobs ↗
        </a>
      </div>
      <CategoryLinks />
    </div>
  );
}
