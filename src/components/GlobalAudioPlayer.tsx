import {
  Crosshair,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
  Timer,
  Volume2,
  X,
} from 'lucide-react';
import { useGlobalAudio } from '../contexts/GlobalAudioContext';
import { MUHAFFIZ_RECITERS, MuhaffizReciterId } from '../lib/muhaffiz';
import { formatSleepTimerRemaining } from '../lib/sleepTimer';

function formatClockSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

interface GlobalAudioPlayerProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function GlobalAudioPlayer({ currentPath, onNavigate }: GlobalAudioPlayerProps) {
  const {
    reciter,
    setReciter,
    currentTrack,
    isPaused,
    isBuffering,
    audioError,
    currentTimeSec,
    durationSec,
    hasPrev,
    hasNext,
    playbackSpeed,
    repeatCount,
    sleepMinutes,
    sleepRemainingSec,
    autoFocus,
    setAutoFocus,
    cycleSpeed,
    cycleRepeat,
    cycleSleepMinutes,
    togglePlayPause,
    prevTrack,
    nextTrack,
    seekToRatio,
    stop,
    clearError,
  } = useGlobalAudio();

  if (!currentTrack && !audioError) {
    return null;
  }

  const sleepActive = sleepMinutes > 0 && sleepRemainingSec > 0;
  const progressRatio =
    durationSec > 0 ? Math.max(0, Math.min(1, currentTimeSec / durationSec)) : 0;
  const isReaderRoute =
    currentPath.startsWith('/quran/sure/') || currentPath.startsWith('/quran/sehife/');

  return (
    <div
      role="region"
      aria-label="Qlobal tilavət pleyeri"
      data-testid="reader-audio-bar"
      className="fixed right-3 bottom-3 left-3 z-40 mx-auto max-w-4xl overflow-hidden rounded-xl border border-stone-300/90 bg-[#FAF9F6]/96 shadow-lg backdrop-blur-md dark:border-stone-700 dark:bg-[#141916]/96"
    >
      {currentTrack && durationSec > 0 && (
        <div
          role="slider"
          aria-label="Tilavət irəliləyişi"
          aria-valuemin={0}
          aria-valuemax={Math.round(durationSec)}
          aria-valuenow={Math.round(currentTimeSec)}
          tabIndex={0}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            if (rect.width > 0) {
              seekToRatio((e.clientX - rect.left) / rect.width);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') seekToRatio(progressRatio + 0.05);
            if (e.key === 'ArrowLeft') seekToRatio(progressRatio - 0.05);
          }}
          className="h-1.5 w-full cursor-pointer bg-stone-200/80 dark:bg-stone-800"
        >
          <div
            style={{ width: `${Math.round(progressRatio * 1000) / 10}%` }}
            className="h-full bg-[#0F4C3A] transition-[width] duration-150 dark:bg-[#86C7AE]"
          />
        </div>
      )}

      {audioError && !currentTrack ? (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs text-red-700 dark:text-red-400">
          <span>{audioError}</span>
          <button
            type="button"
            onClick={clearError}
            aria-label="Xətanı bağla"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : currentTrack ? (
        <div className="flex flex-col gap-2.5 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0F4C3A] text-white dark:bg-[#196B52]">
              <Volume2 className="h-4 w-4" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <a
                  href={currentTrack.sourcePath}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(currentTrack.sourcePath);
                  }}
                  data-testid="global-audio-source-link"
                  className="truncate font-mono-tabular text-xs font-semibold text-stone-900 hover:text-[#0F4C3A] hover:underline dark:text-stone-100 dark:hover:text-[#86C7AE]"
                >
                  {currentTrack.label}
                </a>
                {durationSec > 0 && (
                  <span className="shrink-0 font-mono-tabular text-[11px] text-stone-500 dark:text-stone-400">
                    {formatClockSeconds(currentTimeSec)} / {formatClockSeconds(durationSec)}
                  </span>
                )}
              </div>

              <div className="mt-0.5 flex items-center gap-2">
                <label htmlFor="global-player-reciter" className="sr-only">
                  Qlobal pleyer qari seçimi
                </label>
                <select
                  id="global-player-reciter"
                  value={reciter}
                  onChange={(e) => setReciter(e.target.value as MuhaffizReciterId)}
                  data-testid="global-audio-reciter-select"
                  className="max-w-[210px] truncate rounded border border-transparent bg-transparent py-0.5 pr-1 text-[11px] text-stone-600 hover:border-stone-200 focus:border-[#0F4C3A] focus:outline-none dark:text-stone-400 dark:hover:border-stone-700"
                >
                  {MUHAFFIZ_RECITERS.map((r) => (
                    <option key={r.id} value={r.id} className="bg-white text-stone-900 dark:bg-[#141916] dark:text-stone-100">
                      {r.label}
                    </option>
                  ))}
                </select>
                {isBuffering && (
                  <span className="text-[10px] text-stone-400 dark:text-stone-500">Yüklənir…</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:justify-start">
            <button
              type="button"
              onClick={prevTrack}
              disabled={!hasPrev}
              aria-label="Əvvəlki tilavətə keç"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] disabled:opacity-40 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
            >
              <SkipBack className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={togglePlayPause}
              data-testid="global-audio-play-pause"
              aria-label={isPaused ? 'Tilavətə davam et' : 'Pauza ver'}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0F4C3A] px-3 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-[#0B3A2C] dark:bg-[#196B52]"
            >
              {isPaused ? (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  <span>Davam et</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  <span>Pauza</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={nextTrack}
              disabled={!hasNext}
              aria-label="Növbəti tilavətə keç"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] disabled:opacity-40 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
            >
              <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={cycleSpeed}
              title="Sürəti dəyiş"
              aria-label={`Tilavət sürəti ${playbackSpeed} qat`}
              className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-2 font-mono-tabular text-[11px] font-medium whitespace-nowrap text-stone-700 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
            >
              {playbackSpeed}×
            </button>

            {currentTrack.mode === 'ayah' && (
              <button
                type="button"
                onClick={cycleRepeat}
                title="Ayə təkrarını dəyiş"
                aria-label={`Ayə təkrarı ${repeatCount === 0 ? 'sonsuz' : `${repeatCount} dəfə`}`}
                className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-2 font-mono-tabular text-[11px] font-medium whitespace-nowrap text-stone-700 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
              >
                {repeatCount === 0 ? '∞' : `${repeatCount}×`}
              </button>
            )}

            {isReaderRoute && currentTrack.mode === 'ayah' && (
              <button
                type="button"
                onClick={() => setAutoFocus(!autoFocus)}
                aria-pressed={autoFocus}
                data-testid="reader-auto-focus-toggle"
                title="Oxunan ayəni mərkəzdə saxla"
                className={`hidden sm:inline-flex h-9 items-center gap-1 rounded-lg border px-2 text-[11px] font-medium whitespace-nowrap transition-colors ${
                  autoFocus
                    ? 'border-[#0F4C3A] bg-[#0F4C3A]/10 text-[#0F4C3A] dark:border-[#86C7AE] dark:bg-[#86C7AE]/15 dark:text-[#86C7AE]'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-300'
                }`}
              >
                <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Fokus</span>
              </button>
            )}

            <button
              type="button"
              onClick={cycleSleepMinutes}
              data-testid="reader-sleep-timer-btn"
              aria-label={`Yuxu taymeri: ${sleepActive ? formatSleepTimerRemaining(sleepRemainingSec) : 'Bağlı'}`}
              title="Tilavət yuxu taymeri (15 / 30 / 45 / 60 dəq)"
              className={`hidden sm:inline-flex h-9 items-center gap-1 rounded-lg border px-2 font-mono-tabular text-[11px] font-medium whitespace-nowrap transition-colors ${
                sleepActive
                  ? 'border-[#0F4C3A] bg-[#0F4C3A] text-white dark:border-[#196B52] dark:bg-[#196B52]'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200'
              }`}
            >
              <Timer className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{sleepActive ? formatSleepTimerRemaining(sleepRemainingSec) : 'Yuxu'}</span>
            </button>

            <button
              type="button"
              onClick={stop}
              data-testid="reader-audio-bar-stop"
              aria-label="Tilavəti dayandır və pleyeri bağla"
              title="Dayandır"
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 text-xs font-medium whitespace-nowrap text-stone-700 transition-colors hover:border-red-300 hover:text-red-700 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200 dark:hover:text-red-400"
            >
              <Square className="h-3 w-3 fill-current" aria-hidden="true" />
              <span className="hidden md:inline">Dayandır</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
