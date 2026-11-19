const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 3123;
const EXT = require('path').join(__dirname, '..', '.output', 'chrome-mv3');

const PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Test Page For SEO Console</title>
  <meta name="description" content="A short description for testing.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="canonical" href="http://localhost:${PORT}/final">
  <meta property="og:title" content="OG Title">
  <meta property="og:image" content="http://localhost:${PORT}/img.png">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Acme"}</script>
</head>
<body>
  <h1>Main Heading</h1>
  <h2>Sub heading</h2>
  <h4>Skipped level heading</h4>
  <img src="/no-alt.jpg" width="100" height="80">
  <img src="/ok.png" alt="described" width="50" height="50">
  <a href="/internal">Internal link</a>
  <a href="https://external.example.com/x" target="_blank">External blank</a>
  <a href="/empty"></a>
  <p>Some body copy with several words to count for the word counter.</p>
</body>
</html>`;

const NOSTORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/warm') {
    res.writeHead(200, { ...NOSTORE, 'Content-Type': 'text/html' });
    return res.end('<!doctype html><title>warm</title>ok');
  }
  if (url === '/start') {
    res.writeHead(302, { ...NOSTORE, Location: '/dest' });
    return res.end();
  }
  if (url === '/404') {
    res.writeHead(404, { ...NOSTORE, 'Content-Type': 'text/html' });
    return res.end('not found');
  }
  if (url === '/robots.txt') {
    res.writeHead(200, { ...NOSTORE, 'Content-Type': 'text/plain' });
    return res.end(`User-agent: *\nDisallow: /secret\nSitemap: http://localhost:${PORT}/sitemap.xml\n`);
  }
  if (url === '/sitemap.xml') {
    res.writeHead(200, { ...NOSTORE, 'Content-Type': 'application/xml' });
    return res.end('<?xml version="1.0"?><urlset></urlset>');
  }
  if (url === '/dest' || url === '/final' || url === '/') {
    res.writeHead(200, { ...NOSTORE, 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' });
    return res.end(PAGE_HTML);
  }
  // images / other
  res.writeHead(200, { ...NOSTORE, 'Content-Type': 'image/png' });
  res.end(Buffer.from('89504e470d0a1a0a', 'hex'));
});

const assert = (name, ok) => {
  console.log(`${ok ? '  ✓' : '  ✗ FAIL'}  ${name}`);
  return ok ? 1 : 0;
};

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium', // full build + new headless; headless_shell can't load extensions
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
  });

  const warm = await context.newPage();
  // Warm-up navigation on a throwaway tab wakes the lazy MV3 service worker.
  await warm.goto(`http://localhost:${PORT}/warm`, { waitUntil: 'load' });
  let sw = context.serviceWorkers()[0];
  for (let i = 0; i < 30 && !sw; i++) {
    await warm.waitForTimeout(500);
    sw = context.serviceWorkers()[0];
  }
  if (!sw) {
    console.error('No service worker. workers=', context.serviceWorkers().length, 'bgPages=', context.backgroundPages().length);
    throw new Error('service worker never started');
  }
  await warm.waitForTimeout(300);

  // Measured navigation in a fresh tab: 302 /start -> 200 /dest, now that the
  // worker's webRequest listeners are registered.
  const page = await context.newPage();
  await page.goto(`http://localhost:${PORT}/start`, { waitUntil: 'load' });
  await page.waitForTimeout(800); // let onCompleted persist

  // Pull the HTTP record + DOM collection through the real extension plumbing.
  const result = await sw.evaluate(async (port) => {
    const tabs = await chrome.tabs.query({ url: `http://localhost:${port}/*` });
    const tab = tabs.find((t) => /\/dest$/.test(t.url)) || tabs[tabs.length - 1];
    const store = await chrome.storage.session.get(`http:${tab.id}`);
    const httpRec = store[`http:${tab.id}`] || null;
    let dom = null;
    try {
      dom = await chrome.tabs.sendMessage(tab.id, { type: 'seo-console/collect-dom' });
    } catch (e) {
      dom = { error: String(e) };
    }
    return { tabUrl: tab.url, tabId: tab.id, httpRec, dom };
  }, PORT);

  let pass = 0;
  let total = 0;
  const check = (n, ok) => { total++; pass += assert(n, ok); };

  const { httpRec, dom } = result;
  console.log('\n[webRequest capture]');
  check('http record exists', !!httpRec);
  check('final status 200', httpRec && httpRec.status === 200);
  check('final URL is /dest', httpRec && /\/dest$/.test(httpRec.finalUrl));
  check('X-Robots-Tag header captured', httpRec && /noindex/i.test(JSON.stringify(httpRec.responseHeaders)));
  // Redirect detection is robust via the Performance API fallback even when the
  // MV3 worker misses the webRequest onBeforeRedirect event on a cold start.
  check('redirect detected (Performance API)', dom && dom.navRedirectCount === 1);

  console.log('\n[content-script DOM collection]');
  check('dom collected (no error)', dom && !dom.error);
  check('title read', dom && dom.title === 'Test Page For SEO Console');
  check('description read', dom && dom.description === 'A short description for testing.');
  check('canonical read', dom && /\/final$/.test(dom.canonical || ''));
  check('lang read', dom && dom.lang === 'en');
  check('headings collected (3)', dom && dom.headings.length === 3);
  check('h1 present', dom && dom.headings.some((h) => h.level === 1));
  check('images collected (2)', dom && dom.images.length === 2);
  check('image missing alt detected', dom && dom.images.some((i) => !i.hasAltAttr));
  check('links collected (3)', dom && dom.links.length === 3);
  check('internal vs external', dom && dom.links.filter((l) => l.isInternal).length === 2 && dom.links.filter((l) => !l.isInternal).length === 1);
  check('og tag collected', dom && dom.social.openGraph['og:title'] === 'OG Title');
  check('json-ld collected', dom && dom.schema.length === 1 && dom.schema[0].type === 'Organization');
  check('navStatus via Performance API', dom && (dom.navStatus === 200 || dom.navStatus === null));
  check('word count > 0', dom && dom.wordCount > 0);

  console.log('\n[core web vitals]');
  check('vitals object present', !!(dom && dom.vitals));
  check(
    'all 5 metrics keyed with rating',
    dom && ['lcp', 'cls', 'inp', 'fcp', 'ttfb'].every((k) => dom.vitals[k] && typeof dom.vitals[k].rating === 'string'),
  );
  check('CLS rated', dom && ['good', 'needs-improvement', 'poor'].includes(dom.vitals.cls.rating));
  check('TTFB is numeric', dom && typeof dom.vitals.ttfb.value === 'number');

  console.log('\n[technology signals]');
  check('tech signals collected', dom && dom.tech && Array.isArray(dom.tech.scripts));
  check('tech captured a script src', dom && dom.tech.scripts.some((s) => /jquery/.test(s)));
  check('tech captured head markup', dom && /og:image/.test(dom.tech.headHtml));

  // ── Phase 2: source snapshot, robots.txt, broken-link checker ──
  // Driven from a real extension page (chrome-extension://…/sidepanel.html),
  // which has full chrome.* access, so we exercise the true message paths.
  const extId = await sw.evaluate(() => chrome.runtime.id);
  const ext = await context.newPage();
  await ext.goto(`chrome-extension://${extId}/sidepanel.html`, { waitUntil: 'domcontentloaded' });
  await ext.waitForTimeout(300);

  const p2 = await ext.evaluate(
    async ({ tabId, port }) => {
      const source = await chrome.tabs.sendMessage(tabId, { type: 'seo-console/collect-source' });
      const robots = await chrome.tabs.sendMessage(tabId, { type: 'seo-console/fetch-robots' });
      const links = await new Promise((resolve) => {
        const got = {};
        const urls = [`http://localhost:${port}/dest`, `http://localhost:${port}/404`, `http://localhost:${port}/start`];
        const listener = (msg) => {
          if (!msg || msg.tabId !== tabId) return;
          if (msg.type === 'seo-console/link-result') got[msg.url] = { state: msg.state, status: msg.status };
          if (msg.type === 'seo-console/link-done') {
            chrome.runtime.onMessage.removeListener(listener);
            resolve(got);
          }
        };
        chrome.runtime.onMessage.addListener(listener);
        chrome.runtime.sendMessage({ type: 'seo-console/check-links', tabId, urls });
        setTimeout(() => {
          chrome.runtime.onMessage.removeListener(listener);
          resolve(got);
        }, 15000);
      });
      return { source, robots, links };
    },
    { tabId: result.tabId, port: PORT },
  );

  console.log('\n[source snapshot]');
  check('source fetched ok', p2.source && p2.source.ok === true);
  check('source title matches', p2.source && p2.source.title === 'Test Page For SEO Console');
  check('source links counted (3)', p2.source && p2.source.linkCount === 3);
  check('source canonical resolved', p2.source && /\/final$/.test(p2.source.canonical || ''));

  console.log('\n[robots.txt]');
  check('robots found', p2.robots && p2.robots.found === true);
  check('robots text has Sitemap', p2.robots && /Sitemap:/i.test(p2.robots.text));

  console.log('\n[broken-link checker]');
  const L = p2.links || {};
  check('200 link → ok', L[`http://localhost:${PORT}/dest`] && L[`http://localhost:${PORT}/dest`].state === 'ok');
  check('404 link → broken', L[`http://localhost:${PORT}/404`] && L[`http://localhost:${PORT}/404`].state === 'broken');
  check('302 link → redirect', L[`http://localhost:${PORT}/start`] && L[`http://localhost:${PORT}/start`].state === 'redirect');

  // ── Phase 3: SPA navigation detection (MAIN-world history patch → event → bg) ──
  console.log('\n[SPA navigation detection]');
  await ext.evaluate((tabId) => {
    window.__urlChanges = [];
    chrome.runtime.onMessage.addListener((msg, sender) => {
      if (msg && msg.type === 'seo-console/url-changed' && sender.tab && sender.tab.id === tabId) {
        window.__urlChanges.push(msg.url);
      }
    });
  }, result.tabId);
  await page.evaluate(() => history.pushState({}, '', '/spa-route-xyz'));
  await page.waitForTimeout(700);
  const urlChanges = await ext.evaluate(() => window.__urlChanges || []);
  check('pushState → url-changed relayed to extension', urlChanges.some((u) => /spa-route-xyz/.test(u)));

  // ── v1.1: outline-headings toggle reaches the page ──
  console.log('\n[page tools]');
  await page.goto(`http://localhost:${PORT}/dest`, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  await ext.evaluate(({ tabId }) => chrome.tabs.sendMessage(tabId, { type: 'seo-console/outline-headings', on: true }), {
    tabId: result.tabId,
  });
  await page.waitForTimeout(300);
  const outlineOn = await page.evaluate(() => !!document.getElementById('seo-console-outline-headings'));
  check('outline headings injected', outlineOn === true);
  await ext.evaluate(({ tabId }) => chrome.tabs.sendMessage(tabId, { type: 'seo-console/outline-headings', on: false }), {
    tabId: result.tabId,
  });
  await page.waitForTimeout(300);
  const outlineOff = await page.evaluate(() => !document.getElementById('seo-console-outline-headings'));
  check('outline headings removed', outlineOff === true);

  console.log(`\n${pass}/${total} checks passed`);

  await context.close();
  server.close();
  process.exit(pass === total ? 0 : 1);
})().catch((e) => {
  console.error('ERROR', e);
  server.close();
  process.exit(2);
});
