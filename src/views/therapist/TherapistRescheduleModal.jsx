import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';

export default function TherapistRescheduleModal({
  appointment,
  onClose,
  onSuccess,
}) {
  const [newDate, setNewDate] = useState(
    appointment?.scheduled_start ? appointment.scheduled_start.split('T')[0] : ''
  );
  const [newTime, setNewTime] = useState(
    appointment?.scheduled_start ? appointment.scheduled_start.substring(11, 16) : '10:00'
  );
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [reason, setReason] = useState('Client requested slot adjustment');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleReschedule = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      const newStart = new Date(`${newDate}T${newTime}:00`);
      const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);

      const res = await fetch(`/api/therapist/sessions/${appointment.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_start: newStart.toISOString(),
          new_end: newEnd.toISOString(),
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error?.code === 'SESSION_CONFLICT' || data.error?.code === 'CLIENT_CONFLICT' || data.error?.code === 'BLOCKED_WINDOW') {
          throw new Error('This time overlaps with another scheduled commitment.');
        }
        if (data.error?.code === 'OUTSIDE_WORKING_HOURS') {
          throw new Error('This time is outside your configured working hours.');
        }
        throw new Error(data.error?.message || 'Failed to reschedule.');
      }

      onSuccess && onSuccess(data.appointment || data.session);
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
        className="bg-white rounded-2xl border border-[#132A24]/10 shadow-xl max-w-md w-full overflow-hidden"
      >
        <div className="p-6 border-b border-[#132A24]/10 flex items-center justify-between bg-[#FAFAF8]">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[#4E7A66]" />
            <h3 className="font-serif text-lg font-medium text-[#132A24]">
              Reschedule Session
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-[#132A24]/40 hover:text-[#132A24]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleReschedule} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <span className="font-medium text-[#132A24] block mb-1">Client:</span>
            <p className="text-[#132A24]/70">
              {appointment?.clientDisplayName || 'Client session'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#132A24]/70 mb-1">New Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full border border-[#132A24]/15 rounded-lg px-3 py-2 bg-white text-[#132A24]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#132A24]/70 mb-1">New Time</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full border border-[#132A24]/15 rounded-lg px-3 py-2 bg-white text-[#132A24]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#132A24]/70 mb-1">Reschedule Reason (Recorded in audit trail)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-[#132A24]/15 rounded-lg px-3 py-2 bg-white text-[#132A24]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#132A24]/15 text-[#132A24] text-xs hover:bg-[#132A24]/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#132A24] text-white text-xs font-semibold hover:bg-[#132A24]/90 disabled:opacity-50"
            >
              {submitting ? 'Verifying...' : 'Save Reschedule'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
