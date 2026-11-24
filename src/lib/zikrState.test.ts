import test from 'node:test';
import assert from 'node:assert/strict';
import { DAILY_AZKAR, getAzkarByCategory } from '../data/azkar';
import {
  ZikrTrackerState,
  createEmptyZikrState,
  decrementTasbihStep,
  incrementAzkarItemStep,
  incrementTasbihStep,
  sanitizeZikrState,
} from './zikrState';

test('increments and completes a 33-count Tasbih cycle cleanly', () => {
  const now = new Date('2026-11-17T10:00:00Z');
  let state = createEmptyZikrState(now);

  for (let i = 0; i < 32; i++) {
    const res = incrementTasbihStep(state, now);
    state = res.nextState;
    assert.equal(res.cycleCompleted, false);
  }
  assert.equal(state.tasbihCount, 32);
  assert.equal(state.completedCycles, 0);

  const finalStep = incrementTasbihStep(state, now);
  assert.equal(finalStep.cycleCompleted, true);
  assert.equal(finalStep.nextState.tasbihCount, 0);
  assert.equal(finalStep.nextState.completedCycles, 1);
  assert.equal(finalStep.nextState.todayTotal, 33);
});

test('guided Namaz Tasbihat progresses Subhanallah(33) -> Alhamdulillah(33) -> Allahu Akbar(34)', () => {
  const now = new Date('2026-11-17T10:00:00Z');
  let state: ZikrTrackerState = {
    ...createEmptyZikrState(now),
    namazSequenceMode: true,
    namazStage: 0,
    tasbihTarget: 33,
  };

  for (let i = 0; i < 33; i++) {
    state = incrementTasbihStep(state, now).nextState;
  }
  assert.equal(state.namazStage, 1);
  assert.equal(state.activePresetId, 'alhamdulillah');
  assert.equal(state.tasbihCount, 0);

  for (let i = 0; i < 33; i++) {
    state = incrementTasbihStep(state, now).nextState;
  }
  assert.equal(state.namazStage, 2);
  assert.equal(state.activePresetId, 'allahuakbar');
  assert.equal(state.tasbihTarget, 34);

  for (let i = 0; i < 33; i++) {
    state = incrementTasbihStep(state, now).nextState;
  }
  const done = incrementTasbihStep(state, now);
  assert.equal(done.cycleCompleted, true);
  assert.equal(done.nextState.namazStage, 0);
  assert.equal(done.nextState.completedCycles, 1);
  assert.equal(done.nextState.todayTotal, 100);
});

test('handles undo step, daily item counter, and midnight rollover', () => {
  const day1 = new Date('2026-11-17T10:00:00Z');
  let state = incrementTasbihStep(createEmptyZikrState(day1), day1).nextState;
  state = incrementAzkarItemStep(state, 'seher-qorunma', day1);
  assert.equal(state.todayTotal, 2);
  assert.equal(state.itemCounts['seher-qorunma'], 1);

  state = decrementTasbihStep(state, day1);
  assert.equal(state.tasbihCount, 0);
  assert.equal(state.todayTotal, 1);

  const day2 = new Date('2026-11-18T10:00:00Z');
  const nextDayState = sanitizeZikrState(state, day2);
  assert.equal(nextDayState.todayTotal, 0);
  assert.deepEqual(nextDayState.itemCounts, {});
});

test('DAILY_AZKAR includes complete Müsəlman Qalası morning and evening adhkar collections', () => {
  const morning = getAzkarByCategory('seher');
  const evening = getAzkarByCategory('axsam');
  assert.ok(morning.length >= 21, `Expected >=21 morning adhkar, got ${morning.length}`);
  assert.ok(evening.length >= 19, `Expected >=19 evening adhkar, got ${evening.length}`);
  assert.ok(morning.some((a) => a.id === 'ayetul-kursi-zikr'));
  assert.ok(morning.some((a) => a.id === 'muavvizat-3-qul'));
  assert.ok(morning.some((a) => a.id === 'seher-elm-ruzi'));
  assert.ok(evening.some((a) => a.id === 'axsam-kelimeler'));
  assert.ok(evening.some((a) => a.id === 'axsam-fitret'));
  assert.ok(DAILY_AZKAR.every((a) => a.arabicText.trim().length > 0 && a.translation.trim().length > 0));
});

