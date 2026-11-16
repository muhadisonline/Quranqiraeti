import { ArrowRight, BookOpen, Moon, Search, Sun, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { SeoHead } from '../components/SeoHead';
import {
  JUZ_PAGE_RANGES,
  SURAH_CATALOG,
  TOTAL_QURAN_PAGES,
  TOTAL_QURAN_SURAHS,
  filterSurahCatalog,
  formatAzerbaijaniOrdinal,
  getJuzForPage,
  getPagesForJuz,
} from '../lib/quran';
import { POPULAR_QURAN_TOPICS, buildBreadcrumbJsonLd } from '../lib/seo';

interface QuranDirectoryPageProps {
  isDark: boolean;
  onNavigate: (path: string) => void;
  onToggleTheme: () => void;
}

export function QuranDirectoryPage({
  isDark,
  onNavigate,
  onToggleTheme,
}: QuranDirectoryPageProps) {
  const [browseMode, setBrowseMode] = useState<'pages' | 'surahs'>('pages');
  const [surahQuery, setSurahQuery] = useState('');
  const [selectedJuz, setSelectedJuz] = useState<number | 'all'>('all');
  const [jumpPageInput, setJumpPageInput] = useState('');

  const filteredSurahs = useMemo(
    () =>
      filterSurahCatalog(SURAH_CATALOG, {
        query: surahQuery,
        place: 'all',
      }),
    [surahQuery]
  );

  const visiblePages = useMemo(() => getPagesForJuz(selectedJuz), [selectedJuz]);

  const surahByStartPage = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of SURAH_CATALOG) {
      const prev = map.get(s.startPage);
      map.set(s.startPage, prev ? `${prev}, ${s.name}` : s.name);
    }
    return map;
  }, []);

  const jsonLd = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'Book',
        name: 'Qurani-Kərim (Mədinə çapı, 604 səhifə) — Ərəbcə mətn və Əlixan Musayevin Azərbaycan tərcüməsi',
        inLanguage: ['ar', 'az'],
        numberOfPages: TOTAL_QURAN_PAGES,
        translator: {
          '@type': 'Person',
          name: 'Əlixan Musayev',
        },
        url: `${window.location.origin}/quran`,
      },
      buildBreadcrumbJsonLd(window.location.origin, [
        { name: 'Ana səhifə', path: '/' },
        { name: 'Qurani-Kərim', path: '/quran' },
      ]),
    ],
    []
  );

  function handleJumpSubmit(e: FormEvent) {
    e.preventDefault();
    const num = Number.parseInt(jumpPageInput.trim(), 10);
    if (Number.isNaN(num)) return;
    const clamped = Math.min(TOTAL_QURAN_PAGES, Math.max(1, num));
    onNavigate(`/quran/sehife/${clamped}`);
  }

  return (
    <section className="py-14 lg:py-16">
      <SeoHead
        title="Tam Qurani-Kərim — Mədinə Çapı (604 Səhifə) və 114 Surə | Quran Qiraeti"
        description="Mədinə çapı üzrə Qurani-Kərimin 604 səhifəsi və 114 surəsi: hər səhifədə Mədinə müshəfindəki dəqiq ayə sayı, ərəbcə mətn və Əlixan Musayevin Azərbaycan tərcüməsi (v1.0.4)."
        path="/quran"
        ogImage="/og-default.png"
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-6xl px-6">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
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
          <span className="font-medium text-stone-900 dark:text-stone-200">Qurani-Kərim</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col gap-6 border-b border-stone-200 pb-8 sm:flex-row sm:items-end sm:justify-between dark:border-stone-800">
          <div>
            <p className="text-xs font-medium tracking-widest text-stone-500 dark:text-stone-400">
              Tam Qurani-Kərim · Mədinə çapı (<span className="font-mono-tabular">604</span> səhifə) · Əlixan Musayev (v1.0.4)
            </p>
            <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl text-balance dark:text-stone-100">
              Qurani-Kərim: Mədinə çapı üzrə səhifələr və surələr
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              Mədinə çapına uyğun olaraq bütün{' '}
              <span className="font-mono-tabular">{TOTAL_QURAN_PAGES}</span> səhifə və{' '}
              <span className="font-mono-tabular">{TOTAL_QURAN_SURAHS}</span> surə ayrıca SEO
              ünvanlarına bölünmüşdür. Hər səhifədə Mədinə çapındakı dəqiq ayə sayı ərəbcə mətn
              və Əlixan Musayevin son nəşr tərcüməsi ilə göstərilir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="/quran/sehife/1"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/quran/sehife/1');
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F4C3A] px-4 py-2.5 text-xs font-medium text-white whitespace-nowrap transition-colors hover:bg-[#0B3A2C] dark:bg-[#196B52]"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>1-ci səhifədən oxu</span>
            </a>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Gündüz oxu rejiminə keç' : 'Gecə oxu rejiminə keç'}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 whitespace-nowrap transition-colors hover:border-stone-300 hover:text-stone-900 dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200 dark:hover:border-stone-600 min-h-[40px]"
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
        </div>

        {/* Popular Verses & Surahs Quick Links (SEO Internal Linking) */}
        <section
          aria-labelledby="popular-quran-topics-heading"
          data-testid="popular-quran-topics"
          className="mt-8"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="popular-quran-topics-heading"
              className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100"
            >
              Ən Çox Axtarılan Surələr və Məşhur Ayələr
            </h2>
            <a
              href="/muhaffiz"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/muhaffiz');
              }}
              className="text-xs font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
            >
              Mühafiz (Əzbər Mushafı) →
            </a>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {POPULAR_QURAN_TOPICS.map((topic) => (
              <div
                key={topic.id}
                className="flex flex-col justify-between rounded-xl border border-stone-200 bg-[#F7F5F0] p-4 dark:border-stone-800 dark:bg-[#141916]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <a
                      href={`/quran/sehife/${topic.pageNumber}${topic.anchorHash ?? ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`/quran/sehife/${topic.pageNumber}${topic.anchorHash ?? ''}`);
                      }}
                      className="font-display text-base font-semibold text-stone-900 hover:text-[#0F4C3A] dark:text-stone-100 dark:hover:text-[#86C7AE]"
                    >
                      {topic.title}
                    </a>
                    <span
                      dir="rtl"
                      lang="ar"
                      className="font-arabic shrink-0 text-base text-[#0F4C3A] dark:text-[#86C7AE]"
                    >
                      {topic.arabicLabel}
                    </span>
                  </div>
                  <p className="mt-1 font-mono-tabular text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    {topic.searchHint}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
                    {topic.summary}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-stone-200/80 pt-2.5 text-[11px] dark:border-stone-800">
                  <a
                    href={`/quran/sure/${topic.surahNumber}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/quran/sure/${topic.surahNumber}`);
                    }}
                    className="font-medium text-stone-600 hover:text-[#0F4C3A] dark:text-stone-400 dark:hover:text-[#86C7AE]"
                  >
                    Surəni aç
                  </a>
                  <a
                    href={`/muhaffiz/${topic.pageNumber}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/muhaffiz/${topic.pageNumber}`);
                    }}
                    className="font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
                  >
                    Mühafizdə əzbərlə
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mode Switcher: Mədinə çapı səhifələri (604) vs Surələr (114) */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Quran bölmə rejimi"
            className="inline-flex items-center gap-1 self-start rounded-lg bg-[#F1EFE9] p-1 dark:bg-[#181E1B]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={browseMode === 'pages'}
              onClick={() => setBrowseMode('pages')}
              className={`rounded-md px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                browseMode === 'pages'
                  ? 'bg-white text-stone-900 shadow-xs dark:bg-[#242D28] dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
              }`}
            >
              Mədinə çapı səhifələri (<span className="font-mono-tabular">604</span>)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={browseMode === 'surahs'}
              onClick={() => setBrowseMode('surahs')}
              className={`rounded-md px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                browseMode === 'surahs'
                  ? 'bg-white text-stone-900 shadow-xs dark:bg-[#242D28] dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
              }`}
            >
              Surələr üzrə (<span className="font-mono-tabular">114</span>)
            </button>
          </div>

          {/* Direct Page Jump Form */}
          <form onSubmit={handleJumpSubmit} className="flex items-center gap-2">
            <label htmlFor="quick-page-jump" className="sr-only">
              Quran səhifə nömrəsi (1–604)
            </label>
            <input
              id="quick-page-jump"
              type="number"
              min={1}
              max={TOTAL_QURAN_PAGES}
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              placeholder="Səhifə (1–604)"
              className="w-36 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-mono-tabular text-stone-900 placeholder:font-sans placeholder:text-stone-400 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-stone-800 whitespace-nowrap transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
            >
              <span>Səhifəyə keç</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </form>
        </div>

        {browseMode === 'surahs' ? (
          <>
            {/* Unified Surah Search */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                <span className="font-mono-tabular">{filteredSurahs.length}</span> surə göstərilir ·
                Hər surə daxilində ayələr Mədinə çapı səhifələrinə bölünərək təqdim olunur
              </p>

              <div className="relative w-full sm:w-80">
                <label htmlFor="surah-directory-search" className="sr-only">
                  Surə axtar
                </label>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400"
                  aria-hidden="true"
                />
                <input
                  id="surah-directory-search"
                  type="search"
                  value={surahQuery}
                  onChange={(e) => setSurahQuery(e.target.value)}
                  placeholder="Surə adı və ya nömrəsi (məs. 36, Yasin)"
                  className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pr-9 pl-10 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100 dark:placeholder:text-stone-500"
                />
                {surahQuery && (
                  <button
                    type="button"
                    onClick={() => setSurahQuery('')}
                    aria-label="Surə axtarışını təmizlə"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {filteredSurahs.length > 0 ? (
              <div
                data-testid="surah-grid"
                className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filteredSurahs.map((surah) => (
                  <article
                    key={surah.number}
                    className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-[#0F4C3A]/60 dark:border-stone-800 dark:bg-[#141916] dark:hover:border-[#86C7AE]/50"
                  >
                    <a
                      href={`/quran/sure/${surah.number}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`/quran/sure/${surah.number}`);
                      }}
                      className="flex items-start justify-between gap-4 focus-visible:outline-none"
                    >
                      <div>
                        <p className="font-mono-tabular text-xs font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
                          {String(surah.number).padStart(3, '0')}
                        </p>
                        <h2 className="font-display mt-1 text-xl font-semibold text-stone-900 group-hover:text-[#0F4C3A] dark:text-stone-100 dark:group-hover:text-[#86C7AE]">
                          {surah.name} surəsi
                        </h2>
                        <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
                          <span className="font-mono-tabular">{surah.ayahCount} ayə</span>
                          <span aria-hidden="true" className="mx-1.5">·</span>
                          <span>{surah.revelationPlace}</span>
                        </p>
                      </div>

                      <span
                        dir="rtl"
                        lang="ar"
                        className="font-arabic text-xl text-stone-800 dark:text-stone-200 shrink-0"
                      >
                        {surah.arabicName}
                      </span>
                    </a>

                    <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs dark:border-stone-800/80">
                      <a
                        href={`/quran/sehife/${surah.startPage}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(`/quran/sehife/${surah.startPage}`);
                        }}
                        className="text-stone-500 hover:text-[#0F4C3A] dark:text-stone-400 dark:hover:text-[#86C7AE]"
                      >
                        Mədinə çapı: Səh. <span className="font-mono-tabular">{surah.startPage}</span>
                      </a>

                      <a
                        href={`/quran/sure/${surah.number}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(`/quran/sure/${surah.number}`);
                        }}
                        className="font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
                      >
                        Surəni oxu
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-xl border border-stone-200 bg-[#F3F1EC] p-8 text-center dark:border-stone-800 dark:bg-[#141916]">
                <p className="font-display text-2xl font-medium text-stone-900 dark:text-stone-100">
                  Axtarışa uyğun surə tapılmadı
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSurahQuery('');
                  }}
                  className="mt-4 rounded-lg bg-[#0F4C3A] px-5 py-2.5 text-xs font-medium text-white"
                >
                  Bütün surələri göstər
                </button>
              </div>
            )}
          </>
        ) : (
          /* 604 Mushaf Pages View */
          <div className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="juz-select"
                  className="text-xs font-medium text-stone-600 dark:text-stone-400 whitespace-nowrap"
                >
                  Cüz üzrə süz:
                </label>
                <select
                  id="juz-select"
                  value={selectedJuz}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedJuz(val === 'all' ? 'all' : Number.parseInt(val, 10));
                  }}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100"
                >
                  <option value="all">Bütün Quran (1–604 səhifə)</option>
                  {JUZ_PAGE_RANGES.map((range) => (
                    <option key={range.juz} value={range.juz}>
                      {range.juz}. Cüz (Səhifə {range.startPage}–{range.endPage})
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-stone-500 dark:text-stone-400">
                <span className="font-mono-tabular">{visiblePages.length}</span> səhifə · Hər
                səhifə ayrıca oxu səhifəsində açılır
              </p>
            </div>

            <div
              data-testid="mushaf-pages-grid"
              className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
            >
              {visiblePages.map((pageNum) => {
                const startSurahs = surahByStartPage.get(pageNum);
                const juz = getJuzForPage(pageNum);
                return (
                  <a
                    key={pageNum}
                    href={`/quran/sehife/${pageNum}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/quran/sehife/${pageNum}`);
                    }}
                    className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-3.5 transition-colors hover:border-[#0F4C3A] dark:border-stone-800 dark:bg-[#141916] dark:hover:border-[#86C7AE]"
                  >
                    <span className="font-mono-tabular text-base font-semibold text-stone-900 dark:text-stone-100">
                      Səh. {pageNum}
                    </span>
                    <span className="mt-1 truncate text-[11px] text-stone-500 dark:text-stone-400">
                      {startSurahs ? startSurahs : `${formatAzerbaijaniOrdinal(juz)} Cüz`}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
