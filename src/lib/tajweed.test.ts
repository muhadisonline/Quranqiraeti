import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenizeTajweedSegments } from './tajweed';

test('tokenizeTajweedSegments preserves exact character round-trip across real Quranic ayahs', () => {
  const samples = [
    'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    'قُلْ هُوَ ٱللَّهُ أَحَدٌ ۝ ٱللَّهُ ٱلصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ',
    'إِنَّا أَعْطَيْنَٰكَ ٱلْكَوْثَرَ',
    'مِن شَرِّ مَا خَلَقَ',
    'مِن رَّبِّهِمْ',
  ];

  for (const sample of samples) {
    const segments = tokenizeTajweedSegments(sample);
    assert.equal(segments.map((s) => s.text).join(''), sample);
  }
});

test('tokenizeTajweedSegments detects Qalqalah, Ghunnah, Madd, Ikhfa, and Idgham', () => {
  // Qalqalah on دْ in يَلِدْ
  const ikhlas3 = tokenizeTajweedSegments('لَمْ يَلِدْ وَلَمْ يُولَدْ');
  assert.ok(ikhlas3.some((s) => s.rule === 'qalqalah' && s.text.includes('د')));

  // Ghunnah on نّ in إِنَّا and Madd on نَٰكَ / أَعْطَيْنَٰكَ
  const kawthar = tokenizeTajweedSegments('إِنَّآ أَعْطَيْنَٰكَ ٱلْكَوْثَرَ');
  assert.ok(kawthar.some((s) => s.rule === 'ghunnah'));
  assert.ok(kawthar.some((s) => s.rule === 'madd'));

  // Ikhfa on مِنْ شَرِّ (noon before sheen)
  const falaq2 = tokenizeTajweedSegments('مِن شَرِّ مَا خَلَقَ');
  assert.ok(falaq2.some((s) => s.rule === 'ikhfa'));

  // Idgham on مِنْ رَبِّهِمْ (noon before raa)
  const idghamSample = tokenizeTajweedSegments('مِن رَّبِّهِمْ');
  assert.ok(idghamSample.some((s) => s.rule === 'idgham'));
});
