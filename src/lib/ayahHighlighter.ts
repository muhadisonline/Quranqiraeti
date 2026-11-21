export type AyahHighlightColor = 'yellow' | 'green' | 'blue';

export type AyahHighlightMap = Record<string, AyahHighlightColor>;

export const AYAH_HIGHLIGHTS_STORAGE_KEY = 'quranqiraeti_ayah_highlights_v1';
export const AYAH_HIGHLIGHTS_EVENT = 'quranqiraeti:ayah-highlights-changed';

export const HIGHLIGHT_COLOR_META: Array<{
  id: AyahHighlightColor;
  label: string;
  swatchClass: string;
  markClass: string;
}> = [
  {
    id: 'yellow',
    label: 'Sarı',
    swatchClass: 'bg-amber-300 border-amber-500',
    markClass: 'bg-amber-200/65 text-stone-900 rounded-md px-2 py-1 dark:bg-amber-400/20 dark:text-stone-100',
  },
  {
    id: 'green',
    label: 'Yaşıl',
    swatchClass: 'bg-emerald-300 border-emerald-600',
    markClass: 'bg-emerald-200/60 text-stone-900 rounded-md px-2 py-1 dark:bg-emerald-400/20 dark:text-stone-100',
  },
  {
    id: 'blue',
    label: 'Mavi',
    swatchClass: 'bg-sky-300 border-sky-600',
    markClass: 'bg-sky-200/60 text-stone-900 rounded-md px-2 py-1 dark:bg-sky-400/20 dark:text-stone-100',
  },
];

const HIGHLIGHT_CLASS_MAP = new Map(HIGHLIGHT_COLOR_META.map((c) => [c.id, c.markClass]));

export function getAyahHighlightMarkClass(color: AyahHighlightColor | undefined): string {
  if (!color) return '';
  return HIGHLIGHT_CLASS_MAP.get(color) ?? '';
}

export function sanitizeAyahHighlightMap(input: unknown): AyahHighlightMap {
  if (!input || typeof input !== 'object') return {};
  const clean: AyahHighlightMap = {};
  for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
    if (!/^\d{1,3}:\d{1,3}$/.test(key)) continue;
    if (val === 'yellow' || val === 'green' || val === 'blue') {
      clean[key] = val;
    }
  }
  return clean;
}

export function toggleAyahHighlightInMap(
  map: AyahHighlightMap,
  surahNumber: number,
  ayahNumber: number,
  color: AyahHighlightColor
): AyahHighlightMap {
  const key = `${surahNumber}:${ayahNumber}`;
  const next = { ...map };
  if (next[key] === color) {
    delete next[key];
  } else {
    next[key] = color;
  }
  return next;
}

export function loadAyahHighlightsFromStorage(): AyahHighlightMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(AYAH_HIGHLIGHTS_STORAGE_KEY);
    if (!raw) return {};
    return sanitizeAyahHighlightMap(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function saveAyahHighlightsToStorage(map: AyahHighlightMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AYAH_HIGHLIGHTS_STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(AYAH_HIGHLIGHTS_EVENT));
  } catch {
    // ignore storage errors
  }
}
