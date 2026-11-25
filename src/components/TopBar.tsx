import {
  BookHeart,
  BookOpen,
  CalendarDays,
  Clock,
  Info,
  Layers,
  Menu,
  MessageSquarePlus,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { MouseEvent, useEffect, useRef, useState } from 'react';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  currentPath: string;
  subscribeUrl: string;
  isDark?: boolean;
  onNavigate: (path: string) => void;
  onOpenQuickSearch: () => void;
  onToggleTheme?: () => void;
}

const PRIMARY_SURAH_LINKS = [
  { path: '/', label: 'Surələr' },
  { path: '/quran', label: 'Tam Quran' },
  { path: '/shorts', label: 'Shorts' },
];

const EXTRA_SECTION_LINKS = [
  { path: '/muhaffiz', label: 'Mühafiz (Əzbər)', icon: Layers },
  { path: '/dualar', label: 'Qurandakı Dualar', icon: BookHeart },
  { path: '/namaz-vaxtlari', label: 'Namaz və Qiblə', icon: Clock },
  { path: '/teqvim', label: 'Hicri Təqvim', icon: CalendarDays },
  { path: '/elifba', label: 'Əlifba və Təcvid', icon: BookOpen },
  { path: '/zikr', label: 'Səhər-Axşam Zikrləri', icon: Sparkles },
  { path: '/gunun-ayesi', label: 'Günün Ayəsi', icon: Sparkles },
  { path: '/haqqinda', label: 'Haqqında', icon: Info },
  { path: '/istek', label: 'İstək göndər', icon: MessageSquarePlus },
  { path: '/admin', label: 'Admin Panel', icon: ShieldCheck },
];

export function TopBar({
  currentPath,
  subscribeUrl,
  isDark,
  onNavigate,
  onOpenQuickSearch,
  onToggleTheme,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleOutsideClick(e: globalThis.MouseEvent) {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  function handleLinkClick(e: MouseEvent<HTMLAnchorElement>, path: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setMenuOpen(false);
    onNavigate(path);
  }

  return (
    <header className="print:hidden sticky top-0 z-30 border-b border-stone-200/80 bg-[#FAF9F6]/92 backdrop-blur-md dark:border-stone-800/80 dark:bg-[#0E1210]/92">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          className="font-display text-2xl font-semibold tracking-tight text-stone-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C3A] rounded-sm dark:text-stone-100"
        >
          Quran Qiraeti
        </a>

        {/* Zone 2: Primary Surah & Quran Navigation */}
        <nav
          aria-label="Əsas naviqasiya"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600 dark:text-stone-300"
        >
          {PRIMARY_SURAH_LINKS.map((link) => {
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

        {/* Zone 3: Quick Search + Subscribe + Single 3-Line (≡) Menu Icon */}
        <div className="flex items-center gap-2 shrink-0">
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

          <a
            href={subscribeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center justify-center rounded-lg bg-[#0F4C3A] px-4 py-2 text-xs font-medium text-white whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-[#0B3A2C] dark:bg-[#196B52] dark:hover:bg-[#1E7F61] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C3A] focus-visible:ring-offset-2 min-h-[38px]"
          >
            YouTube-da Abunə Ol
          </a>

          {/* Single 3-Line (≡) Menu Button for Desktop & Mobile */}
          <div ref={menuContainerRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              data-testid="topbar-menu-button"
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label={menuOpen ? 'Menyunu bağla' : 'Menyu və digər bölmələr'}
              title="Menyu və digər bölmələr"
              className={`inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C3A] ${
                menuOpen
                  ? 'border-[#0F4C3A] bg-[#0F4C3A]/10 text-[#0F4C3A] dark:border-[#86C7AE] dark:bg-[#196B52]/25 dark:text-[#86C7AE]'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200 dark:hover:border-[#86C7AE]'
              }`}
            >
              {menuOpen ? (
                <X className="h-4.5 w-4.5" aria-hidden="true" />
              ) : (
                <Menu className="h-4.5 w-4.5" aria-hidden="true" />
              )}
            </button>

            {menuOpen && (
              <div
                data-testid="topbar-menu-dropdown"
                role="dialog"
                aria-label="Menyu və bütün bölmələr"
                className="absolute right-0 mt-2.5 max-h-[82vh] w-[min(92vw,360px)] overflow-y-auto rounded-xl border border-stone-200 bg-[#FAF9F6] p-4 shadow-xl dark:border-stone-700 dark:bg-[#141916]"
              >
                <div className="flex items-center justify-between border-b border-stone-200/80 pb-2.5 dark:border-stone-800">
                  <span className="text-xs font-semibold tracking-wide text-stone-900 dark:text-stone-100">
                    Menyu və Bölmələr
                  </span>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Menyunu bağla"
                    className="rounded p-1 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>

                {/* Primary Surah Links shown on mobile inside 3-line menu */}
                <div className="mt-3 border-b border-stone-200/80 pb-3 md:hidden dark:border-stone-800">
                  <p className="text-[11px] font-medium tracking-wider text-stone-500 dark:text-stone-400">
                    Əsas Bölmələr
                  </p>
                  <nav aria-label="Əsas mobil naviqasiya" className="mt-1.5 grid grid-cols-3 gap-1.5">
                    {PRIMARY_SURAH_LINKS.map((link) => {
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
                          className={`rounded-lg px-2.5 py-2 text-center text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                              : 'border border-stone-200 bg-white text-stone-700 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200'
                          }`}
                        >
                          {link.label}
                        </a>
                      );
                    })}
                  </nav>
                </div>

                {/* Display & App Preferences */}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-b border-stone-200/80 pb-3 dark:border-stone-800">
                  {onToggleTheme && (
                    <button
                      type="button"
                      onClick={onToggleTheme}
                      data-testid="menu-theme-toggle"
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200 dark:hover:border-[#86C7AE]"
                    >
                      {isDark ? (
                        <>
                          <Sun className="h-3.5 w-3.5 text-[#C6A769]" aria-hidden="true" />
                          <span>Gündüz rejimi</span>
                        </>
                      ) : (
                        <>
                          <Moon className="h-3.5 w-3.5 text-[#0F4C3A]" aria-hidden="true" />
                          <span>Gecə rejimi</span>
                        </>
                      )}
                    </button>
                  )}

                  <PWAInstallButton compact />
                </div>

                {/* All Remaining Sections & Worship Tools */}
                <p className="mt-3 text-[11px] font-medium tracking-wider text-stone-500 dark:text-stone-400">
                  Digər Bölmələr və Alətlər
                </p>
                <nav
                  aria-label="Digər bölmələr"
                  className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2"
                >
                  {EXTRA_SECTION_LINKS.map((item) => {
                    const Icon = item.icon;
                    const active =
                      currentPath === item.path || currentPath.startsWith(`${item.path}/`);
                    return (
                      <a
                        key={item.path}
                        href={item.path}
                        onClick={(e) => handleLinkClick(e, item.path)}
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                          active
                            ? 'bg-[#0F4C3A]/10 text-[#0F4C3A] dark:bg-[#196B52]/25 dark:text-[#86C7AE]'
                            : 'text-stone-700 hover:bg-stone-200/60 hover:text-stone-900 dark:text-stone-200 dark:hover:bg-stone-800'
                        }`}
                      >
                        <Icon
                          className="h-3.5 w-3.5 shrink-0 text-[#0F4C3A] dark:text-[#86C7AE]"
                          aria-hidden="true"
                        />
                        <span className="truncate">{item.label}</span>
                      </a>
                    );
                  })}
                </nav>

                {/* Mobile YouTube CTA */}
                <div className="mt-3 border-t border-stone-200/80 pt-3 sm:hidden dark:border-stone-800">
                  <a
                    href={subscribeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-[#0F4C3A] px-4 py-2.5 text-xs font-medium text-white dark:bg-[#196B52]"
                  >
                    YouTube-da Abunə Ol
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
