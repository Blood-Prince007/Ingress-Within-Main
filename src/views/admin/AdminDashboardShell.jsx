import React, { useState, useEffect } from 'react';
import {
  Shield,
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  HeartHandshake,
  Calendar,
  CreditCard,
  Banknote,
  Activity,
  HeartPulse,
  Webhook,
  FileSpreadsheet,
  Lock,
  LogOut,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Eye,
  Menu,
  X,
  Clock,
  Check,
  GraduationCap,
  Award,
  FileCheck,
  Download,
  AlertCircle,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function AdminDashboardShell({ admin, onLogout, initialTab = 'overview' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Data states
  const [overviewMetrics, setOverviewMetrics] = useState(null);
  const [overviewRange, setOverviewRange] = useState('all');
  const [usersData, setUsersData] = useState({ users: [], pagination: {} });
  const [therapistsData, setTherapistsData] = useState({ therapists: [], pagination: {} });
  const [applications, setApplications] = useState([]);
  const [clientsData, setClientsData] = useState({ clients: [], pagination: {} });
  const [sessionsData, setSessionsData] = useState({ sessions: [], pagination: {} });
  const [paymentsData, setPaymentsData] = useState({ payments: [], pagination: {} });
  const [payoutsData, setPayoutsData] = useState({ payouts: [], batches: [], pagination: {} });
  const [apiUsageData, setApiUsageData] = useState({ summaries: [], recentEvents: [] });
  const [systemHealth, setSystemHealth] = useState(null);
  const [webhooksData, setWebhooksData] = useState({ webhooks: [], pagination: {} });
  const [auditLogsData, setAuditLogsData] = useState({ logs: [], pagination: {} });
  const [securityData, setSecurityData] = useState({ admins: [], currentSessions: [] });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Application Review States
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedApplicationDetail, setSelectedApplicationDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [signedUrlLoading, setSignedUrlLoading] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [applicationsData, setApplicationsData] = useState({ applications: [], pagination: {} });
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('all');

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to format paise to INR
  const formatInr = (paise) => {
    const rupees = (Number(paise || 0) / 100).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
    return `₹${rupees}`;
  };

  // Navigation tabs definition
  const navigationItems = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'therapists', label: 'Therapist Roster', icon: UserCheck },
    { id: 'applications', label: 'Application Queue', icon: FileText, badge: overviewMetrics?.pendingApplications },
    { id: 'clients', label: 'Client Directory', icon: HeartHandshake },
    { id: 'sessions', label: 'Clinical Sessions', icon: Calendar },
    { id: 'payments', label: 'Revenue & Orders', icon: CreditCard },
    { id: 'payouts', label: 'Therapist Payouts', icon: Banknote },
    { id: 'api-usage', label: 'API Usage & Traffic', icon: Activity },
    { id: 'health', label: 'System Health', icon: HeartPulse },
    { id: 'webhooks', label: 'Webhook Monitor', icon: Webhook },
    { id: 'audit-logs', label: 'Audit Trail', icon: FileSpreadsheet },
    { id: 'security', label: 'Admin Security', icon: Lock },
  ];

  // Fetch data on tab or filter change
  const fetchTabData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await fetch(`/api/admin/overview?range=${overviewRange}`);
        const data = await res.json();
        if (data.success) setOverviewMetrics(data.metrics);
      } else if (activeTab === 'users') {
        const res = await fetch(
          `/api/admin/users?page=${currentPage}&limit=20&search=${encodeURIComponent(
            searchQuery
          )}&status=${statusFilter}`
        );
        const data = await res.json();
        if (data.success) setUsersData(data);
      } else if (activeTab === 'therapists') {
        const res = await fetch(
          `/api/admin/therapists?page=${currentPage}&limit=20&search=${encodeURIComponent(
            searchQuery
          )}&status=${statusFilter}`
        );
        const data = await res.json();
        if (data.success) setTherapistsData(data);
      } else if (activeTab === 'applications') {
        const queryParams = new URLSearchParams({
          page: String(currentPage),
          limit: '20',
        });
        if (applicationStatusFilter && applicationStatusFilter !== 'all') {
          queryParams.set('status', applicationStatusFilter);
        }
        if (searchQuery) {
          queryParams.set('search', searchQuery);
        }
        const res = await fetch(`/api/admin/applications?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) {
          setApplications(data.applications || []);
          setApplicationsData({
            applications: data.applications || [],
            pagination: data.pagination || {},
          });
        }
      } else if (activeTab === 'clients') {
        const res = await fetch(
          `/api/admin/clients?page=${currentPage}&limit=20&search=${encodeURIComponent(searchQuery)}`
        );
        const data = await res.json();
        if (data.success) setClientsData(data);
      } else if (activeTab === 'sessions') {
        const res = await fetch(`/api/admin/sessions?page=${currentPage}&limit=20`);
        const data = await res.json();
        if (data.success) setSessionsData(data);
      } else if (activeTab === 'payments') {
        const res = await fetch(`/api/admin/payments?page=${currentPage}&limit=20`);
        const data = await res.json();
        if (data.success) setPaymentsData(data);
      } else if (activeTab === 'payouts') {
        const res = await fetch(`/api/admin/payouts?page=${currentPage}&limit=20`);
        const data = await res.json();
        if (data.success) setPayoutsData(data);
      } else if (activeTab === 'api-usage') {
        const res = await fetch('/api/admin/api-usage');
        const data = await res.json();
        if (data.success) setApiUsageData(data);
      } else if (activeTab === 'health') {
        const res = await fetch('/api/admin/health');
        const data = await res.json();
        if (data.status) setSystemHealth(data);
      } else if (activeTab === 'webhooks') {
        const res = await fetch(`/api/admin/webhooks?page=${currentPage}&limit=20`);
        const data = await res.json();
        if (data.success) setWebhooksData(data);
      } else if (activeTab === 'audit-logs') {
        const res = await fetch(`/api/admin/audit-logs?page=${currentPage}&limit=30`);
        const data = await res.json();
        if (data.success) setAuditLogsData(data);
      } else if (activeTab === 'security') {
        const res = await fetch('/api/admin/security');
        const data = await res.json();
        if (data.success) setSecurityData(data);
      }
    } catch {
      showToast('Error loading admin operational data', true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTabData();
  }, [activeTab, overviewRange, currentPage, applicationStatusFilter]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
    setIsSidebarOpen(false);
    if (typeof window !== 'undefined') {
      const newPath = tabId === 'overview' ? '/admin' : `/admin/${tabId}`;
      window.history.pushState(null, '', newPath);
    }
  };

  // Open full clinical verification dossier
  const handleOpenApplicationDetail = async (therapistAccountId) => {
    setIsLoadingDetail(true);
    setSelectedApplicationDetail(null);
    setReviewerNotes('');
    setRejectionReasonInput('');
    try {
      const res = await fetch(`/api/admin/applications/${therapistAccountId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch application details');
      if (data.success && data.application) {
        setSelectedApplicationDetail(data.application);
      }
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Generate secure 1-hour signed URL to view uploaded document
  const handleViewDocument = async (docPath) => {
    if (!selectedApplicationDetail) return;
    setSignedUrlLoading(docPath);
    try {
      const res = await fetch(`/api/admin/applications/${selectedApplicationDetail.therapistAccountId}/documents/signed-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentPath: docPath }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to generate signed document URL');
      if (data.signedUrl) {
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSignedUrlLoading(null);
    }
  };

  // Approve Clinician Action
  const handleConfirmApprove = async () => {
    if (!selectedApplicationDetail) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/admin/applications/${selectedApplicationDetail.therapistAccountId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: reviewerNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Approval failed');

      showToast('Therapist application approved successfully.');
      setShowApproveModal(false);
      setSelectedApplicationDetail(null);
      setSelectedApplication(null);
      setReviewerNotes('');
      fetchTabData();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Reject Application Action with mandatory operational reason
  const handleConfirmReject = async () => {
    if (!selectedApplicationDetail) return;
    if (!rejectionReasonInput || rejectionReasonInput.trim().length < 5) {
      showToast('Operational rejection reason must be at least 5 characters.', true);
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/admin/applications/${selectedApplicationDetail.therapistAccountId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReasonInput.trim(), notes: reviewerNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Rejection failed');

      showToast('Therapist application rejected.');
      setShowRejectModal(false);
      setSelectedApplicationDetail(null);
      setSelectedApplication(null);
      setRejectionReasonInput('');
      setReviewerNotes('');
      fetchTabData();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // User Status Toggle (Suspend / Activate)
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const confirmMsg = `Are you sure you want to mark this user as ${newStatus}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason: 'Manual admin action' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to update user status');

      showToast(`User status updated to ${newStatus}.`);
      fetchTabData();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#132A24] flex font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-medium flex items-center gap-2.5 border transition-all ${
            toastMessage.isError
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50 border-emerald-200 text-[#2D5A46]'
          }`}
        >
          {toastMessage.isError ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-[#4E7A66] shrink-0" />
          )}
          {toastMessage.text}
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-white border-r border-[#132A24]/10 flex flex-col justify-between z-50 transition-transform duration-200 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-[#132A24]/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo-mark-transparent.png"
                alt="Ingress Within"
                className="w-8 h-8 object-contain"
              />
              <div>
                <div className="font-serif text-base font-semibold leading-tight tracking-tight text-[#132A24]">
                  ingress <span className="font-normal text-[#4E7A66]">within</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#4E7A66]">
                  Administrative Command
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-[#132A24]/60 hover:text-[#132A24]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation List */}
          <div className="overflow-y-auto max-h-[calc(100vh-170px)] p-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#132A24] text-white shadow-xs font-semibold'
                      : 'text-[#132A24]/70 hover:bg-[#132A24]/5 hover:text-[#132A24]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#132A24]/50'}`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span
                      className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#4E7A66]/15 text-[#2D5A46]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Operator Profile Footer */}
        <div className="p-4 border-t border-[#132A24]/10 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#132A24]/5 border border-[#132A24]/10 flex items-center justify-center font-serif font-bold text-xs text-[#132A24] shrink-0">
              {admin?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#132A24] truncate">
                {admin?.full_name || 'Founder'}
              </div>
              <div className="text-[10px] text-[#4E7A66] font-medium flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4E7A66]" />
                {admin?.role?.replace('_', ' ') || 'super admin'}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-2 rounded-xl text-[#132A24]/50 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/95 border-b border-[#132A24]/10 px-6 md:px-8 py-4 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-[#132A24]/70 hover:text-[#132A24] p-1 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-serif text-xl font-semibold text-[#132A24]">
                {navigationItems.find((n) => n.id === activeTab)?.label || 'Overview'}
              </h1>
              <p className="text-[11px] text-[#132A24]/50">Ingress Within Live Healthcare Operations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTabData}
              disabled={isLoading}
              title="Refresh Data"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#132A24]/15 text-xs text-[#132A24] hover:bg-[#132A24]/5 transition-all cursor-pointer shadow-xs font-medium"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#4E7A66]' : 'text-[#132A24]/60'}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full bg-[#4E7A66]/10 border border-[#4E7A66]/20 text-[#2D5A46] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4E7A66] animate-pulse" />
              Platform Active
            </div>
          </div>
        </header>

        {/* Tab Content Body */}
        <div className="p-6 md:p-8 flex-1 space-y-6 max-w-7xl w-full mx-auto">
          {/* ========================================================================= */}
          {/* TAB 1: COMMAND CENTER OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Range Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-lg font-semibold text-[#132A24]">
                    Platform Health & Key Performance Metrics
                  </h2>
                  <p className="text-xs text-[#132A24]/60">
                    Authoritative aggregation across platform ledger, clinical sessions, and payouts.
                  </p>
                </div>
                <div className="flex bg-white border border-[#132A24]/15 rounded-xl p-1 text-xs shadow-xs self-start sm:self-auto">
                  {['today', 'week', 'month', 'all'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setOverviewRange(r)}
                      className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                        overviewRange === r
                          ? 'bg-[#132A24] text-white font-medium shadow-xs'
                          : 'text-[#132A24]/60 hover:text-[#132A24]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* 12 Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs">
                  <div className="text-[11px] text-[#132A24]/50 font-semibold uppercase tracking-wider">
                    Gross Platform Revenue
                  </div>
                  <div className="text-2xl font-serif font-bold text-[#132A24] mt-1.5">
                    {formatInr(overviewMetrics?.grossRevenuePaise)}
                  </div>
                  <div className="text-[11px] text-[#4E7A66] mt-2 flex items-center gap-1 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Ledger Captured
                  </div>
                </div>

                <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs">
                  <div className="text-[11px] text-[#132A24]/50 font-semibold uppercase tracking-wider">
                    Platform Retained Fees
                  </div>
                  <div className="text-2xl font-serif font-bold text-[#2D5A46] mt-1.5">
                    {formatInr(overviewMetrics?.platformFeesPaise)}
                  </div>
                  <div className="text-[11px] text-[#132A24]/50 mt-2">Platform service commission</div>
                </div>

                <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs">
                  <div className="text-[11px] text-[#132A24]/50 font-semibold uppercase tracking-wider">
                    Therapist Net Earnings
                  </div>
                  <div className="text-2xl font-serif font-bold text-[#132A24] mt-1.5">
                    {formatInr(overviewMetrics?.therapistEarningsPaise)}
                  </div>
                  <div className="text-[11px] text-[#132A24]/50 mt-2">Earned clinician funds</div>
                </div>

                <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs">
                  <div className="text-[11px] text-[#132A24]/50 font-semibold uppercase tracking-wider">
                    Pending Payouts In-Flight
                  </div>
                  <div className="text-2xl font-serif font-bold text-amber-700 mt-1.5">
                    {formatInr(overviewMetrics?.pendingPayoutsPaise)}
                  </div>
                  <div className="text-[11px] text-amber-700/80 mt-2 font-medium">
                    Requested / RazorpayX clearing
                  </div>
                </div>

                <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs">
                  <div className="text-[11px] text-[#132A24]/50 font-semibold uppercase tracking-wider">
                    Total Registered Users
                  </div>
                  <div className="text-2xl font-serif font-bold text-[#132A24] mt-1.5">
                    {overviewMetrics?.totalUsers ?? 0}
                  </div>
                  <div className="text-[11px] text-[#132A24]/50 mt-2">All authenticated accounts</div>
                </div>

                <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs">
                  <div className="text-[11px] text-[#132A24]/50 font-semibold uppercase tracking-wider">
                    Active Therapists
                  </div>
                  <div className="text-2xl font-serif font-bold text-[#2D5A46] mt-1.5">
                    {overviewMetrics?.activeTherapists ?? 0}
                    <span className="text-xs text-[#132A24]/40 font-normal">
                      {' '}
                      / {overviewMetrics?.totalTherapists ?? 0} total
                    </span>
                  </div>
                  <div className="text-[11px] text-[#4E7A66] mt-2 font-medium">
                    Approved & authorized
                  </div>
                </div>

                <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs">
                  <div className="text-[11px] text-[#132A24]/50 font-semibold uppercase tracking-wider">
                    Pending Applications
                  </div>
                  <div className="text-2xl font-serif font-bold text-amber-800 mt-1.5">
                    {overviewMetrics?.pendingApplications ?? 0}
                  </div>
                  <div className="text-[11px] text-[#132A24]/50 mt-2">Awaiting clinical review</div>
                </div>

                <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs">
                  <div className="text-[11px] text-[#132A24]/50 font-semibold uppercase tracking-wider">
                    Completed Sessions
                  </div>
                  <div className="text-2xl font-serif font-bold text-[#132A24] mt-1.5">
                    {overviewMetrics?.completedSessions ?? 0}
                  </div>
                  <div className="text-[11px] text-[#132A24]/50 mt-2">
                    {overviewMetrics?.upcomingSessions ?? 0} upcoming scheduled
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: USER DIRECTORY */}
          {/* ========================================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[#132A24]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchTabData()}
                    className="w-full bg-white border border-[#132A24]/15 rounded-xl pl-10 pr-4 py-2 text-xs text-[#132A24] placeholder-[#132A24]/40 focus:outline-none focus:border-[#132A24] focus:ring-1 focus:ring-[#132A24]/20 transition-all shadow-xs"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white border border-[#132A24]/15 rounded-xl px-3.5 py-2 text-xs text-[#132A24] focus:outline-none focus:border-[#132A24] shadow-xs cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-[#132A24]/10 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#132A24]/[0.02] border-b border-[#132A24]/10 text-[#132A24]/60 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">User</th>
                        <th className="py-3.5 px-4">Phone</th>
                        <th className="py-3.5 px-4">Role</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Created Date</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#132A24]/5 text-[#132A24]">
                      {usersData.users.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-[#132A24]/40 italic">
                            No users found matching query.
                          </td>
                        </tr>
                      ) : (
                        usersData.users.map((u) => (
                          <tr key={u.id} className="hover:bg-[#132A24]/[0.02] transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-[#132A24]">
                                {u.name || 'Unnamed User'}
                              </div>
                              <div className="text-[10px] text-[#132A24]/40 font-mono">{u.id}</div>
                            </td>
                            <td className="py-3.5 px-4 font-mono">{u.phone_number}</td>
                            <td className="py-3.5 px-4">
                              <span className="capitalize px-2.5 py-0.5 rounded-full bg-[#132A24]/5 text-[#132A24]/80 text-[10px] font-medium border border-[#132A24]/10">
                                {u.role || 'client'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                                  u.account_status === 'active'
                                    ? 'bg-[#4E7A66]/10 border-[#4E7A66]/20 text-[#2D5A46]'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                                }`}
                              >
                                {u.account_status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#132A24]/60">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleToggleUserStatus(u.id, u.account_status)}
                                className="text-[11px] text-[#4E7A66] hover:text-[#132A24] font-semibold cursor-pointer transition-colors"
                              >
                                {u.account_status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: THERAPIST ROSTER */}
          {/* ========================================================================= */}
          {activeTab === 'therapists' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#132A24]/10 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#132A24]/[0.02] border-b border-[#132A24]/10 text-[#132A24]/60 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">Clinician</th>
                        <th className="py-3.5 px-4">Credentials & RCI</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Verification</th>
                        <th className="py-3.5 px-4">Can Practice</th>
                        <th className="py-3.5 px-4">Session Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#132A24]/5 text-[#132A24]">
                      {therapistsData.therapists.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-[#132A24]/40 italic">
                            No therapists found.
                          </td>
                        </tr>
                      ) : (
                        therapistsData.therapists.map((t) => (
                          <tr key={t.id} className="hover:bg-[#132A24]/[0.02] transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-[#132A24]">{t.full_name}</div>
                              <div className="text-[10px] text-[#132A24]/50">{t.phone_number}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div>{t.qualification || 'Clinical Psychologist'}</div>
                              <div className="text-[10px] text-[#132A24]/50">
                                {t.rci_registered
                                  ? `RCI: ${t.rci_number || 'Verified'}`
                                  : 'Not RCI Registered'}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="capitalize px-2.5 py-0.5 rounded-full bg-[#132A24]/5 border border-[#132A24]/10 text-[#132A24]/80 text-[10px] font-medium">
                                {t.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                                  t.verification_status === 'verified'
                                    ? 'bg-[#4E7A66]/10 border-[#4E7A66]/20 text-[#2D5A46]'
                                    : 'bg-amber-50 border-amber-200 text-amber-800'
                                }`}
                              >
                                {t.verification_status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {t.can_practice ? (
                                <span className="text-[#2D5A46] flex items-center gap-1 font-semibold">
                                  <Check className="w-3.5 h-3.5" /> Authorized
                                </span>
                              ) : (
                                <span className="text-rose-600 font-medium">Restricted</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-medium">₹{t.per_session_fee}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: APPLICATION QUEUE & CLINICAL VERIFICATION DOSSIER */}
          {/* ========================================================================= */}
          {activeTab === 'applications' && (
            <div className="space-y-5">
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#132A24]">
                    Therapist Application & Credentialing Queue
                  </h3>
                  <p className="text-xs text-[#132A24]/60">
                    Review submitted clinical qualifications, verify documents, and issue practice authorizations.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#132A24]/40" />
                    <input
                      type="text"
                      placeholder="Search name, phone, title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white border border-[#132A24]/15 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#132A24] placeholder-[#132A24]/30 focus:outline-none focus:border-[#4E7A66] w-48 sm:w-64"
                    />
                  </div>
                  <button
                    onClick={() => fetchTabData()}
                    className="p-2 bg-white border border-[#132A24]/15 rounded-xl text-[#132A24]/70 hover:text-[#132A24] cursor-pointer shadow-xs"
                    title="Refresh Applications"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Status Tabs Filter */}
              <div className="flex items-center gap-2 border-b border-[#132A24]/10 pb-2 overflow-x-auto text-xs font-medium">
                {[
                  { id: 'all', label: 'All Applications' },
                  { id: 'pending', label: 'Pending Review' },
                  { id: 'under_review', label: 'Under Review' },
                  { id: 'approved', label: 'Approved' },
                  { id: 'rejected', label: 'Rejected' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setApplicationStatusFilter(st.id);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                      applicationStatusFilter === st.id
                        ? 'bg-[#132A24] text-white font-semibold'
                        : 'text-[#132A24]/60 hover:text-[#132A24] hover:bg-[#132A24]/5'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Applications Table / Cards */}
              {applications.length === 0 ? (
                <div className="bg-white border border-[#132A24]/10 rounded-2xl p-12 text-center text-[#132A24]/50 text-xs shadow-xs space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#4E7A66] mx-auto mb-1" />
                  <div className="font-semibold text-sm text-[#132A24]">No Applications Found</div>
                  <div>No therapist applications match the current filter or search criteria.</div>
                </div>
              ) : (
                <div className="bg-white border border-[#132A24]/10 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#132A24]/[0.02] border-b border-[#132A24]/10 text-[#132A24]/60 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">Applicant</th>
                        <th className="py-3.5 px-4">Credentials & RCI</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Verification</th>
                        <th className="py-3.5 px-4">Documents</th>
                        <th className="py-3.5 px-4">Submitted</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#132A24]/5">
                      {applications.map((app) => (
                        <tr key={app.therapistAccountId} className="hover:bg-[#132A24]/[0.01] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#132A24] text-sm">
                              {app.full_name || 'Clinician'}
                            </div>
                            <div className="text-[#132A24]/50 text-[11px]">
                              {app.title || 'Applicant'} &bull; {app.experience_years || 0} yrs exp
                            </div>
                            <div className="text-[#132A24]/40 text-[10px] mt-0.5 font-mono">
                              {app.phone_number} {app.email ? `• ${app.email}` : ''}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-[#132A24]/80 font-medium">
                              {app.qualification || 'Not specified'}
                            </div>
                            <div className="text-[11px] text-[#132A24]/50 mt-0.5">
                              {app.rci_registered ? (
                                <span className="inline-flex items-center gap-1 text-[#2D5A46] font-medium">
                                  <ShieldCheck className="w-3 h-3" /> RCI Registered ({app.rci_number || 'Yes'})
                                </span>
                              ) : (
                                <span className="text-[#132A24]/40">Non-RCI Registered</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              app.application_status === 'approved'
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                                : app.application_status === 'rejected'
                                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                                : 'bg-amber-50 border border-amber-200 text-amber-800'
                            }`}>
                              {app.application_status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                              app.verification_status === 'verified'
                                ? 'bg-[#4E7A66]/10 border-[#4E7A66]/20 text-[#2D5A46]'
                                : app.verification_status === 'rejected'
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : 'bg-amber-50 border-amber-200 text-amber-800'
                            }`}>
                              {app.verification_status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[#132A24]/70 font-mono text-[11px]">
                              {app.documents_count || 0} attached
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#132A24]/60 text-[11px]">
                            {app.submitted_at
                              ? new Date(app.submitted_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Pending'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleOpenApplicationDetail(app.therapistAccountId)}
                              className="bg-[#132A24] hover:bg-[#132A24]/90 text-white text-xs font-semibold py-1.5 px-3.5 rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" /> Review Dossier
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {applicationsData?.pagination && applicationsData.pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-[#132A24]/10 flex items-center justify-between text-xs text-[#132A24]/60">
                      <div>
                        Page {applicationsData.pagination.page} of {applicationsData.pagination.totalPages} ({applicationsData.pagination.totalCount} total)
                      </div>
                      <div className="flex gap-2">
                        <button
                          disabled={applicationsData.pagination.page <= 1}
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className="px-3 py-1 bg-white border border-[#132A24]/15 rounded-lg disabled:opacity-30 cursor-pointer"
                        >
                          Previous
                        </button>
                        <button
                          disabled={applicationsData.pagination.page >= applicationsData.pagination.totalPages}
                          onClick={() => setCurrentPage((p) => p + 1)}
                          className="px-3 py-1 bg-white border border-[#132A24]/15 rounded-lg disabled:opacity-30 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* SLIDE-OVER / FULL CLINICAL VERIFICATION DOSSIER DRAWER */}
              {/* ========================================================================= */}
              {(selectedApplicationDetail || isLoadingDetail) && (
                <div className="fixed inset-0 z-50 bg-black/40 flex justify-end backdrop-blur-xs">
                  <div className="bg-[#FAFAF8] w-full max-w-4xl h-full shadow-2xl flex flex-col border-l border-[#132A24]/10 overflow-hidden">
                    {/* Drawer Header */}
                    <div className="p-6 bg-white border-b border-[#132A24]/10 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#132A24]/5 border border-[#132A24]/10 flex items-center justify-center text-[#132A24] font-serif font-bold text-lg overflow-hidden">
                          {selectedApplicationDetail?.basicInfo?.photoUrl ? (
                            <img
                              src={selectedApplicationDetail.basicInfo.photoUrl}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            selectedApplicationDetail?.basicInfo?.fullName?.charAt(0) || 'C'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-serif font-bold text-xl text-[#132A24]">
                              {selectedApplicationDetail?.basicInfo?.fullName || 'Clinician Application'}
                            </h2>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              selectedApplicationDetail?.applicationMeta?.applicationStatus === 'approved'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : selectedApplicationDetail?.applicationMeta?.applicationStatus === 'rejected'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {selectedApplicationDetail?.applicationMeta?.applicationStatus || 'Pending'}
                            </span>
                          </div>
                          <div className="text-xs text-[#132A24]/60">
                            {selectedApplicationDetail?.professionalInfo?.title || 'Psychologist'} &bull; {selectedApplicationDetail?.basicInfo?.phone} &bull; {selectedApplicationDetail?.basicInfo?.email}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedApplicationDetail(null)}
                        className="p-2 text-[#132A24]/50 hover:text-[#132A24] rounded-xl hover:bg-[#132A24]/5 transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Drawer Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {isLoadingDetail ? (
                        <div className="py-24 text-center space-y-3">
                          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#4E7A66]" />
                          <div className="text-xs font-semibold uppercase tracking-widest text-[#132A24]/60">
                            Loading Full Clinical Dossier...
                          </div>
                        </div>
                      ) : selectedApplicationDetail ? (
                        <>
                          {/* Readiness & Safety Clearance Banner */}
                          <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                            selectedApplicationDetail.readinessChecklist?.readyForApproval
                              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                              : 'bg-amber-50/80 border-amber-200 text-amber-950'
                          }`}>
                            <div className="flex items-center gap-3">
                              {selectedApplicationDetail.readinessChecklist?.readyForApproval ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                              )}
                              <div>
                                <span className="font-semibold block">
                                  {selectedApplicationDetail.readinessChecklist?.readyForApproval
                                    ? 'Platform Readiness: Complete & Eligible for Review'
                                    : 'Platform Readiness: Pending Credentials or Verification'}
                                </span>
                                <span className="text-[11px] opacity-80">
                                  {selectedApplicationDetail.readinessChecklist?.readyForApproval
                                    ? 'All mandatory identity documents, qualifications, and ethical declarations are in order.'
                                    : 'Carefully verify uploaded certificates and declarations below before deciding.'}
                                </span>
                              </div>
                            </div>
                            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/70 border border-current">
                              Can Practice: {selectedApplicationDetail.applicationMeta?.canPractice ? 'YES' : 'NO'}
                            </span>
                          </div>

                          {/* Rejection notice if previously rejected */}
                          {selectedApplicationDetail.applicationMeta?.rejectionReason && (
                            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1">
                              <div className="flex items-center gap-2 font-semibold text-rose-900">
                                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                                <span>Recorded Rejection Reason</span>
                              </div>
                              <p className="text-rose-900/90 text-xs font-sans whitespace-pre-wrap pl-6">
                                {selectedApplicationDetail.applicationMeta.rejectionReason}
                              </p>
                            </div>
                          )}

                          {/* SECTION 1: BASIC INFORMATION */}
                          <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs space-y-3">
                            <h4 className="font-serif font-bold text-sm text-[#132A24] border-b border-[#132A24]/10 pb-2 flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-[#4E7A66]" /> 1. Basic Information
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                              <div>
                                <span className="text-[#132A24]/40 font-medium block">Full Legal Name</span>
                                <span className="font-semibold text-[#132A24]">
                                  {selectedApplicationDetail.basicInfo?.fullName || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#132A24]/40 font-medium block">Email Address</span>
                                <span className="text-[#132A24]">
                                  {selectedApplicationDetail.basicInfo?.email || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#132A24]/40 font-medium block">Phone Number</span>
                                <span className="font-mono text-[#132A24]">
                                  {selectedApplicationDetail.basicInfo?.phone || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#132A24]/40 font-medium block">Location</span>
                                <span className="text-[#132A24]">
                                  {selectedApplicationDetail.basicInfo?.city || ''}
                                  {selectedApplicationDetail.basicInfo?.state ? `, ${selectedApplicationDetail.basicInfo.state}` : 'Not provided'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#132A24]/40 font-medium block">Timezone</span>
                                <span className="text-[#132A24]">
                                  {selectedApplicationDetail.basicInfo?.timezone || 'Asia/Kolkata'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#132A24]/40 font-medium block">Account Created</span>
                                <span className="text-[#132A24]">
                                  {selectedApplicationDetail.basicInfo?.createdAt
                                    ? new Date(selectedApplicationDetail.basicInfo.createdAt).toLocaleDateString('en-IN')
                                    : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* SECTION 2: PROFESSIONAL INFORMATION */}
                          <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs space-y-4">
                            <h4 className="font-serif font-bold text-sm text-[#132A24] border-b border-[#132A24]/10 pb-2 flex items-center gap-2">
                              <HeartHandshake className="w-4 h-4 text-[#4E7A66]" /> 2. Professional Profile & Practice
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                              <div>
                                <span className="text-[#132A24]/40 font-medium block">Professional Title</span>
                                <span className="font-semibold text-[#132A24]">
                                  {selectedApplicationDetail.professionalInfo?.title || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#132A24]/40 font-medium block">Years of Experience</span>
                                <span className="font-semibold text-[#132A24]">
                                  {selectedApplicationDetail.professionalInfo?.yearsOfExperience || 0} years
                                </span>
                              </div>
                              <div>
                                <span className="text-[#132A24]/40 font-medium block">Languages</span>
                                <span className="text-[#132A24]">
                                  {selectedApplicationDetail.professionalInfo?.languages?.join(', ') || 'English'}
                                </span>
                              </div>
                            </div>

                            {selectedApplicationDetail.professionalInfo?.bio && (
                              <div className="text-xs space-y-1">
                                <span className="text-[#132A24]/40 font-medium block">Professional Bio</span>
                                <p className="text-[#132A24]/80 leading-relaxed bg-[#FAFAF8] p-3 rounded-xl border border-[#132A24]/10 italic">
                                  "{selectedApplicationDetail.professionalInfo.bio}"
                                </p>
                              </div>
                            )}

                            <div className="space-y-2 text-xs">
                              <span className="text-[#132A24]/40 font-medium block">Specializations</span>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedApplicationDetail.professionalInfo?.specializations?.map((s) => (
                                  <span key={s} className="px-2 py-0.5 rounded-full bg-[#132A24]/5 border border-[#132A24]/10 text-[#132A24] text-[11px]">
                                    {s}
                                  </span>
                                )) || <span className="text-[#132A24]/40 italic">None specified</span>}
                              </div>
                            </div>

                            <div className="space-y-2 text-xs">
                              <span className="text-[#132A24]/40 font-medium block">Therapeutic Modalities & Approaches</span>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedApplicationDetail.professionalInfo?.modalities?.map((m) => (
                                  <span
                                    key={m}
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                      selectedApplicationDetail.professionalInfo?.primaryModalities?.includes(m)
                                        ? 'bg-[#4E7A66]/15 border-[#4E7A66]/30 text-[#132A24] font-semibold'
                                        : 'bg-white border-[#132A24]/10 text-[#132A24]/70'
                                    }`}
                                  >
                                    {m} {selectedApplicationDetail.professionalInfo?.primaryModalities?.includes(m) ? '★ (Primary)' : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* SECTION 3 & 4: CREDENTIALS, LICENSURE & EDUCATION */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* SECTION 3: Education */}
                            <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs space-y-3">
                              <h4 className="font-serif font-bold text-sm text-[#132A24] border-b border-[#132A24]/10 pb-2 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-[#4E7A66]" /> 3. Education & Degrees
                              </h4>
                              {selectedApplicationDetail.education?.length > 0 ? (
                                <div className="space-y-2 text-xs">
                                  {selectedApplicationDetail.education.map((deg, idx) => (
                                    <div key={idx} className="p-2.5 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10">
                                      <div className="font-semibold text-[#132A24]">{deg.degree || deg.qualification}</div>
                                      <div className="text-[11px] text-[#132A24]/60">{deg.institution || 'University / Board'} {deg.year ? `(${deg.year})` : ''}</div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-[#132A24]/50 italic">
                                  {selectedApplicationDetail.professionalInfo?.qualification || 'No explicit degrees recorded.'}
                                </div>
                              )}
                            </div>

                            {/* SECTION 4: Professional Credentials & Licensure */}
                            <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs space-y-3">
                              <h4 className="font-serif font-bold text-sm text-[#132A24] border-b border-[#132A24]/10 pb-2 flex items-center gap-2">
                                <Award className="w-4 h-4 text-[#4E7A66]" /> 4. Licensure & RCI Registry
                              </h4>
                              <div className="space-y-2 text-xs">
                                <div>
                                  <span className="text-[#132A24]/40 font-medium block">Issuing Authority</span>
                                  <span className="font-semibold text-[#132A24]">
                                    {selectedApplicationDetail.credentials?.issuingBody || 'Not specified'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[#132A24]/40 font-medium block">License / Registration Number</span>
                                  <span className="font-mono font-semibold text-[#132A24]">
                                    {selectedApplicationDetail.credentials?.licenseNumber || 'None provided'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[#132A24]/40 font-medium block">RCI Status</span>
                                  <span className="font-semibold text-[#132A24]">
                                    {selectedApplicationDetail.credentials?.rciRegistered
                                      ? `Registered (${selectedApplicationDetail.credentials?.rciNumber || 'Verified'})`
                                      : 'Not RCI registered'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* SECTION 5: VERIFICATION DOCUMENTS */}
                          <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-[#132A24]/10 pb-2">
                              <h4 className="font-serif font-bold text-sm text-[#132A24] flex items-center gap-2">
                                <FileCheck className="w-4 h-4 text-[#4E7A66]" /> 5. Verification Documents
                              </h4>
                              <span className="text-[11px] text-[#132A24]/50">
                                Stored in private bucket &bull; 1-Hour Ephemeral Signed URLs
                              </span>
                            </div>

                            {selectedApplicationDetail.documents?.length === 0 ? (
                              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900">
                                No verification documents have been attached to this application yet.
                              </div>
                            ) : (
                              <div className="divide-y divide-[#132A24]/10 border border-[#132A24]/10 rounded-xl overflow-hidden">
                                {selectedApplicationDetail.documents.map((doc, idx) => (
                                  <div key={idx} className="p-3.5 flex items-center justify-between bg-white hover:bg-[#FAFAF8] transition-colors text-xs">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-[#132A24]/5 flex items-center justify-center text-[#132A24]">
                                        <FileText className="w-4 h-4 text-[#4E7A66]" />
                                      </div>
                                      <div>
                                        <div className="font-semibold text-[#132A24] capitalize">
                                          {doc.name || doc.type?.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-[10px] text-[#132A24]/50 font-mono">
                                          Type: {doc.type} {doc.isPrimary ? '• Primary Credential' : ''}
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      disabled={signedUrlLoading === doc.path}
                                      onClick={() => handleViewDocument(doc.path)}
                                      className="bg-white hover:bg-[#132A24]/5 border border-[#132A24]/20 text-[#132A24] font-medium py-1.5 px-3 rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                      {signedUrlLoading === doc.path ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Download className="w-3.5 h-3.5 text-[#4E7A66]" />
                                      )}
                                      View / Download
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* SECTION 6: PRACTICE DETAILS & CASELOAD */}
                          <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs space-y-3">
                            <h4 className="font-serif font-bold text-sm text-[#132A24] border-b border-[#132A24]/10 pb-2 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-[#4E7A66]" /> 6. Practice Logistics & Capacity
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                              <div>
                                <span className="text-[#132A24]/40 font-medium block">Per-Session Fee</span>
                                <span className="font-semibold font-mono text-[#132A24]">
                                  ₹{selectedApplicationDetail.practiceInfo?.feePerSession || 1500}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#132A24]/40 font-medium block">Capacity (Current / Max)</span>
                                <span className="font-semibold text-[#132A24]">
                                  {selectedApplicationDetail.practiceInfo?.currentCapacity || 0} / {selectedApplicationDetail.practiceInfo?.maxCapacity || 0} clients
                                </span>
                              </div>
                              <div>
                                <span className="text-[#132A24]/40 font-medium block">Soonest Opening</span>
                                <span className="text-[#132A24]">
                                  {selectedApplicationDetail.practiceInfo?.soonestOpeningDays ?? 'N/A'} days
                                </span>
                              </div>
                              <div>
                                <span className="text-[#132A24]/40 font-medium block">Severity Ceiling</span>
                                <span className="text-[#132A24]">
                                  Level {selectedApplicationDetail.practiceInfo?.severityCeiling || 3} of 5
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* SECTION 7: PLATFORM READINESS CHECKLIST */}
                          <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs space-y-3">
                            <h4 className="font-serif font-bold text-sm text-[#132A24] border-b border-[#132A24]/10 pb-2 flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-[#4E7A66]" /> 7. Platform Readiness & Ethics Audit
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {[
                                { label: 'Basic Profile Completed', value: selectedApplicationDetail.readinessChecklist?.profileCompleted },
                                { label: 'Credentials & Licensure Declared', value: selectedApplicationDetail.readinessChecklist?.credentialsProvided },
                                { label: 'Verification Documents Uploaded', value: selectedApplicationDetail.readinessChecklist?.documentsUploaded },
                                { label: 'Ethics & Privacy Code Accepted', value: selectedApplicationDetail.readinessChecklist?.ethicsAccepted },
                                { label: 'Truthfulness Confirmed', value: selectedApplicationDetail.readinessChecklist?.truthfulnessConfirmed },
                                { label: 'Background Check Consent', value: selectedApplicationDetail.readinessChecklist?.backgroundCheckConsent },
                                { label: 'Supervision Path Compliant', value: selectedApplicationDetail.readinessChecklist?.supervisionCompliant },
                                { label: 'Payout Account Configured', value: selectedApplicationDetail.readinessChecklist?.payoutAccountReady },
                              ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10">
                                  <span className="text-[#132A24]/80">{item.label}</span>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    item.value ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {item.value ? 'COMPLIANT' : 'PENDING'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* SECTION 8: REVIEW HISTORY & AUDIT TRAIL */}
                          {selectedApplicationDetail.reviewHistory?.length > 0 && (
                            <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs space-y-3">
                              <h4 className="font-serif font-bold text-sm text-[#132A24] border-b border-[#132A24]/10 pb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#4E7A66]" /> 8. Historical Review Audit Trail
                              </h4>
                              <div className="space-y-2 text-xs">
                                {selectedApplicationDetail.reviewHistory.map((rev, idx) => (
                                  <div key={idx} className="p-3 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold uppercase text-[10px] tracking-wider text-[#132A24]">
                                        Action: {rev.action} ({rev.previousStatus || 'none'} → {rev.newStatus})
                                      </span>
                                      <span className="text-[10px] text-[#132A24]/40 font-mono">
                                        {new Date(rev.createdAt).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                    {rev.notes && (
                                      <div className="text-[#132A24]/70 text-[11px]">Notes: {rev.notes}</div>
                                    )}
                                    {rev.rejectionReason && (
                                      <div className="text-rose-700 font-medium text-[11px]">Reason: {rev.rejectionReason}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : null}
                    </div>

                    {/* Sticky Action Footer */}
                    {selectedApplicationDetail && (
                      <div className="p-4 bg-white border-t border-[#132A24]/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                        <div className="w-full sm:w-1/2">
                          <input
                            type="text"
                            placeholder="Operational reviewer notes (audit logged)..."
                            value={reviewerNotes}
                            onChange={(e) => setReviewerNotes(e.target.value)}
                            className="w-full bg-[#FAFAF8] border border-[#132A24]/15 rounded-xl px-3 py-2 text-xs text-[#132A24] placeholder-[#132A24]/30 focus:outline-none focus:border-[#4E7A66]"
                          />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => setShowRejectModal(true)}
                            className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold py-2 px-4 rounded-xl cursor-pointer transition-colors"
                          >
                            Reject Application
                          </button>
                          <button
                            onClick={() => setShowApproveModal(true)}
                            className="bg-[#4E7A66] hover:bg-[#3D6353] text-white text-xs font-semibold py-2 px-5 rounded-xl cursor-pointer shadow-xs transition-colors inline-flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve & Authorize
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* APPROVE CONFIRMATION MODAL */}
              {/* ========================================================================= */}
              {showApproveModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
                  <div className="bg-white border border-[#132A24]/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-base text-[#132A24]">
                          Approve Practice Authorization
                        </h4>
                        <p className="text-xs text-[#132A24]/60">
                          {selectedApplicationDetail?.basicInfo?.fullName}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-[#132A24]/70 leading-relaxed bg-[#FAFAF8] p-3 rounded-xl border border-[#132A24]/10">
                      Authorizing practice will activate this therapist's account, enable client discovery, allow session booking, and provision their clinical caseload workspace.
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setShowApproveModal(false)}
                        className="px-4 py-2 rounded-xl border border-[#132A24]/15 text-xs text-[#132A24]/70 hover:text-[#132A24] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={isSubmittingReview}
                        onClick={handleConfirmApprove}
                        className="bg-[#4E7A66] hover:bg-[#3D6353] text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingReview ? 'Authorizing...' : 'Confirm Approval'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* REJECT MODAL WITH MANDATORY OPERATIONAL REASON */}
              {/* ========================================================================= */}
              {showRejectModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
                  <div className="bg-white border border-[#132A24]/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-base text-[#132A24]">
                          Reject Therapist Application
                        </h4>
                        <p className="text-xs text-[#132A24]/60">
                          {selectedApplicationDetail?.basicInfo?.fullName}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <label className="font-semibold text-[#132A24] block">
                        Operational Rejection Reason <span className="text-rose-600">*</span>
                      </label>
                      <p className="text-[11px] text-[#132A24]/50 leading-relaxed">
                        This feedback will be presented to the applicant so they understand required document changes before resubmitting.
                      </p>
                      <textarea
                        rows="3"
                        value={rejectionReasonInput}
                        onChange={(e) => setRejectionReasonInput(e.target.value)}
                        placeholder="e.g. Uploaded degree certificate is illegible. Please re-upload a clear copy of your Master's degree."
                        className="w-full bg-[#FAFAF8] border border-[#132A24]/15 rounded-xl p-3 text-xs text-[#132A24] placeholder-[#132A24]/30 focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setShowRejectModal(false)}
                        className="px-4 py-2 rounded-xl border border-[#132A24]/15 text-xs text-[#132A24]/70 hover:text-[#132A24] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={isSubmittingReview || !rejectionReasonInput || rejectionReasonInput.trim().length < 5}
                        onClick={handleConfirmReject}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingReview ? 'Declining...' : 'Confirm Rejection'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: CLIENT MANAGEMENT */}
          {/* ========================================================================= */}
          {activeTab === 'clients' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#132A24]/10 rounded-2xl p-4 text-xs text-[#132A24]/80 flex items-center gap-3 shadow-xs">
                <Shield className="w-5 h-5 text-[#4E7A66] shrink-0" />
                <span>
                  <strong className="text-[#132A24]">Clinical Privacy Shield:</strong> Client records are presented with strict least privilege. Patient SOAP notes, journal entries, and homework reflections remain strictly confidential between client and clinician.
                </span>
              </div>

              <div className="bg-white border border-[#132A24]/10 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#132A24]/[0.02] border-b border-[#132A24]/10 text-[#132A24]/60 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Client ID</th>
                      <th className="py-3.5 px-4">Name</th>
                      <th className="py-3.5 px-4">Phone Number</th>
                      <th className="py-3.5 px-4">Account Status</th>
                      <th className="py-3.5 px-4">Registered Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#132A24]/5 text-[#132A24]">
                    {clientsData.clients.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-[#132A24]/40 italic">
                          No client records found.
                        </td>
                      </tr>
                    ) : (
                      clientsData.clients.map((c) => (
                        <tr key={c.id} className="hover:bg-[#132A24]/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#132A24]/50">{c.id}</td>
                          <td className="py-3.5 px-4 font-semibold text-[#132A24]">
                            {c.name || 'Client User'}
                          </td>
                          <td className="py-3.5 px-4 font-mono">{c.phone_number}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#4E7A66]/10 border border-[#4E7A66]/20 text-[#2D5A46] text-[10px] font-medium">
                              {c.account_status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#132A24]/60">
                            {new Date(c.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: CLINICAL SESSIONS */}
          {/* ========================================================================= */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#132A24]/10 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#132A24]/[0.02] border-b border-[#132A24]/10 text-[#132A24]/60 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Session Time</th>
                      <th className="py-3.5 px-4">Therapist ID</th>
                      <th className="py-3.5 px-4">Client ID</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Payment</th>
                      <th className="py-3.5 px-4">Google Meet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#132A24]/5 text-[#132A24]">
                    {sessionsData.sessions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-[#132A24]/40 italic">
                          No sessions found.
                        </td>
                      </tr>
                    ) : (
                      sessionsData.sessions.map((s) => (
                        <tr key={s.id} className="hover:bg-[#132A24]/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-medium text-[#132A24]">
                            {new Date(s.session_time).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#132A24]/50">
                            {s.therapist_account_id?.substring(0, 12)}...
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#132A24]/50">
                            {s.client_id?.substring(0, 12)}...
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="capitalize px-2.5 py-0.5 rounded-full bg-[#132A24]/5 border border-[#132A24]/10 text-[#132A24]/80 text-[10px] font-medium">
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="capitalize px-2.5 py-0.5 rounded-full bg-[#4E7A66]/10 border border-[#4E7A66]/20 text-[#2D5A46] text-[10px] font-medium">
                              {s.payment_status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {s.meet_link ? (
                              <a
                                href={s.meet_link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#4E7A66] hover:text-[#132A24] font-medium flex items-center gap-1 transition-colors"
                              >
                                Join <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[#132A24]/30">Pending sync</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: REVENUE & ORDERS */}
          {/* ========================================================================= */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#132A24]/10 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#132A24]/[0.02] border-b border-[#132A24]/10 text-[#132A24]/60 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Order ID</th>
                      <th className="py-3.5 px-4">User ID</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Provider Reference</th>
                      <th className="py-3.5 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#132A24]/5 text-[#132A24]">
                    {paymentsData.payments.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-[#132A24]/40 italic">
                          No payment orders found.
                        </td>
                      </tr>
                    ) : (
                      paymentsData.payments.map((p) => (
                        <tr key={p.id} className="hover:bg-[#132A24]/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-mono font-medium text-[#132A24]">{p.id}</td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#132A24]/50">
                            {p.user_id?.substring(0, 12)}...
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#2D5A46]">
                            {formatInr(p.amount_total_paise)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="capitalize px-2.5 py-0.5 rounded-full bg-[#132A24]/5 border border-[#132A24]/10 text-[#132A24]/80 text-[10px] font-medium">
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#132A24]/60">
                            {p.provider_payment_id || 'N/A'}
                          </td>
                          <td className="py-3.5 px-4 text-[#132A24]/60">
                            {new Date(p.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: THERAPIST PAYOUTS */}
          {/* ========================================================================= */}
          {activeTab === 'payouts' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#132A24]/10 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#132A24]/[0.02] border-b border-[#132A24]/10 text-[#132A24]/60 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Request ID</th>
                      <th className="py-3.5 px-4">Therapist ID</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">UTR Number</th>
                      <th className="py-3.5 px-4">Requested Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#132A24]/5 text-[#132A24]">
                    {payoutsData.payouts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-[#132A24]/40 italic">
                          No therapist withdrawal requests recorded.
                        </td>
                      </tr>
                    ) : (
                      payoutsData.payouts.map((w) => (
                        <tr key={w.id} className="hover:bg-[#132A24]/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-mono font-medium text-[#132A24]">{w.id}</td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#132A24]/50">
                            {w.therapist_account_id?.substring(0, 12)}...
                          </td>
                          <td className="py-3.5 px-4 font-serif font-bold text-[#132A24]">
                            ₹{w.amount_inr}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium capitalize border ${
                                w.status === 'completed'
                                  ? 'bg-[#4E7A66]/10 border-[#4E7A66]/20 text-[#2D5A46]'
                                  : w.status === 'failed'
                                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                                  : 'bg-amber-50 border-amber-200 text-amber-800'
                              }`}
                            >
                              {w.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#132A24]/60">
                            {w.utr_number || 'Pending'}
                          </td>
                          <td className="py-3.5 px-4 text-[#132A24]/60">
                            {new Date(w.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 9: API USAGE & TRAFFIC */}
          {/* ========================================================================= */}
          {activeTab === 'api-usage' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {apiUsageData.summaries.map((s) => (
                  <div
                    key={s.provider}
                    className="bg-white border border-[#132A24]/10 rounded-2xl p-5 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-serif font-semibold text-[#132A24] text-base capitalize">
                        {s.provider.replace('_', ' ')}
                      </div>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium border ${
                          s.isTracked
                            ? 'bg-[#4E7A66]/10 border-[#4E7A66]/20 text-[#2D5A46]'
                            : 'bg-[#132A24]/5 border-[#132A24]/10 text-[#132A24]/50'
                        }`}
                      >
                        {s.isTracked ? 'Tracked' : 'Not Tracked'}
                      </span>
                    </div>
                    <div className="text-xs text-[#132A24]/60">{s.service}</div>
                    {s.isTracked ? (
                      <div className="space-y-1.5 pt-3 border-t border-[#132A24]/10 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#132A24]/50">Total Requests:</span>
                          <span className="font-semibold text-[#132A24]">{s.totalRequests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#132A24]/50">Success Rate:</span>
                          <span className="font-semibold text-[#2D5A46]">{s.successRatePercent}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#132A24]/50">Avg Latency:</span>
                          <span className="font-mono text-[#132A24]/80">{s.avgLatencyMs} ms</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-[#132A24]/40 italic pt-3 border-t border-[#132A24]/10">
                        Usage data not currently tracked
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 10: SYSTEM HEALTH */}
          {/* ========================================================================= */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#132A24]/10 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-lg font-semibold text-[#132A24]">
                    Live Infrastructure Diagnostics
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                      systemHealth?.systemHealth?.status === 'healthy'
                        ? 'bg-[#4E7A66]/10 border-[#4E7A66]/20 text-[#2D5A46]'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    Status: {systemHealth?.systemHealth?.status || 'Active'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {systemHealth?.systemHealth?.checks &&
                    Object.entries(systemHealth.systemHealth.checks).map(([key, check]) => (
                      <div
                        key={key}
                        className="bg-[#FAFAF8] border border-[#132A24]/10 rounded-xl p-4 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-serif font-semibold text-xs text-[#132A24] capitalize">
                            {key.replace('_', ' ')}
                          </div>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium border ${
                              check.status === 'healthy'
                                ? 'bg-[#4E7A66]/10 border-[#4E7A66]/20 text-[#2D5A46]'
                                : check.status === 'degraded'
                                ? 'bg-amber-50 border-amber-200 text-amber-800'
                                : 'bg-[#132A24]/5 border-[#132A24]/10 text-[#132A24]/50'
                            }`}
                          >
                            {check.status}
                          </span>
                        </div>
                        <div className="text-xs text-[#132A24]/60">{check.message}</div>
                        {check.latencyMs && (
                          <div className="text-[10px] font-mono text-[#4E7A66] font-semibold">
                            Latency: {check.latencyMs}ms
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 11: WEBHOOK MONITOR */}
          {/* ========================================================================= */}
          {activeTab === 'webhooks' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#132A24]/10 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#132A24]/[0.02] border-b border-[#132A24]/10 text-[#132A24]/60 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Event ID</th>
                      <th className="py-3.5 px-4">Provider</th>
                      <th className="py-3.5 px-4">Event Type</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Received Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#132A24]/5 text-[#132A24]">
                    {webhooksData.webhooks.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-[#132A24]/40 italic">
                          No webhook events recorded.
                        </td>
                      </tr>
                    ) : (
                      webhooksData.webhooks.map((w) => (
                        <tr key={w.id} className="hover:bg-[#132A24]/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-mono font-medium text-[#132A24]">
                            {w.event_id}
                          </td>
                          <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-[#4E7A66]">
                            {w.provider}
                          </td>
                          <td className="py-3.5 px-4 font-mono">{w.event_type}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#4E7A66]/10 border border-[#4E7A66]/20 text-[#2D5A46] text-[10px] font-medium">
                              {w.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#132A24]/60">
                            {new Date(w.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 12: AUDIT TRAIL */}
          {/* ========================================================================= */}
          {activeTab === 'audit-logs' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#132A24]/10 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#132A24]/[0.02] border-b border-[#132A24]/10 text-[#132A24]/60 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Timestamp</th>
                      <th className="py-3.5 px-4">Actor</th>
                      <th className="py-3.5 px-4">Action</th>
                      <th className="py-3.5 px-4">Entity</th>
                      <th className="py-3.5 px-4">Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#132A24]/5 text-[#132A24]">
                    {auditLogsData.logs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-[#132A24]/40 italic">
                          No audit log entries recorded.
                        </td>
                      </tr>
                    ) : (
                      auditLogsData.logs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#132A24]/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#132A24]/60">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#132A24]">{log.actor_type}</div>
                            <div className="text-[10px] font-mono text-[#132A24]/40">{log.actor_id}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-[#4E7A66] font-semibold">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#132A24]/70">
                            {log.entity_type}{' '}
                            {log.entity_id ? `(${log.entity_id.substring(0, 8)}...)` : ''}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[10px] text-[#132A24]/50 max-w-xs truncate">
                            {JSON.stringify(log.metadata)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 13: ADMIN SECURITY */}
          {/* ========================================================================= */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#132A24]/10 rounded-2xl p-5 flex items-start gap-3 text-xs text-[#132A24]/80 shadow-xs">
                <Shield className="w-5 h-5 text-[#4E7A66] shrink-0 mt-0.5" />
                <div>
                  <div className="font-serif font-bold text-[#132A24] text-sm mb-1">
                    Administrative Account Governance
                  </div>
                  <p className="leading-relaxed">
                    Administrators are provisioned exclusively through secure backend database operations. There is no public registration or self-service admin promotion interface.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#132A24]/10 rounded-2xl p-6 space-y-4 shadow-xs">
                <h3 className="font-serif text-base font-semibold text-[#132A24]">
                  Active Administrator Accounts
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#132A24]/[0.02] border-b border-[#132A24]/10 text-[#132A24]/60 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-3">Full Name</th>
                        <th className="py-3 px-3">Email</th>
                        <th className="py-3 px-3">Role</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Last Login</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#132A24]/5 text-[#132A24]">
                      {securityData.admins.map((adm) => (
                        <tr key={adm.id} className="hover:bg-[#132A24]/[0.02] transition-colors">
                          <td className="py-3 px-3 font-semibold text-[#132A24]">{adm.full_name}</td>
                          <td className="py-3 px-3 font-mono text-[#132A24]/70">{adm.email}</td>
                          <td className="py-3 px-3 font-mono text-[#4E7A66] font-semibold">{adm.role}</td>
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#4E7A66]/10 border border-[#4E7A66]/20 text-[#2D5A46] text-[10px] font-medium">
                              {adm.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#132A24]/60">
                            {adm.last_login_at
                              ? new Date(adm.last_login_at).toLocaleString()
                              : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
