import { NextRequest, NextResponse } from 'next/server';
import { ApiUsageService } from './admin/apiUsageService';

export interface RouteTelemetryOptions {
  serviceName?: string;
  actorType?: 'client' | 'therapist' | 'admin' | 'system' | 'anonymous';
}

/**
 * Higher-order wrapper for Next.js App Router API handlers.
 * Automatically captures execution latency, HTTP status code, normalized route,
 * HTTP method, and error category without modifying handler signature or return values.
 * 
 * FAIL-SAFE: If telemetry logging encounters an issue, the user's response is NEVER altered or blocked.
 */
export function withTelemetry(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse | Response>,
  options: RouteTelemetryOptions = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse | Response> => {
    const startTime = Date.now();
    const method = request.method || 'GET';
    const rawPath = request.nextUrl?.pathname || new URL(request.url).pathname;
    const normalizedRoute = ApiUsageService.normalizeRoute(rawPath);

    let statusCode = 200;
    let success = true;
    let errorCategory: string | null = null;

    try {
      const response = await handler(request, context);
      statusCode = response.status;
      success = response.status < 400;

      if (!success) {
        if (response.status === 401) errorCategory = 'AUTHENTICATION_REQUIRED';
        else if (response.status === 403) errorCategory = 'FORBIDDEN';
        else if (response.status === 404) errorCategory = 'NOT_FOUND';
        else if (response.status === 429) errorCategory = 'RATE_LIMITED';
        else if (response.status >= 500) errorCategory = 'SERVER_ERROR';
        else errorCategory = 'CLIENT_ERROR';
      }

      const latencyMs = Date.now() - startTime;

      // Asynchronously record internal API traffic telemetry
      ApiUsageService.recordEvent({
        provider: 'internal',
        service: options.serviceName || normalizedRoute.split('/')[2] || 'api',
        endpoint: normalizedRoute,
        route: normalizedRoute,
        method,
        statusCode,
        success,
        latencyMs,
        actorType: options.actorType || (rawPath.startsWith('/api/admin') ? 'admin' : rawPath.startsWith('/api/therapist') ? 'therapist' : 'client'),
        errorCategory,
      });

      return response;
    } catch (err: any) {
      statusCode = err.status || 500;
      success = false;
      errorCategory = err.code || 'UNHANDLED_EXCEPTION';
      const latencyMs = Date.now() - startTime;

      ApiUsageService.recordEvent({
        provider: 'internal',
        service: options.serviceName || normalizedRoute.split('/')[2] || 'api',
        endpoint: normalizedRoute,
        route: normalizedRoute,
        method,
        statusCode,
        success,
        latencyMs,
        actorType: options.actorType || (rawPath.startsWith('/api/admin') ? 'admin' : rawPath.startsWith('/api/therapist') ? 'therapist' : 'client'),
        errorCategory,
      });

      throw err;
    }
  };
}
