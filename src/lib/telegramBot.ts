import { AZKAR_CATEGORY_LABELS, AzkarCategory, DAILY_AZKAR } from '../data/azkar';
import { RecitationVideo } from './channel';
import { getUpcomingBlessedDays } from './hijriCalendar';
import {
  MUHAFFIZ_RECITERS,
  MuhaffizReciterId,
  getEveryAyahAudioUrl,
  getFullSurahAudioUrl,
  resolveMuhaffizReciter,
} from './muhaffiz';
import {
  PrayerLocation,
  WORLD_PRAYER_CITIES,
  calculateWeeklyPrayerSchedule,
  computeQiblaDirection,
  formatShortRemainingAz,
  getHijriPartsUmmAlQura,
  getNextPrayerCountdown,
} from './prayerTimes';
import {
  SURAH_CATALOG,
  SurahCatalogEntry,
  TOTAL_QURAN_PAGES,
  formatAzerbaijaniOrdinal,
  getJuzForPage,
  getSurahByNumber,
} from './quran';
import { normalizeBaseUrl } from './seo';

export interface TelegramBotCommandSpec {
  command: string;
  description: string;
}

export const TELEGRAM_BOT_COMMANDS: TelegramBotCommandSpec[] = [
  { command: 'start', description: 'Əsas menyu və Telegram Mini App' },
  { command: 'ses', description: 'Səsli dinlə: Ayə, Tam Surə və Qari seçimi' },
  { command: 'aye', description: 'Günün ayəsi və ya /aye 2:255' },
  { command: 'kart', description: 'Ayə şəkil kartı al (/kart 2:255)' },
  { command: 'abune', description: 'Gündəlik Cümə, ayə və namaz bildirişləri' },
  { command: 'sure', description: 'Surə oxu (/sure Yasin, /sure 36)' },
  { command: 'sehife', description: 'Mədinə Mushafı səhifəsi (/sehife 42)' },
  { command: 'namaz', description: 'Namaz vaxtları və Qiblə (/namaz Bakı)' },
  { command: 'zikr', description: 'Səhər, axşam və namaz zikrləri' },
  { command: 'teqvim', description: 'Hicri təqvim və mübarək günlər' },
  { command: 'elifba', description: 'Ərəb əlifbası və təcvid bələdçisi' },
  { command: 'axtar', description: 'Ayələrdə axtarış (/axtar səbir)' },
  { command: 'videolar', description: 'Son uzun qiraətlər və Shorts' },
];

export interface TelegramInlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
  web_app?: { url: string };
  switch_inline_query_current_chat?: string;
}

export interface TelegramReplyMarkup {
  inline_keyboard: TelegramInlineKeyboardButton[][];
}

export interface TelegramFormattedReply {
  text: string;
  reply_markup?: TelegramReplyMarkup;
}

export interface TelegramInlineArticleResult {
  type: 'article';
  id: string;
  title: string;
  description: string;
  input_message_content: {
    message_text: string;
    parse_mode: 'HTML';
    disable_web_page_preview?: boolean;
  };
  reply_markup?: TelegramReplyMarkup;
}

export interface TelegramInlineAudioResult {
  type: 'audio';
  id: string;
  audio_url: string;
  title: string;
  performer?: string;
  caption?: string;
  parse_mode?: 'HTML';
  reply_markup?: TelegramReplyMarkup;
}

export interface TelegramInlinePhotoResult {
  type: 'photo';
  id: string;
  photo_url: string;
  thumbnail_url: string;
  photo_width?: number;
  photo_height?: number;
  title?: string;
  description?: string;
  caption?: string;
  parse_mode?: 'HTML';
  reply_markup?: TelegramReplyMarkup;
}

export type TelegramInlineQueryResult =
  | TelegramInlineArticleResult
  | TelegramInlineAudioResult
  | TelegramInlinePhotoResult;

export interface CuratedTelegramVerse {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  arabicText: string;
  translation: string;
}

export const CURATED_TELEGRAM_VERSES: CuratedTelegramVerse[] = [
  {
    surahNumber: 2,
    surahName: 'Bəqərə',
    ayahNumber: 255,
    arabicText: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ',
    translation:
      'Allah — Ondan başqa ibadətə layiq olan məbud yoxdur, əbədi Yaşayandır, bütün yaratdıqlarının Qəyyumudur. Onu nə mürgü, nə də yuxu tutar.',
  },
  {
    surahNumber: 2,
    surahName: 'Bəqərə',
    ayahNumber: 286,
    arabicText: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ',
    translation:
      'Allah hər kəsi yalnız onun qüvvəsi çatdığı qədər yükləyər. Hər kəsin qazandığı (xeyir yalnız) özünə, qazandığı (şər də yalnız) öz əleyhinədir.',
  },
  {
    surahNumber: 94,
    surahName: 'Şərh',
    ayahNumber: 5,
    arabicText: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation:
      'Şübhəsiz ki, hər çətinlikdən sonra bir asanlıq gəlir! Həqiqətən, hər çətinliklə yanaşı bir asanlıq vardır!',
  },
  {
    surahNumber: 2,
    surahName: 'Bəqərə',
    ayahNumber: 152,
    arabicText: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
    translation: 'Məni yad edin ki, Mən də sizi yad edim! Mənə şükür edin, küfr etməyin!',
  },
  {
    surahNumber: 13,
    surahName: 'Rəd',
    ayahNumber: 28,
    arabicText: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    translation: 'Bilin ki, qəlblər yalnız Allahı zikr etməklə rahatlıq tapır!',
  },
  {
    surahNumber: 3,
    surahName: 'Ali-İmran',
    ayahNumber: 139,
    arabicText: 'وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ',
    translation: 'Acizlik göstərməyin və kədərlənməyin! Əgər möminsinizsə, üstün olan məhz sizsiniz.',
  },
  {
    surahNumber: 65,
    surahName: 'Təlaq',
    ayahNumber: 3,
    arabicText: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    translation: 'Kim Allaha təvəkkül etsə, (Allah) ona kifayət edər.',
  },
  {
    surahNumber: 55,
    surahName: 'Rəhman',
    ayahNumber: 13,
    arabicText: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ',
    translation: 'Elə isə Rəbbinizin hansı nemətlərini yalan sayırsınız?!',
  },
  {
    surahNumber: 39,
    surahName: 'Zumər',
    ayahNumber: 53,
    arabicText: 'لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا',
    translation: 'Allahın rəhmətindən ümidinizi üzməyin. Şübhəsiz ki, Allah bütün günahları bağışlayar.',
  },
  {
    surahNumber: 112,
    surahName: 'İxlas',
    ayahNumber: 1,
    arabicText: 'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ',
    translation: 'De: "O Allah Təkdir! Allah Möhtac deyildir (hər şey Ona möhtacdır).',
  },
];

export function escapeTelegramHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function normalizeAzSearchText(value: string): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/ə/g, 'e')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[^a-z0-9\u0600-\u06ff:\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseTelegramCommand(text?: string): { command: string; args: string } | null {
  const trimmed = String(text ?? '').trim();
  if (!trimmed.startsWith('/')) return null;
  const match = trimmed.match(
    /^\/([a-zA-Z0-9_əöüşçğıƏÖÜŞÇĞI]+)(?:@[a-zA-Z0-9_]+)?(?:\s+([\s\S]*))?$/
  );
  if (!match) return null;
  return {
    command: normalizeAzSearchText(match[1]),
    args: (match[2] ?? '').trim(),
  };
}

export function findSurahForTelegramQuery(query: string): SurahCatalogEntry | undefined {
  const clean = normalizeAzSearchText(query);
  if (!clean) return undefined;

  if (/^\d{1,3}$/.test(clean)) {
    return getSurahByNumber(Number.parseInt(clean, 10));
  }

  const normalizedWithoutPrefix = clean
    .replace(/\bsuresi\b/g, '')
    .replace(/\bsura\b/g, '')
    .replace(/\bsure\b/g, '')
    .trim();

  const surahAliases: Record<string, number> = {
    fatiha: 1,
    'al fatiha': 1,
    baqara: 2,
    bakara: 2,
    baqarah: 2,
    'ayatul kursi': 2,
    imran: 3,
    nisa: 4,
    maida: 5,
    kahf: 18,
    maryam: 19,
    taha: 20,
    yasin: 36,
    yaasin: 36,
    rahman: 55,
    waqiah: 56,
    mulk: 67,
    tebareke: 67,
    naba: 78,
    insirah: 94,
    qadr: 97,
    asr: 103,
    kevser: 108,
    ikhlas: 112,
    ihlas: 112,
    falaq: 113,
    nas: 114,
  };

  if (surahAliases[normalizedWithoutPrefix]) {
    return getSurahByNumber(surahAliases[normalizedWithoutPrefix]);
  }

  const exact = SURAH_CATALOG.find((s) => {
    const nAz = normalizeAzSearchText(s.name);
    const nAr = normalizeAzSearchText(s.arabicName);
    return nAz === normalizedWithoutPrefix || nAr === normalizedWithoutPrefix;
  });
  if (exact) return exact;

  return SURAH_CATALOG.find((s) => {
    const nAz = normalizeAzSearchText(s.name);
    return nAz.startsWith(normalizedWithoutPrefix) || nAz.includes(normalizedWithoutPrefix);
  });
}

export function findCityForTelegramQuery(query: string): PrayerLocation {
  const clean = normalizeAzSearchText(query);
  if (!clean) return WORLD_PRAYER_CITIES[0];

  const aliases: Record<string, string> = {
    baku: 'baku',
    baki: 'baku',
    gence: 'ganja',
    ganja: 'ganja',
    seki: 'shaki',
    shaki: 'shaki',
    samaxi: 'shamakhi',
    shamakhi: 'shamakhi',
    lenkeran: 'lankaran',
    lankaran: 'lankaran',
    naxcivan: 'nakhchivan',
    nakhchivan: 'nakhchivan',
    susa: 'shusha',
    shusha: 'shusha',
    mekke: 'makkah',
    makkah: 'makkah',
    medine: 'madinah',
    madinah: 'madinah',
    ebudabi: 'abudhabi',
    'ebu dabi': 'abudhabi',
    erzurum: 'erzurum',
  };

  const aliasId = aliases[clean];
  if (aliasId) {
    const aliased = WORLD_PRAYER_CITIES.find((c) => c.id === aliasId);
    if (aliased) return aliased;
  }

  const matched = WORLD_PRAYER_CITIES.find((c) => {
    const cityNorm = normalizeAzSearchText(c.name);
    const idNorm = normalizeAzSearchText(c.id);
    return cityNorm === clean || idNorm === clean || cityNorm.includes(clean);
  });

  return matched ?? WORLD_PRAYER_CITIES[0];
}

export function getCuratedVerseForDate(now: Date = new Date()): CuratedTelegramVerse {
  const dayIndex = Math.floor(now.getTime() / 86_400_000);
  return CURATED_TELEGRAM_VERSES[Math.abs(dayIndex) % CURATED_TELEGRAM_VERSES.length];
}

export function getTelegramAyahAudioUrl(
  surahNumber: number,
  ayahNumber: number,
  reciterInput?: string
): string {
  const reciter = resolveMuhaffizReciter(reciterInput);
  return getEveryAyahAudioUrl(surahNumber, ayahNumber, reciter.id);
}

export function getTelegramSurahAudioUrl(
  surahNumber: number,
  reciterInput?: string
): string {
  const reciter = resolveMuhaffizReciter(reciterInput);
  return getFullSurahAudioUrl(surahNumber, reciter.id);
}

const QARI_TOKEN_PATTERNS: Array<{ pattern: RegExp; id: MuhaffizReciterId }> = [
  { pattern: /\b(maher|mahir|muayqil|mueyqil)\b/i, id: 'MaherAlMuaiqly128kbps' },
  { pattern: /\b(yasser|yasir|dosari|dossary|dovseri)\b/i, id: 'Yasser_Ad-Dussary_128kbps' },
  { pattern: /\b(husary|husari|huseri|xalil|xelil)\b/i, id: 'Husary_128kbps' },
  { pattern: /\b(minshawy|minshawi|minsawi|minsavi|siddiq)\b/i, id: 'Minshawy_Murattal_128kbps' },
  { pattern: /\b(basit|abdulbasit|ebdulbasit)\b/i, id: 'Abdul_Basit_Murattal_192kbps' },
  { pattern: /\b(afasy|alafasy|efesi|misari|mishari|mishary)\b/i, id: 'Alafasy_128kbps' },
];

export function parseAudioQueryArgs(args: string): {
  surahNumber: number;
  ayahNumber: number;
  reciterId: MuhaffizReciterId;
  hasExplicitTarget: boolean;
} {
  let working = normalizeAzSearchText(args);
  let reciterId: MuhaffizReciterId = 'Alafasy_128kbps';

  for (const item of QARI_TOKEN_PATTERNS) {
    if (item.pattern.test(working)) {
      reciterId = item.id;
      working = working.replace(item.pattern, ' ').replace(/\s+/g, ' ').trim();
      break;
    }
  }

  const refMatch = working.match(/\b(\d{1,3}):(\d{1,3})\b/);
  if (refMatch) {
    const sNum = Number.parseInt(refMatch[1], 10);
    const aNum = Number.parseInt(refMatch[2], 10);
    const surah = getSurahByNumber(sNum);
    if (surah) {
      return {
        surahNumber: surah.number,
        ayahNumber: Math.max(1, Math.min(surah.ayahCount, aNum)),
        reciterId,
        hasExplicitTarget: true,
      };
    }
  }

  const nameAndAyahMatch = working.match(/^(.+?)\s+(\d{1,3})$/);
  if (nameAndAyahMatch) {
    const surah = findSurahForTelegramQuery(nameAndAyahMatch[1]);
    const aNum = Number.parseInt(nameAndAyahMatch[2], 10);
    if (surah) {
      return {
        surahNumber: surah.number,
        ayahNumber: Math.max(1, Math.min(surah.ayahCount, aNum)),
        reciterId,
        hasExplicitTarget: true,
      };
    }
  }

  if (working) {
    const surah = findSurahForTelegramQuery(working);
    if (surah) {
      return {
        surahNumber: surah.number,
        ayahNumber: 1,
        reciterId,
        hasExplicitTarget: true,
      };
    }
  }

  const fallbackVerse = getCuratedVerseForDate();
  return {
    surahNumber: fallbackVerse.surahNumber,
    ayahNumber: fallbackVerse.ayahNumber,
    reciterId,
    hasExplicitTarget: false,
  };
}

export function parseKartQueryArgs(args: string): {
  surahNumber: number;
  ayahNumber: number;
  theme: 'emerald' | 'parchment';
  format: 'story' | 'square';
  hasExplicitTarget: boolean;
} {
  let working = normalizeAzSearchText(args);
  let theme: 'emerald' | 'parchment' = 'emerald';
  let format: 'story' | 'square' = 'story';

  if (/\b(parchment|aciq|ag|light|krem)\b/.test(working)) {
    theme = 'parchment';
    working = working.replace(/\b(parchment|aciq|ag|light|krem)\b/g, ' ').trim();
  } else if (/\b(emerald|zumrud|tund|dark)\b/.test(working)) {
    theme = 'emerald';
    working = working.replace(/\b(emerald|zumrud|tund|dark)\b/g, ' ').trim();
  }

  if (/\b(square|kvadrat|1:1)\b/.test(working)) {
    format = 'square';
    working = working.replace(/\b(square|kvadrat|1:1)\b/g, ' ').trim();
  } else if (/\b(story|hekaye|status|9:16)\b/.test(working)) {
    format = 'story';
    working = working.replace(/\b(story|hekaye|status|9:16)\b/g, ' ').trim();
  }

  const target = parseAudioQueryArgs(working);
  return {
    surahNumber: target.surahNumber,
    ayahNumber: target.ayahNumber,
    theme,
    format,
    hasExplicitTarget: target.hasExplicitTarget,
  };
}

export function parseInlineAyahRef(query: string): {
  surahNumber: number;
  ayahNumber: number;
  reciterId: MuhaffizReciterId;
} | null {
  let working = normalizeAzSearchText(query);
  if (!working) return null;

  let reciterId: MuhaffizReciterId = 'Alafasy_128kbps';
  for (const item of QARI_TOKEN_PATTERNS) {
    if (item.pattern.test(working)) {
      reciterId = item.id;
      working = working.replace(item.pattern, ' ').replace(/\s+/g, ' ').trim();
      break;
    }
  }

  const refMatch = working.match(/^(\d{1,3}):(\d{1,3})$/);
  if (refMatch) {
    const sNum = Number.parseInt(refMatch[1], 10);
    const aNum = Number.parseInt(refMatch[2], 10);
    const surah = getSurahByNumber(sNum);
    if (surah && aNum >= 1 && aNum <= surah.ayahCount) {
      return { surahNumber: surah.number, ayahNumber: aNum, reciterId };
    }
  }

  const nameAndAyahMatch = working.match(/^(.+?)\s+(\d{1,3})$/);
  if (nameAndAyahMatch) {
    const surah = findSurahForTelegramQuery(nameAndAyahMatch[1]);
    const aNum = Number.parseInt(nameAndAyahMatch[2], 10);
    if (surah && aNum >= 1 && aNum <= surah.ayahCount) {
      return { surahNumber: surah.number, ayahNumber: aNum, reciterId };
    }
  }

  return null;
}

export function resolveTelegramStartParamPath(startParam?: string): string {
  const raw = String(startParam ?? '').trim();
  if (!raw) return '/';

  const ayahDeepMatch = raw.match(/^(?:aye|ses|kart)_(\d{1,3})_(\d{1,3})$/i);
  if (ayahDeepMatch) {
    const s = Number.parseInt(ayahDeepMatch[1], 10);
    const a = Number.parseInt(ayahDeepMatch[2], 10);
    if (s >= 1 && s <= 114 && a >= 1) {
      return `/quran/sure/${s}#ayah-${a}`;
    }
  }

  const surahMatch = raw.match(/^sure_(\d{1,3})$/i);
  if (surahMatch) {
    const n = Number.parseInt(surahMatch[1], 10);
    if (n >= 1 && n <= 114) return `/quran/sure/${n}`;
  }

  const pageMatch = raw.match(/^sehife_(\d{1,3})$/i);
  if (pageMatch) {
    const p = Number.parseInt(pageMatch[1], 10);
    if (p >= 1 && p <= TOTAL_QURAN_PAGES) return `/quran/sehife/${p}`;
  }

  const muhaffizMatch = raw.match(/^muhaffiz_(\d{1,3})$/i);
  if (muhaffizMatch) {
    const p = Number.parseInt(muhaffizMatch[1], 10);
    if (p >= 1 && p <= TOTAL_QURAN_PAGES) return `/muhaffiz/${p}`;
  }

  const videoMatch = raw.match(/^video_([a-zA-Z0-9_-]{4,20})$/);
  if (videoMatch) {
    return `/video/${videoMatch[1]}`;
  }

  const staticRoutes: Record<string, string> = {
    quran: '/quran',
    shorts: '/shorts',
    dualar: '/dualar',
    elifba: '/elifba',
    zikr: '/zikr',
    namaz: '/namaz-vaxtlari',
    abune: '/namaz-vaxtlari',
    qible: '/qible',
    teqvim: '/teqvim',
    muhaffiz: '/muhaffiz',
    gunun_ayesi: '/gunun-ayesi',
  };

  return staticRoutes[raw.toLowerCase()] ?? '/';
}

function buildMiniAppButton(text: string, url: string): TelegramInlineKeyboardButton {
  return {
    text,
    web_app: { url },
  };
}

function mapCallbackToBotDeepLink(callbackData: string, botUsername: string): string | null {
  const cleanBot = botUsername.replace(/^@/, '') || 'Quranqiraetibot';
  const amenuMatch = callbackData.match(/^(?:amenu|aplay:(?:ayah|surah)|audio):(\d{1,3}):(\d{1,3}):/);
  if (amenuMatch) {
    return `https://t.me/${cleanBot}?start=ses_${amenuMatch[1]}_${amenuMatch[2]}`;
  }
  const kartMatch = callbackData.match(/^kart:(\d{1,3}):(\d{1,3}):/);
  if (kartMatch) {
    return `https://t.me/${cleanBot}?start=kart_${kartMatch[1]}_${kartMatch[2]}`;
  }
  if (callbackData.startsWith('namaz:')) {
    return `https://t.me/${cleanBot}?start=namaz`;
  }
  if (callbackData.startsWith('zikr:')) {
    return `https://t.me/${cleanBot}?start=zikr`;
  }
  if (callbackData === 'teqvim:now') {
    return `https://t.me/${cleanBot}?start=teqvim`;
  }
  if (callbackData === 'aye:random') {
    return `https://t.me/${cleanBot}?start=gunun_ayesi`;
  }
  if (callbackData.startsWith('sub:')) {
    return `https://t.me/${cleanBot}?start=abune`;
  }
  return null;
}

export function toShareableInlineMarkup(
  markup: TelegramReplyMarkup | undefined,
  botUsername = 'Quranqiraetibot'
): TelegramReplyMarkup | undefined {
  if (!markup?.inline_keyboard?.length) return undefined;
  const convertedRows: TelegramInlineKeyboardButton[][] = [];

  for (const row of markup.inline_keyboard) {
    const nextRow: TelegramInlineKeyboardButton[] = [];
    for (const btn of row) {
      if (btn.web_app?.url) {
        nextRow.push({ text: btn.text, url: btn.web_app.url });
      } else if (btn.url) {
        nextRow.push({ text: btn.text, url: btn.url });
      } else if (btn.callback_data) {
        const mapped = mapCallbackToBotDeepLink(btn.callback_data, botUsername);
        if (mapped) {
          nextRow.push({ text: btn.text, url: mapped });
        }
      } else if (btn.switch_inline_query_current_chat !== undefined) {
        nextRow.push({
          text: btn.text,
          switch_inline_query_current_chat: btn.switch_inline_query_current_chat,
        });
      }
    }
    if (nextRow.length > 0) {
      convertedRows.push(nextRow);
    }
  }

  return convertedRows.length > 0 ? { inline_keyboard: convertedRows } : undefined;
}

export function formatStartMessage(origin: string): TelegramFormattedReply {
  const baseUrl = normalizeBaseUrl(origin);
  const text = [
    '<b>Əssəlamu aleykum!</b> 🌙',
    '<b>Quran Qiraeti</b> rəsmi Telegram botuna və Mini Tətbiqinə xoş gəlmisiniz.',
    '',
    '<b>Söhbətdə istifadə edə biləcəyiniz əmrlər:</b>',
    '• /ses — Səsli dinlə: Ayə, Tam Surə və Qari seçimi <i>(məs. /ses Yasin)</i>',
    '• /aye — Günün ayəsi və səsli tilavət <i>(və ya /aye 2:255)</i>',
    '• /kart — WhatsApp / Story üçün hazır ayə şəkil kartı <i>(məs. /kart 2:255)</i>',
    '• /abune — Gündəlik Cümə Kəhf, ayə və namaz bildirişləri',
    '• /sure — Surə oxu və dinlə <i>(məs. /sure Yasin)</i>',
    '• /sehife — Mədinə Mushafı səhifəsi <i>(məs. /sehife 42)</i>',
    '• /namaz — Namaz vaxtları və Qiblə <i>(məs. /namaz Bakı)</i>',
    '• /zikr — Səhər, axşam və namaz sonrası zikrlər',
    '• /teqvim — Hicri təqvim və mübarək günlər sayğacı',
    '• /elifba — Ərəb əlifbası və təcvid bələdçisi',
    '• /axtar — Ayələrdə axtarış <i>(məs. /axtar səbir)</i>',
    '• /videolar — Kanalın son uzun qiraətləri və Shorts',
    '',
    'Tam <b>604 səhifəlik Mədinə Mushafı, 114 surə və Mühafiz əzbər alətini</b> birbaşa Telegram içində aça bilərsiniz:',
  ].join('\n');

  return {
    text,
    reply_markup: {
      inline_keyboard: [
        [buildMiniAppButton('📖 Quranı Aç (Mini App)', `${baseUrl}/quran`)],
        [
          buildMiniAppButton('🕋 Namaz Vaxtları', `${baseUrl}/namaz-vaxtlari`),
          buildMiniAppButton('🧠 Mühafiz Əzbər', `${baseUrl}/muhaffiz`),
        ],
        [
          { text: '🎧 Səsli Dinlə', callback_data: 'amenu:1:1:afasy' },
          { text: '🌅 Günün Ayəsi', callback_data: 'aye:random' },
        ],
        [
          { text: '🖼 Ayə Kartı (2:255)', callback_data: 'kart:2:255:emerald' },
          { text: '🔔 Gündəlik Abunəlik', callback_data: 'sub:menu' },
        ],
        [
          { text: '📿 Zikr', callback_data: 'zikr:seher' },
          { text: '📅 Hicri Təqvim', callback_data: 'teqvim:now' },
        ],
        [
          { text: '🔎 Çatda Paylaş (Inline)', switch_inline_query_current_chat: '2:255' },
        ],
        [
          buildMiniAppButton('🔤 Əlifba & Təcvid', `${baseUrl}/elifba`),
          { text: '📺 YouTube Kanal', url: 'https://youtube.com/@quranqiraeti' },
        ],
      ],
    },
  };
}

export function formatAudioSelectorMessage(
  origin: string,
  params: {
    surahNumber: number;
    ayahNumber: number;
    reciterInput?: string;
    showPresets?: boolean;
  }
): TelegramFormattedReply {
  const baseUrl = normalizeBaseUrl(origin);
  const surah = getSurahByNumber(params.surahNumber) ?? getSurahByNumber(1)!;
  const safeAyah = Math.max(1, Math.min(surah.ayahCount, Math.trunc(params.ayahNumber || 1)));
  const reciter = resolveMuhaffizReciter(params.reciterInput);

  const lines = [
    '<b>🎧 Səsli Tilavət — Ayə, Tam Surə və Qari Seçimi</b>',
    '',
    `📖 <b>Surə:</b> ${surah.number}. ${escapeTelegramHtml(surah.name)} (${escapeTelegramHtml(surah.arabicName)})`,
    `🔖 <b>Seçilmiş Ayə:</b> ${surah.number}:${safeAyah} (${surah.ayahCount} ayə)`,
    `🎙 <b>Qari:</b> ${escapeTelegramHtml(reciter.label)}`,
    '',
    'Aşağıdan <b>tək ayəni</b> və ya <b>tam surəni</b> dinləyin, istədiyiniz zaman qarini dəyişin:',
    '<i>Məsələn: /ses Yasin, /ses 2:255, /ses Rəhman maher</i>',
  ];

  const qariRow1 = MUHAFFIZ_RECITERS.slice(0, 3).map((r) => ({
    text: r.id === reciter.id ? `✓ ${r.shortLabel}` : r.shortLabel,
    callback_data: `asrc:${surah.number}:${safeAyah}:${r.code}`,
  }));

  const qariRow2 = MUHAFFIZ_RECITERS.slice(3, 6).map((r) => ({
    text: r.id === reciter.id ? `✓ ${r.shortLabel}` : r.shortLabel,
    callback_data: `asrc:${surah.number}:${safeAyah}:${r.code}`,
  }));

  const keyboard: TelegramInlineKeyboardButton[][] = [
    [
      {
        text: `🎧 Ayəni Dinlə (${surah.number}:${safeAyah})`,
        callback_data: `aplay:ayah:${surah.number}:${safeAyah}:${reciter.code}`,
      },
      {
        text: `📀 Tam Surə (${surah.name})`,
        callback_data: `aplay:surah:${surah.number}:${safeAyah}:${reciter.code}`,
      },
    ],
    qariRow1,
    qariRow2,
  ];

  if (params.showPresets) {
    keyboard.push([
      { text: 'Fatihə', callback_data: `asrc:1:1:${reciter.code}` },
      { text: 'Ayətül-Kürsi', callback_data: `asrc:2:255:${reciter.code}` },
      { text: 'Yasin', callback_data: `asrc:36:1:${reciter.code}` },
      { text: 'Rəhman', callback_data: `asrc:55:1:${reciter.code}` },
      { text: 'Mülk', callback_data: `asrc:67:1:${reciter.code}` },
    ]);
  }

  keyboard.push([
    buildMiniAppButton(
      `📖 ${surah.name} — Tətbiqdə Tam Dinlə`,
      `${baseUrl}/quran/sure/${surah.number}?reciter=${encodeURIComponent(reciter.id)}#ayah-${safeAyah}`
    ),
  ]);

  return {
    text: lines.join('\n'),
    reply_markup: { inline_keyboard: keyboard },
  };
}

export function formatVerseMessage(
  origin: string,
  params: {
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    arabicText: string;
    translation: string;
    heading?: string;
  }
): TelegramFormattedReply {
  const baseUrl = normalizeBaseUrl(origin);
  const heading = params.heading || '✨ Günün Ayəsi';
  const text = [
    `<b>${escapeTelegramHtml(heading)}</b>`,
    `<i>${escapeTelegramHtml(params.surahName)} surəsi, ${params.surahNumber}:${params.ayahNumber}</i>`,
    '',
    `${escapeTelegramHtml(params.arabicText)} ﴿${params.ayahNumber}﴾`,
    '',
    `«${escapeTelegramHtml(params.translation)}»`,
    '<i>Tərcümə: Əlixan Musayev</i>',
  ].join('\n');

  return {
    text,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎧 Səsli Dinlə (Ayə / Surə / Qari)',
            callback_data: `amenu:${params.surahNumber}:${params.ayahNumber}:afasy`,
          },
          buildMiniAppButton(
            `📖 Surədə aç`,
            `${baseUrl}/quran/sure/${params.surahNumber}#ayah-${params.ayahNumber}`
          ),
        ],
        [
          {
            text: '🖼 Şəkil Kartı Al',
            callback_data: `kart:${params.surahNumber}:${params.ayahNumber}:emerald`,
          },
          { text: '🔄 Başqa Ayə', callback_data: 'aye:random' },
        ],
      ],
    },
  };
}

export function formatSurahMessage(
  origin: string,
  surah: SurahCatalogEntry,
  sampleAyahs: Array<{ ayahNumber: number; arabicText: string; translation: string }> = []
): TelegramFormattedReply {
  const baseUrl = normalizeBaseUrl(origin);
  const lines = [
    `<b>📖 ${surah.number}. ${escapeTelegramHtml(surah.name)} surəsi</b> (${escapeTelegramHtml(surah.arabicName)})`,
    `${surah.ayahCount} ayə · ${escapeTelegramHtml(surah.revelationPlace)} · Mədinə Mushafı: Səhifə ${surah.startPage}`,
  ];

  if (sampleAyahs.length > 0) {
    lines.push('');
    for (const a of sampleAyahs.slice(0, 2)) {
      lines.push(`${escapeTelegramHtml(a.arabicText)} ﴿${a.ayahNumber}﴾`);
      lines.push(`<b>${a.ayahNumber}.</b> ${escapeTelegramHtml(a.translation)}`);
      lines.push('');
    }
  } else {
    lines.push('', 'Tam ərəbcə mətn, səsli tilavət və Əlixan Musayev tərcüməsi üçün tətbiqdə açın:');
  }

  return {
    text: lines.join('\n').trim(),
    reply_markup: {
      inline_keyboard: [
        [buildMiniAppButton(`📖 ${surah.name} surəsini oxu`, `${baseUrl}/quran/sure/${surah.number}`)],
        [
          {
            text: '🎧 Səsli Dinlə (Ayə / Tam Surə / Qari)',
            callback_data: `amenu:${surah.number}:1:afasy`,
          },
          {
            text: '📀 Tam Surə MP3',
            callback_data: `aplay:surah:${surah.number}:1:afasy`,
          },
        ],
        [
          buildMiniAppButton(`📄 Səhifə ${surah.startPage}`, `${baseUrl}/quran/sehife/${surah.startPage}`),
          buildMiniAppButton('🧠 Mühafiz', `${baseUrl}/muhaffiz/${surah.startPage}`),
        ],
      ],
    },
  };
}

export function formatMushafPageMessage(
  origin: string,
  pageNumber: number,
  summaryText = '',
  sampleAyahs: Array<{ surahName: string; ayahNumber: number; arabicText: string; translation: string }> = []
): TelegramFormattedReply {
  const baseUrl = normalizeBaseUrl(origin);
  const safePage = Math.max(1, Math.min(TOTAL_QURAN_PAGES, Math.trunc(pageNumber)));
  const juz = getJuzForPage(safePage);
  const ordinal = formatAzerbaijaniOrdinal(safePage);

  const lines = [
    `<b>📄 Mədinə Mushafı — ${ordinal} səhifə</b> (${juz}-ci Cüz)`,
    ...(summaryText ? [`<i>${escapeTelegramHtml(summaryText)}</i>`] : []),
    '',
  ];

  if (sampleAyahs.length > 0) {
    for (const a of sampleAyahs.slice(0, 2)) {
      lines.push(`${escapeTelegramHtml(a.arabicText)} ﴿${a.ayahNumber}﴾`);
      lines.push(`<b>${escapeTelegramHtml(a.surahName)} ${a.ayahNumber}:</b> ${escapeTelegramHtml(a.translation)}`);
      lines.push('');
    }
  } else {
    lines.push('Bu səhifəni tam ərəbcə mətn, təcvid rəngləməsi və qiraət ilə açın:');
  }

  const navRow: TelegramInlineKeyboardButton[] = [];
  if (safePage > 1) {
    navRow.push({ text: `⬅️ Səhifə ${safePage - 1}`, callback_data: `mushaf:${safePage - 1}` });
  }
  if (safePage < TOTAL_QURAN_PAGES) {
    navRow.push({ text: `Səhifə ${safePage + 1} ➡️`, callback_data: `mushaf:${safePage + 1}` });
  }

  return {
    text: lines.join('\n').trim(),
    reply_markup: {
      inline_keyboard: [
        [
          buildMiniAppButton(`📖 Səhifə ${safePage} Oxu`, `${baseUrl}/quran/sehife/${safePage}`),
          buildMiniAppButton('🧠 Mühafizdə Əzbərlə', `${baseUrl}/muhaffiz/${safePage}`),
        ],
        ...(navRow.length > 0 ? [navRow] : []),
      ],
    },
  };
}

export function formatPrayerTimesMessage(
  origin: string,
  city: PrayerLocation,
  now: Date = new Date()
): TelegramFormattedReply {
  const baseUrl = normalizeBaseUrl(origin);
  const schedule = calculateWeeklyPrayerSchedule(city, now, 1)[0];
  const countdown = getNextPrayerCountdown(city, now);
  const qibla = computeQiblaDirection(city.lat, city.lng);

  const lines = [
    `<b>🕋 Namaz Vaxtları — ${escapeTelegramHtml(city.name)}</b> (${escapeTelegramHtml(city.countryName)})`,
    `📅 ${escapeTelegramHtml(schedule.gregorianLabel)} · ${escapeTelegramHtml(schedule.hijriLabel)}`,
    '',
    ...schedule.times.map(
      (t) =>
        `${t.key === countdown.nextPrayer.key ? '👉 ' : '• '}<b>${escapeTelegramHtml(t.label)}:</b> <code>${escapeTelegramHtml(t.formattedTime)}</code>`
    ),
    '',
    `⏳ Növbəti vaxt: <b>${escapeTelegramHtml(countdown.nextPrayer.label)}</b> (${escapeTelegramHtml(formatShortRemainingAz(countdown.secondsRemaining))})`,
    `🧭 Qiblə bucağı: <b>${qibla.bearingDegrees}°</b> (${escapeTelegramHtml(qibla.cardinalLabel)} · ${qibla.distanceKm} km)`,
  ];

  return {
    text: lines.join('\n'),
    reply_markup: {
      inline_keyboard: [
        [
          buildMiniAppButton('🕋 Tam Cədvəl & Xəritə', `${baseUrl}/namaz-vaxtlari`),
          buildMiniAppButton('🧭 Canlı Qiblə', `${baseUrl}/qible`),
        ],
        [
          { text: 'Bakı', callback_data: 'namaz:baku' },
          { text: 'Gəncə', callback_data: 'namaz:ganja' },
          { text: 'Sumqayıt', callback_data: 'namaz:sumqayit' },
          { text: 'Naxçıvan', callback_data: 'namaz:nakhchivan' },
        ],
        [
          { text: 'Şəki', callback_data: 'namaz:shaki' },
          { text: 'Şuşa', callback_data: 'namaz:shusha' },
          { text: 'İstanbul', callback_data: 'namaz:istanbul' },
          { text: 'Məkkə', callback_data: 'namaz:makkah' },
        ],
      ],
    },
  };
}

export function formatZikrMessage(
  origin: string,
  category: AzkarCategory = 'seher',
  indexOffset = 0
): TelegramFormattedReply {
  const baseUrl = normalizeBaseUrl(origin);
  const pool = DAILY_AZKAR.filter((item) => item.category === category);
  const effectivePool = pool.length > 0 ? pool : DAILY_AZKAR;
  const idx = Math.abs(indexOffset) % effectivePool.length;
  const item = effectivePool[idx];
  const categoryLabel = AZKAR_CATEGORY_LABELS[category] ?? 'Zikr və Təsbih';

  const text = [
    `<b>📿 ${escapeTelegramHtml(categoryLabel)} — ${escapeTelegramHtml(item.title)}</b>`,
    `<i>Tövsiyə sayı: ${item.targetCount} dəfə · ${escapeTelegramHtml(item.source)}</i>`,
    '',
    escapeTelegramHtml(item.arabicText),
    '',
    `«${escapeTelegramHtml(item.translation)}»`,
    '',
    `<i>✨ ${escapeTelegramHtml(item.virtue)}</i>`,
  ].join('\n');

  return {
    text,
    reply_markup: {
      inline_keyboard: [
        [buildMiniAppButton('📿 Təsbih Sayğacını Aç', `${baseUrl}/zikr`)],
        [
          { text: '🌅 Səhər', callback_data: 'zikr:seher' },
          { text: '🌙 Axşam', callback_data: 'zikr:axsam' },
          { text: '🕌 Namaz sonrası', callback_data: 'zikr:namaz' },
        ],
      ],
    },
  };
}

export function formatHijriCalendarMessage(
  origin: string,
  now: Date = new Date()
): TelegramFormattedReply {
  const baseUrl = normalizeBaseUrl(origin);
  const todayHijri = getHijriPartsUmmAlQura(now, 'Asia/Baku');
  const upcoming = getUpcomingBlessedDays(now, 5);

  const lines = [
    '<b>📅 Hicri–Miladi Təqvim (Ümmül-Qura)</b>',
    `🌙 Bu gün (Hicri): <b>${escapeTelegramHtml(todayHijri.formatted)}</b>`,
    '',
    '<b>Qarşıdakı Mübarək Günlər:</b>',
    ...upcoming.map(
      (item) =>
        `• <b>${escapeTelegramHtml(item.title)}</b>\n   ${escapeTelegramHtml(item.hijriLabel)} (${escapeTelegramHtml(item.gregorianLabel)}) — <b>${item.daysRemaining === 0 ? 'Bu gün!' : `${item.daysRemaining} gün qalıb`}</b>`
    ),
  ];

  return {
    text: lines.join('\n'),
    reply_markup: {
      inline_keyboard: [
        [
          buildMiniAppButton('📅 Tarix Çevirici & Təqvim', `${baseUrl}/teqvim`),
          buildMiniAppButton('🕋 Namaz Vaxtları', `${baseUrl}/namaz-vaxtlari`),
        ],
      ],
    },
  };
}

export function formatAlphabetMessage(origin: string): TelegramFormattedReply {
  const baseUrl = normalizeBaseUrl(origin);
  const text = [
    '<b>🔤 Ərəb Əlifbası, Hərəkələr və Təcvid Bələdçisi</b>',
    '',
    '• 28 ərəb hərfinin tək, başda, ortada və sonda yazılış formaları',
    '• Hər bir hərfin məxrəc nöqtəsi (boğaz, dil, dodaq) və səsli tələffüzü',
    '• Canlı Hərəkə Qurucusu (Fəthə, Kəsrə, Dəmmə, Tənvin, Şəddə, Sükun)',
    '• Əsas Təcvid qaydaları (Qalqalə, Ğünnə, İxfa, İdğam, Mədd) Quran ayələri üzərində nümunələrlə',
  ].join('\n');

  return {
    text,
    reply_markup: {
      inline_keyboard: [
        [buildMiniAppButton('🔤 İnteraktiv Əlifba Bələdçisini Aç', `${baseUrl}/elifba`)],
        [buildMiniAppButton('🧠 Mühafiz Əzbər Mushafı', `${baseUrl}/muhaffiz`)],
      ],
    },
  };
}

export function formatVideosMessage(
  origin: string,
  videos: RecitationVideo[],
  heading = '🎬 Kanalın Seçilmiş Quran Tilavətləri'
): TelegramFormattedReply {
  const baseUrl = normalizeBaseUrl(origin);
  const top = videos.slice(0, 6);
  const lines = [
    `<b>${escapeTelegramHtml(heading)}</b>`,
    '',
    ...top.map(
      (v, idx) =>
        `${idx + 1}. <b>${escapeTelegramHtml(v.title)}</b>\n   🎙 ${escapeTelegramHtml(v.reciter)} · ⏱ ${escapeTelegramHtml(v.duration)}`
    ),
  ];

  const buttonRows: TelegramInlineKeyboardButton[][] = top.slice(0, 4).map((v) => [
    buildMiniAppButton(`▶️ ${v.surahName} (${v.ayahRange})`, `${baseUrl}/video/${v.videoId}`),
  ]);
  buttonRows.push([
    buildMiniAppButton('🎬 Bütün Shorts', `${baseUrl}/shorts`),
    { text: '📺 YouTube', url: 'https://youtube.com/@quranqiraeti' },
  ]);

  return {
    text: lines.join('\n'),
    reply_markup: {
      inline_keyboard: buttonRows,
    },
  };
}

export function buildInlineAyahResults(
  origin: string,
  botUsername: string,
  verse: CuratedTelegramVerse,
  reciterInput?: string
): TelegramInlineQueryResult[] {
  const baseUrl = normalizeBaseUrl(origin);
  const cleanBot = botUsername.replace(/^@/, '') || 'Quranqiraetibot';
  const reciter = resolveMuhaffizReciter(reciterInput);
  const ayahAudioUrl = getTelegramAyahAudioUrl(verse.surahNumber, verse.ayahNumber, reciter.id);
  const cardUrl = `${baseUrl}/api/telegram/verse-card.png?surah=${verse.surahNumber}&ayah=${verse.ayahNumber}&theme=emerald&format=story`;

  const articleText = [
    `<b>📖 ${escapeTelegramHtml(verse.surahName)} surəsi, ${verse.surahNumber}:${verse.ayahNumber}</b>`,
    '',
    `${escapeTelegramHtml(verse.arabicText)} ﴿${verse.ayahNumber}﴾`,
    '',
    `«${escapeTelegramHtml(verse.translation)}»`,
    '<i>Tərcümə: Əlixan Musayev</i>',
  ].join('\n');

  const sharedMarkup = toShareableInlineMarkup(
    {
      inline_keyboard: [
        [
          {
            text: '🎧 Səsli Dinlə',
            url: `https://t.me/${cleanBot}?start=ses_${verse.surahNumber}_${verse.ayahNumber}`,
          },
          {
            text: '🖼 Şəkil Kartı Al',
            url: `https://t.me/${cleanBot}?start=kart_${verse.surahNumber}_${verse.ayahNumber}`,
          },
        ],
        [
          {
            text: `📖 ${verse.surahName} surəsini oxu`,
            url: `${baseUrl}/quran/sure/${verse.surahNumber}#ayah-${verse.ayahNumber}`,
          },
        ],
      ],
    },
    cleanBot
  );

  return [
    {
      type: 'article',
      id: `ayah-${verse.surahNumber}-${verse.ayahNumber}`,
      title: `📖 ${verse.surahName} ${verse.surahNumber}:${verse.ayahNumber}`,
      description: verse.translation.slice(0, 110),
      input_message_content: {
        message_text: articleText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      },
      reply_markup: sharedMarkup,
    },
    {
      type: 'audio',
      id: `audio-${verse.surahNumber}-${verse.ayahNumber}-${reciter.code}`,
      audio_url: ayahAudioUrl,
      title: `${verse.surahName} ${verse.surahNumber}:${verse.ayahNumber}`,
      performer: reciter.label,
      caption: `🎧 <b>${escapeTelegramHtml(verse.surahName)} ${verse.surahNumber}:${verse.ayahNumber}</b> · ${escapeTelegramHtml(reciter.label)}\n«${escapeTelegramHtml(verse.translation.slice(0, 220))}»`,
      parse_mode: 'HTML',
      reply_markup: sharedMarkup,
    },
    {
      type: 'photo',
      id: `card-${verse.surahNumber}-${verse.ayahNumber}`,
      photo_url: cardUrl,
      thumbnail_url: cardUrl,
      photo_width: 1080,
      photo_height: 1920,
      title: `🖼 Ayə Şəkil Kartı (${verse.surahNumber}:${verse.ayahNumber})`,
      description: 'WhatsApp Durum / Instagram Hekayə üçün hazır dizayn',
      caption: `<b>${escapeTelegramHtml(verse.surahName)} ${verse.surahNumber}:${verse.ayahNumber}</b>\n«${escapeTelegramHtml(verse.translation.slice(0, 220))}»\n@quranqiraeti`,
      parse_mode: 'HTML',
      reply_markup: sharedMarkup,
    },
  ];
}

export function buildInlineSearchResults(
  origin: string,
  botUsername: string,
  matches: Array<{
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    snippet: string;
  }>
): TelegramInlineArticleResult[] {
  const baseUrl = normalizeBaseUrl(origin);
  const cleanBot = botUsername.replace(/^@/, '') || 'Quranqiraetibot';

  return matches.slice(0, 6).map((m) => ({
    type: 'article',
    id: `search-${m.surahNumber}-${m.ayahNumber}`,
    title: `🔎 ${m.surahName} ${m.surahNumber}:${m.ayahNumber}`,
    description: m.snippet.slice(0, 120),
    input_message_content: {
      message_text: [
        `<b>🔎 ${escapeTelegramHtml(m.surahName)} surəsi, ${m.surahNumber}:${m.ayahNumber}</b>`,
        '',
        `«${escapeTelegramHtml(m.snippet)}»`,
      ].join('\n'),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    },
    reply_markup: toShareableInlineMarkup(
      {
        inline_keyboard: [
          [
            {
              text: '🎧 Səsli Dinlə',
              url: `https://t.me/${cleanBot}?start=ses_${m.surahNumber}_${m.ayahNumber}`,
            },
            {
              text: '🖼 Şəkil Kartı Al',
              url: `https://t.me/${cleanBot}?start=kart_${m.surahNumber}_${m.ayahNumber}`,
            },
          ],
          [
            {
              text: '📖 Surədə Aç',
              url: `${baseUrl}/quran/sure/${m.surahNumber}#ayah-${m.ayahNumber}`,
            },
          ],
        ],
      },
      cleanBot
    ),
  }));
}

export function buildInlineQueryResults(
  origin: string,
  query: string,
  videos: RecitationVideo[],
  now: Date = new Date(),
  botUsername = 'Quranqiraetibot'
): TelegramInlineQueryResult[] {
  const baseUrl = normalizeBaseUrl(origin);
  const clean = normalizeAzSearchText(query);
  const results: TelegramInlineQueryResult[] = [];

  if (!clean || clean.includes('namaz') || clean.includes('vaxt')) {
    const city = findCityForTelegramQuery(clean.replace(/namaz|vaxt/g, '').trim() || 'baku');
    const prayerMsg = formatPrayerTimesMessage(baseUrl, city, now);
    results.push({
      type: 'article',
      id: `namaz-${city.id}`,
      title: `🕋 ${city.name} — Bugünkü Namaz Vaxtları`,
      description: 'Ümmül-Qura cədvəli, növbəti vaxta qalan vaxt və Qiblə bucağı',
      input_message_content: {
        message_text: prayerMsg.text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      },
      reply_markup: toShareableInlineMarkup(prayerMsg.reply_markup, botUsername),
    });
  }

  if (clean && (clean.includes('teqvim') || clean.includes('hicri') || clean.includes('ramazan'))) {
    const calMsg = formatHijriCalendarMessage(baseUrl, now);
    results.push({
      type: 'article',
      id: 'hijri-calendar',
      title: '📅 Hicri Təqvim və Mübarək Günlər',
      description: 'Ramazan, Qədr gecəsi və bayramlara qalan günlər',
      input_message_content: {
        message_text: calMsg.text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      },
      reply_markup: toShareableInlineMarkup(calMsg.reply_markup, botUsername),
    });
  }

  const matchedSurahs = clean
    ? SURAH_CATALOG.filter((s) => {
        const nameNorm = normalizeAzSearchText(s.name);
        return String(s.number) === clean || nameNorm.includes(clean);
      }).slice(0, 5)
    : SURAH_CATALOG.filter((s) => [1, 18, 36, 55, 67].includes(s.number));

  for (const surah of matchedSurahs) {
    const msg = formatSurahMessage(baseUrl, surah);
    results.push({
      type: 'article',
      id: `surah-${surah.number}`,
      title: `📖 ${surah.number}. ${surah.name} surəsi (${surah.arabicName})`,
      description: `${surah.ayahCount} ayə · ${surah.revelationPlace} · Mədinə Səhifə ${surah.startPage}`,
      input_message_content: {
        message_text: msg.text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      },
      reply_markup: toShareableInlineMarkup(msg.reply_markup, botUsername),
    });
  }

  const matchedVideos = clean
    ? videos
        .filter((v) =>
          normalizeAzSearchText(`${v.title} ${v.surahName} ${v.reciter}`).includes(clean)
        )
        .slice(0, 4)
    : videos.slice(0, 3);

  for (const video of matchedVideos) {
    const safeDesc =
      video.seoDescription || `${video.surahName} (${video.ayahRange}) — ${video.reciter}`;
    results.push({
      type: 'article',
      id: `video-${video.videoId}`,
      title: `🎬 ${video.title}`,
      description: `${video.reciter} · ${video.duration}`,
      input_message_content: {
        message_text: [
          `<b>🎬 ${escapeTelegramHtml(video.title)}</b>`,
          `🎙 Qari: ${escapeTelegramHtml(video.reciter)} · ⏱ ${escapeTelegramHtml(video.duration)}`,
          '',
          escapeTelegramHtml(safeDesc),
          '',
          `🔗 https://www.youtube.com/watch?v=${escapeTelegramHtml(video.videoId)}`,
        ].join('\n'),
        parse_mode: 'HTML',
      },
      reply_markup: toShareableInlineMarkup(
        {
          inline_keyboard: [
            [buildMiniAppButton('▶️ Mini App-də İzlə', `${baseUrl}/video/${video.videoId}`)],
          ],
        },
        botUsername
      ),
    });
  }

  return results.slice(0, 12);
}
