import { getActiveJobs, toSummary } from '@/shared/data';
import { filterJobs, filtersFromParams } from '@/shared/jobs';
import { canSyndicate } from '@/shared/sources';
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const jobs = filterJobs(
    getActiveJobs().filter(canSyndicate).map(toSummary),
    filtersFromParams(params),
  );
  const integer = (value: string | null, fallback: number) =>
    value && /^\d+$/.test(value) ? Number(value) : fallback;
  const page = Math.max(1, Math.min(integer(params.get('page'), 1), 10000));
  const limit = Math.max(1, Math.min(integer(params.get('limit'), 24), 100));
  return Response.json(
    { jobs: jobs.slice((page - 1) * limit, page * limit), total: jobs.length, page, limit },
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300', 'X-Robots-Tag': 'noindex' } },
  );
}
