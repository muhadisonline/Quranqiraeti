import { Check, Eye, RotateCcw, Shuffle, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MUHAFFIZ_THEME_PALETTES, MuhaffizPaperTheme, getEveryAyahAudioUrl, MuhaffizReciterId } from '../../lib/muhaffiz';
import {
  buildClozeQuestionForAyah,
  buildNextAyahQuestions,
  evaluateClozeSelection,
} from '../../lib/muhaffizQuiz';
import { MushafPageAyah } from '../../lib/quran';

type PracticeTab = 'cloze' | 'next-ayah';

interface MuhaffizPracticeModalProps {
  isOpen: boolean;
  pageNumber: number;
  ayahs: MushafPageAyah[];
  paperTheme: MuhaffizPaperTheme;
  reciter: MuhaffizReciterId;
  onRecordWeakAyah?: (
    ayahKey: string,
    surahName: string,
    reason: 'quiz_error' | 'hint_heavy'
  ) => void;
  onClose: () => void;
}

export function MuhaffizPracticeModal({
  isOpen,
  pageNumber,
  ayahs,
  paperTheme,
  reciter,
  onRecordWeakAyah,
  onClose,
}: MuhaffizPracticeModalProps) {
  const palette = MUHAFFIZ_THEME_PALETTES[paperTheme];
  const cardBg = palette.isDark ? '#1a1916' : '#fffdf8';

  const [activeTab, setActiveTab] = useState<PracticeTab>('cloze');

  // Tab 1: Cloze Fill-in-the-Blank State
  const [clozeIndex, setClozeIndex] = useState<number>(0);
  const [clozeSeed, setClozeSeed] = useState<number>(0);
  const [filledOptions, setFilledOptions] = useState<Record<string, string>>({});
  const [focusedBlankId, setFocusedBlankId] = useState<string | null>(null);
  const [showTranslationHint, setShowTranslationHint] = useState<boolean>(false);
  const [clozeSolvedKeys, setClozeSolvedKeys] = useState<Set<string>>(() => new Set());

  // Tab 2: Next Ayah Sequence State
  const [nextIndex, setNextIndex] = useState<number>(0);
  const [nextSeed, setNextSeed] = useState<number>(0);
  const [selectedNextKey, setSelectedNextKey] = useState<string | null>(null);
  const [nextCorrectCount, setNextCorrectCount] = useState<number>(0);
  const [nextAnsweredCount, setNextAnsweredCount] = useState<number>(0);
  const [isPlayingPromptAudio, setIsPlayingPromptAudio] = useState<boolean>(false);
  const promptAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopPromptAudio = useCallback(() => {
    if (promptAudioRef.current) {
      promptAudioRef.current.pause();
      promptAudioRef.current.onended = null;
      promptAudioRef.current.onerror = null;
      promptAudioRef.current = null;
    }
    setIsPlayingPromptAudio(false);
  }, []);

  useEffect(() => {
    setClozeIndex(0);
    setFilledOptions({});
    setFocusedBlankId(null);
    setClozeSolvedKeys(new Set());
    setNextIndex(0);
    setSelectedNextKey(null);
    setNextCorrectCount(0);
    setNextAnsweredCount(0);
    stopPromptAudio();
  }, [pageNumber, isOpen, stopPromptAudio]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      stopPromptAudio();
    };
  }, [stopPromptAudio]);

  const safeClozeIndex = ayahs.length > 0 ? Math.min(clozeIndex, ayahs.length - 1) : 0;
  const currentClozeAyah = ayahs[safeClozeIndex];

  const clozeQuestion = useMemo(() => {
    if (!currentClozeAyah) return null;
    return buildClozeQuestionForAyah(currentClozeAyah, ayahs, clozeSeed);
  }, [currentClozeAyah, ayahs, clozeSeed]);

  useEffect(() => {
    if (clozeQuestion && clozeQuestion.blanks.length > 0) {
      setFocusedBlankId(clozeQuestion.blanks[0].blankId);
    } else {
      setFocusedBlankId(null);
    }
    setFilledOptions({});
  }, [clozeQuestion]);

  const clozeEval = useMemo(() => {
    if (!clozeQuestion) {
      return { allFilled: false, allCorrect: false, correctCount: 0, totalBlanks: 0 };
    }
    return evaluateClozeSelection(clozeQuestion, filledOptions);
  }, [clozeQuestion, filledOptions]);

  const reportedClozeWrongRef = useRef<string | null>(null);
  useEffect(() => {
    if (!clozeQuestion) return;
    if (clozeEval.allCorrect) {
      setClozeSolvedKeys((prev) => {
        if (prev.has(clozeQuestion.ayahKey)) return prev;
        const next = new Set(prev);
        next.add(clozeQuestion.ayahKey);
        return next;
      });
    } else if (
      clozeEval.allFilled &&
      !clozeEval.allCorrect &&
      reportedClozeWrongRef.current !== clozeQuestion.ayahKey
    ) {
      reportedClozeWrongRef.current = clozeQuestion.ayahKey;
      onRecordWeakAyah?.(clozeQuestion.ayahKey, clozeQuestion.surahName, 'quiz_error');
    }
  }, [clozeQuestion, clozeEval.allCorrect, clozeEval.allFilled, onRecordWeakAyah]);

  const nextQuestions = useMemo(() => buildNextAyahQuestions(ayahs, nextSeed), [ayahs, nextSeed]);
  const safeNextIndex =
    nextQuestions.length > 0 ? Math.min(nextIndex, nextQuestions.length - 1) : 0;
  const currentNextQuestion = nextQuestions[safeNextIndex] ?? null;

  if (!isOpen) return null;

  const usedOptionIds = new Set(Object.values(filledOptions));

  function handleOptionClick(optId: string) {
    if (!clozeQuestion) return;
    if (usedOptionIds.has(optId)) return;

    const targetBlankId =
      focusedBlankId && !filledOptions[focusedBlankId]
        ? focusedBlankId
        : clozeQuestion.blanks.find((b) => !filledOptions[b.blankId])?.blankId ??
          clozeQuestion.blanks[0]?.blankId;

    if (!targetBlankId) return;

    const updated = { ...filledOptions, [targetBlankId]: optId };
    setFilledOptions(updated);

    const nextEmpty = clozeQuestion.blanks.find((b) => !updated[b.blankId]);
    setFocusedBlankId(nextEmpty ? nextEmpty.blankId : null);
  }

  function handleClearBlank(blankId: string) {
    setFilledOptions((prev) => {
      if (!prev[blankId]) return prev;
      const next = { ...prev };
      delete next[blankId];
      return next;
    });
    setFocusedBlankId(blankId);
  }

  function handleSelectNextOption(optKey: string, isCorrect: boolean) {
    if (selectedNextKey !== null) return;
    setSelectedNextKey(optKey);
    setNextAnsweredCount((n) => n + 1);
    if (isCorrect) {
      setNextCorrectCount((n) => n + 1);
    } else if (currentNextQuestion) {
      onRecordWeakAyah?.(
        currentNextQuestion.promptAyahKey,
        currentNextQuestion.promptSurahName,
        'quiz_error'
      );
    }
  }

  function handleTogglePromptAudio() {
    if (!currentNextQuestion) return;
    if (isPlayingPromptAudio) {
      stopPromptAudio();
      return;
    }
    stopPromptAudio();
    const audio = new Audio(
      getEveryAyahAudioUrl(
        currentNextQuestion.promptSurahNumber,
        currentNextQuestion.promptAyahNumber,
        reciter
      )
    );
    promptAudioRef.current = audio;
    setIsPlayingPromptAudio(true);
    audio.onended = () => {
      if (promptAudioRef.current === audio) stopPromptAudio();
    };
    audio.onerror = () => {
      if (promptAudioRef.current === audio) stopPromptAudio();
    };
    void audio.play().catch(() => {
      if (promptAudioRef.current === audio) stopPromptAudio();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      dir="ltr"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mühafiz Əzbər Testi"
        data-testid="muhaffiz-practice-modal"
        style={{
          backgroundColor: palette.paper,
          color: palette.ink,
          borderColor: palette.line,
        }}
        className="max-h-[90dvh] w-full max-w-[640px] overflow-y-auto rounded-t-2xl border px-4 pt-3 pb-6 shadow-2xl sm:rounded-2xl sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b pb-3" style={{ borderColor: palette.line }}>
          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: palette.muted }}>
              Səhifə {pageNumber} · İnteraktiv Məşq
            </p>
            <h2 className="font-display text-lg font-bold">Əzbər Testi və Ardıcıllıq Məşqi</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Bağla"
            data-testid="practice-modal-close"
            style={{ backgroundColor: palette.chip, borderColor: palette.line }}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border hover:opacity-80"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div
          role="tablist"
          aria-label="Test rejimi"
          style={{ backgroundColor: palette.chip, borderColor: palette.line }}
          className="mt-4 grid grid-cols-2 gap-1 rounded-xl border p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cloze'}
            data-testid="practice-tab-cloze"
            onClick={() => {
              stopPromptAudio();
              setActiveTab('cloze');
            }}
            style={
              activeTab === 'cloze'
                ? { backgroundColor: palette.green, color: palette.paper }
                : { color: palette.muted }
            }
            className="rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
          >
            Boşluq Doldurma ({clozeSolvedKeys.size}/{ayahs.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'next-ayah'}
            data-testid="practice-tab-next-ayah"
            onClick={() => {
              stopPromptAudio();
              setActiveTab('next-ayah');
            }}
            style={
              activeTab === 'next-ayah'
                ? { backgroundColor: palette.green, color: palette.paper }
                : { color: palette.muted }
            }
            className="rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
          >
            Növbəti Ayəni Tap ({nextCorrectCount}/{nextAnsweredCount})
          </button>
        </div>

        {ayahs.length === 0 ? (
          <p className="py-8 text-center text-xs" style={{ color: palette.muted }}>
            Səhifə məlumatları hələ yüklənir...
          </p>
        ) : activeTab === 'cloze' && clozeQuestion ? (
          <div className="mt-4 space-y-4" data-testid="cloze-practice-panel">
            {/* Ayah Selector Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono-tabular font-semibold" style={{ color: palette.green }}>
                  {clozeQuestion.surahName} · {clozeQuestion.ayahKey}
                </span>
                <span style={{ color: palette.muted }}>
                  ({safeClozeIndex + 1} / {ayahs.length})
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowTranslationHint((v) => !v)}
                  style={{ borderColor: palette.line, backgroundColor: palette.chip }}
                  className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium"
                >
                  <Eye className="h-3 w-3" aria-hidden="true" />
                  <span>{showTranslationHint ? 'Tərcüməni gizlət' : 'Tərcümə ipucu'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setClozeSeed((s) => s + 1)}
                  title="Fərqli sözləri gizlət"
                  style={{ borderColor: palette.line, backgroundColor: palette.chip }}
                  className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium"
                >
                  <Shuffle className="h-3 w-3" aria-hidden="true" />
                  <span>Qarışdır</span>
                </button>
              </div>
            </div>

            {/* Ayah with Cloze Blanks */}
            <div
              dir="rtl"
              lang="ar"
              style={{ backgroundColor: cardBg, borderColor: palette.line }}
              className="font-arabic rounded-2xl border p-4 text-right text-2xl leading-[2.3] sm:text-[1.75rem]"
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-2">
                {clozeQuestion.tokens.map((tok) => {
                  if (!tok.blankId) {
                    return <span key={tok.index}>{tok.text}</span>;
                  }
                  const blankId = tok.blankId;
                  const chosenOptId = filledOptions[blankId];
                  const chosenOpt = clozeQuestion.options.find((o) => o.id === chosenOptId);
                  const blankObj = clozeQuestion.blanks.find((b) => b.blankId === blankId);
                  const isFocused = focusedBlankId === blankId;
                  const isCorrect =
                    clozeEval.allFilled && chosenOpt && blankObj
                      ? chosenOpt.text === blankObj.correctWord
                      : null;

                  return (
                    <button
                      key={tok.index}
                      type="button"
                      data-testid={`cloze-${blankId}`}
                      onClick={() => {
                        if (chosenOptId) {
                          handleClearBlank(blankId);
                        } else {
                          setFocusedBlankId(blankId);
                        }
                      }}
                      style={{
                        borderColor:
                          isCorrect === true
                            ? palette.green
                            : isCorrect === false
                              ? '#b91c1c'
                              : isFocused
                                ? palette.gold
                                : palette.line,
                        backgroundColor:
                          isCorrect === true
                            ? palette.fresh
                            : isCorrect === false
                              ? 'rgba(185,28,28,0.12)'
                              : palette.chip,
                        color: chosenOpt ? palette.ink : palette.muted,
                      }}
                      className="inline-flex min-w-[76px] items-center justify-center rounded-lg border-2 border-dashed px-2.5 py-0.5 text-xl transition-colors"
                    >
                      {chosenOpt ? chosenOpt.text : '_____'}
                    </button>
                  );
                })}
              </div>
            </div>

            {showTranslationHint && (
              <p
                lang="az"
                style={{ backgroundColor: palette.chip, borderColor: palette.line }}
                className="rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed"
              >
                {clozeQuestion.translation}
              </p>
            )}

            {/* Selectable Word Chips */}
            <div>
              <p className="mb-2 text-xs font-medium" style={{ color: palette.muted }}>
                Uyğun ərəb kəlmələrini sırası ilə seçin (silmək üçün boşluğa toxunun):
              </p>
              <div dir="rtl" lang="ar" className="flex flex-wrap gap-2">
                {clozeQuestion.options.map((opt) => {
                  const isUsed = usedOptionIds.has(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isUsed}
                      data-testid={`cloze-opt-${opt.id}`}
                      onClick={() => handleOptionClick(opt.id)}
                      style={{
                        backgroundColor: isUsed ? palette.bar : cardBg,
                        borderColor: palette.line,
                        color: palette.ink,
                      }}
                      className={`font-arabic rounded-xl border px-3.5 py-1.5 text-xl transition-all ${
                        isUsed ? 'cursor-not-allowed opacity-35' : 'hover:opacity-80'
                      }`}
                    >
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Evaluation Status & Footer Controls */}
            {clozeEval.allFilled && (
              <div
                role="status"
                data-testid="cloze-result-banner"
                style={{
                  backgroundColor: clozeEval.allCorrect ? palette.fresh : 'rgba(185,28,28,0.09)',
                  borderColor: clozeEval.allCorrect ? palette.green : '#b91c1c',
                }}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium"
              >
                <span className="inline-flex items-center gap-1.5">
                  {clozeEval.allCorrect ? (
                    <>
                      <Check className="h-4 w-4" style={{ color: palette.green }} />
                      <span>Maşallah! Bütün {clozeEval.totalBlanks} boşluq düzgün dolduruldu.</span>
                    </>
                  ) : (
                    <span>
                      {clozeEval.totalBlanks} boşluqdan {clozeEval.correctCount}-i düzgündür. Yanlış
                      boşluğa toxunub yenidən seçə bilərsiniz.
                    </span>
                  )}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3" style={{ borderColor: palette.line }}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safeClozeIndex <= 0}
                  onClick={() => setClozeIndex((i) => Math.max(0, i - 1))}
                  style={{ borderColor: palette.line, backgroundColor: palette.chip }}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                >
                  Əvvəlki ayə
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilledOptions({});
                    setFocusedBlankId(clozeQuestion.blanks[0]?.blankId ?? null);
                  }}
                  style={{ borderColor: palette.line, backgroundColor: palette.chip }}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  <span>Təmizlə</span>
                </button>
              </div>

              <button
                type="button"
                disabled={safeClozeIndex >= ayahs.length - 1}
                data-testid="cloze-next-ayah-btn"
                onClick={() => setClozeIndex((i) => Math.min(ayahs.length - 1, i + 1))}
                style={{ backgroundColor: palette.green, color: palette.paper }}
                className="rounded-lg px-4 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Növbəti ayə →
              </button>
            </div>
          </div>
        ) : (
          /* Tab 2: Next Ayah Sequence Drill (#10) */
          <div className="mt-4 space-y-4" data-testid="next-ayah-practice-panel">
            {!currentNextQuestion ? (
              <div
                style={{ backgroundColor: cardBg, borderColor: palette.line }}
                className="rounded-xl border p-6 text-center text-xs"
              >
                <p>Bu səhifədə ardıcıl ayə cütlüyü kifayət qədər deyil.</p>
                <p className="mt-1" style={{ color: palette.muted }}>
                  Birdən çox ayə olan səhifəyə keçərək ardıcıllıq məşqi edə bilərsiniz.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono-tabular font-semibold" style={{ color: palette.green }}>
                    Cari ayə: {currentNextQuestion.promptSurahName} · {currentNextQuestion.promptAyahKey}
                    <span className="ml-2 font-normal" style={{ color: palette.muted }}>
                      ({safeNextIndex + 1}/{nextQuestions.length})
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={handleTogglePromptAudio}
                    data-testid="next-ayah-audio-btn"
                    style={{ borderColor: palette.line, backgroundColor: palette.chip }}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-[11px] font-medium"
                  >
                    {isPlayingPromptAudio ? (
                      <>
                        <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Səsi dayandır</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Ayəni dinlə</span>
                      </>
                    )}
                  </button>
                </div>

                <div
                  dir="rtl"
                  lang="ar"
                  style={{ backgroundColor: cardBg, borderColor: palette.line }}
                  className="font-arabic rounded-2xl border p-4 text-right text-2xl leading-[2.2]"
                >
                  {currentNextQuestion.promptArabic}
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium" style={{ color: palette.muted }}>
                    Bu ayədən dərhal sonra gələn ayənin başlanğıcını seçin:
                  </p>
                  <div className="space-y-2">
                    {currentNextQuestion.options.map((opt, idx) => {
                      const isChosen = selectedNextKey === opt.ayahKey;
                      const showResult = selectedNextKey !== null;
                      const isRightOption = opt.isCorrect;

                      let borderCol = palette.line;
                      let bgCol = cardBg;
                      if (showResult && isRightOption) {
                        borderCol = palette.green;
                        bgCol = palette.isDark ? 'rgba(134, 199, 174, 0.18)' : 'rgba(15, 76, 58, 0.12)';
                      } else if (showResult && isChosen && !isRightOption) {
                        borderCol = '#b91c1c';
                        bgCol = palette.isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(185, 28, 28, 0.12)';
                      }

                      return (
                        <button
                          key={opt.ayahKey}
                          type="button"
                          disabled={showResult}
                          data-testid={`next-ayah-opt-${idx}`}
                          onClick={() => handleSelectNextOption(opt.ayahKey, opt.isCorrect)}
                          style={{ borderColor: borderCol, backgroundColor: bgCol }}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left transition-colors ${
                            showResult && (isRightOption || isChosen) ? 'border-2' : 'border'
                          }`}
                        >
                          <span className="inline-flex shrink-0 items-center gap-1.5 font-mono-tabular text-[11px] font-semibold" style={{ color: showResult && isRightOption ? palette.green : showResult && isChosen ? '#b91c1c' : palette.muted }}>
                            {showResult && isRightOption && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                            {showResult && isChosen && !isRightOption && <X className="h-3.5 w-3.5" aria-hidden="true" />}
                            <span>{showResult ? opt.ayahKey : `#${idx + 1}`}</span>
                          </span>
                          <span dir="rtl" lang="ar" className="font-arabic text-right text-xl leading-relaxed">
                            {opt.previewArabic}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedNextKey !== null && (
                  <div
                    role="status"
                    data-testid="next-ayah-feedback"
                    style={{
                      backgroundColor: palette.chip,
                      borderColor:
                        selectedNextKey === currentNextQuestion.correctNextKey ? palette.green : palette.gold,
                    }}
                    className="rounded-xl border px-3.5 py-2.5 text-xs"
                  >
                    <p className="font-semibold inline-flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" style={{ color: palette.gold }} aria-hidden="true" />
                      <span>
                        {selectedNextKey === currentNextQuestion.correctNextKey
                          ? `Düzgün! Növbəti ayə (${currentNextQuestion.correctNextKey}):`
                          : `Düzgün cavab ${currentNextQuestion.correctNextKey} idi:`}
                      </span>
                    </p>
                    <p className="mt-1 leading-relaxed" style={{ color: palette.muted }}>
                      {currentNextQuestion.correctNextTranslation}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: palette.line }}>
                  <button
                    type="button"
                    onClick={() => {
                      setNextSeed((s) => s + 1);
                      setNextIndex(0);
                      setSelectedNextKey(null);
                      stopPromptAudio();
                    }}
                    style={{ borderColor: palette.line, backgroundColor: palette.chip }}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium"
                  >
                    <Shuffle className="h-3 w-3" aria-hidden="true" />
                    <span>Yenidən qarışdır</span>
                  </button>

                  <button
                    type="button"
                    disabled={safeNextIndex >= nextQuestions.length - 1}
                    data-testid="next-ayah-step-btn"
                    onClick={() => {
                      stopPromptAudio();
                      setSelectedNextKey(null);
                      setNextIndex((i) => Math.min(nextQuestions.length - 1, i + 1));
                    }}
                    style={{ backgroundColor: palette.green, color: palette.paper }}
                    className="rounded-lg px-4 py-1.5 text-xs font-semibold disabled:opacity-40"
                  >
                    Növbəti sual →
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
