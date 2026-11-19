import { defineBackground } from '#imports';
import { MSG } from '@/lib/messaging';
import { classify } from '@/lib/audit/probe';
import type { HttpRecord } from '@/lib/types';
import type { ProbeState } from '@/lib/audit/types';

const key = (tabId: number) => `http:${tabId}`;

export default defineBackground(() => {
  // Clicking the toolbar icon opens the side panel (no popup).
  chrome.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

  // In-memory staging per tab for the *current* main-frame navigation.
  // Finalized records are persisted to storage.session so they survive a
  // service-worker restart (MV3 workers are torn down when idle).
  const staging = new Map<number, HttpRecord>();

  const filter = { urls: ['<all_urls>'], types: ['main_frame' as const] };

  chrome.webRequest.onBeforeRequest.addListener((d) => {
    if (d.tabId < 0) return;
    staging.set(d.tabId, {
      url: d.url,
      finalUrl: d.url,
      status: null,
      redirects: [],
      responseHeaders: {},
      completedAt: 0,
    });
  }, filter);

  chrome.webRequest.onBeforeRedirect.addListener((d) => {
    if (d.tabId < 0) return;
    const rec = staging.get(d.tabId) ?? blank(d.url);
    rec.redirects.push({
      url: d.url,
      status: d.statusCode,
      location: pick(d.responseHeaders, 'location'),
    });
    rec.finalUrl = d.redirectUrl;
    staging.set(d.tabId, rec);
  }, filter, ['responseHeaders']);

  chrome.webRequest.onHeadersReceived.addListener((d) => {
    if (d.tabId < 0) return;
    // Ignore the redirect responses; only capture the final one.
    if (d.statusCode >= 300 && d.statusCode < 400) return;
    const rec = staging.get(d.tabId) ?? blank(d.url);
    rec.status = d.statusCode;
    rec.statusLine = d.statusLine;
    rec.responseHeaders = toObject(d.responseHeaders);
    rec.finalUrl = d.url;
    staging.set(d.tabId, rec);
  }, filter, ['responseHeaders']);

  chrome.webRequest.onCompleted.addListener((d) => {
    if (d.tabId < 0) return;
    const rec = staging.get(d.tabId) ?? blank(d.url);
    if (rec.status == null) rec.status = d.statusCode;
    if (Object.keys(rec.responseHeaders).length === 0 && d.responseHeaders) {
      rec.responseHeaders = toObject(d.responseHeaders);
    }
    rec.ip = d.ip;
    rec.fromCache = d.fromCache;
    rec.finalUrl = d.url;
    rec.completedAt = Date.now();
    persist(d.tabId, rec);
    staging.delete(d.tabId);
  }, filter, ['responseHeaders']);

  chrome.webRequest.onErrorOccurred.addListener((d) => {
    if (d.tabId < 0) return;
    const rec = staging.get(d.tabId);
    if (rec) {
      rec.completedAt = Date.now();
      persist(d.tabId, rec);
      staging.delete(d.tabId);
    }
  }, filter);

  chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.session.remove(key(tabId)).catch(() => {});
  });

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === MSG.GET_HTTP && typeof msg.tabId === 'number') {
      chrome.storage.session
        .get(key(msg.tabId))
        .then((o) => sendResponse(o[key(msg.tabId)] ?? null))
        .catch(() => sendResponse(null));
      return true;
    }

    if (msg?.type === MSG.CHECK_LINKS && Array.isArray(msg.urls)) {
      const urls = dedupe(msg.urls).slice(0, MAX_LINKS);
      void runPool(urls, CONCURRENCY, async (url) => {
        const r = await probe(url);
        chrome.runtime.sendMessage({ type: MSG.LINK_RESULT, tabId: msg.tabId, url, ...r }).catch(() => {});
      }).then(() => {
        chrome.runtime.sendMessage({ type: MSG.LINK_DONE, tabId: msg.tabId }).catch(() => {});
      });
      sendResponse({ started: true, total: urls.length });
      return true;
    }

    if (msg?.type === MSG.PROBE_URLS && Array.isArray(msg.urls)) {
      const urls = dedupe(msg.urls).slice(0, 12);
      const out: Record<string, { state: ProbeState; status: number | null }> = {};
      void runPool(urls, CONCURRENCY, async (url) => {
        out[url] = await probe(url);
      }).then(() => sendResponse(out));
      return true;
    }

    return false;
  });

  function persist(tabId: number, rec: HttpRecord) {
    chrome.storage.session.set({ [key(tabId)]: rec }).catch(() => {});
  }
});

function blank(url: string): HttpRecord {
  return { url, finalUrl: url, status: null, redirects: [], responseHeaders: {}, completedAt: 0 };
}

function toObject(headers?: chrome.webRequest.HttpHeader[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const h of headers ?? []) {
    if (!h.name) continue;
    out[h.name] = h.value ?? '';
  }
  return out;
}

function pick(headers: chrome.webRequest.HttpHeader[] | undefined, name: string): string | undefined {
  const lower = name.toLowerCase();
  return headers?.find((h) => h.name.toLowerCase() === lower)?.value;
}

// ── Link / URL checking ────────────────────────────────────────────────────
const MAX_LINKS = 300;
const CONCURRENCY = 5;
const TIMEOUT_MS = 8000;
const probeCache = new Map<string, { state: ProbeState; status: number | null }>();

async function probe(url: string): Promise<{ state: ProbeState; status: number | null }> {
  const cached = probeCache.get(url);
  if (cached) return cached;
  const result = await fetchStatus(url);
  probeCache.set(url, result);
  return result;
}

async function fetchStatus(url: string): Promise<{ state: ProbeState; status: number | null }> {
  for (const method of ['HEAD', 'GET'] as const) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        credentials: 'omit',
        signal: ctrl.signal,
        headers: method === 'GET' ? { Range: 'bytes=0-0' } : undefined,
      });
      clearTimeout(timer);
      if (res.status === 405 && method === 'HEAD') continue; // some servers reject HEAD
      return { state: classify(res.status, res.redirected), status: res.status };
    } catch {
      clearTimeout(timer);
      if (method === 'GET') return { state: 'unknown', status: null };
      // HEAD failed (network/abort/CORS) — fall through and try GET
    }
  }
  return { state: 'unknown', status: null };
}

async function runPool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>): Promise<void> {
  let i = 0;
  const run = async () => {
    while (i < items.length) {
      const idx = i++;
      await worker(items[idx]!);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
}

function dedupe(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    if (!/^https?:\/\//i.test(u)) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}
