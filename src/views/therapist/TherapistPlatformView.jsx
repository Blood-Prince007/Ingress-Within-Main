import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TherapistAuthPage from '../TherapistAuthPage';
import TherapistOnboardingView from './TherapistOnboardingView';
import TherapistApplicationReviewView from './TherapistApplicationReviewView';
import TherapistDashboardShell from './TherapistDashboardShell';

export default function TherapistPlatformView() {
  const [authState, setAuthState] = useState('checking'); // 'checking' | 'unauthenticated' | 'authenticated'
  const [therapistData, setTherapistData] = useState(null);
  const [appStatusData, setAppStatusData] = useState(null);
  const [isEditingApplication, setIsEditingApplication] = useState(false);

  const checkTherapistSession = async (existingData = null) => {
    try {
      if (existingData?.therapist) {
        setTherapistData(existingData);
        setAuthState('authenticated');
        return;
      }

      const res = await fetch('/api/therapist/auth/me');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.therapist) {
          setTherapistData(json);

          // If not can_practice yet, check application status
          if (!json.therapist.can_practice) {
            try {
              const statusRes = await fetch('/api/therapist/application/status');
              if (statusRes.ok) {
                const statusJson = await statusRes.json();
                setAppStatusData(statusJson);
              }
            } catch (e) {}
          }

          setAuthState('authenticated');
          return;
        }
      }
      setAuthState('unauthenticated');
    } catch (err) {
      console.error('Session check error:', err);
      setAuthState('unauthenticated');
    }
  };

  useEffect(() => {
    checkTherapistSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/therapist/auth/logout', { method: 'POST' });
    } catch {}
    setTherapistData(null);
    setAppStatusData(null);
    setAuthState('unauthenticated');
  };

  if (authState === 'checking') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center space-y-3">
          <img src="/logo-mark-transparent.png" alt="Ingress Within" className="w-8 h-8 object-contain mx-auto animate-pulse" />
          <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#4E7A66]">
            Verifying Clinical Practitioner Session...
          </span>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <TherapistAuthPage onAuthSuccess={(data) => checkTherapistSession(data)} />;
  }

  const account = therapistData?.therapist;
  const applicationStatus = account?.application_status || appStatusData?.account?.applicationStatus || 'onboarding_incomplete';
  const canPractice = Boolean(
    account?.can_practice ||
    appStatusData?.account?.canPractice ||
    (account?.status === 'active' && (account?.application_status === 'approved' || account?.verification_status === 'verified'))
  );

  // 1. Approved practitioner with practice authorization -> FULL WORKSPACE
  if (canPractice && account?.status === 'active') {
    return (
      <TherapistDashboardShell
        therapistData={therapistData}
        onLogout={handleLogout}
      />
    );
  }

  // 2. Application submitted / under review -> REVIEW STATUS
  if (applicationStatus === 'submitted' || applicationStatus === 'under_review') {
    return (
      <TherapistApplicationReviewView
        applicationData={appStatusData || therapistData}
        onLogout={handleLogout}
        onRefresh={checkTherapistSession}
      />
    );
  }

  // 3. Rejected application -> REVIEW FEEDBACK & RESUBMIT FLOW
  if (applicationStatus === 'rejected') {
    if (isEditingApplication) {
      return (
        <TherapistOnboardingView
          initialData={{
            application: appStatusData?.application || null,
            account: therapistData?.therapist,
            profile: therapistData?.profile,
          }}
          onComplete={() => {
            setIsEditingApplication(false);
            checkTherapistSession();
          }}
          onLogout={handleLogout}
        />
      );
    }

    return (
      <TherapistApplicationReviewView
        applicationData={appStatusData || therapistData}
        onLogout={handleLogout}
        onRefresh={checkTherapistSession}
        onEditApplication={() => setIsEditingApplication(true)}
      />
    );
  }

  // 4. Suspended account
  if (account?.status === 'suspended') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-[#132A24]/10 rounded-2xl p-8 shadow-sm space-y-4">
          <h2 className="font-serif text-2xl text-[#132A24]">Account Suspended</h2>
          <p className="text-xs text-[#132A24]/60 leading-relaxed">
            Your clinical practitioner account has been suspended by administration. Please contact our clinical operations desk at clinical@ingresswithin.com.
          </p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-[#132A24] text-white text-xs font-medium cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // 4. Onboarding incomplete (default for new applicants) -> 11-STEP ONBOARDING
  return (
    <TherapistOnboardingView
      initialData={{
        application: appStatusData?.application || null,
        account: therapistData?.therapist,
        profile: therapistData?.profile,
      }}
      onComplete={() => checkTherapistSession()}
      onLogout={handleLogout}
    />
  );
}
