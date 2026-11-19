import type { SocialData } from '../types';

export function collectSocial(doc: Document): SocialData {
  const openGraph: Record<string, string> = {};
  const twitter: Record<string, string> = {};

  doc.querySelectorAll('meta[property^="og:" i], meta[property^="article:" i]').forEach((el) => {
    const key = (el.getAttribute('property') || '').toLowerCase();
    const val = el.getAttribute('content') || '';
    if (key && !(key in openGraph)) openGraph[key] = val;
  });

  doc.querySelectorAll('meta[name^="twitter:" i]').forEach((el) => {
    const key = (el.getAttribute('name') || '').toLowerCase();
    const val = el.getAttribute('content') || '';
    if (key && !(key in twitter)) twitter[key] = val;
  });

  return { openGraph, twitter };
}
