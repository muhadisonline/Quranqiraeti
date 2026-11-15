import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  Eye,
  EyeOff,
  Home,
  Mic,
  Minus,
  Moon,
  MoreHorizontal,
  Pause,
  Plus,
  Sun,
  VolumeX,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SeoHead } from '../components/SeoHead';
import {
  DEFAULT_MUHAFFIZ_PREFS,
  FATIHAT_PAGE_1_MUHAFFIZ_SEED,
  MUHAFFIZ_RECITERS,
  MuhaffizFontSize,
  MuhaffizPageData,
  MuhaffizPreferences,
  MuhaffizReciterId,
  ayahKey,
  clampMuhaffizPage,
  formatArabicJuzLabel,
  getEveryAyahAudioUrl,
  getNextHiddenKey,
  groupPageAyahsBySurah,
  hideLastAyah,
  revealNextAyah,
  toArabicIndicDigits,
  toggleAyahReveal,
} from '../lib/muhaffiz';
import { JUZ_PAGE_RANGES, SURAH_CATALOG, TOTAL_QURAN_PAGES } from '../lib/quran';
import { fetchMuhaffizPageWithFallback } from '../lib/quranClient';

interface MuhaffizPageProps {
  initialPageNumber?: number;
  isDark: boolean;
  onNavigate: (path: string) => void;
  onToggleTheme: () => void;
}

const PREFS_STORAGE_KEY = 'quranqiraeti_muhaffiz_prefs_v2';
const LAST_PAGE_STORAGE_KEY = 'quranqiraeti_muhaffiz_last_page_v1';

function loadPrefs(): MuhaffizPreferences {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_MUHAFFIZ_PREFS;
    const parsed = JSON.parse(raw) as Partial<MuhaffizPreferences>;
    return {
      ...DEFAULT_MUHAFFIZ_PREFS,
      ...parsed,
    };
  } catch {
    return DEFAULT_MUHAFFIZ_PREFS;
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
  onToggleTheme,
}: MuhaffizPageProps) {
  const [pageNumber, setPageNumber] = useState<number>(() => getInitialPage(initialPageNumber));
  const [pageData, setPageData] = useState<MuhaffizPageData | null>(() =>
    getInitialPage(initialPageNumber) === 1 ? FATIHAT_PAGE_1_MUHAFFIZ_SEED : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(getInitialPage(initialPageNumber) !== 1);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [prefs, setPrefs] = useState<MuhaffizPreferences>(() => loadPrefs());
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(() => new Set());

  const [isAutoRevealing, setIsAutoRevealing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [jumpModalOpen, setJumpModalOpen] = useState(false);
  const [jumpTab, setJumpTab] = useState<'page' | 'surah' | 'juz'>('surah');
  const [jumpPageInput, setJumpPageInput] = useState(() => String(getInitialPage(initialPageNumber)));
  const [surahSearch, setSurahSearch] = useState('');

  // Audio playback state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPageNumber !== undefined && Number.isFinite(initialPageNumber)) {
      const clamped = clampMuhaffizPage(initialPageNumber);
      setPageNumber(clamped);
      setJumpPageInput(String(clamped));
    }
  }, [initialPageNumber]);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore storage error
    }
  }, [prefs]);

  useEffect(() => {
    try {
      localStorage.setItem(LAST_PAGE_STORAGE_KEY, String(pageNumber));
    } catch {
      // ignore storage error
    }
    setJumpPageInput(String(pageNumber));
  }, [pageNumber]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    setPlayingKey(null);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    stopAudio();
    setIsAutoRevealing(false);
    setAudioError(null);
    setLoadError(null);

    if (pageNumber === 1) {
      setPageData(FATIHAT_PAGE_1_MUHAFFIZ_SEED);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    fetchMuhaffizPageWithFallback(pageNumber, controller.signal)
      .then((payload) => {
        setPageData(payload);
        setRevealedKeys(
          prefs.autoRevealAllOnLoad
            ? new Set(payload.ayahs.map((a) => ayahKey(a)))
            : new Set()
        );
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (pageNumber === 1) {
          setPageData(FATIHAT_PAGE_1_MUHAFFIZ_SEED);
          setRevealedKeys(
            prefs.autoRevealAllOnLoad
              ? new Set(FATIHAT_PAGE_1_MUHAFFIZ_SEED.ayahs.map((a) => ayahKey(a)))
              : new Set()
          );
        } else {
          setLoadError('Mushaf səhifəsi yüklənərkən xəta baş verdi. Zəhmət olmasa yenidən yoxlayın.');
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
    };
  }, [stopAudio]);

  const ayahs = useMemo(() => pageData?.ayahs ?? [], [pageData]);
  const surahGroups = useMemo(() => groupPageAyahsBySurah(ayahs), [ayahs]);

  const cleanSurahTitle = (raw: string) => raw.replace(/\s+surəsi$/i, '').trim();

  const headerArabicSurah = useMemo(() => {
    if (surahGroups.length === 0) return 'القرآن الكريم';
    return surahGroups[0].arabicSurahName;
  }, [surahGroups]);

  const revealedCount = useMemo(
    () => ayahs.filter((a) => revealedKeys.has(ayahKey(a))).length,
    [ayahs, revealedKeys]
  );

  const progressPercent = ayahs.length > 0 ? Math.round((revealedCount / ayahs.length) * 100) : 0;
  const allRevealed = ayahs.length > 0 && revealedCount === ayahs.length;

  const handleRevealNext = useCallback(() => {
    setRevealedKeys((prev) => revealNextAyah(ayahs, prev));
  }, [ayahs]);

  const handleHideLast = useCallback(() => {
    setRevealedKeys((prev) => hideLastAyah(ayahs, prev));
  }, [ayahs]);

  const handleRevealAll = useCallback(() => {
    setIsAutoRevealing(false);
    setRevealedKeys(new Set(ayahs.map((a) => ayahKey(a))));
  }, [ayahs]);

  const handleHideAll = useCallback(() => {
    setIsAutoRevealing(false);
    stopAudio();
    setRevealedKeys(new Set());
  }, [stopAudio]);

  // Auto-reveal timer
  useEffect(() => {
    if (!isAutoRevealing || ayahs.length === 0) return;

    const timer = window.setInterval(() => {
      setRevealedKeys((prev) => {
        const nextKey = getNextHiddenKey(ayahs, prev);
        if (!nextKey) {
          setIsAutoRevealing(false);
          return prev;
        }
        const updated = new Set(prev);
        updated.add(nextKey);
        return updated;
      });
    }, prefs.autoIntervalMs);

    return () => window.clearInterval(timer);
  }, [isAutoRevealing, ayahs, prefs.autoIntervalMs]);

  const playAyahAtIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= ayahs.length) {
        stopAudio();
        return;
      }
      const ayah = ayahs[index];
      const key = ayahKey(ayah);
      stopAudio();
      setAudioError(null);
      setIsAutoRevealing(false);

      setRevealedKeys((prev) => {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        next.add(key);
        return next;
      });

      const audio = new Audio(
        getEveryAyahAudioUrl(ayah.surahNumber, ayah.ayahNumber, prefs.reciter)
      );
      audioRef.current = audio;
      setPlayingKey(key);

      audio.onended = () => {
        if (audioRef.current !== audio) return;
        if (index + 1 < ayahs.length) {
          playAyahAtIndex(index + 1);
        } else {
          stopAudio();
        }
      };

      audio.onerror = () => {
        if (audioRef.current !== audio) return;
        stopAudio();
        setAudioError('Bu ayənin səs faylı hazırda oxuna bilmədi.');
      };

      void audio.play().catch(() => {
        if (audioRef.current !== audio) return;
        stopAudio();
        setAudioError('Səs oxutma brauzer tərəfindən dayandırıldı. Yenidən toxunun.');
      });
    },
    [ayahs, prefs.reciter, stopAudio]
  );

  function handleToggleListen() {
    if (playingKey) {
      stopAudio();
      return;
    }
    if (ayahs.length === 0) return;
    const firstHiddenIdx = ayahs.findIndex((a) => !revealedKeys.has(ayahKey(a)));
    playAyahAtIndex(firstHiddenIdx >= 0 ? firstHiddenIdx : 0);
  }

  function goToPage(target: number) {
    const clean = clampMuhaffizPage(target);
    setPageNumber(clean);
    setJumpModalOpen(false);
    setSettingsOpen(false);
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');
      if (e.key === 'Escape') {
        setJumpModalOpen(false);
        setSettingsOpen(false);
        return;
      }
      if (isTyping || jumpModalOpen) return;

      if (e.key === '+' || e.key === '=' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleRevealNext();
      } else if (e.key === '-' || e.key === '_' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleHideLast();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleHideLast, handleRevealNext, jumpModalOpen]);

  const filteredSurahs = useMemo(() => {
    const q = surahSearch.trim().toLowerCase();
    if (!q) return SURAH_CATALOG;
    return SURAH_CATALOG.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        String(s.number).includes(q) ||
        s.arabicName.includes(q)
    );
  }, [surahSearch]);

  const fontSizeClasses: Record<MuhaffizFontSize, string> = {
    sm: 'text-[1.05rem] sm:text-[1.38rem]',
    md: 'text-[1.16rem] sm:text-[1.58rem]',
    lg: 'text-[1.32rem] sm:text-[1.8rem]',
  };

  const revealedAyahsForTranslation = useMemo(
    () => ayahs.filter((a) => revealedKeys.has(ayahKey(a))),
    [ayahs, revealedKeys]
  );

  return (
    <section
      className="relative flex min-h-[100dvh] w-full flex-col bg-[#FFF6E9] pb-[76px] text-[#17191C] dark:bg-[#0F1412] dark:text-[#F3F1EC]"
      data-testid="muhaffiz-viewport"
    >
      <SeoHead
        title={`Mühafiz (Əzbər Mushafı) — Səhifə ${pageNumber} | Quran Qiraeti`}
        description="Ayələri gizlədib-açaraq səhifə-səhifə (1–604 Mədinə Mushafı) Qurani-Kərimi əzbərləmək və yoxlamaq üçün Mühafiz Mushafı."
        path={pageNumber === 1 ? '/muhaffiz' : `/muhaffiz/${pageNumber}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Mühafiz — Quran Əzbər Mushafı',
          applicationCategory: 'EducationalApplication',
          inLanguage: ['az', 'ar'],
          description:
            '604 Mədinə Mushafı səhifəsində sətir-sətir yerini dəyişmədən ayələri gizlətmə, pilləli açma və tilavət dinləmə funksiyalı Quran əzbərləmə aləti.',
        }}
      />

      {/* Discreet desktop corner back button */}
      <div className="fixed top-2.5 left-3 z-20 hidden sm:block">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          aria-label="Ana səhifəyə qayıt"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#7A6F5A] transition-colors hover:bg-[#EDE3CF] hover:text-[#17191C] dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
        >
          <Home className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Sayt</span>
        </button>
      </div>

      {/* Centered Madinah Mushaf Column — Exact geometry matching muhaffidh.app */}
      <div className="mx-auto flex w-full max-w-[540px] flex-1 flex-col px-3 sm:px-5">
        {/* Top 3-Part Mushaf Running Header (الجزء | ١ | سورة الفاتحة) */}
        <header
          dir="rtl"
          className="flex items-center justify-between border-b border-[#E5DEC9] py-2 dark:border-stone-800"
        >
          <span className="font-arabic text-base sm:text-lg text-[#4D4536] dark:text-stone-300">
            {formatArabicJuzLabel(pageData?.juzNumber ?? 1)}
          </span>

          <button
            type="button"
            onClick={() => setJumpModalOpen(true)}
            aria-label={`Səhifə seçimi, hazırda ${pageNumber}-ci səhifə`}
            data-testid="muhaffiz-page-picker"
            className="relative min-w-[42px] overflow-hidden rounded-lg bg-[#E9E1CE] px-3 py-0.5 text-center font-arabic text-base text-[#17191C] transition-colors hover:bg-[#DFD5BE] dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700"
          >
            <span>{toArabicIndicDigits(pageNumber)}</span>
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-[2.5px] bg-black/10 dark:bg-white/10"
            />
            <span
              aria-hidden="true"
              style={{ width: `${progressPercent}%` }}
              className="absolute right-0 bottom-0 h-[2.5px] bg-[#0F6A56] transition-all duration-300 dark:bg-[#86C7AE]"
            />
          </button>

          <span className="font-arabic text-base sm:text-lg text-[#4D4536] dark:text-stone-300">
            {headerArabicSurah}
          </span>
        </header>

        {audioError && (
          <p
            role="status"
            className="mt-2 rounded-lg border border-[#D97706]/30 bg-[#D97706]/10 px-3 py-1.5 text-center text-xs text-[#B45309] dark:text-[#FBBF24]"
          >
            {audioError}
          </p>
        )}

        {/* Interactive Zero-Reflow Madinah Mushaf Surface */}
        <div
          dir="rtl"
          data-testid="muhaffiz-sheet"
          className={`flex flex-1 flex-col ${
            pageData?.centeredPage
              ? 'justify-center py-6 space-y-2.5 sm:space-y-3.5'
              : 'justify-evenly py-3 sm:py-4'
          }`}
        >
          {isLoading ? (
            <div className="my-auto space-y-3 py-16 text-center">
              <p className="font-arabic text-2xl text-[#6A5F4C] dark:text-stone-400">
                جاري تحميل الصفحة {toArabicIndicDigits(pageNumber)}...
              </p>
              <p className="text-xs text-[#7D715B] dark:text-stone-500">
                {pageNumber}-ci səhifə yüklənir...
              </p>
            </div>
          ) : loadError ? (
            <div className="my-auto py-16 text-center">
              <p className="text-sm text-[#DC2626] dark:text-[#F87171]">{loadError}</p>
              <button
                type="button"
                onClick={() => setPageNumber((p) => p)}
                className="mt-4 rounded-lg bg-[#0F6A56] px-4 py-2 text-xs font-medium text-white"
              >
                Yenidən yüklə
              </button>
            </div>
          ) : (
            pageData?.rows.map((row, rIdx) => {
              if (row.kind === 'surah-header') {
                return (
                  <div
                    key={`h-${row.surahNumber}-${rIdx}`}
                    className="w-full rounded-xl border border-[#249A83]/60 bg-[#DEF0E8] px-4 py-1.5 text-center dark:border-[#34D399]/35 dark:bg-[#163329]"
                  >
                    <p className="font-arabic text-2xl sm:text-[1.7rem] leading-tight text-[#0E5E4C] dark:text-[#86C7AE]">
                      {row.arabicSurahName}
                    </p>
                  </div>
                );
              }

              if (row.kind === 'bismillah') {
                return (
                  <p
                    key={`b-${row.surahNumber}-${rIdx}`}
                    className="font-arabic py-0.5 text-center text-xl sm:text-2xl leading-relaxed text-[#0E5E4C] dark:text-[#D5E6DF]"
                  >
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </p>
                );
              }

              const wordOnlyCount = row.tokens.filter((t) => t.charType === 'word').length;
              const useCenteredRow = Boolean(pageData.centeredPage) || wordOnlyCount <= 4;

              return (
                <div
                  key={`l-${row.lineNumber}-${rIdx}`}
                  data-line={row.lineNumber}
                  className={`font-arabic flex flex-nowrap items-baseline ${
                    fontSizeClasses[prefs.fontSize]
                  } leading-[1.9] ${
                    useCenteredRow
                      ? 'justify-center gap-x-2 sm:gap-x-3'
                      : 'justify-between gap-x-1 sm:gap-x-1.5'
                  }`}
                >
                  {row.tokens.map((token) => {
                    const isRevealed = revealedKeys.has(token.ayahKey);
                    const isPlaying = playingKey === token.ayahKey;

                    if (token.charType === 'end') {
                      return (
                        <button
                          key={token.id}
                          type="button"
                          onClick={() =>
                            setRevealedKeys((prev) => toggleAyahReveal(prev, token.ayahKey))
                          }
                          aria-pressed={isRevealed}
                          aria-label={`Ayə ${token.ayahKey} ${isRevealed ? 'gizlət' : 'göstər'}`}
                          data-testid={`muhaffiz-ayah-${token.ayahKey}`}
                          className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border px-1.5 py-0.5 text-[0.65em] leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6A56] ${
                            isPlaying
                              ? 'border-[#0F6A56] bg-[#0F6A56] text-white'
                              : isRevealed
                                ? 'border-[#249A83]/70 bg-[#E0F2EB] text-[#0E5E4C] dark:border-[#86C7AE]/50 dark:bg-[#196B52]/30 dark:text-[#86C7AE]'
                                : 'border-[#4D6E64]/45 bg-[#EFE6D4]/80 text-[#3B5950] hover:border-[#0E5E4C] dark:border-stone-600 dark:bg-stone-800/80 dark:text-stone-300'
                          }`}
                        >
                          {toArabicIndicDigits(token.ayahNumber)}
                        </button>
                      );
                    }

                    const isWordVisible =
                      isRevealed || (prefs.firstWordHint && token.isFirstWordOfAyah);

                    return (
                      <span
                        key={token.id}
                        role="button"
                        tabIndex={-1}
                        onClick={() =>
                          setRevealedKeys((prev) => toggleAyahReveal(prev, token.ayahKey))
                        }
                        className={`inline-flex shrink-0 cursor-pointer items-baseline whitespace-nowrap rounded-xs px-[1px] ${
                          isPlaying ? 'bg-[#0E5E4C]/10 dark:bg-[#86C7AE]/15' : ''
                        }`}
                      >
                        <span
                          className={
                            isWordVisible
                              ? 'border-b-[1.5px] border-transparent pb-[2px] text-[#0E5E4C] transition-colors duration-200 dark:text-[#D8F0E5]'
                              : 'select-none border-b-[1.5px] border-[#DFD1BA] pb-[2px] text-transparent transition-colors duration-200 dark:border-stone-700'
                          }
                        >
                          {token.stemText}
                        </span>
                        {token.waqfMark && (
                          <span
                            aria-hidden="true"
                            className="ms-0.5 select-none text-[0.8em] text-[#0E5E4C] dark:text-[#86C7AE]"
                          >
                            {token.waqfMark}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Optional Azerbaijani Translation Drawer (when enabled in ••• Settings) */}
        {prefs.showTranslation && revealedAyahsForTranslation.length > 0 && (
          <div className="mb-4 max-h-48 overflow-y-auto rounded-xl border border-[#DFD5BE] bg-[#FCF7EC] p-4 text-xs dark:border-stone-800 dark:bg-[#141A17]">
            <div className="flex items-center justify-between border-b border-[#E7DEC9] pb-2 dark:border-stone-800">
              <span className="font-semibold text-[#17191C] dark:text-stone-100">
                Açılmış ayələrin tərcüməsi (Ə. Musayev)
              </span>
              <span className="font-mono-tabular text-[11px] text-[#6B6251] dark:text-stone-400">
                {revealedCount} / {ayahs.length}
              </span>
            </div>
            <div className="mt-2.5 space-y-2.5">
              {revealedAyahsForTranslation.map((ayah) => (
                <div key={`tr-${ayahKey(ayah)}`}>
                  <p className="font-medium text-[#0E5E4C] dark:text-[#86C7AE]">
                    {cleanSurahTitle(ayah.surahName)} {ayahKey(ayah)}
                  </p>
                  <p className="mt-0.5 leading-relaxed text-[#3F3B33] dark:text-stone-300">
                    {ayah.translation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Exact Bottom Control Bar (Modeled 1:1 after muhaffidh.app) */}
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E5DEC9] bg-[#FFF6E9]/95 backdrop-blur-md dark:border-stone-800 dark:bg-[#0F1412]/95">
        <div className="relative mx-auto flex max-w-[540px] flex-nowrap items-center justify-between gap-1.5 px-3 py-2 sm:gap-2">
          {/* Settings & Navigation Popover triggered by ••• */}
          {settingsOpen && (
            <div
              role="dialog"
              aria-label="Mühafiz parametrləri"
              className="absolute bottom-full left-3 mb-2 w-72 rounded-xl border border-[#DED4BD] bg-[#FFFBF3] p-4 shadow-xl dark:border-stone-700 dark:bg-[#161D1A]"
            >
              <div className="flex items-center justify-between border-b border-[#EAE2CE] pb-2.5 dark:border-stone-800">
                <span className="text-xs font-semibold text-[#17191C] dark:text-stone-100">
                  Mühafiz Parametrləri
                </span>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  aria-label="Parametrləri bağla"
                  className="rounded p-1 text-stone-500 hover:text-stone-900 dark:text-stone-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 space-y-3 text-xs">
                {/* Quick Bulk Reveal / Hide + Navigation */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={allRevealed ? handleHideAll : handleRevealAll}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DFD5BE] bg-white px-2.5 py-2 font-medium text-stone-800 hover:border-[#0E5E4C] dark:border-stone-700 dark:bg-[#1E2622] dark:text-stone-100"
                  >
                    {allRevealed ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>Hamısını gizlət</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        <span>Hamısını göstər</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DFD5BE] bg-white px-2.5 py-2 font-medium text-stone-800 hover:border-[#0E5E4C] dark:border-stone-700 dark:bg-[#1E2622] dark:text-stone-100"
                  >
                    {isDark ? <Sun className="h-3.5 w-3.5 text-[#C6A769]" /> : <Moon className="h-3.5 w-3.5" />}
                    <span>{isDark ? 'Gündüz' : 'Gecə'}</span>
                  </button>
                </div>

                <label className="flex items-center justify-between gap-2 text-stone-700 dark:text-stone-300">
                  <span>İlk sözü ipucu kimi göstər</span>
                  <input
                    type="checkbox"
                    checked={prefs.firstWordHint}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, firstWordHint: e.target.checked }))
                    }
                    className="h-4 w-4 accent-[#0E5E4C]"
                  />
                </label>

                <label className="flex items-center justify-between gap-2 text-stone-700 dark:text-stone-300">
                  <span>Açılan ayələrin tərcüməsi</span>
                  <input
                    type="checkbox"
                    checked={prefs.showTranslation}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, showTranslation: e.target.checked }))
                    }
                    className="h-4 w-4 accent-[#0E5E4C]"
                  />
                </label>

                <label className="flex items-center justify-between gap-2 text-stone-700 dark:text-stone-300">
                  <span>Açılışda hamısını göstər</span>
                  <input
                    type="checkbox"
                    checked={prefs.autoRevealAllOnLoad}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setPrefs((p) => ({ ...p, autoRevealAllOnLoad: checked }));
                      if (checked) handleRevealAll();
                      else handleHideAll();
                    }}
                    className="h-4 w-4 accent-[#0E5E4C]"
                  />
                </label>

                <div>
                  <span className="block text-stone-500 dark:text-stone-400">Mətn ölçüsü</span>
                  <div className="mt-1 grid grid-cols-3 gap-1 rounded-lg bg-[#EFE7D5] p-1 dark:bg-[#101412]">
                    {(
                      [
                        { id: 'sm', label: 'Kiçik' },
                        { id: 'md', label: 'Orta' },
                        { id: 'lg', label: 'Böyük' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPrefs((p) => ({ ...p, fontSize: opt.id }))}
                        className={`rounded-md py-1 text-[11px] font-medium ${
                          prefs.fontSize === opt.id
                            ? 'bg-white text-stone-900 shadow-xs dark:bg-[#242D28] dark:text-stone-100'
                            : 'text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="muhaffiz-speed"
                    className="block text-stone-500 dark:text-stone-400"
                  >
                    Avtomatik açılma sürəti
                  </label>
                  <select
                    id="muhaffiz-speed"
                    value={prefs.autoIntervalMs}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, autoIntervalMs: Number(e.target.value) }))
                    }
                    className="mt-1 w-full rounded-lg border border-[#DFD5BE] bg-white px-2.5 py-1.5 text-xs text-stone-800 dark:border-stone-700 dark:bg-[#111513] dark:text-stone-100"
                  >
                    <option value={2000}>2 saniyə (Sürətli)</option>
                    <option value={3500}>3.5 saniyə (Normal)</option>
                    <option value={5000}>5 saniyə (Orta)</option>
                    <option value={8000}>8 saniyə (Yavaş)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="muhaffiz-reciter"
                    className="block text-stone-500 dark:text-stone-400"
                  >
                    Qari (Səs yoxlaması)
                  </label>
                  <select
                    id="muhaffiz-reciter"
                    value={prefs.reciter}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, reciter: e.target.value as MuhaffizReciterId }))
                    }
                    className="mt-1 w-full rounded-lg border border-[#DFD5BE] bg-white px-2.5 py-1.5 text-xs text-stone-800 dark:border-stone-700 dark:bg-[#111513] dark:text-stone-100"
                  >
                    {MUHAFFIZ_RECITERS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between border-t border-[#EAE2CE] pt-2.5 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => onNavigate(`/quran/sehife/${pageNumber}`)}
                    className="inline-flex items-center gap-1 text-[#0E5E4C] hover:underline dark:text-[#86C7AE]"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Normal oxu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('/')}
                    className="inline-flex items-center gap-1 text-stone-600 hover:underline dark:text-stone-300"
                  >
                    <Home className="h-3.5 w-3.5" />
                    <span>Ana səhifə</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1. ••• Settings Button */}
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            aria-expanded={settingsOpen}
            aria-label="Parametrlər"
            data-testid="muhaffiz-settings-btn"
            className="inline-flex h-10 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E9E1CE] text-[#3E392E] transition-colors hover:bg-[#DFD5BE] dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* 2. ← Next Page (RTL Mushaf turn page left) */}
          <button
            type="button"
            onClick={() => goToPage(pageNumber + 1)}
            disabled={pageNumber >= TOTAL_QURAN_PAGES}
            aria-label="Növbəti səhifə"
            data-testid="muhaffiz-next-page"
            className="inline-flex h-10 w-9 shrink-0 items-center justify-center rounded-xl text-[#2C2A25] transition-colors hover:bg-[#EFE7D5] disabled:text-[#B8AF9C] disabled:hover:bg-transparent dark:text-stone-200 dark:hover:bg-stone-800 dark:disabled:text-stone-600"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* 3. → Prev Page (RTL Mushaf turn page right) */}
          <button
            type="button"
            onClick={() => goToPage(pageNumber - 1)}
            disabled={pageNumber <= 1}
            aria-label="Əvvəlki səhifə"
            data-testid="muhaffiz-prev-page"
            className="inline-flex h-10 w-9 shrink-0 items-center justify-center rounded-xl text-[#2C2A25] transition-colors hover:bg-[#EFE7D5] disabled:text-[#B8AF9C] disabled:hover:bg-transparent dark:text-stone-200 dark:hover:bg-stone-800 dark:disabled:text-stone-600"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* 4. Clock / Auto-Reveal Timer */}
          <button
            type="button"
            onClick={() => {
              stopAudio();
              setIsAutoRevealing((v) => !v);
            }}
            aria-pressed={isAutoRevealing}
            aria-label={isAutoRevealing ? 'Avtomatik göstərməni saxla' : 'Avtomatik göstər'}
            data-testid="muhaffiz-auto-btn"
            className={`inline-flex h-10 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
              isAutoRevealing
                ? 'bg-[#C6A769]/25 text-[#9A7B3E] dark:text-[#E2C98A]'
                : 'text-[#2C2A25] hover:bg-[#EFE7D5] dark:text-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            {isAutoRevealing ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Clock className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {/* 5. Mic / Listen Verification */}
          <button
            type="button"
            onClick={handleToggleListen}
            aria-pressed={Boolean(playingKey)}
            aria-label={playingKey ? 'Tilavəti dayandır' : 'Tilavəti dinlə'}
            data-testid="muhaffiz-listen-btn"
            className={`inline-flex h-10 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
              playingKey
                ? 'bg-[#0E5E4C]/15 text-[#0E5E4C] dark:bg-[#196B52]/30 dark:text-[#86C7AE]'
                : 'text-[#2C2A25] hover:bg-[#EFE7D5] dark:text-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            {playingKey ? (
              <VolumeX className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Mic className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {/* 6. Wide − (Hide Last Revealed Ayah) */}
          <button
            type="button"
            onClick={handleHideLast}
            disabled={revealedCount === 0}
            aria-label="Son ayəni gizlət"
            data-testid="muhaffiz-hide-last"
            className="inline-flex h-10 flex-1 max-w-[100px] items-center justify-center rounded-xl bg-[#FCE8E6] text-[#E11D48] transition-colors hover:bg-[#FAD6D3] disabled:opacity-45 dark:bg-[#421B1E] dark:text-[#FCA5A5] dark:hover:bg-[#522226]"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* 7. Wide + (Reveal Next Ayah) */}
          <button
            type="button"
            onClick={handleRevealNext}
            disabled={allRevealed || ayahs.length === 0}
            aria-label="Növbəti ayəni göstər"
            data-testid="muhaffiz-reveal-next"
            className="inline-flex h-10 flex-1 max-w-[100px] items-center justify-center rounded-xl bg-[#E7F4E8] text-[#15803D] transition-colors hover:bg-[#D5EAD7] disabled:opacity-45 dark:bg-[#183829] dark:text-[#86EFAC] dark:hover:bg-[#1F4734]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </footer>

      {/* Page / Surah / Juz Jump Modal */}
      {jumpModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Surə, Cüz və ya Səhifəyə keçid"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setJumpModalOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#DFD5BE] bg-[#FFFBF3] shadow-2xl dark:border-stone-700 dark:bg-[#141916]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EAE2CE] px-5 py-4 dark:border-stone-800">
              <h2 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100">
                Surə, Cüz və ya Səhifə Seç
              </h2>
              <button
                type="button"
                onClick={() => setJumpModalOpen(false)}
                aria-label="Bağla"
                className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-200/70 dark:text-stone-400 dark:hover:bg-stone-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 pt-3">
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-[#EFE7D5] p-1 dark:bg-[#181E1B]">
                {(
                  [
                    { id: 'surah', label: 'Surələr (114)' },
                    { id: 'juz', label: 'Cüzlər (30)' },
                    { id: 'page', label: 'Səhifə (1–604)' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setJumpTab(t.id)}
                    className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                      jumpTab === t.id
                        ? 'bg-white text-stone-900 shadow-xs dark:bg-[#242D28] dark:text-stone-100'
                        : 'text-stone-600 hover:text-stone-900 dark:text-stone-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {jumpTab === 'surah' && (
                <div className="space-y-3">
                  <input
                    type="search"
                    value={surahSearch}
                    onChange={(e) => setSurahSearch(e.target.value)}
                    placeholder="Surə adı və ya nömrəsi ilə axtar (məs. Bəqərə, 2)..."
                    className="w-full rounded-lg border border-[#DFD5BE] bg-white px-3.5 py-2 text-xs text-stone-900 focus:border-[#0E5E4C] focus:outline-none dark:border-stone-700 dark:bg-[#111513] dark:text-stone-100"
                  />
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {filteredSurahs.map((s) => (
                      <button
                        key={s.number}
                        type="button"
                        onClick={() => goToPage(s.startPage)}
                        className="flex items-center justify-between rounded-lg border border-[#EAE2CE] bg-white px-3.5 py-2.5 text-left transition-colors hover:border-[#0E5E4C] dark:border-stone-800 dark:bg-[#181E1B]"
                      >
                        <div>
                          <p className="text-xs font-medium text-stone-900 dark:text-stone-100">
                            {s.number}. {s.name}
                          </p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            Səhifə {s.startPage} · {s.ayahCount} ayə
                          </p>
                        </div>
                        <span className="font-arabic text-base text-[#0E5E4C] dark:text-[#86C7AE]">
                          {s.arabicName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {jumpTab === 'juz' && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {JUZ_PAGE_RANGES.map((j) => (
                    <button
                      key={j.juz}
                      type="button"
                      onClick={() => goToPage(j.startPage)}
                      className="rounded-lg border border-[#EAE2CE] bg-white p-3 text-left transition-colors hover:border-[#0E5E4C] dark:border-stone-800 dark:bg-[#181E1B]"
                    >
                      <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                        {j.juz}-ci Cüz
                      </p>
                      <p className="mt-0.5 font-mono-tabular text-[11px] text-stone-500 dark:text-stone-400">
                        Səhifə {j.startPage}–{j.endPage}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {jumpTab === 'page' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    goToPage(Number.parseInt(jumpPageInput, 10) || 1);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="jump-page-number"
                      className="block text-xs font-medium text-stone-700 dark:text-stone-300"
                    >
                      Mədinə Mushafı səhifə nömrəsi (1–604)
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        id="jump-page-number"
                        type="number"
                        min={1}
                        max={TOTAL_QURAN_PAGES}
                        value={jumpPageInput}
                        onChange={(e) => setJumpPageInput(e.target.value)}
                        className="w-full rounded-lg border border-[#DFD5BE] bg-white px-3.5 py-2.5 font-mono-tabular text-sm text-stone-900 focus:border-[#0E5E4C] focus:outline-none dark:border-stone-700 dark:bg-[#111513] dark:text-stone-100"
                      />
                      <button
                        type="submit"
                        className="shrink-0 rounded-lg bg-[#0E5E4C] px-5 py-2.5 text-xs font-medium text-white hover:bg-[#0B4A3C] dark:bg-[#196B52]"
                      >
                        Aç
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
