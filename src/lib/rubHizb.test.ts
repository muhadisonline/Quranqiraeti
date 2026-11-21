import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RUB_HIZB_ENTRIES,
  filterRubHizbEntries,
  getActiveRubForPage,
  getRubsOnPage,
} from './rubHizb';

test('RUB_HIZB_ENTRIES contains all 240 Madinah Mushaf quarters with valid Juz and Hizb mapping', () => {
  assert.equal(RUB_HIZB_ENTRIES.length, 240);
  assert.equal(RUB_HIZB_ENTRIES[0].rub, 1);
  assert.equal(RUB_HIZB_ENTRIES[0].juz, 1);
  assert.equal(RUB_HIZB_ENTRIES[0].hizb, 1);
  assert.equal(RUB_HIZB_ENTRIES[0].surahNumber, 1);
  assert.equal(RUB_HIZB_ENTRIES[0].pageNumber, 1);

  assert.equal(RUB_HIZB_ENTRIES[239].rub, 240);
  assert.equal(RUB_HIZB_ENTRIES[239].juz, 30);
  assert.equal(RUB_HIZB_ENTRIES[239].hizb, 60);
  assert.equal(RUB_HIZB_ENTRIES[239].quarterInHizb, 4);
  assert.equal(RUB_HIZB_ENTRIES[239].pageNumber, 599);
});

test('filterRubHizbEntries filters by Juz and Azerbaijani surah query', () => {
  const juz30 = filterRubHizbEntries(RUB_HIZB_ENTRIES, { juz: 30 });
  assert.equal(juz30.length, 8);
  assert.equal(juz30[0].rub, 233);

  const kahf = filterRubHizbEntries(RUB_HIZB_ENTRIES, { query: 'kəhf' });
  assert.ok(kahf.some((r) => r.surahNumber === 18));

  const rub120 = filterRubHizbEntries(RUB_HIZB_ENTRIES, { query: '120' });
  assert.ok(rub120.some((r) => r.rub === 120));
});

test('getRubsOnPage and getActiveRubForPage resolve Mushaf page quarters accurately', () => {
  const page1Rubs = getRubsOnPage(1);
  assert.equal(page1Rubs.length, 1);
  assert.equal(page1Rubs[0].rub, 1);

  const activePage3 = getActiveRubForPage(3);
  assert.equal(activePage3.rub, 1);

  const activePage5 = getActiveRubForPage(5);
  assert.equal(activePage5.rub, 2);
});
