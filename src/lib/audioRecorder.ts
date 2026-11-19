export function formatRecordingDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function pickSupportedAudioMimeType(
  isTypeSupported?: (mime: string) => boolean
): string | undefined {
  if (!isTypeSupported) return undefined;
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  return candidates.find((mime) => {
    try {
      return isTypeSupported(mime);
    } catch {
      return false;
    }
  });
}

export function buildSelfCompareLabel(
  surahName: string,
  ayahKeyLabel: string,
  durationSec: number
): string {
  const cleanSurah = surahName.replace(/\s+surəsi$/i, '').trim();
  return `${cleanSurah} ${ayahKeyLabel} · ${formatRecordingDuration(durationSec)}`;
}
