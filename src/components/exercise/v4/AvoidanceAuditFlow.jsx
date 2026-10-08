import React, { useState, useRef, useEffect } from 'react';
import { AVOIDANCE_AUDIT_PROMPTS } from '../../../lib/exercises/v4/definitions/month3Catalog';
import AvoidanceAuditResultView from './AvoidanceAuditResultView';
import { ArrowLeft, RotateCw } from 'lucide-react';

export default function AvoidanceAuditFlow({ instance, instanceId, onClose }) {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'prompts' | 'loading' | 'result'
  const [promptIdx, setPromptIdx] = useState(0);
  const [completions, setCompletions] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (phase === 'prompts') {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [phase, promptIdx]);

  const currentPrompt = AVOIDANCE_AUDIT_PROMPTS[promptIdx];
  const currentCompletion = completions[currentPrompt?.id] || '';
  const isLengthValid = currentCompletion.trim().length >= 3;

  const handleTextChange = (e) => {
    setCompletions(prev => ({
      ...prev,
      [currentPrompt.id]: e.target.value
    }));
  };

  const handleNext = () => {
    if (!isLengthValid) return;
    if (promptIdx < AVOIDANCE_AUDIT_PROMPTS.length - 1) {
      setPromptIdx(prev => prev + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isLengthValid) handleNext();
    }
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setPhase('loading');

    const formattedCompletions = AVOIDANCE_AUDIT_PROMPTS.map(p => ({
      prompt: p.id,
      stem: p.stem,
      completion: (completions[p.id] || '').trim()
    }));

    const targetInstanceId = instance?.id || instanceId;

    try {
      await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: targetInstanceId,
          exercise_id: 'avoidance_audit',
          raw_completions: formattedCompletions
        })
      });
    } catch (err) {
      console.error('[AvoidanceAuditFlow] Submission error:', err);
    } finally {
      setIsSubmitting(false);
      setPhase('result');
    }
  };

  if (phase === 'result') {
    return <AvoidanceAuditResultView instanceId={instance?.id || instanceId} onClose={onClose} />;
  }

  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <RotateCw className="w-6 h-6 animate-spin text-[#4A6A64] mb-3 opacity-70" />
        <p className="font-serif italic text-base text-[#4A6A64]">
          Processing your completions...
        </p>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col justify-between p-6 md:p-12 font-sans overflow-y-auto">
        <div className="max-w-[540px] mx-auto w-full pt-8 space-y-6">
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
              className="p-2 text-stone-400 hover:text-stone-700 transition-colors rounded-full hover:bg-stone-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 pt-4">
            <span className="text-xs uppercase tracking-widest text-[#4A6A64] font-semibold">
              Month 3 • Exercise 6A
            </span>
            <h1 className="text-3xl font-serif text-stone-900 tracking-tight">
              Avoidance Audit
            </h1>
            <p className="text-base text-stone-600 leading-relaxed font-light">
              6 sentence completions covering common domains of active avoidance — what you are circling without naming.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-3 text-sm text-stone-600 leading-relaxed">
            <p>
              Each prompt starts a sentence. Type directly after the stem to complete the thought in your own words.
            </p>
            <p className="text-xs text-stone-400">
              Estimated duration: 8–12 minutes
            </p>
          </div>
        </div>

        <div className="max-w-[540px] mx-auto w-full pb-8">
          <button
            onClick={() => setPhase('prompts')}
            className="w-full py-4 rounded-2xl bg-[#1E2A2E] text-white text-sm font-semibold hover:bg-[#1E2A2E]/90 transition-all cursor-pointer shadow-sm"
          >
            Begin Exercise
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col justify-between p-6 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-[620px] mx-auto w-full pt-4">
        <div className="flex items-center justify-between text-xs text-stone-400 mb-8 font-medium">
          <span>Prompt {promptIdx + 1} of 6</span>
          <button onClick={onClose} className="hover:text-stone-700">Exit</button>
        </div>

        <div className="space-y-6">
          <div className="text-xl md:text-2xl font-serif leading-relaxed text-stone-800 tracking-tight">
            <span className="text-stone-400 select-none">{currentPrompt.stem}</span>
            <span className="text-stone-900 font-normal border-b-2 border-[#4A6A64]/30 pb-0.5 inline">
              {currentCompletion}
            </span>
          </div>

          <textarea
            ref={inputRef}
            value={currentCompletion}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type here to finish the sentence..."
            rows={4}
            className="w-full bg-white rounded-2xl p-4 border border-stone-200 text-stone-900 text-base focus:outline-none focus:border-[#4A6A64] resize-none shadow-sm font-sans"
          />
        </div>
      </div>

      <div className="max-w-[620px] mx-auto w-full pb-8">
        <button
          onClick={handleNext}
          disabled={!isLengthValid}
          className={`w-full py-4 rounded-2xl text-sm font-semibold transition-all cursor-pointer shadow-sm ${
            isLengthValid
              ? 'bg-[#1E2A2E] text-white hover:bg-[#1E2A2E]/90'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          {promptIdx < AVOIDANCE_AUDIT_PROMPTS.length - 1 ? 'Next Prompt' : 'Complete Exercise'}
        </button>
      </div>
    </div>
  );
}
