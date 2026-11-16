import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAiIndexJson,
  buildBreadcrumbJsonLd,
  buildCoreSitemapXml,
  buildDynamicOgSvg,
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildMuhaffizSitemapXml,
  buildRobotsTxt,
  buildRssFeedXml,
  buildSitemapIndexXml,
  buildSitemapXml,
  buildSurahFaqEntries,
  buildVideoSitemapXml,
  injectRouteSeoIntoHtml,
  resolveRouteSeoMetadata,
} from './seo';
import { DEFAULT_CHANNEL_STATS, SEED_LONG_VIDEOS, SEED_SHORTS } from '../data/recitations';
import { getSurahByNumber } from './quran';

test('buildRobotsTxt permits search engines and major AI crawlers with sitemap and llms links', () => {
  const txt = buildRobotsTxt('https://quranqiraeti.vercel.app/');
  assert.ok(txt.includes('User-agent: GPTBot'));
  assert.ok(txt.includes('User-agent: ClaudeBot'));
  assert.ok(txt.includes('User-agent: PerplexityBot'));
  assert.ok(txt.includes('User-agent: Google-Extended'));
  assert.ok(txt.includes('Sitemap: https://quranqiraeti.vercel.app/sitemap.xml'));
  assert.ok(txt.includes('Sitemap: https://quranqiraeti.vercel.app/sitemap-index.xml'));
  assert.ok(txt.includes('Sitemap: https://quranqiraeti.vercel.app/sitemap-videos.xml'));
  assert.ok(txt.includes('https://quranqiraeti.vercel.app/llms.txt'));
});

test('buildSitemapXml and split sitemaps cover core routes, 30 Juz, 114 surahs, 604 Mushaf & Muhaffiz pages, and Google Video tags', () => {
  const videos = [...SEED_LONG_VIDEOS, ...SEED_SHORTS];
  const xml = buildSitemapXml('https://quranqiraeti.vercel.app', videos, '2026-11-15');
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<loc>https://quranqiraeti.vercel.app/</loc>'));
  assert.ok(xml.includes('<loc>https://quranqiraeti.vercel.app/shorts</loc>'));
  assert.ok(xml.includes('<loc>https://quranqiraeti.vercel.app/dualar</loc>'));
  assert.ok(xml.includes('<loc>https://quranqiraeti.vercel.app/muhaffiz</loc>'));
  assert.ok(xml.includes('<loc>https://quranqiraeti.vercel.app/quran/cuz/1</loc>'));
  assert.ok(xml.includes('<loc>https://quranqiraeti.vercel.app/quran/cuz/30</loc>'));
  assert.ok(xml.includes('<loc>https://quranqiraeti.vercel.app/quran/sure/1</loc>'));
  assert.ok(xml.includes('<loc>https://quranqiraeti.vercel.app/quran/sure/114</loc>'));
  assert.ok(xml.includes('<loc>https://quranqiraeti.vercel.app/quran/sehife/1</loc>'));
  assert.ok(xml.includes('<loc>https://quranqiraeti.vercel.app/quran/sehife/604</loc>'));
  assert.ok(xml.includes(`<loc>https://quranqiraeti.vercel.app/video/${SEED_LONG_VIDEOS[0].videoId}</loc>`));

  const coreXml = buildCoreSitemapXml('https://quranqiraeti.vercel.app', '2026-11-15');
  assert.ok(coreXml.includes('<loc>https://quranqiraeti.vercel.app/quran/cuz/1</loc>'));
  assert.ok(coreXml.includes('<loc>https://quranqiraeti.vercel.app/quran/cuz/30</loc>'));

  const indexXml = buildSitemapIndexXml('https://quranqiraeti.vercel.app', '2026-11-15');
  assert.ok(indexXml.includes('<sitemapindex'));
  assert.ok(indexXml.includes('/sitemap-muhaffiz.xml'));

  const muhaffizXml = buildMuhaffizSitemapXml('https://quranqiraeti.vercel.app', '2026-11-15');
  assert.ok(muhaffizXml.includes('<loc>https://quranqiraeti.vercel.app/muhaffiz/604</loc>'));

  const videoXml = buildVideoSitemapXml('https://quranqiraeti.vercel.app', videos, '2026-11-15');
  assert.ok(videoXml.includes('<video:video>'));
  assert.ok(videoXml.includes('<video:duration>'));
});

test('buildRssFeedXml builds valid RSS 2.0 XML with channel video items', () => {
  const rss = buildRssFeedXml(
    'https://quranqiraeti.vercel.app',
    DEFAULT_CHANNEL_STATS,
    [...SEED_LONG_VIDEOS, ...SEED_SHORTS]
  );
  assert.ok(rss.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(rss.includes('<rss version="2.0"'));
  assert.ok(rss.includes('<atom:link href="https://quranqiraeti.vercel.app/rss.xml" rel="self" type="application/rss+xml" />'));
  assert.ok(rss.includes('<item>'));
  assert.ok(rss.includes(`<link>https://quranqiraeti.vercel.app/video/${SEED_LONG_VIDEOS[0].videoId}</link>`));
  assert.ok(rss.includes('<media:thumbnail url='));
});

test('resolveRouteSeoMetadata & injectRouteSeoIntoHtml handle Home, Juz, Surah, Dualar, Muhaffiz, Admin, and 404 without duplicate tags', () => {
  const homeMeta = resolveRouteSeoMetadata('/', 'https://quranqiraeti.vercel.app', SEED_LONG_VIDEOS);
  assert.equal(homeMeta.httpStatus, 200);
  assert.ok(Array.isArray(homeMeta.jsonLd));
  const homeSerialized = JSON.stringify(homeMeta.jsonLd);
  assert.ok(homeSerialized.includes('"@type":"Organization"'));
  assert.ok(homeSerialized.includes('"@type":"SearchAction"'));

  const surahMeta = resolveRouteSeoMetadata('/quran/sure/36', 'https://quranqiraeti.vercel.app', []);
  assert.equal(surahMeta.httpStatus, 200);
  assert.ok(surahMeta.title.includes('Yasin'));
  assert.ok(surahMeta.ogImage.endsWith('/og-default.png'));

  const juz1Meta = resolveRouteSeoMetadata('/quran/cuz/1', 'https://quranqiraeti.vercel.app', []);
  assert.equal(juz1Meta.httpStatus, 200);
  assert.ok(juz1Meta.title.includes('1-ci Cüz'));
  assert.equal(juz1Meta.prevUrl, undefined);
  assert.equal(juz1Meta.nextUrl, 'https://quranqiraeti.vercel.app/quran/cuz/2');

  const juz30Meta = resolveRouteSeoMetadata('/quran/cuz/30', 'https://quranqiraeti.vercel.app', []);
  assert.equal(juz30Meta.httpStatus, 200);
  assert.ok(juz30Meta.title.includes('30-cu Cüz'));
  assert.equal(juz30Meta.prevUrl, 'https://quranqiraeti.vercel.app/quran/cuz/29');
  assert.equal(juz30Meta.nextUrl, undefined);
  assert.ok(JSON.stringify(juz30Meta.jsonLd).includes('"@type":"CollectionPage"'));

  const badJuzMeta = resolveRouteSeoMetadata('/quran/cuz/99', 'https://quranqiraeti.vercel.app', []);
  assert.equal(badJuzMeta.httpStatus, 404);
  assert.equal(badJuzMeta.robots, 'noindex, nofollow');

  const dualarMeta = resolveRouteSeoMetadata('/dualar', 'https://quranqiraeti.vercel.app', []);
  assert.equal(dualarMeta.httpStatus, 200);
  assert.ok(dualarMeta.title.includes('Dualar'));
  assert.equal(dualarMeta.canonicalUrl, 'https://quranqiraeti.vercel.app/dualar');
  assert.ok(JSON.stringify(dualarMeta.jsonLd).includes('"@type":"FAQPage"'));

  const muhaffizMeta = resolveRouteSeoMetadata('/muhaffiz', 'https://quranqiraeti.vercel.app', []);
  assert.equal(muhaffizMeta.httpStatus, 200);
  const muhaffizJson = JSON.stringify(muhaffizMeta.jsonLd);
  assert.ok(muhaffizJson.includes('"@type":"Offer"'));
  assert.ok(muhaffizJson.includes('"@type":"FAQPage"'));

  const adminMeta = resolveRouteSeoMetadata('/admin', 'https://quranqiraeti.vercel.app', []);
  assert.equal(adminMeta.httpStatus, 200);
  assert.equal(adminMeta.robots, 'noindex, nofollow');
  assert.equal(adminMeta.jsonLd, undefined);

  const notFoundMeta = resolveRouteSeoMetadata('/quran/sure/999', 'https://quranqiraeti.vercel.app', []);
  assert.equal(notFoundMeta.httpStatus, 404);
  assert.equal(notFoundMeta.robots, 'noindex, nofollow');
  assert.equal(notFoundMeta.jsonLd, undefined);

  const sampleIndexHtml = `<html><head><title>Old</title><meta name="description" content="Old" /><meta name="robots" content="index" /><meta name="googlebot" content="index" /><meta property="og:title" content="Old" /><meta property="og:description" content="Old" /><meta property="og:type" content="website" /><meta property="og:image" content="/old.png" /><meta property="og:image:alt" content="Old Alt" /><meta name="twitter:title" content="Old" /><meta name="twitter:description" content="Old" /><meta name="twitter:image" content="/old.png" /><script id="quran-qiraeti-ssr-jsonld" type="application/ld+json">{"@type":"WebSite"}</script></head><body><div id="root"></div></body></html>`;

  const injected = injectRouteSeoIntoHtml(sampleIndexHtml, surahMeta);
  assert.ok(injected.includes('<title>36. Yasin surəsi'));
  assert.ok(injected.includes('<link rel="canonical" href="https://quranqiraeti.vercel.app/quran/sure/36" />'));
  assert.equal(injected.match(/type="application\/ld\+json"/g)?.length, 1);
  assert.equal(injected.match(/name="twitter:title"/g)?.length, 1);
  assert.equal(injected.match(/property="og:image:alt"/g)?.length, 1);
  assert.ok(injected.includes('<noscript><h1>36. Yasin surəsi'));

  const injectedAdmin = injectRouteSeoIntoHtml(sampleIndexHtml, adminMeta);
  assert.equal(injectedAdmin.match(/type="application\/ld\+json"/g)?.length ?? 0, 0);
});

test('buildBreadcrumbJsonLd, buildSurahFaqEntries, and buildDynamicOgSvg return valid structured SEO payloads', () => {
  const bc = buildBreadcrumbJsonLd('https://quranqiraeti.vercel.app', [
    { name: 'Ana səhifə', path: '/' },
    { name: 'Qurani-Kərim', path: '/quran' },
  ]);
  assert.equal(bc['@type'], 'BreadcrumbList');
  assert.equal(bc.itemListElement.length, 2);

  const yasin = getSurahByNumber(36)!;
  const faq = buildSurahFaqEntries(yasin, 445);
  assert.equal(faq.length, 3);
  assert.ok(faq[0].answer.includes('83 ayə'));

  const svg = buildDynamicOgSvg('sure', 36);
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('Yasin surəsi'));
});

test('buildLlmsTxt, buildLlmsFullTxt, and buildAiIndexJson expose complete AI discovery metadata', () => {
  const llms = buildLlmsTxt('https://quranqiraeti.vercel.app', DEFAULT_CHANNEL_STATS, SEED_LONG_VIDEOS, SEED_SHORTS);
  assert.ok(llms.includes('# Quran Qiraeti'));
  assert.ok(llms.includes('Əlixan Musayev'));
  assert.ok(llms.includes('/dualar'));
  assert.ok(llms.includes('/rss.xml'));
  assert.ok(llms.includes('/quran/sure/114'));

  const llmsFull = buildLlmsFullTxt('https://quranqiraeti.vercel.app', DEFAULT_CHANNEL_STATS, SEED_LONG_VIDEOS, SEED_SHORTS);
  assert.ok(llmsFull.includes('Cüz 30:'));
  assert.ok(llmsFull.includes('/quran/cuz/30'));
  assert.ok(llmsFull.includes('Qurandakı Dualar'));
  assert.ok(llmsFull.includes(`All Long Videos (${SEED_LONG_VIDEOS.length})`));

  const json = buildAiIndexJson('https://quranqiraeti.vercel.app', DEFAULT_CHANNEL_STATS, SEED_LONG_VIDEOS, SEED_SHORTS);
  assert.equal(json.surahs.length, 114);
  assert.equal(json.juzIndex.length, 30);
  assert.ok(json.duas.length >= 20);
  assert.equal(json.site.stats.mushafPagesCount, 604);
  assert.equal(json.discovery.sitemapXml, 'https://quranqiraeti.vercel.app/sitemap.xml');
  assert.equal(json.discovery.rssXml, 'https://quranqiraeti.vercel.app/rss.xml');
});
