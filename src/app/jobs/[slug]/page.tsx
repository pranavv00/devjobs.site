import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/metadata';
import { notFound, permanentRedirect } from 'next/navigation';
import { findJob, getAllJobs, toSummary } from '@/shared/data';
import { breadcrumbSchema, jobSchema, serializeJsonLd } from '@/shared/seo';
import JobDetails from '@/shared/JobDetails';
export const revalidate = 3600;
type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return getAllJobs().map((job) => ({ slug: job.slug }));
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
    </>
  );
}
