import { Menu, Search, X } from 'lucide-react';
import { MouseEvent, useState } from 'react';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  currentPath: string;
  subscribeUrl: string;
  onNavigate: (path: string) => void;
  onOpenQuickSearch: () => void;
}

const NAV_LINKS = [
  { path: '/', label: 'Uzun Videolar' },
  { path: '/shorts', label: 'Shorts' },
  { path: '/quran', label: 'Tam Quran' },
  { path: '/muhaffiz', label: 'Mühafiz' },
  { path: '/gunun-ayesi', label: 'Günün Ayəsi' },
  { path: '/haqqinda', label: 'Haqqında' },
];

export function TopBar({ currentPath, subscribeUrl, onNavigate, onOpenQuickSearch }: TopBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLinkClick(e: MouseEvent<HTMLAnchorElement>, path: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigate(path);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#FAF9F6]/92 backdrop-blur-md dark:border-stone-800/80 dark:bg-[#0E1210]/92">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          className="font-display text-2xl font-semibold tracking-tight text-stone-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C3A] rounded-sm dark:text-stone-100"
        >
          Quran Qiraeti
        </a>

        {/* Zone 2: Concise single-line page links */}
        <nav
          aria-label="Əsas naviqasiya"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-300"
        >
          {NAV_LINKS.map((link) => {
            const isActive =
              link.path === '/'
                ? currentPath === '/'
                : currentPath === link.path || currentPath.startsWith(`${link.path}/`);
            return (
              <a
                key={link.path}
                href={link.path}
                aria-current={isActive ? 'page' : undefined}
                onClick={(e) => handleLinkClick(e, link.path)}
                className={`whitespace-nowrap shrink-0 py-1 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C3A] rounded-sm ${
                  isActive
                    ? 'text-[#0F4C3A] underline decoration-[#0F4C3A] decoration-2 underline-offset-8 dark:text-[#86C7AE] dark:decoration-[#86C7AE]'
                    : 'hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Quick Search + PWA Install + Single Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenQuickSearch}
            data-testid="topbar-quick-search"
            aria-label="Sürətli Quran və Tilavət axtarışı (Ctrl+K)"
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 whitespace-nowrap transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200 dark:hover:border-[#86C7AE] min-h-[38px]"
          >
            <Search className="h-3.5 w-3.5 text-[#0F4C3A] dark:text-[#86C7AE]" aria-hidden="true" />
            <span className="hidden sm:inline">Axtar</span>
            <kbd className="hidden lg:inline-block rounded border border-stone-200 bg-[#F7F5F0] px-1.5 py-0.5 font-mono-tabular text-[10px] text-stone-500 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-400">
              ⌘K
            </kbd>
          </button>

          <div className="hidden sm:flex items-center">
            <PWAInstallButton />
          </div>
          <a
            href={subscribeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center justify-center rounded-lg bg-[#0F4C3A] px-4 py-2 text-xs font-medium text-white whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-[#0B3A2C] dark:bg-[#196B52] dark:hover:bg-[#1E7F61] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C3A] focus-visible:ring-offset-2"
          >
            YouTube-da Abunə Ol
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Menyunu bağla' : 'Menyunu aç'}
            className="inline-flex md:hidden items-center justify-center rounded-lg border border-stone-300 p-2 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800 min-h-[44px] min-w-[44px]"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-[#FAF9F6] px-6 py-4 dark:border-stone-800 dark:bg-[#0E1210]">
          <nav aria-label="Mobil naviqasiya" className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.path === '/'
                  ? currentPath === '/'
                  : currentPath === link.path || currentPath.startsWith(`${link.path}/`);
              return (
                <a
                  key={link.path}
                  href={link.path}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={(e) => handleLinkClick(e, link.path)}
                  className={`py-2 text-sm font-medium ${
                    isActive
                      ? 'text-[#0F4C3A] dark:text-[#86C7AE]'
                      : 'text-stone-700 hover:text-[#0F4C3A] dark:text-stone-200 dark:hover:text-[#86C7AE]'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
            <div className="mt-1 flex flex-col gap-2">
              <PWAInstallButton compact />
              <a
                href={subscribeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-lg bg-[#0F4C3A] px-4 py-2.5 text-sm font-medium text-white"
              >
                YouTube-da Abunə Ol
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
