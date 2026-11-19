import { defineContentScript } from '#imports';

// Runs in the page's MAIN world so it can intercept the site's own
// history.pushState / replaceState calls (an isolated content script cannot).
// It only touches window/history and dispatches a DOM event that the isolated
// content script (content.ts) listens for — no chrome.* APIs here.
export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  world: 'MAIN',
  main() {
    const fire = () => window.dispatchEvent(new Event('seo-console:locationchange'));
    (['pushState', 'replaceState'] as const).forEach((name) => {
      const original = history[name];
      history[name] = function (this: History, ...args: unknown[]) {
        const ret = (original as (...a: unknown[]) => unknown).apply(this, args);
        fire();
        return ret;
      } as History[typeof name];
    });
    window.addEventListener('popstate', fire);
    window.addEventListener('hashchange', fire);
  },
});
