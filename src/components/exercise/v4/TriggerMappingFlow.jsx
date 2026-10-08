import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, RotateCw, Plus, Trash2, ShieldCheck, HeartHandshake, AlertCircle } from 'lucide-react';
import TriggerMappingResultView from './TriggerMappingResultView';
import { TRIGGER_MAPPING_CONFIG } from '../../../lib/exercises/v4/definitions/triggerMappingCatalog';

export default function TriggerMappingFlow({ instance, instanceId, onClose, onComplete }) {
  const targetInstanceId = instance?.id || instanceId;

  // Flow Phases: 'intro' | 'moments_entry' | 'questions' | 'synthesis' | 'loading' | 'result'
  const [phase, setPhase] = useState('intro');
  const [momentInputs, setMomentInputs] = useState(['', '', '']);
  const [minMomentsRequired, setMinMomentsRequired] = useState(3);
  const [stallPromptShown, setStallPromptShown] = useState(false);
  const [stallTimer, setStallTimer] = useState(null);

  const [momentList, setMomentList] = useState([]);
  const [session, setSession] = useState([]); // [{ q1: '', q2: '' }, ...]
  const [currentIdx, setCurrentIdx] = useState(0);
  const [synthesisAnswer, setSynthesisAnswer] = useState('');
  const [supportPauseUsed, setSupportPauseUsed] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showSupportResources, setShowSupportResources] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

  const q1Ref = useRef(null);
  const synthRef = useRef(null);

  // Auto-focus active inputs on phase/question change
  useEffect(() => {
    if (phase === 'questions') {
      const timer = setTimeout(() => {
        if (q1Ref.current) q1Ref.current.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else if (phase === 'synthesis') {
      const timer = setTimeout(() => {
        if (synthRef.current) synthRef.current.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [phase, currentIdx]);

  // Stall timer detection for 3rd moment
  const armStallTimer = () => {
    if (stallTimer) clearTimeout(stallTimer);
    if (stallPromptShown || minMomentsRequired < 3) return;

    const f1 = (momentInputs[0] || '').trim().length >= 3;
    const f2 = (momentInputs[1] || '').trim().length >= 3;
    const f3 = (momentInputs[2] || '').trim().length >= 3;

    if (f1 && f2 && !f3) {
      const timer = setTimeout(() => {
        setStallPromptShown(true);
      }, 4000);
      setStallTimer(timer);
    }
  };

  // Moment input handlers
  const handleMomentChange = (idx, value) => {
    setMomentInputs(prev => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
    armStallTimer();
  };

  const handleAddMoment = () => {
    if (momentInputs.length < 5) {
      setMomentInputs(prev => [...prev, '']);
    }
  };

  const handleRemoveMoment = (idx) => {
    if (idx >= 2 && momentInputs.length > minMomentsRequired) {
      setMomentInputs(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const filledCount = momentInputs.filter(s => s.trim().length >= 3).length;
  const isMomentsEntryValid = filledCount >= minMomentsRequired;

  const handleConfirmMoments = () => {
    const cleaned = momentInputs.map(s => s.trim()).filter(s => s.length >= 3);
    if (cleaned.length < minMomentsRequired) return;

    setMomentList(cleaned);
    setSession(cleaned.map((_, i) => session[i] || { q1: '', q2: '' }));
    setCurrentIdx(0);
    setPhase('questions');
  };

  // Question handlers
  const currentMomentText = momentList[currentIdx] || '';
  const currentAnswers = session[currentIdx] || { q1: '', q2: '' };

  const handleAnswerChange = (field, value) => {
    setSession(prev => {
      const next = [...prev];
      next[currentIdx] = {
        ...(next[currentIdx] || {}),
        [field]: value
      };
      return next;
    });
  };

  const isCurrentMomentAnswered =
    (currentAnswers.q1 || '').trim().length >= 3 && (currentAnswers.q2 || '').trim().length >= 3;

  const handleNextMoment = () => {
    if (!isCurrentMomentAnswered) return;

    if (currentIdx < momentList.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setPhase('synthesis');
    }
  };

  const handleBackMoment = () => {
    if (currentIdx === 0) {
      setPhase('moments_entry');
    } else {
      setCurrentIdx(prev => prev - 1);
    }
  };

  // Final Submission
  const handleFinalSubmit = async () => {
    if (isSubmitting || synthesisAnswer.trim().length < 3) return;
    setIsSubmitting(true);
    setSubmissionError(null);
    setPhase('loading');

    const formattedPayload = {
      instance_id: targetInstanceId,
      exercise_id: 'trigger_mapping',
      moments: momentList.map((mText, idx) => ({
        moment_text: mText,
        q1: (session[idx]?.q1 || '').trim(),
        q2: (session[idx]?.q2 || '').trim()
      })),
      synthesis_answer: synthesisAnswer.trim(),
      support_pause_used: supportPauseUsed
    };

    try {
      const res = await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedPayload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Submission failed.');
      }

      if (onComplete) {
        await onComplete();
      }
    } catch (err) {
      console.error('[TriggerMappingFlow] Submit error:', err);
      setSubmissionError(err.message || 'We could not save your responses right now.');
    } finally {
      setIsSubmitting(false);
      setPhase('result');
    }
  };

  // Support-Pause Affordance Component
  const renderSupportPauseLink = () => (
    <div className="pt-4 text-center">
      <button
        type="button"
        onClick={() => {
          setSupportPauseUsed(true);
          setShowPauseModal(true);
        }}
        className="text-xs text-[#4A6A64] opacity-70 hover:opacity-100 underline transition-opacity cursor-pointer bg-transparent border-none"
      >
        This is bringing up more than I expected
      </button>
    </div>
  );

  // 1. Result View
  if (phase === 'result') {
    return <TriggerMappingResultView instanceId={targetInstanceId} onClose={onClose} />;
  }

  // 2. Loading State
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-[#F4F6F5] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-[480px] w-full bg-white rounded-3xl p-10 border border-[#1E2A2E]/10 shadow-xs flex flex-col items-center space-y-4">
          <RotateCw className="w-8 h-8 animate-spin text-[#2E7A70] opacity-80" />
          <div className="space-y-2">
            <h2 className="font-serif text-2xl text-[#1E2A2E] font-normal leading-snug">
              Looking for connections across what you noticed...
            </h2>
            <p className="text-xs text-[#4A6A64] font-light leading-relaxed">
              Reading through your described moments and synthesis with clinical groundedness.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F6F5] flex flex-col p-6 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-[560px] mx-auto w-full flex-1 flex flex-col justify-between space-y-6 pb-12">
        {/* TOP BAR */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (phase === 'questions') handleBackMoment();
                else if (phase === 'synthesis') setPhase('questions');
                else if (phase === 'moments_entry') setPhase('intro');
                else onClose();
              }}
              className="p-2 text-[#4A6A64] hover:text-[#1E2A2E] transition-colors rounded-full hover:bg-black/5 cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img 
              src="/logo-mark-transparent.png" 
              alt="Ingress Within" 
              className="w-5 h-5 object-contain" 
            />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8DBFB4]">
            Trigger Mapping
          </span>
          <button
            onClick={onClose}
            className="text-xs text-[#4A6A64] hover:text-[#1E2A2E] font-medium transition-colors cursor-pointer bg-transparent border-none"
          >
            Exit
          </button>
        </div>

        {/* --- PHASE 1: INTRO --- */}
        {phase === 'intro' && (
          <div className="space-y-8 my-auto">
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8DBFB4] block">
                Standalone Exercise
              </span>
              <h1 className="font-serif text-3xl md:text-4xl text-[#1E2A2E] font-normal leading-tight">
                Trigger Mapping
              </h1>
              <p className="text-sm md:text-base text-[#4A6A64] leading-relaxed font-light">
                A trigger is a specific moment that produced a bigger reaction than the moment itself seemed to call for. This exercise looks at what actually happens in those moments — your first reaction, and what you were trying to avoid.
              </p>
            </div>

            <div className="bg-white border border-[#1E2A2E]/10 rounded-2xl p-6 md:p-7 shadow-xs space-y-3">
              <p className="text-xs md:text-sm text-[#1E2A2E] leading-relaxed font-normal">
                This works best if you already have a few moments in mind — you’ll name 3 to start, then answer two short questions about each.
              </p>
              <div className="flex items-center gap-2 pt-2 text-xs text-[#4A6A64] border-t border-[#1E2A2E]/5">
                <span className="w-2 h-2 rounded-full bg-[#8DBFB4]" />
                <span>Estimated duration: 8–10 minutes</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setPhase('moments_entry')}
                className="w-full py-4 rounded-xl bg-[#1E2A2E] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#16201F] transition-all cursor-pointer shadow-xs"
              >
                Begin Mapping
              </button>
            </div>
          </div>
        )}

        {/* --- PHASE 2: MOMENTS ENTRY --- */}
        {phase === 'moments_entry' && (
          <div className="space-y-6 my-auto">
            <div className="space-y-2">
              <h2 className="font-serif text-2xl md:text-3xl text-[#1E2A2E] font-normal">
                Name your moments
              </h2>
              <p className="text-xs md:text-sm text-[#4A6A64] leading-relaxed font-light">
                Describe 3 specific moments when something triggered a bigger reaction than it seemed to call for — a sentence or two each, enough that you’d recognize the moment. You can add up to 2 more if you have them.
              </p>
            </div>

            {/* Moment Fields */}
            <div className="space-y-4">
              {momentInputs.map((val, idx) => {
                const isMandatory = idx < minMomentsRequired;
                return (
                  <div key={idx} className="bg-white border border-[#1E2A2E]/10 rounded-2xl p-5 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#2E7A70]">
                        Moment {idx + 1} {isMandatory ? '' : '(Optional)'}
                      </label>
                      {!isMandatory && momentInputs.length > minMomentsRequired && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMoment(idx)}
                          className="text-xs text-[#E0A898] hover:text-red-700 underline transition-colors cursor-pointer bg-transparent border-none"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      value={val}
                      onChange={(e) => handleMomentChange(idx, e.target.value)}
                      onBlur={armStallTimer}
                      placeholder="e.g. My manager asked a routine question in a meeting and I felt suddenly defensive, like I was being tested."
                      rows={2}
                      className="w-full text-sm text-[#1E2A2E] placeholder-[#4A6A64]/40 bg-transparent border-none outline-none resize-none font-sans leading-relaxed"
                    />
                  </div>
                );
              })}
            </div>

            {/* Stall Affordance */}
            {stallPromptShown && minMomentsRequired === 3 && (
              <div className="p-4 bg-[#8DBFB4]/15 border border-[#8DBFB4]/30 rounded-xl text-xs text-[#1E2A2E] flex items-center justify-between animate-fadeIn">
                <span>Can’t think of a third right now?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMinMomentsRequired(2);
                    setStallPromptShown(false);
                  }}
                  className="font-semibold text-[#2E7A70] underline hover:text-[#1E2A2E] cursor-pointer bg-transparent border-none ml-2"
                >
                  Two is enough to continue →
                </button>
              </div>
            )}

            {/* Add More Moments Link */}
            {momentInputs.length < 5 && (
              <div>
                <button
                  type="button"
                  onClick={handleAddMoment}
                  className="inline-flex items-center gap-1.5 text-xs text-[#4A6A64] hover:text-[#1E2A2E] font-semibold transition-colors cursor-pointer bg-transparent border-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add another moment
                </button>
              </div>
            )}

            <div className="pt-2 space-y-3">
              <button
                onClick={handleConfirmMoments}
                disabled={!isMomentsEntryValid}
                className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs ${
                  isMomentsEntryValid
                    ? 'bg-[#1E2A2E] text-white hover:bg-[#16201F] cursor-pointer'
                    : 'bg-[#1E2A2E]/15 text-[#4A6A64]/50 cursor-not-allowed'
                }`}
              >
                Continue to questions ({filledCount}/{minMomentsRequired} ready)
              </button>
              {renderSupportPauseLink()}
            </div>
          </div>
        )}

        {/* --- PHASE 3: QUESTIONS --- */}
        {phase === 'questions' && (
          <div className="space-y-6 my-auto">
            {/* Moment Header Banner */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#8DBFB4] uppercase tracking-wider">
                <span>Moment {currentIdx + 1} of {momentList.length}</span>
              </div>
              <div className="p-4 bg-white border border-[#1E2A2E]/10 rounded-2xl shadow-xs">
                <p className="text-xs text-[#4A6A64] uppercase font-bold tracking-wider mb-1">Moment</p>
                <p className="font-serif italic text-sm md:text-base text-[#1E2A2E] leading-relaxed">
                  "{currentMomentText}"
                </p>
              </div>
            </div>

            {/* Question 1 */}
            <div className="bg-white border border-[#1E2A2E]/10 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#7B3B59]">
                  Q1 • First Reaction
                </label>
                <span className="text-[10px] text-[#4A6A64]/50 font-mono">
                  {(currentAnswers.q1 || '').length}/500
                </span>
              </div>
              <h3 className="font-serif text-lg text-[#1E2A2E] font-normal leading-snug">
                What was your first reaction — in your body or your thinking?
              </h3>
              <textarea
                ref={q1Ref}
                value={currentAnswers.q1}
                onChange={(e) => handleAnswerChange('q1', e.target.value.slice(0, 500))}
                placeholder="e.g. A sharp tightening in my chest and an immediate urge to over-explain..."
                rows={3}
                className="w-full text-sm text-[#1E2A2E] placeholder-[#4A6A64]/40 bg-[#F4F6F5]/40 rounded-xl p-3.5 border border-[#1E2A2E]/10 focus:border-[#2E7A70] outline-none resize-none font-sans leading-relaxed"
              />
            </div>

            {/* Question 2 */}
            <div className="bg-white border border-[#1E2A2E]/10 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#7B3B59]">
                  Q2 • Avoidance Goal
                </label>
                <span className="text-[10px] text-[#4A6A64]/50 font-mono">
                  {(currentAnswers.q2 || '').length}/500
                </span>
              </div>
              <h3 className="font-serif text-lg text-[#1E2A2E] font-normal leading-snug">
                What did you most want to avoid in that moment?
              </h3>
              <textarea
                value={currentAnswers.q2}
                onChange={(e) => handleAnswerChange('q2', e.target.value.slice(0, 500))}
                placeholder="e.g. Looking incompetent or unprepared in front of my team..."
                rows={3}
                className="w-full text-sm text-[#1E2A2E] placeholder-[#4A6A64]/40 bg-[#F4F6F5]/40 rounded-xl p-3.5 border border-[#1E2A2E]/10 focus:border-[#2E7A70] outline-none resize-none font-sans leading-relaxed"
              />
            </div>

            <div className="pt-2 space-y-3">
              <button
                onClick={handleNextMoment}
                disabled={!isCurrentMomentAnswered}
                className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs ${
                  isCurrentMomentAnswered
                    ? 'bg-[#1E2A2E] text-white hover:bg-[#16201F] cursor-pointer'
                    : 'bg-[#1E2A2E]/15 text-[#4A6A64]/50 cursor-not-allowed'
                }`}
              >
                {currentIdx < momentList.length - 1 ? 'Next Moment →' : 'Continue to synthesis →'}
              </button>
              {renderSupportPauseLink()}
            </div>
          </div>
        )}

        {/* --- PHASE 4: SYNTHESIS --- */}
        {phase === 'synthesis' && (
          <div className="space-y-6 my-auto">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8DBFB4] block">
                Cross-Moment Synthesis
              </span>
              <h2 className="font-serif text-2xl md:text-3xl text-[#1E2A2E] font-normal leading-tight">
                Looking at these {momentList.length} moments together
              </h2>
              <p className="text-xs md:text-sm text-[#4A6A64] leading-relaxed font-light">
                Is there a pattern in how you responded across these different situations?
              </p>
            </div>

            <div className="bg-white border border-[#1E2A2E]/10 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#2E7A70]">
                  Your Synthesis Reflection
                </label>
                <span className="text-[10px] text-[#4A6A64]/50 font-mono">
                  {synthesisAnswer.length}/500
                </span>
              </div>
              <textarea
                ref={synthRef}
                value={synthesisAnswer}
                onChange={(e) => setSynthesisAnswer(e.target.value.slice(0, 500))}
                placeholder="Write what you notice about your common reactions or what you were guarding against..."
                rows={6}
                className="w-full text-sm md:text-base text-[#1E2A2E] placeholder-[#4A6A64]/40 bg-[#F4F6F5]/40 rounded-xl p-4 border border-[#1E2A2E]/10 focus:border-[#2E7A70] outline-none resize-none font-sans leading-relaxed"
              />
            </div>

            {submissionError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{submissionError}</span>
              </div>
            )}

            <div className="pt-2 space-y-3">
              <button
                onClick={handleFinalSubmit}
                disabled={synthesisAnswer.trim().length < 3 || isSubmitting}
                className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs ${
                  synthesisAnswer.trim().length >= 3 && !isSubmitting
                    ? 'bg-[#1E2A2E] text-white hover:bg-[#16201F] cursor-pointer'
                    : 'bg-[#1E2A2E]/15 text-[#4A6A64]/50 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Analyzing Responses...' : 'Complete Trigger Mapping'}
              </button>
              {renderSupportPauseLink()}
            </div>
          </div>
        )}
      </div>

      {/* --- SUPPORT PAUSE OVERLAY MODAL --- */}
      {showPauseModal && (
        <div className="fixed inset-0 z-[100] bg-[#1E2A2E]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-[480px] rounded-3xl p-6 md:p-8 border border-[#1E2A2E]/10 shadow-2xl space-y-5">
            {!showSupportResources ? (
              <>
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl text-[#1E2A2E] font-normal">
                    Take a moment
                  </h3>
                  <p className="text-xs text-[#4A6A64] leading-relaxed font-light">
                    Re-reading difficult moments can bring up unexpected intensity. You are in control of this pace.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={() => {
                      setShowPauseModal(false);
                      onClose();
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-white border border-[#1E2A2E]/15 text-left text-xs font-semibold text-[#1E2A2E] hover:bg-[#F4F6F5] transition-colors cursor-pointer"
                  >
                    Take a break — your responses are saved
                  </button>

                  <button
                    onClick={() => setShowPauseModal(false)}
                    className="w-full py-3.5 px-4 rounded-xl bg-white border border-[#1E2A2E]/15 text-left text-xs font-semibold text-[#1E2A2E] hover:bg-[#F4F6F5] transition-colors cursor-pointer"
                  >
                    Keep going, one moment at a time
                  </button>

                  <button
                    onClick={() => setShowSupportResources(true)}
                    className="w-full py-3.5 px-4 rounded-xl bg-white border border-[#1E2A2E]/15 text-left text-xs font-semibold text-[#2E7A70] hover:bg-[#F4F6F5] transition-colors cursor-pointer"
                  >
                    See support resources →
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl text-[#1E2A2E] font-normal">
                    Support resources
                  </h3>
                  <p className="text-xs text-[#4A6A64] leading-relaxed font-light">
                    In the US, call or text 988 to speak with someone anytime. Outside the US, please look up your local mental health helpline or emergency service.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setShowSupportResources(false)}
                    className="w-full py-3.5 rounded-xl bg-[#1E2A2E] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#16201F] transition-colors cursor-pointer"
                  >
                    ← Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
