import {
  MushafPageAyah,
  MushafPagePayload,
  SURAH_CATALOG,
  TOTAL_QURAN_PAGES,
} from './quran';

export type MuhaffizFontSize = 'sm' | 'md' | 'lg';
export type MuhaffizRevealMode = 'word' | 'ayah';
export type MuhaffizPaperTheme = 'cream' | 'white' | 'black';
export type MuhaffizReciterId =
  | 'Alafasy_128kbps'
  | 'Husary_128kbps'
  | 'Minshawy_Murattal_128kbps';

export interface MuhaffizPreferences {
  revealMode: MuhaffizRevealMode;
  firstWordHint: boolean;
  showTranslation: boolean;
  autoRevealAllOnLoad: boolean;
  silentMode: boolean;
  silentSpeedSec: number;
  paperTheme: MuhaffizPaperTheme;
  fontSize: MuhaffizFontSize;
  autoIntervalMs: number;
  reciter: MuhaffizReciterId;
}

export const MUHAFFIZ_SILENT_SPEEDS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5] as const;

export const MUHAFFIZ_THEME_PALETTES: Record<
  MuhaffizPaperTheme,
  {
    label: string;
    paper: string;
    ink: string;
    bar: string;
    card: string;
    line: string;
    muted: string;
    fresh: string;
    chip: string;
    green: string;
    gold: string;
    isDark: boolean;
  }
> = {
  cream: {
    label: 'Krem',
    paper: '#fffaf0',
    ink: '#1a1612',
    bar: '#fffaf1',
    card: '#fffdf7',
    line: '#e2d3b6',
    muted: '#6d5c45',
    fresh: '#f3e2b3',
    chip: '#fffaf1',
    green: '#1c3d32',
    gold: '#c4a35a',
    isDark: false,
  },
  white: {
    label: 'Ağ',
    paper: '#ffffff',
    ink: '#161616',
    bar: '#ffffff',
    card: '#fafafa',
    line: '#e4e4e4',
    muted: '#5c5c5c',
    fresh: '#ececec',
    chip: '#ffffff',
    green: '#1c3d32',
    gold: '#c4a35a',
    isDark: false,
  },
  black: {
    label: 'Qara',
    paper: '#111111',
    ink: '#f4efe4',
    bar: '#1a1a1a',
    card: '#191815',
    line: '#3a342c',
    muted: '#cbbfa8',
    fresh: '#3a3424',
    chip: '#1c1c1c',
    green: '#d5e0da',
    gold: '#c4a35a',
    isDark: true,
  },
};

export const DEFAULT_MUHAFFIZ_PREFS: MuhaffizPreferences = {
  revealMode: 'word',
  firstWordHint: false,
  showTranslation: false,
  autoRevealAllOnLoad: false,
  silentMode: true,
  silentSpeedSec: 1.5,
  paperTheme: 'cream',
  fontSize: 'md',
  autoIntervalMs: 1500,
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
  codeV2Full: string;
  codeV2Stem: string;
  codeV2Waqf: string;
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
  code_v1?: string;
  code_v2?: string;
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

export function getQcfFontUrl(pageNumber: number): string {
  const clean = clampMuhaffizPage(pageNumber);
  return `https://verses.quran.foundation/fonts/quran/hafs/v1/woff2/p${clean}.woff2`;
}

export const getQcfV2FontUrl = getQcfFontUrl;

export const UTHMANIC_HAFS_FONT_URL =
  'https://verses.quran.foundation/fonts/quran/hafs/uthmanic_hafs/UthmanicHafs1Ver18.woff2';

/**
 * Separates standalone trailing Quranic pause/waqf annotation marks (e.g. "رَيْبَ ۛ" -> stem "رَيْبَ", waqf "ۛ")
 * so masked words keep consonant underlines while pause signs remain visible above the line.
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

/**
 * Splits a QCF v2 code string when a trailing standalone waqf mark glyph is attached
 * (e.g. "ﱆﱇ" for "رَيْبَ ۛ" -> stem "ﱆ", waqf "ﱇ").
 */
export function splitCodeV2Waqf(
  codeV2: string,
  hasTextWaqf: boolean
): { codeV2Stem: string; codeV2Waqf: string } {
  const trimmed = (codeV2 ?? '').trim();
  if (!trimmed) return { codeV2Stem: '', codeV2Waqf: '' };
  if (hasTextWaqf) {
    const chars = Array.from(trimmed);
    if (chars.length >= 2) {
      const waqf = chars.pop() ?? '';
      return {
        codeV2Stem: chars.join(''),
        codeV2Waqf: waqf,
      };
    }
  }
  return {
    codeV2Stem: trimmed,
    codeV2Waqf: '',
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

export function orderedWordTokens(rows: MuhaffizRenderRow[]): MushafWordToken[] {
  const words: MushafWordToken[] = [];
  for (const row of rows) {
    if (row.kind !== 'words') continue;
    for (const token of row.tokens) {
      if (token.charType === 'word') {
        words.push(token);
      }
    }
  }
  return words;
}

export function revealNextWord(
  wordTokens: MushafWordToken[],
  revealedTokenIds: Set<string>
): Set<string> {
  for (const token of wordTokens) {
    if (!revealedTokenIds.has(token.id)) {
      const next = new Set(revealedTokenIds);
      next.add(token.id);
      return next;
    }
  }
  return revealedTokenIds;
}

export function hideLastWord(
  wordTokens: MushafWordToken[],
  revealedTokenIds: Set<string>
): Set<string> {
  for (let i = wordTokens.length - 1; i >= 0; i--) {
    if (revealedTokenIds.has(wordTokens[i].id)) {
      const next = new Set(revealedTokenIds);
      next.delete(wordTokens[i].id);
      return next;
    }
  }
  return revealedTokenIds;
}

export function revealNextAyahTokens(
  ayahs: MushafPageAyah[],
  wordTokens: MushafWordToken[],
  revealedTokenIds: Set<string>
): Set<string> {
  for (const ayah of ayahs) {
    const key = ayahKey(ayah);
    const tokensForAyah = wordTokens.filter((t) => t.ayahKey === key);
    if (tokensForAyah.some((t) => !revealedTokenIds.has(t.id))) {
      const next = new Set(revealedTokenIds);
      for (const t of tokensForAyah) next.add(t.id);
      return next;
    }
  }
  return revealedTokenIds;
}

export function hideLastAyahTokens(
  ayahs: MushafPageAyah[],
  wordTokens: MushafWordToken[],
  revealedTokenIds: Set<string>
): Set<string> {
  for (let i = ayahs.length - 1; i >= 0; i--) {
    const key = ayahKey(ayahs[i]);
    const tokensForAyah = wordTokens.filter((t) => t.ayahKey === key);
    if (tokensForAyah.some((t) => revealedTokenIds.has(t.id))) {
      const next = new Set(revealedTokenIds);
      for (const t of tokensForAyah) next.delete(t.id);
      return next;
    }
  }
  return revealedTokenIds;
}

export function revealNextStep(
  mode: MuhaffizRevealMode,
  ayahs: MushafPageAyah[],
  wordTokens: MushafWordToken[],
  revealedTokenIds: Set<string>
): Set<string> {
  return mode === 'word'
    ? revealNextWord(wordTokens, revealedTokenIds)
    : revealNextAyahTokens(ayahs, wordTokens, revealedTokenIds);
}

export function hideLastStep(
  mode: MuhaffizRevealMode,
  ayahs: MushafPageAyah[],
  wordTokens: MushafWordToken[],
  revealedTokenIds: Set<string>
): Set<string> {
  return mode === 'word'
    ? hideLastWord(wordTokens, revealedTokenIds)
    : hideLastAyahTokens(ayahs, wordTokens, revealedTokenIds);
}

export function toggleWordToken(revealedTokenIds: Set<string>, tokenId: string): Set<string> {
  const next = new Set(revealedTokenIds);
  if (next.has(tokenId)) {
    next.delete(tokenId);
  } else {
    next.add(tokenId);
  }
  return next;
}

export function toggleEntireAyahTokens(
  wordTokens: MushafWordToken[],
  revealedTokenIds: Set<string>,
  targetAyahKey: string
): Set<string> {
  const tokensForAyah = wordTokens.filter((t) => t.ayahKey === targetAyahKey);
  if (tokensForAyah.length === 0) return revealedTokenIds;
  const allRevealed = tokensForAyah.every((t) => revealedTokenIds.has(t.id));
  const next = new Set(revealedTokenIds);
  for (const t of tokensForAyah) {
    if (allRevealed) {
      next.delete(t.id);
    } else {
      next.add(t.id);
    }
  }
  return next;
}

export function revealEntireAyahTokens(
  wordTokens: MushafWordToken[],
  revealedTokenIds: Set<string>,
  targetAyahKey: string
): Set<string> {
  const tokensForAyah = wordTokens.filter((t) => t.ayahKey === targetAyahKey);
  if (tokensForAyah.length === 0) return revealedTokenIds;
  const next = new Set(revealedTokenIds);
  for (const t of tokensForAyah) {
    next.add(t.id);
  }
  return next;
}

export function isAyahRevealed(
  targetAyahKey: string,
  wordTokens: MushafWordToken[],
  revealedTokenIds: Set<string>
): boolean {
  const tokensForAyah = wordTokens.filter((t) => t.ayahKey === targetAyahKey);
  return tokensForAyah.length > 0 && tokensForAyah.every((t) => revealedTokenIds.has(t.id));
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
  const surahStarts = new Map<number, number>();

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
      const rawCodeV2 = String(w.code_v1 ?? w.code_v2 ?? '').trim();
      if (!rawText && !rawCodeV2) continue;

      const lineNumber = Math.max(1, Math.min(15, Number(w.line_number) || 1));
      const { stemText, waqfMark } =
        charType === 'end'
          ? { stemText: rawText, waqfMark: '' }
          : splitWaqfMark(rawText);

      const { codeV2Stem, codeV2Waqf } =
        charType === 'end'
          ? { codeV2Stem: rawCodeV2, codeV2Waqf: '' }
          : splitCodeV2Waqf(rawCodeV2, waqfMark.length > 0);

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
        codeV2Full: rawCodeV2,
        codeV2Stem,
        codeV2Waqf,
        lineNumber,
        charType,
      });
    }
  }

  return tokens;
}

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
          codeV2Full: '',
          codeV2Stem: '',
          codeV2Waqf: '',
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
        codeV2Full: '',
        codeV2Stem: '',
        codeV2Waqf: '',
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
      { code_v1: 'ﭑ', text_uthmani: 'بِسْمِ', line_number: 2, char_type_name: 'word' },
      { code_v1: 'ﭒ', text_uthmani: 'ٱللَّهِ', line_number: 2, char_type_name: 'word' },
      { code_v1: 'ﭓ', text_uthmani: 'ٱلرَّحْمَـٰنِ', line_number: 2, char_type_name: 'word' },
      { code_v1: 'ﭔ', text_uthmani: 'ٱلرَّحِيمِ', line_number: 2, char_type_name: 'word' },
      { code_v1: 'ﭕ', text_uthmani: '١', line_number: 2, char_type_name: 'end' },
    ],
  },
  {
    verse_key: '1:2',
    juz_number: 1,
    words: [
      { code_v1: 'ﭖ', text_uthmani: 'ٱلْحَمْدُ', line_number: 3, char_type_name: 'word' },
      { code_v1: 'ﭗ', text_uthmani: 'لِلَّهِ', line_number: 3, char_type_name: 'word' },
      { code_v1: 'ﭘ', text_uthmani: 'رَبِّ', line_number: 3, char_type_name: 'word' },
      { code_v1: 'ﭙ', text_uthmani: 'ٱلْعَـٰلَمِينَ', line_number: 3, char_type_name: 'word' },
      { code_v1: 'ﭚ', text_uthmani: '٢', line_number: 3, char_type_name: 'end' },
    ],
  },
  {
    verse_key: '1:3',
    juz_number: 1,
    words: [
      { code_v1: 'ﭛ', text_uthmani: 'ٱلرَّحْمَـٰنِ', line_number: 4, char_type_name: 'word' },
      { code_v1: 'ﭜ', text_uthmani: 'ٱلرَّحِيمِ', line_number: 4, char_type_name: 'word' },
      { code_v1: 'ﭝ', text_uthmani: '٣', line_number: 4, char_type_name: 'end' },
    ],
  },
  {
    verse_key: '1:4',
    juz_number: 1,
    words: [
      { code_v1: 'ﭞ', text_uthmani: 'مَـٰلِكِ', line_number: 4, char_type_name: 'word' },
      { code_v1: 'ﭟ', text_uthmani: 'يَوْمِ', line_number: 4, char_type_name: 'word' },
      { code_v1: 'ﭠ', text_uthmani: 'ٱلدِّينِ', line_number: 4, char_type_name: 'word' },
      { code_v1: 'ﭡ', text_uthmani: '٤', line_number: 4, char_type_name: 'end' },
    ],
  },
  {
    verse_key: '1:5',
    juz_number: 1,
    words: [
      { code_v1: 'ﭢ', text_uthmani: 'إِيَّاكَ', line_number: 5, char_type_name: 'word' },
      { code_v1: 'ﭣ', text_uthmani: 'نَعْبُدُ', line_number: 5, char_type_name: 'word' },
      { code_v1: 'ﭤ', text_uthmani: 'وَإِيَّاكَ', line_number: 5, char_type_name: 'word' },
      { code_v1: 'ﭥ', text_uthmani: 'نَسْتَعِينُ', line_number: 5, char_type_name: 'word' },
      { code_v1: 'ﭦ', text_uthmani: '٥', line_number: 5, char_type_name: 'end' },
    ],
  },
  {
    verse_key: '1:6',
    juz_number: 1,
    words: [
      { code_v1: 'ﭧ', text_uthmani: 'ٱهْدِنَا', line_number: 5, char_type_name: 'word' },
      { code_v1: 'ﭨ', text_uthmani: 'ٱلصِّرَٰطَ', line_number: 6, char_type_name: 'word' },
      { code_v1: 'ﭩ', text_uthmani: 'ٱلْمُسْتَقِيمَ', line_number: 6, char_type_name: 'word' },
      { code_v1: 'ﭪ', text_uthmani: '٦', line_number: 6, char_type_name: 'end' },
    ],
  },
  {
    verse_key: '1:7',
    juz_number: 1,
    words: [
      { code_v1: 'ﭫ', text_uthmani: 'صِرَٰطَ', line_number: 6, char_type_name: 'word' },
      { code_v1: 'ﭬ', text_uthmani: 'ٱلَّذِينَ', line_number: 6, char_type_name: 'word' },
      { code_v1: 'ﭭ', text_uthmani: 'أَنْعَمْتَ', line_number: 6, char_type_name: 'word' },
      { code_v1: 'ﭮ', text_uthmani: 'عَلَيْهِمْ', line_number: 7, char_type_name: 'word' },
      { code_v1: 'ﭯ', text_uthmani: 'غَيْرِ', line_number: 7, char_type_name: 'word' },
      { code_v1: 'ﭰ', text_uthmani: 'ٱلْمَغْضُوبِ', line_number: 7, char_type_name: 'word' },
      { code_v1: 'ﭱ', text_uthmani: 'عَلَيْهِمْ', line_number: 7, char_type_name: 'word' },
      { code_v1: 'ﭲ', text_uthmani: 'وَلَا', line_number: 8, char_type_name: 'word' },
      { code_v1: 'ﭳ', text_uthmani: 'ٱلضَّآلِّينَ', line_number: 8, char_type_name: 'word' },
      { code_v1: 'ﭴ', text_uthmani: '٧', line_number: 8, char_type_name: 'end' },
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

/**
 * Returns private-use codepoint pair for `/muhaffiz/sura_names.woff2`:
 * prefix glyph '\uE000' ("سورة") + BCD-hex offset for surah number 1..114.
 */
export function getSurahBannerGlyphs(surahNumber: number): {
  prefixGlyph: string;
  nameGlyph: string;
} {
  const clean = Math.min(114, Math.max(1, Math.trunc(surahNumber || 1)));
  const hexOffset = Number.parseInt(String(clean), 16);
  return {
    prefixGlyph: '\uE000',
    nameGlyph: String.fromCharCode(0xe000 + hexOffset),
  };
}

export interface MissedWordRecord {
  tokenId: string;
  ayahKey: string;
  pageNumber: number;
  surahName: string;
  stemText: string;
  createdAt: string;
}

export function toggleMissedWordRecord(
  existing: MissedWordRecord[],
  record: MissedWordRecord,
  maxItems = 80
): MissedWordRecord[] {
  const found = existing.some((item) => item.tokenId === record.tokenId);
  if (found) {
    return existing.filter((item) => item.tokenId !== record.tokenId);
  }
  return [record, ...existing].slice(0, maxItems);
}

/**
 * Strips Quranic diacritics/harakat and normalizes hamza/alef/teh variants
 * for resilient browser SpeechRecognition matching against Arabic Mushaf words.
 */
export function normalizeArabicForSpeech(input: string): string {
  return (input || '')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u0610-\u061A]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\u0621-\u064A\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarityRatio(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) {
    return Math.min(a.length, b.length) / Math.max(a.length, b.length);
  }
  let matches = 0;
  const maxLen = Math.max(a.length, b.length);
  const minLen = Math.min(a.length, b.length);
  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / maxLen;
}

/**
 * Advances sequentially across Mushaf page word tokens given a recognized Arabic transcript,
 * revealing matched words and optionally surfacing intermediate skipped words.
 */
export function matchSpokenArabicAgainstTokens(
  transcript: string,
  wordTokens: MushafWordToken[],
  cursorIndex: number
): {
  nextCursorIndex: number;
  matchedTokenIds: string[];
  skippedTokens: MushafWordToken[];
} {
  const spokenWords = normalizeArabicForSpeech(transcript)
    .split(' ')
    .filter((w) => w.length > 0);
  if (spokenWords.length === 0 || wordTokens.length === 0) {
    return { nextCursorIndex: cursorIndex, matchedTokenIds: [], skippedTokens: [] };
  }

  let cursor = Math.max(0, Math.min(cursorIndex, wordTokens.length - 1));
  const matchedTokenIds: string[] = [];
  const skippedTokens: MushafWordToken[] = [];

  for (const spoken of spokenWords) {
    if (cursor >= wordTokens.length) break;
    const lookaheadLimit = Math.min(wordTokens.length, cursor + 4);
    let foundIdx = -1;
    let bestScore = 0;
    for (let idx = cursor; idx < lookaheadLimit; idx++) {
      const target = normalizeArabicForSpeech(wordTokens[idx].stemText);
      const score = spoken === target ? 1 : similarityRatio(spoken, target);
      if (score === 1) {
        foundIdx = idx;
        bestScore = 1;
        break;
      }
      if (score >= 0.75 && score > bestScore) {
        bestScore = score;
        foundIdx = idx;
      }
    }
    if (foundIdx >= 0) {
      for (let skip = cursor; skip < foundIdx; skip++) {
        skippedTokens.push(wordTokens[skip]);
        matchedTokenIds.push(wordTokens[skip].id);
      }
      matchedTokenIds.push(wordTokens[foundIdx].id);
      cursor = foundIdx + 1;
    }
  }

  return {
    nextCursorIndex: cursor,
    matchedTokenIds,
    skippedTokens,
  };
}

export interface PlaybackAyahStepInput {
  currentIndex: number;
  remainingRepeats: number;
  totalAyahs: number;
  repeatCount: number;
  rangeStartIndex?: number;
  rangeEndIndex?: number;
  loopRange?: boolean;
}

export function getNextPlaybackAyahStep(input: PlaybackAyahStepInput): {
  action: 'repeat' | 'advance' | 'loop-start' | 'stop';
  nextIndex: number;
  nextRemainingRepeats: number;
} {
  const { currentIndex, remainingRepeats, totalAyahs, repeatCount, loopRange = false } = input;
  if (totalAyahs <= 0) {
    return { action: 'stop', nextIndex: -1, nextRemainingRepeats: 0 };
  }
  const rawStart = Math.max(0, Math.min(totalAyahs - 1, input.rangeStartIndex ?? 0));
  const rawEnd = Math.max(rawStart, Math.min(totalAyahs - 1, input.rangeEndIndex ?? totalAyahs - 1));

  if (remainingRepeats === 0) {
    return { action: 'repeat', nextIndex: currentIndex, nextRemainingRepeats: 0 };
  }
  if (remainingRepeats > 1) {
    return { action: 'repeat', nextIndex: currentIndex, nextRemainingRepeats: remainingRepeats - 1 };
  }
  if (currentIndex + 1 <= rawEnd) {
    return { action: 'advance', nextIndex: currentIndex + 1, nextRemainingRepeats: repeatCount };
  }
  if (loopRange) {
    return { action: 'loop-start', nextIndex: rawStart, nextRemainingRepeats: repeatCount };
  }
  return { action: 'stop', nextIndex: -1, nextRemainingRepeats: 0 };
}


