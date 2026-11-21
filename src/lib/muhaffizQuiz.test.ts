import test from 'node:test';
import assert from 'node:assert/strict';
import { MushafPageAyah } from './quran';
import {
  buildClozeQuestionForAyah,
  buildNextAyahQuestions,
  evaluateClozeSelection,
} from './muhaffizQuiz';

const SAMPLE_AYAHS: MushafPageAyah[] = [
  {
    surahNumber: 1,
    surahName: 'Fatihə',
    arabicSurahName: 'الفاتحة',
    ayahNumber: 1,
    juzNumber: 1,
    arabicText: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    translation: 'Mərhəmətli və Rəhmli Allahın adı ilə!',
    footnotes: '',
  },
  {
    surahNumber: 1,
    surahName: 'Fatihə',
    arabicSurahName: 'الفاتحة',
    ayahNumber: 2,
    juzNumber: 1,
    arabicText: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
    translation: 'Həmd olsun aləmlərin Rəbbi Allaha,',
    footnotes: '',
  },
  {
    surahNumber: 1,
    surahName: 'Fatihə',
    arabicSurahName: 'الفاتحة',
    ayahNumber: 3,
    juzNumber: 1,
    arabicText: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    translation: 'Mərhəmətli və Rəhmliyə,',
    footnotes: '',
  },
  {
    surahNumber: 1,
    surahName: 'Fatihə',
    arabicSurahName: 'الفاتحة',
    ayahNumber: 4,
    juzNumber: 1,
    arabicText: 'مَٰلِكِ يَوْمِ ٱلدِّينِ',
    translation: 'Haqq-hesab gününün Hökmdarına!',
    footnotes: '',
  },
  {
    surahNumber: 1,
    surahName: 'Fatihə',
    arabicSurahName: 'الفاتحة',
    ayahNumber: 5,
    juzNumber: 1,
    arabicText: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ وَٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ',
    translation: 'Biz yalnız Sənə ibadət edir və yalnız Səndən kömək diləyirik.',
    footnotes: '',
  },
];

test('buildClozeQuestionForAyah creates 2-3 blanks and evaluates user answers accurately', () => {
  const q = buildClozeQuestionForAyah(SAMPLE_AYAHS[4], SAMPLE_AYAHS, 0);
  assert.equal(q.ayahKey, '1:5');
  assert.ok(q.blanks.length >= 2 && q.blanks.length <= 3);
  assert.ok(q.options.length >= q.blanks.length + 2);

  // Fill with matching options
  const answers: Record<string, string> = {};
  const usedIds = new Set<string>();
  for (const blank of q.blanks) {
    const match = q.options.find((o) => o.text === blank.correctWord && !usedIds.has(o.id));
    assert.ok(match);
    usedIds.add(match.id);
    answers[blank.blankId] = match.id;
  }

  const result = evaluateClozeSelection(q, answers);
  assert.equal(result.allFilled, true);
  assert.equal(result.allCorrect, true);
  assert.equal(result.correctCount, q.blanks.length);
});

test('buildNextAyahQuestions builds consecutive sequence questions with 1 correct option', () => {
  const questions = buildNextAyahQuestions(SAMPLE_AYAHS, 0);
  assert.equal(questions.length, 4);
  assert.equal(questions[0].promptAyahKey, '1:1');
  assert.equal(questions[0].correctNextKey, '1:2');

  const correctOptions = questions[0].options.filter((o) => o.isCorrect);
  assert.equal(correctOptions.length, 1);
  assert.equal(correctOptions[0].ayahKey, '1:2');
  assert.ok(questions[0].options.length >= 3);
});
