import { supabase } from '../db';

export class ClientHomeworkService {
  /**
   * Retrieves all clinical self-work assignments assigned to the client.
   */
  static async getClientAssignments(userId: string, filter: { status?: string } = {}) {
    let query = supabase
      .from('client_homework_assignments')
      .select(`
        id,
        therapist_account_id,
        appointment_id,
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
        therapist:therapist_account_id (id, full_name, email),
        submission:client_homework_submissions (id, is_draft, submitted_at, therapist_feedback, feedback_added_at)
      `)
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .order('due_at', { ascending: true, nullsFirst: false });

    if (filter.status) {
      query = query.eq('status', filter.status);
    }

    const { data: assignments, error } = await query;
    if (error) {
      console.error('[ClientHomeworkService] Failed to query client assignments:', error);
      return [];
    }

    const now = Date.now();

    return (assignments || []).map((a: any) => {
      const sub = Array.isArray(a.submission) ? a.submission[0] : a.submission;
      const dueTime = a.due_at ? new Date(a.due_at).getTime() : null;
      const hoursRemaining = dueTime ? (dueTime - now) / (1000 * 60 * 60) : null;
      const isOverdue = dueTime ? dueTime < now && !['submitted', 'reviewed'].includes(a.status) : false;

      return {
        id: a.id,
        therapistAccountId: a.therapist_account_id,
        therapistName: a.therapist?.full_name || 'Your Therapist',
        appointmentId: a.appointment_id,
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
        isOverdue,
        hoursRemaining: hoursRemaining !== null ? Math.round(hoursRemaining * 10) / 10 : null,
        hasDraft: Boolean(sub?.is_draft),
        hasFeedback: Boolean(sub?.therapist_feedback),
        feedback: sub?.therapist_feedback || null,
      };
    });
  }

  /**
   * Retrieves full details of a specific assignment for a client.
   * Automatically marks status as 'viewed' if it was 'assigned'.
   */
  static async getClientAssignmentById(userId: string, assignmentId: string) {
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
        therapist:therapist_account_id (id, full_name, email),
        submission:client_homework_submissions (*)
      `)
      .eq('id', assignmentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !assignment) {
      const err: any = new Error('Self-work assignment not found or unauthorized.');
      err.code = 'ASSIGNMENT_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    // Mark as 'viewed' if first time opened
    if (assignment.status === 'assigned') {
      const nowIso = new Date().toISOString();
      await supabase
        .from('client_homework_assignments')
        .update({
          status: 'viewed',
          viewed_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', assignmentId);
      assignment.status = 'viewed';
      assignment.viewed_at = nowIso;
    }

    const sub = Array.isArray(assignment.submission) ? assignment.submission[0] : assignment.submission;

    return {
      id: assignment.id,
      therapistAccountId: assignment.therapist_account_id,
      therapistName: assignment.therapist?.full_name || 'Your Therapist',
      appointmentId: assignment.appointment_id,
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
   * Saves a draft response for an assignment (in_progress).
   */
  static async saveDraftResponse(
    userId: string,
    assignmentId: string,
    content: string,
    metadata: Record<string, any> = {}
  ) {
    const { data: assignment, error: fetchErr } = await supabase
      .from('client_homework_assignments')
      .select('id, therapist_account_id, status')
      .eq('id', assignmentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchErr || !assignment) {
      const err: any = new Error('Assignment not found or unauthorized.');
      err.code = 'ASSIGNMENT_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    if (assignment.status === 'reviewed') {
      const err: any = new Error('Cannot edit response for an already reviewed assignment.');
      err.code = 'ASSIGNMENT_IMMUTABLE';
      err.status = 400;
      throw err;
    }

    if (assignment.status === 'cancelled') {
      const err: any = new Error('Cannot edit a cancelled assignment.');
      err.code = 'ASSIGNMENT_CANCELLED';
      err.status = 400;
      throw err;
    }

    if (content && content.length > 20000) {
      const err: any = new Error('Response cannot exceed 20,000 characters.');
      err.code = 'INVALID_INPUT';
      err.status = 400;
      throw err;
    }

    const nowIso = new Date().toISOString();

    // 1. Check existing submission
    const { data: existingSub } = await supabase
      .from('client_homework_submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .maybeSingle();

    let savedSub;
    if (existingSub) {
      const { data: upd, error: updErr } = await supabase
        .from('client_homework_submissions')
        .update({
          response_content: content,
          response_metadata: metadata || {},
          is_draft: true,
          updated_at: nowIso,
        })
        .eq('id', existingSub.id)
        .select('*')
        .single();
      if (updErr) throw new Error('Failed to update draft response.');
      savedSub = upd;
    } else {
      const { data: ins, error: insErr } = await supabase
        .from('client_homework_submissions')
        .insert({
          assignment_id: assignmentId,
          user_id: userId,
          therapist_account_id: assignment.therapist_account_id,
          response_content: content,
          response_metadata: metadata || {},
          is_draft: true,
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select('*')
        .single();
      if (insErr) throw new Error('Failed to save draft response.');
      savedSub = ins;
    }

    // 2. Transition assignment to in_progress if was assigned/viewed
    if (assignment.status === 'assigned' || assignment.status === 'viewed') {
      await supabase
        .from('client_homework_assignments')
        .update({
          status: 'in_progress',
          updated_at: nowIso,
        })
        .eq('id', assignmentId);
    }

    return {
      success: true,
      submission: savedSub,
      status: 'in_progress',
    };
  }

  /**
   * Finalizes and submits a response to the therapist.
   */
  static async submitResponse(
    userId: string,
    assignmentId: string,
    content: string,
    metadata: Record<string, any> = {}
  ) {
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      const err: any = new Error('Response content cannot be empty.');
      err.code = 'INVALID_INPUT';
      err.status = 400;
      throw err;
    }

    if (content.length > 20000) {
      const err: any = new Error('Response cannot exceed 20,000 characters.');
      err.code = 'INVALID_INPUT';
      err.status = 400;
      throw err;
    }

    const { data: assignment, error: fetchErr } = await supabase
      .from('client_homework_assignments')
      .select('id, title, therapist_account_id, status')
      .eq('id', assignmentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchErr || !assignment) {
      const err: any = new Error('Assignment not found or unauthorized.');
      err.code = 'ASSIGNMENT_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    if (assignment.status === 'reviewed') {
      const err: any = new Error('Cannot resubmit an already reviewed assignment.');
      err.code = 'ASSIGNMENT_IMMUTABLE';
      err.status = 400;
      throw err;
    }

    if (assignment.status === 'cancelled') {
      const err: any = new Error('Cannot submit a cancelled assignment.');
      err.code = 'ASSIGNMENT_CANCELLED';
      err.status = 400;
      throw err;
    }

    const nowIso = new Date().toISOString();

    // 1. Upsert submission
    const { data: existingSub } = await supabase
      .from('client_homework_submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .maybeSingle();

    let savedSub;
    if (existingSub) {
      const { data: upd, error: updErr } = await supabase
        .from('client_homework_submissions')
        .update({
          response_content: content.trim(),
          response_metadata: metadata || {},
          is_draft: false,
          submitted_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', existingSub.id)
        .select('*')
        .single();
      if (updErr) throw new Error('Failed to finalize submission.');
      savedSub = upd;
    } else {
      const { data: ins, error: insErr } = await supabase
        .from('client_homework_submissions')
        .insert({
          assignment_id: assignmentId,
          user_id: userId,
          therapist_account_id: assignment.therapist_account_id,
          response_content: content.trim(),
          response_metadata: metadata || {},
          is_draft: false,
          submitted_at: nowIso,
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select('*')
        .single();
      if (insErr) throw new Error('Failed to create submission.');
      savedSub = ins;
    }

    // 2. Transition assignment to submitted
    const { data: updatedAssignment, error: assignErr } = await supabase
      .from('client_homework_assignments')
      .update({
        status: 'submitted',
        submitted_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', assignmentId)
      .select('*')
      .single();

    if (assignErr) {
      throw new Error('Failed to update assignment status to submitted.');
    }

    // 3. Dispatch in-app notification to therapist
    try {
      await supabase.from('therapist_notifications').insert({
        therapist_account_id: assignment.therapist_account_id,
        user_id: userId,
        notification_type: 'homework_submitted',
        title: 'Self-Work Completed',
        body: `Client submitted reflection for "${assignment.title}".`,
        action_url: `/therapist/clients`,
        is_read: false,
        created_at: nowIso,
      });
    } catch (notifErr) {
      console.warn('[ClientHomeworkService] Notification dispatch failed gracefully:', notifErr);
    }

    return {
      success: true,
      assignment: updatedAssignment,
      submission: savedSub,
      status: 'submitted',
    };
  }
}
