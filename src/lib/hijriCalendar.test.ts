import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HIJRI_MONTHS_LIST_AZ,
  getUpcomingBlessedDays,
  gregorianDateKeyToHijri,
  hijriToGregorianDate,
} from './hijriCalendar';

test('HIJRI_MONTHS_LIST_AZ contains all 12 months', () => {
  assert.equal(HIJRI_MONTHS_LIST_AZ.length, 12);
  assert.equal(HIJRI_MONTHS_LIST_AZ[0], 'Məhərrəm');
  assert.equal(HIJRI_MONTHS_LIST_AZ[8], 'Ramazan');
  assert.equal(HIJRI_MONTHS_LIST_AZ[11], 'Zülhiccə');
});

test('gregorianDateKeyToHijri validates input and computes Umm al-Qura Hijri date', () => {
  assert.equal(gregorianDateKeyToHijri('invalid-date'), null);
  assert.equal(gregorianDateKeyToHijri('2026-02-30'), null);

  const conv = gregorianDateKeyToHijri('2026-03-20');
  assert.ok(conv);
  assert.equal(conv.dateKey, '2026-03-20');
  assert.ok(conv.hijriYear >= 1447);
  assert.ok(conv.hijriMonth >= 1 && conv.hijriMonth <= 12);
  assert.ok(conv.hijriDay >= 1 && conv.hijriDay <= 30);
});

test('hijriToGregorianDate achieves exact round-trip parity across multiple years', () => {
  const sampleGregorianDates = [
    '2024-03-11',
    '2025-03-01',
    '2026-06-16',
    '2027-02-08',
    '2028-01-01',
  ];

  for (const dateKey of sampleGregorianDates) {
    const h = gregorianDateKeyToHijri(dateKey);
    assert.ok(h, `Expected valid Hijri conversion for ${dateKey}`);
    const back = hijriToGregorianDate(h.hijriYear, h.hijriMonth, h.hijriDay);
    assert.equal(back.dateKey, dateKey, `Round-trip mismatch for ${dateKey}`);
    assert.equal(back.exactDayMatched, true);
  }
});

test('hijriToGregorianDate handles 29-day Hijri months safely when day=30 is requested', () => {
  // Even if day 30 doesn't exist in that Umm al-Qura month, it falls back cleanly to day 29
  const res = hijriToGregorianDate(1447, 1, 30);
  assert.ok(res.dateKey.match(/^\d{4}-\d{2}-\d{2}$/));
  assert.equal(res.hijriMonth, 1);
  assert.ok(res.hijriDay === 29 || res.hijriDay === 30);
});

test('getUpcomingBlessedDays returns chronological upcoming Islamic dates with non-negative countdowns', () => {
  const now = new Date('2026-06-01T10:00:00Z');
  const list = getUpcomingBlessedDays(now, 7);
  assert.equal(list.length, 7);
  for (let i = 0; i < list.length; i++) {
    assert.ok(list[i].daysRemaining >= 0);
    assert.ok(list[i].hijriLabel.length > 0);
    assert.ok(list[i].gregorianLabel.length > 0);
    if (i > 0) {
      assert.ok(list[i].daysRemaining >= list[i - 1].daysRemaining);
    }
  }
});
