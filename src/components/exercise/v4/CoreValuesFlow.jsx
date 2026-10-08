import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CORE_VALUES_ITEMS,
  calculateReorderDelta,
  ValueItem
} from '../../../lib/exercises/v4/definitions/coreValuesCatalog';
import CoreValuesDefinitionModal from './CoreValuesDefinitionModal';
import CoreValuesResultView from './CoreValuesResultView';
import { ArrowLeft, GripVertical, ChevronUp, ChevronDown, Check, Info } from 'lucide-react';

export default function CoreValuesFlow({ instanceId, onClose, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [instance, setInstance] = useState(null);
  const [phase, setPhase] = useState('intro'); // 'intro' | 'select' | 'rank' | 'loading' | 'result'
  
  // Selection state
  const [selectionOrder, setSelectionOrder] = useState([]); // array of 0..5 value names in tap order
  const [hasReturnedFromRank, setHasReturnedFromRank] = useState(false);
  
  // Ranking state (array of 5 value names in final rank order 1..5)
  const [rankedValues, setRankedValues] = useState([]);

  // UI state for 6th item pulse warning
  const [pulsingValue, setPulsingValue] = useState(null);
  const [warningMessage, setWarningMessage] = useState(null);
  const warningTimer = useRef(null);

  // Definition modal state
  const [activeDefinitionItem, setActiveDefinitionItem] = useState(null);

  // HTML5 Drag state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    initializeFlow();
    return () => {
      if (warningTimer.current) clearTimeout(warningTimer.current);
    };
  }, [instanceId]);

  const initializeFlow = async () => {
    setLoading(true);
    try {
      // Check existing instance & results if resuming
      let currentInst = null;
      if (instanceId) {
        const resumeRes = await fetch(`/api/exercises/current?instance_id=${instanceId}`);
        if (resumeRes.ok) {
          const data = await resumeRes.json();
          currentInst = data.instance;
        }
      }

      if (!currentInst) {
        const startRes = await fetch('/api/exercises/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exercise_id: 'core_values_card_sort' })
        });
        if (startRes.ok) {
          const data = await startRes.json();
          currentInst = data.instance;
        }
      }

      setInstance(currentInst);

      if (currentInst?.status === 'completed') {
        setPhase('result');
      }
    } catch (err) {
      console.error('[CoreValuesFlow] Init error:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- SELECTION LOGIC (Phase 1) ---
  const handleCardClick = (valueName) => {
    const isSelected = selectionOrder.includes(valueName);

    if (isSelected) {
      // Deselect card -> remove from selectionOrder
      setSelectionOrder(prev => prev.filter(v => v !== valueName));
    } else {
      // Check if 5 already selected
      if (selectionOrder.length >= 5) {
        // 6th selection behavior: DO NOT select. Pulse card & show inline warning.
        setPulsingValue(valueName);
        setWarningMessage('Deselect one to choose this instead');

        if (warningTimer.current) clearTimeout(warningTimer.current);
        warningTimer.current = setTimeout(() => {
          setPulsingValue(null);
          setWarningMessage(null);
        }, 2000);
        return;
      }

      // If returning through "Change selection", restart selection order on first tap
      if (hasReturnedFromRank) {
        setHasReturnedFromRank(false);
        setSelectionOrder([valueName]);
      } else {
        // Select card -> append to end of selectionOrder
        setSelectionOrder(prev => [...prev, valueName]);
      }
    }
  };

  const handleProceedToRank = () => {
    if (selectionOrder.length !== 5) return;
    // Initial ranking MUST equal selectionOrder
    setRankedValues([...selectionOrder]);
    setPhase('rank');
  };

  const handleBackToSelect = () => {
    // "Change selection" returns user to Phase 1 preserving current 5 selected values,
    // but flagging that selection_order will restart on next tap
    setHasReturnedFromRank(true);
    setPhase('select');
  };

  // --- REORDER LOGIC (Phase 2 Drag & Drop + Keyboard) ---
  const moveRankedItem = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= rankedValues.length) return;
    const updated = [...rankedValues];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setRankedValues(updated);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      moveRankedItem(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // --- CONFIRM SUBMISSION ---
  const handleConfirmRanking = async () => {
    if (rankedValues.length !== 5) return;

    setPhase('loading');

    const reorderDelta = calculateReorderDelta(selectionOrder, rankedValues);
    const targetInstanceId = instance?.id || instanceId;

    try {
      const res = await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: targetInstanceId,
          exercise_id: 'core_values_card_sort',
          selected_values: rankedValues,
          selection_order: selectionOrder,
          reorder_delta: reorderDelta
        })
      });

      if (!res.ok) {
        console.warn('[CoreValuesFlow] Submit response not ok, checking fallback...');
      }
    } catch (err) {
      console.error('[CoreValuesFlow] Submission error:', err);
    } finally {
      // Transition to result phase
      setPhase('result');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0] flex items-center justify-center font-serif italic text-[18px] text-[#4A6A64] animate-pulse">
        Loading values exercise...
      </div>
    );
  }

  // --- RESULT PHASE ---
  if (phase === 'result') {
    return (
      <CoreValuesResultView
        instanceId={instance?.id || instanceId}
        onClose={() => {
          if (onComplete) onComplete();
          if (onClose) onClose();
        }}
      />
    );
  }

  // --- LOADING PHASE ---
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] text-[#1E2A2E] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-[360px] space-y-4">
          <p className="font-serif italic text-xl md:text-2xl text-[#1E2A2E] leading-relaxed">
            Looking at what you chose.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] text-[#1E2A2E] font-sans overflow-y-auto flex flex-col justify-between">
      {/* Definition Modal */}
      {activeDefinitionItem && (
        <CoreValuesDefinitionModal
          valueItem={activeDefinitionItem}
          onClose={() => setActiveDefinitionItem(null)}
        />
      )}

      <div className="w-full max-w-[480px] mx-auto min-h-screen flex flex-col justify-between p-6 sm:p-8">
        
        {/* --- PHASE 1 INTRO --- */}
        {phase === 'intro' && (
          <div className="flex flex-col justify-between min-h-[calc(100vh-4rem)]">
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-2">
                <img 
                  src="/logo-mark-transparent.png" 
                  alt="Ingress Within" 
                  className="w-5 h-5 object-contain" 
                />
                <span className="font-serif font-semibold text-xs text-[#1E2A2E]">ingress <em className="text-[#8DBFB4] not-italic">within</em></span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] block">
                Phase 1 of 2
              </span>
              <h1 className="font-serif text-3xl md:text-4xl text-primary font-normal">
                What Matters Most
              </h1>
              <p className="text-sm md:text-base text-[#1E2A2E]/80 leading-relaxed">
                You'll see 20 values. Pick the 5 that feel most important to you — not the ones you think should be, the ones that actually are. Then you'll put them in order. There's no right answer. Go with your first instinct.
              </p>
            </div>

            <div className="pt-8">
              <button
                onClick={() => setPhase('select')}
                className="w-full py-4 rounded-2xl bg-[#1E2A2E] text-white text-xs font-semibold hover:bg-[#1E2A2E]/90 transition-colors shadow-sm cursor-pointer"
              >
                Begin
              </button>
            </div>
          </div>
        )}

        {/* --- PHASE 1 SELECTION GRID --- */}
        {phase === 'select' && (
          <div className="flex flex-col justify-between min-h-[calc(100vh-4rem)]">
            <div>
              {/* Header & Counter */}
              <div className="flex items-center justify-between border-b border-[#1E2A2E]/10 pb-4 mb-6">
                <div>
                  <h2 className="font-serif text-xl text-primary font-normal">
                    Select 5 Values
                  </h2>
                  <p className="text-xs text-mid mt-0.5">
                    {selectionOrder.length === 5 ? (
                      <span className="text-emerald-700 font-medium">5 of 5 — ready to rank</span>
                    ) : (
                      <span>{selectionOrder.length} of 5 selected</span>
                    )}
                  </p>
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-1.5 text-mid hover:text-primary rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Inline Warning Banner for 6th Selection Attempt */}
              <AnimatePresence>
                {warningMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium text-center"
                  >
                    {warningMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 2-Column Responsive Grid */}
              <div className="grid grid-cols-2 gap-3 pb-24">
                {CORE_VALUES_ITEMS.map((item) => {
                  const isSelected = selectionOrder.includes(item.name);
                  const isPulsing = pulsingValue === item.name;

                  return (
                    <div
                      key={item.id}
                      className={`relative group rounded-2xl border transition-all duration-200 ${
                        isSelected
                          ? 'bg-[#1E2A2E] border-[#1E2A2E] text-white shadow-sm'
                          : 'bg-white border-line hover:border-primary/40 text-[#1E2A2E]'
                      } ${isPulsing ? 'animate-bounce border-amber-500 ring-2 ring-amber-300' : ''}`}
                    >
                      {/* Primary selection tap target */}
                      <button
                        onClick={() => handleCardClick(item.name)}
                        className="w-full text-left p-4 pt-4 pb-8 h-full flex flex-col justify-between cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-serif text-base ${isSelected ? 'text-white' : 'text-primary'}`}>
                            {item.name}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-emerald-400 text-[#1E2A2E] flex items-center justify-center text-[10px] font-bold">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Secondary "What does this mean?" trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDefinitionItem(item);
                        }}
                        className={`absolute bottom-2 left-4 text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                          isSelected ? 'text-[#8DBFB4] hover:text-white' : 'text-[#4A6A64] hover:text-primary'
                        }`}
                        title="View definition"
                      >
                        <Info className="w-3 h-3" />
                        <span>What does this mean?</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sticky Next Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-[#FAF9F6]/90 backdrop-blur-md border-t border-[#1E2A2E]/10 z-30">
              <div className="max-w-[480px] mx-auto">
                <button
                  disabled={selectionOrder.length !== 5}
                  onClick={handleProceedToRank}
                  className={`w-full py-4 rounded-2xl text-xs font-semibold transition-colors shadow-sm cursor-pointer ${
                    selectionOrder.length === 5
                      ? 'bg-[#1E2A2E] text-white hover:bg-[#1E2A2E]/90'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Rank these 5
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- PHASE 2 RANKING (DRAG & DROP) --- */}
        {phase === 'rank' && (
          <div className="flex flex-col justify-between min-h-[calc(100vh-4rem)]">
            <div>
              {/* Eyebrow & Header */}
              <div className="border-b border-[#1E2A2E]/10 pb-4 mb-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4]">
                    Rank your 5
                  </span>
                  <h2 className="font-serif text-2xl text-primary font-normal mt-0.5">
                    Order of Importance
                  </h2>
                  <p className="text-xs text-mid mt-1">
                    Drag to reorder. 1 is most important.
                  </p>
                </div>

                {/* Change selection link */}
                <button
                  onClick={handleBackToSelect}
                  className="text-xs font-medium text-[#4A6A64] hover:text-primary underline cursor-pointer"
                >
                  Change selection
                </button>
              </div>

              {/* Vertical Drag & Drop List */}
              <div className="space-y-3 pb-24">
                {rankedValues.map((val, idx) => {
                  const isDragging = draggedIndex === idx;
                  const isDragOver = dragOverIndex === idx;

                  return (
                    <div
                      key={val}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center justify-between p-4 rounded-2xl bg-white border transition-all ${
                        isDragging
                          ? 'opacity-40 border-dashed border-[#8DBFB4]'
                          : isDragOver
                          ? 'border-[#1E2A2E] ring-2 ring-[#8DBFB4]/30 shadow-md'
                          : 'border-line hover:border-primary/30 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Drag Handle */}
                        <div className="cursor-grab active:cursor-grabbing text-[#8DBFB4] hover:text-primary">
                          <GripVertical className="w-5 h-5" />
                        </div>

                        {/* Rank 1-indexed Number */}
                        <span className="font-mono text-sm font-bold text-[#4A6A64] w-6">
                          {idx + 1}.
                        </span>

                        {/* Value Name */}
                        <span className="font-serif text-base text-primary font-medium">
                          {val}
                        </span>
                      </div>

                      {/* Keyboard Accessible Up/Down Fallback Controls */}
                      <div className="flex items-center gap-1">
                        <button
                          disabled={idx === 0}
                          onClick={() => moveRankedItem(idx, idx - 1)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            idx === 0
                              ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                              : 'text-mid hover:text-primary hover:bg-black/5 border-line cursor-pointer'
                          }`}
                          aria-label={`Move ${val} up`}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          disabled={idx === rankedValues.length - 1}
                          onClick={() => moveRankedItem(idx, idx + 1)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            idx === rankedValues.length - 1
                              ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                              : 'text-mid hover:text-primary hover:bg-black/5 border-line cursor-pointer'
                          }`}
                          aria-label={`Move ${val} down`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sticky Confirm Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-[#FAF9F6]/90 backdrop-blur-md border-t border-[#1E2A2E]/10 z-30">
              <div className="max-w-[480px] mx-auto">
                <button
                  onClick={handleConfirmRanking}
                  className="w-full py-4 rounded-2xl bg-[#1E2A2E] text-white text-xs font-semibold hover:bg-[#1E2A2E]/90 transition-colors shadow-sm cursor-pointer"
                >
                  Confirm ranking
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
