import { ArrowRight, BookOpen, Play } from 'lucide-react';
import { useState } from 'react';
import heroManuscriptImage from '../assets/images/hero_quran_manuscript_1794730601154.jpg';
import { useLastRead, useSavedAyahs } from '../hooks/useReaderPreferences';
import { ChannelStats, RecitationVideo } from '../lib/channel';

interface HeroSectionProps {
  stats: ChannelStats;
  featuredVideo: RecitationVideo;
  longVideoCount: number;
  shortsCount: number;
  onPlayFeatured: (video: RecitationVideo) => void;
  onNavigate: (path: string) => void;
}

const HERO_IMAGE_PATH = heroManuscriptImage;

export function HeroSection({
  stats,
  featuredVideo,
  longVideoCount: _longVideoCount,
  shortsCount,
  onPlayFeatured,
  onNavigate,
}: HeroSectionProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const lastRead = useLastRead();
  const { savedAyahs } = useSavedAyahs();

  return (
    <section className="border-b border-stone-200/80 dark:border-stone-800/80">
      <div className="mx-auto max-w-6xl px-6 pt-12 pb-14 lg:pt-16 lg:pb-16">
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Editorial Column */}
          <div className="flex flex-col justify-between lg:col-span-6">
            <div>
              <p className="text-xs font-medium tracking-widest text-stone-500 dark:text-stone-400">
                {stats.handle} · Uzun Tilavətlər Arxivi
              </p>

              <h1 className="font-display mt-5 text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.08] font-semibold tracking-tight text-stone-900 text-balance dark:text-stone-100">
                Quran Qiraeti
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-stone-600 dark:text-stone-300">
                {stats.description}
              </p>
            </div>

            <div className="mt-8 space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-5">
                <button
                  type="button"
                  onClick={() => onPlayFeatured(featuredVideo)}
                  className="inline-flex items-center gap-2.5 rounded-lg bg-[#0F4C3A] px-5 py-3 text-sm font-medium text-white whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-[#0B3A2C] dark:bg-[#196B52] dark:hover:bg-[#1E7F61] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C3A] focus-visible:ring-offset-2 min-h-[44px]"
                >
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  <span>
                    Dinlə: {featuredVideo.surahName} ({featuredVideo.duration})
                  </span>
                </button>

                <a
                  href="/shorts"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/shorts');
                  }}
                  className="inline-flex items-center gap-1.5 py-2 text-sm font-medium text-stone-700 underline decoration-stone-300 underline-offset-4 transition-colors duration-150 hover:text-[#0F4C3A] hover:decoration-[#0F4C3A] dark:text-stone-300 dark:decoration-stone-700 dark:hover:text-[#86C7AE] whitespace-nowrap shrink-0 min-h-[44px]"
                >
                  <span>Shorts bölməsinə keçid ({shortsCount})</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>

              <div
                data-testid="hero-quick-links"
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-stone-200/80 pt-3.5 text-xs text-stone-500 dark:border-stone-800/80 dark:text-stone-400"
              >
                <a
                  href="/quran"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/quran');
                  }}
                  className="inline-flex items-center gap-1.5 font-medium text-stone-700 hover:text-[#0F4C3A] dark:text-stone-300 dark:hover:text-[#86C7AE]"
                >
                  <BookOpen className="h-3.5 w-3.5 text-[#0F4C3A] dark:text-[#86C7AE]" aria-hidden="true" />
                  <span>Tam Qurani-Kərim (114 surə)</span>
                </a>
                <span aria-hidden="true">·</span>
                <a
                  href="/muhaffiz"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/muhaffiz');
                  }}
                  className="font-medium text-stone-700 hover:text-[#0F4C3A] dark:text-stone-300 dark:hover:text-[#86C7AE]"
                >
                  Mühafiz (Əzbər Mushafı)
                </a>
                <span aria-hidden="true">·</span>
                <a
                  href="/dualar"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/dualar');
                  }}
                  className="font-medium text-stone-700 hover:text-[#0F4C3A] dark:text-stone-300 dark:hover:text-[#86C7AE]"
                >
                  Qurandakı Dualar
                </a>
                {lastRead && (
                  <>
                    <span aria-hidden="true">·</span>
                    <a
                      href={lastRead.path}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(lastRead.path);
                      }}
                      data-testid="hero-resume-link"
                      className="font-medium text-[#0F4C3A] underline decoration-[#0F4C3A]/40 underline-offset-4 hover:decoration-[#0F4C3A] dark:text-[#86C7AE]"
                    >
                      Davam et: {lastRead.label} →
                    </a>
                  </>
                )}
                {savedAyahs.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <a
                      href="/quran"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate('/quran');
                      }}
                      className="font-mono-tabular text-stone-600 hover:text-[#0F4C3A] dark:text-stone-400 dark:hover:text-[#86C7AE]"
                    >
                      {savedAyahs.length} saxlanılan ayə
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Archival Visual */}
          <div className="lg:col-span-6">
            <div className="relative h-72 w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100 sm:h-96 lg:h-full lg:min-h-[360px] dark:border-stone-800 dark:bg-stone-900">
              {!imgFailed ? (
                <img
                  src={HERO_IMAGE_PATH}
                  alt="Taxta rəhlə üzərində açıq Qurani-Kərim əlyazması və səhər işığı"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0F4C3A]/10 via-stone-100 to-[#9A7B3E]/15 p-8 text-center dark:from-[#0F4C3A]/25 dark:via-stone-900 dark:to-[#9A7B3E]/20">
                  <span className="font-arabic text-4xl text-[#0F4C3A] dark:text-[#86C7AE]">
                    القرآن الكريم
                  </span>
                  <span className="mt-3 text-sm font-medium text-stone-600 dark:text-stone-300">
                    Quran Qiraeti Arxivi
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
