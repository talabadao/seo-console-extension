import type { HeadingNode } from '../types';
import { cssPath } from './selector';

export function collectHeadings(doc: Document): HeadingNode[] {
  const nodes = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const out: HeadingNode[] = [];
  nodes.forEach((el) => {
    out.push({
      level: Number(el.nodeName.charAt(1)),
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      selector: cssPath(el),
    });
  });
  return out;
}

export function collectWordCount(doc: Document): number {
  const body = doc.body;
  if (!body) return 0;
  // Clone so we can strip non-content nodes without touching the live page.
  const clone = body.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('script, style, noscript, template, svg').forEach((n) => n.remove());
  const text = (clone.textContent || '').replace(/\s+/g, ' ').trim();
  if (!text) return 0;
  return text.split(' ').filter(Boolean).length;
}
