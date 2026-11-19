import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_READING_GOAL, recordPageVisitState } from './readingGoal';
import {
  createDefaultKhatmPlan,
  evaluateKhatmPlan,
  findNextUnreadKhatmPage,
  sanitizeKhatmPlanConfig,
} from './khatmPlanner';

test('sanitizeKhatmPlanConfig clamps days and falls back safely', () => {
  const invalid = sanitizeKhatmPlanConfig({ targetDays: 2, startDateKey: 'bad' }, '2026-11-18');
  assert.equal(invalid.targetDays, 30);
  assert.equal(invalid.startDateKey, '2026-11-18');

  const custom = sanitizeKhatmPlanConfig({ targetDays: 45, startDateKey: '2026-11-01' }, '2026-11-18');
  assert.equal(custom.targetDays, 45);
  assert.equal(custom.startDateKey, '2026-11-01');
});

test('evaluateKhatmPlan rebalances daily pages and calculates pace accurately', () => {
  const plan = { ...createDefaultKhatmPlan('2026-11-01'), targetDays: 30 };

  // Day 10: user only read 100 pages (expected ~201 for day 10 of 30) -> behind, auto-rebalances
  let goal = EMPTY_READING_GOAL;
  for (let p = 1; p <= 100; p++) {
    goal = recordPageVisitState(goal, p, '2026-11-10');
  }

  const evalBehind = evaluateKhatmPlan(plan, goal, '2026-11-10');
  assert.equal(evalBehind.daysElapsed, 10);
  assert.equal(evalBehind.daysRemaining, 21);
  assert.equal(evalBehind.remainingPages, 504);
  assert.equal(evalBehind.rebalancedDailyPages, Math.ceil(504 / 21));
  assert.equal(evalBehind.paceStatus, 'behind');
  assert.equal(evalBehind.nextUnreadPage, 101);
  assert.equal(evalBehind.nextUnreadJuz, 5);

  // Day 2: user read 60 pages (expected ~40) -> ahead
  let goalAhead = EMPTY_READING_GOAL;
  for (let p = 1; p <= 60; p++) {
    goalAhead = recordPageVisitState(goalAhead, p, '2026-11-02');
  }
  const evalAhead = evaluateKhatmPlan(plan, goalAhead, '2026-11-02');
  assert.equal(evalAhead.paceStatus, 'ahead');
  assert.ok(evalAhead.deltaPages >= 3);
});

test('findNextUnreadKhatmPage returns null when all 604 pages read', () => {
  const all = Array.from({ length: 604 }, (_, i) => i + 1);
  assert.equal(findNextUnreadKhatmPage(all), null);
  assert.equal(findNextUnreadKhatmPage([1, 2, 4]), 3);
});
