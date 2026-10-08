import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Calendar,
  FileText,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Shield,
  Milestone,
  Plus,
  RefreshCw,
  X
} from 'lucide-react';

export default function TherapistCareJourneyView({
  clientId,
  onOpenSchedule,
  onOpenSoap,
  onNavigate,
  onReloadCaseload,
}) {
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [targetStage, setTargetStage] = useState('');
  const [transitionReason, setTransitionReason] = useState('');
  const [submittingTransition, setSubmittingTransition] = useState(false);
  const [transitionError, setTransitionError] = useState('');

  const fetchJourney = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/therapist/clients/${clientId}/journey`);
      if (res.ok) {
        const json = await res.json();
        setJourney(json);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.error?.message || 'Failed to load client care journey.');
      }
    } catch (err) {
      console.error('Failed to load care journey:', err);
      setError(err.message || 'Network error while loading care journey.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchJourney();
    }
  }, [clientId]);

  const STAGE_LABELS = {
    intake: 'Intake',
    active_care: 'Active Care',
    maintenance: 'Maintenance',
    completed: 'Completed',
  };

  const STAGE_COLORS = {
    intake: 'bg-amber-100 text-amber-900 border-amber-200',
    active_care: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    maintenance: 'bg-blue-100 text-blue-900 border-blue-200',
    completed: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  // Determine valid forward transitions based on state machine
  const getAvailableTransitions = (currentStage) => {
    switch (currentStage) {
      case 'intake':
        return [
          { stage: 'active_care', label: 'Move to Active Care', style: 'bg-[#132A24] text-white hover:bg-[#132A24]/90' },
          { stage: 'completed', label: 'Complete Care', style: 'bg-white border border-[#132A24]/20 text-[#132A24] hover:bg-[#132A24]/5' },
        ];
      case 'active_care':
        return [
          { stage: 'maintenance', label: 'Move to Maintenance', style: 'bg-[#132A24] text-white hover:bg-[#132A24]/90' },
          { stage: 'completed', label: 'Complete Care', style: 'bg-white border border-[#132A24]/20 text-[#132A24] hover:bg-[#132A24]/5' },
        ];
      case 'maintenance':
        return [
          { stage: 'active_care', label: 'Step Up to Active Care', style: 'bg-[#132A24] text-white hover:bg-[#132A24]/90' },
          { stage: 'completed', label: 'Complete Care', style: 'bg-white border border-[#132A24]/20 text-[#132A24] hover:bg-[#132A24]/5' },
        ];
      case 'completed':
      default:
        return [];
    }
  };

  const handleOpenConfirm = (stage) => {
    setTargetStage(stage);
    setTransitionReason('');
    setTransitionError('');
    setConfirmModalOpen(true);
  };

  const handleExecuteTransition = async () => {
    if (!targetStage) return;
    setSubmittingTransition(true);
    setTransitionError('');

    try {
      const res = await fetch(`/api/therapist/clients/${clientId}/journey/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          careStage: targetStage,
          reason: transitionReason.trim() || undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setConfirmModalOpen(false);
        setNotice(`Care stage successfully updated to ${STAGE_LABELS[targetStage] || targetStage}.`);
        await fetchJourney();
        if (onReloadCaseload) onReloadCaseload();
        setTimeout(() => setNotice(''), 4000);
      } else {
        setTransitionError(json.error?.message || 'Failed to update care stage.');
      }
    } catch (err) {
      console.error('Transition failed:', err);
      setTransitionError(err.message || 'Network error executing stage transition.');
    } finally {
      setSubmittingTransition(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#132A24]/50 animate-pulse">
        Loading care journey...
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="p-8 bg-red-50/50 border border-red-200 rounded-xl text-center space-y-2">
        <AlertCircle size={24} className="mx-auto text-red-600" />
        <h4 className="font-serif text-base text-red-900">Care Journey Unavailable</h4>
        <p className="text-xs text-red-700">{error || 'Unable to load authorized relationship records.'}</p>
        <button
          onClick={fetchJourney}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-300 text-xs text-red-800 hover:bg-red-50 cursor-pointer"
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }

  const { client, relationship, stageHistory, intake, safetySummary, sessions, latestSession, nextSession, latestSoapNote } = journey;

  const currentStage = relationship?.careStage || 'intake';
  const isTerminal = currentStage === 'completed' || relationship?.status === 'completed' || relationship?.status === 'terminated';
  const availableTransitions = getAvailableTransitions(currentStage);

  const startedDateFormatted = relationship?.startedAt
    ? new Date(relationship.startedAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Unknown';

  // Construct longitudinal timeline events from real persisted records
  const timelineEvents = [];

  if (relationship?.startedAt) {
    timelineEvents.push({
      date: new Date(relationship.startedAt),
      title: 'Care Relationship Started',
      description: `Established clinical care relationship under Ingress Within tenancy.`,
      type: 'start',
    });
  }

  (stageHistory || []).forEach((h) => {
    timelineEvents.push({
      date: new Date(h.changedAt),
      title: `Stage Changed: ${STAGE_LABELS[h.previousStage] || h.previousStage} → ${STAGE_LABELS[h.newStage] || h.newStage}`,
      description: h.reason ? `Reason: ${h.reason}` : `Transitioned by clinical practitioner.`,
      type: h.newStage === 'completed' ? 'terminal' : 'stage',
    });
  });

  if (latestSession && latestSession.status === 'completed') {
    timelineEvents.push({
      date: new Date(latestSession.scheduledStart),
      title: 'Clinical Consultation Completed',
      description: `${latestSession.sessionType || 'Video'} session completed.`,
      type: 'session',
    });
  }

  if (latestSoapNote && !latestSoapNote.isDraft && latestSoapNote.finalizedAt) {
    timelineEvents.push({
      date: new Date(latestSoapNote.finalizedAt),
      title: 'Clinical SOAP Note Finalized',
      description: `Immutable clinical documentation locked for session.`,
      type: 'soap',
    });
  }

  // Sort chronological descending (latest event on top)
  timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      {/* SUCCESS NOTICE */}
      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* TOP CARE JOURNEY BANNER */}
      <div className="bg-[#FAFAF8] border border-[#132A24]/10 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#4E7A66]">
              Care Journey
            </span>
            <h2 className="font-serif text-2xl text-[#132A24] font-normal mt-0.5">
              {client.displayName}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#132A24]/60 mt-1">
              <span>
                Relationship: <strong className="capitalize text-[#132A24]">{relationship.status}</strong>
              </span>
              <span>&bull;</span>
              <span>
                Started: <strong className="text-[#132A24]">{startedDateFormatted}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#132A24]/50">
              Current Stage
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                STAGE_COLORS[currentStage] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {STAGE_LABELS[currentStage] || currentStage.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* STAGE CHANGE CONTROLS */}
        <div className="pt-4 border-t border-[#132A24]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-[#132A24]/70">
            {isTerminal ? (
              <span className="text-gray-600 font-medium">
                Care completed. Relationship is archived in terminal state.
              </span>
            ) : (
              <span>Transition care progression:</span>
            )}
          </div>

          {!isTerminal && availableTransitions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {availableTransitions.map((t) => (
                <button
                  key={t.stage}
                  onClick={() => handleOpenConfirm(t.stage)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${t.style}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SESSIONS & CLINICAL METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#132A24]/10 rounded-xl p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#132A24]/50 block">
            Total Sessions
          </span>
          <span className="font-serif text-2xl font-semibold text-[#132A24] mt-1 block">
            {sessions.total}
          </span>
        </div>
        <div className="bg-white border border-[#132A24]/10 rounded-xl p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">
            Completed
          </span>
          <span className="font-serif text-2xl font-semibold text-emerald-800 mt-1 block">
            {sessions.completed}
          </span>
        </div>
        <div className="bg-white border border-[#132A24]/10 rounded-xl p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 block">
            Upcoming
          </span>
          <span className="font-serif text-2xl font-semibold text-blue-800 mt-1 block">
            {sessions.upcoming}
          </span>
        </div>
        <div className="bg-white border border-[#132A24]/10 rounded-xl p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#132A24]/50 block">
            Cancelled
          </span>
          <span className="font-serif text-2xl font-semibold text-[#132A24]/70 mt-1 block">
            {sessions.cancelled}
          </span>
        </div>
      </div>

      {/* SESSION & SOAP QUICK CONTEXT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next / Latest Session */}
        <div className="bg-white border border-[#132A24]/10 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A24]/60 flex items-center gap-1.5">
              <Calendar size={13} className="text-[#4E7A66]" />
              {nextSession ? 'Next Upcoming Session' : 'Latest Session'}
            </h4>
            {!isTerminal && (
              <button
                onClick={() => onOpenSchedule && onOpenSchedule(clientId, client.displayName)}
                className="text-xs text-[#4E7A66] font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus size={12} /> Book Session
              </button>
            )}
          </div>

          {nextSession ? (
            <div className="bg-[#FAFAF8] border border-[#132A24]/10 rounded-lg p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#132A24]">
                  {new Date(nextSession.scheduledStart).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })} at{' '}
                  {new Date(nextSession.scheduledStart).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-100 text-blue-800">
                  {nextSession.status}
                </span>
              </div>
              <span className="text-[11px] text-[#132A24]/60 block capitalize">
                Modality: {nextSession.sessionType}
              </span>
            </div>
          ) : latestSession ? (
            <div className="bg-[#FAFAF8] border border-[#132A24]/10 rounded-lg p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#132A24]">
                  {new Date(latestSession.scheduledStart).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })} at{' '}
                  {new Date(latestSession.scheduledStart).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-gray-100 text-gray-700">
                  {latestSession.status}
                </span>
              </div>
              <span className="text-[11px] text-[#132A24]/60 block capitalize">
                Modality: {latestSession.sessionType}
              </span>
            </div>
          ) : (
            <p className="text-xs text-[#132A24]/50 italic">No scheduled sessions on record.</p>
          )}
        </div>

        {/* Latest Clinical SOAP Note */}
        <div className="bg-white border border-[#132A24]/10 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A24]/60 flex items-center gap-1.5">
              <FileText size={13} className="text-[#4E7A66]" />
              Clinical SOAP Documentation
            </h4>
            {latestSoapNote && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                  latestSoapNote.isDraft
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                {latestSoapNote.status}
              </span>
            )}
          </div>

          {latestSoapNote ? (
            <div className="bg-[#FAFAF8] border border-[#132A24]/10 rounded-lg p-3 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#132A24]/70">
                  {latestSoapNote.finalizedAt
                    ? `Finalized on ${new Date(latestSoapNote.finalizedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}`
                    : `Last edited ${new Date(latestSoapNote.updatedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}`}
                </span>
                <button
                  onClick={() => onOpenSoap && onOpenSoap(latestSoapNote.appointmentId)}
                  className="px-2.5 py-1 rounded bg-[#132A24] text-white text-[11px] hover:bg-[#132A24]/90 cursor-pointer"
                >
                  {latestSoapNote.isDraft ? 'Continue Draft' : 'View Note'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#132A24]/50 italic">No SOAP notes created yet.</p>
          )}
        </div>
      </div>

      {/* AUTHORIZED CLINICAL CONTEXT & SAFETY SUMMARY */}
      <div className="bg-white border border-[#132A24]/10 rounded-xl p-5 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A24]/60">
          Authorized Intake & Clinical Profile
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-semibold text-[#132A24] block mb-1">Presenting Concerns:</span>
            <p className="text-[#132A24]/80 leading-relaxed bg-[#FAFAF8] p-3 rounded-lg border border-[#132A24]/5">
              {intake?.presentingReason || 'No presenting reason specified during intake.'}
            </p>
          </div>

          <div>
            <span className="font-semibold text-[#132A24] block mb-1">Safety & Triage Evaluation:</span>
            <div className="bg-[#FAFAF8] p-3 rounded-lg border border-[#132A24]/5 space-y-1">
              {safetySummary ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[#132A24]/60">Triage Level:</span>
                    <strong className="text-[#132A24] uppercase">{safetySummary.triageLevel}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#132A24]/60">Safety Status:</span>
                    <span className="capitalize font-medium text-[#132A24]">{safetySummary.safetyStatus}</span>
                  </div>
                  {safetySummary.evaluatedAt && (
                    <div className="text-[10px] text-[#132A24]/40 pt-1 border-t border-[#132A24]/5">
                      Last evaluated: {new Date(safetySummary.evaluatedAt).toLocaleDateString('en-IN')}
                    </div>
                  )}
                </>
              ) : (
                <span className="text-[#132A24]/50 italic">Standard intake triage - no elevated flags.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PRIVACY BOUNDARY NOTICE */}
      <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10 flex gap-3 items-start text-xs text-[#132A24]/70">
        <Lock size={16} className="text-[#4E7A66] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-[#132A24] block">Client Self-Work Privacy Boundary</span>
          <p className="text-[11px] leading-relaxed">
            Personal journal entries, reflections, and self-help modules completed by the client are strictly private to the client and are never accessible through this clinical portal.
          </p>
        </div>
      </div>

      {/* LONGITUDINAL JOURNEY TIMELINE */}
      <div className="bg-white border border-[#132A24]/10 rounded-xl p-5 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A24]/60 flex items-center gap-2">
          <Milestone size={14} className="text-[#4E7A66]" />
          Longitudinal Care Timeline
        </h4>

        {timelineEvents.length === 0 ? (
          <p className="text-xs text-[#132A24]/50 italic py-4">No care journey events yet.</p>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#132A24]/10">
            {timelineEvents.map((evt, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-[#4E7A66] flex items-center justify-center" />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-[#4E7A66]">
                      {evt.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="font-semibold text-xs text-[#132A24]">{evt.title}</span>
                  </div>
                  <p className="text-xs text-[#132A24]/70 leading-relaxed">{evt.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STAGE TRANSITION CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-[#132A24]/10 shadow-2xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#132A24]/10 pb-3">
                <h3 className="font-serif text-lg text-[#132A24] font-medium">
                  Move this client to {STAGE_LABELS[targetStage] || targetStage}?
                </h3>
                <button
                  onClick={() => setConfirmModalOpen(false)}
                  disabled={submittingTransition}
                  className="p-1 rounded-md text-[#132A24]/40 hover:text-[#132A24] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-[#132A24]/70 leading-relaxed">
                This changes the current care stage for this clinical relationship from{' '}
                <strong className="capitalize">{STAGE_LABELS[currentStage] || currentStage}</strong> to{' '}
                <strong className="capitalize">{STAGE_LABELS[targetStage] || targetStage}</strong>. An immutable transition history record will be created.
              </p>

              {targetStage === 'completed' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed">
                  <strong>Notice:</strong> Completing care sets this relationship to a terminal state. Future active-care session bookings will be restricted, while all historical records, sessions, and SOAP notes remain preserved.
                </div>
              )}

              {transitionError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                  {transitionError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#132A24]/70 block">
                  Transition Clinical Rationale (Optional):
                </label>
                <textarea
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  placeholder="e.g., Client achieved symptom remission and completed active treatment plan..."
                  rows={3}
                  className="w-full p-2.5 border border-[#132A24]/15 rounded-lg text-xs outline-hidden focus:border-[#4E7A66] focus:ring-1 focus:ring-[#4E7A66]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#132A24]/10">
                <button
                  onClick={() => setConfirmModalOpen(false)}
                  disabled={submittingTransition}
                  className="px-4 py-2 rounded-lg border border-[#132A24]/20 bg-white text-xs text-[#132A24] hover:bg-[#132A24]/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteTransition}
                  disabled={submittingTransition}
                  className="px-4 py-2 rounded-lg bg-[#132A24] text-white text-xs font-medium hover:bg-[#132A24]/90 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {submittingTransition ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" /> Updating...
                    </>
                  ) : (
                    'Confirm Change'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
