import assert from 'node:assert/strict';
import test from 'node:test';
import { SEED_LONG_VIDEOS, SEED_SHORTS } from '../data/recitations';
import {
  CURATED_TELEGRAM_VERSES,
  TELEGRAM_BOT_COMMANDS,
  TelegramInlineQueryResult,
  buildInlineAyahResults,
  buildInlineQueryResults,
  buildInlineSearchResults,
  parseInlineAyahRef,
  parseKartQueryArgs,
  resolveTelegramStartParamPath,
} from './telegramBot';
import {
  buildDailyDigestMessage,
  createDefaultSubscription,
  isFridayInBaku,
  parseAbuneCommandArgs,
  reduceSubscriptionEvents,
} from './telegramSubscriptions';
import {
  decryptSubscriptionPayload,
  encryptSubscriptionPayload,
  hashTelegramChatId,
} from '../server/telegramSubscriptions';
import { buildVerseCardSvg, renderVerseCardPngBuffer } from '../server/verseCardSvg';

function assertNoForbiddenInlineButtons(results: TelegramInlineQueryResult[]) {
  for (const item of results) {
    const rows = item.reply_markup?.inline_keyboard ?? [];
    for (const row of rows) {
      for (const btn of row) {
        assert.equal(btn.web_app, undefined, `Inline result ${item.id} must not use web_app`);
        assert.equal(
          btn.callback_data,
          undefined,
          `Inline result ${item.id} must not use callback_data`
        );
      }
    }
  }
}

test('server verseCardSvg generates emerald story and parchment square PNG buffers', () => {
  const sample = CURATED_TELEGRAM_VERSES[0];

  const storySvg = buildVerseCardSvg({
    ...sample,
    theme: 'emerald',
    format: 'story',
  });
  assert.ok(storySvg.includes('width="1080" height="1920"'));
  assert.ok(storySvg.includes('@quranqiraeti'));
  assert.ok(storySvg.includes('2:255'));

  const squareSvg = buildVerseCardSvg({
    ...sample,
    theme: 'parchment',
    format: 'square',
  });
  assert.ok(squareSvg.includes('width="1080" height="1080"'));

  const png = renderVerseCardPngBuffer({
    ...sample,
    theme: 'emerald',
    format: 'story',
  });
  assert.ok(png.length > 10_000, `Expected PNG > 10KB, got ${png.length}`);
  assert.equal(png[0], 0x89);
  assert.equal(png[1], 0x50);
  assert.equal(png[2], 0x4e);
  assert.equal(png[3], 0x47);
});

test('telegramSubscriptions encryption matches Firestore security rules regex and round-trips cleanly', () => {
  const secret = 'test-bot-secret-123';
  const sub = {
    ...createDefaultSubscription(123456789),
    cityId: 'ganja',
    hourBaku: 8,
    fridayKahf: true,
    dailyVerseZikr: true,
    dailyPrayer: false,
  };

  const chatHash = hashTelegramChatId(sub.chatId, secret);
  assert.match(chatHash, /^[a-f0-9]{64}$/);

  const cipher = encryptSubscriptionPayload(sub, secret);
  assert.ok(cipher.length >= 16 && cipher.length <= 1024);
  assert.match(cipher, /^[a-zA-Z0-9+/=:\-]+$/);

  const decrypted = decryptSubscriptionPayload(cipher, secret);
  assert.ok(decrypted);
  assert.equal(decrypted.chatId, '123456789');
  assert.equal(decrypted.cityId, 'ganja');
  assert.equal(decrypted.hourBaku, 8);
  assert.equal(decrypted.dailyPrayer, false);
});

test('subscription reducer, /abune parser, and Friday Kehf schedule behave accurately', () => {
  const base = createDefaultSubscription(777);
  const older = { ...base, cityId: 'baku', updatedAt: 1000 };
  const newer = { ...base, cityId: 'shaki', hourBaku: 12, updatedAt: 2000 };
  const reduced = reduceSubscriptionEvents([older, newer]);
  assert.equal(reduced.length, 1);
  assert.equal(reduced[0].cityId, 'shaki');
  assert.equal(reduced[0].hourBaku, 12);

  const parsedArgs = parseAbuneCommandArgs('Gəncə 08', base);
  assert.equal(parsedArgs.cityId, 'ganja');
  assert.equal(parsedArgs.hourBaku, 8);
  assert.equal(parsedArgs.active, true);

  const stopped = parseAbuneCommandArgs('dayandır', parsedArgs);
  assert.equal(stopped.active, false);

  const fridayUtc = new Date('2026-11-20T05:30:00Z');
  const thursdayUtc = new Date('2026-11-19T05:30:00Z');
  assert.equal(isFridayInBaku(fridayUtc), true);
  assert.equal(isFridayInBaku(thursdayUtc), false);

  const fridayMsg = buildDailyDigestMessage('https://quranqiraeti.vercel.app', parsedArgs, fridayUtc);
  const thursdayMsg = buildDailyDigestMessage(
    'https://quranqiraeti.vercel.app',
    parsedArgs,
    thursdayUtc
  );
  assert.ok(fridayMsg?.text.includes('Kəhf Surəsi'));
  assert.ok(!thursdayMsg?.text.includes('Kəhf Surəsi'));
  assert.ok(thursdayMsg?.text.includes('Günün Ayəsi'));
});

test('Features 2-4 commands, parsers, start deep links, and inline results pass strict button validation', () => {
  assert.equal(TELEGRAM_BOT_COMMANDS.length, 14);
  assert.ok(TELEGRAM_BOT_COMMANDS.some((c) => c.command === 'ezber'));
  assert.ok(TELEGRAM_BOT_COMMANDS.some((c) => c.command === 'kart'));
  assert.ok(TELEGRAM_BOT_COMMANDS.some((c) => c.command === 'abune'));

  const kartArgs = parseKartQueryArgs('2:255 aciq kvadrat');
  assert.equal(kartArgs.surahNumber, 2);
  assert.equal(kartArgs.ayahNumber, 255);
  assert.equal(kartArgs.theme, 'parchment');
  assert.equal(kartArgs.format, 'square');

  const ref1 = parseInlineAyahRef('2:255 maher');
  assert.equal(ref1?.surahNumber, 2);
  assert.equal(ref1?.ayahNumber, 255);
  assert.equal(ref1?.reciterId, 'MaherAlMuaiqly128kbps');

  const ref2 = parseInlineAyahRef('yasin 12');
  assert.equal(ref2?.surahNumber, 36);
  assert.equal(ref2?.ayahNumber, 12);

  assert.equal(resolveTelegramStartParamPath('kart_2_255'), '/quran/sure/2#ayah-255');
  assert.equal(resolveTelegramStartParamPath('ses_36_12'), '/quran/sure/36#ayah-12');
  assert.equal(resolveTelegramStartParamPath('aye_2_255'), '/quran/sure/2#ayah-255');
  assert.equal(resolveTelegramStartParamPath('abune'), '/namaz-vaxtlari');

  const ayahInline = buildInlineAyahResults(
    'https://quranqiraeti.vercel.app',
    'Quranqiraetibot',
    CURATED_TELEGRAM_VERSES[0],
    'maher'
  );
  assert.equal(ayahInline.length, 3);
  assert.equal(ayahInline[0].type, 'article');
  assert.equal(ayahInline[1].type, 'audio');
  assert.equal(ayahInline[2].type, 'photo');
  assertNoForbiddenInlineButtons(ayahInline);

  const searchInline = buildInlineSearchResults('https://quranqiraeti.vercel.app', 'Quranqiraetibot', [
    {
      surahNumber: 2,
      surahName: 'Bəqərə',
      ayahNumber: 153,
      snippet: 'Səbir və namazla Allahdan kömək diləyin!',
    },
  ]);
  assertNoForbiddenInlineButtons(searchInline);

  const catalogInline = buildInlineQueryResults(
    'https://quranqiraeti.vercel.app',
    'yasin',
    [...SEED_LONG_VIDEOS, ...SEED_SHORTS],
    new Date('2026-11-22T09:00:00Z'),
    'Quranqiraetibot'
  );
  assertNoForbiddenInlineButtons(catalogInline);
});
