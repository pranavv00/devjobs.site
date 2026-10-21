import { getActiveJobs } from '@/shared/data';
import { rssFeed } from '@/shared/seo';
export const revalidate = 3600;
export function GET() {
  return new Response(rssFeed(getActiveJobs()), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
}
