import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowDownRight,
  AlertCircle,
  RefreshCw,
  Filter,
  CreditCard,
  Building,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Plus,
  ArrowUpRight,
  Wallet,
  X,
  ExternalLink
} from 'lucide-react';

export default function TherapistEarningsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payout accounts & withdrawals state
  const [payoutAccounts, setPayoutAccounts] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawFeedback, setWithdrawFeedback] = useState(null);

  // Add Account form state
  const [accountType, setAccountType] = useState('bank'); // 'bank' | 'upi'
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [accountError, setAccountError] = useState(null);

  // Filter state
  const [selectedRange, setSelectedRange] = useState('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [hoveredChartPoint, setHoveredChartPoint] = useState(null);

  const fetchEarnings = async (rangeKey = selectedRange, from = customFrom, to = customTo, page = activePage) => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/therapist/earnings?range=${rangeKey}&page=${page}&limit=25`;
      if (rangeKey === 'custom') {
        if (!from || !to) {
          throw new Error('Please select both start and end dates.');
        }
        url += `&from=${from}&to=${to}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to load financial records.');
      }

      setData(json);
    } catch (err) {
      console.error('Earnings fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayoutData = async () => {
    try {
      const [accRes, withRes] = await Promise.all([
        fetch('/api/therapist/payouts/accounts'),
        fetch('/api/therapist/payouts/withdraw'),
      ]);

      if (accRes.ok) {
        const accJson = await accRes.json();
        const accList = accJson.accounts || [];
        setPayoutAccounts(accList);
        const defaultAcc = accList.find((a) => a.is_default) || accList[0];
        if (defaultAcc) {
          setSelectedAccountId(defaultAcc.id);
        }
      }

      if (withRes.ok) {
        const withJson = await withRes.json();
        setWithdrawals(withJson.withdrawals || []);
      }
    } catch (err) {
      console.warn('Payout data fetch warning:', err);
    }
  };

  useEffect(() => {
    fetchEarnings(selectedRange, customFrom, customTo, activePage);
    fetchPayoutData();
  }, [selectedRange, activePage]);

  const handleRangeChange = (range) => {
    setSelectedRange(range);
    setActivePage(1);
    if (range !== 'custom') {
      fetchEarnings(range, '', '', 1);
    }
  };

  const handleCustomApply = (e) => {
    e.preventDefault();
    if (!customFrom || !customTo) return;
    setActivePage(1);
    fetchEarnings('custom', customFrom, customTo, 1);
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setWithdrawSubmitting(true);
    setWithdrawFeedback(null);

    const amountNum = parseFloat(withdrawAmount);
    if (!amountNum || amountNum <= 0) {
      setWithdrawFeedback({ type: 'error', message: 'Please enter a valid positive amount.' });
      setWithdrawSubmitting(false);
      return;
    }

    if (!selectedAccountId) {
      setWithdrawFeedback({ type: 'error', message: 'Please select a verified payout method.' });
      setWithdrawSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/therapist/payouts/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          payoutAccountId: selectedAccountId,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Withdrawal request failed.');
      }

      setWithdrawFeedback({
        type: 'success',
        message: `Withdrawal request for ₹${amountNum.toLocaleString('en-IN')} submitted successfully (Status: Processing).`,
      });
      setWithdrawAmount('');
      // Refresh earnings and withdrawals
      fetchEarnings(selectedRange, customFrom, customTo, activePage);
      fetchPayoutData();
      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawFeedback(null);
      }, 2000);
    } catch (err) {
      setWithdrawFeedback({ type: 'error', message: err.message });
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const handleAddAccountSubmit = async (e) => {
    e.preventDefault();
    setAccountSubmitting(true);
    setAccountError(null);

    if (accountType === 'bank') {
      if (accountNumber !== confirmAccountNumber) {
        setAccountError('Account numbers do not match.');
        setAccountSubmitting(false);
        return;
      }
    }

    try {
      const payload = {
        accountType,
        beneficiaryName,
        bankName: accountType === 'bank' ? bankName : undefined,
        accountNumber: accountType === 'bank' ? accountNumber : undefined,
        ifsc: accountType === 'bank' ? ifsc.toUpperCase() : undefined,
        upiId: accountType === 'upi' ? upiId.toLowerCase() : undefined,
        isDefault: payoutAccounts.length === 0,
      };

      const res = await fetch('/api/therapist/payouts/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to add payout method.');
      }

      await fetchPayoutData();
      setIsAddAccountModalOpen(false);
      // Reset form
      setBeneficiaryName('');
      setBankName('');
      setAccountNumber('');
      setConfirmAccountNumber('');
      setIfsc('');
      setUpiId('');
    } catch (err) {
      setAccountError(err.message);
    } finally {
      setAccountSubmitting(false);
    }
  };

  const summary = data?.summary || {
    totalEarnings: 0,
    grossRevenue: 0,
    platformFees: 0,
    refunds: 0,
    pendingPayout: 0,
    paidOut: 0,
    sessionCount: 0,
    averagePerSession: 0,
    currency: 'INR',
  };

  const balance = data?.balance || {
    availableToWithdraw: summary.pendingPayout || 0,
    totalNetEarned: summary.totalEarnings || 0,
    pendingPayout: summary.pendingPayout || 0,
    withdrawn: summary.paidOut || 0,
    inFlightWithdrawals: 0,
  };

  const chartPoints = data?.chart || [];
  const transactions = data?.transactions || [];
  const payouts = data?.payouts || [];
  const pagination = data?.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 };

  const defaultAccount = payoutAccounts.find((a) => a.is_default) || payoutAccounts[0];
  const maxChartEarnings = Math.max(...chartPoints.map((p) => p.earnings), 100);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'collected':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'paid':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'processing':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'pending':
      case 'requested':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'cancelled':
        return 'bg-zinc-100 text-zinc-500 border border-zinc-200 line-through';
      case 'reversed':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Date Range Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#132A24]/10 pb-6">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#4E7A66] flex items-center gap-1.5">
            <Building size={13} /> Financial Ledger & Practice Revenue
          </span>
          <h1 className="font-serif text-3xl font-normal text-[#132A24] mt-1">
            Earnings & Secure Payouts
          </h1>
          <p className="text-xs text-[#132A24]/60 mt-1">
            Authoritative financial records derived directly from captured session payments and disbursement batches.
          </p>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-[#FAFAF8] p-1.5 rounded-xl border border-[#132A24]/10 text-xs">
          {[
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'last_month', label: 'Last Month' },
            { key: 'custom', label: 'Custom' },
          ].map((item) => {
            const isActive = selectedRange === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleRangeChange(item.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#132A24] text-white shadow-2xs font-semibold'
                    : 'text-[#132A24]/70 hover:bg-[#132A24]/5 hover:text-[#132A24]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Available Balance & Payout Action Hero Strip */}
      <div className="bg-linear-to-r from-[#132A24] to-[#1E3B33] text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-300 flex items-center gap-1.5">
              <Wallet size={14} /> Available to Withdraw
            </span>
            <div className="text-3xl sm:text-4xl font-serif font-bold tracking-tight">
              ₹{balance.availableToWithdraw.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-white/70 pt-1">
              Settled session earnings ready for instant disbursement via RazorpayX.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {defaultAccount ? (
              <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/15 text-xs flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-emerald-400" />
                <div>
                  <span className="font-semibold block text-white">
                    {defaultAccount.bank_name || 'Bank'} {defaultAccount.masked_identifier}
                  </span>
                  <span className="text-[10px] text-white/70 capitalize">
                    {defaultAccount.account_type} · Verified
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddAccountModalOpen(true)}
                className="bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs px-3.5 py-2.5 rounded-xl font-medium cursor-pointer transition-colors inline-flex items-center gap-1.5"
              >
                <Plus size={14} /> Add Payout Destination
              </button>
            )}

            <button
              onClick={() => {
                if (payoutAccounts.length === 0) {
                  setIsAddAccountModalOpen(true);
                } else {
                  setIsWithdrawModalOpen(true);
                }
              }}
              disabled={balance.availableToWithdraw <= 0 && payoutAccounts.length > 0}
              className={`px-5 py-2.5 rounded-xl font-medium text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
                balance.availableToWithdraw > 0 || payoutAccounts.length === 0
                  ? 'bg-emerald-400 text-[#132A24] hover:bg-emerald-300 font-semibold'
                  : 'bg-white/20 text-white/50 cursor-not-allowed'
              }`}
            >
              <ArrowUpRight size={15} />
              {payoutAccounts.length === 0 ? 'Setup Payout Method' : 'Withdraw Earnings'}
            </button>

            {payoutAccounts.length > 0 && (
              <button
                onClick={() => setIsAddAccountModalOpen(true)}
                className="bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs px-3 py-2.5 rounded-xl font-medium cursor-pointer transition-colors"
                title="Manage payout methods"
              >
                Settings
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker Accordion */}
      {selectedRange === 'custom' && (
        <form onSubmit={handleCustomApply} className="p-4 bg-white rounded-xl border border-[#132A24]/10 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <label className="text-[#132A24]/70 font-medium">From:</label>
            <input
              type="date"
              required
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="border border-[#132A24]/15 rounded-lg px-2.5 py-1.5 bg-white text-[#132A24] text-xs focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[#132A24]/70 font-medium">To:</label>
            <input
              type="date"
              required
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="border border-[#132A24]/15 rounded-lg px-2.5 py-1.5 bg-white text-[#132A24] text-xs focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 bg-[#4E7A66] text-white rounded-lg font-medium hover:bg-[#4E7A66]/90 cursor-pointer shadow-2xs"
          >
            Apply Range
          </button>
        </form>
      )}

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchEarnings()}
            className="px-3 py-1 bg-white border border-red-300 rounded-lg font-medium text-red-700 hover:bg-red-50 cursor-pointer inline-flex items-center gap-1"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white border border-[#132A24]/10 rounded-xl p-5 animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-white border border-[#132A24]/10 rounded-xl p-6 animate-pulse" />
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Net Earnings */}
            <div className="bg-white border border-[#132A24]/10 rounded-xl p-5 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#4E7A66]">
                Total Net Earnings
              </span>
              <div className="text-2xl font-serif font-semibold text-[#132A24]">
                ₹{summary.totalEarnings.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-[#132A24]/60 pt-1">
                Net income earned ({selectedRange.replace(/_/g, ' ')})
              </p>
            </div>

            {/* Total Sessions & Average */}
            <div className="bg-white border border-[#132A24]/10 rounded-xl p-5 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#132A24]/50">
                Billable Sessions
              </span>
              <div className="text-2xl font-serif font-semibold text-[#132A24]">
                {summary.sessionCount}
              </div>
              <p className="text-[11px] text-[#132A24]/60 pt-1">
                Avg: <strong className="text-[#132A24]">₹{summary.averagePerSession.toLocaleString('en-IN')}</strong> / session
              </p>
            </div>

            {/* In-Flight / Pending Payout */}
            <div className="bg-white border border-[#132A24]/10 rounded-xl p-5 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700">
                Pending Settlement
              </span>
              <div className="text-2xl font-serif font-semibold text-amber-800">
                ₹{summary.pendingPayout.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-amber-700/80 pt-1">
                Collected fees awaiting withdrawal
              </p>
            </div>

            {/* Paid Out to Bank */}
            <div className="bg-white border border-[#132A24]/10 rounded-xl p-5 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700">
                Disbursed to Bank
              </span>
              <div className="text-2xl font-serif font-semibold text-blue-900">
                ₹{summary.paidOut.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-blue-700/80 pt-1">
                Completed direct bank transfers
              </p>
            </div>
          </div>

          {/* Revenue Breakdown Strip */}
          <div className="bg-[#FAF9F5] border border-[#132A24]/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#132A24]/50 block">Gross Revenue</span>
                <span className="font-semibold text-[#132A24]">₹{summary.grossRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#132A24]/50 block">Platform Fee (15%)</span>
                <span className="font-semibold text-[#132A24]/70">-₹{summary.platformFees.toLocaleString('en-IN')}</span>
              </div>
              {summary.refunds > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-red-600/70 block">Refunds / Voided</span>
                  <span className="font-semibold text-red-700">-₹{summary.refunds.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-[#132A24]/50 italic">
              Standard platform revenue share: 85% practitioner / 15% Ingress Within
            </div>
          </div>

          {/* Interactive Trend Chart */}
          <div className="bg-white border border-[#132A24]/10 rounded-xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-medium text-[#132A24] flex items-center gap-2">
                  <TrendingUp size={18} className="text-[#4E7A66]" />
                  Earnings Trend
                </h3>
                <p className="text-xs text-[#132A24]/50">
                  Daily net revenue trend across the selected period.
                </p>
              </div>

              {hoveredChartPoint && (
                <div className="text-xs text-right">
                  <span className="font-bold text-[#132A24]">{hoveredChartPoint.label}: </span>
                  <span className="font-semibold text-[#4E7A66]">₹{hoveredChartPoint.earnings.toLocaleString('en-IN')}</span>
                  <span className="text-[11px] text-[#132A24]/50 ml-1.5">({hoveredChartPoint.sessions} session{hoveredChartPoint.sessions === 1 ? '' : 's'})</span>
                </div>
              )}
            </div>

            {chartPoints.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-[#132A24]/40 bg-[#FAFAF8] rounded-xl border border-dashed border-[#132A24]/10">
                No session earnings recorded in this time range.
              </div>
            ) : (
              <div className="pt-4">
                <div className="h-48 flex items-end gap-1.5 sm:gap-2 px-2 pb-2 border-b border-[#132A24]/10 overflow-x-auto">
                  {chartPoints.map((point, idx) => {
                    const heightPercent = point.earnings > 0 ? Math.max(12, Math.round((point.earnings / maxChartEarnings) * 100)) : 3;
                    const hasEarnings = point.earnings > 0;

                    return (
                      <div
                        key={point.date || idx}
                        onMouseEnter={() => setHoveredChartPoint(point)}
                        onMouseLeave={() => setHoveredChartPoint(null)}
                        className="flex-1 min-w-[20px] max-w-[42px] h-full flex flex-col justify-end items-center group cursor-pointer"
                      >
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-md transition-all ${
                            hasEarnings
                              ? 'bg-[#4E7A66] hover:bg-[#132A24]'
                              : 'bg-[#132A24]/5 hover:bg-[#132A24]/10'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center text-[10px] text-[#132A24]/40 pt-2 px-1">
                  <span>{chartPoints[0]?.label || ''}</span>
                  {chartPoints.length > 2 && (
                    <span>{chartPoints[Math.floor(chartPoints.length / 2)]?.label || ''}</span>
                  )}
                  <span>{chartPoints[chartPoints.length - 1]?.label || ''}</span>
                </div>
              </div>
            )}
          </div>

          {/* Transactions Ledger Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-normal text-[#132A24]">
                  Session Transactions Ledger
                </h3>
                <p className="text-xs text-[#132A24]/50">
                  Itemized record of client consultations, fees, and payout status.
                </p>
              </div>
              <span className="text-xs text-[#132A24]/60 font-medium">
                {pagination.total} transaction{pagination.total === 1 ? '' : 's'}
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="bg-white border border-[#132A24]/10 rounded-2xl p-12 text-center space-y-2">
                <DollarSign size={32} className="mx-auto text-[#132A24]/30" />
                <p className="text-sm font-medium text-[#132A24]">No Transactions in Selected Period</p>
                <p className="text-xs text-[#132A24]/50 max-w-sm mx-auto">
                  When consultation sessions are booked and completed, collected session fees and platform splits appear here automatically.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-[#132A24]/10 rounded-xl overflow-hidden shadow-xs text-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAFAF8] border-b border-[#132A24]/10 text-[11px] uppercase tracking-wider text-[#132A24]/60 font-semibold">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Gross Fee</th>
                        <th className="py-3 px-4">Platform (15%)</th>
                        <th className="py-3 px-4">Net Earned</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#132A24]/10">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#FAFAF8]/80 transition-colors">
                          <td className="py-3 px-4 text-[#132A24]/70">
                            {new Date(tx.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 font-medium text-[#132A24]">
                            {tx.clientLabel}
                          </td>
                          <td className="py-3 px-4 text-[#132A24]">
                            ₹{tx.grossAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-[#132A24]/50">
                            -₹{tx.platformFee.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#4E7A66]">
                            ₹{tx.netAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(tx.status)}`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pagination.totalPages > 1 && (
                  <div className="p-3 bg-[#FAFAF8] border-t border-[#132A24]/10 flex items-center justify-between text-xs">
                    <span className="text-[#132A24]/60 text-[11px]">
                      Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                        disabled={pagination.page <= 1}
                        className="p-1 rounded-lg border border-[#132A24]/15 bg-white text-[#132A24] disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        onClick={() => setActivePage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={pagination.page >= pagination.totalPages}
                        className="p-1 rounded-lg border border-[#132A24]/15 bg-white text-[#132A24] disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Disbursements & Withdrawals Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-normal text-[#132A24]">
                  Bank Payout Batches & Direct Withdrawals
                </h3>
                <p className="text-xs text-[#132A24]/50">
                  Track completed payouts and therapist-initiated withdrawals to verified accounts.
                </p>
              </div>
            </div>

            {payouts.length === 0 && withdrawals.length === 0 ? (
              <div className="bg-white border border-[#132A24]/10 rounded-xl p-6 text-center text-xs text-[#132A24]/50">
                No payouts or withdrawals processed yet. Withdrawals requested above will be tracked here with live UTR references.
              </div>
            ) : (
              <div className="bg-white border border-[#132A24]/10 rounded-xl overflow-hidden shadow-xs text-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAFAF8] border-b border-[#132A24]/10 text-[11px] uppercase tracking-wider text-[#132A24]/60 font-semibold">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Reference / UTR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#132A24]/10">
                      {withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-[#FAFAF8]/80 transition-colors">
                          <td className="py-3 px-4 text-[#132A24]/70">
                            {new Date(w.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 font-medium text-[#132A24]">
                            Direct Withdrawal
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#4E7A66]">
                            ₹{w.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(w.status)}`}>
                              {w.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[#132A24]/70 text-[11px]">
                            {w.utr_number || w.provider_payout_id || 'Pending execution'}
                          </td>
                        </tr>
                      ))}

                      {payouts.map((p) => (
                        <tr key={p.id} className="hover:bg-[#FAFAF8]/80 transition-colors">
                          <td className="py-3 px-4 text-[#132A24]/70">
                            {p.paidDate
                              ? new Date(p.paidDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : new Date(p.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                          </td>
                          <td className="py-3 px-4 font-medium text-[#132A24]">
                            Scheduled Batch ({p.period})
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#4E7A66]">
                            ₹{p.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(p.status)}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[#132A24]/70 text-[11px]">
                            {p.bankReference || 'Pending disbursement'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* WITHDRAWAL MODAL */}
      <AnimatePresence>
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#132A24]/10 relative space-y-5"
            >
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="absolute top-4 right-4 text-[#132A24]/40 hover:text-[#132A24] cursor-pointer"
              >
                <X size={18} />
              </button>

              <div>
                <h3 className="font-serif text-xl font-medium text-[#132A24] flex items-center gap-2">
                  <Wallet size={20} className="text-[#4E7A66]" />
                  Withdraw Earnings
                </h3>
                <p className="text-xs text-[#132A24]/60 mt-1">
                  Disburse your available session earnings directly to your verified payout destination.
                </p>
              </div>

              <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#132A24]/10 flex items-center justify-between">
                <span className="text-xs text-[#132A24]/70 font-medium">Available Balance:</span>
                <span className="text-lg font-serif font-bold text-[#132A24]">
                  ₹{balance.availableToWithdraw.toLocaleString('en-IN')}
                </span>
              </div>

              <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#132A24]/70 font-medium mb-1">
                    Select Payout Destination
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    required
                    className="w-full border border-[#132A24]/15 rounded-xl px-3 py-2 bg-white text-[#132A24] focus:outline-hidden"
                  >
                    {payoutAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bank_name || 'Bank'} {acc.masked_identifier} ({acc.account_type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#132A24]/70 font-medium">
                      Amount to Withdraw (INR)
                    </label>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(balance.availableToWithdraw.toString())}
                      className="text-[11px] text-[#4E7A66] hover:underline cursor-pointer font-medium"
                    >
                      Withdraw All
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#132A24]/50 font-medium">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="100"
                      max={balance.availableToWithdraw}
                      required
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="e.g. 2500"
                      className="w-full border border-[#132A24]/15 rounded-xl pl-8 pr-3 py-2 bg-white text-[#132A24] text-xs font-semibold focus:outline-hidden"
                    />
                  </div>
                  <p className="text-[10px] text-[#132A24]/40 mt-1">
                    Minimum withdrawal amount: ₹100.00
                  </p>
                </div>

                {withdrawFeedback && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      withdrawFeedback.type === 'error'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    {withdrawFeedback.type === 'error' ? (
                      <AlertCircle size={14} className="shrink-0 text-red-600" />
                    ) : (
                      <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                    )}
                    <span>{withdrawFeedback.message}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="px-4 py-2 border border-[#132A24]/15 rounded-xl text-[#132A24]/70 hover:bg-[#132A24]/5 cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={withdrawSubmitting || balance.availableToWithdraw < 100}
                    className="px-5 py-2 bg-[#132A24] text-white rounded-xl font-medium hover:bg-[#132A24]/90 cursor-pointer shadow-xs disabled:opacity-40 inline-flex items-center gap-1.5"
                  >
                    {withdrawSubmitting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" /> Processing...
                      </>
                    ) : (
                      'Confirm Withdrawal'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD PAYOUT ACCOUNT MODAL */}
      <AnimatePresence>
        {isAddAccountModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#132A24]/10 relative space-y-5"
            >
              <button
                onClick={() => setIsAddAccountModalOpen(false)}
                className="absolute top-4 right-4 text-[#132A24]/40 hover:text-[#132A24] cursor-pointer"
              >
                <X size={18} />
              </button>

              <div>
                <h3 className="font-serif text-xl font-medium text-[#132A24] flex items-center gap-2">
                  <CreditCard size={20} className="text-[#4E7A66]" />
                  Add Payout Method
                </h3>
                <p className="text-xs text-[#132A24]/60 mt-1">
                  Connect a verified bank account or UPI destination for instant earnings disbursement.
                </p>
              </div>

              {/* Privacy Security Callout */}
              <div className="bg-[#FAF9F5] border border-[#132A24]/10 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-[#132A24]/70">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Zero Raw Storage:</strong> Ingress Within uses Razorpay fund account tokenization. We never store debit/credit card numbers or banking PINs.
                </p>
              </div>

              {/* Tab Selector: Bank vs UPI */}
              <div className="grid grid-cols-2 gap-1 bg-[#FAFAF8] p-1 rounded-xl border border-[#132A24]/10 text-xs">
                <button
                  type="button"
                  onClick={() => setAccountType('bank')}
                  className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    accountType === 'bank'
                      ? 'bg-[#132A24] text-white shadow-2xs'
                      : 'text-[#132A24]/70 hover:bg-[#132A24]/5'
                  }`}
                >
                  Bank Account (IMPS/NEFT)
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('upi')}
                  className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    accountType === 'upi'
                      ? 'bg-[#132A24] text-white shadow-2xs'
                      : 'text-[#132A24]/70 hover:bg-[#132A24]/5'
                  }`}
                >
                  UPI VPA
                </button>
              </div>

              <form onSubmit={handleAddAccountSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[#132A24]/70 font-medium mb-1">
                    Beneficiary Name (as per bank / PAN)
                  </label>
                  <input
                    type="text"
                    required
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    placeholder="e.g. Dr. Priya Sharma"
                    className="w-full border border-[#132A24]/15 rounded-xl px-3 py-2 bg-white text-[#132A24] focus:outline-hidden"
                  />
                </div>

                {accountType === 'bank' ? (
                  <>
                    <div>
                      <label className="block text-[#132A24]/70 font-medium mb-1">
                        Bank Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank, ICICI Bank"
                        className="w-full border border-[#132A24]/15 rounded-xl px-3 py-2 bg-white text-[#132A24] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[#132A24]/70 font-medium mb-1">
                        Bank Account Number
                      </label>
                      <input
                        type="password"
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter account number"
                        className="w-full border border-[#132A24]/15 rounded-xl px-3 py-2 bg-white text-[#132A24] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[#132A24]/70 font-medium mb-1">
                        Confirm Account Number
                      </label>
                      <input
                        type="text"
                        required
                        value={confirmAccountNumber}
                        onChange={(e) => setConfirmAccountNumber(e.target.value)}
                        placeholder="Re-enter account number"
                        className="w-full border border-[#132A24]/15 rounded-xl px-3 py-2 bg-white text-[#132A24] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[#132A24]/70 font-medium mb-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={11}
                        value={ifsc}
                        onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                        placeholder="e.g. HDFC0001234"
                        className="w-full border border-[#132A24]/15 rounded-xl px-3 py-2 bg-white text-[#132A24] font-mono uppercase focus:outline-hidden"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-[#132A24]/70 font-medium mb-1">
                      UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      required
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. priya@okhdfcbank"
                      className="w-full border border-[#132A24]/15 rounded-xl px-3 py-2 bg-white text-[#132A24] focus:outline-hidden"
                    />
                  </div>
                )}

                {accountError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0 text-red-600" />
                    <span>{accountError}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddAccountModalOpen(false)}
                    className="px-4 py-2 border border-[#132A24]/15 rounded-xl text-[#132A24]/70 hover:bg-[#132A24]/5 cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={accountSubmitting}
                    className="px-5 py-2 bg-[#132A24] text-white rounded-xl font-medium hover:bg-[#132A24]/90 cursor-pointer shadow-xs disabled:opacity-40 inline-flex items-center gap-1.5"
                  >
                    {accountSubmitting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" /> Tokenizing...
                      </>
                    ) : (
                      'Save Payout Method'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
