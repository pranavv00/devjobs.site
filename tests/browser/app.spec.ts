import { test, expect } from '@playwright/test';
import AxeBuilder from 'axe-core';
declare global {
  interface Window {
    axe: typeof AxeBuilder;
  }
}

test('home has useful SSR content, metadata and no horizontal overflow', async ({
  page,
  request,
}) => {
  const response = await request.get('/');
  const html = await response.text();
  expect(html).toContain('application/ld+json');
  expect(html).toContain('job-card');
  expect(html).toContain('rel="canonical"');
  await page.goto('/');
  await expect(page.locator('main h1')).toHaveCount(1);
  await expect(page.locator('.job-card')).toHaveCount(12);
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
test('search, combined filters, reset and history work', async ({ page }) => {
  await page.goto('/jobs?q=React');
  await expect(page.locator('#job-search')).toHaveValue('React');
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByLabel('Salary listed').check();
  await expect(page).toHaveURL(/salary=1/);
  await page.locator('#job-search').fill('this-job-does-not-exist-123456');
  await page.getByRole('button', { name: 'Search jobs' }).click();
  await expect(page.getByText('No jobs match these filters.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset all filters' }).click();
  await expect(page.locator('.job-card')).toHaveCount(12);
  await expect(page.getByLabel('Salary listed')).not.toBeChecked();
  await page.goBack();
  await expect(page.locator('#job-search')).toHaveValue('this-job-does-not-exist-123456');
});
test('save, update status, export, remove and cross-tab synchronization work', async ({
  page,
  context,
}) => {
  await page.goto('/jobs');
  const card = page.locator('.job-card').first();
  const title = await card.locator('h3').innerText();
  await card.getByRole('button', { name: /^Save / }).click();
  await expect(card.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  const second = await context.newPage();
  await second.goto('/saved');
  await expect(second.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await second.getByLabel(`Status for ${title}`, { exact: true }).selectOption('interviewing');
  await expect(
    second
      .getByRole('region', { name: 'Interviewing jobs' })
      .getByRole('heading', { name: title, exact: true }),
  ).toBeVisible();
  const download = second.waitForEvent('download');
  await second.getByRole('button', { name: 'Export CSV' }).click();
  expect((await download).suggestedFilename()).toBe('devjobs-applications.csv');
  await second.getByRole('button', { name: `Unsave ${title}`, exact: true }).click();
  await expect(second.getByText('A good opportunity is worth saving.')).toBeVisible();
  await expect(card.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
});
test('corrupt storage and blocked writes do not crash the interface', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('savedJobs', '{bad');
    localStorage.setItem('userSkills', 'null');
    localStorage.setItem('jobStatuses', '[]');
  });
  await page.goto('/saved');
  await expect(page.getByText('A good opportunity is worth saving.')).toBeVisible();
  await page.goto('/jobs');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Quota exceeded');
    };
  });
  await page.locator('.job-card').first().getByRole('button').click();
  await expect(page.locator('.field-error[role="alert"]')).toContainText('Could not save');
});
test('skills and detail pages work on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/matches');
  await page.getByLabel('Add a skill', { exact: true }).fill('React');
  await page.getByRole('button', { name: 'Add skill', exact: true }).click();
  await expect(page.locator('.job-card').first()).toBeVisible();
  await page.locator('.job-card h3 a').first().click();
  await expect(page.getByRole('heading', { name: 'About the role', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View & apply', exact: true })).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  );
  await page.getByRole('button', { name: /^Save / }).click();
  await expect(page.getByRole('button', { name: /^Unsave / })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
test('public pages pass automated accessibility checks', async ({ page }) => {
  for (const url of ['/', '/jobs', '/about', '/saved', '/matches']) {
    await page.goto(url);
    await page.addScriptTag({ content: AxeBuilder.source });
    const results = await page.evaluate(async () =>
      window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
      }),
    );
    expect(
      results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
      url,
    ).toEqual([]);
  }
});
test('feeds, sitemap, noindex, missing routes and security headers are correct', async ({
  request,
}) => {
  const response = await request.get('/');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/jobs');
  expect(sitemap).not.toContain('/saved');
  expect(sitemap).not.toContain('/matches');
  expect((await request.get('/jobs/this-job-does-not-exist')).status()).toBe(404);
  expect((await request.get('/q/this-keyword-does-not-exist')).status()).toBe(404);
  const saved = await (await request.get('/saved')).text();
  expect(saved).toMatch(/name="robots" content="noindex/);
  const rss = await request.get('/feed.xml');
  expect(rss.headers()['content-type']).toContain('application/rss+xml');
  expect(await rss.text()).not.toContain('Invalid Date');
  const api = await (await request.get('/api/jobs?limit=2')).json();
  expect(api.jobs).toHaveLength(2);
  expect(api.jobs[0].description).toBeUndefined();
});
