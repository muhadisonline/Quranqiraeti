import { ArrowLeft, ArrowRight, Clock, Globe, MapPin, Moon, Sun } from 'lucide-react';
import { MouseEvent, useEffect, useMemo, useState } from 'react';
import { HijriCalendarSection } from '../components/HijriCalendarSection';
import { PrayerMapPicker } from '../components/PrayerMapPicker';
import { QiblaCompass } from '../components/QiblaCompass';
import { SeoHead } from '../components/SeoHead';
import { WorshipRemindersPanel } from '../components/WorshipRemindersPanel';
import { usePrayerPreferences } from '../hooks/useReaderPreferences';
import {
  PRAYER_COUNTRIES,
  calculatePrayerTimesForDate,
  calculateWeeklyPrayerSchedule,
  formatUtcOffsetLabel,
  getCalendarPartsInTimeZone,
  getCitiesByCountryId,
  getNextPrayerCountdown,
} from '../lib/prayerTimes';
import { buildBreadcrumbJsonLd } from '../lib/seo';

interface PrayerTimesPageProps {
  isDark: boolean;
  initialSection?: 'calendar';
  onNavigate: (path: string) => void;
  onToggleTheme: () => void;
}

export function PrayerTimesPage({
  isDark,
  initialSection,
  onNavigate,
  onToggleTheme,
}: PrayerTimesPageProps) {
  const {
    location,
    cityId,
    countryId,
    setCityId,
    setCountryId,
    setCustomCoordinates,
  } = usePrayerPreferences();
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (initialSection !== 'calendar') return;
    const timer = window.setTimeout(() => {
      document.getElementById('teqvim')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [initialSection]);

  const localParts = getCalendarPartsInTimeZone(
    now,
    location.timeZone,
    location.fallbackUtcOffsetHours
  );

  const countryCities = useMemo(() => getCitiesByCountryId(countryId), [countryId]);

  const todaySchedule = useMemo(
    () =>
      calculatePrayerTimesForDate(
        location,
        localParts.year,
        localParts.month,
        localParts.day
      ),
    [location, localParts.year, localParts.month, localParts.day]
  );

  const countdown = useMemo(
    () => getNextPrayerCountdown(location, now),
    [location, now]
  );

  const weeklySchedule = useMemo(
    () => calculateWeeklyPrayerSchedule(location, now, 7),
    [location, localParts.dateKey]
  );

  const jsonLd = useMemo(
    () => [
      buildBreadcrumbJsonLd(window.location.origin, [
        { name: 'Ana səhifə', path: '/' },
        { name: 'Namaz Vaxtları', path: '/namaz-vaxtlari' },
      ]),
    ],
    []
  );

  function handleNav(e: MouseEvent<HTMLAnchorElement>, path: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  }

  return (
    <article
      className="py-12 lg:py-16"
      data-testid="prayer-times-page"
    >
      <SeoHead
        title={`Namaz Vaxtları — ${location.name} (${location.countryName}) | Quran Qiraeti`}
        description={`${location.name} (${location.countryName}) və dünya şəhərləri üzrə Ümmül-Qura (Məkkə) üsulu ilə gündəlik və həftəlik namaz vaxtları, xəritə üzərindən məkan seçimi və canlı gerisayım.`}
        path="/namaz-vaxtlari"
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-6xl px-6">
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400"
        >
          <a
            href="/"
            onClick={(e) => handleNav(e, '/')}
            className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]"
          >
            Ana səhifə
          </a>
          <span aria-hidden="true">›</span>
          <span className="font-medium text-stone-800 dark:text-stone-200">Namaz Vaxtları</span>
        </nav>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <a
            href="/"
            onClick={(e) => handleNav(e, '/')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-[#0F4C3A] dark:text-stone-400 dark:hover:text-[#86C7AE]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Ana səhifəyə qayıt</span>
          </a>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/zikr"
              onClick={(e) => handleNav(e, '/zikr')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 whitespace-nowrap shrink-0 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
            >
              <span>Zikrlər</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={onToggleTheme}
              data-testid="prayer-theme-toggle"
              aria-label={isDark ? 'Gündüz rejiminə keç' : 'Gecə rejiminə keç'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 whitespace-nowrap shrink-0 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
            >
              {isDark ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-[#C6A769]" aria-hidden="true" />
                  <span>Gündüz</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-[#0F4C3A]" aria-hidden="true" />
                  <span>Gecə</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Header + Country & City Selector (Umm al-Qura method) */}
        <header className="border-b border-stone-200 pb-8 dark:border-stone-800">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono-tabular text-xs text-stone-500 dark:text-stone-400">
                {todaySchedule.gregorianLabel} · {todaySchedule.hijriLabel} ·{' '}
                {formatUtcOffsetLabel(todaySchedule.utcOffsetHours)}
              </p>
              <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl text-balance dark:text-stone-100">
                {location.name} üzrə Namaz Vaxtları
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
                {todaySchedule.calculationMethodLabel} əsasında hesablanmış gündəlik və həftəlik namaz
                vaxtları. Ölkə və şəhər seçin və ya xəritə üzərindən məkan təyin edin.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap shrink-0 items-center gap-2.5">
              <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 dark:border-stone-700 dark:bg-[#141916]">
                <Globe className="h-4 w-4 text-[#0F4C3A] dark:text-[#86C7AE]" aria-hidden="true" />
                <label htmlFor="prayer-country-select" className="sr-only">
                  Ölkə seçin
                </label>
                <select
                  id="prayer-country-select"
                  data-testid="prayer-country-select"
                  value={countryId}
                  onChange={(e) => setCountryId(e.target.value)}
                  className="bg-transparent text-xs font-medium text-stone-900 focus:outline-none dark:text-stone-100"
                >
                  {PRAYER_COUNTRIES.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                      className="bg-white text-stone-900 dark:bg-[#141916] dark:text-stone-100"
                    >
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 dark:border-stone-700 dark:bg-[#141916]">
                <MapPin className="h-4 w-4 text-[#0F4C3A] dark:text-[#86C7AE]" aria-hidden="true" />
                <label htmlFor="prayer-city-select" className="sr-only">
                  Şəhər seçin
                </label>
                <select
                  id="prayer-city-select"
                  data-testid="prayer-city-select"
                  value={location.isCustom ? '__custom__' : cityId}
                  onChange={(e) => {
                    if (e.target.value !== '__custom__') {
                      setCityId(e.target.value);
                    }
                  }}
                  className="bg-transparent text-xs font-medium text-stone-900 focus:outline-none dark:text-stone-100"
                >
                  {location.isCustom && (
                    <option
                      value="__custom__"
                      className="bg-white text-stone-900 dark:bg-[#141916] dark:text-stone-100"
                    >
                      Xəritə nöqtəsi ({location.name})
                    </option>
                  )}
                  {countryCities.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                      className="bg-white text-stone-900 dark:bg-[#141916] dark:text-stone-100"
                    >
                      {c.name} ({c.regionLabel})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Countdown Card */}
        <section
          aria-label="Növbəti namaz vaxtı"
          className="mt-8 rounded-xl border border-stone-200 bg-white p-6 sm:p-8 dark:border-stone-800 dark:bg-[#141916]"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {countdown.isTomorrow ? 'Sabahkı ilk vaxt' : 'Növbəti namaz vaxtı'}
                </span>
              </p>
              <div className="mt-2 flex items-baseline gap-3">
                <h2
                  data-testid="next-prayer-name"
                  className="font-display text-2xl font-semibold text-stone-900 sm:text-3xl dark:text-stone-100"
                >
                  {countdown.nextPrayer.label}
                </h2>
                <span className="font-mono-tabular text-xl font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
                  {countdown.nextPrayer.formattedTime}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
                {location.countryName} · {location.name} ({location.lat.toFixed(2)}° Şm, {location.lng.toFixed(2)}° Şq)
              </p>
            </div>

            <div className="rounded-lg border border-stone-200 bg-[#FAF9F6] px-6 py-4 text-left sm:text-right dark:border-stone-800 dark:bg-[#181E1B]">
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                Qalan vaxt
              </p>
              <p
                data-testid="next-prayer-countdown"
                className="font-mono-tabular mt-1 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100"
              >
                {countdown.formattedCountdown}
              </p>
            </div>
          </div>

          {/* 6 Daily Times Grid */}
          <div
            data-testid="today-prayer-grid"
            className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          >
            {todaySchedule.times.map((item) => {
              const isNext = item.key === countdown.nextPrayer.key && !countdown.isTomorrow;
              return (
                <div
                  key={item.key}
                  data-testid={`prayer-card-${item.key}`}
                  className={`rounded-lg border p-4 transition-colors ${
                    isNext
                      ? 'border-[#0F4C3A] bg-[#0F4C3A]/6 dark:border-[#86C7AE] dark:bg-[#86C7AE]/10'
                      : 'border-stone-200 bg-[#FAF9F6] dark:border-stone-800 dark:bg-[#181E1B]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
                      {item.label}
                    </span>
                    <span lang="ar" dir="rtl" className="font-arabic text-sm text-stone-500 dark:text-stone-400">
                      {item.arabicLabel}
                    </span>
                  </div>
                  <p
                    className={`font-mono-tabular mt-2 text-2xl font-semibold ${
                      isNext
                        ? 'text-[#0F4C3A] dark:text-[#86C7AE]'
                        : 'text-stone-900 dark:text-stone-100'
                    }`}
                  >
                    {item.formattedTime}
                  </p>
                  {isNext && (
                    <p className="mt-1 text-[11px] font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
                      Növbəti vaxt
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Interactive World Map & Automatic Geolocation Selection */}
        <PrayerMapPicker
          location={location}
          isDark={isDark}
          onSelectCity={setCityId}
          onSelectCoordinates={setCustomCoordinates}
        />

        {/* Qibla Compass & Contextual Worship Reminders */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <QiblaCompass location={location} />
          <WorshipRemindersPanel location={location} now={now} onNavigate={onNavigate} />
        </div>

        {/* 7-Day Weekly Schedule */}
        <section aria-labelledby="weekly-prayer-heading" className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h2
              id="weekly-prayer-heading"
              className="font-display text-2xl font-semibold text-stone-900 dark:text-stone-100"
            >
              7 günlük cədvəl — {location.name}
            </h2>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Üsul: Ümmül-Qura (Məkkə)
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-[#141916]">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="border-b border-stone-200 bg-[#FAF9F6] text-stone-500 dark:border-stone-800 dark:bg-[#181E1B] dark:text-stone-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Tarix</th>
                  <th className="px-4 py-3 font-medium">Sübh</th>
                  <th className="px-4 py-3 font-medium">Günəş</th>
                  <th className="px-4 py-3 font-medium">Zöhr</th>
                  <th className="px-4 py-3 font-medium">Əsr</th>
                  <th className="px-4 py-3 font-medium">Məğrib</th>
                  <th className="px-4 py-3 font-medium">İşa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {weeklySchedule.map((day, idx) => (
                  <tr
                    key={day.dateKey}
                    className={
                      idx === 0
                        ? 'bg-[#0F4C3A]/5 font-medium dark:bg-[#86C7AE]/10'
                        : 'hover:bg-stone-50 dark:hover:bg-[#181E1B]/60'
                    }
                  >
                    <td className="px-4 py-3 text-stone-900 dark:text-stone-100 whitespace-nowrap">
                      {day.gregorianLabel}
                    </td>
                    {day.times.map((t) => (
                      <td
                        key={t.key}
                        className="font-mono-tabular px-4 py-3 text-stone-700 dark:text-stone-200 whitespace-nowrap"
                      >
                        {t.formattedTime}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bidirectional Hijri-Gregorian Converter & Upcoming Blessed Days Countdown */}
        <HijriCalendarSection now={now} />
      </div>
    </article>
  );
}
