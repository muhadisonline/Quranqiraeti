export interface VerseCardInput {
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  translation: string;
  theme?: 'parchment' | 'emerald';
}

export function wrapTextLines(
  text: string,
  maxCharsPerLine: number,
  maxLines = 12
): string[] {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (!clean) return [];
  const limit = Math.max(8, maxCharsPerLine);
  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';

  let truncated = false;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!current) {
      current = word;
      continue;
    }
    if (`${current} ${word}`.length <= limit) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      if (lines.length >= maxLines) {
        truncated = true;
        current = '';
        break;
      }
      current = word;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  if (truncated && lines.length > 0) {
    const lastIdx = lines.length - 1;
    const last = lines[lastIdx];
    lines[lastIdx] = last.length > 3 ? `${last.slice(0, last.length - 1)}…` : `${last}…`;
  }

  return lines;
}

export function sanitizeVerseCardFilename(surahNumber: number, ayahNumber: number): string {
  const safeSurah = Math.max(1, Math.floor(surahNumber));
  const safeAyah = Math.max(1, Math.floor(ayahNumber));
  return `quranqiraeti-${safeSurah}-${safeAyah}.png`;
}

export function buildVerseReferenceLine(surahName: string, surahNumber: number, ayahNumber: number): string {
  return `${surahName} surəsi · ${surahNumber}:${ayahNumber} · Əlixan Musayev tərcüməsi`;
}

export async function renderVerseCardToBlob(input: VerseCardInput): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;

  const size = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const isEmerald = input.theme === 'emerald';
  const bgColor = isEmerald ? '#0E1F1A' : '#FAF7F0';
  const cardBorder = isEmerald ? 'rgba(198, 167, 105, 0.35)' : 'rgba(15, 76, 58, 0.16)';
  const accentColor = isEmerald ? '#C6A769' : '#0F4C3A';
  const primaryText = isEmerald ? '#F5F2EA' : '#17191C';
  const mutedText = isEmerald ? '#B6C4BE' : '#57534E';

  // Background fill
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Inner editorial frame
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, size - 96, size - 96);

  // Subtle top brand line
  ctx.fillStyle = accentColor;
  ctx.font = '600 22px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('QURAN QİRAƏTİ', size / 2, 118);

  // Hairline rule under header
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(size / 2 - 90, 144);
  ctx.lineTo(size / 2 + 90, 144);
  ctx.stroke();

  // Compute wrapped lines for both Arabic & Azerbaijani translation to keep balanced vertical spacing
  const arabicLines = wrapTextLines(input.arabicText, 38, 6);
  const transLines = wrapTextLines(`«${input.translation}»`, 52, 7);

  const arabicFontSize = arabicLines.length <= 2 ? 52 : arabicLines.length <= 4 ? 44 : 36;
  const arabicLineHeight = Math.round(arabicFontSize * 1.65);

  const transFontSize = transLines.length <= 3 ? 30 : transLines.length <= 5 ? 26 : 23;
  const transLineHeight = Math.round(transFontSize * 1.48);

  const arabicBlockHeight = arabicLines.length * arabicLineHeight;
  const transBlockHeight = transLines.length * transLineHeight;
  const dividerGap = 48;
  const totalContentHeight = arabicBlockHeight + dividerGap + transBlockHeight;
  const contentTop = Math.max(195, Math.round((size - totalContentHeight) / 2) - 25);

  // Draw Arabic text centered
  ctx.fillStyle = primaryText;
  ctx.font = `${arabicFontSize}px "Amiri", "Traditional Arabic", serif`;
  ctx.textAlign = 'center';
  ctx.direction = 'rtl';

  let cursorY = contentTop + arabicFontSize;
  for (const line of arabicLines) {
    ctx.fillText(line, size / 2, cursorY, size - 160);
    cursorY += arabicLineHeight;
  }

  // Ornamental thin divider between Arabic and Translation
  ctx.direction = 'ltr';
  const dividerY = contentTop + arabicBlockHeight + Math.round(dividerGap / 2) - 10;
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(size / 2 - 64, dividerY);
  ctx.lineTo(size / 2 + 64, dividerY);
  ctx.stroke();

  // Draw Azerbaijani Translation
  ctx.fillStyle = primaryText;
  ctx.font = `400 ${transFontSize}px "Newsreader", Georgia, serif`;
  ctx.textAlign = 'center';
  cursorY = dividerY + Math.round(dividerGap / 2) + transFontSize;
  for (const line of transLines) {
    ctx.fillText(line, size / 2, cursorY, size - 160);
    cursorY += transLineHeight;
  }

  // Footer Reference & Domain
  ctx.fillStyle = accentColor;
  ctx.font = '600 22px Inter, system-ui, sans-serif';
  ctx.fillText(
    buildVerseReferenceLine(input.surahName, input.surahNumber, input.ayahNumber),
    size / 2,
    size - 120
  );

  ctx.fillStyle = mutedText;
  ctx.font = '400 18px "JetBrains Mono", monospace, sans-serif';
  ctx.fillText('quranqiraeti.vercel.app', size / 2, size - 82);

  return await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

export async function downloadVerseImageCard(input: VerseCardInput): Promise<boolean> {
  const blob = await renderVerseCardToBlob(input);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = sanitizeVerseCardFilename(input.surahNumber, input.ayahNumber);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
