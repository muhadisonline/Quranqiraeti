import { ArrowLeft, ArrowRight, Check, Copy } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { SeoHead } from '../components/SeoHead';
import {
  MushafPagePayload,
  TOTAL_QURAN_PAGES,
  formatAzerbaijaniOrdinal,
  getJuzForPage,
} from '../lib/quran';
import { fetchMushafPageWithFallback } from '../lib/quranClient';

interface QuranMushafPageProps {
  pageNumber: number;
  onNavigate: (path: string) => void;
}

export function QuranMushafPage({ pageNumber, onNavigate }: QuranMushafPageProps) {
  const isValidPage = pageNumber >= 1 && pageNumber <= TOTAL_QURAN_PAGES;
  const [payload, setPayload] = useState<MushafPagePayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(isValidPage);
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);
  const [jumpInput, setJumpInput] = useState<string>(String(pageNumber));
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    setJumpInput(String(pageNumber));
  }, [pageNumber]);

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

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Qurani-Kərim — ${pageOrdinal} səhifə`,
      description: `Qurani-Kərimin ${pageOrdinal} səhifəsi: ərəbcə mətn və Əlixan Musayevin son nəşr Azərbaycan tərcüməsi.`,
      inLanguage: ['ar', 'az'],
      url: `${window.location.origin}/quran/sehife/${pageNumber}`,
    }),
    [pageNumber, pageOrdinal]
  );

  if (!isValidPage) {
    return (
      <section className="py-20">
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
        title={`Qurani-Kərim, ${pageOrdinal} səhifə — Ərəbcə və Tərcümə | Quran Qiraeti`}
        description={`Qurani-Kərimin ${pageOrdinal} səhifəsi (${juzOrdinal} Cüz). Ərəbcə mətn və Əlixan Musayevin son nəşr Azərbaycan tərcüməsi.`}
        path={`/quran/sehife/${pageNumber}`}
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

        {/* Page Header */}
        <header className="mt-6 flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-stone-800">
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
              <span className="font-mono-tabular">Səhifə {pageNumber} / {TOTAL_QURAN_PAGES}</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span className="font-mono-tabular">{juzOrdinal} Cüz</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>
                Əlixan Musayev (v{(payload?.editionVersion ?? '1.0.4').replace(/^v/i, '')})
              </span>
            </p>
            <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-100">
              Qurani-Kərim — {pageOrdinal} səhifə
            </h1>
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
        </header>

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
              const isCopied = copiedKey === key;

              return (
                <div key={key} className="p-6 sm:p-7">
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

                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono-tabular text-xs font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
                      {key}
                    </span>
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
