import type { TechSignals } from '../tech/types';

/** Gather the raw signals used for technology detection (content script, DOM-side). */
export function collectTech(doc: Document): TechSignals {
  const scripts: string[] = [];
  const scriptIds: string[] = [];
  doc.querySelectorAll('script').forEach((s) => {
    const src = s.getAttribute('src');
    if (src) scripts.push(src);
    const id = s.getAttribute('id');
    if (id) scriptIds.push(id);
  });

  const links: string[] = [];
  const linkIds: string[] = [];
  doc.querySelectorAll('link[href]').forEach((l) => {
    links.push(l.getAttribute('href') || '');
    const id = l.getAttribute('id');
    if (id) linkIds.push(id);
  });

  const metas: Record<string, string> = {};
  const generators: string[] = [];
  doc.querySelectorAll('meta[name], meta[property]').forEach((m) => {
    const key = (m.getAttribute('name') || m.getAttribute('property') || '').toLowerCase();
    const content = m.getAttribute('content') || '';
    if (key && !(key in metas)) metas[key] = content;
    if (key === 'generator' && content) generators.push(content);
  });

  const all = scripts.concat(links).join(' ');
  const markers: string[] = [];
  const mark = (cond: boolean, name: string) => {
    if (cond) markers.push(name);
  };
  try {
    mark(!!doc.getElementById('__NEXT_DATA__') || /\/_next\//.test(all), 'next');
    mark(!!doc.querySelector('[id^="__nuxt"], #__nuxt'), 'nuxt');
    mark(!!doc.querySelector('[ng-version]'), 'angular');
    mark(!!doc.querySelector('[data-reactroot]'), 'react');
    mark(!!doc.querySelector('[data-v-app], [data-server-rendered]'), 'vue');
    mark(!!doc.querySelector('[data-elementor-type], .elementor'), 'elementor');
    mark(!!doc.querySelector('.woocommerce, [class*="woocommerce"]'), 'woocommerce');
    mark(!!doc.querySelector('#wpadminbar') || /wp-(content|includes)\//.test(all), 'wordpress');
  } catch {
    /* ignore selector errors */
  }

  let cookies = '';
  try {
    cookies = document.cookie;
  } catch {
    /* blocked */
  }

  return {
    scripts,
    scriptIds,
    links,
    linkIds,
    metas,
    generators,
    headHtml: (doc.head ? doc.head.innerHTML : '').slice(0, 60000),
    htmlClass: doc.documentElement.className || '',
    bodyClass: doc.body?.className || '',
    cookies,
    markers,
  };
}
