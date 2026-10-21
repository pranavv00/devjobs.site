import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';
import { getActiveJobs, getAllJobs, toSummary } from '../src/shared/data';
import { CATEGORIES } from '../src/shared/seo';
import { DEFAULT_FILTERS, filterJobs, legacyJobSlug } from '../src/shared/jobs';
const jobs = getActiveJobs();
const indexablePaths = new Set([
  '/',
  '/jobs',
  '/about',
  '/privacy',
  '/terms',
  ...jobs.map((job) => `/jobs/${job.slug}`),
  ...CATEGORIES.filter(
    (category) =>
      filterJobs(jobs.map(toSummary), { ...DEFAULT_FILTERS, query: category.query }).length,
  ).map((category) => `/q/${category.slug}`),
]);
const redirects = {};
for (const job of getAllJobs()) {
  for (const alias of [legacyJobSlug(job), job.id]) {
    if (alias && !redirects[`/jobs/${alias}`]) redirects[`/jobs/${alias}`] = `/jobs/${job.slug}`;
  }
}
export default defineConfig({
  site: 'https://www.devjobs.site',
  trailingSlash: 'never',
  publicDir: '../public',
  redirects,
  integrations: [
    react(),
    sitemap({
      filter: (page) => indexablePaths.has(new URL(page).pathname.replace(/\/$/, '') || '/'),
    }),
  ],
  vite: {
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: { '@shared': fileURLToPath(new URL('../src/shared', import.meta.url)) },
    },
  },
});
