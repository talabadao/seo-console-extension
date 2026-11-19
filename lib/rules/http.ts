import type { Issue } from '../types';
import type { Rule } from './types';

export const httpRules: Rule[] = [
  {
    id: 'status-code',
    evaluate: (r): Issue[] => {
      const s = r.http.status;
      if (s == null) return [];
      if (s >= 500)
        return [{ ruleId: 'status-code', severity: 'error', message: `Server error — HTTP ${s}` }];
      if (s >= 400)
        return [{ ruleId: 'status-code', severity: 'error', message: `Client error — HTTP ${s}` }];
      if (s >= 300)
        return [{ ruleId: 'status-code', severity: 'warning', message: `Redirect status — HTTP ${s}` }];
      return [];
    },
  },
  {
    id: 'redirect-chain',
    evaluate: (r): Issue[] => {
      const n = r.http.redirectCount;
      if (n < 1) return [];
      // Detailed chain if webRequest captured it, else a count-only note.
      const detail = r.http.redirects.length
        ? [...r.http.redirects.map((h) => `${h.status} ${h.url}`), `→ ${r.finalUrl}`].join('  →  ')
        : `Final URL: ${r.finalUrl}`;
      return [{
        ruleId: 'redirect-chain',
        severity: n >= 2 ? 'warning' : 'info',
        message: n >= 2 ? `Long redirect chain (${n} hops)` : 'Page was redirected (1 hop)',
        detail,
        count: n,
      }];
    },
  },
  {
    id: 'x-robots-noindex',
    evaluate: (r): Issue[] => {
      const x = (r.http.xRobotsTag || '').toLowerCase();
      if (/\bnoindex\b/.test(x))
        return [{
          ruleId: 'x-robots-noindex',
          severity: 'error',
          message: 'noindex set via X-Robots-Tag header',
          detail: `X-Robots-Tag: ${r.http.xRobotsTag}`,
        }];
      return [];
    },
  },
];
