import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Maximize2,
  Moon,
  Printer,
  RotateCcw,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { MouseEvent, TouchEvent, useEffect, useMemo, useRef, useState } from 'react';
import { SeoHead } from '../components/SeoHead';
import {
  AZKAR_CATEGORY_LABELS,
  AzkarCategory,
  getAzkarByCategory,
} from '../data/azkar';
import { useReaderTransliteration } from '../hooks/useReaderPreferences';
import { buildBreadcrumbJsonLd } from '../lib/seo';
import { transliterateArabicToAz } from '../lib/transliteration';
import {
  evaluateZikrCardSwipe,
  getDefaultZikrCategoryForTime,
  getZikrTimeBannerText,
  stepZikrCardIndex,
} from '../lib/zikrFocus';

interface ZikrPageProps {
  isDark: boolean;
  onNavigate: (path: string) => void;
  onToggleTheme: () => void;
}

export function ZikrPage({ isDark, onNavigate, onToggleTheme }: ZikrPageProps) {
  const recommendedCategory = useMemo(() => getDefaultZikrCategoryForTime(), []);
  const [categoryFilter, setCategoryFilter] = useState<'all' | AzkarCategory>(recommendedCategory);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [focusOpen, setFocusOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const [countsById, setCountsById] = useState<Record<string, number>>({});
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const { showTranslit, setShowTranslit } = useReaderTransliteration();

  const filteredAzkar = useMemo(
    () => getAzkarByCategory(categoryFilter),
    [categoryFilter]
  );

  const safeFocusIndex =
    filteredAzkar.length > 0 ? Math.min(focusIndex, filteredAzkar.length - 1) : 0;
  const activeFocusItem = filteredAzkar[safeFocusIndex] ?? null;

  useEffect(() => {
    setFocusIndex(0);
  }, [categoryFilter]);

  useEffect(() => {
    if (!focusOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setFocusOpen(false);
      } else if (e.key === 'ArrowRight') {
        setFocusIndex((idx) => stepZikrCardIndex(idx, filteredAzkar.length, 'next'));
      } else if (e.key === 'ArrowLeft') {
        setFocusIndex((idx) => stepZikrCardIndex(idx, filteredAzkar.length, 'prev'));
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusOpen, filteredAzkar.length]);

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

  function incrementZikrCounter(id: string, targetCount: number) {
    setCountsById((prev) => {
      const cur = prev[id] ?? 0;
      const next = cur >= targetCount ? targetCount : cur + 1;
      return { ...prev, [id]: next };
    });
  }

  function resetZikrCounter(id: string) {
    setCountsById((prev) => ({ ...prev, [id]: 0 }));
  }

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    const touch = e.changedTouches[0];
    if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(e: TouchEvent<HTMLDivElement>) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const touch = e.changedTouches[0];
    if (!start || !touch) return;
    const dir = evaluateZikrCardSwipe(start.x, start.y, touch.clientX, touch.clientY);
    if (dir) {
      setFocusIndex((idx) => stepZikrCardIndex(idx, filteredAzkar.length, dir));
    }
  }

  return (
    <article className="py-12 lg:py-16 print:py-4" data-testid="zikr-page">
      <SeoHead
        title="Səhər və Axşam Zikrləri (Müsəlman Qalası) | Quran Qiraeti"
        description="Müsəlman Qalası (Hisn al-Muslim) kitabından bütün səhər, axşam və namaz sonrası zikrlər — ərəbcə mətn, oxunuş və Azərbaycan tərcüməsi."
        path="/zikr"
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-5xl px-6">
        <nav
          aria-label="Breadcrumb"
          className="print:hidden mb-5 flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400"
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

        <div className="print:hidden mb-6 flex flex-wrap items-center justify-between gap-3">
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
              onClick={() => window.print()}
              data-testid="zikr-print-btn"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 whitespace-nowrap shrink-0 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Çap / PDF</span>
            </button>
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

          {/* Smart Time Focus Banner */}
          <div
            data-testid="zikr-time-focus-banner"
            className="print:hidden mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#0F4C3A]/20 bg-[#F2F7F4] px-4 py-3 dark:border-[#86C7AE]/20 dark:bg-[#12211A]"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{getZikrTimeBannerText(recommendedCategory)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {categoryFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  data-testid="zikr-show-all-btn"
                  className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
                >
                  Hamısını göstər
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setFocusIndex(0);
                  setFocusOpen(true);
                }}
                data-testid="zikr-card-focus-toggle"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F4C3A] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0B3A2C] dark:bg-[#196B52]"
              >
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Kart-kart tam ekran oxu</span>
              </button>
            </div>
          </div>
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

            <div className="print:hidden flex flex-wrap items-center gap-2">
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
            {filteredAzkar.map((item, idx) => {
              const currentCount = countsById[item.id] ?? 0;
              const isCompleted = currentCount >= item.targetCount;
              return (
                <div
                  key={item.id}
                  data-testid={`azkar-card-${item.id}`}
                  className="print-avoid-break rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-[#141916]"
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

                    <div className="print:hidden flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => incrementZikrCounter(item.id, item.targetCount)}
                        data-testid={`azkar-count-btn-${item.id}`}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 font-mono-tabular text-xs font-semibold whitespace-nowrap transition-colors ${
                          isCompleted
                            ? 'border-[#0F4C3A] bg-[#0F4C3A] text-white dark:border-[#196B52] dark:bg-[#196B52]'
                            : 'border-stone-200 bg-[#FAF9F6] text-stone-700 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200'
                        }`}
                      >
                        {isCompleted && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                        <span>
                          {currentCount} / {item.targetCount}
                        </span>
                      </button>
                      {currentCount > 0 && (
                        <button
                          type="button"
                          onClick={() => resetZikrCounter(item.id)}
                          aria-label={`${item.title} sayğacını sıfırla`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:border-stone-300 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-400"
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setFocusIndex(idx);
                          setFocusOpen(true);
                        }}
                        aria-label={`${item.title} kartını tam ekranda aç`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-300"
                      >
                        <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
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
              );
            })}
          </div>
        </section>
      </div>

      {/* Full-Screen Card-by-Card Reading Mode */}
      {focusOpen && activeFocusItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Kart-kart tam ekran zikr oxu rejimi"
          data-testid="zikr-card-focus-modal"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="print:hidden fixed inset-0 z-50 flex flex-col bg-[#FAF9F6] text-stone-900 dark:bg-[#0B0F0D] dark:text-stone-100"
        >
          {/* Top Focus Bar */}
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 sm:px-6 dark:border-stone-800">
            <div className="flex items-center gap-3">
              <span className="font-mono-tabular text-xs font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
                {safeFocusIndex + 1} / {filteredAzkar.length}
              </span>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {AZKAR_CATEGORY_LABELS[categoryFilter]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTranslit(!showTranslit)}
                aria-pressed={showTranslit}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                  showTranslit
                    ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                    : 'border border-stone-200 bg-white text-stone-700 dark:border-stone-700 dark:bg-[#141916] dark:text-stone-300'
                }`}
              >
                Oxunuş
              </button>
              <button
                type="button"
                onClick={() => setFocusOpen(false)}
                data-testid="zikr-card-focus-close"
                aria-label="Tam ekran zikr rejimini bağla"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Center Card Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
            <div className="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8 dark:border-stone-800 dark:bg-[#141916]">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                <span>{activeFocusItem.timeLabel ?? AZKAR_CATEGORY_LABELS[activeFocusItem.category]}</span>
                <span aria-hidden="true"> · </span>
                <span className="font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
                  {activeFocusItem.countNote ?? `${activeFocusItem.targetCount} dəfə`}
                </span>
              </p>
              <h2 className="font-display mt-2 text-2xl font-semibold text-stone-900 dark:text-stone-100">
                {activeFocusItem.title}
              </h2>

              <p
                lang="ar"
                dir="rtl"
                className="font-arabic mt-6 text-right text-3xl leading-[2.35] text-stone-900 sm:text-4xl dark:text-stone-100"
              >
                {activeFocusItem.arabicText}
              </p>

              {showTranslit && (
                <p className="mt-4 text-sm font-medium italic leading-relaxed text-[#0F4C3A] dark:text-[#86C7AE]">
                  {transliterateArabicToAz(activeFocusItem.arabicText)}
                </p>
              )}

              <p className="mt-5 text-base leading-relaxed text-stone-700 dark:text-stone-300">
                {activeFocusItem.translation}
              </p>

              <p className="mt-4 border-t border-stone-100 pt-3 text-xs leading-relaxed text-stone-500 dark:border-stone-800 dark:text-stone-400">
                Fəziləti: {activeFocusItem.virtue} · {activeFocusItem.source}
              </p>
            </div>
          </div>

          {/* Bottom Swipe & Counter Controls */}
          <div className="border-t border-stone-200 bg-white/95 px-4 py-3.5 sm:px-6 dark:border-stone-800 dark:bg-[#141916]/95">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
              <button
                type="button"
                disabled={safeFocusIndex <= 0}
                onClick={() =>
                  setFocusIndex((idx) => stepZikrCardIndex(idx, filteredAzkar.length, 'prev'))
                }
                data-testid="zikr-focus-prev"
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-2.5 text-xs font-semibold text-stone-700 disabled:opacity-40 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span>Əvvəlki</span>
              </button>

              {(() => {
                const count = countsById[activeFocusItem.id] ?? 0;
                const done = count >= activeFocusItem.targetCount;
                return (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        incrementZikrCounter(activeFocusItem.id, activeFocusItem.targetCount)
                      }
                      data-testid="zikr-focus-counter"
                      className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-mono-tabular text-sm font-bold transition-colors ${
                        done
                          ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                          : 'border-2 border-[#0F4C3A] bg-[#0F4C3A]/10 text-[#0F4C3A] dark:border-[#86C7AE] dark:text-[#86C7AE]'
                      }`}
                    >
                      {done && <Check className="h-4 w-4" aria-hidden="true" />}
                      <span>
                        Təsbih: {count} / {activeFocusItem.targetCount}
                      </span>
                    </button>
                    {count > 0 && (
                      <button
                        type="button"
                        onClick={() => resetZikrCounter(activeFocusItem.id)}
                        aria-label="Sayğacı sıfırla"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-[#FAF9F6] text-stone-600 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-300"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                );
              })()}

              <button
                type="button"
                disabled={safeFocusIndex >= filteredAzkar.length - 1}
                onClick={() =>
                  setFocusIndex((idx) => stepZikrCardIndex(idx, filteredAzkar.length, 'next'))
                }
                data-testid="zikr-focus-next"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F4C3A] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40 dark:bg-[#196B52]"
              >
                <span>Növbəti</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
