import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen, Clock, Target, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

export default function TherapistAssignHomeworkModal({
  session,
  clientId: explicitClientId,
  onClose,
  onSuccess,
}) {
  const clientId = explicitClientId || session?.client?.id || session?.userId || session?.user_id;
  const appointmentId = session?.id || session?.appointmentId;

  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const [title, setTitle] = useState('');
  const [exerciseType, setExerciseType] = useState('thought_record');
  const [instructions, setInstructions] = useState('');
  const [clinicalGoal, setClinicalGoal] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(15);
  const [dueAt, setDueAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/therapist/homework/templates');
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates || []);
        }
      } catch (err) {
        console.warn('Failed to load homework templates:', err);
      } finally {
        setLoadingTemplates(false);
      }
    }
    fetchTemplates();
  }, []);

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const t = templates.find((item) => item.id === templateId);
    if (t) {
      setTitle(t.title);
      setExerciseType(t.exerciseType || 'thought_record');
      setInstructions(t.defaultInstructions || '');
      setClinicalGoal(t.description || '');
      setEstimatedMinutes(t.estimatedMinutes || 15);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!clientId) {
      setErrorMessage('Client identifier missing. Cannot assign self-work.');
      return;
    }
    if (!title.trim() || !instructions.trim()) {
      setErrorMessage('Title and instructions are required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/therapist/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          appointmentId: appointmentId || undefined,
          templateId: selectedTemplateId || undefined,
          title: title.trim(),
          exerciseType,
          instructions: instructions.trim(),
          clinicalGoal: clinicalGoal.trim() || undefined,
          estimatedMinutes: Number(estimatedMinutes) || 15,
          dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to assign homework');
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
        className="bg-white rounded-2xl border border-[#132A24]/10 shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#132A24]/10 flex items-center justify-between bg-[#FAFAF8] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4E7A66]/10 text-[#4E7A66] flex items-center justify-center">
              <BookOpen size={17} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-[#132A24]">
                Assign Self-Work & Homework
              </h3>
              <p className="text-[11px] text-[#132A24]/60">
                Structured clinical exercises for between-session practice.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-[#132A24]/40 hover:text-[#132A24] cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleAssign} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Template Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#132A24] mb-1.5 flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#4E7A66]" />
              Choose Evidence-Based Template (Optional)
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              disabled={loadingTemplates}
              className="w-full border border-[#132A24]/15 rounded-lg px-3 py-2 bg-white text-[#132A24] text-xs focus:outline-hidden focus:border-[#4E7A66]"
            >
              <option value="">-- Custom Exercise (Blank) --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.estimatedMinutes}m &bull; {t.exerciseType.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Title & Exercise Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#132A24]/70 mb-1">
                Exercise Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={255}
                placeholder="e.g. 5-Column Thought Record"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-[#132A24]/15 rounded-lg px-3 py-2 bg-white text-[#132A24] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#132A24]/70 mb-1">
                Exercise Type
              </label>
              <select
                value={exerciseType}
                onChange={(e) => setExerciseType(e.target.value)}
                className="w-full border border-[#132A24]/15 rounded-lg px-3 py-2 bg-white text-[#132A24] text-xs"
              >
                <option value="thought_record">Thought Record (CBT)</option>
                <option value="psychoeducation_module">Psychoeducation Module</option>
                <option value="behavioral_activation">Behavioral Activation</option>
                <option value="journaling_reflection">Journaling & Values Reflection</option>
                <option value="grounding_exercise">Grounding & Somatic Regulation</option>
                <option value="custom_worksheet">Custom Clinical Worksheet</option>
              </select>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-medium text-[#132A24]/70 mb-1">
              Instructions for Client <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              maxLength={5000}
              placeholder="Provide clear, step-by-step guidance on how the client should complete this self-work..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full border border-[#132A24]/15 rounded-lg p-3 bg-white text-[#132A24] text-xs leading-relaxed"
            />
          </div>

          {/* Clinical Goal */}
          <div>
            <label className="block text-xs font-medium text-[#132A24]/70 mb-1 flex items-center gap-1">
              <Target size={13} className="text-[#4E7A66]" /> Clinical Objective / Target Schema
            </label>
            <input
              type="text"
              placeholder="e.g. Identify cognitive distortions in workplace catastrophizing"
              value={clinicalGoal}
              onChange={(e) => setClinicalGoal(e.target.value)}
              className="w-full border border-[#132A24]/15 rounded-lg px-3 py-2 bg-white text-[#132A24] text-xs"
            />
          </div>

          {/* Duration & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#132A24]/70 mb-1 flex items-center gap-1">
                <Clock size={13} /> Est. Minutes
              </label>
              <input
                type="number"
                min={5}
                max={180}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                className="w-full border border-[#132A24]/15 rounded-lg px-3 py-2 bg-white text-[#132A24] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#132A24]/70 mb-1">
                Due Date & Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full border border-[#132A24]/15 rounded-lg px-3 py-2 bg-white text-[#132A24] text-xs"
              />
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#132A24]/5 text-[11px] text-[#132A24]/60">
            <strong>Client Privacy:</strong> The client will complete this worksheet in their portal. Their unassigned personal journals remain strictly private and will never be shown here.
          </div>

          {/* Action Buttons */}
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
              {submitting ? 'Assigning...' : 'Assign Exercise'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
