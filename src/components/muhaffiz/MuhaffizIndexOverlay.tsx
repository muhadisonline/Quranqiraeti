import { Bookmark, ChevronLeft, Menu, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { HifzProgressState, JuzHifzSummary } from '../../lib/hifzProgress';
import {
  MUHAFFIZ_THEME_PALETTES,
  MuhaffizPaperTheme,
  clampMuhaffizPage,
} from '../../lib/muhaffiz';
import { JUZ_PAGE_RANGES, SURAH_CATALOG, TOTAL_QURAN_PAGES } from '../../lib/quran';

interface MuhaffizIndexOverlayProps {
  isOpen: boolean;
  currentPage: number;
  currentSurahName: string;
  paperTheme: MuhaffizPaperTheme;
  hifzProgress: HifzProgressState;
  juzSummary: JuzHifzSummary[];
  onClose: () => void;
  onSelectPage: (page: number) => void;
  onOpenSettings: () => void;
}

function getJuzForPage(page: number): number {
  const found = JUZ_PAGE_RANGES.find((j) => page >= j.startPage && page <= j.endPage);
  return found?.juz ?? 1;
}

export function MuhaffizIndexOverlay({
  isOpen,
  currentPage,
  currentSurahName,
  paperTheme,
  hifzProgress,
  juzSummary,
  onClose,
  onSelectPage,
  onOpenSettings,
}: MuhaffizIndexOverlayProps) {
  const [activeTab, setActiveTab] = useState<'surahs' | 'juz'>('surahs');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageJumpInput, setPageJumpInput] = useState(String(currentPage));

  const palette = MUHAFFIZ_THEME_PALETTES[paperTheme];
  const subtleBg = palette.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(109,92,69,0.06)';

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

      {/* Full-width SURƏLƏR | CÜZLƏR Tab Strip */}
      <div
        style={{ borderBottom: `1px solid ${palette.line}` }}
        className="grid shrink-0 grid-cols-2 text-xs font-bold tracking-wider uppercase"
      >
        <button
          type="button"
          onClick={() => setActiveTab('surahs')}
          style={{
            borderBottom: activeTab === 'surahs' ? `2px solid ${palette.green}` : '2px solid transparent',
            color: activeTab === 'surahs' ? palette.ink : palette.muted,
          }}
          className="py-2.5 text-center transition-colors"
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
          className="py-2.5 text-center transition-colors"
        >
          CÜZLƏR
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
        ) : (
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
        )}
      </div>
    </div>
  );
}
