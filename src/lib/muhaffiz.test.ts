import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FATIHAT_PAGE_1_MUHAFFIZ_SEED,
  FATIHAT_PAGE_1_SEED,
  ayahKey,
  buildSyntheticMuhaffizRows,
  buildTokensFromQuranComVerses,
  clampMuhaffizPage,
  estimateWordMaskWidthPx,
  formatArabicJuzLabel,
  getEveryAyahAudioUrl,
  groupPageAyahsBySurah,
  groupTokensIntoMushafRows,
  hideLastAyah,
  revealNextAyah,
  splitAyahWords,
  splitWaqfMark,
  toArabicIndicDigits,
  toggleAyahReveal,
} from './muhaffiz';

test('clampMuhaffizPage bounds page numbers between 1 and 604', () => {
  assert.equal(clampMuhaffizPage(0), 1);
  assert.equal(clampMuhaffizPage(-10), 1);
  assert.equal(clampMuhaffizPage(604), 604);
  assert.equal(clampMuhaffizPage(999), 604);
  assert.equal(clampMuhaffizPage(Number.NaN), 1);
});

test('toArabicIndicDigits and formatArabicJuzLabel produce authentic Mushaf headers', () => {
  assert.equal(toArabicIndicDigits(1), '١');
  assert.equal(toArabicIndicDigits(7), '٧');
  assert.equal(toArabicIndicDigits(604), '٦٠٤');
  assert.equal(formatArabicJuzLabel(1), 'الجزء الأول');
  assert.equal(formatArabicJuzLabel(30), 'الجزء الثلاثون');
});

test('splitWaqfMark isolates trailing pause signs so masked lines keep stop marks visible', () => {
  assert.deepEqual(splitWaqfMark('رَيْبَ ۛ'), { stemText: 'رَيْبَ', waqfMark: 'ۛ' });
  assert.deepEqual(splitWaqfMark('ٱلْكِتَـٰبُ'), { stemText: 'ٱلْكِتَـٰبُ', waqfMark: '' });
});

test('splitAyahWords and estimateWordMaskWidthPx extract clean Arabic word lengths', () => {
  const words = splitAyahWords('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ');
  assert.equal(words.length, 4);
  const w1 = estimateWordMaskWidthPx(words[0]);
  const w3 = estimateWordMaskWidthPx(words[2]);
  assert.ok(w1 >= 24 && w1 <= 110);
  assert.ok(w3 > w1);
});

test('groupTokensIntoMushafRows builds Fatiha Page 1 and Baqarah Page 2 accurately', () => {
  // Page 1 Fatiha: header at line 1, words at lines 2..8, NO separate bismillah row
  const p1Rows = FATIHAT_PAGE_1_MUHAFFIZ_SEED.rows;
  assert.equal(p1Rows[0].kind, 'surah-header');
  assert.equal(p1Rows[0].lineNumber, 1);
  assert.equal(p1Rows.some((r) => r.kind === 'bismillah'), false);
  const wordRows = p1Rows.filter((r) => r.kind === 'words');
  assert.equal(wordRows.length, 7); // lines 2, 3, 4, 5, 6, 7, 8

  // Page 2 Baqarah: line 1 surah header, line 2 bismillah, line 3 words starting with الم
  const p2Tokens = buildTokensFromQuranComVerses([
    {
      verse_key: '2:1',
      juz_number: 1,
      words: [
        { text_uthmani: 'الٓمٓ', line_number: 3, char_type_name: 'word' },
        { text_uthmani: '١', line_number: 3, char_type_name: 'end' },
      ],
    },
    {
      verse_key: '2:2',
      juz_number: 1,
      words: [
        { text_uthmani: 'رَيْبَ ۛ', line_number: 3, char_type_name: 'word' },
        { text_uthmani: '٢', line_number: 4, char_type_name: 'end' },
      ],
    },
  ]);
  const p2Rows = groupTokensIntoMushafRows(p2Tokens);
  assert.equal(p2Rows[0].kind, 'surah-header');
  assert.equal(p2Rows[1].kind, 'bismillah');
  assert.equal(p2Rows[2].kind, 'words');
  if (p2Rows[2].kind === 'words') {
    assert.equal(p2Rows[2].tokens[2].stemText, 'رَيْبَ');
    assert.equal(p2Rows[2].tokens[2].waqfMark, 'ۛ');
  }
});

test('buildSyntheticMuhaffizRows provides fallback line rows cleanly', () => {
  const rows = buildSyntheticMuhaffizRows(1, FATIHAT_PAGE_1_SEED.ayahs);
  assert.equal(rows[0].kind, 'surah-header');
  assert.ok(rows.some((r) => r.kind === 'words'));
});

test('revealNextAyah and hideLastAyah step sequentially across Mushaf page ayahs', () => {
  const ayahs = FATIHAT_PAGE_1_SEED.ayahs;
  let state = new Set<string>();

  state = revealNextAyah(ayahs, state);
  assert.deepEqual(Array.from(state), ['1:1']);

  state = revealNextAyah(ayahs, state);
  assert.deepEqual(Array.from(state), ['1:1', '1:2']);

  state = hideLastAyah(ayahs, state);
  assert.deepEqual(Array.from(state), ['1:1']);

  state = toggleAyahReveal(state, '1:5');
  assert.ok(state.has('1:5'));
  state = toggleAyahReveal(state, '1:5');
  assert.ok(!state.has('1:5'));
});

test('groupPageAyahsBySurah preserves multi-surah boundaries on shared Mushaf pages', () => {
  const mixed = [
    ...FATIHAT_PAGE_1_SEED.ayahs.slice(0, 2),
    {
      surahNumber: 112,
      surahName: 'İxlas',
      arabicSurahName: 'سُورَةُ الإِخْلَاصِ',
      ayahNumber: 1,
      juzNumber: 30,
      arabicText: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
      translation: 'De: O Allah Təkdir!',
      footnotes: '',
    },
  ];
  const groups = groupPageAyahsBySurah(mixed);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].surahNumber, 1);
  assert.equal(groups[0].startsAtBeginning, true);
  assert.equal(groups[1].surahNumber, 112);
  assert.equal(ayahKey(groups[1].ayahs[0]), '112:1');
});

test('getEveryAyahAudioUrl formats padded MP3 endpoints cleanly', () => {
  assert.equal(
    getEveryAyahAudioUrl(1, 7, 'Alafasy_128kbps'),
    'https://everyayah.com/data/Alafasy_128kbps/001007.mp3'
  );
  assert.equal(
    getEveryAyahAudioUrl(112, 4, 'Husary_128kbps'),
    'https://everyayah.com/data/Husary_128kbps/112004.mp3'
  );
});
