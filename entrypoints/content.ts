import { defineContentScript } from '#imports';
import { MSG } from '@/lib/messaging';
import { collectPage } from '@/lib/collectors';
import { collectSourceFromHtml } from '@/lib/collectors/source';
import { createVitalsCollector } from '@/lib/collectors/vitals';
import { highlight, clearHighlight } from '@/lib/collectors/highlight';
import { setOutlineHeadings, setOutlineLinks } from '@/lib/collectors/outline';
import { setRuler } from '@/lib/collectors/ruler';
import type { SourceSnapshot } from '@/lib/audit/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    // Start observing Core Web Vitals as early as this script runs (buffered
    // entries cover what happened before).
    const getVitals = createVitalsCollector();

    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      try {
        switch (msg?.type) {
          case MSG.COLLECT_DOM:
            sendResponse(collectPage(document, location, getVitals()));
            return false;
          case MSG.HIGHLIGHT:
            sendResponse(highlight(msg.selector));
            return false;
          case MSG.CLEAR_HIGHLIGHT:
            clearHighlight();
            sendResponse(true);
            return false;
          case MSG.COLLECT_SOURCE:
            collectSource().then(sendResponse);
            return true; // async
          case MSG.FETCH_ROBOTS:
            fetchRobots().then(sendResponse);
            return true; // async
          case MSG.OUTLINE_HEADINGS:
            setOutlineHeadings(!!msg.on);
            sendResponse(true);
            return false;
          case MSG.OUTLINE_LINKS:
            setOutlineLinks(!!msg.on);
            sendResponse(true);
            return false;
          case MSG.RULER:
            setRuler(!!msg.on);
            sendResponse(true);
            return false;
        }
      } catch (e) {
        sendResponse({ error: e instanceof Error ? e.message : String(e) });
        return false;
      }
      return false;
    });

    // SPA navigation detection: history.pushState / replaceState / popstate do
    // not fire tabs.onUpdated, so tell the side panel to re-analyze.
    installUrlChangeWatch();
  },
});

function installUrlChangeWatch() {
  let last = location.href;
  const notify = () => {
    if (location.href === last) return;
    last = location.href;
    chrome.runtime.sendMessage({ type: MSG.URL_CHANGED, url: location.href }).catch(() => {});
  };
  // history.pushState is patched in the MAIN world (history.content.ts) which
  // bridges to us via this DOM event; popstate/hashchange fire here directly.
  window.addEventListener('seo-console:locationchange', () => setTimeout(notify, 0));
  window.addEventListener('popstate', () => setTimeout(notify, 0));
  window.addEventListener('hashchange', () => setTimeout(notify, 0));
}

/** Fetch the raw server HTML (same origin) and reduce it to a comparable snapshot. */
async function collectSource(): Promise<SourceSnapshot> {
  try {
    const res = await fetch(location.href, { credentials: 'include', cache: 'no-store' });
    const html = await res.text();
    return collectSourceFromHtml(html, location.href, res.status);
  } catch (e) {
    return emptySource(e instanceof Error ? e.message : String(e));
  }
}

async function fetchRobots() {
  try {
    const res = await fetch(`${location.origin}/robots.txt`, { credentials: 'omit', cache: 'no-store' });
    const text = res.ok ? await res.text() : '';
    return { found: res.ok, status: res.status, text };
  } catch (e) {
    return { found: false, status: null, text: '', error: e instanceof Error ? e.message : String(e) };
  }
}

function emptySource(error: string): SourceSnapshot {
  return {
    ok: false,
    status: null,
    error,
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
