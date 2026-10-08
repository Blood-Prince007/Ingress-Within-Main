import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, Video, AlertCircle } from 'lucide-react';

export default function TherapistScheduleModal({
  defaultClientId,
  defaultClientName,
  onClose,
  onSuccess,
}) {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(defaultClientId || '');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionTime, setSessionTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [sessionType, setSessionType] = useState('video');
  const [clientNotes, setClientNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch('/api/therapist/clients');
        if (res.ok) {
          const json = await res.json();
          setClients(json.clients || []);
          if (!selectedClientId && json.clients?.length > 0) {
            setSelectedClientId(json.clients[0].clientId);
          }
        }
      } catch (e) {}
    }
    loadClients();
  }, []);

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!selectedClientId) {
      setErrorMessage('Please select a client.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const scheduledStart = new Date(`${sessionDate}T${sessionTime}:00`);
      const scheduledEnd = new Date(scheduledStart.getTime() + durationMinutes * 60000);

      const res = await fetch('/api/therapist/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedClientId,
          scheduled_start: scheduledStart.toISOString(),
          scheduled_end: scheduledEnd.toISOString(),
          session_type: sessionType,
          client_notes: clientNotes,
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
        if (data.error?.code === 'CLIENT_NOT_AUTHORIZED') {
          throw new Error('Client does not have an active care relationship with you.');
        }
        throw new Error(data.error?.message || 'Failed to schedule session.');
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
        className="bg-white rounded-2xl border border-[#132A24]/10 shadow-xl max-w-lg w-full overflow-hidden"
      >
        <div className="p-6 border-b border-[#132A24]/10 flex items-center justify-between bg-[#FAFAF8]">
          <div className="flex items-center gap-2.5">
            <Calendar size={18} className="text-[#4E7A66]" />
            <h3 className="font-serif text-lg font-medium text-[#132A24]">
              Schedule Clinical Session
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-[#132A24]/40 hover:text-[#132A24]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSchedule} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#132A24]/70 mb-1">Select Client</label>
            {defaultClientName ? (
              <input
                type="text"
                disabled
                value={defaultClientName}
                className="w-full border border-[#132A24]/15 rounded-lg px-3 py-2 bg-[#FAFAF8] text-[#132A24]"
              />
            ) : (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full border border-[#132A24]/15 rounded-lg px-3 py-2 bg-white text-[#132A24]"
              >
                {clients.map((c) => (
                  <option key={c.clientId} value={c.clientId}>
                    {c.name} ({c.careStage})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#132A24]/70 mb-1">Date</label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full border border-[#132A24]/15 rounded-lg px-3 py-2 bg-white text-[#132A24]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#132A24]/70 mb-1">Time</label>
              <input
                type="time"
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                className="w-full border border-[#132A24]/15 rounded-lg px-3 py-2 bg-white text-[#132A24]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#132A24]/70 mb-1">Duration</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full border border-[#132A24]/15 rounded-lg px-3 py-2 bg-white text-[#132A24]"
              >
                <option value={30}>30 Minutes</option>
                <option value={50}>50 Minutes (Standard)</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#132A24]/70 mb-1">Format</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="w-full border border-[#132A24]/15 rounded-lg px-3 py-2 bg-white text-[#132A24]"
              >
                <option value="video">Online Video</option>
                <option value="audio">Audio Consultation</option>
                <option value="in_person">In-Person</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#132A24]/70 mb-1">Clinical Note / Focus (Optional)</label>
            <textarea
              rows={2}
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="e.g. Follow-up on ACT values clarification exercise..."
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
              {submitting ? 'Checking Conflicts...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
