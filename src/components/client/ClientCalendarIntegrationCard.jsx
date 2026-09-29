import React from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';

export default function ClientCalendarIntegrationCard({ className = '', onStatusChange }) {
  const {
    connected,
    email,
    syncStatus,
    lastSyncedAt,
    loading,
    error,
    connect,
    disconnect,
    refresh,
  } = useGoogleCalendar({
    type: 'user',
    returnTo: '/settings',
  });

  const isExpired = syncStatus === 'revoked' || syncStatus === 'expired';

  const handleRefresh = async () => {
    await refresh();
    if (onStatusChange) onStatusChange();
  };

  const handleDisconnect = async () => {
    if (window.confirm('Disconnect your Google Calendar from Ingress Within?')) {
      await disconnect();
      if (onStatusChange) onStatusChange();
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-6 lg:p-7 shadow-xs space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-gray-900">
              Google Calendar
            </h3>
            <p className="text-xs text-gray-500">
              Sync consultations & check scheduling availability
            </p>
          </div>
        </div>

        {connected && !isExpired && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={13} /> Connected
          </span>
        )}
      </div>

      {/* Error / Alert banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* Privacy Notice Banner */}
      <div className="bg-[#FAF9F5] border border-[#132A24]/10 rounded-xl p-4 text-xs text-[#132A24]/80 flex items-start gap-3">
        <ShieldCheck size={16} className="text-[#4E7A66] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-[#132A24]">Strict Privacy Guarantee</p>
          <p className="leading-relaxed text-[#132A24]/70">
            Connecting your calendar allows Ingress Within to check your free/busy availability when scheduling sessions.
            We <strong>only</strong> read free/busy times. We <strong>never</strong> import, view, or store personal event titles, descriptions, attendees, locations, or private event content.
          </p>
        </div>
      </div>

      {/* State 1: Expired / Revoked */}
      {isExpired ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle size={16} className="text-amber-700" />
              <span>Google Calendar connection expired.</span>
            </div>
            <p className="text-amber-800/80 leading-relaxed">
              Google authorization expired or was revoked. Reconnect your account to continue synchronizing consultations with your primary calendar.
            </p>
          </div>

          <button
            onClick={() => connect('/settings')}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-medium hover:bg-black transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Reconnect Google Calendar
          </button>
        </div>
      ) : connected ? (
        /* State 2: Connected */
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50 border border-gray-200/60 rounded-xl p-4">
            <div>
              <span className="text-gray-400 block text-[11px] uppercase tracking-wider mb-0.5">
                Connected Google Account
              </span>
              <span className="font-semibold text-gray-800 break-all">
                {email || 'Primary Google Account'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px] uppercase tracking-wider mb-0.5">
                Calendar Status
              </span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={13} /> Active & Synchronized
              </span>
            </div>
            {lastSyncedAt && (
              <div className="sm:col-span-2 text-[11px] text-gray-500">
                Last checked: {new Date(lastSyncedAt).toLocaleString('en-IN')}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <LogOut size={13} />
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        /* State 3: Not Connected */
        <div className="space-y-5">
          <p className="text-xs text-gray-600 leading-relaxed">
            Connecting your Google Calendar enables Ingress Within to automatically add booked sessions, provide direct Google Meet access, and check your schedule conflicts when booking.
          </p>

          <button
            onClick={() => connect('/settings')}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-medium hover:bg-black transition-colors cursor-pointer inline-flex items-center justify-center gap-2 shadow-xs"
          >
            <CalendarIcon size={14} />
            {loading ? 'Connecting...' : 'Connect Google Calendar'}
          </button>
        </div>
      )}
    </div>
  );
}
