export type AzkarCategory = 'seher' | 'axsam' | 'namaz' | 'umumi';

export interface AzkarItem {
  id: string;
  category: AzkarCategory;
  categories?: AzkarCategory[];
  timeLabel?: string;
  title: string;
  arabicText: string;
  translation: string;
  targetCount: number;
  countNote?: string;
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

export function getAzkarByCategory(category: 'all' | AzkarCategory): AzkarItem[] {
  if (category === 'all') return DAILY_AZKAR;
  return DAILY_AZKAR.filter(
    (item) => item.category === category || Boolean(item.categories?.includes(category))
  );
}

export const DAILY_AZKAR: AzkarItem[] = [
  // 1. Ayətül-Kürsi (Müsəlman Qalası, #75)
  {
    id: 'ayetul-kursi-zikr',
    category: 'seher',
    categories: ['seher', 'axsam'],
    timeLabel: 'Səhər və axşam',
    title: 'Ayətül-Kürsi (Bəqərə surəsi, 255)',
    arabicText:
      'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ ۝ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    translation:
      'Lənətlənmiş şeytandan Allaha sığınıram. Allah — Ondan başqa haqq məbud yoxdur, əbədi Yaşayandır, bütün yaratdıqlarının Qəyyumudur. Onu nə mürgü, nə də yuxu tutar. Göylərdə və yerdə nə varsa, Ona məxsusdur. Onun izni olmadan Onun yanında kim şəfaət edə bilər? O, insanların önündə olanı da, arxasında olanı da bilir. Onlar Onun elmindən Onun istədiyindən başqa heç bir şey qavraya bilməzlər. Onun Kürsüsü göyləri və yeri əhatə etmişdir. Bunları qoruyub saxlamaq Ona ağır gəlməz. O, Ucadır, Əzəmətlidir.',
    targetCount: 1,
    countNote: '1 dəfə',
    source: 'Müsəlman Qalası (#75) · Hakim (1/562)',
    virtue: 'Səhər oxuyan axşama kimi, axşam oxuyan isə səhərə kimi cinlərin şərindən qorunar.',
  },

  // 2. İxlas, Fələq və Nas surələri (Müsəlman Qalası, #76)
  {
    id: 'muavvizat-3-qul',
    category: 'seher',
    categories: ['seher', 'axsam'],
    timeLabel: 'Səhər və axşam',
    title: 'İxlas, Fələq və Nas Surələri',
    arabicText:
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ ۝ بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِنْ شَرِّ مَا خَلَقَ ۝ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ ۝ بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ',
    translation:
      'Mərhəmətli və Rəhmli Allahın adı ilə! De: "O Allah Təkdir! Allah Möhtac deyildir. O, nə doğmuş, nə doğulmuşdur! Onun heç bir tayı-bərabəri yoxdur!" — De: "Sığınıram sübhün Rəbbinə! Yaratdıqlarının şərindən, zülmətə bürünməkdə olan gecənin şərindən, düyünlərə üfürən cadugərlərin şərindən və həsəd apardığı zaman həsədçinin şərindən!" — De: "Sığınıram insanların Rəbbinə, insanların Hökmdarına, insanların Məbuduna! Vəsvəsə verən, geri çəkilən şeytanın şərindən — hansı ki, insanların kökslərinə vəsvəsə salır — istər cinlərdən olsun, istər insanlardan!"',
    targetCount: 3,
    countNote: '3 dəfə (hər surə 3 dəfə)',
    source: 'Müsəlman Qalası (#76) · Əbu Davud (4/322), Tirmizi (5/567)',
    virtue: 'Səhər və axşam bu üç surəni üç dəfə oxumaq insanı hər bir şərə qarşı qoruyar və ona kifayət edər.',
  },

  // 3. Əsbəhnə və əsbəhəl-mulku lilləh — Səhər (Müsəlman Qalası, #77)
  {
    id: 'seher-baslangic',
    category: 'seher',
    timeLabel: 'Səhər zikri',
    title: 'Səhərə Çıxarkən Həmd, Xeyir İstəyi və Sığınma',
    arabicText:
      'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
    translation:
      'Səhərə çıxdıq, mülk də Allaha məxsus olaraq səhərə çıxdı. Allaha həmd olsun! Tək olan Allahdan başqa haqq məbud yoxdur, Onun şəriki yoxdur. Mülk Onundur, həmd Onundur və O, hər şeyə qadirdir. Ey Rəbbim! Səndən bu günün və bundan sonrakı günlərin xeyrini diləyirəm. Bu günün və bundan sonrakı günlərin şərindən Sənə sığınıram. Ey Rəbbim! Tənbəllikdən və qocalığın düşgünlüyündən Sənə sığınıram. Ey Rəbbim! Cəhənnəm əzabından və qəbir əzabından Sənə sığınıram!',
    targetCount: 1,
    countNote: '1 dəfə',
    source: 'Müsəlman Qalası (#77) · Səhih Müslim (4/2088)',
    virtue: 'Peyğəmbərimizin (s.a.s.) hər səhər oxuduğu əsas səhər zikridir.',
  },

  // 3b. Əmsəynə və əmsəl-mulku lilləh — Axşam (Müsəlman Qalası, #77)
  {
    id: 'axsam-baslangic',
    category: 'axsam',
    timeLabel: 'Axşam zikri',
    title: 'Axşama Çıxarkən Həmd, Xeyir İstəyi və Sığınma',
    arabicText:
      'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
    translation:
      'Axşama çıxdıq, mülk də Allaha məxsus olaraq axşama çıxdı. Allaha həmd olsun! Tək olan Allahdan başqa haqq məbud yoxdur, Onun şəriki yoxdur. Mülk Onundur, həmd Onundur və O, hər şeyə qadirdir. Ey Rəbbim! Səndən bu gecənin və bundan sonrakı gecələrin xeyrini diləyirəm. Bu gecənin və bundan sonrakı gecələrin şərindən Sənə sığınıram. Ey Rəbbim! Tənbəllikdən və qocalığın düşgünlüyündən Sənə sığınıram. Ey Rəbbim! Cəhənnəm əzabından və qəbir əzabından Sənə sığınıram!',
    targetCount: 1,
    countNote: '1 dəfə',
    source: 'Müsəlman Qalası (#77) · Səhih Müslim (4/2088)',
    virtue: 'Peyğəmbərimizin (s.a.s.) hər axşam oxuduğu əsas axşam zikridir.',
  },

  // 4a. Allahummə bikə əsbəhnə — Səhər (Müsəlman Qalası, #78)
  {
    id: 'seher-bike-esbehne',
    category: 'seher',
    timeLabel: 'Səhər zikri',
    title: 'Səhər — Allahın İzni ilə Diriliş və Dönüş Zikri',
    arabicText:
      'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',
    translation:
      'Allahım! Sənin köməyinlə səhərə çıxdıq, Sənin köməyinlə axşama çıxdıq, Sənin əmrinlə yaşayırıq, Sənin əmrinlə ölürük və qayıdış da yalnız Sənədir!',
    targetCount: 1,
    countNote: '1 dəfə',
    source: 'Müsəlman Qalası (#78) · Tirmizi (5/466)',
    virtue: 'Həyat və ölümün yalnız Allahın əlində olduğunu təsdiqləyən səhər zikridir.',
  },

  // 4b. Allahummə bikə əmsəynə — Axşam (Müsəlman Qalası, #78)
  {
    id: 'axsam-bike-emseyne',
    category: 'axsam',
    timeLabel: 'Axşam zikri',
    title: 'Axşam — Allahın İzni ilə Qayıdış Zikri',
    arabicText:
      'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ',
    translation:
      'Allahım! Sənin köməyinlə axşama çıxdıq, Sənin köməyinlə səhərə çıxdıq, Sənin əmrinlə yaşayırıq, Sənin əmrinlə ölürük və dönüş də yalnız Sənədir!',
    targetCount: 1,
    countNote: '1 dəfə',
    source: 'Müsəlman Qalası (#78) · Tirmizi (5/466)',
    virtue: 'Axşam vaxtı Allaha təslimiyyəti və dönüşü xatırladan mübarək zikrdir.',
  },

  // 5. Seyyidül-İstiğfar (Müsəlman Qalası, #79)
  {
    id: 'sayyidul-istighfar',
    category: 'seher',
    categories: ['seher', 'axsam'],
    timeLabel: 'Səhər və axşam',
    title: 'Seyyidül-İstiğfar (İstiğfarların Ağası)',
    arabicText:
      'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    translation:
      'Allahım! Sən mənim Rəbbimsən, Səndən başqa haqq məbud yoxdur. Məni Sən yaratdın və mən Sənin qulunam. Gücüm çatdığı qədər Sənin əhd-peymanına və vədinə sadiqəm. Etdiyim pis əməllərin şərindən Sənə sığınıram. Mənə verdiyin nemətləri etiraf edirəm və günahlarımı da boynuma alıram. Məni bağışla; şübhəsiz ki, günahları Səndən başqa bağışlayan yoxdur.',
    targetCount: 1,
    countNote: '1 dəfə',
    source: 'Müsəlman Qalası (#79) · Səhih əl-Buxari (7/150)',
    virtue:
      'Yəqinliklə gündüz oxuyub axşamdan əvvəl və ya axşam oxuyub səhərdən əvvəl vəfat edən Cənnət əhlindən olar.',
  },

  // 6a. Şahidlik Zikri — Səhər (Müsəlman Qalası, #80)
  {
    id: 'seher-ushhiduke',
    category: 'seher',
    timeLabel: 'Səhər zikri',
    title: 'Səhər — Allahı, Ərşin Daşıyıcılarını və Mələkləri Şahid Tutmaq',
    arabicText:
      'اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَٰهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ',
    translation:
      'Allahım! Səhərə çıxdım və Səni, Ərşini daşıyanları, mələklərini və bütün yaratdıqlarını şahid tuturam ki, Sən Özündən başqa haqq məbud olmayan Tək Allahsan, Sənin şərikin yoxdur və Muhəmməd (s.a.s.) Sənin qulun və elçindir.',
    targetCount: 4,
    countNote: '4 dəfə',
    source: 'Müsəlman Qalası (#80) · Əbu Davud (4/317)',
    virtue: 'Kim bu zikri səhər və ya axşam dörd dəfə oxuyarsa, Allah onu Cəhənnəm odundan azad edər.',
  },

  // 6b. Şahidlik Zikri — Axşam (Müsəlman Qalası, #80)
  {
    id: 'axsam-ushhiduke',
    category: 'axsam',
    timeLabel: 'Axşam zikri',
    title: 'Axşam — Allahı, Ərşin Daşıyıcılarını və Mələkləri Şahid Tutmaq',
    arabicText:
      'اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَٰهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ',
    translation:
      'Allahım! Axşama çıxdım və Səni, Ərşini daşıyanları, mələklərini və bütün yaratdıqlarını şahid tuturam ki, Sən Özündən başqa haqq məbud olmayan Tək Allahsan, Sənin şərikin yoxdur və Muhəmməd (s.a.s.) Sənin qulun və elçindir.',
    targetCount: 4,
    countNote: '4 dəfə',
    source: 'Müsəlman Qalası (#80) · Əbu Davud (4/317)',
    virtue: 'Kim bu zikri səhər və ya axşam dörd dəfə oxuyarsa, Allah onu Cəhənnəm odundan azad edər.',
  },

  // 7a. Nemətə Şükür — Səhər (Müsəlman Qalası, #81)
  {
    id: 'seher-nime-shukur',
    category: 'seher',
    timeLabel: 'Səhər zikri',
    title: 'Səhər — Nemətlərin Yalnız Allahdan Olduğuna Şükür Zikri',
    arabicText:
      'اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ',
    translation:
      'Allahım! Bu səhər mənə və ya yaratdıqlarından hər hansı birinə nəsib olan hər bir nemət yalnız Səndəndir, Sənin şərikin yoxdur. Həmd də Sənədir, şükür də Sənədir!',
    targetCount: 1,
    countNote: '1 dəfə',
    source: 'Müsəlman Qalası (#81) · Əbu Davud (4/318)',
    virtue: 'Kim bu duanı səhər oxuyarsa, o günün şükrünü yerinə yetirmiş olar.',
  },

  // 7b. Nemətə Şükür — Axşam (Müsəlman Qalası, #81)
  {
    id: 'axsam-nime-shukur',
    category: 'axsam',
    timeLabel: 'Axşam zikri',
    title: 'Axşam — Nemətlərin Yalnız Allahdan Olduğuna Şükür Zikri',
    arabicText:
      'اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ',
    translation:
      'Allahım! Bu axşam mənə və ya yaratdıqlarından hər hansı birinə nəsib olan hər bir nemət yalnız Səndəndir, Sənin şərikin yoxdur. Həmd də Sənədir, şükür də Sənədir!',
    targetCount: 1,
    countNote: '1 dəfə',
    source: 'Müsəlman Qalası (#81) · Əbu Davud (4/318)',
    virtue: 'Kim bu duanı axşam oxuyarsa, o gecənin şükrünü yerinə yetirmiş olar.',
  },

  // 8. Bədən, Qulaq və Göz Sağlamlığı (Müsəlman Qalası, #82)
  {
    id: 'afini-fi-bedeni',
    category: 'seher',
    categories: ['seher', 'axsam'],
    timeLabel: 'Səhər və axşam',
    title: 'Bədən, Eşitmə və Görmə Sağlamlığı İstəyi',
    arabicText:
      'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَٰهَ إِلَّا أَنْتَ، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَٰهَ إِلَّا أَنْتَ',
    translation:
      'Allahım! Bədənimə sağlamlıq ver! Allahım! Qulağıma sağlamlıq ver! Allahım! Gözümə sağlamlıq ver! Səndən başqa haqq məbud yoxdur. Allahım! Küfrdən və yoxsulluqdan Sənə sığınıram. Qəbir əzabından Sənə sığınıram. Səndən başqa haqq məbud yoxdur!',
    targetCount: 3,
    countNote: '3 dəfə',
    source: 'Müsəlman Qalası (#82) · Əbu Davud (4/324), Əhməd (5/42)',
    virtue: 'Səhər və axşam 3 dəfə oxunaraq həm bədən afiyəti, həm də qəbir əzabından qorunma dilənir.',
  },

  // 9. Təvəkkül Zikri (Müsəlman Qalası, #83)
  {
    id: 'hasbiyallahu',
    category: 'seher',
    categories: ['seher', 'axsam'],
    timeLabel: 'Səhər və axşam',
    title: 'Dünya və Axirət Qayğılarına Qarşı Təvəkkül Zikri',
    arabicText:
      'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    translation:
      'Mənə Allah yetər! Ondan başqa haqq məbud yoxdur. Mən yalnız Ona təvəkkül etdim. O, əzəmətli Ərşin Rəbbidir!',
    targetCount: 7,
    countNote: '7 dəfə',
    source: 'Müsəlman Qalası (#83) · Əbu Davud (4/321)',
    virtue: 'Kim bunu səhər və axşam yeddi dəfə deyərsə, dünya və axirət ilə bağlı onu narahat edən hər işdə Allah ona kifayət edər.',
  },

  // 10. Dünya və Axirətdə Bağışlanma və Salamatlıq (Müsəlman Qalası, #84)
  {
    id: 'afve-vel-afiyete',
    category: 'seher',
    categories: ['seher', 'axsam'],
    timeLabel: 'Səhər və axşam',
    title: 'Dünya və Axirətdə Əfv, Afiyət və Hifz Duası',
    arabicText:
      'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ، وَمِنْ خَلْفِي، وَعَنْ يَمِينِي، وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي',
    translation:
      'Allahım! Dünya və axirətdə Səndən əfv və salamatlıq (afiyət) diləyirəm. Allahım! Dinimdə, dünyamda, ailəmdə və malımda Səndən əfv və salamatlıq diləyirəm. Allahım! Eyiblərimi ört və qorxularımdan məni əmin-amanlıqda et. Allahım! Məni önümdən, arxamdan, sağımdan, solumdan və yuxarımdan qoru; alt tərəfdən qəfil fəlakətə düçar olmaqdan da Sənin əzəmətinə sığınıram!',
    targetCount: 1,
    countNote: '1 dəfə',
    source: 'Müsəlman Qalası (#84) · Əbu Davud, İbn Macə (2/332)',
    virtue: 'Peyğəmbərimizin (s.a.s.) səhər və axşam heç vaxt tərk etmədiyi əhatəli qorunma duasıdır.',
  },

  // 11. Qeybi və Aşkarı Bilən Allaha Sığınma (Müsəlman Qalası, #85)
  {
    id: 'alimel-gaybi',
    category: 'seher',
    categories: ['seher', 'axsam'],
    timeLabel: 'Səhər və axşam',
    title: 'Nəfsin və Şeytanın Şərindən Sığınma Duası',
    arabicText:
      'اللَّهُمَّ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي، وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ، وَأَنْ أَقْتَرِفَ عَلَىٰ نَفْسِي سُوءًا أَوْ أَجُرَّهُ إِلَىٰ مُسْلِمٍ',
    translation:
      'Ey qeybi və aşkarı Bilən, göyləri və yeri Yaradan Allahım! Ey hər şeyin Rəbbi və Sahibi! Şəhadət verirəm ki, Səndən başqa haqq məbud yoxdur. Nəfsimin şərindən, şeytanın şərindən və şirkindən, özümə qarşı pislik etməkdən və ya onu bir müsəlmana yönəltməkdən Sənə sığınıram!',
    targetCount: 1,
    countNote: '1 dəfə',
    source: 'Müsəlman Qalası (#85) · Tirmizi, Əbu Davud (4/317)',
    virtue: 'Səhər, axşam və yatağa uzananda oxunan nəfis qorunma zikridir.',
  },

  // 12. Hər Cür Zərərdən Qorunma (Müsəlman Qalası, #86)
  {
    id: 'seher-qorunma',
    category: 'seher',
    categories: ['seher', 'axsam'],
    timeLabel: 'Səhər və axşam',
    title: 'Hər Cür Bəla və Qəfil Zərərdən Qorunma Zikri',
    arabicText:
      'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    translation:
      'Adı ilə yerdə və göydə heç bir şeyin zərər verə bilməyəcəyi Allahın adı ilə! O, Eşidəndir, Biləndir.',
    targetCount: 3,
    countNote: '3 dəfə',
    source: 'Müsəlman Qalası (#86) · Əbu Davud (4/323), Tirmizi (5/465)',
    virtue: 'Səhər 3 dəfə oxuyana axşama qədər, axşam 3 dəfə oxuyana səhərə qədər qəfil bəla toxunmaz.',
  },

  // 13. İman və İslamdan Razılıq (Müsəlman Qalası, #87)
  {
    id: 'seher-razi-olmaq',
    category: 'seher',
    categories: ['seher', 'axsam'],
    timeLabel: 'Səhər və axşam',
    title: 'Allahdan, İslamdan və Peyğəmbərdən (s.a.s.) Razılıq Zikri',
    arabicText:
      'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
    translation:
      'Allahın Rəbb, İslamın din, Muhəmmədin (s.a.s.) isə peyğəmbər olmasına razı qaldım.',
    targetCount: 3,
    countNote: '3 dəfə',
    source: 'Müsəlman Qalası (#87) · Əhməd (4/337), Əbu Davud (4/318)',
    virtue: 'Kim bunu səhər və axşam üç dəfə deyərsə, Qiyamət günü Allahın onu razı salması haqq olar.',
  },

  // 14. Ya Həyyu ya Qəyyumu birəhmətikə əstəğis (Müsəlman Qalası, #88)
  {
    id: 'ya-hayyu-ya-qayyum',
    category: 'seher',
    categories: ['seher', 'axsam'],
    timeLabel: 'Səhər və axşam',
    title: 'Bütün İşlərin Islahı Üçün Allahdan Yardım İstəyi',
    arabicText:
      'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَىٰ نَفْسِي طَرْفَةَ عَيْنٍ',
    translation:
      'Ey Əbədi Yaşayan (Həyy), ey hər şeyi Qoruyub İdarə Edən (Qəyyum)! Sənin mərhəmətinlə Səndən imdad diləyirəm. Bütün işlərimi islah et (yoluna qoy) və məni bir göz qırpımı belə öz nəfsimin öhdəsinə buraxma!',
    targetCount: 1,
    countNote: '1 dəfə',
    source: 'Müsəlman Qalası (#88) · Hakim (1/545), Nəsai',
    virtue: 'Qulun acizliyini etiraf edib bütün işlərində Allahın mərhəmətinə sığındığı zikrdir.',
  },

  // 15a. Günün Fəthi, Nuru və Bərəkəti — Səhər (Müsəlman Qalası, #89)
  {
    id: 'seher-feth-nur',
    category: 'seher',
    timeLabel: 'Səhər zikri',
    title: 'Səhər — Günün Fəthi, Nuru, Bərəkəti və Hidayəti İstəyi',
    arabicText:
      'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ رَبِّ الْعَالَمِينَ، اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَٰذَا الْيَوْمِ: فَتْحَهُ، وَنَصْرَهُ، وَنُورَهُ، وَبَرَكَتَهُ، وَهُدَاهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِيهِ وَشَرِّ مَا بَعْدَهُ',
    translation:
      'Səhərə çıxdıq və mülk də aləmlərin Rəbbi Allaha məxsus olaraq səhərə çıxdı. Allahım! Səndən bu günün xeyrini — fəthini, zəfərini, nurunu, bərəkətini və hidayətini diləyirəm. Bu gündə və bundan sonrakı günlərdə olan şərdən Sənə sığınıram!',
    targetCount: 1,
    countNote: '1 dəfə',
    source: 'Müsəlman Qalası (#89) · Əbu Davud (4/322)',
    virtue: 'Günün bərəkət, nur və hidayət içində keçməsi üçün səhərlər oxunur.',
  },

  // 15b. Gecənin Fəthi, Nuru və Bərəkəti — Axşam (Müsəlman Qalası, #89)
  {
    id: 'axsam-feth-nur',
    category: 'axsam',
    timeLabel: 'Axşam zikri',
    title: 'Axşam — Gecənin Fəthi, Nuru, Bərəkəti və Hidayəti İstəyi',
    arabicText:
      'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ رَبِّ الْعَالَمِينَ، اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَٰذِهِ اللَّيْلَةِ: فَتْحَهَا، وَنَصْرَهَا، وَنُورَهَا، وَبَرَكَتَهَا، وَهُدَاهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِيهَا وَشَرِّ مَا بَعْدَهَا',
    translation:
      'Axşama çıxdıq və mülk də aləmlərin Rəbbi Allaha məxsus olaraq axşama çıxdı. Allahım! Səndən bu gecənin xeyrini — fəthini, zəfərini, nurunu, bərəkətini və hidayətini diləyirəm. Bu gecədə və bundan sonrakı gecələrdə olan şərdən Sənə sığınıram!',
    targetCount: 1,
    countNote: '1 dəfə',
    source: 'Müsəlman Qalası (#89) · Əbu Davud (4/322)',
    virtue: 'Gecənin xeyir, nur və əmin-amanlıq içində keçməsi üçün axşamlar oxunur.',
  },

  // 16a. İslam Fitrəti Üzrə — Səhər (Müsəlman Qalası, #90)
  {
    id: 'seher-fitret',
    category: 'seher',
    timeLabel: 'Səhər zikri',
    title: 'Səhər — İslam Fitrəti və İxlas Kəlməsi Üzərə Çıxmaq',
    arabicText:
      'أَصْبَحْنَا عَلَىٰ فِطْرَةِ الْإِسْلَامِ، وَعَلَىٰ كَلِمَةِ الْإِخْلَاصِ، وَعَلَىٰ دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، وَعَلَىٰ مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ',
    translation:
      'İslam fitrəti, ixlas kəlməsi (Lə ilahə illəllah), Peyğəmbərimiz Muhəmmədin (s.a.s.) dini və hənif, müsəlman olan, müşriklərdən olmayan atamız İbrahimin milləti üzərə səhərə çıxdıq!',
    targetCount: 1,
    countNote: '1 dəfə',
    source: 'Müsəlman Qalası (#90) · Əhməd (3/406)',
    virtue: 'Tövhid və fitrət üzərə sabit qalmaq üçün səhərlər oxunur.',
  },

  // 16b. İslam Fitrəti Üzrə — Axşam (Müsəlman Qalası, #90)
  {
    id: 'axsam-fitret',
    category: 'axsam',
    timeLabel: 'Axşam zikri',
    title: 'Axşam — İslam Fitrəti və İxlas Kəlməsi Üzərə Çıxmaq',
    arabicText:
      'أَمْسَيْنَا عَلَىٰ فِطْرَةِ الْإِسْلَامِ، وَعَلَىٰ كَلِمَةِ الْإِخْلَاصِ، وَعَلَىٰ دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، وَعَلَىٰ مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ',
    translation:
      'İslam fitrəti, ixlas kəlməsi (Lə ilahə illəllah), Peyğəmbərimiz Muhəmmədin (s.a.s.) dini və hənif, müsəlman olan, müşriklərdən olmayan atamız İbrahimin milləti üzərə axşama çıxdıq!',
    targetCount: 1,
    countNote: '1 dəfə',
    source: 'Müsəlman Qalası (#90) · Əhməd (3/406)',
    virtue: 'Tövhid və fitrət üzərə sabit qalmaq üçün axşamlar oxunur.',
  },

  // 17. Sübhanəllahi və bihəmdihi — Ədədə xalqihi (Müsəlman Qalası, #93 - Səhər)
  {
    id: 'subhanallahi-adede-xalqihi',
    category: 'seher',
    timeLabel: 'Səhər zikri',
    title: 'Məxluqatın Sayı və Ərşin Ağırlığı Qədər Təsbih və Həmd',
    arabicText:
      'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ: عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ',
    translation:
      'Allah pak və nöqsansızdır! Yaradılmışlarının sayı, Özünün razı qaldığı, Ərşinin ağırlığı və kəlmələrinin tükənməzliyi qədər Ona həmd olsun!',
    targetCount: 3,
    countNote: '3 dəfə (səhər)',
    source: 'Müsəlman Qalası (#93) · Səhih Müslim (4/2090)',
    virtue: 'Sübh namazından sonra üç dəfə oxunması saatlarla zikr etməyə bərabər savab qazandırar.',
  },

  // 18. Faydalı elm, halal ruzi, məqbul əməl (Müsəlman Qalası, #94 - Səhər)
  {
    id: 'seher-elm-ruzi',
    category: 'seher',
    timeLabel: 'Səhər zikri',
    title: 'Faydalı Elm, Halal Ruzi və Məqbul Əməl İstəyi',
    arabicText: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا',
    translation:
      'Allahım! Səndən faydalı elm, təmiz (halal) ruzi və dərgahında qəbul olunan əməl diləyirəm!',
    targetCount: 1,
    countNote: '1 dəfə (səhər)',
    source: 'Müsəlman Qalası (#94) · İbn Macə (925)',
    virtue: 'Peyğəmbərimiz (s.a.s.) hər gün Sübh namazının salamından sonra bu duanı oxuyardı.',
  },

  // 19. Axşam — Allahın tam kəlmələrinə sığınmaq (Müsəlman Qalası, #96 - Axşam)
  {
    id: 'axsam-kelimeler',
    category: 'axsam',
    timeLabel: 'Axşam zikri',
    title: 'Allahın Tam Kəlmələrinə Sığınmaq',
    arabicText: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    translation: 'Yaratdıqlarının şərindən Allahın tam (kamil) kəlmələrinə sığınıram.',
    targetCount: 3,
    countNote: '3 dəfə (axşam)',
    source: 'Müsəlman Qalası (#96) · Səhih Müslim (2709), Əhməd (2/290)',
    virtue: 'Axşamlar 3 dəfə oxuyan həmin gecə zərərvericilərin və şərrin toxunmasından qorunar.',
  },

  // 20. Sübhanəllahi və bihəmdihi (Müsəlman Qalası, #91)
  {
    id: 'subhanallahi-ve-bihamdihi',
    category: 'seher',
    categories: ['seher', 'axsam', 'umumi'],
    timeLabel: 'Səhər və axşam',
    title: 'Sübhanəllahi və Bihəmdihi (Günahların Bağışlanması)',
    arabicText: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    translation: 'Allah pak və nöqsansızdır və Ona həmd olsun!',
    targetCount: 100,
    countNote: '100 dəfə',
    source: 'Müsəlman Qalası (#91) · Səhih Müslim (4/2071)',
    virtue: 'Səhər və axşam yüz dəfə oxuyanın günahları dəniz köpüyü qədər olsa belə bağışlanar; Qiyamət günü ondan daha fəzilətli əməl gətirən olmaz.',
  },

  // 21. Lə ilahə illəllahu vəhdəhu... (Müsəlman Qalası, #92)
  {
    id: 'tahlil-tevhid-zikri',
    category: 'seher',
    categories: ['seher', 'axsam', 'umumi'],
    timeLabel: 'Səhər və axşam',
    title: 'Tövhid Kəlməsi (10 Qul Azad Etmək Savabı)',
    arabicText:
      'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    translation:
      'Tək olan Allahdan başqa haqq məbud yoxdur, Onun şəriki yoxdur. Mülk də Onundur, həmd də Onundur və O, hər şeyə qadirdir.',
    targetCount: 10,
    countNote: '10 dəfə (yaxud səhər 100 dəfə; tənbəllikdə 1 dəfə)',
    source: 'Müsəlman Qalası (#92) · Buxari (4/95), Müslim (4/2071), Əbu Davud (4/319)',
    virtue: 'On dəfə deyənə 100 savab yazılar, 100 günahı silinər və axşama qədər şeytandan qoruyucu olar.',
  },

  // 22. Əstəğfirullahə və ətubu ileyh (Müsəlman Qalası, #95)
  {
    id: 'istighfar-ve-tevbe',
    category: 'seher',
    categories: ['seher', 'axsam', 'umumi'],
    timeLabel: 'Səhər və gün ərzində',
    title: 'İstiğfar və Allaha Tövbə Zikri',
    arabicText: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    translation: 'Allahdan bağışlanma diləyirəm və Ona tövbə edirəm.',
    targetCount: 100,
    countNote: '100 dəfə',
    source: 'Müsəlman Qalası (#95) · Buxari (7/101), Müslim (4/2075)',
    virtue: 'Peyğəmbərimiz (s.a.s.) gündə yetmişdən / yüz dəfədən çox Allahdan bağışlanma diləyərək tövbə edərdi.',
  },

  // 23. Peyğəmbərə (s.a.s.) Salavat (Müsəlman Qalası, #97)
  {
    id: 'seher-axsam-salavat',
    category: 'seher',
    categories: ['seher', 'axsam', 'umumi'],
    timeLabel: 'Səhər və axşam',
    title: 'Peyğəmbərimizə (s.a.s.) Salavat',
    arabicText: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَىٰ نَبِيِّنَا مُحَمَّدٍ',
    translation: 'Allahım! Peyğəmbərimiz Muhəmmədə salavat və salam göndər!',
    targetCount: 10,
    countNote: '10 dəfə',
    source: 'Müsəlman Qalası (#97) · Təbərani',
    virtue: 'Kim səhər və axşam on dəfə salavat gətirərsə, Qiyamət günü Peyğəmbərimizin (s.a.s.) şəfaətinə nail olar.',
  },

  // Namaz sonrası zikrlər
  {
    id: 'namaz-salam-zikri',
    category: 'namaz',
    timeLabel: 'Namaz sonrası',
    title: 'Salamdan Dərhal Sonra Oxunan Zikr',
    arabicText:
      'أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    translation:
      'Allahdan bağışlanma diləyirəm (3 dəfə). Allahım! Sən Səlamsan (əmin-amanlıq mənbəyisən) və əmin-amanlıq yalnız Səndəndir. Ey əzəmət və ikram sahibi, Sən nə qədər uca və bərəkətlisən!',
    targetCount: 1,
    countNote: '1 dəfə (3× Əstəğfirullah + dua)',
    source: 'Müsəlman Qalası (#66) · Səhih Müslim (591)',
    virtue: 'Hər fərz namazından salam verdikdən sonra dərhal oxunur.',
  },
  {
    id: 'namaz-ibadet-duasi',
    category: 'namaz',
    timeLabel: 'Namaz sonrası',
    title: 'Zikr, Şükür və Gözəl İbadət İstəyi',
    arabicText: 'اللَّهُمَّ أَعِنِّي عَلَىٰ ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
    translation:
      'Allahım! Səni zikr etməkdə, Sənə şükür etməkdə və Sənə gözəl şəkildə ibadət etməkdə mənə kömək ol!',
    targetCount: 1,
    countNote: '1 dəfə',
    source: 'Müsəlman Qalası (#74) · Əbu Davud (1522), Nəsai (1303)',
    virtue: 'Peyğəmbərimizin (s.a.s.) hər namazdan sonra tərk etməməyi tövsiyə etdiyi dua.',
  },

  // Gündəlik fəzilət zikrləri
  {
    id: 'subhanallahil-azim-mizan',
    category: 'umumi',
    timeLabel: 'Gündəlik fəzilət',
    title: 'Dildə Yüngül, Tərəzidə Ağır Zikr',
    arabicText: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    translation: 'Allah pak və nöqsansızdır və Ona həmd olsun! Uca Allah pak və nöqsansızdır!',
    targetCount: 33,
    countNote: 'Gündəlik çoxlu zikr',
    source: 'Səhih əl-Buxari (6406), Səhih Müslim (2694)',
    virtue: 'Rəhmana sevimli, dildə yüngül, Mizan tərəzisində isə çox ağır olan iki kəlmədir.',
  },
  {
    id: 'la-hawla',
    category: 'umumi',
    timeLabel: 'Gündəlik fəzilət',
    title: 'Cənnət Xəzinələrindən Biri',
    arabicText: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    translation: 'Güc və qüvvət yalnız Allahın köməyi ilədir.',
    targetCount: 33,
    countNote: 'Gündəlik zikr',
    source: 'Səhih əl-Buxari (4205), Səhih Müslim (2704)',
    virtue: 'Çətinlik anlarında acizliyi etiraf edərək Allahdan güc istəmək üçün oxunur.',
  },
];
