import React, { useState } from 'react';
import { NARRATIVE_ARC_QUESTIONS } from '../../../lib/exercises/v4/definitions/month3Catalog';
import NarrativeArcResultView from './NarrativeArcResultView';
import { ArrowLeft, RotateCw } from 'lucide-react';

export default function NarrativeArcFlow({ instance, instanceId, onClose }) {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'questions' | 'loading' | 'result'
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '', q4: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQKey = `q${qIdx + 1}`;
  const currentVal = answers[currentQKey] || '';
  const isValid = currentVal.trim().length >= 3;

  const handleNext = () => {
    if (!isValid) return;
    if (qIdx < 3) {
      setQIdx(prev => prev + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting || !isValid) return;
    setIsSubmitting(true);
    setPhase('loading');

    const targetInstanceId = instance?.id || instanceId;

    try {
      await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: targetInstanceId,
          exercise_id: 'narrative_arc',
          q1: answers.q1.trim(),
          q2: answers.q2.trim(),
          q3: answers.q3.trim(),
          q4: answers.q4.trim()
        })
      });
    } catch (err) {
      console.error('[NarrativeArcFlow] Submission error:', err);
    } finally {
      setIsSubmitting(false);
      setPhase('result');
    }
  };

  if (phase === 'result') {
    return <NarrativeArcResultView instanceId={instance?.id || instanceId} onClose={onClose} />;
  }

  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <RotateCw className="w-6 h-6 animate-spin text-[#4A6A64] mb-3 opacity-70" />
        <p className="font-serif italic text-base text-[#4A6A64]">
          Reflecting on your narrative arc...
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
              Month 3 • Exercise 6D
            </span>
            <h1 className="text-3xl font-serif text-stone-900 tracking-tight">
              Narrative Arc Exercise
            </h1>
            <p className="text-base text-stone-600 leading-relaxed font-light">
              Identify stable structures beneath emotional variability across the past 3 months.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-3 text-sm text-stone-600 leading-relaxed">
            <p>
              Answer 4 questions looking back over your writing and experiences across the last 3 months.
            </p>
            <p className="text-xs text-stone-400">
              Estimated duration: 8–10 minutes
            </p>
          </div>
        </div>

        <div className="max-w-[540px] mx-auto w-full pb-8">
          <button
            onClick={() => setPhase('questions')}
            className="w-full py-4 rounded-2xl bg-[#1E2A2E] text-white text-sm font-semibold hover:bg-[#1E2A2E]/90 transition-all cursor-pointer shadow-sm"
          >
            Begin Exercise
          </button>
        </div>
      </div>
    );
  }

  const currentQ = NARRATIVE_ARC_QUESTIONS[qIdx];

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col justify-between p-6 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-[620px] mx-auto w-full pt-4 space-y-6">
        <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
          <span>Question {qIdx + 1} of 4</span>
          <button onClick={onClose} className="hover:text-stone-700">Exit</button>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-serif text-stone-900 leading-snug tracking-tight">
            {currentQ.prompt}
          </h2>

          <textarea
            value={currentVal}
            onChange={(e) => setAnswers(prev => ({ ...prev, [currentQKey]: e.target.value }))}
            placeholder={currentQ.placeholder}
            rows={6}
            className="w-full bg-white rounded-2xl p-4 border border-stone-200 text-stone-900 text-base focus:outline-none focus:border-[#4A6A64] resize-none shadow-sm font-sans"
          />
        </div>
      </div>

      <div className="max-w-[620px] mx-auto w-full pb-8">
        <button
          onClick={handleNext}
          disabled={!isValid}
          className={`w-full py-4 rounded-2xl text-sm font-semibold transition-all cursor-pointer shadow-sm ${
            isValid
              ? 'bg-[#1E2A2E] text-white hover:bg-[#1E2A2E]/90'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          {qIdx < 3 ? 'Next Question' : 'Complete Exercise'}
        </button>
      </div>
    </div>
  );
}
