import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';

export default function ClientTherapySessionsView() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calendar sync state
  const [calConnected, setCalConnected] = useState(false);
  const [calEmail, setCalEmail] = useState(null);

  // Reschedule state
  const [rescheduleModalAppt, setRescheduleModalAppt] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const [syncingAppointmentId, setSyncingAppointmentId] = useState(null);

  // Cancel state
  const [cancelModalAppt, setCancelModalAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessRes, calRes] = await Promise.all([
        fetch('/api/therapy/client/sessions'),
        fetch('/api/calendar/google/status'),
      ]);

      if (sessRes.ok) {
        const json = await sessRes.json();
        setSessions(json.sessions || []);
      }
      if (calRes.ok) {
        const calJson = await calRes.json();
        setCalConnected(Boolean(calJson.connected));
        setCalEmail(calJson.googleEmail);
      }
    } catch (err) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch real therapist availability slots when reschedule modal opens
  useEffect(() => {
    if (!rescheduleModalAppt) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      return;
    }
    const therapistId = rescheduleModalAppt.therapist?.id || rescheduleModalAppt.therapistAccountId;
    if (!therapistId) return;

    setLoadingSlots(true);
    fetch(`/api/therapy/therapists/${therapistId}/availability`)
      .then((res) => res.json())
      .then((data) => {
        setAvailableSlots(data.slots || []);
      })
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [rescheduleModalAppt]);

  const handleConnectGoogleCal = async () => {
    try {
      const res = await fetch('/api/calendar/google/connect');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      alert('Failed to initiate Google Calendar connection.');
    }
  };

  const handleRetryCalendarSync = async (appointmentId) => {
    setSyncingAppointmentId(appointmentId);
    try {
      const res = await fetch('/api/therapy/sessions/sync-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Sync failed');
      }
      alert('Calendar synchronization successful! Google Meet generated.');
      await fetchSessions();
    } catch (err) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncingAppointmentId(null);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleModalAppt || !selectedSlot) return;

    setRescheduling(true);
    try {
      const res = await fetch('/api/therapy/sessions/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: rescheduleModalAppt.id,
          newStart: selectedSlot.start,
          newEnd: selectedSlot.end,
          reason: rescheduleReason || 'Client requested reschedule',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to reschedule');
      }

      setRescheduleModalAppt(null);
      setSelectedSlot(null);
      await fetchSessions();
    } catch (err) {
      alert(err.message);
    } finally {
      setRescheduling(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelModalAppt) return;

    setCancelling(true);
    try {
      const res = await fetch('/api/therapy/sessions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: cancelModalAppt.id,
          reason: cancelReason || 'Cancelled by client',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to cancel session');
      }

      setCancelModalAppt(null);
      await fetchSessions();
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-700">
            Care & Consultations
          </span>
          <h1 className="text-2xl font-serif text-gray-900 mt-1">Your Therapy Sessions</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your scheduled consultations, join Google Meet, and view calendar synchronization.
          </p>
        </div>

        {/* Google Calendar Connection Card */}
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs">
          {calConnected ? (
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <div>
                <p className="font-medium">Google Calendar Connected</p>
                <p className="text-[10px] text-gray-500">{calEmail}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-gray-600">Sync sessions to your Google Calendar</span>
              <button
                onClick={handleConnectGoogleCal}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-medium text-gray-800 hover:bg-gray-100 transition-colors shadow-2xs"
              >
                Connect Calendar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Policy Notice */}
      <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <Info size={16} className="shrink-0 text-blue-600 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium">Ingress Within Scheduling & Refund Policy</p>
          <p className="text-blue-800/80 leading-relaxed">
            Sessions can be rescheduled freely at least <strong>24 hours</strong> before the start time. 
            Cancellations made <strong>48 hours or more</strong> in advance receive a 100% full refund automatically. 
            Cancellations made under 24 hours are non-refundable.
          </p>
        </div>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading your therapy appointments...</div>
      ) : sessions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3">
          <CalendarIcon size={36} className="mx-auto text-gray-300" />
          <h3 className="font-serif text-lg font-medium text-gray-900">No scheduled sessions</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Once your assigned therapist confirms your connection, our team will coordinate your initial consultation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const formattedDate = new Date(session.scheduledStart).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const formattedTime = new Date(session.scheduledStart).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });

            const isCancelled = session.status === 'cancelled';
            const isCompleted = session.status === 'completed';
            const isUpcoming = !isCancelled && !isCompleted;

            return (
              <div
                key={session.id}
                className={`bg-white border rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  isCancelled ? 'opacity-60 bg-gray-50 border-gray-200' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {formattedDate} at {formattedTime}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700'
                          : isCancelled
                          ? 'bg-red-50 text-red-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {session.status}
                    </span>
                    {session.calendarSyncStatus === 'synced' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Calendar Synced
                      </span>
                    )}
                    {session.calendarSyncStatus === 'failed' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 flex items-center gap-1">
                        <AlertCircle size={10} /> Calendar Sync Failed
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600">
                    Clinician: <strong className="text-gray-900">{session.therapist?.name}</strong> &bull;{' '}
                    <span className="capitalize">{session.sessionType || 'Video'}</span> &bull; Telehealth
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {isUpcoming && session.googleMeetUrl && (
                    <a
                      href={session.googleMeetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 no-underline shadow-2xs"
                    >
                      <Video size={13} /> Join Google Meet
                    </a>
                  )}

                  {isUpcoming && !session.googleMeetUrl && session.googleMeetStatus === 'generating' && (
                    <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium inline-flex items-center gap-1.5">
                      <RefreshCw size={12} className="animate-spin" /> Generating Meet...
                    </span>
                  )}

                  {isUpcoming && (!session.googleMeetUrl || session.calendarSyncStatus === 'failed') && (
                    <button
                      onClick={() => handleRetryCalendarSync(session.id)}
                      disabled={syncingAppointmentId === session.id}
                      className="px-3 py-1.5 rounded-lg border border-amber-300 text-xs font-medium text-amber-800 hover:bg-amber-50 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                      title="Sync calendar and generate Google Meet"
                    >
                      <RefreshCw
                        size={12}
                        className={syncingAppointmentId === session.id ? 'animate-spin' : ''}
                      />
                      {syncingAppointmentId === session.id ? 'Syncing...' : 'Retry Calendar Sync'}
                    </button>
                  )}

                  {isUpcoming && session.policy?.canReschedule && (
                    <button
                      onClick={() => setRescheduleModalAppt(session)}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Reschedule
                    </button>
                  )}

                  {isUpcoming && !session.policy?.canReschedule && (
                    <span
                      className="text-[11px] text-gray-400 italic cursor-help"
                      title="Rescheduling is permitted only at least 24 hours prior to session start"
                    >
                      Reschedule closed (&lt;24h)
                    </span>
                  )}

                  {isUpcoming && (
                    <button
                      onClick={() => setCancelModalAppt(session)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalAppt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-serif text-lg font-medium text-gray-900">Reschedule Therapy Session</h3>
            <p className="text-xs text-gray-500">
              Select an available time slot with {rescheduleModalAppt.therapist?.name || 'your clinician'}. Appointments must be rescheduled at least 24 hours in advance.
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Available Time Slots
                </label>
                {loadingSlots ? (
                  <div className="py-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-emerald-600" />
                    <span>Checking clinician Google Calendar & availability...</span>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 text-center space-y-1">
                    <p className="font-medium text-gray-800">No open slots in the upcoming schedule</p>
                    <p className="text-[11px] text-gray-500">
                      Please contact care coordination to find alternative times.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-3 p-1 border border-gray-100 rounded-xl">
                    {Object.entries(
                      availableSlots.reduce((acc, slot) => {
                        const d = new Date(slot.start);
                        const dayKey = d.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        });
                        if (!acc[dayKey]) acc[dayKey] = [];
                        acc[dayKey].push(slot);
                        return acc;
                      }, {})
                    ).map(([day, slots]) => (
                      <div key={day} className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-1">
                          {day}
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {slots.map((slot) => {
                            const isSelected = selectedSlot?.start === slot.start;
                            const timeStr = new Date(slot.start).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            });
                            return (
                              <button
                                key={slot.start}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                                  isSelected
                                    ? 'bg-emerald-800 border-emerald-800 text-white shadow-2xs'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-600 hover:bg-emerald-50/50'
                                }`}
                              >
                                {timeStr}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {selectedSlot && (
                  <p className="mt-2 text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    Selected:{' '}
                    {new Date(selectedSlot.start).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule conflict, personal reasons"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRescheduleModalAppt(null);
                    setSelectedSlot(null);
                  }}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduling || !selectedSlot}
                  className="px-4 py-1.5 text-xs bg-emerald-800 text-white rounded-lg font-medium hover:bg-emerald-900 disabled:opacity-50"
                >
                  {rescheduling ? 'Updating...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModalAppt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-serif text-lg font-medium text-gray-900">Cancel Therapy Session</h3>
            
            <div className={`p-3 rounded-lg text-xs ${
              cancelModalAppt.policy?.refundEligible
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              {cancelModalAppt.policy?.refundEligible ? (
                <p>
                  <strong>Full Refund Eligible:</strong> Cancellation is more than 48 hours prior to start. 
                  A 100% refund will be automatically initiated to your original payment method.
                </p>
              ) : (
                <p>
                  <strong>Notice:</strong> Cancellation is within 48 hours. Depending on policy rules, 
                  this session may be non-refundable or subject to platform review.
                </p>
              )}
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reason for cancellation</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Please share the reason for cancellation..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalAppt(null)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Keep Session
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-1.5 text-xs bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
