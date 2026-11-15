import { Bookmark, Moon, Play, Search, Sun, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SeoHead } from '../components/SeoHead';
import {
  RecitationVideo,
  formatViewCount,
  normalizeAzerbaijaniText,
} from '../lib/channel';

interface ShortsPageProps {
  shorts: RecitationVideo[];
  savedIds: string[];
  isLoading: boolean;
  isDark: boolean;
  onPlay: (video: RecitationVideo) => void;
  onToggleSave: (videoId: string) => void;
  onOpenDetail: (videoId: string) => void;
  onToggleTheme: () => void;
}

const INITIAL_SHORTS_LIMIT = 24;

export function ShortsPage({
  shorts,
  savedIds,
  isLoading,
  isDark,
  onPlay,
  onToggleSave,
  onOpenDetail,
  onToggleTheme,
}: ShortsPageProps) {
  const [query, setQuery] = useState('');
  const [onlySaved, setOnlySaved] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_SHORTS_LIMIT);

  const filteredShorts = useMemo(() => {
    const q = normalizeAzerbaijaniText(query);
    return shorts.filter((item) => {
      if (onlySaved && !savedIds.includes(item.videoId)) return false;
      if (!q) return true;
      const haystack = normalizeAzerbaijaniText(
        `${item.title} ${item.rawTitle} ${item.surahName} ${item.reciter} ${item.seoDescription} ${item.seoKeywords.join(' ')}`
      );
      return haystack.includes(q);
    });
  }, [shorts, query, onlySaved, savedIds]);

  const displayedShorts = useMemo(() => {
    if (query.trim()) return filteredShorts;
    return filteredShorts.slice(0, visibleLimit);
  }, [filteredShorts, query, visibleLimit]);

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Quran Qiraeti — Shorts Videoları və SEO Arxivi',
      description:
        'Quran Qiraeti YouTube kanalının qısa ayə tilavətləri (Shorts), hər video üçün surə məlumatı, ayə aralığı və Azərbaycan dilində SEO xülasəsi.',
      numberOfItems: shorts.length,
      itemListElement: shorts.slice(0, 12).map((video, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${window.location.origin}/video/${video.videoId}`,
        name: video.title,
      })),
    }),
    [shorts]
  );

  return (
    <section className="py-14 lg:py-16">
      <SeoHead
        title="Shorts Videoları və Surə Məlumatları | Quran Qiraeti"
        description="Quran Qiraeti kanalının bütün qısa Quran tilavətləri (Shorts). Hər bir video üçün surə adı, ayə aralığı, qari və SEO izahı."
        path="/shorts"
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-6xl px-6">
        {/* Editorial Page Header */}
        <div className="flex flex-col gap-6 border-b border-stone-200 pb-8 sm:flex-row sm:items-end sm:justify-between dark:border-stone-800">
          <div>
            <p className="text-xs font-medium tracking-widest text-stone-500 dark:text-stone-400">
              @quranqiraeti · Shorts Bölməsi
            </p>
            <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl text-balance dark:text-stone-100">
              Qısa Quran tilavətləri və video izahları
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              Kanalda yayımlanan bütün Shorts videoları, hər bir tilavətin surə məlumatı, ayə aralığı
              və axtarış sistemləri (SEO) üçün hazırlanmış ətraflı məzmun xülasəsi.
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Gündüz oxu rejiminə keç' : 'Gecə oxu rejiminə keç'}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-stone-300 hover:text-stone-900 dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200 dark:hover:border-stone-600 min-h-[40px]"
          >
            {isDark ? (
              <>
                <Sun className="h-4 w-4 text-[#C6A769]" aria-hidden="true" />
                <span>Gündüz rejimi</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-[#0F4C3A]" aria-hidden="true" />
                <span>Gecə rejimi</span>
              </>
            )}
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 rounded-lg bg-[#F1EFE9] p-1 self-start dark:bg-[#181E1B]">
            <button
              type="button"
              onClick={() => {
                setOnlySaved(false);
                setVisibleLimit(INITIAL_SHORTS_LIMIT);
              }}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                !onlySaved
                  ? 'bg-white text-stone-900 shadow-xs dark:bg-[#242D28] dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
              }`}
            >
              Bütün Shorts (<span className="font-mono-tabular">{shorts.length}</span>)
            </button>
            <button
              type="button"
              onClick={() => {
                setOnlySaved(true);
                setVisibleLimit(INITIAL_SHORTS_LIMIT);
              }}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                onlySaved
                  ? 'bg-white text-stone-900 shadow-xs dark:bg-[#242D28] dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
              }`}
            >
              Saxlanılanlar
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <label htmlFor="shorts-search" className="sr-only">
              Shorts videolarında axtar
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              id="shorts-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Shorts axtar (Kəhf, Qaf, Nəcm)"
              className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pr-9 pl-10 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-[#86C7AE]"
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
        </div>

        <p className="mt-4 text-xs text-stone-500 dark:text-stone-400">
          {isLoading
            ? 'Bütün Shorts siyahısı kanaldan yüklənir...'
            : `${displayedShorts.length} / ${filteredShorts.length} Shorts videosu və SEO məlumatı`}
        </p>

        {/* Shorts Cards with Rich Per-Video SEO Info */}
        {displayedShorts.length > 0 ? (
          <>
            <div
              data-testid="shorts-grid"
              className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2"
            >
              {displayedShorts.map((shortVideo) => {
                const isSaved = savedIds.includes(shortVideo.videoId);
                return (
                  <article
                    key={shortVideo.videoId}
                    className="flex flex-col sm:flex-row overflow-hidden rounded-xl border border-stone-200 bg-white transition-colors hover:border-stone-300 dark:border-stone-800 dark:bg-[#141916] dark:hover:border-stone-700"
                  >
                    {/* Vertical Shorts Thumbnail */}
                    <div className="relative h-64 w-full shrink-0 overflow-hidden bg-stone-900 sm:h-auto sm:w-44">
                      <img
                        src={shortVideo.thumbnailUrl}
                        alt={`${shortVideo.title} — Quran Qiraeti Shorts`}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => onPlay(shortVideo)}
                        aria-label={`${shortVideo.title} Shorts videosunu izlə`}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/35"
                      >
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FAF9F6]/95 text-[#0F4C3A] shadow-sm dark:bg-[#0E1210]/90 dark:text-[#86C7AE]">
                          <Play className="h-4 w-4 fill-current ml-0.5" aria-hidden="true" />
                        </span>
                      </button>
                    </div>

                    {/* Rich SEO Metadata & Description */}
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                            <span>Shorts</span>
                            <span aria-hidden="true" className="mx-1.5">·</span>
                            <span>{shortVideo.ayahRange}</span>
                            <span aria-hidden="true" className="mx-1.5">·</span>
                            <span className="font-mono-tabular">{shortVideo.duration}</span>
                          </p>
                          <span className="font-arabic text-base text-[#0F4C3A] dark:text-[#86C7AE]">
                            {shortVideo.arabicName}
                          </span>
                        </div>

                        <h2 className="font-display mt-2 text-xl font-semibold text-stone-900 dark:text-stone-100">
                          <a
                            href={`/video/${shortVideo.videoId}`}
                            onClick={(e) => {
                              e.preventDefault();
                              onOpenDetail(shortVideo.videoId);
                            }}
                            className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]"
                          >
                            {shortVideo.title}
                          </a>
                        </h2>

                        <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                          {shortVideo.seoDescription}
                        </p>

                        {/* Unboxed SEO Metadata Table/List */}
                        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-stone-100 pt-3 text-xs dark:border-stone-800/80">
                          <div>
                            <dt className="inline text-stone-400 dark:text-stone-500">Nüzul: </dt>
                            <dd className="inline font-medium text-stone-700 dark:text-stone-300">
                              {shortVideo.revelationPlace}
                            </dd>
                          </div>
                          <div>
                            <dt className="inline text-stone-400 dark:text-stone-500">Qari: </dt>
                            <dd className="inline font-medium text-stone-700 dark:text-stone-300">
                              {shortVideo.reciter}
                            </dd>
                          </div>
                          <div className="col-span-2 mt-0.5 text-stone-500 dark:text-stone-400">
                            {shortVideo.seoKeywords.join(' · ')}
                          </div>
                        </dl>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3 dark:border-stone-800/80">
                        <span className="font-mono-tabular text-xs text-stone-500 whitespace-nowrap dark:text-stone-400">
                          {formatViewCount(shortVideo.views)}
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onToggleSave(shortVideo.videoId)}
                            aria-pressed={isSaved}
                            aria-label={
                              isSaved
                                ? `${shortVideo.title} əlfəcinlərdən çıxar`
                                : `${shortVideo.title} əlfəcinlərə əlavə et`
                            }
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                              isSaved
                                ? 'border-[#0F4C3A] bg-[#0F4C3A]/10 text-[#0F4C3A] dark:border-[#86C7AE] dark:text-[#86C7AE]'
                                : 'border-stone-200 text-stone-500 hover:text-stone-800 dark:border-stone-700 dark:text-stone-400'
                            }`}
                          >
                            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} aria-hidden="true" />
                          </button>

                          <a
                            href={`/video/${shortVideo.videoId}`}
                            onClick={(e) => {
                              e.preventDefault();
                              onOpenDetail(shortVideo.videoId);
                            }}
                            className="inline-flex items-center rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium text-stone-700 whitespace-nowrap shrink-0 hover:border-stone-300 dark:border-stone-700 dark:text-stone-300"
                          >
                            SEO Məlumatı
                          </a>

                          <button
                            type="button"
                            onClick={() => onPlay(shortVideo)}
                            className="inline-flex items-center rounded-lg bg-[#0F4C3A] px-3.5 py-2 text-xs font-medium text-white whitespace-nowrap shrink-0 hover:bg-[#0B3A2C] dark:bg-[#196B52]"
                          >
                            İzlə
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {!query.trim() && displayedShorts.length < filteredShorts.length && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + 24)}
                  className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
                >
                  Daha 24 Shorts göstər ({filteredShorts.length - displayedShorts.length} qalıb)
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleLimit(filteredShorts.length)}
                  className="rounded-lg bg-[#0F4C3A] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0B3A2C] dark:bg-[#196B52]"
                >
                  Bütün Shorts videolarını göstər ({filteredShorts.length})
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-8 rounded-xl border border-stone-200 bg-[#F3F1EC] px-6 py-12 text-center dark:border-stone-800 dark:bg-[#141916]">
            <p className="font-display text-2xl font-medium text-stone-900 dark:text-stone-100">
              Axtarışa uyğun Shorts videosu tapılmadı
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setOnlySaved(false);
              }}
              className="mt-4 rounded-lg bg-[#0F4C3A] px-5 py-2.5 text-xs font-medium text-white"
            >
              Bütün Shorts videolarını göstər
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
