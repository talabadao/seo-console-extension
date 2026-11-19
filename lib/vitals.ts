import type { MetricValue, VitalName, VitalRating } from './types';

// Google's Core Web Vitals thresholds: [good ≤, needs-improvement ≤]; above = poor.
export const VITAL_THRESHOLDS: Record<VitalName, [number, number]> = {
  lcp: [2500, 4000], // ms
  inp: [200, 500], // ms
  cls: [0.1, 0.25], // unitless
  fcp: [1800, 3000], // ms
  ttfb: [800, 1800], // ms
};

export const VITAL_META: Record<VitalName, { label: string; unit: 'ms' | 's' | '' }> = {
  lcp: { label: 'LCP', unit: 'ms' },
  inp: { label: 'INP', unit: 'ms' },
  cls: { label: 'CLS', unit: '' },
  fcp: { label: 'FCP', unit: 'ms' },
  ttfb: { label: 'TTFB', unit: 'ms' },
};

export function rate(metric: VitalName, value: number | null): VitalRating {
  if (value == null) return 'none';
  const [good, ni] = VITAL_THRESHOLDS[metric];
  if (value <= good) return 'good';
  if (value <= ni) return 'needs-improvement';
  return 'poor';
}

export function metric(metric: VitalName, value: number | null): MetricValue {
  if (value == null) return { value: null, rating: 'none' };
  const rounded = metric === 'cls' ? Math.round(value * 1000) / 1000 : Math.round(value);
  return { value: rounded, rating: rate(metric, value) };
}

export function formatVital(name: VitalName, m: MetricValue): string {
  if (m.value == null) return '—';
  if (name === 'cls') return m.value.toFixed(3);
  return m.value >= 1000 ? `${(m.value / 1000).toFixed(2)} s` : `${m.value} ms`;
}
