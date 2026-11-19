import {
  formatGregorianAzerbaijani,
  getHijriPartsUmmAlQura,
} from './prayerTimes';

export const HIJRI_MONTHS_LIST_AZ = [
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
] as const;

export interface HijriConversionResult {
  dateKey: string;
  gregorianLabel: string;
  hijriYear: number;
  hijriMonth: number;
  hijriDay: number;
  hijriMonthName: string;
  hijriFormatted: string;
}

export interface GregorianConversionResult {
  dateKey: string;
  year: number;
  month: number;
  day: number;
  gregorianLabel: string;
  hijriYear: number;
  hijriMonth: number;
  hijriDay: number;
  hijriFormatted: string;
  exactDayMatched: boolean;
}

export interface BlessedDayCountdown {
  id: string;
  title: string;
  subtitle: string;
  hijriYear: number;
  hijriMonth: number;
  hijriDay: number;
  hijriLabel: string;
  gregorianDateKey: string;
  gregorianLabel: string;
  daysRemaining: number;
}

interface BlessedDayDefinition {
  id: string;
  title: string;
  subtitle: string;
  month: number;
  day: number;
}

const BLESSED_DAYS_CATALOG: readonly BlessedDayDefinition[] = [
  {
    id: 'ramadan-start',
    title: 'Ramazan başlanğıcı',
    subtitle: 'Mübarək Ramazan ayının ilk günü',
    month: 9,
    day: 1,
  },
  {
    id: 'laylat-al-qadr',
    title: 'Qədr gecəsi (27 Ramazan)',
    subtitle: 'Min aydan xeyirli olan gecənin ehtimal olunan 27-ci günü',
    month: 9,
    day: 27,
  },
  {
    id: 'eid-al-fitr',
    title: 'Ramazan Bayramı',
    subtitle: '1 Şəvval · Fitr bayramı',
    month: 10,
    day: 1,
  },
  {
    id: 'arafah',
    title: 'Ərəfə günü',
    subtitle: '9 Zülhiccə · Dua və bağışlanma günü',
    month: 12,
    day: 9,
  },
  {
    id: 'eid-al-adha',
    title: 'Qurban Bayramı',
    subtitle: '10 Zülhiccə · Qurban bayramı',
    month: 12,
    day: 10,
  },
  {
    id: 'hijri-new-year',
    title: 'Hicri Yeni İl',
    subtitle: '1 Məhərrəm · Yeni Hicri ilin ilk günü',
    month: 1,
    day: 1,
  },
  {
    id: 'ashura',
    title: 'Aşura günü',
    subtitle: '10 Məhərrəm · Məhərrəm ayının 10-cu günü',
    month: 1,
    day: 10,
  },
];

function parseDateKey(dateKey: string): { year: number; month: number; day: number } | null {
  const match = dateKey.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() + 1 !== month ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function toIsoDateKey(utcDate: Date): string {
  const y = utcDate.getUTCFullYear();
  const m = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function gregorianDateKeyToHijri(dateKey: string): HijriConversionResult | null {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return null;
  const utcMidday = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12, 0, 0));
  const parts = getHijriPartsUmmAlQura(utcMidday, 'UTC');
  return {
    dateKey: toIsoDateKey(utcMidday),
    gregorianLabel: formatGregorianAzerbaijani(parsed.year, parsed.month, parsed.day),
    hijriYear: parts.year,
    hijriMonth: parts.month,
    hijriDay: parts.day,
    hijriMonthName: HIJRI_MONTHS_LIST_AZ[parts.month - 1] ?? '',
    hijriFormatted: parts.formatted,
  };
}

/**
 * Deterministically converts a Hijri (Umm al-Qura) date to the matching Gregorian date
 * by computing an astronomical epoch estimate and scanning +/- 60 days against Intl Umm al-Qura.
 */
export function hijriToGregorianDate(
  rawYear: number,
  rawMonth: number,
  rawDay: number
): GregorianConversionResult {
  const hijriYear = Math.max(1356, Math.min(1500, Math.round(rawYear)));
  const hijriMonth = Math.max(1, Math.min(12, Math.round(rawMonth)));
  const hijriDay = Math.max(1, Math.min(30, Math.round(rawDay)));

  // Julian / civil estimate: Hijri 1/1/1 ≈ 622-07-19 UTC; mean lunar year ≈ 354.36707 days, month ≈ 29.53059 days
  const hijriEpochMs = Date.UTC(622, 6, 19, 12, 0, 0);
  const approxDays =
    (hijriYear - 1) * 354.36707 + (hijriMonth - 1) * 29.53059 + (hijriDay - 1);
  const approxMs = hijriEpochMs + Math.round(approxDays) * 86_400_000;

  let monthFallbackCandidate: Date | null = null;

  for (let offset = 0; offset <= 60; offset++) {
    const probes = offset === 0 ? [0] : [offset, -offset];
    for (const delta of probes) {
      const candidate = new Date(approxMs + delta * 86_400_000);
      const parts = getHijriPartsUmmAlQura(candidate, 'UTC');
      if (parts.year === hijriYear && parts.month === hijriMonth) {
        if (parts.day === hijriDay) {
          const y = candidate.getUTCFullYear();
          const m = candidate.getUTCMonth() + 1;
          const d = candidate.getUTCDate();
          return {
            dateKey: toIsoDateKey(candidate),
            year: y,
            month: m,
            day: d,
            gregorianLabel: formatGregorianAzerbaijani(y, m, d),
            hijriYear: parts.year,
            hijriMonth: parts.month,
            hijriDay: parts.day,
            hijriFormatted: parts.formatted,
            exactDayMatched: true,
          };
        }
        if (hijriDay === 30 && parts.day === 29) {
          monthFallbackCandidate = candidate;
        }
      }
    }
  }

  // Some Hijri months have 29 days in Umm al-Qura; if user chose day 30, clamp cleanly to day 29
  const chosen = monthFallbackCandidate ?? new Date(approxMs);
  const resolvedParts = getHijriPartsUmmAlQura(chosen, 'UTC');
  const y = chosen.getUTCFullYear();
  const m = chosen.getUTCMonth() + 1;
  const d = chosen.getUTCDate();
  return {
    dateKey: toIsoDateKey(chosen),
    year: y,
    month: m,
    day: d,
    gregorianLabel: formatGregorianAzerbaijani(y, m, d),
    hijriYear: resolvedParts.year,
    hijriMonth: resolvedParts.month,
    hijriDay: resolvedParts.day,
    hijriFormatted: resolvedParts.formatted,
    exactDayMatched: false,
  };
}

export function getUpcomingBlessedDays(
  now: Date = new Date(),
  maxCount = 7
): BlessedDayCountdown[] {
  const todayUtc = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)
  );
  const currentHijri = getHijriPartsUmmAlQura(todayUtc, 'UTC');

  const entries: BlessedDayCountdown[] = [];

  for (const def of BLESSED_DAYS_CATALOG) {
    // Check current Hijri year first; if already passed, take next Hijri year
    let target = hijriToGregorianDate(currentHijri.year, def.month, def.day);
    let targetUtc = new Date(Date.UTC(target.year, target.month - 1, target.day, 12, 0, 0));
    let diffDays = Math.round((targetUtc.getTime() - todayUtc.getTime()) / 86_400_000);

    if (diffDays < 0) {
      target = hijriToGregorianDate(currentHijri.year + 1, def.month, def.day);
      targetUtc = new Date(Date.UTC(target.year, target.month - 1, target.day, 12, 0, 0));
      diffDays = Math.round((targetUtc.getTime() - todayUtc.getTime()) / 86_400_000);
    }

    entries.push({
      id: def.id,
      title: def.title,
      subtitle: def.subtitle,
      hijriYear: target.hijriYear,
      hijriMonth: target.hijriMonth,
      hijriDay: target.hijriDay,
      hijriLabel: target.hijriFormatted,
      gregorianDateKey: target.dateKey,
      gregorianLabel: target.gregorianLabel,
      daysRemaining: Math.max(0, diffDays),
    });
  }

  return entries
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, maxCount);
}
