import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  Undo2,
} from 'lucide-react';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { SeoHead } from '../components/SeoHead';
import {
  AZKAR_CATEGORY_LABELS,
  AzkarCategory,
  DAILY_AZKAR,
  TASBIH_PRESETS,
} from '../data/azkar';
import { useReaderTransliteration } from '../hooks/useReaderPreferences';
import { buildBreadcrumbJsonLd } from '../lib/seo';
import { transliterateArabicToAz } from '../lib/transliteration';
import {
  ZikrTrackerState,
  createEmptyZikrState,
  decrementTasbihStep,
  getNamazStageMeta,
  incrementAzkarItemStep,
  incrementTasbihStep,
  loadZikrStateFromStorage,
  saveZikrStateToStorage,
} from '../lib/zikrState';

interface ZikrPageProps {
  isDark: boolean;
  onNavigate: (path: string) => void;
  onToggleTheme: () => void;
}

const TARGET_OPTIONS = [33, 99, 100, 0] as const;

export function ZikrPage({ isDark, onNavigate, onToggleTheme }: ZikrPageProps) {
  const [state, setState] = useState<ZikrTrackerState>(() => loadZikrStateFromStorage());
  const [categoryFilter, setCategoryFilter] = useState<'all' | AzkarCategory>('all');
  const [cycleNotice, setCycleNotice] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { showTranslit, setShowTranslit } = useReaderTransliteration();

  const updateState = useCallback((updater: (prev: ZikrTrackerState) => ZikrTrackerState) => {
    setState((prev) => {
      const next = updater(prev);
      saveZikrStateToStorage(next);
      return next;
    });
  }, []);

  const handleTapTasbih = useCallback(() => {
    setState((prev) => {
      const { nextState, cycleCompleted } = incrementTasbihStep(prev);
      saveZikrStateToStorage(nextState);
      if (cycleCompleted) {
        setCycleNotice(
          prev.namazSequenceMode
            ? 'Namaz sonrası tam təsbihat (33+33+34) tamamlandı!'
            : `${prev.tasbihTarget} zikr dövrəsi tamamlandı!`
        );
      }
      return nextState;
    });
  }, []);

  useEffect(() => {
    if (!cycleNotice) return;
    const t = window.setTimeout(() => setCycleNotice(''), 3200);
    return () => window.clearTimeout(t);
  }, [cycleNotice]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== 'Space') return;
      const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT' || activeTag === 'BUTTON') {
        return;
      }
      e.preventDefault();
      handleTapTasbih();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTapTasbih]);

  const activePreset = useMemo(
    () => TASBIH_PRESETS.find((p) => p.id === state.activePresetId) ?? TASBIH_PRESETS[0],
    [state.activePresetId]
  );

  const stageMeta = useMemo(
    () => (state.namazSequenceMode ? getNamazStageMeta(state.namazStage) : null),
    [state.namazSequenceMode, state.namazStage]
  );

  const effectiveTarget = stageMeta ? stageMeta.target : state.tasbihTarget;
  const progressPercent =
    effectiveTarget > 0 ? Math.min(100, Math.round((state.tasbihCount / effectiveTarget) * 100)) : 100;

  const filteredAzkar = useMemo(
    () =>
      categoryFilter === 'all'
        ? DAILY_AZKAR
        : DAILY_AZKAR.filter((item) => item.category === categoryFilter),
    [categoryFilter]
  );

  const jsonLd = useMemo(
    () => [
      buildBreadcrumbJsonLd(window.location.origin, [
        { name: 'Ana səhifə', path: '/' },
        { name: 'Zikr və Təsbih', path: '/zikr' },
      ]),
    ],
    []
  );

  function handleNav(e: MouseEvent<HTMLAnchorElement>, path: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  }

  async function handleCopyAzkar(id: string, arabic: string, translation: string, title: string) {
    try {
      await navigator.clipboard.writeText(`${title}\n\n${arabic}\n\n"${translation}"`);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1800);
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <article className="py-12 lg:py-16" data-testid="zikr-page">
      <SeoHead
        title="Səhər-Axşam Zikrləri və Təsbih Sayğacı | Quran Qiraeti"
        description="Onlayn təsbih sayğacı (33 / 99 / 100 və Namaz sonrası 33+33+34 rejimi), Səhər və Axşam zikrləri — ərəbcə mətn, oxunuş və Azərbaycan tərcüməsi."
        path="/zikr"
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-6xl px-6">
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
          <span className="font-medium text-stone-800 dark:text-stone-200">Zikr və Təsbih</span>
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
          <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl text-balance dark:text-stone-100">
            Zikrlər və İnteraktiv Təsbih Sayğacı
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
            Namaz sonrası təsbihat, səhər-axşam zikrləri və gündəlik zikr sayğacı — tərəqqiniz
            avtomatik olaraq yadda saxlanılır.
          </p>
        </header>

        {/* Interactive Tasbih Counter Section */}
        <section
          aria-labelledby="tasbih-counter-heading"
          className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12"
        >
          <div className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8 lg:col-span-7 dark:border-stone-800 dark:bg-[#141916]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2
                  id="tasbih-counter-heading"
                  className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100"
                >
                  {activePreset.title}
                </h2>
                <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                  {activePreset.meaning}
                </p>
              </div>

              <button
                type="button"
                data-testid="namaz-tasbihat-toggle"
                onClick={() =>
                  updateState((prev) => {
                    const enable = !prev.namazSequenceMode;
                    const first = getNamazStageMeta(0);
                    return {
                      ...prev,
                      namazSequenceMode: enable,
                      namazStage: 0,
                      tasbihCount: 0,
                      activePresetId: enable ? first.presetId : prev.activePresetId,
                      tasbihTarget: enable ? first.target : prev.tasbihTarget,
                    };
                  })
                }
                aria-pressed={state.namazSequenceMode}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  state.namazSequenceMode
                    ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                    : 'border border-stone-200 bg-[#FAF9F6] text-stone-700 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Namaz Təsbihatı (33+33+34)</span>
              </button>
            </div>

            {state.namazSequenceMode && stageMeta && (
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
                {([0, 1, 2] as const).map((step) => {
                  const meta = getNamazStageMeta(step);
                  const active = state.namazStage === step;
                  const done = state.namazStage > step;
                  return (
                    <div
                      key={step}
                      className={`rounded-lg border px-2 py-1.5 font-medium ${
                        active
                          ? 'border-[#0F4C3A] bg-[#0F4C3A]/10 text-[#0F4C3A] dark:border-[#86C7AE] dark:bg-[#86C7AE]/15 dark:text-[#86C7AE]'
                          : done
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'border-stone-200 text-stone-500 dark:border-stone-800 dark:text-stone-400'
                      }`}
                    >
                      {meta.label}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 rounded-xl border border-stone-200 bg-[#FAF9F6] px-6 py-6 text-center dark:border-stone-800 dark:bg-[#181E1B]">
              <p lang="ar" dir="rtl" className="font-arabic text-3xl text-stone-900 dark:text-stone-100">
                {activePreset.arabic}
              </p>
              <p className="mt-2 text-xs font-medium italic text-[#0F4C3A] dark:text-[#86C7AE]">
                {activePreset.transliteration}
              </p>

              <div className="mt-5 flex items-baseline justify-center gap-2">
                <span
                  data-testid="tasbih-count-value"
                  className="font-mono-tabular text-5xl font-semibold tracking-tight text-stone-900 dark:text-stone-100"
                >
                  {state.tasbihCount}
                </span>
                {effectiveTarget > 0 && (
                  <span className="font-mono-tabular text-lg text-stone-500 dark:text-stone-400">
                    / {effectiveTarget}
                  </span>
                )}
              </div>

              {effectiveTarget > 0 && (
                <div className="mx-auto mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                  <div
                    style={{ width: `${progressPercent}%` }}
                    className="h-full bg-[#0F4C3A] transition-all duration-150 dark:bg-[#86C7AE]"
                  />
                </div>
              )}

              {cycleNotice && (
                <p
                  role="status"
                  data-testid="tasbih-cycle-notice"
                  className="mt-3 text-xs font-medium text-[#0F4C3A] dark:text-[#86C7AE]"
                >
                  {cycleNotice}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => updateState((prev) => decrementTasbihStep(prev))}
                  disabled={state.tasbihCount === 0}
                  aria-label="Sayğacı 1 azalt"
                  data-testid="tasbih-undo-btn"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-700 disabled:opacity-40 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
                >
                  <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>-1</span>
                </button>

                <button
                  type="button"
                  onClick={handleTapTasbih}
                  data-testid="tasbih-increment-btn"
                  className="min-w-[160px] rounded-xl bg-[#0F4C3A] px-8 py-3.5 text-sm font-semibold text-white transition-transform active:scale-95 hover:bg-[#0B3A2C] dark:bg-[#196B52] dark:hover:bg-[#1E7F61]"
                >
                  Zikr et (+1)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateState((prev) => ({
                      ...prev,
                      tasbihCount: 0,
                      namazStage: 0,
                    }))
                  }
                  aria-label="Cari dövrəni sıfırla"
                  data-testid="tasbih-reset-btn"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-700 hover:border-red-400 hover:text-red-700 dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Sıfırla</span>
                </button>
              </div>
              <p className="mt-3 text-[11px] text-stone-400 dark:text-stone-500">
                İpucu: Klaviaturada boşluq (Space) düyməsi ilə də saymaq olar
              </p>
            </div>
          </div>

          {/* Right column: Presets, Target & Daily Totals */}
          <div className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-6 lg:col-span-5 dark:border-stone-800 dark:bg-[#141916]">
            <div>
              <h3 className="text-xs font-semibold tracking-wider text-stone-500 dark:text-stone-400">
                Zikr Seçimi
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {TASBIH_PRESETS.map((preset) => {
                  const active = state.activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        updateState((prev) => ({
                          ...prev,
                          namazSequenceMode: false,
                          activePresetId: preset.id,
                          tasbihTarget: preset.target,
                          tasbihCount: 0,
                        }))
                      }
                      className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                        active
                          ? 'border-[#0F4C3A] bg-[#0F4C3A]/8 font-semibold text-[#0F4C3A] dark:border-[#86C7AE] dark:bg-[#86C7AE]/12 dark:text-[#86C7AE]'
                          : 'border-stone-200 bg-[#FAF9F6] text-stone-700 hover:border-[#0F4C3A] dark:border-stone-800 dark:bg-[#181E1B] dark:text-stone-300'
                      }`}
                    >
                      <span className="block truncate">{preset.title}</span>
                      <span className="font-mono-tabular text-[11px] text-stone-500 dark:text-stone-400">
                        {preset.target}×
                      </span>
                    </button>
                  );
                })}
              </div>

              {!state.namazSequenceMode && (
                <div className="mt-5">
                  <span className="text-xs font-semibold tracking-wider text-stone-500 dark:text-stone-400">
                    Dövrə Hədəfi
                  </span>
                  <div className="mt-2 inline-flex w-full items-center gap-1 rounded-lg border border-stone-200 bg-[#FAF9F6] p-1 dark:border-stone-800 dark:bg-[#181E1B]">
                    {TARGET_OPTIONS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() =>
                          updateState((prev) => ({
                            ...prev,
                            tasbihTarget: t,
                            tasbihCount: t > 0 && prev.tasbihCount >= t ? 0 : prev.tasbihCount,
                          }))
                        }
                        className={`flex-1 rounded-md py-1.5 font-mono-tabular text-xs font-medium transition-colors ${
                          state.tasbihTarget === t
                            ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                            : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                        }`}
                      >
                        {t === 0 ? 'Sərbəst' : `${t}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-stone-100 pt-5 dark:border-stone-800">
              <div>
                <dt className="text-xs text-stone-500 dark:text-stone-400">Bugünkü cəmi zikr</dt>
                <dd
                  data-testid="zikr-today-total"
                  className="font-mono-tabular mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100"
                >
                  {state.todayTotal}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 dark:text-stone-400">Tamamlanan dövrə</dt>
                <dd
                  data-testid="zikr-cycles-total"
                  className="font-mono-tabular mt-1 text-2xl font-semibold text-[#0F4C3A] dark:text-[#86C7AE]"
                >
                  {state.completedCycles}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Morning / Evening Azkar Section */}
        <section aria-labelledby="azkar-list-heading" className="mt-12">
          <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-stone-800">
            <div>
              <h2
                id="azkar-list-heading"
                className="font-display text-2xl font-semibold text-stone-900 dark:text-stone-100"
              >
                Səhər, Axşam və Namaz Sonrası Zikrlər
              </h2>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                Hər zikr kartında gündəlik təkrar sayını qeyd edə bilərsiniz
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
            {filteredAzkar.map((item) => {
              const current = state.itemCounts[item.id] ?? 0;
              const isComplete = current >= item.targetCount;
              return (
                <div
                  key={item.id}
                  data-testid={`azkar-card-${item.id}`}
                  className={`rounded-xl border p-6 transition-colors ${
                    isComplete
                      ? 'border-[#0F4C3A]/50 bg-[#0F4C3A]/4 dark:border-[#86C7AE]/40 dark:bg-[#86C7AE]/8'
                      : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-[#141916]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                        {AZKAR_CATEGORY_LABELS[item.category]} · {item.source}
                      </p>
                      <h3 className="font-display mt-1 text-lg font-semibold text-stone-900 dark:text-stone-100">
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyAzkar(item.id, item.arabicText, item.translation, item.title)
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-[#FAF9F6] px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-300"
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

                      <button
                        type="button"
                        data-testid={`azkar-inc-${item.id}`}
                        onClick={() =>
                          updateState((prev) => incrementAzkarItemStep(prev, item.id))
                        }
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-mono-tabular text-xs font-semibold whitespace-nowrap transition-colors ${
                          isComplete
                            ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                            : 'border border-[#0F4C3A] text-[#0F4C3A] hover:bg-[#0F4C3A] hover:text-white dark:border-[#86C7AE] dark:text-[#86C7AE] dark:hover:bg-[#196B52] dark:hover:text-white'
                        }`}
                      >
                        {isComplete && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                        <span>
                          {current} / {item.targetCount}
                        </span>
                      </button>
                    </div>
                  </div>

                  <p
                    lang="ar"
                    dir="rtl"
                    className="font-arabic mt-4 text-right text-2xl leading-[2.2] text-stone-900 sm:text-3xl dark:text-stone-100"
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
                  <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                    Fəziləti: {item.virtue}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-right">
            <button
              type="button"
              onClick={() => updateState(() => createEmptyZikrState())}
              className="text-xs font-medium text-stone-500 hover:text-red-700 dark:text-stone-400 dark:hover:text-red-400"
            >
              Bugünkü bütün zikr sayğaclarını sıfırla
            </button>
          </div>
        </section>
      </div>
    </article>
  );
}
