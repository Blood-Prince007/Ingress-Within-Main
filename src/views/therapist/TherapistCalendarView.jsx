import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Video,
  ChevronLeft,
  ChevronRight,
  XCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  User,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import TherapistScheduleModal from './TherapistScheduleModal';
import TherapistRescheduleModal from './TherapistRescheduleModal';

export default function TherapistCalendarView({
  onOpenSession,
  onOpenClient,
  onOpenSoap
}) {
  const [sessions, setSessions] = useState([]);
  const [externalBusy, setExternalBusy] = useState([]);
  const [googleCalendarStatus, setGoogleCalendarStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'day'
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [connectingCalendar, setConnectingCalendar] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('google_calendar_connected') === 'true') {
        setSuccessBanner('Google Calendar connected successfully! External commitments are synced.');
        window.history.replaceState({}, '', window.location.pathname);
      } else if (params.get('error')) {
        const errParam = params.get('error');
        if (errParam === 'access_denied') {
          setError('Google authorization was cancelled or access denied. Ensure your Google account is added as an approved test user.');
        } else {
          setError(`Google Calendar connection failed: ${decodeURIComponent(errParam)}`);
        }
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Compute month window: from first day to last day of current month
  const { monthStartIso, monthEndIso, monthTitle } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const title = start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    return {
      monthStartIso: start.toISOString(),
      monthEndIso: end.toISOString(),
      monthTitle: title,
    };
  }, [currentMonth]);

  const fetchCalendar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/therapist/calendar?from=${encodeURIComponent(monthStartIso)}&to=${encodeURIComponent(monthEndIso)}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to load calendar data.');
      }
      const json = await res.json();
      const list = json.sessions || json.appointments || [];
      setSessions(list);
      setExternalBusy(json.externalBusy || []);
      setGoogleCalendarStatus(json.googleCalendarStatus || null);
    } catch (err) {
      console.error('Calendar error:', err);
      setError(err.message || 'Failed to load calendar events.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectCalendar = async () => {
    setConnectingCalendar(true);
    try {
      const res = await fetch('/api/calendar/google/connect?type=therapist&returnTo=/therapist/calendar&format=json', {
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (data.simulated) {
        await fetchCalendar();
        alert('Google Calendar connected successfully!');
        setConnectingCalendar(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (!res.ok) {
        alert(data.error?.message || 'Failed to initiate Google Calendar connection.');
        setConnectingCalendar(false);
        return;
      }
      window.location.href = '/api/calendar/google/connect?type=therapist&returnTo=/therapist/calendar';
    } catch {
      window.location.href = '/api/calendar/google/connect?type=therapist&returnTo=/therapist/calendar';
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [monthStartIso, monthEndIso]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  // Group sessions by day string (YYYY-MM-DD)
  const sessionsByDay = useMemo(() => {
    const map = new Map();
    sessions.forEach(s => {
      const start = s.startsAt || s.scheduled_start;
      if (!start) return;
      const dayKey = new Date(start).toLocaleDateString('en-CA'); // YYYY-MM-DD
      if (!map.has(dayKey)) {
        map.set(dayKey, []);
      }
      map.get(dayKey).push(s);
    });
    return map;
  }, [sessions]);

  // Build calendar matrix for month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding before 1st of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, isCurrentMonth: false, date: null });
    }
    // Days in current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dayKey = dateObj.toLocaleDateString('en-CA');
      const daySessions = sessionsByDay.get(dayKey) || [];
      const activeCount = daySessions.filter(s => s.status !== 'cancelled').length;
      const cancelledCount = daySessions.filter(s => s.status === 'cancelled').length;

      days.push({
        dayNumber: day,
        isCurrentMonth: true,
        date: dateObj,
        dayKey,
        sessions: daySessions,
        activeCount,
        cancelledCount,
      });
    }
    return days;
  }, [currentMonth, sessionsByDay]);

  const selectedDayKey = selectedDate.toLocaleDateString('en-CA');
  const selectedDaySessions = useMemo(() => {
    return sessionsByDay.get(selectedDayKey) || [];
  }, [sessionsByDay, selectedDayKey]);

  // Group external busy periods by day (YYYY-MM-DD)
  const externalBusyByDay = useMemo(() => {
    const map = new Map();
    externalBusy.forEach((b) => {
      if (!b.start) return;
      const dayKey = new Date(b.start).toLocaleDateString('en-CA');
      if (!map.has(dayKey)) {
        map.set(dayKey, []);
      }
      map.get(dayKey).push(b);
    });
    return map;
  }, [externalBusy]);

  const selectedDayExternalBusy = useMemo(() => {
    return externalBusyByDay.get(selectedDayKey) || [];
  }, [externalBusyByDay, selectedDayKey]);

  // Actions
  const handleCancelSession = async (appointmentId) => {
    const reason = window.prompt('Reason for session cancellation:');
    if (reason === null) return;
    setCancellingId(appointmentId);
    try {
      const res = await fetch(`/api/therapist/sessions/${appointmentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || 'Therapist schedule change' }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to cancel session.');
      }
      await fetchCalendar();
    } catch (err) {
      alert(`Error cancelling session: ${err.message}`);
    } finally {
      setCancellingId(null);
    }
  };

  const handleCompleteSession = async (appointmentId) => {
    if (!window.confirm('Mark this clinical session as completed?')) return;
    setCompletingId(appointmentId);
    try {
      const res = await fetch(`/api/therapist/sessions/${appointmentId}/complete`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to complete session.');
      }
      await fetchCalendar();
    } catch (err) {
      alert(`Error completing session: ${err.message}`);
    } finally {
      setCompletingId(null);
    }
  };

  const handleNoShow = async (appointmentId) => {
    if (!window.confirm('Mark this session as Client No-Show? (Session will be marked completed with no refund to client per policy)')) return;
    try {
      const res = await fetch(`/api/therapist/appointments/${appointmentId}/no-show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceStatus: 'client_no_show' }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to record client no-show.');
      }
      await fetchCalendar();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const todayKey = new Date().toLocaleDateString('en-CA');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#132A24]/10 pb-6">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#4E7A66]">
            Clinical Operations
          </span>
          <h1 className="font-serif text-3xl font-normal text-[#132A24] mt-1">
            Calendar & Sessions
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg bg-[#132A24]/5 p-1 border border-[#132A24]/10 text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-md font-medium capitalize transition-all cursor-pointer ${
                viewMode === 'month' ? 'bg-white text-[#132A24] shadow-xs' : 'text-[#132A24]/60'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-md font-medium capitalize transition-all cursor-pointer ${
                viewMode === 'day' ? 'bg-white text-[#132A24] shadow-xs' : 'text-[#132A24]/60'
              }`}
            >
              Day Agenda
            </button>
          </div>

          <button
            onClick={() => setScheduleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#132A24] text-white text-xs font-semibold hover:bg-[#132A24]/90 transition-all cursor-pointer shadow-xs"
          >
            <Plus size={14} /> Schedule Session
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Recoverable Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchCalendar}
            className="px-3 py-1 bg-red-600 text-white rounded-md text-xs font-medium cursor-pointer inline-flex items-center gap-1"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Google Calendar Synchronization Banner */}
      <div className="bg-[#FAF9F5] border border-[#132A24]/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#4E7A66]/10 text-[#4E7A66] flex items-center justify-center shrink-0">
            <CalendarIcon size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#132A24]">Google Calendar</span>
              {googleCalendarStatus?.connected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#4E7A66]/10 text-[#4E7A66]">
                  <CheckCircle2 size={11} /> Connected ({googleCalendarStatus.googleEmail || 'Primary'})
                </span>
              ) : googleCalendarStatus?.syncStatus === 'revoked' || googleCalendarStatus?.syncStatus === 'expired' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                  <AlertCircle size={11} /> Authorization Expired
                </span>
              ) : (
                <span className="text-[11px] text-[#132A24]/50">Not Connected</span>
              )}
            </div>
            <p className="text-[11px] text-[#132A24]/60 mt-0.5">
              {googleCalendarStatus?.connected
                ? 'External commitments are automatically blocked from client booking and appointments stay synchronized.'
                : 'Connect your Google Calendar to automatically block external busy hours and generate real Google Meet links.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {googleCalendarStatus?.connected ? (
            <button
              onClick={fetchCalendar}
              className="px-3 py-1.5 rounded-lg border border-[#132A24]/15 bg-white text-[#132A24] font-medium hover:bg-[#132A24]/5 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Sync Now
            </button>
          ) : (
            <button
              onClick={handleConnectCalendar}
              disabled={connectingCalendar}
              className="px-3.5 py-1.5 rounded-lg bg-[#132A24] text-white font-medium hover:bg-[#132A24]/90 transition-colors cursor-pointer no-underline inline-flex items-center gap-1.5 shadow-2xs"
            >
              <CalendarIcon size={12} className={connectingCalendar ? 'animate-spin' : ''} />
              {connectingCalendar ? 'Connecting...' : 'Connect Calendar'}
            </button>
          )}
        </div>
      </div>

      {/* Calendar Controls & Month Navigation */}
      <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-xl font-medium text-[#132A24]">
            {viewMode === 'month' ? monthTitle : selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={handleGoToday}
            className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-[#132A24]/15 text-[#132A24]/70 hover:bg-[#132A24]/5 cursor-pointer"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={viewMode === 'month' ? handlePrevMonth : () => setSelectedDate(d => new Date(d.setDate(d.getDate() - 1)))}
            className="p-2 rounded-lg text-[#132A24]/60 hover:text-[#132A24] hover:bg-[#132A24]/5 cursor-pointer"
            title="Previous"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={viewMode === 'month' ? handleNextMonth : () => setSelectedDate(d => new Date(d.setDate(d.getDate() + 1)))}
            className="p-2 rounded-lg text-[#132A24]/60 hover:text-[#132A24] hover:bg-[#132A24]/5 cursor-pointer"
            title="Next"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="bg-white border border-[#132A24]/10 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
              <div key={i} className="h-6 bg-[#132A24]/5 rounded animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-20 bg-[#132A24]/5 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : viewMode === 'month' ? (
        /* ===================== MONTH VIEW ===================== */
        <div className="space-y-6">
          <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs">
            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-[#132A24]/50">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            {/* Month Day Cells */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((cell, idx) => {
                if (!cell.isCurrentMonth) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[85px] rounded-xl bg-[#FAFAF8]/50 border border-transparent p-2 text-transparent"
                    />
                  );
                }

                const isToday = cell.dayKey === todayKey;
                const isSelected = cell.dayKey === selectedDayKey;
                const hasSessions = cell.sessions.length > 0;

                return (
                  <div
                    key={cell.dayKey}
                    onClick={() => setSelectedDate(cell.date)}
                    className={`min-h-[85px] rounded-xl p-2.5 transition-all cursor-pointer border flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#132A24] bg-[#4E7A66]/5 shadow-xs'
                        : isToday
                        ? 'border-[#4E7A66]/40 bg-[#FAFAF8]'
                        : 'border-[#132A24]/10 bg-white hover:border-[#4E7A66]/30 hover:bg-[#FAFBFB]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          isToday
                            ? 'bg-[#132A24] text-white'
                            : isSelected
                            ? 'text-[#132A24] font-bold'
                            : 'text-[#132A24]/70'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {hasSessions && (
                        <span className="text-[10px] font-bold text-[#4E7A66] px-1.5 py-0.2 bg-[#4E7A66]/10 rounded-md">
                          {cell.activeCount}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mt-1">
                      {cell.activeCount > 0 && (
                        <div className="text-[10px] text-[#132A24]/80 font-medium truncate">
                          {cell.activeCount} {cell.activeCount === 1 ? 'session' : 'sessions'}
                        </div>
                      )}
                      {cell.cancelledCount > 0 && (
                        <div className="text-[9px] text-red-600 line-through">
                          {cell.cancelledCount} cancelled
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Empty Month Notice */}
          {sessions.length === 0 && (
            <div className="bg-white border border-[#132A24]/10 rounded-2xl p-8 text-center space-y-2">
              <CalendarIcon size={32} className="mx-auto text-[#132A24]/30" />
              <h3 className="font-serif text-lg font-medium text-[#132A24]">
                No sessions scheduled this month.
              </h3>
              <p className="text-xs text-[#132A24]/60 max-w-sm mx-auto">
                Your schedule is currently clear for {monthTitle}. Click "Schedule Session" above to book an appointment with an authorized client.
              </p>
            </div>
          )}

          {/* Selected Day Agenda Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-normal text-[#132A24] flex items-center gap-2">
                <Clock size={18} className="text-[#4E7A66]" />
                Agenda for {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
              </h3>
              <span className="text-xs font-semibold text-[#132A24]/60">
                {selectedDaySessions.length} {selectedDaySessions.length === 1 ? 'session' : 'sessions'}
              </span>
            </div>

            {selectedDaySessions.length === 0 && selectedDayExternalBusy.length === 0 ? (
              <div className="bg-white border border-[#132A24]/10 rounded-xl p-8 text-center space-y-2">
                <p className="text-sm font-medium text-[#132A24]">No sessions scheduled for this day.</p>
                <p className="text-xs text-[#132A24]/50 max-w-sm mx-auto">
                  Click "Schedule Session" above to book a clinical encounter on this date.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDaySessions.map(renderSessionCard)}
                {selectedDayExternalBusy.map(renderExternalBusyCard)}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ===================== DAY VIEW ===================== */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-normal text-[#132A24]">
              {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#132A24]/5 text-[#132A24]/70">
                {selectedDaySessions.length} {selectedDaySessions.length === 1 ? 'session' : 'sessions'}
              </span>
              {selectedDayExternalBusy.length > 0 && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800">
                  {selectedDayExternalBusy.length} external busy
                </span>
              )}
            </div>
          </div>

          {selectedDaySessions.length === 0 && selectedDayExternalBusy.length === 0 ? (
            <div className="bg-white border border-[#132A24]/10 rounded-2xl p-12 text-center space-y-3">
              <CalendarIcon size={36} className="mx-auto text-[#132A24]/30" />
              <h3 className="font-serif text-xl font-normal text-[#132A24]">
                No commitments scheduled for this day.
              </h3>
              <p className="text-xs text-[#132A24]/60 max-w-sm mx-auto">
                No clinical consultations or external Google Calendar commitments are recorded for this date.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDaySessions.map(renderSessionCard)}
              {selectedDayExternalBusy.map(renderExternalBusyCard)}
            </div>
          )}
        </div>
      )}

      {/* Schedule Session Modal */}
      {scheduleModalOpen && (
        <TherapistScheduleModal
          onClose={() => setScheduleModalOpen(false)}
          onSuccess={() => fetchCalendar()}
        />
      )}

      {/* Reschedule Modal */}
      {rescheduleAppt && (
        <TherapistRescheduleModal
          appointment={rescheduleAppt}
          onClose={() => setRescheduleAppt(null)}
          onSuccess={() => fetchCalendar()}
        />
      )}
    </div>
  );

  // Render external Google Calendar busy block (strictly privacy-sanitized: no titles, descriptions, or attendees)
  function renderExternalBusyCard(busyItem, idx) {
    const startStr = new Date(busyItem.start).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const endStr = new Date(busyItem.end).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return (
      <div
        key={`external-busy-${idx}-${busyItem.start}`}
        className="bg-[#FAFAF8] border border-dashed border-[#132A24]/15 rounded-xl p-4 flex items-center justify-between gap-4 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#132A24]/5 border border-[#132A24]/10 flex flex-col items-center justify-center shrink-0 text-[#132A24]/60">
            <Clock size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#132A24]">
                {startStr} – {endStr}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#132A24]/5 text-[#132A24]/70 uppercase tracking-wider">
                Busy
              </span>
            </div>
            <p className="text-[11px] text-[#132A24]/50 mt-0.5">
              Google Calendar Commitment &bull; Client self-booking slots blocked during this period
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render individual session card
  function renderSessionCard(appt) {
    const startsAt = appt.startsAt || appt.scheduled_start;
    const endsAt = appt.endsAt || appt.scheduled_end;
    const clientName = appt.client?.displayName || appt.clientDisplayName || 'Authorized Client';
    const clientId = appt.client?.id || appt.user_id;

    const startTimeStr = new Date(startsAt).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const endTimeStr = new Date(endsAt).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const isCancelled = appt.status === 'cancelled';
    const isCompleted = appt.status === 'completed';
    const isScheduled = !isCancelled && !isCompleted;

    return (
      <div
        key={appt.id}
        className={`bg-white border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
          isCancelled
            ? 'opacity-60 border-gray-200 bg-gray-50'
            : 'border-[#132A24]/10 hover:border-[#4E7A66]/30'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#FAFAF8] border border-[#132A24]/10 flex flex-col items-center justify-center shrink-0">
            <Clock size={16} className="text-[#4E7A66]" />
            <span className="text-[10px] font-bold text-[#132A24] mt-0.5">
              {appt.durationMinutes || 50}m
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#132A24]">
                {startTimeStr} – {endTimeStr}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                isCompleted
                  ? 'bg-[#4E7A66]/10 text-[#4E7A66]'
                  : isCancelled
                  ? 'bg-red-50 text-red-700'
                  : 'bg-blue-50 text-blue-700'
              }`}>
                {appt.status}
              </span>
              {appt.calendarSyncStatus === 'synced' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Google Cal
                </span>
              )}
              {appt.attendanceStatus === 'client_no_show' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">
                  Client No-Show
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <h4
                onClick={() => onOpenSession ? onOpenSession(appt.id) : null}
                className="font-serif text-base font-medium text-[#132A24] cursor-pointer hover:text-[#4E7A66] transition-colors"
              >
                {clientName}
              </h4>
              {onOpenClient && clientId && (
                <button
                  onClick={() => onOpenClient(clientId)}
                  className="text-[#132A24]/40 hover:text-[#132A24] cursor-pointer p-0.5"
                  title="View Client Profile"
                >
                  <ExternalLink size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 text-[11px] text-[#132A24]/50 capitalize">
              <span>{appt.sessionType || appt.session_type || 'Video'}</span>
              <span>&bull;</span>
              <span>{appt.modality || 'Telehealth'}</span>
              <span>&bull;</span>
              <span>{(appt.careStage || 'Intake').replace(/_/g, ' ')}</span>
            </div>

            {appt.clientNotes && (
              <p className="text-[11px] text-[#132A24]/60 mt-1 italic">{appt.clientNotes}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
          {onOpenSession && (
            <button
              onClick={() => onOpenSession(appt.id)}
              className="px-3 py-1.5 rounded-lg border border-[#132A24]/15 text-xs font-medium text-[#132A24] hover:bg-[#132A24]/5 cursor-pointer"
            >
              Session Details
            </button>
          )}

          {isScheduled && (
            <>
              {Boolean(appt.googleMeetUrl || (appt.google_meet_url && String(appt.google_meet_url).startsWith('https://meet.google.com/'))) && (
                <a
                  href={appt.googleMeetUrl || appt.google_meet_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#132A24] text-white text-xs font-medium hover:bg-[#132A24]/90 no-underline cursor-pointer inline-flex items-center gap-1"
                >
                  <Video size={13} /> Join Google Meet
                </a>
              )}
              <button
                onClick={() => handleCompleteSession(appt.id)}
                disabled={completingId === appt.id}
                className="px-3 py-1.5 rounded-lg border border-[#4E7A66]/30 text-xs font-medium text-[#4E7A66] hover:bg-[#4E7A66]/10 cursor-pointer"
              >
                {completingId === appt.id ? 'Completing...' : 'Complete'}
              </button>
              <button
                onClick={() => setRescheduleAppt(appt)}
                className="px-3 py-1.5 rounded-lg border border-[#132A24]/15 text-xs text-[#132A24] hover:bg-[#132A24]/5 cursor-pointer"
              >
                Reschedule
              </button>
              <button
                onClick={() => handleNoShow(appt.id)}
                className="px-2.5 py-1.5 rounded-lg border border-amber-200 text-xs text-amber-700 hover:bg-amber-50 cursor-pointer"
                title="Mark client absence (non-refundable)"
              >
                No-Show
              </button>
              <button
                onClick={() => handleCancelSession(appt.id)}
                disabled={cancellingId === appt.id}
                className="px-2.5 py-1.5 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50 cursor-pointer"
              >
                {cancellingId === appt.id ? 'Cancelling...' : 'Cancel'}
              </button>
            </>
          )}

          {onOpenSoap && (
            <button
              onClick={() => onOpenSoap(appt.id)}
              className="px-3 py-1.5 rounded-lg border border-[#132A24]/15 bg-white text-xs text-[#132A24] hover:bg-[#132A24]/5 cursor-pointer flex items-center gap-1.5"
            >
              <FileText size={13} /> SOAP Note
            </button>
          )}
        </div>
      </div>
    );
  }
}
