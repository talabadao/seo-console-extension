import type { Issue, PageReport, Severity } from '../types';
import type { Rule } from './types';
import { RULE_CONFIG } from './config';
import { metaRules } from './meta';
import { httpRules } from './http';
import { headingRules } from './headings';
import { imageRules } from './images';
import { linkRules } from './links';

export const ALL_RULES: Rule[] = [
  ...httpRules,
  ...metaRules,
  ...headingRules,
  ...imageRules,
  ...linkRules,
];

const SEVERITY_ORDER: Record<Severity, number> = { error: 0, warning: 1, info: 2, pass: 3 };

export function runRules(report: PageReport): Issue[] {
  const issues: Issue[] = [];
  for (const rule of ALL_RULES) {
    try {
      issues.push(...rule.evaluate(report));
    } catch (e) {
      // A broken rule should never crash the whole report.
      console.error(`[seo-console] rule "${rule.id}" failed`, e);
    }
  }
  return issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

export function tally(issues: Issue[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { error: 0, warning: 0, info: 0, pass: 0 };
  for (const i of issues) counts[i.severity]++;
  return counts;
}

export function computeScore(counts: Record<Severity, number>): number {
  const penalty = counts.error * RULE_CONFIG.score.errorWeight + counts.warning * RULE_CONFIG.score.warningWeight;
  return Math.max(0, Math.min(100, 100 - penalty));
}
