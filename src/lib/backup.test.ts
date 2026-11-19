import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildUserProgressBackup,
  parseAndValidateBackupJson,
  sanitizeMissedWordList,
  sanitizeSavedVideoIdList,
} from './backup';

test('buildUserProgressBackup sanitizes invalid fields cleanly', () => {
  const backup = buildUserProgressBackup(
    {
      savedAyahs: [
        {
          surahNumber: 2,
          ayahNumber: 255,
          surahName: 'Bəqərə',
          arabicText: 'اللَّهُ',
          translation: 'Allah...',
          note: 'Ayətül-Kürsi',
        },
        { surahNumber: 999, ayahNumber: 1 }, // invalid surah rejected
      ],
      readingGoal: { dailyGoalPages: 10, khatmPages: [1, 2, 700] },
      hifzProgress: { pages: { '1': 'memorized', '999': 'learning' }, bookmarkedPage: 582 },
      missedWords: [
        {
          tokenId: '1:1:1',
          ayahKey: '1:1',
          pageNumber: 1,
          surahName: 'Fatihə',
          stemText: 'بِسْمِ',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        { tokenId: 'bad', ayahKey: '1:1', pageNumber: 999, stemText: 'x' },
      ],
      savedVideoIds: ['abc1234', 'abc1234', 'x'],
    },
    '2026-05-01T10:00:00.000Z'
  );

  assert.equal(backup.version, 1);
  assert.equal(backup.savedAyahs.length, 1);
  assert.equal(backup.savedAyahs[0].note, 'Ayətül-Kürsi');
  assert.equal(backup.readingGoal.dailyGoalPages, 10);
  assert.deepEqual(backup.readingGoal.khatmPages, [1, 2]);
  assert.equal(backup.hifzProgress.pages[1], 'memorized');
  assert.equal(backup.hifzProgress.bookmarkedPage, 582);
  assert.equal(backup.missedWords.length, 1);
  assert.deepEqual(backup.savedVideoIds, ['abc1234']);
});

test('parseAndValidateBackupJson rejects empty, malformed, and unrelated JSON payloads', () => {
  const empty = parseAndValidateBackupJson('   ');
  assert.equal(empty.ok, false);

  const badJson = parseAndValidateBackupJson('{not json');
  assert.equal(badJson.ok, false);

  const unrelated = parseAndValidateBackupJson('{"foo":"bar"}');
  assert.equal(unrelated.ok, false);

  const valid = parseAndValidateBackupJson(
    JSON.stringify({
      version: 1,
      savedAyahs: [],
      hifzProgress: { pages: { '604': 'memorized' }, bookmarkedPage: 604 },
    })
  );
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.data.hifzProgress.pages[604], 'memorized');
    assert.equal(valid.data.hifzProgress.bookmarkedPage, 604);
  }
});

test('sanitize helpers deduplicate missed words and video IDs', () => {
  const words = sanitizeMissedWordList([
    { tokenId: 't1', ayahKey: '2:1', pageNumber: 2, stemText: 'الم' },
    { tokenId: 't1', ayahKey: '2:1', pageNumber: 2, stemText: 'الم' },
  ]);
  assert.equal(words.length, 1);

  const ids = sanitizeSavedVideoIdList(['vid_123', 'vid_123', 'invalid space']);
  assert.deepEqual(ids, ['vid_123']);

  const withPrayerAndZikr = parseAndValidateBackupJson(
    JSON.stringify({
      prayerCityId: 'custom',
      prayerCustomCoords: { lat: 41.0082, lng: 28.9784 },
      zikrState: { activePresetId: 'istighfar', tasbihTarget: 100, tasbihCount: 12, completedCycles: 2 },
      khatmPlan: { enabled: true, targetDays: 15, startDateKey: '2026-11-10' },
      worshipReminders: { fridayKahfEnabled: true, dailyAzkarEnabled: false, prePrayer15mEnabled: true },
    })
  );
  assert.equal(withPrayerAndZikr.ok, true);
  if (withPrayerAndZikr.ok) {
    assert.equal(withPrayerAndZikr.data.prayerCityId, 'custom');
    assert.equal(withPrayerAndZikr.data.prayerCustomCoords?.lat, 41.0082);
    assert.equal(withPrayerAndZikr.data.zikrState?.completedCycles, 2);
    assert.equal(withPrayerAndZikr.data.khatmPlan?.targetDays, 15);
    assert.equal(withPrayerAndZikr.data.worshipReminders?.dailyAzkarEnabled, false);
  }
});
