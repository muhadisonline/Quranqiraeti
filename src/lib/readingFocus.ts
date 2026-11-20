export const READER_LINE_FOCUS_KEY = 'quranqiraeti_reader_line_focus_v1';
export const READER_ZEN_MODE_KEY = 'quranqiraeti_reader_zen_mode_v1';

export interface LineFocusSelectionInput {
  playingKey?: string | null;
  manualKey?: string | null;
  highlightedKey?: string | null;
}

export function resolveFocusedAyahKey(
  keys: readonly string[],
  input: LineFocusSelectionInput
): string | null {
  if (keys.length === 0) return null;
  if (input.playingKey && keys.includes(input.playingKey)) {
    return input.playingKey;
  }
  if (input.manualKey && keys.includes(input.manualKey)) {
    return input.manualKey;
  }
  if (input.highlightedKey && keys.includes(input.highlightedKey)) {
    return input.highlightedKey;
  }
  return keys[0];
}

export function stepFocusedAyahKey(
  keys: readonly string[],
  currentKey: string | null,
  delta: -1 | 1
): string | null {
  if (keys.length === 0) return null;
  const currentIndex = currentKey ? keys.indexOf(currentKey) : -1;
  if (currentIndex === -1) {
    return delta > 0 ? keys[0] : keys[keys.length - 1];
  }
  const nextIndex = Math.max(0, Math.min(keys.length - 1, currentIndex + delta));
  return keys[nextIndex];
}

export function formatLineFocusProgress(
  keys: readonly string[],
  focusedKey: string | null
): { index: number; total: number; label: string } {
  const total = keys.length;
  if (total === 0) {
    return { index: 0, total: 0, label: '0 / 0' };
  }
  const foundIndex = focusedKey ? keys.indexOf(focusedKey) : -1;
  const oneBased = foundIndex >= 0 ? foundIndex + 1 : 1;
  return {
    index: oneBased,
    total,
    label: `${oneBased} / ${total}`,
  };
}
