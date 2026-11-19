export type TajweedRuleKey = 'ghunnah' | 'qalqalah' | 'ikhfa' | 'idgham' | 'madd';

export interface TajweedRuleMeta {
  key: TajweedRuleKey;
  label: string;
  arabicLabel: string;
  description: string;
  textClass: string;
  swatchClass: string;
}

export interface TajweedSegment {
  text: string;
  rule: TajweedRuleKey | null;
}

export const TAJWEED_RULES: Record<TajweedRuleKey, TajweedRuleMeta> = {
  ghunnah: {
    key: 'ghunnah',
    label: 'Ğünnə (Şəddəli نّ / مّ)',
    arabicLabel: 'غُنَّة',
    description: 'Şəddəli Nun və Mim hərflərində burun boşluğundan 2 hərəkat səs uzadılır.',
    textClass: 'text-[#0B6E4F] dark:text-[#4ADE80]',
    swatchClass: 'bg-[#0B6E4F] dark:bg-[#4ADE80]',
  },
  qalqalah: {
    key: 'qalqalah',
    label: 'Qalqələ (ق ط ب ج د)',
    arabicLabel: 'قَلْقَلَة',
    description: 'Sükunlu və ya dayanılan ق ط ب ج د hərflərində yüngül əks-səda vurğusu edilir.',
    textClass: 'text-[#1D4ED8] dark:text-[#60A5FA]',
    swatchClass: 'bg-[#1D4ED8] dark:bg-[#60A5FA]',
  },
  ikhfa: {
    key: 'ikhfa',
    label: 'İxfa',
    arabicLabel: 'إِخْفَاء',
    description: 'Sükunlu Nun və ya Tənvin 15 ixfa hərfindən əvvəl gəldikdə gizli və burun səsi ilə oxunur.',
    textClass: 'text-[#B45309] dark:text-[#FBBF24]',
    swatchClass: 'bg-[#B45309] dark:bg-[#FBBF24]',
  },
  idgham: {
    key: 'idgham',
    label: 'İdğam (ي ر م ل و ن)',
    arabicLabel: 'إِدْغَام',
    description: 'Sükunlu Nun və ya Tənvin يرملون hərflərindən birinə qovuşdurularaq oxunur.',
    textClass: 'text-[#7E22CE] dark:text-[#C084FC]',
    swatchClass: 'bg-[#7E22CE] dark:bg-[#C084FC]',
  },
  madd: {
    key: 'madd',
    label: 'Mədd (Uzatma)',
    arabicLabel: 'مَدّ',
    description: 'Mədd işarəsi və ya xəncər əlif daşıyan hərflər 2–6 hərəkat uzadılır.',
    textClass: 'text-[#B91C1C] dark:text-[#FB7185]',
    swatchClass: 'bg-[#B91C1C] dark:bg-[#FB7185]',
  },
};

export const TAJWEED_RULE_ORDER: TajweedRuleKey[] = [
  'ghunnah',
  'qalqalah',
  'ikhfa',
  'idgham',
  'madd',
];

const ARABIC_BASE_LETTER_RE = /[\u0621-\u064A\u066E-\u0673\u0675-\u06D3]/;
const ARABIC_DIACRITIC_RE = /[\u064B-\u065F\u0670\u06D6-\u06ED]/;

const SHADDA = '\u0651';
const SUKUN = '\u0652';
const MADDAH = '\u0653';
const DAGGER_ALIF = '\u0670';
const ALIF_MADDAH = '\u0622';
const TANWEEN_CHARS = new Set(['\u064B', '\u064C', '\u064D']);
const SHORT_VOWELS = new Set([
  '\u064E', // fatha
  '\u064F', // damma
  '\u0650', // kasra
  '\u064B', // fathatan
  '\u064C', // dammatan
  '\u064D', // kasratan
]);

const QALQALAH_LETTERS = new Set(['ق', 'ط', 'ب', 'ج', 'د']);
const IDGHAM_LETTERS = new Set(['ي', 'ر', 'م', 'ل', 'و', 'ن']);
const IKHFA_LETTERS = new Set([
  'ت',
  'ث',
  'ج',
  'د',
  'ذ',
  'ز',
  'س',
  'ش',
  'ص',
  'ض',
  'ط',
  'ظ',
  'ف',
  'ق',
  'ك',
]);

interface ArabicCluster {
  text: string;
  isLetter: boolean;
  base: string;
  marks: string;
}

function normalizeArabicBase(ch: string): string {
  if (ch === 'ٱ' || ch === 'أ' || ch === 'إ' || ch === 'آ') return 'ا';
  if (ch === 'ى') return 'ي';
  return ch;
}

function splitIntoClusters(input: string): ArabicCluster[] {
  const chars = Array.from(input);
  const clusters: ArabicCluster[] = [];
  let i = 0;

  while (i < chars.length) {
    const ch = chars[i];
    let text = ch;
    let marks = '';
    const isLetter = ARABIC_BASE_LETTER_RE.test(ch);
    i += 1;

    while (i < chars.length && ARABIC_DIACRITIC_RE.test(chars[i])) {
      text += chars[i];
      marks += chars[i];
      i += 1;
    }

    clusters.push({
      text,
      isLetter,
      base: ch,
      marks,
    });
  }

  return clusters;
}

function findNextLetterCluster(clusters: ArabicCluster[], index: number): ArabicCluster | null {
  for (let j = index + 1; j < clusters.length; j++) {
    const c = clusters[j];
    if (c.isLetter) return c;
    // Do not cross ayah end punctuation if it's non-space punctuation like ayah marker
    if (c.text !== ' ' && c.text !== '\u00A0' && !/\s/.test(c.text)) {
      // Allow waqf marks (06D6..06ED) attached to letters already; break on numeric markers
      if (/[0-9\u0660-\u0669\u06DD]/.test(c.text)) return null;
    }
  }
  return null;
}

function hasAnyMark(marks: string, set: Set<string>): boolean {
  for (const ch of marks) {
    if (set.has(ch)) return true;
  }
  return false;
}

/**
 * Tokenizes Uthmani Arabic Quran text into deterministic Tajweed color-coded segments.
 * Preserves exact input characters: `segments.map(s => s.text).join('') === arabicText`.
 */
export function tokenizeTajweedSegments(arabicText: string): TajweedSegment[] {
  if (!arabicText) return [];
  const clusters = splitIntoClusters(arabicText);
  const rawSegments: TajweedSegment[] = [];

  for (let i = 0; i < clusters.length; i++) {
    const cur = clusters[i];
    if (!cur.isLetter) {
      rawSegments.push({ text: cur.text, rule: null });
      continue;
    }

    let rule: TajweedRuleKey | null = null;
    const hasShadda = cur.marks.includes(SHADDA);
    const hasSukun = cur.marks.includes(SUKUN);
    const hasMaddah = cur.marks.includes(MADDAH) || cur.base === ALIF_MADDAH || cur.marks.includes(DAGGER_ALIF);
    const hasTanween = hasAnyMark(cur.marks, TANWEEN_CHARS);
    const hasShortVowel = hasAnyMark(cur.marks, SHORT_VOWELS);

    // 1. Madd (explicit maddah / dagger alif / alif maddah)
    if (hasMaddah) {
      rule = 'madd';
    }
    // 2. Ghunnah (Noon or Meem with Shadda)
    else if ((cur.base === 'ن' || cur.base === 'م') && hasShadda) {
      rule = 'ghunnah';
    }
    // 3. Noon Sakinah or Tanween followed by Idgham / Ikhfa letters
    else if ((cur.base === 'ن' && (hasSukun || (!hasShortVowel && !hasShadda))) || hasTanween) {
      const nextLetter = findNextLetterCluster(clusters, i);
      const nextBase = nextLetter ? normalizeArabicBase(nextLetter.base) : '';
      if (nextBase && IDGHAM_LETTERS.has(nextBase)) {
        rule = 'idgham';
      } else if (nextBase && IKHFA_LETTERS.has(nextBase)) {
        rule = 'ikhfa';
      }
    }
    // 4. Qalqalah (Qaf, Taa, Baa, Jeem, Dal with sukun or silent stop before end of ayah)
    if (!rule && QALQALAH_LETTERS.has(cur.base)) {
      const nextLetter = findNextLetterCluster(clusters, i);
      const isFinalNonVoweled = !nextLetter && !hasShortVowel && !hasShadda;
      if (hasSukun || isFinalNonVoweled) {
        rule = 'qalqalah';
      }
    }

    rawSegments.push({ text: cur.text, rule });
  }

  // Merge adjacent segments that share the same rule to keep DOM compact
  const merged: TajweedSegment[] = [];
  for (const seg of rawSegments) {
    const prev = merged[merged.length - 1];
    if (prev && prev.rule === seg.rule) {
      prev.text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}
