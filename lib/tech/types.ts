// Heuristic technology detection (a lightweight, Wappalyzer-style fingerprint).
// Signals are gathered from the DOM + response headers; rules in rules.ts match
// against them. This is intentionally a curated subset, not an exhaustive DB.

export type TechCategory =
  | 'CMS'
  | 'Ecommerce'
  | 'Web frameworks'
  | 'JavaScript frameworks'
  | 'JavaScript libraries'
  | 'UI & widgets'
  | 'Page builders'
  | 'SEO'
  | 'Tag managers'
  | 'Analytics'
  | 'Advertising'
  | 'Live chat'
  | 'Cookie compliance'
  | 'Security'
  | 'Fonts'
  | 'CDN'
  | 'Hosting'
  | 'Web servers'
  | 'Programming languages'
  | 'Miscellaneous';

export const CATEGORY_ORDER: TechCategory[] = [
  'CMS',
  'Ecommerce',
  'Page builders',
  'SEO',
  'Web frameworks',
  'JavaScript frameworks',
  'JavaScript libraries',
  'UI & widgets',
  'Tag managers',
  'Analytics',
  'Advertising',
  'Live chat',
  'Cookie compliance',
  'Security',
  'Fonts',
  'CDN',
  'Hosting',
  'Web servers',
  'Programming languages',
  'Miscellaneous',
];

/** Raw signals gathered from the page (content script). */
export interface TechSignals {
  scripts: string[]; // <script src>
  scriptIds: string[]; // <script id>
  links: string[]; // <link href>
  linkIds: string[]; // <link id>
  metas: Record<string, string>; // name/property -> content (generator, etc.)
  generators: string[];
  headHtml: string; // truncated <head> innerHTML (for comments/markers)
  htmlClass: string;
  bodyClass: string;
  cookies: string;
  markers: string[]; // precomputed DOM markers (next, nuxt, angular, vue, elementor…)
}

export interface DetectedTech {
  name: string;
  category: TechCategory;
  version: string | null;
}
