import { Play } from 'lucide-react';
import { useState } from 'react';
import studioEditorialImage from '../assets/images/recitation_studio_editorial_1794730602469.jpg';
import { CURATED_VERSES } from '../data/recitations';

interface VerseSectionProps {
  onPlayVideoById: (videoId: string) => void;
}

const STUDIO_IMAGE_PATH = studioEditorialImage;

const PRINCIPLES = [
  {
    number: '01.',
    title: 'Səlis və dəqiq mənaca tərcümə',
    body: 'Hər bir video tilavət zamanı ərəbcə qiraətlə paralel olaraq Azərbaycan dilində məna tərcüməsini ekranda oxunaqlı şəkildə təqdim edir.',
  },
  {
    number: '02.',
    title: 'Seçilmiş qarilərin hüzurlu qiraətləri',
    body: 'Maher Al-Muaiqly, İslam Subhi, Yasser Al-Dosari və digər tanınmış qarilərin qəlbə toxunan tilavətləri yüksək səs təmizliyi ilə arxivlənir.',
  },
  {
    number: '03.',
    title: 'Uzun tilavətlər və qısa Shorts formatı',
    body: 'Tam surə qiraətləri ilə yanaşı, gündəlik təfəkkür üçün seçilmiş qısa ayə qiraətləri ayrıca Shorts bölməsində sistemli şəkildə yayımlanır.',
  },
];

export function VerseOfTheDaySection({ onPlayVideoById }: VerseSectionProps) {
  const [verseIdx, setVerseIdx] = useState(0);
  const activeVerse = CURATED_VERSES[verseIdx] ?? CURATED_VERSES[0];

  return (
    <section
      id="gunun-ayesi"
      className="border-b border-stone-200/80 bg-[#F3F1EC]/70 py-16 lg:py-20 dark:border-stone-800/80 dark:bg-[#121714]"
    >
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="text-xs font-medium tracking-widest text-stone-500 dark:text-stone-400">
          Günün Ayəsi və Təfəkkür
        </p>
        <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-100">
          Seçilmiş ayələr və tərcümə üzərində düşüncə
        </h1>

        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {CURATED_VERSES.map((verse, idx) => (
            <button
              key={verse.surahRef}
              type="button"
              onClick={() => setVerseIdx(idx)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 min-h-[36px] ${
                verseIdx === idx
                  ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                  : 'border border-stone-200 bg-white text-stone-700 hover:border-stone-300 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-300'
              }`}
            >
              {verse.surahRef.split('·')[0].trim()}
            </button>
          ))}
        </div>

        <blockquote className="mt-10 border-y border-stone-200 py-10 dark:border-stone-800">
          <p
            lang="ar"
            className="font-arabic text-2xl leading-[2.1] text-stone-900 sm:text-3xl lg:text-4xl dark:text-stone-100"
          >
            {activeVerse.arabicText}
          </p>
          <p className="font-display mx-auto mt-6 max-w-2xl text-xl leading-relaxed italic text-stone-800 sm:text-2xl dark:text-stone-200">
            {activeVerse.azerbaijaniTranslation}
          </p>
          <footer className="mt-5 text-xs font-medium text-stone-500 dark:text-stone-400">
            {activeVerse.surahRef}
          </footer>
        </blockquote>

        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-stone-600 dark:text-stone-300">
          {activeVerse.commentary}
        </p>

        <div className="mt-7">
          <button
            type="button"
            onClick={() => onPlayVideoById(activeVerse.relatedVideoId)}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-xs font-medium text-stone-900 whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-100 dark:hover:border-[#86C7AE] dark:hover:text-[#86C7AE] min-h-[42px]"
          >
            <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            <span>Bu surənin qiraətini dinlə</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export function AboutChannelSection() {
  const [studioImgError, setStudioImgError] = useState(false);

  return (
    <section
      id="haqqinda"
      className="border-b border-stone-200/80 py-16 lg:py-20 dark:border-stone-800/80"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="h-72 w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100 sm:h-88 lg:h-full lg:min-h-[380px] dark:border-stone-800 dark:bg-stone-900">
              {!studioImgError ? (
                <img
                  src={STUDIO_IMAGE_PATH}
                  alt="Qoz ağacı masası üzərində Məshəf və qiraət mikrofonu"
                  referrerPolicy="no-referrer"
                  onError={() => setStudioImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#F3F1EC] p-6 text-center dark:bg-[#141916]">
                  <span className="font-display text-xl text-stone-600 dark:text-stone-300">
                    Quran Qiraeti Studiyası
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between lg:col-span-7">
            <div>
              <p className="text-xs font-medium tracking-widest text-stone-500 dark:text-stone-400">
                Kanal Haqqında
              </p>
              <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl text-balance dark:text-stone-100">
                Ayələri həm eşitmək, həm də mənasını dərk etmək üçün
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone-600 dark:text-stone-300">
                Quran Qiraeti kanalının əsas məqsədi dinləyicilərə Qurani-Kərimi yalnız səs olaraq deyil,
                anlaşılan bir müraciət kimi çatdırmaqdır. Hər bir qiraət diqqətlə redaktə olunmuş
                Azərbaycan dili tərcüməsi ilə müşayiət olunur.
              </p>
            </div>

            <div className="mt-8 divide-y divide-stone-200 border-t border-stone-200 dark:divide-stone-800 dark:border-stone-800">
              {PRINCIPLES.map((item) => (
                <div key={item.number} className="grid grid-cols-1 gap-2 py-5 sm:grid-cols-12 sm:gap-6">
                  <div className="font-mono-tabular text-sm font-medium text-[#0F4C3A] sm:col-span-2 dark:text-[#86C7AE]">
                    {item.number}
                  </div>
                  <div className="sm:col-span-10">
                    <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
