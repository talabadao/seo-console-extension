import type { RobotsCheck, RobotsGroup, RobotsParsed } from './types';

/** Parse a robots.txt document into groups + sitemap URLs. */
export function parseRobots(text: string): RobotsParsed {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  let current: RobotsGroup | null = null;
  let lastWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split('#')[0]!.trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if (field === 'allow' || field === 'disallow') {
      if (!current) {
        current = { agents: ['*'], rules: [] };
        groups.push(current);
      }
      current.rules.push({ allow: field === 'allow', path: value });
      lastWasAgent = false;
    } else if (field === 'sitemap') {
      if (value) sitemaps.push(value);
      lastWasAgent = false;
    } else {
      lastWasAgent = false;
    }
  }
  return { groups, sitemaps };
}

/** Pick the group that applies to a user-agent (exact token, else "*"). */
function pickGroup(parsed: RobotsParsed, ua: string): { group: RobotsGroup | null; name: string | null } {
  const lower = ua.toLowerCase();
  let star: RobotsGroup | null = null;
  let exact: RobotsGroup | null = null;
  for (const g of parsed.groups) {
    for (const a of g.agents) {
      if (a === '*') star = star ?? g;
      else if (lower.includes(a)) exact = exact ?? g;
    }
  }
  if (exact) return { group: exact, name: ua };
  if (star) return { group: star, name: '*' };
  return { group: null, name: null };
}

/** Translate a robots path pattern (* and $) into an anchored regex. */
function toRegExp(pattern: string): RegExp {
  let re = '';
  for (const ch of pattern) {
    if (ch === '*') re += '.*';
    else if (ch === '$') re += '$';
    else re += ch.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re);
}

/**
 * Approximate Googlebot robots.txt evaluation: the most specific matching rule
 * wins (longest pattern); Allow beats Disallow on a tie.
 */
export function evaluateRobots(parsed: RobotsParsed, pathWithQuery: string, ua = 'googlebot'): RobotsCheck {
  const { group, name } = pickGroup(parsed, ua);
  const base: RobotsCheck = {
    found: true,
    status: null,
    allowed: true,
    matchedRule: null,
    appliedGroup: name,
    sitemaps: parsed.sitemaps,
  };
  if (!group || group.rules.length === 0) return base;

  let best: { allow: boolean; len: number; path: string } | null = null;
  for (const rule of group.rules) {
    if (rule.path === '') continue; // empty Disallow = allow all; empty Allow = no-op
    if (!toRegExp(rule.path).test(pathWithQuery)) continue;
    const len = rule.path.length;
    if (!best || len > best.len || (len === best.len && rule.allow && !best.allow)) {
      best = { allow: rule.allow, len, path: rule.path };
    }
  }
  if (!best) return base;
  return {
    ...base,
    allowed: best.allow,
    matchedRule: `${best.allow ? 'Allow' : 'Disallow'}: ${best.path}`,
  };
}
