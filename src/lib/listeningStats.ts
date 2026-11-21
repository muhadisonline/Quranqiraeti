import { getSurahByNumber } from './quran';
import { getLocalDateKey } from './readingGoal';

export interface ListeningStatsState {
  totalSeconds: number;
  sessionsCount: number;
  bySurah: Record<number, number>;
  byReciter: Record<string, number>;
  byDay: Record<string, number>;
  updatedAt: string;
}

export interface ListeningStatsSummary {
  totalSeconds: number;
  formattedTotal: string;
  sessionsCount: number;
  todaySeconds: number;
  last7DaysSeconds: number;
  topSurahs: Array<{
    surahNumber: number;
    surahName: string;
    seconds: number;
    formatted: string;
    sharePercent: number;
  }>;
  topReciters: Array<{
    reciterName: string;
    seconds: number;
    formatted: string;
    sharePercent: number;
  }>;
}

export const LISTENING_STATS_KEY = 'quranqiraeti_listening_stats_v1';
export const LISTENING_STATS_EVENT = 'quranqiraeti:listening-stats-changed';

export const EMPTY_LISTENING_STATS: ListeningStatsState = {
  totalSeconds: 0,
  sessionsCount: 0,
  bySurah: {},
  byReciter: {},
  byDay: {},
  updatedAt: '',
};

export function sanitizeListeningStats(input: unknown): ListeningStatsState {
  if (!input || typeof input !== 'object') return { ...EMPTY_LISTENING_STATS };
  const raw = input as Partial<ListeningStatsState>;

  const bySurah: Record<number, number> = {};
  if (raw.bySurah && typeof raw.bySurah === 'object') {
    for (const [k, v] of Object.entries(raw.bySurah)) {
      const sNum = Number.parseInt(k, 10);
      const sec = Number(v);
      if (Number.isInteger(sNum) && sNum >= 1 && sNum <= 114 && Number.isFinite(sec) && sec > 0) {
        bySurah[sNum] = Math.round(sec);
      }
    }
  }

  const byReciter: Record<string, number> = {};
  if (raw.byReciter && typeof raw.byReciter === 'object') {
    for (const [k, v] of Object.entries(raw.byReciter)) {
      const label = k.trim();
      const sec = Number(v);
      if (label && Number.isFinite(sec) && sec > 0) {
        byReciter[label] = Math.round(sec);
      }
    }
  }

  const byDay: Record<string, number> = {};
  if (raw.byDay && typeof raw.byDay === 'object') {
    const sortedKeys = Object.keys(raw.byDay)
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort()
      .slice(-60);
    for (const d of sortedKeys) {
      const sec = Number(raw.byDay[d]);
      if (Number.isFinite(sec) && sec > 0) {
        byDay[d] = Math.round(sec);
      }
    }
  }

  const totalSeconds =
    typeof raw.totalSeconds === 'number' && Number.isFinite(raw.totalSeconds) && raw.totalSeconds >= 0
      ? Math.round(raw.totalSeconds)
      : Object.values(byDay).reduce((sum, v) => sum + v, 0);

  const sessionsCount =
    typeof raw.sessionsCount === 'number' && Number.isFinite(raw.sessionsCount) && raw.sessionsCount >= 0
      ? Math.round(raw.sessionsCount)
      : 0;

  return {
    totalSeconds,
    sessionsCount,
    bySurah,
    byReciter,
    byDay,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
  };
}

export function recordListeningTickState(
  prev: ListeningStatsState,
  input: {
    surahNumber?: number;
    reciterLabel?: string;
    seconds: number;
    isNewSession?: boolean;
    dateKey?: string;
    nowIso?: string;
  }
): ListeningStatsState {
  const delta = Math.max(0, Math.round(input.seconds));
  if (delta <= 0 && !input.isNewSession) return prev;

  const dayKey = input.dateKey ?? getLocalDateKey();
  const nextBySurah = { ...prev.bySurah };
  if (
    typeof input.surahNumber === 'number' &&
    Number.isInteger(input.surahNumber) &&
    input.surahNumber >= 1 &&
    input.surahNumber <= 114 &&
    delta > 0
  ) {
    nextBySurah[input.surahNumber] = (nextBySurah[input.surahNumber] ?? 0) + delta;
  }

  const nextByReciter = { ...prev.byReciter };
  const reciter = (input.reciterLabel ?? '').trim();
  if (reciter && delta > 0) {
    nextByReciter[reciter] = (nextByReciter[reciter] ?? 0) + delta;
  }

  const nextByDay = { ...prev.byDay };
  if (delta > 0) {
    nextByDay[dayKey] = (nextByDay[dayKey] ?? 0) + delta;
  }

  return {
    totalSeconds: prev.totalSeconds + delta,
    sessionsCount: prev.sessionsCount + (input.isNewSession ? 1 : 0),
    bySurah: nextBySurah,
    byReciter: nextByReciter,
    byDay: nextByDay,
    updatedAt: input.nowIso ?? new Date().toISOString(),
  };
}

export function formatListeningDurationAz(totalSeconds: number): string {
  const clean = Math.max(0, Math.round(totalSeconds));
  if (clean < 60) return `${clean} san`;
  const hours = Math.floor(clean / 3600);
  const minutes = Math.floor((clean % 3600) / 60);
  if (hours === 0) return `${minutes} dəq`;
  if (minutes === 0) return `${hours} saat`;
  return `${hours} saat ${minutes} dəq`;
}

export function summarizeListeningStats(
  state: ListeningStatsState,
  now = new Date()
): ListeningStatsSummary {
  const todayKey = getLocalDateKey(now);
  const todaySeconds = state.byDay[todayKey] ?? 0;

  let last7DaysSeconds = 0;
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = getLocalDateKey(d);
    last7DaysSeconds += state.byDay[key] ?? 0;
  }

  const totalForShare = Math.max(1, state.totalSeconds);

  const topSurahs = Object.entries(state.bySurah)
    .map(([sKey, sec]) => {
      const surahNumber = Number.parseInt(sKey, 10);
      const surah = getSurahByNumber(surahNumber);
      return {
        surahNumber,
        surahName: surah ? `${surah.number}. ${surah.name}` : `Surə ${surahNumber}`,
        seconds: sec,
        formatted: formatListeningDurationAz(sec),
        sharePercent: Math.min(100, Math.round((sec / totalForShare) * 100)),
      };
    })
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 5);

  const topReciters = Object.entries(state.byReciter)
    .map(([reciterName, sec]) => ({
      reciterName,
      seconds: sec,
      formatted: formatListeningDurationAz(sec),
      sharePercent: Math.min(100, Math.round((sec / totalForShare) * 100)),
    }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 5);

  return {
    totalSeconds: state.totalSeconds,
    formattedTotal: formatListeningDurationAz(state.totalSeconds),
    sessionsCount: state.sessionsCount,
    todaySeconds,
    last7DaysSeconds,
    topSurahs,
    topReciters,
  };
}

export function loadListeningStatsFromStorage(): ListeningStatsState {
  if (typeof window === 'undefined') return { ...EMPTY_LISTENING_STATS };
  try {
    const raw = window.localStorage.getItem(LISTENING_STATS_KEY);
    if (!raw) return { ...EMPTY_LISTENING_STATS };
    return sanitizeListeningStats(JSON.parse(raw));
  } catch {
    return { ...EMPTY_LISTENING_STATS };
  }
}

export function saveListeningStatsToStorage(state: ListeningStatsState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LISTENING_STATS_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(LISTENING_STATS_EVENT));
  } catch {
    // ignore storage errors
  }
}

export function recordListeningProgress(input: {
  surahNumber?: number;
  reciterLabel?: string;
  seconds: number;
  isNewSession?: boolean;
}): void {
  const prev = loadListeningStatsFromStorage();
  const next = recordListeningTickState(prev, input);
  if (next !== prev) {
    saveListeningStatsToStorage(next);
  }
}
