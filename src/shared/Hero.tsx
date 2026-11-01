import { ArrowUpRight, Check, Search } from 'lucide-react';
import type { JobSummary } from './jobs';

export default function Hero({ total }: { jobs?: JobSummary[]; total: number }) {
  return (
    <section className="search-hero" aria-labelledby="home-heading">
      <div className="hero-topline">
        <p className="eyebrow">
          <span className="status-dot" /> Your next chapter, on your terms
        </p>
        <span className="hero-index">REMOTE / TECH / OPPORTUNITY</span>
      </div>
      <div className="hero-intro">
        <h1 id="home-heading">
          Remote developer jobs.
          <br />
          <span>Find your kind of work.</span>
        </h1>
        <p>
          One place to find your next role.
          <br />
          Search {total.toLocaleString('en-US')} recent listings, save the good ones, and make your
          next move.
        </p>
      </div>
      <form
        action="/jobs"
        method="get"
        role="search"
        className="search-form hero-search"
        data-track-search="home"
      >
        <Search size={22} aria-hidden="true" />
        <label className="sr-only" htmlFor="hero-search">
          Search job titles, companies, or skills
        </label>
        <input
          id="hero-search"
          name="q"
          type="search"
          placeholder="Job title, company, or skill…"
          maxLength={150}
          autoComplete="off"
        />
        <button type="submit" className="button button-primary">
          Search jobs <ArrowUpRight size={18} aria-hidden="true" />
        </button>
      </form>
      <div className="hero-under-search">
        <div className="quick-filters" aria-label="Popular job searches">
          <span className="muted popular-label">Popular searches</span>
          {['React', 'Python', 'TypeScript', 'Backend'].map((term) => (
            <a className="filter-chip" href={`/jobs?q=${term}`} key={term}>
              {term}
            </a>
          ))}
        </div>
        <div className="hero-benefits">
          <span>
            <Check size={14} aria-hidden="true" />
            Free to use
          </span>
          <span>
            <Check size={14} aria-hidden="true" />
            No sign-up
          </span>
        </div>
      </div>
    </section>
  );
}
