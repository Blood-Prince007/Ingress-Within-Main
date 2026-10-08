import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Users,
  UserCheck,
  Video,
  FileText,
  Bell,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Inbox
} from 'lucide-react';

export default function TherapistTodayView({ onNavigate, onOpenSoap, onOpenSession }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completingId, setCompletingId] = useState(null);

  const fetchTodayData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/therapist/dashboard/today');
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Failed to establish connection to clinical dashboard.');
      }
      setData(json);
    } catch (err) {
      console.error('[TherapistTodayView] Error loading today overview:', err);
      setError(err.message || 'An unexpected error occurred while loading your schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayData();
  }, []);

  const handleCompleteSession = async (appointmentId) => {
    setCompletingId(appointmentId);
    try {
      const res = await fetch(`/api/therapist/sessions/${appointmentId}/complete`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchTodayData();
      }
    } catch (err) {
      console.error('Failed to complete session:', err);
    } finally {
      setCompletingId(null);
    }
  };

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#132A24]/10 pb-6">
          <div className="space-y-2">
            <div className="h-3 w-32 bg-[#132A24]/10 rounded" />
            <div className="h-8 w-48 bg-[#132A24]/15 rounded" />
          </div>
          <div className="h-9 w-32 bg-[#132A24]/10 rounded-lg" />
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-[#132A24]/10 rounded-xl p-5 space-y-3">
              <div className="h-3 w-24 bg-[#132A24]/10 rounded" />
              <div className="h-7 w-12 bg-[#132A24]/15 rounded" />
              <div className="h-2.5 w-20 bg-[#132A24]/5 rounded" />
            </div>
          ))}
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-5 w-40 bg-[#132A24]/10 rounded" />
            <div className="h-44 bg-white border border-[#132A24]/10 rounded-xl" />
            <div className="h-44 bg-white border border-[#132A24]/10 rounded-xl" />
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-[#132A24]/10 rounded-2xl" />
            <div className="h-36 bg-white border border-[#132A24]/10 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // ERROR STATE
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-medium text-[#132A24]">
              Unable to load today's dashboard
            </h3>
            <p className="text-xs text-[#132A24]/60 leading-relaxed">
              {error}
            </p>
          </div>
          <button
            onClick={fetchTodayData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#132A24] text-white text-xs font-semibold hover:bg-[#132A24]/90 transition-all cursor-pointer"
          >
            <RefreshCw size={14} /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Extract real sections
  const todaySessions = data?.todaySessions || [];
  const nextSession = data?.nextSession || data?.upcomingSession || null;
  const pendingRequests = data?.pendingRequests || [];
  const activeClients = data?.activeClients || [];
  const notesDue = data?.notesDue || [];
  const notifications = data?.notifications || [];

  const metrics = data?.metrics || {
    todaySessionsCount: todaySessions.length,
    pendingRequestsCount: pendingRequests.length,
    activeClientsCount: activeClients.length,
    outstandingSoapNotesCount: notesDue.length,
    unreadNotificationsCount: notifications.length,
  };

  return (
    <div className="space-y-8">
      {/* --------------------------------------------------------------------- */}
      {/* HEADER: "Today" + Date / Clinical Context                             */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#132A24]/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#4E7A66]">
              Clinical Workspace
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#4E7A66]/10 text-[#4E7A66] text-[10px] font-semibold">
              <ShieldCheck size={11} /> Practice Authorized
            </span>
          </div>
          <h1 className="font-serif text-3xl font-normal text-[#132A24] mt-1">
            Today
          </h1>
          <p className="text-xs text-[#132A24]/60 mt-0.5">
            {todayFormatted}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTodayData}
            title="Refresh schedule data"
            className="p-2 rounded-lg border border-[#132A24]/10 text-[#132A24]/70 hover:bg-[#132A24]/5 hover:text-[#132A24] transition-all cursor-pointer"
          >
            <RefreshCw size={14} />
          </button>
          {onNavigate && (
            <button
              onClick={() => onNavigate('calendar')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#132A24] text-white text-xs font-semibold hover:bg-[#132A24]/90 transition-all cursor-pointer shadow-xs"
            >
              <Calendar size={14} /> Open Calendar
            </button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* KPI METRIC CARDS                                                      */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sessions */}
        <div className="bg-white border border-[#132A24]/10 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#132A24]/50 text-xs font-medium mb-2">
            <span>Today's Sessions</span>
            <Calendar size={15} className="text-[#4E7A66]" />
          </div>
          <div className="text-2xl font-serif text-[#132A24] font-semibold">{metrics.todaySessionsCount}</div>
          <span className="text-[11px] text-[#132A24]/40 mt-1 block">Scheduled for today</span>
        </div>

        {/* New Requests */}
        <div
          onClick={() => onNavigate && onNavigate('requests')}
          className="bg-white border border-[#132A24]/10 rounded-xl p-5 shadow-xs cursor-pointer hover:border-[#4E7A66]/50 transition-all"
        >
          <div className="flex items-center justify-between text-[#132A24]/50 text-xs font-medium mb-2">
            <span>New Requests</span>
            <Users size={15} className={metrics.pendingRequestsCount > 0 ? "text-amber-600" : "text-[#132A24]/40"} />
          </div>
          <div className="text-2xl font-serif text-[#132A24] font-semibold">{metrics.pendingRequestsCount}</div>
          <span className={`text-[11px] font-medium mt-1 block ${metrics.pendingRequestsCount > 0 ? 'text-amber-700' : 'text-[#132A24]/40'}`}>
            {metrics.pendingRequestsCount > 0 ? 'Pending intake review' : 'No new client requests.'}
          </span>
        </div>

        {/* Active Clients */}
        <div
          onClick={() => onNavigate && onNavigate('clients')}
          className="bg-white border border-[#132A24]/10 rounded-xl p-5 shadow-xs cursor-pointer hover:border-[#4E7A66]/50 transition-all"
        >
          <div className="flex items-center justify-between text-[#132A24]/50 text-xs font-medium mb-2">
            <span>Active Clients</span>
            <UserCheck size={15} className="text-[#4E7A66]" />
          </div>
          <div className="text-2xl font-serif text-[#132A24] font-semibold">{metrics.activeClientsCount}</div>
          <span className="text-[11px] text-[#132A24]/40 mt-1 block">
            {metrics.activeClientsCount > 0 ? 'In care relationships' : 'No active clients yet.'}
          </span>
        </div>

        {/* Notes Due */}
        <div className="bg-white border border-[#132A24]/10 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#132A24]/50 text-xs font-medium mb-2">
            <span>Notes Due</span>
            <FileText size={15} className={metrics.outstandingSoapNotesCount > 0 ? "text-amber-600" : "text-[#132A24]/40"} />
          </div>
          <div className="text-2xl font-serif text-[#132A24] font-semibold">{metrics.outstandingSoapNotesCount}</div>
          <span className={`text-[11px] font-medium mt-1 block ${metrics.outstandingSoapNotesCount > 0 ? 'text-amber-700' : 'text-[#132A24]/40'}`}>
            {metrics.outstandingSoapNotesCount > 0 ? 'SOAP documentation due' : 'No notes due.'}
          </span>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* MAIN TWO-COLUMN WORKSPACE                                             */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (2 Cols): Today's Sessions, Requests, Active Clients     */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* A. TODAY'S SESSIONS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-normal text-[#132A24]">Today's Sessions</h3>
                <span className="text-xs text-[#132A24]/50">Chronological schedule for today</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#132A24]/5 text-[#132A24]/70">
                {todaySessions.length} {todaySessions.length === 1 ? 'session' : 'sessions'}
              </span>
            </div>

            {todaySessions.length === 0 ? (
              <div className="bg-white border border-[#132A24]/10 rounded-xl p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#132A24]/5 text-[#132A24]/40 flex items-center justify-center mx-auto">
                  <Calendar size={20} />
                </div>
                <p className="text-sm font-medium text-[#132A24]">No sessions scheduled today.</p>
                <p className="text-xs text-[#132A24]/50 max-w-sm mx-auto leading-relaxed">
                  Your calendar is clear for today. New bookings and scheduled consultations will appear here in chronological order.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySessions.map((session) => {
                  const startTime = new Date(session.scheduledStart).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  });
                  const endTime = new Date(session.scheduledEnd).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  });

                  return (
                    <div
                      key={session.id}
                      className="bg-white border border-[#132A24]/10 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-lg bg-[#4E7A66]/10 text-[#4E7A66] flex flex-col items-center justify-center shrink-0">
                          <Video size={18} />
                          <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">50m</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#132A24]">{startTime} – {endTime}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                              session.status === 'completed'
                                ? 'bg-[#4E7A66]/10 text-[#4E7A66]'
                                : session.status === 'cancelled'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-blue-50 text-blue-700'
                            }`}>
                              {session.status}
                            </span>
                          </div>
                          <h4 
                            onClick={() => onOpenSession ? onOpenSession(session.id) : null}
                            className="font-serif text-base font-medium text-[#132A24] mt-0.5 cursor-pointer hover:text-[#4E7A66] transition-colors"
                          >
                            {session.clientDisplayName}
                          </h4>
                          <span className="text-[11px] text-[#132A24]/50 block capitalize">
                            {session.sessionType ? session.sessionType.replace(/_/g, ' ') : 'Individual Telehealth'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {onOpenSession && (
                          <button
                            onClick={() => onOpenSession(session.id)}
                            className="px-3 py-1.5 rounded-lg border border-[#132A24]/15 text-xs text-[#132A24]/80 hover:bg-[#132A24]/5 transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                        )}
                        {session.googleMeetUrl && session.status !== 'completed' && session.status !== 'cancelled' && (
                          <a
                            href={session.googleMeetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-1.5 rounded-lg bg-[#132A24] text-white text-xs font-medium hover:bg-[#132A24]/90 no-underline cursor-pointer inline-flex items-center gap-1"
                          >
                            Join Google Meet
                          </a>
                        )}
                        {session.status !== 'completed' && session.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCompleteSession(session.id)}
                            disabled={completingId === session.id}
                            className="px-3 py-1.5 rounded-lg border border-[#132A24]/15 text-xs text-[#132A24]/80 hover:bg-[#132A24]/5 transition-colors cursor-pointer"
                          >
                            {completingId === session.id ? 'Completing...' : 'Mark Complete'}
                          </button>
                        )}
                        {onOpenSoap && (
                          <button
                            onClick={() => onOpenSoap(session.id)}
                            className="px-3 py-1.5 rounded-lg border border-[#132A24]/15 text-xs text-[#132A24]/80 hover:bg-[#132A24]/5 transition-colors cursor-pointer"
                          >
                            SOAP Note
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* C. NEW REQUESTS */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-normal text-[#132A24]">New Requests</h3>
                <span className="text-xs text-[#132A24]/50">Client consultations awaiting your review</span>
              </div>
              <button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('requests');
                  } else if (typeof window !== 'undefined' && window.navigateTo) {
                    window.navigateTo('/therapist/requests');
                  }
                }}
                className="text-xs text-[#4E7A66] hover:text-[#132A24] font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                View all requests <ArrowRight size={12} />
              </button>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="bg-white border border-[#132A24]/10 rounded-xl p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#132A24]/5 text-[#132A24]/40 flex items-center justify-center mx-auto">
                  <Users size={20} />
                </div>
                <p className="text-sm font-medium text-[#132A24]">No new client requests.</p>
                <p className="text-xs text-[#132A24]/50 max-w-sm mx-auto leading-relaxed">
                  Your matching intake queue is clear. When new clients are matched with your clinical profile, their requests will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="bg-white border border-[#132A24]/10 rounded-xl p-4 shadow-xs flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#132A24]/5 text-[#132A24] flex items-center justify-center font-serif font-semibold text-xs">
                        {req.clientDisplayName ? req.clientDisplayName.charAt(0) : 'C'}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-[#132A24]">
                          {req.clientDisplayName}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#132A24]/50">
                          <span className="capitalize">{req.preferredFormat || 'telehealth'}</span>
                          <span>&bull;</span>
                          <span className="capitalize">{req.urgencyLevel || 'standard'} Priority</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700">
                        {req.matchStatus || 'Awaiting Review'}
                      </span>
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('requests')}
                          className="px-3 py-1.5 rounded-lg bg-[#132A24] text-white text-xs font-medium hover:bg-[#132A24]/90 cursor-pointer"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* D. ACTIVE CLIENTS */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-normal text-[#132A24]">Active Clients</h3>
                <span className="text-xs text-[#132A24]/50">Ongoing therapeutic care relationships</span>
              </div>
              {onNavigate && activeClients.length > 0 && (
                <button
                  onClick={() => onNavigate('clients')}
                  className="text-xs text-[#4E7A66] hover:text-[#132A24] font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  View All ({activeClients.length}) <ArrowRight size={12} />
                </button>
              )}
            </div>

            {activeClients.length === 0 ? (
              <div className="bg-white border border-[#132A24]/10 rounded-xl p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#132A24]/5 text-[#132A24]/40 flex items-center justify-center mx-auto">
                  <UserCheck size={20} />
                </div>
                <p className="text-sm font-medium text-[#132A24]">No active clients yet.</p>
                <p className="text-xs text-[#132A24]/50 max-w-sm mx-auto leading-relaxed">
                  Active care relationships will appear here once initial client requests are accepted and sessions commence.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeClients.slice(0, 4).map((client) => (
                  <div
                    key={client.id}
                    className="bg-white border border-[#132A24]/10 rounded-xl p-4 shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#4E7A66]/10 text-[#4E7A66] flex items-center justify-center font-serif font-semibold text-xs">
                        {client.clientDisplayName ? client.clientDisplayName.charAt(0) : 'C'}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-[#132A24]">
                          {client.clientDisplayName}
                        </h4>
                        <span className="text-[11px] text-[#132A24]/50 block">
                          {client.totalSessionsCompleted} {client.totalSessionsCompleted === 1 ? 'session' : 'sessions'} completed
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#4E7A66]/10 text-[#4E7A66] uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN (1 Col): Next Session, Notes Due, Notifications, Tip  */}
        <div className="space-y-6">
          
          {/* B. NEXT SESSION CARD (Focus Dark Card) */}
          <div className="bg-[#132A24] text-white rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span className="uppercase tracking-[0.16em] font-bold text-[#8DBFB4]">Next Session</span>
              <Clock size={14} className="text-[#8DBFB4]" />
            </div>

            {nextSession ? (
              <div className="space-y-3">
                <div>
                  <div 
                    onClick={() => onOpenSession ? onOpenSession(nextSession.id) : null}
                    className="text-xl font-serif font-medium cursor-pointer hover:text-[#8DBFB4] transition-colors"
                  >
                    {nextSession.clientDisplayName}
                  </div>
                  <div className="text-xs text-white/70 mt-1">
                    {new Date(nextSession.scheduledStart).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })} &bull; {new Date(nextSession.scheduledStart).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white/10 text-[#8DBFB4]">
                      {nextSession.sessionType ? nextSession.sessionType.replace(/_/g, ' ') : 'Telehealth'}
                    </span>
                    <span className="text-[11px] text-white/60 capitalize">
                      Status: {nextSession.status}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  {nextSession.googleMeetUrl && (
                    <a
                      href={nextSession.googleMeetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 text-center rounded-lg bg-white text-[#132A24] text-xs font-semibold hover:bg-white/90 no-underline cursor-pointer inline-flex items-center justify-center gap-1"
                    >
                      Join Google Meet
                    </a>
                  )}
                  {onOpenSoap && (
                    <button
                      onClick={() => onOpenSoap(nextSession.id)}
                      className="flex-1 py-2 text-center rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/15 border border-white/10 cursor-pointer"
                    >
                      Clinical Notes
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 py-1">
                <p className="text-sm font-medium text-white">No upcoming sessions.</p>
                <p className="text-xs text-white/60 leading-relaxed">
                  You have no appointments currently queued. Review open requests or configure calendar availability slots to accept bookings.
                </p>
              </div>
            )}
          </div>

          {/* E. NOTES DUE */}
          <div className="bg-white border border-[#132A24]/10 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#132A24] flex items-center gap-2">
                <FileText size={15} className="text-[#4E7A66]" /> Notes Due
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                notesDue.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-[#132A24]/5 text-[#132A24]/50'
              }`}>
                {notesDue.length}
              </span>
            </div>

            {notesDue.length === 0 ? (
              <div className="text-center py-4 space-y-1">
                <CheckCircle2 size={20} className="mx-auto text-[#4E7A66]" />
                <p className="text-xs font-medium text-[#132A24]">No notes due.</p>
                <p className="text-[11px] text-[#132A24]/50">
                  All completed session SOAP documentations are up to date.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notesDue.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-[#FAFAF8] border border-[#132A24]/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-medium text-[#132A24] block">{item.clientDisplayName}</span>
                      <span className="text-[10px] text-[#132A24]/50">
                        {new Date(item.scheduledEnd || item.scheduledStart).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    {onOpenSoap && (
                      <button
                        onClick={() => onOpenSoap(item.id)}
                        className="px-2.5 py-1 rounded bg-[#132A24] text-white text-[10px] font-medium hover:bg-[#132A24]/90 cursor-pointer"
                      >
                        Draft SOAP
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* F. NOTIFICATIONS */}
          <div className="bg-white border border-[#132A24]/10 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#132A24] flex items-center gap-2">
                <Bell size={15} className="text-[#4E7A66]" /> Notifications
              </span>
              <span className="text-[10px] text-[#132A24]/50">
                {notifications.length} unread
              </span>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-4 space-y-1">
                <Inbox size={20} className="mx-auto text-[#132A24]/30" />
                <p className="text-xs font-medium text-[#132A24]">You're all caught up.</p>
                <p className="text-[11px] text-[#132A24]/50">
                  No new operational notifications or schedule alerts.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 3).map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3 rounded-lg bg-[#FAFAF8] border border-[#132A24]/5 space-y-1 text-xs"
                  >
                    <span className="font-medium text-[#132A24] block">{notif.title}</span>
                    <p className="text-[11px] text-[#132A24]/60 leading-tight">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Privacy & Clinical Tenancy Guarantee */}
          <div className="bg-[#4E7A66]/5 border border-[#4E7A66]/20 rounded-xl p-4 text-xs space-y-1.5 text-[#132A24]">
            <div className="flex items-center gap-1.5 font-semibold text-[#4E7A66]">
              <Sparkles size={14} />
              <span>Tenancy & Privacy Shield</span>
            </div>
            <p className="text-[11px] text-[#132A24]/70 leading-relaxed">
              Client self-reflection journals and psychometric exercises remain private self-work and are strictly inaccessible to practitioner accounts.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
