'use client';
import { useState } from 'react';
import { Bookmark, Download, GripVertical } from 'lucide-react';
import { csvCell } from './jobs';
import { useSavedJobs, type JobStatus } from './storage';
import JobCard from './JobCard';
const COLUMNS: { id: JobStatus; title: string }[] = [
  { id: 'saved', title: 'Saved' },
  { id: 'applied', title: 'Applied' },
  { id: 'interviewing', title: 'Interviewing' },
  { id: 'offer', title: 'Offer' },
];
export default function SavedJobs() {
  const { savedJobs, jobStatuses, updateJobStatus } = useSavedJobs();
  const [error, setError] = useState('');
  function move(id: string, status: JobStatus) {
    setError(
      updateJobStatus(id, status)
        ? ''
        : 'Could not update the status. Browser storage may be full or disabled.',
    );
  }
  function exportCsv() {
    const rows = [
      ['Title', 'Company', 'Location', 'Salary', 'Status', 'Source URL', 'Tags'],
      ...savedJobs.map((job) => [
        job.title,
        job.company,
        job.location,
        job.salary,
        jobStatuses[job.id] || 'saved',
        job.url,
        job.tags.join(', '),
      ]),
    ];
    const blob = new Blob(['\uFEFF', rows.map((row) => row.map(csvCell).join(',')).join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob),
      link = document.createElement('a');
    link.href = url;
    link.download = 'devjobs-applications.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="page-content">
      <div className="page-heading heading-with-action">
        <div>
          <p className="eyebrow">Keep your next move in sight</p>
          <h1>Your application board.</h1>
          <p>Save a role. Take the next step. Track it all here.</p>
        </div>
        {savedJobs.length > 0 && (
          <button className="button button-secondary" onClick={exportCsv}>
            <Download size={16} aria-hidden="true" />
            Export CSV
          </button>
        )}
      </div>
      <p className="storage-note">
        Stored in this browser only. Export a backup before clearing browser data. Move cards with
        drag and drop or the status menu.
      </p>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      {savedJobs.length ? (
        <div className="application-board">
          {COLUMNS.map((column) => {
            const jobs = savedJobs.filter((job) => (jobStatuses[job.id] || 'saved') === column.id);
            return (
              <section
                className={`board-column column-${column.id}`}
                key={column.id}
                aria-label={`${column.title} jobs`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const id = event.dataTransfer.getData('text/plain');
                  if (savedJobs.some((job) => job.id === id)) move(id, column.id);
                }}
              >
                <h2>
                  <span className="column-dot" />
                  {column.title}
                  <span>{jobs.length}</span>
                </h2>
                <div className="board-cards">
                  {jobs.map((job) => (
                    <div className="board-item" key={job.id}>
                      <div className="board-controls">
                        <span
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData('text/plain', job.id);
                            event.dataTransfer.effectAllowed = 'move';
                          }}
                          className="drag-handle"
                          title="Drag to another column"
                          aria-hidden="true"
                        >
                          <GripVertical size={16} />
                        </span>
                        <label>
                          <span className="sr-only">Status for {job.title}</span>
                          <select
                            value={column.id}
                            onChange={(event) => move(job.id, event.target.value as JobStatus)}
                          >
                            {COLUMNS.map((c) => (
                              <option value={c.id} key={c.id}>
                                {c.title}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <JobCard job={job} />
                    </div>
                  ))}
                  {!jobs.length && (
                    <p className="column-empty">
                      Your {column.title.toLowerCase()} roles will appear here.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Bookmark size={32} aria-hidden="true" />
          <h2>A good opportunity is worth saving.</h2>
          <p>Tap the bookmark on any job to start building your shortlist.</p>
          <a href="/jobs" className="button button-primary">
            Find your next role ↗
          </a>
        </div>
      )}
    </div>
  );
}
