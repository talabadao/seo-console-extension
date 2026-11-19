import type { ImageInfo } from '../types';
import { cssPath } from './selector';

export function collectImages(doc: Document): ImageInfo[] {
  // Map resource timing entries by URL to recover transfer sizes.
  const sizes = new Map<string, number>();
  try {
    for (const e of performance.getEntriesByType('resource') as PerformanceResourceTiming[]) {
      if (e.initiatorType === 'img' || e.initiatorType === 'css') {
        sizes.set(e.name, e.transferSize);
      }
    }
  } catch {
    /* Performance API unavailable — leave sizes empty. */
  }

  const out: ImageInfo[] = [];
  doc.querySelectorAll('img').forEach((img) => {
    const src = img.currentSrc || img.src || img.getAttribute('src') || '';
    const widthAttr = img.getAttribute('width');
    const heightAttr = img.getAttribute('height');
    out.push({
      src,
      alt: img.hasAttribute('alt') ? img.getAttribute('alt') : null,
      hasAltAttr: img.hasAttribute('alt'),
      widthAttr: widthAttr != null ? parseInt(widthAttr, 10) || null : null,
      heightAttr: heightAttr != null ? parseInt(heightAttr, 10) || null : null,
      naturalWidth: img.naturalWidth || 0,
      naturalHeight: img.naturalHeight || 0,
      loading: img.getAttribute('loading'),
      format: formatFromUrl(src),
      transferSize: sizes.has(src) ? sizes.get(src)! : null,
      selector: cssPath(img),
    });
  });
  return out;
}

function formatFromUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('data:')) {
    const m = url.match(/^data:image\/([a-z0-9.+-]+)/i);
    return m?.[1] ? m[1].toLowerCase() : 'data';
  }
  try {
    const path = new URL(url, location.href).pathname;
    const m = path.match(/\.([a-z0-9]+)$/i);
    return m?.[1] ? m[1].toLowerCase() : '';
  } catch {
    const m = (url.split('?')[0] ?? '').match(/\.([a-z0-9]+)$/i);
    return m?.[1] ? m[1].toLowerCase() : '';
  }
}
