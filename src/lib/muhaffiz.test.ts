import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_MUHAFFIZ_PREFS,
  FATIHAT_PAGE_1_MUHAFFIZ_SEED,
  FATIHAT_PAGE_1_SEED,
  ayahKey,
  buildSyntheticMuhaffizRows,
  buildTokensFromQuranComVerses,
  clampMuhaffizPage,
  estimateWordMaskWidthPx,
  formatArabicJuzLabel,
  getEveryAyahAudioUrl,
  getQcfV2FontUrl,
  groupPageAyahsBySurah,
  groupTokensIntoMushafRows,
  hideLastAyah,
  hideLastStep,
  hideLastWord,
  isAyahRevealed,
  orderedWordTokens,
  revealNextAyah,
  revealNextStep,
  revealNextWord,
  splitAyahWords,
  splitCodeV2Waqf,
  splitWaqfMark,
  toArabicIndicDigits,
  toggleAyahReveal,
  toggleEntireAyahTokens,
} from './muhaffiz';

test('clampMuhaffizPage bounds page numbers between 1 and 604', () => {
  assert.equal(clampMuhaffizPage(0), 1);
  assert.equal(clampMuhaffizPage(-10), 1);
  assert.equal(clampMuhaffizPage(604), 604);
  assert.equal(clampMuhaffizPage(999), 604);
  assert.equal(clampMuhaffizPage(Number.NaN), 1);
});

test('toArabicIndicDigits, formatArabicJuzLabel, and getQcfV2FontUrl produce authentic Mushaf metadata', () => {
  assert.equal(toArabicIndicDigits(1), '١');
  assert.equal(toArabicIndicDigits(7), '٧');
  assert.equal(toArabicIndicDigits(604), '٦٠٤');
  assert.equal(formatArabicJuzLabel(1), 'الجزء الأول');
  assert.equal(formatArabicJuzLabel(30), 'الجزء الثلاثون');
  assert.equal(
    getQcfV2FontUrl(3),
    'https://verses.quran.foundation/fonts/quran/hafs/v1/woff2/p3.woff2'
  );
  assert.equal(DEFAULT_MUHAFFIZ_PREFS.revealMode, 'word');
});

test('splitWaqfMark and splitCodeV2Waqf isolate trailing pause glyphs cleanly', () => {
  assert.deepEqual(splitWaqfMark('رَيْبَ ۛ'), { stemText: 'رَيْبَ', waqfMark: 'ۛ' });
  assert.deepEqual(splitWaqfMark('ٱلْكِتَـٰبُ'), { stemText: 'ٱلْكِتَـٰبُ', waqfMark: '' });
  assert.deepEqual(splitCodeV2Waqf('ﱆﱇ', true), { codeV2Stem: 'ﱆ', codeV2Waqf: 'ﱇ' });
  assert.deepEqual(splitCodeV2Waqf('ﱃ', false), { codeV2Stem: 'ﱃ', codeV2Waqf: '' });
});

test('splitAyahWords and estimateWordMaskWidthPx extract clean Arabic word lengths', () => {
  const words = splitAyahWords('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ');
  assert.equal(words.length, 4);
  const w1 = estimateWordMaskWidthPx(words[0]);
  const w3 = estimateWordMaskWidthPx(words[2]);
  assert.ok(w1 >= 24 && w1 <= 110);
  assert.ok(w3 > w1);
});

test('word-by-word revealNextStep and hideLastStep step word-by-word in default word mode', () => {
  const tokens = orderedWordTokens(FATIHAT_PAGE_1_MUHAFFIZ_SEED.rows);
  const ayahs = FATIHAT_PAGE_1_MUHAFFIZ_SEED.ayahs;
  assert.equal(tokens[0].stemText, 'بِسْمِ');
  assert.equal(tokens[0].codeV2Stem, 'ﭑ');

  let revealed = new Set<string>();
  revealed = revealNextWord(tokens, revealed);
  assert.deepEqual(Array.from(revealed), [tokens[0].id]);

  revealed = revealNextStep('word', ayahs, tokens, revealed);
  assert.deepEqual(Array.from(revealed), [tokens[0].id, tokens[1].id]);
  assert.equal(isAyahRevealed('1:1', tokens, revealed), false);

  revealed = hideLastWord(tokens, revealed);
  assert.deepEqual(Array.from(revealed), [tokens[0].id]);

  // Switch to ayah mode -> fills remaining tokens of 1:1
  revealed = revealNextStep('ayah', ayahs, tokens, revealed);
  assert.equal(isAyahRevealed('1:1', tokens, revealed), true);

  revealed = hideLastStep('ayah', ayahs, tokens, revealed);
  assert.equal(revealed.size, 0);

  revealed = toggleEntireAyahTokens(tokens, revealed, '1:2');
  assert.equal(isAyahRevealed('1:2', tokens, revealed), true);
  assert.equal(isAyahRevealed('1:1', tokens, revealed), false);
});

test('groupTokensIntoMushafRows builds Fatiha Page 1 and Baqarah Page 2 accurately', () => {
  const p1Rows = FATIHAT_PAGE_1_MUHAFFIZ_SEED.rows;
  assert.equal(p1Rows[0].kind, 'surah-header');
  assert.equal(p1Rows[0].lineNumber, 1);
  assert.equal(p1Rows.some((r) => r.kind === 'bismillah'), false);
  const wordRows = p1Rows.filter((r) => r.kind === 'words');
  assert.equal(wordRows.length, 7);

  const p2Tokens = buildTokensFromQuranComVerses([
    {
      verse_key: '2:1',
      juz_number: 1,
      words: [
        { code_v2: 'ﱁ', text_uthmani: 'الٓمٓ', line_number: 3, char_type_name: 'word' },
        { code_v2: 'ﱂ', text_uthmani: '١', line_number: 3, char_type_name: 'end' },
      ],
    },
    {
      verse_key: '2:2',
      juz_number: 1,
      words: [
        { code_v2: 'ﱆﱇ', text_uthmani: 'رَيْبَ ۛ', line_number: 3, char_type_name: 'word' },
        { code_v2: 'ﱌ', text_uthmani: '٢', line_number: 4, char_type_name: 'end' },
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
    assert.equal(p2Rows[2].tokens[2].codeV2Stem, 'ﱆ');
    assert.equal(p2Rows[2].tokens[2].codeV2Waqf, 'ﱇ');
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
