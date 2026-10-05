import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronDown, Link2, Activity, Sparkles, Loader2 } from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';
import { DashboardService } from '../services/dashboardService';
import SearchInput from '../components/search/SearchInput';
import HighlightText from '../components/search/HighlightText';

const dotLabels = {
  active: 'bg-[#E0A898]',
  emerging: 'bg-[#B8A8D4]',
  re_emerging: 'bg-[#E0A898]/60 border border-[#E0A898]/40',
  strong: 'bg-[#E0A898]',
  present: 'bg-[#E0A898]',
  shifting: 'bg-[#8DBFB4]',
  quiet: 'bg-primary/20 border border-primary/20',
  absent: 'bg-primary/5 border border-dashed border-primary/20',
  new: 'bg-[#B8A8D4]',
  newdot: 'bg-[#B8A8D4]',
  returned: 'bg-[#E0A898]/60 border border-[#E0A898]/40'
};

const legendItems = [
  { label: 'Active', color: 'bg-[#E0A898]' },
  { label: 'Emerging', color: 'bg-[#B8A8D4]' },
  { label: 'Re-emerging', color: 'bg-[#E0A898]/60 border border-[#E0A898]/40' },
  { label: 'Quiet', color: 'bg-primary/20 border border-primary/20' },
  { label: 'Not observed', color: 'bg-primary/5 border border-dashed border-primary/20' }
];

const getStatusBadge = (status) => {
  switch (status) {
    case 'active':
    case 'present':
      return { text: 'Active', className: 'bg-accent/12 text-accent border border-accent/25' };
    case 'emerging':
    case 'new':
      return { text: 'Emerging', className: 'bg-accent/15 text-accent border border-accent/30' };
    case 're_emerging':
    case 'returned':
      return { text: 'Re-emerging', className: 'bg-supporting/25 text-primary border border-supporting/40' };
    case 'shifting':
      return { text: 'Shifting', className: 'bg-secondary/15 text-primary border border-secondary/30' };
    case 'quiet':
      return { text: 'Quiet', className: 'bg-primary/5 text-mid border border-primary/10' };
    default:
      return { text: 'Active', className: 'bg-accent/12 text-accent border border-accent/25' };
  }
};

/** Processing screen shown while backfill is running */
function BackfillProcessingScreen() {
  const [dotCount, setDotCount] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setDotCount(c => (c % 3) + 1), 600);
    return () => clearInterval(t);
  }, []);
  const dots = '.'.repeat(dotCount);

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans pb-20">
      <DashboardNavbar activeTab="patterns" />
      <main className="max-w-[680px] mx-auto px-6 pt-6 space-y-4">
        <button
          onClick={() => window.navigateTo('/dashboard')}
          className="flex items-center gap-2 text-xs font-semibold text-[#4A6A64] hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </button>
        <div>
          <h1 className="font-serif text-[22px] text-primary mb-0.5 font-normal">Patterns</h1>
          <p className="text-xs text-mid">Recurring themes the system has identified across your writing.</p>
        </div>

        <div className="bg-white-paper border border-primary/10 rounded-2xl p-8 shadow-xs flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center">
            <Sparkles size={24} className="text-secondary" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-primary">The Pattern Engine is reading your history</h3>
            <p className="text-xs text-mid max-w-[320px] mx-auto leading-relaxed">
              We're scanning your past cycles and compiling your pattern timeline for the first time. This usually takes less than a minute.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-secondary font-medium">
            <Loader2 size={13} className="animate-spin" />
            <span>Processing{dots}</span>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Empty state for brand-new users with no cycles */
function NewUserEmptyScreen() {
  const previewPatterns = [
    {
      id: "preview-cognitive-avoidance",
      name: "Cognitive Avoidance",
      status: "present",
      body: "Focusing heavily on logistics, facts, or external events to buffer against feeling the underlying emotional weight of a situation.",
      meta: "Tracks structural focus vs feeling descriptors",
      timeline: ["present", "shifting", "quiet"],
    },
    {
      id: "preview-over-responsibility",
      name: "Over-responsibility",
      status: "shifting",
      body: "Assuming full accountability for external outcomes, relationship dynamics, or team delays even when they are beyond your control.",
      meta: "Tracks agency orientation in journaling",
      timeline: ["shifting", "shifting", "present"],
    },
    {
      id: "preview-emotional-containment",
      name: "Emotional Containment",
      status: "quiet",
      body: "Saying 'I am fine' or keeping expressions highly measured when internal descriptors show high distress.",
      meta: "Tracks emotional suppression signals",
      timeline: ["quiet", "quiet", "quiet"],
    }
  ];

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans pb-20 sm:pb-24">
      <DashboardNavbar activeTab="patterns" />
      <main className="max-w-[680px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        <button
          onClick={() => window.navigateTo('/dashboard')}
          className="flex items-center gap-2 text-xs font-semibold text-secondary hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </button>
        <div className="space-y-1">
          <h1 className="font-serif text-[22px] sm:text-[24px] text-primary mb-1 font-normal">Patterns</h1>
          <p className="text-xs sm:text-[13px] text-mid leading-relaxed">Recurring themes the system has identified across your writing. Not diagnoses — observations about what keeps showing up.</p>
        </div>

        <div className="bg-white-paper border border-primary/10 rounded-2xl p-8 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-secondary/15 flex items-center justify-center mx-auto text-secondary">
            <Activity size={24} />
          </div>
          <h3 className="text-sm font-bold text-primary">No patterns have emerged yet</h3>
          <p className="text-xs text-mid max-w-[380px] mx-auto leading-relaxed">
            Your personal patterns timeline will automatically compile here as you complete cycles. In the meantime, see the preview below of typical behavioral patterns Ingress Within tracks:
          </p>
          <button
            onClick={() => window.navigateTo('/dashboard')}
            className="mt-2 px-6 py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-[#654652] transition-all cursor-pointer border-none shadow-xs"
          >
            Start writing your first entry
          </button>
        </div>

        {/* Educational Previews Section */}
        <div className="space-y-4 pt-4 text-left">
          <div className="text-[10px] font-bold tracking-widest text-secondary uppercase border-b border-primary/10 pb-2">
            Typical Patterns We Track (Preview)
          </div>

          <div className="grid gap-4">
            {previewPatterns.map(p => {
              const badge = getStatusBadge(p.status);
              return (
                <div
                  key={p.id}
                  className="bg-white-paper border border-primary/10 rounded-2xl p-5 relative overflow-hidden pl-6 hover:border-accent/30 transition-all shadow-xs"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${p.status === 'present' ? 'bg-accent' : p.status === 'shifting' ? 'bg-secondary' : 'bg-primary/20'}`} />
                  
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-[14px] font-bold text-primary">{p.name}</h4>
                      <span className="text-[9px] font-sans text-accent tracking-wide uppercase font-semibold">Educational Preview</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${badge.className}`}>
                      {badge.text}
                    </span>
                  </div>

                  <p className="text-[12px] text-[#4A6A64] leading-relaxed mb-3.5">{p.body}</p>

                  {/* Timeline preview */}
                  <div className="space-y-1.5 mb-2.5">
                    <div className="text-[8.5px] tracking-wider uppercase text-mid font-bold">Illustrative Timeline Across 3 Cycles</div>
                    <div className="flex gap-2">
                      {p.timeline.map((s, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div className={`w-3.5 h-3.5 rounded-full ${dotLabels[s] || dotLabels.absent}`} />
                          <span className="text-[8.5px] font-mono text-mid/60 mt-0.5">C{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-[10.5px] text-mid border-t border-[#1E2A2E]/5 pt-3 mt-3">
                    <span>{p.meta}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PatternsPage({ user, profile, onSignOut }) {
  const [viewState, setViewState] = useState('list'); // 'list' | 'detail'
  const [overview, setOverview] = useState(null);
  const [userState, setUserState] = useState(null); // null = not yet loaded
  const [activePatternDetail, setActivePatternDetail] = useState(null);
  const [activePatternId, setActivePatternId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedCycles, setExpandedCycles] = useState({});
  const [listExpandedCycles, setListExpandedCycles] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleListCycleCard = (cycleNumber) => {
    setListExpandedCycles(prev => ({
      ...prev,
      [cycleNumber]: !prev[cycleNumber]
    }));
  };

  const pollingRef = useRef(null);
  const backfillTriggeredRef = useRef(false);

  /** Trigger backfill API call for first-time users. */
  const triggerBackfill = useCallback(async () => {
    if (backfillTriggeredRef.current) return false;
    backfillTriggeredRef.current = true;
    try {
      console.log('[PatternsPage] Triggering backfill for new user…');
      const res = await fetch('/api/patterns/backfill', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      return res.ok;
    } catch (err) {
      console.warn('[PatternsPage] Backfill trigger failed:', err);
      return false;
    }
  }, []);

  /** Poll /api/patterns/status until state transitions to 'active'. */
  const startPolling = useCallback(() => {
    if (pollingRef.current) return; // already polling
    pollingRef.current = setInterval(async () => {
      try {
        const status = await DashboardService.fetchPatternStatus();
        if (status.state === 'active') {
          // Backfill done — stop polling and reload full overview
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          const data = await DashboardService.fetchPatternOverview();
          setOverview(data);
          setUserState({ state: 'active' });
        } else {
          setUserState(prev => ({ ...prev, state: status.state }));
        }
      } catch (err) {
        console.warn('[PatternsPage] Polling error:', err);
      }
    }, 4000);
  }, []);

  /** Stop polling on unmount */
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  /** Initial data load */
  useEffect(() => {
    async function loadPatterns() {
      try {
        const data = await DashboardService.fetchPatternOverview();
        setOverview(data);

        const state = data.userState?.state ?? 'active';
        setUserState(data.userState ?? { state: 'active' });

        if (state === 'new_user') {
          const started = await triggerBackfill();
          if (started) {
            setUserState({ state: 'backfill_pending' });
            startPolling();
          } else {
            // If backfill was not queued (e.g. dormant user), stay active to view existing patterns
            setUserState({ state: 'active' });
          }
        } else if (state === 'backfill_pending') {
          startPolling();
        }
      } catch (err) {
        console.error('[PatternsPage] Error fetching patterns overview:', err);
        setUserState({ state: 'active' }); // fall-through: show whatever we have
      } finally {
        setLoading(false);
      }
    }
    loadPatterns();
  }, [triggerBackfill, startPolling]);

  const handleOpenPattern = async (id) => {
    setActivePatternId(id);
    setViewState('detail');
    setDetailLoading(true);
    try {
      const detail = await DashboardService.fetchPatternDetail(id);
      setActivePatternDetail(detail);
      // Open the current cycle (first card in list) by default
      setExpandedCycles({ 0: true });
    } catch (err) {
      console.error('[PatternsPage] Error fetching pattern details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleCycleCard = (index) => {
    setExpandedCycles(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const jumpToCycleCard = (cycleNumber) => {
    if (!activePatternDetail) return;
    const cycleIdx = activePatternDetail.timeline.length - cycleNumber;

    // Open target cycle card
    setExpandedCycles(prev => ({
      ...prev,
      [cycleIdx]: true
    }));

    // Smooth scroll down to card
    setTimeout(() => {
      const element = document.getElementById(`cycle-card-${cycleIdx}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // --- Loading skeleton ---
  if (loading) {
    return (
      <div className="min-h-screen bg-mint-grey text-primary font-sans pb-20">
        <DashboardNavbar activeTab="patterns" />
        <main className="max-w-[680px] mx-auto px-6 pt-6 space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 bg-[#1E2A2E]/10 rounded" />
            <div className="h-8 w-48 bg-[#1E2A2E]/10 rounded" />
            <div className="h-4 w-80 bg-[#1E2A2E]/10 rounded" />
            <div className="h-20 bg-[#1E2A2E]/5 rounded-xl" />
            <div className="space-y-3 pt-4">
              <div className="h-32 bg-[#1E2A2E]/5 rounded-xl" />
              <div className="h-32 bg-[#1E2A2E]/5 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- State-based branching ---
  const currentState = userState?.state ?? 'active';

  const allPatterns = (overview?.patterns && overview.patterns.length > 0)
    ? overview.patterns
    : [
        ...(overview?.lifecycle?.active || []),
        ...(overview?.lifecycle?.emerging || []),
        ...(overview?.lifecycle?.reEmerging || []),
        ...(overview?.lifecycle?.quiet || [])
      ];

  const hasPatterns = allPatterns.length > 0;

  if (currentState === 'backfill_pending' && !hasPatterns) {
    return <BackfillProcessingScreen />;
  }

  if (!hasPatterns) {
    return <NewUserEmptyScreen />;
  }

  // Group patterns into 4 categories: New, Shifting, Quiet, Present
  const query = searchQuery.trim().toLowerCase();
  const filteredPatterns = query
    ? allPatterns.filter(p =>
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.body && p.body.toLowerCase().includes(query)) ||
        (p.status && p.status.toLowerCase().includes(query)) ||
        (p.lifecycleStatus && p.lifecycleStatus.toLowerCase().includes(query))
      )
    : allPatterns;

  const newPatternsAll = filteredPatterns.filter(p => 
    p.status === 'new' || (!['shifting', 'quiet', 'present'].includes(p.status) && p.lifecycleStatus === 'emerging')
  );

  const shiftingPatternsAll = filteredPatterns.filter(p => 
    p.status === 'shifting'
  );

  const quietPatternsAll = filteredPatterns.filter(p => 
    p.status === 'quiet' || p.lifecycleStatus === 'quiet'
  );

  const presentPatternsAll = filteredPatterns.filter(p => 
    !newPatternsAll.includes(p) && 
    !shiftingPatternsAll.includes(p) && 
    !quietPatternsAll.includes(p)
  );

  // When searching, show all matches; when not searching, show 3 each
  const newPatterns = query ? newPatternsAll : newPatternsAll.slice(0, 3);
  const shiftingPatterns = query ? shiftingPatternsAll : shiftingPatternsAll.slice(0, 3);
  const quietPatterns = query ? quietPatternsAll : quietPatternsAll.slice(0, 3);
  const presentPatterns = query ? presentPatternsAll : presentPatternsAll.slice(0, 3);

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans relative pb-20 sm:pb-24">
      <DashboardNavbar activeTab="patterns" />

      <main className="max-w-[680px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {viewState === 'list' && (
          <div className="space-y-6">
            <button
              onClick={() => window.navigateTo('/dashboard')}
              className="flex items-center gap-2 text-xs font-semibold text-secondary hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
            >
              <ArrowLeft size={14} /> Back to dashboard
            </button>

            <div className="space-y-1">
              <h1 className="font-serif text-[22px] sm:text-[24px] text-primary mb-1 font-normal">Patterns</h1>
              <p className="text-xs sm:text-[13px] text-mid leading-relaxed">Recurring themes the system has identified across your writing. Not diagnoses — observations about what keeps showing up.</p>
            </div>

            <div className="text-[12px] italic text-secondary pb-0.5">
              Patterns surface, shift, and go quiet based on what your entries show. The system doesn't declare anything finished.
            </div>

            {/* Summary strip */}
            <div className="bg-white-paper border border-primary/10 rounded-xl p-5 shadow-xs space-y-3">
              <p className="text-[12.5px] sm:text-xs text-primary leading-relaxed">
                {overview.summary?.sentence || overview.summary || 'Summary across your cycles'}
              </p>
              <div className="flex gap-4 flex-wrap text-xs text-[#4A6A64]">
                {newPatternsAll.length > 0 && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#B8A8D4]" /> {newPatternsAll.length} new
                  </span>
                )}
                {shiftingPatternsAll.length > 0 && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#8DBFB4]" /> {shiftingPatternsAll.length} shifting
                  </span>
                )}
                {quietPatternsAll.length > 0 && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded bg-primary/20 border border-primary/30" /> {quietPatternsAll.length} quiet
                  </span>
                )}
                {presentPatternsAll.length > 0 && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#E0A898]" /> {presentPatternsAll.length} present
                  </span>
                )}
              </div>
            </div>

            {/* Local Search Bar for Observed Patterns */}
            <div className="pt-0.5">
              <SearchInput
                id="patterns-search"
                placeholder="Search your observed patterns..."
                ariaLabel="Search observed patterns"
                value={searchQuery}
                onChange={(val) => setSearchQuery(val)}
                onClear={() => setSearchQuery('')}
                resultCount={query ? filteredPatterns.length : null}
              />
            </div>

            {/* Active Search Result Indicator */}
            {query && filteredPatterns.length > 0 && (
              <div className="flex items-center justify-between text-xs text-mid/90 bg-accent/5 border border-accent/15 rounded-xl px-3.5 py-2">
                <span>
                  Showing <strong className="text-primary font-semibold">{filteredPatterns.length}</strong> {filteredPatterns.length === 1 ? 'pattern' : 'patterns'} matching &ldquo;<strong className="text-accent font-semibold">{searchQuery}</strong>&rdquo;
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

            {/* Empty Search Result State */}
            {query && filteredPatterns.length === 0 && (
              <div className="bg-white-paper border border-primary/10 rounded-xl p-8 text-center space-y-2 shadow-xs">
                <h3 className="text-sm font-semibold text-primary">No patterns match "{searchQuery}"</h3>
                <p className="text-xs text-mid max-w-[380px] mx-auto leading-relaxed">
                  No themes in your journal history match this term. Try searching for broader behavioral terms or clear the search.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-[#654652] transition-colors cursor-pointer border-none"
                  >
                    Clear Search
                  </button>
                </div>
              </div>
            )}

            {/* If zero active, shifting, or new patterns exist (unfiltered), show informative state */}
            {!query && newPatternsAll.length === 0 && 
             shiftingPatternsAll.length === 0 && 
             presentPatternsAll.length === 0 && 
             quietPatternsAll.length > 0 && (
              <div className="bg-white-paper border border-primary/10 rounded-xl p-5 text-center space-y-1.5 shadow-xs">
                <h3 className="text-sm font-semibold text-primary">No active patterns right now</h3>
                <p className="text-xs text-mid max-w-[420px] mx-auto leading-relaxed">
                  Your previously observed patterns are currently quiet in your recent entries. They remain accessible below as part of your longitudinal record.
                </p>
              </div>
            )}

            {/* Pattern Lists Grouped by Category: New, Shifting, Quiet, Present (3 each) */}
            <div className="space-y-5">
              {/* 1. NEW PATTERNS */}
              {newPatterns.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[9.5px] font-bold tracking-widest text-[#B8A8D4] uppercase flex items-center justify-between">
                    <span>New patterns</span>
                    <span className="text-[10px] font-normal text-mid/70">Recently observed ({newPatternsAll.length})</span>
                  </div>
                  {newPatterns.map(p => {
                    const badge = getStatusBadge(p.status || p.lifecycleStatus);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleOpenPattern(p.id)}
                        className="bg-white border border-[#B8A8D4]/20 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-[#B8A8D4]/35 transition-all relative overflow-hidden pl-5 group"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#B8A8D4]" />
                        <div className="flex justify-between items-center mb-1.5">
                          <h3 className="text-[14px] font-bold text-primary group-hover:text-[#8A68B8] transition-colors">
                            <HighlightText text={p.name} query={searchQuery} />
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${badge.className}`}>
                            {badge.text}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#4A6A64] leading-relaxed mb-3">
                          <HighlightText text={p.body} query={searchQuery} />
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-mid/80 mb-2.5">
                          <span className="px-2 py-0.5 bg-mint-grey/70 rounded text-[9.5px] font-medium text-primary">
                            Historical: {p.historicalStrength || 'emerging'}
                          </span>
                          <span className="px-2 py-0.5 bg-mint-grey/70 rounded text-[9.5px] font-medium text-primary">
                            Activity: {p.currentActivity || 'moderate'}
                          </span>
                        </div>

                        {/* Timeline preview */}
                        {p.timeline && p.timeline.length > 0 && (
                          <div className="space-y-1 mb-2.5">
                            <div className="text-[8.5px] tracking-wider uppercase text-[#8DBFB4] font-bold">Across {p.timeline.length} cycles</div>
                            <div className="flex gap-2 flex-wrap">
                              {p.timeline.map((s, idx) => (
                                <div key={idx} className="flex flex-col items-center">
                                  <div className={`w-3 h-3 rounded-full ${dotLabels[s] || dotLabels.absent}`} />
                                  <span className="text-[8px] font-mono text-mid/60 mt-0.5">{idx + 1}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[10.5px] text-mid border-t border-[#1E2A2E]/5 pt-2.5 mt-2.5">
                          <span>{p.meta}</span>
                          <span className="font-semibold text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            See history <ArrowLeft size={11} className="rotate-180" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. SHIFTING PATTERNS */}
              {shiftingPatterns.length > 0 && (
                <div className="space-y-3 pt-1">
                  <div className="text-[9.5px] font-bold tracking-widest text-[#8DBFB4] uppercase flex items-center justify-between">
                    <span>Shifting patterns</span>
                    <span className="text-[10px] font-normal text-mid/70">Changing in focus or intensity ({shiftingPatternsAll.length})</span>
                  </div>
                  {shiftingPatterns.map(p => {
                    const badge = getStatusBadge(p.status || p.lifecycleStatus);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleOpenPattern(p.id)}
                        className="bg-white border border-[#8DBFB4]/25 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-[#8DBFB4]/40 transition-all relative overflow-hidden pl-5 group"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#8DBFB4]" />
                        <div className="flex justify-between items-center mb-1.5">
                          <h3 className="text-[14px] font-bold text-primary group-hover:text-[#2E7A70] transition-colors">
                            <HighlightText text={p.name} query={searchQuery} />
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${badge.className}`}>
                            {badge.text}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#4A6A64] leading-relaxed mb-3">
                          <HighlightText text={p.body} query={searchQuery} />
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-mid/80 mb-2.5">
                          <span className="px-2 py-0.5 bg-mint-grey/70 rounded text-[9.5px] font-medium text-primary">
                            Historical: {p.historicalStrength || 'moderate'}
                          </span>
                          <span className="px-2 py-0.5 bg-mint-grey/70 rounded text-[9.5px] font-medium text-primary">
                            Activity: {p.currentActivity || 'moderate'}
                          </span>
                        </div>

                        {/* Timeline preview */}
                        {p.timeline && p.timeline.length > 0 && (
                          <div className="space-y-1 mb-2.5">
                            <div className="text-[8.5px] tracking-wider uppercase text-[#8DBFB4] font-bold">Across {p.timeline.length} cycles</div>
                            <div className="flex gap-2 flex-wrap">
                              {p.timeline.map((s, idx) => (
                                <div key={idx} className="flex flex-col items-center">
                                  <div className={`w-3 h-3 rounded-full ${dotLabels[s] || dotLabels.absent}`} />
                                  <span className="text-[8px] font-mono text-mid/60 mt-0.5">{idx + 1}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[10.5px] text-mid border-t border-[#1E2A2E]/5 pt-2.5 mt-2.5">
                          <span>{p.meta}</span>
                          <span className="font-semibold text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            See history <ArrowLeft size={11} className="rotate-180" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. QUIET PATTERNS */}
              {quietPatterns.length > 0 && (
                <div className="space-y-3 pt-1">
                  <div className="text-[9.5px] font-bold tracking-widest text-mid uppercase flex items-center justify-between">
                    <span>Quiet patterns</span>
                    <span className="text-[10px] font-normal text-mid/70">Quieter recently ({quietPatternsAll.length})</span>
                  </div>
                  {quietPatterns.map(p => {
                    const badge = getStatusBadge(p.status || p.lifecycleStatus);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleOpenPattern(p.id)}
                        className="bg-white/80 border border-[#1E2A2E]/8 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-[#1E2A2E]/15 transition-all relative overflow-hidden pl-5 group opacity-90"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#1E2A2E]/15" />
                        <div className="flex justify-between items-center mb-1.5">
                          <h3 className="text-[14px] font-bold text-primary/85 group-hover:text-primary transition-colors">
                            <HighlightText text={p.name} query={searchQuery} />
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${badge.className}`}>
                            {badge.text}
                          </span>
                        </div>
                        <p className="text-[12px] text-mid leading-relaxed mb-3">
                          <HighlightText text={p.body} query={searchQuery} />
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-mid/70 mb-2.5">
                          <span className="px-2 py-0.5 bg-mint-grey/60 rounded text-[9.5px] font-medium text-primary/80">
                            Historical: {p.historicalStrength || 'moderate'}
                          </span>
                          <span className="px-2 py-0.5 bg-mint-grey/60 rounded text-[9.5px] font-medium text-primary/80">
                            Activity: Low (Quiet)
                          </span>
                        </div>

                        {/* Timeline preview */}
                        {p.timeline && p.timeline.length > 0 && (
                          <div className="space-y-1 mb-2.5">
                            <div className="text-[8.5px] tracking-wider uppercase text-mid/60 font-bold">Across {p.timeline.length} cycles</div>
                            <div className="flex gap-2 flex-wrap">
                              {p.timeline.map((s, idx) => (
                                <div key={idx} className="flex flex-col items-center">
                                  <div className={`w-3 h-3 rounded-full ${dotLabels[s] || dotLabels.absent}`} />
                                  <span className="text-[8px] font-mono text-mid/60 mt-0.5">{idx + 1}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[10.5px] text-mid/70 border-t border-[#1E2A2E]/5 pt-2.5 mt-2.5">
                          <span>{p.meta}</span>
                          <span className="font-semibold text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            See history <ArrowLeft size={11} className="rotate-180" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 4. PRESENT PATTERNS */}
              {presentPatterns.length > 0 && (
                <div className="space-y-3 pt-1">
                  <div className="text-[9.5px] font-bold tracking-widest text-[#E0A898] uppercase flex items-center justify-between">
                    <span>Present patterns</span>
                    <span className="text-[10px] font-normal text-mid/70">Sustained evidence ({presentPatternsAll.length})</span>
                  </div>
                  {presentPatterns.map(p => {
                    const badge = getStatusBadge(p.status || p.lifecycleStatus);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleOpenPattern(p.id)}
                        className="bg-white border border-[#1E2A2E]/8 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-[#1E2A2E]/15 transition-all relative overflow-hidden pl-5 group"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#E0A898]" />
                        <div className="flex justify-between items-center mb-1.5">
                          <h3 className="text-[14px] font-bold text-primary group-hover:text-[#E0A898] transition-colors">
                            <HighlightText text={p.name} query={searchQuery} />
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${badge.className}`}>
                            {badge.text}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#4A6A64] leading-relaxed mb-3">
                          <HighlightText text={p.body} query={searchQuery} />
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-mid/80 mb-2.5">
                          <span className="px-2 py-0.5 bg-mint-grey/70 rounded text-[9.5px] font-medium text-primary">
                            Historical: {p.historicalStrength || 'moderate'}
                          </span>
                          <span className="px-2 py-0.5 bg-mint-grey/70 rounded text-[9.5px] font-medium text-primary">
                            Activity: {p.currentActivity || 'high'}
                          </span>
                        </div>

                        {/* Timeline preview */}
                        {p.timeline && p.timeline.length > 0 && (
                          <div className="space-y-1 mb-2.5">
                            <div className="text-[8.5px] tracking-wider uppercase text-[#8DBFB4] font-bold">Across {p.timeline.length} cycles</div>
                            <div className="flex gap-2 flex-wrap">
                              {p.timeline.map((s, idx) => (
                                <div key={idx} className="flex flex-col items-center">
                                  <div className={`w-3 h-3 rounded-full ${dotLabels[s] || dotLabels.absent}`} />
                                  <span className="text-[8px] font-mono text-mid/60 mt-0.5">{idx + 1}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[10.5px] text-mid border-t border-[#1E2A2E]/5 pt-2.5 mt-2.5">
                          <span>{p.meta}</span>
                          <span className="font-semibold text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            See history <ArrowLeft size={11} className="rotate-180" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* BY CYCLE ACCORDIONS */}
            {overview?.snapshots && overview.snapshots.length > 0 && (
              <div className="space-y-3 pt-4 text-left">
                <div className="text-[10px] font-bold tracking-widest text-[#8DBFB4] uppercase">By cycle</div>
                
                <div className="space-y-2.5">
                  {[...overview.snapshots]
                    .sort((a, b) => b.cycle_number - a.cycle_number)
                    .map((snap) => {
                      const cycleNum = snap.cycle_number;
                      const isOpen = !!listExpandedCycles[cycleNum];
                      const snapPatterns = snap.snapshot_data?.patterns || [];
                      const activePats = snapPatterns.filter(p => p.status !== 'absent' && p.status !== 'quiet').slice(0, 3);
                      const milestoneLabel = `Cycle ${cycleNum}`;
                      const formattedDate = snap.updated_at ? new Date(snap.updated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '';
                      const borderColors = {
                        present: 'bg-[#E0A898]',
                        new: 'bg-[#B8A8D4]',
                        shifting: 'bg-[#8DBFB4]',
                        quiet: 'bg-primary/20',
                        returned: 'bg-[#E0A898]'
                      };

                      return (
                        <div 
                          key={snap.id} 
                          className="bg-white border border-[#1E2A2E]/10 rounded-xl overflow-hidden shadow-xs"
                        >
                          <div 
                            onClick={() => toggleListCycleCard(cycleNum)}
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#F8FAFA] transition-colors"
                          >
                            <div className="flex-1 pr-4">
                              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                                <span className="text-[12px] font-bold text-primary">{milestoneLabel}</span>
                                {formattedDate && (
                                  <span className="text-[10px] text-mid/60">{formattedDate}</span>
                                )}
                              </div>
                              {/* Horizontal preview list of pattern tags */}
                              <div className="flex gap-1.5 flex-wrap">
                                {activePats.map((p, pIdx) => {
                                  const dotColor = dotLabels[p.status] || dotLabels.present;
                                  return (
                                    <span key={pIdx} className="text-[10.5px] font-medium px-2 py-0.5 rounded bg-mint-grey/50 text-[#4A6A64] border border-[#1E2A2E]/5 flex items-center gap-1.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                                      {p.pattern_name || p.name}
                                    </span>
                                  );
                                })}
                                {activePats.length === 0 && (
                                  <span className="text-[11px] text-mid/60 italic">No patterns active this cycle.</span>
                                )}
                              </div>
                            </div>
                            <ChevronDown size={14} className={`text-[#4A6A64] transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                          </div>

                          {isOpen && (
                            <div className="border-t border-[#1E2A2E]/5 p-4.5 bg-[#FAFBFB] space-y-3.5">
                              {activePats.map((p, pIdx) => {
                                const badge = getStatusBadge(p.status);
                                const details = overview.patterns.find(op => op.name.toLowerCase() === (p.pattern_name || p.name).toLowerCase());
                                return (
                                  <div 
                                    key={pIdx}
                                    className="bg-white border border-[#1E2A2E]/5 p-3.5 rounded-xl space-y-2 relative overflow-hidden pl-4 group hover:shadow-sm transition-all"
                                    onClick={(e) => {
                                      if (details) {
                                        e.stopPropagation();
                                        handleOpenPattern(details.id);
                                      }
                                    }}
                                    style={{ cursor: details ? 'pointer' : 'default' }}
                                  >
                                    <div className={`absolute left-0 top-0 bottom-0 w-[2.5px] ${borderColors[p.status] || 'bg-[#E0A898]'}`} />
                                    <div className="flex justify-between items-start gap-2">
                                      <h4 className="text-[13px] font-bold text-primary group-hover:text-[#E0A898] transition-colors">
                                        {p.pattern_name || p.name}
                                      </h4>
                                      <span className={`px-2 py-0.5 rounded text-[8.5px] font-semibold uppercase shrink-0 ${badge.className}`}>
                                        {badge.text}
                                      </span>
                                    </div>
                                    
                                    {p.summary && (
                                      <p className="text-[12px] text-mid leading-relaxed italic">
                                        "{p.summary}"
                                      </p>
                                    )}

                                    {p.why_it_matters && (
                                      <div className="text-[11.5px] text-[#4A6A64] font-serif leading-relaxed">
                                        {p.why_it_matters}
                                      </div>
                                    )}

                                    {/* Supporting vocabulary */}
                                    {p.supporting_vocabulary && p.supporting_vocabulary.length > 0 && (
                                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                        <span className="text-[9px] font-bold tracking-wider uppercase text-mid/60 shrink-0">Vocabulary:</span>
                                        {p.supporting_vocabulary.map((v, vIdx) => (
                                          <span key={vIdx} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1E2A2E]/5 text-[#4A6A64] border border-[#1E2A2E]/10">
                                            {v}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {/* Supporting journal quotes */}
                                    {p.supporting_entries && p.supporting_entries.length > 0 && (
                                      <div className="space-y-1.5 pt-1.5 border-t border-[#1E2A2E]/5">
                                        <div className="text-[9px] font-bold tracking-wider uppercase text-mid/60">Journal Quotes</div>
                                        {p.supporting_entries.map((q, qIdx) => (
                                          <p key={qIdx} className="text-[11.5px] text-primary italic leading-relaxed pl-2 border-l-2 border-[#8DBFB4]/40 font-serif">
                                            "{q}"
                                          </p>
                                        ))}
                                      </div>
                                    )}

                                    {details && (
                                      <div className="text-[10px] font-semibold text-[#8DBFB4] hover:text-[#2E7A70] text-right select-none pt-1">
                                        See full pattern history →
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Pattern Detail Screen */}
        {viewState === 'detail' && activePatternId && (
          <div className="space-y-4 max-w-[620px] mx-auto page-fade-enter-active">
            <button
              onClick={() => setViewState('list')}
              className="flex items-center gap-2 text-xs font-semibold text-[#4A6A64] hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
            >
              <ArrowLeft size={14} /> Back to patterns
            </button>

            {detailLoading || !activePatternDetail ? (
              <div className="animate-pulse space-y-4">
                <div className="h-24 bg-white border border-[#1E2A2E]/10 rounded-xl" />
                <div className="h-16 bg-white border border-[#1E2A2E]/10 rounded-xl" />
                <div className="h-32 bg-white border border-[#1E2A2E]/10 rounded-xl" />
              </div>
            ) : (
              <>
                {/* Pattern Card Header */}
                <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4 shadow-xs space-y-2.5">
                  <div className="flex justify-between items-start">
                    <h2 className="font-serif text-lg text-primary">{activePatternDetail.name}</h2>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${activePatternDetail.badgeClass}`}>
                      {getStatusBadge(activePatternDetail.status).text}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-mid leading-relaxed">
                    {activePatternDetail.body}
                  </p>
                  <div className="text-[10.5px] text-[#8DBFB4] border-t border-[#1E2A2E]/5 pt-2.5 font-medium">
                    {activePatternDetail.meta}
                  </div>
                </div>

                {/* Orientation */}
                {activePatternDetail.orientation && (
                  <div className="bg-white border border-[#1E2A2E]/5 p-4 rounded-xl border-l-[2.5px] border-l-[#E0A898] space-y-1 font-serif text-[14px] text-[#1E2A2E] italic leading-relaxed">
                    {activePatternDetail.orientation}
                  </div>
                )}

                {/* Connection panel */}
                {activePatternDetail.connected && (
                  <div className="bg-white border border-[#B8A8D4]/25 rounded-xl p-4 flex gap-2.5 shadow-xs">
                    <div className="w-7 h-7 rounded-lg bg-[#B8A8D4]/10 text-[#5A4A8A] flex items-center justify-center shrink-0 mt-0.5">
                      <Link2 size={14} />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="text-[9px] tracking-wider uppercase text-[#7A6A9E] font-bold">May be connected</div>
                      <p className="text-[12px] text-primary leading-relaxed">
                        {activePatternDetail.connectedBody}
                      </p>
                      <div className="flex gap-2 flex-wrap pt-0.5">
                        {activePatternDetail.connectedLinks.map(link => (
                          <button
                            key={link.id}
                            onClick={() => handleOpenPattern(link.id)}
                            className="px-2.5 py-0.5 rounded-full bg-[#B8A8D4]/10 text-[#5A4A8A] border border-[#B8A8D4]/20 text-[10.5px] font-semibold hover:bg-[#B8A8D4]/20 transition-all cursor-pointer"
                          >
                            {link.label} →
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive timeline dots */}
                <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">
                    How it has moved — tap a cycle to jump to it
                  </div>
                  <div className="overflow-x-auto pb-1.5 no-scrollbar">
                    <div className="flex min-w-max">
                      {activePatternDetail.timeline.map((item, idx) => {
                        const isCardEmpty = activePatternDetail.cycleData[item.n]?.entries.length === 0 &&
                          activePatternDetail.cycleData[item.n]?.obs.includes('Not present');
                        return (
                          <div
                            key={idx}
                            onClick={() => !isCardEmpty && jumpToCycleCard(item.n)}
                            className={`flex flex-col items-center w-[48px] relative ${isCardEmpty ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer group'}`}
                          >
                            {/* Horizontal connecting line */}
                            {idx < activePatternDetail.timeline.length - 1 && (
                              <div className="absolute top-[11px] left-[24px] right-[-24px] h-[2px] bg-[#1E2A2E]/5 z-0" />
                            )}
                            <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center z-10 transition-transform ${dotLabels[item.s] || dotLabels.absent} ${!isCardEmpty ? 'group-hover:scale-115' : ''}`}>
                              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                            </div>
                            <span className="text-[9px] font-bold text-primary mt-1">{`C${item.n}`}</span>
                            <span className="text-[7.5px] uppercase font-mono text-mid/60 mt-0.5 leading-none">
                              {item.l}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[9px] text-[#4A6A64] border-t border-[#1E2A2E]/5 pt-2.5">
                    {legendItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cycle details list */}
                <div className="space-y-3">
                  <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">
                    Timeline — all {activePatternDetail.timeline.length} observations
                  </div>
                  <div className="space-y-2.5">
                    {Object.keys(activePatternDetail.cycleData)
                      .map(Number)
                      .sort((a, b) => b - a)
                      .map((cycleNum, idx) => {
                        const cd = activePatternDetail.cycleData[cycleNum];
                        const isAbsent = cd.obs.includes('Not present');
                        const isCur = cycleNum === activePatternDetail.timeline.length;
                        const timelineItem = activePatternDetail.timeline.find(t => t.n === cycleNum);
                        const timelineStatus = timelineItem ? timelineItem.s : 'absent';
                        const timelineLabel = timelineItem ? timelineItem.l : 'Not present';
                        const isExpanded = !!expandedCycles[idx];

                        return (
                          <div
                            key={idx}
                            id={`cycle-card-${idx}`}
                            className={`bg-white border border-[#1E2A2E]/8 rounded-xl overflow-hidden transition-all shadow-xs ${isAbsent ? 'opacity-55' : ''}`}
                          >
                            <div
                              onClick={() => !isAbsent && toggleCycleCard(idx)}
                              className={`flex items-center justify-between p-3.5 transition-colors ${isAbsent ? 'cursor-default' : 'cursor-pointer hover:bg-[#F5F8F8]'}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${isCur ? 'bg-[#e0a898]/12 text-[#8a3020]' : 'bg-mint-grey text-primary'}`}>
                                  {isCur ? 'Current' : 'Done'}
                                </span>
                                  <span className="text-[13px] font-bold text-primary">{`Cycle ${cycleNum}`}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${dotLabels[timelineStatus] || dotLabels.absent}`}>
                                  {timelineLabel}
                                </span>
                                {!isAbsent && (
                                  <ChevronDown size={14} className={`text-mid transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                )}
                              </div>
                            </div>

                            {isExpanded && !isAbsent && (
                              <div className="border-t border-[#1E2A2E]/5 p-4 bg-[#FAFBFB] space-y-3">
                                <div className="text-[12.5px] text-mid leading-relaxed italic">
                                  "{cd.obs}"
                                </div>

                                {cd.entries && cd.entries.length > 0 && (
                                  <div className="space-y-2.5 border-t border-[#1E2A2E]/5 pt-3">
                                    <div className="text-[8.5px] tracking-wider uppercase text-[#8DBFB4] font-bold">From the entries</div>
                                    {cd.entries.map((ent, entIdx) => (
                                      <div key={entIdx} className="bg-white border border-[#1E2A2E]/5 p-3.5 rounded-lg space-y-1">
                                        <p className="text-[12.5px] text-[#1E2A2E] italic leading-relaxed font-serif">
                                          {ent.t}
                                        </p>
                                        <div className="text-[10px] text-[#C0D4CE]">{ent.m}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {isAbsent && (
                              <div className="border-t border-[#1E2A2E]/5 px-4 py-2.5 bg-[#FAFBFB] text-xs text-[#8DBFB4] italic">
                                {cd.obs}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
