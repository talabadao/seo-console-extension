import type { ProbeState } from './types';

/**
 * Classify an HTTP response for link checking. 401/403/405/429 are treated as
 * "unknown" rather than "broken": WAFs and bot filters often return these to
 * extension requests even when the link works for real users.
 */
export function classify(status: number, redirected: boolean): ProbeState {
  if (status >= 200 && status < 300) return redirected ? 'redirect' : 'ok';
  if (status >= 300 && status < 400) return 'redirect';
  if (status === 401 || status === 403 || status === 405 || status === 429) return 'unknown';
  if (status >= 400) return 'broken';
  return 'unknown';
}
