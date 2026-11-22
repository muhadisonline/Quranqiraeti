import { Component, ErrorInfo, ReactNode, useEffect, useMemo, useState } from 'react';
import { AboutChannelSection, VerseOfTheDaySection } from './components/ChannelStorySection';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { OfflineIndicator } from './components/OfflineIndicator';
import { QuickJumpModal } from './components/QuickJumpModal';
import { QuranJourneySection } from './components/QuranJourneySection';
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
  prioritizeFeaturedSurahs,
} from './lib/channel';
import { parseJsonSafely } from './lib/quranClient';
import { recordPageTelemetryEvent } from './lib/firebase';
import {
  getTelegramWebApp,
  initTelegramMiniApp,
  syncTelegramMiniAppTheme,
} from './lib/telegramWebApp';
import { AdminPage } from './pages/AdminPage';
import { ArabicAlphabetPage } from './pages/ArabicAlphabetPage';
import { MuhaffizPage } from './pages/MuhaffizPage';
import { PrayerTimesPage } from './pages/PrayerTimesPage';
import { QuranDirectoryPage } from './pages/QuranDirectoryPage';
import { QuranMushafPage } from './pages/QuranMushafPage';
import { QuranSurahPage } from './pages/QuranSurahPage';
import { ShortsPage } from './pages/ShortsPage';
import { VideoDetailPage } from './pages/VideoDetailPage';
import { ZikrPage } from './pages/ZikrPage';

function normalizeRoutePath(pathname: string): string {
  const pathOnly = pathname.split('#')[0].split('?')[0];
  if (!pathOnly || pathOnly === '/') return '/';
  const clean = pathOnly.replace(/\/+$/, '');
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
  const [routeSearch, setRouteSearch] = useState<string>(() => window.location.search || '');
  const [routeHash, setRouteHash] = useState<string>(() => window.location.hash || '');

  const [stats, setStats] = useState<ChannelStats>(DEFAULT_CHANNEL_STATS);
  const [longVideos, setLongVideos] = useState<RecitationVideo[]>(() =>
    prioritizeFeaturedSurahs(SEED_LONG_VIDEOS)
  );
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
  const [isQuickJumpOpen, setIsQuickJumpOpen] = useState<boolean>(false);

  useEffect(() => {
    function handleGlobalSearchShortcut(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickJumpOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleGlobalSearchShortcut);
    return () => window.removeEventListener('keydown', handleGlobalSearchShortcut);
  }, []);

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(normalizeRoutePath(window.location.pathname || '/'));
      setRouteSearch(window.location.search || '');
      setRouteHash(window.location.hash || '');
    }
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  function navigate(path: string) {
    const hashIdx = path.indexOf('#');
    const nextHash = hashIdx >= 0 ? path.slice(hashIdx) : '';
    const beforeHash = hashIdx >= 0 ? path.slice(0, hashIdx) : path;
    const qIdx = beforeHash.indexOf('?');
    const nextSearch = qIdx >= 0 ? beforeHash.slice(qIdx) : '';
    const normalized = normalizeRoutePath(beforeHash);
    const historyTarget = `${normalized}${nextSearch}${nextHash}`;
    if (normalized === currentPath && nextSearch === routeSearch && !nextHash) {
      setRouteHash('');
      window.history.pushState({}, '', `${normalized}${nextSearch}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', historyTarget);
    setCurrentPath(normalized);
    setRouteSearch(nextSearch);
    setRouteHash(nextHash);
    if (!nextHash) {
      window.scrollTo({ top: 0 });
    }
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    syncTelegramMiniAppTheme(isDark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // ignore storage errors
    }
  }, [isDark]);

  useEffect(() => {
    const miniApp = initTelegramMiniApp();
    if (!miniApp.active) return;
    if (
      miniApp.preferredColorScheme === 'dark' &&
      !localStorage.getItem(THEME_STORAGE_KEY)
    ) {
      setIsDark(true);
    }
    if (miniApp.startPath && miniApp.startPath !== '/' && currentPath === '/') {
      navigate(miniApp.startPath);
    }
    // Run once on initial Mini App launch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg?.BackButton) return;
    const handleBack = () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        navigate('/');
      }
    };
    if (currentPath !== '/') {
      tg.BackButton.show();
      tg.BackButton.onClick(handleBack);
    } else {
      tg.BackButton.hide();
    }
    return () => {
      tg.BackButton?.offClick?.(handleBack);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

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
            setLongVideos(prioritizeFeaturedSurahs(data.longVideos));
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
  const quranCuzMatch = currentPath.match(/^\/quran\/cuz\/(\d+)$/);
  const rawQuranCuzNumber = quranCuzMatch ? Number.parseInt(quranCuzMatch[1], 10) : undefined;
  const quranCuzNumber =
    rawQuranCuzNumber !== undefined && rawQuranCuzNumber >= 1 && rawQuranCuzNumber <= 30
      ? rawQuranCuzNumber
      : undefined;
  const quranSearchQuery = useMemo(
    () => new URLSearchParams(routeSearch).get('q')?.trim() || '',
    [routeSearch]
  );
  const quranTabParam = useMemo(() => {
    const raw = new URLSearchParams(routeSearch).get('tab')?.trim();
    if (
      raw === 'pages' ||
      raw === 'surahs' ||
      raw === 'rub' ||
      raw === 'search' ||
      raw === 'duas' ||
      raw === 'saved' ||
      raw === 'stats'
    ) {
      return raw;
    }
    return undefined;
  }, [routeSearch]);
  const muhaffizPageMatch = currentPath.match(/^\/(?:muhaffiz|ezber)(?:\/(\d+))?$/);
  const muhaffizInitialPage = muhaffizPageMatch?.[1]
    ? Number.parseInt(muhaffizPageMatch[1], 10)
    : undefined;
  const isMuhaffizRoute =
    Boolean(muhaffizPageMatch) &&
    (muhaffizInitialPage === undefined || (muhaffizInitialPage >= 1 && muhaffizInitialPage <= 604));

  const relatedForDetail = useMemo(() => {
    if (!detailVideo) return [];
    const pool = detailVideo.format === 'short' ? shorts : longVideos;
    return pool.filter((v) => v.videoId !== detailVideo.videoId).slice(0, 3);
  }, [detailVideo, longVideos, shorts]);

  return (
    <div className="min-h-screen flex flex-col">
      {!isMuhaffizRoute && (
        <TopBar
          currentPath={currentPath}
          subscribeUrl={stats.subscribeUrl}
          isDark={isDark}
          onNavigate={navigate}
          onOpenQuickSearch={() => setIsQuickJumpOpen(true)}
          onToggleTheme={() => setIsDark((prev) => !prev)}
        />
      )}

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
            activeHash={routeHash}
            onNavigate={navigate}
            onToggleSave={handleToggleSave}
          />
        ) : quranSurahNumber !== undefined ? (
          <QuranSurahPage
            surahNumber={quranSurahNumber}
            channelVideos={allVideos}
            activeHash={routeHash}
            isDark={isDark}
            onNavigate={navigate}
            onPlayVideo={setActiveVideo}
            onToggleTheme={() => setIsDark((prev) => !prev)}
          />
        ) : quranPageNumber !== undefined ? (
          <QuranMushafPage
            pageNumber={quranPageNumber}
            channelVideos={allVideos}
            activeHash={routeHash}
            isDark={isDark}
            onNavigate={navigate}
            onPlayVideo={setActiveVideo}
            onToggleTheme={() => setIsDark((prev) => !prev)}
          />
        ) : currentPath === '/quran' || quranCuzNumber !== undefined ? (
          <QuranDirectoryPage
            initialTab={quranTabParam ?? 'pages'}
            initialJuz={quranCuzNumber}
            initialSearchQuery={currentPath === '/quran' ? quranSearchQuery : undefined}
            isDark={isDark}
            onNavigate={navigate}
            onToggleTheme={() => setIsDark((prev) => !prev)}
          />
        ) : currentPath === '/dualar' ? (
          <QuranDirectoryPage
            initialTab="duas"
            isDark={isDark}
            onNavigate={navigate}
            onToggleTheme={() => setIsDark((prev) => !prev)}
          />
        ) : currentPath === '/namaz-vaxtlari' || currentPath === '/qible' || currentPath === '/teqvim' ? (
          <PrayerTimesPage
            isDark={isDark}
            initialSection={currentPath === '/teqvim' ? 'calendar' : undefined}
            onNavigate={navigate}
            onToggleTheme={() => setIsDark((prev) => !prev)}
          />
        ) : currentPath === '/zikr' ? (
          <ZikrPage
            isDark={isDark}
            onNavigate={navigate}
            onToggleTheme={() => setIsDark((prev) => !prev)}
          />
        ) : currentPath === '/elifba' ? (
          <ArabicAlphabetPage
            isDark={isDark}
            onNavigate={navigate}
            onToggleTheme={() => setIsDark((prev) => !prev)}
          />
        ) : isMuhaffizRoute ? (
          <MuhaffizPage
            initialPageNumber={muhaffizInitialPage}
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
            onNavigate={navigate}
            onToggleTheme={() => setIsDark((prev) => !prev)}
          />
        ) : currentPath === '/gunun-ayesi' ? (
          <>
            <SeoHead
              title="Günün Ayəsi və Təfəkkür | Quran Qiraeti"
              description="Seçilmiş Quran ayələri, ərəbcə mətn və Azərbaycan dilində mənaca tərcüməsi ilə gündəlik təfəkkür."
              path="/gunun-ayesi"
            />
            <VerseOfTheDaySection
              isDark={isDark}
              onToggleTheme={() => setIsDark((prev) => !prev)}
              onPlayVideoById={handlePlayById}
              onNavigate={navigate}
            />
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
        ) : currentPath === '/' ? (
          <>
            <SeoHead
              title="Quran Qiraeti — Uzun Tilavətlər, Shorts və Azərbaycan Tərcüməsi"
              description="Quran Qiraeti rəsmi arxivi. Tam surə uzun tilavətləri, Shorts qiraətləri, 114 surə və 604 səhifə Mədinə çapı Əlixan Musayev tərcüməsi ilə."
              path="/"
              jsonLd={[
                {
                  '@context': 'https://schema.org',
                  '@type': 'Organization',
                  name: 'Quran Qiraeti',
                  url: `${window.location.origin}/`,
                  logo: `${window.location.origin}/og-default.png`,
                  sameAs: [
                    'https://youtube.com/@quranqiraeti',
                    'https://www.youtube.com/channel/UCp9AvvdTxAXDZfnnVjNF1Yg',
                  ],
                  description: stats.description,
                },
                {
                  '@context': 'https://schema.org',
                  '@type': 'WebSite',
                  name: 'Quran Qiraeti',
                  url: `${window.location.origin}/`,
                  description: stats.description,
                  inLanguage: ['az', 'ar'],
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: `${window.location.origin}/quran?q={search_term_string}`,
                    'query-input': 'required name=search_term_string',
                  },
                },
              ]}
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
              asPageHeading
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
            <QuranJourneySection onNavigate={navigate} />
            <HeroSection
              stats={stats}
              featuredVideo={featuredLongVideo}
              longVideoCount={longVideos.length}
              shortsCount={shorts.length}
              onPlayFeatured={setActiveVideo}
              onNavigate={navigate}
            />
          </>
        ) : (
          <section className="py-20 lg:py-24" data-testid="not-found-page">
            <SeoHead
              title="Səhifə tapılmadı (404) | Quran Qiraeti"
              description="Axtardığınız səhifə tapılmadı. Qurani-Kərim və tilavət arxivinə qayıdın."
              path="/"
              robots="noindex, nofollow"
            />
            <div className="mx-auto max-w-2xl px-6 text-center">
              <p className="font-mono-tabular text-xs font-semibold tracking-widest text-[#0F4C3A] dark:text-[#86C7AE]">
                404 · SƏHİFƏ TAPILMADI
              </p>
              <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-100">
                Axtardığınız səhifə mövcud deyil
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                Ünvan səhv yazılmış ola bilər və ya səhifə köçürülüb. Aşağıdakı bölmələrdən davam edə bilərsiniz.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/');
                  }}
                  className="rounded-lg bg-[#0F4C3A] px-5 py-2.5 text-xs font-medium text-white hover:bg-[#0B3A2C] dark:bg-[#196B52]"
                >
                  Ana səhifəyə qayıt
                </a>
                <a
                  href="/quran"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/quran');
                  }}
                  className="rounded-lg border border-stone-200 bg-white px-5 py-2.5 text-xs font-medium text-stone-700 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
                >
                  Tam Qurani-Kərim
                </a>
                <a
                  href="/muhaffiz"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/muhaffiz');
                  }}
                  className="rounded-lg border border-stone-200 bg-white px-5 py-2.5 text-xs font-medium text-stone-700 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
                >
                  Mühafiz (Əzbər Mushafı)
                </a>
              </div>
            </div>
          </section>
        )}
      </main>

      {!isMuhaffizRoute && (
        <Footer stats={stats} longVideoCount={longVideos.length} onNavigate={navigate} />
      )}

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

      <QuickJumpModal
        isOpen={isQuickJumpOpen}
        videos={allVideos}
        onClose={() => setIsQuickJumpOpen(false)}
        onNavigate={navigate}
      />

      <OfflineIndicator />
    </div>
  );
}
