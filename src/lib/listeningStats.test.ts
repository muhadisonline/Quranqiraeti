import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_LISTENING_STATS,
  formatListeningDurationAz,
  recordListeningTickState,
  sanitizeListeningStats,
  summarizeListeningStats,
} from './listeningStats';

test('recordListeningTickState accumulates duration, sessions, top surahs, and reciters', () => {
  const now = new Date('2026-11-20T12:00:00Z');
  let state = { ...EMPTY_LISTENING_STATS };
  state = recordListeningTickState(state, {
    surahNumber: 18,
    reciterLabel: 'Mişari Rəşid əl-Əfəsi',
    seconds: 125,
    isNewSession: true,
    dateKey: '2026-11-20',
  });
  state = recordListeningTickState(state, {
    surahNumber: 2,
    reciterLabel: 'Maher Al-Muaiqly',
    seconds: 3600,
    isNewSession: true,
    dateKey: '2026-11-19',
  });

  const summary = summarizeListeningStats(state, now);
  assert.equal(summary.totalSeconds, 3725);
  assert.equal(summary.sessionsCount, 2);
  assert.equal(summary.formattedTotal, '1 saat 2 dəq');
  assert.equal(summary.topSurahs[0].surahNumber, 2);
  assert.equal(summary.topSurahs[1].surahNumber, 18);
  assert.equal(summary.topReciters[0].reciterName, 'Maher Al-Muaiqly');
});

test('sanitizeListeningStats strips invalid surah numbers and negative seconds', () => {
  const clean = sanitizeListeningStats({
    totalSeconds: 100,
    bySurah: { 1: 60, 999: 40 },
    byReciter: { 'Al-Afasy': 60, '': 20 },
    byDay: { '2026-11-20': 60, bad: 10 },
  });
  assert.equal(clean.bySurah[1], 60);
  assert.equal(clean.bySurah[999], undefined);
  assert.equal(clean.byReciter[''], undefined);
  assert.equal(formatListeningDurationAz(45), '45 san');
});
