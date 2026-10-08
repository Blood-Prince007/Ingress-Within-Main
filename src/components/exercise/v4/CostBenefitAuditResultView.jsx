import React, { useState, useEffect } from 'react';
import { RotateCw, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function CostBenefitAuditResultView({ instanceId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
      const rawPatterns = Array.isArray(rawAnalysis.patterns) ? rawAnalysis.patterns : (Array.isArray(data.result?.patterns) ? data.result.patterns : []);
      const missingObs = rawPatterns.length === 0 || rawPatterns.some(p => !p.analysis?.observation);

      if (!isRetry && (missingObs || data.result?.summary?.includes('recorded below'))) {
        console.log('[CostBenefitAuditResultView] Observations missing or fallback summary detected. Auto-triggering background analysis...');
        fetchResult(true);
        return;
      }
    } catch (err) {
      console.error('[CostBenefitAuditResultView] Fetch error:', err);
      setError(err.message || 'Unable to load result.');
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F4F6F5] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-[480px] w-full bg-white rounded-2xl p-10 border border-[#1E2A2E]/10 shadow-sm flex flex-col items-center space-y-4">
          <RotateCw className="w-7 h-7 animate-spin text-[#2E7A70] opacity-80" />
          <h2 className="font-serif text-xl text-[#1E2A2E] font-normal">
            Loading Cost-Benefit Audit...
          </h2>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F4F6F5] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-[440px] bg-white rounded-2xl p-8 border border-red-200 shadow-sm space-y-4">
          <p className="text-sm text-red-700 font-medium">{error || 'Result unavailable.'}</p>
          <div className="flex gap-3">
            <button
              onClick={() => fetchResult(true)}
              className="flex-1 py-3 rounded-xl bg-[#1E2A2E] text-white text-xs font-semibold hover:bg-[#16201F] cursor-pointer"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[#ECEFF0] text-[#1E2A2E] text-xs font-semibold hover:bg-[#ECEFF0]/80 cursor-pointer"
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

  const patterns = Array.isArray(analysis.patterns)
    ? analysis.patterns
    : (Array.isArray(result.patterns) ? result.patterns : []);

  const completedAt = analysis.completedAt || result.generated_at || result.created_at;
  const dateStr = completedAt ? new Date(completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const overallReflection = analysis.overall_reflection || null;

  const anyMissingAnalysis = patterns.length === 0 || patterns.some(p => !p.analysis?.observation);

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F6F5] flex flex-col p-6 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-[640px] mx-auto w-full space-y-8 pb-16">
        {/* Top Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 text-[#4A6A64] hover:text-[#1E2A2E] transition-colors rounded-full hover:bg-black/5"
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
        <div className="bg-white border border-[#1E2A2E]/10 rounded-2xl p-8 md:p-10 shadow-xs space-y-8">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#8DBFB4] block mb-2">
              Cost-Benefit Audit
            </span>
            <h1 className="font-serif text-2xl md:text-3xl text-[#1E2A2E] font-normal leading-tight">
              Cost-Benefit Audit
            </h1>
            {dateStr && (
              <p className="text-xs text-[#4A6A64] mt-1.5 font-light">
                {dateStr}
              </p>
            )}
          </div>

          {/* Overall Synthesis Banner (if available) */}
          {overallReflection && (
            <div className="p-5 bg-[#8DBFB4]/15 border border-[#8DBFB4]/30 rounded-xl space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#2E7A70]">
                Overall Pattern Synthesis
              </span>
              <p className="font-serif italic text-sm md:text-base text-[#1E2A2E] leading-relaxed">
                "{overallReflection}"
              </p>
            </div>
          )}

          {/* Per-Pattern Blocks */}
          <div className="space-y-10">
            {patterns.map((p, idx) => {
              const obs = p.analysis?.observation;
              const protMech = p.analysis?.protectionMechanism;
              const relNote = p.analysis?.relationship;
              const answers = p.answers || { cost: p.q1, protection: p.q2, origin: p.q3, stillMakesSense: p.q4 };

              return (
                <div key={idx} className="space-y-6">
                  {idx > 0 && <hr className="border-t border-dashed border-[#1E2A2E]/15 my-8" />}

                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#4A6A64]">
                    Pattern {idx + 1} of {patterns.length}
                  </div>

                  {/* Dark Surface AI Observation Card */}
                  <div className="bg-[#1E2A2E] rounded-xl p-6 md:p-7 text-[#D8ECEA] space-y-3 shadow-xs">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8DBFB4] block">
                      Observation
                    </span>
                    {obs ? (
                      <p className="font-serif text-sm md:text-[15px] leading-relaxed text-[#D8ECEA]">
                        {obs}
                      </p>
                    ) : (
                      <p className="font-serif italic text-xs text-[#A8D4CE]">
                        This reflection could not be generated right now. Your responses have been recorded below.
                      </p>
                    )}

                    {(protMech || relNote) && (
                      <div className="pt-2 border-t border-white/10 space-y-2 text-xs text-[#A8D4CE] font-light">
                        {protMech && (
                          <p><strong className="text-white font-medium">Protection Function:</strong> {protMech}</p>
                        )}
                        {relNote && (
                          <p><strong className="text-white font-medium">Balance Dynamics:</strong> {relNote}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pull-quote of user's pattern */}
                  <div className="border-l-3 border-[#B8A8D4] bg-[#B8A8D4]/10 p-4 rounded-r-xl">
                    <span className="text-[10px] uppercase font-semibold text-[#4A6A64] block mb-1">
                      Pattern
                    </span>
                    <p className="font-serif italic text-base md:text-lg text-[#1E2A2E] leading-snug">
                      "{p.pattern || p.pattern_text}"
                    </p>
                  </div>

                  {/* 4 QA Blocks */}
                  <div className="space-y-4 pt-1">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4A6A64]">
                        What it costs
                      </span>
                      <p className="text-xs md:text-sm text-[#1E2A2E] leading-relaxed font-light whitespace-pre-wrap">
                        {answers.cost || '—'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4A6A64]">
                        What it protects
                      </span>
                      <p className="text-xs md:text-sm text-[#1E2A2E] leading-relaxed font-light whitespace-pre-wrap">
                        {answers.protection || '—'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4A6A64]">
                        When it first made sense
                      </span>
                      <p className="text-xs md:text-sm text-[#1E2A2E] leading-relaxed font-light whitespace-pre-wrap">
                        {answers.origin || '—'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4A6A64]">
                        Does it still
                      </span>
                      <p className="text-xs md:text-sm text-[#1E2A2E] leading-relaxed font-light whitespace-pre-wrap">
                        {answers.stillMakesSense || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Retry Analysis Button if Partial/Missing */}
          {anyMissingAnalysis && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => fetchResult(true)}
                disabled={retrying}
                className="w-full py-3 px-4 rounded-xl border border-[#1E2A2E]/20 text-[#1E2A2E] text-xs font-semibold hover:bg-black/5 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                <span>{retrying ? 'Re-analyzing...' : 'Retry Analysis for Missing Observations'}</span>
              </button>
            </div>
          )}

          {/* Closing Perspective Lines */}
          <div className="pt-6 border-t border-[#1E2A2E]/10 space-y-2 text-xs text-[#4A6A64] font-light">
            <p className="italic opacity-70">
              You don't need to do anything with this right now.
            </p>
            <p className="italic opacity-70">
              This is where things stand today. It can look different next time.
            </p>
            <p className="pt-3 border-t border-[#1E2A2E]/10 text-[11px] opacity-80 leading-relaxed">
              If anything here brought something difficult up, support is available — you don't have to sit with it alone.
            </p>
          </div>

          {/* Done CTA */}
          <button
            onClick={onClose}
            className="w-full py-3.5 px-6 rounded-xl bg-[#1E2A2E] hover:bg-[#16201F] text-white font-semibold text-sm transition-all shadow-xs cursor-pointer text-center"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
