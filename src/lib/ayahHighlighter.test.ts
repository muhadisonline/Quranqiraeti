import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAyahHighlightMarkClass,
  sanitizeAyahHighlightMap,
  toggleAyahHighlightInMap,
} from './ayahHighlighter';

test('toggleAyahHighlightInMap sets, switches, and clears highlight colors per ayah', () => {
  let map = toggleAyahHighlightInMap({}, 2, 255, 'yellow');
  assert.equal(map['2:255'], 'yellow');

  map = toggleAyahHighlightInMap(map, 2, 255, 'green');
  assert.equal(map['2:255'], 'green');

  map = toggleAyahHighlightInMap(map, 2, 255, 'green');
  assert.equal(map['2:255'], undefined);
});

test('sanitizeAyahHighlightMap filters invalid keys and colors', () => {
  const clean = sanitizeAyahHighlightMap({
    '1:1': 'blue',
    '18:10': 'purple',
    invalid: 'yellow',
  });
  assert.deepEqual(clean, { '1:1': 'blue' });
  assert.ok(getAyahHighlightMarkClass('blue').includes('bg-sky-200'));
});
