import { normalizeAzerbaijaniText } from './channel';
import {
  SURAH_CATALOG,
  SurahCatalogEntry,
  TOTAL_QURAN_PAGES,
  TOTAL_QURAN_SURAHS,
  getSurahByNumber,
} from './quran';

export interface SavedAyahRecord {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  pageNumber?: number;
  arabicText: string;
  translation: string;
  note?: string;
  savedAt: string;
}

export interface LastReadRecord {
  kind: 'page' | 'surah';
  targetNumber: number;
  label: string;
  path: string;
  updatedAt: string;
}

export type ReaderTextScale = 'compact' | 'normal' | 'large';
export type ReaderDisplayMode = 'both' | 'arabic';
export type ReaderLayoutMode = 'stacked' | 'book';
export type AudioPlaybackSpeed = 0.75 | 1 | 1.25;
export type AyahRepeatCount = 1 | 3 | 5 | 10 | 0; // 0 = continuous single-ayah loop
export type AyahPauseSeconds = 0 | 3 | 5;

export const AYAH_REPEAT_OPTIONS: AyahRepeatCount[] = [1, 3, 5, 10, 0];
export const AYAH_PAUSE_OPTIONS: AyahPauseSeconds[] = [0, 3, 5];

export interface QuranSearchMatch {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  snippet: string;
}

export type QuickQuranTarget =
  | {
      kind: 'surah-ayah';
      surahNumber: number;
      ayahNumber: number;
      path: string;
      label: string;
    }
  | {
      kind: 'surah';
      surahNumber: number;
      path: string;
      label: string;
    }
  | {
      kind: 'page';
      pageNumber: number;
      path: string;
      label: string;
    };

export const SAVED_AYAHS_STORAGE_KEY = 'quranqiraeti_saved_ayahs_v1';
export const SAVED_AYAHS_EVENT = 'quranqiraeti:saved-ayahs-changed';
export const LAST_READ_STORAGE_KEY = 'quranqiraeti_last_read_v1';
export const LAST_READ_EVENT = 'quranqiraeti:last-read-changed';
export const READER_SCALE_STORAGE_KEY = 'quranqiraeti_reader_scale_v1';
export const READER_DISPLAY_STORAGE_KEY = 'quranqiraeti_reader_display_v1';
export const AUDIO_SPEED_STORAGE_KEY = 'quranqiraeti_audio_speed_v1';
export const AUDIO_REPEAT_STORAGE_KEY = 'quranqiraeti_audio_repeat_v1';
export const AUDIO_PAUSE_STORAGE_KEY = 'quranqiraeti_audio_pause_v1';
export const READER_TRANSLIT_STORAGE_KEY = 'quranqiraeti_reader_translit_v1';
export const READER_TAJWEED_STORAGE_KEY = 'quranqiraeti_reader_tajweed_v1';
export const READER_LAYOUT_STORAGE_KEY = 'quranqiraeti_reader_layout_v1';
export const MUSHAF_CONTINUOUS_AUDIO_KEY = 'quranqiraeti_mushaf_continuous_audio_v1';
export const MUSHAF_AUTOPLAY_NEXT_KEY = 'quranqiraeti_mushaf_autoplay_page_v1';

export const READER_SCALE_LABELS: Record<ReaderTextScale, string> = {
  compact: 'Kiçik',
  normal: 'Orta',
  large: 'Böyük',
};

export const READER_SCALE_CLASSES: Record<
  ReaderTextScale,
  { arabic: string; translation: string }
> = {
  compact: {
    arabic: 'text-xl leading-[2.1] sm:text-2xl',
    translation: 'text-sm leading-relaxed',
  },
  normal: {
    arabic: 'text-2xl leading-[2.25] sm:text-[1.8rem]',
    translation: 'text-base leading-relaxed',
  },
  large: {
    arabic: 'text-3xl leading-[2.35] sm:text-[2.2rem]',
    translation: 'text-lg leading-relaxed',
  },
};

export function sanitizeSavedAyahs(input: unknown): SavedAyahRecord[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const clean: SavedAyahRecord[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Partial<SavedAyahRecord>;
    const surahNumber = Number(item.surahNumber);
    const ayahNumber = Number(item.ayahNumber);
    if (
      !Number.isInteger(surahNumber) ||
      surahNumber < 1 ||
      surahNumber > TOTAL_QURAN_SURAHS ||
      !Number.isInteger(ayahNumber) ||
      ayahNumber < 1
    ) {
      continue;
    }
    const key = `${surahNumber}:${ayahNumber}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const catalogSurah = getSurahByNumber(surahNumber);
    const pageNum = Number(item.pageNumber);
    const noteStr = typeof item.note === 'string' ? item.note.trim().slice(0, 500) : '';
    clean.push({
      surahNumber,
      ayahNumber,
      surahName: String(item.surahName || catalogSurah?.name || `Surə ${surahNumber}`).trim(),
      pageNumber:
        Number.isInteger(pageNum) && pageNum >= 1 && pageNum <= TOTAL_QURAN_PAGES
          ? pageNum
          : undefined,
      arabicText: String(item.arabicText ?? '').trim(),
      translation: String(item.translation ?? '').trim(),
      ...(noteStr ? { note: noteStr } : {}),
      savedAt: typeof item.savedAt === 'string' && item.savedAt ? item.savedAt : new Date().toISOString(),
    });
  }

  return clean.slice(0, 120);
}

export function isAyahBookmarked(
  list: SavedAyahRecord[],
  surahNumber: number,
  ayahNumber: number
): boolean {
  return list.some((a) => a.surahNumber === surahNumber && a.ayahNumber === ayahNumber);
}

export function toggleSavedAyahItem(
  list: SavedAyahRecord[],
  entry: Omit<SavedAyahRecord, 'savedAt'>,
  nowIso = new Date().toISOString()
): { next: SavedAyahRecord[]; added: boolean } {
  const exists = isAyahBookmarked(list, entry.surahNumber, entry.ayahNumber);
  if (exists) {
    return {
      next: list.filter(
        (a) => !(a.surahNumber === entry.surahNumber && a.ayahNumber === entry.ayahNumber)
      ),
      added: false,
    };
  }
  const cleanEntry: SavedAyahRecord = {
    ...entry,
    surahName: entry.surahName || getSurahByNumber(entry.surahNumber)?.name || `Surə ${entry.surahNumber}`,
    savedAt: nowIso,
  };
  return {
    next: [cleanEntry, ...list].slice(0, 120),
    added: true,
  };
}

export function removeSavedAyahItem(
  list: SavedAyahRecord[],
  surahNumber: number,
  ayahNumber: number
): SavedAyahRecord[] {
  return list.filter((a) => !(a.surahNumber === surahNumber && a.ayahNumber === ayahNumber));
}

export function updateSavedAyahNoteItem(
  list: SavedAyahRecord[],
  surahNumber: number,
  ayahNumber: number,
  note: string
): SavedAyahRecord[] {
  const cleanNote = note.trim().slice(0, 500);
  return list.map((item) => {
    if (item.surahNumber !== surahNumber || item.ayahNumber !== ayahNumber) return item;
    if (!cleanNote) {
      const { note: _removed, ...rest } = item;
      return rest;
    }
    return { ...item, note: cleanNote };
  });
}

export function upsertSavedAyahNoteItem(
  list: SavedAyahRecord[],
  entry: Omit<SavedAyahRecord, 'savedAt' | 'note'>,
  note: string,
  nowIso = new Date().toISOString()
): SavedAyahRecord[] {
  const cleanNote = note.trim().slice(0, 500);
  const exists = isAyahBookmarked(list, entry.surahNumber, entry.ayahNumber);
  if (!exists) {
    const cleanEntry: SavedAyahRecord = {
      ...entry,
      surahName:
        entry.surahName || getSurahByNumber(entry.surahNumber)?.name || `Surə ${entry.surahNumber}`,
      ...(cleanNote ? { note: cleanNote } : {}),
      savedAt: nowIso,
    };
    return [cleanEntry, ...list].slice(0, 120);
  }
  return list.map((item) => {
    if (item.surahNumber !== entry.surahNumber || item.ayahNumber !== entry.ayahNumber) return item;
    const base: SavedAyahRecord = {
      ...item,
      surahName: item.surahName || entry.surahName,
      pageNumber: item.pageNumber ?? entry.pageNumber,
      arabicText: item.arabicText || entry.arabicText,
      translation: item.translation || entry.translation,
      savedAt: nowIso,
    };
    if (!cleanNote) {
      const { note: _removed, ...rest } = base;
      return rest;
    }
    return { ...base, note: cleanNote };
  });
}

export function formatSavedAyahsForExport(list: SavedAyahRecord[]): string {
  if (list.length === 0) return '';
  const header = `Quran Qiraeti — Saxlanılan Ayələr (${list.length})\n========================================\n\n`;
  const blocks = list.map((item, idx) => {
    const ref = `${idx + 1}. ${item.surahName} surəsi · ${item.surahNumber}:${item.ayahNumber}${
      item.pageNumber ? ` (Mədinə səhifəsi ${item.pageNumber})` : ''
    }`;
    const lines = [ref];
    if (item.arabicText) lines.push(item.arabicText);
    if (item.translation) lines.push(`"${item.translation}" (Əlixan Musayev tərcüməsi)`);
    if (item.note) lines.push(`Şəxsi qeyd: ${item.note}`);
    return lines.join('\n');
  });
  return header + blocks.join('\n\n----------------------------------------\n\n') + '\n';
}

export function loadSavedAyahsFromStorage(): SavedAyahRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVED_AYAHS_STORAGE_KEY);
    if (!raw) return [];
    return sanitizeSavedAyahs(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function persistSavedAyahsToStorage(list: SavedAyahRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SAVED_AYAHS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(SAVED_AYAHS_EVENT));
  } catch {
    // ignore storage quota errors
  }
}

export function sanitizeLastRead(input: unknown): LastReadRecord | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Partial<LastReadRecord>;
  if (raw.kind !== 'page' && raw.kind !== 'surah') return null;
  const targetNumber = Number(raw.targetNumber);
  if (!Number.isInteger(targetNumber)) return null;

  if (raw.kind === 'page' && (targetNumber < 1 || targetNumber > TOTAL_QURAN_PAGES)) {
    return null;
  }
  if (raw.kind === 'surah' && (targetNumber < 1 || targetNumber > TOTAL_QURAN_SURAHS)) {
    return null;
  }

  return {
    kind: raw.kind,
    targetNumber,
    label: String(raw.label ?? '').trim() || (raw.kind === 'page' ? `Səhifə ${targetNumber}` : `Surə ${targetNumber}`),
    path:
      typeof raw.path === 'string' && raw.path.startsWith('/quran')
        ? raw.path
        : raw.kind === 'page'
          ? `/quran/sehife/${targetNumber}`
          : `/quran/sure/${targetNumber}`,
    updatedAt: typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : new Date().toISOString(),
  };
}

export function buildLastReadRecord(
  kind: 'page' | 'surah',
  targetNumber: number,
  label: string,
  nowIso = new Date().toISOString()
): LastReadRecord {
  return {
    kind,
    targetNumber,
    label,
    path: kind === 'page' ? `/quran/sehife/${targetNumber}` : `/quran/sure/${targetNumber}`,
    updatedAt: nowIso,
  };
}

export function loadLastReadFromStorage(): LastReadRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LAST_READ_STORAGE_KEY);
    if (!raw) return null;
    return sanitizeLastRead(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveLastReadToStorage(record: LastReadRecord): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_READ_STORAGE_KEY, JSON.stringify(record));
    window.dispatchEvent(new CustomEvent(LAST_READ_EVENT));
  } catch {
    // ignore storage errors
  }
}

export function loadReaderScaleFromStorage(): ReaderTextScale {
  if (typeof window === 'undefined') return 'normal';
  try {
    const raw = window.localStorage.getItem(READER_SCALE_STORAGE_KEY);
    if (raw === 'compact' || raw === 'normal' || raw === 'large') return raw;
  } catch {
    // ignore storage error
  }
  return 'normal';
}

export function saveReaderScaleToStorage(scale: ReaderTextScale): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(READER_SCALE_STORAGE_KEY, scale);
  } catch {
    // ignore storage error
  }
}

export function loadReaderDisplayFromStorage(): ReaderDisplayMode {
  if (typeof window === 'undefined') return 'both';
  try {
    const raw = window.localStorage.getItem(READER_DISPLAY_STORAGE_KEY);
    if (raw === 'arabic' || raw === 'both') return raw;
  } catch {
    // ignore storage error
  }
  return 'both';
}

export function saveReaderDisplayToStorage(mode: ReaderDisplayMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(READER_DISPLAY_STORAGE_KEY, mode);
  } catch {
    // ignore storage error
  }
}

export function loadAudioSpeedFromStorage(): AudioPlaybackSpeed {
  if (typeof window === 'undefined') return 1;
  try {
    const raw = Number(window.localStorage.getItem(AUDIO_SPEED_STORAGE_KEY));
    if (raw === 0.75 || raw === 1 || raw === 1.25) return raw;
  } catch {
    // ignore storage error
  }
  return 1;
}

export function saveAudioSpeedToStorage(speed: AudioPlaybackSpeed): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUDIO_SPEED_STORAGE_KEY, String(speed));
  } catch {
    // ignore storage error
  }
}

export function getNextAyahRepeatCount(current: AyahRepeatCount): AyahRepeatCount {
  const idx = AYAH_REPEAT_OPTIONS.indexOf(current);
  return AYAH_REPEAT_OPTIONS[(idx + 1) % AYAH_REPEAT_OPTIONS.length] ?? 1;
}

export function getNextAyahPauseSeconds(current: AyahPauseSeconds): AyahPauseSeconds {
  const idx = AYAH_PAUSE_OPTIONS.indexOf(current);
  return AYAH_PAUSE_OPTIONS[(idx + 1) % AYAH_PAUSE_OPTIONS.length] ?? 0;
}

export function loadAudioRepeatFromStorage(): AyahRepeatCount {
  if (typeof window === 'undefined') return 1;
  try {
    const raw = Number(window.localStorage.getItem(AUDIO_REPEAT_STORAGE_KEY));
    if (raw === 1 || raw === 3 || raw === 5 || raw === 10 || raw === 0) return raw;
  } catch {
    // ignore storage error
  }
  return 1;
}

export function saveAudioRepeatToStorage(repeat: AyahRepeatCount): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUDIO_REPEAT_STORAGE_KEY, String(repeat));
  } catch {
    // ignore storage error
  }
}

export function loadAudioPauseFromStorage(): AyahPauseSeconds {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = Number(window.localStorage.getItem(AUDIO_PAUSE_STORAGE_KEY));
    if (raw === 0 || raw === 3 || raw === 5) return raw;
  } catch {
    // ignore storage error
  }
  return 0;
}

export function saveAudioPauseToStorage(seconds: AyahPauseSeconds): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUDIO_PAUSE_STORAGE_KEY, String(seconds));
  } catch {
    // ignore storage error
  }
}

export function loadReaderTranslitFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(READER_TRANSLIT_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveReaderTranslitToStorage(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(READER_TRANSLIT_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // ignore storage error
  }
}

export function loadReaderTajweedFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(READER_TAJWEED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveReaderTajweedToStorage(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(READER_TAJWEED_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // ignore storage error
  }
}

export function parseQuickQuranTarget(
  rawInput: string,
  catalog: SurahCatalogEntry[] = SURAH_CATALOG
): QuickQuranTarget | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  // Pattern 1: "2:255", "2/255", "2 255" -> Surah:Ayah
  const surahAyahMatch = trimmed.match(/^(\d{1,3})\s*[:/\s.-]\s*(\d{1,3})$/);
  if (surahAyahMatch) {
    const surahNumber = Number.parseInt(surahAyahMatch[1], 10);
    const rawAyah = Number.parseInt(surahAyahMatch[2], 10);
    if (surahNumber >= 1 && surahNumber <= TOTAL_QURAN_SURAHS) {
      const surah = catalog.find((s) => s.number === surahNumber) ?? getSurahByNumber(surahNumber);
      const maxAyah = surah?.ayahCount ?? 286;
      const ayahNumber = Math.min(maxAyah, Math.max(1, rawAyah));
      return {
        kind: 'surah-ayah',
        surahNumber,
        ayahNumber,
        path: `/quran/sure/${surahNumber}#ayah-${ayahNumber}`,
        label: `${surah?.name ?? `Surə ${surahNumber}`} ${surahNumber}:${ayahNumber}`,
      };
    }
    return null;
  }

  // Pattern 2: Plain number -> Mushaf page 1..604
  if (/^\d{1,4}$/.test(trimmed)) {
    const num = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(num) || num < 1) return null;
    const pageNumber = Math.min(TOTAL_QURAN_PAGES, Math.max(1, num));
    return {
      kind: 'page',
      pageNumber,
      path: `/quran/sehife/${pageNumber}`,
      label: `Mədinə səhifəsi ${pageNumber}`,
    };
  }

  // Pattern 3: Surah name (exact or prefix / substring in Azerbaijani normalized text)
  const normQuery = normalizeAzerbaijaniText(trimmed);
  if (normQuery.length < 2) return null;

  const exactMatch = catalog.find((s) => {
    const normName = normalizeAzerbaijaniText(s.name);
    return normName === normQuery || `${normName} suresi` === normQuery;
  });
  const prefixMatch =
    exactMatch ??
    catalog.find((s) => normalizeAzerbaijaniText(s.name).startsWith(normQuery)) ??
    catalog.find((s) => normalizeAzerbaijaniText(s.name).includes(normQuery));

  if (prefixMatch) {
    return {
      kind: 'surah',
      surahNumber: prefixMatch.number,
      path: `/quran/sure/${prefixMatch.number}`,
      label: `${prefixMatch.number}. ${prefixMatch.name} surəsi`,
    };
  }

  return null;
}

export function parseAlQuranSearchPayload(
  payload: unknown,
  catalog: SurahCatalogEntry[] = SURAH_CATALOG,
  limit = 24
): QuranSearchMatch[] {
  if (!payload || typeof payload !== 'object') return [];
  const data = (payload as { data?: { matches?: unknown[] } }).data;
  const rawMatches = Array.isArray(data?.matches) ? data.matches : [];
  const seen = new Set<string>();
  const results: QuranSearchMatch[] = [];

  for (const item of rawMatches) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as {
      text?: unknown;
      numberInSurah?: unknown;
      surah?: { number?: unknown; englishName?: unknown };
    };
    const surahNumber = Number(raw.surah?.number);
    const ayahNumber = Number(raw.numberInSurah);
    const snippet = String(raw.text ?? '').replace(/\s+/g, ' ').trim();
    if (
      !Number.isInteger(surahNumber) ||
      surahNumber < 1 ||
      surahNumber > TOTAL_QURAN_SURAHS ||
      !Number.isInteger(ayahNumber) ||
      ayahNumber < 1 ||
      !snippet
    ) {
      continue;
    }
    const key = `${surahNumber}:${ayahNumber}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const surah = catalog.find((s) => s.number === surahNumber) ?? getSurahByNumber(surahNumber);
    results.push({
      surahNumber,
      surahName: surah?.name ?? String(raw.surah?.englishName ?? `Surə ${surahNumber}`),
      ayahNumber,
      snippet,
    });
    if (results.length >= limit) break;
  }

  return results;
}

export function pickDailyCuratedIndex(length: number, date = new Date()): number {
  if (length <= 1) return 0;
  const dayKey = Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000
  );
  return Math.abs(dayKey) % length;
}

export function pickRandomGlobalAyahTarget(
  catalog: SurahCatalogEntry[] = SURAH_CATALOG,
  randomFn: () => number = Math.random
): { surahNumber: number; ayahNumber: number } {
  const totalAyahs = catalog.reduce((sum, s) => sum + s.ayahCount, 0);
  if (totalAyahs <= 0) return { surahNumber: 1, ayahNumber: 1 };
  const clamped = Math.min(0.9999999, Math.max(0, randomFn()));
  let offset = Math.floor(clamped * totalAyahs);
  for (const surah of catalog) {
    if (offset < surah.ayahCount) {
      return {
        surahNumber: surah.number,
        ayahNumber: offset + 1,
      };
    }
    offset -= surah.ayahCount;
  }
  return { surahNumber: 1, ayahNumber: 1 };
}

export function loadReaderLayoutFromStorage(): ReaderLayoutMode {
  if (typeof window === 'undefined') return 'stacked';
  try {
    const raw = window.localStorage.getItem(READER_LAYOUT_STORAGE_KEY);
    if (raw === 'book' || raw === 'stacked') return raw;
  } catch {
    // ignore storage error
  }
  return 'stacked';
}

export function saveReaderLayoutToStorage(mode: ReaderLayoutMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(READER_LAYOUT_STORAGE_KEY, mode);
  } catch {
    // ignore storage error
  }
}

export function loadContinuousMushafAudioFromStorage(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(MUSHAF_CONTINUOUS_AUDIO_KEY);
    if (raw === '0') return false;
    return true;
  } catch {
    return true;
  }
}

export function saveContinuousMushafAudioToStorage(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MUSHAF_CONTINUOUS_AUDIO_KEY, enabled ? '1' : '0');
  } catch {
    // ignore storage error
  }
}

export function evaluateHorizontalSwipe(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  minDistance = 64
): 'next' | 'prev' | null {
  const dx = endX - startX;
  const dy = endY - startY;
  if (Math.abs(dx) < minDistance) return null;
  if (Math.abs(dx) < Math.abs(dy) * 1.4) return null;
  // Swiping right-to-left (dx < 0) turns forward to the next page; left-to-right turns back
  return dx < 0 ? 'next' : 'prev';
}

