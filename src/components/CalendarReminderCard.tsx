import { CalendarPlus, Check } from 'lucide-react';
import { useState } from 'react';
import { buildDailyReadingIcs, triggerIcsFileDownload } from '../lib/calendarExport';

interface CalendarReminderCardProps {
  goalPages?: number;
  className?: string;
}

export function CalendarReminderCard({
  goalPages = 4,
  className = '',
}: CalendarReminderCardProps) {
  const [timeValue, setTimeValue] = useState<string>('07:30');
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [exported, setExported] = useState<boolean>(false);

  function handleExportIcs() {
    const [hStr, mStr] = timeValue.split(':');
    const hour = Number.parseInt(hStr ?? '7', 10);
    const minute = Number.parseInt(mStr ?? '30', 10);

    const ics = buildDailyReadingIcs({
      hour: Number.isFinite(hour) ? hour : 7,
      minute: Number.isFinite(minute) ? minute : 30,
      durationMinutes,
      goalPages,
      url: typeof window !== 'undefined' ? `${window.location.origin}/quran` : undefined,
    });

    triggerIcsFileDownload(ics, `quran-vird-${timeValue.replace(':', '')}.ics`);
    setExported(true);
    window.setTimeout(() => setExported(false), 3500);
  }

  return (
    <div
      data-testid="calendar-reminder-card"
      className={`rounded-xl border border-stone-200 bg-[#FAF9F6] p-4 dark:border-stone-800 dark:bg-[#181E1B] ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
            Gündəlik Oxu Saatı üçün Təqvim Xatırlatması (.ics)
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
            Seçdiyiniz saatda Google Calendar və ya Apple Calendar-a təkrarlanan gündəlik xəbərdarlıq (10 dəq əvvəl bildirişlə) əlavə edin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <label htmlFor="ics-time-input" className="sr-only">
            Gündəlik oxu saatı
          </label>
          <input
            id="ics-time-input"
            type="time"
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value || '07:30')}
            data-testid="ics-time-input"
            className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 font-mono-tabular text-xs text-stone-900 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100"
          />

          <label htmlFor="ics-duration-select" className="sr-only">
            Oxu müddəti
          </label>
          <select
            id="ics-duration-select"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            data-testid="ics-duration-select"
            className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 font-mono-tabular text-xs text-stone-900 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100"
          >
            <option value={15}>15 dəq</option>
            <option value={20}>20 dəq</option>
            <option value={30}>30 dəq</option>
            <option value={45}>45 dəq</option>
          </select>

          <button
            type="button"
            onClick={handleExportIcs}
            data-testid="download-ics-btn"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F4C3A] px-3.5 py-1.5 text-xs font-medium text-white whitespace-nowrap transition-colors hover:bg-[#0B3A2C] dark:bg-[#196B52]"
          >
            {exported ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>.ics endirildi</span>
              </>
            ) : (
              <>
                <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Təqvimə əlavə et (.ics)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {exported && (
        <p
          role="status"
          data-testid="ics-export-status"
          className="mt-2 text-[11px] font-medium text-[#0F4C3A] dark:text-[#86C7AE]"
        >
          Saat {timeValue} üçün gündəlik ({durationMinutes} dəq, {goalPages} səhifə hədəfli) təqvim faylı hazırdır.
        </p>
      )}
    </div>
  );
}
