import {
  EMPTY_HIFZ_PROGRESS,
  HifzProgressState,
  sanitizeHifzProgress,
} from './hifzProgress';
import { MissedWordRecord } from './muhaffiz';
import { TOTAL_QURAN_PAGES } from './quran';
import {
  LAST_READ_EVENT,
  LAST_READ_STORAGE_KEY,
  LastReadRecord,
  SAVED_AYAHS_EVENT,
  SAVED_AYAHS_STORAGE_KEY,
  SavedAyahRecord,
  sanitizeLastRead,
  sanitizeSavedAyahs,
} from './readerState';
import {
  EMPTY_READING_GOAL,
  READING_GOAL_EVENT,
  READING_GOAL_STORAGE_KEY,
  ReadingGoalState,
  sanitizeReadingGoalState,
} from './readingGoal';
import {
  CustomPrayerCoords,
  PRAYER_CITY_STORAGE_KEY,
  PRAYER_CUSTOM_COORDS_STORAGE_KEY,
  PRAYER_PREFS_EVENT,
  getCityById,
} from './prayerTimes';
import {
  ZIKR_STATE_STORAGE_KEY,
  ZikrTrackerState,
  createEmptyZikrState,
  sanitizeZikrState,
} from './zikrState';
import {
  KHATM_PLAN_EVENT,
  KHATM_PLAN_STORAGE_KEY,
  KhatmPlanConfig,
  sanitizeKhatmPlanConfig,
} from './khatmPlanner';
import {
  WORSHIP_REMINDERS_EVENT,
  WORSHIP_REMINDERS_STORAGE_KEY,
  WorshipReminderPrefs,
  sanitizeWorshipReminderPrefs,
} from './reminders';

import {
  WEAK_AYAHS_EVENT,
  WEAK_AYAHS_STORAGE_KEY,
  WeakAyahRecord,
  sanitizeWeakAyahList,
} from './muhaffizReview';

export const HIFZ_PROGRESS_KEY = 'quranqiraeti_hifz_progress_v1';
export const MISSED_WORDS_KEY = 'quranqiraeti_missed_words_v1';
export const SAVED_VIDEOS_KEY = 'quranqiraeti_saved_ids_v1';
export const HIFZ_LAST_PAGE_KEY = 'quranqiraeti_muhaffiz_last_page_v1';

export interface UserProgressBackup {
  version: 1;
  exportedAt: string;
  savedAyahs: SavedAyahRecord[];
  readingGoal: ReadingGoalState;
  hifzProgress: HifzProgressState;
  missedWords: MissedWordRecord[];
  lastRead: LastReadRecord | null;
  savedVideoIds: string[];
  zikrState?: ZikrTrackerState;
  prayerCityId?: string;
  prayerCustomCoords?: CustomPrayerCoords;
  khatmPlan?: KhatmPlanConfig;
  worshipReminders?: WorshipReminderPrefs;
  weakAyahs?: WeakAyahRecord[];
}

export function sanitizeMissedWordList(input: unknown, maxItems = 80): MissedWordRecord[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const clean: MissedWordRecord[] = [];

  for (const item of input) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as Partial<MissedWordRecord>;
    const tokenId = typeof raw.tokenId === 'string' ? raw.tokenId.trim() : '';
    const ayahKey = typeof raw.ayahKey === 'string' ? raw.ayahKey.trim() : '';
    const stemText = typeof raw.stemText === 'string' ? raw.stemText.trim() : '';
    const pageNumber = Number(raw.pageNumber);
    if (
      !tokenId ||
      !ayahKey ||
      !stemText ||
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      pageNumber > TOTAL_QURAN_PAGES ||
      seen.has(tokenId)
    ) {
      continue;
    }
    seen.add(tokenId);
    clean.push({
      tokenId,
      ayahKey,
      pageNumber,
      surahName: typeof raw.surahName === 'string' ? raw.surahName.trim() : '',
      stemText,
      createdAt:
        typeof raw.createdAt === 'string' && raw.createdAt
          ? raw.createdAt
          : new Date().toISOString(),
    });
    if (clean.length >= maxItems) break;
  }

  return clean;
}

export function sanitizeSavedVideoIdList(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  for (const item of input) {
    if (typeof item === 'string') {
      const clean = item.trim();
      if (/^[a-zA-Z0-9_-]{3,40}$/.test(clean)) {
        seen.add(clean);
      }
    }
  }
  return Array.from(seen).slice(0, 200);
}

export function buildUserProgressBackup(
  input: {
    savedAyahs?: unknown;
    readingGoal?: unknown;
    hifzProgress?: unknown;
    missedWords?: unknown;
    lastRead?: unknown;
    savedVideoIds?: unknown;
    zikrState?: unknown;
    prayerCityId?: unknown;
    prayerCustomCoords?: unknown;
    khatmPlan?: unknown;
    worshipReminders?: unknown;
    weakAyahs?: unknown;
  },
  nowIso = new Date().toISOString()
): UserProgressBackup {
  const customCoordsObj =
    input.prayerCustomCoords &&
    typeof input.prayerCustomCoords === 'object' &&
    typeof (input.prayerCustomCoords as Partial<CustomPrayerCoords>).lat === 'number' &&
    typeof (input.prayerCustomCoords as Partial<CustomPrayerCoords>).lng === 'number'
      ? {
          lat: Number((input.prayerCustomCoords as CustomPrayerCoords).lat.toFixed(4)),
          lng: Number((input.prayerCustomCoords as CustomPrayerCoords).lng.toFixed(4)),
        }
      : undefined;

  return {
    version: 1,
    exportedAt: nowIso,
    savedAyahs: sanitizeSavedAyahs(input.savedAyahs),
    readingGoal: sanitizeReadingGoalState(input.readingGoal),
    hifzProgress: sanitizeHifzProgress(input.hifzProgress),
    missedWords: sanitizeMissedWordList(input.missedWords),
    lastRead: sanitizeLastRead(input.lastRead),
    savedVideoIds: sanitizeSavedVideoIdList(input.savedVideoIds),
    ...(input.zikrState ? { zikrState: sanitizeZikrState(input.zikrState) } : {}),
    ...(typeof input.prayerCityId === 'string' && input.prayerCityId
      ? {
          prayerCityId:
            input.prayerCityId === 'custom' && customCoordsObj
              ? 'custom'
              : getCityById(input.prayerCityId).id,
        }
      : {}),
    ...(customCoordsObj ? { prayerCustomCoords: customCoordsObj } : {}),
    ...(input.khatmPlan ? { khatmPlan: sanitizeKhatmPlanConfig(input.khatmPlan) } : {}),
    ...(input.worshipReminders
      ? { worshipReminders: sanitizeWorshipReminderPrefs(input.worshipReminders) }
      : {}),
    ...(Array.isArray(input.weakAyahs)
      ? { weakAyahs: sanitizeWeakAyahList(input.weakAyahs) }
      : {}),
  };
}

export function parseAndValidateBackupJson(jsonText: string):
  | { ok: true; data: UserProgressBackup }
  | { ok: false; error: string } {
  const cleanText = (jsonText || '').trim();
  if (!cleanText) {
    return { ok: false, error: 'Seçilmiş fayl boşdur.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanText);
  } catch {
    return { ok: false, error: 'Fayl etibarlı JSON formatında deyil.' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Ehtiyat nüsxə faylının quruluşu düzgün deyil.' };
  }

  const obj = parsed as Record<string, unknown>;
  const hasAnyRecognizedKey =
    'savedAyahs' in obj ||
    'readingGoal' in obj ||
    'hifzProgress' in obj ||
    'missedWords' in obj ||
    'lastRead' in obj ||
    'savedVideoIds' in obj ||
    'zikrState' in obj ||
    'prayerCityId' in obj ||
    'khatmPlan' in obj ||
    'worshipReminders' in obj ||
    'weakAyahs' in obj;

  if (!hasAnyRecognizedKey) {
    return {
      ok: false,
      error: 'Bu faylda Quran Qiraeti tərəqqi məlumatları tapılmadı.',
    };
  }

  return {
    ok: true,
    data: buildUserProgressBackup(
      {
        savedAyahs: obj.savedAyahs ?? [],
        readingGoal: obj.readingGoal ?? EMPTY_READING_GOAL,
        hifzProgress: obj.hifzProgress ?? EMPTY_HIFZ_PROGRESS,
        missedWords: obj.missedWords ?? [],
        lastRead: obj.lastRead ?? null,
        savedVideoIds: obj.savedVideoIds ?? [],
        zikrState: obj.zikrState ?? undefined,
        prayerCityId: obj.prayerCityId ?? undefined,
        prayerCustomCoords: obj.prayerCustomCoords ?? undefined,
        khatmPlan: obj.khatmPlan ?? undefined,
        worshipReminders: obj.worshipReminders ?? undefined,
        weakAyahs: obj.weakAyahs ?? undefined,
      },
      typeof obj.exportedAt === 'string' && obj.exportedAt
        ? obj.exportedAt
        : new Date().toISOString()
    ),
  };
}

function readJsonKey(key: string): unknown {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function collectUserBackupFromStorage(): UserProgressBackup {
  let prayerCityId: string | undefined;
  let prayerCustomCoords: CustomPrayerCoords | undefined;
  if (typeof window !== 'undefined') {
    try {
      prayerCityId = window.localStorage.getItem(PRAYER_CITY_STORAGE_KEY) || undefined;
      const rawCoords = readJsonKey(PRAYER_CUSTOM_COORDS_STORAGE_KEY);
      if (
        rawCoords &&
        typeof rawCoords === 'object' &&
        typeof (rawCoords as Partial<CustomPrayerCoords>).lat === 'number' &&
        typeof (rawCoords as Partial<CustomPrayerCoords>).lng === 'number'
      ) {
        prayerCustomCoords = rawCoords as CustomPrayerCoords;
      }
    } catch {
      // ignore storage error
    }
  }
  return buildUserProgressBackup({
    savedAyahs: readJsonKey(SAVED_AYAHS_STORAGE_KEY),
    readingGoal: readJsonKey(READING_GOAL_STORAGE_KEY),
    hifzProgress: readJsonKey(HIFZ_PROGRESS_KEY),
    missedWords: readJsonKey(MISSED_WORDS_KEY),
    lastRead: readJsonKey(LAST_READ_STORAGE_KEY),
    savedVideoIds: readJsonKey(SAVED_VIDEOS_KEY),
    zikrState: readJsonKey(ZIKR_STATE_STORAGE_KEY) ?? createEmptyZikrState(),
    prayerCityId,
    prayerCustomCoords,
    khatmPlan: readJsonKey(KHATM_PLAN_STORAGE_KEY) ?? undefined,
    worshipReminders: readJsonKey(WORSHIP_REMINDERS_STORAGE_KEY) ?? undefined,
    weakAyahs: readJsonKey(WEAK_AYAHS_STORAGE_KEY) ?? undefined,
  });
}

export function applyUserBackupToStorage(backup: UserProgressBackup): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SAVED_AYAHS_STORAGE_KEY, JSON.stringify(backup.savedAyahs));
    window.localStorage.setItem(READING_GOAL_STORAGE_KEY, JSON.stringify(backup.readingGoal));
    window.localStorage.setItem(HIFZ_PROGRESS_KEY, JSON.stringify(backup.hifzProgress));
    window.localStorage.setItem(MISSED_WORDS_KEY, JSON.stringify(backup.missedWords));
    window.localStorage.setItem(SAVED_VIDEOS_KEY, JSON.stringify(backup.savedVideoIds));
    if (backup.lastRead) {
      window.localStorage.setItem(LAST_READ_STORAGE_KEY, JSON.stringify(backup.lastRead));
    }
    if (backup.zikrState) {
      window.localStorage.setItem(ZIKR_STATE_STORAGE_KEY, JSON.stringify(backup.zikrState));
    }
    if (backup.prayerCityId) {
      window.localStorage.setItem(PRAYER_CITY_STORAGE_KEY, backup.prayerCityId);
    }
    if (backup.prayerCustomCoords) {
      window.localStorage.setItem(
        PRAYER_CUSTOM_COORDS_STORAGE_KEY,
        JSON.stringify(backup.prayerCustomCoords)
      );
    } else if (backup.prayerCityId && backup.prayerCityId !== 'custom') {
      window.localStorage.removeItem(PRAYER_CUSTOM_COORDS_STORAGE_KEY);
    }
    if (backup.khatmPlan) {
      window.localStorage.setItem(KHATM_PLAN_STORAGE_KEY, JSON.stringify(backup.khatmPlan));
    }
    if (backup.worshipReminders) {
      window.localStorage.setItem(
        WORSHIP_REMINDERS_STORAGE_KEY,
        JSON.stringify(backup.worshipReminders)
      );
    }
    if (backup.weakAyahs) {
      window.localStorage.setItem(WEAK_AYAHS_STORAGE_KEY, JSON.stringify(backup.weakAyahs));
      window.dispatchEvent(new CustomEvent(WEAK_AYAHS_EVENT));
    }
    window.dispatchEvent(new CustomEvent(SAVED_AYAHS_EVENT));
    window.dispatchEvent(new Event(READING_GOAL_EVENT));
    window.dispatchEvent(new CustomEvent(LAST_READ_EVENT));
    window.dispatchEvent(new CustomEvent(PRAYER_PREFS_EVENT));
    window.dispatchEvent(new CustomEvent(KHATM_PLAN_EVENT));
    window.dispatchEvent(new CustomEvent(WORSHIP_REMINDERS_EVENT));
  } catch {
    // ignore quota errors
  }
}
