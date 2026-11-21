import {
  ChannelStats,
  RecitationVideo,
  SurahTranslationPayload,
  parseDurationToSeconds,
} from './channel';
import {
  JUZ_PAGE_RANGES,
  MushafPagePayload,
  SURAH_CATALOG,
  SurahCatalogEntry,
  TOTAL_QURAN_PAGES,
  TOTAL_QURAN_SURAHS,
  formatAzerbaijaniOrdinal,
  getJuzForPage,
  getSurahByNumber,
} from './quran';
import { clampMuhaffizPage } from './muhaffiz';
import { getActiveRubForPage } from './rubHizb';
import { QURAN_DUAS } from '../data/quranDuas';

export interface SsrContentExtras {
  surahPayload?: SurahTranslationPayload;
  mushafPayload?: MushafPagePayload;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function normalizeBaseUrl(origin: string): string {
  return origin.replace(/\/+$/, '');
}

export interface PopularQuranTopic {
  id: string;
  title: string;
  arabicLabel: string;
  searchHint: string;
  surahNumber: number;
  pageNumber: number;
  anchorHash?: string;
  summary: string;
}

export const POPULAR_QURAN_TOPICS: PopularQuranTopic[] = [
  {
    id: 'ayatul-kursi',
    title: 'Ayətül-Kürsi (Bəqərə, 255)',
    arabicLabel: 'آيَةُ الْكُرْسِيِّ',
    searchHint: '2:255 · Səhifə 42',
    surahNumber: 2,
    pageNumber: 42,
    anchorHash: '#ayah-2-255',
    summary: 'Quranın ən əzəmətli ayəsi — ərəbcə mətn və Əlixan Musayev tərcüməsi.',
  },
  {
    id: 'amanar-rasulu',
    title: 'Amənər-Rəsulu (Bəqərə, 285–286)',
    arabicLabel: 'آمَنَ الرَّسُولُ',
    searchHint: '2:285–286 · Səhifə 49',
    surahNumber: 2,
    pageNumber: 49,
    anchorHash: '#ayah-2-285',
    summary: 'Bəqərə surəsinin son iki ayəsi və axşam tilavəti üçün dua ayələri.',
  },
  {
    id: 'fatiha',
    title: 'Fatihə surəsi (Ümmül-Kitab)',
    arabicLabel: 'سُورَةُ الْفَاتِحَةِ',
    searchHint: '1–7 ayə · Səhifə 1',
    surahNumber: 1,
    pageNumber: 1,
    summary: 'Namazın hər rükətində oxunan 7 ayəlik açılış surəsi.',
  },
  {
    id: 'yasin',
    title: 'Yasin surəsi (Quranın qəlbi)',
    arabicLabel: 'سُورَةُ يس',
    searchHint: '83 ayə · Səhifə 440',
    surahNumber: 36,
    pageNumber: 440,
    summary: 'Tam ərəbcə mətn, Mədinə səhifələri (440–445) və Mühafiz əzbər rejimi.',
  },
  {
    id: 'kahf',
    title: 'Kəhf surəsi (Cümə günü)',
    arabicLabel: 'سُورَةُ الْكَهْفِ',
    searchHint: '110 ayə · Səhifə 293',
    surahNumber: 18,
    pageNumber: 293,
    summary: 'Cümə günləri oxunması sünnət olan 18-ci surə, Mədinə çapı 293–304.',
  },
  {
    id: 'mulk',
    title: 'Mülk surəsi (Təbarəkə)',
    arabicLabel: 'سُورَةُ الْمُلْكِ',
    searchHint: '30 ayə · Səhifə 562',
    surahNumber: 67,
    pageNumber: 562,
    summary: 'Gecə yatmazdan əvvəl oxunması tövsiyə edilən 30 ayəlik surə.',
  },
];

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function buildBreadcrumbJsonLd(origin: string, items: BreadcrumbItem[]) {
  const baseUrl = normalizeBaseUrl(origin);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: `${baseUrl}${item.path}`,
    })),
  };
}

export interface SurahFaqEntry {
  question: string;
  answer: string;
}

export function buildSurahFaqEntries(surah: SurahCatalogEntry, lastPage?: number): SurahFaqEntry[] {
  const effectiveLastPage = Math.max(surah.startPage, lastPage ?? surah.startPage);
  const pageText =
    effectiveLastPage === surah.startPage
      ? `Mədinə Mushafının ${surah.startPage}-ci səhifəsində yerləşir`
      : `Mədinə Mushafının ${surah.startPage}–${effectiveLastPage}-ci səhifələrində (${effectiveLastPage - surah.startPage + 1} səhifə) yerləşir`;
  const juhStart = getJuzForPage(surah.startPage);

  return [
    {
      question: `${surah.name} surəsi neçə ayədir və Quranın neçənci surəsidir?`,
      answer: `${surah.name} surəsi Qurani-Kərimin ${formatAzerbaijaniOrdinal(surah.number)} surəsidir və cəmi ${surah.ayahCount} ayədən ibarətdir.`,
    },
    {
      question: `${surah.name} surəsi harada nazil olub və Mədinə çapında neçənci səhifədədir?`,
      answer: `Bu surə ${surah.revelationPlace === 'Məkkə' ? 'Məkkədə' : 'Mədinədə'} nazil olmuşdur, ${juhStart}-ci Cüzdən başlayır və ${pageText}.`,
    },
    {
      question: `${surah.name} surəsini sözbə-söz necə əzbərləmək olar?`,
      answer: `Mühafiz bölməsində ${surah.startPage}-ci səhifəni açaraq orijinal Mədinə çapı üzərində ayələri sözbə-söz və ya ayə-ayə gizlədib açmaqla rahat əzbərləyə bilərsiniz.`,
    },
  ];
}

export function buildFaqPageJsonLd(entries: SurahFaqEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildRobotsTxt(origin: string): string {
  const baseUrl = normalizeBaseUrl(origin);
  return [
    '# Quran Qiraeti — Search Engine & AI Crawler Directives',
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/requests',
    'Disallow: /api/analytics/',
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
    `Sitemap: ${baseUrl}/sitemap-index.xml`,
    `Sitemap: ${baseUrl}/sitemap-videos.xml`,
    `# LLMs Index: ${baseUrl}/llms.txt`,
    `# Full AI Reference: ${baseUrl}/llms-full.txt`,
    `# Structured AI JSON: ${baseUrl}/ai-index.json`,
    '',
  ].join('\n');
}

function renderUrlSetXml(
  urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }>
): string {
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

export function buildSitemapIndexXml(
  origin: string,
  todayIsoDate = new Date().toISOString().slice(0, 10)
): string {
  const baseUrl = normalizeBaseUrl(origin);
  const childSitemaps = [
    `${baseUrl}/sitemap-core.xml`,
    `${baseUrl}/sitemap-surahs.xml`,
    `${baseUrl}/sitemap-mushaf.xml`,
    `${baseUrl}/sitemap-muhaffiz.xml`,
    `${baseUrl}/sitemap-videos.xml`,
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...childSitemaps.map(
      (loc) => `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${todayIsoDate}</lastmod>\n  </sitemap>`
    ),
    '</sitemapindex>',
    '',
  ].join('\n');
}

export function buildCoreSitemapXml(
  origin: string,
  todayIsoDate = new Date().toISOString().slice(0, 10)
): string {
  const baseUrl = normalizeBaseUrl(origin);
  return renderUrlSetXml([
    { loc: `${baseUrl}/`, lastmod: todayIsoDate, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/shorts`, lastmod: todayIsoDate, changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/quran`, lastmod: todayIsoDate, changefreq: 'weekly', priority: '0.9' },
    { loc: `${baseUrl}/dualar`, lastmod: todayIsoDate, changefreq: 'weekly', priority: '0.85' },
    { loc: `${baseUrl}/elifba`, lastmod: todayIsoDate, changefreq: 'monthly', priority: '0.85' },
    { loc: `${baseUrl}/zikr`, lastmod: todayIsoDate, changefreq: 'weekly', priority: '0.85' },
    { loc: `${baseUrl}/namaz-vaxtlari`, lastmod: todayIsoDate, changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/qible`, lastmod: todayIsoDate, changefreq: 'monthly', priority: '0.8' },
    { loc: `${baseUrl}/teqvim`, lastmod: todayIsoDate, changefreq: 'daily', priority: '0.85' },
    { loc: `${baseUrl}/muhaffiz`, lastmod: todayIsoDate, changefreq: 'weekly', priority: '0.9' },
    { loc: `${baseUrl}/gunun-ayesi`, lastmod: todayIsoDate, changefreq: 'daily', priority: '0.8' },
    { loc: `${baseUrl}/haqqinda`, lastmod: todayIsoDate, changefreq: 'monthly', priority: '0.7' },
    { loc: `${baseUrl}/istek`, lastmod: todayIsoDate, changefreq: 'monthly', priority: '0.6' },
    ...JUZ_PAGE_RANGES.map((j) => ({
      loc: `${baseUrl}/quran/cuz/${j.juz}`,
      lastmod: todayIsoDate,
      changefreq: 'monthly',
      priority: '0.80',
    })),
  ]);
}

export function buildSurahsSitemapXml(
  origin: string,
  todayIsoDate = new Date().toISOString().slice(0, 10)
): string {
  const baseUrl = normalizeBaseUrl(origin);
  return renderUrlSetXml(
    SURAH_CATALOG.map((surah) => ({
      loc: `${baseUrl}/quran/sure/${surah.number}`,
      lastmod: todayIsoDate,
      changefreq: 'monthly',
      priority: '0.85',
    }))
  );
}

export function buildMushafSitemapXml(
  origin: string,
  todayIsoDate = new Date().toISOString().slice(0, 10)
): string {
  const baseUrl = normalizeBaseUrl(origin);
  const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = [];
  for (let page = 1; page <= TOTAL_QURAN_PAGES; page++) {
    urls.push({
      loc: `${baseUrl}/quran/sehife/${page}`,
      lastmod: todayIsoDate,
      changefreq: 'monthly',
      priority: '0.75',
    });
  }
  return renderUrlSetXml(urls);
}

export function buildMuhaffizSitemapXml(
  origin: string,
  todayIsoDate = new Date().toISOString().slice(0, 10)
): string {
  const baseUrl = normalizeBaseUrl(origin);
  const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = [
    { loc: `${baseUrl}/muhaffiz`, lastmod: todayIsoDate, changefreq: 'weekly', priority: '0.9' },
  ];
  for (let page = 1; page <= TOTAL_QURAN_PAGES; page++) {
    urls.push({
      loc: `${baseUrl}/muhaffiz/${page}`,
      lastmod: todayIsoDate,
      changefreq: 'monthly',
      priority: '0.70',
    });
  }
  return renderUrlSetXml(urls);
}

export function buildVideoSitemapXml(
  origin: string,
  videos: RecitationVideo[],
  todayIsoDate = new Date().toISOString().slice(0, 10)
): string {
  const baseUrl = normalizeBaseUrl(origin);
  const seenVideoIds = new Set<string>();
  const entries: string[] = [];

  for (const video of videos) {
    if (!video.videoId || seenVideoIds.has(video.videoId)) continue;
    seenVideoIds.add(video.videoId);
    const pubDate = /^\d{4}-\d{2}-\d{2}/.test(video.published)
      ? video.published.slice(0, 10)
      : todayIsoDate;
    const durationSec = parseDurationToSeconds(video.duration);
    const thumb = video.thumbnailUrl || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;

    entries.push(
      [
        '  <url>',
        `    <loc>${escapeXml(`${baseUrl}/video/${video.videoId}`)}</loc>`,
        `    <lastmod>${pubDate}</lastmod>`,
        `    <changefreq>weekly</changefreq>`,
        `    <priority>${video.format === 'long' ? '0.85' : '0.70'}</priority>`,
        '    <video:video>',
        `      <video:thumbnail_loc>${escapeXml(thumb)}</video:thumbnail_loc>`,
        `      <video:title>${escapeXml(video.title)}</video:title>`,
        `      <video:description>${escapeXml(video.seoDescription || video.title)}</video:description>`,
        `      <video:player_loc>https://www.youtube.com/embed/${escapeXml(video.videoId)}</video:player_loc>`,
        `      <video:duration>${durationSec}</video:duration>`,
        `      <video:publication_date>${pubDate}</video:publication_date>`,
        `      <video:family_friendly>yes</video:family_friendly>`,
        '    </video:video>',
        '  </url>',
      ].join('\n')
    );
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">',
    entries.join('\n'),
    '</urlset>',
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
    { loc: `${baseUrl}/dualar`, lastmod: todayIsoDate, changefreq: 'weekly', priority: '0.85' },
    { loc: `${baseUrl}/elifba`, lastmod: todayIsoDate, changefreq: 'monthly', priority: '0.85' },
    { loc: `${baseUrl}/zikr`, lastmod: todayIsoDate, changefreq: 'weekly', priority: '0.85' },
    { loc: `${baseUrl}/namaz-vaxtlari`, lastmod: todayIsoDate, changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/qible`, lastmod: todayIsoDate, changefreq: 'monthly', priority: '0.8' },
    { loc: `${baseUrl}/teqvim`, lastmod: todayIsoDate, changefreq: 'daily', priority: '0.85' },
    { loc: `${baseUrl}/muhaffiz`, lastmod: todayIsoDate, changefreq: 'weekly', priority: '0.9' },
    { loc: `${baseUrl}/gunun-ayesi`, lastmod: todayIsoDate, changefreq: 'daily', priority: '0.8' },
    { loc: `${baseUrl}/haqqinda`, lastmod: todayIsoDate, changefreq: 'monthly', priority: '0.7' },
    { loc: `${baseUrl}/istek`, lastmod: todayIsoDate, changefreq: 'monthly', priority: '0.6' },
  ];

  // All 30 Juz landing pages
  for (const juz of JUZ_PAGE_RANGES) {
    urls.push({
      loc: `${baseUrl}/quran/cuz/${juz.juz}`,
      lastmod: todayIsoDate,
      changefreq: 'monthly',
      priority: '0.80',
    });
  }

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

  return renderUrlSetXml(urls);
}

function toRfc822Date(raw: string): string {
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toUTCString();
  }
  return new Date().toUTCString();
}

export function buildRssFeedXml(
  origin: string,
  stats: ChannelStats,
  videos: RecitationVideo[]
): string {
  const baseUrl = normalizeBaseUrl(origin);
  const seen = new Set<string>();
  const items: string[] = [];

  for (const video of videos) {
    if (!video.videoId || seen.has(video.videoId)) continue;
    seen.add(video.videoId);
    const link = `${baseUrl}/video/${video.videoId}`;
    const thumb = video.thumbnailUrl || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
    const desc =
      video.seoDescription ||
      `${video.surahName} (${video.ayahRange}) — ${video.reciter} tilavəti və Əlixan Musayev tərcüməsi.`;
    const pubDate = /^\d{4}-\d{2}-\d{2}/.test(video.published)
      ? toRfc822Date(video.published)
      : new Date().toUTCString();

    items.push(
      [
        '    <item>',
        `      <title>${escapeXml(video.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${escapeXml(pubDate)}</pubDate>`,
        `      <category>${escapeXml(video.surahName)}</category>`,
        `      <description>${escapeXml(desc)}</description>`,
        `      <media:thumbnail url="${escapeXml(thumb)}" />`,
        '    </item>',
      ].join('\n')
    );

    if (items.length >= 40) break;
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">',
    '  <channel>',
    `    <title>${escapeXml(stats.name)} — Quran Tilavətləri RSS</title>`,
    `    <link>${escapeXml(`${baseUrl}/`)}</link>`,
    `    <description>${escapeXml(stats.description)}</description>`,
    '    <language>az</language>',
    `    <lastBuildDate>${escapeXml(new Date().toUTCString())}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(`${baseUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

export function buildDynamicOgSvg(kind: 'site' | 'sure' | 'sehife' | 'muhaffiz', id = 1): string {
  let eyebrow = 'QURAN QİRAƏTİ · RƏSMİ ARXİV';
  let titleText = 'Uzun Tilavətlər, Shorts və Tam Qurani-Kərim';
  let subtitleText = '114 Surə · 604 Mədinə Mushafı Səhifəsi · Mühafiz Əzbər Aləti';
  let arabicBadge = 'القرآن الكريم';

  if (kind === 'sure') {
    const s = getSurahByNumber(id);
    if (s) {
      eyebrow = `MƏDİNƏ ÇAPI · ${s.number}-Cİ SURƏ · SƏHİFƏ ${s.startPage}`;
      titleText = `${s.name} surəsi`;
      subtitleText = `${s.ayahCount} ayə · ${s.revelationPlace} · Əlixan Musayev tərcüməsi`;
      arabicBadge = s.arabicName;
    }
  } else if (kind === 'sehife') {
    const p = clampMuhaffizPage(id);
    const juz = getJuzForPage(p);
    eyebrow = `MƏDİNƏ MUSHAFİ · ${juz}-Cİ CÜZ`;
    titleText = `Qurani-Kərim — ${formatAzerbaijaniOrdinal(p)} səhifə`;
    subtitleText = `Səhifə ${p} / 604 · Ərəbcə mətn və Azərbaycan dilində tərcümə`;
    arabicBadge = `صفحة ${p}`;
  } else if (kind === 'muhaffiz') {
    const p = clampMuhaffizPage(id);
    const juz = getJuzForPage(p);
    eyebrow = `MÜHAFİZ ƏZBƏR MUSHAFİ · ${juz}-Cİ CÜZ`;
    titleText = `Sözbə-söz Əzbər — Səhifə ${p}`;
    subtitleText = `604 Mədinə Mushafı · Sətir-sətir gizlət / aç · Tilavət yoxlaması`;
    arabicBadge = `المصحف المحفظ`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E1210"/>
      <stop offset="100%" stop-color="#0F4C3A"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="40" y="40" width="1120" height="550" rx="24" fill="none" stroke="#C6A769" stroke-opacity="0.35" stroke-width="2"/>
  <text x="88" y="130" fill="#C6A769" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="600" letter-spacing="3">${escapeXml(eyebrow)}</text>
  <text x="1112" y="140" text-anchor="end" fill="#F3F1EC" font-family="serif" font-size="46">${escapeXml(arabicBadge)}</text>
  <text x="88" y="315" fill="#FAF9F6" font-family="Georgia, serif" font-size="56" font-weight="700">${escapeXml(titleText)}</text>
  <text x="88" y="385" fill="#D5E6DF" font-family="system-ui, -apple-system, sans-serif" font-size="28">${escapeXml(subtitleText)}</text>
  <line x1="88" y1="470" x2="1112" y2="470" stroke="#7BB89E" stroke-opacity="0.25" stroke-width="1"/>
  <text x="88" y="532" fill="#86C7AE" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600">@quranqiraeti · Ərəbcə + Azərbaycan Tərcüməsi</text>
</svg>`;
}

export interface RouteSeoMetadata {
  httpStatus: 200 | 404;
  robots: string;
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage: string;
  ogType: string;
  prevUrl?: string;
  nextUrl?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  noscriptHtml: string;
}

export function resolveRouteSeoMetadata(
  pathname: string,
  origin: string,
  videos: RecitationVideo[] = [],
  extras?: SsrContentExtras
): RouteSeoMetadata {
  const baseUrl = normalizeBaseUrl(origin);
  const cleanPath = !pathname || pathname === '/' ? '/' : pathname.split('?')[0].replace(/\/+$/, '') || '/';
  const defaultOg = `${baseUrl}/og-default.png`;
  const robotsIndex = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const robotsNoIndex = 'noindex, nofollow';

  if (cleanPath === '/admin') {
    return {
      httpStatus: 200,
      robots: robotsNoIndex,
      title: 'Admin Statistika Paneli | Quran Qiraeti',
      description: 'Quran Qiraeti idarəetmə və statistika paneli.',
      canonicalUrl: `${baseUrl}/admin`,
      ogImage: defaultOg,
      ogType: 'website',
      noscriptHtml: '<h1>Admin Statistika Paneli</h1>',
    };
  }

  if (cleanPath === '/') {
    const featuredItems = videos.slice(0, 10).map((video, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'VideoObject',
        name: video.title,
        description: video.seoDescription || `${video.surahName} (${video.ayahRange}) — ${video.reciter}`,
        thumbnailUrl: [video.thumbnailUrl || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`],
        uploadDate: /^\d{4}-\d{2}-\d{2}/.test(video.published) ? video.published : undefined,
        contentUrl: `${baseUrl}/video/${video.videoId}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${video.videoId}`,
        inLanguage: ['ar', 'az'],
      },
    }));

    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: 'Quran Qiraeti — Uzun Tilavətlər, Shorts və Azərbaycan Tərcüməsi',
      description:
        'Quran Qiraeti rəsmi arxivi. Tam surə uzun tilavətləri, Shorts qiraətləri, 114 surə və 604 səhifə Mədinə çapı Əlixan Musayev tərcüməsi ilə.',
      canonicalUrl: `${baseUrl}/`,
      ogImage: defaultOg,
      ogType: 'website',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Quran Qiraeti',
          url: `${baseUrl}/`,
          logo: defaultOg,
          sameAs: [
            'https://youtube.com/@quranqiraeti',
            'https://www.youtube.com/channel/UCp9AvvdTxAXDZfnnVjNF1Yg',
          ],
          description:
            'Quran Qiraeti YouTube kanalı — Ərəbcə Quran tilavətləri və Əlixan Musayevin Azərbaycan tərcüməsi arxivi.',
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Quran Qiraeti',
          url: `${baseUrl}/`,
          inLanguage: ['az', 'ar'],
          description:
            'Tam Qurani-Kərim (114 surə, 604 Mədinə səhifəsi), Mühafiz əzbər aləti və uzun tilavət arxivi.',
          potentialAction: {
            '@type': 'SearchAction',
            target: `${baseUrl}/quran?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
        ...(featuredItems.length > 0
          ? [
              {
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                name: 'Seçilmiş Quran Tilavətləri',
                numberOfItems: featuredItems.length,
                itemListElement: featuredItems,
              },
            ]
          : []),
      ],
      noscriptHtml: `<h1>Quran Qiraeti — Uzun Tilavətlər və Tam Qurani-Kərim</h1><p>Azərbaycan dilində mənaca tərcümə (Əlixan Musayev v1.0.4), 114 surə, 604 Mədinə Mushafı səhifəsi və Mühafiz əzbər aləti.</p><nav><a href="/quran">Qurani-Kərim (114 Surə)</a> · <a href="/quran/sure/1">Fatihə surəsi</a> · <a href="/quran/sure/2">Bəqərə surəsi</a> · <a href="/quran/sure/18">Kəhf surəsi</a> · <a href="/quran/sure/36">Yasin surəsi</a> · <a href="/quran/sure/67">Mülk surəsi</a> · <a href="/dualar">Qurandakı Dualar</a> · <a href="/elifba">Əlifba və Təcvid</a> · <a href="/namaz-vaxtlari">Namaz Vaxtları</a> · <a href="/teqvim">Hicri Təqvim</a> · <a href="/zikr">Zikr və Təsbih</a> · <a href="/muhaffiz">Mühafiz Əzbər</a> · <a href="/shorts">Shorts</a></nav>${
        videos.length > 0
          ? `<ul>${videos
              .slice(0, 12)
              .map(
                (v) =>
                  `<li><a href="/video/${escapeHtmlAttr(v.videoId)}">${escapeHtmlText(v.title)}</a> — ${escapeHtmlText(v.surahName)} (${escapeHtmlText(v.ayahRange)})</li>`
              )
              .join('')}</ul>`
          : ''
      }`,
    };
  }

  if (cleanPath === '/shorts') {
    const shortVideos = videos.filter((v) => v.format === 'short').slice(0, 12);
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: 'Quran Shorts Tilavətləri | Quran Qiraeti',
      description:
        'Quran Qiraeti kanalının bütün qısa Quran tilavətləri, ərəbcə mətnləri və Azərbaycan dilində tərcümələri.',
      canonicalUrl: `${baseUrl}/shorts`,
      ogImage: defaultOg,
      ogType: 'website',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Quran Shorts Tilavətləri',
          url: `${baseUrl}/shorts`,
          inLanguage: ['ar', 'az'],
          description: 'Qısa Quran tilavətləri, ayə aralıqları və Azərbaycan dilində tərcümə arxivi.',
        },
        buildBreadcrumbJsonLd(baseUrl, [
          { name: 'Ana səhifə', path: '/' },
          { name: 'Shorts', path: '/shorts' },
        ]),
        ...(shortVideos.length > 0
          ? [
              {
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                name: 'Quran Shorts Video Siyahısı',
                numberOfItems: shortVideos.length,
                itemListElement: shortVideos.map((v, idx) => ({
                  '@type': 'ListItem',
                  position: idx + 1,
                  item: {
                    '@type': 'VideoObject',
                    name: v.title,
                    description: v.seoDescription || v.title,
                    thumbnailUrl: [v.thumbnailUrl || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`],
                    contentUrl: `${baseUrl}/video/${v.videoId}`,
                    embedUrl: `https://www.youtube-nocookie.com/embed/${v.videoId}`,
                  },
                })),
              },
            ]
          : []),
      ],
      noscriptHtml: `<h1>Quran Shorts Tilavətləri</h1><ul>${shortVideos
        .map((v) => `<li><a href="/video/${escapeHtmlAttr(v.videoId)}">${escapeHtmlText(v.title)}</a></li>`)
        .join('')}</ul>`,
    };
  }

  if (cleanPath === '/quran') {
    const quranFaq = [
      {
        question: 'Saytdakı Qurani-Kərim tərcüməsi kimə aiddir?',
        answer: 'Bütün 114 surə və 604 səhifə Əlixan Musayevin son nəşr (v1.0.4) Azərbaycan dilinə mənaca tərcüməsi ilə təqdim olunur.',
      },
      {
        question: 'Mədinə Mushafı neçə səhifə və neçə cüzdən ibarətdir?',
        answer: 'Standart Mədinə Mushafı 604 səhifə, 30 cüz və 114 surədən ibarətdir. Hər səhifə və cüz ayrıca ünvanda açılır.',
      },
      {
        question: 'Quran ayələrini sözbə-söz necə əzbərləmək olar?',
        answer: 'Mühafiz bölməsində istənilən Mədinə səhifəsini (1–604) açaraq sözləri və ayələri gizlədib-açmaqla hifz təkrarı edə bilərsiniz.',
      },
    ];
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: 'Tam Qurani-Kərim — Mədinə Çapı (604 Səhifə) və 114 Surə | Quran Qiraeti',
      description:
        'Mədinə çapı üzrə Qurani-Kərimin 604 səhifəsi və 114 surəsi: ərəbcə mətn və Əlixan Musayevin Azərbaycan tərcüməsi (v1.0.4).',
      canonicalUrl: `${baseUrl}/quran`,
      ogImage: defaultOg,
      ogType: 'website',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Book',
          name: 'Qurani-Kərim (Mədinə çapı, 604 səhifə)',
          author: { '@type': 'Person', name: 'Qurani-Kərim' },
          translator: { '@type': 'Person', name: 'Əlixan Musayev' },
          bookFormat: 'https://schema.org/EBook',
          inLanguage: ['ar', 'az'],
          numberOfPages: TOTAL_QURAN_PAGES,
          url: `${baseUrl}/quran`,
        },
        buildBreadcrumbJsonLd(baseUrl, [
          { name: 'Ana səhifə', path: '/' },
          { name: 'Qurani-Kərim', path: '/quran' },
        ]),
        buildFaqPageJsonLd(quranFaq),
      ],
      noscriptHtml: `<h1>Tam Qurani-Kərim — Mədinə Çapı (604 Səhifə) və 114 Surə</h1><p>Ərəbcə mətn və Əlixan Musayevin Azərbaycan dilinə tərcüməsi.</p><nav>${JUZ_PAGE_RANGES.map((j) => `<a href="/quran/cuz/${j.juz}">${j.juz}. Cüz</a>`).join(' · ')} · <a href="/dualar">Qurandakı Dualar</a></nav>`,
    };
  }

  if (cleanPath === '/dualar') {
    const duaFaq = [
      {
        question: 'Qurandakı Dualar bölməsində hansı dualar toplanıb?',
        answer: `Qurani-Kərimdən seçilmiş ${QURAN_DUAS.length} səhih Rəbbənə və peyğəmbər duası — hidayət, bağışlanma, ailə, elm və səbir mövzuları üzrə təqdim olunur.`,
      },
      {
        question: 'Duaların ərəbcə tilavətini dinləmək mümkündürmü?',
        answer: 'Bəli, hər dua kartında seçilmiş qari ilə ayənin ərəbcə səsli tilavətini birbaşa dinləmək və mətni köçürmək olar.',
      },
      {
        question: 'Dua ayələrini şəkil kartı kimi yükləmək olurmu?',
        answer: 'Bəli, istənilən dua və ya ayəni yüksək keyfiyyətli 1080×1350 PNG şəkil kartı kimi endirib paylaşa bilərsiniz.',
      },
    ];
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: 'Qurandakı Dualar (Rəbbənə Duaları) | Quran Qiraeti',
      description:
        'Qurani-Kərimdən seçilmiş 20 səhih Rəbbənə və peyğəmbər duası — ərəbcə mətn, Əlixan Musayevin Azərbaycan tərcüməsi, səsli tilavət və şəkil kartı yükləmə.',
      canonicalUrl: `${baseUrl}/dualar`,
      ogImage: defaultOg,
      ogType: 'website',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Qurandakı Dualar (Rəbbənə Duaları)',
          url: `${baseUrl}/dualar`,
          inLanguage: ['az', 'ar'],
          description:
            'Qurani-Kərimdən seçilmiş 20 səhih Rəbbənə və peyğəmbər duası — ərəbcə mətn, tərcümə və səsli tilavət.',
        },
        buildBreadcrumbJsonLd(baseUrl, [
          { name: 'Ana səhifə', path: '/' },
          { name: 'Qurani-Kərim', path: '/quran' },
          { name: 'Qurandakı Dualar', path: '/dualar' },
        ]),
        buildFaqPageJsonLd(duaFaq),
      ],
      noscriptHtml: `<h1>Qurandakı Dualar (Rəbbənə Duaları)</h1><p>Hidayət, bağışlanma, ailə, elm və səbir mövzularında Qurandan seçilmiş ${QURAN_DUAS.length} dua.</p><ul>${QURAN_DUAS.map(
        (d) =>
          `<li><a href="/quran/sure/${d.surahNumber}#ayah-${d.ayahNumber}">${escapeHtmlText(d.title)} (${escapeHtmlText(d.surahName)} ${escapeHtmlText(d.ayahLabel)})</a>: ${escapeHtmlText(d.translation)}</li>`
      ).join('')}</ul>`,
    };
  }

  if (cleanPath === '/namaz-vaxtlari' || cleanPath === '/qible' || cleanPath === '/teqvim') {
    const isCalendar = cleanPath === '/teqvim';
    const isQibla = cleanPath === '/qible';
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: isCalendar
        ? 'Hicri–Miladi Təqvim Çeviricisi və Mübarək Günlər | Quran Qiraeti'
        : isQibla
          ? 'Canlı Qiblə Kompası və Namaz Vaxtları | Quran Qiraeti'
          : 'Namaz Vaxtları — Ümmül-Qura, Ölkələr və Xəritə | Quran Qiraeti',
      description: isCalendar
        ? 'Ümmül-Qura təqvimi üzrə Hicri və Miladi tarix çeviricisi, Ramazan başlanğıcı, Qədr gecəsi, Ramazan və Qurban bayramlarına qalan günlərin canlı sayğacı.'
        : 'Ümmül-Qura (Məkkə) üsulu ilə Azərbaycan və dünya şəhərləri üzrə gündəlik və həftəlik namaz vaxtları, xəritə üzərindən avtomatik məkan seçimi, Qiblə bucağı və canlı gerisayım.',
      canonicalUrl: `${baseUrl}${cleanPath}`,
      ogImage: defaultOg,
      ogType: 'website',
      jsonLd: buildBreadcrumbJsonLd(baseUrl, [
        { name: 'Ana səhifə', path: '/' },
        {
          name: isCalendar ? 'Hicri–Miladi Təqvim' : isQibla ? 'Qiblə Kompası' : 'Namaz Vaxtları',
          path: cleanPath,
        },
      ]),
      noscriptHtml: isCalendar
        ? '<h1>Hicri–Miladi Təqvim Çeviricisi və Mübarək Günlər</h1><p>Ümmül-Qura təqvimi əsasında Hicri və Miladi tarixlərin çevrilməsi və qarşıdakı bayramların sayğacı.</p>'
        : '<h1>Namaz Vaxtları — Ümmül-Qura və Xəritə Seçimi</h1><p>Azərbaycan və dünya şəhərləri üzrə gündəlik Sübh, Günəş, Zöhr, Əsr, Məğrib və İşa vaxtları.</p>',
    };
  }

  if (cleanPath === '/elifba') {
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: 'Ərəb Əlifbası, Hərəkələr və Təcvid Bələdçisi | Quran Qiraeti',
      description:
        '28 ərəb hərfinin tək, başda, ortada və sonda yazılış formaları, məxrəcləri, canlı hərəkə qurucusu, əsas təcvid qaydaları və Quran ayələrindən səsli nümunələr.',
      canonicalUrl: `${baseUrl}/elifba`,
      ogImage: defaultOg,
      ogType: 'website',
      jsonLd: buildBreadcrumbJsonLd(baseUrl, [
        { name: 'Ana səhifə', path: '/' },
        { name: 'Qurani-Kərim', path: '/quran' },
        { name: 'Əlifba və Təcvid', path: '/elifba' },
      ]),
      noscriptHtml:
        '<h1>İnteraktiv Ərəb Əlifbası və Təcvid Bələdçisi</h1><p>28 ərəb hərfinin yazılış formaları, məxrəc nöqtələri, hərəkələr və əsas təcvid qaydaları.</p>',
    };
  }

  if (cleanPath === '/zikr') {
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: 'Səhər-Axşam Zikrləri və Təsbih Sayğacı | Quran Qiraeti',
      description:
        'Onlayn təsbih sayğacı (33 / 99 / 100 və Namaz sonrası 33+33+34 rejimi), Səhər və Axşam zikrləri — ərəbcə mətn, oxunuş və Azərbaycan tərcüməsi.',
      canonicalUrl: `${baseUrl}/zikr`,
      ogImage: defaultOg,
      ogType: 'website',
      jsonLd: buildBreadcrumbJsonLd(baseUrl, [
        { name: 'Ana səhifə', path: '/' },
        { name: 'Zikr və Təsbih', path: '/zikr' },
      ]),
      noscriptHtml:
        '<h1>Səhər-Axşam Zikrləri və İnteraktiv Təsbih Sayğacı</h1><p>Namaz təsbihatı, səhər və axşam zikrləri — ərəbcə mətn və Azərbaycan tərcüməsi.</p>',
    };
  }

  if (cleanPath === '/gunun-ayesi') {
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: 'Günün Ayəsi və Təfəkkür | Quran Qiraeti',
      description:
        'Seçilmiş Quran ayələri, ərəbcə mətn və Azərbaycan dilində mənaca tərcüməsi ilə gündəlik təfəkkür.',
      canonicalUrl: `${baseUrl}/gunun-ayesi`,
      ogImage: defaultOg,
      ogType: 'article',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Günün Ayəsi və Təfəkkür',
          description:
            'Seçilmiş Quran ayələri, ərəbcə mətn və Azərbaycan dilində mənaca tərcüməsi ilə gündəlik təfəkkür.',
          url: `${baseUrl}/gunun-ayesi`,
          inLanguage: ['az', 'ar'],
          publisher: {
            '@type': 'Organization',
            name: 'Quran Qiraeti',
            url: `${baseUrl}/`,
          },
        },
        buildBreadcrumbJsonLd(baseUrl, [
          { name: 'Ana səhifə', path: '/' },
          { name: 'Günün Ayəsi', path: '/gunun-ayesi' },
        ]),
      ],
      noscriptHtml: '<h1>Günün Ayəsi və Təfəkkür</h1><p>Gündəlik seçilmiş Quran ayələri, ərəbcə mətn və tərcümə.</p>',
    };
  }

  if (cleanPath === '/haqqinda') {
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: 'Kanal Haqqında | Quran Qiraeti',
      description:
        'Quran Qiraeti YouTube kanalının məqsədi, tərcümə prinsipləri və seçilmiş qarilər haqqında məlumat.',
      canonicalUrl: `${baseUrl}/haqqinda`,
      ogImage: defaultOg,
      ogType: 'website',
      jsonLd: buildBreadcrumbJsonLd(baseUrl, [
        { name: 'Ana səhifə', path: '/' },
        { name: 'Haqqında', path: '/haqqinda' },
      ]),
      noscriptHtml: '<h1>Quran Qiraeti Kanalı Haqqında</h1>',
    };
  }

  if (cleanPath === '/istek') {
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: 'Surə İstəyi Göndər | Quran Qiraeti',
      description:
        'Quran Qiraeti kanalında növbəti yayımlanmasını istədiyiniz surəni və qarini təklif edin.',
      canonicalUrl: `${baseUrl}/istek`,
      ogImage: defaultOg,
      ogType: 'website',
      jsonLd: buildBreadcrumbJsonLd(baseUrl, [
        { name: 'Ana səhifə', path: '/' },
        { name: 'Surə İstəyi', path: '/istek' },
      ]),
      noscriptHtml: '<h1>Surə İstəyi Göndər</h1>',
    };
  }

  const surahMatch = cleanPath.match(/^\/quran\/(?:sure\/)?(\d+)$/);
  if (surahMatch) {
    const num = Number.parseInt(surahMatch[1], 10);
    const surah = getSurahByNumber(num);
    if (!surah) {
      return {
        httpStatus: 404,
        robots: robotsNoIndex,
        title: 'Surə tapılmadı (404) | Quran Qiraeti',
        description: 'Qurani-Kərimdə surə nömrəsi 1 ilə 114 arasında olmalıdır.',
        canonicalUrl: `${baseUrl}/quran`,
        ogImage: defaultOg,
        ogType: 'website',
        noscriptHtml: '<h1>Surə tapılmadı</h1>',
      };
    }
    const faq = buildSurahFaqEntries(surah);
    const startJuz = getJuzForPage(surah.startPage);
    const faqHtml = `<section><h2>${escapeHtmlText(surah.name)} surəsi haqqında tez-tez verilən suallar</h2><dl>${faq
      .map(
        (item) =>
          `<dt>${escapeHtmlText(item.question)}</dt><dd>${escapeHtmlText(item.answer)}</dd>`
      )
      .join('')}</dl></section>`;
    const ayahsHtml =
      extras?.surahPayload && extras.surahPayload.surahNumber === surah.number
        ? `<article>${extras.surahPayload.ayahs
            .map(
              (a) =>
                `<div><p dir="rtl" lang="ar">${escapeHtmlText(a.arabicText)} ﴿${a.ayahNumber}﴾</p><p lang="az">${a.ayahNumber}. ${escapeHtmlText(a.translation)}</p></div>`
            )
            .join('')}</article>`
        : '';

    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: `${surah.number}. ${surah.name} surəsi — Ərəbcə və Tərcümə | Quran Qiraeti`,
      description: `${surah.name} surəsi (${surah.ayahCount} ayə, ${surah.revelationPlace}, Mədinə çapı Səhifə ${surah.startPage}). Ərəbcə mətn və Əlixan Musayevin Azərbaycan tərcüməsi.`,
      canonicalUrl: `${baseUrl}/quran/sure/${surah.number}`,
      ogImage: defaultOg,
      ogType: 'article',
      prevUrl: surah.number > 1 ? `${baseUrl}/quran/sure/${surah.number - 1}` : undefined,
      nextUrl:
        surah.number < TOTAL_QURAN_SURAHS ? `${baseUrl}/quran/sure/${surah.number + 1}` : undefined,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Chapter',
          name: `${surah.number}. ${surah.name} surəsi`,
          position: surah.number,
          inLanguage: ['ar', 'az'],
          translator: {
            '@type': 'Person',
            name: 'Əlixan Musayev',
          },
          url: `${baseUrl}/quran/sure/${surah.number}`,
        },
        buildBreadcrumbJsonLd(baseUrl, [
          { name: 'Ana səhifə', path: '/' },
          { name: 'Qurani-Kərim', path: '/quran' },
          { name: `${surah.name} surəsi`, path: `/quran/sure/${surah.number}` },
        ]),
        buildFaqPageJsonLd(faq),
      ],
      noscriptHtml: `<h1>${escapeHtmlText(`${surah.number}. ${surah.name} surəsi (${surah.arabicName})`)}</h1><p>${escapeHtmlText(`${surah.ayahCount} ayə · ${surah.revelationPlace} · ${startJuz}-ci Cüz · Mədinə çapı Səhifə ${surah.startPage} · Əlixan Musayev tərcüməsi`)}</p><nav><a href="/quran/sehife/${surah.startPage}">Mədinə səhifəsi ${surah.startPage}</a> · <a href="/muhaffiz/${surah.startPage}">Mühafizdə əzbərlə</a> · <a href="/quran/cuz/${startJuz}">${startJuz}-ci Cüz</a></nav>${ayahsHtml}${faqHtml}`,
    };
  }

  const cuzMatch = cleanPath.match(/^\/quran\/cuz\/(\d+)$/);
  if (cuzMatch) {
    const juzNum = Number.parseInt(cuzMatch[1], 10);
    const range = JUZ_PAGE_RANGES.find((j) => j.juz === juzNum);
    if (!range) {
      return {
        httpStatus: 404,
        robots: robotsNoIndex,
        title: 'Cüz tapılmadı (404) | Quran Qiraeti',
        description: 'Qurani-Kərimdə cüz nömrəsi 1 ilə 30 arasında olmalıdır.',
        canonicalUrl: `${baseUrl}/quran`,
        ogImage: defaultOg,
        ogType: 'website',
        noscriptHtml: '<h1>Cüz tapılmadı</h1>',
      };
    }
    const ordinalJuz = formatAzerbaijaniOrdinal(juzNum);
    const matchingSurahs = SURAH_CATALOG.filter((s, idx) => {
      const nextStart = SURAH_CATALOG[idx + 1]?.startPage ?? TOTAL_QURAN_PAGES;
      const surahEndPage = Math.max(s.startPage, nextStart);
      return s.startPage <= range.endPage && surahEndPage >= range.startPage;
    });
    const surahNamesPreview = matchingSurahs
      .slice(0, 4)
      .map((s) => s.name)
      .join(', ');
    const description = `Mədinə Mushafının ${ordinalJuz} Cüzü (Səhifə ${range.startPage}–${range.endPage}): ${surahNamesPreview} surələri — ərəbcə mətn və Əlixan Musayev tərcüməsi.`;
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: `${ordinalJuz} Cüz (Səhifə ${range.startPage}–${range.endPage}) | Quran Qiraeti`,
      description,
      canonicalUrl: `${baseUrl}/quran/cuz/${juzNum}`,
      ogImage: defaultOg,
      ogType: 'website',
      prevUrl: juzNum > 1 ? `${baseUrl}/quran/cuz/${juzNum - 1}` : undefined,
      nextUrl: juzNum < 30 ? `${baseUrl}/quran/cuz/${juzNum + 1}` : undefined,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${ordinalJuz} Cüz — Qurani-Kərim (Səhifə ${range.startPage}–${range.endPage})`,
          description,
          inLanguage: ['ar', 'az'],
          url: `${baseUrl}/quran/cuz/${juzNum}`,
        },
        buildBreadcrumbJsonLd(baseUrl, [
          { name: 'Ana səhifə', path: '/' },
          { name: 'Qurani-Kərim', path: '/quran' },
          { name: `${ordinalJuz} Cüz`, path: `/quran/cuz/${juzNum}` },
        ]),
      ],
      noscriptHtml: `<h1>${escapeHtmlText(`${ordinalJuz} Cüz (Səhifə ${range.startPage}–${range.endPage})`)}</h1><p>${escapeHtmlText(description)}</p><nav><a href="/quran/sehife/${range.startPage}">Səhifə ${range.startPage}-dən oxu</a> · <a href="/muhaffiz/${range.startPage}">Mühafizdə əzbərlə</a></nav><ul>${matchingSurahs
        .map((s) => `<li><a href="/quran/sure/${s.number}">${escapeHtmlText(`${s.number}. ${s.name} surəsi`)}</a></li>`)
        .join('')}</ul>`,
    };
  }

  const mushafMatch = cleanPath.match(/^\/quran\/sehife\/(\d+)$/);
  if (mushafMatch) {
    const pageNum = Number.parseInt(mushafMatch[1], 10);
    if (Number.isNaN(pageNum) || pageNum < 1 || pageNum > TOTAL_QURAN_PAGES) {
      return {
        httpStatus: 404,
        robots: robotsNoIndex,
        title: 'Mushaf səhifəsi tapılmadı (404) | Quran Qiraeti',
        description: 'Mədinə Mushafı səhifələri 1 ilə 604 arasında nömrələnmişdir.',
        canonicalUrl: `${baseUrl}/quran`,
        ogImage: defaultOg,
        ogType: 'website',
        noscriptHtml: '<h1>Səhifə tapılmadı</h1>',
      };
    }
    const juz = getJuzForPage(pageNum);
    const ordinal = formatAzerbaijaniOrdinal(pageNum);
    const activeRub = getActiveRubForPage(pageNum);
    const mushafAyahsHtml =
      extras?.mushafPayload && extras.mushafPayload.pageNumber === pageNum
        ? `<article>${extras.mushafPayload.ayahs
            .map(
              (a) =>
                `<div><p><strong>${escapeHtmlText(a.surahName)} ${a.surahNumber}:${a.ayahNumber}</strong></p><p dir="rtl" lang="ar">${escapeHtmlText(a.arabicText)}</p><p lang="az">${escapeHtmlText(a.translation)}</p></div>`
            )
            .join('')}</article>`
        : '';

    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: `Qurani-Kərim — ${ordinal} səhifə (Mədinə çapı) | Quran Qiraeti`,
      description: `Mədinə çapı üzrə Qurani-Kərimin ${pageNum}-ci səhifəsi (${juz}-ci Cüz, Rüb ${activeRub.rub}/240): ərəbcə mətn və Əlixan Musayevin Azərbaycan tərcüməsi.`,
      canonicalUrl: `${baseUrl}/quran/sehife/${pageNum}`,
      ogImage: defaultOg,
      ogType: 'article',
      prevUrl: pageNum > 1 ? `${baseUrl}/quran/sehife/${pageNum - 1}` : undefined,
      nextUrl: pageNum < TOTAL_QURAN_PAGES ? `${baseUrl}/quran/sehife/${pageNum + 1}` : undefined,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: `Qurani-Kərim — Səhifə ${pageNum}`,
          url: `${baseUrl}/quran/sehife/${pageNum}`,
          inLanguage: ['ar', 'az'],
        },
        buildBreadcrumbJsonLd(baseUrl, [
          { name: 'Ana səhifə', path: '/' },
          { name: 'Qurani-Kərim', path: '/quran' },
          { name: `Səhifə ${pageNum}`, path: `/quran/sehife/${pageNum}` },
        ]),
      ],
      noscriptHtml: `<h1>Qurani-Kərim — ${escapeHtmlText(ordinal)} səhifə (${juz}-ci Cüz · Rüb ${activeRub.rub}/240)</h1><nav>${pageNum > 1 ? `<a href="/quran/sehife/${pageNum - 1}">Əvvəlki səhifə (${pageNum - 1})</a> · ` : ''}<a href="/muhaffiz/${pageNum}">Mühafizdə əzbərlə</a>${pageNum < TOTAL_QURAN_PAGES ? ` · <a href="/quran/sehife/${pageNum + 1}">Növbəti səhifə (${pageNum + 1})</a>` : ''}</nav>${mushafAyahsHtml}`,
    };
  }

  const muhaffizMatch = cleanPath.match(/^\/(?:muhaffiz|ezber)(?:\/(\d+))?$/);
  if (muhaffizMatch) {
    const rawPage = muhaffizMatch[1] ? Number.parseInt(muhaffizMatch[1], 10) : 1;
    if (muhaffizMatch[1] && (Number.isNaN(rawPage) || rawPage < 1 || rawPage > TOTAL_QURAN_PAGES)) {
      return {
        httpStatus: 404,
        robots: robotsNoIndex,
        title: 'Mühafiz səhifəsi tapılmadı (404) | Quran Qiraeti',
        description: 'Mühafiz Mushafı səhifələri 1 ilə 604 arasındadır.',
        canonicalUrl: `${baseUrl}/muhaffiz`,
        ogImage: defaultOg,
        ogType: 'website',
        noscriptHtml: '<h1>Səhifə tapılmadı</h1>',
      };
    }
    const pageNum = clampMuhaffizPage(rawPage);
    const canonicalPath = muhaffizMatch[1] ? `/muhaffiz/${pageNum}` : '/muhaffiz';
    const muhaffizFaq = [
      {
        question: 'Mühafiz əzbər aləti necə işləyir?',
        answer: 'Orijinal 15 sətirlik Mədinə Mushafı səhifələrində sözləri və ya bütöv ayələri gizlədib toxunuşla açaraq özünüzü sınaya bilərsiniz.',
      },
      {
        question: 'Mühafizdə neçə qari ilə səsli təkrar mümkündür?',
        answer: 'Hər səhifə və ayə üzrə seçilmiş 5 fərqli qari ilə səsli oxutma və fərdi ayə təkrarı funksiyası mövcuddur.',
      },
    ];
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: `Mühafiz (Əzbər Mushafı) — Səhifə ${pageNum} | Quran Qiraeti`,
      description:
        'Ayələri sözbə-söz və ya ayə-ayə gizlədib-açaraq 1–604 Mədinə Mushafı səhifəsində Qurani-Kərimi əzbərləmək üçün Mühafiz aləti.',
      canonicalUrl: `${baseUrl}${canonicalPath}`,
      ogImage: defaultOg,
      ogType: 'website',
      prevUrl: pageNum > 1 ? `${baseUrl}/muhaffiz/${pageNum - 1}` : undefined,
      nextUrl: pageNum < TOTAL_QURAN_PAGES ? `${baseUrl}/muhaffiz/${pageNum + 1}` : undefined,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Mühafiz — Quran Əzbər Mushafı',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'All',
          inLanguage: ['az', 'ar'],
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          url: `${baseUrl}${canonicalPath}`,
        },
        buildBreadcrumbJsonLd(baseUrl, [
          { name: 'Ana səhifə', path: '/' },
          { name: 'Mühafiz', path: '/muhaffiz' },
          ...(muhaffizMatch[1]
            ? [{ name: `Səhifə ${pageNum}`, path: `/muhaffiz/${pageNum}` }]
            : []),
        ]),
        ...(!muhaffizMatch[1] ? [buildFaqPageJsonLd(muhaffizFaq)] : []),
      ],
      noscriptHtml: `<h1>Mühafiz — Mədinə Mushafı Səhifə ${pageNum}</h1><p>Sözbə-söz və ayə-ayə Quran əzbərləmə aləti.</p>`,
    };
  }

  const videoMatch = cleanPath.match(/^\/video\/([a-zA-Z0-9_-]+)$/);
  if (videoMatch) {
    const videoId = videoMatch[1];
    const video = videos.find((v) => v.videoId === videoId);
    const title = video
      ? `${video.title} — ${video.reciter} | Quran Qiraeti`
      : `Quran Tilavəti (${videoId}) | Quran Qiraeti`;
    const description =
      video?.seoDescription ||
      'Quran Qiraeti kanalından ərəbcə Quran tilavəti, surə ayələri və Azərbaycan dilində tərcümə.';
    const ogImage = video?.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title,
      description,
      canonicalUrl: `${baseUrl}/video/${videoId}`,
      ogImage,
      ogType: 'video.other',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: video?.title ?? title,
          description,
          thumbnailUrl: [ogImage],
          uploadDate: video?.published || undefined,
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
          contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
          inLanguage: ['ar', 'az'],
        },
        buildBreadcrumbJsonLd(baseUrl, [
          { name: 'Ana səhifə', path: '/' },
          ...(video?.format === 'short' ? [{ name: 'Shorts', path: '/shorts' }] : []),
          { name: video?.title ?? videoId, path: `/video/${videoId}` },
        ]),
      ],
      noscriptHtml: `<h1>${escapeHtmlText(video?.title ?? title)}</h1><p>${escapeHtmlText(description)}</p>`,
    };
  }

  // Fallback for unknown routes -> strict HTTP 404 + noindex (prevents Soft 404)
  return {
    httpStatus: 404,
    robots: robotsNoIndex,
    title: 'Səhifə tapılmadı (404) | Quran Qiraeti',
    description: 'Axtardığınız səhifə tapılmadı. Qurani-Kərim və tilavət arxivinə qayıdın.',
    canonicalUrl: `${baseUrl}/`,
    ogImage: defaultOg,
    ogType: 'website',
    noscriptHtml: '<h1>404 — Səhifə tapılmadı</h1>',
  };
}

export function injectRouteSeoIntoHtml(
  html: string,
  meta: RouteSeoMetadata,
  options?: { googleSiteVerification?: string }
): string {
  const safeTitle = escapeHtmlText(meta.title);
  const safeDesc = escapeHtmlAttr(meta.description);
  const safeRobots = escapeHtmlAttr(meta.robots);
  const safeCanonical = escapeHtmlAttr(meta.canonicalUrl);
  const safeOgImage = escapeHtmlAttr(meta.ogImage);
  const safeOgType = escapeHtmlAttr(meta.ogType);
  const verificationToken = (options?.googleSiteVerification ?? '').trim();

  let out = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${safeDesc}" />`
    )
    .replace(
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="robots" content="${safeRobots}" />`
    )
    .replace(
      /<meta\s+name="googlebot"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="googlebot" content="${safeRobots}" />`
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${escapeHtmlAttr(meta.title)}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${safeDesc}" />`
    )
    .replace(
      /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:type" content="${safeOgType}" />`
    )
    .replace(
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image" content="${safeOgImage}" />`
    )
    .replace(
      /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:image" content="${safeOgImage}" />`
    )
    .replace(/<meta\s+name="google-site-verification"\s+content="[^"]*"\s*\/?>\s*/gi, '')
    .replace(/<meta\s+property="og:(?:url|image:alt)"\s+content="[^"]*"\s*\/?>\s*/gi, '')
    .replace(/<meta\s+name="twitter:(?:title|description)"\s+content="[^"]*"\s*\/?>\s*/gi, '')
    .replace(/<link\s+rel="(?:canonical|prev|next)"\s+href="[^"]*"\s*\/?>\s*/gi, '')
    .replace(/<link\s+rel="alternate"\s+hreflang="(?:az|x-default)"\s+href="[^"]*"\s*\/?>\s*/gi, '')
    .replace(/<script\s+id="quran-qiraeti-ssr-jsonld"\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, '');

  const extraHeadTags = [
    verificationToken
      ? `<meta name="google-site-verification" content="${escapeHtmlAttr(verificationToken)}" />`
      : '',
    `<link rel="canonical" href="${safeCanonical}" />`,
    `<meta property="og:url" content="${safeCanonical}" />`,
    `<meta property="og:image:alt" content="${escapeHtmlAttr(meta.title)}" />`,
    `<meta name="twitter:title" content="${escapeHtmlAttr(meta.title)}" />`,
    `<meta name="twitter:description" content="${safeDesc}" />`,
    `<link rel="alternate" hreflang="az" href="${safeCanonical}" />`,
    `<link rel="alternate" hreflang="x-default" href="${safeCanonical}" />`,
    meta.prevUrl ? `<link rel="prev" href="${escapeHtmlAttr(meta.prevUrl)}" />` : '',
    meta.nextUrl ? `<link rel="next" href="${escapeHtmlAttr(meta.nextUrl)}" />` : '',
    meta.jsonLd
      ? `<script id="quran-qiraeti-ssr-jsonld" type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c')}</script>`
      : '',
  ]
    .filter(Boolean)
    .join('\n    ');

  out = out.replace('</head>', `    ${extraHeadTags}\n  </head>`);
  out = out.replace(
    '<div id="root"></div>',
    `<div id="root"></div>\n    <noscript>${meta.noscriptHtml}</noscript>`
  );

  return out;
}

export async function submitIndexNowPing(
  host: string,
  key: string,
  urlList: string[]
): Promise<{ submitted: boolean; status: number }> {
  if (!key || !host || urlList.length === 0) {
    return { submitted: false, status: 0 };
  }
  const cleanHost = host.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: cleanHost,
      key,
      keyLocation: `https://${cleanHost}/${key}.txt`,
      urlList: urlList.slice(0, 100),
    }),
    signal: AbortSignal.timeout(5000),
  });
  return { submitted: res.ok, status: res.status };
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
    `- [Qurandakı Dualar](${baseUrl}/dualar): Qurandan seçilmiş ${QURAN_DUAS.length} Rəbbənə və peyğəmbər duası — səsli tilavət və tərcümə.`,
    `- [Zikrlər və Təsbih](${baseUrl}/zikr): Səhər-axşam zikrləri, namaz təsbihatı və gündəlik zikr sayğacı.`,
    `- [Namaz Vaxtları](${baseUrl}/namaz-vaxtlari): Bakı, Gəncə, Sumqayıt, Naxçıvan, Şəki, Şuşa və digər Azərbaycan şəhərləri üzrə namaz vaxtları.`,
    `- [Mühafiz — Əzbər Mushafı](${baseUrl}/muhaffiz): 604 Mushaf səhifəsində ayələri sözbə-söz və ayə-ayə gizlədib-açaraq hifz və təkrar aləti.`,
    `- [Günün Ayəsi](${baseUrl}/gunun-ayesi): Seçilmiş ayələr, ərəbcə mətn və təfəkkür izahı.`,
    `- [Kanal Haqqında](${baseUrl}/haqqinda): Kanalın məqsədi, qarilər və tərcümə prinsipləri.`,
    `- [Surə İstəyi](${baseUrl}/istek): Dinləyicilər üçün surə və qari təklifi formu.`,
    '',
    '## Machine-Readable Endpoints for AI & Search Crawlers',
    `- [XML Sitemap](${baseUrl}/sitemap.xml): Complete URL index (core routes, 30 Juz, 114 surahs, 604 Mushaf pages, all channel videos).`,
    `- [XML Sitemap Index](${baseUrl}/sitemap-index.xml): Split sitemaps (core, surahs, mushaf, muhaffiz 1..604, Google video sitemap).`,
    `- [Google Video Sitemap](${baseUrl}/sitemap-videos.xml): Structured Video Sitemap with duration and thumbnails.`,
    `- [RSS 2.0 Feed](${baseUrl}/rss.xml): Syndicated XML feed of Quran Qiraeti long recitations and Shorts.`,
    `- [Full LLM Reference](${baseUrl}/llms-full.txt): Expanded catalog of all 114 surahs, 30 Juz page ranges, and channel videos.`,
    `- [AI Structured JSON Index](${baseUrl}/ai-index.json): Structured JSON feed of channel stats, surahs, and video metadata.`,
    `- [Channel Feed JSON](${baseUrl}/api/channel): Live long videos and Shorts metadata JSON.`,
    `- [Surah Translation JSON Pattern](${baseUrl}/api/quran/surah/{1..114}): Arabic text, Əlixan Musayev Azerbaijani translation (v1.0.4), and footnotes per surah.`,
    `- [Mushaf Page JSON Pattern](${baseUrl}/api/quran/page/{1..604}): Exact ayahs per Mushaf page with Arabic Uthmani text and Əlixan Musayev translation.`,
    '',
    '## Complete Quran Index (114 Surahs, 30 Juz & 604 Pages)',
    `- Individual Juz Pages: ${baseUrl}/quran/cuz/{1..30}`,
    `- Individual Surah Pages: ${baseUrl}/quran/sure/{1..114}`,
    `- Individual Mushaf Pages: ${baseUrl}/quran/sehife/{1..604}`,
    `- Individual Muhaffiz Memorization Pages: ${baseUrl}/muhaffiz/{1..604}`,
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
      (j) => `- Cüz ${j.juz}: ${baseUrl}/quran/cuz/${j.juz} | Start Page: ${baseUrl}/quran/sehife/${j.startPage} — Səhifə ${j.startPage}–${j.endPage}`
    ),
    '',
    `## Qurandakı Dualar (${QURAN_DUAS.length})`,
    ...QURAN_DUAS.map(
      (d) =>
        `- ${d.title} (${d.surahName} ${d.ayahLabel}) | URL: ${baseUrl}/quran/sure/${d.surahNumber}#ayah-${d.ayahNumber} | ${d.translation}`
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
    schemaVersion: '1.1',
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
      sitemapIndexXml: `${baseUrl}/sitemap-index.xml`,
      videoSitemapXml: `${baseUrl}/sitemap-videos.xml`,
      rssXml: `${baseUrl}/rss.xml`,
      robotsTxt: `${baseUrl}/robots.txt`,
      llmsTxt: `${baseUrl}/llms.txt`,
      llmsFullTxt: `${baseUrl}/llms-full.txt`,
    },
    endpoints: {
      channel: `${baseUrl}/api/channel`,
      surahTemplate: `${baseUrl}/api/quran/surah/{surahNumber}`,
      mushafPageTemplate: `${baseUrl}/api/quran/page/{pageNumber}`,
    },
    juzIndex: JUZ_PAGE_RANGES.map((j) => ({
      ...j,
      url: `${baseUrl}/quran/cuz/${j.juz}`,
      startPageUrl: `${baseUrl}/quran/sehife/${j.startPage}`,
      muhaffizUrl: `${baseUrl}/muhaffiz/${j.startPage}`,
    })),
    duas: QURAN_DUAS.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      surahNumber: d.surahNumber,
      surahName: d.surahName,
      ayahNumber: d.ayahNumber,
      url: `${baseUrl}/quran/sure/${d.surahNumber}#ayah-${d.ayahNumber}`,
      duasPageUrl: `${baseUrl}/dualar`,
    })),
    popularTopics: POPULAR_QURAN_TOPICS.map((t) => ({
      ...t,
      url: `${baseUrl}/quran/sehife/${t.pageNumber}`,
      surahUrl: `${baseUrl}/quran/sure/${t.surahNumber}`,
      muhaffizUrl: `${baseUrl}/muhaffiz/${t.pageNumber}`,
    })),
    surahs: SURAH_CATALOG.map((s) => ({
      ...s,
      url: `${baseUrl}/quran/sure/${s.number}`,
      apiUrl: `${baseUrl}/api/quran/surah/${s.number}`,
      startPageUrl: `${baseUrl}/quran/sehife/${s.startPage}`,
      muhaffizUrl: `${baseUrl}/muhaffiz/${s.startPage}`,
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
