import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ChevronDown, 
  BookOpen, 
  Smile, 
  RotateCw, 
  Compass, 
  Calendar,
  Layers,
  Sparkles,
  FileText,
  Clock,
  ArrowRight,
  X,
  Search
} from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';
import { DashboardService } from '../services/dashboardService';
import SearchInput from '../components/search/SearchInput';
import HighlightText from '../components/search/HighlightText';

export default function VocabPage({ user, profile, onSignOut }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [threadResponses, setThreadResponses] = useState([]);
  const [openThreadsCount, setOpenThreadsCount] = useState(0);
  
  // UI Panels / Accordions Toggles
  const [awpOpen, setAwpOpen] = useState(false);
  const [awpSearchQuery, setAwpSearchQuery] = useState('');
  const [awpTailOpen, setAwpTailOpen] = useState(false);
  const [ssScope, setSsScope] = useState('last');
  const [openCycles, setOpenCycles] = useState({ 0: true }); // Newest cycle open by default
  const [openResponses, setOpenResponses] = useState({});
  const [auditOpen, setAuditOpen] = useState(false);

  const toggleCycle = (num) => {
    setOpenCycles(prev => ({
      ...prev,
      [num]: !prev[num]
    }));
  };

  const toggleResponse = (idx) => {
    setOpenResponses(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const loadVocabData = async () => {
    try {
      // 1. Fetch overview statistics
      const overview = await DashboardService.fetchVocabOverview();
      setStats(overview);
      
      // 2. Fetch cycle-by-cycle breakdowns
      const byCycle = await DashboardService.fetchVocabByCycle();
      const cycleList = byCycle || [];
      setCycles(cycleList);
      if (cycleList.length > 0) {
        const currentCy = cycleList.find(c => c.is_current || c.is_active || c.status?.toUpperCase() === 'ACTIVE') || cycleList[0];
        if (currentCy?.number !== undefined) {
          setOpenCycles(prev => ({ ...prev, [currentCy.number]: true }));
        }
      }

      // 3. Fetch completed thread responses
      try {
        const trData = await DashboardService.fetchVocabThreadResponses();
        setThreadResponses(trData.responses || []);
        setOpenThreadsCount(trData.openThreadsCount || 0);
      } catch (trErr) {
        console.error('Failed to load thread responses for vocab:', trErr);
      }
    } catch (err) {
      console.error('Failed to load vocab page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVocabData();
  }, []);

  const fmtDate = (dStr) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ECEFF0] text-[#1E2A2E] font-sans pb-20">
        <DashboardNavbar activeTab="home" />
        <main className="max-w-[680px] mx-auto px-6 pt-32 flex flex-col items-center justify-center gap-4">
          <RotateCw className="text-secondary animate-spin" size={24} />
          <p className="text-xs text-[#4A6A64]">Reading your emotional register...</p>
        </main>
      </div>
    );
  }

  const isAvailable = stats?.isAvailable !== false;
  const entriesCount = stats?.stats?.entriesCount || 0;
  const distinctWordCount = stats?.stats?.distinctWordCount || 0;
  const mostUsedWord = stats?.stats?.mostUsedWord || 'none';
  const mostUsedFrequency = stats?.stats?.mostUsedFrequency || 0;

  // Filter All Words Panel tiers based on search query
  const getFilteredWords = () => {
    const defaultVal = { frequent: [], occasional: [], usedOnce: [] };
    if (!stats?.allWords) return defaultVal;
    
    const query = awpSearchQuery.trim().toLowerCase();
    if (!query) return stats.allWords;

    const filterTier = (arr) => (arr || []).filter(w => w.word.toLowerCase().includes(query));

    return {
      frequent: filterTier(stats.allWords.frequent),
      occasional: filterTier(stats.allWords.occasional),
      usedOnce: filterTier(stats.allWords.usedOnce)
    };
  };

  const filteredTiers = getFilteredWords();
  const hasAwpResults = filteredTiers.frequent.length > 0 || 
                         filteredTiers.occasional.length > 0 || 
                         filteredTiers.usedOnce.length > 0;

  // Render top words all time bar chart (top 5)
  const top5 = (stats?.mostUsed || []).slice(0, 5);
  const maxAllTimeFreq = top5[0]?.frequency || 1;
  const twPalette = ['#E0A898', '#E0A898', '#E0A898', '#8DBFB4', '#B8A8D4'];
  const twOpacities = [1.0, 0.7, 0.55, 1.0, 1.0];

  // Shift signals setup
  const hasShiftSignals = cycles.length >= 2;
  const activeShiftSignals = stats?.shiftSignals?.[ssScope] || [];

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans pb-20 sm:pb-24 relative">
      <DashboardNavbar activeTab="home" />

      <main className="max-w-[680px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="space-y-6 sm:space-y-8">
          
          {/* Back button */}
          <button 
            onClick={() => window.navigateTo('/dashboard')}
            className="flex items-center gap-2 text-xs font-semibold text-secondary hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
          >
            <ArrowLeft size={14} /> Back to dashboard
          </button>

          <div className="space-y-1">
            <h1 className="font-serif text-[22px] sm:text-[24px] text-primary mb-1 font-normal">Emotional vocabulary</h1>
            <p className="text-[13px] sm:text-sm text-mid leading-relaxed">The words you reach for across your entire practice — and what they say about where you actually are.</p>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white-paper border border-primary/10 rounded-xl p-4 sm:p-5 shadow-xs text-left">
              <div className="text-[22px] font-bold font-mono text-primary leading-none">{entriesCount}</div>
              <div className="text-[11px] text-mid mt-1.5 leading-normal">entries tracked</div>
              <div className="text-[10px] text-secondary mt-0.5">across {cycles.length} cycles</div>
            </div>
            
            <div 
              onClick={() => { if (isAvailable) setAwpOpen(!awpOpen); }}
              className={`bg-white-paper border border-primary/10 rounded-xl p-4 sm:p-5 shadow-xs text-left transition-all ${
                isAvailable ? 'cursor-pointer hover:shadow-sm hover:border-primary/20' : ''
              }`}
            >
              <div className="text-[22px] font-bold font-mono text-primary leading-none flex items-center">
                {isAvailable ? distinctWordCount : 0}
                {isAvailable && (
                  <ChevronDown 
                    size={14} 
                    className={`text-secondary ml-1 transition-transform ${awpOpen ? 'rotate-180' : ''}`} 
                  />
                )}
              </div>
              <div className="text-[11px] text-mid mt-1.5 leading-normal">distinct emotion words</div>
              <div className="text-[10px] text-secondary mt-0.5">all time · tap to see them</div>
            </div>

            <div className="bg-white-paper border border-primary/10 rounded-xl p-4 sm:p-5 shadow-xs text-left">
              <div className="text-[22px] font-bold text-accent font-mono leading-none truncate">
                {isAvailable && mostUsedWord !== 'none' ? `"${mostUsedWord}"` : '—'}
              </div>
              <div className="text-[11px] text-mid mt-1.5 leading-normal">most reached-for word</div>
              <div className="text-[10px] text-secondary mt-0.5">
                {isAvailable && mostUsedFrequency > 0 ? `${mostUsedFrequency}× all-time` : '—'}
              </div>
            </div>
          </div>

          {/* All Words Panel (slide-out accordion) */}
          {isAvailable && awpOpen && (
            <div className="bg-white-paper border border-primary/10 rounded-2xl p-5 sm:p-6 shadow-xs transition-all duration-300 text-left">
              <div className="flex items-start justify-between gap-3 mb-3.5 pb-3.5 border-b border-primary/5">
                <div>
                  <h3 className="text-[13px] font-bold text-primary mb-1">
                    All {distinctWordCount} words, ranked by use
                  </h3>
                  <p className="text-xs text-mid leading-normal">
                    Every distinct emotion word from your entries — the ones you lean on most, and the ones you've reached for only once.
                  </p>
                </div>
                <button 
                  onClick={() => setAwpOpen(false)}
                  className="text-mid hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <SearchInput
                  id="vocab-words-search"
                  placeholder="Search words..."
                  ariaLabel="Search tracked vocabulary words"
                  value={awpSearchQuery}
                  onChange={(val) => setAwpSearchQuery(val)}
                  onClear={() => setAwpSearchQuery('')}
                  size="sm"
                />
              </div>

              {/* Tiers display */}
              {!hasAwpResults ? (
                <div className="text-xs text-mid italic py-2">No words match "{awpSearchQuery}".</div>
              ) : (
                <div className="space-y-4">
                  {filteredTiers.frequent.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold tracking-wider uppercase text-[#4A6A64] mb-2 flex items-center gap-1.5">
                        Frequent <span className="font-normal normal-case tracking-normal text-[#8DBFB4]">({filteredTiers.frequent.length})</span>
                      </div>
                      <div className={`flex flex-wrap gap-1.5 ${filteredTiers.frequent.length > 18 ? 'max-h-[150px] overflow-y-auto pr-0.5' : ''}`}>
                        {filteredTiers.frequent.map((w, idx) => (
                          <span key={idx} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1E2A2E]/5 text-[#1E2A2E] border border-[#1E2A2E]/10">
                            <HighlightText text={w.word} query={awpSearchQuery} />
                            <span className="text-[10.5px] font-bold text-[#8A3020] font-mono">×{w.count}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredTiers.occasional.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold tracking-wider uppercase text-[#4A6A64] mb-2 flex items-center gap-1.5">
                        Occasional <span className="font-normal normal-case tracking-normal text-[#8DBFB4]">({filteredTiers.occasional.length})</span>
                      </div>
                      <div className={`flex flex-wrap gap-1.5 ${filteredTiers.occasional.length > 18 ? 'max-h-[150px] overflow-y-auto pr-0.5' : ''}`}>
                        {filteredTiers.occasional.map((w, idx) => (
                          <span key={idx} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1E2A2E]/5 text-[#1E2A2E] border border-[#1E2A2E]/10">
                            <HighlightText text={w.word} query={awpSearchQuery} />
                            <span className="text-[10.5px] font-bold text-[#8A3020] font-mono">×{w.count}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredTiers.usedOnce.length > 0 && (
                    <div>
                      <button 
                        onClick={() => setAwpTailOpen(!awpTailOpen)}
                        className="text-xs font-semibold text-[#2E7A70] hover:text-[#1A5040] cursor-pointer inline-flex items-center gap-1 py-1 transition-colors border-none bg-transparent"
                      >
                        <ChevronDown size={12} className={`transition-transform ${awpTailOpen || awpSearchQuery ? 'rotate-180' : ''}`} />
                        Used once <span className="font-normal normal-case tracking-normal text-[#8DBFB4]">({filteredTiers.usedOnce.length})</span>
                      </button>

                      {(awpTailOpen || awpSearchQuery) && (
                        <div className={`flex flex-wrap gap-1.5 mt-2 ${filteredTiers.usedOnce.length > 18 ? 'max-h-[150px] overflow-y-auto pr-0.5' : ''}`}>
                          {filteredTiers.usedOnce.map((w, idx) => (
                            <span key={idx} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1E2A2E]/5 text-[#1E2A2E]/65 border border-[#1E2A2E]/10">
                              <HighlightText text={w.word} query={awpSearchQuery} />
                              <span className="text-[10.5px] font-bold text-[#4A6A64] font-mono">×{w.count}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* OVERALL PICTURE */}
          <div className="space-y-3">
            <div className="text-[10px] font-bold tracking-widest text-[#8DBFB4] uppercase">Overall picture</div>

            {!isAvailable ? (
              <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-8 text-center space-y-4 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-[#8DBFB4]" />
                <div className="w-12 h-12 rounded-full bg-accent/5 border border-accent/15 flex items-center justify-center text-accent mx-auto">
                  <Compass size={22} className="animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-serif text-[15px] text-primary font-normal">Rolling Analysis Generating</h3>
                  <p className="text-[11.5px] text-[#4A6A64] leading-relaxed max-w-sm mx-auto">
                    Vocabulary analysis updates every 3 entries or on a rolling 3-day basis. We require at least 3 entries or 3 days of journal activity to map your ongoing emotional landscape. Check back shortly.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-5 shadow-xs">
                <p className="text-[12.5px] text-[#4A6A64] leading-relaxed mb-4 pb-3.5 border-b border-[#1E2A2E]/5">
                  Your most-used emotion words across all entries. The gap between what you say and what you might mean is usually where something useful is sitting.
                </p>

                {/* Most Used Bar Chart */}
                <div className="mb-5">
                  <div className="text-[10px] font-bold tracking-wider uppercase text-[#4A6A64] mb-3">
                    Most used — all time
                  </div>
                  <div className="space-y-2">
                    {top5.map((w, idx) => {
                      const pct = Math.round((w.frequency / maxAllTimeFreq) * 100);
                      const color = twPalette[idx] || '#8DBFB4';
                      const opacity = twOpacities[idx] ?? 1.0;
                      return (
                        <div key={idx} className="flex items-center gap-2.5">
                          <div className="text-[13px] font-semibold text-primary w-[110px] shrink-0 text-left">{w.word}</div>
                          <div className="flex-1 h-1.5 bg-[#1E2A2E]/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500" 
                              style={{ width: `${pct}%`, backgroundColor: color, opacity }}
                            />
                          </div>
                          <div className="text-xs font-bold text-[#4A6A64] w-10 text-right shrink-0 font-mono">{w.frequency}×</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Shift Signal */}
                <div className="bg-accent/6 border border-accent/15 rounded-xl p-4.5 mb-4.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="text-[10px] font-semibold tracking-wider uppercase text-accent">
                      How your vocabulary has shifted
                    </div>
                    {hasShiftSignals && (
                      <div className="flex gap-1 bg-white-paper rounded-lg p-0.5 border border-primary/10">
                        <button 
                          onClick={() => setSsScope('last')}
                          className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-md transition-colors border-none cursor-pointer ${
                            ssScope === 'last' ? 'bg-accent text-white shadow-xs' : 'text-accent bg-transparent hover:bg-accent/10'
                          }`}
                        >
                          Last cycle
                        </button>
                        {cycles.length >= 7 && (
                          <button 
                            onClick={() => setSsScope('six')}
                            className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-md transition-colors border-none cursor-pointer ${
                              ssScope === 'six' ? 'bg-accent text-white shadow-xs' : 'text-accent bg-transparent hover:bg-accent/10'
                            }`}
                          >
                            Last 6 cycles
                          </button>
                        )}
                        <button 
                          onClick={() => setSsScope('all')}
                          className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-md transition-colors border-none cursor-pointer ${
                            ssScope === 'all' ? 'bg-accent text-white shadow-xs' : 'text-accent bg-transparent hover:bg-accent/10'
                          }`}
                        >
                          Since Cycle 1
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3.5 space-y-2 text-left">
                    {!hasShiftSignals ? (
                      <div className="text-[12.5px] text-[#4A6A64] italic">
                        Come back after your next cycle to see how your vocabulary has shifted.
                      </div>
                    ) : activeShiftSignals.length === 0 ? (
                      <div className="text-[12.5px] text-[#4A6A64] italic">
                        Nothing notable shifted in this window — your vocabulary held steady.
                      </div>
                    ) : (
                      activeShiftSignals.map((sig, idx) => {
                        const isNew = sig.includes('is new') || sig.includes('are new');
                        const isDropped = sig.includes('dropped away');
                        const dotColor = isNew ? '#B8A8D4' : (isDropped ? '#E0A898' : '#8DBFB4');

                        return (
                          <div key={idx} className="flex items-start gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: dotColor }} />
                            <div className="text-[12.5px] text-primary leading-normal">{sig}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Word Clusters */}
                <div className="mt-4.5 text-left">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] font-bold tracking-wider uppercase text-[#4A6A64]">
                      Word clusters
                    </div>
                    <div className="text-[10.5px] text-[#8DBFB4] italic">
                      Auto-updates weekly
                    </div>
                  </div>

                  {(!stats?.clusters || stats.clusters.length === 0) ? (
                    <div className="text-xs text-[#4A6A64] italic bg-[#F5F8F8] rounded-lg p-3.5">
                      No word clusters generated for this cycle yet.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {stats.clusters.map((cl, idx) => {
                        const wordCount = stats.mostUsed?.find(w => w.normalized_word === cl.cluster_name)?.frequency;
                        return (
                          <div key={idx} className="bg-[#F5F8F8] rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E0A898]/15 text-[#8A3020] border border-[#E0A898]/30">
                                {cl.cluster_name}
                              </span>
                              {wordCount != null && (
                                <span className="text-xs text-[#8A3020] font-bold">×{wordCount}</span>
                              )}
                              <ArrowRight size={12} className="text-[#C8D8D4]" />
                              <div className="flex gap-1.5 flex-wrap">
                                {(cl.words || []).map((rw, rIdx) => (
                                  <span key={rIdx} className="text-[11px] font-semibold px-2 py-1 rounded-full bg-[#1E2A2E]/5 text-[#4A6A64] border border-[#1E2A2E]/10">
                                    {rw}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-[#4A6A64] italic leading-normal pl-2.5 border-l border-[#E0A898]">
                              {cl.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Emotion directory link */}
                <div className="flex items-center gap-2 text-xs text-[#2E7A70] font-semibold cursor-pointer mt-4 pt-3.5 border-t border-[#1E2A2E]/5 select-none hover:text-[#1A5040] transition-colors">
                  <BookOpen size={14} />
                  <div>
                    <div>Explore the emotion directory</div>
                    <div className="text-[11px] text-[#4A6A64] mt-0.5 font-normal">
                      See what each word actually means and how they differ
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* BY CYCLE ACCORDIONS */}
          {isAvailable && cycles.length > 0 && (
            <div className="space-y-3 pt-2 text-left">
              <div className="text-[10px] font-bold tracking-widest text-[#8DBFB4] uppercase">By cycle</div>
              
              <div className="space-y-2.5">
                {cycles.map((cy, idx) => {
                  const isOpen = !!openCycles[cy.number];
                  const top3 = cy.most_used || [];
                  const maxCyFreq = top3[0]?.frequency || 1;
                  const cyPalette = ['#E0A898', '#E0A898', '#B8A8D4'];
                  const isCurrent = cy.is_current ?? cy.is_active ?? (cy.status?.toUpperCase() === 'ACTIVE') ?? !cy.is_locked;

                  return (
                    <div 
                      key={cy.id || idx} 
                      className="bg-white border border-[#1E2A2E]/10 rounded-xl overflow-hidden"
                      style={{ opacity: isCurrent ? 1.0 : 0.85 }}
                    >
                      <div 
                        onClick={() => toggleCycle(cy.number)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#F8FAFA] transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 border ${
                            isCurrent 
                              ? 'bg-[#E0A898]/12 text-[#8A3020] border-[#E0A898]/28' 
                              : 'bg-[#8DBFB4]/10 text-[#1A5040] border-[#8DBFB4]/25'
                          }`}>
                            {isCurrent ? 'Current' : 'Completed'}
                          </span>
                          <div>
                            <div className="text-sm font-bold text-primary">Cycle {cy.number}</div>
                            <div className="text-[11px] text-[#8DBFB4] mt-0.5">
                              {fmtDate(cy.started_at)} – {isCurrent ? 'present' : (fmtDate(cy.ended_at) || 'completed')} · {cy.entry_count} entries
                            </div>
                          </div>
                        </div>
                        <ChevronDown size={14} className={`text-[#4A6A64] transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {isOpen && (
                        <div className="border-t border-[#1E2A2E]/5 p-4.5 bg-[#FAFBFB] space-y-4">
                          {/* Top Words this Cycle */}
                          <div>
                            <div className="text-[10px] font-bold tracking-wider uppercase text-[#8DBFB4] mb-2">
                              Most used this cycle
                            </div>
                            {top3.length === 0 ? (
                              <div className="text-xs text-[#4A6A64] italic">No tracked words yet this cycle.</div>
                            ) : (
                              <div className="space-y-1.5">
                                {top3.map((w, wIdx) => {
                                  const pct = Math.round((w.frequency / maxCyFreq) * 100);
                                  return (
                                    <div key={wIdx} className="flex items-center gap-2">
                                      <div className="text-[12.5px] font-semibold text-primary w-[100px] shrink-0">{w.word}</div>
                                      <div className="flex-1 h-1.5 bg-[#1E2A2E]/5 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full rounded-full transition-all duration-300"
                                          style={{ width: `${pct}%`, backgroundColor: cyPalette[wIdx] || '#8DBFB4' }}
                                        />
                                      </div>
                                      <div className="text-xs text-[#4A6A64] w-9 text-right font-mono">{w.frequency}×</div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* New and Dropped Words */}
                          {((cy.new_words && cy.new_words.length > 0) || (cy.dropped_words && cy.dropped_words.length > 0)) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#1E2A2E]/5 pt-4">
                              {cy.new_words && cy.new_words.length > 0 && (
                                <div>
                                  <div className="text-[10px] font-bold tracking-wider uppercase text-[#4A6A64] mb-1.5">
                                    New this cycle
                                  </div>
                                  <div className="flex gap-1.5 flex-wrap">
                                    {cy.new_words.map((w, wIdx) => (
                                      <span key={wIdx} className="text-[11px] font-semibold px-2 py-1 rounded-full bg-[#B8A8D4]/12 text-[#5A4A8A] border border-[#B8A8D4]/25">
                                        {w}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {cy.dropped_words && cy.dropped_words.length > 0 && (
                                <div>
                                  <div className="text-[10px] font-bold tracking-wider uppercase text-[#4A6A64] mb-1.5">
                                    Dropped from Cycle {cy.number - 1}
                                  </div>
                                  <div className="flex gap-1.5 flex-wrap">
                                    {cy.dropped_words.map((w, wIdx) => (
                                      <span key={wIdx} className="text-[11px] font-semibold px-2 py-1 rounded-full bg-[#1E2A2E]/5 text-[#4A6A64]/60 border border-[#1E2A2E]/10 line-through opacity-60">
                                        {w}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Cycle specific clusters */}
                          {cy.clusters && cy.clusters.length > 0 && (
                            <div className="cycle-wc border-t border-[#1E2A2E]/5 pt-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-[10px] font-bold tracking-wider uppercase text-[#8DBFB4]">
                                  Word clusters
                                </div>
                                {isCurrent && (
                                  <div className="text-[10.5px] text-[#8DBFB4] italic">
                                    Auto-updates weekly
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-2.5">
                                {cy.clusters.map((cl, cIdx) => (
                                  <div key={cIdx} className="bg-white/50 border border-[#1E2A2E]/5 rounded-lg p-2.5">
                                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E0A898]/12 text-[#8A3020] border border-[#E0A898]/25">
                                        {cl.cluster_name}
                                      </span>
                                      <ArrowRight size={10} className="text-[#C8D8D4]" />
                                      <div className="flex gap-1 flex-wrap">
                                        {(cl.words || []).map((rw, rwIdx) => (
                                          <span key={rwIdx} className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full bg-[#1E2A2E]/5 text-[#4A6A64] border border-[#1E2A2E]/10">
                                            {rw}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    <p className="text-[11.5px] text-[#4A6A64] italic leading-normal pl-2 border-l border-[#E0A898]">
                                      {cl.description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WHAT YOU WROTE WHEN ASKED DIRECTLY (Thread Responses) */}
          {threadResponses.length > 0 && (
            <div className="space-y-3 pt-2 text-left">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold tracking-widest text-[#8DBFB4] uppercase">What you wrote when asked directly</div>
                <span className="text-[11px] font-bold text-[#4A6A64] bg-[#FAFBFB] border border-[#1E2A2E]/5 px-2.5 py-0.5 rounded-full">
                  {threadResponses.length} {threadResponses.length === 1 ? 'response' : 'responses'}
                </span>
              </div>
              <p className="text-xs text-[#4A6A64] leading-relaxed">
                Your responses to open thread questions — raw emotional writing. They live here because they are purely about feeling, not about what happened.
              </p>

              <div className="space-y-3">
                {threadResponses.map((resp, idx) => {
                  const isRespOpen = !!openResponses[idx];
                  return (
                    <div 
                      key={resp.id || idx} 
                      className="bg-white border border-[#1E2A2E]/10 rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition-all"
                    >
                      <div 
                        onClick={() => toggleResponse(idx)}
                        className="p-4 flex items-start gap-3 cursor-pointer"
                      >
                        <div className="w-[3px] bg-[#B8A8D4] rounded-full self-stretch min-h-[44px] shrink-0" />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">
                            {resp.from}
                          </div>
                          <div className="text-[13px] text-primary italic font-serif leading-relaxed line-clamp-1">
                            {resp.question}
                          </div>
                          <div className="text-[12px] text-[#4A6A64] truncate">
                            {resp.preview}
                          </div>
                          <div className="text-[10.5px] text-[#8DBFB4] mt-1 font-medium">
                            {resp.meta}
                          </div>
                        </div>
                        <ChevronDown size={15} className={`text-[#C8D8D4] mt-1.5 transition-transform ${isRespOpen ? 'rotate-180' : ''}`} />
                      </div>
                      
                      {isRespOpen && (
                        <div className="border-t border-[#1E2A2E]/5 p-4.5 bg-[#FAFBFB] pl-8 space-y-3">
                          <p className="text-[13px] text-primary leading-relaxed font-serif italic whitespace-pre-wrap">
                            {resp.full}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10.5px] text-[#4A6A64] font-medium">
                            <FileText size={13} className="text-[#8DBFB4]" />
                            <span>{resp.footer}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {openThreadsCount > 0 && (
                <div className="bg-[#FAFBFB] border border-[#1E2A2E]/5 rounded-xl p-3.5 flex items-center gap-3">
                  <Clock className="text-[#8DBFB4] shrink-0" size={15} />
                  <div className="text-[11.5px] text-[#4A6A64] leading-relaxed">
                    You have <strong>{openThreadsCount} open threads</strong> waiting. Responses will appear here once written.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DEVELOPER AUDIT TRACE LOG */}
          {(stats?.currentCycleWords && stats.currentCycleWords.length > 0) && (
            <div className="border-t border-[#1E2A2E]/10 pt-6 mt-8 text-left">
              <button
                onClick={() => setAuditOpen(!auditOpen)}
                className="w-full flex items-center justify-between py-2 text-xs font-mono font-bold tracking-widest text-[#4A6A64] hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
              >
                <span>[DEVELOPER AUDIT TRACE LOG]</span>
                <span>{auditOpen ? '[- Close]' : '[+ Expand]'}</span>
              </button>
              
              {auditOpen && (
                <div className="mt-4 bg-[#1E2A2E]/5 border border-[#1E2A2E]/10 rounded-xl p-4.5 font-mono space-y-5 text-xs text-[#2A3A3E] overflow-x-auto">
                  <p className="text-[10px] text-mid uppercase tracking-wide border-b border-[#1E2A2E]/10 pb-2">
                    Verbatim Verification Trace (Traceability back to database records)
                  </p>
                  <div className="space-y-4">
                    {stats.currentCycleWords.map((w, idx) => {
                      const trail = w.audit_trail || [];
                      if (trail.length === 0) return null;
                      const primary = trail[0];
                      const related = trail.slice(1);
                      return (
                        <div key={idx} className="space-y-1.5 pb-3 border-b border-[#1E2A2E]/5 last:border-b-0">
                          <div className="font-bold text-[#8A3020]">Word: {w.normalized_word}</div>
                          <div className="pl-4 text-[#8DBFB4]">↓</div>
                          <div className="pl-4">Document ID: <span className="underline select-all text-primary">{primary.entry_id}</span> ({primary.type})</div>
                          <div className="pl-4 text-[#8DBFB4]">↓</div>
                          <div className="pl-4 italic text-primary">Original sentence: "{primary.sentence}"</div>
                          <div className="pl-4 text-[#8DBFB4]">↓</div>
                          <div className="pl-4">Casing Mapping: "{w.word}"</div>
                          <div className="pl-4 text-[#8DBFB4]">↓</div>
                          <div className="pl-4">Date: {primary.date}</div>
                          <div className="pl-4 text-[#8DBFB4]">↓</div>
                          <div className="pl-4">Metadata: version={primary.extractor_version} (prompt={primary.prompt_version}) | provider={primary.provider} ({primary.model}) | confidence={primary.confidence}</div>
                          <div className="pl-4 text-[#8DBFB4]">↓</div>
                          <div className="pl-4">Reasoning: "{primary.reason || 'No reasoning logged.'}"</div>
                          <div className="pl-4 text-[#8DBFB4]">↓</div>
                          <div className="pl-4">Number of occurrences: {w.frequency}</div>
                          
                          {related.length > 0 && (
                            <>
                              <div className="pl-4 text-[#8DBFB4]">↓</div>
                              <div className="pl-4 space-y-1">
                                <div>Related occurrences:</div>
                                {related.map((r, rIdx) => (
                                  <div key={rIdx} className="pl-4 text-mid">
                                    • ID: <span className="underline select-all">{r.entry_id}</span> ({r.date}) - "{r.sentence}" [conf={r.confidence}]
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
