// src/server/vercelApp.ts
import express2 from "express";
import fs from "node:fs";
import path from "node:path";

// src/lib/channel.ts
var SURAH_METADATA_MAP = [
  {
    keys: ["bakara", "b\u0259q\u0259r\u0259", "baqarah"],
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
      category: "mekke",
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
      if (!rawTitle || seconds < 120) continue;
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

// src/lib/muhaffiz.ts
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
    { loc: `${baseUrl}/zikr`, lastmod: todayIsoDate, changefreq: "weekly", priority: "0.85" },
    { loc: `${baseUrl}/namaz-vaxtlari`, lastmod: todayIsoDate, changefreq: "daily", priority: "0.9" },
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
    { loc: `${baseUrl}/zikr`, lastmod: todayIsoDate, changefreq: "weekly", priority: "0.85" },
    { loc: `${baseUrl}/namaz-vaxtlari`, lastmod: todayIsoDate, changefreq: "daily", priority: "0.9" },
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
function resolveRouteSeoMetadata(pathname, origin, videos = []) {
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
      noscriptHtml: '<h1>Quran Qiraeti \u2014 Uzun Tilav\u0259tl\u0259r v\u0259 Tam Qurani-K\u0259rim</h1><p>Az\u0259rbaycan dilind\u0259 m\u0259naca t\u0259rc\xFCm\u0259, 114 sur\u0259, 604 M\u0259din\u0259 Mushaf\u0131 s\u0259hif\u0259si v\u0259 M\xFChafiz \u0259zb\u0259r al\u0259ti.</p><nav><a href="/quran">Qurani-K\u0259rim (114 Sur\u0259)</a> \xB7 <a href="/dualar">Qurandak\u0131 Dualar</a> \xB7 <a href="/muhaffiz">M\xFChafiz \u018Fzb\u0259r</a> \xB7 <a href="/shorts">Shorts</a> \xB7 <a href="/quran/cuz/1">1-ci C\xFCz</a> \xB7 <a href="/quran/cuz/30">30-cu C\xFCz</a></nav>'
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
  if (cleanPath === "/zikr") {
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: "S\u0259h\u0259r-Ax\u015Fam Zikrl\u0259ri v\u0259 T\u0259sbih Say\u011Fac\u0131 | Quran Qiraeti",
      description: "Onlayn t\u0259sbih say\u011Fac\u0131 (33 / 99 / 100 v\u0259 Namaz sonras\u0131 33+33+34 rejimi), S\u0259h\u0259r v\u0259 Ax\u015Fam zikrl\u0259ri \u2014 \u0259r\u0259bc\u0259 m\u0259tn, oxunu\u015F v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si.",
      canonicalUrl: `${baseUrl}/zikr`,
      ogImage: defaultOg,
      ogType: "website",
      jsonLd: buildBreadcrumbJsonLd(baseUrl, [
        { name: "Ana s\u0259hif\u0259", path: "/" },
        { name: "Zikr v\u0259 T\u0259sbih", path: "/zikr" }
      ]),
      noscriptHtml: "<h1>S\u0259h\u0259r-Ax\u015Fam Zikrl\u0259ri v\u0259 \u0130nteraktiv T\u0259sbih Say\u011Fac\u0131</h1><p>Namaz t\u0259sbihat\u0131, s\u0259h\u0259r v\u0259 ax\u015Fam zikrl\u0259ri \u2014 \u0259r\u0259bc\u0259 m\u0259tn v\u0259 Az\u0259rbaycan t\u0259rc\xFCm\u0259si.</p>"
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
      noscriptHtml: `<h1>${escapeHtmlText(`${surah.number}. ${surah.name} sur\u0259si (${surah.arabicName})`)}</h1><p>${escapeHtmlText(`${surah.ayahCount} ay\u0259 \xB7 ${surah.revelationPlace} \xB7 ${startJuz}-ci C\xFCz \xB7 M\u0259din\u0259 \xE7ap\u0131 S\u0259hif\u0259 ${surah.startPage} \xB7 \u018Flixan Musayev t\u0259rc\xFCm\u0259si`)}</p><nav><a href="/quran/sehife/${surah.startPage}">M\u0259din\u0259 s\u0259hif\u0259si ${surah.startPage}</a> \xB7 <a href="/muhaffiz/${surah.startPage}">M\xFChafizd\u0259 \u0259zb\u0259rl\u0259</a> \xB7 <a href="/quran/cuz/${startJuz}">${startJuz}-ci C\xFCz</a></nav>`
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
    return {
      httpStatus: 200,
      robots: robotsIndex,
      title: `Qurani-K\u0259rim \u2014 ${ordinal} s\u0259hif\u0259 (M\u0259din\u0259 \xE7ap\u0131) | Quran Qiraeti`,
      description: `M\u0259din\u0259 \xE7ap\u0131 \xFCzr\u0259 Qurani-K\u0259rimin ${pageNum}-ci s\u0259hif\u0259si (${juz}-ci C\xFCz): \u0259r\u0259bc\u0259 m\u0259tn v\u0259 \u018Flixan Musayevin Az\u0259rbaycan t\u0259rc\xFCm\u0259si.`,
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
      noscriptHtml: `<h1>Qurani-K\u0259rim \u2014 ${escapeHtmlText(ordinal)} s\u0259hif\u0259 (${juz}-ci C\xFCz)</h1>`
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
function injectRouteSeoIntoHtml(html, meta) {
  const safeTitle = escapeHtmlText(meta.title);
  const safeDesc = escapeHtmlAttr(meta.description);
  const safeRobots = escapeHtmlAttr(meta.robots);
  const safeCanonical = escapeHtmlAttr(meta.canonicalUrl);
  const safeOgImage = escapeHtmlAttr(meta.ogImage);
  const safeOgType = escapeHtmlAttr(meta.ogType);
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
  ).replace(/<meta\s+property="og:(?:url|image:alt)"\s+content="[^"]*"\s*\/?>\s*/gi, "").replace(/<meta\s+name="twitter:(?:title|description)"\s+content="[^"]*"\s*\/?>\s*/gi, "").replace(/<link\s+rel="(?:canonical|prev|next)"\s+href="[^"]*"\s*\/?>\s*/gi, "").replace(/<link\s+rel="alternate"\s+hreflang="(?:az|x-default)"\s+href="[^"]*"\s*\/?>\s*/gi, "").replace(/<script\s+id="quran-qiraeti-ssr-jsonld"\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, "");
  const extraHeadTags = [
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
    `- [Zikrl\u0259r v\u0259 T\u0259sbih](${baseUrl}/zikr): S\u0259h\u0259r-ax\u015Fam zikrl\u0259ri, namaz t\u0259sbihat\u0131 v\u0259 g\xFCnd\u0259lik zikr say\u011Fac\u0131.`,
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
import express from "express";

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

// src/server/api.ts
var CACHE_TTL_MS = 10 * 60 * 1e3;
var cachedChannel = null;
var inflightChannelPromise = null;
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
          longVideos = parsedLong;
          hasLiveLong = true;
        }
        const subMatch = videosHtml.match(/(\d+(?:\.\d+)?[KM]?)\s+subscribers/i)?.[1];
        const vidMatch = videosHtml.match(/(\d+(?:,\d+)?)\s+videos/i)?.[1];
        if (subMatch) subscribersLabel = subMatch;
        if (vidMatch) videoCountLabel = `${vidMatch}+`;
      }
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
  const router = express.Router();
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
  const forwardedProto = String(req.headers["x-forwarded-proto"] ?? "").split(",")[0].trim();
  const forwardedHost = String(req.headers["x-forwarded-host"] ?? "").split(",")[0].trim();
  const host = forwardedHost || req.get("host") || "quranqiraeti.vercel.app";
  const proto = forwardedProto || (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
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
  const router = express.Router();
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
var app = express2();
app.use(express2.json());
var seoRouter = createSeoRouter();
var apiRouter = createApiRouter();
app.use("/", seoRouter);
app.use("/api", seoRouter);
app.use("/api", apiRouter);
var cachedDistHtml = null;
function readTemplateHtml() {
  if (cachedDistHtml) return cachedDistHtml;
  const candidates = [
    path.resolve(process.cwd(), "dist", "index.html"),
    path.resolve(process.cwd(), "index.html")
  ];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        cachedDistHtml = fs.readFileSync(filePath, "utf-8");
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
  const baseName = path.posix.basename(req.path);
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
    const { longVideos, shorts } = await getChannelDataForSeo();
    const seoMeta = resolveRouteSeoMetadata(req.path, origin, [...longVideos, ...shorts]);
    const html = injectRouteSeoIntoHtml(templateHtml, seoMeta);
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
