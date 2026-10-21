import { getActiveJobs } from '@shared/data';
import { rssFeed } from '@shared/seo';
export function GET() {
  return new Response(rssFeed(getActiveJobs()), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
