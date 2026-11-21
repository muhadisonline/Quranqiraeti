import { RecitationVideo, normalizeAzerbaijaniText } from './channel';
import { getSurahByNumber } from './quran';

export interface ParsedShortReference {
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
}

export interface MatchedShortVideo {
  video: RecitationVideo;
  ayahStart?: number;
  ayahEnd?: number;
  matchLabel: string;
}

export function parseShortAyahReference(video: RecitationVideo): ParsedShortReference | null {
  if (!video.surahNumber) return null;
  const title = video.rawTitle || video.title || '';
  const match = title.match(/(\d{1,3})\s*[-–—]\s*(\d{1,3})/);
  if (match) {
    const a = Number.parseInt(match[1], 10);
    const b = Number.parseInt(match[2], 10);
    if (Number.isInteger(a) && Number.isInteger(b) && a >= 1 && b >= a && b <= 286) {
      return {
        surahNumber: video.surahNumber,
        ayahStart: a,
        ayahEnd: b,
      };
    }
  }

  const singleMatch = normalizeAzerbaijaniText(title).match(/\baye\s*(\d{1,3})\b/);
  if (singleMatch) {
    const a = Number.parseInt(singleMatch[1], 10);
    if (Number.isInteger(a) && a >= 1 && a <= 286) {
      return {
        surahNumber: video.surahNumber,
        ayahStart: a,
        ayahEnd: a,
      };
    }
  }

  return null;
}

export function findMatchingShortsForAyahRange(
  videos: RecitationVideo[],
  surahNumber: number,
  visibleAyahNumbers?: number[],
  limit = 4
): MatchedShortVideo[] {
  const shorts = videos.filter((v) => v.format === 'short' && v.surahNumber === surahNumber);
  if (shorts.length === 0) return [];

  const visibleSet = visibleAyahNumbers ? new Set(visibleAyahNumbers) : null;
  const surahName = getSurahByNumber(surahNumber)?.name ?? `Surə ${surahNumber}`;

  const matched: MatchedShortVideo[] = [];
  for (const video of shorts) {
    const ref = parseShortAyahReference(video);
    if (ref) {
      if (visibleSet) {
        let overlaps = false;
        for (let n = ref.ayahStart; n <= ref.ayahEnd; n += 1) {
          if (visibleSet.has(n)) {
            overlaps = true;
            break;
          }
        }
        if (!overlaps) continue;
      }
      matched.push({
        video,
        ayahStart: ref.ayahStart,
        ayahEnd: ref.ayahEnd,
        matchLabel:
          ref.ayahStart === ref.ayahEnd
            ? `${surahName} ${ref.ayahStart}`
            : `${surahName} ${ref.ayahStart}–${ref.ayahEnd}`,
      });
    } else {
      matched.push({
        video,
        matchLabel: `${surahName} Shorts`,
      });
    }
  }

  return matched.slice(0, limit);
}

export function findMatchingShortsForMushafAyahs(
  videos: RecitationVideo[],
  ayahs: Array<{ surahNumber: number; ayahNumber: number }>,
  limit = 4
): MatchedShortVideo[] {
  const bySurah = new Map<number, number[]>();
  for (const a of ayahs) {
    const list = bySurah.get(a.surahNumber) ?? [];
    list.push(a.ayahNumber);
    bySurah.set(a.surahNumber, list);
  }

  const seenIds = new Set<string>();
  const collected: MatchedShortVideo[] = [];
  for (const [surahNum, ayahNums] of bySurah.entries()) {
    const hits = findMatchingShortsForAyahRange(videos, surahNum, ayahNums, limit);
    for (const hit of hits) {
      if (seenIds.has(hit.video.videoId)) continue;
      seenIds.add(hit.video.videoId);
      collected.push(hit);
      if (collected.length >= limit) return collected;
    }
  }
  return collected;
}
