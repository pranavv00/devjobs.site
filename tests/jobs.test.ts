import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_FILTERS,
  DAY,
  csvCell,
  filterJobs,
  filtersFromParams,
  filtersToParams,
  generateJobSlug,
  legacyJobSlug,
  matchesTerm,
} from '../src/shared/jobs';
import { getActiveJobs, getAllJobs, normalizeJobs, plainText, toSummary } from '../src/shared/data';
import { jobSchema, rssFeed, serializeJsonLd } from '../src/shared/seo';
import { validateSavedJobs, validateSkills } from '../src/shared/storage';
import { GET as getJobsApi } from '../src/app/api/jobs/route';

const NOW = Date.parse('2026-10-21T12:00:00Z');
const raw = {
  title: 'Senior React engineer',
  company: 'Example & Co',
  url: 'https://example.com/jobs/1',
  posted_at: '2026-10-20T10:00:00Z',
  description: '<h2>Build with React</h2><p>Use TypeScript &amp; Python.</p>',
  source: 'Example',
  salary: '$45-$120/Hour',
};
test('normalization rejects invalid links, incomplete records and duplicates', () => {
  const jobs = normalizeJobs(
    [
      raw,
      raw,
      { ...raw, url: 'javascript:alert(1)' },
      { ...raw, url: 'https://x.com', title: null },
    ],
    NOW,
  );
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].experience, 'senior');
  assert.deepEqual(jobs[0].tags, ['React', 'TypeScript', 'Python']);
  assert.equal(jobs[0].salary, raw.salary);
  assert.ok(!('description' in toSummary(jobs[0])));
});
test('missing, future and stale dates never become fresh jobs', () => {
  for (const posted_at of ['', 'invalid', '2027-01-01', '2026-08-01'])
    assert.equal(normalizeJobs([{ ...raw, posted_at }], NOW)[0].archived, true);
  assert.equal(
    normalizeJobs([{ ...raw, valid_through: '2026-10-21T10:00:00Z' }], NOW)[0].archived,
    true,
  );
});
test('same title and company produce distinct URLs and retain stable IDs', () => {
  const jobs = normalizeJobs([raw, { ...raw, url: 'https://example.com/jobs/2' }], NOW);
  assert.notEqual(generateJobSlug(jobs[0]), generateJobSlug(jobs[1]));
  assert.equal(normalizeJobs([raw], NOW)[0].id, jobs[0].id);
  assert.equal(
    legacyJobSlug({ title: 'Développeur C++', company: 'Company' }),
    'dveloppeur-c-company',
  );
});
test('matching respects word boundaries and programming punctuation', () => {
  assert.equal(matchesTerm('paid email campaign', 'AI'), false);
  assert.equal(matchesTerm('Django', 'Go'), false);
  assert.equal(matchesTerm('JavaScript', 'Java'), false);
  assert.equal(matchesTerm('C++ and C# .NET', 'C++'), true);
  assert.equal(matchesTerm('C++ and C# .NET', 'C#'), true);
  assert.equal(matchesTerm('C++ and C# .NET', '.NET'), true);
});
test('filters combine, cap URL input, exclude future dates and round-trip', () => {
  const jobs = normalizeJobs(
    [
      raw,
      { ...raw, title: 'Junior Python engineer', url: 'https://example.com/jobs/2', salary: '' },
    ],
    NOW,
  ).map(toSummary);
  const filters = {
    ...DEFAULT_FILTERS,
    query: 'React',
    experience: 'senior',
    salary: true,
    days: '7',
  };
  assert.equal(filterJobs(jobs, filters, NOW).length, 1);
  assert.equal(filterJobs(jobs, { ...filters, experience: 'junior' }, NOW).length, 0);
  assert.deepEqual(filtersFromParams(filtersToParams(filters)), filters);
  assert.equal(filtersFromParams(new URLSearchParams('days=-1&experience=unknown')).days, '');
  assert.equal(
    filterJobs(
      [{ ...jobs[0], posted_at: new Date(NOW + DAY).toISOString() }],
      { ...DEFAULT_FILTERS, days: '7' },
      NOW,
    ).length,
    0,
  );
});
test('source HTML is text and inline JSON cannot close a script element', () => {
  assert.equal(plainText('<script>alert(1)</script><p>Hello &amp; goodbye</p>'), 'Hello & goodbye');
  assert.ok(!serializeJsonLd({ name: '</script><script>alert(1)</script>' }).includes('<'));
  assert.doesNotThrow(() => JSON.parse(serializeJsonLd({ name: '<&>' })));
});
test('job schema omits invented locations, salary numbers and deadlines', () => {
  const job = normalizeJobs([raw], NOW)[0];
  assert.equal(jobSchema(job), null);
  const schema = jobSchema({ ...job, applicantCountries: ['US'] });
  assert.ok(schema);
  assert.equal('baseSalary' in schema, false);
  assert.equal('jobLocation' in schema, false);
  assert.equal('validThrough' in schema, false);
  assert.equal(jobSchema({ ...job, applicantCountries: ['US'], archived: true }), null);
});
test('RSS escapes XML and never emits unknown dates or expired listings', () => {
  const job = normalizeJobs([{ ...raw, title: 'R&D <engineer> ]]> role' }], NOW)[0];
  const xml = rssFeed([job, { ...job, archived: true }]);
  assert.equal((xml.match(/<item>/g) || []).length, 1);
  assert.ok(xml.includes('R&amp;D'));
  assert.ok(xml.includes(']]&gt;'));
  assert.ok(!xml.includes('Invalid Date'));
});
test('saved records migrate and malformed or unsafe records are rejected', () => {
  assert.equal(validateSavedJobs({}).length, 0);
  const jobs = validateSavedJobs([raw, raw, { ...raw, url: 'javascript:alert(1)' }]);
  assert.equal(jobs.length, 1);
  assert.ok(jobs[0].slug);
  assert.ok(!('description' in jobs[0]));
  assert.deepEqual(validateSkills([' React ', null, 1, 'react', '', 'Python']), [
    'react',
    'python',
  ]);
});
test('CSV protects formula cells and quotes commas and line breaks', () => {
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell('a,b\nc'), '"a,b\nc"');
  assert.equal(csvCell(' +cmd'), '"\' +cmd"');
});
test('real snapshot produces unique URLs and compact browser summaries', () => {
  const jobs = getAllJobs();
  assert.ok(jobs.length > 0);
  assert.equal(new Set(jobs.map((job) => job.slug)).size, jobs.length);
  const summaries = getActiveJobs().map(toSummary);
  const bytes = Buffer.byteLength(JSON.stringify(summaries));
  assert.ok(bytes < 1_000_000, `search data too large: ${bytes} bytes`);
});

test('API validates pagination and returns summaries without source descriptions', async () => {
  const response = getJobsApi(new Request('https://www.devjobs.site/api/jobs?limit=2'));
  const body = await response.json();
  assert.equal(body.jobs.length, 2);
  assert.equal(body.limit, 2);
  assert.ok(!('description' in body.jobs[0]));
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
  const capped = await getJobsApi(
    new Request('https://www.devjobs.site/api/jobs?limit=100000&page=0'),
  ).json();
  assert.equal(capped.limit, 100);
  assert.equal(capped.page, 1);
  const invalid = await getJobsApi(
    new Request('https://www.devjobs.site/api/jobs?limit=nope&page=-2'),
  ).json();
  assert.equal(invalid.limit, 24);
  assert.equal(invalid.page, 1);
});

test('rich source facts survive normalization while browser summaries stay compact', () => {
  const job = normalizeJobs(
    [
      {
        ...raw,
        source: 'Jobicy',
        tags: ['PostgreSQL'],
        employment_type: 'CONTRACTOR',
        experience_level: 'Mid-level',
        salary_min: 55.5,
        salary_max: 75,
        salary_currency: 'CAD',
        salary_period: 'HOUR',
        applicant_countries: ['CA'],
        last_seen_at: '2026-10-21T11:00:00Z',
        apply_url: 'https://example.com/apply',
        timezone_restrictions: ['-8', '-7'],
        company_logo: 'javascript:alert(1)',
      },
    ],
    NOW,
  )[0];
  assert.equal(job.experience, 'mid');
  assert.equal(job.employmentType, 'CONTRACTOR');
  assert.equal(job.applyUrl, 'https://example.com/apply');
  assert.equal(job.companyLogo, '');
  assert.ok(job.tags.includes('PostgreSQL'));
  assert.deepEqual(job.timezoneRestrictions, ['-8', '-7']);
  const schema = jobSchema(job);
  assert.deepEqual(schema?.baseSalary, {
    '@type': 'MonetaryAmount',
    currency: 'CAD',
    value: { '@type': 'QuantitativeValue', unitText: 'HOUR', minValue: 55.5, maxValue: 75 },
  });
  assert.equal(schema?.employmentType, 'CONTRACTOR');
  const summary = toSummary(job);
  for (const field of [
    'description',
    'salaryDetails',
    'timezoneRestrictions',
    'companyLogo',
    'applyUrl',
  ])
    assert.ok(!(field in summary));
});

test('source update dates are labeled and never emitted as original publication dates', () => {
  const job = normalizeJobs(
    [
      {
        ...raw,
        posted_at: '',
        updated_at: raw.posted_at,
        source: 'Himalayas',
        applicant_countries: ['CA'],
      },
    ],
    NOW,
  )[0];
  assert.equal(job.archived, false);
  assert.equal(job.dateKind, 'updated');
  assert.equal(toSummary(job).dateKind, 'updated');
  assert.equal(validateSavedJobs([toSummary(job)])[0].dateKind, 'updated');
  assert.equal(jobSchema(job), null);
  assert.equal(
    normalizeJobs([{ ...raw, posted_at: '', updated_at: '2027-01-01' }], NOW)[0].archived,
    true,
  );
});

test('source redistribution rules protect new and legacy records', async () => {
  for (const source of ['Remotive', 'Himalayas']) {
    const job = normalizeJobs(
      [{ ...raw, source, applicant_countries: ['US'], allow_syndication: true }],
      NOW,
    )[0];
    assert.equal(jobSchema(job), null);
    assert.ok(!rssFeed([job]).includes('<item>'));
    const response = await getJobsApi(
      new Request(`https://www.devjobs.site/api/jobs?source=${source}`),
    ).json();
    assert.equal(response.total, 0);
    assert.equal(job.archived, false); // On-site discovery remains available.
  }
});

test('invalid structured salaries and unsafe application URLs are ignored', () => {
  for (const fields of [
    { salary_min: 100, salary_max: 50, salary_currency: 'USD', salary_period: 'YEAR' },
    { salary_min: 50, salary_max: 100, salary_currency: '', salary_period: 'YEAR' },
    { salary_min: 50, salary_max: 100, salary_currency: 'USD', salary_period: '' },
  ]) {
    const job = normalizeJobs(
      [{ ...raw, ...fields, apply_url: 'javascript:alert(1)', applicant_countries: ['US'] }],
      NOW,
    )[0];
    assert.equal(job.salaryDetails, undefined);
    assert.equal(job.applyUrl, raw.url);
    assert.ok(!('baseSalary' in jobSchema(job)!));
  }
});

test('detail pages render application URLs, source attribution and update labels', async () => {
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { default: JobDetails } = await import('../src/shared/JobDetails');
  const job = normalizeJobs(
    [
      {
        ...raw,
        source: 'Himalayas',
        posted_at: '',
        updated_at: raw.posted_at,
        apply_url: 'https://example.com/apply?ref=himalayas',
        valid_through: '2026-11-01T00:00:00Z',
        employment_type: 'CONTRACTOR',
        timezone_restrictions: ['-8', '-7'],
        last_seen_at: '2026-10-21T11:00:00Z',
      },
    ],
    NOW,
  )[0];
  const html = renderToStaticMarkup(createElement(JobDetails, { job, summary: toSummary(job) }));
  assert.ok(html.includes('href="https://example.com/apply?ref=himalayas"'));
  assert.ok(html.includes(`href="${raw.url}"`));
  assert.ok(html.includes('Updated at source'));
  assert.ok(html.includes('Source listing expires'));
  assert.ok(html.includes('Last seen in source feed'));
  assert.ok(html.includes('contractor'));
  assert.ok(html.includes('-8, -7'));
});
