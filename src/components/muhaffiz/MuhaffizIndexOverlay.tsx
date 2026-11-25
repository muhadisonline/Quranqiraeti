import { AlertCircle, Bookmark, CheckCircle2, ChevronLeft, Menu, RotateCcw, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  HifzProgressState,
  JuzHifzSummary,
  buildHifzReviewQueue,
  summarizeHifzProgress,
} from '../../lib/hifzProgress';
import {
  MUHAFFIZ_THEME_PALETTES,
  MissedWordRecord,
  MuhaffizPaperTheme,
  clampMuhaffizPage,
} from '../../lib/muhaffiz';
import {
  WEAK_AYAH_REASON_LABELS,
  WeakAyahRecord,
  sortWeakAyahReviewQueue,
} from '../../lib/muhaffizReview';
import { JUZ_PAGE_RANGES, SURAH_CATALOG, TOTAL_QURAN_PAGES } from '../../lib/quran';

interface MuhaffizIndexOverlayProps {
  isOpen: boolean;
  currentPage: number;
  currentSurahName: string;
  paperTheme: MuhaffizPaperTheme;
  hifzProgress: HifzProgressState;
  juzSummary: JuzHifzSummary[];
  missedWords?: MissedWordRecord[];
  weakAyahs?: WeakAyahRecord[];
  onMarkWeakAyahMastered?: (ayahKey: string) => void;
  onClose: () => void;
  onSelectPage: (page: number) => void;
  onOpenSettings: () => void;
}

function getJuzForPage(page: number): number {
  const found = JUZ_PAGE_RANGES.find((j) => page >= j.startPage && page <= j.endPage);
  return found?.juz ?? 1;
}

function getSurahForPage(page: number): string {
  let match = SURAH_CATALOG[0]?.name ?? 'Fatihə';
  for (const s of SURAH_CATALOG) {
    if (s.startPage <= page) match = s.name;
    else break;
  }
  return match;
}

export function MuhaffizIndexOverlay({
  isOpen,
  currentPage,
  currentSurahName,
  paperTheme,
  hifzProgress,
  juzSummary,
  missedWords = [],
  weakAyahs = [],
  onMarkWeakAyahMastered,
  onClose,
  onSelectPage,
  onOpenSettings,
}: MuhaffizIndexOverlayProps) {
  const [activeTab, setActiveTab] = useState<'surahs' | 'juz' | 'review'>('surahs');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageJumpInput, setPageJumpInput] = useState(String(currentPage));

  const palette = MUHAFFIZ_THEME_PALETTES[paperTheme];
  const subtleBg = palette.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(109,92,69,0.06)';
  const reviewQueue = useMemo(
    () => buildHifzReviewQueue(hifzProgress, missedWords),
    [hifzProgress, missedWords]
  );
  const weakAyahQueue = useMemo(
    () => sortWeakAyahReviewQueue(weakAyahs),
    [weakAyahs]
  );
  const totalReviewBadgeCount = reviewQueue.length + weakAyahQueue.length;
  const hifzTotals = useMemo(() => summarizeHifzProgress(hifzProgress), [hifzProgress]);

  const filteredSurahs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SURAH_CATALOG;
    return SURAH_CATALOG.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        String(s.number) === q ||
        String(s.startPage) === q ||
        s.arabicName.includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  const cleanCurrentSurah = currentSurahName.replace(/\s+surəsi$/i, '').trim();

  // Group filtered surahs under Juz dividers when showing SURƏLƏR list
  let lastSeenJuz = -1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Surə və səhifə"
      data-testid="muhaffiz-index-overlay"
      dir="ltr"
      style={{ backgroundColor: palette.paper, color: palette.ink }}
      className="fixed inset-0 z-40 flex flex-col overflow-hidden"
    >
      {/* Top Bar matching quran.mushafuk.online .t-ix-top */}
      <header className="flex h-13 shrink-0 items-center justify-between px-3 sm:px-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Geri"
            className="grid h-9 w-9 place-items-center rounded-full transition-opacity hover:opacity-75"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="text-base font-bold tracking-tight">Mühafiz</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Surə və ya səhifə axtar"
            aria-expanded={searchOpen}
            style={{ borderColor: palette.line }}
            className="grid h-9 w-9 place-items-center rounded-full border transition-opacity hover:opacity-75"
          >
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Ayarlar"
            style={{ borderColor: palette.line }}
            className="grid h-9 w-9 place-items-center rounded-full border transition-opacity hover:opacity-75"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Search & Quick Page Jump Bar */}
      <div className="shrink-0 space-y-2 px-3 pb-2.5 sm:px-5">
        {/* Son oxunan pill banner */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: palette.chip, borderColor: palette.line }}
            className="flex flex-1 items-center justify-between rounded-xl border px-3.5 py-2 text-left text-xs font-medium"
          >
            <span>
              Son oxunan: <strong>{cleanCurrentSurah}</strong> · səh. {currentPage}
            </span>
            {hifzProgress.bookmarkedPage !== null && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPage(hifzProgress.bookmarkedPage!);
                }}
                style={{ color: palette.gold }}
                className="inline-flex items-center gap-1 font-semibold hover:underline"
              >
                <Bookmark className="h-3 w-3 fill-current" />
                Əlfəcin: {hifzProgress.bookmarkedPage}
              </span>
            )}
          </button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSelectPage(clampMuhaffizPage(Number.parseInt(pageJumpInput, 10) || 1));
            }}
            className="flex items-center gap-1.5"
          >
            <label htmlFor="mushafuk-page-jump" className="sr-only">
              Səhifə nömrəsi (1–604)
            </label>
            <input
              id="mushafuk-page-jump"
              type="number"
              min={1}
              max={TOTAL_QURAN_PAGES}
              value={pageJumpInput}
              onChange={(e) => setPageJumpInput(e.target.value)}
              style={{ backgroundColor: palette.chip, borderColor: palette.line }}
              className="w-20 rounded-xl border px-2.5 py-1.5 text-center font-mono-tabular text-xs focus:outline-none"
            />
            <button
              type="submit"
              style={{ backgroundColor: palette.green, color: palette.paper }}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold"
            >
              Aç
            </button>
          </form>
        </div>

        {searchOpen && (
          <input
            type="search"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Surə adı, nömrə və ya səhifə yazın..."
            style={{ backgroundColor: palette.chip, borderColor: palette.line }}
            className="w-full rounded-xl border px-3.5 py-2 text-sm focus:outline-none"
          />
        )}
      </div>

      {/* Full-width SURƏLƏR | CÜZLƏR | TƏKRAR Tab Strip */}
      <div
        style={{ borderBottom: `1px solid ${palette.line}` }}
        className="grid shrink-0 grid-cols-3 text-xs font-bold tracking-wider uppercase"
      >
        <button
          type="button"
          onClick={() => setActiveTab('surahs')}
          style={{
            borderBottom: activeTab === 'surahs' ? `2px solid ${palette.green}` : '2px solid transparent',
            color: activeTab === 'surahs' ? palette.ink : palette.muted,
          }}
          className="py-2.5 text-center"
        >
          SURƏLƏR
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('juz')}
          style={{
            borderBottom: activeTab === 'juz' ? `2px solid ${palette.green}` : '2px solid transparent',
            color: activeTab === 'juz' ? palette.ink : palette.muted,
          }}
          className="py-2.5 text-center"
        >
          CÜZLƏR
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('review')}
          data-testid="muhaffiz-index-review-tab"
          style={{
            borderBottom: activeTab === 'review' ? `2px solid ${palette.green}` : '2px solid transparent',
            color: activeTab === 'review' ? palette.ink : palette.muted,
          }}
          className="py-2.5 text-center"
        >
          TƏKRAR{totalReviewBadgeCount > 0 ? ` (${totalReviewBadgeCount})` : ''}
        </button>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'surahs' ? (
          <div>
            {filteredSurahs.map((surah) => {
              const surahJuz = getJuzForPage(surah.startPage);
              const showJuzHeader = !searchQuery.trim() && surahJuz !== lastSeenJuz;
              lastSeenJuz = surahJuz;
              const juzRange = JUZ_PAGE_RANGES.find((j) => j.juz === surahJuz);

              return (
                <div key={surah.number}>
                  {showJuzHeader && juzRange && (
                    <button
                      type="button"
                      onClick={() => onSelectPage(juzRange.startPage)}
                      style={{
                        backgroundColor: subtleBg,
                        borderBottom: `1px solid ${palette.line}`,
                        color: palette.ink,
                      }}
                      className="flex w-full items-center justify-between px-4 py-2 text-xs font-semibold sm:px-6"
                    >
                      <span>Cüz {juzRange.juz}</span>
                      <span className="font-mono-tabular">{juzRange.startPage}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectPage(surah.startPage)}
                    style={{ borderBottom: `1px solid ${palette.line}` }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-black/4 sm:px-6"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className="w-7 font-mono-tabular text-xs font-medium"
                        style={{ color: palette.muted }}
                      >
                        {surah.number}
                      </span>
                      <div>
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-sm font-semibold">{surah.name}</span>
                          <span
                            dir="rtl"
                            lang="ar"
                            style={{ color: palette.gold }}
                            className="font-arabic text-base"
                          >
                            {surah.arabicName}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: palette.muted }}>
                          {surah.revelationPlace} — {surah.ayahCount} ayə
                        </p>
                      </div>
                    </div>

                    <span
                      className="font-mono-tabular text-xs font-medium"
                      style={{ color: palette.muted }}
                    >
                      {surah.startPage}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : activeTab === 'juz' ? (
          <div>
            {juzSummary.map((j) => (
              <button
                key={j.juz}
                type="button"
                data-testid={`muhaffiz-juz-card-${j.juz}`}
                onClick={() => onSelectPage(j.startPage)}
                style={{ borderBottom: `1px solid ${palette.line}` }}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-black/4 sm:px-6"
              >
                <div className="flex items-center gap-4">
                  <span
                    className="w-7 font-mono-tabular text-xs font-semibold"
                    style={{ color: palette.muted }}
                  >
                    {j.juz}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{j.juz}-ci Cüz</p>
                    <p className="text-xs" style={{ color: palette.muted }}>
                      Səhifə {j.startPage}–{j.endPage}
                      {j.memorizedPages > 0 && ` · Əzbərlənib: ${j.memorizedPages}/${j.totalPages}`}
                    </p>
                  </div>
                </div>
                <span
                  className="font-mono-tabular text-xs font-medium"
                  style={{ color: palette.muted }}
                >
                  {j.startPage}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div data-testid="muhaffiz-review-list">
            {/* Compact Hifz Khatm Progress Summary */}
            <div
              style={{ backgroundColor: subtleBg, borderBottom: `1px solid ${palette.line}` }}
              className="space-y-2 px-4 py-3 sm:px-6"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">Ümumi Hifz irəliləyişi</span>
                <span className="font-mono-tabular font-bold" style={{ color: palette.green }}>
                  {hifzTotals.memorizedCount} / {TOTAL_QURAN_PAGES} səhifə ({hifzTotals.memorizedPercent}%)
                </span>
              </div>
              <div
                style={{ backgroundColor: palette.line }}
                className="h-1.5 w-full overflow-hidden rounded-full"
              >
                <div
                  style={{
                    width: `${Math.min(100, hifzTotals.memorizedPercent)}%`,
                    backgroundColor: palette.green,
                  }}
                  className="h-full rounded-full transition-all duration-300"
                />
              </div>
            </div>

            {/* Weak / Struggled Ayahs Queue ("Təkrar gözləyənlər") */}
            {weakAyahQueue.length > 0 && (
              <div
                data-testid="muhaffiz-weak-ayahs-queue"
                style={{ borderBottom: `1px solid ${palette.line}` }}
                className="px-4 py-3 sm:px-6"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider uppercase" style={{ color: palette.green }}>
                    Təkrar gözləyənlər ({weakAyahQueue.length} ayə)
                  </span>
                </div>
                <div className="space-y-2">
                  {weakAyahQueue.map((item) => (
                    <div
                      key={`weak-${item.ayahKey}`}
                      data-testid={`weak-ayah-item-${item.ayahKey}`}
                      style={{ backgroundColor: palette.chip, borderColor: palette.line }}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectPage(item.pageNumber)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="text-xs font-semibold">
                          {item.surahName.replace(/\s+surəsi$/i, '')} · {item.ayahKey}{' '}
                          <span className="font-mono-tabular font-normal" style={{ color: palette.muted }}>
                            (Səh. {item.pageNumber})
                          </span>
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]" style={{ color: palette.muted }}>
                          <span>{item.mistakeCount}× çətinlik</span>
                          <span>·</span>
                          <span>
                            {item.reasons.map((r) => WEAK_AYAH_REASON_LABELS[r]).join(', ')}
                          </span>
                        </p>
                      </button>
                      <div className="flex items-center gap-1.5">
                        {onMarkWeakAyahMastered && (
                          <button
                            type="button"
                            onClick={() => onMarkWeakAyahMastered(item.ayahKey)}
                            data-testid={`weak-ayah-master-${item.ayahKey}`}
                            style={{ borderColor: palette.line, color: palette.green, backgroundColor: palette.paper }}
                            className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold hover:opacity-80"
                          >
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            <span>Mənimsədim</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectPage(item.pageNumber)}
                          style={{ backgroundColor: palette.green, color: palette.paper }}
                          className="rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                        >
                          Aç →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reviewQueue.length === 0 && weakAyahQueue.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-semibold">Hələ təkrar siyahısı boşdur</p>
                <p className="mt-1 text-xs" style={{ color: palette.muted }}>
                  Oxuyarkən xəta qeyd etdiyiniz, çətinlik çəkdiyiniz ayələr və ya "Əzbərlədim / Təkrarda"
                  seçdiyiniz səhifələr prioritet sırası ilə burada toplanır.
                </p>
              </div>
            ) : reviewQueue.length === 0 ? null : (
              <div>
                {reviewQueue.map((entry) => {
                  const surahName = getSurahForPage(entry.pageNumber);
                  return (
                    <button
                      key={`rev-${entry.pageNumber}`}
                      type="button"
                      onClick={() => onSelectPage(entry.pageNumber)}
                      style={{ borderBottom: `1px solid ${palette.line}` }}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-black/4 sm:px-6"
                    >
                      <div className="flex items-center gap-3.5">
                        <span
                          className="w-8 font-mono-tabular text-xs font-bold"
                          style={{ color: palette.muted }}
                        >
                          {entry.pageNumber}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">{surahName}</span>
                            {entry.mistakeCount > 0 && (
                              <span
                                style={{
                                  backgroundColor: palette.isDark
                                    ? 'rgba(168,90,76,0.2)'
                                    : 'rgba(122,59,46,0.12)',
                                  color: palette.isDark ? '#e69b8d' : '#7a3b2e',
                                }}
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                              >
                                <AlertCircle className="h-3 w-3" />
                                {entry.mistakeCount} xəta
                              </span>
                            )}
                            {entry.status === 'memorized' && (
                              <span
                                style={{
                                  backgroundColor: palette.chip,
                                  color: palette.green,
                                }}
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Əzbərlənib
                              </span>
                            )}
                            {entry.status === 'learning' && (
                              <span
                                style={{
                                  backgroundColor: palette.chip,
                                  color: palette.gold,
                                }}
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Təkrarda
                              </span>
                            )}
                            {entry.isBookmarked && (
                              <Bookmark
                                className="h-3.5 w-3.5 fill-current"
                                style={{ color: palette.gold }}
                              />
                            )}
                            {entry.repetitions > 0 && (
                              <span
                                style={{
                                  backgroundColor: palette.chip,
                                  color: palette.muted,
                                }}
                                className="rounded-full px-2 py-0.5 font-mono-tabular text-[11px] font-semibold"
                              >
                                ×{entry.repetitions} təkrar
                              </span>
                            )}
                          </div>
                          <p className="text-xs" style={{ color: palette.muted }}>
                            Cüz {getJuzForPage(entry.pageNumber)} · Səhifə {entry.pageNumber}
                          </p>
                        </div>
                      </div>
                      <span
                        className="font-mono-tabular text-xs font-medium"
                        style={{ color: palette.green }}
                      >
                        Aç →
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
