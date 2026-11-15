import { ArrowLeft, BookOpen, Bookmark, Check, Copy, ExternalLink, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SeoHead } from '../components/SeoHead';
import {
  RecitationVideo,
  SurahTranslationPayload,
  buildVideoJsonLd,
  filterSurahAyahs,
  formatAzerbaijaniDate,
  formatViewCount,
  getMentionedSurahs,
} from '../lib/channel';

interface VideoDetailPageProps {
  video: RecitationVideo | undefined;
  relatedVideos: RecitationVideo[];
  isSaved: boolean;
  isChannelLoading?: boolean;
  onNavigate: (path: string) => void;
  onToggleSave: (videoId: string) => void;
}

const INITIAL_AYAH_LIMIT = 30;

export function VideoDetailPage({
  video,
  relatedVideos,
  isSaved,
  isChannelLoading = false,
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

  useEffect(() => {
    if (!video) return;
    setSelectedSurahNumber(video.surahNumber);
    setViewMode(video.ayahStart && video.ayahEnd ? 'excerpt' : 'full');
    setAyahQuery('');
    setVisibleLimit(INITIAL_AYAH_LIMIT);
  }, [video?.videoId, video?.surahNumber, video?.ayahStart, video?.ayahEnd]);

  useEffect(() => {
    if (!video) return;
    const controller = new AbortController();
    let cancelled = false;

    async function loadSurah() {
      setIsTranslationLoading(true);
      setTranslationError('');
      try {
        const res = await fetch(`/api/quran/surah/${selectedSurahNumber}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error('Surə tərcüməsi yüklənmədi');
        }
        const payload = (await res.json()) as SurahTranslationPayload;
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
    return buildVideoJsonLd(video, window.location.origin);
  }, [video]);

  const activeSurahMeta = useMemo(() => {
    return (
      mentionedSurahs.find((s) => s.surahNumber === selectedSurahNumber) ??
      mentionedSurahs[0]
    );
  }, [mentionedSurahs, selectedSurahNumber]);

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
      <section className="py-20">
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
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-5xl px-6">
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

          {/* In-surah search for longer surahs */}
          {totalAyahCount > 7 && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {ayahQuery.trim()
                  ? `${filteredAyahs.length} uyğun ayə tapıldı`
                  : `${displayedAyahs.length} / ${filteredAyahs.length} ayə göstərilir`}
              </p>
            </div>
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
                  return (
                    <div key={key} className="p-6 sm:p-7">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-mono-tabular text-xs font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
                          {key}
                        </span>
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
                      </div>

                      <p
                        dir="rtl"
                        lang="ar"
                        className="font-arabic mt-4 text-right text-2xl leading-[2.25] text-stone-900 sm:text-[1.8rem] dark:text-stone-100"
                      >
                        {ayah.arabicText}
                      </p>

                      <p
                        lang="az"
                        className="mt-4 text-base leading-relaxed text-stone-700 dark:text-stone-300"
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
