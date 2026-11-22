import { AZKAR_CATEGORY_LABELS, AzkarCategory, DAILY_AZKAR } from '../data/azkar';
import { QURAN_DUAS, QuranDuaEntry } from '../data/quranDuas';
import { RecitationVideo } from './channel';
import { getUpcomingBlessedDays } from './hijriCalendar';
import { getEveryAyahAudioUrl } from './muhaffiz';
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
  { command: 'aye', description: 'Günün ayəsi və ya /aye 2:255' },
  { command: 'sure', description: 'Surə oxu (/sure Yasin, /sure 36)' },
  { command: 'sehife', description: 'Mədinə Mushafı səhifəsi (/sehife 42)' },
  { command: 'namaz', description: 'Namaz vaxtları və Qiblə (/namaz Bakı)' },
  { command: 'zikr', description: 'Səhər, axşam və namaz zikrləri' },
  { command: 'dua', description: 'Qurandakı Rəbbənə duaları' },
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

export function getTelegramAyahAudioUrl(surahNumber: number, ayahNumber: number): string {
  return getEveryAyahAudioUrl(surahNumber, ayahNumber, 'Alafasy_128kbps');
}

export function resolveTelegramStartParamPath(startParam?: string): string {
  const raw = String(startParam ?? '').trim();
  if (!raw) return '/';

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

export function formatStartMessage(origin: string): TelegramFormattedReply {
  const baseUrl = normalizeBaseUrl(origin);
  const text = [
    '<b>Əssəlamu aleykum!</b> 🌙',
    '<b>Quran Qiraeti</b> rəsmi Telegram botuna və Mini Tətbiqinə xoş gəlmisiniz.',
    '',
    '<b>Söhbətdə istifadə edə biləcəyiniz əmrlər:</b>',
    '• /aye — Günün ayəsi və səsli tilavət <i>(və ya /aye 2:255)</i>',
    '• /sure — Surə oxu və dinlə <i>(məs. /sure Yasin)</i>',
    '• /sehife — Mədinə Mushafı səhifəsi <i>(məs. /sehife 42)</i>',
    '• /namaz — Namaz vaxtları və Qiblə <i>(məs. /namaz Bakı)</i>',
    '• /zikr — Səhər, axşam və namaz sonrası zikrlər',
    '• /dua — Qurandan Rəbbənə duaları',
    '• /teqvim — Hicri təqvim və mübarək günlər sayğacı',
    '• /elifba — Ərəb əlifbası və təcvid bələdçisi',
    '• /axtar — Ayələrdə axtarış <i>(məs. /axtar səbir)</i>',
    '• /videolar — Kanalın son uzun tilavətləri və Shorts',
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
          { text: '🌅 Günün Ayəsi', callback_data: 'aye:random' },
          { text: '🤲 Rəbbənə Duası', callback_data: 'dua:next' },
          { text: '📿 Zikr', callback_data: 'zikr:seher' },
        ],
        [
          { text: '📅 Hicri Təqvim', callback_data: 'teqvim:now' },
          { text: '🔎 Çatda Paylaş (Inline)', switch_inline_query_current_chat: 'yasin' },
        ],
        [
          buildMiniAppButton('🔤 Əlifba & Təcvid', `${baseUrl}/elifba`),
          { text: '📺 YouTube Kanal', url: 'https://youtube.com/@quranqiraeti' },
        ],
      ],
    },
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
            text: '🎧 Səsli Dinlə (MP3)',
            callback_data: `audio:${params.surahNumber}:${params.ayahNumber}`,
          },
          buildMiniAppButton(
            `📖 Surədə aç`,
            `${baseUrl}/quran/sure/${params.surahNumber}#ayah-${params.ayahNumber}`
          ),
        ],
        [
          { text: '🔄 Başqa Ayə', callback_data: 'aye:random' },
          { text: '🤲 Dua Oxu', callback_data: 'dua:next' },
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
          { text: '🎧 1-ci ayəni dinlə', callback_data: `audio:${surah.number}:1` },
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

export function formatDuaMessage(origin: string, dua: QuranDuaEntry): TelegramFormattedReply {
  const baseUrl = normalizeBaseUrl(origin);
  const text = [
    `<b>🤲 ${escapeTelegramHtml(dua.title)}</b>`,
    `<i>${escapeTelegramHtml(dua.surahName)} surəsi, ${escapeTelegramHtml(dua.ayahLabel)} · Səhifə ${dua.pageNumber}</i>`,
    '',
    `${escapeTelegramHtml(dua.arabicText)}`,
    '',
    `«${escapeTelegramHtml(dua.translation)}»`,
  ].join('\n');

  return {
    text,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎧 Səsli Dinlə',
            callback_data: `audio:${dua.surahNumber}:${dua.ayahNumber}`,
          },
          buildMiniAppButton(
            '📖 Ayədə Aç',
            `${baseUrl}/quran/sure/${dua.surahNumber}#ayah-${dua.ayahNumber}`
          ),
        ],
        [
          { text: '🔄 Başqa Dua', callback_data: 'dua:next' },
          buildMiniAppButton('🤲 Bütün Dualar', `${baseUrl}/dualar`),
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

export function buildInlineQueryResults(
  origin: string,
  query: string,
  videos: RecitationVideo[],
  now: Date = new Date()
): TelegramInlineArticleResult[] {
  const baseUrl = normalizeBaseUrl(origin);
  const clean = normalizeAzSearchText(query);
  const results: TelegramInlineArticleResult[] = [];

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
      reply_markup: prayerMsg.reply_markup,
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
      reply_markup: calMsg.reply_markup,
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
      reply_markup: msg.reply_markup,
    });
  }

  const matchedDuas = clean
    ? QURAN_DUAS.filter((d) => {
        const hay = normalizeAzSearchText(`${d.title} ${d.surahName} ${d.translation}`);
        return hay.includes(clean);
      }).slice(0, 3)
    : QURAN_DUAS.slice(0, 2);

  for (const dua of matchedDuas) {
    const msg = formatDuaMessage(baseUrl, dua);
    results.push({
      type: 'article',
      id: `dua-${dua.id}`,
      title: `🤲 ${dua.title} (${dua.ayahLabel})`,
      description: dua.translation.slice(0, 90),
      input_message_content: {
        message_text: msg.text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      },
      reply_markup: msg.reply_markup,
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
      reply_markup: {
        inline_keyboard: [
          [buildMiniAppButton('▶️ Mini App-də İzlə', `${baseUrl}/video/${video.videoId}`)],
        ],
      },
    });
  }

  return results.slice(0, 12);
}
