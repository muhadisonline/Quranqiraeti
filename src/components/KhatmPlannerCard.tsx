import { ArrowRight, CalendarCheck, RotateCcw } from 'lucide-react';
import { MouseEvent, useState } from 'react';
import { useKhatmPlanner } from '../hooks/useReaderPreferences';
import { KHATM_PLAN_PRESETS } from '../lib/khatmPlanner';
import { ReadingGoalState } from '../lib/readingGoal';

interface KhatmPlannerCardProps {
  goalState: ReadingGoalState;
  onNavigate: (path: string) => void;
}

export function KhatmPlannerCard({ goalState, onNavigate }: KhatmPlannerCardProps) {
  const { plan, evaluation, setTargetDays, resetStartDateToday } = useKhatmPlanner(goalState);
  const [customDaysInput, setCustomDaysInput] = useState<string>(String(plan.targetDays));

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number.parseInt(customDaysInput, 10);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.max(7, Math.min(365, parsed));
    setTargetDays(clamped);
    setCustomDaysInput(String(clamped));
  }

  function handleNav(e: MouseEvent<HTMLAnchorElement>, path: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  }

  return (
    <div
      data-testid="khatm-planner-card"
      className="mt-4 rounded-xl border border-stone-200 bg-[#FAF9F6] p-5 dark:border-stone-800 dark:bg-[#181E1B]"
    >
      <div className="flex flex-col gap-3 border-b border-stone-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-stone-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
            <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Şəxsi Xətm Planlayıcısı</span>
          </div>
          <h3 className="font-display mt-1 text-base font-semibold text-stone-900 dark:text-stone-100">
            <span className="font-mono-tabular">{evaluation.targetDays}</span> günlük Xətm Planı — gündəlik avtomatik balanslama
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {KHATM_PLAN_PRESETS.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => {
                setTargetDays(days);
                setCustomDaysInput(String(days));
              }}
              aria-pressed={plan.targetDays === days}
              data-testid={`khatm-preset-${days}`}
              className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                plan.targetDays === days
                  ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                  : 'border border-stone-200 bg-white text-stone-700 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200'
              }`}
            >
              <span className="font-mono-tabular">{days}</span> gün
            </button>
          ))}

          <form onSubmit={handleCustomSubmit} className="inline-flex items-center gap-1">
            <label htmlFor="custom-khatm-days" className="sr-only">
              Fərdi gün sayı
            </label>
            <input
              id="custom-khatm-days"
              type="number"
              min={7}
              max={365}
              value={customDaysInput}
              onChange={(e) => setCustomDaysInput(e.target.value)}
              data-testid="khatm-custom-days-input"
              className="w-16 rounded-md border border-stone-200 bg-white px-2 py-1 font-mono-tabular text-xs text-stone-900 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100"
            />
            <button
              type="submit"
              data-testid="khatm-custom-days-apply"
              className="rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
            >
              Tətbiq et
            </button>
          </form>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-stone-200 bg-white p-3.5 dark:border-stone-800 dark:bg-[#141916]">
          <p className="text-[11px] text-stone-500 dark:text-stone-400">Yenilənmiş gündəlik hədəf</p>
          <p
            data-testid="khatm-daily-target"
            className="font-mono-tabular mt-1 text-xl font-semibold text-[#0F4C3A] dark:text-[#86C7AE]"
          >
            {evaluation.rebalancedDailyPages} səhifə / gün
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">
            Qalan {evaluation.remainingPages} səhifə · {evaluation.daysRemaining} gün qalıb
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-3.5 dark:border-stone-800 dark:bg-[#141916]">
          <p className="text-[11px] text-stone-500 dark:text-stone-400">Plan tempiniz</p>
          <p
            data-testid="khatm-pace-label"
            className={`mt-1 text-xs font-semibold ${
              evaluation.paceStatus === 'behind'
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-[#0F4C3A] dark:text-[#86C7AE]'
            }`}
          >
            {evaluation.paceLabel}
          </p>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            {evaluation.daysElapsed}-ci gün · Plan üzrə {evaluation.expectedPagesByToday} səh.
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-3.5 dark:border-stone-800 dark:bg-[#141916]">
          <p className="text-[11px] text-stone-500 dark:text-stone-400">Təxmini bitmə tarixi</p>
          <p
            data-testid="khatm-finish-date"
            className="mt-1 text-xs font-semibold text-stone-900 dark:text-stone-100"
          >
            {evaluation.projectedFinishLabel}
          </p>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            Başlanğıc: <span className="font-mono-tabular">{plan.startDateKey}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
        {evaluation.nextUnreadPage ? (
          <a
            href={`/quran/sehife/${evaluation.nextUnreadPage}`}
            onClick={(e) => handleNav(e, `/quran/sehife/${evaluation.nextUnreadPage}`)}
            data-testid="khatm-next-page-cta"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F4C3A] px-3.5 py-2 text-xs font-medium text-white whitespace-nowrap transition-colors hover:bg-[#0B3A2C] dark:bg-[#196B52]"
          >
            <span>
              Növbəti oxunmamış səhifə: Səh. {evaluation.nextUnreadPage}
              {evaluation.nextUnreadJuz ? ` (${evaluation.nextUnreadJuz}-ci Cüz)` : ''}
            </span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : (
          <span className="text-xs font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
            Təbriklər! 604 səhifənin hamısı oxunub.
          </span>
        )}

        <button
          type="button"
          onClick={resetStartDateToday}
          className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-[#0F4C3A] dark:text-stone-400 dark:hover:text-[#86C7AE]"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          <span>Planı bu gündən başlat</span>
        </button>
      </div>
    </div>
  );
}
