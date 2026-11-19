import type { SchemaItem } from '../types';

export function collectSchema(doc: Document): SchemaItem[] {
  const out: SchemaItem[] = [];
  doc.querySelectorAll('script[type="application/ld+json" i]').forEach((el) => {
    const text = el.textContent || '';
    if (!text.trim()) return;
    try {
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        out.push({ type: schemaType(item), valid: true, raw: item });
      }
    } catch (e) {
      out.push({
        type: 'Invalid',
        valid: false,
        error: e instanceof Error ? e.message : String(e),
        raw: text.slice(0, 500),
      });
    }
  });
  return out;
}

function schemaType(item: unknown): string {
  if (item && typeof item === 'object') {
    const t = (item as Record<string, unknown>)['@type'];
    if (typeof t === 'string') return t;
    if (Array.isArray(t)) return t.filter((x) => typeof x === 'string').join(', ') || 'Unknown';
    if ((item as Record<string, unknown>)['@graph']) return '@graph';
  }
  return 'Unknown';
}
