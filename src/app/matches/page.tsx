import { pageMetadata } from '@/lib/metadata';
import { getActiveJobs, toSummary } from '@/shared/data';
import Matches from '@/shared/Matches';
export const revalidate = 3600;
export const metadata = pageMetadata({
  title: 'Jobs for your skills',
  description:
    'Find remote jobs that mention your skills. Keyword matching is local to your browser.',
  path: '/matches',
  noindex: true,
});
export default function MatchesPage() {
  return <Matches jobs={getActiveJobs().map(toSummary)} />;
}
