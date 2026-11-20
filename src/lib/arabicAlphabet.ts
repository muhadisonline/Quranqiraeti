import { normalizeAzerbaijaniText } from './channel';

export type MakhrajGroupId = 'all' | 'bogaz' | 'dil' | 'dodaq' | 'bosluq';

export interface ArabicLetterEntry {
  order: number;
  id: string;
  nameAz: string;
  arabicIsolated: string;
  arabicInitial: string;
  arabicMedial: string;
  arabicFinal: string;
  connectsLeft: boolean;
  translitAz: string;
  makhrajGroup: Exclude<MakhrajGroupId, 'all'>;
  makhrajGroupLabel: string;
  makhrajAz: string;
  pronunciationTipAz: string;
  quranWordArabic: string;
  quranWordTranslitAz: string;
  quranWordMeaningAz: string;
  surahNumber: number;
  ayahNumber: number;
  surahRefLabel: string;
}

export interface HarakatEntry {
  id: string;
  nameAz: string;
  symbol: string;
  markCode: string;
  soundSuffixAz: string;
  descriptionAz: string;
}

export interface TajweedLessonEntry {
  id: string;
  nameAz: string;
  arabicName: string;
  keyLetters: string;
  ruleSummaryAz: string;
  exampleArabic: string;
  exampleSurahRef: string;
  samplePath: string;
}

export interface AlphabetQuizQuestion {
  target: ArabicLetterEntry;
  promptMode: 'name-from-glyph' | 'form-from-name';
  options: ArabicLetterEntry[];
}

export const MAKHRAJ_GROUPS: ReadonlyArray<{ id: MakhrajGroupId; label: string }> = [
  { id: 'all', label: 'Hamısı (28)' },
  { id: 'bosluq', label: 'Ağız boşluğu' },
  { id: 'bogaz', label: 'Boğaz (Həlq)' },
  { id: 'dil', label: 'Dil (Lisan)' },
  { id: 'dodaq', label: 'Dodaq (Şəfətan)' },
];

export const HARAKAT_GUIDE: readonly HarakatEntry[] = [
  {
    id: 'fatha',
    nameAz: 'Fəthə (Üstün)',
    symbol: 'بَ',
    markCode: '\u064E',
    soundSuffixAz: 'ə / a',
    descriptionAz: 'Hərfin üstünə qoyulan əyri xətdir; incə hərfləri «ə», qalın hərfləri «a» kimi oxudur.',
  },
  {
    id: 'kasra',
    nameAz: 'Kəsrə (Əsrə)',
    symbol: 'بِ',
    markCode: '\u0650',
    soundSuffixAz: 'i / ı',
    descriptionAz: 'Hərfin altına qoyulan xətdir; səsi aşağı çəkərək «i» (qalınlarda qısa «ı»ya yaxın) oxudur.',
  },
  {
    id: 'damma',
    nameAz: 'Zəmmə (Ötrə)',
    symbol: 'بُ',
    markCode: '\u064F',
    soundSuffixAz: 'u',
    descriptionAz: 'Dodaqları irəli uzadaraq «u» səsi ilə oxudur.',
  },
  {
    id: 'sukun',
    nameAz: 'Sükun (Cəzm)',
    symbol: 'أَبْ',
    markCode: '\u0652',
    soundSuffixAz: '(saitsiz)',
    descriptionAz: 'Hərfin üzərində saitsiz dayandığını göstərir; təkcə samit səsi çıxarılır.',
  },
  {
    id: 'shadda',
    nameAz: 'Şəddə (Təşdid)',
    symbol: 'رَبَّ',
    markCode: '\u0651\u064E',
    soundSuffixAz: '(qoşa hərf)',
    descriptionAz: 'Hərfi iki dəfə vurğulu şəkildə birləşdirib oxudur (məsələn: «bb»).',
  },
  {
    id: 'tanwin-fatha',
    nameAz: 'Tənvin Fəthə',
    symbol: 'بًا',
    markCode: '\u064B',
    soundSuffixAz: '-ən / -an',
    descriptionAz: 'İki fəthədir; sözün sonunda «-ən» və ya «-an» səsi verir.',
  },
  {
    id: 'tanwin-kasra',
    nameAz: 'Tənvin Kəsrə',
    symbol: 'بٍ',
    markCode: '\u064D',
    soundSuffixAz: '-in',
    descriptionAz: 'İki kəsrədir; sözün sonunda «-in» səsi verir.',
  },
  {
    id: 'tanwin-damma',
    nameAz: 'Tənvin Zəmmə',
    symbol: 'بٌ',
    markCode: '\u064C',
    soundSuffixAz: '-un',
    descriptionAz: 'İki zəmmədir; sözün sonunda «-un» səsi verir.',
  },
];

export const TAJWEED_ESSENTIALS: readonly TajweedLessonEntry[] = [
  {
    id: 'ghunnah',
    nameAz: 'Ğünnə (Burun səsi)',
    arabicName: 'الغُنَّة',
    keyLetters: 'نّ · مّ',
    ruleSummaryAz: 'Şəddəli Nun (نّ) və Mim (مّ) hərflərində səsi 2 hərəkə müddətində burundan yumşaq saxlamaq.',
    exampleArabic: 'إِنَّ ٱللَّهَ',
    exampleSurahRef: 'Bəqərə, 2:20',
    samplePath: '/quran/sure/2#ayah-20',
  },
  {
    id: 'qalqalah',
    nameAz: 'Qalqələ (Əks-səda vurğusu)',
    arabicName: 'القَلْقَلَة',
    keyLetters: 'ق ط ب ج د',
    ruleSummaryAz: 'Bu 5 hərf sükunlu gəldikdə səsi boğmadan yüngül sıçrayışla aydın səsləndirmək.',
    exampleArabic: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
    exampleSurahRef: 'İxlas, 112:1',
    samplePath: '/quran/sure/112#ayah-1',
  },
  {
    id: 'ikhfa',
    nameAz: 'İxfa (Gizlətmə)',
    arabicName: 'الإِخْفَاء',
    keyLetters: '15 İxfa hərfi',
    ruleSummaryAz: 'Sükunlu Nun və ya tənvindən sonra 15 ixfa hərfi gəldikdə Nun səsini tam vurğulamadan ğünnə ilə gizlədib növbəti hərfə keçmək.',
    exampleArabic: 'أَنزَلْنَا',
    exampleSurahRef: 'Qədr, 97:1',
    samplePath: '/quran/sure/97#ayah-1',
  },
  {
    id: 'idgham',
    nameAz: 'İdğam (Birləşdirmə)',
    arabicName: 'الإِدْغَام',
    keyLetters: 'ي ر م ل و ن',
    ruleSummaryAz: 'Sükunlu Nun və ya tənvindən sonra «Yərməlun» hərfləri gəldikdə ilk hərfi sonrakına qatıb oxumaq.',
    exampleArabic: 'مِن رَّبِّهِمْ',
    exampleSurahRef: 'Bəqərə, 2:5',
    samplePath: '/quran/sure/2#ayah-5',
  },
  {
    id: 'madd',
    nameAz: 'Mədd (Uzatma)',
    arabicName: 'المَدّ',
    keyLetters: 'ا و ي (sait uzatmaları)',
    ruleSummaryAz: 'Mədd hərflərindən sonra həmzə və ya sükun gəldikdə səsi 2, 4 və ya 6 hərəkə qədər uzatmaq.',
    exampleArabic: 'وَلَا ٱلضَّآلِّينَ',
    exampleSurahRef: 'Fatihə, 1:7',
    samplePath: '/quran/sure/1#ayah-7',
  },
];

export const ARABIC_ALPHABET: readonly ArabicLetterEntry[] = [
  {
    order: 1,
    id: 'alif',
    nameAz: 'Əlif',
    arabicIsolated: 'ا',
    arabicInitial: 'ا',
    arabicMedial: 'ـا',
    arabicFinal: 'ـا',
    connectsLeft: false,
    translitAz: 'a / ə',
    makhrajGroup: 'bosluq',
    makhrajGroupLabel: 'Ağız boşluğu',
    makhrajAz: 'Ağız və boğaz boşluğu (Cəvf)',
    pronunciationTipAz: 'Uzatma hərfi kimi özündən əvvəlki fəthəni uzadır; özündən sonrakı hərfə birləşmir.',
    quranWordArabic: 'ٱلْحَمْدُ',
    quranWordTranslitAz: 'Əl-həmdu',
    quranWordMeaningAz: 'Həmd olsun',
    surahNumber: 1,
    ayahNumber: 2,
    surahRefLabel: 'Fatihə, 1:2',
  },
  {
    order: 2,
    id: 'ba',
    nameAz: 'Bə',
    arabicIsolated: 'ب',
    arabicInitial: 'بـ',
    arabicMedial: 'ـبـ',
    arabicFinal: 'ـب',
    connectsLeft: true,
    translitAz: 'b',
    makhrajGroup: 'dodaq',
    makhrajGroupLabel: 'Dodaq',
    makhrajAz: 'İki dodağın bir-birinə sıxılması ilə',
    pronunciationTipAz: 'Azərbaycan dilindəki «b» kimidir; sükun gələndə Qalqələ ilə yüngül vurğu verilir.',
    quranWordArabic: 'بِسْمِ',
    quranWordTranslitAz: 'Bismi',
    quranWordMeaningAz: 'Adı ilə',
    surahNumber: 1,
    ayahNumber: 1,
    surahRefLabel: 'Fatihə, 1:1',
  },
  {
    order: 3,
    id: 'ta',
    nameAz: 'Tə',
    arabicIsolated: 'ت',
    arabicInitial: 'تـ',
    arabicMedial: 'ـتـ',
    arabicFinal: 'ـت',
    connectsLeft: true,
    translitAz: 't',
    makhrajGroup: 'dil',
    makhrajGroupLabel: 'Dil',
    makhrajAz: 'Dilin ucunun üst ön dişlərin kökünə toxunması ilə',
    pronunciationTipAz: 'İncə «t» səsidir; sükun zamanı yüngül nəfəs (həms) buraxılır.',
    quranWordArabic: 'نَسْتَعِينُ',
    quranWordTranslitAz: 'Nəstə’inu',
    quranWordMeaningAz: 'Kömək diləyirik',
    surahNumber: 1,
    ayahNumber: 5,
    surahRefLabel: 'Fatihə, 1:5',
  },
  {
    order: 4,
    id: 'tha',
    nameAz: 'Sə (Pəltək s)',
    arabicIsolated: 'ث',
    arabicInitial: 'ثـ',
    arabicMedial: 'ـثـ',
    arabicFinal: 'ـث',
    connectsLeft: true,
    translitAz: 's (pəltək)',
    makhrajGroup: 'dil',
    makhrajGroupLabel: 'Dil',
    makhrajAz: 'Dilin ucu üst ön dişlərin kənarına toxunur',
    pronunciationTipAz: 'İngiliscə «think» sözündəki «th» kimi dilin ucunu dişlərin arasına yüngül çıxararaq oxuyun.',
    quranWordArabic: 'كَثِيرًا',
    quranWordTranslitAz: 'Kəsiran',
    quranWordMeaningAz: 'Çox / bol',
    surahNumber: 2,
    ayahNumber: 269,
    surahRefLabel: 'Bəqərə, 2:269',
  },
  {
    order: 5,
    id: 'jim',
    nameAz: 'Cim',
    arabicIsolated: 'ج',
    arabicInitial: 'جـ',
    arabicMedial: 'ـجـ',
    arabicFinal: 'ـج',
    connectsLeft: true,
    translitAz: 'c',
    makhrajGroup: 'dil',
    makhrajGroupLabel: 'Dil',
    makhrajAz: 'Orta dilin üst damağa toxunması ilə',
    pronunciationTipAz: 'Azərbaycan dilindəki «c» kimidir; sükun gələndə Qalqələ tətbiq edilir.',
    quranWordArabic: 'سَجَدَ',
    quranWordTranslitAz: 'Səcədə',
    quranWordMeaningAz: 'Səcdə etdi',
    surahNumber: 2,
    ayahNumber: 34,
    surahRefLabel: 'Bəqərə, 2:34',
  },
  {
    order: 6,
    id: 'hha',
    nameAz: 'Ha (Boğaz h-sı)',
    arabicIsolated: 'ح',
    arabicInitial: 'حـ',
    arabicMedial: 'ـحـ',
    arabicFinal: 'ـح',
    connectsLeft: true,
    translitAz: 'h',
    makhrajGroup: 'bogaz',
    makhrajGroupLabel: 'Boğaz',
    makhrajAz: 'Boğazın orta hissəsindən təmiz nəfəslə çıxır',
    pronunciationTipAz: 'Şüşəni nəfəslə buxarlandırarkən çıxan təmiz, boğucu olmayan incə boğaz «h» səsidir.',
    quranWordArabic: 'ٱلرَّحْمَٰنِ',
    quranWordTranslitAz: 'Ər-Rəhmani',
    quranWordMeaningAz: 'Mərhəmətli',
    surahNumber: 1,
    ayahNumber: 3,
    surahRefLabel: 'Fatihə, 1:3',
  },
  {
    order: 7,
    id: 'kha',
    nameAz: 'Xa',
    arabicIsolated: 'خ',
    arabicInitial: 'خـ',
    arabicMedial: 'ـخـ',
    arabicFinal: 'ـخ',
    connectsLeft: true,
    translitAz: 'x',
    makhrajGroup: 'bogaz',
    makhrajGroupLabel: 'Boğaz',
    makhrajAz: 'Boğazın üst (ağıza ən yaxın) hissəsindən qalın çıxır',
    pronunciationTipAz: 'Azərbaycan dilindəki qalın «x» səsidir (məsələn, «xeyir» sözündəki kimi).',
    quranWordArabic: 'خَيْرٌ',
    quranWordTranslitAz: 'Xayrun',
    quranWordMeaningAz: 'Daha xeyirlidir',
    surahNumber: 2,
    ayahNumber: 103,
    surahRefLabel: 'Bəqərə, 2:103',
  },
  {
    order: 8,
    id: 'dal',
    nameAz: 'Dəl',
    arabicIsolated: 'د',
    arabicInitial: 'د',
    arabicMedial: 'ـد',
    arabicFinal: 'ـد',
    connectsLeft: false,
    translitAz: 'd',
    makhrajGroup: 'dil',
    makhrajGroupLabel: 'Dil',
    makhrajAz: 'Dilin ucunun üst ön dişlərin kökünə dəyməsi ilə',
    pronunciationTipAz: 'Aydın «d» səsidir; sükun gəldikdə Qalqələ edilir. Sol tərəfdən növbəti hərfə birləşmir.',
    quranWordArabic: 'ٱلدِّينِ',
    quranWordTranslitAz: 'Əd-dini',
    quranWordMeaningAz: 'Haqq-hesab (Din) günü',
    surahNumber: 1,
    ayahNumber: 4,
    surahRefLabel: 'Fatihə, 1:4',
  },
  {
    order: 9,
    id: 'dhal',
    nameAz: 'Zəl (Pəltək z)',
    arabicIsolated: 'ذ',
    arabicInitial: 'ذ',
    arabicMedial: 'ـذ',
    arabicFinal: 'ـذ',
    connectsLeft: false,
    translitAz: 'z (pəltək)',
    makhrajGroup: 'dil',
    makhrajGroupLabel: 'Dil',
    makhrajAz: 'Dilin ucu üst ön dişlərin kənarına toxunur',
    pronunciationTipAz: 'İngiliscə «this» sözündəki yumşaq pəltək «z» səsidir; özündən sonrakı hərfə birləşmir.',
    quranWordArabic: 'ذَٰلِكَ',
    quranWordTranslitAz: 'Zəlikə',
    quranWordMeaningAz: 'Bu (Kitab)',
    surahNumber: 2,
    ayahNumber: 2,
    surahRefLabel: 'Bəqərə, 2:2',
  },
  {
    order: 10,
    id: 'ra',
    nameAz: 'Ra',
    arabicIsolated: 'ر',
    arabicInitial: 'ر',
    arabicMedial: 'ـر',
    arabicFinal: 'ـر',
    connectsLeft: false,
    translitAz: 'r',
    makhrajGroup: 'dil',
    makhrajGroupLabel: 'Dil',
    makhrajAz: 'Dilin ucunun üst diş ətinə yüngül toxunması ilə',
    pronunciationTipAz: 'Fəthə və zəmmədə qalın, kəsrədə incə oxunur; özündən sonrakı hərfə birləşmir.',
    quranWordArabic: 'رَبِّ',
    quranWordTranslitAz: 'Rəbbi',
    quranWordMeaningAz: 'Rəbbi',
    surahNumber: 1,
    ayahNumber: 2,
    surahRefLabel: 'Fatihə, 1:2',
  },
  {
    order: 11,
    id: 'zay',
    nameAz: 'Zə',
    arabicIsolated: 'ز',
    arabicInitial: 'ز',
    arabicMedial: 'ـز',
    arabicFinal: 'ـز',
    connectsLeft: false,
    translitAz: 'z',
    makhrajGroup: 'dil',
    makhrajGroupLabel: 'Dil',
    makhrajAz: 'Dilin ucunun alt və üst ön dişlərə yaxınlaşması ilə',
    pronunciationTipAz: 'Azərbaycan dilindəki kəskin «z» səsidir; özündən sonrakı hərfə birləşmir.',
    quranWordArabic: 'أَنزَلْنَا',
    quranWordTranslitAz: 'Ənzəlnə',
    quranWordMeaningAz: 'Biz nazil etdik',
    surahNumber: 97,
    ayahNumber: 1,
    surahRefLabel: 'Qədr, 97:1',
  },
  {
    order: 12,
    id: 'sin',
    nameAz: 'Sin',
    arabicIsolated: 'س',
    arabicInitial: 'سـ',
    arabicMedial: 'ـسـ',
    arabicFinal: 'ـس',
    connectsLeft: true,
    translitAz: 's',
    makhrajGroup: 'dil',
    makhrajGroupLabel: 'Dil',
    makhrajAz: 'Dilin ucu alt dişlərin iç səthinə yaxın durur',
    pronunciationTipAz: 'Fitli, aydın və incə «s» səsidir.',
    quranWordArabic: 'ٱلْمُسْتَقِيمَ',
    quranWordTranslitAz: 'Əl-müstəqimə',
    quranWordMeaningAz: 'Doğru (yol)',
    surahNumber: 1,
    ayahNumber: 6,
    surahRefLabel: 'Fatihə, 1:6',
  },
  {
    order: 13,
    id: 'shin',
    nameAz: 'Şin',
    arabicIsolated: 'ش',
    arabicInitial: 'شـ',
    arabicMedial: 'ـشـ',
    arabicFinal: 'ـش',
    connectsLeft: true,
    translitAz: 'ş',
    makhrajGroup: 'dil',
    makhrajGroupLabel: 'Dil',
    makhrajAz: 'Orta dilin ağız tavanına yaxınlaşması ilə',
    pronunciationTipAz: 'Azərbaycan dilindəki yumşaq «ş» səsidir; nəfəs ağız içində yayılır (təfəşşi).',
    quranWordArabic: 'شَهِدَ',
    quranWordTranslitAz: 'Şəhidə',
    quranWordMeaningAz: 'Şahidlik etdi',
    surahNumber: 3,
    ayahNumber: 18,
    surahRefLabel: 'Ali-İmran, 3:18',
  },
  {
    order: 14,
    id: 'sad',
    nameAz: 'Sad',
    arabicIsolated: 'ص',
    arabicInitial: 'صـ',
    arabicMedial: 'ـصـ',
    arabicFinal: 'ـص',
    connectsLeft: true,
    translitAz: 's (qalın)',
    makhrajGroup: 'dil',
    makhrajGroupLabel: 'Dil',
    makhrajAz: 'Dilin kökü yuxarı qalxaraq ucu alt dişlərə yaxınlaşır',
    pronunciationTipAz: 'Dili qalınlaşdıraraq boğuq olmayan dolğun «s» kimi oxuyun.',
    quranWordArabic: 'ٱلصِّرَٰطَ',
    quranWordTranslitAz: 'Əs-siratə',
    quranWordMeaningAz: 'Yol',
    surahNumber: 1,
    ayahNumber: 6,
    surahRefLabel: 'Fatihə, 1:6',
  },
  {
    order: 15,
    id: 'dad',
    nameAz: 'Dad',
    arabicIsolated: 'ض',
    arabicInitial: 'ضـ',
    arabicMedial: 'ـضـ',
    arabicFinal: 'ـض',
    connectsLeft: true,
    translitAz: 'd (qalın)',
    makhrajGroup: 'dil',
    makhrajGroupLabel: 'Dil',
    makhrajAz: 'Dilin yan kənarı üst azı dişlərinə sıxılır',
    pronunciationTipAz: 'Ərəb dilinə xas qalın və dolğun «d» səsidir; dilin kənarını azı dişinə dayayın.',
    quranWordArabic: 'ٱلضَّآلِّينَ',
    quranWordTranslitAz: 'Əd-dallin',
    quranWordMeaningAz: 'Yoldan azmışlar',
    surahNumber: 1,
    ayahNumber: 7,
    surahRefLabel: 'Fatihə, 1:7',
  },
  {
    order: 16,
    id: 'tta',
    nameAz: 'Ta (Qalın t)',
    arabicIsolated: 'ط',
    arabicInitial: 'طـ',
    arabicMedial: 'ـطـ',
    arabicFinal: 'ـط',
    connectsLeft: true,
    translitAz: 't (qalın)',
    makhrajGroup: 'dil',
    makhrajGroupLabel: 'Dil',
    makhrajAz: 'Dilin ucu üst ön diş köklərinə, kökü isə damağa qalxır',
    pronunciationTipAz: 'Ən qalın hərflərdəndir; sükun gəldikdə güclü Qalqələ ilə oxunur.',
    quranWordArabic: 'طَيِّبًا',
    quranWordTranslitAz: 'Tayyibən',
    quranWordMeaningAz: 'Təmiz / xoş',
    surahNumber: 2,
    ayahNumber: 168,
    surahRefLabel: 'Bəqərə, 2:168',
  },
  {
    order: 17,
    id: 'zza',
    nameAz: 'Za (Qalın z)',
    arabicIsolated: 'ظ',
    arabicInitial: 'ظـ',
    arabicMedial: 'ـظـ',
    arabicFinal: 'ـظ',
    connectsLeft: true,
    translitAz: 'z (qalın pəltək)',
    makhrajGroup: 'dil',
    makhrajGroupLabel: 'Dil',
    makhrajAz: 'Dilin ucu üst dişlərin kənarında, kökü damağa qalxmış halda',
    pronunciationTipAz: 'Pəltək «z» məxrəcindən çıxarılıb dil kökünün qalxması ilə qalınlaşdırılır.',
    quranWordArabic: 'ٱلْعَظِيمُ',
    quranWordTranslitAz: 'Əl-əzimu',
    quranWordMeaningAz: 'Uca, Əzəmətli',
    surahNumber: 2,
    ayahNumber: 255,
    surahRefLabel: 'Bəqərə, 2:255',
  },
  {
    order: 18,
    id: 'ayn',
    nameAz: 'Eyn',
    arabicIsolated: 'ع',
    arabicInitial: 'عـ',
    arabicMedial: 'ـعـ',
    arabicFinal: 'ـع',
    connectsLeft: true,
    translitAz: '‘ (boğaz səsi)',
    makhrajGroup: 'bogaz',
    makhrajGroupLabel: 'Boğaz',
    makhrajAz: 'Boğazın orta hissəsinin yumşaq sıxılması ilə',
    pronunciationTipAz: 'Adi «a/ə» kimi deyil, orta boğazı hafif sıxaraq dərin səs tonu ilə oxuyun.',
    quranWordArabic: 'ٱلْعَالَمِينَ',
    quranWordTranslitAz: 'Əl-‘aləminə',
    quranWordMeaningAz: 'Aləmlərin',
    surahNumber: 1,
    ayahNumber: 2,
    surahRefLabel: 'Fatihə, 1:2',
  },
  {
    order: 19,
    id: 'ghayn',
    nameAz: 'Ğeyn',
    arabicIsolated: 'غ',
    arabicInitial: 'غـ',
    arabicMedial: 'ـغـ',
    arabicFinal: 'ـغ',
    connectsLeft: true,
    translitAz: 'ğ',
    makhrajGroup: 'bogaz',
    makhrajGroupLabel: 'Boğaz',
    makhrajAz: 'Boğazın üst hissəsindən xırıltısız yumşaq qalın çıxır',
    pronunciationTipAz: 'Azərbaycan dilindəki «ğ» səsinə yaxındır (məsələn, «bağça», «dağ» sözlərindəki kimi).',
    quranWordArabic: 'غَيْرِ',
    quranWordTranslitAz: 'Ğəyri',
    quranWordMeaningAz: 'Başqalarının / deyil',
    surahNumber: 1,
    ayahNumber: 7,
    surahRefLabel: 'Fatihə, 1:7',
  },
  {
    order: 20,
    id: 'fa',
    nameAz: 'Fə',
    arabicIsolated: 'ف',
    arabicInitial: 'فـ',
    arabicMedial: 'ـفـ',
    arabicFinal: 'ـف',
    connectsLeft: true,
    translitAz: 'f',
    makhrajGroup: 'dodaq',
    makhrajGroupLabel: 'Dodaq',
    makhrajAz: 'Üst ön dişlərin alt dodağın içinə dəyməsi ilə',
    pronunciationTipAz: 'Azərbaycan dilindəki «f» kimidir.',
    quranWordArabic: 'يُنفِقُونَ',
    quranWordTranslitAz: 'Yunfiqunə',
    quranWordMeaningAz: 'Xərcləyərlər (infəq edərlər)',
    surahNumber: 2,
    ayahNumber: 3,
    surahRefLabel: 'Bəqərə, 2:3',
  },
  {
    order: 21,
    id: 'qaf',
    nameAz: 'Qaf',
    arabicIsolated: 'ق',
    arabicInitial: 'قـ',
    arabicMedial: 'ـقـ',
    arabicFinal: 'ـق',
    connectsLeft: true,
    translitAz: 'q',
    makhrajGroup: 'dil',
    makhrajGroupLabel: 'Dil',
    makhrajAz: 'Dilin ən arxa kökü yumşaq damağa dəyir',
    pronunciationTipAz: 'Azərbaycan dilindəki partlayışlı qalın «q» səsidir; sükunda Qalqələ olunur.',
    quranWordArabic: 'قُلْ',
    quranWordTranslitAz: 'Qul',
    quranWordMeaningAz: 'De!',
    surahNumber: 112,
    ayahNumber: 1,
    surahRefLabel: 'İxlas, 112:1',
  },
  {
    order: 22,
    id: 'kaf',
    nameAz: 'Kəf',
    arabicIsolated: 'ك',
    arabicInitial: 'كـ',
    arabicMedial: 'ـكـ',
    arabicFinal: 'ـك',
    connectsLeft: true,
    translitAz: 'k',
    makhrajGroup: 'dil',
    makhrajGroupLabel: 'Dil',
    makhrajAz: 'Dil arxası sərt damağa (Qaf nöqtəsindən bir az öndə) dəyir',
    pronunciationTipAz: 'İncə «k» səsidir (məsələn, «kitab» sözündəki kimi).',
    quranWordArabic: 'إِيَّاكَ',
    quranWordTranslitAz: 'İyyəkə',
    quranWordMeaningAz: 'Yalnız Sənə',
    surahNumber: 1,
    ayahNumber: 5,
    surahRefLabel: 'Fatihə, 1:5',
  },
  {
    order: 23,
    id: 'lam',
    nameAz: 'Ləm',
    arabicIsolated: 'ل',
    arabicInitial: 'لـ',
    arabicMedial: 'ـلـ',
    arabicFinal: 'ـل',
    connectsLeft: true,
    translitAz: 'l',
    makhrajGroup: 'dil',
    makhrajGroupLabel: 'Dil',
    makhrajAz: 'Dilin ön yan kənarları üst diş ətinə toxunur',
    pronunciationTipAz: 'İncə «l» səsidir; yalnız «Allah» kəlməsindən əvvəl fəthə və ya zəmmə olarsa qalınlaşır.',
    quranWordArabic: 'لِلَّهِ',
    quranWordTranslitAz: 'Lilləhi',
    quranWordMeaningAz: 'Allaha',
    surahNumber: 1,
    ayahNumber: 2,
    surahRefLabel: 'Fatihə, 1:2',
  },
  {
    order: 24,
    id: 'mim',
    nameAz: 'Mim',
    arabicIsolated: 'م',
    arabicInitial: 'مـ',
    arabicMedial: 'ـمـ',
    arabicFinal: 'ـم',
    connectsLeft: true,
    translitAz: 'm',
    makhrajGroup: 'dodaq',
    makhrajGroupLabel: 'Dodaq',
    makhrajAz: 'İki dodağın birləşməsi və burun (xəyşum) ahəngi ilə',
    pronunciationTipAz: 'Azərbaycan dilindəki «m» kimidir; şəddəli gəldikdə 2 hərəkə ğünnə ilə oxunur.',
    quranWordArabic: 'مَٰلِكِ',
    quranWordTranslitAz: 'Məliki',
    quranWordMeaningAz: 'Sahibi / Hökmdarı',
    surahNumber: 1,
    ayahNumber: 4,
    surahRefLabel: 'Fatihə, 1:4',
  },
  {
    order: 25,
    id: 'nun',
    nameAz: 'Nun',
    arabicIsolated: 'ن',
    arabicInitial: 'نـ',
    arabicMedial: 'ـنـ',
    arabicFinal: 'ـن',
    connectsLeft: true,
    translitAz: 'n',
    makhrajGroup: 'dil',
    makhrajGroupLabel: 'Dil',
    makhrajAz: 'Dilin ucu üst ön diş ətinə dəyir (xəyşum dəstəyi ilə)',
    pronunciationTipAz: 'Azərbaycan dilindəki «n» kimidir; İxfa, İdğam və Ğünnə qaydalarının əsas hərfidir.',
    quranWordArabic: 'نَعْبُدُ',
    quranWordTranslitAz: 'Nə’budu',
    quranWordMeaningAz: 'İbadət edirik',
    surahNumber: 1,
    ayahNumber: 5,
    surahRefLabel: 'Fatihə, 1:5',
  },
  {
    order: 26,
    id: 'ha',
    nameAz: 'Hə (İncə h)',
    arabicIsolated: 'ه',
    arabicInitial: 'هـ',
    arabicMedial: 'ـهـ',
    arabicFinal: 'ـه',
    connectsLeft: true,
    translitAz: 'h',
    makhrajGroup: 'bogaz',
    makhrajGroupLabel: 'Boğaz',
    makhrajAz: 'Boğazın ən aşağı (sinəyə yaxın) hissəsindən',
    pronunciationTipAz: 'Azərbaycan dilindəki rahat, yumşaq «h» səsidir (məsələn, «hava» sözündəki kimi).',
    quranWordArabic: 'ٱهْدِنَا',
    quranWordTranslitAz: 'İhdinə',
    quranWordMeaningAz: 'Bizi yönəlt',
    surahNumber: 1,
    ayahNumber: 6,
    surahRefLabel: 'Fatihə, 1:6',
  },
  {
    order: 27,
    id: 'waw',
    nameAz: 'Vav',
    arabicIsolated: 'و',
    arabicInitial: 'و',
    arabicMedial: 'ـو',
    arabicFinal: 'ـو',
    connectsLeft: false,
    translitAz: 'v / u',
    makhrajGroup: 'dodaq',
    makhrajGroupLabel: 'Dodaq',
    makhrajAz: 'İki dodağın yumru şəkildə irəli uzadılması ilə',
    pronunciationTipAz: 'Üst dişləri alt dodağa toxundurmadan dodaqları dairələşdirib «w» kimi oxuyun; sola birləşmir.',
    quranWordArabic: 'وَلَا',
    quranWordTranslitAz: 'Və lə',
    quranWordMeaningAz: 'Və deyil',
    surahNumber: 1,
    ayahNumber: 7,
    surahRefLabel: 'Fatihə, 1:7',
  },
  {
    order: 28,
    id: 'ya',
    nameAz: 'Yə',
    arabicIsolated: 'ي',
    arabicInitial: 'يـ',
    arabicMedial: 'ـيـ',
    arabicFinal: 'ـي',
    connectsLeft: true,
    translitAz: 'y / i',
    makhrajGroup: 'dil',
    makhrajGroupLabel: 'Dil',
    makhrajAz: 'Orta dilin üst damağa qalxması ilə',
    pronunciationTipAz: 'Samit olduqda «y», sükunlu olub əvvəlində kəsrə gəldikdə uzun «i» səsi verir.',
    quranWordArabic: 'يَوْمِ',
    quranWordTranslitAz: 'Yəvmi',
    quranWordMeaningAz: 'Günü',
    surahNumber: 1,
    ayahNumber: 4,
    surahRefLabel: 'Fatihə, 1:4',
  },
];

export function filterArabicLetters(
  query: string,
  group: MakhrajGroupId = 'all'
): ArabicLetterEntry[] {
  const norm = normalizeAzerbaijaniText(query);
  return ARABIC_ALPHABET.filter((letter) => {
    if (group !== 'all' && letter.makhrajGroup !== group) {
      return false;
    }
    if (!norm) return true;
    const haystack = normalizeAzerbaijaniText(
      `${letter.order} ${letter.nameAz} ${letter.translitAz} ${letter.makhrajGroupLabel} ${letter.quranWordTranslitAz}`
    );
    return (
      haystack.includes(norm) ||
      letter.arabicIsolated.includes(query.trim())
    );
  });
}

export function applyHarakatToLetter(
  letter: ArabicLetterEntry,
  harakatId: string
): string {
  const harakat = HARAKAT_GUIDE.find((h) => h.id === harakatId);
  if (!harakat) return letter.arabicIsolated;

  if (harakat.id === 'sukun') {
    return `أَ${letter.arabicIsolated}\u0652`;
  }
  if (harakat.id === 'tanwin-fatha') {
    if (letter.arabicIsolated === 'ا') return 'أً';
    return letter.connectsLeft
      ? `${letter.arabicIsolated}\u064Bا`
      : `${letter.arabicIsolated}\u064B`;
  }
  return `${letter.arabicIsolated}${harakat.markCode}`;
}

export function buildAlphabetQuizQuestion(
  targetOrder: number,
  seedOffset = 0,
  promptMode: 'name-from-glyph' | 'form-from-name' = 'name-from-glyph'
): AlphabetQuizQuestion {
  const safeTarget =
    ARABIC_ALPHABET.find((l) => l.order === targetOrder) ?? ARABIC_ALPHABET[0];

  const pool = ARABIC_ALPHABET.filter((l) => l.order !== safeTarget.order);
  const distractors: ArabicLetterEntry[] = [];
  const step = 7;
  let cursor = (safeTarget.order + Math.abs(seedOffset)) % pool.length;

  while (distractors.length < 3 && distractors.length < pool.length) {
    const candidate = pool[cursor % pool.length];
    if (candidate && !distractors.some((d) => d.id === candidate.id)) {
      distractors.push(candidate);
    }
    cursor += step;
  }

  const all = [safeTarget, ...distractors];
  const rotate = Math.abs(targetOrder + seedOffset) % all.length;
  const options = [...all.slice(rotate), ...all.slice(0, rotate)];

  return {
    target: safeTarget,
    promptMode,
    options,
  };
}
