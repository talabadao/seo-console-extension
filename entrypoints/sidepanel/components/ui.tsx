import React from 'react';
import type { Severity } from '@/lib/types';

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

/** Lets any nested component ask the content script to highlight an element. */
export const HighlightContext = React.createContext<(selector?: string) => void>(() => {});
export const useHighlight = () => React.useContext(HighlightContext);

/** Shared focus-visible ring (brand requires focus states on all controls). */
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-focus-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--brand-canvas)]';

export const SEVERITY_STYLE: Record<
  Severity,
  { text: string; soft: string; label: string }
> = {
  error: { text: 'text-error', soft: 'bg-error-soft', label: 'Error' },
  warning: { text: 'text-warning', soft: 'bg-warning-soft', label: 'Warning' },
  info: { text: 'text-info', soft: 'bg-info-soft', label: 'Notice' },
  pass: { text: 'text-success', soft: 'bg-success-soft', label: 'Pass' },
};

/** Severity is always an icon + a color, never color alone. */
export function SeverityIcon({ severity, className }: { severity: Severity; className?: string }) {
  const c = cn('shrink-0', SEVERITY_STYLE[severity].text, className);
  switch (severity) {
    case 'error':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'warning':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    case 'pass':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    default: // info / notice
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="11" x2="12" y2="16" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'ink' | 'accent' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-hover text-body',
    ink: 'bg-ink text-on-ink',
    accent: 'bg-info-soft text-accent',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    error: 'bg-error-soft text-error',
    info: 'bg-info-soft text-info',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 80 ? 'var(--sev-success)' : score >= 50 ? 'var(--sev-warning)' : 'var(--sev-error)';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" style={{ width: size, height: size }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--brand-hairline)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset .5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="tnum text-[22px] font-semibold tracking-tight" style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
}

export function IconButton({
  title,
  onClick,
  active,
  children,
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
        active ? 'bg-selected text-accent' : 'text-muted hover:bg-hover hover:text-fg',
        focusRing,
      )}
    >
      {children}
    </button>
  );
}

export function LocateButton({ selector }: { selector?: string }) {
  const highlight = useHighlight();
  if (!selector) return null;
  return (
    <button
      type="button"
      title="Scroll to and highlight on the page"
      aria-label="Highlight on page"
      onClick={() => highlight(selector)}
      className={cn('shrink-0 rounded-md p-1 text-muted-soft hover:bg-hover hover:text-accent', focusRing)}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="7" />
        <line x1="12" y1="1" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="23" />
        <line x1="1" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="23" y2="12" />
      </svg>
    </button>
  );
}

export function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-card px-3 py-2">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className={cn('tnum mt-0.5 text-sm font-semibold', tone || 'text-fg')}>{value}</div>
    </div>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">{children}</h3>
      {right}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-hairline px-3 py-6 text-center text-muted">
      {children}
    </div>
  );
}

export function truncate(s: string, n = 70): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

export function CopyButton({ value, title = 'Copy' }: { value: string; title?: string }) {
  const [done, setDone] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={copy}
      className={cn('shrink-0 rounded-md p-1 text-muted-soft hover:bg-hover hover:text-fg', focusRing, done && 'text-success')}
    >
      {done ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

/** Coloured status pill used in the redirect trace (200 green, 3xx amber, 4xx/5xx red). */
export function StatusPill({ status }: { status: number | null }) {
  const cls =
    status == null
      ? 'bg-hover text-muted'
      : status >= 500 || status >= 400
        ? 'bg-error text-on-ink'
        : status >= 300
          ? 'bg-warning text-on-ink'
          : 'bg-success text-on-ink';
  return (
    <span className={cn('tnum inline-flex h-6 min-w-[2.4rem] items-center justify-center rounded-md px-1.5 text-[11px] font-bold', cls)}>
      {status ?? 'ERR'}
    </span>
  );
}
