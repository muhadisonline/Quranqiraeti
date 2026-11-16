import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_READING_GOAL,
  calculateReadingStreakDays,
  recordPageVisitState,
  resetKhatmState,
  setDailyGoalPagesState,
  summarizeReadingGoal,
} from './readingGoal';

test('recordPageVisitState tracks unique pages per day and across the 604-page Khatm', () => {
  let state = recordPageVisitState(EMPTY_READING_GOAL, 1, '2026-11-16');
  state = recordPageVisitState(state, 2, '2026-11-16');
  state = recordPageVisitState(state, 2, '2026-11-16'); // duplicate ignored
  state = recordPageVisitState(state, 999, '2026-11-16'); // out-of-bounds ignored

  assert.deepEqual(state.visitedByDate['2026-11-16'], [1, 2]);
  assert.deepEqual(state.khatmPages, [1, 2]);
});

test('calculateReadingStreakDays counts consecutive days including yesterday fallback', () => {
  let state = recordPageVisitState(EMPTY_READING_GOAL, 10, '2026-11-14');
  state = recordPageVisitState(state, 11, '2026-11-15');

  // If user has not read today yet (2026-11-16), streak from yesterday is still 2 days
  assert.equal(calculateReadingStreakDays(state, '2026-11-16'), 2);

  state = recordPageVisitState(state, 12, '2026-11-16');
  assert.equal(calculateReadingStreakDays(state, '2026-11-16'), 3);
});

test('summarizeReadingGoal computes daily percent, remaining pages, and estimated Khatm days', () => {
  let state = setDailyGoalPagesState(EMPTY_READING_GOAL, 10);
  state = recordPageVisitState(state, 1, '2026-11-16');
  state = recordPageVisitState(state, 2, '2026-11-16');
  state = recordPageVisitState(state, 3, '2026-11-16');
  state = recordPageVisitState(state, 4, '2026-11-16');

  const summary = summarizeReadingGoal(state, '2026-11-16');
  assert.equal(summary.todayCount, 4);
  assert.equal(summary.goalPages, 10);
  assert.equal(summary.todayPercent, 40);
  assert.equal(summary.khatmCount, 4);
  assert.equal(summary.remainingPages, 600);
  assert.equal(summary.estimatedDaysLeft, 60);

  const afterReset = resetKhatmState(state);
  assert.equal(afterReset.khatmPages.length, 0);
});
