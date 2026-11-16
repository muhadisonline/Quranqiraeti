import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_HIFZ_PROGRESS,
  getHifzPageStatus,
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
    updatedAt: '2026-11-16T10:00:00Z',
  });
  assert.deepEqual(sanitized.pages, { 1: 'memorized', 12: 'learning' });
  assert.equal(sanitized.bookmarkedPage, 36);
});
