export interface DailyReadingCalendarInput {
  hour: number;
  minute: number;
  durationMinutes?: number;
  goalPages?: number;
  title?: string;
  description?: string;
  url?: string;
  startDate?: Date;
}

function pad2(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function formatIcsLocalDateTime(date: Date, hour: number, minute: number): string {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}${m}${d}T${pad2(hour)}${pad2(minute)}00`;
}

function formatIcsUtcStamp(date: Date): string {
  return `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}T${pad2(
    date.getUTCHours()
  )}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`;
}

export function buildDailyReadingIcs(input: DailyReadingCalendarInput): string {
  const hour = Math.min(23, Math.max(0, Math.floor(input.hour)));
  const minute = Math.min(59, Math.max(0, Math.floor(input.minute)));
  const durationMinutes = Math.min(180, Math.max(5, Math.floor(input.durationMinutes ?? 20)));
  const startBase = input.startDate ? new Date(input.startDate) : new Date();

  const endTotalMinutes = hour * 60 + minute + durationMinutes;
  const endDate = new Date(startBase);
  if (endTotalMinutes >= 1440) {
    endDate.setDate(endDate.getDate() + 1);
  }
  const endHour = Math.floor((endTotalMinutes % 1440) / 60);
  const endMinute = endTotalMinutes % 60;

  const goalLabel = input.goalPages ? `Gündəlik hədəf: ${input.goalPages} səhifə. ` : '';
  const summary = input.title?.trim() || 'Gündəlik Quran Oxu Virdi — Quran Qiraeti';
  const description =
    input.description?.trim() ||
    `${goalLabel}Mədinə çapı və Əlixan Musayev tərcüməsi ilə gündəlik Quran oxuma və təfəkkür vaxtı.`;
  const url = input.url?.trim() || 'https://quranqiraeti.az/quran';
  const uid = `quran-vird-${pad2(hour)}${pad2(minute)}@quranqiraeti`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Quran Qiraeti//Gundelik Vird//AZ',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsUtcStamp(startBase)}`,
    `DTSTART:${formatIcsLocalDateTime(startBase, hour, minute)}`,
    `DTEND:${formatIcsLocalDateTime(endDate, endHour, endMinute)}`,
    'RRULE:FREQ=DAILY',
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(`${description}\n${url}`)}`,
    `URL:${url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(summary)}`,
    'TRIGGER:-PT10M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ];

  return lines.join('\r\n');
}

export function triggerIcsFileDownload(icsContent: string, filename = 'quran-gundelik-vird.ics'): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
