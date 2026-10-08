import React, { useState, useEffect, useRef } from 'react';
import RecurringScenarioResultView from './RecurringScenarioResultView';
import { RECURRING_SCENARIO_PROMPTS, RECURRING_SCENARIO_CONFIG } from '../../../lib/exercises/v4/definitions/recurringScenarioCatalog';
import { ArrowLeft, RotateCw, CheckCircle2, ChevronRight, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

export default function RecurringScenarioFlow({ instanceId, instance, onClose, onComplete }) {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'prompts' | 'transition' | 'loading' | 'result'
  const [pIdx, setPIdx] = useState(0); // 0 to 3 for Prompts 1 to 4
  const [answers, setAnswers] = useState({
    prompt_rehearse: '',
    prompt_replay: '',
    prompt_inevitable: '',
    prompt_avoid: ''
  });
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const textareaRef = useRef(null);

  const currentPrompt = RECURRING_SCENARIO_PROMPTS[pIdx] || RECURRING_SCENARIO_PROMPTS[0];
  const currentKey = currentPrompt.key;
  const currentText = answers[currentKey] || '';
  const trimmedLen = currentText.trim().length;
  const isValid = trimmedLen >= RECURRING_SCENARIO_CONFIG.minCharsPerPrompt;

  // Sync textarea value when prompt step changes
  useEffect(() => {
    if (phase === 'prompts') {
      setInputValue(answers[currentKey] || '');
      const timer = setTimeout(() => {
        if (textareaRef.current) textareaRef.current.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [pIdx, phase]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setAnswers(prev => ({ ...prev, [currentKey]: val }));
  };

  const saveAutosave = async (key, value) => {
    const targetId = instanceId || instance?.id;
    if (!targetId) return;
    setIsSaving(true);
    try {
      await fetch('/api/exercises/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: targetId,
          question_id: key,
          response: value
        })
      });
    } catch (err) {
      console.warn('[RecurringScenarioFlow] Autosave warning:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextPrompt = () => {
    if (!isValid) return;
    saveAutosave(currentKey, currentText.trim());

    if (pIdx < RECURRING_SCENARIO_PROMPTS.length - 1) {
      setPIdx(prev => prev + 1);
    } else {
      setPhase('transition');
    }
  };

  const handlePrevPrompt = () => {
    if (pIdx > 0) {
      setPIdx(prev => prev - 1);
    } else {
      setPhase('intro');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setPhase('loading');
    setErrorMessage(null);

    const targetId = instanceId || instance?.id;
    const payload = {
      instance_id: targetId,
      exercise_id: 'recurring_scenario',
      answers
    };

    try {
      const res = await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to analyze recurring scenario responses.');
      }

      const resData = await res.json();
      const finalResult = resData.result?.data || resData.data || resData.result || resData;

      setResultData(finalResult);
      setPhase('result');
      if (onComplete) onComplete(finalResult);
    } catch (err) {
      console.error('[RecurringScenarioFlow] Submit error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during analysis.');
      setPhase('transition');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phase Renderers
  if (phase === 'result' && resultData) {
    return (
      <RecurringScenarioResultView
        result={resultData}
        onClose={onClose}
      />
    );
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center bg-stone-900 text-stone-100 rounded-xl">
        <RefreshCw className="w-12 h-12 text-amber-400 animate-spin mb-4" />
        <h3 className="text-xl font-medium text-amber-100 mb-2">Analyzing Anticipatory Cognition Patterns...</h3>
        <p className="text-sm text-stone-400 max-w-md">
          Examining how rehearsal, replay, assumed inevitability, and guarded avoidance connect with your journal reflections.
        </p>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-stone-900 text-stone-100 rounded-xl shadow-2xl border border-stone-800">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-mark-light.png" 
              alt="Ingress Within" 
              className="w-8 h-8 object-contain flex-shrink-0" 
            />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Month 10 • Day 304</span>
              <h2 className="text-2xl font-serif font-bold text-stone-100 mt-1">Recurring Scenario Exercise</h2>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-stone-400 hover:text-stone-200 text-sm px-3 py-1 rounded bg-stone-800 hover:bg-stone-700">
              Close
            </button>
          )}
        </div>

        <p className="text-stone-300 mb-6 leading-relaxed">
          {RECURRING_SCENARIO_CONFIG.description}
        </p>

        <div className="bg-stone-800/60 p-4 rounded-lg border border-stone-700/50 mb-6 space-y-3">
          <h4 className="text-sm font-semibold text-amber-300">What you will explore:</h4>
          <ul className="text-sm text-stone-300 space-y-2 list-disc list-inside">
            <li><strong>Rehearsed Before:</strong> Scenarios run through in advance.</li>
            <li><strong>Replayed After:</strong> Past events re-examined repeatedly.</li>
            <li><strong>Assumed Inevitable:</strong> Outcomes taken for granted in specific situations.</li>
            <li><strong>Avoided Imagining:</strong> Possibilities quietly skipped over.</li>
          </ul>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
          <button
            onClick={() => setPhase('prompts')}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            Begin Exercise <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'prompts') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-stone-900 text-stone-100 rounded-xl shadow-2xl border border-stone-800">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={handlePrevPrompt} className="text-stone-400 hover:text-stone-200 p-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img 
              src="/logo-mark-light.png" 
              alt="Ingress Within" 
              className="w-5 h-5 object-contain flex-shrink-0" 
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Prompt {pIdx + 1} of 4 • {currentPrompt.label}
            </span>
          </div>
          {isSaving && <span className="text-xs text-stone-500 italic">Autosaving...</span>}
        </div>

        <div className="mb-6">
          <label className="block text-lg font-serif font-medium text-stone-100 mb-2">
            {currentPrompt.stem}
          </label>
          <p className="text-xs text-stone-400 mb-4">{currentPrompt.guidance}</p>

          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            placeholder={currentPrompt.placeholder}
            rows={5}
            className="w-full bg-stone-800 border border-stone-700 rounded-lg p-4 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-base leading-relaxed"
          />

          <div className="flex justify-between items-center mt-2 text-xs text-stone-500">
            <span>Minimum 3 characters required</span>
            <span className={trimmedLen >= 3 ? 'text-amber-400 font-medium' : 'text-stone-500'}>
              {trimmedLen} chars
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-stone-800">
          <button
            onClick={handlePrevPrompt}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-sm transition-colors"
          >
            Previous
          </button>

          <button
            onClick={handleNextPrompt}
            disabled={!isValid}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              isValid
                ? 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                : 'bg-stone-800 text-stone-600 cursor-not-allowed'
            }`}
          >
            {pIdx === RECURRING_SCENARIO_PROMPTS.length - 1 ? 'Review & Continue' : 'Next Prompt'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'transition') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-stone-900 text-stone-100 rounded-xl shadow-2xl border border-stone-800">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Step Complete</span>
          <button onClick={() => setPhase('prompts')} className="text-stone-400 hover:text-stone-200 text-sm">
            Edit Prompts
          </button>
        </div>

        <div className="bg-stone-800/80 p-6 rounded-xl border border-stone-700/60 mb-6 text-center space-y-4">
          <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
          <p className="text-lg font-serif text-stone-200 leading-relaxed italic">
            "You’ve mapped four different ways a scenario can stay active: before something happens, after it happens, through expectation, and through avoidance."
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-800/60 rounded-lg text-red-200 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-stone-800">
          <button
            onClick={() => setPhase('prompts')}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-sm transition-colors"
          >
            Back to Prompts
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            See what stands out <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
