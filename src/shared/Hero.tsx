import { ArrowDown, ArrowUpRight, Bookmark, Check, Code2 } from 'lucide-react';
import type { JobSummary } from './jobs';

export default function Hero({ jobs, total }: { jobs: JobSummary[]; total: number }) {
  const sample = jobs.slice(0, 2);
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="status-dot" />A better way to find your next role
        </p>
        <h1>
          Great work.
          <br />
          From <span>anywhere.</span>
        </h1>
        <p className="hero-description">
          Find your next remote developer job. Less searching, more possibility. Your opportunities
          and applications, all in one place.
        </p>
        <div className="hero-actions">
          <a href="#jobs" className="button button-primary">
            Explore the jobs <ArrowDown size={17} aria-hidden="true" />
          </a>
          <a href="/saved" className="button button-quiet">
            Your saved jobs <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
        <div className="hero-benefits">
          <span>
            <Check size={15} aria-hidden="true" />
            Free to use
          </span>
          <span>
            <Check size={15} aria-hidden="true" />
            No account needed
          </span>
          <span>
            <Check size={15} aria-hidden="true" />
            Your data stays here
          </span>
        </div>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="hero-grid" />
        <div className="preview-window">
          <div className="preview-toolbar">
            <div className="window-dots">
              <i />
              <i />
              <i />
            </div>
            <span>your next chapter</span>
            <Code2 size={16} />
          </div>
          <div className="preview-heading">
            <span>Good things ahead.</span>
            <span className="preview-count">{total} roles</span>
          </div>
          {sample.map((job, i) => (
            <div className="preview-job" key={job.id}>
              <div className={`company-avatar avatar-${i}`}>
                {job.company.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <strong>{job.title}</strong>
                <span>{job.company}</span>
              </div>
              <Bookmark size={17} />
            </div>
          ))}
          <div className="preview-bottom">
            <span className="status-dot" />
            One step closer to what’s next.
            <ArrowUpRight size={15} />
          </div>
        </div>
        <div className="floating-note">
          <span className="note-icon">
            <Check size={16} />
          </span>
          <div>
            A little more possibility.<span>A lot less spreadsheet.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
