import { ArrowUpRight } from 'lucide-react';
import { MouseEvent } from 'react';
import { ChannelStats } from '../lib/channel';

interface FooterProps {
  stats: ChannelStats;
  longVideoCount: number;
  onNavigate: (path: string) => void;
}

export function Footer({ stats, longVideoCount, onNavigate }: FooterProps) {
  function handleNav(e: MouseEvent<HTMLAnchorElement>, path: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  }

  return (
    <footer className="bg-[#F3F1EC] py-12 dark:bg-[#0B0E0C]">
      <div className="mx-auto max-w-6xl px-6">
        {/* Lower Channel Overview Metrics Strip (Moved from top hero) */}
        <dl
          data-testid="lower-channel-stats"
          className="mb-10 grid grid-cols-2 gap-6 border-b border-stone-200/80 pb-8 sm:grid-cols-4 dark:border-stone-800/80"
        >
          <div>
            <dt className="text-xs font-medium text-stone-500 dark:text-stone-400">Abunəçi icması</dt>
            <dd className="font-mono-tabular mt-1.5 text-2xl font-medium text-stone-900 dark:text-stone-100">
              {stats.subscribersLabel}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-stone-500 dark:text-stone-400">Kanalda cəmi video</dt>
            <dd className="font-mono-tabular mt-1.5 text-2xl font-medium text-stone-900 dark:text-stone-100">
              {stats.videoCountLabel}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-stone-500 dark:text-stone-400">Uzun tilavətlər</dt>
            <dd className="font-mono-tabular mt-1.5 text-2xl font-medium text-stone-900 dark:text-stone-100">
              {longVideoCount} surə
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-stone-500 dark:text-stone-400">Təqdimat formatı</dt>
            <dd className="mt-1.5 text-lg font-medium text-stone-900 dark:text-stone-100">
              Ərəbcə + AZ mətn
            </dd>
          </div>
        </dl>

        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a
              href="/"
              onClick={(e) => handleNav(e, '/')}
              className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100"
            >
              Quran Qiraeti
            </a>
            <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
              Qurani-Kərimin ərəbcə tilavəti və Azərbaycan dilində mənaca tərcüməsi · {stats.handle}
            </p>
          </div>

          <nav
            aria-label="Alt naviqasiya"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-stone-600 dark:text-stone-400"
          >
            <a href="/" onClick={(e) => handleNav(e, '/')} className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]">
              Uzun Videolar
            </a>
            <a href="/shorts" onClick={(e) => handleNav(e, '/shorts')} className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]">
              Shorts
            </a>
            <a href="/quran" onClick={(e) => handleNav(e, '/quran')} className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]">
              Tam Quran
            </a>
            <a href="/dualar" onClick={(e) => handleNav(e, '/dualar')} className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]">
              Dualar
            </a>
            <a href="/zikr" onClick={(e) => handleNav(e, '/zikr')} className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]">
              Zikr və Təsbih
            </a>
            <a href="/namaz-vaxtlari" onClick={(e) => handleNav(e, '/namaz-vaxtlari')} className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]">
              Namaz Vaxtları
            </a>
            <a href="/muhaffiz" onClick={(e) => handleNav(e, '/muhaffiz')} className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]">
              Mühafiz
            </a>
            <a href="/gunun-ayesi" onClick={(e) => handleNav(e, '/gunun-ayesi')} className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]">
              Günün Ayəsi
            </a>
            <a href="/haqqinda" onClick={(e) => handleNav(e, '/haqqinda')} className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]">
              Haqqında
            </a>
            <a href="/istek" onClick={(e) => handleNav(e, '/istek')} className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]">
              İstək göndər
            </a>
            <a href="/admin" onClick={(e) => handleNav(e, '/admin')} className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]">
              Admin Panel
            </a>
            <a
              href={stats.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
            >
              <span>YouTube</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
