import { ArrowLeft, ArrowRight, Check, Copy, Moon, Sun } from 'lucide-react';
import { MouseEvent, useMemo, useState } from 'react';
import { SeoHead } from '../components/SeoHead';
import {
  AZKAR_CATEGORY_LABELS,
  AzkarCategory,
  getAzkarByCategory,
} from '../data/azkar';
import { useReaderTransliteration } from '../hooks/useReaderPreferences';
import { buildBreadcrumbJsonLd } from '../lib/seo';
import { transliterateArabicToAz } from '../lib/transliteration';

interface ZikrPageProps {
  isDark: boolean;
  onNavigate: (path: string) => void;
  onToggleTheme: () => void;
}

export function ZikrPage({ isDark, onNavigate, onToggleTheme }: ZikrPageProps) {
  const [categoryFilter, setCategoryFilter] = useState<'all' | AzkarCategory>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { showTranslit, setShowTranslit } = useReaderTransliteration();

  const filteredAzkar = useMemo(
    () => getAzkarByCategory(categoryFilter),
    [categoryFilter]
  );

  const jsonLd = useMemo(
    () => [
      buildBreadcrumbJsonLd(window.location.origin, [
        { name: 'Ana səhifə', path: '/' },
        { name: 'Səhər və Axşam Zikrləri', path: '/zikr' },
      ]),
    ],
    []
  );

  function handleNav(e: MouseEvent<HTMLAnchorElement>, path: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  }

  async function handleCopyAzkar(
    id: string,
    arabic: string,
    translation: string,
    title: string,
    countNote?: string
  ) {
    try {
      const countLine = countNote ? `\nOxunuş sayı: ${countNote}` : '';
      await navigator.clipboard.writeText(`${title}${countLine}\n\n${arabic}\n\n«${translation}»`);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1800);
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <article className="py-12 lg:py-16" data-testid="zikr-page">
      <SeoHead
        title="Səhər və Axşam Zikrləri (Müsəlman Qalası) | Quran Qiraeti"
        description="Müsəlman Qalası (Hisn al-Muslim) kitabından bütün səhər, axşam və namaz sonrası zikrlər — ərəbcə mətn, oxunuş və Azərbaycan tərcüməsi."
        path="/zikr"
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-5xl px-6">
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400"
        >
          <a
            href="/"
            onClick={(e) => handleNav(e, '/')}
            className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]"
          >
            Ana səhifə
          </a>
          <span aria-hidden="true">›</span>
          <span className="font-medium text-stone-800 dark:text-stone-200">
            Səhər və Axşam Zikrləri
          </span>
        </nav>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <a
            href="/dualar"
            onClick={(e) => handleNav(e, '/dualar')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-[#0F4C3A] dark:text-stone-400 dark:hover:text-[#86C7AE]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Qurandakı Dualar</span>
          </a>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/namaz-vaxtlari"
              onClick={(e) => handleNav(e, '/namaz-vaxtlari')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 whitespace-nowrap shrink-0 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
            >
              <span>Namaz Vaxtları</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={onToggleTheme}
              data-testid="zikr-theme-toggle"
              aria-label={isDark ? 'Gündüz rejiminə keç' : 'Gecə rejiminə keç'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 whitespace-nowrap shrink-0 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
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

        <header className="border-b border-stone-200 pb-7 dark:border-stone-800">
          <p className="text-xs font-medium tracking-wider text-[#0F4C3A] dark:text-[#86C7AE]">
            Müsəlman Qalası (Hisn al-Muslim) · Səhih Hədislərdən
          </p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl text-balance dark:text-stone-100">
            Səhər və Axşam Zikrləri
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            Müsəlman Qalası kitabındakı bütün səhər, axşam və namaz sonrası zikrlər — ərəbcə mətn,
            oxunuş, tövsiyə edilən təkrar sayı və Azərbaycan dilində tərcüməsi.
          </p>
        </header>

        <section aria-labelledby="azkar-list-heading" className="mt-8">
          <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-stone-800">
            <div>
              <h2
                id="azkar-list-heading"
                className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100"
              >
                {AZKAR_CATEGORY_LABELS[categoryFilter]}
              </h2>
              <p
                data-testid="azkar-filtered-count"
                className="mt-0.5 font-mono-tabular text-xs text-stone-500 dark:text-stone-400"
              >
                {filteredAzkar.length} zikr
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTranslit(!showTranslit)}
                aria-pressed={showTranslit}
                data-testid="zikr-translit-toggle"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  showTranslit
                    ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                    : 'border border-stone-200 bg-white text-stone-700 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200'
                }`}
              >
                Oxunuş
              </button>

              <div
                role="group"
                aria-label="Zikr kateqoriyası"
                className="flex flex-wrap items-center gap-1 rounded-lg border border-stone-200 bg-white p-1 dark:border-stone-700 dark:bg-[#141916]"
              >
                {(Object.keys(AZKAR_CATEGORY_LABELS) as Array<'all' | AzkarCategory>).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    data-testid={`azkar-cat-${cat}`}
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                      categoryFilter === cat
                        ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                        : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                    }`}
                  >
                    {AZKAR_CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {filteredAzkar.map((item, idx) => (
              <div
                key={item.id}
                data-testid={`azkar-card-${item.id}`}
                className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-[#141916]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      <span className="font-mono-tabular font-semibold text-stone-700 dark:text-stone-300">
                        {idx + 1}.
                      </span>{' '}
                      <span>{item.timeLabel ?? AZKAR_CATEGORY_LABELS[item.category]}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
                        {item.countNote ?? `${item.targetCount} dəfə`}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span>{item.source}</span>
                    </p>
                    <h3 className="font-display mt-1.5 text-lg font-semibold text-stone-900 dark:text-stone-100">
                      {item.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopyAzkar(
                        item.id,
                        item.arabicText,
                        item.translation,
                        item.title,
                        item.countNote ?? `${item.targetCount} dəfə`
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-[#FAF9F6] px-2.5 py-1.5 text-xs font-medium text-stone-600 whitespace-nowrap shrink-0 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-300"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#0F4C3A]" aria-hidden="true" />
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
                  lang="ar"
                  dir="rtl"
                  className="font-arabic mt-4 text-right text-2xl leading-[2.25] text-stone-900 sm:text-3xl dark:text-stone-100"
                >
                  {item.arabicText}
                </p>

                {showTranslit && (
                  <p
                    data-testid={`azkar-translit-${item.id}`}
                    className="mt-3 text-sm font-medium italic leading-relaxed text-[#0F4C3A] dark:text-[#86C7AE]"
                  >
                    {transliterateArabicToAz(item.arabicText)}
                  </p>
                )}

                <p className="mt-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                  {item.translation}
                </p>
                <p className="mt-2.5 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                  Fəziləti: {item.virtue}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
