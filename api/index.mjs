// src/server/vercelApp.ts
import express3 from "express";
import fs3 from "node:fs";
import path3 from "node:path";

// src/lib/channel.ts
var SURAH_METADATA_MAP = [
  {
    keys: ["bakara", "b\u0259q\u0259r\u0259", "baqarah", "baqara"],
    meta: {
      surahNumber: 2,
      canonical: "B\u0259q\u0259r\u0259 sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0628\u0642\u0631\u0629",
      category: "medeni",
      revelationPlace: "M\u0259din\u0259",
      reflection: "Qurani-K\u0259rimin \u0259n uzun sur\u0259si: iman \u0259saslar\u0131, Ay\u0259t\xFCl-K\xFCrsi v\u0259 \u0259xlaqi-h\xFCquqi h\xF6kml\u0259r.",
      seoFocus: "B\u0259q\u0259r\u0259 sur\u0259si tam tilav\u0259t, Ay\u0259t\xFCl-K\xFCrsi v\u0259 Az\u0259rbaycan dilind\u0259 m\u0259naca t\u0259rc\xFCm\u0259."
    }
  },
  {
    keys: ["olum sizi haqlayacaq", "harada olursunuzsa olun"],
    defaultAyah: [78, 79],
    meta: {
      surahNumber: 4,
      canonical: "Nisa sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0646\u0633\u0627\u0621",
      category: "medeni",
      revelationPlace: "M\u0259din\u0259",
      reflection: "Harada olursunuzsa olun, \xF6l\xFCm\xFCn insan\u0131 haqlayaca\u011F\u0131 v\u0259 h\u0259r \u015Feyin Allahdan oldu\u011Fu xat\u0131rlad\u0131l\u0131r.",
      seoFocus: "Nisa sur\u0259si 78-ci ay\u0259 qira\u0259ti v\u0259 \u018Flixan Musayevin Az\u0259rbaycan dilin\u0259 t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["araf", "a\u2018raf"],
    meta: {
      surahNumber: 7,
      canonical: "\u018Fraf sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0623\u0639\u0631\u0627\u0641",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "Haqq\u0131n batil \xFCz\u0259rind\u0259 q\u0259l\u0259b\u0259si v\u0259 pey\u011F\u0259mb\u0259rl\u0259rin m\xFCbariz\u0259 tarixi.",
      seoFocus: "\u018Fraf sur\u0259si tilav\u0259ti, \u0259r\u0259bc\u0259 oxunu\u015F v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["yunus"],
    meta: {
      surahNumber: 10,
      canonical: "Yunus sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u064A\u0648\u0646\u0633",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "Allah\u0131n r\u0259hm\u0259ti, Quran\u0131n \u015F\u0259fa v\u0259 hiday\u0259t r\u0259hb\u0259ri olmas\u0131 bar\u0259d\u0259 ay\u0259l\u0259r.",
      seoFocus: "Yunus sur\u0259si q\u0131sa qira\u0259t, \u0259r\u0259bc\u0259 tilav\u0259t v\u0259 Az\u0259rbaycan dilind\u0259 t\u0259rc\xFCm\u0259."
    }
  },
  {
    keys: ["yusuf"],
    meta: {
      surahNumber: 12,
      canonical: "Yusuf sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u064A\u0648\u0633\u0641",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "S\u0259bir, iff\u0259t v\u0259 \u0130lahi t\u0259qdirin \u0259n g\xF6z\u0259l qiss\u0259si olan H\u0259zr\u0259t Yusif pey\u011F\u0259mb\u0259rin hekay\u0259ti.",
      seoFocus: "Yusuf sur\u0259si qira\u0259ti, \u0259r\u0259bc\u0259 tilav\u0259t v\u0259 Az\u0259rbaycan dilind\u0259 t\u0259rc\xFCm\u0259."
    }
  },
  {
    keys: ["ibrahim"],
    meta: {
      surahNumber: 14,
      canonical: "\u0130brahim sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0625\u0628\u0631\u0627\u0647\u064A\u0645",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "\u015E\xFCk\xFCr ed\u0259nl\u0259r\u0259 nem\u0259tin art\u0131r\u0131lmas\u0131 v\u0259 H\u0259zr\u0259t \u0130brahimin s\u0259mimi dualar\u0131.",
      seoFocus: "\u0130brahim sur\u0259si tilav\u0259ti, h\xFCzurlu qira\u0259t v\u0259 Az\u0259rbaycan dilind\u0259 t\u0259rc\xFCm\u0259."
    }
  },
  {
    keys: ["hicr"],
    meta: {
      surahNumber: 15,
      canonical: "Hicr sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u062D\u062C\u0631",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "Quran\u0131n \u0130lahi m\xFChafiz\u0259si v\u0259 s\u0259birli b\u0259nd\u0259l\u0259r\u0259 veril\u0259n m\u0259n\u0259vi t\u0259s\u0259lli.",
      seoFocus: "Hicr sur\u0259si qira\u0259ti, \u0259r\u0259bc\u0259 tilav\u0259t v\u0259 Az\u0259rbaycan dilind\u0259 t\u0259rc\xFCm\u0259."
    }
  },
  {
    keys: ["kehf", "k\u0259hf", "kahf"],
    meta: {
      surahNumber: 18,
      canonical: "K\u0259hf sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0643\u0647\u0641",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "C\xFCm\u0259 g\xFCn\xFCn\xFCn nuru, fitn\u0259l\u0259rd\u0259n qorunma v\u0259 g\u0259ncl\u0259rin iman s\u0259bat\u0131 haqq\u0131nda ay\u0259l\u0259r.",
      seoFocus: "K\u0259hf sur\u0259si tilav\u0259ti, C\xFCm\u0259 oxunu\u015Fu v\u0259 Az\u0259rbaycan dilind\u0259 m\u0259naca t\u0259rc\xFCm\u0259."
    }
  },
  {
    keys: ["meryem", "m\u0259ry\u0259m", "maryam"],
    meta: {
      surahNumber: 19,
      canonical: "M\u0259ry\u0259m sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0645\u0631\u064A\u0645",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "H\u0259zr\u0259t Z\u0259k\u0259riyya, M\u0259ry\u0259m v\u0259 \u0130sa pey\u011F\u0259mb\u0259rl\u0259r haqq\u0131nda m\u0259rh\u0259m\u0259t v\u0259 t\u0259slimiyy\u0259t ay\u0259l\u0259ri.",
      seoFocus: "M\u0259ry\u0259m sur\u0259si tilav\u0259ti, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan dilind\u0259 t\u0259rc\xFCm\u0259."
    }
  },
  {
    keys: ["taha"],
    meta: {
      surahNumber: 20,
      canonical: "Taha sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0637\u0647",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "Quran\u0131n b\u0259db\u0259xtlik \xFC\xE7\xFCn deyil, \xF6y\xFCd v\u0259 q\u0259lb rahatl\u0131\u011F\u0131 \xFC\xE7\xFCn nazil olmas\u0131.",
      seoFocus: "Taha sur\u0259si qira\u0259ti, \u0130slam Subhi tilav\u0259ti v\u0259 Az\u0259rbaycan dilind\u0259 t\u0259rc\xFCm\u0259."
    }
  },
  {
    keys: [
      "muminun",
      "m\xF6minun",
      "mominl\u0259r, h\u0259qiq\u0259t\u0259n",
      "ey r\u0259bbim, bagisla",
      "sur ufuruleceyi",
      "ebes yere yaratmis",
      "neheyat, onlardan birine",
      "qeybi ve askari",
      "haqqi getirdik",
      "duyunub ibret",
      "yer uzunde yaradib",
      "rebbine boyun eymediler"
    ],
    meta: {
      surahNumber: 23,
      canonical: "Muminun sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0645\u0624\u0645\u0646\u0648\u0646",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "H\u0259qiqi m\xF6minl\u0259rin sif\u0259tl\u0259ri, namazda x\xFC\u015Fu v\u0259 nicat yolunu g\xF6st\u0259r\u0259n ay\u0259l\u0259r.",
      seoFocus: "Muminun sur\u0259si tilav\u0259ti, m\xF6minl\u0259rin x\xFCsusiyy\u0259tl\u0259ri v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["qasas", "q\u0259s\u0259s"],
    meta: {
      surahNumber: 28,
      canonical: "Qasas sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0642\u0635\u0635",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "H\u0259zr\u0259t Musa pey\u011F\u0259mb\u0259rin h\u0259yat\u0131, z\xFClm\u0259 qar\u015F\u0131 \u0130lahi \u0259dal\u0259t v\u0259 t\u0259v\u0259kk\xFCl m\xF6vzular\u0131.",
      seoFocus: "Qasas sur\u0259si tilav\u0259ti, Yasser Al-Dosari qira\u0259ti v\u0259 Az\u0259rbaycan dilind\u0259 m\u0259na t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["loqman", "luqman"],
    meta: {
      surahNumber: 31,
      canonical: "Loqman sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0644\u0642\u0645\u0627\u0646",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "H\u0259zr\u0259t Lo\u011Fman\u0131n o\u011Fluna hikm\u0259tli n\u0259sih\u0259tl\u0259ri, valideyn\u0259 h\xF6rm\u0259t v\u0259 t\u0259vaz\xF6karl\u0131q d\u0259rsl\u0259ri.",
      seoFocus: "Loqman sur\u0259si qira\u0259ti, \u0130slam Subhi tilav\u0259ti v\u0259 Az\u0259rbaycan dilind\u0259 n\u0259sih\u0259t ay\u0259l\u0259ri."
    }
  },
  {
    keys: ["doyusde allah mominlere kifayet etdi"],
    defaultAyah: [25, 25],
    meta: {
      surahNumber: 33,
      canonical: "\u018Fhzab sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0623\u062D\u0632\u0627\u0628",
      category: "medeni",
      revelationPlace: "M\u0259din\u0259",
      reflection: "Allah\u0131n m\xF6minl\u0259r\u0259 yard\u0131m\u0131 v\u0259 \u018Fhzab d\xF6y\xFC\u015F\xFCnd\u0259 \u0130lahi d\u0259st\u0259k.",
      seoFocus: "\u018Fhzab sur\u0259si 25-ci ay\u0259 tilav\u0259ti v\u0259 \u018Flixan Musayev t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: [
      "fatir",
      "dirilerle oluler",
      "iki deniz eyni ola bilmez",
      "hec bir gunahkar",
      "kim izzet istese",
      "kafirlerin kufru",
      "oz lutfu ile bizi ebedi",
      "sen ancaq xeberdar",
      "xurma ceyirdeyinin"
    ],
    meta: {
      surahNumber: 35,
      canonical: "Fatir sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0641\u0627\u0637\u0631",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "G\xF6yl\u0259ri v\u0259 yeri yaradan Allah\u0131n m\u0259rh\u0259m\u0259ti, z\xFClm\u0259t il\u0259 nurun f\u0259rqi.",
      seoFocus: "Fatir sur\u0259si tilav\u0259ti, Az\u0259rbaycan dilind\u0259 m\u0259naca t\u0259rc\xFCm\u0259 v\u0259 t\u0259f\u0259kk\xFCr."
    }
  },
  {
    keys: ["yasin", "yaseen"],
    meta: {
      surahNumber: 36,
      canonical: "Yasin sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u064A\u0633",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "Quran\u0131n q\u0259lbi adland\u0131r\u0131lan sur\u0259: risal\u0259t, yarad\u0131l\u0131\u015F d\u0259lill\u0259ri v\u0259 dirili\u015F.",
      seoFocus: "Yasin sur\u0259si tilav\u0259ti, \u0259r\u0259bc\u0259 oxunu\u015F v\u0259 Az\u0259rbaycan dilind\u0259 t\u0259rc\xFCm\u0259."
    }
  },
  {
    keys: ["fussilet", "fussil\u0259t"],
    meta: {
      surahNumber: 41,
      canonical: "Fussil\u0259t sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0641\u0635\u0644\u062A",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "Ayd\u0131nla\u015Fd\u0131r\u0131lm\u0131\u015F Quran ay\u0259l\u0259ri, m\u0259l\u0259kl\u0259rin m\xF6minl\u0259r\u0259 m\xFCjd\u0259si v\u0259 s\u0259bir.",
      seoFocus: "Fussil\u0259t sur\u0259si tilav\u0259ti, \u0259r\u0259bc\u0259 oxunu\u015F v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["qaf"],
    meta: {
      surahNumber: 50,
      canonical: "Qaf sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0642",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "\u0130nsana \u015Fah damar\u0131ndan yax\u0131n olan R\u0259bbin elmi v\u0259 dirili\u015F h\u0259qiq\u0259ti.",
      seoFocus: "Qaf sur\u0259si tilav\u0259ti, Khalid Al-Jalil v\u0259 se\xE7ilmi\u015F qira\u0259tl\u0259r, Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["zariyat"],
    meta: {
      surahNumber: 51,
      canonical: "Zariyat sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0630\u0627\u0631\u064A\u0627\u062A",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "T\u0259qva sahibl\u0259rinin gec\u0259 ibad\u0259ti, ruzi z\u0259man\u0259ti v\u0259 yarad\u0131l\u0131\u015F ni\u015Fan\u0259l\u0259ri.",
      seoFocus: "Zariyat sur\u0259si 15-22 ay\u0259l\u0259r, \u0259r\u0259bc\u0259 qira\u0259t v\u0259 Az\u0259rbaycan dilind\u0259 t\u0259rc\xFCm\u0259."
    }
  },
  {
    keys: ["necm", "n\u0259cm", "najm"],
    meta: {
      surahNumber: 53,
      canonical: "N\u0259cm sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0646\u062C\u0645",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "V\u0259hyin safl\u0131\u011F\u0131, merac ni\u015Fan\u0259l\u0259ri v\u0259 insan\u0131n yaln\u0131z \xF6z \u0259m\u0259linin qar\u015F\u0131l\u0131\u011F\u0131n\u0131 almas\u0131.",
      seoFocus: "N\u0259cm sur\u0259si qira\u0259ti, ay\u0259 t\u0259rc\xFCm\u0259si v\u0259 Az\u0259rbaycan dilind\u0259 izahl\u0131 tilav\u0259t."
    }
  },
  {
    keys: ["qemer", "q\u0259m\u0259r", "qamar"],
    meta: {
      surahNumber: 54,
      canonical: "Q\u0259m\u0259r sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0642\u0645\u0631",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "Quran\u0131n \xF6y\xFCd-n\u0259sih\u0259t almaq \xFC\xE7\xFCn asanla\u015Fd\u0131r\u0131ld\u0131\u011F\u0131n\u0131 xat\u0131rladan q\xFCdr\u0259tli ay\u0259l\u0259r.",
      seoFocus: "Q\u0259m\u0259r sur\u0259si 47-55 ay\u0259l\u0259r, t\u0259sirli qira\u0259t v\u0259 Az\u0259rbaycan dilind\u0259 t\u0259rc\xFCm\u0259."
    }
  },
  {
    keys: ["mulk", "m\xFClk"],
    meta: {
      surahNumber: 67,
      canonical: "M\xFClk, Vaqi\u0259, Yasin v\u0259 R\u0259hman",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0645\u0644\u0643",
      category: "secilmis",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "G\xFCnd\u0259lik dinl\u0259m\u0259 v\u0259 q\u0259lb rahatl\u0131\u011F\u0131 \xFC\xE7\xFCn se\xE7ilmi\u015F b\xF6y\xFCk sur\u0259l\u0259r toplusu.",
      seoFocus: "M\xFClk, Vaqi\u0259, Yasin v\u0259 R\u0259hman sur\u0259l\u0259rinin birg\u0259 tilav\u0259ti \u2014 Maher Al-Muaiqly."
    }
  },
  {
    keys: ["rehman", "r\u0259hman", "rahman"],
    meta: {
      surahNumber: 55,
      canonical: "R\u0259hman sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0631\u062D\u0645\u0646",
      category: "secilmis",
      revelationPlace: "M\u0259din\u0259",
      reflection: "R\u0259bbin sonsuz nem\u0259tl\u0259rini xat\u0131rladan, q\u0259lbi riqq\u0259t\u0259 g\u0259tir\u0259n ah\u0259ngdar qira\u0259t.",
      seoFocus: "R\u0259hman sur\u0259si qira\u0259ti, \u0259r\u0259bc\u0259 tilav\u0259t v\u0259 Az\u0259rbaycan dilind\u0259 t\u0259rc\xFCm\u0259."
    }
  },
  {
    keys: ["nebe", "n\u0259b\u0259", "naba"],
    meta: {
      surahNumber: 78,
      canonical: "N\u0259b\u0259 sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0646\u0628\u0623",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "B\xF6y\xFCk x\u0259b\u0259r \u2014 axir\u0259t g\xFCn\xFC, yarad\u0131l\u0131\u015F ni\u015Fan\u0259l\u0259ri v\u0259 t\u0259qva \u0259hlinin m\xFCkafat\u0131.",
      seoFocus: "N\u0259b\u0259 sur\u0259si qira\u0259ti, Maher Al-Muaiqly tilav\u0259ti v\u0259 Az\u0259rbaycan dilind\u0259 t\u0259rc\xFCm\u0259."
    }
  },
  {
    keys: ["maun"],
    meta: {
      surahNumber: 107,
      canonical: "Maun sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0645\u0627\u0639\u0648\u0646",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "Yetim\u0259 qay\u011F\u0131, s\u0259mimi ibad\u0259t v\u0259 sosial m\u0259suliyy\u0259t bar\u0259d\u0259 y\u0131\u011Fcam xat\u0131rlatma.",
      seoFocus: "107. Maun sur\u0259si, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["kovser", "k\xF6vs\u0259r"],
    meta: {
      surahNumber: 108,
      canonical: "K\xF6vs\u0259r sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0643\u0648\u062B\u0631",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "Qurani-K\u0259rimin \u0259n q\u0131sa sur\u0259si: t\xFCk\u0259nm\u0259z xeyir m\xFCjd\u0259si, namaz v\u0259 \u015F\xFCk\xFCr \u0259mri.",
      seoFocus: "108. K\xF6vs\u0259r sur\u0259si, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["kafirun"],
    meta: {
      surahNumber: 109,
      canonical: "Kafirun sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0643\u0627\u0641\u0631\u0648\u0646",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "T\xF6vhid inanc\u0131nda q\u0259tiyy\u0259t v\u0259 \u0259qid\u0259 s\u0259rh\u0259dl\u0259rinin ayd\u0131n b\u0259yan\u0131.",
      seoFocus: "109. Kafirun sur\u0259si, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["nesr", "n\u0259sr", "nasr"],
    meta: {
      surahNumber: 110,
      canonical: "N\u0259sr sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0646\u0635\u0631",
      category: "qisa",
      revelationPlace: "M\u0259din\u0259",
      reflection: "Allah\u0131n yard\u0131m\u0131 v\u0259 f\u0259th an\u0131nda t\u0259vaz\xF6karl\u0131qla t\u0259sbih v\u0259 isti\u011Ffar etm\u0259k d\u0259rsi.",
      seoFocus: "110. N\u0259sr sur\u0259si, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["mesed", "m\u0259s\u0259d", "masad"],
    meta: {
      surahNumber: 111,
      canonical: "M\u0259s\u0259d sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0645\u0633\u062F",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "Haqq d\u0259v\u0259tin\u0259 d\xFC\u015Fm\u0259n\xE7ilik ed\u0259nl\u0259rin aqib\u0259ti bar\u0259d\u0259 ibr\u0259tli sur\u0259.",
      seoFocus: "111. M\u0259s\u0259d sur\u0259si, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["ixlas", "ikhlas"],
    meta: {
      surahNumber: 112,
      canonical: "\u0130xlas sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0625\u062E\u0644\u0627\u0635",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "Allah\u0131n birliyi v\u0259 b\u0259nz\u0259rsizliyini b\u0259yan ed\u0259n t\xF6vhid sur\u0259si.",
      seoFocus: "112. \u0130xlas sur\u0259si, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["feleq", "f\u0259l\u0259q", "falaq"],
    meta: {
      surahNumber: 113,
      canonical: "F\u0259l\u0259q sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0641\u0644\u0642",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "S\xFCbh\xFCn R\u0259bbin\u0259 s\u0131\u011F\u0131naraq h\u0259r c\xFCr \u015F\u0259rd\u0259n qorunma duas\u0131.",
      seoFocus: "113. F\u0259l\u0259q sur\u0259si, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["nas"],
    meta: {
      surahNumber: 114,
      canonical: "Nas sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0646\u0627\u0633",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "\u0130nsanlar\u0131n R\u0259bbin\u0259 s\u0131\u011F\u0131naraq v\u0259sv\u0259s\u0259l\u0259rd\u0259n qorunma sur\u0259si.",
      seoFocus: "114. Nas sur\u0259si, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["vaqia", "vaqi\u0259", "waqiah"],
    meta: {
      surahNumber: 56,
      canonical: "Vaqi\u0259 sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0648\u0627\u0642\u0639\u0629",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "Qiyam\u0259t hadis\u0259si, insanlar\u0131n \xFC\xE7 z\xFCmr\u0259y\u0259 b\xF6l\xFCnm\u0259si v\u0259 R\u0259bbin q\xFCdr\u0259t d\u0259lill\u0259ri.",
      seoFocus: "Vaqi\u0259 sur\u0259si tilav\u0259ti v\u0259 \u018Flixan Musayevin Az\u0259rbaycan dilin\u0259 m\u0259naca t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["fatiha", "fatih\u0259"],
    meta: {
      surahNumber: 1,
      canonical: "Fatih\u0259 sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0641\u0627\u062A\u062D\u0629",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "Quran\u0131n a\xE7\u0131l\u0131\u015F\u0131: h\u0259md, r\xFCbubiyy\u0259t, ibad\u0259t v\u0259 do\u011Fru yol (Sirat\u0259l-M\xFCst\u0259qim) duas\u0131.",
      seoFocus: "Fatih\u0259 sur\u0259si tilav\u0259ti v\u0259 \u018Flixan Musayevin Az\u0259rbaycan dilin\u0259 t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["nisa"],
    meta: {
      surahNumber: 4,
      canonical: "Nisa sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0646\u0633\u0627\u0621",
      category: "medeni",
      revelationPlace: "M\u0259din\u0259",
      reflection: "Ail\u0259 h\xFCququ, \u0259dal\u0259t, yetiml\u0259r\u0259 qay\u011F\u0131 v\u0259 ictimai m\u0259suliyy\u0259t ay\u0259l\u0259ri.",
      seoFocus: "Nisa sur\u0259si tilav\u0259ti v\u0259 \u018Flixan Musayevin Az\u0259rbaycan dilin\u0259 t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["ali imran", "imran"],
    meta: {
      surahNumber: 3,
      canonical: "Ali-\u0130mran sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0622\u0644 \u0639\u0645\u0631\u0627\u0646",
      category: "medeni",
      revelationPlace: "M\u0259din\u0259",
      reflection: "\u0130manda s\u0259bat, Allah yolunda birlik v\u0259 a\u011F\u0131l sahibl\u0259rinin t\u0259f\u0259kk\xFCr\xFC.",
      seoFocus: "Ali-\u0130mran sur\u0259si tilav\u0259ti v\u0259 \u018Flixan Musayevin Az\u0259rbaycan dilin\u0259 t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["isra"],
    meta: {
      surahNumber: 17,
      canonical: "\u0130sra sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0625\u0633\u0631\u0627\u0621",
      category: "mekke",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "\u0130sra m\xF6c\xFCz\u0259si, valideynl\u0259r\u0259 yax\u015F\u0131l\u0131q v\u0259 Quran\u0131n \u0259n do\u011Fru yola y\xF6n\u0259ltm\u0259si.",
      seoFocus: "\u0130sra sur\u0259si tilav\u0259ti v\u0259 \u018Flixan Musayevin Az\u0259rbaycan dilin\u0259 t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["nur"],
    meta: {
      surahNumber: 24,
      canonical: "Nur sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0646\u0648\u0631",
      category: "medeni",
      revelationPlace: "M\u0259din\u0259",
      reflection: "\u0130ff\u0259t \u0259xlaq\u0131, \u0130lahi nur m\u0259s\u0259li v\u0259 m\xF6min c\u0259miyy\u0259tin \u0259d\u0259b qaydalar\u0131.",
      seoFocus: "Nur sur\u0259si tilav\u0259ti v\u0259 \u018Flixan Musayevin Az\u0259rbaycan dilin\u0259 t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["duha"],
    meta: {
      surahNumber: 93,
      canonical: "Duha sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0636\u062D\u0649",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "R\u0259bbin t\u0259rk etm\u0259diyi m\xFCjd\u0259si, yetim\u0259 \u015F\u0259fq\u0259t v\u0259 nem\u0259tl\u0259ri xat\u0131rlamaq.",
      seoFocus: "Duha sur\u0259si tilav\u0259ti v\u0259 \u018Flixan Musayevin Az\u0259rbaycan dilin\u0259 t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["serh", "\u015F\u0259rh", "inshirah"],
    meta: {
      surahNumber: 94,
      canonical: "\u015E\u0259rh sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0634\u0631\u062D",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "H\u0259r \xE7\u0259tinlikl\u0259 yana\u015F\u0131 bir asanl\u0131q oldu\u011Fu m\xFCjd\u0259si v\u0259 q\u0259lb rahatl\u0131\u011F\u0131.",
      seoFocus: "94. \u015E\u0259rh sur\u0259si tilav\u0259ti, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["tin"],
    meta: {
      surahNumber: 95,
      canonical: "Tin sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u062A\u064A\u0646",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "\u0130nsan\u0131n \u0259n g\xF6z\u0259l bi\xE7imd\u0259 yarad\u0131lmas\u0131, iman v\u0259 saleh \u0259m\u0259lin \u0259b\u0259di m\xFCkafat\u0131.",
      seoFocus: "95. Tin sur\u0259si tilav\u0259ti, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["eleq", "\u0259l\u0259q", "alaq"],
    meta: {
      surahNumber: 96,
      canonical: "\u018Fl\u0259q sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0639\u0644\u0642",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "\u0130lk v\u0259hy: Yaradan R\u0259bbin ad\u0131 il\u0259 oxumaq, elm v\u0259 R\u0259bb\u0259 s\u0259cd\u0259 edib yax\u0131nla\u015Fmaq.",
      seoFocus: "96. \u018Fl\u0259q sur\u0259si tilav\u0259ti, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["qadr", "q\u0259dr"],
    meta: {
      surahNumber: 97,
      canonical: "Q\u0259dr sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0642\u062F\u0631",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "Min aydan xeyirli olan Q\u0259dr gec\u0259sinin f\u0259zil\u0259ti v\u0259 Quran\u0131n nazil olmas\u0131.",
      seoFocus: "Q\u0259dr sur\u0259si tilav\u0259ti v\u0259 \u018Flixan Musayevin Az\u0259rbaycan dilin\u0259 t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["beyyine", "b\u0259yyin\u0259", "bayyinah"],
    meta: {
      surahNumber: 98,
      canonical: "B\u0259yyin\u0259 sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0628\u064A\u0646\u0629",
      category: "qisa",
      revelationPlace: "M\u0259din\u0259",
      reflection: "Ayd\u0131n d\u0259lil, ixlasl\u0131 ibad\u0259t v\u0259 iman g\u0259tirib saleh \u0259m\u0259l ed\u0259nl\u0259rin \u018Fdn c\u0259nn\u0259tl\u0259ri.",
      seoFocus: "98. B\u0259yyin\u0259 sur\u0259si tilav\u0259ti, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["zelzele", "z\u0259lz\u0259l\u0259", "zalzalah"],
    meta: {
      surahNumber: 99,
      canonical: "Z\u0259lz\u0259l\u0259 sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0632\u0644\u0632\u0644\u0629",
      category: "qisa",
      revelationPlace: "M\u0259din\u0259",
      reflection: "Z\u0259rr\u0259 q\u0259d\u0259r xeyir v\u0259 ya \u015F\u0259rin bel\u0259 qar\u015F\u0131l\u0131\u011F\u0131n\u0131n g\xF6r\xFCl\u0259c\u0259yi hesab g\xFCn\xFC.",
      seoFocus: "99. Z\u0259lz\u0259l\u0259 sur\u0259si tilav\u0259ti, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["adiyat"],
    meta: {
      surahNumber: 100,
      canonical: "Adiyat sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0639\u0627\u062F\u064A\u0627\u062A",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "\u0130nsan\u0131n nankorluqdan \xE7\u0259kinm\u0259si v\u0259 q\u0259lbl\u0259rd\u0259 olanlar\u0131n a\u015Fkara \xE7\u0131xaca\u011F\u0131 g\xFCn.",
      seoFocus: "100. Adiyat sur\u0259si tilav\u0259ti, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["qarie", "qari\u0259", "qariah"],
    meta: {
      surahNumber: 101,
      canonical: "Qari\u0259 sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0642\u0627\u0631\u0639\u0629",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "Qiyam\u0259t g\xFCn\xFCn\xFCn d\u0259h\u015F\u0259ti v\u0259 \u0259m\u0259l t\u0259r\u0259zisinin a\u011F\u0131r v\u0259 ya y\xFCng\xFCl g\u0259lm\u0259si.",
      seoFocus: "101. Qari\u0259 sur\u0259si tilav\u0259ti, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["tekasur", "t\u0259kasur", "takathur"],
    meta: {
      surahNumber: 102,
      canonical: "T\u0259kasur sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u062A\u0643\u0627\u062B\u0631",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "\xC7oxluq yar\u0131\u015F\u0131 il\u0259 q\u0259fl\u0259t\u0259 d\xFC\u015Fm\u0259m\u0259k v\u0259 nem\u0259tl\u0259r bar\u0259d\u0259 sor\u011Fu-sual x\u0259b\u0259rdarl\u0131\u011F\u0131.",
      seoFocus: "102. T\u0259kasur sur\u0259si tilav\u0259ti, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["esr", "\u0259sr", "asr"],
    meta: {
      surahNumber: 103,
      canonical: "\u018Fsr sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0639\u0635\u0631",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "Zaman \u015Fahidliyi: iman, saleh \u0259m\u0259l, haqq\u0131 v\u0259 s\u0259bri t\xF6vsiy\u0259 etm\u0259kl\u0259 nicat.",
      seoFocus: "\u018Fsr sur\u0259si tilav\u0259ti v\u0259 \u018Flixan Musayevin Az\u0259rbaycan dilin\u0259 t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["humeze", "hum\u0259z\u0259", "humazah"],
    meta: {
      surahNumber: 104,
      canonical: "Hum\u0259z\u0259 sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0647\u0645\u0632\u0629",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "Qeyb\u0259t, t\u0259n\u0259 v\u0259 mal-d\xF6vl\u0259t h\u0259risliyind\u0259n \xE7\u0259kindir\u0259n ibr\u0259tli sur\u0259.",
      seoFocus: "104. Hum\u0259z\u0259 sur\u0259si tilav\u0259ti, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["fil"],
    meta: {
      surahNumber: 105,
      canonical: "Fil sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0641\u064A\u0644",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "K\u0259b\u0259ni da\u011F\u0131tmaq ist\u0259y\u0259n Fil ordusunun \u0130lahi q\xFCdr\u0259tl\u0259 m\u0259\u011Flub edilm\u0259si.",
      seoFocus: "105. Fil sur\u0259si tilav\u0259ti, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  },
  {
    keys: ["qureys", "qurey\u015F", "quraysh"],
    meta: {
      surahNumber: 106,
      canonical: "Qurey\u015F sur\u0259si",
      arabic: "\u0633\u0648\u0631\u0629 \u0642\u0631\u064A\u0634",
      category: "qisa",
      revelationPlace: "M\u0259kk\u0259",
      reflection: "\u018Fmin-amanl\u0131q v\u0259 ruzi nem\u0259tin\u0259 \u015F\xFCk\xFCr olaraq K\u0259b\u0259nin R\u0259bbin\u0259 ibad\u0259t etm\u0259y\u0259 \xE7a\u011F\u0131r\u0131\u015F.",
      seoFocus: "106. Qurey\u015F sur\u0259si tilav\u0259ti, Maher Al-Muaiqly qira\u0259ti v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si."
    }
  }
];
var CATEGORY_LABELS = {
  mekke: "Uzun Tilav\u0259t",
  medeni: "Uzun Tilav\u0259t",
  secilmis: "Se\xE7ilmi\u015F Qira\u0259tl\u0259r",
  qisa: "Q\u0131sa Sur\u0259l\u0259r"
};
function normalizeAzerbaijaniText(input) {
  return input.toLowerCase().replace(/ə/g, "e").replace(/ğ/g, "g").replace(/ş/g, "s").replace(/ç/g, "c").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ü/g, "u").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}
function decodeHtmlEntities(text) {
  return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").trim();
}
function parseDurationToSeconds(duration) {
  const parts = duration.trim().split(":").map((p) => Number.parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n) || n < 0)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}
function parseCompactViewCount(text) {
  const clean = text.replace(/views?/i, "").replace(/,/g, "").trim().toUpperCase();
  const num = Number.parseFloat(clean);
  if (Number.isNaN(num)) return 0;
  if (clean.endsWith("K")) return Math.round(num * 1e3);
  if (clean.endsWith("M")) return Math.round(num * 1e6);
  return Math.round(num);
}
var KNOWN_RECITERS = [
  "Maher Al-Muaiqly",
  "Maher al Muaiqly",
  "\u0130slam Subhi",
  "islam Subhi",
  "Khalid al Calil",
  "Yasser al Dossari",
  "Yasser al dossari",
  "Nasser al Qatami",
  "Muhammed Ayyub",
  "Abdurrahman As Sudeis",
  "Waleed Shamsan",
  "Mohamed Obada",
  "Fayiz S\u0259ud",
  "Wadi Al Yamani",
  "Hazza Al Balushi",
  "\u018Fhm\u0259d Talib"
];
function classifyVideoTitle(rawTitle, options) {
  const cleanTitle = decodeHtmlEntities(rawTitle).replace(/\s+/g, " ").trim();
  const normalized = normalizeAzerbaijaniText(cleanTitle);
  const matchedEntry = SURAH_METADATA_MAP.find(
    (entry) => entry.keys.some((key) => normalized.includes(normalizeAzerbaijaniText(key)))
  );
  let reciter = "Se\xE7ilmi\u015F Qari";
  const matchedReciter = KNOWN_RECITERS.find(
    (r) => normalized.includes(normalizeAzerbaijaniText(r))
  );
  if (matchedReciter) {
    reciter = matchedReciter.replace(/islam/i, "\u0130slam").replace(/al Muaiqly/i, "Al-Muaiqly").replace(/al dossari/i, "Al-Dosari").replace(/al Qatami/i, "Al-Qatami").replace(/al Calil/i, "Al-Calil");
  } else {
    const reciterMatch = cleanTitle.match(/\s[—–-]\s+([^|]+?)(?:\s*\||$)/);
    if (reciterMatch && reciterMatch[1]) {
      const candidate = reciterMatch[1].trim();
      const normalizedCandidate = normalizeAzerbaijaniText(candidate);
      if (candidate && !/^\d+(?:\s*[–-]\s*\d+)?$/.test(candidate) && !normalizedCandidate.includes("azerbaycan") && !normalizedCandidate.includes("sure") && !normalizedCandidate.includes("surah") && !normalizedCandidate.includes("quran")) {
        reciter = candidate;
      }
    }
  }
  const rangeMatch = cleanTitle.match(/(\d+)\s*[–-]\s*(\d+)/);
  let ayahStart;
  let ayahEnd;
  if (rangeMatch) {
    ayahStart = Number.parseInt(rangeMatch[1], 10);
    ayahEnd = Number.parseInt(rangeMatch[2], 10);
  } else if (matchedEntry?.defaultAyah) {
    ayahStart = matchedEntry.defaultAyah[0];
    ayahEnd = matchedEntry.defaultAyah[1];
  }
  const ayahRange = ayahStart && ayahEnd ? ayahStart === ayahEnd ? `${ayahStart}-ci ay\u0259` : `${ayahStart}\u2013${ayahEnd}. ay\u0259l\u0259r` : "Tam sur\u0259";
  const surahNumber = matchedEntry ? matchedEntry.meta.surahNumber : 1;
  const surahName = matchedEntry ? matchedEntry.meta.canonical : cleanTitle.split("|")[0].trim();
  const category = matchedEntry ? matchedEntry.meta.category : "secilmis";
  const arabicName = matchedEntry ? matchedEntry.meta.arabic : "\u0633\u0648\u0631\u0629 \u0627\u0644\u0641\u0627\u062A\u062D\u0629";
  const revelationPlace = matchedEntry ? matchedEntry.meta.revelationPlace : "M\u0259kk\u0259";
  const reflection = matchedEntry ? matchedEntry.meta.reflection : "\u018Fr\u0259bc\u0259 tilav\u0259t v\u0259 \u018Flixan Musayevin Az\u0259rbaycan dilin\u0259 m\u0259naca t\u0259rc\xFCm\u0259si.";
  const format = options?.format ?? "long";
  const duration = options?.duration ?? (format === "short" ? "0:55" : "10:00");
  const durationSeconds = parseDurationToSeconds(duration);
  const displayTitle = rangeMatch ? `${surahName}, ${rangeMatch[1]}\u2013${rangeMatch[2]}` : matchedEntry && reciter !== "Se\xE7ilmi\u015F Qari" ? `${surahName} \u2014 ${reciter}` : cleanTitle.split("|")[0].trim();
  const seoDescription = matchedEntry ? `${displayTitle} (${reciter}). ${matchedEntry.meta.seoFocus} ${revelationPlace} d\xF6vr\xFCnd\u0259 nazil olan bu sur\u0259 Quran Qiraeti kanal\u0131nda \u0259r\u0259bc\u0259 tilav\u0259t v\u0259 \u018Flixan Musayevin Az\u0259rbaycan dilin\u0259 m\u0259naca t\u0259rc\xFCm\u0259si il\u0259 t\u0259qdim olunur.` : `${displayTitle} \u2014 Quran Qiraeti kanal\u0131nda \u0259r\u0259bc\u0259 tilav\u0259t v\u0259 \u018Flixan Musayevin Az\u0259rbaycan dilin\u0259 m\u0259naca t\u0259rc\xFCm\u0259si.`;
  const seoKeywords = [
    surahName,
    reciter,
    `${revelationPlace} sur\u0259si`,
    "\u018Flixan Musayev t\u0259rc\xFCm\u0259si",
    format === "short" ? "Quran Shorts" : "Uzun Quran tilav\u0259ti"
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
    published: options?.published ?? (/* @__PURE__ */ new Date()).toISOString(),
    views: options?.views ?? 0,
    reflection,
    seoDescription,
    seoKeywords
  };
}
function buildRecitationVideo(params) {
  const meta = classifyVideoTitle(params.rawTitle, {
    format: params.format,
    duration: params.duration,
    published: params.published,
    views: params.views
  });
  return {
    videoId: params.videoId,
    thumbnailUrl: `https://i.ytimg.com/vi/${params.videoId}/hqdefault.jpg`,
    youtubeUrl: params.format === "short" ? `https://www.youtube.com/shorts/${params.videoId}` : `https://www.youtube.com/watch?v=${params.videoId}`,
    publishedLabel: params.publishedLabel,
    ...meta
  };
}
function parseQuranEncSurah(surahNumber, payload) {
  const rows = Array.isArray(payload.result) ? payload.result : [];
  return {
    surahNumber,
    translatorName: "\u018Flixan Musayev",
    editionVersion: "1.0.4",
    ayahs: rows.map((row) => ({
      surahNumber,
      ayahNumber: Number.parseInt(String(row.aya ?? "0"), 10) || 0,
      arabicText: String(row.arabic_text ?? "").trim(),
      translation: String(row.translation ?? "").trim(),
      footnotes: String(row.footnotes ?? "").trim()
    }))
  };
}
function parseYouTubeVideosPage(html) {
  const dataStr = html.match(/var ytInitialData = (\{.*?\});<\/script>/s)?.[1];
  if (!dataStr) return [];
  try {
    const data = JSON.parse(dataStr);
    const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
    const activeTab = tabs.find((t) => t.tabRenderer?.selected)?.tabRenderer;
    const contents = activeTab?.content?.richGridRenderer?.contents || [];
    const videos = [];
    for (const item of contents) {
      const m = item?.richItemRenderer?.content?.lockupViewModel;
      if (!m?.contentId) continue;
      const videoId = m.contentId;
      const rawTitle = m.metadata?.lockupMetadataViewModel?.title?.content ?? "";
      const duration = m.contentImage?.thumbnailViewModel?.overlays?.[0]?.thumbnailBottomOverlayViewModel?.badges?.[0]?.thumbnailBadgeViewModel?.text ?? "";
      const rows = m.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
      const parts = rows.flatMap(
        (r) => r.metadataParts?.map((p) => p.text?.content ?? "") || []
      );
      const views = parseCompactViewCount(parts[0] ?? "0");
      const publishedLabel = parts[1] ?? "";
      const seconds = parseDurationToSeconds(duration);
      if (!rawTitle || seconds <= 0) continue;
      videos.push(
        buildRecitationVideo({
          videoId,
          rawTitle,
          format: "long",
          duration,
          published: (/* @__PURE__ */ new Date()).toISOString(),
          publishedLabel,
          views
        })
      );
    }
    return videos;
  } catch {
    return [];
  }
}
function extractShortsFromItems(contents) {
  const shorts = [];
  let continuationToken;
  for (const item of contents) {
    const token = item?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
    if (token) {
      continuationToken = token;
      continue;
    }
    const s = item?.richItemRenderer?.content?.shortsLockupViewModel;
    if (!s) continue;
    const videoId = s.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId;
    const rawTitle = s.overlayMetadata?.primaryText?.content ?? "";
    const viewsText = s.overlayMetadata?.secondaryText?.content ?? "0";
    if (!videoId || !rawTitle) continue;
    shorts.push(
      buildRecitationVideo({
        videoId,
        rawTitle,
        format: "short",
        duration: "0:55",
        published: (/* @__PURE__ */ new Date()).toISOString(),
        publishedLabel: "Shorts",
        views: parseCompactViewCount(viewsText)
      })
    );
  }
  return { shorts, continuationToken };
}
function extractYouTubeShortsInitial(html) {
  const dataStr = html.match(/var ytInitialData = (\{.*?\});<\/script>/s)?.[1];
  if (!dataStr) return { shorts: [] };
  const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  const clientVersion = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1];
  try {
    const data = JSON.parse(dataStr);
    const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
    const activeTab = tabs.find(
      (t) => t.tabRenderer?.selected
    )?.tabRenderer;
    const contents = activeTab?.content?.richGridRenderer?.contents || [];
    const { shorts, continuationToken } = extractShortsFromItems(contents);
    return { shorts, continuationToken, apiKey, clientVersion };
  } catch {
    return { shorts: [] };
  }
}
function parseYouTubeShortsContinuation(payload) {
  const actions = payload?.onResponseReceivedActions || [];
  const items = actions.flatMap(
    (action) => action.appendContinuationItemsAction?.continuationItems || []
  );
  return extractShortsFromItems(items);
}
var FEATURED_SURAH_VIDEO_IDS = {
  fatiha: "WuoDn6idrAk",
  baqara: "iCzBmN_pBs8"
};
function prioritizeFeaturedSurahs(videos) {
  if (videos.length === 0) return videos;
  const fatiha = videos.find((v) => v.videoId === FEATURED_SURAH_VIDEO_IDS.fatiha) ?? videos.find((v) => v.surahNumber === 1 && !v.ayahStart);
  const baqara = videos.find((v) => v.videoId === FEATURED_SURAH_VIDEO_IDS.baqara) ?? videos.find((v) => v.surahNumber === 2 && !v.ayahStart && v.videoId !== fatiha?.videoId);
  const pinned = [];
  const pinnedIds = /* @__PURE__ */ new Set();
  if (fatiha) {
    pinned.push(fatiha);
    pinnedIds.add(fatiha.videoId);
  }
  if (baqara && !pinnedIds.has(baqara.videoId)) {
    pinned.push(baqara);
    pinnedIds.add(baqara.videoId);
  }
  return [...pinned, ...videos.filter((v) => !pinnedIds.has(v.videoId))];
}
function validateSurahRequest(input) {
  const errors = {};
  if (!input.surahName.trim() || input.surahName.trim().length < 2) {
    errors.surahName = "Z\u0259hm\u0259t olmasa sur\u0259 v\u0259 ya ay\u0259 ad\u0131n\u0131 daxil edin.";
  }
  if (input.email.trim()) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(input.email.trim())) {
      errors.email = "D\xFCzg\xFCn e-po\xE7t \xFCnvan\u0131 daxil edin (v\u0259 ya bo\u015F burax\u0131n).";
    }
  }
  if (input.note.trim().length > 400) {
    errors.note = "Qeyd maksimum 400 simvol ola bil\u0259r.";
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

// src/lib/quran.ts
var TOTAL_QURAN_PAGES = 604;
var TOTAL_QURAN_SURAHS = 114;
var SURAH_CATALOG = [
  { number: 1, name: "Fatih\u0259", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0671\u0644\u0652\u0641\u064E\u0627\u062A\u0650\u062D\u064E\u0629\u0650", ayahCount: 7, revelationPlace: "M\u0259kk\u0259", startPage: 1 },
  { number: 2, name: "B\u0259q\u0259r\u0259", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0628\u064E\u0642\u064E\u0631\u064E\u0629\u0650", ayahCount: 286, revelationPlace: "M\u0259din\u0259", startPage: 2 },
  { number: 3, name: "Ali-\u0130mran", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0653\u0644\u0650 \u0639\u0650\u0645\u06E1\u0631\u064E\u0627\u0646\u064E", ayahCount: 200, revelationPlace: "M\u0259din\u0259", startPage: 50 },
  { number: 4, name: "Nisa", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0646\u0651\u0650\u0633\u064E\u0627\u0621\u0650", ayahCount: 176, revelationPlace: "M\u0259din\u0259", startPage: 77 },
  { number: 5, name: "Maid\u0259", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0645\u064E\u0627\u0626\u0640\u0650\u062F\u064E\u0629\u0650", ayahCount: 120, revelationPlace: "M\u0259din\u0259", startPage: 106 },
  { number: 6, name: "\u018Fnam", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0623\u064E\u0646\u06E1\u0639\u064E\u0627\u0645\u0650", ayahCount: 165, revelationPlace: "M\u0259kk\u0259", startPage: 128 },
  { number: 7, name: "\u018Fraf", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0623\u064E\u0639\u06E1\u0631\u064E\u0627\u0641\u0650", ayahCount: 206, revelationPlace: "M\u0259kk\u0259", startPage: 151 },
  { number: 8, name: "\u018Fnfal", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0623\u064E\u0646\u0641\u064E\u0627\u0644\u0650", ayahCount: 75, revelationPlace: "M\u0259din\u0259", startPage: 177 },
  { number: 9, name: "T\xF6vb\u0259", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u062A\u0651\u064E\u0648\u06E1\u0628\u064E\u0629\u0650", ayahCount: 129, revelationPlace: "M\u0259din\u0259", startPage: 187 },
  { number: 10, name: "Yunus", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u064A\u064F\u0648\u0646\u064F\u0633\u064E", ayahCount: 109, revelationPlace: "M\u0259kk\u0259", startPage: 208 },
  { number: 11, name: "Hud", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0647\u064F\u0648\u062F\u064D", ayahCount: 123, revelationPlace: "M\u0259kk\u0259", startPage: 221 },
  { number: 12, name: "Yusuf", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u064A\u064F\u0648\u0633\u064F\u0641\u064E", ayahCount: 111, revelationPlace: "M\u0259kk\u0259", startPage: 235 },
  { number: 13, name: "R\u0259d", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0631\u0651\u064E\u0639\u06E1\u062F\u0650", ayahCount: 43, revelationPlace: "M\u0259din\u0259", startPage: 249 },
  { number: 14, name: "\u0130brahim", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0625\u0650\u0628\u06E1\u0631\u064E\u0627\u0647\u0650\u064A\u0645\u064E", ayahCount: 52, revelationPlace: "M\u0259kk\u0259", startPage: 255 },
  { number: 15, name: "Hicr", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u062D\u0650\u062C\u06E1\u0631\u0650", ayahCount: 99, revelationPlace: "M\u0259kk\u0259", startPage: 262 },
  { number: 16, name: "N\u0259hl", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0646\u0651\u064E\u062D\u06E1\u0644\u0650", ayahCount: 128, revelationPlace: "M\u0259kk\u0259", startPage: 267 },
  { number: 17, name: "\u0130sra", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0625\u0650\u0633\u06E1\u0631\u064E\u0627\u0621\u0650", ayahCount: 111, revelationPlace: "M\u0259kk\u0259", startPage: 282 },
  { number: 18, name: "K\u0259hf", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0643\u064E\u0647\u06E1\u0641\u0650", ayahCount: 110, revelationPlace: "M\u0259kk\u0259", startPage: 293 },
  { number: 19, name: "M\u0259ry\u0259m", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0645\u064E\u0631\u06E1\u064A\u064E\u0645\u064E", ayahCount: 98, revelationPlace: "M\u0259kk\u0259", startPage: 305 },
  { number: 20, name: "Taha", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0637\u0647", ayahCount: 135, revelationPlace: "M\u0259kk\u0259", startPage: 312 },
  { number: 21, name: "\u018Fnbiya", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0623\u064E\u0646\u0628\u0650\u064A\u064E\u0627\u0621\u0650", ayahCount: 112, revelationPlace: "M\u0259kk\u0259", startPage: 322 },
  { number: 22, name: "H\u0259cc", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u062D\u064E\u062C\u0651\u0650", ayahCount: 78, revelationPlace: "M\u0259din\u0259", startPage: 332 },
  { number: 23, name: "Muminun", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0645\u064F\u0624\u06E1\u0645\u0650\u0646\u064F\u0648\u0646\u064E", ayahCount: 118, revelationPlace: "M\u0259kk\u0259", startPage: 342 },
  { number: 24, name: "Nur", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0646\u0651\u064F\u0648\u0631\u0650", ayahCount: 64, revelationPlace: "M\u0259din\u0259", startPage: 350 },
  { number: 25, name: "Furqan", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0641\u064F\u0631\u06E1\u0642\u064E\u0627\u0646\u0650", ayahCount: 77, revelationPlace: "M\u0259kk\u0259", startPage: 359 },
  { number: 26, name: "\u015E\xFC\u0259ra", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0634\u0651\u064F\u0639\u064E\u0631\u064E\u0627\u0621\u0650", ayahCount: 227, revelationPlace: "M\u0259kk\u0259", startPage: 367 },
  { number: 27, name: "N\u0259ml", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0646\u0651\u064E\u0645\u06E1\u0644\u0650", ayahCount: 93, revelationPlace: "M\u0259kk\u0259", startPage: 377 },
  { number: 28, name: "Qasas", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0642\u064E\u0635\u064E\u0635\u0650", ayahCount: 88, revelationPlace: "M\u0259kk\u0259", startPage: 385 },
  { number: 29, name: "\u018Fnk\u0259but", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0639\u064E\u0646\u0643\u064E\u0628\u064F\u0648\u062A\u0650", ayahCount: 69, revelationPlace: "M\u0259kk\u0259", startPage: 396 },
  { number: 30, name: "Rum", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0631\u0651\u064F\u0648\u0645\u0650", ayahCount: 60, revelationPlace: "M\u0259kk\u0259", startPage: 404 },
  { number: 31, name: "Loqman", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0644\u064F\u0642\u06E1\u0645\u064E\u0627\u0646\u064E", ayahCount: 34, revelationPlace: "M\u0259kk\u0259", startPage: 411 },
  { number: 32, name: "S\u0259cd\u0259", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0633\u0651\u064E\u062C\u06E1\u062F\u064E\u0629\u0650", ayahCount: 30, revelationPlace: "M\u0259kk\u0259", startPage: 415 },
  { number: 33, name: "\u018Fhzab", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0623\u064E\u062D\u06E1\u0632\u064E\u0627\u0628\u0650", ayahCount: 73, revelationPlace: "M\u0259din\u0259", startPage: 418 },
  { number: 34, name: "S\u0259ba", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0633\u064E\u0628\u064E\u0625\u064D", ayahCount: 54, revelationPlace: "M\u0259kk\u0259", startPage: 428 },
  { number: 35, name: "Fatir", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0641\u064E\u0627\u0637\u0650\u0631\u064D", ayahCount: 45, revelationPlace: "M\u0259kk\u0259", startPage: 434 },
  { number: 36, name: "Yasin", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u064A\u0633\u0653", ayahCount: 83, revelationPlace: "M\u0259kk\u0259", startPage: 440 },
  { number: 37, name: "Saffat", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0635\u0651\u064E\u0627\u0641\u0651\u064E\u0627\u062A\u0650", ayahCount: 182, revelationPlace: "M\u0259kk\u0259", startPage: 446 },
  { number: 38, name: "Sad", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0635\u0653", ayahCount: 88, revelationPlace: "M\u0259kk\u0259", startPage: 453 },
  { number: 39, name: "Z\xFCm\u0259r", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0632\u0651\u064F\u0645\u064E\u0631\u0650", ayahCount: 75, revelationPlace: "M\u0259kk\u0259", startPage: 458 },
  { number: 40, name: "\u011Eafir", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u063A\u064E\u0627\u0641\u0650\u0631\u064D", ayahCount: 85, revelationPlace: "M\u0259kk\u0259", startPage: 467 },
  { number: 41, name: "Fussil\u0259t", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0641\u064F\u0635\u0651\u0650\u0644\u064E\u062A\u06E1", ayahCount: 54, revelationPlace: "M\u0259kk\u0259", startPage: 477 },
  { number: 42, name: "\u015Eura", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0634\u0651\u064F\u0648\u0631\u064E\u0649\u0670", ayahCount: 53, revelationPlace: "M\u0259kk\u0259", startPage: 483 },
  { number: 43, name: "Zuxruf", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0632\u0651\u064F\u062E\u06E1\u0631\u064F\u0641\u0650", ayahCount: 89, revelationPlace: "M\u0259kk\u0259", startPage: 489 },
  { number: 44, name: "Duxan", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u062F\u0651\u064F\u062E\u064E\u0627\u0646\u0650", ayahCount: 59, revelationPlace: "M\u0259kk\u0259", startPage: 496 },
  { number: 45, name: "Casiy\u0259", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u062C\u064E\u0627\u062B\u0650\u064A\u064E\u0629\u0650", ayahCount: 37, revelationPlace: "M\u0259kk\u0259", startPage: 499 },
  { number: 46, name: "\u018Fhqaf", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0623\u064E\u062D\u06E1\u0642\u064E\u0627\u0641\u0650", ayahCount: 35, revelationPlace: "M\u0259kk\u0259", startPage: 502 },
  { number: 47, name: "M\xFCh\u0259mm\u0259d", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0645\u064F\u062D\u064E\u0645\u0651\u064E\u062F\u064D", ayahCount: 38, revelationPlace: "M\u0259din\u0259", startPage: 507 },
  { number: 48, name: "F\u0259th", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0641\u064E\u062A\u06E1\u062D\u0650", ayahCount: 29, revelationPlace: "M\u0259din\u0259", startPage: 511 },
  { number: 49, name: "Hucurat", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u062D\u064F\u062C\u064F\u0631\u064E\u0627\u062A\u0650", ayahCount: 18, revelationPlace: "M\u0259din\u0259", startPage: 515 },
  { number: 50, name: "Qaf", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0642\u0653", ayahCount: 45, revelationPlace: "M\u0259kk\u0259", startPage: 518 },
  { number: 51, name: "Zariyat", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0630\u0651\u064E\u0627\u0631\u0650\u064A\u064E\u0627\u062A\u0650", ayahCount: 60, revelationPlace: "M\u0259kk\u0259", startPage: 520 },
  { number: 52, name: "Tur", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0637\u0651\u064F\u0648\u0631\u0650", ayahCount: 49, revelationPlace: "M\u0259kk\u0259", startPage: 523 },
  { number: 53, name: "N\u0259cm", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0646\u0651\u064E\u062C\u06E1\u0645\u0650", ayahCount: 62, revelationPlace: "M\u0259kk\u0259", startPage: 526 },
  { number: 54, name: "Q\u0259m\u0259r", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0642\u064E\u0645\u064E\u0631\u0650", ayahCount: 55, revelationPlace: "M\u0259kk\u0259", startPage: 528 },
  { number: 55, name: "R\u0259hman", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0631\u0651\u064E\u062D\u06E1\u0645\u064E\u0670\u0646", ayahCount: 78, revelationPlace: "M\u0259din\u0259", startPage: 531 },
  { number: 56, name: "Vaqi\u0259", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0648\u064E\u0627\u0642\u0650\u0639\u064E\u0629\u0650", ayahCount: 96, revelationPlace: "M\u0259kk\u0259", startPage: 534 },
  { number: 57, name: "H\u0259did", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u062D\u064E\u062F\u0650\u064A\u062F\u0650", ayahCount: 29, revelationPlace: "M\u0259din\u0259", startPage: 537 },
  { number: 58, name: "M\xFCcadil\u0259", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0645\u064F\u062C\u064E\u0627\u062F\u0644\u064E\u0629\u0650", ayahCount: 22, revelationPlace: "M\u0259din\u0259", startPage: 542 },
  { number: 59, name: "H\u0259\u015Fr", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u062D\u064E\u0634\u06E1\u0631\u0650", ayahCount: 24, revelationPlace: "M\u0259din\u0259", startPage: 545 },
  { number: 60, name: "M\xFCmt\u0259hin\u0259", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0645\u064F\u0645\u06E1\u062A\u064E\u062D\u0646\u064E\u0629\u0650", ayahCount: 13, revelationPlace: "M\u0259din\u0259", startPage: 549 },
  { number: 61, name: "Saff", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0635\u0651\u064E\u0641\u0651\u0650", ayahCount: 14, revelationPlace: "M\u0259din\u0259", startPage: 551 },
  { number: 62, name: "C\xFCm\u0259", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u062C\u064F\u0645\u064F\u0639\u064E\u0629\u0650", ayahCount: 11, revelationPlace: "M\u0259din\u0259", startPage: 553 },
  { number: 63, name: "M\xFCnafiqun", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0645\u064F\u0646\u064E\u0627\u0641\u0650\u0642\u064F\u0648\u0646\u064E", ayahCount: 11, revelationPlace: "M\u0259din\u0259", startPage: 554 },
  { number: 64, name: "T\u0259\u011Fabun", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u062A\u0651\u064E\u063A\u064E\u0627\u0628\u064F\u0646\u0650", ayahCount: 18, revelationPlace: "M\u0259din\u0259", startPage: 556 },
  { number: 65, name: "T\u0259laq", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0637\u0651\u064E\u0644\u064E\u0627\u0642\u0650", ayahCount: 12, revelationPlace: "M\u0259din\u0259", startPage: 558 },
  { number: 66, name: "T\u0259hrim", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u062A\u0651\u064E\u062D\u06E1\u0631\u0650\u064A\u0645\u0650", ayahCount: 12, revelationPlace: "M\u0259din\u0259", startPage: 560 },
  { number: 67, name: "M\xFClk", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0645\u064F\u0644\u06E1\u0643\u0650", ayahCount: 30, revelationPlace: "M\u0259kk\u0259", startPage: 562 },
  { number: 68, name: "Q\u0259l\u0259m", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0642\u064E\u0644\u064E\u0645\u0650", ayahCount: 52, revelationPlace: "M\u0259kk\u0259", startPage: 564 },
  { number: 69, name: "Haqq\u0259", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u062D\u064E\u0627\u0642\u0651\u064E\u0629\u0650", ayahCount: 52, revelationPlace: "M\u0259kk\u0259", startPage: 566 },
  { number: 70, name: "M\u0259aric", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0645\u064E\u0639\u064E\u0627\u0631\u0650\u062C\u0650", ayahCount: 44, revelationPlace: "M\u0259kk\u0259", startPage: 568 },
  { number: 71, name: "Nuh", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0646\u064F\u0648\u062D\u064D", ayahCount: 28, revelationPlace: "M\u0259kk\u0259", startPage: 570 },
  { number: 72, name: "Cinn", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u062C\u0650\u0646\u0651\u0650", ayahCount: 28, revelationPlace: "M\u0259kk\u0259", startPage: 572 },
  { number: 73, name: "M\xFCzz\u0259mmil", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0645\u064F\u0632\u0651\u064E\u0645\u0651\u0650\u0644\u0650", ayahCount: 20, revelationPlace: "M\u0259kk\u0259", startPage: 574 },
  { number: 74, name: "M\xFCdd\u0259ssir", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0645\u064F\u062F\u0651\u064E\u062B\u0651\u0650\u0631\u0650", ayahCount: 56, revelationPlace: "M\u0259kk\u0259", startPage: 575 },
  { number: 75, name: "Qiyam\u0259t", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0642\u0650\u064A\u064E\u0627\u0645\u064E\u0629\u0650", ayahCount: 40, revelationPlace: "M\u0259kk\u0259", startPage: 577 },
  { number: 76, name: "\u0130nsan", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0625\u0650\u0646\u0633\u064E\u0627\u0646\u0650", ayahCount: 31, revelationPlace: "M\u0259din\u0259", startPage: 578 },
  { number: 77, name: "M\xFCrs\u0259lat", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0645\u064F\u0631\u06E1\u0633\u064E\u0644\u064E\u0627\u062A\u0650", ayahCount: 50, revelationPlace: "M\u0259kk\u0259", startPage: 580 },
  { number: 78, name: "N\u0259b\u0259", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0646\u0651\u064E\u0628\u064E\u0625\u0650", ayahCount: 40, revelationPlace: "M\u0259kk\u0259", startPage: 582 },
  { number: 79, name: "Naziat", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0646\u0651\u064E\u0627\u0632\u0650\u0639\u064E\u0627\u062A\u0650", ayahCount: 46, revelationPlace: "M\u0259kk\u0259", startPage: 583 },
  { number: 80, name: "\u018Fb\u0259s\u0259", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0639\u064E\u0628\u064E\u0633\u064E", ayahCount: 42, revelationPlace: "M\u0259kk\u0259", startPage: 585 },
  { number: 81, name: "T\u0259kvir", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u062A\u0651\u064E\u0643\u06E1\u0648\u0650\u064A\u0631\u0650", ayahCount: 29, revelationPlace: "M\u0259kk\u0259", startPage: 586 },
  { number: 82, name: "\u0130nfitar", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0627\u0646\u0641\u0650\u0637\u064E\u0627\u0631\u0650", ayahCount: 19, revelationPlace: "M\u0259kk\u0259", startPage: 587 },
  { number: 83, name: "M\xFCt\u0259ffifin", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0645\u064F\u0637\u064E\u0641\u0651\u0650\u0641\u0650\u064A\u0646\u064E", ayahCount: 36, revelationPlace: "M\u0259kk\u0259", startPage: 587 },
  { number: 84, name: "\u0130n\u015Fiqaq", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0627\u0646\u0634\u0650\u0642\u064E\u0627\u0642\u0650", ayahCount: 25, revelationPlace: "M\u0259kk\u0259", startPage: 589 },
  { number: 85, name: "B\xFCruc", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0628\u064F\u0631\u064F\u0648\u062C\u0650", ayahCount: 22, revelationPlace: "M\u0259kk\u0259", startPage: 590 },
  { number: 86, name: "Tariq", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0637\u0651\u064E\u0627\u0631\u0650\u0642\u0650", ayahCount: 17, revelationPlace: "M\u0259kk\u0259", startPage: 591 },
  { number: 87, name: "\u018Fla", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0623\u064E\u0639\u06E1\u0644\u064E\u0649\u0670", ayahCount: 19, revelationPlace: "M\u0259kk\u0259", startPage: 591 },
  { number: 88, name: "\u011Ea\u015Fiy\u0259", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u063A\u064E\u0627\u0634\u0650\u064A\u064E\u0629\u0650", ayahCount: 26, revelationPlace: "M\u0259kk\u0259", startPage: 592 },
  { number: 89, name: "F\u0259cr", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0641\u064E\u062C\u06E1\u0631\u0650", ayahCount: 30, revelationPlace: "M\u0259kk\u0259", startPage: 593 },
  { number: 90, name: "B\u0259l\u0259d", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0628\u064E\u0644\u064E\u062F\u0650", ayahCount: 20, revelationPlace: "M\u0259kk\u0259", startPage: 594 },
  { number: 91, name: "\u015E\u0259ms", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0634\u0651\u064E\u0645\u06E1\u0633\u0650", ayahCount: 15, revelationPlace: "M\u0259kk\u0259", startPage: 595 },
  { number: 92, name: "Leyl", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0644\u0651\u064E\u064A\u06E1\u0644\u0650", ayahCount: 21, revelationPlace: "M\u0259kk\u0259", startPage: 595 },
  { number: 93, name: "Duha", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0636\u0651\u064F\u062D\u064E\u0649\u0670", ayahCount: 11, revelationPlace: "M\u0259kk\u0259", startPage: 596 },
  { number: 94, name: "\u0130n\u015Firah", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0634\u0651\u064E\u0631\u06E1\u062D\u0650", ayahCount: 8, revelationPlace: "M\u0259kk\u0259", startPage: 596 },
  { number: 95, name: "Tin", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u062A\u0651\u0650\u064A\u0646\u0650", ayahCount: 8, revelationPlace: "M\u0259kk\u0259", startPage: 597 },
  { number: 96, name: "\u018Fl\u0259q", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0639\u064E\u0644\u064E\u0642\u0650", ayahCount: 19, revelationPlace: "M\u0259kk\u0259", startPage: 597 },
  { number: 97, name: "Q\u0259dr", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0642\u064E\u062F\u06E1\u0631\u0650", ayahCount: 5, revelationPlace: "M\u0259kk\u0259", startPage: 598 },
  { number: 98, name: "B\u0259yyin\u0259", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0628\u064E\u064A\u0651\u0650\u0646\u064E\u0629\u0650", ayahCount: 8, revelationPlace: "M\u0259din\u0259", startPage: 598 },
  { number: 99, name: "Z\u0259lz\u0259l\u0259", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0632\u0651\u064E\u0644\u06E1\u0632\u064E\u0644\u064E\u0629\u0650", ayahCount: 8, revelationPlace: "M\u0259din\u0259", startPage: 599 },
  { number: 100, name: "Adiyat", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0639\u064E\u0627\u062F\u0650\u064A\u064E\u0627\u062A\u0650", ayahCount: 11, revelationPlace: "M\u0259kk\u0259", startPage: 599 },
  { number: 101, name: "Qari\u0259", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0642\u064E\u0627\u0631\u0650\u0639\u064E\u0629\u0650", ayahCount: 11, revelationPlace: "M\u0259kk\u0259", startPage: 600 },
  { number: 102, name: "T\u0259kas\xFCr", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u062A\u0651\u064E\u0643\u064E\u0627\u062B\u064F\u0631\u0650", ayahCount: 8, revelationPlace: "M\u0259kk\u0259", startPage: 600 },
  { number: 103, name: "\u018Fsr", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0639\u064E\u0635\u06E1\u0631\u0650", ayahCount: 3, revelationPlace: "M\u0259kk\u0259", startPage: 601 },
  { number: 104, name: "H\xFCm\u0259z\u0259", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0647\u064F\u0645\u064E\u0632\u064E\u0629\u0650", ayahCount: 9, revelationPlace: "M\u0259kk\u0259", startPage: 601 },
  { number: 105, name: "Fil", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0641\u0650\u064A\u0644\u0650", ayahCount: 5, revelationPlace: "M\u0259kk\u0259", startPage: 601 },
  { number: 106, name: "Q\xFCrey\u015F", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0642\u064F\u0631\u064E\u064A\u06E1\u0634\u064D", ayahCount: 4, revelationPlace: "M\u0259kk\u0259", startPage: 602 },
  { number: 107, name: "Maun", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0645\u064E\u0627\u0639\u064F\u0648\u0646\u0650", ayahCount: 7, revelationPlace: "M\u0259kk\u0259", startPage: 602 },
  { number: 108, name: "K\xF6vs\u0259r", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0643\u064E\u0648\u06E1\u062B\u064E\u0631\u0650", ayahCount: 3, revelationPlace: "M\u0259kk\u0259", startPage: 602 },
  { number: 109, name: "Kafirun", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0643\u064E\u0627\u0641\u0650\u0631\u064F\u0648\u0646\u064E", ayahCount: 6, revelationPlace: "M\u0259kk\u0259", startPage: 603 },
  { number: 110, name: "N\u0259sr", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0646\u0651\u064E\u0635\u06E1\u0631\u0650", ayahCount: 3, revelationPlace: "M\u0259din\u0259", startPage: 603 },
  { number: 111, name: "M\u0259s\u0259d", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0645\u064E\u0633\u064E\u062F\u0650", ayahCount: 5, revelationPlace: "M\u0259kk\u0259", startPage: 603 },
  { number: 112, name: "\u0130xlas", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0625\u0650\u062E\u06E1\u0644\u064E\u0627\u0635\u0650", ayahCount: 4, revelationPlace: "M\u0259kk\u0259", startPage: 604 },
  { number: 113, name: "F\u0259l\u0259q", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0641\u064E\u0644\u064E\u0642\u0650", ayahCount: 5, revelationPlace: "M\u0259kk\u0259", startPage: 604 },
  { number: 114, name: "Nas", arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0646\u0651\u064E\u0627\u0633\u0650", ayahCount: 6, revelationPlace: "M\u0259kk\u0259", startPage: 604 }
];
var JUZ_PAGE_RANGES = [
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
  { juz: 30, startPage: 582, endPage: 604 }
];
function getSurahByNumber(surahNumber) {
  return SURAH_CATALOG.find((s) => s.number === surahNumber);
}
function getJuzForPage(pageNumber) {
  const found = JUZ_PAGE_RANGES.find(
    (range) => pageNumber >= range.startPage && pageNumber <= range.endPage
  );
  return found?.juz ?? 1;
}
function formatAzerbaijaniOrdinal(n) {
  const abs = Math.abs(Math.trunc(n));
  const unit = abs % 10;
  if (unit === 6) return `${n}-c\u0131`;
  if (unit === 9) return `${n}-cu`;
  if (unit === 3 || unit === 4) return `${n}-c\xFC`;
  if (unit === 1 || unit === 2 || unit === 5 || unit === 7 || unit === 8) return `${n}-ci`;
  const tens = abs % 100;
  if (tens === 10 || tens === 30) return `${n}-cu`;
  if (tens === 40 || tens === 60 || tens === 90) return `${n}-c\u0131`;
  if (tens === 20 || tens === 50 || tens === 70 || tens === 80) return `${n}-ci`;
  const hundreds = abs % 1e3;
  if (hundreds >= 100) return `${n}-c\xFC`;
  return `${n}-ci`;
}
function parseQuranComPageVerses(payload) {
  const obj = payload;
  if (!Array.isArray(obj?.verses)) return [];
  return obj.verses.map((v) => {
    const [surahPart, ayahPart] = String(v.verse_key ?? "").split(":");
    const surahNumber = Number.parseInt(surahPart, 10);
    const ayahNumber = Number.parseInt(ayahPart, 10) || (v.verse_number ?? 1);
    if (Number.isNaN(surahNumber) || surahNumber < 1 || surahNumber > TOTAL_QURAN_SURAHS) {
      return null;
    }
    return {
      surahNumber,
      ayahNumber,
      juzNumber: v.juz_number ?? 1,
      arabicText: String(v.text_uthmani ?? "").trim()
    };
  }).filter((item) => item !== null);
}
function mergePageAyahsWithMusayev(pageNumber, uthmaniAyahs, surahTranslations) {
  const surahMap = /* @__PURE__ */ new Map();
  let editionVersion = "1.0.4";
  for (const [surahNum, payload] of surahTranslations.entries()) {
    if (payload.editionVersion) {
      editionVersion = payload.editionVersion;
    }
    const ayahMap = /* @__PURE__ */ new Map();
    for (const a of payload.ayahs) {
      ayahMap.set(a.ayahNumber, a);
    }
    surahMap.set(surahNum, ayahMap);
  }
  const seenSurahs = /* @__PURE__ */ new Set();
  const surahsOnPage = [];
  const ayahs = uthmaniAyahs.map((item) => {
    const surahMeta = getSurahByNumber(item.surahNumber);
    const surahName = surahMeta ? `${surahMeta.name} sur\u0259si` : `Sur\u0259 ${item.surahNumber}`;
    const arabicSurahName = surahMeta?.arabicName ?? "";
    if (!seenSurahs.has(item.surahNumber)) {
      seenSurahs.add(item.surahNumber);
      surahsOnPage.push({
        surahNumber: item.surahNumber,
        surahName,
        arabicName: arabicSurahName
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
      translation: translated?.translation ?? "",
      footnotes: translated?.footnotes ?? ""
    };
  });
  const juzNumber = uthmaniAyahs[0]?.juzNumber ?? getJuzForPage(pageNumber);
  return {
    pageNumber,
    juzNumber,
    surahsOnPage,
    translatorName: "\u018Flixan Musayev",
    editionVersion,
    ayahs
  };
}
function parseQuranComChapterVersesPages(payload) {
  const result = /* @__PURE__ */ new Map();
  const obj = payload;
  if (!Array.isArray(obj?.verses)) return result;
  for (const v of obj.verses) {
    const ayahFromKey = String(v.verse_key ?? "").split(":")[1];
    const ayahNumber = Number.parseInt(ayahFromKey ?? "", 10) || (v.verse_number ?? 0);
    const pageNumber = Number(v.page_number ?? 0);
    const juzNumber = Number(v.juz_number ?? 0);
    if (ayahNumber > 0 && pageNumber >= 1 && pageNumber <= TOTAL_QURAN_PAGES) {
      result.set(ayahNumber, {
        pageNumber,
        juzNumber: juzNumber >= 1 && juzNumber <= 30 ? juzNumber : getJuzForPage(pageNumber)
      });
    }
  }
  return result;
}
function attachMushafPagesToSurah(payload, pageMap) {
  if (pageMap.size === 0) return payload;
  return {
    ...payload,
    ayahs: payload.ayahs.map((ayah) => {
      const meta = pageMap.get(ayah.ayahNumber);
      if (!meta) return ayah;
      return {
        ...ayah,
        pageNumber: meta.pageNumber,
        juzNumber: meta.juzNumber
      };
    })
  };
}
function summarizeMushafPageContents(payload) {
  if (!payload.ayahs.length) return "";
  const groups = [];
  for (const ayah of payload.ayahs) {
    const last = groups[groups.length - 1];
    if (last && last.surahName === ayah.surahName) {
      last.end = ayah.ayahNumber;
    } else {
      groups.push({
        surahName: ayah.surahName,
        start: ayah.ayahNumber,
        end: ayah.ayahNumber
      });
    }
  }
  return groups.map(
    (g) => g.start === g.end ? `${g.surahName} (${g.start})` : `${g.surahName} (${g.start}\u2013${g.end})`
  ).join(", ");
}

// src/lib/muhaffiz.ts
var MUHAFFIZ_RECITERS = [
  {
    id: "Alafasy_128kbps",
    code: "afasy",
    label: "Mi\u015Fari R\u0259\u015Fid \u0259l-\u018Ff\u0259si",
    shortLabel: "Mi\u015Fari \u018Ff\u0259si",
    surahCdnSlug: "mishary-alafasy/r1"
  },
  {
    id: "MaherAlMuaiqly128kbps",
    code: "maher",
    label: "Mahir \u0259l-Mu\u0259yqili",
    shortLabel: "Mahir Mu\u0259yqili",
    surahCdnSlug: "maher-muaiqly/r1"
  },
  {
    id: "Yasser_Ad-Dussary_128kbps",
    code: "yasser",
    label: "Yasir \u0259d-D\xF6vs\u0259ri",
    shortLabel: "Yasir D\xF6vs\u0259ri",
    surahCdnSlug: "yasser-dosari/r1"
  },
  {
    id: "Husary_128kbps",
    code: "husary",
    label: "Mahmud X\u0259lil \u0259l-Hus\u0259ri",
    shortLabel: "Mahmud Hus\u0259ri",
    surahCdnSlug: "mahmoud-husary/r1"
  },
  {
    id: "Minshawy_Murattal_128kbps",
    code: "minshawy",
    label: "M\u0259h\u0259mm\u0259d Siddiq \u0259l-Min\u015Favi",
    shortLabel: "Siddiq Min\u015Favi",
    surahCdnSlug: "muhammad-minshawi/r1"
  },
  {
    id: "Abdul_Basit_Murattal_192kbps",
    code: "basit",
    label: "\u018Fbd\xFClbasit \u018Fbd\xFCss\u0259m\u0259d",
    shortLabel: "\u018Fbd\xFClbasit",
    surahCdnSlug: "abdulbasit-abdulsamad/r3"
  }
];
function resolveMuhaffizReciter(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return MUHAFFIZ_RECITERS[0];
  const direct = MUHAFFIZ_RECITERS.find(
    (r) => r.id === raw || r.code === raw.toLowerCase()
  );
  if (direct) return direct;
  const clean = raw.toLowerCase().replace(/ə/g, "e").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").trim();
  if (clean.includes("maher") || clean.includes("mahir") || clean.includes("mueyq")) {
    return MUHAFFIZ_RECITERS[1];
  }
  if (clean.includes("yass") || clean.includes("yasir") || clean.includes("dovs") || clean.includes("duss")) {
    return MUHAFFIZ_RECITERS[2];
  }
  if (clean.includes("hus") || clean.includes("xalil") || clean.includes("xelil")) {
    return MUHAFFIZ_RECITERS[3];
  }
  if (clean.includes("minsh") || clean.includes("mins") || clean.includes("siddiq")) {
    return MUHAFFIZ_RECITERS[4];
  }
  if (clean.includes("basit") || clean.includes("abdul") || clean.includes("ebdul")) {
    return MUHAFFIZ_RECITERS[5];
  }
  if (clean.includes("afas") || clean.includes("efes") || clean.includes("misar") || clean.includes("mishar")) {
    return MUHAFFIZ_RECITERS[0];
  }
  return MUHAFFIZ_RECITERS[0];
}
var SURAH_META_BY_NUMBER = new Map(SURAH_CATALOG.map((s) => [s.number, s]));
function splitWaqfMark(rawWord) {
  const trimmed = rawWord.trim();
  const match = trimmed.match(/^(.*?)(?:\s+([\u06D6-\u06DC\u06DE\u06E9]+))$/);
  if (match && match[1].trim().length > 0) {
    return {
      stemText: match[1].trim(),
      waqfMark: match[2].trim()
    };
  }
  return {
    stemText: trimmed,
    waqfMark: ""
  };
}
function splitCodeV2Waqf(codeV2, hasTextWaqf) {
  const trimmed = (codeV2 ?? "").trim();
  if (!trimmed) return { codeV2Stem: "", codeV2Waqf: "" };
  if (hasTextWaqf) {
    const chars = Array.from(trimmed);
    if (chars.length >= 2) {
      const waqf = chars.pop() ?? "";
      return {
        codeV2Stem: chars.join(""),
        codeV2Waqf: waqf
      };
    }
  }
  return {
    codeV2Stem: trimmed,
    codeV2Waqf: ""
  };
}
function clampMuhaffizPage(page) {
  if (!Number.isFinite(page)) return 1;
  return Math.min(TOTAL_QURAN_PAGES, Math.max(1, Math.trunc(page)));
}
function ayahKey(ayah) {
  return `${ayah.surahNumber}:${ayah.ayahNumber}`;
}
function toArabicIndicDigits(value) {
  const digits = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
  return String(Math.max(0, Math.trunc(value))).split("").map((ch) => digits[Number(ch)] ?? ch).join("");
}
function splitAyahWords(arabicText) {
  return arabicText.trim().split(/\s+/).filter((w) => w.length > 0 && !/^[۞۩﴿﴾]$/.test(w));
}
function groupPageAyahsBySurah(ayahs) {
  const groups = [];
  for (const ayah of ayahs) {
    const prev = groups[groups.length - 1];
    if (!prev || prev.surahNumber !== ayah.surahNumber) {
      groups.push({
        surahNumber: ayah.surahNumber,
        surahName: ayah.surahName,
        arabicSurahName: ayah.arabicSurahName,
        startsAtBeginning: ayah.ayahNumber === 1,
        ayahs: [ayah]
      });
    } else {
      prev.ayahs.push(ayah);
    }
  }
  return groups;
}
function groupTokensIntoMushafRows(tokens) {
  const lineBuckets = /* @__PURE__ */ new Map();
  const surahStarts = /* @__PURE__ */ new Map();
  for (const token of tokens) {
    const arr = lineBuckets.get(token.lineNumber) ?? [];
    arr.push(token);
    lineBuckets.set(token.lineNumber, arr);
    if (token.ayahNumber === 1 && !surahStarts.has(token.surahNumber)) {
      surahStarts.set(token.surahNumber, token.lineNumber);
    }
  }
  const rows = [];
  for (const [surahNumber, firstWordLine] of surahStarts.entries()) {
    const meta = SURAH_META_BY_NUMBER.get(surahNumber);
    const hasSeparateBismillah = surahNumber !== 1 && surahNumber !== 9;
    const headerLine = hasSeparateBismillah ? Math.max(1, firstWordLine - 2) : Math.max(1, firstWordLine - 1);
    rows.push({
      kind: "surah-header",
      lineNumber: headerLine,
      surahNumber,
      surahName: meta?.name ?? `${surahNumber}-ci sur\u0259`,
      arabicSurahName: meta?.arabicName ?? `\u0633\u0648\u0631\u0629 ${surahNumber}`
    });
    if (hasSeparateBismillah) {
      rows.push({
        kind: "bismillah",
        lineNumber: Math.max(1, firstWordLine - 1),
        surahNumber
      });
    }
  }
  for (const [lineNumber, lineTokens] of lineBuckets.entries()) {
    rows.push({
      kind: "words",
      lineNumber,
      tokens: lineTokens
    });
  }
  const kindOrder = {
    "surah-header": 0,
    bismillah: 1,
    words: 2
  };
  rows.sort((a, b) => {
    if (a.lineNumber !== b.lineNumber) return a.lineNumber - b.lineNumber;
    return kindOrder[a.kind] - kindOrder[b.kind];
  });
  return rows;
}
function buildTokensFromQuranComVerses(verses) {
  const tokens = [];
  for (const verse of verses) {
    const [rawSurah, rawAyah] = String(verse.verse_key ?? "1:1").split(":");
    const surahNumber = Number.parseInt(rawSurah, 10) || 1;
    const ayahNumber = Number.parseInt(rawAyah, 10) || 1;
    const key = `${surahNumber}:${ayahNumber}`;
    const rawWords = Array.isArray(verse.words) ? verse.words : [];
    let wordIdx = 0;
    for (let i = 0; i < rawWords.length; i++) {
      const w = rawWords[i];
      const charType = w.char_type_name === "end" ? "end" : "word";
      const rawText = String(w.text_uthmani ?? w.text ?? "").trim();
      const rawCodeV2 = String(w.code_v1 ?? w.code_v2 ?? "").trim();
      if (!rawText && !rawCodeV2) continue;
      const lineNumber = Math.max(1, Math.min(15, Number(w.line_number) || 1));
      const { stemText, waqfMark } = charType === "end" ? { stemText: rawText, waqfMark: "" } : splitWaqfMark(rawText);
      const { codeV2Stem, codeV2Waqf } = charType === "end" ? { codeV2Stem: rawCodeV2, codeV2Waqf: "" } : splitCodeV2Waqf(rawCodeV2, waqfMark.length > 0);
      const isFirstWordOfAyah = charType === "word" && wordIdx === 0;
      if (charType === "word") wordIdx++;
      tokens.push({
        id: `${key}-${i}`,
        surahNumber,
        ayahNumber,
        ayahKey: key,
        wordIndex: charType === "word" ? wordIdx - 1 : -1,
        isFirstWordOfAyah,
        textUthmani: rawText,
        stemText,
        waqfMark,
        codeV2Full: rawCodeV2,
        codeV2Stem,
        codeV2Waqf,
        lineNumber,
        charType
      });
    }
  }
  return tokens;
}
function buildSyntheticMuhaffizRows(pageNumber, ayahs) {
  const groups = groupPageAyahsBySurah(ayahs);
  const rows = [];
  let currentLine = pageNumber <= 2 ? 2 : 1;
  for (const group of groups) {
    if (group.startsAtBeginning) {
      rows.push({
        kind: "surah-header",
        lineNumber: currentLine++,
        surahNumber: group.surahNumber,
        surahName: group.surahName,
        arabicSurahName: group.arabicSurahName
      });
      if (group.surahNumber !== 1 && group.surahNumber !== 9) {
        rows.push({
          kind: "bismillah",
          lineNumber: currentLine++,
          surahNumber: group.surahNumber
        });
      }
    }
    let lineWords = [];
    for (const ayah of group.ayahs) {
      const key = ayahKey(ayah);
      const words = splitAyahWords(ayah.arabicText);
      words.forEach((word, wIdx) => {
        const { stemText, waqfMark } = splitWaqfMark(word);
        lineWords.push({
          id: `${key}-w-${wIdx}`,
          surahNumber: ayah.surahNumber,
          ayahNumber: ayah.ayahNumber,
          ayahKey: key,
          wordIndex: wIdx,
          isFirstWordOfAyah: wIdx === 0,
          textUthmani: word,
          stemText,
          waqfMark,
          codeV2Full: "",
          codeV2Stem: "",
          codeV2Waqf: "",
          lineNumber: currentLine,
          charType: "word"
        });
        if (lineWords.length >= 8) {
          rows.push({ kind: "words", lineNumber: currentLine, tokens: lineWords });
          currentLine++;
          lineWords = [];
        }
      });
      lineWords.push({
        id: `${key}-end`,
        surahNumber: ayah.surahNumber,
        ayahNumber: ayah.ayahNumber,
        ayahKey: key,
        wordIndex: -1,
        isFirstWordOfAyah: false,
        textUthmani: toArabicIndicDigits(ayah.ayahNumber),
        stemText: toArabicIndicDigits(ayah.ayahNumber),
        waqfMark: "",
        codeV2Full: "",
        codeV2Stem: "",
        codeV2Waqf: "",
        lineNumber: currentLine,
        charType: "end"
      });
      if (lineWords.length >= 8 || pageNumber === 1) {
        rows.push({ kind: "words", lineNumber: currentLine, tokens: lineWords });
        currentLine++;
        lineWords = [];
      }
    }
    if (lineWords.length > 0) {
      rows.push({ kind: "words", lineNumber: currentLine, tokens: lineWords });
      currentLine++;
    }
  }
  return rows;
}
function getEveryAyahAudioUrl(surahNumber, ayahNumber, reciter = "Alafasy_128kbps") {
  const s = String(Math.max(1, Math.min(114, surahNumber))).padStart(3, "0");
  const a = String(Math.max(1, ayahNumber)).padStart(3, "0");
  return `https://everyayah.com/data/${reciter}/${s}${a}.mp3`;
}
function getFullSurahAudioUrl(surahNumber, reciter = "Alafasy_128kbps") {
  const spec = resolveMuhaffizReciter(reciter);
  const s = String(Math.max(1, Math.min(114, surahNumber))).padStart(3, "0");
  return `https://cdn.mp3quran.net/audio/${spec.surahCdnSlug}/${s}.mp3`;
}
var FATIHAT_PAGE_1_VERSES_SEED = [
  {
    verse_key: "1:1",
    juz_number: 1,
    words: [
      { code_v1: "\uFB51", text_uthmani: "\u0628\u0650\u0633\u0652\u0645\u0650", line_number: 2, char_type_name: "word" },
      { code_v1: "\uFB52", text_uthmani: "\u0671\u0644\u0644\u064E\u0651\u0647\u0650", line_number: 2, char_type_name: "word" },
      { code_v1: "\uFB53", text_uthmani: "\u0671\u0644\u0631\u064E\u0651\u062D\u0652\u0645\u064E\u0640\u0670\u0646\u0650", line_number: 2, char_type_name: "word" },
      { code_v1: "\uFB54", text_uthmani: "\u0671\u0644\u0631\u064E\u0651\u062D\u0650\u064A\u0645\u0650", line_number: 2, char_type_name: "word" },
      { code_v1: "\uFB55", text_uthmani: "\u0661", line_number: 2, char_type_name: "end" }
    ]
  },
  {
    verse_key: "1:2",
    juz_number: 1,
    words: [
      { code_v1: "\uFB56", text_uthmani: "\u0671\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F", line_number: 3, char_type_name: "word" },
      { code_v1: "\uFB57", text_uthmani: "\u0644\u0650\u0644\u064E\u0651\u0647\u0650", line_number: 3, char_type_name: "word" },
      { code_v1: "\uFB58", text_uthmani: "\u0631\u064E\u0628\u0650\u0651", line_number: 3, char_type_name: "word" },
      { code_v1: "\uFB59", text_uthmani: "\u0671\u0644\u0652\u0639\u064E\u0640\u0670\u0644\u064E\u0645\u0650\u064A\u0646\u064E", line_number: 3, char_type_name: "word" },
      { code_v1: "\uFB5A", text_uthmani: "\u0662", line_number: 3, char_type_name: "end" }
    ]
  },
  {
    verse_key: "1:3",
    juz_number: 1,
    words: [
      { code_v1: "\uFB5B", text_uthmani: "\u0671\u0644\u0631\u064E\u0651\u062D\u0652\u0645\u064E\u0640\u0670\u0646\u0650", line_number: 4, char_type_name: "word" },
      { code_v1: "\uFB5C", text_uthmani: "\u0671\u0644\u0631\u064E\u0651\u062D\u0650\u064A\u0645\u0650", line_number: 4, char_type_name: "word" },
      { code_v1: "\uFB5D", text_uthmani: "\u0663", line_number: 4, char_type_name: "end" }
    ]
  },
  {
    verse_key: "1:4",
    juz_number: 1,
    words: [
      { code_v1: "\uFB5E", text_uthmani: "\u0645\u064E\u0640\u0670\u0644\u0650\u0643\u0650", line_number: 4, char_type_name: "word" },
      { code_v1: "\uFB5F", text_uthmani: "\u064A\u064E\u0648\u0652\u0645\u0650", line_number: 4, char_type_name: "word" },
      { code_v1: "\uFB60", text_uthmani: "\u0671\u0644\u062F\u0650\u0651\u064A\u0646\u0650", line_number: 4, char_type_name: "word" },
      { code_v1: "\uFB61", text_uthmani: "\u0664", line_number: 4, char_type_name: "end" }
    ]
  },
  {
    verse_key: "1:5",
    juz_number: 1,
    words: [
      { code_v1: "\uFB62", text_uthmani: "\u0625\u0650\u064A\u064E\u0651\u0627\u0643\u064E", line_number: 5, char_type_name: "word" },
      { code_v1: "\uFB63", text_uthmani: "\u0646\u064E\u0639\u0652\u0628\u064F\u062F\u064F", line_number: 5, char_type_name: "word" },
      { code_v1: "\uFB64", text_uthmani: "\u0648\u064E\u0625\u0650\u064A\u064E\u0651\u0627\u0643\u064E", line_number: 5, char_type_name: "word" },
      { code_v1: "\uFB65", text_uthmani: "\u0646\u064E\u0633\u0652\u062A\u064E\u0639\u0650\u064A\u0646\u064F", line_number: 5, char_type_name: "word" },
      { code_v1: "\uFB66", text_uthmani: "\u0665", line_number: 5, char_type_name: "end" }
    ]
  },
  {
    verse_key: "1:6",
    juz_number: 1,
    words: [
      { code_v1: "\uFB67", text_uthmani: "\u0671\u0647\u0652\u062F\u0650\u0646\u064E\u0627", line_number: 5, char_type_name: "word" },
      { code_v1: "\uFB68", text_uthmani: "\u0671\u0644\u0635\u0650\u0651\u0631\u064E\u0670\u0637\u064E", line_number: 6, char_type_name: "word" },
      { code_v1: "\uFB69", text_uthmani: "\u0671\u0644\u0652\u0645\u064F\u0633\u0652\u062A\u064E\u0642\u0650\u064A\u0645\u064E", line_number: 6, char_type_name: "word" },
      { code_v1: "\uFB6A", text_uthmani: "\u0666", line_number: 6, char_type_name: "end" }
    ]
  },
  {
    verse_key: "1:7",
    juz_number: 1,
    words: [
      { code_v1: "\uFB6B", text_uthmani: "\u0635\u0650\u0631\u064E\u0670\u0637\u064E", line_number: 6, char_type_name: "word" },
      { code_v1: "\uFB6C", text_uthmani: "\u0671\u0644\u064E\u0651\u0630\u0650\u064A\u0646\u064E", line_number: 6, char_type_name: "word" },
      { code_v1: "\uFB6D", text_uthmani: "\u0623\u064E\u0646\u0652\u0639\u064E\u0645\u0652\u062A\u064E", line_number: 6, char_type_name: "word" },
      { code_v1: "\uFB6E", text_uthmani: "\u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650\u0645\u0652", line_number: 7, char_type_name: "word" },
      { code_v1: "\uFB6F", text_uthmani: "\u063A\u064E\u064A\u0652\u0631\u0650", line_number: 7, char_type_name: "word" },
      { code_v1: "\uFB70", text_uthmani: "\u0671\u0644\u0652\u0645\u064E\u063A\u0652\u0636\u064F\u0648\u0628\u0650", line_number: 7, char_type_name: "word" },
      { code_v1: "\uFB71", text_uthmani: "\u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650\u0645\u0652", line_number: 7, char_type_name: "word" },
      { code_v1: "\uFB72", text_uthmani: "\u0648\u064E\u0644\u064E\u0627", line_number: 8, char_type_name: "word" },
      { code_v1: "\uFB73", text_uthmani: "\u0671\u0644\u0636\u064E\u0651\u0622\u0644\u0650\u0651\u064A\u0646\u064E", line_number: 8, char_type_name: "word" },
      { code_v1: "\uFB74", text_uthmani: "\u0667", line_number: 8, char_type_name: "end" }
    ]
  }
];
var FATIHAT_PAGE_1_SEED = {
  pageNumber: 1,
  juzNumber: 1,
  surahsOnPage: [
    {
      surahNumber: 1,
      surahName: "Fatih\u0259",
      arabicName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0671\u0644\u0652\u0641\u064E\u0627\u062A\u0650\u062D\u064E\u0629\u0650"
    }
  ],
  translatorName: "\u018Flixan Musayev",
  editionVersion: "1.0.4",
  ayahs: [
    {
      surahNumber: 1,
      surahName: "Fatih\u0259",
      arabicSurahName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0671\u0644\u0652\u0641\u064E\u0627\u062A\u0650\u062D\u064E\u0629\u0650",
      ayahNumber: 1,
      juzNumber: 1,
      arabicText: "\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u064E\u0651\u0647\u0650 \u0671\u0644\u0631\u064E\u0651\u062D\u0652\u0645\u064E\u0640\u0670\u0646\u0650 \u0671\u0644\u0631\u064E\u0651\u062D\u0650\u064A\u0645\u0650",
      translation: "M\u0259rh\u0259m\u0259tli v\u0259 R\u0259hmli Allah\u0131n ad\u0131 il\u0259!",
      footnotes: ""
    },
    {
      surahNumber: 1,
      surahName: "Fatih\u0259",
      arabicSurahName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0671\u0644\u0652\u0641\u064E\u0627\u062A\u0650\u062D\u064E\u0629\u0650",
      ayahNumber: 2,
      juzNumber: 1,
      arabicText: "\u0671\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u064E\u0651\u0647\u0650 \u0631\u064E\u0628\u0650\u0651 \u0671\u0644\u0652\u0639\u064E\u0640\u0670\u0644\u064E\u0645\u0650\u064A\u0646\u064E",
      translation: "H\u0259md olsun al\u0259ml\u0259rin R\u0259bbi Allaha,",
      footnotes: ""
    },
    {
      surahNumber: 1,
      surahName: "Fatih\u0259",
      arabicSurahName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0671\u0644\u0652\u0641\u064E\u0627\u062A\u0650\u062D\u064E\u0629\u0650",
      ayahNumber: 3,
      juzNumber: 1,
      arabicText: "\u0671\u0644\u0631\u064E\u0651\u062D\u0652\u0645\u064E\u0640\u0670\u0646\u0650 \u0671\u0644\u0631\u064E\u0651\u062D\u0650\u064A\u0645\u0650",
      translation: "M\u0259rh\u0259m\u0259tli v\u0259 R\u0259hmliy\u0259,",
      footnotes: ""
    },
    {
      surahNumber: 1,
      surahName: "Fatih\u0259",
      arabicSurahName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0671\u0644\u0652\u0641\u064E\u0627\u062A\u0650\u062D\u064E\u0629\u0650",
      ayahNumber: 4,
      juzNumber: 1,
      arabicText: "\u0645\u064E\u0640\u0670\u0644\u0650\u0643\u0650 \u064A\u064E\u0648\u0652\u0645\u0650 \u0671\u0644\u062F\u0650\u0651\u064A\u0646\u0650",
      translation: "Haqq-hesab g\xFCn\xFCn\xFCn H\xF6kmdar\u0131na!",
      footnotes: ""
    },
    {
      surahNumber: 1,
      surahName: "Fatih\u0259",
      arabicSurahName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0671\u0644\u0652\u0641\u064E\u0627\u062A\u0650\u062D\u064E\u0629\u0650",
      ayahNumber: 5,
      juzNumber: 1,
      arabicText: "\u0625\u0650\u064A\u064E\u0651\u0627\u0643\u064E \u0646\u064E\u0639\u0652\u0628\u064F\u062F\u064F \u0648\u064E\u0625\u0650\u064A\u064E\u0651\u0627\u0643\u064E \u0646\u064E\u0633\u0652\u062A\u064E\u0639\u0650\u064A\u0646\u064F",
      translation: "Biz yaln\u0131z S\u0259n\u0259 ibad\u0259t edir v\u0259 yaln\u0131z S\u0259nd\u0259n k\xF6m\u0259k dil\u0259yirik.",
      footnotes: ""
    },
    {
      surahNumber: 1,
      surahName: "Fatih\u0259",
      arabicSurahName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0671\u0644\u0652\u0641\u064E\u0627\u062A\u0650\u062D\u064E\u0629\u0650",
      ayahNumber: 6,
      juzNumber: 1,
      arabicText: "\u0671\u0647\u0652\u062F\u0650\u0646\u064E\u0627 \u0671\u0644\u0635\u0650\u0651\u0631\u064E\u0670\u0637\u064E \u0671\u0644\u0652\u0645\u064F\u0633\u0652\u062A\u064E\u0642\u0650\u064A\u0645\u064E",
      translation: "Bizi do\u011Fru yola y\xF6n\u0259lt \u2014",
      footnotes: ""
    },
    {
      surahNumber: 1,
      surahName: "Fatih\u0259",
      arabicSurahName: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0671\u0644\u0652\u0641\u064E\u0627\u062A\u0650\u062D\u064E\u0629\u0650",
      ayahNumber: 7,
      juzNumber: 1,
      arabicText: "\u0635\u0650\u0631\u064E\u0670\u0637\u064E \u0671\u0644\u064E\u0651\u0630\u0650\u064A\u0646\u064E \u0623\u064E\u0646\u0652\u0639\u064E\u0645\u0652\u062A\u064E \u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650\u0645\u0652 \u063A\u064E\u064A\u0652\u0631\u0650 \u0671\u0644\u0652\u0645\u064E\u063A\u0652\u0636\u064F\u0648\u0628\u0650 \u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650\u0645\u0652 \u0648\u064E\u0644\u064E\u0627 \u0671\u0644\u0636\u064E\u0651\u0622\u0644\u0650\u0651\u064A\u0646\u064E",
      translation: "nem\u0259t b\u0259x\u015F etdiyin \u015F\u0259xsl\u0259rin yoluna, q\u0259z\u0259b\u0259 u\u011Fram\u0131\u015Flar\u0131n v\u0259 azm\u0131\u015Flar\u0131n yoluna deyil!",
      footnotes: ""
    }
  ]
};
var FATIHAT_PAGE_1_MUHAFFIZ_SEED = {
  ...FATIHAT_PAGE_1_SEED,
  rows: groupTokensIntoMushafRows(buildTokensFromQuranComVerses(FATIHAT_PAGE_1_VERSES_SEED)),
  centeredPage: true
};

// src/data/rubHizbData.ts
var RAW_RUB_HIZB_LIST = [
  { rub: 1, surah: 1, ayah: 1, page: 1 },
  { rub: 2, surah: 2, ayah: 26, page: 5 },
  { rub: 3, surah: 2, ayah: 44, page: 7 },
  { rub: 4, surah: 2, ayah: 60, page: 9 },
  { rub: 5, surah: 2, ayah: 75, page: 11 },
  { rub: 6, surah: 2, ayah: 92, page: 14 },
  { rub: 7, surah: 2, ayah: 106, page: 17 },
  { rub: 8, surah: 2, ayah: 124, page: 19 },
  { rub: 9, surah: 2, ayah: 142, page: 22 },
  { rub: 10, surah: 2, ayah: 158, page: 24 },
  { rub: 11, surah: 2, ayah: 177, page: 27 },
  { rub: 12, surah: 2, ayah: 189, page: 29 },
  { rub: 13, surah: 2, ayah: 203, page: 32 },
  { rub: 14, surah: 2, ayah: 219, page: 34 },
  { rub: 15, surah: 2, ayah: 233, page: 37 },
  { rub: 16, surah: 2, ayah: 243, page: 39 },
  { rub: 17, surah: 2, ayah: 253, page: 42 },
  { rub: 18, surah: 2, ayah: 263, page: 44 },
  { rub: 19, surah: 2, ayah: 272, page: 46 },
  { rub: 20, surah: 2, ayah: 283, page: 49 },
  { rub: 21, surah: 3, ayah: 15, page: 51 },
  { rub: 22, surah: 3, ayah: 33, page: 54 },
  { rub: 23, surah: 3, ayah: 52, page: 56 },
  { rub: 24, surah: 3, ayah: 75, page: 59 },
  { rub: 25, surah: 3, ayah: 93, page: 62 },
  { rub: 26, surah: 3, ayah: 113, page: 64 },
  { rub: 27, surah: 3, ayah: 133, page: 67 },
  { rub: 28, surah: 3, ayah: 153, page: 69 },
  { rub: 29, surah: 3, ayah: 171, page: 72 },
  { rub: 30, surah: 3, ayah: 186, page: 74 },
  { rub: 31, surah: 4, ayah: 1, page: 77 },
  { rub: 32, surah: 4, ayah: 12, page: 79 },
  { rub: 33, surah: 4, ayah: 24, page: 82 },
  { rub: 34, surah: 4, ayah: 36, page: 84 },
  { rub: 35, surah: 4, ayah: 58, page: 87 },
  { rub: 36, surah: 4, ayah: 74, page: 89 },
  { rub: 37, surah: 4, ayah: 88, page: 92 },
  { rub: 38, surah: 4, ayah: 100, page: 94 },
  { rub: 39, surah: 4, ayah: 114, page: 97 },
  { rub: 40, surah: 4, ayah: 135, page: 100 },
  { rub: 41, surah: 4, ayah: 148, page: 102 },
  { rub: 42, surah: 4, ayah: 163, page: 104 },
  { rub: 43, surah: 5, ayah: 1, page: 106 },
  { rub: 44, surah: 5, ayah: 12, page: 109 },
  { rub: 45, surah: 5, ayah: 27, page: 112 },
  { rub: 46, surah: 5, ayah: 41, page: 114 },
  { rub: 47, surah: 5, ayah: 51, page: 117 },
  { rub: 48, surah: 5, ayah: 67, page: 119 },
  { rub: 49, surah: 5, ayah: 82, page: 121 },
  { rub: 50, surah: 5, ayah: 97, page: 124 },
  { rub: 51, surah: 5, ayah: 109, page: 126 },
  { rub: 52, surah: 6, ayah: 13, page: 129 },
  { rub: 53, surah: 6, ayah: 36, page: 132 },
  { rub: 54, surah: 6, ayah: 59, page: 134 },
  { rub: 55, surah: 6, ayah: 74, page: 137 },
  { rub: 56, surah: 6, ayah: 95, page: 140 },
  { rub: 57, surah: 6, ayah: 111, page: 142 },
  { rub: 58, surah: 6, ayah: 127, page: 144 },
  { rub: 59, surah: 6, ayah: 141, page: 146 },
  { rub: 60, surah: 6, ayah: 151, page: 148 },
  { rub: 61, surah: 7, ayah: 1, page: 151 },
  { rub: 62, surah: 7, ayah: 31, page: 154 },
  { rub: 63, surah: 7, ayah: 47, page: 156 },
  { rub: 64, surah: 7, ayah: 65, page: 158 },
  { rub: 65, surah: 7, ayah: 88, page: 162 },
  { rub: 66, surah: 7, ayah: 117, page: 164 },
  { rub: 67, surah: 7, ayah: 142, page: 167 },
  { rub: 68, surah: 7, ayah: 156, page: 170 },
  { rub: 69, surah: 7, ayah: 171, page: 173 },
  { rub: 70, surah: 7, ayah: 189, page: 175 },
  { rub: 71, surah: 8, ayah: 1, page: 177 },
  { rub: 72, surah: 8, ayah: 22, page: 179 },
  { rub: 73, surah: 8, ayah: 41, page: 182 },
  { rub: 74, surah: 8, ayah: 61, page: 184 },
  { rub: 75, surah: 9, ayah: 1, page: 187 },
  { rub: 76, surah: 9, ayah: 19, page: 189 },
  { rub: 77, surah: 9, ayah: 34, page: 192 },
  { rub: 78, surah: 9, ayah: 46, page: 194 },
  { rub: 79, surah: 9, ayah: 60, page: 196 },
  { rub: 80, surah: 9, ayah: 75, page: 199 },
  { rub: 81, surah: 9, ayah: 93, page: 201 },
  { rub: 82, surah: 9, ayah: 111, page: 204 },
  { rub: 83, surah: 9, ayah: 122, page: 206 },
  { rub: 84, surah: 10, ayah: 11, page: 209 },
  { rub: 85, surah: 10, ayah: 26, page: 212 },
  { rub: 86, surah: 10, ayah: 53, page: 214 },
  { rub: 87, surah: 10, ayah: 71, page: 217 },
  { rub: 88, surah: 10, ayah: 90, page: 219 },
  { rub: 89, surah: 11, ayah: 6, page: 222 },
  { rub: 90, surah: 11, ayah: 24, page: 224 },
  { rub: 91, surah: 11, ayah: 41, page: 226 },
  { rub: 92, surah: 11, ayah: 61, page: 228 },
  { rub: 93, surah: 11, ayah: 84, page: 231 },
  { rub: 94, surah: 11, ayah: 108, page: 233 },
  { rub: 95, surah: 12, ayah: 7, page: 236 },
  { rub: 96, surah: 12, ayah: 30, page: 238 },
  { rub: 97, surah: 12, ayah: 53, page: 242 },
  { rub: 98, surah: 12, ayah: 77, page: 244 },
  { rub: 99, surah: 12, ayah: 101, page: 247 },
  { rub: 100, surah: 13, ayah: 5, page: 249 },
  { rub: 101, surah: 13, ayah: 19, page: 252 },
  { rub: 102, surah: 13, ayah: 35, page: 254 },
  { rub: 103, surah: 14, ayah: 10, page: 256 },
  { rub: 104, surah: 14, ayah: 28, page: 259 },
  { rub: 105, surah: 15, ayah: 1, page: 262 },
  { rub: 106, surah: 15, ayah: 50, page: 264 },
  { rub: 107, surah: 16, ayah: 1, page: 267 },
  { rub: 108, surah: 16, ayah: 30, page: 270 },
  { rub: 109, surah: 16, ayah: 51, page: 272 },
  { rub: 110, surah: 16, ayah: 75, page: 275 },
  { rub: 111, surah: 16, ayah: 90, page: 277 },
  { rub: 112, surah: 16, ayah: 111, page: 280 },
  { rub: 113, surah: 17, ayah: 1, page: 282 },
  { rub: 114, surah: 17, ayah: 23, page: 284 },
  { rub: 115, surah: 17, ayah: 50, page: 287 },
  { rub: 116, surah: 17, ayah: 70, page: 289 },
  { rub: 117, surah: 17, ayah: 99, page: 292 },
  { rub: 118, surah: 18, ayah: 17, page: 295 },
  { rub: 119, surah: 18, ayah: 32, page: 297 },
  { rub: 120, surah: 18, ayah: 51, page: 299 },
  { rub: 121, surah: 18, ayah: 75, page: 302 },
  { rub: 122, surah: 18, ayah: 99, page: 304 },
  { rub: 123, surah: 19, ayah: 22, page: 306 },
  { rub: 124, surah: 19, ayah: 59, page: 309 },
  { rub: 125, surah: 20, ayah: 1, page: 312 },
  { rub: 126, surah: 20, ayah: 55, page: 315 },
  { rub: 127, surah: 20, ayah: 83, page: 317 },
  { rub: 128, surah: 20, ayah: 111, page: 319 },
  { rub: 129, surah: 21, ayah: 1, page: 322 },
  { rub: 130, surah: 21, ayah: 29, page: 324 },
  { rub: 131, surah: 21, ayah: 51, page: 326 },
  { rub: 132, surah: 21, ayah: 83, page: 329 },
  { rub: 133, surah: 22, ayah: 1, page: 332 },
  { rub: 134, surah: 22, ayah: 19, page: 334 },
  { rub: 135, surah: 22, ayah: 38, page: 336 },
  { rub: 136, surah: 22, ayah: 60, page: 339 },
  { rub: 137, surah: 23, ayah: 1, page: 342 },
  { rub: 138, surah: 23, ayah: 36, page: 344 },
  { rub: 139, surah: 23, ayah: 75, page: 347 },
  { rub: 140, surah: 24, ayah: 1, page: 350 },
  { rub: 141, surah: 24, ayah: 21, page: 352 },
  { rub: 142, surah: 24, ayah: 35, page: 354 },
  { rub: 143, surah: 24, ayah: 53, page: 356 },
  { rub: 144, surah: 25, ayah: 1, page: 359 },
  { rub: 145, surah: 25, ayah: 21, page: 362 },
  { rub: 146, surah: 25, ayah: 53, page: 364 },
  { rub: 147, surah: 26, ayah: 1, page: 367 },
  { rub: 148, surah: 26, ayah: 52, page: 369 },
  { rub: 149, surah: 26, ayah: 111, page: 371 },
  { rub: 150, surah: 26, ayah: 181, page: 374 },
  { rub: 151, surah: 27, ayah: 1, page: 377 },
  { rub: 152, surah: 27, ayah: 27, page: 379 },
  { rub: 153, surah: 27, ayah: 56, page: 382 },
  { rub: 154, surah: 27, ayah: 82, page: 384 },
  { rub: 155, surah: 28, ayah: 12, page: 386 },
  { rub: 156, surah: 28, ayah: 29, page: 389 },
  { rub: 157, surah: 28, ayah: 51, page: 392 },
  { rub: 158, surah: 28, ayah: 76, page: 394 },
  { rub: 159, surah: 29, ayah: 1, page: 396 },
  { rub: 160, surah: 29, ayah: 26, page: 399 },
  { rub: 161, surah: 29, ayah: 46, page: 402 },
  { rub: 162, surah: 30, ayah: 1, page: 404 },
  { rub: 163, surah: 30, ayah: 31, page: 407 },
  { rub: 164, surah: 30, ayah: 54, page: 410 },
  { rub: 165, surah: 31, ayah: 22, page: 413 },
  { rub: 166, surah: 32, ayah: 11, page: 415 },
  { rub: 167, surah: 33, ayah: 1, page: 418 },
  { rub: 168, surah: 33, ayah: 18, page: 420 },
  { rub: 169, surah: 33, ayah: 31, page: 422 },
  { rub: 170, surah: 33, ayah: 51, page: 425 },
  { rub: 171, surah: 33, ayah: 60, page: 426 },
  { rub: 172, surah: 34, ayah: 10, page: 429 },
  { rub: 173, surah: 34, ayah: 24, page: 431 },
  { rub: 174, surah: 34, ayah: 46, page: 433 },
  { rub: 175, surah: 35, ayah: 15, page: 436 },
  { rub: 176, surah: 35, ayah: 41, page: 439 },
  { rub: 177, surah: 36, ayah: 28, page: 442 },
  { rub: 178, surah: 36, ayah: 60, page: 444 },
  { rub: 179, surah: 37, ayah: 22, page: 446 },
  { rub: 180, surah: 37, ayah: 83, page: 449 },
  { rub: 181, surah: 37, ayah: 145, page: 451 },
  { rub: 182, surah: 38, ayah: 21, page: 454 },
  { rub: 183, surah: 38, ayah: 52, page: 456 },
  { rub: 184, surah: 39, ayah: 8, page: 459 },
  { rub: 185, surah: 39, ayah: 32, page: 462 },
  { rub: 186, surah: 39, ayah: 53, page: 464 },
  { rub: 187, surah: 40, ayah: 1, page: 467 },
  { rub: 188, surah: 40, ayah: 21, page: 469 },
  { rub: 189, surah: 40, ayah: 41, page: 472 },
  { rub: 190, surah: 40, ayah: 66, page: 474 },
  { rub: 191, surah: 41, ayah: 9, page: 477 },
  { rub: 192, surah: 41, ayah: 25, page: 479 },
  { rub: 193, surah: 41, ayah: 47, page: 482 },
  { rub: 194, surah: 42, ayah: 13, page: 484 },
  { rub: 195, surah: 42, ayah: 27, page: 486 },
  { rub: 196, surah: 42, ayah: 51, page: 488 },
  { rub: 197, surah: 43, ayah: 24, page: 491 },
  { rub: 198, surah: 43, ayah: 57, page: 493 },
  { rub: 199, surah: 44, ayah: 17, page: 496 },
  { rub: 200, surah: 45, ayah: 12, page: 499 },
  { rub: 201, surah: 46, ayah: 1, page: 502 },
  { rub: 202, surah: 46, ayah: 21, page: 505 },
  { rub: 203, surah: 47, ayah: 10, page: 507 },
  { rub: 204, surah: 47, ayah: 33, page: 510 },
  { rub: 205, surah: 48, ayah: 18, page: 513 },
  { rub: 206, surah: 49, ayah: 1, page: 515 },
  { rub: 207, surah: 49, ayah: 14, page: 517 },
  { rub: 208, surah: 50, ayah: 27, page: 519 },
  { rub: 209, surah: 51, ayah: 31, page: 522 },
  { rub: 210, surah: 52, ayah: 24, page: 524 },
  { rub: 211, surah: 53, ayah: 26, page: 526 },
  { rub: 212, surah: 54, ayah: 9, page: 529 },
  { rub: 213, surah: 55, ayah: 1, page: 531 },
  { rub: 214, surah: 56, ayah: 1, page: 534 },
  { rub: 215, surah: 56, ayah: 75, page: 536 },
  { rub: 216, surah: 57, ayah: 16, page: 539 },
  { rub: 217, surah: 58, ayah: 1, page: 542 },
  { rub: 218, surah: 58, ayah: 14, page: 544 },
  { rub: 219, surah: 59, ayah: 11, page: 547 },
  { rub: 220, surah: 60, ayah: 7, page: 550 },
  { rub: 221, surah: 62, ayah: 1, page: 553 },
  { rub: 222, surah: 63, ayah: 4, page: 554 },
  { rub: 223, surah: 65, ayah: 1, page: 558 },
  { rub: 224, surah: 66, ayah: 1, page: 560 },
  { rub: 225, surah: 67, ayah: 1, page: 562 },
  { rub: 226, surah: 68, ayah: 1, page: 564 },
  { rub: 227, surah: 69, ayah: 1, page: 566 },
  { rub: 228, surah: 70, ayah: 19, page: 569 },
  { rub: 229, surah: 72, ayah: 1, page: 572 },
  { rub: 230, surah: 73, ayah: 20, page: 575 },
  { rub: 231, surah: 75, ayah: 1, page: 577 },
  { rub: 232, surah: 76, ayah: 19, page: 579 },
  { rub: 233, surah: 78, ayah: 1, page: 582 },
  { rub: 234, surah: 80, ayah: 1, page: 585 },
  { rub: 235, surah: 82, ayah: 1, page: 587 },
  { rub: 236, surah: 84, ayah: 1, page: 589 },
  { rub: 237, surah: 87, ayah: 1, page: 591 },
  { rub: 238, surah: 90, ayah: 1, page: 594 },
  { rub: 239, surah: 94, ayah: 1, page: 596 },
  { rub: 240, surah: 100, ayah: 9, page: 599 }
];

// src/lib/rubHizb.ts
var QUARTER_LABELS = {
  1: "Hizb ba\u015Flan\u011F\u0131c\u0131",
  2: "1/4 R\xFCb (\u0631\u0628\u0639)",
  3: "1/2 Nisf (\u0646\u0635\u0641)",
  4: "3/4 S\u0259l\u0259s\u0259 (\u062B\u0644\u0627\u062B\u0629 \u0623\u0631\u0628\u0627\u0639)"
};
var RUB_HIZB_ENTRIES = RAW_RUB_HIZB_LIST.map((item) => {
  const juz = Math.ceil(item.rub / 8);
  const hizb = Math.ceil(item.rub / 4);
  const quarterInHizb = (item.rub - 1) % 4 + 1;
  const surah = getSurahByNumber(item.surah);
  return {
    rub: item.rub,
    juz,
    hizb,
    quarterInHizb,
    quarterLabel: QUARTER_LABELS[quarterInHizb],
    surahNumber: item.surah,
    surahName: surah?.name ?? `Sur\u0259 ${item.surah}`,
    arabicSurahName: surah?.arabicName ?? "",
    ayahNumber: item.ayah,
    pageNumber: item.page
  };
});
function getActiveRubForPage(pageNumber) {
  let latest = RUB_HIZB_ENTRIES[0];
  for (const entry of RUB_HIZB_ENTRIES) {
    if (entry.pageNumber <= pageNumber) {
      latest = entry;
    } else {
      break;
    }
  }
  return latest;
}

// src/data/quranDuas.ts
var QURAN_DUAS = [
  {
    id: "fatiha-6",
    title: "Do\u011Fru yola y\xF6n\u0259lm\u0259k duas\u0131",
    category: "hidayet",
    surahNumber: 1,
    surahName: "Fatih\u0259",
    ayahNumber: 6,
    ayahLabel: "1:6",
    pageNumber: 1,
    arabicText: "\u0627\u0647\u0652\u062F\u0650\u0646\u064E\u0627 \u0627\u0644\u0635\u0650\u0651\u0631\u064E\u0627\u0637\u064E \u0627\u0644\u0652\u0645\u064F\u0633\u0652\u062A\u064E\u0642\u0650\u064A\u0645\u064E",
    translation: "Bizi do\u011Fru yola y\xF6n\u0259lt!"
  },
  {
    id: "baqarah-201",
    title: "D\xFCnya v\u0259 axir\u0259t g\xF6z\u0259lliyi duas\u0131",
    category: "hidayet",
    surahNumber: 2,
    surahName: "B\u0259q\u0259r\u0259",
    ayahNumber: 201,
    ayahLabel: "2:201",
    pageNumber: 31,
    arabicText: "\u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0622\u062A\u0650\u0646\u064E\u0627 \u0641\u0650\u064A \u0627\u0644\u062F\u064F\u0651\u0646\u0652\u064A\u064E\u0627 \u062D\u064E\u0633\u064E\u0646\u064E\u0629\u064B \u0648\u064E\u0641\u0650\u064A \u0627\u0644\u0652\u0622\u062E\u0650\u0631\u064E\u0629\u0650 \u062D\u064E\u0633\u064E\u0646\u064E\u0629\u064B \u0648\u064E\u0642\u0650\u0646\u064E\u0627 \u0639\u064E\u0630\u064E\u0627\u0628\u064E \u0627\u0644\u0646\u064E\u0651\u0627\u0631\u0650",
    translation: "Ey R\u0259bbimiz! Biz\u0259 h\u0259m bu d\xFCnyada, h\u0259m d\u0259 axir\u0259td\u0259 g\xF6z\u0259l nem\u0259tl\u0259r ver v\u0259 bizi Od \u0259zab\u0131ndan qoru!"
  },
  {
    id: "baqarah-250",
    title: "S\u0259bir v\u0259 sabitlik duas\u0131",
    category: "elm-sebir",
    surahNumber: 2,
    surahName: "B\u0259q\u0259r\u0259",
    ayahNumber: 250,
    ayahLabel: "2:250",
    pageNumber: 41,
    arabicText: "\u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0623\u064E\u0641\u0652\u0631\u0650\u063A\u0652 \u0639\u064E\u0644\u064E\u064A\u0652\u0646\u064E\u0627 \u0635\u064E\u0628\u0652\u0631\u064B\u0627 \u0648\u064E\u062B\u064E\u0628\u0650\u0651\u062A\u0652 \u0623\u064E\u0642\u0652\u062F\u064E\u0627\u0645\u064E\u0646\u064E\u0627 \u0648\u064E\u0627\u0646\u0635\u064F\u0631\u0652\u0646\u064E\u0627 \u0639\u064E\u0644\u064E\u0649 \u0627\u0644\u0652\u0642\u064E\u0648\u0652\u0645\u0650 \u0627\u0644\u0652\u0643\u064E\u0627\u0641\u0650\u0631\u0650\u064A\u0646\u064E",
    translation: "Ey R\u0259bbimiz! Biz\u0259 s\u0259bir ver, q\u0259d\u0259ml\u0259rimizi m\xF6hk\u0259ml\u0259t v\u0259 kafir q\xF6vm\u0259 qar\u015F\u0131 biz\u0259 yard\u0131m et!"
  },
  {
    id: "baqarah-286",
    title: "G\xFCc\xFCm\xFCz \xE7atmayan y\xFCkd\u0259n qorunma duas\u0131",
    category: "magfiret",
    surahNumber: 2,
    surahName: "B\u0259q\u0259r\u0259",
    ayahNumber: 286,
    ayahLabel: "2:286",
    pageNumber: 49,
    arabicText: "\u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0644\u064E\u0627 \u062A\u064F\u0624\u064E\u0627\u062E\u0650\u0630\u0652\u0646\u064E\u0627 \u0625\u0650\u0646 \u0646\u064E\u0651\u0633\u0650\u064A\u0646\u064E\u0627 \u0623\u064E\u0648\u0652 \u0623\u064E\u062E\u0652\u0637\u064E\u0623\u0652\u0646\u064E\u0627 \u06DA \u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0648\u064E\u0644\u064E\u0627 \u062A\u064E\u062D\u0652\u0645\u0650\u0644\u0652 \u0639\u064E\u0644\u064E\u064A\u0652\u0646\u064E\u0627 \u0625\u0650\u0635\u0652\u0631\u064B\u0627 \u0643\u064E\u0645\u064E\u0627 \u062D\u064E\u0645\u064E\u0644\u0652\u062A\u064E\u0647\u064F \u0639\u064E\u0644\u064E\u0649 \u0627\u0644\u064E\u0651\u0630\u0650\u064A\u0646\u064E \u0645\u0650\u0646 \u0642\u064E\u0628\u0652\u0644\u0650\u0646\u064E\u0627 \u06DA \u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0648\u064E\u0644\u064E\u0627 \u062A\u064F\u062D\u064E\u0645\u0650\u0651\u0644\u0652\u0646\u064E\u0627 \u0645\u064E\u0627 \u0644\u064E\u0627 \u0637\u064E\u0627\u0642\u064E\u0629\u064E \u0644\u064E\u0646\u064E\u0627 \u0628\u0650\u0647\u0650 \u06D6 \u0648\u064E\u0627\u0639\u0652\u0641\u064F \u0639\u064E\u0646\u064E\u0651\u0627 \u0648\u064E\u0627\u063A\u0652\u0641\u0650\u0631\u0652 \u0644\u064E\u0646\u064E\u0627 \u0648\u064E\u0627\u0631\u0652\u062D\u064E\u0645\u0652\u0646\u064E\u0627",
    translation: "Ey R\u0259bbimiz, unutsaq v\u0259 ya x\u0259ta ets\u0259k bizi c\u0259zaland\u0131rma! Ey R\u0259bbimiz, bizd\u0259n \u0259vv\u0259lkil\u0259r\u0259 y\xFCkl\u0259diyin kimi, biz\u0259 d\u0259 a\u011F\u0131r y\xFCk y\xFCkl\u0259m\u0259! Ey R\u0259bbimiz, g\xFCc\xFCm\xFCz \xE7atmayan \u015Feyi da\u015F\u0131ma\u011Fa bizi m\u0259cbur etm\u0259! Bizi \u0259fv et, bizi ba\u011F\u0131\u015Fla v\u0259 biz\u0259 r\u0259hm et!"
  },
  {
    id: "ali-imran-8",
    title: "Q\u0259lbl\u0259rin haqq yolda sabit qalmas\u0131 duas\u0131",
    category: "hidayet",
    surahNumber: 3,
    surahName: "Ali-\u0130mran",
    ayahNumber: 8,
    ayahLabel: "3:8",
    pageNumber: 50,
    arabicText: "\u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0644\u064E\u0627 \u062A\u064F\u0632\u0650\u063A\u0652 \u0642\u064F\u0644\u064F\u0648\u0628\u064E\u0646\u064E\u0627 \u0628\u064E\u0639\u0652\u062F\u064E \u0625\u0650\u0630\u0652 \u0647\u064E\u062F\u064E\u064A\u0652\u062A\u064E\u0646\u064E\u0627 \u0648\u064E\u0647\u064E\u0628\u0652 \u0644\u064E\u0646\u064E\u0627 \u0645\u0650\u0646 \u0644\u064E\u0651\u062F\u064F\u0646\u0643\u064E \u0631\u064E\u062D\u0652\u0645\u064E\u0629\u064B \u06DA \u0625\u0650\u0646\u064E\u0651\u0643\u064E \u0623\u064E\u0646\u062A\u064E \u0627\u0644\u0652\u0648\u064E\u0647\u064E\u0651\u0627\u0628\u064F",
    translation: "Ey R\u0259bbimiz! Bizi do\u011Fru yola y\xF6n\u0259ltdikd\u0259n sonra q\u0259lbl\u0259rimizi azd\u0131rma v\u0259 \xD6z t\u0259r\u0259find\u0259n biz\u0259 m\u0259rh\u0259m\u0259t b\u0259x\u015F et. H\u0259qiq\u0259t\u0259n, S\u0259n B\u0259x\u015Fed\u0259ns\u0259n!"
  },
  {
    id: "ali-imran-16",
    title: "\u0130man v\u0259 g\xFCnahlar\u0131n ba\u011F\u0131\u015Flanmas\u0131 duas\u0131",
    category: "magfiret",
    surahNumber: 3,
    surahName: "Ali-\u0130mran",
    ayahNumber: 16,
    ayahLabel: "3:16",
    pageNumber: 52,
    arabicText: "\u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0625\u0650\u0646\u064E\u0651\u0646\u064E\u0627 \u0622\u0645\u064E\u0646\u064E\u0651\u0627 \u0641\u064E\u0627\u063A\u0652\u0641\u0650\u0631\u0652 \u0644\u064E\u0646\u064E\u0627 \u0630\u064F\u0646\u064F\u0648\u0628\u064E\u0646\u064E\u0627 \u0648\u064E\u0642\u0650\u0646\u064E\u0627 \u0639\u064E\u0630\u064E\u0627\u0628\u064E \u0627\u0644\u0646\u064E\u0651\u0627\u0631\u0650",
    translation: "Ey R\u0259bbimiz! H\u0259qiq\u0259t\u0259n, biz iman g\u0259tirdik, bizim g\xFCnahlar\u0131m\u0131z\u0131 ba\u011F\u0131\u015Fla v\u0259 bizi Od \u0259zab\u0131ndan qoru!"
  },
  {
    id: "ali-imran-38",
    title: "Saleh \xF6vlad duas\u0131 (Z\u0259k\u0259riyya \u0259.s.)",
    category: "aile",
    surahNumber: 3,
    surahName: "Ali-\u0130mran",
    ayahNumber: 38,
    ayahLabel: "3:38",
    pageNumber: 55,
    arabicText: "\u0631\u064E\u0628\u0650\u0651 \u0647\u064E\u0628\u0652 \u0644\u0650\u064A \u0645\u0650\u0646 \u0644\u064E\u0651\u062F\u064F\u0646\u0643\u064E \u0630\u064F\u0631\u0650\u0651\u064A\u064E\u0651\u0629\u064B \u0637\u064E\u064A\u0650\u0651\u0628\u064E\u0629\u064B \u06D6 \u0625\u0650\u0646\u064E\u0651\u0643\u064E \u0633\u064E\u0645\u0650\u064A\u0639\u064F \u0627\u0644\u062F\u064F\u0651\u0639\u064E\u0627\u0621\u0650",
    translation: "Ey R\u0259bbim! \xD6z t\u0259r\u0259find\u0259n m\u0259n\u0259 pak bir n\u0259sil b\u0259x\u015F et! \u015E\xFCbh\u0259siz ki, S\u0259n dualar\u0131 E\u015Fid\u0259ns\u0259n!"
  },
  {
    id: "ali-imran-147",
    title: "Sabitlik v\u0259 q\u0259l\u0259b\u0259 duas\u0131",
    category: "elm-sebir",
    surahNumber: 3,
    surahName: "Ali-\u0130mran",
    ayahNumber: 147,
    ayahLabel: "3:147",
    pageNumber: 68,
    arabicText: "\u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0627\u063A\u0652\u0641\u0650\u0631\u0652 \u0644\u064E\u0646\u064E\u0627 \u0630\u064F\u0646\u064F\u0648\u0628\u064E\u0646\u064E\u0627 \u0648\u064E\u0625\u0650\u0633\u0652\u0631\u064E\u0627\u0641\u064E\u0646\u064E\u0627 \u0641\u0650\u064A \u0623\u064E\u0645\u0652\u0631\u0650\u0646\u064E\u0627 \u0648\u064E\u062B\u064E\u0628\u0650\u0651\u062A\u0652 \u0623\u064E\u0642\u0652\u062F\u064E\u0627\u0645\u064E\u0646\u064E\u0627 \u0648\u064E\u0627\u0646\u0635\u064F\u0631\u0652\u0646\u064E\u0627 \u0639\u064E\u0644\u064E\u0649 \u0627\u0644\u0652\u0642\u064E\u0648\u0652\u0645\u0650 \u0627\u0644\u0652\u0643\u064E\u0627\u0641\u0650\u0631\u0650\u064A\u0646\u064E",
    translation: "Ey R\u0259bbimiz! G\xFCnahlar\u0131m\u0131z\u0131 v\u0259 i\u015Fl\u0259rimizd\u0259 h\u0259ddi a\u015Fma\u011F\u0131m\u0131z\u0131 biz\u0259 ba\u011F\u0131\u015Fla, q\u0259d\u0259ml\u0259rimizi m\xF6hk\u0259ml\u0259t v\u0259 kafir q\xF6vm\u0259 qar\u015F\u0131 biz\u0259 yard\u0131m et!"
  },
  {
    id: "araf-23",
    title: "T\xF6vb\u0259 v\u0259 ba\u011F\u0131\u015Flanma duas\u0131 (Ad\u0259m \u0259.s.)",
    category: "magfiret",
    surahNumber: 7,
    surahName: "\u018Fraf",
    ayahNumber: 23,
    ayahLabel: "7:23",
    pageNumber: 153,
    arabicText: "\u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0638\u064E\u0644\u064E\u0645\u0652\u0646\u064E\u0627 \u0623\u064E\u0646\u0641\u064F\u0633\u064E\u0646\u064E\u0627 \u0648\u064E\u0625\u0650\u0646 \u0644\u064E\u0651\u0645\u0652 \u062A\u064E\u063A\u0652\u0641\u0650\u0631\u0652 \u0644\u064E\u0646\u064E\u0627 \u0648\u064E\u062A\u064E\u0631\u0652\u062D\u064E\u0645\u0652\u0646\u064E\u0627 \u0644\u064E\u0646\u064E\u0643\u064F\u0648\u0646\u064E\u0646\u064E\u0651 \u0645\u0650\u0646\u064E \u0627\u0644\u0652\u062E\u064E\u0627\u0633\u0650\u0631\u0650\u064A\u0646\u064E",
    translation: "Ey R\u0259bbimiz! Biz \xF6z\xFCm\xFCz\u0259 z\xFClm etdik. \u018Fg\u0259r bizi ba\u011F\u0131\u015Flamasan v\u0259 biz\u0259 r\u0259hm etm\u0259s\u0259n, \u0259lb\u0259tt\u0259, ziyana u\u011Frayanlardan olar\u0131q!"
  },
  {
    id: "ibrahim-40",
    title: "Namaz\u0131 qorumaq \xFC\xE7\xFCn dua (\u0130brahim \u0259.s.)",
    category: "aile",
    surahNumber: 14,
    surahName: "\u0130brahim",
    ayahNumber: 40,
    ayahLabel: "14:40",
    pageNumber: 260,
    arabicText: "\u0631\u064E\u0628\u0650\u0651 \u0627\u062C\u0652\u0639\u064E\u0644\u0652\u0646\u0650\u064A \u0645\u064F\u0642\u0650\u064A\u0645\u064E \u0627\u0644\u0635\u064E\u0651\u0644\u064E\u0627\u0629\u0650 \u0648\u064E\u0645\u0650\u0646 \u0630\u064F\u0631\u0650\u0651\u064A\u064E\u0651\u062A\u0650\u064A \u06DA \u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0648\u064E\u062A\u064E\u0642\u064E\u0628\u064E\u0651\u0644\u0652 \u062F\u064F\u0639\u064E\u0627\u0621\u0650",
    translation: "Ey R\u0259bbim! M\u0259ni d\u0259, n\u0259slimd\u0259n olanlar\u0131 da namaz q\u0131lan et! Ey R\u0259bbimiz! Duam\u0131 q\u0259bul el\u0259!"
  },
  {
    id: "ibrahim-41",
    title: "Valideynl\u0259r v\u0259 m\xF6minl\u0259r \xFC\xE7\xFCn ba\u011F\u0131\u015Flanma duas\u0131",
    category: "aile",
    surahNumber: 14,
    surahName: "\u0130brahim",
    ayahNumber: 41,
    ayahLabel: "14:41",
    pageNumber: 260,
    arabicText: "\u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0627\u063A\u0652\u0641\u0650\u0631\u0652 \u0644\u0650\u064A \u0648\u064E\u0644\u0650\u0648\u064E\u0627\u0644\u0650\u062F\u064E\u064A\u064E\u0651 \u0648\u064E\u0644\u0650\u0644\u0652\u0645\u064F\u0624\u0652\u0645\u0650\u0646\u0650\u064A\u0646\u064E \u064A\u064E\u0648\u0652\u0645\u064E \u064A\u064E\u0642\u064F\u0648\u0645\u064F \u0627\u0644\u0652\u062D\u0650\u0633\u064E\u0627\u0628\u064F",
    translation: "Ey R\u0259bbimiz! Hesab qurulaca\u011F\u0131 g\xFCn m\u0259ni, valideynl\u0259rimi v\u0259 m\xF6minl\u0259ri ba\u011F\u0131\u015Fla!"
  },
  {
    id: "isra-24",
    title: "Ata v\u0259 ana \xFC\xE7\xFCn r\u0259hm\u0259t duas\u0131",
    category: "aile",
    surahNumber: 17,
    surahName: "\u0130sra",
    ayahNumber: 24,
    ayahLabel: "17:24",
    pageNumber: 284,
    arabicText: "\u0631\u064E\u0651\u0628\u0650\u0651 \u0627\u0631\u0652\u062D\u064E\u0645\u0652\u0647\u064F\u0645\u064E\u0627 \u0643\u064E\u0645\u064E\u0627 \u0631\u064E\u0628\u064E\u0651\u064A\u064E\u0627\u0646\u0650\u064A \u0635\u064E\u063A\u0650\u064A\u0631\u064B\u0627",
    translation: "Ey R\u0259bbim! Onlar m\u0259ni k\xF6rp\u0259likd\u0259 t\u0259rbiy\u0259 edib b\xF6y\xFCtd\xFCkl\u0259ri kimi, S\u0259n d\u0259 onlara r\u0259hm et!"
  },
  {
    id: "isra-80",
    title: "Xeyirli giri\u015F, \xE7\u0131x\u0131\u015F v\u0259 yard\u0131m duas\u0131",
    category: "elm-sebir",
    surahNumber: 17,
    surahName: "\u0130sra",
    ayahNumber: 80,
    ayahLabel: "17:80",
    pageNumber: 290,
    arabicText: "\u0631\u064E\u0651\u0628\u0650\u0651 \u0623\u064E\u062F\u0652\u062E\u0650\u0644\u0652\u0646\u0650\u064A \u0645\u064F\u062F\u0652\u062E\u064E\u0644\u064E \u0635\u0650\u062F\u0652\u0642\u064D \u0648\u064E\u0623\u064E\u062E\u0652\u0631\u0650\u062C\u0652\u0646\u0650\u064A \u0645\u064F\u062E\u0652\u0631\u064E\u062C\u064E \u0635\u0650\u062F\u0652\u0642\u064D \u0648\u064E\u0627\u062C\u0652\u0639\u064E\u0644 \u0644\u0650\u0651\u064A \u0645\u0650\u0646 \u0644\u064E\u0651\u062F\u064F\u0646\u0643\u064E \u0633\u064F\u0644\u0652\u0637\u064E\u0627\u0646\u064B\u0627 \u0646\u064E\u0651\u0635\u0650\u064A\u0631\u064B\u0627",
    translation: "Ey R\u0259bbim! M\u0259ni daxil ed\u0259c\u0259yin yer\u0259 do\u011Fruluqla daxil et, \xE7\u0131xaraca\u011F\u0131n yerd\u0259n d\u0259 do\u011Fruluqla \xE7\u0131xart v\u0259 \xD6z t\u0259r\u0259find\u0259n m\u0259n\u0259 k\xF6m\u0259k ed\u0259n bir d\u0259lil ver!"
  },
  {
    id: "kahf-10",
    title: "M\u0259rh\u0259m\u0259t v\u0259 do\u011Fru r\u0259hb\u0259rlik duas\u0131 (\u018Fshabi-K\u0259hf)",
    category: "hidayet",
    surahNumber: 18,
    surahName: "K\u0259hf",
    ayahNumber: 10,
    ayahLabel: "18:10",
    pageNumber: 294,
    arabicText: "\u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0622\u062A\u0650\u0646\u064E\u0627 \u0645\u0650\u0646 \u0644\u064E\u0651\u062F\u064F\u0646\u0643\u064E \u0631\u064E\u062D\u0652\u0645\u064E\u0629\u064B \u0648\u064E\u0647\u064E\u064A\u0650\u0651\u0626\u0652 \u0644\u064E\u0646\u064E\u0627 \u0645\u0650\u0646\u0652 \u0623\u064E\u0645\u0652\u0631\u0650\u0646\u064E\u0627 \u0631\u064E\u0634\u064E\u062F\u064B\u0627",
    translation: "Ey R\u0259bbimiz! Biz\u0259 \xD6z t\u0259r\u0259find\u0259n m\u0259rh\u0259m\u0259t b\u0259x\u015F et v\u0259 i\u015Fimizd\u0259 bizim \xFC\xE7\xFCn do\u011Fru yol haz\u0131rla!"
  },
  {
    id: "taha-25",
    title: "K\xF6n\xFCl rahatl\u0131\u011F\u0131 v\u0259 nitqd\u0259 f\u0259sah\u0259t duas\u0131 (Musa \u0259.s.)",
    category: "elm-sebir",
    surahNumber: 20,
    surahName: "Taha",
    ayahNumber: 25,
    ayahLabel: "20:25",
    pageNumber: 313,
    arabicText: "\u0631\u064E\u0628\u0650\u0651 \u0627\u0634\u0652\u0631\u064E\u062D\u0652 \u0644\u0650\u064A \u0635\u064E\u062F\u0652\u0631\u0650\u064A \u06DD \u0648\u064E\u064A\u064E\u0633\u0650\u0651\u0631\u0652 \u0644\u0650\u064A \u0623\u064E\u0645\u0652\u0631\u0650\u064A",
    translation: "Ey R\u0259bbim! K\xF6ks\xFCm\xFC a\xE7\u0131b geni\u015Fl\u0259t v\u0259 i\u015Fimi y\xFCng\xFCll\u0259\u015Fdir!"
  },
  {
    id: "taha-114",
    title: "Elmin art\u0131r\u0131lmas\u0131 duas\u0131",
    category: "elm-sebir",
    surahNumber: 20,
    surahName: "Taha",
    ayahNumber: 114,
    ayahLabel: "20:114",
    pageNumber: 320,
    arabicText: "\u0631\u064E\u0651\u0628\u0650\u0651 \u0632\u0650\u062F\u0652\u0646\u0650\u064A \u0639\u0650\u0644\u0652\u0645\u064B\u0627",
    translation: "Ey R\u0259bbim! Elmimi art\u0131r!"
  },
  {
    id: "anbiya-87",
    title: "\xC7\u0259tinlik an\u0131nda t\u0259sbih v\u0259 t\xF6vb\u0259 duas\u0131 (Yunus \u0259.s.)",
    category: "magfiret",
    surahNumber: 21,
    surahName: "\u018Fnbiya",
    ayahNumber: 87,
    ayahLabel: "21:87",
    pageNumber: 329,
    arabicText: "\u0644\u064E\u0651\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064E \u0625\u0650\u0644\u064E\u0651\u0627 \u0623\u064E\u0646\u062A\u064E \u0633\u064F\u0628\u0652\u062D\u064E\u0627\u0646\u064E\u0643\u064E \u0625\u0650\u0646\u0650\u0651\u064A \u0643\u064F\u0646\u062A\u064F \u0645\u0650\u0646\u064E \u0627\u0644\u0638\u064E\u0651\u0627\u0644\u0650\u0645\u0650\u064A\u0646\u064E",
    translation: "S\u0259nd\u0259n ba\u015Fqa ilah yoxdur. S\u0259n paksan, m\xFCq\u0259dd\u0259ss\u0259n! H\u0259qiq\u0259t\u0259n, m\u0259n zal\u0131mlardan olmu\u015Fam!"
  },
  {
    id: "furqan-74",
    title: "G\xF6z ayd\u0131nl\u0131\u011F\u0131 olan ail\u0259 duas\u0131",
    category: "aile",
    surahNumber: 25,
    surahName: "Furqan",
    ayahNumber: 74,
    ayahLabel: "25:74",
    pageNumber: 366,
    arabicText: "\u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0647\u064E\u0628\u0652 \u0644\u064E\u0646\u064E\u0627 \u0645\u0650\u0646\u0652 \u0623\u064E\u0632\u0652\u0648\u064E\u0627\u062C\u0650\u0646\u064E\u0627 \u0648\u064E\u0630\u064F\u0631\u0650\u0651\u064A\u064E\u0651\u0627\u062A\u0650\u0646\u064E\u0627 \u0642\u064F\u0631\u064E\u0651\u0629\u064E \u0623\u064E\u0639\u0652\u064A\u064F\u0646\u064D \u0648\u064E\u0627\u062C\u0652\u0639\u064E\u0644\u0652\u0646\u064E\u0627 \u0644\u0650\u0644\u0652\u0645\u064F\u062A\u064E\u0651\u0642\u0650\u064A\u0646\u064E \u0625\u0650\u0645\u064E\u0627\u0645\u064B\u0627",
    translation: "Ey R\u0259bbimiz! Biz\u0259 g\xF6z\xFCm\xFCz\xFCn ayd\u0131nl\u0131\u011F\u0131 olan z\xF6vc\u0259l\u0259r v\u0259 \xF6vladlar b\u0259x\u015F et v\u0259 bizi m\xFCtt\u0259qil\u0259r\u0259 imam (n\xFCmun\u0259) et!"
  },
  {
    id: "hashr-10",
    title: "Q\u0259lbl\u0259rd\u0259 kin olmamas\u0131 v\u0259 qarda\u015Fl\u0131q duas\u0131",
    category: "hidayet",
    surahNumber: 59,
    surahName: "H\u0259\u015Fr",
    ayahNumber: 10,
    ayahLabel: "59:10",
    pageNumber: 547,
    arabicText: "\u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0627\u063A\u0652\u0641\u0650\u0631\u0652 \u0644\u064E\u0646\u064E\u0627 \u0648\u064E\u0644\u0650\u0625\u0650\u062E\u0652\u0648\u064E\u0627\u0646\u0650\u0646\u064E\u0627 \u0627\u0644\u064E\u0651\u0630\u0650\u064A\u0646\u064E \u0633\u064E\u0628\u064E\u0642\u064F\u0648\u0646\u064E\u0627 \u0628\u0650\u0627\u0644\u0652\u0625\u0650\u064A\u0645\u064E\u0627\u0646\u0650 \u0648\u064E\u0644\u064E\u0627 \u062A\u064E\u062C\u0652\u0639\u064E\u0644\u0652 \u0641\u0650\u064A \u0642\u064F\u0644\u064F\u0648\u0628\u0650\u0646\u064E\u0627 \u063A\u0650\u0644\u064B\u0651\u0627 \u0644\u0650\u0651\u0644\u064E\u0651\u0630\u0650\u064A\u0646\u064E \u0622\u0645\u064E\u0646\u064F\u0648\u0627 \u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0625\u0650\u0646\u064E\u0651\u0643\u064E \u0631\u064E\u0621\u064F\u0648\u0641\u064C \u0631\u064E\u0651\u062D\u0650\u064A\u0645\u064C",
    translation: "Ey R\u0259bbimiz! Bizi v\u0259 bizd\u0259n \u0259vv\u0259l iman g\u0259tirmi\u015F qarda\u015Flar\u0131m\u0131z\u0131 ba\u011F\u0131\u015Fla! Q\u0259lbl\u0259rimizd\u0259 iman g\u0259tir\u0259nl\u0259r\u0259 qar\u015F\u0131 kin-k\xFCdur\u0259t\u0259 yer verm\u0259! Ey R\u0259bbimiz! H\u0259qiq\u0259t\u0259n, S\u0259n \u015E\u0259fq\u0259tlis\u0259n, M\u0259rh\u0259m\u0259tlis\u0259n!"
  },
  {
    id: "tahrim-8",
    title: "Kamil nur v\u0259 ba\u011F\u0131\u015Flanma duas\u0131",
    category: "hidayet",
    surahNumber: 66,
    surahName: "T\u0259hrim",
    ayahNumber: 8,
    ayahLabel: "66:8",
    pageNumber: 561,
    arabicText: "\u0631\u064E\u0628\u064E\u0651\u0646\u064E\u0627 \u0623\u064E\u062A\u0652\u0645\u0650\u0645\u0652 \u0644\u064E\u0646\u064E\u0627 \u0646\u064F\u0648\u0631\u064E\u0646\u064E\u0627 \u0648\u064E\u0627\u063A\u0652\u0641\u0650\u0631\u0652 \u0644\u064E\u0646\u064E\u0627 \u06D6 \u0625\u0650\u0646\u064E\u0651\u0643\u064E \u0639\u064E\u0644\u064E\u0649\u0670 \u0643\u064F\u0644\u0650\u0651 \u0634\u064E\u064A\u0652\u0621\u064D \u0642\u064E\u062F\u0650\u064A\u0631\u064C",
    translation: "Ey R\u0259bbimiz! Nurumuzu bizim \xFC\xE7\xFCn tamamla v\u0259 bizi ba\u011F\u0131\u015Fla. H\u0259qiq\u0259t\u0259n, S\u0259n h\u0259r \u015Fey\u0259 Qadirs\u0259n!"
  }
];

// src/lib/seo.ts
function escapeXml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function escapeHtmlAttr(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeHtmlText(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function normalizeBaseUrl(origin) {
  return origin.replace(/\/+$/, "");
}
var POPULAR_QURAN_TOPICS = [
  {
    id: "ayatul-kursi",
    title: "Ay\u0259t\xFCl-K\xFCrsi (B\u0259q\u0259r\u0259, 255)",
    arabicLabel: "\u0622\u064A\u064E\u0629\u064F \u0627\u0644\u0652\u0643\u064F\u0631\u0652\u0633\u0650\u064A\u0650\u0651",
    searchHint: "2:255 \xB7 S\u0259hif\u0259 42",
    surahNumber: 2,
    pageNumber: 42,
    anchorHash: "#ayah-2-255",
    summary: "Quran\u0131n \u0259n \u0259z\u0259m\u0259tli ay\u0259si \u2014 \u0259r\u0259bc\u0259 m\u0259tn v\u0259 \u018Flixan Musayev t\u0259rc\xFCm\u0259si."
  },
  {
    id: "amanar-rasulu",
    title: "Am\u0259n\u0259r-R\u0259sulu (B\u0259q\u0259r\u0259, 285\u2013286)",
    arabicLabel: "\u0622\u0645\u064E\u0646\u064E \u0627\u0644\u0631\u064E\u0651\u0633\u064F\u0648\u0644\u064F",
    searchHint: "2:285\u2013286 \xB7 S\u0259hif\u0259 49",
    surahNumber: 2,
    pageNumber: 49,
    anchorHash: "#ayah-2-285",
    summary: "B\u0259q\u0259r\u0259 sur\u0259sinin son iki ay\u0259si v\u0259 ax\u015Fam tilav\u0259ti \xFC\xE7\xFCn dua ay\u0259l\u0259ri."
  },
  {
    id: "fatiha",
    title: "Fatih\u0259 sur\u0259si (\xDCmm\xFCl-Kitab)",
    arabicLabel: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0652\u0641\u064E\u0627\u062A\u0650\u062D\u064E\u0629\u0650",
    searchHint: "1\u20137 ay\u0259 \xB7 S\u0259hif\u0259 1",
    surahNumber: 1,
    pageNumber: 1,
    summary: "Namaz\u0131n h\u0259r r\xFCk\u0259tind\u0259 oxunan 7 ay\u0259lik a\xE7\u0131l\u0131\u015F sur\u0259si."
  },
  {
    id: "yasin",
    title: "Yasin sur\u0259si (Quran\u0131n q\u0259lbi)",
    arabicLabel: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u064A\u0633",
    searchHint: "83 ay\u0259 \xB7 S\u0259hif\u0259 440",
    surahNumber: 36,
    pageNumber: 440,
    summary: "Tam \u0259r\u0259bc\u0259 m\u0259tn, M\u0259din\u0259 s\u0259hif\u0259l\u0259ri (440\u2013445) v\u0259 M\xFChafiz \u0259zb\u0259r rejimi."
  },
  {
    id: "kahf",
    title: "K\u0259hf sur\u0259si (C\xFCm\u0259 g\xFCn\xFC)",
    arabicLabel: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0652\u0643\u064E\u0647\u0652\u0641\u0650",
    searchHint: "110 ay\u0259 \xB7 S\u0259hif\u0259 293",
    surahNumber: 18,
    pageNumber: 293,
    summary: "C\xFCm\u0259 g\xFCnl\u0259ri oxunmas\u0131 s\xFCnn\u0259t olan 18-ci sur\u0259, M\u0259din\u0259 \xE7ap\u0131 293\u2013304."
  },
  {
    id: "mulk",
    title: "M\xFClk sur\u0259si (T\u0259bar\u0259k\u0259)",
    arabicLabel: "\u0633\u064F\u0648\u0631\u064E\u0629\u064F \u0627\u0644\u0652\u0645\u064F\u0644\u0652\u0643\u0650",
    searchHint: "30 ay\u0259 \xB7 S\u0259hif\u0259 562",
    surahNumber: 67,
    pageNumber: 562,
    summary: "Gec\u0259 yatmazdan \u0259vv\u0259l oxunmas\u0131 t\xF6vsiy\u0259 edil\u0259n 30 ay\u0259lik sur\u0259."
  }
];
function buildBreadcrumbJsonLd(origin, items) {
  const baseUrl = normalizeBaseUrl(origin);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${baseUrl}${item.path}`
    }))
  };
}
function buildSurahFaqEntries(surah, lastPage) {
  const effectiveLastPage = Math.max(surah.startPage, lastPage ?? surah.startPage);
  const pageText = effectiveLastPage === surah.startPage ? `M\u0259din\u0259 Mushaf\u0131n\u0131n ${surah.startPage}-ci s\u0259hif\u0259sind\u0259 yerl\u0259\u015Fir` : `M\u0259din\u0259 Mushaf\u0131n\u0131n ${surah.startPage}\u2013${effectiveLastPage}-ci s\u0259hif\u0259l\u0259rind\u0259 (${effectiveLastPage - surah.startPage + 1} s\u0259hif\u0259) yerl\u0259\u015Fir`;
  const juhStart = getJuzForPage(surah.startPage);
  return [
    {
      question: `${surah.name} sur\u0259si ne\xE7\u0259 ay\u0259dir v\u0259 Quran\u0131n ne\xE7\u0259nci sur\u0259sidir?`,
      answer: `${surah.name} sur\u0259si Qurani-K\u0259rimin ${formatAzerbaijaniOrdinal(surah.number)} sur\u0259sidir v\u0259 c\u0259mi ${surah.ayahCount} ay\u0259d\u0259n ibar\u0259tdir.`
    },
    {
      question: `${surah.name} sur\u0259si harada nazil olub v\u0259 M\u0259din\u0259 \xE7ap\u0131nda ne\xE7\u0259nci s\u0259hif\u0259d\u0259dir?`,
      answer: `Bu sur\u0259 ${surah.revelationPlace === "M\u0259kk\u0259" ? "M\u0259kk\u0259d\u0259" : "M\u0259din\u0259d\u0259"} nazil olmu\u015Fdur, ${juhStart}-ci C\xFCzd\u0259n ba\u015Flay\u0131r v\u0259 ${pageText}.`
    },
    {
      question: `${surah.name} sur\u0259sini s\xF6zb\u0259-s\xF6z nec\u0259 \u0259zb\u0259rl\u0259m\u0259k olar?`,
      answer: `M\xFChafiz b\xF6lm\u0259sind\u0259 ${surah.startPage}-ci s\u0259hif\u0259ni a\xE7araq orijinal M\u0259din\u0259 \xE7ap\u0131 \xFCz\u0259rind\u0259 ay\u0259l\u0259ri s\xF6zb\u0259-s\xF6z v\u0259 ya ay\u0259-ay\u0259 gizl\u0259dib a\xE7maqla rahat \u0259zb\u0259rl\u0259y\u0259 bil\u0259rsiniz.`
    }
  ];
}
function buildFaqPageJsonLd(entries) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}
function buildRobotsTxt(origin) {
  const baseUrl = normalizeBaseUrl(origin);
  return [
    "# Quran Qiraeti \u2014 Search Engine & AI Crawler Directives",
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/requests",
    "Disallow: /api/analytics/",
    "",
    "# AI Search & LLM Crawlers (Explicitly Permitted)",
    "User-agent: GPTBot",
    "Allow: /",
    "",
    "User-agent: OAI-SearchBot",
    "Allow: /",
    "",
    "User-agent: ChatGPT-User",
    "Allow: /",
    "",
    "User-agent: ClaudeBot",
    "Allow: /",
    "",
    "User-agent: Claude-Web",
    "Allow: /",
    "",
    "User-agent: anthropic-ai",
    "Allow: /",
    "",
    "User-agent: PerplexityBot",
    "Allow: /",
    "",
    "User-agent: Google-Extended",
    "Allow: /",
    "",
    "User-agent: Applebot-Extended",
    "Allow: /",
    "",
    "User-agent: Meta-ExternalAgent",
    "Allow: /",
    "",
    "User-agent: cohere-ai",
    "Allow: /",
    "",
    "User-agent: CCBot",
    "Allow: /",
    "",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    `Sitemap: ${baseUrl}/sitemap-index.xml`,
    `Sitemap: ${baseUrl}/sitemap-videos.xml`,
    `# LLMs Index: ${baseUrl}/llms.txt`,
    `# Full AI Reference: ${baseUrl}/llms-full.txt`,
    `# Structured AI JSON: ${baseUrl}/ai-index.json`,
    ""
  ].join("\n");
}
function renderUrlSetXml(urls) {
  const urlEntries = urls.map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  ).join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlEntries,
    "</urlset>",
    ""
  ].join("\n");
}
function buildSitemapIndexXml(origin, todayIsoDate = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) {
  const baseUrl = normalizeBaseUrl(origin);
  const childSitemaps = [
    `${baseUrl}/sitemap-core.xml`,
    `${baseUrl}/sitemap-surahs.xml`,
    `${baseUrl}/sitemap-mushaf.xml`,
    `${baseUrl}/sitemap-muhaffiz.xml`,
    `${baseUrl}/sitemap-videos.xml`
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...childSitemaps.map(
      (loc) => `  <sitemap>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${todayIsoDate}</lastmod>
  </sitemap>`
    ),
    "</sitemapindex>",
    ""
  ].join("\n");
}
function buildCoreSitemapXml(origin, todayIsoDate = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) {
  const baseUrl = normalizeBaseUrl(origin);
  return renderUrlSetXml([
    { loc: `${baseUrl}/`, lastmod: todayIsoDate, changefreq: "daily", priority: "1.0" },
    { loc: `${baseUrl}/shorts`, lastmod: todayIsoDate, changefreq: "daily", priority: "0.9" },
    { loc: `${baseUrl}/quran`, lastmod: todayIsoDate, changefreq: "weekly", priority: "0.9" },
    { loc: `${baseUrl}/dualar`, lastmod: todayIsoDate, changefreq: "weekly", priority: "0.85" },
    { loc: `${baseUrl}/elifba`, lastmod: todayIsoDate, changefreq: "monthly", priority: "0.85" },
    { loc: `${baseUrl}/zikr`, lastmod: todayIsoDate, changefreq: "weekly", priority: "0.85" },
    { loc: `${baseUrl}/namaz-vaxtlari`, lastmod: todayIsoDate, changefreq: "daily", priority: "0.9" },
    { loc: `${baseUrl}/qible`, lastmod: todayIsoDate, changefreq: "monthly", priority: "0.8" },
    { loc: `${baseUrl}/teqvim`, lastmod: todayIsoDate, changefreq: "daily", priority: "0.85" },
    { loc: `${baseUrl}/muhaffiz`, lastmod: todayIsoDate, changefreq: "weekly", priority: "0.9" },
    { loc: `${baseUrl}/gunun-ayesi`, lastmod: todayIsoDate, changefreq: "daily", priority: "0.8" },
    { loc: `${baseUrl}/haqqinda`, lastmod: todayIsoDate, changefreq: "monthly", priority: "0.7" },
    { loc: `${baseUrl}/istek`, lastmod: todayIsoDate, changefreq: "monthly", priority: "0.6" },
    ...JUZ_PAGE_RANGES.map((j) => ({
      loc: `${baseUrl}/quran/cuz/${j.juz}`,
      lastmod: todayIsoDate,
      changefreq: "monthly",
      priority: "0.80"
    }))
  ]);
}
function buildSurahsSitemapXml(origin, todayIsoDate = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) {
  const baseUrl = normalizeBaseUrl(origin);
  return renderUrlSetXml(
    SURAH_CATALOG.map((surah) => ({
      loc: `${baseUrl}/quran/sure/${surah.number}`,
      lastmod: todayIsoDate,
      changefreq: "monthly",
      priority: "0.85"
    }))
  );
}
function buildMushafSitemapXml(origin, todayIsoDate = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) {
  const baseUrl = normalizeBaseUrl(origin);
  const urls = [];
  for (let page = 1; page <= TOTAL_QURAN_PAGES; page++) {
    urls.push({
      loc: `${baseUrl}/quran/sehife/${page}`,
      lastmod: todayIsoDate,
      changefreq: "monthly",
      priority: "0.75"
    });
  }
  return renderUrlSetXml(urls);
}
function buildMuhaffizSitemapXml(origin, todayIsoDate = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) {
  const baseUrl = normalizeBaseUrl(origin);
  const urls = [
    { loc: `${baseUrl}/muhaffiz`, lastmod: todayIsoDate, changefreq: "weekly", priority: "0.9" }
  ];
  for (let page = 1; page <= TOTAL_QURAN_PAGES; page++) {
    urls.push({
      loc: `${baseUrl}/muhaffiz/${page}`,
      lastmod: todayIsoDate,
      changefreq: "monthly",
      priority: "0.70"
    });
  }
  return renderUrlSetXml(urls);
}
function buildVideoSitemapXml(origin, videos, todayIsoDate = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) {
  const baseUrl = normalizeBaseUrl(origin);
  const seenVideoIds = /* @__PURE__ */ new Set();
  const entries = [];
  for (const video of videos) {
    if (!video.videoId || seenVideoIds.has(video.videoId)) continue;
    seenVideoIds.add(video.videoId);
    const pubDate = /^\d{4}-\d{2}-\d{2}/.test(video.published) ? video.published.slice(0, 10) : todayIsoDate;
    const durationSec = parseDurationToSeconds(video.duration);
    const thumb = video.thumbnailUrl || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
    entries.push(
      [
        "  <url>",
        `    <loc>${escapeXml(`${baseUrl}/video/${video.videoId}`)}</loc>`,
        `    <lastmod>${pubDate}</lastmod>`,
        `    <changefreq>weekly</changefreq>`,
        `    <priority>${video.format === "long" ? "0.85" : "0.70"}</priority>`,
        "    <video:video>",
        `      <video:thumbnail_loc>${escapeXml(thumb)}</video:thumbnail_loc>`,
        `      <video:title>${escapeXml(video.title)}</video:title>`,
        `      <video:description>${escapeXml(video.seoDescription || video.title)}</video:description>`,
        `      <video:player_loc>https://www.youtube.com/embed/${escapeXml(video.videoId)}</video:player_loc>`,
        `      <video:duration>${durationSec}</video:duration>`,
        `      <video:publication_date>${pubDate}</video:publication_date>`,
        `      <video:family_friendly>yes</video:family_friendly>`,
        "    </video:video>",
        "  </url>"
      ].join("\n")
    );
  }
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">',
    entries.join("\n"),
    "</urlset>",
    ""
  ].join("\n");
}
function buildSitemapXml(origin, videos, todayIsoDate = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) {
  const baseUrl = normalizeBaseUrl(origin);
  const urls = [
    { loc: `${baseUrl}/`, lastmod: todayIsoDate, changefreq: "daily", priority: "1.0" },
    { loc: `${baseUrl}/shorts`, lastmod: todayIsoDate, changefreq: "daily", priority: "0.9" },
    { loc: `${baseUrl}/quran`, lastmod: todayIsoDate, changefreq: "weekly", priority: "0.9" },
    { loc: `${baseUrl}/dualar`, lastmod: todayIsoDate, changefreq: "weekly", priority: "0.85" },
    { loc: `${baseUrl}/elifba`, lastmod: todayIsoDate, changefreq: "monthly", priority: "0.85" },
    { loc: `${baseUrl}/zikr`, lastmod: todayIsoDate, changefreq: "weekly", priority: "0.85" },
    { loc: `${baseUrl}/namaz-vaxtlari`, lastmod: todayIsoDate, changefreq: "daily", priority: "0.9" },
    { loc: `${baseUrl}/qible`, lastmod: todayIsoDate, changefreq: "monthly", priority: "0.8" },
    { loc: `${baseUrl}/teqvim`, lastmod: todayIsoDate, changefreq: "daily", priority: "0.85" },
    { loc: `${baseUrl}/muhaffiz`, lastmod: todayIsoDate, changefreq: "weekly", priority: "0.9" },
    { loc: `${baseUrl}/gunun-ayesi`, lastmod: todayIsoDate, changefreq: "daily", priority: "0.8" },
    { loc: `${baseUrl}/haqqinda`, lastmod: todayIsoDate, changefreq: "monthly", priority: "0.7" },
    { loc: `${baseUrl}/istek`, lastmod: todayIsoDate, changefreq: "monthly", priority: "0.6" }
  ];
  for (const juz of JUZ_PAGE_RANGES) {
    urls.push({
      loc: `${baseUrl}/quran/cuz/${juz.juz}`,
      lastmod: todayIsoDate,
      changefreq: "monthly",
      priority: "0.80"
    });
  }
  for (const surah of SURAH_CATALOG) {
    urls.push({
      loc: `${baseUrl}/quran/sure/${surah.number}`,
      lastmod: todayIsoDate,
      changefreq: "monthly",
      priority: "0.85"
    });
  }
  for (let page = 1; page <= TOTAL_QURAN_PAGES; page++) {
    urls.push({
      loc: `${baseUrl}/quran/sehife/${page}`,
      lastmod: todayIsoDate,
      changefreq: "monthly",
      priority: "0.75"
    });
  }
  const seenVideoIds = /* @__PURE__ */ new Set();
  for (const video of videos) {
    if (!video.videoId || seenVideoIds.has(video.videoId)) continue;
    seenVideoIds.add(video.videoId);
    const pubDate = /^\d{4}-\d{2}-\d{2}/.test(video.published) ? video.published.slice(0, 10) : todayIsoDate;
    urls.push({
      loc: `${baseUrl}/video/${video.videoId}`,
      lastmod: pubDate,
      changefreq: "weekly",
      priority: video.format === "long" ? "0.85" : "0.70"
    });
  }
  return renderUrlSetXml(urls);
}
function toRfc822Date(raw) {
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toUTCString();
  }
  return (/* @__PURE__ */ new Date()).toUTCString();
}
function buildRssFeedXml(origin, stats, videos) {
  const baseUrl = normalizeBaseUrl(origin);
  const seen = /* @__PURE__ */ new Set();
  const items = [];
  for (const video of videos) {
    if (!video.videoId || seen.has(video.videoId)) continue;
    seen.add(video.videoId);
    const link = `${baseUrl}/video/${video.videoId}`;
    const thumb = video.thumbnailUrl || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
    const desc = video.seoDescription || `${video.surahName} (${video.ayahRange}) \u2014 ${video.reciter} tilav\u0259ti v\u0259 \u018Flixan Musayev t\u0259rc\xFCm\u0259si.`;
    const pubDate = /^\d{4}-\d{2}-\d{2}/.test(video.published) ? toRfc822Date(video.published) : (/* @__PURE__ */ new Date()).toUTCString();
    items.push(
      [
        "    <item>",
        `      <title>${escapeXml(video.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${escapeXml(pubDate)}</pubDate>`,
        `      <category>${escapeXml(video.surahName)}</category>`,
        `      <description>${escapeXml(desc)}</description>`,
        `      <media:thumbnail url="${escapeXml(thumb)}" />`,
        "    </item>"
      ].join("\n")
    );
    if (items.length >= 40) break;
  }
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">',
    "  <channel>",
    `    <title>${escapeXml(stats.name)} \u2014 Quran Tilav\u0259tl\u0259ri RSS</title>`,
    `    <link>${escapeXml(`${baseUrl}/`)}</link>`,
    `    <description>${escapeXml(stats.description)}</description>`,
    "    <language>az</language>",
    `    <lastBuildDate>${escapeXml((/* @__PURE__ */ new Date()).toUTCString())}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(`${baseUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />`,
    ...items,
    "  </channel>",
    "</rss>",
    ""
  ].join("\n");
}
function buildDynamicOgSvg(kind, id = 1) {
  let eyebrow = "QURAN Q\u0130RA\u018FT\u0130 \xB7 R\u018FSM\u0130 ARX\u0130V";
  let titleText = "Uzun Tilav\u0259tl\u0259r, Shorts v\u0259 Tam Qurani-K\u0259rim";
  let subtitleText = "114 Sur\u0259 \xB7 604 M\u0259din\u0259 Mushaf\u0131 S\u0259hif\u0259si \xB7 M\xFChafiz \u018Fzb\u0259r Al\u0259ti";
  let arabicBadge = "\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645";
  if (kind === "sure") {
    const s = getSurahByNumber(id);
    if (s) {
      eyebrow = `M\u018FD\u0130N\u018F \xC7API \xB7 ${s.number}-C\u0130 SUR\u018F \xB7 S\u018FH\u0130F\u018F ${s.startPage}`;
      titleText = `${s.name} sur\u0259si`;
      subtitleText = `${s.ayahCount} ay\u0259 \xB7 ${s.revelationPlace} \xB7 \u018Flixan Musayev t\u0259rc\xFCm\u0259si`;
      arabicBadge = s.arabicName;
    }
  } else if (kind === "sehife") {
    const p = clampMuhaffizPage(id);
    const juz = getJuzForPage(p);
    eyebrow = `M\u018FD\u0130N\u018F MUSHAF\u0130 \xB7 ${juz}-C\u0130 C\xDCZ`;
    titleText = `Qurani-K\u0259rim \u2014 ${formatAzerbaijaniOrdinal(p)} s\u0259hif\u0259`;
    subtitleText = `S\u0259hif\u0259 ${p} / 604 \xB7 \u018Fr\u0259bc\u0259 m\u0259tn v\u0259 Az\u0259rbaycan dilind\u0259 t\u0259rc\xFCm\u0259`;
    arabicBadge = `\u0635\u0641\u062D\u0629 ${p}`;
  } else if (kind === "muhaffiz") {
    const p = clampMuhaffizPage(id);
    const juz = getJuzForPage(p);
    eyebrow = `M\xDCHAF\u0130Z \u018FZB\u018FR MUSHAF\u0130 \xB7 ${juz}-C\u0130 C\xDCZ`;
    titleText = `S\xF6zb\u0259-s\xF6z \u018Fzb\u0259r \u2014 S\u0259hif\u0259 ${p}`;
    subtitleText = `604 M\u0259din\u0259 Mushaf\u0131 \xB7 S\u0259tir-s\u0259tir gizl\u0259t / a\xE7 \xB7 Tilav\u0259t yoxlamas\u0131`;
    arabicBadge = `\u0627\u0644\u0645\u0635\u062D\u0641 \u0627\u0644\u0645\u062D\u0641\u0638`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E1210"/>
      <stop offset="100%" stop-color="#0F4C3A"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="40" y="40" width="1120" height="550" rx="24" fill="none" stroke="#C6A769" stroke-opacity="0.35" stroke-width="2"/>
  <text x="88" y="130" fill="#C6A769" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="600" letter-spacing="3">${escapeXml(eyebrow)}</text>
  <text x="1112" y="140" text-anchor="end" fill="#F3F1EC" font-family="serif" font-size="46">${escapeXml(arabicBadge)}</text>
  <text x="88" y="315" fill="#FAF9F6" font-family="Georgia, serif" font-size="56" font-weight="700">${escapeXml(titleText)}</text>
  <text x="88" y="385" fill="#D5E6DF" font-family="system-ui, -apple-system, sans-serif" font-size="28">${escapeXml(subtitleText)}</text>
  <line x1="88" y1="470" x2="1112" y2="470" stroke="#7BB89E" stroke-opacity="0.25" stroke-width="1"/>
  <text x="88" y="532" fill="#86C7AE" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600">@quranqiraeti \xB7 \u018Fr\u0259bc\u0259 + Az\u0259rbaycan T\u0259rc\xFCm\u0259si</text>
</svg>`;
}
function resolveRouteSeoMetadata(pathname, origin, videos = [], extras) {
  const baseUrl = normalizeBaseUrl(origin);
  const cleanPath = !pathname || pathname === "/" ? "/" : pathname.split("?")[0].replace(/\/+$/, "") || "/";
  const defaultOg = `${baseUrl}/og-default.png`;
  const robotsIndex = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  const robotsNoIndex = "noindex, nofollow";
  if (cleanPath === "/admin") {
    return {
      httpStatus: 200,
      robots: robotsNoIndex,
      title: "Admin Statistika Paneli | Quran Qiraeti",
      description: "Quran Qiraeti idar\u0259etm\u0259 v\u0259 statistika paneli.",
      canonicalUrl: `${baseUrl}/admin`,
      ogImage: defaultOg,
      ogType: "website",
      noscriptHtml: "<h1>Admin Statistika Paneli</h1>"
    };
  }
  if (cleanPath === "/") {
    const featuredItems = videos.slice(0, 10).map((video, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "VideoObject",
        name: video.title,
        description: video.seoDescription || `${video.surahName} (${video.ayahRange}) \u2014 ${video.reciter}`,
        thumbnailUrl: [video.thumbnailUrl || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`],
        uploadDate: /^\d{4}-\d{2}-\d{2}/.test(video.published) ? video.published : void 0,
        contentUrl: `${baseUrl}/video/${video.videoId}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${video.videoId}`,
        inLanguage: ["ar", "az"]
      }
    }));
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: "Quran Qiraeti \u2014 Uzun Tilav\u0259tl\u0259r, Shorts v\u0259 Az\u0259rbaycan T\u0259rc\xFCm\u0259si",
      description: "Quran Qiraeti r\u0259smi arxivi. Tam sur\u0259 uzun tilav\u0259tl\u0259ri, Shorts qira\u0259tl\u0259ri, 114 sur\u0259 v\u0259 604 s\u0259hif\u0259 M\u0259din\u0259 \xE7ap\u0131 \u018Flixan Musayev t\u0259rc\xFCm\u0259si il\u0259.",
      canonicalUrl: `${baseUrl}/`,
      ogImage: defaultOg,
      ogType: "website",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Quran Qiraeti",
          url: `${baseUrl}/`,
          logo: defaultOg,
          sameAs: [
            "https://youtube.com/@quranqiraeti",
            "https://www.youtube.com/channel/UCp9AvvdTxAXDZfnnVjNF1Yg"
          ],
          description: "Quran Qiraeti YouTube kanal\u0131 \u2014 \u018Fr\u0259bc\u0259 Quran tilav\u0259tl\u0259ri v\u0259 \u018Flixan Musayevin Az\u0259rbaycan t\u0259rc\xFCm\u0259si arxivi."
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Quran Qiraeti",
          url: `${baseUrl}/`,
          inLanguage: ["az", "ar"],
          description: "Tam Qurani-K\u0259rim (114 sur\u0259, 604 M\u0259din\u0259 s\u0259hif\u0259si), M\xFChafiz \u0259zb\u0259r al\u0259ti v\u0259 uzun tilav\u0259t arxivi.",
          potentialAction: {
            "@type": "SearchAction",
            target: `${baseUrl}/quran?q={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        },
        ...featuredItems.length > 0 ? [
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Se\xE7ilmi\u015F Quran Tilav\u0259tl\u0259ri",
            numberOfItems: featuredItems.length,
            itemListElement: featuredItems
          }
        ] : []
      ],
      noscriptHtml: `<h1>Quran Qiraeti \u2014 Uzun Tilav\u0259tl\u0259r v\u0259 Tam Qurani-K\u0259rim</h1><p>Az\u0259rbaycan dilind\u0259 m\u0259naca t\u0259rc\xFCm\u0259 (\u018Flixan Musayev v1.0.4), 114 sur\u0259, 604 M\u0259din\u0259 Mushaf\u0131 s\u0259hif\u0259si v\u0259 M\xFChafiz \u0259zb\u0259r al\u0259ti.</p><nav><a href="/quran">Qurani-K\u0259rim (114 Sur\u0259)</a> \xB7 <a href="/quran/sure/1">Fatih\u0259 sur\u0259si</a> \xB7 <a href="/quran/sure/2">B\u0259q\u0259r\u0259 sur\u0259si</a> \xB7 <a href="/quran/sure/18">K\u0259hf sur\u0259si</a> \xB7 <a href="/quran/sure/36">Yasin sur\u0259si</a> \xB7 <a href="/quran/sure/67">M\xFClk sur\u0259si</a> \xB7 <a href="/dualar">Qurandak\u0131 Dualar</a> \xB7 <a href="/elifba">\u018Flifba v\u0259 T\u0259cvid</a> \xB7 <a href="/namaz-vaxtlari">Namaz Vaxtlar\u0131</a> \xB7 <a href="/teqvim">Hicri T\u0259qvim</a> \xB7 <a href="/zikr">S\u0259h\u0259r v\u0259 Ax\u015Fam Zikrl\u0259ri</a> \xB7 <a href="/muhaffiz">M\xFChafiz \u018Fzb\u0259r</a> \xB7 <a href="/shorts">Shorts</a></nav>${videos.length > 0 ? `<ul>${videos.slice(0, 12).map(
        (v) => `<li><a href="/video/${escapeHtmlAttr(v.videoId)}">${escapeHtmlText(v.title)}</a> \u2014 ${escapeHtmlText(v.surahName)} (${escapeHtmlText(v.ayahRange)})</li>`
      ).join("")}</ul>` : ""}`
    };
  }
  if (cleanPath === "/shorts") {
    const shortVideos = videos.filter((v) => v.format === "short").slice(0, 12);
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: "Quran Shorts Tilav\u0259tl\u0259ri | Quran Qiraeti",
      description: "Quran Qiraeti kanal\u0131n\u0131n b\xFCt\xFCn q\u0131sa Quran tilav\u0259tl\u0259ri, \u0259r\u0259bc\u0259 m\u0259tnl\u0259ri v\u0259 Az\u0259rbaycan dilind\u0259 t\u0259rc\xFCm\u0259l\u0259ri.",
      canonicalUrl: `${baseUrl}/shorts`,
      ogImage: defaultOg,
      ogType: "website",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Quran Shorts Tilav\u0259tl\u0259ri",
          url: `${baseUrl}/shorts`,
          inLanguage: ["ar", "az"],
          description: "Q\u0131sa Quran tilav\u0259tl\u0259ri, ay\u0259 aral\u0131qlar\u0131 v\u0259 Az\u0259rbaycan dilind\u0259 t\u0259rc\xFCm\u0259 arxivi."
        },
        buildBreadcrumbJsonLd(baseUrl, [
          { name: "Ana s\u0259hif\u0259", path: "/" },
          { name: "Shorts", path: "/shorts" }
        ]),
        ...shortVideos.length > 0 ? [
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Quran Shorts Video Siyah\u0131s\u0131",
            numberOfItems: shortVideos.length,
            itemListElement: shortVideos.map((v, idx) => ({
              "@type": "ListItem",
              position: idx + 1,
              item: {
                "@type": "VideoObject",
                name: v.title,
                description: v.seoDescription || v.title,
                thumbnailUrl: [v.thumbnailUrl || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`],
                contentUrl: `${baseUrl}/video/${v.videoId}`,
                embedUrl: `https://www.youtube-nocookie.com/embed/${v.videoId}`
              }
            }))
          }
        ] : []
      ],
      noscriptHtml: `<h1>Quran Shorts Tilav\u0259tl\u0259ri</h1><ul>${shortVideos.map((v) => `<li><a href="/video/${escapeHtmlAttr(v.videoId)}">${escapeHtmlText(v.title)}</a></li>`).join("")}</ul>`
    };
  }
  if (cleanPath === "/quran") {
    const quranFaq = [
      {
        question: "Saytdak\u0131 Qurani-K\u0259rim t\u0259rc\xFCm\u0259si kim\u0259 aiddir?",
        answer: "B\xFCt\xFCn 114 sur\u0259 v\u0259 604 s\u0259hif\u0259 \u018Flixan Musayevin son n\u0259\u015Fr (v1.0.4) Az\u0259rbaycan dilin\u0259 m\u0259naca t\u0259rc\xFCm\u0259si il\u0259 t\u0259qdim olunur."
      },
      {
        question: "M\u0259din\u0259 Mushaf\u0131 ne\xE7\u0259 s\u0259hif\u0259 v\u0259 ne\xE7\u0259 c\xFCzd\u0259n ibar\u0259tdir?",
        answer: "Standart M\u0259din\u0259 Mushaf\u0131 604 s\u0259hif\u0259, 30 c\xFCz v\u0259 114 sur\u0259d\u0259n ibar\u0259tdir. H\u0259r s\u0259hif\u0259 v\u0259 c\xFCz ayr\u0131ca \xFCnvanda a\xE7\u0131l\u0131r."
      },
      {
        question: "Quran ay\u0259l\u0259rini s\xF6zb\u0259-s\xF6z nec\u0259 \u0259zb\u0259rl\u0259m\u0259k olar?",
        answer: "M\xFChafiz b\xF6lm\u0259sind\u0259 ist\u0259nil\u0259n M\u0259din\u0259 s\u0259hif\u0259sini (1\u2013604) a\xE7araq s\xF6zl\u0259ri v\u0259 ay\u0259l\u0259ri gizl\u0259dib-a\xE7maqla hifz t\u0259krar\u0131 ed\u0259 bil\u0259rsiniz."
      }
    ];
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: "Tam Qurani-K\u0259rim \u2014 M\u0259din\u0259 \xC7ap\u0131 (604 S\u0259hif\u0259) v\u0259 114 Sur\u0259 | Quran Qiraeti",
      description: "M\u0259din\u0259 \xE7ap\u0131 \xFCzr\u0259 Qurani-K\u0259rimin 604 s\u0259hif\u0259si v\u0259 114 sur\u0259si: \u0259r\u0259bc\u0259 m\u0259tn v\u0259 \u018Flixan Musayevin Az\u0259rbaycan t\u0259rc\xFCm\u0259si (v1.0.4).",
      canonicalUrl: `${baseUrl}/quran`,
      ogImage: defaultOg,
      ogType: "website",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Book",
          name: "Qurani-K\u0259rim (M\u0259din\u0259 \xE7ap\u0131, 604 s\u0259hif\u0259)",
          author: { "@type": "Person", name: "Qurani-K\u0259rim" },
          translator: { "@type": "Person", name: "\u018Flixan Musayev" },
          bookFormat: "https://schema.org/EBook",
          inLanguage: ["ar", "az"],
          numberOfPages: TOTAL_QURAN_PAGES,
          url: `${baseUrl}/quran`
        },
        buildBreadcrumbJsonLd(baseUrl, [
          { name: "Ana s\u0259hif\u0259", path: "/" },
          { name: "Qurani-K\u0259rim", path: "/quran" }
        ]),
        buildFaqPageJsonLd(quranFaq)
      ],
      noscriptHtml: `<h1>Tam Qurani-K\u0259rim \u2014 M\u0259din\u0259 \xC7ap\u0131 (604 S\u0259hif\u0259) v\u0259 114 Sur\u0259</h1><p>\u018Fr\u0259bc\u0259 m\u0259tn v\u0259 \u018Flixan Musayevin Az\u0259rbaycan dilin\u0259 t\u0259rc\xFCm\u0259si.</p><nav>${JUZ_PAGE_RANGES.map((j) => `<a href="/quran/cuz/${j.juz}">${j.juz}. C\xFCz</a>`).join(" \xB7 ")} \xB7 <a href="/dualar">Qurandak\u0131 Dualar</a></nav>`
    };
  }
  if (cleanPath === "/dualar") {
    const duaFaq = [
      {
        question: "Qurandak\u0131 Dualar b\xF6lm\u0259sind\u0259 hans\u0131 dualar toplan\u0131b?",
        answer: `Qurani-K\u0259rimd\u0259n se\xE7ilmi\u015F ${QURAN_DUAS.length} s\u0259hih R\u0259bb\u0259n\u0259 v\u0259 pey\u011F\u0259mb\u0259r duas\u0131 \u2014 hiday\u0259t, ba\u011F\u0131\u015Flanma, ail\u0259, elm v\u0259 s\u0259bir m\xF6vzular\u0131 \xFCzr\u0259 t\u0259qdim olunur.`
      },
      {
        question: "Dualar\u0131n \u0259r\u0259bc\u0259 tilav\u0259tini dinl\u0259m\u0259k m\xFCmk\xFCnd\xFCrm\xFC?",
        answer: "B\u0259li, h\u0259r dua kart\u0131nda se\xE7ilmi\u015F qari il\u0259 ay\u0259nin \u0259r\u0259bc\u0259 s\u0259sli tilav\u0259tini birba\u015Fa dinl\u0259m\u0259k v\u0259 m\u0259tni k\xF6\xE7\xFCrm\u0259k olar."
      },
      {
        question: "Dua ay\u0259l\u0259rini \u015F\u0259kil kart\u0131 kimi y\xFCkl\u0259m\u0259k olurmu?",
        answer: "B\u0259li, ist\u0259nil\u0259n dua v\u0259 ya ay\u0259ni y\xFCks\u0259k keyfiyy\u0259tli 1080\xD71350 PNG \u015F\u0259kil kart\u0131 kimi endirib payla\u015Fa bil\u0259rsiniz."
      }
    ];
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: "Qurandak\u0131 Dualar (R\u0259bb\u0259n\u0259 Dualar\u0131) | Quran Qiraeti",
      description: "Qurani-K\u0259rimd\u0259n se\xE7ilmi\u015F 20 s\u0259hih R\u0259bb\u0259n\u0259 v\u0259 pey\u011F\u0259mb\u0259r duas\u0131 \u2014 \u0259r\u0259bc\u0259 m\u0259tn, \u018Flixan Musayevin Az\u0259rbaycan t\u0259rc\xFCm\u0259si, s\u0259sli tilav\u0259t v\u0259 \u015F\u0259kil kart\u0131 y\xFCkl\u0259m\u0259.",
      canonicalUrl: `${baseUrl}/dualar`,
      ogImage: defaultOg,
      ogType: "website",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Qurandak\u0131 Dualar (R\u0259bb\u0259n\u0259 Dualar\u0131)",
          url: `${baseUrl}/dualar`,
          inLanguage: ["az", "ar"],
          description: "Qurani-K\u0259rimd\u0259n se\xE7ilmi\u015F 20 s\u0259hih R\u0259bb\u0259n\u0259 v\u0259 pey\u011F\u0259mb\u0259r duas\u0131 \u2014 \u0259r\u0259bc\u0259 m\u0259tn, t\u0259rc\xFCm\u0259 v\u0259 s\u0259sli tilav\u0259t."
        },
        buildBreadcrumbJsonLd(baseUrl, [
          { name: "Ana s\u0259hif\u0259", path: "/" },
          { name: "Qurani-K\u0259rim", path: "/quran" },
          { name: "Qurandak\u0131 Dualar", path: "/dualar" }
        ]),
        buildFaqPageJsonLd(duaFaq)
      ],
      noscriptHtml: `<h1>Qurandak\u0131 Dualar (R\u0259bb\u0259n\u0259 Dualar\u0131)</h1><p>Hiday\u0259t, ba\u011F\u0131\u015Flanma, ail\u0259, elm v\u0259 s\u0259bir m\xF6vzular\u0131nda Qurandan se\xE7ilmi\u015F ${QURAN_DUAS.length} dua.</p><ul>${QURAN_DUAS.map(
        (d) => `<li><a href="/quran/sure/${d.surahNumber}#ayah-${d.ayahNumber}">${escapeHtmlText(d.title)} (${escapeHtmlText(d.surahName)} ${escapeHtmlText(d.ayahLabel)})</a>: ${escapeHtmlText(d.translation)}</li>`
      ).join("")}</ul>`
    };
  }
  if (cleanPath === "/namaz-vaxtlari" || cleanPath === "/qible" || cleanPath === "/teqvim") {
    const isCalendar = cleanPath === "/teqvim";
    const isQibla = cleanPath === "/qible";
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: isCalendar ? "Hicri\u2013Miladi T\u0259qvim \xC7eviricisi v\u0259 M\xFCbar\u0259k G\xFCnl\u0259r | Quran Qiraeti" : isQibla ? "Canl\u0131 Qibl\u0259 Kompas\u0131 v\u0259 Namaz Vaxtlar\u0131 | Quran Qiraeti" : "Namaz Vaxtlar\u0131 \u2014 \xDCmm\xFCl-Qura, \xD6lk\u0259l\u0259r v\u0259 X\u0259rit\u0259 | Quran Qiraeti",
      description: isCalendar ? "\xDCmm\xFCl-Qura t\u0259qvimi \xFCzr\u0259 Hicri v\u0259 Miladi tarix \xE7eviricisi, Ramazan ba\u015Flan\u011F\u0131c\u0131, Q\u0259dr gec\u0259si, Ramazan v\u0259 Qurban bayramlar\u0131na qalan g\xFCnl\u0259rin canl\u0131 say\u011Fac\u0131." : "\xDCmm\xFCl-Qura (M\u0259kk\u0259) \xFCsulu il\u0259 Az\u0259rbaycan v\u0259 d\xFCnya \u015F\u0259h\u0259rl\u0259ri \xFCzr\u0259 g\xFCnd\u0259lik v\u0259 h\u0259ft\u0259lik namaz vaxtlar\u0131, x\u0259rit\u0259 \xFCz\u0259rind\u0259n avtomatik m\u0259kan se\xE7imi, Qibl\u0259 buca\u011F\u0131 v\u0259 canl\u0131 gerisay\u0131m.",
      canonicalUrl: `${baseUrl}${cleanPath}`,
      ogImage: defaultOg,
      ogType: "website",
      jsonLd: buildBreadcrumbJsonLd(baseUrl, [
        { name: "Ana s\u0259hif\u0259", path: "/" },
        {
          name: isCalendar ? "Hicri\u2013Miladi T\u0259qvim" : isQibla ? "Qibl\u0259 Kompas\u0131" : "Namaz Vaxtlar\u0131",
          path: cleanPath
        }
      ]),
      noscriptHtml: isCalendar ? "<h1>Hicri\u2013Miladi T\u0259qvim \xC7eviricisi v\u0259 M\xFCbar\u0259k G\xFCnl\u0259r</h1><p>\xDCmm\xFCl-Qura t\u0259qvimi \u0259sas\u0131nda Hicri v\u0259 Miladi tarixl\u0259rin \xE7evrilm\u0259si v\u0259 qar\u015F\u0131dak\u0131 bayramlar\u0131n say\u011Fac\u0131.</p>" : "<h1>Namaz Vaxtlar\u0131 \u2014 \xDCmm\xFCl-Qura v\u0259 X\u0259rit\u0259 Se\xE7imi</h1><p>Az\u0259rbaycan v\u0259 d\xFCnya \u015F\u0259h\u0259rl\u0259ri \xFCzr\u0259 g\xFCnd\u0259lik S\xFCbh, G\xFCn\u0259\u015F, Z\xF6hr, \u018Fsr, M\u0259\u011Frib v\u0259 \u0130\u015Fa vaxtlar\u0131.</p>"
    };
  }
  if (cleanPath === "/elifba") {
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: "\u018Fr\u0259b \u018Flifbas\u0131, H\u0259r\u0259k\u0259l\u0259r v\u0259 T\u0259cvid B\u0259l\u0259d\xE7isi | Quran Qiraeti",
      description: "28 \u0259r\u0259b h\u0259rfinin t\u0259k, ba\u015Fda, ortada v\u0259 sonda yaz\u0131l\u0131\u015F formalar\u0131, m\u0259xr\u0259cl\u0259ri, canl\u0131 h\u0259r\u0259k\u0259 qurucusu, \u0259sas t\u0259cvid qaydalar\u0131 v\u0259 Quran ay\u0259l\u0259rind\u0259n s\u0259sli n\xFCmun\u0259l\u0259r.",
      canonicalUrl: `${baseUrl}/elifba`,
      ogImage: defaultOg,
      ogType: "website",
      jsonLd: buildBreadcrumbJsonLd(baseUrl, [
        { name: "Ana s\u0259hif\u0259", path: "/" },
        { name: "Qurani-K\u0259rim", path: "/quran" },
        { name: "\u018Flifba v\u0259 T\u0259cvid", path: "/elifba" }
      ]),
      noscriptHtml: "<h1>\u0130nteraktiv \u018Fr\u0259b \u018Flifbas\u0131 v\u0259 T\u0259cvid B\u0259l\u0259d\xE7isi</h1><p>28 \u0259r\u0259b h\u0259rfinin yaz\u0131l\u0131\u015F formalar\u0131, m\u0259xr\u0259c n\xF6qt\u0259l\u0259ri, h\u0259r\u0259k\u0259l\u0259r v\u0259 \u0259sas t\u0259cvid qaydalar\u0131.</p>"
    };
  }
  if (cleanPath === "/zikr") {
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: "S\u0259h\u0259r v\u0259 Ax\u015Fam Zikrl\u0259ri (M\xFCs\u0259lman Qalas\u0131) | Quran Qiraeti",
      description: "M\xFCs\u0259lman Qalas\u0131 (Hisn al-Muslim) kitab\u0131ndan b\xFCt\xFCn s\u0259h\u0259r, ax\u015Fam v\u0259 namaz sonras\u0131 zikrl\u0259r \u2014 \u0259r\u0259bc\u0259 m\u0259tn, oxunu\u015F v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si.",
      canonicalUrl: `${baseUrl}/zikr`,
      ogImage: defaultOg,
      ogType: "website",
      jsonLd: buildBreadcrumbJsonLd(baseUrl, [
        { name: "Ana s\u0259hif\u0259", path: "/" },
        { name: "S\u0259h\u0259r v\u0259 Ax\u015Fam Zikrl\u0259ri", path: "/zikr" }
      ]),
      noscriptHtml: "<h1>S\u0259h\u0259r v\u0259 Ax\u015Fam Zikrl\u0259ri (M\xFCs\u0259lman Qalas\u0131)</h1><p>M\xFCs\u0259lman Qalas\u0131 kitab\u0131ndan b\xFCt\xFCn s\u0259h\u0259r, ax\u015Fam v\u0259 namaz sonras\u0131 zikrl\u0259r \u2014 \u0259r\u0259bc\u0259 m\u0259tn v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si.</p>"
    };
  }
  if (cleanPath === "/gunun-ayesi") {
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: "G\xFCn\xFCn Ay\u0259si v\u0259 T\u0259f\u0259kk\xFCr | Quran Qiraeti",
      description: "Se\xE7ilmi\u015F Quran ay\u0259l\u0259ri, \u0259r\u0259bc\u0259 m\u0259tn v\u0259 Az\u0259rbaycan dilind\u0259 m\u0259naca t\u0259rc\xFCm\u0259si il\u0259 g\xFCnd\u0259lik t\u0259f\u0259kk\xFCr.",
      canonicalUrl: `${baseUrl}/gunun-ayesi`,
      ogImage: defaultOg,
      ogType: "article",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "G\xFCn\xFCn Ay\u0259si v\u0259 T\u0259f\u0259kk\xFCr",
          description: "Se\xE7ilmi\u015F Quran ay\u0259l\u0259ri, \u0259r\u0259bc\u0259 m\u0259tn v\u0259 Az\u0259rbaycan dilind\u0259 m\u0259naca t\u0259rc\xFCm\u0259si il\u0259 g\xFCnd\u0259lik t\u0259f\u0259kk\xFCr.",
          url: `${baseUrl}/gunun-ayesi`,
          inLanguage: ["az", "ar"],
          publisher: {
            "@type": "Organization",
            name: "Quran Qiraeti",
            url: `${baseUrl}/`
          }
        },
        buildBreadcrumbJsonLd(baseUrl, [
          { name: "Ana s\u0259hif\u0259", path: "/" },
          { name: "G\xFCn\xFCn Ay\u0259si", path: "/gunun-ayesi" }
        ])
      ],
      noscriptHtml: "<h1>G\xFCn\xFCn Ay\u0259si v\u0259 T\u0259f\u0259kk\xFCr</h1><p>G\xFCnd\u0259lik se\xE7ilmi\u015F Quran ay\u0259l\u0259ri, \u0259r\u0259bc\u0259 m\u0259tn v\u0259 t\u0259rc\xFCm\u0259.</p>"
    };
  }
  if (cleanPath === "/haqqinda") {
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: "Kanal Haqq\u0131nda | Quran Qiraeti",
      description: "Quran Qiraeti YouTube kanal\u0131n\u0131n m\u0259qs\u0259di, t\u0259rc\xFCm\u0259 prinsipl\u0259ri v\u0259 se\xE7ilmi\u015F qaril\u0259r haqq\u0131nda m\u0259lumat.",
      canonicalUrl: `${baseUrl}/haqqinda`,
      ogImage: defaultOg,
      ogType: "website",
      jsonLd: buildBreadcrumbJsonLd(baseUrl, [
        { name: "Ana s\u0259hif\u0259", path: "/" },
        { name: "Haqq\u0131nda", path: "/haqqinda" }
      ]),
      noscriptHtml: "<h1>Quran Qiraeti Kanal\u0131 Haqq\u0131nda</h1>"
    };
  }
  if (cleanPath === "/istek") {
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: "Sur\u0259 \u0130st\u0259yi G\xF6nd\u0259r | Quran Qiraeti",
      description: "Quran Qiraeti kanal\u0131nda n\xF6vb\u0259ti yay\u0131mlanmas\u0131n\u0131 ist\u0259diyiniz sur\u0259ni v\u0259 qarini t\u0259klif edin.",
      canonicalUrl: `${baseUrl}/istek`,
      ogImage: defaultOg,
      ogType: "website",
      jsonLd: buildBreadcrumbJsonLd(baseUrl, [
        { name: "Ana s\u0259hif\u0259", path: "/" },
        { name: "Sur\u0259 \u0130st\u0259yi", path: "/istek" }
      ]),
      noscriptHtml: "<h1>Sur\u0259 \u0130st\u0259yi G\xF6nd\u0259r</h1>"
    };
  }
  const surahMatch = cleanPath.match(/^\/quran\/(?:sure\/)?(\d+)$/);
  if (surahMatch) {
    const num = Number.parseInt(surahMatch[1], 10);
    const surah = getSurahByNumber(num);
    if (!surah) {
      return {
        httpStatus: 404,
        robots: robotsNoIndex,
        title: "Sur\u0259 tap\u0131lmad\u0131 (404) | Quran Qiraeti",
        description: "Qurani-K\u0259rimd\u0259 sur\u0259 n\xF6mr\u0259si 1 il\u0259 114 aras\u0131nda olmal\u0131d\u0131r.",
        canonicalUrl: `${baseUrl}/quran`,
        ogImage: defaultOg,
        ogType: "website",
        noscriptHtml: "<h1>Sur\u0259 tap\u0131lmad\u0131</h1>"
      };
    }
    const faq = buildSurahFaqEntries(surah);
    const startJuz = getJuzForPage(surah.startPage);
    const faqHtml = `<section><h2>${escapeHtmlText(surah.name)} sur\u0259si haqq\u0131nda tez-tez veril\u0259n suallar</h2><dl>${faq.map(
      (item) => `<dt>${escapeHtmlText(item.question)}</dt><dd>${escapeHtmlText(item.answer)}</dd>`
    ).join("")}</dl></section>`;
    const ayahsHtml = extras?.surahPayload && extras.surahPayload.surahNumber === surah.number ? `<article>${extras.surahPayload.ayahs.map(
      (a) => `<div><p dir="rtl" lang="ar">${escapeHtmlText(a.arabicText)} \uFD3F${a.ayahNumber}\uFD3E</p><p lang="az">${a.ayahNumber}. ${escapeHtmlText(a.translation)}</p></div>`
    ).join("")}</article>` : "";
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: `${surah.number}. ${surah.name} sur\u0259si \u2014 \u018Fr\u0259bc\u0259 v\u0259 T\u0259rc\xFCm\u0259 | Quran Qiraeti`,
      description: `${surah.name} sur\u0259si (${surah.ayahCount} ay\u0259, ${surah.revelationPlace}, M\u0259din\u0259 \xE7ap\u0131 S\u0259hif\u0259 ${surah.startPage}). \u018Fr\u0259bc\u0259 m\u0259tn v\u0259 \u018Flixan Musayevin Az\u0259rbaycan t\u0259rc\xFCm\u0259si.`,
      canonicalUrl: `${baseUrl}/quran/sure/${surah.number}`,
      ogImage: defaultOg,
      ogType: "article",
      prevUrl: surah.number > 1 ? `${baseUrl}/quran/sure/${surah.number - 1}` : void 0,
      nextUrl: surah.number < TOTAL_QURAN_SURAHS ? `${baseUrl}/quran/sure/${surah.number + 1}` : void 0,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Chapter",
          name: `${surah.number}. ${surah.name} sur\u0259si`,
          position: surah.number,
          inLanguage: ["ar", "az"],
          translator: {
            "@type": "Person",
            name: "\u018Flixan Musayev"
          },
          url: `${baseUrl}/quran/sure/${surah.number}`
        },
        buildBreadcrumbJsonLd(baseUrl, [
          { name: "Ana s\u0259hif\u0259", path: "/" },
          { name: "Qurani-K\u0259rim", path: "/quran" },
          { name: `${surah.name} sur\u0259si`, path: `/quran/sure/${surah.number}` }
        ]),
        buildFaqPageJsonLd(faq)
      ],
      noscriptHtml: `<h1>${escapeHtmlText(`${surah.number}. ${surah.name} sur\u0259si (${surah.arabicName})`)}</h1><p>${escapeHtmlText(`${surah.ayahCount} ay\u0259 \xB7 ${surah.revelationPlace} \xB7 ${startJuz}-ci C\xFCz \xB7 M\u0259din\u0259 \xE7ap\u0131 S\u0259hif\u0259 ${surah.startPage} \xB7 \u018Flixan Musayev t\u0259rc\xFCm\u0259si`)}</p><nav><a href="/quran/sehife/${surah.startPage}">M\u0259din\u0259 s\u0259hif\u0259si ${surah.startPage}</a> \xB7 <a href="/muhaffiz/${surah.startPage}">M\xFChafizd\u0259 \u0259zb\u0259rl\u0259</a> \xB7 <a href="/quran/cuz/${startJuz}">${startJuz}-ci C\xFCz</a></nav>${ayahsHtml}${faqHtml}`
    };
  }
  const cuzMatch = cleanPath.match(/^\/quran\/cuz\/(\d+)$/);
  if (cuzMatch) {
    const juzNum = Number.parseInt(cuzMatch[1], 10);
    const range = JUZ_PAGE_RANGES.find((j) => j.juz === juzNum);
    if (!range) {
      return {
        httpStatus: 404,
        robots: robotsNoIndex,
        title: "C\xFCz tap\u0131lmad\u0131 (404) | Quran Qiraeti",
        description: "Qurani-K\u0259rimd\u0259 c\xFCz n\xF6mr\u0259si 1 il\u0259 30 aras\u0131nda olmal\u0131d\u0131r.",
        canonicalUrl: `${baseUrl}/quran`,
        ogImage: defaultOg,
        ogType: "website",
        noscriptHtml: "<h1>C\xFCz tap\u0131lmad\u0131</h1>"
      };
    }
    const ordinalJuz = formatAzerbaijaniOrdinal(juzNum);
    const matchingSurahs = SURAH_CATALOG.filter((s, idx) => {
      const nextStart = SURAH_CATALOG[idx + 1]?.startPage ?? TOTAL_QURAN_PAGES;
      const surahEndPage = Math.max(s.startPage, nextStart);
      return s.startPage <= range.endPage && surahEndPage >= range.startPage;
    });
    const surahNamesPreview = matchingSurahs.slice(0, 4).map((s) => s.name).join(", ");
    const description = `M\u0259din\u0259 Mushaf\u0131n\u0131n ${ordinalJuz} C\xFCz\xFC (S\u0259hif\u0259 ${range.startPage}\u2013${range.endPage}): ${surahNamesPreview} sur\u0259l\u0259ri \u2014 \u0259r\u0259bc\u0259 m\u0259tn v\u0259 \u018Flixan Musayev t\u0259rc\xFCm\u0259si.`;
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: `${ordinalJuz} C\xFCz (S\u0259hif\u0259 ${range.startPage}\u2013${range.endPage}) | Quran Qiraeti`,
      description,
      canonicalUrl: `${baseUrl}/quran/cuz/${juzNum}`,
      ogImage: defaultOg,
      ogType: "website",
      prevUrl: juzNum > 1 ? `${baseUrl}/quran/cuz/${juzNum - 1}` : void 0,
      nextUrl: juzNum < 30 ? `${baseUrl}/quran/cuz/${juzNum + 1}` : void 0,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${ordinalJuz} C\xFCz \u2014 Qurani-K\u0259rim (S\u0259hif\u0259 ${range.startPage}\u2013${range.endPage})`,
          description,
          inLanguage: ["ar", "az"],
          url: `${baseUrl}/quran/cuz/${juzNum}`
        },
        buildBreadcrumbJsonLd(baseUrl, [
          { name: "Ana s\u0259hif\u0259", path: "/" },
          { name: "Qurani-K\u0259rim", path: "/quran" },
          { name: `${ordinalJuz} C\xFCz`, path: `/quran/cuz/${juzNum}` }
        ])
      ],
      noscriptHtml: `<h1>${escapeHtmlText(`${ordinalJuz} C\xFCz (S\u0259hif\u0259 ${range.startPage}\u2013${range.endPage})`)}</h1><p>${escapeHtmlText(description)}</p><nav><a href="/quran/sehife/${range.startPage}">S\u0259hif\u0259 ${range.startPage}-d\u0259n oxu</a> \xB7 <a href="/muhaffiz/${range.startPage}">M\xFChafizd\u0259 \u0259zb\u0259rl\u0259</a></nav><ul>${matchingSurahs.map((s) => `<li><a href="/quran/sure/${s.number}">${escapeHtmlText(`${s.number}. ${s.name} sur\u0259si`)}</a></li>`).join("")}</ul>`
    };
  }
  const mushafMatch = cleanPath.match(/^\/quran\/sehife\/(\d+)$/);
  if (mushafMatch) {
    const pageNum = Number.parseInt(mushafMatch[1], 10);
    if (Number.isNaN(pageNum) || pageNum < 1 || pageNum > TOTAL_QURAN_PAGES) {
      return {
        httpStatus: 404,
        robots: robotsNoIndex,
        title: "Mushaf s\u0259hif\u0259si tap\u0131lmad\u0131 (404) | Quran Qiraeti",
        description: "M\u0259din\u0259 Mushaf\u0131 s\u0259hif\u0259l\u0259ri 1 il\u0259 604 aras\u0131nda n\xF6mr\u0259l\u0259nmi\u015Fdir.",
        canonicalUrl: `${baseUrl}/quran`,
        ogImage: defaultOg,
        ogType: "website",
        noscriptHtml: "<h1>S\u0259hif\u0259 tap\u0131lmad\u0131</h1>"
      };
    }
    const juz = getJuzForPage(pageNum);
    const ordinal = formatAzerbaijaniOrdinal(pageNum);
    const activeRub = getActiveRubForPage(pageNum);
    const mushafAyahsHtml = extras?.mushafPayload && extras.mushafPayload.pageNumber === pageNum ? `<article>${extras.mushafPayload.ayahs.map(
      (a) => `<div><p><strong>${escapeHtmlText(a.surahName)} ${a.surahNumber}:${a.ayahNumber}</strong></p><p dir="rtl" lang="ar">${escapeHtmlText(a.arabicText)}</p><p lang="az">${escapeHtmlText(a.translation)}</p></div>`
    ).join("")}</article>` : "";
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: `Qurani-K\u0259rim \u2014 ${ordinal} s\u0259hif\u0259 (M\u0259din\u0259 \xE7ap\u0131) | Quran Qiraeti`,
      description: `M\u0259din\u0259 \xE7ap\u0131 \xFCzr\u0259 Qurani-K\u0259rimin ${pageNum}-ci s\u0259hif\u0259si (${juz}-ci C\xFCz, R\xFCb ${activeRub.rub}/240): \u0259r\u0259bc\u0259 m\u0259tn v\u0259 \u018Flixan Musayevin Az\u0259rbaycan t\u0259rc\xFCm\u0259si.`,
      canonicalUrl: `${baseUrl}/quran/sehife/${pageNum}`,
      ogImage: defaultOg,
      ogType: "article",
      prevUrl: pageNum > 1 ? `${baseUrl}/quran/sehife/${pageNum - 1}` : void 0,
      nextUrl: pageNum < TOTAL_QURAN_PAGES ? `${baseUrl}/quran/sehife/${pageNum + 1}` : void 0,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `Qurani-K\u0259rim \u2014 S\u0259hif\u0259 ${pageNum}`,
          url: `${baseUrl}/quran/sehife/${pageNum}`,
          inLanguage: ["ar", "az"]
        },
        buildBreadcrumbJsonLd(baseUrl, [
          { name: "Ana s\u0259hif\u0259", path: "/" },
          { name: "Qurani-K\u0259rim", path: "/quran" },
          { name: `S\u0259hif\u0259 ${pageNum}`, path: `/quran/sehife/${pageNum}` }
        ])
      ],
      noscriptHtml: `<h1>Qurani-K\u0259rim \u2014 ${escapeHtmlText(ordinal)} s\u0259hif\u0259 (${juz}-ci C\xFCz \xB7 R\xFCb ${activeRub.rub}/240)</h1><nav>${pageNum > 1 ? `<a href="/quran/sehife/${pageNum - 1}">\u018Fvv\u0259lki s\u0259hif\u0259 (${pageNum - 1})</a> \xB7 ` : ""}<a href="/muhaffiz/${pageNum}">M\xFChafizd\u0259 \u0259zb\u0259rl\u0259</a>${pageNum < TOTAL_QURAN_PAGES ? ` \xB7 <a href="/quran/sehife/${pageNum + 1}">N\xF6vb\u0259ti s\u0259hif\u0259 (${pageNum + 1})</a>` : ""}</nav>${mushafAyahsHtml}`
    };
  }
  const muhaffizMatch = cleanPath.match(/^\/(?:muhaffiz|ezber)(?:\/(\d+))?$/);
  if (muhaffizMatch) {
    const rawPage = muhaffizMatch[1] ? Number.parseInt(muhaffizMatch[1], 10) : 1;
    if (muhaffizMatch[1] && (Number.isNaN(rawPage) || rawPage < 1 || rawPage > TOTAL_QURAN_PAGES)) {
      return {
        httpStatus: 404,
        robots: robotsNoIndex,
        title: "M\xFChafiz s\u0259hif\u0259si tap\u0131lmad\u0131 (404) | Quran Qiraeti",
        description: "M\xFChafiz Mushaf\u0131 s\u0259hif\u0259l\u0259ri 1 il\u0259 604 aras\u0131ndad\u0131r.",
        canonicalUrl: `${baseUrl}/muhaffiz`,
        ogImage: defaultOg,
        ogType: "website",
        noscriptHtml: "<h1>S\u0259hif\u0259 tap\u0131lmad\u0131</h1>"
      };
    }
    const pageNum = clampMuhaffizPage(rawPage);
    const canonicalPath = muhaffizMatch[1] ? `/muhaffiz/${pageNum}` : "/muhaffiz";
    const muhaffizFaq = [
      {
        question: "M\xFChafiz \u0259zb\u0259r al\u0259ti nec\u0259 i\u015Fl\u0259yir?",
        answer: "Orijinal 15 s\u0259tirlik M\u0259din\u0259 Mushaf\u0131 s\u0259hif\u0259l\u0259rind\u0259 s\xF6zl\u0259ri v\u0259 ya b\xFCt\xF6v ay\u0259l\u0259ri gizl\u0259dib toxunu\u015Fla a\xE7araq \xF6z\xFCn\xFCz\xFC s\u0131naya bil\u0259rsiniz."
      },
      {
        question: "M\xFChafizd\u0259 ne\xE7\u0259 qari il\u0259 s\u0259sli t\u0259krar m\xFCmk\xFCnd\xFCr?",
        answer: "H\u0259r s\u0259hif\u0259 v\u0259 ay\u0259 \xFCzr\u0259 se\xE7ilmi\u015F 5 f\u0259rqli qari il\u0259 s\u0259sli oxutma v\u0259 f\u0259rdi ay\u0259 t\u0259krar\u0131 funksiyas\u0131 m\xF6vcuddur."
      }
    ];
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: `M\xFChafiz (\u018Fzb\u0259r Mushaf\u0131) \u2014 S\u0259hif\u0259 ${pageNum} | Quran Qiraeti`,
      description: "Ay\u0259l\u0259ri s\xF6zb\u0259-s\xF6z v\u0259 ya ay\u0259-ay\u0259 gizl\u0259dib-a\xE7araq 1\u2013604 M\u0259din\u0259 Mushaf\u0131 s\u0259hif\u0259sind\u0259 Qurani-K\u0259rimi \u0259zb\u0259rl\u0259m\u0259k \xFC\xE7\xFCn M\xFChafiz al\u0259ti.",
      canonicalUrl: `${baseUrl}${canonicalPath}`,
      ogImage: defaultOg,
      ogType: "website",
      prevUrl: pageNum > 1 ? `${baseUrl}/muhaffiz/${pageNum - 1}` : void 0,
      nextUrl: pageNum < TOTAL_QURAN_PAGES ? `${baseUrl}/muhaffiz/${pageNum + 1}` : void 0,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "M\xFChafiz \u2014 Quran \u018Fzb\u0259r Mushaf\u0131",
          applicationCategory: "EducationalApplication",
          operatingSystem: "All",
          inLanguage: ["az", "ar"],
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD"
          },
          url: `${baseUrl}${canonicalPath}`
        },
        buildBreadcrumbJsonLd(baseUrl, [
          { name: "Ana s\u0259hif\u0259", path: "/" },
          { name: "M\xFChafiz", path: "/muhaffiz" },
          ...muhaffizMatch[1] ? [{ name: `S\u0259hif\u0259 ${pageNum}`, path: `/muhaffiz/${pageNum}` }] : []
        ]),
        ...!muhaffizMatch[1] ? [buildFaqPageJsonLd(muhaffizFaq)] : []
      ],
      noscriptHtml: `<h1>M\xFChafiz \u2014 M\u0259din\u0259 Mushaf\u0131 S\u0259hif\u0259 ${pageNum}</h1><p>S\xF6zb\u0259-s\xF6z v\u0259 ay\u0259-ay\u0259 Quran \u0259zb\u0259rl\u0259m\u0259 al\u0259ti.</p>`
    };
  }
  const videoMatch = cleanPath.match(/^\/video\/([a-zA-Z0-9_-]+)$/);
  if (videoMatch) {
    const videoId = videoMatch[1];
    const video = videos.find((v) => v.videoId === videoId);
    const title = video ? `${video.title} \u2014 ${video.reciter} | Quran Qiraeti` : `Quran Tilav\u0259ti (${videoId}) | Quran Qiraeti`;
    const description = video?.seoDescription || "Quran Qiraeti kanal\u0131ndan \u0259r\u0259bc\u0259 Quran tilav\u0259ti, sur\u0259 ay\u0259l\u0259ri v\u0259 Az\u0259rbaycan dilind\u0259 t\u0259rc\xFCm\u0259.";
    const ogImage = video?.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title,
      description,
      canonicalUrl: `${baseUrl}/video/${videoId}`,
      ogImage,
      ogType: "video.other",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: video?.title ?? title,
          description,
          thumbnailUrl: [ogImage],
          uploadDate: video?.published || void 0,
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
          contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
          inLanguage: ["ar", "az"]
        },
        buildBreadcrumbJsonLd(baseUrl, [
          { name: "Ana s\u0259hif\u0259", path: "/" },
          ...video?.format === "short" ? [{ name: "Shorts", path: "/shorts" }] : [],
          { name: video?.title ?? videoId, path: `/video/${videoId}` }
        ])
      ],
      noscriptHtml: `<h1>${escapeHtmlText(video?.title ?? title)}</h1><p>${escapeHtmlText(description)}</p>`
    };
  }
  return {
    httpStatus: 404,
    robots: robotsNoIndex,
    title: "S\u0259hif\u0259 tap\u0131lmad\u0131 (404) | Quran Qiraeti",
    description: "Axtard\u0131\u011F\u0131n\u0131z s\u0259hif\u0259 tap\u0131lmad\u0131. Qurani-K\u0259rim v\u0259 tilav\u0259t arxivin\u0259 qay\u0131d\u0131n.",
    canonicalUrl: `${baseUrl}/`,
    ogImage: defaultOg,
    ogType: "website",
    noscriptHtml: "<h1>404 \u2014 S\u0259hif\u0259 tap\u0131lmad\u0131</h1>"
  };
}
function injectRouteSeoIntoHtml(html, meta, options) {
  const safeTitle = escapeHtmlText(meta.title);
  const safeDesc = escapeHtmlAttr(meta.description);
  const safeRobots = escapeHtmlAttr(meta.robots);
  const safeCanonical = escapeHtmlAttr(meta.canonicalUrl);
  const safeOgImage = escapeHtmlAttr(meta.ogImage);
  const safeOgType = escapeHtmlAttr(meta.ogType);
  const verificationToken = (options?.googleSiteVerification ?? "").trim();
  let out = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`).replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${safeDesc}" />`
  ).replace(
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="robots" content="${safeRobots}" />`
  ).replace(
    /<meta\s+name="googlebot"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="googlebot" content="${safeRobots}" />`
  ).replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtmlAttr(meta.title)}" />`
  ).replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${safeDesc}" />`
  ).replace(
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="${safeOgType}" />`
  ).replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${safeOgImage}" />`
  ).replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${safeOgImage}" />`
  ).replace(/<meta\s+name="google-site-verification"\s+content="[^"]*"\s*\/?>\s*/gi, "").replace(/<meta\s+property="og:(?:url|image:alt)"\s+content="[^"]*"\s*\/?>\s*/gi, "").replace(/<meta\s+name="twitter:(?:title|description)"\s+content="[^"]*"\s*\/?>\s*/gi, "").replace(/<link\s+rel="(?:canonical|prev|next)"\s+href="[^"]*"\s*\/?>\s*/gi, "").replace(/<link\s+rel="alternate"\s+hreflang="(?:az|x-default)"\s+href="[^"]*"\s*\/?>\s*/gi, "").replace(/<script\s+id="quran-qiraeti-ssr-jsonld"\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, "");
  const extraHeadTags = [
    verificationToken ? `<meta name="google-site-verification" content="${escapeHtmlAttr(verificationToken)}" />` : "",
    `<link rel="canonical" href="${safeCanonical}" />`,
    `<meta property="og:url" content="${safeCanonical}" />`,
    `<meta property="og:image:alt" content="${escapeHtmlAttr(meta.title)}" />`,
    `<meta name="twitter:title" content="${escapeHtmlAttr(meta.title)}" />`,
    `<meta name="twitter:description" content="${safeDesc}" />`,
    `<link rel="alternate" hreflang="az" href="${safeCanonical}" />`,
    `<link rel="alternate" hreflang="x-default" href="${safeCanonical}" />`,
    meta.prevUrl ? `<link rel="prev" href="${escapeHtmlAttr(meta.prevUrl)}" />` : "",
    meta.nextUrl ? `<link rel="next" href="${escapeHtmlAttr(meta.nextUrl)}" />` : "",
    meta.jsonLd ? `<script id="quran-qiraeti-ssr-jsonld" type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c")}</script>` : ""
  ].filter(Boolean).join("\n    ");
  out = out.replace("</head>", `    ${extraHeadTags}
  </head>`);
  out = out.replace(
    '<div id="root"></div>',
    `<div id="root"></div>
    <noscript>${meta.noscriptHtml}</noscript>`
  );
  return out;
}
async function submitIndexNowPing(host, key, urlList) {
  if (!key || !host || urlList.length === 0) {
    return { submitted: false, status: 0 };
  }
  const cleanHost = host.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: cleanHost,
      key,
      keyLocation: `https://${cleanHost}/${key}.txt`,
      urlList: urlList.slice(0, 100)
    }),
    signal: AbortSignal.timeout(5e3)
  });
  return { submitted: res.ok, status: res.status };
}
function buildLlmsTxt(origin, stats, longVideos, shorts) {
  const baseUrl = normalizeBaseUrl(origin);
  const topLong = longVideos.slice(0, 20);
  const topShorts = shorts.slice(0, 25);
  const lines = [
    `# ${stats.name}`,
    "",
    `> ${stats.description} Official web archive for YouTube channel ${stats.handle} (${stats.youtubeUrl}). Provides Arabic Quran text paired with the latest Azerbaijani meaningful translation by \u018Flixan Musayev (v1.0.4) across all 114 surahs, all 604 Mushaf pages, long-form recitations, and Shorts.`,
    "",
    "## Core Pages",
    `- [Uzun Videolar (Ana s\u0259hif\u0259)](${baseUrl}/): Tam sur\u0259 v\u0259 uzun Quran tilav\u0259tl\u0259ri arxivi.`,
    `- [Shorts B\xF6lm\u0259si](${baseUrl}/shorts): Kanaldak\u0131 b\xFCt\xFCn q\u0131sa Quran tilav\u0259tl\u0259ri (${shorts.length} video) v\u0259 SEO m\u0259lumatlar\u0131.`,
    `- [Tam Qurani-K\u0259rim](${baseUrl}/quran): B\xFCt\xFCn 114 sur\u0259 v\u0259 604 Mushaf s\u0259hif\u0259si \xFCzr\u0259 \u0259r\u0259bc\u0259 m\u0259tn v\u0259 \u018Flixan Musayev t\u0259rc\xFCm\u0259si.`,
    `- [Qurandak\u0131 Dualar](${baseUrl}/dualar): Qurandan se\xE7ilmi\u015F ${QURAN_DUAS.length} R\u0259bb\u0259n\u0259 v\u0259 pey\u011F\u0259mb\u0259r duas\u0131 \u2014 s\u0259sli tilav\u0259t v\u0259 t\u0259rc\xFCm\u0259.`,
    `- [S\u0259h\u0259r v\u0259 Ax\u015Fam Zikrl\u0259ri](${baseUrl}/zikr): M\xFCs\u0259lman Qalas\u0131 kitab\u0131ndan b\xFCt\xFCn s\u0259h\u0259r, ax\u015Fam v\u0259 namaz sonras\u0131 zikrl\u0259r.`,
    `- [Namaz Vaxtlar\u0131](${baseUrl}/namaz-vaxtlari): Bak\u0131, G\u0259nc\u0259, Sumqay\u0131t, Nax\xE7\u0131van, \u015E\u0259ki, \u015Eu\u015Fa v\u0259 dig\u0259r Az\u0259rbaycan \u015F\u0259h\u0259rl\u0259ri \xFCzr\u0259 namaz vaxtlar\u0131.`,
    `- [M\xFChafiz \u2014 \u018Fzb\u0259r Mushaf\u0131](${baseUrl}/muhaffiz): 604 Mushaf s\u0259hif\u0259sind\u0259 ay\u0259l\u0259ri s\xF6zb\u0259-s\xF6z v\u0259 ay\u0259-ay\u0259 gizl\u0259dib-a\xE7araq hifz v\u0259 t\u0259krar al\u0259ti.`,
    `- [G\xFCn\xFCn Ay\u0259si](${baseUrl}/gunun-ayesi): Se\xE7ilmi\u015F ay\u0259l\u0259r, \u0259r\u0259bc\u0259 m\u0259tn v\u0259 t\u0259f\u0259kk\xFCr izah\u0131.`,
    `- [Kanal Haqq\u0131nda](${baseUrl}/haqqinda): Kanal\u0131n m\u0259qs\u0259di, qaril\u0259r v\u0259 t\u0259rc\xFCm\u0259 prinsipl\u0259ri.`,
    `- [Sur\u0259 \u0130st\u0259yi](${baseUrl}/istek): Dinl\u0259yicil\u0259r \xFC\xE7\xFCn sur\u0259 v\u0259 qari t\u0259klifi formu.`,
    "",
    "## Machine-Readable Endpoints for AI & Search Crawlers",
    `- [XML Sitemap](${baseUrl}/sitemap.xml): Complete URL index (core routes, 30 Juz, 114 surahs, 604 Mushaf pages, all channel videos).`,
    `- [XML Sitemap Index](${baseUrl}/sitemap-index.xml): Split sitemaps (core, surahs, mushaf, muhaffiz 1..604, Google video sitemap).`,
    `- [Google Video Sitemap](${baseUrl}/sitemap-videos.xml): Structured Video Sitemap with duration and thumbnails.`,
    `- [RSS 2.0 Feed](${baseUrl}/rss.xml): Syndicated XML feed of Quran Qiraeti long recitations and Shorts.`,
    `- [Full LLM Reference](${baseUrl}/llms-full.txt): Expanded catalog of all 114 surahs, 30 Juz page ranges, and channel videos.`,
    `- [AI Structured JSON Index](${baseUrl}/ai-index.json): Structured JSON feed of channel stats, surahs, and video metadata.`,
    `- [Channel Feed JSON](${baseUrl}/api/channel): Live long videos and Shorts metadata JSON.`,
    `- [Surah Translation JSON Pattern](${baseUrl}/api/quran/surah/{1..114}): Arabic text, \u018Flixan Musayev Azerbaijani translation (v1.0.4), and footnotes per surah.`,
    `- [Mushaf Page JSON Pattern](${baseUrl}/api/quran/page/{1..604}): Exact ayahs per Mushaf page with Arabic Uthmani text and \u018Flixan Musayev translation.`,
    "",
    "## Complete Quran Index (114 Surahs, 30 Juz & 604 Pages)",
    `- Individual Juz Pages: ${baseUrl}/quran/cuz/{1..30}`,
    `- Individual Surah Pages: ${baseUrl}/quran/sure/{1..114}`,
    `- Individual Mushaf Pages: ${baseUrl}/quran/sehife/{1..604}`,
    `- Individual Muhaffiz Memorization Pages: ${baseUrl}/muhaffiz/{1..604}`,
    ...SURAH_CATALOG.map(
      (s) => `- [${s.number}. ${s.name} sur\u0259si (${s.arabicName})](${baseUrl}/quran/sure/${s.number}): ${s.ayahCount} ay\u0259 \xB7 ${s.revelationPlace} \xB7 Mushaf s\u0259hif\u0259 ${s.startPage}`
    ),
    "",
    "## Recent Long Recitations",
    ...topLong.map(
      (v) => `- [${v.title}](${baseUrl}/video/${v.videoId}): ${v.surahName} (${v.ayahRange}) \xB7 ${v.reciter} \xB7 ${v.duration}`
    ),
    "",
    "## Recent Shorts Recitations",
    ...topShorts.map(
      (v) => `- [${v.title}](${baseUrl}/video/${v.videoId}): ${v.surahName} (${v.ayahRange}) \xB7 ${v.duration} \u2014 ${v.seoDescription}`
    ),
    ""
  ];
  return lines.join("\n");
}
function buildLlmsFullTxt(origin, stats, longVideos, shorts) {
  const baseUrl = normalizeBaseUrl(origin);
  const lines = [
    `# ${stats.name} \u2014 Complete AI Knowledge Reference`,
    "",
    `- Channel Handle: ${stats.handle}`,
    `- YouTube URL: ${stats.youtubeUrl}`,
    `- Subscribers: ${stats.subscribersLabel}`,
    `- Total Videos: ${stats.videoCountLabel}`,
    `- Long Videos Indexed: ${longVideos.length}`,
    `- Shorts Indexed: ${shorts.length}`,
    `- Quran Translation Source: \u018Flixan Musayev (v1.0.4)`,
    `- Languages: Azerbaijani (az), Arabic (ar)`,
    "",
    "## 30 Juz & 604 Mushaf Page Ranges",
    ...JUZ_PAGE_RANGES.map(
      (j) => `- C\xFCz ${j.juz}: ${baseUrl}/quran/cuz/${j.juz} | Start Page: ${baseUrl}/quran/sehife/${j.startPage} \u2014 S\u0259hif\u0259 ${j.startPage}\u2013${j.endPage}`
    ),
    "",
    `## Qurandak\u0131 Dualar (${QURAN_DUAS.length})`,
    ...QURAN_DUAS.map(
      (d) => `- ${d.title} (${d.surahName} ${d.ayahLabel}) | URL: ${baseUrl}/quran/sure/${d.surahNumber}#ayah-${d.ayahNumber} | ${d.translation}`
    ),
    "",
    "## All 114 Surahs",
    ...SURAH_CATALOG.map(
      (s) => `- ${s.number}. ${s.name} (${s.arabicName}) | ${s.ayahCount} ay\u0259 | ${s.revelationPlace} | Start Page: ${s.startPage} | URL: ${baseUrl}/quran/sure/${s.number} | JSON: ${baseUrl}/api/quran/surah/${s.number}`
    ),
    "",
    `## All Long Videos (${longVideos.length})`,
    ...longVideos.map(
      (v) => `- [${v.title}](${baseUrl}/video/${v.videoId}) | YouTube: ${v.youtubeUrl} | Surah: ${v.surahName} | Ayahs: ${v.ayahRange} | Reciter: ${v.reciter} | Duration: ${v.duration} | Summary: ${v.seoDescription}`
    ),
    "",
    `## All Shorts Videos (${shorts.length})`,
    ...shorts.map(
      (v) => `- [${v.title}](${baseUrl}/video/${v.videoId}) | YouTube: ${v.youtubeUrl} | Surah: ${v.surahName} | Ayahs: ${v.ayahRange} | Reciter: ${v.reciter} | Duration: ${v.duration} | Summary: ${v.seoDescription}`
    ),
    ""
  ];
  return lines.join("\n");
}
function buildAiIndexJson(origin, stats, longVideos, shorts) {
  const baseUrl = normalizeBaseUrl(origin);
  return {
    schemaVersion: "1.1",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    site: {
      name: stats.name,
      handle: stats.handle,
      baseUrl,
      youtubeUrl: stats.youtubeUrl,
      description: stats.description,
      languages: ["az", "ar"],
      translation: {
        translator: "\u018Flixan Musayev",
        editionVersion: "1.0.4"
      },
      stats: {
        subscribers: stats.subscribersLabel,
        totalVideos: stats.videoCountLabel,
        longVideosCount: longVideos.length,
        shortsCount: shorts.length,
        surahsCount: SURAH_CATALOG.length,
        mushafPagesCount: TOTAL_QURAN_PAGES
      }
    },
    discovery: {
      sitemapXml: `${baseUrl}/sitemap.xml`,
      sitemapIndexXml: `${baseUrl}/sitemap-index.xml`,
      videoSitemapXml: `${baseUrl}/sitemap-videos.xml`,
      rssXml: `${baseUrl}/rss.xml`,
      robotsTxt: `${baseUrl}/robots.txt`,
      llmsTxt: `${baseUrl}/llms.txt`,
      llmsFullTxt: `${baseUrl}/llms-full.txt`
    },
    endpoints: {
      channel: `${baseUrl}/api/channel`,
      surahTemplate: `${baseUrl}/api/quran/surah/{surahNumber}`,
      mushafPageTemplate: `${baseUrl}/api/quran/page/{pageNumber}`
    },
    juzIndex: JUZ_PAGE_RANGES.map((j) => ({
      ...j,
      url: `${baseUrl}/quran/cuz/${j.juz}`,
      startPageUrl: `${baseUrl}/quran/sehife/${j.startPage}`,
      muhaffizUrl: `${baseUrl}/muhaffiz/${j.startPage}`
    })),
    duas: QURAN_DUAS.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      surahNumber: d.surahNumber,
      surahName: d.surahName,
      ayahNumber: d.ayahNumber,
      url: `${baseUrl}/quran/sure/${d.surahNumber}#ayah-${d.ayahNumber}`,
      duasPageUrl: `${baseUrl}/dualar`
    })),
    popularTopics: POPULAR_QURAN_TOPICS.map((t) => ({
      ...t,
      url: `${baseUrl}/quran/sehife/${t.pageNumber}`,
      surahUrl: `${baseUrl}/quran/sure/${t.surahNumber}`,
      muhaffizUrl: `${baseUrl}/muhaffiz/${t.pageNumber}`
    })),
    surahs: SURAH_CATALOG.map((s) => ({
      ...s,
      url: `${baseUrl}/quran/sure/${s.number}`,
      apiUrl: `${baseUrl}/api/quran/surah/${s.number}`,
      startPageUrl: `${baseUrl}/quran/sehife/${s.startPage}`,
      muhaffizUrl: `${baseUrl}/muhaffiz/${s.startPage}`
    })),
    longVideos: longVideos.map((v) => ({
      videoId: v.videoId,
      title: v.title,
      surahNumber: v.surahNumber,
      surahName: v.surahName,
      ayahRange: v.ayahRange,
      reciter: v.reciter,
      duration: v.duration,
      url: `${baseUrl}/video/${v.videoId}`,
      youtubeUrl: v.youtubeUrl,
      seoDescription: v.seoDescription
    })),
    shorts: shorts.map((v) => ({
      videoId: v.videoId,
      title: v.title,
      surahNumber: v.surahNumber,
      surahName: v.surahName,
      ayahRange: v.ayahRange,
      reciter: v.reciter,
      duration: v.duration,
      url: `${baseUrl}/video/${v.videoId}`,
      youtubeUrl: v.youtubeUrl,
      seoDescription: v.seoDescription
    }))
  };
}

// src/server/api.ts
import express2 from "express";

// src/lib/readerState.ts
function parseAlQuranSearchPayload(payload, catalog = SURAH_CATALOG, limit = 24) {
  if (!payload || typeof payload !== "object") return [];
  const data = payload.data;
  const rawMatches = Array.isArray(data?.matches) ? data.matches : [];
  const seen = /* @__PURE__ */ new Set();
  const results = [];
  for (const item of rawMatches) {
    if (!item || typeof item !== "object") continue;
    const raw = item;
    const surahNumber = Number(raw.surah?.number);
    const ayahNumber = Number(raw.numberInSurah);
    const snippet = String(raw.text ?? "").replace(/\s+/g, " ").trim();
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > TOTAL_QURAN_SURAHS || !Number.isInteger(ayahNumber) || ayahNumber < 1 || !snippet) {
      continue;
    }
    const key = `${surahNumber}:${ayahNumber}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const surah = catalog.find((s) => s.number === surahNumber) ?? getSurahByNumber(surahNumber);
    results.push({
      surahNumber,
      surahName: surah?.name ?? String(raw.surah?.englishName ?? `Sur\u0259 ${surahNumber}`),
      ayahNumber,
      snippet
    });
    if (results.length >= limit) break;
  }
  return results;
}

// src/lib/analytics.ts
var CONNECTED_PAGES = [
  {
    pageKey: "home",
    label: "Uzun Videolar (Ana s\u0259hif\u0259)",
    routePattern: "/",
    probeUrl: "/",
    description: "\u018Fsas s\u0259hif\u0259, hero v\u0259 uzun Quran tilav\u0259tl\u0259ri arxivi"
  },
  {
    pageKey: "shorts",
    label: "Shorts B\xF6lm\u0259si",
    routePattern: "/shorts",
    probeUrl: "/shorts",
    description: "Kanal\u0131n b\xFCt\xFCn q\u0131sa Quran tilav\u0259tl\u0259ri v\u0259 SEO arxivi"
  },
  {
    pageKey: "quran",
    label: "Tam Qurani-K\u0259rim",
    routePattern: "/quran",
    probeUrl: "/quran",
    description: "114 sur\u0259 v\u0259 604 Mushaf s\u0259hif\u0259sinin \xFCmumi kataloqu"
  },
  {
    pageKey: "surah",
    label: "Sur\u0259 Oxu S\u0259hif\u0259si",
    routePattern: "/quran/sure/:surahNumber",
    probeUrl: "/api/quran/surah/36",
    description: "Se\xE7ilmi\u015F sur\u0259nin \u0259r\u0259bc\u0259 m\u0259tni v\u0259 \u018Flixan Musayev t\u0259rc\xFCm\u0259si"
  },
  {
    pageKey: "mushaf_page",
    label: "Mushaf S\u0259hif\u0259si (1\u2013604)",
    routePattern: "/quran/sehife/:pageNumber",
    probeUrl: "/api/quran/page/1",
    description: "604 Mushaf s\u0259hif\u0259si \xFCzr\u0259 ay\u0259-ay\u0259 oxu g\xF6r\xFCn\xFC\u015F\xFC"
  },
  {
    pageKey: "muhaffiz",
    label: "M\xFChafiz (\u018Fzb\u0259r Mushaf\u0131)",
    routePattern: "/muhaffiz",
    probeUrl: "/muhaffiz",
    description: "Ay\u0259l\u0259ri gizl\u0259dib-a\xE7araq Quran \u0259zb\u0259rl\u0259m\u0259 v\u0259 t\u0259krar s\u0259hif\u0259si"
  },
  {
    pageKey: "video",
    label: "Video \u018Ftrafl\u0131 & T\u0259rc\xFCm\u0259",
    routePattern: "/video/:videoId",
    probeUrl: "/api/channel",
    description: "H\u0259r videonun ayr\u0131ca s\u0259hif\u0259si, video pleyer v\u0259 t\u0259rc\xFCm\u0259 m\u0259tni"
  },
  {
    pageKey: "verse_of_day",
    label: "G\xFCn\xFCn Ay\u0259si",
    routePattern: "/gunun-ayesi",
    probeUrl: "/gunun-ayesi",
    description: "G\xFCnd\u0259lik se\xE7ilmi\u015F ay\u0259, \u0259r\u0259bc\u0259 m\u0259tn v\u0259 t\u0259f\u0259kk\xFCr izah\u0131"
  },
  {
    pageKey: "about",
    label: "Kanal Haqq\u0131nda",
    routePattern: "/haqqinda",
    probeUrl: "/haqqinda",
    description: "Quran Qiraeti kanal\u0131n\u0131n missiyas\u0131 v\u0259 t\u0259qdimat prinsipl\u0259ri"
  },
  {
    pageKey: "request",
    label: "Sur\u0259 \u0130st\u0259yi",
    routePattern: "/istek",
    probeUrl: "/api/requests",
    description: "Dinl\u0259yicil\u0259r \xFC\xE7\xFCn sur\u0259 v\u0259 qari t\u0259klifi formu"
  }
];
var SHORT_AZ_MONTHS = [
  "Yan",
  "Fev",
  "Mar",
  "Apr",
  "May",
  "\u0130yn",
  "\u0130yl",
  "Avq",
  "Sen",
  "Okt",
  "Noy",
  "Dek"
];
var REFERRER_LABELS = {
  direct: "Birba\u015Fa ke\xE7id",
  internal: "Saytdaxili naviqasiya",
  search: "Axtar\u0131\u015F / AI sisteml\u0259ri",
  youtube: "YouTube kanal\u0131",
  other: "Dig\u0259r m\u0259nb\u0259l\u0259r"
};
function startOfUtcHour(ms) {
  const d = new Date(ms);
  d.setUTCMinutes(0, 0, 0);
  return d.getTime();
}
function startOfUtcDay(ms) {
  const d = new Date(ms);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}
function startOfUtcWeekMonday(ms) {
  const d = new Date(startOfUtcDay(ms));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.getTime();
}
function formatHourBucketLabel(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:00`;
}
function formatDayBucketLabel(ms) {
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, "0")} ${SHORT_AZ_MONTHS[d.getMonth()]}`;
}
function getWindowStartMs(granularity, nowMs) {
  const hourMs = 60 * 60 * 1e3;
  const dayMs = 24 * hourMs;
  if (granularity === "hourly") {
    return startOfUtcHour(nowMs) - 23 * hourMs;
  }
  if (granularity === "daily") {
    return startOfUtcDay(nowMs) - 13 * dayMs;
  }
  return startOfUtcWeekMonday(nowMs) - 7 * 7 * dayMs;
}
function aggregateTelemetry(events, granularity, nowMs = Date.now(), selectedPageKey = "all") {
  const hourMs = 60 * 60 * 1e3;
  const dayMs = 24 * hourMs;
  const weekMs = 7 * dayMs;
  const hourlyCutoff = nowMs - 24 * hourMs;
  const dailyCutoff = nowMs - 24 * hourMs;
  const last24hCutoff = nowMs - dayMs;
  const last7dCutoff = nowMs - weekMs;
  const windowStartMs = getWindowStartMs(granularity, nowMs);
  const filteredByPage = selectedPageKey === "all" ? events : events.filter((event) => event.pageKey === selectedPageKey);
  const windowEvents = filteredByPage.filter(
    (event) => event.createdAtMs >= windowStartMs && event.createdAtMs <= nowMs + 6e4
  );
  const bucketDefs = [];
  if (granularity === "hourly") {
    const firstHour = startOfUtcHour(nowMs) - 23 * hourMs;
    for (let i = 0; i < 24; i++) {
      const start = firstHour + i * hourMs;
      bucketDefs.push({
        key: `h-${start}`,
        label: formatHourBucketLabel(start),
        startMs: start,
        endMs: start + hourMs
      });
    }
  } else if (granularity === "daily") {
    const firstDay = startOfUtcDay(nowMs) - 13 * dayMs;
    for (let i = 0; i < 14; i++) {
      const start = firstDay + i * dayMs;
      bucketDefs.push({
        key: `d-${start}`,
        label: formatDayBucketLabel(start),
        startMs: start,
        endMs: start + dayMs
      });
    }
  } else {
    const firstWeek = startOfUtcWeekMonday(nowMs) - 7 * weekMs;
    for (let i = 0; i < 8; i++) {
      const start = firstWeek + i * weekMs;
      bucketDefs.push({
        key: `w-${start}`,
        label: i === 7 ? "Bu h\u0259ft\u0259" : formatDayBucketLabel(start),
        startMs: start,
        endMs: start + weekMs
      });
    }
  }
  const buckets = bucketDefs.map((def) => {
    const matching = windowEvents.filter(
      (ev) => ev.createdAtMs >= def.startMs && ev.createdAtMs < def.endMs
    );
    const sessions = new Set(matching.map((ev) => ev.sessionId));
    const okCount2 = matching.filter((ev) => ev.status === "ok").length;
    const slowCount2 = matching.filter((ev) => ev.status === "slow").length;
    const errorCount2 = matching.filter((ev) => ev.status === "error").length;
    const avgLoadTimeMs2 = matching.length > 0 ? Math.round(matching.reduce((acc, ev) => acc + ev.loadTimeMs, 0) / matching.length) : 0;
    return {
      key: def.key,
      label: def.label,
      visits: matching.length,
      uniqueSessions: sessions.size,
      okCount: okCount2,
      slowCount: slowCount2,
      errorCount: errorCount2,
      avgLoadTimeMs: avgLoadTimeMs2
    };
  });
  const pageRows = CONNECTED_PAGES.map((pageDef) => {
    const pageEventsAll = events.filter((ev) => ev.pageKey === pageDef.pageKey);
    const pageWindowEvents = pageEventsAll.filter((ev) => ev.createdAtMs >= windowStartMs);
    const hourlyVisits = pageEventsAll.filter((ev) => ev.createdAtMs >= nowMs - hourMs).length;
    const dailyVisits = pageEventsAll.filter(
      (ev) => ev.createdAtMs >= Math.min(last24hCutoff, Math.max(hourlyCutoff, dailyCutoff))
    ).length;
    const weeklyVisits = pageEventsAll.filter((ev) => ev.createdAtMs >= last7dCutoff).length;
    const sessions = new Set(pageWindowEvents.map((ev) => ev.sessionId));
    const okCount2 = pageWindowEvents.filter((ev) => ev.status === "ok").length;
    const slowCount2 = pageWindowEvents.filter((ev) => ev.status === "slow").length;
    const errorCount2 = pageWindowEvents.filter((ev) => ev.status === "error").length;
    const avgLoadTimeMs2 = pageWindowEvents.length > 0 ? Math.round(
      pageWindowEvents.reduce((acc, ev) => acc + ev.loadTimeMs, 0) / pageWindowEvents.length
    ) : 0;
    const sortedPage = [...pageEventsAll].sort((a, b) => b.createdAtMs - a.createdAtMs);
    const latest = sortedPage[0];
    let operationalStatus = "G\xF6zl\u0259m\u0259d\u0259";
    if (latest) {
      if (latest.status === "error" || errorCount2 > Math.max(2, pageWindowEvents.length * 0.25)) {
        operationalStatus = "X\u0259tal\u0131";
      } else if (latest.status === "slow" || avgLoadTimeMs2 > 2500) {
        operationalStatus = "Yava\u015F";
      } else {
        operationalStatus = "Aktiv";
      }
    }
    return {
      pageKey: pageDef.pageKey,
      label: pageDef.label,
      routePattern: pageDef.routePattern,
      totalVisits: pageWindowEvents.length,
      hourlyVisits,
      dailyVisits,
      weeklyVisits,
      uniqueSessions: sessions.size,
      avgLoadTimeMs: avgLoadTimeMs2,
      okCount: okCount2,
      slowCount: slowCount2,
      errorCount: errorCount2,
      operationalStatus,
      lastSeenAtMs: latest ? latest.createdAtMs : null
    };
  });
  const totalVisits = windowEvents.length;
  const uniqueSessions = new Set(windowEvents.map((ev) => ev.sessionId)).size;
  const okCount = windowEvents.filter((ev) => ev.status === "ok").length;
  const slowCount = windowEvents.filter((ev) => ev.status === "slow").length;
  const errorCount = windowEvents.filter((ev) => ev.status === "error").length;
  const avgLoadTimeMs = totalVisits > 0 ? Math.round(windowEvents.reduce((acc, ev) => acc + ev.loadTimeMs, 0) / totalVisits) : 0;
  const healthyRatePct = totalVisits > 0 ? Math.round((okCount + slowCount) / totalVisits * 1e3) / 10 : 100;
  const refCounts = /* @__PURE__ */ new Map();
  for (const ev of windowEvents) {
    refCounts.set(ev.referrerType, (refCounts.get(ev.referrerType) ?? 0) + 1);
  }
  const referrerBreakdown = ["direct", "internal", "search", "youtube", "other"].map((type) => {
    const count = refCounts.get(type) ?? 0;
    return {
      referrerType: type,
      label: REFERRER_LABELS[type],
      count,
      sharePct: totalVisits > 0 ? Math.round(count / totalVisits * 100) : 0
    };
  }).sort((a, b) => b.count - a.count);
  const windowLabel = granularity === "hourly" ? "Son 24 saat (Saatl\u0131q b\xF6lg\xFC)" : granularity === "daily" ? "Son 14 g\xFCn (G\xFCnl\xFCk b\xF6lg\xFC)" : "Son 8 h\u0259ft\u0259 (H\u0259ft\u0259lik b\xF6lg\xFC)";
  const recentEvents = [...filteredByPage].sort((a, b) => b.createdAtMs - a.createdAtMs).slice(0, 25);
  return {
    granularity,
    windowLabel,
    totalVisits,
    uniqueSessions,
    avgLoadTimeMs,
    healthyRatePct,
    okCount,
    slowCount,
    errorCount,
    buckets,
    pageRows,
    referrerBreakdown,
    recentEvents
  };
}

// src/data/recitations.ts
var DEFAULT_CHANNEL_STATS = {
  channelId: "UCp9AvvdTxAXDZfnnVjNF1Yg",
  handle: "@quranqiraeti",
  name: "Quran Qiraeti",
  description: "Quran Qiraeti kanal\u0131nda Qurani-K\u0259rim ay\u0259l\u0259ri \u0259r\u0259bc\u0259 tilav\u0259t olunur v\u0259 onlar\u0131n m\u0259naca t\u0259rc\xFCm\u0259si Az\u0259rbaycan dilind\u0259 ekranda ayd\u0131n \u015F\u0259kild\u0259 t\u0259qdim edilir.",
  subscribersLabel: "5.92K",
  videoCountLabel: "508+",
  youtubeUrl: "https://www.youtube.com/@quranqiraeti",
  subscribeUrl: "https://www.youtube.com/@quranqiraeti?sub_confirmation=1",
  source: "archive"
};
var SEED_LONG_VIDEOS = [
  buildRecitationVideo({
    videoId: "WuoDn6idrAk",
    rawTitle: "1. Fatih\u0259 Sur\u0259si - Maher al Muaiqly",
    format: "long",
    duration: "0:39",
    published: "2026-11-17T12:00:00Z",
    publishedLabel: "3 g\xFCn \u0259vv\u0259l",
    views: 8
  }),
  buildRecitationVideo({
    videoId: "iCzBmN_pBs8",
    rawTitle: "2. B\u0259q\u0259r\u0259 sur\u0259si - Maher al Muaiqly",
    format: "long",
    duration: "1:47:59",
    published: "2026-11-20T18:00:00Z",
    publishedLabel: "Yeni",
    views: 4
  }),
  buildRecitationVideo({
    videoId: "kH8iG4KpDBA",
    rawTitle: "Loqman Sur\u0259si - \u0130slam Subhi",
    format: "long",
    duration: "10:49",
    published: "2026-11-09T14:00:00Z",
    publishedLabel: "6 g\xFCn \u0259vv\u0259l",
    views: 28
  }),
  buildRecitationVideo({
    videoId: "j6vTpF8YKmc",
    rawTitle: "Qaf Sur\u0259si - Khalid al Calil",
    format: "long",
    duration: "9:55",
    published: "2026-11-08T14:00:00Z",
    publishedLabel: "7 g\xFCn \u0259vv\u0259l",
    views: 28
  }),
  buildRecitationVideo({
    videoId: "3t9J6ng3WdQ",
    rawTitle: "K\u0259hf Sur\u0259si Maher al Muaiqly | Kehf suresi | Surah Kehf",
    format: "long",
    duration: "23:12",
    published: "2026-02-15T12:00:00Z",
    publishedLabel: "9 ay \u0259vv\u0259l",
    views: 25
  }),
  buildRecitationVideo({
    videoId: "qDMrS01Gzgw",
    rawTitle: "Surah Mulk, Surah Vaqia, Surah Yasin, Surah Rahman - Maher al Muaiqly",
    format: "long",
    duration: "33:01",
    published: "2026-03-10T12:00:00Z",
    publishedLabel: "8 ay \u0259vv\u0259l",
    views: 137
  }),
  buildRecitationVideo({
    videoId: "ocrTLJJkKYI",
    rawTitle: "M\xF6minl\u0259r, h\u0259qiq\u0259t\u0259n d\u0259, nicat tapm\u0131\u015Flar. - Muminun Sur\u0259si",
    format: "long",
    duration: "41:55",
    published: "2026-03-01T12:00:00Z",
    publishedLabel: "8 ay \u0259vv\u0259l",
    views: 213
  }),
  buildRecitationVideo({
    videoId: "QI9FYWckc-E",
    rawTitle: "Bakara Sur\u0259si Tamam\u0131",
    format: "long",
    duration: "1:53:32",
    published: "2026-01-20T12:00:00Z",
    publishedLabel: "10 ay \u0259vv\u0259l",
    views: 41
  }),
  buildRecitationVideo({
    videoId: "cRArr4gwCUg",
    rawTitle: "Muminun sur\u0259si Yasser al Dossari - Quran",
    format: "long",
    duration: "21:01",
    published: "2026-01-18T12:00:00Z",
    publishedLabel: "10 ay \u0259vv\u0259l",
    views: 705
  }),
  buildRecitationVideo({
    videoId: "n5lIwXz9zcg",
    rawTitle: "Surah al Qasas - Yasser al dossari | Quran",
    format: "long",
    duration: "25:32",
    published: "2026-01-14T12:00:00Z",
    publishedLabel: "10 ay \u0259vv\u0259l",
    views: 1200
  }),
  buildRecitationVideo({
    videoId: "z2qnT4Gyw8w",
    rawTitle: "K\u0259b\u0259 \u0130mam\u0131ndan T\u0259sirli Qira\u0259t | M\u0259ry\u0259m Sur\u0259si Maher al Muaiqly",
    format: "long",
    duration: "17:46",
    published: "2026-01-10T12:00:00Z",
    publishedLabel: "10 ay \u0259vv\u0259l",
    views: 245
  }),
  buildRecitationVideo({
    videoId: "WHIyOB4Z4ww",
    rawTitle: "\u0130brahim Sur\u0259sini Bu S\u0259sl\u0259 Dinl\u0259mis\u0259nmi? | Wadi Al Yamani",
    format: "long",
    duration: "18:23",
    published: "2026-01-08T12:00:00Z",
    publishedLabel: "10 ay \u0259vv\u0259l",
    views: 203
  }),
  buildRecitationVideo({
    videoId: "f2ZRJeuBbWo",
    rawTitle: "Diril\u0259rl\u0259 \xF6l\xFCl\u0259r d\u0259 eyni deyill\u0259r. | Fatir sur\u0259si Muhammed Ayyub",
    format: "long",
    duration: "14:22",
    published: "2026-02-12T12:00:00Z",
    publishedLabel: "9 ay \u0259vv\u0259l",
    views: 135
  }),
  buildRecitationVideo({
    videoId: "yM497IBCCC0",
    rawTitle: "Yusuf sur\u0259si Nasser al Qatami | Quran Dinl\u0259",
    format: "long",
    duration: "10:41",
    published: "2026-01-15T12:00:00Z",
    publishedLabel: "10 ay \u0259vv\u0259l",
    views: 330
  }),
  buildRecitationVideo({
    videoId: "GSq8SlL0CfI",
    rawTitle: "K\u0259hf Sur\u0259si \u2013 Fayiz S\u0259udun T\u0259sirli Qira\u0259ti",
    format: "long",
    duration: "28:06",
    published: "2026-01-12T12:00:00Z",
    publishedLabel: "10 ay \u0259vv\u0259l",
    views: 73
  }),
  buildRecitationVideo({
    videoId: "EnsSMSSokd8",
    rawTitle: "Surah Yaseen Fast recitation - Abdurrahman As Sudeis",
    format: "long",
    duration: "12:42",
    published: "2026-01-16T12:00:00Z",
    publishedLabel: "10 ay \u0259vv\u0259l",
    views: 84
  }),
  buildRecitationVideo({
    videoId: "gSSBbjhWLKw",
    rawTitle: "Fatir sur\u0259si - Az\u0259rbaycan dilind\u0259 m\u0259naca t\u0259rc\xFCm\u0259 Quran",
    format: "long",
    duration: "6:31",
    published: "2026-02-18T12:00:00Z",
    publishedLabel: "9 ay \u0259vv\u0259l",
    views: 45
  }),
  buildRecitationVideo({
    videoId: "2nOzcev_-qg",
    rawTitle: "Fussil\u0259t sur\u0259si Waleed Shamsan - Allah\u0131n d\xFC\u015Fm\u0259nl\u0259ri C\u0259h\u0259nn\u0259m\u0259 toplan\u0131lacaqlar\u0131 g\xFCn",
    format: "long",
    duration: "5:23",
    published: "2026-01-17T12:00:00Z",
    publishedLabel: "10 ay \u0259vv\u0259l",
    views: 34
  }),
  buildRecitationVideo({
    videoId: "LLLANaZchh0",
    rawTitle: "Biz onlardan sonra is\u0259 ba\u015Fqa bir n\u0259sil yaratd\u0131q. - Muminun sur\u0259si",
    format: "long",
    duration: "5:04",
    published: "2026-04-10T12:00:00Z",
    publishedLabel: "7 ay \u0259vv\u0259l",
    views: 60
  }),
  buildRecitationVideo({
    videoId: "G8W_13_vZ3g",
    rawTitle: "N\u0259b\u0259 sur\u0259si - Maher al Muaiqly Qurani k\u0259rim",
    format: "long",
    duration: "3:40",
    published: "2026-01-16T10:00:00Z",
    publishedLabel: "10 ay \u0259vv\u0259l",
    views: 16
  })
];
var SEED_SHORTS = [
  buildRecitationVideo({
    videoId: "h1J1ZxwhEww",
    rawTitle: "kehf suresi 15-17",
    format: "short",
    duration: "0:58",
    published: "2026-11-15T07:29:50Z",
    publishedLabel: "Bu g\xFCn",
    views: 44
  }),
  buildRecitationVideo({
    videoId: "JRN8YARdTF0",
    rawTitle: "kehf suresi 11-14",
    format: "short",
    duration: "0:55",
    published: "2026-11-15T07:29:25Z",
    publishedLabel: "Bu g\xFCn",
    views: 39
  }),
  buildRecitationVideo({
    videoId: "vY9Cxi4OCm8",
    rawTitle: "kehf suresi 6-10",
    format: "short",
    duration: "0:59",
    published: "2026-11-15T06:11:14Z",
    publishedLabel: "Bu g\xFCn",
    views: 123
  }),
  buildRecitationVideo({
    videoId: "25NDX_E5EVE",
    rawTitle: "Zariyat sur\u0259si, 15\u201322",
    format: "short",
    duration: "0:57",
    published: "2026-11-14T14:00:19Z",
    publishedLabel: "D\xFCn\u0259n",
    views: 391
  }),
  buildRecitationVideo({
    videoId: "DOMnRUWVKiY",
    rawTitle: "R\u0259hman sur\u0259si, 24\u201332",
    format: "short",
    duration: "0:56",
    published: "2026-11-14T13:00:12Z",
    publishedLabel: "D\xFCn\u0259n",
    views: 638
  }),
  buildRecitationVideo({
    videoId: "0JrGsnk3xQk",
    rawTitle: "kehf suresi 1-5",
    format: "short",
    duration: "0:54",
    published: "2026-11-14T10:26:40Z",
    publishedLabel: "D\xFCn\u0259n",
    views: 325
  }),
  buildRecitationVideo({
    videoId: "i2uKVIRn6OU",
    rawTitle: "Q\u0259m\u0259r sur\u0259si, 47\u201355",
    format: "short",
    duration: "0:59",
    published: "2026-11-13T17:00:33Z",
    publishedLabel: "2 g\xFCn \u0259vv\u0259l",
    views: 1411
  }),
  buildRecitationVideo({
    videoId: "okUUH5D2FLk",
    rawTitle: "Qaf sur\u0259si, 16\u201322",
    format: "short",
    duration: "0:58",
    published: "2026-11-13T15:00:00Z",
    publishedLabel: "2 g\xFCn \u0259vv\u0259l",
    views: 1864
  }),
  buildRecitationVideo({
    videoId: "fFw379e3jvM",
    rawTitle: "necm sur\u0259si",
    format: "short",
    duration: "0:52",
    published: "2026-11-13T12:00:06Z",
    publishedLabel: "2 g\xFCn \u0259vv\u0259l",
    views: 476
  }),
  buildRecitationVideo({
    videoId: "bDJaXhEsBRQ",
    rawTitle: "N\u0259cm sur\u0259si, 38\u201349",
    format: "short",
    duration: "0:57",
    published: "2026-11-13T07:00:32Z",
    publishedLabel: "2 g\xFCn \u0259vv\u0259l",
    views: 1030
  }),
  buildRecitationVideo({
    videoId: "5HGe4orCMLc",
    rawTitle: "yunus sur\u0259si | Quran Qira\u0259ti",
    format: "short",
    duration: "0:55",
    published: "2026-11-11T12:00:00Z",
    publishedLabel: "4 g\xFCn \u0259vv\u0259l",
    views: 1200
  }),
  buildRecitationVideo({
    videoId: "sqqaptCMcAo",
    rawTitle: "Hazza Al Balushi Hicr Sur\u0259si",
    format: "short",
    duration: "0:59",
    published: "2026-11-10T12:00:00Z",
    publishedLabel: "5 g\xFCn \u0259vv\u0259l",
    views: 1100
  }),
  buildRecitationVideo({
    videoId: "k2b99l7d1sw",
    rawTitle: "islam Subhi - Taha suresi",
    format: "short",
    duration: "0:56",
    published: "2026-11-09T12:00:00Z",
    publishedLabel: "6 g\xFCn \u0259vv\u0259l",
    views: 1200
  })
];

// src/server/telegram.ts
import crypto2 from "node:crypto";
import express from "express";

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "mindful-operator-5v0ns",
  appId: "1:126160972595:web:87c49606411750e534ac46",
  apiKey: "AIzaSyAdtSzQecrGVt2j-MaQKxXoN_Uk49-Z9xo",
  authDomain: "mindful-operator-5v0ns.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-quranqiraeti-c7acecf7-1549-4be0-8e2a-500eab44da5f",
  storageBucket: "mindful-operator-5v0ns.firebasestorage.app",
  messagingSenderId: "126160972595",
  measurementId: "",
  oAuthClientId: "126160972595-oo4fjfdr2iqcgbho2feu0scu86q19fk2.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// src/data/azkar.ts
var AZKAR_CATEGORY_LABELS = {
  all: "Ham\u0131s\u0131",
  seher: "S\u0259h\u0259r zikrl\u0259ri",
  axsam: "Ax\u015Fam zikrl\u0259ri",
  namaz: "Namaz sonras\u0131",
  umumi: "G\xFCnd\u0259lik f\u0259zil\u0259tl\u0259r"
};
function getAzkarByCategory(category) {
  if (category === "all") return DAILY_AZKAR;
  return DAILY_AZKAR.filter(
    (item) => item.category === category || Boolean(item.categories?.includes(category))
  );
}
var DAILY_AZKAR = [
  // 1. Ayətül-Kürsi (Müsəlman Qalası, #75)
  {
    id: "ayetul-kursi-zikr",
    category: "seher",
    categories: ["seher", "axsam"],
    timeLabel: "S\u0259h\u0259r v\u0259 ax\u015Fam",
    title: "Ay\u0259t\xFCl-K\xFCrsi (B\u0259q\u0259r\u0259 sur\u0259si, 255)",
    arabicText: "\u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0627\u0644\u0644\u064E\u0651\u0647\u0650 \u0645\u0650\u0646\u064E \u0627\u0644\u0634\u064E\u0651\u064A\u0652\u0637\u064E\u0627\u0646\u0650 \u0627\u0644\u0631\u064E\u0651\u062C\u0650\u064A\u0645\u0650 \u06DD \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064E \u0625\u0650\u0644\u064E\u0651\u0627 \u0647\u064F\u0648\u064E \u0627\u0644\u0652\u062D\u064E\u064A\u064F\u0651 \u0627\u0644\u0652\u0642\u064E\u064A\u064F\u0651\u0648\u0645\u064F \u06DA \u0644\u064E\u0627 \u062A\u064E\u0623\u0652\u062E\u064F\u0630\u064F\u0647\u064F \u0633\u0650\u0646\u064E\u0629\u064C \u0648\u064E\u0644\u064E\u0627 \u0646\u064E\u0648\u0652\u0645\u064C \u06DA \u0644\u064E\u0647\u064F \u0645\u064E\u0627 \u0641\u0650\u064A \u0627\u0644\u0633\u064E\u0651\u0645\u064E\u0627\u0648\u064E\u0627\u062A\u0650 \u0648\u064E\u0645\u064E\u0627 \u0641\u0650\u064A \u0627\u0644\u0652\u0623\u064E\u0631\u0652\u0636\u0650 \u06D7 \u0645\u064E\u0646\u0652 \u0630\u064E\u0627 \u0627\u0644\u064E\u0651\u0630\u0650\u064A \u064A\u064E\u0634\u0652\u0641\u064E\u0639\u064F \u0639\u0650\u0646\u0652\u062F\u064E\u0647\u064F \u0625\u0650\u0644\u064E\u0651\u0627 \u0628\u0650\u0625\u0650\u0630\u0652\u0646\u0650\u0647\u0650 \u06DA \u064A\u064E\u0639\u0652\u0644\u064E\u0645\u064F \u0645\u064E\u0627 \u0628\u064E\u064A\u0652\u0646\u064E \u0623\u064E\u064A\u0652\u062F\u0650\u064A\u0647\u0650\u0645\u0652 \u0648\u064E\u0645\u064E\u0627 \u062E\u064E\u0644\u0652\u0641\u064E\u0647\u064F\u0645\u0652 \u06D6 \u0648\u064E\u0644\u064E\u0627 \u064A\u064F\u062D\u0650\u064A\u0637\u064F\u0648\u0646\u064E \u0628\u0650\u0634\u064E\u064A\u0652\u0621\u064D \u0645\u0650\u0646\u0652 \u0639\u0650\u0644\u0652\u0645\u0650\u0647\u0650 \u0625\u0650\u0644\u064E\u0651\u0627 \u0628\u0650\u0645\u064E\u0627 \u0634\u064E\u0627\u0621\u064E \u06DA \u0648\u064E\u0633\u0650\u0639\u064E \u0643\u064F\u0631\u0652\u0633\u0650\u064A\u064F\u0651\u0647\u064F \u0627\u0644\u0633\u064E\u0651\u0645\u064E\u0627\u0648\u064E\u0627\u062A\u0650 \u0648\u064E\u0627\u0644\u0652\u0623\u064E\u0631\u0652\u0636\u064E \u06D6 \u0648\u064E\u0644\u064E\u0627 \u064A\u064E\u0626\u064F\u0648\u062F\u064F\u0647\u064F \u062D\u0650\u0641\u0652\u0638\u064F\u0647\u064F\u0645\u064E\u0627 \u06DA \u0648\u064E\u0647\u064F\u0648\u064E \u0627\u0644\u0652\u0639\u064E\u0644\u0650\u064A\u064F\u0651 \u0627\u0644\u0652\u0639\u064E\u0638\u0650\u064A\u0645\u064F",
    translation: "L\u0259n\u0259tl\u0259nmi\u015F \u015Feytandan Allaha s\u0131\u011F\u0131n\u0131ram. Allah \u2014 Ondan ba\u015Fqa haqq m\u0259bud yoxdur, \u0259b\u0259di Ya\u015Fayand\u0131r, b\xFCt\xFCn yaratd\u0131qlar\u0131n\u0131n Q\u0259yyumudur. Onu n\u0259 m\xFCrg\xFC, n\u0259 d\u0259 yuxu tutar. G\xF6yl\u0259rd\u0259 v\u0259 yerd\u0259 n\u0259 varsa, Ona m\u0259xsusdur. Onun izni olmadan Onun yan\u0131nda kim \u015F\u0259fa\u0259t ed\u0259 bil\u0259r? O, insanlar\u0131n \xF6n\xFCnd\u0259 olan\u0131 da, arxas\u0131nda olan\u0131 da bilir. Onlar Onun elmind\u0259n Onun ist\u0259diyind\u0259n ba\u015Fqa he\xE7 bir \u015Fey qavraya bilm\u0259zl\u0259r. Onun K\xFCrs\xFCs\xFC g\xF6yl\u0259ri v\u0259 yeri \u0259hat\u0259 etmi\u015Fdir. Bunlar\u0131 qoruyub saxlamaq Ona a\u011F\u0131r g\u0259lm\u0259z. O, Ucad\u0131r, \u018Fz\u0259m\u0259tlidir.",
    targetCount: 1,
    countNote: "1 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#75) \xB7 Hakim (1/562)",
    virtue: "S\u0259h\u0259r oxuyan ax\u015Fama kimi, ax\u015Fam oxuyan is\u0259 s\u0259h\u0259r\u0259 kimi cinl\u0259rin \u015F\u0259rind\u0259n qorunar."
  },
  // 2. İxlas, Fələq və Nas surələri (Müsəlman Qalası, #76)
  {
    id: "muavvizat-3-qul",
    category: "seher",
    categories: ["seher", "axsam"],
    timeLabel: "S\u0259h\u0259r v\u0259 ax\u015Fam",
    title: "\u0130xlas, F\u0259l\u0259q v\u0259 Nas Sur\u0259l\u0259ri",
    arabicText: "\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u064E\u0651\u0647\u0650 \u0627\u0644\u0631\u064E\u0651\u062D\u0652\u0645\u064E\u0670\u0646\u0650 \u0627\u0644\u0631\u064E\u0651\u062D\u0650\u064A\u0645\u0650 \u06DD \u0642\u064F\u0644\u0652 \u0647\u064F\u0648\u064E \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0623\u064E\u062D\u064E\u062F\u064C \u06DD \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0627\u0644\u0635\u064E\u0651\u0645\u064E\u062F\u064F \u06DD \u0644\u064E\u0645\u0652 \u064A\u064E\u0644\u0650\u062F\u0652 \u0648\u064E\u0644\u064E\u0645\u0652 \u064A\u064F\u0648\u0644\u064E\u062F\u0652 \u06DD \u0648\u064E\u0644\u064E\u0645\u0652 \u064A\u064E\u0643\u064F\u0646\u0652 \u0644\u064E\u0647\u064F \u0643\u064F\u0641\u064F\u0648\u064B\u0627 \u0623\u064E\u062D\u064E\u062F\u064C \u06DD \u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u064E\u0651\u0647\u0650 \u0627\u0644\u0631\u064E\u0651\u062D\u0652\u0645\u064E\u0670\u0646\u0650 \u0627\u0644\u0631\u064E\u0651\u062D\u0650\u064A\u0645\u0650 \u06DD \u0642\u064F\u0644\u0652 \u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0631\u064E\u0628\u0650\u0651 \u0627\u0644\u0652\u0641\u064E\u0644\u064E\u0642\u0650 \u06DD \u0645\u0650\u0646\u0652 \u0634\u064E\u0631\u0650\u0651 \u0645\u064E\u0627 \u062E\u064E\u0644\u064E\u0642\u064E \u06DD \u0648\u064E\u0645\u0650\u0646\u0652 \u0634\u064E\u0631\u0650\u0651 \u063A\u064E\u0627\u0633\u0650\u0642\u064D \u0625\u0650\u0630\u064E\u0627 \u0648\u064E\u0642\u064E\u0628\u064E \u06DD \u0648\u064E\u0645\u0650\u0646\u0652 \u0634\u064E\u0631\u0650\u0651 \u0627\u0644\u0646\u064E\u0651\u0641\u064E\u0651\u0627\u062B\u064E\u0627\u062A\u0650 \u0641\u0650\u064A \u0627\u0644\u0652\u0639\u064F\u0642\u064E\u062F\u0650 \u06DD \u0648\u064E\u0645\u0650\u0646\u0652 \u0634\u064E\u0631\u0650\u0651 \u062D\u064E\u0627\u0633\u0650\u062F\u064D \u0625\u0650\u0630\u064E\u0627 \u062D\u064E\u0633\u064E\u062F\u064E \u06DD \u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u064E\u0651\u0647\u0650 \u0627\u0644\u0631\u064E\u0651\u062D\u0652\u0645\u064E\u0670\u0646\u0650 \u0627\u0644\u0631\u064E\u0651\u062D\u0650\u064A\u0645\u0650 \u06DD \u0642\u064F\u0644\u0652 \u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0631\u064E\u0628\u0650\u0651 \u0627\u0644\u0646\u064E\u0651\u0627\u0633\u0650 \u06DD \u0645\u064E\u0644\u0650\u0643\u0650 \u0627\u0644\u0646\u064E\u0651\u0627\u0633\u0650 \u06DD \u0625\u0650\u0644\u064E\u0670\u0647\u0650 \u0627\u0644\u0646\u064E\u0651\u0627\u0633\u0650 \u06DD \u0645\u0650\u0646\u0652 \u0634\u064E\u0631\u0650\u0651 \u0627\u0644\u0652\u0648\u064E\u0633\u0652\u0648\u064E\u0627\u0633\u0650 \u0627\u0644\u0652\u062E\u064E\u0646\u064E\u0651\u0627\u0633\u0650 \u06DD \u0627\u0644\u064E\u0651\u0630\u0650\u064A \u064A\u064F\u0648\u064E\u0633\u0652\u0648\u0650\u0633\u064F \u0641\u0650\u064A \u0635\u064F\u062F\u064F\u0648\u0631\u0650 \u0627\u0644\u0646\u064E\u0651\u0627\u0633\u0650 \u06DD \u0645\u0650\u0646\u064E \u0627\u0644\u0652\u062C\u0650\u0646\u064E\u0651\u0629\u0650 \u0648\u064E\u0627\u0644\u0646\u064E\u0651\u0627\u0633\u0650",
    translation: 'M\u0259rh\u0259m\u0259tli v\u0259 R\u0259hmli Allah\u0131n ad\u0131 il\u0259! De: "O Allah T\u0259kdir! Allah M\xF6htac deyildir. O, n\u0259 do\u011Fmu\u015F, n\u0259 do\u011Fulmu\u015Fdur! Onun he\xE7 bir tay\u0131-b\u0259rab\u0259ri yoxdur!" \u2014 De: "S\u0131\u011F\u0131n\u0131ram s\xFCbh\xFCn R\u0259bbin\u0259! Yaratd\u0131qlar\u0131n\u0131n \u015F\u0259rind\u0259n, z\xFClm\u0259t\u0259 b\xFCr\xFCnm\u0259kd\u0259 olan gec\u0259nin \u015F\u0259rind\u0259n, d\xFCy\xFCnl\u0259r\u0259 \xFCf\xFCr\u0259n cadug\u0259rl\u0259rin \u015F\u0259rind\u0259n v\u0259 h\u0259s\u0259d apard\u0131\u011F\u0131 zaman h\u0259s\u0259d\xE7inin \u015F\u0259rind\u0259n!" \u2014 De: "S\u0131\u011F\u0131n\u0131ram insanlar\u0131n R\u0259bbin\u0259, insanlar\u0131n H\xF6kmdar\u0131na, insanlar\u0131n M\u0259buduna! V\u0259sv\u0259s\u0259 ver\u0259n, geri \xE7\u0259kil\u0259n \u015Feytan\u0131n \u015F\u0259rind\u0259n \u2014 hans\u0131 ki, insanlar\u0131n k\xF6ksl\u0259rin\u0259 v\u0259sv\u0259s\u0259 sal\u0131r \u2014 ist\u0259r cinl\u0259rd\u0259n olsun, ist\u0259r insanlardan!"',
    targetCount: 3,
    countNote: "3 d\u0259f\u0259 (h\u0259r sur\u0259 3 d\u0259f\u0259)",
    source: "M\xFCs\u0259lman Qalas\u0131 (#76) \xB7 \u018Fbu Davud (4/322), Tirmizi (5/567)",
    virtue: "S\u0259h\u0259r v\u0259 ax\u015Fam bu \xFC\xE7 sur\u0259ni \xFC\xE7 d\u0259f\u0259 oxumaq insan\u0131 h\u0259r bir \u015F\u0259r\u0259 qar\u015F\u0131 qoruyar v\u0259 ona kifay\u0259t ed\u0259r."
  },
  // 3. Əsbəhnə və əsbəhəl-mulku lilləh — Səhər (Müsəlman Qalası, #77)
  {
    id: "seher-baslangic",
    category: "seher",
    timeLabel: "S\u0259h\u0259r zikri",
    title: "S\u0259h\u0259r\u0259 \xC7\u0131xark\u0259n H\u0259md, Xeyir \u0130st\u0259yi v\u0259 S\u0131\u011F\u0131nma",
    arabicText: "\u0623\u064E\u0635\u0652\u0628\u064E\u062D\u0652\u0646\u064E\u0627 \u0648\u064E\u0623\u064E\u0635\u0652\u0628\u064E\u062D\u064E \u0627\u0644\u0652\u0645\u064F\u0644\u0652\u0643\u064F \u0644\u0650\u0644\u064E\u0651\u0647\u0650\u060C \u0648\u064E\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u064E\u0651\u0647\u0650\u060C \u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064E \u0625\u0650\u0644\u064E\u0651\u0627 \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0648\u064E\u062D\u0652\u062F\u064E\u0647\u064F \u0644\u064E\u0627 \u0634\u064E\u0631\u0650\u064A\u0643\u064E \u0644\u064E\u0647\u064F\u060C \u0644\u064E\u0647\u064F \u0627\u0644\u0652\u0645\u064F\u0644\u0652\u0643\u064F \u0648\u064E\u0644\u064E\u0647\u064F \u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0648\u064E\u0647\u064F\u0648\u064E \u0639\u064E\u0644\u064E\u0649\u0670 \u0643\u064F\u0644\u0650\u0651 \u0634\u064E\u064A\u0652\u0621\u064D \u0642\u064E\u062F\u0650\u064A\u0631\u064C\u060C \u0631\u064E\u0628\u0650\u0651 \u0623\u064E\u0633\u0652\u0623\u064E\u0644\u064F\u0643\u064E \u062E\u064E\u064A\u0652\u0631\u064E \u0645\u064E\u0627 \u0641\u0650\u064A \u0647\u064E\u0670\u0630\u064E\u0627 \u0627\u0644\u0652\u064A\u064E\u0648\u0652\u0645\u0650 \u0648\u064E\u062E\u064E\u064A\u0652\u0631\u064E \u0645\u064E\u0627 \u0628\u064E\u0639\u0652\u062F\u064E\u0647\u064F\u060C \u0648\u064E\u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0643\u064E \u0645\u0650\u0646\u0652 \u0634\u064E\u0631\u0650\u0651 \u0645\u064E\u0627 \u0641\u0650\u064A \u0647\u064E\u0670\u0630\u064E\u0627 \u0627\u0644\u0652\u064A\u064E\u0648\u0652\u0645\u0650 \u0648\u064E\u0634\u064E\u0631\u0650\u0651 \u0645\u064E\u0627 \u0628\u064E\u0639\u0652\u062F\u064E\u0647\u064F\u060C \u0631\u064E\u0628\u0650\u0651 \u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0643\u064E \u0645\u0650\u0646\u064E \u0627\u0644\u0652\u0643\u064E\u0633\u064E\u0644\u0650 \u0648\u064E\u0633\u064F\u0648\u0621\u0650 \u0627\u0644\u0652\u0643\u0650\u0628\u064E\u0631\u0650\u060C \u0631\u064E\u0628\u0650\u0651 \u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0643\u064E \u0645\u0650\u0646\u0652 \u0639\u064E\u0630\u064E\u0627\u0628\u064D \u0641\u0650\u064A \u0627\u0644\u0646\u064E\u0651\u0627\u0631\u0650 \u0648\u064E\u0639\u064E\u0630\u064E\u0627\u0628\u064D \u0641\u0650\u064A \u0627\u0644\u0652\u0642\u064E\u0628\u0652\u0631\u0650",
    translation: "S\u0259h\u0259r\u0259 \xE7\u0131xd\u0131q, m\xFClk d\u0259 Allaha m\u0259xsus olaraq s\u0259h\u0259r\u0259 \xE7\u0131xd\u0131. Allaha h\u0259md olsun! T\u0259k olan Allahdan ba\u015Fqa haqq m\u0259bud yoxdur, Onun \u015F\u0259riki yoxdur. M\xFClk Onundur, h\u0259md Onundur v\u0259 O, h\u0259r \u015Fey\u0259 qadirdir. Ey R\u0259bbim! S\u0259nd\u0259n bu g\xFCn\xFCn v\u0259 bundan sonrak\u0131 g\xFCnl\u0259rin xeyrini dil\u0259yir\u0259m. Bu g\xFCn\xFCn v\u0259 bundan sonrak\u0131 g\xFCnl\u0259rin \u015F\u0259rind\u0259n S\u0259n\u0259 s\u0131\u011F\u0131n\u0131ram. Ey R\u0259bbim! T\u0259nb\u0259llikd\u0259n v\u0259 qocal\u0131\u011F\u0131n d\xFC\u015Fg\xFCnl\xFCy\xFCnd\u0259n S\u0259n\u0259 s\u0131\u011F\u0131n\u0131ram. Ey R\u0259bbim! C\u0259h\u0259nn\u0259m \u0259zab\u0131ndan v\u0259 q\u0259bir \u0259zab\u0131ndan S\u0259n\u0259 s\u0131\u011F\u0131n\u0131ram!",
    targetCount: 1,
    countNote: "1 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#77) \xB7 S\u0259hih M\xFCslim (4/2088)",
    virtue: "Pey\u011F\u0259mb\u0259rimizin (s.a.s.) h\u0259r s\u0259h\u0259r oxudu\u011Fu \u0259sas s\u0259h\u0259r zikridir."
  },
  // 3b. Əmsəynə və əmsəl-mulku lilləh — Axşam (Müsəlman Qalası, #77)
  {
    id: "axsam-baslangic",
    category: "axsam",
    timeLabel: "Ax\u015Fam zikri",
    title: "Ax\u015Fama \xC7\u0131xark\u0259n H\u0259md, Xeyir \u0130st\u0259yi v\u0259 S\u0131\u011F\u0131nma",
    arabicText: "\u0623\u064E\u0645\u0652\u0633\u064E\u064A\u0652\u0646\u064E\u0627 \u0648\u064E\u0623\u064E\u0645\u0652\u0633\u064E\u0649 \u0627\u0644\u0652\u0645\u064F\u0644\u0652\u0643\u064F \u0644\u0650\u0644\u064E\u0651\u0647\u0650\u060C \u0648\u064E\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u064E\u0651\u0647\u0650\u060C \u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064E \u0625\u0650\u0644\u064E\u0651\u0627 \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0648\u064E\u062D\u0652\u062F\u064E\u0647\u064F \u0644\u064E\u0627 \u0634\u064E\u0631\u0650\u064A\u0643\u064E \u0644\u064E\u0647\u064F\u060C \u0644\u064E\u0647\u064F \u0627\u0644\u0652\u0645\u064F\u0644\u0652\u0643\u064F \u0648\u064E\u0644\u064E\u0647\u064F \u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0648\u064E\u0647\u064F\u0648\u064E \u0639\u064E\u0644\u064E\u0649\u0670 \u0643\u064F\u0644\u0650\u0651 \u0634\u064E\u064A\u0652\u0621\u064D \u0642\u064E\u062F\u0650\u064A\u0631\u064C\u060C \u0631\u064E\u0628\u0650\u0651 \u0623\u064E\u0633\u0652\u0623\u064E\u0644\u064F\u0643\u064E \u062E\u064E\u064A\u0652\u0631\u064E \u0645\u064E\u0627 \u0641\u0650\u064A \u0647\u064E\u0670\u0630\u0650\u0647\u0650 \u0627\u0644\u0644\u064E\u0651\u064A\u0652\u0644\u064E\u0629\u0650 \u0648\u064E\u062E\u064E\u064A\u0652\u0631\u064E \u0645\u064E\u0627 \u0628\u064E\u0639\u0652\u062F\u064E\u0647\u064E\u0627\u060C \u0648\u064E\u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0643\u064E \u0645\u0650\u0646\u0652 \u0634\u064E\u0631\u0650\u0651 \u0645\u064E\u0627 \u0641\u0650\u064A \u0647\u064E\u0670\u0630\u0650\u0647\u0650 \u0627\u0644\u0644\u064E\u0651\u064A\u0652\u0644\u064E\u0629\u0650 \u0648\u064E\u0634\u064E\u0631\u0650\u0651 \u0645\u064E\u0627 \u0628\u064E\u0639\u0652\u062F\u064E\u0647\u064E\u0627\u060C \u0631\u064E\u0628\u0650\u0651 \u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0643\u064E \u0645\u0650\u0646\u064E \u0627\u0644\u0652\u0643\u064E\u0633\u064E\u0644\u0650 \u0648\u064E\u0633\u064F\u0648\u0621\u0650 \u0627\u0644\u0652\u0643\u0650\u0628\u064E\u0631\u0650\u060C \u0631\u064E\u0628\u0650\u0651 \u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0643\u064E \u0645\u0650\u0646\u0652 \u0639\u064E\u0630\u064E\u0627\u0628\u064D \u0641\u0650\u064A \u0627\u0644\u0646\u064E\u0651\u0627\u0631\u0650 \u0648\u064E\u0639\u064E\u0630\u064E\u0627\u0628\u064D \u0641\u0650\u064A \u0627\u0644\u0652\u0642\u064E\u0628\u0652\u0631\u0650",
    translation: "Ax\u015Fama \xE7\u0131xd\u0131q, m\xFClk d\u0259 Allaha m\u0259xsus olaraq ax\u015Fama \xE7\u0131xd\u0131. Allaha h\u0259md olsun! T\u0259k olan Allahdan ba\u015Fqa haqq m\u0259bud yoxdur, Onun \u015F\u0259riki yoxdur. M\xFClk Onundur, h\u0259md Onundur v\u0259 O, h\u0259r \u015Fey\u0259 qadirdir. Ey R\u0259bbim! S\u0259nd\u0259n bu gec\u0259nin v\u0259 bundan sonrak\u0131 gec\u0259l\u0259rin xeyrini dil\u0259yir\u0259m. Bu gec\u0259nin v\u0259 bundan sonrak\u0131 gec\u0259l\u0259rin \u015F\u0259rind\u0259n S\u0259n\u0259 s\u0131\u011F\u0131n\u0131ram. Ey R\u0259bbim! T\u0259nb\u0259llikd\u0259n v\u0259 qocal\u0131\u011F\u0131n d\xFC\u015Fg\xFCnl\xFCy\xFCnd\u0259n S\u0259n\u0259 s\u0131\u011F\u0131n\u0131ram. Ey R\u0259bbim! C\u0259h\u0259nn\u0259m \u0259zab\u0131ndan v\u0259 q\u0259bir \u0259zab\u0131ndan S\u0259n\u0259 s\u0131\u011F\u0131n\u0131ram!",
    targetCount: 1,
    countNote: "1 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#77) \xB7 S\u0259hih M\xFCslim (4/2088)",
    virtue: "Pey\u011F\u0259mb\u0259rimizin (s.a.s.) h\u0259r ax\u015Fam oxudu\u011Fu \u0259sas ax\u015Fam zikridir."
  },
  // 4a. Allahummə bikə əsbəhnə — Səhər (Müsəlman Qalası, #78)
  {
    id: "seher-bike-esbehne",
    category: "seher",
    timeLabel: "S\u0259h\u0259r zikri",
    title: "S\u0259h\u0259r \u2014 Allah\u0131n \u0130zni il\u0259 Dirili\u015F v\u0259 D\xF6n\xFC\u015F Zikri",
    arabicText: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0628\u0650\u0643\u064E \u0623\u064E\u0635\u0652\u0628\u064E\u062D\u0652\u0646\u064E\u0627\u060C \u0648\u064E\u0628\u0650\u0643\u064E \u0623\u064E\u0645\u0652\u0633\u064E\u064A\u0652\u0646\u064E\u0627\u060C \u0648\u064E\u0628\u0650\u0643\u064E \u0646\u064E\u062D\u0652\u064A\u064E\u0627\u060C \u0648\u064E\u0628\u0650\u0643\u064E \u0646\u064E\u0645\u064F\u0648\u062A\u064F\u060C \u0648\u064E\u0625\u0650\u0644\u064E\u064A\u0652\u0643\u064E \u0627\u0644\u0646\u064F\u0651\u0634\u064F\u0648\u0631\u064F",
    translation: "Allah\u0131m! S\u0259nin k\xF6m\u0259yinl\u0259 s\u0259h\u0259r\u0259 \xE7\u0131xd\u0131q, S\u0259nin k\xF6m\u0259yinl\u0259 ax\u015Fama \xE7\u0131xd\u0131q, S\u0259nin \u0259mrinl\u0259 ya\u015Fay\u0131r\u0131q, S\u0259nin \u0259mrinl\u0259 \xF6l\xFCr\xFCk v\u0259 qay\u0131d\u0131\u015F da yaln\u0131z S\u0259n\u0259dir!",
    targetCount: 1,
    countNote: "1 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#78) \xB7 Tirmizi (5/466)",
    virtue: "H\u0259yat v\u0259 \xF6l\xFCm\xFCn yaln\u0131z Allah\u0131n \u0259lind\u0259 oldu\u011Funu t\u0259sdiql\u0259y\u0259n s\u0259h\u0259r zikridir."
  },
  // 4b. Allahummə bikə əmsəynə — Axşam (Müsəlman Qalası, #78)
  {
    id: "axsam-bike-emseyne",
    category: "axsam",
    timeLabel: "Ax\u015Fam zikri",
    title: "Ax\u015Fam \u2014 Allah\u0131n \u0130zni il\u0259 Qay\u0131d\u0131\u015F Zikri",
    arabicText: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0628\u0650\u0643\u064E \u0623\u064E\u0645\u0652\u0633\u064E\u064A\u0652\u0646\u064E\u0627\u060C \u0648\u064E\u0628\u0650\u0643\u064E \u0623\u064E\u0635\u0652\u0628\u064E\u062D\u0652\u0646\u064E\u0627\u060C \u0648\u064E\u0628\u0650\u0643\u064E \u0646\u064E\u062D\u0652\u064A\u064E\u0627\u060C \u0648\u064E\u0628\u0650\u0643\u064E \u0646\u064E\u0645\u064F\u0648\u062A\u064F\u060C \u0648\u064E\u0625\u0650\u0644\u064E\u064A\u0652\u0643\u064E \u0627\u0644\u0652\u0645\u064E\u0635\u0650\u064A\u0631\u064F",
    translation: "Allah\u0131m! S\u0259nin k\xF6m\u0259yinl\u0259 ax\u015Fama \xE7\u0131xd\u0131q, S\u0259nin k\xF6m\u0259yinl\u0259 s\u0259h\u0259r\u0259 \xE7\u0131xd\u0131q, S\u0259nin \u0259mrinl\u0259 ya\u015Fay\u0131r\u0131q, S\u0259nin \u0259mrinl\u0259 \xF6l\xFCr\xFCk v\u0259 d\xF6n\xFC\u015F d\u0259 yaln\u0131z S\u0259n\u0259dir!",
    targetCount: 1,
    countNote: "1 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#78) \xB7 Tirmizi (5/466)",
    virtue: "Ax\u015Fam vaxt\u0131 Allaha t\u0259slimiyy\u0259ti v\u0259 d\xF6n\xFC\u015F\xFC xat\u0131rladan m\xFCbar\u0259k zikrdir."
  },
  // 5. Seyyidül-İstiğfar (Müsəlman Qalası, #79)
  {
    id: "sayyidul-istighfar",
    category: "seher",
    categories: ["seher", "axsam"],
    timeLabel: "S\u0259h\u0259r v\u0259 ax\u015Fam",
    title: "Seyyid\xFCl-\u0130sti\u011Ffar (\u0130sti\u011Ffarlar\u0131n A\u011Fas\u0131)",
    arabicText: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0623\u064E\u0646\u0652\u062A\u064E \u0631\u064E\u0628\u0650\u0651\u064A \u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064E \u0625\u0650\u0644\u064E\u0651\u0627 \u0623\u064E\u0646\u0652\u062A\u064E\u060C \u062E\u064E\u0644\u064E\u0642\u0652\u062A\u064E\u0646\u0650\u064A \u0648\u064E\u0623\u064E\u0646\u064E\u0627 \u0639\u064E\u0628\u0652\u062F\u064F\u0643\u064E\u060C \u0648\u064E\u0623\u064E\u0646\u064E\u0627 \u0639\u064E\u0644\u064E\u0649\u0670 \u0639\u064E\u0647\u0652\u062F\u0650\u0643\u064E \u0648\u064E\u0648\u064E\u0639\u0652\u062F\u0650\u0643\u064E \u0645\u064E\u0627 \u0627\u0633\u0652\u062A\u064E\u0637\u064E\u0639\u0652\u062A\u064F\u060C \u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0643\u064E \u0645\u0650\u0646\u0652 \u0634\u064E\u0631\u0650\u0651 \u0645\u064E\u0627 \u0635\u064E\u0646\u064E\u0639\u0652\u062A\u064F\u060C \u0623\u064E\u0628\u064F\u0648\u0621\u064F \u0644\u064E\u0643\u064E \u0628\u0650\u0646\u0650\u0639\u0652\u0645\u064E\u062A\u0650\u0643\u064E \u0639\u064E\u0644\u064E\u064A\u064E\u0651\u060C \u0648\u064E\u0623\u064E\u0628\u064F\u0648\u0621\u064F \u0628\u0650\u0630\u064E\u0646\u0652\u0628\u0650\u064A \u0641\u064E\u0627\u063A\u0652\u0641\u0650\u0631\u0652 \u0644\u0650\u064A \u0641\u064E\u0625\u0650\u0646\u064E\u0651\u0647\u064F \u0644\u064E\u0627 \u064A\u064E\u063A\u0652\u0641\u0650\u0631\u064F \u0627\u0644\u0630\u064F\u0651\u0646\u064F\u0648\u0628\u064E \u0625\u0650\u0644\u064E\u0651\u0627 \u0623\u064E\u0646\u0652\u062A\u064E",
    translation: "Allah\u0131m! S\u0259n m\u0259nim R\u0259bbims\u0259n, S\u0259nd\u0259n ba\u015Fqa haqq m\u0259bud yoxdur. M\u0259ni S\u0259n yaratd\u0131n v\u0259 m\u0259n S\u0259nin qulunam. G\xFCc\xFCm \xE7atd\u0131\u011F\u0131 q\u0259d\u0259r S\u0259nin \u0259hd-peyman\u0131na v\u0259 v\u0259din\u0259 sadiq\u0259m. Etdiyim pis \u0259m\u0259ll\u0259rin \u015F\u0259rind\u0259n S\u0259n\u0259 s\u0131\u011F\u0131n\u0131ram. M\u0259n\u0259 verdiyin nem\u0259tl\u0259ri etiraf edir\u0259m v\u0259 g\xFCnahlar\u0131m\u0131 da boynuma al\u0131ram. M\u0259ni ba\u011F\u0131\u015Fla; \u015F\xFCbh\u0259siz ki, g\xFCnahlar\u0131 S\u0259nd\u0259n ba\u015Fqa ba\u011F\u0131\u015Flayan yoxdur.",
    targetCount: 1,
    countNote: "1 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#79) \xB7 S\u0259hih \u0259l-Buxari (7/150)",
    virtue: "Y\u0259qinlikl\u0259 g\xFCnd\xFCz oxuyub ax\u015Famdan \u0259vv\u0259l v\u0259 ya ax\u015Fam oxuyub s\u0259h\u0259rd\u0259n \u0259vv\u0259l v\u0259fat ed\u0259n C\u0259nn\u0259t \u0259hlind\u0259n olar."
  },
  // 6a. Şahidlik Zikri — Səhər (Müsəlman Qalası, #80)
  {
    id: "seher-ushhiduke",
    category: "seher",
    timeLabel: "S\u0259h\u0259r zikri",
    title: "S\u0259h\u0259r \u2014 Allah\u0131, \u018Fr\u015Fin Da\u015F\u0131y\u0131c\u0131lar\u0131n\u0131 v\u0259 M\u0259l\u0259kl\u0259ri \u015Eahid Tutmaq",
    arabicText: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0625\u0650\u0646\u0650\u0651\u064A \u0623\u064E\u0635\u0652\u0628\u064E\u062D\u0652\u062A\u064F \u0623\u064F\u0634\u0652\u0647\u0650\u062F\u064F\u0643\u064E\u060C \u0648\u064E\u0623\u064F\u0634\u0652\u0647\u0650\u062F\u064F \u062D\u064E\u0645\u064E\u0644\u064E\u0629\u064E \u0639\u064E\u0631\u0652\u0634\u0650\u0643\u064E\u060C \u0648\u064E\u0645\u064E\u0644\u064E\u0627\u0626\u0650\u0643\u064E\u062A\u064E\u0643\u064E\u060C \u0648\u064E\u062C\u064E\u0645\u0650\u064A\u0639\u064E \u062E\u064E\u0644\u0652\u0642\u0650\u0643\u064E\u060C \u0623\u064E\u0646\u064E\u0651\u0643\u064E \u0623\u064E\u0646\u0652\u062A\u064E \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064E \u0625\u0650\u0644\u064E\u0651\u0627 \u0623\u064E\u0646\u0652\u062A\u064E \u0648\u064E\u062D\u0652\u062F\u064E\u0643\u064E \u0644\u064E\u0627 \u0634\u064E\u0631\u0650\u064A\u0643\u064E \u0644\u064E\u0643\u064E\u060C \u0648\u064E\u0623\u064E\u0646\u064E\u0651 \u0645\u064F\u062D\u064E\u0645\u064E\u0651\u062F\u064B\u0627 \u0639\u064E\u0628\u0652\u062F\u064F\u0643\u064E \u0648\u064E\u0631\u064E\u0633\u064F\u0648\u0644\u064F\u0643\u064E",
    translation: "Allah\u0131m! S\u0259h\u0259r\u0259 \xE7\u0131xd\u0131m v\u0259 S\u0259ni, \u018Fr\u015Fini da\u015F\u0131yanlar\u0131, m\u0259l\u0259kl\u0259rini v\u0259 b\xFCt\xFCn yaratd\u0131qlar\u0131n\u0131 \u015Fahid tuturam ki, S\u0259n \xD6z\xFCnd\u0259n ba\u015Fqa haqq m\u0259bud olmayan T\u0259k Allahsan, S\u0259nin \u015F\u0259rikin yoxdur v\u0259 Muh\u0259mm\u0259d (s.a.s.) S\u0259nin qulun v\u0259 el\xE7indir.",
    targetCount: 4,
    countNote: "4 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#80) \xB7 \u018Fbu Davud (4/317)",
    virtue: "Kim bu zikri s\u0259h\u0259r v\u0259 ya ax\u015Fam d\xF6rd d\u0259f\u0259 oxuyarsa, Allah onu C\u0259h\u0259nn\u0259m odundan azad ed\u0259r."
  },
  // 6b. Şahidlik Zikri — Axşam (Müsəlman Qalası, #80)
  {
    id: "axsam-ushhiduke",
    category: "axsam",
    timeLabel: "Ax\u015Fam zikri",
    title: "Ax\u015Fam \u2014 Allah\u0131, \u018Fr\u015Fin Da\u015F\u0131y\u0131c\u0131lar\u0131n\u0131 v\u0259 M\u0259l\u0259kl\u0259ri \u015Eahid Tutmaq",
    arabicText: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0625\u0650\u0646\u0650\u0651\u064A \u0623\u064E\u0645\u0652\u0633\u064E\u064A\u0652\u062A\u064F \u0623\u064F\u0634\u0652\u0647\u0650\u062F\u064F\u0643\u064E\u060C \u0648\u064E\u0623\u064F\u0634\u0652\u0647\u0650\u062F\u064F \u062D\u064E\u0645\u064E\u0644\u064E\u0629\u064E \u0639\u064E\u0631\u0652\u0634\u0650\u0643\u064E\u060C \u0648\u064E\u0645\u064E\u0644\u064E\u0627\u0626\u0650\u0643\u064E\u062A\u064E\u0643\u064E\u060C \u0648\u064E\u062C\u064E\u0645\u0650\u064A\u0639\u064E \u062E\u064E\u0644\u0652\u0642\u0650\u0643\u064E\u060C \u0623\u064E\u0646\u064E\u0651\u0643\u064E \u0623\u064E\u0646\u0652\u062A\u064E \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064E \u0625\u0650\u0644\u064E\u0651\u0627 \u0623\u064E\u0646\u0652\u062A\u064E \u0648\u064E\u062D\u0652\u062F\u064E\u0643\u064E \u0644\u064E\u0627 \u0634\u064E\u0631\u0650\u064A\u0643\u064E \u0644\u064E\u0643\u064E\u060C \u0648\u064E\u0623\u064E\u0646\u064E\u0651 \u0645\u064F\u062D\u064E\u0645\u064E\u0651\u062F\u064B\u0627 \u0639\u064E\u0628\u0652\u062F\u064F\u0643\u064E \u0648\u064E\u0631\u064E\u0633\u064F\u0648\u0644\u064F\u0643\u064E",
    translation: "Allah\u0131m! Ax\u015Fama \xE7\u0131xd\u0131m v\u0259 S\u0259ni, \u018Fr\u015Fini da\u015F\u0131yanlar\u0131, m\u0259l\u0259kl\u0259rini v\u0259 b\xFCt\xFCn yaratd\u0131qlar\u0131n\u0131 \u015Fahid tuturam ki, S\u0259n \xD6z\xFCnd\u0259n ba\u015Fqa haqq m\u0259bud olmayan T\u0259k Allahsan, S\u0259nin \u015F\u0259rikin yoxdur v\u0259 Muh\u0259mm\u0259d (s.a.s.) S\u0259nin qulun v\u0259 el\xE7indir.",
    targetCount: 4,
    countNote: "4 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#80) \xB7 \u018Fbu Davud (4/317)",
    virtue: "Kim bu zikri s\u0259h\u0259r v\u0259 ya ax\u015Fam d\xF6rd d\u0259f\u0259 oxuyarsa, Allah onu C\u0259h\u0259nn\u0259m odundan azad ed\u0259r."
  },
  // 7a. Nemətə Şükür — Səhər (Müsəlman Qalası, #81)
  {
    id: "seher-nime-shukur",
    category: "seher",
    timeLabel: "S\u0259h\u0259r zikri",
    title: "S\u0259h\u0259r \u2014 Nem\u0259tl\u0259rin Yaln\u0131z Allahdan Oldu\u011Funa \u015E\xFCk\xFCr Zikri",
    arabicText: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0645\u064E\u0627 \u0623\u064E\u0635\u0652\u0628\u064E\u062D\u064E \u0628\u0650\u064A \u0645\u0650\u0646\u0652 \u0646\u0650\u0639\u0652\u0645\u064E\u0629\u064D \u0623\u064E\u0648\u0652 \u0628\u0650\u0623\u064E\u062D\u064E\u062F\u064D \u0645\u0650\u0646\u0652 \u062E\u064E\u0644\u0652\u0642\u0650\u0643\u064E \u0641\u064E\u0645\u0650\u0646\u0652\u0643\u064E \u0648\u064E\u062D\u0652\u062F\u064E\u0643\u064E \u0644\u064E\u0627 \u0634\u064E\u0631\u0650\u064A\u0643\u064E \u0644\u064E\u0643\u064E\u060C \u0641\u064E\u0644\u064E\u0643\u064E \u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0648\u064E\u0644\u064E\u0643\u064E \u0627\u0644\u0634\u064F\u0651\u0643\u0652\u0631\u064F",
    translation: "Allah\u0131m! Bu s\u0259h\u0259r m\u0259n\u0259 v\u0259 ya yaratd\u0131qlar\u0131ndan h\u0259r hans\u0131 birin\u0259 n\u0259sib olan h\u0259r bir nem\u0259t yaln\u0131z S\u0259nd\u0259ndir, S\u0259nin \u015F\u0259rikin yoxdur. H\u0259md d\u0259 S\u0259n\u0259dir, \u015F\xFCk\xFCr d\u0259 S\u0259n\u0259dir!",
    targetCount: 1,
    countNote: "1 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#81) \xB7 \u018Fbu Davud (4/318)",
    virtue: "Kim bu duan\u0131 s\u0259h\u0259r oxuyarsa, o g\xFCn\xFCn \u015F\xFCkr\xFCn\xFC yerin\u0259 yetirmi\u015F olar."
  },
  // 7b. Nemətə Şükür — Axşam (Müsəlman Qalası, #81)
  {
    id: "axsam-nime-shukur",
    category: "axsam",
    timeLabel: "Ax\u015Fam zikri",
    title: "Ax\u015Fam \u2014 Nem\u0259tl\u0259rin Yaln\u0131z Allahdan Oldu\u011Funa \u015E\xFCk\xFCr Zikri",
    arabicText: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0645\u064E\u0627 \u0623\u064E\u0645\u0652\u0633\u064E\u0649 \u0628\u0650\u064A \u0645\u0650\u0646\u0652 \u0646\u0650\u0639\u0652\u0645\u064E\u0629\u064D \u0623\u064E\u0648\u0652 \u0628\u0650\u0623\u064E\u062D\u064E\u062F\u064D \u0645\u0650\u0646\u0652 \u062E\u064E\u0644\u0652\u0642\u0650\u0643\u064E \u0641\u064E\u0645\u0650\u0646\u0652\u0643\u064E \u0648\u064E\u062D\u0652\u062F\u064E\u0643\u064E \u0644\u064E\u0627 \u0634\u064E\u0631\u0650\u064A\u0643\u064E \u0644\u064E\u0643\u064E\u060C \u0641\u064E\u0644\u064E\u0643\u064E \u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0648\u064E\u0644\u064E\u0643\u064E \u0627\u0644\u0634\u064F\u0651\u0643\u0652\u0631\u064F",
    translation: "Allah\u0131m! Bu ax\u015Fam m\u0259n\u0259 v\u0259 ya yaratd\u0131qlar\u0131ndan h\u0259r hans\u0131 birin\u0259 n\u0259sib olan h\u0259r bir nem\u0259t yaln\u0131z S\u0259nd\u0259ndir, S\u0259nin \u015F\u0259rikin yoxdur. H\u0259md d\u0259 S\u0259n\u0259dir, \u015F\xFCk\xFCr d\u0259 S\u0259n\u0259dir!",
    targetCount: 1,
    countNote: "1 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#81) \xB7 \u018Fbu Davud (4/318)",
    virtue: "Kim bu duan\u0131 ax\u015Fam oxuyarsa, o gec\u0259nin \u015F\xFCkr\xFCn\xFC yerin\u0259 yetirmi\u015F olar."
  },
  // 8. Bədən, Qulaq və Göz Sağlamlığı (Müsəlman Qalası, #82)
  {
    id: "afini-fi-bedeni",
    category: "seher",
    categories: ["seher", "axsam"],
    timeLabel: "S\u0259h\u0259r v\u0259 ax\u015Fam",
    title: "B\u0259d\u0259n, E\u015Fitm\u0259 v\u0259 G\xF6rm\u0259 Sa\u011Flaml\u0131\u011F\u0131 \u0130st\u0259yi",
    arabicText: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0639\u064E\u0627\u0641\u0650\u0646\u0650\u064A \u0641\u0650\u064A \u0628\u064E\u062F\u064E\u0646\u0650\u064A\u060C \u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0639\u064E\u0627\u0641\u0650\u0646\u0650\u064A \u0641\u0650\u064A \u0633\u064E\u0645\u0652\u0639\u0650\u064A\u060C \u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0639\u064E\u0627\u0641\u0650\u0646\u0650\u064A \u0641\u0650\u064A \u0628\u064E\u0635\u064E\u0631\u0650\u064A\u060C \u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064E \u0625\u0650\u0644\u064E\u0651\u0627 \u0623\u064E\u0646\u0652\u062A\u064E\u060C \u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0625\u0650\u0646\u0650\u0651\u064A \u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0643\u064E \u0645\u0650\u0646\u064E \u0627\u0644\u0652\u0643\u064F\u0641\u0652\u0631\u0650 \u0648\u064E\u0627\u0644\u0652\u0641\u064E\u0642\u0652\u0631\u0650\u060C \u0648\u064E\u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0643\u064E \u0645\u0650\u0646\u0652 \u0639\u064E\u0630\u064E\u0627\u0628\u0650 \u0627\u0644\u0652\u0642\u064E\u0628\u0652\u0631\u0650\u060C \u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064E \u0625\u0650\u0644\u064E\u0651\u0627 \u0623\u064E\u0646\u0652\u062A\u064E",
    translation: "Allah\u0131m! B\u0259d\u0259nim\u0259 sa\u011Flaml\u0131q ver! Allah\u0131m! Qula\u011F\u0131ma sa\u011Flaml\u0131q ver! Allah\u0131m! G\xF6z\xFCm\u0259 sa\u011Flaml\u0131q ver! S\u0259nd\u0259n ba\u015Fqa haqq m\u0259bud yoxdur. Allah\u0131m! K\xFCfrd\u0259n v\u0259 yoxsulluqdan S\u0259n\u0259 s\u0131\u011F\u0131n\u0131ram. Q\u0259bir \u0259zab\u0131ndan S\u0259n\u0259 s\u0131\u011F\u0131n\u0131ram. S\u0259nd\u0259n ba\u015Fqa haqq m\u0259bud yoxdur!",
    targetCount: 3,
    countNote: "3 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#82) \xB7 \u018Fbu Davud (4/324), \u018Fhm\u0259d (5/42)",
    virtue: "S\u0259h\u0259r v\u0259 ax\u015Fam 3 d\u0259f\u0259 oxunaraq h\u0259m b\u0259d\u0259n afiy\u0259ti, h\u0259m d\u0259 q\u0259bir \u0259zab\u0131ndan qorunma dil\u0259nir."
  },
  // 9. Təvəkkül Zikri (Müsəlman Qalası, #83)
  {
    id: "hasbiyallahu",
    category: "seher",
    categories: ["seher", "axsam"],
    timeLabel: "S\u0259h\u0259r v\u0259 ax\u015Fam",
    title: "D\xFCnya v\u0259 Axir\u0259t Qay\u011F\u0131lar\u0131na Qar\u015F\u0131 T\u0259v\u0259kk\xFCl Zikri",
    arabicText: "\u062D\u064E\u0633\u0652\u0628\u0650\u064A\u064E \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064E \u0625\u0650\u0644\u064E\u0651\u0627 \u0647\u064F\u0648\u064E\u060C \u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650 \u062A\u064E\u0648\u064E\u0643\u064E\u0651\u0644\u0652\u062A\u064F\u060C \u0648\u064E\u0647\u064F\u0648\u064E \u0631\u064E\u0628\u064F\u0651 \u0627\u0644\u0652\u0639\u064E\u0631\u0652\u0634\u0650 \u0627\u0644\u0652\u0639\u064E\u0638\u0650\u064A\u0645\u0650",
    translation: "M\u0259n\u0259 Allah yet\u0259r! Ondan ba\u015Fqa haqq m\u0259bud yoxdur. M\u0259n yaln\u0131z Ona t\u0259v\u0259kk\xFCl etdim. O, \u0259z\u0259m\u0259tli \u018Fr\u015Fin R\u0259bbidir!",
    targetCount: 7,
    countNote: "7 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#83) \xB7 \u018Fbu Davud (4/321)",
    virtue: "Kim bunu s\u0259h\u0259r v\u0259 ax\u015Fam yeddi d\u0259f\u0259 dey\u0259rs\u0259, d\xFCnya v\u0259 axir\u0259t il\u0259 ba\u011Fl\u0131 onu narahat ed\u0259n h\u0259r i\u015Fd\u0259 Allah ona kifay\u0259t ed\u0259r."
  },
  // 10. Dünya və Axirətdə Bağışlanma və Salamatlıq (Müsəlman Qalası, #84)
  {
    id: "afve-vel-afiyete",
    category: "seher",
    categories: ["seher", "axsam"],
    timeLabel: "S\u0259h\u0259r v\u0259 ax\u015Fam",
    title: "D\xFCnya v\u0259 Axir\u0259td\u0259 \u018Ffv, Afiy\u0259t v\u0259 Hifz Duas\u0131",
    arabicText: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0625\u0650\u0646\u0650\u0651\u064A \u0623\u064E\u0633\u0652\u0623\u064E\u0644\u064F\u0643\u064E \u0627\u0644\u0652\u0639\u064E\u0641\u0652\u0648\u064E \u0648\u064E\u0627\u0644\u0652\u0639\u064E\u0627\u0641\u0650\u064A\u064E\u0629\u064E \u0641\u0650\u064A \u0627\u0644\u062F\u064F\u0651\u0646\u0652\u064A\u064E\u0627 \u0648\u064E\u0627\u0644\u0652\u0622\u062E\u0650\u0631\u064E\u0629\u0650\u060C \u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0625\u0650\u0646\u0650\u0651\u064A \u0623\u064E\u0633\u0652\u0623\u064E\u0644\u064F\u0643\u064E \u0627\u0644\u0652\u0639\u064E\u0641\u0652\u0648\u064E \u0648\u064E\u0627\u0644\u0652\u0639\u064E\u0627\u0641\u0650\u064A\u064E\u0629\u064E \u0641\u0650\u064A \u062F\u0650\u064A\u0646\u0650\u064A \u0648\u064E\u062F\u064F\u0646\u0652\u064A\u064E\u0627\u064A\u064E \u0648\u064E\u0623\u064E\u0647\u0652\u0644\u0650\u064A \u0648\u064E\u0645\u064E\u0627\u0644\u0650\u064A\u060C \u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0627\u0633\u0652\u062A\u064F\u0631\u0652 \u0639\u064E\u0648\u0652\u0631\u064E\u0627\u062A\u0650\u064A \u0648\u064E\u0622\u0645\u0650\u0646\u0652 \u0631\u064E\u0648\u0652\u0639\u064E\u0627\u062A\u0650\u064A\u060C \u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0627\u062D\u0652\u0641\u064E\u0638\u0652\u0646\u0650\u064A \u0645\u0650\u0646\u0652 \u0628\u064E\u064A\u0652\u0646\u0650 \u064A\u064E\u062F\u064E\u064A\u064E\u0651\u060C \u0648\u064E\u0645\u0650\u0646\u0652 \u062E\u064E\u0644\u0652\u0641\u0650\u064A\u060C \u0648\u064E\u0639\u064E\u0646\u0652 \u064A\u064E\u0645\u0650\u064A\u0646\u0650\u064A\u060C \u0648\u064E\u0639\u064E\u0646\u0652 \u0634\u0650\u0645\u064E\u0627\u0644\u0650\u064A\u060C \u0648\u064E\u0645\u0650\u0646\u0652 \u0641\u064E\u0648\u0652\u0642\u0650\u064A\u060C \u0648\u064E\u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0639\u064E\u0638\u064E\u0645\u064E\u062A\u0650\u0643\u064E \u0623\u064E\u0646\u0652 \u0623\u064F\u063A\u0652\u062A\u064E\u0627\u0644\u064E \u0645\u0650\u0646\u0652 \u062A\u064E\u062D\u0652\u062A\u0650\u064A",
    translation: "Allah\u0131m! D\xFCnya v\u0259 axir\u0259td\u0259 S\u0259nd\u0259n \u0259fv v\u0259 salamatl\u0131q (afiy\u0259t) dil\u0259yir\u0259m. Allah\u0131m! Dinimd\u0259, d\xFCnyamda, ail\u0259md\u0259 v\u0259 mal\u0131mda S\u0259nd\u0259n \u0259fv v\u0259 salamatl\u0131q dil\u0259yir\u0259m. Allah\u0131m! Eyibl\u0259rimi \xF6rt v\u0259 qorxular\u0131mdan m\u0259ni \u0259min-amanl\u0131qda et. Allah\u0131m! M\u0259ni \xF6n\xFCmd\u0259n, arxamdan, sa\u011F\u0131mdan, solumdan v\u0259 yuxar\u0131mdan qoru; alt t\u0259r\u0259fd\u0259n q\u0259fil f\u0259lak\u0259t\u0259 d\xFC\xE7ar olmaqdan da S\u0259nin \u0259z\u0259m\u0259tin\u0259 s\u0131\u011F\u0131n\u0131ram!",
    targetCount: 1,
    countNote: "1 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#84) \xB7 \u018Fbu Davud, \u0130bn Mac\u0259 (2/332)",
    virtue: "Pey\u011F\u0259mb\u0259rimizin (s.a.s.) s\u0259h\u0259r v\u0259 ax\u015Fam he\xE7 vaxt t\u0259rk etm\u0259diyi \u0259hat\u0259li qorunma duas\u0131d\u0131r."
  },
  // 11. Qeybi və Aşkarı Bilən Allaha Sığınma (Müsəlman Qalası, #85)
  {
    id: "alimel-gaybi",
    category: "seher",
    categories: ["seher", "axsam"],
    timeLabel: "S\u0259h\u0259r v\u0259 ax\u015Fam",
    title: "N\u0259fsin v\u0259 \u015Eeytan\u0131n \u015E\u0259rind\u0259n S\u0131\u011F\u0131nma Duas\u0131",
    arabicText: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0639\u064E\u0627\u0644\u0650\u0645\u064E \u0627\u0644\u0652\u063A\u064E\u064A\u0652\u0628\u0650 \u0648\u064E\u0627\u0644\u0634\u064E\u0651\u0647\u064E\u0627\u062F\u064E\u0629\u0650 \u0641\u064E\u0627\u0637\u0650\u0631\u064E \u0627\u0644\u0633\u064E\u0651\u0645\u064E\u0627\u0648\u064E\u0627\u062A\u0650 \u0648\u064E\u0627\u0644\u0652\u0623\u064E\u0631\u0652\u0636\u0650\u060C \u0631\u064E\u0628\u064E\u0651 \u0643\u064F\u0644\u0650\u0651 \u0634\u064E\u064A\u0652\u0621\u064D \u0648\u064E\u0645\u064E\u0644\u0650\u064A\u0643\u064E\u0647\u064F\u060C \u0623\u064E\u0634\u0652\u0647\u064E\u062F\u064F \u0623\u064E\u0646\u0652 \u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064E \u0625\u0650\u0644\u064E\u0651\u0627 \u0623\u064E\u0646\u0652\u062A\u064E\u060C \u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0643\u064E \u0645\u0650\u0646\u0652 \u0634\u064E\u0631\u0650\u0651 \u0646\u064E\u0641\u0652\u0633\u0650\u064A\u060C \u0648\u064E\u0645\u0650\u0646\u0652 \u0634\u064E\u0631\u0650\u0651 \u0627\u0644\u0634\u064E\u0651\u064A\u0652\u0637\u064E\u0627\u0646\u0650 \u0648\u064E\u0634\u0650\u0631\u0652\u0643\u0650\u0647\u0650\u060C \u0648\u064E\u0623\u064E\u0646\u0652 \u0623\u064E\u0642\u0652\u062A\u064E\u0631\u0650\u0641\u064E \u0639\u064E\u0644\u064E\u0649\u0670 \u0646\u064E\u0641\u0652\u0633\u0650\u064A \u0633\u064F\u0648\u0621\u064B\u0627 \u0623\u064E\u0648\u0652 \u0623\u064E\u062C\u064F\u0631\u064E\u0651\u0647\u064F \u0625\u0650\u0644\u064E\u0649\u0670 \u0645\u064F\u0633\u0652\u0644\u0650\u0645\u064D",
    translation: "Ey qeybi v\u0259 a\u015Fkar\u0131 Bil\u0259n, g\xF6yl\u0259ri v\u0259 yeri Yaradan Allah\u0131m! Ey h\u0259r \u015Feyin R\u0259bbi v\u0259 Sahibi! \u015E\u0259had\u0259t verir\u0259m ki, S\u0259nd\u0259n ba\u015Fqa haqq m\u0259bud yoxdur. N\u0259fsimin \u015F\u0259rind\u0259n, \u015Feytan\u0131n \u015F\u0259rind\u0259n v\u0259 \u015Firkind\u0259n, \xF6z\xFCm\u0259 qar\u015F\u0131 pislik etm\u0259kd\u0259n v\u0259 ya onu bir m\xFCs\u0259lmana y\xF6n\u0259ltm\u0259kd\u0259n S\u0259n\u0259 s\u0131\u011F\u0131n\u0131ram!",
    targetCount: 1,
    countNote: "1 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#85) \xB7 Tirmizi, \u018Fbu Davud (4/317)",
    virtue: "S\u0259h\u0259r, ax\u015Fam v\u0259 yata\u011Fa uzananda oxunan n\u0259fis qorunma zikridir."
  },
  // 12. Hər Cür Zərərdən Qorunma (Müsəlman Qalası, #86)
  {
    id: "seher-qorunma",
    category: "seher",
    categories: ["seher", "axsam"],
    timeLabel: "S\u0259h\u0259r v\u0259 ax\u015Fam",
    title: "H\u0259r C\xFCr B\u0259la v\u0259 Q\u0259fil Z\u0259r\u0259rd\u0259n Qorunma Zikri",
    arabicText: "\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u064E\u0651\u0647\u0650 \u0627\u0644\u064E\u0651\u0630\u0650\u064A \u0644\u064E\u0627 \u064A\u064E\u0636\u064F\u0631\u064F\u0651 \u0645\u064E\u0639\u064E \u0627\u0633\u0652\u0645\u0650\u0647\u0650 \u0634\u064E\u064A\u0652\u0621\u064C \u0641\u0650\u064A \u0627\u0644\u0652\u0623\u064E\u0631\u0652\u0636\u0650 \u0648\u064E\u0644\u064E\u0627 \u0641\u0650\u064A \u0627\u0644\u0633\u064E\u0651\u0645\u064E\u0627\u0621\u0650 \u0648\u064E\u0647\u064F\u0648\u064E \u0627\u0644\u0633\u064E\u0651\u0645\u0650\u064A\u0639\u064F \u0627\u0644\u0652\u0639\u064E\u0644\u0650\u064A\u0645\u064F",
    translation: "Ad\u0131 il\u0259 yerd\u0259 v\u0259 g\xF6yd\u0259 he\xE7 bir \u015Feyin z\u0259r\u0259r ver\u0259 bilm\u0259y\u0259c\u0259yi Allah\u0131n ad\u0131 il\u0259! O, E\u015Fid\u0259ndir, Bil\u0259ndir.",
    targetCount: 3,
    countNote: "3 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#86) \xB7 \u018Fbu Davud (4/323), Tirmizi (5/465)",
    virtue: "S\u0259h\u0259r 3 d\u0259f\u0259 oxuyana ax\u015Fama q\u0259d\u0259r, ax\u015Fam 3 d\u0259f\u0259 oxuyana s\u0259h\u0259r\u0259 q\u0259d\u0259r q\u0259fil b\u0259la toxunmaz."
  },
  // 13. İman və İslamdan Razılıq (Müsəlman Qalası, #87)
  {
    id: "seher-razi-olmaq",
    category: "seher",
    categories: ["seher", "axsam"],
    timeLabel: "S\u0259h\u0259r v\u0259 ax\u015Fam",
    title: "Allahdan, \u0130slamdan v\u0259 Pey\u011F\u0259mb\u0259rd\u0259n (s.a.s.) Raz\u0131l\u0131q Zikri",
    arabicText: "\u0631\u064E\u0636\u0650\u064A\u062A\u064F \u0628\u0650\u0627\u0644\u0644\u064E\u0651\u0647\u0650 \u0631\u064E\u0628\u064B\u0651\u0627\u060C \u0648\u064E\u0628\u0650\u0627\u0644\u0652\u0625\u0650\u0633\u0652\u0644\u064E\u0627\u0645\u0650 \u062F\u0650\u064A\u0646\u064B\u0627\u060C \u0648\u064E\u0628\u0650\u0645\u064F\u062D\u064E\u0645\u064E\u0651\u062F\u064D \u0635\u064E\u0644\u064E\u0651\u0649 \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650 \u0648\u064E\u0633\u064E\u0644\u064E\u0651\u0645\u064E \u0646\u064E\u0628\u0650\u064A\u064B\u0651\u0627",
    translation: "Allah\u0131n R\u0259bb, \u0130slam\u0131n din, Muh\u0259mm\u0259din (s.a.s.) is\u0259 pey\u011F\u0259mb\u0259r olmas\u0131na raz\u0131 qald\u0131m.",
    targetCount: 3,
    countNote: "3 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#87) \xB7 \u018Fhm\u0259d (4/337), \u018Fbu Davud (4/318)",
    virtue: "Kim bunu s\u0259h\u0259r v\u0259 ax\u015Fam \xFC\xE7 d\u0259f\u0259 dey\u0259rs\u0259, Qiyam\u0259t g\xFCn\xFC Allah\u0131n onu raz\u0131 salmas\u0131 haqq olar."
  },
  // 14. Ya Həyyu ya Qəyyumu birəhmətikə əstəğis (Müsəlman Qalası, #88)
  {
    id: "ya-hayyu-ya-qayyum",
    category: "seher",
    categories: ["seher", "axsam"],
    timeLabel: "S\u0259h\u0259r v\u0259 ax\u015Fam",
    title: "B\xFCt\xFCn \u0130\u015Fl\u0259rin Islah\u0131 \xDC\xE7\xFCn Allahdan Yard\u0131m \u0130st\u0259yi",
    arabicText: "\u064A\u064E\u0627 \u062D\u064E\u064A\u064F\u0651 \u064A\u064E\u0627 \u0642\u064E\u064A\u064F\u0651\u0648\u0645\u064F \u0628\u0650\u0631\u064E\u062D\u0652\u0645\u064E\u062A\u0650\u0643\u064E \u0623\u064E\u0633\u0652\u062A\u064E\u063A\u0650\u064A\u062B\u064F \u0623\u064E\u0635\u0652\u0644\u0650\u062D\u0652 \u0644\u0650\u064A \u0634\u064E\u0623\u0652\u0646\u0650\u064A \u0643\u064F\u0644\u064E\u0651\u0647\u064F \u0648\u064E\u0644\u064E\u0627 \u062A\u064E\u0643\u0650\u0644\u0652\u0646\u0650\u064A \u0625\u0650\u0644\u064E\u0649\u0670 \u0646\u064E\u0641\u0652\u0633\u0650\u064A \u0637\u064E\u0631\u0652\u0641\u064E\u0629\u064E \u0639\u064E\u064A\u0652\u0646\u064D",
    translation: "Ey \u018Fb\u0259di Ya\u015Fayan (H\u0259yy), ey h\u0259r \u015Feyi Qoruyub \u0130dar\u0259 Ed\u0259n (Q\u0259yyum)! S\u0259nin m\u0259rh\u0259m\u0259tinl\u0259 S\u0259nd\u0259n imdad dil\u0259yir\u0259m. B\xFCt\xFCn i\u015Fl\u0259rimi islah et (yoluna qoy) v\u0259 m\u0259ni bir g\xF6z q\u0131rp\u0131m\u0131 bel\u0259 \xF6z n\u0259fsimin \xF6hd\u0259sin\u0259 buraxma!",
    targetCount: 1,
    countNote: "1 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#88) \xB7 Hakim (1/545), N\u0259sai",
    virtue: "Qulun acizliyini etiraf edib b\xFCt\xFCn i\u015Fl\u0259rind\u0259 Allah\u0131n m\u0259rh\u0259m\u0259tin\u0259 s\u0131\u011F\u0131nd\u0131\u011F\u0131 zikrdir."
  },
  // 15a. Günün Fəthi, Nuru və Bərəkəti — Səhər (Müsəlman Qalası, #89)
  {
    id: "seher-feth-nur",
    category: "seher",
    timeLabel: "S\u0259h\u0259r zikri",
    title: "S\u0259h\u0259r \u2014 G\xFCn\xFCn F\u0259thi, Nuru, B\u0259r\u0259k\u0259ti v\u0259 Hiday\u0259ti \u0130st\u0259yi",
    arabicText: "\u0623\u064E\u0635\u0652\u0628\u064E\u062D\u0652\u0646\u064E\u0627 \u0648\u064E\u0623\u064E\u0635\u0652\u0628\u064E\u062D\u064E \u0627\u0644\u0652\u0645\u064F\u0644\u0652\u0643\u064F \u0644\u0650\u0644\u064E\u0651\u0647\u0650 \u0631\u064E\u0628\u0650\u0651 \u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E\u060C \u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0625\u0650\u0646\u0650\u0651\u064A \u0623\u064E\u0633\u0652\u0623\u064E\u0644\u064F\u0643\u064E \u062E\u064E\u064A\u0652\u0631\u064E \u0647\u064E\u0670\u0630\u064E\u0627 \u0627\u0644\u0652\u064A\u064E\u0648\u0652\u0645\u0650: \u0641\u064E\u062A\u0652\u062D\u064E\u0647\u064F\u060C \u0648\u064E\u0646\u064E\u0635\u0652\u0631\u064E\u0647\u064F\u060C \u0648\u064E\u0646\u064F\u0648\u0631\u064E\u0647\u064F\u060C \u0648\u064E\u0628\u064E\u0631\u064E\u0643\u064E\u062A\u064E\u0647\u064F\u060C \u0648\u064E\u0647\u064F\u062F\u064E\u0627\u0647\u064F\u060C \u0648\u064E\u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0643\u064E \u0645\u0650\u0646\u0652 \u0634\u064E\u0631\u0650\u0651 \u0645\u064E\u0627 \u0641\u0650\u064A\u0647\u0650 \u0648\u064E\u0634\u064E\u0631\u0650\u0651 \u0645\u064E\u0627 \u0628\u064E\u0639\u0652\u062F\u064E\u0647\u064F",
    translation: "S\u0259h\u0259r\u0259 \xE7\u0131xd\u0131q v\u0259 m\xFClk d\u0259 al\u0259ml\u0259rin R\u0259bbi Allaha m\u0259xsus olaraq s\u0259h\u0259r\u0259 \xE7\u0131xd\u0131. Allah\u0131m! S\u0259nd\u0259n bu g\xFCn\xFCn xeyrini \u2014 f\u0259thini, z\u0259f\u0259rini, nurunu, b\u0259r\u0259k\u0259tini v\u0259 hiday\u0259tini dil\u0259yir\u0259m. Bu g\xFCnd\u0259 v\u0259 bundan sonrak\u0131 g\xFCnl\u0259rd\u0259 olan \u015F\u0259rd\u0259n S\u0259n\u0259 s\u0131\u011F\u0131n\u0131ram!",
    targetCount: 1,
    countNote: "1 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#89) \xB7 \u018Fbu Davud (4/322)",
    virtue: "G\xFCn\xFCn b\u0259r\u0259k\u0259t, nur v\u0259 hiday\u0259t i\xE7ind\u0259 ke\xE7m\u0259si \xFC\xE7\xFCn s\u0259h\u0259rl\u0259r oxunur."
  },
  // 15b. Gecənin Fəthi, Nuru və Bərəkəti — Axşam (Müsəlman Qalası, #89)
  {
    id: "axsam-feth-nur",
    category: "axsam",
    timeLabel: "Ax\u015Fam zikri",
    title: "Ax\u015Fam \u2014 Gec\u0259nin F\u0259thi, Nuru, B\u0259r\u0259k\u0259ti v\u0259 Hiday\u0259ti \u0130st\u0259yi",
    arabicText: "\u0623\u064E\u0645\u0652\u0633\u064E\u064A\u0652\u0646\u064E\u0627 \u0648\u064E\u0623\u064E\u0645\u0652\u0633\u064E\u0649 \u0627\u0644\u0652\u0645\u064F\u0644\u0652\u0643\u064F \u0644\u0650\u0644\u064E\u0651\u0647\u0650 \u0631\u064E\u0628\u0650\u0651 \u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E\u060C \u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0625\u0650\u0646\u0650\u0651\u064A \u0623\u064E\u0633\u0652\u0623\u064E\u0644\u064F\u0643\u064E \u062E\u064E\u064A\u0652\u0631\u064E \u0647\u064E\u0670\u0630\u0650\u0647\u0650 \u0627\u0644\u0644\u064E\u0651\u064A\u0652\u0644\u064E\u0629\u0650: \u0641\u064E\u062A\u0652\u062D\u064E\u0647\u064E\u0627\u060C \u0648\u064E\u0646\u064E\u0635\u0652\u0631\u064E\u0647\u064E\u0627\u060C \u0648\u064E\u0646\u064F\u0648\u0631\u064E\u0647\u064E\u0627\u060C \u0648\u064E\u0628\u064E\u0631\u064E\u0643\u064E\u062A\u064E\u0647\u064E\u0627\u060C \u0648\u064E\u0647\u064F\u062F\u064E\u0627\u0647\u064E\u0627\u060C \u0648\u064E\u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0643\u064E \u0645\u0650\u0646\u0652 \u0634\u064E\u0631\u0650\u0651 \u0645\u064E\u0627 \u0641\u0650\u064A\u0647\u064E\u0627 \u0648\u064E\u0634\u064E\u0631\u0650\u0651 \u0645\u064E\u0627 \u0628\u064E\u0639\u0652\u062F\u064E\u0647\u064E\u0627",
    translation: "Ax\u015Fama \xE7\u0131xd\u0131q v\u0259 m\xFClk d\u0259 al\u0259ml\u0259rin R\u0259bbi Allaha m\u0259xsus olaraq ax\u015Fama \xE7\u0131xd\u0131. Allah\u0131m! S\u0259nd\u0259n bu gec\u0259nin xeyrini \u2014 f\u0259thini, z\u0259f\u0259rini, nurunu, b\u0259r\u0259k\u0259tini v\u0259 hiday\u0259tini dil\u0259yir\u0259m. Bu gec\u0259d\u0259 v\u0259 bundan sonrak\u0131 gec\u0259l\u0259rd\u0259 olan \u015F\u0259rd\u0259n S\u0259n\u0259 s\u0131\u011F\u0131n\u0131ram!",
    targetCount: 1,
    countNote: "1 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#89) \xB7 \u018Fbu Davud (4/322)",
    virtue: "Gec\u0259nin xeyir, nur v\u0259 \u0259min-amanl\u0131q i\xE7ind\u0259 ke\xE7m\u0259si \xFC\xE7\xFCn ax\u015Famlar oxunur."
  },
  // 16a. İslam Fitrəti Üzrə — Səhər (Müsəlman Qalası, #90)
  {
    id: "seher-fitret",
    category: "seher",
    timeLabel: "S\u0259h\u0259r zikri",
    title: "S\u0259h\u0259r \u2014 \u0130slam Fitr\u0259ti v\u0259 \u0130xlas K\u0259lm\u0259si \xDCz\u0259r\u0259 \xC7\u0131xmaq",
    arabicText: "\u0623\u064E\u0635\u0652\u0628\u064E\u062D\u0652\u0646\u064E\u0627 \u0639\u064E\u0644\u064E\u0649\u0670 \u0641\u0650\u0637\u0652\u0631\u064E\u0629\u0650 \u0627\u0644\u0652\u0625\u0650\u0633\u0652\u0644\u064E\u0627\u0645\u0650\u060C \u0648\u064E\u0639\u064E\u0644\u064E\u0649\u0670 \u0643\u064E\u0644\u0650\u0645\u064E\u0629\u0650 \u0627\u0644\u0652\u0625\u0650\u062E\u0652\u0644\u064E\u0627\u0635\u0650\u060C \u0648\u064E\u0639\u064E\u0644\u064E\u0649\u0670 \u062F\u0650\u064A\u0646\u0650 \u0646\u064E\u0628\u0650\u064A\u0650\u0651\u0646\u064E\u0627 \u0645\u064F\u062D\u064E\u0645\u064E\u0651\u062F\u064D \u0635\u064E\u0644\u064E\u0651\u0649 \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650 \u0648\u064E\u0633\u064E\u0644\u064E\u0651\u0645\u064E\u060C \u0648\u064E\u0639\u064E\u0644\u064E\u0649\u0670 \u0645\u0650\u0644\u064E\u0651\u0629\u0650 \u0623\u064E\u0628\u0650\u064A\u0646\u064E\u0627 \u0625\u0650\u0628\u0652\u0631\u064E\u0627\u0647\u0650\u064A\u0645\u064E \u062D\u064E\u0646\u0650\u064A\u0641\u064B\u0627 \u0645\u064F\u0633\u0652\u0644\u0650\u0645\u064B\u0627 \u0648\u064E\u0645\u064E\u0627 \u0643\u064E\u0627\u0646\u064E \u0645\u0650\u0646\u064E \u0627\u0644\u0652\u0645\u064F\u0634\u0652\u0631\u0650\u0643\u0650\u064A\u0646\u064E",
    translation: "\u0130slam fitr\u0259ti, ixlas k\u0259lm\u0259si (L\u0259 ilah\u0259 ill\u0259llah), Pey\u011F\u0259mb\u0259rimiz Muh\u0259mm\u0259din (s.a.s.) dini v\u0259 h\u0259nif, m\xFCs\u0259lman olan, m\xFC\u015Frikl\u0259rd\u0259n olmayan atam\u0131z \u0130brahimin mill\u0259ti \xFCz\u0259r\u0259 s\u0259h\u0259r\u0259 \xE7\u0131xd\u0131q!",
    targetCount: 1,
    countNote: "1 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#90) \xB7 \u018Fhm\u0259d (3/406)",
    virtue: "T\xF6vhid v\u0259 fitr\u0259t \xFCz\u0259r\u0259 sabit qalmaq \xFC\xE7\xFCn s\u0259h\u0259rl\u0259r oxunur."
  },
  // 16b. İslam Fitrəti Üzrə — Axşam (Müsəlman Qalası, #90)
  {
    id: "axsam-fitret",
    category: "axsam",
    timeLabel: "Ax\u015Fam zikri",
    title: "Ax\u015Fam \u2014 \u0130slam Fitr\u0259ti v\u0259 \u0130xlas K\u0259lm\u0259si \xDCz\u0259r\u0259 \xC7\u0131xmaq",
    arabicText: "\u0623\u064E\u0645\u0652\u0633\u064E\u064A\u0652\u0646\u064E\u0627 \u0639\u064E\u0644\u064E\u0649\u0670 \u0641\u0650\u0637\u0652\u0631\u064E\u0629\u0650 \u0627\u0644\u0652\u0625\u0650\u0633\u0652\u0644\u064E\u0627\u0645\u0650\u060C \u0648\u064E\u0639\u064E\u0644\u064E\u0649\u0670 \u0643\u064E\u0644\u0650\u0645\u064E\u0629\u0650 \u0627\u0644\u0652\u0625\u0650\u062E\u0652\u0644\u064E\u0627\u0635\u0650\u060C \u0648\u064E\u0639\u064E\u0644\u064E\u0649\u0670 \u062F\u0650\u064A\u0646\u0650 \u0646\u064E\u0628\u0650\u064A\u0650\u0651\u0646\u064E\u0627 \u0645\u064F\u062D\u064E\u0645\u064E\u0651\u062F\u064D \u0635\u064E\u0644\u064E\u0651\u0649 \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650 \u0648\u064E\u0633\u064E\u0644\u064E\u0651\u0645\u064E\u060C \u0648\u064E\u0639\u064E\u0644\u064E\u0649\u0670 \u0645\u0650\u0644\u064E\u0651\u0629\u0650 \u0623\u064E\u0628\u0650\u064A\u0646\u064E\u0627 \u0625\u0650\u0628\u0652\u0631\u064E\u0627\u0647\u0650\u064A\u0645\u064E \u062D\u064E\u0646\u0650\u064A\u0641\u064B\u0627 \u0645\u064F\u0633\u0652\u0644\u0650\u0645\u064B\u0627 \u0648\u064E\u0645\u064E\u0627 \u0643\u064E\u0627\u0646\u064E \u0645\u0650\u0646\u064E \u0627\u0644\u0652\u0645\u064F\u0634\u0652\u0631\u0650\u0643\u0650\u064A\u0646\u064E",
    translation: "\u0130slam fitr\u0259ti, ixlas k\u0259lm\u0259si (L\u0259 ilah\u0259 ill\u0259llah), Pey\u011F\u0259mb\u0259rimiz Muh\u0259mm\u0259din (s.a.s.) dini v\u0259 h\u0259nif, m\xFCs\u0259lman olan, m\xFC\u015Frikl\u0259rd\u0259n olmayan atam\u0131z \u0130brahimin mill\u0259ti \xFCz\u0259r\u0259 ax\u015Fama \xE7\u0131xd\u0131q!",
    targetCount: 1,
    countNote: "1 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#90) \xB7 \u018Fhm\u0259d (3/406)",
    virtue: "T\xF6vhid v\u0259 fitr\u0259t \xFCz\u0259r\u0259 sabit qalmaq \xFC\xE7\xFCn ax\u015Famlar oxunur."
  },
  // 17. Sübhanəllahi və bihəmdihi — Ədədə xalqihi (Müsəlman Qalası, #93 - Səhər)
  {
    id: "subhanallahi-adede-xalqihi",
    category: "seher",
    timeLabel: "S\u0259h\u0259r zikri",
    title: "M\u0259xluqat\u0131n Say\u0131 v\u0259 \u018Fr\u015Fin A\u011F\u0131rl\u0131\u011F\u0131 Q\u0259d\u0259r T\u0259sbih v\u0259 H\u0259md",
    arabicText: "\u0633\u064F\u0628\u0652\u062D\u064E\u0627\u0646\u064E \u0627\u0644\u0644\u064E\u0651\u0647\u0650 \u0648\u064E\u0628\u0650\u062D\u064E\u0645\u0652\u062F\u0650\u0647\u0650: \u0639\u064E\u062F\u064E\u062F\u064E \u062E\u064E\u0644\u0652\u0642\u0650\u0647\u0650\u060C \u0648\u064E\u0631\u0650\u0636\u064E\u0627 \u0646\u064E\u0641\u0652\u0633\u0650\u0647\u0650\u060C \u0648\u064E\u0632\u0650\u0646\u064E\u0629\u064E \u0639\u064E\u0631\u0652\u0634\u0650\u0647\u0650\u060C \u0648\u064E\u0645\u0650\u062F\u064E\u0627\u062F\u064E \u0643\u064E\u0644\u0650\u0645\u064E\u0627\u062A\u0650\u0647\u0650",
    translation: "Allah pak v\u0259 n\xF6qsans\u0131zd\u0131r! Yarad\u0131lm\u0131\u015Flar\u0131n\u0131n say\u0131, \xD6z\xFCn\xFCn raz\u0131 qald\u0131\u011F\u0131, \u018Fr\u015Finin a\u011F\u0131rl\u0131\u011F\u0131 v\u0259 k\u0259lm\u0259l\u0259rinin t\xFCk\u0259nm\u0259zliyi q\u0259d\u0259r Ona h\u0259md olsun!",
    targetCount: 3,
    countNote: "3 d\u0259f\u0259 (s\u0259h\u0259r)",
    source: "M\xFCs\u0259lman Qalas\u0131 (#93) \xB7 S\u0259hih M\xFCslim (4/2090)",
    virtue: "S\xFCbh namaz\u0131ndan sonra \xFC\xE7 d\u0259f\u0259 oxunmas\u0131 saatlarla zikr etm\u0259y\u0259 b\u0259rab\u0259r savab qazand\u0131rar."
  },
  // 18. Faydalı elm, halal ruzi, məqbul əməl (Müsəlman Qalası, #94 - Səhər)
  {
    id: "seher-elm-ruzi",
    category: "seher",
    timeLabel: "S\u0259h\u0259r zikri",
    title: "Faydal\u0131 Elm, Halal Ruzi v\u0259 M\u0259qbul \u018Fm\u0259l \u0130st\u0259yi",
    arabicText: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0625\u0650\u0646\u0650\u0651\u064A \u0623\u064E\u0633\u0652\u0623\u064E\u0644\u064F\u0643\u064E \u0639\u0650\u0644\u0652\u0645\u064B\u0627 \u0646\u064E\u0627\u0641\u0650\u0639\u064B\u0627\u060C \u0648\u064E\u0631\u0650\u0632\u0652\u0642\u064B\u0627 \u0637\u064E\u064A\u0650\u0651\u0628\u064B\u0627\u060C \u0648\u064E\u0639\u064E\u0645\u064E\u0644\u064B\u0627 \u0645\u064F\u062A\u064E\u0642\u064E\u0628\u064E\u0651\u0644\u064B\u0627",
    translation: "Allah\u0131m! S\u0259nd\u0259n faydal\u0131 elm, t\u0259miz (halal) ruzi v\u0259 d\u0259rgah\u0131nda q\u0259bul olunan \u0259m\u0259l dil\u0259yir\u0259m!",
    targetCount: 1,
    countNote: "1 d\u0259f\u0259 (s\u0259h\u0259r)",
    source: "M\xFCs\u0259lman Qalas\u0131 (#94) \xB7 \u0130bn Mac\u0259 (925)",
    virtue: "Pey\u011F\u0259mb\u0259rimiz (s.a.s.) h\u0259r g\xFCn S\xFCbh namaz\u0131n\u0131n salam\u0131ndan sonra bu duan\u0131 oxuyard\u0131."
  },
  // 19. Axşam — Allahın tam kəlmələrinə sığınmaq (Müsəlman Qalası, #96 - Axşam)
  {
    id: "axsam-kelimeler",
    category: "axsam",
    timeLabel: "Ax\u015Fam zikri",
    title: "Allah\u0131n Tam K\u0259lm\u0259l\u0259rin\u0259 S\u0131\u011F\u0131nmaq",
    arabicText: "\u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0643\u064E\u0644\u0650\u0645\u064E\u0627\u062A\u0650 \u0627\u0644\u0644\u064E\u0651\u0647\u0650 \u0627\u0644\u062A\u064E\u0651\u0627\u0645\u064E\u0651\u0627\u062A\u0650 \u0645\u0650\u0646\u0652 \u0634\u064E\u0631\u0650\u0651 \u0645\u064E\u0627 \u062E\u064E\u0644\u064E\u0642\u064E",
    translation: "Yaratd\u0131qlar\u0131n\u0131n \u015F\u0259rind\u0259n Allah\u0131n tam (kamil) k\u0259lm\u0259l\u0259rin\u0259 s\u0131\u011F\u0131n\u0131ram.",
    targetCount: 3,
    countNote: "3 d\u0259f\u0259 (ax\u015Fam)",
    source: "M\xFCs\u0259lman Qalas\u0131 (#96) \xB7 S\u0259hih M\xFCslim (2709), \u018Fhm\u0259d (2/290)",
    virtue: "Ax\u015Famlar 3 d\u0259f\u0259 oxuyan h\u0259min gec\u0259 z\u0259r\u0259rvericil\u0259rin v\u0259 \u015F\u0259rrin toxunmas\u0131ndan qorunar."
  },
  // 20. Sübhanəllahi və bihəmdihi (Müsəlman Qalası, #91)
  {
    id: "subhanallahi-ve-bihamdihi",
    category: "seher",
    categories: ["seher", "axsam", "umumi"],
    timeLabel: "S\u0259h\u0259r v\u0259 ax\u015Fam",
    title: "S\xFCbhan\u0259llahi v\u0259 Bih\u0259mdihi (G\xFCnahlar\u0131n Ba\u011F\u0131\u015Flanmas\u0131)",
    arabicText: "\u0633\u064F\u0628\u0652\u062D\u064E\u0627\u0646\u064E \u0627\u0644\u0644\u064E\u0651\u0647\u0650 \u0648\u064E\u0628\u0650\u062D\u064E\u0645\u0652\u062F\u0650\u0647\u0650",
    translation: "Allah pak v\u0259 n\xF6qsans\u0131zd\u0131r v\u0259 Ona h\u0259md olsun!",
    targetCount: 100,
    countNote: "100 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#91) \xB7 S\u0259hih M\xFCslim (4/2071)",
    virtue: "S\u0259h\u0259r v\u0259 ax\u015Fam y\xFCz d\u0259f\u0259 oxuyan\u0131n g\xFCnahlar\u0131 d\u0259niz k\xF6p\xFCy\xFC q\u0259d\u0259r olsa bel\u0259 ba\u011F\u0131\u015Flanar; Qiyam\u0259t g\xFCn\xFC ondan daha f\u0259zil\u0259tli \u0259m\u0259l g\u0259tir\u0259n olmaz."
  },
  // 21. Lə ilahə illəllahu vəhdəhu... (Müsəlman Qalası, #92)
  {
    id: "tahlil-tevhid-zikri",
    category: "seher",
    categories: ["seher", "axsam", "umumi"],
    timeLabel: "S\u0259h\u0259r v\u0259 ax\u015Fam",
    title: "T\xF6vhid K\u0259lm\u0259si (10 Qul Azad Etm\u0259k Savab\u0131)",
    arabicText: "\u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064E \u0625\u0650\u0644\u064E\u0651\u0627 \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0648\u064E\u062D\u0652\u062F\u064E\u0647\u064F \u0644\u064E\u0627 \u0634\u064E\u0631\u0650\u064A\u0643\u064E \u0644\u064E\u0647\u064F\u060C \u0644\u064E\u0647\u064F \u0627\u0644\u0652\u0645\u064F\u0644\u0652\u0643\u064F \u0648\u064E\u0644\u064E\u0647\u064F \u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F\u060C \u0648\u064E\u0647\u064F\u0648\u064E \u0639\u064E\u0644\u064E\u0649\u0670 \u0643\u064F\u0644\u0650\u0651 \u0634\u064E\u064A\u0652\u0621\u064D \u0642\u064E\u062F\u0650\u064A\u0631\u064C",
    translation: "T\u0259k olan Allahdan ba\u015Fqa haqq m\u0259bud yoxdur, Onun \u015F\u0259riki yoxdur. M\xFClk d\u0259 Onundur, h\u0259md d\u0259 Onundur v\u0259 O, h\u0259r \u015Fey\u0259 qadirdir.",
    targetCount: 10,
    countNote: "10 d\u0259f\u0259 (yaxud s\u0259h\u0259r 100 d\u0259f\u0259; t\u0259nb\u0259llikd\u0259 1 d\u0259f\u0259)",
    source: "M\xFCs\u0259lman Qalas\u0131 (#92) \xB7 Buxari (4/95), M\xFCslim (4/2071), \u018Fbu Davud (4/319)",
    virtue: "On d\u0259f\u0259 dey\u0259n\u0259 100 savab yaz\u0131lar, 100 g\xFCnah\u0131 silin\u0259r v\u0259 ax\u015Fama q\u0259d\u0259r \u015Feytandan qoruyucu olar."
  },
  // 22. Əstəğfirullahə və ətubu ileyh (Müsəlman Qalası, #95)
  {
    id: "istighfar-ve-tevbe",
    category: "seher",
    categories: ["seher", "axsam", "umumi"],
    timeLabel: "S\u0259h\u0259r v\u0259 g\xFCn \u0259rzind\u0259",
    title: "\u0130sti\u011Ffar v\u0259 Allaha T\xF6vb\u0259 Zikri",
    arabicText: "\u0623\u064E\u0633\u0652\u062A\u064E\u063A\u0652\u0641\u0650\u0631\u064F \u0627\u0644\u0644\u064E\u0651\u0647\u064E \u0648\u064E\u0623\u064E\u062A\u064F\u0648\u0628\u064F \u0625\u0650\u0644\u064E\u064A\u0652\u0647\u0650",
    translation: "Allahdan ba\u011F\u0131\u015Flanma dil\u0259yir\u0259m v\u0259 Ona t\xF6vb\u0259 edir\u0259m.",
    targetCount: 100,
    countNote: "100 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#95) \xB7 Buxari (7/101), M\xFCslim (4/2075)",
    virtue: "Pey\u011F\u0259mb\u0259rimiz (s.a.s.) g\xFCnd\u0259 yetmi\u015Fd\u0259n / y\xFCz d\u0259f\u0259d\u0259n \xE7ox Allahdan ba\u011F\u0131\u015Flanma dil\u0259y\u0259r\u0259k t\xF6vb\u0259 ed\u0259rdi."
  },
  // 23. Peyğəmbərə (s.a.s.) Salavat (Müsəlman Qalası, #97)
  {
    id: "seher-axsam-salavat",
    category: "seher",
    categories: ["seher", "axsam", "umumi"],
    timeLabel: "S\u0259h\u0259r v\u0259 ax\u015Fam",
    title: "Pey\u011F\u0259mb\u0259rimiz\u0259 (s.a.s.) Salavat",
    arabicText: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0635\u064E\u0644\u0650\u0651 \u0648\u064E\u0633\u064E\u0644\u0650\u0651\u0645\u0652 \u0639\u064E\u0644\u064E\u0649\u0670 \u0646\u064E\u0628\u0650\u064A\u0650\u0651\u0646\u064E\u0627 \u0645\u064F\u062D\u064E\u0645\u064E\u0651\u062F\u064D",
    translation: "Allah\u0131m! Pey\u011F\u0259mb\u0259rimiz Muh\u0259mm\u0259d\u0259 salavat v\u0259 salam g\xF6nd\u0259r!",
    targetCount: 10,
    countNote: "10 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#97) \xB7 T\u0259b\u0259rani",
    virtue: "Kim s\u0259h\u0259r v\u0259 ax\u015Fam on d\u0259f\u0259 salavat g\u0259tir\u0259rs\u0259, Qiyam\u0259t g\xFCn\xFC Pey\u011F\u0259mb\u0259rimizin (s.a.s.) \u015F\u0259fa\u0259tin\u0259 nail olar."
  },
  // Namaz sonrası zikrlər
  {
    id: "namaz-salam-zikri",
    category: "namaz",
    timeLabel: "Namaz sonras\u0131",
    title: "Salamdan D\u0259rhal Sonra Oxunan Zikr",
    arabicText: "\u0623\u064E\u0633\u0652\u062A\u064E\u063A\u0652\u0641\u0650\u0631\u064F \u0627\u0644\u0644\u064E\u0651\u0647\u064E\u060C \u0623\u064E\u0633\u0652\u062A\u064E\u063A\u0652\u0641\u0650\u0631\u064F \u0627\u0644\u0644\u064E\u0651\u0647\u064E\u060C \u0623\u064E\u0633\u0652\u062A\u064E\u063A\u0652\u0641\u0650\u0631\u064F \u0627\u0644\u0644\u064E\u0651\u0647\u064E\u060C \u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0623\u064E\u0646\u0652\u062A\u064E \u0627\u0644\u0633\u064E\u0651\u0644\u064E\u0627\u0645\u064F \u0648\u064E\u0645\u0650\u0646\u0652\u0643\u064E \u0627\u0644\u0633\u064E\u0651\u0644\u064E\u0627\u0645\u064F \u062A\u064E\u0628\u064E\u0627\u0631\u064E\u0643\u0652\u062A\u064E \u064A\u064E\u0627 \u0630\u064E\u0627 \u0627\u0644\u0652\u062C\u064E\u0644\u064E\u0627\u0644\u0650 \u0648\u064E\u0627\u0644\u0652\u0625\u0650\u0643\u0652\u0631\u064E\u0627\u0645\u0650",
    translation: "Allahdan ba\u011F\u0131\u015Flanma dil\u0259yir\u0259m (3 d\u0259f\u0259). Allah\u0131m! S\u0259n S\u0259lamsan (\u0259min-amanl\u0131q m\u0259nb\u0259yis\u0259n) v\u0259 \u0259min-amanl\u0131q yaln\u0131z S\u0259nd\u0259ndir. Ey \u0259z\u0259m\u0259t v\u0259 ikram sahibi, S\u0259n n\u0259 q\u0259d\u0259r uca v\u0259 b\u0259r\u0259k\u0259tlis\u0259n!",
    targetCount: 1,
    countNote: "1 d\u0259f\u0259 (3\xD7 \u018Fst\u0259\u011Ffirullah + dua)",
    source: "M\xFCs\u0259lman Qalas\u0131 (#66) \xB7 S\u0259hih M\xFCslim (591)",
    virtue: "H\u0259r f\u0259rz namaz\u0131ndan salam verdikd\u0259n sonra d\u0259rhal oxunur."
  },
  {
    id: "namaz-ibadet-duasi",
    category: "namaz",
    timeLabel: "Namaz sonras\u0131",
    title: "Zikr, \u015E\xFCk\xFCr v\u0259 G\xF6z\u0259l \u0130bad\u0259t \u0130st\u0259yi",
    arabicText: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F\u0645\u064E\u0651 \u0623\u064E\u0639\u0650\u0646\u0650\u0651\u064A \u0639\u064E\u0644\u064E\u0649\u0670 \u0630\u0650\u0643\u0652\u0631\u0650\u0643\u064E \u0648\u064E\u0634\u064F\u0643\u0652\u0631\u0650\u0643\u064E \u0648\u064E\u062D\u064F\u0633\u0652\u0646\u0650 \u0639\u0650\u0628\u064E\u0627\u062F\u064E\u062A\u0650\u0643\u064E",
    translation: "Allah\u0131m! S\u0259ni zikr etm\u0259kd\u0259, S\u0259n\u0259 \u015F\xFCk\xFCr etm\u0259kd\u0259 v\u0259 S\u0259n\u0259 g\xF6z\u0259l \u015F\u0259kild\u0259 ibad\u0259t etm\u0259kd\u0259 m\u0259n\u0259 k\xF6m\u0259k ol!",
    targetCount: 1,
    countNote: "1 d\u0259f\u0259",
    source: "M\xFCs\u0259lman Qalas\u0131 (#74) \xB7 \u018Fbu Davud (1522), N\u0259sai (1303)",
    virtue: "Pey\u011F\u0259mb\u0259rimizin (s.a.s.) h\u0259r namazdan sonra t\u0259rk etm\u0259m\u0259yi t\xF6vsiy\u0259 etdiyi dua."
  },
  // Gündəlik fəzilət zikrləri
  {
    id: "subhanallahil-azim-mizan",
    category: "umumi",
    timeLabel: "G\xFCnd\u0259lik f\u0259zil\u0259t",
    title: "Dild\u0259 Y\xFCng\xFCl, T\u0259r\u0259zid\u0259 A\u011F\u0131r Zikr",
    arabicText: "\u0633\u064F\u0628\u0652\u062D\u064E\u0627\u0646\u064E \u0627\u0644\u0644\u064E\u0651\u0647\u0650 \u0648\u064E\u0628\u0650\u062D\u064E\u0645\u0652\u062F\u0650\u0647\u0650\u060C \u0633\u064F\u0628\u0652\u062D\u064E\u0627\u0646\u064E \u0627\u0644\u0644\u064E\u0651\u0647\u0650 \u0627\u0644\u0652\u0639\u064E\u0638\u0650\u064A\u0645\u0650",
    translation: "Allah pak v\u0259 n\xF6qsans\u0131zd\u0131r v\u0259 Ona h\u0259md olsun! Uca Allah pak v\u0259 n\xF6qsans\u0131zd\u0131r!",
    targetCount: 33,
    countNote: "G\xFCnd\u0259lik \xE7oxlu zikr",
    source: "S\u0259hih \u0259l-Buxari (6406), S\u0259hih M\xFCslim (2694)",
    virtue: "R\u0259hmana sevimli, dild\u0259 y\xFCng\xFCl, Mizan t\u0259r\u0259zisind\u0259 is\u0259 \xE7ox a\u011F\u0131r olan iki k\u0259lm\u0259dir."
  },
  {
    id: "la-hawla",
    category: "umumi",
    timeLabel: "G\xFCnd\u0259lik f\u0259zil\u0259t",
    title: "C\u0259nn\u0259t X\u0259zin\u0259l\u0259rind\u0259n Biri",
    arabicText: "\u0644\u064E\u0627 \u062D\u064E\u0648\u0652\u0644\u064E \u0648\u064E\u0644\u064E\u0627 \u0642\u064F\u0648\u064E\u0651\u0629\u064E \u0625\u0650\u0644\u064E\u0651\u0627 \u0628\u0650\u0627\u0644\u0644\u064E\u0651\u0647\u0650",
    translation: "G\xFCc v\u0259 q\xFCvv\u0259t yaln\u0131z Allah\u0131n k\xF6m\u0259yi il\u0259dir.",
    targetCount: 33,
    countNote: "G\xFCnd\u0259lik zikr",
    source: "S\u0259hih \u0259l-Buxari (4205), S\u0259hih M\xFCslim (2704)",
    virtue: "\xC7\u0259tinlik anlar\u0131nda acizliyi etiraf ed\u0259r\u0259k Allahdan g\xFCc ist\u0259m\u0259k \xFC\xE7\xFCn oxunur."
  }
];

// src/lib/prayerTimes.ts
var BAKU_UTC_OFFSET_HOURS = 4;
var KAABA_LAT = 21.422487;
var KAABA_LNG = 39.826206;
var WORLD_PRAYER_CITIES = [
  // Azərbaycan
  { id: "baku", countryId: "az", countryName: "Az\u0259rbaycan", name: "Bak\u0131", regionLabel: "Paytaxt", lat: 40.4093, lng: 49.8671, timeZone: "Asia/Baku" },
  { id: "sumqayit", countryId: "az", countryName: "Az\u0259rbaycan", name: "Sumqay\u0131t", regionLabel: "Ab\u015Feron", lat: 40.5855, lng: 49.6317, timeZone: "Asia/Baku" },
  { id: "ganja", countryId: "az", countryName: "Az\u0259rbaycan", name: "G\u0259nc\u0259", regionLabel: "Q\u0259rb regionu", lat: 40.6828, lng: 46.3606, timeZone: "Asia/Baku" },
  { id: "mingachevir", countryId: "az", countryName: "Az\u0259rbaycan", name: "Ming\u0259\xE7evir", regionLabel: "M\u0259rk\u0259zi Aran", lat: 40.7639, lng: 47.0595, timeZone: "Asia/Baku" },
  { id: "shaki", countryId: "az", countryName: "Az\u0259rbaycan", name: "\u015E\u0259ki", regionLabel: "\u015Eimal-Q\u0259rb", lat: 41.1919, lng: 47.1706, timeZone: "Asia/Baku" },
  { id: "shamakhi", countryId: "az", countryName: "Az\u0259rbaycan", name: "\u015Eamax\u0131", regionLabel: "Da\u011Fl\u0131q \u015Eirvan", lat: 40.6314, lng: 48.6414, timeZone: "Asia/Baku" },
  { id: "quba", countryId: "az", countryName: "Az\u0259rbaycan", name: "Quba", regionLabel: "\u015Eimal", lat: 41.3611, lng: 48.5134, timeZone: "Asia/Baku" },
  { id: "lankaran", countryId: "az", countryName: "Az\u0259rbaycan", name: "L\u0259nk\u0259ran", regionLabel: "C\u0259nub", lat: 38.7543, lng: 48.8506, timeZone: "Asia/Baku" },
  { id: "nakhchivan", countryId: "az", countryName: "Az\u0259rbaycan", name: "Nax\xE7\u0131van", regionLabel: "Muxtar Respublika", lat: 39.2089, lng: 45.4122, timeZone: "Asia/Baku" },
  { id: "shusha", countryId: "az", countryName: "Az\u0259rbaycan", name: "\u015Eu\u015Fa", regionLabel: "Qaraba\u011F", lat: 39.7576, lng: 46.7499, timeZone: "Asia/Baku" },
  // Türkiyə
  { id: "istanbul", countryId: "tr", countryName: "T\xFCrkiy\u0259", name: "\u0130stanbul", regionLabel: "M\u0259rm\u0259r\u0259", lat: 41.0082, lng: 28.9784, timeZone: "Europe/Istanbul" },
  { id: "ankara", countryId: "tr", countryName: "T\xFCrkiy\u0259", name: "Ankara", regionLabel: "Paytaxt", lat: 39.9334, lng: 32.8597, timeZone: "Europe/Istanbul" },
  { id: "izmir", countryId: "tr", countryName: "T\xFCrkiy\u0259", name: "\u0130zmir", regionLabel: "Ege", lat: 38.4237, lng: 27.1428, timeZone: "Europe/Istanbul" },
  { id: "bursa", countryId: "tr", countryName: "T\xFCrkiy\u0259", name: "Bursa", regionLabel: "M\u0259rm\u0259r\u0259", lat: 40.1885, lng: 29.061, timeZone: "Europe/Istanbul" },
  { id: "konya", countryId: "tr", countryName: "T\xFCrkiy\u0259", name: "Konya", regionLabel: "\u0130\xE7 Anadolu", lat: 37.8746, lng: 32.4932, timeZone: "Europe/Istanbul" },
  { id: "erzurum", countryId: "tr", countryName: "T\xFCrkiy\u0259", name: "\u018Frzurum", regionLabel: "\u015E\u0259rqi Anadolu", lat: 39.9043, lng: 41.2679, timeZone: "Europe/Istanbul" },
  { id: "trabzon", countryId: "tr", countryName: "T\xFCrkiy\u0259", name: "Trabzon", regionLabel: "Qara d\u0259niz", lat: 41.0027, lng: 39.7168, timeZone: "Europe/Istanbul" },
  // Səudiyyə Ərəbistanı
  { id: "makkah", countryId: "sa", countryName: "S\u0259udiyy\u0259 \u018Fr\u0259bistan\u0131", name: "M\u0259kk\u0259", regionLabel: "Hicaz", lat: 21.3891, lng: 39.8579, timeZone: "Asia/Riyadh" },
  { id: "madinah", countryId: "sa", countryName: "S\u0259udiyy\u0259 \u018Fr\u0259bistan\u0131", name: "M\u0259din\u0259", regionLabel: "Hicaz", lat: 24.5247, lng: 39.5692, timeZone: "Asia/Riyadh" },
  { id: "riyadh", countryId: "sa", countryName: "S\u0259udiyy\u0259 \u018Fr\u0259bistan\u0131", name: "Riyad", regionLabel: "Paytaxt", lat: 24.7136, lng: 46.6753, timeZone: "Asia/Riyadh" },
  { id: "jeddah", countryId: "sa", countryName: "S\u0259udiyy\u0259 \u018Fr\u0259bistan\u0131", name: "Cidd\u0259", regionLabel: "Q\u0131rm\u0131z\u0131 d\u0259niz", lat: 21.4858, lng: 39.1925, timeZone: "Asia/Riyadh" },
  // BƏƏ & Qətər
  { id: "dubai", countryId: "ae", countryName: "B\u018F\u018F", name: "Dubay", regionLabel: "\u018Fmirlik", lat: 25.2048, lng: 55.2708, timeZone: "Asia/Dubai" },
  { id: "abudhabi", countryId: "ae", countryName: "B\u018F\u018F", name: "\u018Fbu-Dabi", regionLabel: "Paytaxt", lat: 24.4539, lng: 54.3773, timeZone: "Asia/Dubai" },
  { id: "doha", countryId: "qa", countryName: "Q\u0259t\u0259r", name: "Doha", regionLabel: "Paytaxt", lat: 25.2854, lng: 51.531, timeZone: "Asia/Qatar" },
  // Gürcüstan
  { id: "tbilisi", countryId: "ge", countryName: "G\xFCrc\xFCstan", name: "Tbilisi", regionLabel: "Paytaxt", lat: 41.7151, lng: 44.8271, timeZone: "Asia/Tbilisi" },
  { id: "batumi", countryId: "ge", countryName: "G\xFCrc\xFCstan", name: "Batumi", regionLabel: "Acariya", lat: 41.6168, lng: 41.6367, timeZone: "Asia/Tbilisi" },
  { id: "marneuli", countryId: "ge", countryName: "G\xFCrc\xFCstan", name: "Marneuli", regionLabel: "Kvemo-Kartli", lat: 41.4759, lng: 44.8089, timeZone: "Asia/Tbilisi" },
  // Rusiya
  { id: "moscow", countryId: "ru", countryName: "Rusiya", name: "Moskva", regionLabel: "Paytaxt", lat: 55.7558, lng: 37.6173, timeZone: "Europe/Moscow" },
  { id: "spb", countryId: "ru", countryName: "Rusiya", name: "Sankt-Peterburq", regionLabel: "\u015Eimal-Q\u0259rb", lat: 59.9343, lng: 30.3351, timeZone: "Europe/Moscow" },
  { id: "kazan", countryId: "ru", countryName: "Rusiya", name: "Kazan", regionLabel: "Tatar\u0131stan", lat: 55.8304, lng: 49.0661, timeZone: "Europe/Moscow" },
  { id: "makhachkala", countryId: "ru", countryName: "Rusiya", name: "Maha\xE7qala", regionLabel: "Da\u011F\u0131stan", lat: 42.9849, lng: 47.5047, timeZone: "Europe/Moscow" },
  // İran
  { id: "tehran", countryId: "ir", countryName: "\u0130ran", name: "Tehran", regionLabel: "Paytaxt", lat: 35.6892, lng: 51.389, timeZone: "Asia/Tehran" },
  { id: "tabriz", countryId: "ir", countryName: "\u0130ran", name: "T\u0259briz", regionLabel: "\u015E\u0259rqi Az\u0259rbaycan", lat: 38.0962, lng: 46.2738, timeZone: "Asia/Tehran" },
  { id: "ardabil", countryId: "ir", countryName: "\u0130ran", name: "\u018Frd\u0259bil", regionLabel: "\u018Frd\u0259bil", lat: 38.2498, lng: 48.2933, timeZone: "Asia/Tehran" },
  // Avropa (Almaniya, Böyük Britaniya, Fransa)
  { id: "berlin", countryId: "de", countryName: "Almaniya", name: "Berlin", regionLabel: "Paytaxt", lat: 52.52, lng: 13.405, timeZone: "Europe/Berlin" },
  { id: "munich", countryId: "de", countryName: "Almaniya", name: "M\xFCnhen", regionLabel: "Bavariya", lat: 48.1351, lng: 11.582, timeZone: "Europe/Berlin" },
  { id: "frankfurt", countryId: "de", countryName: "Almaniya", name: "Frankfurt", regionLabel: "Hessen", lat: 50.1109, lng: 8.6821, timeZone: "Europe/Berlin" },
  { id: "cologne", countryId: "de", countryName: "Almaniya", name: "K\xF6ln", regionLabel: "NRW", lat: 50.9375, lng: 6.9603, timeZone: "Europe/Berlin" },
  { id: "london", countryId: "gb", countryName: "B\xF6y\xFCk Britaniya", name: "London", regionLabel: "Paytaxt", lat: 51.5072, lng: -0.1276, timeZone: "Europe/London" },
  { id: "birmingham", countryId: "gb", countryName: "B\xF6y\xFCk Britaniya", name: "Birmingem", regionLabel: "Midlands", lat: 52.4862, lng: -1.8904, timeZone: "Europe/London" },
  { id: "manchester", countryId: "gb", countryName: "B\xF6y\xFCk Britaniya", name: "Man\xE7ester", regionLabel: "\u015Eimal", lat: 53.4808, lng: -2.2426, timeZone: "Europe/London" },
  { id: "paris", countryId: "fr", countryName: "Fransa", name: "Paris", regionLabel: "Paytaxt", lat: 48.8566, lng: 2.3522, timeZone: "Europe/Paris" },
  { id: "lyon", countryId: "fr", countryName: "Fransa", name: "Lion", regionLabel: "Overn-Rona", lat: 45.764, lng: 4.8357, timeZone: "Europe/Paris" },
  // Şimali Amerika (ABŞ, Kanada)
  { id: "newyork", countryId: "us", countryName: "AB\u015E", name: "Nyu-York", regionLabel: "\u015E\u0259rq sahili", lat: 40.7128, lng: -74.006, timeZone: "America/New_York" },
  { id: "washington", countryId: "us", countryName: "AB\u015E", name: "Va\u015Finqton", regionLabel: "Paytaxt", lat: 38.9072, lng: -77.0369, timeZone: "America/New_York" },
  { id: "chicago", countryId: "us", countryName: "AB\u015E", name: "\xC7ikaqo", regionLabel: "M\u0259rk\u0259zi", lat: 41.8781, lng: -87.6298, timeZone: "America/Chicago" },
  { id: "losangeles", countryId: "us", countryName: "AB\u015E", name: "Los-Anceles", regionLabel: "Q\u0259rb sahili", lat: 34.0522, lng: -118.2437, timeZone: "America/Los_Angeles" },
  { id: "toronto", countryId: "ca", countryName: "Kanada", name: "Toronto", regionLabel: "Ontario", lat: 43.6532, lng: -79.3832, timeZone: "America/Toronto" },
  { id: "montreal", countryId: "ca", countryName: "Kanada", name: "Monreal", regionLabel: "Kvebek", lat: 45.5017, lng: -73.5673, timeZone: "America/Toronto" },
  // Orta Asiya, Misir, Malayziya
  { id: "astana", countryId: "kz", countryName: "Qazax\u0131stan", name: "Astana", regionLabel: "Paytaxt", lat: 51.1694, lng: 71.4491, timeZone: "Asia/Almaty" },
  { id: "almaty", countryId: "kz", countryName: "Qazax\u0131stan", name: "Almat\u0131", regionLabel: "C\u0259nub-\u015E\u0259rq", lat: 43.222, lng: 76.8512, timeZone: "Asia/Almaty" },
  { id: "tashkent", countryId: "uz", countryName: "\xD6zb\u0259kistan", name: "Da\u015Fk\u0259nd", regionLabel: "Paytaxt", lat: 41.2995, lng: 69.2401, timeZone: "Asia/Tashkent" },
  { id: "samarkand", countryId: "uz", countryName: "\xD6zb\u0259kistan", name: "S\u0259m\u0259rq\u0259nd", regionLabel: "Tarixi \u015F\u0259h\u0259r", lat: 39.6542, lng: 66.9597, timeZone: "Asia/Tashkent" },
  { id: "cairo", countryId: "eg", countryName: "Misir", name: "Qahir\u0259", regionLabel: "Paytaxt", lat: 30.0444, lng: 31.2357, timeZone: "Africa/Cairo" },
  { id: "kualalumpur", countryId: "my", countryName: "Malayziya", name: "Kuala-Lumpur", regionLabel: "Paytaxt", lat: 3.139, lng: 101.6869, timeZone: "Asia/Kuala_Lumpur" }
];
var AZERBAIJAN_CITIES = WORLD_PRAYER_CITIES.filter((c) => c.countryId === "az");
var DEG_TO_RAD = Math.PI / 180;
var RAD_TO_DEG = 180 / Math.PI;
function dsin(deg) {
  return Math.sin(deg * DEG_TO_RAD);
}
function dcos(deg) {
  return Math.cos(deg * DEG_TO_RAD);
}
function dtan(deg) {
  return Math.tan(deg * DEG_TO_RAD);
}
function darcsin(val) {
  return Math.asin(Math.max(-1, Math.min(1, val))) * RAD_TO_DEG;
}
function darccos(val) {
  return Math.acos(Math.max(-1, Math.min(1, val))) * RAD_TO_DEG;
}
function darctan2(y, x) {
  return Math.atan2(y, x) * RAD_TO_DEG;
}
function darccot(x) {
  return Math.atan(1 / x) * RAD_TO_DEG;
}
function fixAngle(deg) {
  return (deg % 360 + 360) % 360;
}
function fixHour(hours) {
  return (hours % 24 + 24) % 24;
}
function toJulianDate(year, month, day) {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
}
function computeSolarPosition(jd) {
  const d = jd - 2451545;
  const g = fixAngle(357.529 + 0.98560028 * d);
  const q = fixAngle(280.459 + 0.98564736 * d);
  const l = fixAngle(q + 1.915 * dsin(g) + 0.02 * dsin(2 * g));
  const e = 23.439 - 36e-8 * d;
  const ra = fixHour(darctan2(dcos(e) * dsin(l), dcos(l)) / 15);
  const eqTimeHours = q / 15 - ra;
  const declination = darcsin(dsin(e) * dsin(l));
  return { declination, eqTimeHours };
}
function computeSunAngleOffsetHours(jDate, dayFraction, lat, angleBelowHorizon) {
  const { declination } = computeSolarPosition(jDate + dayFraction);
  const num = -dsin(angleBelowHorizon) - dsin(declination) * dsin(lat);
  const den = dcos(declination) * dcos(lat);
  if (Math.abs(den) < 1e-6) return null;
  const ratio = num / den;
  if (Math.abs(ratio) >= 0.999) {
    return null;
  }
  return darccos(ratio) / 15;
}
function computeAsrOffsetHours(jDate, dayFraction, lat) {
  const { declination } = computeSolarPosition(jDate + dayFraction);
  const altDeg = darccot(1 + dtan(Math.abs(lat - declination)));
  return computeSunAngleOffsetHours(jDate, dayFraction, lat, -altDeg) ?? 4;
}
function formatMinutesToHHMM(totalMinutes) {
  const normalized = (Math.round(totalMinutes) % 1440 + 1440) % 1440;
  const hh = Math.floor(normalized / 60);
  const mm = normalized % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
function getTimeZoneOffsetHours(date, timeZone, fallbackOffsetHours = BAKU_UTC_OFFSET_HOURS) {
  if (!timeZone || timeZone === "SOLAR_OFFSET") {
    return fallbackOffsetHours;
  }
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    });
    const parts = formatter.formatToParts(date);
    const map = {};
    for (const p of parts) {
      if (p.type !== "literal") {
        map[p.type] = Number.parseInt(p.value, 10);
      }
    }
    const wallUtc = Date.UTC(
      map.year,
      (map.month || 1) - 1,
      map.day || 1,
      map.hour === 24 ? 0 : map.hour || 0,
      map.minute || 0,
      map.second || 0
    );
    const diffHours = (wallUtc - date.getTime()) / 36e5;
    return Math.round(diffHours * 4) / 4;
  } catch {
    return fallbackOffsetHours;
  }
}
function getCalendarPartsInTimeZone(date = /* @__PURE__ */ new Date(), timeZone = "Asia/Baku", fallbackOffsetHours = BAKU_UTC_OFFSET_HOURS) {
  const offsetHours = getTimeZoneOffsetHours(date, timeZone, fallbackOffsetHours);
  const shifted = new Date(date.getTime() + offsetHours * 3600 * 1e3);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const hours = shifted.getUTCHours();
  const minutes = shifted.getUTCMinutes();
  const seconds = shifted.getUTCSeconds();
  return {
    year,
    month,
    day,
    secondsSinceMidnight: hours * 3600 + minutes * 60 + seconds,
    dateKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    utcOffsetHours: offsetHours
  };
}
var AZ_MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "\u0130yun",
  "\u0130yul",
  "Avqust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr"
];
var AZ_WEEKDAYS = [
  "Bazar",
  "Bazar ert\u0259si",
  "\xC7\u0259r\u015F\u0259nb\u0259 ax\u015Fam\u0131",
  "\xC7\u0259r\u015F\u0259nb\u0259",
  "C\xFCm\u0259 ax\u015Fam\u0131",
  "C\xFCm\u0259",
  "\u015E\u0259nb\u0259"
];
var HIJRI_MONTHS_AZ = [
  "M\u0259h\u0259rr\u0259m",
  "S\u0259f\u0259r",
  "R\u0259bi\xFCl\u0259vv\u0259l",
  "R\u0259bi\xFClax\u0131r",
  "C\u0259madiy\u0259l\u0259vv\u0259l",
  "C\u0259madiy\u0259lax\u0131r",
  "R\u0259c\u0259b",
  "\u015Eaban",
  "Ramazan",
  "\u015E\u0259vval",
  "Z\xFClq\u0259d\u0259",
  "Z\xFClhicc\u0259"
];
function formatGregorianAzerbaijani(year, month, day) {
  const utc = new Date(Date.UTC(year, month - 1, day));
  const weekday = AZ_WEEKDAYS[utc.getUTCDay()] ?? "";
  const monthName = AZ_MONTHS[month - 1] ?? String(month);
  return `${day} ${monthName} ${year}, ${weekday}`;
}
function getHijriPartsUmmAlQura(date = /* @__PURE__ */ new Date(), timeZone = "Asia/Baku") {
  try {
    const safeTz = timeZone === "SOLAR_OFFSET" ? "UTC" : timeZone;
    const formatted = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
      timeZone: safeTz,
      day: "numeric",
      month: "numeric",
      year: "numeric"
    }).format(date);
    const match = formatted.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const m = Number.parseInt(match[1], 10);
      const d = Number.parseInt(match[2], 10);
      const y = Number.parseInt(match[3], 10);
      const mName = HIJRI_MONTHS_AZ[m - 1] ?? "";
      if (mName) {
        return { day: d, month: m, year: y, formatted: `${d} ${mName} ${y}` };
      }
    }
  } catch {
  }
  return { day: 1, month: 1, year: 1448, formatted: "Hicri t\u0259qvim" };
}
function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + dcos(lat1) * dcos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function computeQiblaDirection(lat, lng) {
  const phi1 = lat * DEG_TO_RAD;
  const phi2 = KAABA_LAT * DEG_TO_RAD;
  const dLambda = (KAABA_LNG - lng) * DEG_TO_RAD;
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const bearing = Math.round((Math.atan2(y, x) * RAD_TO_DEG % 360 + 360) % 360);
  const dirs = ["\u015Eimal", "\u015Em-\u015Eq", "\u015E\u0259rq", "C-\u015Eq", "C\u0259nub", "C-Qb", "Q\u0259rb", "\u015Em-Qb"];
  const cardinalLabel = dirs[Math.round(bearing / 45) % 8] ?? "\u015Em-\u015Eq";
  const distanceKm = Math.round(haversineDistanceKm(lat, lng, KAABA_LAT, KAABA_LNG));
  return {
    bearingDegrees: bearing,
    cardinalLabel,
    distanceKm
  };
}
function calculatePrayerTimesForDate(location, year, month, day) {
  const utcMidday = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const utcOffsetHours = getTimeZoneOffsetHours(
    utcMidday,
    location.timeZone,
    location.fallbackUtcOffsetHours ?? BAKU_UTC_OFFSET_HOURS
  );
  const hijriParts = getHijriPartsUmmAlQura(utcMidday, location.timeZone);
  const isRamadan = hijriParts.month === 9;
  const ishaOffsetMinutes = isRamadan ? 120 : 90;
  const jDate = toJulianDate(year, month, day) - location.lng / (15 * 24);
  const tzDiff = utcOffsetHours - location.lng / 15;
  let fajrH = 5 / 24;
  let sunriseH = 6 / 24;
  let dhuhrH = 12 / 24;
  let asrH = 15 / 24;
  let maghribH = 18 / 24;
  for (let pass = 0; pass < 2; pass++) {
    const fajrMid = fixHour(12 - computeSolarPosition(jDate + fajrH).eqTimeHours) + tzDiff;
    const sunMid = fixHour(12 - computeSolarPosition(jDate + sunriseH).eqTimeHours) + tzDiff;
    const noonMid = fixHour(12 - computeSolarPosition(jDate + dhuhrH).eqTimeHours) + tzDiff;
    const asrMid = fixHour(12 - computeSolarPosition(jDate + asrH).eqTimeHours) + tzDiff;
    const magMid = fixHour(12 - computeSolarPosition(jDate + maghribH).eqTimeHours) + tzDiff;
    const sunriseOffset = computeSunAngleOffsetHours(jDate, sunriseH, location.lat, 0.833) ?? 6;
    const maghribOffset = computeSunAngleOffsetHours(jDate, maghribH, location.lat, 0.833) ?? 6;
    const sunriseHours = sunMid - sunriseOffset;
    const dhuhrHours = noonMid + 1 / 60;
    const asrHours = asrMid + computeAsrOffsetHours(jDate, asrH, location.lat);
    const maghribHours = magMid + maghribOffset + 1 / 60;
    const nightDuration = Math.max(4, 24 - (maghribHours - sunriseHours));
    const fajrOffset = computeSunAngleOffsetHours(jDate, fajrH, location.lat, 18.5) ?? sunriseOffset + 18.5 / 60 * nightDuration;
    const fajrHours = fajrOffset > sunriseOffset ? fajrMid - fajrOffset : sunriseHours - 18.5 / 60 * nightDuration;
    fajrH = fajrHours / 24;
    sunriseH = sunriseHours / 24;
    dhuhrH = dhuhrHours / 24;
    asrH = asrHours / 24;
    maghribH = maghribHours / 24;
  }
  const fajrMin = Math.round(fajrH * 1440);
  const sunriseMin = Math.round(sunriseH * 1440);
  const dhuhrMin = Math.round(dhuhrH * 1440);
  const asrMin = Math.round(asrH * 1440);
  const maghribMin = Math.round(maghribH * 1440);
  const ishaMin = maghribMin + ishaOffsetMinutes;
  const times = [
    {
      key: "fajr",
      label: "S\xFCbh (\u0130msak)",
      arabicLabel: "\u0627\u0644\u0641\u062C\u0631",
      minutesFromMidnight: fajrMin,
      formattedTime: formatMinutesToHHMM(fajrMin)
    },
    {
      key: "sunrise",
      label: "G\xFCn\u0259\u015F",
      arabicLabel: "\u0627\u0644\u0634\u0631\u0648\u0642",
      minutesFromMidnight: sunriseMin,
      formattedTime: formatMinutesToHHMM(sunriseMin)
    },
    {
      key: "dhuhr",
      label: "Z\xF6hr",
      arabicLabel: "\u0627\u0644\u0638\u0647\u0631",
      minutesFromMidnight: dhuhrMin,
      formattedTime: formatMinutesToHHMM(dhuhrMin)
    },
    {
      key: "asr",
      label: "\u018Fsr",
      arabicLabel: "\u0627\u0644\u0639\u0635\u0631",
      minutesFromMidnight: asrMin,
      formattedTime: formatMinutesToHHMM(asrMin)
    },
    {
      key: "maghrib",
      label: "M\u0259\u011Frib",
      arabicLabel: "\u0627\u0644\u0645\u063A\u0631\u0628",
      minutesFromMidnight: maghribMin,
      formattedTime: formatMinutesToHHMM(maghribMin)
    },
    {
      key: "isha",
      label: "\u0130\u015Fa",
      arabicLabel: "\u0627\u0644\u0639\u0634\u0627\u0621",
      minutesFromMidnight: ishaMin,
      formattedTime: formatMinutesToHHMM(ishaMin)
    }
  ];
  return {
    city: location,
    dateKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    gregorianLabel: formatGregorianAzerbaijani(year, month, day),
    hijriLabel: hijriParts.formatted,
    isRamadan,
    calculationMethodLabel: isRamadan ? "\xDCmm\xFCl-Qura (M\u0259kk\u0259 \xB7 18.5\xB0 F\u0259cr \xB7 +120 d\u0259q Ramazan \u0130\u015Fas\u0131)" : "\xDCmm\xFCl-Qura (M\u0259kk\u0259 \xB7 18.5\xB0 F\u0259cr \xB7 +90 d\u0259q \u0130\u015Fa)",
    utcOffsetHours,
    times
  };
}
function formatCountdownDuration(secondsTotal) {
  const safe = Math.max(0, Math.floor(secondsTotal));
  const hh = Math.floor(safe / 3600);
  const mm = Math.floor(safe % 3600 / 60);
  const ss = safe % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
function formatShortRemainingAz(secondsTotal) {
  const safe = Math.max(0, Math.floor(secondsTotal));
  const totalMin = Math.ceil(safe / 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh === 0) return `${mm} d\u0259q qal\u0131b`;
  if (mm === 0) return `${hh} saat qal\u0131b`;
  return `${hh} saat ${mm} d\u0259q qal\u0131b`;
}
function getNextPrayerCountdown(location, now = /* @__PURE__ */ new Date()) {
  const parts = getCalendarPartsInTimeZone(
    now,
    location.timeZone,
    location.fallbackUtcOffsetHours ?? BAKU_UTC_OFFSET_HOURS
  );
  const today = calculatePrayerTimesForDate(location, parts.year, parts.month, parts.day);
  for (let i = 0; i < today.times.length; i++) {
    const entry = today.times[i];
    const targetSeconds = entry.minutesFromMidnight * 60;
    if (parts.secondsSinceMidnight < targetSeconds) {
      const remaining2 = targetSeconds - parts.secondsSinceMidnight;
      const currentPrayerKey = i === 0 ? "isha" : today.times[i - 1].key;
      return {
        currentPrayerKey,
        nextPrayer: entry,
        isTomorrow: false,
        secondsRemaining: remaining2,
        formattedCountdown: formatCountdownDuration(remaining2)
      };
    }
  }
  const tomorrowDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
  const tomorrow = calculatePrayerTimesForDate(
    location,
    tomorrowDate.getUTCFullYear(),
    tomorrowDate.getUTCMonth() + 1,
    tomorrowDate.getUTCDate()
  );
  const fajrTomorrow = tomorrow.times[0];
  const remaining = 86400 - parts.secondsSinceMidnight + fajrTomorrow.minutesFromMidnight * 60;
  return {
    currentPrayerKey: "isha",
    nextPrayer: fajrTomorrow,
    isTomorrow: true,
    secondsRemaining: remaining,
    formattedCountdown: formatCountdownDuration(remaining)
  };
}
function calculateWeeklyPrayerSchedule(location, startDate = /* @__PURE__ */ new Date(), days = 7) {
  const parts = getCalendarPartsInTimeZone(
    startDate,
    location.timeZone,
    location.fallbackUtcOffsetHours ?? BAKU_UTC_OFFSET_HOURS
  );
  const list = [];
  for (let offset = 0; offset < days; offset++) {
    const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + offset));
    list.push(
      calculatePrayerTimesForDate(
        location,
        d.getUTCFullYear(),
        d.getUTCMonth() + 1,
        d.getUTCDate()
      )
    );
  }
  return list;
}

// src/lib/hijriCalendar.ts
var BLESSED_DAYS_CATALOG = [
  {
    id: "ramadan-start",
    title: "Ramazan ba\u015Flan\u011F\u0131c\u0131",
    subtitle: "M\xFCbar\u0259k Ramazan ay\u0131n\u0131n ilk g\xFCn\xFC",
    month: 9,
    day: 1
  },
  {
    id: "laylat-al-qadr",
    title: "Q\u0259dr gec\u0259si (27 Ramazan)",
    subtitle: "Min aydan xeyirli olan gec\u0259nin ehtimal olunan 27-ci g\xFCn\xFC",
    month: 9,
    day: 27
  },
  {
    id: "eid-al-fitr",
    title: "Ramazan Bayram\u0131",
    subtitle: "1 \u015E\u0259vval \xB7 Fitr bayram\u0131",
    month: 10,
    day: 1
  },
  {
    id: "arafah",
    title: "\u018Fr\u0259f\u0259 g\xFCn\xFC",
    subtitle: "9 Z\xFClhicc\u0259 \xB7 Dua v\u0259 ba\u011F\u0131\u015Flanma g\xFCn\xFC",
    month: 12,
    day: 9
  },
  {
    id: "eid-al-adha",
    title: "Qurban Bayram\u0131",
    subtitle: "10 Z\xFClhicc\u0259 \xB7 Qurban bayram\u0131",
    month: 12,
    day: 10
  },
  {
    id: "hijri-new-year",
    title: "Hicri Yeni \u0130l",
    subtitle: "1 M\u0259h\u0259rr\u0259m \xB7 Yeni Hicri ilin ilk g\xFCn\xFC",
    month: 1,
    day: 1
  },
  {
    id: "ashura",
    title: "A\u015Fura g\xFCn\xFC",
    subtitle: "10 M\u0259h\u0259rr\u0259m \xB7 M\u0259h\u0259rr\u0259m ay\u0131n\u0131n 10-cu g\xFCn\xFC",
    month: 1,
    day: 10
  }
];
function toIsoDateKey(utcDate) {
  const y = utcDate.getUTCFullYear();
  const m = String(utcDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utcDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function hijriToGregorianDate(rawYear, rawMonth, rawDay) {
  const hijriYear = Math.max(1356, Math.min(1500, Math.round(rawYear)));
  const hijriMonth = Math.max(1, Math.min(12, Math.round(rawMonth)));
  const hijriDay = Math.max(1, Math.min(30, Math.round(rawDay)));
  const hijriEpochMs = Date.UTC(622, 6, 19, 12, 0, 0);
  const approxDays = (hijriYear - 1) * 354.36707 + (hijriMonth - 1) * 29.53059 + (hijriDay - 1);
  const approxMs = hijriEpochMs + Math.round(approxDays) * 864e5;
  let monthFallbackCandidate = null;
  for (let offset = 0; offset <= 60; offset++) {
    const probes = offset === 0 ? [0] : [offset, -offset];
    for (const delta of probes) {
      const candidate = new Date(approxMs + delta * 864e5);
      const parts = getHijriPartsUmmAlQura(candidate, "UTC");
      if (parts.year === hijriYear && parts.month === hijriMonth) {
        if (parts.day === hijriDay) {
          const y2 = candidate.getUTCFullYear();
          const m2 = candidate.getUTCMonth() + 1;
          const d2 = candidate.getUTCDate();
          return {
            dateKey: toIsoDateKey(candidate),
            year: y2,
            month: m2,
            day: d2,
            gregorianLabel: formatGregorianAzerbaijani(y2, m2, d2),
            hijriYear: parts.year,
            hijriMonth: parts.month,
            hijriDay: parts.day,
            hijriFormatted: parts.formatted,
            exactDayMatched: true
          };
        }
        if (hijriDay === 30 && parts.day === 29) {
          monthFallbackCandidate = candidate;
        }
      }
    }
  }
  const chosen = monthFallbackCandidate ?? new Date(approxMs);
  const resolvedParts = getHijriPartsUmmAlQura(chosen, "UTC");
  const y = chosen.getUTCFullYear();
  const m = chosen.getUTCMonth() + 1;
  const d = chosen.getUTCDate();
  return {
    dateKey: toIsoDateKey(chosen),
    year: y,
    month: m,
    day: d,
    gregorianLabel: formatGregorianAzerbaijani(y, m, d),
    hijriYear: resolvedParts.year,
    hijriMonth: resolvedParts.month,
    hijriDay: resolvedParts.day,
    hijriFormatted: resolvedParts.formatted,
    exactDayMatched: false
  };
}
function getUpcomingBlessedDays(now = /* @__PURE__ */ new Date(), maxCount = 7) {
  const todayUtc = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)
  );
  const currentHijri = getHijriPartsUmmAlQura(todayUtc, "UTC");
  const entries = [];
  for (const def of BLESSED_DAYS_CATALOG) {
    let target = hijriToGregorianDate(currentHijri.year, def.month, def.day);
    let targetUtc = new Date(Date.UTC(target.year, target.month - 1, target.day, 12, 0, 0));
    let diffDays = Math.round((targetUtc.getTime() - todayUtc.getTime()) / 864e5);
    if (diffDays < 0) {
      target = hijriToGregorianDate(currentHijri.year + 1, def.month, def.day);
      targetUtc = new Date(Date.UTC(target.year, target.month - 1, target.day, 12, 0, 0));
      diffDays = Math.round((targetUtc.getTime() - todayUtc.getTime()) / 864e5);
    }
    entries.push({
      id: def.id,
      title: def.title,
      subtitle: def.subtitle,
      hijriYear: target.hijriYear,
      hijriMonth: target.hijriMonth,
      hijriDay: target.hijriDay,
      hijriLabel: target.hijriFormatted,
      gregorianDateKey: target.dateKey,
      gregorianLabel: target.gregorianLabel,
      daysRemaining: Math.max(0, diffDays)
    });
  }
  return entries.sort((a, b) => a.daysRemaining - b.daysRemaining).slice(0, maxCount);
}

// src/lib/telegramBot.ts
var TELEGRAM_BOT_COMMANDS = [
  { command: "start", description: "\u018Fsas menyu v\u0259 Telegram Mini App" },
  { command: "ses", description: "S\u0259sli dinl\u0259: Ay\u0259, Tam Sur\u0259 v\u0259 Qari se\xE7imi" },
  { command: "aye", description: "G\xFCn\xFCn ay\u0259si v\u0259 ya /aye 2:255" },
  { command: "kart", description: "Ay\u0259 \u015F\u0259kil kart\u0131 al (/kart 2:255)" },
  { command: "abune", description: "G\xFCnd\u0259lik C\xFCm\u0259, ay\u0259 v\u0259 namaz bildiri\u015Fl\u0259ri" },
  { command: "sure", description: "Sur\u0259 oxu (/sure Yasin, /sure 36)" },
  { command: "sehife", description: "M\u0259din\u0259 Mushaf\u0131 s\u0259hif\u0259si (/sehife 42)" },
  { command: "namaz", description: "Namaz vaxtlar\u0131 v\u0259 Qibl\u0259 (/namaz Bak\u0131)" },
  { command: "zikr", description: "S\u0259h\u0259r, ax\u015Fam v\u0259 namaz zikrl\u0259ri" },
  { command: "teqvim", description: "Hicri t\u0259qvim v\u0259 m\xFCbar\u0259k g\xFCnl\u0259r" },
  { command: "elifba", description: "\u018Fr\u0259b \u0259lifbas\u0131 v\u0259 t\u0259cvid b\u0259l\u0259d\xE7isi" },
  { command: "axtar", description: "Ay\u0259l\u0259rd\u0259 axtar\u0131\u015F (/axtar s\u0259bir)" },
  { command: "videolar", description: "Son uzun qira\u0259tl\u0259r v\u0259 Shorts" }
];
var CURATED_TELEGRAM_VERSES = [
  {
    surahNumber: 2,
    surahName: "B\u0259q\u0259r\u0259",
    ayahNumber: 255,
    arabicText: "\u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064E \u0625\u0650\u0644\u064E\u0651\u0627 \u0647\u064F\u0648\u064E \u0627\u0644\u0652\u062D\u064E\u064A\u064F\u0651 \u0627\u0644\u0652\u0642\u064E\u064A\u064F\u0651\u0648\u0645\u064F \u06DA \u0644\u064E\u0627 \u062A\u064E\u0623\u0652\u062E\u064F\u0630\u064F\u0647\u064F \u0633\u0650\u0646\u064E\u0629\u064C \u0648\u064E\u0644\u064E\u0627 \u0646\u064E\u0648\u0652\u0645\u064C",
    translation: "Allah \u2014 Ondan ba\u015Fqa ibad\u0259t\u0259 layiq olan m\u0259bud yoxdur, \u0259b\u0259di Ya\u015Fayand\u0131r, b\xFCt\xFCn yaratd\u0131qlar\u0131n\u0131n Q\u0259yyumudur. Onu n\u0259 m\xFCrg\xFC, n\u0259 d\u0259 yuxu tutar."
  },
  {
    surahNumber: 2,
    surahName: "B\u0259q\u0259r\u0259",
    ayahNumber: 286,
    arabicText: "\u0644\u064E\u0627 \u064A\u064F\u0643\u064E\u0644\u0650\u0651\u0641\u064F \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0646\u064E\u0641\u0652\u0633\u064B\u0627 \u0625\u0650\u0644\u064E\u0651\u0627 \u0648\u064F\u0633\u0652\u0639\u064E\u0647\u064E\u0627 \u06DA \u0644\u064E\u0647\u064E\u0627 \u0645\u064E\u0627 \u0643\u064E\u0633\u064E\u0628\u064E\u062A\u0652 \u0648\u064E\u0639\u064E\u0644\u064E\u064A\u0652\u0647\u064E\u0627 \u0645\u064E\u0627 \u0627\u0643\u0652\u062A\u064E\u0633\u064E\u0628\u064E\u062A\u0652",
    translation: "Allah h\u0259r k\u0259si yaln\u0131z onun q\xFCvv\u0259si \xE7atd\u0131\u011F\u0131 q\u0259d\u0259r y\xFCkl\u0259y\u0259r. H\u0259r k\u0259sin qazand\u0131\u011F\u0131 (xeyir yaln\u0131z) \xF6z\xFCn\u0259, qazand\u0131\u011F\u0131 (\u015F\u0259r d\u0259 yaln\u0131z) \xF6z \u0259leyhin\u0259dir."
  },
  {
    surahNumber: 94,
    surahName: "\u015E\u0259rh",
    ayahNumber: 5,
    arabicText: "\u0641\u064E\u0625\u0650\u0646\u064E\u0651 \u0645\u064E\u0639\u064E \u0627\u0644\u0652\u0639\u064F\u0633\u0652\u0631\u0650 \u064A\u064F\u0633\u0652\u0631\u064B\u0627 \u06DD \u0625\u0650\u0646\u064E\u0651 \u0645\u064E\u0639\u064E \u0627\u0644\u0652\u0639\u064F\u0633\u0652\u0631\u0650 \u064A\u064F\u0633\u0652\u0631\u064B\u0627",
    translation: "\u015E\xFCbh\u0259siz ki, h\u0259r \xE7\u0259tinlikd\u0259n sonra bir asanl\u0131q g\u0259lir! H\u0259qiq\u0259t\u0259n, h\u0259r \xE7\u0259tinlikl\u0259 yana\u015F\u0131 bir asanl\u0131q vard\u0131r!"
  },
  {
    surahNumber: 2,
    surahName: "B\u0259q\u0259r\u0259",
    ayahNumber: 152,
    arabicText: "\u0641\u064E\u0627\u0630\u0652\u0643\u064F\u0631\u064F\u0648\u0646\u0650\u064A \u0623\u064E\u0630\u0652\u0643\u064F\u0631\u0652\u0643\u064F\u0645\u0652 \u0648\u064E\u0627\u0634\u0652\u0643\u064F\u0631\u064F\u0648\u0627 \u0644\u0650\u064A \u0648\u064E\u0644\u064E\u0627 \u062A\u064E\u0643\u0652\u0641\u064F\u0631\u064F\u0648\u0646\u0650",
    translation: "M\u0259ni yad edin ki, M\u0259n d\u0259 sizi yad edim! M\u0259n\u0259 \u015F\xFCk\xFCr edin, k\xFCfr etm\u0259yin!"
  },
  {
    surahNumber: 13,
    surahName: "R\u0259d",
    ayahNumber: 28,
    arabicText: "\u0623\u064E\u0644\u064E\u0627 \u0628\u0650\u0630\u0650\u0643\u0652\u0631\u0650 \u0627\u0644\u0644\u064E\u0651\u0647\u0650 \u062A\u064E\u0637\u0652\u0645\u064E\u0626\u0650\u0646\u064F\u0651 \u0627\u0644\u0652\u0642\u064F\u0644\u064F\u0648\u0628\u064F",
    translation: "Bilin ki, q\u0259lbl\u0259r yaln\u0131z Allah\u0131 zikr etm\u0259kl\u0259 rahatl\u0131q tap\u0131r!"
  },
  {
    surahNumber: 3,
    surahName: "Ali-\u0130mran",
    ayahNumber: 139,
    arabicText: "\u0648\u064E\u0644\u064E\u0627 \u062A\u064E\u0647\u0650\u0646\u064F\u0648\u0627 \u0648\u064E\u0644\u064E\u0627 \u062A\u064E\u062D\u0652\u0632\u064E\u0646\u064F\u0648\u0627 \u0648\u064E\u0623\u064E\u0646\u062A\u064F\u0645\u064F \u0627\u0644\u0652\u0623\u064E\u0639\u0652\u0644\u064E\u0648\u0652\u0646\u064E \u0625\u0650\u0646 \u0643\u064F\u0646\u062A\u064F\u0645 \u0645\u064F\u0651\u0624\u0652\u0645\u0650\u0646\u0650\u064A\u0646\u064E",
    translation: "Acizlik g\xF6st\u0259rm\u0259yin v\u0259 k\u0259d\u0259rl\u0259nm\u0259yin! \u018Fg\u0259r m\xF6minsinizs\u0259, \xFCst\xFCn olan m\u0259hz sizsiniz."
  },
  {
    surahNumber: 65,
    surahName: "T\u0259laq",
    ayahNumber: 3,
    arabicText: "\u0648\u064E\u0645\u064E\u0646 \u064A\u064E\u062A\u064E\u0648\u064E\u0643\u064E\u0651\u0644\u0652 \u0639\u064E\u0644\u064E\u0649 \u0627\u0644\u0644\u064E\u0651\u0647\u0650 \u0641\u064E\u0647\u064F\u0648\u064E \u062D\u064E\u0633\u0652\u0628\u064F\u0647\u064F",
    translation: "Kim Allaha t\u0259v\u0259kk\xFCl ets\u0259, (Allah) ona kifay\u0259t ed\u0259r."
  },
  {
    surahNumber: 55,
    surahName: "R\u0259hman",
    ayahNumber: 13,
    arabicText: "\u0641\u064E\u0628\u0650\u0623\u064E\u064A\u0650\u0651 \u0622\u0644\u064E\u0627\u0621\u0650 \u0631\u064E\u0628\u0650\u0651\u0643\u064F\u0645\u064E\u0627 \u062A\u064F\u0643\u064E\u0630\u0650\u0651\u0628\u064E\u0627\u0646\u0650",
    translation: "El\u0259 is\u0259 R\u0259bbinizin hans\u0131 nem\u0259tl\u0259rini yalan say\u0131rs\u0131n\u0131z?!"
  },
  {
    surahNumber: 39,
    surahName: "Zum\u0259r",
    ayahNumber: 53,
    arabicText: "\u0644\u064E\u0627 \u062A\u064E\u0642\u0652\u0646\u064E\u0637\u064F\u0648\u0627 \u0645\u0650\u0646 \u0631\u064E\u0651\u062D\u0652\u0645\u064E\u0629\u0650 \u0627\u0644\u0644\u064E\u0651\u0647\u0650 \u06DA \u0625\u0650\u0646\u064E\u0651 \u0627\u0644\u0644\u064E\u0651\u0647\u064E \u064A\u064E\u063A\u0652\u0641\u0650\u0631\u064F \u0627\u0644\u0630\u064F\u0651\u0646\u064F\u0648\u0628\u064E \u062C\u064E\u0645\u0650\u064A\u0639\u064B\u0627",
    translation: "Allah\u0131n r\u0259hm\u0259tind\u0259n \xFCmidinizi \xFCzm\u0259yin. \u015E\xFCbh\u0259siz ki, Allah b\xFCt\xFCn g\xFCnahlar\u0131 ba\u011F\u0131\u015Flayar."
  },
  {
    surahNumber: 112,
    surahName: "\u0130xlas",
    ayahNumber: 1,
    arabicText: "\u0642\u064F\u0644\u0652 \u0647\u064F\u0648\u064E \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0623\u064E\u062D\u064E\u062F\u064C \u06DD \u0627\u0644\u0644\u064E\u0651\u0647\u064F \u0627\u0644\u0635\u064E\u0651\u0645\u064E\u062F\u064F",
    translation: 'De: "O Allah T\u0259kdir! Allah M\xF6htac deyildir (h\u0259r \u015Fey Ona m\xF6htacd\u0131r).'
  }
];
function escapeTelegramHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function normalizeAzSearchText(value) {
  return String(value ?? "").toLowerCase().replace(/ə/g, "e").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/İ/g, "i").replace(/[\u064B-\u065F\u0670]/g, "").replace(/[^a-z0-9\u0600-\u06ff:\s-]/g, " ").replace(/\s+/g, " ").trim();
}
function parseTelegramCommand(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed.startsWith("/")) return null;
  const match = trimmed.match(
    /^\/([a-zA-Z0-9_əöüşçğıƏÖÜŞÇĞI]+)(?:@[a-zA-Z0-9_]+)?(?:\s+([\s\S]*))?$/
  );
  if (!match) return null;
  return {
    command: normalizeAzSearchText(match[1]),
    args: (match[2] ?? "").trim()
  };
}
function findSurahForTelegramQuery(query) {
  const clean = normalizeAzSearchText(query);
  if (!clean) return void 0;
  if (/^\d{1,3}$/.test(clean)) {
    return getSurahByNumber(Number.parseInt(clean, 10));
  }
  const normalizedWithoutPrefix = clean.replace(/\bsuresi\b/g, "").replace(/\bsura\b/g, "").replace(/\bsure\b/g, "").trim();
  const surahAliases = {
    fatiha: 1,
    "al fatiha": 1,
    baqara: 2,
    bakara: 2,
    baqarah: 2,
    "ayatul kursi": 2,
    imran: 3,
    nisa: 4,
    maida: 5,
    kahf: 18,
    maryam: 19,
    taha: 20,
    yasin: 36,
    yaasin: 36,
    rahman: 55,
    waqiah: 56,
    mulk: 67,
    tebareke: 67,
    naba: 78,
    insirah: 94,
    qadr: 97,
    asr: 103,
    kevser: 108,
    ikhlas: 112,
    ihlas: 112,
    falaq: 113,
    nas: 114
  };
  if (surahAliases[normalizedWithoutPrefix]) {
    return getSurahByNumber(surahAliases[normalizedWithoutPrefix]);
  }
  const exact = SURAH_CATALOG.find((s) => {
    const nAz = normalizeAzSearchText(s.name);
    const nAr = normalizeAzSearchText(s.arabicName);
    return nAz === normalizedWithoutPrefix || nAr === normalizedWithoutPrefix;
  });
  if (exact) return exact;
  return SURAH_CATALOG.find((s) => {
    const nAz = normalizeAzSearchText(s.name);
    return nAz.startsWith(normalizedWithoutPrefix) || nAz.includes(normalizedWithoutPrefix);
  });
}
function findCityForTelegramQuery(query) {
  const clean = normalizeAzSearchText(query);
  if (!clean) return WORLD_PRAYER_CITIES[0];
  const aliases = {
    baku: "baku",
    baki: "baku",
    gence: "ganja",
    ganja: "ganja",
    seki: "shaki",
    shaki: "shaki",
    samaxi: "shamakhi",
    shamakhi: "shamakhi",
    lenkeran: "lankaran",
    lankaran: "lankaran",
    naxcivan: "nakhchivan",
    nakhchivan: "nakhchivan",
    susa: "shusha",
    shusha: "shusha",
    mekke: "makkah",
    makkah: "makkah",
    medine: "madinah",
    madinah: "madinah",
    ebudabi: "abudhabi",
    "ebu dabi": "abudhabi",
    erzurum: "erzurum"
  };
  const aliasId = aliases[clean];
  if (aliasId) {
    const aliased = WORLD_PRAYER_CITIES.find((c) => c.id === aliasId);
    if (aliased) return aliased;
  }
  const matched = WORLD_PRAYER_CITIES.find((c) => {
    const cityNorm = normalizeAzSearchText(c.name);
    const idNorm = normalizeAzSearchText(c.id);
    return cityNorm === clean || idNorm === clean || cityNorm.includes(clean);
  });
  return matched ?? WORLD_PRAYER_CITIES[0];
}
function getCuratedVerseForDate(now = /* @__PURE__ */ new Date()) {
  const dayIndex = Math.floor(now.getTime() / 864e5);
  return CURATED_TELEGRAM_VERSES[Math.abs(dayIndex) % CURATED_TELEGRAM_VERSES.length];
}
function getTelegramAyahAudioUrl(surahNumber, ayahNumber, reciterInput) {
  const reciter = resolveMuhaffizReciter(reciterInput);
  return getEveryAyahAudioUrl(surahNumber, ayahNumber, reciter.id);
}
function getTelegramSurahAudioUrl(surahNumber, reciterInput) {
  const reciter = resolveMuhaffizReciter(reciterInput);
  return getFullSurahAudioUrl(surahNumber, reciter.id);
}
var QARI_TOKEN_PATTERNS = [
  { pattern: /\b(maher|mahir|muayqil|mueyqil)\b/i, id: "MaherAlMuaiqly128kbps" },
  { pattern: /\b(yasser|yasir|dosari|dossary|dovseri)\b/i, id: "Yasser_Ad-Dussary_128kbps" },
  { pattern: /\b(husary|husari|huseri|xalil|xelil)\b/i, id: "Husary_128kbps" },
  { pattern: /\b(minshawy|minshawi|minsawi|minsavi|siddiq)\b/i, id: "Minshawy_Murattal_128kbps" },
  { pattern: /\b(basit|abdulbasit|ebdulbasit)\b/i, id: "Abdul_Basit_Murattal_192kbps" },
  { pattern: /\b(afasy|alafasy|efesi|misari|mishari|mishary)\b/i, id: "Alafasy_128kbps" }
];
function parseAudioQueryArgs(args) {
  let working = normalizeAzSearchText(args);
  let reciterId = "Alafasy_128kbps";
  for (const item of QARI_TOKEN_PATTERNS) {
    if (item.pattern.test(working)) {
      reciterId = item.id;
      working = working.replace(item.pattern, " ").replace(/\s+/g, " ").trim();
      break;
    }
  }
  const refMatch = working.match(/\b(\d{1,3}):(\d{1,3})\b/);
  if (refMatch) {
    const sNum = Number.parseInt(refMatch[1], 10);
    const aNum = Number.parseInt(refMatch[2], 10);
    const surah = getSurahByNumber(sNum);
    if (surah) {
      return {
        surahNumber: surah.number,
        ayahNumber: Math.max(1, Math.min(surah.ayahCount, aNum)),
        reciterId,
        hasExplicitTarget: true
      };
    }
  }
  const nameAndAyahMatch = working.match(/^(.+?)\s+(\d{1,3})$/);
  if (nameAndAyahMatch) {
    const surah = findSurahForTelegramQuery(nameAndAyahMatch[1]);
    const aNum = Number.parseInt(nameAndAyahMatch[2], 10);
    if (surah) {
      return {
        surahNumber: surah.number,
        ayahNumber: Math.max(1, Math.min(surah.ayahCount, aNum)),
        reciterId,
        hasExplicitTarget: true
      };
    }
  }
  if (working) {
    const surah = findSurahForTelegramQuery(working);
    if (surah) {
      return {
        surahNumber: surah.number,
        ayahNumber: 1,
        reciterId,
        hasExplicitTarget: true
      };
    }
  }
  const fallbackVerse = getCuratedVerseForDate();
  return {
    surahNumber: fallbackVerse.surahNumber,
    ayahNumber: fallbackVerse.ayahNumber,
    reciterId,
    hasExplicitTarget: false
  };
}
function parseKartQueryArgs(args) {
  let working = normalizeAzSearchText(args);
  let theme = "emerald";
  let format = "story";
  if (/\b(parchment|aciq|ag|light|krem)\b/.test(working)) {
    theme = "parchment";
    working = working.replace(/\b(parchment|aciq|ag|light|krem)\b/g, " ").trim();
  } else if (/\b(emerald|zumrud|tund|dark)\b/.test(working)) {
    theme = "emerald";
    working = working.replace(/\b(emerald|zumrud|tund|dark)\b/g, " ").trim();
  }
  if (/\b(square|kvadrat|1:1)\b/.test(working)) {
    format = "square";
    working = working.replace(/\b(square|kvadrat|1:1)\b/g, " ").trim();
  } else if (/\b(story|hekaye|status|9:16)\b/.test(working)) {
    format = "story";
    working = working.replace(/\b(story|hekaye|status|9:16)\b/g, " ").trim();
  }
  const target = parseAudioQueryArgs(working);
  return {
    surahNumber: target.surahNumber,
    ayahNumber: target.ayahNumber,
    theme,
    format,
    hasExplicitTarget: target.hasExplicitTarget
  };
}
function parseInlineAyahRef(query) {
  let working = normalizeAzSearchText(query);
  if (!working) return null;
  let reciterId = "Alafasy_128kbps";
  for (const item of QARI_TOKEN_PATTERNS) {
    if (item.pattern.test(working)) {
      reciterId = item.id;
      working = working.replace(item.pattern, " ").replace(/\s+/g, " ").trim();
      break;
    }
  }
  const refMatch = working.match(/^(\d{1,3}):(\d{1,3})$/);
  if (refMatch) {
    const sNum = Number.parseInt(refMatch[1], 10);
    const aNum = Number.parseInt(refMatch[2], 10);
    const surah = getSurahByNumber(sNum);
    if (surah && aNum >= 1 && aNum <= surah.ayahCount) {
      return { surahNumber: surah.number, ayahNumber: aNum, reciterId };
    }
  }
  const nameAndAyahMatch = working.match(/^(.+?)\s+(\d{1,3})$/);
  if (nameAndAyahMatch) {
    const surah = findSurahForTelegramQuery(nameAndAyahMatch[1]);
    const aNum = Number.parseInt(nameAndAyahMatch[2], 10);
    if (surah && aNum >= 1 && aNum <= surah.ayahCount) {
      return { surahNumber: surah.number, ayahNumber: aNum, reciterId };
    }
  }
  return null;
}
function buildMiniAppButton(text, url) {
  return {
    text,
    web_app: { url }
  };
}
function mapCallbackToBotDeepLink(callbackData, botUsername) {
  const cleanBot = botUsername.replace(/^@/, "") || "Quranqiraetibot";
  const amenuMatch = callbackData.match(/^(?:amenu|aplay:(?:ayah|surah)|audio):(\d{1,3}):(\d{1,3}):/);
  if (amenuMatch) {
    return `https://t.me/${cleanBot}?start=ses_${amenuMatch[1]}_${amenuMatch[2]}`;
  }
  const kartMatch = callbackData.match(/^kart:(\d{1,3}):(\d{1,3}):/);
  if (kartMatch) {
    return `https://t.me/${cleanBot}?start=kart_${kartMatch[1]}_${kartMatch[2]}`;
  }
  if (callbackData.startsWith("namaz:")) {
    return `https://t.me/${cleanBot}?start=namaz`;
  }
  if (callbackData.startsWith("zikr:")) {
    return `https://t.me/${cleanBot}?start=zikr`;
  }
  if (callbackData === "teqvim:now") {
    return `https://t.me/${cleanBot}?start=teqvim`;
  }
  if (callbackData === "aye:random") {
    return `https://t.me/${cleanBot}?start=gunun_ayesi`;
  }
  if (callbackData.startsWith("sub:")) {
    return `https://t.me/${cleanBot}?start=abune`;
  }
  return null;
}
function toShareableInlineMarkup(markup, botUsername = "Quranqiraetibot") {
  if (!markup?.inline_keyboard?.length) return void 0;
  const convertedRows = [];
  for (const row of markup.inline_keyboard) {
    const nextRow = [];
    for (const btn of row) {
      if (btn.web_app?.url) {
        nextRow.push({ text: btn.text, url: btn.web_app.url });
      } else if (btn.url) {
        nextRow.push({ text: btn.text, url: btn.url });
      } else if (btn.callback_data) {
        const mapped = mapCallbackToBotDeepLink(btn.callback_data, botUsername);
        if (mapped) {
          nextRow.push({ text: btn.text, url: mapped });
        }
      } else if (btn.switch_inline_query_current_chat !== void 0) {
        nextRow.push({
          text: btn.text,
          switch_inline_query_current_chat: btn.switch_inline_query_current_chat
        });
      }
    }
    if (nextRow.length > 0) {
      convertedRows.push(nextRow);
    }
  }
  return convertedRows.length > 0 ? { inline_keyboard: convertedRows } : void 0;
}
function formatStartMessage(origin) {
  const baseUrl = normalizeBaseUrl(origin);
  const text = [
    "<b>\u018Fss\u0259lamu aleykum!</b> \u{1F319}",
    "<b>Quran Qiraeti</b> r\u0259smi Telegram botuna v\u0259 Mini T\u0259tbiqin\u0259 xo\u015F g\u0259lmisiniz.",
    "",
    "<b>S\xF6hb\u0259td\u0259 istifad\u0259 ed\u0259 bil\u0259c\u0259yiniz \u0259mrl\u0259r:</b>",
    "\u2022 /ses \u2014 S\u0259sli dinl\u0259: Ay\u0259, Tam Sur\u0259 v\u0259 Qari se\xE7imi <i>(m\u0259s. /ses Yasin)</i>",
    "\u2022 /aye \u2014 G\xFCn\xFCn ay\u0259si v\u0259 s\u0259sli tilav\u0259t <i>(v\u0259 ya /aye 2:255)</i>",
    "\u2022 /kart \u2014 WhatsApp / Story \xFC\xE7\xFCn haz\u0131r ay\u0259 \u015F\u0259kil kart\u0131 <i>(m\u0259s. /kart 2:255)</i>",
    "\u2022 /abune \u2014 G\xFCnd\u0259lik C\xFCm\u0259 K\u0259hf, ay\u0259 v\u0259 namaz bildiri\u015Fl\u0259ri",
    "\u2022 /sure \u2014 Sur\u0259 oxu v\u0259 dinl\u0259 <i>(m\u0259s. /sure Yasin)</i>",
    "\u2022 /sehife \u2014 M\u0259din\u0259 Mushaf\u0131 s\u0259hif\u0259si <i>(m\u0259s. /sehife 42)</i>",
    "\u2022 /namaz \u2014 Namaz vaxtlar\u0131 v\u0259 Qibl\u0259 <i>(m\u0259s. /namaz Bak\u0131)</i>",
    "\u2022 /zikr \u2014 S\u0259h\u0259r, ax\u015Fam v\u0259 namaz sonras\u0131 zikrl\u0259r",
    "\u2022 /teqvim \u2014 Hicri t\u0259qvim v\u0259 m\xFCbar\u0259k g\xFCnl\u0259r say\u011Fac\u0131",
    "\u2022 /elifba \u2014 \u018Fr\u0259b \u0259lifbas\u0131 v\u0259 t\u0259cvid b\u0259l\u0259d\xE7isi",
    "\u2022 /axtar \u2014 Ay\u0259l\u0259rd\u0259 axtar\u0131\u015F <i>(m\u0259s. /axtar s\u0259bir)</i>",
    "\u2022 /videolar \u2014 Kanal\u0131n son uzun qira\u0259tl\u0259ri v\u0259 Shorts",
    "",
    "Tam <b>604 s\u0259hif\u0259lik M\u0259din\u0259 Mushaf\u0131, 114 sur\u0259 v\u0259 M\xFChafiz \u0259zb\u0259r al\u0259tini</b> birba\u015Fa Telegram i\xE7ind\u0259 a\xE7a bil\u0259rsiniz:"
  ].join("\n");
  return {
    text,
    reply_markup: {
      inline_keyboard: [
        [buildMiniAppButton("\u{1F4D6} Quran\u0131 A\xE7 (Mini App)", `${baseUrl}/quran`)],
        [
          buildMiniAppButton("\u{1F54B} Namaz Vaxtlar\u0131", `${baseUrl}/namaz-vaxtlari`),
          buildMiniAppButton("\u{1F9E0} M\xFChafiz \u018Fzb\u0259r", `${baseUrl}/muhaffiz`)
        ],
        [
          { text: "\u{1F3A7} S\u0259sli Dinl\u0259", callback_data: "amenu:1:1:afasy" },
          { text: "\u{1F305} G\xFCn\xFCn Ay\u0259si", callback_data: "aye:random" }
        ],
        [
          { text: "\u{1F5BC} Ay\u0259 Kart\u0131 (2:255)", callback_data: "kart:2:255:emerald" },
          { text: "\u{1F514} G\xFCnd\u0259lik Abun\u0259lik", callback_data: "sub:menu" }
        ],
        [
          { text: "\u{1F319} Zikrl\u0259r", callback_data: "zikr:seher" },
          { text: "\u{1F4C5} Hicri T\u0259qvim", callback_data: "teqvim:now" }
        ],
        [
          { text: "\u{1F50E} \xC7atda Payla\u015F (Inline)", switch_inline_query_current_chat: "2:255" }
        ],
        [
          buildMiniAppButton("\u{1F524} \u018Flifba & T\u0259cvid", `${baseUrl}/elifba`),
          { text: "\u{1F4FA} YouTube Kanal", url: "https://youtube.com/@quranqiraeti" }
        ]
      ]
    }
  };
}
function formatAudioSelectorMessage(origin, params) {
  const baseUrl = normalizeBaseUrl(origin);
  const surah = getSurahByNumber(params.surahNumber) ?? getSurahByNumber(1);
  const safeAyah = Math.max(1, Math.min(surah.ayahCount, Math.trunc(params.ayahNumber || 1)));
  const reciter = resolveMuhaffizReciter(params.reciterInput);
  const lines = [
    "<b>\u{1F3A7} S\u0259sli Tilav\u0259t \u2014 Ay\u0259, Tam Sur\u0259 v\u0259 Qari Se\xE7imi</b>",
    "",
    `\u{1F4D6} <b>Sur\u0259:</b> ${surah.number}. ${escapeTelegramHtml(surah.name)} (${escapeTelegramHtml(surah.arabicName)})`,
    `\u{1F516} <b>Se\xE7ilmi\u015F Ay\u0259:</b> ${surah.number}:${safeAyah} (${surah.ayahCount} ay\u0259)`,
    `\u{1F399} <b>Qari:</b> ${escapeTelegramHtml(reciter.label)}`,
    "",
    "A\u015Fa\u011F\u0131dan <b>t\u0259k ay\u0259ni</b> v\u0259 ya <b>tam sur\u0259ni</b> dinl\u0259yin, ist\u0259diyiniz zaman qarini d\u0259yi\u015Fin:",
    "<i>M\u0259s\u0259l\u0259n: /ses Yasin, /ses 2:255, /ses R\u0259hman maher</i>"
  ];
  const qariRow1 = MUHAFFIZ_RECITERS.slice(0, 3).map((r) => ({
    text: r.id === reciter.id ? `\u2713 ${r.shortLabel}` : r.shortLabel,
    callback_data: `asrc:${surah.number}:${safeAyah}:${r.code}`
  }));
  const qariRow2 = MUHAFFIZ_RECITERS.slice(3, 6).map((r) => ({
    text: r.id === reciter.id ? `\u2713 ${r.shortLabel}` : r.shortLabel,
    callback_data: `asrc:${surah.number}:${safeAyah}:${r.code}`
  }));
  const keyboard = [
    [
      {
        text: `\u{1F3A7} Ay\u0259ni Dinl\u0259 (${surah.number}:${safeAyah})`,
        callback_data: `aplay:ayah:${surah.number}:${safeAyah}:${reciter.code}`
      },
      {
        text: `\u{1F4C0} Tam Sur\u0259 (${surah.name})`,
        callback_data: `aplay:surah:${surah.number}:${safeAyah}:${reciter.code}`
      }
    ],
    qariRow1,
    qariRow2
  ];
  if (params.showPresets) {
    keyboard.push([
      { text: "Fatih\u0259", callback_data: `asrc:1:1:${reciter.code}` },
      { text: "Ay\u0259t\xFCl-K\xFCrsi", callback_data: `asrc:2:255:${reciter.code}` },
      { text: "Yasin", callback_data: `asrc:36:1:${reciter.code}` },
      { text: "R\u0259hman", callback_data: `asrc:55:1:${reciter.code}` },
      { text: "M\xFClk", callback_data: `asrc:67:1:${reciter.code}` }
    ]);
  }
  keyboard.push([
    buildMiniAppButton(
      `\u{1F4D6} ${surah.name} \u2014 T\u0259tbiqd\u0259 Tam Dinl\u0259`,
      `${baseUrl}/quran/sure/${surah.number}?reciter=${encodeURIComponent(reciter.id)}#ayah-${safeAyah}`
    )
  ]);
  return {
    text: lines.join("\n"),
    reply_markup: { inline_keyboard: keyboard }
  };
}
function formatVerseMessage(origin, params) {
  const baseUrl = normalizeBaseUrl(origin);
  const heading = params.heading || "\u2728 G\xFCn\xFCn Ay\u0259si";
  const text = [
    `<b>${escapeTelegramHtml(heading)}</b>`,
    `<i>${escapeTelegramHtml(params.surahName)} sur\u0259si, ${params.surahNumber}:${params.ayahNumber}</i>`,
    "",
    `${escapeTelegramHtml(params.arabicText)} \uFD3F${params.ayahNumber}\uFD3E`,
    "",
    `\xAB${escapeTelegramHtml(params.translation)}\xBB`,
    "<i>T\u0259rc\xFCm\u0259: \u018Flixan Musayev</i>"
  ].join("\n");
  return {
    text,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "\u{1F3A7} S\u0259sli Dinl\u0259 (Ay\u0259 / Sur\u0259 / Qari)",
            callback_data: `amenu:${params.surahNumber}:${params.ayahNumber}:afasy`
          },
          buildMiniAppButton(
            `\u{1F4D6} Sur\u0259d\u0259 a\xE7`,
            `${baseUrl}/quran/sure/${params.surahNumber}#ayah-${params.ayahNumber}`
          )
        ],
        [
          {
            text: "\u{1F5BC} \u015E\u0259kil Kart\u0131 Al",
            callback_data: `kart:${params.surahNumber}:${params.ayahNumber}:emerald`
          },
          { text: "\u{1F504} Ba\u015Fqa Ay\u0259", callback_data: "aye:random" }
        ]
      ]
    }
  };
}
function formatSurahMessage(origin, surah, sampleAyahs = []) {
  const baseUrl = normalizeBaseUrl(origin);
  const lines = [
    `<b>\u{1F4D6} ${surah.number}. ${escapeTelegramHtml(surah.name)} sur\u0259si</b> (${escapeTelegramHtml(surah.arabicName)})`,
    `${surah.ayahCount} ay\u0259 \xB7 ${escapeTelegramHtml(surah.revelationPlace)} \xB7 M\u0259din\u0259 Mushaf\u0131: S\u0259hif\u0259 ${surah.startPage}`
  ];
  if (sampleAyahs.length > 0) {
    lines.push("");
    for (const a of sampleAyahs.slice(0, 2)) {
      lines.push(`${escapeTelegramHtml(a.arabicText)} \uFD3F${a.ayahNumber}\uFD3E`);
      lines.push(`<b>${a.ayahNumber}.</b> ${escapeTelegramHtml(a.translation)}`);
      lines.push("");
    }
  } else {
    lines.push("", "Tam \u0259r\u0259bc\u0259 m\u0259tn, s\u0259sli tilav\u0259t v\u0259 \u018Flixan Musayev t\u0259rc\xFCm\u0259si \xFC\xE7\xFCn t\u0259tbiqd\u0259 a\xE7\u0131n:");
  }
  return {
    text: lines.join("\n").trim(),
    reply_markup: {
      inline_keyboard: [
        [buildMiniAppButton(`\u{1F4D6} ${surah.name} sur\u0259sini oxu`, `${baseUrl}/quran/sure/${surah.number}`)],
        [
          {
            text: "\u{1F3A7} S\u0259sli Dinl\u0259 (Ay\u0259 / Tam Sur\u0259 / Qari)",
            callback_data: `amenu:${surah.number}:1:afasy`
          },
          {
            text: "\u{1F4C0} Tam Sur\u0259 MP3",
            callback_data: `aplay:surah:${surah.number}:1:afasy`
          }
        ],
        [
          buildMiniAppButton(`\u{1F4C4} S\u0259hif\u0259 ${surah.startPage}`, `${baseUrl}/quran/sehife/${surah.startPage}`),
          buildMiniAppButton("\u{1F9E0} M\xFChafiz", `${baseUrl}/muhaffiz/${surah.startPage}`)
        ]
      ]
    }
  };
}
function formatMushafPageMessage(origin, pageNumber, summaryText = "", sampleAyahs = []) {
  const baseUrl = normalizeBaseUrl(origin);
  const safePage = Math.max(1, Math.min(TOTAL_QURAN_PAGES, Math.trunc(pageNumber)));
  const juz = getJuzForPage(safePage);
  const ordinal = formatAzerbaijaniOrdinal(safePage);
  const lines = [
    `<b>\u{1F4C4} M\u0259din\u0259 Mushaf\u0131 \u2014 ${ordinal} s\u0259hif\u0259</b> (${juz}-ci C\xFCz)`,
    ...summaryText ? [`<i>${escapeTelegramHtml(summaryText)}</i>`] : [],
    ""
  ];
  if (sampleAyahs.length > 0) {
    for (const a of sampleAyahs.slice(0, 2)) {
      lines.push(`${escapeTelegramHtml(a.arabicText)} \uFD3F${a.ayahNumber}\uFD3E`);
      lines.push(`<b>${escapeTelegramHtml(a.surahName)} ${a.ayahNumber}:</b> ${escapeTelegramHtml(a.translation)}`);
      lines.push("");
    }
  } else {
    lines.push("Bu s\u0259hif\u0259ni tam \u0259r\u0259bc\u0259 m\u0259tn, t\u0259cvid r\u0259ngl\u0259m\u0259si v\u0259 qira\u0259t il\u0259 a\xE7\u0131n:");
  }
  const navRow = [];
  if (safePage > 1) {
    navRow.push({ text: `\u2B05\uFE0F S\u0259hif\u0259 ${safePage - 1}`, callback_data: `mushaf:${safePage - 1}` });
  }
  if (safePage < TOTAL_QURAN_PAGES) {
    navRow.push({ text: `S\u0259hif\u0259 ${safePage + 1} \u27A1\uFE0F`, callback_data: `mushaf:${safePage + 1}` });
  }
  return {
    text: lines.join("\n").trim(),
    reply_markup: {
      inline_keyboard: [
        [
          buildMiniAppButton(`\u{1F4D6} S\u0259hif\u0259 ${safePage} Oxu`, `${baseUrl}/quran/sehife/${safePage}`),
          buildMiniAppButton("\u{1F9E0} M\xFChafizd\u0259 \u018Fzb\u0259rl\u0259", `${baseUrl}/muhaffiz/${safePage}`)
        ],
        ...navRow.length > 0 ? [navRow] : []
      ]
    }
  };
}
function formatPrayerTimesMessage(origin, city, now = /* @__PURE__ */ new Date()) {
  const baseUrl = normalizeBaseUrl(origin);
  const schedule = calculateWeeklyPrayerSchedule(city, now, 1)[0];
  const countdown = getNextPrayerCountdown(city, now);
  const qibla = computeQiblaDirection(city.lat, city.lng);
  const lines = [
    `<b>\u{1F54B} Namaz Vaxtlar\u0131 \u2014 ${escapeTelegramHtml(city.name)}</b> (${escapeTelegramHtml(city.countryName)})`,
    `\u{1F4C5} ${escapeTelegramHtml(schedule.gregorianLabel)} \xB7 ${escapeTelegramHtml(schedule.hijriLabel)}`,
    "",
    ...schedule.times.map(
      (t) => `${t.key === countdown.nextPrayer.key ? "\u{1F449} " : "\u2022 "}<b>${escapeTelegramHtml(t.label)}:</b> <code>${escapeTelegramHtml(t.formattedTime)}</code>`
    ),
    "",
    `\u23F3 N\xF6vb\u0259ti vaxt: <b>${escapeTelegramHtml(countdown.nextPrayer.label)}</b> (${escapeTelegramHtml(formatShortRemainingAz(countdown.secondsRemaining))})`,
    `\u{1F9ED} Qibl\u0259 buca\u011F\u0131: <b>${qibla.bearingDegrees}\xB0</b> (${escapeTelegramHtml(qibla.cardinalLabel)} \xB7 ${qibla.distanceKm} km)`
  ];
  return {
    text: lines.join("\n"),
    reply_markup: {
      inline_keyboard: [
        [
          buildMiniAppButton("\u{1F54B} Tam C\u0259dv\u0259l & X\u0259rit\u0259", `${baseUrl}/namaz-vaxtlari`),
          buildMiniAppButton("\u{1F9ED} Canl\u0131 Qibl\u0259", `${baseUrl}/qible`)
        ],
        [
          { text: "Bak\u0131", callback_data: "namaz:baku" },
          { text: "G\u0259nc\u0259", callback_data: "namaz:ganja" },
          { text: "Sumqay\u0131t", callback_data: "namaz:sumqayit" },
          { text: "Nax\xE7\u0131van", callback_data: "namaz:nakhchivan" }
        ],
        [
          { text: "\u015E\u0259ki", callback_data: "namaz:shaki" },
          { text: "\u015Eu\u015Fa", callback_data: "namaz:shusha" },
          { text: "\u0130stanbul", callback_data: "namaz:istanbul" },
          { text: "M\u0259kk\u0259", callback_data: "namaz:makkah" }
        ]
      ]
    }
  };
}
function formatZikrMessage(origin, category = "seher", indexOffset = 0) {
  const baseUrl = normalizeBaseUrl(origin);
  const effectivePool = getAzkarByCategory(category);
  const idx = Math.abs(indexOffset) % effectivePool.length;
  const item = effectivePool[idx];
  const categoryLabel = AZKAR_CATEGORY_LABELS[category] ?? "Zikrl\u0259r";
  const text = [
    `<b>\u{1F319} ${escapeTelegramHtml(categoryLabel)} \u2014 ${escapeTelegramHtml(item.title)}</b>`,
    `<i>Oxunu\u015F say\u0131: ${escapeTelegramHtml(item.countNote ?? `${item.targetCount} d\u0259f\u0259`)} \xB7 ${escapeTelegramHtml(item.source)}</i>`,
    "",
    escapeTelegramHtml(item.arabicText),
    "",
    `\xAB${escapeTelegramHtml(item.translation)}\xBB`,
    "",
    `<i>\u2728 ${escapeTelegramHtml(item.virtue)}</i>`
  ].join("\n");
  return {
    text,
    reply_markup: {
      inline_keyboard: [
        [buildMiniAppButton("\u{1F4D6} B\xFCt\xFCn Zikrl\u0259ri A\xE7", `${baseUrl}/zikr`)],
        [
          { text: "\u{1F305} S\u0259h\u0259r", callback_data: "zikr:seher:0" },
          { text: "\u{1F319} Ax\u015Fam", callback_data: "zikr:axsam:0" },
          { text: "\u{1F54C} Namaz sonras\u0131", callback_data: "zikr:namaz:0" }
        ],
        [
          {
            text: `\u{1F504} N\xF6vb\u0259ti Zikr (${idx + 1}/${effectivePool.length})`,
            callback_data: `zikr:${category}:${idx + 1}`
          }
        ]
      ]
    }
  };
}
function formatHijriCalendarMessage(origin, now = /* @__PURE__ */ new Date()) {
  const baseUrl = normalizeBaseUrl(origin);
  const todayHijri = getHijriPartsUmmAlQura(now, "Asia/Baku");
  const upcoming = getUpcomingBlessedDays(now, 5);
  const lines = [
    "<b>\u{1F4C5} Hicri\u2013Miladi T\u0259qvim (\xDCmm\xFCl-Qura)</b>",
    `\u{1F319} Bu g\xFCn (Hicri): <b>${escapeTelegramHtml(todayHijri.formatted)}</b>`,
    "",
    "<b>Qar\u015F\u0131dak\u0131 M\xFCbar\u0259k G\xFCnl\u0259r:</b>",
    ...upcoming.map(
      (item) => `\u2022 <b>${escapeTelegramHtml(item.title)}</b>
   ${escapeTelegramHtml(item.hijriLabel)} (${escapeTelegramHtml(item.gregorianLabel)}) \u2014 <b>${item.daysRemaining === 0 ? "Bu g\xFCn!" : `${item.daysRemaining} g\xFCn qal\u0131b`}</b>`
    )
  ];
  return {
    text: lines.join("\n"),
    reply_markup: {
      inline_keyboard: [
        [
          buildMiniAppButton("\u{1F4C5} Tarix \xC7evirici & T\u0259qvim", `${baseUrl}/teqvim`),
          buildMiniAppButton("\u{1F54B} Namaz Vaxtlar\u0131", `${baseUrl}/namaz-vaxtlari`)
        ]
      ]
    }
  };
}
function formatAlphabetMessage(origin) {
  const baseUrl = normalizeBaseUrl(origin);
  const text = [
    "<b>\u{1F524} \u018Fr\u0259b \u018Flifbas\u0131, H\u0259r\u0259k\u0259l\u0259r v\u0259 T\u0259cvid B\u0259l\u0259d\xE7isi</b>",
    "",
    "\u2022 28 \u0259r\u0259b h\u0259rfinin t\u0259k, ba\u015Fda, ortada v\u0259 sonda yaz\u0131l\u0131\u015F formalar\u0131",
    "\u2022 H\u0259r bir h\u0259rfin m\u0259xr\u0259c n\xF6qt\u0259si (bo\u011Faz, dil, dodaq) v\u0259 s\u0259sli t\u0259l\u0259ff\xFCz\xFC",
    "\u2022 Canl\u0131 H\u0259r\u0259k\u0259 Qurucusu (F\u0259th\u0259, K\u0259sr\u0259, D\u0259mm\u0259, T\u0259nvin, \u015E\u0259dd\u0259, S\xFCkun)",
    "\u2022 \u018Fsas T\u0259cvid qaydalar\u0131 (Qalqal\u0259, \u011E\xFCnn\u0259, \u0130xfa, \u0130d\u011Fam, M\u0259dd) Quran ay\u0259l\u0259ri \xFCz\u0259rind\u0259 n\xFCmun\u0259l\u0259rl\u0259"
  ].join("\n");
  return {
    text,
    reply_markup: {
      inline_keyboard: [
        [buildMiniAppButton("\u{1F524} \u0130nteraktiv \u018Flifba B\u0259l\u0259d\xE7isini A\xE7", `${baseUrl}/elifba`)],
        [buildMiniAppButton("\u{1F9E0} M\xFChafiz \u018Fzb\u0259r Mushaf\u0131", `${baseUrl}/muhaffiz`)]
      ]
    }
  };
}
function formatVideosMessage(origin, videos, heading = "\u{1F3AC} Kanal\u0131n Se\xE7ilmi\u015F Quran Tilav\u0259tl\u0259ri") {
  const baseUrl = normalizeBaseUrl(origin);
  const top = videos.slice(0, 6);
  const lines = [
    `<b>${escapeTelegramHtml(heading)}</b>`,
    "",
    ...top.map(
      (v, idx) => `${idx + 1}. <b>${escapeTelegramHtml(v.title)}</b>
   \u{1F399} ${escapeTelegramHtml(v.reciter)} \xB7 \u23F1 ${escapeTelegramHtml(v.duration)}`
    )
  ];
  const buttonRows = top.slice(0, 4).map((v) => [
    buildMiniAppButton(`\u25B6\uFE0F ${v.surahName} (${v.ayahRange})`, `${baseUrl}/video/${v.videoId}`)
  ]);
  buttonRows.push([
    buildMiniAppButton("\u{1F3AC} B\xFCt\xFCn Shorts", `${baseUrl}/shorts`),
    { text: "\u{1F4FA} YouTube", url: "https://youtube.com/@quranqiraeti" }
  ]);
  return {
    text: lines.join("\n"),
    reply_markup: {
      inline_keyboard: buttonRows
    }
  };
}
function buildInlineAyahResults(origin, botUsername, verse, reciterInput) {
  const baseUrl = normalizeBaseUrl(origin);
  const cleanBot = botUsername.replace(/^@/, "") || "Quranqiraetibot";
  const reciter = resolveMuhaffizReciter(reciterInput);
  const ayahAudioUrl = getTelegramAyahAudioUrl(verse.surahNumber, verse.ayahNumber, reciter.id);
  const cardUrl = `${baseUrl}/api/telegram/verse-card.png?surah=${verse.surahNumber}&ayah=${verse.ayahNumber}&theme=emerald&format=story`;
  const articleText = [
    `<b>\u{1F4D6} ${escapeTelegramHtml(verse.surahName)} sur\u0259si, ${verse.surahNumber}:${verse.ayahNumber}</b>`,
    "",
    `${escapeTelegramHtml(verse.arabicText)} \uFD3F${verse.ayahNumber}\uFD3E`,
    "",
    `\xAB${escapeTelegramHtml(verse.translation)}\xBB`,
    "<i>T\u0259rc\xFCm\u0259: \u018Flixan Musayev</i>"
  ].join("\n");
  const sharedMarkup = toShareableInlineMarkup(
    {
      inline_keyboard: [
        [
          {
            text: "\u{1F3A7} S\u0259sli Dinl\u0259",
            url: `https://t.me/${cleanBot}?start=ses_${verse.surahNumber}_${verse.ayahNumber}`
          },
          {
            text: "\u{1F5BC} \u015E\u0259kil Kart\u0131 Al",
            url: `https://t.me/${cleanBot}?start=kart_${verse.surahNumber}_${verse.ayahNumber}`
          }
        ],
        [
          {
            text: `\u{1F4D6} ${verse.surahName} sur\u0259sini oxu`,
            url: `${baseUrl}/quran/sure/${verse.surahNumber}#ayah-${verse.ayahNumber}`
          }
        ]
      ]
    },
    cleanBot
  );
  return [
    {
      type: "article",
      id: `ayah-${verse.surahNumber}-${verse.ayahNumber}`,
      title: `\u{1F4D6} ${verse.surahName} ${verse.surahNumber}:${verse.ayahNumber}`,
      description: verse.translation.slice(0, 110),
      input_message_content: {
        message_text: articleText,
        parse_mode: "HTML",
        disable_web_page_preview: true
      },
      reply_markup: sharedMarkup
    },
    {
      type: "audio",
      id: `audio-${verse.surahNumber}-${verse.ayahNumber}-${reciter.code}`,
      audio_url: ayahAudioUrl,
      title: `${verse.surahName} ${verse.surahNumber}:${verse.ayahNumber}`,
      performer: reciter.label,
      caption: `\u{1F3A7} <b>${escapeTelegramHtml(verse.surahName)} ${verse.surahNumber}:${verse.ayahNumber}</b> \xB7 ${escapeTelegramHtml(reciter.label)}
\xAB${escapeTelegramHtml(verse.translation.slice(0, 220))}\xBB`,
      parse_mode: "HTML",
      reply_markup: sharedMarkup
    },
    {
      type: "photo",
      id: `card-${verse.surahNumber}-${verse.ayahNumber}`,
      photo_url: cardUrl,
      thumbnail_url: cardUrl,
      photo_width: 1080,
      photo_height: 1920,
      title: `\u{1F5BC} Ay\u0259 \u015E\u0259kil Kart\u0131 (${verse.surahNumber}:${verse.ayahNumber})`,
      description: "WhatsApp Durum / Instagram Hekay\u0259 \xFC\xE7\xFCn haz\u0131r dizayn",
      caption: `<b>${escapeTelegramHtml(verse.surahName)} ${verse.surahNumber}:${verse.ayahNumber}</b>
\xAB${escapeTelegramHtml(verse.translation.slice(0, 220))}\xBB
@quranqiraeti`,
      parse_mode: "HTML",
      reply_markup: sharedMarkup
    }
  ];
}
function buildInlineSearchResults(origin, botUsername, matches) {
  const baseUrl = normalizeBaseUrl(origin);
  const cleanBot = botUsername.replace(/^@/, "") || "Quranqiraetibot";
  return matches.slice(0, 6).map((m) => ({
    type: "article",
    id: `search-${m.surahNumber}-${m.ayahNumber}`,
    title: `\u{1F50E} ${m.surahName} ${m.surahNumber}:${m.ayahNumber}`,
    description: m.snippet.slice(0, 120),
    input_message_content: {
      message_text: [
        `<b>\u{1F50E} ${escapeTelegramHtml(m.surahName)} sur\u0259si, ${m.surahNumber}:${m.ayahNumber}</b>`,
        "",
        `\xAB${escapeTelegramHtml(m.snippet)}\xBB`
      ].join("\n"),
      parse_mode: "HTML",
      disable_web_page_preview: true
    },
    reply_markup: toShareableInlineMarkup(
      {
        inline_keyboard: [
          [
            {
              text: "\u{1F3A7} S\u0259sli Dinl\u0259",
              url: `https://t.me/${cleanBot}?start=ses_${m.surahNumber}_${m.ayahNumber}`
            },
            {
              text: "\u{1F5BC} \u015E\u0259kil Kart\u0131 Al",
              url: `https://t.me/${cleanBot}?start=kart_${m.surahNumber}_${m.ayahNumber}`
            }
          ],
          [
            {
              text: "\u{1F4D6} Sur\u0259d\u0259 A\xE7",
              url: `${baseUrl}/quran/sure/${m.surahNumber}#ayah-${m.ayahNumber}`
            }
          ]
        ]
      },
      cleanBot
    )
  }));
}
function buildInlineQueryResults(origin, query, videos, now = /* @__PURE__ */ new Date(), botUsername = "Quranqiraetibot") {
  const baseUrl = normalizeBaseUrl(origin);
  const clean = normalizeAzSearchText(query);
  const results = [];
  if (!clean || clean.includes("namaz") || clean.includes("vaxt")) {
    const city = findCityForTelegramQuery(clean.replace(/namaz|vaxt/g, "").trim() || "baku");
    const prayerMsg = formatPrayerTimesMessage(baseUrl, city, now);
    results.push({
      type: "article",
      id: `namaz-${city.id}`,
      title: `\u{1F54B} ${city.name} \u2014 Bug\xFCnk\xFC Namaz Vaxtlar\u0131`,
      description: "\xDCmm\xFCl-Qura c\u0259dv\u0259li, n\xF6vb\u0259ti vaxta qalan vaxt v\u0259 Qibl\u0259 buca\u011F\u0131",
      input_message_content: {
        message_text: prayerMsg.text,
        parse_mode: "HTML",
        disable_web_page_preview: true
      },
      reply_markup: toShareableInlineMarkup(prayerMsg.reply_markup, botUsername)
    });
  }
  if (clean && (clean.includes("teqvim") || clean.includes("hicri") || clean.includes("ramazan"))) {
    const calMsg = formatHijriCalendarMessage(baseUrl, now);
    results.push({
      type: "article",
      id: "hijri-calendar",
      title: "\u{1F4C5} Hicri T\u0259qvim v\u0259 M\xFCbar\u0259k G\xFCnl\u0259r",
      description: "Ramazan, Q\u0259dr gec\u0259si v\u0259 bayramlara qalan g\xFCnl\u0259r",
      input_message_content: {
        message_text: calMsg.text,
        parse_mode: "HTML",
        disable_web_page_preview: true
      },
      reply_markup: toShareableInlineMarkup(calMsg.reply_markup, botUsername)
    });
  }
  const matchedSurahs = clean ? SURAH_CATALOG.filter((s) => {
    const nameNorm = normalizeAzSearchText(s.name);
    return String(s.number) === clean || nameNorm.includes(clean);
  }).slice(0, 5) : SURAH_CATALOG.filter((s) => [1, 18, 36, 55, 67].includes(s.number));
  for (const surah of matchedSurahs) {
    const msg = formatSurahMessage(baseUrl, surah);
    results.push({
      type: "article",
      id: `surah-${surah.number}`,
      title: `\u{1F4D6} ${surah.number}. ${surah.name} sur\u0259si (${surah.arabicName})`,
      description: `${surah.ayahCount} ay\u0259 \xB7 ${surah.revelationPlace} \xB7 M\u0259din\u0259 S\u0259hif\u0259 ${surah.startPage}`,
      input_message_content: {
        message_text: msg.text,
        parse_mode: "HTML",
        disable_web_page_preview: true
      },
      reply_markup: toShareableInlineMarkup(msg.reply_markup, botUsername)
    });
  }
  const matchedVideos = clean ? videos.filter(
    (v) => normalizeAzSearchText(`${v.title} ${v.surahName} ${v.reciter}`).includes(clean)
  ).slice(0, 4) : videos.slice(0, 3);
  for (const video of matchedVideos) {
    const safeDesc = video.seoDescription || `${video.surahName} (${video.ayahRange}) \u2014 ${video.reciter}`;
    results.push({
      type: "article",
      id: `video-${video.videoId}`,
      title: `\u{1F3AC} ${video.title}`,
      description: `${video.reciter} \xB7 ${video.duration}`,
      input_message_content: {
        message_text: [
          `<b>\u{1F3AC} ${escapeTelegramHtml(video.title)}</b>`,
          `\u{1F399} Qari: ${escapeTelegramHtml(video.reciter)} \xB7 \u23F1 ${escapeTelegramHtml(video.duration)}`,
          "",
          escapeTelegramHtml(safeDesc),
          "",
          `\u{1F517} https://www.youtube.com/watch?v=${escapeTelegramHtml(video.videoId)}`
        ].join("\n"),
        parse_mode: "HTML"
      },
      reply_markup: toShareableInlineMarkup(
        {
          inline_keyboard: [
            [buildMiniAppButton("\u25B6\uFE0F Mini App-d\u0259 \u0130zl\u0259", `${baseUrl}/video/${video.videoId}`)]
          ]
        },
        botUsername
      )
    });
  }
  return results.slice(0, 12);
}

// src/lib/telegramSubscriptions.ts
var SUBSCRIPTION_CITY_IDS = [
  "baku",
  "ganja",
  "sumqayit",
  "nakhchivan",
  "shaki",
  "shusha",
  "istanbul",
  "makkah"
];
var SUBSCRIPTION_HOURS_BAKU = [6, 8, 9, 12, 18, 20];
function createDefaultSubscription(chatId) {
  return {
    chatId: String(chatId),
    active: true,
    cityId: "baku",
    hourBaku: 9,
    fridayKahf: true,
    dailyVerseZikr: true,
    dailyPrayer: true,
    updatedAt: Date.now()
  };
}
function normalizeTelegramSubscription(raw) {
  const validCity = WORLD_PRAYER_CITIES.some((c) => c.id === raw.cityId) ? String(raw.cityId) : "baku";
  const parsedHour = Number(raw.hourBaku);
  const hourBaku = Number.isFinite(parsedHour) && parsedHour >= 0 && parsedHour <= 23 ? Math.trunc(parsedHour) : 9;
  return {
    chatId: String(raw.chatId),
    active: raw.active !== void 0 ? Boolean(raw.active) : true,
    cityId: validCity,
    hourBaku,
    fridayKahf: raw.fridayKahf !== void 0 ? Boolean(raw.fridayKahf) : true,
    dailyVerseZikr: raw.dailyVerseZikr !== void 0 ? Boolean(raw.dailyVerseZikr) : true,
    dailyPrayer: raw.dailyPrayer !== void 0 ? Boolean(raw.dailyPrayer) : true,
    updatedAt: Number.isFinite(Number(raw.updatedAt)) ? Number(raw.updatedAt) : Date.now(),
    ...raw.lastSentDateKey ? { lastSentDateKey: String(raw.lastSentDateKey) } : {}
  };
}
function getBakuDateParts(now = /* @__PURE__ */ new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baku",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    weekday: "short"
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
  const year = get("year") || "2026";
  const month = get("month") || "01";
  const day = get("day") || "01";
  const hourRaw = Number.parseInt(get("hour") || "0", 10);
  const hour = Number.isFinite(hourRaw) ? hourRaw % 24 : 0;
  const weekdayShort = get("weekday");
  return {
    dateKey: `${year}-${month}-${day}`,
    hour,
    weekdayShort,
    isFriday: weekdayShort.toLowerCase().startsWith("fri")
  };
}
function reduceSubscriptionEvents(records) {
  const latestByChat = /* @__PURE__ */ new Map();
  for (const raw of records) {
    if (!raw?.chatId) continue;
    const normalized = normalizeTelegramSubscription(raw);
    const existing = latestByChat.get(normalized.chatId);
    if (!existing || normalized.updatedAt >= existing.updatedAt) {
      latestByChat.set(normalized.chatId, normalized);
    }
  }
  return Array.from(latestByChat.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}
function parseAbuneCommandArgs(args, current) {
  const clean = normalizeAzSearchText(args);
  if (!clean) {
    return {
      ...current,
      active: true,
      updatedAt: Date.now()
    };
  }
  if (/\b(dayandir|sondur|stop|off|legv)\b/.test(clean)) {
    return {
      ...current,
      active: false,
      updatedAt: Date.now()
    };
  }
  let next = {
    ...current,
    active: true,
    updatedAt: Date.now()
  };
  const hourMatch = clean.match(/\b(\d{1,2})(?::00)?\b/);
  if (hourMatch) {
    const h = Number.parseInt(hourMatch[1], 10);
    if (h >= 5 && h <= 22) {
      next = { ...next, hourBaku: h };
    }
  }
  const cityCandidate = clean.replace(/\b(\d{1,2})(?::00)?\b/g, " ").replace(/\s+/g, " ").trim();
  if (cityCandidate && !/\b(aktiv|ac|on|start|basla)\b/.test(cityCandidate)) {
    const matchedCity = findCityForTelegramQuery(cityCandidate);
    next = { ...next, cityId: matchedCity.id };
  }
  return next;
}
function formatSubscriptionSettingsMessage(origin, sub) {
  const baseUrl = normalizeBaseUrl(origin);
  const city = WORLD_PRAYER_CITIES.find((c) => c.id === sub.cityId) ?? WORLD_PRAYER_CITIES[0];
  const hourStr = `${String(sub.hourBaku).padStart(2, "0")}:00`;
  const lines = [
    "<b>\u{1F514} G\xFCnd\u0259lik Telegram Bildiri\u015Fl\u0259ri (/abune)</b>",
    "",
    `<b>Status:</b> ${sub.active ? "\u2705 Aktivdir" : "\u23F8 Dayand\u0131r\u0131l\u0131b"}`,
    `<b>\u015E\u0259h\u0259r:</b> ${escapeTelegramHtml(city.name)}`,
    `<b>Saat (Bak\u0131):</b> <code>${hourStr}</code>`,
    "",
    "<b>Se\xE7ilmi\u015F paketl\u0259r:</b>",
    `${sub.fridayKahf ? "\u2705" : "\u2B1C\uFE0F"} C\xFCm\u0259 g\xFCn\xFC K\u0259hf sur\u0259si xat\u0131rlatmas\u0131`,
    `${sub.dailyVerseZikr ? "\u2705" : "\u2B1C\uFE0F"} G\xFCn\xFCn ay\u0259si v\u0259 S\u0259h\u0259r/Ax\u015Fam zikri`,
    `${sub.dailyPrayer ? "\u2705" : "\u2B1C\uFE0F"} G\xFCnd\u0259lik namaz / Ramazan c\u0259dv\u0259li`,
    "",
    "<i>A\u015Fa\u011F\u0131dak\u0131 d\xFCym\u0259l\u0259rl\u0259 \u015F\u0259h\u0259r, saat v\u0259 ya paketl\u0259ri d\u0259yi\u015F\u0259 bil\u0259rsiniz (v\u0259 ya /abune G\u0259nc\u0259 08 yaz\u0131n):</i>"
  ];
  const cityRow1 = SUBSCRIPTION_CITY_IDS.slice(0, 4).map((id) => {
    const c = WORLD_PRAYER_CITIES.find((item) => item.id === id) ?? WORLD_PRAYER_CITIES[0];
    return {
      text: id === sub.cityId ? `\u2713 ${c.name}` : c.name,
      callback_data: `sub:city:${id}`
    };
  });
  const cityRow2 = SUBSCRIPTION_CITY_IDS.slice(4, 8).map((id) => {
    const c = WORLD_PRAYER_CITIES.find((item) => item.id === id) ?? WORLD_PRAYER_CITIES[0];
    return {
      text: id === sub.cityId ? `\u2713 ${c.name}` : c.name,
      callback_data: `sub:city:${id}`
    };
  });
  const hourRow = SUBSCRIPTION_HOURS_BAKU.map((h) => ({
    text: h === sub.hourBaku ? `\u2713 ${String(h).padStart(2, "0")}:00` : `${String(h).padStart(2, "0")}`,
    callback_data: `sub:hour:${h}`
  }));
  return {
    text: lines.join("\n"),
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: sub.active ? "\u23F8 Abun\u0259liyi Dayand\u0131r" : "\u2705 Abun\u0259liyi Aktivl\u0259\u015Fdir",
            callback_data: "sub:tog:active"
          },
          {
            text: "\u{1F4E8} N\xFCmun\u0259ni \u0130ndi G\xF6nd\u0259r",
            callback_data: "sub:test"
          }
        ],
        [
          {
            text: `${sub.fridayKahf ? "\u2713" : "\u25CB"} C\xFCm\u0259 K\u0259hf`,
            callback_data: "sub:tog:kahf"
          },
          {
            text: `${sub.dailyVerseZikr ? "\u2713" : "\u25CB"} Ay\u0259 & Zikr`,
            callback_data: "sub:tog:verse"
          },
          {
            text: `${sub.dailyPrayer ? "\u2713" : "\u25CB"} Namaz C\u0259dv\u0259li`,
            callback_data: "sub:tog:prayer"
          }
        ],
        cityRow1,
        cityRow2,
        hourRow,
        [
          {
            text: "\u{1F4C5} T\u0259qvim & Namaz Vaxtlar\u0131",
            web_app: { url: `${baseUrl}/namaz-vaxtlari` }
          }
        ]
      ]
    }
  };
}
function buildDailyDigestMessage(origin, sub, now = /* @__PURE__ */ new Date()) {
  if (!sub.active) return null;
  if (!sub.fridayKahf && !sub.dailyVerseZikr && !sub.dailyPrayer) return null;
  const baseUrl = normalizeBaseUrl(origin);
  const city = WORLD_PRAYER_CITIES.find((c) => c.id === sub.cityId) ?? WORLD_PRAYER_CITIES[0];
  const bakuDate = getBakuDateParts(now);
  const hijri = getHijriPartsUmmAlQura(now, "Asia/Baku");
  const verse = getCuratedVerseForDate(now);
  const dayIndex = Math.abs(Math.floor(now.getTime() / 864e5));
  const preferredZikrCat = sub.hourBaku >= 16 ? "axsam" : "seher";
  const zikrPool = getAzkarByCategory(preferredZikrCat);
  const zikrItem = zikrPool[dayIndex % Math.max(1, zikrPool.length)];
  const prayerSchedule = calculateWeeklyPrayerSchedule(city, now, 1)[0];
  const sections = [
    `<b>\u2600\uFE0F G\xFCnd\u0259lik Ruhani Xat\u0131rlatma \u2014 ${escapeTelegramHtml(city.name)}</b>`,
    `<i>${escapeTelegramHtml(hijri.formatted)}</i>`
  ];
  const inlineButtons = [];
  if (sub.fridayKahf && bakuDate.isFriday) {
    sections.push(
      "",
      "<b>\u{1F54C} C\xFCm\u0259niz M\xFCbar\u0259k! \u2014 K\u0259hf Sur\u0259si</b>",
      "Bu g\xFCn C\xFCm\u0259 g\xFCn\xFCd\xFCr. K\u0259hf sur\u0259sini (18-ci sur\u0259) oxumaq v\u0259 ya s\u0259sli dinl\u0259m\u0259k iki c\xFCm\u0259 aras\u0131n\u0131 nurland\u0131rar."
    );
    inlineButtons.push([
      { text: "\u{1F3A7} K\u0259hf Sur\u0259sini Dinl\u0259", callback_data: "amenu:18:1:afasy" },
      { text: "\u{1F4D6} K\u0259hfi Oxu", web_app: { url: `${baseUrl}/quran/sure/18` } }
    ]);
  }
  if (sub.dailyVerseZikr) {
    sections.push(
      "",
      `<b>\u2728 G\xFCn\xFCn Ay\u0259si (${escapeTelegramHtml(verse.surahName)} ${verse.surahNumber}:${verse.ayahNumber}):</b>`,
      `${escapeTelegramHtml(verse.arabicText)}`,
      `\xAB${escapeTelegramHtml(verse.translation)}\xBB`,
      "",
      `<b>\u{1F319} Zikr (${escapeTelegramHtml(zikrItem.title)}):</b>`,
      `\xAB${escapeTelegramHtml(zikrItem.translation)}\xBB`
    );
    inlineButtons.push([
      {
        text: "\u{1F5BC} Ay\u0259 Kart\u0131 Al",
        callback_data: `kart:${verse.surahNumber}:${verse.ayahNumber}:emerald`
      },
      {
        text: "\u{1F3A7} Ay\u0259ni Dinl\u0259",
        callback_data: `amenu:${verse.surahNumber}:${verse.ayahNumber}:afasy`
      }
    ]);
  }
  if (sub.dailyPrayer && prayerSchedule) {
    const timesLine = prayerSchedule.times.map((t) => `${escapeTelegramHtml(t.label)}: <code>${escapeTelegramHtml(t.formattedTime)}</code>`).join(" \xB7 ");
    sections.push(
      "",
      `<b>\u{1F54B} Namaz Vaxtlar\u0131 (${escapeTelegramHtml(city.name)}):</b>`,
      timesLine
    );
  }
  inlineButtons.push([
    { text: "\u2699\uFE0F Abun\u0259liyi \u0130dar\u0259 Et", callback_data: "sub:menu" }
  ]);
  return {
    text: sections.join("\n"),
    reply_markup: { inline_keyboard: inlineButtons }
  };
}

// src/server/telegramSubscriptions.ts
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
var LOCAL_DATA_DIR = path.resolve(process.cwd(), ".data");
var LOCAL_SUBS_FILE = path.join(LOCAL_DATA_DIR, "telegram-subscriptions.json");
var KV_SET_KEY = "qq:telegram_sub_chats_v1";
var KV_REC_PREFIX = "qq:telegram_sub_rec_v1:";
var KV_SENT_PREFIX = "qq:telegram_sub_sent_v1:";
var memorySubscriptions = /* @__PURE__ */ new Map();
var memorySentDayByChat = /* @__PURE__ */ new Map();
var localDiskLoaded = false;
function getEncryptionSecret(botToken) {
  return String(process.env.TELEGRAM_SUB_ENCRYPTION_KEY ?? "").trim() || String(process.env.TELEGRAM_WEBHOOK_SECRET ?? "").trim() || botToken || "quran-qiraeti-sub-fallback-secret-v1";
}
function deriveAesKey(secret) {
  return crypto.createHmac("sha256", secret).update("quran-qiraeti-sub-aes256-v1").digest();
}
function hashTelegramChatId(chatId, secretSource) {
  return crypto.createHmac("sha256", getEncryptionSecret(secretSource)).update(`chat:${String(chatId)}`).digest("hex");
}
function encryptSubscriptionPayload(sub, secretSource) {
  const key = deriveAesKey(getEncryptionSecret(secretSource));
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const compact = JSON.stringify({
    c: sub.chatId,
    a: sub.active ? 1 : 0,
    y: sub.cityId,
    h: sub.hourBaku,
    k: sub.fridayKahf ? 1 : 0,
    v: sub.dailyVerseZikr ? 1 : 0,
    p: sub.dailyPrayer ? 1 : 0,
    u: sub.updatedAt,
    ...sub.lastSentDateKey ? { l: sub.lastSentDateKey } : {}
  });
  const encrypted = Buffer.concat([cipher.update(compact, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}
function decryptSubscriptionPayload(encryptedPayload, secretSource) {
  try {
    const parts = String(encryptedPayload ?? "").split(":");
    if (parts.length !== 3) return null;
    const iv = Buffer.from(parts[0], "hex");
    const tag = Buffer.from(parts[1], "hex");
    const data = Buffer.from(parts[2], "hex");
    if (iv.length !== 12 || tag.length !== 16 || data.length === 0) return null;
    const key = deriveAesKey(getEncryptionSecret(secretSource));
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(plain);
    if (!parsed.c) return null;
    return normalizeTelegramSubscription({
      chatId: parsed.c,
      active: parsed.a !== 0,
      cityId: parsed.y,
      hourBaku: parsed.h,
      fridayKahf: parsed.k !== 0,
      dailyVerseZikr: parsed.v !== 0,
      dailyPrayer: parsed.p !== 0,
      updatedAt: parsed.u,
      ...parsed.l ? { lastSentDateKey: parsed.l } : {}
    });
  } catch {
    return null;
  }
}
function getKvConfig() {
  const url = String(
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? ""
  ).trim();
  const token = String(
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ""
  ).trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}
async function kvCommand(args) {
  const cfg = getKvConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(4e3)
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.result ?? null;
  } catch {
    return null;
  }
}
function loadLocalDiskOnce(secretSource) {
  if (localDiskLoaded) return;
  localDiskLoaded = true;
  if (process.env.VERCEL) return;
  try {
    if (!fs.existsSync(LOCAL_SUBS_FILE)) return;
    const raw = fs.readFileSync(LOCAL_SUBS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.events)) {
      for (const ev of parsed.events) {
        const dec = decryptSubscriptionPayload(ev.encryptedPayload, secretSource);
        if (dec) {
          const prev = memorySubscriptions.get(dec.chatId);
          if (!prev || dec.updatedAt >= prev.updatedAt) {
            memorySubscriptions.set(dec.chatId, dec);
          }
        }
      }
    }
    if (parsed?.sentByHash && typeof parsed.sentByHash === "object") {
      for (const [k, v] of Object.entries(parsed.sentByHash)) {
        if (typeof v === "string") memorySentDayByChat.set(k, v);
      }
    }
  } catch {
  }
}
function persistLocalDisk(secretSource) {
  if (process.env.VERCEL) return;
  try {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    const events = Array.from(memorySubscriptions.values()).map(
      (sub) => ({
        eventId: `sub-${hashTelegramChatId(sub.chatId, secretSource).slice(0, 16)}-${sub.updatedAt}`,
        chatHash: hashTelegramChatId(sub.chatId, secretSource),
        encryptedPayload: encryptSubscriptionPayload(sub, secretSource),
        active: sub.active,
        hourBaku: sub.hourBaku,
        createdAtMs: sub.updatedAt
      })
    );
    const sentByHash = {};
    for (const [k, v] of memorySentDayByChat.entries()) {
      sentByHash[k] = v;
    }
    fs.writeFileSync(LOCAL_SUBS_FILE, JSON.stringify({ events, sentByHash }, null, 2), "utf-8");
  } catch {
  }
}
async function writeEncryptedEventToFirestore(event) {
  const projectId = firebase_applet_config_default.projectId;
  const dbId = firebase_applet_config_default.firestoreDatabaseId;
  const apiKey = firebase_applet_config_default.apiKey;
  if (!projectId || !dbId || !apiKey) return false;
  const docName = `projects/${projectId}/databases/${dbId}/documents/telegram_sub_events/${event.eventId}`;
  const commitUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(dbId)}/documents:commit?key=${encodeURIComponent(apiKey)}`;
  try {
    const res = await fetch(commitUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        writes: [
          {
            currentDocument: { exists: false },
            update: {
              name: docName,
              fields: {
                eventId: { stringValue: event.eventId },
                chatHash: { stringValue: event.chatHash },
                encryptedPayload: { stringValue: event.encryptedPayload },
                active: { booleanValue: event.active },
                hourBaku: { integerValue: String(event.hourBaku) }
              }
            },
            updateTransforms: [
              {
                fieldPath: "createdAt",
                setToServerValue: "REQUEST_TIME"
              }
            ]
          }
        ]
      }),
      signal: AbortSignal.timeout(4500)
    });
    return res.ok;
  } catch {
    return false;
  }
}
async function readSubscriptionsFromFirestore(adminIdToken, secretSource) {
  if (!adminIdToken) return [];
  const projectId = firebase_applet_config_default.projectId;
  const dbId = firebase_applet_config_default.firestoreDatabaseId;
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(dbId)}/documents/telegram_sub_events?pageSize=500`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${adminIdToken}` },
      signal: AbortSignal.timeout(6e3)
    });
    if (!res.ok) return [];
    const json = await res.json();
    const decoded = [];
    for (const doc of json?.documents ?? []) {
      const cipher = doc.fields?.encryptedPayload?.stringValue;
      if (!cipher) continue;
      const item = decryptSubscriptionPayload(cipher, secretSource);
      if (item) decoded.push(item);
    }
    return decoded;
  } catch {
    return [];
  }
}
async function getSubscriptionForChat(chatId, secretSource) {
  loadLocalDiskOnce(secretSource);
  const key = String(chatId);
  const fromMem = memorySubscriptions.get(key);
  if (fromMem) return fromMem;
  const chatHash = hashTelegramChatId(key, secretSource);
  const fromKv = await kvCommand(["GET", `${KV_REC_PREFIX}${chatHash}`]);
  if (fromKv) {
    const dec = decryptSubscriptionPayload(fromKv, secretSource);
    if (dec) {
      memorySubscriptions.set(dec.chatId, dec);
      return dec;
    }
  }
  return null;
}
async function saveSubscription(sub, secretSource) {
  loadLocalDiskOnce(secretSource);
  const normalized = normalizeTelegramSubscription({
    ...sub,
    updatedAt: Date.now()
  });
  memorySubscriptions.set(normalized.chatId, normalized);
  persistLocalDisk(secretSource);
  const chatHash = hashTelegramChatId(normalized.chatId, secretSource);
  const encryptedPayload = encryptSubscriptionPayload(normalized, secretSource);
  const eventId = `sub-${chatHash.slice(0, 14)}-${normalized.updatedAt.toString(36)}`;
  const event = {
    eventId,
    chatHash,
    encryptedPayload: encryptedPayload.slice(0, 1024),
    active: normalized.active,
    hourBaku: normalized.hourBaku,
    createdAtMs: normalized.updatedAt
  };
  await Promise.allSettled([
    writeEncryptedEventToFirestore(event),
    (async () => {
      await kvCommand(["SADD", KV_SET_KEY, chatHash]);
      await kvCommand(["SET", `${KV_REC_PREFIX}${chatHash}`, event.encryptedPayload]);
    })()
  ]);
  return normalized;
}
async function loadAllSubscriptions(secretSource, adminIdToken) {
  loadLocalDiskOnce(secretSource);
  const allRecords = [...memorySubscriptions.values()];
  const storageModes = [process.env.VERCEL ? "memory" : "local-file"];
  const kvCfg = getKvConfig();
  if (kvCfg) {
    storageModes.push("kv-redis");
    const hashes = await kvCommand(["SMEMBERS", KV_SET_KEY]);
    if (Array.isArray(hashes) && hashes.length > 0) {
      const kvPayloads = await Promise.all(
        hashes.slice(0, 500).map((h) => kvCommand(["GET", `${KV_REC_PREFIX}${h}`]))
      );
      for (const cipher of kvPayloads) {
        if (!cipher) continue;
        const dec = decryptSubscriptionPayload(cipher, secretSource);
        if (dec) allRecords.push(dec);
      }
    }
  }
  if (adminIdToken) {
    const fsRecords = await readSubscriptionsFromFirestore(adminIdToken, secretSource);
    if (fsRecords.length > 0) {
      storageModes.push("firestore");
      allRecords.push(...fsRecords);
    }
  }
  const reduced = reduceSubscriptionEvents(allRecords);
  for (const item of reduced) {
    memorySubscriptions.set(item.chatId, item);
  }
  return { subscriptions: reduced, storageModes };
}
async function hasSentDigestToday(chatId, dateKey, secretSource) {
  loadLocalDiskOnce(secretSource);
  const chatHash = hashTelegramChatId(chatId, secretSource);
  if (memorySentDayByChat.get(chatHash) === dateKey) return true;
  const fromKv = await kvCommand(["GET", `${KV_SENT_PREFIX}${chatHash}`]);
  if (fromKv === dateKey) {
    memorySentDayByChat.set(chatHash, dateKey);
    return true;
  }
  return false;
}
async function markDigestSentToday(chatId, dateKey, secretSource) {
  loadLocalDiskOnce(secretSource);
  const chatHash = hashTelegramChatId(chatId, secretSource);
  memorySentDayByChat.set(chatHash, dateKey);
  persistLocalDisk(secretSource);
  await kvCommand(["SET", `${KV_SENT_PREFIX}${chatHash}`, dateKey, "EX", 172800]);
}
function buildSubscriberSummaryStats(subscriptions, storageModes) {
  const activeSubs = subscriptions.filter((s) => s.active);
  const cityCounts = /* @__PURE__ */ new Map();
  const hourCounts = /* @__PURE__ */ new Map();
  for (const s of activeSubs) {
    cityCounts.set(s.cityId, (cityCounts.get(s.cityId) ?? 0) + 1);
    hourCounts.set(s.hourBaku, (hourCounts.get(s.hourBaku) ?? 0) + 1);
  }
  return {
    totalTracked: subscriptions.length,
    activeCount: activeSubs.length,
    pausedCount: subscriptions.length - activeSubs.length,
    fridayKahfCount: activeSubs.filter((s) => s.fridayKahf).length,
    dailyVerseZikrCount: activeSubs.filter((s) => s.dailyVerseZikr).length,
    dailyPrayerCount: activeSubs.filter((s) => s.dailyPrayer).length,
    cityBreakdown: Array.from(cityCounts.entries()).map(([cityId, count]) => ({ cityId, count })).sort((a, b) => b.count - a.count),
    hourBreakdown: Array.from(hourCounts.entries()).map(([hourBaku, count]) => ({ hourBaku, count })).sort((a, b) => a.hourBaku - b.hourBaku),
    storageModes
  };
}

// src/server/verseCardSvg.ts
import fs2 from "node:fs";
import path2 from "node:path";
import { Resvg } from "@resvg/resvg-js";

// src/lib/verseCard.ts
function wrapTextLines(text, maxCharsPerLine, maxLines = 12) {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return [];
  const limit = Math.max(8, maxCharsPerLine);
  const words = clean.split(" ");
  const lines = [];
  let current = "";
  let truncated = false;
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!current) {
      current = word;
      continue;
    }
    if (`${current} ${word}`.length <= limit) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      if (lines.length >= maxLines) {
        truncated = true;
        current = "";
        break;
      }
      current = word;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  if (truncated && lines.length > 0) {
    const lastIdx = lines.length - 1;
    const last = lines[lastIdx];
    lines[lastIdx] = last.length > 3 ? `${last.slice(0, last.length - 1)}\u2026` : `${last}\u2026`;
  }
  return lines;
}
function buildVerseReferenceLine(surahName, surahNumber, ayahNumber) {
  return `${surahName} sur\u0259si \xB7 ${surahNumber}:${ayahNumber} \xB7 \u018Flixan Musayev t\u0259rc\xFCm\u0259si`;
}

// src/server/verseCardSvg.ts
function escapeXml2(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function resolveFontFiles() {
  const candidateDirs = [
    path2.resolve(process.cwd(), "dist", "fonts"),
    path2.resolve(process.cwd(), "public", "fonts")
  ];
  const filenames = [
    "NotoNaskhArabic-Regular.ttf",
    "NotoSans-Regular.ttf",
    "NotoSans-Bold.ttf"
  ];
  for (const dir of candidateDirs) {
    const resolved = filenames.map((name) => path2.join(dir, name)).filter((p) => fs2.existsSync(p));
    if (resolved.length === filenames.length) {
      return resolved;
    }
  }
  const anyFound = [];
  for (const dir of candidateDirs) {
    for (const name of filenames) {
      const p = path2.join(dir, name);
      if (fs2.existsSync(p) && !anyFound.includes(p)) {
        anyFound.push(p);
      }
    }
  }
  return anyFound;
}
function stripArabicDiacriticsForMeasure(text) {
  return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");
}
function wrapArabicByVisibleChars(text, maxVisibleCharsPerLine, maxLines) {
  const clean = text.trim().replace(/\u2026/g, "").replace(/\s+/g, " ");
  if (!clean) return [];
  const words = clean.split(" ");
  const lines = [];
  let current = "";
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!current) {
      current = word;
      continue;
    }
    const nextCandidate = `${current} ${word}`;
    if (stripArabicDiacriticsForMeasure(nextCandidate).length <= maxVisibleCharsPerLine) {
      current = nextCandidate;
    } else {
      lines.push(current);
      if (lines.length >= maxLines) {
        current = "";
        break;
      }
      current = word;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}
function buildVerseCardSvg(input) {
  const format = input.format === "square" ? "square" : "story";
  const theme = input.theme === "parchment" ? "parchment" : "emerald";
  const width = 1080;
  const height = format === "story" ? 1920 : 1080;
  const isEmerald = theme === "emerald";
  const bgTop = isEmerald ? "#0B1B16" : "#FBF8F1";
  const bgBottom = isEmerald ? "#122922" : "#F2ECE0";
  const cardSurface = isEmerald ? "#10241D" : "#FFFDF8";
  const frameStroke = isEmerald ? "rgba(198, 167, 105, 0.36)" : "rgba(15, 76, 58, 0.18)";
  const accentColor = isEmerald ? "#D4B475" : "#0F4C3A";
  const primaryText = isEmerald ? "#F5F2EA" : "#17191C";
  const secondaryText = isEmerald ? "#DAE3DF" : "#2C3135";
  const mutedText = isEmerald ? "#9BB0A8" : "#66635E";
  const medallionBg = isEmerald ? "#16342A" : "#EFE8D8";
  const visibleArabicLen = stripArabicDiacriticsForMeasure(input.arabicText).length;
  const transLen = input.translation.trim().length;
  let arabicFontSize;
  let arabicVisibleChars;
  let arabicMaxLines;
  let transFontSize;
  let transMaxChars;
  let transMaxLines;
  if (format === "story") {
    if (visibleArabicLen <= 120) {
      arabicFontSize = 56;
      arabicVisibleChars = 28;
      arabicMaxLines = 6;
    } else if (visibleArabicLen <= 280) {
      arabicFontSize = 44;
      arabicVisibleChars = 34;
      arabicMaxLines = 10;
    } else {
      arabicFontSize = 36;
      arabicVisibleChars = 40;
      arabicMaxLines = 14;
    }
    if (transLen <= 200) {
      transFontSize = 34;
      transMaxChars = 40;
      transMaxLines = 8;
    } else if (transLen <= 480) {
      transFontSize = 28;
      transMaxChars = 48;
      transMaxLines = 14;
    } else {
      transFontSize = 24;
      transMaxChars = 54;
      transMaxLines = 18;
    }
  } else {
    if (visibleArabicLen <= 120) {
      arabicFontSize = 48;
      arabicVisibleChars = 30;
      arabicMaxLines = 4;
    } else if (visibleArabicLen <= 260) {
      arabicFontSize = 38;
      arabicVisibleChars = 38;
      arabicMaxLines = 7;
    } else {
      arabicFontSize = 31;
      arabicVisibleChars = 44;
      arabicMaxLines = 8;
    }
    if (transLen <= 180) {
      transFontSize = 30;
      transMaxChars = 46;
      transMaxLines = 5;
    } else if (transLen <= 420) {
      transFontSize = 24;
      transMaxChars = 56;
      transMaxLines = 8;
    } else {
      transFontSize = 21;
      transMaxChars = 64;
      transMaxLines = 9;
    }
  }
  const arabicLines = wrapArabicByVisibleChars(input.arabicText, arabicVisibleChars, arabicMaxLines);
  const transLines = wrapTextLines(`\xAB${input.translation}\xBB`, transMaxChars, transMaxLines);
  const arabicLineHeight = Math.round(arabicFontSize * 1.68);
  const transLineHeight = Math.round(transFontSize * 1.46);
  const dividerGap = format === "story" ? 68 : 44;
  const arabicBlockHeight = arabicLines.length * arabicLineHeight;
  const transBlockHeight = transLines.length * transLineHeight;
  const totalBlockHeight = arabicBlockHeight + dividerGap + transBlockHeight;
  const headerBaseline = format === "story" ? 164 : 112;
  const footerTop = format === "story" ? height - 168 : height - 114;
  const availableTop = headerBaseline + (format === "story" ? 76 : 46);
  const availableBottom = footerTop - (format === "story" ? 64 : 42);
  const contentTop = Math.max(
    availableTop,
    Math.round(availableTop + (availableBottom - availableTop - totalBlockHeight) / 2)
  );
  const arabicElements = arabicLines.map((line, i) => {
    const y = contentTop + arabicFontSize + i * arabicLineHeight;
    return `<text x="${width / 2}" y="${y}" text-anchor="middle" direction="rtl" unicode-bidi="bidi-override" fill="${primaryText}" font-family="Noto Naskh Arabic" font-size="${arabicFontSize}">${escapeXml2(line)}</text>`;
  }).join("\n    ");
  const dividerY = contentTop + arabicBlockHeight + Math.round(dividerGap / 2);
  const transStartY = dividerY + Math.round(dividerGap / 2) + transFontSize;
  const transElements = transLines.map((line, i) => {
    const y = transStartY + i * transLineHeight;
    return `<text x="${width / 2}" y="${y}" text-anchor="middle" fill="${secondaryText}" font-family="Noto Sans" font-size="${transFontSize}">${escapeXml2(line)}</text>`;
  }).join("\n    ");
  const refLine = buildVerseReferenceLine(input.surahName, input.surahNumber, input.ayahNumber);
  const pad = format === "story" ? 58 : 48;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bgTop}" />
      <stop offset="100%" stop-color="${bgBottom}" />
    </linearGradient>
    <radialGradient id="topGlow" cx="50%" cy="18%" r="55%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="${isEmerald ? "0.14" : "0.07"}" />
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#cardBg)" />
  <rect width="${width}" height="${height}" fill="url(#topGlow)" />

  <rect x="${pad}" y="${pad}" width="${width - pad * 2}" height="${height - pad * 2}" rx="28" fill="${cardSurface}" fill-opacity="0.72" stroke="${frameStroke}" stroke-width="2" />
  <rect x="${pad + 14}" y="${pad + 14}" width="${width - (pad + 14) * 2}" height="${height - (pad + 14) * 2}" rx="20" fill="none" stroke="${frameStroke}" stroke-opacity="0.45" stroke-width="1" />

  <text x="${width / 2}" y="${headerBaseline}" text-anchor="middle" fill="${accentColor}" font-family="Noto Sans" font-weight="700" font-size="24" letter-spacing="5">QURAN Q\u0130RA\u018FT\u0130</text>
  <line x1="${width / 2 - 110}" y1="${headerBaseline + 26}" x2="${width / 2 + 110}" y2="${headerBaseline + 26}" stroke="${frameStroke}" stroke-width="1.5" />

  <g>
    ${arabicElements}
  </g>

  <line x1="${width / 2 - 180}" y1="${dividerY}" x2="${width / 2 - 42}" y2="${dividerY}" stroke="${frameStroke}" stroke-width="1.5" />
  <circle cx="${width / 2}" cy="${dividerY}" r="24" fill="${medallionBg}" stroke="${accentColor}" stroke-width="1.5" />
  <text x="${width / 2}" y="${dividerY + 8}" text-anchor="middle" fill="${accentColor}" font-family="Noto Sans" font-weight="700" font-size="20">${input.ayahNumber}</text>
  <line x1="${width / 2 + 42}" y1="${dividerY}" x2="${width / 2 + 180}" y2="${dividerY}" stroke="${frameStroke}" stroke-width="1.5" />

  <g>
    ${transElements}
  </g>

  <line x1="${width / 2 - 140}" y1="${footerTop - 36}" x2="${width / 2 + 140}" y2="${footerTop - 36}" stroke="${frameStroke}" stroke-width="1" />
  <text x="${width / 2}" y="${footerTop}" text-anchor="middle" fill="${accentColor}" font-family="Noto Sans" font-weight="700" font-size="24">${escapeXml2(refLine)}</text>
  <text x="${width / 2}" y="${footerTop + 40}" text-anchor="middle" fill="${mutedText}" font-family="Noto Sans" font-size="20">@quranqiraeti \xB7 quranqiraeti.vercel.app</text>
</svg>`;
}
function renderVerseCardPngBuffer(input) {
  const svg = buildVerseCardSvg(input);
  const fontFiles = resolveFontFiles();
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: 1080
    },
    font: {
      fontFiles,
      loadSystemFonts: fontFiles.length === 0,
      defaultFontFamily: "Noto Sans"
    }
  });
  const rendered = resvg.render();
  return Buffer.from(rendered.asPng());
}

// src/server/telegram.ts
var DEFAULT_PUBLIC_ORIGIN = "https://quranqiraeti.vercel.app";
var BOOTSTRAPPED_ADMIN_EMAIL_SHA256 = "c00a9c2c72ba2c120b8edf90ac1584dd117552bdfca10d4c69808fa25f01534d";
var cachedBotUsername = "Quranqiraetibot";
function getTelegramBotToken() {
  return String(
    process.env.TELEGRAM_BOT_TOKEN ?? process.env.bot ?? process.env.BOT ?? ""
  ).trim();
}
function getTelegramWebhookSecret(token) {
  const explicit = String(process.env.TELEGRAM_WEBHOOK_SECRET ?? "").trim();
  if (explicit) return explicit;
  if (!token) return "";
  return crypto2.createHmac("sha256", token).update("quran-qiraeti-webhook-secret-v1").digest("hex").slice(0, 48);
}
function resolvePublicTelegramOrigin(reqOrigin) {
  const canonical = String(process.env.CANONICAL_ORIGIN ?? "").trim();
  if (canonical && /^https:\/\//i.test(canonical)) {
    return normalizeBaseUrl(canonical);
  }
  if (reqOrigin && /^https:\/\//i.test(reqOrigin) && !reqOrigin.includes("ais-dev-") && !reqOrigin.includes("127.0.0.1") && !reqOrigin.includes("localhost")) {
    return normalizeBaseUrl(reqOrigin);
  }
  return DEFAULT_PUBLIC_ORIGIN;
}
function verifyTimingSafeSecret(provided, expected) {
  if (!provided || !expected) return false;
  const providedDigest = crypto2.createHash("sha256").update(provided).digest();
  const expectedDigest = crypto2.createHash("sha256").update(expected).digest();
  return crypto2.timingSafeEqual(providedDigest, expectedDigest);
}
async function verifyFirebaseAdminBearer(authHeader) {
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const idToken = match?.[1]?.trim();
  if (!idToken) return false;
  try {
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebase_applet_config_default.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        signal: AbortSignal.timeout(5e3)
      }
    );
    if (!lookupRes.ok) return false;
    const lookupJson = await lookupRes.json();
    const user = lookupJson?.users?.[0];
    if (!user?.localId || !user?.emailVerified || !user?.email) return false;
    const emailHash = crypto2.createHash("sha256").update(user.email.trim().toLowerCase()).digest("hex");
    if (verifyTimingSafeSecret(emailHash, BOOTSTRAPPED_ADMIN_EMAIL_SHA256)) {
      return true;
    }
    const adminDocRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(firebase_applet_config_default.projectId)}/databases/${encodeURIComponent(firebase_applet_config_default.firestoreDatabaseId)}/documents/admins/${encodeURIComponent(user.localId)}`,
      {
        headers: { Authorization: `Bearer ${idToken}` },
        signal: AbortSignal.timeout(5e3)
      }
    );
    return adminDocRes.ok;
  } catch {
    return false;
  }
}
async function callTelegramApi(token, method, payload, timeoutMs = 6e3) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
    signal: AbortSignal.timeout(timeoutMs)
  });
  const data = await res.json();
  return {
    ok: Boolean(data?.ok),
    result: data?.result,
    description: data?.description
  };
}
async function sendTelegramHtmlMessage(token, chatId, text, replyMarkup) {
  await callTelegramApi(token, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...replyMarkup ? { reply_markup: replyMarkup } : {}
  });
}
async function editTelegramHtmlMessage(token, chatId, messageId, text, replyMarkup) {
  const res = await callTelegramApi(token, "editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...replyMarkup ? { reply_markup: replyMarkup } : {}
  });
  return res.ok;
}
async function sendTelegramAyahAudio(token, chatId, surahNumber, ayahNumber, reciterInput) {
  const surah = findSurahForTelegramQuery(String(surahNumber));
  if (!surah || ayahNumber < 1 || ayahNumber > surah.ayahCount) return;
  const reciter = resolveMuhaffizReciter(reciterInput);
  const audioUrl = getTelegramAyahAudioUrl(surah.number, ayahNumber, reciter.id);
  await callTelegramApi(token, "sendAudio", {
    chat_id: chatId,
    audio: audioUrl,
    title: `${surah.name} sur\u0259si (${surah.number}:${ayahNumber})`,
    performer: reciter.label,
    caption: `\u{1F3A7} ${surah.name} sur\u0259si, ${surah.number}:${ayahNumber} \xB7 ${reciter.label}`
  });
}
async function sendTelegramFullSurahAudio(token, origin, chatId, surahNumber, reciterInput) {
  const surah = findSurahForTelegramQuery(String(surahNumber));
  if (!surah) return;
  const reciter = resolveMuhaffizReciter(reciterInput);
  const audioUrl = getTelegramSurahAudioUrl(surah.number, reciter.id);
  const baseUrl = normalizeBaseUrl(origin);
  let contentLengthBytes = 0;
  try {
    const head = await fetch(audioUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(2500)
    });
    if (head.ok) {
      contentLengthBytes = Number.parseInt(head.headers.get("content-length") ?? "0", 10) || 0;
    }
  } catch {
  }
  if (contentLengthBytes === 0 || contentLengthBytes <= 195e5) {
    const sent = await callTelegramApi(
      token,
      "sendAudio",
      {
        chat_id: chatId,
        audio: audioUrl,
        title: `${surah.number}. ${surah.name} sur\u0259si (Tam)`,
        performer: reciter.label,
        caption: `\u{1F4C0} ${surah.number}. ${surah.name} sur\u0259si (Tam tilav\u0259t) \xB7 ${reciter.label}`
      },
      15e3
    );
    if (sent.ok) return;
  }
  const sizeMb = contentLengthBytes > 0 ? ` (~${(contentLengthBytes / 1048576).toFixed(1)} MB)` : "";
  await sendTelegramHtmlMessage(
    token,
    chatId,
    [
      `<b>\u{1F4C0} ${surah.number}. ${escapeTelegramHtml(surah.name)} sur\u0259si (Tam Tilav\u0259t)</b>`,
      `\u{1F399} <b>Qari:</b> ${escapeTelegramHtml(reciter.label)}${escapeTelegramHtml(sizeMb)}`,
      "",
      "Uzun sur\u0259 MP3 fayl\u0131 Telegram bot limiti (20 MB) \xFCz\u0259rind\u0259 oldu\u011Fu \xFC\xE7\xFCn birba\u015Fa audio link v\u0259 ya t\u0259tbiq pleyeri il\u0259 fasil\u0259siz dinl\u0259y\u0259 bil\u0259rsiniz:"
    ].join("\n"),
    {
      inline_keyboard: [
        [{ text: `\u{1F3A7} MP3-ni Dinl\u0259 / Endir (${reciter.shortLabel})`, url: audioUrl }],
        [
          {
            text: `\u{1F4D6} Mini App-d\u0259 Fasil\u0259siz Dinl\u0259`,
            web_app: {
              url: `${baseUrl}/quran/sure/${surah.number}?reciter=${encodeURIComponent(reciter.id)}&audioMode=surah`
            }
          }
        ]
      ]
    }
  );
}
async function resolveVersePayloadForBot(surahNumber, ayahNumber, deps) {
  const surahMeta = findSurahForTelegramQuery(String(surahNumber)) ?? findSurahForTelegramQuery("2");
  const clampedAyah = Math.max(1, Math.min(surahMeta.ayahCount, Math.trunc(ayahNumber || 1)));
  const curated = CURATED_TELEGRAM_VERSES.find(
    (v) => v.surahNumber === surahMeta.number && v.ayahNumber === clampedAyah
  );
  try {
    const payload = await Promise.race([
      deps.fetchSurahTranslation(surahMeta.number),
      new Promise((resolve) => setTimeout(() => resolve(void 0), 2400))
    ]);
    const hit = payload?.ayahs?.find((a) => a.ayahNumber === clampedAyah);
    if (hit && hit.arabicText && hit.translation) {
      return {
        surahNumber: surahMeta.number,
        surahName: surahMeta.name,
        ayahNumber: clampedAyah,
        arabicText: hit.arabicText,
        translation: hit.translation
      };
    }
  } catch {
  }
  if (curated) return curated;
  return {
    surahNumber: surahMeta.number,
    surahName: surahMeta.name,
    ayahNumber: clampedAyah,
    arabicText: `${surahMeta.arabicName} \uFD3F${clampedAyah}\uFD3E`,
    translation: `${surahMeta.name} sur\u0259si, ${clampedAyah}-ci ay\u0259 (Tam m\u0259tni t\u0259tbiqd\u0259 oxuya bil\u0259rsiniz).`
  };
}
async function sendTelegramVerseCardPhoto(token, origin, chatId, verse, theme = "emerald", format = "story") {
  const baseUrl = normalizeBaseUrl(origin);
  const pngBuffer = renderVerseCardPngBuffer({
    surahName: verse.surahName,
    surahNumber: verse.surahNumber,
    ayahNumber: verse.ayahNumber,
    arabicText: verse.arabicText,
    translation: verse.translation,
    theme,
    format
  });
  const altTheme = theme === "emerald" ? "parchment" : "emerald";
  const altFormat = format === "story" ? "square" : "story";
  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: altTheme === "parchment" ? "\u{1F324} A\xE7\u0131q Tema (Par\u015F\xF6men)" : "\u{1F311} Z\xFCmr\xFCd Tema",
          callback_data: `kart:${verse.surahNumber}:${verse.ayahNumber}:${altTheme}:${format}`
        },
        {
          text: altFormat === "square" ? "\u{1F7E6} Kvadrat (1:1)" : "\u{1F4F1} Story (9:16)",
          callback_data: `kart:${verse.surahNumber}:${verse.ayahNumber}:${theme}:${altFormat}`
        }
      ],
      [
        {
          text: "\u{1F3A7} S\u0259sli Dinl\u0259",
          callback_data: `amenu:${verse.surahNumber}:${verse.ayahNumber}:afasy`
        },
        {
          text: "\u{1F4D6} Sur\u0259d\u0259 A\xE7",
          web_app: {
            url: `${baseUrl}/quran/sure/${verse.surahNumber}#ayah-${verse.ayahNumber}`
          }
        }
      ]
    ]
  };
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append(
    "photo",
    new Blob([new Uint8Array(pngBuffer)], { type: "image/png" }),
    `quranqiraeti-${verse.surahNumber}-${verse.ayahNumber}-${format}.png`
  );
  form.append(
    "caption",
    [
      `<b>\u{1F5BC} ${escapeTelegramHtml(verse.surahName)} sur\u0259si, ${verse.surahNumber}:${verse.ayahNumber}</b>`,
      `\xAB${escapeTelegramHtml(verse.translation.slice(0, 260))}\xBB`,
      "<i>@quranqiraeti \xB7 WhatsApp Status / Instagram Story \xFC\xE7\xFCn haz\u0131rd\u0131r</i>"
    ].join("\n")
  );
  form.append("parse_mode", "HTML");
  form.append("reply_markup", JSON.stringify(replyMarkup));
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(12e3)
    });
    const data = await res.json();
    return Boolean(data?.ok);
  } catch {
    return false;
  }
}
async function registerBotWebhookAndMenu(token, webhookSecret, origin) {
  const webhookUrl = `${origin}/api/telegram/webhook`;
  const [webhookRes, commandsRes, menuRes] = await Promise.all([
    callTelegramApi(token, "setWebhook", {
      url: webhookUrl,
      secret_token: webhookSecret,
      allowed_updates: ["message", "callback_query", "inline_query"]
    }),
    callTelegramApi(token, "setMyCommands", {
      commands: TELEGRAM_BOT_COMMANDS
    }),
    callTelegramApi(token, "setChatMenuButton", {
      menu_button: {
        type: "web_app",
        text: "\u{1F4D6} Quran\u0131 A\xE7",
        web_app: { url: `${origin}/quran` }
      }
    })
  ]);
  return {
    ok: webhookRes.ok && commandsRes.ok && menuRes.ok,
    webhookUrl,
    webhookSet: webhookRes.ok,
    commandsSet: commandsRes.ok,
    menuButtonSet: menuRes.ok,
    error: !webhookRes.ok ? webhookRes.description : void 0
  };
}
async function handleQuranTextSearch(origin, query) {
  const baseUrl = normalizeBaseUrl(origin);
  const clean = query.trim().slice(0, 80);
  if (clean.length < 2) {
    return {
      text: "Z\u0259hm\u0259t olmasa \u0259n az\u0131 2 h\u0259rf yaz\u0131n. M\u0259s\u0259l\u0259n: <code>/axtar s\u0259bir</code>"
    };
  }
  try {
    const encoded = encodeURIComponent(clean);
    const upstream = await fetch(
      `https://api.alquran.cloud/v1/search/${encoded}/all/az.mammadaliyev`,
      {
        signal: AbortSignal.timeout(4500),
        headers: { "User-Agent": "Mozilla/5.0" }
      }
    );
    if (upstream.ok) {
      const json = await upstream.json();
      const matches = parseAlQuranSearchPayload(json).slice(0, 5);
      if (matches.length > 0) {
        const lines = [
          `<b>\u{1F50E} \xAB${escapeTelegramHtml(clean)}\xBB \xFCzr\u0259 ay\u0259 n\u0259tic\u0259l\u0259ri:</b>`,
          "",
          ...matches.map(
            (m, idx) => `${idx + 1}. <b>${escapeTelegramHtml(m.surahName)} ${m.surahNumber}:${m.ayahNumber}</b>
\xAB${escapeTelegramHtml(m.snippet.slice(0, 220))}${m.snippet.length > 220 ? "\u2026" : ""}\xBB`
          )
        ];
        return {
          text: lines.join("\n"),
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "\u{1F4D6} B\xFCt\xFCn n\u0259tic\u0259l\u0259ri t\u0259tbiqd\u0259 a\xE7",
                  web_app: { url: `${baseUrl}/quran?q=${encodeURIComponent(clean)}` }
                }
              ]
            ]
          }
        };
      }
    }
  } catch {
  }
  const matchedSurah = findSurahForTelegramQuery(clean);
  if (matchedSurah) {
    return formatSurahMessage(baseUrl, matchedSurah);
  }
  return {
    text: `\xAB${escapeTelegramHtml(clean)}\xBB \xFCzr\u0259 birba\u015Fa ay\u0259 tap\u0131lmad\u0131. Tam axtar\u0131\u015F \xFC\xE7\xFCn t\u0259tbiqi a\xE7a bil\u0259rsiniz:`,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "\u{1F50E} T\u0259tbiqd\u0259 Axtar",
            web_app: { url: `${baseUrl}/quran?q=${encodeURIComponent(clean)}` }
          }
        ]
      ]
    }
  };
}
async function resolveMushafPageReply(origin, pageNumber, deps) {
  const safePage = Math.max(1, Math.min(TOTAL_QURAN_PAGES, Math.trunc(pageNumber)));
  let summaryText = "";
  let sampleAyahs = [];
  try {
    const payload = await Promise.race([
      deps.fetchMushafPage(safePage),
      new Promise((resolve) => setTimeout(() => resolve(void 0), 2200))
    ]);
    if (payload) {
      summaryText = summarizeMushafPageContents(payload);
      sampleAyahs = payload.ayahs.slice(0, 2).map((a) => ({
        surahName: a.surahName.replace(/\s+surəsi$/i, ""),
        ayahNumber: a.ayahNumber,
        arabicText: a.arabicText,
        translation: a.translation
      }));
    }
  } catch {
  }
  return formatMushafPageMessage(origin, safePage, summaryText, sampleAyahs);
}
async function processTelegramUpdate(update, origin, token, deps) {
  if (update.inline_query?.id) {
    const inlineQueryId = String(update.inline_query.id);
    const queryText = String(update.inline_query.query ?? "").trim().slice(0, 80);
    const { longVideos, shorts } = await deps.getChannelDataForSeo();
    const collected = [];
    const ayahRef = parseInlineAyahRef(queryText);
    if (ayahRef) {
      const verse = await resolveVersePayloadForBot(
        ayahRef.surahNumber,
        ayahRef.ayahNumber,
        deps
      );
      collected.push(
        ...buildInlineAyahResults(origin, cachedBotUsername, verse, ayahRef.reciterId)
      );
    } else if (queryText.length >= 3) {
      try {
        const encoded = encodeURIComponent(queryText);
        const searchRes = await fetch(
          `https://api.alquran.cloud/v1/search/${encoded}/all/az.mammadaliyev`,
          {
            signal: AbortSignal.timeout(2200),
            headers: { "User-Agent": "Mozilla/5.0" }
          }
        );
        if (searchRes.ok) {
          const searchJson = await searchRes.json();
          const matches = parseAlQuranSearchPayload(searchJson).slice(0, 4);
          if (matches.length > 0) {
            collected.push(
              ...buildInlineSearchResults(origin, cachedBotUsername, matches)
            );
          }
        }
      } catch {
      }
    }
    const baseResults = buildInlineQueryResults(
      origin,
      queryText,
      [...longVideos, ...shorts],
      /* @__PURE__ */ new Date(),
      cachedBotUsername
    );
    const seenIds = new Set(collected.map((item) => item.id));
    for (const item of baseResults) {
      if (!seenIds.has(item.id)) {
        collected.push(item);
        seenIds.add(item.id);
      }
    }
    await callTelegramApi(token, "answerInlineQuery", {
      inline_query_id: inlineQueryId,
      results: collected.slice(0, 15),
      cache_time: 120,
      is_personal: false
    });
    return;
  }
  if (update.callback_query?.id && update.callback_query.message?.chat?.id !== void 0) {
    const cbId = String(update.callback_query.id);
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    const data = String(update.callback_query.data ?? "");
    await callTelegramApi(token, "answerCallbackQuery", { callback_query_id: cbId });
    if (data === "aye:random") {
      const pick = CURATED_TELEGRAM_VERSES[Math.floor(Math.random() * CURATED_TELEGRAM_VERSES.length)];
      const msg = formatVerseMessage(origin, { ...pick, heading: "\u2728 Se\xE7ilmi\u015F Ay\u0259" });
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (data.startsWith("kart:")) {
      const [, sRaw, aRaw, themeRaw, formatRaw] = data.split(":");
      const sNum = Number.parseInt(sRaw ?? "2", 10) || 2;
      const aNum = Number.parseInt(aRaw ?? "255", 10) || 255;
      const theme = themeRaw === "parchment" ? "parchment" : "emerald";
      const format = formatRaw === "square" ? "square" : "story";
      const verse = await resolveVersePayloadForBot(sNum, aNum, deps);
      await sendTelegramVerseCardPhoto(token, origin, chatId, verse, theme, format);
    } else if (data.startsWith("sub:")) {
      const existing = await getSubscriptionForChat(chatId, token) ?? createDefaultSubscription(chatId);
      if (data === "sub:test") {
        const saved = await saveSubscription({ ...existing, active: true }, token);
        const digest = buildDailyDigestMessage(origin, saved, /* @__PURE__ */ new Date());
        if (digest) {
          await sendTelegramHtmlMessage(token, chatId, digest.text, digest.reply_markup);
        }
        return;
      }
      let updated = existing;
      if (data === "sub:menu") {
        if (!await getSubscriptionForChat(chatId, token)) {
          updated = await saveSubscription(existing, token);
        }
      } else if (data === "sub:tog:active") {
        updated = await saveSubscription({ ...existing, active: !existing.active }, token);
      } else if (data === "sub:tog:kahf") {
        updated = await saveSubscription(
          { ...existing, active: true, fridayKahf: !existing.fridayKahf },
          token
        );
      } else if (data === "sub:tog:verse") {
        updated = await saveSubscription(
          { ...existing, active: true, dailyVerseZikr: !existing.dailyVerseZikr },
          token
        );
      } else if (data === "sub:tog:prayer") {
        updated = await saveSubscription(
          { ...existing, active: true, dailyPrayer: !existing.dailyPrayer },
          token
        );
      } else if (data.startsWith("sub:city:")) {
        const cityId = data.slice("sub:city:".length);
        const city = findCityForTelegramQuery(cityId);
        updated = await saveSubscription({ ...existing, active: true, cityId: city.id }, token);
      } else if (data.startsWith("sub:hour:")) {
        const hour = Number.parseInt(data.slice("sub:hour:".length), 10);
        if (hour >= 0 && hour <= 23) {
          updated = await saveSubscription({ ...existing, active: true, hourBaku: hour }, token);
        }
      }
      const settingsReply = formatSubscriptionSettingsMessage(origin, updated);
      if (data !== "sub:menu" && typeof messageId === "number") {
        const edited = await editTelegramHtmlMessage(
          token,
          chatId,
          messageId,
          settingsReply.text,
          settingsReply.reply_markup
        );
        if (edited) return;
      }
      await sendTelegramHtmlMessage(
        token,
        chatId,
        settingsReply.text,
        settingsReply.reply_markup
      );
    } else if (data.startsWith("amenu:")) {
      const [, sRaw, aRaw, qariCode] = data.split(":");
      const sNum = Number.parseInt(sRaw ?? "1", 10) || 1;
      const aNum = Number.parseInt(aRaw ?? "1", 10) || 1;
      const msg = formatAudioSelectorMessage(origin, {
        surahNumber: sNum,
        ayahNumber: aNum,
        reciterInput: qariCode,
        showPresets: sNum === 1 && aNum === 1
      });
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (data.startsWith("asrc:")) {
      const [, sRaw, aRaw, qariCode] = data.split(":");
      const sNum = Number.parseInt(sRaw ?? "1", 10) || 1;
      const aNum = Number.parseInt(aRaw ?? "1", 10) || 1;
      const msg = formatAudioSelectorMessage(origin, {
        surahNumber: sNum,
        ayahNumber: aNum,
        reciterInput: qariCode,
        showPresets: true
      });
      if (typeof messageId === "number") {
        const edited = await editTelegramHtmlMessage(
          token,
          chatId,
          messageId,
          msg.text,
          msg.reply_markup
        );
        if (!edited) {
          await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
        }
      } else {
        await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
      }
    } else if (data.startsWith("aplay:")) {
      const [, mode, sRaw, aRaw, qariCode] = data.split(":");
      const sNum = Number.parseInt(sRaw ?? "1", 10) || 1;
      const aNum = Number.parseInt(aRaw ?? "1", 10) || 1;
      if (mode === "surah") {
        await sendTelegramFullSurahAudio(token, origin, chatId, sNum, qariCode);
      } else {
        await sendTelegramAyahAudio(token, chatId, sNum, aNum, qariCode);
      }
    } else if (data.startsWith("audio:")) {
      const [, sRaw, aRaw, qariCode] = data.split(":");
      const sNum = Number.parseInt(sRaw ?? "1", 10) || 1;
      const aNum = Number.parseInt(aRaw ?? "1", 10) || 1;
      const msg = formatAudioSelectorMessage(origin, {
        surahNumber: sNum,
        ayahNumber: aNum,
        reciterInput: qariCode
      });
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (data.startsWith("namaz:")) {
      const cityKey = data.slice("namaz:".length);
      const city = findCityForTelegramQuery(cityKey);
      const msg = formatPrayerTimesMessage(origin, city);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (data.startsWith("zikr:")) {
      const [, rawCat = "seher", rawIdx] = data.split(":");
      const cat = rawCat === "axsam" || rawCat === "namaz" || rawCat === "umumi" ? rawCat : "seher";
      const parsedIdx = rawIdx !== void 0 ? Number.parseInt(rawIdx, 10) : NaN;
      const offset = Number.isFinite(parsedIdx) && parsedIdx >= 0 ? parsedIdx : Math.floor(Math.random() * 25);
      const msg = formatZikrMessage(origin, cat, offset);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (data === "teqvim:now") {
      const msg = formatHijriCalendarMessage(origin);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (data.startsWith("mushaf:")) {
      const pageNum = Number.parseInt(data.slice("mushaf:".length), 10);
      if (pageNum >= 1 && pageNum <= TOTAL_QURAN_PAGES) {
        const msg = await resolveMushafPageReply(origin, pageNum, deps);
        await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
      }
    }
    return;
  }
  if (update.message?.chat?.id !== void 0 && typeof update.message.text === "string") {
    const chatId = update.message.chat.id;
    const rawText = update.message.text.trim();
    const parsed = parseTelegramCommand(rawText);
    if (!parsed) {
      const inlineRefHit = parseInlineAyahRef(rawText);
      if (inlineRefHit) {
        const verse = await resolveVersePayloadForBot(
          inlineRefHit.surahNumber,
          inlineRefHit.ayahNumber,
          deps
        );
        const msg = formatVerseMessage(origin, {
          ...verse,
          heading: `\u{1F4D6} ${verse.surahName} sur\u0259si`
        });
        await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
        return;
      }
      const surahHit = findSurahForTelegramQuery(rawText);
      if (surahHit && rawText.length <= 30) {
        let sampleAyahs = [];
        try {
          const payload = await Promise.race([
            deps.fetchSurahTranslation(surahHit.number),
            new Promise((resolve) => setTimeout(() => resolve(void 0), 2e3))
          ]);
          if (payload) sampleAyahs = payload.ayahs.slice(0, 2);
        } catch {
        }
        const msg = formatSurahMessage(origin, surahHit, sampleAyahs);
        await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
      } else {
        const msg = await handleQuranTextSearch(origin, rawText);
        await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
      }
      return;
    }
    const { command, args } = parsed;
    if (command === "start" || command === "help" || command === "yardim" || command === "menu") {
      const deepArg = args.trim();
      const deepKart = deepArg.match(/^kart_(\d{1,3})_(\d{1,3})$/i);
      if (deepKart) {
        const s = Number.parseInt(deepKart[1], 10);
        const a = Number.parseInt(deepKart[2], 10);
        const verse = await resolveVersePayloadForBot(s, a, deps);
        await sendTelegramVerseCardPhoto(token, origin, chatId, verse, "emerald", "story");
        return;
      }
      const deepSes = deepArg.match(/^ses_(\d{1,3})_(\d{1,3})$/i);
      if (deepSes) {
        const s = Number.parseInt(deepSes[1], 10);
        const a = Number.parseInt(deepSes[2], 10);
        const msg2 = formatAudioSelectorMessage(origin, {
          surahNumber: s,
          ayahNumber: a,
          reciterInput: "afasy"
        });
        await sendTelegramHtmlMessage(token, chatId, msg2.text, msg2.reply_markup);
        return;
      }
      const deepAye = deepArg.match(/^aye_(\d{1,3})_(\d{1,3})$/i);
      if (deepAye) {
        const s = Number.parseInt(deepAye[1], 10);
        const a = Number.parseInt(deepAye[2], 10);
        const verse = await resolveVersePayloadForBot(s, a, deps);
        const msg2 = formatVerseMessage(origin, {
          ...verse,
          heading: `\u{1F4D6} ${verse.surahName} sur\u0259si`
        });
        await sendTelegramHtmlMessage(token, chatId, msg2.text, msg2.reply_markup);
        return;
      }
      if (deepArg.toLowerCase() === "abune") {
        const existing = await getSubscriptionForChat(chatId, token) ?? createDefaultSubscription(chatId);
        const saved = await saveSubscription(existing, token);
        const msg2 = formatSubscriptionSettingsMessage(origin, saved);
        await sendTelegramHtmlMessage(token, chatId, msg2.text, msg2.reply_markup);
        return;
      }
      const msg = formatStartMessage(origin);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === "kart" || command === "sekil" || command === "card") {
      const kartTarget = parseKartQueryArgs(args);
      const verse = await resolveVersePayloadForBot(
        kartTarget.surahNumber,
        kartTarget.ayahNumber,
        deps
      );
      const ok = await sendTelegramVerseCardPhoto(
        token,
        origin,
        chatId,
        verse,
        kartTarget.theme,
        kartTarget.format
      );
      if (!ok) {
        const fallbackMsg = formatVerseMessage(origin, verse);
        await sendTelegramHtmlMessage(token, chatId, fallbackMsg.text, fallbackMsg.reply_markup);
      }
    } else if (command === "abune" || command === "bildiris" || command === "sub") {
      const current = await getSubscriptionForChat(chatId, token) ?? createDefaultSubscription(chatId);
      const nextSub = parseAbuneCommandArgs(args, current);
      const saved = await saveSubscription(nextSub, token);
      const msg = formatSubscriptionSettingsMessage(origin, saved);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === "ses" || command === "dinle" || command === "qiraet" || command === "qari") {
      const audioTarget = parseAudioQueryArgs(args);
      const msg = formatAudioSelectorMessage(origin, {
        surahNumber: audioTarget.surahNumber,
        ayahNumber: audioTarget.ayahNumber,
        reciterInput: audioTarget.reciterId,
        showPresets: !audioTarget.hasExplicitTarget
      });
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === "aye" || command === "gunun_ayesi") {
      const refMatch = args.match(/^(\d{1,3}):(\d{1,3})$/);
      if (refMatch) {
        const surahNum = Number.parseInt(refMatch[1], 10);
        const ayahNum = Number.parseInt(refMatch[2], 10);
        const surahMeta = findSurahForTelegramQuery(String(surahNum));
        if (surahMeta && ayahNum >= 1 && ayahNum <= surahMeta.ayahCount) {
          const verse = await resolveVersePayloadForBot(surahNum, ayahNum, deps);
          const msg2 = formatVerseMessage(origin, {
            ...verse,
            heading: `\u{1F4D6} ${surahMeta.name} sur\u0259si`
          });
          await sendTelegramHtmlMessage(token, chatId, msg2.text, msg2.reply_markup);
          return;
        }
      }
      const daily = getCuratedVerseForDate();
      const msg = formatVerseMessage(origin, daily);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === "sure" || command === "surah") {
      if (!args) {
        await sendTelegramHtmlMessage(
          token,
          chatId,
          "Z\u0259hm\u0259t olmasa sur\u0259 ad\u0131 v\u0259 ya n\xF6mr\u0259si yaz\u0131n. M\u0259s\u0259l\u0259n:\n<code>/sure Yasin</code> v\u0259 ya <code>/sure 36</code>"
        );
      } else {
        const surah = findSurahForTelegramQuery(args);
        if (!surah) {
          await sendTelegramHtmlMessage(
            token,
            chatId,
            `\xAB${escapeTelegramHtml(args)}\xBB adl\u0131 sur\u0259 tap\u0131lmad\u0131. 1\u2013114 aras\u0131 n\xF6mr\u0259 v\u0259 ya sur\u0259 ad\u0131 yaz\u0131n.`
          );
        } else {
          let sampleAyahs = [];
          try {
            const payload = await Promise.race([
              deps.fetchSurahTranslation(surah.number),
              new Promise((resolve) => setTimeout(() => resolve(void 0), 2e3))
            ]);
            if (payload) sampleAyahs = payload.ayahs.slice(0, 2);
          } catch {
          }
          const msg = formatSurahMessage(origin, surah, sampleAyahs);
          await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
        }
      }
    } else if (command === "sehife" || command === "mushaf" || command === "page") {
      const num = Number.parseInt(args || "1", 10);
      if (Number.isNaN(num) || num < 1 || num > TOTAL_QURAN_PAGES) {
        await sendTelegramHtmlMessage(
          token,
          chatId,
          "M\u0259din\u0259 Mushaf\u0131 s\u0259hif\u0259l\u0259ri 1 il\u0259 604 aras\u0131ndad\u0131r. M\u0259s\u0259l\u0259n: <code>/sehife 42</code>"
        );
      } else {
        const msg = await resolveMushafPageReply(origin, num, deps);
        await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
      }
    } else if (command === "namaz" || command === "vaxt") {
      const city = findCityForTelegramQuery(args || "Bak\u0131");
      const msg = formatPrayerTimesMessage(origin, city);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === "zikr" || command === "tesbih") {
      const argNorm = args.toLowerCase();
      const category = argNorm.includes("ax") ? "axsam" : argNorm.includes("namaz") ? "namaz" : "seher";
      const msg = formatZikrMessage(origin, category, 0);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === "teqvim" || command === "hicri") {
      const msg = formatHijriCalendarMessage(origin);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === "elifba" || command === "tecvid") {
      const msg = formatAlphabetMessage(origin);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === "axtar" || command === "search") {
      const msg = await handleQuranTextSearch(origin, args);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else if (command === "videolar" || command === "shorts") {
      const { longVideos, shorts } = await deps.getChannelDataForSeo();
      const list = command === "shorts" ? shorts : longVideos;
      const heading = command === "shorts" ? "\u{1F4F1} Quran Qiraeti \u2014 Son Shorts Videolar\u0131" : "\u{1F3AC} Quran Qiraeti \u2014 Se\xE7ilmi\u015F Uzun Tilav\u0259tl\u0259r";
      const msg = formatVideosMessage(origin, list, heading);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    } else {
      const msg = formatStartMessage(origin);
      await sendTelegramHtmlMessage(token, chatId, msg.text, msg.reply_markup);
    }
  }
}
var vercelAutoSyncAttempted = false;
function createTelegramRouter(deps) {
  const router = express.Router();
  router.get("/status", async (req, res) => {
    const token = getTelegramBotToken();
    const webhookSecret = getTelegramWebhookSecret(token);
    const reqOrigin = normalizeBaseUrl(deps.getRequestOrigin(req));
    const miniAppOrigin = resolvePublicTelegramOrigin(reqOrigin);
    const webhookUrl = `${miniAppOrigin}/api/telegram/webhook`;
    let botUsername = null;
    let webhookActiveUrl = null;
    if (token) {
      try {
        const [me, info] = await Promise.all([
          callTelegramApi(token, "getMe"),
          callTelegramApi(token, "getWebhookInfo")
        ]);
        if (me.ok && me.result?.username) {
          botUsername = me.result.username;
          cachedBotUsername = me.result.username;
        }
        if (info.ok && info.result?.url) {
          webhookActiveUrl = info.result.url;
        }
        const isPublicProductionHost = reqOrigin.startsWith("https://") && !reqOrigin.includes("ais-dev-") && !reqOrigin.includes("127.0.0.1") && !reqOrigin.includes("localhost");
        if (isPublicProductionHost && !vercelAutoSyncAttempted) {
          vercelAutoSyncAttempted = true;
          if (!webhookActiveUrl) {
            const registered = await registerBotWebhookAndMenu(token, webhookSecret, miniAppOrigin);
            if (registered.webhookSet) {
              webhookActiveUrl = registered.webhookUrl;
            }
          } else {
            await callTelegramApi(token, "setMyCommands", { commands: TELEGRAM_BOT_COMMANDS });
          }
        }
      } catch {
      }
    }
    res.setHeader("Cache-Control", "no-store");
    res.json({
      botConfigured: Boolean(token),
      webhookSecretConfigured: Boolean(webhookSecret),
      mode: webhookActiveUrl ? "webhook" : token ? "polling" : "unconfigured",
      miniAppOrigin,
      recommendedWebhookUrl: webhookUrl,
      botUsername,
      webhookActiveUrl,
      commandsCount: TELEGRAM_BOT_COMMANDS.length
    });
  });
  router.get("/verse-card.png", async (req, res) => {
    const surahNum = Math.max(1, Math.min(114, Number.parseInt(String(req.query.surah ?? "2"), 10) || 2));
    const ayahNum = Math.max(1, Number.parseInt(String(req.query.ayah ?? "255"), 10) || 1);
    const theme = String(req.query.theme ?? "").toLowerCase() === "parchment" ? "parchment" : "emerald";
    const format = String(req.query.format ?? "").toLowerCase() === "square" ? "square" : "story";
    try {
      const verse = await resolveVersePayloadForBot(surahNum, ayahNum, deps);
      const pngBuffer = renderVerseCardPngBuffer({
        surahName: verse.surahName,
        surahNumber: verse.surahNumber,
        ayahNumber: verse.ayahNumber,
        arabicText: verse.arabicText,
        translation: verse.translation,
        theme,
        format
      });
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, s-maxage=86400, max-age=86400, stale-while-revalidate=604800");
      res.send(pngBuffer);
    } catch {
      res.status(500).json({ ok: false, error: "Ay\u0259 \u015F\u0259kil kart\u0131 haz\u0131rlana bilm\u0259di." });
    }
  });
  router.get("/subscribers", async (req, res) => {
    const authHeader = String(req.header("authorization") ?? "");
    const adminOk = await verifyFirebaseAdminBearer(authHeader);
    if (!adminOk) {
      res.status(401).json({ ok: false, error: "\u0130caz\u0259siz sor\u011Fu. Admin giri\u015Fi t\u0259l\u0259b olunur." });
      return;
    }
    const token = getTelegramBotToken();
    const idToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { subscriptions, storageModes } = await loadAllSubscriptions(token, idToken);
    const summary = buildSubscriberSummaryStats(subscriptions, storageModes);
    res.setHeader("Cache-Control", "no-store");
    res.json({ ok: true, ...summary });
  });
  async function handleCronDispatch(req, res) {
    const token = getTelegramBotToken();
    const webhookSecret = getTelegramWebhookSecret(token);
    const cronSecret = String(process.env.CRON_SECRET ?? "").trim();
    const authHeader = String(req.header("authorization") ?? "").trim();
    const bearerValue = authHeader.replace(/^Bearer\s+/i, "").trim();
    const setupSecret = String(req.header("x-telegram-setup-secret") ?? "").trim();
    let authorized = false;
    let adminIdToken = "";
    if (cronSecret && bearerValue && verifyTimingSafeSecret(bearerValue, cronSecret)) {
      authorized = true;
    } else if (setupSecret && webhookSecret && verifyTimingSafeSecret(setupSecret, webhookSecret)) {
      authorized = true;
    } else if (authHeader && await verifyFirebaseAdminBearer(authHeader)) {
      authorized = true;
      adminIdToken = bearerValue;
    }
    if (!authorized) {
      res.status(401).json({ ok: false, error: "\u0130caz\u0259siz cron sor\u011Fusu." });
      return;
    }
    if (!token) {
      res.status(400).json({ ok: false, error: "TELEGRAM_BOT_TOKEN konfiqurasiya edilm\u0259yib." });
      return;
    }
    const now = /* @__PURE__ */ new Date();
    const bakuDate = getBakuDateParts(now);
    const origin = resolvePublicTelegramOrigin(deps.getRequestOrigin(req));
    const sendAll = req.query.all === "1" || req.query.all === "true";
    const force = req.query.force === "1" || req.query.force === "true";
    const { subscriptions, storageModes } = await loadAllSubscriptions(token, adminIdToken);
    const activeSubs = subscriptions.filter((s) => s.active);
    let attempted = 0;
    let sent = 0;
    let skippedAlreadySent = 0;
    let skippedHour = 0;
    let failed = 0;
    for (const sub of activeSubs) {
      if (!sendAll && sub.hourBaku !== bakuDate.hour) {
        skippedHour++;
        continue;
      }
      if (!force && await hasSentDigestToday(sub.chatId, bakuDate.dateKey, token)) {
        skippedAlreadySent++;
        continue;
      }
      const reply = buildDailyDigestMessage(origin, sub, now);
      if (!reply) continue;
      attempted++;
      const apiRes = await callTelegramApi(token, "sendMessage", {
        chat_id: sub.chatId,
        text: reply.text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...reply.reply_markup ? { reply_markup: reply.reply_markup } : {}
      });
      if (apiRes.ok) {
        sent++;
        await markDigestSentToday(sub.chatId, bakuDate.dateKey, token);
      } else {
        failed++;
      }
    }
    res.setHeader("Cache-Control", "no-store");
    res.json({
      ok: true,
      dateKey: bakuDate.dateKey,
      hourBaku: bakuDate.hour,
      isFriday: bakuDate.isFriday,
      totalActive: activeSubs.length,
      attempted,
      sent,
      skippedAlreadySent,
      skippedHour,
      failed,
      storageModes
    });
  }
  router.get("/cron", handleCronDispatch);
  router.post("/cron", handleCronDispatch);
  router.post("/setup", async (req, res) => {
    const token = getTelegramBotToken();
    const webhookSecret = getTelegramWebhookSecret(token);
    if (!token || !webhookSecret) {
      res.status(400).json({
        ok: false,
        error: "Server m\xFChit d\u0259yi\u015F\u0259nl\u0259rind\u0259 TELEGRAM_BOT_TOKEN (v\u0259 ya bot) t\u0259yin edilm\u0259yib."
      });
      return;
    }
    const providedSetupSecret = String(req.header("x-telegram-setup-secret") ?? "").trim();
    const explicitSetupSecret = String(process.env.TELEGRAM_WEBHOOK_SECRET ?? "").trim();
    const secretAuthorized = providedSetupSecret.length > 0 && verifyTimingSafeSecret(providedSetupSecret, explicitSetupSecret || webhookSecret);
    const adminAuthorized = secretAuthorized ? true : await verifyFirebaseAdminBearer(String(req.header("authorization") ?? ""));
    if (!adminAuthorized) {
      res.status(401).json({ ok: false, error: "\u0130caz\u0259siz sor\u011Fu. Admin giri\u015Fi t\u0259l\u0259b olunur." });
      return;
    }
    const origin = resolvePublicTelegramOrigin(deps.getRequestOrigin(req));
    try {
      const result = await registerBotWebhookAndMenu(token, webhookSecret, origin);
      res.json(result);
    } catch {
      res.status(502).json({ ok: false, error: "Telegram Bot API il\u0259 \u0259laq\u0259 al\u0131nmad\u0131." });
    }
  });
  router.get("/webhook", (_req, res) => {
    res.status(200).json({
      ok: true,
      endpoint: "/api/telegram/webhook",
      note: "Telegram POST sor\u011Fular\u0131 \xFC\xE7\xFCn aktiv webhook n\xF6qt\u0259si."
    });
  });
  router.post("/webhook", async (req, res) => {
    const token = getTelegramBotToken();
    const webhookSecret = getTelegramWebhookSecret(token);
    if (webhookSecret) {
      const headerSecret = String(req.header("x-telegram-bot-api-secret-token") ?? "").trim();
      if (!verifyTimingSafeSecret(headerSecret, webhookSecret)) {
        res.status(401).json({ ok: false, error: "Unauthorized webhook request" });
        return;
      }
    }
    if (!token) {
      res.status(200).json({ ok: false, configured: false });
      return;
    }
    const update = req.body ?? {};
    const origin = resolvePublicTelegramOrigin(deps.getRequestOrigin(req));
    try {
      await processTelegramUpdate(update, origin, token, deps);
    } catch (err) {
      console.error("Telegram webhook processing error:", err);
    }
    res.json({ ok: true });
  });
  return router;
}

// src/server/api.ts
var CACHE_TTL_MS = 10 * 60 * 1e3;
var cachedChannel = null;
var inflightChannelPromise = null;
var startupIndexNowSent = false;
var surahTranslationCache = /* @__PURE__ */ new Map();
var mushafPageCache = /* @__PURE__ */ new Map();
var muhaffizPageCache = /* @__PURE__ */ new Map();
var surahRequests = [
  {
    id: "req-1",
    surahName: "M\xFClk sur\u0259si (1\u201330)",
    reciter: "Maher Al-Muaiqly",
    email: "",
    note: "Tam sur\u0259 \u015F\u0259kild\u0259 Az\u0259rbaycan dilind\u0259 t\u0259rc\xFCm\u0259 il\u0259 payla\u015F\u0131lmas\u0131n\u0131 rica edirik.",
    createdAt: "2026-11-12T18:30:00Z"
  },
  {
    id: "req-2",
    surahName: "Vaqi\u0259 sur\u0259si",
    reciter: "Yasser Al-Dosari",
    email: "",
    note: "Ax\u015Fam tilav\u0259tl\u0259ri \xFC\xE7\xFCn s\u0259lis s\u0259s v\u0259 ayd\u0131n altyaz\u0131 il\u0259.",
    createdAt: "2026-11-14T09:15:00Z"
  }
];
var serverTelemetryEvents = [];
var MAX_SERVER_TELEMETRY_EVENTS = 1500;
var VALID_PAGE_KEYS = new Set(CONNECTED_PAGES.map((p) => p.pageKey));
async function fetchSurahTranslation(surahNumber) {
  const cached = surahTranslationCache.get(surahNumber);
  if (cached && cached.ayahs.length > 0 && cached.ayahs[0]?.pageNumber) return cached;
  try {
    const [encResult, pagesResult] = await Promise.allSettled([
      fetch(`https://quranenc.com/api/v1/translation/sura/azeri_musayev/${surahNumber}`, {
        signal: AbortSignal.timeout(7e3),
        headers: { "User-Agent": "Mozilla/5.0" }
      }),
      fetch(
        `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?fields=page_number&per_page=300`,
        {
          signal: AbortSignal.timeout(7e3),
          headers: { "User-Agent": "Mozilla/5.0" }
        }
      )
    ]);
    if (encResult.status === "fulfilled" && encResult.value.ok) {
      const json = await encResult.value.json();
      let parsed = parseQuranEncSurah(surahNumber, json);
      if (parsed.ayahs.length > 0) {
        let pageMap = /* @__PURE__ */ new Map();
        if (pagesResult.status === "fulfilled" && pagesResult.value.ok) {
          try {
            const pagesJson = await pagesResult.value.json();
            pageMap = parseQuranComChapterVersesPages(pagesJson);
          } catch {
          }
        }
        if (pageMap.size === 0) {
          try {
            const alqRes = await fetch(
              `https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`,
              { signal: AbortSignal.timeout(6e3) }
            );
            if (alqRes.ok) {
              const alqJson = await alqRes.json();
              const rawAyahs = Array.isArray(alqJson?.data?.ayahs) ? alqJson.data.ayahs : [];
              for (const item of rawAyahs) {
                const ayahNum = Number(item?.numberInSurah ?? 0);
                const pageNum = Number(item?.page ?? 0);
                const juzNum = Number(item?.juz ?? 0);
                if (ayahNum > 0 && pageNum >= 1 && pageNum <= TOTAL_QURAN_PAGES) {
                  pageMap.set(ayahNum, {
                    pageNumber: pageNum,
                    juzNumber: juzNum >= 1 && juzNum <= 30 ? juzNum : 1
                  });
                }
              }
            }
          } catch {
          }
        }
        parsed = attachMushafPagesToSurah(parsed, pageMap);
        surahTranslationCache.set(surahNumber, parsed);
        return parsed;
      }
    }
  } catch {
  }
  const fallbackRes = await fetch(
    `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,az.musayev`,
    { signal: AbortSignal.timeout(7e3) }
  );
  if (!fallbackRes.ok) {
    throw new Error(`Surah ${surahNumber} translation unavailable`);
  }
  const fallbackJson = await fallbackRes.json();
  const arAyahs = fallbackJson?.data?.[0]?.ayahs ?? [];
  const azAyahs = fallbackJson?.data?.[1]?.ayahs ?? [];
  const payload = {
    surahNumber,
    translatorName: "\u018Flixan Musayev",
    editionVersion: "1.0.4",
    ayahs: arAyahs.map(
      (ar, idx) => ({
        surahNumber,
        ayahNumber: ar.numberInSurah ?? idx + 1,
        pageNumber: typeof ar.page === "number" ? ar.page : void 0,
        juzNumber: typeof ar.juz === "number" ? ar.juz : void 0,
        arabicText: String(ar.text ?? "").trim(),
        translation: String(azAyahs[idx]?.text ?? "").trim(),
        footnotes: ""
      })
    )
  };
  if (payload.ayahs.length > 0) {
    surahTranslationCache.set(surahNumber, payload);
  }
  return payload;
}
async function fetchMushafPage(pageNumber) {
  const cached = mushafPageCache.get(pageNumber);
  if (cached && cached.ayahs.length > 0) return cached;
  let uthmaniAyahs = [];
  try {
    const quranComRes = await fetch(
      `https://api.quran.com/api/v4/verses/by_page/${pageNumber}?fields=text_uthmani&per_page=50`,
      {
        signal: AbortSignal.timeout(7e3),
        headers: { "User-Agent": "Mozilla/5.0" }
      }
    );
    if (quranComRes.ok) {
      const quranComJson = await quranComRes.json();
      uthmaniAyahs = parseQuranComPageVerses(quranComJson);
    }
  } catch {
  }
  if (uthmaniAyahs.length === 0) {
    const res = await fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`, {
      signal: AbortSignal.timeout(7e3),
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!res.ok) {
      throw new Error(`Quran page ${pageNumber} unavailable`);
    }
    const json = await res.json();
    const rawAyahs = Array.isArray(json?.data?.ayahs) ? json.data.ayahs : [];
    uthmaniAyahs = rawAyahs.map(
      (item) => ({
        surahNumber: item.surah?.number ?? 1,
        ayahNumber: item.numberInSurah ?? 1,
        juzNumber: item.juz ?? 1,
        arabicText: String(item.text ?? "").trim()
      })
    );
  }
  if (uthmaniAyahs.length === 0) {
    throw new Error(`Quran page ${pageNumber} returned empty ayahs`);
  }
  const uniqueSurahNumbers = Array.from(new Set(uthmaniAyahs.map((a) => a.surahNumber)));
  const surahPayloads = await Promise.all(
    uniqueSurahNumbers.map(async (surahNum) => [surahNum, await fetchSurahTranslation(surahNum)])
  );
  const surahMap = new Map(surahPayloads);
  const merged = mergePageAyahsWithMusayev(pageNumber, uthmaniAyahs, surahMap);
  if (merged.ayahs.length > 0) {
    mushafPageCache.set(pageNumber, merged);
  }
  return merged;
}
async function fetchMuhaffizPage(pageNumber) {
  const cached = muhaffizPageCache.get(pageNumber);
  if (cached && cached.rows.length > 0) return cached;
  try {
    const res = await fetch(
      `https://api.quran.com/api/v4/verses/by_page/${pageNumber}?words=true&word_fields=code_v1,text_uthmani,line_number,char_type_name&per_page=50`,
      {
        signal: AbortSignal.timeout(7e3),
        headers: { "User-Agent": "Mozilla/5.0" }
      }
    );
    if (res.ok) {
      const json = await res.json();
      const rawVerses = Array.isArray(json?.verses) ? json.verses : [];
      if (rawVerses.length > 0) {
        const uthmaniAyahs = rawVerses.map((v) => {
          const [rawSurah, rawAyah] = String(v.verse_key ?? "1:1").split(":");
          const surahNumber = Number.parseInt(rawSurah, 10) || 1;
          const ayahNumber = Number.parseInt(rawAyah, 10) || 1;
          const wordsOnly = (v.words ?? []).filter((w) => w.char_type_name !== "end").map((w) => String(w.text_uthmani ?? w.text ?? "").trim()).filter(Boolean);
          return {
            surahNumber,
            ayahNumber,
            juzNumber: Number(v.juz_number) || 1,
            arabicText: wordsOnly.join(" ")
          };
        });
        const uniqueSurahNumbers = Array.from(new Set(uthmaniAyahs.map((a) => a.surahNumber)));
        const surahPayloads = await Promise.all(
          uniqueSurahNumbers.map(async (sNum) => {
            try {
              return [sNum, await fetchSurahTranslation(sNum)];
            } catch {
              return [
                sNum,
                {
                  surahNumber: sNum,
                  translatorName: "\u018Flixan Musayev",
                  editionVersion: "1.0.4",
                  ayahs: []
                }
              ];
            }
          })
        );
        const surahMap = new Map(surahPayloads);
        const merged = mergePageAyahsWithMusayev(pageNumber, uthmaniAyahs, surahMap);
        const tokens = buildTokensFromQuranComVerses(rawVerses);
        const rows = groupTokensIntoMushafRows(tokens);
        const data = {
          ...merged,
          rows,
          centeredPage: pageNumber === 1 || pageNumber === 2
        };
        muhaffizPageCache.set(pageNumber, data);
        return data;
      }
    }
  } catch {
  }
  const plainPage = await fetchMushafPage(pageNumber);
  const fallbackData = {
    ...plainPage,
    rows: buildSyntheticMuhaffizRows(pageNumber, plainPage.ayahs),
    centeredPage: pageNumber === 1 || pageNumber === 2
  };
  muhaffizPageCache.set(pageNumber, fallbackData);
  return fallbackData;
}
async function fetchAllYouTubeShorts(html, startedAt) {
  const initial = extractYouTubeShortsInitial(html);
  const byId = /* @__PURE__ */ new Map();
  for (const s of initial.shorts) {
    byId.set(s.videoId, s);
  }
  const totalBudgetMs = process.env.VERCEL ? 5500 : 12e3;
  let continuation = initial.continuationToken;
  let pages = 1;
  while (continuation && initial.apiKey && initial.clientVersion && pages < 20 && Date.now() - startedAt < totalBudgetMs) {
    const remainingMs = Math.max(1200, totalBudgetMs - (Date.now() - startedAt));
    const pageController = new AbortController();
    const pageTimer = setTimeout(() => pageController.abort(), Math.min(4e3, remainingMs));
    try {
      const res = await fetch(
        `https://www.youtube.com/youtubei/v1/browse?key=${initial.apiKey}`,
        {
          method: "POST",
          signal: pageController.signal,
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
          },
          body: JSON.stringify({
            context: {
              client: {
                clientName: "WEB",
                clientVersion: initial.clientVersion
              }
            },
            continuation
          })
        }
      );
      if (!res.ok) break;
      const json = await res.json();
      const parsed = parseYouTubeShortsContinuation(json);
      for (const s of parsed.shorts) {
        if (!byId.has(s.videoId)) {
          byId.set(s.videoId, s);
        }
      }
      if (!parsed.continuationToken || parsed.shorts.length === 0) break;
      continuation = parsed.continuationToken;
      pages++;
    } catch {
      break;
    } finally {
      clearTimeout(pageTimer);
    }
  }
  return Array.from(byId.values());
}
async function fetchLiveChannelData() {
  const now = Date.now();
  if (cachedChannel) {
    const ttl = cachedChannel.complete ? CACHE_TTL_MS : 2e4;
    if (now - cachedChannel.fetchedAt < ttl) {
      return {
        stats: cachedChannel.stats,
        longVideos: cachedChannel.longVideos,
        shorts: cachedChannel.shorts
      };
    }
  }
  if (inflightChannelPromise) {
    return inflightChannelPromise;
  }
  inflightChannelPromise = (async () => {
    const startedAt = Date.now();
    try {
      const initialTimeoutMs = process.env.VERCEL ? 4500 : 1e4;
      const initialController = new AbortController();
      const initialTimer = setTimeout(() => initialController.abort(), initialTimeoutMs);
      const [videosRes, shortsRes] = await Promise.allSettled([
        fetch("https://www.youtube.com/@quranqiraeti/videos", {
          signal: initialController.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
            "Accept-Language": "en-US,en;q=0.9"
          }
        }),
        fetch("https://www.youtube.com/@quranqiraeti/shorts", {
          signal: initialController.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
            "Accept-Language": "en-US,en;q=0.9"
          }
        })
      ]);
      let videosHtml = "";
      let shortsHtml = "";
      if (videosRes.status === "fulfilled" && videosRes.value.ok) {
        videosHtml = await videosRes.value.text();
      }
      if (shortsRes.status === "fulfilled" && shortsRes.value.ok) {
        shortsHtml = await shortsRes.value.text();
      }
      clearTimeout(initialTimer);
      let longVideos = SEED_LONG_VIDEOS;
      let shorts = SEED_SHORTS;
      let hasLiveLong = false;
      let hasLiveShorts = false;
      let subscribersLabel = DEFAULT_CHANNEL_STATS.subscribersLabel;
      let videoCountLabel = DEFAULT_CHANNEL_STATS.videoCountLabel;
      if (videosHtml) {
        const parsedLong = parseYouTubeVideosPage(videosHtml);
        if (parsedLong.length > 0) {
          const existingIds = new Set(parsedLong.map((v) => v.videoId));
          const featuredSeeds = SEED_LONG_VIDEOS.filter(
            (v) => (v.videoId === FEATURED_SURAH_VIDEO_IDS.fatiha || v.videoId === FEATURED_SURAH_VIDEO_IDS.baqara) && !existingIds.has(v.videoId)
          );
          longVideos = prioritizeFeaturedSurahs([...parsedLong, ...featuredSeeds]);
          hasLiveLong = true;
        }
        const subMatch = videosHtml.match(/(\d+(?:\.\d+)?[KM]?)\s+subscribers/i)?.[1];
        const vidMatch = videosHtml.match(/(\d+(?:,\d+)?)\s+videos/i)?.[1];
        if (subMatch) subscribersLabel = subMatch;
        if (vidMatch) videoCountLabel = `${vidMatch}+`;
      }
      longVideos = prioritizeFeaturedSurahs(longVideos);
      if (shortsHtml) {
        const parsedShorts = await fetchAllYouTubeShorts(shortsHtml, startedAt);
        if (parsedShorts.length > 0) {
          shorts = parsedShorts;
          hasLiveShorts = parsedShorts.length >= 40;
        }
      }
      const source = hasLiveLong || hasLiveShorts ? "live" : "archive";
      const stats = {
        ...DEFAULT_CHANNEL_STATS,
        subscribersLabel,
        videoCountLabel,
        source
      };
      cachedChannel = {
        fetchedAt: Date.now(),
        complete: hasLiveLong && hasLiveShorts,
        stats,
        longVideos,
        shorts
      };
      const indexNowKey = String(process.env.INDEXNOW_KEY ?? "").trim();
      const canonicalOrigin = String(process.env.CANONICAL_ORIGIN ?? "").trim();
      if (!startupIndexNowSent && indexNowKey && canonicalOrigin && /^https?:\/\//i.test(canonicalOrigin)) {
        startupIndexNowSent = true;
        const baseUrl = normalizeBaseUrl(canonicalOrigin);
        void submitIndexNowPing(baseUrl, indexNowKey, [
          `${baseUrl}/`,
          `${baseUrl}/shorts`,
          `${baseUrl}/quran`,
          `${baseUrl}/elifba`,
          `${baseUrl}/muhaffiz`,
          ...longVideos.slice(0, 8).map((v) => `${baseUrl}/video/${v.videoId}`),
          ...shorts.slice(0, 8).map((v) => `${baseUrl}/video/${v.videoId}`)
        ]).catch(() => void 0);
      }
      return { stats, longVideos, shorts };
    } catch {
      return {
        stats: DEFAULT_CHANNEL_STATS,
        longVideos: SEED_LONG_VIDEOS,
        shorts: SEED_SHORTS
      };
    } finally {
      inflightChannelPromise = null;
    }
  })();
  return inflightChannelPromise;
}
function createApiRouter() {
  const router = express2.Router();
  router.use(
    "/telegram",
    createTelegramRouter({
      getRequestOrigin,
      getChannelDataForSeo,
      fetchSurahTranslation,
      fetchMushafPage
    })
  );
  router.get("/channel", async (_req, res) => {
    const data = await fetchLiveChannelData();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.json(data);
  });
  router.get("/quran/surah/:surahNumber", async (req, res) => {
    const surahNumber = Number.parseInt(String(req.params.surahNumber ?? ""), 10);
    if (Number.isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      res.status(400).json({ error: "Sur\u0259 n\xF6mr\u0259si 1 il\u0259 114 aras\u0131nda olmal\u0131d\u0131r." });
      return;
    }
    try {
      const payload = await fetchSurahTranslation(surahNumber);
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
      res.json(payload);
    } catch {
      res.status(502).json({ error: "Ay\u0259l\u0259rin t\u0259rc\xFCm\u0259si y\xFCkl\u0259n\u0259rk\u0259n x\u0259ta ba\u015F verdi." });
    }
  });
  router.get("/quran/page/:pageNumber", async (req, res) => {
    const pageNumber = Number.parseInt(String(req.params.pageNumber ?? ""), 10);
    if (Number.isNaN(pageNumber) || pageNumber < 1 || pageNumber > TOTAL_QURAN_PAGES) {
      res.status(400).json({ error: "Quran s\u0259hif\u0259si 1 il\u0259 604 aras\u0131nda olmal\u0131d\u0131r." });
      return;
    }
    try {
      const payload = await fetchMushafPage(pageNumber);
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
      res.json(payload);
    } catch {
      res.status(502).json({ error: "Quran s\u0259hif\u0259si y\xFCkl\u0259n\u0259rk\u0259n x\u0259ta ba\u015F verdi." });
    }
  });
  router.get("/quran/muhaffiz/:pageNumber", async (req, res) => {
    const pageNumber = Number.parseInt(String(req.params.pageNumber ?? ""), 10);
    if (Number.isNaN(pageNumber) || pageNumber < 1 || pageNumber > TOTAL_QURAN_PAGES) {
      res.status(400).json({ error: "Quran s\u0259hif\u0259si 1 il\u0259 604 aras\u0131nda olmal\u0131d\u0131r." });
      return;
    }
    try {
      const payload = await fetchMuhaffizPage(pageNumber);
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
      res.json(payload);
    } catch {
      res.status(502).json({ error: "M\xFChafiz s\u0259hif\u0259si y\xFCkl\u0259n\u0259rk\u0259n x\u0259ta ba\u015F verdi." });
    }
  });
  router.get("/quran/search", async (req, res) => {
    const rawQuery = String(req.query.q ?? "").trim();
    if (rawQuery.length < 2) {
      res.status(400).json({ error: "Axtar\u0131\u015F sor\u011Fusu \u0259n az\u0131 2 simvol olmal\u0131d\u0131r." });
      return;
    }
    try {
      const encoded = encodeURIComponent(rawQuery.slice(0, 80));
      const upstream = await fetch(
        `https://api.alquran.cloud/v1/search/${encoded}/all/az.mammadaliyev`,
        {
          signal: AbortSignal.timeout(process.env.VERCEL ? 4500 : 7500),
          headers: { "User-Agent": "Mozilla/5.0" }
        }
      );
      if (!upstream.ok) {
        res.json({ query: rawQuery, matches: [] });
        return;
      }
      const data = await upstream.json();
      const matches = parseAlQuranSearchPayload(data);
      res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
      res.json({ query: rawQuery, matches });
    } catch {
      res.status(502).json({ error: "Quran ay\u0259 axtar\u0131\u015F\u0131 haz\u0131rda \u0259l\xE7atan deyil." });
    }
  });
  router.get("/requests", (_req, res) => {
    res.json({ requests: surahRequests.slice(0, 8) });
  });
  router.post("/requests", (req, res) => {
    const body = req.body ?? {};
    const input = {
      surahName: String(body.surahName ?? "").trim(),
      reciter: String(body.reciter ?? "").trim(),
      email: String(body.email ?? "").trim(),
      note: String(body.note ?? "").trim()
    };
    const validation = validateSurahRequest(input);
    if (!validation.valid) {
      res.status(400).json({
        error: "Z\u0259hm\u0259t olmasa t\u0259l\u0259b olunan sah\u0259l\u0259ri yoxlay\u0131n.",
        errors: validation.errors
      });
      return;
    }
    const record = {
      ...input,
      id: `req-${Date.now()}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    surahRequests.unshift(record);
    res.status(201).json({ request: record });
  });
  router.post("/analytics/track", (req, res) => {
    const body = req.body ?? {};
    const pageKey = String(body.pageKey ?? "");
    if (!VALID_PAGE_KEYS.has(pageKey)) {
      res.status(400).json({ error: "Ke\xE7\u0259rsiz s\u0259hif\u0259 a\xE7ar\u0131 (pageKey)." });
      return;
    }
    const rawStatus = String(body.status ?? "ok");
    const status = rawStatus === "slow" || rawStatus === "error" ? rawStatus : "ok";
    const rawRef = String(body.referrerType ?? "direct");
    const referrerType = rawRef === "internal" || rawRef === "search" || rawRef === "youtube" || rawRef === "other" ? rawRef : "direct";
    const record = {
      eventId: String(body.eventId ?? `srv-${Date.now().toString(36)}`).slice(0, 128),
      pageKey,
      pageLabel: String(body.pageLabel ?? pageKey).slice(0, 100),
      path: String(body.path ?? "/").slice(0, 180),
      status,
      httpStatus: Math.min(599, Math.max(100, Number.parseInt(String(body.httpStatus ?? 200), 10) || 200)),
      loadTimeMs: Math.min(12e4, Math.max(0, Number.parseInt(String(body.loadTimeMs ?? 0), 10) || 0)),
      sessionId: String(body.sessionId ?? "anon").slice(0, 80),
      referrerType,
      createdAtMs: Date.now()
    };
    serverTelemetryEvents.unshift(record);
    if (serverTelemetryEvents.length > MAX_SERVER_TELEMETRY_EVENTS) {
      serverTelemetryEvents.length = MAX_SERVER_TELEMETRY_EVENTS;
    }
    res.status(201).json({ tracked: true, eventId: record.eventId });
  });
  router.get("/analytics/summary", (req, res) => {
    const rawGranularity = String(req.query.granularity ?? "daily");
    const granularity = rawGranularity === "hourly" || rawGranularity === "weekly" ? rawGranularity : "daily";
    const rawPage = String(req.query.pageKey ?? "all");
    const pageKey = rawPage !== "all" && VALID_PAGE_KEYS.has(rawPage) ? rawPage : "all";
    res.json(aggregateTelemetry(serverTelemetryEvents, granularity, Date.now(), pageKey));
  });
  return router;
}
function getRequestOrigin(req) {
  const configuredCanonical = String(process.env.CANONICAL_ORIGIN ?? "").trim();
  if (configuredCanonical && /^https?:\/\//i.test(configuredCanonical)) {
    return normalizeBaseUrl(configuredCanonical);
  }
  const forwardedProto = String(req.headers["x-forwarded-proto"] ?? "").split(",")[0].trim();
  const forwardedHost = String(req.headers["x-forwarded-host"] ?? "").split(",")[0].trim();
  const host = forwardedHost || req.get("host") || "quranqiraeti.vercel.app";
  const proto = forwardedProto || (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}
async function getRouteSeoExtras(pathname) {
  const cleanPath = pathname.replace(/\/+$/, "") || "/";
  const ssrTimeoutMs = process.env.VERCEL ? 1600 : 2200;
  const surahMatch = cleanPath.match(/^\/quran\/(?:sure\/)?(\d+)$/);
  if (surahMatch) {
    const surahNumber = Number.parseInt(surahMatch[1], 10);
    if (surahNumber >= 1 && surahNumber <= 114) {
      const cached = surahTranslationCache.get(surahNumber);
      if (cached && cached.ayahs.length > 0) {
        return { surahPayload: cached };
      }
      try {
        const surahPayload = await Promise.race([
          fetchSurahTranslation(surahNumber),
          new Promise((resolve) => setTimeout(() => resolve(void 0), ssrTimeoutMs))
        ]);
        if (surahPayload && surahPayload.ayahs.length > 0) {
          return { surahPayload };
        }
      } catch {
      }
    }
    return {};
  }
  const mushafMatch = cleanPath.match(/^\/quran\/sehife\/(\d+)$/);
  if (mushafMatch) {
    const pageNumber = Number.parseInt(mushafMatch[1], 10);
    if (pageNumber >= 1 && pageNumber <= TOTAL_QURAN_PAGES) {
      const cached = mushafPageCache.get(pageNumber);
      if (cached && cached.ayahs.length > 0) {
        return { mushafPayload: cached };
      }
      try {
        const mushafPayload = await Promise.race([
          fetchMushafPage(pageNumber),
          new Promise((resolve) => setTimeout(() => resolve(void 0), ssrTimeoutMs))
        ]);
        if (mushafPayload && mushafPayload.ayahs.length > 0) {
          return { mushafPayload };
        }
      } catch {
      }
    }
  }
  return {};
}
async function getChannelDataForSeo() {
  if (cachedChannel) {
    return {
      stats: cachedChannel.stats,
      longVideos: cachedChannel.longVideos,
      shorts: cachedChannel.shorts
    };
  }
  const fallback = {
    stats: DEFAULT_CHANNEL_STATS,
    longVideos: SEED_LONG_VIDEOS,
    shorts: SEED_SHORTS
  };
  try {
    const timeoutMs = process.env.VERCEL ? 3500 : 6e3;
    return await Promise.race([
      fetchLiveChannelData(),
      new Promise((resolve) => setTimeout(() => resolve(fallback), timeoutMs))
    ]);
  } catch {
    return fallback;
  }
}
function createSeoRouter() {
  const router = express2.Router();
  router.get("/robots.txt", (req, res) => {
    const origin = getRequestOrigin(req);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.send(buildRobotsTxt(origin));
  });
  router.get("/sitemap.xml", async (req, res) => {
    const origin = getRequestOrigin(req);
    const { longVideos, shorts } = await getChannelDataForSeo();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.send(buildSitemapXml(origin, [...longVideos, ...shorts]));
  });
  router.get("/sitemap-index.xml", (req, res) => {
    const origin = getRequestOrigin(req);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.send(buildSitemapIndexXml(origin));
  });
  router.get("/sitemap-core.xml", (req, res) => {
    const origin = getRequestOrigin(req);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.send(buildCoreSitemapXml(origin));
  });
  router.get("/sitemap-surahs.xml", (req, res) => {
    const origin = getRequestOrigin(req);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    res.send(buildSurahsSitemapXml(origin));
  });
  router.get("/sitemap-mushaf.xml", (req, res) => {
    const origin = getRequestOrigin(req);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    res.send(buildMushafSitemapXml(origin));
  });
  router.get("/sitemap-muhaffiz.xml", (req, res) => {
    const origin = getRequestOrigin(req);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    res.send(buildMuhaffizSitemapXml(origin));
  });
  router.get("/sitemap-videos.xml", async (req, res) => {
    const origin = getRequestOrigin(req);
    const { longVideos, shorts } = await getChannelDataForSeo();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.send(buildVideoSitemapXml(origin, [...longVideos, ...shorts]));
  });
  router.get("/og/site.svg", (_req, res) => {
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    res.send(buildDynamicOgSvg("site"));
  });
  router.get("/og/:kind/:id.svg", (req, res) => {
    const rawKind = String(req.params.kind ?? "");
    const kind = rawKind === "sure" || rawKind === "sehife" || rawKind === "muhaffiz" ? rawKind : "site";
    const id = Number.parseInt(String(req.params.id ?? "1"), 10) || 1;
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    res.send(buildDynamicOgSvg(kind, id));
  });
  router.get("/api/seo/readiness", (req, res) => {
    const origin = getRequestOrigin(req);
    const configuredCanonical = String(process.env.CANONICAL_ORIGIN ?? "").trim();
    const indexNowKey = String(process.env.INDEXNOW_KEY ?? "").trim();
    const googleVerification = String(process.env.GOOGLE_SITE_VERIFICATION ?? "").trim();
    res.setHeader("Cache-Control", "no-store");
    res.json({
      canonicalOrigin: origin,
      canonicalOriginConfigured: Boolean(configuredCanonical && /^https?:\/\//i.test(configuredCanonical)),
      indexNowConfigured: Boolean(indexNowKey),
      googleVerificationConfigured: Boolean(googleVerification),
      endpoints: [
        `${origin}/robots.txt`,
        `${origin}/sitemap.xml`,
        `${origin}/sitemap-index.xml`,
        `${origin}/sitemap-videos.xml`,
        `${origin}/rss.xml`,
        `${origin}/llms.txt`,
        `${origin}/ai-index.json`
      ]
    });
  });
  router.get("/api/seo/indexnow-ping", async (req, res) => {
    const key = String(process.env.INDEXNOW_KEY ?? "").trim();
    if (!key) {
      res.status(200).json({
        configured: false,
        message: "INDEXNOW_KEY \u0259lav\u0259 edildikd\u0259 IndexNow bildiri\u015Fi avtomatik g\xF6nd\u0259rilir."
      });
      return;
    }
    try {
      const origin = getRequestOrigin(req);
      const { longVideos, shorts } = await getChannelDataForSeo();
      const urls = [
        `${origin}/`,
        `${origin}/shorts`,
        `${origin}/quran`,
        `${origin}/elifba`,
        `${origin}/dualar`,
        `${origin}/muhaffiz`,
        ...longVideos.slice(0, 10).map((v) => `${origin}/video/${v.videoId}`),
        ...shorts.slice(0, 10).map((v) => `${origin}/video/${v.videoId}`)
      ];
      const result = await submitIndexNowPing(origin, key, urls);
      res.json({ configured: true, ...result, submittedUrls: urls.length });
    } catch {
      res.status(502).json({ configured: true, submitted: false });
    }
  });
  router.get(["/rss.xml", "/feed.xml"], async (req, res) => {
    const origin = getRequestOrigin(req);
    const { stats, longVideos, shorts } = await getChannelDataForSeo();
    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.send(buildRssFeedXml(origin, stats, [...longVideos, ...shorts]));
  });
  router.get("/:keyFile.txt", (req, res, next) => {
    const key = String(process.env.INDEXNOW_KEY ?? "").trim();
    if (key && req.params.keyFile === key) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.send(key);
      return;
    }
    next();
  });
  router.get(["/llms.txt", "/.well-known/llms.txt"], async (req, res) => {
    const origin = getRequestOrigin(req);
    const { stats, longVideos, shorts } = await getChannelDataForSeo();
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.send(buildLlmsTxt(origin, stats, longVideos, shorts));
  });
  router.get("/llms-full.txt", async (req, res) => {
    const origin = getRequestOrigin(req);
    const { stats, longVideos, shorts } = await getChannelDataForSeo();
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.send(buildLlmsFullTxt(origin, stats, longVideos, shorts));
  });
  router.get("/ai-index.json", async (req, res) => {
    const origin = getRequestOrigin(req);
    const { stats, longVideos, shorts } = await getChannelDataForSeo();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.json(buildAiIndexJson(origin, stats, longVideos, shorts));
  });
  return router;
}

// src/server/vercelApp.ts
var app = express3();
app.use(express3.json());
var seoRouter = createSeoRouter();
var apiRouter = createApiRouter();
app.use("/", seoRouter);
app.use("/api", seoRouter);
app.use("/api", apiRouter);
var cachedDistHtml = null;
function readTemplateHtml() {
  if (cachedDistHtml) return cachedDistHtml;
  const candidates = [
    path3.resolve(process.cwd(), "dist", "index.html"),
    path3.resolve(process.cwd(), "index.html")
  ];
  for (const filePath of candidates) {
    try {
      if (fs3.existsSync(filePath)) {
        cachedDistHtml = fs3.readFileSync(filePath, "utf-8");
        return cachedDistHtml;
      }
    } catch {
    }
  }
  return null;
}
app.get("*", async (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    next();
    return;
  }
  const baseName = path3.posix.basename(req.path);
  if (baseName.includes(".")) {
    res.status(404).send("Not found");
    return;
  }
  try {
    const templateHtml = readTemplateHtml();
    if (!templateHtml) {
      res.status(500).send("Application template unavailable");
      return;
    }
    const origin = getRequestOrigin(req);
    const [{ longVideos, shorts }, extras] = await Promise.all([
      getChannelDataForSeo(),
      getRouteSeoExtras(req.path)
    ]);
    const seoMeta = resolveRouteSeoMetadata(req.path, origin, [...longVideos, ...shorts], extras);
    const html = injectRouteSeoIntoHtml(templateHtml, seoMeta, {
      googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION
    });
    res.status(seoMeta.httpStatus).setHeader("Content-Type", "text/html; charset=utf-8").setHeader("Cache-Control", seoMeta.httpStatus === 200 ? "s-maxage=300, stale-while-revalidate=3600" : "no-store").send(html);
  } catch (err) {
    next(err);
  }
});
app.use((_req, res) => {
  res.status(404).json({ error: "API mar\u015Frutu tap\u0131lmad\u0131." });
});
app.use((err, _req, res, _next) => {
  console.error("Vercel API error:", err);
  res.status(500).json({ error: "Server x\u0259tas\u0131 ba\u015F verdi." });
});
var vercelApp_default = app;
export {
  vercelApp_default as default
};
