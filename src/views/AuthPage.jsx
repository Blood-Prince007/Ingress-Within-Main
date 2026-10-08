import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const quotes = [
  "The things you avoid naming shape you anyway.",
  "What you keep circling becomes visible over time.",
  "Write the version before you made it make sense.",
  "A single entry is a moment. A thread is a picture."
];

export default function AuthPage({ user, profile: propProfile, onOpenPolicy, onAuthSuccess }) {
  // If user is already authenticated, immediately route to destination without showing login form
  useEffect(() => {
    if (user) {
      const destination = (propProfile && !propProfile.onboarding_completed) ? '/onboarding' : '/dashboard';
      if (typeof window !== 'undefined') {
        if (window.navigateTo) {
          window.navigateTo(destination);
        } else {
          window.location.href = destination;
        }
      }
    }
  }, [user, propProfile]);

  // Navigation views: 'entry', 'otp', 'success'
  const [view, setView] = useState('entry');
  const [profile, setProfile] = useState(propProfile || null);
  
  // Phone and OTP input values
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [sentToNumber, setSentToNumber] = useState('');
  
  // OTP Resend Countdown (30 seconds)
  const [otpTimer, setOtpTimer] = useState(30);
  const [canResendOtp, setCanResendOtp] = useState(false);
  
  // UI States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);

  const otpInputsRef = useRef([]);

  // Quotes rotation on Left panel (Must preserve left panel behavior)
  useEffect(() => {
    const quoteTimer = setInterval(() => {
      setActiveQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(quoteTimer);
  }, []);

  // OTP Countdown Timer (30s)
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

  // Auto-submit OTP when all 6 digits are filled
  useEffect(() => {
    const fullOtp = otpDigits.join('');
    if (fullOtp.length === 6 && view === 'otp' && !isSubmitting) {
      handleOtpVerify(fullOtp);
    }
  }, [otpDigits, view]);

  // Navigate view helper
  const navigateToView = (newView) => {
    setView(newView);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Page 1: Send OTP via API
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    
    if (mobileNumber.length < 10) {
      setErrorMsg("That doesn't look like a valid number.");
      setShake(true);
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg('');
    
    try {
      const formattedPhone = `+91${mobileNumber}`;
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: formattedPhone })
      });
      
      let data = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        // Check if this looks like Vite's index.html fallback
        if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
          throw new Error('Local API server is not running. Did you run "npx vercel dev" instead of "npm run dev"?');
        }
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      
      if (!response.ok) {
        throw new Error(data?.error?.message || "We couldn't verify your number right now.");
      }
      
      setSentToNumber(mobileNumber);
      setOtpTimer(data.resend_in_seconds || 30);
      setCanResendOtp(false);
      setOtpDigits(['', '', '', '', '', '']);
      navigateToView('otp');
      
      // Focus first OTP field
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

  // Page 2: Verify OTP via API
  const handleOtpVerify = async (otpCode) => {
    setIsSubmitting(true);
    setErrorMsg('');
    
    try {
      const formattedPhone = `+91${mobileNumber}`;
      
      // Generate or retrieve a persistent client-side device fingerprint
      let deviceId = localStorage.getItem('iw-device-id');
      if (!deviceId) {
        deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('iw-device-id', deviceId);
      }
      
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: formattedPhone,
          otp_code: otpCode,
          device_id: deviceId,
          device_name: navigator.userAgent || 'Web Browser'
        })
      });
      
      let data = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
          throw new Error('Local API server is not running. Did you run "npx vercel dev" instead of "npm run dev"?');
        }
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      
      if (!response.ok) {
        throw new Error(data?.error?.message || "We couldn't verify your number right now.");
      }
      
      // Success
      setProfile(data.profile || null);
      if (onAuthSuccess) {
        onAuthSuccess(data);
      }
      navigateToView('success');
    } catch (err) {
      setErrorMsg(err.message);
      setShake(true);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP inputs key handlers
  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 0) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }
    
    const char = cleaned[cleaned.length - 1];
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setErrorMsg('');
    
    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index] === '') {
        if (index > 0) {
          const newDigits = [...otpDigits];
          newDigits[index - 1] = '';
          setOtpDigits(newDigits);
          otpInputsRef.current[index - 1]?.focus();
        }
      } else {
        const newDigits = [...otpDigits];
        newDigits[index] = '';
        setOtpDigits(newDigits);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6);
    if (pastedData.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedData[i] || '';
      }
      setOtpDigits(newDigits);
      setErrorMsg('');
      const targetIndex = Math.min(pastedData.length - 1, 5);
      otpInputsRef.current[targetIndex]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResendOtp) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const formattedPhone = `+91${mobileNumber}`;
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: formattedPhone })
      });
      
      let data = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
          throw new Error('Local API server is not running. Did you run "npx vercel dev" instead of "npm run dev"?');
        }
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      
      if (!response.ok) {
        throw new Error(data?.error?.message || "We couldn't verify your number right now.");
      }
      
      setOtpTimer(data.resend_in_seconds || 30);
      setCanResendOtp(false);
      setOtpDigits(['', '', '', '', '', '']);
      setSuccessMsg('Code resent successfully.');
      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
      if (otpInputsRef.current[0]) otpInputsRef.current[0].focus();
    } catch (err) {
      setErrorMsg(err.message);
      setShake(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeNumber = () => {
    setView('entry');
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMsg('');
  };

  // Shake animation variants
  const shakeVariants = {
    shake: {
      x: [0, -6, 6, -6, 6, -3, 3, 0],
      transition: { duration: 0.35, ease: "easeInOut" }
    },
    idle: { x: 0 }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white text-primary font-sans">
      
      {/* LEFT COLUMN: BRAND VISUALS (Unchanged side panel) */}
      <div className="relative hidden lg:flex flex-col items-center justify-between bg-primary p-12 overflow-hidden border-r border-white/5">
        
        {/* Decorative background glows */}
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Back Link to Landing Page */}
        <a 
          href="/" 
          className="self-start flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#D8ECEA]/65 hover:text-white transition-colors no-underline z-10"
        >
          <ArrowLeft size={14} /> Back to Ingress
        </a>

        {/* Dynamic Breathing Portal Motif */}
        <div className="relative w-80 h-80 flex items-center justify-center shrink-0 my-8">
          
          {/* Logo Mark in Center */}
          <div className="absolute z-20 flex flex-col items-center justify-center pointer-events-none">
            <img 
              src="/logo-mark-light.png" 
              alt="Ingress Within" 
              className="w-16 h-16 object-contain drop-shadow-md" 
            />
            <span className="font-serif text-white text-sm font-normal tracking-[0.08em] mt-3 leading-none">
              ingress <span className="font-semibold text-secondary">within</span>
            </span>
          </div>

          {/* Breathing Circle Ring 1 (Teal) */}
          <motion.div 
            animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.45, 0.35] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-44 h-44 rounded-full border border-secondary/20"
          />

          {/* Breathing Circle Ring 2 (Sage) */}
          <motion.div 
            animate={{ scale: [1, 1.14, 1], opacity: [0.22, 0.35, 0.22] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute w-60 h-60 rounded-full border border-[#8DBFB4]/15"
          />

          {/* Breathing Circle Ring 3 (Accent) */}
          <motion.div 
            animate={{ scale: [1, 1.20, 1], opacity: [0.12, 0.25, 0.12] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute w-72 h-72 rounded-full border border-[#E0A898]/10"
          />

          {/* Orbital Particles (Floating dots representing thoughts) */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute top-[20px] left-[150px] w-2 h-2 rounded-full bg-accent opacity-60" />
            <div className="absolute bottom-[40px] right-[100px] w-1.5 h-1.5 rounded-full bg-secondary opacity-50" />
            <div className="absolute top-[220px] left-[20px] w-1.5 h-1.5 rounded-full bg-supporting opacity-55" />
          </motion.div>

          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute top-[100px] right-[40px] w-2 h-2 rounded-full bg-secondary opacity-40" />
            <div className="absolute bottom-[100px] left-[50px] w-1.5 h-1.5 rounded-full bg-accent opacity-50" />
          </motion.div>
        </div>

        {/* Rotating reflection text in left corner */}
        <div className="max-w-[320px] text-left min-h-[70px] z-10">
          <AnimatePresence mode="wait">
            <motion.p 
              key={activeQuoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.65, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8 }}
              className="font-serif text-[17px] italic text-[#D8ECEA] leading-relaxed"
            >
              "{quotes[activeQuoteIndex]}"
            </motion.p>
          </AnimatePresence>
        </div>

      </div>

      {/* RIGHT COLUMN: AUTHENTICATION FORM */}
      <div className="relative flex flex-col justify-between items-center py-12 px-6 md:px-12 bg-mint-grey min-h-screen">
        
        {/* Top Header bar with Logo mark for Mobile view */}
        <div className="w-full flex justify-end items-center max-w-[360px] z-10">
          <div className="flex items-center gap-2 lg:hidden">
            <img 
              src="/logo-mark-transparent.png" 
              alt="Ingress Within" 
              className="w-6 h-6 object-contain" 
            />
            <span className="font-serif text-sm font-bold text-primary">ingress <span className="font-normal text-secondary">within</span></span>
          </div>
        </div>

        {/* Central Auth Area wrapper */}
        <div className="w-full max-w-[360px] flex-grow flex flex-col justify-center z-10 py-12">
          
          <AnimatePresence mode="wait">
            
            {/* PAGE 1: AUTH ENTRY */}
            {view === 'entry' && (
              <motion.div
                key="entry-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="space-y-12 text-center"
              >
                {/* Header */}
                <div className="space-y-2">
                  <h1 className="font-serif text-[36px] md:text-[42px] leading-tight font-normal text-primary tracking-wide">
                    Ingress Within
                  </h1>
                  <p className="font-sans text-[15px] font-light text-mid leading-relaxed">
                    A daily writing practice.
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-8">
                  <motion.div
                    variants={shakeVariants}
                    animate={shake ? "shake" : "idle"}
                    onAnimationComplete={() => setShake(false)}
                    className="space-y-6"
                  >
                    {/* Phone input wrapper */}
                    <div className="relative">
                      <div className="flex items-center bg-white-paper border border-primary/10 rounded-md px-4 py-3.5 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20 transition-all shadow-xs">
                        <span className="font-sans text-[15px] text-primary/45 select-none pr-3 border-r border-primary/10 mr-3">+91</span>
                        <input 
                          type="tel"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          value={mobileNumber}
                          onChange={(e) => { setMobileNumber(e.target.value.replace(/\D/g, '').substring(0, 10)); setErrorMsg(''); }}
                          placeholder="00000 00000"
                          disabled={isSubmitting}
                          className="w-full bg-transparent border-none p-0 font-sans text-[15px] text-primary placeholder-primary/25 outline-none disabled:opacity-50"
                        />
                      </div>
                      
                      {errorMsg && (
                        <p className="font-sans text-[13px] text-error text-left mt-2 pl-1 leading-relaxed">
                          {errorMsg}
                        </p>
                      )}
                    </div>

                    {/* Continue Button */}
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-accent hover:bg-[#654652] text-white py-3.5 rounded-md font-sans text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      {isSubmitting ? "Sending..." : "Continue"}
                    </button>
                  </motion.div>
                </form>
              </motion.div>
            )}

            {/* PAGE 2: OTP VERIFICATION */}
            {view === 'otp' && (
              <motion.div
                key="otp-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="space-y-12 text-center"
              >
                {/* Header */}
                <div className="space-y-2">
                  <h1 className="font-serif text-[32px] md:text-[36px] leading-tight font-normal text-primary">
                    Verify your number
                  </h1>
                  <p className="font-sans text-[14px] font-light text-mid leading-relaxed">
                    Code sent to <span className="font-medium text-primary/80">+91 {mobileNumber.replace(/(\d{5})(\d{5})/, '$1 $2')}</span>
                  </p>
                </div>

                <motion.div
                  variants={shakeVariants}
                  animate={shake ? "shake" : "idle"}
                  onAnimationComplete={() => setShake(false)}
                  className="space-y-6"
                >
                  {/* Visual OTP Input digits row */}
                  <div className="flex justify-between gap-2.5">
                    {otpDigits.map((digit, idx) => (
                      <input 
                        key={idx}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        disabled={isSubmitting}
                        className="w-11 h-14 bg-white-paper border border-primary/10 rounded-md text-center font-sans text-xl font-light text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all shadow-xs disabled:opacity-50"
                      />
                    ))}
                  </div>

                  {errorMsg && (
                    <p className="font-sans text-[13px] text-error leading-relaxed">
                      {errorMsg}
                    </p>
                  )}

                  {successMsg && (
                    <p className="font-sans text-[13px] text-secondary font-medium leading-relaxed">
                      {successMsg}
                    </p>
                  )}

                  {isSubmitting && (
                    <div className="flex justify-center items-center py-2">
                      <span className="font-sans text-xs text-mid/70 animate-pulse">Verifying code...</span>
                    </div>
                  )}

                  {/* Links Row */}
                  <div className="flex flex-col items-center gap-3 pt-4 border-t border-primary/5">
                    {canResendOtp ? (
                      <button 
                        onClick={handleResendOtp}
                        disabled={isSubmitting}
                        className="font-sans text-xs text-accent hover:text-[#654652] font-semibold tracking-wide bg-transparent border-none p-0 cursor-pointer transition-colors"
                      >
                        Resend code
                      </button>
                    ) : (
                      <span className="font-sans text-xs text-mid/60 font-light select-none">
                        Resend code in <strong className="text-primary/75 font-medium">{otpTimer}s</strong>
                      </span>
                    )}

                    <button 
                      onClick={handleChangeNumber}
                      disabled={isSubmitting}
                      className="font-sans text-xs text-primary/45 hover:text-primary/80 bg-transparent border-none p-0 cursor-pointer transition-colors"
                    >
                      Change number
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* VIEW 3: SUCCESS */}
            {view === 'success' && (
              <motion.div
                key="success-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="space-y-8 text-center"
              >
                {/* Celebratory Check Mark Visual with breathing background rings */}
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                    className="absolute inset-0 rounded-full bg-secondary/12 border border-secondary/30"
                  />
                  <motion.div 
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="absolute w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xs border border-primary/5"
                  />
                  <motion.div
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    <ShieldCheck size={40} className="text-secondary relative z-10" />
                  </motion.div>
                </div>

                {/* Success Copy */}
                <div className="space-y-3">
                  <h1 className="font-serif text-[32px] md:text-[36px] leading-tight font-normal text-primary">
                    {profile && !profile.onboarding_completed ? "Welcome to Ingress" : "You're Ready To Begin"}
                  </h1>
                  <p className="font-sans text-sm font-light text-mid leading-relaxed max-w-[320px] mx-auto">
                    {profile && !profile.onboarding_completed 
                      ? "To begin, we need a few details to initialize your workspace." 
                      : "Your first reflection cycle is waiting. Take a moment to settle in."}
                  </p>
                </div>
 
                {/* Continue CTA */}
                <button 
                  onClick={() => {
                    const destination = (profile && !profile.onboarding_completed) ? '/onboarding' : '/dashboard';
                    if (typeof window !== 'undefined') {
                      if (typeof window.navigateTo === 'function') {
                        window.navigateTo(destination);
                      } else {
                        window.location.href = destination;
                      }
                    }
                  }}
                  className="w-full py-4 bg-primary hover:bg-[#2A3A3E] text-mint-grey border-none rounded-md font-sans text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs"
                >
                  {profile && !profile.onboarding_completed ? "Continue to onboarding →" : "Continue to dashboard →"}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Empty bottom area for large whitespace spacing */}
        <div className="h-6" />

      </div>

    </div>
  );
}
