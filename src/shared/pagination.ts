/** Keep discovery payloads bounded as the source snapshot grows. */
export const JOBS_PER_PAGE = 12;

export function paginate<T>(items: T[], requestedPage: string | undefined) {
  const parsed = Number(requestedPage);
  const pages = Math.max(1, Math.ceil(items.length / JOBS_PER_PAGE));
  const page = Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, pages) : 1;
  const start = (page - 1) * JOBS_PER_PAGE;
  return {
    items: items.slice(start, start + JOBS_PER_PAGE),
    page,
    pages,
    start,
    total: items.length,
  };
}
