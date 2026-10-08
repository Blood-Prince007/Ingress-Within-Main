import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle, Sparkles, Shield, HeartHandshake, HelpCircle, Info } from 'lucide-react';

export default function UnfinishedConversationResultView({ instanceId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResult();
  }, [instanceId]);

  const fetchResult = async () => {
    if (!instanceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/exercises/result?instance_id=${instanceId}`);
      if (!res.ok) throw new Error('Failed to fetch assessment results');
      const data = await res.json();
      setResult(data.result);
    } catch (err) {
      console.error('[UnfinishedConversationResultView] Fetch error:', err);
      setError(err.message || 'Unable to load result');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-8 h-8 rounded-full border-2 border-[#4A6A64] border-t-transparent animate-spin mb-4" />
        <p className="text-sm text-[#5A6E65]">Loading your reflection analysis…</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <AlertCircle className="w-8 h-8 text-[#A3645A] mb-3" />
        <h3 className="text-lg font-serif text-[#2C3E35] mb-2">Unable to load result</h3>
        <p className="text-xs text-[#7A8E85] mb-4 max-w-sm">{error || 'No result data found.'}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-full bg-[#2C3E35] text-white text-xs font-medium"
        >
          Close
        </button>
      </div>
    );
  }

  const analysis = result.analysis || {};
  const answers = analysis.answers || {};
  const convSummary = analysis.conversation_summary || {
    person_name: analysis.person_name || 'Person',
    relationship_type: analysis.relationship_type || 'Relationship',
    unfinished_duration: analysis.unfinished_duration || 'unspecified duration'
  };

  const patternMatch = (analysis.pattern_match || 'partial').toLowerCase();
  const patternLabel = patternMatch === 'matched' ? 'Matched' : patternMatch === 'partial' ? 'Partial Match' : 'No Clear Match';
  const patternBadgeColor = patternMatch === 'matched'
    ? 'bg-[#E4EFEA] text-[#2D5A46] border-[#B8D7C8]'
    : patternMatch === 'partial'
    ? 'bg-[#FDF8EC] text-[#8C7A5E] border-[#E8DCB8]'
    : 'bg-[#F5F2EC] text-[#7A8E85] border-[#DCD6C8]';

  const protects = analysis.what_silence_protects || {};
  const costs = analysis.what_it_costs || {};

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col font-sans overflow-y-auto">
      {/* Header bar */}
      <div className="w-full max-w-3xl mx-auto px-6 py-4 flex items-center justify-between border-b border-[#EBE7DF]">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-[#5A6E65] hover:text-[#2C3E35] transition-colors rounded-full hover:bg-[#F2EFE9]"
              title="Close"
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
            Unfinished Conversation Analysis
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#2C3E35] text-[#FAF9F6] text-xs font-medium hover:bg-[#3D5247] transition-colors"
          >
            Done
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl w-full mx-auto p-6 sm:p-10 space-y-8">
        {/* Title & Context */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF0EE] text-[#4A6A64] text-xs font-medium mb-2">
            <HeartHandshake className="w-3.5 h-3.5" /> Relational Avoidance Reflection
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#2C3E35]">
            Unfinished Conversation with {convSummary.person_name}
          </h1>
          <p className="text-sm text-[#5A6E65]">
            {convSummary.relationship_type} · Unfinished for approximately {convSummary.unfinished_duration}
          </p>
        </div>

        {/* SECTION 1: THE CONVERSATION OVERVIEW */}
        <section className="bg-white p-6 rounded-2xl border border-[#E2DDD0] space-y-3 shadow-sm">
          <h2 className="text-sm font-semibold text-[#4A6A64] uppercase tracking-wider border-b border-[#F0ECE1] pb-2">
            1. The Conversation Context
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#EBE7DF]">
              <span className="text-[#7A8E85] block">Person</span>
              <span className="font-medium text-[#2C3E35] text-sm">{convSummary.person_name}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#EBE7DF]">
              <span className="text-[#7A8E85] block">Relationship</span>
              <span className="font-medium text-[#2C3E35] text-sm">{convSummary.relationship_type}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#EBE7DF]">
              <span className="text-[#7A8E85] block">Duration</span>
              <span className="font-medium text-[#2C3E35] text-sm">{convSummary.unfinished_duration}</span>
            </div>
          </div>
        </section>

        {/* SECTION 2: WHAT REMAINS UNSAID */}
        <section className="bg-white p-6 rounded-2xl border border-[#E2DDD0] space-y-3 shadow-sm">
          <h2 className="text-sm font-semibold text-[#4A6A64] uppercase tracking-wider border-b border-[#F0ECE1] pb-2">
            2. What Remains Unsaid (Direct Statement)
          </h2>
          <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBE7DF] italic text-sm text-[#2C3E35] leading-relaxed">
            "{answers.q2 || analysis.direct_address_statement || 'Direct statement recorded.'}"
          </div>
          {analysis.what_remains_unsaid && (
            <p className="text-xs text-[#5A6E65] pt-1">
              <span className="font-medium text-[#4A5D54]">Core Theme:</span> {analysis.what_remains_unsaid}
            </p>
          )}
        </section>

        {/* SECTION 3: WHAT THE SILENCE MAY BE PROTECTING */}
        <section className="bg-white p-6 rounded-2xl border border-[#E2DDD0] space-y-3 shadow-sm">
          <h2 className="text-sm font-semibold text-[#4A6A64] uppercase tracking-wider border-b border-[#F0ECE1] pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#4A6A64]" /> 3. What Silence May Be Protecting
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#EBE4D5] space-y-1">
              <span className="font-semibold text-[#8C7A5E] uppercase text-[10px] tracking-wider block">
                For Yourself:
              </span>
              <p className="text-[#4A4235] text-sm leading-relaxed">
                {protects.self_protection || 'Protecting against immediate conflict, discomfort, or vulnerability.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#EBE4D5] space-y-1">
              <span className="font-semibold text-[#8C7A5E] uppercase text-[10px] tracking-wider block">
                For Them / The Relationship:
              </span>
              <p className="text-[#4A4235] text-sm leading-relaxed">
                {protects.other_protection || 'Protecting current surface peace, their feelings, or relationship stability.'}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: WHAT IT APPEARS TO COST */}
        <section className="bg-white p-6 rounded-2xl border border-[#E2DDD0] space-y-3 shadow-sm">
          <h2 className="text-sm font-semibold text-[#4A6A64] uppercase tracking-wider border-b border-[#F0ECE1] pb-2">
            4. What Silence Appears to Cost
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#EBE7DF] space-y-1">
              <span className="font-semibold text-[#5A6E65] text-[11px] block">Emotional Cost</span>
              <p className="text-[#2C3E35] leading-relaxed">
                {costs.emotional_cost || 'Carrying unexpressed tension creates ongoing emotional weight.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#EBE7DF] space-y-1">
              <span className="font-semibold text-[#5A6E65] text-[11px] block">Relational Cost</span>
              <p className="text-[#2C3E35] leading-relaxed">
                {costs.relational_cost || 'Maintains emotional distance and unaddressed boundaries.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#EBE7DF] space-y-1">
              <span className="font-semibold text-[#5A6E65] text-[11px] block">Cognitive Cost</span>
              <p className="text-[#2C3E35] leading-relaxed">
                {costs.cognitive_cost || 'Occupies ongoing background thoughts and mental space.'}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: PATTERN CONNECTION */}
        <section className="bg-white p-6 rounded-2xl border border-[#E2DDD0] space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-2">
            <h2 className="text-sm font-semibold text-[#4A6A64] uppercase tracking-wider">
              5. Pattern Connection
            </h2>
            <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${patternBadgeColor}`}>
              {patternLabel}
            </span>
          </div>

          <p className="text-xs text-[#4A5D54] leading-relaxed pt-1">
            {analysis.pattern_explanation || 'Your reflection connects to patterns visible in your writing history and Relationship Map data.'}
          </p>
        </section>

        {/* SECTION 6: A NOTE OF PERSPECTIVE (SAFETY GROUNDING) */}
        <section className="bg-[#F0ECE1]/80 p-6 rounded-2xl border border-[#E2DDD0] space-y-2">
          <div className="flex items-center gap-2 text-[#4A6A64] font-medium text-xs uppercase tracking-wider">
            <Info className="w-4 h-4" /> A Note of Perspective
          </div>
          <p className="text-sm text-[#2C3E35] leading-relaxed font-serif">
            {analysis.note_of_perspective || 'This exercise does not ask you to contact or confront anyone. It only makes visible what keeping it unfinished appears to be doing.'}
          </p>
        </section>

        {/* SECTION 7: LONGITUDINAL SYNTHESIS */}
        <section className="bg-[#2C3E35] text-[#FAF9F6] p-6 sm:p-8 rounded-2xl space-y-3 shadow-md">
          <h2 className="text-lg font-serif text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#8EB89D]" /> Relational Synthesis
          </h2>
          <p className="text-sm leading-relaxed text-[#D2E0D8]">
            {analysis.summary || result.summary || 'Examining what remains unsaid clarifies the trade-off between surface peace and underlying emotional cost. Noticing what silence protects allows you to understand the relationship without pressure to act.'}
          </p>
        </section>

        <div className="pt-4 text-center">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-full bg-[#2C3E35] text-[#FAF9F6] hover:bg-[#3D5247] transition-colors text-sm font-medium shadow-sm"
          >
            Return to Exercises Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
