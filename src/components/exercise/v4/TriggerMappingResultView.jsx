import React, { useState, useEffect } from 'react';
import { RotateCw, ArrowLeft, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export default function TriggerMappingResultView({ instanceId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedMoments, setExpandedMoments] = useState(true);

  useEffect(() => {
    fetchResult(false);
  }, [instanceId]);

  const fetchResult = async (isRetry = false) => {
    if (isRetry) setRetrying(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/exercises/result?instance_id=${instanceId}${isRetry ? '&retry=true' : ''}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch exercise result.');

      setResult(data.result);

      let rawAnalysis = data.result?.analysis || data.result?.data || {};
      if (typeof rawAnalysis === 'string') {
        try { rawAnalysis = JSON.parse(rawAnalysis); } catch (_) { rawAnalysis = {}; }
      }

      // If reflection text is missing or generic fallback summary was recorded, auto-retry once
      const isMissingReflection = !rawAnalysis.reflection_text || rawAnalysis.reflection_text === 'Your responses have been recorded below.';
      if (!isRetry && isMissingReflection) {
        console.log('[TriggerMappingResultView] Reflection missing or fallback detected. Auto-triggering background analysis...');
        fetchResult(true);
        return;
      }
    } catch (err) {
      console.error('[TriggerMappingResultView] Fetch error:', err);
      setError(err.message || 'Unable to load result.');
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F4F6F5] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-[480px] w-full bg-white rounded-3xl p-10 border border-[#1E2A2E]/10 shadow-xs flex flex-col items-center space-y-4">
          <RotateCw className="w-8 h-8 animate-spin text-[#2E7A70] opacity-80" />
          <h2 className="font-serif text-2xl text-[#1E2A2E] font-normal leading-snug">
            Loading Trigger Mapping...
          </h2>
          <p className="text-xs text-[#4A6A64] font-light">
            Retrieving your mapped moments and observations.
          </p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F4F6F5] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-[440px] bg-white rounded-3xl p-8 border border-red-200 shadow-sm space-y-4">
          <p className="text-sm text-red-700 font-medium">{error || 'Result unavailable.'}</p>
          <div className="flex gap-3">
            <button
              onClick={() => fetchResult(true)}
              className="flex-1 py-3.5 rounded-xl bg-[#1E2A2E] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#16201F] cursor-pointer"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl bg-[#ECEFF0] text-[#1E2A2E] text-xs font-bold uppercase tracking-wider hover:bg-[#ECEFF0]/80 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  let analysis = result.analysis || result.data || {};
  if (typeof analysis === 'string') {
    try { analysis = JSON.parse(analysis); } catch (_) { analysis = {}; }
  }

  const moments = Array.isArray(analysis.moments) ? analysis.moments : [];
  const synthesisAnswer = analysis.synthesis_answer || '';
  const reflectionText = analysis.reflection_text && analysis.reflection_text !== 'Your responses have been recorded below.'
    ? analysis.reflection_text
    : (result.summary && !result.summary.includes('recorded below') ? result.summary : null);

  const worthSittingWith = Array.isArray(analysis.worth_sitting_with) ? analysis.worth_sitting_with : [];
  const completedAt = analysis.completedAt || result.generated_at || result.created_at;
  const dateStr = completedAt ? new Date(completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  const hasCompleteAnalysis = Boolean(reflectionText);

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F6F5] flex flex-col p-6 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-[620px] mx-auto w-full space-y-8 pb-16">
        {/* Top Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 text-[#4A6A64] hover:text-[#1E2A2E] transition-colors rounded-full hover:bg-black/5 cursor-pointer"
              aria-label="Back to exercises"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img 
              src="/logo-mark-transparent.png" 
              alt="Ingress Within" 
              className="w-6 h-6 object-contain flex-shrink-0" 
            />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8DBFB4]/20 text-[#1E2A2E] text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7A70]" />
            Completed
          </span>
        </div>

        {/* Card Container */}
        <div className="bg-white border border-[#1E2A2E]/10 rounded-3xl p-6 md:p-10 shadow-xs space-y-8">
          {/* Header Title */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8DBFB4] block mb-1">
              Trigger Mapping Result
            </span>
            <h1 className="font-serif text-2xl md:text-3xl text-[#1E2A2E] font-normal leading-tight">
              Trigger Mapping
            </h1>
            {dateStr && (
              <p className="text-xs text-[#4A6A64] mt-1 font-light">
                {dateStr}
              </p>
            )}
          </div>

          {/* Analysis Card */}
          {hasCompleteAnalysis ? (
            <div className="p-6 bg-[#8DBFB4]/15 border border-[#8DBFB4]/30 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E7A70] block">
                Analysis
              </span>
              <p className="font-serif text-base md:text-lg text-[#1E2A2E] leading-relaxed">
                {reflectionText}
              </p>
            </div>
          ) : (
            <div className="p-6 bg-[#F4F6F5] border border-[#1E2A2E]/10 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#7B3B59]" />
                <span className="text-xs font-semibold text-[#1E2A2E]">
                  Your responses are safely preserved.
                </span>
              </div>
              <p className="text-xs text-[#4A6A64] leading-relaxed">
                AI reflection was not generated during submission. You can re-run the observation anytime.
              </p>
              <button
                onClick={() => fetchResult(true)}
                disabled={retrying}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E2A2E] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#16201F] transition-all cursor-pointer"
              >
                {retrying ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Generate Analysis →'
                )}
              </button>
            </div>
          )}

          {/* Worth Sitting With (Deeper Focus Points) */}
          {worthSittingWith.length > 0 && (
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B3B59] block">
                Worth sitting with
              </span>
              <div className="space-y-4">
                {worthSittingWith.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-white border border-[#1E2A2E]/10 rounded-2xl shadow-xs space-y-2"
                  >
                    <h3 className="font-serif text-base text-[#1E2A2E] font-medium leading-snug">
                      {item.label}
                    </h3>
                    <p className="text-xs md:text-sm text-[#4A6A64] leading-relaxed font-sans font-light">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Synthesis Section */}
          {synthesisAnswer && (
            <div className="p-5 bg-[#F4F6F5]/50 border border-[#1E2A2E]/10 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A6A64] block">
                Your Synthesis
              </span>
              <p className="font-serif italic text-sm md:text-base text-[#1E2A2E] leading-relaxed">
                "{synthesisAnswer}"
              </p>
            </div>
          )}

          {/* Mapped Moments Recap */}
          {moments.length > 0 && (
            <div className="pt-2 border-t border-[#1E2A2E]/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A6A64]">
                  What you mapped ({moments.length} moments)
                </span>
                <button
                  type="button"
                  onClick={() => setExpandedMoments(prev => !prev)}
                  className="text-xs text-[#2E7A70] hover:text-[#1E2A2E] font-medium inline-flex items-center gap-1 cursor-pointer bg-transparent border-none"
                >
                  {expandedMoments ? (
                    <>Hide <ChevronUp className="w-3.5 h-3.5" /></>
                  ) : (
                    <>Show <ChevronDown className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>

              {expandedMoments && (
                <div className="space-y-4">
                  {moments.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-5 bg-[#F4F6F5]/30 border border-[#1E2A2E]/10 rounded-2xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7A70]">
                          Moment {idx + 1}
                        </span>
                      </div>
                      <p className="font-serif text-sm text-[#1E2A2E] leading-relaxed">
                        {m.moment_text}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs border-t border-[#1E2A2E]/5">
                        <div className="p-3 bg-white rounded-xl border border-[#1E2A2E]/5 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-[#7B3B59] block">
                            First Reaction
                          </span>
                          <p className="text-[#1E2A2E] leading-relaxed">
                            {m.q1 || m.answers?.first_reaction}
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-[#1E2A2E]/5 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-[#7B3B59] block">
                            Wanted to Avoid
                          </span>
                          <p className="text-[#1E2A2E] leading-relaxed">
                            {m.q2 || m.answers?.avoidance_goal}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Support and Closing Reflection */}
          <div className="pt-6 border-t border-[#1E2A2E]/10 text-center space-y-2">
            <p className="text-xs text-[#4A6A64] italic">
              You don’t need to do anything with this right now.
            </p>
            <p className="text-xs text-[#4A6A64] italic">
              This is where things stand today. It can look different next time.
            </p>
            <p className="text-xs text-[#4A6A64]/70 pt-3 max-w-[480px] mx-auto leading-relaxed font-light">
              If anything here brought something difficult up, support is available — you don’t have to sit with it alone.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl bg-[#1E2A2E] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#16201F] transition-all cursor-pointer shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
