import React, { useState } from 'react';
import { BODY_SIGNAL_SYSTEMS, BODY_SIGNAL_QUESTIONS } from '../../../lib/exercises/v4/definitions/month3Catalog';
import BodySignalResultView from './BodySignalResultView';
import { ArrowLeft, RotateCw } from 'lucide-react';

export default function BodySignalFlow({ instance, instanceId, onClose }) {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'checklist' | 'locations' | 'questions' | 'loading' | 'result'
  const [systemSelections, setSystemSelections] = useState({});
  const [activeSignalList, setActiveSignalList] = useState([]);
  const [signalLocIdx, setSignalLocIdx] = useState(0);
  const [locationData, setLocationData] = useState({});
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle signal selection in checklist
  const handleToggleSignal = (systemId, signalId, isPositive) => {
    setSystemSelections(prev => {
      const current = prev[systemId] || [];

      if (isPositive) {
        // Positive selection clears symptoms
        return { ...prev, [systemId]: [signalId] };
      } else {
        // Symptom selection clears positive option
        const filtered = current.filter(id => !id.includes('steady') && !id.includes('positive') && !id.includes('balanced') && !id.includes('relaxed'));
        const hasIt = filtered.includes(signalId);
        const next = hasIt ? filtered.filter(id => id !== signalId) : [...filtered, signalId];
        return { ...prev, [systemId]: next };
      }
    });
  };

  const handleFinishChecklist = () => {
    // Collect all selected non-positive symptom signals across systems
    const list = [];
    BODY_SIGNAL_SYSTEMS.forEach(sys => {
      const selIds = systemSelections[sys.id] || [];
      selIds.forEach(sigId => {
        const sigObj = sys.signals.find(s => s.id === sigId);
        if (sigObj) {
          list.push({ systemId: sys.id, ...sigObj });
        }
      });
    });

    setActiveSignalList(list);

    if (list.length > 0) {
      setSignalLocIdx(0);
      setPhase('locations');
    } else {
      setPhase('questions');
    }
  };

  const currentSignal = activeSignalList[signalLocIdx];
  const currentLocData = currentSignal ? locationData[currentSignal.id] || { zones: [], chips: [], text: '' } : null;

  const handleToggleZone = (zoneName) => {
    if (!currentSignal) return;
    const currentZones = currentLocData.zones || [];
    const nextZones = currentZones.includes(zoneName) ? currentZones.filter(z => z !== zoneName) : [...currentZones, zoneName];
    const autoText = nextZones.length > 0 ? `I feel it in ${nextZones.join(', ')}` : '';

    setLocationData(prev => ({
      ...prev,
      [currentSignal.id]: { ...prev[currentSignal.id], zones: nextZones, text: autoText }
    }));
  };

  const handleToggleChip = (chipText) => {
    if (!currentSignal) return;
    const currentChips = currentLocData.chips || [];
    const nextChips = currentChips.includes(chipText) ? currentChips.filter(c => c !== chipText) : [...currentChips, chipText];
    const autoText = nextChips.length > 0 ? `Noticed ${nextChips.join(', ')}` : '';

    setLocationData(prev => ({
      ...prev,
      [currentSignal.id]: { ...prev[currentSignal.id], chips: nextChips, text: autoText }
    }));
  };

  const handleNextLocation = () => {
    if (signalLocIdx < activeSignalList.length - 1) {
      setSignalLocIdx(prev => prev + 1);
    } else {
      setPhase('questions');
    }
  };

  const isQValid = answers.q1.trim().length >= 3 && answers.q2.trim().length >= 3;

  const handleFinalSubmit = async () => {
    if (isSubmitting || !isQValid) return;
    setIsSubmitting(true);
    setPhase('loading');

    // Build raw_selections object
    const rawSelections = {};
    BODY_SIGNAL_SYSTEMS.forEach(sys => {
      const selIds = systemSelections[sys.id] || [sys.positiveOption];
      if (selIds.length === 1 && selIds[0].includes('steady')) {
        rawSelections[sys.id] = sys.positiveOption;
      } else {
        const labels = selIds.map(id => {
          const sig = sys.signals.find(s => s.id === id);
          return sig ? sig.label : id;
        });
        rawSelections[sys.id] = labels.length === 1 ? labels[0] : labels;
      }
    });

    const targetInstanceId = instance?.id || instanceId;

    try {
      await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: targetInstanceId,
          exercise_id: 'body_signal_inventory',
          raw_selections: rawSelections,
          location_data: locationData,
          q1: answers.q1.trim(),
          q2: answers.q2.trim(),
          q3: answers.q3.trim()
        })
      });
    } catch (err) {
      console.error('[BodySignalFlow] Submission error:', err);
    } finally {
      setIsSubmitting(false);
      setPhase('result');
    }
  };

  if (phase === 'result') {
    return <BodySignalResultView instanceId={instance?.id || instanceId} onClose={onClose} />;
  }

  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <RotateCw className="w-6 h-6 animate-spin text-[#4A6A64] mb-3 opacity-70" />
        <p className="font-serif italic text-base text-[#4A6A64]">
          Processing your Body Signal Inventory...
        </p>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col justify-between p-6 md:p-12 font-sans overflow-y-auto">
        <div className="max-w-[540px] mx-auto w-full pt-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/logo-mark-transparent.png" 
                alt="Ingress Within" 
                className="w-5 h-5 object-contain" 
              />
              <span className="font-serif font-semibold text-xs text-[#1E2A2E]">ingress <em className="text-[#8DBFB4] not-italic">within</em></span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 transition-colors rounded-full hover:bg-stone-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 pt-4">
            <span className="text-xs uppercase tracking-widest text-[#4A6A64] font-semibold">
              Month 3 • Exercise 6C
            </span>
            <h1 className="text-3xl font-serif text-stone-900 tracking-tight">
              Body Signal Inventory
            </h1>
            <p className="text-base text-stone-600 leading-relaxed font-light">
              Surface physical and somatic signals as emotional data across 6 body systems.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-3 text-sm text-stone-600 leading-relaxed">
            <p>
              Select the physical signals you've been noticing across body systems, indicate where or when they show up, and complete 3 short reflection sentences.
            </p>
            <p className="text-xs text-stone-400">
              Estimated duration: 6–10 minutes
            </p>
          </div>
        </div>

        <div className="max-w-[540px] mx-auto w-full pb-8">
          <button
            onClick={() => setPhase('checklist')}
            className="w-full py-4 rounded-2xl bg-[#1E2A2E] text-white text-sm font-semibold hover:bg-[#1E2A2E]/90 transition-all cursor-pointer shadow-sm"
          >
            Begin Inventory
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'checklist') {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col justify-between p-6 md:p-12 font-sans overflow-y-auto">
        <div className="max-w-[640px] mx-auto w-full pt-4 space-y-8">
          <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
            <span>Body Systems Checklist</span>
            <button onClick={onClose} className="hover:text-stone-700">Exit</button>
          </div>

          <div className="space-y-6">
            {BODY_SIGNAL_SYSTEMS.map(sys => {
              const selectedIds = systemSelections[sys.id] || [];
              const isPosSelected = selectedIds.includes(sys.positiveOption);

              return (
                <div key={sys.id} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
                  <h3 className="text-base font-serif font-semibold text-stone-900">{sys.name}</h3>
                  <div className="space-y-2">
                    {/* Positive Option */}
                    <button
                      onClick={() => handleToggleSignal(sys.id, sys.positiveOption, true)}
                      className={`w-full text-left p-3 rounded-xl text-xs font-medium transition-all ${
                        isPosSelected
                          ? 'bg-[#4A6A64]/10 border border-[#4A6A64] text-[#4A6A64]'
                          : 'bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      ✓ {sys.positiveOption}
                    </button>

                    {/* Symptom Options */}
                    {sys.signals.map(sig => {
                      const isSelected = selectedIds.includes(sig.id);
                      return (
                        <button
                          key={sig.id}
                          onClick={() => handleToggleSignal(sys.id, sig.id, false)}
                          className={`w-full text-left p-3 rounded-xl text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-[#1E2A2E] text-white border border-[#1E2A2E]'
                              : 'bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}{sig.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-w-[640px] mx-auto w-full pt-6 pb-8">
          <button
            onClick={handleFinishChecklist}
            className="w-full py-4 rounded-2xl bg-[#1E2A2E] text-white text-sm font-semibold hover:bg-[#1E2A2E]/90 transition-all cursor-pointer shadow-sm"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'locations' && currentSignal) {
    const isSpatial = currentSignal.type === 'spatial';

    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col justify-between p-6 md:p-12 font-sans overflow-y-auto">
        <div className="max-w-[540px] mx-auto w-full pt-4 space-y-6">
          <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
            <span>Signal {signalLocIdx + 1} of {activeSignalList.length}</span>
            <button onClick={handleNextLocation} className="hover:text-stone-700">Skip</button>
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#4A6A64] font-semibold">
              {currentSignal.systemId.toUpperCase()}
            </span>
            <h2 className="text-xl font-serif text-stone-900">{currentSignal.label}</h2>
            <p className="text-xs text-stone-500">
              {isSpatial ? 'Tap where you feel this in your body:' : 'Select when or in what context this shows up:'}
            </p>
          </div>

          {isSpatial ? (
            /* Spatial 11-Zone Body Diagram Selector */
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['Head / Temples', 'Jaw', 'Neck', 'Shoulders', 'Chest', 'Stomach', 'Lower Back', 'Arms', 'Legs'].map(zone => {
                  const isSel = (currentLocData?.zones || []).includes(zone);
                  return (
                    <button
                      key={zone}
                      onClick={() => handleToggleZone(zone)}
                      className={`p-3 rounded-xl text-xs font-medium border transition-all ${
                        isSel
                          ? 'bg-[#1E2A2E] text-white border-[#1E2A2E]'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {isSel ? '✓ ' : ''}{zone}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Temporal Chips Selector */
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-3">
              <div className="flex flex-wrap gap-2">
                {(currentSignal.chips || ['Morning', 'Evening', 'During stress', 'At work']).map(chip => {
                  const isSel = (currentLocData?.chips || []).includes(chip);
                  return (
                    <button
                      key={chip}
                      onClick={() => handleToggleChip(chip)}
                      className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                        isSel
                          ? 'bg-[#1E2A2E] text-white border-[#1E2A2E]'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {isSel ? '✓ ' : ''}{chip}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="max-w-[540px] mx-auto w-full pb-8">
          <button
            onClick={handleNextLocation}
            className="w-full py-4 rounded-2xl bg-[#1E2A2E] text-white text-sm font-semibold hover:bg-[#1E2A2E]/90 transition-all cursor-pointer shadow-sm"
          >
            {signalLocIdx < activeSignalList.length - 1 ? 'Next Signal' : 'Proceed to Questions'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col justify-between p-6 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-[620px] mx-auto w-full pt-4 space-y-6">
        <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
          <span>Sentence Completions</span>
          <button onClick={onClose} className="hover:text-stone-700">Exit</button>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-[#4A6A64]">{BODY_SIGNAL_QUESTIONS[0].stem}</span>
            <input
              type="text"
              value={answers.q1}
              onChange={(e) => setAnswers(prev => ({ ...prev, q1: e.target.value }))}
              placeholder="Finish the sentence..."
              className="w-full bg-stone-50 rounded-xl p-3 border border-stone-200 text-stone-900 text-sm focus:outline-none focus:border-[#4A6A64]"
            />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-[#4A6A64]">{BODY_SIGNAL_QUESTIONS[1].stem}</span>
            <input
              type="text"
              value={answers.q2}
              onChange={(e) => setAnswers(prev => ({ ...prev, q2: e.target.value }))}
              placeholder="Finish the sentence..."
              className="w-full bg-stone-50 rounded-xl p-3 border border-stone-200 text-stone-900 text-sm focus:outline-none focus:border-[#4A6A64]"
            />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-[#4A6A64]">{BODY_SIGNAL_QUESTIONS[2].stem}</span>
            <input
              type="text"
              value={answers.q3}
              onChange={(e) => setAnswers(prev => ({ ...prev, q3: e.target.value }))}
              placeholder="Finish the sentence (optional)..."
              className="w-full bg-stone-50 rounded-xl p-3 border border-stone-200 text-stone-900 text-sm focus:outline-none focus:border-[#4A6A64]"
            />
            <p className="text-xs text-stone-400 italic">I haven't connected it to anything is a complete answer.</p>
          </div>
        </div>
      </div>

      <div className="max-w-[620px] mx-auto w-full pb-8">
        <button
          onClick={handleFinalSubmit}
          disabled={!isQValid || isSubmitting}
          className={`w-full py-4 rounded-2xl text-sm font-semibold transition-all cursor-pointer shadow-sm ${
            isQValid && !isSubmitting
              ? 'bg-[#1E2A2E] text-white hover:bg-[#1E2A2E]/90'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          Complete Inventory
        </button>
      </div>
    </div>
  );
}
