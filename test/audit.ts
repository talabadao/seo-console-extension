import { parseRobots, evaluateRobots } from '../lib/audit/robots';
import { classify } from '../lib/audit/probe';
import { diffRenderedVsSource } from '../lib/audit/diff';
import { computeIndexability } from '../lib/audit/indexability';
import { rate } from '../lib/vitals';
import type { PageReport } from '../lib/types';
import type { SourceSnapshot } from '../lib/audit/types';

let pass = 0;
let total = 0;
function check(name: string, ok: boolean) {
  total++;
  if (ok) pass++;
  console.log(`${ok ? '  ✓' : '  ✗ FAIL'}  ${name}`);
}

// ── robots.txt parsing + Googlebot evaluation ──
const robotsTxt = `
User-agent: *
Disallow: /private
Disallow: /tmp
Allow: /private/public

User-agent: Googlebot
Disallow: /no-google$
Allow: /

Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/news.xml
`;
const parsed = parseRobots(robotsTxt);
check('sitemaps parsed (2)', parsed.sitemaps.length === 2);

const g = (p: string) => evaluateRobots(parsed, p, 'googlebot');
check('googlebot group: / allowed', g('/').allowed === true);
check('googlebot group: /no-google blocked ($ anchor)', g('/no-google').allowed === false);
check('googlebot group: /no-google/x allowed ($ anchors end)', g('/no-google/x').allowed === true);

const s = (p: string) => evaluateRobots(parsed, p, 'bingbot'); // falls back to *
check('star group: /private blocked', s('/private').allowed === false);
check('star group: /private/public allowed (Allow longest-match wins)', s('/private/public').allowed === true);
check('star group: / allowed', s('/').allowed === true);
check('matched rule reported', s('/private').matchedRule === 'Disallow: /private');

const wild = parseRobots('User-agent: *\nDisallow: /*.pdf$');
check('wildcard: /a/b.pdf blocked', evaluateRobots(wild, '/a/b.pdf').allowed === false);
check('wildcard: /a/b.pdfx allowed ($ anchor)', evaluateRobots(wild, '/a/b.pdfx').allowed === true);

const empty = parseRobots('User-agent: *\nDisallow:');
check('empty Disallow = allow all', evaluateRobots(empty, '/anything').allowed === true);

// ── classify ──
check('classify 200 → ok', classify(200, false) === 'ok');
check('classify 200 redirected → redirect', classify(200, true) === 'redirect');
check('classify 301 → redirect', classify(301, false) === 'redirect');
check('classify 404 → broken', classify(404, false) === 'broken');
check('classify 500 → broken', classify(500, false) === 'broken');
check('classify 403 → unknown (WAF-safe)', classify(403, false) === 'unknown');
check('classify 429 → unknown', classify(429, false) === 'unknown');

// ── rendered vs source diff ──
const report = {
  meta: { title: 'T', description: 'D rendered', canonical: 'https://x/c', robots: null, lang: 'en' },
  headings: [{ level: 1, text: 'Injected H1', selector: 'h1' }],
  links: { total: 10 },
  images: [{}, {}],
  wordCount: 100,
} as unknown as PageReport;
const source: SourceSnapshot = {
  ok: true,
  status: 200,
  title: 'T',
  description: 'D source',
  canonical: null, // present only after JS → risk
  metaRobots: null,
  lang: 'en',
  firstH1: null, // H1 injected by JS → risk
  h1Count: 0,
  headingCount: 0,
  linkCount: 10,
  imageCount: 2,
  wordCount: 100,
};
const diffs = diffRenderedVsSource(report, source);
const byField = (f: string) => diffs.find((d) => d.field === f)!;
check('diff: Title same', byField('Title').status === 'same');
check('diff: Description changed', byField('Meta description').status === 'changed');
check('diff: Canonical rendered-only + risk', byField('Canonical').status === 'rendered-only' && byField('Canonical').risk);
check('diff: H1 rendered-only + risk', byField('H1').risk === true);
check('diff: Links count same', byField('Links').status === 'same');

// ── indexability ──
const idxNoindex = computeIndexability(
  { meta: { robots: 'noindex, follow' }, http: { xRobotsTag: null } } as unknown as PageReport,
  null,
);
check('indexability: meta noindex → not indexable', idxNoindex.indexable === false);

const idxBlocked = computeIndexability(
  { meta: { robots: null }, http: { xRobotsTag: null } } as unknown as PageReport,
  { found: true, status: 200, allowed: false, matchedRule: 'Disallow: /x', appliedGroup: '*', sitemaps: [] },
);
check('indexability: robots disallow → blocked', idxBlocked.indexable === false);

const idxOk = computeIndexability(
  { meta: { robots: 'index, follow' }, http: { xRobotsTag: null } } as unknown as PageReport,
  { found: true, status: 200, allowed: true, matchedRule: null, appliedGroup: '*', sitemaps: [] },
);
check('indexability: normal page → indexable', idxOk.indexable === true);

// ── Core Web Vitals ratings ──
check('vitals: LCP 2000ms → good', rate('lcp', 2000) === 'good');
check('vitals: LCP 3000ms → needs-improvement', rate('lcp', 3000) === 'needs-improvement');
check('vitals: LCP 5000ms → poor', rate('lcp', 5000) === 'poor');
check('vitals: CLS 0.05 → good', rate('cls', 0.05) === 'good');
check('vitals: CLS 0.30 → poor', rate('cls', 0.3) === 'poor');
check('vitals: INP null → none', rate('inp', null) === 'none');

console.log(`\n${pass}/${total} checks passed`);
if (pass !== total) throw new Error(`${total - pass} check(s) failed`);
