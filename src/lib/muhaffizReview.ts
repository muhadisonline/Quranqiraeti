import { TOTAL_QURAN_PAGES } from './quran';

export type WeakAyahReason = 'manual' | 'token_error' | 'hint_heavy' | 'quiz_error';

export interface WeakAyahRecord {
  ayahKey: string; // e.g. "2:255"
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  pageNumber: number;
  reasons: WeakAyahReason[];
  mistakeCount: number;
  manualFlag: boolean;
  dueForReview: boolean;
  lastStruggledAt: string;
  masteredAt?: string;
}

export const WEAK_AYAHS_STORAGE_KEY = 'quranqiraeti_muhaffiz_weak_ayahs_v1';
export const WEAK_AYAHS_EVENT = 'quranqiraeti:muhaffiz-weak-ayahs-changed';

export const WEAK_AYAH_REASON_LABELS: Record<WeakAyahReason, string> = {
  manual: 'Əl ilə qeyd',
  token_error: 'Söz xətası',
  hint_heavy: 'Çox ipucu',
  quiz_error: 'Məşq xətası',
};

export function parseAyahKeyNumbers(
  ayahKey: string
): { surahNumber: number; ayahNumber: number } | null {
  const match = (ayahKey || '').trim().match(/^(\d{1,3}):(\d{1,3})$/);
  if (!match) return null;
  const surahNumber = Number.parseInt(match[1], 10);
  const ayahNumber = Number.parseInt(match[2], 10);
  if (
    !Number.isInteger(surahNumber) ||
    surahNumber < 1 ||
    surahNumber > 114 ||
    !Number.isInteger(ayahNumber) ||
    ayahNumber < 1 ||
    ayahNumber > 286
  ) {
    return null;
  }
  return { surahNumber, ayahNumber };
}

export function sanitizeWeakAyahList(input: unknown, maxItems = 150): WeakAyahRecord[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const clean: WeakAyahRecord[] = [];
  const validReasons = new Set<WeakAyahReason>([
    'manual',
    'token_error',
    'hint_heavy',
    'quiz_error',
  ]);

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Partial<WeakAyahRecord>;
    const parsedKey = parseAyahKeyNumbers(String(item.ayahKey ?? ''));
    const surahNumber = Number(item.surahNumber ?? parsedKey?.surahNumber);
    const ayahNumber = Number(item.ayahNumber ?? parsedKey?.ayahNumber);
    const pageNumber = Number(item.pageNumber);
    if (
      !Number.isInteger(surahNumber) ||
      surahNumber < 1 ||
      surahNumber > 114 ||
      !Number.isInteger(ayahNumber) ||
      ayahNumber < 1 ||
      ayahNumber > 286 ||
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      pageNumber > TOTAL_QURAN_PAGES
    ) {
      continue;
    }

    const ayahKey = `${surahNumber}:${ayahNumber}`;
    if (seen.has(ayahKey)) continue;
    seen.add(ayahKey);

    const reasons = Array.isArray(item.reasons)
      ? Array.from(
          new Set(
            item.reasons.filter((r): r is WeakAyahReason => validReasons.has(r as WeakAyahReason))
          )
        )
      : [];

    clean.push({
      ayahKey,
      surahNumber,
      ayahNumber,
      surahName: String(item.surahName ?? `Surə ${surahNumber}`).trim().slice(0, 80) || `Surə ${surahNumber}`,
      pageNumber,
      reasons: reasons.length > 0 ? reasons : ['manual'],
      mistakeCount: Math.max(1, Math.min(999, Math.trunc(Number(item.mistakeCount) || 1))),
      manualFlag: Boolean(item.manualFlag),
      dueForReview: item.dueForReview !== false,
      lastStruggledAt:
        typeof item.lastStruggledAt === 'string' && item.lastStruggledAt
          ? item.lastStruggledAt
          : new Date().toISOString(),
      ...(typeof item.masteredAt === 'string' && item.masteredAt
        ? { masteredAt: item.masteredAt }
        : {}),
    });

    if (clean.length >= maxItems) break;
  }

  return clean;
}

export function recordWeakAyahSignal(
  list: WeakAyahRecord[],
  input: {
    ayahKey: string;
    surahName: string;
    pageNumber: number;
    reason: WeakAyahReason;
  },
  nowIso = new Date().toISOString()
): WeakAyahRecord[] {
  const parsed = parseAyahKeyNumbers(input.ayahKey);
  if (!parsed) return list;
  const pageNumber = Math.max(1, Math.min(TOTAL_QURAN_PAGES, Math.trunc(input.pageNumber || 1)));
  const cleanName = (input.surahName || `Surə ${parsed.surahNumber}`).trim().slice(0, 80);
  const canonicalKey = `${parsed.surahNumber}:${parsed.ayahNumber}`;
  const existing = list.find((r) => r.ayahKey === canonicalKey);

  if (!existing) {
    const created: WeakAyahRecord = {
      ayahKey: canonicalKey,
      surahNumber: parsed.surahNumber,
      ayahNumber: parsed.ayahNumber,
      surahName: cleanName,
      pageNumber,
      reasons: [input.reason],
      mistakeCount: 1,
      manualFlag: input.reason === 'manual',
      dueForReview: true,
      lastStruggledAt: nowIso,
    };
    return [created, ...list].slice(0, 150);
  }

  const nextReasons = existing.reasons.includes(input.reason)
    ? existing.reasons
    : [...existing.reasons, input.reason];
  const updated: WeakAyahRecord = {
    ...existing,
    surahName: cleanName || existing.surahName,
    pageNumber,
    reasons: nextReasons,
    mistakeCount: existing.mistakeCount + 1,
    manualFlag: existing.manualFlag || input.reason === 'manual',
    dueForReview: true,
    lastStruggledAt: nowIso,
  };
  delete updated.masteredAt;

  return [updated, ...list.filter((r) => r.ayahKey !== canonicalKey)].slice(0, 150);
}

export function toggleManualWeakAyah(
  list: WeakAyahRecord[],
  input: {
    ayahKey: string;
    surahName: string;
    pageNumber: number;
  },
  nowIso = new Date().toISOString()
): { next: WeakAyahRecord[]; flagged: boolean } {
  const parsed = parseAyahKeyNumbers(input.ayahKey);
  if (!parsed) return { next: list, flagged: false };
  const canonicalKey = `${parsed.surahNumber}:${parsed.ayahNumber}`;
  const existing = list.find((r) => r.ayahKey === canonicalKey);

  if (existing && existing.dueForReview && existing.manualFlag) {
    // If purely manual, remove; if also has automatic errors, clear manualFlag and mark mastered if user explicitly unflags
    const next = list.filter((r) => r.ayahKey !== canonicalKey);
    return { next, flagged: false };
  }

  return {
    next: recordWeakAyahSignal(
      list,
      {
        ayahKey: canonicalKey,
        surahName: input.surahName,
        pageNumber: input.pageNumber,
        reason: 'manual',
      },
      nowIso
    ),
    flagged: true,
  };
}

export function markWeakAyahMastered(
  list: WeakAyahRecord[],
  ayahKey: string,
  nowIso = new Date().toISOString()
): WeakAyahRecord[] {
  return list.map((item) =>
    item.ayahKey === ayahKey
      ? {
          ...item,
          manualFlag: false,
          dueForReview: false,
          masteredAt: nowIso,
        }
      : item
  );
}

export function sortWeakAyahReviewQueue(list: WeakAyahRecord[]): WeakAyahRecord[] {
  return list
    .filter((r) => r.dueForReview)
    .slice()
    .sort((a, b) => {
      if (a.manualFlag !== b.manualFlag) return a.manualFlag ? -1 : 1;
      if (b.mistakeCount !== a.mistakeCount) return b.mistakeCount - a.mistakeCount;
      return (Date.parse(b.lastStruggledAt) || 0) - (Date.parse(a.lastStruggledAt) || 0);
    });
}

export function loadWeakAyahsFromStorage(): WeakAyahRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(WEAK_AYAHS_STORAGE_KEY);
    if (!raw) return [];
    return sanitizeWeakAyahList(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveWeakAyahsToStorage(list: WeakAyahRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WEAK_AYAHS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(WEAK_AYAHS_EVENT));
  } catch {
    // ignore storage errors
  }
}
