export interface PrayerCountry {
  id: string;
  name: string;
}

export interface PrayerLocation {
  id: string;
  countryId: string;
  countryName: string;
  name: string;
  regionLabel: string;
  lat: number;
  lng: number;
  timeZone: string;
  fallbackUtcOffsetHours?: number;
  isCustom?: boolean;
  nearestCityName?: string;
}

export type PrayerNameKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTimeEntry {
  key: PrayerNameKey;
  label: string;
  arabicLabel: string;
  minutesFromMidnight: number;
  formattedTime: string;
}

export interface DailyPrayerSchedule {
  city: PrayerLocation;
  dateKey: string;
  gregorianLabel: string;
  hijriLabel: string;
  isRamadan: boolean;
  calculationMethodLabel: string;
  utcOffsetHours: number;
  times: PrayerTimeEntry[];
}

export interface NextPrayerCountdown {
  currentPrayerKey: PrayerNameKey;
  nextPrayer: PrayerTimeEntry;
  isTomorrow: boolean;
  secondsRemaining: number;
  formattedCountdown: string;
}

export interface CustomPrayerCoords {
  lat: number;
  lng: number;
}

export interface QiblaInfo {
  bearingDegrees: number;
  cardinalLabel: string;
  distanceKm: number;
}

export const PRAYER_CITY_STORAGE_KEY = 'quranqiraeti_prayer_city_v1';
export const PRAYER_CUSTOM_COORDS_STORAGE_KEY = 'quranqiraeti_prayer_custom_coords_v1';
export const PRAYER_PREFS_EVENT = 'quranqiraeti_prayer_prefs_changed';

export const BAKU_UTC_OFFSET_HOURS = 4;

const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

export const PRAYER_COUNTRIES: PrayerCountry[] = [
  { id: 'az', name: 'Azərbaycan' },
  { id: 'tr', name: 'Türkiyə' },
  { id: 'sa', name: 'Səudiyyə Ərəbistanı' },
  { id: 'ae', name: 'BƏƏ' },
  { id: 'qa', name: 'Qətər' },
  { id: 'ge', name: 'Gürcüstan' },
  { id: 'ru', name: 'Rusiya' },
  { id: 'ir', name: 'İran' },
  { id: 'de', name: 'Almaniya' },
  { id: 'gb', name: 'Böyük Britaniya' },
  { id: 'fr', name: 'Fransa' },
  { id: 'us', name: 'ABŞ' },
  { id: 'ca', name: 'Kanada' },
  { id: 'kz', name: 'Qazaxıstan' },
  { id: 'uz', name: 'Özbəkistan' },
  { id: 'eg', name: 'Misir' },
  { id: 'my', name: 'Malayziya' },
];

export const WORLD_PRAYER_CITIES: PrayerLocation[] = [
  // Azərbaycan
  { id: 'baku', countryId: 'az', countryName: 'Azərbaycan', name: 'Bakı', regionLabel: 'Paytaxt', lat: 40.4093, lng: 49.8671, timeZone: 'Asia/Baku' },
  { id: 'sumqayit', countryId: 'az', countryName: 'Azərbaycan', name: 'Sumqayıt', regionLabel: 'Abşeron', lat: 40.5855, lng: 49.6317, timeZone: 'Asia/Baku' },
  { id: 'ganja', countryId: 'az', countryName: 'Azərbaycan', name: 'Gəncə', regionLabel: 'Qərb regionu', lat: 40.6828, lng: 46.3606, timeZone: 'Asia/Baku' },
  { id: 'mingachevir', countryId: 'az', countryName: 'Azərbaycan', name: 'Mingəçevir', regionLabel: 'Mərkəzi Aran', lat: 40.7639, lng: 47.0595, timeZone: 'Asia/Baku' },
  { id: 'shaki', countryId: 'az', countryName: 'Azərbaycan', name: 'Şəki', regionLabel: 'Şimal-Qərb', lat: 41.1919, lng: 47.1706, timeZone: 'Asia/Baku' },
  { id: 'shamakhi', countryId: 'az', countryName: 'Azərbaycan', name: 'Şamaxı', regionLabel: 'Dağlıq Şirvan', lat: 40.6314, lng: 48.6414, timeZone: 'Asia/Baku' },
  { id: 'quba', countryId: 'az', countryName: 'Azərbaycan', name: 'Quba', regionLabel: 'Şimal', lat: 41.3611, lng: 48.5134, timeZone: 'Asia/Baku' },
  { id: 'lankaran', countryId: 'az', countryName: 'Azərbaycan', name: 'Lənkəran', regionLabel: 'Cənub', lat: 38.7543, lng: 48.8506, timeZone: 'Asia/Baku' },
  { id: 'nakhchivan', countryId: 'az', countryName: 'Azərbaycan', name: 'Naxçıvan', regionLabel: 'Muxtar Respublika', lat: 39.2089, lng: 45.4122, timeZone: 'Asia/Baku' },
  { id: 'shusha', countryId: 'az', countryName: 'Azərbaycan', name: 'Şuşa', regionLabel: 'Qarabağ', lat: 39.7576, lng: 46.7499, timeZone: 'Asia/Baku' },

  // Türkiyə
  { id: 'istanbul', countryId: 'tr', countryName: 'Türkiyə', name: 'İstanbul', regionLabel: 'Mərmərə', lat: 41.0082, lng: 28.9784, timeZone: 'Europe/Istanbul' },
  { id: 'ankara', countryId: 'tr', countryName: 'Türkiyə', name: 'Ankara', regionLabel: 'Paytaxt', lat: 39.9334, lng: 32.8597, timeZone: 'Europe/Istanbul' },
  { id: 'izmir', countryId: 'tr', countryName: 'Türkiyə', name: 'İzmir', regionLabel: 'Ege', lat: 38.4237, lng: 27.1428, timeZone: 'Europe/Istanbul' },
  { id: 'bursa', countryId: 'tr', countryName: 'Türkiyə', name: 'Bursa', regionLabel: 'Mərmərə', lat: 40.1885, lng: 29.061, timeZone: 'Europe/Istanbul' },
  { id: 'konya', countryId: 'tr', countryName: 'Türkiyə', name: 'Konya', regionLabel: 'İç Anadolu', lat: 37.8746, lng: 32.4932, timeZone: 'Europe/Istanbul' },
  { id: 'erzurum', countryId: 'tr', countryName: 'Türkiyə', name: 'Ərzurum', regionLabel: 'Şərqi Anadolu', lat: 39.9043, lng: 41.2679, timeZone: 'Europe/Istanbul' },
  { id: 'trabzon', countryId: 'tr', countryName: 'Türkiyə', name: 'Trabzon', regionLabel: 'Qara dəniz', lat: 41.0027, lng: 39.7168, timeZone: 'Europe/Istanbul' },

  // Səudiyyə Ərəbistanı
  { id: 'makkah', countryId: 'sa', countryName: 'Səudiyyə Ərəbistanı', name: 'Məkkə', regionLabel: 'Hicaz', lat: 21.3891, lng: 39.8579, timeZone: 'Asia/Riyadh' },
  { id: 'madinah', countryId: 'sa', countryName: 'Səudiyyə Ərəbistanı', name: 'Mədinə', regionLabel: 'Hicaz', lat: 24.5247, lng: 39.5692, timeZone: 'Asia/Riyadh' },
  { id: 'riyadh', countryId: 'sa', countryName: 'Səudiyyə Ərəbistanı', name: 'Riyad', regionLabel: 'Paytaxt', lat: 24.7136, lng: 46.6753, timeZone: 'Asia/Riyadh' },
  { id: 'jeddah', countryId: 'sa', countryName: 'Səudiyyə Ərəbistanı', name: 'Ciddə', regionLabel: 'Qırmızı dəniz', lat: 21.4858, lng: 39.1925, timeZone: 'Asia/Riyadh' },

  // BƏƏ & Qətər
  { id: 'dubai', countryId: 'ae', countryName: 'BƏƏ', name: 'Dubay', regionLabel: 'Əmirlik', lat: 25.2048, lng: 55.2708, timeZone: 'Asia/Dubai' },
  { id: 'abudhabi', countryId: 'ae', countryName: 'BƏƏ', name: 'Əbu-Dabi', regionLabel: 'Paytaxt', lat: 24.4539, lng: 54.3773, timeZone: 'Asia/Dubai' },
  { id: 'doha', countryId: 'qa', countryName: 'Qətər', name: 'Doha', regionLabel: 'Paytaxt', lat: 25.2854, lng: 51.531, timeZone: 'Asia/Qatar' },

  // Gürcüstan
  { id: 'tbilisi', countryId: 'ge', countryName: 'Gürcüstan', name: 'Tbilisi', regionLabel: 'Paytaxt', lat: 41.7151, lng: 44.8271, timeZone: 'Asia/Tbilisi' },
  { id: 'batumi', countryId: 'ge', countryName: 'Gürcüstan', name: 'Batumi', regionLabel: 'Acariya', lat: 41.6168, lng: 41.6367, timeZone: 'Asia/Tbilisi' },
  { id: 'marneuli', countryId: 'ge', countryName: 'Gürcüstan', name: 'Marneuli', regionLabel: 'Kvemo-Kartli', lat: 41.4759, lng: 44.8089, timeZone: 'Asia/Tbilisi' },

  // Rusiya
  { id: 'moscow', countryId: 'ru', countryName: 'Rusiya', name: 'Moskva', regionLabel: 'Paytaxt', lat: 55.7558, lng: 37.6173, timeZone: 'Europe/Moscow' },
  { id: 'spb', countryId: 'ru', countryName: 'Rusiya', name: 'Sankt-Peterburq', regionLabel: 'Şimal-Qərb', lat: 59.9343, lng: 30.3351, timeZone: 'Europe/Moscow' },
  { id: 'kazan', countryId: 'ru', countryName: 'Rusiya', name: 'Kazan', regionLabel: 'Tatarıstan', lat: 55.8304, lng: 49.0661, timeZone: 'Europe/Moscow' },
  { id: 'makhachkala', countryId: 'ru', countryName: 'Rusiya', name: 'Mahaçqala', regionLabel: 'Dağıstan', lat: 42.9849, lng: 47.5047, timeZone: 'Europe/Moscow' },

  // İran
  { id: 'tehran', countryId: 'ir', countryName: 'İran', name: 'Tehran', regionLabel: 'Paytaxt', lat: 35.6892, lng: 51.389, timeZone: 'Asia/Tehran' },
  { id: 'tabriz', countryId: 'ir', countryName: 'İran', name: 'Təbriz', regionLabel: 'Şərqi Azərbaycan', lat: 38.0962, lng: 46.2738, timeZone: 'Asia/Tehran' },
  { id: 'ardabil', countryId: 'ir', countryName: 'İran', name: 'Ərdəbil', regionLabel: 'Ərdəbil', lat: 38.2498, lng: 48.2933, timeZone: 'Asia/Tehran' },

  // Avropa (Almaniya, Böyük Britaniya, Fransa)
  { id: 'berlin', countryId: 'de', countryName: 'Almaniya', name: 'Berlin', regionLabel: 'Paytaxt', lat: 52.52, lng: 13.405, timeZone: 'Europe/Berlin' },
  { id: 'munich', countryId: 'de', countryName: 'Almaniya', name: 'Münhen', regionLabel: 'Bavariya', lat: 48.1351, lng: 11.582, timeZone: 'Europe/Berlin' },
  { id: 'frankfurt', countryId: 'de', countryName: 'Almaniya', name: 'Frankfurt', regionLabel: 'Hessen', lat: 50.1109, lng: 8.6821, timeZone: 'Europe/Berlin' },
  { id: 'cologne', countryId: 'de', countryName: 'Almaniya', name: 'Köln', regionLabel: 'NRW', lat: 50.9375, lng: 6.9603, timeZone: 'Europe/Berlin' },
  { id: 'london', countryId: 'gb', countryName: 'Böyük Britaniya', name: 'London', regionLabel: 'Paytaxt', lat: 51.5072, lng: -0.1276, timeZone: 'Europe/London' },
  { id: 'birmingham', countryId: 'gb', countryName: 'Böyük Britaniya', name: 'Birmingem', regionLabel: 'Midlands', lat: 52.4862, lng: -1.8904, timeZone: 'Europe/London' },
  { id: 'manchester', countryId: 'gb', countryName: 'Böyük Britaniya', name: 'Mançester', regionLabel: 'Şimal', lat: 53.4808, lng: -2.2426, timeZone: 'Europe/London' },
  { id: 'paris', countryId: 'fr', countryName: 'Fransa', name: 'Paris', regionLabel: 'Paytaxt', lat: 48.8566, lng: 2.3522, timeZone: 'Europe/Paris' },
  { id: 'lyon', countryId: 'fr', countryName: 'Fransa', name: 'Lion', regionLabel: 'Overn-Rona', lat: 45.764, lng: 4.8357, timeZone: 'Europe/Paris' },

  // Şimali Amerika (ABŞ, Kanada)
  { id: 'newyork', countryId: 'us', countryName: 'ABŞ', name: 'Nyu-York', regionLabel: 'Şərq sahili', lat: 40.7128, lng: -74.006, timeZone: 'America/New_York' },
  { id: 'washington', countryId: 'us', countryName: 'ABŞ', name: 'Vaşinqton', regionLabel: 'Paytaxt', lat: 38.9072, lng: -77.0369, timeZone: 'America/New_York' },
  { id: 'chicago', countryId: 'us', countryName: 'ABŞ', name: 'Çikaqo', regionLabel: 'Mərkəzi', lat: 41.8781, lng: -87.6298, timeZone: 'America/Chicago' },
  { id: 'losangeles', countryId: 'us', countryName: 'ABŞ', name: 'Los-Anceles', regionLabel: 'Qərb sahili', lat: 34.0522, lng: -118.2437, timeZone: 'America/Los_Angeles' },
  { id: 'toronto', countryId: 'ca', countryName: 'Kanada', name: 'Toronto', regionLabel: 'Ontario', lat: 43.6532, lng: -79.3832, timeZone: 'America/Toronto' },
  { id: 'montreal', countryId: 'ca', countryName: 'Kanada', name: 'Monreal', regionLabel: 'Kvebek', lat: 45.5017, lng: -73.5673, timeZone: 'America/Toronto' },

  // Orta Asiya, Misir, Malayziya
  { id: 'astana', countryId: 'kz', countryName: 'Qazaxıstan', name: 'Astana', regionLabel: 'Paytaxt', lat: 51.1694, lng: 71.4491, timeZone: 'Asia/Almaty' },
  { id: 'almaty', countryId: 'kz', countryName: 'Qazaxıstan', name: 'Almatı', regionLabel: 'Cənub-Şərq', lat: 43.222, lng: 76.8512, timeZone: 'Asia/Almaty' },
  { id: 'tashkent', countryId: 'uz', countryName: 'Özbəkistan', name: 'Daşkənd', regionLabel: 'Paytaxt', lat: 41.2995, lng: 69.2401, timeZone: 'Asia/Tashkent' },
  { id: 'samarkand', countryId: 'uz', countryName: 'Özbəkistan', name: 'Səmərqənd', regionLabel: 'Tarixi şəhər', lat: 39.6542, lng: 66.9597, timeZone: 'Asia/Tashkent' },
  { id: 'cairo', countryId: 'eg', countryName: 'Misir', name: 'Qahirə', regionLabel: 'Paytaxt', lat: 30.0444, lng: 31.2357, timeZone: 'Africa/Cairo' },
  { id: 'kualalumpur', countryId: 'my', countryName: 'Malayziya', name: 'Kuala-Lumpur', regionLabel: 'Paytaxt', lat: 3.139, lng: 101.6869, timeZone: 'Asia/Kuala_Lumpur' },
];

export const AZERBAIJAN_CITIES = WORLD_PRAYER_CITIES.filter((c) => c.countryId === 'az');

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function dsin(deg: number): number {
  return Math.sin(deg * DEG_TO_RAD);
}
function dcos(deg: number): number {
  return Math.cos(deg * DEG_TO_RAD);
}
function dtan(deg: number): number {
  return Math.tan(deg * DEG_TO_RAD);
}
function darcsin(val: number): number {
  return Math.asin(Math.max(-1, Math.min(1, val))) * RAD_TO_DEG;
}
function darccos(val: number): number {
  return Math.acos(Math.max(-1, Math.min(1, val))) * RAD_TO_DEG;
}
function darctan2(y: number, x: number): number {
  return Math.atan2(y, x) * RAD_TO_DEG;
}
function darccot(x: number): number {
  return Math.atan(1 / x) * RAD_TO_DEG;
}

function fixAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function fixHour(hours: number): number {
  return ((hours % 24) + 24) % 24;
}

function toJulianDate(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

function computeSolarPosition(jd: number): { declination: number; eqTimeHours: number } {
  const d = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * d);
  const q = fixAngle(280.459 + 0.98564736 * d);
  const l = fixAngle(q + 1.915 * dsin(g) + 0.02 * dsin(2 * g));
  const e = 23.439 - 0.00000036 * d;

  const ra = fixHour(darctan2(dcos(e) * dsin(l), dcos(l)) / 15);
  const eqTimeHours = q / 15 - ra;
  const declination = darcsin(dsin(e) * dsin(l));
  return { declination, eqTimeHours };
}

function computeSunAngleOffsetHours(
  jDate: number,
  dayFraction: number,
  lat: number,
  angleBelowHorizon: number
): number | null {
  const { declination } = computeSolarPosition(jDate + dayFraction);
  const num = -dsin(angleBelowHorizon) - dsin(declination) * dsin(lat);
  const den = dcos(declination) * dcos(lat);
  if (Math.abs(den) < 1e-6) return null;
  const ratio = num / den;
  if (Math.abs(ratio) >= 0.999) {
    return null;
  }
  return darccos(ratio) / 15;
}

function computeAsrOffsetHours(
  jDate: number,
  dayFraction: number,
  lat: number
): number {
  const { declination } = computeSolarPosition(jDate + dayFraction);
  const altDeg = darccot(1 + dtan(Math.abs(lat - declination)));
  // Negative angle below horizon = altitude above horizon
  return computeSunAngleOffsetHours(jDate, dayFraction, lat, -altDeg) ?? 4;
}

export function formatMinutesToHHMM(totalMinutes: number): string {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hh = Math.floor(normalized / 60);
  const mm = normalized % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function formatUtcOffsetLabel(offsetHours: number): string {
  const sign = offsetHours >= 0 ? '+' : '-';
  const abs = Math.abs(offsetHours);
  const hh = Math.floor(abs);
  const mm = Math.round((abs - hh) * 60);
  return mm > 0 ? `UTC${sign}${hh}:${String(mm).padStart(2, '0')}` : `UTC${sign}${hh}`;
}

export function getTimeZoneOffsetHours(
  date: Date,
  timeZone: string,
  fallbackOffsetHours = BAKU_UTC_OFFSET_HOURS
): number {
  if (!timeZone || timeZone === 'SOLAR_OFFSET') {
    return fallbackOffsetHours;
  }
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(date);
    const map: Record<string, number> = {};
    for (const p of parts) {
      if (p.type !== 'literal') {
        map[p.type] = Number.parseInt(p.value, 10);
      }
    }
    const wallUtc = Date.UTC(
      map.year,
      (map.month || 1) - 1,
      map.day || 1,
      map.hour === 24 ? 0 : map.hour || 0,
      map.minute || 0,
      map.second || 0
    );
    const diffHours = (wallUtc - date.getTime()) / 3600000;
    return Math.round(diffHours * 4) / 4;
  } catch {
    return fallbackOffsetHours;
  }
}

export function getCalendarPartsInTimeZone(
  date: Date = new Date(),
  timeZone = 'Asia/Baku',
  fallbackOffsetHours = BAKU_UTC_OFFSET_HOURS
): {
  year: number;
  month: number;
  day: number;
  secondsSinceMidnight: number;
  dateKey: string;
  utcOffsetHours: number;
} {
  const offsetHours = getTimeZoneOffsetHours(date, timeZone, fallbackOffsetHours);
  const shifted = new Date(date.getTime() + offsetHours * 3600 * 1000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const hours = shifted.getUTCHours();
  const minutes = shifted.getUTCMinutes();
  const seconds = shifted.getUTCSeconds();
  return {
    year,
    month,
    day,
    secondsSinceMidnight: hours * 3600 + minutes * 60 + seconds,
    dateKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    utcOffsetHours: offsetHours,
  };
}

export function getBakuCalendarParts(date: Date = new Date()) {
  return getCalendarPartsInTimeZone(date, 'Asia/Baku', BAKU_UTC_OFFSET_HOURS);
}

const AZ_MONTHS = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'İyun',
  'İyul',
  'Avqust',
  'Sentyabr',
  'Oktyabr',
  'Noyabr',
  'Dekabr',
];

const AZ_WEEKDAYS = [
  'Bazar',
  'Bazar ertəsi',
  'Çərşənbə axşamı',
  'Çərşənbə',
  'Cümə axşamı',
  'Cümə',
  'Şənbə',
];

const HIJRI_MONTHS_AZ = [
  'Məhərrəm',
  'Səfər',
  'Rəbiüləvvəl',
  'Rəbiülaxır',
  'Cəmadiyələvvəl',
  'Cəmadiyəlaxır',
  'Rəcəb',
  'Şaban',
  'Ramazan',
  'Şəvval',
  'Zülqədə',
  'Zülhiccə',
];

export function formatGregorianAzerbaijani(year: number, month: number, day: number): string {
  const utc = new Date(Date.UTC(year, month - 1, day));
  const weekday = AZ_WEEKDAYS[utc.getUTCDay()] ?? '';
  const monthName = AZ_MONTHS[month - 1] ?? String(month);
  return `${day} ${monthName} ${year}, ${weekday}`;
}

export function getHijriPartsUmmAlQura(
  date: Date = new Date(),
  timeZone = 'Asia/Baku'
): { day: number; month: number; year: number; formatted: string } {
  try {
    const safeTz = timeZone === 'SOLAR_OFFSET' ? 'UTC' : timeZone;
    const formatted = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      timeZone: safeTz,
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).format(date);
    const match = formatted.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const m = Number.parseInt(match[1], 10);
      const d = Number.parseInt(match[2], 10);
      const y = Number.parseInt(match[3], 10);
      const mName = HIJRI_MONTHS_AZ[m - 1] ?? '';
      if (mName) {
        return { day: d, month: m, year: y, formatted: `${d} ${mName} ${y}` };
      }
    }
  } catch {
    // fallback silently
  }
  return { day: 1, month: 1, year: 1448, formatted: 'Hicri təqvim' };
}

export function formatHijriAzerbaijani(date: Date = new Date(), timeZone = 'Asia/Baku'): string {
  return getHijriPartsUmmAlQura(date, timeZone).formatted;
}

export function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    dcos(lat1) * dcos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestPrayerCity(lat: number, lng: number): {
  city: PrayerLocation;
  distanceKm: number;
} {
  let best = WORLD_PRAYER_CITIES[0];
  let bestDist = Infinity;
  for (const city of WORLD_PRAYER_CITIES) {
    const dist = haversineDistanceKm(lat, lng, city.lat, city.lng);
    if (dist < bestDist) {
      bestDist = dist;
      best = city;
    }
  }
  return { city: best, distanceKm: Math.round(bestDist) };
}

export function createCustomCoordinateLocation(lat: number, lng: number): PrayerLocation {
  const clampedLat = Math.max(-70, Math.min(70, Number(lat.toFixed(4))));
  const clampedLng = Math.max(-180, Math.min(180, Number(lng.toFixed(4))));
  const { city: nearest, distanceKm } = findNearestPrayerCity(clampedLat, clampedLng);

  const withinKnownCountryZone = distanceKm <= 450;
  const timeZone = withinKnownCountryZone ? nearest.timeZone : 'SOLAR_OFFSET';
  const fallbackUtcOffsetHours = withinKnownCountryZone
    ? undefined
    : Math.max(-12, Math.min(14, Math.round(clampedLng / 15)));

  const displayName =
    distanceKm <= 25
      ? nearest.name
      : distanceKm <= 250
        ? `${nearest.name} yaxınlığı`
        : 'Xəritə məkanı';

  return {
    id: 'custom',
    countryId: nearest.countryId,
    countryName: withinKnownCountryZone ? nearest.countryName : 'Xəritə üzrə koordinat',
    name: displayName,
    regionLabel: `${clampedLat.toFixed(2)}°, ${clampedLng.toFixed(2)}°`,
    lat: clampedLat,
    lng: clampedLng,
    timeZone,
    fallbackUtcOffsetHours,
    isCustom: true,
    nearestCityName: nearest.name,
  };
}

export function computeQiblaDirection(lat: number, lng: number): QiblaInfo {
  const phi1 = lat * DEG_TO_RAD;
  const phi2 = KAABA_LAT * DEG_TO_RAD;
  const dLambda = (KAABA_LNG - lng) * DEG_TO_RAD;

  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const bearing = Math.round(((Math.atan2(y, x) * RAD_TO_DEG) % 360 + 360) % 360);

  const dirs = ['Şimal', 'Şm-Şq', 'Şərq', 'C-Şq', 'Cənub', 'C-Qb', 'Qərb', 'Şm-Qb'];
  const cardinalLabel = dirs[Math.round(bearing / 45) % 8] ?? 'Şm-Şq';
  const distanceKm = Math.round(haversineDistanceKm(lat, lng, KAABA_LAT, KAABA_LNG));

  return {
    bearingDegrees: bearing,
    cardinalLabel,
    distanceKm,
  };
}

export function getCitiesByCountryId(countryId: string): PrayerLocation[] {
  const list = WORLD_PRAYER_CITIES.filter((c) => c.countryId === countryId);
  return list.length > 0 ? list : AZERBAIJAN_CITIES;
}

export function getCityById(cityId?: string | null): PrayerLocation {
  if (!cityId) return WORLD_PRAYER_CITIES[0];
  return WORLD_PRAYER_CITIES.find((c) => c.id === cityId) ?? WORLD_PRAYER_CITIES[0];
}

/**
 * Computes daily prayer schedule using the **Umm al-Qura University, Makkah** standard:
 * - Fajr: 18.5° below horizon (with high-latitude angle-based safeguard)
 * - Sunrise: 0.833°
 * - Dhuhr: Solar transit + 1 min
 * - Asr: Standard shadow factor = 1
 * - Maghrib: Sunset (0.833° + 1 min)
 * - Isha: Maghrib + 90 minutes (Maghrib + 120 minutes during Ramadan)
 */
export function calculatePrayerTimesForDate(
  location: PrayerLocation,
  year: number,
  month: number,
  day: number
): DailyPrayerSchedule {
  const utcMidday = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const utcOffsetHours = getTimeZoneOffsetHours(
    utcMidday,
    location.timeZone,
    location.fallbackUtcOffsetHours ?? BAKU_UTC_OFFSET_HOURS
  );

  const hijriParts = getHijriPartsUmmAlQura(utcMidday, location.timeZone);
  const isRamadan = hijriParts.month === 9;
  const ishaOffsetMinutes = isRamadan ? 120 : 90;

  const jDate = toJulianDate(year, month, day) - location.lng / (15 * 24);
  const tzDiff = utcOffsetHours - location.lng / 15;

  let fajrH = 5 / 24;
  let sunriseH = 6 / 24;
  let dhuhrH = 12 / 24;
  let asrH = 15 / 24;
  let maghribH = 18 / 24;

  for (let pass = 0; pass < 2; pass++) {
    const fajrMid = fixHour(12 - computeSolarPosition(jDate + fajrH).eqTimeHours) + tzDiff;
    const sunMid = fixHour(12 - computeSolarPosition(jDate + sunriseH).eqTimeHours) + tzDiff;
    const noonMid = fixHour(12 - computeSolarPosition(jDate + dhuhrH).eqTimeHours) + tzDiff;
    const asrMid = fixHour(12 - computeSolarPosition(jDate + asrH).eqTimeHours) + tzDiff;
    const magMid = fixHour(12 - computeSolarPosition(jDate + maghribH).eqTimeHours) + tzDiff;

    const sunriseOffset = computeSunAngleOffsetHours(jDate, sunriseH, location.lat, 0.833) ?? 6;
    const maghribOffset = computeSunAngleOffsetHours(jDate, maghribH, location.lat, 0.833) ?? 6;

    const sunriseHours = sunMid - sunriseOffset;
    const dhuhrHours = noonMid + 1 / 60;
    const asrHours = asrMid + computeAsrOffsetHours(jDate, asrH, location.lat);
    const maghribHours = magMid + maghribOffset + 1 / 60;

    // Fajr: Umm al-Qura 18.5°, with angle-based high-latitude safeguard when twilight never ends
    const nightDuration = Math.max(4, 24 - (maghribHours - sunriseHours));
    const fajrOffset =
      computeSunAngleOffsetHours(jDate, fajrH, location.lat, 18.5) ??
      sunriseOffset + (18.5 / 60) * nightDuration;
    const fajrHours =
      fajrOffset > sunriseOffset ? fajrMid - fajrOffset : sunriseHours - (18.5 / 60) * nightDuration;

    fajrH = fajrHours / 24;
    sunriseH = sunriseHours / 24;
    dhuhrH = dhuhrHours / 24;
    asrH = asrHours / 24;
    maghribH = maghribHours / 24;
  }

  const fajrMin = Math.round(fajrH * 1440);
  const sunriseMin = Math.round(sunriseH * 1440);
  const dhuhrMin = Math.round(dhuhrH * 1440);
  const asrMin = Math.round(asrH * 1440);
  const maghribMin = Math.round(maghribH * 1440);
  const ishaMin = maghribMin + ishaOffsetMinutes;

  const times: PrayerTimeEntry[] = [
    {
      key: 'fajr',
      label: 'Sübh (İmsak)',
      arabicLabel: 'الفجر',
      minutesFromMidnight: fajrMin,
      formattedTime: formatMinutesToHHMM(fajrMin),
    },
    {
      key: 'sunrise',
      label: 'Günəş',
      arabicLabel: 'الشروق',
      minutesFromMidnight: sunriseMin,
      formattedTime: formatMinutesToHHMM(sunriseMin),
    },
    {
      key: 'dhuhr',
      label: 'Zöhr',
      arabicLabel: 'الظهر',
      minutesFromMidnight: dhuhrMin,
      formattedTime: formatMinutesToHHMM(dhuhrMin),
    },
    {
      key: 'asr',
      label: 'Əsr',
      arabicLabel: 'العصر',
      minutesFromMidnight: asrMin,
      formattedTime: formatMinutesToHHMM(asrMin),
    },
    {
      key: 'maghrib',
      label: 'Məğrib',
      arabicLabel: 'المغرب',
      minutesFromMidnight: maghribMin,
      formattedTime: formatMinutesToHHMM(maghribMin),
    },
    {
      key: 'isha',
      label: 'İşa',
      arabicLabel: 'العشاء',
      minutesFromMidnight: ishaMin,
      formattedTime: formatMinutesToHHMM(ishaMin),
    },
  ];

  return {
    city: location,
    dateKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    gregorianLabel: formatGregorianAzerbaijani(year, month, day),
    hijriLabel: hijriParts.formatted,
    isRamadan,
    calculationMethodLabel: isRamadan
      ? 'Ümmül-Qura (Məkkə · 18.5° Fəcr · +120 dəq Ramazan İşası)'
      : 'Ümmül-Qura (Məkkə · 18.5° Fəcr · +90 dəq İşa)',
    utcOffsetHours,
    times,
  };
}

export function formatCountdownDuration(secondsTotal: number): string {
  const safe = Math.max(0, Math.floor(secondsTotal));
  const hh = Math.floor(safe / 3600);
  const mm = Math.floor((safe % 3600) / 60);
  const ss = safe % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export function formatShortRemainingAz(secondsTotal: number): string {
  const safe = Math.max(0, Math.floor(secondsTotal));
  const totalMin = Math.ceil(safe / 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh === 0) return `${mm} dəq qalıb`;
  if (mm === 0) return `${hh} saat qalıb`;
  return `${hh} saat ${mm} dəq qalıb`;
}

export function getNextPrayerCountdown(
  location: PrayerLocation,
  now: Date = new Date()
): NextPrayerCountdown {
  const parts = getCalendarPartsInTimeZone(
    now,
    location.timeZone,
    location.fallbackUtcOffsetHours ?? BAKU_UTC_OFFSET_HOURS
  );
  const today = calculatePrayerTimesForDate(location, parts.year, parts.month, parts.day);

  for (let i = 0; i < today.times.length; i++) {
    const entry = today.times[i];
    const targetSeconds = entry.minutesFromMidnight * 60;
    if (parts.secondsSinceMidnight < targetSeconds) {
      const remaining = targetSeconds - parts.secondsSinceMidnight;
      const currentPrayerKey = i === 0 ? 'isha' : today.times[i - 1].key;
      return {
        currentPrayerKey,
        nextPrayer: entry,
        isTomorrow: false,
        secondsRemaining: remaining,
        formattedCountdown: formatCountdownDuration(remaining),
      };
    }
  }

  const tomorrowDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
  const tomorrow = calculatePrayerTimesForDate(
    location,
    tomorrowDate.getUTCFullYear(),
    tomorrowDate.getUTCMonth() + 1,
    tomorrowDate.getUTCDate()
  );
  const fajrTomorrow = tomorrow.times[0];
  const remaining = 86400 - parts.secondsSinceMidnight + fajrTomorrow.minutesFromMidnight * 60;

  return {
    currentPrayerKey: 'isha',
    nextPrayer: fajrTomorrow,
    isTomorrow: true,
    secondsRemaining: remaining,
    formattedCountdown: formatCountdownDuration(remaining),
  };
}

export function calculateWeeklyPrayerSchedule(
  location: PrayerLocation,
  startDate: Date = new Date(),
  days = 7
): DailyPrayerSchedule[] {
  const parts = getCalendarPartsInTimeZone(
    startDate,
    location.timeZone,
    location.fallbackUtcOffsetHours ?? BAKU_UTC_OFFSET_HOURS
  );
  const list: DailyPrayerSchedule[] = [];
  for (let offset = 0; offset < days; offset++) {
    const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + offset));
    list.push(
      calculatePrayerTimesForDate(
        location,
        d.getUTCFullYear(),
        d.getUTCMonth() + 1,
        d.getUTCDate()
      )
    );
  }
  return list;
}
