import test from 'node:test';
import assert from 'node:assert/strict';
import { transliterateArabicToAz } from './transliteration';

test('transliterates Bismillah and Al-Fatihah accurately into Azerbaijani Latin', () => {
  const bismillah = transliterateArabicToAz('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ');
  assert.equal(bismillah, 'Bismi Allahi ər-rəhməni ər-rəhimi');

  const alhamdu = transliterateArabicToAz('ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ');
  assert.equal(alhamdu, 'Əl-həmdu lilləhi rəbbi əl-aləminə');

  const iyyaka = transliterateArabicToAz('إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ');
  assert.equal(iyyaka, "İyyəkə nə'budu və-iyyəkə nəstəinu");

  const ihdina = transliterateArabicToAz('ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ');
  assert.equal(ihdina, 'İhdinə əs-sirata əl-mustəqimə');

  const sirata = transliterateArabicToAz(
    'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ'
  );
  assert.equal(
    sirata,
    "Sirata əlləzinə ən'amtə aləyhim ğayri əl-məğdubi aləyhim vələ əd-dallinə"
  );
});

test('handles sun-letter assimilation, shadda, and alif maqsura with harakat cleanly', () => {
  assert.equal(transliterateArabicToAz('وَٱلشَّمْسِ'), 'Vəş-şəmsi');
  assert.equal(transliterateArabicToAz('رَبِّ ٱلنَّاسِ'), 'Rəbbi ən-nəsi');
  assert.equal(transliterateArabicToAz('ٱلْحَىُّ ٱلْقَيُّومُ'), 'Əl-həyyu əl-qayyumu');
  assert.equal(transliterateArabicToAz('وَلَمْ يَكُن لَّهُۥ'), 'Vələm yəkun ləhu');
});

test('handles tanwin and trailing alif cleanly in Surah Ikhlas', () => {
  const ikhlas1 = transliterateArabicToAz('قُلْ هُوَ ٱللَّهُ أَحَدٌ');
  assert.equal(ikhlas1, 'Qul huvə Allahu əhədun');

  assert.equal(transliterateArabicToAz('عَلِيمًا'), 'Alimən');
});

test('handles empty strings and Quranic waqf signs gracefully', () => {
  assert.equal(transliterateArabicToAz(''), '');
  assert.equal(transliterateArabicToAz('   '), '');
  const withWaqf = transliterateArabicToAz('ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَ ۛ فِيهِ ۛ');
  assert.ok(withWaqf.includes('əl-kitəbu'));
  assert.ok(!withWaqf.includes('ۛ'));
});
