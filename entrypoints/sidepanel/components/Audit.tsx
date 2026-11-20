import React from 'react';
import type { AuditResult, DiffRow, ProbeState } from '@/lib/audit/types';
import { Badge, cn, CopyButton, Empty, SectionTitle, SeverityIcon } from './ui';

export default function Audit({ audit, loading }: { audit: AuditResult | null; loading: boolean }) {
  if (loading && !audit) {
    return (
      <div className="flex h-32 items-center justify-center gap-2 text-muted">
        <Spinner />
        Fetching source &amp; robots…
      </div>
    );
  }
  if (!audit) return <Empty>Audit unavailable for this page.</Empty>;

  return (
    <div className="space-y-5">
      <Indexability audit={audit} />
      <RobotsCard audit={audit} />
      <Sitemaps audit={audit} />
      <RenderDiff audit={audit} />
    </div>
  );
}

function Indexability({ audit }: { audit: AuditResult }) {
  const { indexability } = audit;
  const ok = indexability.indexable;
  return (
    <section className="rounded-xl border border-hairline bg-card p-3 shadow-[var(--brand-elevation-rest)]">
      <div className="flex items-center gap-2">
        <SeverityIcon severity={ok ? 'pass' : 'error'} />
        <span className={cn('text-[13px] font-semibold', ok ? 'text-success' : 'text-error')}>{indexability.verdict}</span>
      </div>
      <div className="mt-3 space-y-1.5">
        {indexability.signals.map((s, i) => (
          <div key={i} className="flex items-start gap-2 text-[12px]">
            <SeverityIcon severity={s.blocked ? 'error' : 'pass'} className="mt-0.5 opacity-90" />
            <span className="w-24 shrink-0 text-muted">{s.source}</span>
            <span className={cn('min-w-0 flex-1 break-words', s.blocked ? 'text-error' : 'text-body')}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RobotsCard({ audit }: { audit: AuditResult }) {
  const { robots } = audit;
  return (
    <section>
      <SectionTitle
        right={
          robots.found ? (
            <Badge tone="success">found{robots.status ? ` · ${robots.status}` : ''}</Badge>
          ) : (
            <Badge tone="neutral">not found</Badge>
          )
        }
      >
        robots.txt
      </SectionTitle>
      <div className="space-y-1.5 rounded-lg border border-hairline bg-card p-2.5 text-[12px]">
        <Row label="Crawlable">
          {robots.found ? (
            robots.allowed ? (
              <span className="text-success">Allowed for Googlebot</span>
            ) : (
              <span className="text-error">Blocked for Googlebot</span>
            )
          ) : (
            <span className="text-muted">No robots.txt — crawling allowed</span>
          )}
        </Row>
        {robots.matchedRule && (
          <Row label="Rule">
            <span className="flex items-start gap-1">
              <span className="min-w-0 flex-1 break-all font-mono text-[11px] text-body">{robots.matchedRule}</span>
              <CopyButton value={robots.matchedRule} />
            </span>
          </Row>
        )}
        {robots.appliedGroup && (
          <Row label="Group">
            <span className="font-mono text-[11px] text-body">User-agent: {robots.appliedGroup}</span>
          </Row>
        )}
      </div>
    </section>
  );
}

function Sitemaps({ audit }: { audit: AuditResult }) {
  if (!audit.sitemaps.length) return null;
  return (
    <section>
      <SectionTitle>Sitemaps</SectionTitle>
      <ul className="space-y-1">
        {audit.sitemaps.map((s, i) => (
          <li key={i} className="flex items-start gap-2 rounded-lg border border-hairline bg-card px-2 py-1.5 text-[12px]">
            <ProbeBadge state={s.state} status={s.status} />
            <span className="min-w-0 flex-1 break-all font-mono text-[11px] text-body">{s.url}</span>
            <CopyButton value={s.url} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RenderDiff({ audit }: { audit: AuditResult }) {
  const { diffs, source } = audit;
  const risky = diffs.filter((d) => d.risk).length;
  const changed = diffs.filter((d) => d.status !== 'same').length;

  return (
    <section>
      <SectionTitle right={<span className="text-[11px] text-muted">{changed} differ</span>}>
        Rendered vs source
      </SectionTitle>
      <p className="mb-2 text-[11px] leading-snug text-muted">
        Compares the live DOM with the raw server HTML. Values that appear only after JavaScript runs may be missed by
        search crawlers.
      </p>
      {!source.ok && (
        <div className="mb-2 rounded-lg border border-hairline bg-warning-soft px-2.5 py-1.5 text-[11.5px] text-warning">
          Couldn’t fetch raw HTML{source.error ? ` (${source.error})` : ''}; comparison may be incomplete.
        </div>
      )}
      {risky > 0 && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-hairline bg-error-soft px-2.5 py-1.5 text-[11.5px] text-error">
          <SeverityIcon severity="error" />
          {risky} SEO element{risky > 1 ? 's are' : ' is'} injected by JavaScript (not in the source HTML).
        </div>
      )}
      <ul className="divide-y divide-hairline overflow-hidden rounded-lg border border-hairline bg-card">
        {diffs.map((d, i) => (
          <DiffRowView key={i} row={d} />
        ))}
      </ul>
    </section>
  );
}

function DiffRowView({ row }: { row: DiffRow }) {
  const same = row.status === 'same';
  return (
    <li className="px-2.5 py-2">
      <div className="flex items-start gap-2">
        <span className="w-20 shrink-0 pt-0.5 text-[12px] text-muted">{row.field}</span>
        {same ? (
          <span className="flex min-w-0 flex-1 items-start gap-1.5">
            <SeverityIcon severity="pass" className="mt-0.5 opacity-70" />
            <span className="min-w-0 flex-1 break-words text-[12px] text-body">{row.rendered}</span>
            {row.rendered !== '—' && <CopyButton value={row.rendered} />}
          </span>
        ) : (
          <div className="min-w-0 flex-1">
            <div>{row.risk ? <Badge tone="error">JS-only</Badge> : <Badge tone="warning">{statusLabel(row.status)}</Badge>}</div>
            <div className="mt-1 space-y-1 text-[11.5px]">
              <div className="flex items-start gap-1.5">
                <span className="w-16 shrink-0 text-muted-soft">rendered</span>
                <span className="min-w-0 flex-1 break-words text-fg">{row.rendered}</span>
                {row.rendered !== '—' && <CopyButton value={row.rendered} />}
              </div>
              <div className="flex items-start gap-1.5">
                <span className="w-16 shrink-0 text-muted-soft">source</span>
                <span className="min-w-0 flex-1 break-words text-body">{row.source}</span>
                {row.source !== '—' && <CopyButton value={row.source} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

function statusLabel(s: DiffRow['status']): string {
  return s === 'changed' ? 'changed' : s === 'rendered-only' ? 'rendered only' : s === 'source-only' ? 'source only' : 'same';
}

export function ProbeBadge({ state, status }: { state: ProbeState; status: number | null }) {
  const map: Record<ProbeState, { tone: 'success' | 'warning' | 'error' | 'neutral'; label: string }> = {
    ok: { tone: 'success', label: status ? String(status) : 'ok' },
    redirect: { tone: 'warning', label: status ? String(status) : 'redirect' },
    broken: { tone: 'error', label: status ? String(status) : 'broken' },
    unknown: { tone: 'neutral', label: status ? String(status) : 'unknown' },
    checking: { tone: 'neutral', label: '…' },
  };
  const m = map[state];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="w-20 shrink-0 text-muted">{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
