import { useCallback, useEffect, useState } from 'react';
import {
  LAST_READ_EVENT,
  LastReadRecord,
  ReaderTextScale,
  SAVED_AYAHS_EVENT,
  SavedAyahRecord,
  isAyahBookmarked,
  loadLastReadFromStorage,
  loadReaderScaleFromStorage,
  loadSavedAyahsFromStorage,
  persistSavedAyahsToStorage,
  removeSavedAyahItem,
  saveReaderScaleToStorage,
  toggleSavedAyahItem,
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

  const isSaved = useCallback(
    (surahNumber: number, ayahNumber: number) =>
      isAyahBookmarked(savedAyahs, surahNumber, ayahNumber),
    [savedAyahs]
  );

  return {
    savedAyahs,
    toggleAyahBookmark,
    removeAyahBookmark,
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
