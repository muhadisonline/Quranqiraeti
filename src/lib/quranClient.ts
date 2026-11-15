import {
  SurahTranslationPayload,
  parseQuranEncSurah,
} from './channel';
import {
  MushafPagePayload,
  UthmaniPageAyahInput,
  mergePageAyahsWithMusayev,
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

  // 2. Direct CORS fallback: quranenc.com (Əlixan Musayev v1.0.4)
  const quranEncRes = await fetch(
    `https://quranenc.com/api/v1/translation/sura/azeri_musayev/${surahNumber}`,
    { signal }
  );
  if (quranEncRes.ok) {
    const quranEncJson = await quranEncRes.json();
    const parsed = parseQuranEncSurah(surahNumber, quranEncJson);
    if (parsed.ayahs.length > 0) {
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
