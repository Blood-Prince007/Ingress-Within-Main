import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, RotateCw, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import CostBenefitAuditResultView from './CostBenefitAuditResultView';
import { COST_BENEFIT_QUESTIONS } from '../../../lib/exercises/v4/definitions/costBenefitCatalog';

const EXAMPLE_PATTERNS = [
  'Saying yes when you mean no, then feeling resentful about it later without saying anything.',
  'Going quiet or shutting down during conflict instead of naming what is actually wrong.',
  'Staying constantly busy so there is no time to think about one specific thing.',
  'Over-preparing or over-researching instead of starting something that makes you anxious.',
  'Making a joke the moment a conversation starts to feel too serious.'
];

export default function CostBenefitAuditFlow({ instance, instanceId, onClose, onComplete }) {
  const targetInstanceId = instance?.id || instanceId;

  // Flow Phases: 'intro' | 'pattern_entry' | 'pattern_intro' | 'q1' | 'q2' | 'q3' | 'q4' | 'loading' | 'result'
  const [phase, setPhase] = useState('intro');
  const [patternInputs, setPatternInputs] = useState(['', '', '']);
  const [patternList, setPatternList] = useState([]);
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [session, setSession] = useState([]); // [{ cost: '', protection: '', origin: '', stillMakesSense: '' }, ...]
  const [showExamples, setShowExamples] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

  const textareaRef = useRef(null);

  // Auto-focus active inputs
  useEffect(() => {
    if (['q1', 'q2', 'q3', 'q4'].includes(phase)) {
      const timer = setTimeout(() => {
        if (textareaRef.current) textareaRef.current.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [phase, currentPatternIndex]);

  // Mandatory 3 patterns check for pattern_entry step
  const filledMandatoryPatterns = patternInputs.slice(0, 3).filter(s => s.trim().length >= 2).length;
  const isPatternEntryValid = filledMandatoryPatterns === 3;

  // Handlers for Pattern Entry
  const handleAddPattern = () => {
    if (patternInputs.length < 5) {
      setPatternInputs(prev => [...prev, '']);
    }
  };

  const handleRemovePattern = (idx) => {
    if (idx >= 3) {
      setPatternInputs(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handlePatternChange = (idx, value) => {
    setPatternInputs(prev => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleConfirmPatterns = () => {
    const cleaned = patternInputs.map(s => s.trim()).filter(s => s.length >= 2);
    if (cleaned.length < 3) return;

    setPatternList(cleaned);
    setSession(cleaned.map((_, idx) => session[idx] || { cost: '', protection: '', origin: '', stillMakesSense: '' }));
    setCurrentPatternIndex(0);
    setPhase('pattern_intro');
  };

  // Handlers for Questions
  const currentPatternText = patternList[currentPatternIndex] || '';
  const currentAnswers = session[currentPatternIndex] || { cost: '', protection: '', origin: '', stillMakesSense: '' };

  const getQuestionConfig = (qNum) => {
    const qKey = qNum === 1 ? 'cost' : qNum === 2 ? 'protection' : qNum === 3 ? 'origin' : 'stillMakesSense';
    const qMeta = COST_BENEFIT_QUESTIONS.find(q => q.id === qKey);
    const maxChars = qNum === 4 ? 400 : 600;
    const softThreshold = qNum === 4 ? 300 : 500;
    return { qKey, qMeta, maxChars, softThreshold };
  };

  const handleAnswerChange = (qKey, value) => {
    setSession(prev => {
      const next = [...prev];
      next[currentPatternIndex] = {
        ...(next[currentPatternIndex] || {}),
        [qKey]: value
      };
      return next;
    });
  };

  const handleNextQuestion = async (qNum) => {
    const { qKey } = getQuestionConfig(qNum);
    const currentVal = (currentAnswers[qKey] || '').trim();
    if (!currentVal) return;

    if (qNum < 4) {
      setPhase(`q${qNum + 1}`);
    } else {
      // Finished all 4 questions for current pattern
      if (currentPatternIndex < patternList.length - 1) {
        setCurrentPatternIndex(prev => prev + 1);
        setPhase('pattern_intro');
      } else {
        // Finished all patterns! Proceed to final submit
        await handleFinalSubmit();
      }
    }
  };

  const handleBackQuestion = (qNum) => {
    if (qNum === 1) {
      setPhase('pattern_intro');
    } else {
      setPhase(`q${qNum - 1}`);
    }
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmissionError(null);
    setPhase('loading');

    const formattedPayload = {
      instance_id: targetInstanceId,
      exercise_id: 'cost_benefit_audit',
      patterns: patternList.map((pName, idx) => ({
        pattern: pName,
        answers: {
          cost: (session[idx]?.cost || '').trim(),
          protection: (session[idx]?.protection || '').trim(),
          origin: (session[idx]?.origin || '').trim(),
          stillMakesSense: (session[idx]?.stillMakesSense || '').trim()
        }
      }))
    };

    try {
      const res = await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedPayload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to submit reflections. Please try again.');
      }

      setPhase('result');
      if (onComplete) onComplete();
    } catch (err) {
      console.error('[CostBenefitAuditFlow] Submission failed:', err);
      setSubmissionError(err.message || 'Submission failed. Your responses are preserved.');
      setPhase('q4'); // Return to last question so answers are never lost
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER PHASE: RESULT ---
  if (phase === 'result') {
    return (
      <CostBenefitAuditResultView
        instanceId={targetInstanceId}
        onClose={onClose}
      />
    );
  }

  // --- RENDER PHASE: LOADING ---
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-[#F4F6F5] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-[480px] w-full bg-white rounded-2xl p-10 border border-[#1E2A2E]/10 shadow-sm flex flex-col items-center space-y-4">
          <RotateCw className="w-7 h-7 animate-spin text-[#2E7A70] opacity-80" />
          <h2 className="font-serif text-xl text-[#1E2A2E] font-normal">
            Looking at what you described...
          </h2>
          <p className="text-sm text-[#4A6A64] font-light leading-relaxed">
            Organizing your reflections on what each pattern costs and the protection it preserves.
          </p>
        </div>
      </div>
    );
  }

  // --- RENDER PHASE: INTRO ---
  if (phase === 'intro') {
    return (
      <div className="fixed inset-0 z-50 bg-[#F4F6F5] flex flex-col justify-between p-6 md:p-12 font-sans overflow-y-auto">
        <div className="max-w-[620px] mx-auto w-full pt-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/logo-mark-transparent.png" 
                alt="Ingress Within" 
                className="w-5 h-5 object-contain" 
              />
              <span className="font-serif font-semibold text-xs text-[#1E2A2E]">ingress <em className="text-[#8DBFB4] not-italic">within</em></span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#4A6A64] hover:text-[#1E2A2E] transition-colors rounded-full hover:bg-black/5"
              aria-label="Close"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white border border-[#1E2A2E]/10 rounded-2xl p-8 md:p-10 shadow-xs space-y-6">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#2E7A70]">
              Cost-Benefit Audit
            </span>
            
            <h1 className="font-serif text-2xl md:text-3xl text-[#1E2A2E] font-normal leading-snug">
              Cost-Benefit Audit
            </h1>

            <p className="text-sm md:text-base text-[#4A6A64] leading-relaxed font-light">
              Every pattern has a function. Before we look at where this shows up, we need to look at what it does for you — what it costs and what it protects.
            </p>

            <p className="text-sm md:text-base text-[#4A6A64] leading-relaxed font-light">
              This works best if you already have something in mind — a way of behaving, avoiding, or responding that you've noticed about yourself, or that someone else has named for you before. It's not designed to surface a pattern you haven't spotted yet; it's for taking a closer look at one you already have a sense of.
            </p>

            <p className="text-sm text-[#4A6A64] leading-relaxed font-light">
              You'll name 3 patterns (and up to 2 more if you wish), then answer four questions about each. Answer honestly.
            </p>

            <button
              onClick={() => setPhase('pattern_entry')}
              className="w-full py-3.5 px-6 rounded-xl bg-[#E0A898] hover:bg-[#d69b8b] text-[#1E2A2E] font-semibold text-sm transition-all shadow-xs cursor-pointer text-center"
            >
              Begin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER PHASE: PATTERN ENTRY ---
  if (phase === 'pattern_entry') {
    return (
      <div className="fixed inset-0 z-50 bg-[#F4F6F5] flex flex-col justify-between p-6 md:p-12 font-sans overflow-y-auto">
        <div className="max-w-[620px] mx-auto w-full pt-4 space-y-6 pb-12">
          <button
            onClick={() => setPhase('intro')}
            className="p-2 text-[#4A6A64] hover:text-[#1E2A2E] transition-colors rounded-full hover:bg-black/5"
            aria-label="Back to intro"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="bg-white border border-[#1E2A2E]/10 rounded-2xl p-8 md:p-10 shadow-xs space-y-6">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#2E7A70]">
              Cost-Benefit Audit
            </span>

            <h1 className="font-serif text-2xl md:text-3xl text-[#1E2A2E] font-normal leading-snug">
              Name your patterns
            </h1>

            <p className="text-xs md:text-sm text-[#4A6A64] leading-relaxed font-light">
              A pattern is a way of behaving, avoiding, or responding that shows up more than once — something you do or don't do, often enough that you've noticed it about yourself, or that someone close to you has pointed out before. Describe each one in a sentence or two, the way you'd actually say it, not a diagnosis. Name 3 to start, and up to 2 more if you have them.
            </p>

            {/* Examples Accordion */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowExamples(prev => !prev)}
                className="text-xs text-[#2E7A70] hover:text-[#1E2A2E] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Need a starting point? See a few examples</span>
                {showExamples ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showExamples && (
                <div className="p-4 bg-[#ECEFF0] rounded-xl text-xs text-[#4A6A64] leading-relaxed space-y-2">
                  <p className="italic text-[#1E2A2E] mb-2 font-medium">
                    These aren't a checklist to pick from — they're just here to spark recognition of your own version:
                  </p>
                  <ul className="space-y-1.5 list-disc list-inside">
                    {EXAMPLE_PATTERNS.map((ex, i) => (
                      <li key={i}>{ex}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Pattern Input Fields */}
            <div className="space-y-4 pt-2">
              {patternInputs.map((val, idx) => {
                const isMandatory = idx < 3;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#1E2A2E] uppercase tracking-wider text-[10px]">
                        Pattern {idx + 1} {isMandatory ? '(mandatory)' : '(optional)'}
                      </span>
                      {!isMandatory && (
                        <button
                          type="button"
                          onClick={() => handleRemovePattern(idx)}
                          className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <textarea
                      value={val}
                      onChange={(e) => handlePatternChange(idx, e.target.value)}
                      maxLength={300}
                      rows={2}
                      placeholder={
                        idx === 0
                          ? "e.g., Saying yes when I mean no, then feeling resentful without speaking up."
                          : idx === 1
                          ? "e.g., Delaying difficult conversations until they become urgent."
                          : "e.g., Working continuously to avoid feeling unstructured or anxious."
                      }
                      className="w-full text-sm text-[#1E2A2E] bg-white border border-[#1E2A2E]/15 rounded-xl p-3.5 focus:border-[#1E2A2E] focus:ring-2 focus:ring-[#1E2A2E]/5 outline-none transition-all resize-none placeholder:text-stone-400 font-light"
                    />
                  </div>
                );
              })}
            </div>

            {/* Add Pattern Button */}
            {patternInputs.length < 5 && (
              <button
                type="button"
                onClick={handleAddPattern}
                className="text-xs font-semibold text-[#2E7A70] hover:text-[#1E2A2E] flex items-center gap-1.5 transition-colors cursor-pointer pt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add another pattern (up to 5)</span>
              </button>
            )}

            {/* Continue Button */}
            <div className="pt-4 space-y-3">
              <button
                onClick={handleConfirmPatterns}
                disabled={!isPatternEntryValid}
                className="w-full py-3.5 px-6 rounded-xl bg-[#1E2A2E] hover:bg-[#16201F] disabled:opacity-40 disabled:hover:bg-[#1E2A2E] text-white font-semibold text-sm transition-all shadow-xs cursor-pointer text-center"
              >
                Continue
              </button>
              {!isPatternEntryValid && (
                <p className="text-[11px] text-[#4A6A64] text-center italic">
                  Please name at least the first 3 mandatory patterns to proceed.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER PHASE: PATTERN INTRO SCREEN ---
  if (phase === 'pattern_intro') {
    return (
      <div className="fixed inset-0 z-50 bg-[#F4F6F5] flex flex-col justify-between p-6 md:p-12 font-sans overflow-y-auto">
        <div className="max-w-[620px] mx-auto w-full pt-4 space-y-6">
          <button
            onClick={() => {
              if (currentPatternIndex === 0) {
                setPhase('pattern_entry');
              } else {
                setCurrentPatternIndex(prev => prev - 1);
                setPhase('q4');
              }
            }}
            className="p-2 text-[#4A6A64] hover:text-[#1E2A2E] transition-colors rounded-full hover:bg-black/5"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="bg-white border border-[#1E2A2E]/10 rounded-2xl p-8 md:p-10 shadow-xs space-y-6">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#2E7A70]">
              Pattern {currentPatternIndex + 1} of {patternList.length}
            </span>

            <h1 className="font-serif text-2xl md:text-3xl text-[#1E2A2E] font-normal leading-snug">
              Your pattern
            </h1>

            {/* Soft Iris Pull-quote Treatment */}
            <div className="border-l-3 border-[#B8A8D4] bg-[#B8A8D4]/10 p-5 rounded-r-xl my-4">
              <p className="font-serif italic text-lg md:text-xl text-[#1E2A2E] leading-relaxed">
                "{currentPatternText}"
              </p>
            </div>

            <p className="text-xs md:text-sm text-[#4A6A64] leading-relaxed font-light">
              The next four questions are about this pattern specifically.
            </p>

            <button
              onClick={() => setPhase('q1')}
              className="w-full py-3.5 px-6 rounded-xl bg-[#1E2A2E] hover:bg-[#16201F] text-white font-semibold text-sm transition-all shadow-xs cursor-pointer text-center"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER PHASES: QUESTIONS 1 TO 4 ---
  const qNum = phase === 'q1' ? 1 : phase === 'q2' ? 2 : phase === 'q3' ? 3 : phase === 'q4' ? 4 : 1;
  const { qKey, qMeta, maxChars, softThreshold } = getQuestionConfig(qNum);
  const currentAnswerValue = currentAnswers[qKey] || '';
  const isLastQuestionOfLastPattern = qNum === 4 && currentPatternIndex === patternList.length - 1;
  const isAnswerValid = currentAnswerValue.trim().length >= 2;

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F6F5] flex flex-col justify-between p-6 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-[620px] mx-auto w-full pt-4 space-y-6 pb-12">
        <button
          onClick={() => handleBackQuestion(qNum)}
          className="p-2 text-[#4A6A64] hover:text-[#1E2A2E] transition-colors rounded-full hover:bg-black/5"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="bg-white border border-[#1E2A2E]/10 rounded-2xl p-8 md:p-10 shadow-xs space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-[#2E7A70]">
            <span>Pattern {currentPatternIndex + 1} of {patternList.length}</span>
            <span>Question {qNum} of 4</span>
          </div>

          {/* Context Pattern Pill */}
          <div className="border-l-2 border-[#B8A8D4] bg-[#B8A8D4]/5 px-3.5 py-2 rounded-r-lg">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4A6A64] block mb-0.5">
              Reflecting on:
            </span>
            <p className="font-serif italic text-xs md:text-sm text-[#1E2A2E] truncate">
              "{currentPatternText}"
            </p>
          </div>

          {/* Question Text */}
          <div className="space-y-2 pt-2">
            <h2 className="font-serif italic text-xl md:text-2xl text-[#1E2A2E] font-normal leading-snug">
              {qMeta?.prompt || ''}
            </h2>
            {qMeta?.guidance && (
              <p className="text-xs text-[#4A6A64] font-light italic">
                {qMeta.guidance}
              </p>
            )}
          </div>

          {/* Textarea Input */}
          <div className="space-y-1.5">
            <textarea
              ref={textareaRef}
              value={currentAnswerValue}
              onChange={(e) => handleAnswerChange(qKey, e.target.value)}
              maxLength={maxChars}
              rows={5}
              placeholder="Type your reflection here..."
              className="w-full text-sm md:text-base text-[#1E2A2E] bg-white border border-[#1E2A2E]/15 rounded-xl p-4 focus:border-[#1E2A2E] focus:ring-2 focus:ring-[#1E2A2E]/5 outline-none transition-all resize-y placeholder:text-stone-400 font-light leading-relaxed"
            />
            <div className="flex justify-end min-h-[16px]">
              <span className="text-[11px] font-mono text-[#4A6A64]">
                {currentAnswerValue.length >= softThreshold ? `${currentAnswerValue.length}/${maxChars}` : ''}
              </span>
            </div>
          </div>

          {submissionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {submissionError}
            </div>
          )}

          {/* Navigation Action */}
          <div className="pt-2">
            <button
              onClick={() => handleNextQuestion(qNum)}
              disabled={!isAnswerValid || isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-[#1E2A2E] hover:bg-[#16201F] disabled:opacity-40 disabled:hover:bg-[#1E2A2E] text-white font-semibold text-sm transition-all shadow-xs cursor-pointer text-center"
            >
              {isLastQuestionOfLastPattern ? (isSubmitting ? 'Analyzing...' : 'Complete Audit') : qNum === 4 ? 'Next Pattern' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
