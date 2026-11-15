import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONNECTED_PAGES,
  PageTelemetryEventRecord,
  aggregateTelemetry,
  normalizeReferrerType,
  resolvePageTelemetryMeta,
} from './analytics';

test('CONNECTED_PAGES covers all 10 public application routes and resolvePageTelemetryMeta maps paths cleanly', () => {
  assert.equal(CONNECTED_PAGES.length, 10);
  assert.equal(resolvePageTelemetryMeta('/')?.pageKey, 'home');
  assert.equal(resolvePageTelemetryMeta('/shorts')?.pageKey, 'shorts');
  assert.equal(resolvePageTelemetryMeta('/quran')?.pageKey, 'quran');
  assert.equal(resolvePageTelemetryMeta('/quran/sure/36')?.pageKey, 'surah');
  assert.equal(resolvePageTelemetryMeta('/quran/sehife/604')?.pageKey, 'mushaf_page');
  assert.equal(resolvePageTelemetryMeta('/muhaffiz')?.pageKey, 'muhaffiz');
  assert.equal(resolvePageTelemetryMeta('/muhaffiz/2')?.pageKey, 'muhaffiz');
  assert.equal(resolvePageTelemetryMeta('/video/h4f9p5h_X6Y')?.pageKey, 'video');
  assert.equal(resolvePageTelemetryMeta('/gunun-ayesi')?.pageKey, 'verse_of_day');
  assert.equal(resolvePageTelemetryMeta('/haqqinda')?.pageKey, 'about');
  assert.equal(resolvePageTelemetryMeta('/istek')?.pageKey, 'request');
  assert.equal(resolvePageTelemetryMeta('/admin'), null);
});

test('normalizeReferrerType classifies direct, internal, search/AI, YouTube, and external links', () => {
  assert.equal(normalizeReferrerType('', 'https://quranqiraeti.vercel.app'), 'direct');
  assert.equal(
    normalizeReferrerType('https://quranqiraeti.vercel.app/shorts', 'https://quranqiraeti.vercel.app'),
    'internal'
  );
  assert.equal(
    normalizeReferrerType('https://www.youtube.com/@quranqiraeti', 'https://quranqiraeti.vercel.app'),
    'youtube'
  );
  assert.equal(
    normalizeReferrerType('https://www.google.com/search?q=yasin', 'https://quranqiraeti.vercel.app'),
    'search'
  );
  assert.equal(
    normalizeReferrerType('https://perplexity.ai/search', 'https://quranqiraeti.vercel.app'),
    'search'
  );
  assert.equal(
    normalizeReferrerType('https://t.me/channel', 'https://quranqiraeti.vercel.app'),
    'other'
  );
});

test('aggregateTelemetry computes hourly, daily, and weekly buckets plus per-page hourly/daily/weekly counts', () => {
  const nowMs = Date.UTC(2026, 10, 15, 10, 30, 0);
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;

  const events: PageTelemetryEventRecord[] = [
    {
      eventId: 'ev-1',
      pageKey: 'home',
      pageLabel: 'Uzun Videolar (Ana səhifə)',
      path: '/',
      status: 'ok',
      httpStatus: 200,
      loadTimeMs: 240,
      sessionId: 'sess-a',
      referrerType: 'youtube',
      createdAtMs: nowMs - 15 * 60 * 1000, // within last hour
    },
    {
      eventId: 'ev-2',
      pageKey: 'quran',
      pageLabel: 'Tam Qurani-Kərim',
      path: '/quran',
      status: 'slow',
      httpStatus: 200,
      loadTimeMs: 2800,
      sessionId: 'sess-b',
      referrerType: 'search',
      createdAtMs: nowMs - 4 * hourMs, // within last 24h, outside last hour
    },
    {
      eventId: 'ev-3',
      pageKey: 'surah',
      pageLabel: 'Surə Oxu Səhifəsi',
      path: '/quran/sure/36',
      status: 'error',
      httpStatus: 502,
      loadTimeMs: 4100,
      sessionId: 'sess-b',
      referrerType: 'internal',
      createdAtMs: nowMs - 3 * dayMs, // within last week, outside last 24h
    },
  ];

  const hourly = aggregateTelemetry(events, 'hourly', nowMs);
  assert.equal(hourly.buckets.length, 24);
  assert.equal(hourly.totalVisits, 2);
  assert.equal(hourly.uniqueSessions, 2);

  const homeRow = hourly.pageRows.find((r) => r.pageKey === 'home');
  assert.ok(homeRow);
  assert.equal(homeRow.hourlyVisits, 1);
  assert.equal(homeRow.dailyVisits, 1);
  assert.equal(homeRow.weeklyVisits, 1);
  assert.equal(homeRow.operationalStatus, 'Aktiv');

  const surahRow = hourly.pageRows.find((r) => r.pageKey === 'surah');
  assert.ok(surahRow);
  assert.equal(surahRow.hourlyVisits, 0);
  assert.equal(surahRow.dailyVisits, 0);
  assert.equal(surahRow.weeklyVisits, 1);
  assert.equal(surahRow.operationalStatus, 'Xətalı');

  const daily = aggregateTelemetry(events, 'daily', nowMs);
  assert.equal(daily.buckets.length, 14);
  assert.equal(daily.totalVisits, 3);
  assert.equal(daily.errorCount, 1);

  const weekly = aggregateTelemetry(events, 'weekly', nowMs);
  assert.equal(weekly.buckets.length, 8);
  assert.equal(weekly.totalVisits, 3);
  assert.equal(weekly.uniqueSessions, 2);
});
