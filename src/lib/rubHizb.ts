import { RAW_RUB_HIZB_LIST } from '../data/rubHizbData';
import { normalizeAzerbaijaniText } from './channel';
import { getSurahByNumber } from './quran';

export interface RubHizbEntry {
  rub: number;
  juz: number;
  hizb: number;
  quarterInHizb: 1 | 2 | 3 | 4;
  quarterLabel: string;
  surahNumber: number;
  surahName: string;
  arabicSurahName: string;
  ayahNumber: number;
  pageNumber: number;
}

const QUARTER_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Hizb başlanğıcı',
  2: '1/4 Rüb (ربع)',
  3: '1/2 Nisf (نصف)',
  4: '3/4 Sələsə (ثلاثة أرباع)',
};

export const RUB_HIZB_ENTRIES: RubHizbEntry[] = RAW_RUB_HIZB_LIST.map((item) => {
  const juz = Math.ceil(item.rub / 8);
  const hizb = Math.ceil(item.rub / 4);
  const quarterInHizb = (((item.rub - 1) % 4) + 1) as 1 | 2 | 3 | 4;
  const surah = getSurahByNumber(item.surah);

  return {
    rub: item.rub,
    juz,
    hizb,
    quarterInHizb,
    quarterLabel: QUARTER_LABELS[quarterInHizb],
    surahNumber: item.surah,
    surahName: surah?.name ?? `Surə ${item.surah}`,
    arabicSurahName: surah?.arabicName ?? '',
    ayahNumber: item.ayah,
    pageNumber: item.page,
  };
});

export function filterRubHizbEntries(
  entries: RubHizbEntry[],
  options: { juz?: number | 'all'; query?: string }
): RubHizbEntry[] {
  const juzFilter = options.juz ?? 'all';
  const rawQuery = (options.query ?? '').trim();
  const normQuery = normalizeAzerbaijaniText(rawQuery);

  return entries.filter((entry) => {
    if (juzFilter !== 'all' && entry.juz !== juzFilter) {
      return false;
    }
    if (!normQuery) return true;

    const numMatch = /^\d+$/.test(rawQuery) ? Number.parseInt(rawQuery, 10) : null;
    if (numMatch !== null) {
      if (
        entry.rub === numMatch ||
        entry.hizb === numMatch ||
        entry.pageNumber === numMatch ||
        entry.surahNumber === numMatch
      ) {
        return true;
      }
    }

    const haystack = normalizeAzerbaijaniText(
      `${entry.surahName} ${entry.surahNumber}:${entry.ayahNumber} rub ${entry.rub} hizb ${entry.hizb} cuz ${entry.juz} sehife ${entry.pageNumber}`
    );
    return haystack.includes(normQuery);
  });
}

export function getRubsOnPage(pageNumber: number): RubHizbEntry[] {
  return RUB_HIZB_ENTRIES.filter((entry) => entry.pageNumber === pageNumber);
}

export function getActiveRubForPage(pageNumber: number): RubHizbEntry {
  let latest = RUB_HIZB_ENTRIES[0];
  for (const entry of RUB_HIZB_ENTRIES) {
    if (entry.pageNumber <= pageNumber) {
      latest = entry;
    } else {
      break;
    }
  }
  return latest;
}
