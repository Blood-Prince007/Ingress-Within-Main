import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Heart, ArrowLeft, CheckCircle, Play, ShieldAlert, Sparkles, Filter, RotateCcw, X, PhoneCall } from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';
import Footer from '../components/Footer';
import { InterventionPlayer } from '../components/interventions/player/InterventionPlayer';
import SearchInput from '../components/search/SearchInput';
import HighlightText from '../components/search/HighlightText';

export default function InterventionsPage() {
  const [categories, setCategories] = useState([]);
  const [crisisResources, setCrisisResources] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [durationFilter, setDurationFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Player mode state
  const [playerInterventionId, setPlayerInterventionId] = useState(null);
  const [playerSessionId, setPlayerSessionId] = useState(null);

  // Active technique details & step-through practice mode
  const [activeIntervention, setActiveIntervention] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepResponses, setStepResponses] = useState({});
  const [isFinished, setIsFinished] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // View modes: 'grid' | 'detail' | 'history'
  const [viewMode, setViewMode] = useState('grid');
  const [history, setHistory] = useState([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [showCrisisModal, setShowCrisisModal] = useState(false);

  // Load Categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Debounced Catalog fetch when filters or search change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalog();
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedCategory, durationFilter, searchQuery]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/interventions/categories');
      const json = await res.json();
      if (json.success) {
        setCategories(json.data.categories);
        setCrisisResources(json.data.crisis_resources);
      }
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  };

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (selectedCategory) params.append('category', selectedCategory);
      if (durationFilter) params.append('max_duration', durationFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/interventions?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setInterventions(json.data);
      }
    } catch (e) {
      console.error('Failed to load catalog:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/interventions/history');
      const json = await res.json();
      if (json.success) {
        setHistory(json.data);
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  };

  const openInterventionDetail = (item) => {
    if (item && (item.id || item.slug)) {
      setPlayerInterventionId(item.id || item.slug);
    }
  };

  const handleStartPractice = () => {
    if (activeIntervention) {
      setPlayerInterventionId(activeIntervention.id);
    }
  };

  const handleNextStep = async () => {
    if (!activeIntervention || !activeSession) return;
    const stepsCount = activeIntervention.steps?.length || 1;

    if (currentStep < stepsCount - 1) {
      const nextPos = currentStep + 1;
      setCurrentStep(nextPos);
      await fetch('/api/interventions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession.id,
          last_position: nextPos,
        }),
      }).catch(() => { });
    } else {
      // Finish technique
      try {
        await fetch('/api/interventions/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: activeSession.id,
            elapsed_seconds: activeIntervention.duration_minutes * 60,
            responses: stepResponses,
          }),
        });
        setIsFinished(true);
      } catch (e) {
        console.error('Error completing session:', e);
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (!activeIntervention) return;
    try {
      const res = await fetch('/api/interventions/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervention_id: activeIntervention.id, action: 'toggle' }),
      });
      const json = await res.json();
      if (json.success) {
        setIsFavorite(json.data.is_favorite);
      }
    } catch (e) {
      console.error('Error toggling favorite:', e);
    }
  };

  if (playerInterventionId || playerSessionId) {
    return (
      <InterventionPlayer
        interventionId={playerInterventionId}
        sessionId={playerSessionId}
        onBack={() => {
          setPlayerInterventionId(null);
          setPlayerSessionId(null);
        }}
        onComplete={() => {
          setPlayerInterventionId(null);
          setPlayerSessionId(null);
          fetchHistory();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans flex flex-col justify-between pb-20 sm:pb-24">
      <div>
        <DashboardNavbar activeTab="interventions" />

        <main className="max-w-[1140px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-secondary mb-1">
                Evidence-Based Self-Help Bank ·
              </div>
              <h1 className="font-serif text-3xl md:text-4xl text-primary font-normal">
                Intervention Bank
              </h1>
              <p className="text-mid text-sm font-light mt-1 max-w-xl">
                35 structured self-help techniques across 12 mental health categories — breathing, grounding, CBT, and behavioral tools.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setViewMode(viewMode === 'history' ? 'grid' : 'history');
                  if (viewMode !== 'history') fetchHistory();
                }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${viewMode === 'history'
                  ? 'bg-accent text-white border-accent shadow-xs'
                  : 'bg-white-paper border-primary/10 text-mid hover:border-primary/30'
                  }`}
              >
                {viewMode === 'history' ? 'Back to Catalog' : 'My History'}
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          {viewMode === 'grid' && (
            <div className="bg-white-paper/90 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-primary/10 shadow-xs mb-6 sm:mb-8 space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                  <SearchInput
                    id="interventions-search"
                    placeholder="Search techniques — sleep, anxiety, panic, exams, anger..."
                    ariaLabel="Search techniques and practices"
                    value={searchQuery}
                    onChange={(val) => setSearchQuery(val)}
                    onClear={() => setSearchQuery('')}
                    isLoading={loading}
                    resultCount={searchQuery ? interventions.length : null}
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <select
                    value={durationFilter}
                    onChange={(e) => setDurationFilter(e.target.value)}
                    className="py-2.5 px-3 bg-mint-grey/50 rounded-lg border border-primary/10 text-xs font-medium text-primary focus:outline-none focus:border-secondary cursor-pointer"
                  >
                    <option value="">Any Duration</option>
                    <option value="5">&le; 5 minutes</option>
                    <option value="10">&le; 10 minutes</option>
                    <option value="20">&le; 20 minutes</option>
                  </select>

                  {(selectedCategory || durationFilter || searchQuery) && (
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        setDurationFilter('');
                        setSearchQuery('');
                      }}
                      className="px-3 py-2 text-xs font-medium text-accent hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={13} /> Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${selectedCategory === null
                    ? 'bg-accent text-white font-semibold shadow-xs'
                    : 'bg-warm-paper text-mid hover:bg-warm-paper/80 hover:text-primary border border-primary/5'
                    }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                    className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${selectedCategory === cat.id
                      ? 'bg-accent text-white font-semibold shadow-xs'
                      : cat.is_crisis
                        ? 'bg-supporting/25 text-primary hover:bg-supporting/35 font-semibold'
                        : 'bg-warm-paper text-mid hover:bg-warm-paper/80 hover:text-primary border border-primary/5'
                      }`}
                  >
                    {cat.name || cat.label || cat.id} ({cat.technique_count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CATALOG GRID VIEW */}
          {viewMode === 'grid' && (
            loading ? (
              <div className="py-16 text-center text-mid font-serif italic text-sm">
                Loading interventions catalog...
              </div>
            ) : interventions.length === 0 ? (
              <div className="py-16 text-center text-mid font-sans text-sm bg-white/60 rounded-xl border border-primary/5 space-y-2">
                <p>No techniques match your criteria{searchQuery ? ` for "${searchQuery}"` : ''}.</p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                      setDurationFilter('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-[#654652] transition-colors cursor-pointer border-none"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search result active indicator */}
                {searchQuery && (
                  <div className="flex items-center justify-between text-xs text-mid/90 bg-accent/5 border border-accent/15 rounded-xl px-3.5 py-2">
                    <span>
                      Showing <strong className="text-primary font-semibold">{interventions.length}</strong> {interventions.length === 1 ? 'technique' : 'techniques'} found for &ldquo;<strong className="text-accent font-semibold">{searchQuery}</strong>&rdquo;
                    </span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-accent hover:underline font-semibold text-[11px] cursor-pointer"
                    >
                      Clear search
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {interventions.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -3 }}
                      onClick={() => openInterventionDetail(item)}
                      className={`bg-white rounded-xl p-5 border border-primary/8 shadow-xs hover:border-secondary transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${item.category === 'crisis_safety' ? 'border-l-4 border-l-accent' : 'border-l-4 border-l-secondary'
                        }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                            <HighlightText text={item.category.replace(/_/g, ' ')} query={searchQuery} />
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-mid font-mono bg-mint-grey px-2 py-0.5 rounded">
                            <Clock size={11} /> {item.duration_minutes || item.estimated_duration || item.duration || 5}m
                          </div>
                        </div>

                        <h3 className="font-serif text-xl text-primary font-normal italic mb-2 group-hover:text-secondary-dark transition-colors">
                          <HighlightText text={item.title} query={searchQuery} />
                        </h3>

                        <p className="text-mid text-xs leading-relaxed line-clamp-3 mb-4 font-light">
                          <HighlightText text={item.description || item.short_description} query={searchQuery} />
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-primary/5">
                        <div className="flex gap-1.5 flex-wrap">
                          {item.tags?.slice(0, 2).map((t, idx) => (
                            <span key={idx} className="text-[9px] bg-mint-grey text-mid px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
                              <HighlightText text={t} query={searchQuery} />
                            </span>
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Practice &rarr;
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* DETAIL & PRACTICE STEP-THROUGH VIEW */}
          {viewMode === 'detail' && activeIntervention && (
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-primary/10 shadow-sm max-w-3xl mx-auto">
              <button
                onClick={() => setViewMode('grid')}
                className="text-xs font-semibold text-mid hover:text-primary flex items-center gap-1.5 mb-6 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Catalog
              </button>

              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-secondary mb-1">
                    {activeIntervention.category.replace(/_/g, ' ')} · {activeIntervention.duration_minutes} Minutes
                  </div>
                  <h2 className="font-serif text-2xl md:text-3xl text-primary font-normal">
                    {activeIntervention.title}
                  </h2>
                </div>

                <button
                  onClick={handleToggleFavorite}
                  className={`p-2.5 rounded-full border transition-all cursor-pointer ${isFavorite
                    ? 'bg-accent/20 border-accent text-[#8a3020]'
                    : 'bg-mint-grey border-primary/10 text-mid hover:text-primary'
                    }`}
                  title={isFavorite ? 'Unfavorite' : 'Favorite'}
                >
                  <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>

              <p className="text-mid text-sm leading-relaxed mb-6 font-light">
                {activeIntervention.description}
              </p>

              {!activeSession && !isFinished && (
                <div className="bg-mint-grey/60 rounded-xl p-6 border border-primary/5 text-center space-y-4">
                  <p className="text-xs text-mid uppercase tracking-wider font-semibold">
                    Interactive Guided Session
                  </p>
                  <button
                    onClick={handleStartPractice}
                    className="px-6 py-3 bg-primary text-white rounded-lg font-semibold text-xs uppercase tracking-wider hover:bg-[#2A3A3E] transition-all cursor-pointer shadow-xs inline-flex items-center gap-2"
                  >
                    <Play size={14} /> Begin Technique ({activeIntervention.steps?.length || 1} Steps)
                  </button>
                </div>
              )}

              {/* Step-by-Step Interactive Practice */}
              {activeSession && !isFinished && activeIntervention.steps && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between text-xs font-semibold text-mid border-b border-primary/10 pb-3">
                    <span>Step {currentStep + 1} of {activeIntervention.steps.length}</span>
                    <div className="flex gap-1.5">
                      {activeIntervention.steps.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 rounded-full transition-all ${idx === currentStep
                            ? 'w-6 bg-secondary'
                            : idx < currentStep
                              ? 'w-3 bg-primary'
                              : 'w-3 bg-primary/10'
                            }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="min-h-[100px] flex items-center justify-center p-6 bg-mint-grey/40 rounded-xl border border-primary/5">
                    <p className="font-serif text-lg md:text-xl text-primary text-center leading-relaxed">
                      {activeIntervention.steps[currentStep]}
                    </p>
                  </div>

                  {/* Reflection Box if step accepts user response */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-mid">Your notes / reflection (optional):</label>
                    <textarea
                      rows={2}
                      value={stepResponses[currentStep] || ''}
                      onChange={(e) => setStepResponses({ ...stepResponses, [currentStep]: e.target.value })}
                      placeholder="Write any thoughts, observations, or ratings for this step..."
                      className="w-full p-3 bg-mint-grey/50 rounded-lg border border-primary/10 text-xs text-primary focus:outline-none focus:border-secondary"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <button
                      disabled={currentStep === 0}
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      className="px-4 py-2 border border-primary/10 rounded-lg text-xs font-semibold text-mid disabled:opacity-30 disabled:cursor-not-allowed hover:bg-mint-grey cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="px-6 py-2 bg-primary text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#2A3A3E] cursor-pointer"
                    >
                      {currentStep === activeIntervention.steps.length - 1 ? 'Finish Technique' : 'Next Step'}
                    </button>
                  </div>
                </div>
              )}

              {/* Completion Screen */}
              {isFinished && (
                <div className="bg-mint-grey/80 rounded-xl p-6 border border-secondary/30 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 text-secondary flex items-center justify-center mx-auto">
                    <CheckCircle size={24} />
                  </div>
                  <h3 className="font-serif text-xl text-primary font-normal">Session Completed</h3>
                  <p className="text-xs text-mid max-w-md mx-auto">
                    Great work taking time for your mental wellbeing. Your session has been recorded to your private history log.
                  </p>

                  {activeIntervention.cultural_note && (
                    <div className="bg-white p-4 rounded-lg text-left border-l-2 border-supporting text-xs text-mid font-light leading-relaxed">
                      <strong>Cultural Reflection:</strong> {activeIntervention.cultural_note}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setActiveSession(null);
                      setIsFinished(false);
                      setViewMode('grid');
                    }}
                    className="px-6 py-2.5 bg-primary text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#2A3A3E] cursor-pointer"
                  >
                    Return to Catalog
                  </button>
                </div>
              )}
            </div>
          )}

          {/* HISTORY VIEW */}
          {viewMode === 'history' && (
            <div className="bg-white rounded-xl p-6 border border-primary/10 shadow-xs max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                <h2 className="font-serif text-2xl text-primary">Your Practice History</h2>
                <button
                  onClick={() => setViewMode('grid')}
                  className="text-xs font-semibold text-mid hover:text-primary cursor-pointer"
                >
                  &larr; Back to Catalog
                </button>
              </div>

              {history.length === 0 ? (
                <div className="py-12 text-center text-mid text-sm italic font-serif">
                  No logged practice sessions yet. Sessions you start will appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((entry, idx) => {
                    const isCompleted = !!entry.completed_at || entry.completion_state === 'completed' || entry.status === 'completed';
                    const dateVal = entry.started_at || entry.opened_at || entry.created_at || entry.timestamp || entry.last_activity;
                    const dateStr = dateVal && !isNaN(new Date(dateVal).getTime())
                      ? new Date(dateVal).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Recently';

                    const entryResponses = entry.responses || entry.notes || [];
                    const isExpanded = expandedHistoryId === (entry.id || idx);

                    return (
                      <div
                        key={idx}
                        className="p-4 bg-white rounded-xl border border-primary/10 flex flex-col gap-3 shadow-xs hover:border-accent/30 transition-all"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-primary font-serif italic">
                              {entry.intervention?.title || entry.intervention_id}
                            </div>
                            <div className="text-xs text-mid font-mono mt-1 flex items-center gap-1.5">
                              <Clock size={12} className="text-accent" />
                              <span>Started: {dateStr}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                isCompleted
                                  ? 'bg-secondary/20 text-[#1A5040]'
                                  : 'bg-amber-100/90 text-amber-900 border border-amber-300/60'
                              }`}
                            >
                              {isCompleted ? 'Completed' : 'Started'}
                            </span>

                            {entryResponses.length > 0 && (
                              <button
                                onClick={() => setExpandedHistoryId(isExpanded ? null : (entry.id || idx))}
                                className="px-3 py-1.5 bg-mint-grey hover:bg-accent/15 text-primary text-xs font-medium rounded-lg transition-all cursor-pointer border border-primary/10"
                              >
                                {isExpanded ? 'Hide Notes' : `View Notes (${entryResponses.length})`}
                              </button>
                            )}

                            {!isCompleted && (
                              <button
                                onClick={() => {
                                  setPlayerInterventionId(entry.intervention_id || entry.intervention?.id);
                                  setPlayerSessionId(entry.session_id || entry.id || null);
                                }}
                                className="px-3.5 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <Play size={12} className="fill-white" />
                                <span>Continue</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Collapsible Written Notes Section */}
                        {isExpanded && entryResponses.length > 0 && (
                          <div className="pt-3 border-t border-primary/10 space-y-2 text-xs">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-mid block">
                              What You Wrote
                            </span>
                            {entryResponses.map((r, rIdx) => {
                              let displayPrompt = r.question_prompt || r.prompt || '';
                              const rawId = r.question_id || displayPrompt;
                              if (!displayPrompt || displayPrompt.startsWith('q_') || displayPrompt.startsWith('Q_') || displayPrompt.startsWith('step_')) {
                                const intervention = entry.intervention;
                                const match = rawId.match(/step[_\s]*(\d+)/i);
                                if (match && match[1] && intervention?.steps) {
                                  const stepIdx = parseInt(match[1], 10) - 1;
                                  const stepObj = intervention.steps[stepIdx];
                                  if (typeof stepObj === 'string') displayPrompt = stepObj;
                                  else if (stepObj?.content || stepObj?.instruction) displayPrompt = stepObj.content || stepObj.instruction;
                                }
                              }
                              if (!displayPrompt || displayPrompt.startsWith('q_') || displayPrompt.startsWith('Q_')) {
                                displayPrompt = `Note ${rIdx + 1}`;
                              }
                              return (
                                <div key={rIdx} className="bg-mint-grey/60 rounded-lg p-3 border border-primary/5 space-y-0.5">
                                  <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider block">
                                    {displayPrompt}
                                  </span>
                                  <p className="font-serif italic text-primary text-xs whitespace-pre-wrap">
                                    "{r.answer || r.response}"
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Crisis Helplines Modal */}
        {showCrisisModal && crisisResources && (
          <div className="fixed inset-0 z-[100] bg-primary/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 border border-primary/10 shadow-xl relative">
              <button
                onClick={() => setShowCrisisModal(false)}
                className="absolute right-4 top-4 text-mid hover:text-primary cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 text-[#8a3020]">
                <PhoneCall size={22} />
                <h3 className="font-serif text-2xl font-normal text-primary">Emergency Support & Helplines</h3>
              </div>

              <p className="text-xs text-mid leading-relaxed">
                If you or someone you know is in distress or having thoughts of self-harm, please reach out immediately. These services are free, confidential, and available 24/7 in India.
              </p>

              <div className="space-y-3">
                {crisisResources.helplines.map((h, idx) => (
                  <div key={idx} className="p-3 bg-mint-grey rounded-lg border border-primary/5 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-primary">{h.name}</div>
                      <div className="text-[10px] text-mid">{h.hours} · {h.languages}</div>
                    </div>
                    <a href={`tel:${h.number.split(' ')[0]}`} className="text-accent font-bold font-mono text-sm hover:underline">
                      {h.number}
                    </a>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-primary/10">
                <button
                  onClick={() => setShowCrisisModal(false)}
                  className="w-full py-2.5 bg-primary text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#2A3A3E] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
