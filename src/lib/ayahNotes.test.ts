import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAyahNoteId,
  fromCloudAyahNoteDoc,
  isValidAyahNoteId,
  mergeLocalAndCloudAyahs,
  toCloudAyahNotePayload,
} from './ayahNotes';
import { SavedAyahRecord } from './readerState';

test('buildAyahNoteId formats canonical surah_ayah IDs', () => {
  assert.equal(buildAyahNoteId(2, 255), '2_255');
  assert.equal(buildAyahNoteId(114, 6), '114_6');
  assert.equal(isValidAyahNoteId('2_255'), true);
  assert.equal(isValidAyahNoteId('2:255'), false);
});

test('toCloudAyahNotePayload truncates fields to schema bounds', () => {
  const payload = toCloudAyahNotePayload('user-123', {
    surahNumber: 2,
    ayahNumber: 255,
    surahName: 'A'.repeat(120),
    arabicText: 'ب'.repeat(4500),
    translation: 'T'.repeat(4500),
    note: 'N'.repeat(600),
    savedAt: '2026-11-24T10:00:00.000Z',
  });
  assert.equal(payload.noteId, '2_255');
  assert.equal(payload.pageNumber, 0);
  assert.equal(payload.surahName.length, 80);
  assert.equal(payload.arabicText.length, 4000);
  assert.equal(payload.translation.length, 4000);
  assert.equal(payload.note.length, 500);
});

test('fromCloudAyahNoteDoc converts valid doc and ignores unknown pageNumber 0', () => {
  const rec = fromCloudAyahNoteDoc({
    ownerUid: 'u1',
    noteId: '1_1',
    surahNumber: 1,
    ayahNumber: 1,
    surahName: 'Fatihə',
    pageNumber: 0,
    arabicText: 'بِسْمِ اللَّهِ',
    translation: 'Allahın adı ilə',
    note: '  Gündəlik təfəkkür  ',
    savedAt: '2026-11-24T10:00:00.000Z',
  });
  assert.ok(rec);
  assert.equal(rec.pageNumber, undefined);
  assert.equal(rec.note, 'Gündəlik təfəkkür');
});

test('mergeLocalAndCloudAyahs combines local-only notes and keeps newer edits', () => {
  const local: SavedAyahRecord[] = [
    {
      surahNumber: 1,
      ayahNumber: 1,
      surahName: 'Fatihə',
      arabicText: 'بِسْمِ اللَّهِ',
      translation: 'Bismillah',
      note: 'Yeni qeyd',
      savedAt: '2026-11-24T12:00:00.000Z',
    },
    {
      surahNumber: 112,
      ayahNumber: 1,
      surahName: 'İxlas',
      arabicText: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
      translation: 'De ki O Təkdir',
      savedAt: '2026-11-24T08:00:00.000Z',
    },
  ];
  const cloud: SavedAyahRecord[] = [
    {
      surahNumber: 1,
      ayahNumber: 1,
      surahName: 'Fatihə',
      arabicText: 'بِسْمِ اللَّهِ',
      translation: 'Bismillah',
      note: 'Köhnə qeyd',
      savedAt: '2026-11-24T09:00:00.000Z',
    },
    {
      surahNumber: 2,
      ayahNumber: 255,
      surahName: 'Bəqərə',
      arabicText: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ',
      translation: 'Ayətül-Kürsi',
      savedAt: '2026-11-24T11:00:00.000Z',
    },
  ];

  const { merged, toUpload } = mergeLocalAndCloudAyahs(local, cloud);
  assert.equal(merged.length, 3);
  assert.equal(merged[0].surahNumber, 1);
  assert.equal(merged[0].note, 'Yeni qeyd');
  assert.equal(toUpload.length, 2);
});
