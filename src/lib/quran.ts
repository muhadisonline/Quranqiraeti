import { AyahTranslation, SurahTranslationPayload, normalizeAzerbaijaniText } from './channel';

export type RevelationPlace = 'Məkkə' | 'Mədinə';

export interface SurahCatalogEntry {
  number: number;
  name: string;
  arabicName: string;
  ayahCount: number;
  revelationPlace: RevelationPlace;
  startPage: number;
}

export interface MushafPageAyah {
  surahNumber: number;
  surahName: string;
  arabicSurahName: string;
  ayahNumber: number;
  juzNumber: number;
  arabicText: string;
  translation: string;
  footnotes: string;
}

export interface MushafPagePayload {
  pageNumber: number;
  juzNumber: number;
  surahsOnPage: Array<{
    surahNumber: number;
    surahName: string;
    arabicName: string;
  }>;
  translatorName: string;
  editionVersion: string;
  ayahs: MushafPageAyah[];
}

export const TOTAL_QURAN_PAGES = 604;
export const TOTAL_QURAN_SURAHS = 114;

export const SURAH_CATALOG: SurahCatalogEntry[] = [
  { number: 1, name: 'Fatihə', arabicName: 'سُورَةُ ٱلْفَاتِحَةِ', ayahCount: 7, revelationPlace: 'Məkkə', startPage: 1 },
  { number: 2, name: 'Bəqərə', arabicName: 'سُورَةُ البَقَرَةِ', ayahCount: 286, revelationPlace: 'Mədinə', startPage: 2 },
  { number: 3, name: 'Ali-İmran', arabicName: 'سُورَةُ آلِ عِمۡرَانَ', ayahCount: 200, revelationPlace: 'Mədinə', startPage: 50 },
  { number: 4, name: 'Nisa', arabicName: 'سُورَةُ النِّسَاءِ', ayahCount: 176, revelationPlace: 'Mədinə', startPage: 77 },
  { number: 5, name: 'Maidə', arabicName: 'سُورَةُ المَائـِدَةِ', ayahCount: 120, revelationPlace: 'Mədinə', startPage: 106 },
  { number: 6, name: 'Ənam', arabicName: 'سُورَةُ الأَنۡعَامِ', ayahCount: 165, revelationPlace: 'Məkkə', startPage: 128 },
  { number: 7, name: 'Əraf', arabicName: 'سُورَةُ الأَعۡرَافِ', ayahCount: 206, revelationPlace: 'Məkkə', startPage: 151 },
  { number: 8, name: 'Ənfal', arabicName: 'سُورَةُ الأَنفَالِ', ayahCount: 75, revelationPlace: 'Mədinə', startPage: 177 },
  { number: 9, name: 'Tövbə', arabicName: 'سُورَةُ التَّوۡبَةِ', ayahCount: 129, revelationPlace: 'Mədinə', startPage: 187 },
  { number: 10, name: 'Yunus', arabicName: 'سُورَةُ يُونُسَ', ayahCount: 109, revelationPlace: 'Məkkə', startPage: 208 },
  { number: 11, name: 'Hud', arabicName: 'سُورَةُ هُودٍ', ayahCount: 123, revelationPlace: 'Məkkə', startPage: 221 },
  { number: 12, name: 'Yusuf', arabicName: 'سُورَةُ يُوسُفَ', ayahCount: 111, revelationPlace: 'Məkkə', startPage: 235 },
  { number: 13, name: 'Rəd', arabicName: 'سُورَةُ الرَّعۡدِ', ayahCount: 43, revelationPlace: 'Mədinə', startPage: 249 },
  { number: 14, name: 'İbrahim', arabicName: 'سُورَةُ إِبۡرَاهِيمَ', ayahCount: 52, revelationPlace: 'Məkkə', startPage: 255 },
  { number: 15, name: 'Hicr', arabicName: 'سُورَةُ الحِجۡرِ', ayahCount: 99, revelationPlace: 'Məkkə', startPage: 262 },
  { number: 16, name: 'Nəhl', arabicName: 'سُورَةُ النَّحۡلِ', ayahCount: 128, revelationPlace: 'Məkkə', startPage: 267 },
  { number: 17, name: 'İsra', arabicName: 'سُورَةُ الإِسۡرَاءِ', ayahCount: 111, revelationPlace: 'Məkkə', startPage: 282 },
  { number: 18, name: 'Kəhf', arabicName: 'سُورَةُ الكَهۡفِ', ayahCount: 110, revelationPlace: 'Məkkə', startPage: 293 },
  { number: 19, name: 'Məryəm', arabicName: 'سُورَةُ مَرۡيَمَ', ayahCount: 98, revelationPlace: 'Məkkə', startPage: 305 },
  { number: 20, name: 'Taha', arabicName: 'سُورَةُ طه', ayahCount: 135, revelationPlace: 'Məkkə', startPage: 312 },
  { number: 21, name: 'Ənbiya', arabicName: 'سُورَةُ الأَنبِيَاءِ', ayahCount: 112, revelationPlace: 'Məkkə', startPage: 322 },
  { number: 22, name: 'Həcc', arabicName: 'سُورَةُ الحَجِّ', ayahCount: 78, revelationPlace: 'Mədinə', startPage: 332 },
  { number: 23, name: 'Muminun', arabicName: 'سُورَةُ المُؤۡمِنُونَ', ayahCount: 118, revelationPlace: 'Məkkə', startPage: 342 },
  { number: 24, name: 'Nur', arabicName: 'سُورَةُ النُّورِ', ayahCount: 64, revelationPlace: 'Mədinə', startPage: 350 },
  { number: 25, name: 'Furqan', arabicName: 'سُورَةُ الفُرۡقَانِ', ayahCount: 77, revelationPlace: 'Məkkə', startPage: 359 },
  { number: 26, name: 'Şüəra', arabicName: 'سُورَةُ الشُّعَرَاءِ', ayahCount: 227, revelationPlace: 'Məkkə', startPage: 367 },
  { number: 27, name: 'Nəml', arabicName: 'سُورَةُ النَّمۡلِ', ayahCount: 93, revelationPlace: 'Məkkə', startPage: 377 },
  { number: 28, name: 'Qasas', arabicName: 'سُورَةُ القَصَصِ', ayahCount: 88, revelationPlace: 'Məkkə', startPage: 385 },
  { number: 29, name: 'Ənkəbut', arabicName: 'سُورَةُ العَنكَبُوتِ', ayahCount: 69, revelationPlace: 'Məkkə', startPage: 396 },
  { number: 30, name: 'Rum', arabicName: 'سُورَةُ الرُّومِ', ayahCount: 60, revelationPlace: 'Məkkə', startPage: 404 },
  { number: 31, name: 'Loqman', arabicName: 'سُورَةُ لُقۡمَانَ', ayahCount: 34, revelationPlace: 'Məkkə', startPage: 411 },
  { number: 32, name: 'Səcdə', arabicName: 'سُورَةُ السَّجۡدَةِ', ayahCount: 30, revelationPlace: 'Məkkə', startPage: 415 },
  { number: 33, name: 'Əhzab', arabicName: 'سُورَةُ الأَحۡزَابِ', ayahCount: 73, revelationPlace: 'Mədinə', startPage: 418 },
  { number: 34, name: 'Səba', arabicName: 'سُورَةُ سَبَإٍ', ayahCount: 54, revelationPlace: 'Məkkə', startPage: 428 },
  { number: 35, name: 'Fatir', arabicName: 'سُورَةُ فَاطِرٍ', ayahCount: 45, revelationPlace: 'Məkkə', startPage: 434 },
  { number: 36, name: 'Yasin', arabicName: 'سُورَةُ يسٓ', ayahCount: 83, revelationPlace: 'Məkkə', startPage: 440 },
  { number: 37, name: 'Saffat', arabicName: 'سُورَةُ الصَّافَّاتِ', ayahCount: 182, revelationPlace: 'Məkkə', startPage: 446 },
  { number: 38, name: 'Sad', arabicName: 'سُورَةُ صٓ', ayahCount: 88, revelationPlace: 'Məkkə', startPage: 453 },
  { number: 39, name: 'Zümər', arabicName: 'سُورَةُ الزُّمَرِ', ayahCount: 75, revelationPlace: 'Məkkə', startPage: 458 },
  { number: 40, name: 'Ğafir', arabicName: 'سُورَةُ غَافِرٍ', ayahCount: 85, revelationPlace: 'Məkkə', startPage: 467 },
  { number: 41, name: 'Fussilət', arabicName: 'سُورَةُ فُصِّلَتۡ', ayahCount: 54, revelationPlace: 'Məkkə', startPage: 477 },
  { number: 42, name: 'Şura', arabicName: 'سُورَةُ الشُّورَىٰ', ayahCount: 53, revelationPlace: 'Məkkə', startPage: 483 },
  { number: 43, name: 'Zuxruf', arabicName: 'سُورَةُ الزُّخۡرُفِ', ayahCount: 89, revelationPlace: 'Məkkə', startPage: 489 },
  { number: 44, name: 'Duxan', arabicName: 'سُورَةُ الدُّخَانِ', ayahCount: 59, revelationPlace: 'Məkkə', startPage: 496 },
  { number: 45, name: 'Casiyə', arabicName: 'سُورَةُ الجَاثِيَةِ', ayahCount: 37, revelationPlace: 'Məkkə', startPage: 499 },
  { number: 46, name: 'Əhqaf', arabicName: 'سُورَةُ الأَحۡقَافِ', ayahCount: 35, revelationPlace: 'Məkkə', startPage: 502 },
  { number: 47, name: 'Mühəmməd', arabicName: 'سُورَةُ مُحَمَّدٍ', ayahCount: 38, revelationPlace: 'Mədinə', startPage: 507 },
  { number: 48, name: 'Fəth', arabicName: 'سُورَةُ الفَتۡحِ', ayahCount: 29, revelationPlace: 'Mədinə', startPage: 511 },
  { number: 49, name: 'Hucurat', arabicName: 'سُورَةُ الحُجُرَاتِ', ayahCount: 18, revelationPlace: 'Mədinə', startPage: 515 },
  { number: 50, name: 'Qaf', arabicName: 'سُورَةُ قٓ', ayahCount: 45, revelationPlace: 'Məkkə', startPage: 518 },
  { number: 51, name: 'Zariyat', arabicName: 'سُورَةُ الذَّارِيَاتِ', ayahCount: 60, revelationPlace: 'Məkkə', startPage: 520 },
  { number: 52, name: 'Tur', arabicName: 'سُورَةُ الطُّورِ', ayahCount: 49, revelationPlace: 'Məkkə', startPage: 523 },
  { number: 53, name: 'Nəcm', arabicName: 'سُورَةُ النَّجۡمِ', ayahCount: 62, revelationPlace: 'Məkkə', startPage: 526 },
  { number: 54, name: 'Qəmər', arabicName: 'سُورَةُ القَمَرِ', ayahCount: 55, revelationPlace: 'Məkkə', startPage: 528 },
  { number: 55, name: 'Rəhman', arabicName: 'سُورَةُ الرَّحۡمَٰن', ayahCount: 78, revelationPlace: 'Mədinə', startPage: 531 },
  { number: 56, name: 'Vaqiə', arabicName: 'سُورَةُ الوَاقِعَةِ', ayahCount: 96, revelationPlace: 'Məkkə', startPage: 534 },
  { number: 57, name: 'Hədid', arabicName: 'سُورَةُ الحَدِيدِ', ayahCount: 29, revelationPlace: 'Mədinə', startPage: 537 },
  { number: 58, name: 'Mücadilə', arabicName: 'سُورَةُ المُجَادلَةِ', ayahCount: 22, revelationPlace: 'Mədinə', startPage: 542 },
  { number: 59, name: 'Həşr', arabicName: 'سُورَةُ الحَشۡرِ', ayahCount: 24, revelationPlace: 'Mədinə', startPage: 545 },
  { number: 60, name: 'Mümtəhinə', arabicName: 'سُورَةُ المُمۡتَحنَةِ', ayahCount: 13, revelationPlace: 'Mədinə', startPage: 549 },
  { number: 61, name: 'Saff', arabicName: 'سُورَةُ الصَّفِّ', ayahCount: 14, revelationPlace: 'Mədinə', startPage: 551 },
  { number: 62, name: 'Cümə', arabicName: 'سُورَةُ الجُمُعَةِ', ayahCount: 11, revelationPlace: 'Mədinə', startPage: 553 },
  { number: 63, name: 'Münafiqun', arabicName: 'سُورَةُ المُنَافِقُونَ', ayahCount: 11, revelationPlace: 'Mədinə', startPage: 554 },
  { number: 64, name: 'Təğabun', arabicName: 'سُورَةُ التَّغَابُنِ', ayahCount: 18, revelationPlace: 'Mədinə', startPage: 556 },
  { number: 65, name: 'Təlaq', arabicName: 'سُورَةُ الطَّلَاقِ', ayahCount: 12, revelationPlace: 'Mədinə', startPage: 558 },
  { number: 66, name: 'Təhrim', arabicName: 'سُورَةُ التَّحۡرِيمِ', ayahCount: 12, revelationPlace: 'Mədinə', startPage: 560 },
  { number: 67, name: 'Mülk', arabicName: 'سُورَةُ المُلۡكِ', ayahCount: 30, revelationPlace: 'Məkkə', startPage: 562 },
  { number: 68, name: 'Qələm', arabicName: 'سُورَةُ القَلَمِ', ayahCount: 52, revelationPlace: 'Məkkə', startPage: 564 },
  { number: 69, name: 'Haqqə', arabicName: 'سُورَةُ الحَاقَّةِ', ayahCount: 52, revelationPlace: 'Məkkə', startPage: 566 },
  { number: 70, name: 'Məaric', arabicName: 'سُورَةُ المَعَارِجِ', ayahCount: 44, revelationPlace: 'Məkkə', startPage: 568 },
  { number: 71, name: 'Nuh', arabicName: 'سُورَةُ نُوحٍ', ayahCount: 28, revelationPlace: 'Məkkə', startPage: 570 },
  { number: 72, name: 'Cinn', arabicName: 'سُورَةُ الجِنِّ', ayahCount: 28, revelationPlace: 'Məkkə', startPage: 572 },
  { number: 73, name: 'Müzzəmmil', arabicName: 'سُورَةُ المُزَّمِّلِ', ayahCount: 20, revelationPlace: 'Məkkə', startPage: 574 },
  { number: 74, name: 'Müddəssir', arabicName: 'سُورَةُ المُدَّثِّرِ', ayahCount: 56, revelationPlace: 'Məkkə', startPage: 575 },
  { number: 75, name: 'Qiyamət', arabicName: 'سُورَةُ القِيَامَةِ', ayahCount: 40, revelationPlace: 'Məkkə', startPage: 577 },
  { number: 76, name: 'İnsan', arabicName: 'سُورَةُ الإِنسَانِ', ayahCount: 31, revelationPlace: 'Mədinə', startPage: 578 },
  { number: 77, name: 'Mürsəlat', arabicName: 'سُورَةُ المُرۡسَلَاتِ', ayahCount: 50, revelationPlace: 'Məkkə', startPage: 580 },
  { number: 78, name: 'Nəbə', arabicName: 'سُورَةُ النَّبَإِ', ayahCount: 40, revelationPlace: 'Məkkə', startPage: 582 },
  { number: 79, name: 'Naziat', arabicName: 'سُورَةُ النَّازِعَاتِ', ayahCount: 46, revelationPlace: 'Məkkə', startPage: 583 },
  { number: 80, name: 'Əbəsə', arabicName: 'سُورَةُ عَبَسَ', ayahCount: 42, revelationPlace: 'Məkkə', startPage: 585 },
  { number: 81, name: 'Təkvir', arabicName: 'سُورَةُ التَّكۡوِيرِ', ayahCount: 29, revelationPlace: 'Məkkə', startPage: 586 },
  { number: 82, name: 'İnfitar', arabicName: 'سُورَةُ الانفِطَارِ', ayahCount: 19, revelationPlace: 'Məkkə', startPage: 587 },
  { number: 83, name: 'Mütəffifin', arabicName: 'سُورَةُ المُطَفِّفِينَ', ayahCount: 36, revelationPlace: 'Məkkə', startPage: 587 },
  { number: 84, name: 'İnşiqaq', arabicName: 'سُورَةُ الانشِقَاقِ', ayahCount: 25, revelationPlace: 'Məkkə', startPage: 589 },
  { number: 85, name: 'Büruc', arabicName: 'سُورَةُ البُرُوجِ', ayahCount: 22, revelationPlace: 'Məkkə', startPage: 590 },
  { number: 86, name: 'Tariq', arabicName: 'سُورَةُ الطَّارِقِ', ayahCount: 17, revelationPlace: 'Məkkə', startPage: 591 },
  { number: 87, name: 'Əla', arabicName: 'سُورَةُ الأَعۡلَىٰ', ayahCount: 19, revelationPlace: 'Məkkə', startPage: 591 },
  { number: 88, name: 'Ğaşiyə', arabicName: 'سُورَةُ الغَاشِيَةِ', ayahCount: 26, revelationPlace: 'Məkkə', startPage: 592 },
  { number: 89, name: 'Fəcr', arabicName: 'سُورَةُ الفَجۡرِ', ayahCount: 30, revelationPlace: 'Məkkə', startPage: 593 },
  { number: 90, name: 'Bələd', arabicName: 'سُورَةُ البَلَدِ', ayahCount: 20, revelationPlace: 'Məkkə', startPage: 594 },
  { number: 91, name: 'Şəms', arabicName: 'سُورَةُ الشَّمۡسِ', ayahCount: 15, revelationPlace: 'Məkkə', startPage: 595 },
  { number: 92, name: 'Leyl', arabicName: 'سُورَةُ اللَّيۡلِ', ayahCount: 21, revelationPlace: 'Məkkə', startPage: 595 },
  { number: 93, name: 'Duha', arabicName: 'سُورَةُ الضُّحَىٰ', ayahCount: 11, revelationPlace: 'Məkkə', startPage: 596 },
  { number: 94, name: 'İnşirah', arabicName: 'سُورَةُ الشَّرۡحِ', ayahCount: 8, revelationPlace: 'Məkkə', startPage: 596 },
  { number: 95, name: 'Tin', arabicName: 'سُورَةُ التِّينِ', ayahCount: 8, revelationPlace: 'Məkkə', startPage: 597 },
  { number: 96, name: 'Ələq', arabicName: 'سُورَةُ العَلَقِ', ayahCount: 19, revelationPlace: 'Məkkə', startPage: 597 },
  { number: 97, name: 'Qədr', arabicName: 'سُورَةُ القَدۡرِ', ayahCount: 5, revelationPlace: 'Məkkə', startPage: 598 },
  { number: 98, name: 'Bəyyinə', arabicName: 'سُورَةُ البَيِّنَةِ', ayahCount: 8, revelationPlace: 'Mədinə', startPage: 598 },
  { number: 99, name: 'Zəlzələ', arabicName: 'سُورَةُ الزَّلۡزَلَةِ', ayahCount: 8, revelationPlace: 'Mədinə', startPage: 599 },
  { number: 100, name: 'Adiyat', arabicName: 'سُورَةُ العَادِيَاتِ', ayahCount: 11, revelationPlace: 'Məkkə', startPage: 599 },
  { number: 101, name: 'Qariə', arabicName: 'سُورَةُ القَارِعَةِ', ayahCount: 11, revelationPlace: 'Məkkə', startPage: 600 },
  { number: 102, name: 'Təkasür', arabicName: 'سُورَةُ التَّكَاثُرِ', ayahCount: 8, revelationPlace: 'Məkkə', startPage: 600 },
  { number: 103, name: 'Əsr', arabicName: 'سُورَةُ العَصۡرِ', ayahCount: 3, revelationPlace: 'Məkkə', startPage: 601 },
  { number: 104, name: 'Hüməzə', arabicName: 'سُورَةُ الهُمَزَةِ', ayahCount: 9, revelationPlace: 'Məkkə', startPage: 601 },
  { number: 105, name: 'Fil', arabicName: 'سُورَةُ الفِيلِ', ayahCount: 5, revelationPlace: 'Məkkə', startPage: 601 },
  { number: 106, name: 'Qüreyş', arabicName: 'سُورَةُ قُرَيۡشٍ', ayahCount: 4, revelationPlace: 'Məkkə', startPage: 602 },
  { number: 107, name: 'Maun', arabicName: 'سُورَةُ المَاعُونِ', ayahCount: 7, revelationPlace: 'Məkkə', startPage: 602 },
  { number: 108, name: 'Kövsər', arabicName: 'سُورَةُ الكَوۡثَرِ', ayahCount: 3, revelationPlace: 'Məkkə', startPage: 602 },
  { number: 109, name: 'Kafirun', arabicName: 'سُورَةُ الكَافِرُونَ', ayahCount: 6, revelationPlace: 'Məkkə', startPage: 603 },
  { number: 110, name: 'Nəsr', arabicName: 'سُورَةُ النَّصۡرِ', ayahCount: 3, revelationPlace: 'Mədinə', startPage: 603 },
  { number: 111, name: 'Məsəd', arabicName: 'سُورَةُ المَسَدِ', ayahCount: 5, revelationPlace: 'Məkkə', startPage: 603 },
  { number: 112, name: 'İxlas', arabicName: 'سُورَةُ الإِخۡلَاصِ', ayahCount: 4, revelationPlace: 'Məkkə', startPage: 604 },
  { number: 113, name: 'Fələq', arabicName: 'سُورَةُ الفَلَقِ', ayahCount: 5, revelationPlace: 'Məkkə', startPage: 604 },
  { number: 114, name: 'Nas', arabicName: 'سُورَةُ النَّاسِ', ayahCount: 6, revelationPlace: 'Məkkə', startPage: 604 },
];

export const JUZ_PAGE_RANGES: Array<{ juz: number; startPage: number; endPage: number }> = [
  { juz: 1, startPage: 1, endPage: 21 },
  { juz: 2, startPage: 22, endPage: 41 },
  { juz: 3, startPage: 42, endPage: 61 },
  { juz: 4, startPage: 62, endPage: 81 },
  { juz: 5, startPage: 82, endPage: 101 },
  { juz: 6, startPage: 102, endPage: 121 },
  { juz: 7, startPage: 122, endPage: 141 },
  { juz: 8, startPage: 142, endPage: 161 },
  { juz: 9, startPage: 162, endPage: 181 },
  { juz: 10, startPage: 182, endPage: 201 },
  { juz: 11, startPage: 202, endPage: 221 },
  { juz: 12, startPage: 222, endPage: 241 },
  { juz: 13, startPage: 242, endPage: 261 },
  { juz: 14, startPage: 262, endPage: 281 },
  { juz: 15, startPage: 282, endPage: 301 },
  { juz: 16, startPage: 302, endPage: 321 },
  { juz: 17, startPage: 322, endPage: 341 },
  { juz: 18, startPage: 342, endPage: 361 },
  { juz: 19, startPage: 362, endPage: 381 },
  { juz: 20, startPage: 382, endPage: 401 },
  { juz: 21, startPage: 402, endPage: 421 },
  { juz: 22, startPage: 422, endPage: 441 },
  { juz: 23, startPage: 442, endPage: 461 },
  { juz: 24, startPage: 462, endPage: 481 },
  { juz: 25, startPage: 482, endPage: 501 },
  { juz: 26, startPage: 502, endPage: 521 },
  { juz: 27, startPage: 522, endPage: 541 },
  { juz: 28, startPage: 542, endPage: 561 },
  { juz: 29, startPage: 562, endPage: 581 },
  { juz: 30, startPage: 582, endPage: 604 },
];

export function getSurahByNumber(surahNumber: number): SurahCatalogEntry | undefined {
  return SURAH_CATALOG.find((s) => s.number === surahNumber);
}

export function getJuzForPage(pageNumber: number): number {
  const found = JUZ_PAGE_RANGES.find(
    (range) => pageNumber >= range.startPage && pageNumber <= range.endPage
  );
  return found?.juz ?? 1;
}

export function getPagesForJuz(juzNumber: number | 'all'): number[] {
  if (juzNumber === 'all') {
    return Array.from({ length: TOTAL_QURAN_PAGES }, (_, idx) => idx + 1);
  }
  const range = JUZ_PAGE_RANGES.find((r) => r.juz === juzNumber);
  if (!range) return [];
  const pages: number[] = [];
  for (let p = range.startPage; p <= range.endPage; p++) {
    pages.push(p);
  }
  return pages;
}

export function formatAzerbaijaniOrdinal(n: number): string {
  const abs = Math.abs(Math.trunc(n));
  const unit = abs % 10;
  if (unit === 6) return `${n}-cı`;
  if (unit === 9) return `${n}-cu`;
  if (unit === 3 || unit === 4) return `${n}-cü`;
  if (unit === 1 || unit === 2 || unit === 5 || unit === 7 || unit === 8) return `${n}-ci`;

  // Ends in 0
  const tens = abs % 100;
  if (tens === 10 || tens === 30) return `${n}-cu`;
  if (tens === 40 || tens === 60 || tens === 90) return `${n}-cı`;
  if (tens === 20 || tens === 50 || tens === 70 || tens === 80) return `${n}-ci`;

  const hundreds = abs % 1000;
  if (hundreds >= 100) return `${n}-cü`;
  return `${n}-ci`;
}

export function filterSurahCatalog(
  catalog: SurahCatalogEntry[],
  options: { query: string; place: 'all' | RevelationPlace }
): SurahCatalogEntry[] {
  const q = normalizeAzerbaijaniText(options.query);
  return catalog.filter((surah) => {
    if (options.place !== 'all' && surah.revelationPlace !== options.place) {
      return false;
    }
    if (!q) return true;
    if (/^\d+$/.test(q) && String(surah.number) === q) {
      return true;
    }
    return (
      normalizeAzerbaijaniText(`${surah.number}. ${surah.name} surəsi ${surah.revelationPlace}`).includes(q) ||
      surah.arabicName.includes(options.query.trim())
    );
  });
}

export interface UthmaniPageAyahInput {
  surahNumber: number;
  ayahNumber: number;
  juzNumber: number;
  arabicText: string;
}

export function parseQuranComPageVerses(payload: unknown): UthmaniPageAyahInput[] {
  const obj = payload as {
    verses?: Array<{
      verse_key?: string;
      verse_number?: number;
      juz_number?: number;
      text_uthmani?: string;
    }>;
  };
  if (!Array.isArray(obj?.verses)) return [];

  return obj.verses
    .map((v) => {
      const [surahPart, ayahPart] = String(v.verse_key ?? '').split(':');
      const surahNumber = Number.parseInt(surahPart, 10);
      const ayahNumber = Number.parseInt(ayahPart, 10) || (v.verse_number ?? 1);
      if (Number.isNaN(surahNumber) || surahNumber < 1 || surahNumber > TOTAL_QURAN_SURAHS) {
        return null;
      }
      return {
        surahNumber,
        ayahNumber,
        juzNumber: v.juz_number ?? 1,
        arabicText: String(v.text_uthmani ?? '').trim(),
      };
    })
    .filter((item): item is UthmaniPageAyahInput => item !== null);
}

export function mergePageAyahsWithMusayev(
  pageNumber: number,
  uthmaniAyahs: UthmaniPageAyahInput[],
  surahTranslations: Map<number, SurahTranslationPayload>
): MushafPagePayload {
  const surahMap = new Map<number, Map<number, AyahTranslation>>();
  let editionVersion = '1.0.4';

  for (const [surahNum, payload] of surahTranslations.entries()) {
    if (payload.editionVersion) {
      editionVersion = payload.editionVersion;
    }
    const ayahMap = new Map<number, AyahTranslation>();
    for (const a of payload.ayahs) {
      ayahMap.set(a.ayahNumber, a);
    }
    surahMap.set(surahNum, ayahMap);
  }

  const seenSurahs = new Set<number>();
  const surahsOnPage: MushafPagePayload['surahsOnPage'] = [];

  const ayahs: MushafPageAyah[] = uthmaniAyahs.map((item) => {
    const surahMeta = getSurahByNumber(item.surahNumber);
    const surahName = surahMeta ? `${surahMeta.name} surəsi` : `Surə ${item.surahNumber}`;
    const arabicSurahName = surahMeta?.arabicName ?? '';

    if (!seenSurahs.has(item.surahNumber)) {
      seenSurahs.add(item.surahNumber);
      surahsOnPage.push({
        surahNumber: item.surahNumber,
        surahName,
        arabicName: arabicSurahName,
      });
    }

    const translated = surahMap.get(item.surahNumber)?.get(item.ayahNumber);

    return {
      surahNumber: item.surahNumber,
      surahName,
      arabicSurahName,
      ayahNumber: item.ayahNumber,
      juzNumber: item.juzNumber,
      arabicText: translated?.arabicText || item.arabicText,
      translation: translated?.translation ?? '',
      footnotes: translated?.footnotes ?? '',
    };
  });

  const juzNumber = uthmaniAyahs[0]?.juzNumber ?? getJuzForPage(pageNumber);

  return {
    pageNumber,
    juzNumber,
    surahsOnPage,
    translatorName: 'Əlixan Musayev',
    editionVersion,
    ayahs,
  };
}

export interface MushafPageGroup {
  pageNumber: number;
  juzNumber: number;
  ayahStart: number;
  ayahEnd: number;
  ayahCount: number;
  ayahRangeLabel: string;
  ayahs: AyahTranslation[];
}

export function parseQuranComChapterVersesPages(
  payload: unknown
): Map<number, { pageNumber: number; juzNumber: number }> {
  const result = new Map<number, { pageNumber: number; juzNumber: number }>();
  const obj = payload as {
    verses?: Array<{
      verse_number?: number;
      verse_key?: string;
      page_number?: number;
      juz_number?: number;
    }>;
  };
  if (!Array.isArray(obj?.verses)) return result;

  for (const v of obj.verses) {
    const ayahFromKey = String(v.verse_key ?? '').split(':')[1];
    const ayahNumber = Number.parseInt(ayahFromKey ?? '', 10) || (v.verse_number ?? 0);
    const pageNumber = Number(v.page_number ?? 0);
    const juzNumber = Number(v.juz_number ?? 0);
    if (ayahNumber > 0 && pageNumber >= 1 && pageNumber <= TOTAL_QURAN_PAGES) {
      result.set(ayahNumber, {
        pageNumber,
        juzNumber: juzNumber >= 1 && juzNumber <= 30 ? juzNumber : getJuzForPage(pageNumber),
      });
    }
  }
  return result;
}

export function attachMushafPagesToSurah(
  payload: SurahTranslationPayload,
  pageMap: Map<number, { pageNumber: number; juzNumber: number }>
): SurahTranslationPayload {
  if (pageMap.size === 0) return payload;
  return {
    ...payload,
    ayahs: payload.ayahs.map((ayah) => {
      const meta = pageMap.get(ayah.ayahNumber);
      if (!meta) return ayah;
      return {
        ...ayah,
        pageNumber: meta.pageNumber,
        juzNumber: meta.juzNumber,
      };
    }),
  };
}

export function groupAyahsByMushafPage(
  ayahs: AyahTranslation[],
  fallbackStartPage = 1
): MushafPageGroup[] {
  if (ayahs.length === 0) return [];

  const buckets = new Map<number, AyahTranslation[]>();
  for (const ayah of ayahs) {
    const pageNum =
      ayah.pageNumber && ayah.pageNumber >= 1 && ayah.pageNumber <= TOTAL_QURAN_PAGES
        ? ayah.pageNumber
        : fallbackStartPage;
    const list = buckets.get(pageNum);
    if (list) {
      list.push(ayah);
    } else {
      buckets.set(pageNum, [ayah]);
    }
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([pageNumber, pageAyahs]) => {
      const sorted = [...pageAyahs].sort((a, b) => a.ayahNumber - b.ayahNumber);
      const ayahStart = sorted[0].ayahNumber;
      const ayahEnd = sorted[sorted.length - 1].ayahNumber;
      const juzNumber = sorted[0].juzNumber ?? getJuzForPage(pageNumber);
      const ayahRangeLabel = ayahStart === ayahEnd ? `${ayahStart}` : `${ayahStart}–${ayahEnd}`;

      return {
        pageNumber,
        juzNumber,
        ayahStart,
        ayahEnd,
        ayahCount: sorted.length,
        ayahRangeLabel,
        ayahs: sorted,
      };
    });
}

export function summarizeMushafPageContents(payload: MushafPagePayload): string {
  if (!payload.ayahs.length) return '';
  const groups: Array<{ surahName: string; start: number; end: number }> = [];

  for (const ayah of payload.ayahs) {
    const last = groups[groups.length - 1];
    if (last && last.surahName === ayah.surahName) {
      last.end = ayah.ayahNumber;
    } else {
      groups.push({
        surahName: ayah.surahName,
        start: ayah.ayahNumber,
        end: ayah.ayahNumber,
      });
    }
  }

  return groups
    .map((g) =>
      g.start === g.end ? `${g.surahName} (${g.start})` : `${g.surahName} (${g.start}–${g.end})`
    )
    .join(', ');
}

export function buildMushafPageSeoData(
  pageNumber: number,
  origin: string,
  payload?: MushafPagePayload | null
): {
  title: string;
  description: string;
  summaryText: string;
  prevPath?: string;
  nextPath?: string;
  jsonLd: Array<Record<string, unknown>>;
} {
  const pageOrdinal = formatAzerbaijaniOrdinal(pageNumber);
  const juzNumber = payload?.juzNumber ?? getJuzForPage(pageNumber);
  const juzOrdinal = formatAzerbaijaniOrdinal(juzNumber);
  const summaryText = payload ? summarizeMushafPageContents(payload) : '';
  const ayahCount = payload?.ayahs.length ?? 0;

  const title = summaryText
    ? `Qurani-Kərim, ${pageOrdinal} səhifə (${summaryText}) | Quran Qiraeti`
    : `Qurani-Kərim, ${pageOrdinal} səhifə (Mədinə çapı) — Ərəbcə və Tərcümə | Quran Qiraeti`;

  const description = summaryText
    ? `Mədinə çapı üzrə Qurani-Kərimin ${pageOrdinal} səhifəsi (${juzOrdinal} Cüz, ${ayahCount} ayə): ${summaryText}. Ərəbcə Osman xətti mətn və Əlixan Musayevin Azərbaycan dilinə tərcüməsi (v1.0.4).`
    : `Mədinə çapı üzrə Qurani-Kərimin ${pageOrdinal} səhifəsi (${juzOrdinal} Cüz). Ərəbcə mətn və Əlixan Musayevin son nəşr Azərbaycan tərcüməsi.`;

  const cleanOrigin = origin.replace(/\/+$/, '');
  const pageUrl = `${cleanOrigin}/quran/sehife/${pageNumber}`;

  const jsonLd: Array<Record<string, unknown>> = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Qurani-Kərim — ${pageOrdinal} səhifə (Mədinə çapı)`,
      description,
      inLanguage: ['ar', 'az'],
      url: pageUrl,
      isPartOf: {
        '@type': 'Book',
        name: 'Qurani-Kərim — Əlixan Musayev tərcüməsi',
        numberOfPages: TOTAL_QURAN_PAGES,
        url: `${cleanOrigin}/quran`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Ana səhifə',
          item: `${cleanOrigin}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Tam Qurani-Kərim',
          item: `${cleanOrigin}/quran`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: `${pageOrdinal} səhifə`,
          item: pageUrl,
        },
      ],
    },
  ];

  return {
    title,
    description,
    summaryText,
    prevPath: pageNumber > 1 ? `/quran/sehife/${pageNumber - 1}` : undefined,
    nextPath: pageNumber < TOTAL_QURAN_PAGES ? `/quran/sehife/${pageNumber + 1}` : undefined,
    jsonLd,
  };
}

