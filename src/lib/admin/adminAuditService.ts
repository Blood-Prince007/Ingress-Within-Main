import crypto from 'crypto';
import { supabase } from '../db';

export interface AdminAuditRecord {
  id: string;
  actor_id: string;
  actor_type: 'admin_api_key' | 'admin_user' | 'admin' | 'therapist' | 'client' | 'system' | string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, any>;
  ip_address?: string | null;
  created_at: string;
}

export class AdminAuditService {
  // In-memory fallback for local test environments
  private static inMemoryLogs: AdminAuditRecord[] = [];

  /**
   * Sanitizes metadata to strictly strip sensitive secrets before logging.
   */
  private static sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const clean: Record<string, any> = {};
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'access_token',
      'refresh_token',
      'authorization',
      'otp',
      'api_key',
      'key',
    ];

    for (const [k, v] of Object.entries(metadata || {})) {
      if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
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
   * Records an immutable admin audit log entry.
   */
  static async logAction(params: {
    actorId: string;
    actorType: 'admin_api_key' | 'admin_user' | 'admin' | 'therapist' | 'client' | 'system' | string;
    action:
      | 'therapist_approved'
      | 'therapist_rejected'
      | 'payout_started'
      | 'payout_paid'
      | 'payout_failed'
      | 'payout_reversed'
      | 'refund_issued'
      | 'refund_failed'
      | 'therapist_no_show'
      | 'client_no_show'
      | 'appointment_attended'
      | 'first_session_scheduled'
      | 'credential_verified'
      | string;
    entityType?: 'therapist' | 'payout_batch' | 'appointment' | 'booking' | 'refund' | string;
    entityId?: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string | null;
  }): Promise<AdminAuditRecord> {
    const { actorId, actorType, action, metadata = {}, ipAddress } = params;
    const entityType = params.entityType || params.resourceType || 'general';
    const entityId = params.entityId || params.resourceId || '';

    const record: AdminAuditRecord = {
      id: crypto.randomUUID(),
      actor_id: actorId,
      actor_type: actorType,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: this.sanitizeMetadata(metadata),
      ip_address: ipAddress || null,
      created_at: new Date().toISOString(),
    };

    // 1. Persist to DB
    const { error } = await supabase.from('admin_audit_logs').insert(record);
    if (error && error.code !== 'PGRST205' && error.code !== '42P01') {
      console.warn('[AdminAuditService] Failed to insert audit log to DB:', error.message);
    }

    // 2. Append to in-memory store
    this.inMemoryLogs.push(record);

    return record;
  }

  /**
   * Retrieves audit logs for a given entity.
   */
  static async getLogsForEntity(
    entityType: string,
    entityId: string
  ): Promise<AdminAuditRecord[]> {
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      return data;
    }

    return this.inMemoryLogs.filter(
      (l) => l.entity_type === entityType && l.entity_id === entityId
    );
  }

  /**
   * Retrieves audit logs by action.
   */
  static async getLogsByAction(action: string): Promise<AdminAuditRecord[]> {
    const { data } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .eq('action', action)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      return data;
    }

    return this.inMemoryLogs.filter((l) => l.action === action);
  }
}
