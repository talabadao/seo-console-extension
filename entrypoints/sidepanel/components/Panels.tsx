import React from 'react';
import type { ImageInfo, LinkInfo, PageReport } from '@/lib/types';
import type { LinkResult } from '@/lib/audit/types';
import { onLinkEvents, startLinkCheck } from '../analyze';
import { Badge, cn, CopyButton, Empty, focusRing, LocateButton, SectionTitle, Stat } from './ui';
import { ProbeBadge } from './Audit';

// Decreasing text size per heading level, for a readable visual hierarchy.
const HEADING_SIZE: Record<number, number> = { 1: 16, 2: 14.5, 3: 13.5, 4: 12.5, 5: 11.5, 6: 11 };

// ---------------------------------------------------------------- Headings ---
export function HeadingsPanel({ report }: { report: PageReport }) {
  const { headings } = report;
  if (!headings.length) return <Empty>No headings on this page.</Empty>;
  const byLevel = [1, 2, 3, 4, 5, 6].map((lvl) => headings.filter((h) => h.level === lvl).length);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {byLevel.map((n, i) => (
          <Badge key={i} tone={i === 0 && n !== 1 ? 'warning' : 'neutral'}>
            H{i + 1} · {n}
          </Badge>
        ))}
      </div>
      <ul className="space-y-0.5">
        {headings.map((h, i) => (
          <li key={i} className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-hover">
            <span style={{ width: (h.level - 1) * 14 }} className="shrink-0" />
            <span
              className={cn(
                'shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium',
                h.level === 1 ? 'bg-info-soft text-accent' : 'bg-hover text-muted',
              )}
            >
              H{h.level}
            </span>
            <span
              className={cn('min-w-0 flex-1 truncate', h.level <= 2 ? 'font-semibold text-fg' : 'text-body')}
              style={{ fontSize: HEADING_SIZE[h.level] }}
            >
              {h.text || <span className="text-warning">(empty)</span>}
            </span>
            <LocateButton selector={h.selector} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------------ Images ---
type ImgFilter = 'all' | 'noalt' | 'nodim';
export function ImagesPanel({ report }: { report: PageReport }) {
  const [filter, setFilter] = React.useState<ImgFilter>('all');
  const { images } = report;
  if (!images.length) return <Empty>No images on this page.</Empty>;

  const shown = images.filter((img) => {
    if (filter === 'noalt') return !img.hasAltAttr;
    if (filter === 'nodim') return img.widthAttr == null || img.heightAttr == null;
    return true;
  });
  const noAlt = images.filter((i) => !i.hasAltAttr).length;
  const noDim = images.filter((i) => i.widthAttr == null || i.heightAttr == null).length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Images" value={images.length} />
        <Stat label="No alt" value={noAlt} tone={noAlt ? 'text-warning' : undefined} />
        <Stat label="No dim." value={noDim} tone={noDim ? 'text-info' : undefined} />
      </div>
      <FilterRow
        options={[
          ['all', `All ${images.length}`],
          ['noalt', `Missing alt ${noAlt}`],
          ['nodim', `No dimensions ${noDim}`],
        ]}
        value={filter}
        onChange={(v) => setFilter(v as ImgFilter)}
      />
      <ul className="space-y-1">
        {shown.map((img, i) => (
          <ImageRow key={i} img={img} />
        ))}
      </ul>
    </div>
  );
}

function ImageRow({ img }: { img: ImageInfo }) {
  const [broken, setBroken] = React.useState(false);
  return (
    <li className="flex items-start gap-2.5 rounded-lg border border-hairline bg-card p-2">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-hairline-soft bg-[var(--brand-hairline-soft)]">
        {img.src && !broken ? (
          <img
            src={img.src}
            alt=""
            loading="lazy"
            onError={() => setBroken(true)}
            className="h-full w-full object-contain"
          />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-muted-soft">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1">
          <a
            href={img.src}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('min-w-0 flex-1 break-all font-mono text-[11px] text-accent hover:underline', focusRing)}
          >
            {img.src || '(no src)'}
          </a>
          {img.src && <CopyButton value={img.src} title="Copy image URL" />}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {img.hasAltAttr ? (
            img.alt ? (
              <Badge tone="success">alt ✓</Badge>
            ) : (
              <Badge tone="info">alt=""</Badge>
            )
          ) : (
            <Badge tone="warning">no alt</Badge>
          )}
          {(img.widthAttr == null || img.heightAttr == null) && <Badge tone="info">no w/h</Badge>}
          {img.format && <Badge tone="neutral">{img.format}</Badge>}
          {img.naturalWidth > 0 && (
            <Badge tone="neutral">
              {img.naturalWidth}×{img.naturalHeight}
            </Badge>
          )}
          {img.transferSize != null && img.transferSize > 0 && (
            <Badge tone={img.transferSize > 100 * 1024 ? 'warning' : 'neutral'}>{kb(img.transferSize)}</Badge>
          )}
          {img.loading === 'lazy' && <Badge tone="neutral">lazy</Badge>}
        </div>
      </div>
      <LocateButton selector={img.selector} />
    </li>
  );
}

// ------------------------------------------------------------------- Links ---
type LinkFilter = 'all' | 'internal' | 'external' | 'nofollow' | 'broken';
export function LinksPanel({ report, tabId }: { report: PageReport; tabId: number }) {
  const { links } = report;
  const [filter, setFilter] = React.useState<LinkFilter>('all');
  const [results, setResults] = React.useState<Record<string, LinkResult>>({});
  const [checking, setChecking] = React.useState(false);
  const [total, setTotal] = React.useState(0);

  // Reset when the page changes.
  React.useEffect(() => {
    setResults({});
    setChecking(false);
    setTotal(0);
    setFilter('all');
  }, [report.collectedAt]);

  // Receive streamed results from the background worker.
  React.useEffect(() => {
    const off = onLinkEvents(tabId, (ev) => {
      if (ev.kind === 'result') setResults((r) => ({ ...r, [ev.result.url]: ev.result }));
      else setChecking(false);
    });
    return off;
  }, [tabId]);

  if (!links.total) return <Empty>No links on this page.</Empty>;

  const done = Object.keys(results).length;
  const broken = Object.values(results).filter((r) => r.state === 'broken').length;
  const ok = Object.values(results).filter((r) => r.state === 'ok' || r.state === 'redirect').length;
  const unknown = Object.values(results).filter((r) => r.state === 'unknown').length;

  const start = async () => {
    setResults({});
    setChecking(true);
    const urls = links.all.map((l) => l.href).filter((h) => /^https?:/i.test(h));
    setTotal(await startLinkCheck(tabId, urls));
  };

  const shown = links.all.filter((l) => {
    if (filter === 'internal') return l.isInternal;
    if (filter === 'external') return !l.isInternal;
    if (filter === 'nofollow') return l.isNofollow;
    if (filter === 'broken') return results[l.href]?.state === 'broken';
    return true;
  });

  const filters: [string, string][] = [
    ['all', `All ${links.total}`],
    ['internal', `Internal ${links.internal}`],
    ['external', `External ${links.external}`],
    ['nofollow', `Nofollow ${links.nofollow}`],
  ];
  if (done > 0) filters.push(['broken', `Broken ${broken}`]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        <Stat label="Total" value={links.total} />
        <Stat label="Internal" value={links.internal} />
        <Stat label="External" value={links.external} />
        <Stat label="Nofollow" value={links.nofollow} />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={start}
          disabled={checking}
          className={cn(
            'rounded-md bg-ink px-2.5 py-1.5 text-[12px] font-semibold text-on-ink hover:bg-[var(--brand-ink-pressed)] disabled:opacity-60',
            focusRing,
          )}
        >
          {checking ? `Checking ${done}/${total}…` : done > 0 ? 'Re-check links' : `Check ${links.total} links`}
        </button>
        {done > 0 && !checking && (
          <span className="tnum text-[11.5px] text-muted">
            <span className="text-error">{broken} broken</span> · {ok} ok{unknown ? ` · ${unknown} unknown` : ''}
          </span>
        )}
      </div>

      <FilterRow options={filters} value={filter} onChange={(v) => setFilter(v as LinkFilter)} />

      <ul className="space-y-1">
        {shown.slice(0, 500).map((l, i) => (
          <LinkRow key={i} link={l} result={results[l.href]} />
        ))}
      </ul>
      {shown.length > 500 && (
        <div className="text-center text-[11px] text-muted">Showing first 500 of {shown.length}.</div>
      )}
    </div>
  );
}

function LinkRow({ link, result }: { link: LinkInfo; result?: LinkResult }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-hairline bg-card px-2 py-1.5">
      <Badge tone={link.isInternal ? 'accent' : 'neutral'}>{link.isInternal ? 'int' : 'ext'}</Badge>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] text-fg">
          {link.text || <span className="text-warning">(no anchor text)</span>}
        </div>
        <div className="truncate font-mono text-[10.5px] text-muted">{link.href}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {result && <ProbeBadge state={result.state} status={result.status} />}
        {link.isNofollow && <Badge tone="warning">nofollow</Badge>}
        {link.isSponsored && <Badge tone="neutral">sponsored</Badge>}
        {link.isUgc && <Badge tone="neutral">ugc</Badge>}
        {link.target === '_blank' && !/noopener/i.test(link.rel || '') && <Badge tone="error">_blank</Badge>}
      </div>
      <LocateButton selector={link.selector} />
    </li>
  );
}

// ------------------------------------------------------------------ Social ---
export function SocialPanel({ report }: { report: PageReport }) {
  const og = report.social.openGraph;
  const tw = report.social.twitter;
  const ogKeys = Object.keys(og);
  const twKeys = Object.keys(tw);
  if (!ogKeys.length && !twKeys.length) return <Empty>No Open Graph or Twitter Card tags.</Empty>;

  return (
    <div className="space-y-4">
      {og['og:image'] && (
        <div className="overflow-hidden rounded-lg border border-hairline bg-card">
          <img src={og['og:image']} alt="Open Graph preview" className="h-36 w-full bg-hairline-soft object-cover" />
          <div className="space-y-0.5 p-2.5">
            <div className="text-[10px] uppercase tracking-wide text-muted">{hostOf(report.finalUrl)}</div>
            <div className="truncate text-[13px] font-medium text-fg">{og['og:title'] || report.meta.title}</div>
            <div className="line-clamp-2 text-[11px] text-body">{og['og:description'] || report.meta.description}</div>
          </div>
        </div>
      )}
      {ogKeys.length > 0 && <KeyValues title="Open Graph" data={og} />}
      {twKeys.length > 0 && <KeyValues title="Twitter" data={tw} />}
    </div>
  );
}

// ------------------------------------------------------------------ Schema ---
export function SchemaPanel({ report }: { report: PageReport }) {
  if (!report.schema.length) return <Empty>No JSON-LD structured data found.</Empty>;
  return (
    <div className="space-y-2">
      {report.schema.map((item, i) => (
        <details key={i} className="rounded-lg border border-hairline bg-card">
          <summary className="flex cursor-pointer items-center gap-2 px-2.5 py-2">
            <Badge tone={item.valid ? 'accent' : 'error'}>{item.valid ? 'JSON-LD' : 'Invalid'}</Badge>
            <span className="text-[12.5px] font-medium text-fg">{item.type}</span>
          </summary>
          <pre className="max-h-64 overflow-auto border-t border-hairline p-2 font-mono text-[10.5px] leading-relaxed text-body">
            {item.valid ? JSON.stringify(item.raw, null, 2) : String(item.raw)}
          </pre>
        </details>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ shared ---
function KeyValues({ title, data }: { title: string; data: Record<string, string> }) {
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <div className="divide-y divide-hairline rounded-lg border border-hairline bg-card">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="flex gap-2 px-2.5 py-1.5">
            <span className="w-32 shrink-0 truncate font-mono text-[11px] text-muted">{k}</span>
            <span className="min-w-0 flex-1 break-words text-[11.5px] text-body">{v}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FilterRow({
  options,
  value,
  onChange,
}: {
  options: [string, string][];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(([val, label]) => (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
            focusRing,
            value === val ? 'bg-ink text-on-ink' : 'bg-hover text-body hover:text-fg',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function kb(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}
function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
