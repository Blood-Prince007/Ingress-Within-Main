import React, { useState } from 'react';
import { Shield, Lock, Mail, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

export default function AdminLoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.code === 'ACCOUNT_LOCKED') {
          setIsLocked(true);
        }
        setErrorMessage(data.error?.message || 'Authentication failed. Please verify credentials.');
        return;
      }

      if (data.success && data.admin) {
        onLoginSuccess(data.admin);
      }
    } catch {
      setErrorMessage('Network connection error. Unable to reach admin authentication service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 font-sans text-slate-100">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand & Security Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Ingress Within</h1>
          <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold mt-1">Founder & Admin Command Portal</p>
        </div>

        {/* Security Warning Banner */}
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3.5 flex items-start gap-3 mb-6 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Restricted Access:</span> Unauthorized access attempts are monitored and recorded in immutable audit logs.
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3.5 mb-6 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                disabled={isLoading || isLocked}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@ingresswithin.com"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Master Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                disabled={isLoading || isLocked}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isLocked}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying Credentials...
              </>
            ) : (
              <>
                Authorize & Enter Portal
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            Ingress Within Healthcare Infrastructure • Zero Client Secrets
          </p>
        </div>
      </div>
    </div>
  );
}
