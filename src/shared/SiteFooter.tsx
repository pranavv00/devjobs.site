export default function SiteFooter() {
  return (
    <footer className="site-footer shell">
      <div>
        <a href="/" className="brand">
          <span className="brand-symbol" aria-hidden="true">
            /_
          </span>
          devjobs<span className="brand-dot">.</span>
        </a>
        <p>Your next chapter starts with a good opportunity.</p>
      </div>
      <nav aria-label="Footer navigation">
        <a href="/about">About & sources</a>
        <a href="/feed.xml">RSS feed</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="https://github.com/pranavv00" target="_blank" rel="noopener noreferrer">
          GitHub ↗
        </a>
      </nav>
      <p className="footer-note">
        © {new Date().getUTCFullYear()} DevJobs. Applications happen on the original job board.
      </p>
    </footer>
  );
}
