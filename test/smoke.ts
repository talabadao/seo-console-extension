import { buildReport } from '../lib/report';
import { emptyVitals } from '../lib/collectors/vitals';
import type { DomCollection, HttpRecord } from '../lib/types';

// A synthetic page deliberately full of issues.
const dom: DomCollection = {
  url: 'https://example.com/page',
  doctype: '<!DOCTYPE html>',
  title: 'A reasonably sized title for testing purposes here',
  titleTagCount: 1,
  description:
    'This meta description is intentionally made extremely long so that it exceeds the pixel budget Google allows on desktop search results, which should trigger a truncation warning from the rules engine because it just keeps going and going and going well past any reasonable snippet length.',
  descriptionCount: 1,
  canonical: 'https://example.com/page',
  metaRobots: 'index,follow',
  lang: null, // -> lang-missing warning
  charset: 'UTF-8',
  viewport: 'width=device-width',
  hreflang: [],
  headings: [
    { level: 2, text: 'Starts at H2', selector: 'h2:nth-of-type(1)' }, // no H1 -> error; skip-order ok (prev 0)
    { level: 4, text: 'Jumps to H4', selector: 'h4:nth-of-type(1)' }, // H2->H4 skip -> warning
    { level: 3, text: '', selector: 'h3:nth-of-type(1)' }, // empty heading -> warning
  ],
  images: [
    { src: 'https://example.com/a.jpg', alt: null, hasAltAttr: false, widthAttr: null, heightAttr: null, naturalWidth: 800, naturalHeight: 600, loading: null, format: 'jpg', transferSize: 250 * 1024, selector: 'img:nth-of-type(1)' },
    { src: 'https://example.com/b.webp', alt: 'ok', hasAltAttr: true, widthAttr: 100, heightAttr: 100, naturalWidth: 100, naturalHeight: 100, loading: 'lazy', format: 'webp', transferSize: 2000, selector: 'img:nth-of-type(2)' },
  ],
  links: [
    { href: 'https://example.com/x', text: 'Internal', rel: null, target: null, isInternal: true, isNofollow: false, isSponsored: false, isUgc: false, selector: 'a:nth-of-type(1)' },
    { href: 'https://other.com/y', text: '', rel: null, target: '_blank', isInternal: false, isNofollow: true, isSponsored: false, isUgc: false, selector: 'a:nth-of-type(2)' },
  ],
  schema: [{ type: 'Organization', valid: true, raw: { '@type': 'Organization' } }],
  social: { openGraph: { 'og:title': 'OG' }, twitter: {} },
  navStatus: null,
  navRedirectCount: 0,
  fromCache: false,
  wordCount: 450,
  vitals: emptyVitals(),
  tech: {
    scripts: [],
    scriptIds: [],
    links: [],
    linkIds: [],
    metas: {},
    generators: [],
    headHtml: '',
    htmlClass: '',
    bodyClass: '',
    cookies: '',
    markers: [],
  },
};

const http: HttpRecord = {
  url: 'https://example.com/page',
  finalUrl: 'https://example.com/page',
  status: 200,
  redirects: [{ url: 'http://example.com/page', status: 301 }],
  responseHeaders: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' },
  completedAt: Date.now(),
};

const report = buildReport(dom, http);
const ids = report.issues.map((i) => i.ruleId);

const expect: [string, boolean][] = [
  ['status 200', report.http.status === 200],
  ['redirect recorded', report.http.redirects.length === 1],
  ['x-robots noindex -> error', ids.includes('x-robots-noindex')],
  ['h1 missing', ids.includes('h1-missing')],
  ['heading order skip', ids.includes('heading-order')],
  ['empty heading', ids.includes('heading-empty')],
  ['description too long', ids.includes('description-length')],
  ['lang missing', ids.includes('lang-missing')],
  ['img missing alt', ids.includes('img-missing-alt')],
  ['img missing dimensions', ids.includes('img-missing-dimensions')],
  ['large image', ids.includes('img-large')],
  ['empty anchor', ids.includes('link-empty-anchor')],
  ['blank noopener', ids.includes('link-blank-noopener')],
  ['links summarized', report.links.internal === 1 && report.links.external === 1 && report.links.nofollow === 1],
  ['xRobotsTag parsed', report.http.xRobotsTag === 'noindex'],
];

let pass = 0;
for (const [name, ok] of expect) {
  console.log(`${ok ? '  ✓' : '  ✗ FAIL'}  ${name}`);
  if (ok) pass++;
}
console.log(`\nScore: ${report.score}  |  errors=${report.counts.error} warnings=${report.counts.warning} info=${report.counts.info}`);
console.log(`${pass}/${expect.length} checks passed`);
if (pass !== expect.length) throw new Error(`${expect.length - pass} check(s) failed`);
