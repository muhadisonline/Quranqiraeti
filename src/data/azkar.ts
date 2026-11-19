export type AzkarCategory = 'seher' | 'axsam' | 'namaz' | 'umumi';

export interface AzkarItem {
  id: string;
  category: AzkarCategory;
  title: string;
  arabicText: string;
  translation: string;
  targetCount: number;
  source: string;
  virtue: string;
}

export const AZKAR_CATEGORY_LABELS: Record<'all' | AzkarCategory, string> = {
  all: 'Hamısı',
  seher: 'Səhər zikrləri',
  axsam: 'Axşam zikrləri',
  namaz: 'Namaz sonrası',
  umumi: 'Gündəlik fəzilətlər',
};

export const TASBIH_PRESETS = [
  {
    id: 'subhanallah',
    title: 'Sübhanəllah',
    arabic: 'سُبْحَانَ ٱللَّهِ',
    transliteration: 'Sübhənəllah',
    meaning: 'Allah bütün nöqsanlardan pak və ucadır',
    target: 33,
  },
  {
    id: 'alhamdulillah',
    title: 'Əlhəmdülillah',
    arabic: 'ٱلْحَمْدُ لِلَّهِ',
    transliteration: 'Əlhəmdülillah',
    meaning: 'Bütün həmd və şükür Allaha məxsusdur',
    target: 33,
  },
  {
    id: 'allahuakbar',
    title: 'Allahu Əkbər',
    arabic: 'ٱللَّهُ أَكْبَرُ',
    transliteration: 'Allahu Əkbər',
    meaning: 'Allah hər şeydən uca və böyükdür',
    target: 34,
  },
  {
    id: 'istighfar',
    title: 'Əstəğfirullah',
    arabic: 'أَسْتَغْفِرُ ٱللَّهَ',
    transliteration: 'Əstəğfirullah',
    meaning: 'Allahdan bağışlanma diləyirəm',
    target: 100,
  },
  {
    id: 'tahlil',
    title: 'Lə ilahə illəllah',
    arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    transliteration: 'Lə iləhə illəllahu vəhdəhu lə şərikə ləh',
    meaning: 'Tək olan Allahdan başqa məbud yoxdur, Onun şəriki yoxdur',
    target: 100,
  },
  {
    id: 'salawat',
    title: 'Salavat',
    arabic: 'ٱللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ',
    transliteration: 'Allahummə salli alə Muhəmmədin və alə əli Muhəmməd',
    meaning: 'Allahım, Muhəmmədə və onun ailəsinə salavat (xeyir-dua) göndər',
    target: 100,
  },
] as const;

export const DAILY_AZKAR: AzkarItem[] = [
  {
    id: 'sayyidul-istighfar',
    category: 'seher',
    title: 'Seyyidül-İstiğfar (Ən fəzilətli bağışlanma duası)',
    arabicText:
      'ٱللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا ٱسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَٱغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ ٱلذُّنُوبَ إِلَّا أَنْتَ',
    translation:
      'Allahım! Sən mənim Rəbbimsən, Səndən başqa haqq məbud yoxdur. Məni Sən yaratdın və mən Sənin qulunam. Gücüm çatdığı qədər Sənin əhd-peymanına və vədinə sadiqəm. Etdiyim əməllərin şərindən Sənə sığınıram. Mənə verdiyin nemətləri etiraf edirəm və günahımı da boynuma alıram. Məni bağışla; şübhəsiz ki, günahları Səndən başqa bağışlayan yoxdur.',
    targetCount: 1,
    source: 'Səhih əl-Buxari (6306)',
    virtue: 'Səhər və axşam yəqinliklə oxuyan şəxs üçün böyük rəhmət müjdəsi vardır.',
  },
  {
    id: 'seher-baslangic',
    category: 'seher',
    title: 'Səhər Rəbbə Həmd və Təvəkkül Zikri',
    arabicText:
      'أَصْبَحْنَا وَأَصْبَحَ ٱلْمُلْكُ لِلَّهِ وَٱلْحَمْدُ لِلَّهِ لَا إِلَٰهَ إِلَّا ٱللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ ٱلْمُلْكُ وَلَهُ ٱلْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    translation:
      'Səhərə çıxdıq və mülk də Allaha məxsus olaraq səhərə çıxdı. Həmd Allaha məxsusdur. Tək olan Allahdan başqa məbud yoxdur, Onun şəriki yoxdur. Mülk də Onundur, həmd də Onundur və O, hər şeyə qadirdir.',
    targetCount: 1,
    source: 'Səhih Müslim (2723)',
    virtue: 'Günün ilk anlarını Allaha həmd və tövhid ilə başlamaq üçün oxunur.',
  },
  {
    id: 'seher-qorunma',
    category: 'seher',
    title: 'Hər Cür Zərərdən Qorunma Zikri',
    arabicText:
      'بِسْمِ ٱللَّهِ ٱلَّذِي لَا يَضُرُّ مَعَ ٱسْمِهِ شَيْءٌ فِي ٱلْأَرْضِ وَلَا فِي ٱلسَّمَاءِ وَهُوَ ٱلسَّمِيعُ ٱلْعَلِيمُ',
    translation:
      'Adı ilə yerdə və göydə heç bir şeyin zərər verə bilməyəcəyi Allahın adı ilə! O, Eşidəndir, Biləndir.',
    targetCount: 3,
    source: 'Əbu Davud (5088), Tirmizi (3388)',
    virtue: 'Səhər 3 dəfə oxuyana axşama qədər, axşam 3 dəfə oxuyana səhərə qədər qəfil bəla toxunmaz.',
  },
  {
    id: 'seher-razi-olmaq',
    category: 'seher',
    title: 'İman və İslamdan Razılıq Zikri',
    arabicText:
      'رَضِيتُ بِٱللَّهِ رَبًّا وَبِٱلْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ نَبِيًّا',
    translation:
      'Allahı Rəbb, İslamı din, Muhəmmədi (s.a.s.) isə peyğəmbər kimi qəbul edib razı qaldım.',
    targetCount: 3,
    source: 'Əbu Davud (5072), Tirmizi (3389)',
    virtue: 'Qəlbdə iman sabitliyini və şükür hissini möhkəmləndirir.',
  },
  {
    id: 'hasbiyallahu',
    category: 'seher',
    title: 'Təvəkkül Ayəsi (Tövbə, 9:129)',
    arabicText:
      'حَسْبِيَ ٱللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ ٱلْعَرْشِ ٱلْعَظِيمِ',
    translation:
      'Mənə Allah yetər! Ondan başqa ibadətə layiq məbud yoxdur. Mən yalnız Ona təvəkkül etdim. O, əzəmətli Ərşin Rəbbidir!',
    targetCount: 7,
    source: 'Qurani-Kərim (Tövbə, 9:129) · Əbu Davud (5081)',
    virtue: 'Dünya və axirət qayğılarına qarşı səhər-axşam 7 dəfə oxunur.',
  },
  {
    id: 'axsam-baslangic',
    category: 'axsam',
    title: 'Axşam Rəbbə Həmd və Sığınma Zikri',
    arabicText:
      'أَمْسَيْنَا وَأَمْسَى ٱلْمُلْكُ لِلَّهِ وَٱلْحَمْدُ لِلَّهِ لَا إِلَٰهَ إِلَّا ٱللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ ٱلْمُلْكُ وَلَهُ ٱلْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    translation:
      'Axşama çıxdıq və mülk də Allaha məxsus olaraq axşama çıxdı. Həmd Allaha məxsusdur. Tək olan Allahdan başqa məbud yoxdur, şəriki yoxdur. Mülk Onundur, həmd Onundur və O, hər şeyə qadirdir.',
    targetCount: 1,
    source: 'Səhih Müslim (2723)',
    virtue: 'Axşam namazından sonra gecənin xeyir və bərəkətini diləmək üçün oxunur.',
  },
  {
    id: 'axsam-kelimeler',
    category: 'axsam',
    title: 'Allahın Tam Kəlmələrinə Sığınmaq',
    arabicText: 'أَعُوذُ بِكَلِمَاتِ ٱللَّهِ ٱلتَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    translation: 'Yaratdıqlarının şərindən Allahın tam (kamil) kəlmələrinə sığınıram.',
    targetCount: 3,
    source: 'Səhih Müslim (2709)',
    virtue: 'Axşamlar və hər hansı mənzilə çatdıqda 3 dəfə oxunur.',
  },
  {
    id: 'namaz-salam-zikri',
    category: 'namaz',
    title: 'Salamdan Dərhal Sonra Oxunan Zikr',
    arabicText:
      'أَسْتَغْفِرُ ٱللَّهَ أَسْتَغْفِرُ ٱللَّهَ أَسْتَغْفِرُ ٱللَّهَ ٱللَّهُمَّ أَنْتَ ٱلسَّلَامُ وَمِنْكَ ٱلسَّلَامُ تَبَارَكْتَ يَا ذَا ٱلْجَلَالِ وَٱلْإِكْرَامِ',
    translation:
      'Allahdan bağışlanma diləyirəm (3 dəfə). Allahım! Sən Səlamsan (əmin-amanlıq mənbəyisən) və əmin-amanlıq yalnız Səndəndir. Ey əzəmət və ikram sahibi, Sən nə qədər uca və bərəkətlisən!',
    targetCount: 1,
    source: 'Səhih Müslim (591)',
    virtue: 'Hər fərz namazından salam verdikdən sonra dərhal oxunur.',
  },
  {
    id: 'namaz-ibadet-duasi',
    category: 'namaz',
    title: 'Zikr, Şükür və Gözəl İbadət İstəyi',
    arabicText: 'ٱللَّهُمَّ أَعِنِّي عَلَىٰ ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
    translation:
      'Allahım! Səni zikr etməkdə, Sənə şükür etməkdə və Sənə gözəl şəkildə ibadət etməkdə mənə kömək ol!',
    targetCount: 1,
    source: 'Əbu Davud (1522), Nəsai (1303)',
    virtue: 'Peyğəmbərimizin (s.a.s.) hər namazdan sonra tərk etməməyi tövsiyə etdiyi dua.',
  },
  {
    id: 'subhanallahi-ve-bihamdihi',
    category: 'umumi',
    title: 'Dildə Yüngül, Tərəzidə Ağır Zikr',
    arabicText: 'سُبْحَانَ ٱللَّهِ وَبِحَمْدِهِ سُبْحَانَ ٱللَّهِ ٱلْعَظِيمِ',
    translation: 'Allah pak və nöqsansızdır və Ona həmd olsun! Uca Allah pak və nöqsansızdır!',
    targetCount: 100,
    source: 'Səhih əl-Buxari (6406), Səhih Müslim (2694)',
    virtue: 'Gündə 100 dəfə "Sübhanəllahi və bihəmdihi" deyənin günahları dəniz köpüyü qədər olsa belə bağışlanar.',
  },
  {
    id: 'la-hawla',
    category: 'umumi',
    title: 'Cənnət Xəzinələrindən Biri',
    arabicText: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّهِ',
    translation: 'Güc və qüvvət yalnız Allahın köməyi ilədir.',
    targetCount: 33,
    source: 'Səhih əl-Buxari (4205), Səhih Müslim (2704)',
    virtue: 'Çətinlik anlarında acizliyi etiraf edərək Allahdan güc istəmək üçün oxunur.',
  },
];
