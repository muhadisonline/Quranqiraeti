import { ChannelStats, RecitationVideo } from './channel';
import { JUZ_PAGE_RANGES, SURAH_CATALOG, TOTAL_QURAN_PAGES } from './quran';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function normalizeBaseUrl(origin: string): string {
  return origin.replace(/\/+$/, '');
}

export function buildRobotsTxt(origin: string): string {
  const baseUrl = normalizeBaseUrl(origin);
  return [
    '# Quran Qiraeti — Search Engine & AI Crawler Directives',
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/requests',
    '',
    '# AI Search & LLM Crawlers (Explicitly Permitted)',
    'User-agent: GPTBot',
    'Allow: /',
    '',
    'User-agent: OAI-SearchBot',
    'Allow: /',
    '',
    'User-agent: ChatGPT-User',
    'Allow: /',
    '',
    'User-agent: ClaudeBot',
    'Allow: /',
    '',
    'User-agent: Claude-Web',
    'Allow: /',
    '',
    'User-agent: anthropic-ai',
    'Allow: /',
    '',
    'User-agent: PerplexityBot',
    'Allow: /',
    '',
    'User-agent: Google-Extended',
    'Allow: /',
    '',
    'User-agent: Applebot-Extended',
    'Allow: /',
    '',
    'User-agent: Meta-ExternalAgent',
    'Allow: /',
    '',
    'User-agent: cohere-ai',
    'Allow: /',
    '',
    'User-agent: CCBot',
    'Allow: /',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    `# LLMs Index: ${baseUrl}/llms.txt`,
    `# Full AI Reference: ${baseUrl}/llms-full.txt`,
    `# Structured AI JSON: ${baseUrl}/ai-index.json`,
    '',
  ].join('\n');
}

export function buildSitemapXml(
  origin: string,
  videos: RecitationVideo[],
  todayIsoDate = new Date().toISOString().slice(0, 10)
): string {
  const baseUrl = normalizeBaseUrl(origin);
  const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = [
    { loc: `${baseUrl}/`, lastmod: todayIsoDate, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/shorts`, lastmod: todayIsoDate, changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/quran`, lastmod: todayIsoDate, changefreq: 'weekly', priority: '0.9' },
    { loc: `${baseUrl}/gunun-ayesi`, lastmod: todayIsoDate, changefreq: 'daily', priority: '0.8' },
    { loc: `${baseUrl}/haqqinda`, lastmod: todayIsoDate, changefreq: 'monthly', priority: '0.7' },
    { loc: `${baseUrl}/istek`, lastmod: todayIsoDate, changefreq: 'monthly', priority: '0.6' },
  ];

  // All 114 Surah pages
  for (const surah of SURAH_CATALOG) {
    urls.push({
      loc: `${baseUrl}/quran/sure/${surah.number}`,
      lastmod: todayIsoDate,
      changefreq: 'monthly',
      priority: '0.85',
    });
  }

  // All 604 Mushaf pages
  for (let page = 1; page <= TOTAL_QURAN_PAGES; page++) {
    urls.push({
      loc: `${baseUrl}/quran/sehife/${page}`,
      lastmod: todayIsoDate,
      changefreq: 'monthly',
      priority: '0.75',
    });
  }

  // All Long Videos & Shorts SEO pages
  const seenVideoIds = new Set<string>();
  for (const video of videos) {
    if (!video.videoId || seenVideoIds.has(video.videoId)) continue;
    seenVideoIds.add(video.videoId);
    const pubDate = /^\d{4}-\d{2}-\d{2}/.test(video.published)
      ? video.published.slice(0, 10)
      : todayIsoDate;
    urls.push({
      loc: `${baseUrl}/video/${video.videoId}`,
      lastmod: pubDate,
      changefreq: 'weekly',
      priority: video.format === 'long' ? '0.85' : '0.70',
    });
  }

  const urlEntries = urls
    .map(
      (entry) =>
        `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`
    )
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlEntries,
    '</urlset>',
    '',
  ].join('\n');
}

export function buildLlmsTxt(
  origin: string,
  stats: ChannelStats,
  longVideos: RecitationVideo[],
  shorts: RecitationVideo[]
): string {
  const baseUrl = normalizeBaseUrl(origin);
  const topLong = longVideos.slice(0, 20);
  const topShorts = shorts.slice(0, 25);

  const lines: string[] = [
    `# ${stats.name}`,
    '',
    `> ${stats.description} Official web archive for YouTube channel ${stats.handle} (${stats.youtubeUrl}). Provides Arabic Quran text paired with the latest Azerbaijani meaningful translation by Əlixan Musayev (v1.0.4) across all 114 surahs, all 604 Mushaf pages, long-form recitations, and Shorts.`,
    '',
    '## Core Pages',
    `- [Uzun Videolar (Ana səhifə)](${baseUrl}/): Tam surə və uzun Quran tilavətləri arxivi.`,
    `- [Shorts Bölməsi](${baseUrl}/shorts): Kanaldakı bütün qısa Quran tilavətləri (${shorts.length} video) və SEO məlumatları.`,
    `- [Tam Qurani-Kərim](${baseUrl}/quran): Bütün 114 surə və 604 Mushaf səhifəsi üzrə ərəbcə mətn və Əlixan Musayev tərcüməsi.`,
    `- [Günün Ayəsi](${baseUrl}/gunun-ayesi): Seçilmiş ayələr, ərəbcə mətn və təfəkkür izahı.`,
    `- [Kanal Haqqında](${baseUrl}/haqqinda): Kanalın məqsədi, qarilər və tərcümə prinsipləri.`,
    `- [Surə İstəyi](${baseUrl}/istek): Dinləyicilər üçün surə və qari təklifi formu.`,
    '',
    '## Machine-Readable Endpoints for AI & Search Crawlers',
    `- [XML Sitemap](${baseUrl}/sitemap.xml): Complete URL index (core routes, 114 surahs, 604 Mushaf pages, all channel videos).`,
    `- [Full LLM Reference](${baseUrl}/llms-full.txt): Expanded catalog of all 114 surahs, 30 Juz page ranges, and channel videos.`,
    `- [AI Structured JSON Index](${baseUrl}/ai-index.json): Structured JSON feed of channel stats, surahs, and video metadata.`,
    `- [Channel Feed JSON](${baseUrl}/api/channel): Live long videos and Shorts metadata JSON.`,
    `- [Surah Translation JSON Pattern](${baseUrl}/api/quran/surah/{1..114}): Arabic text, Əlixan Musayev Azerbaijani translation (v1.0.4), and footnotes per surah.`,
    `- [Mushaf Page JSON Pattern](${baseUrl}/api/quran/page/{1..604}): Exact ayahs per Mushaf page with Arabic Uthmani text and Əlixan Musayev translation.`,
    '',
    '## Complete Quran Index (114 Surahs & 604 Pages)',
    `- Individual Surah Pages: ${baseUrl}/quran/sure/{1..114}`,
    `- Individual Mushaf Pages: ${baseUrl}/quran/sehife/{1..604}`,
    ...SURAH_CATALOG.map(
      (s) =>
        `- [${s.number}. ${s.name} surəsi (${s.arabicName})](${baseUrl}/quran/sure/${s.number}): ${s.ayahCount} ayə · ${s.revelationPlace} · Mushaf səhifə ${s.startPage}`
    ),
    '',
    '## Recent Long Recitations',
    ...topLong.map(
      (v) =>
        `- [${v.title}](${baseUrl}/video/${v.videoId}): ${v.surahName} (${v.ayahRange}) · ${v.reciter} · ${v.duration}`
    ),
    '',
    '## Recent Shorts Recitations',
    ...topShorts.map(
      (v) =>
        `- [${v.title}](${baseUrl}/video/${v.videoId}): ${v.surahName} (${v.ayahRange}) · ${v.duration} — ${v.seoDescription}`
    ),
    '',
  ];

  return lines.join('\n');
}

export function buildLlmsFullTxt(
  origin: string,
  stats: ChannelStats,
  longVideos: RecitationVideo[],
  shorts: RecitationVideo[]
): string {
  const baseUrl = normalizeBaseUrl(origin);
  const lines: string[] = [
    `# ${stats.name} — Complete AI Knowledge Reference`,
    '',
    `- Channel Handle: ${stats.handle}`,
    `- YouTube URL: ${stats.youtubeUrl}`,
    `- Subscribers: ${stats.subscribersLabel}`,
    `- Total Videos: ${stats.videoCountLabel}`,
    `- Long Videos Indexed: ${longVideos.length}`,
    `- Shorts Indexed: ${shorts.length}`,
    `- Quran Translation Source: Əlixan Musayev (v1.0.4)`,
    `- Languages: Azerbaijani (az), Arabic (ar)`,
    '',
    '## 30 Juz & 604 Mushaf Page Ranges',
    ...JUZ_PAGE_RANGES.map(
      (j) => `- Cüz ${j.juz}: ${baseUrl}/quran/sehife/${j.startPage} — Səhifə ${j.startPage}–${j.endPage}`
    ),
    '',
    '## All 114 Surahs',
    ...SURAH_CATALOG.map(
      (s) =>
        `- ${s.number}. ${s.name} (${s.arabicName}) | ${s.ayahCount} ayə | ${s.revelationPlace} | Start Page: ${s.startPage} | URL: ${baseUrl}/quran/sure/${s.number} | JSON: ${baseUrl}/api/quran/surah/${s.number}`
    ),
    '',
    `## All Long Videos (${longVideos.length})`,
    ...longVideos.map(
      (v) =>
        `- [${v.title}](${baseUrl}/video/${v.videoId}) | YouTube: ${v.youtubeUrl} | Surah: ${v.surahName} | Ayahs: ${v.ayahRange} | Reciter: ${v.reciter} | Duration: ${v.duration} | Summary: ${v.seoDescription}`
    ),
    '',
    `## All Shorts Videos (${shorts.length})`,
    ...shorts.map(
      (v) =>
        `- [${v.title}](${baseUrl}/video/${v.videoId}) | YouTube: ${v.youtubeUrl} | Surah: ${v.surahName} | Ayahs: ${v.ayahRange} | Reciter: ${v.reciter} | Duration: ${v.duration} | Summary: ${v.seoDescription}`
    ),
    '',
  ];

  return lines.join('\n');
}

export function buildAiIndexJson(
  origin: string,
  stats: ChannelStats,
  longVideos: RecitationVideo[],
  shorts: RecitationVideo[]
) {
  const baseUrl = normalizeBaseUrl(origin);
  return {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    site: {
      name: stats.name,
      handle: stats.handle,
      baseUrl,
      youtubeUrl: stats.youtubeUrl,
      description: stats.description,
      languages: ['az', 'ar'],
      translation: {
        translator: 'Əlixan Musayev',
        editionVersion: '1.0.4',
      },
      stats: {
        subscribers: stats.subscribersLabel,
        totalVideos: stats.videoCountLabel,
        longVideosCount: longVideos.length,
        shortsCount: shorts.length,
        surahsCount: SURAH_CATALOG.length,
        mushafPagesCount: TOTAL_QURAN_PAGES,
      },
    },
    discovery: {
      sitemapXml: `${baseUrl}/sitemap.xml`,
      robotsTxt: `${baseUrl}/robots.txt`,
      llmsTxt: `${baseUrl}/llms.txt`,
      llmsFullTxt: `${baseUrl}/llms-full.txt`,
    },
    endpoints: {
      channel: `${baseUrl}/api/channel`,
      surahTemplate: `${baseUrl}/api/quran/surah/{surahNumber}`,
      mushafPageTemplate: `${baseUrl}/api/quran/page/{pageNumber}`,
    },
    surahs: SURAH_CATALOG.map((s) => ({
      ...s,
      url: `${baseUrl}/quran/sure/${s.number}`,
      apiUrl: `${baseUrl}/api/quran/surah/${s.number}`,
      startPageUrl: `${baseUrl}/quran/sehife/${s.startPage}`,
    })),
    longVideos: longVideos.map((v) => ({
      videoId: v.videoId,
      title: v.title,
      surahNumber: v.surahNumber,
      surahName: v.surahName,
      ayahRange: v.ayahRange,
      reciter: v.reciter,
      duration: v.duration,
      url: `${baseUrl}/video/${v.videoId}`,
      youtubeUrl: v.youtubeUrl,
      seoDescription: v.seoDescription,
    })),
    shorts: shorts.map((v) => ({
      videoId: v.videoId,
      title: v.title,
      surahNumber: v.surahNumber,
      surahName: v.surahName,
      ayahRange: v.ayahRange,
      reciter: v.reciter,
      duration: v.duration,
      url: `${baseUrl}/video/${v.videoId}`,
      youtubeUrl: v.youtubeUrl,
      seoDescription: v.seoDescription,
    })),
  };
}
