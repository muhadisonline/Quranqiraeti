import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Moon,
  RotateCcw,
  Search,
  Sparkles,
  Square,
  Sun,
  Volume2,
  XCircle,
} from 'lucide-react';
import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SeoHead } from '../components/SeoHead';
import {
  ARABIC_ALPHABET,
  ArabicLetterEntry,
  HARAKAT_GUIDE,
  MAKHRAJ_GROUPS,
  MakhrajGroupId,
  TAJWEED_ESSENTIALS,
  applyHarakatToLetter,
  buildAlphabetQuizQuestion,
  filterArabicLetters,
} from '../lib/arabicAlphabet';
import { getEveryAyahAudioUrl } from '../lib/muhaffiz';
import { buildBreadcrumbJsonLd } from '../lib/seo';

interface ArabicAlphabetPageProps {
  isDark: boolean;
  onNavigate: (path: string) => void;
  onToggleTheme: () => void;
}

export function ArabicAlphabetPage({
  isDark,
  onNavigate,
  onToggleTheme,
}: ArabicAlphabetPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [makhrajGroup, setMakhrajGroup] = useState<MakhrajGroupId>('all');
  const [selectedLetterId, setSelectedLetterId] = useState<string>('alif');
  const [selectedHarakatId, setSelectedHarakatId] = useState<string>('fatha');

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizMode, setQuizMode] = useState<'name-from-glyph' | 'form-from-name'>('name-from-glyph');
  const [quizSelectedId, setQuizSelectedId] = useState<string | null>(null);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizAnsweredCount, setQuizAnsweredCount] = useState(0);

  // Audio preview state
  const [playingAudioKey, setPlayingAudioKey] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredLetters = useMemo(
    () => filterArabicLetters(searchQuery, makhrajGroup),
    [searchQuery, makhrajGroup]
  );

  const selectedLetter: ArabicLetterEntry = useMemo(
    () =>
      ARABIC_ALPHABET.find((l) => l.id === selectedLetterId) ??
      filteredLetters[0] ??
      ARABIC_ALPHABET[0],
    [selectedLetterId, filteredLetters]
  );

  const activeHarakat = useMemo(
    () => HARAKAT_GUIDE.find((h) => h.id === selectedHarakatId) ?? HARAKAT_GUIDE[0],
    [selectedHarakatId]
  );

  const combinedPreview = useMemo(
    () => applyHarakatToLetter(selectedLetter, activeHarakat.id),
    [selectedLetter, activeHarakat.id]
  );

  const quizQuestion = useMemo(() => {
    const targetOrder = ((quizIndex * 5 + 2) % ARABIC_ALPHABET.length) + 1;
    return buildAlphabetQuizQuestion(targetOrder, quizIndex + 3, quizMode);
  }, [quizIndex, quizMode]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    setPlayingAudioKey(null);
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  function handlePlayAyahSample(key: string, surahNumber: number, ayahNumber: number) {
    if (playingAudioKey === key) {
      stopAudio();
      return;
    }
    stopAudio();
    setAudioError('');
    const audio = new Audio(getEveryAyahAudioUrl(surahNumber, ayahNumber, 'Alafasy_128kbps'));
    audioRef.current = audio;
    setPlayingAudioKey(key);
    audio.onended = () => {
      if (audioRef.current !== audio) return;
      stopAudio();
    };
    audio.onerror = () => {
      if (audioRef.current !== audio) return;
      stopAudio();
      setAudioError('Ayənin səs nümunəsi hazırda oxudula bilmədi.');
    };
    audio.play().catch(() => {
      if (audioRef.current !== audio) return;
      stopAudio();
      setAudioError('Audio oxutma brauzer tərəfindən dayandırıldı.');
    });
  }

  function handleQuizOptionSelect(optionId: string) {
    if (quizSelectedId !== null) return;
    setQuizSelectedId(optionId);
    setQuizAnsweredCount((prev) => prev + 1);
    if (optionId === quizQuestion.target.id) {
      setQuizCorrectCount((prev) => prev + 1);
    }
  }

  function handleNextQuizQuestion() {
    setQuizSelectedId(null);
    setQuizIndex((prev) => prev + 1);
  }

  function handleResetQuiz() {
    setQuizSelectedId(null);
    setQuizIndex(0);
    setQuizCorrectCount(0);
    setQuizAnsweredCount(0);
  }

  function handleNav(e: MouseEvent<HTMLAnchorElement>, path: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  }

  const jsonLd = useMemo(
    () => [
      buildBreadcrumbJsonLd(window.location.origin, [
        { name: 'Ana səhifə', path: '/' },
        { name: 'Qurani-Kərim', path: '/quran' },
        { name: 'Əlifba və Təcvid', path: '/elifba' },
      ]),
    ],
    []
  );

  const selectedAudioKey = `letter-${selectedLetter.id}`;
  const isPlayingSelected = playingAudioKey === selectedAudioKey;

  return (
    <article className="py-12 lg:py-16" data-testid="elifba-page">
      <SeoHead
        title="Ərəb Əlifbası, Hərəkələr və Təcvid Bələdçisi | Quran Qiraeti"
        description="28 ərəb hərfinin tək, başda, ortada və sonda yazılış formaları, məxrəcləri, hərəkə qurucusu, əsas təcvid qaydaları və Quran ayələrindən səsli nümunələr."
        path="/elifba"
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-6xl px-6">
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400"
        >
          <a
            href="/"
            onClick={(e) => handleNav(e, '/')}
            className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]"
          >
            Ana səhifə
          </a>
          <span aria-hidden="true">›</span>
          <a
            href="/quran"
            onClick={(e) => handleNav(e, '/quran')}
            className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]"
          >
            Qurani-Kərim
          </a>
          <span aria-hidden="true">›</span>
          <span className="font-medium text-stone-800 dark:text-stone-200">Əlifba və Təcvid</span>
        </nav>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <a
            href="/quran"
            onClick={(e) => handleNav(e, '/quran')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-[#0F4C3A] dark:text-stone-400 dark:hover:text-[#86C7AE]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tam Qurana qayıt</span>
          </a>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/quran/sehife/1"
              onClick={(e) => handleNav(e, '/quran/sehife/1')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 whitespace-nowrap shrink-0 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#0F4C3A] dark:text-[#86C7AE]" aria-hidden="true" />
              <span>Təcvidli Mushaf</span>
            </a>
            <a
              href="/muhaffiz"
              onClick={(e) => handleNav(e, '/muhaffiz')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 whitespace-nowrap shrink-0 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
            >
              <span>Mühafiz</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={onToggleTheme}
              data-testid="elifba-theme-toggle"
              aria-label={isDark ? 'Gündüz rejiminə keç' : 'Gecə rejiminə keç'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 whitespace-nowrap shrink-0 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
            >
              {isDark ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-[#C6A769]" aria-hidden="true" />
                  <span>Gündüz</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-[#0F4C3A]" aria-hidden="true" />
                  <span>Gecə</span>
                </>
              )}
            </button>
          </div>
        </div>

        <header className="border-b border-stone-200 pb-7 dark:border-stone-800">
          <p className="text-xs font-medium tracking-widest text-stone-500 dark:text-stone-400">
            Qurani-Kərimə Giriş · <span className="font-mono-tabular">28</span> Hərf · Məxrəc · Hərəkələr · Təcvid
          </p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl text-balance dark:text-stone-100">
            İnteraktiv Ərəb Əlifbası və Təcvid Bələdçisi
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            İstənilən hərfi seçərək onun tək, başda, ortada və sonda yazılış formalarını, məxrəc
            nöqtəsini, hərəkəli səslənməsini və Qurandan canlı tilavət nümunəsini öyrənin.
          </p>
        </header>

        {/* Main Interactive Studio: 28 Letters Grid + Selected Letter Inspector */}
        <section
          aria-labelledby="alphabet-grid-heading"
          className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12"
        >
          {/* Left: Filter Controls + 28-Letter Grid */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 dark:border-stone-800 dark:bg-[#141916]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2
                  id="alphabet-grid-heading"
                  className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100"
                >
                  Ərəb Əlifbası (<span className="font-mono-tabular">{filteredLetters.length}</span>)
                </h2>

                <div className="relative w-full sm:w-64">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Hərf adı və ya səs axtar..."
                    aria-label="Ərəb hərfləri arasında axtarış"
                    data-testid="elifba-search-input"
                    className="w-full rounded-lg border border-stone-200 bg-[#FAF9F6] py-2 pl-9 pr-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-100"
                  />
                </div>
              </div>

              <div
                role="group"
                aria-label="Məxrəc qrupları"
                className="mt-4 flex flex-wrap gap-1.5"
              >
                {MAKHRAJ_GROUPS.map((group) => {
                  const active = makhrajGroup === group.id;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setMakhrajGroup(group.id)}
                      aria-pressed={active}
                      data-testid={`makhraj-filter-${group.id}`}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                          : 'border border-stone-200 bg-[#FAF9F6] text-stone-700 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200'
                      }`}
                    >
                      {group.label}
                    </button>
                  );
                })}
              </div>

              {filteredLetters.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-stone-300 p-8 text-center text-xs text-stone-500 dark:border-stone-700 dark:text-stone-400">
                  Axtarışa uyğun hərf tapılmadı.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setMakhrajGroup('all');
                    }}
                    className="font-medium text-[#0F4C3A] underline dark:text-[#86C7AE]"
                  >
                    Filtrləri sıfırla
                  </button>
                </div>
              ) : (
                <div
                  dir="rtl"
                  data-testid="elifba-letters-grid"
                  className="mt-5 grid grid-cols-4 gap-2.5 sm:grid-cols-7"
                >
                  {filteredLetters.map((letter) => {
                    const isSelected = letter.id === selectedLetter.id;
                    return (
                      <button
                        key={letter.id}
                        type="button"
                        onClick={() => setSelectedLetterId(letter.id)}
                        aria-pressed={isSelected}
                        data-testid={`letter-card-${letter.id}`}
                        className={`group flex flex-col items-center justify-between rounded-xl border px-2 py-3 transition-all min-h-[84px] ${
                          isSelected
                            ? 'border-[#0F4C3A] bg-[#0F4C3A]/8 shadow-sm ring-1 ring-[#0F4C3A] dark:border-[#86C7AE] dark:bg-[#196B52]/25 dark:ring-[#86C7AE]'
                            : 'border-stone-200 bg-[#FAF9F6] hover:border-[#0F4C3A]/60 hover:bg-white dark:border-stone-800 dark:bg-[#181E1B] dark:hover:border-[#86C7AE]/50'
                        }`}
                      >
                        <span
                          dir="ltr"
                          className="font-mono-tabular self-end text-[10px] text-stone-400 dark:text-stone-500"
                        >
                          {letter.order}
                        </span>
                        <span className="font-arabic text-3xl leading-none text-stone-900 dark:text-stone-100">
                          {letter.arabicIsolated}
                        </span>
                        <span
                          dir="ltr"
                          className={`mt-1.5 text-[11px] font-medium leading-tight text-center ${
                            isSelected
                              ? 'text-[#0F4C3A] dark:text-[#86C7AE]'
                              : 'text-stone-600 dark:text-stone-300'
                          }`}
                        >
                          {letter.nameAz.split(' (')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="mt-4 text-[11px] text-stone-500 dark:text-stone-400">
                Qeyd: Ərəb əlifbası sağdan sola (<span className="font-mono-tabular">1 → 28</span>)
                sıralanır. Qırmızımtıl xəbərdarlıqsız: <strong className="font-medium text-stone-700 dark:text-stone-300">ا د ذ ر ز و</strong> hərfləri özündən sonra gələn hərfə birləşmir.
              </p>
            </div>
          </div>

          {/* Right: Selected Letter Detail + Positional Forms + Harakat Studio */}
          <div className="lg:col-span-5">
            <div
              data-testid="letter-inspector"
              className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 dark:border-stone-800 dark:bg-[#141916]"
            >
              <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4 dark:border-stone-800">
                <div>
                  <span className="font-mono-tabular text-xs font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
                    Hərf #{selectedLetter.order} · {selectedLetter.makhrajGroupLabel}
                  </span>
                  <h3 className="font-display mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">
                    {selectedLetter.nameAz}
                  </h3>
                  <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                    Səs qarşılığı:{' '}
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      [{selectedLetter.translitAz}]
                    </span>{' '}
                    ·{' '}
                    <span>
                      {selectedLetter.connectsLeft
                        ? 'Hər iki tərəfə birləşir'
                        : 'Sol tərəfə birləşmir'}
                    </span>
                  </p>
                </div>

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-[#F7F5F0] dark:border-stone-700 dark:bg-[#181E1B]">
                  <span
                    dir="rtl"
                    className="font-arabic text-4xl text-stone-900 dark:text-stone-100"
                  >
                    {selectedLetter.arabicIsolated}
                  </span>
                </div>
              </div>

              {/* 4 Positional Forms */}
              <div className="mt-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Söz içindəki 4 yazılış forması
                </p>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {[
                    { label: 'Tək', glyph: selectedLetter.arabicIsolated },
                    { label: 'Başda', glyph: selectedLetter.arabicInitial },
                    { label: 'Ortada', glyph: selectedLetter.arabicMedial },
                    { label: 'Sonda', glyph: selectedLetter.arabicFinal },
                  ].map((form) => (
                    <div
                      key={form.label}
                      className="rounded-lg border border-stone-200 bg-[#FAF9F6] px-2 py-2.5 text-center dark:border-stone-800 dark:bg-[#181E1B]"
                    >
                      <span
                        dir="rtl"
                        className="font-arabic block text-2xl leading-relaxed text-stone-900 dark:text-stone-100"
                      >
                        {form.glyph}
                      </span>
                      <span className="mt-0.5 block text-[10px] font-medium text-stone-500 dark:text-stone-400">
                        {form.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Makhraj & Pronunciation Tip */}
              <div className="mt-4 rounded-lg border border-stone-200 bg-[#F7F5F0] p-3.5 text-xs dark:border-stone-800 dark:bg-[#181E1B]">
                <p className="font-semibold text-stone-900 dark:text-stone-100">
                  Məxrəc (Çıxış nöqtəsi):
                </p>
                <p className="mt-1 leading-relaxed text-stone-700 dark:text-stone-300">
                  {selectedLetter.makhrajAz}
                </p>
                <p className="mt-2 text-stone-600 dark:text-stone-400">
                  {selectedLetter.pronunciationTipAz}
                </p>
              </div>

              {/* Interactive Harakat Builder */}
              <div className="mt-4 border-t border-stone-100 pt-4 dark:border-stone-800">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Canlı Hərəkə Qurucusu
                  </p>
                  <span className="text-xs font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
                    {activeHarakat.nameAz}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-4 rounded-lg border border-[#0F4C3A]/30 bg-[#0F4C3A]/5 px-4 py-3.5 dark:border-[#86C7AE]/30 dark:bg-[#196B52]/15">
                  <span
                    dir="rtl"
                    data-testid="harakat-preview-glyph"
                    className="font-arabic text-4xl leading-[1.8] py-0.5 text-stone-900 dark:text-stone-100"
                  >
                    {combinedPreview}
                  </span>
                  <div className="text-right text-xs">
                    <p className="font-semibold text-stone-900 dark:text-stone-100">
                      Səs: {activeHarakat.soundSuffixAz}
                    </p>
                    <p className="mt-0.5 text-[11px] text-stone-600 dark:text-stone-400">
                      {activeHarakat.descriptionAz}
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                  {HARAKAT_GUIDE.map((h) => {
                    const active = h.id === activeHarakat.id;
                    const shortLabel = h.id.startsWith('tanwin-')
                      ? h.nameAz.replace('Tənvin ', '2 ')
                      : h.nameAz.split(' (')[0];
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setSelectedHarakatId(h.id)}
                        aria-pressed={active}
                        aria-label={h.nameAz}
                        title={h.nameAz}
                        data-testid={`harakat-btn-${h.id}`}
                        className={`flex flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-center transition-colors min-h-[60px] ${
                          active
                            ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                            : 'border border-stone-200 bg-[#FAF9F6] text-stone-700 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200'
                        }`}
                      >
                        <span dir="rtl" className="font-arabic block text-lg leading-[1.65]">
                          {h.symbol}
                        </span>
                        <span className="block text-[10px] font-medium leading-tight">
                          {shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quranic Word Example & Ayah Audio */}
              <div className="mt-4 border-t border-stone-100 pt-4 dark:border-stone-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Qurandan nümunə kəlmə
                    </p>
                    <p className="mt-1 text-xs font-medium text-stone-800 dark:text-stone-200">
                      «{selectedLetter.quranWordTranslitAz}» — {selectedLetter.quranWordMeaningAz}
                    </p>
                    <a
                      href={`/quran/sure/${selectedLetter.surahNumber}#ayah-${selectedLetter.ayahNumber}`}
                      onClick={(e) =>
                        handleNav(
                          e,
                          `/quran/sure/${selectedLetter.surahNumber}#ayah-${selectedLetter.ayahNumber}`
                        )
                      }
                      className="mt-0.5 inline-block font-mono-tabular text-[11px] font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
                    >
                      {selectedLetter.surahRefLabel} →
                    </a>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      dir="rtl"
                      className="font-arabic text-2xl text-stone-900 dark:text-stone-100"
                    >
                      {selectedLetter.quranWordArabic}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handlePlayAyahSample(
                          selectedAudioKey,
                          selectedLetter.surahNumber,
                          selectedLetter.ayahNumber
                        )
                      }
                      data-testid="letter-audio-btn"
                      aria-label={
                        isPlayingSelected
                          ? 'Ayə tilavətini dayandır'
                          : `${selectedLetter.surahRefLabel} ayəsini dinlə`
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F4C3A] text-white transition-colors hover:bg-[#0B3A2C] dark:bg-[#196B52]"
                    >
                      {isPlayingSelected ? (
                        <Square className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Volume2 className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
                {audioError && (
                  <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300" role="status">
                    {audioError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Tajweed Essentials Section */}
        <section aria-labelledby="tajweed-guide-heading" className="mt-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="tajweed-guide-heading"
                className="font-display text-2xl font-semibold text-stone-900 dark:text-stone-100"
              >
                Əsas Təcvid Qaydaları
              </h2>
              <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                Mədinə Mushafını oxuyarkən ən çox qarşılaşacağınız 5 təməl təcvid qaydası və Quran
                nümunələri.
              </p>
            </div>
            <a
              href="/quran/sehife/1"
              onClick={(e) => handleNav(e, '/quran/sehife/1')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#C6A769]" aria-hidden="true" />
              <span>Rəngli Təcvid Mushafında bax</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TAJWEED_ESSENTIALS.map((rule) => {
              const ruleKey = `tajweed-${rule.id}`;
              const isPlayingRule = playingAudioKey === ruleKey;
              const match = rule.samplePath.match(/\/sure\/(\d+)#ayah-(\d+)/);
              const sNum = match ? Number.parseInt(match[1], 10) : 1;
              const aNum = match ? Number.parseInt(match[2], 10) : 1;

              return (
                <div
                  key={rule.id}
                  data-testid={`tajweed-card-${rule.id}`}
                  className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-[#141916]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
                          {rule.nameAz}
                        </h3>
                        <p className="mt-0.5 font-mono-tabular text-[11px] font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
                          Hərflər: {rule.keyLetters}
                        </p>
                      </div>
                      <span
                        dir="rtl"
                        className="font-arabic text-xl text-stone-800 dark:text-stone-200"
                      >
                        {rule.arabicName}
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
                      {rule.ruleSummaryAz}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 dark:border-stone-800 dark:bg-[#181E1B]">
                    <div>
                      <span
                        dir="rtl"
                        className="font-arabic block text-xl text-stone-900 dark:text-stone-100"
                      >
                        {rule.exampleArabic}
                      </span>
                      <a
                        href={rule.samplePath}
                        onClick={(e) => handleNav(e, rule.samplePath)}
                        className="font-mono-tabular text-[11px] font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
                      >
                        {rule.exampleSurahRef} →
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePlayAyahSample(ruleKey, sNum, aNum)}
                      aria-label={
                        isPlayingRule
                          ? `${rule.nameAz} nümunəsini dayandır`
                          : `${rule.nameAz} ayəsini dinlə`
                      }
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-[#0F4C3A] transition-colors hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-[#86C7AE]"
                    >
                      {isPlayingRule ? (
                        <Square className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Interactive Letter Recognition Quiz */}
        <section
          aria-labelledby="alphabet-quiz-heading"
          data-testid="elifba-quiz-section"
          className="mt-10 rounded-xl border border-stone-200 bg-white p-6 sm:p-8 dark:border-stone-800 dark:bg-[#141916]"
        >
          <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-stone-800">
            <div>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#0F4C3A] dark:text-[#86C7AE]" aria-hidden="true" />
                <h2
                  id="alphabet-quiz-heading"
                  className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100"
                >
                  Hərf Tanıma Testi
                </h2>
              </div>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                Öyrəndiyiniz 28 ərəb hərfini sürətli 4 variantlı testlə yoxlayın.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setQuizMode('name-from-glyph');
                  setQuizSelectedId(null);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  quizMode === 'name-from-glyph'
                    ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                    : 'border border-stone-200 bg-[#FAF9F6] text-stone-700 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200'
                }`}
              >
                Hərfdən adını tap
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuizMode('form-from-name');
                  setQuizSelectedId(null);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  quizMode === 'form-from-name'
                    ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                    : 'border border-stone-200 bg-[#FAF9F6] text-stone-700 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200'
                }`}
              >
                Addan hərfini tap
              </button>
              <span
                data-testid="elifba-quiz-score"
                className="font-mono-tabular rounded-lg border border-stone-200 bg-[#F7F5F0] px-3 py-1.5 text-xs font-semibold text-stone-800 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-100"
              >
                Nəticə: {quizCorrectCount} / {quizAnsweredCount}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
            <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-[#FAF9F6] p-8 text-center lg:col-span-5 dark:border-stone-800 dark:bg-[#181E1B]">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {quizMode === 'name-from-glyph'
                  ? 'Bu ərəb hərfinin adı hansıdır?'
                  : 'Aşağıdakı adı verilən hərf hansıdır?'}
              </p>
              {quizMode === 'name-from-glyph' ? (
                <span
                  dir="rtl"
                  data-testid="elifba-quiz-prompt"
                  className="font-arabic mt-4 text-6xl leading-none text-stone-900 dark:text-stone-100"
                >
                  {quizQuestion.target.arabicIsolated}
                </span>
              ) : (
                <p
                  data-testid="elifba-quiz-prompt"
                  className="font-display mt-4 text-3xl font-semibold text-stone-900 dark:text-stone-100"
                >
                  {quizQuestion.target.nameAz}
                </p>
              )}
              <p className="mt-3 text-[11px] text-stone-500 dark:text-stone-400">
                Məxrəc: {quizQuestion.target.makhrajGroupLabel}
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {quizQuestion.options.map((opt) => {
                  const isAnswered = quizSelectedId !== null;
                  const isCorrect = opt.id === quizQuestion.target.id;
                  const isChosen = opt.id === quizSelectedId;

                  let cardStyle =
                    'border-stone-200 bg-[#FAF9F6] text-stone-800 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-100';
                  if (isAnswered) {
                    if (isCorrect) {
                      cardStyle =
                        'border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200';
                    } else if (isChosen) {
                      cardStyle =
                        'border-rose-500 bg-rose-50 text-rose-900 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-200';
                    } else {
                      cardStyle =
                        'border-stone-200 bg-[#FAF9F6] text-stone-400 opacity-70 dark:border-stone-800 dark:bg-[#181E1B]';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleQuizOptionSelect(opt.id)}
                      data-testid={`quiz-option-${opt.id}`}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${cardStyle}`}
                    >
                      {quizMode === 'name-from-glyph' ? (
                        <div>
                          <span className="block text-sm font-semibold">{opt.nameAz}</span>
                          <span className="block text-[11px] opacity-80">[{opt.translitAz}]</span>
                        </div>
                      ) : (
                        <span dir="rtl" className="font-arabic text-3xl leading-none">
                          {opt.arabicIsolated}
                        </span>
                      )}

                      {isAnswered && isCorrect && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      )}
                      {isAnswered && isChosen && !isCorrect && (
                        <XCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs">
                  {quizSelectedId !== null ? (
                    quizSelectedId === quizQuestion.target.id ? (
                      <span className="font-medium text-emerald-700 dark:text-emerald-300">
                        Doğrudur! {quizQuestion.target.nameAz} ({quizQuestion.target.arabicIsolated}) — {quizQuestion.target.makhrajAz}.
                      </span>
                    ) : (
                      <span className="font-medium text-rose-700 dark:text-rose-300">
                        Doğru cavab: {quizQuestion.target.nameAz} ({quizQuestion.target.arabicIsolated}).
                      </span>
                    )
                  ) : (
                    <span className="text-stone-500 dark:text-stone-400">
                      Davam etmək üçün variantlardan birini seçin.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetQuiz}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:border-stone-300 dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Sıfırla</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextQuizQuestion}
                    data-testid="quiz-next-btn"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F4C3A] px-4 py-2 text-xs font-medium text-white hover:bg-[#0B3A2C] dark:bg-[#196B52]"
                  >
                    <span>Növbəti sual</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}
