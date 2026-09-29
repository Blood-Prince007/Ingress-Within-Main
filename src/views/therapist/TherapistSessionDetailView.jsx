import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Video,
  User,
  ShieldCheck,
  ArrowLeft,
  FileText,
  AlertCircle,
  ExternalLink,
  History,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Play,
  Lock,
  Edit3,
  RefreshCw
} from 'lucide-react';
import TherapistRescheduleModal from './TherapistRescheduleModal';
import TherapistSoapModal from './TherapistSoapModal';

export default function TherapistSessionDetailView({
  sessionId,
  onBack,
  onNavigate,
  onOpenClientProfile,
  onOpenSoap
}) {
  const [session, setSession] = useState(null);
  const [soapNote, setSoapNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [soapModalOpen, setSoapModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [syncRetrying, setSyncRetrying] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const handleRetryCalendarSync = async () => {
    setSyncRetrying(true);
    try {
      const res = await fetch('/api/therapy/sessions/sync-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Sync retry failed');
      }
      setActionNotice('Calendar sync successful! Google Meet generated.');
      setTimeout(() => setActionNotice(''), 4000);
      await fetchSessionData();
    } catch (err) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncRetrying(false);
    }
  };

  // 1. Fetch Session Details & SOAP note status
  const fetchSessionData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch session
      const res = await fetch(`/api/therapist/sessions/${sessionId}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to load session details.');
      }
      const json = await res.json();
      setSession(json.session);

      // Fetch SOAP note status
      try {
        const soapRes = await fetch(`/api/therapist/sessions/${sessionId}/soap`);
        if (soapRes.ok) {
          const soapJson = await soapRes.json();
          setSoapNote(soapJson.note);
        }
      } catch (e) {
        console.warn('SOAP note status lookup note:', e);
      }
    } catch (err) {
      console.error('Session detail error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  // 2. Start Session Handler
  const handleStartSession = async () => {
    setStarting(true);
    setActionNotice('');
    try {
      const res = await fetch(`/api/therapist/sessions/${sessionId}/start`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Failed to start session.');
      }
      setActionNotice('Session started. Clinical encounter is now in progress.');
      setTimeout(() => setActionNotice(''), 4000);
      await fetchSessionData();
    } catch (err) {
      alert(`Error starting session: ${err.message}`);
    } finally {
      setStarting(false);
    }
  };

  // 3. Cancel Session Handler
  const handleCancelSession = async () => {
    const reason = window.prompt('Please enter the reason for session cancellation:');
    if (reason === null) return; // User cancelled prompt

    setCancelling(true);
    setActionNotice('');
    try {
      const res = await fetch(`/api/therapist/sessions/${sessionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || 'Therapist requested cancellation' }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Failed to cancel session.');
      }
      setActionNotice('Session cancelled successfully.');
      setTimeout(() => setActionNotice(''), 4000);
      await fetchSessionData();
    } catch (err) {
      alert(`Error cancelling session: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  // 4. Complete Session Handler
  const handleCompleteSession = async () => {
    if (!window.confirm('Mark this clinical session as completed? This will finalize the encounter and register earnings.')) {
      return;
    }
    setCompleting(true);
    setActionNotice('');
    try {
      const res = await fetch(`/api/therapist/sessions/${sessionId}/complete`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Failed to mark session complete.');
      }
      setActionNotice('Session marked as completed.');
      setTimeout(() => setActionNotice(''), 4000);
      await fetchSessionData();
    } catch (err) {
      alert(`Error completing session: ${err.message}`);
    } finally {
      setCompleting(false);
    }
  };

  const handleOpenSoap = () => {
    if (onOpenSoap) {
      onOpenSoap(sessionId);
    } else {
      setSoapModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#132A24]/5 animate-pulse" />
          <div className="h-6 w-48 bg-[#132A24]/10 rounded animate-pulse" />
        </div>
        <div className="bg-white border border-[#132A24]/10 rounded-2xl p-8 space-y-4">
          <div className="h-8 w-1/3 bg-[#132A24]/5 rounded animate-pulse" />
          <div className="h-20 w-full bg-[#132A24]/5 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#132A24]/70 hover:text-[#132A24] cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Schedule
        </button>
        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center space-y-3">
          <AlertCircle size={32} className="mx-auto text-red-500" />
          <h3 className="font-serif text-lg font-medium text-[#132A24]">
            {error || 'Session Not Found'}
          </h3>
          <p className="text-xs text-[#132A24]/60 max-w-md mx-auto">
            The requested clinical session could not be retrieved. It may not exist or belongs to another provider.
          </p>
          <button
            onClick={fetchSessionData}
            className="px-4 py-2 rounded-lg bg-[#132A24] text-white text-xs font-medium cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const startDate = new Date(session.startsAt);
  const endDate = new Date(session.endsAt);

  const dateFormatted = startDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const startTimeFormatted = startDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const endTimeFormatted = endDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const isCancelled = session.status === 'cancelled';
  const isCompleted = session.status === 'completed';
  const isInProgress = session.status === 'in_progress';
  const isScheduled = session.status === 'scheduled' || session.status === 'confirmed' || session.status === 'rescheduled';
  const rawMeetUrl = session.googleMeetUrl || session.google_meet_url || null;
  const meetUrl = (rawMeetUrl && typeof rawMeetUrl === 'string' && rawMeetUrl.startsWith('https://meet.google.com/')) ? rawMeetUrl : null;
  const calSyncStatus = session.calendarSyncStatus || session.calendar_sync_status || 'not_connected';
  const meetStatus = session.googleMeetStatus || session.google_meet_status || (meetUrl ? 'created' : 'none');

  return (
    <div className="space-y-6">
      {/* Navigation Topbar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#132A24]/70 hover:text-[#132A24] cursor-pointer transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="flex items-center gap-2">
          {actionNotice && (
            <span className="text-xs text-[#4E7A66] font-medium animate-pulse">
              {actionNotice}
            </span>
          )}

          <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
            isCompleted
              ? 'bg-[#4E7A66]/10 text-[#4E7A66]'
              : isInProgress
              ? 'bg-amber-100 text-amber-800 animate-pulse'
              : isCancelled
              ? 'bg-red-50 text-red-600'
              : 'bg-blue-50 text-blue-700'
          }`}>
            {isInProgress ? 'In Progress' : session.status}
          </span>
        </div>
      </div>

      {/* Main Session Card */}
      <div className="bg-white border border-[#132A24]/10 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#132A24]/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#4E7A66] font-semibold uppercase tracking-wider mb-1">
              <Calendar size={14} /> Clinical Session Details
            </div>
            <h1 className="font-serif text-2xl lg:text-3xl font-normal text-[#132A24]">
              {dateFormatted}
            </h1>
            <p className="text-xs text-[#132A24]/60 mt-1 flex items-center gap-1.5">
              <Clock size={13} /> {startTimeFormatted} – {endTimeFormatted} ({session.durationMinutes || 50} mins)
            </p>
          </div>

          {/* Clinical Workflow Actions by State */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Google Meet Call Link */}
            {meetUrl && !isCancelled && (
              <a
                href={meetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all cursor-pointer no-underline shadow-xs"
              >
                <Video size={14} /> Join Google Meet
              </a>
            )}

            {/* Before Session Actions (Scheduled) */}
            {isScheduled && (
              <>
                <button
                  onClick={handleStartSession}
                  disabled={starting}
                  className="px-3.5 py-2 rounded-lg bg-[#4E7A66] text-white text-xs font-semibold hover:bg-[#4E7A66]/90 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Play size={13} /> {starting ? 'Starting...' : 'Start Session'}
                </button>
                <button
                  onClick={() => setRescheduleModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg border border-[#132A24]/15 text-xs font-medium text-[#132A24] hover:bg-[#132A24]/5 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RotateCcw size={13} /> Reschedule
                </button>
                <button
                  onClick={handleCancelSession}
                  disabled={cancelling}
                  className="px-3 py-2 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <XCircle size={13} /> {cancelling ? 'Cancelling...' : 'Cancel'}
                </button>
              </>
            )}

            {/* During Session Actions (In Progress) */}
            {isInProgress && (
              <>
                <button
                  onClick={handleOpenSoap}
                  className="px-4 py-2 rounded-lg bg-[#4E7A66] text-white text-xs font-semibold hover:bg-[#4E7A66]/90 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Edit3 size={13} /> Open SOAP Note
                </button>
                <button
                  onClick={handleCompleteSession}
                  disabled={completing}
                  className="px-3.5 py-2 rounded-lg border border-[#4E7A66]/30 text-xs font-medium text-[#4E7A66] hover:bg-[#4E7A66]/10 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 size={13} /> {completing ? 'Completing...' : 'Complete Session'}
                </button>
                <button
                  onClick={handleCancelSession}
                  disabled={cancelling}
                  className="px-3 py-2 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <XCircle size={13} /> {cancelling ? 'Cancelling...' : 'Cancel'}
                </button>
              </>
            )}

            {/* After Session Actions (Completed) */}
            {isCompleted && (
              <button
                onClick={handleOpenSoap}
                className="px-3.5 py-2 rounded-lg border border-[#132A24]/15 bg-white text-xs font-medium text-[#132A24] hover:bg-[#132A24]/5 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <FileText size={13} /> View SOAP Note
              </button>
            )}
          </div>
        </div>

        {/* Session Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#132A24]/5">
            <span className="text-[10px] uppercase font-bold text-[#132A24]/50 tracking-wider block mb-1">
              Session Format
            </span>
            <span className="text-xs font-semibold text-[#132A24] capitalize">
              {session.sessionType || 'Video'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#132A24]/5">
            <span className="text-[10px] uppercase font-bold text-[#132A24]/50 tracking-wider block mb-1">
              Modality
            </span>
            <span className="text-xs font-semibold text-[#132A24] capitalize">
              {session.modality || 'Telehealth'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#132A24]/5">
            <span className="text-[10px] uppercase font-bold text-[#132A24]/50 tracking-wider block mb-1">
              Care Stage
            </span>
            <span className="text-xs font-semibold text-[#132A24] capitalize">
              {(session.careStage || 'Active Care').replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Google Meet & Calendar Synchronization Card */}
        <div className="p-5 rounded-xl border border-[#132A24]/10 bg-[#FAF9F5] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Video size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A24]">
                  Google Meet Telehealth
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-[#132A24]/60">Google Calendar:</span>
                  {calSyncStatus === 'synced' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 size={12} /> Synced
                    </span>
                  ) : calSyncStatus === 'pending' || meetStatus === 'generating' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                      <RefreshCw size={12} className="animate-spin" /> Generating Meet Link...
                    </span>
                  ) : calSyncStatus === 'not_connected' ? (
                    <span className="text-[11px] text-[#132A24]/50">Not Connected</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                      <AlertCircle size={12} /> Calendar sync failed
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {meetUrl ? (
                <a
                  href={meetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 no-underline shadow-xs"
                >
                  <Video size={14} /> Join Google Meet
                </a>
              ) : (
                <span className="text-xs text-[#132A24]/50 italic">
                  {calSyncStatus === 'not_connected'
                    ? 'Google Calendar not connected'
                    : calSyncStatus === 'pending' || meetStatus === 'generating'
                    ? 'Google Meet link generating...'
                    : 'Google Meet unavailable'}
                </span>
              )}

              {(calSyncStatus === 'failed' || (calSyncStatus === 'synced' && !meetUrl)) && (
                <button
                  onClick={handleRetryCalendarSync}
                  disabled={syncRetrying}
                  className="px-3 py-2 rounded-lg border border-[#132A24]/15 bg-white text-xs font-medium text-[#132A24] hover:bg-[#132A24]/5 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RefreshCw size={12} className={syncRetrying ? 'animate-spin' : ''} />
                  Retry Calendar Sync
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clinical Documentation / SOAP Note Status Card */}
        <div className="p-5 rounded-xl border border-[#132A24]/10 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#4E7A66]/10 text-[#4E7A66] flex items-center justify-center">
                <FileText size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A24]">
                  Clinical SOAP Note
                </h4>
                <p className="text-[11px] text-[#132A24]/50">
                  {soapNote
                    ? soapNote.isDraft
                      ? 'Draft in progress'
                      : `Finalized on ${new Date(soapNote.finalizedAt).toLocaleDateString('en-IN')}`
                    : 'No clinical note started for this encounter.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenSoap}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors inline-flex items-center gap-1.5 ${
                soapNote && !soapNote.isDraft
                  ? 'border border-[#132A24]/15 bg-white text-[#132A24] hover:bg-[#132A24]/5'
                  : 'bg-[#4E7A66] text-white hover:bg-[#4E7A66]/90 shadow-xs'
              }`}
            >
              {soapNote ? (soapNote.isDraft ? 'Resume Draft' : 'View Note') : 'Create SOAP Note'}
            </button>
          </div>

          {soapNote && !soapNote.isDraft && (
            <div className="p-3 rounded-lg bg-[#FAFAF8] border border-[#132A24]/5 text-[11px] text-[#132A24]/70 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[#4E7A66]">
                <CheckCircle2 size={13} /> Finalized Clinical Record
              </div>
              <p className="line-clamp-2 italic text-[#132A24]/80">
                "{soapNote.assessment || soapNote.subjective}"
              </p>
            </div>
          )}
        </div>

        {/* Cancellation Notice if Cancelled */}
        {isCancelled && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <XCircle size={14} className="text-red-600" /> Session Cancelled
            </div>
            <p className="text-red-700">
              Cancelled by: <span className="font-medium capitalize">{session.cancelledBy || 'Therapist'}</span> &bull; Reason: {session.cancellationReason || 'No reason provided.'}
            </p>
            <p className="text-[11px] text-red-600/80">
              This session record is permanently preserved for clinical audit and does not occupy practitioner availability.
            </p>
          </div>
        )}

        {/* Client Card */}
        <div className="p-5 rounded-xl border border-[#132A24]/10 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#132A24]/5 border border-[#132A24]/10 flex items-center justify-center font-serif font-bold text-sm text-[#132A24]">
                {session.client?.displayName ? session.client.displayName.charAt(0) : 'C'}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#132A24]">
                  {session.client?.displayName || 'Client'}
                </h4>
                <span className="text-[11px] text-[#4E7A66] font-medium flex items-center gap-1">
                  <ShieldCheck size={12} /> Active Care Relationship
                </span>
              </div>
            </div>

            {onOpenClientProfile && session.client?.id && (
              <button
                onClick={() => onOpenClientProfile(session.client.id)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#132A24]/15 text-xs font-medium text-[#132A24] hover:bg-[#132A24]/5 cursor-pointer transition-colors"
              >
                <span>View Profile</span> <ExternalLink size={12} />
              </button>
            )}
          </div>

          {session.clientNotes && (
            <div className="pt-2 border-t border-[#132A24]/5 text-xs text-[#132A24]/70">
              <span className="font-medium text-[#132A24] block mb-0.5">Clinical Note:</span>
              <p>{session.clientNotes}</p>
            </div>
          )}

          {/* Privacy Boundary Guarantee */}
          <div className="p-3 rounded-lg bg-[#FAFAF8] border border-[#132A24]/5 text-[11px] text-[#132A24]/60 leading-relaxed">
            <strong className="text-[#132A24]">Client Self-Work Privacy Boundary:</strong> Personal journals, reflections, and self-guided exercises are private to the client and never visible in practitioner portals. Only structured clinical assessment questionnaires and session notes are shared.
          </div>
        </div>

        {/* Reschedule Audit Trail */}
        {session.rescheduleHistory && session.rescheduleHistory.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A24]/60 flex items-center gap-1.5">
              <History size={14} /> Reschedule Audit Trail ({session.rescheduleHistory.length})
            </h4>
            <div className="space-y-2">
              {session.rescheduleHistory.map((item, idx) => {
                const prevDate = new Date(item.previousStart).toLocaleString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const newDate = new Date(item.newStart).toLocaleString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const auditTime = new Date(item.createdAt).toLocaleString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={item.id || idx}
                    className="p-3 rounded-xl bg-[#FAFAF8] border border-[#132A24]/5 text-xs text-[#132A24]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-medium text-[#132A24]">
                        {prevDate} &rarr; {newDate}
                      </span>
                      {item.reason && (
                        <p className="text-[11px] text-[#132A24]/50 mt-0.5">
                          Reason: {item.reason}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-[#132A24]/40 shrink-0">
                      Logged {auditTime} by {item.rescheduledBy || 'therapist'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleModalOpen && (
        <TherapistRescheduleModal
          session={session}
          onClose={() => setRescheduleModalOpen(false)}
          onSuccess={async () => {
            setRescheduleModalOpen(false);
            await fetchSessionData();
          }}
        />
      )}

      {/* SOAP Modal */}
      {soapModalOpen && (
        <TherapistSoapModal
          sessionId={sessionId}
          onClose={() => {
            setSoapModalOpen(false);
            fetchSessionData();
          }}
        />
      )}
    </div>
  );
}
