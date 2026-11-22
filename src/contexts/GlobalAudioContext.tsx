import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useAudioPlaybackPrefs,
  useAudioSleepTimer,
  useAutoFocusAyah,
} from '../hooks/useReaderPreferences';
import { recordListeningProgress } from '../lib/listeningStats';
import { syncBrowserMediaSession } from '../lib/mediaSession';
import {
  MUHAFFIZ_RECITERS,
  MuhaffizReciterId,
  getEveryAyahAudioUrl,
  getFullSurahAudioUrl,
  resolveMuhaffizReciter,
} from '../lib/muhaffiz';
import { TOTAL_QURAN_SURAHS, getSurahByNumber } from '../lib/quran';
import { AudioPlaybackSpeed, AyahRepeatCount } from '../lib/readerState';
import { SleepTimerMinutes } from '../lib/sleepTimer';

const READER_RECITER_KEY = 'quranqiraeti_reader_reciter_v1';

export interface GlobalAudioQueueItem {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
}

export interface GlobalAudioTrack {
  mode: 'ayah' | 'surah';
  key: string;
  surahNumber: number;
  surahName: string;
  ayahNumber?: number;
  label: string;
  sourcePath: string;
}

interface GlobalAudioContextValue {
  reciter: MuhaffizReciterId;
  reciterLabel: string;
  setReciter: (next: MuhaffizReciterId) => void;
  currentTrack: GlobalAudioTrack | null;
  playingKey: string | null;
  isPlaying: boolean;
  isPaused: boolean;
  isBuffering: boolean;
  audioError: string | null;
  currentTimeSec: number;
  durationSec: number;
  hasPrev: boolean;
  hasNext: boolean;
  playbackSpeed: AudioPlaybackSpeed;
  repeatCount: AyahRepeatCount;
  sleepMinutes: SleepTimerMinutes;
  sleepRemainingSec: number;
  autoFocus: boolean;
  setAutoFocus: (val: boolean) => void;
  setPlaybackSpeed: (speed: AudioPlaybackSpeed) => void;
  setRepeatCount: (count: AyahRepeatCount) => void;
  cycleSpeed: () => void;
  cycleRepeat: () => void;
  cycleSleepMinutes: () => void;
  playAyahQueue: (
    items: GlobalAudioQueueItem[],
    startIndex?: number,
    options?: { sourcePath?: string; onQueueEnd?: () => void }
  ) => void;
  playSingleAyah: (surahNumber: number, ayahNumber: number, sourcePath?: string) => void;
  playFullSurah: (surahNumber: number, sourcePath?: string) => void;
  togglePlayPause: () => void;
  prevTrack: () => void;
  nextTrack: () => void;
  seekToRatio: (ratio: number) => void;
  stop: () => void;
  clearError: () => void;
}

const GlobalAudioContext = createContext<GlobalAudioContextValue | null>(null);

export function GlobalAudioProvider({ children }: { children: ReactNode }) {
  const [reciter, setReciterState] = useState<MuhaffizReciterId>(() => {
    try {
      if (typeof window !== 'undefined') {
        const paramReciter = new URLSearchParams(window.location.search).get('reciter');
        if (paramReciter) {
          return resolveMuhaffizReciter(paramReciter).id;
        }
      }
      const saved = localStorage.getItem(READER_RECITER_KEY);
      if (saved && MUHAFFIZ_RECITERS.some((r) => r.id === saved)) {
        return saved as MuhaffizReciterId;
      }
    } catch {
      // ignore storage errors
    }
    return 'Alafasy_128kbps';
  });

  const { playbackSpeed, setPlaybackSpeed, repeatCount, setRepeatCount } = useAudioPlaybackPrefs();
  const { autoFocus, setAutoFocus } = useAutoFocusAyah();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<GlobalAudioQueueItem[]>([]);
  const queueIndexRef = useRef<number>(-1);
  const onQueueEndRef = useRef<(() => void) | undefined>(undefined);
  const playbackSpeedRef = useRef<AudioPlaybackSpeed>(playbackSpeed);
  const repeatCountRef = useRef<AyahRepeatCount>(repeatCount);
  const reciterRef = useRef<MuhaffizReciterId>(reciter);

  const [currentTrack, setCurrentTrack] = useState<GlobalAudioTrack | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [durationSec, setDurationSec] = useState<number>(0);

  playbackSpeedRef.current = playbackSpeed;
  repeatCountRef.current = repeatCount;
  reciterRef.current = reciter;

  useEffect(() => {
    try {
      localStorage.setItem(READER_RECITER_KEY, reciter);
    } catch {
      // ignore storage errors
    }
  }, [reciter]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.onplaying = null;
      audioRef.current.onwaiting = null;
      audioRef.current = null;
    }
    queueRef.current = [];
    queueIndexRef.current = -1;
    onQueueEndRef.current = undefined;
    setCurrentTrack(null);
    setIsPaused(false);
    setIsBuffering(false);
    setCurrentTimeSec(0);
    setDurationSec(0);
  }, []);

  const { sleepMinutes, remainingSec: sleepRemainingSec, cycleSleepMinutes } = useAudioSleepTimer(stop);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const cleanupAudioElementOnly = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.onplaying = null;
      audioRef.current.onwaiting = null;
      audioRef.current = null;
    }
  }, []);

  const startAyahAtIndex = useCallback(
    (
      index: number,
      remainingRepeats?: number,
      overrideReciter?: MuhaffizReciterId,
      overrideSourcePath?: string
    ) => {
      const list = queueRef.current;
      if (index < 0 || index >= list.length) {
        const endHook = onQueueEndRef.current;
        stop();
        endHook?.();
        return;
      }

      const item = list[index];
      const activeReciter = overrideReciter ?? reciterRef.current;
      const repeatsLeft = remainingRepeats ?? repeatCountRef.current;
      const key = `${item.surahNumber}:${item.ayahNumber}`;
      const srcPath =
        overrideSourcePath || `/quran/sure/${item.surahNumber}#ayah-${item.ayahNumber}`;

      cleanupAudioElementOnly();
      queueIndexRef.current = index;
      setAudioError(null);
      setIsPaused(false);
      setIsBuffering(true);
      setCurrentTimeSec(0);
      setDurationSec(0);
      setCurrentTrack({
        mode: 'ayah',
        key,
        surahNumber: item.surahNumber,
        surahName: item.surahName,
        ayahNumber: item.ayahNumber,
        label: `${item.surahName} · ${item.surahNumber}:${item.ayahNumber}`,
        sourcePath: srcPath,
      });

      const audio = new Audio(getEveryAyahAudioUrl(item.surahNumber, item.ayahNumber, activeReciter));
      audio.playbackRate = playbackSpeedRef.current;
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        if (audioRef.current !== audio) return;
        if (Number.isFinite(audio.duration)) setDurationSec(audio.duration);
      };
      audio.ontimeupdate = () => {
        if (audioRef.current !== audio) return;
        setCurrentTimeSec(audio.currentTime || 0);
        if (Number.isFinite(audio.duration)) setDurationSec(audio.duration);
      };
      audio.onwaiting = () => {
        if (audioRef.current === audio) setIsBuffering(true);
      };
      audio.onplaying = () => {
        if (audioRef.current === audio) {
          setIsBuffering(false);
          setIsPaused(false);
        }
      };
      audio.onended = () => {
        if (audioRef.current !== audio) return;
        if (repeatsLeft === 0) {
          startAyahAtIndex(index, 0, undefined, srcPath);
        } else if (repeatsLeft > 1) {
          startAyahAtIndex(index, repeatsLeft - 1, undefined, srcPath);
        } else if (index + 1 < queueRef.current.length) {
          startAyahAtIndex(index + 1, repeatCountRef.current, undefined, srcPath);
        } else {
          const endHook = onQueueEndRef.current;
          stop();
          endHook?.();
        }
      };
      audio.onerror = () => {
        if (audioRef.current !== audio) return;
        stop();
        setAudioError('Bu ayənin səs faylı hazırda oxuna bilmədi.');
      };

      void audio.play().catch(() => {
        if (audioRef.current !== audio) return;
        setIsBuffering(false);
        setIsPaused(true);
        setAudioError('Səs oxutma brauzer tərəfindən dayandırıldı. Yenidən toxunun.');
      });
    },
    [cleanupAudioElementOnly, stop]
  );

  const playAyahQueue = useCallback(
    (
      items: GlobalAudioQueueItem[],
      startIndex = 0,
      options?: { sourcePath?: string; onQueueEnd?: () => void }
    ) => {
      if (items.length === 0) {
        stop();
        return;
      }
      queueRef.current = items;
      onQueueEndRef.current = options?.onQueueEnd;
      const safeIndex = Math.max(0, Math.min(items.length - 1, startIndex));
      const item = items[safeIndex];
      const sourcePath = options?.sourcePath ?? `/quran/sure/${item.surahNumber}#ayah-${item.ayahNumber}`;
      startAyahAtIndex(safeIndex, repeatCountRef.current, undefined, sourcePath);
    },
    [startAyahAtIndex, stop]
  );

  const playSingleAyah = useCallback(
    (surahNumber: number, ayahNumber: number, sourcePath?: string) => {
      const surah = getSurahByNumber(surahNumber);
      if (!surah) return;
      const clampedAyah = Math.max(1, Math.min(surah.ayahCount, Math.trunc(ayahNumber)));
      const items: GlobalAudioQueueItem[] = Array.from({ length: surah.ayahCount }, (_, idx) => ({
        surahNumber: surah.number,
        surahName: surah.name,
        ayahNumber: idx + 1,
      }));
      playAyahQueue(items, clampedAyah - 1, {
        sourcePath: sourcePath ?? `/quran/sure/${surah.number}#ayah-${clampedAyah}`,
      });
    },
    [playAyahQueue]
  );

  const playFullSurahInternal = useCallback(
    (
      surahNumber: number,
      overrideReciter?: MuhaffizReciterId,
      overrideSourcePath?: string
    ) => {
      const surah = getSurahByNumber(surahNumber);
      if (!surah) return;
      const activeReciter = overrideReciter ?? reciterRef.current;
      const srcPath = overrideSourcePath ?? `/quran/sure/${surah.number}`;

      cleanupAudioElementOnly();
      queueRef.current = [];
      queueIndexRef.current = -1;
      onQueueEndRef.current = undefined;
      setAudioError(null);
      setIsPaused(false);
      setIsBuffering(true);
      setCurrentTimeSec(0);
      setDurationSec(0);
      setCurrentTrack({
        mode: 'surah',
        key: `full-surah:${surah.number}`,
        surahNumber: surah.number,
        surahName: surah.name,
        label: `${surah.number}. ${surah.name} surəsi · Tam tilavət`,
        sourcePath: srcPath,
      });

      const audio = new Audio(getFullSurahAudioUrl(surah.number, activeReciter));
      audio.playbackRate = playbackSpeedRef.current;
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        if (audioRef.current !== audio) return;
        if (Number.isFinite(audio.duration)) setDurationSec(audio.duration);
      };
      audio.ontimeupdate = () => {
        if (audioRef.current !== audio) return;
        setCurrentTimeSec(audio.currentTime || 0);
        if (Number.isFinite(audio.duration)) setDurationSec(audio.duration);
      };
      audio.onwaiting = () => {
        if (audioRef.current === audio) setIsBuffering(true);
      };
      audio.onplaying = () => {
        if (audioRef.current === audio) {
          setIsBuffering(false);
          setIsPaused(false);
        }
      };
      audio.onended = () => {
        if (audioRef.current !== audio) return;
        if (surah.number < TOTAL_QURAN_SURAHS) {
          playFullSurahInternal(surah.number + 1, undefined, `/quran/sure/${surah.number + 1}`);
        } else {
          stop();
        }
      };
      audio.onerror = () => {
        if (audioRef.current !== audio) return;
        stop();
        setAudioError('Bu qari üçün tam surə MP3 faylı hazırda oxuna bilmədi.');
      };

      void audio.play().catch(() => {
        if (audioRef.current !== audio) return;
        setIsBuffering(false);
        setIsPaused(true);
        setAudioError('Səs oxutma brauzer tərəfindən dayandırıldı. Yenidən toxunun.');
      });
    },
    [cleanupAudioElementOnly, stop]
  );

  const playFullSurah = useCallback(
    (surahNumber: number, sourcePath?: string) => {
      playFullSurahInternal(surahNumber, undefined, sourcePath);
    },
    [playFullSurahInternal]
  );

  const setReciter = useCallback(
    (next: MuhaffizReciterId) => {
      setReciterState(next);
      reciterRef.current = next;
      if (!currentTrack) return;
      if (currentTrack.mode === 'surah') {
        playFullSurahInternal(currentTrack.surahNumber, next, currentTrack.sourcePath);
      } else if (queueRef.current.length > 0 && queueIndexRef.current >= 0) {
        startAyahAtIndex(
          queueIndexRef.current,
          repeatCountRef.current,
          next,
          currentTrack.sourcePath
        );
      }
    },
    [currentTrack, playFullSurahInternal, startAyahAtIndex]
  );

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      setAudioError(null);
      setIsPaused(false);
      void audio.play().catch(() => {
        setIsPaused(true);
      });
    } else {
      audio.pause();
      setIsPaused(true);
    }
  }, []);

  const hasPrev = useMemo(() => {
    if (!currentTrack) return false;
    if (currentTrack.mode === 'surah') return currentTrack.surahNumber > 1;
    return queueIndexRef.current > 0;
  }, [currentTrack]);

  const hasNext = useMemo(() => {
    if (!currentTrack) return false;
    if (currentTrack.mode === 'surah') return currentTrack.surahNumber < TOTAL_QURAN_SURAHS;
    return queueIndexRef.current >= 0 && queueIndexRef.current < queueRef.current.length - 1;
  }, [currentTrack]);

  const prevTrack = useCallback(() => {
    if (!currentTrack) return;
    if (currentTrack.mode === 'surah') {
      if (currentTrack.surahNumber > 1) {
        const prevNum = currentTrack.surahNumber - 1;
        playFullSurahInternal(prevNum, undefined, `/quran/sure/${prevNum}`);
      }
      return;
    }
    if (queueIndexRef.current > 0) {
      startAyahAtIndex(queueIndexRef.current - 1, repeatCountRef.current, undefined, currentTrack.sourcePath);
    }
  }, [currentTrack, playFullSurahInternal, startAyahAtIndex]);

  const nextTrack = useCallback(() => {
    if (!currentTrack) return;
    if (currentTrack.mode === 'surah') {
      if (currentTrack.surahNumber < TOTAL_QURAN_SURAHS) {
        const nextNum = currentTrack.surahNumber + 1;
        playFullSurahInternal(nextNum, undefined, `/quran/sure/${nextNum}`);
      }
      return;
    }
    if (queueIndexRef.current >= 0 && queueIndexRef.current < queueRef.current.length - 1) {
      startAyahAtIndex(queueIndexRef.current + 1, repeatCountRef.current, undefined, currentTrack.sourcePath);
    }
  }, [currentTrack, playFullSurahInternal, startAyahAtIndex]);

  const seekToRatio = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    audio.currentTime = clamped * audio.duration;
    setCurrentTimeSec(audio.currentTime);
  }, []);

  const cycleSpeed = useCallback(() => {
    const order: AudioPlaybackSpeed[] = [0.75, 1, 1.25];
    const nextIdx = (order.indexOf(playbackSpeed) + 1) % order.length;
    setPlaybackSpeed(order[nextIdx] ?? 1);
  }, [playbackSpeed, setPlaybackSpeed]);

  const cycleRepeat = useCallback(() => {
    const order: AyahRepeatCount[] = [1, 3, 0];
    const nextIdx = (order.indexOf(repeatCount) + 1) % order.length;
    setRepeatCount(order[nextIdx] ?? 1);
  }, [repeatCount, setRepeatCount]);

  const reciterLabel = useMemo(
    () => MUHAFFIZ_RECITERS.find((r) => r.id === reciter)?.label ?? reciter,
    [reciter]
  );

  // Track listening stats while playing
  const isPlaying = Boolean(currentTrack) && !isPaused;
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;
    recordListeningProgress({
      surahNumber: currentTrack.surahNumber,
      reciterLabel,
      seconds: 0,
      isNewSession: true,
    });
    const timer = window.setInterval(() => {
      recordListeningProgress({
        surahNumber: currentTrack.surahNumber,
        reciterLabel,
        seconds: 5,
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isPlaying, currentTrack, reciterLabel]);

  // Sync browser/OS lock-screen MediaSession controls
  useEffect(() => {
    syncBrowserMediaSession({
      active: Boolean(currentTrack),
      isPaused,
      metadata: currentTrack
        ? {
            title: currentTrack.label,
            artist: reciterLabel,
          }
        : null,
      onPlay: () => {
        if (audioRef.current?.paused) togglePlayPause();
      },
      onPause: () => {
        if (audioRef.current && !audioRef.current.paused) togglePlayPause();
      },
      onStop: stop,
      onPrev: hasPrev ? prevTrack : undefined,
      onNext: hasNext ? nextTrack : undefined,
    });
  }, [currentTrack, isPaused, reciterLabel, hasPrev, hasNext, togglePlayPause, stop, prevTrack, nextTrack]);

  const value: GlobalAudioContextValue = {
    reciter,
    reciterLabel,
    setReciter,
    currentTrack,
    playingKey: currentTrack?.key ?? null,
    isPlaying,
    isPaused,
    isBuffering,
    audioError,
    currentTimeSec,
    durationSec,
    hasPrev,
    hasNext,
    playbackSpeed,
    repeatCount,
    sleepMinutes,
    sleepRemainingSec,
    autoFocus,
    setAutoFocus,
    setPlaybackSpeed,
    setRepeatCount,
    cycleSpeed,
    cycleRepeat,
    cycleSleepMinutes,
    playAyahQueue,
    playSingleAyah,
    playFullSurah,
    togglePlayPause,
    prevTrack,
    nextTrack,
    seekToRatio,
    stop,
    clearError: () => setAudioError(null),
  };

  return <GlobalAudioContext.Provider value={value}>{children}</GlobalAudioContext.Provider>;
}

export function useGlobalAudio(): GlobalAudioContextValue {
  const ctx = useContext(GlobalAudioContext);
  if (!ctx) {
    throw new Error('useGlobalAudio must be used inside GlobalAudioProvider');
  }
  return ctx;
}
