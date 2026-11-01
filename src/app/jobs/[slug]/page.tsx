import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/metadata';
import { notFound, permanentRedirect } from 'next/navigation';
import { findJob, getActiveJobs, toSummary } from '@/shared/data';
import { breadcrumbSchema, jobSchema, serializeJsonLd } from '@/shared/seo';
import JobDetails from '@/shared/JobDetails';
import JobCard from '@/shared/JobCard';
import { relatedJobs } from '@/shared/related-jobs';
export const revalidate = 3600;
type Props = { params: Promise<{ slug: string }> };
// Allow canonical details and old ID/title aliases to resolve on demand.
export const dynamicParams = true;
export function generateStaticParams() {
  return getActiveJobs()
    .slice(0, 24)
    .map((job) => ({ slug: job.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params,
    job = findJob(slug);
  if (!job) notFound();
  const title = `${job.title} at ${job.company}`;
  const description =
    `${title}. ${job.salary ? `Salary: ${job.salary}. ` : ''}${job.excerpt}`.slice(0, 160);
  return pageMetadata({
    title,
    description,
    path: `/jobs/${job.slug}`,
    type: 'article',
    noindex: job.archived,
  });
}
export default async function JobPage({ params }: Props) {
  const { slug } = await params,
    job = findJob(slug);
  if (!job) notFound();
  if (slug !== job.slug) permanentRedirect(`/jobs/${job.slug}`);
  const related = relatedJobs(job, getActiveJobs().map(toSummary));
  const structuredData = [
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Remote jobs', path: '/jobs' },
      { name: job.title, path: `/jobs/${job.slug}` },
    ]),
    jobSchema(job),
  ].filter(Boolean);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <JobDetails job={job} summary={toSummary(job)} />
      <section className="jobs-section related-jobs" aria-labelledby="related-jobs-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Keep exploring</p>
            <h2 id="related-jobs-heading">
              {related.length ? 'More roles to consider.' : 'Find your next opportunity.'}
            </h2>
          </div>
          <a href="/jobs" className="text-link">
            Browse all remote jobs ↗
          </a>
        </div>
        {related.length > 0 && (
          <>
            <p className="results-summary">
              Related skills or responsibilities. Check each employer’s location requirements.
            </p>
            <div className="jobs-grid">
              {related.map((item) => (
                <JobCard key={item.id} job={item} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
