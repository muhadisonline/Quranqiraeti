import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import {
  ChannelStats,
  RecitationVideo,
  SurahRequestRecord,
  SurahTranslationPayload,
  parseQuranEncSurah,
  parseYouTubeShortsPage,
  parseYouTubeVideosPage,
  validateSurahRequest,
} from './src/lib/channel';
import {
  DEFAULT_CHANNEL_STATS,
  SEED_LONG_VIDEOS,
  SEED_SHORTS,
} from './src/data/recitations';

const PORT = Number(process.env.PORT || 3000);
const CACHE_TTL_MS = 10 * 60 * 1000;

let cachedChannel: {
  fetchedAt: number;
  stats: ChannelStats;
  longVideos: RecitationVideo[];
  shorts: RecitationVideo[];
} | null = null;

const surahTranslationCache = new Map<number, SurahTranslationPayload>();

async function fetchSurahTranslation(surahNumber: number): Promise<SurahTranslationPayload> {
  const cached = surahTranslationCache.get(surahNumber);
  if (cached && cached.ayahs.length > 0) return cached;

  try {
    const res = await fetch(`https://quranenc.com/api/v1/translation/sura/azeri_musayev/${surahNumber}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (res.ok) {
      const json = await res.json();
      const parsed = parseQuranEncSurah(surahNumber, json);
      if (parsed.ayahs.length > 0) {
        surahTranslationCache.set(surahNumber, parsed);
        return parsed;
      }
    }
  } catch {
    // fallback below
  }

  // Fallback to api.alquran.cloud (az.musayev + quran-uthmani)
  const fallbackRes = await fetch(
    `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,az.musayev`
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
    editionVersion: 'az.musayev',
    ayahs: arAyahs.map((ar: { numberInSurah?: number; text?: string }, idx: number) => ({
      surahNumber,
      ayahNumber: ar.numberInSurah ?? idx + 1,
      arabicText: String(ar.text ?? '').trim(),
      translation: String(azAyahs[idx]?.text ?? '').trim(),
      footnotes: '',
    })),
  };
  if (payload.ayahs.length > 0) {
    surahTranslationCache.set(surahNumber, payload);
  }
  return payload;
}

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

async function fetchLiveChannelData(): Promise<{
  stats: ChannelStats;
  longVideos: RecitationVideo[];
  shorts: RecitationVideo[];
}> {
  if (cachedChannel && Date.now() - cachedChannel.fetchedAt < CACHE_TTL_MS) {
    return {
      stats: cachedChannel.stats,
      longVideos: cachedChannel.longVideos,
      shorts: cachedChannel.shorts,
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const [videosRes, shortsRes] = await Promise.allSettled([
      fetch('https://www.youtube.com/@quranqiraeti/videos', {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }),
      fetch('https://www.youtube.com/@quranqiraeti/shorts', {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }),
    ]);

    clearTimeout(timer);

    let longVideos = SEED_LONG_VIDEOS;
    let shorts = SEED_SHORTS;
    let source: 'live' | 'archive' = 'archive';
    let subscribersLabel = DEFAULT_CHANNEL_STATS.subscribersLabel;
    let videoCountLabel = DEFAULT_CHANNEL_STATS.videoCountLabel;

    if (videosRes.status === 'fulfilled' && videosRes.value.ok) {
      const html = await videosRes.value.text();
      const parsedLong = parseYouTubeVideosPage(html);
      if (parsedLong.length > 0) {
        longVideos = parsedLong;
        source = 'live';
      }
      const subMatch = html.match(/(\d+(?:\.\d+)?[KM]?)\s+subscribers/i)?.[1];
      const vidMatch = html.match(/(\d+(?:,\d+)?)\s+videos/i)?.[1];
      if (subMatch) subscribersLabel = subMatch;
      if (vidMatch) videoCountLabel = `${vidMatch}+`;
    }

    if (shortsRes.status === 'fulfilled' && shortsRes.value.ok) {
      const html = await shortsRes.value.text();
      const parsedShorts = parseYouTubeShortsPage(html);
      if (parsedShorts.length > 0) {
        shorts = parsedShorts;
        source = 'live';
      }
    }

    const stats: ChannelStats = {
      ...DEFAULT_CHANNEL_STATS,
      subscribersLabel,
      videoCountLabel,
      source,
    };

    cachedChannel = {
      fetchedAt: Date.now(),
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
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/channel', async (_req, res) => {
    const data = await fetchLiveChannelData();
    res.json(data);
  });

  app.get('/api/quran/surah/:surahNumber', async (req, res) => {
    const surahNumber = Number.parseInt(req.params.surahNumber, 10);
    if (Number.isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      res.status(400).json({ error: 'Surə nömrəsi 1 ilə 114 arasında olmalıdır.' });
      return;
    }
    try {
      const payload = await fetchSurahTranslation(surahNumber);
      res.json(payload);
    } catch {
      res.status(502).json({ error: 'Ayələrin tərcüməsi yüklənərkən xəta baş verdi.' });
    }
  });

  app.get('/api/requests', (_req, res) => {
    res.json({ requests: surahRequests.slice(0, 8) });
  });

  app.post('/api/requests', (req, res) => {
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

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quran Qiraeti server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
