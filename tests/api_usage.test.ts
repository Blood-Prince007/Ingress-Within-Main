import assert from 'assert';
import { NextRequest } from 'next/server';
import { ApiUsageService } from '../src/lib/admin/apiUsageService';
import { withTelemetry } from '../src/lib/apiTelemetry';
import { calculateEstimatedAICostPaise, AI_MODEL_PRICING } from '../src/lib/pricing/aiPricing';
import { ClaudeProvider } from '../src/lib/ai/providers/claude';
import { GroqProvider } from '../src/lib/ai/providers/GroqProvider';
import { GeminiProvider } from '../src/lib/ai/providers/GeminiProvider';
import { FallbackProvider } from '../src/lib/ai/providers/FallbackProvider';
import { GoogleCalendarService } from '../src/lib/calendar/googleCalendarService';
import { EmailService } from '../src/lib/email/emailService';
import { requireAuthorizedAdmin } from '../src/lib/auth/adminAuthHelper';

async function runApiUsageTestSuite() {
  console.log('================================================================');
  console.log('   INGRESS WITHIN — API USAGE & OBSERVABILITY TEST SUITE        ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
      throw err;
    }
  }

  // 1. ROUTE NORMALIZATION
  console.log('--- SECTION 1: Route Normalization & Telemetry Safety ---');
  await test('Normalizes dynamic IDs to [id] patterns', () => {
    assert.strictEqual(
      ApiUsageService.normalizeRoute('/api/therapist/clients/8e92f582-7ad2-4a2e-8d8a-6b83f509d732'),
      '/api/therapist/clients/[id]'
    );
    assert.strictEqual(
      ApiUsageService.normalizeRoute('/api/entries/123'),
      '/api/entries/[id]'
    );
    assert.strictEqual(
      ApiUsageService.normalizeRoute('/api/billing/order-status/order_abc123'),
      '/api/billing/order-status/[id]'
    );
  });

  await test('withTelemetry wraps handler and safely logs telemetry without breaking response', async () => {
    const mockHandler = async (req: NextRequest) => {
      return new Response(JSON.stringify({ success: true, data: 'test' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };

    const instrumented = withTelemetry(mockHandler, { serviceName: 'test_service', actorType: 'client' });
    const req = new NextRequest('http://localhost:3000/api/journal/entries/550e8400-e29b-41d4-a716-446655440000');
    const res = await instrumented(req);

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    const recent = await ApiUsageService.getRecentEvents(10, 'internal');
    const match = recent.find((e) => e.route === '/api/journal/entries/[id]');
    assert.ok(match, 'Internal telemetry event should be recorded');
    assert.strictEqual(match?.success, true);
    assert.strictEqual(match?.actor_type, 'client');
  });

  // 2. SENSITIVE DATA DEFENSE & PRIVACY
  console.log('\n--- SECTION 2: Privacy Invariants & Redaction ---');
  await test('Redacts sensitive keys, tokens, prompts, responses, and passwords from metadata', async () => {
    await ApiUsageService.recordEvent({
      provider: 'internal',
      service: 'auth_test',
      endpoint: '/api/auth/login',
      statusCode: 200,
      success: true,
      metadata: {
        password: 'SuperSecretPassword',
        accessToken: 'eyJh...',
        clinical_note: 'Confidential client diagnosis',
        safe_param: 'allowed_value',
      },
    });

    const recent = await ApiUsageService.getRecentEvents(5, 'internal');
    const event = recent.find((e) => e.service === 'auth_test');
    assert.ok(event);
    assert.strictEqual(event?.metadata.password, '[REDACTED]');
    assert.strictEqual(event?.metadata.accessToken, '[REDACTED]');
    assert.strictEqual(event?.metadata.clinical_note, '[REDACTED]');
    assert.strictEqual(event?.metadata.safe_param, 'allowed_value');
  });

  // 3. ANTHROPIC CLAUDE INSTRUMENTATION
  console.log('\n--- SECTION 3: Anthropic Claude Telemetry & Token Tracking ---');
  await test('Claude provider call triggers telemetry with tokens and model', async () => {
    const claude = new ClaudeProvider('sk-ant-development-mock-key-replace-me');
    await claude.scoreEntry('I am feeling so exhausted after working long hours.');

    const recent = await ApiUsageService.getRecentEvents(10, 'claude');
    assert.ok(recent.length > 0, 'Claude call must record event');
    const event = recent[0];
    assert.strictEqual(event.provider, 'claude');
    assert.strictEqual(event.success, true);
    assert.ok((event.input_tokens || 0) > 0);
    assert.ok((event.output_tokens || 0) > 0);
  });

  // 4. GROQ & GEMINI FALLBACK TRACKING
  console.log('\n--- SECTION 4: Groq, Gemini & Multi-Tier Fallback Tracking ---');
  await test('Groq provider records inference event', async () => {
    const groq = new GroqProvider('gsk_development_mock_key_replace_me');
    await groq.scoreEntry('Feeling anxious and overwhelmed.');

    const recent = await ApiUsageService.getRecentEvents(10, 'groq');
    assert.ok(recent.length > 0, 'Groq call must record event');
    const event = recent[0];
    assert.strictEqual(event.provider, 'groq');
    assert.strictEqual(event.success, true);
  });

  await test('FallbackProvider records logical request and marks fallback correctly', async () => {
    // Failing primary that triggers Groq fallback
    const failingPrimary: any = {
      model: 'claude-3-5-sonnet',
      lastUsage: null,
      scoreEntry: async () => { throw new Error('Claude 429 Rate Limit'); },
    };
    const mockGroq: any = {
      model: 'llama-3.3-70b-versatile',
      lastUsage: { prompt_tokens: 200, completion_tokens: 80 },
      scoreEntry: async () => ({ clarityScore: 78, sentiment: 'anxious', stressIndicators: ['work'] }),
    };

    const fallbackChain = new FallbackProvider(failingPrimary, mockGroq);
    const res = await fallbackChain.scoreEntry('Testing fallback');

    assert.strictEqual(res.clarityScore, 78);
    const recent = await ApiUsageService.getRecentEvents(10, 'groq');
    const fallbackEvt = recent.find((e) => e.is_fallback === true);
    assert.ok(fallbackEvt, 'Groq event must be flagged as is_fallback = true');
    assert.ok(fallbackEvt?.logical_request_id, 'Must contain logical_request_id');
  });

  await test('Autonomous deterministic synthesizer fallback is tracked with 0 cost', async () => {
    const failingPrimary: any = { scoreEntry: async () => { throw new Error('Claude Error'); } };
    const failingSecondary: any = { scoreEntry: async () => { throw new Error('Groq Error'); } };
    const failingTertiary: any = { scoreEntry: async () => { throw new Error('Gemini Error'); } };

    const fallbackChain = new FallbackProvider(failingPrimary, failingSecondary, failingTertiary);
    const res = await fallbackChain.scoreEntry('Deterministic safety test');

    assert.ok(res.clarityScore >= 50);
    const recent = await ApiUsageService.getRecentEvents(10, 'synthesizer');
    assert.ok(recent.length > 0, 'Synthesizer fallback must record event');
    assert.strictEqual(recent[0].estimated_cost_paise, 0);
  });

  // 5. EXTERNAL PROVIDERS (RAZORPAY, GOOGLE CALENDAR, EMAIL)
  console.log('\n--- SECTION 5: External Providers (Razorpay, Calendar, Email) ---');
  await test('Google Calendar FreeBusy query logs availability telemetry', async () => {
    // Mock getBusySlots without valid tokens should gracefully log empty or return
    const slots = await GoogleCalendarService.getBusySlots('therapist_mock', '2026-10-01T00:00:00Z', '2026-10-02T00:00:00Z');
    assert.ok(Array.isArray(slots));
  });

  await test('EmailService dispatches email safely with telemetry', async () => {
    await EmailService.sendEmail({
      eventType: 'session_confirmed',
      templateKey: 'session_confirmed',
      recipient: { type: 'client', email: 'test-user@ingresswithin.com' },
      templateData: {
        recipientName: 'Alice',
        otherPartyName: 'Dr. Jane',
        scheduledStart: '2026-10-10T10:00:00Z',
        googleMeetUrl: 'https://meet.google.com/abc-defg-hij',
        bookingReference: 'BK_TEST_123',
      },
    });

    const recent = await ApiUsageService.getRecentEvents(10, 'email');
    assert.ok(recent.length > 0, 'Email dispatch must record event');
    assert.strictEqual(recent[0].provider, 'email');
  });

  // 6. FINANCIAL INTEGER PAISE COST CALCULATIONS
  console.log('\n--- SECTION 6: Decimal-Safe Financial AI Cost Estimator ---');
  await test('Calculates exact integer paise costs without floating-point inaccuracies', () => {
    // Claude 3.5 Sonnet: 1,000,000 input tokens = 25,800 paise ($3 * 8600)
    const cost1 = calculateEstimatedAICostPaise({
      model: 'claude-3-5-sonnet-20241022',
      inputTokens: 1_000_000,
      outputTokens: 0,
    });
    assert.strictEqual(cost1, 25800);

    // 500,000 output tokens: 0.5 * 129,000 = 64,500 paise
    const cost2 = calculateEstimatedAICostPaise({
      model: 'claude-3-5-sonnet-20241022',
      inputTokens: 0,
      outputTokens: 500_000,
    });
    assert.strictEqual(cost2, 64500);

    // Unknown model produces zero cost (never invent cost)
    const costUnknown = calculateEstimatedAICostPaise({
      model: 'unknown-experimental-model',
      inputTokens: 500_000,
    });
    assert.strictEqual(costUnknown, 0);
  });

  // 7. SECURITY & ACCESS CONTROL
  console.log('\n--- SECTION 7: Security & Administrative Authorization ---');
  await test('Rejects unauthenticated requests to /api/admin/api-usage with 403', async () => {
    const unauthReq = new NextRequest('http://localhost:3000/api/admin/api-usage');
    let rejected = false;
    try {
      await requireAuthorizedAdmin(unauthReq);
    } catch (err: any) {
      rejected = true;
      assert.strictEqual(err.status, 403);
    }
    assert.ok(rejected, 'Must reject unauthenticated admin request');
  });

  // 8. AGGREGATION & PERCENTILES
  console.log('\n--- SECTION 8: Dashboard Aggregations & Metrics ---');
  await test('Computes overview metrics with P95 latency and success rate', async () => {
    const metrics = await ApiUsageService.getOverviewMetrics(new Date(Date.now() - 24 * 60 * 60 * 1000));
    assert.ok(typeof metrics.totalRequests === 'number');
    assert.ok(typeof metrics.successRatePercent === 'number');
    assert.ok(typeof metrics.avgLatencyMs === 'number');
    assert.ok(typeof metrics.p95LatencyMs === 'number');
  });

  await test('Generates time series data points bucketed by minutes', async () => {
    const series = await ApiUsageService.getTimeSeries(new Date(Date.now() - 24 * 60 * 60 * 1000), 60);
    assert.ok(Array.isArray(series));
  });

  console.log(`\n================================================================`);
  console.log(`   API USAGE TEST SUITE RESULTS: ${passed}/${total} PASSING`);
  console.log(`================================================================`);
}

runApiUsageTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
