import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLastReadRecord,
  evaluateHorizontalSwipe,
  formatSavedAyahsForExport,
  isAyahBookmarked,
  parseAlQuranSearchPayload,
  parseQuickQuranTarget,
  pickDailyCuratedIndex,
  pickRandomGlobalAyahTarget,
  removeSavedAyahItem,
  sanitizeLastRead,
  sanitizeSavedAyahs,
  toggleSavedAyahItem,
  updateSavedAyahNoteItem,
} from './readerState';

test('toggleSavedAyahItem adds and removes ayahs cleanly and deduplicates sanitizeSavedAyahs', () => {
  const first = toggleSavedAyahItem([], {
    surahNumber: 2,
    ayahNumber: 255,
    surahName: 'Bəqərə',
    pageNumber: 42,
    arabicText: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ',
    translation: 'Allahdan başqa məbud yoxdur.',
  }, '2026-11-16T10:00:00Z');

  assert.equal(first.added, true);
  assert.equal(first.next.length, 1);
  assert.equal(isAyahBookmarked(first.next, 2, 255), true);

  const sanitized = sanitizeSavedAyahs([
    ...first.next,
    first.next[0],
    { surahNumber: 999, ayahNumber: 1 },
  ]);
  assert.equal(sanitized.length, 1);

  const toggledOff = toggleSavedAyahItem(first.next, {
    surahNumber: 2,
    ayahNumber: 255,
    surahName: 'Bəqərə',
    arabicText: '',
    translation: '',
  });
  assert.equal(toggledOff.added, false);
  assert.equal(toggledOff.next.length, 0);

  const removed = removeSavedAyahItem(first.next, 2, 255);
  assert.equal(removed.length, 0);
});

test('updateSavedAyahNoteItem and formatSavedAyahsForExport handle personal reflection notes', () => {
  const base = toggleSavedAyahItem([], {
    surahNumber: 94,
    ayahNumber: 5,
    surahName: 'İnşirah',
    pageNumber: 596,
    arabicText: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: 'Həqiqətən, çətinliklə yanaşı asanlıq da vardır!',
  }, '2026-11-16T10:00:00Z').next;

  const withNote = updateSavedAyahNoteItem(base, 94, 5, '  Səbir və ümid ayəsi  ');
  assert.equal(withNote[0].note, 'Səbir və ümid ayəsi');

  const exported = formatSavedAyahsForExport(withNote);
  assert.match(exported, /İnşirah surəsi · 94:5/);
  assert.match(exported, /Mədinə səhifəsi 596/);
  assert.match(exported, /Şəxsi qeyd: Səbir və ümid ayəsi/);

  const clearedNote = updateSavedAyahNoteItem(withNote, 94, 5, '   ');
  assert.equal(clearedNote[0].note, undefined);
});

test('buildLastReadRecord and sanitizeLastRead validate page and surah bounds', () => {
  const pageRec = buildLastReadRecord('page', 293, 'Mədinə səhifəsi 293', '2026-11-16T12:00:00Z');
  assert.equal(pageRec.path, '/quran/sehife/293');
  assert.deepEqual(sanitizeLastRead(pageRec), pageRec);

  const surahRec = buildLastReadRecord('surah', 18, 'Kəhf surəsi', '2026-11-16T12:00:00Z');
  assert.equal(surahRec.path, '/quran/sure/18');
  assert.deepEqual(sanitizeLastRead(surahRec), surahRec);

  assert.equal(sanitizeLastRead({ kind: 'page', targetNumber: 605 }), null);
  assert.equal(sanitizeLastRead({ kind: 'surah', targetNumber: 0 }), null);
});

test('parseQuickQuranTarget parses Surah:Ayah, Mushaf pages, and Azerbaijani surah names', () => {
  const ayatKursi = parseQuickQuranTarget('2:255');
  assert.deepEqual(ayatKursi, {
    kind: 'surah-ayah',
    surahNumber: 2,
    ayahNumber: 255,
    path: '/quran/sure/2#ayah-255',
    label: 'Bəqərə 2:255',
  });

  const pageTarget = parseQuickQuranTarget('42');
  assert.deepEqual(pageTarget, {
    kind: 'page',
    pageNumber: 42,
    path: '/quran/sehife/42',
    label: 'Mədinə səhifəsi 42',
  });

  const yasinTarget = parseQuickQuranTarget('Yasin');
  assert.deepEqual(yasinTarget, {
    kind: 'surah',
    surahNumber: 36,
    path: '/quran/sure/36',
    label: '36. Yasin surəsi',
  });

  assert.equal(parseQuickQuranTarget(''), null);
});

test('parseAlQuranSearchPayload maps search matches cleanly with Azerbaijani surah names', () => {
  const parsed = parseAlQuranSearchPayload({
    code: 200,
    data: {
      matches: [
        {
          numberInSurah: 5,
          text: 'Həqiqətən, çətinliklə yanaşı asanlıq da vardır!',
          surah: { number: 94, englishName: 'Ash-Sharh' },
        },
        {
          numberInSurah: 5,
          text: 'Duplicate skipped',
          surah: { number: 94, englishName: 'Ash-Sharh' },
        },
        {
          numberInSurah: 255,
          text: 'Allahdan başqa tanrı yoxdur.',
          surah: { number: 2, englishName: 'Al-Baqara' },
        },
      ],
    },
  });

  assert.equal(parsed.length, 2);
  assert.deepEqual(parsed[0], {
    surahNumber: 94,
    surahName: 'İnşirah',
    ayahNumber: 5,
    snippet: 'Həqiqətən, çətinliklə yanaşı asanlıq da vardır!',
  });
  assert.equal(parsed[1].surahName, 'Bəqərə');
});

test('pickDailyCuratedIndex and pickRandomGlobalAyahTarget select valid Quran targets', () => {
  const idxA = pickDailyCuratedIndex(6, new Date('2026-11-16T10:00:00Z'));
  const idxB = pickDailyCuratedIndex(6, new Date('2026-11-17T10:00:00Z'));
  assert.ok(idxA >= 0 && idxA < 6);
  assert.ok(idxB >= 0 && idxB < 6);
  assert.notEqual(idxA, idxB);

  const firstAyah = pickRandomGlobalAyahTarget(undefined, () => 0);
  assert.deepEqual(firstAyah, { surahNumber: 1, ayahNumber: 1 });

  const lastAyah = pickRandomGlobalAyahTarget(undefined, () => 0.999999);
  assert.deepEqual(lastAyah, { surahNumber: 114, ayahNumber: 6 });
});

test('evaluateHorizontalSwipe distinguishes page-turn swipes from vertical scrolling', () => {
  assert.equal(evaluateHorizontalSwipe(300, 200, 180, 210), 'next');
  assert.equal(evaluateHorizontalSwipe(120, 200, 250, 210), 'prev');
  assert.equal(evaluateHorizontalSwipe(200, 200, 180, 205), null);
  assert.equal(evaluateHorizontalSwipe(200, 100, 110, 240), null);
});

