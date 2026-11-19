import type { DomCollection, HttpRecord } from './types';
import type { LinkResult, ProbeState, SourceSnapshot } from './audit/types';

export const MSG = {
  COLLECT_DOM: 'seo-console/collect-dom',
  GET_HTTP: 'seo-console/get-http',
  HIGHLIGHT: 'seo-console/highlight',
  CLEAR_HIGHLIGHT: 'seo-console/clear-highlight',
  COLLECT_SOURCE: 'seo-console/collect-source',
  FETCH_ROBOTS: 'seo-console/fetch-robots',
  CHECK_LINKS: 'seo-console/check-links',
  PROBE_URLS: 'seo-console/probe-urls',
  LINK_RESULT: 'seo-console/link-result',
  LINK_DONE: 'seo-console/link-done',
  URL_CHANGED: 'seo-console/url-changed',
  // v1.1 — page tools
  OUTLINE_HEADINGS: 'seo-console/outline-headings',
} as const;

export type CollectDomRequest = { type: typeof MSG.COLLECT_DOM };
export type CollectDomResponse = DomCollection | { error: string };

export type GetHttpRequest = { type: typeof MSG.GET_HTTP; tabId: number };
export type GetHttpResponse = HttpRecord | null;

export type HighlightRequest = { type: typeof MSG.HIGHLIGHT; selector: string };
export type ClearHighlightRequest = { type: typeof MSG.CLEAR_HIGHLIGHT };

export type CollectSourceRequest = { type: typeof MSG.COLLECT_SOURCE };
export type CollectSourceResponse = SourceSnapshot;

export type FetchRobotsRequest = { type: typeof MSG.FETCH_ROBOTS };
export type FetchRobotsResponse = { found: boolean; status: number | null; text: string };

export type CheckLinksRequest = { type: typeof MSG.CHECK_LINKS; tabId: number; urls: string[] };
export type CheckLinksAck = { started: true; total: number };

export type ProbeUrlsRequest = { type: typeof MSG.PROBE_URLS; urls: string[] };
export type ProbeUrlsResponse = Record<string, { state: ProbeState; status: number | null }>;

export type LinkResultMessage = { type: typeof MSG.LINK_RESULT; tabId: number } & LinkResult;
export type LinkDoneMessage = { type: typeof MSG.LINK_DONE; tabId: number };

export type OutlineHeadingsRequest = { type: typeof MSG.OUTLINE_HEADINGS; on: boolean };
