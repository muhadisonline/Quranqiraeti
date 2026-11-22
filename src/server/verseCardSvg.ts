import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { buildVerseReferenceLine, wrapTextLines } from '../lib/verseCard';

export type VerseCardFormat = 'story' | 'square';
export type VerseCardTheme = 'emerald' | 'parchment';

export interface VerseCardSvgInput {
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  translation: string;
  theme?: VerseCardTheme;
  format?: VerseCardFormat;
}

export function escapeXml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveFontFiles(): string[] {
  const candidateDirs = [
    path.resolve(process.cwd(), 'dist', 'fonts'),
    path.resolve(process.cwd(), 'public', 'fonts'),
  ];
  const filenames = [
    'NotoNaskhArabic-Regular.ttf',
    'NotoSans-Regular.ttf',
    'NotoSans-Bold.ttf',
  ];

  for (const dir of candidateDirs) {
    const resolved = filenames.map((name) => path.join(dir, name)).filter((p) => fs.existsSync(p));
    if (resolved.length === filenames.length) {
      return resolved;
    }
  }

  const anyFound: string[] = [];
  for (const dir of candidateDirs) {
    for (const name of filenames) {
      const p = path.join(dir, name);
      if (fs.existsSync(p) && !anyFound.includes(p)) {
        anyFound.push(p);
      }
    }
  }
  return anyFound;
}

function stripArabicDiacriticsForMeasure(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
}

function wrapArabicByVisibleChars(
  text: string,
  maxVisibleCharsPerLine: number,
  maxLines: number
): string[] {
  const clean = text.trim().replace(/\u2026/g, '').replace(/\s+/g, ' ');
  if (!clean) return [];
  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!current) {
      current = word;
      continue;
    }
    const nextCandidate = `${current} ${word}`;
    if (stripArabicDiacriticsForMeasure(nextCandidate).length <= maxVisibleCharsPerLine) {
      current = nextCandidate;
    } else {
      lines.push(current);
      if (lines.length >= maxLines) {
        current = '';
        break;
      }
      current = word;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

export function buildVerseCardSvg(input: VerseCardSvgInput): string {
  const format: VerseCardFormat = input.format === 'square' ? 'square' : 'story';
  const theme: VerseCardTheme = input.theme === 'parchment' ? 'parchment' : 'emerald';

  const width = 1080;
  const height = format === 'story' ? 1920 : 1080;
  const isEmerald = theme === 'emerald';

  const bgTop = isEmerald ? '#0B1B16' : '#FBF8F1';
  const bgBottom = isEmerald ? '#122922' : '#F2ECE0';
  const cardSurface = isEmerald ? '#10241D' : '#FFFDF8';
  const frameStroke = isEmerald ? 'rgba(198, 167, 105, 0.36)' : 'rgba(15, 76, 58, 0.18)';
  const accentColor = isEmerald ? '#D4B475' : '#0F4C3A';
  const primaryText = isEmerald ? '#F5F2EA' : '#17191C';
  const secondaryText = isEmerald ? '#DAE3DF' : '#2C3135';
  const mutedText = isEmerald ? '#9BB0A8' : '#66635E';
  const medallionBg = isEmerald ? '#16342A' : '#EFE8D8';

  const visibleArabicLen = stripArabicDiacriticsForMeasure(input.arabicText).length;
  const transLen = input.translation.trim().length;

  let arabicFontSize: number;
  let arabicVisibleChars: number;
  let arabicMaxLines: number;
  let transFontSize: number;
  let transMaxChars: number;
  let transMaxLines: number;

  if (format === 'story') {
    if (visibleArabicLen <= 120) {
      arabicFontSize = 56;
      arabicVisibleChars = 28;
      arabicMaxLines = 6;
    } else if (visibleArabicLen <= 280) {
      arabicFontSize = 44;
      arabicVisibleChars = 34;
      arabicMaxLines = 10;
    } else {
      arabicFontSize = 36;
      arabicVisibleChars = 40;
      arabicMaxLines = 14;
    }

    if (transLen <= 200) {
      transFontSize = 34;
      transMaxChars = 40;
      transMaxLines = 8;
    } else if (transLen <= 480) {
      transFontSize = 28;
      transMaxChars = 48;
      transMaxLines = 14;
    } else {
      transFontSize = 24;
      transMaxChars = 54;
      transMaxLines = 18;
    }
  } else {
    if (visibleArabicLen <= 120) {
      arabicFontSize = 48;
      arabicVisibleChars = 30;
      arabicMaxLines = 4;
    } else if (visibleArabicLen <= 260) {
      arabicFontSize = 38;
      arabicVisibleChars = 38;
      arabicMaxLines = 7;
    } else {
      arabicFontSize = 31;
      arabicVisibleChars = 44;
      arabicMaxLines = 8;
    }

    if (transLen <= 180) {
      transFontSize = 30;
      transMaxChars = 46;
      transMaxLines = 5;
    } else if (transLen <= 420) {
      transFontSize = 24;
      transMaxChars = 56;
      transMaxLines = 8;
    } else {
      transFontSize = 21;
      transMaxChars = 64;
      transMaxLines = 9;
    }
  }

  const arabicLines = wrapArabicByVisibleChars(input.arabicText, arabicVisibleChars, arabicMaxLines);
  const transLines = wrapTextLines(`«${input.translation}»`, transMaxChars, transMaxLines);

  const arabicLineHeight = Math.round(arabicFontSize * 1.68);
  const transLineHeight = Math.round(transFontSize * 1.46);

  const dividerGap = format === 'story' ? 68 : 44;
  const arabicBlockHeight = arabicLines.length * arabicLineHeight;
  const transBlockHeight = transLines.length * transLineHeight;
  const totalBlockHeight = arabicBlockHeight + dividerGap + transBlockHeight;

  const headerBaseline = format === 'story' ? 164 : 112;
  const footerTop = format === 'story' ? height - 168 : height - 114;
  const availableTop = headerBaseline + (format === 'story' ? 76 : 46);
  const availableBottom = footerTop - (format === 'story' ? 64 : 42);
  const contentTop = Math.max(
    availableTop,
    Math.round(availableTop + (availableBottom - availableTop - totalBlockHeight) / 2)
  );

  const arabicElements = arabicLines
    .map((line, i) => {
      const y = contentTop + arabicFontSize + i * arabicLineHeight;
      return `<text x="${width / 2}" y="${y}" text-anchor="middle" direction="rtl" unicode-bidi="bidi-override" fill="${primaryText}" font-family="Noto Naskh Arabic" font-size="${arabicFontSize}">${escapeXml(line)}</text>`;
    })
    .join('\n    ');

  const dividerY = contentTop + arabicBlockHeight + Math.round(dividerGap / 2);
  const transStartY = dividerY + Math.round(dividerGap / 2) + transFontSize;

  const transElements = transLines
    .map((line, i) => {
      const y = transStartY + i * transLineHeight;
      return `<text x="${width / 2}" y="${y}" text-anchor="middle" fill="${secondaryText}" font-family="Noto Sans" font-size="${transFontSize}">${escapeXml(line)}</text>`;
    })
    .join('\n    ');

  const refLine = buildVerseReferenceLine(input.surahName, input.surahNumber, input.ayahNumber);
  const pad = format === 'story' ? 58 : 48;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bgTop}" />
      <stop offset="100%" stop-color="${bgBottom}" />
    </linearGradient>
    <radialGradient id="topGlow" cx="50%" cy="18%" r="55%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="${isEmerald ? '0.14' : '0.07'}" />
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#cardBg)" />
  <rect width="${width}" height="${height}" fill="url(#topGlow)" />

  <rect x="${pad}" y="${pad}" width="${width - pad * 2}" height="${height - pad * 2}" rx="28" fill="${cardSurface}" fill-opacity="0.72" stroke="${frameStroke}" stroke-width="2" />
  <rect x="${pad + 14}" y="${pad + 14}" width="${width - (pad + 14) * 2}" height="${height - (pad + 14) * 2}" rx="20" fill="none" stroke="${frameStroke}" stroke-opacity="0.45" stroke-width="1" />

  <text x="${width / 2}" y="${headerBaseline}" text-anchor="middle" fill="${accentColor}" font-family="Noto Sans" font-weight="700" font-size="24" letter-spacing="5">QURAN QİRAƏTİ</text>
  <line x1="${width / 2 - 110}" y1="${headerBaseline + 26}" x2="${width / 2 + 110}" y2="${headerBaseline + 26}" stroke="${frameStroke}" stroke-width="1.5" />

  <g>
    ${arabicElements}
  </g>

  <line x1="${width / 2 - 180}" y1="${dividerY}" x2="${width / 2 - 42}" y2="${dividerY}" stroke="${frameStroke}" stroke-width="1.5" />
  <circle cx="${width / 2}" cy="${dividerY}" r="24" fill="${medallionBg}" stroke="${accentColor}" stroke-width="1.5" />
  <text x="${width / 2}" y="${dividerY + 8}" text-anchor="middle" fill="${accentColor}" font-family="Noto Sans" font-weight="700" font-size="20">${input.ayahNumber}</text>
  <line x1="${width / 2 + 42}" y1="${dividerY}" x2="${width / 2 + 180}" y2="${dividerY}" stroke="${frameStroke}" stroke-width="1.5" />

  <g>
    ${transElements}
  </g>

  <line x1="${width / 2 - 140}" y1="${footerTop - 36}" x2="${width / 2 + 140}" y2="${footerTop - 36}" stroke="${frameStroke}" stroke-width="1" />
  <text x="${width / 2}" y="${footerTop}" text-anchor="middle" fill="${accentColor}" font-family="Noto Sans" font-weight="700" font-size="24">${escapeXml(refLine)}</text>
  <text x="${width / 2}" y="${footerTop + 40}" text-anchor="middle" fill="${mutedText}" font-family="Noto Sans" font-size="20">@quranqiraeti · quranqiraeti.vercel.app</text>
</svg>`;
}

export function renderVerseCardPngBuffer(input: VerseCardSvgInput): Buffer {
  const svg = buildVerseCardSvg(input);
  const fontFiles = resolveFontFiles();
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1080,
    },
    font: {
      fontFiles,
      loadSystemFonts: fontFiles.length === 0,
      defaultFontFamily: 'Noto Sans',
    },
  });
  const rendered = resvg.render();
  return Buffer.from(rendered.asPng());
}
