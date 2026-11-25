import assert from 'node:assert/strict';
import test from 'node:test';
import {
  markWeakAyahMastered,
  recordWeakAyahSignal,
  sanitizeWeakAyahList,
  sortWeakAyahReviewQueue,
  toggleManualWeakAyah,
} from './muhaffizReview';

test('recordWeakAyahSignal aggregates repeated struggles on the same ayah', () => {
  let list = recordWeakAyahSignal(
    [],
    {
      ayahKey: '2:255',
      surahName: 'Bəqərə',
      pageNumber: 42,
      reason: 'token_error',
    },
    '2026-11-24T09:00:00.000Z'
  );
  list = recordWeakAyahSignal(
    list,
    {
      ayahKey: '2:255',
      surahName: 'Bəqərə',
      pageNumber: 42,
      reason: 'quiz_error',
    },
    '2026-11-24T10:00:00.000Z'
  );

  assert.equal(list.length, 1);
  assert.equal(list[0].mistakeCount, 2);
  assert.deepEqual(list[0].reasons, ['token_error', 'quiz_error']);
  assert.equal(list[0].dueForReview, true);
});

test('toggleManualWeakAyah adds and removes manual review marker cleanly', () => {
  const first = toggleManualWeakAyah([], {
    ayahKey: '67:1',
    surahName: 'Mülk',
    pageNumber: 562,
  });
  assert.equal(first.flagged, true);
  assert.equal(first.next[0].manualFlag, true);

  const second = toggleManualWeakAyah(first.next, {
    ayahKey: '67:1',
    surahName: 'Mülk',
    pageNumber: 562,
  });
  assert.equal(second.flagged, false);
  assert.equal(second.next.length, 0);
});

test('markWeakAyahMastered moves item out of due review queue and re-triggers on new struggle', () => {
  const flagged = recordWeakAyahSignal([], {
    ayahKey: '36:1',
    surahName: 'Yasin',
    pageNumber: 440,
    reason: 'hint_heavy',
  });
  const mastered = markWeakAyahMastered(flagged, '36:1', '2026-11-24T11:00:00.000Z');
  assert.equal(sortWeakAyahReviewQueue(mastered).length, 0);

  const reFlagged = recordWeakAyahSignal(mastered, {
    ayahKey: '36:1',
    surahName: 'Yasin',
    pageNumber: 440,
    reason: 'quiz_error',
  });
  assert.equal(sortWeakAyahReviewQueue(reFlagged).length, 1);
});

test('sortWeakAyahReviewQueue prioritizes manual flags and higher mistake counts', () => {
  const sanitized = sanitizeWeakAyahList([
    {
      ayahKey: '1:1',
      surahNumber: 1,
      ayahNumber: 1,
      surahName: 'Fatihə',
      pageNumber: 1,
      reasons: ['token_error'],
      mistakeCount: 1,
      manualFlag: false,
      dueForReview: true,
      lastStruggledAt: '2026-11-24T09:00:00.000Z',
    },
    {
      ayahKey: '2:255',
      surahNumber: 2,
      ayahNumber: 255,
      surahName: 'Bəqərə',
      pageNumber: 42,
      reasons: ['quiz_error'],
      mistakeCount: 5,
      manualFlag: false,
      dueForReview: true,
      lastStruggledAt: '2026-11-24T08:00:00.000Z',
    },
    {
      ayahKey: '18:10',
      surahNumber: 18,
      ayahNumber: 10,
      surahName: 'Kəhf',
      pageNumber: 294,
      reasons: ['manual'],
      mistakeCount: 1,
      manualFlag: true,
      dueForReview: true,
      lastStruggledAt: '2026-11-24T07:00:00.000Z',
    },
  ]);

  const sorted = sortWeakAyahReviewQueue(sanitized);
  assert.deepEqual(
    sorted.map((s) => s.ayahKey),
    ['18:10', '2:255', '1:1']
  );
});
