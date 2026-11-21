import test from 'node:test';
import assert from 'node:assert/strict';
import { formatVerseWithTemplate } from './verseCopyTemplates';

const SAMPLE = {
  surahName: 'Bəqərə',
  surahNumber: 2,
  ayahNumber: 255,
  arabicText: 'ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ',
  translation: 'Allah – Ondan başqa ibadətə layiq olan məbud yoxdur, əbədi Yaşayandır.',
  pageNumber: 42,
};

test('formatVerseWithTemplate formats WhatsApp, Telegram, Classic, and Arabic-only templates', () => {
  const wa = formatVerseWithTemplate('whatsapp', SAMPLE);
  assert.ok(wa.includes('*📖 Bəqərə surəsi (2:255 · Səh. 42)*'));
  assert.ok(wa.includes('_"Allah'));

  const tg = formatVerseWithTemplate('telegram', SAMPLE);
  assert.ok(tg.includes('🕌 **Bəqərə surəsi · 2:255**'));
  assert.ok(tg.includes('#QuranQiraeti'));

  const ar = formatVerseWithTemplate('arabic-only', SAMPLE);
  assert.ok(ar.includes('﴿255﴾'));
  assert.ok(!ar.includes('əbədi Yaşayandır'));

  const classic = formatVerseWithTemplate('classic', SAMPLE);
  assert.ok(classic.includes('Əlixan Musayev tərcüməsi'));
});
