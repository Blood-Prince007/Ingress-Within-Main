import { supabase } from '../db';

export interface TherapistMatchCandidate {
  therapistAccountId: string;
  therapistName: string;
  email: string;
  score: number;
  reasons: string[];
  metadata: Record<string, unknown>;
}

type Intake = Record<string, any>;

const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase();
const list = (value: unknown): string[] => Array.isArray(value) ? value.map(normalize).filter(Boolean) : [];
const textList = (value: unknown): string[] => list(value);

function flattenValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(flattenValues);
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>).flatMap(flattenValues);
  return value == null ? [] : [normalize(value)];
}

function tokenOverlap(a: string[], b: string[]) {
  const A = new Set(a.flatMap(x => x.split(/[^a-z0-9]+/).filter(Boolean)));
  const B = new Set(b.flatMap(x => x.split(/[^a-z0-9]+/).filter(Boolean)));
  let count = 0;
  for (const token of A) if (B.has(token)) count += 1;
  return count;
}

function concernTokens(intake: Intake) {
  return flattenValues([
    intake.presenting_reason,
    intake.concerns,
    intake.affected_life_areas,
    intake.answers?.concerns,
    intake.answers?.reason,
    intake.answers?.concernSeverity,
    intake.answers?.concernsOther,
    intake.own_words,
  ]);
}

function modalityTokens(intake: Intake) {
  return flattenValues([
    intake.expectations,
    intake.answers?.styleStructure,
    intake.answers?.stylePace,
    intake.answers?.styleLead,
    intake.answers?.termApproach,
    intake.answers?.scenarios,
  ]);
}

function budgetValue(intake: Intake): number | null {
  const raw = intake.expectations?.budget ?? intake.answers?.budget ?? intake.answers?.therapistBudget;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const m = String(raw ?? '').match(/\d[\d,]*/);
  return m ? Number(m[0].replace(/,/g, '')) : null;
}

function severityValue(intake: Intake): number {
  const raw = intake.answers?.concernSeverity ?? intake.answers?.severity ?? intake.answers?.severityLevel;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const s = normalize(raw);
  if (s.includes('severe') || s.includes('very high')) return 5;
  if (s.includes('high')) return 4;
  if (s.includes('moderate')) return 3;
  if (s.includes('mild') || s.includes('low')) return 2;
  return 3;
}

function hasTraumaFlag(intake: Intake) {
  const values = flattenValues([intake.concerns, intake.answers?.concerns, intake.answers?.traumaListed, intake.answers?.traumaFlag]);
  return values.some(v => v.includes('trauma') || v.includes('ptsd'));
}

function requestedGender(intake: Intake) {
  return normalize(intake.answers?.therapistGender ?? intake.expectations?.therapistGender ?? '');
}

function requestedModality(intake: Intake) {
  return normalize(intake.answers?.sessionFormat ?? intake.answers?.modality ?? intake.answers?.format ?? '');
}

function sameCity(clientCity: unknown, therapistCity: unknown) {
  const a = normalize(clientCity);
  const b = normalize(therapistCity);
  return Boolean(a && b && a === b);
}

function isAgeFit(age: number | null, groups: string[]) {
  if (!age || groups.length === 0) return true;
  return groups.some(group => {
    if (group.includes('18') && group.includes('25')) return age >= 18 && age <= 25;
    if (group.includes('26') && group.includes('35')) return age >= 26 && age <= 35;
    if (group.includes('36') && group.includes('50')) return age >= 36 && age <= 50;
    if (group.includes('50')) return age >= 50;
    if (group.includes('adult')) return age >= 18;
    return false;
  });
}

/**
 * Server-side therapist matching based on persisted client intake and the
 * therapist's approved onboarding/profile data. Browser-provided match scores
 * are deliberately not trusted.
 */
export async function computeTherapistMatches(
  sessionId: string,
  userId: string,
  limit = 3
): Promise<TherapistMatchCandidate[]> {
  const { data: intake, error: intakeError } = await supabase
    .from('therapy_intakes')
    .select('*')
    .eq('therapy_session_id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (intakeError) throw new Error('Failed to load Therapy intake for matching.');
  if (!intake) return [];

  const { data: safety } = await supabase
    .from('therapy_safety_assessments')
    .select('triage_level')
    .eq('therapy_session_id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();

  // Priority/immediate cases are handled outside computed matching.
  if (safety?.triage_level && safety.triage_level !== 'standard') return [];

  const { data: accounts, error } = await supabase
    .from('therapist_accounts')
    .select(`
      id,
      status,
      application_status,
      verification_status,
      can_practice,
      per_session_fee,
      therapist_profiles (
        full_name,
        contact_email,
        specializations,
        broad_specialty_tags,
        modalities,
        languages,
        session_formats,
        city,
        state,
        gender,
        age_group_specialization,
        capacity_current,
        capacity_max,
        concern_severity_ceiling,
        soonest_opening_days
      )
    `)
    .eq('status', 'active')
    .eq('application_status', 'approved')
    .eq('verification_status', 'verified')
    .eq('can_practice', true);

  if (error || !accounts) throw new Error('Failed to load eligible therapists.');

  const clientConcerns = concernTokens(intake);
  const clientModalities = modalityTokens(intake);
  const clientBudget = budgetValue(intake);
  const clientSeverity = severityValue(intake);
  const trauma = hasTraumaFlag(intake);
  const genderPreference = requestedGender(intake);
  const modalityPreference = requestedModality(intake);
  const clientAge = typeof intake.age === 'number' ? intake.age : Number(intake.answers?.age) || null;
  const clientCity = intake.city;

  const candidates: TherapistMatchCandidate[] = [];

  for (const account of accounts) {
    const profile = Array.isArray(account.therapist_profiles) ? account.therapist_profiles[0] : account.therapist_profiles;
    if (!profile?.full_name || !profile.contact_email) continue;

    const capacityMax = Number(profile.capacity_max);
    const capacityCurrent = Number(profile.capacity_current);
    if (Number.isFinite(capacityMax) && capacityMax > 0 && Number.isFinite(capacityCurrent) && capacityCurrent >= capacityMax) continue;

    if (sameCity(clientCity, profile.city)) continue;

    const ceiling = Number(profile.concern_severity_ceiling);
    if (Number.isFinite(ceiling) && ceiling > 0 && clientSeverity > ceiling) continue;

    const ageGroups = textList(profile.age_group_specialization);
    if (!isAgeFit(clientAge, ageGroups)) continue;

    const specialties = textList(profile.specializations).concat(textList(profile.broad_specialty_tags));
    const modalities = textList(profile.modalities).concat(textList(profile.session_formats));
    const therapistGender = normalize(profile.gender);

    const concernHits = tokenOverlap(clientConcerns, specialties);
    if (clientConcerns.length > 0 && concernHits === 0) continue;

    const modalityHits = tokenOverlap(clientModalities, modalities);
    if (modalityPreference && modalityHits === 0 && !modalities.some(m => modalityPreference.includes(m) || m.includes(modalityPreference))) continue;

    let score = 0;
    const reasons: string[] = [];

    // Prototype weighting: concern 40, modality 30, gender 12, budget 18.
    score += Math.min(40, concernHits * 10);
    if (concernHits > 0) reasons.push('Concern/specialization alignment');

    if (modalityHits > 0 || !clientModalities.length) {
      score += modalityHits > 0 ? 30 : 15;
      if (modalityHits > 0) reasons.push('Therapy style/modality alignment');
    }

    if (genderPreference && therapistGender && genderPreference !== 'any' && genderPreference !== 'no preference') {
      if (therapistGender === genderPreference || therapistGender.includes(genderPreference)) {
        score += 12;
        reasons.push('Therapist gender preference');
      }
    } else {
      score += 6;
    }

    const fee = Number(account.per_session_fee);
    if (clientBudget == null || !Number.isFinite(fee)) {
      score += 9;
    } else if (fee <= clientBudget) {
      score += 18;
      reasons.push('Within stated budget');
    } else if (fee <= clientBudget * 1.25) {
      score += 8;
    }

    if (trauma) {
      const traumaExpert = specialties.some(s => s.includes('trauma') || s.includes('ptsd'));
      if (traumaExpert) {
        score += 10;
        reasons.push('Trauma-related specialization');
      } else {
        continue;
      }
    }

    if (Number.isFinite(Number(profile.soonest_opening_days))) {
      reasons.push(`Opening in ${Number(profile.soonest_opening_days)} day(s)`);
    }

    candidates.push({
      therapistAccountId: account.id,
      therapistName: profile.full_name,
      email: profile.contact_email,
      score: Math.min(100, Math.round(score)),
      reasons,
      metadata: {
        concernHits,
        modalityHits,
        fee: Number.isFinite(fee) ? fee : null,
        city: profile.city || null,
        state: profile.state || null,
        capacityCurrent: Number.isFinite(capacityCurrent) ? capacityCurrent : null,
        capacityMax: Number.isFinite(capacityMax) ? capacityMax : null,
        severityCeiling: Number.isFinite(ceiling) ? ceiling : null,
        soonestOpeningDays: Number.isFinite(Number(profile.soonest_opening_days)) ? Number(profile.soonest_opening_days) : null,
      },
    });
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));
}
