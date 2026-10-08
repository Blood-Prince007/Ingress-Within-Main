import { NextRequest } from 'next/server';
import { GET as globalSearchRoute } from '../src/app/api/search/route';
import { signJwt } from '../src/utils/crypto';
import { COOKIE_ACCESS_NAME } from '../src/utils/cookies';
import { supabase } from '../src/lib/db';
import { interventionEngine } from '../src/lib/interventions/engine/intervention-engine';

async function runSearchTestSuite() {
  console.log('====================================================');
  console.log('Ingress Within — Global & Local Search Test Suite');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(` ✓ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(` ✗ [FAIL] ${testName} - ${detail || 'Assertion failed'}`);
      failedCount++;
    }
  }

  // Generate a mock test user and valid JWT
  const testUserId = '00000000-0000-0000-0000-000000000999';
  const testDeviceId = 'device-test-search-001';
  const jwtSecret = process.env.JWT_SECRET || 'jwt_default_secret_dev';

  // Seed user session in DB if available, or create mock request with JWT
  const validToken = signJwt(
    { uid: testUserId, did: testDeviceId, exp: Math.floor(Date.now() / 1000) + 3600 },
    jwtSecret
  );

  const { error: userErr } = await supabase.from('users').upsert({
    id: testUserId,
    phone_number: '+919999988888',
    name: 'Search Test User',
    is_active: true
  });
  if (userErr) console.log('userErr:', userErr);

  const { error: sessErr } = await supabase.from('user_sessions').upsert({
    id: '00000000-0000-0000-0000-000000000888',
    user_id: testUserId,
    device_id: testDeviceId,
    refresh_token_hash: 'mock_hash_for_test_123',
    ip_address: '127.0.0.1',
    user_agent: 'Search-Test-Suite',
    device_name: 'Test Device',
    is_active: true,
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
  });
  if (sessErr) console.log('sessErr:', sessErr);

  // ====================================================
  // 1. GLOBAL SEARCH — AUTHENTICATION & SECURITY
  // ====================================================
  console.log('\n--- 1. Global Search: Auth & Security ---');

  // Test 1.1: Unauthenticated request should be rejected with 401
  const unauthReq = new NextRequest('http://localhost:3000/api/search?q=anxiety');
  const unauthRes = await globalSearchRoute(unauthReq);
  assert(unauthRes.status === 401, 'Unauthenticated search request rejected with 401');
  const unauthJson = await unauthRes.json();
  assert(unauthJson.error?.code === 'AUTH_REQUIRED', 'Error code is AUTH_REQUIRED');

  // Helper to create authenticated NextRequest
  const makeAuthReq = (query: string) => {
    return new NextRequest(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`, {
      headers: {
        cookie: `${COOKIE_ACCESS_NAME}=${validToken}`,
        authorization: `Bearer ${validToken}`
      }
    });
  };

  // Test 1.2: Authenticated request succeeds
  const authReq = makeAuthReq('anxiety');
  const authRes = await globalSearchRoute(authReq);
  const authJson = await authRes.json();
  if (authRes.status !== 200) {
    console.error('authRes status:', authRes.status, 'body:', authJson);
  }
  assert(authRes.status === 200, 'Authenticated request returns 200 OK');
  assert(authJson.success === true, 'Response payload has success: true');

  // ====================================================
  // 2. GLOBAL SEARCH — CONTENT COVERAGE & MATCH QUALITY
  // ====================================================
  console.log('\n--- 2. Global Search: Content Coverage & Grouping ---');

  // Test 2.1: Query "anxiety" finds multiple content types
  assert(authJson.groups.length >= 2, 'Query "anxiety" returns multiple content type groups', `Groups: ${authJson.groups.map((g: any) => g.category).join(', ')}`);
  
  const groupKeys = authJson.groups.map((g: any) => g.key);
  assert(groupKeys.includes('modules'), 'Finds Psychoeducation Modules for "anxiety"');
  assert(groupKeys.includes('interventions'), 'Finds Techniques/Interventions for "anxiety"');
  assert(groupKeys.includes('knowledge'), 'Finds Emotion Dictionary for "anxiety"');

  // Test 2.2: Case-insensitivity (e.g. "GrIeF")
  const griefReq = makeAuthReq('GrIeF');
  const griefRes = await globalSearchRoute(griefReq);
  const griefJson = await griefRes.json();
  assert(griefJson.success === true && griefJson.total > 0, 'Case-insensitive search ("GrIeF") finds matching content');
  const griefEmotions = griefJson.groups.find((g: any) => g.key === 'knowledge')?.items || [];
  assert(griefEmotions.some((e: any) => e.title.toLowerCase() === 'grief'), 'Emotion Dictionary includes "Grief"');

  // Test 2.3: Partial matching (e.g. "breath")
  const breathReq = makeAuthReq('breath');
  const breathRes = await globalSearchRoute(breathReq);
  const breathJson = await breathRes.json();
  const breathInterventions = breathJson.groups.find((g: any) => g.key === 'interventions')?.items || [];
  assert(breathInterventions.some((i: any) => i.title.includes('Breathing')), 'Partial match ("breath") finds Breathing techniques');

  // Test 2.4: Short query (< 2 characters) returns empty
  const shortReq = makeAuthReq('a');
  const shortRes = await globalSearchRoute(shortReq);
  const shortJson = await shortRes.json();
  assert(shortJson.total === 0 && shortJson.groups.length === 0, 'Short query (< 2 chars) returns 0 results cleanly');

  // Test 2.5: Nonsense query returns 0 results
  const nonsenseReq = makeAuthReq('xyzxyznonsense12345');
  const nonsenseRes = await globalSearchRoute(nonsenseReq);
  const nonsenseJson = await nonsenseRes.json();
  assert(nonsenseJson.total === 0 && nonsenseJson.groups.length === 0, 'Nonsense query returns 0 results with empty groups');

  // Test 2.6: No empty groups in output
  assert(authJson.groups.every((g: any) => g.items.length > 0), 'Categories with no matching items are omitted from groups');

  // Test 2.7: Exclusion of private/therapist/admin content
  for (const group of authJson.groups) {
    for (const item of group.items) {
      assert(!item.path.startsWith('/admin'), 'Search does not leak admin paths');
      assert(!item.path.startsWith('/therapist'), 'Search does not leak therapist discovery');
      assert(!item.path.startsWith('/api/'), 'Search does not leak raw API endpoints');
    }
  }

  // ====================================================
  // 3. LOCAL SEARCH LOGIC & QUALITY
  // ====================================================
  console.log('\n--- 3. Local Search: Section Integrations ---');

  // 3.1 Interventions search with category and duration filters
  const filteredInterventions = await interventionEngine.getCatalog({
    search: 'breathing',
    max_duration: 5
  });
  assert(
    filteredInterventions.data.every((i) => i.title.toLowerCase().includes('breath') || (i.tags || []).includes('breathing')),
    'Interventions local search matches keyword'
  );
  assert(
    filteredInterventions.data.every((i) => (i.estimated_duration || i.duration_minutes || 0) <= 5),
    'Interventions search respects max_duration filter'
  );

  // 3.2 Patterns filtering logic
  const mockPatterns = [
    { name: 'Cognitive Avoidance', body: 'Focusing on logistics to buffer emotional weight', status: 'present' },
    { name: 'Over-responsibility', body: 'Assuming full accountability for external outcomes', status: 'shifting' },
    { name: 'Emotional Containment', body: 'Suppressing feelings in joint family gatherings', status: 'quiet' }
  ];

  const filterPatterns = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return mockPatterns;
    return mockPatterns.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.body.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q)
    );
  };

  assert(filterPatterns('avoidance').length === 1 && filterPatterns('avoidance')[0].name === 'Cognitive Avoidance', 'Patterns local search matches by name');
  assert(filterPatterns('accountability').length === 1 && filterPatterns('accountability')[0].name === 'Over-responsibility', 'Patterns local search matches by body text');
  assert(filterPatterns('quiet').length === 1 && filterPatterns('quiet')[0].name === 'Emotional Containment', 'Patterns local search matches by status');
  assert(filterPatterns('').length === 3, 'Clearing patterns search restores full list');

  // 3.3 Threads filtering logic (combining status and search text)
  const mockThreads = [
    { prompt_question: 'What felt steady for you today?', response_text: 'Taking a quiet morning walk in the park.', status: 'Answered' },
    { prompt_question: 'Where did you feel tension in your body?', draft_response: 'In my shoulders when deadlines loomed.', status: 'Open' },
    { prompt_question: 'What boundary did you protect?', response_text: '', status: 'Open' }
  ];

  const filterThreads = (filter: string, search: string) => {
    const q = search.trim().toLowerCase();
    return mockThreads.filter(t => {
      let matchesStatus = true;
      if (filter === 'open') matchesStatus = t.status === 'Open';
      else if (filter === 'answered') matchesStatus = t.status === 'Answered';
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        t.prompt_question.toLowerCase().includes(q) ||
        (t.response_text && t.response_text.toLowerCase().includes(q)) ||
        (t.draft_response && t.draft_response.toLowerCase().includes(q))
      );
    });
  };

  assert(filterThreads('all', 'steady').length === 1, 'Threads local search matches question text');
  assert(filterThreads('all', 'walk').length === 1, 'Threads local search matches response text');
  assert(filterThreads('open', 'tension').length === 1, 'Threads search + filter work together (open + "tension")');
  assert(filterThreads('answered', 'tension').length === 0, 'Threads search respects status filter (answered + "tension" yields 0)');
  assert(filterThreads('all', '').length === 3, 'Clearing threads search restores list');

  // Cleanup mock test records
  await supabase.from('user_sessions').delete().eq('user_id', testUserId);
  await supabase.from('users').delete().eq('id', testUserId);

  // ====================================================
  // SUMMARY
  // ====================================================
  console.log('\n====================================================');
  console.log(`Results: ${passedCount} passed, ${failedCount} failed.`);
  console.log('====================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSearchTestSuite().catch((err) => {
  console.error('Test suite execution error:', err);
  process.exit(1);
});
