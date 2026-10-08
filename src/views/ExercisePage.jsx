import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Lock,
  Play,
  CheckCircle2,
  Clock,
  RotateCw,
  Layers,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  ArrowRight,
  Eye,
  FileCheck
} from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';
import Exercise0Flow from '../components/exercise/v4/Exercise0Flow';
import Exercise0ResultView from '../components/exercise/v4/Exercise0ResultView';
import Exercise1Flow from '../components/exercise/v4/Exercise1Flow';
import Exercise1ResultView from '../components/exercise/v4/Exercise1ResultView';
import Exercise2Flow from '../components/exercise/v4/Exercise2Flow';
import Exercise2ResultView from '../components/exercise/v4/Exercise2ResultView';
import Exercise3Flow from '../components/exercise/v4/Exercise3Flow';
import Exercise3ResultView from '../components/exercise/v4/Exercise3ResultView';
import CoreValuesFlow from '../components/exercise/v4/CoreValuesFlow';
import CoreValuesResultView from '../components/exercise/v4/CoreValuesResultView';
import RelationshipMapFlow from '../components/exercise/v4/RelationshipMapFlow';
import RelationshipMapResultView from '../components/exercise/v4/RelationshipMapResultView';
import BodySignalFlow from '../components/exercise/v4/BodySignalFlow';
import BodySignalResultView from '../components/exercise/v4/BodySignalResultView';
import AvoidanceAuditFlow from '../components/exercise/v4/AvoidanceAuditFlow';
import AvoidanceAuditResultView from '../components/exercise/v4/AvoidanceAuditResultView';
import CostBenefitAuditFlow from '../components/exercise/v4/CostBenefitAuditFlow';
import CostBenefitAuditResultView from '../components/exercise/v4/CostBenefitAuditResultView';
import TriggerMappingFlow from '../components/exercise/v4/TriggerMappingFlow';
import TriggerMappingResultView from '../components/exercise/v4/TriggerMappingResultView';
import NarrativeArcFlow from '../components/exercise/v4/NarrativeArcFlow';
import NarrativeArcResultView from '../components/exercise/v4/NarrativeArcResultView';
import SixMonthAssessmentFlow from '../components/exercise/v4/SixMonthAssessmentFlow';
import SixMonthAssessmentResultView from '../components/exercise/v4/SixMonthAssessmentResultView';
import UnfinishedConversationFlow from '../components/exercise/v4/UnfinishedConversationFlow';
import UnfinishedConversationResultView from '../components/exercise/v4/UnfinishedConversationResultView';
import RecurringScenarioFlow from '../components/exercise/v4/RecurringScenarioFlow';
import RecurringScenarioResultView from '../components/exercise/v4/RecurringScenarioResultView';
import YearEndPortraitFlow from '../components/exercise/v4/YearEndPortraitFlow';
import YearEndPortraitResultView from '../components/exercise/v4/YearEndPortraitResultView';

// Founder-approved exercise definitions & titles
const EXERCISE_METADATA = {
  year_end_portrait: {
    title: 'Year-End Self-Portrait',
    category: 'Universal Anchor',
    description: 'Synthesize 12 months of self-reflection, recurring patterns, and internal shifts into a comprehensive annual portrait.',
    unlockDay: 365,
    getProgress: () => `In Progress`
  },
  '15': {
    title: 'Year-End Self-Portrait',
    category: 'Universal Anchor',
    description: 'Synthesize 12 months of self-reflection, recurring patterns, and internal shifts into a comprehensive annual portrait.',
    unlockDay: 365,
    getProgress: () => `In Progress`
  },
  'year-end-portrait': {
    title: 'Year-End Self-Portrait',
    category: 'Universal Anchor',
    description: 'Synthesize 12 months of self-reflection, recurring patterns, and internal shifts into a comprehensive annual portrait.',
    unlockDay: 365,
    getProgress: () => `In Progress`
  },
  recurring_scenario: {
    title: 'Recurring Scenario Exercise',
    category: 'Cognitive',
    description: 'Examine anticipatory cognition: scenarios rehearsed before, replayed after, assumed inevitable, or avoided entirely.',
    unlockDay: 304,
    getProgress: () => `In Progress`
  },
  '10': {
    title: 'Recurring Scenario Exercise',
    category: 'Cognitive',
    description: 'Examine anticipatory cognition: scenarios rehearsed before, replayed after, assumed inevitable, or avoided entirely.',
    unlockDay: 304,
    getProgress: () => `In Progress`
  },
  'recurring-scenario': {
    title: 'Recurring Scenario Exercise',
    category: 'Cognitive',
    description: 'Examine anticipatory cognition: scenarios rehearsed before, replayed after, assumed inevitable, or avoided entirely.',
    unlockDay: 304,
    getProgress: () => `In Progress`
  },
  unfinished_conversation: {
    title: 'Unfinished Conversation',
    category: 'Relational',
    description: 'Examine an unfinished interpersonal conversation, what silence is protecting, and what it costs.',
    unlockDay: 213,
    getProgress: () => `In Progress`
  },
  '10A': {
    title: 'Unfinished Conversation',
    category: 'Relational',
    description: 'Examine an unfinished interpersonal conversation, what silence is protecting, and what it costs.',
    unlockDay: 213,
    getProgress: () => `In Progress`
  },
  'unfinished-conversation': {
    title: 'Unfinished Conversation',
    category: 'Relational',
    description: 'Examine an unfinished interpersonal conversation, what silence is protecting, and what it costs.',
    unlockDay: 213,
    getProgress: () => `In Progress`
  },
  six_month_assessment: {
    title: '6-Month Self-Assessment',
    category: 'Anchor',
    description: 'Change tracking at the self-perception and identity level across 6 months of practice.',
    unlockDay: 183,
    getProgress: () => `In Progress`
  },
  exercise_9: {
    title: '6-Month Self-Assessment',
    category: 'Anchor',
    description: 'Change tracking at the self-perception and identity level across 6 months of practice.',
    unlockDay: 183,
    getProgress: () => `In Progress`
  },
  exercise_0: {
    title: 'Baseline Assessment',
    category: 'Baseline',
    description: '12-question initial assessment used to personalize your experience.',
    unlockDay: 1,
    getProgress: (inst) => `Question ${inst.current_step || 1} of 12`
  },
  ocean: {
    title: 'Baseline Assessment',
    category: 'Baseline',
    description: '12-question initial assessment used to personalize your experience.',
    unlockDay: 1,
    getProgress: (inst) => `Question ${inst.current_step || 1} of 12`
  },
  exercise_1: {
    title: 'Word Association Test',
    category: 'Implicit',
    description: '12-word speed association revealing implicit emotional registers and suppression dynamics.',
    unlockDay: 10,
    getProgress: (inst) => `Word ${inst.current_step || 1} of 12`
  },
  word_association: {
    title: 'Word Association Test',
    category: 'Implicit',
    description: '12-word speed association revealing implicit emotional registers and suppression dynamics.',
    unlockDay: 10,
    getProgress: (inst) => `Word ${inst.current_step || 1} of 12`
  },
  exercise_2: {
    title: 'Inkblot Projective Test',
    category: 'Projective',
    description: '5-image inkblot projective test measuring primary defense mechanisms and emotional resonance.',
    unlockDay: 16,
    getProgress: (inst) => `Image ${inst.current_image || 1} of 5 · Step ${inst.current_step || 1} of 3`
  },
  inkblot_projective: {
    title: 'Inkblot Projective Test',
    category: 'Projective',
    description: '5-image inkblot projective test measuring primary defense mechanisms and emotional resonance.',
    unlockDay: 16,
    getProgress: (inst) => `Image ${inst.current_image || 1} of 5 · Step ${inst.current_step || 1} of 3`
  },
  exercise_3: {
    title: 'Self Perception Test',
    category: 'Identity',
    description: 'Structured self-perception mapping measuring self-ideal congruence and identity alignment.',
    unlockDay: 24,
    getProgress: (inst) => `Question ${inst.current_step || 1} of 5`
  },
  self_perception: {
    title: 'Self Perception Test',
    category: 'Identity',
    description: 'Structured self-perception mapping measuring self-ideal congruence and identity alignment.',
    unlockDay: 24,
    getProgress: (inst) => `Question ${inst.current_step || 1} of 5`
  },
  core_values_card_sort: {
    title: 'Core Values Card Sort',
    category: 'Values',
    description: '5–7 minute forced-choice values exercise mapping your primary behavioral principles.',
    unlockDay: 35,
    getProgress: () => `In Progress`
  },
  core_values: {
    title: 'Core Values Card Sort',
    category: 'Values',
    description: '5–7 minute forced-choice values exercise mapping your primary behavioral principles.',
    unlockDay: 35,
    getProgress: () => `In Progress`
  },
  exercise_4: {
    title: 'Core Values Card Sort',
    category: 'Values',
    description: '5–7 minute forced-choice values exercise mapping your primary behavioral principles.',
    unlockDay: 35,
    getProgress: () => `In Progress`
  },
  relationship_map: {
    title: 'Relationship Map',
    category: 'Relationships',
    description: 'Map the people taking up mental space, energy dynamics, and communication patterns.',
    unlockDay: 42,
    getProgress: () => `In Progress`
  },
  exercise_5: {
    title: 'Relationship Map',
    category: 'Relationships',
    description: 'Map the people taking up mental space, energy dynamics, and communication patterns.',
    unlockDay: 42,
    getProgress: () => `In Progress`
  },
  body_signal_inventory: {
    title: 'Body Signal Inventory',
    category: 'Somatic',
    description: 'Structured somatic inventory mapping physical signals across 6 body systems.',
    unlockDay: 49,
    getProgress: () => `In Progress`
  },
  exercise_6: {
    title: 'Body Signal Inventory',
    category: 'Somatic',
    description: 'Structured somatic inventory mapping physical signals across 6 body systems.',
    unlockDay: 49,
    getProgress: () => `In Progress`
  },
  avoidance_audit: {
    title: 'Avoidance Audit',
    category: 'Cognitive',
    description: 'Six incomplete sentence stems exposing subtle avoidance behaviors, procrastination, and hidden fears.',
    unlockDay: 91,
    getProgress: () => `In Progress`
  },
  cost_benefit_audit: {
    title: 'Cost-Benefit Audit',
    category: 'Cognitive',
    description: 'Examine 3 to 5 persistent behavioral or emotional patterns by exploring their hidden protective functions, origins, real costs, and ongoing validity.',
    unlockDay: 122,
    getProgress: () => `In Progress`
  },
  trigger_mapping: {
    title: 'Trigger Mapping',
    category: 'Cognitive',
    description: 'Map 3 to 5 moments when something triggered a bigger reaction than it seemed to call for. Explore your first somatic/cognitive reaction, what you wanted to avoid, and patterns across them.',
    unlockDay: 152,
    getProgress: () => `In Progress`
  },
  narrative_arc: {
    title: 'Narrative Arc Exercise',
    category: 'Identity',
    description: 'Identify stable structures beneath emotional variability across the past 3 months.',
    unlockDay: 274,
    getProgress: () => `In Progress`
  },
  identity_statements: {
    title: 'Identity Statements',
    category: 'Identity',
    description: 'Examine foundational identity statements, internal rules, and evolving self-definitions.',
    unlockDay: 244,
    getProgress: () => `In Progress`
  },
  values_revisit: {
    title: 'Values Revisit',
    category: 'Values',
    description: 'Revisit your core values card sort results after 11 months of practice to measure developmental shifts.',
    unlockDay: 335,
    getProgress: () => `In Progress`
  },
  year_end_portrait: {
    title: 'Year-End Self-Portrait',
    category: 'Integration',
    description: 'Synthesize 12 months of self-reflection, recurring patterns, and internal shifts into a comprehensive annual portrait.',
    unlockDay: 365,
    getProgress: () => `In Progress`
  },
  exercise_7: {
    title: 'Avoidance Audit',
    category: 'Cognitive',
    description: 'Six incomplete sentence stems exposing subtle avoidance behaviors, procrastination, and hidden fears.',
    unlockDay: 91,
    getProgress: () => `In Progress`
  }
};

export default function ExercisePage({ user, profile, onSignOut }) {
  const [loading, setLoading] = useState(true);
  const [instances, setInstances] = useState([]);
  const [error, setError] = useState(null);
  const [activeExerciseInstanceId, setActiveExerciseInstanceId] = useState(null);
  const [activeResultInstanceId, setActiveResultInstanceId] = useState(null);
  const [activeResponses, setActiveResponses] = useState([]);

  useEffect(() => {
    fetchExerciseInstances();
  }, []);

  const fetchExerciseInstances = async () => {
    setLoading(true);
    setError(null);
    try {
      const clientDate = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/exercises', {
        headers: {
          'x-client-date': clientDate
        }
      });
      if (!res.ok) throw new Error('Failed to fetch exercise instances');
      const data = await res.json();
      setInstances(data.instances || []);
    } catch (err) {
      console.error('[ExercisePage] Fetch error:', err);
      setError(err.message || 'Unable to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExercise = async (exerciseId) => {
    try {
      const res = await fetch('/api/exercises/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercise_id: exerciseId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to start exercise');

      if (data.instance) {
        setActiveExerciseInstanceId(data.instance.id);
        if (data.responses) setActiveResponses(data.responses);
        await fetchExerciseInstances();
      }
    } catch (err) {
      console.error('[ExercisePage] Start error:', err);
      alert(`Could not start exercise: ${err.message}`);
    }
  };

  const handleResumeExercise = async (instanceId) => {
    try {
      const res = await fetch(`/api/exercises/current?instance_id=${instanceId}`);
      const data = await res.json();
      setActiveExerciseInstanceId(instanceId);
      setActiveResponses(data.responses || []);
    } catch (err) {
      console.error('[ExercisePage] Resume error:', err);
      setActiveExerciseInstanceId(instanceId);
    }
  };

  // Dynamic lifecycle-driven dashboard summary counts
  const availableCount = instances.filter(i => i.status === 'available').length;
  const inProgressCount = instances.filter(i => ['started', 'in_progress', 'analysing'].includes(i.status)).length;
  const completedCount = instances.filter(i => i.status === 'completed').length;
  const lockedCount = instances.filter(i => i.status === 'locked').length;

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans pb-16">
      <DashboardNavbar user={user} profile={profile} onSignOut={onSignOut} />

      {/* Render Active Exercise Flow Modal if Active */}
      {activeExerciseInstanceId && (() => {
        const inst = instances.find(i => i.id === activeExerciseInstanceId);
        if (!inst) return null;

        const exId = inst.exercise_id;
        
        if (exId === 'relationship_map' || exId === 'exercise_5') {
          return (
            <RelationshipMapFlow
              instanceId={activeExerciseInstanceId}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'body_signal_inventory' || exId === 'exercise_6') {
          return (
            <BodySignalFlow
              instanceId={activeExerciseInstanceId}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'trigger_mapping') {
          return (
            <TriggerMappingFlow
              instanceId={activeExerciseInstanceId}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'unfinished_conversation' || exId === '10A' || exId === 'unfinished-conversation') {
          return (
            <UnfinishedConversationFlow
              instanceId={activeExerciseInstanceId}
              instance={inst}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'year_end_portrait' || exId === 'exercise_15' || exId === 'year-end-portrait' || exId === '15') {
          return (
            <YearEndPortraitFlow
              instanceId={activeExerciseInstanceId}
              instance={inst}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'recurring_scenario' || exId === 'exercise_10' || exId === 'recurring-scenario' || exId === '10') {
          return (
            <RecurringScenarioFlow
              instanceId={activeExerciseInstanceId}
              instance={inst}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'six_month_assessment' || exId === 'exercise_9') {
          return (
            <SixMonthAssessmentFlow
              instanceId={activeExerciseInstanceId}
              instance={inst}
              userBranch={profile?.branch_assignment || 'A'}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'narrative_arc') {
          return (
            <NarrativeArcFlow
              instanceId={activeExerciseInstanceId}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'avoidance_audit' || exId === 'exercise_7') {
          return (
            <AvoidanceAuditFlow
              instanceId={activeExerciseInstanceId}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'cost_benefit_audit') {
          return (
            <CostBenefitAuditFlow
              instanceId={activeExerciseInstanceId}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'core_values_card_sort' || exId === 'core_values' || exId === 'exercise_4') {
          return (
            <CoreValuesFlow
              instanceId={activeExerciseInstanceId}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'exercise_3' || exId === 'self_perception') {
          return (
            <Exercise3Flow
              instance={inst}
              initialResponses={activeResponses}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'exercise_2' || exId === 'inkblot_projective') {
          return (
            <Exercise2Flow
              instance={inst}
              initialResponses={activeResponses}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'exercise_1' || exId === 'word_association') {
          return (
            <Exercise1Flow
              instanceId={activeExerciseInstanceId}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'exercise_0' || exId === 'ocean') {
          return (
            <Exercise0Flow
              instanceId={activeExerciseInstanceId}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        return null;
      })()}

      {/* Render Exercise Result View Modal if Active */}
      {activeResultInstanceId && (() => {
        const inst = instances.find(i => i.id === activeResultInstanceId);
        if (!inst) return null;

        const exId = inst.exercise_id;

        if (exId === 'relationship_map' || exId === 'exercise_5') {
          return (
            <RelationshipMapResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'body_signal_inventory' || exId === 'exercise_6') {
          return (
            <BodySignalResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'trigger_mapping') {
          return (
            <TriggerMappingResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'unfinished_conversation' || exId === '10A' || exId === 'unfinished-conversation') {
          return (
            <UnfinishedConversationResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'year_end_portrait' || exId === 'exercise_15' || exId === 'year-end-portrait' || exId === '15') {
          return (
            <YearEndPortraitResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'recurring_scenario' || exId === 'exercise_10' || exId === 'recurring-scenario' || exId === '10') {
          return (
            <RecurringScenarioResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'six_month_assessment' || exId === 'exercise_9') {
          return (
            <SixMonthAssessmentResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'narrative_arc') {
          return (
            <NarrativeArcResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'avoidance_audit' || exId === 'exercise_7') {
          return (
            <AvoidanceAuditResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'cost_benefit_audit') {
          return (
            <CostBenefitAuditResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'core_values_card_sort' || exId === 'core_values' || exId === 'exercise_4') {
          return (
            <CoreValuesResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'exercise_3' || exId === 'self_perception') {
          return (
            <Exercise3ResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'exercise_2' || exId === 'inkblot_projective') {
          return (
            <Exercise2ResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'exercise_1' || exId === 'word_association') {
          return (
            <Exercise1ResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'exercise_0' || exId === 'ocean') {
          return (
            <Exercise0ResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        return null;
      })()}

      <main className="max-w-[1140px] mx-auto px-6 pt-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#1E2A2E]/10 pb-6">
          <div>
            <button
              onClick={() => window.navigateTo('/dashboard')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-mid hover:text-primary transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-3">
              <img 
                src="/logo-mark-transparent.png" 
                alt="Ingress Within" 
                className="w-8 h-8 object-contain flex-shrink-0" 
              />
              <div>
                <h1 className="font-serif text-2xl md:text-3xl text-primary font-normal">
                  Exercise Hub
                </h1>
                <p className="text-sm text-mid mt-0.5">
                  Complete baseline assessments and unlock targeted psychological reframing tools.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchExerciseInstances}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-line bg-white hover:bg-[#FAF9F6] transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Refresh Status
            </button>
          </div>
        </div>

        {/* Dashboard Lifecycle Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white-paper rounded-2xl p-4 sm:p-5 border border-primary/10 shadow-xs space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-mid">Pending</span>
            <div className="font-serif text-xl text-primary font-normal">{inProgressCount}</div>
          </div>
          <div className="bg-white-paper rounded-2xl p-4 sm:p-5 border border-primary/10 shadow-xs space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-mid">Available</span>
            <div className="font-serif text-xl text-accent font-normal">{availableCount}</div>
          </div>
          <div className="bg-white-paper rounded-2xl p-4 sm:p-5 border border-primary/10 shadow-xs space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-mid">Completed</span>
            <div className="font-serif text-xl text-secondary font-normal">{completedCount}</div>
          </div>
          <div className="bg-white-paper rounded-2xl p-4 sm:p-5 border border-primary/10 shadow-xs space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-mid">Locked</span>
            <div className="font-serif text-xl text-mid/60 font-normal">{lockedCount}</div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <RotateCw className="w-6 h-6 animate-spin mx-auto text-secondary opacity-60 mb-2" />
            <p className="text-xs text-mid">Loading exercise catalog...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-error-subtle border border-error/20 text-error text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instances.map((inst) => {
              const meta = EXERCISE_METADATA[inst.exercise_id] || {
                title: 'Psychological Exercise',
                category: 'Assessment',
                description: 'Structured psychological reframing exercise.',
                unlockDay: 1,
                getProgress: () => `In Progress`
              };

              const isLocked = inst.status === 'locked';
              const isCompleted = inst.status === 'completed';
              const isAnalysing = inst.status === 'analysing';
              const isInProgress = ['started', 'in_progress'].includes(inst.status);
              const isAvailable = inst.status === 'available';

              return (
                <div
                  key={inst.id}
                  className={`bg-white-paper rounded-2xl p-5 sm:p-6 border transition-all flex flex-col justify-between shadow-xs ${
                    isCompleted
                      ? 'border-secondary/30 bg-secondary/5'
                      : isInProgress || isAnalysing
                      ? 'border-accent/40 shadow-sm'
                      : isLocked
                      ? 'border-primary/5 opacity-60'
                      : 'border-primary/10 hover:border-accent/30 hover:shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                        {meta.category}
                      </span>
                      
                      {/* Status Badge Driven strictly by Lifecycle */}
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary/15 text-primary border border-secondary/30 text-[10px] sm:text-[11px] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-secondary" />
                          Completed
                        </span>
                      ) : isAnalysing ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 text-[10px] sm:text-[11px] font-semibold animate-pulse">
                          <Clock className="w-3 h-3" />
                          Analysing
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 text-[10px] sm:text-[11px] font-semibold animate-pulse">
                          <Clock className="w-3 h-3" />
                          In Progress
                        </span>
                      ) : isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-warm-paper text-mid/60 border border-primary/10 text-[10px] sm:text-[11px] font-semibold">
                          <Lock className="w-3 h-3" />
                          Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 text-[10px] sm:text-[11px] font-semibold">
                          Available
                        </span>
                      )}
                    </div>

                    {/* Founder Display Title */}
                    <h3 className="font-serif text-lg text-primary mb-2 font-normal">
                      {meta.title}
                    </h3>

                    {/* Founder Description */}
                    <p className="text-xs text-mid leading-relaxed mb-4">
                      {meta.description}
                    </p>

                    {/* Stored Progress Indicator */}
                    {(isInProgress || isAnalysing) && (
                      <div className="text-[11px] font-medium text-secondary mb-6 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-secondary" />
                        <span>{meta.getProgress(inst)}</span>
                      </div>
                    )}
                  </div>

                  {/* Lifecycle-driven CTAs */}
                  <div className="pt-4">
                    {isCompleted ? (
                      <button
                        onClick={() => setActiveResultInstanceId(inst.id)}
                        className="w-full py-2.5 rounded-xl bg-white-paper border border-primary/15 hover:border-accent hover:bg-accent/5 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        View Results
                      </button>
                    ) : isAnalysing ? (
                      <button
                        onClick={() => handleResumeExercise(inst.id)}
                        className="w-full py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-[#654652] active:bg-[#533842] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Status
                      </button>
                    ) : isInProgress ? (
                      <button
                        onClick={() => handleResumeExercise(inst.id)}
                        className="w-full py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-[#654652] active:bg-[#533842] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Continue Exercise
                      </button>
                    ) : isLocked ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl bg-warm-paper text-mid/50 border border-primary/5 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        {inst.metadata?.unlock_label ? `Locked (${inst.metadata.unlock_label})` : `Locked (Unlocks Day ${meta.unlockDay})`}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartExercise(inst.exercise_id)}
                        className="w-full py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-[#654652] active:bg-[#533842] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Begin Exercise
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
