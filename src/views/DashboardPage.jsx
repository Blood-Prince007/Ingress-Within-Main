import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ChevronRight, 
  RotateCw, 
  FileText, 
  Smile, 
  TrendingUp, 
  HeartHandshake, 
  CheckCircle2, 
  Plus, 
  CornerDownRight, 
  Settings, 
  User, 
  ArrowLeft,
  X,
  Lock,
  ArrowRight,
  Sparkles,
  PenLine,
  AlertCircle,
  ChevronDown,
  MessageSquare,
  Loader2,
  Compass
} from 'lucide-react';
import { DashboardService } from '../services/dashboardService';
import DashboardNavbar from '../components/DashboardNavbar';
import { ThreadResponseModal } from '../components/ThreadResponseModal';
import { ReflectionModal } from '../components/ReflectionModal';
import { AssessmentModal } from '../components/AssessmentModal';
import PsychoeducationRecommendationCard from '../components/dashboard/PsychoeducationRecommendationCard';

export default function DashboardPage({ user, profile, onSignOut }) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  // Interactive writing state
  const [isWritingSession, setIsWritingSession] = useState(false);
  const [writingMode, setWritingMode] = useState('fresh'); // 'fresh' | 'continue'
  const [entryText, setEntryText] = useState('');
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [entrySavedSuccess, setEntrySavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  // Interactive thread responding state
  const [activeThread, setActiveThread] = useState(null);
  const [threadResponse, setThreadResponse] = useState('');
  const [isSavingThread, setIsSavingThread] = useState(false);
  const [dailySessionState, setDailySessionState] = useState(null);
  const [threadsList, setThreadsList] = useState([]);
  const [vocabStats, setVocabStats] = useState(null);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [patternsOverview, setPatternsOverview] = useState(null);
  const [customerAccess, setCustomerAccess] = useState(null);

  // Reflection response states
  const [reflectionModalOpen, setReflectionModalOpen] = useState(false);
  const [reflectionToAnswer, setReflectionToAnswer] = useState(null);
  const [reflectionEntry, setReflectionEntry] = useState(null);
  const [reflectionAnswerText, setReflectionAnswerText] = useState('');
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [reflectionSaveError, setReflectionSaveError] = useState(null);
  // Cycle Engine states
  const [cycleInfo, setCycleInfo] = useState(null);
  const [cyclesList, setCyclesList] = useState([]);
  const [expandedCycles, setExpandedCycles] = useState({});
  const [expandedCycleEntries, setExpandedCycleEntries] = useState({});
  const [isAssessmentGate, setIsAssessmentGate] = useState(false);
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const [assessmentAnswers, setAssessmentAnswers] = useState({ q1: '', q2: '', q3: '' });
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  const [assessmentError, setAssessmentError] = useState(null);
  const [therapyModalOpen, setTherapyModalOpen] = useState(false);

  const loadCycleDetails = async (cycleId) => {
    try {
      const detailedCycle = await DashboardService.fetchCycleDetails(cycleId);
      setCyclesList((prevList) => 
        prevList.map((c) => (c.id === cycleId ? { ...c, ...detailedCycle } : c))
      );
    } catch (err) {
      console.warn(`Failed to fetch details for cycle ${cycleId}:`, err);
    }
  };

  const loadData = async (force = true) => {
    setIsLoading(true);
    setError(null);
    try {
      const [result, vStats, cycles, reports, patterns, accessData] = await Promise.all([
        DashboardService.fetchDashboardData(force).catch((err) => {
          console.error('fetchDashboardData failed:', err);
          return null;
        }),
        DashboardService.fetchVocabOverview(force).catch(() => null),
        DashboardService.fetchCyclesList(force).catch(() => []),
        DashboardService.fetchWeeklyReports(undefined, force).catch(() => []),
        DashboardService.fetchPatternOverview(force).catch(() => null),
        fetch('/api/billing/access').then((r) => r.json()).catch(() => null)
      ]);

      setData(result);
      setDailySessionState(result?.sessionState || null);
      setThreadsList(result?.threads || []);
      setVocabStats(vStats);
      setWeeklyReports(reports);
      setPatternsOverview(patterns);
      if (accessData?.success && accessData?.access) {
        setCustomerAccess(accessData.access);
      }

      // Check for unanswered reflection on the most recent entry
      if (result && result.entries && result.entries.length > 0) {
        const latestEntry = result.entries[0];
        const reflection = latestEntry.reflection;

        if (reflection && (reflection.status === 'ready' || reflection.reflection_text) && !reflection.reflection_answer) {
          setReflectionToAnswer({
            ...reflection,
            closing_question: reflection.closing_question || "What is feeling the most steady or grounding for you right now?"
          });
          setReflectionEntry(latestEntry);
          setReflectionAnswerText('');
        } else {
          setReflectionToAnswer(null);
          setReflectionEntry(null);
        }
      } else {
        setReflectionToAnswer(null);
        setReflectionEntry(null);
      }

      if (result?.cycleStatus?.success && result?.cycleStatus?.hasCycle) {
        setCycleInfo(result.cycleStatus.cycle);
        setIsAssessmentGate(result.cycleStatus.isAssessmentGate);
      } else {
        setCycleInfo(null);
        setIsAssessmentGate(false);
      }

      setCyclesList(cycles);
      
      // Auto-expand the active cycle or the first one and fetch its details
      const activeCycle = cycles.find((c) => c.status === 'ACTIVE');
      if (activeCycle) {
        setExpandedCycles((prev) => ({ ...prev, [activeCycle.id]: true }));
        loadCycleDetails(activeCycle.id);
      } else if (cycles.length > 0) {
        setExpandedCycles((prev) => ({ ...prev, [cycles[0].id]: true }));
        loadCycleDetails(cycles[0].id);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount and subscribe to background SWR updates
  useEffect(() => {
    loadData();

    const unsubDashboard = DashboardService.subscribe('dashboard_data', (freshData) => {
      setData(freshData);
      if (freshData && freshData.entries && freshData.entries.length > 0) {
        const latestEntry = freshData.entries[0];
        const reflection = latestEntry.reflection;

        if (reflection && (reflection.status === 'ready' || reflection.reflection_text) && !reflection.reflection_answer) {
          setReflectionToAnswer({
            ...reflection,
            closing_question: reflection.closing_question || "What is feeling the most steady or grounding for you right now?"
          });
          setReflectionEntry(latestEntry);
          setReflectionAnswerText('');
        } else {
          setReflectionToAnswer(null);
          setReflectionEntry(null);
        }
      } else {
        setReflectionToAnswer(null);
        setReflectionEntry(null);
      }
    });

    const unsubVocab = DashboardService.subscribe('vocab_overview', (freshVocab) => {
      setVocabStats(freshVocab);
    });

    const unsubCycleStatus = DashboardService.subscribe('cycle_status', (freshStatus) => {
      if (freshStatus.success && freshStatus.hasCycle) {
        setCycleInfo(freshStatus.cycle);
        setIsAssessmentGate(freshStatus.isAssessmentGate);
      }
    });

    const unsubSessionState = DashboardService.subscribe('session_state', (freshSession) => {
      setDailySessionState(freshSession);
    });

    const unsubThreads = DashboardService.subscribe('active_threads', (freshThreads) => {
      setThreadsList(freshThreads || []);
    });

    const unsubCyclesList = DashboardService.subscribe('cycles_list', (freshCycles) => {
      setCyclesList((prevList) => {
        return freshCycles.map((freshCycle) => {
          const existingCycle = prevList.find(c => c.id === freshCycle.id);
          if (existingCycle) {
            return {
              ...freshCycle,
              entries: existingCycle.entries !== null ? existingCycle.entries : freshCycle.entries,
              entries_count: Math.max(freshCycle.entries_count || 0, existingCycle.entries_count || 0),
              open_threads_count: existingCycle.open_threads_count || freshCycle.open_threads_count,
              weekly_summaries_count: existingCycle.weekly_summaries_count || freshCycle.weekly_summaries_count,
              vocabulary_count: existingCycle.vocabulary_count || freshCycle.vocabulary_count
            };
          }
          return freshCycle;
        });
      });
    });

    const unsubWeeklyReports = DashboardService.subscribe('weekly_reports_all', (freshReports) => {
      setWeeklyReports(freshReports || []);
    });

    const unsubPatterns = DashboardService.subscribe('patterns_overview', (freshPatterns) => {
      setPatternsOverview(freshPatterns);
    });

    return () => {
      unsubDashboard();
      unsubVocab();
      unsubCycleStatus();
      unsubSessionState();
      unsubThreads();
      unsubCyclesList();
      unsubWeeklyReports();
      unsubPatterns();
    };
  }, []);

  // Short polling when entries are in "Processing AI..." state
  useEffect(() => {
    const hasProcessingEntry = data?.entries?.some(e => e.reflectionStatus === 'Processing AI...') || false;
    if (!hasProcessingEntry) return;

    const interval = setInterval(() => {
      console.log('[Dashboard Page] Polling for completed background processing...');
      loadData();
    }, 4000);

    return () => clearInterval(interval);
  }, [data]);

  // Compute time-of-day greeting
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = profile?.full_name || user?.name || 'Arjun';

  const handleStartWriting = (mode) => {
    if (isAssessmentGate) {
      handleOpenAssessmentModal();
      return;
    }
    window.navigateTo(`/write?mode=${mode}`);
  };

  const handleSaveEntry = async () => {
    if (entryText.trim().split(/\s+/).filter(Boolean).length < 5) return;
    setIsSavingEntry(true);
    try {
      await DashboardService.saveJournalEntry(entryText);
      const result = await DashboardService.fetchDashboardData();
      setData(result);
      setEntrySavedSuccess(true);
    } catch (err) {
      console.error('Failed to save entry:', err);
      setSaveError(err.message || String(err));
    } finally {
      setIsSavingEntry(false);
    }
  };

  const handleOpenThread = (thread) => {
    if (isAssessmentGate) {
      handleOpenAssessmentModal();
      return;
    }
    setActiveThread(thread);
    setThreadResponse('');
  };

  const handleSaveThreadResponse = async () => {
    if (!threadResponse.trim()) return;
    setIsSavingThread(true);
    try {
      await DashboardService.submitThreadResponse(activeThread.id, threadResponse);
      const result = await DashboardService.fetchDashboardData();
      setData(result);
      setActiveThread(null);
    } catch (err) {
      console.error('Failed to save thread response:', err);
    } finally {
      setIsSavingThread(false);
    }
  };

  const handleOpenReflectionModal = () => {
    if (isAssessmentGate) {
      handleOpenAssessmentModal();
      return;
    }
    setReflectionModalOpen(true);
    setReflectionSaveError(null);
  };

  const handleOpenReflectionForEntry = (entry) => {
    const virtualReflection = {
      id: entry.reflectionId,
      reflection_text: entry.reflectionText,
      closing_question: entry.closingQuestion,
      reflection_answer: entry.reflectionAnswer,
      status: entry.reflectionStatus === 'Pending Response' ? 'ready' : 'completed'
    };
    setReflectionToAnswer(virtualReflection);
    setReflectionEntry(entry);
    setReflectionAnswerText(entry.reflectionAnswer || '');
    setReflectionModalOpen(true);
    setReflectionSaveError(null);
  };

  const handleSaveReflection = async () => {
    if (!reflectionAnswerText.trim() || !reflectionToAnswer) return;
    setIsSavingReflection(true);
    setReflectionSaveError(null);
    try {
      await DashboardService.submitReflectionAnswer(reflectionToAnswer.id, reflectionAnswerText, 'completed');
      setReflectionModalOpen(false);
      setReflectionToAnswer(null);
      setReflectionAnswerText('');
      const result = await DashboardService.fetchDashboardData();
      setData(result);
      
      // Reload details for all currently expanded cycles to ensure UI matches
      Object.keys(expandedCycles).forEach(cycleId => {
        if (expandedCycles[cycleId]) {
          loadCycleDetails(cycleId);
        }
      });
    } catch (err) {
      console.error('Failed to save reflection answer:', err);
      setReflectionSaveError(err.message || String(err));
    } finally {
      setIsSavingReflection(false);
    }
  };

  const toggleCycleExpanded = async (cycleId) => {
    const isExpanding = !expandedCycles[cycleId];
    setExpandedCycles((prev) => ({
      ...prev,
      [cycleId]: isExpanding
    }));

    if (isExpanding) {
      const cycle = cyclesList.find((c) => c.id === cycleId);
      if (cycle && cycle.entries === null) {
        await loadCycleDetails(cycleId);
      }
    }
  };

  const toggleCycleEntriesExpanded = (cycleId) => {
    setExpandedCycleEntries((prev) => ({
      ...prev,
      [cycleId]: !prev[cycleId]
    }));
  };

  const handleOpenAssessmentModal = () => {
    setAssessmentModalOpen(true);
    setAssessmentAnswers({ q1: '', q2: '', q3: '' });
    setAssessmentError(null);
  };

  const handleSaveAssessment = async () => {
    if (!assessmentAnswers.q1.trim() || !assessmentAnswers.q2.trim() || !assessmentAnswers.q3.trim()) {
      setAssessmentError('Please provide answers for all three reflection prompts.');
      return;
    }
    setIsSubmittingAssessment(true);
    setAssessmentError(null);
    try {
      await DashboardService.submitCycleAssessment(assessmentAnswers);
      setAssessmentModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to submit cycle transition assessment:', err);
      setAssessmentError(err.message || String(err));
    } finally {
      setIsSubmittingAssessment(false);
    }
  };
 
  // Render error screen if load failed
  if (error) {
    return (
      <div className="min-h-screen bg-mint-grey text-primary font-sans relative pb-20">
        <DashboardNavbar activeTab="home" />
        <main className="max-w-md mx-auto px-6 pt-20 text-center space-y-6">
          <div className="flex justify-center">
            <svg className="w-12 h-12 text-[#b45309]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl text-primary font-normal">Failed to Load Dashboard</h2>
          <p className="text-mid font-light text-sm leading-relaxed">
            We had trouble loading your entries and threads. Please check your connection and try again.
          </p>
          {error.message && (
            <div className="bg-[#fef3c7] border border-[#f59e0b]/20 text-[#92400e] text-[11px] font-mono p-3 rounded break-all text-left max-w-xs mx-auto">
              {error.message.includes('DATABASE_ERROR') || error.message.includes('PGRST') || error.message.includes('Failed to fetch')
                ? 'We could not establish a connection to the server or database. Please check your network.' 
                : error.message}
            </div>
          )}
          <button 
            onClick={loadData}
            className="px-6 py-2.5 bg-primary hover:bg-[#2A3A3E] text-mint-grey rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs inline-flex items-center space-x-2 border-none"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </main>
      </div>
    );
  }

  // Render skeleton loader
  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  // Active open threads
  const openThreads = threadsList.filter(t => t.status !== 'CLOSED');
  const addressedThreads = threadsList.filter(t => t.status === 'CLOSED');
  
  // Yesterday's entry preview (if exists)
  const yesterdayEntry = data.entries[0]?.text || '';
  const yesterdayPreview = yesterdayEntry.length > 80 ? yesterdayEntry.substring(0, 80) + '...' : yesterdayEntry;

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans relative pb-20 sm:pb-24">
      {/* Meditative Top Navbar */}
      <DashboardNavbar activeTab="home" />

      {/* Main Page Layout */}
      <main className="max-w-[1140px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        
        {/* Centralized Billing & Access Control Banner */}
        {customerAccess?.banner && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left border ${
              customerAccess.state === 'DORMANT'
                ? 'bg-[#1E2A2E]/5 border-[#1E2A2E]/15 text-primary'
                : customerAccess.state === 'PAST_DUE'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : customerAccess.state === 'CANCELLED_PENDING'
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-[#8DBFB4]/10 border-[#8DBFB4]/30 text-primary'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 border border-current/20">
                  {customerAccess.state === 'DORMANT' ? 'Read-Only Mode' : customerAccess.state === 'TRIAL' ? '7-Day Free Trial' : customerAccess.state === 'PAST_DUE' ? 'Payment Alert' : 'Membership Notice'}
                </span>
              </div>
              <p className="font-medium text-xs sm:text-[13px] leading-relaxed">{customerAccess.banner.message}</p>
            </div>
            {customerAccess.banner.ctaText && (
              <button
                onClick={() => window.navigateTo(customerAccess.banner.ctaHref || '/settings')}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-primary text-white hover:bg-primary/90 transition-all shrink-0 cursor-pointer shadow-xs"
              >
                {customerAccess.banner.ctaText}
              </button>
            )}
          </motion.div>
        )}

        {/* Welcome Section */}
        <section className="space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-secondary font-semibold">{getGreeting()}</div>
          <h1 className="font-serif text-[26px] sm:text-[28px] text-primary font-normal">Welcome back, {displayName}.</h1>
          <p className="text-xs sm:text-[13px] text-mid">
            Cycle {cycleInfo ? cycleInfo.cycleNumber : data.cycleInfo.cycleNumber} · Day {cycleInfo ? cycleInfo.currentDay : data.cycleInfo.currentDay} of {cycleInfo ? cycleInfo.totalDays : data.cycleInfo.totalDays} · {cycleInfo ? (cycleInfo.status === 'COMPLETED' ? 'Cycle Completed' : (data.cycleInfo.hasWrittenToday ? 'You wrote today' : "Ready for today's reflection")) : (data.cycleInfo.hasWrittenToday ? 'You wrote today' : "Ready for today's reflection")}
          </p>
        </section>

        {/* Sleek Upcoming Clinical Support Announcement Strip */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setTherapyModalOpen(true)}
          className="w-full bg-white/90 hover:bg-white border border-primary/10 hover:border-accent/40 rounded-xl px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setTherapyModalOpen(true);
            }
          }}
          title="Click to view details about upcoming 1-on-1 Clinical Support"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 text-accent group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-3.5 h-3.5" />
            </div>
            
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-xs sm:text-[13px] text-primary shrink-0">
                1-on-1 Clinical Support
              </span>
              <span className="text-primary/20 hidden md:inline">•</span>
              <span className="text-xs text-mid font-light truncate hidden sm:inline">
                Direct matching with licensed therapists is launching soon
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] font-bold text-accent uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20">
              Coming Soon
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-mid group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
          </div>
        </motion.div>

        {/* Current Cycle Card */}
        {cycleInfo && (
          <div className="bg-white border border-primary/10 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between text-left shadow-xs gap-5">
            <div className="flex items-center gap-5">
              {/* Progress Ring */}
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="#1E2A2E"
                    strokeWidth="3.5"
                    fill="transparent"
                    className="opacity-10"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="#8DBFB4"
                    strokeWidth="3.5"
                    fill="transparent"
                    strokeDasharray={150.8}
                    strokeDashoffset={150.8 - (150.8 * (cycleInfo.progressPercentage || 0)) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-primary">
                  {cycleInfo.progressPercentage || 0}%
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-bold text-secondary uppercase tracking-widest">Current Cycle</span>
                <h2 className="font-serif text-lg text-primary font-normal">Cycle {cycleInfo.cycleNumber}</h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mid">
                  <span>Day {cycleInfo.currentDay} of {cycleInfo.totalDays}</span>
                  <span className="text-primary/20">•</span>
                  <span>{cycleInfo.daysRemaining} days remaining</span>
                  {cycleInfo.streak > 0 && (
                    <>
                      <span className="text-primary/20">•</span>
                      <span className="flex items-center gap-0.5 text-milestone font-medium">🔥 {cycleInfo.streak} day streak</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 sm:text-right">
              <div className="flex flex-col sm:items-end space-y-0.5">
                <span className="text-[8px] font-semibold text-secondary uppercase tracking-widest">Consistency</span>
                <span className="font-serif text-base text-primary font-normal">{cycleInfo.writingConsistency}% of days written</span>
              </div>
            </div>
          </div>
        )}

        {/* Persisted Monthly Psychoeducation Recommendation */}
        <PsychoeducationRecommendationCard
          cycleId={cycleInfo?.id || 'latest'}
          onNavigateToModule={(id) => {
            window.navigateTo(`/modules/${id}`);
          }}
        />



        {/* Responsive Desktop 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Main Workspace (Left 2 Columns) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Unanswered Reflection Reminder Card */}
            {reflectionToAnswer && !isAssessmentGate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white-paper border border-accent/30 rounded-xl p-5 sm:p-6 shadow-xs relative overflow-hidden pl-6 sm:pl-7 text-left space-y-4"
              >
                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-accent" />
                
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-semibold text-accent uppercase tracking-widest">Reflection Continuity</span>
                    <h3 className="text-[13.5px] font-semibold text-primary">You have an unanswered reflection from your last entry.</h3>
                  </div>
                  {data?.entries?.[0]?.date && (
                    <span className="text-[9.5px] text-mid/60 lowercase">
                      {data.entries[0].date}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="font-serif italic text-[14px] text-accent leading-relaxed">
                    "{reflectionToAnswer.closing_question}"
                  </p>
                  
                  {reflectionToAnswer.reflection_text && (
                    <div className="bg-accent/6 border border-accent/15 rounded-lg p-2.5 flex items-start gap-2">
                      <Sparkles size={11} className="text-accent mt-0.5 shrink-0" />
                      <p className="text-[11.5px] text-mid leading-relaxed font-normal">
                        <span className="font-semibold text-primary/80">Context:</span> {reflectionToAnswer.reflection_text.length > 120 ? reflectionToAnswer.reflection_text.substring(0, 120) + '...' : reflectionToAnswer.reflection_text}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleOpenReflectionModal}
                      className="px-4 py-2 bg-accent text-white hover:bg-[#654652] text-[11px] font-semibold uppercase tracking-wider rounded transition-all cursor-pointer border-none shadow-xs"
                    >
                      Answer Reflection
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Today's Session / Assessment Gate Card */}
            <section className="space-y-2.5">
              <div className="text-[9px] font-bold uppercase tracking-widest text-secondary">Today's Session</div>
              
              {false ? (
                null
              ) : (
                <>
                  {customerAccess?.state === 'DORMANT' ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-[#1E2A2E]/10 rounded-xl p-5 text-left space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold text-mid uppercase tracking-widest">Reflective Mode</span>
                        <span className="text-xs font-mono text-mid">All archives safe</span>
                      </div>
                      <h3 className="font-serif text-base sm:text-lg text-primary">Your account is in reflective read-only mode</h3>
                      <p className="text-[12px] sm:text-[12.5px] text-mid leading-relaxed max-w-lg">
                        You can still view everything you've written, including your past journals, reports, and patterns. Subscribe to continue daily guided writing and AI reflections.
                      </p>
                      <div className="pt-1">
                        <button
                          onClick={() => window.navigateTo('/settings')}
                          className="px-4 py-2.5 bg-primary text-white hover:bg-[#2A3A3E] text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-2"
                        >
                          <span>Resume Daily Self-Work · ₹499/mo</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </motion.div>
                  ) : data.cycleInfo.hasWrittenToday ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4.5 shadow-sm"
                    >
                      {dailySessionState?.exists && dailySessionState?.isCompletedToday ? (
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 text-left items-center">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#8DBFB4]/15 flex items-center justify-center text-[#8DBFB4] shrink-0">
                                <CheckCircle2 size={18} />
                              </div>
                              <h3 className="font-serif text-base text-primary">Day {dailySessionState.session.day_number} Complete</h3>
                            </div>
                            <p className="text-[11.5px] text-mid leading-relaxed">
                              Your daily reframing and journal writing are locked. The patterns are integrated.
                            </p>
                            <div className="text-[10px] text-mid/60 italic font-medium">
                              Resets at 12:00 AM (midnight) local time.
                            </div>
                          </div>

                          <div className="space-y-3 bg-secondary/5 rounded-xl p-3.5 border border-secondary/10">
                            <div className="grid grid-cols-2 gap-2 border-b border-[#1E2A2E]/5 pb-2">
                              <div>
                                <div className="text-[8px] uppercase font-bold text-secondary">Stressor Reframed</div>
                                <div className="text-[11px] font-semibold text-primary capitalize mt-0.5">
                                  {dailySessionState.exercise?.stressor_type || 'General'}
                                </div>
                              </div>
                              <div>
                                <div className="text-[8px] uppercase font-bold text-secondary">Clarity Score</div>
                                <div className="text-[11px] font-semibold text-primary mt-0.5">
                                  {dailySessionState.exercise?.clarity_score || 85}%
                                </div>
                              </div>
                            </div>
                            {dailySessionState.exercise?.reframed_thought && (
                              <div>
                                <div className="text-[8px] uppercase font-bold text-secondary mb-0.5">Reframed Focus</div>
                                <p className="font-serif italic text-[11px] leading-relaxed text-primary/80">
                                  "{dailySessionState.exercise.reframed_thought}"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className="w-10 h-10 rounded-full bg-[#8DBFB4]/15 flex items-center justify-center text-[#8DBFB4]">
                            <CheckCircle2 size={20} />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-serif text-base text-primary">Daily Writing Complete</h3>
                            <p className="text-[11.5px] text-mid max-w-sm leading-relaxed">
                              You have already logged a journal entry today. The guided daily session is locked for today.
                            </p>
                          </div>
                          <div className="text-[10px] text-mid/60 italic font-medium pt-0.5">
                            Resets at 12:00 AM (midnight) local time.
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : dailySessionState?.exists && !dailySessionState?.isCompletedToday && dailySessionState?.session?.status !== 'complete' ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-[#8DBFB4]/35 bg-gradient-to-br from-[#8DBFB4]/3 to-transparent rounded-xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_4px_16px_rgba(141,191,180,0.06)]"
                    >
                      <div className="space-y-1">
                        <div className="text-[8px] font-bold text-[#8DBFB4] uppercase tracking-widest">SESSION IN PROGRESS</div>
                        <h3 className="font-serif text-base text-primary">Day {dailySessionState.session.day_number} Session</h3>
                        <p className="text-[11px] text-mid leading-relaxed">
                          You left off on the <span className="font-semibold capitalize">"{dailySessionState.session.status}"</span> step.
                        </p>
                      </div>
                      <button
                        onClick={() => window.navigateTo(`/session/${dailySessionState.session.status}`)}
                        className="sm:w-auto px-5 py-2.5 bg-primary text-white hover:bg-[#2A3A3E] text-[11px] font-semibold uppercase tracking-wider rounded transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <span>Resume Session</span>
                        <ArrowRight size={12} />
                      </button>
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Left Card: Free Write */}
                      <div 
                        onClick={() => window.navigateTo('/write')}
                        className="bg-white border border-[#1E2A2E]/10 hover:border-primary/30 p-5 rounded-2xl flex flex-col justify-between min-h-[170px] cursor-pointer hover:shadow-md transition-all group relative text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-105 transition-transform border border-primary/10">
                            <PenLine size={16} />
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-mid/70 px-2 py-0.5 bg-primary/5 rounded-full">Direct</span>
                        </div>

                        <div className="space-y-1.5 pt-3">
                          <h3 className="font-serif text-lg font-normal text-primary group-hover:text-secondary transition-colors">Free Write</h3>
                          <p className="text-xs font-semibold text-primary/80">Write freely about whatever is on your mind today.</p>
                          <p className="text-[11.5px] text-mid font-light leading-relaxed">A blank journal where you decide what matters.</p>
                        </div>

                        <div className="pt-4 flex items-center justify-between border-t border-[#1E2A2E]/5 mt-2">
                          <span className="text-[11px] font-semibold text-primary group-hover:text-secondary transition-colors flex items-center gap-1">
                            Start Writing <ArrowRight size={12} className="transform group-hover:translate-x-0.5 transition-transform" />
                          </span>
                          <span className="text-[9.5px] text-mid/60 font-serif italic">Blank canvas</span>
                        </div>
                      </div>

                      {/* Right Card: Guided Writing */}
                      <div 
                        onClick={() => window.navigateTo('/write/guided')}
                        className="bg-gradient-to-br from-[#8DBFB4]/10 via-[#8DBFB4]/5 to-white border border-[#8DBFB4]/30 hover:border-[#8DBFB4]/60 p-5 rounded-2xl flex flex-col justify-between min-h-[170px] cursor-pointer hover:shadow-md transition-all group relative text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-9 h-9 rounded-xl bg-[#8DBFB4]/20 flex items-center justify-center text-[#1A5040] group-hover:scale-105 transition-transform border border-[#8DBFB4]/30">
                            <Compass size={16} />
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#1A5040] px-2 py-0.5 bg-[#8DBFB4]/20 rounded-full flex items-center gap-1">
                            <Sparkles size={10} /> Recommended
                          </span>
                        </div>

                        <div className="space-y-1.5 pt-3">
                          <h3 className="font-serif text-lg font-normal text-primary group-hover:text-[#1A5040] transition-colors">Guided Writing</h3>
                          <p className="text-xs font-semibold text-primary/80">A structured conversation to help you explore one experience more deeply.</p>
                          <p className="text-[11.5px] text-mid font-light leading-relaxed">We'll guide you through a few thoughtful questions and then reflect back what we notice.</p>
                        </div>

                        <div className="pt-4 flex items-center justify-between border-t border-[#8DBFB4]/15 mt-2">
                          <span className="text-[11px] font-semibold text-[#1A5040] group-hover:text-primary transition-colors flex items-center gap-1">
                            Begin Guided Session <ArrowRight size={12} className="transform group-hover:translate-x-0.5 transition-transform" />
                          </span>
                          <span className="text-[9.5px] text-[#1A5040]/70 font-serif italic">5 guided prompts</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>


            {/* Cycles Overview */}
            <section className="space-y-3">
              <div className="text-[9px] font-bold uppercase tracking-widest text-secondary">Cycles Overview</div>
              
              <div className="space-y-4">
                {cyclesList.length > 0 ? (
                  cyclesList.map((cycle) => {
                    const isExpanded = !!expandedCycles[cycle.id];
                    const hasEntries = cycle.entries && cycle.entries.length > 0;
                    
                    return (
                      <div 
                        key={cycle.id}
                        className="bg-white border border-[#1E2A2E]/8 rounded-xl overflow-hidden shadow-xs text-left transition-all"
                      >
                        {/* Accordion Header */}
                        <div 
                          onClick={() => toggleCycleExpanded(cycle.id)}
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-mint-grey/20 transition-all select-none border-b border-[#1E2A2E]/5"
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-serif text-[15px] font-semibold text-primary">
                              Cycle {cycle.cycle_number}
                            </span>
                            
                            {/* Status Badge */}
                            <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider ${
                              cycle.status === 'ACTIVE' 
                                ? 'bg-[#8DBFB4]/12 text-[#1A5040]' 
                                : cycle.status === 'COMPLETED'
                                ? 'bg-[#5A4A8A]/10 text-[#5A4A8A]'
                                : 'bg-primary/5 text-primary'
                            }`}>
                              {cycle.status}
                            </span>

                            {/* Entry Count */}
                            <span className="text-[11px] text-mid">
                              {cycle.entries_count} {cycle.entries_count === 1 ? 'writing' : 'writings'}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Assessment Status Badge */}
                            <span
                              onClick={(e) => { e.stopPropagation(); window.navigateTo('/exercise'); }}
                              className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity ${
                                cycle.assessment_completed
                                  ? 'bg-[#8DBFB4]/15 text-[#1A5040]'
                                  : cycle.status === 'COMPLETED' || cycle.assessment_available
                                  ? 'bg-[#f59e0b]/10 text-[#b45309]'
                                  : 'bg-primary/5 text-primary'
                              }`}
                            >
                              Assessment: {cycle.assessment_completed ? 'Completed' : (cycle.status === 'COMPLETED' || cycle.assessment_available ? 'Pending' : 'Locked')}
                            </span>

                            {/* Collapsed view metadata (Current Day / Progress) */}
                            {!isExpanded && (
                              <span className="text-[11px] text-mid hidden sm:inline">
                                Day {cycle.current_day} of {cycle.total_days} ({cycle.progress_percentage}%)
                              </span>
                            )}

                            {/* Caret */}
                            <ChevronRight 
                              size={16} 
                              className={`text-light-mid transform transition-transform duration-200 ${
                                isExpanded ? 'rotate-90' : ''
                              }`} 
                            />
                          </div>
                        </div>

                        {/* Accordion Content (Expanded View) */}
                        {isExpanded && (
                          <div className="p-4.5 bg-white space-y-5">
                            {/* Quick-Access Metrics Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {/* Weekly Summaries */}
                              <div 
                                onClick={(e) => { e.stopPropagation(); window.navigateTo('/reports'); }}
                                className="bg-mint-grey/30 border border-[#1E2A2E]/5 rounded-xl p-3 hover:border-[#1E2A2E]/15 hover:shadow-xs transition-all cursor-pointer text-center space-y-1 group"
                              >
                                <FileText size={14} className="text-[#8DBFB4] mx-auto group-hover:scale-105 transition-transform" />
                                <div className="text-[14px] font-serif font-bold text-primary">{cycle.weekly_summaries_count}</div>
                                <div className="text-[8px] font-bold uppercase tracking-wider text-secondary">Summaries</div>
                              </div>

                              {/* Open Threads */}
                              <div 
                                onClick={(e) => { e.stopPropagation(); window.navigateTo('/threads'); }}
                                className="bg-mint-grey/30 border border-[#1E2A2E]/5 rounded-xl p-3 hover:border-[#1E2A2E]/15 hover:shadow-xs transition-all cursor-pointer text-center space-y-1 group"
                              >
                                <MessageSquare size={14} className="text-[#E0A898] mx-auto group-hover:scale-105 transition-transform" />
                                <div className="text-[14px] font-serif font-bold text-primary">{cycle.open_threads_count}</div>
                                <div className="text-[8px] font-bold uppercase tracking-wider text-secondary">Open Threads</div>
                              </div>

                              {/* Patterns */}
                              <div 
                                onClick={(e) => { e.stopPropagation(); window.navigateTo('/patterns'); }}
                                className="bg-mint-grey/30 border border-[#1E2A2E]/5 rounded-xl p-3 hover:border-[#1E2A2E]/15 hover:shadow-xs transition-all cursor-pointer text-center space-y-1 group"
                              >
                                <TrendingUp size={14} className="text-secondary-dark mx-auto group-hover:scale-105 transition-transform" />
                                <div className="text-[14px] font-serif font-bold text-primary">
                                  {cycle.status === 'ACTIVE' ? 'Active' : 'Archived'}
                                </div>
                                <div className="text-[8px] font-bold uppercase tracking-wider text-secondary">Patterns</div>
                              </div>

                              {/* Assessments */}
                              <div 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  window.navigateTo('/exercise');
                                }}
                                className="bg-mint-grey/30 border border-[#1E2A2E]/5 rounded-xl p-3 hover:border-[#1E2A2E]/15 hover:shadow-xs transition-all cursor-pointer text-center space-y-1 group"
                              >
                                <Sparkles size={14} className="text-[#5A4A8A] mx-auto group-hover:scale-105 transition-transform" />
                                <div className="text-[11px] font-semibold text-primary truncate pt-0.5">
                                  Available
                                </div>
                                <div className="text-[8px] font-bold uppercase tracking-wider text-secondary">Assessments</div>
                              </div>
                            </div>

                            {/* Cycle Entries Timeline */}
                            <div className="space-y-3">
                              <div className="text-[9px] font-bold uppercase tracking-widest text-secondary pl-1">
                                Cycle Writings ({cycle.entries_count})
                              </div>
                                                    <div className="space-y-3.5 pl-3 border-l border-[#1E2A2E]/10">
                                {cycle.entries === null ? (
                                  <div className="text-[11px] text-mid italic py-3 pl-1 flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                                    <span>Retrieving writings...</span>
                                  </div>
                                ) : hasEntries ? (
                                  (() => {
                                    const showAll = !!expandedCycleEntries[cycle.id];
                                    const visibleEntries = showAll ? cycle.entries : cycle.entries.slice(0, 5);

                                    return (
                                      <>
                                        {visibleEntries.map((entry) => {
                                          const isGuided = entry.entry_type === 'guided';
                                          const snippet = entry.content.length > 140 ? entry.content.substring(0, 140) + '...' : entry.content;
                                          const entryDateStr = new Date(entry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

                                          return (
                                            <div 
                                              key={entry.id}
                                              onClick={(e) => { e.stopPropagation(); window.navigateTo(`/entry/${entry.id}`); }}
                                              className="bg-white border border-[#1E2A2E]/8 rounded-xl p-4 hover:border-secondary/30 hover:shadow-xs transition-all space-y-2.5 cursor-pointer group relative text-left"
                                            >
                                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E2A2E]/5 pb-2">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-[10px] font-bold text-primary">
                                                    {entryDateStr}
                                                  </span>
                                                  <span className="text-mid/60 text-xs">·</span>
                                                  <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider ${
                                                    isGuided 
                                                      ? 'bg-[#8DBFB4]/12 text-[#1A5040]' 
                                                      : 'bg-primary/5 text-primary'
                                                  }`}>
                                                    {isGuided ? 'Guided Session' : 'Free Write'}
                                                  </span>
                                                  {entry.cycle_day && (
                                                    <span className="text-[9.5px] font-semibold text-secondary ml-1">
                                                      Day {entry.cycle_day}
                                                    </span>
                                                  )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                  {entry.crisis_flag ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8.5px] font-bold bg-accent/15 text-accent uppercase tracking-widest">
                                                      <HeartHandshake size={10} className="text-accent shrink-0" />
                                                      <span>Crisis Support Active</span>
                                                    </span>
                                                  ) : (
                                                    <>
                                                      {/* Reflection Status Badge */}
                                                      {(() => {
                                                        const refl = entry.reflection;
                                                        const isAnswered = Boolean(refl?.reflection_answer) || entry.reflectionStatus === 'Completed';
                                                        const isReady = Boolean(refl) || entry.reflectionStatus === 'Pending Response' || entry.reflectionStatus === 'Ready';

                                                        if (isAnswered) {
                                                          return (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-medium bg-[#8DBFB4]/15 text-[#1A5040]">
                                                              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                                              <span>Reflection Answered</span>
                                                            </span>
                                                          );
                                                        }
                                                        if (isReady) {
                                                          return (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-medium bg-[#8DBFB4]/15 text-[#1A5040]">
                                                              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                                              <span>Reflection Ready</span>
                                                            </span>
                                                          );
                                                        }
                                                        if (entry.reflectionStatus === 'Processing AI...') {
                                                          return (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-medium bg-[#f59e0b]/10 text-[#b45309] animate-pulse">
                                                              <span className="w-1 h-1 rounded-full bg-[#f59e0b]" />
                                                              <span>Processing AI...</span>
                                                            </span>
                                                          );
                                                        }
                                                        return null;
                                                      })()}
                                                    </>
                                                  )}
                                                  <span className="text-[9.5px] text-mid/60 lowercase pr-1">{entry.word_count} words</span>
                                                </div>
                                              </div>

                                              <p className="text-[12.5px] text-primary italic leading-relaxed font-serif pr-1">
                                                "{snippet}"
                                              </p>

                                              <div className="flex items-center justify-between pt-1 mt-1 border-t border-[#1E2A2E]/5">
                                                <div>
                                                  {(() => {
                                                    const refl = entry.reflection;
                                                    const isAnswered = Boolean(refl?.reflection_answer) || entry.reflectionStatus === 'Completed';
                                                    const isReady = Boolean(refl) || entry.reflectionStatus === 'Pending Response' || entry.reflectionStatus === 'Ready';

                                                    if (isReady && !isAnswered) {
                                                      return (
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenReflectionForEntry(entry);
                                                          }}
                                                          className="px-2.5 py-1.5 bg-[#8DBFB4]/12 hover:bg-[#8DBFB4]/20 text-[#1A5040] text-[9.5px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer border-none"
                                                        >
                                                          Answer Reflection
                                                        </button>
                                                      );
                                                    }
                                                    return null;
                                                  })()}
                                                </div>
                                                <div className="flex items-center justify-end text-[10px] font-bold uppercase tracking-widest text-secondary group-hover:text-primary transition-colors">
                                                  <span className="flex items-center gap-1">
                                                    <span>Explore Details</span>
                                                    <ArrowRight size={11} className="transform group-hover:translate-x-0.5 transition-transform" />
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                        {cycle.entries.length > 5 && (
                                          <div className="pt-2 flex justify-center">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleCycleEntriesExpanded(cycle.id);
                                              }}
                                              className="px-3.5 py-1.5 border border-[#1E2A2E]/10 hover:border-secondary/35 text-xs text-mid hover:text-primary rounded-lg transition-all font-sans font-semibold cursor-pointer bg-transparent"
                                            >
                                              {showAll ? 'Show less writings' : `Show ${cycle.entries.length - 5} more writings`}
                                            </button>
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()
                                ) : (
                                  <div className="text-[12px] text-mid italic py-2 pl-1">
                                    No writings logged in this cycle yet.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white border border-[#1E2A2E]/5 rounded-xl p-8 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-mint-grey flex items-center justify-center text-light-mid mx-auto">
                      <BookOpen size={16} />
                    </div>
                    <p className="text-[12.5px] text-mid italic">
                      No cycles found. Start a daily session to initialize.
                    </p>
                    <button 
                      onClick={() => handleStartWriting('fresh')}
                      className="px-4 py-2 bg-primary hover:bg-[#2A3A3E] text-mint-grey rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-none"
                    >
                      Write First Entry
                    </button>
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* Sidebar (Right 1 Column) */}
          <div className="md:col-span-1 space-y-4">
            
            {/* Sidebar Title */}
            <div className="text-[9px] font-bold uppercase tracking-widest text-secondary pt-0.5">Practice Insights</div>

            {/* Emotional Vocabulary Card */}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => window.navigateTo('/vocab')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  window.navigateTo('/vocab');
                }
              }}
              className="bg-white border border-[#1E2A2E]/8 rounded-xl p-4.5 cursor-pointer hover:shadow-xs hover:border-[#1E2A2E]/15 transition-all group focus:outline-none focus:ring-1 focus:ring-secondary/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-[9px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1.5">
                  <Smile size={13} className="text-[#5A4A8A]" />
                  <span>Emotional Vocabulary</span>
                </div>
                <ChevronRight size={13} className="text-light-mid group-hover:translate-x-0.5 transition-transform" />
              </div>

              {!vocabStats || vocabStats.stats?.distinctWordCount === 0 ? (
                // Graceful Empty State
                <div className="space-y-2 pt-1 text-left">
                  <p className="text-[11.5px] text-mid italic leading-relaxed">
                    {data?.entries?.length > 0
                      ? "Your emotional vocabulary is compiling. Insights will appear once we have enough data (minimum 3 entries)."
                      : "Your emotional vocabulary is building as you write. Keep logging entries to see your vocabulary insights."}
                  </p>
                  <div className="text-[10px] text-light-mid font-medium uppercase tracking-wider">
                    {vocabStats?.stats?.entriesCount || data?.entries?.length || 0} entries · 0 words tracked
                  </div>
                </div>
              ) : (
                // Active State displaying all required fields
                <div className="space-y-3 pt-0.5">
                  {/* Top Emotional Vocabulary (Concepts) */}
                  {vocabStats.concepts && vocabStats.concepts.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[8px] font-bold uppercase tracking-wider text-mid/60">Top Emotional Vocabulary</div>
                      <div className="flex gap-1 flex-wrap">
                        {vocabStats.concepts.slice(0, 3).map((c, idx) => (
                          <span key={idx} className="text-[9.5px] bg-[#5A4A8A]/5 border border-[#5A4A8A]/10 px-1.5 py-0.5 rounded font-medium text-[#5A4A8A]">
                            {c.concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Most Frequent Words */}
                  {vocabStats.mostUsed && vocabStats.mostUsed.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[8px] font-bold uppercase tracking-wider text-mid/60">Most Frequent Words</div>
                      <div className="flex gap-1 flex-wrap">
                        {vocabStats.mostUsed.slice(0, 3).map((w, idx) => (
                          <span key={idx} className="text-[9.5px] bg-mint-grey px-1.5 py-0.5 rounded font-medium text-primary">
                            {w.normalized_word} ×{w.frequency}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emerging Words / Highlights */}
                  {vocabStats.emerging && vocabStats.emerging.length > 0 ? (
                    <div className="space-y-1">
                      <div className="text-[8px] font-bold uppercase tracking-wider text-[#E0A898]">Emerging Words</div>
                      <div className="flex gap-1 flex-wrap">
                        {vocabStats.emerging.slice(0, 3).map((w, idx) => (
                          <span key={idx} className="text-[9.5px] bg-[#E0A898]/10 border border-[#E0A898]/20 px-1.5 py-0.5 rounded font-medium text-[#8a3020]">
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : vocabStats.clusters && vocabStats.clusters.length > 0 ? (
                    <div className="space-y-1">
                      <div className="text-[8px] font-bold uppercase tracking-wider text-mid/60">Current Cycle Highlights</div>
                      <p className="text-[11px] text-mid italic leading-relaxed">
                        {(() => {
                          const clusterNames = vocabStats.clusters.slice(0, 2).map(c => c.cluster_name);
                          return `Centered around ${clusterNames.join(' & ')}.`;
                        })()}
                      </p>
                    </div>
                  ) : null}

                  {/* Vocabulary Growth */}
                  <div className="border-t border-[#1E2A2E]/5 pt-2 flex items-center justify-between text-[10px] text-mid/60 font-mono">
                    <span>GROWTH STATS:</span>
                    <span>
                      {vocabStats.stats?.distinctWordCount} distinct words (+{vocabStats.stats?.currentCycleWordsCount || 0} this cycle)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Active Patterns Card */}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => window.navigateTo('/patterns')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  window.navigateTo('/patterns');
                }
              }}
              className="bg-white border border-[#1E2A2E]/8 rounded-xl p-4.5 cursor-pointer hover:shadow-xs hover:border-[#1E2A2E]/15 transition-all group focus:outline-none focus:ring-1 focus:ring-secondary/40 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="text-[9px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-secondary-dark" />
                  <span>Active Patterns</span>
                </div>
                <ChevronRight size={13} className="text-light-mid group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="space-y-2 pt-0.5">
                {(() => {
                  const isBackfilling = patternsOverview?.userState?.state === 'backfill_pending';
                  const activeList = patternsOverview?.lifecycle?.active || [];
                  const reEmergingList = patternsOverview?.lifecycle?.reEmerging || [];
                  const emergingList = patternsOverview?.lifecycle?.emerging || [];
                  const quietList = patternsOverview?.lifecycle?.quiet || [];

                  const surfacedPatterns = [...activeList, ...reEmergingList, ...emergingList];
                  const surfacedToShow = surfacedPatterns.slice(0, 3);

                  const getDotColor = (status, lifecycleStatus) => {
                    if (lifecycleStatus === 'emerging') return 'bg-[#B8A8D4]';
                    if (lifecycleStatus === 're_emerging') return 'bg-[#E0A898]/80';
                    if (status === 'shifting') return 'bg-[#8DBFB4]';
                    return 'bg-[#E0A898]'; // active
                  };

                  if (isBackfilling) {
                    return (
                      <div className="flex items-center gap-2 text-xs text-[#8DBFB4] font-medium py-1">
                        <Loader2 size={13} className="animate-spin shrink-0" />
                        <span>Analyzing writing patterns...</span>
                      </div>
                    );
                  }

                  if (surfacedToShow.length > 0) {
                    return surfacedToShow.map((p, idx) => (
                      <div key={p.id || idx} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotColor(p.status, p.lifecycleStatus)}`} />
                        <div className="text-[12px] font-medium text-primary truncate">{p.name}</div>
                      </div>
                    ));
                  }

                  if (quietList.length > 0) {
                    return (
                      <div className="space-y-1">
                        <div className="text-[11px] text-mid font-medium">No active patterns right now.</div>
                        <div className="text-[10px] text-secondary font-mono">
                          {quietList.length} previously observed · quiet
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="text-[11px] text-[#4A6A64] italic">No patterns have emerged yet.</div>
                  );
                })()}
              </div>
            </div>

            {/* Reports & Summaries Card */}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => window.navigateTo('/reports')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  window.navigateTo('/reports');
                }
              }}
              className="bg-white border border-[#1E2A2E]/8 rounded-xl p-4.5 cursor-pointer hover:shadow-xs hover:border-[#1E2A2E]/15 transition-all group focus:outline-none focus:ring-1 focus:ring-secondary/40 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="text-[9px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1.5">
                  <FileText size={13} className="text-[#8DBFB4]" />
                  <span>Reports & Summaries</span>
                </div>
                <ChevronRight size={13} className="text-light-mid group-hover:translate-x-0.5 transition-transform" />
              </div>
              {(() => {
                const readyReports = weeklyReports && weeklyReports.length > 0
                  ? weeklyReports.filter(r => r.status === 'READY' || r.report_data)
                  : [];
                const latestReport = readyReports.length > 0
                  ? readyReports[readyReports.length - 1]
                  : (weeklyReports && weeklyReports.length > 0 ? weeklyReports[0] : null);

                if (latestReport) {
                  const weekNum = latestReport.week_number || 1;
                  const data = latestReport.report_data || {};
                  
                  // Extract pure report reflection or tone
                  const reportQuote = data.week_tone || data.growth_reflection || data.what_we_saw || latestReport.title || `Your Week ${weekNum} summary is ready to explore.`;
                  const primaryTheme = data.analytical_block?.primary_theme || latestReport.title || `Week ${weekNum} summary ready`;

                  return (
                    <>
                      <p className="text-[12.5px] text-primary font-serif italic leading-relaxed line-clamp-3">
                        "{reportQuote}"
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-mid hover:text-primary transition-colors pt-2 border-t border-[#1E2A2E]/5">
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#e0a898]/15 text-[#8a3020] shrink-0">
                            WEEK {weekNum} SUMMARY
                          </span>
                          <span className="font-medium truncate">{primaryTheme}</span>
                        </div>
                        <ChevronRight size={12} className="shrink-0" />
                      </div>
                    </>
                  );
                } else {
                  const currentDay = cycleInfo?.currentDay || 1;
                  return (
                    <>
                      <p className="text-[12.5px] text-primary font-serif italic leading-relaxed">
                        "Write daily journal entries to generate your first weekly summary. Current Day: {currentDay}."
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-mid hover:text-[#1E2A2E] transition-colors pt-2 border-t border-[#1E2A2E]/5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-mint-grey text-primary">
                            UPCOMING
                          </span>
                          <span className="font-medium">First summary on Day 7</span>
                        </div>
                        <ChevronRight size={12} />
                      </div>
                    </>
                  );
                }
              })()}
            </div>

          </div>

        </div>

      </main>

      {/* FULL-SCREEN INTERACTIVE WRITING WORKSPACE */}
      <AnimatePresence>
        {isWritingSession && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-50 overflow-y-auto flex flex-col font-serif"
          >
            {/* Top Workspace Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2A2E]/5 bg-white shrink-0">
              <button 
                onClick={() => {
                  if (entryText.trim() && !entrySavedSuccess) {
                    if (confirm('Discard this entry?')) setIsWritingSession(false);
                  } else {
                    setIsWritingSession(false);
                  }
                }}
                className="flex items-center gap-2 text-xs font-sans font-semibold text-mid hover:text-primary transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to dashboard
              </button>
              
              <div className="text-xs font-sans font-semibold uppercase tracking-wider text-secondary">
                {writingMode === 'fresh' ? 'Fresh Entry' : 'Continue Yesterday'}
              </div>

              <div>
                <span className="text-[11px] font-sans text-mid">
                  {entryText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
            </div>

            {/* Entry Form */}
            <div className="flex-1 max-w-[620px] mx-auto w-full px-6 pt-12 flex flex-col space-y-6">
              
              {/* Context Block for Continue Mode */}
              {writingMode === 'continue' && (
                <div className="bg-mint-grey border border-[#1e2a2e]/5 rounded-xl p-5 space-y-1.5 text-xs font-sans text-mid shrink-0">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-secondary">
                    <CornerDownRight size={12} /> Yesterday
                  </div>
                  <p className="italic font-serif leading-relaxed">
                    "{yesterdayEntry || 'No yesterday entry available.'}"
                  </p>
                </div>
              )}

              {/* Text Workspace */}
              {entrySavedSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col justify-center items-center text-center space-y-4 font-sans py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center text-secondary-dark mb-2">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="font-serif text-2xl text-primary">Your reflection is saved.</h2>
                  <p className="text-xs text-mid max-w-sm leading-relaxed">
                    Thank you for writing. This entry has been locked and fed into your Cycle {cycleInfo ? cycleInfo.cycleNumber : data.cycleInfo.cycleNumber} logs.
                  </p>
                  <button 
                    onClick={() => setIsWritingSession(false)}
                    className="px-6 py-2.5 bg-primary text-white hover:bg-[#2A3A3E] rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer mt-4"
                  >
                    Go to Dashboard
                  </button>
                </motion.div>
              ) : (
                <textarea 
                  value={entryText}
                  onChange={(e) => setEntryText(e.target.value)}
                  placeholder={writingMode === 'fresh' ? 'Whatever is actually there.' : 'Pick up the thread...'}
                  className="flex-1 w-full text-base leading-relaxed bg-transparent border-none outline-none resize-none focus:ring-0 focus:outline-none p-0 text-primary placeholder-[#1E2A2E]/20 font-serif min-h-[300px]"
                  autoFocus
                />
              )}
            </div>

            {/* Bottom Controls Bar */}
            {!entrySavedSuccess && (
              <div className="border-t border-[#1E2A2E]/5 px-6 py-4 bg-white flex items-center justify-between shrink-0">
                <span className="text-[11px] font-sans text-mid">
                  Cycle {cycleInfo ? cycleInfo.cycleNumber : data.cycleInfo.cycleNumber} · Day {cycleInfo ? cycleInfo.currentDay : data.cycleInfo.currentDay}
                </span>
                
                <button 
                  onClick={handleSaveEntry}
                  disabled={entryText.trim().split(/\s+/).filter(Boolean).length < 5 || isSavingEntry}
                  className="px-6 py-2 bg-primary text-white hover:bg-[#2A3A3E] disabled:bg-primary/25 disabled:cursor-not-allowed text-xs font-sans font-semibold uppercase tracking-wider rounded transition-all cursor-pointer"
                >
                  {isSavingEntry ? 'Integrating...' : 'Done'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL WORKSPACE TO RESPOND TO THREAD */}
      <ThreadResponseModal
        isOpen={!!activeThread}
        activeThread={activeThread}
        onClose={() => setActiveThread(null)}
        threadResponse={threadResponse}
        setThreadResponse={setThreadResponse}
        onSave={handleSaveThreadResponse}
        isSaving={isSavingThread}
      />

      {/* MODAL WORKSPACE TO RESPOND TO REFLECTION */}
      <ReflectionModal
        isOpen={reflectionModalOpen}
        reflectionToAnswer={reflectionToAnswer}
        entryText={reflectionEntry?.content || reflectionEntry?.text}
        onClose={() => setReflectionModalOpen(false)}
        reflectionAnswerText={reflectionAnswerText}
        setReflectionAnswerText={setReflectionAnswerText}
        onSave={handleSaveReflection}
        isSaving={isSavingReflection}
        error={reflectionSaveError}
      />

      {/* TRANSITION ASSESSMENT MODAL */}
      <AssessmentModal
        isOpen={assessmentModalOpen}
        cycleInfo={cycleInfo}
        onClose={() => setAssessmentModalOpen(false)}
        answers={assessmentAnswers}
        setAnswers={setAssessmentAnswers}
        onSave={handleSaveAssessment}
        isSubmitting={isSubmittingAssessment}
        error={assessmentError}
      />

      {/* 1-ON-1 CLINICAL SUPPORT PREVIEW MODAL */}
      <AnimatePresence>
        {therapyModalOpen && (
          <div className="fixed inset-0 bg-[#1E2A2E]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 relative shadow-xl border border-primary/10 text-left"
            >
              <button
                onClick={() => setTherapyModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-primary/5 hover:bg-primary/10 flex items-center justify-center text-mid hover:text-primary transition-all cursor-pointer border-none"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>

              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-accent uppercase tracking-widest px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                      Therapists — Coming Soon
                    </span>
                  </div>
                </div>

                <h3 className="font-serif text-xl sm:text-2xl text-primary font-normal">
                  Professional 1-on-1 Clinical Support
                </h3>

                <p className="text-sm text-mid font-light leading-relaxed">
                  Direct matching with licensed, culturally attuned therapists is launching soon. In the meantime, all self-help modules, techniques, and writing tools are fully active.
                </p>
              </div>

              <div className="bg-primary/[0.03] border border-primary/10 rounded-xl p-4 space-y-2.5">
                <div className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                  What to expect at launch
                </div>
                <ul className="text-xs text-mid space-y-2 list-none p-0 m-0">
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold mt-0.5">•</span>
                    <span>Direct matching with certified, culturally attuned therapists.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold mt-0.5">•</span>
                    <span>Integrated homework & reflection continuity between sessions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold mt-0.5">•</span>
                    <span>Your private self-work journals remain strictly confidential.</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setTherapyModalOpen(false)}
                  className="px-5 py-2.5 bg-primary text-white hover:bg-primary/90 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs border-none"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save Error Warning Popup Modal */}
      <AnimatePresence>
        {saveError && (
          <div className="fixed inset-0 bg-[#1E2A2E]/40 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-[420px] w-full p-6 space-y-4 relative overflow-hidden shadow-lg border border-[#1E2A2E]/5"
            >
              <button 
                onClick={() => setSaveError(null)}
                className="absolute top-4 right-4 text-mid hover:text-primary cursor-pointer border-none bg-transparent"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 text-red-500">
                <AlertCircle size={24} className="shrink-0" />
                <h3 className="font-serif text-lg text-primary font-normal">
                  {saveError.includes('limit') || saveError.includes('already completed') ? 'Daily Limit Reached' : 'Unable to Save'}
                </h3>
              </div>

              <p className="text-xs text-mid leading-relaxed font-sans">
                {saveError}
              </p>

              <div className="pt-2">
                <button 
                  onClick={() => {
                    setSaveError(null);
                    if (saveError.includes('limit') || saveError.includes('already completed')) {
                      setIsWritingSession(false);
                      loadData();
                    }
                  }}
                  className="w-full py-2.5 bg-primary text-white hover:bg-[#2A3A3E] rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-none"
                >
                  Acknowledge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Skeleton Loader Component
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans pb-20 animate-pulse">
      {/* Header skeleton */}
      <header className="border-b border-[#1E2A2E]/5 px-6 py-4 sticky top-0 bg-white/70">
        <div className="max-w-[1140px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-gray-200" />
            <div className="w-24 h-4 bg-gray-200 rounded" />
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-3 bg-gray-200 rounded hidden md:block" />
            <div className="w-12 h-3 bg-gray-200 rounded hidden md:block" />
            <div className="w-12 h-3 bg-gray-200 rounded hidden md:block" />
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-200" />
        </div>
      </header>

      {/* Content skeleton */}
      <main className="max-w-[1140px] mx-auto px-6 pt-8 space-y-8">
        
        {/* Welcome Section */}
        <div className="space-y-2">
          <div className="w-16 h-3 bg-gray-200 rounded" />
          <div className="w-64 h-7 bg-gray-200 rounded" />
          <div className="w-48 h-3 bg-gray-200 rounded" />
        </div>

        {/* Responsive Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="md:col-span-2 space-y-8">
            <div className="space-y-2">
              <div className="w-20 h-3 bg-gray-200 rounded" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-[150px] bg-gray-200 rounded-xl" />
                <div className="h-[150px] bg-gray-200 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="w-24 h-3 bg-gray-200 rounded" />
              <div className="h-24 bg-gray-200 rounded-xl" />
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="md:col-span-1 space-y-8">
            <div className="space-y-2">
              <div className="w-16 h-3 bg-gray-200 rounded" />
              <div className="h-[200px] bg-gray-200 rounded-xl" />
            </div>
            <div className="h-[200px] bg-gray-200 rounded-xl" />
            <div className="h-[140px] bg-gray-200 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
