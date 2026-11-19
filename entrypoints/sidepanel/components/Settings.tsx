import React from 'react';
import { DEFAULT_SETTINGS, SETTINGS_FIELDS, getSettings, type Settings } from '@/lib/settings';
import { cn, focusRing } from './ui';

export default function SettingsPanel({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (s: Partial<Settings>) => void;
}) {
  const [vals, setVals] = React.useState<Settings>({ ...getSettings() });

  const update = (key: keyof Settings, raw: number, min: number, max: number) =>
    setVals((s) => ({ ...s, [key]: clamp(raw, min, max) }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-semibold tracking-tight text-fg">Settings</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className={cn('rounded-md p-1 text-muted hover:bg-hover hover:text-fg', focusRing)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <p className="text-[12px] leading-snug text-muted">
        Rule thresholds used when scoring the page. Changes are saved and the current page is re-analyzed.
      </p>

      <div className="space-y-1.5">
        {SETTINGS_FIELDS.map((f) => (
          <label
            key={f.key}
            className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-card px-3 py-2"
          >
            <span className="text-[12.5px] text-body">{f.label}</span>
            <span className="flex items-center gap-1.5">
              <input
                type="number"
                min={f.min}
                max={f.max}
                value={vals[f.key]}
                onChange={(e) => update(f.key, Number(e.target.value), f.min, f.max)}
                className={cn(
                  'tnum w-20 rounded-md border border-hairline bg-canvas px-2 py-1 text-right text-[12px] text-fg',
                  focusRing,
                )}
              />
              <span className="w-6 text-[11px] text-muted">{f.unit}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            onSave(vals);
            onClose();
          }}
          className={cn(
            'rounded-md bg-ink px-3 py-1.5 text-[12px] font-semibold text-on-ink hover:bg-[var(--brand-ink-pressed)]',
            focusRing,
          )}
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setVals({ ...DEFAULT_SETTINGS })}
          className={cn('rounded-md bg-hover px-3 py-1.5 text-[12px] font-medium text-body hover:text-fg', focusRing)}
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min;
  return Math.min(max, Math.max(min, v));
}
