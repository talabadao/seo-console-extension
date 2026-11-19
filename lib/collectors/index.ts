import type { DomCollection, Vitals } from '../types';
import { collectMeta } from './meta';
import { collectHeadings, collectWordCount } from './headings';
import { collectImages } from './images';
import { collectLinks } from './links';
import { collectSchema } from './schema';
import { collectSocial } from './social';
import { collectTech } from './tech';
import { emptyVitals } from './vitals';

export function collectPage(doc: Document, loc: Location, vitals: Vitals = emptyVitals()): DomCollection {
  const meta = collectMeta(doc);
  const nav = getNavigation();

  return {
    url: loc.href,
    ...meta,
    headings: collectHeadings(doc),
    images: collectImages(doc),
    links: collectLinks(doc, loc),
    schema: collectSchema(doc),
    social: collectSocial(doc),
    navStatus: nav.status,
    navRedirectCount: nav.redirectCount,
    fromCache: nav.fromCache,
    wordCount: collectWordCount(doc),
    vitals,
    tech: collectTech(doc),
  };
}

function getNavigation(): { status: number | null; redirectCount: number; fromCache: boolean } {
  try {
    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const nav = entries[0];
    if (!nav) return { status: null, redirectCount: 0, fromCache: false };
    // responseStatus is available in Chrome 109+.
    const status = typeof (nav as unknown as { responseStatus?: number }).responseStatus === 'number'
      ? (nav as unknown as { responseStatus: number }).responseStatus || null
      : null;
    const fromCache = nav.transferSize === 0 && nav.decodedBodySize > 0;
    return { status, redirectCount: nav.redirectCount || 0, fromCache };
  } catch {
    return { status: null, redirectCount: 0, fromCache: false };
  }
}
