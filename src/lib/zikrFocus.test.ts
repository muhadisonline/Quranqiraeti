import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluateZikrCardSwipe,
  getBakuHour,
  getDefaultZikrCategoryForTime,
  getZikrTimeBannerText,
  stepZikrCardIndex,
} from './zikrFocus';

test('getDefaultZikrCategoryForTime selects seher in Baku morning/early afternoon and axsam afterward', () => {
  // 04:00 UTC => 08:00 Baku (seher)
  assert.equal(getBakuHour(new Date('2026-11-24T04:00:00Z')), 8);
  assert.equal(getDefaultZikrCategoryForTime(new Date('2026-11-24T04:00:00Z')), 'seher');

  // 11:30 UTC => 15:30 Baku (seher)
  assert.equal(getDefaultZikrCategoryForTime(new Date('2026-11-24T11:30:00Z')), 'seher');

  // 13:00 UTC => 17:00 Baku (axsam)
  assert.equal(getDefaultZikrCategoryForTime(new Date('2026-11-24T13:00:00Z')), 'axsam');

  // 22:00 UTC => 02:00 Baku (axsam)
  assert.equal(getDefaultZikrCategoryForTime(new Date('2026-11-24T22:00:00Z')), 'axsam');
});

test('getZikrTimeBannerText produces contextual Azerbaijani message', () => {
  assert.match(getZikrTimeBannerText('seher'), /Səhər zikri vaxtıdır/);
  assert.match(getZikrTimeBannerText('axsam'), /Axşam zikri vaxtıdır/);
});

test('stepZikrCardIndex clamps cleanly within bounds', () => {
  assert.equal(stepZikrCardIndex(0, 5, 'prev'), 0);
  assert.equal(stepZikrCardIndex(0, 5, 'next'), 1);
  assert.equal(stepZikrCardIndex(4, 5, 'next'), 4);
  assert.equal(stepZikrCardIndex(2, 5, 'prev'), 1);
  assert.equal(stepZikrCardIndex(0, 0, 'next'), 0);
});

test('evaluateZikrCardSwipe distinguishes horizontal swipes from vertical scroll', () => {
  assert.equal(evaluateZikrCardSwipe(200, 300, 110, 305), 'next');
  assert.equal(evaluateZikrCardSwipe(100, 300, 210, 310), 'prev');
  assert.equal(evaluateZikrCardSwipe(100, 100, 120, 280), null);
});
