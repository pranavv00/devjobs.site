'use client';
import { ArrowUpRight } from 'lucide-react';
import { trackEvent } from './analytics';

export default function ApplyLink({
  href,
  source,
  archived,
  label,
}: {
  href: string;
  source: string;
  archived: boolean;
  label?: string;
}) {
  return (
    <a
      className="button button-primary"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        if (!archived) trackEvent('apply_click', { source });
      }}
    >
      {label || (archived ? 'Check original listing' : 'View & apply')}
      <ArrowUpRight size={18} aria-hidden="true" />
    </a>
  );
}
