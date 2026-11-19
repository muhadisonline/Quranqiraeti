import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SLEEP_TIMER_PRESETS,
  computeSleepRemainingSeconds,
  cycleSleepTimerMinutes,
  formatSleepTimerPresetLabel,
  formatSleepTimerRemaining,
} from './sleepTimer';

test('cycleSleepTimerMinutes cycles through 0 -> 15 -> 30 -> 45 -> 60 -> 0', () => {
  assert.deepEqual([...SLEEP_TIMER_PRESETS], [0, 15, 30, 45, 60]);
  assert.equal(cycleSleepTimerMinutes(0), 15);
  assert.equal(cycleSleepTimerMinutes(15), 30);
  assert.equal(cycleSleepTimerMinutes(30), 45);
  assert.equal(cycleSleepTimerMinutes(45), 60);
  assert.equal(cycleSleepTimerMinutes(60), 0);
});

test('computeSleepRemainingSeconds computes ceil seconds safely and clamps at 0', () => {
  assert.equal(computeSleepRemainingSeconds(null, 1000), 0);
  assert.equal(computeSleepRemainingSeconds(10_000, 1000), 9);
  assert.equal(computeSleepRemainingSeconds(10_500, 1000), 10);
  assert.equal(computeSleepRemainingSeconds(1000, 5000), 0);
});

test('formatSleepTimerRemaining formats MM:SS cleanly', () => {
  assert.equal(formatSleepTimerRemaining(0), '00:00');
  assert.equal(formatSleepTimerRemaining(5), '00:05');
  assert.equal(formatSleepTimerRemaining(90), '01:30');
  assert.equal(formatSleepTimerRemaining(3600), '60:00');
});

test('formatSleepTimerPresetLabel formats Azerbaijani labels', () => {
  assert.equal(formatSleepTimerPresetLabel(0), 'Bağlı');
  assert.equal(formatSleepTimerPresetLabel(15), '15 dəq');
  assert.equal(formatSleepTimerPresetLabel(60), '60 dəq');
});
