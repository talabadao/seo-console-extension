// ---------------------------------------------------------------------------
// Shared data model for SEO Console.
// Collectors (content script) produce a DomCollection.
// Background produces an HttpRecord.
// report.ts merges them into a PageReport and runs the rules engine.
// ---------------------------------------------------------------------------

export type Severity = 'error' | 'warning' | 'info' | 'pass';

export interface Issue {
  ruleId: string;
  severity: Severity;
  /** Short, human-readable headline shown in the issue list. */
  message: string;
  /** Optional longer explanation / how-to-fix. */
  detail?: string;
  /** CSS selector of the first offending element, so the UI can highlight it. */
  selector?: string;
  /** How many elements this issue aggregates (e.g. "7 images missing alt"). */
  count?: number;
}

export interface HeadingNode {
  level: number; // 1..6
  text: string;
  selector: string;
}

export interface ImageInfo {
  src: string;
  /** null = no alt attribute at all; '' = empty alt (decorative). */
  alt: string | null;
  hasAltAttr: boolean;
  widthAttr: number | null;
  heightAttr: number | null;
  naturalWidth: number;
  naturalHeight: number;
  loading: string | null;
  format: string;
  /** Bytes transferred over the network (0 if served from cache / unknown). */
  transferSize: number | null;
  selector: string;
}

export interface LinkInfo {
  href: string;
  text: string;
  rel: string | null;
  target: string | null;
  isInternal: boolean;
  isNofollow: boolean;
  isSponsored: boolean;
  isUgc: boolean;
  selector: string;
}

export interface LinkSummary {
  all: LinkInfo[];
  total: number;
  internal: number;
  external: number;
  nofollow: number;
  unique: number;
}

export interface SchemaItem {
  type: string;
  valid: boolean;
  error?: string;
  raw: unknown;
}

export interface SocialData {
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
}

// ── Core Web Vitals ──────────────────────────────────────────────────────
export type VitalRating = 'good' | 'needs-improvement' | 'poor' | 'none';
export type VitalName = 'lcp' | 'cls' | 'inp' | 'fcp' | 'ttfb';

export interface MetricValue {
  value: number | null;
  rating: VitalRating;
}
export type Vitals = Record<VitalName, MetricValue>;

/** Raw DOM-side payload returned by the content script. */
export interface DomCollection {
  url: string;
  // --- meta ---
  doctype: string | null;
  title: string | null;
  titleTagCount: number;
  description: string | null;
  descriptionCount: number;
  canonical: string | null;
  metaRobots: string | null;
  lang: string | null;
  charset: string | null;
  viewport: string | null;
  hreflang: { lang: string; href: string }[];
  // --- structure ---
  headings: HeadingNode[];
  images: ImageInfo[];
  links: LinkInfo[];
  schema: SchemaItem[];
  social: SocialData;
  // --- client-observed status (fallback when webRequest is unavailable) ---
  navStatus: number | null;
  navRedirectCount: number;
  fromCache: boolean;
  wordCount: number;
  vitals: Vitals;
  tech: import('./tech/types').TechSignals;
}

/** HTTP-side payload captured by the background service worker via webRequest. */
export interface HttpRecord {
  url: string;
  finalUrl: string;
  status: number | null;
  statusLine?: string;
  redirects: { url: string; status: number; location?: string }[];
  responseHeaders: Record<string, string>;
  ip?: string;
  fromCache?: boolean;
  completedAt: number;
}

export interface MetaView {
  doctype: string | null;
  title: string | null;
  titleLength: number;
  titlePixelWidth: number;
  titleTagCount: number;
  description: string | null;
  descriptionLength: number;
  descriptionPixelWidth: number;
  descriptionCount: number;
  canonical: string | null;
  robots: string | null;
  lang: string | null;
  charset: string | null;
  viewport: string | null;
  hreflang: { lang: string; href: string }[];
}

export interface HttpView {
  status: number | null;
  statusClass: '2xx' | '3xx' | '4xx' | '5xx' | 'unknown';
  statusLine?: string;
  finalUrl: string;
  redirects: { url: string; status: number; location?: string }[];
  /** Best known redirect count: detailed chain length, or the browser's navigation redirectCount. */
  redirectCount: number;
  headers: Record<string, string>;
  xRobotsTag: string | null;
  contentType: string | null;
  fromCache: boolean;
  /** true when HTTP data came from webRequest; false when only from Performance API. */
  fromWebRequest: boolean;
}

export interface PageReport {
  url: string;
  finalUrl: string;
  collectedAt: number;
  http: HttpView;
  meta: MetaView;
  headings: HeadingNode[];
  images: ImageInfo[];
  links: LinkSummary;
  schema: SchemaItem[];
  social: SocialData;
  wordCount: number;
  vitals: Vitals;
  technologies: import('./tech/types').DetectedTech[];
  issues: Issue[];
  counts: Record<Severity, number>;
  score: number;
}
