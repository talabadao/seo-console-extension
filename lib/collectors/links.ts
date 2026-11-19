import type { LinkInfo } from '../types';
import { cssPath } from './selector';

export function collectLinks(doc: Document, loc: Location): LinkInfo[] {
  const host = loc.hostname;
  const out: LinkInfo[] = [];

  doc.querySelectorAll('a[href]').forEach((a) => {
    const el = a as HTMLAnchorElement;
    const raw = el.getAttribute('href') || '';
    // Skip non-navigational schemes.
    if (/^(javascript:|mailto:|tel:|sms:|#)/i.test(raw.trim())) {
      // Still record anchors/mailto so counts are honest, but mark internal.
    }
    const href = el.href; // resolved absolute URL
    const rel = (el.getAttribute('rel') || '').toLowerCase();
    let isInternal = true;
    try {
      isInternal = new URL(href).hostname === host;
    } catch {
      isInternal = true;
    }

    out.push({
      href,
      text: linkText(el),
      rel: el.getAttribute('rel'),
      target: el.getAttribute('target'),
      isInternal,
      isNofollow: /\bnofollow\b/.test(rel),
      isSponsored: /\bsponsored\b/.test(rel),
      isUgc: /\bugc\b/.test(rel),
      selector: cssPath(el),
    });
  });

  return out;
}

function linkText(el: HTMLAnchorElement): string {
  const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
  if (t) return t;
  const aria = el.getAttribute('aria-label');
  if (aria) return aria.trim();
  const img = el.querySelector('img[alt]');
  if (img) {
    const alt = (img.getAttribute('alt') || '').trim();
    if (alt) return `[img] ${alt}`;
  }
  const title = el.getAttribute('title');
  return title ? title.trim() : '';
}
