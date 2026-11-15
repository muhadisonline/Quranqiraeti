import { Component, ErrorInfo, ReactNode, useEffect, useMemo, useState } from 'react';
import { AboutChannelSection, VerseOfTheDaySection } from './components/ChannelStorySection';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { RecitationArchive } from './components/RecitationArchive';
import { SeoHead } from './components/SeoHead';
import { SurahRequestSection } from './components/SurahRequestSection';
import { TheaterModal } from './components/TheaterModal';
import { TopBar } from './components/TopBar';
import {
  DEFAULT_CHANNEL_STATS,
  SEED_LONG_VIDEOS,
  SEED_SHORTS,
} from './data/recitations';
import {
  ChannelStats,
  FilterTab,
  RecitationVideo,
  SurahRequestRecord,
  filterRecitations,
} from './lib/channel';
import { parseJsonSafely } from './lib/quranClient';
import { recordPageTelemetryEvent } from './lib/firebase';
import { AdminPage } from './pages/AdminPage';
import { QuranDirectoryPage } from './pages/QuranDirectoryPage';
import { QuranMushafPage } from './pages/QuranMushafPage';
import { QuranSurahPage } from './pages/QuranSurahPage';
import { ShortsPage } from './pages/ShortsPage';
import { VideoDetailPage } from './pages/VideoDetailPage';

function normalizeRoutePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const clean = pathname.replace(/\/+$/, '');
  return clean || '/';
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] px-6 text-center text-[#17191C] dark:bg-[#0E1210] dark:text-[#F3F1EC]">
          <div className="max-w-md rounded-xl border border-stone-200 bg-white p-8 dark:border-stone-800 dark:bg-[#141916]">
            <h1 className="font-display text-2xl font-semibold">Səhifə yüklənərkən xəta baş verdi</h1>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              Zəhmət olmasa səhifəni yeniləyin və ya ana səhifəyə qayıdın.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
              }}
              className="mt-5 rounded-lg bg-[#0F4C3A] px-5 py-2.5 text-xs font-medium text-white"
            >
              Ana səhifəyə qayıt
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const SAVED_STORAGE_KEY = 'quranqiraeti_saved_ids_v1';
const THEME_STORAGE_KEY = 'quranqiraeti_theme_v1';

export default function App() {
  return (
    <AppErrorBoundary>
      <AppContent />
    </AppErrorBoundary>
  );
}

function AppContent() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return normalizeRoutePath(window.location.pathname || '/');
  });

  const [stats, setStats] = useState<ChannelStats>(DEFAULT_CHANNEL_STATS);
  const [longVideos, setLongVideos] = useState<RecitationVideo[]>(SEED_LONG_VIDEOS);
  const [shorts, setShorts] = useState<RecitationVideo[]>(SEED_SHORTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAll, setShowAll] = useState<boolean>(false);

  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
    } catch {
      return false;
    }
  });

  const [activeVideo, setActiveVideo] = useState<RecitationVideo | null>(null);
  const [requests, setRequests] = useState<SurahRequestRecord[]>([]);

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(normalizeRoutePath(window.location.pathname || '/'));
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function navigate(path: string) {
    const normalized = normalizeRoutePath(path);
    if (normalized === currentPath) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', normalized);
    setCurrentPath(normalized);
    window.scrollTo({ top: 0 });
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // ignore storage errors
    }
  }, [isDark]);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedIds));
    } catch {
      // ignore storage errors
    }
  }, [savedIds]);

  useEffect(() => {
    let cancelled = false;

    async function loadChannelAndRequests() {
      try {
        const [channelRes, reqRes] = await Promise.all([
          fetch('/api/channel'),
          fetch('/api/requests'),
        ]);

        const data = await parseJsonSafely<{
          stats?: ChannelStats;
          longVideos?: RecitationVideo[];
          shorts?: RecitationVideo[];
        }>(channelRes);

        if (!cancelled && data) {
          if (data.stats) setStats(data.stats);
          if (Array.isArray(data.longVideos) && data.longVideos.length > 0) {
            setLongVideos(data.longVideos);
          }
          if (Array.isArray(data.shorts) && data.shorts.length > 0) {
            setShorts(data.shorts);
          }
        }

        const reqData = await parseJsonSafely<{ requests?: SurahRequestRecord[] }>(reqRes);
        if (!cancelled && reqData && Array.isArray(reqData.requests)) {
          setRequests(reqData.requests);
        }
      } catch {
        // Keep deterministic seed fallback cleanly
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadChannelAndRequests();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const startMs = performance.now();
    const timer = setTimeout(() => {
      const elapsed = Math.max(12, Math.round(performance.now() - startMs));
      void recordPageTelemetryEvent({
        pathname: currentPath,
        loadTimeMs: elapsed,
        httpStatus: 200,
      });
    }, 180);
    return () => clearTimeout(timer);
  }, [currentPath]);

  const allVideos = useMemo(() => [...longVideos, ...shorts], [longVideos, shorts]);

  const filteredLongVideos = useMemo(
    () =>
      filterRecitations(longVideos, {
        tab: activeTab,
        query: searchQuery,
        savedIds,
      }),
    [longVideos, activeTab, searchQuery, savedIds]
  );

  const featuredLongVideo = longVideos[0] ?? SEED_LONG_VIDEOS[0];

  const modalPlaylist = useMemo(() => {
    if (!activeVideo) return longVideos;
    return activeVideo.format === 'short' ? shorts : filteredLongVideos;
  }, [activeVideo, filteredLongVideos, longVideos, shorts]);

  const activeModalIndex = useMemo(() => {
    if (!activeVideo) return -1;
    return modalPlaylist.findIndex((v) => v.videoId === activeVideo.videoId);
  }, [activeVideo, modalPlaylist]);

  function handleToggleSave(videoId: string) {
    setSavedIds((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId]
    );
  }

  function handlePlayById(videoId: string) {
    const match = allVideos.find((v) => v.videoId === videoId) ?? featuredLongVideo;
    setActiveVideo(match);
  }

  function handleResetFilters() {
    setActiveTab('all');
    setSearchQuery('');
    setShowAll(false);
  }

  const videoDetailMatch = currentPath.match(/^\/video\/([a-zA-Z0-9_-]+)$/);
  const detailVideoId = videoDetailMatch?.[1];
  const detailVideo = detailVideoId
    ? allVideos.find((v) => v.videoId === detailVideoId)
    : undefined;

  const quranSurahMatch = currentPath.match(/^\/quran\/(?:sure\/)?(\d+)$/);
  const quranSurahNumber = quranSurahMatch ? Number.parseInt(quranSurahMatch[1], 10) : undefined;
  const quranPageMatch = currentPath.match(/^\/quran\/sehife\/(\d+)$/);
  const quranPageNumber = quranPageMatch ? Number.parseInt(quranPageMatch[1], 10) : undefined;

  const relatedForDetail = useMemo(() => {
    if (!detailVideo) return [];
    const pool = detailVideo.format === 'short' ? shorts : longVideos;
    return pool.filter((v) => v.videoId !== detailVideo.videoId).slice(0, 3);
  }, [detailVideo, longVideos, shorts]);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        currentPath={currentPath}
        subscribeUrl={stats.subscribeUrl}
        onNavigate={navigate}
      />

      <main className="flex-1">
        {currentPath === '/admin' ? (
          <AdminPage
            isDark={isDark}
            onNavigate={navigate}
            onToggleTheme={() => setIsDark((prev) => !prev)}
          />
        ) : detailVideoId ? (
          <VideoDetailPage
            video={detailVideo}
            relatedVideos={relatedForDetail}
            isSaved={detailVideo ? savedIds.includes(detailVideo.videoId) : false}
            isChannelLoading={isLoading}
            onNavigate={navigate}
            onToggleSave={handleToggleSave}
          />
        ) : quranSurahNumber !== undefined ? (
          <QuranSurahPage
            surahNumber={quranSurahNumber}
            channelVideos={allVideos}
            onNavigate={navigate}
            onPlayVideo={setActiveVideo}
          />
        ) : quranPageNumber !== undefined ? (
          <QuranMushafPage
            pageNumber={quranPageNumber}
            onNavigate={navigate}
          />
        ) : currentPath === '/quran' ? (
          <QuranDirectoryPage
            isDark={isDark}
            onNavigate={navigate}
            onToggleTheme={() => setIsDark((prev) => !prev)}
          />
        ) : currentPath === '/shorts' ? (
          <ShortsPage
            shorts={shorts}
            savedIds={savedIds}
            isLoading={isLoading}
            isDark={isDark}
            onPlay={setActiveVideo}
            onToggleSave={handleToggleSave}
            onOpenDetail={(id) => navigate(`/video/${id}`)}
            onToggleTheme={() => setIsDark((prev) => !prev)}
          />
        ) : currentPath === '/gunun-ayesi' ? (
          <>
            <SeoHead
              title="Günün Ayəsi və Təfəkkür | Quran Qiraeti"
              description="Seçilmiş Quran ayələri, ərəbcə mətn və Azərbaycan dilində mənaca tərcüməsi ilə gündəlik təfəkkür."
              path="/gunun-ayesi"
            />
            <VerseOfTheDaySection onPlayVideoById={handlePlayById} />
          </>
        ) : currentPath === '/haqqinda' ? (
          <>
            <SeoHead
              title="Kanal Haqqında | Quran Qiraeti"
              description="Quran Qiraeti YouTube kanalının məqsədi, tərcümə prinsipləri və seçilmiş qarilər haqqında məlumat."
              path="/haqqinda"
            />
            <AboutChannelSection />
          </>
        ) : currentPath === '/istek' ? (
          <>
            <SeoHead
              title="Surə İstəyi Göndər | Quran Qiraeti"
              description="Quran Qiraeti kanalında növbəti yayımlanmasını istədiyiniz surəni və qarini təklif edin."
              path="/istek"
            />
            <SurahRequestSection
              requests={requests}
              onSubmitted={(newReq) => setRequests((prev) => [newReq, ...prev])}
            />
          </>
        ) : (
          <>
            <SeoHead
              title="Quran Qiraeti — Uzun Tilavətlər və Azərbaycan Tərcüməsi"
              description="Quran Qiraeti rəsmi arxivi. Tam surə uzun tilavətləri, Azərbaycan dilində mənaca tərcümələr və Shorts arxivi."
              path="/"
              jsonLd={{
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'Quran Qiraeti',
                url: window.location.origin,
                description: stats.description,
                inLanguage: 'az',
              }}
            />
            <HeroSection
              stats={stats}
              featuredVideo={featuredLongVideo}
              longVideoCount={longVideos.length}
              shortsCount={shorts.length}
              onPlayFeatured={setActiveVideo}
              onNavigate={navigate}
            />
            <RecitationArchive
              videos={longVideos}
              filteredVideos={filteredLongVideos}
              activeTab={activeTab}
              searchQuery={searchQuery}
              savedIds={savedIds}
              isLoading={isLoading}
              isDark={isDark}
              showAll={showAll}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setShowAll(false);
              }}
              onSearchChange={(q) => {
                setSearchQuery(q);
                setShowAll(false);
              }}
              onToggleSave={handleToggleSave}
              onPlay={setActiveVideo}
              onOpenDetail={(id) => navigate(`/video/${id}`)}
              onToggleTheme={() => setIsDark((prev) => !prev)}
              onToggleShowAll={() => setShowAll((prev) => !prev)}
              onResetFilters={handleResetFilters}
            />
          </>
        )}
      </main>

      <Footer stats={stats} onNavigate={navigate} />

      <TheaterModal
        video={activeVideo}
        isSaved={activeVideo ? savedIds.includes(activeVideo.videoId) : false}
        hasPrev={activeModalIndex > 0}
        hasNext={activeModalIndex >= 0 && activeModalIndex < modalPlaylist.length - 1}
        onClose={() => setActiveVideo(null)}
        onPrev={() => {
          if (activeModalIndex > 0) {
            setActiveVideo(modalPlaylist[activeModalIndex - 1]);
          }
        }}
        onNext={() => {
          if (activeModalIndex >= 0 && activeModalIndex < modalPlaylist.length - 1) {
            setActiveVideo(modalPlaylist[activeModalIndex + 1]);
          }
        }}
        onToggleSave={handleToggleSave}
      />
    </div>
  );
}
