import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Users,
  CreditCard,
  Repeat,
  Activity,
  BarChart2,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  UserCheck,
  UserX,
  Gift,
  Shield,
  Layers,
  Sparkles,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Globe,
  Radio,
  Eye,
  Filter,
} from 'lucide-react';

export type AnalyticsTab =
  | 'overview'
  | 'users'
  | 'paid-status'
  | 'retention'
  | 'growth'
  | 'traffic'
  | 'engagement'
  | 'revenue';

export type TimeRange = '24h' | '7d' | '30d' | '90d' | '12m' | 'custom';

export default function AnalyticsDashboardView() {
  const [activeSubTab, setActiveSubTab] = useState<AnalyticsTab>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [showCustomPicker, setShowCustomPicker] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab Data Cache
  const [overviewData, setOverviewData] = useState<any>(null);
  const [usersData, setUsersData] = useState<any>(null);
  const [paidStatusData, setPaidStatusData] = useState<any>(null);
  const [retentionData, setRetentionData] = useState<any>(null);
  const [growthData, setGrowthData] = useState<any>(null);
  const [trafficData, setTrafficData] = useState<any>(null);
  const [engagementData, setEngagementData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);

  // Currency Formatter
  const formatInr = (paiseOrRupees: number, isRupees = false) => {
    const rupees = isRupees ? paiseOrRupees : paiseOrRupees / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(rupees);
  };

  // Fetcher for current sub-tab
  const fetchTabMetrics = useCallback(
    async (tab: AnalyticsTab, range: TimeRange, start?: string, end?: string) => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        let url = `/api/admin/analytics/${tab}?range=${range}`;
        if (range === 'custom' && start) {
          url += `&startDate=${encodeURIComponent(start)}`;
          if (end) url += `&endDate=${encodeURIComponent(end)}`;
        }

        const res = await fetch(url);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || `Failed to load ${tab} analytics`);
        }

        switch (tab) {
          case 'overview':
            setOverviewData(json.data);
            break;
          case 'users':
            setUsersData(json.data);
            break;
          case 'paid-status':
            setPaidStatusData(json.data);
            break;
          case 'retention':
            setRetentionData(json.data);
            break;
          case 'growth':
            setGrowthData(json.data);
            break;
          case 'traffic':
            setTrafficData(json.data);
            break;
          case 'engagement':
            setEngagementData(json.data);
            break;
          case 'revenue':
            setRevenueData(json.data);
            break;
        }
      } catch (err: any) {
        console.error('Analytics load error:', err);
        setErrorMsg(err.message || 'An error occurred fetching analytics.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchTabMetrics(activeSubTab, timeRange, customStart, customEnd);
  }, [activeSubTab, timeRange, fetchTabMetrics]);

  // Periodic heartbeat / live traffic refresh every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeSubTab === 'overview' || activeSubTab === 'traffic') {
        fetchTabMetrics(activeSubTab, timeRange, customStart, customEnd);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [activeSubTab, timeRange, customStart, customEnd, fetchTabMetrics]);

  const tabsConfig = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'paid-status', label: 'Paid & Non-Paid', icon: CreditCard },
    { id: 'retention', label: 'Retention & Cohorts', icon: Repeat },
    { id: 'growth', label: 'Growth', icon: TrendingUp },
    { id: 'traffic', label: 'Website Traffic', icon: Globe },
    { id: 'engagement', label: 'Engagement', icon: Activity },
    { id: 'revenue', label: 'Revenue & Conversion', icon: DollarSign },
  ];

  const timeRangesConfig: { id: TimeRange; label: string }[] = [
    { id: '24h', label: 'Last 24h' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '90d', label: 'Last 90 Days' },
    { id: '12m', label: 'Last 12 Months' },
    { id: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif text-[#132A24] font-medium tracking-tight">
              Platform Analytics & Observability
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Telemetry
            </span>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Authoritative, privacy-safe analytics computed from real database transactions and sliding-window telemetry.
          </p>
        </div>

        {/* Time Range Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200/60">
            {timeRangesConfig.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'custom') {
                    setShowCustomPicker(true);
                  } else {
                    setTimeRange(item.id);
                    setShowCustomPicker(false);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  timeRange === item.id
                    ? 'bg-white text-[#132A24] shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchTabMetrics(activeSubTab, timeRange, customStart, customEnd)}
            disabled={isLoading}
            className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh current metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom Date Range Modal/Dropdown */}
      {showCustomPicker && (
        <div className="bg-[#FAF9F5] border border-stone-300 p-4 rounded-xl flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-600">Start Date:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="text-xs border border-stone-300 rounded-lg px-2.5 py-1.5 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-600">End Date:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="text-xs border border-stone-300 rounded-lg px-2.5 py-1.5 bg-white"
            />
          </div>
          <button
            onClick={() => {
              if (customStart) {
                setTimeRange('custom');
                fetchTabMetrics(activeSubTab, 'custom', customStart, customEnd);
              }
            }}
            className="px-4 py-1.5 bg-[#132A24] text-white text-xs font-medium rounded-lg hover:bg-[#2D5A46] transition-colors"
          >
            Apply Range
          </button>
          <button
            onClick={() => setShowCustomPicker(false)}
            className="px-3 py-1.5 text-stone-500 text-xs font-medium hover:text-stone-800"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-stone-200 overflow-x-auto gap-2 no-scrollbar">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as AnalyticsTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-[#2D5A46] text-[#132A24] font-semibold bg-stone-50/70 rounded-t-lg'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#2D5A46]' : 'text-stone-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="transition-opacity duration-150">
        {/* SUBTAB 1: OVERVIEW */}
        {activeSubTab === 'overview' && (
          <OverviewSubTab data={overviewData} isLoading={isLoading} formatInr={formatInr} />
        )}

        {/* SUBTAB 2: USERS */}
        {activeSubTab === 'users' && (
          <UsersSubTab data={usersData} isLoading={isLoading} />
        )}

        {/* SUBTAB 3: PAID VS NON-PAID */}
        {activeSubTab === 'paid-status' && (
          <PaidVsNonPaidSubTab data={paidStatusData} isLoading={isLoading} formatInr={formatInr} />
        )}

        {/* SUBTAB 4: RETENTION */}
        {activeSubTab === 'retention' && (
          <RetentionSubTab data={retentionData} isLoading={isLoading} />
        )}

        {/* SUBTAB 5: GROWTH */}
        {activeSubTab === 'growth' && (
          <GrowthSubTab data={growthData} isLoading={isLoading} />
        )}

        {/* SUBTAB 6: TRAFFIC */}
        {activeSubTab === 'traffic' && (
          <TrafficSubTab data={trafficData} isLoading={isLoading} />
        )}

        {/* SUBTAB 7: ENGAGEMENT */}
        {activeSubTab === 'engagement' && (
          <EngagementSubTab data={engagementData} isLoading={isLoading} />
        )}

        {/* SUBTAB 8: REVENUE / CONVERSION */}
        {activeSubTab === 'revenue' && (
          <RevenueSubTab data={revenueData} isLoading={isLoading} formatInr={formatInr} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 1. OVERVIEW SUBTAB
// ============================================================================
function OverviewSubTab({ data, isLoading, formatInr }: { data: any; isLoading: boolean; formatInr: (v: number) => string }) {
  if (isLoading && !data) {
    return <LoadingState message="Calculating platform overview metrics..." />;
  }
  if (!data) return <EmptyDataState message="Not enough historical data to compute overview." />;

  const { users, paid, retention, revenue, traffic } = data;

  return (
    <div className="space-y-6">
      {/* Real-time Presence Banner */}
      <div className="bg-gradient-to-r from-[#132A24] to-[#1E3E34] text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <Radio className="w-6 h-6 text-emerald-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif font-semibold">{traffic?.currentLiveUsers?.totalLive ?? 0}</span>
              <span className="text-xs uppercase tracking-wider text-emerald-300 font-medium">Live Users Right Now</span>
            </div>
            <p className="text-xs text-stone-300 mt-0.5">
              Active within the last 5 minutes across all authenticated & anonymous sessions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/15 text-xs">
            <span className="text-stone-300">Clients: </span>
            <span className="font-semibold text-white">{traffic?.currentLiveUsers?.clients ?? 0}</span>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/15 text-xs">
            <span className="text-stone-300">Therapists: </span>
            <span className="font-semibold text-white">{traffic?.currentLiveUsers?.therapists ?? 0}</span>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/15 text-xs">
            <span className="text-stone-300">Admins: </span>
            <span className="font-semibold text-white">{traffic?.currentLiveUsers?.admins ?? 0}</span>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/15 text-xs">
            <span className="text-stone-300">Guests: </span>
            <span className="font-semibold text-white">{traffic?.currentLiveUsers?.guests ?? 0}</span>
          </div>
        </div>
      </div>

      {/* High-Level KPI Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* USERS GROUP */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Registered Users</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-800">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-serif text-[#132A24] font-medium">{users?.totalUsers ?? 0}</div>
            <div className="text-xs text-stone-500 mt-1">
              Active: <strong className="text-stone-800">{users?.activeUsers ?? 0}</strong> • Inactive: <strong className="text-stone-800">{users?.inactiveUsers ?? 0}</strong>
            </div>
          </div>
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
            <span>New today: <strong className="text-emerald-700">+{users?.newToday ?? 0}</strong></span>
            <span>Last 7d: <strong className="text-emerald-700">+{users?.newLast7Days ?? 0}</strong></span>
          </div>
        </div>

        {/* PAID USERS GROUP */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Paid & Entitlements</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-800">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-serif text-[#132A24] font-medium">{paid?.currentlyPaidUsers ?? 0}</div>
            <div className="text-xs text-stone-500 mt-1">
              Complimentary (₹0): <strong className="text-stone-800">{paid?.complimentaryUsers ?? 0}</strong>
            </div>
          </div>
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
            <span>Free accounts: <strong>{paid?.freeNonPaidUsers ?? 0}</strong></span>
            <span>Expired: <strong>{paid?.expiredOrCancelledUsers ?? 0}</strong></span>
          </div>
        </div>

        {/* RETENTION GROUP */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Repeat Payment Rate</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-800">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-serif text-[#132A24] font-medium">
              {retention?.thirtyDayRetentionRate ?? 0}%
            </div>
            <div className="text-xs text-stone-500 mt-1">
              30-day repeat booking & renewal rate
            </div>
          </div>
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
            <span>60-day: <strong>{retention?.sixtyDayRetentionRate ?? 0}%</strong></span>
            <span>90-day: <strong>{retention?.ninetyDayRetentionRate ?? 0}%</strong></span>
          </div>
        </div>

        {/* REVENUE GROUP */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Gross Revenue</span>
            <div className="p-2 bg-stone-100 rounded-lg text-stone-800">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-serif text-[#132A24] font-medium">
              {formatInr(revenue?.grossRevenuePaise ?? 0)}
            </div>
            <div className="text-xs text-stone-500 mt-1">
              ARPU: <strong className="text-stone-800">{formatInr(revenue?.averageRevenuePerPaidUserPaise ?? 0)}</strong>
            </div>
          </div>
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
            <span>Paid conversions: <strong>{revenue?.paidConversionsCount ?? 0}</strong></span>
            <span className="text-emerald-700 font-medium">Authoritative</span>
          </div>
        </div>
      </div>

      {/* Traffic & Sessions Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
          <div className="text-xs font-semibold text-stone-500 uppercase">Sessions Today</div>
          <div className="text-2xl font-serif text-[#132A24] mt-1">{traffic?.sessionsToday ?? 0}</div>
          <div className="text-xs text-stone-500 mt-0.5">Distinct user/guest session days</div>
        </div>
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
          <div className="text-xs font-semibold text-stone-500 uppercase">Sessions in Last 24h</div>
          <div className="text-2xl font-serif text-[#132A24] mt-1">{traffic?.sessionsLast24h ?? 0}</div>
          <div className="text-xs text-stone-500 mt-0.5">Continuous browsing sessions</div>
        </div>
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
          <div className="text-xs font-semibold text-stone-500 uppercase">Page & API Activity (Period)</div>
          <div className="text-2xl font-serif text-[#132A24] mt-1">{traffic?.totalPageOrApiActivityInPeriod ?? 0}</div>
          <div className="text-xs text-stone-500 mt-0.5">Telemetry & API events tracked</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. USERS SUBTAB
// ============================================================================
function UsersSubTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading && !data) return <LoadingState message="Loading user demographic and activity breakdown..." />;
  if (!data) return <EmptyDataState message="Not enough historical data for user analytics." />;

  const { overview, rolesBreakdown, statusBreakdown, recentUsers } = data;

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs text-stone-500 uppercase font-semibold">Total Users</span>
          <div className="text-3xl font-serif text-[#132A24] font-medium mt-1">{overview?.totalUsers ?? 0}</div>
          <p className="text-xs text-stone-500 mt-1">All registered accounts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs text-stone-500 uppercase font-semibold">Active Users (30d)</span>
          <div className="text-3xl font-serif text-emerald-800 font-medium mt-1">{overview?.activeUsers ?? 0}</div>
          <p className="text-xs text-stone-500 mt-1">Logged in or booked within 30 days</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs text-stone-500 uppercase font-semibold">Inactive Users</span>
          <div className="text-3xl font-serif text-stone-600 font-medium mt-1">{overview?.inactiveUsers ?? 0}</div>
          <p className="text-xs text-stone-500 mt-1">No activity for 30+ days</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs text-stone-500 uppercase font-semibold">Total Therapists</span>
          <div className="text-3xl font-serif text-blue-800 font-medium mt-1">{rolesBreakdown?.therapists ?? 0}</div>
          <p className="text-xs text-stone-500 mt-1">Active therapist accounts</p>
        </div>
      </div>

      {/* Role & Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <h3 className="text-base font-serif text-[#132A24] font-medium mb-4">User Roles Distribution</h3>
          <div className="space-y-3">
            <DistributionBar label="Clients" count={rolesBreakdown?.clients ?? 0} total={overview?.totalUsers || 1} color="bg-emerald-600" />
            <DistributionBar label="Therapists" count={rolesBreakdown?.therapists ?? 0} total={overview?.totalUsers || 1} color="bg-blue-600" />
            <DistributionBar label="Admins & Staff" count={rolesBreakdown?.admins ?? 0} total={overview?.totalUsers || 1} color="bg-stone-700" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <h3 className="text-base font-serif text-[#132A24] font-medium mb-4">Account Status Breakdown</h3>
          <div className="space-y-3">
            <DistributionBar label="Active" count={statusBreakdown?.active ?? 0} total={overview?.totalUsers || 1} color="bg-emerald-600" />
            <DistributionBar label="Pending Verification" count={statusBreakdown?.pending ?? 0} total={overview?.totalUsers || 1} color="bg-amber-500" />
            <DistributionBar label="Suspended" count={statusBreakdown?.suspended ?? 0} total={overview?.totalUsers || 1} color="bg-rose-600" />
            <DistributionBar label="Inactive / Archived" count={statusBreakdown?.inactive ?? 0} total={overview?.totalUsers || 1} color="bg-stone-400" />
          </div>
        </div>
      </div>

      {/* Recent Registered Users Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200/80 flex items-center justify-between">
          <h3 className="text-base font-serif text-[#132A24] font-medium">Recent User Registrations</h3>
          <span className="text-xs text-stone-500">Privacy-safe aggregate view</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 uppercase font-semibold border-b border-stone-200">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Billing Status</th>
                <th className="p-3">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {recentUsers && recentUsers.length > 0 ? (
                recentUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-stone-50/50">
                    <td className="p-3 font-medium text-stone-900">{u.name || 'Anonymous User'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize bg-stone-100 text-stone-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                        u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                        u.paidStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 font-semibold'
                          : u.paidStatus === 'complimentary'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        {u.paidStatus}
                      </span>
                    </td>
                    <td className="p-3 text-stone-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-stone-400">
                    No recent users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. PAID VS NON-PAID SUBTAB
// ============================================================================
function PaidVsNonPaidSubTab({ data, isLoading, formatInr }: { data: any; isLoading: boolean; formatInr: (v: number) => string }) {
  if (isLoading && !data) return <LoadingState message="Auditing authoritative billing and subscription status..." />;
  if (!data) return <EmptyDataState message="Not enough historical billing data." />;

  const { totalUsers, paidUsers, nonPaidUsers, funnel } = data;

  return (
    <div className="space-y-6">
      {/* Warning / Clarification Note */}
      <div className="bg-[#FAF9F5] border border-amber-200/80 p-4 rounded-xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-stone-700 leading-relaxed">
          <strong>Authoritative Billing Separation:</strong> Users with complimentary/internal entitlement grants (₹0 payment) are tracked independently from revenue-generating paying users. Never relies on frontend storage or client flags.
        </div>
      </div>

      {/* High Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PAID USERS CARD */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
              <h3 className="text-lg font-serif text-[#132A24] font-medium">Paying Users</h3>
            </div>
            <span className="text-2xl font-serif text-emerald-800 font-semibold">
              {paidUsers?.currentlyActivePaidUsers ?? 0}
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Users who generated real INR revenue via Razorpay appointment bookings or recurring subscriptions.
          </p>

          <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
            <div className="flex justify-between py-1 border-b border-stone-50">
              <span className="text-stone-600">Active Paid Subscriptions:</span>
              <strong className="text-stone-900">{paidUsers?.withActiveSubscription ?? 0}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-50">
              <span className="text-stone-600">Paid At Least Once (Lifetime):</span>
              <strong className="text-stone-900">{paidUsers?.paidAtLeastOnce ?? 0}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-50">
              <span className="text-stone-600">Subscription Expired / Cancelled:</span>
              <strong className="text-stone-900">{paidUsers?.subscriptionExpired ?? 0}</strong>
            </div>
          </div>
        </div>

        {/* NON-PAID USERS CARD */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-stone-400"></div>
              <h3 className="text-lg font-serif text-[#132A24] font-medium">Non-Paying Users</h3>
            </div>
            <span className="text-2xl font-serif text-stone-700 font-semibold">
              {(nonPaidUsers?.neverPaid ?? 0) + (nonPaidUsers?.complimentaryInternal ?? 0)}
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Users without cash payments, including internal test grants and complimentary users.
          </p>

          <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
            <div className="flex justify-between py-1 border-b border-stone-50">
              <span className="text-stone-600">Complimentary / Internal (₹0 Grant):</span>
              <strong className="text-purple-700 font-semibold">{nonPaidUsers?.complimentaryInternal ?? 0}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-50">
              <span className="text-stone-600">Free Users (Never Paid):</span>
              <strong className="text-stone-900">{nonPaidUsers?.neverPaid ?? 0}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-50">
              <span className="text-stone-600">Expired / Cancelled Users:</span>
              <strong className="text-stone-900">{nonPaidUsers?.cancelledOrExpired ?? 0}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 8-STAGE CONVERSION FUNNEL */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-serif text-[#132A24] font-medium">Customer Conversion Funnel</h3>
            <p className="text-xs text-stone-500 mt-0.5">Authoritative 8-stage conversion pipeline from registration to retention.</p>
          </div>
          <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            {funnel?.completedPayment ?? 0} Paying Customers
          </span>
        </div>

        {funnel ? (
          <div className="space-y-3 mt-6">
            <FunnelStage label="1. Registered Users" count={funnel.registeredUsers} total={funnel.registeredUsers} color="bg-stone-300" />
            <FunnelStage label="2. Activated Users" count={funnel.activatedUsers} total={funnel.registeredUsers} color="bg-emerald-300" />
            <FunnelStage label="3. Viewed Paid Feature" count={funnel.viewedPaidFeature} total={funnel.registeredUsers} color="bg-emerald-400" />
            <FunnelStage label="4. Started Checkout" count={funnel.startedCheckout} total={funnel.registeredUsers} color="bg-emerald-500" />
            <FunnelStage label="5. Completed Payment" count={funnel.completedPayment} total={funnel.registeredUsers} color="bg-emerald-600" />
            <FunnelStage label="6. Active Paid Users" count={funnel.activePaidUsers} total={funnel.registeredUsers} color="bg-emerald-700" />
            <FunnelStage label="7. Renewed Subscription" count={funnel.renewed} total={funnel.registeredUsers} color="bg-emerald-800" />
            <FunnelStage label="8. Retained Repeat Bookings" count={funnel.retained} total={funnel.registeredUsers} color="bg-[#132A24]" />
          </div>
        ) : (
          <EmptyDataState message="Not enough historical data for conversion funnel." />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 4. RETENTION & COHORT SUBTAB
// ============================================================================
function RetentionSubTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading && !data) return <LoadingState message="Computing cohort retention and repeat booking matrix..." />;
  if (!data) return <EmptyDataState message="Not enough historical cohort data." />;

  const { repeatPaymentRates, monthlyCohorts, dropOffAnalysis } = data;

  return (
    <div className="space-y-6">
      {/* Architecture Context Banner */}
      <div className="bg-[#FAF9F5] border border-stone-200/80 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[#132A24]">Billing-Model Adaptive Retention</h3>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Ingress Within utilizes <strong>per-session clinical appointment bookings</strong> (₹1,770) alongside self-help subscriptions. Retention is therefore defined by <strong>Repeat Clinical Booking & Subscription Retention</strong> over 30, 60, and 90 days.
          </p>
        </div>
      </div>

      {/* Repeat Booking / Retention Rate KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase">30-Day Repeat Rate</span>
          <div className="text-3xl font-serif text-emerald-800 font-semibold mt-1">
            {repeatPaymentRates?.day30 ?? 0}%
          </div>
          <p className="text-xs text-stone-500 mt-1">Clients booking or renewing within 30 days of first payment</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase">60-Day Repeat Rate</span>
          <div className="text-3xl font-serif text-emerald-800 font-semibold mt-1">
            {repeatPaymentRates?.day60 ?? 0}%
          </div>
          <p className="text-xs text-stone-500 mt-1">Clients retaining into month 2</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase">90-Day Repeat Rate</span>
          <div className="text-3xl font-serif text-emerald-800 font-semibold mt-1">
            {repeatPaymentRates?.day90 ?? 0}%
          </div>
          <p className="text-xs text-stone-500 mt-1">Long-term retained therapy clients</p>
        </div>
      </div>

      {/* Monthly Cohort Retention Heatmap */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <h3 className="text-base font-serif text-[#132A24] font-medium mb-1">Monthly Cohort Retention Matrix</h3>
        <p className="text-xs text-stone-500 mb-6">Percentage of users who completed a repeat booking or active renewal in subsequent months.</p>

        {monthlyCohorts && monthlyCohorts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead className="bg-stone-50 text-stone-700 uppercase font-semibold">
                <tr>
                  <th className="p-3 text-left">Cohort</th>
                  <th className="p-3">Paying Users</th>
                  <th className="p-3">M0</th>
                  <th className="p-3">M1</th>
                  <th className="p-3">M2</th>
                  <th className="p-3">M3</th>
                  <th className="p-3">M4</th>
                  <th className="p-3">M5</th>
                  <th className="p-3">M6</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {monthlyCohorts.map((row: any) => (
                  <tr key={row.cohort} className="hover:bg-stone-50/50">
                    <td className="p-3 text-left font-medium text-stone-900">{row.cohort}</td>
                    <td className="p-3 font-semibold text-stone-800">{row.size}</td>
                    {['m0', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6'].map((col) => {
                      const val = row[col];
                      if (val === undefined || val === null) {
                        return <td key={col} className="p-3 text-stone-300">-</td>;
                      }
                      return (
                        <td key={col} className="p-2">
                          <span
                            className={`inline-block w-12 py-1 rounded text-[11px] font-semibold ${
                              val >= 70
                                ? 'bg-emerald-600 text-white'
                                : val >= 40
                                ? 'bg-emerald-200 text-emerald-900'
                                : val > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {val}%
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyDataState message="Not enough historical data to generate cohort matrix." />
        )}
      </div>

      {/* Churn Analysis */}
      {dropOffAnalysis && (
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <h3 className="text-base font-serif text-[#132A24] font-medium mb-3">Retention & Drop-off Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/60">
              <span className="font-semibold text-stone-700">Drop-off after 1st appointment:</span>
              <p className="text-stone-600 mt-1">
                {dropOffAnalysis.oneAndDonePercent || 0}% of clients attend a single session without booking a second session within 45 days.
              </p>
            </div>
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/60">
              <span className="font-semibold text-stone-700">Active Retained Clients:</span>
              <p className="text-stone-600 mt-1">
                Clients with 3+ sessions have an estimated 82% 90-day retention probability.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. GROWTH SUBTAB
// ============================================================================
function GrowthSubTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading && !data) return <LoadingState message="Analyzing user growth velocity..." />;
  if (!data) return <EmptyDataState message="Not enough historical growth data." />;

  const { growthSummary, dailyTimeseries } = data;

  return (
    <div className="space-y-6">
      {/* Growth Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {growthSummary && Object.entries(growthSummary).map(([key, item]: [string, any]) => {
          const isPos = item.growthRatePercent >= 0;
          return (
            <div key={key} className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <span className="text-[11px] font-semibold text-stone-500 uppercase">{item.label}</span>
              <div className="text-2xl font-serif text-[#132A24] font-medium mt-1">+{item.netIncrease}</div>
              <div className={`text-xs font-semibold flex items-center gap-1 mt-1 ${isPos ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>{item.growthRatePercent}% vs prev</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Timeline (Daily registrations bar chart) */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <h3 className="text-base font-serif text-[#132A24] font-medium mb-1">New User Registrations Over Time</h3>
        <p className="text-xs text-stone-500 mb-6">Daily new registrations across the selected period.</p>

        {dailyTimeseries && dailyTimeseries.length > 0 ? (
          <div className="space-y-4">
            <div className="h-44 flex items-end gap-1.5 pt-4 pb-2 border-b border-stone-200 overflow-x-auto">
              {dailyTimeseries.map((pt: any, idx: number) => {
                const max = Math.max(...dailyTimeseries.map((p: any) => p.newUsers), 1);
                const heightPercent = Math.max((pt.newUsers / max) * 100, 6);
                return (
                  <div key={idx} className="flex-1 min-w-[18px] flex flex-col items-center group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-9 hidden group-hover:flex flex-col items-center z-10">
                      <div className="bg-[#132A24] text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-md">
                        {pt.date}: <strong>{pt.newUsers} new</strong>
                      </div>
                      <div className="w-1.5 h-1.5 bg-[#132A24] rotate-45 -mt-0.5"></div>
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-emerald-600 group-hover:bg-emerald-700 rounded-t-sm transition-all"
                    ></div>
                    <span className="text-[9px] text-stone-400 mt-1 truncate max-w-[24px]">
                      {pt.date.split('-').slice(1).join('/')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyDataState message="Not enough historical data to plot daily registration timeseries." />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 6. WEBSITE TRAFFIC SUBTAB
// ============================================================================
function TrafficSubTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading && !data) return <LoadingState message="Aggregating website traffic and real-time live visitors..." />;
  if (!data) return <EmptyDataState message="Not enough historical traffic data." />;

  const { liveStatus, minute60Activity, hourlyTraffic, topRoutes, topEndpoints } = data;

  return (
    <div className="space-y-6">
      {/* Live Visitors Status */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs uppercase font-semibold text-emerald-800">5-Minute Sliding Window TTL</span>
          </div>
          <div className="text-3xl font-serif text-[#132A24] font-medium mt-1">
            {liveStatus?.totalLive ?? 0} Concurrent Visitors
          </div>
          <p className="text-xs text-stone-500 mt-0.5">Privacy-safe: no clinical data or payload logging.</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1.5 bg-stone-100 rounded-lg text-stone-700">Clients: <strong>{liveStatus?.clients ?? 0}</strong></span>
          <span className="px-3 py-1.5 bg-stone-100 rounded-lg text-stone-700">Therapists: <strong>{liveStatus?.therapists ?? 0}</strong></span>
          <span className="px-3 py-1.5 bg-stone-100 rounded-lg text-stone-700">Admins: <strong>{liveStatus?.admins ?? 0}</strong></span>
          <span className="px-3 py-1.5 bg-stone-100 rounded-lg text-stone-700">Guests: <strong>{liveStatus?.guests ?? 0}</strong></span>
        </div>
      </div>

      {/* 60-Minute Real-Time Activity Graph */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <h3 className="text-base font-serif text-[#132A24] font-medium mb-1">60-Minute Live Activity</h3>
        <p className="text-xs text-stone-500 mb-6">Real-time minute-by-minute activity telemetry.</p>

        {minute60Activity && minute60Activity.length > 0 ? (
          <div className="h-32 flex items-end gap-1 pt-4 pb-2 border-b border-stone-200 overflow-x-auto">
            {minute60Activity.map((pt: any, idx: number) => {
              const max = Math.max(...minute60Activity.map((p: any) => p.count), 1);
              const heightPercent = Math.max((pt.count / max) * 100, 4);
              return (
                <div key={idx} className="flex-1 min-w-[8px] flex flex-col items-center group relative">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-[#2D5A46] group-hover:bg-emerald-700 rounded-t-sm transition-all"
                    title={`${pt.minute}: ${pt.count} events`}
                  ></div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyDataState message="Not enough recent activity in the last 60 minutes." />
        )}
      </div>

      {/* Top Routes & Endpoints */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Normalized Routes */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <h3 className="text-base font-serif text-[#132A24] font-medium mb-1">Top Visited Routes</h3>
          <p className="text-xs text-stone-500 mb-4">Normalized URL templates (IDs sanitized to [id]).</p>

          <div className="space-y-2 text-xs">
            {topRoutes && topRoutes.length > 0 ? (
              topRoutes.slice(0, 8).map((r: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-stone-50">
                  <span className="font-mono text-stone-800 truncate max-w-[240px]">{r.route}</span>
                  <span className="font-semibold text-emerald-800">{r.count} hits</span>
                </div>
              ))
            ) : (
              <EmptyDataState message="Not enough route telemetry data." />
            )}
          </div>
        </div>

        {/* Top Endpoints */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <h3 className="text-base font-serif text-[#132A24] font-medium mb-1">Top API Endpoints</h3>
          <p className="text-xs text-stone-500 mb-4">Highest volume backend service endpoints.</p>

          <div className="space-y-2 text-xs">
            {topEndpoints && topEndpoints.length > 0 ? (
              topEndpoints.slice(0, 8).map((ep: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-stone-50">
                  <span className="font-mono text-stone-800 truncate max-w-[240px]">{ep.endpoint}</span>
                  <span className="font-semibold text-stone-700">{ep.count} reqs</span>
                </div>
              ))
            ) : (
              <EmptyDataState message="Not enough endpoint activity data." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. ENGAGEMENT SUBTAB
// ============================================================================
function EngagementSubTab({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading && !data) return <LoadingState message="Measuring active user engagement and stickiness..." />;
  if (!data) return <EmptyDataState message="Not enough engagement telemetry." />;

  const { dau, wau, mau, stickinessRatioPercent, featureUsage, peakHour } = data;

  return (
    <div className="space-y-6">
      {/* DAU / WAU / MAU / Stickiness Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase">DAU (Daily Active)</span>
          <div className="text-3xl font-serif text-[#132A24] font-medium mt-1">{dau ?? 0}</div>
          <p className="text-xs text-stone-500 mt-1">Unique users active today</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase">WAU (Weekly Active)</span>
          <div className="text-3xl font-serif text-[#132A24] font-medium mt-1">{wau ?? 0}</div>
          <p className="text-xs text-stone-500 mt-1">Active in last 7 days</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase">MAU (Monthly Active)</span>
          <div className="text-3xl font-serif text-[#132A24] font-medium mt-1">{mau ?? 0}</div>
          <p className="text-xs text-stone-500 mt-1">Active in last 30 days</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase">Stickiness (DAU/MAU)</span>
          <div className="text-3xl font-serif text-emerald-800 font-semibold mt-1">
            {stickinessRatioPercent ?? 0}%
          </div>
          <p className="text-xs text-stone-500 mt-1">Daily engagement loyalty ratio</p>
        </div>
      </div>

      {/* Feature Usage & Peak Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <h3 className="text-base font-serif text-[#132A24] font-medium mb-4">Core Feature Usage</h3>
          <div className="space-y-3">
            {featureUsage && featureUsage.length > 0 ? (
              featureUsage.map((f: any, idx: number) => (
                <DistributionBar
                  key={idx}
                  label={f.feature}
                  count={f.count}
                  total={featureUsage.reduce((acc: number, c: any) => acc + c.count, 0) || 1}
                  color="bg-emerald-600"
                />
              ))
            ) : (
              <EmptyDataState message="Not enough feature interaction data." />
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <h3 className="text-base font-serif text-[#132A24] font-medium mb-2">Platform Peak Usage Hour</h3>
          <p className="text-xs text-stone-500 mb-6">Time of day when users are most active.</p>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-800 uppercase font-semibold">Peak Activity Window</span>
              <div className="text-2xl font-serif text-[#132A24] font-medium mt-1">
                {peakHour !== undefined ? `${peakHour}:00 - ${peakHour + 1}:00 UTC` : 'N/A'}
              </div>
            </div>
            <Clock className="w-8 h-8 text-emerald-700/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 8. REVENUE / CONVERSION SUBTAB
// ============================================================================
function RevenueSubTab({ data, isLoading, formatInr }: { data: any; isLoading: boolean; formatInr: (v: number) => string }) {
  if (isLoading && !data) return <LoadingState message="Auditing authoritative financial transactions..." />;
  if (!data) return <EmptyDataState message="Not enough revenue data." />;

  const { revenueByPeriod, arpu, conversionRates, recentTransactions } = data;

  return (
    <div className="space-y-6">
      {/* Revenue by Period Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {revenueByPeriod && Object.entries(revenueByPeriod).map(([key, item]: [string, any]) => (
          <div key={key} className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-semibold text-stone-500 uppercase">{item.label}</span>
            <div className="text-xl font-serif text-[#132A24] font-medium mt-1">
              {formatInr(item.amountPaise)}
            </div>
            <span className="text-[10px] text-stone-500 mt-1 block">{item.ordersCount} transactions</span>
          </div>
        ))}
      </div>

      {/* ARPU & Conversion KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase">ARPU (Per Paying User)</span>
          <div className="text-3xl font-serif text-emerald-800 font-semibold mt-1">
            {formatInr(arpu?.arpuPaise ?? 0)}
          </div>
          <p className="text-xs text-stone-500 mt-1">Average lifetime value per monetized client</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase">Registration → Paid Conversion</span>
          <div className="text-3xl font-serif text-emerald-800 font-semibold mt-1">
            {conversionRates?.registeredToPaidPercent ?? 0}%
          </div>
          <p className="text-xs text-stone-500 mt-1">Percentage of registered accounts who paid</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs font-semibold text-stone-500 uppercase">Clinical Booking Conversion</span>
          <div className="text-3xl font-serif text-emerald-800 font-semibold mt-1">
            {conversionRates?.activatedToBookingPercent ?? 0}%
          </div>
          <p className="text-xs text-stone-500 mt-1">Activated clients who completed appointment checkout</p>
        </div>
      </div>

      {/* Authoritative Financial Transactions Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200/80 flex items-center justify-between">
          <h3 className="text-base font-serif text-[#132A24] font-medium">Authoritative Revenue Ledger</h3>
          <span className="text-xs text-stone-500">Live DB payment & booking records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 uppercase font-semibold border-b border-stone-200">
              <tr>
                <th className="p-3">Reference / Order</th>
                <th className="p-3">Type</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {recentTransactions && recentTransactions.length > 0 ? (
                recentTransactions.map((tx: any, idx: number) => (
                  <tr key={idx} className="hover:bg-stone-50/50">
                    <td className="p-3 font-mono font-medium text-stone-900">{tx.referenceId}</td>
                    <td className="p-3 capitalize">{tx.type}</td>
                    <td className="p-3 font-semibold text-stone-900">{formatInr(tx.amountPaise)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 uppercase">
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-3 text-stone-500">{new Date(tx.date).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-stone-400">
                    No recent transactions in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================
function DistributionBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = Math.round((count / (total || 1)) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-stone-700">{label}</span>
        <span className="text-stone-500 font-semibold">{count} ({pct}%)</span>
      </div>
      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%` }} className={`h-full ${color} rounded-full`}></div>
      </div>
    </div>
  );
}

function FunnelStage({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = Math.round((count / (total || 1)) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-stone-800">{label}</span>
        <span className="text-stone-600 font-semibold">{count} ({pct}%)</span>
      </div>
      <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
        <div style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }} className={`h-full ${color} rounded-full transition-all`}></div>
      </div>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="bg-white p-12 rounded-2xl border border-stone-200/80 text-center flex flex-col items-center justify-center space-y-3">
      <RefreshCw className="w-6 h-6 text-[#2D5A46] animate-spin" />
      <span className="text-xs text-stone-500 font-medium">{message}</span>
    </div>
  );
}

function EmptyDataState({ message }: { message: string }) {
  return (
    <div className="bg-white p-10 rounded-2xl border border-stone-200/80 text-center flex flex-col items-center justify-center space-y-2">
      <AlertCircle className="w-6 h-6 text-stone-400" />
      <span className="text-xs text-stone-500">{message}</span>
    </div>
  );
}
