import React, { useState, useEffect } from 'react';
import { RotateCw, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function CoreValuesResultView({ instanceId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [completedAt, setCompletedAt] = useState(null);

  useEffect(() => {
    fetchResult();
  }, [instanceId]);

  const fetchResult = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/exercises/result?instance_id=${instanceId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to load values result.');
      
      setResult(data.result);
      if (data.instance?.completed_at || data.result?.created_at) {
        setCompletedAt(data.instance?.completed_at || data.result?.created_at);
      }
    } catch (err) {
      console.error('[CoreValuesResultView] Error loading result:', err);
      setError(err.message || 'Unable to display exercise results.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <RotateCw className="w-6 h-6 animate-spin text-[#4A6A64] mb-3 opacity-70" />
        <p className="font-serif italic text-base text-[#4A6A64]">
          Loading your core values reflection...
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-[420px] bg-white rounded-3xl p-8 border border-line shadow-sm space-y-4">
          <p className="text-sm text-red-600 font-medium">{error || 'Result record unavailable.'}</p>
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

  const selectedValues = result.data?.selected_values || [];
  const reflectionText =
    result.summary || result.data?.reflection_text || 'Your values have been recorded below.';

  const formattedDate = completedAt
    ? new Date(completedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] text-[#1E2A2E] font-sans overflow-y-auto flex flex-col justify-between">
      <div className="w-full max-w-[480px] mx-auto min-h-screen flex flex-col justify-between p-6 sm:p-8">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b border-[#1E2A2E]/10 pb-4 mb-8">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-mark-transparent.png" 
                alt="Ingress Within" 
                className="w-8 h-8 object-contain flex-shrink-0" 
              />
              <div>
                <h1 className="font-serif text-2xl md:text-3xl text-primary font-normal">
                  Core Values Card Sort
                </h1>
                <p className="text-xs text-mid mt-0.5 font-mono">
                  Completed {formattedDate}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-mid hover:text-primary rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Reflection Text in large serif font with generous whitespace */}
          <div className="my-8 py-2">
            <p className="font-serif text-lg md:text-xl text-[#1E2A2E] leading-relaxed tracking-wide font-normal">
              {reflectionText}
            </p>
          </div>

          {/* Divider */}
          <hr className="border-t border-[#1E2A2E]/10 my-8" />

          {/* Here's what you chose section */}
          <div className="space-y-6">
            <h2 className="font-serif text-lg text-primary font-normal">
              Here's what you chose.
            </h2>

            {/* Simple numbered list (NO cards per spec) */}
            <ol className="space-y-3 pl-1 font-sans text-sm text-[#1E2A2E]">
              {selectedValues.map((val, idx) => (
                <li key={val} className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-[#8DBFB4] font-bold w-5">
                    {idx + 1}.
                  </span>
                  <span className="font-medium text-[#1E2A2E]">
                    {val}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Required exact closing disclosure lines */}
          <div className="mt-12 space-y-2 text-xs text-mid italic leading-relaxed border-t border-[#1E2A2E]/5 pt-6">
            <p>You don’t need to do anything with this right now.</p>
            <p>This is where things stand today. It can look different next time.</p>
          </div>
        </div>

        {/* Bottom Action Button */}
        <div className="pt-8 mt-6">
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-[#1E2A2E] text-white text-xs font-semibold hover:bg-[#1E2A2E]/90 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
