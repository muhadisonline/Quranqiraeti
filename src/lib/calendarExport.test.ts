import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDailyReadingIcs } from './calendarExport';

test('buildDailyReadingIcs generates valid recurring daily RFC 5545 VCALENDAR payload', () => {
  const ics = buildDailyReadingIcs({
    hour: 7,
    minute: 30,
    durationMinutes: 25,
    goalPages: 4,
    startDate: new Date(2026, 10, 20, 10, 0, 0),
  });

  assert.ok(ics.includes('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.includes('RRULE:FREQ=DAILY\r\n'));
  assert.ok(ics.includes('DTSTART:20261120T073000\r\n'));
  assert.ok(ics.includes('DTEND:20261120T075500\r\n'));
  assert.ok(ics.includes('TRIGGER:-PT10M\r\n'));
  assert.ok(ics.includes('Gündəlik hədəf: 4 səhifə.'));
  assert.ok(ics.includes('END:VCALENDAR\r\n'));
});

test('buildDailyReadingIcs rolls DTEND over midnight cleanly when duration crosses 00:00', () => {
  const ics = buildDailyReadingIcs({
    hour: 23,
    minute: 50,
    durationMinutes: 20,
    startDate: new Date(2026, 10, 20, 10, 0, 0),
  });
  assert.ok(ics.includes('DTSTART:20261120T235000\r\n'));
  assert.ok(ics.includes('DTEND:20261121T001000\r\n'));
});
