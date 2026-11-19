import { ArrowLeftRight, Calendar, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  HIJRI_MONTHS_LIST_AZ,
  getUpcomingBlessedDays,
  gregorianDateKeyToHijri,
  hijriToGregorianDate,
} from '../lib/hijriCalendar';
import { getHijriPartsUmmAlQura } from '../lib/prayerTimes';

interface HijriCalendarSectionProps {
  now?: Date;
}

type ConverterDirection = 'g2h' | 'h2g';

function toLocalIsoDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function HijriCalendarSection({ now }: HijriCalendarSectionProps) {
  const baseDate = useMemo(() => now ?? new Date(), [now]);
  const todayKey = toLocalIsoDateKey(baseDate);
  const initialHijri = useMemo(() => getHijriPartsUmmAlQura(baseDate, 'UTC'), [baseDate]);

  const [direction, setDirection] = useState<ConverterDirection>('g2h');
  const [gregorianInput, setGregorianInput] = useState<string>(todayKey);
  const [hijriYearInput, setHijriYearInput] = useState<number>(initialHijri.year);
  const [hijriMonthInput, setHijriMonthInput] = useState<number>(initialHijri.month);
  const [hijriDayInput, setHijriDayInput] = useState<number>(initialHijri.day);

  const g2hResult = useMemo(
    () => gregorianDateKeyToHijri(gregorianInput),
    [gregorianInput]
  );

  const h2gResult = useMemo(
    () => hijriToGregorianDate(hijriYearInput, hijriMonthInput, hijriDayInput),
    [hijriYearInput, hijriMonthInput, hijriDayInput]
  );

  const upcomingBlessedDays = useMemo(
    () => getUpcomingBlessedDays(baseDate, 7),
    [todayKey] // re-compute only when calendar date changes
  );

  const hijriYearsOptions = useMemo(() => {
    const start = Math.max(1356, initialHijri.year - 25);
    const end = Math.min(1500, initialHijri.year + 15);
    const arr: number[] = [];
    for (let y = start; y <= end; y++) arr.push(y);
    return arr;
  }, [initialHijri.year]);

  function handleResetToday() {
    const current = new Date();
    const key = toLocalIsoDateKey(current);
    const h = getHijriPartsUmmAlQura(current, 'UTC');
    setGregorianInput(key);
    setHijriYearInput(h.year);
    setHijriMonthInput(h.month);
    setHijriDayInput(h.day);
  }

  return (
    <section
      id="teqvim"
      aria-labelledby="hijri-calendar-heading"
      data-testid="hijri-calendar-section"
      className="mt-10 border-t border-stone-200 pt-10 dark:border-stone-800"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
            Ümmül-Qura Təqvimi
          </p>
          <h2
            id="hijri-calendar-heading"
            className="font-display mt-1 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl dark:text-stone-100"
          >
            Hicri–Miladi Təqvim Çeviricisi və Mübarək Günlər
          </h2>
        </div>

        <button
          type="button"
          onClick={handleResetToday}
          data-testid="hijri-reset-today"
          className="rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 whitespace-nowrap transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
        >
          Bu günə sıfırla
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Bidirectional Converter */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 lg:col-span-5 dark:border-stone-800 dark:bg-[#141916]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <ArrowLeftRight
                className="h-4 w-4 text-[#0F4C3A] dark:text-[#86C7AE]"
                aria-hidden="true"
              />
              <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
                Tarix çevirici
              </h3>
            </div>

            <div
              role="group"
              aria-label="Çevirmə istiqaməti"
              className="inline-flex rounded-lg border border-stone-200 bg-[#FAF9F6] p-0.5 dark:border-stone-700 dark:bg-[#181E1B]"
            >
              <button
                type="button"
                onClick={() => setDirection('g2h')}
                aria-pressed={direction === 'g2h'}
                data-testid="converter-tab-g2h"
                className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                  direction === 'g2h'
                    ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                    : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                }`}
              >
                Miladi → Hicri
              </button>
              <button
                type="button"
                onClick={() => setDirection('h2g')}
                aria-pressed={direction === 'h2g'}
                data-testid="converter-tab-h2g"
                className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                  direction === 'h2g'
                    ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                    : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                }`}
              >
                Hicri → Miladi
              </button>
            </div>
          </div>

          {direction === 'g2h' ? (
            <div className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="gregorian-date-input"
                  className="block text-xs font-medium text-stone-600 dark:text-stone-400"
                >
                  Miladi tarix seçin
                </label>
                <input
                  id="gregorian-date-input"
                  type="date"
                  value={gregorianInput}
                  onChange={(e) => setGregorianInput(e.target.value)}
                  data-testid="gregorian-date-input"
                  className="mt-1.5 w-full rounded-lg border border-stone-200 bg-[#FAF9F6] px-3 py-2.5 font-mono-tabular text-sm text-stone-900 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-100"
                />
              </div>

              <div
                data-testid="g2h-result-card"
                className="rounded-lg border border-stone-200 bg-[#FAF9F6] p-4 dark:border-stone-800 dark:bg-[#181E1B]"
              >
                {g2hResult ? (
                  <>
                    <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                      Hicri (Ümmül-Qura) qarşılığı
                    </p>
                    <p className="font-display mt-1 text-2xl font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
                      {g2hResult.hijriFormatted}
                    </p>
                    <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">
                      {g2hResult.gregorianLabel}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Zəhmət olmasa düzgün Miladi tarix daxil edin.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label
                    htmlFor="hijri-day-select"
                    className="block text-xs font-medium text-stone-600 dark:text-stone-400"
                  >
                    Gün
                  </label>
                  <select
                    id="hijri-day-select"
                    data-testid="hijri-day-select"
                    value={hijriDayInput}
                    onChange={(e) => setHijriDayInput(Number.parseInt(e.target.value, 10))}
                    className="mt-1.5 w-full rounded-lg border border-stone-200 bg-[#FAF9F6] px-2.5 py-2 font-mono-tabular text-sm text-stone-900 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-100"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="hijri-month-select"
                    className="block text-xs font-medium text-stone-600 dark:text-stone-400"
                  >
                    Hicri ay
                  </label>
                  <select
                    id="hijri-month-select"
                    data-testid="hijri-month-select"
                    value={hijriMonthInput}
                    onChange={(e) => setHijriMonthInput(Number.parseInt(e.target.value, 10))}
                    className="mt-1.5 w-full rounded-lg border border-stone-200 bg-[#FAF9F6] px-2 py-2 text-sm text-stone-900 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-100"
                  >
                    {HIJRI_MONTHS_LIST_AZ.map((name, idx) => (
                      <option key={name} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="hijri-year-select"
                    className="block text-xs font-medium text-stone-600 dark:text-stone-400"
                  >
                    Hicri il
                  </label>
                  <select
                    id="hijri-year-select"
                    data-testid="hijri-year-select"
                    value={hijriYearInput}
                    onChange={(e) => setHijriYearInput(Number.parseInt(e.target.value, 10))}
                    className="mt-1.5 w-full rounded-lg border border-stone-200 bg-[#FAF9F6] px-2.5 py-2 font-mono-tabular text-sm text-stone-900 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-100"
                  >
                    {hijriYearsOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                data-testid="h2g-result-card"
                className="rounded-lg border border-stone-200 bg-[#FAF9F6] p-4 dark:border-stone-800 dark:bg-[#181E1B]"
              >
                <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                  Miladi qarşılığı
                </p>
                <p className="font-display mt-1 text-2xl font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
                  {h2gResult.gregorianLabel}
                </p>
                <p className="mt-1 font-mono-tabular text-xs text-stone-600 dark:text-stone-300">
                  {h2gResult.hijriFormatted} · {h2gResult.dateKey}
                </p>
                {!h2gResult.exactDayMatched && (
                  <p className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-300">
                    Qeyd: Bu Hicri ay Ümmül-Qura təqvimində 29 gün olduğu üçün ayın son günü seçildi.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              Ay başlanğıcları Ümmül-Qura astronomik təqvimi əsasında hesablanır.
            </span>
          </div>
        </div>

        {/* Right: Upcoming Blessed Days Countdown */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 lg:col-span-7 dark:border-stone-800 dark:bg-[#141916]">
          <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-4 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Sparkles
                className="h-4 w-4 text-[#0F4C3A] dark:text-[#86C7AE]"
                aria-hidden="true"
              />
              <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
                Qarşıdakı Mübarək Günlər Sayğacı
              </h3>
            </div>
            <span className="font-mono-tabular text-xs text-stone-500 dark:text-stone-400">
              {initialHijri.year}–{initialHijri.year + 1} H.
            </span>
          </div>

          <div
            data-testid="blessed-days-list"
            className="mt-3 divide-y divide-stone-100 dark:divide-stone-800"
          >
            {upcomingBlessedDays.map((item, idx) => (
              <div
                key={item.id}
                className={`flex flex-wrap items-center justify-between gap-3 py-3 ${
                  idx === 0 ? 'rounded-lg bg-[#0F4C3A]/5 px-3 dark:bg-[#86C7AE]/10' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                    <span>{item.hijriLabel}</span>
                    <span aria-hidden="true" className="mx-1.5">·</span>
                    <span>{item.gregorianLabel}</span>
                  </p>
                </div>

                <span
                  className={`font-mono-tabular text-xs font-semibold whitespace-nowrap ${
                    item.daysRemaining === 0
                      ? 'text-[#0F4C3A] dark:text-[#86C7AE]'
                      : idx === 0
                        ? 'text-[#0F4C3A] dark:text-[#86C7AE]'
                        : 'text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {item.daysRemaining === 0 ? 'Bu gün' : `${item.daysRemaining} gün qalıb`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
