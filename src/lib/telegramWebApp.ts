import { resolveTelegramStartParamPath } from './telegramBot';

export interface TelegramWebAppInstance {
  initData?: string;
  initDataUnsafe?: {
    start_param?: string;
  };
  colorScheme?: 'light' | 'dark';
  ready?: () => void;
  expand?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick?: (cb: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred?: (style: 'light' | 'medium' | 'heavy') => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebAppInstance;
    };
  }
}

export function getTelegramWebApp(): TelegramWebAppInstance | null {
  if (typeof window === 'undefined') return null;
  const tg = window.Telegram?.WebApp;
  if (!tg || !tg.initData) return null;
  return tg;
}

export function initTelegramMiniApp(): {
  active: boolean;
  preferredColorScheme?: 'light' | 'dark';
  startPath?: string;
} {
  const tg = getTelegramWebApp();
  if (!tg) return { active: false };

  try {
    tg.ready?.();
    tg.expand?.();
  } catch {
    // ignore Telegram WebView edge failures
  }

  const startParam = tg.initDataUnsafe?.start_param;
  const startPath = startParam ? resolveTelegramStartParamPath(startParam) : undefined;

  return {
    active: true,
    preferredColorScheme: tg.colorScheme,
    startPath,
  };
}

export function syncTelegramMiniAppTheme(isDark: boolean) {
  const tg = getTelegramWebApp();
  if (!tg) return;
  const bg = isDark ? '#0E1210' : '#FAF9F6';
  try {
    tg.setHeaderColor?.(bg);
    tg.setBackgroundColor?.(bg);
  } catch {
    // ignore unsupported Telegram clients
  }
}
