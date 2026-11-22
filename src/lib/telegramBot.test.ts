import assert from 'node:assert/strict';
import test from 'node:test';
import { QURAN_DUAS } from '../data/quranDuas';
import { SEED_LONG_VIDEOS, SEED_SHORTS } from '../data/recitations';
import {
  TELEGRAM_BOT_COMMANDS,
  buildInlineQueryResults,
  escapeTelegramHtml,
  findCityForTelegramQuery,
  findSurahForTelegramQuery,
  formatAlphabetMessage,
  formatDuaMessage,
  formatHijriCalendarMessage,
  formatMushafPageMessage,
  formatPrayerTimesMessage,
  formatStartMessage,
  formatSurahMessage,
  formatVerseMessage,
  formatZikrMessage,
  getTelegramAyahAudioUrl,
  normalizeAzSearchText,
  parseTelegramCommand,
  resolveTelegramStartParamPath,
} from './telegramBot';
import { getSurahByNumber } from './quran';

test('parseTelegramCommand parses commands with bot mention and Azerbaijani args', () => {
  assert.deepEqual(parseTelegramCommand('/start'), { command: 'start', args: '' });
  assert.deepEqual(parseTelegramCommand('/sure@QuranQiraetiBot Yasin'), {
    command: 'sure',
    args: 'Yasin',
  });
  assert.deepEqual(parseTelegramCommand('/namaz Bakı'), {
    command: 'namaz',
    args: 'Bakı',
  });
  assert.equal(parseTelegramCommand('Adi mesaj'), null);
  assert.ok(TELEGRAM_BOT_COMMANDS.length >= 10);
});

test('findSurahForTelegramQuery and findCityForTelegramQuery resolve Azerbaijani diacritics', () => {
  assert.equal(normalizeAzSearchText('Şəki'), 'seki');
  assert.equal(findSurahForTelegramQuery('36')?.number, 36);
  assert.equal(findSurahForTelegramQuery('yas')?.number, 36);
  assert.equal(findSurahForTelegramQuery('Beqere')?.number, 2);
  assert.equal(findSurahForTelegramQuery('Fatiha')?.number, 1);

  assert.equal(findCityForTelegramQuery('Bakı').id, 'baku');
  assert.equal(findCityForTelegramQuery('Gəncə').id, 'ganja');
  assert.equal(findCityForTelegramQuery('Naxçıvan').id, 'nakhchivan');
  assert.equal(findCityForTelegramQuery('Şuşa').id, 'shusha');
});

test('escapeTelegramHtml prevents HTML injection in bot messages', () => {
  const escaped = escapeTelegramHtml('<script>alert("x") & test</script>');
  assert.ok(!escaped.includes('<script>'));
  assert.ok(escaped.includes('&lt;script&gt;'));
  assert.ok(escaped.includes('&amp;'));
});

test('formatters generate Mini App keyboards, audio callbacks, Mushaf nav, Zikr, Hijri, and Alphabet replies', () => {
  const origin = 'https://quranqiraeti.vercel.app';
  const start = formatStartMessage(origin);
  assert.ok(start.text.includes('Quran Qiraeti'));
  assert.equal(
    start.reply_markup?.inline_keyboard[0][0].web_app?.url,
    'https://quranqiraeti.vercel.app/quran'
  );

  const yasin = getSurahByNumber(36)!;
  const surahMsg = formatSurahMessage(origin, yasin, [
    { ayahNumber: 1, arabicText: 'يس', translation: 'Ya, Sin!' },
  ]);
  assert.ok(surahMsg.text.includes('Yasin'));
  assert.ok(surahMsg.text.includes('Ya, Sin!'));
  assert.equal(
    surahMsg.reply_markup?.inline_keyboard[0][0].web_app?.url,
    'https://quranqiraeti.vercel.app/quran/sure/36'
  );

  const verseMsg = formatVerseMessage(origin, {
    surahNumber: 2,
    surahName: 'Bəqərə',
    ayahNumber: 255,
    arabicText: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ',
    translation: 'Allah — Ondan başqa ibadətə layiq məbud yoxdur.',
  });
  assert.ok(verseMsg.text.includes('2:255'));
  assert.equal(verseMsg.reply_markup?.inline_keyboard[0][0].callback_data, 'audio:2:255');
  assert.equal(
    getTelegramAyahAudioUrl(2, 255),
    'https://everyayah.com/data/Alafasy_128kbps/002255.mp3'
  );

  const mushafMsg = formatMushafPageMessage(origin, 42, 'Bəqərə (253–256)');
  assert.ok(mushafMsg.text.includes('42-ci səhifə'));
  assert.equal(mushafMsg.reply_markup?.inline_keyboard[1][0].callback_data, 'mushaf:41');
  assert.equal(mushafMsg.reply_markup?.inline_keyboard[1][1].callback_data, 'mushaf:43');

  const baku = findCityForTelegramQuery('Bakı');
  const prayerMsg = formatPrayerTimesMessage(origin, baku, new Date('2026-11-22T09:00:00Z'));
  assert.ok(prayerMsg.text.includes('Bakı'));
  assert.ok(prayerMsg.text.includes('Zöhr'));
  assert.ok(prayerMsg.text.includes('Qiblə bucağı'));

  const duaMsg = formatDuaMessage(origin, QURAN_DUAS[0]);
  assert.ok(duaMsg.text.includes(QURAN_DUAS[0].title));

  const zikrMsg = formatZikrMessage(origin, 'seher', 0);
  assert.ok(zikrMsg.text.includes('Səhər zikrləri'));

  const hijriMsg = formatHijriCalendarMessage(origin, new Date('2026-11-22T09:00:00Z'));
  assert.ok(hijriMsg.text.includes('Ramazan'));

  const alphaMsg = formatAlphabetMessage(origin);
  assert.equal(
    alphaMsg.reply_markup?.inline_keyboard[0][0].web_app?.url,
    'https://quranqiraeti.vercel.app/elifba'
  );
});

test('buildInlineQueryResults and resolveTelegramStartParamPath handle search and deep links', () => {
  const results = buildInlineQueryResults(
    'https://quranqiraeti.vercel.app',
    'yasin',
    [...SEED_LONG_VIDEOS, ...SEED_SHORTS],
    new Date('2026-11-22T09:00:00Z')
  );
  assert.ok(results.length >= 1);
  assert.ok(results.some((r) => r.id === 'surah-36'));

  assert.equal(resolveTelegramStartParamPath('sure_36'), '/quran/sure/36');
  assert.equal(resolveTelegramStartParamPath('sehife_42'), '/quran/sehife/42');
  assert.equal(resolveTelegramStartParamPath('muhaffiz_18'), '/muhaffiz/18');
  assert.equal(resolveTelegramStartParamPath('namaz'), '/namaz-vaxtlari');
  assert.equal(resolveTelegramStartParamPath('invalid_param'), '/');
});
