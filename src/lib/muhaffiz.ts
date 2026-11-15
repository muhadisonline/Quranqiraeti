import {
  MushafPageAyah,
  MushafPagePayload,
  SURAH_CATALOG,
  TOTAL_QURAN_PAGES,
} from './quran';

export type MuhaffizFontSize = 'sm' | 'md' | 'lg';
export type MuhaffizReciterId =
  | 'Alafasy_128kbps'
  | 'Husary_128kbps'
  | 'Minshawy_Murattal_128kbps';

export interface MuhaffizPreferences {
  firstWordHint: boolean;
  showTranslation: boolean;
  autoRevealAllOnLoad: boolean;
  fontSize: MuhaffizFontSize;
  autoIntervalMs: number;
  reciter: MuhaffizReciterId;
}

export const DEFAULT_MUHAFFIZ_PREFS: MuhaffizPreferences = {
  firstWordHint: false,
  showTranslation: false,
  autoRevealAllOnLoad: false,
  fontSize: 'md',
  autoIntervalMs: 3500,
  reciter: 'Alafasy_128kbps',
};

export const MUHAFFIZ_RECITERS: Array<{ id: MuhaffizReciterId; label: string }> = [
  { id: 'Alafasy_128kbps', label: 'Mişari Rəşid əl-Əfəsi' },
  { id: 'Husary_128kbps', label: 'Mahmud Xəlil əl-Husəri' },
  { id: 'Minshawy_Murattal_128kbps', label: 'Məhəmməd Siddiq əl-Minşavi' },
];

export interface MushafWordToken {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  ayahKey: string;
  wordIndex: number;
  isFirstWordOfAyah: boolean;
  textUthmani: string;
  stemText: string;
  waqfMark: string;
  lineNumber: number;
  charType: 'word' | 'end';
}

export type MuhaffizRenderRow =
  | {
      kind: 'surah-header';
      lineNumber: number;
      surahNumber: number;
      surahName: string;
      arabicSurahName: string;
    }
  | {
      kind: 'bismillah';
      lineNumber: number;
      surahNumber: number;
    }
  | {
      kind: 'words';
      lineNumber: number;
      tokens: MushafWordToken[];
    };

export interface MuhaffizPageData extends MushafPagePayload {
  rows: MuhaffizRenderRow[];
  centeredPage: boolean;
}

export interface QuranComRawWord {
  text_uthmani?: string;
  text?: string;
  line_number?: number;
  char_type_name?: string;
  position?: number;
}

export interface QuranComRawVerseWithWords {
  verse_key?: string;
  juz_number?: number;
  words?: QuranComRawWord[];
}

const SURAH_META_BY_NUMBER = new Map(SURAH_CATALOG.map((s) => [s.number, s]));

const ARABIC_JUZ_ORDINALS = [
  '',
  'الجزء الأول',
  'الجزء الثاني',
  'الجزء الثالث',
  'الجزء الرابع',
  'الجزء الخامس',
  'الجزء السادس',
  'الجزء السابع',
  'الجزء الثامن',
  'الجزء التاسع',
  'الجزء العاشر',
  'الجزء الحادي عشر',
  'الجزء الثاني عشر',
  'الجزء الثالث عشر',
  'الجزء الرابع عشر',
  'الجزء الخامس عشر',
  'الجزء السادس عشر',
  'الجزء السابع عشر',
  'الجزء الثامن عشر',
  'الجزء التاسع عشر',
  'الجزء العشرون',
  'الجزء الحادي والعشرون',
  'الجزء الثاني والعشرون',
  'الجزء الثالث والعشرون',
  'الجزء الرابع والعشرون',
  'الجزء الخامس والعشرون',
  'الجزء السادس والعشرون',
  'الجزء السابع والعشرون',
  'الجزء الثامن والعشرون',
  'الجزء التاسع والعشرون',
  'الجزء الثلاثون',
];

export function formatArabicJuzLabel(juzNumber: number): string {
  const clamped = Math.min(30, Math.max(1, Math.trunc(juzNumber || 1)));
  return ARABIC_JUZ_ORDINALS[clamped] || `الجزء ${toArabicIndicDigits(clamped)}`;
}

/**
 * Separates standalone trailing Quranic pause/waqf annotation marks (e.g. "رَيْبَ ۛ" -> stem "رَيْبَ", waqf "ۛ")
 * so the masked word keeps its exact consonant underline while the pause symbol stays visible above the line.
 */
export function splitWaqfMark(rawWord: string): { stemText: string; waqfMark: string } {
  const trimmed = rawWord.trim();
  const match = trimmed.match(/^(.*?)(?:\s+([\u06D6-\u06DC\u06DE\u06E9]+))$/);
  if (match && match[1].trim().length > 0) {
    return {
      stemText: match[1].trim(),
      waqfMark: match[2].trim(),
    };
  }
  return {
    stemText: trimmed,
    waqfMark: '',
  };
}

export function clampMuhaffizPage(page: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.min(TOTAL_QURAN_PAGES, Math.max(1, Math.trunc(page)));
}

export function ayahKey(ayah: Pick<MushafPageAyah, 'surahNumber' | 'ayahNumber'>): string {
  return `${ayah.surahNumber}:${ayah.ayahNumber}`;
}

export function toArabicIndicDigits(value: number): string {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(Math.max(0, Math.trunc(value)))
    .split('')
    .map((ch) => digits[Number(ch)] ?? ch)
    .join('');
}

export function splitAyahWords(arabicText: string): string[] {
  return arabicText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !/^[۞۩﴿﴾]$/.test(w));
}

export function estimateWordMaskWidthPx(word: string): number {
  const base = word.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
  const charCount = Math.max(2, Math.min(10, base.length));
  return charCount * 9 + 12;
}

export function getNextHiddenKey(
  ayahs: MushafPageAyah[],
  revealedKeys: Set<string>
): string | null {
  for (const ayah of ayahs) {
    const k = ayahKey(ayah);
    if (!revealedKeys.has(k)) {
      return k;
    }
  }
  return null;
}

export function revealNextAyah(
  ayahs: MushafPageAyah[],
  revealedKeys: Set<string>
): Set<string> {
  const nextKey = getNextHiddenKey(ayahs, revealedKeys);
  if (!nextKey) return revealedKeys;
  const next = new Set(revealedKeys);
  next.add(nextKey);
  return next;
}

export function hideLastAyah(
  ayahs: MushafPageAyah[],
  revealedKeys: Set<string>
): Set<string> {
  for (let i = ayahs.length - 1; i >= 0; i--) {
    const k = ayahKey(ayahs[i]);
    if (revealedKeys.has(k)) {
      const next = new Set(revealedKeys);
      next.delete(k);
      return next;
    }
  }
  return revealedKeys;
}

export function toggleAyahReveal(revealedKeys: Set<string>, key: string): Set<string> {
  const next = new Set(revealedKeys);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  return next;
}

export interface MushafPageSurahGroup {
  surahNumber: number;
  surahName: string;
  arabicSurahName: string;
  startsAtBeginning: boolean;
  ayahs: MushafPageAyah[];
}

export function groupPageAyahsBySurah(ayahs: MushafPageAyah[]): MushafPageSurahGroup[] {
  const groups: MushafPageSurahGroup[] = [];
  for (const ayah of ayahs) {
    const prev = groups[groups.length - 1];
    if (!prev || prev.surahNumber !== ayah.surahNumber) {
      groups.push({
        surahNumber: ayah.surahNumber,
        surahName: ayah.surahName,
        arabicSurahName: ayah.arabicSurahName,
        startsAtBeginning: ayah.ayahNumber === 1,
        ayahs: [ayah],
      });
    } else {
      prev.ayahs.push(ayah);
    }
  }
  return groups;
}

export function groupTokensIntoMushafRows(tokens: MushafWordToken[]): MuhaffizRenderRow[] {
  const lineBuckets = new Map<number, MushafWordToken[]>();
  const surahStarts = new Map<number, number>(); // surahNumber -> first lineNumber on page

  for (const token of tokens) {
    const arr = lineBuckets.get(token.lineNumber) ?? [];
    arr.push(token);
    lineBuckets.set(token.lineNumber, arr);

    if (token.ayahNumber === 1 && !surahStarts.has(token.surahNumber)) {
      surahStarts.set(token.surahNumber, token.lineNumber);
    }
  }

  const rows: MuhaffizRenderRow[] = [];

  for (const [surahNumber, firstWordLine] of surahStarts.entries()) {
    const meta = SURAH_META_BY_NUMBER.get(surahNumber);
    const hasSeparateBismillah = surahNumber !== 1 && surahNumber !== 9;
    const headerLine = hasSeparateBismillah
      ? Math.max(1, firstWordLine - 2)
      : Math.max(1, firstWordLine - 1);

    rows.push({
      kind: 'surah-header',
      lineNumber: headerLine,
      surahNumber,
      surahName: meta?.name ?? `${surahNumber}-ci surə`,
      arabicSurahName: meta?.arabicName ?? `سورة ${surahNumber}`,
    });

    if (hasSeparateBismillah) {
      rows.push({
        kind: 'bismillah',
        lineNumber: Math.max(1, firstWordLine - 1),
        surahNumber,
      });
    }
  }

  for (const [lineNumber, lineTokens] of lineBuckets.entries()) {
    rows.push({
      kind: 'words',
      lineNumber,
      tokens: lineTokens,
    });
  }

  const kindOrder: Record<MuhaffizRenderRow['kind'], number> = {
    'surah-header': 0,
    bismillah: 1,
    words: 2,
  };

  rows.sort((a, b) => {
    if (a.lineNumber !== b.lineNumber) return a.lineNumber - b.lineNumber;
    return kindOrder[a.kind] - kindOrder[b.kind];
  });

  return rows;
}

export function buildTokensFromQuranComVerses(
  verses: QuranComRawVerseWithWords[]
): MushafWordToken[] {
  const tokens: MushafWordToken[] = [];

  for (const verse of verses) {
    const [rawSurah, rawAyah] = String(verse.verse_key ?? '1:1').split(':');
    const surahNumber = Number.parseInt(rawSurah, 10) || 1;
    const ayahNumber = Number.parseInt(rawAyah, 10) || 1;
    const key = `${surahNumber}:${ayahNumber}`;
    const rawWords = Array.isArray(verse.words) ? verse.words : [];

    let wordIdx = 0;
    for (let i = 0; i < rawWords.length; i++) {
      const w = rawWords[i];
      const charType: 'word' | 'end' = w.char_type_name === 'end' ? 'end' : 'word';
      const rawText = String(w.text_uthmani ?? w.text ?? '').trim();
      if (!rawText) continue;

      const lineNumber = Math.max(1, Math.min(15, Number(w.line_number) || 1));
      const { stemText, waqfMark } =
        charType === 'end'
          ? { stemText: rawText, waqfMark: '' }
          : splitWaqfMark(rawText);

      const isFirstWordOfAyah = charType === 'word' && wordIdx === 0;
      if (charType === 'word') wordIdx++;

      tokens.push({
        id: `${key}-${i}`,
        surahNumber,
        ayahNumber,
        ayahKey: key,
        wordIndex: charType === 'word' ? wordIdx - 1 : -1,
        isFirstWordOfAyah,
        textUthmani: rawText,
        stemText,
        waqfMark,
        lineNumber,
        charType,
      });
    }
  }

  return tokens;
}

/**
 * Fallback line synthesizer when word-level Madinah geometry is unavailable.
 */
export function buildSyntheticMuhaffizRows(
  pageNumber: number,
  ayahs: MushafPageAyah[]
): MuhaffizRenderRow[] {
  const groups = groupPageAyahsBySurah(ayahs);
  const rows: MuhaffizRenderRow[] = [];
  let currentLine = pageNumber <= 2 ? 2 : 1;

  for (const group of groups) {
    if (group.startsAtBeginning) {
      rows.push({
        kind: 'surah-header',
        lineNumber: currentLine++,
        surahNumber: group.surahNumber,
        surahName: group.surahName,
        arabicSurahName: group.arabicSurahName,
      });
      if (group.surahNumber !== 1 && group.surahNumber !== 9) {
        rows.push({
          kind: 'bismillah',
          lineNumber: currentLine++,
          surahNumber: group.surahNumber,
        });
      }
    }

    let lineWords: MushafWordToken[] = [];
    for (const ayah of group.ayahs) {
      const key = ayahKey(ayah);
      const words = splitAyahWords(ayah.arabicText);
      words.forEach((word, wIdx) => {
        const { stemText, waqfMark } = splitWaqfMark(word);
        lineWords.push({
          id: `${key}-w-${wIdx}`,
          surahNumber: ayah.surahNumber,
          ayahNumber: ayah.ayahNumber,
          ayahKey: key,
          wordIndex: wIdx,
          isFirstWordOfAyah: wIdx === 0,
          textUthmani: word,
          stemText,
          waqfMark,
          lineNumber: currentLine,
          charType: 'word',
        });
        if (lineWords.length >= 8) {
          rows.push({ kind: 'words', lineNumber: currentLine, tokens: lineWords });
          currentLine++;
          lineWords = [];
        }
      });

      lineWords.push({
        id: `${key}-end`,
        surahNumber: ayah.surahNumber,
        ayahNumber: ayah.ayahNumber,
        ayahKey: key,
        wordIndex: -1,
        isFirstWordOfAyah: false,
        textUthmani: toArabicIndicDigits(ayah.ayahNumber),
        stemText: toArabicIndicDigits(ayah.ayahNumber),
        waqfMark: '',
        lineNumber: currentLine,
        charType: 'end',
      });
      if (lineWords.length >= 8 || pageNumber === 1) {
        rows.push({ kind: 'words', lineNumber: currentLine, tokens: lineWords });
        currentLine++;
        lineWords = [];
      }
    }
    if (lineWords.length > 0) {
      rows.push({ kind: 'words', lineNumber: currentLine, tokens: lineWords });
      currentLine++;
    }
  }

  return rows;
}

export function getEveryAyahAudioUrl(
  surahNumber: number,
  ayahNumber: number,
  reciter: MuhaffizReciterId = 'Alafasy_128kbps'
): string {
  const s = String(Math.max(1, Math.min(114, surahNumber))).padStart(3, '0');
  const a = String(Math.max(1, ayahNumber)).padStart(3, '0');
  return `https://everyayah.com/data/${reciter}/${s}${a}.mp3`;
}

export const FATIHAT_PAGE_1_VERSES_SEED: QuranComRawVerseWithWords[] = [
  {
    verse_key: '1:1',
    juz_number: 1,
    words: [
      { text_uthmani: 'بِسْمِ', line_number: 2, char_type_name: 'word' },
      { text_uthmani: 'ٱللَّهِ', line_number: 2, char_type_name: 'word' },
      { text_uthmani: 'ٱلرَّحْمَـٰنِ', line_number: 2, char_type_name: 'word' },
      { text_uthmani: 'ٱلرَّحِيمِ', line_number: 2, char_type_name: 'word' },
      { text_uthmani: '١', line_number: 2, char_type_name: 'end' },
    ],
  },
  {
    verse_key: '1:2',
    juz_number: 1,
    words: [
      { text_uthmani: 'ٱلْحَمْدُ', line_number: 3, char_type_name: 'word' },
      { text_uthmani: 'لِلَّهِ', line_number: 3, char_type_name: 'word' },
      { text_uthmani: 'رَبِّ', line_number: 3, char_type_name: 'word' },
      { text_uthmani: 'ٱلْعَـٰلَمِينَ', line_number: 3, char_type_name: 'word' },
      { text_uthmani: '٢', line_number: 3, char_type_name: 'end' },
    ],
  },
  {
    verse_key: '1:3',
    juz_number: 1,
    words: [
      { text_uthmani: 'ٱلرَّحْمَـٰنِ', line_number: 4, char_type_name: 'word' },
      { text_uthmani: 'ٱلرَّحِيمِ', line_number: 4, char_type_name: 'word' },
      { text_uthmani: '٣', line_number: 4, char_type_name: 'end' },
    ],
  },
  {
    verse_key: '1:4',
    juz_number: 1,
    words: [
      { text_uthmani: 'مَـٰلِكِ', line_number: 4, char_type_name: 'word' },
      { text_uthmani: 'يَوْمِ', line_number: 4, char_type_name: 'word' },
      { text_uthmani: 'ٱلدِّينِ', line_number: 4, char_type_name: 'word' },
      { text_uthmani: '٤', line_number: 4, char_type_name: 'end' },
    ],
  },
  {
    verse_key: '1:5',
    juz_number: 1,
    words: [
      { text_uthmani: 'إِيَّاكَ', line_number: 5, char_type_name: 'word' },
      { text_uthmani: 'نَعْبُدُ', line_number: 5, char_type_name: 'word' },
      { text_uthmani: 'وَإِيَّاكَ', line_number: 5, char_type_name: 'word' },
      { text_uthmani: 'نَسْتَعِينُ', line_number: 5, char_type_name: 'word' },
      { text_uthmani: '٥', line_number: 5, char_type_name: 'end' },
    ],
  },
  {
    verse_key: '1:6',
    juz_number: 1,
    words: [
      { text_uthmani: 'ٱهْدِنَا', line_number: 6, char_type_name: 'word' },
      { text_uthmani: 'ٱلصِّرَٰطَ', line_number: 6, char_type_name: 'word' },
      { text_uthmani: 'ٱلْمُسْتَقِيمَ', line_number: 6, char_type_name: 'word' },
      { text_uthmani: '٦', line_number: 6, char_type_name: 'end' },
    ],
  },
  {
    verse_key: '1:7',
    juz_number: 1,
    words: [
      { text_uthmani: 'صِرَٰطَ', line_number: 7, char_type_name: 'word' },
      { text_uthmani: 'ٱلَّذِينَ', line_number: 7, char_type_name: 'word' },
      { text_uthmani: 'أَنْعَمْتَ', line_number: 7, char_type_name: 'word' },
      { text_uthmani: 'عَلَيْهِمْ', line_number: 7, char_type_name: 'word' },
      { text_uthmani: 'غَيْرِ', line_number: 7, char_type_name: 'word' },
      { text_uthmani: 'ٱلْمَغْضُوبِ', line_number: 8, char_type_name: 'word' },
      { text_uthmani: 'عَلَيْهِمْ', line_number: 8, char_type_name: 'word' },
      { text_uthmani: 'وَلَا', line_number: 8, char_type_name: 'word' },
      { text_uthmani: 'ٱلضَّآلِّينَ', line_number: 8, char_type_name: 'word' },
      { text_uthmani: '٧', line_number: 8, char_type_name: 'end' },
    ],
  },
];

export const FATIHAT_PAGE_1_SEED: MushafPagePayload = {
  pageNumber: 1,
  juzNumber: 1,
  surahsOnPage: [
    {
      surahNumber: 1,
      surahName: 'Fatihə',
      arabicName: 'سُورَةُ ٱلْفَاتِحَةِ',
    },
  ],
  translatorName: 'Əlixan Musayev',
  editionVersion: '1.0.4',
  ayahs: [
    {
      surahNumber: 1,
      surahName: 'Fatihə',
      arabicSurahName: 'سُورَةُ ٱلْفَاتِحَةِ',
      ayahNumber: 1,
      juzNumber: 1,
      arabicText: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
      translation: 'Mərhəmətli və Rəhmli Allahın adı ilə!',
      footnotes: '',
    },
    {
      surahNumber: 1,
      surahName: 'Fatihə',
      arabicSurahName: 'سُورَةُ ٱلْفَاتِحَةِ',
      ayahNumber: 2,
      juzNumber: 1,
      arabicText: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ',
      translation: 'Həmd olsun aləmlərin Rəbbi Allaha,',
      footnotes: '',
    },
    {
      surahNumber: 1,
      surahName: 'Fatihə',
      arabicSurahName: 'سُورَةُ ٱلْفَاتِحَةِ',
      ayahNumber: 3,
      juzNumber: 1,
      arabicText: 'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
      translation: 'Mərhəmətli və Rəhmliyə,',
      footnotes: '',
    },
    {
      surahNumber: 1,
      surahName: 'Fatihə',
      arabicSurahName: 'سُورَةُ ٱلْفَاتِحَةِ',
      ayahNumber: 4,
      juzNumber: 1,
      arabicText: 'مَـٰلِكِ يَوْمِ ٱلدِّينِ',
      translation: 'Haqq-hesab gününün Hökmdarına!',
      footnotes: '',
    },
    {
      surahNumber: 1,
      surahName: 'Fatihə',
      arabicSurahName: 'سُورَةُ ٱلْفَاتِحَةِ',
      ayahNumber: 5,
      juzNumber: 1,
      arabicText: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
      translation: 'Biz yalnız Sənə ibadət edir və yalnız Səndən kömək diləyirik.',
      footnotes: '',
    },
    {
      surahNumber: 1,
      surahName: 'Fatihə',
      arabicSurahName: 'سُورَةُ ٱلْفَاتِحَةِ',
      ayahNumber: 6,
      juzNumber: 1,
      arabicText: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ',
      translation: 'Bizi doğru yola yönəlt —',
      footnotes: '',
    },
    {
      surahNumber: 1,
      surahName: 'Fatihə',
      arabicSurahName: 'سُورَةُ ٱلْفَاتِحَةِ',
      ayahNumber: 7,
      juzNumber: 1,
      arabicText:
        'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
      translation:
        'nemət bəxş etdiyin şəxslərin yoluna, qəzəbə uğramışların və azmışların yoluna deyil!',
      footnotes: '',
    },
  ],
};

export const FATIHAT_PAGE_1_MUHAFFIZ_SEED: MuhaffizPageData = {
  ...FATIHAT_PAGE_1_SEED,
  rows: groupTokensIntoMushafRows(buildTokensFromQuranComVerses(FATIHAT_PAGE_1_VERSES_SEED)),
  centeredPage: true,
};
