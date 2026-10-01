import { useState, useEffect, useCallback } from 'react';

/**
 * Reusable React Hook for managing Google Calendar OAuth & Synchronization status.
 *
 * @param {Object} options
 * @param {'therapist' | 'user'} [options.type='user'] - Target account type
 * @param {string} [options.returnTo] - Destination path after OAuth callback
 */
export function useGoogleCalendar(options = {}) {
  const accountType = options.type || 'user';
  const returnTo = options.returnTo || (accountType === 'therapist' ? '/therapist/calendar' : '/client/appointments');

  const [connected, setConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState(null);
  const [syncStatus, setSyncStatus] = useState('not_connected');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const [canSimulate, setCanSimulate] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const typeParam = accountType === 'therapist' ? '?type=therapist' : '';
      const res = await fetch(`/api/calendar/google/status${typeParam}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        if (res.status === 401) {
          // Unauthenticated or session expired; keep not_connected without loud error
          setConnected(false);
          setSyncStatus('not_connected');
          return;
        }
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to check calendar connection status.');
      }
      const data = await res.json();
      setConnected(Boolean(data.connected));
      setGoogleEmail(data.googleEmail || null);
      setSyncStatus(data.syncStatus || 'not_connected');
      setLastSyncedAt(data.lastSyncedAt || null);
    } catch (err) {
      const msg = err.name === 'TypeError' || err.message?.includes('fetch')
        ? 'Calendar status unavailable: network connection issue.'
        : (err.message || 'Error fetching calendar status');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [accountType]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Initiate OAuth flow
  const connect = useCallback(async (customReturnTo, connectOpts = {}) => {
    setActionLoading(true);
    setError(null);
    try {
      const targetReturn = customReturnTo || returnTo;
      const typeParam = accountType === 'therapist' ? '&type=therapist' : '';
      const simParam = connectOpts.simulate ? '&simulate=true' : '';
      const endpoint = `/api/calendar/google/connect?returnTo=${encodeURIComponent(targetReturn)}${typeParam}&format=json${simParam}`;

      const res = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.canSimulate) {
          setCanSimulate(true);
        }
        throw new Error(data.error?.message || 'Failed to initiate Google Calendar connection.');
      }

      if (data.simulated) {
        await fetchStatus();
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No authorization URL returned by server.');
      }
    } catch (err) {
      const isFetchErr = err.name === 'TypeError' || err.message?.includes('fetch');
      const friendlyMsg = isFetchErr
        ? 'Unable to reach calendar authentication service. Please check your network or server configuration.'
        : (err.message || 'Failed to connect Google Calendar.');
      setError(friendlyMsg);
      setActionLoading(false);
    }
  }, [accountType, returnTo, fetchStatus]);

  const connectSimulated = useCallback(async (customReturnTo) => {
    return connect(customReturnTo, { simulate: true });
  }, [connect]);

  // Disconnect Google Calendar
  const disconnect = useCallback(async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/calendar/google/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ type: accountType }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to disconnect Google Calendar.');
      }
      await fetchStatus();
    } catch (err) {
      setError(err.message || 'Failed to disconnect Google Calendar.');
    } finally {
      setActionLoading(false);
    }
  }, [accountType, fetchStatus]);

  // Refresh status
  const refresh = useCallback(async () => {
    return fetchStatus();
  }, [fetchStatus]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    connected,
    email: googleEmail,
    googleEmail,
    syncStatus,
    lastSyncedAt,
    loading: loading || actionLoading,
    error,
    canSimulate,
    connect,
    connectSimulated,
    disconnect,
    refresh,
    clearError,
  };
}
