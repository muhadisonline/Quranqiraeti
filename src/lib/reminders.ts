import {
  PrayerLocation,
  calculatePrayerTimesForDate,
  getCalendarPartsInTimeZone,
  getNextPrayerCountdown,
} from './prayerTimes';

export interface WorshipReminderPrefs {
  fridayKahfEnabled: boolean;
  dailyAzkarEnabled: boolean;
  prePrayer15mEnabled: boolean;
  browserNotificationsEnabled: boolean;
}

export interface ContextualReminder {
  id: string;
  category: 'friday' | 'azkar' | 'night' | 'prayer';
  badge: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaPath: string;
}

export const WORSHIP_REMINDERS_STORAGE_KEY = 'quranqiraeti_worship_reminders_v1';
export const WORSHIP_REMINDERS_SENT_KEY = 'quranqiraeti_worship_reminders_sent_v1';
export const WORSHIP_REMINDERS_EVENT = 'quranqiraeti:worship-reminders-changed';

export const DEFAULT_WORSHIP_REMINDER_PREFS: WorshipReminderPrefs = {
  fridayKahfEnabled: true,
  dailyAzkarEnabled: true,
  prePrayer15mEnabled: true,
  browserNotificationsEnabled: false,
};

export function sanitizeWorshipReminderPrefs(input: unknown): WorshipReminderPrefs {
  if (!input || typeof input !== 'object') {
    return { ...DEFAULT_WORSHIP_REMINDER_PREFS };
  }
  const raw = input as Partial<WorshipReminderPrefs>;
  return {
    fridayKahfEnabled:
      typeof raw.fridayKahfEnabled === 'boolean' ? raw.fridayKahfEnabled : true,
    dailyAzkarEnabled:
      typeof raw.dailyAzkarEnabled === 'boolean' ? raw.dailyAzkarEnabled : true,
    prePrayer15mEnabled:
      typeof raw.prePrayer15mEnabled === 'boolean' ? raw.prePrayer15mEnabled : true,
    browserNotificationsEnabled:
      typeof raw.browserNotificationsEnabled === 'boolean'
        ? raw.browserNotificationsEnabled
        : false,
  };
}

export function getLocalWeekdayIndex(
  location: PrayerLocation,
  now: Date = new Date()
): number {
  const parts = getCalendarPartsInTimeZone(
    now,
    location.timeZone,
    location.fallbackUtcOffsetHours
  );
  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return utc.getUTCDay(); // 0=Sunday ... 5=Friday
}

export function getContextualReminders(
  location: PrayerLocation,
  now: Date = new Date(),
  prefs: WorshipReminderPrefs = DEFAULT_WORSHIP_REMINDER_PREFS
): ContextualReminder[] {
  const list: ContextualReminder[] = [];
  const parts = getCalendarPartsInTimeZone(
    now,
    location.timeZone,
    location.fallbackUtcOffsetHours
  );
  const schedule = calculatePrayerTimesForDate(
    location,
    parts.year,
    parts.month,
    parts.day
  );
  const countdown = getNextPrayerCountdown(location, now);
  const weekday = getLocalWeekdayIndex(location, now);
  const nowMinutes = Math.floor(parts.secondsSinceMidnight / 60);

  // 1. Pre-prayer 15 min warning (for obligatory prayers, skipping Sunrise)
  if (
    prefs.prePrayer15mEnabled &&
    countdown.nextPrayer.key !== 'sunrise' &&
    countdown.secondsRemaining > 0 &&
    countdown.secondsRemaining <= 15 * 60
  ) {
    const minsLeft = Math.max(1, Math.ceil(countdown.secondsRemaining / 60));
    list.push({
      id: `pre-prayer-${countdown.nextPrayer.key}`,
      category: 'prayer',
      badge: 'Namaz Xatırlatması',
      title: `${countdown.nextPrayer.label} namazına ${minsLeft} dəq qaldı`,
      description: `${location.name} üçün ${countdown.nextPrayer.label} vaxtı saat ${countdown.nextPrayer.formattedTime}-da daxil olur.`,
      ctaLabel: 'Vaxtlara bax',
      ctaPath: '/namaz-vaxtlari',
    });
  }

  // 2. Friday (Cümə) Kahf & Salawat
  if (prefs.fridayKahfEnabled && weekday === 5) {
    list.push({
      id: 'friday-kahf',
      category: 'friday',
      badge: 'Cümə Sünnəti',
      title: 'Cümə günü: Kəhf surəsini oxuyun və Salavat gətirin',
      description:
        'Cümə günü Kəhf surəsini tilavət etmək və Peyğəmbərə (s) salavat söyləmək müstəhəb sünnətlərdəndir.',
      ctaLabel: 'Kəhf surəsini oxu',
      ctaPath: '/quran/sure/18',
    });
  }

  // 3. Morning / Evening Azkar & Night Mulk contextual window
  if (prefs.dailyAzkarEnabled) {
    const fajrMin = schedule.times[0]?.minutesFromMidnight ?? 300;
    const dhuhrMin = schedule.times[2]?.minutesFromMidnight ?? 760;
    const asrMin = schedule.times[3]?.minutesFromMidnight ?? 960;
    const ishaMin = schedule.times[5]?.minutesFromMidnight ?? 1200;

    if (nowMinutes >= fajrMin && nowMinutes < dhuhrMin) {
      list.push({
        id: 'morning-azkar',
        category: 'azkar',
        badge: 'Səhər Vaxtı',
        title: 'Səhər zikrləri və günə dua ilə başlanğıc',
        description:
          'Sübh namazından sonra Ayətül-Kürsi, Qul surələri və gündəlik səhər zikrlərini oxumaq tövsiyə olunur.',
        ctaLabel: 'Səhər zikrlərinə keç',
        ctaPath: '/zikr',
      });
    } else if (nowMinutes >= asrMin && nowMinutes < ishaMin) {
      list.push({
        id: 'evening-azkar',
        category: 'azkar',
        badge: 'Axşam Vaxtı',
        title: 'Axşam zikrləri vaxtı',
        description:
          'Əsr və Məğrib aralığında axşam zikrləri və istiğfar oxuyaraq günün zikrini tamamlayın.',
        ctaLabel: 'Axşam zikrlərinə keç',
        ctaPath: '/zikr',
      });
    } else if (nowMinutes >= ishaMin || nowMinutes < fajrMin) {
      list.push({
        id: 'night-mulk',
        category: 'night',
        badge: 'Gecə Oxunuşu',
        title: 'Yatmazdan əvvəl Mülk surəsi (67-ci surə)',
        description:
          'İşa namazından sonra Mülk surəsini oxumaq və yatmazdan əvvəlki zikrləri oxumaq tövsiyə olunur.',
        ctaLabel: 'Mülk surəsini aç',
        ctaPath: '/quran/sure/67',
      });
    } else {
      list.push({
        id: 'midday-tasbih',
        category: 'azkar',
        badge: 'Gündəlik Zikr',
        title: 'Günorta vaxtı qısa zikr və salavat',
        description:
          'Namazlar arasında 33 dəfə Sübhanəllah, Əlhəmdülillah və Allahu Əkbər zikri ilə qəlbi diri saxlayın.',
        ctaLabel: 'Təsbih sayğacını aç',
        ctaPath: '/zikr',
      });
    }
  }

  return list;
}

export function shouldTriggerNotificationOnce(
  sentRecord: Record<string, string>,
  eventKey: string,
  dateKey: string
): boolean {
  return sentRecord[eventKey] !== dateKey;
}

export function loadWorshipReminderPrefs(): WorshipReminderPrefs {
  if (typeof window === 'undefined') return { ...DEFAULT_WORSHIP_REMINDER_PREFS };
  try {
    const raw = window.localStorage.getItem(WORSHIP_REMINDERS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_WORSHIP_REMINDER_PREFS };
    return sanitizeWorshipReminderPrefs(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_WORSHIP_REMINDER_PREFS };
  }
}

export function saveWorshipReminderPrefs(prefs: WorshipReminderPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WORSHIP_REMINDERS_STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent(WORSHIP_REMINDERS_EVENT));
  } catch {
    // ignore storage errors
  }
}
