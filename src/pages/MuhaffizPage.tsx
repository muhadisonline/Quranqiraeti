import {
  AudioLines,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Flag,
  Menu,
  Mic,
  MicOff,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SeoHead } from '../components/SeoHead';
import { MuhaffizIndexOverlay } from '../components/muhaffiz/MuhaffizIndexOverlay';
import { MuhaffizSelfRecordPanel } from '../components/muhaffiz/MuhaffizSelfRecordPanel';
import { MuhaffizSettingsSheet } from '../components/muhaffiz/MuhaffizSettingsSheet';
import { useAudioPlaybackPrefs, useReadingGoal } from '../hooks/useReaderPreferences';
import {
  EMPTY_HIFZ_PROGRESS,
  HifzProgressState,
  getHifzPageRepetitions,
  getHifzPageStatus,
  incrementHifzRepetition,
  sanitizeHifzProgress,
  setHifzPageStatus,
  summarizeHifzProgress,
  summarizeJuzHifzProgress,
  toggleHifzBookmark,
} from '../lib/hifzProgress';
import {
  DEFAULT_MUHAFFIZ_PREFS,
  FATIHAT_PAGE_1_MUHAFFIZ_SEED,
  MUHAFFIZ_RECITERS,
  MUHAFFIZ_SILENT_SPEEDS,
  MUHAFFIZ_THEME_PALETTES,
  MuhaffizFontSize,
  MuhaffizPageData,
  MuhaffizPreferences,
  MissedWordRecord,
  UTHMANIC_HAFS_FONT_URL,
  ayahKey,
  clampMuhaffizPage,
  getEveryAyahAudioUrl,
  getNextPlaybackAyahStep,
  getQcfV2FontUrl,
  getSurahBannerGlyphs,
  groupPageAyahsBySurah,
  hideLastStep,
  isAyahRevealed,
  matchSpokenArabicAgainstTokens,
  orderedWordTokens,
  revealEntireAyahTokens,
  revealNextStep,
  toArabicIndicDigits,
  toggleEntireAyahTokens,
  toggleMissedWordRecord,
  toggleWordToken,
} from '../lib/muhaffiz';
import { fetchMuhaffizPageWithFallback } from '../lib/quranClient';
import { TOTAL_QURAN_PAGES } from '../lib/quran';
import { buildBreadcrumbJsonLd } from '../lib/seo';

interface MuhaffizPageProps {
  initialPageNumber?: number;
  isDark: boolean;
  onNavigate: (path: string) => void;
  onToggleTheme: () => void;
}

const PREFS_STORAGE_KEY = 'quranqiraeti_muhaffiz_prefs_v3';
const LAST_PAGE_STORAGE_KEY = 'quranqiraeti_muhaffiz_last_page_v1';
const HIFZ_PROGRESS_STORAGE_KEY = 'quranqiraeti_hifz_progress_v1';
const MISSED_WORDS_STORAGE_KEY = 'quranqiraeti_missed_words_v1';

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionResultEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function loadHifzProgress(): HifzProgressState {
  try {
    const raw = localStorage.getItem(HIFZ_PROGRESS_STORAGE_KEY);
    if (!raw) return EMPTY_HIFZ_PROGRESS;
    return sanitizeHifzProgress(JSON.parse(raw));
  } catch {
    return EMPTY_HIFZ_PROGRESS;
  }
}

function loadPrefs(fallbackDark: boolean): MuhaffizPreferences {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) {
      return {
        ...DEFAULT_MUHAFFIZ_PREFS,
        paperTheme: fallbackDark ? 'black' : 'cream',
      };
    }
    const parsed = JSON.parse(raw) as Partial<MuhaffizPreferences>;
    return {
      ...DEFAULT_MUHAFFIZ_PREFS,
      ...parsed,
      revealMode: parsed.revealMode === 'ayah' ? 'ayah' : 'word',
      paperTheme:
        parsed.paperTheme === 'white' || parsed.paperTheme === 'black' || parsed.paperTheme === 'cream'
          ? parsed.paperTheme
          : fallbackDark
            ? 'black'
            : 'cream',
    };
  } catch {
    return {
      ...DEFAULT_MUHAFFIZ_PREFS,
      paperTheme: fallbackDark ? 'black' : 'cream',
    };
  }
}

function loadMissedWords(): MissedWordRecord[] {
  try {
    const raw = localStorage.getItem(MISSED_WORDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 80) : [];
  } catch {
    return [];
  }
}

function getInitialPage(initialPageNumber?: number): number {
  if (initialPageNumber !== undefined && Number.isFinite(initialPageNumber)) {
    return clampMuhaffizPage(initialPageNumber);
  }
  try {
    const saved = Number.parseInt(localStorage.getItem(LAST_PAGE_STORAGE_KEY) || '1', 10);
    if (Number.isFinite(saved)) return clampMuhaffizPage(saved);
  } catch {
    // ignore storage error
  }
  return 1;
}

export function MuhaffizPage({
  initialPageNumber,
  isDark,
  onNavigate,
}: MuhaffizPageProps) {
  const [pageNumber, setPageNumber] = useState<number>(() => getInitialPage(initialPageNumber));
  const [pageData, setPageData] = useState<MuhaffizPageData | null>(() =>
    getInitialPage(initialPageNumber) === 1 ? FATIHAT_PAGE_1_MUHAFFIZ_SEED : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(getInitialPage(initialPageNumber) !== 1);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fonts: UthmanicHafs1 + MushafSurahNames (sura_names.woff2) + per-page QCF
  const loadedQcfPagesRef = useRef<Set<number>>(new Set());
  const [qcfReadyPage, setQcfReadyPage] = useState<number | null>(null);
  const [hafsHeaderReady, setHafsHeaderReady] = useState<boolean>(false);
  const [surahNamesFontReady, setSurahNamesFontReady] = useState<boolean>(false);

  const [prefs, setPrefs] = useState<MuhaffizPreferences>(() => loadPrefs(isDark));
  const [hifzProgress, setHifzProgress] = useState<HifzProgressState>(() => loadHifzProgress());
  const [missedWords, setMissedWords] = useState<MissedWordRecord[]>(() => loadMissedWords());
  const [revealedTokenIds, setRevealedTokenIds] = useState<Set<string>>(() => new Set());
  const [lastRevealedTokenId, setLastRevealedTokenId] = useState<string | null>(null);

  const [isAutoRevealing, setIsAutoRevealing] = useState(false);
  const [speedPopOpen, setSpeedPopOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [mistakesOpen, setMistakesOpen] = useState(false);
  const [selfRecordOpen, setSelfRecordOpen] = useState(false);

  // Qari Audio playback state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Live Arabic Microphone recitation recognition
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const speechCursorRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isMicListening, setIsMicListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  // Hifz Ayah-Range Loop (per page)
  const [rangeStartIdx, setRangeStartIdx] = useState<number>(0);
  const [rangeEndIdx, setRangeEndIdx] = useState<number>(6);
  const [loopRangeActive, setLoopRangeActive] = useState<boolean>(false);

  const { playbackSpeed, setPlaybackSpeed, repeatCount, setRepeatCount } = useAudioPlaybackPrefs();
  const { recordPageRead } = useReadingGoal();

  const palette = MUHAFFIZ_THEME_PALETTES[prefs.paperTheme];

  // Load UthmanicHafs1 + sura_names.woff2 once
  useEffect(() => {
    let cancelled = false;
    if (typeof FontFace === 'undefined' || !document.fonts) return;

    const hafsFace = new FontFace('UthmanicHafs1', `url(${UTHMANIC_HAFS_FONT_URL})`, {
      display: 'swap',
    });
    hafsFace
      .load()
      .then((loaded) => {
        if (cancelled) return;
        document.fonts.add(loaded);
        setHafsHeaderReady(true);
      })
      .catch(() => {});

    const surahNamesFace = new FontFace(
      'MushafSurahNames',
      'url(/muhaffiz/sura_names.woff2)',
      { display: 'swap' }
    );
    surahNamesFace
      .load()
      .then((loaded) => {
        if (cancelled) return;
        document.fonts.add(loaded);
        setSurahNamesFontReady(true);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Load per-page King Fahd Complex QCF glyph font
  useEffect(() => {
    let cancelled = false;
    if (typeof FontFace === 'undefined' || !document.fonts) return;

    const loadPageFont = async (targetPage: number): Promise<boolean> => {
      if (loadedQcfPagesRef.current.has(targetPage)) return true;
      try {
        const face = new FontFace(
          `QcfV1Page_${targetPage}`,
          `url(${getQcfV2FontUrl(targetPage)})`,
          { display: 'block' }
        );
        const loaded = await face.load();
        document.fonts.add(loaded);
        loadedQcfPagesRef.current.add(targetPage);
        return true;
      } catch {
        return false;
      }
    };

    if (loadedQcfPagesRef.current.has(pageNumber)) {
      setQcfReadyPage(pageNumber);
    } else {
      loadPageFont(pageNumber).then((ok) => {
        if (!cancelled && ok) {
          setQcfReadyPage(pageNumber);
          if (pageNumber < TOTAL_QURAN_PAGES) {
            void loadPageFont(pageNumber + 1);
          }
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [pageNumber]);

  useEffect(() => {
    if (initialPageNumber !== undefined && Number.isFinite(initialPageNumber)) {
      const clamped = clampMuhaffizPage(initialPageNumber);
      setPageNumber(clamped);
    }
  }, [initialPageNumber]);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [prefs]);

  useEffect(() => {
    try {
      localStorage.setItem(HIFZ_PROGRESS_STORAGE_KEY, JSON.stringify(hifzProgress));
    } catch {
      // ignore
    }
  }, [hifzProgress]);

  useEffect(() => {
    try {
      localStorage.setItem(MISSED_WORDS_STORAGE_KEY, JSON.stringify(missedWords));
    } catch {
      // ignore
    }
  }, [missedWords]);

  useEffect(() => {
    try {
      localStorage.setItem(LAST_PAGE_STORAGE_KEY, String(pageNumber));
    } catch {
      // ignore
    }
    recordPageRead(pageNumber);
  }, [pageNumber, recordPageRead]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    setPlayingKey(null);
  }, []);

  const stopMic = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsMicListening(false);
    setLiveTranscript('');
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const prevPageRef = useRef<number>(pageNumber);

  useEffect(() => {
    const controller = new AbortController();
    const isPageChange = prevPageRef.current !== pageNumber;
    prevPageRef.current = pageNumber;

    stopAudio();
    stopMic();
    setIsAutoRevealing(false);
    setSpeedPopOpen(false);
    setStatusMessage(null);
    setLoadError(null);
    speechCursorRef.current = 0;

    if (isPageChange) {
      setLastRevealedTokenId(null);
      setRevealedTokenIds(new Set());
      setLoopRangeActive(false);
      setRangeStartIdx(0);
    }

    if (pageNumber === 1) {
      setPageData(FATIHAT_PAGE_1_MUHAFFIZ_SEED);
      if (isPageChange) {
        setRangeEndIdx(Math.max(0, FATIHAT_PAGE_1_MUHAFFIZ_SEED.ayahs.length - 1));
      }
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    fetchMuhaffizPageWithFallback(pageNumber, controller.signal)
      .then((payload) => {
        setPageData(payload);
        if (isPageChange || pageNumber !== 1) {
          setRangeEndIdx(Math.max(0, payload.ayahs.length - 1));
        }
        const tokens = orderedWordTokens(payload.rows);
        setRevealedTokenIds((prev) => {
          if (!prefs.silentMode) return new Set(tokens.map((t) => t.id));
          return isPageChange ? new Set() : prev;
        });
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (pageNumber === 1) {
          setPageData(FATIHAT_PAGE_1_MUHAFFIZ_SEED);
          const seedTokens = orderedWordTokens(FATIHAT_PAGE_1_MUHAFFIZ_SEED.rows);
          setRevealedTokenIds((prev) => {
            if (!prefs.silentMode) return new Set(seedTokens.map((t) => t.id));
            return isPageChange ? new Set() : prev;
          });
        } else {
          setLoadError('Mushaf səhifəsi yüklənərkən xəta baş verdi. Yenidən cəhd edin.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [pageNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      stopAudio();
      stopMic();
    };
  }, [stopAudio, stopMic]);

  const ayahs = useMemo(() => pageData?.ayahs ?? [], [pageData]);
  const wordTokens = useMemo(() => orderedWordTokens(pageData?.rows ?? []), [pageData]);
  const surahGroups = useMemo(() => groupPageAyahsBySurah(ayahs), [ayahs]);

  const cleanSurahTitle = (raw: string) => raw.replace(/\s+surəsi$/i, '').trim();
  const primarySurahName =
    surahGroups[0]?.surahName ?? pageData?.surahsOnPage[0]?.surahName ?? 'Fatihə';

  const revealedWordCount = useMemo(
    () => wordTokens.filter((t) => revealedTokenIds.has(t.id)).length,
    [wordTokens, revealedTokenIds]
  );
  const revealedAyahCount = useMemo(
    () => ayahs.filter((a) => isAyahRevealed(ayahKey(a), wordTokens, revealedTokenIds)).length,
    [ayahs, wordTokens, revealedTokenIds]
  );
  const allRevealed = wordTokens.length > 0 && revealedWordCount === wordTokens.length;

  const hifzSummary = useMemo(() => summarizeHifzProgress(hifzProgress), [hifzProgress]);
  const juzHifzSummary = useMemo(() => summarizeJuzHifzProgress(hifzProgress), [hifzProgress]);
  const currentPageHifzStatus = getHifzPageStatus(hifzProgress, pageNumber);
  const currentPageRepetitions = getHifzPageRepetitions(hifzProgress, pageNumber);
  const isCurrentPageBookmarked = hifzProgress.bookmarkedPage === pageNumber;
  const pageAyahKeys = useMemo(() => ayahs.map((a) => ayahKey(a)), [ayahs]);

  const handleRevealNext = useCallback(() => {
    setRevealedTokenIds((prev) => {
      const next = revealNextStep(prefs.revealMode, ayahs, wordTokens, prev);
      if (next !== prev) {
        const added = wordTokens.filter((t) => !prev.has(t.id) && next.has(t.id));
        if (added.length > 0) setLastRevealedTokenId(added[added.length - 1].id);
      }
      return next;
    });
  }, [prefs.revealMode, ayahs, wordTokens]);

  const handleHideLast = useCallback(() => {
    setRevealedTokenIds((prev) => {
      const next = hideLastStep(prefs.revealMode, ayahs, wordTokens, prev);
      setLastRevealedTokenId(null);
      return next;
    });
  }, [prefs.revealMode, ayahs, wordTokens]);

  const handleToggleSilentMode = useCallback(() => {
    setIsAutoRevealing(false);
    setSpeedPopOpen(false);
    setPrefs((prev) => {
      const nextSilent = !prev.silentMode;
      setRevealedTokenIds(nextSilent ? new Set() : new Set(wordTokens.map((t) => t.id)));
      setLastRevealedTokenId(null);
      speechCursorRef.current = 0;
      return {
        ...prev,
        silentMode: nextSilent,
        autoRevealAllOnLoad: !nextSilent,
      };
    });
  }, [wordTokens]);

  // Auto-reveal interval synced to silentSpeedSec (0.5s .. 5s)
  useEffect(() => {
    if (!isAutoRevealing || wordTokens.length === 0) return;
    const ms = Math.max(400, Math.round(prefs.silentSpeedSec * 1000));
    const timer = window.setInterval(() => {
      setRevealedTokenIds((prev) => {
        const next = revealNextStep(prefs.revealMode, ayahs, wordTokens, prev);
        if (next === prev) {
          setIsAutoRevealing(false);
          return prev;
        }
        const added = wordTokens.filter((t) => !prev.has(t.id) && next.has(t.id));
        if (added.length > 0) setLastRevealedTokenId(added[added.length - 1].id);
        return next;
      });
    }, ms);

    return () => window.clearInterval(timer);
  }, [isAutoRevealing, prefs.revealMode, prefs.silentSpeedSec, ayahs, wordTokens]);

  const playAyahAtIndex = useCallback(
    (index: number, remainingRepeats?: number) => {
      if (index < 0 || index >= ayahs.length) {
        stopAudio();
        return;
      }
      const repeatsLeft = remainingRepeats ?? repeatCount;
      const ayah = ayahs[index];
      const key = ayahKey(ayah);
      stopAudio();
      stopMic();
      setStatusMessage(null);
      setIsAutoRevealing(false);

      setRevealedTokenIds((prev) => revealEntireAyahTokens(wordTokens, prev, key));

      const audio = new Audio(
        getEveryAyahAudioUrl(ayah.surahNumber, ayah.ayahNumber, prefs.reciter)
      );
      audio.playbackRate = playbackSpeed;
      audioRef.current = audio;
      setPlayingKey(key);

      audio.onended = () => {
        if (audioRef.current !== audio) return;
        const step = getNextPlaybackAyahStep({
          currentIndex: index,
          remainingRepeats: repeatsLeft,
          totalAyahs: ayahs.length,
          repeatCount,
          rangeStartIndex: loopRangeActive ? rangeStartIdx : 0,
          rangeEndIndex: loopRangeActive ? rangeEndIdx : Math.max(0, ayahs.length - 1),
          loopRange: loopRangeActive,
        });
        if (step.action === 'stop') {
          stopAudio();
        } else {
          playAyahAtIndex(step.nextIndex, step.nextRemainingRepeats);
        }
      };

      audio.onerror = () => {
        if (audioRef.current !== audio) return;
        stopAudio();
        setStatusMessage('Bu ayənin səs faylı hazırda oxuna bilmədi.');
      };

      void audio.play().catch(() => {
        if (audioRef.current !== audio) return;
        stopAudio();
        setStatusMessage('Səs oxutma brauzer tərəfindən dayandırıldı.');
      });
    },
    [
      ayahs,
      wordTokens,
      prefs.reciter,
      playbackSpeed,
      repeatCount,
      loopRangeActive,
      rangeStartIdx,
      rangeEndIdx,
      stopAudio,
      stopMic,
    ]
  );

  function handleToggleListen() {
    if (playingKey) {
      stopAudio();
      return;
    }
    if (ayahs.length === 0) return;
    if (loopRangeActive) {
      playAyahAtIndex(Math.max(0, Math.min(ayahs.length - 1, rangeStartIdx)));
      return;
    }
    const firstUnrevealedIdx = ayahs.findIndex(
      (a) => !isAyahRevealed(ayahKey(a), wordTokens, revealedTokenIds)
    );
    playAyahAtIndex(firstUnrevealedIdx >= 0 ? firstUnrevealedIdx : 0);
  }

  function handleToggleMicrophone() {
    if (isMicListening) {
      stopMic();
      return;
    }
    stopAudio();
    setIsAutoRevealing(false);
    setStatusMessage(null);

    const SpeechCtor = getSpeechRecognitionCtor();
    if (!SpeechCtor) {
      // Graceful fallback to Qari audio if browser lacks SpeechRecognition
      setStatusMessage('Canlı mikrofon bu brauzerdə dəstəklənmir — Qari tilavəti başladıldı.');
      handleToggleListen();
      return;
    }

    try {
      const recognition = new SpeechCtor();
      recognition.lang = 'ar-SA';
      recognition.continuous = true;
      recognition.interimResults = true;
      speechCursorRef.current = Math.max(
        0,
        wordTokens.findIndex((t) => !revealedTokenIds.has(t.id))
      );

      recognition.onresult = (event) => {
        let fullChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          fullChunk += ` ${event.results[i][0].transcript}`;
        }
        const trimmed = fullChunk.trim();
        if (!trimmed) return;
        setLiveTranscript(trimmed);

        const result = matchSpokenArabicAgainstTokens(
          trimmed,
          wordTokens,
          speechCursorRef.current
        );
        if (result.matchedTokenIds.length > 0) {
          speechCursorRef.current = result.nextCursorIndex;
          setRevealedTokenIds((prev) => {
            const next = new Set(prev);
            for (const id of result.matchedTokenIds) next.add(id);
            return next;
          });
          setLastRevealedTokenId(result.matchedTokenIds[result.matchedTokenIds.length - 1]);
        }
        if (result.skippedTokens.length > 0) {
          const nowIso = new Date().toISOString();
          setMissedWords((prev) => {
            const existingIds = new Set(prev.map((m) => m.tokenId));
            const additions: MissedWordRecord[] = [];
            for (const tok of result.skippedTokens) {
              if (!existingIds.has(tok.id)) {
                additions.push({
                  tokenId: tok.id,
                  ayahKey: tok.ayahKey,
                  pageNumber,
                  surahName: primarySurahName,
                  stemText: tok.stemText,
                  createdAt: nowIso,
                });
              }
            }
            return [...additions, ...prev].slice(0, 80);
          });
        }
      };

      recognition.onerror = (ev) => {
        setIsMicListening(false);
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
          setStatusMessage('Mikrofona icazə verilmədi. Qari tilavətindən istifadə edə bilərsiniz.');
        } else {
          setStatusMessage('Səs tanıma dayandırıldı.');
        }
      };

      recognition.onend = () => {
        setIsMicListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsMicListening(true);
    } catch {
      setStatusMessage('Mikrofon açıla bilmədi — Qari tilavətini dinləyə bilərsiniz.');
    }
  }

  const goToPage = useCallback((target: number) => {
    const clean = clampMuhaffizPage(target);
    setPageNumber(clean);
    setIndexOpen(false);
    setSettingsOpen(false);
    setMistakesOpen(false);
    setSelfRecordOpen(false);
    if (typeof window !== 'undefined') {
      const nextPath = clean === 1 ? '/muhaffiz' : `/muhaffiz/${clean}`;
      if (window.location.pathname !== nextPath) {
        window.history.replaceState(null, '', nextPath);
      }
    }
  }, []);

  const handleResetPageReveal = useCallback(() => {
    setIsAutoRevealing(false);
    setRevealedTokenIds(new Set());
    setLastRevealedTokenId(null);
    speechCursorRef.current = 0;
  }, []);

  const toggleTokenMistake = useCallback(
    (tokenId: string) => {
      const token = wordTokens.find((t) => t.id === tokenId);
      if (!token) return;
      setMissedWords((prev) =>
        toggleMissedWordRecord(prev, {
          tokenId: token.id,
          ayahKey: token.ayahKey,
          pageNumber,
          surahName: primarySurahName,
          stemText: token.stemText,
          createdAt: new Date().toISOString(),
        })
      );
    },
    [wordTokens, pageNumber, primarySurahName]
  );

  // Keyboard shortcuts (+, -, Arrows, Space, R, X, Escape)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');
      if (e.key === 'Escape') {
        setSpeedPopOpen(false);
        setSettingsOpen(false);
        setIndexOpen(false);
        setMistakesOpen(false);
        return;
      }
      if (isTyping || indexOpen || settingsOpen) return;

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleRevealNext();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleHideLast();
      } else if (e.key === ' ' && prefs.silentMode) {
        e.preventDefault();
        stopAudio();
        stopMic();
        setIsAutoRevealing((v) => !v);
      } else if ((e.key === 'r' || e.key === 'R') && prefs.silentMode) {
        e.preventDefault();
        handleResetPageReveal();
      } else if ((e.key === 'x' || e.key === 'X') && lastRevealedTokenId) {
        e.preventDefault();
        toggleTokenMistake(lastRevealedTokenId);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (pageNumber < TOTAL_QURAN_PAGES) goToPage(pageNumber + 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (pageNumber > 1) goToPage(pageNumber - 1);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    goToPage,
    handleHideLast,
    handleResetPageReveal,
    handleRevealNext,
    indexOpen,
    lastRevealedTokenId,
    pageNumber,
    prefs.silentMode,
    settingsOpen,
    stopAudio,
    stopMic,
    toggleTokenMistake,
  ]);

  const revealedAyahsForTranslation = useMemo(
    () =>
      ayahs.filter((a) => {
        const key = ayahKey(a);
        return wordTokens.some((t) => t.ayahKey === key && revealedTokenIds.has(t.id));
      }),
    [ayahs, wordTokens, revealedTokenIds]
  );

  const isCenteredPage = Boolean(pageData?.centeredPage);
  const isQcfFontActive = qcfReadyPage === pageNumber;
  const headerFontStyle = {
    fontFamily: hafsHeaderReady ? '"UthmanicHafs1", "Amiri", serif' : '"Amiri", serif',
  };

  const mushafSizeClass: Record<MuhaffizFontSize, string> = isCenteredPage
    ? {
        sm: 'text-[clamp(1.22rem,min(4.8vw,3.1dvh),1.8rem)]',
        md: 'text-[clamp(1.38rem,min(5.3vw,3.55dvh),2.15rem)]',
        lg: 'text-[clamp(1.52rem,min(5.7vw,3.85dvh),2.35rem)]',
      }
    : {
        sm: 'text-[clamp(0.98rem,min(4.2vw,2.55dvh),1.52rem)]',
        md: 'text-[clamp(1.08rem,min(4.5vw,2.8dvh),1.68rem)]',
        lg: 'text-[clamp(1.18rem,min(4.85vw,3.05dvh),1.82rem)]',
      };

  const missedSet = useMemo(() => new Set(missedWords.map((m) => m.tokenId)), [missedWords]);

  const statusLabel = isMicListening
    ? 'Dinlənilir...'
    : playingKey
      ? `Tilavət · ${playingKey}`
      : prefs.silentMode
        ? 'Səssiz təkrar'
        : 'Oxu';

  const activeLoopSummary =
    loopRangeActive && pageAyahKeys.length > 0
      ? `Döngü: ${pageAyahKeys[rangeStartIdx] ?? ''}–${pageAyahKeys[rangeEndIdx] ?? ''}`
      : null;

  const statusSubLabel = isMicListening
    ? liveTranscript || 'Ərəbcə ayələri oxuyun...'
    : playingKey
      ? `${MUHAFFIZ_RECITERS.find((r) => r.id === prefs.reciter)?.label ?? 'Qari'}${activeLoopSummary ? ` · ${activeLoopSummary}` : ''}`
      : statusMessage ||
        activeLoopSummary ||
        (prefs.silentMode
          ? `${revealedWordCount}/${wordTokens.length} söz açılıb${currentPageRepetitions > 0 ? ` · ${currentPageRepetitions}× təkrar` : ''}`
          : currentPageRepetitions > 0
            ? `${currentPageRepetitions}× təkrar`
            : null);

  return (
    <section
      data-testid="muhaffiz-viewport"
      data-qcf-ready={isQcfFontActive ? 'true' : 'false'}
      data-reveal-mode={prefs.revealMode}
      data-paper-theme={prefs.paperTheme}
      style={{
        backgroundColor: palette.paper,
        color: palette.ink,
      }}
      className="relative flex h-[100dvh] w-full flex-col overflow-hidden transition-colors duration-200 select-none"
    >
      <SeoHead
        title={`Mühafiz (Əzbər Mushafı) — Səhifə ${pageNumber} | Quran Qiraeti`}
        description="Quran.mushafuk.online üslubunda Mədinə Mushafı: ayələri sözbə-söz və ya ayə-ayə gizlət, səssiz təkrar və canlı mikrofonla əzbər yoxlaması et."
        path={pageNumber === 1 ? '/muhaffiz' : `/muhaffiz/${pageNumber}`}
        ogImage="/og-default.png"
        prevPath={pageNumber > 1 ? `/muhaffiz/${pageNumber - 1}` : undefined}
        nextPath={pageNumber < TOTAL_QURAN_PAGES ? `/muhaffiz/${pageNumber + 1}` : undefined}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Mühafiz — Quran Əzbər Mushafı',
            applicationCategory: 'EducationalApplication',
            inLanguage: ['az', 'ar'],
            description:
              '604 Mədinə Mushafı səhifəsində səssiz təkrar, sözbə-söz gizlətmə, canlı tilavət dinləmə və əzbər izləmə aləti.',
          },
          buildBreadcrumbJsonLd(window.location.origin, [
            { name: 'Ana səhifə', path: '/' },
            { name: 'Mühafiz', path: '/muhaffiz' },
            ...(pageNumber > 1 ? [{ name: `Səhifə ${pageNumber}`, path: `/muhaffiz/${pageNumber}` }] : []),
          ]),
        ]}
      />

      {/* Sticky Minimalist Top Bar (exact quran.mushafuk.online .t-top structure) */}
      <header
        dir="ltr"
        style={{ backgroundColor: palette.paper }}
        className="z-20 flex h-12 shrink-0 items-center justify-between gap-2 px-2 sm:px-4"
      >
        {/* Left: ≡ Ayarlar */}
        <button
          type="button"
          onClick={() => {
            setMistakesOpen(false);
            setSettingsOpen(true);
          }}
          aria-expanded={settingsOpen}
          aria-label="Ayarlar"
          title="Ayarlar"
          data-testid="muhaffiz-settings-btn"
          style={
            settingsOpen
              ? { backgroundColor: palette.green, color: palette.paper }
              : { color: palette.green }
          }
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors hover:bg-black/5"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Center quiet clickable indicator */}
        <button
          type="button"
          onClick={() => setIndexOpen(true)}
          style={{ color: palette.muted }}
          className="truncate rounded-lg px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-75"
        >
          {cleanSurahTitle(primarySurahName)} · Səh. {pageNumber} · Cüz {pageData?.juzNumber ?? 1}
        </button>

        {/* Right group: [Səssiz təkrar Eye-off] [Surə və səhifə Book + Xəta badge] */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleSilentMode}
            aria-pressed={prefs.silentMode}
            aria-label="Səssiz təkrar"
            title="Səssiz təkrar (Hifz gizlətmə)"
            data-testid="muhaffiz-silent-toggle"
            style={
              prefs.silentMode
                ? { backgroundColor: palette.green, color: palette.paper }
                : { color: palette.green }
            }
            className="grid h-10 w-10 place-items-center rounded-xl transition-colors hover:bg-black/5"
          >
            {prefs.silentMode ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          <div className="relative h-10 w-10">
            <button
              type="button"
              onClick={() => setIndexOpen(true)}
              aria-label="Surə və səhifə"
              title="Surə və səhifə"
              data-testid="muhaffiz-page-picker"
              style={{ color: palette.green }}
              className="grid h-10 w-10 place-items-center rounded-xl transition-colors hover:bg-black/5"
            >
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setMistakesOpen((v) => !v)}
              aria-expanded={mistakesOpen}
              aria-label={`Xəta ${missedWords.length}`}
              title="Qeyd olunan xətalar"
              data-testid="muhaffiz-mistakes-btn"
              style={{
                backgroundColor: palette.isDark ? '#a85a4c' : '#7a3b2e',
                color: '#fffaf0',
                boxShadow: `0 0 0 2px ${palette.paper}`,
              }}
              className="absolute -top-1 -right-1 z-10 min-w-[18px] rounded-full px-1 text-center font-mono-tabular text-[10px] leading-[18px] font-bold"
            >
              {missedWords.length}
            </button>
          </div>
        </div>
      </header>

      {/* Main 15-Line Centered Madinah Mushaf Sheet (supports RTL horizontal swipe) */}
      <div
        dir="rtl"
        data-testid="muhaffiz-sheet"
        onTouchStart={(e) => {
          const touch = e.changedTouches[0];
          if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(e) => {
          const start = touchStartRef.current;
          touchStartRef.current = null;
          const touch = e.changedTouches[0];
          if (!start || !touch) return;
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
          if (dx > 0 && pageNumber < TOTAL_QURAN_PAGES) goToPage(pageNumber + 1);
          else if (dx < 0 && pageNumber > 1) goToPage(pageNumber - 1);
        }}
        className={`mx-auto flex min-h-0 w-full max-w-[920px] flex-1 flex-col overflow-hidden px-3 sm:px-6 ${
          isCenteredPage ? 'justify-center gap-y-2.5 sm:gap-y-3' : 'justify-between py-1 sm:py-2'
        }`}
      >
        {isLoading ? (
          <div className="my-auto space-y-2 text-center">
            <p style={{ ...headerFontStyle, color: palette.muted }} className="text-2xl">
              جاري تحميل الصفحة {toArabicIndicDigits(pageNumber)}...
            </p>
            <p className="text-xs" style={{ color: palette.muted }}>
              {pageNumber}-ci səhifə yüklənir...
            </p>
          </div>
        ) : loadError ? (
          <div className="my-auto text-center">
            <p className="text-sm text-[#9c2f24]">{loadError}</p>
            <button
              type="button"
              onClick={() => setPageNumber((p) => p)}
              style={{ backgroundColor: palette.green, color: palette.paper }}
              className="mt-4 rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Yenidən yüklə
            </button>
          </div>
        ) : (
          pageData?.rows.map((row, rIdx) => {
            if (row.kind === 'surah-header') {
              const glyphs = getSurahBannerGlyphs(row.surahNumber);
              return (
                <div
                  key={`h-${row.surahNumber}-${rIdx}`}
                  className="relative mx-auto flex w-[min(420px,92%)] shrink-0 items-center justify-center overflow-hidden"
                >
                  <img
                    src="/muhaffiz/surah-banner.png"
                    alt=""
                    aria-hidden="true"
                    className={`h-auto w-full object-contain ${
                      palette.isDark ? 'brightness-110 invert' : ''
                    }`}
                  />
                  <span
                    aria-label={row.arabicSurahName}
                    style={{
                      fontFamily: surahNamesFontReady
                        ? '"MushafSurahNames", "UthmanicHafs1", "Amiri", serif'
                        : headerFontStyle.fontFamily,
                      color: palette.ink,
                    }}
                    className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5 text-[clamp(1.05rem,3.4vw,1.55rem)] leading-none"
                  >
                    {surahNamesFontReady ? (
                      <>
                        <span>{glyphs.prefixGlyph}</span>
                        <span>{glyphs.nameGlyph}</span>
                      </>
                    ) : (
                      <span>{row.arabicSurahName}</span>
                    )}
                  </span>
                </div>
              );
            }

            if (row.kind === 'bismillah') {
              return (
                <p
                  key={`b-${row.surahNumber}-${rIdx}`}
                  style={{ ...headerFontStyle, color: palette.ink }}
                  className={`shrink-0 text-center leading-tight ${
                    isCenteredPage ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
                  }`}
                >
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                </p>
              );
            }

            const wordOnlyCount = row.tokens.filter((t) => t.charType === 'word').length;
            const useCenteredRow = isCenteredPage || wordOnlyCount <= 4;

            return (
              <div
                key={`l-${row.lineNumber}-${rIdx}`}
                data-line={row.lineNumber}
                className={`flex min-h-0 flex-nowrap items-baseline ${mushafSizeClass[prefs.fontSize]} leading-[1.28] ${
                  useCenteredRow ? 'justify-center gap-x-2 sm:gap-x-2.5' : 'justify-center gap-x-[0.22em] sm:gap-x-[0.35em]'
                }`}
              >
                {row.tokens.map((token) => {
                  const canUseQcf = isQcfFontActive && Boolean(token.codeV2Full);
                  const tokenFontStyle = canUseQcf
                    ? { fontFamily: `"QcfV1Page_${pageNumber}", "UthmanicHafs1", "Amiri", serif` }
                    : headerFontStyle;
                  const ayahAllRevealed = isAyahRevealed(
                    token.ayahKey,
                    wordTokens,
                    revealedTokenIds
                  );
                  const isPlaying = playingKey === token.ayahKey;

                  if (token.charType === 'end') {
                    return (
                      <button
                        key={token.id}
                        type="button"
                        onClick={() => {
                          if (prefs.silentMode) {
                            setRevealedTokenIds((prev) =>
                              toggleEntireAyahTokens(wordTokens, prev, token.ayahKey)
                            );
                          } else {
                            const idx = ayahs.findIndex((a) => ayahKey(a) === token.ayahKey);
                            if (idx >= 0) playAyahAtIndex(idx);
                          }
                        }}
                        aria-pressed={prefs.silentMode ? ayahAllRevealed : isPlaying}
                        aria-label={
                          prefs.silentMode
                            ? `Ayə ${token.ayahKey} ${ayahAllRevealed ? 'gizlət' : 'göstər'}`
                            : `Ayə ${token.ayahKey} tilavətini dinlə`
                        }
                        data-testid={`muhaffiz-ayah-${token.ayahKey}`}
                        style={{
                          ...tokenFontStyle,
                          color: isPlaying ? palette.green : palette.ink,
                          backgroundColor: isPlaying ? palette.fresh : undefined,
                        }}
                        className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded px-0.5 leading-none transition-colors hover:opacity-75 focus-visible:outline-2"
                      >
                        {canUseQcf
                          ? token.codeV2Full
                          : `﴿${toArabicIndicDigits(token.ayahNumber)}﴾`}
                      </button>
                    );
                  }

                  const isTokenRevealed = revealedTokenIds.has(token.id);
                  const isWordVisible =
                    !prefs.silentMode ||
                    isTokenRevealed ||
                    (prefs.firstWordHint && token.isFirstWordOfAyah);
                  const isFresh = lastRevealedTokenId === token.id || isPlaying;
                  const isMissed = missedSet.has(token.id);

                  return (
                    <button
                      key={token.id}
                      type="button"
                      onContextMenu={(e) => {
                        e.preventDefault();
                        toggleTokenMistake(token.id);
                      }}
                      onClick={() => {
                        if (prefs.silentMode) {
                          setRevealedTokenIds((prev) =>
                            prefs.revealMode === 'ayah'
                              ? toggleEntireAyahTokens(wordTokens, prev, token.ayahKey)
                              : toggleWordToken(prev, token.id)
                          );
                          setLastRevealedTokenId(token.id);
                        } else {
                          toggleTokenMistake(token.id);
                        }
                      }}
                      aria-label={token.stemText}
                      aria-pressed={isWordVisible}
                      data-testid={`muhaffiz-word-${token.id}`}
                      data-word-revealed={isWordVisible ? 'true' : 'false'}
                      data-word-text={token.stemText}
                      style={{
                        ...tokenFontStyle,
                        backgroundColor: isWordVisible && isFresh ? palette.fresh : undefined,
                        boxShadow: isMissed ? 'inset 0 -0.1em 0 #9c2f24' : undefined,
                      }}
                      className="inline-flex shrink-0 cursor-pointer items-baseline whitespace-nowrap rounded-xs px-[0.5px] leading-none transition-colors focus-visible:outline-2"
                    >
                      <span
                        style={{
                          color: isWordVisible ? palette.ink : 'transparent',
                          borderBottom: isWordVisible
                            ? '1.5px solid transparent'
                            : `1.5px solid ${palette.line}`,
                        }}
                        className="pb-[1px]"
                      >
                        {canUseQcf ? token.codeV2Stem : token.stemText}
                      </span>
                      {(canUseQcf ? token.codeV2Waqf : token.waqfMark) && (
                        <span
                          aria-hidden="true"
                          style={{ color: palette.ink }}
                          className="select-none"
                        >
                          {canUseQcf ? token.codeV2Waqf : token.waqfMark}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* Optional Translation Drawer */}
      {prefs.showTranslation && revealedAyahsForTranslation.length > 0 && (
        <div
          style={{
            backgroundColor: palette.bar,
            borderColor: palette.line,
            color: palette.ink,
          }}
          className="mx-auto max-h-28 w-full max-w-[920px] shrink-0 overflow-y-auto border-t px-4 py-2 text-xs"
        >
          <div className="flex items-center justify-between pb-1" style={{ color: palette.muted }}>
            <span className="font-semibold" style={{ color: palette.ink }}>
              Tərcümə (Ə. Musayev)
            </span>
            <span className="font-mono-tabular">
              {revealedAyahCount} / {ayahs.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {revealedAyahsForTranslation.map((ayah) => (
              <div key={`tr-${ayahKey(ayah)}`}>
                <span className="font-semibold" style={{ color: palette.green }}>
                  {cleanSurahTitle(ayah.surahName)} {ayahKey(ayah)}:{' '}
                </span>
                <span>{ayah.translation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contextual Hifz Completion / Quick Peek-Mistake Bar */}
      {prefs.silentMode && !isLoading && (allRevealed || lastRevealedTokenId) && wordTokens.length > 0 && (
        <div
          dir="ltr"
          className="mx-auto flex shrink-0 flex-wrap items-center justify-center gap-1.5 px-3 pb-1"
        >
          {allRevealed ? (
            <>
              <button
                type="button"
                data-testid="muhaffiz-mark-memorized-quick"
                onClick={() =>
                  setHifzProgress((prev) =>
                    setHifzPageStatus(
                      prev,
                      pageNumber,
                      currentPageHifzStatus === 'memorized' ? 'none' : 'memorized'
                    )
                  )
                }
                style={
                  currentPageHifzStatus === 'memorized'
                    ? { backgroundColor: palette.green, color: palette.paper, borderColor: palette.green }
                    : { backgroundColor: palette.chip, color: palette.green, borderColor: palette.line }
                }
                className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors"
              >
                <Check className="h-3 w-3" aria-hidden="true" />
                <span>
                  {currentPageHifzStatus === 'memorized' ? 'Əzbərlənib' : 'Səhifə tamamlandı · Əzbərlədim'}
                </span>
              </button>
              <button
                type="button"
                data-testid="muhaffiz-rep-inc-btn"
                onClick={() =>
                  setHifzProgress((prev) => incrementHifzRepetition(prev, pageNumber))
                }
                style={{ backgroundColor: palette.chip, color: palette.ink, borderColor: palette.line }}
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono-tabular text-[11px] font-semibold hover:opacity-80"
              >
                <span>Təkrar +1{currentPageRepetitions > 0 ? ` (${currentPageRepetitions}×)` : ''}</span>
              </button>
              <button
                type="button"
                data-testid="muhaffiz-reset-reveal-btn"
                onClick={handleResetPageReveal}
                style={{ backgroundColor: palette.chip, color: palette.muted, borderColor: palette.line }}
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium hover:opacity-80"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Yenidən yoxla</span>
              </button>
            </>
          ) : (
            lastRevealedTokenId && (
              <>
                <button
                  type="button"
                  data-testid="muhaffiz-flag-last-btn"
                  onClick={() => toggleTokenMistake(lastRevealedTokenId)}
                  style={
                    missedSet.has(lastRevealedTokenId)
                      ? {
                          backgroundColor: palette.isDark ? '#a85a4c' : '#7a3b2e',
                          color: '#fffaf0',
                          borderColor: palette.isDark ? '#a85a4c' : '#7a3b2e',
                        }
                      : {
                          backgroundColor: palette.chip,
                          color: palette.isDark ? '#e69b8d' : '#7a3b2e',
                          borderColor: palette.line,
                        }
                  }
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                >
                  <Flag className="h-3 w-3" aria-hidden="true" />
                  <span>{missedSet.has(lastRevealedTokenId) ? 'Xəta sil' : 'Xəta qeyd et'}</span>
                </button>
                <button
                  type="button"
                  data-testid="muhaffiz-reset-reveal-btn"
                  onClick={handleResetPageReveal}
                  style={{ backgroundColor: palette.chip, color: palette.muted, borderColor: palette.line }}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium hover:opacity-80"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  <span>Sıfırla</span>
                </button>
              </>
            )
          )}
        </div>
      )}

      {/* Centered Subtle Page Number (exact match to quran.mushafuk.online) */}
      <div
        className="shrink-0 pb-0.5 text-center font-mono-tabular text-xs font-medium"
        style={{ color: palette.muted }}
      >
        {pageNumber}
      </div>

      {/* Bottom Dock (.t-bar — Left status, Center Səssiz təkrar pill controls, Right 44x44 Deep Green Mic button) */}
      <footer
        dir="ltr"
        style={{ backgroundColor: palette.paper }}
        className="relative z-30 shrink-0 px-3 pt-1 pb-2.5 sm:px-5"
      >
        <div className="relative mx-auto flex max-w-[920px] items-center justify-between gap-2">
          {/* Left: Status indicator + quick Qari listen button (desktop) */}
          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:flex-1">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="h-4.5 w-4.5 shrink-0"
            >
              <path
                d="M12 2L20 7.5V16.5L12 22L4 16.5V7.5L12 2Z"
                fill={palette.green}
                fillOpacity="0.14"
                stroke={palette.green}
                strokeWidth="1.8"
              />
              <path
                d="M9 13V11M12 15V9M15 13V11"
                stroke={palette.gold}
                strokeWidth="1.9"
                strokeLinecap="round"
              />
            </svg>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <b
                  className="whitespace-nowrap text-xs font-bold sm:text-sm"
                  style={{ color: palette.green }}
                >
                  <span className="sm:hidden">{prefs.silentMode ? 'Səssiz' : 'Oxu'}</span>
                  <span className="hidden sm:inline">{statusLabel}</span>
                </b>
                <button
                  type="button"
                  onClick={handleToggleListen}
                  aria-label={playingKey ? 'Qari tilavətini dayandır' : 'Qari tilavətini dinlə'}
                  title={playingKey ? 'Dayandır' : 'Qari tilavəti'}
                  style={{ borderColor: palette.line, color: palette.muted }}
                  className="hidden h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-medium hover:opacity-80 sm:inline-flex"
                >
                  {playingKey ? (
                    <VolumeX className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Volume2 className="h-3 w-3" aria-hidden="true" />
                  )}
                  <span>{playingKey ? 'Dayandır' : 'Qari'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMistakesOpen(false);
                    setSelfRecordOpen((v) => !v);
                  }}
                  aria-pressed={selfRecordOpen}
                  aria-label="Öz səsini yaz və Qari ilə müqayisə et"
                  title="Səsini yaz · Qari ilə müqayisə"
                  data-testid="muhaffiz-self-record-toggle"
                  style={
                    selfRecordOpen
                      ? {
                          backgroundColor: palette.green,
                          color: palette.paper,
                          borderColor: palette.green,
                        }
                      : { borderColor: palette.line, color: palette.muted }
                  }
                  className="inline-flex h-8 w-8 items-center justify-center gap-1 rounded-full border text-[11px] font-medium whitespace-nowrap hover:opacity-80 sm:h-6 sm:w-auto sm:px-2"
                >
                  <AudioLines className="h-3.5 w-3.5 sm:h-3 sm:w-3" aria-hidden="true" />
                  <span className="hidden sm:inline">Səs yaz</span>
                </button>
              </div>
              {statusSubLabel && (
                <p
                  className="hidden truncate text-[11px] sm:block"
                  style={{ color: palette.muted }}
                >
                  {statusSubLabel}
                </p>
              )}
            </div>
          </div>

          {/* Center: Silent Repeat Controls (when Səssiz təkrar active) OR clean page arrows */}
          <div className="relative flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => goToPage(pageNumber + 1)}
              disabled={pageNumber >= TOTAL_QURAN_PAGES}
              aria-label="Növbəti səhifə"
              title="Növbəti səhifə"
              data-testid="muhaffiz-next-page"
              style={{ borderColor: palette.line, backgroundColor: palette.chip }}
              className="grid h-9 w-9 place-items-center rounded-full border transition-opacity hover:opacity-75 disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => goToPage(pageNumber - 1)}
              disabled={pageNumber <= 1}
              aria-label="Əvvəlki səhifə"
              title="Əvvəlki səhifə"
              data-testid="muhaffiz-prev-page"
              style={{ borderColor: palette.line, backgroundColor: palette.chip }}
              className="grid h-9 w-9 place-items-center rounded-full border transition-opacity hover:opacity-75 disabled:opacity-35"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>

            {prefs.silentMode && (
              <>
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: palette.line }}
                  className="mx-0.5 h-5 w-px"
                />

                {/* Speed Popover Trigger (⏱ 1.5s) */}
                <button
                  type="button"
                  onClick={() => setSpeedPopOpen((v) => !v)}
                  aria-haspopup="dialog"
                  aria-expanded={speedPopOpen}
                  aria-label={`Sürət: ${prefs.silentSpeedSec}s`}
                  title="Avtomatik açılma sürəti"
                  data-testid="muhaffiz-speed-btn"
                  style={{ borderColor: palette.line, backgroundColor: palette.chip }}
                  className="inline-flex h-9 items-center gap-1 rounded-full border px-2.5 font-mono-tabular text-xs font-semibold transition-opacity hover:opacity-80"
                >
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{prefs.silentSpeedSec}s</span>
                </button>

                {/* Auto-Reveal Play/Pause */}
                <button
                  type="button"
                  onClick={() => {
                    stopAudio();
                    stopMic();
                    setIsAutoRevealing((v) => !v);
                  }}
                  aria-pressed={isAutoRevealing}
                  aria-label={
                    isAutoRevealing ? 'Sözləri açmağı saxla' : 'Sözləri bir-bir aç'
                  }
                  title="Sözləri bir-bir aç"
                  data-testid="muhaffiz-auto-btn"
                  style={
                    isAutoRevealing
                      ? { backgroundColor: palette.green, color: palette.paper, borderColor: palette.green }
                      : { borderColor: palette.line, backgroundColor: palette.chip }
                  }
                  className="grid h-9 w-9 place-items-center rounded-full border transition-colors"
                >
                  {isAutoRevealing ? (
                    <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>

                {/* Hide Last (-) / Reveal Next (+) compact pills */}
                <button
                  type="button"
                  onClick={handleHideLast}
                  disabled={revealedWordCount === 0}
                  aria-label={prefs.revealMode === 'word' ? 'Son sözü gizlət' : 'Son ayəni gizlət'}
                  data-testid="muhaffiz-hide-last"
                  style={{ borderColor: palette.line, backgroundColor: palette.chip }}
                  className="hidden h-9 w-9 place-items-center rounded-full border disabled:opacity-35 sm:grid"
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={handleRevealNext}
                  disabled={allRevealed || wordTokens.length === 0}
                  aria-label={prefs.revealMode === 'word' ? 'Növbəti sözü göstər' : 'Növbəti ayəni göstər'}
                  data-testid="muhaffiz-reveal-next"
                  style={{ borderColor: palette.line, backgroundColor: palette.chip }}
                  className="hidden h-9 w-9 place-items-center rounded-full border disabled:opacity-35 sm:grid"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>

                {/* Speed selector popover (0.5s .. 5s) */}
                {speedPopOpen && (
                  <div
                    role="dialog"
                    aria-label="Sürət"
                    style={{
                      backgroundColor: palette.paper,
                      borderColor: palette.line,
                      color: palette.ink,
                    }}
                    className="absolute bottom-full left-1/2 z-40 mb-2 w-60 -translate-x-1/2 rounded-2xl border p-3 shadow-xl"
                  >
                    <div className="mb-2 flex items-baseline justify-between text-xs">
                      <b>Sürət</b>
                      <span style={{ color: palette.muted }}>saniyə / söz</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {MUHAFFIZ_SILENT_SPEEDS.map((spd) => {
                        const active = prefs.silentSpeedSec === spd;
                        return (
                          <button
                            key={spd}
                            type="button"
                            aria-pressed={active}
                            onClick={() => {
                              setPrefs((p) => ({
                                ...p,
                                silentSpeedSec: spd,
                                autoIntervalMs: Math.round(spd * 1000),
                              }));
                              setSpeedPopOpen(false);
                            }}
                            style={
                              active
                                ? {
                                    backgroundColor: palette.ink,
                                    color: palette.paper,
                                    borderColor: palette.ink,
                                  }
                                : { borderColor: palette.line, backgroundColor: palette.chip }
                            }
                            className="h-8 rounded-full border font-mono-tabular text-xs font-semibold"
                          >
                            {spd}s
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: Circular Deep Forest Green Mikrofon Button */}
          <div className="flex shrink-0 justify-end sm:flex-1">
            <button
              type="button"
              onClick={handleToggleMicrophone}
              aria-pressed={isMicListening}
              aria-label={isMicListening ? 'Mikrofonu dayandır' : 'Mikrofon'}
              title={isMicListening ? 'Mikrofonu dayandır' : 'Mikrofonla oxu'}
              data-testid="muhaffiz-mic-btn"
              style={{
                backgroundColor: '#1c3d32',
                color: '#fffaf0',
                boxShadow:
                  isMicListening || playingKey
                    ? `0 0 0 3px ${palette.gold}`
                    : undefined,
              }}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition-shadow hover:opacity-90"
            >
              {isMicListening ? (
                <MicOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Mic className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </footer>

      {/* Mistakes Drawer (.t-miss) */}
      {mistakesOpen && (
        <div
          role="dialog"
          aria-label="Xətalar"
          dir="ltr"
          style={{
            backgroundColor: palette.paper,
            borderColor: palette.line,
            color: palette.ink,
          }}
          className="fixed inset-x-3 bottom-18 z-40 mx-auto max-h-[46vh] max-w-[520px] overflow-y-auto rounded-2xl border p-3 shadow-2xl"
        >
          <div className="flex items-center justify-between pb-2">
            <span className="text-sm font-bold">Xətalar ({missedWords.length})</span>
            <div className="flex items-center gap-3">
              {missedWords.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMissedWords([])}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#9c2f24] hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Təmizlə</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setMistakesOpen(false)}
                aria-label="Bağla"
                style={{ backgroundColor: palette.line }}
                className="grid h-7 w-7 place-items-center rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {missedWords.length === 0 ? (
            <p className="py-4 text-center text-xs" style={{ color: palette.muted }}>
              Hələ qeydə alınmış xəta yoxdur. Canlı oxunuşda buraxılan sözlər və ya oxu rejimində
              işarələdiyiniz sözlər burada görünür.
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: palette.line }}>
              {missedWords.map((item) => (
                <button
                  key={`${item.tokenId}-${item.createdAt}`}
                  type="button"
                  onClick={() => goToPage(item.pageNumber)}
                  className="flex w-full items-center justify-between gap-3 py-2 text-left transition-colors hover:bg-black/5"
                >
                  <div>
                    <p className="text-xs font-semibold">
                      {cleanSurahTitle(item.surahName)} · {item.ayahKey}
                    </p>
                    <p className="text-[11px]" style={{ color: palette.muted }}>
                      Mədinə səhifəsi {item.pageNumber}
                    </p>
                  </div>
                  <span dir="rtl" lang="ar" style={headerFontStyle} className="text-xl">
                    {item.stemText}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Self-Voice Recording & Qari Comparison Panel */}
      <MuhaffizSelfRecordPanel
        isOpen={selfRecordOpen}
        pageNumber={pageNumber}
        ayahs={ayahs}
        palette={palette}
        onListenAyahIndex={(idx) => playAyahAtIndex(idx)}
        onClose={() => setSelfRecordOpen(false)}
      />

      {/* Ayarlar Bottom Sheet */}
      <MuhaffizSettingsSheet
        isOpen={settingsOpen}
        pageNumber={pageNumber}
        revealedAyahCount={revealedAyahCount}
        missedCount={missedWords.length}
        prefs={prefs}
        hifzSummary={hifzSummary}
        currentPageHifzStatus={currentPageHifzStatus}
        isCurrentPageBookmarked={isCurrentPageBookmarked}
        playbackSpeed={playbackSpeed}
        repeatCount={repeatCount}
        isPlayingAudio={Boolean(playingKey)}
        allRevealed={allRevealed}
        pageAyahKeys={pageAyahKeys}
        rangeStartIdx={rangeStartIdx}
        rangeEndIdx={rangeEndIdx}
        loopRangeActive={loopRangeActive}
        pageRepetitions={currentPageRepetitions}
        onClose={() => setSettingsOpen(false)}
        onUpdatePrefs={(updater) => setPrefs((prev) => updater(prev))}
        onToggleRevealAll={() => {
          setIsAutoRevealing(false);
          if (allRevealed) {
            stopAudio();
            setRevealedTokenIds(new Set());
          } else {
            setRevealedTokenIds(new Set(wordTokens.map((t) => t.id)));
          }
        }}
        onToggleAudio={handleToggleListen}
        onSetPlaybackSpeed={setPlaybackSpeed}
        onSetRepeatCount={setRepeatCount}
        onChangeRangeStart={(idx) => {
          setRangeStartIdx(idx);
          if (rangeEndIdx < idx) setRangeEndIdx(idx);
        }}
        onChangeRangeEnd={(idx) => setRangeEndIdx(Math.max(rangeStartIdx, idx))}
        onToggleLoopRange={() => setLoopRangeActive((v) => !v)}
        onIncrementRepetition={() =>
          setHifzProgress((prev) => incrementHifzRepetition(prev, pageNumber))
        }
        onSetPageStatus={(status) =>
          setHifzProgress((prev) => setHifzPageStatus(prev, pageNumber, status))
        }
        onToggleBookmark={() =>
          setHifzProgress((prev) => toggleHifzBookmark(prev, pageNumber))
        }
        onOpenIndex={() => {
          setSettingsOpen(false);
          setIndexOpen(true);
        }}
        onNavigate={onNavigate}
      />

      {/* Full-Screen Surə və Səhifə Picker (.t-index) */}
      <MuhaffizIndexOverlay
        isOpen={indexOpen}
        currentPage={pageNumber}
        currentSurahName={primarySurahName}
        paperTheme={prefs.paperTheme}
        hifzProgress={hifzProgress}
        juzSummary={juzHifzSummary}
        missedWords={missedWords}
        onClose={() => setIndexOpen(false)}
        onSelectPage={goToPage}
        onOpenSettings={() => {
          setIndexOpen(false);
          setSettingsOpen(true);
        }}
      />
    </section>
  );
}
