import { SkipBack, SkipForward, Square, Volume2 } from 'lucide-react';
import { AudioPlaybackSpeed, AyahRepeatCount } from '../lib/readerState';

interface ReaderAudioBarProps {
  playingLabel: string;
  reciterLabel: string;
  hasPrev: boolean;
  hasNext: boolean;
  playbackSpeed: AudioPlaybackSpeed;
  repeatCount: AyahRepeatCount;
  onPrev: () => void;
  onNext: () => void;
  onStop: () => void;
  onCycleSpeed: () => void;
  onCycleRepeat: () => void;
}

export function ReaderAudioBar({
  playingLabel,
  reciterLabel,
  hasPrev,
  hasNext,
  playbackSpeed,
  repeatCount,
  onPrev,
  onNext,
  onStop,
  onCycleSpeed,
  onCycleRepeat,
}: ReaderAudioBarProps) {
  return (
    <div
      role="region"
      aria-label="Aktiv tilavət pleyeri"
      data-testid="reader-audio-bar"
      className="fixed right-4 bottom-4 left-4 z-40 mx-auto max-w-2xl rounded-xl border border-stone-300/90 bg-[#FAF9F6]/96 px-4 py-3 shadow-lg backdrop-blur-md dark:border-stone-700 dark:bg-[#141916]/96"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0F4C3A] text-white dark:bg-[#196B52]">
            <Volume2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-mono-tabular text-xs font-semibold text-stone-900 dark:text-stone-100">
              {playingLabel}
            </p>
            <p className="truncate text-[11px] text-stone-500 dark:text-stone-400">
              {reciterLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="Əvvəlki ayəyə keç"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] disabled:opacity-40 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
          >
            <SkipBack className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onStop}
            data-testid="reader-audio-bar-stop"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0F4C3A] px-3 text-xs font-medium text-white transition-colors hover:bg-[#0B3A2C] dark:bg-[#196B52]"
          >
            <Square className="h-3 w-3 fill-current" aria-hidden="true" />
            <span>Dayandır</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Növbəti ayəyə keç"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] disabled:opacity-40 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
          >
            <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onCycleSpeed}
            title="Sürəti dəyiş"
            className="ml-1 rounded-lg border border-stone-200 bg-white px-2 py-1 font-mono-tabular text-[11px] font-medium text-stone-700 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
          >
            {playbackSpeed}×
          </button>

          <button
            type="button"
            onClick={onCycleRepeat}
            title="Ayə təkrarını dəyiş"
            className="rounded-lg border border-stone-200 bg-white px-2 py-1 font-mono-tabular text-[11px] font-medium text-stone-700 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
          >
            {repeatCount === 0 ? '∞' : `${repeatCount}×`}
          </button>
        </div>
      </div>
    </div>
  );
}
