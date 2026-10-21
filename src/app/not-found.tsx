export default function NotFound() {
  return (
    <div className="page-content">
      <div className="empty-state">
        <p className="eyebrow">404 · page not found</p>
        <h1>This opportunity has moved on.</h1>
        <p>
          The link may be outdated or the listing may have been removed. There are more
          opportunities to explore.
        </p>
        <a className="button button-primary" href="/jobs">
          Browse remote jobs ↗
        </a>
      </div>
    </div>
  );
}
