import {
  SurahTranslationPayload,
  parseQuranEncSurah,
} from './channel';
import {
  MushafPagePayload,
  UthmaniPageAyahInput,
  attachMushafPagesToSurah,
  mergePageAyahsWithMusayev,
  parseQuranComChapterVersesPages,
  parseQuranComPageVerses,
} from './quran';

export async function parseJsonSafely<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok || !contentType.includes('application/json')) {
    return null;
  }
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchSurahWithFallback(
  surahNumber: number,
  signal?: AbortSignal
): Promise<SurahTranslationPayload> {
  // 1. Primary: backend /api/quran/surah/:surahNumber
  try {
    const apiRes = await fetch(`/api/quran/surah/${surahNumber}`, { signal });
    const apiJson = await parseJsonSafely<SurahTranslationPayload>(apiRes);
    if (apiJson && Array.isArray(apiJson.ayahs) && apiJson.ayahs.length > 0) {
      return apiJson;
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
  }

  // 2. Direct CORS fallback: quranenc.com (Əlixan Musayev v1.0.4) + quran.com Madinah page numbers
  const [quranEncResult, pagesResult] = await Promise.allSettled([
    fetch(`https://quranenc.com/api/v1/translation/sura/azeri_musayev/${surahNumber}`, { signal }),
    fetch(
      `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?fields=page_number&per_page=300`,
      { signal }
    ),
  ]);

  if (quranEncResult.status === 'rejected' && quranEncResult.reason instanceof DOMException && quranEncResult.reason.name === 'AbortError') {
    throw quranEncResult.reason;
  }

  if (quranEncResult.status === 'fulfilled' && quranEncResult.value.ok) {
    const quranEncJson = await quranEncResult.value.json();
    let parsed = parseQuranEncSurah(surahNumber, quranEncJson);
    if (parsed.ayahs.length > 0) {
      if (pagesResult.status === 'fulfilled' && pagesResult.value.ok) {
        try {
          const pagesJson = await pagesResult.value.json();
          const pageMap = parseQuranComChapterVersesPages(pagesJson);
          parsed = attachMushafPagesToSurah(parsed, pageMap);
        } catch {
          // keep parsed translation cleanly even if page metadata fails
        }
      }
      return parsed;
    }
  }

  throw new Error(`Surah ${surahNumber} unavailable`);
}

export async function fetchMushafPageWithFallback(
  pageNumber: number,
  signal?: AbortSignal
): Promise<MushafPagePayload> {
  // 1. Primary: backend /api/quran/page/:pageNumber
  try {
    const apiRes = await fetch(`/api/quran/page/${pageNumber}`, { signal });
    const apiJson = await parseJsonSafely<MushafPagePayload>(apiRes);
    if (apiJson && Array.isArray(apiJson.ayahs) && apiJson.ayahs.length > 0) {
      return apiJson;
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
  }

  // 2. Direct CORS fallback: quran.com v4 + quranenc.com
  const quranComRes = await fetch(
    `https://api.quran.com/api/v4/verses/by_page/${pageNumber}?fields=text_uthmani&per_page=50`,
    { signal }
  );
  if (!quranComRes.ok) {
    throw new Error(`Page ${pageNumber} unavailable`);
  }
  const quranComJson = await quranComRes.json();
  const uthmaniAyahs: UthmaniPageAyahInput[] = parseQuranComPageVerses(quranComJson);
  if (uthmaniAyahs.length === 0) {
    throw new Error(`Page ${pageNumber} returned empty`);
  }

  const uniqueSurahNumbers = Array.from(new Set(uthmaniAyahs.map((a) => a.surahNumber)));
  const surahPayloads = await Promise.all(
    uniqueSurahNumbers.map(async (sNum) => [sNum, await fetchSurahWithFallback(sNum, signal)] as const)
  );
  const surahMap = new Map<number, SurahTranslationPayload>(surahPayloads);

  return mergePageAyahsWithMusayev(pageNumber, uthmaniAyahs, surahMap);
}
