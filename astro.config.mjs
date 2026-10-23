import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://stevecattin.com',
  redirects: {
    '/blog/the-ai-marketing-ascendancy-framework': '/aima',
  },
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
  build: {
    format: 'directory',
    // Every page's CSS is small (~10–20 KB): inline it, so the first paint
    // doesn't wait on 3–5 extra stylesheet requests over a mobile network.
    inlineStylesheets: 'always',
  },
});
