import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, ShieldCheck, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { StepRenderer } from './StepRenderer';

export function InterventionPlayer({ interventionId, sessionId: initialSessionId, onBack, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [intervention, setIntervention] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(null);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const timerRef = useRef(null);

  // 1. Initial Load & Session Start/Resume
  useEffect(() => {
    async function initSession() {
      setLoading(true);
      try {
        let endpoint = '/api/interventions/session/start';
        let body = { intervention_id: interventionId };

        if (initialSessionId) {
          endpoint = `/api/interventions/session/${initialSessionId}`;
        }

        const res = await fetch(endpoint, {
          method: initialSessionId ? 'GET' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: initialSessionId ? undefined : JSON.stringify(body),
        });

        const json = await res.json();
        if (json.success && json.data) {
          const data = json.data;
          setSession(data.session);
          setSteps(data.steps || []);
          setProgress(data.progress);
          setElapsedSeconds(data.session?.elapsed_seconds || 0);

          const stepIdx = Math.max(0, (data.progress?.current_step || 1) - 1);
          setCurrentStepIndex(stepIdx);

          // Populate stored answers
          const savedAnswersMap = {};
          if (data.responses) {
            data.responses.forEach((r) => {
              savedAnswersMap[r.question_id] = r.answer;
            });
          }
          setAnswers(savedAnswersMap);

          // Load Intervention meta
          if (data.intervention_id || interventionId) {
            const itemRes = await fetch(`/api/interventions/${data.intervention_id || interventionId}`);
            const itemJson = await itemRes.json();
            if (itemJson.success) {
              setIntervention(itemJson.data.intervention);
            }
          }
        }
      } catch (err) {
        console.error('Error initializing intervention player:', err);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, [interventionId, initialSessionId]);

  // 2. Timer Ticker for practice duration
  useEffect(() => {
    if (isCompleted || loading) return;

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCompleted, loading]);

  // 3. Save Answer Handler (Autosave - Stored Only)
  const handleSaveAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // 4. Next Step Navigation (Optimistic & Super Fast)
  const handleNext = async () => {
    if (!steps || steps.length === 0) return;

    const currentStep = steps[currentStepIndex];
    const questionId = currentStep?.optional_question?.id;
    const answerVal = questionId ? answers[questionId] : undefined;
    const isLast = currentStepIndex >= steps.length - 1;
    const activeSessionId = session?.id || initialSessionId;

    if (isLast) {
      // INSTANT COMPLETION DISPLAY
      setIsCompleted(true);

      // Async background server sync to record history & complete session
      if (activeSessionId) {
        const payload = {
          session_id: activeSessionId,
          elapsed_seconds: elapsedSeconds,
          responses: Object.entries(answers).map(([qId, ans]) => ({ question_id: qId, answer: ans })),
        };
        fetch('/api/interventions/session/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {
          fetch('/api/interventions/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).catch(() => {});
        });
      }
    } else {
      // INSTANT STEP TRANSITION (0ms UI latency)
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);

      // Background async sync to server
      if (activeSessionId) {
        fetch('/api/interventions/session/step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: activeSessionId,
            direction: 'next',
            question_id: questionId,
            answer: answerVal,
            elapsed_seconds: elapsedSeconds,
          }),
        }).catch((err) => console.warn('Background step sync failed:', err));
      }
    }
  };

  // 5. Previous Step Navigation (Optimistic & Super Fast)
  const handlePrevious = () => {
    if (currentStepIndex <= 0) return;

    // INSTANT STEP TRANSITION (0ms UI latency)
    const prevIndex = currentStepIndex - 1;
    setCurrentStepIndex(prevIndex);

    const activeSessionId = session?.id || initialSessionId;
    if (activeSessionId) {
      fetch('/api/interventions/session/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          direction: 'previous',
          elapsed_seconds: elapsedSeconds,
        }),
      }).catch((err) => console.warn('Background step sync failed:', err));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mint-grey flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md w-full">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-primary font-serif italic text-base">Loading practice player...</p>
        </div>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  const isFinalStep = currentStepIndex >= steps.length - 1;
  const allowPrevious = currentStepIndex > 0 && (currentStep?.allow_previous !== false);
  const completionPercentage = progress?.completion_percentage || Math.round(((currentStepIndex + 1) / Math.max(1, steps.length)) * 100);

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans flex flex-col justify-between">
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-accent/15 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-[1000px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-medium text-supporting hover:text-primary transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Exit Player</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-primary/10">
              <img 
                src="/logo-mark-transparent.png" 
                alt="Ingress Within" 
                className="w-5 h-5 object-contain" 
              />
              <span className="font-serif text-xs text-primary font-medium">
                ingress <em className="text-accent not-italic font-semibold">within</em>
              </span>
            </div>
          </div>

          <div className="text-center flex-1 mx-2">
            <h1 className="text-base sm:text-lg font-serif font-medium text-primary line-clamp-1">
              {intervention?.title || 'Practice Session'}
            </h1>
            <div className="flex items-center justify-center gap-3 text-xs text-supporting mt-0.5">
              <span className="uppercase tracking-wider font-semibold text-accent text-[10px]">
                {intervention?.category_meta?.name || intervention?.category || 'Intervention'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {Math.ceil(elapsedSeconds / 60)}m elapsed
              </span>
            </div>
          </div>

          <div className="text-right text-xs text-supporting font-mono font-medium">
            Step <span className="text-primary font-bold">{currentStepIndex + 1}</span> of {steps.length || 1}
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="max-w-[1000px] mx-auto mt-3">
          <div className="w-full h-1.5 bg-mint-grey rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500 ease-out"
              style={{ width: `${isCompleted ? 100 : completionPercentage}%` }}
            />
          </div>
        </div>
      </header>

      {/* MAIN STEP CONTENT AREA */}
      <main className="flex-1 max-w-[900px] mx-auto w-full px-6 py-6 flex flex-col justify-center">
        {isCompleted ? (
          <StepRenderer
            step={{ step_type: 'completion' }}
            intervention={intervention}
            session={{
              ...session,
              elapsed_seconds: elapsedSeconds,
              completed_at: session?.completed_at || new Date().toISOString(),
              responses: Object.entries(answers)
                .filter(([_, ans]) => ans && String(ans).trim().length > 0)
                .map(([qId, ans]) => {
                  const matchingStep = steps.find(
                    (s) => s.optional_question?.id === qId || s.step_id === qId || `q_${s.step_number}` === qId
                  );
                  return {
                    question_id: qId,
                    question_prompt: matchingStep?.content || matchingStep?.title || qId,
                    answer: ans,
                  };
                }),
            }}
            progress={progress}
            onReturnToDashboard={onComplete || onBack}
          />
        ) : (
          <StepRenderer
            step={currentStep}
            intervention={intervention}
            session={session}
            progress={progress}
            initialAnswer={
              answers[currentStep?.optional_question?.id] ||
              answers[currentStep?.step_id] ||
              answers[`q_${currentStep?.step_number}`] ||
              answers[`q_${intervention?.id}_step_${currentStep?.step_number}`] ||
              ''
            }
            onSaveAnswer={handleSaveAnswer}
            onNext={handleNext}
            isSubmitting={isSubmitting}
            onReturnToDashboard={onComplete || onBack}
          />
        )}
      </main>

      {/* FOOTER CONTROLS */}
      {!isCompleted && (
        <footer className="bg-white/80 backdrop-blur-md border-t border-accent/15 px-6 py-4 sticky bottom-0 z-30">
          <div className="max-w-[900px] mx-auto flex items-center justify-between gap-4">
            <div>
              {allowPrevious && (
                <button
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-mint-grey hover:bg-accent/15 text-primary text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-accent/20"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
              >
                <span>{isFinalStep ? 'Complete Session' : 'Next Step'}</span>
                {isFinalStep ? <CheckCircle size={15} /> : <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
