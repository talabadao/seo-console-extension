import { MSG } from '@/lib/messaging';
import type { CheckLinksAck, FetchRobotsResponse, ProbeUrlsResponse } from '@/lib/messaging';
import { buildReport } from '@/lib/report';
import type { DomCollection, HttpRecord, PageReport } from '@/lib/types';
import { parseRobots, evaluateRobots } from '@/lib/audit/robots';
import { diffRenderedVsSource } from '@/lib/audit/diff';
import { computeIndexability } from '@/lib/audit/indexability';
import type { AuditResult, LinkResult, RobotsCheck, SitemapInfo, SourceSnapshot } from '@/lib/audit/types';

export interface AnalyzeResult {
  report: PageReport | null;
  tab: chrome.tabs.Tab | null;
  error: string | null;
}

export async function analyzeActiveTab(): Promise<AnalyzeResult> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || tab.id == null) return { report: null, tab: null, error: 'No active tab.' };

  const url = tab.url || '';
  if (!/^https?:/i.test(url)) {
    return { report: null, tab, error: 'This page can’t be analyzed. Open an http(s) page and try again.' };
  }

  let dom: DomCollection;
  try {
    const res = (await chrome.tabs.sendMessage(tab.id, { type: MSG.COLLECT_DOM })) as
      | DomCollection
      | { error: string }
      | undefined;
    if (!res || 'error' in res) {
      return {
        report: null,
        tab,
        error: res && 'error' in res ? `Could not read the page: ${res.error}` : 'Could not read the page. Try reloading it.',
      };
    }
    dom = res;
  } catch {
    return { report: null, tab, error: 'Content script not loaded on this page. Reload the page, then retry.' };
  }

  let http: HttpRecord | null = null;
  try {
    http = (await chrome.runtime.sendMessage({ type: MSG.GET_HTTP, tabId: tab.id })) as HttpRecord | null;
  } catch {
    http = null;
  }

  return { report: buildReport(dom, http), tab, error: null };
}

export async function highlightInTab(tabId: number, selector: string): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: MSG.HIGHLIGHT, selector });
  } catch {
    /* page may not accept messages */
  }
}

export async function clearHighlightInTab(tabId: number): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: MSG.CLEAR_HIGHLIGHT });
  } catch {
    /* ignore */
  }
}

// ── Phase 2: audit (source diff, robots, indexability, sitemaps) ────────────
export async function runAudit(tabId: number, report: PageReport): Promise<AuditResult> {
  const [source, robotsRaw] = await Promise.all([
    sendToTab<SourceSnapshot>(tabId, { type: MSG.COLLECT_SOURCE }),
    sendToTab<FetchRobotsResponse>(tabId, { type: MSG.FETCH_ROBOTS }),
  ]);

  const src = source ?? emptySource();
  const urlObj = safeUrl(report.finalUrl || report.url);
  const pathWithQuery = urlObj ? urlObj.pathname + urlObj.search : '/';
  const origin = urlObj ? urlObj.origin : '';

  let robots: RobotsCheck;
  let candidates: string[];
  if (robotsRaw?.found && robotsRaw.text) {
    const parsed = parseRobots(robotsRaw.text);
    robots = { ...evaluateRobots(parsed, pathWithQuery), status: robotsRaw.status };
    candidates = unique([...parsed.sitemaps, `${origin}/sitemap.xml`]);
  } else {
    robots = {
      found: false,
      status: robotsRaw?.status ?? null,
      allowed: true,
      matchedRule: null,
      appliedGroup: null,
      sitemaps: [],
    };
    candidates = origin ? [`${origin}/sitemap.xml`] : [];
  }

  const probed = candidates.length ? await probeUrls(candidates) : {};
  const sitemaps: SitemapInfo[] = candidates.map((u) => ({
    url: u,
    state: probed[u]?.state ?? 'unknown',
    status: probed[u]?.status ?? null,
  }));

  return {
    source: src,
    diffs: diffRenderedVsSource(report, src),
    robots,
    indexability: computeIndexability(report, robots),
    sitemaps,
  };
}

// ── Phase 2: broken-link checking ───────────────────────────────────────────
export async function startLinkCheck(tabId: number, urls: string[]): Promise<number> {
  try {
    const ack = (await chrome.runtime.sendMessage({ type: MSG.CHECK_LINKS, tabId, urls })) as CheckLinksAck | undefined;
    return ack?.total ?? 0;
  } catch {
    return 0;
  }
}

type LinkEvent = { kind: 'result'; result: LinkResult } | { kind: 'done' };

export function onLinkEvents(tabId: number, handler: (ev: LinkEvent) => void): () => void {
  const listener = (msg: unknown) => {
    const m = msg as { type?: string; tabId?: number; url?: string; state?: LinkResult['state']; status?: number | null };
    if (m?.tabId !== tabId) return;
    if (m.type === MSG.LINK_RESULT && m.url) {
      handler({ kind: 'result', result: { url: m.url, state: m.state!, status: m.status ?? null } });
    } else if (m.type === MSG.LINK_DONE) {
      handler({ kind: 'done' });
    }
  };
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}

// ── Page-tool toggles (sent to the content script) ──────────────────────────
export async function setOutlineHeadings(tabId: number, on: boolean): Promise<void> {
  await sendToTab(tabId, { type: MSG.OUTLINE_HEADINGS, on });
}
export async function setOutlineLinks(tabId: number, on: boolean): Promise<void> {
  await sendToTab(tabId, { type: MSG.OUTLINE_LINKS, on });
}
export async function setRuler(tabId: number, on: boolean): Promise<void> {
  await sendToTab(tabId, { type: MSG.RULER, on });
}

// ── Content settings (JavaScript / cookies / popups) ────────────────────────
export type BlockSetting = 'javascript' | 'cookies' | 'popups';

function contentSetting(setting: BlockSetting) {
  return setting === 'javascript'
    ? chrome.contentSettings.javascript
    : setting === 'cookies'
      ? chrome.contentSettings.cookies
      : chrome.contentSettings.popups;
}

const sitePattern = (url: string): string | null => {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}/*`;
  } catch {
    return null;
  }
};

/** Whether the setting is currently blocked for the given page URL. */
export function isBlocked(setting: BlockSetting, url: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      contentSetting(setting).get({ primaryUrl: url }, (res: { setting?: string }) => resolve(res?.setting === 'block'));
    } catch {
      resolve(false);
    }
  });
}

/** Block or allow the setting for the page's site. Returns the new blocked state. */
export function setBlocked(setting: BlockSetting, url: string, blocked: boolean): Promise<boolean> {
  const pattern = sitePattern(url);
  if (!pattern) return Promise.resolve(false);
  return new Promise((resolve) => {
    try {
      contentSetting(setting).set({ primaryPattern: pattern, setting: blocked ? 'block' : 'allow' }, () => resolve(blocked));
    } catch {
      resolve(!blocked);
    }
  });
}

// ── helpers ─────────────────────────────────────────────────────────────────
async function sendToTab<T>(tabId: number, msg: unknown): Promise<T | null> {
  try {
    return (await chrome.tabs.sendMessage(tabId, msg)) as T;
  } catch {
    return null;
  }
}

async function probeUrls(urls: string[]): Promise<ProbeUrlsResponse> {
  try {
    return ((await chrome.runtime.sendMessage({ type: MSG.PROBE_URLS, urls })) as ProbeUrlsResponse) ?? {};
  } catch {
    return {};
  }
}

function safeUrl(u: string): URL | null {
  try {
    return new URL(u);
  } catch {
    return null;
  }
}

function unique(arr: string[]): string[] {
  return [...new Set(arr)];
}

function emptySource(): SourceSnapshot {
  return {
    ok: false,
    status: null,
    error: 'Could not fetch source HTML.',
    title: null,
    description: null,
    canonical: null,
    metaRobots: null,
    lang: null,
    firstH1: null,
    h1Count: 0,
    headingCount: 0,
    linkCount: 0,
    imageCount: 0,
    wordCount: 0,
  };
}
