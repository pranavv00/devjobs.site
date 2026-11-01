import { track } from '@vercel/analytics';

/** Optional, real interactions only. Never send search terms, saved skills, or destination URLs. */
export function trackEvent(
  name: 'search_jobs' | 'filter_jobs' | 'save_job' | 'unsave_job' | 'apply_click' | 'view_job',
  data: Record<string, string | number | boolean> = {},
) {
  if (
    process.env.NEXT_PUBLIC_ENABLE_ENGAGEMENT_ANALYTICS !== 'true' ||
    typeof window === 'undefined' ||
    navigator.doNotTrack === '1'
  )
    return;
  try {
    track(name, data);
  } catch {
    /* Analytics must never interrupt discovery or saving. */
  }
}
