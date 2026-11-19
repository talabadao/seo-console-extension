// User-configurable rule thresholds. A mutable singleton the side panel loads
// from chrome.storage.local on startup and the rules engine reads at evaluate time.

export interface Settings {
  titleMaxPx: number;
  titleMinPx: number;
  descMaxPx: number;
  descMinPx: number;
  imageLargeKB: number;
}

export const DEFAULT_SETTINGS: Settings = {
  titleMaxPx: 600,
  titleMinPx: 150,
  descMaxPx: 920,
  descMinPx: 430,
  imageLargeKB: 100,
};

export const SETTINGS_FIELDS: { key: keyof Settings; label: string; unit: string; min: number; max: number }[] = [
  { key: 'titleMaxPx', label: 'Title max width', unit: 'px', min: 200, max: 1000 },
  { key: 'titleMinPx', label: 'Title min width', unit: 'px', min: 0, max: 600 },
  { key: 'descMaxPx', label: 'Description max width', unit: 'px', min: 300, max: 1400 },
  { key: 'descMinPx', label: 'Description min width', unit: 'px', min: 0, max: 900 },
  { key: 'imageLargeKB', label: 'Large image threshold', unit: 'KB', min: 20, max: 2000 },
];

const STORAGE_KEY = 'seo-console-settings';

let current: Settings = { ...DEFAULT_SETTINGS };

export function getSettings(): Settings {
  return current;
}

export function setSettings(next: Partial<Settings>): Settings {
  current = { ...current, ...next };
  return current;
}

export async function loadSettings(): Promise<Settings> {
  try {
    const o = await chrome.storage.local.get(STORAGE_KEY);
    if (o[STORAGE_KEY]) setSettings(o[STORAGE_KEY] as Partial<Settings>);
  } catch {
    /* storage unavailable — keep defaults */
  }
  return current;
}

export async function saveSettings(next: Partial<Settings>): Promise<Settings> {
  setSettings(next);
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: current });
  } catch {
    /* ignore */
  }
  return current;
}

export async function resetSettings(): Promise<Settings> {
  return saveSettings({ ...DEFAULT_SETTINGS });
}
