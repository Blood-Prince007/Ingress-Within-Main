import crypto from 'crypto';
import { supabase } from '../db';
import { calculateEstimatedAICostPaise } from '../pricing/aiPricing';

export type ApiProvider =
  | 'internal'
  | 'claude'
  | 'groq'
  | 'gemini'
  | 'gemini_ai'
  | 'synthesizer'
  | 'razorpay'
  | 'google_calendar'
  | 'email'
  | 'supabase'
  | 'system';

export type ActorType = 'client' | 'therapist' | 'admin' | 'system' | 'anonymous';

export interface ApiUsageEvent {
  id: string;
  provider: ApiProvider;
  service: string;
  endpoint: string;
  route?: string | null;
  method?: string | null;
  status_code: number | null;
  success: boolean;
  latency_ms: number | null;
  error_category: string | null;
  actor_type?: ActorType;
  logical_request_id?: string | null;
  is_fallback?: boolean;
  model?: string | null;
  input_tokens?: number;
  output_tokens?: number;
  cache_tokens?: number;
  estimated_cost_paise?: number;
  currency?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ProviderUsageSummary {
  provider: ApiProvider;
  service: string;
  isTracked: boolean;
  status: 'TRACKED' | 'NOT_TRACKED' | 'NOT_CONFIGURED' | 'ERROR' | 'NO_RECENT_DATA';
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRatePercent: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  lastRequestAt: string | null;
  totalTokens?: number;
  estimatedCostPaise?: number;
}

export interface OverviewMetrics {
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
}

export interface TimeSeriesPoint {
  timestamp: string;
  requests: number;
  successes: number;
  failures: number;
  avgLatencyMs: number;
}

export interface EndpointMetric {
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
}

export interface AIOperationMetric {
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
}

export class ApiUsageService {
  private static inMemoryEvents: ApiUsageEvent[] = [];

  /**
   * Normalizes raw URLs into parameterized route templates.
   * e.g. /api/therapist/clients/123 -> /api/therapist/clients/[id]
   */
  static normalizeRoute(url: string): string {
    if (!url) return '/api/unknown';
    // Remove query params
    const pathname = url.split('?')[0].replace(/\/$/, '') || '/';
    // Replace UUIDs
    let normalized = pathname.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '[id]'
    );
    // Replace integer IDs
    normalized = normalized.replace(/\/\d+(?=\/|$)/g, '/[id]');
    // Replace common dynamic tokens
    normalized = normalized.replace(/\/rcpt_[a-zA-Z0-9_-]+/g, '/[id]');
    normalized = normalized.replace(/\/order_[a-zA-Z0-9_-]+/g, '/[id]');
    return normalized;
  }

  /**
   * Sanitizes metadata to strip sensitive fields, credentials, clinical text, and body payloads.
   */
  private static sanitizeMetadata(meta: Record<string, any>): Record<string, any> {
    const clean: Record<string, any> = {};
    const forbidden = [
      'token', 'secret', 'key', 'auth', 'password', 'cookie', 'session',
      'body', 'payload', 'prompt', 'response', 'journal', 'note', 'soap',
      'clinical', 'patient', 'user_content', 'system_prompt', 'raw_response'
    ];
    for (const [k, v] of Object.entries(meta || {})) {
      if (forbidden.some((f) => k.toLowerCase().includes(f))) {
        clean[k] = '[REDACTED]';
      } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        clean[k] = this.sanitizeMetadata(v);
      } else {
        clean[k] = v;
      }
    }
    return clean;
  }

  /**
   * Fail-safe recording of an API or external provider usage event.
   */
  static async recordEvent(params: {
    provider: ApiProvider;
    service: string;
    endpoint: string;
    route?: string | null;
    method?: string | null;
    statusCode?: number | null;
    success: boolean;
    latencyMs?: number | null;
    errorCategory?: string | null;
    actorType?: ActorType;
    logicalRequestId?: string | null;
    isFallback?: boolean;
    model?: string | null;
    inputTokens?: number;
    outputTokens?: number;
    cacheTokens?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const normalizedRoute = params.route || this.normalizeRoute(params.endpoint);
      const estCostPaise = calculateEstimatedAICostPaise({
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        cacheTokens: params.cacheTokens,
      });

      const event: ApiUsageEvent = {
        id: crypto.randomUUID(),
        provider: params.provider,
        service: params.service,
        endpoint: params.endpoint,
        route: normalizedRoute,
        method: params.method?.toUpperCase() || (params.provider === 'internal' ? 'GET' : 'POST'),
        status_code: params.statusCode ?? (params.success ? 200 : 500),
        success: params.success,
        latency_ms: params.latencyMs ?? null,
        error_category: params.errorCategory || null,
        actor_type: params.actorType || 'anonymous',
        logical_request_id: params.logicalRequestId || null,
        is_fallback: Boolean(params.isFallback),
        model: params.model || null,
        input_tokens: params.inputTokens || 0,
        output_tokens: params.outputTokens || 0,
        cache_tokens: params.cacheTokens || 0,
        estimated_cost_paise: estCostPaise,
        currency: 'INR',
        metadata: this.sanitizeMetadata(params.metadata || {}),
        created_at: new Date().toISOString(),
      };

      // 1. Maintain in-memory ring buffer (up to 2,000 recent events for live fallbacks)
      this.inMemoryEvents.push(event);
      if (this.inMemoryEvents.length > 2000) {
        this.inMemoryEvents.shift();
      }

      // 2. Persist to Supabase asynchronously (fail-safe)
      supabase.from('api_usage_events').insert(event).then(
        ({ error }) => {
          if (error) {
            // Silently notice; telemetry must NEVER disrupt user traffic
            console.warn('[ApiUsageService] DB insert notice:', error.message);
          }
        },
        (err) => {
          console.warn('[ApiUsageService] Network insert notice:', err.message);
        }
      );
    } catch (err: any) {
      console.warn('[ApiUsageService] Non-invasive notice:', err.message);
    }
  }

  /**
   * Helper to fetch events filtered by date range and provider.
   */
  static async getEventsForRange(options: {
    startDate: Date;
    endDate?: Date;
    provider?: string;
  }): Promise<ApiUsageEvent[]> {
    const end = options.endDate || new Date();
    try {
      let query = supabase
        .from('api_usage_events')
        .select('*')
        .gte('created_at', options.startDate.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false })
        .limit(2000);

      if (options.provider && options.provider !== 'all') {
        query = query.eq('provider', options.provider);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as ApiUsageEvent[];
      }
    } catch {
      // Fall through to in-memory events
    }

    // Fallback to in-memory filter
    return this.inMemoryEvents.filter((e) => {
      const t = new Date(e.created_at).getTime();
      const matchTime = t >= options.startDate.getTime() && t <= end.getTime();
      const matchProv = !options.provider || options.provider === 'all' || e.provider === options.provider;
      return matchTime && matchProv;
    });
  }

  /**
   * Calculates percentile latency (P95, P99).
   */
  private static calculatePercentile(latencies: number[], percentile: number): number {
    if (latencies.length === 0) return 0;
    const sorted = [...latencies].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  /**
   * Computes top-level overview metrics for a given timeframe.
   */
  static async getOverviewMetrics(startDate: Date): Promise<OverviewMetrics> {
    const events = await this.getEventsForRange({ startDate });
    const total = events.length;
    const successful = events.filter((e) => e.success).length;
    const failed = total - successful;
    const successRate = total > 0 ? Math.round((successful / total) * 1000) / 10 : 0;
    const errorRate = total > 0 ? Math.round((failed / total) * 1000) / 10 : 0;

    const latencies = events
      .map((e) => e.latency_ms)
      .filter((l): l is number => typeof l === 'number');

    const avgLatency = latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;
    const p95Latency = this.calculatePercentile(latencies, 95);

    const errors4xx = events.filter((e) => e.status_code && e.status_code >= 400 && e.status_code < 500).length;
    const errors5xx = events.filter((e) => e.status_code && e.status_code >= 500).length;

    let totalTokens = 0;
    let totalCostPaise = 0;

    for (const e of events) {
      totalTokens += (e.input_tokens || 0) + (e.output_tokens || 0);
      totalCostPaise += (e.estimated_cost_paise || 0);
    }

    return {
      totalRequests: total,
      successfulRequests: successful,
      failedRequests: failed,
      successRatePercent: successRate,
      errorRatePercent: errorRate,
      avgLatencyMs: avgLatency,
      p95LatencyMs: p95Latency,
      errors4xx,
      errors5xx,
      estimatedAICostPaise: totalCostPaise,
      totalAITokens: totalTokens,
    };
  }

  /**
   * Time series traffic points bucketed appropriately based on timeframe.
   */
  static async getTimeSeries(startDate: Date, bucketMinutes: number = 60): Promise<TimeSeriesPoint[]> {
    const events = await this.getEventsForRange({ startDate });
    const bucketMap: Record<string, { requests: number; successes: number; failures: number; latencies: number[] }> = {};

    const bucketMs = bucketMinutes * 60 * 1000;

    for (const e of events) {
      const timeMs = new Date(e.created_at).getTime();
      const roundedMs = Math.floor(timeMs / bucketMs) * bucketMs;
      const key = new Date(roundedMs).toISOString();

      if (!bucketMap[key]) {
        bucketMap[key] = { requests: 0, successes: 0, failures: 0, latencies: [] };
      }
      bucketMap[key].requests++;
      if (e.success) {
        bucketMap[key].successes++;
      } else {
        bucketMap[key].failures++;
      }
      if (typeof e.latency_ms === 'number') {
        bucketMap[key].latencies.push(e.latency_ms);
      }
    }

    return Object.entries(bucketMap)
      .map(([timestamp, data]) => ({
        timestamp,
        requests: data.requests,
        successes: data.successes,
        failures: data.failures,
        avgLatencyMs: data.latencies.length > 0
          ? Math.round(data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length)
          : 0,
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Aggregates metrics by normalized endpoint.
   */
  static async getEndpointMetrics(startDate: Date): Promise<EndpointMetric[]> {
    const events = await this.getEventsForRange({ startDate, provider: 'internal' });
    const endpointMap: Record<string, {
      method: string;
      total: number;
      successes: number;
      latencies: number[];
      err4xx: number;
      err5xx: number;
    }> = {};

    for (const e of events) {
      const key = `${e.method || 'GET'} ${e.route || e.endpoint}`;
      if (!endpointMap[key]) {
        endpointMap[key] = {
          method: e.method || 'GET',
          total: 0,
          successes: 0,
          latencies: [],
          err4xx: 0,
          err5xx: 0,
        };
      }
      endpointMap[key].total++;
      if (e.success) endpointMap[key].successes++;
      if (typeof e.latency_ms === 'number') endpointMap[key].latencies.push(e.latency_ms);
      if (e.status_code && e.status_code >= 400 && e.status_code < 500) endpointMap[key].err4xx++;
      if (e.status_code && e.status_code >= 500) endpointMap[key].err5xx++;
    }

    return Object.entries(endpointMap)
      .map(([key, data]) => {
        const ep = key.split(' ')[1] || key;
        const total = data.total;
        const successful = data.successes;
        const failed = total - successful;
        const successRate = total > 0 ? Math.round((successful / total) * 1000) / 10 : 0;
        const avgLat = data.latencies.length > 0
          ? Math.round(data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length)
          : 0;
        const p95 = this.calculatePercentile(data.latencies, 95);

        return {
          endpoint: ep,
          method: data.method,
          totalRequests: total,
          successfulRequests: successful,
          failedRequests: failed,
          successRatePercent: successRate,
          avgLatencyMs: avgLat,
          p95LatencyMs: p95,
          errors4xx: data.err4xx,
          errors5xx: data.err5xx,
        };
      })
      .sort((a, b) => b.totalRequests - a.totalRequests);
  }

  /**
   * Aggregates usage data for each registered external provider.
   */
  static async getUsageSummary(startDate?: Date): Promise<ProviderUsageSummary[]> {
    const knownProviders: { provider: ApiProvider; service: string }[] = [
      { provider: 'claude', service: 'Primary AI (Claude 3.5 Sonnet)' },
      { provider: 'groq', service: 'Secondary AI Fallback (Llama 3.3)' },
      { provider: 'gemini', service: 'Tertiary AI Fallback (Gemini 1.5/2.0)' },
      { provider: 'gemini_ai', service: 'Tertiary AI Fallback (Gemini)' },
      { provider: 'synthesizer', service: 'Autonomous AI Synthesizer' },
      { provider: 'razorpay', service: 'Payments & Payouts' },
      { provider: 'google_calendar', service: 'Google Calendar & Meet' },
      { provider: 'email', service: 'Transactional Email (Resend)' },
      { provider: 'supabase', service: 'Application-Tracked Supabase' },
    ];

    const effectiveStart = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await this.getEventsForRange({ startDate: effectiveStart });

    const summaries: ProviderUsageSummary[] = [];

    for (const item of knownProviders) {
      const pEvents = events.filter((e) => {
        if (item.provider === 'gemini') {
          return e.provider === 'gemini' || e.provider === 'gemini_ai';
        }
        return e.provider === item.provider;
      });

      if (pEvents.length === 0) {
        summaries.push({
          provider: item.provider,
          service: item.service,
          isTracked: false,
          status: 'NOT_TRACKED',
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          successRatePercent: 0,
          avgLatencyMs: 0,
          p95LatencyMs: 0,
          lastRequestAt: null,
          totalTokens: 0,
          estimatedCostPaise: 0,
        });
        continue;
      }

      const total = pEvents.length;
      const successful = pEvents.filter((e) => e.success).length;
      const failed = total - successful;
      const successRate = total > 0 ? Math.round((successful / total) * 1000) / 10 : 0;

      const latencies = pEvents
        .map((e) => e.latency_ms)
        .filter((l): l is number => typeof l === 'number');

      const avgLatency = latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0;
      const p95 = this.calculatePercentile(latencies, 95);

      let tokens = 0;
      let costPaise = 0;
      for (const e of pEvents) {
        tokens += (e.input_tokens || 0) + (e.output_tokens || 0);
        costPaise += (e.estimated_cost_paise || 0);
      }

      summaries.push({
        provider: item.provider,
        service: item.service,
        isTracked: true,
        status: 'TRACKED',
        totalRequests: total,
        successfulRequests: successful,
        failedRequests: failed,
        successRatePercent: successRate,
        avgLatencyMs: avgLatency,
        p95LatencyMs: p95,
        lastRequestAt: pEvents[0]?.created_at || null,
        totalTokens: tokens,
        estimatedCostPaise: costPaise,
      });
    }

    return summaries;
  }

  /**
   * Aggregates AI feature operation metrics.
   */
  static async getAIOperationMetrics(startDate: Date): Promise<AIOperationMetric[]> {
    const aiProviders: ApiProvider[] = ['claude', 'groq', 'gemini', 'gemini_ai', 'synthesizer'];
    const events = (await this.getEventsForRange({ startDate })).filter((e) =>
      aiProviders.includes(e.provider)
    );

    const opMap: Record<string, {
      operation: string;
      provider: string;
      model: string;
      total: number;
      successes: number;
      fallbacks: number;
      inTokens: number;
      outTokens: number;
      latencies: number[];
      costPaise: number;
    }> = {};

    for (const e of events) {
      const op = e.service || 'general_ai';
      const key = `${op}:${e.provider}:${e.model || 'default'}`;

      if (!opMap[key]) {
        opMap[key] = {
          operation: op,
          provider: e.provider,
          model: e.model || 'default',
          total: 0,
          successes: 0,
          fallbacks: 0,
          inTokens: 0,
          outTokens: 0,
          latencies: [],
          costPaise: 0,
        };
      }

      opMap[key].total++;
      if (e.success) opMap[key].successes++;
      if (e.is_fallback) opMap[key].fallbacks++;
      opMap[key].inTokens += e.input_tokens || 0;
      opMap[key].outTokens += e.output_tokens || 0;
      opMap[key].costPaise += e.estimated_cost_paise || 0;
      if (typeof e.latency_ms === 'number') opMap[key].latencies.push(e.latency_ms);
    }

    return Object.values(opMap).map((item) => ({
      operation: item.operation,
      provider: item.provider,
      model: item.model,
      requests: item.total,
      successfulRequests: item.successes,
      fallbackCount: item.fallbacks,
      inputTokens: item.inTokens,
      outputTokens: item.outTokens,
      totalTokens: item.inTokens + item.outTokens,
      avgLatencyMs: item.latencies.length > 0
        ? Math.round(item.latencies.reduce((a, b) => a + b, 0) / item.latencies.length)
        : 0,
      estimatedCostPaise: item.costPaise,
    }));
  }

  /**
   * Fetches recent API usage event log safely.
   */
  static async getRecentEvents(limit = 50, provider?: string): Promise<ApiUsageEvent[]> {
    try {
      let query = supabase
        .from('api_usage_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (provider && provider !== 'all') {
        query = query.eq('provider', provider);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as ApiUsageEvent[];
      }
    } catch {
      // Fall through to memory
    }

    const filtered = provider && provider !== 'all'
      ? this.inMemoryEvents.filter((e) => e.provider === provider)
      : this.inMemoryEvents;

    return [...filtered]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }
}
