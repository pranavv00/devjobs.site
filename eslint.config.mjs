import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { rules: { '@next/next/no-html-link-for-pages': 'off' } },
  globalIgnores([
    '.next/**',
    'astro-app/**',
    'scratch/**',
    'test-results/**',
    'playwright-report/**',
    'next-env.d.ts',
  ]),
]);
