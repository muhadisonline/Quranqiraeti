import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuranMediaMetadataPayload, syncBrowserMediaSession } from './mediaSession';

test('buildQuranMediaMetadataPayload formats title, artist, album, and icon artwork', () => {
  const payload = buildQuranMediaMetadataPayload({
    title: 'Fatihə surəsi · 1:2',
    artist: 'Mişari Rəşid əl-Əfəsi',
    origin: 'https://quranqiraeti.az/',
  });

  assert.equal(payload.title, 'Fatihə surəsi · 1:2');
  assert.equal(payload.artist, 'Mişari Rəşid əl-Əfəsi');
  assert.equal(payload.album, 'Quran Qiraeti — Mədinə Mushafı');
  assert.equal(payload.artwork.length, 2);
  assert.equal(payload.artwork[0]?.src, 'https://quranqiraeti.az/icons/icon-192.png');
  assert.equal(payload.artwork[1]?.src, 'https://quranqiraeti.az/icons/icon-512.png');
});

test('syncBrowserMediaSession safely handles environments without navigator.mediaSession', () => {
  assert.doesNotThrow(() => {
    syncBrowserMediaSession({
      active: true,
      isPaused: false,
      metadata: {
        title: 'Bəqərə · 2:255',
        artist: 'Mahmud Xəlil əl-Husəri',
      },
      onPlay: () => {},
      onPause: () => {},
      onStop: () => {},
    });
    syncBrowserMediaSession({
      active: false,
      isPaused: false,
      metadata: null,
    });
  });
});
