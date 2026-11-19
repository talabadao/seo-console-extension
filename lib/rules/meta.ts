import type { Issue } from '../types';
import type { Rule } from './types';
import { getSettings } from '../settings';

export const metaRules: Rule[] = [
  {
    id: 'title-missing',
    evaluate: (r): Issue[] =>
      r.meta.title
        ? []
        : [{ ruleId: 'title-missing', severity: 'error', message: 'Missing <title> tag', selector: 'title' }],
  },
  {
    id: 'title-length',
    evaluate: (r): Issue[] => {
      if (!r.meta.title) return [];
      const s = getSettings();
      const px = r.meta.titlePixelWidth;
      const chars = r.meta.titleLength;
      if (px > s.titleMaxPx)
        return [{
          ruleId: 'title-length',
          severity: 'warning',
          message: `Title too long — likely truncated in search results`,
          detail: `${px}px / ${chars} chars (Google shows ~${s.titleMaxPx}px on desktop).`,
          selector: 'title',
        }];
      if (px > 0 && px < s.titleMinPx)
        return [{
          ruleId: 'title-length',
          severity: 'info',
          message: `Title is very short`,
          detail: `${px}px / ${chars} chars. Consider a more descriptive title.`,
          selector: 'title',
        }];
      return [];
    },
  },
  {
    id: 'title-duplicate',
    evaluate: (r): Issue[] =>
      r.meta.titleTagCount > 1
        ? [{
            ruleId: 'title-duplicate',
            severity: 'warning',
            message: `Multiple <title> tags (${r.meta.titleTagCount})`,
            detail: 'A page should have exactly one title.',
            selector: 'title',
            count: r.meta.titleTagCount,
          }]
        : [],
  },
  {
    id: 'description-duplicate',
    evaluate: (r): Issue[] =>
      r.meta.descriptionCount > 1
        ? [{
            ruleId: 'description-duplicate',
            severity: 'warning',
            message: `Multiple meta descriptions (${r.meta.descriptionCount})`,
            count: r.meta.descriptionCount,
          }]
        : [],
  },
  {
    id: 'description-missing',
    evaluate: (r): Issue[] =>
      r.meta.description
        ? []
        : [{
            ruleId: 'description-missing',
            severity: 'warning',
            message: 'Missing meta description',
            detail: 'Google may generate its own snippet. Add a description to control it.',
          }],
  },
  {
    id: 'description-length',
    evaluate: (r): Issue[] => {
      if (!r.meta.description) return [];
      const s = getSettings();
      const px = r.meta.descriptionPixelWidth;
      const chars = r.meta.descriptionLength;
      if (px > s.descMaxPx)
        return [{
          ruleId: 'description-length',
          severity: 'warning',
          message: 'Meta description too long — likely truncated',
          detail: `${px}px / ${chars} chars (Google shows ~${s.descMaxPx}px on desktop).`,
        }];
      if (px > 0 && px < s.descMinPx)
        return [{
          ruleId: 'description-length',
          severity: 'info',
          message: 'Meta description is short',
          detail: `${px}px / ${chars} chars. There is room to say more.`,
        }];
      return [];
    },
  },
  {
    id: 'canonical-missing',
    evaluate: (r): Issue[] =>
      r.meta.canonical
        ? []
        : [{
            ruleId: 'canonical-missing',
            severity: 'info',
            message: 'No canonical URL',
            detail: 'A canonical link helps consolidate duplicate URLs.',
          }],
  },
  {
    id: 'canonical-mismatch',
    evaluate: (r): Issue[] => {
      if (!r.meta.canonical) return [];
      if (normalize(r.meta.canonical) !== normalize(r.finalUrl))
        return [{
          ruleId: 'canonical-mismatch',
          severity: 'info',
          message: 'Canonical points to a different URL',
          detail: `Canonical: ${r.meta.canonical}`,
        }];
      return [];
    },
  },
  {
    id: 'meta-robots-noindex',
    evaluate: (r): Issue[] => {
      const robots = (r.meta.robots || '').toLowerCase();
      if (/\bnoindex\b/.test(robots))
        return [{
          ruleId: 'meta-robots-noindex',
          severity: 'error',
          message: 'Page is set to noindex',
          detail: `meta robots: "${r.meta.robots}" — this page will be kept out of search results.`,
        }];
      return [];
    },
  },
  {
    id: 'lang-missing',
    evaluate: (r): Issue[] =>
      r.meta.lang
        ? []
        : [{ ruleId: 'lang-missing', severity: 'warning', message: 'Missing lang attribute on <html>' }],
  },
  {
    id: 'viewport-missing',
    evaluate: (r): Issue[] =>
      r.meta.viewport
        ? []
        : [{ ruleId: 'viewport-missing', severity: 'warning', message: 'Missing viewport meta (mobile-friendliness)' }],
  },
  {
    id: 'charset-missing',
    evaluate: (r): Issue[] =>
      r.meta.charset
        ? []
        : [{ ruleId: 'charset-missing', severity: 'info', message: 'No charset declared' }],
  },
];

function normalize(u: string): string {
  try {
    const url = new URL(u);
    url.hash = '';
    return url.href.replace(/\/$/, '');
  } catch {
    return u.replace(/\/$/, '');
  }
}

