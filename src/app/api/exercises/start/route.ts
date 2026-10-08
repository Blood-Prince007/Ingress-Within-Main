import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ExerciseRepository } from '../../../../lib/exercises/v4/repository/exerciseRepository';
import { ExerciseService } from '../../../../lib/exercises/v4/services/exerciseService';
import { Exercise2Service } from '../../../../lib/exercises/v4/services/exercise2Service';
import { Exercise3Service } from '../../../../lib/exercises/v4/services/exercise3Service';
import { AccessControlService, AccessDeniedError } from '../../../../lib/billing/accessControlService';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const exerciseId = body.exercise_id;
    let instanceId = body.instance_id;

    // Access control: Ensure user is TRIAL, ACTIVE, PAST_DUE, or CANCELLED_PENDING (not DORMANT)
    await AccessControlService.requireExerciseProgressAccess(authUser.userId, exerciseId);

    // Delegate Exercise 3 to isolated Exercise3Service
    if (exerciseId === 'exercise_3' || exerciseId === 'self_perception') {
      const currentDay = body.current_day || 23;
      const currentCycle = body.current_cycle || 1;
      const { instance } = await Exercise3Service.startExercise(authUser.userId, currentDay, currentCycle);
      return NextResponse.json({ success: true, instance });
    }

    // Delegate Exercise 2 to isolated Exercise2Service
    if (exerciseId === 'exercise_2' || exerciseId === 'inkblot_projective') {
      const currentDay = body.current_day || 16;
      const currentCycle = body.current_cycle || 1;
      const { instance, result } = await Exercise2Service.startExercise(authUser.userId, currentDay, currentCycle);
      return NextResponse.json({ success: true, instance, result });
    }

    let instance = instanceId ? await ExerciseRepository.getInstance(instanceId) : null;

    if (!instance && exerciseId) {
      const found = await ExerciseRepository.getInstanceByUserAndExercise(authUser.userId, body.cycle_id, exerciseId);
      if (found) {
        instance = found;
      } else {
        instance = await ExerciseService.createInstance(authUser.userId, exerciseId, body.cycle_id, 'available');
      }
    }

    if (!instance) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Exercise instance not found.' } },
        { status: 404 }
      );
    }

    if (instance.user_id !== authUser.userId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied.' } },
        { status: 403 }
      );
    }

    const startedInstance = await ExerciseService.startExercise(instance.id);
    return NextResponse.json({ success: true, instance: startedInstance });
  } catch (error: any) {
    if (error instanceof AccessDeniedError || error.code === 'SUBSCRIPTION_REQUIRED' || error.code === 'SELF_HELP_SUBSCRIPTION_REQUIRED') {
      return NextResponse.json(
        {
          error: {
            code: 'SELF_HELP_SUBSCRIPTION_REQUIRED',
            message: error.message || 'An active self-help subscription is required to progress through exercises.',
            state: error.state || 'DORMANT'
          }
        },
        { status: error.statusCode || 403 }
      );
    }

    console.error('[POST /api/exercises/start] Error:', error);
    return NextResponse.json(
      { error: { code: 'START_FAILED', message: error.message || 'Failed to start exercise.' } },
      { status: 400 }
    );
  }
}
