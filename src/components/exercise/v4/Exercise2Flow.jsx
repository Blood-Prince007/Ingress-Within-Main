import React, { useState, useEffect, useRef } from 'react';
import { InkblotImagePreloader } from '../../../lib/exercises/v4/imageGen/inkblotImagePreloader';
import { INKBLOT_IMAGE_ROLES, InkblotImageGenerator } from '../../../lib/exercises/v4/imageGen/inkblotImageGenerator';
import Exercise2ResultView from './Exercise2ResultView';

export default function Exercise2Flow({ instance, initialResponses = [], onClose, onComplete }) {
  const [screen, setScreen] = useState('preparing'); // 'preparing' | 'intro' | 'step' | 'transition' | 'loading' | 'reflection' | 'failed'
  const [imageUrls, setImageUrls] = useState([]);
  const [imageIdx, setImageIdx] = useState(0); // 0 to 4
  const [step, setStep] = useState(1); // 1 to 3
  const [responses, setResponses] = useState([]); // [{ image_id, step, question, response }]
  const [inputValue, setInputValue] = useState('');
  const [showNudge, setShowNudge] = useState(false);
  const [showBreath, setShowBreath] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imgRetryState, setImgRetryState] = useState({});
  const inputRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // 1. Data Loading Gate: Parse stored image URLs from instance or result analysis
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!instance) return;

      const resultData = instance.data || instance.analysis || instance.raw_json || {};
      let urls = resultData.generated_image_urls || [];

      // If URLs missing in prop, fetch from result API
      if (!urls || urls.length !== 5) {
        try {
          const res = await fetch(`/api/exercises/result?instance_id=${instance.id}`);
          if (res.ok) {
            const data = await res.json();
            const analysis = data.result?.analysis || data.result?.raw_json || {};
            urls = analysis.generated_image_urls || [];
          }
        } catch (err) {
          console.error('[Exercise2Flow] Failed to fetch image URLs from API:', err);
        }
      }

      // Fallback if missing 5 URLs
      if (!urls || urls.length !== 5) {
        const fallbackGen = InkblotImageGenerator.generateInkblotImageUrls(instance.user_id || 'user', 1);
        urls = fallbackGen.urls;
      }

      if (!isMounted) return;
      setImageUrls(urls);

      // Preload images into browser memory before revealing UI
      await InkblotImagePreloader.preloadAll(urls);

      // Process initial responses if present
      let formattedResponses = [];
      if (initialResponses && initialResponses.length > 0) {
        formattedResponses = initialResponses.map(r => {
          const qId = r.question_id || '';
          const parts = qId.split('_'); // card_1_step_1
          const imgId = parts[1] ? parseInt(parts[1], 10) : 1;
          const stepId = parts[3] ? parseInt(parts[3], 10) : 1;
          return {
            image_id: imgId,
            step: stepId,
            question: r.prompt || 'free_response',
            response: r.response || ''
          };
        }).filter(r => r.response && r.response.trim() !== '');

        setResponses(formattedResponses);

        // Resume at current stored instance image & step if available
        if (instance.current_image && instance.current_step) {
          const targetImg = Math.max(0, Math.min(4, instance.current_image - 1));
          const targetStep = Math.max(1, Math.min(3, instance.current_step));
          setImageIdx(targetImg);
          setStep(targetStep);
        } else if (formattedResponses.length > 0) {
          const lastResp = formattedResponses[formattedResponses.length - 1];
          let nextImg = lastResp.image_id - 1;
          let nextStep = lastResp.step + 1;
          if (nextStep > 3) {
            nextImg += 1;
            nextStep = 1;
          }
          if (nextImg < 5) {
            setImageIdx(nextImg);
            setStep(nextStep);
          } else {
            setScreen('loading');
            startPollingStatus();
            return;
          }
        }
      }

      if (isMounted) {
        setScreen('intro');
      }
    }

    loadData();

    return () => {
      isMounted = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [instance, initialResponses]);

  const currentRole = INKBLOT_IMAGE_ROLES[imageIdx] || INKBLOT_IMAGE_ROLES[0];
  const progressPct = Math.round(((imageIdx * 3 + step - 1) / 15) * 100);

  // 2. Saved Response Binding: Whenever imageIdx or step changes, bind input to stored response
  useEffect(() => {
    if (screen === 'step') {
      const existing = responses.find(r => r.image_id === currentRole.id && r.step === step);
      setInputValue(existing?.response || '');
      setShowNudge(false);

      const timer = setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [screen, imageIdx, step, responses]);

  // 3. Status Polling during 'loading' screen
  const startPollingStatus = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    let attempts = 0;

    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/exercises/status?instance_id=${instance.id}`);
        if (res.ok) {
          const data = await res.json();
          const currentStatus = data.status;

          if (currentStatus === 'completed') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setScreen('reflection');
          } else if (currentStatus === 'failed' || attempts > 12) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setScreen('failed');
          }
        }
      } catch (err) {
        console.error('[Exercise2Flow] Status poll error:', err);
      }
    }, 2000);
  };

  // 4. Image Load Error Handling & Fallback Retry
  const handleImageError = () => {
    const retries = imgRetryState[imageIdx] || 0;
    console.warn(`[Exercise2Flow] Image load error on Card ${imageIdx + 1}, attempt ${retries + 1}`);

    if (retries === 0) {
      setImgRetryState(prev => ({ ...prev, [imageIdx]: 1 }));
    } else {
      const fallbackDataUrl = InkblotImageGenerator.createFallbackSvgDataUrl(imageIdx + 1);
      setImageUrls(prev => {
        const copy = [...prev];
        copy[imageIdx] = fallbackDataUrl;
        return copy;
      });
    }
  };

  const saveResponseToBackend = async (val, imgId, stepId) => {
    setIsSaving(true);
    const questions = ['free_response', 'location', 'feeling'];
    const questionKey = `card_${imgId}_step_${stepId}`;
    try {
      await fetch('/api/exercises/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: instance.id,
          question_id: questionKey,
          prompt: questions[stepId - 1],
          response: val,
          current_image: imgId,
          current_step: stepId
        })
      });
    } catch (err) {
      console.error('[Exercise2Flow] Autosave failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const advanceStep = async (val) => {
    const trimmed = val.trim();
    if (!trimmed) return;

    const questions = ['free_response', 'location', 'feeling'];
    const newResponses = [
      ...responses.filter(r => !(r.image_id === currentRole.id && r.step === step)),
      { image_id: currentRole.id, step, question: questions[step - 1], response: trimmed }
    ];
    setResponses(newResponses);
    setShowNudge(false);

    // Save response asynchronously
    saveResponseToBackend(trimmed, currentRole.id, step);

    if (step < 3) {
      setStep(step + 1);
    } else if (imageIdx < 4) {
      // Transition to next image with 600ms blank screen
      setScreen('transition');
      setTimeout(() => {
        setImageIdx(imageIdx + 1);
        setStep(1);
        setScreen('step');
      }, 600);
    } else {
      // Final image & step complete -> Loading screen
      finishExercise(newResponses);
    }
  };

  const handleStep1Submit = () => {
    const val = inputValue.trim();
    if (!val) return;
    const wordCount = val.split(/\s+/).filter(Boolean).length;
    if (wordCount < 3 && imageIdx < 4 && !showNudge) {
      setShowNudge(true);
      return;
    }
    advanceStep(val);
  };

  const finishExercise = async (finalResponses) => {
    setScreen('loading');
    startPollingStatus();

    try {
      await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: instance.id,
          responses: finalResponses
        })
      });
    } catch (err) {
      console.error('[Exercise2Flow] Submission error:', err);
    }
  };

  // ── 1. PREPARING DATA LOADING SCREEN ─────────────────────────────────────
  if (screen === 'preparing') {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0] text-[#1E2A2E] flex flex-col justify-between p-6">
        <div className="max-w-[480px] w-full mx-auto flex-1 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-8">
            <img 
              src="/logo-mark-transparent.png" 
              alt="Ingress Within" 
              className="w-5 h-5 object-contain" 
            />
            <span className="font-serif font-semibold text-xs text-[#1E2A2E]">ingress <em className="text-[#8DBFB4] not-italic">within</em></span>
          </div>
          <p className="font-serif italic text-base text-[#4A6A64] text-center animate-pulse px-6">
            Preparing your inkblot images...
          </p>
        </div>
      </div>
    );
  }

  // ── 2. INTRO SCREEN ──────────────────────────────────────────────────────
  if (screen === 'intro') {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0] text-[#1E2A2E] flex flex-col justify-between p-6 font-sans overflow-y-auto">
        <div className="max-w-[480px] w-full mx-auto flex-1 flex flex-col justify-center py-8">
          <div className="flex items-center gap-2 mb-8">
            <img 
              src="/logo-mark-transparent.png" 
              alt="Ingress Within" 
              className="w-5 h-5 object-contain" 
            />
            <span className="font-serif font-semibold text-xs text-[#1E2A2E]">ingress <em className="text-[#8DBFB4] not-italic">within</em></span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl text-[#1E2A2E] mb-6 font-normal">
            What You See
          </h1>

          <p className="text-base leading-[1.8] text-[#4A6A64]">
            You'll see five images, one at a time. For each one, write what you see first — then answer two short follow-up questions. There are no right answers. The images are abstract — you can't get this wrong. Move at your own pace.
          </p>
        </div>

        <div className="max-w-[480px] w-full mx-auto pb-6">
          <button
            type="button"
            onClick={() => setScreen('step')}
            className="w-full py-3.5 rounded-lg bg-[#1E2A2E] text-white text-sm font-semibold hover:bg-[#1E2A2E]/90 transition-all cursor-pointer shadow-sm"
          >
            Begin
          </button>
        </div>
      </div>
    );
  }

  // ── 3. TRANSITION BLANK SCREEN ──────────────────────────────────────────
  if (screen === 'transition') {
    return <div className="fixed inset-0 z-50 bg-[#ECEFF0]" />;
  }

  // ── 4. LOADING SCREEN (Analyzing your responses...) ──────────────────────
  if (screen === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0] text-[#1E2A2E] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex items-center gap-2 mb-8">
          <img 
            src="/logo-mark-transparent.png" 
            alt="Ingress Within" 
            className="w-5 h-5 object-contain" 
          />
          <span className="font-serif font-semibold text-xs text-[#1E2A2E]">ingress <em className="text-[#8DBFB4] not-italic">within</em></span>
        </div>
        <h2 className="font-serif italic text-xl sm:text-2xl text-[#4A6A64] animate-pulse mb-2">
          Analyzing your responses...
        </h2>
        <p className="text-xs text-[#4A6A64]/60 animate-pulse">
          Looking at what you saw across the five cards.
        </p>
      </div>
    );
  }

  // ── 5. FAILURE RECOVERY SCREEN ───────────────────────────────────────────
  if (screen === 'failed') {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0] text-[#1E2A2E] flex flex-col justify-between p-6 font-sans">
        <div className="max-w-[480px] w-full mx-auto flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <img 
              src="/logo-mark-transparent.png" 
              alt="Ingress Within" 
              className="w-5 h-5 object-contain" 
            />
            <span className="font-serif font-semibold text-xs text-[#1E2A2E]">ingress <em className="text-[#8DBFB4] not-italic">within</em></span>
          </div>

          <h2 className="font-serif italic text-xl text-[#1E2A2E]">
            We're taking a little longer than expected.
          </h2>
          <p className="text-xs text-[#4A6A64] max-w-xs">
            Your responses are completely safe. You can retry the analysis or return to the dashboard.
          </p>
        </div>

        <div className="max-w-[480px] w-full mx-auto space-y-3 pb-6">
          <button
            type="button"
            onClick={() => finishExercise(responses)}
            className="w-full py-3.5 rounded-lg bg-[#1E2A2E] text-white text-sm font-semibold hover:bg-[#1E2A2E]/90 transition-all cursor-pointer"
          >
            Retry Analysis
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-lg border border-[#1E2A2E]/20 text-[#1E2A2E] text-sm font-semibold hover:bg-white/50 transition-all cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── 6. REFLECTION SCREEN ────────────────────────────────────────────────
  if (screen === 'reflection') {
    return (
      <Exercise2ResultView
        instanceId={instance.id}
        onClose={() => {
          if (onComplete) onComplete();
          else if (onClose) onClose();
        }}
      />
    );
  }

  // ── 7. MAIN STEP QUESTION FLOW ──────────────────────────────────────────
  const r1 = responses.find(r => r.image_id === currentRole.id && r.step === 1);
  const r2 = responses.find(r => r.image_id === currentRole.id && r.step === 2);
  const currentImageUrl = imageUrls[imageIdx] || InkblotImageGenerator.createFallbackSvgDataUrl(imageIdx + 1);

  return (
    <div className="fixed inset-0 z-50 bg-[#ECEFF0] text-[#1E2A2E] flex flex-col justify-between font-sans overflow-y-auto">
      {/* Breath Modal (Image 4 Step 1 soft exit) */}
      {showBreath && (
        <div className="fixed inset-0 z-50 bg-[#1E2A2E]/95 flex items-center justify-center p-6 text-center animate-fadeIn">
          <div className="max-w-xs space-y-4">
            <p className="font-serif italic text-lg text-white">
              Take a moment. There's no hurry.
            </p>
            <button
              type="button"
              onClick={() => setShowBreath(false)}
              className="px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[480px] w-full mx-auto flex flex-col min-h-screen">
        {/* Header Logo */}
        <div className="px-6 pt-5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/logo-mark-transparent.png" 
              alt="Ingress Within" 
              className="w-5 h-5 object-contain" 
            />
            <span className="font-serif font-semibold text-sm">ingress <em className="text-[#8DBFB4] not-italic">within</em></span>
          </div>
          {isSaving && <span className="text-[10px] text-[#8DBFB4] animate-pulse">Saving...</span>}
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-2">
          <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#8DBFB4] mb-1.5">
            {currentRole.label} · Step {step} of 3
          </div>
          <div className="h-0.5 bg-[#1E2A2E]/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1E2A2E] transition-all duration-400 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Inkblot Image with Fallback Retry Handling */}
        <div className="px-6 pt-4">
          <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#E8E8E4] shadow-sm border border-[#1E2A2E]/5 relative">
            <img
              key={`${imageIdx}_${imgRetryState[imageIdx] || 0}`}
              src={currentImageUrl}
              onError={handleImageError}
              alt={`Inkblot Image ${imageIdx + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Step Meta */}
        <div className="px-6 pt-3 flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#8DBFB4]">
            Step {step} of 3
          </span>
          {imageIdx === 3 && step === 1 && (
            <button
              type="button"
              onClick={() => setShowBreath(true)}
              className="text-xs text-[#4A6A64]/60 hover:text-[#4A6A64] transition-colors cursor-pointer"
            >
              Need a moment?
            </button>
          )}
        </div>

        {/* Prior Responses Thread (Steps 2 & 3) */}
        {step >= 2 && (
          <div className="px-6 pt-2 space-y-1.5">
            {r1 && r1.response && (
              <div>
                <div className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#4A6A64]/60">What you saw</div>
                <div className="text-xs text-[#4A6A64] font-serif italic">"{r1.response}"</div>
              </div>
            )}
            {step === 3 && r2 && r2.response && (
              <div>
                <div className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#4A6A64]/60">Where you looked</div>
                <div className="text-xs text-[#4A6A64] font-serif italic">"{r2.response}"</div>
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="px-6 pt-4 flex-1 flex flex-col">
          {step === 1 && imageIdx === 0 && (
            <div className="font-serif italic text-base text-[#1E2A2E] mb-3">
              Write what you see.
            </div>
          )}

          {step === 2 && (
            <div className="text-sm text-[#1E2A2E] leading-relaxed mb-3">
              {currentRole.step2}
            </div>
          )}

          {step === 3 && (
            <div className="text-sm text-[#1E2A2E] leading-relaxed mb-3">
              {currentRole.step3}
            </div>
          )}

          {step === 1 ? (
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe what you see."
              rows={3}
              className="w-full py-3 bg-transparent border-b-1.5 border-[#1E2A2E]/15 focus:border-[#1E2A2E] outline-none font-serif italic text-base text-[#1E2A2E] placeholder-[#1E2A2E]/30 resize-none transition-colors"
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputValue.trim()) {
                  advanceStep(inputValue);
                }
              }}
              placeholder={step === 2 ? 'The part that caught your eye first.' : 'A feeling, or nothing at all.'}
              className="w-full py-3 bg-transparent border-b-1.5 border-[#1E2A2E]/15 focus:border-[#1E2A2E] outline-none font-serif italic text-base text-[#1E2A2E] placeholder-[#1E2A2E]/30 transition-colors"
            />
          )}

          {/* Short Response Nudge */}
          {showNudge && (
            <div className="pt-2 text-xs text-[#4A6A64] flex items-center justify-between">
              <span>Anything else you notice?</span>
              <button
                type="button"
                onClick={() => {
                  setShowNudge(false);
                  advanceStep(inputValue);
                }}
                className="text-[#8DBFB4] underline cursor-pointer hover:text-[#4A6A64]"
              >
                No, continue
              </button>
            </div>
          )}
        </div>

        {/* Submit Wrap */}
        <div className="px-6 py-6 mt-auto">
          <button
            type="button"
            disabled={!inputValue.trim()}
            onClick={() => {
              if (step === 1) handleStep1Submit();
              else advanceStep(inputValue);
            }}
            className="w-full py-3.5 rounded-lg bg-[#1E2A2E] text-white text-sm font-semibold disabled:opacity-30 disabled:cursor-default hover:bg-[#1E2A2E]/90 transition-all cursor-pointer shadow-sm"
          >
            {step < 3 ? 'Next' : imageIdx === 4 ? 'Done' : 'Next image'}
          </button>
        </div>
      </div>
    </div>
  );
}
