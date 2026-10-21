'use client';
import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { matchScore, type JobSummary } from './jobs';
import { useSkills } from './storage';
import JobCard from './JobCard';
import TechStackInput from './TechStackInput';
export default function Matches({ jobs }: { jobs: JobSummary[] }) {
  const { skills } = useSkills();
  const [limit, setLimit] = useState(12);
  const matches = useMemo(
    () =>
      jobs
        .map((job) => ({ job, score: matchScore(job, skills) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score),
    [jobs, skills],
  );
  return (
    <div className="page-content">
      <div className="page-heading">
        <p className="eyebrow">A more personal search</p>
        <h1>Made for your skill set.</h1>
        <p>Start with what you know. Find opportunities that speak your language.</p>
      </div>
      <TechStackInput />
      <p className="results-summary" role="status">
        {skills.length
          ? `${matches.length} jobs share skills with your stack.`
          : 'Add your first skill to see matching jobs.'}
      </p>
      {matches.length ? (
        <>
          <div className="jobs-grid">
            {matches.slice(0, limit).map(({ job }) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          {limit < matches.length && (
            <div className="load-more">
              <button className="button button-secondary" onClick={() => setLimit(limit + 12)}>
                Show more matches
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <Sparkles size={32} aria-hidden="true" />
          <h2>{skills.length ? 'No matches just yet.' : 'Let’s find your kind of work.'}</h2>
          <p>
            {skills.length
              ? 'Try another skill, or browse all available opportunities.'
              : 'Your skills stay in this browser. No profile or sign-up required.'}
          </p>
          <a href="/jobs" className="button button-secondary">
            Browse all jobs
          </a>
        </div>
      )}
    </div>
  );
}
