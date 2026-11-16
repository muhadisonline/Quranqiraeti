import { useCallback, useEffect, useState } from 'react';
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
  loadSavedAyahsFromStorage,
  persistSavedAyahsToStorage,
  removeSavedAyahItem,
  saveAudioRepeatToStorage,
  saveAudioSpeedToStorage,
  saveReaderDisplayToStorage,
  saveReaderScaleToStorage,
  toggleSavedAyahItem,
  updateSavedAyahNoteItem,
} from '../lib/readerState';

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
