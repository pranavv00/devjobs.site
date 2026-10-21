import { ArrowLeft, ArrowUpRight, MapPin } from 'lucide-react';
import { displayDate, type Job, type JobSummary } from './jobs';
import { SaveButton } from './JobCard';

export default function JobDetails({ job, summary }: { job: Job; summary: JobSummary }) {
  const paragraphs = job.description
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <article className="page-content job-details">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span aria-hidden="true">/</span>
        <a href="/jobs">Remote jobs</a>
        <span aria-hidden="true">/</span>
        <span>{job.company}</span>
      </nav>
      <a className="back-link" href="/jobs">
        <ArrowLeft size={15} aria-hidden="true" />
        Back to jobs
      </a>
      {job.archived && (
        <div className="notice" role="status">
          This listing is outside our current discovery window or has expired. Check the original
          source for availability, or <a href="/jobs">browse recent jobs</a>.
        </div>
      )}
      <header className="detail-heading">
        <p className="eyebrow">{job.company}</p>
        <h1>{job.title}</h1>
        <p>
          <MapPin size={16} aria-hidden="true" />
          {job.location}
        </p>
        <div className="tag-list">
          {job.tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </header>
      <div className="detail-layout">
        <section className="description-panel" aria-labelledby="description-heading">
          <h2 id="description-heading">About the role</h2>
          <p className="source-attribution">
            Description supplied by{' '}
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              {job.source}
            </a>
            . Confirm requirements and availability at the original listing.
          </p>
          <div className="job-description">
            {paragraphs.length ? (
              paragraphs.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <p>
                The source did not provide a description. Read the original listing for details.
              </p>
            )}
          </div>
        </section>
        <aside className="detail-sidebar">
          <div className="apply-panel">
            <h2>Your next move?</h2>
            <p>Read the full listing and apply through {job.source}.</p>
            <a
              className="button button-primary"
              href={job.archived ? job.url : job.applyUrl || job.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {job.archived ? 'Check original listing' : 'View & apply'}
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <span className="external-note">Opens the source’s application page in a new tab</span>
            <SaveButton job={summary} showLabel />
            <dl>
              <div>
                <dt>Company</dt>
                <dd>{job.company}</dd>
              </div>
              <div>
                <dt>Salary</dt>
                <dd>{job.salary || 'Not provided'}</dd>
              </div>
              <div>
                <dt>{job.dateKind === 'updated' ? 'Updated at source' : 'Posted'}</dt>
                <dd>
                  <time dateTime={job.posted_at || undefined}>{displayDate(job.posted_at)}</time>
                </dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>
                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                    {job.source}
                  </a>
                </dd>
              </div>
              {job.sourceEmploymentType && (
                <div>
                  <dt>Employment</dt>
                  <dd>{job.sourceEmploymentType.toLowerCase().replaceAll('_', ' ')}</dd>
                </div>
              )}
              {job.experienceLevel && (
                <div>
                  <dt>Experience</dt>
                  <dd>{job.experienceLevel}</dd>
                </div>
              )}
              {Boolean(job.timezoneRestrictions?.length) && (
                <div>
                  <dt>Source time zones (UTC offsets)</dt>
                  <dd>{job.timezoneRestrictions!.join(', ')}</dd>
                </div>
              )}
              {job.lastSeenAt && (
                <div>
                  <dt>Last seen in source feed</dt>
                  <dd>
                    <time dateTime={job.lastSeenAt}>{displayDate(job.lastSeenAt)}</time>
                  </dd>
                </div>
              )}
              {job.applicantCountries.length > 0 && (
                <div>
                  <dt>Eligible countries</dt>
                  <dd>{job.applicantCountries.join(', ')}</dd>
                </div>
              )}
              {job.validThrough && (
                <div>
                  <dt>Source listing expires</dt>
                  <dd>{displayDate(job.validThrough)}</dd>
                </div>
              )}
            </dl>
            <p className="small-text">
              Remote roles may have country, time zone, or work authorization requirements.
            </p>
          </div>
        </aside>
      </div>
    </article>
  );
}
