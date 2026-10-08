/**
 * Ingress Within — Therapist Onboarding Verification Suite
 *
 * Run:
 *   npx tsx tests/test-therapist-onboarding.ts
 *
 * Required environment:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   THERAPIST_TEST_ACCOUNT_ID
 *
 * IMPORTANT:
 * Use a dedicated/non-production therapist test account.
 * The test snapshots the account/profile/application state and restores it
 * during cleanup so the verification does not leave a submitted application.
 */

import fs from 'node:fs';
import path from 'node:path';

// Native .env loader
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const value = trimmed.substring(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
} catch {}

import { supabase } from '../src/lib/db';
import { TherapistPlatformService } from '../src/lib/therapist/therapistPlatformService';

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition: boolean, message: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`✓ [PASS] ${message}`);
  } else {
    failed++;
    console.error(`✗ [FAIL] ${message}`);
  }
}

function section(title: string) {
  console.log(`\n--- ${title} ---`);
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

async function getTestTherapistAccountId(): Promise<string> {
  const explicit = process.env.THERAPIST_TEST_ACCOUNT_ID?.trim();
  if (explicit) return explicit;

  const { data, error } = await supabase
    .from('therapist_accounts')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to find a therapist test account: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error(
      'No therapist account exists. Create a test therapist account or set THERAPIST_TEST_ACCOUNT_ID.'
    );
  }

  return data.id;
}

type Snapshot = {
  account: Record<string, any>;
  profile: Record<string, any> | null;
  application: Record<string, any> | null;
};

const ACCOUNT_RESTORE_FIELDS = [
  'status',
  'can_practice',
  'application_status',
  'verification_status',
  'rci_registered',
  'rci_number',
  'updated_at',
];

const PROFILE_RESTORE_FIELDS = [
  'full_name',
  'title',
  'bio',
  'qualification',
  'experience_years',
  'specializations',
  'broad_specialty_tags',
  'modalities',
  'languages',
  'session_formats',
  'profile_image_url',
  'city',
  'state',
  'capacity_current',
  'capacity_max',
  'soonest_opening_days',
  'concern_severity_ceiling',
  'licensure_state_region',
  'gender',
  'age_group_specialization',
  'style_axes',
  'style_axes_review_flags',
  'capacity_last_updated_at',
  'data_freshness_flags',
  'updated_at',
];

async function loadSnapshot(accountId: string): Promise<Snapshot> {
  const { data: account, error: accountError } = await supabase
    .from('therapist_accounts')
    .select('*')
    .eq('id', accountId)
    .maybeSingle();

  if (accountError) throw new Error(`Unable to load therapist account: ${accountError.message}`);
  if (!account) throw new Error(`Therapist account not found: ${accountId}`);

  const { data: profile, error: profileError } = await supabase
    .from('therapist_profiles')
    .select('*')
    .eq('therapist_account_id', accountId)
    .maybeSingle();

  if (profileError) throw new Error(`Unable to load therapist profile: ${profileError.message}`);

  const { data: application, error: applicationError } = await supabase
    .from('therapist_applications')
    .select('*')
    .eq('therapist_account_id', accountId)
    .maybeSingle();

  if (applicationError) {
    throw new Error(`Unable to load therapist application: ${applicationError.message}`);
  }

  return { account, profile, application };
}

function pick(source: Record<string, any>, fields: string[]) {
  return Object.fromEntries(
    fields
      .filter((field) => Object.prototype.hasOwnProperty.call(source, field))
      .map((field) => [field, source[field]])
  );
}

async function restoreSnapshot(accountId: string, snapshot: Snapshot) {
  section('Cleanup / Restore Original State');

  const accountPatch = pick(snapshot.account, ACCOUNT_RESTORE_FIELDS);
  const { error: accountError } = await supabase
    .from('therapist_accounts')
    .update(accountPatch)
    .eq('id', accountId);

  if (accountError) {
    console.error(`[CLEANUP] therapist_accounts: ${accountError.message}`);
  } else {
    console.log('✓ Therapist account restored.');
  }

  if (snapshot.profile) {
    const profilePatch = pick(snapshot.profile, PROFILE_RESTORE_FIELDS);
    const { error: profileError } = await supabase
      .from('therapist_profiles')
      .update(profilePatch)
      .eq('therapist_account_id', accountId);

    if (profileError) {
      console.error(`[CLEANUP] therapist_profiles: ${profileError.message}`);
    } else {
      console.log('✓ Therapist profile restored.');
    }
  }

  if (snapshot.application) {
    const { error: applicationError } = await supabase
      .from('therapist_applications')
      .update(snapshot.application)
      .eq('therapist_account_id', accountId);

    if (applicationError) {
      console.error(`[CLEANUP] therapist_applications restore: ${applicationError.message}`);
    } else {
      console.log('✓ Therapist application restored.');
    }
  } else {
    const { error: applicationError } = await supabase
      .from('therapist_applications')
      .delete()
      .eq('therapist_account_id', accountId);

    if (applicationError) {
      console.error(`[CLEANUP] therapist_applications delete: ${applicationError.message}`);
    } else {
      console.log('✓ Test-created therapist application removed.');
    }
  }
}

async function run() {
  console.log('==============================================================');
  console.log('  INGRESS WITHIN — THERAPIST ONBOARDING VERIFICATION SUITE');
  console.log('==============================================================');

  requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const accountId = await getTestTherapistAccountId();

  console.log(`Therapist test account: ${accountId}`);

  let snapshot: Snapshot | null = null;

  try {
    section('1. Existing Therapist Account');

    snapshot = await loadSnapshot(accountId);

    assert(snapshot.account.id === accountId, 'Therapist account exists');
    assert(
      Object.prototype.hasOwnProperty.call(snapshot.account, 'application_status'),
      'Therapist account has application status'
    );
    assert(
      Object.prototype.hasOwnProperty.call(snapshot.account, 'verification_status'),
      'Therapist account has verification status'
    );

    section('2. Read Current Onboarding State');

    const initialState = await TherapistPlatformService.getOnboardingState(accountId);

    assert(initialState.account?.id === accountId, 'Onboarding state returns the correct account');
    assert(initialState.application !== undefined, 'Onboarding application state is returned');
    assert(initialState.profile !== undefined, 'Therapist profile state is returned');

    section('3. Draft Save + Answer Merge');

    const draftOne = await TherapistPlatformService.saveOnboardingDraft(
      accountId,
      3,
      {
        testRun: 'therapist-onboarding-verification',
        fullName: 'Automated Test Therapist',
        city: 'Test City',
      },
      [
        {
          type: 'degree_certificate',
          path: 'test-only/onboarding-verification-degree.pdf',
          verificationTest: true,
        },
      ]
    );

    assert(draftOne.step === 3, 'Draft step 3 is persisted');
    assert(draftOne.answers?.fullName === 'Automated Test Therapist', 'Draft answer fullName is persisted');
    assert(draftOne.answers?.city === 'Test City', 'Draft answer city is persisted');
    assert(
      Array.isArray(draftOne.documents) && draftOne.documents.some((d: any) => d.verificationTest === true),
      'Draft document metadata is persisted'
    );

    const draftTwo = await TherapistPlatformService.saveOnboardingDraft(
      accountId,
      6,
      {
        credentials: 'MSc Clinical Psychology',
        specialties: ['Anxiety'],
      }
    );

    assert(draftTwo.step === 6, 'Draft step advances to 6');
    assert(
      draftTwo.answers?.fullName === 'Automated Test Therapist',
      'Existing draft answer is preserved during merge'
    );
    assert(
      draftTwo.answers?.credentials === 'MSc Clinical Psychology',
      'New draft answer is merged'
    );
    assert(
      Array.isArray(draftTwo.documents) && draftTwo.documents.some((d: any) => d.verificationTest === true),
      'Existing draft documents are preserved'
    );

    section('4. Incomplete Submission Must Fail');

    let incompleteRejected = false;

    try {
      await TherapistPlatformService.submitApplication(
        accountId,
        {
          fullName: 'Automated Test Therapist',
        }
      );
    } catch (error: any) {
      incompleteRejected =
        error?.code === 'ONBOARDING_INCOMPLETE' &&
        String(error?.message || '').includes('Complete the required onboarding fields');
      console.log(`Expected rejection: ${error?.message || error}`);
    }

    assert(incompleteRejected, 'Incomplete onboarding is rejected with ONBOARDING_INCOMPLETE');

    section('5. Trauma Validation Must Fail When Certificate Is Missing');

    const validBaseAnswers = {
      fullName: 'Automated Test Therapist',
      credentials: 'MSc Clinical Psychology',
      city: 'Test City',
      state: 'Test State',
      bio: 'Automated onboarding verification profile.',
      specialties: ['Anxiety'],
      modalities: ['CBT'],
      primaryModalities: ['CBT'],
      vignetteAnswers: {
        vignette1: 'structured',
        vignette2: 'collaborative',
        vignette3: 'safety-first',
      },
      licenseNumber: 'TEST-LICENSE-001',
      issuingBody: 'Rehabilitation Council of India',
      degreeCertificate: 'test-only/degree.pdf',
      backgroundCheckConsent: true,
      higherAcuityInterest: false,
      ethicsDeclaration: true,
      truthfulnessConfirmed: true,
      traumaListed: 'Yes',
    };

    let traumaRejected = false;

    try {
      await TherapistPlatformService.submitApplication(accountId, validBaseAnswers);
    } catch (error: any) {
      traumaRejected =
        error?.code === 'TRAUMA_CERTIFICATE_REQUIRED' &&
        String(error?.message || '').includes('Trauma certification is required');
      console.log(`Expected rejection: ${error?.message || error}`);
    }

    assert(traumaRejected, 'Trauma listing without certification is rejected');

    section('6. Complete Submission');

    const completeAnswers = {
      ...validBaseAnswers,
      traumaListed: 'No',
      traumaCertification: null,
      yearsOfExperience: 5,
      languages: ['English', 'Hindi'],
      sessionFormats: ['Telehealth'],
      maxCapacity: 10,
      currentCapacity: 2,
      soonestOpeningDays: 7,
      severityCeiling: 2,
      gender: 'not_specified',
      ageGroups: ['18-25'],
      broadSpecialtyTags: ['Anxiety'],
      supervision: { status: 'not_required' },
      calibration: {},
    };

    const submission = await TherapistPlatformService.submitApplication(
      accountId,
      completeAnswers,
      [
        {
          type: 'degree_certificate',
          path: 'test-only/onboarding-verification-degree.pdf',
          verificationTest: true,
        },
      ]
    );

    assert(submission.success === true, 'Complete onboarding submission succeeds');
    assert(submission.application?.step === 10, 'Submitted application is moved to step 10');
    assert(
      submission.application?.onboarding_stage === 'credentialing_in_review',
      'Application enters credentialing_in_review'
    );
    assert(
      submission.application?.acuity_clearance_level === 'none',
      'Acuity clearance starts at none'
    );
    assert(
      submission.application?.background_check_status === 'pending',
      'Background check status is pending after consent'
    );
    assert(
      Boolean(submission.application?.submitted_at),
      'Application receives submitted_at timestamp'
    );

    section('7. Verify Account Status After Submission');

    const afterSubmit = await TherapistPlatformService.getOnboardingState(accountId);

    assert(
      afterSubmit.account?.application_status === 'submitted',
      'Account application_status becomes submitted'
    );
    assert(
      afterSubmit.account?.verification_status === 'pending',
      'Account verification_status becomes pending'
    );
    assert(
      afterSubmit.account?.can_practice === false,
      'Account can_practice remains false before review'
    );
    assert(
      afterSubmit.account?.rci_registered === true,
      'RCI registration is derived from issuing body'
    );
    assert(
      afterSubmit.account?.rci_number === 'TEST-LICENSE-001',
      'RCI number is persisted from license number'
    );

    section('8. Verify Profile Mapping');

    assert(
      afterSubmit.profile?.full_name === 'Automated Test Therapist',
      'Profile full_name is mapped'
    );
    assert(
      afterSubmit.profile?.qualification === 'MSc Clinical Psychology',
      'Profile qualification is mapped'
    );
    assert(
      Array.isArray(afterSubmit.profile?.specializations) &&
        afterSubmit.profile.specializations.includes('Anxiety'),
      'Profile specializations are mapped'
    );
    assert(
      afterSubmit.profile?.city === 'Test City',
      'Profile city is mapped'
    );
    assert(
      afterSubmit.profile?.capacity_max === 10,
      'Profile maximum capacity is mapped'
    );

    section('9. Re-read Onboarding State');

    const finalState = await TherapistPlatformService.getOnboardingState(accountId);

    assert(
      finalState.application?.answers?.fullName === 'Automated Test Therapist',
      'Final onboarding state contains submitted answers'
    );
    assert(
      finalState.application?.answers?.testRun === 'therapist-onboarding-verification',
      'Draft test marker was preserved through submission'
    );

    console.log('\n==============================================================');
    console.log(`RESULT: ${passed}/${total} passed, ${failed} failed`);
    console.log('==============================================================');

    if (failed > 0) {
      throw new Error(`Therapist onboarding verification failed: ${failed} assertion(s).`);
    }
  } finally {
    if (snapshot) {
      await restoreSnapshot(accountId, snapshot);
    }
  }
}

run().catch((error) => {
  console.error('\n[TEST ERROR]', error);
  process.exitCode = 1;
});
