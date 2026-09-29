import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  User, 
  Bell, 
  ShieldAlert, 
  LogOut, 
  CheckCircle2, 
  Info,
  CreditCard,
  FileText,
  HelpCircle,
  Menu,
  X
} from 'lucide-react';
import { DashboardService } from '../services/dashboardService';
import ClientCalendarIntegrationCard from '../components/client/ClientCalendarIntegrationCard';

export default function SettingsPage({ user, profile, onSignOut }) {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('profile'); // profile, notifications, calendar, subscription, billing, payment, how, ai, privacy, delete
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openEditPanel, setOpenEditPanel] = useState(null); // 'name' | 'phone' | 'email' | null
  
  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  
  // Modals State
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLogoutAllModalOpen, setIsLogoutAllModalOpen] = useState(false);
  
  // Profile Values States
  const [displayName, setDisplayName] = useState(profile?.full_name || user?.name || 'Arjun Mehta');
  const [phoneDisplay, setPhoneDisplay] = useState(profile?.phone_number || user?.phone_number || '+91 98765 43210');
  const [emailDisplay, setEmailDisplay] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('iw_user_email') || 'arjun@example.com' : 'arjun@example.com'
  );

  // Edit Input States
  const [nameInput, setNameInput] = useState(displayName);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSendingPhoneCode, setIsSendingPhoneCode] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState(['', '', '', '', '', '']);
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const [phoneOtpError, setPhoneOtpError] = useState('');

  const [emailInput, setEmailInput] = useState(emailDisplay);
  const [emailError, setEmailError] = useState('');

  const [dlRequested, setDlRequested] = useState(false);

  // Notifications preferences states
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reportReminder, setReportReminder] = useState(true);
  const [exerciseReminder, setExerciseReminder] = useState(false);

  // Real dynamic billing states
  const [billingData, setBillingData] = useState(null);
  const [isBillingLoading, setIsBillingLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutMsg, setCheckoutMsg] = useState('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Delete flow states
  const [deleteStep, setDeleteStep] = useState(1); // 1, 2, 3
  const [deleteOtp, setDeleteOtp] = useState(['', '', '', '', '', '']);
  const [isSendingDeleteOtp, setIsSendingDeleteOtp] = useState(false);
  const [deleteOtpSent, setDeleteOtpSent] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteCooldown, setDeleteCooldown] = useState(0);

  // Refs for auto-focusing
  const nameInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const phoneOtpRefs = useRef([]);
  const deleteOtpRefs = useRef([]);
  const toastTimerRef = useRef(null);
  const phoneTimerRef = useRef(null);
  const deleteTimerRef = useRef(null);

  // Dynamically load Instrument Sans and Lora Google Fonts on mount
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400;1,600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      try {
        document.head.removeChild(link);
      } catch (e) {}
    };
  }, []);

  // Cooldown timers
  useEffect(() => {
    if (phoneCooldown > 0) {
      phoneTimerRef.current = setTimeout(() => setPhoneCooldown(phoneCooldown - 1), 1000);
    }
    return () => clearTimeout(phoneTimerRef.current);
  }, [phoneCooldown]);

  useEffect(() => {
    if (deleteCooldown > 0) {
      deleteTimerRef.current = setTimeout(() => setDeleteCooldown(deleteCooldown - 1), 1000);
    }
    return () => clearTimeout(deleteTimerRef.current);
  }, [deleteCooldown]);

  // Utility to trigger visual toast
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 2600);
  };

  const fetchBillingOverview = async () => {
    try {
      const res = await fetch('/api/billing/overview');
      if (res.ok) {
        const data = await res.json();
        setBillingData(data.billing);
      }
    } catch (err) {
      console.error('[Settings] Failed to fetch billing overview:', err);
    } finally {
      setIsBillingLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingOverview();
  }, []);

  const handleSubscribe = async () => {
    setIsCheckingOut(true);
    setCheckoutMsg('Preparing secure checkout…');

    try {
      const res = await fetch('/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: 'SELF_HELP_MONTHLY' })
      });

      const data = await res.json();
      if (!res.ok) {
        triggerToast(data.error?.message || 'Failed to initiate checkout.');
        setIsCheckingOut(false);
        return;
      }

      const { subscription_id, key_id, product } = data;

      // Ensure Razorpay script is loaded
      if (typeof window !== 'undefined' && !window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }

      const options = {
        key: key_id,
        subscription_id: subscription_id,
        name: 'Ingress Within',
        description: `${product.name} (₹499/month GST inclusive)`,
        image: '/favicon.ico',
        handler: async function (response) {
          setCheckoutMsg("Payment received. We're confirming your subscription…");
          try {
            await fetch('/api/billing/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            // Poll subscription confirmation
            let pollCount = 0;
            const pollTimer = setInterval(async () => {
              pollCount++;
              const checkRes = await fetch(`/api/billing/subscription-status/${subscription_id}`);
              if (checkRes.ok) {
                const checkData = await checkRes.json();
                if (checkData.subscription?.is_active || pollCount > 10) {
                  clearInterval(pollTimer);
                  await fetchBillingOverview();
                  setIsCheckingOut(false);
                  triggerToast('Subscription activated successfully!');
                }
              }
            }, 1500);
          } catch (e) {
            await fetchBillingOverview();
            setIsCheckingOut(false);
          }
        },
        prefill: {
          contact: user?.phone_number || profile?.phone_number || ''
        },
        theme: {
          color: '#1E2A2E'
        },
        modal: {
          ondismiss: function () {
            setIsCheckingOut(false);
            triggerToast('Checkout cancelled.');
          }
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setIsCheckingOut(false);
          triggerToast(resp.error?.description || 'Payment could not be processed.');
        });
        rzp.open();
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setIsCheckingOut(false);
      triggerToast('Unable to open checkout.');
    }
  };

  const handleConfirmCancel = async () => {
    if (!billingData?.subscription?.gateway_subscription_id) return;
    setIsCancelling(true);
    try {
      const res = await fetch('/api/billing/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: billingData.subscription.gateway_subscription_id
        })
      });
      if (res.ok) {
        triggerToast('Subscription cancelled. Access remains active until the end of your billing cycle.');
        await fetchBillingOverview();
      } else {
        triggerToast('Could not cancel subscription. Please try again.');
      }
    } catch (e) {
      triggerToast('Network error during cancellation.');
    } finally {
      setIsCancelling(false);
      setIsCancelModalOpen(false);
    }
  };

  // Toggle Edit Panels
  const handleToggleEp = (panel) => {
    if (openEditPanel === panel) {
      setOpenEditPanel(null);
    } else {
      setOpenEditPanel(panel);
      setNameError('');
      setPhoneError('');
      setPhoneOtpError('');
      setEmailError('');
      
      // Auto focus fields
      setTimeout(() => {
        if (panel === 'name') {
          setNameInput(displayName);
          nameInputRef.current?.focus();
        } else if (panel === 'phone') {
          setPhoneInput('');
          setPhoneOtpSent(false);
          setPhoneOtp(['', '', '', '', '', '']);
          phoneInputRef.current?.focus();
        } else if (panel === 'email') {
          setEmailInput(emailDisplay);
          emailInputRef.current?.focus();
        }
      }, 60);
    }
  };

  // Profile Saves
  const handleSaveName = async () => {
    const cleanName = nameInput.trim();
    if (!cleanName) {
      setNameError('A name is required.');
      return;
    }
    setIsSavingName(true);
    setNameError('');
    try {
      const res = await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: cleanName })
      });
      if (res.ok) {
        setDisplayName(cleanName);
        setOpenEditPanel(null);
        triggerToast('Name updated.');
      } else {
        setNameError('Failed to update profile settings.');
      }
    } catch (err) {
      setNameError('A network error occurred.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSaveEmail = () => {
    const cleanEmail = emailInput.trim();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('That doesn\'t look like a valid email address.');
      return;
    }
    localStorage.setItem('iw_user_email', cleanEmail);
    setEmailDisplay(cleanEmail);
    setOpenEditPanel(null);
    triggerToast(cleanEmail ? 'Email saved.' : 'Email removed.');
  };

  // Phone update handlers
  const handleSendPhoneCode = () => {
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setPhoneError('That doesn\'t look like a valid number.');
      return;
    }
    setIsSendingPhoneCode(true);
    setPhoneError('');
    setPhoneOtpError('');
    
    // Simulate API dispatch (matches HTML timeouts)
    setTimeout(() => {
      setIsSendingPhoneCode(false);
      setPhoneOtpSent(true);
      setPhoneCooldown(30);
      setPhoneOtp(['', '', '', '', '', '']);
      setTimeout(() => phoneOtpRefs.current[0]?.focus(), 50);
      triggerToast('Verification code sent.');
    }, 900);
  };

  const handleVerifyPhoneOtp = () => {
    const code = phoneOtp.join('');
    if (code.length !== 6) {
      setPhoneOtpError('Please enter the full 6-digit code.');
      return;
    }
    
    // Simulate successful OTP check
    const cleanPhone = phoneInput.replace(/\D/g, '');
    const formattedNum = `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
    setPhoneDisplay(formattedNum);
    setOpenEditPanel(null);
    setPhoneOtpSent(false);
    triggerToast('Phone number updated.');
  };

  const handlePhoneOtpInput = (index, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...phoneOtp];
    newOtp[index] = digit;
    setPhoneOtp(newOtp);
    setPhoneOtpError('');

    if (digit && index < 5) {
      phoneOtpRefs.current[index + 1]?.focus();
    }
  };

  const handlePhoneOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !phoneOtp[index] && index > 0) {
      const newOtp = [...phoneOtp];
      newOtp[index - 1] = '';
      setPhoneOtp(newOtp);
      phoneOtpRefs.current[index - 1]?.focus();
    }
  };

  // Data Download Request
  const handleRequestDownload = () => {
    setDlRequested(true);
    triggerToast('Download link will be sent within 7 days.');
  };

  // Delete Flow Handlers
  const handleGoToDeleteStep = async (step) => {
    if (step === 2) {
      setDeleteError('');
      setIsSendingDeleteOtp(true);
      try {
        const res = await fetch('/api/auth/delete-account/send-otp', {
          method: 'POST'
        });
        const resData = await res.json();
        if (res.ok) {
          setDeleteOtpSent(true);
          setDeleteCooldown(resData.resend_in_seconds || 30);
          setDeleteOtp(['', '', '', '', '', '']);
          setDeleteStep(2);
          setTimeout(() => deleteOtpRefs.current[0]?.focus(), 50);
          triggerToast('Verification code sent.');
        } else {
          setDeleteError(resData.error?.message || 'Failed to send verification code.');
        }
      } catch (err) {
        setDeleteError('Network error while requesting verification code.');
      } finally {
        setIsSendingDeleteOtp(false);
      }
    } else {
      setDeleteStep(step);
    }
  };

  const handleConfirmDelete = async () => {
    const code = deleteOtp.join('');
    if (code.length !== 6) {
      setDeleteError('Please enter the full 6-digit code.');
      return;
    }
    
    setIsDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp_code: code })
      });
      const resData = await res.json();
      if (res.ok) {
        setDeleteStep(3);
        DashboardService.resetState(); // Wipe local journal cache
      } else {
        setDeleteError(resData.error?.message || 'Verification failed. Please try again.');
      }
    } catch (err) {
      setDeleteError('Network error during account deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteOtpInput = (index, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...deleteOtp];
    newOtp[index] = digit;
    setDeleteOtp(newOtp);
    setDeleteError('');

    if (digit && index < 5) {
      deleteOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleDeleteOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !deleteOtp[index] && index > 0) {
      const newOtp = [...deleteOtp];
      newOtp[index - 1] = '';
      setDeleteOtp(newOtp);
      deleteOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleSignOutClick = async () => {
    setIsLogoutModalOpen(false);
    if (onSignOut) {
      onSignOut();
    } else {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/auth';
      } catch (err) {
        console.error('Logout failed:', err);
      }
    }
  };

  const handleSignOutAllClick = async () => {
    setIsLogoutAllModalOpen(false);
    triggerToast('Logged out of all other devices.');
  };

  // Tab Switch Handler
  const handleTabSwitch = (tabId) => {
    if (tabId === 'logout') {
      setIsLogoutModalOpen(true);
      return;
    }
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    setOpenEditPanel(null);
    
    // Scroll content panel to top
    const panel = document.getElementById('content-panel');
    if (panel) panel.scrollTop = 0;
  };

  // RENDER SECTIONS

  // 1. Profile Tab
  const renderProfile = () => (
    <div className="pad animate-fadeUp">
      <p className="pg-ey">Account</p>
      <h1 className="pg-h font-serif text-3xl font-normal">Profile</h1>
      <p className="pg-sub text-[13.5px] text-mid mb-8 max-w-[480px] leading-relaxed">
        Your name and contact details. Email is used only for report notifications — never for marketing.
      </p>

      <div className="card bg-white border border-[#1E2A2E]/8 rounded-xl mb-5 overflow-hidden">
        <div className="card-hd px-5 py-3 border-b border-[#1E2A2E]/8 flex items-center justify-between">
          <span className="card-lbl text-[10px] tracking-widest uppercase font-bold text-mid">Identity</span>
        </div>

        {/* Row Name */}
        <div 
          className="row tap flex justify-between items-center px-5 py-3.5 border-b border-[#1E2A2E]/8 hover:bg-[#1E2A2E]/2 cursor-pointer transition-colors"
          onClick={() => handleToggleEp('name')}
        >
          <div className="row-l flex-1 min-w-0">
            <div className="row-lbl font-semibold text-[13.5px]">Name</div>
            <div className="row-val text-mid text-[12.5px] mt-0.5" id="d-name">{displayName}</div>
          </div>
          <span className="chev text-mid/30 text-lg select-none">›</span>
        </div>
        <div className={`ep ${openEditPanel === 'name' ? 'open' : ''} bg-[#8DBFB4]/5 border-t border-[#1E2A2E]/8 px-5 py-3.5`} id="ep-name">
          <div className="ep-row flex flex-wrap gap-2 items-start">
            <div className={`iw flex-1 min-w-[180px] border border-[#1E2A2E]/15 rounded-lg overflow-hidden bg-white ${nameError ? 'err border-[#E0A898]' : 'focus-within:border-[#8DBFB4]'}`}>
              <input 
                className="inp w-full px-3 py-2 text-[13.5px] outline-none bg-transparent" 
                id="i-name" 
                type="text" 
                value={nameInput} 
                onChange={(e) => { setNameInput(e.target.value); setNameError(''); }}
                placeholder="Your name"
                ref={nameInputRef}
              />
            </div>
            <button className="btn btn-dk px-4 py-2 bg-[#1E2A2E] text-white rounded-lg text-xs font-semibold hover:bg-[#253338] transition-colors" onClick={handleSaveName} disabled={isSavingName}>
              {isSavingName ? 'Saving...' : 'Save'}
            </button>
            <button className="btn btn-ol px-4 py-2 border border-[#1E2A2E]/15 rounded-lg text-xs font-semibold hover:bg-black/5" onClick={() => setOpenEditPanel(null)}>Cancel</button>
          </div>
          {nameError && <p className="ferr text-[#8A3020] text-xs mt-1.5 font-medium" id="e-name">{nameError}</p>}
        </div>

        {/* Row Phone */}
        <div 
          className="row tap flex justify-between items-center px-5 py-3.5 border-b border-[#1E2A2E]/8 hover:bg-[#1E2A2E]/2 cursor-pointer transition-colors"
          onClick={() => handleToggleEp('phone')}
        >
          <div className="row-l flex-1 min-w-0">
            <div className="row-lbl font-semibold text-[13.5px]">Phone number</div>
            <div className="row-val text-mid text-[12.5px] mt-0.5" id="d-phone">{phoneDisplay}</div>
          </div>
          <span className="chev text-mid/30 text-lg select-none">›</span>
        </div>
        <div className={`ep ${openEditPanel === 'phone' ? 'open' : ''} bg-[#8DBFB4]/5 border-t border-[#1E2A2E]/8 px-5 py-3.5`} id="ep-phone">
          <p className="ep-note text-mid text-xs leading-relaxed mb-2.5">
            Current number: <strong className="text-primary font-semibold" id="cur-phone">{phoneDisplay}</strong><br />
            We'll send a code to the new number to confirm the change.
          </p>
          <div className="ep-row flex flex-wrap gap-2 items-start">
            <div className={`iw flex-1 min-w-[180px] border border-[#1E2A2E]/15 rounded-lg overflow-hidden bg-white flex ${phoneError ? 'err border-[#E0A898]' : 'focus-within:border-[#8DBFB4]'}`}>
              <div className="ipre px-3 py-2 text-[13.5px] bg-[#1E2A2E]/5 border-r border-[#1E2A2E]/10 font-bold text-mid">+91</div>
              <input 
                className="inp flex-1 px-3 py-2 text-[13.5px] outline-none bg-transparent" 
                id="i-phone" 
                type="tel" 
                inputMode="numeric" 
                maxLength={10} 
                value={phoneInput}
                onChange={(e) => { setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10)); setPhoneError(''); }}
                placeholder="New 10-digit number"
                ref={phoneInputRef}
              />
            </div>
            <button className="btn btn-dk px-4 py-2 bg-[#1E2A2E] text-white rounded-lg text-xs font-semibold hover:bg-[#253338]" id="send-code-btn" onClick={handleSendPhoneCode} disabled={isSendingPhoneCode}>
              {isSendingPhoneCode ? 'Sending...' : 'Send code'}
            </button>
            <button className="btn btn-ol px-4 py-2 border border-[#1E2A2E]/15 rounded-lg text-xs font-semibold hover:bg-black/5" onClick={() => setOpenEditPanel(null)}>Cancel</button>
          </div>
          {phoneError && <p className="ferr text-[#8A3020] text-xs mt-1.5 font-medium" id="e-phone">{phoneError}</p>}
          
          {phoneOtpSent && (
            <div className="otp-area mt-3.5 pt-3.5 border-t border-[#1E2A2E]/8" id="otp-area">
              <div className="otp-note text-xs text-mid mb-2.5">
                Confirm your new number — code sent to +91 <span className="font-semibold text-primary" id="otp-dest">{phoneInput.slice(0,5)} {phoneInput.slice(5)}</span>
              </div>
              <div className="otp-boxes flex gap-2 mb-2.5">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <input 
                    key={idx}
                    className={`otp-box w-10 h-12 border border-[#1E2A2E]/15 rounded-lg text-center font-serif text-lg font-semibold bg-white outline-none focus:border-[#8DBFB4] ${phoneOtp[idx] ? 'ok border-[#8DBFB4] bg-[#8DBFB4]/5' : ''}`} 
                    maxLength={1} 
                    inputMode="numeric"
                    value={phoneOtp[idx]}
                    onChange={(e) => handlePhoneOtpInput(idx, e.target.value)}
                    onKeyDown={(e) => handlePhoneOtpKeyDown(idx, e)}
                    ref={(el) => (phoneOtpRefs.current[idx] = el)}
                  />
                ))}
              </div>
              {phoneOtpError && <p className="ferr text-[#8A3020] text-xs mt-1 font-medium" id="e-otp">{phoneOtpError}</p>}
              <div className="otp-btns flex items-center gap-2.5 flex-wrap mt-3">
                <button className="btn btn-sage px-4 py-2 bg-[#1A5040] text-white rounded-lg text-xs font-semibold hover:bg-[#143D30]" onClick={handleVerifyPhoneOtp}>
                  Verify &amp; update
                </button>
                {phoneCooldown > 0 ? (
                  <span className="resend-note text-xs text-mid" id="rsnd-note">Resend code ({phoneCooldown}s)</span>
                ) : (
                  <button className="resend-lnk text-xs font-semibold text-secondary hover:underline cursor-pointer" id="rsnd-lnk" onClick={handleSendPhoneCode}>
                    Resend code
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Row Email */}
        <div 
          className="row tap flex justify-between items-center px-5 py-3.5 border-b-0 hover:bg-[#1E2A2E]/2 cursor-pointer transition-colors"
          onClick={() => handleToggleEp('email')}
        >
          <div className="row-l flex-1 min-w-0">
            <div className="row-lbl font-semibold text-[13.5px]">
              Email <span className="text-[11px] font-normal text-mid/60">(for report notifications)</span>
            </div>
            <div className={`row-val text-mid text-[12.5px] mt-0.5 ${!emailDisplay ? 'empty italic text-mid/40' : ''}`} id="d-email">
              {emailDisplay || 'Not added'}
            </div>
          </div>
          <span className="chev text-mid/30 text-lg select-none">›</span>
        </div>
        <div className={`ep ${openEditPanel === 'email' ? 'open' : ''} bg-[#8DBFB4]/5 border-t border-[#1E2A2E]/8 px-5 py-3.5`} id="ep-email">
          <p className="ep-note text-mid text-xs leading-relaxed mb-2.5">Used for report notifications only. We don't send anything else.</p>
          <div className="ep-row flex flex-wrap gap-2 items-start">
            <div className={`iw flex-1 min-w-[180px] border border-[#1E2A2E]/15 rounded-lg overflow-hidden bg-white ${emailError ? 'err border-[#E0A898]' : 'focus-within:border-[#8DBFB4]'}`}>
              <input 
                className="inp w-full px-3 py-2 text-[13.5px] outline-none bg-transparent" 
                id="i-email" 
                type="email" 
                value={emailInput} 
                onChange={(e) => { setEmailInput(e.target.value); setEmailError(''); }}
                placeholder="you@example.com"
                ref={emailInputRef}
              />
            </div>
            <button className="btn btn-dk px-4 py-2 bg-[#1E2A2E] text-white rounded-lg text-xs font-semibold hover:bg-[#253338]" onClick={handleSaveEmail}>Save</button>
            <button className="btn btn-ol px-4 py-2 border border-[#1E2A2E]/15 rounded-lg text-xs font-semibold hover:bg-black/5" onClick={() => setOpenEditPanel(null)}>Cancel</button>
          </div>
          {emailError && <p className="ferr text-[#8A3020] text-xs mt-1.5 font-medium" id="e-email">{emailError}</p>}
          <p className="fhint text-[11px] text-mid/50 mt-1.5">Leave blank to remove your email.</p>
        </div>
      </div>

      <div className="card bg-white border border-[#1E2A2E]/8 rounded-xl mb-5 overflow-hidden">
        <div className="card-hd px-5 py-3 border-b border-[#1E2A2E]/8 flex items-center justify-between">
          <span className="card-lbl text-[10px] tracking-widest uppercase font-bold text-mid">Data</span>
        </div>
        <div className="row flex justify-between items-center px-5 py-4 gap-4">
          <div className="row-l flex-1 min-w-0">
            <div className="row-lbl font-semibold text-[13.5px]">Download my data</div>
            <div className="row-sub text-mid text-[11.5px] mt-0.5 leading-relaxed">
              Your entries, reflections and reports. Sent to your phone number within 7 days.
            </div>
          </div>
          <button 
            className="btn btn-ol px-4 py-2 border border-[#1E2A2E]/15 rounded-lg text-xs font-semibold hover:bg-black/5 shrink-0" 
            onClick={handleRequestDownload}
            disabled={dlRequested}
          >
            {dlRequested ? 'Requested' : 'Request link'}
          </button>
        </div>
      </div>

      <p className="text-[11px] text-mid/45 mt-6">Ingress Within · Version 1.0</p>
    </div>
  );

  // 2. Notifications Tab
  const renderNotifications = () => (
    <div className="pad animate-fadeUp">
      <p className="pg-ey">Preferences</p>
      <h1 className="pg-h font-serif text-3xl font-normal">Notifications</h1>
      <p className="pg-sub text-[13.5px] text-mid mb-8 max-w-[480px] leading-relaxed">
        Three types. All off by default if permission was denied at sign-up — turn them on here whenever you're ready.
      </p>

      <div className="card bg-white border border-[#1E2A2E]/8 rounded-xl mb-5 overflow-hidden">
        <div className="card-hd px-5 py-3 border-b border-[#1E2A2E]/8">
          <span className="card-lbl text-[10px] tracking-widest uppercase font-bold text-mid">Writing</span>
        </div>
        <div className="row flex justify-between items-center px-5 py-4 gap-4">
          <div className="row-l flex-1">
            <div className="row-lbl font-semibold text-[13.5px]">Daily writing reminder</div>
            <div className="row-sub text-mid text-[11.5px] mt-0.5 leading-relaxed">"Time to write." — fires once a day at the time you choose.</div>
          </div>
          <button 
            className={`toggle w-11 h-6 rounded-full relative transition-colors p-0.5 flex items-center ${dailyReminder ? 'bg-[#8DBFB4] justify-end' : 'bg-[#1E2A2E]/15 justify-start'}`} 
            onClick={() => { setDailyReminder(!dailyReminder); triggerToast(dailyReminder ? 'Reminders off.' : 'Reminders on.'); }}
            aria-label="Daily reminder"
          >
            <span className="toggle-k w-5 h-5 bg-white rounded-full shadow-md" />
          </button>
        </div>
        
        {dailyReminder && (
          <div id="daily-time" className="border-t border-[#1E2A2E]/5 bg-[#8DBFB4]/2">
            <div className="row flex justify-between items-center px-5 py-3 pl-8">
              <div className="row-l"><div className="row-lbl font-normal text-mid text-[13px]">Reminder time</div></div>
              <button 
                className="btn btn-ol px-3 py-1.5 border border-[#1E2A2E]/15 rounded-lg text-xs font-semibold hover:bg-black/5" 
                onClick={() => triggerToast('Time picker opens here in the app.')}
              >
                9:00 PM
              </button>
            </div>
          </div>
        )}
        <div className="sec-note px-5 py-2.5 bg-[#1E2A2E]/2 border-t border-[#1E2A2E]/8 text-[11px] text-mid/50 leading-relaxed">
          A nudge, not a streak tracker. Missing a day changes nothing.
        </div>
      </div>

      <div className="card bg-white border border-[#1E2A2E]/8 rounded-xl mb-5 overflow-hidden">
        <div className="card-hd px-5 py-3 border-b border-[#1E2A2E]/8">
          <span className="card-lbl text-[10px] tracking-widest uppercase font-bold text-mid">Reports &amp; exercises</span>
        </div>
        <div className="row flex justify-between items-center px-5 py-4 gap-4 border-b border-[#1E2A2E]/8">
          <div className="row-l flex-1">
            <div className="row-lbl font-semibold text-[13.5px]">New report available</div>
            <div className="row-sub text-mid text-[11.5px] mt-0.5 leading-relaxed">Weekly reflections, monthly and annual reports. One notification per report — no follow-ups.</div>
          </div>
          <button 
            className={`toggle w-11 h-6 rounded-full relative transition-colors p-0.5 flex items-center ${reportReminder ? 'bg-[#8DBFB4] justify-end' : 'bg-[#1E2A2E]/15 justify-start'}`} 
            onClick={() => { setReportReminder(!reportReminder); triggerToast(reportReminder ? 'Report notifications off.' : 'Report notifications on.'); }}
          >
            <span className="toggle-k w-5 h-5 bg-white rounded-full shadow-md" />
          </button>
        </div>
        <div className="row flex justify-between items-center px-5 py-4 gap-4">
          <div className="row-l flex-1">
            <div className="row-lbl font-semibold text-[13.5px]">New exercise available</div>
            <div className="row-sub text-mid text-[11.5px] mt-0.5 leading-relaxed">"A new exercise is ready when you are." — fires when a new exercise is published.</div>
          </div>
          <button 
            className={`toggle w-11 h-6 rounded-full relative transition-colors p-0.5 flex items-center ${exerciseReminder ? 'bg-[#8DBFB4] justify-end' : 'bg-[#1E2A2E]/15 justify-start'}`} 
            onClick={() => { setExerciseReminder(!exerciseReminder); triggerToast(exerciseReminder ? 'Exercise notifications on.' : 'Exercise notifications off.'); }}
          >
            <span className="toggle-k w-5 h-5 bg-white rounded-full shadow-md" />
          </button>
        </div>
        <div className="sec-note px-5 py-2.5 bg-[#1E2A2E]/2 border-t border-[#1E2A2E]/8 text-[11px] text-mid/50 leading-relaxed">
          These are the only notifications we send.
        </div>
      </div>

      <div className="card bg-white border border-[#1E2A2E]/8 rounded-xl mb-5 overflow-hidden">
        <div className="card-hd px-5 py-3 border-b border-[#1E2A2E]/8">
          <span className="card-lbl text-[10px] tracking-widest uppercase font-bold text-mid">Billing alerts</span>
        </div>
        <div className="row flex justify-between items-center px-5 py-4 gap-4">
          <div className="row-l flex-1">
            <div className="row-lbl font-semibold text-[13.5px]">Payment &amp; renewal alerts</div>
            <div className="row-sub text-mid text-[11.5px] mt-0.5 leading-relaxed">Failed payments, grace period warnings, access lapses. Always on — can't be disabled.</div>
          </div>
          <div className="row-r flex items-center gap-2">
            <span className="text-[11px] text-mid">Always on</span>
            <button className="toggle w-11 h-6 rounded-full relative transition-colors p-0.5 flex items-center bg-[#8DBFB4] justify-end opacity-45 cursor-not-allowed" disabled>
              <span className="toggle-k w-5 h-5 bg-white rounded-full shadow-md" />
            </button>
          </div>
        </div>
        <div className="sec-note px-5 py-2.5 bg-[#1E2A2E]/2 border-t border-[#1E2A2E]/8 text-[11px] text-mid/50 leading-relaxed">
          Delivered via push and SMS to your registered phone number.
        </div>
      </div>
    </div>
  );

  // Calendar Integration Tab
  const renderCalendarIntegration = () => (
    <div className="pad animate-fadeUp">
      <p className="pg-ey">Integrations</p>
      <h1 className="pg-h font-serif text-3xl font-normal">Google Calendar</h1>
      <p className="pg-sub text-[13.5px] text-mid mb-8 max-w-[480px] leading-relaxed">
        Connect your Google Calendar to synchronize your telehealth sessions and check availability seamlessly.
      </p>

      <ClientCalendarIntegrationCard />
    </div>
  );

  // 3. Subscription Tab (Real dynamic state from database & Razorpay)
  const renderSubscription = () => {
    if (isBillingLoading) {
      return (
        <div className="pad animate-fadeUp">
          <p className="pg-ey">Billing</p>
          <h1 className="pg-h font-serif text-3xl font-normal">Subscription</h1>
          <div className="card bg-white border border-[#1E2A2E]/8 rounded-xl p-8 text-center text-mid text-sm mt-6">
            Loading your subscription details…
          </div>
        </div>
      );
    }

    const sub = billingData?.subscription;
    const isSubActive = sub && (sub.status === 'active' || sub.status === 'authenticated');

    return (
      <div className="pad animate-fadeUp">
        <p className="pg-ey">Billing</p>
        <h1 className="pg-h font-serif text-3xl font-normal">Subscription</h1>
        <p className="pg-sub text-[13.5px] text-mid mb-8 max-w-[480px]">Your current plan and renewal details.</p>

        {isSubActive ? (
          <div className="card bg-white border border-[#1E2A2E]/8 rounded-xl overflow-hidden mb-5">
            <div className="card-hd px-5 py-3 border-b border-[#1E2A2E]/8 flex items-center justify-between">
              <span className="card-lbl text-[10px] tracking-widest uppercase font-bold text-mid">Current plan</span>
              <span className="badge inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold text-[#1A5040] bg-[#8DBFB4]/15 border border-[#8DBFB4]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1A5040]" />
                {sub.cancel_at_period_end ? 'Cancelling at Period End' : 'Active'}
              </span>
            </div>
            <div className="sub-area px-5 py-5 border-b border-[#1E2A2E]/8 space-y-3">
              <div className="font-serif text-2xl font-normal text-primary">
                {sub.plan_name || 'Ingress Within Self-Work'}
              </div>
              <div className="text-[13px] text-mid">
                {sub.current_period_end ? (
                  sub.cancel_at_period_end ? (
                    `Access remains active until ${new Date(sub.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. You will not be charged again.`
                  ) : (
                    `Renews on ${new Date(sub.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · ₹499.00/month (GST inclusive)`
                  )
                ) : (
                  '₹499.00/month (GST inclusive · Taxable ₹422.88 + 18% GST ₹76.12)'
                )}
              </div>
              {billingData?.payment_methods?.[0] && (
                <div className="pt-2">
                  <div className="pm-chip inline-block px-3 py-1.5 rounded-lg bg-[#1E2A2E]/5 border border-[#1E2A2E]/10 text-xs font-medium text-primary">
                    {billingData.payment_methods[0].type.toUpperCase()} · {billingData.payment_methods[0].masked_account}
                  </div>
                </div>
              )}
            </div>
            <div className="row tap flex justify-between items-center px-5 py-3.5 border-b border-[#1E2A2E]/8 hover:bg-[#1E2A2E]/2 cursor-pointer transition-colors" onClick={() => handleTabSwitch('billing')}>
              <div className="row-l font-semibold text-[13.5px]">Billing history</div>
              <span className="chev text-mid/30 text-lg">›</span>
            </div>
            {sub.cancel_at_period_end ? (
              <div className="row flex justify-between items-center px-5 py-3.5 gap-4">
                <div className="row-l flex-1 min-w-0">
                  <div className="row-lbl font-semibold text-[13.5px] text-primary">Resume subscription</div>
                  <div className="row-sub text-mid text-[11.5px] mt-0.5 leading-relaxed">
                    Keep your practice uninterrupted after {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'this cycle'}.
                  </div>
                </div>
                <button
                  className="btn btn-dk px-4 py-2 bg-[#1E2A2E] text-white rounded-lg text-xs font-medium hover:bg-[#253338] transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  onClick={handleSubscribe}
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? (checkoutMsg || 'Connecting…') : 'Resubscribe (₹499/mo)'}
                </button>
              </div>
            ) : (
              <div className="row flex justify-between items-center px-5 py-3.5 gap-4">
                <div className="row-l">
                  <div className="row-lbl font-semibold text-[13.5px]">Cancel subscription</div>
                  <div className="row-sub text-mid text-[11.5px] mt-0.5 leading-relaxed">You'll keep access until the end of your billing period.</div>
                </div>
                <button className="btn-lnk-red text-xs font-bold text-[#8A3020] underline hover:text-[#b91c1c] bg-transparent border-none cursor-pointer" onClick={() => setIsCancelModalOpen(true)}>Cancel</button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="card bg-white border border-[#1E2A2E]/8 rounded-xl overflow-hidden mb-5">
              <div className="card-hd px-5 py-3 border-b border-[#1E2A2E]/8 flex items-center justify-between">
                <span className="card-lbl text-[10px] tracking-widest uppercase font-bold text-mid">Current status</span>
                <span className="badge inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold text-mid bg-[#1E2A2E]/6 border border-[#1E2A2E]/15">
                  {sub?.status === 'past_due' ? 'Payment Past Due' : sub ? 'Subscription Ended' : 'No active subscription'}
                </span>
              </div>
              <div className="sub-area px-5 py-4 border-b-0">
                <div className="text-[13px] text-mid leading-relaxed">
                  {sub?.status === 'past_due'
                    ? 'Your latest renewal payment could not be processed. Update your payment method or resubscribe below to keep your self-work active.'
                    : sub
                    ? 'Your subscription has ended. Everything you have written remains safely preserved in reflective read-only mode. Subscribe below to continue your practice.'
                    : 'You do not currently have an active membership. Subscribe below to unlock daily self-work journaling, weekly pattern reports, and therapeutic exercises.'}
                </div>
              </div>
            </div>

            <div className="price-card bg-[#1E2A2E] text-white rounded-xl p-6 mb-4 relative overflow-hidden">
              <div className="price-ey inline-block bg-[#8DBFB4]/15 border border-[#8DBFB4]/25 px-3 py-1 rounded-full text-[10px] font-bold text-[#8DBFB4] uppercase tracking-wider mb-3.5">
                Ingress Within Self-Work
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="price-amt font-serif text-3xl font-semibold text-[#E0A898]">₹499</span>
                <span className="text-xs text-[#A8D4CE] font-mono">/ month</span>
              </div>
              <div className="text-xs text-[#A8D4CE]/80 mb-3">
                GST Inclusive · ₹499.00 total (Taxable ₹422.88 + 18% GST ₹76.12)
              </div>
              <div className="price-desc text-[13px] text-[#A8D4CE]/70 leading-relaxed mb-4.5">
                Unlimited daily guided and free-flow journaling, weekly pattern reports, 30-day synthesis, and therapeutic self-work exercises. Cancel anytime.
              </div>
              <div className="price-feats mb-5 flex flex-col gap-2">
                <div className="price-feat text-[13.5px] flex gap-2 leading-relaxed text-[#D8ECEA]">
                  <span className="text-[#8DBFB4] text-[11px] mt-0.5">✦</span> Unlimited daily entries &amp; AI mirror reflection
                </div>
                <div className="price-feat text-[13.5px] flex gap-2 leading-relaxed text-[#D8ECEA]">
                  <span className="text-[#8DBFB4] text-[11px] mt-0.5">✦</span> Longitudinal pattern engine (4-state lifecycle)
                </div>
                <div className="price-feat text-[13.5px] flex gap-2 leading-relaxed text-[#D8ECEA]">
                  <span className="text-[#8DBFB4] text-[11px] mt-0.5">✦</span> Integrated self-reflection &amp; therapeutic exercises
                </div>
                <div className="price-feat text-[13.5px] flex gap-2 leading-relaxed text-[#D8ECEA]">
                  <span className="text-[#8DBFB4] text-[11px] mt-0.5">✦</span> Weekly summary, monthly and annual reports
                </div>
              </div>
              <button
                className="btn btn-terra w-full py-3 bg-[#E0A898] text-[#1E2A2E] rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm"
                onClick={handleSubscribe}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? (checkoutMsg || 'Opening gateway…') : sub ? 'Resubscribe · ₹499/month (GST Inclusive)' : 'Subscribe · ₹499/month (GST Inclusive)'}
              </button>
              <p className="text-[11px] text-[#A8D4CE]/60 text-center leading-relaxed mt-2.5">
                Billed monthly via Razorpay · Recurring mandate per RBI guidelines · Cancel any time
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 4. Billing History Tab (Real dynamic invoices from database)
  const renderBilling = () => {
    const invoices = billingData?.invoices || [];

    return (
      <div className="pad animate-fadeUp">
        <p className="pg-ey">Billing</p>
        <h1 className="pg-h font-serif text-3xl font-normal">Billing history</h1>
        <p className="pg-sub text-[13.5px] text-mid mb-8 max-w-[480px]">
          All charges in reverse chronological order. GST inclusive. Processed via Razorpay.
        </p>

        <div className="card bg-white border border-[#1E2A2E]/8 rounded-xl overflow-hidden mb-5">
          <div className="card-hd px-5 py-3 border-b border-[#1E2A2E]/8 flex items-center justify-between">
            <span className="card-lbl text-[10px] tracking-widest uppercase font-bold text-mid">Charges</span>
          </div>

          {isBillingLoading ? (
            <div className="p-8 text-center text-xs text-mid">Loading billing history…</div>
          ) : invoices.length > 0 ? (
            invoices.map((inv) => (
              <div key={inv.id || inv.invoice_number} className="bill-row flex items-start justify-between p-5 border-b border-[#1E2A2E]/8 gap-4 last:border-b-0">
                <div className="bill-l flex-1">
                  <div className="bill-month text-[10px] tracking-wider uppercase font-bold text-mid/60 mb-0.5">
                    {new Date(inv.issued_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </div>
                  <div className="bill-desc text-[13.5px] font-semibold text-primary">Ingress Within Self-Work (Monthly)</div>
                  <div className="bill-detail text-[12px] text-mid mt-0.5">
                    {new Date(inv.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · Invoice {inv.invoice_number}
                  </div>
                  <div className="text-[11px] text-mid/70 mt-0.5">
                    Taxable: ₹{(inv.amount_subtotal / 100).toFixed(2)} + 18% GST: ₹{(inv.amount_gst / 100).toFixed(2)}
                  </div>
                  <div className="bill-status bs-paid text-[12px] font-semibold text-[#1A5040] mt-1 capitalize">
                    {inv.status}
                  </div>
                </div>
                <div className="bill-r text-right">
                  <div className="font-bold text-[14.5px]">₹{(inv.amount_total / 100).toFixed(2)}</div>
                  <div className="text-[10px] text-mid/60 uppercase">GST Included</div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-primary">No invoices yet</p>
              <p className="text-xs text-mid max-w-sm mx-auto leading-relaxed">
                When your monthly subscription is processed or you purchase modules, your verified tax invoices will appear here.
              </p>
            </div>
          )}

          <div className="sec-note px-5 py-2.5 bg-[#1E2A2E]/2 border-t border-[#1E2A2E]/8 text-[11px] text-mid/50 leading-relaxed">
            All amounts include 18% GST. Contact hello@ingresswithin.com for invoice queries.
          </div>
        </div>
      </div>
    );
  };

  // 5. Payment Method Tab (Real dynamic payment method)
  const renderPayment = () => {
    const paymentMethods = billingData?.payment_methods || [];

    return (
      <div className="pad animate-fadeUp">
        <p className="pg-ey">Billing</p>
        <h1 className="pg-h font-serif text-3xl font-normal">Payment method</h1>
        <p className="pg-sub text-[13.5px] text-mid mb-8 max-w-[480px]">
          Your saved method for monthly renewals. Updating takes effect from the next billing cycle.
        </p>

        <div className="card bg-white border border-[#1E2A2E]/8 rounded-xl overflow-hidden mb-5">
          <div className="card-hd px-5 py-3 border-b border-[#1E2A2E]/8">
            <span className="card-lbl text-[10px] tracking-widest uppercase font-bold text-mid">Current method</span>
          </div>

          {isBillingLoading ? (
            <div className="p-8 text-center text-xs text-mid">Loading payment methods…</div>
          ) : paymentMethods.length > 0 ? (
            paymentMethods.map((pm) => (
              <div key={pm.id} className="row flex justify-between items-center px-5 py-4 gap-4 border-b border-[#1E2A2E]/8 last:border-b-0">
                <div className="row-l">
                  <div className="row-lbl font-semibold text-[13.5px]">{pm.type.toUpperCase()}</div>
                  <div className="row-val text-mid text-[12.5px] mt-0.5">{pm.masked_account}</div>
                </div>
                <div className="pm-chip px-3 py-1.5 rounded-lg bg-[#1E2A2E]/5 border border-[#1E2A2E]/10 text-xs font-semibold text-primary shrink-0">
                  {pm.mandate_status === 'active' ? 'Active Mandate' : pm.type.toUpperCase()}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center space-y-2 border-b border-[#1E2A2E]/8">
              <p className="text-sm font-semibold text-primary">No saved payment method</p>
              <p className="text-xs text-mid max-w-sm mx-auto leading-relaxed">
                A secure recurring payment method will be linked automatically upon completing your first subscription payment.
              </p>
            </div>
          )}
        </div>

        <div className="card bg-white border border-[#1E2A2E]/8 rounded-xl mb-5 overflow-hidden">
          <div className="card-hd px-5 py-3 border-b border-[#1E2A2E]/8">
            <span className="card-lbl text-[10px] tracking-widest uppercase font-bold text-mid">Accepted methods</span>
          </div>
          <div className="row flex justify-between items-center px-5 py-3.5 border-b border-[#1E2A2E]/8">
            <div className="row-l">
              <div className="row-lbl font-semibold text-[13.5px]">UPI Autopay</div>
              <div className="row-sub text-mid text-[11.5px] mt-0.5">Supports recurring mandate per RBI guidelines. Recommended.</div>
            </div>
          </div>
          <div className="row flex justify-between items-center px-5 py-3.5 border-b border-[#1E2A2E]/8">
            <div className="row-l">
              <div className="row-lbl font-semibold text-[13.5px]">Debit / Credit Card</div>
              <div className="row-sub text-mid text-[11.5px] mt-0.5">Visa, Mastercard, RuPay. Recurring mandate supported.</div>
            </div>
          </div>
          <div className="row flex justify-between items-center px-5 py-3.5 border-b-0">
            <div className="row-l">
              <div className="row-lbl font-semibold text-[13.5px]">Net Banking</div>
              <div className="row-sub text-mid text-[11.5px] mt-0.5">Selected major Indian banks via Razorpay gateway.</div>
            </div>
          </div>
          <div className="sec-note px-5 py-2.5 bg-[#1E2A2E]/2 border-t border-[#1E2A2E]/8 text-[11px] text-mid/50 leading-relaxed">
            Recurring mandate setup follows RBI guidelines. All processing handled securely by Razorpay.
          </div>
        </div>
      </div>
    );
  };

  // 6. How It Works Tab
  const renderHowItWorks = () => (
    <div className="pad animate-fadeUp">
      <p className="pg-ey">About</p>
      <h1 className="pg-h font-serif text-3xl font-normal">How it works</h1>
      <p className="pg-sub text-[13.5px] text-mid mb-8 max-w-[480px]">
        What you do, what the AI does, and what it pays attention to across your entries.
      </p>

      <div className="card bg-white border border-[#1E2A2E]/8 rounded-xl overflow-hidden mb-5">
        <div className="how-blk p-5 border-b border-[#1E2A2E]/8">
          <div className="how-ttl font-serif text-lg text-primary mb-2">What you do</div>
          <div className="how-body text-mid text-[13.5px] leading-relaxed space-y-2">
            <p>Each day, you write. There are no prompts unless you want them. An entry can be a few lines or several paragraphs.</p>
            <p>Some weeks, you'll be offered a structured exercise — a short, focused writing task. It's optional.</p>
          </div>
        </div>
        <div className="how-blk p-5 border-b border-[#1E2A2E]/8">
          <div className="how-ttl font-serif text-lg text-primary mb-2">What the AI does</div>
          <div className="how-body text-mid text-[13.5px] leading-relaxed space-y-2">
            <p>After each entry, you receive a reflection. Once a week, a deeper reflection across your recent entries. Once a month, a report. Once a year, an annual report.</p>
            <p>It doesn't compare you to other users. It doesn't score you. It doesn't track streaks.</p>
          </div>
        </div>
        <div className="how-blk p-5 border-b border-[#1E2A2E]/8">
          <div className="how-ttl font-serif text-lg text-primary mb-2">What it tracks</div>
          <div className="how-body text-mid text-[13.5px] leading-relaxed space-y-3">
            <p>The AI pays attention to four things across your entries.</p>
            <div className="dim-list flex flex-col mt-3 border-t border-[#1E2A2E]/5">
              
              <div className="dim-row flex gap-3.5 py-3 border-b border-[#1E2A2E]/5">
                <div className="dim-bar w-1 rounded-full bg-[#E0A898] self-stretch" />
                <div>
                  <div className="dim-name font-bold text-primary text-[13px]">Emotional intensity</div>
                  <div className="dim-desc text-mid text-[12px] mt-0.5 leading-relaxed">How much charge — positive or negative — your entries carry over time.</div>
                </div>
              </div>

              <div className="dim-row flex gap-3.5 py-3 border-b border-[#1E2A2E]/5">
                <div className="dim-bar w-1 rounded-full bg-[#8DBFB4] self-stretch" />
                <div>
                  <div className="dim-name font-bold text-primary text-[13px]">Pattern flexibility</div>
                  <div className="dim-desc text-mid text-[12px] mt-0.5 leading-relaxed">Whether the same themes keep appearing in the same way, or whether they shift.</div>
                </div>
              </div>

              <div className="dim-row flex gap-3.5 py-3 border-b border-[#1E2A2E]/5">
                <div className="dim-bar w-1 rounded-full bg-[#B8A8D4] self-stretch" />
                <div>
                  <div className="dim-name font-bold text-primary text-[13px]">Sense of agency</div>
                  <div className="dim-desc text-mid text-[12px] mt-0.5 leading-relaxed">How often you write about things happening to you versus things you're deciding.</div>
                </div>
              </div>

              <div className="dim-row flex gap-3.5 py-3 border-b-0">
                <div className="dim-bar w-1 rounded-full bg-[#A8D4CE] self-stretch" />
                <div>
                  <div className="dim-name font-bold text-primary text-[13px]">Direction of change</div>
                  <div className="dim-desc text-mid text-[12px] mt-0.5 leading-relaxed">Whether what you're describing feels like it's moving, and which way.</div>
                </div>
              </div>

            </div>
            <p className="mt-3 text-[12.5px] italic text-mid/70 leading-relaxed">These aren't scores. They don't appear as numbers. They show up as plain observations in your reflections and reports.</p>
          </div>
        </div>
        <div className="how-blk p-5 border-b-0">
          <div className="how-ttl font-serif text-lg text-primary mb-2">What it doesn't do</div>
          <div className="how-body text-mid text-[13.5px] leading-relaxed space-y-2">
            <p>It doesn't give advice. It doesn't diagnose anything. It doesn't tell you what to do next.</p>
            <p>If something in a reflection doesn't match your experience, ignore it. The writing is yours. The observations are one reading of it.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // 7. Your Data & AI Tab
  const renderYourDataAndAi = () => (
    <div className="pad animate-fadeUp">
      <p className="pg-ey">About</p>
      <h1 className="pg-h font-serif text-3xl font-normal">Your data &amp; AI</h1>
      <p className="pg-sub text-[13.5px] text-mid mb-8 max-w-[480px]">
        Three hard promises — and the full detail of what happens to your writing.
      </p>

      {/* Promise cards */}
      <div className="card bg-[#1E2A2E] border-none rounded-xl overflow-hidden mb-5">
        <div style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', gap: '14px', paddingBottom: '16px', borderBottom: '1px solid rgba(141,191,180,0.1)' }}>
            <div style={{ fontFamily: 'var(--ff)', fontSize: '20px', fontWeight: '600', color: 'var(--terra)', width: '28px', flexShrink: 0 }}>01</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--body-dk)', marginBottom: '3px' }}>No human ever reads your entries</div>
              <div style={{ fontSize: '12px', color: 'rgba(168, 212, 206, 0.48)', lineHeight: '1.6' }}>Not us, not support staff, not anyone. Processing is entirely automated.</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', paddingBottom: '16px', borderBottom: '1px solid rgba(141,191,180,0.1)' }}>
            <div style={{ fontFamily: 'var(--ff)', fontSize: '20px', fontWeight: '600', color: 'var(--terra)', width: '28px', flexShrink: 0 }}>02</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--body-dk)', marginBottom: '3px' }}>We never sell your data</div>
              <div style={{ fontSize: '12px', color: 'rgba(168, 212, 206, 0.48)', lineHeight: '1.6' }}>We do not run ads, monetize user profiles, or license data to third parties.</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px' }}>
            <div style={{ fontFamily: 'var(--ff)', fontSize: '20px', fontWeight: '600', color: 'var(--terra)', width: '28px', flexShrink: 0 }}>03</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--body-dk)', marginBottom: '3px' }}>You can delete everything instantly</div>
              <div style={{ fontSize: '12px', color: 'rgba(168, 212, 206, 0.48)', lineHeight: '1.6' }}>Deleting your account wipes all records permanently. No trace remains.</div>
            </div>
          </div>

        </div>
      </div>

      <div className="card bg-white border border-[#1E2A2E]/8 rounded-xl overflow-hidden mb-5">
        <div className="how-blk p-5 border-b border-[#1E2A2E]/8">
          <div className="how-ttl font-serif text-lg text-primary mb-2">Where is my data stored?</div>
          <div className="how-body text-mid text-[13.5px] leading-relaxed">
            All database tables and application servers are hosted securely within Supabase's isolated cloud infrastructure in Mumbai, India. We do not export your journal data outside this secure perimeter.
          </div>
        </div>
        <div className="how-blk p-5 border-b-0">
          <div className="how-ttl font-serif text-lg text-primary mb-2">How is my writing processed by the LLM?</div>
          <div className="how-body text-mid text-[13.5px] leading-relaxed space-y-2">
            <p>We use Claude (Anthropic) to generate reflections and reports. When an entry is sent, it goes via Anthropic's private commercial API.</p>
            <p>Our agreement ensures that **none of your entries or data are used to train Anthropic's models**. Your data is deleted from Anthropic's systems within 30 days of processing.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // 8. Privacy Policy Tab
  const renderPrivacyPolicy = () => (
    <div className="pad animate-fadeUp">
      <p className="pg-ey">About</p>
      <h1 className="pg-h font-serif text-3xl font-normal">Privacy policy</h1>
      <p className="pg-sub text-[13.5px] text-mid mb-8 max-w-[480px]">Last updated: 14 January 2025</p>

      <div className="card bg-white border border-[#1E2A2E]/8 rounded-xl overflow-hidden mb-5 p-6">
        <div className="how-body text-mid text-[13.5px] leading-relaxed space-y-4">
          <p>This Privacy Policy describes how Ingress Within collects, uses, and discloses your information when you write in our application portal.</p>
          
          <h3 className="font-serif text-md text-primary font-semibold pt-2">1. Information We Collect</h3>
          <p>We collect only the information necessary to provide the service: your phone number for passwordless authentication, consent timestamps, and the journal entries you submit. We do not collect cookies for tracking or advertising.</p>
          
          <h3 className="font-serif text-md text-primary font-semibold pt-2">2. How We Use Information</h3>
          <p>We process your entries to generate personalized reports, writing patterns, and reflections. We do not license, share, or analyze your entries for any other purpose.</p>
          
          <h3 className="font-serif text-md text-primary font-semibold pt-2">3. Data Security</h3>
          <p>Your data is protected with TLS encryption in transit and AES-256 encryption at rest. Revocable session JWTs secure API route requests.</p>
          
          <h3 className="font-serif text-md text-primary font-semibold pt-2">4. Your Rights</h3>
          <p>You have the absolute right to inspect your records, download a complete backup, or permanently delete your account at any time from this Settings panel.</p>
        </div>
      </div>
    </div>
  );

  // 9. Delete Account Tab
  const renderDeleteAccount = () => (
    <div className="pad animate-fadeUp">
      <p className="pg-ey">Session</p>
      <h1 className="pg-h font-serif text-3xl font-normal">Delete account</h1>
      <p className="pg-sub text-[13.5px] text-mid mb-8 max-w-[480px]">
        Permanently wipe all profile details, journal entries, and account records.
      </p>

      {/* STEP 1: warning & backup */}
      {deleteStep === 1 && (
        <div id="del1" className="animate-fadeUp">
          <div className="card bg-white border border-[#1E2A2E]/8 rounded-xl overflow-hidden">
            <div className="card-hd px-5 py-3 border-b border-[#1E2A2E]/8">
              <span className="card-lbl text-[10px] tracking-widest uppercase font-bold text-mid">Permanently delete your account</span>
            </div>
            <div className="danger-area p-5">
              <div className="danger-h font-serif text-lg text-primary font-semibold mb-2">Deleting your account removes everything.</div>
              <div className="danger-body text-mid text-[13.5px] leading-relaxed mb-4 space-y-2">
                <p>Your entries, your reflections, your reports. <strong className="text-primary font-bold">This can't be undone.</strong></p>
                <p>If you'd like a copy of your data first, we can send a download link to your phone number. It will arrive within 7 days. Your data is available for 30 days after deletion. After that it's gone.</p>
                <p>If the link doesn't arrive, contact us at <strong className="text-primary font-bold">hello@ingresswithin.com</strong>.</p>
              </div>
              <div className="flex flex-col gap-2.5">
                <button className="btn btn-ol w-full py-3 border border-[#1E2A2E]/15 rounded-lg text-xs font-semibold hover:bg-black/5" id="dl-btn" onClick={handleRequestDownload} disabled={dlRequested}>
                  {dlRequested ? 'Download link requested' : 'Send me a download link'}
                </button>
                {dlRequested && (
                  <p className="fhint text-center text-xs text-[#1A5040] font-semibold" id="dl-conf">
                    Download link requested. We'll send it to {phoneDisplay} within 7 days.
                  </p>
                )}
                <button className="btn btn-red-ol w-full py-3 border border-[#E0A898]/40 text-[#8A3020] hover:bg-[#E0A898]/7 rounded-lg text-xs font-semibold" onClick={() => handleGoToDeleteStep(2)}>
                  {isSendingDeleteOtp ? 'Preparing Deletion...' : 'Continue to deletion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: OTP Confirm */}
      {deleteStep === 2 && (
        <div id="del2" className="animate-fadeUp">
          <div className="alert alert-warn flex gap-3 p-4 rounded-xl border border-[#E0A898]/24 bg-[#E0A898]/9 text-[#8A3020] text-[13px] leading-relaxed mb-5">
            <div className="alert-bar ab-warn w-1.5 self-stretch bg-[#E0A898] rounded-full shrink-0" />
            <div>
              <strong>Last chance.</strong> Confirming below deletes your account permanently. No backup is possible.
            </div>
          </div>
          <div className="card bg-white border border-[#1E2A2E]/8 rounded-xl overflow-hidden">
            <div className="card-hd px-5 py-3 border-b border-[#1E2A2E]/8">
              <span className="card-lbl text-[10px] tracking-widest uppercase font-bold text-mid">Enter Verification Code</span>
            </div>
            <div className="danger-area p-5 space-y-4">
              <div className="danger-body text-mid text-[13.5px] leading-relaxed">
                We have sent a 6-digit confirmation code to your phone <strong className="text-primary font-semibold">{phoneDisplay}</strong>. Please enter it below to authorize this permanent action.
              </div>

              {deleteError && (
                <div className="text-[#8A3020] font-semibold text-[11px] bg-red-100/50 p-2.5 rounded border border-[#8A3020]/10">
                  {deleteError}
                </div>
              )}

              <div className="otp-area pt-2">
                <div className="otp-boxes flex gap-2 mb-4 justify-start">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <input 
                      key={idx}
                      className={`otp-box w-10 h-12 border border-[#1E2A2E]/15 rounded-lg text-center font-serif text-lg font-semibold bg-white outline-none focus:border-[#E0A898] ${deleteOtp[idx] ? 'ok border-[#8A3020]/30 bg-red-50/20' : ''}`} 
                      maxLength={1} 
                      inputMode="numeric"
                      value={deleteOtp[idx]}
                      onChange={(e) => handleDeleteOtpInput(idx, e.target.value)}
                      onKeyDown={(e) => handleDeleteOtpKeyDown(idx, e)}
                      ref={(el) => (deleteOtpRefs.current[idx] = el)}
                    />
                  ))}
                </div>
                
                <div className="flex flex-col gap-2.5">
                  <button 
                    className="btn btn-red w-full py-3 bg-[#B33A2A] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#922E21] disabled:opacity-40" 
                    id="del-btn" 
                    onClick={handleConfirmDelete}
                    disabled={isDeleting || deleteOtp.join('').length !== 6}
                  >
                    {isDeleting ? 'Deleting...' : 'Permanently delete my account'}
                  </button>
                  <div className="flex justify-between items-center mt-1">
                    <button className="btn btn-ol py-2 px-4 border border-[#1E2A2E]/15 rounded-lg text-xs font-semibold hover:bg-black/5" onClick={() => handleGoToDeleteStep(1)}>
                      ← Back
                    </button>
                    {deleteCooldown > 0 ? (
                      <span className="text-xs text-mid">Resend code ({deleteCooldown}s)</span>
                    ) : (
                      <button className="text-xs font-bold text-secondary hover:underline bg-transparent border-none cursor-pointer" onClick={() => handleGoToDeleteStep(2)}>
                        Resend code
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Deleted Confirmation */}
      {deleteStep === 3 && (
        <div id="del3" className="animate-fadeUp">
          <div className="card bg-white border border-[#1E2A2E]/8 rounded-xl overflow-hidden">
            <div style={{ padding: '44px 28px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--ff)', fontSize: '21px', color: 'var(--dark)', marginBottom: '11px', fontWeight: '400' }}>Your account has been deleted.</div>
              <div style={{ fontSize: '14px', color: 'var(--body-lt)', lineHeight: '1.75', marginBottom: '26px' }}>
                Your data has been completely wiped from our records.
                {dlRequested && <span id="del3-dl"> Your download link will arrive via SMS within 7 days.</span>}
                <br />If you have any questions, contact hello@ingresswithin.com.
              </div>
              <button className="btn btn-ol px-6 py-2 border border-[#1E2A2E]/15 rounded-lg text-xs font-semibold hover:bg-black/5" onClick={() => window.location.href = '/auth'}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F3F2] text-[#1E2A2E] font-sans relative flex flex-col overflow-hidden h-screen select-none">
      
      {/* CSS Stylesheet Embed (Matches references HTML completely) */}
      <style>{`
        :root {
          --dark: #011627;
          --light: #F6F1EA;
          --terra: #795663;
          --sage: #8AA688;
          --iris: #D9BCAF;
          --body-dk: #011627;
          --muted-dk: #4F635E;
          --body-lt: #4F635E;
          --logo: #283D38;
          --terra-deep: #533842;
          --iris-deep: #795663;
          --sage-deep: #283D38;
          --border: rgba(40,61,56,0.09);
          --border-md: rgba(40,61,56,0.15);
          --bg: #F6F1EA;
          --surface: #FDFBF8;
          --fs: var(--font-ui, 'Instrument Sans', system-ui, sans-serif);
          --ff: var(--font-reflective, 'Lora', 'Georgia', serif);
        }

        /* Topbar and layout wrapper */
        .settings-topbar {
          height: 56px;
          background: rgba(246, 241, 234, 0.96);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(40, 61, 56, 0.09);
        }
        .settings-layout {
          height: calc(100vh - 56px);
        }

        /* Sidebar transitions */
        .sidebar {
          transition: left 0.25s ease;
        }
        
        .sb-btn.on {
          color: var(--dark);
          font-weight: 600;
          background: rgba(121, 86, 99, 0.08);
          border-left-color: var(--terra);
        }
        .sb-btn.danger {
          color: var(--terra-deep);
        }
        .sb-btn.danger:hover {
          background: rgba(121, 86, 99, 0.07);
        }
        .sb-btn.danger.on {
          background: rgba(121, 86, 99, 0.09);
          border-left-color: var(--terra);
        }

        /* Content spacing */
        .pad {
          max-width: 600px;
          padding: 40px 44px 80px;
          animation: fadeUp 0.3s ease both;
        }

        /* Edit panel transitions */
        .ep {
          max-height: 0;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          overflow: hidden;
          opacity: 0;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ep.open {
          max-height: 300px;
          padding-top: 14px !important;
          padding-bottom: 14px !important;
          opacity: 1;
        }

        /* Animations */
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media(max-width: 760px) {
          .sidebar-mobile {
            position: fixed;
            top: 56px;
            left: -210px;
            z-index: 190;
            height: calc(100vh - 56px);
            transition: left 0.25s ease;
          }
          .sidebar-mobile.open {
            left: 0;
            box-shadow: 4px 0 24px rgba(30, 42, 46, 0.12);
          }
          .sb-overlay {
            position: fixed;
            inset: 0;
            top: 56px;
            background: rgba(30, 42, 46, 0.28);
            z-index: 189;
          }
          .pad {
            padding: 28px 18px 60px;
          }
        }
      `}</style>

      {/* TOPBAR */}
      <header className="settings-topbar w-full flex items-center justify-between px-6 z-[200] shrink-0">
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden text-lg p-1 hover:bg-[#1E2A2E]/5 rounded text-primary leading-none cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => window.navigateTo('/dashboard')}>
            <img 
              src="/logo-mark-transparent.png" 
              alt="Ingress Within" 
              className="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-105 shrink-0" 
            />
            <span className="text-[13px] font-semibold tracking-tight text-primary">
              ingress <em className="text-[#2E7A70] font-serif not-italic font-normal">within</em>
            </span>
          </div>
          <div className="w-[1px] h-[18px] bg-[#1E2A2E]/15 shrink-0" />
          <span className="text-[13px] font-semibold text-primary">Settings</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            className="text-[13px] text-[#4A6A64] hover:text-primary transition-colors cursor-pointer font-sans border-none bg-transparent" 
            onClick={() => window.navigateTo('/dashboard')}
          >
            ← Dashboard
          </button>
          <div className="avatar w-[30px] h-[30px] rounded-full bg-[#1E2A2E] text-[#D8ECEA] text-xs font-semibold flex items-center justify-center shrink-0">
            {displayName.trim()[0]?.toUpperCase() || 'A'}
          </div>
        </div>
      </header>

      {/* MOBILE SIDEBAR OVERLAY */}
      {mobileMenuOpen && (
        <div className="sb-overlay md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* LAYOUT CONTAINER */}
      <div className="settings-layout w-full flex flex-1 overflow-hidden relative">
        
        {/* SIDEBAR NAVIGATION */}
        <nav className={`sidebar sidebar-mobile md:block w-[210px] shrink-0 h-full bg-white border-r border-[#1E2A2E]/8 overflow-y-auto py-3 pb-10 ${mobileMenuOpen ? 'open' : ''}`}>
          <span className="sb-group-label text-[10px] tracking-wider uppercase font-bold text-[#4A6A64]/38 px-[18px] py-3.5 pb-1 block">Account</span>
          <button className={`sb-btn w-full text-left py-2 px-[18px] font-sans text-[13px] font-medium border-l-[3px] border-transparent transition-colors hover:text-primary hover:bg-[#1E2A2E]/3 cursor-pointer ${activeTab === 'profile' ? 'on' : 'text-[#4A6A64]'}`} onClick={() => handleTabSwitch('profile')}>Profile</button>
          <button className={`sb-btn w-full text-left py-2 px-[18px] font-sans text-[13px] font-medium border-l-[3px] border-transparent transition-colors hover:text-primary hover:bg-[#1E2A2E]/3 cursor-pointer ${activeTab === 'notifications' ? 'on' : 'text-[#4A6A64]'}`} onClick={() => handleTabSwitch('notifications')}>Notifications</button>
          <button className={`sb-btn w-full text-left py-2 px-[18px] font-sans text-[13px] font-medium border-l-[3px] border-transparent transition-colors hover:text-primary hover:bg-[#1E2A2E]/3 cursor-pointer ${activeTab === 'calendar' ? 'on' : 'text-[#4A6A64]'}`} onClick={() => handleTabSwitch('calendar')}>Google Calendar</button>
          
          <div className="h-[1px] bg-[#1E2A2E]/8 my-2 mx-3" />
          
          <span className="sb-group-label text-[10px] tracking-wider uppercase font-bold text-[#4A6A64]/38 px-[18px] py-3.5 pb-1 block">Billing</span>
          <button className={`sb-btn w-full text-left py-2 px-[18px] font-sans text-[13px] font-medium border-l-[3px] border-transparent transition-colors hover:text-primary hover:bg-[#1E2A2E]/3 cursor-pointer ${activeTab === 'subscription' ? 'on' : 'text-[#4A6A64]'}`} onClick={() => handleTabSwitch('subscription')}>Subscription</button>
          <button className={`sb-btn w-full text-left py-2 px-[18px] font-sans text-[13px] font-medium border-l-[3px] border-transparent transition-colors hover:text-primary hover:bg-[#1E2A2E]/3 cursor-pointer ${activeTab === 'billing' ? 'on' : 'text-[#4A6A64]'}`} onClick={() => handleTabSwitch('billing')}>Billing history</button>
          <button className={`sb-btn w-full text-left py-2 px-[18px] font-sans text-[13px] font-medium border-l-[3px] border-transparent transition-colors hover:text-primary hover:bg-[#1E2A2E]/3 cursor-pointer ${activeTab === 'payment' ? 'on' : 'text-[#4A6A64]'}`} onClick={() => handleTabSwitch('payment')}>Payment method</button>
          
          <div className="h-[1px] bg-[#1E2A2E]/8 my-2 mx-3" />
          
          <span className="sb-group-label text-[10px] tracking-wider uppercase font-bold text-[#4A6A64]/38 px-[18px] py-3.5 pb-1 block">About</span>
          <button className={`sb-btn w-full text-left py-2 px-[18px] font-sans text-[13px] font-medium border-l-[3px] border-transparent transition-colors hover:text-primary hover:bg-[#1E2A2E]/3 cursor-pointer ${activeTab === 'how' ? 'on' : 'text-[#4A6A64]'}`} onClick={() => handleTabSwitch('how')}>How it works</button>
          <button className={`sb-btn w-full text-left py-2 px-[18px] font-sans text-[13px] font-medium border-l-[3px] border-transparent transition-colors hover:text-primary hover:bg-[#1E2A2E]/3 cursor-pointer ${activeTab === 'ai' ? 'on' : 'text-[#4A6A64]'}`} onClick={() => handleTabSwitch('ai')}>Your data &amp; AI</button>
          <button className={`sb-btn w-full text-left py-2 px-[18px] font-sans text-[13px] font-medium border-l-[3px] border-transparent transition-colors hover:text-primary hover:bg-[#1E2A2E]/3 cursor-pointer ${activeTab === 'privacy' ? 'on' : 'text-[#4A6A64]'}`} onClick={() => handleTabSwitch('privacy')}>Privacy policy</button>
          
          <div className="h-[1px] bg-[#1E2A2E]/8 my-2 mx-3" />
          
          <span className="sb-group-label text-[10px] tracking-wider uppercase font-bold text-[#4A6A64]/38 px-[18px] py-3.5 pb-1 block">Session</span>
          <button className="sb-btn w-full text-left py-2 px-[18px] font-sans text-[13px] font-medium transition-colors hover:text-primary hover:bg-[#1E2A2E]/3 text-[#4A6A64] cursor-pointer" onClick={() => handleTabSwitch('logout')}>Log out</button>
          <button className={`sb-btn danger w-full text-left py-2 px-[18px] font-sans text-[13px] font-medium border-l-[3px] border-transparent transition-colors hover:bg-[#E0A898]/7 cursor-pointer ${activeTab === 'delete' ? 'on text-[#8A3020] border-l-[#E0A898]' : 'text-[#8A3020]'}`} onClick={() => handleTabSwitch('delete')}>Delete account</button>
        </nav>

        {/* CONTENT PANEL */}
        <div className="content flex-1 overflow-y-auto h-full" id="content-panel">
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'notifications' && renderNotifications()}
          {activeTab === 'calendar' && renderCalendarIntegration()}
          {activeTab === 'subscription' && renderSubscription()}
          {activeTab === 'billing' && renderBilling()}
          {activeTab === 'payment' && renderPayment()}
          {activeTab === 'how' && renderHowItWorks()}
          {activeTab === 'ai' && renderYourDataAndAi()}
          {activeTab === 'privacy' && renderPrivacyPolicy()}
          {activeTab === 'delete' && renderDeleteAccount()}
        </div>

      </div>

      {/* TOAST NOTIFICATION PILL */}
      <div className={`toast fixed bottom-7 left-1/2 -translate-x-1/2 bg-[#1E2A2E] text-[#D8ECEA] px-5 py-2.5 rounded-full text-[13px] font-medium shadow-xl z-[600] pointer-events-none transition-all duration-300 ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
        {toastMessage}
      </div>

      {/* MODALS */}
      
      {/* Dynamic Cancel Subscription Modal */}
      {isCancelModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-[#1E2A2E]/40 backdrop-blur-[6px] z-[500] flex items-center justify-center p-5" onClick={() => !isCancelling && setIsCancelModalOpen(false)}>
          <div className="modal bg-white rounded-2xl p-7 max-w-[400px] w-full shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-ttl font-serif text-xl font-normal text-primary mb-2.5 leading-snug">Cancel your subscription?</h2>
            <p className="modal-body text-[13.5px] text-mid mb-5.5 leading-relaxed">
              Your access will remain active until <strong>{billingData?.subscription?.current_period_end ? new Date(billingData.subscription.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'the end of your current billing period'}</strong>. After that, your subscription will not renew and you won't be charged again.
            </p>
            <div className="modal-acts flex flex-col gap-2">
              <button 
                className="btn btn-red-ol py-3 w-full border border-[#E0A898]/40 text-[#8A3020] hover:bg-[#E0A898]/7 rounded-lg text-xs font-semibold disabled:opacity-50" 
                disabled={isCancelling}
                onClick={handleConfirmCancel}
              >
                {isCancelling ? 'Cancelling…' : 'Yes, cancel my subscription'}
              </button>
              <button 
                className="btn btn-ol py-3 w-full border border-[#1E2A2E]/15 rounded-lg text-xs font-semibold hover:bg-black/5" 
                disabled={isCancelling}
                onClick={() => setIsCancelModalOpen(false)}
              >
                Keep my subscription
              </button>
            </div>
          </div>
        </div>
      )}


      {/* 3. Log Out Modal */}
      {isLogoutModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-[#1E2A2E]/40 backdrop-blur-[6px] z-[500] flex items-center justify-center p-5" onClick={() => setIsLogoutModalOpen(false)}>
          <div className="modal bg-white rounded-2xl p-7 max-w-[400px] w-full shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-ttl font-serif text-xl font-normal text-primary mb-2.5 leading-snug">Log out of Ingress Within?</h2>
            <p className="modal-body text-[13.5px] text-mid mb-5.5 leading-relaxed">You can log back in with your phone number.</p>
            <div className="modal-acts flex flex-col gap-2">
              <button className="btn btn-dk py-3 w-full bg-[#1E2A2E] text-white rounded-lg text-xs font-semibold hover:bg-[#253338]" onClick={handleSignOutClick}>
                Log out
              </button>
              <button className="btn btn-ol py-3 w-full border border-[#1E2A2E]/15 rounded-lg text-xs font-semibold hover:bg-black/5" onClick={() => setIsLogoutModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
