import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PolicyModal from './components/PolicyModal';

const LandingPage = lazy(() => import('./views/LandingPage'));
const WhatItIsPage = lazy(() => import('./views/WhatItIsPage'));
const GuidedJournalingPage = lazy(() => import('./views/GuidedJournalingPage'));
const SelfReflectionPage = lazy(() => import('./views/SelfReflectionPage'));
const EmotionalPatternsPage = lazy(() => import('./views/EmotionalPatternsPage'));
const SelfAwarenessPage = lazy(() => import('./views/SelfAwarenessPage'));
const JournalingPromptsPage = lazy(() => import('./views/JournalingPromptsPage'));
const HowToStartJournalingPage = lazy(() => import('./views/HowToStartJournalingPage'));
const HowToPracticeSelfReflectionPage = lazy(() => import('./views/HowToPracticeSelfReflectionPage'));
const HowItWorksPage = lazy(() => import('./views/HowItWorksPage'));
const AboutPage = lazy(() => import('./views/AboutPage'));
const PricingPage = lazy(() => import('./views/PricingPage'));
const FaqPage = lazy(() => import('./views/FaqPage'));
const ContactPage = lazy(() => import('./views/ContactPage'));
const AuthPage = lazy(() => import('./views/AuthPage'));
const TherapistAuthPage = lazy(() => import('./views/TherapistAuthPage'));
const TherapistPlatformView = lazy(() => import('./views/therapist/TherapistPlatformView'));
const AdminPlatformView = lazy(() => import('./views/admin/AdminPlatformView'));
const RazorpayVerificationPage = lazy(() => import('./views/RazorpayVerificationPage'));
const AiDataPage = lazy(() => import('./views/AiDataPage'));
const OnboardingPage = lazy(() => import('./views/OnboardingPage'));
const DashboardPage = lazy(() => import('./views/DashboardPage'));
const TherapyPage = lazy(() => import('./views/TherapyPage'));
const SettingsPage = lazy(() => import('./views/SettingsPage'));
const WritePage = lazy(() => import('./views/WritePage'));
const GuidedWritePage = lazy(() => import('./views/GuidedWritePage'));
const ReportsPage = lazy(() => import('./views/ReportsPage'));
const PatternsPage = lazy(() => import('./views/PatternsPage'));
const VocabPage = lazy(() => import('./views/VocabPage'));
const KnowledgeBankPage = lazy(() => import('./views/KnowledgeBankPage'));
const InterventionsPage = lazy(() => import('./views/InterventionsPage'));
const SupportPage = lazy(() => import('./views/SupportPage'));
const SessionFlowPage = lazy(() => import('./views/SessionFlowPage'));
const ThreadDetailPage = lazy(() => import('./views/ThreadDetailPage'));
const ThreadsPage = lazy(() => import('./views/ThreadsPage'));
const EntryDetailPage = lazy(() => import('./views/EntryDetailPage'));
const ExercisePage = lazy(() => import('./views/ExercisePage'));
const TestPage = (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_TEST_PAGE === 'true')
  ? lazy(() => import('./views/TestPage'))
  : () => null;

const ModulePlayerPage = lazy(() => import('./views/ModulePlayerPage'));

const FounderTestPage = (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_TEST_PAGE === 'true')
  ? lazy(() => import('./views/FounderTestPage'))
  : () => null;

const PsychoeducationLabPage = lazy(() => import('./views/PsychoeducationLabPage'));
const NotFoundPage = lazy(() => import('./views/NotFoundPage'));
const PrivacyPolicyView = lazy(() => import('./views/PrivacyPolicyView'));
const TermsOfServiceView = lazy(() => import('./views/TermsOfServiceView'));

// Ingress Within V2 Public Website & Design System
const PublicWebsiteV2 = lazy(() => import('./views/public-v2/PublicWebsiteV2'));

// Ingress Within V2 Experimental Experience
const V2LandingPage = lazy(() => import('./v2/pages/V2LandingPage'));
const V2WhatItIsPage = lazy(() => import('./v2/pages/V2WhatItIsPage'));
const V2HowItWorksPage = lazy(() => import('./v2/pages/V2HowItWorksPage'));
const V2AboutPage = lazy(() => import('./v2/pages/V2AboutPage'));
const V2PricingPage = lazy(() => import('./v2/pages/V2PricingPage'));
const V2FaqPage = lazy(() => import('./v2/pages/V2FaqPage'));
const V2ContactPage = lazy(() => import('./v2/pages/V2ContactPage'));
const V2AiDataPage = lazy(() => import('./v2/pages/V2AiDataPage'));
const V2GuidedJournalingPage = lazy(() => import('./v2/pages/V2GuidedJournalingPage'));
const V2SelfReflectionPage = lazy(() => import('./v2/pages/V2SelfReflectionPage'));
const V2EmotionalPatternsPage = lazy(() => import('./v2/pages/V2EmotionalPatternsPage'));
const V2SelfAwarenessPage = lazy(() => import('./v2/pages/V2SelfAwarenessPage'));
const V2JournalingPromptsPage = lazy(() => import('./v2/pages/V2JournalingPromptsPage'));
const V2HowToStartJournalingPage = lazy(() => import('./v2/pages/V2HowToStartJournalingPage'));
const V2HowToPracticeSelfReflectionPage = lazy(() => import('./v2/pages/V2HowToPracticeSelfReflectionPage'));






function LoadingScreen() {
  return (
    <div className="min-h-screen bg-mint-grey flex flex-col justify-center items-center font-sans space-y-4 text-center">
      <div className="relative w-20 h-20 flex items-center justify-center pointer-events-none mb-2">
        <div className="absolute w-16 h-16 rounded-full border border-secondary/20 animate-ping" />
        <div className="absolute w-12 h-12 rounded-full border border-accent/20 animate-pulse" />
        <svg className="w-8 h-8 text-primary animate-spin" style={{ animationDuration: '3s' }} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="2" fill="currentColor"/>
          <path d="M16 10 Q19 13 16 16 Q13 19 16 22" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        </svg>
      </div>
      <p className="text-mid font-serif italic text-sm animate-pulse">Settle in. Let the mind arrive...</p>
    </div>
  );
}

function DatabaseErrorScreen({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-mint-grey p-8 flex flex-col justify-center items-center font-sans space-y-6 text-center">
      <div className="relative w-20 h-20 flex items-center justify-center pointer-events-none mb-2">
        <svg className="w-12 h-12 text-[#b45309] animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="font-serif text-2xl text-primary font-normal">Connection Interrupted</h1>
      <p className="text-mid font-light max-w-sm leading-relaxed text-[14px]">
        We encountered a temporary database or network issue checking your session state.
      </p>
      <div className="bg-[#fef3c7] border border-[#f59e0b]/20 text-[#92400e] text-[11px] font-mono p-3 rounded max-w-md w-full break-all text-left">
        <strong>Error Code:</strong> {error.code || 'UNKNOWN'}<br />
        <strong>Status:</strong> {error.status || '0'}<br />
        <strong>Message:</strong> {error.message || 'Check database connection or credentials.'}
      </div>
      <button 
        onClick={onRetry}
        className="px-6 py-2.5 bg-primary hover:bg-[#2A3A3E] text-mint-grey rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
      >
        Retry Connection
      </button>
    </div>
  );
}

export default function App({ initialRoute = 'home' }) {
  const [currentRoute, setCurrentRoute] = useState(initialRoute);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [activePolicyKey, setActivePolicyKey] = useState('privacy');

  // Authenticated user state
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setProfile(null);
      setAuthError(null);
      window.navigateTo('/auth');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleOpenPolicy = (key) => {
    setActivePolicyKey(key || 'privacy');
    setPolicyModalOpen(true);
  };

  // Check auth and profile status from the server
  const checkUserStatus = async (silent = false) => {
    console.log(`[App.jsx] checkUserStatus started... silent: ${silent}`);
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const res = await fetch('/api/auth/me');
      console.log(`[App.jsx] checkUserStatus API response status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log('[App.jsx] checkUserStatus user resolved:', data.user ? data.user.id : null);
        console.log('[App.jsx] checkUserStatus profile resolved:', data.profile ? {
          id: data.profile.id,
          consent_completed: data.profile.consent_completed,
          profile_completed: data.profile.profile_completed,
          onboarding_completed: data.profile.onboarding_completed
        } : null);
        setUser(data.user);
        setProfile(data.profile);
        setAuthError(null); // Clear any previous auth errors
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn('[App.jsx] checkUserStatus API error response:', errData);
        
        const errorCode = errData.error?.code || 'UNKNOWN';
        const errorStatus = res.status;
        
        // If it's a transient server error or database query issue (500)
        if (errorStatus >= 500 || errorCode === 'DATABASE_ERROR' || errorCode === 'INTERNAL_ERROR') {
          console.warn('[App.jsx] checkUserStatus: Transient server/database error. Retaining current user states, setting authError.');
          setAuthError({
            code: errorCode,
            status: errorStatus,
            message: errData.error?.message || 'A database or connection error occurred.'
          });
        } else {
          // Actual authentication failure (401, etc. - e.g., AUTH_REQUIRED, AUTH_INVALID_TOKEN, AUTH_SESSION_EXPIRED)
          console.warn('[App.jsx] checkUserStatus: True authentication invalidity. Clearing user session. Error Code:', errorCode);
          setUser(null);
          setProfile(null);
          setAuthError(null);
        }
      }
    } catch (err) {
      console.error('[App.jsx] checkUserStatus network or execution error:', err);
      // Catch network/cors offline errors as transient
      setAuthError({
        code: 'NETWORK_ERROR',
        status: 0,
        message: 'Could not connect to the server. Please check your network connection.'
      });
    } finally {
      console.log('[App.jsx] checkUserStatus complete. Setting isLoading(false) and authChecked(true)');
      if (!silent) {
        setIsLoading(false);
      }
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    // Check user state on initial load.
    // Only check user status if it hasn't been checked yet, to avoid duplicate auth checks on every route change.
    if (!authChecked) {
      checkUserStatus(false);
    }
  }, [currentRoute, authChecked]);

  // Protective Redirect Engine
  useEffect(() => {
    const path = window.location.pathname;
    console.log('[App.jsx] Redirect Engine evaluated with states:', {
      authChecked,
      isLoading,
      authErrorExists: !!authError,
      authErrorCode: authError?.code || null,
      userExists: !!user,
      userId: user?.id || null,
      profileExists: !!profile,
      onboardingCompleted: profile?.onboarding_completed,
      path,
      currentRoute
    });

    if (!authChecked || isLoading) {
      console.log('[App.jsx] Redirect Engine: auth not checked or currently loading, skipping redirects.');
      return;
    }

    // If there is a transient database/network error on a pointer/protected route, prevent redirect loops to /auth
    if (authError && (path.startsWith('/onboarding') || path.startsWith('/dashboard') || path.startsWith('/settings') || path.startsWith('/write') || path.startsWith('/reports') || path.startsWith('/patterns') || path.startsWith('/vocab') || path.startsWith('/interventions') || path.startsWith('/support') || path.startsWith('/session') || path.startsWith('/thread') || path.startsWith('/therapy'))) {
      console.warn('[App.jsx] Redirect Engine: Database/Network error detected on protected path. Preventing redirect to /auth. Reason: TRANSIENT_ERROR_SHIELD');
      return;
    }

    const isProtectedRoute = path.startsWith('/onboarding') || path.startsWith('/dashboard') || path.startsWith('/settings') || path.startsWith('/write') || path.startsWith('/reports') || path.startsWith('/patterns') || path.startsWith('/vocab') || path.startsWith('/interventions') || path.startsWith('/support') || path.startsWith('/session') || path.startsWith('/thread') || path.startsWith('/entry') || path.startsWith('/knowledge') || path.startsWith('/kb') || path.startsWith('/modules') || path.startsWith('/therapy');


    if (isProtectedRoute) {
      if (!user) {
        console.warn('[App.jsx] Redirect Engine: User is not authenticated on protected route. Redirecting to /auth. Reason: SESSION_INVALID');
        window.navigateTo('/auth');
      } else if (profile) {
        console.log('[App.jsx] Redirect Engine: Authenticated user with profile on protected route. Onboarding state:', {
          consent_completed: profile.consent_completed,
          profile_completed: profile.profile_completed,
          orientation_completed: profile.orientation_completed,
          onboarding_completed: profile.onboarding_completed
        });
        if (!profile.onboarding_completed) {
          if (!path.startsWith('/onboarding')) {
            console.log('[App.jsx] Redirect Engine: onboarding_completed is false. Redirecting to /onboarding. Reason: ONBOARDING_INCOMPLETE');
            window.navigateTo('/onboarding');
          } else {
            console.log('[App.jsx] Redirect Engine: User is on onboarding flow:', path);
          }
        } else {
          // Onboarding complete: prevent getting stuck on onboarding pages
          if (path.startsWith('/onboarding')) {
            console.log('[App.jsx] Redirect Engine: Onboarding is already complete. Redirecting from onboarding path to /dashboard. Reason: ONBOARDING_ALREADY_COMPLETE');
            window.navigateTo('/dashboard');
          } else {
            console.log('[App.jsx] Redirect Engine: Onboarding complete, user is on allowed protected page:', path);
          }
        }
      } else {
        // User is authenticated but profile is null: fallback redirect to onboarding/consent if not already there
        console.warn('[App.jsx] Redirect Engine: User is authenticated but profile is null! Redirecting to /onboarding/consent. Reason: PROFILE_MISSING');
        if (path !== '/onboarding/consent') {
          window.navigateTo('/onboarding/consent');
        }
      }
    } else if (path.startsWith('/auth') && user) {
      console.log('[App.jsx] Redirect Engine: Authenticated user attempting to access /auth. Redirecting forward.');
      if (profile && !profile.onboarding_completed) {
        if (!profile.consent_completed) {
          console.log('[App.jsx] Redirect Engine: Redirecting to /onboarding/consent. Reason: ONBOARDING_INCOMPLETE');
          window.navigateTo('/onboarding/consent');
        } else if (!profile.profile_completed) {
          console.log('[App.jsx] Redirect Engine: Redirecting to /onboarding/profile. Reason: ONBOARDING_INCOMPLETE');
          window.navigateTo('/onboarding/profile');
        } else if (!profile.orientation_completed) {
          console.log('[App.jsx] Redirect Engine: Redirecting to /onboarding/welcome. Reason: ONBOARDING_INCOMPLETE');
          window.navigateTo('/onboarding/welcome');
        } else if (!profile.assessment_completed) {
          console.log('[App.jsx] Redirect Engine: Redirecting to /onboarding/assessment. Reason: ONBOARDING_INCOMPLETE');
          window.navigateTo('/onboarding/assessment');
        }
      } else {
        console.log('[App.jsx] Redirect Engine: Redirecting to /dashboard. Reason: ONBOARDING_ALREADY_COMPLETE');
        window.navigateTo('/dashboard');
      }
    } else {
      console.log('[App.jsx] Redirect Engine: Public route or unauthenticated user on /auth. No redirect needed.');
    }
  }, [authChecked, isLoading, user, profile, currentRoute, authError]);

  // Privacy-safe client activity heartbeat (throttled; captures active users in real-time)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sendHeartbeat = () => {
      try {
        fetch('/api/telemetry/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id || null,
            role: user ? (user.role || (user.is_admin ? 'admin' : 'client')) : 'guest',
            route: window.location.pathname || '/',
          }),
        }).catch(() => {});
      } catch {
        // fail-safe ignore
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 120000); // every 2 minutes
    return () => clearInterval(interval);
  }, [currentRoute, user?.id]);

  const handleAuthSuccess = (authData) => {
    console.log('[App.jsx] handleAuthSuccess received authData:', authData ? { userId: authData.user?.id } : null);
    if (authData?.user) {
      setUser(authData.user);
      setProfile(authData.profile || null);
      setAuthChecked(true);
      setAuthError(null);
    }
    // Also trigger silent background status validation
    checkUserStatus(true);
  };

  useEffect(() => {
    // Define global navigate function so pages/components can trigger programmatically
    window.navigateTo = (path) => {
      console.log('[App.jsx] window.navigateTo called with path:', path);
      window.history.pushState({}, '', path);
      handleLocationChange();
      window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const handleLocationChange = () => {
      const path = window.location.pathname;
      console.log('[App.jsx] handleLocationChange fired. Path:', path);
      if (path === '/solution' || path === '/solution/' || path === '/what-it-is' || path === '/what-it-is/') {
        setCurrentRoute('solution');
        window.scrollTo(0, 0);
      } else if (path === '/how-it-works' || path === '/how-it-works/' || path === '/how' || path === '/how/') {
        setCurrentRoute('how');
        window.scrollTo(0, 0);
      } else if (path === '/about' || path === '/about/') {
        setCurrentRoute('about');
        window.scrollTo(0, 0);
      } else if (path === '/pricing' || path === '/pricing/') {
        setCurrentRoute('pricing');
        window.scrollTo(0, 0);
      } else if (path === '/ai-data' || path === '/ai-data/' || path === '/ai' || path === '/ai/') {
        setCurrentRoute('ai');
        window.scrollTo(0, 0);
      } else if (path === '/evidence' || path === '/evidence/') {
        setCurrentRoute('evidence');
        window.scrollTo(0, 0);
      } else if (path === '/policies' || path === '/policies/') {
        setCurrentRoute('policies');
        window.scrollTo(0, 0);
      } else if (path === '/start' || path === '/start/' || path === '/contact' || path === '/contact/') {
        setCurrentRoute('start');
        window.scrollTo(0, 0);
      } else if (path === '/crisis' || path === '/crisis/') {
        setCurrentRoute('crisis');
        window.scrollTo(0, 0);
      } else if (path === '/faq' || path === '/faq/') {
        setCurrentRoute('faq');
        window.scrollTo(0, 0);
      } else if (path === '/guided-journaling' || path === '/guided-journaling/') {
        setCurrentRoute('guided-journaling');
        window.scrollTo(0, 0);
      } else if (path === '/self-reflection' || path === '/self-reflection/') {
        setCurrentRoute('self-reflection');
        window.scrollTo(0, 0);
      } else if (path === '/emotional-patterns' || path === '/emotional-patterns/') {
        setCurrentRoute('emotional-patterns');
        window.scrollTo(0, 0);
      } else if (path === '/self-awareness' || path === '/self-awareness/') {
        setCurrentRoute('self-awareness');
        window.scrollTo(0, 0);
      } else if (path === '/journaling-prompts-for-self-discovery' || path === '/journaling-prompts-for-self-discovery/') {
        setCurrentRoute('journaling-prompts-for-self-discovery');
        window.scrollTo(0, 0);
      } else if (path === '/how-to-start-journaling' || path === '/how-to-start-journaling/') {
        setCurrentRoute('how-to-start-journaling');
        window.scrollTo(0, 0);
      } else if (path === '/how-to-practice-self-reflection' || path === '/how-to-practice-self-reflection/') {
        setCurrentRoute('how-to-practice-self-reflection');
        window.scrollTo(0, 0);
      } else if (path.startsWith('/auth') || path.startsWith('/login') || path === '/user/login' || path === '/user/login/' || path === '/user/auth' || path === '/user/auth/') {
        setCurrentRoute('auth');
        window.scrollTo(0, 0);
      } else if (path === '/therapist' || path === '/therapist/' || path === '/therapist/auth' || path === '/therapist/auth/' || path === '/therapist/login' || path === '/therapist/login/' || path.startsWith('/therapist/')) {
        setCurrentRoute(path.replace(/^\/|\/$/g, '') || 'therapist/auth');
        window.scrollTo(0, 0);
      } else if (path === '/admin' || path === '/admin/' || (path.startsWith('/admin') && !path.startsWith('/admin/psychoeducation-lab'))) {
        setCurrentRoute(path.replace(/^\/|\/$/g, '') || 'admin');
        window.scrollTo(0, 0);
      } else if (path.startsWith('/onboarding')) {
        setCurrentRoute('onboarding');
        window.scrollTo(0, 0);
      } else if (path === '/dashboard' || path === '/dashboard/') {
        setCurrentRoute('dashboard');
        window.scrollTo(0, 0);
      } else if (path === '/therapy' || path === '/therapy/') {
        setCurrentRoute('therapy');
        window.scrollTo(0, 0);
      } else if (path === '/settings' || path === '/settings/') {
        setCurrentRoute('settings');
        window.scrollTo(0, 0);
      } else if (path === '/write/guided' || path === '/write/guided/') {
        setCurrentRoute('write-guided');
        window.scrollTo(0, 0);
      } else if (path === '/write' || path === '/write/' || path.startsWith('/write')) {
        setCurrentRoute('write');
        window.scrollTo(0, 0);
      } else if (path === '/reports' || path === '/reports/') {
        setCurrentRoute('reports');
        window.scrollTo(0, 0);
      } else if (path === '/patterns' || path === '/patterns/') {
        setCurrentRoute('patterns');
        window.scrollTo(0, 0);
      } else if (path === '/vocab' || path === '/vocab/') {
        setCurrentRoute('vocab');
        window.scrollTo(0, 0);
      } else if (path.startsWith('/knowledge') || path.startsWith('/kb')) {
        setCurrentRoute('knowledge');
        window.scrollTo(0, 0);
      } else if (path === '/interventions' || path === '/interventions/') {
        setCurrentRoute('interventions');
        window.scrollTo(0, 0);
      } else if (path.startsWith('/modules')) {
        setCurrentRoute('modules');
        window.scrollTo(0, 0);
      } else if (path === '/exercise' || path === '/exercise/' || path === '/exercises' || path === '/exercises/' || path === '/assessment' || path === '/assessment/') {
        setCurrentRoute('exercise');
        window.scrollTo(0, 0);
      } else if (path === '/support' || path === '/support/') {
        setCurrentRoute('support');
        window.scrollTo(0, 0);
      } else if (path.startsWith('/session')) {
        setCurrentRoute('session');
        window.scrollTo(0, 0);
      } else if (path === '/threads' || path === '/threads/') {
        setCurrentRoute('threads');
        window.scrollTo(0, 0);
      } else if (path.startsWith('/thread/')) {
        setCurrentRoute('thread');
        window.scrollTo(0, 0);
      } else if (path.startsWith('/entry/')) {
        setCurrentRoute('entry-detail');
        window.scrollTo(0, 0);
      } else if (path === '/ai-data' || path === '/ai-data/') {
        setCurrentRoute('ai-data');
        window.scrollTo(0, 0);
      } else if (path === '/test' || path === '/test/') {
        if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_TEST_PAGE === 'true') {
          setCurrentRoute('test');
          window.scrollTo(0, 0);
        } else {
          setCurrentRoute('home');
        }
      } else if (path === '/test/founder' || path === '/test/founder/') {
        if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_TEST_PAGE === 'true') {
          setCurrentRoute('test-founder');
          window.scrollTo(0, 0);
        } else {
          setCurrentRoute('home');
        }
      } else if (path === '/admin/psychoeducation-lab' || path === '/admin/psychoeducation-lab/' || path.startsWith('/admin/psychoeducation-lab')) {
        setCurrentRoute('psychoeducation-lab');
        window.scrollTo(0, 0);
      } else if (path === '/v2' || path === '/v2/') {
        setCurrentRoute('v2-home');
        window.scrollTo(0, 0);
      } else if (path === '/v2/what-it-is' || path === '/v2/what-it-is/') {
        setCurrentRoute('v2-what-it-is');
        window.scrollTo(0, 0);
      } else if (path === '/v2/how-it-works' || path === '/v2/how-it-works/') {
        setCurrentRoute('v2-how-it-works');
        window.scrollTo(0, 0);
      } else if (path === '/v2/about' || path === '/v2/about/') {
        setCurrentRoute('v2-about');
        window.scrollTo(0, 0);
      } else if (path === '/v2/pricing' || path === '/v2/pricing/') {
        setCurrentRoute('v2-pricing');
        window.scrollTo(0, 0);
      } else if (path === '/v2/faq' || path === '/v2/faq/') {
        setCurrentRoute('v2-faq');
        window.scrollTo(0, 0);
      } else if (path === '/v2/contact' || path === '/v2/contact/') {
        setCurrentRoute('v2-contact');
        window.scrollTo(0, 0);
      } else if (path === '/v2/ai-data' || path === '/v2/ai-data/') {
        setCurrentRoute('v2-ai-data');
        window.scrollTo(0, 0);
      } else if (path === '/v2/guided-journaling' || path === '/v2/guided-journaling/') {
        setCurrentRoute('v2-guided-journaling');
        window.scrollTo(0, 0);
      } else if (path === '/v2/self-reflection' || path === '/v2/self-reflection/') {
        setCurrentRoute('v2-self-reflection');
        window.scrollTo(0, 0);
      } else if (path === '/v2/emotional-patterns' || path === '/v2/emotional-patterns/') {
        setCurrentRoute('v2-emotional-patterns');
        window.scrollTo(0, 0);
      } else if (path === '/v2/self-awareness' || path === '/v2/self-awareness/') {
        setCurrentRoute('v2-self-awareness');
        window.scrollTo(0, 0);
      } else if (path === '/v2/journaling-prompts-for-self-discovery' || path === '/v2/journaling-prompts-for-self-discovery/') {
        setCurrentRoute('v2-journaling-prompts-for-self-discovery');
        window.scrollTo(0, 0);
      } else if (path === '/v2/how-to-start-journaling' || path === '/v2/how-to-start-journaling/') {
        setCurrentRoute('v2-how-to-start-journaling');
        window.scrollTo(0, 0);
      } else if (path === '/v2/how-to-practice-self-reflection' || path === '/v2/how-to-practice-self-reflection/') {
        setCurrentRoute('v2-how-to-practice-self-reflection');
        window.scrollTo(0, 0);
      } else if (path === '/privacy-policy' || path === '/privacy-policy/' || path === '/privacy' || path === '/privacy/') {
        setCurrentRoute('privacy-policy');
        window.scrollTo(0, 0);
      } else if (path === '/terms' || path === '/terms/' || path === '/terms-of-service' || path === '/terms-of-service/') {
        setCurrentRoute('terms');
        window.scrollTo(0, 0);
      } else if (path === '/' || path === '') {
        setCurrentRoute('home');
        // Handle section scroll deep link (e.g. /#auth -> scroll to auth section)
        const hash = window.location.hash;
        const anchor = hash.replace(/^#\/?/, '');
        if (anchor && ['what', 'how', 'trust', 'pricing', 'faq', 'auth', 'problem', 'approach', 'who'].includes(anchor)) {
          setTimeout(() => {
            const el = document.getElementById(anchor);
            if (el) {
              const yOffset = -80;
              const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }, 150);
        }
      } else {
        setCurrentRoute('not-found');
        window.scrollTo(0, 0);
      }
    };

    const handleGlobalClick = (e) => {
      const anchor = e.target.closest('a');
      if (!anchor) return;

      // If it's a local path or hash link (excluding backend API endpoints)
      if (
        href &&
        (href.startsWith('/') || href.startsWith('#')) &&
        !href.startsWith('//') &&
        !href.startsWith('/api/') &&
        !anchor.target
      ) {
        // Handle in-page hash scroll for Home route
        if (href.startsWith('#') && window.location.pathname === '/') {
          const anchorId = href.replace(/^#\/?/, '');
          const el = document.getElementById(anchorId);
          if (el) {
            e.preventDefault();
            window.history.pushState({}, '', href);
            const yOffset = -80;
            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
          return;
        }

        e.preventDefault();
        window.history.pushState({}, '', href);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('click', handleGlobalClick);
    handleLocationChange(); // Run initial check on load

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const renderPage = () => {
    const path = typeof window !== 'undefined' 
      ? window.location.pathname 
      : (currentRoute.startsWith('/') ? currentRoute : `/${currentRoute}`);
    const isProtectedRoute = path.startsWith('/onboarding') || path.startsWith('/dashboard') || path.startsWith('/settings') || path.startsWith('/write') || path.startsWith('/reports') || path.startsWith('/patterns') || path.startsWith('/vocab') || path.startsWith('/support') || path.startsWith('/session') || path.startsWith('/thread') || path.startsWith('/entry') || path.startsWith('/knowledge') || path.startsWith('/kb') || path.startsWith('/modules') || path.startsWith('/therapy');

    if (isProtectedRoute && (!authChecked || isLoading)) {
      return <LoadingScreen />;
    }

    if (isProtectedRoute && authError) {
      return <DatabaseErrorScreen error={authError} onRetry={checkUserStatus} />;
    }

    switch (currentRoute) {

      case 'home':
        return <PublicWebsiteV2 initialTab="home" onOpenPolicy={handleOpenPolicy} />;
      case 'solution':
      case 'what-it-is':
        return <PublicWebsiteV2 initialTab="solution" onOpenPolicy={handleOpenPolicy} />;
      case 'how':
      case 'how-it-works':
        return <PublicWebsiteV2 initialTab="how" onOpenPolicy={handleOpenPolicy} />;
      case 'about':
        return <PublicWebsiteV2 initialTab="about" onOpenPolicy={handleOpenPolicy} />;
      case 'pricing':
        return <PublicWebsiteV2 initialTab="pricing" onOpenPolicy={handleOpenPolicy} />;
      case 'ai':
      case 'ai-data':
        return <PublicWebsiteV2 initialTab="ai" onOpenPolicy={handleOpenPolicy} />;
      case 'evidence':
        return <PublicWebsiteV2 initialTab="evidence" onOpenPolicy={handleOpenPolicy} />;
      case 'policies':
        return <PublicWebsiteV2 initialTab="policies" onOpenPolicy={handleOpenPolicy} />;
      case 'privacy-policy':
      case 'privacy':
        return <PrivacyPolicyView />;
      case 'terms':
      case 'terms-of-service':
        return <TermsOfServiceView />;
      case 'start':
      case 'contact':
        return <PublicWebsiteV2 initialTab="start" onOpenPolicy={handleOpenPolicy} />;
      case 'crisis':
        return <PublicWebsiteV2 initialTab="crisis" onOpenPolicy={handleOpenPolicy} />;
      case 'faq':
        return <FaqPage onOpenPolicy={handleOpenPolicy} />;
      case 'guided-journaling':
        return <GuidedJournalingPage onOpenPolicy={handleOpenPolicy} />;
      case 'self-reflection':
        return <SelfReflectionPage onOpenPolicy={handleOpenPolicy} />;
      case 'emotional-patterns':
        return <EmotionalPatternsPage onOpenPolicy={handleOpenPolicy} />;
      case 'self-awareness':
        return <SelfAwarenessPage onOpenPolicy={handleOpenPolicy} />;
      case 'journaling-prompts-for-self-discovery':
        return <JournalingPromptsPage onOpenPolicy={handleOpenPolicy} />;
      case 'how-to-start-journaling':
        return <HowToStartJournalingPage onOpenPolicy={handleOpenPolicy} />;
      case 'how-to-practice-self-reflection':
        return <HowToPracticeSelfReflectionPage onOpenPolicy={handleOpenPolicy} />;
      case 'auth':
        return <AuthPage onOpenPolicy={handleOpenPolicy} onAuthSuccess={handleAuthSuccess} />;
      case 'therapist/auth':
      case 'therapist/login':
      case 'therapist':
      case 'therapist/onboarding':
      case 'therapist/application':
      case 'therapist/dashboard':
      case 'therapist/today':
      case 'therapist/requests':
      case 'therapist/clients':
      case 'therapist/calendar':
      case 'therapist/sessions':
      case 'therapist/earnings':
      case 'therapist/profile':
        return <TherapistPlatformView />;
      case 'admin':
      case 'admin/login':
      case 'admin/overview':
      case 'admin/analytics':
      case 'admin/users':
      case 'admin/therapists':
      case 'admin/applications':
      case 'admin/clients':
      case 'admin/sessions':
      case 'admin/payments':
      case 'admin/payouts':
      case 'admin/api-usage':
      case 'admin/health':
      case 'admin/webhooks':
      case 'admin/emails':
      case 'admin/audit-logs':
      case 'admin/security':
        return <AdminPlatformView />;
      case 'razorpay-verification':
        return <RazorpayVerificationPage />;
      case 'onboarding':
        return (
          <OnboardingPage
            onComplete={async () => {
              await checkUserStatus(true);
              window.navigateTo('/dashboard');
            }}
          />
        );
      case 'dashboard':
        return <DashboardPage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'therapy':
        return <TherapyPage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'settings':
        return <SettingsPage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'write':
        return <WritePage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'write-guided':
        return <GuidedWritePage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'reports':
        return <ReportsPage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'patterns':
        return <PatternsPage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'vocab':
        return <VocabPage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'knowledge':
        return <KnowledgeBankPage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'exercise':
        return <ExercisePage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'interventions':
        return <InterventionsPage />;
      case 'modules':
        return <ModulePlayerPage />;
      case 'support':
        return <SupportPage />;
      case 'session':
        return <SessionFlowPage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'threads':
        return <ThreadsPage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'thread': {
        const threadId = typeof window !== 'undefined' ? (window.location.pathname.split('/thread/')[1]?.replace(/\/$/, '') || '') : '';
        return <ThreadDetailPage user={user} profile={profile} threadId={threadId} onSignOut={handleSignOut} />;
      }
      case 'entry-detail': {
        const entryId = typeof window !== 'undefined' ? (window.location.pathname.split('/entry/')[1]?.replace(/\/$/, '') || '') : '';
        return <EntryDetailPage user={user} profile={profile} entryId={entryId} onSignOut={handleSignOut} />;
      }
      case 'ai-data':
        return <AiDataPage onOpenPolicy={handleOpenPolicy} />;
      case 'test':
        if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_TEST_PAGE === 'true') {
          return <TestPage />;
        }
        return <LandingPage onOpenPolicy={handleOpenPolicy} />;
      case 'test-founder':
        if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_TEST_PAGE === 'true') {
          return <FounderTestPage />;
        }
        return <LandingPage onOpenPolicy={handleOpenPolicy} />;
      case 'psychoeducation-lab':
        return <PsychoeducationLabPage />;

      // Ingress Within V2 Experiences
      case 'v2-home':
        return <V2LandingPage onOpenPolicy={handleOpenPolicy} />;
      case 'v2-what-it-is':
        return <V2WhatItIsPage onOpenPolicy={handleOpenPolicy} />;
      case 'v2-how-it-works':
        return <V2HowItWorksPage onOpenPolicy={handleOpenPolicy} />;
      case 'v2-about':
        return <V2AboutPage onOpenPolicy={handleOpenPolicy} />;
      case 'v2-pricing':
        return <V2PricingPage onOpenPolicy={handleOpenPolicy} />;
      case 'v2-faq':
        return <V2FaqPage onOpenPolicy={handleOpenPolicy} />;
      case 'v2-contact':
        return <V2ContactPage onOpenPolicy={handleOpenPolicy} />;
      case 'v2-ai-data':
        return <V2AiDataPage onOpenPolicy={handleOpenPolicy} />;
      case 'v2-guided-journaling':
        return <V2GuidedJournalingPage onOpenPolicy={handleOpenPolicy} />;
      case 'v2-self-reflection':
        return <V2SelfReflectionPage onOpenPolicy={handleOpenPolicy} />;
      case 'v2-emotional-patterns':
        return <V2EmotionalPatternsPage onOpenPolicy={handleOpenPolicy} />;
      case 'v2-self-awareness':
        return <V2SelfAwarenessPage onOpenPolicy={handleOpenPolicy} />;
      case 'v2-journaling-prompts-for-self-discovery':
        return <V2JournalingPromptsPage onOpenPolicy={handleOpenPolicy} />;
      case 'v2-how-to-start-journaling':
        return <V2HowToStartJournalingPage onOpenPolicy={handleOpenPolicy} />;
      case 'v2-how-to-practice-self-reflection':
        return <V2HowToPracticeSelfReflectionPage onOpenPolicy={handleOpenPolicy} />;

      case 'not-found':
        return <NotFoundPage user={user} profile={profile} />;
      case 'home':
      default:
        if (currentRoute && currentRoute.startsWith('therapist')) {
          return <TherapistPlatformView />;
        }
        return <PublicWebsiteV2 initialTab="home" onOpenPolicy={handleOpenPolicy} />;
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentRoute}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <Suspense fallback={<LoadingScreen />}>
            {renderPage()}
          </Suspense>
        </motion.div>
      </AnimatePresence>
      
      <PolicyModal 
        isOpen={policyModalOpen} 
        onClose={() => setPolicyModalOpen(false)} 
        activeKey={activePolicyKey}
        setActiveKey={setActivePolicyKey}
      />
    </>
  );
}
