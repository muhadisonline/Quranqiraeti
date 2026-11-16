import { Download, Share, X } from 'lucide-react';
import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export function PWAInstallButton({ compact = false }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        aria-label="Tətbiqi cihaza quraşdır"
        data-testid="pwa-install-btn"
        className={
          compact
            ? 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#0F4C3A]/35 bg-[#0F4C3A]/10 px-2.5 py-2 text-xs font-medium text-[#0F4C3A] transition-colors hover:bg-[#0F4C3A]/15 dark:border-[#86C7AE]/35 dark:bg-[#196B52]/20 dark:text-[#86C7AE]'
            : 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 whitespace-nowrap transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200 dark:hover:border-[#86C7AE]'
        }
      >
        <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Tətbiqi yüklə</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-label="iPhone və ya iPad ekranına əlavə et"
          data-testid="pwa-ios-install-btn"
          className={
            compact
              ? 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#0F4C3A]/35 bg-[#0F4C3A]/10 px-2.5 py-2 text-xs font-medium text-[#0F4C3A] dark:border-[#86C7AE]/35 dark:bg-[#196B52]/20 dark:text-[#86C7AE]'
              : 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 whitespace-nowrap hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200'
          }
        >
          <Share className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Ana ekrana əlavə et</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="iOS quraşdırma təlimatı"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-6 shadow-xl dark:border-stone-700 dark:bg-[#141916]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100">
                  iPhone / iPad üzərində quraşdırma
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Pəncərəni bağla"
                  className="rounded p-1 text-stone-500 hover:text-stone-900 dark:text-stone-400"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                <li>Safari-nin alt və ya üst panelindəki <strong>Paylaş</strong> düyməsinə toxunun.</li>
                <li>Siyahıdan <strong>Ana Ekrana Əlavə Et</strong> (Add to Home Screen) seçin.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-[#0F4C3A] py-2.5 text-xs font-medium text-white dark:bg-[#196B52]"
              >
                Anladım
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
