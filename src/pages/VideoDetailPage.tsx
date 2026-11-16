import { ArrowLeft, BookOpen, Bookmark, Check, Copy, ExternalLink, ImageDown, Play, Search, Square, Volume2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SeoHead } from '../components/SeoHead';
import {
  useAudioPlaybackPrefs,
  useReaderDisplayMode,
  useReaderTextScale,
  useSavedAyahs,
} from '../hooks/useReaderPreferences';
import {
  RecitationVideo,
  SurahTranslationPayload,
  buildVideoJsonLd,
  filterSurahAyahs,
  formatAzerbaijaniDate,
  formatViewCount,
  getMentionedSurahs,
} from '../lib/channel';
import {
  MUHAFFIZ_RECITERS,
  MuhaffizReciterId,
  getEveryAyahAudioUrl,
} from '../lib/muhaffiz';
import { getSurahByNumber } from '../lib/quran';
import { fetchSurahWithFallback } from '../lib/quranClient';
import {
  AudioPlaybackSpeed,
  AyahRepeatCount,
  READER_SCALE_CLASSES,
  READER_SCALE_LABELS,
  ReaderTextScale,
} from '../lib/readerState';
import { buildBreadcrumbJsonLd } from '../lib/seo';
import { downloadVerseImageCard } from '../lib/verseCard';

const READER_RECITER_KEY = 'quranqiraeti_reader_reciter_v1';

interface VideoDetailPageProps {
  video: RecitationVideo | undefined;
  relatedVideos: RecitationVideo[];
  isSaved: boolean;
  isChannelLoading?: boolean;
  activeHash?: string;
  onNavigate: (path: string) => void;
  onToggleSave: (videoId: string) => void;
}

const INITIAL_AYAH_LIMIT = 30;

export function VideoDetailPage({
  video,
  relatedVideos,
  isSaved,
  isChannelLoading = false,
  activeHash,
  onNavigate,
  onToggleSave,
}: VideoDetailPageProps) {
  const mentionedSurahs = useMemo(() => {
    if (!video) return [];
    return getMentionedSurahs(video.rawTitle, video.surahNumber);
  }, [video]);

  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(
    video?.surahNumber ?? 1
  );
  const [translationData, setTranslationData] = useState<SurahTranslationPayload | null>(null);
  const [isTranslationLoading, setIsTranslationLoading] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string>('');
  const [retryCounter, setRetryCounter] = useState<number>(0);

  const hasExcerpt = Boolean(
    video &&
      video.ayahStart &&
      video.ayahEnd &&
      selectedSurahNumber === video.surahNumber
  );

  const [viewMode, setViewMode] = useState<'excerpt' | 'full'>(
    video?.ayahStart && video?.ayahEnd ? 'excerpt' : 'full'
  );
  const [ayahQuery, setAyahQuery] = useState<string>('');
  const [visibleLimit, setVisibleLimit] = useState<number>(INITIAL_AYAH_LIMIT);
  const [copiedAyahKey, setCopiedAyahKey] = useState<string | null>(null);

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
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  useEffect(() => {
    if (!playingKey) return;
    const [sStr, aStr] = playingKey.split(':');
    const el = document.getElementById(`ayah-${sStr}-${aStr}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [playingKey]);

  useEffect(() => {
    if (!video) return;
    setSelectedSurahNumber(video.surahNumber);
    setViewMode(video.ayahStart && video.ayahEnd ? 'excerpt' : 'full');
    setAyahQuery('');
    setVisibleLimit(INITIAL_AYAH_LIMIT);
    setAudioError(null);
    stopAudio();
  }, [video?.videoId, video?.surahNumber, video?.ayahStart, video?.ayahEnd, stopAudio]);

  useEffect(() => {
    if (!video) return;
    const controller = new AbortController();
    let cancelled = false;

    async function loadSurah() {
      setIsTranslationLoading(true);
      setTranslationError('');
      try {
        const payload = await fetchSurahWithFallback(selectedSurahNumber, controller.signal);
        if (!cancelled) {
          setTranslationData(payload);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!cancelled) {
          setTranslationError(
            'Ayələrin ərəbcə mətni və tərcüməsi hazırda yüklənə bilmədi. Zəhmət olmasa yenidən cəhd edin.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsTranslationLoading(false);
        }
      }
    }

    loadSurah();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [video?.videoId, selectedSurahNumber, retryCounter]);

  const jsonLd = useMemo(() => {
    if (!video) return undefined;
    const origin = window.location.origin;
    return [
      buildVideoJsonLd(video, origin),
      buildBreadcrumbJsonLd(origin, [
        { name: 'Ana səhifə', path: '/' },
        ...(video.format === 'short' ? [{ name: 'Shorts', path: '/shorts' }] : []),
        { name: video.title, path: `/video/${video.videoId}` },
      ]),
    ];
  }, [video]);

  const activeSurahMeta = useMemo(() => {
    return (
      mentionedSurahs.find((s) => s.surahNumber === selectedSurahNumber) ??
      mentionedSurahs[0]
    );
  }, [mentionedSurahs, selectedSurahNumber]);

  const catalogSurah = useMemo(
    () => getSurahByNumber(selectedSurahNumber),
    [selectedSurahNumber]
  );

  const filteredAyahs = useMemo(() => {
    const ayahs = translationData?.ayahs ?? [];
    return filterSurahAyahs(ayahs, {
      mode: hasExcerpt ? viewMode : 'full',
      ayahStart: hasExcerpt ? video?.ayahStart : undefined,
      ayahEnd: hasExcerpt ? video?.ayahEnd : undefined,
      query: ayahQuery,
    });
  }, [translationData, hasExcerpt, viewMode, video?.ayahStart, video?.ayahEnd, ayahQuery]);

  const displayedAyahs = useMemo(() => {
    if (ayahQuery.trim()) return filteredAyahs;
    return filteredAyahs.slice(0, visibleLimit);
  }, [filteredAyahs, ayahQuery, visibleLimit]);

  const highlightedAyahKey = useMemo(() => {
    const rawHash = activeHash || (typeof window !== 'undefined' ? window.location.hash : '');
    if (!rawHash) return null;
    const surahScoped = rawHash.match(/^#ayah-(\d+)-(\d+)$/);
    if (surahScoped) {
      return `${Number.parseInt(surahScoped[1], 10)}:${Number.parseInt(surahScoped[2], 10)}`;
    }
    const single = rawHash.match(/^#ayah-(\d+)$/);
    if (single) {
      return `${selectedSurahNumber}:${Number.parseInt(single[1], 10)}`;
    }
    return null;
  }, [activeHash, selectedSurahNumber]);

  useEffect(() => {
    if (!translationData || !highlightedAyahKey) return;
    const targetIdx = filteredAyahs.findIndex(
      (a) => `${a.surahNumber}:${a.ayahNumber}` === highlightedAyahKey
    );
    if (targetIdx >= 0 && !ayahQuery.trim() && targetIdx >= visibleLimit) {
      setVisibleLimit(targetIdx + 10);
      return;
    }
    const [sStr, aStr] = highlightedAyahKey.split(':');
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`ayah-${sStr}-${aStr}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);
    return () => window.clearTimeout(timer);
  }, [translationData, highlightedAyahKey, filteredAyahs, ayahQuery, visibleLimit]);

  const playAyahAtIndex = useCallback(
    (index: number, remainingRepeats?: number) => {
      if (index < 0 || index >= displayedAyahs.length) {
        stopAudio();
        return;
      }
      const repeatsLeft = remainingRepeats ?? repeatCount;
      const ayah = displayedAyahs[index];
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
        } else if (index + 1 < displayedAyahs.length) {
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
    [displayedAyahs, reciter, playbackSpeed, repeatCount, stopAudio]
  );

  function handleToggleAyahAudio(key: string) {
    if (playingKey === key) {
      stopAudio();
      return;
    }
    const idx = displayedAyahs.findIndex((a) => `${a.surahNumber}:${a.ayahNumber}` === key);
    if (idx >= 0) {
      playAyahAtIndex(idx);
    }
  }

  function handlePlayAllDisplayed() {
    if (playingKey) {
      stopAudio();
      return;
    }
    if (displayedAyahs.length === 0) return;
    if (highlightedAyahKey) {
      const startIdx = displayedAyahs.findIndex(
        (a) => `${a.surahNumber}:${a.ayahNumber}` === highlightedAyahKey
      );
      if (startIdx >= 0) {
        playAyahAtIndex(startIdx);
        return;
      }
    }
    playAyahAtIndex(0);
  }

  if (!video && isChannelLoading) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-xl border border-stone-200 bg-white p-10 text-center dark:border-stone-800 dark:bg-[#141916]">
            <p className="font-display text-2xl font-medium text-stone-900 dark:text-stone-100">
              Video və ayələr yüklənir...
            </p>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
              Kanal arxivi və ayə tərcümələri hazırlanır.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!video) {
    return (
      <section className="py-20" data-testid="video-not-found">
        <SeoHead
          title="Video tapılmadı (404) | Quran Qiraeti"
          description="Axtardığınız tilavət arxivi mövcud deyil və ya silinib."
          path="/"
          robots="noindex, nofollow"
        />
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="font-display text-3xl font-semibold text-stone-900 dark:text-stone-100">
            Video tapılmadı
          </h1>
          <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
            Axtardığınız tilavət arxivi mövcud deyil və ya silinib.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="mt-6 rounded-lg bg-[#0F4C3A] px-5 py-2.5 text-xs font-medium text-white"
          >
            Ana səhifəyə qayıt
          </button>
        </div>
      </section>
    );
  }

  const backPath = video.format === 'short' ? '/shorts' : '/';
  const backLabel = video.format === 'short' ? 'Shorts bölməsinə qayıt' : 'Uzun videolara qayıt';
  const totalAyahCount = translationData?.ayahs.length ?? 0;

  async function handleCopyAyah(surahNum: number, ayahNum: number, arabic: string, translation: string) {
    const key = `${surahNum}:${ayahNum}`;
    const text = `${arabic}\n\n"${translation}"\n(${activeSurahMeta?.surahName ?? video?.surahName}, ${key} — Əlixan Musayev tərcüməsi)`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAyahKey(key);
      window.setTimeout(() => {
        setCopiedAyahKey((current) => (current === key ? null : current));
      }, 2000);
    } catch {
      // Clipboard unavailable in restricted contexts
    }
  }

  return (
    <article className="py-12 lg:py-16">
      <SeoHead
        title={`${video.title} — ${video.reciter} | Quran Qiraeti`}
        description={video.seoDescription}
        path={`/video/${video.videoId}`}
        ogImage={video.thumbnailUrl}
        ogType="video.other"
        jsonLd={jsonLd}
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
          {video.format === 'short' && (
            <>
              <span aria-hidden="true">›</span>
              <a
                href="/shorts"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/shorts');
                }}
                className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]"
              >
                Shorts
              </a>
            </>
          )}
          <span aria-hidden="true">›</span>
          <span className="truncate font-medium text-stone-900 dark:text-stone-200">{video.title}</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <a
            href={backPath}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(backPath);
            }}
            className="inline-flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-[#0F4C3A] dark:text-stone-400 dark:hover:text-[#86C7AE]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{backLabel}</span>
          </a>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`/quran/sure/${selectedSurahNumber}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(`/quran/sure/${selectedSurahNumber}`);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Surəni tam oxu</span>
            </a>

            <a
              href={`/muhaffiz/${catalogSurah?.startPage ?? 1}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(`/muhaffiz/${catalogSurah?.startPage ?? 1}`);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F4C3A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0B3A2C] dark:bg-[#196B52]"
            >
              <span>Mühafizdə əzbərlə</span>
            </a>
          </div>
        </div>

        <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
              <span>{video.format === 'short' ? 'Shorts Tilavət' : 'Uzun Tilavət'}</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>{video.categoryLabel}</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span className="font-mono-tabular">{video.duration}</span>
            </p>
            <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-100">
              {video.title}
            </h1>
          </div>
          <span className="font-arabic text-3xl text-[#0F4C3A] dark:text-[#86C7AE] shrink-0">
            {activeSurahMeta?.arabicName ?? video.arabicName}
          </span>
        </header>

        {/* Embedded Player */}
        <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-xl border border-stone-200 bg-[#0E1210] dark:border-stone-800">
          <img
            src={video.thumbnailUrl}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover opacity-25 blur-xs"
          />
          <iframe
            key={video.videoId}
            src={`https://www.youtube-nocookie.com/embed/${video.videoId}?rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="relative z-10 h-full w-full border-0"
          />
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-6 dark:border-stone-800">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            <span className="font-mono-tabular">{formatViewCount(video.views)}</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>{video.publishedLabel || formatAzerbaijaniDate(video.published)}</span>
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onToggleSave(video.videoId)}
              aria-pressed={isSaved}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-colors ${
                isSaved
                  ? 'border-[#0F4C3A] bg-[#0F4C3A]/10 text-[#0F4C3A] dark:border-[#86C7AE] dark:text-[#86C7AE]'
                  : 'border-stone-200 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} aria-hidden="true" />
              <span>{isSaved ? 'Saxlanılıb' : 'Əlfəcinlərə əlavə et'}</span>
            </button>

            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F4C3A] px-4 py-2 text-xs font-medium text-white hover:bg-[#0B3A2C] dark:bg-[#196B52]"
            >
              <span>YouTube-da aç</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Quranic Verses in Arabic & Alixan Musayev's Latest Azerbaijani Translation */}
        <section
          aria-labelledby="ayah-translation-heading"
          className="mt-10"
        >
          <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-stone-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <span>Ərəbcə mətn və Azərbaycan dilində məna</span>
              </div>
              <h2
                id="ayah-translation-heading"
                className="font-display mt-1.5 text-2xl font-semibold text-stone-900 sm:text-3xl dark:text-stone-100"
              >
                {activeSurahMeta?.surahName ?? video.surahName} — Ayələr və mənaları
              </h2>
              <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
                Tərcümə: {translationData?.translatorName ?? 'Əlixan Musayev'}
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>
                  Son nəşr (v{(translationData?.editionVersion ?? '1.0.4').replace(/^v/i, '')})
                </span>
                {totalAyahCount > 0 && (
                  <>
                    <span aria-hidden="true" className="mx-1.5">·</span>
                    <span className="font-mono-tabular">{totalAyahCount} ayə</span>
                  </>
                )}
              </p>
            </div>

            {hasExcerpt && totalAyahCount > 0 && (
              <div
                role="group"
                aria-label="Ayə görünüşü seçimi"
                className="inline-flex items-center gap-1 self-start rounded-lg bg-[#F1EFE9] p-1 dark:bg-[#181E1B]"
              >
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('excerpt');
                    setVisibleLimit(INITIAL_AYAH_LIMIT);
                  }}
                  aria-pressed={viewMode === 'excerpt'}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    viewMode === 'excerpt'
                      ? 'bg-white text-stone-900 shadow-xs dark:bg-[#242D28] dark:text-stone-100'
                      : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                  }`}
                >
                  Video ayələri ({video.ayahStart}–{video.ayahEnd})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('full');
                    setVisibleLimit(INITIAL_AYAH_LIMIT);
                  }}
                  aria-pressed={viewMode === 'full'}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    viewMode === 'full'
                      ? 'bg-white text-stone-900 shadow-xs dark:bg-[#242D28] dark:text-stone-100'
                      : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                  }`}
                >
                  Tam surə ({totalAyahCount})
                </button>
              </div>
            )}
          </div>

          {/* Multi-surah selector when video covers multiple surahs */}
          {mentionedSurahs.length > 1 && (
            <div
              role="group"
              aria-label="Videodakı surələr"
              className="mt-4 flex flex-wrap items-center gap-2"
            >
              {mentionedSurahs.map((item) => {
                const isActive = item.surahNumber === selectedSurahNumber;
                return (
                  <button
                    key={item.surahNumber}
                    type="button"
                    onClick={() => {
                      setSelectedSurahNumber(item.surahNumber);
                      setAyahQuery('');
                      setVisibleLimit(INITIAL_AYAH_LIMIT);
                    }}
                    aria-pressed={isActive}
                    className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? 'border-[#0F4C3A] bg-[#0F4C3A] text-white dark:border-[#196B52] dark:bg-[#196B52]'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 dark:border-stone-700 dark:bg-[#141916] dark:text-stone-300'
                    }`}
                  >
                    <span className="font-mono-tabular mr-1.5">{item.surahNumber}.</span>
                    <span>{item.surahName}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* In-surah search and reciter selector */}
          {totalAyahCount > 0 && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {totalAyahCount > 7 ? (
                <div className="relative w-full sm:max-w-sm">
                  <label htmlFor="ayah-search-input" className="sr-only">
                    Surə daxilində ayə axtar
                  </label>
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400"
                    aria-hidden="true"
                  />
                  <input
                    id="ayah-search-input"
                    type="search"
                    value={ayahQuery}
                    onChange={(e) => setAyahQuery(e.target.value)}
                    placeholder="Ayə nömrəsi (məs. 16) və ya söz axtar..."
                    className="w-full rounded-lg border border-stone-200 bg-white py-2 pr-9 pl-10 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-[#86C7AE]"
                  />
                  {ayahQuery && (
                    <button
                      type="button"
                      onClick={() => setAyahQuery('')}
                      aria-label="Ayə axtarışını təmizlə"
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
                  <label htmlFor="detail-reciter-select" className="sr-only">
                    Qari seçimi
                  </label>
                  <select
                    id="detail-reciter-select"
                    value={reciter}
                    onChange={(e) => {
                      stopAudio();
                      setReciter(e.target.value as MuhaffizReciterId);
                    }}
                    data-testid="detail-reciter-select"
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
                    data-testid="detail-play-all"
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

                <p>
                  {ayahQuery.trim()
                    ? `${filteredAyahs.length} uyğun ayə tapıldı`
                    : `${displayedAyahs.length} / ${filteredAyahs.length} ayə göstərilir`}
                </p>
              </div>
            </div>
          )}

          {audioError && (
            <p
              role="status"
              className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300"
            >
              {audioError}
            </p>
          )}

          {/* Loading, Error, or Ayah List */}
          {isTranslationLoading ? (
            <div className="mt-5 divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-[#141916]">
              {[1, 2, 3].map((row) => (
                <div key={row} className="p-6">
                  <div className="h-4 w-16 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                  <div className="mt-4 ml-auto h-7 w-3/4 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                  <div className="mt-4 h-4 w-full animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                  <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                </div>
              ))}
            </div>
          ) : translationError ? (
            <div className="mt-5 rounded-xl border border-stone-200 bg-[#F3F1EC] p-6 text-center dark:border-stone-800 dark:bg-[#141916]">
              <p className="text-sm text-stone-700 dark:text-stone-300">{translationError}</p>
              <button
                type="button"
                onClick={() => setRetryCounter((n) => n + 1)}
                className="mt-4 rounded-lg bg-[#0F4C3A] px-4 py-2 text-xs font-medium text-white hover:bg-[#0B3A2C] dark:bg-[#196B52]"
              >
                Yenidən cəhd et
              </button>
            </div>
          ) : displayedAyahs.length === 0 ? (
            <div className="mt-5 rounded-xl border border-stone-200 bg-[#F3F1EC] p-6 text-center dark:border-stone-800 dark:bg-[#141916]">
              <p className="text-sm text-stone-700 dark:text-stone-300">
                Axtarışınıza uyğun ayə tapılmadı.
              </p>
              {ayahQuery && (
                <button
                  type="button"
                  onClick={() => setAyahQuery('')}
                  className="mt-3 rounded-lg border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 dark:border-stone-700 dark:text-stone-200"
                >
                  Axtarışı sıfırla
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                data-testid="ayah-list"
                className="mt-5 divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-[#141916]"
              >
                {displayedAyahs.map((ayah) => {
                  const key = `${ayah.surahNumber}:${ayah.ayahNumber}`;
                  const isCopied = copiedAyahKey === key;
                  const isPlaying = playingKey === key;
                  const isHighlighted = highlightedAyahKey === key;
                  return (
                    <div
                      key={key}
                      id={`ayah-${ayah.surahNumber}-${ayah.ayahNumber}`}
                      data-ayah-anchor={`${ayah.surahNumber}-${ayah.ayahNumber}`}
                      className={`p-6 sm:p-7 transition-colors ${
                        isHighlighted
                          ? 'bg-[#0F4C3A]/6 ring-2 ring-inset ring-[#0F4C3A]/45 dark:bg-[#196B52]/15 dark:ring-[#86C7AE]/40'
                          : isPlaying
                            ? 'bg-[#0F4C3A]/4 dark:bg-[#196B52]/10'
                            : ''
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs">
                          <a
                            href={`#ayah-${ayah.surahNumber}-${ayah.ayahNumber}`}
                            onClick={(e) => {
                              e.preventDefault();
                              onNavigate(
                                `/video/${video.videoId}#ayah-${ayah.surahNumber}-${ayah.ayahNumber}`
                              );
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
                                onNavigate(
                                  `/quran/sehife/${ayah.pageNumber}#ayah-${ayah.surahNumber}-${ayah.ayahNumber}`
                                );
                              }}
                              className="font-mono-tabular text-stone-400 hover:text-[#0F4C3A] dark:text-stone-500 dark:hover:text-[#86C7AE]"
                            >
                              · Səh. {ayah.pageNumber}
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleAyahAudio(key)}
                            aria-pressed={isPlaying}
                            aria-label={isPlaying ? `${key} ayəsini dayandır` : `${key} ayəsini dinlə`}
                            data-testid={`detail-play-ayah-${ayah.ayahNumber}`}
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
                                surahName: activeSurahMeta?.surahName ?? video.surahName,
                                pageNumber: ayah.pageNumber,
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
                            data-testid={`detail-bookmark-ayah-${ayah.ayahNumber}`}
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
                                surahName: activeSurahMeta?.surahName ?? video.surahName,
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
                          <p
                            lang="az"
                            className={`mt-4 ${READER_SCALE_CLASSES[textScale].translation} text-stone-700 dark:text-stone-300`}
                          >
                            {ayah.translation}
                          </p>

                          {ayah.footnotes && (
                            <p
                              lang="az"
                              className="mt-2.5 text-xs leading-relaxed text-stone-500 dark:text-stone-400"
                            >
                              {ayah.footnotes}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {!ayahQuery.trim() && displayedAyahs.length < filteredAyahs.length && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setVisibleLimit((prev) => prev + 30)}
                    className="rounded-lg border border-stone-200 bg-white px-5 py-2.5 text-xs font-medium text-stone-800 transition-colors hover:border-stone-300 dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
                  >
                    Daha 30 ayə göstər ({filteredAyahs.length - displayedAyahs.length} qalıb)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibleLimit(filteredAyahs.length)}
                    className="rounded-lg bg-[#0F4C3A] px-5 py-2.5 text-xs font-medium text-white hover:bg-[#0B3A2C] dark:bg-[#196B52]"
                  >
                    Bütün surəni göstər ({filteredAyahs.length} ayə)
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Structured SEO Information Grid */}
        <div className="mt-12 grid grid-cols-1 gap-10 border-t border-stone-200 pt-10 lg:grid-cols-12 dark:border-stone-800">
          <div className="lg:col-span-7">
            <h2 className="font-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
              Video və surə haqqında məlumat
            </h2>
            <p className="mt-3 text-base leading-relaxed text-stone-700 dark:text-stone-300">
              {video.seoDescription}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {video.reflection}
            </p>

            <div className="mt-6 border-t border-stone-200 pt-5 dark:border-stone-800">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                Mövzu və axtarış açar sözləri
              </p>
              <p className="mt-1.5 text-sm text-stone-700 dark:text-stone-300">
                {video.seoKeywords.join(' · ')}
              </p>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="rounded-xl border border-stone-200 bg-[#F3F1EC] p-6 dark:border-stone-800 dark:bg-[#141916]">
              <h3 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100">
                Texniki və SEO göstəriciləri
              </h3>
              <dl className="mt-4 divide-y divide-stone-200/80 text-sm dark:divide-stone-800">
                <div className="flex justify-between py-2.5">
                  <dt className="text-stone-500 dark:text-stone-400">Surə</dt>
                  <dd className="font-medium text-stone-900 dark:text-stone-100">{video.surahName}</dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-stone-500 dark:text-stone-400">Ayə aralığı</dt>
                  <dd className="font-medium text-stone-900 dark:text-stone-100">{video.ayahRange}</dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-stone-500 dark:text-stone-400">Nüzul yeri</dt>
                  <dd className="font-medium text-stone-900 dark:text-stone-100">{video.revelationPlace}</dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-stone-500 dark:text-stone-400">Qari</dt>
                  <dd className="font-medium text-stone-900 dark:text-stone-100">{video.reciter}</dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-stone-500 dark:text-stone-400">Tərcümə</dt>
                  <dd className="font-medium text-stone-900 dark:text-stone-100">Əlixan Musayev</dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-stone-500 dark:text-stone-400">Müddət</dt>
                  <dd className="font-mono-tabular font-medium text-stone-900 dark:text-stone-100">
                    {video.duration}
                  </dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-stone-500 dark:text-stone-400">Dil</dt>
                  <dd className="font-medium text-stone-900 dark:text-stone-100">Ərəbcə / Azərbaycan</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>

        {/* Related Videos */}
        {relatedVideos.length > 0 && (
          <div className="mt-14 border-t border-stone-200 pt-10 dark:border-stone-800">
            <h2 className="font-display text-2xl font-semibold text-stone-900 dark:text-stone-100">
              Oxşar tilavətlər
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {relatedVideos.map((rel) => (
                <a
                  key={rel.videoId}
                  href={`/video/${rel.videoId}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(`/video/${rel.videoId}`);
                  }}
                  className="group overflow-hidden rounded-xl border border-stone-200 bg-white transition-colors hover:border-stone-300 dark:border-stone-800 dark:bg-[#141916]"
                >
                  <div className="aspect-video overflow-hidden bg-stone-100 dark:bg-stone-900">
                    <img
                      src={rel.thumbnailUrl}
                      alt={rel.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {rel.reciter} · <span className="font-mono-tabular">{rel.duration}</span>
                    </p>
                    <h3 className="font-display mt-1 text-lg font-semibold text-stone-900 dark:text-stone-100">
                      {rel.title}
                    </h3>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
