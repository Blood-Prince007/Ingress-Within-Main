import React, { useState, useEffect, useRef } from 'react';
import UnfinishedConversationResultView from './UnfinishedConversationResultView';
import { UNFINISHED_CONVERSATION_QUESTIONS } from '../../../lib/exercises/v4/definitions/unfinishedConversationCatalog';
import { ArrowLeft, RotateCw, CheckCircle2, ChevronRight, User, AlertCircle, HeartHandshake, Info } from 'lucide-react';

export default function UnfinishedConversationFlow({ instanceId, instance, onClose, onComplete }) {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'person_select' | 'questions' | 'loading' | 'result'
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Selected person state
  const [personName, setPersonName] = useState('');
  const [relationshipType, setRelationshipType] = useState('Relationship');
  const [unfinishedDuration, setUnfinishedDuration] = useState('');

  // 4 Core Questions state
  const [qIdx, setQIdx] = useState(0); // 0 to 3 for Q1 to Q4
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '', q4: '' });
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef(null);

  const currentQ = UNFINISHED_CONVERSATION_QUESTIONS[qIdx] || UNFINISHED_CONVERSATION_QUESTIONS[0];
  const currentKey = `q${qIdx + 1}`;
  const currentText = answers[currentKey] || '';
  const trimmedLen = currentText.trim().length;
  const isValid = trimmedLen >= 3;

  // Fetch relationship candidates when entering person_select
  useEffect(() => {
    if (phase === 'person_select' && candidates.length === 0) {
      fetchCandidates();
    }
  }, [phase]);

  const fetchCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const res = await fetch('/api/exercises/current?exercise_id=unfinished_conversation');
      if (res.ok) {
        const data = await res.json();
        if (data.candidates && data.candidates.length > 0) {
          setCandidates(data.candidates);
        }
      }
    } catch (err) {
      console.warn('[UnfinishedConversationFlow] Candidates fetch warning:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Focus textarea when question changes
  useEffect(() => {
    if (phase === 'questions') {
      setInputValue(answers[currentKey] || '');
      const timer = setTimeout(() => {
        if (textareaRef.current) textareaRef.current.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [qIdx, phase]);

  const handleSelectCandidate = (cand) => {
    setPersonName(cand.name);
    setRelationshipType(cand.label || 'Relationship');
    setAnswers(prev => ({
      ...prev,
      q1: `${cand.name} (${cand.label || 'Relationship'})`
    }));
  };

  const handleConfirmPerson = () => {
    if (!personName.trim()) return;
    // Auto-populate Q1 if empty
    if (!answers.q1) {
      const durText = unfinishedDuration ? `, unfinished for ${unfinishedDuration}` : '';
      setAnswers(prev => ({ ...prev, q1: `${personName} (${relationshipType})${durText}` }));
    }
    setPhase('questions');
    setQIdx(0);
  };

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
          prompt: UNFINISHED_CONVERSATION_QUESTIONS[index]?.short || `Question ${index + 1}`,
          response: val,
          current_step: index + 1
        })
      });
    } catch (err) {
      console.warn('[UnfinishedConversationFlow] Autosave warning:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextQuestion = () => {
    if (!isValid) return;
    saveStepAutosave(currentText, qIdx);

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

    const targetId = instanceId || instance?.id;

    try {
      const res = await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: targetId,
          exercise_id: 'unfinished_conversation',
          person_name: personName,
          relationship_type: relationshipType,
          unfinished_duration: unfinishedDuration,
          q1: answers.q1.trim(),
          q2: answers.q2.trim(),
          q3: answers.q3.trim(),
          q4: answers.q4.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('[UnfinishedConversationFlow] Submit failed:', errData);
      }
    } catch (err) {
      console.error('[UnfinishedConversationFlow] Submission error:', err);
    } finally {
      setIsSubmitting(false);
      setPhase('result');
      if (onComplete) onComplete();
    }
  };

  if (phase === 'result') {
    return <UnfinishedConversationResultView instanceId={instanceId || instance?.id} onClose={onClose} />;
  }

  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <RotateCw className="w-7 h-7 animate-spin text-[#4A6A64] mb-4 opacity-70" />
        <h3 className="text-xl font-serif font-medium text-[#2C3E35] mb-2">Noticing what silence is doing</h3>
        <p className="text-sm text-[#5A6E65] max-w-md">
          Cross-referencing your reflection with your writing history…
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
            Unfinished Conversation
          </h1>

          <p className="text-[#4A5D54] text-base leading-relaxed mb-6 max-w-lg">
            Some conversations remain unfinished even when we stop talking about them.
          </p>

          <div className="bg-[#F0ECE1]/60 rounded-xl p-4 mb-6 text-left text-xs text-[#5A6E65] max-w-lg space-y-2 border border-[#E2DDD0]">
            <p className="font-medium text-[#2C3E35]">Important Note:</p>
            <ul className="list-disc pl-4 space-y-1 text-[#4A5D54]">
              <li>This exercise is <strong>not</strong> about deciding whether you should have the conversation.</li>
              <li>This exercise does <strong>not</strong> ask you to contact or confront anyone.</li>
              <li>It is about noticing what remains unsaid, what keeping it unsaid may be protecting, and what that silence may be costing you.</li>
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
              onClick={() => setPhase('person_select')}
              className="flex-1 px-6 py-3 rounded-full bg-[#2C3E35] text-[#FAF9F6] hover:bg-[#3D5247] transition-colors text-sm font-medium shadow-sm flex items-center justify-center gap-2"
            >
              Begin <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: Candidate Selection / Person Context
  if (phase === 'person_select') {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col font-sans overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto px-6 py-4 flex items-center justify-between border-b border-[#EBE7DF]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPhase('intro')}
              className="p-2 text-[#5A6E65] hover:text-[#2C3E35] transition-colors rounded-full hover:bg-[#F2EFE9]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-medium text-[#7A8E85] uppercase tracking-wider">
              Step 1 of 2 · Context
            </span>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-xs text-[#7A8E85] hover:text-[#2C3E35]">
              Exit
            </button>
          )}
        </div>

        <div className="max-w-xl w-full mx-auto my-auto p-6 sm:p-10 flex flex-col space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif text-[#2C3E35] mb-2">
              Who is this conversation with?
            </h2>
            <p className="text-xs text-[#5A6E65]">
              Some relationships appear to carry unfinished weight. You may select one of the suggested people below or enter anyone you choose.
            </p>
          </div>

          {/* Surfaced Candidates if available */}
          {candidates.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#4A6A64] uppercase tracking-wider">
                Suggested Candidates:
              </span>
              <div className="grid grid-cols-1 gap-2">
                {candidates.map((cand, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectCandidate(cand)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      personName === cand.name
                        ? 'border-[#4A6A64] bg-[#EBF0EE]'
                        : 'border-[#E2DDD0] bg-white hover:border-[#4A6A64]'
                    }`}
                  >
                    <div>
                      <span className="font-medium text-sm text-[#2C3E35]">{cand.name}</span>
                      <span className="text-xs text-[#7A8E85] ml-2">({cand.label})</span>
                    </div>
                    {cand.energy && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#F2EFE9] text-[#7A8E85]">
                        {cand.energy}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Input Fields */}
          <div className="space-y-4 pt-2 border-t border-[#EBE7DF]">
            <div>
              <label className="block text-xs font-semibold text-[#4A5D54] mb-1">
                Person's Name or Initial:
              </label>
              <input
                type="text"
                value={personName}
                onChange={e => setPersonName(e.target.value)}
                placeholder="e.g. Maya, My brother, Alex"
                className="w-full p-3 rounded-xl border border-[#DCD6C8] bg-white text-[#2C3E35] placeholder-[#9AA8A1] focus:outline-none focus:ring-2 focus:ring-[#4A6A64] text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#4A5D54] mb-1">
                  Relationship Type:
                </label>
                <input
                  type="text"
                  value={relationshipType}
                  onChange={e => setRelationshipType(e.target.value)}
                  placeholder="e.g. Partner, Friend, Manager, Family"
                  className="w-full p-3 rounded-xl border border-[#DCD6C8] bg-white text-[#2C3E35] placeholder-[#9AA8A1] focus:outline-none focus:ring-2 focus:ring-[#4A6A64] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A5D54] mb-1">
                  Approximate Duration:
                </label>
                <input
                  type="text"
                  value={unfinishedDuration}
                  onChange={e => setUnfinishedDuration(e.target.value)}
                  placeholder="e.g. 6 months, 2 years"
                  className="w-full p-3 rounded-xl border border-[#DCD6C8] bg-white text-[#2C3E35] placeholder-[#9AA8A1] focus:outline-none focus:ring-2 focus:ring-[#4A6A64] text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleConfirmPerson}
              disabled={!personName.trim()}
              className={`px-8 py-3 rounded-full font-medium text-sm transition-all shadow-sm flex items-center gap-2 ${
                personName.trim()
                  ? 'bg-[#2C3E35] text-[#FAF9F6] hover:bg-[#3D5247] cursor-pointer'
                  : 'bg-[#E2DDD0] text-[#9AA8A1] cursor-not-allowed'
              }`}
            >
              Continue to Questions <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3 to 6: 4 Core Questions Flow
  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col font-sans overflow-y-auto">
      {/* Header bar */}
      <div className="w-full max-w-3xl mx-auto px-6 py-4 flex items-center justify-between border-b border-[#EBE7DF]">
        <div className="flex items-center gap-3">
          {qIdx > 0 ? (
            <button
              onClick={() => setQIdx(prev => Math.max(0, prev - 1))}
              className="p-2 text-[#5A6E65] hover:text-[#2C3E35] transition-colors rounded-full hover:bg-[#F2EFE9]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setPhase('person_select')}
              className="p-2 text-[#5A6E65] hover:text-[#2C3E35] transition-colors rounded-full hover:bg-[#F2EFE9]"
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
            Unfinished Conversation · {personName}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-[#4A6A64]">
            Question {qIdx + 1} of 4
          </span>
          {onClose && (
            <button onClick={onClose} className="text-xs text-[#7A8E85] hover:text-[#2C3E35]">
              Exit
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#EBE7DF] h-1">
        <div
          className="bg-[#4A6A64] h-1 transition-all duration-300"
          style={{ width: `${((qIdx + 1) / 4) * 100}%` }}
        />
      </div>

      {/* Question Container */}
      <div className="max-w-2xl w-full mx-auto my-auto p-6 sm:p-10 flex flex-col">
        {/* Question Prompt */}
        <h2 className="text-xl sm:text-2xl font-serif text-[#2C3E35] leading-snug mb-3">
          {currentQ.text}
        </h2>

        {/* Guidance Prompt if available */}
        {currentQ.guidance && (
          <div className="mb-4 p-3 rounded-xl bg-[#F0ECE1]/70 border border-[#E2DDD0] text-xs text-[#5A6E65] flex items-start gap-2">
            <Info className="w-4 h-4 text-[#4A6A64] shrink-0 mt-0.5" />
            <span>{currentQ.guidance}</span>
          </div>
        )}

        {/* Text Input Area */}
        <div className="relative mb-6">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            placeholder={
              qIdx === 1
                ? 'Speak directly to them: "You hurt me when..."'
                : 'Write your reflection here...'
            }
            rows={5}
            className="w-full p-4 rounded-xl border border-[#DCD6C8] bg-white text-[#2C3E35] placeholder-[#9AA8A1] focus:outline-none focus:ring-2 focus:ring-[#4A6A64] focus:border-transparent transition-all resize-none font-sans text-base leading-relaxed shadow-sm"
          />
          <div className="flex justify-between items-center mt-2 text-xs text-[#7A8E85]">
            <span>
              {isValid ? (
                <span className="text-[#3D6A55] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Answer recorded
                </span>
              ) : (
                <span>Please enter your reflection above</span>
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
            onClick={handleNextQuestion}
            disabled={!isValid || isSubmitting}
            className={`px-8 py-3 rounded-full font-medium text-sm transition-all shadow-sm flex items-center gap-2 ${
              isValid && !isSubmitting
                ? 'bg-[#2C3E35] text-[#FAF9F6] hover:bg-[#3D5247] cursor-pointer'
                : 'bg-[#E2DDD0] text-[#9AA8A1] cursor-not-allowed'
            }`}
          >
            {qIdx === 3 ? 'Submit Reflection' : 'Next Question'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
