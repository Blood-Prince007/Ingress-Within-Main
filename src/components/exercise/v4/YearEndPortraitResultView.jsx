import React, { useState, useEffect } from 'react';
import { YEAR_END_ANCHORS, SYNTHESIS_QUESTIONS, UNIVERSAL_CLOSER_QUESTION } from '../../../lib/exercises/v4/definitions/yearEndPortraitCatalog';
import { ArrowLeft, Compass, HelpCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export default function YearEndPortraitResultView({ instanceId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedAnchors, setExpandedAnchors] = useState(false);
  const [expandedSynthesis, setExpandedSynthesis] = useState(false);

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
      console.error('[YearEndPortraitResultView] Fetch error:', err);
      setError(err.message || 'Unable to load result');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-8 h-8 rounded-full border-2 border-[#4A6A64] border-t-transparent animate-spin mb-4" />
        <p className="text-sm text-[#5A6E65]">Loading your Year-End Self-Portrait…</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <AlertCircle className="w-8 h-8 text-[#A3645A] mb-3" />
        <h3 className="text-lg font-serif text-[#2C3E35] mb-2">Unable to load portrait</h3>
        <p className="text-xs text-[#7A8E85] mb-4 max-w-sm">{error || 'No result data found.'}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-[#2C3E35] text-white text-xs font-medium"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  const analysis = result.analysis || {};
  const anchors = analysis.anchors || {};
  const synthesisAnswers = analysis.synthesis_answers || {};
  const summaryCounts = analysis.anchors_summary || {
    still_true_count: 0,
    changed_count: 0,
    complicated_count: 0
  };

  const getJudgmentBadge = (judgment) => {
    switch (judgment) {
      case 'still_true':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E8EDE9] text-[#2D5A43] border border-[#CDE0D4]">Still true</span>;
      case 'changed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E9EEF4] text-[#2C4E6F] border border-[#CADBE9]">Something changed</span>;
      case 'complicated':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F5EFEB] text-[#82533D] border border-[#EADBCE]">It's complicated</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F0ECE1] text-[#6A665A]">Recorded</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col font-sans overflow-y-auto">
      {/* Header Bar */}
      <div className="w-full max-w-4xl mx-auto px-6 py-4 flex items-center justify-between border-b border-[#EBE7DF] sticky top-0 bg-[#FAF9F6]/95 backdrop-blur-sm z-10">
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
            className="w-7 h-7 object-contain flex-shrink-0" 
          />
          <div>
            <span className="text-xs font-semibold text-[#7A8E85] uppercase tracking-wider block">
              Month 12 · Universal Anchor
            </span>
            <span className="text-sm font-serif font-medium text-[#2C3E35]">
              Year-End Self-Portrait
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#2C3E35] text-[#FAF9F6] text-xs font-medium hover:bg-[#3D5247] transition-colors shadow-sm"
          >
            Done
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-3xl w-full mx-auto p-6 sm:p-10 space-y-12 pb-24">
        {/* Title Header */}
        <div className="text-center max-w-xl mx-auto space-y-3 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF0EE] text-[#4A6A64] text-xs font-medium">
            <Compass className="w-3.5 h-3.5" /> 12-Month Annual Synthesis
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif text-[#2C3E35] tracking-tight">
            Your Year-End Self-Portrait
          </h1>
          <p className="text-sm sm:text-base text-[#5A6E65] leading-relaxed">
            A comprehensive synthesis of 12 months of structured self-inquiry, anchor revisits, and internal transformation.
          </p>
        </div>

        {/* Anchor Distribution Metric Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EBE7DF] text-center shadow-sm">
            <div className="text-2xl sm:text-3xl font-serif font-semibold text-[#2D5A43]">
              {summaryCounts.still_true_count}
            </div>
            <div className="text-xs font-medium text-[#5A6E65] mt-1">Still True</div>
            <div className="text-[11px] text-[#8A9E95] hidden sm:block mt-0.5">Foundational Stability</div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EBE7DF] text-center shadow-sm">
            <div className="text-2xl sm:text-3xl font-serif font-semibold text-[#2C4E6F]">
              {summaryCounts.changed_count}
            </div>
            <div className="text-xs font-medium text-[#5A6E65] mt-1">Changed</div>
            <div className="text-[11px] text-[#8A9E95] hidden sm:block mt-0.5">Meaningful Shifts</div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EBE7DF] text-center shadow-sm">
            <div className="text-2xl sm:text-3xl font-serif font-semibold text-[#82533D]">
              {summaryCounts.complicated_count}
            </div>
            <div className="text-xs font-medium text-[#5A6E65] mt-1">Complicated</div>
            <div className="text-[11px] text-[#8A9E95] hidden sm:block mt-0.5">Evolving Dynamics</div>
          </div>
        </div>

        {/* 3 Core Synthesis Sections */}
        <div className="space-y-8">
          {/* Part 1 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E2DDD0] shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#4A6A64]" />
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4A6A64]">
                Part 1 · Baseline & Stability
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif text-[#2C3E35] mb-4">
              The Ground You Stood On
            </h2>
            <div className="text-[#3D4F46] text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-3 font-serif">
              {analysis.part1_ground || 'Your foundational anchors established the baseline for how you moved through this year.'}
            </div>
          </div>

          {/* Part 2 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E2DDD0] shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#2C4E6F]" />
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#2C4E6F]">
                Part 2 · Awareness & Resistance
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif text-[#2C3E35] mb-4">
              The Shape of the Shift
            </h2>
            <div className="text-[#3D4F46] text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-3 font-serif">
              {analysis.part2_shift || 'Across 12 months, your understanding deepened around recurring behavioral costs and defense patterns.'}
            </div>
          </div>

          {/* Part 3 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E2DDD0] shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#82533D]" />
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#82533D]">
                Part 3 · Forward Horizon
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif text-[#2C3E35] mb-4">
              What Remains in Motion
            </h2>
            <div className="text-[#3D4F46] text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-3 font-serif">
              {analysis.part3_motion || 'Your capacity to examine deeper emotional territory is now active as you look forward.'}
            </div>
          </div>
        </div>

        {/* Prominent Closing Question */}
        <div className="bg-[#2C3E35] text-[#FAF9F6] rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="flex items-center gap-2 text-[#B3C8BF] text-xs font-semibold uppercase tracking-wider mb-2">
            <HelpCircle className="w-4 h-4" /> Closing Inquiry for the Year Ahead
          </div>
          <h3 className="text-lg sm:text-2xl font-serif leading-snug text-[#FAF9F6] my-3">
            {analysis.closing_question || "What is the quietest truth about yourself that you are now ready to live with?"}
          </h3>
          <p className="text-xs sm:text-sm text-[#A0B5AC] leading-relaxed">
            Hold this question lightly. It is not a task to finish, but an orientation for your ongoing practice.
          </p>
        </div>

        {/* Detailed Anchors Accordion */}
        <div className="bg-white rounded-2xl border border-[#EBE7DF] overflow-hidden shadow-sm">
          <button
            onClick={() => setExpandedAnchors(prev => !prev)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#FAF9F6] transition-colors"
          >
            <div>
              <h4 className="text-sm font-semibold text-[#2C3E35]">
                Review 8 Anchor Revisits
              </h4>
              <p className="text-xs text-[#7A8E85]">
                Inspect your individual judgments and notes across all 8 categories
              </p>
            </div>
            {expandedAnchors ? <ChevronUp className="w-5 h-5 text-[#5A6E65]" /> : <ChevronDown className="w-5 h-5 text-[#5A6E65]" />}
          </button>

          {expandedAnchors && (
            <div className="px-6 pb-6 pt-2 space-y-4 border-t border-[#EBE7DF]">
              {YEAR_END_ANCHORS.map(anchor => {
                const resp = anchors[anchor.id] || { judgment: 'still_true', note: '' };
                return (
                  <div key={anchor.id} className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EAE6DD] space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#2C3E35]">
                        {anchor.categoryNumber}. {anchor.title} ({anchor.subtitle})
                      </span>
                      {getJudgmentBadge(resp.judgment)}
                    </div>
                    <p className="text-xs text-[#6A7E75] italic">"{anchor.factPrompt}"</p>
                    {resp.note && (
                      <p className="text-xs sm:text-sm text-[#3D4F46] bg-white p-3 rounded-lg border border-[#E2DDD0]">
                        {resp.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detailed Synthesis Review Accordion */}
        <div className="bg-white rounded-2xl border border-[#EBE7DF] overflow-hidden shadow-sm">
          <button
            onClick={() => setExpandedSynthesis(prev => !prev)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#FAF9F6] transition-colors"
          >
            <div>
              <h4 className="text-sm font-semibold text-[#2C3E35]">
                Review 5 Synthesis Answers & Universal Closer
              </h4>
              <p className="text-xs text-[#7A8E85]">
                Your direct words on starting state, key understanding, resistant patterns, and advice
              </p>
            </div>
            {expandedSynthesis ? <ChevronUp className="w-5 h-5 text-[#5A6E65]" /> : <ChevronDown className="w-5 h-5 text-[#5A6E65]" />}
          </button>

          {expandedSynthesis && (
            <div className="px-6 pb-6 pt-2 space-y-4 border-t border-[#EBE7DF]">
              {analysis.closer_reflection && (
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EAE6DD] space-y-1">
                  <div className="text-xs font-semibold text-[#2C3E35]">
                    Universal Closer: "{UNIVERSAL_CLOSER_QUESTION.prompt}"
                  </div>
                  <p className="text-xs sm:text-sm text-[#3D4F46] bg-white p-3 rounded-lg border border-[#E2DDD0]">
                    {analysis.closer_reflection}
                  </p>
                </div>
              )}
              {SYNTHESIS_QUESTIONS.map(q => {
                const answer = synthesisAnswers[q.id] || '';
                return (
                  <div key={q.id} className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EAE6DD] space-y-1">
                    <div className="text-xs font-semibold text-[#2C3E35]">
                      Question {q.questionNumber}: "{q.prompt}"
                    </div>
                    <p className="text-xs sm:text-sm text-[#3D4F46] bg-white p-3 rounded-lg border border-[#E2DDD0]">
                      {answer || '(No response recorded)'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="text-center pt-4">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-full bg-[#2C3E35] text-[#FAF9F6] hover:bg-[#3D5247] transition-all text-sm font-medium shadow-sm inline-flex items-center gap-2 cursor-pointer"
          >
            Complete & Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
