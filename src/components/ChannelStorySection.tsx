import { BookOpen, Bookmark, Check, Copy, ImageDown, Play, Shuffle, Square, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import studioEditorialImage from '../assets/images/recitation_studio_editorial_1794730602469.jpg';
import { CURATED_VERSES } from '../data/recitations';
import { useSavedAyahs } from '../hooks/useReaderPreferences';
import {
  MUHAFFIZ_RECITERS,
  MuhaffizReciterId,
  getEveryAyahAudioUrl,
} from '../lib/muhaffiz';
import { getSurahByNumber } from '../lib/quran';
import { fetchSurahWithFallback } from '../lib/quranClient';
import {
  pickDailyCuratedIndex,
  pickRandomGlobalAyahTarget,
} from '../lib/readerState';
import { downloadVerseImageCard } from '../lib/verseCard';

interface VerseSectionProps {
  onPlayVideoById: (videoId: string) => void;
  onNavigate?: (path: string) => void;
}

interface DynamicDailyVerse {
  surahNumber: number;
  ayahNumber: number;
  pageNumber?: number;
  surahRef: string;
  arabicText: string;
  azerbaijaniTranslation: string;
  commentary: string;
  relatedVideoId?: string;
}

const STUDIO_IMAGE_PATH = studioEditorialImage;
const READER_RECITER_KEY = 'quranqiraeti_reader_reciter_v1';

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

export function VerseOfTheDaySection({ onPlayVideoById, onNavigate }: VerseSectionProps) {
  const [verseIdx, setVerseIdx] = useState<number>(() =>
    pickDailyCuratedIndex(CURATED_VERSES.length)
  );
  const [randomVerse, setRandomVerse] = useState<DynamicDailyVerse | null>(null);
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);
  const [randomError, setRandomError] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);

  const [reciter, setReciter] = useState<MuhaffizReciterId>(() => {
    try {
      const saved = localStorage.getItem(READER_RECITER_KEY);
      if (saved && MUHAFFIZ_RECITERS.some((r) => r.id === saved)) {
        return saved as MuhaffizReciterId;
      }
    } catch {
      // ignore storage error
    }
    return 'Alafasy_128kbps';
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState('');

  const { isSaved, toggleAyahBookmark } = useSavedAyahs();

  const curated = CURATED_VERSES[verseIdx] ?? CURATED_VERSES[0];
  const activeVerse: DynamicDailyVerse = randomVerse ?? {
    surahNumber: curated.surahNumber,
    ayahNumber: curated.ayahNumber,
    surahRef: curated.surahRef,
    arabicText: curated.arabicText,
    azerbaijaniTranslation: curated.azerbaijaniTranslation,
    commentary: curated.commentary,
    relatedVideoId: curated.relatedVideoId,
  };

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  useEffect(() => {
    try {
      localStorage.setItem(READER_RECITER_KEY, reciter);
    } catch {
      // ignore storage error
    }
  }, [reciter]);

  function handleTogglePlay() {
    if (isPlaying) {
      stopAudio();
      return;
    }
    stopAudio();
    setAudioError('');
    const audio = new Audio(
      getEveryAyahAudioUrl(activeVerse.surahNumber, activeVerse.ayahNumber, reciter)
    );
    audioRef.current = audio;
    setIsPlaying(true);

    audio.onended = () => {
      if (audioRef.current === audio) stopAudio();
    };
    audio.onerror = () => {
      if (audioRef.current === audio) {
        stopAudio();
        setAudioError('Bu ayənin səs faylı hazırda oxuna bilmədi.');
      }
    };
    void audio.play().catch(() => {
      if (audioRef.current === audio) {
        stopAudio();
        setAudioError('Səs oxutma brauzer tərəfindən dayandırıldı. Yenidən toxunun.');
      }
    });
  }

  async function handlePickRandomVerse() {
    stopAudio();
    setIsLoadingRandom(true);
    setRandomError('');
    try {
      const target = pickRandomGlobalAyahTarget();
      const payload = await fetchSurahWithFallback(target.surahNumber);
      const match =
        payload.ayahs.find((a) => a.ayahNumber === target.ayahNumber) ?? payload.ayahs[0];
      if (!match) throw new Error('Ayə tapılmadı');
      const surahMeta = getSurahByNumber(target.surahNumber);
      const surahName = surahMeta?.name ?? `Surə ${target.surahNumber}`;
      setRandomVerse({
        surahNumber: match.surahNumber,
        ayahNumber: match.ayahNumber,
        pageNumber: match.pageNumber,
        surahRef: `${surahName} surəsi · ${match.ayahNumber}-ci ayə`,
        arabicText: match.arabicText,
        azerbaijaniTranslation: `«${match.translation}»`,
        commentary: match.footnotes
          ? match.footnotes
          : `Əlixan Musayev tərcüməsi · Qurani-Kərimin ${match.surahNumber}:${match.ayahNumber} ayəsi üzərində gündəlik təfəkkür.`,
      });
    } catch {
      setRandomError('Təsadüfi ayə hazırda yüklənə bilmədi. Zəhmət olmasa yenidən yoxlayın.');
    } finally {
      setIsLoadingRandom(false);
    }
  }

  async function handleCopyVerse() {
    const text = `${activeVerse.arabicText}\n\n${activeVerse.azerbaijaniTranslation}\n(${activeVerse.surahRef} — Əlixan Musayev tərcüməsi)`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  }

  const surahInfo = getSurahByNumber(activeVerse.surahNumber);
  const targetMuhaffizPage = activeVerse.pageNumber ?? surahInfo?.startPage ?? 1;
  const verseBookmarked = isSaved(activeVerse.surahNumber, activeVerse.ayahNumber);

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
          {CURATED_VERSES.map((verse, idx) => {
            const isSelected = !randomVerse && verseIdx === idx;
            return (
              <button
                key={verse.surahRef}
                type="button"
                onClick={() => {
                  stopAudio();
                  setRandomVerse(null);
                  setRandomError('');
                  setVerseIdx(idx);
                }}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 min-h-[36px] ${
                  isSelected
                    ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                    : 'border border-stone-200 bg-white text-stone-700 hover:border-stone-300 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-300'
                }`}
              >
                {verse.surahRef.split('·')[0].trim()}
              </button>
            );
          })}

          <button
            type="button"
            onClick={handlePickRandomVerse}
            disabled={isLoadingRandom}
            data-testid="daily-random-verse-btn"
            className={`inline-flex items-center gap-1.5 rounded-md border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 min-h-[36px] ${
              randomVerse
                ? 'border-[#0F4C3A] bg-[#0F4C3A] text-white dark:border-[#196B52] dark:bg-[#196B52]'
                : 'border-stone-300 bg-white text-stone-800 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200'
            }`}
          >
            <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isLoadingRandom ? 'Seçilir...' : 'Qurandan təsadüfi ayə'}</span>
          </button>
        </div>

        {randomError && (
          <p role="alert" className="mt-4 text-xs font-medium text-red-700 dark:text-red-400">
            {randomError}
          </p>
        )}

        <blockquote
          data-testid="daily-verse-blockquote"
          className="mt-8 border-y border-stone-200 py-10 dark:border-stone-800"
        >
          <p
            dir="rtl"
            lang="ar"
            className="font-arabic text-2xl leading-[2.1] text-stone-900 sm:text-3xl lg:text-4xl dark:text-stone-100"
          >
            {activeVerse.arabicText}
          </p>
          <p className="font-display mx-auto mt-6 max-w-2xl text-xl leading-relaxed italic text-stone-800 sm:text-2xl dark:text-stone-200">
            {activeVerse.azerbaijaniTranslation}
          </p>
          <footer className="mt-5 font-mono-tabular text-xs font-medium text-stone-500 dark:text-stone-400">
            {activeVerse.surahRef}
          </footer>
        </blockquote>

        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-stone-600 dark:text-stone-300">
          {activeVerse.commentary}
        </p>

        {/* Audio reciter & utility strip */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Volume2 className="h-3.5 w-3.5 text-[#0F4C3A] dark:text-[#86C7AE]" aria-hidden="true" />
            <label htmlFor="daily-reciter-select" className="sr-only">
              Qari seçimi
            </label>
            <select
              id="daily-reciter-select"
              value={reciter}
              onChange={(e) => {
                stopAudio();
                setReciter(e.target.value as MuhaffizReciterId);
              }}
              className="rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-xs text-stone-800 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-100"
            >
              {MUHAFFIZ_RECITERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleTogglePlay}
            data-testid="daily-verse-play-btn"
            className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors min-h-[38px] ${
              isPlaying
                ? 'border-[#0F4C3A] bg-[#0F4C3A] text-white dark:border-[#196B52] dark:bg-[#196B52]'
                : 'border-stone-300 bg-white text-stone-800 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="h-3 w-3 fill-current" aria-hidden="true" />
                <span>Dayandır</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Ayəni dinlə</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              toggleAyahBookmark({
                surahNumber: activeVerse.surahNumber,
                ayahNumber: activeVerse.ayahNumber,
                surahName: surahInfo?.name ?? `Surə ${activeVerse.surahNumber}`,
                pageNumber: targetMuhaffizPage,
                arabicText: activeVerse.arabicText,
                translation: activeVerse.azerbaijaniTranslation.replace(/^[«"]|[»"]$/g, ''),
              })
            }
            data-testid="daily-verse-bookmark-btn"
            className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors min-h-[38px] ${
              verseBookmarked
                ? 'border-[#0F4C3A] bg-[#0F4C3A]/10 text-[#0F4C3A] dark:border-[#86C7AE] dark:bg-[#86C7AE]/15 dark:text-[#86C7AE]'
                : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200'
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${verseBookmarked ? 'fill-current' : ''}`} aria-hidden="true" />
            <span>{verseBookmarked ? 'Saxlanılıb' : 'Saxla'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyVerse}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 whitespace-nowrap transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200 min-h-[38px]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#0F4C3A] dark:text-[#86C7AE]" aria-hidden="true" />
                <span>Köçürüldü</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Köçür</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={downloadingImage}
            onClick={async () => {
              setDownloadingImage(true);
              try {
                await downloadVerseImageCard({
                  surahName: surahInfo?.name ?? `Surə ${activeVerse.surahNumber}`,
                  surahNumber: activeVerse.surahNumber,
                  ayahNumber: activeVerse.ayahNumber,
                  arabicText: activeVerse.arabicText,
                  translation: activeVerse.azerbaijaniTranslation.replace(/^[«"]|[»"]$/g, ''),
                  theme: document.documentElement.classList.contains('dark') ? 'emerald' : 'parchment',
                });
              } finally {
                setDownloadingImage(false);
              }
            }}
            data-testid="daily-verse-image-btn"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 whitespace-nowrap transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] disabled:opacity-60 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200 min-h-[38px]"
          >
            <ImageDown className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Şəkil</span>
          </button>
        </div>

        {audioError && (
          <p role="status" className="mt-3 text-xs text-amber-800 dark:text-amber-300">
            {audioError}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {activeVerse.relatedVideoId && (
            <button
              type="button"
              onClick={() => onPlayVideoById(activeVerse.relatedVideoId!)}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-xs font-medium text-stone-900 whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-100 dark:hover:border-[#86C7AE] dark:hover:text-[#86C7AE] min-h-[42px]"
            >
              <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              <span>Bu surənin video qiraətini dinlə</span>
            </button>
          )}

          {onNavigate && (
            <>
              <a
                href={`/quran/sure/${activeVerse.surahNumber}#ayah-${activeVerse.ayahNumber}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(`/quran/sure/${activeVerse.surahNumber}#ayah-${activeVerse.ayahNumber}`);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F4C3A] px-5 py-2.5 text-xs font-medium text-white whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-[#0B3A2C] dark:bg-[#196B52] min-h-[42px]"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Ayəni surədə oxu</span>
              </a>

              <a
                href={`/muhaffiz/${targetMuhaffizPage}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(`/muhaffiz/${targetMuhaffizPage}`);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-xs font-medium text-stone-700 whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200 min-h-[42px]"
              >
                <span>Mühafizdə əzbərlə (Səh. {targetMuhaffizPage})</span>
              </a>
            </>
          )}
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
