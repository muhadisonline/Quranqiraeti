import { ArrowLeft, ArrowRight, Bookmark, Check, Copy, ImageDown, Play, Square, Volume2 } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SeoHead } from '../components/SeoHead';
import {
  useAudioPlaybackPrefs,
  useReaderDisplayMode,
  useReaderTextScale,
  useReadingGoal,
  useSavedAyahs,
} from '../hooks/useReaderPreferences';
import {
  MUHAFFIZ_RECITERS,
  MuhaffizReciterId,
  getEveryAyahAudioUrl,
} from '../lib/muhaffiz';
import {
  MushafPagePayload,
  TOTAL_QURAN_PAGES,
  buildMushafPageSeoData,
  formatAzerbaijaniOrdinal,
  getJuzForPage,
} from '../lib/quran';
import { fetchMushafPageWithFallback } from '../lib/quranClient';
import {
  AudioPlaybackSpeed,
  AyahRepeatCount,
  READER_SCALE_CLASSES,
  READER_SCALE_LABELS,
  ReaderTextScale,
  buildLastReadRecord,
  saveLastReadToStorage,
} from '../lib/readerState';
import { downloadVerseImageCard } from '../lib/verseCard';

const READER_RECITER_KEY = 'quranqiraeti_reader_reciter_v1';

interface QuranMushafPageProps {
  pageNumber: number;
  activeHash?: string;
  onNavigate: (path: string) => void;
}

export function QuranMushafPage({ pageNumber, activeHash, onNavigate }: QuranMushafPageProps) {
  const isValidPage = pageNumber >= 1 && pageNumber <= TOTAL_QURAN_PAGES;
  const [payload, setPayload] = useState<MushafPagePayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(isValidPage);
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);
  const [jumpInput, setJumpInput] = useState<string>(String(pageNumber));
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [reciter, setReciter] = useState<MuhaffizReciterId>(() => {
    try {
      const saved = localStorage.getItem(READER_RECITER_KEY);
      if (saved && MUHAFFIZ_RECITERS.some((r) => r.id === saved)) {
        return saved as MuhaffizReciterId;
      }
    } catch {
      // ignore storage error
    }
    return 'Alafasy_128kbps';
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const { isSaved: isAyahSaved, toggleAyahBookmark } = useSavedAyahs();
  const { textScale, setTextScale } = useReaderTextScale();
  const { displayMode, setDisplayMode } = useReaderDisplayMode();
  const { playbackSpeed, setPlaybackSpeed, repeatCount, setRepeatCount } = useAudioPlaybackPrefs();
  const { recordPageRead } = useReadingGoal();

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
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    try {
      localStorage.setItem(READER_RECITER_KEY, reciter);
    } catch {
      // ignore storage error
    }
  }, [reciter]);

  useEffect(() => {
    setJumpInput(String(pageNumber));
    setAudioError(null);
    stopAudio();
    if (isValidPage) {
      saveLastReadToStorage(
        buildLastReadRecord('page', pageNumber, `Mədinə səhifəsi ${pageNumber}`)
      );
      recordPageRead(pageNumber);
    }
  }, [pageNumber, isValidPage, stopAudio, recordPageRead]);

  useEffect(() => {
    if (!isValidPage) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
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
      if (e.key === 'ArrowRight' && pageNumber < TOTAL_QURAN_PAGES) {
        e.preventDefault();
        onNavigate(`/quran/sehife/${pageNumber + 1}`);
      } else if (e.key === 'ArrowLeft' && pageNumber > 1) {
        e.preventDefault();
        onNavigate(`/quran/sehife/${pageNumber - 1}`);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isValidPage, pageNumber, onNavigate]);

  useEffect(() => {
    if (!playingKey) return;
    const [sStr, aStr] = playingKey.split(':');
    const el = document.querySelector(`[data-ayah-anchor="${sStr}-${aStr}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [playingKey]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  useEffect(() => {
    if (!isValidPage) return;
    const controller = new AbortController();
    let cancelled = false;

    async function loadPage() {
      setIsLoading(true);
      setError('');
      try {
        const data = await fetchMushafPageWithFallback(pageNumber, controller.signal);
        if (!cancelled) setPayload(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!cancelled) {
          setError(
            'Quran səhifəsi hazırda yüklənə bilmədi. Zəhmət olmasa yenidən cəhd edin.'
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPage();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [pageNumber, isValidPage, retryCount]);

  const pageOrdinal = formatAzerbaijaniOrdinal(pageNumber);

  const seoData = useMemo(
    () => buildMushafPageSeoData(pageNumber, window.location.origin, payload),
    [pageNumber, payload]
  );

  const highlightedAnchorId = useMemo(() => {
    const rawHash = activeHash || (typeof window !== 'undefined' ? window.location.hash : '');
    if (!rawHash || !payload) return null;
    const fullMatch = rawHash.match(/^#ayah-(\d+)-(\d+)$/);
    if (fullMatch) {
      const sNum = Number.parseInt(fullMatch[1], 10);
      const aNum = Number.parseInt(fullMatch[2], 10);
      const exists = payload.ayahs.some((a) => a.surahNumber === sNum && a.ayahNumber === aNum);
      return exists ? `ayah-${sNum}-${aNum}` : null;
    }
    const singleMatch = rawHash.match(/^#ayah-(\d+)$/);
    if (singleMatch) {
      const aNum = Number.parseInt(singleMatch[1], 10);
      const match = payload.ayahs.find((a) => a.ayahNumber === aNum);
      return match ? `ayah-${match.surahNumber}-${match.ayahNumber}` : null;
    }
    return null;
  }, [activeHash, payload]);

  useEffect(() => {
    if (!payload || !highlightedAnchorId) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(highlightedAnchorId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);
    return () => window.clearTimeout(timer);
  }, [payload, highlightedAnchorId]);

  const playAyahAtIndex = useCallback(
    (index: number, remainingRepeats?: number) => {
      const list = payload?.ayahs ?? [];
      if (index < 0 || index >= list.length) {
        stopAudio();
        return;
      }
      const repeatsLeft = remainingRepeats ?? repeatCount;
      const ayah = list[index];
      const key = `${ayah.surahNumber}:${ayah.ayahNumber}`;
      stopAudio();
      setAudioError(null);

      const audio = new Audio(getEveryAyahAudioUrl(ayah.surahNumber, ayah.ayahNumber, reciter));
      audio.playbackRate = playbackSpeed;
      audioRef.current = audio;
      setPlayingKey(key);

      audio.onended = () => {
        if (audioRef.current !== audio) return;
        if (repeatsLeft === 0) {
          playAyahAtIndex(index, 0);
        } else if (repeatsLeft > 1) {
          playAyahAtIndex(index, repeatsLeft - 1);
        } else if (index + 1 < list.length) {
          playAyahAtIndex(index + 1, repeatCount);
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
    [payload, reciter, playbackSpeed, repeatCount, stopAudio]
  );

  function handleToggleAyahAudio(surahNum: number, ayahNum: number) {
    const key = `${surahNum}:${ayahNum}`;
    if (playingKey === key) {
      stopAudio();
      return;
    }
    const list = payload?.ayahs ?? [];
    const idx = list.findIndex((a) => a.surahNumber === surahNum && a.ayahNumber === ayahNum);
    if (idx >= 0) {
      playAyahAtIndex(idx);
    }
  }

  function handlePlayAllPage() {
    if (playingKey) {
      stopAudio();
      return;
    }
    const list = payload?.ayahs ?? [];
    if (list.length === 0) return;
    if (highlightedAnchorId) {
      const startIdx = list.findIndex(
        (a) => `ayah-${a.surahNumber}-${a.ayahNumber}` === highlightedAnchorId
      );
      if (startIdx >= 0) {
        playAyahAtIndex(startIdx);
        return;
      }
    }
    playAyahAtIndex(0);
  }

  if (!isValidPage) {
    return (
      <section className="py-20" data-testid="mushaf-not-found">
        <SeoHead
          title="Mushaf səhifəsi tapılmadı (404) | Quran Qiraeti"
          description="Mədinə Mushafı səhifələri 1 ilə 604 arasında nömrələnmişdir."
          path="/quran"
          robots="noindex, nofollow"
        />
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="font-display text-3xl font-semibold text-stone-900 dark:text-stone-100">
            Səhifə tapılmadı
          </h1>
          <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
            Qurani-Kərim səhifələri 1 ilə 604 arasında nömrələnmişdir.
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

  function handleJumpSubmit(e: FormEvent) {
    e.preventDefault();
    const num = Number.parseInt(jumpInput.trim(), 10);
    if (Number.isNaN(num)) return;
    const clamped = Math.min(TOTAL_QURAN_PAGES, Math.max(1, num));
    onNavigate(`/quran/sehife/${clamped}`);
  }

  async function handleCopyAyah(
    surahNum: number,
    surahName: string,
    ayahNum: number,
    arabic: string,
    translation: string
  ) {
    const key = `${surahNum}:${ayahNum}`;
    const text = `${arabic}\n\n"${translation}"\n(${surahName}, ${key} — Əlixan Musayev tərcüməsi)`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((cur) => (cur === key ? null : cur));
      }, 2000);
    } catch {
      // ignore clipboard error
    }
  }

  const juzNumber = payload?.juzNumber ?? getJuzForPage(pageNumber);
  const juzOrdinal = formatAzerbaijaniOrdinal(juzNumber);

  return (
    <article className="py-12 lg:py-16">
      <SeoHead
        title={seoData.title}
        description={seoData.description}
        path={`/quran/sehife/${pageNumber}`}
        ogImage="/og-default.png"
        ogType="article"
        prevPath={seoData.prevPath}
        nextPath={seoData.nextPath}
        jsonLd={seoData.jsonLd}
      />

      <div className="mx-auto max-w-5xl px-6">
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
            Tam Qurani-Kərim
          </a>
          <span aria-hidden="true">›</span>
          <span className="font-medium text-stone-900 dark:text-stone-200">{pageOrdinal} səhifə</span>
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

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`/muhaffiz/${pageNumber}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(`/muhaffiz/${pageNumber}`);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F4C3A] px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0B3A2C] dark:bg-[#196B52]"
            >
              <span>Bu səhifəni Mühafizdə əzbərlə</span>
            </a>

            <form onSubmit={handleJumpSubmit} className="flex items-center gap-2">
              <label htmlFor="mushaf-jump-input" className="text-xs text-stone-500 dark:text-stone-400">
                Səhifə:
              </label>
              <input
                id="mushaf-jump-input"
                type="number"
                min={1}
                max={TOTAL_QURAN_PAGES}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                className="w-20 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-center font-mono-tabular text-xs text-stone-900 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100"
              />
              <button
                type="submit"
                className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
              >
                Keç
              </button>
            </form>
          </div>
        </div>

        {/* Page Header */}
        <header className="mt-6 flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-stone-800">
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
              <span className="font-mono-tabular">Səhifə {pageNumber} / {TOTAL_QURAN_PAGES}</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span className="font-mono-tabular">{juzOrdinal} Cüz</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>Mədinə çapı</span>
              {payload && (
                <>
                  <span aria-hidden="true" className="mx-1.5">·</span>
                  <span data-testid="mushaf-ayah-count" className="font-mono-tabular">
                    {payload.ayahs.length} ayə
                  </span>
                </>
              )}
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>
                Əlixan Musayev (v{(payload?.editionVersion ?? '1.0.4').replace(/^v/i, '')})
              </span>
            </p>
            <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-100">
              Qurani-Kərim — {pageOrdinal} səhifə
            </h1>
            {seoData.summaryText && (
              <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
                Bu Mədinə səhifəsində: {seoData.summaryText}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-[#0F4C3A] dark:text-[#86C7AE]" aria-hidden="true" />
              <label htmlFor="mushaf-reciter-select" className="sr-only">
                Qari seçimi
              </label>
              <select
                id="mushaf-reciter-select"
                value={reciter}
                onChange={(e) => {
                  stopAudio();
                  setReciter(e.target.value as MuhaffizReciterId);
                }}
                data-testid="mushaf-reciter-select"
                className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100"
              >
                {MUHAFFIZ_RECITERS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {payload && payload.ayahs.length > 0 && (
              <button
                type="button"
                onClick={handlePlayAllPage}
                data-testid="mushaf-play-all"
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  playingKey
                    ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                    : 'border border-stone-200 bg-white text-stone-700 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200'
                }`}
              >
                {playingKey ? (
                  <>
                    <Square className="h-3 w-3 fill-current" aria-hidden="true" />
                    <span>Dayandır</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                    <span>Hamısını dinlə</span>
                  </>
                )}
              </button>
            )}

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
                data-testid="mushaf-display-mode"
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                  displayMode === 'arabic'
                    ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                    : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                }`}
              >
                {displayMode === 'arabic' ? 'Ərəbcə' : 'AZ + AR'}
              </button>
            </div>

            <div
              role="group"
              aria-label="Tilavət sürəti"
              data-testid="mushaf-audio-speed"
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
              data-testid="mushaf-audio-repeat"
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

            {payload && payload.surahsOnPage.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {payload.surahsOnPage.map((s) => (
                  <a
                    key={s.surahNumber}
                    href={`/quran/sure/${s.surahNumber}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/quran/sure/${s.surahNumber}`);
                    }}
                    className="text-xs font-medium text-[#0F4C3A] underline decoration-[#0F4C3A]/40 underline-offset-4 hover:decoration-[#0F4C3A] dark:text-[#86C7AE]"
                  >
                    {s.surahNumber}. {s.surahName}
                  </a>
                ))}
              </div>
            )}
          </div>
        </header>

        {audioError && (
          <p
            role="status"
            className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300"
          >
            {audioError}
          </p>
        )}

        {/* Page Content */}
        {isLoading ? (
          <div className="mt-6 divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-[#141916]">
            {[1, 2, 3].map((row) => (
              <div key={row} className="p-6">
                <div className="h-4 w-16 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
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
        ) : payload ? (
          <div
            data-testid="mushaf-page-ayahs"
            className="mt-6 divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-[#141916]"
          >
            {payload.ayahs.map((ayah, idx) => {
              const prevAyah = idx > 0 ? payload.ayahs[idx - 1] : undefined;
              const isNewSurah = !prevAyah || prevAyah.surahNumber !== ayah.surahNumber;
              const showBismillah =
                ayah.ayahNumber === 1 && ayah.surahNumber !== 1 && ayah.surahNumber !== 9;
              const key = `${ayah.surahNumber}:${ayah.ayahNumber}`;
              const anchorId = `ayah-${ayah.surahNumber}-${ayah.ayahNumber}`;
              const isCopied = copiedKey === key;
              const isPlaying = playingKey === key;
              const isHighlighted = highlightedAnchorId === anchorId;

              return (
                <div
                  key={key}
                  id={anchorId}
                  data-ayah-anchor={`${ayah.surahNumber}-${ayah.ayahNumber}`}
                  className={`p-6 sm:p-7 transition-colors ${
                    isHighlighted
                      ? 'bg-[#0F4C3A]/6 ring-2 ring-inset ring-[#0F4C3A]/45 dark:bg-[#196B52]/15 dark:ring-[#86C7AE]/40'
                      : isPlaying
                        ? 'bg-[#0F4C3A]/4 dark:bg-[#196B52]/10'
                        : ''
                  }`}
                >
                  {isNewSurah && (
                    <div className="mb-5 flex flex-col gap-2 border-b border-stone-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-stone-800">
                      <a
                        href={`/quran/sure/${ayah.surahNumber}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(`/quran/sure/${ayah.surahNumber}`);
                        }}
                        className="font-display text-xl font-semibold text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
                      >
                        {ayah.surahNumber}. {ayah.surahName}
                      </a>
                      <span dir="rtl" lang="ar" className="font-arabic text-xl text-stone-800 dark:text-stone-200">
                        {ayah.arabicSurahName}
                      </span>
                    </div>
                  )}

                  {showBismillah && (
                    <p
                      dir="rtl"
                      lang="ar"
                      className="font-arabic mb-5 text-center text-xl text-stone-700 dark:text-stone-300"
                    >
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <a
                      href={`#${anchorId}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`/quran/sehife/${pageNumber}#${anchorId}`);
                      }}
                      className="font-mono-tabular text-xs font-semibold text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
                    >
                      {key}
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAyahAudio(ayah.surahNumber, ayah.ayahNumber)}
                        aria-pressed={isPlaying}
                        aria-label={isPlaying ? `${key} ayəsini dayandır` : `${key} ayəsini dinlə`}
                        data-testid={`mushaf-play-ayah-${ayah.surahNumber}-${ayah.ayahNumber}`}
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
                            surahName: ayah.surahName,
                            pageNumber,
                            arabicText: ayah.arabicText,
                            translation: ayah.translation,
                          })
                        }
                        aria-pressed={isAyahSaved(ayah.surahNumber, ayah.ayahNumber)}
                        aria-label={
                          isAyahSaved(ayah.surahNumber, ayah.ayahNumber)
                            ? `${key} ayəsini əlfəcindən çıxar`
                            : `${key} ayəsini əlfəcinlərə saxla`
                        }
                        data-testid={`mushaf-bookmark-ayah-${ayah.surahNumber}-${ayah.ayahNumber}`}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                          isAyahSaved(ayah.surahNumber, ayah.ayahNumber)
                            ? 'border-[#0F4C3A] bg-[#0F4C3A]/10 font-medium text-[#0F4C3A] dark:border-[#86C7AE] dark:bg-[#86C7AE]/15 dark:text-[#86C7AE]'
                            : 'border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900 dark:border-stone-700 dark:text-stone-400 dark:hover:text-stone-100'
                        }`}
                      >
                        <Bookmark
                          className={`h-3.5 w-3.5 ${isAyahSaved(ayah.surahNumber, ayah.ayahNumber) ? 'fill-current' : ''}`}
                          aria-hidden="true"
                        />
                        <span>{isAyahSaved(ayah.surahNumber, ayah.ayahNumber) ? 'Saxlanılıb' : 'Saxla'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopyAyah(
                            ayah.surahNumber,
                            ayah.surahName,
                            ayah.ayahNumber,
                            ayah.arabicText,
                            ayah.translation
                          )
                        }
                        aria-label={`${key} ayəsini və tərcüməsini köçür`}
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
                            surahName: ayah.surahName,
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

                  <p
                    dir="rtl"
                    lang="ar"
                    className={`font-arabic mt-4 text-right ${READER_SCALE_CLASSES[textScale].arabic} text-stone-900 dark:text-stone-100`}
                  >
                    {ayah.arabicText}
                  </p>

                  {displayMode === 'both' && (
                    <>
                      <p lang="az" className={`mt-4 ${READER_SCALE_CLASSES[textScale].translation} text-stone-700 dark:text-stone-300`}>
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
              );
            })}
          </div>
        ) : null}

        {/* Prev / Next Mushaf Page Navigation */}
        <nav
          aria-label="Quran səhifələri arası keçid"
          className="mt-10 flex items-center justify-between gap-4 border-t border-stone-200 pt-8 dark:border-stone-800"
        >
          {pageNumber > 1 ? (
            <a
              href={`/quran/sehife/${pageNumber - 1}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(`/quran/sehife/${pageNumber - 1}`);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-xs font-medium text-stone-700 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Əvvəlki səhifə ({pageNumber - 1})</span>
            </a>
          ) : (
            <span />
          )}

          {pageNumber < TOTAL_QURAN_PAGES && (
            <a
              href={`/quran/sehife/${pageNumber + 1}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(`/quran/sehife/${pageNumber + 1}`);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F4C3A] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#0B3A2C] dark:bg-[#196B52]"
            >
              <span>Növbəti səhifə ({pageNumber + 1})</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
        </nav>
      </div>
    </article>
  );
}
