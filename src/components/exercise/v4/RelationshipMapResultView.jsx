import React, { useState, useEffect } from 'react';
import { RotateCw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { FREQUENCY_DISPLAY_MAP } from '../../../lib/exercises/v4/definitions/relationshipMapCatalog';

export default function RelationshipMapResultView({ instanceId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [completedAt, setCompletedAt] = useState(null);

  useEffect(() => {
    fetchResult();
  }, [instanceId]);

  const fetchResult = async (retry = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = retry
        ? `/api/exercises/result?instance_id=${instanceId}&retry=true`
        : `/api/exercises/result?instance_id=${instanceId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to load relationship map result.');

      setResult(data.result);
      if (data.instance?.completed_at || data.result?.created_at) {
        setCompletedAt(data.instance?.completed_at || data.result?.created_at);
      }

      const analysis = data.result?.analysis || data.result?.data || {};
      if (!retry && (!analysis.reflection_text || data.result?.summary === 'Your relationship map has been recorded below.')) {
        console.log('[RelationshipMapResultView] reflection_text is null/fallback. Retrying analysis in background...');
        fetchResult(true);
      }
    } catch (err) {
      console.error('[RelationshipMapResultView] Error loading result:', err);
      setError(err.message || 'Unable to display results.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <RotateCw className="w-6 h-6 animate-spin text-[#4A6A64] mb-3 opacity-70" />
        <p className="font-serif italic text-base text-[#4A6A64]">
          Mapping what you shared...
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-[420px] bg-white rounded-3xl p-8 border border-line shadow-sm space-y-4">
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
  const relationshipMap = analysis.relationship_map || [];
  
  let rawReflection =
    analysis.reflection_text ||
    (result.summary && result.summary !== 'Your relationship map has been recorded below.' ? result.summary : null) ||
    'Your relationship map has been recorded below.';

  // Sanitize raw reflection text if AI output contained unparsed JSON key fragments
  if (rawReflection.includes('{') || rawReflection.includes('reflection_text')) {
    const reflMatch = rawReflection.match(/reflection_text["']?\s*:\s*["']?([\s\S]+?)(?:["']?\s*,\s*["']?highest_drain_person|["']?\s*\}|$)/i);
    if (reflMatch && reflMatch[1]) {
      rawReflection = reflMatch[1].replace(/^["']|["']$/g, '').trim();
    } else {
      rawReflection = rawReflection
        .replace(/[*#"`]/g, '')
        .replace(/^\{?\s*reflection_text:\s*/i, '')
        .replace(/,\s*highest_drain_person:.*$/i, '')
        .replace(/\}?\s*$/g, '')
        .trim();
    }
  }

  const reflectionText = rawReflection || 'Your relationship map has been recorded below.';

  const formattedDate = completedAt
    ? new Date(completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] text-[#1E2A2E] font-sans overflow-y-auto flex flex-col justify-between">
      <div className="w-full max-w-[480px] mx-auto min-h-screen flex flex-col justify-between p-6 sm:p-8">
        
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
                  Relationship Map
                </h1>
                <p className="text-xs text-mid mt-0.5 font-mono">
                  Completed {formattedDate}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-mid hover:text-primary rounded-full hover:bg-black/5">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="my-6">
            <p className="font-serif text-lg md:text-xl text-[#1E2A2E] leading-relaxed font-normal">
              {reflectionText}
            </p>
          </div>

          <hr className="border-t border-[#1E2A2E]/10 my-8" />

          <div className="space-y-4">
            <h2 className="font-serif text-base text-primary font-normal">
              Here's what you mapped.
            </h2>

            <div className="space-y-3 pt-2">
              {relationshipMap.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-line shadow-2xs">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        p.energy === 'gives' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      title={p.energy === 'gives' ? 'Gives energy' : 'Takes energy'}
                    />
                    <div>
                      <h3 className="font-medium text-sm text-primary">{p.name}</h3>
                      <p className="text-xs text-mid">{p.label} · <span className="italic">"{p.feeling}"</span></p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-mid">
                    {FREQUENCY_DISPLAY_MAP[p.frequency] || p.frequency}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-2 text-xs text-mid leading-relaxed italic border-t border-[#1E2A2E]/10 pt-6">
            <p>You don’t need to do anything with this right now.</p>
            <p>This is your map for now. It will evolve.</p>
          </div>
        </div>

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
