import React from 'react';
import type { PageReport } from '@/lib/types';
import { analyzeActiveTab, clearHighlightInTab, highlightInTab, runAudit, type AnalyzeResult } from './analyze';
import { HighlightContext, IconButton, cn, focusRing } from './components/ui';
import Summary from './components/Summary';
import Audit from './components/Audit';
import SettingsPanel from './components/Settings';
import { ToolsPanel } from './components/Tools';
import { TechPanel } from './components/Tech';
import { HeadingsPanel, ImagesPanel, LinksPanel, SchemaPanel, SocialPanel } from './components/Panels';
import { download, issuesToCsv, linksToCsv, reportToJson, slugForFile } from '@/lib/export';
import { MSG } from '@/lib/messaging';
import { loadSettings, saveSettings, type Settings } from '@/lib/settings';
import type { AuditResult } from '@/lib/audit/types';

type TabId = 'summary' | 'audit' | 'tools' | 'tech' | 'headings' | 'images' | 'links' | 'social' | 'schema';
type AuditState = { for: number; data: AuditResult | null; loading: boolean };
type Theme = 'system' | 'light' | 'dark';

function useTheme() {
  const [theme, setTheme] = React.useState<Theme>(() => {
    try {
      return (localStorage.getItem('seo-console-theme') as Theme) || 'system';
    } catch {
      return 'system';
    }
  });
  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('seo-console-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  return [theme, setTheme] as const;
}

export default function App() {
  const [state, setState] = React.useState<AnalyzeResult>({ report: null, tab: null, error: null });
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<TabId>('summary');
  const [theme, setTheme] = useTheme();
  const [audit, setAudit] = React.useState<AuditState>({ for: -1, data: null, loading: false });
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const tabIdRef = React.useRef<number | null>(null);
  const spaTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = React.useCallback(async () => {
    setLoading(true);
    const res = await analyzeActiveTab();
    tabIdRef.current = res.tab?.id ?? null;
    setState(res);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    let active = true;
    loadSettings().then(() => {
      if (active) run();
    });

    const onActivated = () => run();
    const onUpdated = (_tabId: number, info: chrome.tabs.TabChangeInfo, t: chrome.tabs.Tab) => {
      if (info.status === 'complete' && t.active) run();
    };
    // SPA navigations (history.pushState) from the content script → re-analyze.
    const onMessage = (msg: { type?: string }, sender: chrome.runtime.MessageSender) => {
      if (msg?.type === MSG.URL_CHANGED && sender.tab?.id === tabIdRef.current) {
        if (spaTimer.current) clearTimeout(spaTimer.current);
        spaTimer.current = setTimeout(run, 500);
      }
    };
    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.runtime.onMessage.addListener(onMessage);
    return () => {
      active = false;
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.runtime.onMessage.removeListener(onMessage);
    };
  }, [run]);

  const highlight = React.useCallback((selector?: string) => {
    if (tabIdRef.current == null) return;
    if (selector) highlightInTab(tabIdRef.current, selector);
    else clearHighlightInTab(tabIdRef.current);
  }, []);

  const onSaveSettings = React.useCallback(
    async (next: Partial<Settings>) => {
      await saveSettings(next);
      run();
    },
    [run],
  );

  const report = state.report;

  // Lazily run the audit (extra fetches) the first time the Audit tab is opened
  // for the current report.
  React.useEffect(() => {
    if (tab !== 'audit' || !report || tabIdRef.current == null) return;
    if (audit.for === report.collectedAt) return;
    const tid = tabIdRef.current;
    const forId = report.collectedAt;
    setAudit({ for: forId, data: null, loading: true });
    runAudit(tid, report).then((data) => setAudit({ for: forId, data, loading: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, report]);

  return (
    <HighlightContext.Provider value={highlight}>
      <div className="flex h-full flex-col bg-canvas text-fg">
        <Header
          report={report}
          url={state.tab?.url}
          loading={loading}
          onRefresh={run}
          theme={theme}
          onCycleTheme={() => setTheme(theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system')}
          settingsOpen={settingsOpen}
          onToggleSettings={() => setSettingsOpen((v) => !v)}
        />
        {report && !settingsOpen && <TabBar active={tab} onChange={setTab} report={report} />}

        <main className="flex-1 overflow-y-auto px-3 py-3">
          {settingsOpen ? (
            <SettingsPanel onClose={() => setSettingsOpen(false)} onSave={onSaveSettings} />
          ) : loading && !report ? (
            <Loading />
          ) : state.error ? (
            <ErrorView message={state.error} onRetry={run} />
          ) : report ? (
            <TabContent tab={tab} report={report} tabId={state.tab?.id ?? -1} audit={audit} />
          ) : (
            <Loading />
          )}
        </main>
      </div>
    </HighlightContext.Provider>
  );
}

function Header({
  report,
  url,
  loading,
  onRefresh,
  theme,
  onCycleTheme,
  settingsOpen,
  onToggleSettings,
}: {
  report: PageReport | null;
  url?: string;
  loading: boolean;
  onRefresh: () => void;
  theme: Theme;
  onCycleTheme: () => void;
  settingsOpen: boolean;
  onToggleSettings: () => void;
}) {
  return (
    <header className="border-b border-hairline bg-card">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-ink">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="text-[13px] font-semibold tracking-tight text-fg">SEO Console</span>
        </div>
        <div className="flex-1" />
        <IconButton title="Settings" onClick={onToggleSettings} active={settingsOpen}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
        </IconButton>
        <ThemeToggle theme={theme} onClick={onCycleTheme} />
        {report && <ExportMenu report={report} />}
        <IconButton title="Re-analyze" onClick={onRefresh}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={loading ? 'animate-spin' : ''}
          >
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </IconButton>
      </div>
      {url && (
        <div className="truncate border-t border-hairline-soft px-3 py-1 font-mono text-[10.5px] text-muted">{url}</div>
      )}
    </header>
  );
}

function ThemeToggle({ theme, onClick }: { theme: Theme; onClick: () => void }) {
  const label = theme === 'system' ? 'Theme: system' : theme === 'light' ? 'Theme: light' : 'Theme: dark';
  return (
    <IconButton title={label} onClick={onClick}>
      {theme === 'system' ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ) : theme === 'light' ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      )}
    </IconButton>
  );
}

function ExportMenu({ report }: { report: PageReport }) {
  const [open, setOpen] = React.useState(false);
  const slug = slugForFile(report);
  const item = (label: string, fn: () => void) => (
    <button
      type="button"
      onClick={() => {
        fn();
        setOpen(false);
      }}
      className="block w-full px-3 py-1.5 text-left text-[12px] text-body hover:bg-hover hover:text-fg"
    >
      {label}
    </button>
  );
  return (
    <div className="relative">
      <IconButton title="Export" onClick={() => setOpen((v) => !v)} active={open}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </IconButton>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-hairline bg-elevated py-1 shadow-[var(--brand-elevation-pop)]">
            {item('Report (JSON)', () => download(`seo-${slug}.json`, reportToJson(report), 'application/json'))}
            {item('Issues (CSV)', () => download(`seo-issues-${slug}.csv`, issuesToCsv(report), 'text/csv'))}
            {item('Links (CSV)', () => download(`seo-links-${slug}.csv`, linksToCsv(report), 'text/csv'))}
          </div>
        </>
      )}
    </div>
  );
}

const TABS: { id: TabId; label: string; count?: (r: PageReport) => number }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'audit', label: 'Audit' },
  { id: 'tools', label: 'Tools' },
  { id: 'tech', label: 'Tech', count: (r) => r.technologies.length },
  { id: 'headings', label: 'Headings', count: (r) => r.headings.length },
  { id: 'images', label: 'Images', count: (r) => r.images.length },
  { id: 'links', label: 'Links', count: (r) => r.links.total },
  { id: 'social', label: 'Social' },
  { id: 'schema', label: 'Schema', count: (r) => r.schema.length },
];

function TabBar({ active, onChange, report }: { active: TabId; onChange: (t: TabId) => void; report: PageReport }) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-hairline bg-card px-2">
      {TABS.map((t) => {
        const n = t.count?.(report);
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              'relative shrink-0 border-b-2 px-2.5 py-2 text-[12px] font-medium transition-colors',
              focusRing,
              active === t.id ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-body',
            )}
          >
            {t.label}
            {n != null && n > 0 && <span className="tnum ml-1 text-[10px] text-muted-soft">{n}</span>}
          </button>
        );
      })}
    </nav>
  );
}

function TabContent({
  tab,
  report,
  tabId,
  audit,
}: {
  tab: TabId;
  report: PageReport;
  tabId: number;
  audit: AuditState;
}) {
  switch (tab) {
    case 'summary':
      return <Summary report={report} />;
    case 'audit':
      return <Audit audit={audit.data} loading={audit.loading} />;
    case 'tools':
      return <ToolsPanel report={report} tabId={tabId} />;
    case 'tech':
      return <TechPanel report={report} />;
    case 'headings':
      return <HeadingsPanel report={report} />;
    case 'images':
      return <ImagesPanel report={report} />;
    case 'links':
      return <LinksPanel report={report} tabId={tabId} />;
    case 'social':
      return <SocialPanel report={report} />;
    case 'schema':
      return <SchemaPanel report={report} />;
  }
}

function Loading() {
  return (
    <div className="flex h-40 items-center justify-center gap-2 text-muted">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      Analyzing page…
    </div>
  );
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mt-6 rounded-xl border border-hairline bg-card p-5 text-center shadow-[var(--brand-elevation-rest)]">
      <div className="mb-1 font-medium text-fg">Can’t analyze this page</div>
      <p className="mx-auto max-w-xs text-[12px] leading-relaxed text-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          'mt-3 rounded-md bg-ink px-3 py-1.5 text-[12px] font-semibold text-on-ink hover:bg-[var(--brand-ink-pressed)]',
          focusRing,
        )}
      >
        Retry
      </button>
    </div>
  );
}
