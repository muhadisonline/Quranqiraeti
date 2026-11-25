import { AzkarCategory } from '../data/azkar';

export function getBakuHour(now: Date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Baku',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const hourPart = parts.find((p) => p.type === 'hour')?.value ?? '';
    const parsed = Number.parseInt(hourPart, 10);
    if (Number.isFinite(parsed)) {
      return ((parsed % 24) + 24) % 24;
    }
  } catch {
    // Fallback to UTC+4
  }
  return (now.getUTCHours() + 4) % 24;
}

export function getDefaultZikrCategoryForTime(now: Date = new Date()): Extract<AzkarCategory, 'seher' | 'axsam'> {
  const hour = getBakuHour(now);
  return hour >= 4 && hour < 16 ? 'seher' : 'axsam';
}

export function getZikrTimeBannerText(recommended: Extract<AzkarCategory, 'seher' | 'axsam'>): string {
  return recommended === 'seher'
    ? 'Bakı vaxtı ilə hazırda Səhər zikri vaxtıdır — səhər zikrləri önə çıxarıldı.'
    : 'Bakı vaxtı ilə hazırda Axşam zikri vaxtıdır — axşam zikrləri önə çıxarıldı.';
}

export function stepZikrCardIndex(
  currentIndex: number,
  totalCards: number,
  direction: 'prev' | 'next'
): number {
  if (totalCards <= 0) return 0;
  const clamped = Math.max(0, Math.min(totalCards - 1, currentIndex));
  if (direction === 'prev') {
    return Math.max(0, clamped - 1);
  }
  return Math.min(totalCards - 1, clamped + 1);
}

export function evaluateZikrCardSwipe(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  minDistance = 48
): 'prev' | 'next' | null {
  const dx = endX - startX;
  const dy = endY - startY;
  if (Math.abs(dx) < minDistance) return null;
  if (Math.abs(dx) < Math.abs(dy) * 1.25) return null;
  return dx < 0 ? 'next' : 'prev';
}
