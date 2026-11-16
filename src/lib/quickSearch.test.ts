import test from 'node:test';
import assert from 'node:assert/strict';
import { searchGlobalQuickIndex } from './quickSearch';
import { SEED_LONG_VIDEOS, SEED_SHORTS } from '../data/recitations';

test('searchGlobalQuickIndex returns curated shortcuts on empty query', () => {
  const items = searchGlobalQuickIndex('', []);
  assert.ok(items.length >= 5);
  assert.ok(items.some((i) => i.path === '/quran/sehife/1'));
  assert.ok(items.some((i) => i.path === '/dualar'));
  assert.ok(items.some((i) => i.path === '/muhaffiz'));
});

test('searchGlobalQuickIndex resolves Surah:Ayah, Page + Muhaffiz, and Juz shortcuts', () => {
  const ayahItems = searchGlobalQuickIndex('2:255', []);
  assert.equal(ayahItems[0].kind, 'ayah');
  assert.equal(ayahItems[0].path, '/quran/sure/2#ayah-255');

  const pageItems = searchGlobalQuickIndex('440', []);
  assert.ok(pageItems.some((i) => i.path === '/quran/sehife/440'));
  assert.ok(pageItems.some((i) => i.path === '/muhaffiz/440'));

  const juzItems = searchGlobalQuickIndex('cüz 30', []);
  assert.equal(juzItems[0].kind, 'juz');
  assert.equal(juzItems[0].path, '/quran/cuz/30');
});

test('searchGlobalQuickIndex matches Surahs (with Azerbaijani normalization), Duas, Videos, and appends full search', () => {
  const surahItems = searchGlobalQuickIndex('yasin', [...SEED_LONG_VIDEOS, ...SEED_SHORTS]);
  assert.ok(surahItems.some((i) => i.path === '/quran/sure/36'));
  assert.ok(surahItems.some((i) => i.kind === 'search' && i.path.startsWith('/quran?q=')));

  const duaItems = searchGlobalQuickIndex('səbir', []);
  assert.ok(duaItems.some((i) => i.kind === 'dua'));
  const last = duaItems[duaItems.length - 1];
  assert.equal(last.kind, 'search');
  assert.equal(last.path, `/quran?q=${encodeURIComponent('səbir')}`);
});
