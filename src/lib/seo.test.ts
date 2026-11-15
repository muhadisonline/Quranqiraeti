import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAiIndexJson,
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildRobotsTxt,
  buildSitemapXml,
} from './seo';
import { DEFAULT_CHANNEL_STATS, SEED_LONG_VIDEOS, SEED_SHORTS } from '../data/recitations';

test('buildRobotsTxt permits search engines and major AI crawlers with sitemap and llms links', () => {
  const txt = buildRobotsTxt('https://quranqiraeti.vercel.app/');
  assert.ok(txt.includes('User-agent: GPTBot'));
  assert.ok(txt.includes('User-agent: ClaudeBot'));
  assert.ok(txt.includes('User-agent: PerplexityBot'));
  assert.ok(txt.includes('User-agent: Google-Extended'));
  assert.ok(txt.includes('Sitemap: https://quranqiraeti.vercel.app/sitemap.xml'));
  assert.ok(txt.includes('https://quranqiraeti.vercel.app/llms.txt'));
});

test('buildSitemapXml includes core routes, 114 surahs, 604 Mushaf pages, and channel videos', () => {
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
