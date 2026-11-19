import type { PageReport } from './types';

export function reportToJson(report: PageReport): string {
  return JSON.stringify(report, null, 2);
}

export function issuesToCsv(report: PageReport): string {
  const rows: string[][] = [['severity', 'ruleId', 'message', 'detail', 'count', 'selector']];
  for (const i of report.issues) {
    rows.push([
      i.severity,
      i.ruleId,
      i.message,
      i.detail ?? '',
      String(i.count ?? ''),
      i.selector ?? '',
    ]);
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}

export function linksToCsv(report: PageReport): string {
  const rows: string[][] = [['type', 'nofollow', 'anchor', 'href']];
  for (const l of report.links.all) {
    rows.push([
      l.isInternal ? 'internal' : 'external',
      l.isNofollow ? 'yes' : 'no',
      l.text,
      l.href,
    ]);
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}

function csvCell(value: string): string {
  const v = value ?? '';
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugForFile(report: PageReport): string {
  try {
    const u = new URL(report.finalUrl || report.url);
    const path = (u.hostname + u.pathname).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
    return path.slice(0, 60) || 'page';
  } catch {
    return 'page';
  }
}
