import { ArrowRight, Bell, BellRing, CalendarDays, Sparkles } from 'lucide-react';
import { MouseEvent } from 'react';
import { useWorshipReminders } from '../hooks/useReaderPreferences';
import { PrayerLocation } from '../lib/prayerTimes';
import { getContextualReminders } from '../lib/reminders';

interface WorshipRemindersPanelProps {
  location: PrayerLocation;
  now: Date;
  onNavigate: (path: string) => void;
}

export function WorshipRemindersPanel({
  location,
  now,
  onNavigate,
}: WorshipRemindersPanelProps) {
  const {
    prefs,
    permission,
    noticeMessage,
    togglePref,
    requestPermission,
    sendTestNotification,
  } = useWorshipReminders();

  const reminders = getContextualReminders(location, now, prefs);

  function handleNav(e: MouseEvent<HTMLAnchorElement>, path: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  }

  return (
    <section
      aria-labelledby="worship-reminders-heading"
      data-testid="worship-reminders-panel"
      className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-[#141916]"
    >
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cümə və Gündəlik İbadət Xatırlatmaları</span>
            </div>
            <h2
              id="worship-reminders-heading"
              className="font-display mt-1.5 text-2xl font-semibold text-stone-900 dark:text-stone-100"
            >
              Günün Mənəvi Xatırlatmaları
            </h2>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Cümə günü Kəhf surəsi, Səhər-Axşam zikrləri və namaz vaxtı öncəsi xəbərdarlıqlar.
            </p>
          </div>

          <button
            type="button"
            onClick={sendTestNotification}
            data-testid="reminder-test-btn"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-[#FAF9F6] px-3 py-1.5 text-xs font-medium text-stone-700 whitespace-nowrap transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
          >
            <BellRing className="h-3.5 w-3.5 text-[#C6A769]" aria-hidden="true" />
            <span>Sınaq bildirişi</span>
          </button>
        </div>

        {/* Active Contextual Cards */}
        <div className="mt-5 space-y-3">
          {reminders.length === 0 ? (
            <div className="rounded-lg border border-stone-200 bg-[#FAF9F6] p-4 text-xs text-stone-600 dark:border-stone-800 dark:bg-[#181E1B] dark:text-stone-300">
              Bütün xatırlatma kateqoriyaları söndürülüb. Aşağıdan istədiyiniz xatırlatmanı aktivləşdirə bilərsiniz.
            </div>
          ) : (
            reminders.map((item) => (
              <div
                key={item.id}
                data-testid={`reminder-item-${item.id}`}
                className="flex flex-col justify-between gap-3 rounded-lg border border-stone-200 bg-[#FAF9F6] p-4 sm:flex-row sm:items-center dark:border-stone-800 dark:bg-[#181E1B]"
              >
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
                    <Sparkles className="h-3 w-3 text-[#C6A769]" aria-hidden="true" />
                    <span>{item.badge}</span>
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                    {item.description}
                  </p>
                </div>

                <a
                  href={item.ctaPath}
                  onClick={(e) => handleNav(e, item.ctaPath)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F4C3A] px-3.5 py-2 text-xs font-medium text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#0B3A2C] dark:bg-[#196B52]"
                >
                  <span>{item.ctaLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Preferences & Notification Permission Controls */}
      <div className="mt-5 border-t border-stone-200/80 pt-4 dark:border-stone-800">
        <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
          Xatırlatma Seçimləri
        </p>

        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-stone-200 bg-[#FAF9F6] px-3 py-2 text-xs dark:border-stone-800 dark:bg-[#181E1B]">
            <span className="font-medium text-stone-700 dark:text-stone-200">
              Cümə · Kəhf
            </span>
            <input
              type="checkbox"
              checked={prefs.fridayKahfEnabled}
              onChange={() => togglePref('fridayKahfEnabled')}
              data-testid="reminder-toggle-friday"
              className="h-4 w-4 accent-[#0F4C3A]"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-stone-200 bg-[#FAF9F6] px-3 py-2 text-xs dark:border-stone-800 dark:bg-[#181E1B]">
            <span className="font-medium text-stone-700 dark:text-stone-200">
              Səhər/Axşam Zikri
            </span>
            <input
              type="checkbox"
              checked={prefs.dailyAzkarEnabled}
              onChange={() => togglePref('dailyAzkarEnabled')}
              data-testid="reminder-toggle-azkar"
              className="h-4 w-4 accent-[#0F4C3A]"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-stone-200 bg-[#FAF9F6] px-3 py-2 text-xs dark:border-stone-800 dark:bg-[#181E1B]">
            <span className="font-medium text-stone-700 dark:text-stone-200">
              Namazdan 15 dəq əvvəl
            </span>
            <input
              type="checkbox"
              checked={prefs.prePrayer15mEnabled}
              onChange={() => togglePref('prePrayer15mEnabled')}
              data-testid="reminder-toggle-preprayer"
              className="h-4 w-4 accent-[#0F4C3A]"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-stone-500 dark:text-stone-400">
            Brauzer bildirişi:{' '}
            <strong className="text-stone-800 dark:text-stone-200">
              {permission === 'granted'
                ? 'İcazə verilib'
                : permission === 'denied'
                  ? 'Bloklanıb'
                  : permission === 'unsupported'
                    ? 'Dəstəklənmir'
                    : 'Sorğulanmayıb'}
            </strong>
          </span>

          {permission === 'default' && (
            <button
              type="button"
              onClick={() => void requestPermission()}
              data-testid="reminder-permission-btn"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
            >
              <Bell className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Bildirişlərə icazə ver</span>
            </button>
          )}
        </div>

        {noticeMessage && (
          <p
            role="status"
            data-testid="reminder-test-status"
            className="mt-2 text-xs font-medium text-[#0F4C3A] dark:text-[#86C7AE]"
          >
            {noticeMessage}
          </p>
        )}
      </div>
    </section>
  );
}
