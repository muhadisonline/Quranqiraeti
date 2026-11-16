import { TOTAL_QURAN_PAGES } from './quran';

export type DailyGoalPages = 2 | 4 | 10 | 20;

export interface ReadingGoalState {
  dailyGoalPages: DailyGoalPages;
  visitedByDate: Record<string, number[]>;
  khatmPages: number[];
  updatedAt: string | null;
}

export const READING_GOAL_STORAGE_KEY = 'quranqiraeti_reading_goal_v1';
export const READING_GOAL_EVENT = 'quranqiraeti:reading-goal-changed';

export const EMPTY_READING_GOAL: ReadingGoalState = {
  dailyGoalPages: 4,
  visitedByDate: {},
  khatmPages: [],
  updatedAt: null,
};

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidGoalPages(value: unknown): value is DailyGoalPages {
  return value === 2 || value === 4 || value === 10 || value === 20;
}

function sanitizePageArray(input: unknown): number[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<number>();
  for (const raw of input) {
    const num = Number(raw);
    if (Number.isInteger(num) && num >= 1 && num <= TOTAL_QURAN_PAGES) {
      seen.add(num);
    }
  }
  return Array.from(seen).sort((a, b) => a - b);
}

export function sanitizeReadingGoalState(input: unknown): ReadingGoalState {
  if (!input || typeof input !== 'object') {
    return { ...EMPTY_READING_GOAL, visitedByDate: {}, khatmPages: [] };
  }
  const raw = input as Partial<ReadingGoalState>;
  const visitedByDate: Record<string, number[]> = {};
  if (raw.visitedByDate && typeof raw.visitedByDate === 'object') {
    const entries = Object.entries(raw.visitedByDate)
      .filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key))
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 60);
    for (const [dateKey, list] of entries) {
      const cleanPages = sanitizePageArray(list);
      if (cleanPages.length > 0) {
        visitedByDate[dateKey] = cleanPages;
      }
    }
  }

  return {
    dailyGoalPages: isValidGoalPages(raw.dailyGoalPages) ? raw.dailyGoalPages : 4,
    visitedByDate,
    khatmPages: sanitizePageArray(raw.khatmPages),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
  };
}

export function recordPageVisitState(
  state: ReadingGoalState,
  pageNumber: number,
  dateKey = getLocalDateKey(),
  nowIso = new Date().toISOString()
): ReadingGoalState {
  const page = Math.floor(pageNumber);
  if (!Number.isFinite(page) || page < 1 || page > TOTAL_QURAN_PAGES) {
    return state;
  }

  const prevDatePages = state.visitedByDate[dateKey] ?? [];
  const hasToday = prevDatePages.includes(page);
  const hasKhatm = state.khatmPages.includes(page);
  if (hasToday && hasKhatm) {
    return state;
  }

  const nextVisited = {
    ...state.visitedByDate,
    [dateKey]: hasToday ? prevDatePages : [...prevDatePages, page].sort((a, b) => a - b),
  };
  const nextKhatm = hasKhatm
    ? state.khatmPages
    : [...state.khatmPages, page].sort((a, b) => a - b);

  return sanitizeReadingGoalState({
    ...state,
    visitedByDate: nextVisited,
    khatmPages: nextKhatm,
    updatedAt: nowIso,
  });
}

export function setDailyGoalPagesState(
  state: ReadingGoalState,
  goalPages: DailyGoalPages,
  nowIso = new Date().toISOString()
): ReadingGoalState {
  return {
    ...state,
    dailyGoalPages: goalPages,
    updatedAt: nowIso,
  };
}

export function resetKhatmState(
  state: ReadingGoalState,
  nowIso = new Date().toISOString()
): ReadingGoalState {
  return {
    ...state,
    khatmPages: [],
    updatedAt: nowIso,
  };
}

function shiftIsoDate(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map((n) => Number.parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function calculateReadingStreakDays(
  state: ReadingGoalState,
  todayKey = getLocalDateKey()
): number {
  const todayPages = state.visitedByDate[todayKey]?.length ?? 0;
  let cursor = todayPages > 0 ? todayKey : shiftIsoDate(todayKey, -1);
  let streak = 0;

  while ((state.visitedByDate[cursor]?.length ?? 0) > 0) {
    streak += 1;
    cursor = shiftIsoDate(cursor, -1);
  }
  return streak;
}

export interface ReadingGoalSummary {
  todayCount: number;
  goalPages: DailyGoalPages;
  todayPercent: number;
  streakDays: number;
  khatmCount: number;
  khatmPercent: number;
  remainingPages: number;
  estimatedDaysLeft: number;
}

export function summarizeReadingGoal(
  state: ReadingGoalState,
  todayKey = getLocalDateKey()
): ReadingGoalSummary {
  const todayCount = state.visitedByDate[todayKey]?.length ?? 0;
  const goalPages = state.dailyGoalPages;
  const todayPercent = Math.min(100, Math.round((todayCount / goalPages) * 100));
  const streakDays = calculateReadingStreakDays(state, todayKey);
  const khatmCount = state.khatmPages.length;
  const khatmPercent = Math.round((khatmCount / TOTAL_QURAN_PAGES) * 1000) / 10;
  const remainingPages = Math.max(0, TOTAL_QURAN_PAGES - khatmCount);
  const estimatedDaysLeft = remainingPages === 0 ? 0 : Math.ceil(remainingPages / goalPages);

  return {
    todayCount,
    goalPages,
    todayPercent,
    streakDays,
    khatmCount,
    khatmPercent,
    remainingPages,
    estimatedDaysLeft,
  };
}

export function loadReadingGoalFromStorage(): ReadingGoalState {
  try {
    const raw = localStorage.getItem(READING_GOAL_STORAGE_KEY);
    if (!raw) return EMPTY_READING_GOAL;
    return sanitizeReadingGoalState(JSON.parse(raw));
  } catch {
    return EMPTY_READING_GOAL;
  }
}

export function persistReadingGoalToStorage(state: ReadingGoalState): void {
  try {
    localStorage.setItem(READING_GOAL_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(READING_GOAL_EVENT));
  } catch {
    // ignore storage errors
  }
}
