import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AZERBAIJAN_CITIES,
  PRAYER_COUNTRIES,
  WORLD_PRAYER_CITIES,
  calculatePrayerTimesForDate,
  calculateWeeklyPrayerSchedule,
  computeQiblaDirection,
  createCustomCoordinateLocation,
  findNearestPrayerCity,
  getCitiesByCountryId,
  getCityById,
  getNextPrayerCountdown,
} from './prayerTimes';

test('calculates chronological Umm al-Qura prayer times for Baku (Isha = Maghrib + 90m)', () => {
  const baku = getCityById('baku');
  const schedule = calculatePrayerTimesForDate(baku, 2026, 11, 17);

  assert.equal(schedule.times.length, 6);
  for (let i = 1; i < schedule.times.length; i++) {
    assert.ok(
      schedule.times[i].minutesFromMidnight > schedule.times[i - 1].minutesFromMidnight,
      `${schedule.times[i].key} must follow ${schedule.times[i - 1].key}`
    );
  }

  const fajr = schedule.times[0].minutesFromMidnight;
  const sunrise = schedule.times[1].minutesFromMidnight;
  const dhuhr = schedule.times[2].minutesFromMidnight;
  const maghrib = schedule.times[4].minutesFromMidnight;
  const isha = schedule.times[5].minutesFromMidnight;

  assert.ok(fajr >= 5 * 60 + 20 && fajr <= 6 * 60 + 20, `Unexpected Fajr: ${schedule.times[0].formattedTime}`);
  assert.ok(sunrise >= 7 * 60 && sunrise <= 7 * 60 + 50, `Unexpected Sunrise: ${schedule.times[1].formattedTime}`);
  assert.ok(dhuhr >= 12 * 60 + 10 && dhuhr <= 12 * 60 + 45, `Unexpected Dhuhr: ${schedule.times[2].formattedTime}`);
  assert.ok(maghrib >= 17 * 60 && maghrib <= 17 * 60 + 50, `Unexpected Maghrib: ${schedule.times[4].formattedTime}`);
  assert.equal(isha - maghrib, 90, 'Umm al-Qura non-Ramadan Isha must be Maghrib + 90 min');
});

test('Umm al-Qura adds 120 minutes for Isha during Ramadan', () => {
  const makkah = getCityById('makkah');
  // 2026-03-01 falls in Ramadan 1447
  const ramadanSchedule = calculatePrayerTimesForDate(makkah, 2026, 3, 1);
  assert.equal(ramadanSchedule.isRamadan, true);
  assert.equal(
    ramadanSchedule.times[5].minutesFromMidnight - ramadanSchedule.times[4].minutesFromMidnight,
    120
  );
});

test('supports international cities across timezones and high latitudes safely', () => {
  assert.ok(PRAYER_COUNTRIES.length >= 15);
  assert.ok(WORLD_PRAYER_CITIES.length >= 45);
  assert.equal(getCitiesByCountryId('az').length, AZERBAIJAN_CITIES.length);

  const londonSummer = calculatePrayerTimesForDate(getCityById('london'), 2026, 6, 21);
  assert.equal(londonSummer.utcOffsetHours, 1); // BST UTC+1
  for (let i = 1; i < londonSummer.times.length; i++) {
    assert.ok(
      londonSummer.times[i].minutesFromMidnight > londonSummer.times[i - 1].minutesFromMidnight,
      `London summer ${londonSummer.times[i].key} must be valid and chronological`
    );
  }

  const nyWinter = calculatePrayerTimesForDate(getCityById('newyork'), 2026, 11, 18);
  assert.equal(nyWinter.utcOffsetHours, -5); // EST UTC-5
  assert.ok(nyWinter.times[2].minutesFromMidnight >= 11 * 60 + 30 && nyWinter.times[2].minutesFromMidnight <= 12 * 60 + 15);
});

test('nearest city lookup, custom map coordinate location, and Qibla direction work accurately', () => {
  const nearIstanbul = findNearestPrayerCity(41.05, 29.02);
  assert.equal(nearIstanbul.city.id, 'istanbul');
  assert.ok(nearIstanbul.distanceKm < 15);

  const customGanja = createCustomCoordinateLocation(40.69, 46.37);
  assert.equal(customGanja.isCustom, true);
  assert.equal(customGanja.timeZone, 'Asia/Baku');
  assert.equal(customGanja.countryId, 'az');

  const bakuQibla = computeQiblaDirection(40.4093, 49.8671);
  // From Baku, Kaaba is roughly South-Southwest (~207 deg)
  assert.ok(bakuQibla.bearingDegrees >= 195 && bakuQibla.bearingDegrees <= 220);
  assert.ok(bakuQibla.distanceKm >= 2200 && bakuQibla.distanceKm <= 2500);
});

test('next prayer countdown wraps cleanly across midnight to tomorrow Fajr', () => {
  const baku = getCityById('baku');
  const lateNightUtc = new Date('2026-11-17T19:30:00Z');
  const countdown = getNextPrayerCountdown(baku, lateNightUtc);
  assert.equal(countdown.currentPrayerKey, 'isha');
  assert.equal(countdown.nextPrayer.key, 'fajr');
  assert.equal(countdown.isTomorrow, true);
  assert.ok(countdown.secondsRemaining > 5 * 3600 && countdown.secondsRemaining < 8 * 3600);
});

test('weekly schedule returns 7 consecutive days for any selected location', () => {
  const istanbul = getCityById('istanbul');
  const week = calculateWeeklyPrayerSchedule(istanbul, new Date('2026-11-17T08:00:00Z'), 7);
  assert.equal(week.length, 7);
  assert.equal(week[0].dateKey, '2026-11-17');
  assert.equal(week[6].dateKey, '2026-11-23');
});
