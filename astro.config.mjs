// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://vapelink.com.au',
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/cart') &&
        !page.includes('/checkout') &&
        !page.includes('/order-confirmation') &&
        !page.includes('/search') &&
        !page.includes('/404'),
      serialize(item) {
        const url = item.url;
        // Homepage
        if (url === 'https://vapelink.com.au/' || url === 'https://vapelink.com.au') {
          item.priority = 1.0;
          item.changefreq = 'daily';
        }
        // Collection pages
        else if (url.includes('/collections/')) {
          item.priority = 0.8;
          item.changefreq = 'daily';
        }
        // Product pages
        else if (url.includes('/products/')) {
          item.priority = 0.6;
          item.changefreq = 'weekly';
        }
        // Info/legal pages
        else if (url.includes('/pages/')) {
          item.priority = 0.4;
          item.changefreq = 'monthly';
        }
        // Everything else
        else {
          item.priority = 0.5;
          item.changefreq = 'weekly';
        }
        item.lastmod = new Date().toISOString();
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  },
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});