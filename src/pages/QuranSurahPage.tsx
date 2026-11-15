import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  Play,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SeoHead } from '../components/SeoHead';
import {
  RecitationVideo,
  SurahTranslationPayload,
  filterSurahAyahs,
} from '../lib/channel';
import { TOTAL_QURAN_SURAHS, formatAzerbaijaniOrdinal, getSurahByNumber } from '../lib/quran';
import { fetchSurahWithFallback } from '../lib/quranClient';

interface QuranSurahPageProps {
  surahNumber: number;
  channelVideos: RecitationVideo[];
  onNavigate: (path: string) => void;
  onPlayVideo: (video: RecitationVideo) => void;
}

const INITIAL_AYAH_LIMIT = 30;

export function QuranSurahPage({
  surahNumber,
  channelVideos,
  onNavigate,
  onPlayVideo,
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
  const [visibleLimit, setVisibleLimit] = useState<number>(INITIAL_AYAH_LIMIT);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    setQuery('');
    setVisibleLimit(INITIAL_AYAH_LIMIT);
  }, [surahNumber]);

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

  const filteredAyahs = useMemo(() => {
    const ayahs = payload?.ayahs ?? [];
    return filterSurahAyahs(ayahs, {
      mode: 'full',
      query,
    });
  }, [payload, query]);

  const displayedAyahs = useMemo(() => {
    if (query.trim()) return filteredAyahs;
    return filteredAyahs.slice(0, visibleLimit);
  }, [filteredAyahs, query, visibleLimit]);

  const jsonLd = useMemo(() => {
    if (!surah) return undefined;
    return {
      '@context': 'https://schema.org',
      '@type': 'Chapter',
      name: `${surah.number}. ${surah.name} surəsi`,
      position: surah.number,
      inLanguage: ['ar', 'az'],
      url: `${window.location.origin}/quran/sure/${surah.number}`,
      translator: {
        '@type': 'Person',
        name: 'Əlixan Musayev',
      },
    };
  }, [surah]);

  if (!surah) {
    return (
      <section className="py-20">
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

  async function handleCopyAyah(ayahNum: number, arabic: string, translation: string) {
    const key = `${surahNumber}:${ayahNum}`;
    const text = `${arabic}\n\n"${translation}"\n(${surah?.name} surəsi, ${key} — Əlixan Musayev tərcüməsi)`;
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

  return (
    <article className="py-12 lg:py-16">
      <SeoHead
        title={`${surah.number}. ${surah.name} surəsi — Ərəbcə və Tərcümə | Quran Qiraeti`}
        description={`${surah.name} surəsi (${surah.ayahCount} ayə, ${surah.revelationPlace}). Ərəbcə tam mətn və Əlixan Musayevin son nəşr Azərbaycan tərcüməsi (v1.0.4).`}
        path={`/quran/sure/${surah.number}`}
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-5xl px-6">
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

          <a
            href={`/quran/sehife/${surah.startPage}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(`/quran/sehife/${surah.startPage}`);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Mushaf səhifəsi {surah.startPage}</span>
          </a>
        </div>

        <header className="mt-6 flex flex-col gap-4 border-b border-stone-200 pb-8 sm:flex-row sm:items-end sm:justify-between dark:border-stone-800">
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
              <span className="font-mono-tabular">{formatAzerbaijaniOrdinal(surah.number)} surə</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>{surah.revelationPlace}</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span className="font-mono-tabular">{surah.ayahCount} ayə</span>
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
        {surah.number !== 1 && surah.number !== 9 && (
          <div className="mt-8 rounded-xl border border-stone-200 bg-[#F3F1EC] px-6 py-5 text-center dark:border-stone-800 dark:bg-[#141916]">
            <p dir="rtl" lang="ar" className="font-arabic text-2xl text-stone-900 dark:text-stone-100">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>
            <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
              Mərhəmətli və Rəhmli Allahın adı ilə!
            </p>
          </div>
        )}

        {/* Search inside surah */}
        {surah.ayahCount > 7 && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

            <p className="text-xs text-stone-500 dark:text-stone-400">
              {query.trim()
                ? `${filteredAyahs.length} uyğun ayə tapıldı`
                : `${displayedAyahs.length} / ${filteredAyahs.length || surah.ayahCount} ayə göstərilir`}
            </p>
          </div>
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
            <div
              data-testid="surah-ayah-list"
              className="mt-6 divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-[#141916]"
            >
              {displayedAyahs.map((ayah) => {
                const key = `${ayah.surahNumber}:${ayah.ayahNumber}`;
                const isCopied = copiedKey === key;
                return (
                  <div key={key} className="p-6 sm:p-7">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono-tabular text-xs font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
                        {key}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyAyah(ayah.ayahNumber, ayah.arabicText, ayah.translation)
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

                    <p lang="az" className="mt-4 text-base leading-relaxed text-stone-700 dark:text-stone-300">
                      {ayah.translation}
                    </p>

                    {ayah.footnotes && (
                      <p lang="az" className="mt-2.5 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                        {ayah.footnotes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {!query.trim() && displayedAyahs.length < filteredAyahs.length && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + 30)}
                  className="rounded-lg border border-stone-200 bg-white px-5 py-2.5 text-xs font-medium text-stone-800 hover:border-stone-300 dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
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
