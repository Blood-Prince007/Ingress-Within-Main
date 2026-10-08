import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Compass, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Trash2, 
  RotateCcw, 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  HeartHandshake
} from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';
import { PostJournalInterventions } from '../components/interventions/PostJournalInterventions';
import { InterventionPlayer } from '../components/interventions/player/InterventionPlayer';

export const STANDARD_GUIDED_JOURNEY = {
  id: 'standard',
  title: 'Guided Writing',
  subtitle: 'A structured conversation to help you explore one experience more deeply.',
  description: "We'll guide you through a few thoughtful questions and then reflect back what we notice.",
  theme: 'mint',
  questions: [
    {
      id: 'q1',
      number: 1,
      title: 'What happened?',
      subtitle: 'Describe the situation or event as objectively as you can.',
      placeholder: 'Start typing what occurred...'
    },
    {
      id: 'q2',
      number: 2,
      title: 'What are you experiencing?',
      subtitle: 'What emotions, physical sensations, or immediate thoughts came up?',
      placeholder: 'Describe how it felt in your body and mind...'
    },
    {
      id: 'q3',
      number: 3,
      title: 'Why does it matter?',
      subtitle: 'What values, needs, or expectations does this situation touch?',
      placeholder: 'What felt threatened, ignored, or important to you?'
    },
    {
      id: 'q4',
      number: 4,
      title: 'Why does it repeat?',
      subtitle: 'Have you noticed similar feelings or reactions in past situations?',
      placeholder: 'Notice any familiar patterns or habits...'
    },
    {
      id: 'q5',
      number: 5,
      title: 'What now?',
      subtitle: 'What is one small way you can hold or navigate this with care?',
      placeholder: 'What is one gentle step forward?'
    }
  ]
};

export const PREDEFINED_PROMPTS = [
  {
    id: 'work_first',
    label: "Work, before a 'first'",
    isWarning: false,
    answers: {
      q1: "I have to present our new quarterly strategy to the leadership team tomorrow morning. It's the first time I'm leading the presentation alone.",
      q2: "Restless energy, tight shoulders, and a constant urge to re-check my slides for tiny errors.",
      q3: "I want my team's hard work to be recognized, and I care deeply about being taken seriously in this role.",
      q4: "Whenever I step into high-visibility situations, my mind defaults to hyper-vigilance to prevent any potential criticism.",
      q5: "I will review my main outline once, close the deck by 9 PM, and practice 4-7-8 breathing before bed."
    }
  },
  {
    id: 'snapped_sister',
    label: "Snapped at my sister",
    isWarning: false,
    answers: {
      q1: "My sister asked a simple question about dinner plans after I came home exhausted, and I responded with sharp irritation.",
      q2: "Instant guilt, heavy pit in my stomach, and lingering annoyance at myself.",
      q3: "I love her and value our relationship, but my energy was completely depleted from a long work day.",
      q4: "When I suppress workplace fatigue, the closest people in my life end up absorbing the spillover frustration.",
      q5: "I will apologize directly, explain my low energy transparently, and take 15 minutes of quiet time to decompress."
    }
  },
  {
    id: 'sunday_heaviness',
    label: "Sunday heaviness",
    isWarning: false,
    answers: {
      q1: "It's Sunday afternoon, and a quiet wave of dread and weight started settling in about the upcoming week.",
      q2: "Sluggishness, low motivation, and a subtle knot of anticipation in my stomach.",
      q3: "I value peace of mind on weekends, but work stress bleeds into my resting time.",
      q4: "Sunday evening has historically triggered anxiety about back-to-back meetings and unread emails.",
      q5: "I will write down top 3 priorities for Monday so my brain can release the mental clutter today."
    }
  },
  {
    id: 'said_yes',
    label: "Said yes again",
    isWarning: false,
    answers: {
      q1: "A coworker asked me to take over their project deck deadline, and I immediately agreed even though my schedule is full.",
      q2: "Resentment, feeling overcommitted, and frustration at my inability to set firm boundaries.",
      q3: "My personal time and core tasks are being compromised to avoid momentary discomfort or disappointing others.",
      q4: "I have a long-standing habit of equating saying 'no' with being unhelpful or selfish.",
      q5: "I will communicate a realistic timeline extension for the deck and practice saying 'Let me check my schedule first' next time."
    }
  },
  {
    id: 'genuinely_unclear',
    label: "Genuinely unclear",
    isWarning: true,
    answers: {
      q1: "Something felt off during the team meeting today, but I can't pinpoint the exact trigger or conversation.",
      q2: "Vague unease, distraction, and a nagging sense of uncertainty.",
      q3: "I like having emotional clarity, and feeling confused makes me feel ungrounded.",
      q4: "When subtle social cues are ambiguous, I over-analyze every detail looking for meaning.",
      q5: "I will give myself permission to not have it all solved today and focus on physical grounding exercises."
    }
  },
  {
    id: 'claims_fine',
    label: "Claims fine",
    isWarning: true,
    answers: {
      q1: "People asked how I was doing today and I automatically replied 'I'm completely fine', even though I felt overwhelmed.",
      q2: "Numbness, emotional detachment, and slight tension in my throat.",
      q3: "Hiding my real state isolates me from genuine support and drains my emotional capacity.",
      q4: "I default to self-reliance because asking for help used to feel vulnerable or burdensome.",
      q5: "I will acknowledge my true feelings in this journal without needing to pretend for anyone."
    }
  },
  {
    id: 'almost_blank',
    label: "Almost all blank",
    isWarning: true,
    answers: {
      q1: "Nothing specific occurred today, just a quiet, empty routine.",
      q2: "Flat mood, neutral energy, quiet stillness.",
      q3: "I am learning to notice quiet days without feeling like I should be producing more.",
      q4: "Life has natural lulls between high-intensity periods.",
      q5: "I will embrace the low-demand evening and rest without expectation."
    }
  },
  {
    id: 'two_readings',
    label: "Two readings possible",
    isWarning: true,
    answers: {
      q1: "My manager left a brief message saying 'Let's talk tomorrow', which could mean positive feedback or a critical issue.",
      q2: "Ambivalence, mind jumping between hope and defensive anxiety.",
      q3: "My sense of professional security and competence feels put on hold.",
      q4: "Short messages trigger my catastrophic thinking habit.",
      q5: "I will remind myself that brief messages are usually routine, and reserve judgment until the actual meeting."
    }
  },
  {
    id: 'custom',
    label: "Write your own",
    isWarning: false,
    answers: {
      q1: "",
      q2: "",
      q3: "",
      q4: "",
      q5: ""
    }
  }
];

const DRAFT_KEY = 'iw_guided_writing_draft_v2';

export default function GuidedWritePage({ journeyConfig = STANDARD_GUIDED_JOURNEY, onSignOut }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    q5: ''
  });
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [resumeCount, setResumeCount] = useState(0);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  
  // Post-submission states
  const [screenState, setScreenState] = useState('writing'); // 'writing' | 'reading' | 'reflection' | 'crisis'
  const [savedEntry, setSavedEntry] = useState(null);
  const [generatedReflection, setGeneratedReflection] = useState(null);
  const [isCrisis, setIsCrisis] = useState(false);
  const [playerInterventionId, setPlayerInterventionId] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const textareaRef = useRef(null);

  // Restore draft on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.answers && Object.values(parsed.answers).some(a => Boolean(a && a.trim()))) {
            setAnswers(parsed.answers);
            setCurrentStep(parsed.currentStep || 0);
            setStartedAt(parsed.startedAt || new Date().toISOString());
            setResumeCount((parsed.resumeCount || 0) + 1);
            setIsDraftRestored(true);
          }
        }
      } catch (e) {
        console.warn('Failed to restore guided writing draft:', e);
      }
    }
  }, []);

  // Autosave to localStorage
  useEffect(() => {
    if (screenState !== 'writing') return;
    if (typeof window !== 'undefined') {
      try {
        const payload = {
          answers,
          currentStep,
          startedAt,
          resumeCount
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
        setIsSaving(true);
        const timer = setTimeout(() => setIsSaving(false), 800);
        return () => clearTimeout(timer);
      } catch (e) {
        console.warn('Failed to autosave guided writing draft:', e);
      }
    }
  }, [answers, currentStep, screenState, startedAt, resumeCount]);

  // Focus textarea when step changes
  useEffect(() => {
    if (screenState === 'writing' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentStep, screenState]);

  const questions = journeyConfig.questions || STANDARD_GUIDED_JOURNEY.questions;
  const activeQuestion = questions[currentStep] || questions[0];
  const activeAnswerKey = activeQuestion.id;
  const currentAnswerText = answers[activeAnswerKey] || '';

  const handleAnswerChange = (text) => {
    setAnswers(prev => ({ ...prev, [activeAnswerKey]: text }));
  };

  const handleNextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleDiscardDraft = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (e) {}
    }
    setAnswers({ q1: '', q2: '', q3: '', q4: '', q5: '' });
    setCurrentStep(0);
    setStartedAt(new Date().toISOString());
    setResumeCount(0);
    setIsDraftRestored(false);
    setShowDiscardModal(false);
  };

  const handleCompleteGuidedWriting = async () => {
    const combinedContent = questions.map((q) => {
      const ans = (answers[q.id] || '').trim();
      return `### ${q.title}\n${ans || '(No response entered.)'}`;
    }).join('\n\n');

    const totalWords = combinedContent.split(/\s+/).filter(Boolean).length;
    if (totalWords < 5) {
      setSubmitError('Please write a bit more before submitting your guided reflection.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setScreenState('reading');

    const completedAt = new Date().toISOString();
    const startTimeMs = new Date(startedAt).getTime();
    const completionTimeSec = Math.max(10, Math.round((Date.now() - startTimeMs) / 1000));

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-date': new Date().toISOString().split('T')[0]
        },
        body: JSON.stringify({
          content: combinedContent,
          entry_mode: 'guided',
          started_at: startedAt,
          completed_at: completedAt,
          completion_time: completionTimeSec,
          resume_count: resumeCount
        })
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to save your guided writing entry.');
      }

      // Clear draft on successful save
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch (e) {}
      }

      setSavedEntry(json.entry);
      setGeneratedReflection(json.entry?.reflection || null);
      setIsCrisis(Boolean(json.entry?.crisis_flag));

      // Gentle pause to show reading state before showing reflection
      setTimeout(() => {
        setScreenState(json.entry?.crisis_flag ? 'crisis' : 'reflection');
        setIsSubmitting(false);
      }, 1200);

    } catch (err) {
      console.error('Failed to submit guided entry:', err);
      setSubmitError(err.message || 'An unexpected error occurred while saving.');
      setScreenState('writing');
      setIsSubmitting(false);
    }
  };

  if (playerInterventionId) {
    return (
      <InterventionPlayer
        interventionId={playerInterventionId}
        onBack={() => setPlayerInterventionId(null)}
        onComplete={() => {
          setPlayerInterventionId(null);
          if (typeof window !== 'undefined') {
            if (typeof window.navigateTo === 'function') window.navigateTo('/dashboard');
            else window.location.href = '/dashboard';
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans flex flex-col justify-between selection:bg-[#8DBFB4]/30 selection:text-primary">
      <DashboardNavbar activeTab="write" />

      <main className="max-w-[760px] w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-20 space-y-6 flex-1 flex flex-col">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => window.navigateTo('/dashboard')}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-secondary hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
          >
            <ArrowLeft size={13} />
            <span>Dashboard</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#1A5040] px-2.5 py-1 bg-[#8DBFB4]/15 rounded-full flex items-center gap-1">
              <Compass size={11} /> Guided Mode
            </span>
            {screenState === 'writing' && (
              <button
                onClick={() => setShowDiscardModal(true)}
                className="text-[11px] text-mid hover:text-accent transition-colors cursor-pointer border-none bg-transparent flex items-center gap-1"
                title="Discard in-progress draft"
              >
                <Trash2 size={12} />
                <span>Discard</span>
              </button>
            )}
          </div>
        </div>

        {/* WRITING MODE */}
        {screenState === 'writing' && (
          <div className="flex-1 flex flex-col space-y-6">
            
            {/* Draft Restored Banner */}
            {isDraftRestored && (
              <div className="bg-[#8DBFB4]/10 border border-[#8DBFB4]/25 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-primary">
                <div className="flex items-center gap-2">
                  <RotateCcw size={13} className="text-[#1A5040]" />
                  <span>Resumed in-progress guided writing session.</span>
                </div>
                <button
                  onClick={() => setIsDraftRestored(false)}
                  className="text-[10px] uppercase font-bold text-[#1A5040] hover:underline cursor-pointer border-none bg-transparent"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Step Progress Header */}
            <div className="bg-white rounded-2xl border border-[#1E2A2E]/8 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                  Step {currentStep + 1} of {questions.length}
                </span>
                <span className="text-[10px] text-mid font-mono flex items-center gap-1">
                  {isSaving ? (
                    <span className="text-[#8DBFB4] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8DBFB4] animate-ping" /> Saving...
                    </span>
                  ) : (
                    <span className="text-mid/60 flex items-center gap-1">
                      <Check size={11} className="text-[#8DBFB4]" /> Draft Saved
                    </span>
                  )}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-primary/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#8DBFB4] to-[#5A4A8A] transition-all duration-300 rounded-full"
                  style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Prompt Title & Subtitle */}
              <div className="space-y-1 pt-1 text-left">
                <h1 className="font-serif text-2xl md:text-3xl font-normal text-primary">
                  {activeQuestion.title}
                </h1>
                {activeQuestion.subtitle && (
                  <p className="text-xs md:text-sm text-mid font-serif italic">
                    {activeQuestion.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Textarea Workspace */}
            <div className="flex-1 bg-white rounded-2xl border border-[#1E2A2E]/8 p-6 md:p-8 shadow-xs flex flex-col space-y-4 relative">
              {submitError && (
                <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl text-xs text-accent flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{submitError}</span>
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={currentAnswerText}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder={activeQuestion.placeholder}
                className="w-full flex-1 min-h-[220px] bg-transparent border-none resize-none focus:outline-none font-serif text-base md:text-lg text-primary leading-relaxed placeholder:text-mid/40 placeholder:font-serif italic"
              />

              {/* Navigation Controls */}
              <div className="pt-4 border-t border-[#1E2A2E]/5 flex items-center justify-between gap-4">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border-none ${
                    currentStep === 0 
                      ? 'opacity-40 cursor-not-allowed bg-transparent text-mid' 
                      : 'bg-primary/5 hover:bg-primary/10 text-primary cursor-pointer'
                  }`}
                >
                  Previous
                </button>

                <div className="flex items-center gap-3">
                  {currentStep < questions.length - 1 ? (
                    <button
                      onClick={handleNextStep}
                      className="px-6 py-2.5 bg-primary hover:bg-[#2A3A3E] text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-2 border-none"
                    >
                      <span>Next Question</span>
                      <ArrowRight size={13} />
                    </button>
                  ) : (
                    <button
                      onClick={handleCompleteGuidedWriting}
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-[#8DBFB4] hover:bg-[#7aaea3] text-primary rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-2 border-none"
                    >
                      <Sparkles size={14} />
                      <span>{isSubmitting ? 'Submitting...' : 'Complete & Reflect'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* READING / REFLECTION SYNTHESIS STATE */}
        {screenState === 'reading' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#8DBFB4]/20 border border-[#8DBFB4]/40 flex items-center justify-center text-[#1A5040] animate-spin" style={{ animationDuration: '3s' }}>
              <Sparkles size={20} />
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-2xl text-primary font-normal">Reading patterns...</h2>
              <p className="text-xs text-mid font-serif italic max-w-sm">
                Synthesizing your guided responses into a calm, grounding observation.
              </p>
            </div>
          </div>
        )}

        {/* POST-SUBMISSION REFLECTION STATE */}
        {(screenState === 'reflection' || screenState === 'crisis') && (
          <div className="space-y-8 animate-fade-in text-left">
            
            {/* Top Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Submitted Guided Answers */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-xl border border-[#1E2A2E]/5 p-6 md:p-8 shadow-xs space-y-6">
                  <div className="border-b border-[#1E2A2E]/5 pb-4 flex items-center justify-between">
                    <h2 className="font-serif text-lg text-primary font-normal flex items-center gap-2">
                      <BookOpen size={18} className="text-secondary" />
                      <span>Guided Writing Record</span>
                    </h2>
                    <span className="text-[9px] uppercase font-bold text-[#1A5040] px-2 py-0.5 bg-[#8DBFB4]/15 rounded-full">
                      5 Answers Captured
                    </span>
                  </div>

                  <div className="space-y-6">
                    {questions.map((q) => {
                      const ans = answers[q.id] || '';
                      return (
                        <div key={q.id} className="space-y-1.5 border-b border-[#1E2A2E]/5 pb-4 last:border-none">
                          <div className="text-[10px] uppercase font-bold tracking-wider text-secondary">
                            {q.number}. {q.title}
                          </div>
                          <p className="font-serif text-[14.5px] leading-relaxed text-primary/90 italic pl-3 border-l-2 border-[#8DBFB4]/40">
                            "{ans.trim() || 'No answer entered.'}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: AI Reflection & Crisis Support Card */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Crisis Support Banner */}
                {isCrisis && (
                  <div className="bg-white rounded-xl border border-accent/20 p-5 shadow-xs space-y-4">
                    <div className="flex items-start gap-2.5 text-accent font-semibold">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs">Confidential Support Services</div>
                        <p className="text-[11px] text-mid font-normal leading-relaxed mt-0.5">
                          This entry was flagged for emotional support. Confidential resources are available 24/7.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <a href="tel:9152987821" className="flex flex-col items-center justify-center p-2.5 bg-accent/5 border border-accent/20 rounded-xl text-center">
                        <div className="font-semibold text-[11px] text-primary">iCall</div>
                        <span className="text-[9px] uppercase font-bold text-accent mt-1">Call</span>
                      </a>
                      <a href="tel:18602662345" className="flex flex-col items-center justify-center p-2.5 bg-[#8DBFB4]/10 border border-[#8DBFB4]/25 rounded-xl text-center">
                        <div className="font-semibold text-[11px] text-primary">Vandrevala</div>
                        <span className="text-[9px] uppercase font-bold text-[#1A5040] mt-1">24/7</span>
                      </a>
                      <a href="https://wa.me/919152987821" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-2.5 bg-[#B8A8D4]/10 border border-[#B8A8D4]/25 rounded-xl text-center">
                        <div className="font-semibold text-[11px] text-primary">WhatsApp</div>
                        <span className="text-[9px] uppercase font-bold text-[#5A4A8A] mt-1">Text</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* AI Reflection Card */}
                <div className="bg-white rounded-xl border border-[#1E2A2E]/5 p-6 shadow-xs space-y-5">
                  <div className="border-b border-[#1E2A2E]/5 pb-3 flex items-center justify-between">
                    <h3 className="font-serif text-[15px] text-primary font-normal flex items-center gap-2">
                      <Compass size={16} className="text-[#5A4A8A]" />
                      <span>AI Reflection</span>
                    </h3>
                    {generatedReflection?.classification && (
                      <span className="text-[8.5px] bg-[#5A4A8A]/10 text-[#5A4A8A] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                        {generatedReflection.classification}
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <p className="text-[13px] text-primary leading-relaxed whitespace-pre-wrap font-serif">
                      {generatedReflection?.reflection_text && !generatedReflection.reflection_text.includes('Processing')
                        ? generatedReflection.reflection_text
                        : "You unpacked your experience with care today. We are holding a quiet, grounding space for your thoughts."
                      }
                    </p>
                    
                    {(generatedReflection?.closing_question || "What is feeling the most steady or grounding for you right now?") && (
                      <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/15 space-y-1.5 mt-3">
                        <div className="text-[8px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1">
                          <HelpCircle size={10} />
                          <span>Inquiry for contemplation</span>
                        </div>
                        <p className="font-serif text-sm italic text-primary/95 leading-relaxed">
                          "{generatedReflection?.closing_question || "What is feeling the most steady or grounding for you right now?"}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Full-Width Post Journal Interventions */}
            <div className="pt-8 border-t border-[#1E2A2E]/10">
              <PostJournalInterventions
                isCrisis={isCrisis}
                onLaunchIntervention={(id) => setPlayerInterventionId(id)}
              />
            </div>
          </div>
        )}

      </main>

      {/* DISCARD DRAFT MODAL */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#1E2A2E]/10 p-6 max-w-sm w-full space-y-4 shadow-xl text-left">
            <h3 className="font-serif text-lg text-primary font-normal">Discard Guided Draft?</h3>
            <p className="text-xs text-mid leading-relaxed">
              This will erase all in-progress answers for this guided session. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDiscardModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-mid hover:text-primary bg-transparent border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDiscardDraft}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-accent text-white hover:bg-accent/90 border-none cursor-pointer"
              >
                Discard Draft
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-6 border-t border-primary/5 bg-white text-center text-[10px] text-mid/60 mt-12">
        Ingress Within · Secure Encryption Active
      </footer>
    </div>
  );
}
