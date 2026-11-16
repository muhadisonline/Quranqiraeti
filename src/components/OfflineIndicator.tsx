import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      data-testid="offline-indicator"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg border border-amber-600/30 bg-amber-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Oflayn rejim — keşlənmiş məlumatlar istifadə olunur</span>
    </div>
  );
}
