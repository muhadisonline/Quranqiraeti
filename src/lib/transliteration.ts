const WAQF_MARKS_REGEX = /[\u0610-\u061A\u0640\u06D6-\u06ED\u08D4-\u08FF]/g;

const SUN_LETTERS = new Set([
  'ت',
  'ث',
  'د',
  'ذ',
  'ر',
  'ز',
  'س',
  'ش',
  'ص',
  'ض',
  'ط',
  'ظ',
  'ل',
  'ن',
]);

const EMPHATIC_LETTERS = new Set(['خ', 'ص', 'ض', 'ط', 'ظ', 'غ', 'ق']);

const CONSONANT_MAP: Record<string, string> = {
  ب: 'b',
  ت: 't',
  ث: 's',
  ج: 'c',
  ح: 'h',
  خ: 'x',
  د: 'd',
  ذ: 'z',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'ş',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'ğ',
  ف: 'f',
  ق: 'q',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  ة: 't',
  و: 'v',
  ي: 'y',
  ئ: 'y',
  ؤ: 'v',
  ء: '',
  أ: '',
  إ: '',
  آ: 'a',
  ا: '',
  ٱ: '',
  ى: 'y',
};

const FATHA = '\u064E';
const DAMMA = '\u064F';
const KASRA = '\u0650';
const FATHATAN = '\u064B';
const DAMMATAN = '\u064C';
const KASRATAN = '\u064D';
const SHADDA = '\u0651';
const SUKUN = '\u0652';
const DAGGER_ALIF = '\u0670';
const MADDAH = '\u0653';
const HAMZA_ABOVE = '\u0654';
const HAMZA_BELOW = '\u0655';

const HARAKAT_SET = new Set([
  FATHA,
  DAMMA,
  KASRA,
  FATHATAN,
  DAMMATAN,
  KASRATAN,
  SHADDA,
  SUKUN,
  DAGGER_ALIF,
  MADDAH,
  HAMZA_ABOVE,
  HAMZA_BELOW,
]);

interface ArabicCluster {
  base: string;
  marks: string[];
}

function tokenizeArabicWord(word: string): ArabicCluster[] {
  const clusters: ArabicCluster[] = [];
  for (const ch of word) {
    if (HARAKAT_SET.has(ch)) {
      if (clusters.length > 0) {
        clusters[clusters.length - 1].marks.push(ch);
      }
    } else if (CONSONANT_MAP[ch] !== undefined) {
      clusters.push({ base: ch, marks: [] });
    }
  }
  return clusters;
}

function getVowelFromMarks(marks: string[], isHeavy: boolean, isWordEnd: boolean): string {
  const hasDagger = marks.includes(DAGGER_ALIF);
  if (marks.includes(FATHATAN)) return isHeavy ? 'an' : 'ən';
  if (marks.includes(KASRATAN)) return 'in';
  if (marks.includes(DAMMATAN)) return 'un';
  if (marks.includes(FATHA) || hasDagger) {
    return isHeavy ? 'a' : 'ə';
  }
  if (marks.includes(KASRA)) return 'i';
  if (marks.includes(DAMMA)) return 'u';
  if (isWordEnd && hasDagger) return 'a';
  return '';
}

function transliterateWord(rawWord: string, isFirstWord: boolean): string {
  const cleaned = rawWord
    .replace(WAQF_MARKS_REGEX, '')
    .replace(/[\u0660-\u0669\u06F0-\u06F9۝۞﴿﴾().,،؛؟]/g, '')
    .trim();
  if (!cleaned) return '';

  // Exact/normalized match for Allah forms (ٱللَّهِ / اللَّهُ / لِلَّهِ / بِٱللَّهِ / وَٱللَّهِ)
  const strippedSimple = cleaned.replace(/[\u064B-\u0655\u0670]/g, '').replace(/ٱ/g, 'ا');
  if (strippedSimple === 'الله') {
    const hasKasraAtEnd = cleaned.endsWith(KASRA);
    const hasDammaAtEnd = cleaned.endsWith(DAMMA);
    const suffix = hasKasraAtEnd ? 'i' : hasDammaAtEnd ? 'u' : 'ə';
    return isFirstWord ? `Allahu`.slice(0, 5) + suffix : `Allahu`.slice(0, 5) + suffix;
  }
  if (strippedSimple === 'لله') {
    return 'lilləhi';
  }
  if (strippedSimple === 'بالله') {
    return 'billəhi';
  }
  if (strippedSimple === 'والله') {
    return 'vallahu';
  }

  const clusters = tokenizeArabicWord(cleaned);
  if (clusters.length === 0) return '';

  let idx = 0;
  let prefixOut = '';

  // Handle definite article ال / ٱل
  if (
    clusters.length >= 3 &&
    (clusters[0].base === 'ا' || clusters[0].base === 'ٱ') &&
    clusters[1].base === 'ل' &&
    !clusters[1].marks.includes(FATHA) &&
    !clusters[1].marks.includes(KASRA) &&
    !clusters[1].marks.includes(DAMMA)
  ) {
    const nextLetter = clusters[2].base;
    if (SUN_LETTERS.has(nextLetter)) {
      const sunConsonant = CONSONANT_MAP[nextLetter] ?? '';
      const sunVowel = getVowelFromMarks(
        clusters[2].marks,
        EMPHATIC_LETTERS.has(nextLetter),
        clusters.length === 3
      );
      prefixOut = `ə${sunConsonant}-${sunConsonant}`;
      // Skip alif, lam, and absorb one consonant output of clusters[2]
      if (sunVowel) {
        prefixOut += sunVowel;
        idx = 3;
      } else {
        idx = 2;
      }
    } else {
      prefixOut = 'əl-';
      idx = 2;
    }
  } else if (
    clusters.length >= 4 &&
    (clusters[0].base === 'و' || clusters[0].base === 'ف' || clusters[0].base === 'ب' || clusters[0].base === 'ل') &&
    (clusters[1].base === 'ا' || clusters[1].base === 'ٱ') &&
    clusters[2].base === 'ل' &&
    !clusters[2].marks.includes(FATHA) &&
    !clusters[2].marks.includes(KASRA) &&
    !clusters[2].marks.includes(DAMMA)
  ) {
    const prepCons = CONSONANT_MAP[clusters[0].base] ?? '';
    const prepVowel = getVowelFromMarks(clusters[0].marks, false, false) || (clusters[0].base === 'ل' ? 'i' : 'ə');
    const nextLetter = clusters[3].base;
    if (SUN_LETTERS.has(nextLetter)) {
      const sunConsonant = CONSONANT_MAP[nextLetter] ?? '';
      prefixOut = `${prepCons}${prepVowel}${sunConsonant}-${sunConsonant}`;
      const sunVowel = getVowelFromMarks(
        clusters[3].marks,
        EMPHATIC_LETTERS.has(nextLetter),
        clusters.length === 4
      );
      if (sunVowel) {
        prefixOut += sunVowel;
        idx = 4;
      } else {
        idx = 3;
      }
    } else {
      prefixOut = `${prepCons}${prepVowel}l-`;
      idx = 3;
    }
  }

  let bodyOut = '';
  for (; idx < clusters.length; idx++) {
    const cur = clusters[idx];
    const prev = idx > 0 ? clusters[idx - 1] : undefined;
    const isEnd = idx === clusters.length - 1;
    const hasShadda = cur.marks.includes(SHADDA);
    const hasVowelMarks =
      cur.marks.includes(FATHA) ||
      cur.marks.includes(KASRA) ||
      cur.marks.includes(DAMMA) ||
      cur.marks.includes(FATHATAN) ||
      cur.marks.includes(KASRATAN) ||
      cur.marks.includes(DAMMATAN) ||
      cur.marks.includes(DAGGER_ALIF);

    // Silent trailing alif after fathatan (e.g., عَلِيمًا) or plural waw (ـوا)
    if (cur.base === 'ا' && isEnd && prev && prev.marks.includes(FATHATAN)) {
      continue;
    }
    if (cur.base === 'ا' && isEnd && prev?.base === 'و' && !hasVowelMarks) {
      continue;
    }
    // Alif after fatha extends vowel smoothly without consonant
    if (cur.base === 'ا' && prev && prev.marks.includes(FATHA) && !hasVowelMarks) {
      continue;
    }
    // Alif maqsura at word end without consonant vowels
    if (cur.base === 'ى') {
      if (cur.marks.includes(DAGGER_ALIF) || (!hasVowelMarks && !hasShadda)) {
        if (!prev?.marks.includes(FATHA)) {
          bodyOut += 'ə';
        }
        continue;
      }
    }

    // Long u (و without vowel after damma)
    if (
      cur.base === 'و' &&
      !hasShadda &&
      !hasVowelMarks &&
      prev &&
      prev.marks.includes(DAMMA)
    ) {
      continue;
    }
    // Long i (ي without vowel after kasra)
    if (
      cur.base === 'ي' &&
      !hasShadda &&
      !hasVowelMarks &&
      prev &&
      prev.marks.includes(KASRA)
    ) {
      continue;
    }

    // Ta marbuta at end of word
    if (cur.base === 'ة') {
      const v = getVowelFromMarks(cur.marks, false, isEnd);
      bodyOut += v ? `t${v}` : 'ə';
      continue;
    }

    // Ayn (`ع`): use soft vowel directly if followed by vowel, apostrophe after sukun or without vowel
    if (cur.base === 'ع') {
      const aynVowel = getVowelFromMarks(cur.marks, true, isEnd);
      if (aynVowel) {
        if (bodyOut.length > 0 && prev?.marks.includes(SUKUN)) {
          bodyOut += "'";
        }
        bodyOut += aynVowel;
      } else {
        bodyOut += "'";
      }
      continue;
    }

    // Hamza carriers (أ / إ / آ / ا / ٱ)
    if (cur.base === 'ا' || cur.base === 'أ' || cur.base === 'إ' || cur.base === 'ٱ' || cur.base === 'آ') {
      const alifVowel = getVowelFromMarks(cur.marks, false, isEnd);
      if (cur.base === 'آ') {
        if (!prev?.marks.includes(FATHA)) {
          bodyOut += 'a';
        }
      } else if (alifVowel) {
        if (idx > 0 && (cur.base === 'أ' || cur.base === 'إ') && /[aəiu]$/.test(bodyOut)) {
          bodyOut += '-';
        }
        bodyOut += alifVowel;
      } else if (cur.base === 'إ') {
        if (idx > 0 && /[aəiu]$/.test(bodyOut)) {
          bodyOut += '-';
        }
        bodyOut += 'i';
      } else if (idx === 0 && (cur.base === 'ٱ' || cur.base === 'ا')) {
        const nextCluster = clusters[1];
        if (nextCluster?.base === 'ل' && nextCluster.marks.includes(SHADDA)) {
          bodyOut += 'ə';
        } else {
          const thirdCluster = clusters[2];
          bodyOut += thirdCluster?.marks.includes(DAMMA) ? 'u' : 'i';
        }
      }
      continue;
    }

    const cons = CONSONANT_MAP[cur.base] ?? '';
    const isLongRa =
      cur.base === 'ر' &&
      (cur.marks.includes(DAGGER_ALIF) ||
        (cur.marks.includes(FATHA) && clusters[idx + 1]?.base === 'ا'));
    const isHeavy = EMPHATIC_LETTERS.has(cur.base) || isLongRa;
    const vowel = getVowelFromMarks(cur.marks, isHeavy, isEnd);
    const shouldDouble = hasShadda && idx > 0;

    if (cons) {
      bodyOut += shouldDouble ? `${cons}${cons}` : cons;
    }
    if (vowel) {
      bodyOut += vowel;
    }
  }

  const combined = `${prefixOut}${bodyOut}`.replace(/-{2,}/g, '-');
  if (!combined) return '';
  return isFirstWord
    ? combined.charAt(0).toLocaleUpperCase('az') + combined.slice(1)
    : combined;
}

/**
 * Converts vocalized Arabic Quranic text (Uthmani with harakat) into readable
 * Azerbaijani Latin phonetic transliteration.
 */
export function transliterateArabicToAz(arabicText: string): string {
  const clean = (arabicText || '').trim();
  if (!clean) return '';
  const words = clean.split(/\s+/);
  const out: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const converted = transliterateWord(words[i], out.length === 0);
    if (converted) out.push(converted);
  }
  return out.join(' ');
}
