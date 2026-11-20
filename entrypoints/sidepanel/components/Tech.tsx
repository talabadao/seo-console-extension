import React from 'react';
import type { PageReport } from '@/lib/types';
import type { DetectedTech, TechCategory } from '@/lib/tech/types';
import { CATEGORY_ORDER } from '@/lib/tech/types';
import { TECH_ICONS } from '@/lib/tech/icons';
import { Badge, Empty, SectionTitle } from './ui';

export function TechPanel({ report }: { report: PageReport }) {
  const techs = report.technologies;
  if (!techs.length) {
    return <Empty>No technologies detected. The page may be server-rendered with few client-side signals.</Empty>;
  }

  const byCat = new Map<TechCategory, DetectedTech[]>();
  for (const t of techs) {
    const list = byCat.get(t.category) ?? [];
    list.push(t);
    byCat.set(t.category, list);
  }
  const cats = CATEGORY_ORDER.filter((c) => byCat.has(c));

  return (
    <div className="space-y-4">
      <p className="text-[12px] leading-snug text-muted">
        {techs.length} technolog{techs.length === 1 ? 'y' : 'ies'} detected — heuristic, from script/link URLs, response
        headers and markup.
      </p>
      {cats.map((cat) => (
        <section key={cat}>
          <SectionTitle>{cat}</SectionTitle>
          <ul className="space-y-1">
            {byCat.get(cat)!.map((t, i) => (
              <li key={i} className="flex items-center gap-2.5 rounded-lg border border-hairline bg-card px-2.5 py-2">
                <TechIcon name={t.name} />
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-fg">{t.name}</span>
                {t.version && <Badge tone="neutral">{t.version}</Badge>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Brand logo (bundled from the CC0 Simple Icons set) for a detected technology,
 * shown on a light tile so coloured and near-black marks read in both themes.
 * Falls back to a letter badge when no logo is available. */
function TechIcon({ name }: { name: string }) {
  const ic = TECH_ICONS[name];
  if (ic) {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-hairline bg-white">
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path fill={`#${ic.hex}`} d={ic.path} />
        </svg>
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-hairline bg-white">
      <span className="text-[12px] font-bold" style={{ color: `hsl(${hashHue(name)} 60% 42%)` }}>
        {name.charAt(0).toUpperCase()}
      </span>
    </span>
  );
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}
