'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X, ArrowDown, RotateCcw } from 'lucide-react';
import {
  DEFAULT_FILTERS,
  filterJobs,
  filtersFromParams,
  filtersToParams,
  type JobFilters,
  type JobSummary,
} from './jobs';
import JobCard from './JobCard';

export default function JobsExplorer({
  jobs,
  initialFilters = DEFAULT_FILTERS,
  compact = false,
}: {
  jobs: JobSummary[];
  initialFilters?: JobFilters;
  compact?: boolean;
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [draft, setDraft] = useState(initialFilters.query);
  const [showFilters, setShowFilters] = useState(false);
  const [limit, setLimit] = useState(12);
  useEffect(() => {
    function sync() {
      const next = filtersFromParams(new URLSearchParams(window.location.search));
      setFilters(next);
      setDraft(next.query);
      setLimit(12);
    }
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  const results = useMemo(() => filterJobs(jobs, filters), [jobs, filters]);
  const sources = useMemo(() => [...new Set(jobs.map((job) => job.source))].sort(), [jobs]);
  const activeCount = [
    filters.experience,
    filters.employmentType,
    filters.days,
    filters.salary,
    filters.source,
  ].filter(Boolean).length;
  function update(patch: Partial<JobFilters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    setLimit(12);
    const query = filtersToParams(next).toString();
    window.history.pushState(
      null,
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
    );
  }
  function reset() {
    setDraft('');
    update(DEFAULT_FILTERS);
  }
  return (
    <section id="jobs" className="jobs-section" aria-labelledby="jobs-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Find your next chapter</p>
          <h2 id="jobs-heading">{compact ? 'A world of opportunity.' : 'Explore remote jobs.'}</h2>
        </div>
        <span className="count-badge">{jobs.length.toLocaleString('en-US')} recent listings</span>
      </div>
      <form
        className="search-form"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          update({ query: draft });
        }}
      >
        <Search size={21} aria-hidden="true" />
        <label className="sr-only" htmlFor="job-search">
          Search job titles, companies, or skills
        </label>
        <input
          id="job-search"
          type="search"
          name="q"
          placeholder="Job title, company, or skill…"
          autoComplete="off"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={150}
        />
        <button className="button button-primary" type="submit">
          Search jobs{' '}
          <span className="search-arrow" aria-hidden="true">
            ↗
          </span>
        </button>
      </form>
      <div className="filter-toolbar">
        <div className="quick-filters">
          <span className="muted popular-label">Popular:</span>
          {['React', 'Python', 'TypeScript', 'Backend'].map((term) => (
            <button
              type="button"
              className="filter-chip"
              aria-pressed={filters.query.toLowerCase() === term.toLowerCase()}
              key={term}
              onClick={() => {
                const query = filters.query.toLowerCase() === term.toLowerCase() ? '' : term;
                setDraft(query);
                update({ query });
              }}
            >
              {term}
            </button>
          ))}
        </div>
        <button
          className="filter-toggle"
          type="button"
          aria-expanded={showFilters}
          aria-controls="advanced-filters"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          Filters{activeCount ? ` (${activeCount})` : ''}
        </button>
      </div>
      {showFilters && (
        <div id="advanced-filters" className="filter-panel">
          <label>
            Experience
            <select
              value={filters.experience}
              onChange={(e) => update({ experience: e.target.value })}
            >
              <option value="">Any experience</option>
              <option value="intern">Internship</option>
              <option value="junior">Junior / entry</option>
              <option value="mid">Mid level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead / staff</option>
            </select>
          </label>
          <label>
            Job type
            <select
              value={filters.employmentType}
              onChange={(e) => update({ employmentType: e.target.value })}
            >
              <option value="">Any job type</option>
              <option value="FULL_TIME">Full time</option>
              <option value="PART_TIME">Part time</option>
              <option value="CONTRACTOR">Contract / freelance</option>
              <option value="INTERN">Internship</option>
              <option value="TEMPORARY">Temporary</option>
              <option value="VOLUNTEER">Volunteer</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label>
            Posted or updated
            <select value={filters.days} onChange={(e) => update({ days: e.target.value })}>
              <option value="">Last 30 days</option>
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </label>
          <label>
            Source
            <select value={filters.source} onChange={(e) => update({ source: e.target.value })}>
              <option value="">All sources</option>
              {sources.map((source) => (
                <option key={source}>{source}</option>
              ))}
            </select>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.salary}
              onChange={(e) => update({ salary: e.target.checked })}
            />
            Salary listed
          </label>
          <p className="filter-note">
            Experience and job type use source fields when available, with text-based fallbacks.
            Confirm details with the employer.
          </p>
        </div>
      )}
      <div className="results-toolbar">
        <p role="status" aria-live="polite">
          <strong>{results.length.toLocaleString('en-US')}</strong>{' '}
          {results.length === 1 ? 'opportunity' : 'opportunities'}
          {filters.query && (
            <>
              {' '}
              for <strong>“{filters.query}”</strong>
            </>
          )}
        </p>
        <div>
          {(activeCount > 0 || filters.query) && (
            <button className="text-button" onClick={reset}>
              <X size={14} aria-hidden="true" />
              Clear filters
            </button>
          )}
          <label className="sort-label">
            <span className="sr-only">Sort jobs</span>
            <select value={filters.sort} onChange={(e) => update({ sort: e.target.value })}>
              <option value="newest">Newest first</option>
              <option value="company">Company A–Z</option>
            </select>
          </label>
        </div>
      </div>
      {results.length ? (
        <>
          <div className="jobs-grid">
            {results.slice(0, limit).map((job) => (
              <JobCard job={job} key={job.id} />
            ))}
          </div>
          <div className="load-more">
            <p>
              Showing {Math.min(limit, results.length)} of {results.length} opportunities
            </p>
            {limit < results.length && (
              <button
                className="button button-secondary"
                onClick={() => setLimit((previous) => previous + 12)}
              >
                Show more jobs <ArrowDown size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <Search size={32} aria-hidden="true" />
          <h3>No jobs match these filters.</h3>
          <p>Try a different skill or clear the filters to see more opportunities.</p>
          <button className="button button-secondary" onClick={reset}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset all filters
          </button>
        </div>
      )}
      <noscript>
        <p>
          JavaScript enables filtering and saved jobs. You can still read these listings and{' '}
          <a href="/feed.xml">browse the RSS feed</a>.
        </p>
      </noscript>
    </section>
  );
}
