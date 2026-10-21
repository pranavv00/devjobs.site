'use client';
import { useState } from 'react';
import { ArrowUpRight, Bookmark, MapPin } from 'lucide-react';
import { displayDate, matchScore, type JobSummary } from './jobs';
import { useSavedJobs, useSkills } from './storage';

export function SaveButton({ job, showLabel = false }: { job: JobSummary; showLabel?: boolean }) {
  const { savedJobs, toggleSave } = useSavedJobs();
  const saved = savedJobs.some((item) => item.id === job.id);
  const [error, setError] = useState('');
  return (
    <div className="save-control">
      <button
        type="button"
        className={showLabel ? 'button button-secondary' : 'icon-button save-button'}
        aria-label={`${saved ? 'Unsave' : 'Save'} ${job.title}`}
        aria-pressed={saved}
        onClick={() =>
          setError(
            toggleSave(job) ? '' : 'Could not save. Browser storage may be full or disabled.',
          )
        }
      >
        <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
        {showLabel && (saved ? 'Saved to your jobs' : 'Save this job')}
      </button>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export default function JobCard({ job }: { job: JobSummary }) {
  const { skills } = useSkills();
  const score = matchScore(job, skills);
  return (
    <article className="job-card">
      <div className="job-card-top">
        <div className={`company-avatar avatar-${job.id.charCodeAt(0) % 4}`} aria-hidden="true">
          {job.company.slice(0, 2).toUpperCase()}
        </div>
        <div className="company-info">
          <span>{job.company}</span>
          <span className="source-name">via {job.source}</span>
        </div>
        <SaveButton job={job} />
      </div>
      <h3>
        <a href={`/jobs/${job.slug}`}>{job.title}</a>
      </h3>
      <p className="job-location">
        <MapPin size={14} aria-hidden="true" />
        {job.location}
      </p>
      <div className="tag-list">
        {job.tags.slice(0, 3).map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
        {!job.tags.length && <span className="tag">Remote opportunity</span>}
      </div>
      <div className="job-card-bottom">
        <span className={job.salary ? 'salary' : 'muted'}>{job.salary || 'Salary not listed'}</span>
        <a
          href={`/jobs/${job.slug}`}
          className="job-arrow"
          aria-label={`View ${job.title} at ${job.company}`}
        >
          <ArrowUpRight size={19} aria-hidden="true" />
        </a>
      </div>
      <div className="job-card-meta">
        <time dateTime={job.posted_at || undefined}>
          {job.dateKind === 'updated' ? 'Updated ' : ''}
          {displayDate(job.posted_at)}
        </time>
        {skills.length > 0 && (
          <span className="match-score" title="Keyword overlap with your saved skills">
            {score}% skill match
          </span>
        )}
      </div>
    </article>
  );
}
