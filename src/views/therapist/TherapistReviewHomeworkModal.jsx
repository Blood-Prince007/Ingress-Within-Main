import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2, MessageSquare, AlertCircle, Clock, BookOpen } from 'lucide-react';

export default function TherapistReviewHomeworkModal({
  assignmentId,
  onClose,
  onSuccess,
}) {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadAssignment() {
      setLoading(true);
      try {
        const res = await fetch(`/api/therapist/homework/${assignmentId}`);
        if (!res.ok) {
          throw new Error('Failed to load assignment details.');
        }
        const data = await res.json();
        setAssignment(data.assignment);
        if (data.assignment?.submission?.therapistFeedback) {
          setFeedback(data.assignment.submission.therapistFeedback);
        }
      } catch (err) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (assignmentId) {
      loadAssignment();
    }
  }, [assignmentId]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/therapist/homework/${assignmentId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: feedback.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to submit review');
      }

      onSuccess && onSuccess(data.assignment);
      onClose();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border border-[#132A24]/10 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#132A24]/10 flex items-center justify-between bg-[#FAFAF8] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4E7A66]/10 text-[#4E7A66] flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-[#132A24]">
                Review Client Self-Work
              </h3>
              <p className="text-[11px] text-[#132A24]/60">
                {assignment ? assignment.title : 'Loading...'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-[#132A24]/40 hover:text-[#132A24] cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center text-xs text-[#132A24]/50">
            Loading assignment and client submission...
          </div>
        ) : (
          <form onSubmit={handleReviewSubmit} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Assignment Summary Box */}
            <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#132A24] text-xs">
                  {assignment?.title}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-700">
                  {assignment?.status}
                </span>
              </div>
              <p className="text-[#132A24]/70 leading-relaxed text-[11px]">
                <strong>Instructions:</strong> {assignment?.instructions}
              </p>
              {assignment?.clinicalGoal && (
                <p className="text-[#4E7A66] text-[11px]">
                  <strong>Clinical Goal:</strong> {assignment.clinicalGoal}
                </p>
              )}
            </div>

            {/* Client Response */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#132A24] flex items-center gap-1.5">
                  <BookOpen size={13} className="text-[#4E7A66]" />
                  Client Submission
                </label>
                {assignment?.submission?.submittedAt && (
                  <span className="text-[10px] text-[#132A24]/50 flex items-center gap-1">
                    <Clock size={11} /> Submitted {new Date(assignment.submission.submittedAt).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#132A24]/15 min-h-[120px] max-h-[220px] overflow-y-auto text-xs text-[#132A24] leading-relaxed whitespace-pre-wrap">
                {assignment?.submission?.responseContent || (
                  <span className="text-[#132A24]/40 italic">No text content submitted.</span>
                )}
              </div>
            </div>

            {/* Therapist Clinical Feedback */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-[#132A24] flex items-center gap-1.5">
                <MessageSquare size={13} className="text-[#4E7A66]" />
                Clinician Feedback & Reflections
              </label>
              <textarea
                rows={4}
                placeholder="Add constructive clinical notes, validation, or insights for your client to read..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full border border-[#132A24]/15 rounded-lg p-3 bg-white text-[#132A24] text-xs leading-relaxed focus:outline-hidden focus:border-[#4E7A66]"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-[#132A24]/15 text-[#132A24] text-xs hover:bg-[#132A24]/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-[#4E7A66] text-white text-xs font-semibold hover:bg-[#4E7A66]/90 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {submitting ? 'Finalizing Review...' : 'Finalize & Send Feedback'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
