import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARABIC_ALPHABET,
  HARAKAT_GUIDE,
  TAJWEED_ESSENTIALS,
  applyHarakatToLetter,
  buildAlphabetQuizQuestion,
  filterArabicLetters,
} from './arabicAlphabet';

test('ARABIC_ALPHABET contains all 28 unique letters with valid Surah/Ayah references', () => {
  assert.equal(ARABIC_ALPHABET.length, 28);
  const ids = new Set(ARABIC_ALPHABET.map((l) => l.id));
  assert.equal(ids.size, 28);

  const nonConnectors = ARABIC_ALPHABET.filter((l) => !l.connectsLeft).map(
    (l) => l.arabicIsolated
  );
  assert.deepEqual(nonConnectors, ['ا', 'د', 'ذ', 'ر', 'ز', 'و']);

  for (const letter of ARABIC_ALPHABET) {
    assert.ok(letter.surahNumber >= 1 && letter.surahNumber <= 114);
    assert.ok(letter.ayahNumber >= 1);
    assert.ok(letter.makhrajAz.length > 5);
  }
});

test('filterArabicLetters filters accurately by Azerbaijani query and Makhraj group', () => {
  const throat = filterArabicLetters('', 'bogaz');
  assert.equal(throat.length, 5); // ح خ ع غ ه

  const qaf = filterArabicLetters('qaf', 'all');
  assert.equal(qaf.length, 1);
  assert.equal(qaf[0]?.arabicIsolated, 'ق');

  const dodaqSearch = filterArabicLetters('mim', 'dodaq');
  assert.equal(dodaqSearch.length, 1);
  assert.equal(dodaqSearch[0]?.id, 'mim');
});

test('applyHarakatToLetter builds clean syllabic previews including sukun and tanwin', () => {
  const ba = ARABIC_ALPHABET[1];
  assert.equal(applyHarakatToLetter(ba, 'fatha'), 'ب\u064E');
  assert.equal(applyHarakatToLetter(ba, 'sukun'), 'أَب\u0652');
  assert.equal(applyHarakatToLetter(ba, 'tanwin-fatha'), 'ب\u064Bا');
});

test('buildAlphabetQuizQuestion produces 4 unique options always containing target', () => {
  const q = buildAlphabetQuizQuestion(6, 3, 'name-from-glyph');
  assert.equal(q.options.length, 4);
  assert.equal(new Set(q.options.map((o) => o.id)).size, 4);
  assert.ok(q.options.some((o) => o.id === q.target.id));
});

test('HARAKAT_GUIDE and TAJWEED_ESSENTIALS cover essential lessons', () => {
  assert.equal(HARAKAT_GUIDE.length, 8);
  assert.equal(TAJWEED_ESSENTIALS.length, 5);
});
