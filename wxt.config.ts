import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// WXT config: https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'SEO Console',
    description:
      'On-page SEO inspector: status codes, redirects, meta tags, headings, images, links, indexability, Core Web Vitals and technology detection.',
    version: '1.3.0',
    permissions: ['activeTab', 'storage', 'sidePanel', 'webRequest', 'tabs', 'contentSettings'],
    // webRequest needs host access to read status codes / response headers and for
    // the background worker to check cross-origin links. For a later release this can
    // be narrowed to optional_host_permissions (see README). Kept broad so the tool
    // works out of the box.
    host_permissions: ['<all_urls>'],
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
    action: {
      default_title: 'Open SEO Console',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
        128: 'icon/128.png',
      },
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
