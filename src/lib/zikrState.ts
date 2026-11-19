export const ZIKR_STATE_STORAGE_KEY = 'quranqiraeti_zikr_state_v1';

export type NamazTasbihatStage = 0 | 1 | 2;

export interface ZikrTrackerState {
  activePresetId: string;
  tasbihCount: number;
  tasbihTarget: number; // 0 = unlimited
  namazSequenceMode: boolean;
  namazStage: NamazTasbihatStage; // 0: Subhanallah (33), 1: Alhamdulillah (33), 2: Allahu Akbar (34)
  completedCycles: number;
  todayTotal: number;
  todayDateKey: string;
  itemCounts: Record<string, number>;
}

export function getTodayAzDateKey(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + 4 * 3600 * 1000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createEmptyZikrState(now: Date = new Date()): ZikrTrackerState {
  return {
    activePresetId: 'subhanallah',
    tasbihCount: 0,
    tasbihTarget: 33,
    namazSequenceMode: false,
    namazStage: 0,
    completedCycles: 0,
    todayTotal: 0,
    todayDateKey: getTodayAzDateKey(now),
    itemCounts: {},
  };
}

export function sanitizeZikrState(raw: unknown, now: Date = new Date()): ZikrTrackerState {
  const todayKey = getTodayAzDateKey(now);
  const fallback = createEmptyZikrState(now);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fallback;

  const obj = raw as Partial<ZikrTrackerState>;
  const isSameDay = typeof obj.todayDateKey === 'string' && obj.todayDateKey === todayKey;

  const cleanItemCounts: Record<string, number> = {};
  if (isSameDay && obj.itemCounts && typeof obj.itemCounts === 'object') {
    for (const [k, v] of Object.entries(obj.itemCounts)) {
      if (typeof k === 'string' && typeof v === 'number' && Number.isFinite(v) && v > 0) {
        cleanItemCounts[k] = Math.min(1000, Math.floor(v));
      }
    }
  }

  const target =
    typeof obj.tasbihTarget === 'number' && [0, 33, 99, 100].includes(obj.tasbihTarget)
      ? obj.tasbihTarget
      : 33;

  const stage: NamazTasbihatStage =
    obj.namazStage === 1 ? 1 : obj.namazStage === 2 ? 2 : 0;

  return {
    activePresetId:
      typeof obj.activePresetId === 'string' && obj.activePresetId.trim()
        ? obj.activePresetId.trim()
        : 'subhanallah',
    tasbihCount:
      typeof obj.tasbihCount === 'number' && Number.isFinite(obj.tasbihCount) && obj.tasbihCount >= 0
        ? Math.floor(obj.tasbihCount)
        : 0,
    tasbihTarget: target,
    namazSequenceMode: Boolean(obj.namazSequenceMode),
    namazStage: stage,
    completedCycles:
      typeof obj.completedCycles === 'number' &&
      Number.isFinite(obj.completedCycles) &&
      obj.completedCycles >= 0
        ? Math.floor(obj.completedCycles)
        : 0,
    todayTotal:
      isSameDay &&
      typeof obj.todayTotal === 'number' &&
      Number.isFinite(obj.todayTotal) &&
      obj.todayTotal >= 0
        ? Math.floor(obj.todayTotal)
        : 0,
    todayDateKey: todayKey,
    itemCounts: cleanItemCounts,
  };
}

export function getNamazStageMeta(stage: NamazTasbihatStage): {
  presetId: string;
  target: number;
  label: string;
} {
  if (stage === 0) return { presetId: 'subhanallah', target: 33, label: 'Sübhanəllah (33)' };
  if (stage === 1) return { presetId: 'alhamdulillah', target: 33, label: 'Əlhəmdülillah (33)' };
  return { presetId: 'allahuakbar', target: 34, label: 'Allahu Əkbər (34)' };
}

export function incrementTasbihStep(
  state: ZikrTrackerState,
  now: Date = new Date()
): { nextState: ZikrTrackerState; cycleCompleted: boolean } {
  const normalized = sanitizeZikrState(state, now);
  const nextCount = normalized.tasbihCount + 1;
  const nextTodayTotal = normalized.todayTotal + 1;

  if (normalized.namazSequenceMode) {
    const stageMeta = getNamazStageMeta(normalized.namazStage);
    if (nextCount >= stageMeta.target) {
      if (normalized.namazStage < 2) {
        const nextStage = (normalized.namazStage + 1) as NamazTasbihatStage;
        const nextMeta = getNamazStageMeta(nextStage);
        return {
          cycleCompleted: false,
          nextState: {
            ...normalized,
            tasbihCount: 0,
            namazStage: nextStage,
            activePresetId: nextMeta.presetId,
            tasbihTarget: nextMeta.target,
            todayTotal: nextTodayTotal,
          },
        };
      }
      // Finished stage 2 (Allahu Akbar 34) -> full 100 Tasbihat cycle completed!
      const startMeta = getNamazStageMeta(0);
      return {
        cycleCompleted: true,
        nextState: {
          ...normalized,
          tasbihCount: 0,
          namazStage: 0,
          activePresetId: startMeta.presetId,
          tasbihTarget: startMeta.target,
          completedCycles: normalized.completedCycles + 1,
          todayTotal: nextTodayTotal,
        },
      };
    }
    return {
      cycleCompleted: false,
      nextState: {
        ...normalized,
        tasbihCount: nextCount,
        todayTotal: nextTodayTotal,
      },
    };
  }

  if (normalized.tasbihTarget > 0 && nextCount >= normalized.tasbihTarget) {
    return {
      cycleCompleted: true,
      nextState: {
        ...normalized,
        tasbihCount: 0,
        completedCycles: normalized.completedCycles + 1,
        todayTotal: nextTodayTotal,
      },
    };
  }

  return {
    cycleCompleted: false,
    nextState: {
      ...normalized,
      tasbihCount: nextCount,
      todayTotal: nextTodayTotal,
    },
  };
}

export function decrementTasbihStep(
  state: ZikrTrackerState,
  now: Date = new Date()
): ZikrTrackerState {
  const normalized = sanitizeZikrState(state, now);
  if (normalized.tasbihCount <= 0) return normalized;
  return {
    ...normalized,
    tasbihCount: normalized.tasbihCount - 1,
    todayTotal: Math.max(0, normalized.todayTotal - 1),
  };
}

export function incrementAzkarItemStep(
  state: ZikrTrackerState,
  itemId: string,
  now: Date = new Date()
): ZikrTrackerState {
  const normalized = sanitizeZikrState(state, now);
  const prev = normalized.itemCounts[itemId] ?? 0;
  return {
    ...normalized,
    todayTotal: normalized.todayTotal + 1,
    itemCounts: {
      ...normalized.itemCounts,
      [itemId]: prev + 1,
    },
  };
}

export function loadZikrStateFromStorage(now: Date = new Date()): ZikrTrackerState {
  if (typeof window === 'undefined') return createEmptyZikrState(now);
  try {
    const raw = window.localStorage.getItem(ZIKR_STATE_STORAGE_KEY);
    return sanitizeZikrState(raw ? JSON.parse(raw) : null, now);
  } catch {
    return createEmptyZikrState(now);
  }
}

export function saveZikrStateToStorage(state: ZikrTrackerState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ZIKR_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}
