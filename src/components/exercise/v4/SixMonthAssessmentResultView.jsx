import React, { useState, useEffect } from 'react';
import { EXERCISE_9_BASE_QUESTIONS } from '../../../lib/exercises/v4/definitions/sixMonthAssessmentCatalog';
import { ArrowLeft, CheckCircle2, AlertCircle, Sparkles, HelpCircle, Layers } from 'lucide-react';

export default function SixMonthAssessmentResultView({ instanceId, onClose }) {
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
      console.error('[SixMonthAssessmentResultView] Fetch error:', err);
      setError(err.message || 'Unable to load result');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-8 h-8 rounded-full border-2 border-[#4A6A64] border-t-transparent animate-spin mb-4" />
        <p className="text-sm text-[#5A6E65]">Loading your 6-month reflection…</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <AlertCircle className="w-8 h-8 text-[#A3645A] mb-3" />
        <h3 className="text-lg font-serif text-[#2C3E35] mb-2">Unable to load assessment result</h3>
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
  const metrics = result.metrics || {};
  const answers = analysis.answers || {};
  const ex03Baseline = analysis.ex03_baseline || null;
  const questionChanges = analysis.question_changes || [];

  const selfScore = analysis.self_description_change_score ?? metrics.self_description_change_score ?? 0;
  const entryScore = analysis.entry_validated_change_score ?? metrics.entry_validated_change_score ?? 0;
  const discrepancy = analysis.discrepancy || { level: 'low', summary: 'Self-perception and entry evidence are consistent.' };

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
            6-Month Milestone Report
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
      <div className="max-w-3xl w-full mx-auto p-6 sm:p-10 space-y-10">
        {/* Title */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF0EE] text-[#4A6A64] text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Longitudinal Comparison
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#2C3E35]">
            Six Months Later
          </h1>
          <p className="text-sm text-[#5A6E65]">
            A comparison of how you described yourself today versus six months ago, cross-referenced with your writing history.
          </p>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E2DDD0] shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs text-[#7A8E85] font-medium uppercase tracking-wider">Self-Described Shift</span>
              <div className="text-3xl font-serif text-[#2C3E35] mt-1 mb-2">
                {selfScore} <span className="text-base text-[#7A8E85] font-sans">/ 5 questions</span>
              </div>
            </div>
            <p className="text-xs text-[#5A6E65]">
              Questions where your Month 6 answer reflected a meaningful shift from baseline.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E2DDD0] shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs text-[#7A8E85] font-medium uppercase tracking-wider">Entry-Evidenced Shift</span>
              <div className="text-3xl font-serif text-[#4A6A64] mt-1 mb-2">
                {entryScore} <span className="text-base text-[#7A8E85] font-sans">/ 5 questions</span>
              </div>
            </div>
            <p className="text-xs text-[#5A6E65]">
              Shifts visibly supported by your actual journal entry writing.
            </p>
          </div>
        </div>

        {/* SECTION 1: What Changed */}
        <section className="bg-white p-6 rounded-2xl border border-[#E2DDD0] space-y-4 shadow-sm">
          <h2 className="text-lg font-serif text-[#2C3E35] flex items-center gap-2 border-b border-[#F0ECE1] pb-3">
            <CheckCircle2 className="w-5 h-5 text-[#4A6A64]" /> Section 1: What Changed
          </h2>
          <p className="text-xs text-[#5A6E65]">
            Comparing your current self-perception against Day 24 baseline:
          </p>

          <div className="space-y-4 pt-2">
            {EXERCISE_9_BASE_QUESTIONS.map((q, idx) => {
              const qNum = idx + 1;
              const qChange = questionChanges.find((qc) => qc.question_number === qNum);
              const curAns = answers[`q${qNum}`] || 'No response recorded.';
              const baseAns = ex03Baseline ? (ex03Baseline[`q${qNum}`] || 'No baseline recorded.') : null;

              return (
                <div key={q.id} className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBE7DF] space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[#4A6A64]">
                      Q{qNum}: {q.short}
                    </span>
                    {qChange?.meaningful_shift ? (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#E4EFEA] text-[#2D5A46]">
                        Shifted
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#F2EFE9] text-[#7A8E85]">
                        Stable
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#2C3E35] italic">"{curAns}"</p>

                  {qChange?.evidence_summary && (
                    <p className="text-xs text-[#5A6E65] pt-1 border-t border-[#EBE7DF]/80">
                      <span className="font-medium text-[#4A5D54]">Writing evidence:</span> {qChange.evidence_summary}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: What Your Writing Supports */}
        <section className="bg-[#F4F7F5] p-6 rounded-2xl border border-[#D5E2DC] space-y-3">
          <h2 className="text-lg font-serif text-[#2C3E35] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#3D6A55]" /> Section 2: What Your Writing Supports
          </h2>
          <p className="text-sm text-[#3D5247] leading-relaxed">
            {entryScore > 0
              ? `Your journal entries across the past 6 months validate ${entryScore} out of 5 core behavioral shifts. Your writing shows persistent practice in these areas rather than momentary intent.`
              : 'Your writing shows high stability. Your responses reflect consistent patterns across the past six months.'}
          </p>
        </section>

        {/* SECTION 3: Where the Picture is Less Clear (Discrepancy) */}
        <section className="bg-white p-6 rounded-2xl border border-[#E2DDD0] space-y-3 shadow-sm">
          <h2 className="text-lg font-serif text-[#2C3E35] flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#8C7A5E]" /> Section 3: Where the Picture is Less Clear
          </h2>
          <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#EBE4D5] text-xs text-[#5C5243] space-y-1">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-[#8C7A5E]">
              Discrepancy Level: {discrepancy.level || 'Moderate'}
            </span>
            <p className="text-sm leading-relaxed font-sans text-[#4A4235] mt-1">
              {discrepancy.summary || 'Some self-described changes represent emerging intentions that are still consolidating into written daily evidence.'}
            </p>
          </div>
        </section>

        {/* SECTION 4: Day 24 Baseline Comparison (Revealed ONLY post-submit) */}
        {ex03Baseline && (
          <section className="bg-white p-6 rounded-2xl border border-[#E2DDD0] space-y-4 shadow-sm">
            <h2 className="text-lg font-serif text-[#2C3E35] flex items-center gap-2 border-b border-[#F0ECE1] pb-3">
              <Layers className="w-5 h-5 text-[#4A6A64]" /> Section 4: Your Answer From Six Months Ago (Day 24)
            </h2>
            <p className="text-xs text-[#5A6E65]">
              Side-by-side view comparing Day 24 baseline against Month 6:
            </p>

            <div className="space-y-4">
              {EXERCISE_9_BASE_QUESTIONS.map((q, idx) => {
                const qNum = idx + 1;
                const baseAns = ex03Baseline[`q${qNum}`] || 'No baseline recorded.';
                const curAns = answers[`q${qNum}`] || 'No response recorded.';

                return (
                  <div key={q.id} className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBE7DF] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1 pr-2 sm:border-r border-[#EBE7DF]">
                      <span className="font-semibold text-[#8C7A5E] uppercase text-[10px] tracking-wider">
                        Day 24 Baseline (Q{qNum})
                      </span>
                      <p className="text-[#5A6E65] italic">"{baseAns}"</p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-semibold text-[#4A6A64] uppercase text-[10px] tracking-wider">
                        Month 6 Assessment (Q{qNum})
                      </span>
                      <p className="text-[#2C3E35] font-medium">"{curAns}"</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 5: What You May Still Be Working Out (Q6 & Q7) */}
        <section className="bg-white p-6 rounded-2xl border border-[#E2DDD0] space-y-4 shadow-sm">
          <h2 className="text-lg font-serif text-[#2C3E35] border-b border-[#F0ECE1] pb-3">
            Section 5: What You May Still Be Working Out
          </h2>

          <div className="space-y-4 text-xs text-[#4A5D54]">
            {answers.q6 && (
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBE7DF] space-y-2">
                <span className="font-semibold text-[#4A6A64] block">
                  Branch Q6 Reflection & Pattern Shift:
                </span>
                <p className="italic text-[#2C3E35]">"{answers.q6}"</p>
                {analysis.branch_q6_analysis?.summary && (
                  <p className="text-[#5A6E65] pt-2 border-t border-[#EBE7DF]">
                    {analysis.branch_q6_analysis.summary}
                  </p>
                )}
              </div>
            )}

            {answers.q7 && (
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBE7DF] space-y-2">
                <span className="font-semibold text-[#4A6A64] block">
                  Q7 Self-Identified Blind Spot:
                </span>
                <p className="italic text-[#2C3E35]">"{answers.q7}"</p>
                {analysis.q7_reflection && (
                  <p className="text-[#5A6E65] pt-2 border-t border-[#EBE7DF]">
                    {analysis.q7_reflection}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 6: AI Reflection Summary */}
        <section className="bg-[#2C3E35] text-[#FAF9F6] p-6 sm:p-8 rounded-2xl space-y-3 shadow-md">
          <h2 className="text-lg font-serif text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#8EB89D]" /> Section 6: Longitudinal Synthesis
          </h2>
          <p className="text-sm leading-relaxed text-[#D2E0D8]">
            {analysis.summary || result.summary || 'Six months of deliberate practice have shifted how you perceive difficult situations and conflicts. Your writing shows steady progress in aligning daily decisions with core values.'}
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
