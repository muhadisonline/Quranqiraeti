import { ArrowRight, BookOpen, Clock, Flame, Layers, Sparkles } from 'lucide-react';
import { MouseEvent, useEffect, useState } from 'react';
import {
  useHifzOverview,
  useKhatmPlanner,
  useLastRead,
  usePrayerPreferences,
  useReadingGoal,
  useSavedAyahs,
} from '../hooks/useReaderPreferences';
import {
  formatHijriAzerbaijani,
  formatShortRemainingAz,
  getNextPrayerCountdown,
} from '../lib/prayerTimes';
import { getLocalWeekdayIndex } from '../lib/reminders';

interface QuranJourneySectionProps {
  onNavigate: (path: string) => void;
}

const DAILY_RECOMMENDED_READINGS = [
  {
    label: 'Ayətül-Kürsi',
    ref: 'Bəqərə 2:255',
    path: '/quran/sure/2#ayah-255',
  },
  {
    label: 'Kəhf surəsi',
    ref: 'Cümə oxunuşu',
    path: '/quran/sure/18',
  },
  {
    label: 'Yasin surəsi',
    ref: '36-cı surə',
    path: '/quran/sure/36',
  },
  {
    label: 'Mülk surəsi',
    ref: 'Gecə oxunuşu',
    path: '/quran/sure/67',
  },
  {
    label: 'Qurandakı Dualar',
    ref: '20 Rəbbənə duası',
    path: '/dualar',
  },
];

export function QuranJourneySection({ onNavigate }: QuranJourneySectionProps) {
  const lastRead = useLastRead();
  const { savedAyahs } = useSavedAyahs();
  const { goalState, summary: readingGoal } = useReadingGoal();
  const { evaluation: khatmEval } = useKhatmPlanner(goalState);
  const { progress: hifzProgress, missedWords, summary: hifzSummary, reviewQueue } = useHifzOverview();
  const { location } = usePrayerPreferences();
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const prayerCountdown = getNextPrayerCountdown(location, now);
  const safeHijriTz = location.timeZone === 'SOLAR_OFFSET' ? 'UTC' : location.timeZone;
  const hijriToday = formatHijriAzerbaijani(now, safeHijriTz);
  const isFriday = getLocalWeekdayIndex(location, now) === 5;

  const nextReviewEntry = reviewQueue[0] ?? null;
  const targetMuhaffizPath = nextReviewEntry
    ? `/muhaffiz/${nextReviewEntry.pageNumber}`
    : hifzProgress.bookmarkedPage
      ? `/muhaffiz/${hifzProgress.bookmarkedPage}`
      : '/muhaffiz';

  const resumePath = lastRead?.path ?? '/quran/sure/1';
  const resumeLabel = lastRead?.label ?? '1. Fatihə surəsi (Başlanğıc)';

  function handleNav(e: MouseEvent<HTMLAnchorElement>, path: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  }

  return (
    <section
      aria-labelledby="quran-journey-heading"
      data-testid="quran-journey-hub"
      className="border-b border-stone-200/80 bg-[#F5F3EE] py-12 lg:py-14 dark:border-stone-800/80 dark:bg-[#111513]"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-widest text-stone-500 dark:text-stone-400">
              Oxu, Əzbər və Təfəkkür Mərkəzi
            </p>
            <h2
              id="quran-journey-heading"
              className="font-display mt-1.5 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl text-balance dark:text-stone-100"
            >
              Şəxsi Quran virdi və Mühafiz tərəqqisi
            </h2>
          </div>

          <a
            href="/quran"
            onClick={(e) => handleNav(e, '/quran')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F4C3A] underline decoration-[#0F4C3A]/40 underline-offset-4 hover:decoration-[#0F4C3A] dark:text-[#86C7AE] whitespace-nowrap shrink-0"
          >
            <span>Tam Quran (114 surə · 604 səhifə)</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Card 1: Oxu Virdi & Son Oxunan */}
          <div className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-6 lg:col-span-4 dark:border-stone-800 dark:bg-[#141916]">
            <div>
              <div className="flex items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
                <span className="inline-flex items-center gap-1.5 font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Gündəlik Vird & Xətm</span>
                </span>
                <span className="inline-flex items-center gap-1 font-mono-tabular">
                  <Flame className="h-3.5 w-3.5 text-[#C6A769]" aria-hidden="true" />
                  {readingGoal.streakDays} gün
                </span>
              </div>

              <h3 className="font-display mt-3 text-xl font-semibold text-stone-900 dark:text-stone-100">
                {resumeLabel}
              </h3>

              <div className="mt-4 space-y-2.5 text-xs text-stone-600 dark:text-stone-300">
                <div className="flex items-center justify-between">
                  <span>Bugünkü hədəf</span>
                  <span className="font-mono-tabular font-semibold text-stone-900 dark:text-stone-100">
                    {readingGoal.todayCount} / {readingGoal.goalPages} səh
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                  <div
                    style={{ width: `${readingGoal.todayPercent}%` }}
                    className="h-full bg-[#0F4C3A] transition-all duration-300 dark:bg-[#86C7AE]"
                  />
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px] text-stone-500 dark:text-stone-400">
                  <span>{khatmEval.targetDays} günlük Xətm Planı</span>
                  <span className="font-mono-tabular">
                    {readingGoal.khatmCount}/604 · {khatmEval.rebalancedDailyPages} səh/gün
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-stone-100 pt-4 dark:border-stone-800">
              <a
                href={resumePath}
                onClick={(e) => handleNav(e, resumePath)}
                data-testid="journey-resume-cta"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F4C3A] px-4 py-2 text-xs font-medium text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#0B3A2C] dark:bg-[#196B52]"
              >
                <span>{lastRead ? 'Oxumağa davam et' : 'Oxumağa başla'}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>

              <a
                href="/quran?tab=saved"
                onClick={(e) => handleNav(e, '/quran?tab=saved')}
                className="font-mono-tabular text-xs font-medium text-stone-600 hover:text-[#0F4C3A] dark:text-stone-400 dark:hover:text-[#86C7AE] whitespace-nowrap"
              >
                {savedAyahs.length} saxlanılan ayə
              </a>
            </div>
          </div>

          {/* Card 2: Mühafiz (Hifz & Review Queue) */}
          <div className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-6 lg:col-span-4 dark:border-stone-800 dark:bg-[#141916]">
            <div>
              <div className="flex items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
                <span className="inline-flex items-center gap-1.5 font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
                  <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Mühafiz · Əzbər Mushafı</span>
                </span>
                <span className="font-mono-tabular">
                  {hifzSummary.memorizedCount} / 604 səh
                </span>
              </div>

              <h3 className="font-display mt-3 text-xl font-semibold text-stone-900 dark:text-stone-100">
                {nextReviewEntry
                  ? nextReviewEntry.mistakeCount > 0
                    ? `Növbəti təkrar: Səhifə ${nextReviewEntry.pageNumber}`
                    : `Davam edən səhifə: ${nextReviewEntry.pageNumber}`
                  : '15 sətirlik Mədinə Mushafı'}
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                {nextReviewEntry
                  ? `${hifzSummary.memorizedCount} əzbər · ${hifzSummary.learningCount} öyrənilir · ${missedWords.length} xəta işarəsi`
                  : 'Kəlmə-kəlmə gizlət/göstər, səsli əzbər yoxlaması, ayə döngüsü və 30 Cüz təkrar izləyicisi.'}
              </p>

              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                <div
                  style={{ width: `${Math.min(100, hifzSummary.memorizedPercent)}%` }}
                  className="h-full bg-[#C6A769] transition-all duration-300"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-stone-100 pt-4 dark:border-stone-800">
              <a
                href={targetMuhaffizPath}
                onClick={(e) => handleNav(e, targetMuhaffizPath)}
                data-testid="journey-muhaffiz-cta"
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-[#FAF9F6] px-4 py-2 text-xs font-medium text-stone-900 whitespace-nowrap shrink-0 transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-100 dark:hover:border-[#86C7AE]"
              >
                <span>
                  {nextReviewEntry
                    ? `Səhifə ${nextReviewEntry.pageNumber}-ni aç`
                    : 'Mühafizi aç'}
                </span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>

              <a
                href="/muhaffiz/582"
                onClick={(e) => handleNav(e, '/muhaffiz/582')}
                className="font-mono-tabular text-xs font-medium text-stone-500 hover:text-[#0F4C3A] dark:text-stone-400 dark:hover:text-[#86C7AE] whitespace-nowrap"
              >
                30-cu Cüz (Səh. 582)
              </a>
            </div>
          </div>

          {/* Card 3: Gündəlik Seçilmiş Oxunuşlar */}
          <div className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-6 lg:col-span-4 dark:border-stone-800 dark:bg-[#141916]">
            <div>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                Gündəlik Tövsiyə Olunan Oxunuşlar
              </p>

              <ul className="mt-3 divide-y divide-stone-100 dark:divide-stone-800">
                {DAILY_RECOMMENDED_READINGS.map((item) => (
                  <li key={item.path}>
                    <a
                      href={item.path}
                      onClick={(e) => handleNav(e, item.path)}
                      className="group flex items-center justify-between gap-3 py-2.5 text-xs transition-colors"
                    >
                      <span className="font-medium text-stone-900 group-hover:text-[#0F4C3A] dark:text-stone-100 dark:group-hover:text-[#86C7AE]">
                        {item.label}
                      </span>
                      <span className="font-mono-tabular text-[11px] text-stone-500 group-hover:text-[#0F4C3A] dark:text-stone-400 dark:group-hover:text-[#86C7AE] whitespace-nowrap">
                        {item.ref} →
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Operational Utility Ribbon: Live Next Prayer + Tasbih / Azkar shortcut */}
        <div
          data-testid="journey-worship-ribbon"
          className="mt-5 flex flex-col gap-3 rounded-xl border border-stone-200 bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-stone-800 dark:bg-[#141916]"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600 dark:text-stone-300">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{location.name}:</span>
            </span>
            <span>
              Növbəti vaxt — <strong className="text-stone-900 dark:text-stone-100">{prayerCountdown.nextPrayer.label}</strong>{' '}
              <span className="font-mono-tabular font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
                {prayerCountdown.nextPrayer.formattedTime}
              </span>
            </span>
            <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
            <span className="font-mono-tabular text-stone-500 dark:text-stone-400">
              {formatShortRemainingAz(prayerCountdown.secondsRemaining)}
            </span>
            <span aria-hidden="true" className="hidden md:inline text-stone-300 dark:text-stone-700">·</span>
            <span className="hidden md:inline text-stone-500 dark:text-stone-400">{hijriToday}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isFriday && (
              <a
                href="/quran/sure/18"
                onClick={(e) => handleNav(e, '/quran/sure/18')}
                data-testid="ribbon-friday-kahf"
                className="inline-flex items-center gap-1 rounded-lg border border-[#C6A769]/50 bg-[#C6A769]/10 px-3 py-1.5 text-xs font-medium text-stone-800 whitespace-nowrap hover:border-[#C6A769] dark:text-stone-100"
              >
                <span>Cümə · Kəhf surəsi</span>
              </a>
            )}
            <a
              href="/namaz-vaxtlari"
              onClick={(e) => handleNav(e, '/namaz-vaxtlari')}
              data-testid="ribbon-prayer-link"
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-[#FAF9F6] px-3 py-1.5 text-xs font-medium text-stone-700 whitespace-nowrap hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
            >
              <span>Namaz və Qiblə</span>
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </a>
            <a
              href="/zikr"
              onClick={(e) => handleNav(e, '/zikr')}
              data-testid="ribbon-zikr-link"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-[#FAF9F6] px-3 py-1.5 text-xs font-medium text-stone-700 whitespace-nowrap hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
            >
              <Sparkles className="h-3 w-3 text-[#C6A769]" aria-hidden="true" />
              <span>Zikr və Təsbih</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
