import type { Issue, PageReport } from '../types';

export interface Rule {
  id: string;
  /** Returns 0..n issues for this report. Return [] when the check passes. */
  evaluate(report: PageReport): Issue[];
}
