import { ArrowUpRight } from 'lucide-react';
import { MouseEvent } from 'react';
import { ChannelStats } from '../lib/channel';

interface FooterProps {
  stats: ChannelStats;
  onNavigate: (path: string) => void;
}

export function Footer({ stats, onNavigate }: FooterProps) {
  function handleNav(e: MouseEvent<HTMLAnchorElement>, path: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  }

  return (
    <footer className="bg-[#F3F1EC] py-12 dark:bg-[#0B0E0C]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 sm:flex-row sm:items-center sm:justify-between">
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
          className="flex flex-wrap items-center gap-6 text-xs font-medium text-stone-600 dark:text-stone-400"
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
          <a href="/gunun-ayesi" onClick={(e) => handleNav(e, '/gunun-ayesi')} className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]">
            Günün Ayəsi
          </a>
          <a href="/haqqinda" onClick={(e) => handleNav(e, '/haqqinda')} className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]">
            Haqqında
          </a>
          <a href="/istek" onClick={(e) => handleNav(e, '/istek')} className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]">
            İstək göndər
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
    </footer>
  );
}
