import { ChevronDown, ChevronUp, Eye, X } from 'lucide-react';

interface LineFocusBarProps {
  focusedKey: string | null;
  progressLabel: string;
  canStepPrev: boolean;
  canStepNext: boolean;
  onStepPrev: () => void;
  onStepNext: () => void;
  onClose: () => void;
}

export function LineFocusBar({
  focusedKey,
  progressLabel,
  canStepPrev,
  canStepNext,
  onStepPrev,
  onStepNext,
  onClose,
}: LineFocusBarProps) {
  return (
    <div
      data-testid="line-focus-bar"
      className="sticky top-[73px] z-20 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#0F4C3A]/30 bg-[#F4F8F6]/95 px-4 py-2.5 text-xs shadow-sm backdrop-blur-md dark:border-[#86C7AE]/30 dark:bg-[#131E19]/95"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Sətir Fokus (Pərdə)</span>
        </span>
        {focusedKey && (
          <span
            data-testid="line-focus-active-key"
            className="font-mono-tabular rounded-md border border-[#0F4C3A]/25 bg-white px-2 py-0.5 font-semibold text-stone-900 dark:border-[#86C7AE]/25 dark:bg-[#141916] dark:text-stone-100"
          >
            {focusedKey} · {progressLabel}
          </span>
        )}
        <span className="hidden md:inline text-[11px] text-stone-500 dark:text-stone-400">
          ↑ / ↓ oxları və ya ayəyə toxunaraq keçid edin · Esc bağla
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onStepPrev}
          disabled={!canStepPrev}
          data-testid="line-focus-prev"
          aria-label="Əvvəlki ayəyə fokuslan"
          className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] disabled:opacity-40 dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
        >
          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Əvvəlki</span>
        </button>
        <button
          type="button"
          onClick={onStepNext}
          disabled={!canStepNext}
          data-testid="line-focus-next"
          aria-label="Növbəti ayəyə fokuslan"
          className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] disabled:opacity-40 dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
        >
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Növbəti</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          data-testid="line-focus-close"
          aria-label="Sətir Fokus pərdəsini bağla"
          className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 transition-colors hover:border-stone-400 hover:text-stone-900 dark:border-stone-700 dark:bg-[#141916] dark:text-stone-300"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Bağla</span>
        </button>
      </div>
    </div>
  );
}
