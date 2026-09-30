import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Mail,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';

const adminQuotes = [
  "Securing clinical boundaries and platform integrity with absolute rigor.",
  "Decoupled architecture guarantees robust governance without single points of compromise.",
  "Real-time diagnostic visibility, immutable audit trails, and zero-trust authorization.",
  "Ensuring practitioner trust, patient privacy, and financial precision at scale."
];

export default function AdminLoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);

  // Rotating quotes timer
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveQuoteIndex((prev) => (prev + 1) % adminQuotes.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both administrative email and password.');
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white text-[#132A24] font-sans">
      
      {/* LEFT COLUMN: BRANDING & SYSTEM BOUNDARY */}
      <div className="relative hidden lg:flex flex-col items-center justify-between bg-[#132A24] p-12 overflow-hidden border-r border-[#132A24]/10">
        
        {/* Glow motifs */}
        <div className="absolute top-0 left-0 w-[420px] h-[420px] bg-[#4E7A66]/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-[#8DBFB4]/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Back Link */}
        <a 
          href="/" 
          className="self-start flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#D8ECEA]/70 hover:text-white transition-colors no-underline z-10"
        >
          <ArrowLeft size={14} /> Back to Ingress
        </a>

        {/* Center Portal Motif */}
        <div className="relative w-80 h-80 flex items-center justify-center shrink-0 my-8">
          <div className="absolute z-20 flex flex-col items-center justify-center pointer-events-none text-center">
            <img 
              src="/logo-mark-light.png" 
              alt="Ingress Within" 
              className="w-16 h-16 object-contain drop-shadow-md" 
            />
            <span className="font-serif text-white text-base font-normal tracking-[0.08em] mt-3 leading-none">
              ingress <span className="font-semibold text-[#4E7A66]">within</span>
            </span>
            <span className="mt-2 text-[10px] font-sans uppercase tracking-[0.25em] text-[#8DBFB4] font-semibold">
              Administrative Command
            </span>
          </div>

          <motion.div 
            animate={{ scale: [1, 1.07, 1], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-48 h-48 rounded-full border border-[#4E7A66]/30"
          />
          <motion.div 
            animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute w-64 h-64 rounded-full border border-[#8DBFB4]/25"
          />
        </div>

        {/* Rotating quotes */}
        <div className="max-w-[360px] text-left min-h-[70px] z-10">
          <AnimatePresence mode="wait">
            <motion.p 
              key={activeQuoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.85, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8 }}
              className="font-serif text-[16px] italic text-[#D8ECEA] leading-relaxed"
            >
              "{adminQuotes[activeQuoteIndex]}"
            </motion.p>
          </AnimatePresence>
        </div>

      </div>

      {/* RIGHT COLUMN: ADMIN AUTHENTICATION FORM */}
      <div className="relative flex flex-col justify-between items-center py-12 px-6 md:px-12 bg-[#FAFAF8] min-h-screen">
        
        {/* Top Header Mobile Branding */}
        <div className="w-full flex justify-between items-center max-w-[400px] z-10">
          <a 
            href="/" 
            className="lg:hidden flex items-center gap-1.5 text-xs text-[#132A24]/60 hover:text-[#132A24] transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </a>
          <div className="flex items-center gap-2 lg:hidden ml-auto">
            <img 
              src="/logo-mark-transparent.png" 
              alt="Ingress Within" 
              className="w-6 h-6 object-contain" 
            />
            <span className="font-serif text-sm font-semibold text-[#132A24]">
              ingress <span className="font-normal text-[#4E7A66]">within</span>
            </span>
          </div>
        </div>

        {/* Central Auth Area */}
        <div className="w-full max-w-[400px] flex-grow flex flex-col justify-center z-10 py-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="space-y-6"
          >
            {/* Header Badge & Title */}
            <div className="space-y-2 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#132A24]/5 border border-[#132A24]/10 text-[#132A24] text-xs font-medium tracking-wide">
                <ShieldCheck size={13} className="text-[#4E7A66]" />
                Administrative Security Boundary
              </div>
              <h1 className="font-serif text-[32px] md:text-[36px] leading-tight font-normal text-[#132A24]">
                Founder Portal
              </h1>
              <p className="font-sans text-[13px] text-[#132A24]/60">
                Secure access gateway for operations, settlements, and platform audit.
              </p>
            </div>

            {/* Security Warning Notice */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-950">Restricted Access:</span> Only provisioned platform administrators may sign in. All attempts are cryptographically audited.
              </div>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 flex items-start gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#132A24] mb-1.5">
                  Administrative Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#132A24]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    disabled={isLoading || isLocked}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@ingresswithin.com"
                    className="w-full bg-white border border-[#132A24]/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#132A24] placeholder-[#132A24]/30 focus:outline-none focus:border-[#132A24] focus:ring-1 focus:ring-[#132A24]/20 transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#132A24] mb-1.5">
                  Master Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#132A24]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLoading || isLocked}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-white border border-[#132A24]/15 rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#132A24] placeholder-[#132A24]/30 focus:outline-none focus:border-[#132A24] focus:ring-1 focus:ring-[#132A24]/20 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#132A24]/40 hover:text-[#132A24] p-1 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isLocked}
                className="w-full mt-2 bg-[#132A24] hover:bg-[#132A24]/90 disabled:bg-[#132A24]/40 text-white font-medium py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    Authorize & Enter Command Center
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Security Guarantee */}
            <div className="pt-4 border-t border-[#132A24]/10 text-center">
              <p className="text-[11px] text-[#132A24]/50 leading-relaxed">
                Ingress Within Healthcare Infrastructure • Scrypt Memory-Hard Protection • Zero Local Storage Tokens
              </p>
            </div>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="w-full max-w-[400px] text-center pb-4">
          <span className="text-[11px] text-[#132A24]/40">
            Ingress Within &copy; {new Date().getFullYear()} — Clinical Healthcare Platform
          </span>
        </div>

      </div>
    </div>
  );
}
