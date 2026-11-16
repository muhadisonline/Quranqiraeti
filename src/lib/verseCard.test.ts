import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVerseReferenceLine,
  sanitizeVerseCardFilename,
  wrapTextLines,
} from './verseCard';

test('wrapTextLines wraps long translations cleanly and truncates with ellipsis when exceeding maxLines', () => {
  const shortLines = wrapTextLines('Həmd olsun aləmlərin Rəbbi Allaha!', 30, 5);
  assert.deepEqual(shortLines, ['Həmd olsun aləmlərin Rəbbi', 'Allaha!']);

  const longText =
    'Bir iki üç dörd beş altı yeddi səkkiz doqquz on onbir oniki onüç ondörd onbeş onaltı';
  const capped = wrapTextLines(longText, 14, 2);
  assert.equal(capped.length, 2);
  assert.ok(capped[1].endsWith('…'));
});

test('sanitizeVerseCardFilename and buildVerseReferenceLine format clean metadata', () => {
  assert.equal(sanitizeVerseCardFilename(2, 255), 'quranqiraeti-2-255.png');
  assert.equal(sanitizeVerseCardFilename(1.9, 5.2), 'quranqiraeti-1-5.png');
  assert.equal(
    buildVerseReferenceLine('Bəqərə', 2, 255),
    'Bəqərə surəsi · 2:255 · Əlixan Musayev tərcüməsi'
  );
});
