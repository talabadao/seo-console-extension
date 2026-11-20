import React from 'react';
import type { PageReport } from '@/lib/types';
import {
  isBlocked,
  setBlocked,
  setOutlineHeadings,
  setOutlineLinks,
  setRuler,
  type BlockSetting,
} from '../analyze';
import { cn, focusRing, SectionTitle } from './ui';

type PageTool = 'headings' | 'links' | 'ruler';
const PAGE_SENDERS: Record<PageTool, (tabId: number, on: boolean) => Promise<void>> = {
  headings: setOutlineHeadings,
  links: setOutlineLinks,
  ruler: setRuler,
};

export function ToolsPanel({ report, tabId }: { report: PageReport; tabId: number }) {
  const url = report.url;
  const [blocked, setBlockedState] = React.useState<Record<BlockSetting, boolean>>({
    javascript: false,
    cookies: false,
    popups: false,
  });
  const [page, setPage] = React.useState<Record<PageTool, boolean>>({ headings: false, links: false, ruler: false });
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    Promise.all([isBlocked('javascript', url), isBlocked('cookies', url), isBlocked('popups', url)]).then(
      ([javascript, cookies, popups]) => {
        if (active) setBlockedState({ javascript, cookies, popups });
      },
    );
    return () => {
      active = false;
    };
  }, [url]);

  // Page overlays reset when the page reloads.
  React.useEffect(() => {
    setPage({ headings: false, links: false, ruler: false });
  }, [report.collectedAt]);

  const toggleContent = async (s: BlockSetting) => {
    if (busy) return;
    setBusy(true);
    const applied = await setBlocked(s, url, !blocked[s]);
    setBlockedState((b) => ({ ...b, [s]: applied }));
    try {
      await chrome.tabs.reload(tabId);
    } catch {
      /* ignore */
    }
    setBusy(false);
  };

  const togglePage = async (key: PageTool) => {
    const next = !page[key];
    setPage((p) => ({ ...p, [key]: next }));
    await PAGE_SENDERS[key](tabId, next);
  };

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <SectionTitle>Content · reloads the page</SectionTitle>
        <ToolRow
          title="Disable JavaScript"
          desc="Block JavaScript for this site — see the page the way crawlers do."
          on={blocked.javascript}
          onToggle={() => toggleContent('javascript')}
        />
        <ToolRow
          title="Disable cookies"
          desc="Stop this site from reading or setting cookies."
          on={blocked.cookies}
          onToggle={() => toggleContent('cookies')}
        />
        <ToolRow
          title="Disable popups"
          desc="Block pop-up windows opened by this site."
          on={blocked.popups}
          onToggle={() => toggleContent('popups')}
        />
      </section>

      <section className="space-y-2">
        <SectionTitle>Page overlays</SectionTitle>
        <ToolRow
          title="Outline headings"
          desc="Outline every H1–H6 on the page with a colour-coded, labelled border."
          on={page.headings}
          onToggle={() => togglePage('headings')}
        />
        <ToolRow
          title="Outline links"
          desc="Outline links — solid border for follow, dashed for nofollow."
          on={page.links}
          onToggle={() => togglePage('links')}
        />
        <ToolRow
          title="Display ruler"
          desc="Crosshair guides with an x/y readout; drag to measure a box in pixels."
          on={page.ruler}
          onToggle={() => togglePage('ruler')}
        />
      </section>

      <p className="px-1 text-[11px] leading-snug text-muted-soft">
        Content toggles are per-site and persist until turned off. Page overlays reset when the page reloads.
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
