import type { PageReport } from '../types';
import type { DiffRow, DiffStatus, SourceSnapshot } from './types';

/**
 * Compare the rendered DOM (what the user sees) against the raw server HTML
 * (close to what Googlebot's initial fetch sees). SEO-critical values that
 * exist only after JS runs are flagged as a risk.
 */
export function diffRenderedVsSource(report: PageReport, src: SourceSnapshot): DiffRow[] {
  const firstH1 = report.headings.find((h) => h.level === 1)?.text ?? null;
  const h1Count = report.headings.filter((h) => h.level === 1).length;

  const rows: DiffRow[] = [
    textRow('Title', report.meta.title, src.title, true),
    textRow('Meta description', report.meta.description, src.description, true),
    textRow('Canonical', report.meta.canonical, src.canonical, true),
    textRow('Meta robots', report.meta.robots, src.metaRobots, true),
    textRow('H1', firstH1, src.firstH1, true),
    textRow('Lang', report.meta.lang, src.lang, false),
    numRow('H1 count', h1Count, src.h1Count),
    numRow('Headings', report.headings.length, src.headingCount),
    numRow('Links', report.links.total, src.linkCount),
    numRow('Images', report.images.length, src.imageCount),
    numRow('Word count', report.wordCount, src.wordCount),
  ];
  return rows;
}

function textRow(field: string, rendered: string | null, source: string | null, critical: boolean): DiffRow {
  const r = (rendered ?? '').trim();
  const s = (source ?? '').trim();
  let status: DiffStatus;
  if (r === s) status = 'same';
  else if (r && !s) status = 'rendered-only';
  else if (!r && s) status = 'source-only';
  else status = 'changed';
  return { field, rendered: disp(rendered), source: disp(source), status, risk: status === 'rendered-only' && critical };
}

function numRow(field: string, rendered: number, source: number): DiffRow {
  // Word/heading/link counts drift slightly; only flag a meaningful gap.
  const status: DiffStatus = rendered === source ? 'same' : 'changed';
  return { field, rendered: String(rendered), source: String(source), status, risk: false };
}

function disp(v: string | null): string {
  return v == null || v.trim() === '' ? '—' : v.trim();
}
