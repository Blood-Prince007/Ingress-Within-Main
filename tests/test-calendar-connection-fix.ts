import assert from 'assert';
import { NextRequest } from 'next/server';
import { GoogleAuthService } from '../src/lib/calendar/googleAuthService';
import { GET as connectGet } from '../src/app/api/calendar/google/connect/route';
import { GET as statusGet } from '../src/app/api/calendar/google/status/route';
import { GET as callbackGet } from '../src/app/api/calendar/google/callback/route';
import { TherapistAuthService } from '../src/lib/therapist/therapistAuthService';
import { COOKIE_THERAPIST_ACCESS_NAME } from '../src/utils/cookies';

import { signJwt } from '../src/utils/crypto';

import { supabase } from '../src/lib/db';

async function run() {
  console.log('Testing Google Calendar Connection Fixes...\n');

  let { data: existingTherapist } = await supabase.from('therapist_accounts').select('id, phone_number').limit(1).maybeSingle();
  let therapistId = existingTherapist?.id;
  let phoneNumber = existingTherapist?.phone_number || '+919999999999';

  if (!therapistId) {
    const { data: newAcct, error: acctErr } = await supabase.from('therapist_accounts').insert({
      phone_number: '+919999999999',
      status: 'active',
      is_active: true,
      can_practice: true,
    }).select().single();
    if (acctErr) console.error('Acct create error:', acctErr);
    therapistId = newAcct?.id || '00000000-0000-4000-a000-000000000099';
  }

  const deviceId = 'test_dev_id_' + Date.now();

  const { error: sessErr } = await supabase.from('therapist_sessions').insert({
    therapist_account_id: therapistId,
    refresh_token_hash: 'dummy_hash_' + Date.now(),
    device_id: deviceId,
    is_active: true,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  });
  if (sessErr) {
    console.error('Session insert error:', sessErr);
  }

  const token = signJwt(
    {
      tid: therapistId,
      phone: phoneNumber,
      did: deviceId,
      scope: 'therapist',
    },
    TherapistAuthService.getJwtSecret(),
    3600
  );

  // Test 1: Connect endpoint returns JSON (not 307 redirect) when Accept is */* (standard browser fetch)
  console.log('1. Checking connect route response format with fetch Accept: */*...');
  const req1 = new NextRequest('http://localhost:3000/api/calendar/google/connect?type=therapist&returnTo=/therapist/profile', {
    headers: {
      'host': 'localhost:3000',
      'accept': '*/*',
      'authorization': `Bearer ${token}`,
      'cookie': `${COOKIE_THERAPIST_ACCESS_NAME}=${token}`,
    },
  });
  const res1 = await connectGet(req1);
  // Must return JSON with status 200 or 503 (if unconfigured), NEVER a 307 redirect to external origin!
  assert.notStrictEqual(res1.status, 307, 'Must not return 307 redirect to an external origin for API fetch');
  const json1 = await res1.json();
  assert.ok(json1, 'Response must be valid JSON');
  console.log('   ✓ Returned JSON response instead of 307 redirect:', json1.error?.code || 'url provided');

  // Test 2: Simulate mode connects cleanly
  console.log('\n2. Checking simulate mode connect for development...');
  const req2 = new NextRequest('http://localhost:3000/api/calendar/google/connect?type=therapist&simulate=true&format=json', {
    headers: {
      'host': 'localhost:3000',
      'accept': 'application/json',
      'authorization': `Bearer ${token}`,
      'cookie': `${COOKIE_THERAPIST_ACCESS_NAME}=${token}`,
    },
  });
  const res2 = await connectGet(req2);
  assert.strictEqual(res2.status, 200, 'Simulate connect must return 200 OK');
  const json2 = await res2.json();
  assert.strictEqual(json2.success, true, 'Simulate connect must return success');
  assert.strictEqual(json2.simulated, true, 'Simulate connect must return simulated: true');
  console.log('   ✓ Simulated connection successful for:', json2.googleEmail);

  // Test 3: Status check returns connected: true and matching email
  console.log('\n3. Checking status route after simulated connection...');
  const req3 = new NextRequest('http://localhost:3000/api/calendar/google/status?type=therapist', {
    headers: {
      'host': 'localhost:3000',
      'accept': 'application/json',
      'authorization': `Bearer ${token}`,
      'cookie': `${COOKIE_THERAPIST_ACCESS_NAME}=${token}`,
    },
  });
  const res3 = await statusGet(req3);
  assert.strictEqual(res3.status, 200, 'Status check must return 200 OK');
  const json3 = await res3.json();
  assert.strictEqual(json3.connected, true, 'Must report connected: true');
  assert.strictEqual(json3.syncStatus, 'connected', 'Must report syncStatus: connected');
  assert.strictEqual(json3.googleEmail, 'dr.therapist@ingresswithin.com', 'Email must match');
  console.log('   ✓ Calendar status verified:', json3);

  // Test 4: Disconnect works
  console.log('\n4. Checking disconnect...');
  const disc = await GoogleAuthService.disconnectGoogleCalendar('therapist', therapistId);
  assert.strictEqual(disc.success, true, 'Disconnect must succeed');
  const statusAfter = await GoogleAuthService.getConnectionStatus('therapist', therapistId);
  assert.strictEqual(statusAfter.connected, false, 'Must be disconnected');
  console.log('   ✓ Disconnect verified');

  console.log('\nALL CALENDAR CONNECTION FIX TESTS PASSED!\n');
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
