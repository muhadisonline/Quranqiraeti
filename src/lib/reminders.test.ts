import test from 'node:test';
import assert from 'node:assert/strict';
import { getCityById } from './prayerTimes';
import {
  DEFAULT_WORSHIP_REMINDER_PREFS,
  getContextualReminders,
  shouldTriggerNotificationOnce,
} from './reminders';

test('getContextualReminders returns Friday Kahf reminder on Fridays', () => {
  const baku = getCityById('baku');
  // 2026-11-20 is a Friday (10:00 UTC = 14:00 Baku)
  const fridayDate = new Date('2026-11-20T10:00:00Z');
  const reminders = getContextualReminders(baku, fridayDate, DEFAULT_WORSHIP_REMINDER_PREFS);
  assert.ok(reminders.some((r) => r.category === 'friday' && r.ctaPath === '/quran/sure/18'));

  // 2026-11-18 is a Wednesday
  const wednesdayDate = new Date('2026-11-18T10:00:00Z');
  const wedReminders = getContextualReminders(baku, wednesdayDate, DEFAULT_WORSHIP_REMINDER_PREFS);
  assert.equal(wedReminders.some((r) => r.category === 'friday'), false);
});

test('getContextualReminders detects morning/night azkar and pre-prayer window', () => {
  const baku = getCityById('baku');
  // 04:00 UTC = 08:00 Baku (between Fajr and Dhuhr -> morning azkar)
  const morningDate = new Date('2026-11-18T04:00:00Z');
  const morningList = getContextualReminders(baku, morningDate, DEFAULT_WORSHIP_REMINDER_PREFS);
  assert.ok(morningList.some((r) => r.id === 'morning-azkar'));

  // 19:00 UTC = 23:00 Baku (night -> Mulk surah)
  const nightDate = new Date('2026-11-18T19:00:00Z');
  const nightList = getContextualReminders(baku, nightDate, DEFAULT_WORSHIP_REMINDER_PREFS);
  assert.ok(nightList.some((r) => r.id === 'night-mulk' && r.ctaPath === '/quran/sure/67'));
});

test('shouldTriggerNotificationOnce deduplicates by eventKey + dateKey', () => {
  const sent = { 'friday-kahf': '2026-11-20' };
  assert.equal(shouldTriggerNotificationOnce(sent, 'friday-kahf', '2026-11-20'), false);
  assert.equal(shouldTriggerNotificationOnce(sent, 'friday-kahf', '2026-11-27'), true);
});
