import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  Columns2,
  Copy,
  Crosshair,
  Eye,
  ImageDown,
  Moon,
  Play,
  Search,
  Square,
  Sun,
  Timer,
  Volume2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LineFocusBar } from '../components/LineFocusBar';
import { MatchingShortsStrip } from '../components/MatchingShortsStrip';
import { SeoHead } from '../components/SeoHead';
import { TajweedArabicText, TajweedLegendBar } from '../components/TajweedArabicText';
import { useGlobalAudio } from '../contexts/GlobalAudioContext';
import {
  useAyahHighlights,
  useLineFocusReader,
  useReaderDisplayMode,
  useReaderLayoutMode,
  useReaderTajweed,
  useReaderTextScale,
  useReaderTransliteration,
  useSavedAyahs,
  useVerseCopyTemplate,
} from '../hooks/useReaderPreferences';
import {
  HIGHLIGHT_COLOR_META,
  getAyahHighlightMarkClass,
} from '../lib/ayahHighlighter';
import {
  formatLineFocusProgress,
  resolveFocusedAyahKey,
  stepFocusedAyahKey,
} from '../lib/readingFocus';
import { findMatchingShortsForAyahRange } from '../lib/shortsMatcher';
import {
  formatSleepTimerPresetLabel,
  formatSleepTimerRemaining,
} from '../lib/sleepTimer';
import { transliterateArabicToAz } from '../lib/transliteration';
import {
  VERSE_COPY_TEMPLATES,
  VerseCopyTemplateId,
  formatVerseWithTemplate,
} from '../lib/verseCopyTemplates';
import {
  RecitationVideo,
  SurahTranslationPayload,
  filterSurahAyahs,
} from '../lib/channel';
import {
  MUHAFFIZ_RECITERS,
  MuhaffizReciterId,
  resolveMuhaffizReciter,
} from '../lib/muhaffiz';
import {
  AudioPlaybackSpeed,
  AyahRepeatCount,
  READER_SCALE_CLASSES,
  READER_SCALE_LABELS,
  ReaderTextScale,
  buildLastReadRecord,
  saveLastReadToStorage,
} from '../lib/readerState';
import {
  TOTAL_QURAN_SURAHS,
  formatAzerbaijaniOrdinal,
  getSurahByNumber,
  groupAyahsByMushafPage,
} from '../lib/quran';
import { fetchSurahWithFallback } from '../lib/quranClient';
import {
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildSurahFaqEntries,
} from '../lib/seo';
import { downloadVerseImageCard } from '../lib/verseCard';

interface QuranSurahPageProps {
  surahNumber: number;
  channelVideos: RecitationVideo[];
  activeHash?: string;
  isDark: boolean;
  onNavigate: (path: string) => void;
  onPlayVideo: (video: RecitationVideo) => void;
  onToggleTheme: () => void;
}

export function QuranSurahPage({
  surahNumber,
  channelVideos,
  activeHash,
  isDark,
  onNavigate,
  onPlayVideo,
  onToggleTheme,
}: QuranSurahPageProps) {
  const surah = getSurahByNumber(surahNumber);
  const prevSurah = surahNumber > 1 ? getSurahByNumber(surahNumber - 1) : undefined;
  const nextSurah =
    surahNumber < TOTAL_QURAN_SURAHS ? getSurahByNumber(surahNumber + 1) : undefined;

  const [payload, setPayload] = useState<SurahTranslationPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);
  const [query, setQuery] = useState<string>('');
  const [selectedMushafPage, setSelectedMushafPage] = useState<number | null>(null);
  const [showAllPages, setShowAllPages] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const {
    reciter,
    setReciter,
    playingKey,
    audioError,
    playbackSpeed,
    setPlaybackSpeed,
    repeatCount,
    setRepeatCount,
    autoFocus,
    setAutoFocus,
    sleepMinutes,
    sleepRemainingSec,
    cycleSleepMinutes,
    playAyahQueue,
    playFullSurah,
    stop: stopGlobalAudio,
  } = useGlobalAudio();

  const { isSaved, toggleAyahBookmark } = useSavedAyahs();
  const { textScale, setTextScale } = useReaderTextScale();
  const { displayMode, setDisplayMode } = useReaderDisplayMode();
  const { layoutMode, setLayoutMode } = useReaderLayoutMode();
  const { showTranslit, setShowTranslit } = useReaderTransliteration();
  const { showTajweed, setShowTajweed } = useReaderTajweed();
  const { lineFocus, setLineFocus } = useLineFocusReader();
  const { getHighlightColor, toggleHighlight } = useAyahHighlights();
  const { copyTemplate, setCopyTemplate } = useVerseCopyTemplate();
  const [manualFocusedKey, setManualFocusedKey] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const paramReciter = new URLSearchParams(window.location.search).get('reciter');
    if (paramReciter) {
      const resolved = resolveMuhaffizReciter(paramReciter);
      if (resolved.id !== reciter) {
        setReciter(resolved.id);
      }
    }
    // Sync only on surah entry if URL explicitly requests a reciter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahNumber]);

  useEffect(() => {
    if (surah) {
      saveLastReadToStorage(
        buildLastReadRecord('surah', surah.number, `${surah.number}. ${surah.name} surəsi`)
      );
    }
  }, [surah]);

  useEffect(() => {
    setQuery('');
    setSelectedMushafPage(null);
    setShowAllPages(false);
    setManualFocusedKey(null);
  }, [surahNumber]);

  useEffect(() => {
    if (!playingKey || !autoFocus) return;
    if (!playingKey.startsWith(`${surahNumber}:`)) return;
    const [, ayahStr] = playingKey.split(':');
    const el = document.getElementById(`ayah-${ayahStr}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [playingKey, autoFocus, surahNumber]);

  useEffect(() => {
    if (!surah) return;
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const data = await fetchSurahWithFallback(surahNumber, controller.signal);
        if (!cancelled) setPayload(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!cancelled) {
          setError(
            'Surənin ərəbcə mətni və tərcüməsi hazırda yüklənə bilmədi. Zəhmət olmasa yenidən cəhd edin.'
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [surahNumber, surah, retryCount]);

  const matchingVideos = useMemo(
    () => channelVideos.filter((v) => v.surahNumber === surahNumber).slice(0, 3),
    [channelVideos, surahNumber]
  );

  const pageGroups = useMemo(
    () => groupAyahsByMushafPage(payload?.ayahs ?? [], surah?.startPage ?? 1),
    [payload, surah]
  );

  const activeGroup = useMemo(() => {
    if (pageGroups.length === 0) return null;
    if (selectedMushafPage !== null) {
      const found = pageGroups.find((g) => g.pageNumber === selectedMushafPage);
      if (found) return found;
    }
    return pageGroups[0];
  }, [pageGroups, selectedMushafPage]);

  const activeGroupIndex = useMemo(() => {
    if (!activeGroup) return -1;
    return pageGroups.findIndex((g) => g.pageNumber === activeGroup.pageNumber);
  }, [pageGroups, activeGroup]);

  const filteredAyahs = useMemo(() => {
    const ayahs = payload?.ayahs ?? [];
    return filterSurahAyahs(ayahs, {
      mode: 'full',
      query,
    });
  }, [payload, query]);

  const displayedAyahs = useMemo(() => {
    if (query.trim()) return filteredAyahs;
    if (showAllPages) return filteredAyahs;
    if (activeGroup) return activeGroup.ayahs;
    return filteredAyahs;
  }, [filteredAyahs, query, showAllPages, activeGroup]);

  const matchingShorts = useMemo(
    () =>
      findMatchingShortsForAyahRange(
        channelVideos,
        surahNumber,
        displayedAyahs.map((a) => a.ayahNumber)
      ),
    [channelVideos, surahNumber, displayedAyahs]
  );

  const highlightedAyahNumber = useMemo(() => {
    const rawHash = activeHash || (typeof window !== 'undefined' ? window.location.hash : '');
    if (!rawHash) return null;
    const surahScoped = rawHash.match(/^#ayah-(\d+)-(\d+)$/);
    if (surahScoped) {
      const targetSurah = Number.parseInt(surahScoped[1], 10);
      const targetAyah = Number.parseInt(surahScoped[2], 10);
      return targetSurah === surahNumber ? targetAyah : null;
    }
    const single = rawHash.match(/^#ayah-(\d+)$/);
    return single ? Number.parseInt(single[1], 10) : null;
  }, [activeHash, surahNumber]);

  useEffect(() => {
    if (!payload || highlightedAyahNumber === null) return;
    const ownerGroup = pageGroups.find((g) =>
      g.ayahs.some((a) => a.ayahNumber === highlightedAyahNumber)
    );
    if (ownerGroup && !showAllPages && activeGroup?.pageNumber !== ownerGroup.pageNumber) {
      setSelectedMushafPage(ownerGroup.pageNumber);
      return;
    }
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`ayah-${highlightedAyahNumber}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);
    return () => window.clearTimeout(timer);
  }, [payload, highlightedAyahNumber, pageGroups, showAllPages, activeGroup]);

  const displayedAyahKeys = useMemo(
    () => displayedAyahs.map((a) => `${a.surahNumber}:${a.ayahNumber}`),
    [displayedAyahs]
  );

  const highlightedLineKey =
    highlightedAyahNumber !== null ? `${surahNumber}:${highlightedAyahNumber}` : null;

  const activeLineFocusKey = useMemo(
    () =>
      resolveFocusedAyahKey(displayedAyahKeys, {
        playingKey,
        manualKey: manualFocusedKey,
        highlightedKey: highlightedLineKey,
      }),
    [displayedAyahKeys, playingKey, manualFocusedKey, highlightedLineKey]
  );

  const lineFocusProgress = useMemo(
    () => formatLineFocusProgress(displayedAyahKeys, activeLineFocusKey),
    [displayedAyahKeys, activeLineFocusKey]
  );

  const stepLineFocus = useCallback(
    (delta: -1 | 1) => {
      const nextKey = stepFocusedAyahKey(displayedAyahKeys, activeLineFocusKey, delta);
      if (!nextKey) return;
      setManualFocusedKey(nextKey);
      const [sStr, aStr] = nextKey.split(':');
      const el = document.querySelector(`[data-ayah-anchor="${sStr}-${aStr}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [displayedAyahKeys, activeLineFocusKey]
  );

  useEffect(() => {
    if (!lineFocus) return;
    function handleFocusKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        stepLineFocus(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        stepLineFocus(-1);
      } else if (e.key === 'Escape') {
        setLineFocus(false);
      }
    }
    window.addEventListener('keydown', handleFocusKeyDown);
    return () => window.removeEventListener('keydown', handleFocusKeyDown);
  }, [lineFocus, stepLineFocus, setLineFocus]);

  useEffect(() => {
    if (query.trim() || showAllPages || pageGroups.length <= 1 || activeGroupIndex < 0) {
      return;
    }
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'ArrowRight' && activeGroupIndex < pageGroups.length - 1) {
        e.preventDefault();
        setSelectedMushafPage(pageGroups[activeGroupIndex + 1].pageNumber);
      } else if (e.key === 'ArrowLeft' && activeGroupIndex > 0) {
        e.preventDefault();
        setSelectedMushafPage(pageGroups[activeGroupIndex - 1].pageNumber);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [query, showAllPages, pageGroups, activeGroupIndex]);

  const isThisSurahPlayingAyah = Boolean(playingKey && playingKey.startsWith(`${surahNumber}:`));
  const isFullSurahPlayingHere = playingKey === `full-surah:${surahNumber}`;

  function handleToggleAyahAudio(ayahNumber: number) {
    const key = `${surahNumber}:${ayahNumber}`;
    if (playingKey === key) {
      stopGlobalAudio();
      return;
    }
    const idx = displayedAyahs.findIndex((a) => a.ayahNumber === ayahNumber);
    if (idx >= 0) {
      playAyahQueue(
        displayedAyahs.map((a) => ({
          surahNumber: a.surahNumber,
          surahName: surah?.name ?? `Surə ${surahNumber}`,
          ayahNumber: a.ayahNumber,
        })),
        idx,
        { sourcePath: `/quran/sure/${surahNumber}#ayah-${ayahNumber}` }
      );
    }
  }

  function handlePlayAllDisplayed() {
    if (isThisSurahPlayingAyah) {
      stopGlobalAudio();
      return;
    }
    if (displayedAyahs.length === 0) return;
    const queue = displayedAyahs.map((a) => ({
      surahNumber: a.surahNumber,
      surahName: surah?.name ?? `Surə ${surahNumber}`,
      ayahNumber: a.ayahNumber,
    }));
    if (highlightedAyahNumber !== null) {
      const startIdx = displayedAyahs.findIndex((a) => a.ayahNumber === highlightedAyahNumber);
      if (startIdx >= 0) {
        playAyahQueue(queue, startIdx, {
          sourcePath: `/quran/sure/${surahNumber}#ayah-${highlightedAyahNumber}`,
        });
        return;
      }
    }
    playAyahQueue(queue, 0, { sourcePath: `/quran/sure/${surahNumber}` });
  }

  function handlePlayFullSurah() {
    if (isFullSurahPlayingHere) {
      stopGlobalAudio();
      return;
    }
    playFullSurah(surahNumber, `/quran/sure/${surahNumber}`);
  }

  const firstPage = pageGroups[0]?.pageNumber ?? surah?.startPage;
  const lastPage = pageGroups[pageGroups.length - 1]?.pageNumber ?? surah?.startPage;
  const pageSpanLabel =
    firstPage && lastPage
      ? firstPage === lastPage
        ? `Səhifə ${firstPage}`
        : `Səhifə ${firstPage}–${lastPage}`
      : '';

  const faqEntries = useMemo(
    () => (surah ? buildSurahFaqEntries(surah, lastPage) : []),
    [surah, lastPage]
  );

  const jsonLd = useMemo(() => {
    if (!surah) return undefined;
    const origin = window.location.origin;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'Chapter',
        name: `${surah.number}. ${surah.name} surəsi`,
        position: surah.number,
        inLanguage: ['ar', 'az'],
        url: `${origin}/quran/sure/${surah.number}`,
        translator: {
          '@type': 'Person',
          name: 'Əlixan Musayev',
        },
      },
      buildBreadcrumbJsonLd(origin, [
        { name: 'Ana səhifə', path: '/' },
        { name: 'Qurani-Kərim', path: '/quran' },
        { name: `${surah.name} surəsi`, path: `/quran/sure/${surah.number}` },
      ]),
      buildFaqPageJsonLd(faqEntries),
    ];
  }, [surah, faqEntries]);

  if (!surah) {
    return (
      <section className="py-20" data-testid="surah-not-found">
        <SeoHead
          title="Surə tapılmadı (404) | Quran Qiraeti"
          description="Qurani-Kərimdə surə nömrəsi 1 ilə 114 arasında olmalıdır."
          path="/quran"
          robots="noindex, nofollow"
        />
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="font-display text-3xl font-semibold text-stone-900 dark:text-stone-100">
            Surə tapılmadı
          </h1>
          <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
            Qurani-Kərimdə surə nömrəsi 1 ilə 114 arasında olmalıdır.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/quran')}
            className="mt-6 rounded-lg bg-[#0F4C3A] px-5 py-2.5 text-xs font-medium text-white"
          >
            Tam Qurana qayıt
          </button>
        </div>
      </section>
    );
  }

  async function handleCopyAyah(
    ayahNum: number,
    arabic: string,
    translation: string,
    pageNum?: number
  ) {
    const key = `${surahNumber}:${ayahNum}`;
    const text = formatVerseWithTemplate(copyTemplate, {
      surahName: surah?.name ?? `Surə ${surahNumber}`,
      surahNumber,
      ayahNumber: ayahNum,
      arabicText: arabic,
      translation,
      pageNumber: pageNum,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((cur) => (cur === key ? null : cur));
      }, 2000);
    } catch {
      // ignore clipboard errors
    }
  }

  function handleSelectMushafPage(pageNum: number) {
    setShowAllPages(false);
    setSelectedMushafPage(pageNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const targetMushafPage = activeGroup?.pageNumber ?? surah.startPage;

  return (
    <article className="py-12 lg:py-16">
      <SeoHead
        title={`${surah.number}. ${surah.name} surəsi — Ərəbcə və Tərcümə | Quran Qiraeti`}
        description={`${surah.name} surəsi (${surah.ayahCount} ayə, ${surah.revelationPlace}, Mədinə çapı ${pageSpanLabel}). Hər səhifədə Mədinə çapındakı dəqiq ayə sayı, ərəbcə mətn və Əlixan Musayevin son nəşr Azərbaycan tərcüməsi (v1.0.4).`}
        path={`/quran/sure/${surah.number}`}
        ogImage="/og-default.png"
        ogType="article"
        prevPath={prevSurah ? `/quran/sure/${prevSurah.number}` : undefined}
        nextPath={nextSurah ? `/quran/sure/${nextSurah.number}` : undefined}
        jsonLd={jsonLd}
      />

      <div className={`mx-auto px-6 ${layoutMode === 'book' ? 'max-w-6xl' : 'max-w-5xl'}`}>
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]"
          >
            Ana səhifə
          </a>
          <span aria-hidden="true">›</span>
          <a
            href="/quran"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/quran');
            }}
            className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]"
          >
            Qurani-Kərim
          </a>
          <span aria-hidden="true">›</span>
          <span className="font-medium text-stone-900 dark:text-stone-200">{surah.name} surəsi</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <a
            href="/quran"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/quran');
            }}
            className="inline-flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-[#0F4C3A] dark:text-stone-400 dark:hover:text-[#86C7AE]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Tam Quran siyahısına qayıt</span>
          </a>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`/muhaffiz/${targetMushafPage}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(`/muhaffiz/${targetMushafPage}`);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F4C3A] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#0B3A2C] dark:bg-[#196B52]"
            >
              <span>Mühafizdə əzbərlə</span>
            </a>

            <a
              href={`/quran/sehife/${targetMushafPage}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(`/quran/sehife/${targetMushafPage}`);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Mədinə səhifəsi {targetMushafPage}</span>
            </a>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Gündüz oxu rejiminə keç' : 'Gecə oxu rejiminə keç'}
              data-testid="surah-theme-toggle"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 whitespace-nowrap transition-colors hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
            >
              {isDark ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-[#C6A769]" aria-hidden="true" />
                  <span>Gündüz</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-[#0F4C3A]" aria-hidden="true" />
                  <span>Gecə</span>
                </>
              )}
            </button>
          </div>
        </div>

        <header className="mt-6 flex flex-col gap-4 border-b border-stone-200 pb-8 sm:flex-row sm:items-end sm:justify-between dark:border-stone-800">
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
              <span className="font-mono-tabular">{formatAzerbaijaniOrdinal(surah.number)} surə</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>{surah.revelationPlace}</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span className="font-mono-tabular">{surah.ayahCount} ayə</span>
              {pageSpanLabel && (
                <>
                  <span aria-hidden="true" className="mx-1.5">·</span>
                  <span className="font-mono-tabular">Mədinə çapı: {pageSpanLabel}</span>
                </>
              )}
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>
                Əlixan Musayev (v{(payload?.editionVersion ?? '1.0.4').replace(/^v/i, '')})
              </span>
            </p>
            <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-100">
              {surah.name} surəsi
            </h1>
          </div>

          <span
            dir="rtl"
            lang="ar"
            className="font-arabic text-3xl text-[#0F4C3A] dark:text-[#86C7AE] shrink-0"
          >
            {surah.arabicName}
          </span>
        </header>

        {/* Bismillah header for surahs except Fatihə (1) and Tövbə (9) */}
        {surah.number !== 1 && surah.number !== 9 && (showAllPages || activeGroupIndex <= 0) && (
          <div className="mt-8 rounded-xl border border-stone-200 bg-[#F3F1EC] px-6 py-5 text-center dark:border-stone-800 dark:bg-[#141916]">
            <p dir="rtl" lang="ar" className="font-arabic text-2xl text-stone-900 dark:text-stone-100">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>
            <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
              Mərhəmətli və Rəhmli Allahın adı ilə!
            </p>
          </div>
        )}

        {/* Search & Madinah Page Controls */}
        {!isLoading && !error && payload && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {surah.ayahCount > 7 ? (
                <div className="relative w-full sm:max-w-sm">
                  <label htmlFor="surah-page-search" className="sr-only">
                    Surə daxilində ayə axtar
                  </label>
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400"
                    aria-hidden="true"
                  />
                  <input
                    id="surah-page-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ayə nömrəsi (məs. 16) və ya söz axtar..."
                    className="w-full rounded-lg border border-stone-200 bg-white py-2 pr-9 pl-10 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Axtarışı təmizlə"
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              ) : (
                <div />
              )}

              <div className="flex flex-wrap items-center gap-2.5 text-xs text-stone-500 dark:text-stone-400">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-[#0F4C3A] dark:text-[#86C7AE]" aria-hidden="true" />
                  <label htmlFor="surah-reciter-select" className="sr-only">
                    Qari seçimi
                  </label>
                  <select
                    id="surah-reciter-select"
                    value={reciter}
                    onChange={(e) => {
                      setReciter(e.target.value as MuhaffizReciterId);
                    }}
                    data-testid="surah-reciter-select"
                    className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100"
                  >
                    {MUHAFFIZ_RECITERS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {displayedAyahs.length > 0 && (
                  <button
                    type="button"
                    onClick={handlePlayAllDisplayed}
                    data-testid="surah-play-all"
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                      isThisSurahPlayingAyah
                        ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                        : 'border border-stone-200 bg-white text-stone-700 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200'
                    }`}
                  >
                    {isThisSurahPlayingAyah ? (
                      <>
                        <Square className="h-3 w-3 fill-current" aria-hidden="true" />
                        <span>Ayələri dayandır</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                        <span>Ayə-ayə dinlə</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePlayFullSurah}
                  data-testid="surah-play-full-mp3"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    isFullSurahPlayingHere
                      ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                      : 'border border-stone-200 bg-white text-stone-700 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200'
                  }`}
                >
                  {isFullSurahPlayingHere ? (
                    <>
                      <Square className="h-3 w-3 fill-current" aria-hidden="true" />
                      <span>Dayandır</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                      <span>Tam surə</span>
                    </>
                  )}
                </button>

                <div
                  role="group"
                  aria-label="Mətn ölçüsü"
                  className="inline-flex items-center gap-0.5 rounded-lg border border-stone-200 bg-white p-0.5 dark:border-stone-700 dark:bg-[#141916]"
                >
                  {(['compact', 'normal', 'large'] as ReaderTextScale[]).map((scaleKey) => (
                    <button
                      key={scaleKey}
                      type="button"
                      onClick={() => setTextScale(scaleKey)}
                      aria-pressed={textScale === scaleKey}
                      title={`Mətn ölçüsü: ${READER_SCALE_LABELS[scaleKey]}`}
                      className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                        textScale === scaleKey
                          ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                          : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                      }`}
                    >
                      {scaleKey === 'compact' ? 'A-' : scaleKey === 'normal' ? 'A' : 'A+'}
                    </button>
                  ))}
                </div>

                <div
                  role="group"
                  aria-label="Oxu görünüşü"
                  className="inline-flex items-center gap-0.5 rounded-lg border border-stone-200 bg-white p-0.5 dark:border-stone-700 dark:bg-[#141916]"
                >
                  <button
                    type="button"
                    onClick={() => setDisplayMode(displayMode === 'both' ? 'arabic' : 'both')}
                    aria-pressed={displayMode === 'arabic'}
                    data-testid="surah-display-mode"
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                      displayMode === 'arabic'
                        ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                        : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                    }`}
                  >
                    {displayMode === 'arabic' ? 'Ərəbcə' : 'AZ + AR'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTranslit(!showTranslit)}
                    aria-pressed={showTranslit}
                    data-testid="surah-translit-toggle"
                    title="Ərəbcə ayələrin Azərbaycan Latın əlifbası ilə oxunuşunu göstər"
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                      showTranslit
                        ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                        : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                    }`}
                  >
                    Oxunuş
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTajweed(!showTajweed)}
                    aria-pressed={showTajweed}
                    data-testid="surah-tajweed-toggle"
                    title="Təcvid qaydalarını rənglərlə göstər (Ğünnə, Qalqələ, İxfa, İdğam, Mədd)"
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                      showTajweed
                        ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                        : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                    }`}
                  >
                    Təcvid
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode(layoutMode === 'book' ? 'stacked' : 'book')}
                    aria-pressed={layoutMode === 'book'}
                    data-testid="surah-layout-toggle"
                    title="Geniş ekranlarda iki sütunlu paralel kitab görünüşü"
                    className={`hidden lg:inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                      layoutMode === 'book'
                        ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                        : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                    }`}
                  >
                    <Columns2 className="h-3 w-3" aria-hidden="true" />
                    <span>Kitab (2 sütun)</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <label htmlFor="surah-copy-template-select" className="sr-only">
                    Kopyalama şablonu
                  </label>
                  <select
                    id="surah-copy-template-select"
                    value={copyTemplate}
                    onChange={(e) => setCopyTemplate(e.target.value as VerseCopyTemplateId)}
                    data-testid="surah-copy-template-select"
                    title="Ayə kopyalama şablonu"
                    className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-stone-700 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
                  >
                    {VERSE_COPY_TEMPLATES.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        Şablon: {tpl.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  role="group"
                  aria-label="Tilavət sürəti"
                  data-testid="surah-audio-speed"
                  className="inline-flex items-center gap-0.5 rounded-lg border border-stone-200 bg-white p-0.5 dark:border-stone-700 dark:bg-[#141916]"
                >
                  {([0.75, 1, 1.25] as AudioPlaybackSpeed[]).map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setPlaybackSpeed(spd)}
                      aria-pressed={playbackSpeed === spd}
                      className={`rounded-md px-2 py-1 font-mono-tabular text-[11px] font-medium transition-colors ${
                        playbackSpeed === spd
                          ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                          : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                      }`}
                    >
                      {spd}×
                    </button>
                  ))}
                </div>

                <div
                  role="group"
                  aria-label="Ayə təkrarı"
                  data-testid="surah-audio-repeat"
                  className="inline-flex items-center gap-0.5 rounded-lg border border-stone-200 bg-white p-0.5 dark:border-stone-700 dark:bg-[#141916]"
                >
                  {(
                    [
                      { val: 1 as AyahRepeatCount, label: '1×' },
                      { val: 3 as AyahRepeatCount, label: '3×' },
                      { val: 0 as AyahRepeatCount, label: '∞' },
                    ]
                  ).map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setRepeatCount(opt.val)}
                      aria-pressed={repeatCount === opt.val}
                      title={opt.val === 0 ? 'Ayəni sonsuz təkrarla' : `Hər ayəni ${opt.val} dəfə oxu`}
                      className={`rounded-md px-2 py-1 font-mono-tabular text-[11px] font-medium transition-colors ${
                        repeatCount === opt.val
                          ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                          : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white p-0.5 dark:border-stone-700 dark:bg-[#141916]">
                  <button
                    type="button"
                    onClick={() => setAutoFocus(!autoFocus)}
                    aria-pressed={autoFocus}
                    data-testid="surah-auto-focus-toggle"
                    title="Tilavət zamanı oxunan ayəyə avtomatik fokuslan"
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                      autoFocus
                        ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                        : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                    }`}
                  >
                    <Crosshair className="h-3 w-3" aria-hidden="true" />
                    <span>Fokus</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLineFocus(!lineFocus)}
                    aria-pressed={lineFocus}
                    data-testid="surah-line-focus-toggle"
                    title="Sətir Fokus (Qaranlıq Pərdə): Yalnız aktiv ayəni aydın saxla"
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                      lineFocus
                        ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                        : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                    }`}
                  >
                    <Eye className="h-3 w-3" aria-hidden="true" />
                    <span>Pərdə</span>
                  </button>
                  <button
                    type="button"
                    onClick={cycleSleepMinutes}
                    data-testid="surah-sleep-timer-btn"
                    aria-label={`Yuxu taymeri: ${sleepMinutes > 0 && sleepRemainingSec > 0 ? formatSleepTimerRemaining(sleepRemainingSec) : formatSleepTimerPresetLabel(sleepMinutes)}`}
                    title="Tilavət yuxu taymeri (Bağlı / 15 / 30 / 45 / 60 dəq)"
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono-tabular text-[11px] font-medium whitespace-nowrap transition-colors ${
                      sleepMinutes > 0
                        ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                        : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                    }`}
                  >
                    <Timer className="h-3 w-3" aria-hidden="true" />
                    <span>
                      {sleepMinutes > 0 && sleepRemainingSec > 0
                        ? formatSleepTimerRemaining(sleepRemainingSec)
                        : 'Yuxu'}
                    </span>
                  </button>
                </div>

                {query.trim() ? (
                  <span>{filteredAyahs.length} uyğun ayə tapıldı</span>
                ) : activeGroup && !showAllPages ? (
                  <span data-testid="surah-page-summary">
                    Mədinə çapı ·{' '}
                    <span className="font-mono-tabular font-semibold text-stone-900 dark:text-stone-100">
                      Səhifə {activeGroup.pageNumber}
                    </span>{' '}
                    · <span className="font-mono-tabular">{activeGroup.ayahCount} ayə</span> (
                    <span className="font-mono-tabular">{activeGroup.ayahRangeLabel}</span>)
                  </span>
                ) : (
                  <span>
                    Bütün surə ({payload.ayahs.length} ayə) göstərilir
                  </span>
                )}

                {!query.trim() && pageGroups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowAllPages((prev) => !prev)}
                    className="font-medium text-[#0F4C3A] underline decoration-[#0F4C3A]/40 underline-offset-4 hover:decoration-[#0F4C3A] dark:text-[#86C7AE]"
                  >
                    {showAllPages ? 'Mədinə səhifələri üzrə böl' : 'Hamısını birlikdə oxu'}
                  </button>
                )}
              </div>
            </div>

            {audioError && (
              <p
                role="status"
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300"
              >
                {audioError}
              </p>
            )}

            {/* Madinah Mushaf Page Selector Strip */}
            {!query.trim() && pageGroups.length > 1 && (
              <div
                data-testid="surah-mushaf-pager"
                className="rounded-xl border border-stone-200 bg-[#F7F5F0] p-4 dark:border-stone-800 dark:bg-[#141916]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200/80 dark:border-stone-800">
                  <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
                    Mədinə çapı səhifələri ({pageGroups.length} səhifə)
                  </p>
                  {activeGroup && !showAllPages && (
                    <a
                      href={`/quran/sehife/${activeGroup.pageNumber}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`/quran/sehife/${activeGroup.pageNumber}`);
                      }}
                      className="text-xs font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
                    >
                      {activeGroup.pageNumber}-ci səhifəni ayrıca SEO səhifəsində aç →
                    </a>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pageGroups.map((group) => {
                    const isSelected = !showAllPages && activeGroup?.pageNumber === group.pageNumber;
                    return (
                      <button
                        key={group.pageNumber}
                        type="button"
                        onClick={() => handleSelectMushafPage(group.pageNumber)}
                        title={`Səhifə ${group.pageNumber}: ${group.ayahCount} ayə (${group.ayahRangeLabel})`}
                        className={`rounded-md border px-2.5 py-1.5 font-mono-tabular text-xs transition-colors ${
                          isSelected
                            ? 'border-[#0F4C3A] bg-[#0F4C3A] font-semibold text-white dark:border-[#196B52] dark:bg-[#196B52]'
                            : 'border-stone-200 bg-white text-stone-700 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-300'
                        }`}
                      >
                        Səh. {group.pageNumber}{' '}
                        <span className={isSelected ? 'text-white/80' : 'text-stone-400'}>
                          ({group.ayahCount})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {showTajweed && <TajweedLegendBar onClose={() => setShowTajweed(false)} />}

        {!isLoading && !error && matchingShorts.length > 0 && (
          <MatchingShortsStrip
            matches={matchingShorts}
            onPlayVideo={onPlayVideo}
            className="mt-6"
          />
        )}

        {/* Ayahs */}
        {isLoading ? (
          <div className="mt-6 divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-[#141916]">
            {[1, 2, 3].map((row) => (
              <div key={row} className="p-6">
                <div className="h-4 w-14 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                <div className="mt-4 ml-auto h-7 w-3/4 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                <div className="mt-4 h-4 w-full animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-stone-200 bg-[#F3F1EC] p-6 text-center dark:border-stone-800 dark:bg-[#141916]">
            <p className="text-sm text-stone-700 dark:text-stone-300">{error}</p>
            <button
              type="button"
              onClick={() => setRetryCount((n) => n + 1)}
              className="mt-4 rounded-lg bg-[#0F4C3A] px-4 py-2 text-xs font-medium text-white"
            >
              Yenidən cəhd et
            </button>
          </div>
        ) : displayedAyahs.length === 0 ? (
          <div className="mt-6 rounded-xl border border-stone-200 bg-[#F3F1EC] p-6 text-center dark:border-stone-800 dark:bg-[#141916]">
            <p className="text-sm text-stone-700 dark:text-stone-300">
              Axtarışınıza uyğun ayə tapılmadı.
            </p>
          </div>
        ) : (
          <>
            {lineFocus && displayedAyahs.length > 0 && (
              <LineFocusBar
                focusedKey={activeLineFocusKey}
                progressLabel={lineFocusProgress.label}
                canStepPrev={lineFocusProgress.index > 1}
                canStepNext={lineFocusProgress.index < lineFocusProgress.total}
                onStepPrev={() => stepLineFocus(-1)}
                onStepNext={() => stepLineFocus(1)}
                onClose={() => setLineFocus(false)}
              />
            )}
            <div
              data-testid="surah-ayah-list"
              className="mt-6 divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-[#141916]"
            >
              {displayedAyahs.map((ayah) => {
                const key = `${ayah.surahNumber}:${ayah.ayahNumber}`;
                const isCopied = copiedKey === key;
                const isPlaying = playingKey === key;
                const isHighlighted = highlightedAyahNumber === ayah.ayahNumber;
                const isLineFocused = lineFocus && activeLineFocusKey === key;
                const isLineDimmed = lineFocus && activeLineFocusKey !== key;
                const markerColor = getHighlightColor(ayah.surahNumber, ayah.ayahNumber);
                const markerClass = getAyahHighlightMarkClass(markerColor);
                const useBookGrid = layoutMode === 'book' && displayMode === 'both';

                return (
                  <div
                    key={key}
                    id={`ayah-${ayah.ayahNumber}`}
                    data-ayah-anchor={`${ayah.surahNumber}-${ayah.ayahNumber}`}
                    data-auto-focused={isPlaying && autoFocus ? 'true' : undefined}
                    data-line-focused={isLineFocused ? 'true' : undefined}
                    data-line-dimmed={isLineDimmed ? 'true' : undefined}
                    data-highlight-color={markerColor ?? undefined}
                    onClick={(e) => {
                      if (!lineFocus) return;
                      const targetEl = e.target as HTMLElement | null;
                      if (targetEl?.closest('a, button, input, select')) return;
                      setManualFocusedKey(key);
                    }}
                    className={`p-6 sm:p-7 transition-all duration-200 ${
                      isLineFocused
                        ? 'relative z-10 bg-white opacity-100 ring-2 ring-inset ring-[#0F4C3A]/65 shadow-sm dark:bg-[#141916] dark:ring-[#86C7AE]/65'
                        : isLineDimmed
                          ? 'cursor-pointer opacity-30 hover:opacity-75'
                          : isPlaying
                            ? 'bg-[#0F4C3A]/8 ring-2 ring-inset ring-[#0F4C3A]/45 dark:bg-[#196B52]/20 dark:ring-[#86C7AE]/45'
                            : isHighlighted
                              ? 'bg-[#0F4C3A]/6 ring-2 ring-inset ring-[#0F4C3A]/45 dark:bg-[#196B52]/15 dark:ring-[#86C7AE]/40'
                              : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        <a
                          href={`#ayah-${ayah.ayahNumber}`}
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate(`/quran/sure/${surahNumber}#ayah-${ayah.ayahNumber}`);
                          }}
                          className="font-mono-tabular font-semibold text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
                        >
                          {key}
                        </a>
                        {ayah.pageNumber && (
                          <a
                            href={`/quran/sehife/${ayah.pageNumber}#ayah-${ayah.surahNumber}-${ayah.ayahNumber}`}
                            onClick={(e) => {
                              e.preventDefault();
                              onNavigate(`/quran/sehife/${ayah.pageNumber}#ayah-${ayah.surahNumber}-${ayah.ayahNumber}`);
                            }}
                            className="font-mono-tabular text-stone-400 hover:text-[#0F4C3A] dark:text-stone-500 dark:hover:text-[#86C7AE]"
                          >
                            · Səh. {ayah.pageNumber}
                          </a>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* 3-Color Arabic Highlighter Swatches (#9) */}
                        <div
                          role="group"
                          aria-label={`${key} ayəsini rənglə vurğula`}
                          data-testid={`highlight-picker-${ayah.surahNumber}-${ayah.ayahNumber}`}
                          className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-1.5 py-1 dark:border-stone-700"
                        >
                          {HIGHLIGHT_COLOR_META.map((colorMeta) => {
                            const active = markerColor === colorMeta.id;
                            return (
                              <button
                                key={colorMeta.id}
                                type="button"
                                onClick={() =>
                                  toggleHighlight(ayah.surahNumber, ayah.ayahNumber, colorMeta.id)
                                }
                                aria-pressed={active}
                                aria-label={`${colorMeta.label} marker`}
                                title={`${colorMeta.label} marker ilə vurğula`}
                                data-testid={`highlight-${colorMeta.id}-${ayah.surahNumber}-${ayah.ayahNumber}`}
                                className={`h-3.5 w-3.5 rounded-full border transition-transform ${colorMeta.swatchClass} ${
                                  active
                                    ? 'scale-110 ring-2 ring-[#0F4C3A] ring-offset-1 dark:ring-[#86C7AE] dark:ring-offset-[#141916]'
                                    : 'opacity-75 hover:opacity-100'
                                }`}
                              />
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleAyahAudio(ayah.ayahNumber)}
                          aria-pressed={isPlaying}
                          aria-label={isPlaying ? `${key} ayəsini dayandır` : `${key} ayəsini dinlə`}
                          data-testid={`surah-play-ayah-${ayah.ayahNumber}`}
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
                            isPlaying
                              ? 'border-[#0F4C3A] bg-[#0F4C3A] font-medium text-white dark:border-[#196B52] dark:bg-[#196B52]'
                              : 'border-stone-200 text-stone-600 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:text-stone-300 dark:hover:border-[#86C7AE]'
                          }`}
                        >
                          {isPlaying ? (
                            <>
                              <Square className="h-3 w-3 fill-current" aria-hidden="true" />
                              <span>Dayandır</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Dinlə</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleAyahBookmark({
                              surahNumber: ayah.surahNumber,
                              ayahNumber: ayah.ayahNumber,
                              surahName: surah.name,
                              pageNumber: ayah.pageNumber,
                              arabicText: ayah.arabicText,
                              translation: ayah.translation,
                            })
                          }
                          aria-pressed={isSaved(ayah.surahNumber, ayah.ayahNumber)}
                          aria-label={
                            isSaved(ayah.surahNumber, ayah.ayahNumber)
                              ? `${key} ayəsini əlfəcindən çıxar`
                              : `${key} ayəsini əlfəcinlərə saxla`
                          }
                          data-testid={`surah-bookmark-ayah-${ayah.ayahNumber}`}
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                            isSaved(ayah.surahNumber, ayah.ayahNumber)
                              ? 'border-[#0F4C3A] bg-[#0F4C3A]/10 font-medium text-[#0F4C3A] dark:border-[#86C7AE] dark:bg-[#86C7AE]/15 dark:text-[#86C7AE]'
                              : 'border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900 dark:border-stone-700 dark:text-stone-400 dark:hover:text-stone-100'
                          }`}
                        >
                          <Bookmark
                            className={`h-3.5 w-3.5 ${isSaved(ayah.surahNumber, ayah.ayahNumber) ? 'fill-current' : ''}`}
                            aria-hidden="true"
                          />
                          <span>{isSaved(ayah.surahNumber, ayah.ayahNumber) ? 'Saxlanılıb' : 'Saxla'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleCopyAyah(
                              ayah.ayahNumber,
                              ayah.arabicText,
                              ayah.translation,
                              ayah.pageNumber
                            )
                          }
                          aria-label={`${key} ayəsini və tərcüməsini köçür`}
                          data-testid={`surah-copy-ayah-${ayah.ayahNumber}`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 px-2.5 py-1 text-xs text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900 dark:border-stone-700 dark:text-stone-400 dark:hover:border-stone-600 dark:hover:text-stone-100"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-[#0F4C3A] dark:text-[#86C7AE]" aria-hidden="true" />
                              <span>Köçürüldü</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Köçür</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void downloadVerseImageCard({
                              surahName: surah.name,
                              surahNumber: ayah.surahNumber,
                              ayahNumber: ayah.ayahNumber,
                              arabicText: ayah.arabicText,
                              translation: ayah.translation,
                              theme: document.documentElement.classList.contains('dark')
                                ? 'emerald'
                                : 'parchment',
                            })
                          }
                          aria-label={`${key} ayəsini şəkil kartı kimi endir`}
                          className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-600 transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:text-stone-400"
                        >
                          <ImageDown className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Şəkil</span>
                        </button>
                      </div>
                    </div>

                    <div
                      className={
                        useBookGrid
                          ? 'mt-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8'
                          : ''
                      }
                      data-layout-mode={useBookGrid ? 'book' : 'stacked'}
                    >
                      <div
                        className={
                          useBookGrid
                            ? 'lg:order-2 lg:border-l lg:border-stone-200/80 lg:pl-8 dark:lg:border-stone-800'
                            : ''
                        }
                      >
                        <p
                          dir="rtl"
                          lang="ar"
                          className={`font-arabic ${useBookGrid ? 'mt-0' : 'mt-4'} text-right ${READER_SCALE_CLASSES[textScale].arabic} text-stone-900 dark:text-stone-100`}
                        >
                          <span className={markerClass ? `box-decoration-clone ${markerClass}` : ''}>
                            <TajweedArabicText text={ayah.arabicText} enabled={showTajweed} />
                          </span>
                        </p>
                      </div>

                      {(showTranslit || displayMode === 'both') && (
                        <div className={useBookGrid ? 'lg:order-1' : ''}>
                          {showTranslit && (
                            <p
                              lang="az-Latn"
                              data-testid={`surah-translit-${ayah.ayahNumber}`}
                              className={`${useBookGrid ? 'mt-0 mb-3' : 'mt-3'} text-sm leading-relaxed font-medium text-[#0F4C3A] dark:text-[#86C7AE]`}
                            >
                              {transliterateArabicToAz(ayah.arabicText)}
                            </p>
                          )}

                          {displayMode === 'both' && (
                            <>
                              <p
                                lang="az"
                                className={`${useBookGrid ? 'mt-0' : 'mt-4'} ${READER_SCALE_CLASSES[textScale].translation} text-stone-700 dark:text-stone-300`}
                              >
                                {ayah.translation}
                              </p>

                              {ayah.footnotes && (
                                <p lang="az" className="mt-2.5 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                                  {ayah.footnotes}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Prev / Next Madinah Page Controls inside Surah */}
            {!query.trim() && !showAllPages && pageGroups.length > 1 && activeGroup && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                {activeGroupIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectMushafPage(pageGroups[activeGroupIndex - 1].pageNumber)
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-xs font-medium text-stone-700 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      Əvvəlki səhifə (Səh. {pageGroups[activeGroupIndex - 1].pageNumber})
                    </span>
                  </button>
                ) : (
                  <span />
                )}

                {activeGroupIndex < pageGroups.length - 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectMushafPage(pageGroups[activeGroupIndex + 1].pageNumber)
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0F4C3A] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#0B3A2C] dark:bg-[#196B52]"
                  >
                    <span>
                      Növbəti səhifə (Səh. {pageGroups[activeGroupIndex + 1].pageNumber} ·{' '}
                      {pageGroups[activeGroupIndex + 1].ayahCount} ayə)
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Channel recitations for this surah */}
        {matchingVideos.length > 0 && (
          <div className="mt-12 border-t border-stone-200 pt-10 dark:border-stone-800">
            <h2 className="font-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
              Kanaldakı {surah.name} tilavətləri
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {matchingVideos.map((vid) => (
                <div
                  key={vid.videoId}
                  className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-[#141916]"
                >
                  <div className="relative aspect-video bg-stone-100 dark:bg-stone-900">
                    <img
                      src={vid.thumbnailUrl}
                      alt={vid.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => onPlayVideo(vid)}
                      aria-label={`${vid.title} tilavətini dinlə`}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/35"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#0F4C3A]">
                        <Play className="h-4 w-4 fill-current ml-0.5" aria-hidden="true" />
                      </span>
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {vid.reciter} · <span className="font-mono-tabular">{vid.duration}</span>
                    </p>
                    <a
                      href={`/video/${vid.videoId}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`/video/${vid.videoId}`);
                      }}
                      className="font-display mt-1 block text-lg font-semibold text-stone-900 hover:text-[#0F4C3A] dark:text-stone-100 dark:hover:text-[#86C7AE]"
                    >
                      {vid.title}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Surah FAQ Section for Rich Search Results */}
        <section
          aria-labelledby="surah-faq-heading"
          data-testid="surah-faq-section"
          className="mt-12 border-t border-stone-200 pt-10 dark:border-stone-800"
        >
          <h2
            id="surah-faq-heading"
            className="font-display text-2xl font-semibold text-stone-900 dark:text-stone-100"
          >
            {surah.name} surəsi haqqında tez-tez verilən suallar
          </h2>
          <div className="mt-4 space-y-3">
            {faqEntries.map((item) => (
              <details
                key={item.question}
                open
                className="rounded-xl border border-stone-200 bg-[#F7F5F0] px-5 py-4 dark:border-stone-800 dark:bg-[#141916]"
              >
                <summary className="cursor-pointer font-display text-base font-semibold text-stone-900 dark:text-stone-100">
                  {item.question}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Previous / Next Surah Navigation */}
        <nav
          aria-label="Surələr arası keçid"
          className="mt-12 flex items-center justify-between gap-4 border-t border-stone-200 pt-8 dark:border-stone-800"
        >
          {prevSurah ? (
            <a
              href={`/quran/sure/${prevSurah.number}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(`/quran/sure/${prevSurah.number}`);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-xs font-medium text-stone-700 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>
                {prevSurah.number}. {prevSurah.name} surəsi
              </span>
            </a>
          ) : (
            <span />
          )}

          {nextSurah && (
            <a
              href={`/quran/sure/${nextSurah.number}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(`/quran/sure/${nextSurah.number}`);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F4C3A] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#0B3A2C] dark:bg-[#196B52]"
            >
              <span>
                {nextSurah.number}. {nextSurah.name} surəsi
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
        </nav>
      </div>
    </article>
  );
}
