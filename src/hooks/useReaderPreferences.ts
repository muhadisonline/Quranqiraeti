import { useCallback, useEffect, useRef, useState } from 'react';
import {
  READER_AUTO_FOCUS_KEY,
  SleepTimerMinutes,
  computeSleepRemainingSeconds,
  cycleSleepTimerMinutes,
} from '../lib/sleepTimer';
import {
  EMPTY_HIFZ_PROGRESS,
  HifzProgressState,
  buildHifzReviewQueue,
  sanitizeHifzProgress,
  summarizeHifzProgress,
} from '../lib/hifzProgress';
import { HIFZ_PROGRESS_KEY, MISSED_WORDS_KEY, sanitizeMissedWordList } from '../lib/backup';
import { MissedWordRecord } from '../lib/muhaffiz';
import {
  CustomPrayerCoords,
  PRAYER_CITY_STORAGE_KEY,
  PRAYER_CUSTOM_COORDS_STORAGE_KEY,
  PRAYER_PREFS_EVENT,
  PrayerLocation,
  createCustomCoordinateLocation,
  getCitiesByCountryId,
  getCityById,
} from '../lib/prayerTimes';
import {
  DailyGoalPages,
  READING_GOAL_EVENT,
  ReadingGoalState,
  loadReadingGoalFromStorage,
  persistReadingGoalToStorage,
  recordPageVisitState,
  resetKhatmState,
  setDailyGoalPagesState,
  summarizeReadingGoal,
} from '../lib/readingGoal';
import {
  AudioPlaybackSpeed,
  AyahRepeatCount,
  LAST_READ_EVENT,
  LastReadRecord,
  ReaderDisplayMode,
  ReaderTextScale,
  SAVED_AYAHS_EVENT,
  SavedAyahRecord,
  isAyahBookmarked,
  loadAudioRepeatFromStorage,
  loadAudioSpeedFromStorage,
  loadLastReadFromStorage,
  loadReaderDisplayFromStorage,
  loadReaderScaleFromStorage,
  loadReaderTajweedFromStorage,
  loadReaderTranslitFromStorage,
  loadSavedAyahsFromStorage,
  persistSavedAyahsToStorage,
  removeSavedAyahItem,
  saveAudioRepeatToStorage,
  saveAudioSpeedToStorage,
  saveReaderDisplayToStorage,
  saveReaderScaleToStorage,
  saveReaderTajweedToStorage,
  saveReaderTranslitToStorage,
  toggleSavedAyahItem,
  updateSavedAyahNoteItem,
} from '../lib/readerState';
import { getLocalDateKey } from '../lib/readingGoal';
import {
  KHATM_PLAN_EVENT,
  KhatmPlanConfig,
  createDefaultKhatmPlan,
  evaluateKhatmPlan,
  loadKhatmPlanFromStorage,
  persistKhatmPlanToStorage,
} from '../lib/khatmPlanner';
import {
  WORSHIP_REMINDERS_EVENT,
  WorshipReminderPrefs,
  loadWorshipReminderPrefs,
  saveWorshipReminderPrefs,
} from '../lib/reminders';

export function useSavedAyahs() {
  const [savedAyahs, setSavedAyahs] = useState<SavedAyahRecord[]>(() =>
    loadSavedAyahsFromStorage()
  );

  useEffect(() => {
    function sync() {
      setSavedAyahs(loadSavedAyahsFromStorage());
    }
    window.addEventListener(SAVED_AYAHS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SAVED_AYAHS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggleAyahBookmark = useCallback((entry: Omit<SavedAyahRecord, 'savedAt'>) => {
    setSavedAyahs((prev) => {
      const { next } = toggleSavedAyahItem(prev, entry);
      persistSavedAyahsToStorage(next);
      return next;
    });
  }, []);

  const removeAyahBookmark = useCallback((surahNumber: number, ayahNumber: number) => {
    setSavedAyahs((prev) => {
      const next = removeSavedAyahItem(prev, surahNumber, ayahNumber);
      persistSavedAyahsToStorage(next);
      return next;
    });
  }, []);

  const updateAyahNote = useCallback((surahNumber: number, ayahNumber: number, note: string) => {
    setSavedAyahs((prev) => {
      const next = updateSavedAyahNoteItem(prev, surahNumber, ayahNumber, note);
      persistSavedAyahsToStorage(next);
      return next;
    });
  }, []);

  const isSaved = useCallback(
    (surahNumber: number, ayahNumber: number) =>
      isAyahBookmarked(savedAyahs, surahNumber, ayahNumber),
    [savedAyahs]
  );

  return {
    savedAyahs,
    toggleAyahBookmark,
    removeAyahBookmark,
    updateAyahNote,
    isSaved,
  };
}

export function useLastRead(): LastReadRecord | null {
  const [lastRead, setLastRead] = useState<LastReadRecord | null>(() =>
    loadLastReadFromStorage()
  );

  useEffect(() => {
    function sync() {
      setLastRead(loadLastReadFromStorage());
    }
    window.addEventListener(LAST_READ_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(LAST_READ_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return lastRead;
}

export function useReaderTextScale() {
  const [textScale, setTextScaleState] = useState<ReaderTextScale>(() =>
    loadReaderScaleFromStorage()
  );

  const setTextScale = useCallback((next: ReaderTextScale) => {
    setTextScaleState(next);
    saveReaderScaleToStorage(next);
  }, []);

  return { textScale, setTextScale };
}

export function useReaderDisplayMode() {
  const [displayMode, setDisplayModeState] = useState<ReaderDisplayMode>(() =>
    loadReaderDisplayFromStorage()
  );

  const setDisplayMode = useCallback((next: ReaderDisplayMode) => {
    setDisplayModeState(next);
    saveReaderDisplayToStorage(next);
  }, []);

  return { displayMode, setDisplayMode };
}

export function useReaderTransliteration() {
  const [showTranslit, setShowTranslitState] = useState<boolean>(() =>
    loadReaderTranslitFromStorage()
  );

  const setShowTranslit = useCallback((next: boolean) => {
    setShowTranslitState(next);
    saveReaderTranslitToStorage(next);
  }, []);

  return { showTranslit, setShowTranslit };
}

export function useReaderTajweed() {
  const [showTajweed, setShowTajweedState] = useState<boolean>(() =>
    loadReaderTajweedFromStorage()
  );

  const setShowTajweed = useCallback((next: boolean) => {
    setShowTajweedState(next);
    saveReaderTajweedToStorage(next);
  }, []);

  return { showTajweed, setShowTajweed };
}

export function useAudioPlaybackPrefs() {
  const [playbackSpeed, setPlaybackSpeedState] = useState<AudioPlaybackSpeed>(() =>
    loadAudioSpeedFromStorage()
  );
  const [repeatCount, setRepeatCountState] = useState<AyahRepeatCount>(() =>
    loadAudioRepeatFromStorage()
  );

  const setPlaybackSpeed = useCallback((next: AudioPlaybackSpeed) => {
    setPlaybackSpeedState(next);
    saveAudioSpeedToStorage(next);
  }, []);

  const setRepeatCount = useCallback((next: AyahRepeatCount) => {
    setRepeatCountState(next);
    saveAudioRepeatToStorage(next);
  }, []);

  return {
    playbackSpeed,
    setPlaybackSpeed,
    repeatCount,
    setRepeatCount,
  };
}

export function useReadingGoal() {
  const [goalState, setGoalState] = useState<ReadingGoalState>(() =>
    loadReadingGoalFromStorage()
  );

  useEffect(() => {
    function sync() {
      setGoalState(loadReadingGoalFromStorage());
    }
    window.addEventListener(READING_GOAL_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(READING_GOAL_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const recordPageRead = useCallback((pageNumber: number) => {
    setGoalState((prev) => {
      const next = recordPageVisitState(prev, pageNumber);
      if (next !== prev) {
        persistReadingGoalToStorage(next);
      }
      return next;
    });
  }, []);

  const setDailyGoalPages = useCallback((pages: DailyGoalPages) => {
    setGoalState((prev) => {
      const next = setDailyGoalPagesState(prev, pages);
      persistReadingGoalToStorage(next);
      return next;
    });
  }, []);

  const resetKhatm = useCallback(() => {
    setGoalState((prev) => {
      const next = resetKhatmState(prev);
      persistReadingGoalToStorage(next);
      return next;
    });
  }, []);

  const summary = summarizeReadingGoal(goalState);

  return {
    goalState,
    summary,
    recordPageRead,
    setDailyGoalPages,
    resetKhatm,
  };
}

function loadHifzSnapshot(): {
  progress: HifzProgressState;
  missedWords: MissedWordRecord[];
} {
  try {
    const rawProg = window.localStorage.getItem(HIFZ_PROGRESS_KEY);
    const rawMissed = window.localStorage.getItem(MISSED_WORDS_KEY);
    return {
      progress: rawProg ? sanitizeHifzProgress(JSON.parse(rawProg)) : EMPTY_HIFZ_PROGRESS,
      missedWords: rawMissed ? sanitizeMissedWordList(JSON.parse(rawMissed)) : [],
    };
  } catch {
    return { progress: EMPTY_HIFZ_PROGRESS, missedWords: [] };
  }
}

export function useHifzOverview() {
  const [snapshot, setSnapshot] = useState(() => loadHifzSnapshot());

  useEffect(() => {
    function sync() {
      setSnapshot(loadHifzSnapshot());
    }
    window.addEventListener('storage', sync);
    window.addEventListener(READING_GOAL_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(READING_GOAL_EVENT, sync);
    };
  }, []);

  const summary = summarizeHifzProgress(snapshot.progress);
  const reviewQueue = buildHifzReviewQueue(snapshot.progress, snapshot.missedWords);
  return {
    progress: snapshot.progress,
    missedWords: snapshot.missedWords,
    summary,
    reviewQueue,
  };
}

function loadPrayerLocation(): PrayerLocation {
  try {
    const rawCityId = window.localStorage.getItem(PRAYER_CITY_STORAGE_KEY);
    if (rawCityId === 'custom') {
      const rawCoords = window.localStorage.getItem(PRAYER_CUSTOM_COORDS_STORAGE_KEY);
      if (rawCoords) {
        const parsed = JSON.parse(rawCoords) as Partial<CustomPrayerCoords>;
        if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          return createCustomCoordinateLocation(parsed.lat, parsed.lng);
        }
      }
    }
    return getCityById(rawCityId);
  } catch {
    return getCityById('baku');
  }
}

export function usePrayerPreferences() {
  const [location, setLocationState] = useState<PrayerLocation>(() => loadPrayerLocation());

  useEffect(() => {
    function sync() {
      setLocationState(loadPrayerLocation());
    }
    window.addEventListener(PRAYER_PREFS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(PRAYER_PREFS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setCityId = useCallback((nextId: string) => {
    const nextCity = getCityById(nextId);
    setLocationState(nextCity);
    try {
      window.localStorage.setItem(PRAYER_CITY_STORAGE_KEY, nextCity.id);
      window.localStorage.removeItem(PRAYER_CUSTOM_COORDS_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(PRAYER_PREFS_EVENT));
    } catch {
      // ignore storage errors
    }
  }, []);

  const setCountryId = useCallback(
    (nextCountryId: string) => {
      const firstCity = getCitiesByCountryId(nextCountryId)[0];
      setCityId(firstCity.id);
    },
    [setCityId]
  );

  const setCustomCoordinates = useCallback((lat: number, lng: number) => {
    const nextLoc = createCustomCoordinateLocation(lat, lng);
    setLocationState(nextLoc);
    try {
      window.localStorage.setItem(PRAYER_CITY_STORAGE_KEY, 'custom');
      window.localStorage.setItem(
        PRAYER_CUSTOM_COORDS_STORAGE_KEY,
        JSON.stringify({ lat: nextLoc.lat, lng: nextLoc.lng })
      );
      window.dispatchEvent(new CustomEvent(PRAYER_PREFS_EVENT));
    } catch {
      // ignore storage errors
    }
  }, []);

  return {
    city: location,
    location,
    cityId: location.id,
    countryId: location.countryId,
    setCityId,
    setCountryId,
    setCustomCoordinates,
  };
}

export function useKhatmPlanner(goalState: ReadingGoalState) {
  const [plan, setPlan] = useState<KhatmPlanConfig>(() => loadKhatmPlanFromStorage());

  useEffect(() => {
    function sync() {
      setPlan(loadKhatmPlanFromStorage());
    }
    window.addEventListener(KHATM_PLAN_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(KHATM_PLAN_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setTargetDays = useCallback((days: number) => {
    const safeDays = Math.max(7, Math.min(365, Math.round(days)));
    setPlan((prev) => {
      const next: KhatmPlanConfig = {
        ...prev,
        enabled: true,
        targetDays: safeDays,
        updatedAt: new Date().toISOString(),
      };
      persistKhatmPlanToStorage(next);
      return next;
    });
  }, []);

  const resetStartDateToday = useCallback(() => {
    const todayKey = getLocalDateKey();
    setPlan((prev) => {
      const next: KhatmPlanConfig = {
        ...createDefaultKhatmPlan(todayKey),
        targetDays: prev.targetDays,
        updatedAt: new Date().toISOString(),
      };
      persistKhatmPlanToStorage(next);
      return next;
    });
  }, []);

  const evaluation = evaluateKhatmPlan(plan, goalState);

  return {
    plan,
    evaluation,
    setTargetDays,
    resetStartDateToday,
  };
}

export type BrowserNotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

function getBrowserNotificationPermission(): BrowserNotificationPermissionState {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  return Notification.permission;
}

export function useWorshipReminders() {
  const [prefs, setPrefs] = useState<WorshipReminderPrefs>(() => loadWorshipReminderPrefs());
  const [permission, setPermission] = useState<BrowserNotificationPermissionState>(() =>
    getBrowserNotificationPermission()
  );
  const [noticeMessage, setNoticeMessage] = useState<string>('');

  useEffect(() => {
    function sync() {
      setPrefs(loadWorshipReminderPrefs());
      setPermission(getBrowserNotificationPermission());
    }
    window.addEventListener(WORSHIP_REMINDERS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(WORSHIP_REMINDERS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const updatePrefs = useCallback(
    (updater: (prev: WorshipReminderPrefs) => WorshipReminderPrefs) => {
      setPrefs((prev) => {
        const next = updater(prev);
        saveWorshipReminderPrefs(next);
        return next;
      });
    },
    []
  );

  const togglePref = useCallback(
    (key: keyof WorshipReminderPrefs) => {
      updatePrefs((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    },
    [updatePrefs]
  );

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      setPermission('unsupported');
      setNoticeMessage('Bu brauzer masaüstü bildirişlərini dəstəkləmir; xatırlatmalar səhifə daxilində aktivdir.');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        updatePrefs((prev) => ({ ...prev, browserNotificationsEnabled: true }));
        setNoticeMessage('Brauzer bildirişləri aktivləşdirildi.');
      } else {
        setNoticeMessage('Bildiriş icazəsi verilmədi; səhifədaxili xatırlatmalar aktiv qalır.');
      }
    } catch {
      setNoticeMessage('Bildiriş sorğusu zamanı xəta baş verdi.');
    }
  }, [updatePrefs]);

  const sendTestNotification = useCallback(() => {
    if (typeof window !== 'undefined' && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('Quran Qiraeti — Xatırlatma Sınağı', {
          body: 'Cümə (Kəhf surəsi), Səhər-Axşam Zikri və Namaz öncəsi xatırlatmalar aktivdir.',
        });
        setNoticeMessage('Sınaq bildirişi brauzerə göndərildi!');
        return;
      } catch {
        // fallback below
      }
    }
    setNoticeMessage('Sınaq uğurludur: Xatırlatma bildirişi səhifə daxilində hazırdır (brauzer bildirişi üçün icazə düyməsindən istifadə edə bilərsiniz).');
  }, []);

  return {
    prefs,
    permission,
    noticeMessage,
    togglePref,
    updatePrefs,
    requestPermission,
    sendTestNotification,
  };
}

export function useAutoFocusAyah() {
  const [autoFocus, setAutoFocusState] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem(READER_AUTO_FOCUS_KEY);
      if (saved === 'false') return false;
      return true;
    } catch {
      return true;
    }
  });

  const setAutoFocus = useCallback((next: boolean) => {
    setAutoFocusState(next);
    try {
      window.localStorage.setItem(READER_AUTO_FOCUS_KEY, next ? 'true' : 'false');
    } catch {
      // ignore storage errors
    }
  }, []);

  return { autoFocus, setAutoFocus };
}

export function useAudioSleepTimer(onExpire: () => void) {
  const [sleepMinutes, setSleepMinutesState] = useState<SleepTimerMinutes>(0);
  const [endsAtMs, setEndsAtMs] = useState<number | null>(null);
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const setSleepMinutes = useCallback((minutes: SleepTimerMinutes) => {
    setSleepMinutesState(minutes);
    if (minutes === 0) {
      setEndsAtMs(null);
      setRemainingSec(0);
    } else {
      const targetMs = Date.now() + minutes * 60 * 1000;
      setEndsAtMs(targetMs);
      setRemainingSec(minutes * 60);
    }
  }, []);

  const cycleSleepMinutes = useCallback(() => {
    setSleepMinutesState((prev) => {
      const next = cycleSleepTimerMinutes(prev);
      if (next === 0) {
        setEndsAtMs(null);
        setRemainingSec(0);
      } else {
        setEndsAtMs(Date.now() + next * 60 * 1000);
        setRemainingSec(next * 60);
      }
      return next;
    });
  }, []);

  const clearSleepTimer = useCallback(() => {
    setSleepMinutesState(0);
    setEndsAtMs(null);
    setRemainingSec(0);
  }, []);

  useEffect(() => {
    if (endsAtMs === null) return;
    const tick = () => {
      const rem = computeSleepRemainingSeconds(endsAtMs, Date.now());
      setRemainingSec(rem);
      if (rem <= 0) {
        setEndsAtMs(null);
        setSleepMinutesState(0);
        onExpireRef.current();
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [endsAtMs]);

  return {
    sleepMinutes,
    remainingSec,
    setSleepMinutes,
    cycleSleepMinutes,
    clearSleepTimer,
  };
}
