export type SleepTimerMinutes = 0 | 15 | 30 | 45 | 60;

export const SLEEP_TIMER_PRESETS: readonly SleepTimerMinutes[] = [0, 15, 30, 45, 60];

export const READER_AUTO_FOCUS_KEY = 'quranqiraeti_reader_autofocus_v1';

export function cycleSleepTimerMinutes(current: SleepTimerMinutes): SleepTimerMinutes {
  const idx = SLEEP_TIMER_PRESETS.indexOf(current);
  if (idx < 0) return 15;
  return SLEEP_TIMER_PRESETS[(idx + 1) % SLEEP_TIMER_PRESETS.length] ?? 0;
}

export function computeSleepRemainingSeconds(endsAtMs: number | null, nowMs: number): number {
  if (endsAtMs === null || !Number.isFinite(endsAtMs)) return 0;
  const diffMs = Math.max(0, endsAtMs - nowMs);
  return Math.ceil(diffMs / 1000);
}

export function formatSleepTimerRemaining(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatSleepTimerPresetLabel(minutes: SleepTimerMinutes): string {
  if (minutes === 0) return 'Bağlı';
  return `${minutes} dəq`;
}
