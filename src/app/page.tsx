import { pageMetadata } from '@/lib/metadata';
import { getActiveJobs, toSummary } from '@/shared/data';
import { collectionSchema, serializeJsonLd, siteSchema } from '@/shared/seo';
import Hero from '@/shared/Hero';
import JobCard from '@/shared/JobCard';
import { JOBS_PER_PAGE } from '@/shared/pagination';
import { ArrowRight } from 'lucide-react';
import { CategoryLinks, HowItWorks, FaqSection } from '@/shared/DiscoveryContent';
export const revalidate = 3600;
export const metadata = pageMetadata({
  title: 'Remote developer jobs — Find your next role',
  path: '/',
});
export default function Home() {
  const jobs = getActiveJobs().map(toSummary);
  const visibleJobs = jobs.slice(0, JOBS_PER_PAGE);
  const sources = [...new Set(jobs.map((job) => job.source))];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([
            siteSchema,
            collectionSchema('Remote developer jobs', '/', visibleJobs),
          ]),
        }}
      />
      <Hero total={jobs.length} />
      <div className="sources-strip">
        <p>
          One search.
          <br />
          Established job boards.
        </p>
        <div className="sources-list">
          {sources.map((source) => (
            <span key={source}>{source}</span>
          ))}
        </div>
        <a href="/about" className="source-note">
          How we source jobs ↗
        </a>
      </div>
      <section id="jobs" className="jobs-section latest-jobs" aria-labelledby="jobs-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A good place to start</p>
            <h2 id="jobs-heading">Your next opportunity.</h2>
          </div>
          <a href="/jobs" className="text-link">
            Browse all {jobs.length.toLocaleString('en-US')} jobs{' '}
            <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
        <div className="discovery-shortcuts" aria-label="Explore jobs by preference">
          <a href="/jobs">Latest roles</a>
          <a href="/jobs?salary=1">
            Salary disclosed <ArrowRight size={14} aria-hidden="true" />
          </a>
          <a href="/jobs?experience=junior">Early career</a>
          <a href="/jobs?type=CONTRACTOR">Contract work</a>
        </div>
        <div className="jobs-grid">
          {visibleJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
        {!jobs.length && (
          <div className="empty-state">
            <h3>No recent listings right now.</h3>
            <p>Check back after the next source refresh, or explore our job sources.</p>
            <a href="/about" className="button button-secondary">
              Explore job sources
            </a>
          </div>
        )}
        {jobs.length > 0 && (
          <div className="load-more">
            <a href="/jobs" className="button button-secondary">
              Explore all remote jobs <ArrowRight size={17} aria-hidden="true" />
            </a>
            <p>Filter by skill, location, experience, and salary.</p>
          </div>
        )}
      </section>
      <CategoryLinks />
      <HowItWorks />
      <FaqSection />
    </>
  );
}
