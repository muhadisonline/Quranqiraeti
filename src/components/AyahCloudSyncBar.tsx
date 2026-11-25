import { Cloud, CloudOff, Loader2, LogOut } from 'lucide-react';
import { CloudSyncStatusSnapshot } from '../lib/ayahNotesSync';

interface AyahCloudSyncBarProps {
  cloudStatus: CloudSyncStatusSnapshot;
  onSignIn: () => void | Promise<void>;
  onSignOut: () => void | Promise<void>;
  compact?: boolean;
}

export function AyahCloudSyncBar({
  cloudStatus,
  onSignIn,
  onSignOut,
  compact = false,
}: AyahCloudSyncBarProps) {
  const isSignedIn = Boolean(cloudStatus.uid);

  return (
    <div
      data-testid="ayah-cloud-sync-bar"
      className={`print:hidden flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-stone-200 bg-white px-4 ${
        compact ? 'py-2.5' : 'py-3'
      } shadow-xs dark:border-stone-800 dark:bg-stone-900`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
            isSignedIn
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
          }`}
        >
          {cloudStatus.isSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : isSignedIn ? (
            <Cloud className="h-4 w-4" aria-hidden="true" />
          ) : (
            <CloudOff className="h-4 w-4" aria-hidden="true" />
          )}
        </span>

        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-stone-900 dark:text-stone-100 sm:text-sm">
            {isSignedIn
              ? `Bulud sinxronu aktivdir${cloudStatus.email ? ` · ${cloudStatus.email}` : ''}`
              : 'Əlfəcin və Qeydlər yalnız bu cihazdadır'}
          </p>
          <p className="truncate text-[11px] text-stone-500 dark:text-stone-400">
            {cloudStatus.error
              ? cloudStatus.error
              : isSignedIn
                ? 'Saxlanılan ayələr və şəxsi qeydlər hesabınızla cihazlar arasında sinxronlaşdırılır.'
                : 'Digər cihazlarda da görmək üçün Google hesabınızla sinxronlaşdırın.'}
          </p>
        </div>
      </div>

      {isSignedIn ? (
        <button
          type="button"
          onClick={() => void onSignOut()}
          data-testid="cloud-sync-signout-btn"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Çıxış</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void onSignIn()}
          disabled={cloudStatus.isSyncing}
          data-testid="cloud-sync-signin-btn"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          <Cloud className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Google ilə sinxronlaşdır</span>
        </button>
      )}
    </div>
  );
}
