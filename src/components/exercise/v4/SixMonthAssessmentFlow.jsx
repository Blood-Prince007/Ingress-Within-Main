import React, { useState, useEffect, useRef } from 'react';
import SixMonthAssessmentResultView from './SixMonthAssessmentResultView';
import { getExercise9Questions } from '../../../lib/exercises/v4/definitions/sixMonthAssessmentCatalog';
import { ArrowLeft, RotateCw, CheckCircle2, ChevronRight } from 'lucide-react';

const MIN_CHARS = 20;

export default function SixMonthAssessmentFlow({ instanceId, instance, userBranch = 'A', onClose, onComplete }) {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'questions' | 'loading' | 'result'
  const [qIdx, setQIdx] = useState(0); // 0 to 6 (for Q1 to Q7)
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '' });
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef(null);

  const questions = getExercise9Questions(userBranch);

  const currentQ = questions[qIdx] || questions[0];
  const currentKey = `q${qIdx + 1}`;
  const currentText = answers[currentKey] || '';
  const trimmedLen = currentText.trim().length;
  const isValid = trimmedLen >= MIN_CHARS;

  // Focus textarea when question index changes
  useEffect(() => {
    if (phase === 'questions') {
      setInputValue(answers[currentKey] || '');
      const timer = setTimeout(() => {
        if (textareaRef.current) textareaRef.current.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [qIdx, phase]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setAnswers(prev => ({ ...prev, [currentKey]: val }));
  };

  const saveStepAutosave = async (val, index) => {
    const targetId = instanceId || instance?.id;
    if (!targetId) return;
    setIsSaving(true);
    try {
      await fetch('/api/exercises/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: targetId,
          question_id: `question_${index + 1}`,
          prompt: questions[index]?.short || `Question ${index + 1}`,
          response: val,
          current_step: index + 1
        })
      });
    } catch (err) {
      console.warn('[SixMonthAssessmentFlow] Autosave warning:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (!isValid) return;
    saveStepAutosave(currentText, qIdx);

    if (qIdx < 6) {
      setQIdx(prev => prev + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting || !isValid) return;
    setIsSubmitting(true);
    setPhase('loading');

    const targetId = instanceId || instance?.id;

    try {
      const res = await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: targetId,
          exercise_id: 'six_month_assessment',
          branch_code: userBranch,
          q1: answers.q1.trim(),
          q2: answers.q2.trim(),
          q3: answers.q3.trim(),
          q4: answers.q4.trim(),
          q5: answers.q5.trim(),
          q6: answers.q6.trim(),
          q7: answers.q7.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('[SixMonthAssessmentFlow] Submit failed:', errData);
      }
    } catch (err) {
      console.error('[SixMonthAssessmentFlow] Submission error:', err);
    } finally {
      setIsSubmitting(false);
      setPhase('result');
      if (onComplete) onComplete();
    }
  };

  if (phase === 'result') {
    return <SixMonthAssessmentResultView instanceId={instanceId || instance?.id} onClose={onClose} />;
  }

  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <RotateCw className="w-7 h-7 animate-spin text-[#4A6A64] mb-4 opacity-70" />
        <h3 className="text-xl font-serif font-medium text-[#2C3E35] mb-2">Looking at what changed</h3>
        <p className="text-sm text-[#5A6E65] max-w-md">
          Comparing your current reflections with your writing history across the past six months…
        </p>
      </div>
    );
  }

  if (phase === 'intro') {
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

          <h1 className="text-2xl sm:text-3xl font-serif text-[#2C3E35] mb-4">
            6-Month Self-Assessment
          </h1>

          <p className="text-[#4A5D54] text-base leading-relaxed mb-6 max-w-lg">
            You've had time to live with what you've been noticing. This is a chance to look at yourself again — based on what is actually true now.
          </p>

          <div className="bg-[#F0ECE1]/60 rounded-xl p-4 mb-8 text-left text-xs text-[#5A6E65] max-w-lg space-y-2 border border-[#E2DDD0]">
            <p className="font-medium text-[#2C3E35]">What to expect:</p>
            <ul className="list-disc pl-4 space-y-1 text-[#4A5D54]">
              <li>7 focused reflection questions</li>
              <li>Estimated duration: 14–18 minutes</li>
              <li>Take your time with each answer — your plain, unedited honesty is what matters</li>
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
              onClick={() => setPhase('questions')}
              className="flex-1 px-6 py-3 rounded-full bg-[#2C3E35] text-[#FAF9F6] hover:bg-[#3D5247] transition-colors text-sm font-medium shadow-sm flex items-center justify-center gap-2"
            >
              Begin <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Question Screens Flow
  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col font-sans overflow-y-auto">
      {/* Header bar */}
      <div className="w-full max-w-3xl mx-auto px-6 py-4 flex items-center justify-between border-b border-[#EBE7DF]">
        <div className="flex items-center gap-3">
          {qIdx > 0 ? (
            <button
              onClick={() => setQIdx(prev => Math.max(0, prev - 1))}
              className="p-2 text-[#5A6E65] hover:text-[#2C3E35] transition-colors rounded-full hover:bg-[#F2EFE9]"
              title="Previous question"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setPhase('intro')}
              className="p-2 text-[#5A6E65] hover:text-[#2C3E35] transition-colors rounded-full hover:bg-[#F2EFE9]"
              title="Back to intro"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <img 
            src="/logo-mark-transparent.png" 
            alt="Ingress Within" 
            className="w-5 h-5 object-contain flex-shrink-0" 
          />
          <span className="text-xs font-medium text-[#7A8E85] uppercase tracking-wider">
            6-Month Self-Assessment
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-[#4A6A64]">
            Question {qIdx + 1} of 7
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-[#7A8E85] hover:text-[#2C3E35] transition-colors"
            >
              Exit
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#EBE7DF] h-1">
        <div
          className="bg-[#4A6A64] h-1 transition-all duration-300"
          style={{ width: `${((qIdx + 1) / 7) * 100}%` }}
        />
      </div>

      {/* Question Content Container */}
      <div className="max-w-2xl w-full mx-auto my-auto p-6 sm:p-10 flex flex-col">
        {/* Question Prompt */}
        <h2 className="text-xl sm:text-2xl font-serif text-[#2C3E35] leading-snug mb-6">
          {currentQ.text}
        </h2>

        {/* Text Input Area */}
        <div className="relative mb-6">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Write your honest reflection here..."
            rows={6}
            className="w-full p-4 rounded-xl border border-[#DCD6C8] bg-white text-[#2C3E35] placeholder-[#9AA8A1] focus:outline-none focus:ring-2 focus:ring-[#4A6A64] focus:border-transparent transition-all resize-none font-sans text-base leading-relaxed shadow-sm"
          />
          <div className="flex justify-between items-center mt-2 text-xs text-[#7A8E85]">
            <span>
              {trimmedLen < MIN_CHARS ? (
                <span className="text-[#A3645A]">Take a little more time with this one (at least {MIN_CHARS} characters)</span>
              ) : (
                <span className="text-[#3D6A55] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sufficient length
                </span>
              )}
            </span>
            <span>{trimmedLen} chars</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4">
          <span className="text-xs text-[#9AA8A1]">
            {isSaving ? 'Autosaving…' : 'Progress saved'}
          </span>

          <button
            onClick={handleNext}
            disabled={!isValid || isSubmitting}
            className={`px-8 py-3 rounded-full font-medium text-sm transition-all shadow-sm flex items-center gap-2 ${
              isValid && !isSubmitting
                ? 'bg-[#2C3E35] text-[#FAF9F6] hover:bg-[#3D5247] cursor-pointer'
                : 'bg-[#E2DDD0] text-[#9AA8A1] cursor-not-allowed'
            }`}
          >
            {qIdx === 6 ? 'Submit Assessment' : 'Next Question'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
