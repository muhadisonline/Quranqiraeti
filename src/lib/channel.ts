export type VideoFormat = 'long' | 'short';
export type RecitationCategory = 'mekke' | 'medeni' | 'secilmis' | 'qisa';
export type FilterTab = 'all' | RecitationCategory | 'saved';

export interface AyahTranslation {
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  translation: string;
  footnotes: string;
}

export interface SurahTranslationPayload {
  surahNumber: number;
  translatorName: string;
  editionVersion: string;
  ayahs: AyahTranslation[];
}

export interface RecitationVideo {
  videoId: string;
  format: VideoFormat;
  rawTitle: string;
  title: string;
  surahNumber: number;
  surahName: string;
  arabicName: string;
  ayahRange: string;
  ayahStart?: number;
  ayahEnd?: number;
  reciter: string;
  category: RecitationCategory;
  categoryLabel: string;
  revelationPlace: string;
  duration: string;
  durationSeconds: number;
  published: string;
  publishedLabel?: string;
  views: number;
  thumbnailUrl: string;
  youtubeUrl: string;
  reflection: string;
  seoDescription: string;
  seoKeywords: string[];
}

export interface ChannelStats {
  channelId: string;
  handle: string;
  name: string;
  description: string;
  subscribersLabel: string;
  videoCountLabel: string;
  youtubeUrl: string;
  subscribeUrl: string;
  source: 'live' | 'archive';
}

export interface SurahRequestInput {
  surahName: string;
  reciter: string;
  email: string;
  note: string;
}

export interface SurahRequestRecord extends SurahRequestInput {
  id: string;
  createdAt: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof SurahRequestInput, string>>;
}

interface SurahMeta {
  surahNumber: number;
  canonical: string;
  arabic: string;
  category: RecitationCategory;
  revelationPlace: string;
  reflection: string;
  seoFocus: string;
}

const SURAH_METADATA_MAP: Array<{ keys: string[]; meta: SurahMeta; defaultAyah?: [number, number] }> = [
  {
    keys: ['bakara', 'bəqərə', 'baqarah'],
    meta: {
      surahNumber: 2,
      canonical: 'Bəqərə surəsi',
      arabic: 'سورة البقرة',
      category: 'medeni',
      revelationPlace: 'Mədinə',
      reflection: 'Qurani-Kərimin ən uzun surəsi: iman əsasları, Ayətül-Kürsi və əxlaqi-hüquqi hökmlər.',
      seoFocus: 'Bəqərə surəsi tam tilavət, Ayətül-Kürsi və Azərbaycan dilində mənaca tərcümə.',
    },
  },
  {
    keys: ['olum sizi haqlayacaq', 'harada olursunuzsa olun'],
    defaultAyah: [78, 79],
    meta: {
      surahNumber: 4,
      canonical: 'Nisa surəsi',
      arabic: 'سورة النساء',
      category: 'medeni',
      revelationPlace: 'Mədinə',
      reflection: 'Harada olursunuzsa olun, ölümün insanı haqlayacağı və hər şeyin Allahdan olduğu xatırladılır.',
      seoFocus: 'Nisa surəsi 78-ci ayə qiraəti və Əlixan Musayevin Azərbaycan dilinə tərcüməsi.',
    },
  },
  {
    keys: ['araf', 'a‘raf'],
    meta: {
      surahNumber: 7,
      canonical: 'Əraf surəsi',
      arabic: 'سورة الأعراف',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Haqqın batil üzərində qələbəsi və peyğəmbərlərin mübarizə tarixi.',
      seoFocus: 'Əraf surəsi tilavəti, ərəbcə oxunuş və Azərbaycan tərcüməsi.',
    },
  },
  {
    keys: ['yunus'],
    meta: {
      surahNumber: 10,
      canonical: 'Yunus surəsi',
      arabic: 'سورة يونس',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Allahın rəhməti, Quranın şəfa və hidayət rəhbəri olması barədə ayələr.',
      seoFocus: 'Yunus surəsi qısa qiraət, ərəbcə tilavət və Azərbaycan dilində tərcümə.',
    },
  },
  {
    keys: ['yusuf'],
    meta: {
      surahNumber: 12,
      canonical: 'Yusuf surəsi',
      arabic: 'سورة يوسف',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Səbir, iffət və İlahi təqdirin ən gözəl qissəsi olan Həzrət Yusif peyğəmbərin hekayəti.',
      seoFocus: 'Yusuf surəsi qiraəti, ərəbcə tilavət və Azərbaycan dilində tərcümə.',
    },
  },
  {
    keys: ['ibrahim'],
    meta: {
      surahNumber: 14,
      canonical: 'İbrahim surəsi',
      arabic: 'سورة إبراهيم',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Şükür edənlərə nemətin artırılması və Həzrət İbrahimin səmimi duaları.',
      seoFocus: 'İbrahim surəsi tilavəti, hüzurlu qiraət və Azərbaycan dilində tərcümə.',
    },
  },
  {
    keys: ['hicr'],
    meta: {
      surahNumber: 15,
      canonical: 'Hicr surəsi',
      arabic: 'سورة الحجر',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Quranın İlahi mühafizəsi və səbirli bəndələrə verilən mənəvi təsəlli.',
      seoFocus: 'Hicr surəsi qiraəti, ərəbcə tilavət və Azərbaycan dilində tərcümə.',
    },
  },
  {
    keys: ['kehf', 'kəhf', 'kahf'],
    meta: {
      surahNumber: 18,
      canonical: 'Kəhf surəsi',
      arabic: 'سورة الكهف',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Cümə gününün nuru, fitnələrdən qorunma və gənclərin iman səbatı haqqında ayələr.',
      seoFocus: 'Kəhf surəsi tilavəti, Cümə oxunuşu və Azərbaycan dilində mənaca tərcümə.',
    },
  },
  {
    keys: ['meryem', 'məryəm', 'maryam'],
    meta: {
      surahNumber: 19,
      canonical: 'Məryəm surəsi',
      arabic: 'سورة مريم',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Həzrət Zəkəriyya, Məryəm və İsa peyğəmbərlər haqqında mərhəmət və təslimiyyət ayələri.',
      seoFocus: 'Məryəm surəsi tilavəti, Maher Al-Muaiqly qiraəti və Azərbaycan dilində tərcümə.',
    },
  },
  {
    keys: ['taha'],
    meta: {
      surahNumber: 20,
      canonical: 'Taha surəsi',
      arabic: 'سورة طه',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Quranın bədbəxtlik üçün deyil, öyüd və qəlb rahatlığı üçün nazil olması.',
      seoFocus: 'Taha surəsi qiraəti, İslam Subhi tilavəti və Azərbaycan dilində tərcümə.',
    },
  },
  {
    keys: [
      'muminun',
      'möminun',
      'mominlər, həqiqətən',
      'ey rəbbim, bagisla',
      'sur ufuruleceyi',
      'ebes yere yaratmis',
      'neheyat, onlardan birine',
      'qeybi ve askari',
      'haqqi getirdik',
      'duyunub ibret',
      'yer uzunde yaradib',
      'rebbine boyun eymediler',
    ],
    meta: {
      surahNumber: 23,
      canonical: 'Muminun surəsi',
      arabic: 'سورة المؤمنون',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Həqiqi möminlərin sifətləri, namazda xüşu və nicat yolunu göstərən ayələr.',
      seoFocus: 'Muminun surəsi tilavəti, möminlərin xüsusiyyətləri və Azərbaycan tərcüməsi.',
    },
  },
  {
    keys: ['qasas', 'qəsəs'],
    meta: {
      surahNumber: 28,
      canonical: 'Qasas surəsi',
      arabic: 'سورة القصص',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Həzrət Musa peyğəmbərin həyatı, zülmə qarşı İlahi ədalət və təvəkkül mövzuları.',
      seoFocus: 'Qasas surəsi tilavəti, Yasser Al-Dosari qiraəti və Azərbaycan dilində məna tərcüməsi.',
    },
  },
  {
    keys: ['loqman', 'luqman'],
    meta: {
      surahNumber: 31,
      canonical: 'Loqman surəsi',
      arabic: 'سورة لقمان',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Həzrət Loğmanın oğluna hikmətli nəsihətləri, valideynə hörmət və təvazökarlıq dərsləri.',
      seoFocus: 'Loqman surəsi qiraəti, İslam Subhi tilavəti və Azərbaycan dilində nəsihət ayələri.',
    },
  },
  {
    keys: ['doyusde allah mominlere kifayet etdi'],
    defaultAyah: [25, 25],
    meta: {
      surahNumber: 33,
      canonical: 'Əhzab surəsi',
      arabic: 'سورة الأحزاب',
      category: 'medeni',
      revelationPlace: 'Mədinə',
      reflection: 'Allahın möminlərə yardımı və Əhzab döyüşündə İlahi dəstək.',
      seoFocus: 'Əhzab surəsi 25-ci ayə tilavəti və Əlixan Musayev tərcüməsi.',
    },
  },
  {
    keys: [
      'fatir',
      'dirilerle oluler',
      'iki deniz eyni ola bilmez',
      'hec bir gunahkar',
      'kim izzet istese',
      'kafirlerin kufru',
      'oz lutfu ile bizi ebedi',
      'sen ancaq xeberdar',
      'xurma ceyirdeyinin',
    ],
    meta: {
      surahNumber: 35,
      canonical: 'Fatir surəsi',
      arabic: 'سورة فاطر',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Göyləri və yeri yaradan Allahın mərhəməti, zülmət ilə nurun fərqi.',
      seoFocus: 'Fatir surəsi tilavəti, Azərbaycan dilində mənaca tərcümə və təfəkkür.',
    },
  },
  {
    keys: ['yasin', 'yaseen'],
    meta: {
      surahNumber: 36,
      canonical: 'Yasin surəsi',
      arabic: 'سورة يس',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Quranın qəlbi adlandırılan surə: risalət, yaradılış dəlilləri və diriliş.',
      seoFocus: 'Yasin surəsi tilavəti, ərəbcə oxunuş və Azərbaycan dilində tərcümə.',
    },
  },
  {
    keys: ['fussilet', 'fussilət'],
    meta: {
      surahNumber: 41,
      canonical: 'Fussilət surəsi',
      arabic: 'سورة فصلت',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Aydınlaşdırılmış Quran ayələri, mələklərin möminlərə müjdəsi və səbir.',
      seoFocus: 'Fussilət surəsi tilavəti, ərəbcə oxunuş və Azərbaycan tərcüməsi.',
    },
  },
  {
    keys: ['qaf'],
    meta: {
      surahNumber: 50,
      canonical: 'Qaf surəsi',
      arabic: 'سورة ق',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'İnsana şah damarından yaxın olan Rəbbin elmi və diriliş həqiqəti.',
      seoFocus: 'Qaf surəsi tilavəti, Khalid Al-Jalil və seçilmiş qiraətlər, Azərbaycan tərcüməsi.',
    },
  },
  {
    keys: ['zariyat'],
    meta: {
      surahNumber: 51,
      canonical: 'Zariyat surəsi',
      arabic: 'سورة الذاريات',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Təqva sahiblərinin gecə ibadəti, ruzi zəmanəti və yaradılış nişanələri.',
      seoFocus: 'Zariyat surəsi 15-22 ayələr, ərəbcə qiraət və Azərbaycan dilində tərcümə.',
    },
  },
  {
    keys: ['necm', 'nəcm', 'najm'],
    meta: {
      surahNumber: 53,
      canonical: 'Nəcm surəsi',
      arabic: 'سورة النجم',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Vəhyin saflığı, merac nişanələri və insanın yalnız öz əməlinin qarşılığını alması.',
      seoFocus: 'Nəcm surəsi qiraəti, ayə tərcüməsi və Azərbaycan dilində izahlı tilavət.',
    },
  },
  {
    keys: ['qemer', 'qəmər', 'qamar'],
    meta: {
      surahNumber: 54,
      canonical: 'Qəmər surəsi',
      arabic: 'سورة القمر',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Quranın öyüd-nəsihət almaq üçün asanlaşdırıldığını xatırladan qüdrətli ayələr.',
      seoFocus: 'Qəmər surəsi 47-55 ayələr, təsirli qiraət və Azərbaycan dilində tərcümə.',
    },
  },
  {
    keys: ['mulk', 'mülk'],
    meta: {
      surahNumber: 67,
      canonical: 'Mülk, Vaqiə, Yasin və Rəhman',
      arabic: 'سورة الملك',
      category: 'secilmis',
      revelationPlace: 'Məkkə',
      reflection: 'Gündəlik dinləmə və qəlb rahatlığı üçün seçilmiş böyük surələr toplusu.',
      seoFocus: 'Mülk, Vaqiə, Yasin və Rəhman surələrinin birgə tilavəti — Maher Al-Muaiqly.',
    },
  },
  {
    keys: ['rehman', 'rəhman', 'rahman'],
    meta: {
      surahNumber: 55,
      canonical: 'Rəhman surəsi',
      arabic: 'سورة الرحمن',
      category: 'secilmis',
      revelationPlace: 'Mədinə',
      reflection: 'Rəbbin sonsuz nemətlərini xatırladan, qəlbi riqqətə gətirən ahəngdar qiraət.',
      seoFocus: 'Rəhman surəsi qiraəti, ərəbcə tilavət və Azərbaycan dilində tərcümə.',
    },
  },
  {
    keys: ['nebe', 'nəbə', 'naba'],
    meta: {
      surahNumber: 78,
      canonical: 'Nəbə surəsi',
      arabic: 'سورة النبأ',
      category: 'qisa',
      revelationPlace: 'Məkkə',
      reflection: 'Böyük xəbər — axirət günü, yaradılış nişanələri və təqva əhlinin mükafatı.',
      seoFocus: 'Nəbə surəsi qiraəti, Maher Al-Muaiqly tilavəti və Azərbaycan dilində tərcümə.',
    },
  },
  {
    keys: ['maun'],
    meta: {
      surahNumber: 107,
      canonical: 'Maun surəsi',
      arabic: 'سورة الماعون',
      category: 'qisa',
      revelationPlace: 'Məkkə',
      reflection: 'Yetimə qayğı, səmimi ibadət və sosial məsuliyyət barədə yığcam xatırlatma.',
      seoFocus: '107. Maun surəsi, Maher Al-Muaiqly qiraəti və Azərbaycan tərcüməsi.',
    },
  },
  {
    keys: ['kovser', 'kövsər'],
    meta: {
      surahNumber: 108,
      canonical: 'Kövsər surəsi',
      arabic: 'سورة الكوثر',
      category: 'qisa',
      revelationPlace: 'Məkkə',
      reflection: 'Qurani-Kərimin ən qısa surəsi: tükənməz xeyir müjdəsi, namaz və şükür əmri.',
      seoFocus: '108. Kövsər surəsi, Maher Al-Muaiqly qiraəti və Azərbaycan tərcüməsi.',
    },
  },
  {
    keys: ['kafirun'],
    meta: {
      surahNumber: 109,
      canonical: 'Kafirun surəsi',
      arabic: 'سورة الكافرون',
      category: 'qisa',
      revelationPlace: 'Məkkə',
      reflection: 'Tövhid inancında qətiyyət və əqidə sərhədlərinin aydın bəyanı.',
      seoFocus: '109. Kafirun surəsi, Maher Al-Muaiqly qiraəti və Azərbaycan tərcüməsi.',
    },
  },
  {
    keys: ['nesr', 'nəsr', 'nasr'],
    meta: {
      surahNumber: 110,
      canonical: 'Nəsr surəsi',
      arabic: 'سورة النصر',
      category: 'qisa',
      revelationPlace: 'Mədinə',
      reflection: 'Allahın yardımı və fəth anında təvazökarlıqla təsbih və istiğfar etmək dərsi.',
      seoFocus: '110. Nəsr surəsi, Maher Al-Muaiqly qiraəti və Azərbaycan tərcüməsi.',
    },
  },
  {
    keys: ['mesed', 'məsəd', 'masad'],
    meta: {
      surahNumber: 111,
      canonical: 'Məsəd surəsi',
      arabic: 'سورة المسد',
      category: 'qisa',
      revelationPlace: 'Məkkə',
      reflection: 'Haqq dəvətinə düşmənçilik edənlərin aqibəti barədə ibrətli surə.',
      seoFocus: '111. Məsəd surəsi, Maher Al-Muaiqly qiraəti və Azərbaycan tərcüməsi.',
    },
  },
  {
    keys: ['ixlas', 'ikhlas'],
    meta: {
      surahNumber: 112,
      canonical: 'İxlas surəsi',
      arabic: 'سورة الإخلاص',
      category: 'qisa',
      revelationPlace: 'Məkkə',
      reflection: 'Allahın birliyi və bənzərsizliyini bəyan edən tövhid surəsi.',
      seoFocus: '112. İxlas surəsi, Maher Al-Muaiqly qiraəti və Azərbaycan tərcüməsi.',
    },
  },
  {
    keys: ['feleq', 'fələq', 'falaq'],
    meta: {
      surahNumber: 113,
      canonical: 'Fələq surəsi',
      arabic: 'سورة الفلق',
      category: 'qisa',
      revelationPlace: 'Məkkə',
      reflection: 'Sübhün Rəbbinə sığınaraq hər cür şərdən qorunma duası.',
      seoFocus: '113. Fələq surəsi, Maher Al-Muaiqly qiraəti və Azərbaycan tərcüməsi.',
    },
  },
  {
    keys: ['nas'],
    meta: {
      surahNumber: 114,
      canonical: 'Nas surəsi',
      arabic: 'سورة الناس',
      category: 'qisa',
      revelationPlace: 'Məkkə',
      reflection: 'İnsanların Rəbbinə sığınaraq vəsvəsələrdən qorunma surəsi.',
      seoFocus: '114. Nas surəsi, Maher Al-Muaiqly qiraəti və Azərbaycan tərcüməsi.',
    },
  },
  {
    keys: ['vaqia', 'vaqiə', 'waqiah'],
    meta: {
      surahNumber: 56,
      canonical: 'Vaqiə surəsi',
      arabic: 'سورة الواقعة',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Qiyamət hadisəsi, insanların üç zümrəyə bölünməsi və Rəbbin qüdrət dəlilləri.',
      seoFocus: 'Vaqiə surəsi tilavəti və Əlixan Musayevin Azərbaycan dilinə mənaca tərcüməsi.',
    },
  },
  {
    keys: ['fatiha', 'fatihə'],
    meta: {
      surahNumber: 1,
      canonical: 'Fatihə surəsi',
      arabic: 'سورة الفاتحة',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'Quranın açılışı: həmd, rübubiyyət, ibadət və doğru yol (Siratəl-Müstəqim) duası.',
      seoFocus: 'Fatihə surəsi tilavəti və Əlixan Musayevin Azərbaycan dilinə tərcüməsi.',
    },
  },
  {
    keys: ['nisa'],
    meta: {
      surahNumber: 4,
      canonical: 'Nisa surəsi',
      arabic: 'سورة النساء',
      category: 'medeni',
      revelationPlace: 'Mədinə',
      reflection: 'Ailə hüququ, ədalət, yetimlərə qayğı və ictimai məsuliyyət ayələri.',
      seoFocus: 'Nisa surəsi tilavəti və Əlixan Musayevin Azərbaycan dilinə tərcüməsi.',
    },
  },
  {
    keys: ['ali imran', 'imran'],
    meta: {
      surahNumber: 3,
      canonical: 'Ali-İmran surəsi',
      arabic: 'سورة آل عمران',
      category: 'medeni',
      revelationPlace: 'Mədinə',
      reflection: 'İmanda səbat, Allah yolunda birlik və ağıl sahiblərinin təfəkkürü.',
      seoFocus: 'Ali-İmran surəsi tilavəti və Əlixan Musayevin Azərbaycan dilinə tərcüməsi.',
    },
  },
  {
    keys: ['isra'],
    meta: {
      surahNumber: 17,
      canonical: 'İsra surəsi',
      arabic: 'سورة الإسراء',
      category: 'mekke',
      revelationPlace: 'Məkkə',
      reflection: 'İsra möcüzəsi, valideynlərə yaxşılıq və Quranın ən doğru yola yönəltməsi.',
      seoFocus: 'İsra surəsi tilavəti və Əlixan Musayevin Azərbaycan dilinə tərcüməsi.',
    },
  },
  {
    keys: ['nur'],
    meta: {
      surahNumber: 24,
      canonical: 'Nur surəsi',
      arabic: 'سورة النور',
      category: 'medeni',
      revelationPlace: 'Mədinə',
      reflection: 'İffət əxlaqı, İlahi nur məsəli və mömin cəmiyyətin ədəb qaydaları.',
      seoFocus: 'Nur surəsi tilavəti və Əlixan Musayevin Azərbaycan dilinə tərcüməsi.',
    },
  },
  {
    keys: ['duha'],
    meta: {
      surahNumber: 93,
      canonical: 'Duha surəsi',
      arabic: 'سورة الضحى',
      category: 'qisa',
      revelationPlace: 'Məkkə',
      reflection: 'Rəbbin tərk etmədiyi müjdəsi, yetimə şəfqət və nemətləri xatırlamaq.',
      seoFocus: 'Duha surəsi tilavəti və Əlixan Musayevin Azərbaycan dilinə tərcüməsi.',
    },
  },
  {
    keys: ['qadr', 'qədr'],
    meta: {
      surahNumber: 97,
      canonical: 'Qədr surəsi',
      arabic: 'سورة القدر',
      category: 'qisa',
      revelationPlace: 'Məkkə',
      reflection: 'Min aydan xeyirli olan Qədr gecəsinin fəziləti və Quranın nazil olması.',
      seoFocus: 'Qədr surəsi tilavəti və Əlixan Musayevin Azərbaycan dilinə tərcüməsi.',
    },
  },
  {
    keys: ['esr', 'əsr', 'asr'],
    meta: {
      surahNumber: 103,
      canonical: 'Əsr surəsi',
      arabic: 'سورة العصر',
      category: 'qisa',
      revelationPlace: 'Məkkə',
      reflection: 'Zaman şahidliyi: iman, saleh əməl, haqqı və səbri tövsiyə etməklə nicat.',
      seoFocus: 'Əsr surəsi tilavəti və Əlixan Musayevin Azərbaycan dilinə tərcüməsi.',
    },
  },
];

const CATEGORY_LABELS: Record<RecitationCategory, string> = {
  mekke: 'Uzun Tilavət',
  medeni: 'Uzun Tilavət',
  secilmis: 'Seçilmiş Qiraətlər',
  qisa: 'Qısa Surələr',
};

const AZERBAIJANI_MONTHS = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'İyun',
  'İyul',
  'Avqust',
  'Sentyabr',
  'Oktyabr',
  'Noyabr',
  'Dekabr',
];

export function normalizeAzerbaijaniText(input: string): string {
  return input
    .toLowerCase()
    .replace(/ə/g, 'e')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .trim();
}

export function parseDurationToSeconds(duration: string): number {
  const parts = duration
    .trim()
    .split(':')
    .map((p) => Number.parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n) || n < 0)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

export function formatDurationToIso8601(duration: string): string {
  const total = parseDurationToSeconds(duration);
  if (total <= 0) return 'PT1M';
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  let out = 'PT';
  if (hours > 0) out += `${hours}H`;
  if (minutes > 0) out += `${minutes}M`;
  if (seconds > 0 || (hours === 0 && minutes === 0)) out += `${seconds}S`;
  return out;
}

export function parseCompactViewCount(text: string): number {
  const clean = text.replace(/views?/i, '').replace(/,/g, '').trim().toUpperCase();
  const num = Number.parseFloat(clean);
  if (Number.isNaN(num)) return 0;
  if (clean.endsWith('K')) return Math.round(num * 1000);
  if (clean.endsWith('M')) return Math.round(num * 1000000);
  return Math.round(num);
}

const KNOWN_RECITERS = [
  'Maher Al-Muaiqly',
  'Maher al Muaiqly',
  'İslam Subhi',
  'islam Subhi',
  'Khalid al Calil',
  'Yasser al Dossari',
  'Yasser al dossari',
  'Nasser al Qatami',
  'Muhammed Ayyub',
  'Abdurrahman As Sudeis',
  'Waleed Shamsan',
  'Mohamed Obada',
  'Fayiz Səud',
  'Wadi Al Yamani',
  'Hazza Al Balushi',
  'Əhməd Talib',
];

export function classifyVideoTitle(
  rawTitle: string,
  options?: { format?: VideoFormat; duration?: string; published?: string; views?: number }
): Omit<RecitationVideo, 'videoId' | 'thumbnailUrl' | 'youtubeUrl'> {
  const cleanTitle = decodeHtmlEntities(rawTitle).replace(/\s+/g, ' ').trim();
  const normalized = normalizeAzerbaijaniText(cleanTitle);

  const matchedEntry = SURAH_METADATA_MAP.find((entry) =>
    entry.keys.some((key) => normalized.includes(normalizeAzerbaijaniText(key)))
  );

  let reciter = 'Seçilmiş Qari';
  const matchedReciter = KNOWN_RECITERS.find((r) =>
    normalized.includes(normalizeAzerbaijaniText(r))
  );
  if (matchedReciter) {
    reciter = matchedReciter
      .replace(/islam/i, 'İslam')
      .replace(/al Muaiqly/i, 'Al-Muaiqly')
      .replace(/al dossari/i, 'Al-Dosari')
      .replace(/al Qatami/i, 'Al-Qatami')
      .replace(/al Calil/i, 'Al-Calil');
  } else {
    const reciterMatch = cleanTitle.match(/\s[—–-]\s+([^|]+?)(?:\s*\||$)/);
    if (reciterMatch && reciterMatch[1]) {
      const candidate = reciterMatch[1].trim();
      const normalizedCandidate = normalizeAzerbaijaniText(candidate);
      if (
        candidate &&
        !/^\d+(?:\s*[–-]\s*\d+)?$/.test(candidate) &&
        !normalizedCandidate.includes('azerbaycan') &&
        !normalizedCandidate.includes('sure') &&
        !normalizedCandidate.includes('surah') &&
        !normalizedCandidate.includes('quran')
      ) {
        reciter = candidate;
      }
    }
  }

  const rangeMatch = cleanTitle.match(/(\d+)\s*[–-]\s*(\d+)/);
  let ayahStart: number | undefined;
  let ayahEnd: number | undefined;
  if (rangeMatch) {
    ayahStart = Number.parseInt(rangeMatch[1], 10);
    ayahEnd = Number.parseInt(rangeMatch[2], 10);
  } else if (matchedEntry?.defaultAyah) {
    ayahStart = matchedEntry.defaultAyah[0];
    ayahEnd = matchedEntry.defaultAyah[1];
  }

  const ayahRange = ayahStart && ayahEnd
    ? ayahStart === ayahEnd
      ? `${ayahStart}-ci ayə`
      : `${ayahStart}–${ayahEnd}. ayələr`
    : 'Tam surə';

  const surahNumber = matchedEntry ? matchedEntry.meta.surahNumber : 1;
  const surahName = matchedEntry ? matchedEntry.meta.canonical : cleanTitle.split('|')[0].trim();
  const category: RecitationCategory = matchedEntry ? matchedEntry.meta.category : 'secilmis';
  const arabicName = matchedEntry ? matchedEntry.meta.arabic : 'سورة الفاتحة';
  const revelationPlace = matchedEntry ? matchedEntry.meta.revelationPlace : 'Məkkə';
  const reflection = matchedEntry
    ? matchedEntry.meta.reflection
    : 'Ərəbcə tilavət və Əlixan Musayevin Azərbaycan dilinə mənaca tərcüməsi.';

  const format: VideoFormat = options?.format ?? 'long';
  const duration = options?.duration ?? (format === 'short' ? '0:55' : '10:00');
  const durationSeconds = parseDurationToSeconds(duration);

  const displayTitle = rangeMatch
    ? `${surahName}, ${rangeMatch[1]}–${rangeMatch[2]}`
    : matchedEntry && reciter !== 'Seçilmiş Qari'
      ? `${surahName} — ${reciter}`
      : cleanTitle.split('|')[0].trim();

  const seoDescription = matchedEntry
    ? `${displayTitle} (${reciter}). ${matchedEntry.meta.seoFocus} ${revelationPlace} dövründə nazil olan bu surə Quran Qiraeti kanalında ərəbcə tilavət və Əlixan Musayevin Azərbaycan dilinə mənaca tərcüməsi ilə təqdim olunur.`
    : `${displayTitle} — Quran Qiraeti kanalında ərəbcə tilavət və Əlixan Musayevin Azərbaycan dilinə mənaca tərcüməsi.`;

  const seoKeywords = [
    surahName,
    reciter,
    `${revelationPlace} surəsi`,
    'Əlixan Musayev tərcüməsi',
    format === 'short' ? 'Quran Shorts' : 'Uzun Quran tilavəti',
  ];

  return {
    format,
    rawTitle: cleanTitle,
    title: displayTitle,
    surahNumber,
    surahName,
    arabicName,
    ayahRange,
    ayahStart,
    ayahEnd,
    reciter,
    category,
    categoryLabel: CATEGORY_LABELS[category],
    revelationPlace,
    duration,
    durationSeconds,
    published: options?.published ?? new Date().toISOString(),
    views: options?.views ?? 0,
    reflection,
    seoDescription,
    seoKeywords,
  };
}

export function buildRecitationVideo(params: {
  videoId: string;
  rawTitle: string;
  format: VideoFormat;
  duration: string;
  published: string;
  publishedLabel?: string;
  views: number;
}): RecitationVideo {
  const meta = classifyVideoTitle(params.rawTitle, {
    format: params.format,
    duration: params.duration,
    published: params.published,
    views: params.views,
  });

  return {
    videoId: params.videoId,
    thumbnailUrl: `https://i.ytimg.com/vi/${params.videoId}/hqdefault.jpg`,
    youtubeUrl:
      params.format === 'short'
        ? `https://www.youtube.com/shorts/${params.videoId}`
        : `https://www.youtube.com/watch?v=${params.videoId}`,
    publishedLabel: params.publishedLabel,
    ...meta,
  };
}

export function parseQuranEncSurah(
  surahNumber: number,
  payload: { result?: Array<{ aya?: string; arabic_text?: string; translation?: string; footnotes?: string }> }
): SurahTranslationPayload {
  const rows = Array.isArray(payload.result) ? payload.result : [];
  return {
    surahNumber,
    translatorName: 'Əlixan Musayev',
    editionVersion: '1.0.4',
    ayahs: rows.map((row) => ({
      surahNumber,
      ayahNumber: Number.parseInt(String(row.aya ?? '0'), 10) || 0,
      arabicText: String(row.arabic_text ?? '').trim(),
      translation: String(row.translation ?? '').trim(),
      footnotes: String(row.footnotes ?? '').trim(),
    })),
  };
}

export interface SurahOption {
  surahNumber: number;
  surahName: string;
  arabicName: string;
}

export function getMentionedSurahs(rawTitle: string, fallbackSurahNumber: number): SurahOption[] {
  const normalized = normalizeAzerbaijaniText(decodeHtmlEntities(rawTitle));
  const seen = new Set<number>();
  const matches: SurahOption[] = [];

  for (const entry of SURAH_METADATA_MAP) {
    if (seen.has(entry.meta.surahNumber)) continue;
    if (entry.keys.some((key) => normalized.includes(normalizeAzerbaijaniText(key)))) {
      seen.add(entry.meta.surahNumber);
      matches.push({
        surahNumber: entry.meta.surahNumber,
        surahName: entry.meta.surahNumber === 67 ? 'Mülk surəsi' : entry.meta.canonical,
        arabicName: entry.meta.arabic,
      });
    }
  }

  if (matches.length === 0) {
    const fallbackMeta = SURAH_METADATA_MAP.find((e) => e.meta.surahNumber === fallbackSurahNumber)?.meta;
    return [
      {
        surahNumber: fallbackSurahNumber,
        surahName: fallbackMeta?.canonical ?? 'Fatihə surəsi',
        arabicName: fallbackMeta?.arabic ?? 'سورة الفاتحة',
      },
    ];
  }

  return matches;
}

export function filterSurahAyahs(
  ayahs: AyahTranslation[],
  options: {
    mode: 'excerpt' | 'full';
    ayahStart?: number;
    ayahEnd?: number;
    query: string;
  }
): AyahTranslation[] {
  const rawQuery = options.query.trim();
  if (rawQuery) {
    const normalizedQuery = normalizeAzerbaijaniText(rawQuery);
    const colonParts = rawQuery.match(/^\d+:(\d+)$/);
    const ayahNumberTarget = colonParts
      ? Number.parseInt(colonParts[1], 10)
      : /^\d+$/.test(rawQuery)
        ? Number.parseInt(rawQuery, 10)
        : null;

    return ayahs.filter((ayah) => {
      if (ayahNumberTarget !== null && ayah.ayahNumber === ayahNumberTarget) {
        return true;
      }
      if (ayah.arabicText.includes(rawQuery)) {
        return true;
      }
      return normalizeAzerbaijaniText(ayah.translation).includes(normalizedQuery);
    });
  }

  if (options.mode === 'excerpt' && options.ayahStart && options.ayahEnd) {
    const start = Math.min(options.ayahStart, options.ayahEnd);
    const end = Math.max(options.ayahStart, options.ayahEnd);
    const subset = ayahs.filter((a) => a.ayahNumber >= start && a.ayahNumber <= end);
    if (subset.length > 0) return subset;
  }

  return ayahs;
}

export function parseYouTubeVideosPage(html: string): RecitationVideo[] {
  const dataStr = html.match(/var ytInitialData = (\{.*?\});<\/script>/s)?.[1];
  if (!dataStr) return [];
  try {
    const data = JSON.parse(dataStr);
    const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
    const activeTab = tabs.find((t: { tabRenderer?: { selected?: boolean } }) => t.tabRenderer?.selected)?.tabRenderer;
    const contents = activeTab?.content?.richGridRenderer?.contents || [];
    const videos: RecitationVideo[] = [];

    for (const item of contents) {
      const m = item?.richItemRenderer?.content?.lockupViewModel;
      if (!m?.contentId) continue;

      const videoId: string = m.contentId;
      const rawTitle: string = m.metadata?.lockupMetadataViewModel?.title?.content ?? '';
      const duration: string =
        m.contentImage?.thumbnailViewModel?.overlays?.[0]?.thumbnailBottomOverlayViewModel
          ?.badges?.[0]?.thumbnailBadgeViewModel?.text ?? '';
      const rows =
        m.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
      const parts: string[] = rows.flatMap(
        (r: { metadataParts?: Array<{ text?: { content?: string } }> }) =>
          r.metadataParts?.map((p) => p.text?.content ?? '') || []
      );
      const views = parseCompactViewCount(parts[0] ?? '0');
      const publishedLabel = parts[1] ?? '';

      const seconds = parseDurationToSeconds(duration);
      if (!rawTitle || seconds < 120) continue;

      videos.push(
        buildRecitationVideo({
          videoId,
          rawTitle,
          format: 'long',
          duration,
          published: new Date().toISOString(),
          publishedLabel,
          views,
        })
      );
    }
    return videos;
  } catch {
    return [];
  }
}

interface YouTubeGridItem {
  richItemRenderer?: {
    content?: {
      shortsLockupViewModel?: {
        onTap?: { innertubeCommand?: { reelWatchEndpoint?: { videoId?: string } } };
        overlayMetadata?: {
          primaryText?: { content?: string };
          secondaryText?: { content?: string };
        };
      };
    };
  };
  continuationItemRenderer?: {
    continuationEndpoint?: {
      continuationCommand?: {
        token?: string;
      };
    };
  };
}

function extractShortsFromItems(contents: YouTubeGridItem[]): {
  shorts: RecitationVideo[];
  continuationToken?: string;
} {
  const shorts: RecitationVideo[] = [];
  let continuationToken: string | undefined;

  for (const item of contents) {
    const token = item?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
    if (token) {
      continuationToken = token;
      continue;
    }

    const s = item?.richItemRenderer?.content?.shortsLockupViewModel;
    if (!s) continue;
    const videoId: string | undefined = s.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId;
    const rawTitle: string = s.overlayMetadata?.primaryText?.content ?? '';
    const viewsText: string = s.overlayMetadata?.secondaryText?.content ?? '0';
    if (!videoId || !rawTitle) continue;

    shorts.push(
      buildRecitationVideo({
        videoId,
        rawTitle,
        format: 'short',
        duration: '0:55',
        published: new Date().toISOString(),
        publishedLabel: 'Shorts',
        views: parseCompactViewCount(viewsText),
      })
    );
  }

  return { shorts, continuationToken };
}

export function extractYouTubeShortsInitial(html: string): {
  shorts: RecitationVideo[];
  continuationToken?: string;
  apiKey?: string;
  clientVersion?: string;
} {
  const dataStr = html.match(/var ytInitialData = (\{.*?\});<\/script>/s)?.[1];
  if (!dataStr) return { shorts: [] };
  const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  const clientVersion = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1];

  try {
    const data = JSON.parse(dataStr);
    const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
    const activeTab = tabs.find(
      (t: { tabRenderer?: { selected?: boolean } }) => t.tabRenderer?.selected
    )?.tabRenderer;
    const contents: YouTubeGridItem[] = activeTab?.content?.richGridRenderer?.contents || [];
    const { shorts, continuationToken } = extractShortsFromItems(contents);
    return { shorts, continuationToken, apiKey, clientVersion };
  } catch {
    return { shorts: [] };
  }
}

export function parseYouTubeShortsContinuation(payload: {
  onResponseReceivedActions?: Array<{
    appendContinuationItemsAction?: {
      continuationItems?: YouTubeGridItem[];
    };
  }>;
}): {
  shorts: RecitationVideo[];
  continuationToken?: string;
} {
  const actions = payload?.onResponseReceivedActions || [];
  const items: YouTubeGridItem[] = actions.flatMap(
    (action) => action.appendContinuationItemsAction?.continuationItems || []
  );
  return extractShortsFromItems(items);
}

export function parseYouTubeShortsPage(html: string): RecitationVideo[] {
  return extractYouTubeShortsInitial(html).shorts;
}

export function filterRecitations(
  videos: RecitationVideo[],
  options: {
    tab: FilterTab;
    query: string;
    savedIds: string[];
  }
): RecitationVideo[] {
  const q = normalizeAzerbaijaniText(options.query);

  return videos.filter((video) => {
    if (options.tab === 'saved') {
      if (!options.savedIds.includes(video.videoId)) return false;
    } else if (options.tab !== 'all') {
      if (video.category !== options.tab) return false;
    }

    if (!q) return true;

    const haystack = normalizeAzerbaijaniText(
      `${video.title} ${video.rawTitle} ${video.surahName} ${video.reciter} ${video.categoryLabel} ${video.reflection} ${video.seoDescription} ${video.seoKeywords.join(' ')}`
    );
    return haystack.includes(q);
  });
}

export function formatAzerbaijaniDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Yeni';
  const day = date.getUTCDate();
  const month = AZERBAIJANI_MONTHS[date.getUTCMonth()] ?? '';
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export function formatViewCount(views: number): string {
  if (!Number.isFinite(views) || views < 0) return '0 baxış';
  const formatted = Math.floor(views)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} baxış`;
}

export function buildVideoJsonLd(video: RecitationVideo, siteOrigin: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.seoDescription,
    thumbnailUrl: [video.thumbnailUrl],
    uploadDate: video.published,
    duration: formatDurationToIso8601(video.duration),
    contentUrl: video.youtubeUrl,
    embedUrl: `https://www.youtube-nocookie.com/embed/${video.videoId}`,
    inLanguage: ['ar', 'az'],
    keywords: video.seoKeywords.join(', '),
    url: `${siteOrigin}/video/${video.videoId}`,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: { '@type': 'WatchAction' },
      userInteractionCount: video.views,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Quran Qiraeti',
      url: 'https://www.youtube.com/@quranqiraeti',
    },
  };
}

export function validateSurahRequest(input: SurahRequestInput): ValidationResult {
  const errors: Partial<Record<keyof SurahRequestInput, string>> = {};

  if (!input.surahName.trim() || input.surahName.trim().length < 2) {
    errors.surahName = 'Zəhmət olmasa surə və ya ayə adını daxil edin.';
  }

  if (input.email.trim()) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(input.email.trim())) {
      errors.email = 'Düzgün e-poçt ünvanı daxil edin (və ya boş buraxın).';
    }
  }

  if (input.note.trim().length > 400) {
    errors.note = 'Qeyd maksimum 400 simvol ola bilər.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
