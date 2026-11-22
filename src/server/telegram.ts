import crypto from 'node:crypto';
import express, { Request, Response } from 'express';
import firebaseConfig from '../../firebase-applet-config.json';
import { AzkarCategory } from '../data/azkar';
import { QURAN_DUAS } from '../data/quranDuas';
import { ChannelStats, RecitationVideo, SurahTranslationPayload } from '../lib/channel';
import { MushafPagePayload, TOTAL_QURAN_PAGES, summarizeMushafPageContents } from '../lib/quran';
import { parseAlQuranSearchPayload } from '../lib/readerState';
import {
  CURATED_TELEGRAM_VERSES,
  TELEGRAM_BOT_COMMANDS,
  TelegramReplyMarkup,
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
  formatVideosMessage,
  formatZikrMessage,
  getCuratedVerseForDate,
  getTelegramAyahAudioUrl,
  parseTelegramCommand,
} from '../lib/telegramBot';
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

async function sendTelegramAyahAudio(
  token: string,
  chatId: number | string,
  surahNumber: number,
  ayahNumber: number
) {
  const surah = findSurahForTelegramQuery(String(surahNumber));
  if (!surah || ayahNumber < 1 || ayahNumber > surah.ayahCount) return;
  const audioUrl = getTelegramAyahAudioUrl(surah.number, ayahNumber);
  await callTelegramApi(token, 'sendAudio', {
    chat_id: chatId,
    audio: audioUrl,
    title: `${surah.name} surəsi (${surah.number}:${ayahNumber})`,
    performer: 'Mişari Rəşid əl-Əfasi',
    caption: `🎧 ${surah.name} surəsi, ${surah.number}:${ayahNumber} · Quran Qiraeti`,
  });
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
    const queryText = String(update.inline_query.query ?? '').slice(0, 80);
    const { longVideos, shorts } = await deps.getChannelDataForSeo();
    const results = buildInlineQueryResults(origin, queryText, [...longVideos, ...shorts]);
    await callTelegramApi(token, 'answerInlineQuery', {
      inline_query_id: inlineQueryId,
      results,
      cache_time: 120,
      is_personal: false,
    });
    return;
  }

  if (update.callback_query?.id && update.callback_query.message?.chat?.id !== undefined) {
    const cbId = String(update.callback_query.id);
    const chatId = update.callback_query.message.chat.id;
    const data = String(update.callback_query.data ?? '');

    await callTelegramApi(token, 'answerCallbackQuery', { callback_query_id: cbId });

    if (data === 'dua:next') {
      const pick = QURAN_DUAS[Math.floor(Math.random() * QURAN_DUAS.length)];
      const msg = formatDuaMessage(origin, pick);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (data === 'aye:random') {
      const pick =
        CURATED_TELEGRAM_VERSES[Math.floor(Math.random() * CURATED_TELEGRAM_VERSES.length)];
      const msg = formatVerseMessage(origin, { ...pick, heading: '✨ Seçilmiş Ayə' });
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (data.startsWith('audio:')) {
      const [, sRaw, aRaw] = data.split(':');
      const sNum = Number.parseInt(sRaw ?? '', 10);
      const aNum = Number.parseInt(aRaw ?? '', 10);
      if (sNum >= 1 && sNum <= 114 && aNum >= 1) {
        await sendTelegramAyahAudio(token, chatId, sNum, aNum);
      }
    } else if (data.startsWith('namaz:')) {
      const cityKey = data.slice('namaz:'.length);
      const city = findCityForTelegramQuery(cityKey);
      const msg = formatPrayerTimesMessage(origin, city);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (data.startsWith('zikr:')) {
      const rawCat = data.slice('zikr:'.length);
      const cat: AzkarCategory =
        rawCat === 'axsam' || rawCat === 'namaz' || rawCat === 'umumi' ? rawCat : 'seher';
      const msg = formatZikrMessage(origin, cat, Math.floor(Math.random() * 10));
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
      const msg = formatStartMessage(origin);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === 'aye' || command === 'gunun_ayesi' || command === 'ses') {
      const refMatch = args.match(/^(\d{1,3}):(\d{1,3})$/);
      if (refMatch) {
        const surahNum = Number.parseInt(refMatch[1], 10);
        const ayahNum = Number.parseInt(refMatch[2], 10);
        const surahMeta = findSurahForTelegramQuery(String(surahNum));
        if (surahMeta && ayahNum >= 1 && ayahNum <= surahMeta.ayahCount) {
          if (command === 'ses') {
            await sendTelegramAyahAudio(token, chatId, surahNum, ayahNum);
            return;
          }
          try {
            const payload = await deps.fetchSurahTranslation(surahNum);
            const ayah = payload.ayahs.find((a) => a.ayahNumber === ayahNum);
            if (ayah) {
              const msg = formatVerseMessage(origin, {
                surahNumber: surahNum,
                surahName: surahMeta.name,
                ayahNumber: ayahNum,
                arabicText: ayah.arabicText,
                translation: ayah.translation,
                heading: `📖 ${surahMeta.name} surəsi`,
              });
              await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
              return;
            }
          } catch {
            // fall back cleanly
          }
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
    } else if (command === 'dua' || command === 'dualar') {
      const pick = args
        ? QURAN_DUAS.find((d) =>
            `${d.title} ${d.translation} ${d.surahName}`.toLowerCase().includes(args.toLowerCase())
          ) ?? QURAN_DUAS[0]
        : QURAN_DUAS[Math.floor(Math.random() * QURAN_DUAS.length)];
      const msg = formatDuaMessage(origin, pick);
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
        }
        if (info.ok && info.result?.url) {
          webhookActiveUrl = info.result.url;
        }

        const isPublicProductionHost =
          reqOrigin.startsWith('https://') &&
          !reqOrigin.includes('ais-dev-') &&
          !reqOrigin.includes('127.0.0.1') &&
          !reqOrigin.includes('localhost');

        if (!webhookActiveUrl && isPublicProductionHost && !vercelAutoSyncAttempted) {
          vercelAutoSyncAttempted = true;
          const registered = await registerBotWebhookAndMenu(token, webhookSecret, miniAppOrigin);
          if (registered.webhookSet) {
            webhookActiveUrl = registered.webhookUrl;
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
