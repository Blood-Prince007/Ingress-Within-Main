import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen, CheckCircle2, Clock, MessageSquare, AlertCircle, Save, Send } from 'lucide-react';

export default function ClientHomeworkModal({
  assignmentId,
  onClose,
  onSuccess,
}) {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadAssignment() {
      setLoading(true);
      setErrorMessage('');
      try {
        const res = await fetch(`/api/therapy/client/homework/${assignmentId}`);
        if (!res.ok) {
          throw new Error('Failed to load homework details.');
        }
        const data = await res.json();
        setAssignment(data.assignment);
        if (data.assignment?.submission?.responseContent) {
          setContent(data.assignment.submission.responseContent);
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

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const res = await fetch(`/api/therapy/client/homework/${assignmentId}/save-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to save draft');
      setStatusMessage('Draft saved successfully.');
      setTimeout(() => setStatusMessage(''), 3000);
      onSuccess && onSuccess(data.submission);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMessage('Please enter your response before submitting.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const res = await fetch(`/api/therapy/client/homework/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to submit response');
      onSuccess && onSuccess(data.assignment);
      onClose();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isImmutable = assignment?.status === 'reviewed';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-gray-900">
                {assignment?.title || 'Self-Work Exercise'}
              </h3>
              <p className="text-xs text-gray-500">
                Assigned by {assignment?.therapistName || 'Your Clinician'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-700 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading exercise details...</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {statusMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Exercise Instructions Card */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Exercise Instructions
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-blue-50 text-blue-700">
                  {assignment?.exerciseType ? assignment.exerciseType.replace(/_/g, ' ') : 'Exercise'}
                </span>
              </div>
              <p className="text-gray-700 text-xs leading-relaxed whitespace-pre-wrap">
                {assignment?.instructions}
              </p>
              {assignment?.clinicalGoal && (
                <p className="text-emerald-800 text-[11px] pt-1">
                  <strong>Goal:</strong> {assignment.clinicalGoal}
                </p>
              )}
            </div>

            {/* Clinician Feedback Card (if reviewed) */}
            {assignment?.submission?.therapistFeedback && (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-900 text-xs">
                  <MessageSquare size={13} className="text-emerald-700" /> Clinician Feedback & Reflections
                </div>
                <p className="text-emerald-800 text-xs leading-relaxed whitespace-pre-wrap">
                  {assignment.submission.therapistFeedback}
                </p>
              </div>
            )}

            {/* Response Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-800 block">
                Your Practice Reflection / Response
              </label>
              <textarea
                rows={7}
                disabled={isImmutable}
                placeholder="Write your reflections, observations, thoughts, or responses here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-xs text-gray-900 leading-relaxed focus:outline-hidden focus:border-emerald-600 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 flex items-center justify-between border-t border-gray-100 shrink-0">
              <div>
                {!isImmutable && (
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={savingDraft || submitting}
                    className="px-3.5 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer disabled:opacity-50"
                  >
                    <Save size={13} /> {savingDraft ? 'Saving...' : 'Save Draft'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs cursor-pointer"
                >
                  {isImmutable ? 'Close' : 'Cancel'}
                </button>
                {!isImmutable && (
                  <button
                    type="submit"
                    disabled={submitting || savingDraft}
                    className="px-4 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-medium hover:bg-emerald-900 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <Send size={13} /> {submitting ? 'Submitting...' : 'Submit to Clinician'}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
