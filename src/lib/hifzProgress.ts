import { clampMuhaffizPage } from './muhaffiz';
import { JUZ_PAGE_RANGES, TOTAL_QURAN_PAGES } from './quran';

export type HifzPageStatus = 'none' | 'learning' | 'memorized';

export interface HifzProgressState {
  pages: Record<number, Exclude<HifzPageStatus, 'none'>>;
  bookmarkedPage: number | null;
  updatedAt: string | null;
}

export interface JuzHifzSummary {
  juz: number;
  startPage: number;
  endPage: number;
  totalPages: number;
  memorizedPages: number;
  learningPages: number;
  memorizedPercent: number;
}

export const EMPTY_HIFZ_PROGRESS: HifzProgressState = {
  pages: {},
  bookmarkedPage: null,
  updatedAt: null,
};

export function sanitizeHifzProgress(input: unknown): HifzProgressState {
  if (!input || typeof input !== 'object') {
    return { ...EMPTY_HIFZ_PROGRESS, pages: {} };
  }
  const obj = input as Partial<HifzProgressState>;
  const cleanPages: Record<number, Exclude<HifzPageStatus, 'none'>> = {};

  if (obj.pages && typeof obj.pages === 'object') {
    for (const [k, v] of Object.entries(obj.pages)) {
      const pageNum = Number.parseInt(k, 10);
      if (
        Number.isFinite(pageNum) &&
        pageNum >= 1 &&
        pageNum <= TOTAL_QURAN_PAGES &&
        (v === 'learning' || v === 'memorized')
      ) {
        cleanPages[pageNum] = v;
      }
    }
  }

  let bookmarkedPage: number | null = null;
  if (
    typeof obj.bookmarkedPage === 'number' &&
    Number.isFinite(obj.bookmarkedPage) &&
    obj.bookmarkedPage >= 1 &&
    obj.bookmarkedPage <= TOTAL_QURAN_PAGES
  ) {
    bookmarkedPage = clampMuhaffizPage(obj.bookmarkedPage);
  }

  return {
    pages: cleanPages,
    bookmarkedPage,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : null,
  };
}

export function setHifzPageStatus(
  state: HifzProgressState,
  pageNumber: number,
  status: HifzPageStatus,
  nowIso = new Date().toISOString()
): HifzProgressState {
  const page = clampMuhaffizPage(pageNumber);
  const nextPages = { ...state.pages };
  if (status === 'none') {
    delete nextPages[page];
  } else {
    nextPages[page] = status;
  }
  return {
    ...state,
    pages: nextPages,
    updatedAt: nowIso,
  };
}

export function toggleHifzBookmark(
  state: HifzProgressState,
  pageNumber: number,
  nowIso = new Date().toISOString()
): HifzProgressState {
  const page = clampMuhaffizPage(pageNumber);
  return {
    ...state,
    bookmarkedPage: state.bookmarkedPage === page ? null : page,
    updatedAt: nowIso,
  };
}

export function getHifzPageStatus(
  state: HifzProgressState,
  pageNumber: number
): HifzPageStatus {
  const page = clampMuhaffizPage(pageNumber);
  return state.pages[page] ?? 'none';
}

export interface HifzSummary {
  memorizedCount: number;
  learningCount: number;
  memorizedPercent: number;
}

export function summarizeHifzProgress(state: HifzProgressState): HifzSummary {
  let memorizedCount = 0;
  let learningCount = 0;
  for (const val of Object.values(state.pages)) {
    if (val === 'memorized') memorizedCount++;
    else if (val === 'learning') learningCount++;
  }
  const memorizedPercent = Math.round((memorizedCount / TOTAL_QURAN_PAGES) * 1000) / 10;
  return {
    memorizedCount,
    learningCount,
    memorizedPercent,
  };
}

export function summarizeJuzHifzProgress(
  state: HifzProgressState,
  ranges: typeof JUZ_PAGE_RANGES = JUZ_PAGE_RANGES
): JuzHifzSummary[] {
  return ranges.map((range) => {
    const totalPages = Math.max(1, range.endPage - range.startPage + 1);
    let memorizedPages = 0;
    let learningPages = 0;
    for (let p = range.startPage; p <= range.endPage; p++) {
      const status = state.pages[p];
      if (status === 'memorized') memorizedPages++;
      else if (status === 'learning') learningPages++;
    }
    return {
      juz: range.juz,
      startPage: range.startPage,
      endPage: range.endPage,
      totalPages,
      memorizedPages,
      learningPages,
      memorizedPercent: Math.round((memorizedPages / totalPages) * 100),
    };
  });
}

export interface HifzReviewPageEntry {
  pageNumber: number;
  status: HifzPageStatus;
  mistakeCount: number;
  isBookmarked: boolean;
  priority: 'mistakes' | 'learning' | 'memorized';
}

export function buildHifzReviewQueue(
  state: HifzProgressState,
  missedWords: Array<{ pageNumber: number }>
): HifzReviewPageEntry[] {
  const mistakesByPage = new Map<number, number>();
  for (const m of missedWords) {
    const p = clampMuhaffizPage(m.pageNumber);
    mistakesByPage.set(p, (mistakesByPage.get(p) ?? 0) + 1);
  }

  const allPages = new Set<number>();
  for (const key of Object.keys(state.pages)) {
    const p = Number.parseInt(key, 10);
    if (p >= 1 && p <= TOTAL_QURAN_PAGES) allPages.add(p);
  }
  for (const p of mistakesByPage.keys()) {
    allPages.add(p);
  }
  if (state.bookmarkedPage !== null) {
    allPages.add(state.bookmarkedPage);
  }

  const priorityRank: Record<HifzReviewPageEntry['priority'], number> = {
    mistakes: 0,
    learning: 1,
    memorized: 2,
  };

  const entries: HifzReviewPageEntry[] = [];
  for (const pageNumber of allPages) {
    const status = getHifzPageStatus(state, pageNumber);
    const mistakeCount = mistakesByPage.get(pageNumber) ?? 0;
    const isBookmarked = state.bookmarkedPage === pageNumber;
    const priority: HifzReviewPageEntry['priority'] =
      mistakeCount > 0 ? 'mistakes' : status === 'memorized' ? 'memorized' : 'learning';

    if (mistakeCount > 0 || status !== 'none' || isBookmarked) {
      entries.push({
        pageNumber,
        status,
        mistakeCount,
        isBookmarked,
        priority,
      });
    }
  }

  entries.sort((a, b) => {
    if (priorityRank[a.priority] !== priorityRank[b.priority]) {
      return priorityRank[a.priority] - priorityRank[b.priority];
    }
    if (b.mistakeCount !== a.mistakeCount) {
      return b.mistakeCount - a.mistakeCount;
    }
    return a.pageNumber - b.pageNumber;
  });

  return entries;
}

