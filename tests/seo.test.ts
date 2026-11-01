import test from 'node:test';
import assert from 'node:assert/strict';
import type { JobSummary } from '../src/shared/jobs';
import { relatedJobs } from '../src/shared/related-jobs';

const job: JobSummary = {
  id: 'original',
  slug: 'original',
  title: 'React frontend engineer',
  company: 'Example',
  url: 'https://example.com/job',
  source: 'Example',
  posted_at: '2026-10-30T00:00:00Z',
  salary: '',
  location: 'Remote',
  tags: ['React'],
  excerpt: '',
  experience: '',
  employmentType: '',
  archived: false,
};

test('related jobs exclude expired, current, unrelated and duplicate employer/title listings', () => {
  const candidates: JobSummary[] = [
    job,
    { ...job, id: 'expired', archived: true },
    { ...job, id: 'same-title-other-location', location: 'Canada' },
    { ...job, id: 'unrelated', title: 'Accountant', tags: [], company: 'Unrelated' },
    { ...job, id: 'one', company: 'One' },
    { ...job, id: 'one-duplicate', company: 'One', location: 'Canada' },
    { ...job, id: 'two', company: 'Two' },
    { ...job, id: 'three', company: 'Three' },
    { ...job, id: 'four', company: 'Four' },
  ];
  const before = structuredClone(candidates);
  assert.deepEqual(
    relatedJobs(job, candidates).map(({ id }) => id),
    ['one', 'two', 'three'],
  );
  assert.deepEqual(candidates, before, 'ranking must not mutate its input');
});

test('related jobs prefer role overlap and use recency to break equal relevance', () => {
  const candidates: JobSummary[] = [
    { ...job, id: 'skill-only', company: 'One', title: 'React Native engineer' },
    { ...job, id: 'old-role', company: 'Two', posted_at: '2026-10-25T00:00:00Z' },
    { ...job, id: 'new-role', company: 'Three', posted_at: '2026-10-31T00:00:00Z' },
  ];
  assert.deepEqual(
    relatedJobs(job, candidates).map(({ id }) => id),
    ['new-role', 'old-role', 'skill-only'],
  );
  assert.deepEqual(relatedJobs({ ...job, title: 'Accountant', tags: [] }, candidates), []);
});
