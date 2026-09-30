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

  // Modals
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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
        const res = await fetch(`/api/admin/users?page=${currentPage}&limit=15&search=${encodeURIComponent(searchQuery)}&status=${statusFilter}`);
        const data = await res.json();
        if (data.success) setUsersData(data);
      } else if (activeTab === 'therapists') {
        const res = await fetch(`/api/admin/therapists?page=${currentPage}&limit=15&search=${encodeURIComponent(searchQuery)}&status=${statusFilter}`);
        const data = await res.json();
        if (data.success) setTherapistsData(data);
      } else if (activeTab === 'applications') {
        const res = await fetch(`/api/admin/applications?status=${statusFilter}`);
        const data = await res.json();
        if (data.success) setApplications(data.applications || []);
      } else if (activeTab === 'clients') {
        const res = await fetch(`/api/admin/clients?page=${currentPage}&limit=15&search=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) setClientsData(data);
      } else if (activeTab === 'sessions') {
        const res = await fetch(`/api/admin/sessions?page=${currentPage}&limit=15&status=${statusFilter}`);
        const data = await res.json();
        if (data.success) setSessionsData(data);
      } else if (activeTab === 'payments') {
        const res = await fetch(`/api/admin/payments?page=${currentPage}&limit=15&status=${statusFilter}`);
        const data = await res.json();
        if (data.success) setPaymentsData(data);
      } else if (activeTab === 'payouts') {
        const res = await fetch(`/api/admin/payouts?page=${currentPage}&limit=15&status=${statusFilter}`);
        const data = await res.json();
        if (data.success) setPayoutsData(data);
      } else if (activeTab === 'api-usage') {
        const res = await fetch('/api/admin/api-usage');
        const data = await res.json();
        if (data.success) setApiUsageData(data);
      } else if (activeTab === 'health') {
        const res = await fetch('/api/admin/health');
        const data = await res.json();
        if (data.success) setSystemHealth(data);
      } else if (activeTab === 'webhooks') {
        const res = await fetch(`/api/admin/webhooks?page=${currentPage}&limit=20&provider=${statusFilter}`);
        const data = await res.json();
        if (data.success) setWebhooksData(data);
      } else if (activeTab === 'audit-logs') {
        const res = await fetch(`/api/admin/audit-logs?page=${currentPage}&limit=25`);
        const data = await res.json();
        if (data.success) setAuditLogsData(data);
      } else if (activeTab === 'security') {
        const res = await fetch('/api/admin/security');
        const data = await res.json();
        if (data.success) setSecurityData(data);
      }
    } catch {
      showToast('Error loading administrative data.', true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTabData();
  }, [activeTab, overviewRange, currentPage, statusFilter]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
    setSearchQuery('');
    setStatusFilter('all');
    setIsSidebarOpen(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/admin/${tabId === 'overview' ? '' : tabId}`);
    }
  };

  // Review Application
  const handleReviewDecision = async (decision) => {
    if (!selectedApplication) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/admin/applications/${selectedApplication.therapistAccountId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes: reviewerNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Review submission failed');

      showToast(`Therapist application successfully ${decision}.`);
      setSelectedApplication(null);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2 border ${
            toastMessage.isError
              ? 'bg-rose-950 border-rose-800 text-rose-200'
              : 'bg-emerald-950 border-emerald-800 text-emerald-200'
          }`}
        >
          {toastMessage.isError ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
          {toastMessage.text}
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-50 transition-transform duration-200 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-white">Ingress Within</div>
              <div className="text-[10px] text-indigo-400 font-mono tracking-wider uppercase font-semibold">Founder Portal</div>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Operator Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
              {admin?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">{admin?.full_name || 'Admin'}</div>
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {admin?.role || 'super_admin'}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-slate-900/80 border-b border-slate-800 px-6 py-3.5 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-white capitalize">
                {navigationItems.find((n) => n.id === activeTab)?.label || 'Overview'}
              </h1>
              <p className="text-[11px] text-slate-400">Ingress Within Live Healthcare Operations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTabData}
              disabled={isLoading}
              title="Refresh Data"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-750 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="hidden sm:flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Production Active
            </div>
          </div>
        </header>

        {/* Tab Content Body */}
        <div className="p-6 flex-1 space-y-6 max-w-7xl w-full mx-auto">
          {/* ========================================================================= */}
          {/* TAB 1: COMMAND CENTER OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Range Selector */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">Platform Health & Key Performance Metrics</h2>
                  <p className="text-xs text-slate-400">Authoritative aggregation across platform ledger and sessions.</p>
                </div>
                <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                  {['today', 'week', 'month', 'all'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setOverviewRange(r)}
                      className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                        overviewRange === r ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* 12 Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Gross Platform Revenue</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {formatInr(overviewMetrics?.grossRevenuePaise)}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Ledger Captured
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Platform Retained Fees</div>
                  <div className="text-2xl font-bold text-indigo-400 mt-1">
                    {formatInr(overviewMetrics?.platformFeesPaise)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2">Platform service commission</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Therapist Net Earnings</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {formatInr(overviewMetrics?.therapistEarningsPaise)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2">Earned clinical clinician funds</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Pending Payouts In-Flight</div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">
                    {formatInr(overviewMetrics?.pendingPayoutsPaise)}
                  </div>
                  <div className="text-[11px] text-amber-400/80 mt-2">Requested / RazorpayX clearing</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total Registered Users</div>
                  <div className="text-2xl font-bold text-white mt-1">{overviewMetrics?.totalUsers ?? 0}</div>
                  <div className="text-[11px] text-slate-400 mt-2">All authenticated accounts</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Active Therapists</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">
                    {overviewMetrics?.activeTherapists ?? 0}
                    <span className="text-xs text-slate-400 font-normal"> / {overviewMetrics?.totalTherapists ?? 0} total</span>
                  </div>
                  <div className="text-[11px] text-emerald-400/80 mt-2">Approved & can_practice active</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Pending Applications</div>
                  <div className="text-2xl font-bold text-amber-300 mt-1">{overviewMetrics?.pendingApplications ?? 0}</div>
                  <div className="text-[11px] text-slate-400 mt-2">Awaiting clinical review</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Completed Sessions</div>
                  <div className="text-2xl font-bold text-white mt-1">{overviewMetrics?.completedSessions ?? 0}</div>
                  <div className="text-[11px] text-slate-400 mt-2">
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
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchTabData()}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-850/60 border-b border-slate-800 text-slate-400 font-medium">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Created Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {usersData.users.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-500">
                            No users found matching query.
                          </td>
                        </tr>
                      ) : (
                        usersData.users.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white">{u.name || 'Unnamed User'}</div>
                              <div className="text-[10px] text-slate-500">{u.id}</div>
                            </td>
                            <td className="py-3 px-4 font-mono">{u.phone_number}</td>
                            <td className="py-3 px-4">
                              <span className="capitalize px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]">
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                                  u.account_status === 'active'
                                    ? 'bg-emerald-950/70 border border-emerald-800/60 text-emerald-300'
                                    : 'bg-rose-950/70 border border-rose-800/60 text-rose-300'
                                }`}
                              >
                                {u.account_status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleToggleUserStatus(u.id, u.account_status)}
                                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
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
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-850/60 border-b border-slate-800 text-slate-400 font-medium">
                      <tr>
                        <th className="py-3 px-4">Clinician</th>
                        <th className="py-3 px-4">Credentials & RCI</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Verification</th>
                        <th className="py-3 px-4">Can Practice</th>
                        <th className="py-3 px-4">Session Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {therapistsData.therapists.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-500">
                            No therapists found.
                          </td>
                        </tr>
                      ) : (
                        therapistsData.therapists.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white">{t.full_name}</div>
                              <div className="text-[10px] text-slate-400">{t.phone_number}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div>{t.qualification || 'Clinical Psychologist'}</div>
                              <div className="text-[10px] text-slate-500">
                                {t.rci_registered ? `RCI: ${t.rci_number || 'Verified'}` : 'Not RCI Registered'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="capitalize px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]">
                                {t.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                                  t.verification_status === 'verified'
                                    ? 'bg-emerald-950/70 text-emerald-300'
                                    : 'bg-amber-950/70 text-amber-300'
                                }`}
                              >
                                {t.verification_status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {t.can_practice ? (
                                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                                  <Check className="w-3.5 h-3.5" /> Authorized
                                </span>
                              ) : (
                                <span className="text-rose-400 font-medium">Restricted</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono">₹{t.per_session_fee}</td>
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
          {/* TAB 4: APPLICATION QUEUE */}
          {/* ========================================================================= */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Pending Therapist Applications</h3>
                  <p className="text-xs text-slate-400">Review clinical credentials and approve or reject onboardings.</p>
                </div>
              </div>

              {applications.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                  <CheckCircle className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                  All caught up! Zero pending applications awaiting review.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {applications.map((app) => (
                    <div key={app.therapistAccountId} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-white text-sm">{app.full_name}</div>
                          <div className="text-xs text-indigo-400">{app.title || 'Applicant'}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-800/40 text-amber-300 uppercase tracking-wider font-semibold">
                          {app.application_status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 space-y-1">
                        <div><span className="text-slate-500">Phone:</span> {app.phone_number}</div>
                        <div><span className="text-slate-500">Qualification:</span> {app.qualification || 'Not provided'}</div>
                        <div><span className="text-slate-500">Experience:</span> {app.experience_years} years</div>
                        <div>
                          <span className="text-slate-500">RCI:</span>{' '}
                          {app.rci_registered ? `Registered (${app.rci_number || 'Yes'})` : 'No'}
                        </div>
                        {app.bio && (
                          <div className="pt-2 text-slate-400 italic line-clamp-2">
                            "{app.bio}"
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedApplication(app)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-1.5 px-3 rounded-xl transition-all cursor-pointer"
                        >
                          Review & Decide
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Review Modal */}
              {selectedApplication && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="font-bold text-white text-sm">
                        Review Application: {selectedApplication.full_name}
                      </h3>
                      <button onClick={() => setSelectedApplication(null)} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs text-slate-300">
                      <div><span className="text-slate-500">Phone Number:</span> {selectedApplication.phone_number}</div>
                      <div><span className="text-slate-500">Qualifications:</span> {selectedApplication.qualification}</div>
                      <div>
                        <span className="text-slate-500">Specializations:</span>{' '}
                        {selectedApplication.specializations?.join(', ') || 'None specified'}
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Reviewer Operational Notes (Audit Logged):</label>
                        <textarea
                          rows="3"
                          value={reviewerNotes}
                          onChange={(e) => setReviewerNotes(e.target.value)}
                          placeholder="State justification or regulatory verification reference..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                      <button
                        disabled={isSubmittingReview}
                        onClick={() => handleReviewDecision('rejected')}
                        className="bg-rose-950/80 border border-rose-800 text-rose-300 hover:bg-rose-900 text-xs font-medium py-2 px-4 rounded-xl cursor-pointer disabled:opacity-50"
                      >
                        Reject Application
                      </button>
                      <button
                        disabled={isSubmittingReview}
                        onClick={() => handleReviewDecision('approved')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium py-2 px-4 rounded-xl cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/20"
                      >
                        Approve & Authorize Practice
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
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs text-indigo-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong>Clinical Privacy Shield:</strong> Client records are presented with strict least privilege. Patient SOAP notes, journal entries, and homework reflections remain strictly confidential between client and clinician.
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-850/60 border-b border-slate-800 text-slate-400 font-medium">
                    <tr>
                      <th className="py-3 px-4">Client ID</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Phone Number</th>
                      <th className="py-3 px-4">Account Status</th>
                      <th className="py-3 px-4">Registered Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {clientsData.clients.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-500">
                          No client records found.
                        </td>
                      </tr>
                    ) : (
                      clientsData.clients.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{c.id}</td>
                          <td className="py-3 px-4 font-semibold text-white">{c.name || 'Client User'}</td>
                          <td className="py-3 px-4 font-mono">{c.phone_number}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-800/40 text-emerald-300 text-[10px]">
                              {c.account_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
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
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-850/60 border-b border-slate-800 text-slate-400 font-medium">
                    <tr>
                      <th className="py-3 px-4">Session Time</th>
                      <th className="py-3 px-4">Therapist ID</th>
                      <th className="py-3 px-4">Client ID</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Google Meet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {sessionsData.sessions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500">
                          No sessions found.
                        </td>
                      </tr>
                    ) : (
                      sessionsData.sessions.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-white">
                            {new Date(s.session_time).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{s.therapist_account_id?.substring(0, 12)}...</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{s.client_id?.substring(0, 12)}...</td>
                          <td className="py-3 px-4">
                            <span className="capitalize px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]">
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="capitalize px-2 py-0.5 rounded-md bg-emerald-950/70 text-emerald-300 text-[10px]">
                              {s.payment_status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {s.meet_link ? (
                              <a
                                href={s.meet_link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                              >
                                Join <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-slate-600">Pending sync</span>
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
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-850/60 border-b border-slate-800 text-slate-400 font-medium">
                    <tr>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">User ID</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Provider Reference</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {paymentsData.payments.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500">
                          No payment orders found.
                        </td>
                      </tr>
                    ) : (
                      paymentsData.payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-white">{p.id}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{p.user_id?.substring(0, 12)}...</td>
                          <td className="py-3 px-4 font-semibold text-emerald-400">{formatInr(p.amount_total_paise)}</td>
                          <td className="py-3 px-4">
                            <span className="capitalize px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]">
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">{p.provider_payment_id || 'N/A'}</td>
                          <td className="py-3 px-4 text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
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
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-850/60 border-b border-slate-800 text-slate-400 font-medium">
                    <tr>
                      <th className="py-3 px-4">Request ID</th>
                      <th className="py-3 px-4">Therapist ID</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">UTR Number</th>
                      <th className="py-3 px-4">Requested Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {payoutsData.payouts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500">
                          No therapist withdrawal requests recorded.
                        </td>
                      </tr>
                    ) : (
                      payoutsData.payouts.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-white">{w.id}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{w.therapist_account_id?.substring(0, 12)}...</td>
                          <td className="py-3 px-4 font-bold text-white">₹{w.amount_inr}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize ${
                                w.status === 'completed'
                                  ? 'bg-emerald-950/70 border border-emerald-800/40 text-emerald-300'
                                  : w.status === 'failed'
                                  ? 'bg-rose-950/70 border border-rose-800/40 text-rose-300'
                                  : 'bg-amber-950/70 border border-amber-800/40 text-amber-300'
                              }`}
                            >
                              {w.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">{w.utr_number || 'Pending'}</td>
                          <td className="py-3 px-4 text-slate-400">{new Date(w.created_at).toLocaleDateString()}</td>
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
                  <div key={s.provider} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-white text-sm capitalize">{s.provider.replace('_', ' ')}</div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                          s.isTracked ? 'bg-indigo-950/80 text-indigo-300' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {s.isTracked ? 'Tracked' : 'Not Tracked'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">{s.service}</div>
                    {s.isTracked ? (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total Requests:</span>
                          <span className="font-bold text-white">{s.totalRequests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Success Rate:</span>
                          <span className="font-bold text-emerald-400">{s.successRatePercent}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Avg Latency:</span>
                          <span className="font-mono text-slate-300">{s.avgLatencyMs} ms</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic pt-2 border-t border-slate-800">
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
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Live Infrastructure Diagnostics</h3>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                      systemHealth?.systemHealth?.status === 'healthy'
                        ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                        : 'bg-amber-950 border border-amber-800 text-amber-400'
                    }`}
                  >
                    Status: {systemHealth?.systemHealth?.status || 'Active'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {systemHealth?.systemHealth?.checks &&
                    Object.entries(systemHealth.systemHealth.checks).map(([key, check]) => (
                      <div key={key} className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-xs text-slate-200 capitalize">
                            {key.replace('_', ' ')}
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                              check.status === 'healthy'
                                ? 'bg-emerald-950 text-emerald-400'
                                : check.status === 'degraded'
                                ? 'bg-amber-950 text-amber-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {check.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">{check.message}</div>
                        {check.latencyMs && (
                          <div className="text-[10px] font-mono text-indigo-400">Latency: {check.latencyMs}ms</div>
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
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-850/60 border-b border-slate-800 text-slate-400 font-medium">
                    <tr>
                      <th className="py-3 px-4">Event ID</th>
                      <th className="py-3 px-4">Provider</th>
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Received Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {webhooksData.webhooks.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-500">
                          No webhook events recorded.
                        </td>
                      </tr>
                    ) : (
                      webhooksData.webhooks.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-white">{w.event_id}</td>
                          <td className="py-3 px-4 uppercase text-[10px] font-semibold text-indigo-400">{w.provider}</td>
                          <td className="py-3 px-4 font-mono">{w.event_type}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-800/40 text-emerald-300 text-[10px]">
                              {w.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">{new Date(w.created_at).toLocaleString()}</td>
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
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-850/60 border-b border-slate-800 text-slate-400 font-medium">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Entity</th>
                      <th className="py-3 px-4">Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {auditLogsData.logs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-500">
                          No audit log entries recorded.
                        </td>
                      </tr>
                    ) : (
                      auditLogsData.logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{log.actor_type}</div>
                            <div className="text-[10px] font-mono text-slate-500">{log.actor_id}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-indigo-400 font-medium">{log.action}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {log.entity_type} {log.entity_id ? `(${log.entity_id.substring(0, 8)}...)` : ''}
                          </td>
                          <td className="py-3 px-4 font-mono text-[10px] text-slate-500 max-w-xs truncate">
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
              <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-2xl p-5 flex items-start gap-3 text-xs text-indigo-300">
                <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-sm mb-1">Administrative Account Governance</div>
                  <p>
                    Administrators are provisioned exclusively through secure backend database operations. There is no public registration or self-service admin promotion interface.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white">Active Administrator Accounts</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 text-slate-400 font-medium">
                      <tr>
                        <th className="py-2.5 px-3">Full Name</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Last Login</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {securityData.admins.map((adm) => (
                        <tr key={adm.id}>
                          <td className="py-2.5 px-3 font-semibold text-white">{adm.full_name}</td>
                          <td className="py-2.5 px-3 font-mono">{adm.email}</td>
                          <td className="py-2.5 px-3 font-mono text-indigo-400">{adm.role}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 text-[10px]">
                              {adm.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {adm.last_login_at ? new Date(adm.last_login_at).toLocaleString() : 'Never'}
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
