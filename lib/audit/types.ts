// Phase 2 audit data model: rendered-vs-source diff, robots.txt / indexability,
// sitemaps, and broken-link checking.

/** The comparable subset of a page, collected from the *raw* server HTML. */
export interface SourceSnapshot {
  ok: boolean;
  status: number | null;
  error?: string;
  title: string | null;
  description: string | null;
  canonical: string | null;
  metaRobots: string | null;
  lang: string | null;
  firstH1: string | null;
  h1Count: number;
  headingCount: number;
  linkCount: number;
  imageCount: number;
  wordCount: number;
}

export type DiffStatus = 'same' | 'changed' | 'rendered-only' | 'source-only';

export interface DiffRow {
  field: string;
  rendered: string;
  source: string;
  status: DiffStatus;
  /** rendered-only on an SEO-critical field → Googlebot may miss it. */
  risk: boolean;
}

export interface RobotsRule {
  allow: boolean;
  path: string;
}
export interface RobotsGroup {
  agents: string[];
  rules: RobotsRule[];
}
export interface RobotsParsed {
  groups: RobotsGroup[];
  sitemaps: string[];
}

export interface RobotsCheck {
  found: boolean;
  status: number | null;
  /** Whether the current URL is crawlable for Googlebot per robots.txt. */
  allowed: boolean;
  matchedRule: string | null;
  /** The user-agent group that matched ("googlebot" or "*"). */
  appliedGroup: string | null;
  sitemaps: string[];
}

export interface IndexSignal {
  label: string;
  source: string;
  blocked: boolean;
}

export interface Indexability {
  indexable: boolean;
  verdict: string;
  signals: IndexSignal[];
}

export type ProbeState = 'ok' | 'redirect' | 'broken' | 'unknown' | 'checking';

export interface SitemapInfo {
  url: string;
  state: ProbeState;
  status: number | null;
}

export interface AuditResult {
  source: SourceSnapshot;
  diffs: DiffRow[];
  robots: RobotsCheck;
  indexability: Indexability;
  sitemaps: SitemapInfo[];
}

// ── Broken-link checking ──────────────────────────────────────────────────
export type LinkState = ProbeState;

export interface LinkResult {
  url: string;
  state: LinkState;
  status: number | null;
}
