import { FaqSection } from './DiscoveryContent';
import { JOB_SOURCES } from './sources';
export default function About() {
  return (
    <>
      <article className="prose-page">
        <p className="eyebrow">A clearer path to your next role</p>
        <h1>About DevJobs.</h1>
        <p>
          DevJobs is a remote job directory and a personal application tracker. It brings listings
          from external job boards into one place, so you can compare opportunities, build a
          shortlist, and keep track of your next steps.
        </p>
        <h2>Where the jobs come from</h2>
        <p>
          Our aggregator reads public feeds and APIs from{' '}
          {JOB_SOURCES.map((source, index) => (
            <span key={source.name}>
              {index > 0 ? ', ' : ''}
              <a href={source.url} rel="noopener noreferrer" target="_blank">
                {source.label}
              </a>
            </span>
          ))}
          . Available sources can vary between updates. Each listing names its source and links to
          the original page.
        </p>
        <h2>How listings are maintained</h2>
        <p>
          The data pipeline is scheduled twice a day. It removes duplicate source URLs, cleans
          descriptions, and keeps listings published or updated by a source in the last 30 days in
          discovery. Source update dates are labeled separately. Unknown dates are never replaced
          with today’s date. Known expiry dates are respected. Individual jobs may close before they
          leave our directory.
        </p>
        <p>
          Job titles, descriptions, and compensation originate with the source. We do not
          independently verify employers or openings, and we do not rank listings by payments.
          Location eligibility must be checked with the employer: remote work is not necessarily
          available worldwide.
        </p>
        <h2>How matching and filtering work</h2>
        <p>
          We detect technologies from listing text and compare your selected skills with the title,
          detected technologies, and short summary. Match percentages describe keyword overlap. They
          do not predict hiring outcomes. Experience and employment type filters use source text, so
          confirm those details on the original listing.
        </p>
        <h2>A tracker that stays with you</h2>
        <p>
          Your saved jobs, statuses, and skills are stored in this browser. There is no account and
          no cross-device sync. Export your application board as CSV to keep a copy. Clearing
          browser data also clears your saved jobs.
        </p>
        <h2>Corrections and feedback</h2>
        <p>
          DevJobs is maintained by{' '}
          <a href="https://github.com/pranavv00" target="_blank" rel="noopener noreferrer">
            Pranav Gawande
          </a>
          . Report listing corrections at the original source. For problems with this site, visit
          the{' '}
          <a
            href="https://github.com/pranavv00/devjobs.site/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            project’s issue tracker
          </a>
          .
        </p>
      </article>
      <FaqSection />
    </>
  );
}
