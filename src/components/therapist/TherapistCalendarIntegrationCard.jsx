import React from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';

export default function TherapistCalendarIntegrationCard({ className = '', onStatusChange }) {
  const {
    connected,
    email,
    syncStatus,
    lastSyncedAt,
    loading,
    error,
    canSimulate,
    connect,
    connectSimulated,
    disconnect,
    refresh,
    clearError,
  } = useGoogleCalendar({
    type: 'therapist',
    returnTo: '/therapist/profile',
  });

  const isExpired = syncStatus === 'revoked' || syncStatus === 'expired';
  const isFailed = syncStatus === 'failed';

  const handleRefresh = async () => {
    await refresh();
    if (onStatusChange) onStatusChange();
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect your Google Calendar? Automatic Google Meet creation and live availability sync will be paused.')) {
      await disconnect();
      if (onStatusChange) onStatusChange();
    }
  };

  return (
    <div className={`bg-white border border-[#132A24]/10 rounded-2xl p-6 lg:p-7 shadow-xs space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#132A24]/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4E7A66]/10 flex items-center justify-center text-[#4E7A66]">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-[#132A24]">
              Google Calendar
            </h3>
            <p className="text-xs text-[#132A24]/60">
              Live calendar synchronization & Google Meet generation
            </p>
          </div>
        </div>

        {connected && !isExpired && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#4E7A66]/10 text-[#4E7A66]">
            <CheckCircle2 size={13} /> Connected
          </span>
        )}
      </div>

      {/* Error / Alert banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-red-950">Connection Issue</p>
                <p className="leading-relaxed text-red-800">{error}</p>
              </div>
            </div>
            {clearError && (
              <button
                type="button"
                onClick={clearError}
                className="text-red-500 hover:text-red-800 text-xs p-1"
                title="Dismiss"
              >
                ✕
              </button>
            )}
          </div>

          {(canSimulate || error.includes('credentials') || error.includes('simulated')) && (
            <div className="pt-2 border-t border-red-200/60 flex items-center justify-between">
              <span className="text-[11px] text-red-700">Development mode detected:</span>
              <button
                type="button"
                onClick={() => connectSimulated('/therapist/profile')}
                disabled={loading}
                className="px-3 py-1.5 bg-[#132A24] text-white rounded-lg text-[11px] font-semibold hover:bg-[#132A24]/90 transition cursor-pointer"
              >
                Connect in Simulated Dev Mode
              </button>
            </div>
          )}
        </div>
      )}

      {/* State 1: Expired / Revoked */}
      {isExpired ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle size={16} className="text-amber-700" />
              <span>Google Calendar connection expired or authorization revoked.</span>
            </div>
            <p className="text-amber-800/80 leading-relaxed">
              Google reported that permissions were revoked or refreshed. Please reconnect your Google account to restore automatic Meet generation and schedule synchronization.
            </p>
          </div>

          <button
            onClick={() => connect('/therapist/profile')}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#132A24] text-white text-xs font-semibold hover:bg-[#132A24]/90 transition-all cursor-pointer shadow-xs inline-flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Reconnect Google Calendar
          </button>
        </div>
      ) : connected ? (
        /* State 2: Connected */
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FAFAF8] border border-[#132A24]/5 rounded-xl p-4">
            <div>
              <span className="text-[#132A24]/50 block text-[11px] uppercase tracking-wider mb-0.5">
                Connected Account
              </span>
              <span className="font-semibold text-[#132A24] break-all">
                {email || 'Primary Account'}
              </span>
            </div>
            <div>
              <span className="text-[#132A24]/50 block text-[11px] uppercase tracking-wider mb-0.5">
                Target Calendar
              </span>
              <span className="font-semibold text-[#132A24]">
                Primary
              </span>
            </div>
            {lastSyncedAt && (
              <div className="sm:col-span-2 text-[11px] text-[#132A24]/60">
                Last checked: {new Date(lastSyncedAt).toLocaleString('en-IN')}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-[#132A24]/15 text-xs font-medium text-[#132A24] hover:bg-[#132A24]/5 transition-colors cursor-pointer inline-flex items-center gap-1.5"
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
          <div className="text-xs text-[#132A24]/80 space-y-2">
            <p className="font-medium text-[#132A24]">
              Connect your Google Calendar to:
            </p>
            <ul className="space-y-1.5 text-[#132A24]/70 list-disc list-inside">
              <li>Show your real availability and working hours</li>
              <li>Avoid scheduling conflicts across personal commitments</li>
              <li>Automatically generate real Google Meet links for booked sessions</li>
              <li>Keep all appointments synchronized in real time</li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              onClick={() => connect('/therapist/profile')}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#132A24] text-white text-xs font-semibold hover:bg-[#132A24]/90 transition-all cursor-pointer shadow-xs inline-flex items-center justify-center gap-2"
            >
              <CalendarIcon size={14} />
              {loading ? 'Connecting...' : 'Connect Google Calendar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
