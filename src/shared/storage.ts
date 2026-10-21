'use client';
import { useMemo, useSyncExternalStore } from 'react';
import { generateJobSlug, stableId, type JobSummary } from './jobs';

const EVENT = 'devjobs-storage';
const STATUS_VALUES = ['saved', 'applied', 'interviewing', 'offer'] as const;
export type JobStatus = (typeof STATUS_VALUES)[number];
type StorageKey = 'savedJobs' | 'jobStatuses' | 'userSkills';
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(EVENT, callback);
  };
}
function read(key: StorageKey): string {
  try {
    return window.localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}
function parse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
function validateStatuses(value: unknown): Record<string, JobStatus> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (Object.fromEntries(
        Object.entries(value).filter(([, status]) => STATUS_VALUES.includes(status as JobStatus)),
      ) as Record<string, JobStatus>)
    : {};
}
export function writeStorage(key: StorageKey, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(EVENT));
    return true;
  } catch {
    return false;
  }
}
export function validateSavedJobs(value: unknown): JobSummary[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.slice(0, 1000).flatMap((raw) => {
    if (
      !raw ||
      typeof raw !== 'object' ||
      typeof raw.title !== 'string' ||
      typeof raw.company !== 'string' ||
      typeof raw.url !== 'string'
    )
      return [];
    try {
      if (!['http:', 'https:'].includes(new URL(raw.url).protocol)) return [];
    } catch {
      return [];
    }
    const id =
      typeof raw.id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(raw.id)
        ? raw.id
        : stableId(raw.url);
    if (seen.has(id)) return [];
    seen.add(id);
    const job: JobSummary = {
      id,
      slug: generateJobSlug({ id, title: raw.title, company: raw.company }),
      title: raw.title,
      company: raw.company,
      url: raw.url,
      source: typeof raw.source === 'string' ? raw.source : 'Job board',
      posted_at: typeof raw.posted_at === 'string' ? raw.posted_at : '',
      ...(raw.dateKind === 'updated' ? { dateKind: 'updated' as const } : {}),
      salary: typeof raw.salary === 'string' ? raw.salary : '',
      location:
        typeof raw.location === 'string' ? raw.location : 'Remote · check location requirements',
      tags: Array.isArray(raw.tags)
        ? raw.tags.filter((tag: unknown): tag is string => typeof tag === 'string').slice(0, 25)
        : [],
      excerpt: typeof raw.excerpt === 'string' ? raw.excerpt.slice(0, 180) : '',
      experience: typeof raw.experience === 'string' ? raw.experience : '',
      employmentType: typeof raw.employmentType === 'string' ? raw.employmentType : '',
      archived: raw.archived === true,
    };
    return [job];
  });
}
export function validateSkills(value: unknown): string[] {
  return Array.isArray(value)
    ? [
        ...new Set(
          value
            .filter((s): s is string => typeof s === 'string')
            .map((s) => s.trim().toLowerCase())
            .filter((s) => s.length > 0 && s.length <= 40),
        ),
      ].slice(0, 20)
    : [];
}
function useStorageValue(key: StorageKey) {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => '',
  );
}
export function useSavedJobs() {
  const raw = useStorageValue('savedJobs');
  const rawStatuses = useStorageValue('jobStatuses');
  const savedJobs = useMemo(() => validateSavedJobs(parse(raw)), [raw]);
  const jobStatuses = useMemo(() => validateStatuses(parse(rawStatuses)), [rawStatuses]);
  function toggleSave(job: JobSummary) {
    const current = validateSavedJobs(parse(read('savedJobs')));
    return writeStorage(
      'savedJobs',
      current.some((j) => j.id === job.id)
        ? current.filter((j) => j.id !== job.id)
        : [...current, job],
    );
  }
  function updateJobStatus(id: string, status: JobStatus) {
    if (!STATUS_VALUES.includes(status)) return false;
    return writeStorage('jobStatuses', {
      ...validateStatuses(parse(read('jobStatuses'))),
      [id]: status,
    });
  }
  return { savedJobs, jobStatuses, toggleSave, updateJobStatus };
}
export function useSkills() {
  const raw = useStorageValue('userSkills');
  const skills = useMemo(() => validateSkills(parse(raw)), [raw]);
  return {
    skills,
    saveSkills: (next: string[]) => writeStorage('userSkills', validateSkills(next)),
  };
}
