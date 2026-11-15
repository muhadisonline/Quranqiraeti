export type ConnectedPageKey =
  | 'home'
  | 'shorts'
  | 'quran'
  | 'surah'
  | 'mushaf_page'
  | 'video'
  | 'verse_of_day'
  | 'about'
  | 'request';

export type TelemetryStatus = 'ok' | 'slow' | 'error';
export type HealthStatus = 'ok' | 'degraded' | 'down';
export type TimeWindowGranularity = 'hourly' | 'daily' | 'weekly';
export type ReferrerType = 'direct' | 'internal' | 'search' | 'youtube' | 'other';

export interface ConnectedPageDefinition {
  pageKey: ConnectedPageKey;
  label: string;
  routePattern: string;
  probeUrl: string;
  description: string;
}

export const CONNECTED_PAGES: ConnectedPageDefinition[] = [
  {
    pageKey: 'home',
    label: 'Uzun Videolar (Ana səhifə)',
    routePattern: '/',
    probeUrl: '/',
    description: 'Əsas səhifə, hero və uzun Quran tilavətləri arxivi',
  },
  {
    pageKey: 'shorts',
    label: 'Shorts Bölməsi',
    routePattern: '/shorts',
    probeUrl: '/shorts',
    description: 'Kanalın bütün qısa Quran tilavətləri və SEO arxivi',
  },
  {
    pageKey: 'quran',
    label: 'Tam Qurani-Kərim',
    routePattern: '/quran',
    probeUrl: '/quran',
    description: '114 surə və 604 Mushaf səhifəsinin ümumi kataloqu',
  },
  {
    pageKey: 'surah',
    label: 'Surə Oxu Səhifəsi',
    routePattern: '/quran/sure/:surahNumber',
    probeUrl: '/api/quran/surah/36',
    description: 'Seçilmiş surənin ərəbcə mətni və Əlixan Musayev tərcüməsi',
  },
  {
    pageKey: 'mushaf_page',
    label: 'Mushaf Səhifəsi (1–604)',
    routePattern: '/quran/sehife/:pageNumber',
    probeUrl: '/api/quran/page/1',
    description: '604 Mushaf səhifəsi üzrə ayə-ayə oxu görünüşü',
  },
  {
    pageKey: 'video',
    label: 'Video Ətraflı & Tərcümə',
    routePattern: '/video/:videoId',
    probeUrl: '/api/channel',
    description: 'Hər videonun ayrıca səhifəsi, video pleyer və tərcümə mətni',
  },
  {
    pageKey: 'verse_of_day',
    label: 'Günün Ayəsi',
    routePattern: '/gunun-ayesi',
    probeUrl: '/gunun-ayesi',
    description: 'Gündəlik seçilmiş ayə, ərəbcə mətn və təfəkkür izahı',
  },
  {
    pageKey: 'about',
    label: 'Kanal Haqqında',
    routePattern: '/haqqinda',
    probeUrl: '/haqqinda',
    description: 'Quran Qiraeti kanalının missiyası və təqdimat prinsipləri',
  },
  {
    pageKey: 'request',
    label: 'Surə İstəyi',
    routePattern: '/istek',
    probeUrl: '/api/requests',
    description: 'Dinləyicilər üçün surə və qari təklifi formu',
  },
];

export interface PageTelemetryEventRecord {
  eventId: string;
  pageKey: ConnectedPageKey;
  pageLabel: string;
  path: string;
  status: TelemetryStatus;
  httpStatus: number;
  loadTimeMs: number;
  sessionId: string;
  referrerType: ReferrerType;
  createdAtMs: number;
}

export interface PageHealthSnapshot {
  pageKey: ConnectedPageKey;
  label: string;
  routePattern: string;
  status: HealthStatus;
  statusNote: string;
  lastLatencyMs: number;
  lastCheckedAtMs: number;
  checkedByUid: string;
}

export interface TelemetryBucket {
  key: string;
  label: string;
  visits: number;
  uniqueSessions: number;
  okCount: number;
  slowCount: number;
  errorCount: number;
  avgLoadTimeMs: number;
}

export interface ConnectedPageStatsRow {
  pageKey: ConnectedPageKey;
  label: string;
  routePattern: string;
  totalVisits: number;
  hourlyVisits: number;
  dailyVisits: number;
  weeklyVisits: number;
  uniqueSessions: number;
  avgLoadTimeMs: number;
  okCount: number;
  slowCount: number;
  errorCount: number;
  operationalStatus: 'Aktiv' | 'Yavaş' | 'Xətalı' | 'Gözləmədə';
  lastSeenAtMs: number | null;
}

export interface ReferrerBreakdownItem {
  referrerType: ReferrerType;
  label: string;
  count: number;
  sharePct: number;
}

export interface AggregatedAnalyticsSummary {
  granularity: TimeWindowGranularity;
  windowLabel: string;
  totalVisits: number;
  uniqueSessions: number;
  avgLoadTimeMs: number;
  healthyRatePct: number;
  okCount: number;
  slowCount: number;
  errorCount: number;
  buckets: TelemetryBucket[];
  pageRows: ConnectedPageStatsRow[];
  referrerBreakdown: ReferrerBreakdownItem[];
  recentEvents: PageTelemetryEventRecord[];
}

export function resolvePageTelemetryMeta(pathname: string): {
  pageKey: ConnectedPageKey;
  pageLabel: string;
  cleanPath: string;
} | null {
  const clean = (pathname || '/').split('?')[0].replace(/\/+$/, '') || '/';

  if (clean === '/admin' || clean.startsWith('/admin/')) {
    return null;
  }
  if (clean === '/') {
    return { pageKey: 'home', pageLabel: 'Uzun Videolar (Ana səhifə)', cleanPath: '/' };
  }
  if (clean === '/shorts') {
    return { pageKey: 'shorts', pageLabel: 'Shorts Bölməsi', cleanPath: '/shorts' };
  }
  if (clean === '/quran') {
    return { pageKey: 'quran', pageLabel: 'Tam Qurani-Kərim', cleanPath: '/quran' };
  }
  if (/^\/quran\/(?:sure\/)?\d+$/.test(clean)) {
    return { pageKey: 'surah', pageLabel: 'Surə Oxu Səhifəsi', cleanPath: clean };
  }
  if (/^\/quran\/sehife\/\d+$/.test(clean)) {
    return { pageKey: 'mushaf_page', pageLabel: 'Mushaf Səhifəsi (1–604)', cleanPath: clean };
  }
  if (/^\/video\/[a-zA-Z0-9_-]+$/.test(clean)) {
    return { pageKey: 'video', pageLabel: 'Video Ətraflı & Tərcümə', cleanPath: clean };
  }
  if (clean === '/gunun-ayesi') {
    return { pageKey: 'verse_of_day', pageLabel: 'Günün Ayəsi', cleanPath: '/gunun-ayesi' };
  }
  if (clean === '/haqqinda') {
    return { pageKey: 'about', pageLabel: 'Kanal Haqqında', cleanPath: '/haqqinda' };
  }
  if (clean === '/istek') {
    return { pageKey: 'request', pageLabel: 'Surə İstəyi', cleanPath: '/istek' };
  }

  return { pageKey: 'home', pageLabel: 'Uzun Videolar (Ana səhifə)', cleanPath: clean };
}

export function normalizeReferrerType(referrer: string, currentOrigin: string): ReferrerType {
  const trimmed = (referrer || '').trim();
  if (!trimmed) return 'direct';
  try {
    const refUrl = new URL(trimmed);
    const curUrl = currentOrigin ? new URL(currentOrigin) : null;
    if (curUrl && refUrl.host === curUrl.host) return 'internal';
    const host = refUrl.hostname.toLowerCase();
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
    if (
      host.includes('google.') ||
      host.includes('bing.com') ||
      host.includes('yandex.') ||
      host.includes('duckduckgo.com') ||
      host.includes('perplexity.ai') ||
      host.includes('chatgpt.com') ||
      host.includes('claude.ai')
    ) {
      return 'search';
    }
    return 'other';
  } catch {
    return 'other';
  }
}

const SHORT_AZ_MONTHS = [
  'Yan',
  'Fev',
  'Mar',
  'Apr',
  'May',
  'İyn',
  'İyl',
  'Avq',
  'Sen',
  'Okt',
  'Noy',
  'Dek',
];

const REFERRER_LABELS: Record<ReferrerType, string> = {
  direct: 'Birbaşa keçid',
  internal: 'Saytdaxili naviqasiya',
  search: 'Axtarış / AI sistemləri',
  youtube: 'YouTube kanalı',
  other: 'Digər mənbələr',
};

function startOfUtcHour(ms: number): number {
  const d = new Date(ms);
  d.setUTCMinutes(0, 0, 0);
  return d.getTime();
}

function startOfUtcDay(ms: number): number {
  const d = new Date(ms);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfUtcWeekMonday(ms: number): number {
  const d = new Date(startOfUtcDay(ms));
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.getTime();
}

function formatHourBucketLabel(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:00`;
}

function formatDayBucketLabel(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, '0')} ${SHORT_AZ_MONTHS[d.getMonth()]}`;
}

export function getWindowStartMs(granularity: TimeWindowGranularity, nowMs: number): number {
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;
  if (granularity === 'hourly') {
    return startOfUtcHour(nowMs) - 23 * hourMs;
  }
  if (granularity === 'daily') {
    return startOfUtcDay(nowMs) - 13 * dayMs;
  }
  return startOfUtcWeekMonday(nowMs) - 7 * 7 * dayMs;
}

export function aggregateTelemetry(
  events: PageTelemetryEventRecord[],
  granularity: TimeWindowGranularity,
  nowMs = Date.now(),
  selectedPageKey: ConnectedPageKey | 'all' = 'all'
): AggregatedAnalyticsSummary {
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;
  const weekMs = 7 * dayMs;

  const hourlyCutoff = nowMs - 24 * hourMs;
  const dailyCutoff = nowMs - 24 * hourMs;
  const last24hCutoff = nowMs - dayMs;
  const last7dCutoff = nowMs - weekMs;

  const windowStartMs = getWindowStartMs(granularity, nowMs);

  const filteredByPage =
    selectedPageKey === 'all'
      ? events
      : events.filter((event) => event.pageKey === selectedPageKey);

  const windowEvents = filteredByPage.filter(
    (event) => event.createdAtMs >= windowStartMs && event.createdAtMs <= nowMs + 60_000
  );

  // Build time buckets cleanly
  const bucketDefs: Array<{ key: string; label: string; startMs: number; endMs: number }> = [];
  if (granularity === 'hourly') {
    const firstHour = startOfUtcHour(nowMs) - 23 * hourMs;
    for (let i = 0; i < 24; i++) {
      const start = firstHour + i * hourMs;
      bucketDefs.push({
        key: `h-${start}`,
        label: formatHourBucketLabel(start),
        startMs: start,
        endMs: start + hourMs,
      });
    }
  } else if (granularity === 'daily') {
    const firstDay = startOfUtcDay(nowMs) - 13 * dayMs;
    for (let i = 0; i < 14; i++) {
      const start = firstDay + i * dayMs;
      bucketDefs.push({
        key: `d-${start}`,
        label: formatDayBucketLabel(start),
        startMs: start,
        endMs: start + dayMs,
      });
    }
  } else {
    const firstWeek = startOfUtcWeekMonday(nowMs) - 7 * weekMs;
    for (let i = 0; i < 8; i++) {
      const start = firstWeek + i * weekMs;
      bucketDefs.push({
        key: `w-${start}`,
        label: i === 7 ? 'Bu həftə' : formatDayBucketLabel(start),
        startMs: start,
        endMs: start + weekMs,
      });
    }
  }

  const buckets: TelemetryBucket[] = bucketDefs.map((def) => {
    const matching = windowEvents.filter(
      (ev) => ev.createdAtMs >= def.startMs && ev.createdAtMs < def.endMs
    );
    const sessions = new Set(matching.map((ev) => ev.sessionId));
    const okCount = matching.filter((ev) => ev.status === 'ok').length;
    const slowCount = matching.filter((ev) => ev.status === 'slow').length;
    const errorCount = matching.filter((ev) => ev.status === 'error').length;
    const avgLoadTimeMs =
      matching.length > 0
        ? Math.round(matching.reduce((acc, ev) => acc + ev.loadTimeMs, 0) / matching.length)
        : 0;
    return {
      key: def.key,
      label: def.label,
      visits: matching.length,
      uniqueSessions: sessions.size,
      okCount,
      slowCount,
      errorCount,
      avgLoadTimeMs,
    };
  });

  // All 9 connected pages status breakdown across Hourly / Daily / Weekly
  const pageRows: ConnectedPageStatsRow[] = CONNECTED_PAGES.map((pageDef) => {
    const pageEventsAll = events.filter((ev) => ev.pageKey === pageDef.pageKey);
    const pageWindowEvents = pageEventsAll.filter((ev) => ev.createdAtMs >= windowStartMs);

    const hourlyVisits = pageEventsAll.filter((ev) => ev.createdAtMs >= nowMs - hourMs).length;
    const dailyVisits = pageEventsAll.filter(
      (ev) => ev.createdAtMs >= Math.min(last24hCutoff, Math.max(hourlyCutoff, dailyCutoff))
    ).length;
    const weeklyVisits = pageEventsAll.filter((ev) => ev.createdAtMs >= last7dCutoff).length;

    const sessions = new Set(pageWindowEvents.map((ev) => ev.sessionId));
    const okCount = pageWindowEvents.filter((ev) => ev.status === 'ok').length;
    const slowCount = pageWindowEvents.filter((ev) => ev.status === 'slow').length;
    const errorCount = pageWindowEvents.filter((ev) => ev.status === 'error').length;
    const avgLoadTimeMs =
      pageWindowEvents.length > 0
        ? Math.round(
            pageWindowEvents.reduce((acc, ev) => acc + ev.loadTimeMs, 0) / pageWindowEvents.length
          )
        : 0;

    const sortedPage = [...pageEventsAll].sort((a, b) => b.createdAtMs - a.createdAtMs);
    const latest = sortedPage[0];
    let operationalStatus: ConnectedPageStatsRow['operationalStatus'] = 'Gözləmədə';
    if (latest) {
      if (latest.status === 'error' || errorCount > Math.max(2, pageWindowEvents.length * 0.25)) {
        operationalStatus = 'Xətalı';
      } else if (latest.status === 'slow' || avgLoadTimeMs > 2500) {
        operationalStatus = 'Yavaş';
      } else {
        operationalStatus = 'Aktiv';
      }
    }

    return {
      pageKey: pageDef.pageKey,
      label: pageDef.label,
      routePattern: pageDef.routePattern,
      totalVisits: pageWindowEvents.length,
      hourlyVisits,
      dailyVisits,
      weeklyVisits,
      uniqueSessions: sessions.size,
      avgLoadTimeMs,
      okCount,
      slowCount,
      errorCount,
      operationalStatus,
      lastSeenAtMs: latest ? latest.createdAtMs : null,
    };
  });

  const totalVisits = windowEvents.length;
  const uniqueSessions = new Set(windowEvents.map((ev) => ev.sessionId)).size;
  const okCount = windowEvents.filter((ev) => ev.status === 'ok').length;
  const slowCount = windowEvents.filter((ev) => ev.status === 'slow').length;
  const errorCount = windowEvents.filter((ev) => ev.status === 'error').length;
  const avgLoadTimeMs =
    totalVisits > 0
      ? Math.round(windowEvents.reduce((acc, ev) => acc + ev.loadTimeMs, 0) / totalVisits)
      : 0;
  const healthyRatePct =
    totalVisits > 0 ? Math.round(((okCount + slowCount) / totalVisits) * 1000) / 10 : 100;

  const refCounts = new Map<ReferrerType, number>();
  for (const ev of windowEvents) {
    refCounts.set(ev.referrerType, (refCounts.get(ev.referrerType) ?? 0) + 1);
  }
  const referrerBreakdown: ReferrerBreakdownItem[] = (
    ['direct', 'internal', 'search', 'youtube', 'other'] as ReferrerType[]
  )
    .map((type) => {
      const count = refCounts.get(type) ?? 0;
      return {
        referrerType: type,
        label: REFERRER_LABELS[type],
        count,
        sharePct: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0,
      };
    })
    .sort((a, b) => b.count - a.count);

  const windowLabel =
    granularity === 'hourly'
      ? 'Son 24 saat (Saatlıq bölgü)'
      : granularity === 'daily'
        ? 'Son 14 gün (Günlük bölgü)'
        : 'Son 8 həftə (Həftəlik bölgü)';

  const recentEvents = [...filteredByPage]
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .slice(0, 25);

  return {
    granularity,
    windowLabel,
    totalVisits,
    uniqueSessions,
    avgLoadTimeMs,
    healthyRatePct,
    okCount,
    slowCount,
    errorCount,
    buckets,
    pageRows,
    referrerBreakdown,
    recentEvents,
  };
}

export function formatMsDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} san`;
}

export function formatShortTimestampAz(ms: number | null): string {
  if (!ms) return 'Hələ yoxdur';
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, '0')} ${SHORT_AZ_MONTHS[d.getMonth()]} ${String(
    d.getHours()
  ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
