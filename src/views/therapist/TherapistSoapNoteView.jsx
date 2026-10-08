import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Save,
  CheckCircle2,
  Lock,
  AlertCircle,
  Clock,
  Check,
  Shield,
  ArrowLeft,
  X
} from 'lucide-react';

export default function TherapistSoapNoteView({
  sessionId,
  appointmentId,
  onBack,
  onClose,
  onFinalized,
  isEmbedded = false
}) {
  const targetId = sessionId || appointmentId;

  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [isDraft, setIsDraft] = useState(true);
  const [finalizedAt, setFinalizedAt] = useState(null);
  const [finalizedBy, setFinalizedBy] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSaved, setLastSaved] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmFinalizeOpen, setConfirmFinalizeOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  // Ref to track if user has made changes since load
  const isDirtyRef = useRef(false);
  const timerRef = useRef(null);

  // 1. Fetch existing SOAP note
  const loadSoapNote = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/therapist/sessions/${targetId}/soap`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to load SOAP note.');
      }
      const json = await res.json();
      if (json.note) {
        setSubjective(json.note.subjective || '');
        setObjective(json.note.objective || '');
        setAssessment(json.note.assessment || '');
        setPlan(json.note.plan || '');
        setIsDraft(Boolean(json.note.isDraft ?? json.note.is_draft));
        setFinalizedAt(json.note.finalizedAt || json.note.finalized_at || null);
        setFinalizedBy(json.note.finalizedBy || null);
        setLastSaved(new Date(json.note.updatedAt || json.note.updated_at || Date.now()));
      }
    } catch (err) {
      console.error('Failed to load SOAP note:', err);
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    loadSoapNote();
  }, [loadSoapNote]);

  // 2. Save Draft implementation
  const saveDraft = async (manual = false) => {
    if (!isDraft && finalizedAt) return; // Cannot edit finalized note
    if (!isDirtyRef.current && !manual) return;

    setSaveStatus('saving');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/therapist/sessions/${targetId}/soap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjective,
          objective,
          assessment,
          plan,
          is_draft: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to save draft.');
      }

      isDirtyRef.current = false;
      setSaveStatus('saved');
      setLastSaved(new Date());

      // Reset 'saved' pill after 3s
      setTimeout(() => {
        setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
      }, 3000);
    } catch (err) {
      console.error('SOAP draft save error:', err);
      setSaveStatus('error');
      setErrorMessage(err.message);
    }
  };

  // 3. Debounced Autosave (2.5 seconds of typing pause)
  const handleFieldChange = (setter) => (e) => {
    if (!isDraft && finalizedAt) return;
    setter(e.target.value);
    isDirtyRef.current = true;
    setSaveStatus('idle');

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveDraft(false);
    }, 2500);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 4. Finalize SOAP Note
  const handleFinalize = async () => {
    // Client-side quick check
    if (!subjective.trim() || !objective.trim() || !assessment.trim() || !plan.trim()) {
      setErrorMessage('All four SOAP sections (Subjective, Objective, Assessment, Plan) must contain meaningful clinical content before finalization.');
      setConfirmFinalizeOpen(false);
      return;
    }

    setFinalizing(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/therapist/sessions/${targetId}/soap/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjective,
          objective,
          assessment,
          plan,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to finalize note.');
      }

      setIsDraft(false);
      setFinalizedAt(data.note.finalizedAt || new Date().toISOString());
      setFinalizedBy(data.note.finalizedBy || null);
      setSaveStatus('saved');
      setConfirmFinalizeOpen(false);
      isDirtyRef.current = false;

      if (onFinalized) {
        onFinalized(data.note);
      }
    } catch (err) {
      console.error('Finalize error:', err);
      setErrorMessage(err.message);
      setConfirmFinalizeOpen(false);
    } finally {
      setFinalizing(false);
    }
  };

  const isReadOnly = !isDraft && Boolean(finalizedAt);

  if (loading) {
    return (
      <div className="bg-white border border-[#132A24]/10 rounded-2xl p-8 space-y-6">
        <div className="h-6 w-48 bg-[#132A24]/10 rounded animate-pulse" />
        <div className="space-y-4">
          <div className="h-24 bg-[#132A24]/5 rounded animate-pulse" />
          <div className="h-24 bg-[#132A24]/5 rounded animate-pulse" />
          <div className="h-24 bg-[#132A24]/5 rounded animate-pulse" />
          <div className="h-24 bg-[#132A24]/5 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${!isEmbedded ? 'max-w-4xl mx-auto' : ''}`}>
      {/* Top Header / Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#132A24]/10 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3">
          {(onBack || onClose) && (
            <button
              onClick={onBack || onClose}
              className="p-2 rounded-lg border border-[#132A24]/10 hover:bg-[#132A24]/5 text-[#132A24]/70 hover:text-[#132A24] cursor-pointer transition-colors"
              title="Go back"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-[#4E7A66]/10 text-[#4E7A66] flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-medium text-[#132A24]">
                Clinical SOAP Note
              </h2>
              {isReadOnly ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#4E7A66]/15 text-[#4E7A66] uppercase tracking-wider">
                  <CheckCircle2 size={12} /> Finalized
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                  Draft
                </span>
              )}
            </div>
            <p className="text-xs text-[#132A24]/60 mt-0.5">
              Subjective &bull; Objective &bull; Assessment &bull; Plan
            </p>
          </div>
        </div>

        {/* Status indicator & Save Controls */}
        <div className="flex items-center gap-3">
          {!isReadOnly && (
            <>
              {saveStatus === 'saving' && (
                <span className="text-xs text-[#132A24]/50 flex items-center gap-1.5 animate-pulse">
                  <Clock size={13} /> Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-xs text-[#4E7A66] flex items-center gap-1.5 font-medium">
                  <Check size={13} /> Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-xs text-red-600 flex items-center gap-1.5 font-medium">
                  <AlertCircle size={13} /> Unable to save
                </span>
              )}

              {lastSaved && saveStatus === 'idle' && (
                <span className="text-[11px] text-[#132A24]/40 hidden sm:inline-block">
                  Saved {lastSaved.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}

              <button
                type="button"
                onClick={() => saveDraft(true)}
                disabled={saveStatus === 'saving'}
                className="px-3.5 py-2 rounded-lg border border-[#132A24]/15 bg-white text-xs font-semibold text-[#132A24] hover:bg-[#132A24]/5 transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save size={13} /> Save Draft
              </button>

              <button
                type="button"
                onClick={() => setConfirmFinalizeOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#4E7A66] text-white text-xs font-semibold hover:bg-[#4E7A66]/90 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 size={14} /> Finalize Note
              </button>
            </>
          )}

          {isReadOnly && finalizedAt && (
            <div className="text-right text-xs text-[#132A24]/60">
              <span className="font-semibold text-[#132A24] block">Locked Clinical Record</span>
              <span className="text-[11px]">
                Finalized on {new Date(finalizedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Clinical Note Error</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-red-400 hover:text-red-700 p-0.5 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Privacy Boundary & Privileged Medical Record Banner */}
      <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10 text-xs text-[#132A24]/70 flex items-start gap-3">
        <Lock size={15} className="text-[#4E7A66] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#132A24] block font-medium mb-0.5">
            Strict Practitioner RLS Isolation & Client Privacy Boundary
          </strong>
          <span>
            This SOAP clinical documentation is confidential and privileged. It is never displayed to clients, never shared across unauthorized practitioners, and never populated from private client journals or reflections.
          </span>
        </div>
      </div>

      {/* SOAP Sections Form */}
      <div className="space-y-5">
        {/* [S] Subjective */}
        <div className="bg-white border border-[#132A24]/10 rounded-2xl p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[#132A24] flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#4E7A66]/10 text-[#4E7A66] flex items-center justify-center text-[11px] font-bold">
                S
              </span>
              Subjective — Client's Reported Experience
            </label>
            <span className="text-[10px] text-[#132A24]/40 font-mono">
              {subjective.length}/10,000
            </span>
          </div>
          <p className="text-[11px] text-[#132A24]/50">
            Primary presenting issues, direct quotes, emotional state, narrative context, and symptoms as reported by the client.
          </p>
          <textarea
            rows={4}
            value={subjective}
            onChange={handleFieldChange(setSubjective)}
            readOnly={isReadOnly}
            placeholder={isReadOnly ? 'No notes recorded.' : "Client states: 'Feeling overwhelmed with work deadlines...' Reported sleep disturbances for the past 3 days..."}
            className={`w-full border rounded-xl p-3.5 text-xs outline-hidden transition-all ${
              isReadOnly
                ? 'bg-[#FAFAF8] border-[#132A24]/10 text-[#132A24]/80 cursor-default resize-none'
                : 'border-[#132A24]/15 bg-white text-[#132A24] focus:border-[#4E7A66] focus:ring-1 focus:ring-[#4E7A66]'
            }`}
          />
        </div>

        {/* [O] Objective */}
        <div className="bg-white border border-[#132A24]/10 rounded-2xl p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[#132A24] flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#4E7A66]/10 text-[#4E7A66] flex items-center justify-center text-[11px] font-bold">
                O
              </span>
              Objective — Clinician Observations & Affect
            </label>
            <span className="text-[10px] text-[#132A24]/40 font-mono">
              {objective.length}/10,000
            </span>
          </div>
          <p className="text-[11px] text-[#132A24]/50">
            Affect, eye contact, speech rate and cadence, cognitive coherence, behavioural cues, psychomotor activity, and clinical presentation.
          </p>
          <textarea
            rows={4}
            value={objective}
            onChange={handleFieldChange(setObjective)}
            readOnly={isReadOnly}
            placeholder={isReadOnly ? 'No notes recorded.' : 'Affect appeared anxious with rapid speech rate. Good eye contact maintained throughout session. Coherent thought process...'}
            className={`w-full border rounded-xl p-3.5 text-xs outline-hidden transition-all ${
              isReadOnly
                ? 'bg-[#FAFAF8] border-[#132A24]/10 text-[#132A24]/80 cursor-default resize-none'
                : 'border-[#132A24]/15 bg-white text-[#132A24] focus:border-[#4E7A66] focus:ring-1 focus:ring-[#4E7A66]'
            }`}
          />
        </div>

        {/* [A] Assessment */}
        <div className="bg-white border border-[#132A24]/10 rounded-2xl p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[#132A24] flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#4E7A66]/10 text-[#4E7A66] flex items-center justify-center text-[11px] font-bold">
                A
              </span>
              Assessment — Clinical Formulation & Progress
            </label>
            <span className="text-[10px] text-[#132A24]/40 font-mono">
              {assessment.length}/10,000
            </span>
          </div>
          <p className="text-[11px] text-[#132A24]/50">
            Clinical analysis, appraisal of treatment response, diagnostic considerations, defense mechanisms, and progress toward therapeutic goals.
          </p>
          <textarea
            rows={4}
            value={assessment}
            onChange={handleFieldChange(setAssessment)}
            readOnly={isReadOnly}
            placeholder={isReadOnly ? 'No notes recorded.' : 'Client demonstrating acute adjustment stress with generalized anxiety features. Good psychological mindedness and responsiveness to cognitive reframing...'}
            className={`w-full border rounded-xl p-3.5 text-xs outline-hidden transition-all ${
              isReadOnly
                ? 'bg-[#FAFAF8] border-[#132A24]/10 text-[#132A24]/80 cursor-default resize-none'
                : 'border-[#132A24]/15 bg-white text-[#132A24] focus:border-[#4E7A66] focus:ring-1 focus:ring-[#4E7A66]'
            }`}
          />
        </div>

        {/* [P] Plan */}
        <div className="bg-white border border-[#132A24]/10 rounded-2xl p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[#132A24] flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#4E7A66]/10 text-[#4E7A66] flex items-center justify-center text-[11px] font-bold">
                P
              </span>
              Plan — Therapeutic Interventions & Next Steps
            </label>
            <span className="text-[10px] text-[#132A24]/40 font-mono">
              {plan.length}/10,000
            </span>
          </div>
          <p className="text-[11px] text-[#132A24]/50">
            Assigned homework, psychoeducational tools, modality interventions planned for subsequent sessions, follow-up schedule, and safety monitoring.
          </p>
          <textarea
            rows={4}
            value={plan}
            onChange={handleFieldChange(setPlan)}
            readOnly={isReadOnly}
            placeholder={isReadOnly ? 'No notes recorded.' : 'Introduce 5-4-3-2-1 grounding exercise. Assign thought record worksheet for catastrophic appraisals. Next session scheduled in 1 week...'}
            className={`w-full border rounded-xl p-3.5 text-xs outline-hidden transition-all ${
              isReadOnly
                ? 'bg-[#FAFAF8] border-[#132A24]/10 text-[#132A24]/80 cursor-default resize-none'
                : 'border-[#132A24]/15 bg-white text-[#132A24] focus:border-[#4E7A66] focus:ring-1 focus:ring-[#4E7A66]'
            }`}
          />
        </div>
      </div>

      {/* Confirmation Modal for Finalization */}
      <AnimatePresence>
        {confirmFinalizeOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-[#132A24]/10 shadow-xl max-w-md w-full p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                <AlertCircle size={24} />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="font-serif text-lg font-medium text-[#132A24]">
                  Finalize this SOAP note?
                </h3>
                <p className="text-xs text-[#132A24]/60 leading-relaxed">
                  Finalized clinical notes cannot be edited through normal editing and become the permanent, immutable medical record for this encounter. Please review your entries carefully before proceeding.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#FAFAF8] border border-[#132A24]/5 text-[11px] text-[#132A24]/70 space-y-1">
                <div className="flex items-center gap-1.5 text-[#4E7A66] font-semibold">
                  <Shield size={12} /> Clinical Provenance Checklist
                </div>
                <div>&bull; Subjective, Objective, Assessment, and Plan populated</div>
                <div>&bull; Immutable timestamp recorded upon confirmation</div>
                <div>&bull; Session encounter permanently documented</div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmFinalizeOpen(false)}
                  disabled={finalizing}
                  className="flex-1 py-2.5 rounded-lg border border-[#132A24]/15 text-xs font-medium text-[#132A24] hover:bg-[#132A24]/5 cursor-pointer disabled:opacity-50"
                >
                  Cancel & Review
                </button>
                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={finalizing}
                  className="flex-1 py-2.5 rounded-lg bg-[#4E7A66] text-white text-xs font-semibold hover:bg-[#4E7A66]/90 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {finalizing ? 'Finalizing...' : 'Finalize Note'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
