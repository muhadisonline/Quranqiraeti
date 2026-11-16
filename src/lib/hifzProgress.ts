import { clampMuhaffizPage } from './muhaffiz';
import { TOTAL_QURAN_PAGES } from './quran';

export type HifzPageStatus = 'none' | 'learning' | 'memorized';

export interface HifzProgressState {
  pages: Record<number, Exclude<HifzPageStatus, 'none'>>;
  bookmarkedPage: number | null;
  updatedAt: string | null;
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

export function summarizeHifzProgress(state: HifzProgressState): {
  memorizedCount: number;
  learningCount: number;
  memorizedPercent: number;
} {
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
