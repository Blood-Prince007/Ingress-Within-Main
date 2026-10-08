import React, { useState, useEffect } from 'react';

export default function Exercise2ResultView({ instanceId, result: propResult, onClose }) {
  const [loading, setLoading] = useState(!propResult);
  const [result, setResult] = useState(propResult || null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (instanceId && !propResult) {
      fetchResult();
    }
  }, [instanceId, propResult]);

  const fetchResult = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/exercises/result?instance_id=${instanceId}`);
      if (!res.ok) {
        throw new Error(`Failed to load analysis result (HTTP ${res.status})`);
      }
      const data = await res.json();
      setResult(data.result);
    } catch (err) {
      console.error('[Exercise2ResultView] Fetch error:', err);
      setError(err.message || 'Unable to load analysis result.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0]/95 backdrop-blur-md flex items-center justify-center p-6 text-center">
        <div className="font-serif italic text-lg text-[#4A6A64] animate-pulse">
          Reading your responses...
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0]/95 backdrop-blur-md flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-lg border border-[#1E2A2E]/10">
          <h3 className="font-serif italic text-xl text-[#1E2A2E]">Unable to load analysis</h3>
          <p className="text-xs text-[#4A6A64]">{error || 'No stored analysis found.'}</p>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#1E2A2E] text-white text-xs font-semibold hover:bg-[#1E2A2E]/90 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const analysis = result.analysis || result.raw_json || {};
  const summary = result.summary || analysis.ai_analysis_text || 'Your responses have been recorded. They will feed into your Day 30 report.';
  const defaultLens = analysis.default_lens_label || 'mixed';
  const rawResponses = analysis.raw_responses || [];

  const cleanSummary = summary
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#+\s*/gm, '')
    .trim();

  return (
    <div className="fixed inset-0 z-50 bg-[#ECEFF0] text-[#1E2A2E] font-sans overflow-y-auto flex flex-col justify-between p-4 sm:p-6">
      <div className="w-full max-w-[640px] mx-auto flex flex-col space-y-6 py-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E2A2E]/10 pb-4">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-mark-transparent.png" 
              alt="Ingress Within" 
              className="w-7 h-7 object-contain flex-shrink-0" 
            />
            <div>
              <h1 className="font-serif italic text-lg text-[#1E2A2E]">Exercise 2: Inkblot Projective Analysis</h1>
              <div className="text-xs text-[#8DBFB4] font-medium flex items-center gap-1">
                <span>✓ Immutable Stored Assessment</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/60 hover:bg-white text-[#1E2A2E] flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Executive Synthesis Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#1E2A2E]/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8DBFB4]">
              EXECUTIVE SYNTHESIS
            </span>
            <span className="px-3 py-1 rounded-full bg-[#8DBFB4]/15 text-[#4A6A64] text-xs font-semibold uppercase tracking-wider">
              {defaultLens}
            </span>
          </div>

          <p className="font-serif italic text-[18px] sm:text-[20px] leading-[1.7] text-[#1E2A2E]">
            "{cleanSummary}"
          </p>

          <hr className="w-8 border-t-2 border-[#B8A8D4] my-2" />

          <p className="text-xs text-[#4A6A64]">
            This feeds into your Day 30 report.
          </p>
        </div>

        {/* Raw Responses Summary Grid */}
        {rawResponses && rawResponses.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#1E2A2E]/5 space-y-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8DBFB4]">
              PROJECTIVE RESPONSES SEQUENCE
            </span>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(cardId => {
                const cardResps = rawResponses.filter(r => r.image_id === cardId);
                if (cardResps.length === 0) return null;
                return (
                  <div key={cardId} className="p-3.5 rounded-xl bg-[#ECEFF0]/60 space-y-1 text-xs">
                    <span className="text-[10px] font-semibold text-[#8DBFB4] uppercase">Card {cardId}</span>
                    {cardResps.map((cr, idx) => (
                      <div key={idx} className="flex items-baseline gap-2">
                        <span className="text-[10px] text-[#4A6A64] uppercase font-mono">Step {cr.step}:</span>
                        <span className="font-serif italic text-[#1E2A2E]">"{cr.response}"</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3.5 rounded-xl bg-[#1E2A2E] text-white text-sm font-semibold hover:bg-[#1E2A2E]/90 transition-all cursor-pointer shadow-sm"
          >
            Return to Exercise Hub
          </button>
        </div>

      </div>
    </div>
  );
}
