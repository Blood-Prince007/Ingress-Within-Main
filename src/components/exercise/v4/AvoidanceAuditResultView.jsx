import React, { useState, useEffect } from 'react';
import { RotateCw, ArrowLeft } from 'lucide-react';

export default function AvoidanceAuditResultView({ instanceId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResult(false);
  }, [instanceId]);

  const fetchResult = async (retry = false) => {
    try {
      const res = await fetch(`/api/exercises/result?instance_id=${instanceId}${retry ? '&retry=true' : ''}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch result');
      setResult(data.result);

      const analysis = data.result?.analysis || data.result?.data || {};
      if (!retry && (!analysis.reflection_text || data.result?.summary?.includes('recorded below'))) {
        fetchResult(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <RotateCw className="w-6 h-6 animate-spin text-[#4A6A64] mb-3 opacity-70" />
        <p className="font-serif italic text-base text-[#4A6A64]">
          Processing your Avoidance Audit...
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-[420px] bg-white rounded-3xl p-8 border border-stone-200 shadow-sm space-y-4">
          <p className="text-sm text-red-600 font-medium">{error || 'Result unavailable.'}</p>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-[#1E2A2E] text-white text-xs font-semibold hover:bg-[#1E2A2E]/90 cursor-pointer"
          >
            Return to Exercise Hub
          </button>
        </div>
      </div>
    );
  }

  const analysis = result.analysis || result.data || {};
  const completions = analysis.raw_completions || [];
  const worthSittingWith = analysis.worth_sitting_with || [];
  
  let rawReflection =
    analysis.reflection_text ||
    (result.summary && !result.summary.includes('recorded below') ? result.summary : null) ||
    'Your completions have been recorded below.';

  if (rawReflection.includes('{') || rawReflection.includes('reflection_text')) {
    const reflMatch = rawReflection.match(/reflection_text["']?\s*:\s*["']?([\s\S]+?)(?:["']?\s*,\s*["']?worth_sitting_with|["']?\s*\}|$)/i);
    if (reflMatch && reflMatch[1]) {
      rawReflection = reflMatch[1].replace(/^["']|["']$/g, '').trim();
    } else {
      rawReflection = rawReflection.replace(/[*#"`]/g, '').replace(/^\{?\s*reflection_text:\s*/i, '').trim();
    }
  }

  const reflectionText = rawReflection || 'Your completions have been recorded below.';

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col p-6 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-[620px] mx-auto w-full space-y-8 pb-12">
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 transition-colors rounded-full hover:bg-stone-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img 
              src="/logo-mark-transparent.png" 
              alt="Ingress Within" 
              className="w-6 h-6 object-contain flex-shrink-0" 
            />
          </div>
          <span className="text-xs text-stone-400 font-medium">Completed</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-serif text-stone-900 tracking-tight">Avoidance Audit</h1>
          <p className="text-xs text-stone-400 uppercase tracking-widest font-semibold">Reflection & Findings</p>
        </div>

        {/* AI Reflection Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200 shadow-sm space-y-4">
          <span className="text-xs font-semibold text-[#4A6A64] uppercase tracking-wider">Analysis</span>
          <p className="text-stone-800 font-serif text-lg leading-relaxed">
            {reflectionText}
          </p>

          {analysis.common_thread && analysis.common_thread !== 'No single thread identified.' && (
            <div className="pt-3 border-t border-stone-100">
              <span className="text-xs font-medium text-stone-400 block mb-1">Common Thread</span>
              <p className="text-sm text-stone-700 italic font-serif">
                "{analysis.common_thread}"
              </p>
            </div>
          )}
        </div>

        {/* Worth Sitting With Notes */}
        {worthSittingWith && worthSittingWith.length > 0 && (
          <div className="space-y-4 pt-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Worth Sitting With</h2>
            <div className="space-y-3">
              {worthSittingWith.map((noteItem, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-2">
                  <span className="text-xs font-medium text-[#4A6A64]">Prompt {noteItem.prompt}</span>
                  <p className="text-sm text-stone-700 leading-relaxed font-sans">
                    {noteItem.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User's 6 Finished Continuous Sentences */}
        <div className="space-y-4 pt-4 border-t border-stone-200">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Here's what you wrote</h2>
          <div className="space-y-3">
            {completions.map((c, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm text-base font-serif leading-relaxed">
                <span className="text-stone-400">{c.stem}</span>
                <span className="text-stone-900 font-normal">{c.completion}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Closing Lines & Standing Support Line */}
        <div className="pt-6 text-center space-y-2 border-t border-stone-200">
          <p className="text-xs text-stone-400 italic">You don’t need to do anything with this right now.</p>
          <p className="text-xs text-stone-400 italic">This is where things stand today. It can look different next time.</p>
          <p className="text-xs text-stone-500 pt-3 max-w-[460px] mx-auto leading-relaxed">
            If anything here brought something difficult up, support is available — you don’t have to sit with it alone.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-[#1E2A2E] text-white text-sm font-semibold hover:bg-[#1E2A2E]/90 transition-all cursor-pointer shadow-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
}
