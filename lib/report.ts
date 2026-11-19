import type {
  DomCollection,
  HttpRecord,
  HttpView,
  LinkSummary,
  MetaView,
  PageReport,
} from './types';
import { pixelWidth, TITLE_FONT, DESC_FONT } from './pixel-width';
import { runRules, tally, computeScore } from './rules';

export function buildReport(dom: DomCollection, http: HttpRecord | null): PageReport {
  const meta = buildMeta(dom);
  const httpView = buildHttp(dom, http);
  const links = summarizeLinks(dom.links);

  const base: PageReport = {
    url: dom.url,
    finalUrl: httpView.finalUrl,
    collectedAt: Date.now(),
    http: httpView,
    meta,
    headings: dom.headings,
    images: dom.images,
    links,
    schema: dom.schema,
    social: dom.social,
    wordCount: dom.wordCount,
    vitals: dom.vitals,
    issues: [],
    counts: { error: 0, warning: 0, info: 0, pass: 0 },
    score: 100,
  };

  const issues = runRules(base);
  const counts = tally(issues);
  return { ...base, issues, counts, score: computeScore(counts) };
}

function buildMeta(dom: DomCollection): MetaView {
  return {
    doctype: dom.doctype,
    title: dom.title,
    titleLength: dom.title ? [...dom.title].length : 0,
    titlePixelWidth: dom.title ? pixelWidth(dom.title, TITLE_FONT) : 0,
    titleTagCount: dom.titleTagCount,
    description: dom.description,
    descriptionLength: dom.description ? [...dom.description].length : 0,
    descriptionPixelWidth: dom.description ? pixelWidth(dom.description, DESC_FONT) : 0,
    descriptionCount: dom.descriptionCount,
    canonical: dom.canonical,
    robots: dom.metaRobots,
    lang: dom.lang,
    charset: dom.charset,
    viewport: dom.viewport,
    hreflang: dom.hreflang,
  };
}

function buildHttp(dom: DomCollection, http: HttpRecord | null): HttpView {
  const status = http?.status ?? dom.navStatus ?? null;
  const headers = http?.responseHeaders ?? {};
  const redirects = http?.redirects ?? [];
  return {
    status,
    statusClass: statusClass(status),
    statusLine: http?.statusLine,
    finalUrl: http?.finalUrl ?? dom.url,
    redirects,
    redirectCount: Math.max(redirects.length, dom.navRedirectCount),
    headers,
    xRobotsTag: headerLookup(headers, 'x-robots-tag'),
    contentType: headerLookup(headers, 'content-type'),
    fromCache: http?.fromCache ?? dom.fromCache,
    fromWebRequest: http != null,
  };
}

function summarizeLinks(all: DomCollection['links']): LinkSummary {
  const seen = new Set<string>();
  let internal = 0;
  let external = 0;
  let nofollow = 0;
  for (const l of all) {
    seen.add(l.href);
    if (l.isInternal) internal++;
    else external++;
    if (l.isNofollow) nofollow++;
  }
  return { all, total: all.length, internal, external, nofollow, unique: seen.size };
}

function statusClass(status: number | null): HttpView['statusClass'] {
  if (status == null) return 'unknown';
  if (status >= 500) return '5xx';
  if (status >= 400) return '4xx';
  if (status >= 300) return '3xx';
  if (status >= 200) return '2xx';
  return 'unknown';
}

function headerLookup(headers: Record<string, string>, name: string): string | null {
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === lower) return v;
  }
  return null;
}
