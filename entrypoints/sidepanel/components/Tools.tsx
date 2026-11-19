import React from 'react';
import type { PageReport } from '@/lib/types';
import { isJsBlocked, setJsBlocked, setOutlineHeadings } from '../analyze';
import { cn, focusRing, SectionTitle } from './ui';

export function ToolsPanel({ report, tabId }: { report: PageReport; tabId: number }) {
  const url = report.url;
  const [jsBlocked, setJsBlockedState] = React.useState(false);
  const [outline, setOutline] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    isJsBlocked(url).then((b) => {
      if (active) setJsBlockedState(b);
    });
    return () => {
      active = false;
    };
  }, [url]);

  // Outline is per-page; reset when the page changes.
  React.useEffect(() => {
    setOutline(false);
  }, [report.collectedAt]);

  const toggleJs = async () => {
    if (busy) return;
    setBusy(true);
    const next = !jsBlocked;
    const applied = await setJsBlocked(url, next);
    setJsBlockedState(applied);
    try {
      await chrome.tabs.reload(tabId);
    } catch {
      /* ignore */
    }
    setBusy(false);
  };

  const toggleOutline = async () => {
    const next = !outline;
    setOutline(next);
    await setOutlineHeadings(tabId, next);
  };

  return (
    <div className="space-y-3">
      <SectionTitle>Page tools</SectionTitle>

      <ToolRow
        title="Disable JavaScript"
        desc="Block JavaScript for this site and reload — see the page the way crawlers do. Toggle off to allow it again."
        on={jsBlocked}
        onToggle={toggleJs}
      />
      <ToolRow
        title="Outline headings"
        desc="Outline every H1–H6 on the page with a colour-coded, labelled border."
        on={outline}
        onToggle={toggleOutline}
      />

      <p className="px-1 pt-1 text-[11px] leading-snug text-muted-soft">
        Disable JavaScript is a per-site setting that persists until you turn it off. Outline headings resets when the
        page reloads.
      </p>
    </div>
  );
}

function ToolRow({
  title,
  desc,
  on,
  onToggle,
}: {
  title: string;
  desc: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border border-hairline bg-card p-3 text-left transition-colors hover:bg-hover',
        focusRing,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-fg">{title}</div>
        <div className="mt-0.5 text-[11.5px] leading-snug text-muted">{desc}</div>
      </div>
      <Switch on={on} />
    </button>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        'relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        on ? 'bg-ink' : 'bg-[var(--brand-hairline)]',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-card shadow transition-transform',
          on ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </span>
  );
}
