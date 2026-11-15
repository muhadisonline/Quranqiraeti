import test from 'node:test';
import assert from 'node:assert/strict';
import {
  JUZ_PAGE_RANGES,
  SURAH_CATALOG,
  TOTAL_QURAN_PAGES,
  TOTAL_QURAN_SURAHS,
  attachMushafPagesToSurah,
  buildMushafPageSeoData,
  filterSurahCatalog,
  formatAzerbaijaniOrdinal,
  getJuzForPage,
  getPagesForJuz,
  getSurahByNumber,
  groupAyahsByMushafPage,
  mergePageAyahsWithMusayev,
  parseQuranComChapterVersesPages,
  parseQuranComPageVerses,
  summarizeMushafPageContents,
} from './quran';
import { SurahTranslationPayload } from './channel';

test('SURAH_CATALOG covers all 114 surahs with 6236 ayahs and valid Mushaf start pages', () => {
  assert.equal(SURAH_CATALOG.length, TOTAL_QURAN_SURAHS);
  assert.equal(SURAH_CATALOG[0].number, 1);
  assert.equal(SURAH_CATALOG[113].number, 114);
  const totalAyahs = SURAH_CATALOG.reduce((sum, s) => sum + s.ayahCount, 0);
  assert.equal(totalAyahs, 6236);
  assert.ok(
    SURAH_CATALOG.every((s) => s.startPage >= 1 && s.startPage <= TOTAL_QURAN_PAGES)
  );
  assert.equal(getSurahByNumber(18)?.name, 'Kəhf');
  assert.equal(getSurahByNumber(112)?.startPage, 604);
});

test('JUZ_PAGE_RANGES and getPagesForJuz cover all 604 Mushaf pages', () => {
  assert.equal(JUZ_PAGE_RANGES.length, 30);
  assert.equal(getPagesForJuz('all').length, 604);
  assert.equal(getPagesForJuz(30).length, 23);
  assert.equal(getJuzForPage(1), 1);
  assert.equal(getJuzForPage(604), 30);
});

test('filterSurahCatalog filters by Azerbaijani name, surah number, and revelation place', () => {
  const byNumber = filterSurahCatalog(SURAH_CATALOG, { query: '36', place: 'all' });
  assert.equal(byNumber.length, 1);
  assert.equal(byNumber[0].name, 'Yasin');

  const byText = filterSurahCatalog(SURAH_CATALOG, { query: 'tovbe', place: 'Mədinə' });
  assert.equal(byText.length, 1);
  assert.equal(byText[0].number, 9);
});

test('mergePageAyahsWithMusayev merges Mushaf page ayahs with Alixan Musayev translation', () => {
  const translations = new Map<number, SurahTranslationPayload>([
    [
      112,
      {
        surahNumber: 112,
        translatorName: 'Əlixan Musayev',
        editionVersion: '1.0.4',
        ayahs: [
          {
            surahNumber: 112,
            ayahNumber: 1,
            arabicText: 'قُلۡ هُوَ ٱللَّهُ أَحَدٌ',
            translation: 'De: “O Allah Təkdir!',
            footnotes: '',
          },
        ],
      },
    ],
  ]);

  const merged = mergePageAyahsWithMusayev(
    604,
    [{ surahNumber: 112, ayahNumber: 1, juzNumber: 30, arabicText: 'قُلْ هُوَ اللَّهُ أَحَدٌ' }],
    translations
  );
  assert.equal(merged.pageNumber, 604);
  assert.equal(merged.juzNumber, 30);
  assert.equal(merged.surahsOnPage[0].surahName, 'İxlas surəsi');
  assert.equal(merged.ayahs[0].translation, 'De: “O Allah Təkdir!');
  assert.equal(merged.translatorName, 'Əlixan Musayev');
});

test('formatAzerbaijaniOrdinal applies correct vowel harmony suffixes', () => {
  assert.equal(formatAzerbaijaniOrdinal(1), '1-ci');
  assert.equal(formatAzerbaijaniOrdinal(3), '3-cü');
  assert.equal(formatAzerbaijaniOrdinal(6), '6-cı');
  assert.equal(formatAzerbaijaniOrdinal(9), '9-cu');
  assert.equal(formatAzerbaijaniOrdinal(10), '10-cu');
  assert.equal(formatAzerbaijaniOrdinal(18), '18-ci');
  assert.equal(formatAzerbaijaniOrdinal(30), '30-cu');
  assert.equal(formatAzerbaijaniOrdinal(40), '40-cı');
  assert.equal(formatAzerbaijaniOrdinal(100), '100-cü');
  assert.equal(formatAzerbaijaniOrdinal(114), '114-cü');
  assert.equal(formatAzerbaijaniOrdinal(604), '604-cü');
});

test('parseQuranComPageVerses parses quran.com v4 verses payload cleanly', () => {
  const parsed = parseQuranComPageVerses({
    verses: [
      { verse_key: '112:1', verse_number: 1, juz_number: 30, text_uthmani: ' قُلْ هُوَ ٱللَّهُ أَحَدٌ ' },
      { verse_key: '114:6', verse_number: 6, juz_number: 30, text_uthmani: 'مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ' },
    ],
  });
  assert.equal(parsed.length, 2);
  assert.deepEqual(parsed[0], {
    surahNumber: 112,
    ayahNumber: 1,
    juzNumber: 30,
    arabicText: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
  });
  assert.equal(parsed[1].surahNumber, 114);
  assert.equal(parsed[1].ayahNumber, 6);
});

test('parseQuranComChapterVersesPages and groupAyahsByMushafPage group ayahs by exact Madinah Mushaf page', () => {
  const pageMap = parseQuranComChapterVersesPages({
    verses: [
      { verse_key: '2:1', verse_number: 1, page_number: 2, juz_number: 1 },
      { verse_key: '2:5', verse_number: 5, page_number: 2, juz_number: 1 },
      { verse_key: '2:6', verse_number: 6, page_number: 3, juz_number: 1 },
      { verse_key: '2:7', verse_number: 7, page_number: 3, juz_number: 1 },
    ],
  });

  const basePayload: SurahTranslationPayload = {
    surahNumber: 2,
    translatorName: 'Əlixan Musayev',
    editionVersion: '1.0.4',
    ayahs: [
      { surahNumber: 2, ayahNumber: 1, arabicText: 'الم', translation: 'Əlif. Lam. Mim.', footnotes: '' },
      { surahNumber: 2, ayahNumber: 5, arabicText: '...', translation: 'Onlar hidayət üzrədirlər.', footnotes: '' },
      { surahNumber: 2, ayahNumber: 6, arabicText: '...', translation: 'Həqiqətən, kafirlər...', footnotes: '' },
      { surahNumber: 2, ayahNumber: 7, arabicText: '...', translation: 'Allah onların qəlbini...', footnotes: '' },
    ],
  };

  const enriched = attachMushafPagesToSurah(basePayload, pageMap);
  assert.equal(enriched.ayahs[0].pageNumber, 2);
  assert.equal(enriched.ayahs[2].pageNumber, 3);

  const groups = groupAyahsByMushafPage(enriched.ayahs, 2);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].pageNumber, 2);
  assert.equal(groups[0].ayahCount, 2);
  assert.equal(groups[0].ayahRangeLabel, '1–5');
  assert.equal(groups[1].pageNumber, 3);
  assert.equal(groups[1].ayahCount, 2);
  assert.equal(groups[1].ayahRangeLabel, '6–7');
});

test('summarizeMushafPageContents and buildMushafPageSeoData produce SEO metadata with prev/next links', () => {
  const payload = {
    pageNumber: 604,
    juzNumber: 30,
    surahsOnPage: [
      { surahNumber: 112, surahName: 'İxlas surəsi', arabicName: 'سُورَةُ الإِخۡلَاصِ' },
      { surahNumber: 113, surahName: 'Fələq surəsi', arabicName: 'سُورَةُ الفَلَقِ' },
    ],
    translatorName: 'Əlixan Musayev',
    editionVersion: '1.0.4',
    ayahs: [
      {
        surahNumber: 112,
        surahName: 'İxlas surəsi',
        arabicSurahName: '',
        ayahNumber: 1,
        juzNumber: 30,
        arabicText: '...',
        translation: '...',
        footnotes: '',
      },
      {
        surahNumber: 112,
        surahName: 'İxlas surəsi',
        arabicSurahName: '',
        ayahNumber: 4,
        juzNumber: 30,
        arabicText: '...',
        translation: '...',
        footnotes: '',
      },
      {
        surahNumber: 113,
        surahName: 'Fələq surəsi',
        arabicSurahName: '',
        ayahNumber: 1,
        juzNumber: 30,
        arabicText: '...',
        translation: '...',
        footnotes: '',
      },
    ],
  };

  assert.equal(summarizeMushafPageContents(payload), 'İxlas surəsi (1–4), Fələq surəsi (1)');

  const seo = buildMushafPageSeoData(604, 'https://quranqiraeti.vercel.app', payload);
  assert.ok(seo.title.includes('604-cü səhifə'));
  assert.ok(seo.title.includes('İxlas surəsi (1–4)'));
  assert.ok(seo.description.includes('3 ayə'));
  assert.equal(seo.prevPath, '/quran/sehife/603');
  assert.equal(seo.nextPath, undefined);
  assert.equal(seo.jsonLd.length, 2);
});
