import { User } from 'firebase/auth';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  LogOut,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  Trash2,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { SeoHead } from '../components/SeoHead';
import {
  CONNECTED_PAGES,
  ConnectedPageKey,
  PageHealthSnapshot,
  PageTelemetryEventRecord,
  TelemetryBucket,
  TimeWindowGranularity,
  aggregateTelemetry,
  formatMsDuration,
  formatShortTimestampAz,
} from '../lib/analytics';
import {
  AdminUserRecord,
  BOOTSTRAPPED_ADMIN_EMAIL,
  addAdminUser,
  listAdminUsers,
  removeAdminUser,
  runLivePageHealthChecks,
  signInAdminWithGoogle,
  signOutAdmin,
  subscribeAdminTelemetry,
  subscribeAuthState,
  verifyAndSyncAdminAccess,
} from '../lib/firebase';

interface AdminPageProps {
  isDark: boolean;
  onNavigate: (path: string) => void;
  onToggleTheme: () => void;
}

type AdminSection = 'overview' | 'statuses' | 'events' | 'admins';

function StatusIndicator({
  status,
}: {
  status: 'Aktiv' | 'Yavaş' | 'Xətalı' | 'Gözləmədə' | 'ok' | 'degraded' | 'down' | 'slow' | 'error';
}) {
  if (status === 'Aktiv' || status === 'ok') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#16A34A] dark:text-[#4ADE80] whitespace-nowrap">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Aktiv</span>
      </span>
    );
  }
  if (status === 'Yavaş' || status === 'degraded' || status === 'slow') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D97706] dark:text-[#FBBF24] whitespace-nowrap">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Yavaş</span>
      </span>
    );
  }
  if (status === 'Xətalı' || status === 'down' || status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#DC2626] dark:text-[#F87171] whitespace-nowrap">
        <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Xətalı</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Gözləmədə</span>
    </span>
  );
}

export function AdminPage({ isDark, onNavigate, onToggleTheme }: AdminPageProps) {
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [section, setSection] = useState<AdminSection>('overview');
  const [granularity, setGranularity] = useState<TimeWindowGranularity>('hourly');
  const [selectedPageKey, setSelectedPageKey] = useState<ConnectedPageKey | 'all'>('all');
  const [hoveredBucket, setHoveredBucket] = useState<TelemetryBucket | null>(null);

  const [events, setEvents] = useState<PageTelemetryEventRecord[]>([]);
  const [healthRecords, setHealthRecords] = useState<PageHealthSnapshot[]>([]);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(true);

  const [probeProgress, setProbeProgress] = useState<{ done: number; total: number } | null>(null);
  const [adminsList, setAdminsList] = useState<AdminUserRecord[]>([]);
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [adminActionFeedback, setAdminActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const unsub = subscribeAuthState(async (user) => {
      if (!active) return;
      setCurrentUser(user);
      setAuthError(null);

      if (!user) {
        setIsAdminVerified(false);
        setAuthReady(true);
        setIsLoadingTelemetry(false);
        return;
      }

      try {
        const res = await verifyAndSyncAdminAccess(user);
        if (!active) return;
        setIsAdminVerified(res.isAdmin);
        if (!res.isAdmin && res.reason) {
          setAuthError(res.reason);
        }
      } catch (err) {
        if (!active) return;
        setIsAdminVerified(false);
        setAuthError(err instanceof Error ? err.message : 'Admin yoxlaması zamanı xəta baş verdi.');
      } finally {
        if (active) setAuthReady(true);
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!authReady || !isAdminVerified) return;

    setIsLoadingTelemetry(true);
    setTelemetryError(null);

    const unsub = subscribeAdminTelemetry(
      (incomingEvents) => {
        setEvents(incomingEvents);
        setIsLoadingTelemetry(false);
      },
      (incomingHealth) => {
        setHealthRecords(incomingHealth);
      },
      (err) => {
        setTelemetryError(err.message);
        setIsLoadingTelemetry(false);
      }
    );

    void listAdminUsers()
      .then((list) => setAdminsList(list))
      .catch((err) => {
        setTelemetryError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      unsub();
    };
  }, [authReady, isAdminVerified]);

  const summary = useMemo(
    () => aggregateTelemetry(events, granularity, Date.now(), selectedPageKey),
    [events, granularity, selectedPageKey]
  );

  const healthByPageKey = useMemo(() => {
    const map = new Map<ConnectedPageKey, PageHealthSnapshot>();
    for (const item of healthRecords) {
      map.set(item.pageKey, item);
    }
    return map;
  }, [healthRecords]);

  const maxBucketVisits = useMemo(() => {
    const maxVal = Math.max(1, ...summary.buckets.map((b) => b.visits));
    return maxVal;
  }, [summary.buckets]);

  async function handleGoogleSignIn() {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInAdminWithGoogle();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google ilə giriş uğursuz oldu.');
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handleSignOut() {
    await signOutAdmin();
    setEvents([]);
    setHealthRecords([]);
    setAdminsList([]);
  }

  async function handleRunHealthProbes() {
    if (!currentUser || probeProgress) return;
    setProbeProgress({ done: 0, total: CONNECTED_PAGES.length });
    setTelemetryError(null);
    try {
      await runLivePageHealthChecks(currentUser.uid, (done, total) => {
        setProbeProgress({ done, total });
      });
    } catch (err) {
      setTelemetryError(err instanceof Error ? err.message : 'Status yoxlaması zamanı xəta oldu.');
    } finally {
      setProbeProgress(null);
    }
  }

  async function handleAddAdmin(e: FormEvent) {
    e.preventDefault();
    setAdminActionFeedback(null);
    if (!newAdminUid.trim() || !newAdminEmail.trim() || !newAdminName.trim()) {
      setAdminActionFeedback('Bütün sahələri doldurun (UID, E-poçt, Ad).');
      return;
    }
    try {
      await addAdminUser({
        uid: newAdminUid,
        email: newAdminEmail,
        displayName: newAdminName,
      });
      setNewAdminUid('');
      setNewAdminEmail('');
      setNewAdminName('');
      setAdminsList(await listAdminUsers());
      setAdminActionFeedback('Yeni admin uğurla əlavə edildi.');
    } catch (err) {
      setAdminActionFeedback(err instanceof Error ? err.message : 'Admin əlavə edilmədi.');
    }
  }

  async function handleRemoveAdmin(uid: string) {
    setAdminActionFeedback(null);
    try {
      await removeAdminUser(uid);
      setAdminsList(await listAdminUsers());
      setAdminActionFeedback('Admin çıxarıldı.');
    } catch (err) {
      setAdminActionFeedback(err instanceof Error ? err.message : 'Admin silinə bilmədi.');
    }
  }

  if (!authReady) {
    return (
      <section className="py-20">
        <SeoHead
          title="Admin Statistika Paneli | Quran Qiraeti"
          description="Quran Qiraeti bütün səhifələrinin saatlıq, günlük və həftəlik statistika və status paneli."
          path="/admin"
        />
        <div className="mx-auto max-w-md px-6 text-center">
          <div className="rounded-xl border border-stone-200 bg-white p-8 dark:border-stone-800 dark:bg-[#141916]">
            <p className="text-sm text-stone-600 dark:text-stone-300">
              Admin sessiyası yoxlanılır...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!currentUser || !isAdminVerified) {
    return (
      <section className="py-16 lg:py-24">
        <SeoHead
          title="Admin Girişi — Statistika Paneli | Quran Qiraeti"
          description="Quran Qiraeti bütün səhifələrinin saatlıq, günlük və həftəlik statistikasını izləmək üçün admin girişi."
          path="/admin"
        />
        <div className="mx-auto max-w-lg px-6">
          <div className="rounded-xl border border-stone-200 bg-white p-8 dark:border-stone-800 dark:bg-[#141916]">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-medium tracking-widest text-stone-500 dark:text-stone-400">
                Admin · Statistika və Status Monitoru
              </p>
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={isDark ? 'Gündüz rejimi' : 'Gecə rejimi'}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 dark:border-stone-700 dark:text-stone-300"
              >
                {isDark ? <Sun className="h-4 w-4 text-[#C6A769]" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>

            <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              Admin Statistika Paneli
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              Saytın bütün <span className="font-mono-tabular">9</span> bölməsi üzrə saatlıq, günlük
              və həftəlik ziyarət statistikasını, yüklənmə gecikmələrini və canlı səhifə statuslarını
              görmək üçün səlahiyyətli Google hesabınızla daxil olun.
            </p>

            <div className="mt-6 border-t border-stone-200 pt-5 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
              <p>
                Təyin edilmiş admin hesabı:{' '}
                <span className="font-mono text-stone-800 dark:text-stone-200">
                  {BOOTSTRAPPED_ADMIN_EMAIL}
                </span>
              </p>
            </div>

            {authError && (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/5 px-4 py-3 text-xs text-[#DC2626] dark:border-[#F87171]/30 dark:bg-[#F87171]/10 dark:text-[#F87171]"
              >
                {authError}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F4C3A] px-5 py-2.5 text-sm font-medium text-white whitespace-nowrap transition-colors hover:bg-[#0B3A2C] disabled:opacity-60 dark:bg-[#196B52] dark:hover:bg-[#1E7F61]"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>{isSigningIn ? 'Giriş edilir...' : 'Google ilə Admin Girişi'}</span>
              </button>

              {currentUser && (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-4 py-2.5 text-xs font-medium text-stone-700 hover:border-stone-400 dark:border-stone-700 dark:text-stone-300"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Hesabdan çıx ({currentUser.email})</span>
                </button>
              )}

              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/');
                }}
                className="inline-flex items-center gap-1.5 py-2 text-xs font-medium text-stone-600 hover:text-[#0F4C3A] dark:text-stone-400 dark:hover:text-[#86C7AE]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sayta qayıt</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 lg:py-12">
      <SeoHead
        title="Admin Statistika Paneli | Quran Qiraeti"
        description="Bütün səhifələrin saatlıq, günlük və həftəlik statistika və sağlamlıq statusları."
        path="/admin"
      />

      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar Navigation (240px–260px) */}
          <aside className="w-full shrink-0 lg:w-64">
            <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-[#141916]">
              <p className="text-xs font-medium tracking-widest text-stone-500 dark:text-stone-400">
                Admin Konsolu
              </p>
              <p className="font-display mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">
                Quran Qiraeti
              </p>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                <span className="font-mono-tabular">{CONNECTED_PAGES.length}</span> bağlı səhifə ·
                Real vaxt
              </p>

              <nav aria-label="Admin bölmələri" className="mt-6 flex flex-row flex-wrap gap-1.5 lg:flex-col">
                {(
                  [
                    { id: 'overview', label: 'Ümumi Statistika' },
                    { id: 'statuses', label: 'Səhifə Statusları' },
                    { id: 'events', label: 'Canlı Hadisələr' },
                    { id: 'admins', label: 'Admin Hesabları' },
                  ] as const
                ).map((item) => {
                  const active = section === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSection(item.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`rounded-lg px-3.5 py-2 text-left text-xs font-medium whitespace-nowrap transition-colors ${
                        active
                          ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                          : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800/70'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 border-t border-stone-200 pt-5 dark:border-stone-800">
                <p className="truncate text-xs font-medium text-stone-800 dark:text-stone-200">
                  {currentUser.displayName || 'Admin'}
                </p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-stone-500 dark:text-stone-400">
                  {currentUser.email}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-stone-300 dark:border-stone-700 dark:text-stone-300"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Çıxış</span>
                  </button>

                  <button
                    type="button"
                    onClick={onToggleTheme}
                    aria-label={isDark ? 'Gündüz rejimi' : 'Gecə rejimi'}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 dark:border-stone-700 dark:text-stone-300"
                  >
                    {isDark ? <Sun className="h-4 w-4 text-[#C6A769]" /> : <Moon className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Workspace */}
          <div className="min-w-0 flex-1 space-y-6">
            {/* Contextual Header & Timeframe Switcher */}
            <div className="flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-stone-800">
              <div>
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                  Admin / {summary.windowLabel}
                </p>
                <h1 className="font-display mt-1.5 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                  Statistika və Səhifə Statusları
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div
                  role="tablist"
                  aria-label="Zaman aralığı"
                  className="inline-flex items-center gap-1 rounded-lg bg-[#F1EFE9] p-1 dark:bg-[#181E1B]"
                >
                  {(
                    [
                      { id: 'hourly', label: 'Saatlıq' },
                      { id: 'daily', label: 'Günlük' },
                      { id: 'weekly', label: 'Həftəlik' },
                    ] as const
                  ).map((item) => {
                    const active = granularity === item.id;
                    return (
                      <button
                        key={item.id}
                        role="tab"
                        type="button"
                        aria-selected={active}
                        onClick={() => {
                          setGranularity(item.id);
                          setHoveredBucket(null);
                        }}
                        className={`rounded-md px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                          active
                            ? 'bg-white text-stone-900 shadow-xs dark:bg-[#242D28] dark:text-stone-100'
                            : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleRunHealthProbes}
                  disabled={Boolean(probeProgress)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0F4C3A] px-4 py-2 text-xs font-medium text-white whitespace-nowrap transition-colors hover:bg-[#0B3A2C] disabled:opacity-60 dark:bg-[#196B52] dark:hover:bg-[#1E7F61]"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${probeProgress ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>
                    {probeProgress
                      ? `Yoxlanılır (${probeProgress.done}/${probeProgress.total})`
                      : 'Bütün səhifələri yoxla'}
                  </span>
                </button>
              </div>
            </div>

            {telemetryError && (
              <div
                role="alert"
                className="rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/5 px-4 py-3 text-xs text-[#DC2626] dark:border-[#F87171]/30 dark:bg-[#F87171]/10 dark:text-[#F87171]"
              >
                {telemetryError}
              </div>
            )}

            {/* Page Scope Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <label
                  htmlFor="admin-page-filter"
                  className="text-xs font-medium text-stone-600 dark:text-stone-400"
                >
                  Səhifə üzrə süz:
                </label>
                <select
                  id="admin-page-filter"
                  value={selectedPageKey}
                  onChange={(e) =>
                    setSelectedPageKey(e.target.value as ConnectedPageKey | 'all')
                  }
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100"
                >
                  <option value="all">Bütün bağlı səhifələr (9)</option>
                  {CONNECTED_PAGES.map((p) => (
                    <option key={p.pageKey} value={p.pageKey}>
                      {p.label} ({p.routePattern})
                    </option>
                  ))}
                </select>
              </div>

              {selectedPageKey !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedPageKey('all')}
                  className="text-xs font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
                >
                  Bütün səhifələrə qayıt
                </button>
              )}
            </div>

            {(section === 'overview' || section === 'statuses') && (
              <>
                {/* 4-Column Tabular KPI Strip */}
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#141916]">
                    <dt className="text-xs text-stone-500 dark:text-stone-400">Ümumi Baxış</dt>
                    <dd className="font-mono-tabular mt-1.5 text-2xl font-semibold text-stone-900 dark:text-stone-100">
                      {isLoadingTelemetry ? '—' : summary.totalVisits}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#141916]">
                    <dt className="text-xs text-stone-500 dark:text-stone-400">Unikal Sessiya</dt>
                    <dd className="font-mono-tabular mt-1.5 text-2xl font-semibold text-stone-900 dark:text-stone-100">
                      {isLoadingTelemetry ? '—' : summary.uniqueSessions}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#141916]">
                    <dt className="text-xs text-stone-500 dark:text-stone-400">Orta Yüklənmə</dt>
                    <dd className="font-mono-tabular mt-1.5 text-2xl font-semibold text-stone-900 dark:text-stone-100">
                      {isLoadingTelemetry ? '—' : formatMsDuration(summary.avgLoadTimeMs)}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#141916]">
                    <dt className="text-xs text-stone-500 dark:text-stone-400">Sağlamlıq</dt>
                    <dd className="font-mono-tabular mt-1.5 text-2xl font-semibold text-[#16A34A] dark:text-[#4ADE80]">
                      {isLoadingTelemetry ? '—' : `${summary.healthyRatePct}%`}
                      <span className="ml-2 text-xs font-normal text-stone-500 dark:text-stone-400">
                        ({summary.errorCount} xəta)
                      </span>
                    </dd>
                  </div>
                </dl>
              </>
            )}

            {section === 'overview' && (
              <>
                {/* Time-Series SVG Bar Chart */}
                <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-[#141916]">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100">
                        Zaman Qrafiki ({granularity === 'hourly' ? 'Saatlıq' : granularity === 'daily' ? 'Günlük' : 'Həftəlik'})
                      </h2>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {hoveredBucket
                          ? `${hoveredBucket.label} · ${hoveredBucket.visits} baxış · ${hoveredBucket.uniqueSessions} sessiya · ${formatMsDuration(hoveredBucket.avgLoadTimeMs)}`
                          : 'Sütunların üzərinə gələrək saat/gün/həftə detallarına baxın'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
                      <span>Aktiv: {summary.okCount}</span>
                      <span>·</span>
                      <span>Yavaş: {summary.slowCount}</span>
                      <span>·</span>
                      <span>Xəta: {summary.errorCount}</span>
                    </div>
                  </div>

                  {summary.totalVisits === 0 ? (
                    <div className="mt-6 rounded-lg border border-dashed border-stone-200 py-10 text-center dark:border-stone-800">
                      <Activity className="mx-auto h-6 w-6 text-stone-400" aria-hidden="true" />
                      <p className="mt-2 text-sm font-medium text-stone-700 dark:text-stone-300">
                        Bu zaman aralığında hələ telemetriya qeydi yoxdur
                      </p>
                      <p className="mx-auto mt-1 max-w-md text-xs text-stone-500 dark:text-stone-400">
                        İstifadəçilər əsas səhifə, Shorts, Tam Quran və digər bölmələrə daxil olduqca
                        bütün saatlıq, günlük və həftəlik qrafiklər avtomatik yenilənəcək.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6">
                      <div className="flex h-44 items-end gap-1.5">
                        {summary.buckets.map((bucket) => {
                          const totalPct = Math.round((bucket.visits / maxBucketVisits) * 100);
                          const hasError = bucket.errorCount > 0;
                          const hasSlow = bucket.slowCount > 0 && !hasError;
                          const barColor = hasError
                            ? 'bg-[#DC2626] dark:bg-[#F87171]'
                            : hasSlow
                              ? 'bg-[#D97706] dark:bg-[#FBBF24]'
                              : 'bg-[#0F4C3A] dark:bg-[#196B52]';

                          return (
                            <button
                              key={bucket.key}
                              type="button"
                              onMouseEnter={() => setHoveredBucket(bucket)}
                              onFocus={() => setHoveredBucket(bucket)}
                              aria-label={`${bucket.label}: ${bucket.visits} baxış`}
                              className="group flex h-full flex-1 flex-col items-center justify-end focus:outline-none"
                            >
                              <div className="flex w-full flex-1 items-end">
                                <div
                                  style={{
                                    height: bucket.visits > 0 ? `${Math.max(8, totalPct)}%` : '3px',
                                  }}
                                  className={`w-full rounded-t transition-opacity ${
                                    bucket.visits > 0
                                      ? `${barColor} group-hover:opacity-80`
                                      : 'bg-stone-200 dark:bg-stone-800'
                                  }`}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] font-mono-tabular text-stone-500 dark:text-stone-400">
                        <span>{summary.buckets[0]?.label}</span>
                        <span>
                          {summary.buckets[Math.floor(summary.buckets.length / 2)]?.label}
                        </span>
                        <span>{summary.buckets[summary.buckets.length - 1]?.label}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {(section === 'overview' || section === 'statuses') && (
              /* Connected Pages Table */
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-[#141916]">
                <div className="border-b border-stone-200 px-6 py-4 dark:border-stone-800">
                  <h2 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100">
                    Bağlı Səhifələrin Statusu və Ziyarət Sayı
                  </h2>
                  <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                    Bütün 9 marşrut üzrə saatlıq, günlük, həftəlik statistikalar və canlı sağlamlıq statusu
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 bg-[#FAF9F6] text-stone-500 dark:border-stone-800 dark:bg-[#111513] dark:text-stone-400">
                        <th className="px-5 py-3 font-medium">Səhifə</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Saatlıq</th>
                        <th className="px-4 py-3 text-right font-medium">Günlük</th>
                        <th className="px-4 py-3 text-right font-medium">Həftəlik</th>
                        <th className="px-4 py-3 text-right font-medium">Gecikmə</th>
                        <th className="px-5 py-3 text-right font-medium">Son Yoxlama</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                      {summary.pageRows.map((row) => {
                        const probe = healthByPageKey.get(row.pageKey);
                        const effectiveStatus = probe ? probe.status : row.operationalStatus;
                        const effectiveLatency = probe
                          ? probe.lastLatencyMs
                          : row.avgLoadTimeMs;
                        const effectiveTime = probe ? probe.lastCheckedAtMs : row.lastSeenAtMs;
                        const isSelected = selectedPageKey === row.pageKey;

                        return (
                          <tr
                            key={row.pageKey}
                            onClick={() =>
                              setSelectedPageKey(isSelected ? 'all' : row.pageKey)
                            }
                            className={`cursor-pointer transition-colors hover:bg-stone-50 dark:hover:bg-stone-900/50 ${
                              isSelected ? 'bg-[#0F4C3A]/5 dark:bg-[#196B52]/15' : ''
                            }`}
                          >
                            <td className="px-5 py-3.5">
                              <p className="font-medium text-stone-900 dark:text-stone-100">
                                {row.label}
                              </p>
                              <p className="mt-0.5 font-mono text-[11px] text-stone-500 dark:text-stone-400">
                                {row.routePattern}
                                {probe?.statusNote ? ` · ${probe.statusNote}` : ''}
                              </p>
                            </td>
                            <td className="px-4 py-3.5">
                              <StatusIndicator status={effectiveStatus} />
                            </td>
                            <td className="font-mono-tabular px-4 py-3.5 text-right text-stone-800 dark:text-stone-200">
                              {row.hourlyVisits}
                            </td>
                            <td className="font-mono-tabular px-4 py-3.5 text-right text-stone-800 dark:text-stone-200">
                              {row.dailyVisits}
                            </td>
                            <td className="font-mono-tabular px-4 py-3.5 text-right font-medium text-stone-900 dark:text-stone-100">
                              {row.weeklyVisits}
                            </td>
                            <td className="font-mono-tabular px-4 py-3.5 text-right text-stone-600 dark:text-stone-400">
                              {formatMsDuration(effectiveLatency)}
                            </td>
                            <td className="font-mono-tabular px-5 py-3.5 text-right text-stone-500 dark:text-stone-400 whitespace-nowrap">
                              {formatShortTimestampAz(effectiveTime)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {section === 'overview' && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Traffic Sources */}
                <div className="rounded-xl border border-stone-200 bg-white p-6 lg:col-span-5 dark:border-stone-800 dark:bg-[#141916]">
                  <h2 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100">
                    Trafik Mənbələri
                  </h2>
                  <div className="mt-5 space-y-4">
                    {summary.referrerBreakdown.map((item) => (
                      <div key={item.referrerType}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-700 dark:text-stone-300">{item.label}</span>
                          <span className="font-mono-tabular text-stone-600 dark:text-stone-400">
                            {item.count} ({item.sharePct}%)
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                          <div
                            style={{ width: `${item.sharePct}%` }}
                            className="h-full rounded-full bg-[#0F4C3A] dark:bg-[#86C7AE]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Telemetry Events Preview */}
                <div className="rounded-xl border border-stone-200 bg-white p-6 lg:col-span-7 dark:border-stone-800 dark:bg-[#141916]">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100">
                      Son Ziyarət Hadisələri
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSection('events')}
                      className="text-xs font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
                    >
                      Hamısını gör
                    </button>
                  </div>

                  {summary.recentEvents.length === 0 ? (
                    <p className="mt-6 text-xs text-stone-500 dark:text-stone-400">
                      Hələ ziyarət hadisəsi qeydə alınmayıb.
                    </p>
                  ) : (
                    <div className="mt-4 divide-y divide-stone-100 dark:divide-stone-800/80">
                      {summary.recentEvents.slice(0, 6).map((ev) => (
                        <div
                          key={ev.eventId}
                          className="flex items-center justify-between gap-4 py-2.5 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-stone-900 dark:text-stone-100">
                              {ev.pageLabel}
                            </p>
                            <p className="truncate font-mono text-[11px] text-stone-500 dark:text-stone-400">
                              {ev.path}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <StatusIndicator status={ev.status} />
                            <span className="font-mono-tabular text-stone-500 dark:text-stone-400">
                              {formatMsDuration(ev.loadTimeMs)}
                            </span>
                            <span className="font-mono-tabular text-stone-500 dark:text-stone-400">
                              {formatShortTimestampAz(ev.createdAtMs)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {section === 'events' && (
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-[#141916]">
                <div className="border-b border-stone-200 px-6 py-4 dark:border-stone-800">
                  <h2 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100">
                    Canlı Telemetriya Jurnalı (Son {summary.recentEvents.length} qeyd)
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 bg-[#FAF9F6] text-stone-500 dark:border-stone-800 dark:bg-[#111513] dark:text-stone-400">
                        <th className="px-5 py-3 font-medium">Zaman</th>
                        <th className="px-4 py-3 font-medium">Səhifə / Marşrut</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">HTTP</th>
                        <th className="px-4 py-3 text-right font-medium">Gecikmə</th>
                        <th className="px-5 py-3 text-right font-medium">Mənbə</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                      {summary.recentEvents.map((ev) => (
                        <tr key={ev.eventId}>
                          <td className="font-mono-tabular px-5 py-3 text-stone-500 dark:text-stone-400 whitespace-nowrap">
                            {formatShortTimestampAz(ev.createdAtMs)}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-stone-900 dark:text-stone-100">
                              {ev.pageLabel}
                            </p>
                            <p className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
                              {ev.path}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <StatusIndicator status={ev.status} />
                          </td>
                          <td className="font-mono-tabular px-4 py-3 text-right text-stone-700 dark:text-stone-300">
                            {ev.httpStatus}
                          </td>
                          <td className="font-mono-tabular px-4 py-3 text-right text-stone-700 dark:text-stone-300">
                            {formatMsDuration(ev.loadTimeMs)}
                          </td>
                          <td className="px-5 py-3 text-right text-stone-600 dark:text-stone-400">
                            {ev.referrerType}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {section === 'admins' && (
              <div className="space-y-6">
                <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-[#141916]">
                  <h2 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100">
                    Qeydiyyatlı Admin Hesabları
                  </h2>
                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                    Firestore `/admins` siyahısındakı səlahiyyətli istifadəçilər və əsas admin.
                  </p>

                  <div className="mt-5 divide-y divide-stone-100 dark:divide-stone-800/80">
                    {adminsList.map((admin) => (
                      <div
                        key={admin.uid}
                        className="flex items-center justify-between gap-4 py-3 text-xs"
                      >
                        <div>
                          <p className="font-medium text-stone-900 dark:text-stone-100">
                            {admin.displayName}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-stone-500 dark:text-stone-400">
                            {admin.email} · UID: {admin.uid}
                          </p>
                        </div>
                        {admin.uid !== currentUser.uid && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAdmin(admin.uid)}
                            aria-label={`${admin.email} adminini sil`}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-[#DC2626] hover:border-[#DC2626]/40 dark:border-stone-700 dark:text-[#F87171]"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Sil</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <form
                  onSubmit={handleAddAdmin}
                  className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-[#141916]"
                >
                  <h3 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100">
                    Yeni Admin Əlavə Et
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="admin-uid" className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                        Firebase UID
                      </label>
                      <input
                        id="admin-uid"
                        type="text"
                        value={newAdminUid}
                        onChange={(e) => setNewAdminUid(e.target.value)}
                        placeholder="Firebase Auth UID"
                        className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 dark:border-stone-700 dark:bg-[#111513] dark:text-stone-100"
                      />
                    </div>
                    <div>
                      <label htmlFor="admin-email" className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                        Google E-poçt
                      </label>
                      <input
                        id="admin-email"
                        type="email"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 dark:border-stone-700 dark:bg-[#111513] dark:text-stone-100"
                      />
                    </div>
                    <div>
                      <label htmlFor="admin-name" className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                        Ad Soyad
                      </label>
                      <input
                        id="admin-name"
                        type="text"
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                        placeholder="Əli Əliyev"
                        className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 dark:border-stone-700 dark:bg-[#111513] dark:text-stone-100"
                      />
                    </div>
                  </div>

                  {adminActionFeedback && (
                    <p className="mt-3 text-xs text-stone-600 dark:text-stone-300">
                      {adminActionFeedback}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0F4C3A] px-4 py-2 text-xs font-medium text-white hover:bg-[#0B3A2C] dark:bg-[#196B52]"
                  >
                    <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Admin əlavə et</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
