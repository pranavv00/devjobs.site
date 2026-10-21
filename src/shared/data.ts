import rawJobs from '../lib/jobs.json';
import { canSyndicate } from './sources';
import {
  DAY,
  MAX_JOB_AGE_DAYS,
  SKILLS,
  generateJobSlug,
  legacyJobSlug,
  matchesTerm,
  stableId,
  type Job,
  type JobSummary,
} from './jobs';

const string = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const stringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .flatMap((item) => {
      const label = plainText(string(item)).slice(0, 100);
      const key = label.toLowerCase();
      if (!label || seen.has(key)) return [];
      seen.add(key);
      return [label];
    })
    .slice(0, 40);
};
const positiveNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
const knownDate = (value: unknown, now: number) => {
  const date = Date.parse(string(value));
  return Number.isFinite(date) && date <= now ? new Date(date).toISOString() : undefined;
};

/** Convert to text; React/Astro escape the result instead of injecting source HTML. */
export function plainText(value: string): string {
  const entities: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    ndash: '–',
    mdash: '—',
    rsquo: '’',
    lsquo: '‘',
    ldquo: '“',
    rdquo: '”',
    bull: '•',
  };
  return value
    .replace(/<(script|style|iframe)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<li\b[^>]*>/gi, '\n• ')
    .replace(/<\/?(?:p|div|h[1-6]|ul|ol)\b[^>]*>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, key: string) => {
      if (key.startsWith('#')) {
        const code =
          key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
        return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
      }
      return entities[key.toLowerCase()] ?? entity;
    })
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}
export function safeUrl(value: unknown): string {
  try {
    const url = new URL(string(value));
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : '';
  } catch {
    return '';
  }
}
export function normalizeJobs(input: unknown, now = Date.now()): Job[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  return input
    .flatMap((value): Job[] => {
      const raw = record(value);
      const url = safeUrl(raw.url),
        title = plainText(string(raw.title)),
        company = plainText(string(raw.company));
      if (!url || !title || !company || seen.has(url)) return [];
      seen.add(url);
      const publication = knownDate(raw.posted_at, now);
      const update = knownDate(raw.updated_at, now);
      const timestamp = Date.parse(publication || update || '');
      const posted_at =
        Number.isFinite(timestamp) && timestamp <= now ? new Date(timestamp).toISOString() : '';
      const expires = Date.parse(string(raw.valid_through));
      const description = plainText(string(raw.description));
      const text = `${title} ${description}`;
      const id = /^[a-zA-Z0-9_-]{1,80}$/.test(string(raw.id)) ? string(raw.id) : stableId(url);
      const sourceExperience = string(raw.experience_level).toLowerCase();
      const experienceMap: Record<string, string> = {
        junior: 'junior',
        'entry-level': 'junior',
        'entry level': 'junior',
        mid: 'mid',
        'mid-level': 'mid',
        senior: 'senior',
        lead: 'lead',
        manager: 'lead',
        director: 'lead',
        executive: 'lead',
        intern: 'intern',
      };
      const experience =
        (Object.hasOwn(experienceMap, sourceExperience) ? experienceMap[sourceExperience] : '') ||
        (/\b(intern|internship|apprentice)\b/i.test(title)
          ? 'intern'
          : /\b(lead|staff|principal|manager)\b/i.test(title)
            ? 'lead'
            : /\b(senior|sr\.?)\b/i.test(title)
              ? 'senior'
              : /\b(junior|jr\.?|entry.level)\b/i.test(title)
                ? 'junior'
                : /\bmid.level\b/i.test(title)
                  ? 'mid'
                  : '');
      const sourceEmploymentType = [
        'FULL_TIME',
        'PART_TIME',
        'CONTRACTOR',
        'INTERN',
        'TEMPORARY',
        'VOLUNTEER',
        'OTHER',
      ].includes(string(raw.employment_type))
        ? string(raw.employment_type)
        : '';
      const employmentType = [
        'FULL_TIME',
        'PART_TIME',
        'CONTRACTOR',
        'INTERN',
        'TEMPORARY',
        'VOLUNTEER',
        'OTHER',
      ].includes(string(raw.employment_type))
        ? string(raw.employment_type)
        : /\bpart.time\b/i.test(text)
          ? 'PART_TIME'
          : /\b(contractor|freelance)\b/i.test(title)
            ? 'CONTRACTOR'
            : /\bfull.time\b/i.test(text)
              ? 'FULL_TIME'
              : experience === 'intern'
                ? 'INTERN'
                : '';
      const min = positiveNumber(raw.salary_min),
        max = positiveNumber(raw.salary_max);
      const currency = /^[A-Z]{3}$/.test(string(raw.salary_currency))
        ? string(raw.salary_currency)
        : '';
      const period = ['HOUR', 'DAY', 'WEEK', 'FORTNIGHT', 'MONTH', 'YEAR'].includes(
        string(raw.salary_period),
      )
        ? string(raw.salary_period)
        : '';
      const salaryDetails =
        (min || max) && (!min || !max || min <= max) && currency && period
          ? { min, max, currency, period }
          : undefined;
      const job: Job = {
        id,
        slug: generateJobSlug({ id, title, company }),
        title,
        company,
        url,
        source: string(raw.source) || 'External job board',
        posted_at,
        ...(!publication && update ? { dateKind: 'updated' as const } : {}),
        salary: plainText(string(raw.salary)),
        location: plainText(string(raw.location)) || 'Remote · check location requirements',
        description,
        tags: stringList([
          ...SKILLS.filter((skill) => matchesTerm(text, skill)),
          ...stringList(raw.tags),
        ]).slice(0, 30),
        excerpt: (plainText(string(raw.source_excerpt)) || description)
          .replace(/\s+/g, ' ')
          .slice(0, 180),
        experience,
        employmentType,
        sourceEmploymentType,
        experienceLevel: plainText(string(raw.experience_level)),
        applyUrl: safeUrl(raw.apply_url) || url,
        companyLogo: safeUrl(raw.company_logo),
        companyUrl: safeUrl(raw.company_url),
        lastSeenAt: knownDate(raw.last_seen_at, now),
        firstSeenAt: knownDate(raw.first_seen_at, now),
        timezoneRestrictions: stringList(raw.timezone_restrictions),
        categories: stringList(raw.categories),
        allowSyndication: canSyndicate({
          source: string(raw.source),
          allowSyndication: raw.allow_syndication !== false,
        }),
        salaryDetails,
        applicantCountries: Array.isArray(raw.applicant_countries)
          ? raw.applicant_countries.filter(
              (c): c is string => typeof c === 'string' && /^[A-Z]{2}$/.test(c),
            )
          : [],
        archived:
          !posted_at ||
          now - timestamp > MAX_JOB_AGE_DAYS * DAY ||
          (Number.isFinite(expires) && expires <= now),
        ...(Number.isFinite(expires) ? { validThrough: new Date(expires).toISOString() } : {}),
      };
      return [job];
    })
    .sort((a, b) => (Date.parse(b.posted_at) || 0) - (Date.parse(a.posted_at) || 0));
}
const database = normalizeJobs(rawJobs);
export function getAllJobs(): Job[] {
  const now = Date.now();
  return database.map((job) => ({
    ...job,
    archived:
      job.archived ||
      now - Date.parse(job.posted_at) > MAX_JOB_AGE_DAYS * DAY ||
      Boolean(job.validThrough && Date.parse(job.validThrough) <= now),
  }));
}
export function getActiveJobs(): Job[] {
  return getAllJobs().filter((job) => !job.archived);
}
export function toSummary(job: Job): JobSummary {
  // Explicit selection keeps rich source metadata and full descriptions off listing payloads.
  const {
    id,
    slug,
    title,
    company,
    url,
    source,
    posted_at,
    dateKind,
    salary,
    location,
    tags,
    excerpt,
    experience,
    employmentType,
    archived,
  } = job;
  return {
    id,
    slug,
    title,
    company,
    url,
    source,
    posted_at,
    ...(dateKind ? { dateKind } : {}),
    salary,
    location,
    tags,
    excerpt,
    experience,
    employmentType,
    archived,
  };
}
export function findJob(slug: string): Job | undefined {
  return (
    getAllJobs().find((job) => job.slug === slug || job.id === slug) ??
    getAllJobs().find((job) => legacyJobSlug(job) === slug)
  );
}
