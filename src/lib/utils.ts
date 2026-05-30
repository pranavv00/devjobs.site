import { formatDistanceToNow, parseISO } from 'date-fns';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export function generateJobSlug(job: { title: string; company: string; id: string }): string {
  const base = slugify(`${job.title}-${job.company}`);
  // Use last 4 chars of ID for uniqueness and stability
  const shortId = job.id.slice(-4);
  return `${base}-${shortId}`;
}

export function formatDisplayDate(dateString: string): string {
  try {
    if (!dateString) return "";
    const date = parseISO(dateString);
    if (isNaN(date.getTime())) return "";
    
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "";
  }
}

export function isRecent(dateString: string): boolean {
  try {
    const date = parseISO(dateString);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return date > threeDaysAgo;
  } catch {
    return false;
  }
}
