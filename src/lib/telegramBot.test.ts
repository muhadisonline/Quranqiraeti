import assert from 'node:assert/strict';
import test from 'node:test';
import { SEED_LONG_VIDEOS, SEED_SHORTS } from '../data/recitations';
import {
  CURATED_TELEGRAM_VERSES,
  TELEGRAM_BOT_COMMANDS,
  buildInlineQueryResults,
  buildTelegramEzberQuestion,
  escapeTelegramHtml,
  findCityForTelegramQuery,
  findSurahForTelegramQuery,
  formatAlphabetMessage,
  formatAudioSelectorMessage,
  formatHijriCalendarMessage,
  formatMushafPageMessage,
  formatPrayerTimesMessage,
  formatStartMessage,
  formatSurahMessage,
  formatTelegramEzberAnswerMessage,
  formatTelegramEzberQuizMessage,
  formatVerseMessage,
  formatZikrMessage,
  getTelegramAyahAudioUrl,
  getTelegramSurahAudioUrl,
  normalizeAzSearchText,
  parseAudioQueryArgs,
  parseEzberCallbackData,
  parseTelegramCommand,
  resolveTelegramStartParamPath,
} from './telegramBot';
import { MUHAFFIZ_RECITERS, getFullSurahAudioUrl, resolveMuhaffizReciter } from './muhaffiz';
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
  assert.equal(verseMsg.reply_markup?.inline_keyboard[0][0].callback_data, 'amenu:2:255:afasy');
  assert.equal(
    getTelegramAyahAudioUrl(2, 255),
    'https://everyayah.com/data/Alafasy_128kbps/002255.mp3'
  );
  assert.equal(
    getTelegramAyahAudioUrl(2, 255, 'maher'),
    'https://everyayah.com/data/MaherAlMuaiqly128kbps/002255.mp3'
  );
  assert.equal(
    getTelegramSurahAudioUrl(36, 'yasser'),
    'https://cdn.mp3quran.net/audio/yasser-dosari/r1/036.mp3'
  );
  assert.equal(
    getFullSurahAudioUrl(1, 'Abdul_Basit_Murattal_192kbps'),
    'https://cdn.mp3quran.net/audio/abdulbasit-abdulsamad/r3/001.mp3'
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

  assert.equal(TELEGRAM_BOT_COMMANDS.some((c) => c.command === 'dua'), false);
  assert.equal(
    start.reply_markup?.inline_keyboard.flat().some((b) => b.callback_data === 'dua:next'),
    false
  );
  assert.equal(
    verseMsg.reply_markup?.inline_keyboard.flat().some((b) => b.callback_data === 'dua:next'),
    false
  );

  const zikrMsg = formatZikrMessage(origin, 'seher', 0);
  assert.ok(zikrMsg.text.includes('Səhər zikrləri'));
  assert.equal(zikrMsg.text.includes('📿'), false);
  assert.equal(start.reply_markup?.inline_keyboard.flat().some((b) => b.text.includes('📿')), false);

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

test('audio selector offers Ayah, Full Surah, and all 6 Qarilər plus /ses parser', () => {
  assert.equal(MUHAFFIZ_RECITERS.length, 6);
  assert.equal(resolveMuhaffizReciter('Mahir').id, 'MaherAlMuaiqly128kbps');
  assert.equal(resolveMuhaffizReciter('Dövsəri').id, 'Yasser_Ad-Dussary_128kbps');

  const selector = formatAudioSelectorMessage('https://quranqiraeti.vercel.app', {
    surahNumber: 36,
    ayahNumber: 1,
    reciterInput: 'maher',
    showPresets: true,
  });
  const rows = selector.reply_markup?.inline_keyboard ?? [];
  assert.equal(rows[0][0].callback_data, 'aplay:ayah:36:1:maher');
  assert.equal(rows[0][1].callback_data, 'aplay:surah:36:1:maher');
  assert.equal(rows[1].length + rows[2].length, 6);
  assert.ok(rows[1].some((btn) => btn.text.startsWith('✓ ') && btn.callback_data === 'asrc:36:1:maher'));

  const parsedYasinMaher = parseAudioQueryArgs('Yasin maher');
  assert.equal(parsedYasinMaher.surahNumber, 36);
  assert.equal(parsedYasinMaher.ayahNumber, 1);
  assert.equal(parsedYasinMaher.reciterId, 'MaherAlMuaiqly128kbps');
  assert.equal(parsedYasinMaher.hasExplicitTarget, true);

  const parsedBaqaraAyah = parseAudioQueryArgs('Bəqərə 255 yasir');
  assert.equal(parsedBaqaraAyah.surahNumber, 2);
  assert.equal(parsedBaqaraAyah.ayahNumber, 255);
  assert.equal(parsedBaqaraAyah.reciterId, 'Yasser_Ad-Dussary_128kbps');

  const parsedRef = parseAudioQueryArgs('2:255 basit');
  assert.equal(parsedRef.surahNumber, 2);
  assert.equal(parsedRef.ayahNumber, 255);
  assert.equal(parsedRef.reciterId, 'Abdul_Basit_Murattal_192kbps');
});

test('/ezber builds deterministic 1-ayah hidden-word quiz within Telegram 64-byte callback limits', () => {
  assert.ok(TELEGRAM_BOT_COMMANDS.some((c) => c.command === 'ezber'));

  const question = buildTelegramEzberQuestion(CURATED_TELEGRAM_VERSES[0], 17);
  assert.equal(question.options.length, 3);
  assert.equal(question.options[question.correctIndex], question.targetWord);
  assert.ok(question.maskedArabic.includes('______'));

  const quizMsg = formatTelegramEzberQuizMessage('https://quranqiraeti.vercel.app', question);
  assert.ok(quizMsg.text.includes('2:255'));
  const optionRow = quizMsg.reply_markup?.inline_keyboard[0] ?? [];
  assert.equal(optionRow.length, 3);
  for (const btn of optionRow) {
    assert.ok(btn.callback_data);
    assert.ok(Buffer.byteLength(btn.callback_data, 'utf8') < 64);
    const parsed = parseEzberCallbackData(btn.callback_data);
    assert.equal(parsed?.type, 'answer');
  }

  const rebuilt = buildTelegramEzberQuestion(CURATED_TELEGRAM_VERSES[0], 17);
  assert.equal(rebuilt.correctIndex, question.correctIndex);

  const rightReply = formatTelegramEzberAnswerMessage(
    'https://quranqiraeti.vercel.app',
    rebuilt,
    rebuilt.correctIndex
  );
  assert.ok(rightReply.text.includes('✅'));

  const wrongIdx = (rebuilt.correctIndex + 1) % 3;
  const wrongReply = formatTelegramEzberAnswerMessage(
    'https://quranqiraeti.vercel.app',
    rebuilt,
    wrongIdx
  );
  assert.ok(wrongReply.text.includes('❌'));
});

