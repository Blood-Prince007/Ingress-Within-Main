import crypto from 'crypto';
import { supabase } from '../db';

export type ApiProvider = 'razorpay' | 'google_calendar' | 'email' | 'gemini_ai' | 'supabase' | 'system';

export interface ApiUsageEvent {
  id: string;
  provider: ApiProvider;
  service: string;
  endpoint: string;
  status_code: number | null;
  success: boolean;
  latency_ms: number | null;
  error_category: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ProviderUsageSummary {
  provider: ApiProvider;
  service: string;
  isTracked: boolean;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRatePercent: number;
  avgLatencyMs: number;
  lastRequestAt: string | null;
}

export class ApiUsageService {
  private static inMemoryEvents: ApiUsageEvent[] = [];

  /**
   * Strips sensitive secrets, tokens, and payloads before recording usage event.
   */
  private static sanitizeMetadata(meta: Record<string, any>): Record<string, any> {
    const clean: Record<string, any> = {};
    const forbidden = ['token', 'secret', 'key', 'auth', 'password', 'cookie', 'session', 'body', 'payload'];
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
   * Records a real external API usage event.
   */
  static async recordEvent(params: {
    provider: ApiProvider;
    service: string;
    endpoint: string;
    statusCode?: number | null;
    success: boolean;
    latencyMs?: number | null;
    errorCategory?: string | null;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const event: ApiUsageEvent = {
        id: crypto.randomUUID(),
        provider: params.provider,
        service: params.service,
        endpoint: params.endpoint,
        status_code: params.statusCode ?? (params.success ? 200 : 500),
        success: params.success,
        latency_ms: params.latencyMs ?? null,
        error_category: params.errorCategory || null,
        metadata: this.sanitizeMetadata(params.metadata || {}),
        created_at: new Date().toISOString(),
      };

      // 1. In-memory append
      this.inMemoryEvents.push(event);
      if (this.inMemoryEvents.length > 1000) {
        this.inMemoryEvents.shift(); // Keep buffer bounded
      }

      // 2. Persist to DB
      await supabase.from('api_usage_events').insert(event);
    } catch (err: any) {
      // API usage tracking must never disrupt application traffic
      console.warn('[ApiUsageService] Notice:', err.message);
    }
  }

  /**
   * Aggregates usage data by provider.
   * If no real events exist for a provider, isTracked is false.
   */
  static async getUsageSummary(): Promise<ProviderUsageSummary[]> {
    const knownProviders: { provider: ApiProvider; service: string }[] = [
      { provider: 'razorpay', service: 'Payments & Payouts' },
      { provider: 'google_calendar', service: 'Calendar & Meet' },
      { provider: 'email', service: 'Transactional Email' },
      { provider: 'gemini_ai', service: 'AI & Psychoeducation' },
      { provider: 'supabase', service: 'Database & Storage' },
    ];

    // Fetch recent events from DB or memory
    let events: ApiUsageEvent[] = [];
    const { data: dbEvents } = await supabase
      .from('api_usage_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (dbEvents && dbEvents.length > 0) {
      events = dbEvents;
    } else {
      events = [...this.inMemoryEvents];
    }

    const summaries: ProviderUsageSummary[] = [];

    for (const item of knownProviders) {
      const providerEvents = events.filter((e) => e.provider === item.provider);

      if (providerEvents.length === 0) {
        summaries.push({
          provider: item.provider,
          service: item.service,
          isTracked: false,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          successRatePercent: 0,
          avgLatencyMs: 0,
          lastRequestAt: null,
        });
        continue;
      }

      const total = providerEvents.length;
      const successful = providerEvents.filter((e) => e.success).length;
      const failed = total - successful;
      const successRate = total > 0 ? Math.round((successful / total) * 1000) / 10 : 0;

      const latencies = providerEvents
        .map((e) => e.latency_ms)
        .filter((l): l is number => typeof l === 'number');
      const avgLatency =
        latencies.length > 0
          ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
          : 0;

      summaries.push({
        provider: item.provider,
        service: item.service,
        isTracked: true,
        totalRequests: total,
        successfulRequests: successful,
        failedRequests: failed,
        successRatePercent: successRate,
        avgLatencyMs: avgLatency,
        lastRequestAt: providerEvents[0]?.created_at || null,
      });
    }

    return summaries;
  }

  /**
   * Fetches recent API usage event log.
   */
  static async getRecentEvents(limit = 50): Promise<ApiUsageEvent[]> {
    const { data } = await supabase
      .from('api_usage_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (data && data.length > 0) {
      return data;
    }

    return [...this.inMemoryEvents]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }
}
