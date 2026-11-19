import type { Issue } from '../types';
import type { Rule } from './types';
import { getSettings } from '../settings';

export const imageRules: Rule[] = [
  {
    id: 'img-missing-alt',
    evaluate: (r): Issue[] => {
      const missing = r.images.filter((i) => !i.hasAltAttr);
      if (missing.length)
        return [{
          ruleId: 'img-missing-alt',
          severity: 'warning',
          message: `${missing.length} image${missing.length > 1 ? 's' : ''} missing alt attribute`,
          detail: 'Alt text helps accessibility and image search.',
          selector: missing[0]!.selector,
          count: missing.length,
        }];
      return [];
    },
  },
  {
    id: 'img-empty-alt',
    evaluate: (r): Issue[] => {
      // alt="" is valid for decorative images, so this is informational only.
      const empty = r.images.filter((i) => i.hasAltAttr && i.alt === '');
      if (empty.length)
        return [{
          ruleId: 'img-empty-alt',
          severity: 'info',
          message: `${empty.length} image${empty.length > 1 ? 's' : ''} with empty alt (decorative)`,
          selector: empty[0]!.selector,
          count: empty.length,
        }];
      return [];
    },
  },
  {
    id: 'img-missing-dimensions',
    evaluate: (r): Issue[] => {
      const missing = r.images.filter((i) => i.widthAttr == null || i.heightAttr == null);
      if (missing.length)
        return [{
          ruleId: 'img-missing-dimensions',
          severity: 'info',
          message: `${missing.length} image${missing.length > 1 ? 's' : ''} without width/height`,
          detail: 'Explicit dimensions reduce layout shift (CLS).',
          selector: missing[0]!.selector,
          count: missing.length,
        }];
      return [];
    },
  },
  {
    id: 'img-large',
    evaluate: (r): Issue[] => {
      const largeBytes = getSettings().imageLargeKB * 1024;
      const big = r.images
        .filter((i) => (i.transferSize ?? 0) > largeBytes)
        .sort((a, b) => (b.transferSize ?? 0) - (a.transferSize ?? 0));
      if (big.length)
        return [{
          ruleId: 'img-large',
          severity: 'info',
          message: `${big.length} large image${big.length > 1 ? 's' : ''} (> ${Math.round(largeBytes / 1024)} KB)`,
          detail: `Largest: ${Math.round((big[0]!.transferSize ?? 0) / 1024)} KB — ${big[0]!.src.slice(0, 80)}`,
          selector: big[0]!.selector,
          count: big.length,
        }];
      return [];
    },
  },
];
