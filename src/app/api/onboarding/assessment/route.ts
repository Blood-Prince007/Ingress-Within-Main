import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { aiProvider } from '../../../../lib/ai/factory';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user session
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Check if this is a request to finalize onboarding (Summary review page 'Continue' click)
    if (body.finalize === true) {
      console.log(`[API Assessment] Finalizing onboarding for user ${user.userId}`);

      // Finalization is only valid after every required onboarding milestone
      // has been completed. This prevents a direct finalize request from
      // marking an incomplete onboarding flow as complete.
      const { data: currentProfile, error: profileReadError } = await supabase
        .from('profiles')
        .select('consent_completed, profile_completed, orientation_completed, assessment_completed, onboarding_completed')
        .eq('id', user.userId)
        .maybeSingle();

      if (profileReadError) {
        console.error('[API Onboarding Finalize] Failed to read onboarding state:', profileReadError);
        return NextResponse.json(
          { error: { code: 'DATABASE_ERROR', message: 'Failed to verify onboarding progress.' } },
          { status: 500 }
        );
      }

      if (!currentProfile) {
        return NextResponse.json(
          { error: { code: 'PROFILE_NOT_FOUND', message: 'User onboarding profile was not found.' } },
          { status: 404 }
        );
      }

      const requiredMilestones = [
        ['consent_completed', currentProfile.consent_completed],
        ['profile_completed', currentProfile.profile_completed],
        ['orientation_completed', currentProfile.orientation_completed],
        ['assessment_completed', currentProfile.assessment_completed]
      ] as const;

      const incompleteMilestone = requiredMilestones.find(([, completed]) => !completed);
      if (incompleteMilestone) {
        return NextResponse.json(
          {
            error: {
              code: 'ONBOARDING_INCOMPLETE',
              message: `Onboarding step is incomplete: ${incompleteMilestone[0]}.`
            }
          },
          { status: 400 }
        );
      }

      // Automatically create Cycle 1 for the user if it doesn't already exist.
      const { data: existingCycle, error: cycleLookupError } = await supabase
        .from('cycles')
        .select('id')
        .eq('user_id', user.userId)
        .limit(1)
        .maybeSingle();

      if (cycleLookupError) {
        console.error('[API Onboarding Finalize] Failed to check Cycle 1:', cycleLookupError);
        return NextResponse.json(
          { error: { code: 'DATABASE_ERROR', message: 'Failed to initialize the first reflection cycle.' } },
          { status: 500 }
        );
      }

      if (!existingCycle) {
        const todayStr = new Date().toISOString().split('T')[0];
        const { error: cycleError } = await supabase
          .from('cycles')
          .insert({
            user_id: user.userId,
            cycle_number: 1,
            status: 'ACTIVE',
            start_date: todayStr,
            total_days: 30,
            current_day: 1,
            days_completed: 0,
            entries_count: 0,
            assessment_completed: false,
            assessment_available: false
          });

        if (cycleError) {
          console.error('[API Onboarding Finalize] Failed to create Cycle 1 automatically:', cycleError);
          return NextResponse.json(
            { error: { code: 'DATABASE_ERROR', message: 'Failed to initialize the first reflection cycle.' } },
            { status: 500 }
          );
        }

        console.log('[API Onboarding Finalize] Cycle 1 automatically created for user', user.userId);
      }

      // Mark both flags consistently. onboarding_status is part of the
      // existing auth profile schema and should reflect the completion flag.
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_status: 'completed'
        })
        .eq('id', user.userId);

      if (updateError) {
        console.error('Failed to finalize onboarding:', updateError);
        return NextResponse.json(
          { error: { code: 'DATABASE_ERROR', message: 'Failed to finalize onboarding.' } },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Onboarding finalized successfully.'
      });
    }

    // Otherwise, expect the 12 answers
    const { answers } = body;
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Answers object is required.' } },
        { status: 400 }
      );
    }

    // Validate that Q1 to Q12 exist and are valid numbers 1-5
    const qKeys = Array.from({ length: 12 }, (_, i) => `q${i + 1}`);
    const parsedAnswers: Record<string, number> = {};

    for (const key of qKeys) {
      const val = Number(answers[key]);
      if (isNaN(val) || val < 1 || val > 5) {
        return NextResponse.json(
          { error: { code: 'INVALID_RATING', message: `Rating for ${key} must be a number between 1 and 5.` } },
          { status: 400 }
        );
      }
      parsedAnswers[key] = val;
    }

    // 2. Calculate OCEAN averages
    const openness = (parsedAnswers.q1 + parsedAnswers.q2) / 2;
    const conscientiousness = (parsedAnswers.q3 + parsedAnswers.q4) / 2;
    const extraversion = (parsedAnswers.q5 + parsedAnswers.q6) / 2;
    const agreeableness = (parsedAnswers.q7 + parsedAnswers.q8 + parsedAnswers.q9) / 3;
    const neuroticism = (parsedAnswers.q10 + parsedAnswers.q11 + parsedAnswers.q12) / 3;

    console.log(`[API Assessment] Calculated OCEAN scores for user ${user.userId}:`, {
      openness,
      conscientiousness,
      extraversion,
      agreeableness,
      neuroticism
    });

    // 3. Call AI Provider synchronously
    const aiStartTime = Date.now();
    let summaryText = '';
    let actualProvider = process.env.AI_PROVIDER || 'claude';
    let fallbackUsed = false;
    let primaryProvider = 'claude';

    try {
      summaryText = await aiProvider.generatePersonalitySummary({
        openness,
        conscientiousness,
        extraversion,
        agreeableness,
        neuroticism
      });
      actualProvider = (aiProvider as any).lastProviderUsed || actualProvider;
      fallbackUsed = (aiProvider as any).lastFallbackUsed || false;
      primaryProvider = (aiProvider as any).lastPrimaryProvider || 'claude';
    } catch (aiErr: any) {
      console.error('Failed to generate AI personality summary, using default fallback:', aiErr);
      // Deterministic fallback description in case of provider failure
      summaryText = `You show balanced qualities with a tendency to process experiences internally. You value self-reflection and structure in your daily routine. This space is designed for exactly that.`;
    }

    // Record to ai_observability
    try {
      await supabase.from('ai_observability').insert({
        entry_id: null,
        provider: actualProvider,
        raw_provider_response: (aiProvider as any).lastRawResponse || summaryText,
        parsed_response: {
          summary: summaryText,
          scores: { openness, conscientiousness, extraversion, agreeableness, neuroticism },
          _metadata: {
            module: 'personality_onboarding',
            user_id: user.userId,
            fallback_used: fallbackUsed,
            primary_provider: primaryProvider,
            usage: (aiProvider as any).lastUsage || null
          }
        },
        validation_result: {
          status: 'passed',
          fallback_used: fallbackUsed,
          primary_provider: primaryProvider
        },
        processing_time: Date.now() - aiStartTime,
        retry_count: fallbackUsed ? 1 : 0,
        error_reason: null
      });
    } catch (obsErr) {
      console.warn('[API Assessment] Failed to record ai_observability:', obsErr);
    }

    // 4. Update users table with scores, answers, and summary text
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        ocean_openness: openness,
        ocean_conscientiousness: conscientiousness,
        ocean_extraversion: extraversion,
        ocean_agreeableness: agreeableness,
        ocean_neuroticism: neuroticism,
        personality_profile_json: JSON.stringify(parsedAnswers),
        personality_summary_text: summaryText
      })
      .eq('id', user.userId);

    if (userUpdateError) {
      console.error('Failed to update users table with assessment data:', userUpdateError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to save personality scores.' } },
        { status: 500 }
      );
    }

    // 5. Update profiles table - assessment is completed, but onboarding_completed stays false until final click
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        assessment_completed: true
      })
      .eq('id', user.userId);

    if (profileUpdateError) {
      console.error('Failed to update profiles table assessment milestone:', profileUpdateError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to record assessment completion.' } },
        { status: 500 }
      );
    }

    // 6. Record exercise_0 as COMPLETED in exercise_instances & exercise_results so Assessment Dashboard shows it completed!
    const nowIso = new Date().toISOString();
    try {
      const { data: ex0Instance } = await supabase
        .from('exercise_instances')
        .upsert({
          user_id: user.userId,
          exercise_id: 'exercise_0',
          status: 'completed',
          unlock_time: nowIso,
          started_at: nowIso,
          submitted_at: nowIso,
          completed_at: nowIso,
          updated_at: nowIso
        }, { onConflict: 'user_id,exercise_id' })
        .select()
        .single();

      if (ex0Instance) {
        const scores = {
          openness: Math.round(openness * 20),
          conscientiousness: Math.round(conscientiousness * 20),
          extraversion: Math.round(extraversion * 20),
          agreeableness: Math.round(agreeableness * 20),
          neuroticism: Math.round(neuroticism * 20)
        };

        await supabase
          .from('exercise_results')
          .upsert({
            instance_id: ex0Instance.id,
            user_id: user.userId,
            exercise_id: 'exercise_0',
            summary: summaryText,
            analysis: {
              scores,
              rawScores: {
                openness,
                conscientiousness,
                extraversion,
                agreeableness,
                neuroticism
              },
              summaryText,
              reflection_text: summaryText
            },
            metrics: {
              openness,
              conscientiousness,
              extraversion,
              agreeableness,
              neuroticism,
              calculated_at: nowIso
            },
            insights: [
              `Openness: ${scores.openness}%`,
              `Conscientiousness: ${scores.conscientiousness}%`,
              `Extraversion: ${scores.extraversion}%`,
              `Agreeableness: ${scores.agreeableness}%`,
              `Neuroticism: ${scores.neuroticism}%`
            ],
            created_at: nowIso
          }, { onConflict: 'instance_id' });

        console.log(`[API Assessment] Recorded exercise_0 instance ${ex0Instance.id} as COMPLETED for user ${user.userId}`);
      }
    } catch (exErr: any) {
      console.error('[API Assessment] Non-fatal error recording exercise_0 instance completion:', exErr?.message);
    }

    return NextResponse.json({
      success: true,
      personality_summary_text: summaryText
    });

  } catch (error) {
    console.error('Onboarding Assessment Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
