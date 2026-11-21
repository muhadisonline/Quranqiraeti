import { MushafPageAyah } from './quran';

export interface ClozeBlankSlot {
  blankId: string;
  wordIndex: number;
  correctWord: string;
}

export interface ClozeOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface MuhaffizClozeQuestion {
  ayahKey: string;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  translation: string;
  tokens: Array<{
    index: number;
    text: string;
    blankId?: string;
  }>;
  blanks: ClozeBlankSlot[];
  options: ClozeOption[];
}

export interface NextAyahOption {
  ayahKey: string;
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  previewArabic: string;
  isCorrect: boolean;
}

export interface NextAyahQuestion {
  promptAyahKey: string;
  promptSurahNumber: number;
  promptAyahNumber: number;
  promptSurahName: string;
  promptArabic: string;
  correctNextKey: string;
  correctNextTranslation: string;
  options: NextAyahOption[];
}

const FALLBACK_ARABIC_WORDS = [
  'ٱللَّهُ',
  'رَبِّ',
  'ٱلْعَٰلَمِينَ',
  'ٱلرَّحْمَٰنِ',
  'ٱلرَّحِيمِ',
  'إِيَّاكَ',
  'نَعْبُدُ',
  'ٱلْمُسْتَقِيمَ',
  'عَلَيْهِمْ',
  'آمَنُوا',
  'ٱلْحَقُّ',
  'كِتَابٌ',
];

function deterministicHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function deterministicShuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let state = deterministicHash(seed) || 1;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function splitArabicWords(text: string): string[] {
  return text
    .replace(/[۞۩﴿﴾]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !/^[٠-٩0-9]+$/.test(w));
}

export function buildClozeQuestionForAyah(
  ayah: MushafPageAyah,
  allAyahs: MushafPageAyah[],
  seedOffset = 0
): MuhaffizClozeQuestion {
  const words = splitArabicWords(ayah.arabicText);
  const ayahKey = `${ayah.surahNumber}:${ayah.ayahNumber}`;
  const candidateIndices = words
    .map((w, idx) => ({ w, idx }))
    .filter((item) => item.w.replace(/[\u064B-\u065F\u0670]/g, '').length >= 2)
    .map((item) => item.idx);

  const usableIndices = candidateIndices.length > 0 ? candidateIndices : words.map((_, i) => i);
  const targetBlankCount = words.length >= 7 ? 3 : words.length >= 3 ? 2 : 1;

  const shuffledPositions = deterministicShuffle(
    usableIndices,
    `cloze-pos-${ayahKey}-${seedOffset}`
  )
    .slice(0, targetBlankCount)
    .sort((a, b) => a - b);

  const blankByWordIndex = new Map<number, ClozeBlankSlot>();
  const blanks: ClozeBlankSlot[] = shuffledPositions.map((wordIndex, idx) => {
    const slot: ClozeBlankSlot = {
      blankId: `blank-${idx}`,
      wordIndex,
      correctWord: words[wordIndex] ?? '',
    };
    blankByWordIndex.set(wordIndex, slot);
    return slot;
  });

  const correctWordsSet = new Set(blanks.map((b) => b.correctWord));

  const distractorPool: string[] = [];
  for (const other of allAyahs) {
    if (other.surahNumber === ayah.surahNumber && other.ayahNumber === ayah.ayahNumber) {
      continue;
    }
    for (const w of splitArabicWords(other.arabicText)) {
      if (!correctWordsSet.has(w) && !distractorPool.includes(w) && w.length >= 2) {
        distractorPool.push(w);
      }
    }
  }
  for (const fw of FALLBACK_ARABIC_WORDS) {
    if (!correctWordsSet.has(fw) && !distractorPool.includes(fw)) {
      distractorPool.push(fw);
    }
  }

  const chosenDistractors = deterministicShuffle(
    distractorPool,
    `cloze-dist-${ayahKey}-${seedOffset}`
  ).slice(0, Math.max(3, 6 - blanks.length));

  const rawOptions: ClozeOption[] = [
    ...blanks.map((b, i) => ({
      id: `opt-correct-${i}-${b.wordIndex}`,
      text: b.correctWord,
      isCorrect: true,
    })),
    ...chosenDistractors.map((text, i) => ({
      id: `opt-dist-${i}`,
      text,
      isCorrect: false,
    })),
  ];

  return {
    ayahKey,
    surahNumber: ayah.surahNumber,
    surahName: ayah.surahName,
    ayahNumber: ayah.ayahNumber,
    translation: ayah.translation,
    tokens: words.map((text, index) => ({
      index,
      text,
      blankId: blankByWordIndex.get(index)?.blankId,
    })),
    blanks,
    options: deterministicShuffle(rawOptions, `cloze-opts-${ayahKey}-${seedOffset}`),
  };
}

export function evaluateClozeSelection(
  question: MuhaffizClozeQuestion,
  filledOptionIds: Record<string, string>
): { allFilled: boolean; allCorrect: boolean; correctCount: number; totalBlanks: number } {
  const optionMap = new Map(question.options.map((o) => [o.id, o]));
  let filledCount = 0;
  let correctCount = 0;

  for (const blank of question.blanks) {
    const selectedOptId = filledOptionIds[blank.blankId];
    if (!selectedOptId) continue;
    filledCount += 1;
    const opt = optionMap.get(selectedOptId);
    if (opt && opt.text === blank.correctWord) {
      correctCount += 1;
    }
  }

  const totalBlanks = question.blanks.length;
  return {
    allFilled: filledCount === totalBlanks && totalBlanks > 0,
    allCorrect: totalBlanks > 0 && correctCount === totalBlanks,
    correctCount,
    totalBlanks,
  };
}

function summarizeArabicOpening(arabicText: string, maxWords = 7): string {
  const words = splitArabicWords(arabicText);
  if (words.length <= maxWords) return words.join(' ');
  return `${words.slice(0, maxWords).join(' ')} ...`;
}

export function buildNextAyahQuestions(
  ayahs: MushafPageAyah[],
  seedOffset = 0
): NextAyahQuestion[] {
  if (ayahs.length < 2) return [];
  const questions: NextAyahQuestion[] = [];

  for (let i = 0; i < ayahs.length - 1; i += 1) {
    const current = ayahs[i];
    const nextAyah = ayahs[i + 1];
    const isConsecutive =
      (current.surahNumber === nextAyah.surahNumber &&
        nextAyah.ayahNumber === current.ayahNumber + 1) ||
      (nextAyah.surahNumber === current.surahNumber + 1 && nextAyah.ayahNumber === 1);

    if (!isConsecutive) continue;

    const promptKey = `${current.surahNumber}:${current.ayahNumber}`;
    const correctKey = `${nextAyah.surahNumber}:${nextAyah.ayahNumber}`;

    const otherCandidates = ayahs.filter(
      (a) =>
        `${a.surahNumber}:${a.ayahNumber}` !== correctKey &&
        `${a.surahNumber}:${a.ayahNumber}` !== promptKey
    );

    const distractors = deterministicShuffle(
      otherCandidates,
      `next-dist-${promptKey}-${seedOffset}`
    ).slice(0, 3);

    const options: NextAyahOption[] = [
      {
        ayahKey: correctKey,
        surahNumber: nextAyah.surahNumber,
        ayahNumber: nextAyah.ayahNumber,
        surahName: nextAyah.surahName,
        previewArabic: summarizeArabicOpening(nextAyah.arabicText),
        isCorrect: true,
      },
      ...distractors.map((d) => ({
        ayahKey: `${d.surahNumber}:${d.ayahNumber}`,
        surahNumber: d.surahNumber,
        ayahNumber: d.ayahNumber,
        surahName: d.surahName,
        previewArabic: summarizeArabicOpening(d.arabicText),
        isCorrect: false,
      })),
    ];

    questions.push({
      promptAyahKey: promptKey,
      promptSurahNumber: current.surahNumber,
      promptAyahNumber: current.ayahNumber,
      promptSurahName: current.surahName,
      promptArabic: current.arabicText,
      correctNextKey: correctKey,
      correctNextTranslation: nextAyah.translation,
      options: deterministicShuffle(options, `next-opts-${promptKey}-${seedOffset}`),
    });
  }

  return questions;
}
