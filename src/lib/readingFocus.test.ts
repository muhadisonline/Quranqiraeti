import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatLineFocusProgress,
  resolveFocusedAyahKey,
  stepFocusedAyahKey,
} from './readingFocus';

const SAMPLE_KEYS = ['1:1', '1:2', '1:3', '1:4', '1:5'];

test('resolveFocusedAyahKey prioritizes playing -> manual -> highlighted -> first', () => {
  assert.equal(
    resolveFocusedAyahKey(SAMPLE_KEYS, {
      playingKey: '1:4',
      manualKey: '1:2',
      highlightedKey: '1:3',
    }),
    '1:4'
  );
  assert.equal(
    resolveFocusedAyahKey(SAMPLE_KEYS, {
      playingKey: null,
      manualKey: '1:2',
      highlightedKey: '1:3',
    }),
    '1:2'
  );
  assert.equal(
    resolveFocusedAyahKey(SAMPLE_KEYS, {
      playingKey: null,
      manualKey: '2:1',
      highlightedKey: '1:3',
    }),
    '1:3'
  );
  assert.equal(resolveFocusedAyahKey(SAMPLE_KEYS, {}), '1:1');
  assert.equal(resolveFocusedAyahKey([], {}), null);
});

test('stepFocusedAyahKey steps forward and backward clamped within bounds', () => {
  assert.equal(stepFocusedAyahKey(SAMPLE_KEYS, '1:1', -1), '1:1');
  assert.equal(stepFocusedAyahKey(SAMPLE_KEYS, '1:1', 1), '1:2');
  assert.equal(stepFocusedAyahKey(SAMPLE_KEYS, '1:5', 1), '1:5');
  assert.equal(stepFocusedAyahKey(SAMPLE_KEYS, '1:5', -1), '1:4');
  assert.equal(stepFocusedAyahKey(SAMPLE_KEYS, null, 1), '1:1');
});

test('formatLineFocusProgress returns accurate 1-based position label', () => {
  assert.deepEqual(formatLineFocusProgress(SAMPLE_KEYS, '1:3'), {
    index: 3,
    total: 5,
    label: '3 / 5',
  });
  assert.deepEqual(formatLineFocusProgress([], null), {
    index: 0,
    total: 0,
    label: '0 / 0',
  });
});
