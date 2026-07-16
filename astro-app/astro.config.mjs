import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.devjobs.site',
  trailingSlash: 'never',
  integrations: [
    react(),
    tailwind(),
    sitemap(),
  ],
  vite: {
    ssr: {
      noExternal: ['framer-motion', '@hello-pangea/dnd'],
    },
  },
});
