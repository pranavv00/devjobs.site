'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page-content">
      <div className="empty-state" role="alert">
        <h1>Something went wrong.</h1>
        <p>We couldn’t load this page. Please try again.</p>
        <button className="button button-primary" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
