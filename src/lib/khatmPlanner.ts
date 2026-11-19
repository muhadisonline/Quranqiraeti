import { TOTAL_QURAN_PAGES, getJuzForPage } from './quran';
import { formatGregorianAzerbaijani } from './prayerTimes';
import { ReadingGoalState, getLocalDateKey } from './readingGoal';

export type KhatmPlanPresetDays = 15 | 30 | 60;

export interface KhatmPlanConfig {
  enabled: boolean;
  targetDays: number;
  startDateKey: string;
  updatedAt: string | null;
}

export type KhatmPaceStatus = 'completed' | 'ahead' | 'on-track' | 'behind';

export interface KhatmPlanEvaluation {
  completedPages: number;
  remainingPages: number;
  completionPercent: number;
  targetDays: number;
  daysElapsed: number;
  daysRemaining: number;
  baseDailyPages: number;
  rebalancedDailyPages: number;
  expectedPagesByToday: number;
  deltaPages: number;
  paceStatus: KhatmPaceStatus;
  paceLabel: string;
  targetFinishDateKey: string;
  targetFinishLabel: string;
  projectedFinishDateKey: string;
  projectedFinishLabel: string;
  nextUnreadPage: number | null;
  nextUnreadJuz: number | null;
}

export const KHATM_PLAN_PRESETS: KhatmPlanPresetDays[] = [15, 30, 60];
export const KHATM_PLAN_STORAGE_KEY = 'quranqiraeti_khatm_plan_v1';
export const KHATM_PLAN_EVENT = 'quranqiraeti:khatm-plan-changed';

export function createDefaultKhatmPlan(todayKey = getLocalDateKey()): KhatmPlanConfig {
  return {
    enabled: true,
    targetDays: 30,
    startDateKey: todayKey,
    updatedAt: null,
  };
}

export function sanitizeKhatmPlanConfig(
  input: unknown,
  fallbackTodayKey = getLocalDateKey()
): KhatmPlanConfig {
  if (!input || typeof input !== 'object') {
    return createDefaultKhatmPlan(fallbackTodayKey);
  }
  const raw = input as Partial<KhatmPlanConfig>;
  const rawDays = Number(raw.targetDays);
  const targetDays =
    Number.isFinite(rawDays) && rawDays >= 7 && rawDays <= 365
      ? Math.round(rawDays)
      : 30;
  const startDateKey =
    typeof raw.startDateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.startDateKey)
      ? raw.startDateKey
      : fallbackTodayKey;

  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : true,
    targetDays,
    startDateKey,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
  };
}

function parseIsoDateKeyUtc(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map((n) => Number.parseInt(n, 10));
  return new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1));
}

function addDaysIsoDateKey(dateKey: string, deltaDays: number): string {
  const base = parseIsoDateKeyUtc(dateKey);
  const shifted = new Date(base.getTime() + deltaDays * 86_400_000);
  const yy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function formatIsoDateKeyAzerbaijani(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map((n) => Number.parseInt(n, 10));
  return formatGregorianAzerbaijani(y || 2026, m || 1, d || 1);
}

export function diffDaysInclusive(startKey: string, endKey: string): number {
  const start = parseIsoDateKeyUtc(startKey).getTime();
  const end = parseIsoDateKeyUtc(endKey).getTime();
  const diff = Math.floor((end - start) / 86_400_000) + 1;
  return Math.max(1, diff);
}

export function findNextUnreadKhatmPage(khatmPages: number[]): number | null {
  if (khatmPages.length >= TOTAL_QURAN_PAGES) return null;
  const readSet = new Set(khatmPages);
  for (let p = 1; p <= TOTAL_QURAN_PAGES; p++) {
    if (!readSet.has(p)) return p;
  }
  return null;
}

export function evaluateKhatmPlan(
  plan: KhatmPlanConfig,
  readingGoal: ReadingGoalState,
  todayKey = getLocalDateKey()
): KhatmPlanEvaluation {
  const cleanPlan = sanitizeKhatmPlanConfig(plan, todayKey);
  const completedPages = readingGoal.khatmPages.length;
  const remainingPages = Math.max(0, TOTAL_QURAN_PAGES - completedPages);
  const completionPercent = Math.round((completedPages / TOTAL_QURAN_PAGES) * 1000) / 10;

  const daysElapsed = diffDaysInclusive(cleanPlan.startDateKey, todayKey);
  const daysRemaining = Math.max(1, cleanPlan.targetDays - daysElapsed + 1);
  const baseDailyPages = Math.max(1, Math.ceil(TOTAL_QURAN_PAGES / cleanPlan.targetDays));
  const rebalancedDailyPages =
    remainingPages === 0 ? 0 : Math.max(1, Math.ceil(remainingPages / daysRemaining));

  const expectedPagesByToday = Math.min(
    TOTAL_QURAN_PAGES,
    Math.round((TOTAL_QURAN_PAGES / cleanPlan.targetDays) * daysElapsed)
  );
  const deltaPages = completedPages - expectedPagesByToday;

  let paceStatus: KhatmPaceStatus = 'on-track';
  let paceLabel = 'Plana uyğundur';

  if (remainingPages === 0) {
    paceStatus = 'completed';
    paceLabel = 'Xətm tamamlandı!';
  } else if (deltaPages >= 3) {
    paceStatus = 'ahead';
    paceLabel = `Plandan ${deltaPages} səhifə irəlidəsiniz`;
  } else if (deltaPages <= -3) {
    paceStatus = 'behind';
    paceLabel = `Plandan ${Math.abs(deltaPages)} səhifə geridə — gündəlik ${rebalancedDailyPages} səh. tövsiyə olunur`;
  } else {
    paceStatus = 'on-track';
    paceLabel = 'Plan üzrə nizamlı gedirsiniz';
  }

  const targetFinishDateKey = addDaysIsoDateKey(cleanPlan.startDateKey, cleanPlan.targetDays - 1);
  const projectedDaysLeft =
    remainingPages === 0 ? 0 : Math.ceil(remainingPages / Math.max(1, rebalancedDailyPages));
  const projectedFinishDateKey =
    remainingPages === 0 ? todayKey : addDaysIsoDateKey(todayKey, Math.max(0, projectedDaysLeft - 1));

  const nextUnreadPage = findNextUnreadKhatmPage(readingGoal.khatmPages);
  const nextUnreadJuz = nextUnreadPage ? getJuzForPage(nextUnreadPage) : null;

  return {
    completedPages,
    remainingPages,
    completionPercent,
    targetDays: cleanPlan.targetDays,
    daysElapsed,
    daysRemaining,
    baseDailyPages,
    rebalancedDailyPages,
    expectedPagesByToday,
    deltaPages,
    paceStatus,
    paceLabel,
    targetFinishDateKey,
    targetFinishLabel: formatIsoDateKeyAzerbaijani(targetFinishDateKey),
    projectedFinishDateKey,
    projectedFinishLabel: formatIsoDateKeyAzerbaijani(projectedFinishDateKey),
    nextUnreadPage,
    nextUnreadJuz,
  };
}

export function loadKhatmPlanFromStorage(): KhatmPlanConfig {
  if (typeof window === 'undefined') return createDefaultKhatmPlan();
  try {
    const raw = window.localStorage.getItem(KHATM_PLAN_STORAGE_KEY);
    if (!raw) return createDefaultKhatmPlan();
    return sanitizeKhatmPlanConfig(JSON.parse(raw));
  } catch {
    return createDefaultKhatmPlan();
  }
}

export function persistKhatmPlanToStorage(plan: KhatmPlanConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KHATM_PLAN_STORAGE_KEY, JSON.stringify(plan));
    window.dispatchEvent(new CustomEvent(KHATM_PLAN_EVENT));
  } catch {
    // ignore quota error
  }
}
