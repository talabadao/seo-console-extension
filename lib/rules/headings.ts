import type { Issue } from '../types';
import type { Rule } from './types';

export const headingRules: Rule[] = [
  {
    id: 'h1-missing',
    evaluate: (r): Issue[] => {
      const h1 = r.headings.filter((h) => h.level === 1);
      if (h1.length === 0)
        return [{ ruleId: 'h1-missing', severity: 'error', message: 'No H1 heading on the page' }];
      return [];
    },
  },
  {
    id: 'h1-multiple',
    evaluate: (r): Issue[] => {
      const h1 = r.headings.filter((h) => h.level === 1);
      if (h1.length > 1)
        return [{
          ruleId: 'h1-multiple',
          severity: 'warning',
          message: `Multiple H1 headings (${h1.length})`,
          detail: h1.map((h) => h.text || '(empty)').slice(0, 5).join('  •  '),
          selector: h1[1]?.selector,
          count: h1.length,
        }];
      return [];
    },
  },
  {
    id: 'heading-order',
    evaluate: (r): Issue[] => {
      const issues: Issue[] = [];
      let prev = 0;
      for (const h of r.headings) {
        if (prev && h.level > prev + 1) {
          issues.push({
            ruleId: 'heading-order',
            severity: 'warning',
            message: `Skipped heading level (H${prev} → H${h.level})`,
            detail: h.text || '(empty heading)',
            selector: h.selector,
          });
        }
        prev = h.level;
      }
      // Report at most one representative issue to avoid noise, but keep count.
      const first = issues[0];
      if (first) {
        return [{
          ...first,
          count: issues.length,
          message: `${first.message}${issues.length > 1 ? ` (+${issues.length - 1} more)` : ''}`,
        }];
      }
      return [];
    },
  },
  {
    id: 'heading-empty',
    evaluate: (r): Issue[] => {
      const empties = r.headings.filter((h) => !h.text);
      if (empties.length)
        return [{
          ruleId: 'heading-empty',
          severity: 'warning',
          message: `${empties.length} empty heading${empties.length > 1 ? 's' : ''}`,
          selector: empties[0]!.selector,
          count: empties.length,
        }];
      return [];
    },
  },
];
