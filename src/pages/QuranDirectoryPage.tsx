import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bookmark,
  Check,
  Copy,
  Download,
  Flame,
  Headphones,
  ImageDown,
  Moon,
  Pencil,
  RotateCcw,
  Search,
  Square,
  Sun,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarReminderCard } from '../components/CalendarReminderCard';
import { KhatmPlannerCard } from '../components/KhatmPlannerCard';
import { SeoHead } from '../components/SeoHead';
import { DUA_CATEGORIES, DuaCategory, QURAN_DUAS } from '../data/quranDuas';
import {
  useLastRead,
  useListeningStats,
  useReaderTransliteration,
  useReadingGoal,
  useSavedAyahs,
} from '../hooks/useReaderPreferences';
import {
  applyUserBackupToStorage,
  collectUserBackupFromStorage,
  parseAndValidateBackupJson,
} from '../lib/backup';
import { transliterateArabicToAz } from '../lib/transliteration';
import { EMPTY_HIFZ_PROGRESS, HifzProgressState, sanitizeHifzProgress, summarizeHifzProgress, summarizeJuzHifzProgress } from '../lib/hifzProgress';
import { formatListeningDurationAz } from '../lib/listeningStats';
import {
  MUHAFFIZ_RECITERS,
  MuhaffizReciterId,
  getEveryAyahAudioUrl,
} from '../lib/muhaffiz';
import {
  JUZ_PAGE_RANGES,
  SURAH_CATALOG,
  TOTAL_QURAN_PAGES,
  TOTAL_QURAN_SURAHS,
  filterSurahCatalog,
  formatAzerbaijaniOrdinal,
  getJuzForPage,
  getPagesForJuz,
} from '../lib/quran';
import { searchQuranVersesWithFallback } from '../lib/quranClient';
import { QuranSearchMatch, formatSavedAyahsForExport, parseQuickQuranTarget } from '../lib/readerState';
import { DailyGoalPages } from '../lib/readingGoal';
import { RUB_HIZB_ENTRIES, filterRubHizbEntries } from '../lib/rubHizb';
import { POPULAR_QURAN_TOPICS, buildBreadcrumbJsonLd } from '../lib/seo';
import { downloadVerseImageCard } from '../lib/verseCard';

type DirectoryBrowseMode = 'pages' | 'surahs' | 'rub' | 'search' | 'duas' | 'saved' | 'stats';

const DAILY_GOAL_OPTIONS: DailyGoalPages[] = [2, 4, 10, 20];

interface QuranDirectoryPageProps {
  initialTab?: DirectoryBrowseMode;
  initialJuz?: number;
  initialSearchQuery?: string;
  isDark: boolean;
  onNavigate: (path: string) => void;
  onToggleTheme: () => void;
}

export function QuranDirectoryPage({
  initialTab = 'pages',
  initialJuz,
  initialSearchQuery,
  isDark,
  onNavigate,
  onToggleTheme,
}: QuranDirectoryPageProps) {
  const [browseMode, setBrowseMode] = useState<DirectoryBrowseMode>(
    initialSearchQuery && initialSearchQuery.trim().length >= 2 ? 'search' : initialTab
  );
  const [surahQuery, setSurahQuery] = useState('');
  const [selectedJuz, setSelectedJuz] = useState<number | 'all'>(initialJuz ?? 'all');
  const [rubJuzFilter, setRubJuzFilter] = useState<number | 'all'>('all');
  const [rubQuery, setRubQuery] = useState('');
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [jumpFeedback, setJumpFeedback] = useState('');

  const [verseSearchInput, setVerseSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [verseResults, setVerseResults] = useState<QuranSearchMatch[]>([]);
  const [isSearchingVerses, setIsSearchingVerses] = useState(false);
  const [verseSearchError, setVerseSearchError] = useState('');
  const [copiedSavedKey, setCopiedSavedKey] = useState<string | null>(null);
  const [copiedAllSaved, setCopiedAllSaved] = useState(false);
  const [editingNoteKey, setEditingNoteKey] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [showHifzMap, setShowHifzMap] = useState(false);
  const [showReadingGoal, setShowReadingGoal] = useState(false);

  const [duaCategory, setDuaCategory] = useState<DuaCategory>('all');
  const [duaReciter, setDuaReciter] = useState<MuhaffizReciterId>('Alafasy_128kbps');
  const [playingDuaId, setPlayingDuaId] = useState<string | null>(null);
  const [copiedDuaId, setCopiedDuaId] = useState<string | null>(null);
  const [duaAudioError, setDuaAudioError] = useState('');
  const [backupMessage, setBackupMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const duaAudioRef = useRef<HTMLAudioElement | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  const lastRead = useLastRead();
  const { showTranslit, setShowTranslit } = useReaderTransliteration();
  const { savedAyahs, toggleAyahBookmark, removeAyahBookmark, updateAyahNote, isSaved } = useSavedAyahs();
  const {
    goalState,
    summary: readingGoalSummary,
    setDailyGoalPages,
    resetKhatm,
  } = useReadingGoal();
  const { summary: listeningSummary, resetStats: resetListeningStats } = useListeningStats();

  const prevInitialJuzRef = useRef<number | undefined>(initialJuz);
  useEffect(() => {
    if (initialJuz !== undefined) {
      setSelectedJuz(initialJuz);
      setBrowseMode('pages');
    } else {
      if (prevInitialJuzRef.current !== undefined) {
        setSelectedJuz('all');
      }
      if (!initialSearchQuery || initialSearchQuery.trim().length < 2) {
        setBrowseMode(initialTab);
      }
    }
    prevInitialJuzRef.current = initialJuz;
  }, [initialTab, initialJuz, initialSearchQuery]);

  const stopDuaAudio = useCallback(() => {
    if (duaAudioRef.current) {
      duaAudioRef.current.pause();
      duaAudioRef.current.onended = null;
      duaAudioRef.current.onerror = null;
      duaAudioRef.current = null;
    }
    setPlayingDuaId(null);
  }, []);

  useEffect(() => {
    return () => {
      stopDuaAudio();
    };
  }, [stopDuaAudio]);

  const filteredDuas = useMemo(
    () =>
      duaCategory === 'all'
        ? QURAN_DUAS
        : QURAN_DUAS.filter((d) => d.category === duaCategory),
    [duaCategory]
  );

  function handleToggleDuaAudio(dua: (typeof QURAN_DUAS)[number]) {
    if (playingDuaId === dua.id) {
      stopDuaAudio();
      return;
    }
    stopDuaAudio();
    setDuaAudioError('');
    const audio = new Audio(getEveryAyahAudioUrl(dua.surahNumber, dua.ayahNumber, duaReciter));
    duaAudioRef.current = audio;
    setPlayingDuaId(dua.id);
    audio.onended = () => {
      if (duaAudioRef.current !== audio) return;
      stopDuaAudio();
    };
    audio.onerror = () => {
      if (duaAudioRef.current !== audio) return;
      stopDuaAudio();
      setDuaAudioError('Duanın səsi hazırda oxudula bilmədi.');
    };
    audio.play().catch(() => {
      if (duaAudioRef.current !== audio) return;
      stopDuaAudio();
      setDuaAudioError('Audio oxutma brauzer tərəfindən dayandırıldı.');
    });
  }

  async function handleCopyDua(dua: (typeof QURAN_DUAS)[number]) {
    const text = `${dua.arabicText}\n\n"${dua.translation}"\n(${dua.surahName} surəsi, ${dua.ayahLabel} — Əlixan Musayev tərcüməsi)`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDuaId(dua.id);
      window.setTimeout(() => {
        setCopiedDuaId((cur) => (cur === dua.id ? null : cur));
      }, 2000);
    } catch {
      // ignore clipboard error
    }
  }

  const [hifzProgress, setHifzProgress] = useState<HifzProgressState>(EMPTY_HIFZ_PROGRESS);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('quranqiraeti_hifz_progress_v1');
      if (raw) setHifzProgress(sanitizeHifzProgress(JSON.parse(raw)));
    } catch {
      // ignore storage error
    }
  }, []);
  const hifzSummary = useMemo(() => summarizeHifzProgress(hifzProgress), [hifzProgress]);
  const juzHifzSummary = useMemo(() => summarizeJuzHifzProgress(hifzProgress), [hifzProgress]);

  const filteredSurahs = useMemo(
    () =>
      filterSurahCatalog(SURAH_CATALOG, {
        query: surahQuery,
        place: 'all',
      }),
    [surahQuery]
  );

  const filteredRubs = useMemo(
    () =>
      filterRubHizbEntries(RUB_HIZB_ENTRIES, {
        juz: rubJuzFilter,
        query: rubQuery,
      }),
    [rubJuzFilter, rubQuery]
  );

  const visiblePages = useMemo(() => getPagesForJuz(selectedJuz), [selectedJuz]);

  const surahByStartPage = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of SURAH_CATALOG) {
      const prev = map.get(s.startPage);
      map.set(s.startPage, prev ? `${prev}, ${s.name}` : s.name);
    }
    return map;
  }, []);

  const activeJuzRange = useMemo(
    () => (initialJuz ? JUZ_PAGE_RANGES.find((j) => j.juz === initialJuz) : undefined),
    [initialJuz]
  );

  const isDuasRoute = initialTab === 'duas';

  const jsonLd = useMemo(() => {
    if (activeJuzRange) {
      const ordinal = formatAzerbaijaniOrdinal(activeJuzRange.juz);
      return [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${ordinal} Cüz — Qurani-Kərim (Səhifə ${activeJuzRange.startPage}–${activeJuzRange.endPage})`,
          inLanguage: ['ar', 'az'],
          url: `${window.location.origin}/quran/cuz/${activeJuzRange.juz}`,
        },
        buildBreadcrumbJsonLd(window.location.origin, [
          { name: 'Ana səhifə', path: '/' },
          { name: 'Qurani-Kərim', path: '/quran' },
          { name: `${ordinal} Cüz`, path: `/quran/cuz/${activeJuzRange.juz}` },
        ]),
      ];
    }

    if (isDuasRoute) {
      return [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Qurandakı Dualar (Rəbbənə Duaları)',
          inLanguage: ['az', 'ar'],
          url: `${window.location.origin}/dualar`,
        },
        buildBreadcrumbJsonLd(window.location.origin, [
          { name: 'Ana səhifə', path: '/' },
          { name: 'Qurani-Kərim', path: '/quran' },
          { name: 'Qurandakı Dualar', path: '/dualar' },
        ]),
      ];
    }

    return [
      {
        '@context': 'https://schema.org',
        '@type': 'Book',
        name: 'Qurani-Kərim (Mədinə çapı, 604 səhifə) — Ərəbcə mətn və Əlixan Musayevin Azərbaycan tərcüməsi',
        inLanguage: ['ar', 'az'],
        numberOfPages: TOTAL_QURAN_PAGES,
        translator: {
          '@type': 'Person',
          name: 'Əlixan Musayev',
        },
        url: `${window.location.origin}/quran`,
      },
      buildBreadcrumbJsonLd(window.location.origin, [
        { name: 'Ana səhifə', path: '/' },
        { name: 'Qurani-Kərim', path: '/quran' },
      ]),
    ];
  }, [activeJuzRange, isDuasRoute]);

  function handleJumpSubmit(e: FormEvent) {
    e.preventDefault();
    const target = parseQuickQuranTarget(jumpPageInput);
    if (!target) {
      setJumpFeedback('Səhifə (1–604), surə:ayə (məs. 2:255) və ya surə adı yazın.');
      return;
    }
    setJumpFeedback('');
    onNavigate(target.path);
  }

  const runVerseSearch = useCallback(async (queryToRun: string) => {
    const clean = queryToRun.trim();
    if (clean.length < 2) return;
    setActiveSearchQuery(clean);
    setIsSearchingVerses(true);
    setVerseSearchError('');
    try {
      const matches = await searchQuranVersesWithFallback(clean);
      setVerseResults(matches);
    } catch {
      setVerseSearchError('Ayə axtarışı hazırda yerinə yetirilə bilmədi. Zəhmət olmasa yenidən yoxlayın.');
    } finally {
      setIsSearchingVerses(false);
    }
  }, []);

  const lastAppliedQueryRef = useRef('');
  useEffect(() => {
    const clean = (initialSearchQuery ?? '').trim();
    if (clean.length >= 2 && clean !== lastAppliedQueryRef.current) {
      lastAppliedQueryRef.current = clean;
      setBrowseMode('search');
      setVerseSearchInput(clean);
      void runVerseSearch(clean);
    }
  }, [initialSearchQuery, runVerseSearch]);

  function handleVerseSearchSubmit(e: FormEvent) {
    e.preventDefault();
    void runVerseSearch(verseSearchInput);
  }

  async function handleCopySavedAyah(
    surahNum: number,
    surahName: string,
    ayahNum: number,
    arabic: string,
    translation: string
  ) {
    const key = `${surahNum}:${ayahNum}`;
    const text = `${arabic}\n\n"${translation}"\n(${surahName} surəsi, ${key} — Əlixan Musayev tərcüməsi)`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSavedKey(key);
      window.setTimeout(() => {
        setCopiedSavedKey((cur) => (cur === key ? null : cur));
      }, 2000);
    } catch {
      // ignore clipboard error
    }
  }

  async function handleCopyAllSavedAyahs() {
    const payload = formatSavedAyahsForExport(savedAyahs);
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedAllSaved(true);
      window.setTimeout(() => setCopiedAllSaved(false), 2000);
    } catch {
      // ignore clipboard error
    }
  }

  function handleDownloadSavedTxt() {
    const payload = formatSavedAyahsForExport(savedAyahs);
    if (!payload) return;
    const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quran-qiraeti-saxlanilan-ayeler.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function handleExportBackupJson() {
    const backup = collectUserBackupFromStorage();
    const payload = JSON.stringify(backup, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quran-qiraeti-ehtiyat-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setBackupMessage({
      kind: 'ok',
      text: `Ehtiyat nüsxə endirildi (${backup.savedAyahs.length} ayə, ${Object.keys(backup.hifzProgress.pages).length} Mühafiz səhifəsi, ${backup.readingGoal.khatmPages.length} Xətm səhifəsi).`,
    });
  }

  async function handleImportBackupJson(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const result = parseAndValidateBackupJson(text);
      if (!result.ok) {
        setBackupMessage({ kind: 'err', text: result.error });
        return;
      }
      applyUserBackupToStorage(result.data);
      setHifzProgress(result.data.hifzProgress);
      setBackupMessage({
        kind: 'ok',
        text: `Bərpa tamamlandı: ${result.data.savedAyahs.length} saxlanılan ayə, ${Object.keys(result.data.hifzProgress.pages).length} Mühafiz səhifəsi və ${result.data.readingGoal.khatmPages.length} Xətm səhifəsi yükləndi.`,
      });
    } catch {
      setBackupMessage({ kind: 'err', text: 'Fayl oxunarkən xəta baş verdi.' });
    }
  }

  const seoTitle = activeJuzRange
    ? `${formatAzerbaijaniOrdinal(activeJuzRange.juz)} Cüz (Səhifə ${activeJuzRange.startPage}–${activeJuzRange.endPage}) | Quran Qiraeti`
    : isDuasRoute
      ? 'Qurandakı Dualar (Rəbbənə Duaları) | Quran Qiraeti'
      : 'Tam Qurani-Kərim — Mədinə Çapı (604 Səhifə) və 114 Surə | Quran Qiraeti';

  const seoDescription = activeJuzRange
    ? `Mədinə Mushafının ${formatAzerbaijaniOrdinal(activeJuzRange.juz)} Cüzü (Səhifə ${activeJuzRange.startPage}–${activeJuzRange.endPage}): ərəbcə mətn və Əlixan Musayevin Azərbaycan tərcüməsi.`
    : isDuasRoute
      ? 'Qurani-Kərimdən seçilmiş 20 səhih Rəbbənə və peyğəmbər duası — ərəbcə mətn, Əlixan Musayevin Azərbaycan tərcüməsi, səsli tilavət və şəkil kartı.'
      : 'Mədinə çapı üzrə Qurani-Kərimin 604 səhifəsi və 114 surəsi: hər səhifədə Mədinə müshəfindəki dəqiq ayə sayı, ərəbcə mətn və Əlixan Musayevin Azərbaycan tərcüməsi (v1.0.4).';

  const seoPath = activeJuzRange
    ? `/quran/cuz/${activeJuzRange.juz}`
    : isDuasRoute
      ? '/dualar'
      : '/quran';

  return (
    <section className="py-14 lg:py-16">
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        path={seoPath}
        ogImage="/og-default.png"
        prevPath={
          activeJuzRange && activeJuzRange.juz > 1 ? `/quran/cuz/${activeJuzRange.juz - 1}` : undefined
        }
        nextPath={
          activeJuzRange && activeJuzRange.juz < 30 ? `/quran/cuz/${activeJuzRange.juz + 1}` : undefined
        }
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-6xl px-6">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]"
          >
            Ana səhifə
          </a>
          <span aria-hidden="true">›</span>
          {activeJuzRange ? (
            <>
              <a
                href="/quran"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/quran');
                }}
                className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]"
              >
                Qurani-Kərim
              </a>
              <span aria-hidden="true">›</span>
              <span className="font-medium text-stone-900 dark:text-stone-200">
                {formatAzerbaijaniOrdinal(activeJuzRange.juz)} Cüz
              </span>
            </>
          ) : isDuasRoute ? (
            <>
              <a
                href="/quran"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/quran');
                }}
                className="hover:text-[#0F4C3A] dark:hover:text-[#86C7AE]"
              >
                Qurani-Kərim
              </a>
              <span aria-hidden="true">›</span>
              <span className="font-medium text-stone-900 dark:text-stone-200">Qurandakı Dualar</span>
            </>
          ) : (
            <span className="font-medium text-stone-900 dark:text-stone-200">Qurani-Kərim</span>
          )}
        </nav>

        {/* Header */}
        <div className="flex flex-col gap-6 border-b border-stone-200 pb-8 sm:flex-row sm:items-end sm:justify-between dark:border-stone-800">
          <div>
            <p className="text-xs font-medium tracking-widest text-stone-500 dark:text-stone-400">
              Tam Qurani-Kərim · Mədinə çapı (<span className="font-mono-tabular">604</span> səhifə) · Əlixan Musayev (v1.0.4)
            </p>
            <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl text-balance dark:text-stone-100">
              {activeJuzRange
                ? `${formatAzerbaijaniOrdinal(activeJuzRange.juz)} Cüz — Səhifə ${activeJuzRange.startPage}–${activeJuzRange.endPage}`
                : isDuasRoute
                  ? 'Qurandakı Dualar (Rəbbənə və Peyğəmbər Duaları)'
                  : 'Qurani-Kərim: Mədinə çapı üzrə səhifələr və surələr'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              {activeJuzRange
                ? `Mədinə Mushafının ${formatAzerbaijaniOrdinal(activeJuzRange.juz)} Cüzünə daxil olan ${activeJuzRange.startPage}–${activeJuzRange.endPage} arası səhifələri oxuyun və Mühafizdə əzbərləyin.`
                : isDuasRoute
                  ? 'Qurani-Kərimdən seçilmiş səhih duaları mövzulara görə süzün, ərəbcə tilavəti dinləyin və şəkil kartı kimi paylaşın.'
                  : `Mədinə çapına uyğun olaraq bütün ${TOTAL_QURAN_PAGES} səhifə və ${TOTAL_QURAN_SURAHS} surə ayrıca SEO ünvanlarına bölünmüşdür. Hər səhifədə Mədinə çapındakı dəqiq ayə sayı ərəbcə mətn və Əlixan Musayevin son nəşr tərcüməsi ilə göstərilir.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href={activeJuzRange ? `/quran/sehife/${activeJuzRange.startPage}` : '/quran/sehife/1'}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(activeJuzRange ? `/quran/sehife/${activeJuzRange.startPage}` : '/quran/sehife/1');
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F4C3A] px-4 py-2.5 text-xs font-medium text-white whitespace-nowrap transition-colors hover:bg-[#0B3A2C] dark:bg-[#196B52]"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>
                {activeJuzRange
                  ? `${activeJuzRange.startPage}-ci səhifədən oxu`
                  : '1-ci səhifədən oxu'}
              </span>
            </a>

            <a
              href="/elifba"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/elifba');
              }}
              data-testid="directory-elifba-link"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 whitespace-nowrap transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200 dark:hover:border-[#86C7AE] min-h-[40px]"
            >
              <span>Əlifba və Təcvid</span>
            </a>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Gündüz oxu rejiminə keç' : 'Gecə oxu rejiminə keç'}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 whitespace-nowrap transition-colors hover:border-stone-300 hover:text-stone-900 dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200 dark:hover:border-stone-600 min-h-[40px]"
            >
              {isDark ? (
                <>
                  <Sun className="h-4 w-4 text-[#C6A769]" aria-hidden="true" />
                  <span>Gündüz rejimi</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-[#0F4C3A]" aria-hidden="true" />
                  <span>Gecə rejimi</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div
          data-testid="quran-resume-bar"
          className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-stone-200 bg-[#F7F5F0] px-5 py-3.5 text-xs dark:border-stone-800 dark:bg-[#141916]"
        >
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-stone-700 dark:text-stone-300">
            {lastRead && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-stone-500 dark:text-stone-400">Son oxunan:</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">{lastRead.label}</span>
                <a
                  href={lastRead.path}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(lastRead.path);
                  }}
                  className="ml-1 font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
                >
                  Davam et →
                </a>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-stone-600 dark:text-stone-400">
              <span>
                Bu gün:{' '}
                <span className="font-mono-tabular font-semibold text-stone-900 dark:text-stone-100">
                  {readingGoalSummary.todayCount}/{readingGoalSummary.goalPages}
                </span>{' '}
                səh
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-[#C6A769]" aria-hidden="true" />
                Ardıcıl:{' '}
                <span className="font-mono-tabular font-semibold text-stone-900 dark:text-stone-100">
                  {readingGoalSummary.streakDays} gün
                </span>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Xətm:{' '}
                <span className="font-mono-tabular font-semibold text-stone-900 dark:text-stone-100">
                  {readingGoalSummary.khatmCount}/604
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-stone-600 dark:text-stone-400">
            <button
              type="button"
              onClick={() => setShowReadingGoal((prev) => !prev)}
              aria-expanded={showReadingGoal}
              data-testid="toggle-reading-goal"
              className="rounded-md border border-stone-200 bg-white px-2.5 py-1 font-medium text-stone-700 transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200 dark:hover:border-[#86C7AE]"
            >
              {showReadingGoal ? 'Planı gizlət' : 'Vird və Xətm Planı'}
            </button>

            {hifzSummary.memorizedCount > 0 && (
              <span>
                Əzbər:{' '}
                <span className="font-mono-tabular font-semibold text-stone-900 dark:text-stone-100">
                  {hifzSummary.memorizedCount} / 604
                </span>
              </span>
            )}
            {hifzProgress.bookmarkedPage !== null && (
              <a
                href={`/muhaffiz/${hifzProgress.bookmarkedPage}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(`/muhaffiz/${hifzProgress.bookmarkedPage}`);
                }}
                className="font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
              >
                Mühafiz əlfəcini: Səh. {hifzProgress.bookmarkedPage} →
              </a>
            )}
            {(hifzSummary.memorizedCount > 0 || hifzProgress.bookmarkedPage !== null) && (
              <button
                type="button"
                onClick={() => setShowHifzMap((prev) => !prev)}
                aria-expanded={showHifzMap}
                data-testid="toggle-juz-hifz-map"
                className="rounded-md border border-stone-200 bg-white px-2.5 py-1 font-medium text-stone-700 transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200 dark:hover:border-[#86C7AE]"
              >
                {showHifzMap ? '30 Cüz xəritəsini gizlət' : '30 Cüz xəritəsi'}
              </button>
            )}
          </div>
        </div>

        {showReadingGoal && (
          <div
            data-testid="reading-goal-panel"
            className="mt-4 rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-[#141916]"
          >
            <div className="flex flex-col gap-4 border-b border-stone-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-stone-800">
              <div>
                <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
                  Gündəlik Vird və 604 Səhifəlik Xətm İzləyicisi
                </h2>
                <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                  Hər Mushaf və ya Mühafiz səhifəsini oxuduqca gündəlik hədəf və xətm faizi avtomatik hesablanır.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-stone-500 dark:text-stone-400">Gündəlik hədəf:</span>
                {DAILY_GOAL_OPTIONS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setDailyGoalPages(goal)}
                    data-testid={`goal-option-${goal}`}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      readingGoalSummary.goalPages === goal
                        ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                        : 'border border-stone-200 bg-[#F7F5F0] text-stone-700 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200'
                    }`}
                  >
                    <span className="font-mono-tabular">{goal}</span> səh/gün
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-stone-200 bg-[#F7F5F0] p-4 dark:border-stone-800 dark:bg-[#181E1B]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-stone-400">Bugünkü tilavət</span>
                  <span className="font-mono-tabular font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
                    {readingGoalSummary.todayCount} / {readingGoalSummary.goalPages} səhifə
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                  <div
                    style={{ width: `${readingGoalSummary.todayPercent}%` }}
                    className="h-full bg-[#0F4C3A] transition-all duration-300 dark:bg-[#86C7AE]"
                  />
                </div>
                <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400">
                  Gündəlik virdin <span className="font-mono-tabular font-medium">{readingGoalSummary.todayPercent}%</span>-i tamamlanıb
                </p>
              </div>

              <div className="rounded-lg border border-stone-200 bg-[#F7F5F0] p-4 dark:border-stone-800 dark:bg-[#181E1B]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-stone-400">Ardıcıllıq</span>
                  <Flame className="h-4 w-4 text-[#C6A769]" aria-hidden="true" />
                </div>
                <p className="font-mono-tabular mt-2 text-2xl font-semibold text-stone-900 dark:text-stone-100">
                  {readingGoalSummary.streakDays} gün
                </p>
                <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                  Fasiləsiz gündəlik Quran oxuma zənciri
                </p>
              </div>

              <div className="rounded-lg border border-stone-200 bg-[#F7F5F0] p-4 dark:border-stone-800 dark:bg-[#181E1B]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-stone-400">Ümumi Xətm</span>
                  <span className="font-mono-tabular font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
                    {readingGoalSummary.khatmCount} / 604 ({readingGoalSummary.khatmPercent}%)
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                  <div
                    style={{ width: `${Math.min(100, readingGoalSummary.khatmPercent)}%` }}
                    className="h-full bg-[#C6A769] transition-all duration-300"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                  <span data-testid="reading-goal-eta">
                    {readingGoalSummary.remainingPages === 0
                      ? 'Xətm tamamlandı!'
                      : `Təxmini bitmə: ${readingGoalSummary.estimatedDaysLeft} gün`}
                  </span>
                  {readingGoalSummary.khatmCount > 0 && (
                    <button
                      type="button"
                      onClick={resetKhatm}
                      className="inline-flex items-center gap-1 font-medium text-stone-600 hover:text-red-700 dark:text-stone-400 dark:hover:text-red-400"
                    >
                      <RotateCcw className="h-3 w-3" aria-hidden="true" />
                      <span>Sıfırla</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <KhatmPlannerCard goalState={goalState} onNavigate={onNavigate} />

            <CalendarReminderCard goalPages={readingGoalSummary.goalPages} className="mt-4" />

            <div className="mt-4 flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-stone-800">
              <div>
                <p className="text-xs font-medium text-stone-800 dark:text-stone-200">
                  Məlumatların Ehtiyat Nüsxəsi (Xətm · Mühafiz · Saxlanılan Ayələr)
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Başqa cihaza köçürmək üçün tərəqqinizi JSON faylı kimi endirin və ya bərpa edin.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportBackupJson}
                  data-testid="backup-export-btn"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-[#F7F5F0] px-3 py-1.5 text-xs font-medium text-stone-800 whitespace-nowrap transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Nüsxə endir (.json)</span>
                </button>

                <button
                  type="button"
                  onClick={() => backupInputRef.current?.click()}
                  data-testid="backup-import-btn"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 whitespace-nowrap transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Fayldan bərpa et</span>
                </button>
                <input
                  ref={backupInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportBackupJson}
                  data-testid="backup-import-input"
                  className="sr-only"
                  aria-label="Ehtiyat nüsxə JSON faylını seçin"
                />
              </div>
            </div>

            {backupMessage && (
              <p
                role="status"
                data-testid="backup-status-message"
                className={`mt-3 text-xs font-medium ${
                  backupMessage.kind === 'ok'
                    ? 'text-[#0F4C3A] dark:text-[#86C7AE]'
                    : 'text-red-700 dark:text-red-400'
                }`}
              >
                {backupMessage.text}
              </p>
            )}
          </div>
        )}

        {showHifzMap && (hifzSummary.memorizedCount > 0 || hifzProgress.bookmarkedPage !== null) && (
          <div
            data-testid="quran-juz-hifz-map"
            className="mt-4 rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-[#141916]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
                  30 Cüz üzrə Hifz xəritəsi
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Hər hansı cüzə klikləyərək birbaşa Mühafizdə həmin cüzün ilk səhifəsini açın.
                </p>
              </div>
              <span className="font-mono-tabular text-xs font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
                Cəmi: {hifzSummary.memorizedCount} / 604 səhifə ({hifzSummary.memorizedPercent}%)
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5 lg:grid-cols-6">
              {juzHifzSummary.map((item) => (
                <a
                  key={item.juz}
                  href={`/muhaffiz/${item.startPage}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(`/muhaffiz/${item.startPage}`);
                  }}
                  className="group rounded-lg border border-stone-200 bg-[#F7F5F0] p-2.5 transition-colors hover:border-[#0F4C3A] dark:border-stone-800 dark:bg-[#181E1B] dark:hover:border-[#86C7AE]"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-900 group-hover:text-[#0F4C3A] dark:text-stone-100 dark:group-hover:text-[#86C7AE]">
                      {item.juz}. Cüz
                    </span>
                    <span className="font-mono-tabular text-[11px] text-stone-500 dark:text-stone-400">
                      {item.memorizedPages}/{item.totalPages}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                    <div
                      style={{ width: `${Math.min(100, item.memorizedPercent)}%` }}
                      className="h-full bg-[#0F4C3A] transition-all duration-300 dark:bg-[#86C7AE]"
                    />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Popular Verses & Surahs Quick Links (SEO Internal Linking) */}
        <section
          aria-labelledby="popular-quran-topics-heading"
          data-testid="popular-quran-topics"
          className="mt-8"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="popular-quran-topics-heading"
              className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100"
            >
              Ən Çox Axtarılan Surələr və Məşhur Ayələr
            </h2>
            <a
              href="/muhaffiz"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/muhaffiz');
              }}
              className="text-xs font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
            >
              Mühafiz (Əzbər Mushafı) →
            </a>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {POPULAR_QURAN_TOPICS.map((topic) => (
              <div
                key={topic.id}
                className="flex flex-col justify-between rounded-xl border border-stone-200 bg-[#F7F5F0] p-4 dark:border-stone-800 dark:bg-[#141916]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <a
                      href={`/quran/sehife/${topic.pageNumber}${topic.anchorHash ?? ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`/quran/sehife/${topic.pageNumber}${topic.anchorHash ?? ''}`);
                      }}
                      className="font-display text-base font-semibold text-stone-900 hover:text-[#0F4C3A] dark:text-stone-100 dark:hover:text-[#86C7AE]"
                    >
                      {topic.title}
                    </a>
                    <span
                      dir="rtl"
                      lang="ar"
                      className="font-arabic shrink-0 text-base text-[#0F4C3A] dark:text-[#86C7AE]"
                    >
                      {topic.arabicLabel}
                    </span>
                  </div>
                  <p className="mt-1 font-mono-tabular text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    {topic.searchHint}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
                    {topic.summary}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-stone-200/80 pt-2.5 text-[11px] dark:border-stone-800">
                  <a
                    href={`/quran/sure/${topic.surahNumber}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/quran/sure/${topic.surahNumber}`);
                    }}
                    className="font-medium text-stone-600 hover:text-[#0F4C3A] dark:text-stone-400 dark:hover:text-[#86C7AE]"
                  >
                    Surəni aç
                  </a>
                  <a
                    href={`/muhaffiz/${topic.pageNumber}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/muhaffiz/${topic.pageNumber}`);
                    }}
                    className="font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
                  >
                    Mühafizdə əzbərlə
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mode Switcher: Mədinə çapı səhifələri (604) vs Surələr (114) vs Ayə axtarışı vs Saxlanılan ayələr */}
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div
            role="tablist"
            aria-label="Quran bölmə rejimi"
            className="flex flex-wrap items-center gap-1 self-start rounded-lg bg-[#F1EFE9] p-1 dark:bg-[#181E1B]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={browseMode === 'pages'}
              onClick={() => setBrowseMode('pages')}
              className={`rounded-md px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                browseMode === 'pages'
                  ? 'bg-white text-stone-900 shadow-xs dark:bg-[#242D28] dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
              }`}
            >
              Mədinə səhifələri (<span className="font-mono-tabular">604</span>)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={browseMode === 'surahs'}
              onClick={() => setBrowseMode('surahs')}
              className={`rounded-md px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                browseMode === 'surahs'
                  ? 'bg-white text-stone-900 shadow-xs dark:bg-[#242D28] dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
              }`}
            >
              Surələr (<span className="font-mono-tabular">114</span>)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={browseMode === 'rub'}
              onClick={() => setBrowseMode('rub')}
              data-testid="tab-rub-nav"
              className={`rounded-md px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                browseMode === 'rub'
                  ? 'bg-white text-stone-900 shadow-xs dark:bg-[#242D28] dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
              }`}
            >
              240 Rüb (ربع الحزب)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={browseMode === 'search'}
              onClick={() => setBrowseMode('search')}
              data-testid="tab-verse-search"
              className={`rounded-md px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                browseMode === 'search'
                  ? 'bg-white text-stone-900 shadow-xs dark:bg-[#242D28] dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
              }`}
            >
              Ayə axtarışı
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={browseMode === 'duas'}
              onClick={() => setBrowseMode('duas')}
              data-testid="tab-quran-duas"
              className={`rounded-md px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                browseMode === 'duas'
                  ? 'bg-white text-stone-900 shadow-xs dark:bg-[#242D28] dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
              }`}
            >
              Qurandan Dualar (<span className="font-mono-tabular">{QURAN_DUAS.length}</span>)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={browseMode === 'saved'}
              onClick={() => setBrowseMode('saved')}
              data-testid="tab-saved-ayahs"
              className={`rounded-md px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                browseMode === 'saved'
                  ? 'bg-white text-stone-900 shadow-xs dark:bg-[#242D28] dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
              }`}
            >
              Saxlanılan ayələr (<span className="font-mono-tabular">{savedAyahs.length}</span>)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={browseMode === 'stats'}
              onClick={() => setBrowseMode('stats')}
              data-testid="tab-listening-stats"
              className={`rounded-md px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                browseMode === 'stats'
                  ? 'bg-white text-stone-900 shadow-xs dark:bg-[#242D28] dark:text-stone-100'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
              }`}
            >
              Dinləmə Statistikası
            </button>
          </div>

          {/* Direct Smart Jump Form (Page 1-604, Surah:Ayah 2:255, or Surah name) */}
          <div className="flex flex-col items-start lg:items-end">
            <form onSubmit={handleJumpSubmit} className="flex items-center gap-2">
              <label htmlFor="quick-page-jump" className="sr-only">
                Səhifə (1–604), surə:ayə (məs. 2:255) və ya surə adı
              </label>
              <input
                id="quick-page-jump"
                type="text"
                value={jumpPageInput}
                onChange={(e) => {
                  setJumpPageInput(e.target.value);
                  if (jumpFeedback) setJumpFeedback('');
                }}
                placeholder="Səhifə, 2:255 və ya surə..."
                className="w-48 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-stone-800 whitespace-nowrap transition-colors hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-200"
              >
                <span>Keçid et</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </form>
            {jumpFeedback && (
              <p role="status" className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                {jumpFeedback}
              </p>
            )}
          </div>
        </div>

        {browseMode === 'surahs' ? (
          <>
            {/* Unified Surah Search */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                <span className="font-mono-tabular">{filteredSurahs.length}</span> surə göstərilir ·
                Hər surə daxilində ayələr Mədinə çapı səhifələrinə bölünərək təqdim olunur
              </p>

              <div className="relative w-full sm:w-80">
                <label htmlFor="surah-directory-search" className="sr-only">
                  Surə axtar
                </label>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400"
                  aria-hidden="true"
                />
                <input
                  id="surah-directory-search"
                  type="text"
                  value={surahQuery}
                  onChange={(e) => setSurahQuery(e.target.value)}
                  placeholder="Surə adı və ya nömrəsi (məs. 36, Yasin)"
                  className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pr-9 pl-10 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100 dark:placeholder:text-stone-500"
                />
                {surahQuery && (
                  <button
                    type="button"
                    onClick={() => setSurahQuery('')}
                    aria-label="Surə axtarışını təmizlə"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {filteredSurahs.length > 0 ? (
              <div
                data-testid="surah-grid"
                className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filteredSurahs.map((surah) => (
                  <article
                    key={surah.number}
                    className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-[#0F4C3A]/60 dark:border-stone-800 dark:bg-[#141916] dark:hover:border-[#86C7AE]/50"
                  >
                    <a
                      href={`/quran/sure/${surah.number}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`/quran/sure/${surah.number}`);
                      }}
                      className="flex items-start justify-between gap-4 focus-visible:outline-none"
                    >
                      <div>
                        <p className="font-mono-tabular text-xs font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
                          {String(surah.number).padStart(3, '0')}
                        </p>
                        <h2 className="font-display mt-1 text-xl font-semibold text-stone-900 group-hover:text-[#0F4C3A] dark:text-stone-100 dark:group-hover:text-[#86C7AE]">
                          {surah.name} surəsi
                        </h2>
                        <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
                          <span className="font-mono-tabular">{surah.ayahCount} ayə</span>
                          <span aria-hidden="true" className="mx-1.5">·</span>
                          <span>{surah.revelationPlace}</span>
                        </p>
                      </div>

                      <span
                        dir="rtl"
                        lang="ar"
                        className="font-arabic text-xl text-stone-800 dark:text-stone-200 shrink-0"
                      >
                        {surah.arabicName}
                      </span>
                    </a>

                    <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs dark:border-stone-800/80">
                      <a
                        href={`/quran/sehife/${surah.startPage}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(`/quran/sehife/${surah.startPage}`);
                        }}
                        className="text-stone-500 hover:text-[#0F4C3A] dark:text-stone-400 dark:hover:text-[#86C7AE]"
                      >
                        Mədinə çapı: Səh. <span className="font-mono-tabular">{surah.startPage}</span>
                      </a>

                      <a
                        href={`/quran/sure/${surah.number}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(`/quran/sure/${surah.number}`);
                        }}
                        className="font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
                      >
                        Surəni oxu
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-xl border border-stone-200 bg-[#F3F1EC] p-8 text-center dark:border-stone-800 dark:bg-[#141916]">
                <p className="font-display text-2xl font-medium text-stone-900 dark:text-stone-100">
                  Axtarışa uyğun surə tapılmadı
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSurahQuery('');
                  }}
                  className="mt-4 rounded-lg bg-[#0F4C3A] px-5 py-2.5 text-xs font-medium text-white"
                >
                  Bütün surələri göstər
                </button>
              </div>
            )}
          </>
        ) : browseMode === 'pages' ? (
          /* 604 Mushaf Pages View */
          <div className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="juz-select"
                  className="text-xs font-medium text-stone-600 dark:text-stone-400 whitespace-nowrap"
                >
                  Cüz üzrə süz:
                </label>
                <select
                  id="juz-select"
                  value={selectedJuz}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'all') {
                      setSelectedJuz('all');
                      onNavigate('/quran');
                    } else {
                      const nextJuz = Number.parseInt(val, 10);
                      setSelectedJuz(nextJuz);
                      onNavigate(`/quran/cuz/${nextJuz}`);
                    }
                  }}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100"
                >
                  <option value="all">Bütün Quran (1–604 səhifə)</option>
                  {JUZ_PAGE_RANGES.map((range) => (
                    <option key={range.juz} value={range.juz}>
                      {range.juz}. Cüz (Səhifə {range.startPage}–{range.endPage})
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-stone-500 dark:text-stone-400">
                <span className="font-mono-tabular">{visiblePages.length}</span> səhifə · Hər
                səhifə ayrıca oxu səhifəsində açılır
              </p>
            </div>

            <nav
              aria-label="30 Cüz indeksi"
              data-testid="juz-links-nav"
              className="mt-4 flex flex-wrap items-center gap-1.5"
            >
              <a
                href="/quran"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedJuz('all');
                  onNavigate('/quran');
                }}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedJuz === 'all'
                    ? 'border-[#0F4C3A] bg-[#0F4C3A] text-white dark:border-[#86C7AE] dark:bg-[#196B52]'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-[#0F4C3A] dark:border-stone-800 dark:bg-[#141916] dark:text-stone-300'
                }`}
              >
                Hamısı
              </a>
              {JUZ_PAGE_RANGES.map((range) => (
                <a
                  key={range.juz}
                  href={`/quran/cuz/${range.juz}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedJuz(range.juz);
                    onNavigate(`/quran/cuz/${range.juz}`);
                  }}
                  className={`font-mono-tabular rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedJuz === range.juz
                      ? 'border-[#0F4C3A] bg-[#0F4C3A] text-white dark:border-[#86C7AE] dark:bg-[#196B52]'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-[#0F4C3A] dark:border-stone-800 dark:bg-[#141916] dark:text-stone-300'
                  }`}
                >
                  {range.juz}. Cüz
                </a>
              ))}
            </nav>

            <div
              data-testid="mushaf-pages-grid"
              className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
            >
              {visiblePages.map((pageNum) => {
                const startSurahs = surahByStartPage.get(pageNum);
                const juz = getJuzForPage(pageNum);
                return (
                  <a
                    key={pageNum}
                    href={`/quran/sehife/${pageNum}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/quran/sehife/${pageNum}`);
                    }}
                    className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-3.5 transition-colors hover:border-[#0F4C3A] dark:border-stone-800 dark:bg-[#141916] dark:hover:border-[#86C7AE]"
                  >
                    <span className="font-mono-tabular text-base font-semibold text-stone-900 dark:text-stone-100">
                      Səh. {pageNum}
                    </span>
                    <span className="mt-1 truncate text-[11px] text-stone-500 dark:text-stone-400">
                      {startSurahs ? startSurahs : `${formatAzerbaijaniOrdinal(juz)} Cüz`}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        ) : browseMode === 'rub' ? (
          /* 240 Rüb (ربع الحزب ۞) Navigation Panel */
          <div className="mt-6" data-testid="rub-nav-panel">
            <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-[#F7F5F0] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-stone-800 dark:bg-[#141916]">
              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor="rub-juz-filter"
                  className="text-xs font-medium text-stone-600 dark:text-stone-400 whitespace-nowrap"
                >
                  Cüz üzrə:
                </label>
                <select
                  id="rub-juz-filter"
                  value={rubJuzFilter}
                  onChange={(e) =>
                    setRubJuzFilter(
                      e.target.value === 'all' ? 'all' : Number.parseInt(e.target.value, 10)
                    )
                  }
                  data-testid="rub-juz-filter"
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-100"
                >
                  <option value="all">Bütün 240 Rüb (30 Cüz · 60 Hizb)</option>
                  {JUZ_PAGE_RANGES.map((range) => (
                    <option key={range.juz} value={range.juz}>
                      {range.juz}. Cüz (Rüb {(range.juz - 1) * 8 + 1}–{range.juz * 8})
                    </option>
                  ))}
                </select>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  <span className="font-mono-tabular font-semibold text-stone-900 dark:text-stone-100">
                    {filteredRubs.length}
                  </span>{' '}
                  Rüb göstərilir
                </span>
              </div>

              <div className="relative w-full sm:w-72">
                <label htmlFor="rub-search-input" className="sr-only">
                  Surə, Rüb, Hizb və ya səhifə axtar
                </label>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-stone-400"
                  aria-hidden="true"
                />
                <input
                  id="rub-search-input"
                  type="text"
                  value={rubQuery}
                  onChange={(e) => setRubQuery(e.target.value)}
                  data-testid="rub-search-input"
                  placeholder="Surə, Rüb, Hizb və ya səhifə..."
                  className="w-full rounded-lg border border-stone-200 bg-white py-2 pr-8 pl-9 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-100"
                />
                {rubQuery && (
                  <button
                    type="button"
                    onClick={() => setRubQuery('')}
                    aria-label="Rüb axtarışını təmizlə"
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {filteredRubs.length > 0 ? (
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRubs.map((entry) => (
                  <article
                    key={entry.rub}
                    data-testid={`rub-card-${entry.rub}`}
                    className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:border-[#0F4C3A]/60 dark:border-stone-800 dark:bg-[#141916] dark:hover:border-[#86C7AE]/50"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono-tabular font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
                          Rüb {entry.rub} · Hizb {entry.hizb}
                        </span>
                        <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                          {entry.quarterLabel}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-baseline justify-between gap-3">
                        <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
                          {entry.surahName} {entry.surahNumber}:{entry.ayahNumber}
                        </h3>
                        {entry.arabicSurahName && (
                          <span
                            dir="rtl"
                            lang="ar"
                            className="font-arabic shrink-0 text-base text-stone-700 dark:text-stone-300"
                          >
                            {entry.arabicSurahName}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 font-mono-tabular text-[11px] text-stone-500 dark:text-stone-400">
                        {entry.juz}. Cüz · Səhifə {entry.pageNumber}
                      </p>
                    </div>

                    <div className="mt-3.5 flex items-center justify-between border-t border-stone-100 pt-2.5 text-xs dark:border-stone-800">
                      <a
                        href={`/muhaffiz/${entry.pageNumber}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(`/muhaffiz/${entry.pageNumber}`);
                        }}
                        className="font-medium text-stone-600 hover:text-[#0F4C3A] dark:text-stone-400 dark:hover:text-[#86C7AE]"
                      >
                        Mühafiz
                      </a>
                      <a
                        href={`/quran/sehife/${entry.pageNumber}#ayah-${entry.surahNumber}-${entry.ayahNumber}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(
                            `/quran/sehife/${entry.pageNumber}#ayah-${entry.surahNumber}-${entry.ayahNumber}`
                          );
                        }}
                        className="font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
                      >
                        Oxu →
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-stone-200 bg-[#F3F1EC] p-8 text-center dark:border-stone-800 dark:bg-[#141916]">
                <p className="font-display text-xl font-medium text-stone-900 dark:text-stone-100">
                  Axtarışa uyğun Rüb tapılmadı
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setRubJuzFilter('all');
                    setRubQuery('');
                  }}
                  className="mt-4 rounded-lg bg-[#0F4C3A] px-4 py-2 text-xs font-medium text-white dark:bg-[#196B52]"
                >
                  Bütün 240 Rübü göstər
                </button>
              </div>
            )}
          </div>
        ) : browseMode === 'search' ? (
          /* Full-Quran Keyword Search View */
          <div className="mt-6" data-testid="verse-search-panel">
            <form onSubmit={handleVerseSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-lg">
                <label htmlFor="full-quran-verse-search" className="sr-only">
                  Bütün Qurani-Kərimdə ayə axtar
                </label>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400"
                  aria-hidden="true"
                />
                <input
                  id="full-quran-verse-search"
                  type="search"
                  value={verseSearchInput}
                  onChange={(e) => setVerseSearchInput(e.target.value)}
                  placeholder="Bütün Quranda söz axtar (məs. səbir, rəhmət, şükür, dua)..."
                  className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pr-9 pl-10 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#141916] dark:text-stone-100"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingVerses || verseSearchInput.trim().length < 2}
                className="rounded-lg bg-[#0F4C3A] px-5 py-2.5 text-xs font-medium text-white whitespace-nowrap transition-colors hover:bg-[#0B3A2C] disabled:opacity-60 dark:bg-[#196B52]"
              >
                {isSearchingVerses ? 'Axtarılır...' : 'Ayələri axtar'}
              </button>
            </form>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <span>Nümunə mövzular:</span>
              {['rəhmət', 'səbir', 'şükür', 'dua', 'təqva'].map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => {
                    setVerseSearchInput(word);
                    void runVerseSearch(word);
                  }}
                  className="rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-700 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#141916] dark:text-stone-300"
                >
                  {word}
                </button>
              ))}
            </div>

            {verseSearchError && (
              <p role="alert" className="mt-4 text-xs font-medium text-red-700 dark:text-red-400">
                {verseSearchError}
              </p>
            )}

            {isSearchingVerses ? (
              <div className="mt-6 space-y-3">
                {[1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="h-24 animate-pulse rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-[#141916]"
                  />
                ))}
              </div>
            ) : activeSearchQuery && verseResults.length === 0 ? (
              <div className="mt-6 rounded-xl border border-stone-200 bg-[#F3F1EC] p-8 text-center dark:border-stone-800 dark:bg-[#141916]">
                <p className="font-display text-xl font-medium text-stone-900 dark:text-stone-100">
                  «{activeSearchQuery}» üzrə ayə tapılmadı
                </p>
                <p className="mt-1.5 text-xs text-stone-600 dark:text-stone-400">
                  Fərqli açar söz sınayın və ya birbaşa surə nömrəsi:ayə (məs. 2:255) ilə keçid edin.
                </p>
              </div>
            ) : verseResults.length > 0 ? (
              <div className="mt-6 divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-[#141916]">
                {verseResults.map((match) => (
                  <div key={`${match.surahNumber}:${match.ayahNumber}`} className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono-tabular text-xs font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
                        {match.surahName} · {match.surahNumber}:{match.ayahNumber}
                      </span>
                      <a
                        href={`/quran/sure/${match.surahNumber}#ayah-${match.ayahNumber}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(`/quran/sure/${match.surahNumber}#ayah-${match.ayahNumber}`);
                        }}
                        className="text-xs font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
                      >
                        Əlixan Musayev tərcüməsində aç →
                      </a>
                    </div>
                    <p lang="az" className="mt-2 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                      {match.snippet}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-stone-200 bg-[#F7F5F0] p-6 text-xs text-stone-600 dark:border-stone-800 dark:bg-[#141916] dark:text-stone-400">
                Qurani-Kərimin 6236 ayəsi arasında Azərbaycan dilində açar sözə görə axtarış aparın və tapılan ayəni dərhal tam surə kontekstində açın.
              </div>
            )}
          </div>
        ) : browseMode === 'duas' ? (
          /* Curated Quranic Duas Tab */
          <div className="mt-6" data-testid="quran-duas-panel">
            <div className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-[#F7F5F0] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-stone-800 dark:bg-[#141916]">
              <div className="flex flex-wrap items-center gap-1.5">
                {DUA_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setDuaCategory(cat.id)}
                    data-testid={`dua-cat-${cat.id}`}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      duaCategory === cat.id
                        ? 'bg-[#0F4C3A] text-white dark:bg-[#196B52]'
                        : 'border border-stone-200 bg-white text-stone-700 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTranslit(!showTranslit)}
                  aria-pressed={showTranslit}
                  data-testid="duas-translit-toggle"
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    showTranslit
                      ? 'border-[#0F4C3A] bg-[#0F4C3A] text-white dark:border-[#196B52] dark:bg-[#196B52]'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200'
                  }`}
                >
                  Oxunuş
                </button>
                <label htmlFor="dua-reciter-select" className="text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">
                  Qari:
                </label>
                <select
                  id="dua-reciter-select"
                  value={duaReciter}
                  onChange={(e) => {
                    stopDuaAudio();
                    setDuaReciter(e.target.value as MuhaffizReciterId);
                  }}
                  className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-100"
                >
                  {MUHAFFIZ_RECITERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {duaAudioError && (
              <p role="alert" className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300">
                {duaAudioError}
              </p>
            )}

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredDuas.map((dua) => {
                const isPlaying = playingDuaId === dua.id;
                const isCopied = copiedDuaId === dua.id;
                const saved = isSaved(dua.surahNumber, dua.ayahNumber);
                return (
                  <article
                    key={dua.id}
                    data-testid={`dua-card-${dua.id}`}
                    className={`flex flex-col justify-between rounded-xl border p-6 transition-colors ${
                      isPlaying
                        ? 'border-[#0F4C3A] bg-[#F1F6F3] dark:border-[#86C7AE] dark:bg-[#13221C]'
                        : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-[#141916]'
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
                          {dua.title}
                        </h2>
                        <span className="font-mono-tabular text-xs font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
                          {dua.surahName} · {dua.ayahLabel} · Səh. {dua.pageNumber}
                        </span>
                      </div>

                      <p
                        dir="rtl"
                        lang="ar"
                        className="font-arabic mt-4 text-right text-2xl leading-[2.2] text-stone-900 dark:text-stone-100"
                      >
                        {dua.arabicText}
                      </p>

                      {showTranslit && (
                        <p
                          lang="az-Latn"
                          className="mt-2.5 text-sm leading-relaxed font-medium text-[#0F4C3A] dark:text-[#86C7AE]"
                        >
                          {transliterateArabicToAz(dua.arabicText)}
                        </p>
                      )}

                      <p lang="az" className="mt-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                        «{dua.translation}»
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3.5 text-xs dark:border-stone-800">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleDuaAudio(dua)}
                          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                            isPlaying
                              ? 'border-[#0F4C3A] bg-[#0F4C3A] text-white dark:border-[#86C7AE] dark:bg-[#196B52]'
                              : 'border-stone-200 text-stone-700 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {isPlaying ? (
                            <>
                              <Square className="h-3 w-3" aria-hidden="true" />
                              <span>Dayandır</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Dinlə</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleAyahBookmark({
                              surahNumber: dua.surahNumber,
                              surahName: dua.surahName,
                              ayahNumber: dua.ayahNumber,
                              pageNumber: dua.pageNumber,
                              arabicText: dua.arabicText,
                              translation: dua.translation,
                            })
                          }
                          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition-colors ${
                            saved
                              ? 'border-[#C6A769] bg-[#FAF6EC] text-[#7D6127] dark:border-[#C6A769]/60 dark:bg-[#231F14] dark:text-[#E2CA93]'
                              : 'border-stone-200 text-stone-600 hover:border-stone-300 dark:border-stone-700 dark:text-stone-300'
                          }`}
                        >
                          <Bookmark className="h-3 w-3" aria-hidden="true" />
                          <span>{saved ? 'Saxlanılıb' : 'Saxla'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyDua(dua)}
                          className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-2.5 py-1 text-xs text-stone-600 hover:border-stone-300 dark:border-stone-700 dark:text-stone-300"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3 text-[#0F4C3A] dark:text-[#86C7AE]" aria-hidden="true" />
                              <span>Köçürüldü</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" aria-hidden="true" />
                              <span>Köçür</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void downloadVerseImageCard({
                              surahName: dua.surahName,
                              surahNumber: dua.surahNumber,
                              ayahNumber: dua.ayahNumber,
                              arabicText: dua.arabicText,
                              translation: dua.translation,
                              theme: isDark ? 'emerald' : 'parchment',
                            })
                          }
                          aria-label={`${dua.title} üçün şəkil kartı yüklə`}
                          className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-2.5 py-1 text-xs text-stone-600 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:text-stone-300"
                        >
                          <ImageDown className="h-3 w-3" aria-hidden="true" />
                          <span>Şəkil</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <a
                          href={`/quran/sure/${dua.surahNumber}#ayah-${dua.ayahNumber}`}
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate(`/quran/sure/${dua.surahNumber}#ayah-${dua.ayahNumber}`);
                          }}
                          className="text-stone-500 hover:text-[#0F4C3A] hover:underline dark:text-stone-400 dark:hover:text-[#86C7AE]"
                        >
                          Surədə aç
                        </a>
                        <a
                          href={`/muhaffiz/${dua.pageNumber}`}
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate(`/muhaffiz/${dua.pageNumber}`);
                          }}
                          className="font-medium text-[#0F4C3A] hover:underline dark:text-[#86C7AE]"
                        >
                          Əzbərlə
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : browseMode === 'saved' ? (
          /* Saved Favorite Ayahs Tab */
          <div className="mt-6" data-testid="saved-ayahs-panel">
            {savedAyahs.length === 0 ? (
              <div className="rounded-xl border border-stone-200 bg-[#F3F1EC] p-8 text-center dark:border-stone-800 dark:bg-[#141916]">
                <Bookmark className="mx-auto h-6 w-6 text-stone-400" aria-hidden="true" />
                <p className="font-display mt-3 text-2xl font-medium text-stone-900 dark:text-stone-100">
                  Hələ saxlanılmış ayəniz yoxdur
                </p>
                <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                  Surə və ya Mushaf səhifələrini oxuyarkən istənilən ayənin üzərindəki «Saxla» düyməsinə toxunaraq şəxsi kolleksiyanızı yarada bilərsiniz.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                  <a
                    href="/quran/sure/2#ayah-255"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/quran/sure/2#ayah-255');
                    }}
                    className="rounded-lg bg-[#0F4C3A] px-4 py-2 text-xs font-medium text-white dark:bg-[#196B52]"
                  >
                    Ayətül-Kürsi (2:255) aç
                  </a>
                  <a
                    href="/quran/sure/94#ayah-5"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/quran/sure/94#ayah-5');
                    }}
                    className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-800 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
                  >
                    İnşirah 94:5–6 aç
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-[#F7F5F0] px-5 py-3 dark:border-stone-800 dark:bg-[#141916]">
                  <p className="text-xs text-stone-600 dark:text-stone-300">
                    <span className="font-mono-tabular font-semibold text-stone-900 dark:text-stone-100">
                      {savedAyahs.length}
                    </span>{' '}
                    saxlanılan ayə və şəxsi qeydlər
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyAllSavedAyahs}
                      className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
                    >
                      {copiedAllSaved ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#0F4C3A] dark:text-[#86C7AE]" aria-hidden="true" />
                          <span>Hamısı köçürüldü</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Hamısını köçür</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadSavedTxt}
                      data-testid="export-saved-ayahs-txt"
                      className="inline-flex items-center gap-1.5 rounded-md bg-[#0F4C3A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0B3A2C] dark:bg-[#196B52]"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>.txt kimi endir</span>
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-[#141916]">
                  {savedAyahs.map((item) => {
                    const key = `${item.surahNumber}:${item.ayahNumber}`;
                    const isCopied = copiedSavedKey === key;
                    const isEditingNote = editingNoteKey === key;
                    return (
                      <div key={key} className="p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono-tabular font-semibold text-[#0F4C3A] dark:text-[#86C7AE]">
                              {item.surahName} · {key}
                            </span>
                            <a
                              href={`/quran/sure/${item.surahNumber}#ayah-${item.ayahNumber}`}
                              onClick={(e) => {
                                e.preventDefault();
                                onNavigate(`/quran/sure/${item.surahNumber}#ayah-${item.ayahNumber}`);
                              }}
                              className="text-stone-500 hover:text-[#0F4C3A] hover:underline dark:text-stone-400 dark:hover:text-[#86C7AE]"
                            >
                              Surədə aç
                            </a>
                            {item.pageNumber && (
                              <a
                                href={`/quran/sehife/${item.pageNumber}#ayah-${item.surahNumber}-${item.ayahNumber}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  onNavigate(
                                    `/quran/sehife/${item.pageNumber}#ayah-${item.surahNumber}-${item.ayahNumber}`
                                  );
                                }}
                                className="text-stone-500 hover:text-[#0F4C3A] hover:underline dark:text-stone-400 dark:hover:text-[#86C7AE]"
                              >
                                · Səh. {item.pageNumber}
                              </a>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (isEditingNote) {
                                  setEditingNoteKey(null);
                                } else {
                                  setEditingNoteKey(key);
                                  setNoteDraft(item.note ?? '');
                                }
                              }}
                              data-testid={`edit-note-btn-${item.surahNumber}-${item.ayahNumber}`}
                              className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 px-2.5 py-1 text-xs text-stone-600 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:text-stone-300"
                            >
                              <Pencil className="h-3 w-3" aria-hidden="true" />
                              <span>{item.note ? 'Qeydi düzəlt' : 'Qeyd yaz'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopySavedAyah(
                                  item.surahNumber,
                                  item.surahName,
                                  item.ayahNumber,
                                  item.arabicText,
                                  item.translation
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 px-2.5 py-1 text-xs text-stone-600 hover:border-stone-300 dark:border-stone-700 dark:text-stone-300"
                            >
                              {isCopied ? (
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
                              onClick={() =>
                                void downloadVerseImageCard({
                                  surahName: item.surahName,
                                  surahNumber: item.surahNumber,
                                  ayahNumber: item.ayahNumber,
                                  arabicText: item.arabicText,
                                  translation: item.translation,
                                  theme: isDark ? 'emerald' : 'parchment',
                                })
                              }
                              data-testid={`saved-image-btn-${item.surahNumber}-${item.ayahNumber}`}
                              className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 px-2.5 py-1 text-xs text-stone-600 hover:border-[#0F4C3A] hover:text-[#0F4C3A] dark:border-stone-700 dark:text-stone-300"
                            >
                              <ImageDown className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Şəkil</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAyahBookmark(item.surahNumber, item.ayahNumber)}
                              aria-label={`${key} ayəsini əlfəcinlərdən sil`}
                              className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-2.5 py-1 text-xs text-stone-600 hover:border-red-300 hover:text-red-700 dark:border-stone-700 dark:text-stone-400 dark:hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Sil</span>
                            </button>
                          </div>
                        </div>

                        {item.arabicText && (
                          <p
                            dir="rtl"
                            lang="ar"
                            className="font-arabic mt-4 text-right text-2xl leading-[2.2] text-stone-900 dark:text-stone-100"
                          >
                            {item.arabicText}
                          </p>
                        )}
                        {item.translation && (
                          <p lang="az" className="mt-3 text-base leading-relaxed text-stone-700 dark:text-stone-300">
                            {item.translation}
                          </p>
                        )}

                        {item.note && !isEditingNote && (
                          <p
                            data-testid={`saved-note-text-${item.surahNumber}-${item.ayahNumber}`}
                            className="mt-3 rounded-lg border border-stone-200 bg-[#FAF9F6] px-3.5 py-2 text-xs leading-relaxed text-stone-700 dark:border-stone-800 dark:bg-[#181E1B] dark:text-stone-300"
                          >
                            <strong className="font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
                              Şəxsi qeyd:
                            </strong>{' '}
                            {item.note}
                          </p>
                        )}

                        {isEditingNote && (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              updateAyahNote(item.surahNumber, item.ayahNumber, noteDraft);
                              setEditingNoteKey(null);
                            }}
                            className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
                          >
                            <input
                              type="text"
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              maxLength={500}
                              placeholder="Bu ayə haqqında şəxsi qeyd və ya təfəkkür yazın..."
                              data-testid={`note-input-${item.surahNumber}-${item.ayahNumber}`}
                              className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-[#0F4C3A] focus:outline-none dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-100"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="submit"
                                data-testid={`save-note-btn-${item.surahNumber}-${item.ayahNumber}`}
                                className="rounded-lg bg-[#0F4C3A] px-3.5 py-1.5 text-xs font-medium text-white dark:bg-[#196B52]"
                              >
                                Yadda saxla
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingNoteKey(null)}
                                className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-600 dark:border-stone-700 dark:text-stone-300"
                              >
                                Ləğv et
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Personal Listening Statistics Panel (#8) */
          <div className="mt-6" data-testid="listening-stats-panel">
            <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-[#F7F5F0] p-5 sm:flex-row sm:items-center sm:justify-between dark:border-stone-800 dark:bg-[#141916]">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F4C3A] dark:text-[#86C7AE]">
                  <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Şəxsi Qiraət Dinləmə Statistikası</span>
                </div>
                <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                  Surə, Mushaf, Mühafiz və video pleyerdə dinlədiyiniz tilavət müddəti, ən çox dinlədiyiniz surələr və qarilər.
                </p>
              </div>

              {listeningSummary.totalSeconds > 0 && (
                <button
                  type="button"
                  onClick={resetListeningStats}
                  data-testid="reset-listening-stats-btn"
                  className="inline-flex items-center gap-1.5 self-start rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 whitespace-nowrap transition-colors hover:border-red-300 hover:text-red-700 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200 dark:hover:text-red-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Statistikanı sıfırla</span>
                </button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#141916]">
                <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Ümumi dinləmə</p>
                <p
                  data-testid="stats-total-duration"
                  className="font-mono-tabular mt-1.5 text-2xl font-semibold text-stone-900 dark:text-stone-100"
                >
                  {listeningSummary.formattedTotal}
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#141916]">
                <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Bu gün</p>
                <p
                  data-testid="stats-today-duration"
                  className="font-mono-tabular mt-1.5 text-2xl font-semibold text-[#0F4C3A] dark:text-[#86C7AE]"
                >
                  {formatListeningDurationAz(listeningSummary.todaySeconds)}
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#141916]">
                <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Son 7 gün</p>
                <p
                  data-testid="stats-7d-duration"
                  className="font-mono-tabular mt-1.5 text-2xl font-semibold text-stone-900 dark:text-stone-100"
                >
                  {formatListeningDurationAz(listeningSummary.last7DaysSeconds)}
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#141916]">
                <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Dinləmə sessiyası</p>
                <p
                  data-testid="stats-sessions-count"
                  className="font-mono-tabular mt-1.5 text-2xl font-semibold text-stone-900 dark:text-stone-100"
                >
                  {listeningSummary.sessionsCount}
                </p>
              </div>
            </div>

            {listeningSummary.totalSeconds === 0 ? (
              <div className="mt-5 rounded-xl border border-stone-200 bg-[#F3F1EC] p-8 text-center dark:border-stone-800 dark:bg-[#141916]">
                <Headphones className="mx-auto h-6 w-6 text-stone-400" aria-hidden="true" />
                <p className="font-display mt-3 text-xl font-medium text-stone-900 dark:text-stone-100">
                  Hələ qiraət dinləmə məlumatı yoxdur
                </p>
                <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                  Surə, Mushaf, Mühafiz və ya video pleyerdə tilavət dinlədikcə statistikanız avtomatik olaraq burada toplanacaq.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                  <a
                    href="/quran/sure/1"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/quran/sure/1');
                    }}
                    className="rounded-lg bg-[#0F4C3A] px-4 py-2 text-xs font-medium text-white dark:bg-[#196B52]"
                  >
                    Fatihə surəsini dinlə
                  </a>
                  <a
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/');
                    }}
                    className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-800 dark:border-stone-700 dark:bg-[#181E1B] dark:text-stone-200"
                  >
                    Qiraət videolarına bax
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-[#141916]">
                  <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
                    Ən Çox Dinlədiyiniz Surələr
                  </h3>
                  {listeningSummary.topSurahs.length === 0 ? (
                    <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
                      Hələ surə üzrə dinləmə qeydə alınmayıb.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {listeningSummary.topSurahs.map((item) => (
                        <div key={item.surahNumber}>
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <a
                              href={`/quran/sure/${item.surahNumber}`}
                              onClick={(e) => {
                                e.preventDefault();
                                onNavigate(`/quran/sure/${item.surahNumber}`);
                              }}
                              className="font-medium text-stone-800 hover:text-[#0F4C3A] hover:underline dark:text-stone-200 dark:hover:text-[#86C7AE]"
                            >
                              {item.surahName}
                            </a>
                            <span className="font-mono-tabular text-stone-500 dark:text-stone-400">
                              {item.formatted} ({item.sharePercent}%)
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                            <div
                              style={{ width: `${Math.max(4, item.sharePercent)}%` }}
                              className="h-full bg-[#0F4C3A] dark:bg-[#86C7AE]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-[#141916]">
                  <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
                    Ən Çox Dinlədiyiniz Qarilər
                  </h3>
                  {listeningSummary.topReciters.length === 0 ? (
                    <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
                      Hələ qari üzrə dinləmə qeydə alınmayıb.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {listeningSummary.topReciters.map((item) => (
                        <div key={item.reciterName}>
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-medium text-stone-800 dark:text-stone-200">
                              {item.reciterName}
                            </span>
                            <span className="font-mono-tabular text-stone-500 dark:text-stone-400">
                              {item.formatted} ({item.sharePercent}%)
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                            <div
                              style={{ width: `${Math.max(4, item.sharePercent)}%` }}
                              className="h-full bg-[#C6A769]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
