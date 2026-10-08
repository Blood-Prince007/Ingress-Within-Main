import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ShieldCheck, Clock, CheckCircle2, User, Phone, LogOut } from 'lucide-react';

const therapistQuotes = [
  "Holding space for reflection is the foundation of thoughtful care.",
  "Clarity emerges when clinical insight meets patient depth.",
  "Facilitating insight, one guided journey at a time.",
  "Secure, dedicated access designed for clinical practitioners."
];

const shakeVariants = {
  idle: { x: 0 },
  shake: {
    x: [-6, 6, -5, 5, -3, 3, 0],
    transition: { duration: 0.45, ease: "easeInOut" }
  }
};

export default function TherapistAuthPage({ onAuthSuccess }) {
  // Modes: 'login' | 'signup'
  const [mode, setMode] = useState('login');
  // Views: 'entry' | 'otp' | 'pending' | 'active'
  const [view, setView] = useState('entry');

  // Input states
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [sentToNumber, setSentToNumber] = useState('');

  // Account details upon verification
  const [therapistData, setTherapistData] = useState(null);

  // Timers and UI states
  const [otpTimer, setOtpTimer] = useState(30);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);

  const otpInputsRef = useRef([]);

  // Check if therapist already has an active session on mount
  useEffect(() => {
    async function checkCurrentSession() {
      try {
        const res = await fetch('/api/therapist/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.therapist) {
            setTherapistData(data);
            if (onAuthSuccess) {
              onAuthSuccess(data);
              return;
            }
            if (data.therapist.status === 'pending') {
              setView('pending');
            } else {
              setView('active');
            }
          }
        }
      } catch {}
    }
    checkCurrentSession();
  }, [onAuthSuccess]);

  // Auto-transition to dashboard when verified practitioner is confirmed
  useEffect(() => {
    if (view === 'active' && therapistData?.therapist) {
      const timer = setTimeout(() => {
        if (onAuthSuccess) {
          onAuthSuccess(therapistData);
        } else if (typeof window !== 'undefined' && window.navigateTo) {
          window.navigateTo('/therapist');
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [view, therapistData, onAuthSuccess]);

  // Quotes rotation on Left panel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveQuoteIndex((prev) => (prev + 1) % therapistQuotes.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  // OTP Countdown Timer
  useEffect(() => {
    let timer;
    if (view === 'otp' && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }
    return () => clearInterval(timer);
  }, [view, otpTimer]);

  // Auto-submit OTP when 6 digits are filled
  useEffect(() => {
    const fullOtp = otpDigits.join('');
    if (fullOtp.length === 6 && view === 'otp' && !isSubmitting) {
      handleVerifyOtp(fullOtp);
    }
  }, [otpDigits, view]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();

    if (mode === 'signup' && fullName.trim().length < 2) {
      setErrorMsg('Please enter your full legal name.');
      setShake(true);
      return;
    }

    if (mobileNumber.length < 10) {
      setErrorMsg('Please enter a valid 10-digit Indian phone number.');
      setShake(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formattedPhone = `+91${mobileNumber}`;
      const payload = {
        phone_number: formattedPhone,
        mode: mode,
        full_name: mode === 'signup' ? fullName.trim() : undefined
      };

      const res = await fetch('/api/therapist/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to send verification code.');
      }

      setSentToNumber(formattedPhone);
      setView('otp');
      setOtpDigits(['', '', '', '', '', '']);
      setOtpTimer(data.resend_in_seconds || 30);
      setCanResendOtp(false);
      setSuccessMsg('Verification code sent.');
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch (err) {
      setErrorMsg(err.message);
      setShake(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (otpCode) => {
    const code = otpCode || otpDigits.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      setShake(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Deterministic client device ID for multi-device management
      let deviceId = 'th_web_' + (typeof window !== 'undefined' ? window.navigator.userAgent.replace(/\D/g, '').substring(0, 16) : 'browser');

      const res = await fetch('/api/therapist/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: sentToNumber,
          otp_code: code,
          mode: mode,
          full_name: mode === 'signup' ? fullName.trim() : undefined,
          device_id: deviceId,
          device_name: 'Web Portal'
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error?.message || "Verification code didn't match.");
      }

      setTherapistData(data);
      if (onAuthSuccess) {
        onAuthSuccess(data);
      }

      if (data.therapist?.status === 'pending') {
        setView('pending');
      } else {
        setView('active');
      }
    } catch (err) {
      setErrorMsg(err.message);
      setShake(true);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/therapist/auth/logout', { method: 'POST' });
    } catch {}
    setTherapistData(null);
    setView('entry');
    setMobileNumber('');
    setFullName('');
    setOtpDigits(['', '', '', '', '', '']);
  };

  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const nextOtp = [...otpDigits];
      nextOtp[index] = '';
      setOtpDigits(nextOtp);
      return;
    }

    if (cleanVal.length > 1) {
      const chars = cleanVal.slice(0, 6).split('');
      const nextOtp = [...otpDigits];
      chars.forEach((c, i) => {
        if (index + i < 6) nextOtp[index + i] = c;
      });
      setOtpDigits(nextOtp);
      const focusIndex = Math.min(index + chars.length, 5);
      otpInputsRef.current[focusIndex]?.focus();
      return;
    }

    const nextOtp = [...otpDigits];
    nextOtp[index] = cleanVal;
    setOtpDigits(nextOtp);

    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white text-primary font-sans">
      
      {/* LEFT COLUMN: PRACTITIONER PORTAL BRANDING */}
      <div className="relative hidden lg:flex flex-col items-center justify-between bg-primary p-12 overflow-hidden border-r border-white/5">
        
        {/* Glow motifs */}
        <div className="absolute top-0 left-0 w-[420px] h-[420px] bg-secondary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-[#8DBFB4]/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Back Link */}
        <a 
          href="/" 
          className="self-start flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#D8ECEA]/65 hover:text-white transition-colors no-underline z-10"
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
            <span className="font-serif text-white text-sm font-normal tracking-[0.08em] mt-3 leading-none">
              ingress <span className="font-semibold text-secondary">within</span>
            </span>
            <span className="mt-2 text-[11px] font-sans uppercase tracking-[0.2em] text-secondary/80 font-medium">
              Practitioner Portal
            </span>
          </div>

          <motion.div 
            animate={{ scale: [1, 1.07, 1], opacity: [0.35, 0.5, 0.35] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-48 h-48 rounded-full border border-secondary/25"
          />
          <motion.div 
            animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute w-64 h-64 rounded-full border border-[#8DBFB4]/20"
          />
        </div>

        {/* Rotating quotes */}
        <div className="max-w-[340px] text-left min-h-[70px] z-10">
          <AnimatePresence mode="wait">
            <motion.p 
              key={activeQuoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.75, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8 }}
              className="font-serif text-[17px] italic text-[#D8ECEA] leading-relaxed"
            >
              "{therapistQuotes[activeQuoteIndex]}"
            </motion.p>
          </AnimatePresence>
        </div>

      </div>

      {/* RIGHT COLUMN: THERAPIST AUTHENTICATION */}
      <div className="relative flex flex-col justify-between items-center py-12 px-6 md:px-12 bg-mint-grey min-h-screen">
        
        {/* Top Header Mobile Branding */}
        <div className="w-full flex justify-between items-center max-w-[380px] z-10">
          <a 
            href="/" 
            className="lg:hidden flex items-center gap-1.5 text-xs text-primary/60 hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </a>
          <div className="flex items-center gap-2 lg:hidden ml-auto">
            <img 
              src="/logo-mark-transparent.png" 
              alt="Ingress Within" 
              className="w-6 h-6 object-contain" 
            />
            <span className="font-serif text-sm font-bold text-primary">ingress <span className="font-normal text-secondary">within</span></span>
          </div>
        </div>

        {/* Central Auth Area */}
        <div className="w-full max-w-[380px] flex-grow flex flex-col justify-center z-10 py-12">
          
          <AnimatePresence mode="wait">
            
            {/* VIEW 1: AUTH ENTRY (LOGIN / SIGNUP TOGGLE) */}
            {view === 'entry' && (
              <motion.div
                key="therapist-entry"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="space-y-2 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-medium tracking-wide mb-1">
                    <ShieldCheck size={13} />
                    Clinical Practitioner Access
                  </div>
                  <h1 className="font-serif text-[32px] md:text-[38px] leading-tight font-normal text-primary">
                    Therapist Portal
                  </h1>
                  <p className="font-sans text-[14px] text-mid">
                    {mode === 'login' 
                      ? 'Sign in to access your clinical dashboard and clients.'
                      : 'Register for clinical practitioner onboarding.'}
                  </p>
                </div>

                {/* Internal Login / Create Account Toggle */}
                <div className="flex rounded-lg bg-primary/5 p-1 border border-primary/10">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setErrorMsg(''); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                      mode === 'login'
                        ? 'bg-white text-primary shadow-xs'
                        : 'text-primary/60 hover:text-primary'
                    }`}
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setErrorMsg(''); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                      mode === 'signup'
                        ? 'bg-white text-primary shadow-xs'
                        : 'text-primary/60 hover:text-primary'
                    }`}
                  >
                    Create account
                  </button>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-5">
                  <motion.div
                    variants={shakeVariants}
                    animate={shake ? "shake" : "idle"}
                    onAnimationComplete={() => setShake(false)}
                    className="space-y-4"
                  >
                    {/* Full Name input for Signup */}
                    {mode === 'signup' && (
                      <div className="relative">
                        <label className="block text-xs font-medium text-primary/70 mb-1.5 ml-0.5">
                          Full Name
                        </label>
                        <div className="flex items-center bg-white border border-primary/15 rounded-md px-3.5 py-3 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary/30 transition-all shadow-xs">
                          <User size={16} className="text-primary/40 mr-2.5 shrink-0" />
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => { setFullName(e.target.value); setErrorMsg(''); }}
                            placeholder="Dr. Jane Smith"
                            disabled={isSubmitting}
                            className="w-full bg-transparent font-sans text-[15px] text-primary placeholder-primary/30 outline-hidden"
                            autoComplete="name"
                          />
                        </div>
                      </div>
                    )}

                    {/* Phone Number Input */}
                    <div className="relative">
                      <label className="block text-xs font-medium text-primary/70 mb-1.5 ml-0.5">
                        Indian Mobile Number
                      </label>
                      <div className="flex items-center bg-white border border-primary/15 rounded-md px-3.5 py-3 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary/30 transition-all shadow-xs">
                        <span className="font-sans text-[15px] font-medium text-primary/50 select-none pr-3 border-r border-primary/10 mr-3">
                          +91
                        </span>
                        <input
                          type="tel"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          value={mobileNumber}
                          onChange={(e) => {
                            setMobileNumber(e.target.value.replace(/\D/g, '').substring(0, 10));
                            setErrorMsg('');
                          }}
                          placeholder="98765 43210"
                          disabled={isSubmitting}
                          className="w-full bg-transparent font-sans text-[15px] text-primary placeholder-primary/30 outline-hidden tracking-wide"
                          autoComplete="tel-national"
                        />
                      </div>
                    </div>

                    {/* Error Message */}
                    {errorMsg && (
                      <div className="text-left text-[13px] text-accent bg-accent/10 border border-accent/20 rounded-md p-2.5">
                        {errorMsg}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting || mobileNumber.length < 10 || (mode === 'signup' && fullName.trim().length < 2)}
                      className="w-full py-3.5 px-4 rounded-md font-sans text-[14px] font-medium tracking-wide text-white bg-primary hover:bg-primary/95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                    >
                      {isSubmitting ? 'Sending code...' : 'Send verification code'}
                    </button>
                  </motion.div>
                </form>

                <p className="text-center text-xs text-primary/50 leading-relaxed">
                  {mode === 'login'
                    ? 'Only registered and verified therapists may access this portal.'
                    : 'Applications are verified before clinical access is granted.'}
                </p>
              </motion.div>
            )}

            {/* VIEW 2: OTP VERIFICATION */}
            {view === 'otp' && (
              <motion.div
                key="therapist-otp"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="space-y-8 text-center"
              >
                <div className="space-y-2">
                  <h2 className="font-serif text-[30px] font-normal text-primary">
                    Verify Your Code
                  </h2>
                  <p className="font-sans text-[14px] text-mid">
                    Enter the 6-digit code sent to <span className="font-medium text-primary">{sentToNumber}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => { setView('entry'); setErrorMsg(''); }}
                    className="text-xs text-secondary hover:underline cursor-pointer"
                  >
                    Change phone number
                  </button>
                </div>

                <motion.div
                  variants={shakeVariants}
                  animate={shake ? "shake" : "idle"}
                  onAnimationComplete={() => setShake(false)}
                  className="space-y-6"
                >
                  {/* 6 Digit Inputs */}
                  <div className="flex justify-between gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        type="tel"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        disabled={isSubmitting}
                        className="w-12 h-14 text-center font-sans text-xl font-semibold bg-white border border-primary/20 rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary/30 outline-hidden transition-all shadow-xs"
                      />
                    ))}
                  </div>

                  {/* Error & Success notices */}
                  {errorMsg && (
                    <div className="text-left text-[13px] text-accent bg-accent/10 border border-accent/20 rounded-md p-2.5">
                      {errorMsg}
                    </div>
                  )}
                  {successMsg && !errorMsg && (
                    <div className="text-center text-[13px] text-secondary">
                      {successMsg}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={isSubmitting || otpDigits.join('').length !== 6}
                    className="w-full py-3.5 px-4 rounded-md font-sans text-[14px] font-medium tracking-wide text-white bg-primary hover:bg-primary/95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                  >
                    {isSubmitting ? 'Verifying...' : 'Verify and proceed'}
                  </button>

                  <div className="text-xs text-primary/60">
                    {canResendOtp ? (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-secondary font-medium hover:underline cursor-pointer"
                      >
                        Resend verification code
                      </button>
                    ) : (
                      <span>Resend code in {otpTimer}s</span>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* VIEW 3: APPLICATION PENDING REVIEW */}
            {view === 'pending' && (
              <motion.div
                key="therapist-pending"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 text-center bg-white p-8 rounded-xl border border-primary/10 shadow-sm"
              >
                <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                  <Clock size={32} />
                </div>

                <div className="space-y-2">
                  <h2 className="font-serif text-[26px] font-normal text-primary">
                    Application Pending Review
                  </h2>
                  <p className="font-sans text-[14px] text-mid leading-relaxed">
                    Thank you{therapistData?.profile?.full_name ? `, ${therapistData.profile.full_name}` : ''}. Your practitioner registration has been received and is currently undergoing clinical verification by our administrative team.
                  </p>
                </div>

                <div className="bg-mint-grey p-4 rounded-lg text-left text-xs space-y-1.5 text-primary/70">
                  <div>
                    <span className="font-semibold text-primary">Phone: </span>
                    {therapistData?.therapist?.phone_number || sentToNumber}
                  </div>
                  <div>
                    <span className="font-semibold text-primary">Account Status: </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 uppercase tracking-wider ml-1">
                      Pending
                    </span>
                  </div>
                </div>

                <p className="text-xs text-primary/50 leading-relaxed">
                  You will receive an update once clinical onboarding is approved. For inquiries, contact clinical@ingresswithin.com.
                </p>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 text-xs font-medium text-primary/70 hover:text-primary border border-primary/15 rounded-md hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <LogOut size={14} /> Log out
                  </button>
                  <a
                    href="/"
                    className="text-xs text-secondary hover:underline py-1 block"
                  >
                    Return to Ingress Within
                  </a>
                </div>
              </motion.div>
            )}

            {/* VIEW 4: ACTIVE THERAPIST PORTAL */}
            {view === 'active' && (
              <motion.div
                key="therapist-active"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 text-center bg-white p-8 rounded-xl border border-primary/10 shadow-sm"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>

                <div className="space-y-2">
                  <h2 className="font-serif text-[26px] font-normal text-primary">
                    Practitioner Verified
                  </h2>
                  <p className="font-sans text-[14px] text-mid leading-relaxed">
                    Welcome back{therapistData?.profile?.full_name ? `, ${therapistData.profile.full_name}` : ''}. You are authenticated to the Ingress Within Practitioner Network.
                  </p>
                </div>

                <div className="bg-mint-grey p-4 rounded-lg text-left text-xs space-y-1.5 text-primary/70">
                  <div>
                    <span className="font-semibold text-primary">Practitioner: </span>
                    {therapistData?.profile?.full_name || 'Verified Therapist'}
                  </div>
                  <div>
                    <span className="font-semibold text-primary">Phone: </span>
                    {therapistData?.therapist?.phone_number || sentToNumber}
                  </div>
                  <div>
                    <span className="font-semibold text-primary">Status: </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 uppercase tracking-wider ml-1">
                      Active
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (onAuthSuccess) {
                        onAuthSuccess(therapistData);
                      } else if (typeof window !== 'undefined' && window.navigateTo) {
                        window.navigateTo('/therapist');
                      } else if (typeof window !== 'undefined') {
                        window.location.href = '/therapist';
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 text-xs font-semibold text-white bg-[#132A24] hover:bg-[#132A24]/90 rounded-md transition-all cursor-pointer shadow-xs"
                  >
                    Enter Clinical Dashboard <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 text-xs font-medium text-primary/70 hover:text-primary border border-primary/15 rounded-md hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                  <a
                    href="/"
                    className="text-xs text-secondary hover:underline py-1 block"
                  >
                    Return to Ingress Within
                  </a>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* Footer */}
        <div className="w-full max-w-[380px] text-center text-[11px] text-primary/40 z-10">
          Ingress Within &bull; Secure Clinical Practitioner System
        </div>

      </div>

    </div>
  );
}
