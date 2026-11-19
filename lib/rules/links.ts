import type { Issue } from '../types';
import type { Rule } from './types';

export const linkRules: Rule[] = [
  {
    id: 'link-empty-anchor',
    evaluate: (r): Issue[] => {
      const empty = r.links.all.filter((l) => !l.text && !/^(mailto:|tel:)/i.test(l.href));
      if (empty.length)
        return [{
          ruleId: 'link-empty-anchor',
          severity: 'warning',
          message: `${empty.length} link${empty.length > 1 ? 's' : ''} with no anchor text`,
          detail: 'Descriptive anchor text helps users and search engines.',
          selector: empty[0]!.selector,
          count: empty.length,
        }];
      return [];
    },
  },
  {
    id: 'link-blank-noopener',
    evaluate: (r): Issue[] => {
      const risky = r.links.all.filter(
        (l) => l.target === '_blank' && !/noopener|noreferrer/i.test(l.rel || ''),
      );
      if (risky.length)
        return [{
          ruleId: 'link-blank-noopener',
          severity: 'warning',
          message: `${risky.length} target="_blank" link${risky.length > 1 ? 's' : ''} without rel="noopener"`,
          detail: 'Add rel="noopener" to prevent reverse-tabnabbing.',
          selector: risky[0]!.selector,
          count: risky.length,
        }];
      return [];
    },
  },
  {
    id: 'generic-anchor-text',
    evaluate: (r): Issue[] => {
      const generic = r.links.all.filter((l) =>
        /^(click here|here|read more|more|link|this)$/i.test(l.text.trim()),
      );
      if (generic.length)
        return [{
          ruleId: 'generic-anchor-text',
          severity: 'info',
          message: `${generic.length} link${generic.length > 1 ? 's' : ''} with generic anchor text`,
          detail: 'e.g. "click here", "read more". Prefer descriptive text.',
          selector: generic[0]!.selector,
          count: generic.length,
        }];
      return [];
    },
  },
];
