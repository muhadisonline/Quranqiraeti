import { Search, X } from 'lucide-react';
import { KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { RecitationVideo } from '../lib/channel';
import { searchGlobalQuickIndex } from '../lib/quickSearch';

interface QuickJumpModalProps {
  isOpen: boolean;
  videos: RecitationVideo[];
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function QuickJumpModal({ isOpen, videos, onClose, onNavigate }: QuickJumpModalProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(() => searchGlobalQuickIndex(query, videos, 10), [query, videos]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setActiveIndex(0);
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 20);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    function handleWindowKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleSelect(path: string) {
    onClose();
    onNavigate(path);
  }

  function handleInputKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) =>
        results.length > 0 ? (prev - 1 + results.length) % results.length : 0
      );
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      handleSelect(results[activeIndex].path);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sürətli Quran və Tilavət Axtarışı"
      data-testid="quick-jump-modal"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-16 sm:pt-24 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-stone-200 bg-[#FAF9F6] shadow-2xl dark:border-stone-800 dark:bg-[#141916]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 border-b border-stone-200 px-4 py-3.5 dark:border-stone-800">
          <Search className="h-4.5 w-4.5 shrink-0 text-[#0F4C3A] dark:text-[#86C7AE]" aria-hidden="true" />
          <label htmlFor="global-quick-jump-input" className="sr-only">
            Surə, səhifə (1–604), ayə (2:255), cüz və ya söz yazın
          </label>
          <input
            ref={inputRef}
            id="global-quick-jump-input"
            data-testid="quick-jump-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Surə (Yasin), səhifə (440), ayə (2:255), cüz 30 və ya söz..."
            className="w-full bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none dark:text-stone-100 dark:placeholder:text-stone-500"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Axtarışı bağla"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200/70 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Results */}
        <div
          role="listbox"
          aria-label="Axtarış nəticələri"
          data-testid="quick-jump-results"
          className="max-h-[60vh] divide-y divide-stone-200/70 overflow-y-auto dark:divide-stone-800/80"
        >
          {results.map((item, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <a
                key={item.id}
                href={item.path}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={(e) => {
                  e.preventDefault();
                  handleSelect(item.path);
                }}
                className={`flex items-center justify-between gap-4 px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? 'bg-[#0F4C3A]/10 dark:bg-[#196B52]/25'
                    : 'hover:bg-stone-100/80 dark:hover:bg-[#1A211D]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-stone-200/80 px-1.5 py-0.5 font-mono-tabular text-[10px] font-semibold uppercase tracking-wide text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                      {item.kindLabel}
                    </span>
                    <span className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                      {item.title}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-stone-500 dark:text-stone-400">
                    {item.subtitle}
                  </p>
                </div>

                {item.arabicLabel && (
                  <span
                    dir="rtl"
                    lang="ar"
                    className="font-arabic shrink-0 text-lg text-[#0F4C3A] dark:text-[#86C7AE]"
                  >
                    {item.arabicLabel}
                  </span>
                )}
              </a>
            );
          })}
        </div>

        {/* Keyboard Hint Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 bg-[#F3F1EC] px-4 py-2 text-[11px] text-stone-500 dark:border-stone-800 dark:bg-[#111513] dark:text-stone-400">
          <span>↑↓ seç · Enter aç · Esc bağla</span>
          <span>114 Surə · 604 Səhifə · 30 Cüz · 20 Dua</span>
        </div>
      </div>
    </div>
  );
}
