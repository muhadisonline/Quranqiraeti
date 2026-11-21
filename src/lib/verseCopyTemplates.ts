export type VerseCopyTemplateId = 'classic' | 'whatsapp' | 'telegram' | 'arabic-only';

export interface VerseCopyTemplateMeta {
  id: VerseCopyTemplateId;
  label: string;
  hint: string;
}

export const VERSE_COPY_TEMPLATES: VerseCopyTemplateMeta[] = [
  { id: 'whatsapp', label: 'WhatsApp', hint: 'Qalın başlıq və kursiv tərcümə ilə' },
  { id: 'telegram', label: 'Telegram', hint: 'Səliqəli dırnaq və həştəq ilə' },
  { id: 'classic', label: 'Klassik', hint: 'Sadə və rəsmi istinad formatı' },
  { id: 'arabic-only', label: 'Yalnız Ərəbcə', hint: 'Yalnız ərəbcə mətn və ayə nömrəsi' },
];

export const COPY_TEMPLATE_STORAGE_KEY = 'quranqiraeti_copy_template_v1';

export function formatVerseWithTemplate(
  templateId: VerseCopyTemplateId,
  input: {
    surahName: string;
    surahNumber: number;
    ayahNumber: number;
    arabicText: string;
    translation: string;
    pageNumber?: number;
  }
): string {
  const ref = `${input.surahNumber}:${input.ayahNumber}`;
  const pagePart = input.pageNumber ? ` · Səh. ${input.pageNumber}` : '';

  switch (templateId) {
    case 'whatsapp':
      return [
        `*📖 ${input.surahName} surəsi (${ref}${pagePart})*`,
        '',
        input.arabicText.trim(),
        '',
        `_"${input.translation.trim()}"_`,
        '',
        '— Əlixan Musayev tərcüməsi · Quran Qiraeti',
      ].join('\n');

    case 'telegram':
      return [
        `🕌 **${input.surahName} surəsi · ${ref}**${pagePart}`,
        '',
        input.arabicText.trim(),
        '',
        `«${input.translation.trim()}»`,
        '',
        '— Əlixan Musayev tərcüməsi | #QuranQiraeti',
      ].join('\n');

    case 'arabic-only':
      return `${input.arabicText.trim()} ﴿${input.ayahNumber}﴾ (${input.surahName}, ${ref})`;

    case 'classic':
    default:
      return `${input.arabicText.trim()}\n\n"${input.translation.trim()}"\n(${input.surahName} surəsi, ${ref}${pagePart} — Əlixan Musayev tərcüməsi)`;
  }
}

export function loadCopyTemplateFromStorage(): VerseCopyTemplateId {
  if (typeof window === 'undefined') return 'whatsapp';
  try {
    const raw = window.localStorage.getItem(COPY_TEMPLATE_STORAGE_KEY);
    if (
      raw === 'classic' ||
      raw === 'whatsapp' ||
      raw === 'telegram' ||
      raw === 'arabic-only'
    ) {
      return raw;
    }
  } catch {
    // ignore storage error
  }
  return 'whatsapp';
}

export function saveCopyTemplateToStorage(id: VerseCopyTemplateId): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(COPY_TEMPLATE_STORAGE_KEY, id);
  } catch {
    // ignore storage error
  }
}
