import React, { useState, useEffect } from 'react';
import AdminLoginView from './AdminLoginView';
import AdminDashboardShell from './AdminDashboardShell';
import { Shield, Loader2 } from 'lucide-react';

export default function AdminPlatformView() {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialTab, setInitialTab] = useState('overview');

  const checkAdminAuth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.admin) {
          setAdmin(data.admin);
        } else {
          setAdmin(null);
        }
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Detect tab from pathname if navigating directly (e.g. /admin/users -> tab "users")
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/^\/admin\/?/, '').replace(/\/$/, '');
      if (path && path !== 'login') {
        setInitialTab(path);
      }
    }
    checkAdminAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    setAdmin(null);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/admin/login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3 font-sans text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
          <Shield className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          Verifying administrative authorization...
        </div>
      </div>
    );
  }

  if (!admin) {
    return <AdminLoginView onLoginSuccess={(adm) => setAdmin(adm)} />;
  }

  return (
    <AdminDashboardShell
      admin={admin}
      onLogout={handleLogout}
      initialTab={initialTab}
    />
  );
}
