import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Clock, CheckCircle2, Shield, Calendar, ArrowDownRight } from 'lucide-react';

export default function TherapistEarningsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEarnings() {
      try {
        const res = await fetch('/api/therapist/earnings');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load earnings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEarnings();
  }, []);

  const summary = data?.summary || {
    currentMonthCollected: 0,
    totalCollected: 0,
    pendingPayout: 0,
    paidOutTotal: 0,
    currency: 'INR',
  };

  const transactions = data?.transactions || [];
  const payouts = data?.payouts || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'collected':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'paid':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'processing':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'cancelled':
        return 'bg-zinc-100 text-zinc-600 border border-zinc-200 line-through';
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
      {/* Header */}
      <div className="border-b border-[#132A24]/10 pb-6">
        <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#4E7A66]">
          Financial Ledger
        </span>
        <h1 className="font-serif text-3xl font-normal text-[#132A24] mt-1">
          Earnings & Payouts
        </h1>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#132A24]/50 animate-pulse">
          Calculating earnings ledger...
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#132A24]/10 rounded-xl p-5 shadow-xs">
              <div className="text-xs text-[#132A24]/60 font-medium mb-1">This Month</div>
              <div className="text-2xl font-serif text-[#132A24] font-semibold">
                ₹{summary.currentMonthCollected.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-[#4E7A66] font-medium mt-1 block">Collected Net</span>
            </div>

            <div className="bg-white border border-[#132A24]/10 rounded-xl p-5 shadow-xs">
              <div className="text-xs text-[#132A24]/60 font-medium mb-1">Total Collected</div>
              <div className="text-2xl font-serif text-[#132A24] font-semibold">
                ₹{summary.totalCollected.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-[#132A24]/40 mt-1 block">Cumulative practice revenue</span>
            </div>

            <div className="bg-white border border-[#132A24]/10 rounded-xl p-5 shadow-xs">
              <div className="text-xs text-[#132A24]/60 font-medium mb-1">Pending Payout</div>
              <div className="text-2xl font-serif text-amber-700 font-semibold">
                ₹{summary.pendingPayout.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-amber-600 font-medium mt-1 block">Scheduled for next batch</span>
            </div>

            <div className="bg-white border border-[#132A24]/10 rounded-xl p-5 shadow-xs">
              <div className="text-xs text-[#132A24]/60 font-medium mb-1">Paid Out to Bank</div>
              <div className="text-2xl font-serif text-[#132A24] font-semibold">
                ₹{(summary.paidOut || summary.paidOutTotal || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-[#132A24]/40 mt-1 block">Direct bank transfers</span>
            </div>
          </div>

          {/* Payout Batches Section */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-normal text-[#132A24]">
              Bank Payout Batches
            </h3>
            {payouts.length === 0 ? (
              <div className="bg-white border border-[#132A24]/10 rounded-xl p-6 text-center text-xs text-[#132A24]/50">
                No bank payout batches processed yet. Completed sessions will be grouped into scheduled disbursement batches.
              </div>
            ) : (
              <div className="bg-white border border-[#132A24]/10 rounded-xl overflow-hidden shadow-xs text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAFAF8] border-b border-[#132A24]/10 text-[11px] uppercase tracking-wider text-[#132A24]/60 font-semibold">
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4">Net Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Paid Date</th>
                      <th className="py-3 px-4">Bank Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#132A24]/10">
                    {payouts.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAFAF8]/80 transition-colors">
                        <td className="py-3 px-4 font-medium text-[#132A24]">{p.period}</td>
                        <td className="py-3 px-4 font-semibold text-[#4E7A66]">₹{p.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(p.status)}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#132A24]/70">
                          {p.paidDate
                            ? new Date(p.paidDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#132A24]/70 text-[11px]">
                          {p.bankReference || 'Pending disbursement'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Transactions List */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-normal text-[#132A24]">
              Session Transactions Ledger
            </h3>

            {transactions.length === 0 ? (
              <div className="bg-white border border-[#132A24]/10 rounded-2xl p-12 text-center space-y-2">
                <DollarSign size={32} className="mx-auto text-[#132A24]/30" />
                <p className="text-sm font-medium text-[#132A24]">No Transactions Recorded</p>
                <p className="text-xs text-[#132A24]/50 max-w-sm mx-auto">
                  When consultation sessions are completed, collected session fees and platform splits appear here automatically.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-[#132A24]/10 rounded-xl overflow-hidden shadow-xs text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAFAF8] border-b border-[#132A24]/10 text-[11px] uppercase tracking-wider text-[#132A24]/60 font-semibold">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Gross Fee</th>
                      <th className="py-3 px-4">Platform (15%)</th>
                      <th className="py-3 px-4">Net Payout</th>
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
                        <td className="py-3 px-4 font-medium text-[#132A24]">{tx.clientLabel}</td>
                        <td className="py-3 px-4 text-[#132A24]">₹{tx.grossAmount || tx.gross}</td>
                        <td className="py-3 px-4 text-[#132A24]/50">₹{tx.platformFee}</td>
                        <td className="py-3 px-4 font-semibold text-[#4E7A66]">₹{tx.netAmount || tx.net}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(tx.financialStatus || tx.status)}`}>
                            {tx.financialStatus || tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
