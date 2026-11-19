import type { SourceSnapshot } from '../audit/types';

/** Parse raw server HTML (fetched in the content script) into a comparable snapshot. */
export function collectSourceFromHtml(html: string, baseHref: string, status: number | null): SourceSnapshot {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const title = text(doc.querySelector('title'));
  const description = attr(doc.querySelector('meta[name="description" i]'), 'content');
  const metaRobots = attr(doc.querySelector('meta[name="robots" i]'), 'content');
  const lang = doc.documentElement.getAttribute('lang');

  const canonicalRaw = doc.querySelector('link[rel="canonical" i]')?.getAttribute('href') ?? null;
  let canonical: string | null = null;
  if (canonicalRaw) {
    try {
      canonical = new URL(canonicalRaw, baseHref).href;
    } catch {
      canonical = canonicalRaw;
    }
  }

  const h1s = doc.querySelectorAll('h1');
  const body = doc.body;
  let wordCount = 0;
  if (body) {
    const clone = body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('script, style, noscript, template, svg').forEach((n) => n.remove());
    const t = (clone.textContent || '').replace(/\s+/g, ' ').trim();
    wordCount = t ? t.split(' ').filter(Boolean).length : 0;
  }

  return {
    ok: true,
    status,
    title,
    description,
    canonical,
    metaRobots,
    lang,
    firstH1: text(h1s[0]),
    h1Count: h1s.length,
    headingCount: doc.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
    linkCount: doc.querySelectorAll('a[href]').length,
    imageCount: doc.querySelectorAll('img').length,
    wordCount,
  };
}

function text(el: Element | null | undefined): string | null {
  if (!el) return null;
  const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
  return t.length ? t : null;
}
function attr(el: Element | null, name: string): string | null {
  const v = el?.getAttribute(name)?.trim();
  return v && v.length ? v : null;
}
