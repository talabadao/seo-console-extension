import React from 'react';
import type { PageReport, VitalName } from '@/lib/types';
import { getSettings } from '@/lib/settings';
import { VITAL_META, formatVital } from '@/lib/vitals';
import { Badge, cn, CopyButton, SectionTitle, Stat, StatusPill } from './ui';

export default function Summary({ report }: { report: PageReport }) {
  return (
    <div className="space-y-5">
      <Common report={report} />
      <ResponseBlock report={report} />
      <VitalsBlock report={report} />
      <SerpPreview report={report} />
    </div>
  );
}

// ── COMMON overview ─────────────────────────────────────────────────────────
function Common({ report }: { report: PageReport }) {
  const { meta, http } = report;
  const s = getSettings();
  const titleOver = meta.titlePixelWidth > s.titleMaxPx;
  const descOver = meta.descriptionPixelWidth > s.descMaxPx;

  return (
    <section className="rounded-xl border border-hairline bg-card px-3 py-1.5 shadow-[var(--brand-elevation-rest)]">
      <Field label="doctype" value={meta.doctype} mono />
      <Field label="html lang" value={meta.lang} />
      <Field label="content type" value={http.contentType} />
      <Field label="canonical" value={meta.canonical} mono copy />
      <Field label="head title" value={meta.title} count={meta.titleLength} over={titleOver} copy />
      <Field label="description" value={meta.description} count={meta.descriptionLength} over={descOver} copy />
      <Field label="robots" value={meta.robots} copy />
      <Field label="viewport" value={meta.viewport} />
      <Field label="charset" value={meta.charset} />
      {meta.hreflang.length > 0 && <Field label="hreflang" value={`${meta.hreflang.length} alternate${meta.hreflang.length > 1 ? 's' : ''}`} />}
    </section>
  );
}

function Field({
  label,
  value,
  mono,
  copy,
  count,
  over,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
  copy?: boolean;
  count?: number;
  over?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 border-b border-hairline-soft py-1.5 last:border-0">
      <span className="w-[86px] shrink-0 pt-px text-[11.5px] font-semibold text-accent">{label}</span>
      <span className={cn('min-w-0 flex-1 break-words text-[12px] text-fg', mono && 'font-mono text-[11px]')}>
        {value ? (
          <>
            {value}
            {count != null && (
              <span className={cn('ml-1 font-sans text-[11px]', over ? 'text-warning' : 'text-muted')}>({count} characters)</span>
            )}
          </>
        ) : (
          <span className="text-muted-soft italic">not set</span>
        )}
      </span>
      {copy && value ? <CopyButton value={value} title="Copy" /> : null}
    </div>
  );
}

// ── Response + redirect trace ───────────────────────────────────────────────
function ResponseBlock({ report }: { report: PageReport }) {
  const { http } = report;
  const tone =
    http.statusClass === '2xx'
      ? 'text-success'
      : http.statusClass === '3xx'
        ? 'text-warning'
        : http.statusClass === 'unknown'
          ? 'text-muted'
          : 'text-error';

  const hops: { url: string; status: number | null }[] = [
    ...http.redirects.map((h) => ({ url: h.url, status: h.status })),
    { url: http.finalUrl, status: http.status },
  ];

  return (
    <section>
      <SectionTitle
        right={
          !http.fromWebRequest && http.status != null ? <Badge tone="neutral">via Performance API</Badge> : undefined
        }
      >
        Response
      </SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Status" value={http.status ?? '—'} tone={tone} />
        <Stat label="Redirects" value={http.redirectCount} />
        <Stat label="Type" value={(http.contentType || '—').split(';')[0]} />
      </div>

      <div className="mt-2 rounded-lg border border-hairline bg-card p-2">
        {hops.map((h, i) => (
          <div key={i}>
            <div className="flex items-center gap-2 py-1">
              <StatusPill status={h.status} />
              <span className="min-w-0 flex-1 break-all font-mono text-[11px] text-body">{h.url}</span>
              <CopyButton value={h.url} title="Copy URL" />
            </div>
            {i < hops.length - 1 && (
              <div className="ml-3 flex h-4 items-center text-muted-soft">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
              </div>
            )}
          </div>
        ))}
        {http.redirects.length === 0 && http.redirectCount > 0 && (
          <div className="pt-1 text-[11px] text-warning">
            Redirected {http.redirectCount}× (detailed chain not captured on this load)
          </div>
        )}
      </div>

      {http.xRobotsTag && (
        <div className="mt-2 text-[12px] text-body">
          <span className="text-muted">X-Robots-Tag:</span> <span className="font-medium text-fg">{http.xRobotsTag}</span>
        </div>
      )}
    </section>
  );
}

// ── Core Web Vitals ─────────────────────────────────────────────────────────
const VITAL_ORDER: VitalName[] = ['lcp', 'inp', 'cls', 'fcp', 'ttfb'];
const RATING_STYLE: Record<string, { dot: string; text: string }> = {
  good: { dot: 'bg-success', text: 'text-success' },
  'needs-improvement': { dot: 'bg-warning', text: 'text-warning' },
  poor: { dot: 'bg-error', text: 'text-error' },
  none: { dot: 'bg-[var(--brand-hairline)]', text: 'text-muted-soft' },
};

function VitalsBlock({ report }: { report: PageReport }) {
  const v = report.vitals;
  const has = VITAL_ORDER.some((n) => v[n].value != null);
  return (
    <section>
      <SectionTitle right={<span className="text-[11px] text-muted">this load</span>}>Core Web Vitals</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        {VITAL_ORDER.map((name) => {
          const m = v[name];
          const st = RATING_STYLE[m.rating]!;
          return (
            <div key={name} className="rounded-lg border border-hairline bg-card px-2.5 py-2">
              <div className="flex items-center gap-1.5">
                <span className={cn('inline-block h-2 w-2 rounded-full', st.dot)} />
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{VITAL_META[name].label}</span>
              </div>
              <div className={cn('tnum mt-0.5 text-[13px] font-semibold', st.text)}>{formatVital(name, m)}</div>
            </div>
          );
        })}
      </div>
      {!has && <p className="mt-1.5 text-[11px] text-muted">No timing data (reload the page to measure). INP needs an interaction.</p>}
    </section>
  );
}

// ── Search preview (moved to the bottom) ────────────────────────────────────
function SerpPreview({ report }: { report: PageReport }) {
  const { meta } = report;
  const s = getSettings();
  return (
    <section>
      <SectionTitle>Search preview</SectionTitle>
      <div className="space-y-3 rounded-lg border border-hairline bg-card p-3">
        <div>
          <div className="truncate text-[15px] text-[color:var(--serp-title)]">{meta.title || '(no title)'}</div>
          <div className="truncate text-[12px] text-[color:var(--serp-url)]">{report.finalUrl}</div>
          <PixelBar value={meta.titlePixelWidth} max={s.titleMaxPx} chars={meta.titleLength} label="Title" />
        </div>
        <div>
          <div className="text-[12px] leading-snug text-body">
            {meta.description || <span className="text-muted-soft">No meta description.</span>}
          </div>
          <PixelBar value={meta.descriptionPixelWidth} max={s.descMaxPx} chars={meta.descriptionLength} label="Description" />
        </div>
      </div>
    </section>
  );
}

function PixelBar({ value, max, chars, label }: { value: number; max: number; chars: number; label: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const over = value > max;
  return (
    <div className="mt-1.5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-hairline-soft">
        <div className={cn('h-full rounded-full transition-all', over ? 'bg-error' : 'bg-success')} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>{label}</span>
        <span className={cn('tnum', over && 'text-error')}>
          {value}px / {max}px · {chars} chars
        </span>
      </div>
    </div>
  );
}
