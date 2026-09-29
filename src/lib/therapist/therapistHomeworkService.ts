import { supabase } from '../db';
import { EmailService } from '../email/emailService';
import { EmailEvents } from '../email/emailEvents';

export interface CreateHomeworkPayload {
  clientId: string;
  appointmentId?: string;
  templateId?: string;
  title: string;
  instructions: string;
  clinicalGoal?: string;
  exerciseType: 'psychoeducation_module' | 'thought_record' | 'behavioral_activation' | 'journaling_reflection' | 'grounding_exercise' | 'custom_worksheet';
  resourceReference?: string;
  estimatedMinutes?: number;
  dueAt?: string; // ISO string
}

export interface UpdateHomeworkPayload {
  title?: string;
  instructions?: string;
  clinicalGoal?: string;
  dueAt?: string | null;
  status?: 'assigned' | 'cancelled';
}

export class TherapistHomeworkService {
  /**
   * Retrieves available homework templates (platform standard + clinician custom).
   */
  static async getTemplates(therapistAccountId: string) {
    const { data: templates, error } = await supabase
      .from('therapy_homework_templates')
      .select('*')
      .or(`therapist_account_id.is.null,therapist_account_id.eq.${therapistAccountId}`)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[TherapistHomeworkService] Failed to fetch templates:', error);
      return [];
    }

    return (templates || []).map((t) => ({
      id: t.id,
      therapistAccountId: t.therapist_account_id,
      isCustom: Boolean(t.therapist_account_id),
      title: t.title,
      description: t.description,
      exerciseType: t.exercise_type,
      resourceReference: t.resource_reference,
      defaultInstructions: t.default_instructions,
      estimatedMinutes: t.estimated_minutes,
    }));
  }

  /**
   * Retrieves clinical assignments created by the therapist.
   * Filterable by clientId, appointmentId, or status.
   */
  static async getAssignments(
    therapistAccountId: string,
    filter: { clientId?: string; appointmentId?: string; status?: string } = {}
  ) {
    let query = supabase
      .from('client_homework_assignments')
      .select(`
        id,
        user_id,
        relationship_id,
        appointment_id,
        template_id,
        title,
        instructions,
        clinical_goal,
        exercise_type,
        resource_reference,
        estimated_minutes,
        due_at,
        status,
        assigned_at,
        viewed_at,
        submitted_at,
        reviewed_at,
        created_at,
        users:user_id (id, full_name, email)
      `)
      .eq('therapist_account_id', therapistAccountId)
      .order('created_at', { ascending: false });

    if (filter.clientId) {
      query = query.eq('user_id', filter.clientId);
    }
    if (filter.appointmentId) {
      query = query.eq('appointment_id', filter.appointmentId);
    }
    if (filter.status) {
      query = query.eq('status', filter.status);
    }

    const { data: assignments, error } = await query;
    if (error) {
      console.error('[TherapistHomeworkService] Failed to query assignments:', error);
      return [];
    }

    return (assignments || []).map((a: any) => ({
      id: a.id,
      clientId: a.user_id,
      clientName: a.users?.full_name ? `Client #${a.user_id.substring(0, 6)}` : 'Client',
      relationshipId: a.relationship_id,
      appointmentId: a.appointment_id,
      templateId: a.template_id,
      title: a.title,
      instructions: a.instructions,
      clinicalGoal: a.clinical_goal,
      exerciseType: a.exercise_type,
      resourceReference: a.resource_reference,
      estimatedMinutes: a.estimated_minutes,
      dueAt: a.due_at,
      status: a.status,
      assignedAt: a.assigned_at,
      viewedAt: a.viewed_at,
      submittedAt: a.submitted_at,
      reviewedAt: a.reviewed_at,
      createdAt: a.created_at,
    }));
  }

  /**
   * Retrieves full details of a specific assignment, including client submission & feedback.
   */
  static async getAssignmentById(therapistAccountId: string, assignmentId: string) {
    if (!assignmentId) {
      const err: any = new Error('assignmentId is required.');
      err.code = 'INVALID_INPUT';
      err.status = 400;
      throw err;
    }

    const { data: assignment, error } = await supabase
      .from('client_homework_assignments')
      .select(`
        *,
        users:user_id (id, full_name, email),
        submission:client_homework_submissions (*)
      `)
      .eq('id', assignmentId)
      .eq('therapist_account_id', therapistAccountId)
      .maybeSingle();

    if (error || !assignment) {
      const err: any = new Error('Assignment not found or unauthorized.');
      err.code = 'ASSIGNMENT_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    const sub = Array.isArray(assignment.submission) ? assignment.submission[0] : assignment.submission;

    return {
      id: assignment.id,
      clientId: assignment.user_id,
      clientName: assignment.users?.full_name ? `Client #${assignment.user_id.substring(0, 6)}` : 'Client',
      relationshipId: assignment.relationship_id,
      appointmentId: assignment.appointment_id,
      templateId: assignment.template_id,
      title: assignment.title,
      instructions: assignment.instructions,
      clinicalGoal: assignment.clinical_goal,
      exerciseType: assignment.exercise_type,
      resourceReference: assignment.resource_reference,
      estimatedMinutes: assignment.estimated_minutes,
      dueAt: assignment.due_at,
      status: assignment.status,
      assignedAt: assignment.assigned_at,
      viewedAt: assignment.viewed_at,
      submittedAt: assignment.submitted_at,
      reviewedAt: assignment.reviewed_at,
      createdAt: assignment.created_at,
      submission: sub ? {
        id: sub.id,
        responseContent: sub.response_content,
        responseMetadata: sub.response_metadata,
        isDraft: sub.is_draft,
        submittedAt: sub.submitted_at,
        therapistFeedback: sub.therapist_feedback,
        feedbackAddedAt: sub.feedback_added_at,
      } : null,
    };
  }

  /**
   * Creates and assigns a new clinical homework exercise to a client.
   * STRICT AUTHORIZATION: Enforces active care relationship between therapist and client.
   */
  static async createAssignment(therapistAccountId: string, payload: CreateHomeworkPayload) {
    const {
      clientId,
      appointmentId,
      templateId,
      title,
      instructions,
      clinicalGoal,
      exerciseType,
      resourceReference,
      estimatedMinutes,
      dueAt,
    } = payload;

    if (!clientId || typeof clientId !== 'string') {
      const err: any = new Error('Valid clientId is required.');
      err.code = 'INVALID_INPUT';
      err.status = 400;
      throw err;
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      const err: any = new Error('Title is required.');
      err.code = 'INVALID_INPUT';
      err.status = 400;
      throw err;
    }

    if (title.length > 255) {
      const err: any = new Error('Title cannot exceed 255 characters.');
      err.code = 'INVALID_INPUT';
      err.status = 400;
      throw err;
    }

    if (!instructions || typeof instructions !== 'string' || instructions.trim().length === 0) {
      const err: any = new Error('Instructions are required.');
      err.code = 'INVALID_INPUT';
      err.status = 400;
      throw err;
    }

    if (instructions.length > 5000) {
      const err: any = new Error('Instructions cannot exceed 5,000 characters.');
      err.code = 'INVALID_INPUT';
      err.status = 400;
      throw err;
    }

    const validTypes = [
      'psychoeducation_module',
      'thought_record',
      'behavioral_activation',
      'journaling_reflection',
      'grounding_exercise',
      'custom_worksheet',
    ];
    if (!exerciseType || !validTypes.includes(exerciseType)) {
      const err: any = new Error(`Invalid exerciseType. Allowed: ${validTypes.join(', ')}`);
      err.code = 'INVALID_INPUT';
      err.status = 400;
      throw err;
    }

    if (dueAt) {
      const dueTime = new Date(dueAt).getTime();
      if (isNaN(dueTime)) {
        const err: any = new Error('dueAt must be a valid ISO timestamp.');
        err.code = 'INVALID_INPUT';
        err.status = 400;
        throw err;
      }
    }

    // 1. Verify active care relationship
    const { data: relationship, error: relErr } = await supabase
      .from('therapy_care_relationships')
      .select('id, status, care_stage')
      .eq('therapist_account_id', therapistAccountId)
      .eq('user_id', clientId)
      .eq('status', 'active')
      .maybeSingle();

    if (relErr || !relationship) {
      const err: any = new Error('Client does not have an active care relationship with this therapist.');
      err.code = 'CLIENT_NOT_AUTHORIZED';
      err.status = 403;
      throw err;
    }

    if (relationship.care_stage === 'completed') {
      const err: any = new Error('Care relationship is completed. Cannot assign new self-work.');
      err.code = 'RELATIONSHIP_TERMINATED';
      err.status = 409;
      throw err;
    }

    // 2. Validate appointment belongs to pair if provided
    let verifiedAppointmentId: string | null = null;
    if (appointmentId) {
      const { data: appt } = await supabase
        .from('therapist_clinical_appointments')
        .select('id')
        .eq('id', appointmentId)
        .eq('therapist_account_id', therapistAccountId)
        .eq('user_id', clientId)
        .maybeSingle();

      if (!appt) {
        const err: any = new Error('Specified appointment does not belong to this therapist-client pair.');
        err.code = 'INVALID_APPOINTMENT';
        err.status = 400;
        throw err;
      }
      verifiedAppointmentId = appt.id;
    }

    const duration = Number(estimatedMinutes) > 0 && Number(estimatedMinutes) <= 180
      ? Math.round(Number(estimatedMinutes))
      : 15;

    // 3. Insert assignment
    const { data: newAssignment, error: insertErr } = await supabase
      .from('client_homework_assignments')
      .insert({
        therapist_account_id: therapistAccountId,
        user_id: clientId,
        relationship_id: relationship.id,
        appointment_id: verifiedAppointmentId,
        template_id: templateId || null,
        title: title.trim(),
        instructions: instructions.trim(),
        clinical_goal: clinicalGoal ? clinicalGoal.trim() : null,
        exercise_type: exerciseType,
        resource_reference: resourceReference || null,
        estimated_minutes: duration,
        due_at: dueAt || null,
        status: 'assigned',
        assigned_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (insertErr || !newAssignment) {
      console.error('[TherapistHomeworkService] Insert assignment error:', insertErr);
      throw new Error('Failed to create homework assignment.');
    }

    return newAssignment;
  }

  /**
   * Updates an assignment (instructions, due date, or cancellation).
   */
  static async updateAssignment(
    therapistAccountId: string,
    assignmentId: string,
    updates: UpdateHomeworkPayload
  ) {
    const { data: appt, error: fetchErr } = await supabase
      .from('client_homework_assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('therapist_account_id', therapistAccountId)
      .maybeSingle();

    if (fetchErr || !appt) {
      const err: any = new Error('Assignment not found or unauthorized.');
      err.code = 'ASSIGNMENT_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    if (appt.status === 'reviewed') {
      const err: any = new Error('Cannot modify an assignment that has already been reviewed.');
      err.code = 'ASSIGNMENT_IMMUTABLE';
      err.status = 400;
      throw err;
    }

    const patch: any = { updated_at: new Date().toISOString() };

    if (updates.title) {
      if (updates.title.length > 255) {
        const err: any = new Error('Title cannot exceed 255 characters.');
        err.code = 'INVALID_INPUT';
        err.status = 400;
        throw err;
      }
      patch.title = updates.title.trim();
    }

    if (updates.instructions) {
      if (updates.instructions.length > 5000) {
        const err: any = new Error('Instructions cannot exceed 5000 characters.');
        err.code = 'INVALID_INPUT';
        err.status = 400;
        throw err;
      }
      patch.instructions = updates.instructions.trim();
    }

    if (updates.clinicalGoal !== undefined) {
      patch.clinical_goal = updates.clinicalGoal ? updates.clinicalGoal.trim() : null;
    }

    if (updates.dueAt !== undefined) {
      patch.due_at = updates.dueAt;
    }

    if (updates.status === 'cancelled') {
      patch.status = 'cancelled';
    }

    const { data: updated, error: updErr } = await supabase
      .from('client_homework_assignments')
      .update(patch)
      .eq('id', assignmentId)
      .select('*')
      .single();

    if (updErr || !updated) {
      console.error('[TherapistHomeworkService] Update error:', updErr);
      throw new Error('Failed to update assignment.');
    }

    return updated;
  }

  /**
   * Reviews a client's submitted homework, adds clinical feedback, and marks status as 'reviewed'.
   */
  static async reviewSubmission(
    therapistAccountId: string,
    assignmentId: string,
    feedbackText: string
  ) {
    if (!assignmentId) {
      const err: any = new Error('assignmentId is required.');
      err.code = 'INVALID_INPUT';
      err.status = 400;
      throw err;
    }

    const { data: assignment, error: fetchErr } = await supabase
      .from('client_homework_assignments')
      .select('id, status, user_id')
      .eq('id', assignmentId)
      .eq('therapist_account_id', therapistAccountId)
      .maybeSingle();

    if (fetchErr || !assignment) {
      const err: any = new Error('Assignment not found or unauthorized.');
      err.code = 'ASSIGNMENT_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    if (assignment.status !== 'submitted' && assignment.status !== 'reviewed') {
      const err: any = new Error('Cannot review an assignment that has not been submitted by the client.');
      err.code = 'INVALID_STATE_TRANSITION';
      err.status = 400;
      throw err;
    }

    const nowIso = new Date().toISOString();

    // 1. Update submission feedback
    const { error: subErr } = await supabase
      .from('client_homework_submissions')
      .update({
        therapist_feedback: feedbackText ? feedbackText.trim() : '',
        feedback_added_at: nowIso,
        updated_at: nowIso,
      })
      .eq('assignment_id', assignmentId)
      .eq('therapist_account_id', therapistAccountId);

    if (subErr) {
      console.error('[TherapistHomeworkService] Feedback update error:', subErr);
      throw new Error('Failed to record clinical feedback.');
    }

    // 2. Mark assignment as reviewed
    const { data: updatedAssignment, error: assignUpdErr } = await supabase
      .from('client_homework_assignments')
      .update({
        status: 'reviewed',
        reviewed_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', assignmentId)
      .select('*')
      .single();

    if (assignUpdErr || !updatedAssignment) {
      throw new Error('Failed to finalize assignment review.');
    }

    return updatedAssignment;
  }
}
