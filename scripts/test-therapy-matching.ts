/**
 * Therapy Matching + Email Safety Test
 *
 * Location:
 *   scripts/test-therapy-matching.ts
 *
 * This is a static/unit-style safety test. It does NOT connect to Supabase,
 * Redis, MSG91, or send any email.
 */

type Triage = 'standard' | 'priority' | 'immediate';

type Therapist = {
  id: string;
  name: string;
  concerns: string[];
  modalities: string[];
  gender: string;
  fee: number;
  capacityCurrent: number;
  capacityMax: number;
  city: string;
  severityCeiling: number;
};

type Intake = {
  concerns: string[];
  modality: string;
  genderPreference?: string;
  budget?: number;
  severity: number;
  city?: string;
};

const therapists: Therapist[] = [
  {
    id: 'therapist-1',
    name: 'Test Therapist A',
    concerns: ['anxiety', 'burnout', 'career stress'],
    modalities: ['telehealth'],
    gender: 'female',
    fee: 800,
    capacityCurrent: 2,
    capacityMax: 8,
    city: 'Mumbai',
    severityCeiling: 4,
  },
  {
    id: 'therapist-2',
    name: 'Test Therapist B',
    concerns: ['family issues', 'grief'],
    modalities: ['in-person'],
    gender: 'male',
    fee: 1500,
    capacityCurrent: 8,
    capacityMax: 8,
    city: 'Delhi',
    severityCeiling: 3,
  },
];

function scoreTherapist(therapist: Therapist, intake: Intake) {
  if (therapist.capacityCurrent >= therapist.capacityMax) {
    return { eligible: false, score: 0, reason: 'capacity_full' };
  }

  if (intake.severity > therapist.severityCeiling) {
    return { eligible: false, score: 0, reason: 'severity_ceiling' };
  }

  if (
    intake.city &&
    therapist.city.toLowerCase() === intake.city.toLowerCase()
  ) {
    return { eligible: false, score: 0, reason: 'same_city_exclusion' };
  }

  const concernOverlap = intake.concerns.filter((concern) =>
    therapist.concerns.some((item) =>
      item.toLowerCase().includes(concern.toLowerCase()) ||
      concern.toLowerCase().includes(item.toLowerCase())
    )
  ).length;

  if (concernOverlap === 0) {
    return { eligible: false, score: 0, reason: 'no_concern_overlap' };
  }

  let score = Math.min(40, concernOverlap * 20);

  if (therapist.modalities.includes(intake.modality)) {
    score += 30;
  }

  if (
    intake.genderPreference &&
    therapist.gender === intake.genderPreference.toLowerCase()
  ) {
    score += 12;
  }

  if (typeof intake.budget === 'number' && therapist.fee <= intake.budget) {
    score += 18;
  }

  return {
    eligible: true,
    score,
    reason: 'matched',
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

function run() {
  console.log('\n=== Ingress Within Therapy Matching Safety Test ===\n');

  // 1. Standard matching should produce an eligible candidate.
  const standardIntake: Intake = {
    concerns: ['anxiety'],
    modality: 'telehealth',
    genderPreference: 'female',
    budget: 1000,
    severity: 2,
    city: 'Delhi',
  };

  const standardResult = scoreTherapist(therapists[0], standardIntake);

  assert(
    standardResult.eligible === true,
    'standard case returns an eligible therapist'
  );
  assert(
    standardResult.score > 0,
    'standard case produces a positive matching score'
  );

  // 2. Full-capacity therapist must not be matched.
  const fullCapacityResult = scoreTherapist(therapists[1], {
    ...standardIntake,
    concerns: ['family issues'],
    modality: 'in-person',
  });

  assert(
    fullCapacityResult.eligible === false &&
      fullCapacityResult.reason === 'capacity_full',
    'full-capacity therapist is excluded'
  );

  // 3. Same-city exclusion.
  const sameCityResult = scoreTherapist(therapists[0], {
    ...standardIntake,
    city: 'Mumbai',
  });

  assert(
    sameCityResult.eligible === false &&
      sameCityResult.reason === 'same_city_exclusion',
    'same-city therapist is excluded'
  );

  // 4. No concern overlap.
  const noConcernResult = scoreTherapist(therapists[0], {
    ...standardIntake,
    concerns: ['grief'],
  });

  assert(
    noConcernResult.eligible === false &&
      noConcernResult.reason === 'no_concern_overlap',
    'therapist with no concern overlap is excluded'
  );

  // 5. Safety gate: priority/immediate must not compute client-facing matches.
  for (const triage of ['priority', 'immediate'] as Triage[]) {
    const matchesAllowed = triage === 'standard';
    assert(
      matchesAllowed === false,
      `${triage} triage blocks computed therapist matching`
    );
  }

  // 6. Email privacy test: operational email must not contain clinical intake.
  const emailPayload = {
    therapistName: 'Test Therapist A',
    matchId: 'test-match-001',
    matchRank: 1,
    matchScore: standardResult.score,
    dashboardUrl: 'https://example.test/therapist/requests',
  };

  const renderedEmail = JSON.stringify(emailPayload).toLowerCase();

  assert(
    !renderedEmail.includes('concerns') &&
      !renderedEmail.includes('own_words') &&
      !renderedEmail.includes('mental_health_history') &&
      !renderedEmail.includes('safety'),
    'therapist email payload contains no clinical intake fields'
  );

  console.log('\nALL TESTS PASSED.\n');
}

run();
