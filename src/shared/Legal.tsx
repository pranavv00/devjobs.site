export function Privacy() {
  return (
    <article className="prose-page">
      <p className="eyebrow">Your browser. Your shortlist.</p>
      <h1>Privacy policy</h1>
      <p>This page explains how this version of DevJobs handles data.</p>
      <h2>Saved jobs and skills</h2>
      <p>
        Saved jobs, application statuses, and skills are stored in your browser’s local storage. The
        site does not send that data to a DevJobs account or database. It is not synced between
        devices. You can remove individual jobs and skills in the interface or clear this site’s
        data in your browser settings. Export a CSV first if you want a backup.
      </p>
      <h2>Requests and hosting</h2>
      <p>
        Like other websites, opening DevJobs sends requests to its hosting provider. Those requests
        can include an IP address, browser information, and the page address. Search filters are
        included in the URL so they can be shared; avoid putting private information into searches
        or shared links. This version does not load advertising or third-party analytics scripts.
      </p>
      <h2>External websites</h2>
      <p>
        Job applications take place on external job boards or employer websites. Their privacy
        policies apply when you visit them. DevJobs does not collect your CV or application
        materials.
      </p>
      <h2>Questions</h2>
      <p>
        For site-related questions, use the{' '}
        <a
          href="https://github.com/pranavv00/devjobs.site/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          project’s issue tracker
        </a>
        . Do not post personal application information in a public issue.
      </p>
      <p className="updated">Last updated: October 21, 2026</p>
    </article>
  );
}
export function Terms() {
  return (
    <article className="prose-page">
      <p className="eyebrow">Using DevJobs</p>
      <h1>Terms of service</h1>
      <p>
        DevJobs helps you discover jobs and organize your own applications. By using the site, you
        agree to use it responsibly and to respect the original job sources.
      </p>
      <h2>Listings and applications</h2>
      <p>
        Job information comes from third-party sources. Openings, salaries, location requirements,
        and descriptions may change or become unavailable. Confirm the details on the original
        listing before applying. DevJobs is not the employer and does not process applications or
        guarantee an interview, offer, or hiring outcome.
      </p>
      <h2>Your saved data</h2>
      <p>
        The tracker uses browser storage and is provided without a synchronization or backup
        service. Export your saved jobs if you need a durable copy. Browser settings, device
        changes, or clearing site data can remove saved information.
      </p>
      <h2>Responsible use</h2>
      <p>
        Do not misuse the service, interfere with its operation, or use it to distribute harmful
        content. Source listings remain subject to their owners’ terms. The site links to those
        sources to support attribution and applications.
      </p>
      <h2>Availability and changes</h2>
      <p>
        The service is provided as available. Features and listings may change, and access may be
        interrupted. Material changes to these terms will be reflected on this page.
      </p>
      <h2>Privacy and questions</h2>
      <p>
        Read the <a href="/privacy">privacy policy</a> for details about browser storage and
        external links. Site feedback can be shared through the{' '}
        <a
          href="https://github.com/pranavv00/devjobs.site/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          project’s issue tracker
        </a>
        .
      </p>
      <p className="updated">Last updated: October 21, 2026</p>
    </article>
  );
}
