import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAiIndexJson,
  buildBreadcrumbJsonLd,
  buildDynamicOgSvg,
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildMuhaffizSitemapXml,
  buildRobotsTxt,
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

test('buildSitemapXml and split sitemaps cover core routes, 114 surahs, 604 Mushaf & Muhaffiz pages, and Google Video tags', () => {
  const videos = [...SEED_LONG_VIDEOS, ...SEED_SHORTS];
  const xml = buildSitemapXml('https://quranqiraeti.vercel.app', videos, '2026-11-15');
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<loc>https://quranqiraeti.vercel.app/</loc>'));
  assert.ok(xml.includes('<loc>https://quranqiraeti.vercel.app/shorts</loc>'));
  assert.ok(xml.includes('<loc>https://quranqiraeti.vercel.app/muhaffiz</loc>'));
  assert.ok(xml.includes('<loc>https://quranqiraeti.vercel.app/quran/sure/1</loc>'));
  assert.ok(xml.includes('<loc>https://quranqiraeti.vercel.app/quran/sure/114</loc>'));
  assert.ok(xml.includes('<loc>https://quranqiraeti.vercel.app/quran/sehife/1</loc>'));
  assert.ok(xml.includes('<loc>https://quranqiraeti.vercel.app/quran/sehife/604</loc>'));
  assert.ok(xml.includes(`<loc>https://quranqiraeti.vercel.app/video/${SEED_LONG_VIDEOS[0].videoId}</loc>`));

  const indexXml = buildSitemapIndexXml('https://quranqiraeti.vercel.app', '2026-11-15');
  assert.ok(indexXml.includes('<sitemapindex'));
  assert.ok(indexXml.includes('/sitemap-muhaffiz.xml'));

  const muhaffizXml = buildMuhaffizSitemapXml('https://quranqiraeti.vercel.app', '2026-11-15');
  assert.ok(muhaffizXml.includes('<loc>https://quranqiraeti.vercel.app/muhaffiz/604</loc>'));

  const videoXml = buildVideoSitemapXml('https://quranqiraeti.vercel.app', videos, '2026-11-15');
  assert.ok(videoXml.includes('<video:video>'));
  assert.ok(videoXml.includes('<video:duration>'));
});

test('resolveRouteSeoMetadata & injectRouteSeoIntoHtml handle Surah, Video, Admin noindex, and 404 Soft-404 protection', () => {
  const surahMeta = resolveRouteSeoMetadata('/quran/sure/36', 'https://quranqiraeti.vercel.app', []);
  assert.equal(surahMeta.httpStatus, 200);
  assert.ok(surahMeta.title.includes('Yasin'));
  assert.ok(surahMeta.ogImage.endsWith('/og-default.png'));

  const adminMeta = resolveRouteSeoMetadata('/admin', 'https://quranqiraeti.vercel.app', []);
  assert.equal(adminMeta.httpStatus, 200);
  assert.equal(adminMeta.robots, 'noindex, nofollow');

  const notFoundMeta = resolveRouteSeoMetadata('/quran/sure/999', 'https://quranqiraeti.vercel.app', []);
  assert.equal(notFoundMeta.httpStatus, 404);
  assert.equal(notFoundMeta.robots, 'noindex, nofollow');

  const sampleHtml = `<html><head><title>Old</title><meta name="description" content="Old" /><meta name="robots" content="index" /><meta name="googlebot" content="index" /><meta property="og:title" content="Old" /><meta property="og:description" content="Old" /><meta property="og:type" content="website" /><meta property="og:image" content="/old.svg" /><meta name="twitter:image" content="/old.svg" /></head><body><div id="root"></div></body></html>`;
  const injected = injectRouteSeoIntoHtml(sampleHtml, surahMeta);
  assert.ok(injected.includes('<title>36. Yasin surəsi'));
  assert.ok(injected.includes('<link rel="canonical" href="https://quranqiraeti.vercel.app/quran/sure/36" />'));
  assert.ok(injected.includes('application/ld+json'));
  assert.ok(injected.includes('<noscript><h1>36. Yasin surəsi'));
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
  assert.ok(llms.includes('/quran/sure/114'));

  const llmsFull = buildLlmsFullTxt('https://quranqiraeti.vercel.app', DEFAULT_CHANNEL_STATS, SEED_LONG_VIDEOS, SEED_SHORTS);
  assert.ok(llmsFull.includes('Cüz 30:'));
  assert.ok(llmsFull.includes(`All Long Videos (${SEED_LONG_VIDEOS.length})`));

  const json = buildAiIndexJson('https://quranqiraeti.vercel.app', DEFAULT_CHANNEL_STATS, SEED_LONG_VIDEOS, SEED_SHORTS);
  assert.equal(json.surahs.length, 114);
  assert.equal(json.site.stats.mushafPagesCount, 604);
  assert.equal(json.discovery.sitemapXml, 'https://quranqiraeti.vercel.app/sitemap.xml');
});
