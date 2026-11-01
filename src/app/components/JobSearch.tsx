'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ArrowUpRight, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { filtersFromParams, filtersToParams, type JobFilters } from '@/shared/jobs';
import { trackEvent } from '@/shared/analytics';

export default function JobSearch({
  filters,
  sources,
}: {
  filters: JobFilters;
  sources: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [previousFilters, setPreviousFilters] = useState(filters);
  const [fields, setFields] = useState(filters);
  // A committed navigation (including Back and reset) replaces the complete draft.
  // Keep the controls mounted so keyboard focus survives changes.
  if (previousFilters !== filters) {
    setPreviousFilters(filters);
    setFields(filters);
  }
  function edit(patch: Partial<JobFilters>) {
    setFields((current) => ({ ...current, ...patch }));
  }
  const active = Boolean(
    filters.query ||
    filters.location ||
    filters.experience ||
    filters.employmentType ||
    filters.days ||
    filters.salary ||
    filters.source,
  );
  const advanced = Boolean(
    filters.experience ||
    filters.employmentType ||
    filters.days ||
    filters.salary ||
    filters.source,
  );

  function navigate(form: HTMLFormElement, eventName: 'search_jobs' | 'filter_jobs') {
    const values = new URLSearchParams();
    new FormData(form).forEach((value, key) => {
      if (typeof value === 'string') values.set(key, value);
    });
    const next = filtersFromParams(values);
    const params = filtersToParams(next).toString();
    trackEvent(eventName, {
      has_query: Boolean(next.query),
      has_location: Boolean(next.location),
      salary: next.salary,
    });
    startTransition(() => router.push(`/jobs${params ? `?${params}` : ''}`, { scroll: false }));
  }

  return (
    <form
      action="/jobs"
      method="get"
      role="search"
      className="directory-search"
      onSubmit={(event) => {
        event.preventDefault();
        navigate(event.currentTarget, 'search_jobs');
      }}
      aria-busy={pending}
    >
      <fieldset>
        <legend className="sr-only">Find remote jobs</legend>
        <div className="search-form directory-searchbar">
          <div className="search-field">
            <Search size={20} aria-hidden="true" />
            <label className="sr-only" htmlFor="job-search">
              Search job titles, companies, or skills
            </label>
            <input
              id="job-search"
              type="search"
              name="q"
              placeholder="Job title, company, or skill…"
              value={fields.query}
              onChange={(event) => edit({ query: event.target.value })}
              maxLength={150}
              autoComplete="off"
            />
          </div>
          <div className="search-field location-field">
            <MapPin size={18} aria-hidden="true" />
            <label className="sr-only" htmlFor="job-location">
              Location mentioned in listing
            </label>
            <input
              id="job-location"
              type="search"
              name="location"
              placeholder="Country or region"
              value={fields.location}
              onChange={(event) => edit({ location: event.target.value })}
              maxLength={100}
              autoComplete="off"
            />
          </div>
          <button className="button button-primary" type="submit">
            Search jobs <ArrowUpRight size={17} aria-hidden="true" />
          </button>
        </div>
        <p className="location-hint">
          Location searches the employer’s listing. Always confirm country and work authorization
          requirements.
        </p>
        <details className="search-filters" open={advanced || undefined}>
          <summary className="filter-toggle" role="button">
            <SlidersHorizontal size={16} aria-hidden="true" />
            Filters
          </summary>
          <div
            className="filter-panel"
            onChange={(event) => {
              const form = event.currentTarget.closest('form');
              if (form) navigate(form, 'filter_jobs');
            }}
          >
            <label>
              Experience
              <select
                aria-label="Experience"
                name="experience"
                value={fields.experience}
                onChange={(event) => edit({ experience: event.target.value })}
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
                aria-label="Job type"
                name="type"
                value={fields.employmentType}
                onChange={(event) => edit({ employmentType: event.target.value })}
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
              <select
                aria-label="Posted or updated"
                name="days"
                value={fields.days}
                onChange={(event) => edit({ days: event.target.value })}
              >
                <option value="">Last 30 days</option>
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
              </select>
            </label>
            <label>
              Source
              <select
                aria-label="Source"
                name="source"
                value={fields.source}
                onChange={(event) => edit({ source: event.target.value })}
              >
                <option value="">All sources</option>
                {sources.map((source) => (
                  <option key={source}>{source}</option>
                ))}
              </select>
            </label>
            <label className="checkbox-label">
              <input
                aria-label="Salary listed"
                type="checkbox"
                name="salary"
                value="1"
                checked={fields.salary}
                onChange={(event) => edit({ salary: event.target.checked })}
              />
              Salary listed
            </label>
            <p className="filter-note">
              Experience and job type use source fields when available, with text-based fallbacks.
            </p>
          </div>
        </details>
        <div className="search-options">
          <div className="quick-filters">
            {['React', 'Python', 'TypeScript', 'Backend'].map((term) => {
              const params = filtersToParams({ ...filters, query: term });
              return (
                <a className="filter-chip" href={`/jobs?${params}`} key={term}>
                  {term}
                </a>
              );
            })}
          </div>
          <label className="sort-label">
            <span className="sr-only">Sort jobs</span>
            <select
              name="sort"
              value={fields.sort}
              onChange={(event) => {
                edit({ sort: event.target.value });
                navigate(event.currentTarget.form!, 'filter_jobs');
              }}
            >
              <option value="newest">Newest first</option>
              <option value="company">Company A–Z</option>
            </select>
          </label>
        </div>
        {active && (
          <a
            className="text-button clear-search"
            href="/jobs"
            onClick={(event) => {
              event.preventDefault();
              startTransition(() => router.push('/jobs', { scroll: false }));
            }}
          >
            Clear all filters
          </a>
        )}
        <noscript>
          <p className="small-text">
            Choose your filters, then select Search jobs to update the results.
          </p>
        </noscript>
      </fieldset>
      <p className="search-progress" role="status" aria-live="polite">
        {pending ? 'Finding matching jobs…' : ''}
      </p>
    </form>
  );
}
