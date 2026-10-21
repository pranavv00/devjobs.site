'use client';
import { useSyncExternalStore } from 'react';
import { ArrowUpRight, Bookmark, BriefcaseBusiness, Sparkles } from 'lucide-react';

const links = [
  { href: '/jobs', label: 'Find a job', icon: BriefcaseBusiness },
  { href: '/matches', label: 'For you', icon: Sparkles },
  { href: '/saved', label: 'Saved jobs', icon: Bookmark },
];
const subscribe = (callback: () => void) => {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
};
export default function Navigation() {
  const path = useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => '/',
  );
  return (
    <>
      <header className="site-header">
        <div className="shell header-inner">
          <a href="/" className="brand" aria-label="DevJobs home">
            <span className="brand-symbol" aria-hidden="true">
              /_
            </span>
            devjobs<span className="brand-dot">.</span>
          </a>
          <nav aria-label="Main navigation" className="desktop-nav">
            {links.map(({ href, label }) => (
              <a key={href} href={href} aria-current={path.startsWith(href) ? 'page' : undefined}>
                {label}
              </a>
            ))}
          </nav>
          <a href="/about" className="header-about">
            How it works <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {links.map(({ href, label, icon: Icon }) => (
          <a key={href} href={href} aria-current={path.startsWith(href) ? 'page' : undefined}>
            <Icon size={20} aria-hidden="true" />
            {label}
          </a>
        ))}
      </nav>
    </>
  );
}
