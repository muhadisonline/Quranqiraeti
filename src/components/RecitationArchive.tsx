import { Moon, Search, Sun, X } from 'lucide-react';
import { FilterTab, RecitationVideo } from '../lib/channel';
import { RecitationCard } from './RecitationCard';

interface RecitationArchiveProps {
  videos: RecitationVideo[];
  filteredVideos: RecitationVideo[];
  activeTab: FilterTab;
  searchQuery: string;
  savedIds: string[];
  isLoading: boolean;
  isDark: boolean;
  showAll: boolean;
  asPageHeading?: boolean;
  onTabChange: (tab: FilterTab) => void;
  onSearchChange: (query: string) => void;
  onToggleSave: (videoId: string) => void;
  onPlay: (video: RecitationVideo) => void;
  onOpenDetail: (videoId: string) => void;
  onToggleTheme: () => void;
  onToggleShowAll: () => void;
  onResetFilters: () => void;
}

export function RecitationArchive({
  videos,
  filteredVideos,
  activeTab,
  searchQuery,
  savedIds,
  isLoading,
  isDark,
  showAll,
  asPageHeading = false,
  onTabChange,
  onSearchChange,
  onToggleSave,
  onPlay,
  onOpenDetail,
  onToggleTheme,
  onToggleShowAll,
  onResetFilters,
}: RecitationArchiveProps) {
  const tabs: Array<{ id: FilterTab; label: string }> = [
    { id: 'all', label: 'Hamısı' },
    { id: 'secilmis', label: 'Seçilmiş Qiraətlər' },
    { id: 'saved', label: `Saxlanılanlar (${savedIds.length})` },
  ];

  const visibleVideos = showAll ? filteredVideos : filteredVideos.slice(0, 9);
  const HeadingTag = asPageHeading ? 'h1' : 'h2';

  return (
    <section
      id="qiraetler"
      className={`border-b border-stone-200/80 dark:border-stone-800/80 ${
        asPageHeading ? 'pt-8 pb-14 lg:pt-10 lg:pb-16' : 'py-16 lg:py-20'
      }`}
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Heading & Theme Utility */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-widest text-stone-500 dark:text-stone-400">
              Quran Qiraeti · Surələr Arxivi
            </p>
            <HeadingTag className="font-display mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl text-balance dark:text-stone-100">
              Tam surələr və tilavətlər
            </HeadingTag>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Gündüz oxu rejiminə keç' : 'Gecə oxu rejiminə keç'}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-stone-300 hover:text-stone-900 dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200 dark:hover:border-stone-600 min-h-[40px]"
          >
            {isDark ? (
              <>
                <Sun className="h-4 w-4 text-[#C6A769]" aria-hidden="true" />
                <span>Gündüz rejimi</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-[#0F4C3A]" aria-hidden="true" />
                <span>Gecə rejimi</span>
              </>
            )}
          </button>
        </div>

        {/* Search & Segmented Filter Toolbar */}
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="Surə kateqoriyaları"
            className="flex flex-wrap items-center gap-1 rounded-lg bg-[#F1EFE9] p-1 dark:bg-[#181E1B]"
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => onTabChange(tab.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 min-h-[34px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C3A] ${
                    active
                      ? 'bg-white text-stone-900 shadow-xs dark:bg-[#242D28] dark:text-stone-100'
                      : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-80">
            <label htmlFor="recitation-search" className="sr-only">
              Surə və ya qari axtar
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              id="recitation-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Surə və ya qari axtar (Loqman, Kəhf)"
              className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pr-9 pl-10 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-[#86C7AE]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Axtarışı təmizlə"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 text-xs text-stone-500 dark:text-stone-400">
          {isLoading
            ? 'Uzun tilavətlər yüklənir...'
            : `${videos.length} uzun videodan ${filteredVideos.length} tilavət göstərilir`}
        </p>

        {isLoading ? (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="h-80 animate-pulse rounded-xl border border-stone-200 bg-stone-100/80 dark:border-stone-800 dark:bg-stone-900/60"
              />
            ))}
          </div>
        ) : visibleVideos.length > 0 ? (
          <>
            <div
              data-testid="recitation-grid"
              className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {visibleVideos.map((video) => (
                <RecitationCard
                  key={video.videoId}
                  video={video}
                  isSaved={savedIds.includes(video.videoId)}
                  onPlay={onPlay}
                  onToggleSave={onToggleSave}
                  onOpenDetail={onOpenDetail}
                />
              ))}
            </div>

            {filteredVideos.length > 9 && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={onToggleShowAll}
                  className="rounded-lg border border-stone-300 bg-white px-6 py-2.5 text-sm font-medium text-stone-800 whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200 dark:hover:border-[#86C7AE] dark:hover:text-[#86C7AE] min-h-[44px]"
                >
                  {showAll
                    ? 'Daha az göstər'
                    : `Bütün uzun videoları göstər (${filteredVideos.length})`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-8 rounded-xl border border-stone-200 bg-[#F3F1EC] px-6 py-12 text-center dark:border-stone-800 dark:bg-[#141916]">
            <p className="font-display text-2xl font-medium text-stone-900 dark:text-stone-100">
              {activeTab === 'saved'
                ? 'Hələ saxlanılmış tilavət yoxdur'
                : 'Axtarışınıza uyğun uzun video tapılmadı'}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-stone-600 dark:text-stone-400">
              {activeTab === 'saved'
                ? 'İstənilən surə kartının sağ altındakı əlfəcin işarəsinə toxunaraq bəyəndiyiniz qiraətləri burada toplaya bilərsiniz.'
                : 'Başqa surə adı (məsələn, Bəqərə, Muminun, Kəhf) yoxlayın və ya filtri sıfırlayın.'}
            </p>
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-[#0F4C3A] px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#0B3A2C] dark:bg-[#196B52]"
            >
              Bütün uzun videolara qayıt
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
