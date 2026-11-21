import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_SHORTS } from '../data/recitations';
import {
  findMatchingShortsForAyahRange,
  findMatchingShortsForMushafAyahs,
  parseShortAyahReference,
} from './shortsMatcher';

test('parseShortAyahReference extracts Surah and Ayah span from channel Shorts titles', () => {
  const kahfShort = SEED_SHORTS.find((s) => s.videoId === '0JrGsnk3xQk');
  assert.ok(kahfShort);
  const parsed = parseShortAyahReference(kahfShort);
  assert.deepEqual(parsed, { surahNumber: 18, ayahStart: 1, ayahEnd: 5 });

  const rahmanShort = SEED_SHORTS.find((s) => s.videoId === 'DOMnRUWVKiY');
  assert.ok(rahmanShort);
  assert.deepEqual(parseShortAyahReference(rahmanShort), {
    surahNumber: 55,
    ayahStart: 24,
    ayahEnd: 32,
  });
});

test('findMatchingShortsForAyahRange and Mushaf ayahs match overlapping channel Shorts', () => {
  const kahfFirstPage = findMatchingShortsForAyahRange(SEED_SHORTS, 18, [1, 2, 3, 4, 5]);
  assert.ok(kahfFirstPage.some((m) => m.video.videoId === '0JrGsnk3xQk'));
  assert.equal(kahfFirstPage[0].matchLabel, 'Kəhf 1–5');

  const pageAyahs = [
    { surahNumber: 55, ayahNumber: 25 },
    { surahNumber: 55, ayahNumber: 26 },
  ];
  const mushafMatches = findMatchingShortsForMushafAyahs(SEED_SHORTS, pageAyahs);
  assert.ok(mushafMatches.some((m) => m.video.videoId === 'DOMnRUWVKiY'));
});
