import React, { useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Cpu,
  Layers,
  RefreshCw,
  Server,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CreditCard,
  DollarSign,
  ChevronRight,
  TrendingUp,
  Database,
  Mail,
  Calendar,
} from 'lucide-react';

interface ApiUsageProps {
  data: {
    timeframe?: {
      range: string;
      startDate: string;
      endDate: string;
      bucketMinutes: number;
    };
    overview?: {
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      successRatePercent: number;
      errorRatePercent: number;
      avgLatencyMs: number;
      p95LatencyMs: number;
      errors4xx: number;
      errors5xx: number;
      estimatedAICostPaise: number;
      totalAITokens: number;
    };
    timeSeries?: Array<{
      timestamp: string;
      requests: number;
      successes: number;
      failures: number;
      avgLatencyMs: number;
    }>;
    topEndpoints?: Array<{
      endpoint: string;
      method: string;
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      successRatePercent: number;
      avgLatencyMs: number;
      p95LatencyMs: number;
      errors4xx: number;
      errors5xx: number;
    }>;
    providerSummaries?: Array<{
      provider: string;
      service: string;
      isTracked: boolean;
      status: string;
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      successRatePercent: number;
      avgLatencyMs: number;
      p95LatencyMs: number;
      lastRequestAt: string | null;
      totalTokens?: number;
      estimatedCostPaise?: number;
    }>;
    aiOperations?: Array<{
      operation: string;
      provider: string;
      model: string;
      requests: number;
      successfulRequests: number;
      fallbackCount: number;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      avgLatencyMs: number;
      estimatedCostPaise: number;
    }>;
    recentEvents?: Array<any>;
  };
  onRefresh: (range: string) => void;
  isLoading?: boolean;
}

export default function ApiTrafficCenterView({ data, onRefresh, isLoading }: ApiUsageProps) {
  const [selectedRange, setSelectedRange] = useState('24h');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'traffic' | 'providers' | 'ai' | 'errors' | 'costs' | 'endpoints'>('overview');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

  const overview = data?.overview || {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    successRatePercent: 0,
    errorRatePercent: 0,
    avgLatencyMs: 0,
    p95LatencyMs: 0,
    errors4xx: 0,
    errors5xx: 0,
    estimatedAICostPaise: 0,
    totalAITokens: 0,
  };

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    onRefresh(range);
  };

  const formatPaiseToInr = (paise: number = 0) => {
    const inr = Math.round(paise) / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(inr);
  };

  const formatNumber = (num: number = 0) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  // Provider icon mapper
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'claude':
        return Cpu;
      case 'groq':
        return Zap;
      case 'gemini':
      case 'gemini_ai':
        return Activity;
      case 'razorpay':
        return CreditCard;
      case 'google_calendar':
        return Calendar;
      case 'email':
        return Mail;
      case 'supabase':
        return Database;
      default:
        return Server;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#132A24] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#2D5A46]" />
            API Usage & Traffic Center
          </h2>
          <p className="text-xs text-[#132A24]/60 mt-0.5">
            Real-time observability, provider health, AI token consumption, and latency analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex bg-[#F4F4F0] p-1 rounded-xl text-xs font-medium text-[#132A24]/70">
            {['1h', '24h', '7d', '30d'].map((r) => (
              <button
                key={r}
                onClick={() => handleRangeChange(r)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  selectedRange === r
                    ? 'bg-white text-[#132A24] font-semibold shadow-xs'
                    : 'hover:text-[#132A24]'
                }`}
              >
                {r === '1h' ? 'Last 1h' : r === '24h' ? 'Last 24h' : r === '7d' ? 'Last 7d' : 'Last 30d'}
              </button>
            ))}
          </div>

          <button
            onClick={() => onRefresh(selectedRange)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#132A24] text-white text-xs font-medium rounded-xl hover:bg-[#1E3B33] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex border-b border-[#132A24]/10 gap-1 overflow-x-auto text-xs font-medium">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'traffic', label: 'API Traffic' },
          { id: 'providers', label: 'Providers' },
          { id: 'ai', label: 'AI Usage & Fallbacks' },
          { id: 'errors', label: 'Error Analytics' },
          { id: 'costs', label: 'Costs' },
          { id: 'endpoints', label: 'Top Endpoints' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2.5 border-b-2 font-medium transition-all whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'border-[#2D5A46] text-[#2D5A46] font-semibold'
                : 'border-transparent text-[#132A24]/60 hover:text-[#132A24]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TOP-LEVEL OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#132A24]/10 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-medium text-[#132A24]/60 uppercase tracking-wider">Total Requests</div>
          <div className="text-xl font-bold font-serif text-[#132A24] mt-1">{formatNumber(overview.totalRequests)}</div>
          <div className="text-[10px] text-[#2D5A46] flex items-center gap-0.5 mt-1">
            <CheckCircle2 className="w-3 h-3" />
            {overview.successfulRequests} successful
          </div>
        </div>

        <div className="bg-white border border-[#132A24]/10 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-medium text-[#132A24]/60 uppercase tracking-wider">Success Rate</div>
          <div className="text-xl font-bold font-serif text-[#2D5A46] mt-1">{overview.successRatePercent}%</div>
          <div className="text-[10px] text-[#132A24]/50 mt-1">
            {overview.errorRatePercent}% error rate
          </div>
        </div>

        <div className="bg-white border border-[#132A24]/10 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-medium text-[#132A24]/60 uppercase tracking-wider">Average Latency</div>
          <div className="text-xl font-bold font-mono text-[#132A24] mt-1">{overview.avgLatencyMs} ms</div>
          <div className="text-[10px] text-[#132A24]/50 mt-1">Execution mean</div>
        </div>

        <div className="bg-white border border-[#132A24]/10 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-medium text-[#132A24]/60 uppercase tracking-wider">P95 Latency</div>
          <div className="text-xl font-bold font-mono text-[#132A24] mt-1">{overview.p95LatencyMs} ms</div>
          <div className="text-[10px] text-[#132A24]/50 mt-1">95th percentile</div>
        </div>

        <div className="bg-white border border-[#132A24]/10 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-medium text-[#132A24]/60 uppercase tracking-wider">5xx Errors</div>
          <div className="text-xl font-bold font-serif text-rose-600 mt-1">{overview.errors5xx}</div>
          <div className="text-[10px] text-[#132A24]/50 mt-1">{overview.errors4xx} client (4xx)</div>
        </div>

        <div className="bg-white border border-[#132A24]/10 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-medium text-[#132A24]/60 uppercase tracking-wider">Est. AI Cost</div>
          <div className="text-xl font-bold font-serif text-[#132A24] mt-1">
            {formatPaiseToInr(overview.estimatedAICostPaise)}
          </div>
          <div className="text-[10px] text-[#132A24]/50 mt-1">{formatNumber(overview.totalAITokens)} tokens</div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & TIME-SERIES */}
      {(activeSubTab === 'overview' || activeSubTab === 'traffic') && (
        <div className="space-y-6">
          {/* Traffic Graph Card */}
          <div className="bg-white border border-[#132A24]/10 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-[#132A24] text-base">API Traffic & Latency Over Time</h3>
                <p className="text-xs text-[#132A24]/60">Bucketed request volume and performance curve</p>
              </div>
              <span className="text-xs font-mono text-[#132A24]/50 bg-[#F4F4F0] px-2.5 py-1 rounded-lg">
                Range: {selectedRange}
              </span>
            </div>

            {/* Time-series bars visualization */}
            {data?.timeSeries && data.timeSeries.length > 0 ? (
              <div className="pt-4 space-y-2">
                <div className="h-44 flex items-end gap-1.5 border-b border-[#132A24]/10 pb-2">
                  {data.timeSeries.map((pt, idx) => {
                    const maxReq = Math.max(...data.timeSeries!.map((p) => p.requests), 1);
                    const heightPercent = Math.max(8, Math.round((pt.requests / maxReq) * 100));
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center group relative cursor-pointer"
                      >
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-[#132A24] text-white text-[10px] rounded-lg p-2 shadow-lg z-20 whitespace-nowrap">
                          <span className="font-semibold">{new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>Requests: {pt.requests}</span>
                          <span className="text-emerald-300">Successes: {pt.successes}</span>
                          <span className="text-rose-300">Failures: {pt.failures}</span>
                          <span className="text-sky-300">Avg Latency: {pt.avgLatencyMs} ms</span>
                        </div>
                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-sm transition-all ${
                            pt.failures > 0 ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#2D5A46] hover:bg-[#1E3B33]'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-[#132A24]/40 font-mono">
                  <span>{data.timeSeries[0] ? new Date(data.timeSeries[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  <span>{data.timeSeries[data.timeSeries.length - 1] ? new Date(data.timeSeries[data.timeSeries.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#132A24]/40 italic bg-[#FAF9F5] rounded-xl">
                No telemetry traffic recorded in this timeframe. Requests will display here automatically.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PROVIDERS */}
      {(activeSubTab === 'overview' || activeSubTab === 'providers') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-[#132A24] text-base">External Provider Ecosystem</h3>
            <span className="text-xs text-[#132A24]/60">Monitors external SLAs, tokens, and health</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data?.providerSummaries?.map((p) => {
              const IconComp = getProviderIcon(p.provider);
              return (
                <div
                  key={p.provider}
                  className="bg-white border border-[#132A24]/10 rounded-2xl p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#2D5A46]/10 flex items-center justify-center text-[#2D5A46]">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-serif font-semibold text-[#132A24] text-sm capitalize">
                          {p.provider.replace('_', ' ')}
                        </div>
                        <div className="text-[10px] text-[#132A24]/50">{p.service}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                        p.isTracked
                          ? 'bg-[#2D5A46]/10 border-[#2D5A46]/20 text-[#2D5A46]'
                          : 'bg-[#132A24]/5 border-[#132A24]/10 text-[#132A24]/50'
                      }`}
                    >
                      {p.isTracked ? 'Tracked' : 'Not Tracked'}
                    </span>
                  </div>

                  {p.isTracked ? (
                    <div className="space-y-2 pt-2 border-t border-[#132A24]/10 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#132A24]/60">Requests:</span>
                        <span className="font-semibold text-[#132A24]">{formatNumber(p.totalRequests)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#132A24]/60">Success Rate:</span>
                        <span className="font-semibold text-[#2D5A46]">{p.successRatePercent}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#132A24]/60">Avg Latency:</span>
                        <span className="font-mono text-[#132A24]">{p.avgLatencyMs} ms</span>
                      </div>
                      {typeof p.totalTokens === 'number' && p.totalTokens > 0 && (
                        <div className="flex justify-between">
                          <span className="text-[#132A24]/60">Tokens:</span>
                          <span className="font-mono text-[#132A24]">{formatNumber(p.totalTokens)}</span>
                        </div>
                      )}
                      {typeof p.estimatedCostPaise === 'number' && p.estimatedCostPaise > 0 && (
                        <div className="flex justify-between">
                          <span className="text-[#132A24]/60">Est. Cost:</span>
                          <span className="font-medium text-[#132A24]">{formatPaiseToInr(p.estimatedCostPaise)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-[#132A24]/40 italic pt-2 border-t border-[#132A24]/10">
                      No events recorded in range
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: AI USAGE & FALLBACKS */}
      {(activeSubTab === 'ai' || activeSubTab === 'costs') && (
        <div className="space-y-6">
          <div className="bg-white border border-[#132A24]/10 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-serif font-bold text-[#132A24] text-base">AI Operations, Tokens & Fallbacks</h3>
              <p className="text-xs text-[#132A24]/60">
                Detailed telemetry across Claude (Primary), Groq (Fallback), Gemini (Tertiary), and Synthesizer.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#132A24]/10 text-[#132A24]/60 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-semibold">AI Operation</th>
                    <th className="pb-3 font-semibold">Provider</th>
                    <th className="pb-3 font-semibold">Model</th>
                    <th className="pb-3 font-semibold text-right">Requests</th>
                    <th className="pb-3 font-semibold text-right">Fallbacks</th>
                    <th className="pb-3 font-semibold text-right">Tokens</th>
                    <th className="pb-3 font-semibold text-right">Avg Latency</th>
                    <th className="pb-3 font-semibold text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#132A24]/5">
                  {data?.aiOperations && data.aiOperations.length > 0 ? (
                    data.aiOperations.map((op, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF9F5]">
                        <td className="py-3 font-medium text-[#132A24]">{op.operation}</td>
                        <td className="py-3 capitalize text-[#132A24]/80">{op.provider}</td>
                        <td className="py-3 font-mono text-[11px] text-[#132A24]/60">{op.model}</td>
                        <td className="py-3 text-right font-semibold text-[#132A24]">{formatNumber(op.requests)}</td>
                        <td className="py-3 text-right text-amber-600 font-medium">
                          {op.fallbackCount > 0 ? `${op.fallbackCount}` : '0'}
                        </td>
                        <td className="py-3 text-right font-mono text-[#132A24]">{formatNumber(op.totalTokens)}</td>
                        <td className="py-3 text-right font-mono text-[#132A24]/70">{op.avgLatencyMs} ms</td>
                        <td className="py-3 text-right font-semibold text-[#2D5A46]">
                          {formatPaiseToInr(op.estimatedCostPaise)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-[#132A24]/40 italic">
                        No AI operations executed in this timeframe.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TOP ENDPOINTS */}
      {(activeSubTab === 'overview' || activeSubTab === 'endpoints') && (
        <div className="bg-white border border-[#132A24]/10 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-[#132A24] text-base">Top Endpoints by Volume</h3>
              <p className="text-xs text-[#132A24]/60">Internal API endpoint traffic and error rates</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#132A24]/10 text-[#132A24]/60 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Endpoint</th>
                  <th className="pb-3 font-semibold">Method</th>
                  <th className="pb-3 font-semibold text-right">Requests</th>
                  <th className="pb-3 font-semibold text-right">Success Rate</th>
                  <th className="pb-3 font-semibold text-right">Avg Latency</th>
                  <th className="pb-3 font-semibold text-right">P95</th>
                  <th className="pb-3 font-semibold text-right">4xx</th>
                  <th className="pb-3 font-semibold text-right">5xx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#132A24]/5">
                {data?.topEndpoints && data.topEndpoints.length > 0 ? (
                  data.topEndpoints.map((ep, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedEndpoint(selectedEndpoint === ep.endpoint ? null : ep.endpoint)}
                      className="hover:bg-[#FAF9F5] cursor-pointer"
                    >
                      <td className="py-3 font-mono text-[11px] text-[#132A24] font-medium">{ep.endpoint}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-[#132A24]/5 text-[#132A24]">
                          {ep.method}
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold text-[#132A24]">{formatNumber(ep.totalRequests)}</td>
                      <td className="py-3 text-right font-semibold text-[#2D5A46]">{ep.successRatePercent}%</td>
                      <td className="py-3 text-right font-mono text-[#132A24]/70">{ep.avgLatencyMs} ms</td>
                      <td className="py-3 text-right font-mono text-[#132A24]/70">{ep.p95LatencyMs} ms</td>
                      <td className="py-3 text-right font-mono text-amber-600">{ep.errors4xx}</td>
                      <td className="py-3 text-right font-mono text-rose-600">{ep.errors5xx}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-[#132A24]/40 italic">
                      No internal endpoint traffic recorded in this timeframe.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: RECENT EVENTS LOG (FAIL-SAFE & SANITIZED) */}
      <div className="bg-white border border-[#132A24]/10 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-[#132A24] text-base">Recent Telemetry Events</h3>
            <p className="text-xs text-[#132A24]/60">Sanitized real-time stream of external calls and internal requests</p>
          </div>
          <span className="text-xs text-[#132A24]/50">Showing latest {data?.recentEvents?.length || 0} events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#132A24]/10 text-[#132A24]/60 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Provider</th>
                <th className="pb-3 font-semibold">Endpoint / Service</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Latency</th>
                <th className="pb-3 font-semibold">Model / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#132A24]/5">
              {data?.recentEvents && data.recentEvents.length > 0 ? (
                data.recentEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[#FAF9F5]">
                    <td className="py-2.5 text-[#132A24]/60 text-[11px]">
                      {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 capitalize font-medium text-[#132A24]">{evt.provider}</td>
                    <td className="py-2.5 text-[#132A24]/80 text-[11px] truncate max-w-xs">{evt.route || evt.endpoint}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          evt.success
                            ? 'bg-[#2D5A46]/10 text-[#2D5A46]'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {evt.status_code || (evt.success ? 200 : 500)}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-[#132A24]/70">{evt.latency_ms ? `${evt.latency_ms} ms` : '—'}</td>
                    <td className="py-2.5 text-[#132A24]/60 text-[10px] truncate max-w-xs">
                      {evt.model ? evt.model : evt.error_category || evt.service || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#132A24]/40 italic font-sans">
                    No recent events captured.
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
