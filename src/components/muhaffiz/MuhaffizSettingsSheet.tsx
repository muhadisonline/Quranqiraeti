import {
  BookOpen,
  Bookmark,
  Check,
  ChevronRight,
  Compass,
  EyeOff,
  FastForward,
  Globe,
  Home,
  Palette,
  RotateCcw,
  Type,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { PWAInstallButton } from '../PWAInstallButton';
import { HifzProgressState, HifzSummary } from '../../lib/hifzProgress';
import {
  MUHAFFIZ_RECITERS,
  MUHAFFIZ_THEME_PALETTES,
  MuhaffizFontSize,
  MuhaffizPaperTheme,
  MuhaffizPreferences,
  MuhaffizReciterId,
} from '../../lib/muhaffiz';
import { TOTAL_QURAN_PAGES } from '../../lib/quran';
import { AudioPlaybackSpeed, AyahRepeatCount } from '../../lib/readerState';

interface MuhaffizSettingsSheetProps {
  isOpen: boolean;
  pageNumber: number;
  revealedAyahCount: number;
  missedCount: number;
  prefs: MuhaffizPreferences;
  hifzSummary: HifzSummary;
  currentPageHifzStatus: HifzProgressState['pages'][number] | 'none';
  isCurrentPageBookmarked: boolean;
  playbackSpeed: AudioPlaybackSpeed;
  repeatCount: AyahRepeatCount;
  isPlayingAudio: boolean;
  allRevealed: boolean;
  pageAyahKeys?: string[];
  rangeStartIdx?: number;
  rangeEndIdx?: number;
  loopRangeActive?: boolean;
  pageRepetitions?: number;
  onClose: () => void;
  onUpdatePrefs: (updater: (prev: MuhaffizPreferences) => MuhaffizPreferences) => void;
  onToggleRevealAll: () => void;
  onToggleAudio: () => void;
  onSetPlaybackSpeed: (spd: AudioPlaybackSpeed) => void;
  onSetRepeatCount: (cnt: AyahRepeatCount) => void;
  onChangeRangeStart?: (idx: number) => void;
  onChangeRangeEnd?: (idx: number) => void;
  onToggleLoopRange?: () => void;
  onIncrementRepetition?: () => void;
  onSetPageStatus: (status: 'memorized' | 'learning' | 'none') => void;
  onToggleBookmark: () => void;
  onOpenIndex: () => void;
  onNavigate: (path: string) => void;
}

export function MuhaffizSettingsSheet({
  isOpen,
  pageNumber,
  revealedAyahCount,
  missedCount,
  prefs,
  hifzSummary,
  currentPageHifzStatus,
  isCurrentPageBookmarked,
  playbackSpeed,
  repeatCount,
  isPlayingAudio,
  allRevealed,
  pageAyahKeys = [],
  rangeStartIdx = 0,
  rangeEndIdx = Math.max(0, pageAyahKeys.length - 1),
  loopRangeActive = false,
  pageRepetitions = 0,
  onClose,
  onUpdatePrefs,
  onToggleRevealAll,
  onToggleAudio,
  onSetPlaybackSpeed,
  onSetRepeatCount,
  onChangeRangeStart,
  onChangeRangeEnd,
  onToggleLoopRange,
  onIncrementRepetition,
  onSetPageStatus,
  onToggleBookmark,
  onOpenIndex,
  onNavigate,
}: MuhaffizSettingsSheetProps) {
  if (!isOpen) return null;

  const palette = MUHAFFIZ_THEME_PALETTES[prefs.paperTheme];
  const cardBg = palette.isDark ? '#1a1916' : '#fffdf8';
  const subRowBorder = palette.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(109,92,69,0.14)';
  const iconBg = palette.isDark ? 'rgba(213,224,218,0.12)' : 'rgba(28,61,50,0.09)';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/38 sm:items-center sm:p-4"
      onClick={onClose}
      dir="ltr"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ayarlar"
        data-testid="muhaffiz-settings-sheet"
        style={{
          backgroundColor: palette.paper,
          color: palette.ink,
          borderColor: palette.line,
        }}
        className="max-h-[88dvh] w-full max-w-[520px] overflow-y-auto rounded-t-2xl border px-4 pt-2.5 pb-6 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div
          aria-hidden="true"
          style={{ backgroundColor: palette.line }}
          className="mx-auto mb-2.5 h-1 w-9 rounded-full sm:hidden"
        />

        {/* Sheet Header */}
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-lg font-bold tracking-tight">Ayarlar</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Bağla"
            className="grid h-8 w-8 place-items-center rounded-full transition-opacity hover:opacity-80"
            style={{ backgroundColor: palette.line }}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Summary Pills */}
        <div className="mb-3 flex flex-wrap gap-1.5 text-xs" style={{ color: palette.muted }}>
          <span
            style={{ backgroundColor: palette.chip, borderColor: palette.line }}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: palette.green }}
            />
            <span>
              Açılan <strong style={{ color: palette.ink }}>{revealedAyahCount}</strong> ayə
            </span>
          </span>
          <span
            style={{ backgroundColor: palette.chip, borderColor: palette.line }}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#9c2f24]" />
            <span>
              <strong style={{ color: palette.ink }}>{missedCount}</strong> xəta
            </span>
          </span>
          <span
            data-testid="hifz-progress-summary"
            style={{ backgroundColor: palette.chip, borderColor: palette.line }}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: palette.gold }}
            />
            <span>
              Hifz <strong style={{ color: palette.ink }}>{hifzSummary.memorizedCount}</strong> /{' '}
              {TOTAL_QURAN_PAGES} ({hifzSummary.memorizedPercent}%)
            </span>
          </span>
        </div>

        {/* Section 1: Hifz və görünüş */}
        <p
          className="mt-3 mb-1.5 px-1 text-[11px] font-bold tracking-wider uppercase"
          style={{ color: palette.muted }}
        >
          Hifz və görünüş
        </p>
        <div
          style={{ backgroundColor: cardBg, borderColor: palette.line }}
          className="overflow-hidden rounded-2xl border"
        >
          {/* Hifz rejimi (Səssiz təkrar) */}
          <div className="flex min-h-[48px] items-center justify-between gap-3 px-3 py-2">
            <div className="flex items-center gap-2.5">
              <span
                style={{ backgroundColor: iconBg, color: palette.green }}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              >
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-medium">Səssiz təkrar (Hifz rejimi)</p>
                <p className="text-xs" style={{ color: palette.muted }}>
                  Sözlər gizlənir, toxunduqca açılır
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.silentMode}
              aria-label="Səssiz təkrar"
              onClick={() =>
                onUpdatePrefs((p) => ({
                  ...p,
                  silentMode: !p.silentMode,
                  autoRevealAllOnLoad: p.silentMode ? true : false,
                }))
              }
              style={{
                backgroundColor: prefs.silentMode ? palette.green : palette.line,
              }}
              className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  prefs.silentMode ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Açılış rejimi */}
          <div
            style={{ borderTop: `1px solid ${subRowBorder}` }}
            className="flex min-h-[46px] items-center justify-between gap-3 px-3 py-2"
          >
            <div className="flex items-center gap-2.5">
              <span
                style={{ backgroundColor: iconBg, color: palette.green }}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              >
                <FastForward className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium">Açılış rejimi</span>
            </div>
            <div
              style={{ backgroundColor: subRowBorder }}
              className="inline-flex rounded-lg p-0.5 text-xs font-semibold"
            >
              {(
                [
                  { id: 'word', label: 'Sözbə-söz' },
                  { id: 'ayah', label: 'Ayə-ayə' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`muhaffiz-mode-${opt.id}`}
                  aria-pressed={prefs.revealMode === opt.id}
                  onClick={() => onUpdatePrefs((p) => ({ ...p, revealMode: opt.id }))}
                  style={
                    prefs.revealMode === opt.id
                      ? { backgroundColor: palette.paper, color: palette.ink }
                      : { color: palette.muted }
                  }
                  className="rounded-md px-2.5 py-1 transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* İlk söz ipucu & Tərcümə paneli */}
          <div
            style={{ borderTop: `1px solid ${subRowBorder}` }}
            className="flex min-h-[44px] items-center justify-between gap-3 px-3 py-2"
          >
            <span className="pl-9.5 text-sm font-medium">İlk sözü ipucu kimi göstər</span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.firstWordHint}
              aria-label="İlk söz ipucu"
              onClick={() => onUpdatePrefs((p) => ({ ...p, firstWordHint: !p.firstWordHint }))}
              style={{
                backgroundColor: prefs.firstWordHint ? palette.green : palette.line,
              }}
              className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  prefs.firstWordHint ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div
            style={{ borderTop: `1px solid ${subRowBorder}` }}
            className="flex min-h-[44px] items-center justify-between gap-3 px-3 py-2"
          >
            <span className="pl-9.5 text-sm font-medium">Açılan ayələrin tərcüməsi</span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.showTranslation}
              aria-label="Tərcüməni göstər"
              onClick={() => onUpdatePrefs((p) => ({ ...p, showTranslation: !p.showTranslation }))}
              style={{
                backgroundColor: prefs.showTranslation ? palette.green : palette.line,
              }}
              className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  prefs.showTranslation ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Mətn ölçüsü */}
          <div
            style={{ borderTop: `1px solid ${subRowBorder}` }}
            className="flex min-h-[46px] items-center justify-between gap-3 px-3 py-2"
          >
            <div className="flex items-center gap-2.5">
              <span
                style={{ backgroundColor: iconBg, color: palette.green }}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              >
                <Type className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium">Mətn ölçüsü</span>
            </div>
            <div
              style={{ backgroundColor: subRowBorder }}
              className="inline-flex rounded-lg p-0.5 text-xs font-semibold"
            >
              {(
                [
                  { id: 'sm' as MuhaffizFontSize, label: 'Kiçik' },
                  { id: 'md' as MuhaffizFontSize, label: 'Orta' },
                  { id: 'lg' as MuhaffizFontSize, label: 'Böyük' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={prefs.fontSize === opt.id}
                  onClick={() => onUpdatePrefs((p) => ({ ...p, fontSize: opt.id }))}
                  style={
                    prefs.fontSize === opt.id
                      ? { backgroundColor: palette.paper, color: palette.ink }
                      : { color: palette.muted }
                  }
                  className="rounded-md px-2.5 py-1 transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Səhifə rəngi: Krem / Ağ / Qara */}
          <div
            style={{ borderTop: `1px solid ${subRowBorder}` }}
            className="flex min-h-[48px] items-center justify-between gap-3 px-3 py-2"
          >
            <div className="flex items-center gap-2.5">
              <span
                style={{ backgroundColor: iconBg, color: palette.green }}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              >
                <Palette className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium">Səhifə rəngi</span>
            </div>
            <div className="flex items-center gap-2.5">
              {(['cream', 'white', 'black'] as MuhaffizPaperTheme[]).map((themeId) => {
                const isSelected = prefs.paperTheme === themeId;
                const swatchBg = MUHAFFIZ_THEME_PALETTES[themeId].paper;
                return (
                  <button
                    key={themeId}
                    type="button"
                    aria-label={MUHAFFIZ_THEME_PALETTES[themeId].label}
                    title={MUHAFFIZ_THEME_PALETTES[themeId].label}
                    aria-pressed={isSelected}
                    data-testid={`muhaffiz-theme-${themeId}`}
                    onClick={() => onUpdatePrefs((p) => ({ ...p, paperTheme: themeId }))}
                    style={{
                      backgroundColor: swatchBg,
                      boxShadow: isSelected
                        ? `0 0 0 2px ${palette.paper}, 0 0 0 4px ${palette.green}`
                        : undefined,
                    }}
                    className="h-6.5 w-6.5 rounded-full border border-black/25 transition-shadow"
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Tilavət və Hifz irəliləyişi */}
        <p
          className="mt-4 mb-1.5 px-1 text-[11px] font-bold tracking-wider uppercase"
          style={{ color: palette.muted }}
        >
          Tilavət və Hifz irəliləyişi
        </p>
        <div
          style={{ backgroundColor: cardBg, borderColor: palette.line }}
          className="overflow-hidden rounded-2xl border"
        >
          {/* Qari selector */}
          <label className="flex min-h-[46px] items-center justify-between gap-3 px-3 py-2">
            <div className="flex items-center gap-2.5">
              <span
                style={{ backgroundColor: iconBg, color: palette.green }}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              >
                <Globe className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium">Qari (Səsli dinləmə)</span>
            </div>
            <select
              value={prefs.reciter}
              onChange={(e) =>
                onUpdatePrefs((p) => ({ ...p, reciter: e.target.value as MuhaffizReciterId }))
              }
              style={{ color: palette.muted }}
              className="max-w-[175px] bg-transparent text-right text-xs font-medium focus:outline-none"
            >
              {MUHAFFIZ_RECITERS.map((r) => (
                <option key={r.id} value={r.id} style={{ color: '#1a1612', backgroundColor: '#fff' }}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          {/* Qari listen toggle */}
          <button
            type="button"
            onClick={onToggleAudio}
            data-testid="muhaffiz-listen-btn"
            style={{ borderTop: `1px solid ${subRowBorder}` }}
            className="flex min-h-[46px] w-full items-center justify-between gap-3 px-3 py-2 text-left transition-opacity hover:opacity-80"
          >
            <div className="flex items-center gap-2.5">
              <span
                style={{ backgroundColor: iconBg, color: palette.green }}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              >
                {isPlayingAudio ? (
                  <VolumeX className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
              <span className="text-sm font-medium">
                {isPlayingAudio ? 'Qari tilavətini dayandır' : 'Qari tilavətini dinlə'}
              </span>
            </div>
            <ChevronRight className="h-4 w-4" style={{ color: palette.muted }} />
          </button>

          {/* Audio speed & repeat */}
          <div
            style={{ borderTop: `1px solid ${subRowBorder}` }}
            className="grid grid-cols-2 gap-2 px-3 py-2.5 text-xs"
          >
            <div>
              <span className="block text-[11px]" style={{ color: palette.muted }}>
                Oxutma sürəti
              </span>
              <div
                data-testid="muhaffiz-audio-speed"
                style={{ backgroundColor: subRowBorder }}
                className="mt-1 grid grid-cols-3 gap-0.5 rounded-lg p-0.5"
              >
                {([0.75, 1, 1.25] as AudioPlaybackSpeed[]).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => onSetPlaybackSpeed(spd)}
                    aria-pressed={playbackSpeed === spd}
                    style={
                      playbackSpeed === spd
                        ? { backgroundColor: palette.paper, color: palette.ink }
                        : { color: palette.muted }
                    }
                    className="rounded-md py-1 font-mono-tabular font-semibold"
                  >
                    {spd}×
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="block text-[11px]" style={{ color: palette.muted }}>
                Ayə təkrarı
              </span>
              <div
                data-testid="muhaffiz-audio-repeat"
                style={{ backgroundColor: subRowBorder }}
                className="mt-1 grid grid-cols-5 gap-0.5 rounded-lg p-0.5"
              >
                {(
                  [
                    { val: 1 as AyahRepeatCount, label: '1×' },
                    { val: 3 as AyahRepeatCount, label: '3×' },
                    { val: 5 as AyahRepeatCount, label: '5×' },
                    { val: 10 as AyahRepeatCount, label: '10×' },
                    { val: 0 as AyahRepeatCount, label: '∞' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => onSetRepeatCount(opt.val)}
                    aria-pressed={repeatCount === opt.val}
                    style={
                      repeatCount === opt.val
                        ? { backgroundColor: palette.paper, color: palette.ink }
                        : { color: palette.muted }
                    }
                    className="rounded-md py-1 font-mono-tabular font-semibold"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{ borderTop: `1px solid ${subRowBorder}` }}
            className="space-y-2 px-3 py-2.5 text-xs"
          >
            {/* Ayah Range Hifz Loop */}
            {pageAyahKeys.length > 1 && onChangeRangeStart && onChangeRangeEnd && onToggleLoopRange && (
              <div
                style={{ borderColor: subRowBorder, backgroundColor: palette.paper }}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-2.5 py-2"
              >
                <span className="text-[11px] font-semibold" style={{ color: palette.muted }}>
                  Hifz döngüsü
                </span>
                <div className="flex items-center gap-1.5">
                  <select
                    aria-label="Başlanğıc ayə"
                    data-testid="muhaffiz-loop-start"
                    value={rangeStartIdx}
                    onChange={(e) => onChangeRangeStart(Number(e.target.value))}
                    style={{ borderColor: palette.line, backgroundColor: palette.chip }}
                    className="rounded-lg border px-2 py-1 font-mono-tabular text-[11px] font-semibold"
                  >
                    {pageAyahKeys.map((k, idx) => (
                      <option key={`ls-${k}`} value={idx} style={{ color: '#1a1612', backgroundColor: '#fff' }}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <span style={{ color: palette.muted }}>→</span>
                  <select
                    aria-label="Son ayə"
                    data-testid="muhaffiz-loop-end"
                    value={rangeEndIdx}
                    onChange={(e) => onChangeRangeEnd(Number(e.target.value))}
                    style={{ borderColor: palette.line, backgroundColor: palette.chip }}
                    className="rounded-lg border px-2 py-1 font-mono-tabular text-[11px] font-semibold"
                  >
                    {pageAyahKeys.map((k, idx) => (
                      <option
                        key={`le-${k}`}
                        value={idx}
                        disabled={idx < rangeStartIdx}
                        style={{ color: '#1a1612', backgroundColor: '#fff' }}
                      >
                        {k}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    aria-pressed={loopRangeActive}
                    data-testid="muhaffiz-loop-toggle"
                    onClick={onToggleLoopRange}
                    style={
                      loopRangeActive
                        ? { backgroundColor: palette.green, color: palette.paper, borderColor: palette.green }
                        : { borderColor: palette.line, backgroundColor: palette.chip }
                    }
                    className="rounded-lg border px-2.5 py-1 text-[11px] font-semibold"
                  >
                    {loopRangeActive ? 'Döngü açıq' : 'Döngü'}
                  </button>
                </div>
              </div>
            )}

            {/* Page status & reveal-all + repetition count */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onSetPageStatus(currentPageHifzStatus === 'memorized' ? 'none' : 'memorized')
                }
                aria-pressed={currentPageHifzStatus === 'memorized'}
                data-testid="hifz-mark-memorized"
                style={
                  currentPageHifzStatus === 'memorized'
                    ? { backgroundColor: palette.green, color: palette.paper, borderColor: palette.green }
                    : { borderColor: palette.line }
                }
                className="inline-flex items-center justify-center gap-1 rounded-lg border py-1.5 font-medium"
              >
                <Check className="h-3 w-3" />
                <span>Əzbərlədim</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onSetPageStatus(currentPageHifzStatus === 'learning' ? 'none' : 'learning')
                }
                aria-pressed={currentPageHifzStatus === 'learning'}
                data-testid="hifz-mark-learning"
                style={
                  currentPageHifzStatus === 'learning'
                    ? { backgroundColor: palette.gold, color: '#fff', borderColor: palette.gold }
                    : { borderColor: palette.line }
                }
                className="inline-flex items-center justify-center gap-1 rounded-lg border py-1.5 font-medium"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Təkrarda</span>
              </button>

              <button
                type="button"
                onClick={onToggleBookmark}
                aria-pressed={isCurrentPageBookmarked}
                data-testid="hifz-toggle-bookmark"
                style={
                  isCurrentPageBookmarked
                    ? { borderColor: palette.gold, color: palette.gold }
                    : { borderColor: palette.line }
                }
                className="inline-flex items-center justify-center gap-1 rounded-lg border py-1.5 font-medium"
              >
                <Bookmark
                  className={`h-3 w-3 ${isCurrentPageBookmarked ? 'fill-current' : ''}`}
                />
                <span>Əlfəcin</span>
              </button>
            </div>

            {onIncrementRepetition && (
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span style={{ color: palette.muted }}>
                  Bu səhifənin təkrarı:{' '}
                  <strong style={{ color: palette.ink }}>{pageRepetitions}×</strong>
                </span>
                <button
                  type="button"
                  data-testid="hifz-sheet-rep-inc"
                  onClick={onIncrementRepetition}
                  style={{ borderColor: palette.line, backgroundColor: palette.chip }}
                  className="rounded-lg border px-2.5 py-1 font-mono-tabular font-semibold hover:opacity-80"
                >
                  Təkrar +1
                </button>
              </div>
            )}

            {prefs.silentMode && (
              <button
                type="button"
                onClick={onToggleRevealAll}
                style={{ borderColor: palette.line }}
                className="w-full rounded-lg border py-1.5 text-center font-medium"
              >
                {allRevealed ? 'Bütün sözləri gizlət' : 'Bütün səhifəni göstər'}
              </button>
            )}
          </div>
        </div>

        {/* Section 3: Digər */}
        <p
          className="mt-4 mb-1.5 px-1 text-[11px] font-bold tracking-wider uppercase"
          style={{ color: palette.muted }}
        >
          Digər
        </p>
        <div
          style={{ backgroundColor: cardBg, borderColor: palette.line }}
          className="overflow-hidden rounded-2xl border"
        >
          <button
            type="button"
            onClick={onOpenIndex}
            className="flex min-h-[44px] w-full items-center justify-between gap-3 px-3 py-2 text-left"
          >
            <div className="flex items-center gap-2.5">
              <span
                style={{ backgroundColor: iconBg, color: palette.green }}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              >
                <Compass className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium">Surə və səhifə siyahısı</span>
            </div>
            <ChevronRight className="h-4 w-4" style={{ color: palette.muted }} />
          </button>

          <button
            type="button"
            onClick={() => onNavigate(`/quran/sehife/${pageNumber}`)}
            style={{ borderTop: `1px solid ${subRowBorder}` }}
            className="flex min-h-[44px] w-full items-center justify-between gap-3 px-3 py-2 text-left"
          >
            <div className="flex items-center gap-2.5">
              <span
                style={{ backgroundColor: iconBg, color: palette.green }}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium">Normal oxu (Tərcümə ilə)</span>
            </div>
            <ChevronRight className="h-4 w-4" style={{ color: palette.muted }} />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/')}
            style={{ borderTop: `1px solid ${subRowBorder}` }}
            className="flex min-h-[44px] w-full items-center justify-between gap-3 px-3 py-2 text-left"
          >
            <div className="flex items-center gap-2.5">
              <span
                style={{ backgroundColor: iconBg, color: palette.green }}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium">Ana səhifə</span>
            </div>
            <ChevronRight className="h-4 w-4" style={{ color: palette.muted }} />
          </button>

          <div style={{ borderTop: `1px solid ${subRowBorder}` }} className="px-3 py-2.5">
            <PWAInstallButton compact />
          </div>
        </div>
      </div>
    </div>
  );
}
