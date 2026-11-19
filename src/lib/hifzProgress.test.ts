import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_HIFZ_PROGRESS,
  buildHifzReviewQueue,
  getHifzPageRepetitions,
  getHifzPageStatus,
  incrementHifzRepetition,
  sanitizeHifzProgress,
  setHifzPageStatus,
  summarizeHifzProgress,
  summarizeJuzHifzProgress,
  toggleHifzBookmark,
} from './hifzProgress';

test('setHifzPageStatus and summarizeHifzProgress track memorized and learning pages accurately', () => {
  let state = EMPTY_HIFZ_PROGRESS;
  state = setHifzPageStatus(state, 1, 'memorized', '2026-11-16T10:00:00Z');
  state = setHifzPageStatus(state, 2, 'learning', '2026-11-16T10:01:00Z');
  state = setHifzPageStatus(state, 604, 'memorized', '2026-11-16T10:02:00Z');

  assert.equal(getHifzPageStatus(state, 1), 'memorized');
  assert.equal(getHifzPageStatus(state, 2), 'learning');
  assert.equal(getHifzPageStatus(state, 3), 'none');

  const summary = summarizeHifzProgress(state);
  assert.equal(summary.memorizedCount, 2);
  assert.equal(summary.learningCount, 1);
  assert.equal(summary.memorizedPercent, 0.3);

  const juzBreakdown = summarizeJuzHifzProgress(state);
  assert.equal(juzBreakdown.length, 30);
  assert.equal(juzBreakdown[0].memorizedPages, 1);
  assert.equal(juzBreakdown[0].learningPages, 1);
  assert.equal(juzBreakdown[29].memorizedPages, 1);

  state = setHifzPageStatus(state, 2, 'none', '2026-11-16T10:03:00Z');
  assert.equal(getHifzPageStatus(state, 2), 'none');
});

test('toggleHifzBookmark toggles bookmark and sanitizeHifzProgress discards out-of-range pages', () => {
  let state = EMPTY_HIFZ_PROGRESS;
  state = toggleHifzBookmark(state, 42, '2026-11-16T10:00:00Z');
  assert.equal(state.bookmarkedPage, 42);
  state = toggleHifzBookmark(state, 42, '2026-11-16T10:01:00Z');
  assert.equal(state.bookmarkedPage, null);

  const sanitized = sanitizeHifzProgress({
    pages: { '1': 'memorized', '999': 'memorized', '5': 'invalid', '12': 'learning' },
    bookmarkedPage: 36,
    repetitions: { '1': 4, '999': 5, '2': -1 },
    updatedAt: '2026-11-16T10:00:00Z',
  });
  assert.deepEqual(sanitized.pages, { 1: 'memorized', 12: 'learning' });
  assert.deepEqual(sanitized.repetitions, { 1: 4 });
  assert.equal(sanitized.bookmarkedPage, 36);
});

test('buildHifzReviewQueue prioritizes mistake pages, then learning pages, then memorized pages', () => {
  let state = EMPTY_HIFZ_PROGRESS;
  state = setHifzPageStatus(state, 1, 'memorized', '2026-11-16T10:00:00Z');
  state = setHifzPageStatus(state, 10, 'learning', '2026-11-16T10:01:00Z');
  state = toggleHifzBookmark(state, 440, '2026-11-16T10:02:00Z');

  const queue = buildHifzReviewQueue(state, [
    { pageNumber: 440 },
    { pageNumber: 440 },
    { pageNumber: 1 },
  ]);

  assert.equal(queue.length, 3);
  assert.equal(queue[0].pageNumber, 440);
  assert.equal(queue[0].mistakeCount, 2);
  assert.equal(queue[0].priority, 'mistakes');
  assert.equal(queue[1].pageNumber, 1);
  assert.equal(queue[1].mistakeCount, 1);
  assert.equal(queue[2].pageNumber, 10);
  assert.equal(queue[2].priority, 'learning');
});

test('incrementHifzRepetition increments per-page repetition counts safely', () => {
  let state = EMPTY_HIFZ_PROGRESS;
  assert.equal(getHifzPageRepetitions(state, 1), 0);
  state = incrementHifzRepetition(state, 1, '2026-11-16T10:00:00Z');
  state = incrementHifzRepetition(state, 1, '2026-11-16T10:01:00Z');
  assert.equal(getHifzPageRepetitions(state, 1), 2);
});


