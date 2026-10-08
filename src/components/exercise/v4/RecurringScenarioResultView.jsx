import React from 'react';
import { Sparkles, ArrowLeft, CheckCircle2, Bookmark, HelpCircle } from 'lucide-react';
import { RECURRING_SCENARIO_PROMPTS } from '../../../lib/exercises/v4/definitions/recurringScenarioCatalog';

export default function RecurringScenarioResultView({ result, onClose }) {
  const resultData = result?.data || result || {};
  const answers = resultData.answers || {};
  const analysis = resultData.analysis || {};

  const getAppearanceBadge = (type) => {
    switch (type) {
      case 'repeatedly':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-950/80 text-amber-300 border border-amber-800">Appears repeatedly in journal entries</span>;
      case 'sometimes':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded bg-stone-800 text-stone-300 border border-stone-700">Appears occasionally in journal entries</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded bg-stone-900 text-stone-400 border border-stone-800">Not explicitly visible in journal entries</span>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-stone-900 text-stone-100 rounded-xl shadow-2xl border border-stone-800 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-4">
        <div className="flex items-center gap-3">
          <img 
            src="/logo-mark-light.png" 
            alt="Ingress Within" 
            className="w-8 h-8 object-contain flex-shrink-0" 
          />
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Month 10 • Day 304 Exercise Result</span>
            <h2 className="text-2xl font-serif font-bold text-stone-100 mt-1">Recurring Scenario Analysis</h2>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-sm transition-colors"
          >
            Close Result
          </button>
        )}
      </div>

      {/* Section 1: Overview & Appearance Badge */}
      <div className="bg-stone-800/60 p-5 rounded-xl border border-stone-700/50 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400">Journal Presence</h3>
          {getAppearanceBadge(analysis.entry_appearance)}
        </div>
        <p className="text-base text-stone-200 leading-relaxed font-serif">
          {analysis.summary_text || "Analysis complete."}
        </p>
      </div>

      {/* Section 2: Strongest Scenario Pattern */}
      {analysis.strongest_pattern && (
        <div className="bg-amber-950/20 border border-amber-800/40 p-5 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Strongest Scenario Pattern</span>
          </div>
          <p className="text-stone-200 text-sm leading-relaxed">
            {analysis.strongest_pattern}
          </p>
        </div>
      )}

      {/* Section 3: The 4 Sentences Mapped */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400">Your Sentence Completions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RECURRING_SCENARIO_PROMPTS.map((p) => {
            const val = answers[p.key] || 'Not answered';
            return (
              <div key={p.key} className="bg-stone-800/40 p-4 rounded-lg border border-stone-800 space-y-1">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">{p.label}</span>
                <p className="text-xs text-stone-400 italic">{p.stem}</p>
                <p className="text-sm text-stone-200 mt-2 font-medium">"{val}"</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Expectation & Behavior Connection */}
      {analysis.expectation_behaviour_connection && (
        <div className="bg-stone-800/40 p-5 rounded-xl border border-stone-800 space-y-2">
          <h4 className="text-sm font-semibold text-amber-300">Expectation & Behavior Connection</h4>
          <p className="text-sm text-stone-300 leading-relaxed">
            {analysis.expectation_behaviour_connection}
          </p>
        </div>
      )}

      {/* Section 5: Unimagined Scenario Analysis */}
      {analysis.unimagined_scenario_analysis && (
        <div className="bg-stone-800/40 p-5 rounded-xl border border-stone-800 space-y-2">
          <h4 className="text-sm font-semibold text-amber-300">Observation on the Unimagined Scenario</h4>
          <p className="text-sm text-stone-300 leading-relaxed">
            {analysis.unimagined_scenario_analysis}
          </p>
        </div>
      )}

      {/* Section 6: One Thing to Notice */}
      {analysis.one_thing_to_notice && (
        <div className="bg-stone-950 p-5 rounded-xl border border-amber-900/40 text-center space-y-2">
          <Bookmark className="w-6 h-6 text-amber-400 mx-auto" />
          <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold block">One Thing to Notice</span>
          <p className="text-stone-200 font-serif italic text-base leading-relaxed">
            "{analysis.one_thing_to_notice}"
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end border-t border-stone-800 pt-4">
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-medium rounded-lg transition-colors"
          >
            Return to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
