import type { DetectedTech, TechSignals } from './types';
import { RULES, type TechRule } from './rules';

export function detectTech(sig: TechSignals, headers: Record<string, string>): DetectedTech[] {
  const S = sig.scripts.join(' ');
  const SI = sig.scriptIds.join(' ');
  const L = sig.links.join(' ');
  const H = `${sig.headHtml} ${sig.htmlClass} ${sig.bodyClass}`;
  const C = sig.cookies;

  const headerGet = (name: string): string | undefined => {
    const lower = name.toLowerCase();
    for (const [k, v] of Object.entries(headers)) if (k.toLowerCase() === lower) return v;
    return undefined;
  };

  const out: DetectedTech[] = [];
  const seen = new Set<string>();

  for (const r of RULES) {
    let matched = false;
    if (r.scripts && r.scripts.test(S)) matched = true;
    else if (r.scriptIds && r.scriptIds.test(SI)) matched = true;
    else if (r.links && r.links.test(L)) matched = true;
    else if (r.html && r.html.test(H)) matched = true;
    else if (r.cookie && r.cookie.test(C)) matched = true;
    else if (r.marker && sig.markers.includes(r.marker)) matched = true;
    else if (r.meta && r.meta.toLowerCase() in sig.metas) matched = true;
    else if (r.generator && sig.generators.some((g) => r.generator!.test(g))) matched = true;
    else if (r.header) {
      const v = headerGet(r.header);
      if (v != null && (!r.headerVal || r.headerVal.test(v))) matched = true;
    }
    if (!matched || seen.has(r.name)) continue;
    seen.add(r.name);
    out.push({ name: r.name, category: r.category, version: extractVersion(r, sig, S, headerGet) });
  }
  return out;
}

function extractVersion(
  r: TechRule,
  sig: TechSignals,
  scriptsJoined: string,
  headerGet: (n: string) => string | undefined,
): string | null {
  if (!r.version) return null;
  let src = '';
  switch (r.version.source) {
    case 'scripts':
      src = `${scriptsJoined} ${sig.links.join(' ')}`;
      break;
    case 'generator':
      src = sig.generators.join(' ');
      break;
    case 'header':
      src = (r.header && headerGet(r.header)) || '';
      break;
    case 'headHtml':
      src = sig.headHtml;
      break;
  }
  const m = src.match(r.version.re);
  return m && m[1] ? m[1] : null;
}
