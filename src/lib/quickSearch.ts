import { QURAN_DUAS } from '../data/quranDuas';
import { RecitationVideo, normalizeAzerbaijaniText } from './channel';
import { WORLD_PRAYER_CITIES } from './prayerTimes';
import {
  JUZ_PAGE_RANGES,
  SURAH_CATALOG,
  TOTAL_QURAN_PAGES,
  formatAzerbaijaniOrdinal,
  getSurahByNumber,
} from './quran';
import { parseQuickQuranTarget } from './readerState';

export type QuickSearchItemKind =
  | 'ayah'
  | 'surah'
  | 'page'
  | 'juz'
  | 'muhaffiz'
  | 'dua'
  | 'video'
  | 'search';

export interface QuickSearchResult {
  id: string;
  kind: QuickSearchItemKind;
  kindLabel: string;
  title: string;
  subtitle: string;
  path: string;
  arabicLabel?: string;
}

const DEFAULT_SHORTCUTS: QuickSearchResult[] = [
  {
    id: 'default-page-1',
    kind: 'page',
    kindLabel: 'Səhifə',
    title: 'Mədinə Mushafı — 1-ci səhifə (Fatihə)',
    subtitle: 'Tam Qurani-Kərimi əvvəldən oxu',
    path: '/quran/sehife/1',
    arabicLabel: 'سُورَةُ الْفَاتِحَةِ',
  },
  {
    id: 'default-kursi',
    kind: 'ayah',
    kindLabel: 'Ayə',
    title: 'Ayətül-Kürsi (Bəqərə, 2:255)',
    subtitle: 'Surə daxilində birbaşa aç · Mədinə səhifəsi 42',
    path: '/quran/sure/2#ayah-255',
    arabicLabel: 'آيَةُ الْكُرْسِيِّ',
  },
  {
    id: 'default-yasin',
    kind: 'surah',
    kindLabel: 'Surə',
    title: '36. Yasin surəsi',
    subtitle: '83 ayə · Məkkə · Mədinə səhifəsi 440',
    path: '/quran/sure/36',
    arabicLabel: 'يس',
  },
  {
    id: 'default-dualar',
    kind: 'dua',
    kindLabel: 'Dualar',
    title: 'Qurandakı Dualar (20 Rəbbənə duası)',
    subtitle: 'Hidayət, bağışlanma, ailə, elm və səbir duaları',
    path: '/dualar',
  },
  {
    id: 'default-muhaffiz',
    kind: 'muhaffiz',
    kindLabel: 'Mühafiz',
    title: 'Mühafiz — Sözbə-söz Əzbər Mushafı',
    subtitle: '604 Mədinə səhifəsi üzərində əzbər məşqi',
    path: '/muhaffiz',
  },
  {
    id: 'default-cuz-30',
    kind: 'juz',
    kindLabel: 'Cüz',
    title: '30-cu Cüz (Amma Cüzü · Səhifə 582–604)',
    subtitle: 'Nəbə surəsindən Nas surəsinə qədər',
    path: '/quran/cuz/30',
  },
];

export function searchGlobalQuickIndex(
  rawQuery: string,
  videos: RecitationVideo[] = [],
  maxResults = 12
): QuickSearchResult[] {
  const clean = rawQuery.trim();
  if (!clean) {
    return DEFAULT_SHORTCUTS.slice(0, maxResults);
  }

  const results: QuickSearchResult[] = [];
  const seenPaths = new Set<string>();
  const pushUnique = (item: QuickSearchResult) => {
    if (seenPaths.has(item.path)) return;
    seenPaths.add(item.path);
    results.push(item);
  };

  // 1. Juz pattern: "30. cuz", "cüz 30", "cuz 1"
  const norm = normalizeAzerbaijaniText(clean);
  const juzMatch =
    norm.match(/^(?:cuz|juz)\s*(\d{1,2})$/) || norm.match(/^(\d{1,2})\s*\.?\s*(?:cuz|juz|cu|ci|cu)$/);
  if (juzMatch) {
    const juzNum = Number.parseInt(juzMatch[1], 10);
    const range = JUZ_PAGE_RANGES.find((j) => j.juz === juzNum);
    if (range) {
      pushUnique({
        id: `juz-${range.juz}`,
        kind: 'juz',
        kindLabel: 'Cüz',
        title: `${formatAzerbaijaniOrdinal(range.juz)} Cüz (Səhifə ${range.startPage}–${range.endPage})`,
        subtitle: `Mədinə Mushafının ${range.juz}-cu Cüzü`,
        path: `/quran/cuz/${range.juz}`,
      });
    }
  }

  // 2. Quick structural target (Surah:Ayah, Page 1..604, exact surah number)
  const quickTarget = parseQuickQuranTarget(clean);
  if (quickTarget) {
    if (quickTarget.kind === 'surah-ayah') {
      const surah = getSurahByNumber(quickTarget.surahNumber);
      pushUnique({
        id: `quick-ayah-${quickTarget.surahNumber}-${quickTarget.ayahNumber}`,
        kind: 'ayah',
        kindLabel: 'Ayə',
        title: quickTarget.label,
        subtitle: surah
          ? `${surah.name} surəsi ${quickTarget.surahNumber}:${quickTarget.ayahNumber} ayəsinə birbaşa keçid`
          : 'Ayəyə birbaşa keçid',
        path: quickTarget.path,
        arabicLabel: surah?.arabicName,
      });
    } else if (quickTarget.kind === 'page') {
      const pNum = quickTarget.pageNumber;
      if (!Number.isNaN(pNum) && pNum >= 1 && pNum <= TOTAL_QURAN_PAGES) {
        pushUnique({
          id: `quick-page-${pNum}`,
          kind: 'page',
          kindLabel: 'Səhifə',
          title: `Mədinə Mushafı — ${formatAzerbaijaniOrdinal(pNum)} səhifə`,
          subtitle: `Səhifə ${pNum} / 604 · Ərəbcə + Tərcümə`,
          path: `/quran/sehife/${pNum}`,
        });
        pushUnique({
          id: `quick-muhaffiz-${pNum}`,
          kind: 'muhaffiz',
          kindLabel: 'Mühafiz',
          title: `Mühafiz Əzbər — Səhifə ${pNum}`,
          subtitle: `Sözbə-söz gizlətmə və tilavət məşqi`,
          path: `/muhaffiz/${pNum}`,
        });
      }
    } else if (quickTarget.kind === 'surah') {
      const surah = getSurahByNumber(quickTarget.surahNumber);
      if (surah) {
        pushUnique({
          id: `surah-${surah.number}`,
          kind: 'surah',
          kindLabel: 'Surə',
          title: `${surah.number}. ${surah.name} surəsi`,
          subtitle: `${surah.ayahCount} ayə · ${surah.revelationPlace} · Səhifə ${surah.startPage}`,
          path: surah ? `/quran/sure/${surah.number}` : quickTarget.path,
          arabicLabel: surah.arabicName,
        });
      }
    }
  }

  // 3. Matching Surahs (1..114)
  for (const surah of SURAH_CATALOG) {
    const surahHaystack = normalizeAzerbaijaniText(
      `${surah.number} ${surah.name} ${surah.revelationPlace}`
    );
    if (
      surahHaystack.includes(norm) ||
      surah.arabicName.includes(clean) ||
      String(surah.number) === clean
    ) {
      pushUnique({
        id: `surah-${surah.number}`,
        kind: 'surah',
        kindLabel: 'Surə',
        title: `${surah.number}. ${surah.name} surəsi`,
        subtitle: `${surah.ayahCount} ayə · ${surah.revelationPlace} · Səhifə ${surah.startPage}`,
        path: `/quran/sure/${surah.number}`,
        arabicLabel: surah.arabicName,
      });
    }
  }

  // 4. Matching Duas
  for (const dua of QURAN_DUAS) {
    const duaHaystack = normalizeAzerbaijaniText(
      `${dua.title} ${dua.surahName} ${dua.translation} ${dua.ayahLabel}`
    );
    if (duaHaystack.includes(norm) || (norm.includes('dua') && results.length < maxResults)) {
      pushUnique({
        id: `dua-${dua.id}`,
        kind: 'dua',
        kindLabel: 'Dua',
        title: dua.title,
        subtitle: `${dua.surahName} (${dua.ayahLabel}) — ${dua.translation.slice(0, 72)}...`,
        path: `/quran/sure/${dua.surahNumber}#ayah-${dua.ayahNumber}`,
      });
    }
  }

  // 5. Matching Recitation Videos (Long & Shorts)
  for (const video of videos) {
    const videoHaystack = normalizeAzerbaijaniText(
      `${video.title} ${video.surahName} ${video.reciter} ${video.ayahRange}`
    );
    if (videoHaystack.includes(norm)) {
      pushUnique({
        id: `video-${video.videoId}`,
        kind: 'video',
        kindLabel: video.format === 'short' ? 'Shorts' : 'Tilavət',
        title: video.title,
        subtitle: `${video.reciter} · ${video.duration}`,
        path: `/video/${video.videoId}`,
        arabicLabel: video.arabicName,
      });
    }
  }

  // 5b. Prayer times (world countries & cities) + Qibla compass + Tajweed + Khatm + Zikr/Tasbih shortcuts
  const prayerMatched =
    norm.includes('namaz') ||
    norm.includes('vaxt') ||
    norm.includes('imsak') ||
    norm.includes('subh') ||
    norm.includes('zohr') ||
    norm.includes('megrib') ||
    norm.includes('isa') ||
    norm.includes('ummul') ||
    norm.includes('qible') ||
    norm.includes('kompas') ||
    norm.includes('xatir') ||
    norm.includes('cume') ||
    WORLD_PRAYER_CITIES.some(
      (c) =>
        normalizeAzerbaijaniText(c.name).includes(norm) ||
        normalizeAzerbaijaniText(c.countryName).includes(norm)
    );
  if (prayerMatched) {
    pushUnique({
      id: 'tool-prayer-times',
      kind: 'dua',
      kindLabel: 'Vaxtlar & Qiblə',
      title: 'Namaz Vaxtları, Qiblə Kompası və Xatırlatmalar',
      subtitle: 'Ümmül-Qura üsulu, xəritə, canlı Qiblə kompası və Cümə xatırlatması',
      path: '/namaz-vaxtlari',
    });
  }

  if (
    norm.includes('elifba') ||
    norm.includes('ereb') ||
    norm.includes('herf') ||
    norm.includes('mexrec') ||
    norm.includes('hereke') ||
    norm.includes('fethe') ||
    norm.includes('kesre') ||
    norm.includes('zemme') ||
    norm.includes('tecvid') ||
    norm.includes('tajweed')
  ) {
    pushUnique({
      id: 'tool-elifba',
      kind: 'page',
      kindLabel: 'Əlifba & Təcvid',
      title: 'İnteraktiv Ərəb Əlifbası və Təcvid Bələdçisi',
      subtitle: '28 ərəb hərfi, məxrəc filtrləri, canlı hərəkə qurucusu və hərf testi',
      path: '/elifba',
    });
  }

  if (norm.includes('tecvid') || norm.includes('tajweed')) {
    pushUnique({
      id: 'tool-tajweed',
      kind: 'page',
      kindLabel: 'Təcvid',
      title: 'Təcvid Rəngli Quran Oxunuşu',
      subtitle: 'Ğünnə, Qalqələ, İxfa, İdğam və Mədd qaydaları ilə Mədinə Mushafı',
      path: '/quran/sehife/1',
    });
  }

  if (norm.includes('xetm') || norm.includes('vird') || norm.includes('plan')) {
    pushUnique({
      id: 'tool-khatm-planner',
      kind: 'page',
      kindLabel: 'Xətm Planı',
      title: 'Şəxsi Xətm Planlayıcısı (15 / 30 / 60 gün)',
      subtitle: 'Gündəlik səhifə hədəfi və avtomatik yenidən hesablanan xətm cədvəli',
      path: '/quran',
    });
  }

  if (
    norm.includes('hicri') ||
    norm.includes('miladi') ||
    norm.includes('teqvim') ||
    norm.includes('ramazan') ||
    norm.includes('qurban') ||
    norm.includes('bayram') ||
    norm.includes('qedir') ||
    norm.includes('esura') ||
    norm.includes('erefe')
  ) {
    pushUnique({
      id: 'tool-hijri-calendar',
      kind: 'dua',
      kindLabel: 'Təqvim',
      title: 'Hicri–Miladi Təqvim Çeviricisi və Mübarək Günlər',
      subtitle: 'Ümmül-Qura çevirici, Ramazan, Qədr gecəsi və bayramlara qalan günlər',
      path: '/teqvim',
    });
  }

  if (
    norm.includes('zikr') ||
    norm.includes('tesbih') ||
    norm.includes('saygac') ||
    norm.includes('seher') ||
    norm.includes('axsam') ||
    norm.includes('subhan') ||
    norm.includes('istigfar')
  ) {
    pushUnique({
      id: 'tool-zikr-tasbih',
      kind: 'dua',
      kindLabel: 'Zikr',
      title: 'Zikrlər və İnteraktiv Təsbih Sayğacı',
      subtitle: 'Səhər-axşam zikrləri, 33+33+34 Namaz təsbihatı və gündəlik sayğac',
      path: '/zikr',
    });
  }

  // 6. Full-Quran keyword search action (links directly to /quran?q=...)
  if (clean.length >= 2) {
    const trimmed = results.slice(0, Math.max(1, maxResults - 1));
    trimmed.push({
      id: `full-search-${norm}`,
      kind: 'search',
      kindLabel: 'Axtarış',
      title: `Bütün Quranda «${clean}» sözünü axtar`,
      subtitle: '6236 ayənin Azərbaycan tərcüməsində tam axtarış apar',
      path: `/quran?q=${encodeURIComponent(clean)}`,
    });
    return trimmed;
  }

  return results.slice(0, maxResults);
}
