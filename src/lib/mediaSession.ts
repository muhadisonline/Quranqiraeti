export interface QuranMediaMetadataInput {
  title: string;
  artist: string;
  album?: string;
  origin?: string;
}

export interface QuranMediaMetadataPayload {
  title: string;
  artist: string;
  album: string;
  artwork: Array<{ src: string; sizes: string; type: string }>;
}

export function buildQuranMediaMetadataPayload(
  input: QuranMediaMetadataInput
): QuranMediaMetadataPayload {
  const base = input.origin?.replace(/\/+$/, '') || '';
  return {
    title: input.title.trim() || 'Quran Qiraeti',
    artist: input.artist.trim() || 'Quran Tilavəti',
    album: input.album?.trim() || 'Quran Qiraeti — Mədinə Mushafı',
    artwork: [
      {
        src: base ? `${base}/icons/icon-192.png` : '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: base ? `${base}/icons/icon-512.png` : '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

export interface SyncMediaSessionOptions {
  active: boolean;
  isPaused: boolean;
  metadata: QuranMediaMetadataInput | null;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function syncBrowserMediaSession(options: SyncMediaSessionOptions): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }
  const session = navigator.mediaSession;
  if (!session) return;

  if (!options.active || !options.metadata) {
    try {
      session.playbackState = 'none';
      session.metadata = null;
      const actions: MediaSessionAction[] = [
        'play',
        'pause',
        'stop',
        'previoustrack',
        'nexttrack',
      ];
      for (const action of actions) {
        try {
          session.setActionHandler(action, null);
        } catch {
          // ignore unsupported action handlers
        }
      }
    } catch {
      // ignore mediaSession cleanup errors
    }
    return;
  }

  try {
    const origin =
      typeof window !== 'undefined' && window.location ? window.location.origin : '';
    const payload = buildQuranMediaMetadataPayload({
      ...options.metadata,
      origin,
    });
    if (typeof MediaMetadata !== 'undefined') {
      session.metadata = new MediaMetadata(payload);
    }
    session.playbackState = options.isPaused ? 'paused' : 'playing';
  } catch {
    // ignore metadata assignment errors
  }

  const handlerPairs: Array<[MediaSessionAction, (() => void) | undefined]> = [
    ['play', options.onPlay],
    ['pause', options.onPause],
    ['stop', options.onStop],
    ['previoustrack', options.onPrev],
    ['nexttrack', options.onNext],
  ];

  for (const [action, handler] of handlerPairs) {
    try {
      session.setActionHandler(action, handler ?? null);
    } catch {
      // ignore unsupported action handlers in older browsers
    }
  }
}
