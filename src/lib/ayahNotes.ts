import { TOTAL_QURAN_PAGES, TOTAL_QURAN_SURAHS, getSurahByNumber } from './quran';
import { SavedAyahRecord } from './readerState';

export interface CloudAyahNoteDoc {
  ownerUid: string;
  noteId: string;
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  pageNumber: number;
  arabicText: string;
  translation: string;
  note: string;
  savedAt: string;
}

export function buildAyahNoteId(surahNumber: number, ayahNumber: number): string {
  const s = Math.max(1, Math.min(TOTAL_QURAN_SURAHS, Math.trunc(surahNumber)));
  const a = Math.max(1, Math.min(286, Math.trunc(ayahNumber)));
  return `${s}_${a}`;
}

export function isValidAyahNoteId(noteId: string): boolean {
  return /^[0-9]{1,3}_[0-9]{1,3}$/.test(noteId);
}

export function toCloudAyahNotePayload(
  uid: string,
  record: SavedAyahRecord
): CloudAyahNoteDoc {
  const surahNumber = Math.max(1, Math.min(TOTAL_QURAN_SURAHS, Math.trunc(record.surahNumber)));
  const ayahNumber = Math.max(1, Math.min(286, Math.trunc(record.ayahNumber)));
  const noteId = buildAyahNoteId(surahNumber, ayahNumber);
  const catalogSurah = getSurahByNumber(surahNumber);
  const rawName = (record.surahName || catalogSurah?.name || `Surə ${surahNumber}`).trim();
  const pageNum =
    typeof record.pageNumber === 'number' &&
    Number.isInteger(record.pageNumber) &&
    record.pageNumber >= 1 &&
    record.pageNumber <= TOTAL_QURAN_PAGES
      ? record.pageNumber
      : 0;

  return {
    ownerUid: uid.trim().slice(0, 128),
    noteId,
    surahNumber,
    ayahNumber,
    surahName: (rawName || `Surə ${surahNumber}`).slice(0, 80),
    pageNumber: pageNum,
    arabicText: (record.arabicText ?? '').trim().slice(0, 4000),
    translation: (record.translation ?? '').trim().slice(0, 4000),
    note: (record.note ?? '').trim().slice(0, 500),
    savedAt: (record.savedAt || new Date().toISOString()).slice(0, 64),
  };
}

export function fromCloudAyahNoteDoc(raw: Record<string, unknown>): SavedAyahRecord | null {
  const surahNumber = Number(raw.surahNumber);
  const ayahNumber = Number(raw.ayahNumber);
  if (
    !Number.isInteger(surahNumber) ||
    surahNumber < 1 ||
    surahNumber > TOTAL_QURAN_SURAHS ||
    !Number.isInteger(ayahNumber) ||
    ayahNumber < 1 ||
    ayahNumber > 286
  ) {
    return null;
  }

  const pageNum = Number(raw.pageNumber);
  const cleanNote = typeof raw.note === 'string' ? raw.note.trim().slice(0, 500) : '';
  const catalogSurah = getSurahByNumber(surahNumber);
  const surahName =
    typeof raw.surahName === 'string' && raw.surahName.trim()
      ? raw.surahName.trim().slice(0, 80)
      : catalogSurah?.name || `Surə ${surahNumber}`;

  return {
    surahNumber,
    ayahNumber,
    surahName,
    pageNumber:
      Number.isInteger(pageNum) && pageNum >= 1 && pageNum <= TOTAL_QURAN_PAGES
        ? pageNum
        : undefined,
    arabicText: typeof raw.arabicText === 'string' ? raw.arabicText.trim().slice(0, 4000) : '',
    translation: typeof raw.translation === 'string' ? raw.translation.trim().slice(0, 4000) : '',
    ...(cleanNote ? { note: cleanNote } : {}),
    savedAt:
      typeof raw.savedAt === 'string' && raw.savedAt.trim()
        ? raw.savedAt.trim().slice(0, 64)
        : new Date().toISOString(),
  };
}

export function mergeLocalAndCloudAyahs(
  localList: SavedAyahRecord[],
  cloudList: SavedAyahRecord[],
  maxItems = 120
): { merged: SavedAyahRecord[]; toUpload: SavedAyahRecord[] } {
  const byKey = new Map<string, SavedAyahRecord>();
  const cloudByKey = new Map<string, SavedAyahRecord>();

  for (const item of cloudList) {
    const key = buildAyahNoteId(item.surahNumber, item.ayahNumber);
    cloudByKey.set(key, item);
    byKey.set(key, item);
  }

  const toUpload: SavedAyahRecord[] = [];
  for (const local of localList) {
    const key = buildAyahNoteId(local.surahNumber, local.ayahNumber);
    const cloud = cloudByKey.get(key);
    if (!cloud) {
      byKey.set(key, local);
      toUpload.push(local);
      continue;
    }

    const localMs = Date.parse(local.savedAt) || 0;
    const cloudMs = Date.parse(cloud.savedAt) || 0;
    const localNote = (local.note ?? '').trim();
    const cloudNote = (cloud.note ?? '').trim();

    if (localMs > cloudMs || (!cloudNote && localNote)) {
      const winner: SavedAyahRecord = {
        ...cloud,
        ...local,
        note: localNote || cloudNote || undefined,
        arabicText: local.arabicText || cloud.arabicText,
        translation: local.translation || cloud.translation,
        pageNumber: local.pageNumber ?? cloud.pageNumber,
      };
      if (!winner.note) delete winner.note;
      byKey.set(key, winner);
      toUpload.push(winner);
    } else if (!local.arabicText && cloud.arabicText) {
      byKey.set(key, cloud);
    }
  }

  const merged = Array.from(byKey.values())
    .sort((a, b) => (Date.parse(b.savedAt) || 0) - (Date.parse(a.savedAt) || 0))
    .slice(0, maxItems);

  return { merged, toUpload };
}
