import crypto from 'node:crypto';
import express, { Request, Response } from 'express';
import firebaseConfig from '../../firebase-applet-config.json';
import { AzkarCategory } from '../data/azkar';
import { ChannelStats, RecitationVideo, SurahTranslationPayload } from '../lib/channel';
import { MushafPagePayload, TOTAL_QURAN_PAGES, summarizeMushafPageContents } from '../lib/quran';
import { parseAlQuranSearchPayload } from '../lib/readerState';
import { resolveMuhaffizReciter } from '../lib/muhaffiz';
import {
  CURATED_TELEGRAM_VERSES,
  CuratedTelegramVerse,
  TELEGRAM_BOT_COMMANDS,
  TelegramInlineQueryResult,
  TelegramReplyMarkup,
  buildInlineAyahResults,
  buildInlineQueryResults,
  buildInlineSearchResults,
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
  formatVerseMessage,
  formatVideosMessage,
  formatZikrMessage,
  getCuratedVerseForDate,
  getTelegramAyahAudioUrl,
  getTelegramSurahAudioUrl,
  parseAudioQueryArgs,
  parseInlineAyahRef,
  parseKartQueryArgs,
  parseTelegramCommand,
} from '../lib/telegramBot';
import {
  buildDailyDigestMessage,
  createDefaultSubscription,
  formatSubscriptionSettingsMessage,
  getBakuDateParts,
  parseAbuneCommandArgs,
  type TelegramSubscription,
} from '../lib/telegramSubscriptions';
import {
  buildSubscriberSummaryStats,
  getSubscriptionForChat,
  hasSentDigestToday,
  loadAllSubscriptions,
  markDigestSentToday,
  saveSubscription,
} from './telegramSubscriptions';
import { VerseCardFormat, VerseCardTheme, renderVerseCardPngBuffer } from './verseCardSvg';
import { normalizeBaseUrl } from '../lib/seo';

export interface TelegramRouterDeps {
  getRequestOrigin: (req: Request) => string;
  getChannelDataForSeo: () => Promise<{
    stats: ChannelStats;
    longVideos: RecitationVideo[];
    shorts: RecitationVideo[];
  }>;
  fetchSurahTranslation: (surahNumber: number) => Promise<SurahTranslationPayload>;
  fetchMushafPage: (pageNumber: number) => Promise<MushafPagePayload>;
}

interface TelegramUpdate {
  update_id?: number;
  message?: {
    message_id?: number;
    text?: string;
    chat?: { id?: number | string };
  };
  callback_query?: {
    id?: string;
    data?: string;
    message?: {
      message_id?: number;
      chat?: { id?: number | string };
    };
  };
  inline_query?: {
    id?: string;
    query?: string;
  };
}

const DEFAULT_PUBLIC_ORIGIN = 'https://quranqiraeti.vercel.app';
const BOOTSTRAPPED_ADMIN_EMAIL_SHA256 =
  'c00a9c2c72ba2c120b8edf90ac1584dd117552bdfca10d4c69808fa25f01534d';
let cachedBotUsername = 'Quranqiraetibot';

export function getTelegramBotToken(): string {
  return String(
    process.env.TELEGRAM_BOT_TOKEN ?? process.env.bot ?? process.env.BOT ?? ''
  ).trim();
}

export function getTelegramWebhookSecret(token: string): string {
  const explicit = String(process.env.TELEGRAM_WEBHOOK_SECRET ?? '').trim();
  if (explicit) return explicit;
  if (!token) return '';
  return crypto
    .createHmac('sha256', token)
    .update('quran-qiraeti-webhook-secret-v1')
    .digest('hex')
    .slice(0, 48);
}

export function resolvePublicTelegramOrigin(reqOrigin?: string): string {
  const canonical = String(process.env.CANONICAL_ORIGIN ?? '').trim();
  if (canonical && /^https:\/\//i.test(canonical)) {
    return normalizeBaseUrl(canonical);
  }
  if (
    reqOrigin &&
    /^https:\/\//i.test(reqOrigin) &&
    !reqOrigin.includes('ais-dev-') &&
    !reqOrigin.includes('127.0.0.1') &&
    !reqOrigin.includes('localhost')
  ) {
    return normalizeBaseUrl(reqOrigin);
  }
  return DEFAULT_PUBLIC_ORIGIN;
}

function verifyTimingSafeSecret(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const providedDigest = crypto.createHash('sha256').update(provided).digest();
  const expectedDigest = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(providedDigest, expectedDigest);
}

async function verifyFirebaseAdminBearer(authHeader: string): Promise<boolean> {
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const idToken = match?.[1]?.trim();
  if (!idToken) return false;

  try {
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!lookupRes.ok) return false;
    const lookupJson = (await lookupRes.json()) as {
      users?: Array<{ localId?: string; email?: string; emailVerified?: boolean }>;
    };
    const user = lookupJson?.users?.[0];
    if (!user?.localId || !user?.emailVerified || !user?.email) return false;

    const emailHash = crypto
      .createHash('sha256')
      .update(user.email.trim().toLowerCase())
      .digest('hex');
    if (verifyTimingSafeSecret(emailHash, BOOTSTRAPPED_ADMIN_EMAIL_SHA256)) {
      return true;
    }

    const adminDocRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(firebaseConfig.projectId)}/databases/${encodeURIComponent(firebaseConfig.firestoreDatabaseId)}/documents/admins/${encodeURIComponent(user.localId)}`,
      {
        headers: { Authorization: `Bearer ${idToken}` },
        signal: AbortSignal.timeout(5000),
      }
    );
    return adminDocRes.ok;
  } catch {
    return false;
  }
}

async function callTelegramApi<T = unknown>(
  token: string,
  method: string,
  payload?: Record<string, unknown>,
  timeoutMs = 6000
): Promise<{ ok: boolean; result?: T; description?: string }> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = (await res.json()) as { ok?: boolean; result?: T; description?: string };
  return {
    ok: Boolean(data?.ok),
    result: data?.result,
    description: data?.description,
  };
}

async function sendTelegramHtmlMessage(
  token: string,
  chatId: number | string,
  text: string,
  replyMarkup?: TelegramReplyMarkup
) {
  await callTelegramApi(token, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

async function editTelegramHtmlMessage(
  token: string,
  chatId: number | string,
  messageId: number,
  text: string,
  replyMarkup?: TelegramReplyMarkup
): Promise<boolean> {
  const res = await callTelegramApi(token, 'editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
  return res.ok;
}

async function sendTelegramAyahAudio(
  token: string,
  chatId: number | string,
  surahNumber: number,
  ayahNumber: number,
  reciterInput?: string
) {
  const surah = findSurahForTelegramQuery(String(surahNumber));
  if (!surah || ayahNumber < 1 || ayahNumber > surah.ayahCount) return;
  const reciter = resolveMuhaffizReciter(reciterInput);
  const audioUrl = getTelegramAyahAudioUrl(surah.number, ayahNumber, reciter.id);
  await callTelegramApi(token, 'sendAudio', {
    chat_id: chatId,
    audio: audioUrl,
    title: `${surah.name} surəsi (${surah.number}:${ayahNumber})`,
    performer: reciter.label,
    caption: `🎧 ${surah.name} surəsi, ${surah.number}:${ayahNumber} · ${reciter.label}`,
  });
}

async function sendTelegramFullSurahAudio(
  token: string,
  origin: string,
  chatId: number | string,
  surahNumber: number,
  reciterInput?: string
) {
  const surah = findSurahForTelegramQuery(String(surahNumber));
  if (!surah) return;
  const reciter = resolveMuhaffizReciter(reciterInput);
  const audioUrl = getTelegramSurahAudioUrl(surah.number, reciter.id);
  const baseUrl = normalizeBaseUrl(origin);

  let contentLengthBytes = 0;
  try {
    const head = await fetch(audioUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(2500),
    });
    if (head.ok) {
      contentLengthBytes = Number.parseInt(head.headers.get('content-length') ?? '0', 10) || 0;
    }
  } catch {
    // Proceed and let Telegram validate or gracefully fall back
  }

  if (contentLengthBytes === 0 || contentLengthBytes <= 19_500_000) {
    const sent = await callTelegramApi(
      token,
      'sendAudio',
      {
        chat_id: chatId,
        audio: audioUrl,
        title: `${surah.number}. ${surah.name} surəsi (Tam)`,
        performer: reciter.label,
        caption: `📀 ${surah.number}. ${surah.name} surəsi (Tam tilavət) · ${reciter.label}`,
      },
      15_000
    );
    if (sent.ok) return;
  }

  const sizeMb = contentLengthBytes > 0 ? ` (~${(contentLengthBytes / 1_048_576).toFixed(1)} MB)` : '';
  await sendTelegramHtmlMessage(
    token,
    chatId,
    [
      `<b>📀 ${surah.number}. ${escapeTelegramHtml(surah.name)} surəsi (Tam Tilavət)</b>`,
      `🎙 <b>Qari:</b> ${escapeTelegramHtml(reciter.label)}${escapeTelegramHtml(sizeMb)}`,
      '',
      'Uzun surə MP3 faylı Telegram bot limiti (20 MB) üzərində olduğu üçün birbaşa audio link və ya tətbiq pleyeri ilə fasiləsiz dinləyə bilərsiniz:',
    ].join('\n'),
    {
      inline_keyboard: [
        [{ text: `🎧 MP3-ni Dinlə / Endir (${reciter.shortLabel})`, url: audioUrl }],
        [
          {
            text: `📖 Mini App-də Fasiləsiz Dinlə`,
            web_app: {
              url: `${baseUrl}/quran/sure/${surah.number}?reciter=${encodeURIComponent(reciter.id)}&audioMode=surah`,
            },
          },
        ],
      ],
    }
  );
}

async function resolveVersePayloadForBot(
  surahNumber: number,
  ayahNumber: number,
  deps: Pick<TelegramRouterDeps, 'fetchSurahTranslation'>
): Promise<CuratedTelegramVerse> {
  const surahMeta = findSurahForTelegramQuery(String(surahNumber)) ?? findSurahForTelegramQuery('2')!;
  const clampedAyah = Math.max(1, Math.min(surahMeta.ayahCount, Math.trunc(ayahNumber || 1)));
  const curated = CURATED_TELEGRAM_VERSES.find(
    (v) => v.surahNumber === surahMeta.number && v.ayahNumber === clampedAyah
  );

  try {
    const payload = await Promise.race([
      deps.fetchSurahTranslation(surahMeta.number),
      new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 2400)),
    ]);
    const hit = payload?.ayahs?.find((a) => a.ayahNumber === clampedAyah);
    if (hit && hit.arabicText && hit.translation) {
      return {
        surahNumber: surahMeta.number,
        surahName: surahMeta.name,
        ayahNumber: clampedAyah,
        arabicText: hit.arabicText,
        translation: hit.translation,
      };
    }
  } catch {
    // Fallback cleanly to curated verse or concise reference
  }

  if (curated) return curated;
  return {
    surahNumber: surahMeta.number,
    surahName: surahMeta.name,
    ayahNumber: clampedAyah,
    arabicText: `${surahMeta.arabicName} ﴿${clampedAyah}﴾`,
    translation: `${surahMeta.name} surəsi, ${clampedAyah}-ci ayə (Tam mətni tətbiqdə oxuya bilərsiniz).`,
  };
}

async function sendTelegramVerseCardPhoto(
  token: string,
  origin: string,
  chatId: number | string,
  verse: CuratedTelegramVerse,
  theme: VerseCardTheme = 'emerald',
  format: VerseCardFormat = 'story'
): Promise<boolean> {
  const baseUrl = normalizeBaseUrl(origin);
  const pngBuffer = renderVerseCardPngBuffer({
    surahName: verse.surahName,
    surahNumber: verse.surahNumber,
    ayahNumber: verse.ayahNumber,
    arabicText: verse.arabicText,
    translation: verse.translation,
    theme,
    format,
  });

  const altTheme: VerseCardTheme = theme === 'emerald' ? 'parchment' : 'emerald';
  const altFormat: VerseCardFormat = format === 'story' ? 'square' : 'story';

  const replyMarkup: TelegramReplyMarkup = {
    inline_keyboard: [
      [
        {
          text: altTheme === 'parchment' ? '🌤 Açıq Tema (Parşömen)' : '🌑 Zümrüd Tema',
          callback_data: `kart:${verse.surahNumber}:${verse.ayahNumber}:${altTheme}:${format}`,
        },
        {
          text: altFormat === 'square' ? '🟦 Kvadrat (1:1)' : '📱 Story (9:16)',
          callback_data: `kart:${verse.surahNumber}:${verse.ayahNumber}:${theme}:${altFormat}`,
        },
      ],
      [
        {
          text: '🎧 Səsli Dinlə',
          callback_data: `amenu:${verse.surahNumber}:${verse.ayahNumber}:afasy`,
        },
        {
          text: '📖 Surədə Aç',
          web_app: {
            url: `${baseUrl}/quran/sure/${verse.surahNumber}#ayah-${verse.ayahNumber}`,
          },
        },
      ],
    ],
  };

  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append(
    'photo',
    new Blob([new Uint8Array(pngBuffer)], { type: 'image/png' }),
    `quranqiraeti-${verse.surahNumber}-${verse.ayahNumber}-${format}.png`
  );
  form.append(
    'caption',
    [
      `<b>🖼 ${escapeTelegramHtml(verse.surahName)} surəsi, ${verse.surahNumber}:${verse.ayahNumber}</b>`,
      `«${escapeTelegramHtml(verse.translation.slice(0, 260))}»`,
      '<i>@quranqiraeti · WhatsApp Status / Instagram Story üçün hazırdır</i>',
    ].join('\n')
  );
  form.append('parse_mode', 'HTML');
  form.append('reply_markup', JSON.stringify(replyMarkup));

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(12_000),
    });
    const data = (await res.json()) as { ok?: boolean };
    return Boolean(data?.ok);
  } catch {
    return false;
  }
}

async function registerBotWebhookAndMenu(
  token: string,
  webhookSecret: string,
  origin: string
) {
  const webhookUrl = `${origin}/api/telegram/webhook`;
  const [webhookRes, commandsRes, menuRes] = await Promise.all([
    callTelegramApi(token, 'setWebhook', {
      url: webhookUrl,
      secret_token: webhookSecret,
      allowed_updates: ['message', 'callback_query', 'inline_query'],
    }),
    callTelegramApi(token, 'setMyCommands', {
      commands: TELEGRAM_BOT_COMMANDS,
    }),
    callTelegramApi(token, 'setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '📖 Quranı Aç',
        web_app: { url: `${origin}/quran` },
      },
    }),
  ]);

  return {
    ok: webhookRes.ok && commandsRes.ok && menuRes.ok,
    webhookUrl,
    webhookSet: webhookRes.ok,
    commandsSet: commandsRes.ok,
    menuButtonSet: menuRes.ok,
    error: !webhookRes.ok ? webhookRes.description : undefined,
  };
}

async function handleQuranTextSearch(
  origin: string,
  query: string
): Promise<{ text: string; reply_markup?: TelegramReplyMarkup }> {
  const baseUrl = normalizeBaseUrl(origin);
  const clean = query.trim().slice(0, 80);
  if (clean.length < 2) {
    return {
      text: 'Zəhmət olmasa ən azı 2 hərf yazın. Məsələn: <code>/axtar səbir</code>',
    };
  }

  try {
    const encoded = encodeURIComponent(clean);
    const upstream = await fetch(
      `https://api.alquran.cloud/v1/search/${encoded}/all/az.mammadaliyev`,
      {
        signal: AbortSignal.timeout(4500),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }
    );
    if (upstream.ok) {
      const json = await upstream.json();
      const matches = parseAlQuranSearchPayload(json).slice(0, 5);
      if (matches.length > 0) {
        const lines = [
          `<b>🔎 «${escapeTelegramHtml(clean)}» üzrə ayə nəticələri:</b>`,
          '',
          ...matches.map(
            (m, idx) =>
              `${idx + 1}. <b>${escapeTelegramHtml(m.surahName)} ${m.surahNumber}:${m.ayahNumber}</b>\n«${escapeTelegramHtml(m.snippet.slice(0, 220))}${m.snippet.length > 220 ? '…' : ''}»`
          ),
        ];
        return {
          text: lines.join('\n'),
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '📖 Bütün nəticələri tətbiqdə aç',
                  web_app: { url: `${baseUrl}/quran?q=${encodeURIComponent(clean)}` },
                },
              ],
            ],
          },
        };
      }
    }
  } catch {
    // fallback to local Surah search below
  }

  const matchedSurah = findSurahForTelegramQuery(clean);
  if (matchedSurah) {
    return formatSurahMessage(baseUrl, matchedSurah);
  }

  return {
    text: `«${escapeTelegramHtml(clean)}» üzrə birbaşa ayə tapılmadı. Tam axtarış üçün tətbiqi aça bilərsiniz:`,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🔎 Tətbiqdə Axtar',
            web_app: { url: `${baseUrl}/quran?q=${encodeURIComponent(clean)}` },
          },
        ],
      ],
    },
  };
}

async function resolveMushafPageReply(
  origin: string,
  pageNumber: number,
  deps: Pick<TelegramRouterDeps, 'fetchMushafPage'>
) {
  const safePage = Math.max(1, Math.min(TOTAL_QURAN_PAGES, Math.trunc(pageNumber)));
  let summaryText = '';
  let sampleAyahs: Array<{
    surahName: string;
    ayahNumber: number;
    arabicText: string;
    translation: string;
  }> = [];

  try {
    const payload = await Promise.race([
      deps.fetchMushafPage(safePage),
      new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 2200)),
    ]);
    if (payload) {
      summaryText = summarizeMushafPageContents(payload);
      sampleAyahs = payload.ayahs.slice(0, 2).map((a) => ({
        surahName: a.surahName.replace(/\s+surəsi$/i, ''),
        ayahNumber: a.ayahNumber,
        arabicText: a.arabicText,
        translation: a.translation,
      }));
    }
  } catch {
    // Fallback to static page link card
  }

  return formatMushafPageMessage(origin, safePage, summaryText, sampleAyahs);
}

export async function processTelegramUpdate(
  update: TelegramUpdate,
  origin: string,
  token: string,
  deps: Pick<TelegramRouterDeps, 'getChannelDataForSeo' | 'fetchSurahTranslation' | 'fetchMushafPage'>
): Promise<void> {
  if (update.inline_query?.id) {
    const inlineQueryId = String(update.inline_query.id);
    const queryText = String(update.inline_query.query ?? '').trim().slice(0, 80);
    const { longVideos, shorts } = await deps.getChannelDataForSeo();
    const collected: TelegramInlineQueryResult[] = [];

    const ayahRef = parseInlineAyahRef(queryText);
    if (ayahRef) {
      const verse = await resolveVersePayloadForBot(
        ayahRef.surahNumber,
        ayahRef.ayahNumber,
        deps
      );
      collected.push(
        ...buildInlineAyahResults(origin, cachedBotUsername, verse, ayahRef.reciterId)
      );
    } else if (queryText.length >= 3) {
      try {
        const encoded = encodeURIComponent(queryText);
        const searchRes = await fetch(
          `https://api.alquran.cloud/v1/search/${encoded}/all/az.mammadaliyev`,
          {
            signal: AbortSignal.timeout(2200),
            headers: { 'User-Agent': 'Mozilla/5.0' },
          }
        );
        if (searchRes.ok) {
          const searchJson = await searchRes.json();
          const matches = parseAlQuranSearchPayload(searchJson).slice(0, 4);
          if (matches.length > 0) {
            collected.push(
              ...buildInlineSearchResults(origin, cachedBotUsername, matches)
            );
          }
        }
      } catch {
        // fallback gracefully to catalog & video inline results
      }
    }

    const baseResults = buildInlineQueryResults(
      origin,
      queryText,
      [...longVideos, ...shorts],
      new Date(),
      cachedBotUsername
    );

    const seenIds = new Set(collected.map((item) => item.id));
    for (const item of baseResults) {
      if (!seenIds.has(item.id)) {
        collected.push(item);
        seenIds.add(item.id);
      }
    }

    await callTelegramApi(token, 'answerInlineQuery', {
      inline_query_id: inlineQueryId,
      results: collected.slice(0, 15),
      cache_time: 120,
      is_personal: false,
    });
    return;
  }

  if (update.callback_query?.id && update.callback_query.message?.chat?.id !== undefined) {
    const cbId = String(update.callback_query.id);
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    const data = String(update.callback_query.data ?? '');

    await callTelegramApi(token, 'answerCallbackQuery', { callback_query_id: cbId });

    if (data === 'aye:random') {
      const pick =
        CURATED_TELEGRAM_VERSES[Math.floor(Math.random() * CURATED_TELEGRAM_VERSES.length)];
      const msg = formatVerseMessage(origin, { ...pick, heading: '✨ Seçilmiş Ayə' });
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (data.startsWith('kart:')) {
      const [, sRaw, aRaw, themeRaw, formatRaw] = data.split(':');
      const sNum = Number.parseInt(sRaw ?? '2', 10) || 2;
      const aNum = Number.parseInt(aRaw ?? '255', 10) || 255;
      const theme: VerseCardTheme = themeRaw === 'parchment' ? 'parchment' : 'emerald';
      const format: VerseCardFormat = formatRaw === 'square' ? 'square' : 'story';
      const verse = await resolveVersePayloadForBot(sNum, aNum, deps);
      await sendTelegramVerseCardPhoto(token, origin, chatId, verse, theme, format);
    } else if (data.startsWith('sub:')) {
      const existing =
        (await getSubscriptionForChat(chatId, token)) ?? createDefaultSubscription(chatId);

      if (data === 'sub:test') {
        const saved = await saveSubscription({ ...existing, active: true }, token);
        const digest = buildDailyDigestMessage(origin, saved, new Date());
        if (digest) {
          await sendTelegramHtmlMessage(token, chatId, digest.text, digest.reply_markup);
        }
        return;
      }

      let updated: TelegramSubscription = existing;
      if (data === 'sub:menu') {
        if (!(await getSubscriptionForChat(chatId, token))) {
          updated = await saveSubscription(existing, token);
        }
      } else if (data === 'sub:tog:active') {
        updated = await saveSubscription({ ...existing, active: !existing.active }, token);
      } else if (data === 'sub:tog:kahf') {
        updated = await saveSubscription(
          { ...existing, active: true, fridayKahf: !existing.fridayKahf },
          token
        );
      } else if (data === 'sub:tog:verse') {
        updated = await saveSubscription(
          { ...existing, active: true, dailyVerseZikr: !existing.dailyVerseZikr },
          token
        );
      } else if (data === 'sub:tog:prayer') {
        updated = await saveSubscription(
          { ...existing, active: true, dailyPrayer: !existing.dailyPrayer },
          token
        );
      } else if (data.startsWith('sub:city:')) {
        const cityId = data.slice('sub:city:'.length);
        const city = findCityForTelegramQuery(cityId);
        updated = await saveSubscription({ ...existing, active: true, cityId: city.id }, token);
      } else if (data.startsWith('sub:hour:')) {
        const hour = Number.parseInt(data.slice('sub:hour:'.length), 10);
        if (hour >= 0 && hour <= 23) {
          updated = await saveSubscription({ ...existing, active: true, hourBaku: hour }, token);
        }
      }

      const settingsReply = formatSubscriptionSettingsMessage(origin, updated);
      if (data !== 'sub:menu' && typeof messageId === 'number') {
        const edited = await editTelegramHtmlMessage(
          token,
          chatId,
          messageId,
          settingsReply.text,
          settingsReply.reply_markup
        );
        if (edited) return;
      }
      await sendTelegramHtmlMessage(
        token,
        chatId,
        settingsReply.text,
        settingsReply.reply_markup
      );
    } else if (data.startsWith('amenu:')) {
      const [, sRaw, aRaw, qariCode] = data.split(':');
      const sNum = Number.parseInt(sRaw ?? '1', 10) || 1;
      const aNum = Number.parseInt(aRaw ?? '1', 10) || 1;
      const msg = formatAudioSelectorMessage(origin, {
        surahNumber: sNum,
        ayahNumber: aNum,
        reciterInput: qariCode,
        showPresets: sNum === 1 && aNum === 1,
      });
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (data.startsWith('asrc:')) {
      const [, sRaw, aRaw, qariCode] = data.split(':');
      const sNum = Number.parseInt(sRaw ?? '1', 10) || 1;
      const aNum = Number.parseInt(aRaw ?? '1', 10) || 1;
      const msg = formatAudioSelectorMessage(origin, {
        surahNumber: sNum,
        ayahNumber: aNum,
        reciterInput: qariCode,
        showPresets: true,
      });
      if (typeof messageId === 'number') {
        const edited = await editTelegramHtmlMessage(
          token,
          chatId,
          messageId,
          msg.text,
          msg.reply_markup
        );
        if (!edited) {
          await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
        }
      } else {
        await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
      }
    } else if (data.startsWith('aplay:')) {
      const [, mode, sRaw, aRaw, qariCode] = data.split(':');
      const sNum = Number.parseInt(sRaw ?? '1', 10) || 1;
      const aNum = Number.parseInt(aRaw ?? '1', 10) || 1;
      if (mode === 'surah') {
        await sendTelegramFullSurahAudio(token, origin, chatId, sNum, qariCode);
      } else {
        await sendTelegramAyahAudio(token, chatId, sNum, aNum, qariCode);
      }
    } else if (data.startsWith('audio:')) {
      const [, sRaw, aRaw, qariCode] = data.split(':');
      const sNum = Number.parseInt(sRaw ?? '1', 10) || 1;
      const aNum = Number.parseInt(aRaw ?? '1', 10) || 1;
      const msg = formatAudioSelectorMessage(origin, {
        surahNumber: sNum,
        ayahNumber: aNum,
        reciterInput: qariCode,
      });
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (data.startsWith('namaz:')) {
      const cityKey = data.slice('namaz:'.length);
      const city = findCityForTelegramQuery(cityKey);
      const msg = formatPrayerTimesMessage(origin, city);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (data.startsWith('zikr:')) {
      const [, rawCat = 'seher', rawIdx] = data.split(':');
      const cat: AzkarCategory =
        rawCat === 'axsam' || rawCat === 'namaz' || rawCat === 'umumi' ? rawCat : 'seher';
      const parsedIdx = rawIdx !== undefined ? Number.parseInt(rawIdx, 10) : NaN;
      const offset = Number.isFinite(parsedIdx) && parsedIdx >= 0 ? parsedIdx : Math.floor(Math.random() * 25);
      const msg = formatZikrMessage(origin, cat, offset);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (data === 'teqvim:now') {
      const msg = formatHijriCalendarMessage(origin);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (data.startsWith('mushaf:')) {
      const pageNum = Number.parseInt(data.slice('mushaf:'.length), 10);
      if (pageNum >= 1 && pageNum <= TOTAL_QURAN_PAGES) {
        const msg = await resolveMushafPageReply(origin, pageNum, deps);
        await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
      }
    }
    return;
  }

  if (update.message?.chat?.id !== undefined && typeof update.message.text === 'string') {
    const chatId = update.message.chat.id;
    const rawText = update.message.text.trim();
    const parsed = parseTelegramCommand(rawText);

    if (!parsed) {
      const inlineRefHit = parseInlineAyahRef(rawText);
      if (inlineRefHit) {
        const verse = await resolveVersePayloadForBot(
          inlineRefHit.surahNumber,
          inlineRefHit.ayahNumber,
          deps
        );
        const msg = formatVerseMessage(origin, {
          ...verse,
          heading: `📖 ${verse.surahName} surəsi`,
        });
        await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
        return;
      }

      const surahHit = findSurahForTelegramQuery(rawText);
      if (surahHit && rawText.length <= 30) {
        let sampleAyahs: Array<{ ayahNumber: number; arabicText: string; translation: string }> = [];
        try {
          const payload = await Promise.race([
            deps.fetchSurahTranslation(surahHit.number),
            new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 2000)),
          ]);
          if (payload) sampleAyahs = payload.ayahs.slice(0, 2);
        } catch {
          // fallback cleanly
        }
        const msg = formatSurahMessage(origin, surahHit, sampleAyahs);
        await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
      } else {
        const msg = await handleQuranTextSearch(origin, rawText);
        await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
      }
      return;
    }

    const { command, args } = parsed;

    if (command === 'start' || command === 'help' || command === 'yardim' || command === 'menu') {
      const deepArg = args.trim();
      const deepKart = deepArg.match(/^kart_(\d{1,3})_(\d{1,3})$/i);
      if (deepKart) {
        const s = Number.parseInt(deepKart[1], 10);
        const a = Number.parseInt(deepKart[2], 10);
        const verse = await resolveVersePayloadForBot(s, a, deps);
        await sendTelegramVerseCardPhoto(token, origin, chatId, verse, 'emerald', 'story');
        return;
      }

      const deepSes = deepArg.match(/^ses_(\d{1,3})_(\d{1,3})$/i);
      if (deepSes) {
        const s = Number.parseInt(deepSes[1], 10);
        const a = Number.parseInt(deepSes[2], 10);
        const msg = formatAudioSelectorMessage(origin, {
          surahNumber: s,
          ayahNumber: a,
          reciterInput: 'afasy',
        });
        await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
        return;
      }

      const deepAye = deepArg.match(/^aye_(\d{1,3})_(\d{1,3})$/i);
      if (deepAye) {
        const s = Number.parseInt(deepAye[1], 10);
        const a = Number.parseInt(deepAye[2], 10);
        const verse = await resolveVersePayloadForBot(s, a, deps);
        const msg = formatVerseMessage(origin, {
          ...verse,
          heading: `📖 ${verse.surahName} surəsi`,
        });
        await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
        return;
      }

      if (deepArg.toLowerCase() === 'abune') {
        const existing =
          (await getSubscriptionForChat(chatId, token)) ?? createDefaultSubscription(chatId);
        const saved = await saveSubscription(existing, token);
        const msg = formatSubscriptionSettingsMessage(origin, saved);
        await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
        return;
      }

      const msg = formatStartMessage(origin);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === 'kart' || command === 'sekil' || command === 'card') {
      const kartTarget = parseKartQueryArgs(args);
      const verse = await resolveVersePayloadForBot(
        kartTarget.surahNumber,
        kartTarget.ayahNumber,
        deps
      );
      const ok = await sendTelegramVerseCardPhoto(
        token,
        origin,
        chatId,
        verse,
        kartTarget.theme,
        kartTarget.format
      );
      if (!ok) {
        const fallbackMsg = formatVerseMessage(origin, verse);
        await sendTelegramHtmlMessage(token, chatId, fallbackMsg.text, fallbackMsg.reply_markup);
      }
    } else if (command === 'abune' || command === 'bildiris' || command === 'sub') {
      const current =
        (await getSubscriptionForChat(chatId, token)) ?? createDefaultSubscription(chatId);
      const nextSub = parseAbuneCommandArgs(args, current);
      const saved = await saveSubscription(nextSub, token);
      const msg = formatSubscriptionSettingsMessage(origin, saved);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === 'ses' || command === 'dinle' || command === 'qiraet' || command === 'qari') {
      const audioTarget = parseAudioQueryArgs(args);
      const msg = formatAudioSelectorMessage(origin, {
        surahNumber: audioTarget.surahNumber,
        ayahNumber: audioTarget.ayahNumber,
        reciterInput: audioTarget.reciterId,
        showPresets: !audioTarget.hasExplicitTarget,
      });
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === 'aye' || command === 'gunun_ayesi') {
      const refMatch = args.match(/^(\d{1,3}):(\d{1,3})$/);
      if (refMatch) {
        const surahNum = Number.parseInt(refMatch[1], 10);
        const ayahNum = Number.parseInt(refMatch[2], 10);
        const surahMeta = findSurahForTelegramQuery(String(surahNum));
        if (surahMeta && ayahNum >= 1 && ayahNum <= surahMeta.ayahCount) {
          const verse = await resolveVersePayloadForBot(surahNum, ayahNum, deps);
          const msg = formatVerseMessage(origin, {
            ...verse,
            heading: `📖 ${surahMeta.name} surəsi`,
          });
          await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
          return;
        }
      }
      const daily = getCuratedVerseForDate();
      const msg = formatVerseMessage(origin, daily);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === 'sure' || command === 'surah') {
      if (!args) {
        await sendTelegramHtmlMessage(
          token,
          chatId,
          'Zəhmət olmasa surə adı və ya nömrəsi yazın. Məsələn:\n<code>/sure Yasin</code> və ya <code>/sure 36</code>'
        );
      } else {
        const surah = findSurahForTelegramQuery(args);
        if (!surah) {
          await sendTelegramHtmlMessage(
            token,
            chatId,
            `«${escapeTelegramHtml(args)}» adlı surə tapılmadı. 1–114 arası nömrə və ya surə adı yazın.`
          );
        } else {
          let sampleAyahs: Array<{ ayahNumber: number; arabicText: string; translation: string }> = [];
          try {
            const payload = await Promise.race([
              deps.fetchSurahTranslation(surah.number),
              new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 2000)),
            ]);
            if (payload) sampleAyahs = payload.ayahs.slice(0, 2);
          } catch {
            // fallback to metadata summary
          }
          const msg = formatSurahMessage(origin, surah, sampleAyahs);
          await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
        }
      }
    } else if (command === 'sehife' || command === 'mushaf' || command === 'page') {
      const num = Number.parseInt(args || '1', 10);
      if (Number.isNaN(num) || num < 1 || num > TOTAL_QURAN_PAGES) {
        await sendTelegramHtmlMessage(
          token,
          chatId,
          'Mədinə Mushafı səhifələri 1 ilə 604 arasındadır. Məsələn: <code>/sehife 42</code>'
        );
      } else {
        const msg = await resolveMushafPageReply(origin, num, deps);
        await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
      }
    } else if (command === 'namaz' || command === 'vaxt') {
      const city = findCityForTelegramQuery(args || 'Bakı');
      const msg = formatPrayerTimesMessage(origin, city);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === 'zikr' || command === 'tesbih') {
      const argNorm = args.toLowerCase();
      const category: AzkarCategory = argNorm.includes('ax')
        ? 'axsam'
        : argNorm.includes('namaz')
          ? 'namaz'
          : 'seher';
      const msg = formatZikrMessage(origin, category, 0);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === 'teqvim' || command === 'hicri') {
      const msg = formatHijriCalendarMessage(origin);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === 'elifba' || command === 'tecvid') {
      const msg = formatAlphabetMessage(origin);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === 'axtar' || command === 'search') {
      const msg = await handleQuranTextSearch(origin, args);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === 'videolar' || command === 'shorts') {
      const { longVideos, shorts } = await deps.getChannelDataForSeo();
      const list = command === 'shorts' ? shorts : longVideos;
      const heading =
        command === 'shorts'
          ? '📱 Quran Qiraeti — Son Shorts Videoları'
          : '🎬 Quran Qiraeti — Seçilmiş Uzun Tilavətlər';
      const msg = formatVideosMessage(origin, list, heading);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else {
      const msg = formatStartMessage(origin);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    }
  }
}

let pollingStarted = false;
let vercelAutoSyncAttempted = false;

export async function startTelegramBotRuntime(
  deps: Pick<TelegramRouterDeps, 'getChannelDataForSeo' | 'fetchSurahTranslation' | 'fetchMushafPage'>
): Promise<void> {
  if (pollingStarted || process.env.VERCEL) return;
  const token = getTelegramBotToken();
  if (!token) return;
  pollingStarted = true;

  const miniAppOrigin = resolvePublicTelegramOrigin(process.env.APP_URL);

  try {
    const [me, info] = await Promise.all([
      callTelegramApi<{ username?: string }>(token, 'getMe'),
      callTelegramApi<{ url?: string }>(token, 'getWebhookInfo'),
      callTelegramApi(token, 'setMyCommands', { commands: TELEGRAM_BOT_COMMANDS }),
      callTelegramApi(token, 'setChatMenuButton', {
        menu_button: {
          type: 'web_app',
          text: '📖 Quranı Aç',
          web_app: { url: `${miniAppOrigin}/quran` },
        },
      }),
    ]);

    if (me.ok && me.result?.username) {
      cachedBotUsername = me.result.username;
      console.log(`Telegram bot connected: @${me.result.username}`);
    }

    if (info.ok && info.result?.url) {
      console.log('Telegram bot already bound to external webhook; skipping local polling.');
      return;
    }

    let offset = 0;
    const pollLoop = async () => {
      while (pollingStarted) {
        try {
          const updates = await callTelegramApi<TelegramUpdate[]>(
            token,
            'getUpdates',
            {
              offset,
              timeout: 25,
              allowed_updates: ['message', 'callback_query', 'inline_query'],
            },
            30_000
          );
          if (updates.ok && Array.isArray(updates.result)) {
            for (const upd of updates.result) {
              if (typeof upd.update_id === 'number') {
                offset = Math.max(offset, upd.update_id + 1);
              }
              await processTelegramUpdate(upd, miniAppOrigin, token, deps);
            }
          } else {
            await new Promise((r) => setTimeout(r, 4000));
          }
        } catch {
          await new Promise((r) => setTimeout(r, 4000));
        }
      }
    };

    void pollLoop();
  } catch {
    // keep server startup non-blocking
  }
}

export function createTelegramRouter(deps: TelegramRouterDeps) {
  const router = express.Router();

  router.get('/status', async (req: Request, res: Response) => {
    const token = getTelegramBotToken();
    const webhookSecret = getTelegramWebhookSecret(token);
    const reqOrigin = normalizeBaseUrl(deps.getRequestOrigin(req));
    const miniAppOrigin = resolvePublicTelegramOrigin(reqOrigin);
    const webhookUrl = `${miniAppOrigin}/api/telegram/webhook`;

    let botUsername: string | null = null;
    let webhookActiveUrl: string | null = null;

    if (token) {
      try {
        const [me, info] = await Promise.all([
          callTelegramApi<{ username?: string }>(token, 'getMe'),
          callTelegramApi<{ url?: string }>(token, 'getWebhookInfo'),
        ]);
        if (me.ok && me.result?.username) {
          botUsername = me.result.username;
          cachedBotUsername = me.result.username;
        }
        if (info.ok && info.result?.url) {
          webhookActiveUrl = info.result.url;
        }

        const isPublicProductionHost =
          reqOrigin.startsWith('https://') &&
          !reqOrigin.includes('ais-dev-') &&
          !reqOrigin.includes('127.0.0.1') &&
          !reqOrigin.includes('localhost');

        if (isPublicProductionHost && !vercelAutoSyncAttempted) {
          vercelAutoSyncAttempted = true;
          if (!webhookActiveUrl) {
            const registered = await registerBotWebhookAndMenu(token, webhookSecret, miniAppOrigin);
            if (registered.webhookSet) {
              webhookActiveUrl = registered.webhookUrl;
            }
          } else {
            await callTelegramApi(token, 'setMyCommands', { commands: TELEGRAM_BOT_COMMANDS });
          }
        }
      } catch {
        // Keep status check non-blocking
      }
    }

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      botConfigured: Boolean(token),
      webhookSecretConfigured: Boolean(webhookSecret),
      mode: webhookActiveUrl ? 'webhook' : token ? 'polling' : 'unconfigured',
      miniAppOrigin,
      recommendedWebhookUrl: webhookUrl,
      botUsername,
      webhookActiveUrl,
      commandsCount: TELEGRAM_BOT_COMMANDS.length,
    });
  });

  router.get('/verse-card.png', async (req: Request, res: Response) => {
    const surahNum = Math.max(1, Math.min(114, Number.parseInt(String(req.query.surah ?? '2'), 10) || 2));
    const ayahNum = Math.max(1, Number.parseInt(String(req.query.ayah ?? '255'), 10) || 1);
    const theme: VerseCardTheme =
      String(req.query.theme ?? '').toLowerCase() === 'parchment' ? 'parchment' : 'emerald';
    const format: VerseCardFormat =
      String(req.query.format ?? '').toLowerCase() === 'square' ? 'square' : 'story';

    try {
      const verse = await resolveVersePayloadForBot(surahNum, ayahNum, deps);
      const pngBuffer = renderVerseCardPngBuffer({
        surahName: verse.surahName,
        surahNumber: verse.surahNumber,
        ayahNumber: verse.ayahNumber,
        arabicText: verse.arabicText,
        translation: verse.translation,
        theme,
        format,
      });
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, s-maxage=86400, max-age=86400, stale-while-revalidate=604800');
      res.send(pngBuffer);
    } catch {
      res.status(500).json({ ok: false, error: 'Ayə şəkil kartı hazırlana bilmədi.' });
    }
  });

  router.get('/subscribers', async (req: Request, res: Response) => {
    const authHeader = String(req.header('authorization') ?? '');
    const adminOk = await verifyFirebaseAdminBearer(authHeader);
    if (!adminOk) {
      res.status(401).json({ ok: false, error: 'İcazəsiz sorğu. Admin girişi tələb olunur.' });
      return;
    }

    const token = getTelegramBotToken();
    const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    const { subscriptions, storageModes } = await loadAllSubscriptions(token, idToken);
    const summary = buildSubscriberSummaryStats(subscriptions, storageModes);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ ok: true, ...summary });
  });

  async function handleCronDispatch(req: Request, res: Response) {
    const token = getTelegramBotToken();
    const webhookSecret = getTelegramWebhookSecret(token);
    const cronSecret = String(process.env.CRON_SECRET ?? '').trim();
    const authHeader = String(req.header('authorization') ?? '').trim();
    const bearerValue = authHeader.replace(/^Bearer\s+/i, '').trim();
    const setupSecret = String(req.header('x-telegram-setup-secret') ?? '').trim();

    let authorized = false;
    let adminIdToken = '';

    if (cronSecret && bearerValue && verifyTimingSafeSecret(bearerValue, cronSecret)) {
      authorized = true;
    } else if (setupSecret && webhookSecret && verifyTimingSafeSecret(setupSecret, webhookSecret)) {
      authorized = true;
    } else if (authHeader && (await verifyFirebaseAdminBearer(authHeader))) {
      authorized = true;
      adminIdToken = bearerValue;
    }

    if (!authorized) {
      res.status(401).json({ ok: false, error: 'İcazəsiz cron sorğusu.' });
      return;
    }

    if (!token) {
      res.status(400).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN konfiqurasiya edilməyib.' });
      return;
    }

    const now = new Date();
    const bakuDate = getBakuDateParts(now);
    const origin = resolvePublicTelegramOrigin(deps.getRequestOrigin(req));
    const sendAll = req.query.all === '1' || req.query.all === 'true';
    const force = req.query.force === '1' || req.query.force === 'true';

    const { subscriptions, storageModes } = await loadAllSubscriptions(token, adminIdToken);
    const activeSubs = subscriptions.filter((s) => s.active);

    let attempted = 0;
    let sent = 0;
    let skippedAlreadySent = 0;
    let skippedHour = 0;
    let failed = 0;

    for (const sub of activeSubs) {
      if (!sendAll && sub.hourBaku !== bakuDate.hour) {
        skippedHour++;
        continue;
      }
      if (!force && (await hasSentDigestToday(sub.chatId, bakuDate.dateKey, token))) {
        skippedAlreadySent++;
        continue;
      }

      const reply = buildDailyDigestMessage(origin, sub, now);
      if (!reply) continue;

      attempted++;
      const apiRes = await callTelegramApi(token, 'sendMessage', {
        chat_id: sub.chatId,
        text: reply.text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...(reply.reply_markup ? { reply_markup: reply.reply_markup } : {}),
      });
      if (apiRes.ok) {
        sent++;
        await markDigestSentToday(sub.chatId, bakuDate.dateKey, token);
      } else {
        failed++;
      }
    }

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ok: true,
      dateKey: bakuDate.dateKey,
      hourBaku: bakuDate.hour,
      isFriday: bakuDate.isFriday,
      totalActive: activeSubs.length,
      attempted,
      sent,
      skippedAlreadySent,
      skippedHour,
      failed,
      storageModes,
    });
  }

  router.get('/cron', handleCronDispatch);
  router.post('/cron', handleCronDispatch);

  router.post('/setup', async (req: Request, res: Response) => {
    const token = getTelegramBotToken();
    const webhookSecret = getTelegramWebhookSecret(token);

    if (!token || !webhookSecret) {
      res.status(400).json({
        ok: false,
        error: 'Server mühit dəyişənlərində TELEGRAM_BOT_TOKEN (və ya bot) təyin edilməyib.',
      });
      return;
    }

    const providedSetupSecret = String(req.header('x-telegram-setup-secret') ?? '').trim();
    const explicitSetupSecret = String(process.env.TELEGRAM_WEBHOOK_SECRET ?? '').trim();
    const secretAuthorized =
      providedSetupSecret.length > 0 &&
      verifyTimingSafeSecret(providedSetupSecret, explicitSetupSecret || webhookSecret);

    const adminAuthorized = secretAuthorized
      ? true
      : await verifyFirebaseAdminBearer(String(req.header('authorization') ?? ''));

    if (!adminAuthorized) {
      res.status(401).json({ ok: false, error: 'İcazəsiz sorğu. Admin girişi tələb olunur.' });
      return;
    }

    const origin = resolvePublicTelegramOrigin(deps.getRequestOrigin(req));
    try {
      const result = await registerBotWebhookAndMenu(token, webhookSecret, origin);
      res.json(result);
    } catch {
      res.status(502).json({ ok: false, error: 'Telegram Bot API ilə əlaqə alınmadı.' });
    }
  });

  router.get('/webhook', (_req: Request, res: Response) => {
    res.status(200).json({
      ok: true,
      endpoint: '/api/telegram/webhook',
      note: 'Telegram POST sorğuları üçün aktiv webhook nöqtəsi.',
    });
  });

  router.post('/webhook', async (req: Request, res: Response) => {
    const token = getTelegramBotToken();
    const webhookSecret = getTelegramWebhookSecret(token);

    if (webhookSecret) {
      const headerSecret = String(req.header('x-telegram-bot-api-secret-token') ?? '').trim();
      if (!verifyTimingSafeSecret(headerSecret, webhookSecret)) {
        res.status(401).json({ ok: false, error: 'Unauthorized webhook request' });
        return;
      }
    }

    if (!token) {
      res.status(200).json({ ok: false, configured: false });
      return;
    }

    const update = (req.body ?? {}) as TelegramUpdate;
    const origin = resolvePublicTelegramOrigin(deps.getRequestOrigin(req));

    try {
      await processTelegramUpdate(update, origin, token, deps);
    } catch (err) {
      console.error('Telegram webhook processing error:', err);
    }

    res.json({ ok: true });
  });

  return router;
}
