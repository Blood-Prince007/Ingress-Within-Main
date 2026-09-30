import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  User,
  DollarSign,
  FileText,
  Bell,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import TherapistTodayView from './TherapistTodayView';
import TherapistRequestsView from './TherapistRequestsView';
import TherapistClientsView from './TherapistClientsView';
import TherapistCalendarView from './TherapistCalendarView';
import TherapistEarningsView from './TherapistEarningsView';
import TherapistProfileView from './TherapistProfileView';
import TherapistSoapModal from './TherapistSoapModal';
import TherapistScheduleModal from './TherapistScheduleModal';
import TherapistNotificationsModal from './TherapistNotificationsModal';

import TherapistSessionDetailView from './TherapistSessionDetailView';
import TherapistClientModal from './TherapistClientModal';

export default function TherapistDashboardShell({ therapistData, onLogout }) {
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/therapist/requests')) return 'requests';
      if (path.includes('/therapist/clients')) return 'clients';
      if (path.includes('/therapist/calendar') || path.includes('/therapist/sessions')) return 'calendar';
      if (path.includes('/therapist/earnings')) return 'earnings';
      if (path.includes('/therapist/profile')) return 'profile';
    }
    return 'today';
  };

  const getInitialSessionId = () => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/therapist\/sessions\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const getInitialClientId = () => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/therapist\/clients\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const getInitialClientModalTab = () => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.includes('/journey')) return 'journey';
    }
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [activeSessionId, setActiveSessionId] = useState(getInitialSessionId);
  const [activeClientModalId, setActiveClientModalId] = useState(getInitialClientId);
  const [activeClientModalTab, setActiveClientModalTab] = useState(getInitialClientModalTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSoapAppointmentId, setActiveSoapAppointmentId] = useState(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleDefaultClient, setScheduleDefaultClient] = useState(null);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);

  React.useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getInitialTab());
      setActiveSessionId(getInitialSessionId());
      setActiveClientModalId(getInitialClientId());
      setActiveClientModalTab(getInitialClientModalTab());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setActiveSessionId(null);
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      const targetPath = tabId === 'today' ? '/therapist' : `/therapist/${tabId}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  };

  const handleOpenSession = (sessionId) => {
    setActiveSessionId(sessionId);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/therapist/sessions/${sessionId}`);
    }
  };

  const handleCloseSessionDetail = () => {
    setActiveSessionId(null);
    if (typeof window !== 'undefined') {
      const targetPath = activeTab === 'today' ? '/therapist' : `/therapist/${activeTab}`;
      window.history.pushState(null, '', targetPath);
    }
  };

  const handleOpenClient = (clientId, initialTab = 'overview') => {
    setActiveClientModalId(clientId);
    setActiveClientModalTab(initialTab);
    if (typeof window !== 'undefined') {
      const targetPath = initialTab === 'journey'
        ? `/therapist/clients/${clientId}/journey`
        : `/therapist/clients/${clientId}`;
      window.history.pushState(null, '', targetPath);
    }
  };

  const handleCloseClientModal = () => {
    setActiveClientModalId(null);
    if (typeof window !== 'undefined') {
      const targetPath = activeSessionId
        ? `/therapist/sessions/${activeSessionId}`
        : (activeTab === 'today' ? '/therapist' : `/therapist/${activeTab}`);
      window.history.pushState(null, '', targetPath);
    }
  };

  const profile = therapistData?.profile;
  const account = therapistData?.therapist || therapistData?.account;

  const NAV_ITEMS = [
    { id: 'today', label: 'Today', icon: Clock },
    { id: 'requests', label: 'New Requests', icon: Users },
    { id: 'clients', label: 'Clients', icon: User },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'profile', label: 'My Profile', icon: ShieldCheck },
  ];

  const handleOpenSchedule = (clientId, clientName) => {
    setScheduleDefaultClient({ id: clientId, name: clientName });
    setScheduleModalOpen(true);
  };

  const handleOpenSoap = (appointmentId) => {
    setActiveSoapAppointmentId(appointmentId);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#132A24] font-sans flex flex-col lg:flex-row">
      
      {/* MOBILE TOPBAR */}
      <div className="lg:hidden bg-white border-b border-[#132A24]/10 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <img src="/logo-mark-transparent.png" alt="Ingress Within" className="w-6 h-6 object-contain" />
          <span className="font-serif font-semibold text-sm">
            ingress <span className="font-normal text-[#4E7A66]">within</span>
          </span>
          <span className="text-[10px] uppercase font-bold text-[#4E7A66] tracking-wider ml-1">
            Clinical
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setNotificationsModalOpen(true)}
            className="p-1.5 text-[#132A24]/70 hover:text-[#132A24]"
          >
            <Bell size={18} />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-[#132A24]/70 hover:text-[#132A24]"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* DESKTOP SIDEBAR / RESPONSIVE DRAWER */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#132A24]/10 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-[#132A24]/10">
            <div className="flex items-center gap-2.5">
              <img src="/logo-mark-transparent.png" alt="Ingress Within" className="w-8 h-8 object-contain" />
              <div>
                <div className="font-serif text-base font-semibold leading-tight tracking-tight">
                  ingress <span className="font-normal text-[#4E7A66]">within</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#4E7A66]">
                  Practitioner Workspace
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#132A24] text-white shadow-xs font-semibold'
                      : 'text-[#132A24]/70 hover:bg-[#132A24]/5 hover:text-[#132A24]'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-white' : 'text-[#132A24]/50'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-[#132A24]/10 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-[#132A24]/5 border border-[#132A24]/10 flex items-center justify-center font-serif font-bold text-xs text-[#132A24]">
              {profile?.full_name ? profile.full_name.charAt(0) : 'T'}
            </div>
            <div className="truncate flex-grow">
              <div className="text-xs font-semibold text-[#132A24] truncate">
                {profile?.full_name || 'Verified Practitioner'}
              </div>
              <span className="text-[10px] text-[#4E7A66] font-medium flex items-center gap-1">
                <ShieldCheck size={11} /> Practice Authorized
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#132A24]/5 px-2 text-xs">
            <button
              onClick={() => setNotificationsModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-[#132A24]/60 hover:text-[#132A24] cursor-pointer"
            >
              <Bell size={13} /> Updates
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1 text-[#132A24]/60 hover:text-red-700 cursor-pointer"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow p-6 lg:p-10 max-w-6xl mx-auto w-full">
        {activeSessionId ? (
          <TherapistSessionDetailView
            sessionId={activeSessionId}
            onBack={handleCloseSessionDetail}
            onNavigate={(tab) => {
              handleCloseSessionDetail();
              handleTabChange(tab);
            }}
            onOpenClientProfile={handleOpenClient}
            onOpenSoap={handleOpenSoap}
          />
        ) : (
          <>
            {activeTab === 'today' && (
              <TherapistTodayView
                onNavigate={(tab) => handleTabChange(tab)}
                onOpenSoap={handleOpenSoap}
                onOpenSession={handleOpenSession}
              />
            )}
            {activeTab === 'requests' && (
              <TherapistRequestsView
                onNavigate={(tab) => handleTabChange(tab)}
              />
            )}
            {activeTab === 'clients' && (
              <TherapistClientsView
                onOpenSchedule={handleOpenSchedule}
                onOpenSoap={handleOpenSoap}
              />
            )}
            {activeTab === 'calendar' && (
              <TherapistCalendarView
                onOpenSession={handleOpenSession}
                onOpenClient={handleOpenClient}
                onOpenSoap={handleOpenSoap}
              />
            )}
            {activeTab === 'earnings' && (
              <TherapistEarningsView />
            )}
            {activeTab === 'profile' && (
              <TherapistProfileView onNavigateTab={handleTabChange} onLogout={onLogout} />
            )}
          </>
        )}
      </main>

      {/* Client Detail Modal */}
      {activeClientModalId && (
        <TherapistClientModal
          clientId={activeClientModalId}
          initialTab={activeClientModalTab}
          onClose={handleCloseClientModal}
          onOpenSchedule={(cId, cName) => handleOpenSchedule(cId, cName)}
          onOpenSoap={(apptId) => handleOpenSoap(apptId)}
        />
      )}

      {/* SOAP Note Modal */}
      {activeSoapAppointmentId && (
        <TherapistSoapModal
          appointmentId={activeSoapAppointmentId}
          onClose={() => setActiveSoapAppointmentId(null)}
        />
      )}

      {/* Quick Schedule Modal */}
      {scheduleModalOpen && (
        <TherapistScheduleModal
          defaultClientId={scheduleDefaultClient?.id}
          defaultClientName={scheduleDefaultClient?.name}
          onClose={() => {
            setScheduleModalOpen(false);
            setScheduleDefaultClient(null);
          }}
          onSuccess={() => {}}
        />
      )}

      {/* Notifications Drawer Modal */}
      {notificationsModalOpen && (
        <TherapistNotificationsModal
          onClose={() => setNotificationsModalOpen(false)}
          onNavigate={(tab) => setActiveTab(tab)}
        />
      )}
    </div>
  );
}
