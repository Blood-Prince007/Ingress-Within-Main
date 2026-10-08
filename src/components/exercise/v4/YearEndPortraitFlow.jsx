import React, { useState, useEffect, useRef } from 'react';
import YearEndPortraitResultView from './YearEndPortraitResultView';
import {
  YEAR_END_ANCHORS,
  ANCHOR_JUDGMENT_OPTIONS,
  UNIVERSAL_CLOSER_QUESTION,
  SYNTHESIS_QUESTIONS
} from '../../../lib/exercises/v4/definitions/yearEndPortraitCatalog';
import { ArrowLeft, RotateCw, CheckCircle2, ChevronRight, PauseCircle, Compass, Heart, Wind, X } from 'lucide-react';

export default function YearEndPortraitFlow({ instanceId, instance, onClose, onComplete }) {
  // Screens (0 to 17):
  // 0: Intro
  // 1-4: Anchors 1-4
  // 5: Midpoint Breathing Room
  // 6-9: Anchors 5-8
  // 10: Universal Closer
  // 11-15: Synthesis Questions 1-5
  // 16: Loading
  // 17: Result
  const [screenIndex, setScreenIndex] = useState(0);
  const [anchorsData, setAnchorsData] = useState({});
  const [closerText, setCloserText] = useState('');
  const [synthesisData, setSynthesisData] = useState({ q1: '', q2: '', q3: '', q4: '', q5: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSupportPause, setShowSupportPause] = useState(false);
  const textareaRef = useRef(null);

  // Initialize default anchor structures
  useEffect(() => {
    const initial = {};
    YEAR_END_ANCHORS.forEach(a => {
      initial[a.id] = { anchor_id: a.id, judgment: 'still_true', note: '' };
    });
    setAnchorsData(initial);
  }, []);

  // Focus textareas on screen change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (textareaRef.current) textareaRef.current.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, [screenIndex]);

  const triggerAutosave = async (questionId, promptText, val) => {
    const targetId = instanceId || instance?.id;
    if (!targetId) return;
    setIsSaving(true);
    try {
      await fetch('/api/exercises/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: targetId,
          question_id: questionId,
          prompt: promptText,
          response: typeof val === 'object' ? JSON.stringify(val) : val,
          current_step: screenIndex + 1
        })
      });
    } catch (err) {
      console.warn('[YearEndPortraitFlow] Autosave warning:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnchorJudgmentChange = (anchorId, judgment) => {
    setAnchorsData(prev => ({
      ...prev,
      [anchorId]: { ...(prev[anchorId] || { anchor_id: anchorId, note: '' }), judgment }
    }));
  };

  const handleAnchorNoteChange = (anchorId, note) => {
    setAnchorsData(prev => ({
      ...prev,
      [anchorId]: { ...(prev[anchorId] || { anchor_id: anchorId, judgment: 'still_true' }), note }
    }));
  };

  const handleSynthesisChange = (qKey, val) => {
    setSynthesisData(prev => ({ ...prev, [qKey]: val }));
  };

  const handleNext = () => {
    // Autosave current step
    if (screenIndex >= 1 && screenIndex <= 4) {
      const anchor = YEAR_END_ANCHORS[screenIndex - 1];
      triggerAutosave(anchor.id, anchor.title, anchorsData[anchor.id]);
    } else if (screenIndex >= 6 && screenIndex <= 9) {
      const anchor = YEAR_END_ANCHORS[screenIndex - 2];
      triggerAutosave(anchor.id, anchor.title, anchorsData[anchor.id]);
    } else if (screenIndex === 10) {
      triggerAutosave('universal_closer', UNIVERSAL_CLOSER_QUESTION.title, closerText);
    } else if (screenIndex >= 11 && screenIndex <= 15) {
      const synthQ = SYNTHESIS_QUESTIONS[screenIndex - 11];
      triggerAutosave(synthQ.id, synthQ.prompt, synthesisData[synthQ.id]);
    }

    if (screenIndex === 15) {
      handleFinalSubmit();
    } else {
      setScreenIndex(prev => prev + 1);
    }
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setScreenIndex(16); // Loading screen

    const targetId = instanceId || instance?.id;
    try {
      const res = await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: targetId,
          exercise_id: 'year_end_portrait',
          anchors: anchorsData,
          closer_reflection: closerText.trim(),
          synthesis: {
            q1: synthesisData.q1.trim(),
            q2: synthesisData.q2.trim(),
            q3: synthesisData.q3.trim(),
            q4: synthesisData.q4.trim(),
            q5: synthesisData.q5.trim()
          }
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('[YearEndPortraitFlow] Submit failed:', errData);
      }
    } catch (err) {
      console.error('[YearEndPortraitFlow] Submission error:', err);
    } finally {
      setIsSubmitting(false);
      setScreenIndex(17); // Result screen
      if (onComplete) onComplete();
    }
  };

  // Screen 17: Result
  if (screenIndex === 17) {
    return <YearEndPortraitResultView instanceId={instanceId || instance?.id} onClose={onClose} />;
  }

  // Screen 16: Loading
  if (screenIndex === 16) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <RotateCw className="w-8 h-8 animate-spin text-[#4A6A64] mb-4 opacity-75" />
        <h3 className="text-xl font-serif font-medium text-[#2C3E35] mb-2">
          Synthesizing your 12-Month Self-Portrait
        </h3>
        <p className="text-sm text-[#5A6E65] max-w-md">
          Connecting your 8 foundational anchors, internal shifts, and synthesis reflections into a unified annual portrait…
        </p>
      </div>
    );
  }

  // Screen 0: Intro
  if (screenIndex === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col font-sans overflow-y-auto">
        <div className="max-w-2xl w-full mx-auto my-auto p-6 sm:p-10 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-6">
            <img 
              src="/logo-mark-transparent.png" 
              alt="Ingress Within" 
              className="w-6 h-6 object-contain" 
            />
            <span className="font-serif font-semibold text-xs text-[#1E2A2E]">ingress <em className="text-[#8DBFB4] not-italic">within</em></span>
          </div>

          <span className="text-xs font-semibold text-[#7A8E85] uppercase tracking-wider mb-2">
            Month 12 · Universal Anchor · All Branches
          </span>

          <h1 className="text-3xl sm:text-4xl font-serif text-[#2C3E35] mb-4">
            Year-End Self-Portrait
          </h1>

          <p className="text-[#4A5D54] text-base leading-relaxed mb-6 max-w-lg">
            You have completed 12 months of structured self-inquiry. In this concluding milestone, you will revisit 8 foundational anchors, record how they have shifted, and synthesize who you were versus who you are becoming.
          </p>

          <div className="bg-[#F0ECE1]/60 rounded-2xl p-5 mb-8 text-left text-xs text-[#5A6E65] max-w-lg space-y-2 border border-[#E2DDD0]">
            <p className="font-semibold text-[#2C3E35] text-sm">Exercise Flow Overview:</p>
            <ul className="list-disc pl-4 space-y-1 text-[#4A5D54]">
              <li><strong>Part 1:</strong> 4 Identity & Relational Anchors</li>
              <li><strong>Midpoint:</strong> Reflective breathing pause</li>
              <li><strong>Part 2:</strong> 4 Somatic, Defense & Pattern Anchors</li>
              <li><strong>Part 3:</strong> 1 Blind-Spot Closer & 5 Synthesis Reflections</li>
              <li><strong>Estimated duration:</strong> 10–15 minutes</li>
            </ul>
          </div>

          <div className="flex gap-4 w-full max-w-xs">
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 px-5 py-3 rounded-full border border-[#D5CFBF] text-[#5A6E65] hover:bg-[#F2EFE9] transition-colors text-sm font-medium"
              >
                Close
              </button>
            )}
            <button
              onClick={() => setScreenIndex(1)}
              className="flex-1 px-6 py-3 rounded-full bg-[#2C3E35] text-[#FAF9F6] hover:bg-[#3D5247] transition-colors text-sm font-medium shadow-sm flex items-center justify-center gap-2"
            >
              Begin <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 5: Midpoint Breathing Room
  if (screenIndex === 5) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col font-sans overflow-y-auto">
        <div className="max-w-xl w-full mx-auto my-auto p-6 sm:p-10 flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#EBF0EE] flex items-center justify-center text-[#4A6A64]">
            <Wind className="w-8 h-8" />
          </div>

          <span className="text-xs font-semibold text-[#7A8E85] uppercase tracking-wider">
            Midpoint Pause · Step 6 of 18
          </span>

          <h2 className="text-2xl sm:text-3xl font-serif text-[#2C3E35]">
            Taking a Breath Across 12 Months
          </h2>

          <p className="text-[#4A5D54] text-base leading-relaxed max-w-md">
            You've revisited how you saw yourself, what mattered, and your relational dynamics. Take a brief moment to let those reflections settle before we look at your somatic signals, defense patterns, and recurring contexts.
          </p>

          <div className="pt-4 flex gap-4 w-full max-w-xs justify-center">
            <button
              onClick={() => setScreenIndex(4)}
              className="px-5 py-3 rounded-full border border-[#D5CFBF] text-[#5A6E65] hover:bg-[#F2EFE9] transition-colors text-sm font-medium flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setScreenIndex(6)}
              className="px-6 py-3 rounded-full bg-[#2C3E35] text-[#FAF9F6] hover:bg-[#3D5247] transition-colors text-sm font-medium shadow-sm flex items-center gap-2"
            >
              Continue to Part 2 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Step Navigation Header & Support Pause Modal
  const isAnchorScreen = (screenIndex >= 1 && screenIndex <= 4) || (screenIndex >= 6 && screenIndex <= 9);
  const isCloserScreen = screenIndex === 10;
  const isSynthesisScreen = screenIndex >= 11 && screenIndex <= 15;

  let currentAnchor = null;
  if (screenIndex >= 1 && screenIndex <= 4) {
    currentAnchor = YEAR_END_ANCHORS[screenIndex - 1];
  } else if (screenIndex >= 6 && screenIndex <= 9) {
    currentAnchor = YEAR_END_ANCHORS[screenIndex - 2];
  }

  const currentSynthQ = isSynthesisScreen ? SYNTHESIS_QUESTIONS[screenIndex - 11] : null;

  // Determine valid completion for Next button
  let isStepValid = true;
  if (isCloserScreen) {
    isStepValid = closerText.trim().length >= 10;
  } else if (isSynthesisScreen && currentSynthQ) {
    const currentVal = synthesisData[currentSynthQ.id] || '';
    isStepValid = currentVal.trim().length >= currentSynthQ.minChars;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col font-sans overflow-y-auto">
      {/* Support Pause Modal */}
      {showSupportPause && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-[#E2DDD0]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-[#4A6A64]">
                <Heart className="w-5 h-5" />
                <h3 className="font-serif text-lg font-semibold text-[#2C3E35]">Support Pause</h3>
              </div>
              <button onClick={() => setShowSupportPause(false)} className="p-1 text-[#7A8E85] hover:text-[#2C3E35]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[#4A5D54] leading-relaxed">
              Reflecting on a whole year of patterns and emotional habits can bring up heaviness or fatigue. Everything you have written is saved automatically.
            </p>
            <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#EAE6DD] text-xs text-[#5A6E65] space-y-1">
              <p className="font-medium text-[#2C3E35]">Grounding Suggestions:</p>
              <p>• Unclench your jaw and drop your shoulders.</p>
              <p>• Take three deep breaths, releasing slowly on the exhale.</p>
              <p>• You may close this session anytime and resume when you are ready.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowSupportPause(false); if (onClose) onClose(); }}
                className="flex-1 py-2.5 rounded-full border border-[#D5CFBF] text-[#5A6E65] text-xs font-medium hover:bg-[#FAF9F6]"
              >
                Save & Exit for Now
              </button>
              <button
                onClick={() => setShowSupportPause(false)}
                className="flex-1 py-2.5 rounded-full bg-[#2C3E35] text-white text-xs font-medium hover:bg-[#3D5247]"
              >
                Continue Reflection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="w-full max-w-3xl mx-auto px-6 py-4 flex items-center justify-between border-b border-[#EBE7DF]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreenIndex(prev => Math.max(0, prev - 1))}
            className="p-2 text-[#5A6E65] hover:text-[#2C3E35] transition-colors rounded-full hover:bg-[#F2EFE9]"
            title="Previous step"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img 
            src="/logo-mark-transparent.png" 
            alt="Ingress Within" 
            className="w-5 h-5 object-contain flex-shrink-0" 
          />
          <span className="text-xs font-medium text-[#7A8E85] uppercase tracking-wider">
            Year-End Self-Portrait
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSupportPause(true)}
            className="text-xs text-[#6A7E75] hover:text-[#2C3E35] flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#DCD6C8] hover:bg-[#F2EFE9] transition-colors"
          >
            <PauseCircle className="w-3.5 h-3.5" /> Need a pause?
          </button>
          <span className="text-xs font-semibold text-[#4A6A64]">
            Step {screenIndex + 1} of 18
          </span>
          {onClose && (
            <button onClick={onClose} className="text-xs text-[#7A8E85] hover:text-[#2C3E35] transition-colors ml-1">
              Exit
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#EBE7DF] h-1">
        <div
          className="bg-[#4A6A64] h-1 transition-all duration-300"
          style={{ width: `${((screenIndex + 1) / 18) * 100}%` }}
        />
      </div>

      {/* Content Container */}
      <div className="max-w-2xl w-full mx-auto my-auto p-6 sm:p-10 flex flex-col justify-center">
        {/* 1. ANCHOR SCREENS */}
        {isAnchorScreen && currentAnchor && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold text-[#4A6A64] uppercase tracking-wider block mb-1">
                Anchor {currentAnchor.categoryNumber} of 8 · {currentAnchor.subtitle}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-[#2C3E35]">
                {currentAnchor.title}
              </h2>
              <p className="text-sm text-[#5A6E65] mt-1">
                {currentAnchor.prompt}
              </p>
            </div>

            {/* Fact Prompt Box */}
            <div className="bg-white rounded-xl p-4 border border-[#E2DDD0] shadow-xs">
              <p className="text-xs font-medium text-[#7A8E85] uppercase tracking-wider mb-1">Reflective Lens</p>
              <p className="text-sm text-[#2C3E35] font-serif leading-relaxed">{currentAnchor.factPrompt}</p>
            </div>

            {/* 3 Judgment Options */}
            <div className="space-y-2.5">
              <label className="text-xs font-medium text-[#5A6E65] block">
                {currentAnchor.judgmentPrompt}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {ANCHOR_JUDGMENT_OPTIONS.map(opt => {
                  const isSelected = (anchorsData[currentAnchor.id]?.judgment || 'still_true') === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleAnchorJudgmentChange(currentAnchor.id, opt.value)}
                      className={`p-3.5 rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'bg-[#2C3E35] text-white border-[#2C3E35] shadow-sm'
                          : 'bg-white text-[#3D4F46] border-[#DCD6C8] hover:border-[#4A6A64] hover:bg-[#FAF9F6]'
                      }`}
                    >
                      <div className="text-sm font-semibold mb-0.5">{opt.label}</div>
                      <div className={`text-[11px] leading-tight ${isSelected ? 'text-[#C9D6CE]' : 'text-[#7A8E85]'}`}>
                        {opt.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#5A6E65] block">
                Reflection Notes (Optional)
              </label>
              <textarea
                ref={textareaRef}
                value={anchorsData[currentAnchor.id]?.note || ''}
                onChange={(e) => handleAnchorNoteChange(currentAnchor.id, e.target.value)}
                placeholder={currentAnchor.notePlaceholder}
                rows={3}
                className="w-full p-3.5 rounded-xl border border-[#DCD6C8] bg-white text-[#2C3E35] placeholder-[#9AA8A1] focus:outline-none focus:ring-2 focus:ring-[#4A6A64] text-sm resize-none"
              />
            </div>
          </div>
        )}

        {/* 2. UNIVERSAL CLOSER SCREEN */}
        {isCloserScreen && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold text-[#4A6A64] uppercase tracking-wider block mb-1">
                Milestone Closer · Blind Spot Inquiry
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-[#2C3E35] leading-snug">
                {UNIVERSAL_CLOSER_QUESTION.prompt}
              </h2>
              <p className="text-sm text-[#5A6E65] mt-1">
                {UNIVERSAL_CLOSER_QUESTION.subtext}
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                value={closerText}
                onChange={(e) => setCloserText(e.target.value)}
                placeholder={UNIVERSAL_CLOSER_QUESTION.placeholder}
                rows={6}
                className="w-full p-4 rounded-xl border border-[#DCD6C8] bg-white text-[#2C3E35] placeholder-[#9AA8A1] focus:outline-none focus:ring-2 focus:ring-[#4A6A64] text-base leading-relaxed resize-none shadow-xs"
              />
              <div className="flex justify-between items-center text-xs text-[#7A8E85]">
                <span>
                  {closerText.trim().length < 10 ? (
                    <span className="text-[#A3645A]">Write at least 10 characters</span>
                  ) : (
                    <span className="text-[#3D6A55] flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ready</span>
                  )}
                </span>
                <span>{closerText.trim().length} chars</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. SYNTHESIS QUESTIONS (1 to 5) */}
        {isSynthesisScreen && currentSynthQ && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold text-[#4A6A64] uppercase tracking-wider block mb-1">
                Synthesis Question {currentSynthQ.questionNumber} of 5
              </span>
              <h2 className="text-xl sm:text-2xl font-serif text-[#2C3E35] leading-snug">
                {currentSynthQ.prompt}
              </h2>
            </div>

            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                value={synthesisData[currentSynthQ.id] || ''}
                onChange={(e) => handleSynthesisChange(currentSynthQ.id, e.target.value)}
                placeholder={currentSynthQ.placeholder}
                rows={6}
                className="w-full p-4 rounded-xl border border-[#DCD6C8] bg-white text-[#2C3E35] placeholder-[#9AA8A1] focus:outline-none focus:ring-2 focus:ring-[#4A6A64] text-base leading-relaxed resize-none shadow-xs"
              />
              <div className="flex justify-between items-center text-xs text-[#7A8E85]">
                <span>
                  {(synthesisData[currentSynthQ.id] || '').trim().length < currentSynthQ.minChars ? (
                    <span className="text-[#A3645A]">Take a little more time (at least {currentSynthQ.minChars} characters)</span>
                  ) : (
                    <span className="text-[#3D6A55] flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Sufficient length</span>
                  )}
                </span>
                <span>{(synthesisData[currentSynthQ.id] || '').trim().length} chars</span>
              </div>
            </div>
          </div>
        )}

        {/* Step Footer Actions */}
        <div className="flex items-center justify-between pt-6">
          <span className="text-xs text-[#9AA8A1]">
            {isSaving ? 'Autosaving…' : 'Progress saved'}
          </span>

          <button
            onClick={handleNext}
            disabled={!isStepValid || isSubmitting}
            className={`px-8 py-3 rounded-full font-medium text-sm transition-all shadow-sm flex items-center gap-2 ${
              isStepValid && !isSubmitting
                ? 'bg-[#2C3E35] text-[#FAF9F6] hover:bg-[#3D5247] cursor-pointer'
                : 'bg-[#E2DDD0] text-[#9AA8A1] cursor-not-allowed'
            }`}
          >
            {screenIndex === 15 ? 'Generate Self-Portrait' : 'Next Step'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
