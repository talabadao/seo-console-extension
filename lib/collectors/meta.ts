import type { DomCollection } from '../types';

type MetaPart = Pick<
  DomCollection,
  | 'doctype'
  | 'title'
  | 'titleTagCount'
  | 'description'
  | 'descriptionCount'
  | 'canonical'
  | 'metaRobots'
  | 'lang'
  | 'charset'
  | 'viewport'
  | 'hreflang'
>;

export function collectMeta(doc: Document): MetaPart {
  const titleEls = doc.querySelectorAll('head title, title');
  const descEls = doc.querySelectorAll('meta[name="description" i]');
  const canonicalEl = doc.querySelector('link[rel="canonical" i]');
  const robotsEl = doc.querySelector('meta[name="robots" i]');
  const viewportEl = doc.querySelector('meta[name="viewport" i]');

  let charset: string | null = null;
  const charsetEl = doc.querySelector('meta[charset]');
  if (charsetEl) charset = charsetEl.getAttribute('charset');
  const httpEquivType = doc.querySelector('meta[http-equiv="content-type" i]');
  if (!charset && httpEquivType) {
    const m = (httpEquivType.getAttribute('content') || '').match(/charset=([^;]+)/i);
    if (m && m[1]) charset = m[1].trim();
  }

  const hreflang = Array.from(
    doc.querySelectorAll('link[rel="alternate" i][hreflang]'),
  ).map((el) => ({
    lang: el.getAttribute('hreflang') || '',
    href: (el as HTMLLinkElement).href || el.getAttribute('href') || '',
  }));

  return {
    doctype: doc.doctype ? serializeDoctype(doc.doctype) : null,
    title: text(titleEls[0]),
    titleTagCount: titleEls.length,
    description: descEls[0]?.getAttribute('content')?.trim() ?? null,
    descriptionCount: descEls.length,
    canonical: canonicalEl ? (canonicalEl as HTMLLinkElement).href || canonicalEl.getAttribute('href') : null,
    metaRobots: robotsEl?.getAttribute('content')?.trim() ?? null,
    lang: doc.documentElement.getAttribute('lang'),
    charset: charset ? charset.toUpperCase() : null,
    viewport: viewportEl?.getAttribute('content')?.trim() ?? null,
    hreflang,
  };
}

function text(el: Element | undefined): string | null {
  if (!el) return null;
  const t = (el.textContent || '').trim();
  return t.length ? t : null;
}

function serializeDoctype(dt: DocumentType): string {
  let s = '<!DOCTYPE ' + dt.name;
  if (dt.publicId) s += ` PUBLIC "${dt.publicId}"`;
  if (dt.systemId) s += `${dt.publicId ? '' : ' SYSTEM'} "${dt.systemId}"`;
  return s + '>';
}
