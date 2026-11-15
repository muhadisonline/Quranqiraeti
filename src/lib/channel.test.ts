import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVideoJsonLd,
  classifyVideoTitle,
  filterRecitations,
  filterSurahAyahs,
  formatAzerbaijaniDate,
  formatDurationToIso8601,
  formatViewCount,
  getMentionedSurahs,
  normalizeAzerbaijaniText,
  parseDurationToSeconds,
  parseQuranEncSurah,
  parseYouTubeShortsContinuation,
  validateSurahRequest,
} from './channel';
import { SEED_LONG_VIDEOS, SEED_SHORTS } from '../data/recitations';

test('normalizeAzerbaijaniText folds Azerbaijani diacritics cleanly', () => {
  assert.equal(normalizeAzerbaijaniText('Kəhf Surəsi — Qəmər'), 'kehf suresi — qemer');
  assert.equal(normalizeAzerbaijaniText('RƏHMAN və Kövsər'), 'rehman ve kovser');
});

test('parseDurationToSeconds and formatDurationToIso8601 handle mm:ss and hh:mm:ss', () => {
  assert.equal(parseDurationToSeconds('10:49'), 649);
  assert.equal(parseDurationToSeconds('1:53:32'), 6812);
  assert.equal(formatDurationToIso8601('10:49'), 'PT10M49S');
  assert.equal(formatDurationToIso8601('1:53:32'), 'PT1H53M32S');
});

test('classifyVideoTitle extracts surahNumber, ayahStart/End, reciter, and SEO metadata', () => {
  const loqman = classifyVideoTitle('Loqman Surəsi - İslam Subhi', {
    format: 'long',
    duration: '10:49',
  });
  assert.equal(loqman.surahNumber, 31);
  assert.equal(loqman.surahName, 'Loqman surəsi');
  assert.equal(loqman.reciter, 'İslam Subhi');
  assert.equal(loqman.durationSeconds, 649);
  assert.equal(loqman.revelationPlace, 'Məkkə');
  assert.ok(loqman.seoDescription.includes('Əlixan Musayev'));

  const kahfShort = classifyVideoTitle('kehf suresi 15-17', {
    format: 'short',
    duration: '0:58',
  });
  assert.equal(kahfShort.surahNumber, 18);
  assert.equal(kahfShort.ayahStart, 15);
  assert.equal(kahfShort.ayahEnd, 17);
  assert.equal(kahfShort.ayahRange, '15–17. ayələr');
  assert.equal(kahfShort.reciter, 'Seçilmiş Qari');

  const nisaQuote = classifyVideoTitle('Harada olursunuzsa olun, ölüm sizi haqlayacaqdır.', {
    format: 'short',
    duration: '0:50',
  });
  assert.equal(nisaQuote.surahNumber, 4);
  assert.equal(nisaQuote.ayahStart, 78);

  const muminunSuffix = classifyVideoTitle(
    'Biz onlardan sonra isə başqa bir nəsil yaratdıq. - Muminun surəsi',
    { format: 'long', duration: '5:04' }
  );
  assert.equal(muminunSuffix.surahNumber, 23);
  assert.equal(muminunSuffix.reciter, 'Seçilmiş Qari');
});

test('parseQuranEncSurah parses Arabic text, Alixan Musayev translation, and footnotes', () => {
  const parsed = parseQuranEncSurah(31, {
    result: [
      {
        aya: '1',
        arabic_text: 'الٓمٓ',
        translation: 'Əlif. Ləm. Mim.[1]',
        footnotes: '[1] Bax. əl-Bəqərə surəsi birinci ayəsinin qeydi.',
      },
    ],
  });
  assert.equal(parsed.surahNumber, 31);
  assert.equal(parsed.translatorName, 'Əlixan Musayev');
  assert.equal(parsed.editionVersion, '1.0.4');
  assert.equal(parsed.ayahs.length, 1);
  assert.equal(parsed.ayahs[0].arabicText, 'الٓمٓ');
  assert.equal(parsed.ayahs[0].translation, 'Əlif. Ləm. Mim.[1]');
});

test('getMentionedSurahs detects multi-surah compilations and filterSurahAyahs filters cleanly', () => {
  const multi = getMentionedSurahs(
    'Surah Mulk, Surah Vaqia, Surah Yasin, Surah Rahman - Maher al Muaiqly',
    67
  );
  assert.deepEqual(
    multi.map((m) => m.surahNumber),
    [36, 67, 55, 56]
  );

  const sampleAyahs = [
    { surahNumber: 18, ayahNumber: 14, arabicText: 'وَرَبَطْنَا', translation: 'Biz onların qəlblərini möhkəmləndirdik.', footnotes: '' },
    { surahNumber: 18, ayahNumber: 15, arabicText: 'هَٰؤُلَاءِ قَوْمُنَا', translation: 'Bu bizim xalqımızdır.', footnotes: '' },
    { surahNumber: 18, ayahNumber: 16, arabicText: 'وَإِذِ اعْتَزَلْتُمُوهُمْ', translation: 'Siz onlardan uzaqlaşdınız.', footnotes: '' },
  ];
  assert.deepEqual(
    filterSurahAyahs(sampleAyahs, { mode: 'excerpt', ayahStart: 15, ayahEnd: 16, query: '' }).map((a) => a.ayahNumber),
    [15, 16]
  );
  assert.deepEqual(
    filterSurahAyahs(sampleAyahs, { mode: 'full', ayahStart: 15, ayahEnd: 16, query: 'qelblerini' }).map((a) => a.ayahNumber),
    [14]
  );
  assert.deepEqual(
    filterSurahAyahs(sampleAyahs, { mode: 'excerpt', ayahStart: 15, ayahEnd: 16, query: '18:14' }).map((a) => a.ayahNumber),
    [14]
  );
});

test('SEED_LONG_VIDEOS contains only long-form videos (>= 2 min) and SEED_SHORTS contains shorts', () => {
  assert.ok(SEED_LONG_VIDEOS.length >= 15);
  assert.ok(SEED_LONG_VIDEOS.every((v) => v.format === 'long' && v.durationSeconds >= 120));
  assert.ok(SEED_SHORTS.length >= 10);
  assert.ok(SEED_SHORTS.every((v) => v.format === 'short' && v.durationSeconds < 120));
});

test('buildVideoJsonLd produces valid Schema.org VideoObject metadata', () => {
  const firstLong = SEED_LONG_VIDEOS[0];
  const jsonLd = buildVideoJsonLd(firstLong, 'https://quranqiraeti.az');
  assert.equal(jsonLd['@type'], 'VideoObject');
  assert.equal(jsonLd.duration, 'PT10M49S');
  assert.equal(jsonLd.url, `https://quranqiraeti.az/video/${firstLong.videoId}`);
});

test('filterRecitations filters by search query, category tab, and saved IDs', () => {
  const kahfMatches = filterRecitations(SEED_SHORTS, {
    tab: 'all',
    query: 'kehf',
    savedIds: [],
  });
  assert.equal(kahfMatches.length, 4);

  const savedOnly = filterRecitations(SEED_LONG_VIDEOS, {
    tab: 'saved',
    query: '',
    savedIds: [SEED_LONG_VIDEOS[0].videoId, SEED_LONG_VIDEOS[1].videoId],
  });
  assert.equal(savedOnly.length, 2);
});

test('formatAzerbaijaniDate and formatViewCount format properly', () => {
  assert.equal(formatAzerbaijaniDate('2026-11-15T07:29:50+00:00'), '15 Noyabr 2026');
  assert.equal(formatViewCount(1864), '1 864 baxış');
});

test('validateSurahRequest enforces required surahName and valid optional email', () => {
  const emptyResult = validateSurahRequest({
    surahName: '',
    reciter: '',
    email: '',
    note: '',
  });
  assert.equal(emptyResult.valid, false);
  assert.ok(emptyResult.errors.surahName);

  const ok = validateSurahRequest({
    surahName: 'Yasin surəsi',
    reciter: 'Maher Al-Muaiqly',
    email: 'listener@example.com',
    note: 'Tam tərcümə ilə paylaşsanız sevinərik.',
  });
  assert.equal(ok.valid, true);
});

test('parseYouTubeShortsContinuation parses continuation Shorts and next token', () => {
  const result = parseYouTubeShortsContinuation({
    onResponseReceivedActions: [
      {
        appendContinuationItemsAction: {
          continuationItems: [
            {
              richItemRenderer: {
                content: {
                  shortsLockupViewModel: {
                    onTap: { innertubeCommand: { reelWatchEndpoint: { videoId: 'abc123xyz00' } } },
                    overlayMetadata: {
                      primaryText: { content: 'İxlas surəsi 1-4' },
                      secondaryText: { content: '1.2K views' },
                    },
                  },
                },
              },
            },
            {
              continuationItemRenderer: {
                continuationEndpoint: {
                  continuationCommand: { token: 'NEXT_PAGE_TOKEN' },
                },
              },
            },
          ],
        },
      },
    ],
  });
  assert.equal(result.shorts.length, 1);
  assert.equal(result.shorts[0].videoId, 'abc123xyz00');
  assert.equal(result.shorts[0].surahNumber, 112);
  assert.equal(result.shorts[0].views, 1200);
  assert.equal(result.continuationToken, 'NEXT_PAGE_TOKEN');
});
