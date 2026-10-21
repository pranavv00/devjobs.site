import { pageMetadata } from '@/lib/metadata';
import { getActiveJobs, toSummary } from '@/shared/data';
import { collectionSchema, serializeJsonLd, siteSchema } from '@/shared/seo';
import Hero from '@/shared/Hero';
import JobsExplorer from '@/shared/JobsExplorer';
import { CategoryLinks, HowItWorks, FaqSection } from '@/shared/DiscoveryContent';
export const revalidate = 3600;
export const metadata = pageMetadata({
  title: 'Remote developer jobs & application tracker',
  path: '/',
});
export default function Home() {
  const jobs = getActiveJobs().map(toSummary);
  const sources = [...new Set(jobs.map((job) => job.source))];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([
            siteSchema,
            collectionSchema('Remote developer jobs', '/', jobs),
          ]),
        }}
      />
      <Hero jobs={jobs.slice(0, 2)} total={jobs.length} />
      <div className="sources-strip">
        <p>Good opportunities. Familiar sources.</p>
        <div className="sources-list">
          {sources.map((source) => (
            <span key={source}>{source}</span>
          ))}
        </div>
        <span className="source-note">Always linked to the source ↗</span>
      </div>
      <JobsExplorer jobs={jobs} compact />
      <CategoryLinks />
      <HowItWorks />
      <FaqSection />
    </>
  );
}
