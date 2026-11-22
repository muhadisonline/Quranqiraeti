import { DAILY_AZKAR } from '../data/azkar';
import { normalizeBaseUrl } from './seo';
import {
  WORLD_PRAYER_CITIES,
  calculateWeeklyPrayerSchedule,
  getHijriPartsUmmAlQura,
} from './prayerTimes';
import {
  escapeTelegramHtml,
  findCityForTelegramQuery,
  getCuratedVerseForDate,
  normalizeAzSearchText,
  type TelegramFormattedReply,
} from './telegramBot';

export interface TelegramSubscription {
  chatId: string;
  active: boolean;
  cityId: string;
  hourBaku: number;
  fridayKahf: boolean;
  dailyVerseZikr: boolean;
  dailyPrayer: boolean;
  updatedAt: number;
  lastSentDateKey?: string;
}

export const SUBSCRIPTION_CITY_IDS = [
  'baku',
  'ganja',
  'sumqayit',
  'nakhchivan',
  'shaki',
  'shusha',
  'istanbul',
  'makkah',
] as const;

export const SUBSCRIPTION_HOURS_BAKU = [6, 8, 9, 12, 18, 20] as const;

export function createDefaultSubscription(chatId: number | string): TelegramSubscription {
  return {
    chatId: String(chatId),
    active: true,
    cityId: 'baku',
    hourBaku: 9,
    fridayKahf: true,
    dailyVerseZikr: true,
    dailyPrayer: true,
    updatedAt: Date.now(),
  };
}

export function normalizeTelegramSubscription(
  raw: Partial<TelegramSubscription> & { chatId: number | string }
): TelegramSubscription {
  const validCity = WORLD_PRAYER_CITIES.some((c) => c.id === raw.cityId)
    ? String(raw.cityId)
    : 'baku';
  const parsedHour = Number(raw.hourBaku);
  const hourBaku =
    Number.isFinite(parsedHour) && parsedHour >= 0 && parsedHour <= 23
      ? Math.trunc(parsedHour)
      : 9;

  return {
    chatId: String(raw.chatId),
    active: raw.active !== undefined ? Boolean(raw.active) : true,
    cityId: validCity,
    hourBaku,
    fridayKahf: raw.fridayKahf !== undefined ? Boolean(raw.fridayKahf) : true,
    dailyVerseZikr: raw.dailyVerseZikr !== undefined ? Boolean(raw.dailyVerseZikr) : true,
    dailyPrayer: raw.dailyPrayer !== undefined ? Boolean(raw.dailyPrayer) : true,
    updatedAt: Number.isFinite(Number(raw.updatedAt)) ? Number(raw.updatedAt) : Date.now(),
    ...(raw.lastSentDateKey ? { lastSentDateKey: String(raw.lastSentDateKey) } : {}),
  };
}

export function getBakuDateParts(now: Date = new Date()): {
  dateKey: string;
  hour: number;
  weekdayShort: string;
  isFriday: boolean;
} {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Baku',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const year = get('year') || '2026';
  const month = get('month') || '01';
  const day = get('day') || '01';
  const hourRaw = Number.parseInt(get('hour') || '0', 10);
  const hour = Number.isFinite(hourRaw) ? hourRaw % 24 : 0;
  const weekdayShort = get('weekday');

  return {
    dateKey: `${year}-${month}-${day}`,
    hour,
    weekdayShort,
    isFriday: weekdayShort.toLowerCase().startsWith('fri'),
  };
}

export function isFridayInBaku(now: Date = new Date()): boolean {
  return getBakuDateParts(now).isFriday;
}

export function reduceSubscriptionEvents(
  records: TelegramSubscription[]
): TelegramSubscription[] {
  const latestByChat = new Map<string, TelegramSubscription>();
  for (const raw of records) {
    if (!raw?.chatId) continue;
    const normalized = normalizeTelegramSubscription(raw);
    const existing = latestByChat.get(normalized.chatId);
    if (!existing || normalized.updatedAt >= existing.updatedAt) {
      latestByChat.set(normalized.chatId, normalized);
    }
  }
  return Array.from(latestByChat.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function parseAbuneCommandArgs(
  args: string,
  current: TelegramSubscription
): TelegramSubscription {
  const clean = normalizeAzSearchText(args);
  if (!clean) {
    return {
      ...current,
      active: true,
      updatedAt: Date.now(),
    };
  }

  if (/\b(dayandir|sondur|stop|off|legv)\b/.test(clean)) {
    return {
      ...current,
      active: false,
      updatedAt: Date.now(),
    };
  }

  let next = {
    ...current,
    active: true,
    updatedAt: Date.now(),
  };

  const hourMatch = clean.match(/\b(\d{1,2})(?::00)?\b/);
  if (hourMatch) {
    const h = Number.parseInt(hourMatch[1], 10);
    if (h >= 5 && h <= 22) {
      next = { ...next, hourBaku: h };
    }
  }

  const cityCandidate = clean.replace(/\b(\d{1,2})(?::00)?\b/g, ' ').replace(/\s+/g, ' ').trim();
  if (cityCandidate && !/\b(aktiv|ac|on|start|basla)\b/.test(cityCandidate)) {
    const matchedCity = findCityForTelegramQuery(cityCandidate);
    next = { ...next, cityId: matchedCity.id };
  }

  return next;
}

export function formatSubscriptionSettingsMessage(
  origin: string,
  sub: TelegramSubscription
): TelegramFormattedReply {
  const baseUrl = normalizeBaseUrl(origin);
  const city = WORLD_PRAYER_CITIES.find((c) => c.id === sub.cityId) ?? WORLD_PRAYER_CITIES[0];
  const hourStr = `${String(sub.hourBaku).padStart(2, '0')}:00`;

  const lines = [
    '<b>🔔 Gündəlik Telegram Bildirişləri (/abune)</b>',
    '',
    `<b>Status:</b> ${sub.active ? '✅ Aktivdir' : '⏸ Dayandırılıb'}`,
    `<b>Şəhər:</b> ${escapeTelegramHtml(city.name)}`,
    `<b>Saat (Bakı):</b> <code>${hourStr}</code>`,
    '',
    '<b>Seçilmiş paketlər:</b>',
    `${sub.fridayKahf ? '✅' : '⬜️'} Cümə günü Kəhf surəsi xatırlatması`,
    `${sub.dailyVerseZikr ? '✅' : '⬜️'} Günün ayəsi və Səhər/Axşam zikri`,
    `${sub.dailyPrayer ? '✅' : '⬜️'} Gündəlik namaz / Ramazan cədvəli`,
    '',
    '<i>Aşağıdakı düymələrlə şəhər, saat və ya paketləri dəyişə bilərsiniz (və ya /abune Gəncə 08 yazın):</i>',
  ];

  const cityRow1 = SUBSCRIPTION_CITY_IDS.slice(0, 4).map((id) => {
    const c = WORLD_PRAYER_CITIES.find((item) => item.id === id) ?? WORLD_PRAYER_CITIES[0];
    return {
      text: id === sub.cityId ? `✓ ${c.name}` : c.name,
      callback_data: `sub:city:${id}`,
    };
  });

  const cityRow2 = SUBSCRIPTION_CITY_IDS.slice(4, 8).map((id) => {
    const c = WORLD_PRAYER_CITIES.find((item) => item.id === id) ?? WORLD_PRAYER_CITIES[0];
    return {
      text: id === sub.cityId ? `✓ ${c.name}` : c.name,
      callback_data: `sub:city:${id}`,
    };
  });

  const hourRow = SUBSCRIPTION_HOURS_BAKU.map((h) => ({
    text: h === sub.hourBaku ? `✓ ${String(h).padStart(2, '0')}:00` : `${String(h).padStart(2, '0')}`,
    callback_data: `sub:hour:${h}`,
  }));

  return {
    text: lines.join('\n'),
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: sub.active ? '⏸ Abunəliyi Dayandır' : '✅ Abunəliyi Aktivləşdir',
            callback_data: 'sub:tog:active',
          },
          {
            text: '📨 Nümunəni İndi Göndər',
            callback_data: 'sub:test',
          },
        ],
        [
          {
            text: `${sub.fridayKahf ? '✓' : '○'} Cümə Kəhf`,
            callback_data: 'sub:tog:kahf',
          },
          {
            text: `${sub.dailyVerseZikr ? '✓' : '○'} Ayə & Zikr`,
            callback_data: 'sub:tog:verse',
          },
          {
            text: `${sub.dailyPrayer ? '✓' : '○'} Namaz Cədvəli`,
            callback_data: 'sub:tog:prayer',
          },
        ],
        cityRow1,
        cityRow2,
        hourRow,
        [
          {
            text: '📅 Təqvim & Namaz Vaxtları',
            web_app: { url: `${baseUrl}/namaz-vaxtlari` },
          },
        ],
      ],
    },
  };
}

export function buildDailyDigestMessage(
  origin: string,
  sub: TelegramSubscription,
  now: Date = new Date()
): TelegramFormattedReply | null {
  if (!sub.active) return null;
  if (!sub.fridayKahf && !sub.dailyVerseZikr && !sub.dailyPrayer) return null;

  const baseUrl = normalizeBaseUrl(origin);
  const city = WORLD_PRAYER_CITIES.find((c) => c.id === sub.cityId) ?? WORLD_PRAYER_CITIES[0];
  const bakuDate = getBakuDateParts(now);
  const hijri = getHijriPartsUmmAlQura(now, 'Asia/Baku');
  const verse = getCuratedVerseForDate(now);
  const dayIndex = Math.abs(Math.floor(now.getTime() / 86_400_000));
  const preferredZikrCat = sub.hourBaku >= 16 ? 'axsam' : 'seher';
  const zikrPool = DAILY_AZKAR.filter((z) => z.category === preferredZikrCat);
  const zikrItem = (zikrPool.length > 0 ? zikrPool : DAILY_AZKAR)[dayIndex % Math.max(1, zikrPool.length)];
  const prayerSchedule = calculateWeeklyPrayerSchedule(city, now, 1)[0];

  const sections: string[] = [
    `<b>☀️ Gündəlik Ruhani Xatırlatma — ${escapeTelegramHtml(city.name)}</b>`,
    `<i>${escapeTelegramHtml(hijri.formatted)}</i>`,
  ];

  const inlineButtons = [];

  if (sub.fridayKahf && bakuDate.isFriday) {
    sections.push(
      '',
      '<b>🕌 Cüməniz Mübarək! — Kəhf Surəsi</b>',
      'Bu gün Cümə günüdür. Kəhf surəsini (18-ci surə) oxumaq və ya səsli dinləmək iki cümə arasını nurlandırar.'
    );
    inlineButtons.push([
      { text: '🎧 Kəhf Surəsini Dinlə', callback_data: 'amenu:18:1:afasy' },
      { text: '📖 Kəhfi Oxu', web_app: { url: `${baseUrl}/quran/sure/18` } },
    ]);
  }

  if (sub.dailyVerseZikr) {
    sections.push(
      '',
      `<b>✨ Günün Ayəsi (${escapeTelegramHtml(verse.surahName)} ${verse.surahNumber}:${verse.ayahNumber}):</b>`,
      `${escapeTelegramHtml(verse.arabicText)}`,
      `«${escapeTelegramHtml(verse.translation)}»`,
      '',
      `<b>📿 Zikr (${escapeTelegramHtml(zikrItem.title)}):</b>`,
      `«${escapeTelegramHtml(zikrItem.translation)}»`
    );
    inlineButtons.push([
      {
        text: '🖼 Ayə Kartı Al',
        callback_data: `kart:${verse.surahNumber}:${verse.ayahNumber}:emerald`,
      },
      {
        text: '🎧 Ayəni Dinlə',
        callback_data: `amenu:${verse.surahNumber}:${verse.ayahNumber}:afasy`,
      },
    ]);
  }

  if (sub.dailyPrayer && prayerSchedule) {
    const timesLine = prayerSchedule.times
      .map((t) => `${escapeTelegramHtml(t.label)}: <code>${escapeTelegramHtml(t.formattedTime)}</code>`)
      .join(' · ');
    sections.push(
      '',
      `<b>🕋 Namaz Vaxtları (${escapeTelegramHtml(city.name)}):</b>`,
      timesLine
    );
  }

  inlineButtons.push([
    { text: '⚙️ Abunəliyi İdarə Et', callback_data: 'sub:menu' },
  ]);

  return {
    text: sections.join('\n'),
    reply_markup: { inline_keyboard: inlineButtons },
  };
}
