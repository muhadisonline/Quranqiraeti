import test from 'node:test';
import assert from 'node:assert/strict';
import { computeMushafPosition } from './mushafPosition';

test('computeMushafPosition computes Juz 1 start and remaining pages accurately', () => {
  const pos = computeMushafPosition(1);
  assert.equal(pos.pageNumber, 1);
  assert.equal(pos.juzNumber, 1);
  assert.equal(pos.juzStartPage, 1);
  assert.equal(pos.juzEndPage, 21);
  assert.equal(pos.pageInJuz, 1);
  assert.equal(pos.pagesLeftInJuz, 20);
  assert.equal(pos.nextJuzStartPage, 22);
  assert.equal(pos.pagesUntilNextJuz, 21);
  assert.equal(pos.segments.length, 30);
  assert.equal(pos.segments[0]?.isCurrent, true);
  assert.equal(pos.segments[0]?.isPassed, false);
});

test('computeMushafPosition computes mid-Quran Juz 15 and clamps out-of-range pages', () => {
  const mid = computeMushafPosition(282);
  assert.equal(mid.juzNumber, 15);
  assert.equal(mid.percent, 47);
  assert.equal(mid.segments.filter((s) => s.isPassed).length, 14);
  assert.equal(mid.segments.filter((s) => s.isCurrent).length, 1);

  const end = computeMushafPosition(999);
  assert.equal(end.pageNumber, 604);
  assert.equal(end.juzNumber, 30);
  assert.equal(end.nextJuzStartPage, null);
  assert.equal(end.pagesLeftInJuz, 0);
  assert.equal(end.percent, 100);
});
