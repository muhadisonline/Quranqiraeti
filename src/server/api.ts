import express, { Request, Response } from 'express';
import {
  ChannelStats,
  RecitationVideo,
  SurahRequestRecord,
  SurahTranslationPayload,
  extractYouTubeShortsInitial,
  parseQuranEncSurah,
  parseYouTubeShortsContinuation,
  parseYouTubeVideosPage,
  validateSurahRequest,
} from '../lib/channel';
import {
  MushafPagePayload,
  TOTAL_QURAN_PAGES,
  UthmaniPageAyahInput,
  attachMushafPagesToSurah,
  mergePageAyahsWithMusayev,
  parseQuranComChapterVersesPages,
  parseQuranComPageVerses,
} from '../lib/quran';
import {
  MuhaffizPageData,
  QuranComRawVerseWithWords,
  buildSyntheticMuhaffizRows,
  buildTokensFromQuranComVerses,
  groupTokensIntoMushafRows,
} from '../lib/muhaffiz';
import { parseAlQuranSearchPayload } from '../lib/readerState';
import {
  buildAiIndexJson,
  buildCoreSitemapXml,
  buildDynamicOgSvg,
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildMuhaffizSitemapXml,
  buildMushafSitemapXml,
  buildRobotsTxt,
  buildSitemapIndexXml,
  buildSitemapXml,
  buildSurahsSitemapXml,
  buildVideoSitemapXml,
  submitIndexNowPing,
} from '../lib/seo';
import {
  CONNECTED_PAGES,
  ConnectedPageKey,
  PageTelemetryEventRecord,
  ReferrerType,
  TelemetryStatus,
  TimeWindowGranularity,
  aggregateTelemetry,
} from '../lib/analytics';
import {
  DEFAULT_CHANNEL_STATS,
  SEED_LONG_VIDEOS,
  SEED_SHORTS,
} from '../data/recitations';

const CACHE_TTL_MS = 10 * 60 * 1000;

let cachedChannel: {
  fetchedAt: number;
  complete: boolean;
  stats: ChannelStats;
  longVideos: RecitationVideo[];
  shorts: RecitationVideo[];
} | null = null;

let inflightChannelPromise: Promise<{
  stats: ChannelStats;
  longVideos: RecitationVideo[];
  shorts: RecitationVideo[];
}> | null = null;

const surahTranslationCache = new Map<number, SurahTranslationPayload>();
const mushafPageCache = new Map<number, MushafPagePayload>();
const muhaffizPageCache = new Map<number, MuhaffizPageData>();

const surahRequests: SurahRequestRecord[] = [
  {
    id: 'req-1',
    surahName: 'Mülk surəsi (1–30)',
    reciter: 'Maher Al-Muaiqly',
    email: '',
    note: 'Tam surə şəkildə Azərbaycan dilində tərcümə ilə paylaşılmasını rica edirik.',
    createdAt: '2026-11-12T18:30:00Z',
  },
  {
    id: 'req-2',
    surahName: 'Vaqiə surəsi',
    reciter: 'Yasser Al-Dosari',
    email: '',
    note: 'Axşam tilavətləri üçün səlis səs və aydın altyazı ilə.',
    createdAt: '2026-11-14T09:15:00Z',
  },
];

const serverTelemetryEvents: PageTelemetryEventRecord[] = [];
const MAX_SERVER_TELEMETRY_EVENTS = 1500;
const VALID_PAGE_KEYS = new Set<ConnectedPageKey>(CONNECTED_PAGES.map((p) => p.pageKey));

export async function fetchSurahTranslation(surahNumber: number): Promise<SurahTranslationPayload> {
  const cached = surahTranslationCache.get(surahNumber);
  if (cached && cached.ayahs.length > 0 && cached.ayahs[0]?.pageNumber) return cached;

  try {
    const [encResult, pagesResult] = await Promise.allSettled([
      fetch(`https://quranenc.com/api/v1/translation/sura/azeri_musayev/${surahNumber}`, {
        signal: AbortSignal.timeout(7000),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }),
      fetch(
        `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?fields=page_number&per_page=300`,
        {
          signal: AbortSignal.timeout(7000),
          headers: { 'User-Agent': 'Mozilla/5.0' },
        }
      ),
    ]);

    if (encResult.status === 'fulfilled' && encResult.value.ok) {
      const json = await encResult.value.json();
      let parsed = parseQuranEncSurah(surahNumber, json);
      if (parsed.ayahs.length > 0) {
        let pageMap = new Map<number, { pageNumber: number; juzNumber: number }>();
        if (pagesResult.status === 'fulfilled' && pagesResult.value.ok) {
          try {
            const pagesJson = await pagesResult.value.json();
            pageMap = parseQuranComChapterVersesPages(pagesJson);
          } catch {
            // fallback page metadata below if needed
          }
        }

        if (pageMap.size === 0) {
          try {
            const alqRes = await fetch(
              `https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`,
              { signal: AbortSignal.timeout(6000) }
            );
            if (alqRes.ok) {
              const alqJson = await alqRes.json();
              const rawAyahs = Array.isArray(alqJson?.data?.ayahs) ? alqJson.data.ayahs : [];
              for (const item of rawAyahs) {
                const ayahNum = Number(item?.numberInSurah ?? 0);
                const pageNum = Number(item?.page ?? 0);
                const juzNum = Number(item?.juz ?? 0);
                if (ayahNum > 0 && pageNum >= 1 && pageNum <= TOTAL_QURAN_PAGES) {
                  pageMap.set(ayahNum, {
                    pageNumber: pageNum,
                    juzNumber: juzNum >= 1 && juzNum <= 30 ? juzNum : 1,
                  });
                }
              }
            }
          } catch {
            // keep translation without blocking
          }
        }

        parsed = attachMushafPagesToSurah(parsed, pageMap);
        surahTranslationCache.set(surahNumber, parsed);
        return parsed;
      }
    }
  } catch {
    // fallback below
  }

  const fallbackRes = await fetch(
    `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,az.musayev`,
    { signal: AbortSignal.timeout(7000) }
  );
  if (!fallbackRes.ok) {
    throw new Error(`Surah ${surahNumber} translation unavailable`);
  }
  const fallbackJson = await fallbackRes.json();
  const arAyahs = fallbackJson?.data?.[0]?.ayahs ?? [];
  const azAyahs = fallbackJson?.data?.[1]?.ayahs ?? [];
  const payload: SurahTranslationPayload = {
    surahNumber,
    translatorName: 'Əlixan Musayev',
    editionVersion: '1.0.4',
    ayahs: arAyahs.map(
      (ar: { numberInSurah?: number; page?: number; juz?: number; text?: string }, idx: number) => ({
        surahNumber,
        ayahNumber: ar.numberInSurah ?? idx + 1,
        pageNumber: typeof ar.page === 'number' ? ar.page : undefined,
        juzNumber: typeof ar.juz === 'number' ? ar.juz : undefined,
        arabicText: String(ar.text ?? '').trim(),
        translation: String(azAyahs[idx]?.text ?? '').trim(),
        footnotes: '',
      })
    ),
  };
  if (payload.ayahs.length > 0) {
    surahTranslationCache.set(surahNumber, payload);
  }
  return payload;
}

export async function fetchMushafPage(pageNumber: number): Promise<MushafPagePayload> {
  const cached = mushafPageCache.get(pageNumber);
  if (cached && cached.ayahs.length > 0) return cached;

  let uthmaniAyahs: UthmaniPageAyahInput[] = [];

  try {
    const quranComRes = await fetch(
      `https://api.quran.com/api/v4/verses/by_page/${pageNumber}?fields=text_uthmani&per_page=50`,
      {
        signal: AbortSignal.timeout(7000),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }
    );
    if (quranComRes.ok) {
      const quranComJson = await quranComRes.json();
      uthmaniAyahs = parseQuranComPageVerses(quranComJson);
    }
  } catch {
    // fallback below
  }

  if (uthmaniAyahs.length === 0) {
    const res = await fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`, {
      signal: AbortSignal.timeout(7000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) {
      throw new Error(`Quran page ${pageNumber} unavailable`);
    }
    const json = await res.json();
    const rawAyahs = Array.isArray(json?.data?.ayahs) ? json.data.ayahs : [];
    uthmaniAyahs = rawAyahs.map(
      (item: {
        surah?: { number?: number };
        numberInSurah?: number;
        juz?: number;
        text?: string;
      }) => ({
        surahNumber: item.surah?.number ?? 1,
        ayahNumber: item.numberInSurah ?? 1,
        juzNumber: item.juz ?? 1,
        arabicText: String(item.text ?? '').trim(),
      })
    );
  }

  if (uthmaniAyahs.length === 0) {
    throw new Error(`Quran page ${pageNumber} returned empty ayahs`);
  }

  const uniqueSurahNumbers = Array.from(new Set(uthmaniAyahs.map((a) => a.surahNumber)));
  const surahPayloads = await Promise.all(
    uniqueSurahNumbers.map(async (surahNum) => [surahNum, await fetchSurahTranslation(surahNum)] as const)
  );
  const surahMap = new Map<number, SurahTranslationPayload>(surahPayloads);

  const merged = mergePageAyahsWithMusayev(pageNumber, uthmaniAyahs, surahMap);
  if (merged.ayahs.length > 0) {
    mushafPageCache.set(pageNumber, merged);
  }
  return merged;
}

export async function fetchMuhaffizPage(pageNumber: number): Promise<MuhaffizPageData> {
  const cached = muhaffizPageCache.get(pageNumber);
  if (cached && cached.rows.length > 0) return cached;

  try {
    const res = await fetch(
      `https://api.quran.com/api/v4/verses/by_page/${pageNumber}?words=true&word_fields=code_v1,text_uthmani,line_number,char_type_name&per_page=50`,
      {
        signal: AbortSignal.timeout(7000),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }
    );

    if (res.ok) {
      const json = (await res.json()) as { verses?: QuranComRawVerseWithWords[] };
      const rawVerses = Array.isArray(json?.verses) ? json.verses : [];
      if (rawVerses.length > 0) {
        const uthmaniAyahs: UthmaniPageAyahInput[] = rawVerses.map((v) => {
          const [rawSurah, rawAyah] = String(v.verse_key ?? '1:1').split(':');
          const surahNumber = Number.parseInt(rawSurah, 10) || 1;
          const ayahNumber = Number.parseInt(rawAyah, 10) || 1;
          const wordsOnly = (v.words ?? [])
            .filter((w) => w.char_type_name !== 'end')
            .map((w) => String(w.text_uthmani ?? w.text ?? '').trim())
            .filter(Boolean);
          return {
            surahNumber,
            ayahNumber,
            juzNumber: Number(v.juz_number) || 1,
            arabicText: wordsOnly.join(' '),
          };
        });

        const uniqueSurahNumbers = Array.from(new Set(uthmaniAyahs.map((a) => a.surahNumber)));
        const surahPayloads = await Promise.all(
          uniqueSurahNumbers.map(async (sNum) => {
            try {
              return [sNum, await fetchSurahTranslation(sNum)] as const;
            } catch {
              return [
                sNum,
                {
                  surahNumber: sNum,
                  translatorName: 'Əlixan Musayev',
                  editionVersion: '1.0.4',
                  ayahs: [],
                } satisfies SurahTranslationPayload,
              ] as const;
            }
          })
        );

        const surahMap = new Map<number, SurahTranslationPayload>(surahPayloads);
        const merged = mergePageAyahsWithMusayev(pageNumber, uthmaniAyahs, surahMap);
        const tokens = buildTokensFromQuranComVerses(rawVerses);
        const rows = groupTokensIntoMushafRows(tokens);

        const data: MuhaffizPageData = {
          ...merged,
          rows,
          centeredPage: pageNumber === 1 || pageNumber === 2,
        };
        muhaffizPageCache.set(pageNumber, data);
        return data;
      }
    }
  } catch {
    // Fallback cleanly to plain Mushaf page synthesis below
  }

  const plainPage = await fetchMushafPage(pageNumber);
  const fallbackData: MuhaffizPageData = {
    ...plainPage,
    rows: buildSyntheticMuhaffizRows(pageNumber, plainPage.ayahs),
    centeredPage: pageNumber === 1 || pageNumber === 2,
  };
  muhaffizPageCache.set(pageNumber, fallbackData);
  return fallbackData;
}

async function fetchAllYouTubeShorts(html: string, startedAt: number): Promise<RecitationVideo[]> {
  const initial = extractYouTubeShortsInitial(html);
  const byId = new Map<string, RecitationVideo>();
  for (const s of initial.shorts) {
    byId.set(s.videoId, s);
  }

  // Keep total execution bounded safely under Vercel Hobby 10s serverless limit
  const totalBudgetMs = process.env.VERCEL ? 5500 : 12000;
  let continuation = initial.continuationToken;
  let pages = 1;

  while (
    continuation &&
    initial.apiKey &&
    initial.clientVersion &&
    pages < 20 &&
    Date.now() - startedAt < totalBudgetMs
  ) {
    const remainingMs = Math.max(1200, totalBudgetMs - (Date.now() - startedAt));
    const pageController = new AbortController();
    const pageTimer = setTimeout(() => pageController.abort(), Math.min(4000, remainingMs));
    try {
      const res = await fetch(
        `https://www.youtube.com/youtubei/v1/browse?key=${initial.apiKey}`,
        {
          method: 'POST',
          signal: pageController.signal,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          },
          body: JSON.stringify({
            context: {
              client: {
                clientName: 'WEB',
                clientVersion: initial.clientVersion,
              },
            },
            continuation,
          }),
        }
      );
      if (!res.ok) break;
      const json = await res.json();
      const parsed = parseYouTubeShortsContinuation(json);
      for (const s of parsed.shorts) {
        if (!byId.has(s.videoId)) {
          byId.set(s.videoId, s);
        }
      }
      if (!parsed.continuationToken || parsed.shorts.length === 0) break;
      continuation = parsed.continuationToken;
      pages++;
    } catch {
      break;
    } finally {
      clearTimeout(pageTimer);
    }
  }

  return Array.from(byId.values());
}

export async function fetchLiveChannelData(): Promise<{
  stats: ChannelStats;
  longVideos: RecitationVideo[];
  shorts: RecitationVideo[];
}> {
  const now = Date.now();
  if (cachedChannel) {
    const ttl = cachedChannel.complete ? CACHE_TTL_MS : 20_000;
    if (now - cachedChannel.fetchedAt < ttl) {
      return {
        stats: cachedChannel.stats,
        longVideos: cachedChannel.longVideos,
        shorts: cachedChannel.shorts,
      };
    }
  }

  if (inflightChannelPromise) {
    return inflightChannelPromise;
  }

  inflightChannelPromise = (async () => {
    const startedAt = Date.now();
    try {
      const initialTimeoutMs = process.env.VERCEL ? 4500 : 10_000;
      const initialController = new AbortController();
      const initialTimer = setTimeout(() => initialController.abort(), initialTimeoutMs);

      const [videosRes, shortsRes] = await Promise.allSettled([
        fetch('https://www.youtube.com/@quranqiraeti/videos', {
          signal: initialController.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        }),
        fetch('https://www.youtube.com/@quranqiraeti/shorts', {
          signal: initialController.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        }),
      ]);

      let videosHtml = '';
      let shortsHtml = '';
      if (videosRes.status === 'fulfilled' && videosRes.value.ok) {
        videosHtml = await videosRes.value.text();
      }
      if (shortsRes.status === 'fulfilled' && shortsRes.value.ok) {
        shortsHtml = await shortsRes.value.text();
      }
      clearTimeout(initialTimer);

      let longVideos = SEED_LONG_VIDEOS;
      let shorts = SEED_SHORTS;
      let hasLiveLong = false;
      let hasLiveShorts = false;
      let subscribersLabel = DEFAULT_CHANNEL_STATS.subscribersLabel;
      let videoCountLabel = DEFAULT_CHANNEL_STATS.videoCountLabel;

      if (videosHtml) {
        const parsedLong = parseYouTubeVideosPage(videosHtml);
        if (parsedLong.length > 0) {
          longVideos = parsedLong;
          hasLiveLong = true;
        }
        const subMatch = videosHtml.match(/(\d+(?:\.\d+)?[KM]?)\s+subscribers/i)?.[1];
        const vidMatch = videosHtml.match(/(\d+(?:,\d+)?)\s+videos/i)?.[1];
        if (subMatch) subscribersLabel = subMatch;
        if (vidMatch) videoCountLabel = `${vidMatch}+`;
      }

      if (shortsHtml) {
        const parsedShorts = await fetchAllYouTubeShorts(shortsHtml, startedAt);
        if (parsedShorts.length > 0) {
          shorts = parsedShorts;
          hasLiveShorts = parsedShorts.length >= 40;
        }
      }

      const source: 'live' | 'archive' = hasLiveLong || hasLiveShorts ? 'live' : 'archive';
      const stats: ChannelStats = {
        ...DEFAULT_CHANNEL_STATS,
        subscribersLabel,
        videoCountLabel,
        source,
      };

      cachedChannel = {
        fetchedAt: Date.now(),
        complete: hasLiveLong && hasLiveShorts,
        stats,
        longVideos,
        shorts,
      };

      return { stats, longVideos, shorts };
    } catch {
      return {
        stats: DEFAULT_CHANNEL_STATS,
        longVideos: SEED_LONG_VIDEOS,
        shorts: SEED_SHORTS,
      };
    } finally {
      inflightChannelPromise = null;
    }
  })();

  return inflightChannelPromise;
}

export function createApiRouter() {
  const router = express.Router();

  router.get('/channel', async (_req: Request, res: Response) => {
    const data = await fetchLiveChannelData();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.json(data);
  });

  router.get('/quran/surah/:surahNumber', async (req: Request, res: Response) => {
    const surahNumber = Number.parseInt(String(req.params.surahNumber ?? ''), 10);
    if (Number.isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      res.status(400).json({ error: 'Surə nömrəsi 1 ilə 114 arasında olmalıdır.' });
      return;
    }
    try {
      const payload = await fetchSurahTranslation(surahNumber);
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
      res.json(payload);
    } catch {
      res.status(502).json({ error: 'Ayələrin tərcüməsi yüklənərkən xəta baş verdi.' });
    }
  });

  router.get('/quran/page/:pageNumber', async (req: Request, res: Response) => {
    const pageNumber = Number.parseInt(String(req.params.pageNumber ?? ''), 10);
    if (Number.isNaN(pageNumber) || pageNumber < 1 || pageNumber > TOTAL_QURAN_PAGES) {
      res.status(400).json({ error: 'Quran səhifəsi 1 ilə 604 arasında olmalıdır.' });
      return;
    }
    try {
      const payload = await fetchMushafPage(pageNumber);
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
      res.json(payload);
    } catch {
      res.status(502).json({ error: 'Quran səhifəsi yüklənərkən xəta baş verdi.' });
    }
  });

  router.get('/quran/muhaffiz/:pageNumber', async (req: Request, res: Response) => {
    const pageNumber = Number.parseInt(String(req.params.pageNumber ?? ''), 10);
    if (Number.isNaN(pageNumber) || pageNumber < 1 || pageNumber > TOTAL_QURAN_PAGES) {
      res.status(400).json({ error: 'Quran səhifəsi 1 ilə 604 arasında olmalıdır.' });
      return;
    }
    try {
      const payload = await fetchMuhaffizPage(pageNumber);
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
      res.json(payload);
    } catch {
      res.status(502).json({ error: 'Mühafiz səhifəsi yüklənərkən xəta baş verdi.' });
    }
  });

  router.get('/quran/search', async (req: Request, res: Response) => {
    const rawQuery = String(req.query.q ?? '').trim();
    if (rawQuery.length < 2) {
      res.status(400).json({ error: 'Axtarış sorğusu ən azı 2 simvol olmalıdır.' });
      return;
    }
    try {
      const encoded = encodeURIComponent(rawQuery.slice(0, 80));
      const upstream = await fetch(
        `https://api.alquran.cloud/v1/search/${encoded}/all/az.mammadaliyev`,
        {
          signal: AbortSignal.timeout(process.env.VERCEL ? 4500 : 7500),
          headers: { 'User-Agent': 'Mozilla/5.0' },
        }
      );
      if (!upstream.ok) {
        res.json({ query: rawQuery, matches: [] });
        return;
      }
      const data = await upstream.json();
      const matches = parseAlQuranSearchPayload(data);
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      res.json({ query: rawQuery, matches });
    } catch {
      res.status(502).json({ error: 'Quran ayə axtarışı hazırda əlçatan deyil.' });
    }
  });

  router.get('/requests', (_req: Request, res: Response) => {
    res.json({ requests: surahRequests.slice(0, 8) });
  });

  router.post('/requests', (req: Request, res: Response) => {
    const body = req.body ?? {};
    const input = {
      surahName: String(body.surahName ?? '').trim(),
      reciter: String(body.reciter ?? '').trim(),
      email: String(body.email ?? '').trim(),
      note: String(body.note ?? '').trim(),
    };

    const validation = validateSurahRequest(input);
    if (!validation.valid) {
      res.status(400).json({
        error: 'Zəhmət olmasa tələb olunan sahələri yoxlayın.',
        errors: validation.errors,
      });
      return;
    }

    const record: SurahRequestRecord = {
      ...input,
      id: `req-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    surahRequests.unshift(record);
    res.status(201).json({ request: record });
  });

  router.post('/analytics/track', (req: Request, res: Response) => {
    const body = req.body ?? {};
    const pageKey = String(body.pageKey ?? '') as ConnectedPageKey;
    if (!VALID_PAGE_KEYS.has(pageKey)) {
      res.status(400).json({ error: 'Keçərsiz səhifə açarı (pageKey).' });
      return;
    }

    const rawStatus = String(body.status ?? 'ok');
    const status: TelemetryStatus =
      rawStatus === 'slow' || rawStatus === 'error' ? rawStatus : 'ok';
    const rawRef = String(body.referrerType ?? 'direct');
    const referrerType: ReferrerType =
      rawRef === 'internal' ||
      rawRef === 'search' ||
      rawRef === 'youtube' ||
      rawRef === 'other'
        ? rawRef
        : 'direct';

    const record: PageTelemetryEventRecord = {
      eventId: String(body.eventId ?? `srv-${Date.now().toString(36)}`).slice(0, 128),
      pageKey,
      pageLabel: String(body.pageLabel ?? pageKey).slice(0, 100),
      path: String(body.path ?? '/').slice(0, 180),
      status,
      httpStatus: Math.min(599, Math.max(100, Number.parseInt(String(body.httpStatus ?? 200), 10) || 200)),
      loadTimeMs: Math.min(120_000, Math.max(0, Number.parseInt(String(body.loadTimeMs ?? 0), 10) || 0)),
      sessionId: String(body.sessionId ?? 'anon').slice(0, 80),
      referrerType,
      createdAtMs: Date.now(),
    };

    serverTelemetryEvents.unshift(record);
    if (serverTelemetryEvents.length > MAX_SERVER_TELEMETRY_EVENTS) {
      serverTelemetryEvents.length = MAX_SERVER_TELEMETRY_EVENTS;
    }

    res.status(201).json({ tracked: true, eventId: record.eventId });
  });

  router.get('/analytics/summary', (req: Request, res: Response) => {
    const rawGranularity = String(req.query.granularity ?? 'daily');
    const granularity: TimeWindowGranularity =
      rawGranularity === 'hourly' || rawGranularity === 'weekly' ? rawGranularity : 'daily';
    const rawPage = String(req.query.pageKey ?? 'all');
    const pageKey: ConnectedPageKey | 'all' =
      rawPage !== 'all' && VALID_PAGE_KEYS.has(rawPage as ConnectedPageKey)
        ? (rawPage as ConnectedPageKey)
        : 'all';

    res.json(aggregateTelemetry(serverTelemetryEvents, granularity, Date.now(), pageKey));
  });

  return router;
}

export function getRequestOrigin(req: Request): string {
  const forwardedProto = String(req.headers['x-forwarded-proto'] ?? '')
    .split(',')[0]
    .trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] ?? '')
    .split(',')[0]
    .trim();
  const host = forwardedHost || req.get('host') || 'quranqiraeti.vercel.app';
  const proto =
    forwardedProto ||
    (host.includes('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function getChannelDataForSeo(): Promise<{
  stats: ChannelStats;
  longVideos: RecitationVideo[];
  shorts: RecitationVideo[];
}> {
  if (cachedChannel) {
    return {
      stats: cachedChannel.stats,
      longVideos: cachedChannel.longVideos,
      shorts: cachedChannel.shorts,
    };
  }

  const fallback = {
    stats: DEFAULT_CHANNEL_STATS,
    longVideos: SEED_LONG_VIDEOS,
    shorts: SEED_SHORTS,
  };

  try {
    const timeoutMs = process.env.VERCEL ? 3500 : 6000;
    return await Promise.race([
      fetchLiveChannelData(),
      new Promise<typeof fallback>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
    ]);
  } catch {
    return fallback;
  }
}

export function createSeoRouter() {
  const router = express.Router();

  router.get('/robots.txt', (req: Request, res: Response) => {
    const origin = getRequestOrigin(req);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.send(buildRobotsTxt(origin));
  });

  router.get('/sitemap.xml', async (req: Request, res: Response) => {
    const origin = getRequestOrigin(req);
    const { longVideos, shorts } = await getChannelDataForSeo();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.send(buildSitemapXml(origin, [...longVideos, ...shorts]));
  });

  router.get('/sitemap-index.xml', (req: Request, res: Response) => {
    const origin = getRequestOrigin(req);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.send(buildSitemapIndexXml(origin));
  });

  router.get('/sitemap-core.xml', (req: Request, res: Response) => {
    const origin = getRequestOrigin(req);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.send(buildCoreSitemapXml(origin));
  });

  router.get('/sitemap-surahs.xml', (req: Request, res: Response) => {
    const origin = getRequestOrigin(req);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.send(buildSurahsSitemapXml(origin));
  });

  router.get('/sitemap-mushaf.xml', (req: Request, res: Response) => {
    const origin = getRequestOrigin(req);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.send(buildMushafSitemapXml(origin));
  });

  router.get('/sitemap-muhaffiz.xml', (req: Request, res: Response) => {
    const origin = getRequestOrigin(req);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.send(buildMuhaffizSitemapXml(origin));
  });

  router.get('/sitemap-videos.xml', async (req: Request, res: Response) => {
    const origin = getRequestOrigin(req);
    const { longVideos, shorts } = await getChannelDataForSeo();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.send(buildVideoSitemapXml(origin, [...longVideos, ...shorts]));
  });

  router.get('/og/site.svg', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.send(buildDynamicOgSvg('site'));
  });

  router.get('/og/:kind/:id.svg', (req: Request, res: Response) => {
    const rawKind = String(req.params.kind ?? '');
    const kind =
      rawKind === 'sure' || rawKind === 'sehife' || rawKind === 'muhaffiz' ? rawKind : 'site';
    const id = Number.parseInt(String(req.params.id ?? '1'), 10) || 1;
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.send(buildDynamicOgSvg(kind, id));
  });

  router.get('/api/seo/indexnow-ping', async (req: Request, res: Response) => {
    const key = String(process.env.INDEXNOW_KEY ?? '').trim();
    if (!key) {
      res.status(200).json({
        configured: false,
        message: 'INDEXNOW_KEY əlavə edildikdə IndexNow bildirişi avtomatik göndərilir.',
      });
      return;
    }
    try {
      const origin = getRequestOrigin(req);
      const { longVideos, shorts } = await getChannelDataForSeo();
      const urls = [
        `${origin}/`,
        `${origin}/shorts`,
        `${origin}/quran`,
        `${origin}/muhaffiz`,
        ...longVideos.slice(0, 10).map((v) => `${origin}/video/${v.videoId}`),
        ...shorts.slice(0, 10).map((v) => `${origin}/video/${v.videoId}`),
      ];
      const result = await submitIndexNowPing(origin, key, urls);
      res.json({ configured: true, ...result, submittedUrls: urls.length });
    } catch {
      res.status(502).json({ configured: true, submitted: false });
    }
  });

  router.get('/:keyFile.txt', (req: Request, res: Response, next) => {
    const key = String(process.env.INDEXNOW_KEY ?? '').trim();
    if (key && req.params.keyFile === key) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(key);
      return;
    }
    next();
  });

  router.get(['/llms.txt', '/.well-known/llms.txt'], async (req: Request, res: Response) => {
    const origin = getRequestOrigin(req);
    const { stats, longVideos, shorts } = await getChannelDataForSeo();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.send(buildLlmsTxt(origin, stats, longVideos, shorts));
  });

  router.get('/llms-full.txt', async (req: Request, res: Response) => {
    const origin = getRequestOrigin(req);
    const { stats, longVideos, shorts } = await getChannelDataForSeo();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.send(buildLlmsFullTxt(origin, stats, longVideos, shorts));
  });

  router.get('/ai-index.json', async (req: Request, res: Response) => {
    const origin = getRequestOrigin(req);
    const { stats, longVideos, shorts } = await getChannelDataForSeo();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.json(buildAiIndexJson(origin, stats, longVideos, shorts));
  });

  return router;
}

