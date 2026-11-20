import { JUZ_PAGE_RANGES, TOTAL_QURAN_PAGES } from './quran';

export interface MushafJuzSegment {
  juz: number;
  startPage: number;
  endPage: number;
  isCurrent: boolean;
  isPassed: boolean;
}

export interface MushafPositionSummary {
  pageNumber: number;
  totalPages: number;
  percent: number;
  juzNumber: number;
  juzStartPage: number;
  juzEndPage: number;
  juzTotalPages: number;
  pageInJuz: number;
  pagesLeftInJuz: number;
  nextJuzStartPage: number | null;
  pagesUntilNextJuz: number;
  segments: MushafJuzSegment[];
}

export function computeMushafPosition(rawPageNumber: number): MushafPositionSummary {
  const safePage = Math.max(1, Math.min(TOTAL_QURAN_PAGES, Math.trunc(rawPageNumber) || 1));
  const currentRange =
    JUZ_PAGE_RANGES.find((r) => safePage >= r.startPage && safePage <= r.endPage) ??
    JUZ_PAGE_RANGES[0];

  const juzTotalPages = currentRange.endPage - currentRange.startPage + 1;
  const pageInJuz = safePage - currentRange.startPage + 1;
  const pagesLeftInJuz = currentRange.endPage - safePage;
  const nextRange = JUZ_PAGE_RANGES.find((r) => r.juz === currentRange.juz + 1) ?? null;

  const segments: MushafJuzSegment[] = JUZ_PAGE_RANGES.map((r) => ({
    juz: r.juz,
    startPage: r.startPage,
    endPage: r.endPage,
    isCurrent: r.juz === currentRange.juz,
    isPassed: r.juz < currentRange.juz,
  }));

  return {
    pageNumber: safePage,
    totalPages: TOTAL_QURAN_PAGES,
    percent: Math.round((safePage / TOTAL_QURAN_PAGES) * 100),
    juzNumber: currentRange.juz,
    juzStartPage: currentRange.startPage,
    juzEndPage: currentRange.endPage,
    juzTotalPages,
    pageInJuz,
    pagesLeftInJuz,
    nextJuzStartPage: nextRange ? nextRange.startPage : null,
    pagesUntilNextJuz: nextRange ? nextRange.startPage - safePage : 0,
    segments,
  };
}
