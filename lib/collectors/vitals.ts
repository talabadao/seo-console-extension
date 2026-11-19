import type { Vitals } from '../types';
import { metric } from '../vitals';

/**
 * Starts PerformanceObservers (buffered, so entries from before this runs are
 * included) and returns a snapshot getter. LCP/CLS/FCP/TTFB are available on
 * load; INP needs at least one interaction and is null until then.
 */
export function createVitalsCollector(): () => Vitals {
  let lcp: number | null = null;
  let cls = 0;
  let inp: number | null = null;
  let fcp: number | null = null;

  const observe = (type: string, cb: (list: PerformanceObserverEntryList) => void, extra: Record<string, unknown> = {}) => {
    try {
      new PerformanceObserver(cb).observe({ type, buffered: true, ...extra });
    } catch {
      /* entry type unsupported in this browser */
    }
  };

  observe('largest-contentful-paint', (list) => {
    const entries = list.getEntries();
    const last = entries[entries.length - 1];
    if (last) lcp = last.startTime;
  });

  observe('layout-shift', (list) => {
    for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
      if (!e.hadRecentInput) cls += e.value;
    }
  });

  observe('paint', (list) => {
    for (const e of list.getEntries()) {
      if (e.name === 'first-contentful-paint') fcp = e.startTime;
    }
  });

  observe(
    'event',
    (list) => {
      for (const e of list.getEntries()) inp = Math.max(inp ?? 0, e.duration);
    },
    { durationThreshold: 40 },
  );

  return (): Vitals => {
    let ttfb: number | null = null;
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (nav && nav.responseStart > 0) ttfb = nav.responseStart;
    } catch {
      /* ignore */
    }
    return {
      lcp: metric('lcp', lcp),
      cls: metric('cls', cls),
      inp: metric('inp', inp),
      fcp: metric('fcp', fcp),
      ttfb: metric('ttfb', ttfb),
    };
  };
}

export function emptyVitals(): Vitals {
  return {
    lcp: { value: null, rating: 'none' },
    cls: { value: null, rating: 'none' },
    inp: { value: null, rating: 'none' },
    fcp: { value: null, rating: 'none' },
    ttfb: { value: null, rating: 'none' },
  };
}
