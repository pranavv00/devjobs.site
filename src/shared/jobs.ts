/** Compact, serializable records used by both frontends. */
export interface JobSummary {
  id: string;
  slug: string;
  title: string;
  company: string;
  url: string;
  source: string;
  posted_at: string;
  /** The discovery date is an update date only when the source omits publication time. */
  dateKind?: 'updated';
  salary: string;
  location: string;
  tags: string[];
  excerpt: string;
  experience: string;
  employmentType: string;
  archived: boolean;
}
export interface Job extends JobSummary {
  description: string;
  validThrough?: string;
  applicantCountries: string[];
  applyUrl?: string;
  lastSeenAt?: string;
  firstSeenAt?: string;
  timezoneRestrictions?: string[];
  sourceEmploymentType?: string;
  experienceLevel?: string;
  companyLogo?: string;
  companyUrl?: string;
  categories?: string[];
  allowSyndication?: boolean;
  salaryDetails?: { min?: number; max?: number; currency: string; period: string };
}
export const DAY = 86_400_000;
export const MAX_JOB_AGE_DAYS = 30;
export const SKILLS = [
  'React',
  'TypeScript',
  'JavaScript',
  'Python',
  'Node.js',
  'Go',
  'Java',
  'Rust',
  'C++',
  'C#',
  '.NET',
  'PHP',
  'Ruby',
  'SQL',
  'AWS',
  'Docker',
  'Kubernetes',
  'Swift',
  'Kotlin',
  'Flutter',
  'Machine learning',
] as const;
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
/** Preserve URL-derived identifiers so saved jobs survive the upgrade. */
export function stableId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(16).padStart(8, '0');
}
export function generateJobSlug(job: Pick<JobSummary, 'title' | 'company' | 'id'>): string {
  return `${slugify(`${job.title}-${job.company}`).slice(0, 140) || 'role'}-${job.id}`;
}
export function legacyJobSlug(job: Pick<JobSummary, 'title' | 'company'>): string {
  return `${job.title}-${job.company}`
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
export function matchesTerm(text: string, term: string): boolean {
  const escaped = term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!escaped) return false;
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?=$|[^a-z0-9+#])`, 'i').test(text);
}
export function matchScore(job: JobSummary, skills: string[]): number {
  if (!skills.length) return 0;
  const text = `${job.title} ${job.tags.join(' ')} ${job.excerpt}`;
  return Math.round(
    (skills.filter((skill) => matchesTerm(text, skill)).length / skills.length) * 100,
  );
}
export interface JobFilters {
  query: string;
  experience: string;
  employmentType: string;
  days: string;
  salary: boolean;
  source: string;
  sort: string;
}
export const DEFAULT_FILTERS: JobFilters = {
  query: '',
  experience: '',
  employmentType: '',
  days: '',
  salary: false,
  source: '',
  sort: 'newest',
};
export function filtersFromParams(params: URLSearchParams): JobFilters {
  return {
    query: (params.get('q') || '').slice(0, 150),
    experience: ['junior', 'mid', 'senior', 'lead', 'intern'].includes(
      params.get('experience') || '',
    )
      ? params.get('experience')!
      : '',
    employmentType: [
      'FULL_TIME',
      'PART_TIME',
      'CONTRACTOR',
      'INTERN',
      'TEMPORARY',
      'VOLUNTEER',
      'OTHER',
    ].includes(params.get('type') || '')
      ? params.get('type')!
      : '',
    days: ['1', '7', '30'].includes(params.get('days') || '') ? params.get('days')! : '',
    salary: params.get('salary') === '1',
    source: (params.get('source') || '').slice(0, 50),
    sort: params.get('sort') === 'company' ? 'company' : 'newest',
  };
}
export function filtersToParams(filters: JobFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set('q', filters.query.trim());
  if (filters.experience) params.set('experience', filters.experience);
  if (filters.employmentType) params.set('type', filters.employmentType);
  if (filters.days) params.set('days', filters.days);
  if (filters.salary) params.set('salary', '1');
  if (filters.source) params.set('source', filters.source);
  if (filters.sort !== 'newest') params.set('sort', filters.sort);
  return params;
}
export function filterJobs(
  jobs: JobSummary[],
  filters: JobFilters,
  now = Date.now(),
): JobSummary[] {
  const terms = filters.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return jobs
    .filter((job) => {
      const text = `${job.title} ${job.company} ${job.tags.join(' ')} ${job.excerpt}`.toLowerCase();
      const age = now - Date.parse(job.posted_at);
      return (
        terms.every((term) => matchesTerm(text, term)) &&
        (!filters.experience || job.experience === filters.experience) &&
        (!filters.employmentType || job.employmentType === filters.employmentType) &&
        (!filters.source || job.source === filters.source) &&
        (!filters.salary || Boolean(job.salary)) &&
        (!filters.days || (age >= 0 && age <= Number(filters.days) * DAY))
      );
    })
    .sort((a, b) =>
      filters.sort === 'company'
        ? a.company.localeCompare(b.company)
        : (Date.parse(b.posted_at) || 0) - (Date.parse(a.posted_at) || 0),
    );
}
export function displayDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date not provided'
    : date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      });
}
export function csvCell(value: string): string {
  const safe = /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
