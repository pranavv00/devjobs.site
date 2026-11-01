'use client';
import { Analytics } from '@vercel/analytics/next';
import { useEffect } from 'react';
import { trackEvent } from '@/shared/analytics';

export default function SiteAnalytics() {
  useEffect(() => {
    function onSubmit(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.dataset.trackSearch !== 'home') return;
      trackEvent('search_jobs', {
        has_query: Boolean(new FormData(form).get('q')),
        has_location: false,
        salary: false,
      });
    }
    document.addEventListener('submit', onSubmit);
    return () => document.removeEventListener('submit', onSubmit);
  }, []);
  return (
    <Analytics
      beforeSend={(event) => {
        if (navigator.doNotTrack === '1') return null;
        const url = new URL(event.url);
        url.search = '';
        url.hash = '';
        return { ...event, url: url.toString() };
      }}
    />
  );
}
