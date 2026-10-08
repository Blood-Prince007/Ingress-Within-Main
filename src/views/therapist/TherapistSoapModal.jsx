import React from 'react';
import { motion } from 'framer-motion';
import TherapistSoapNoteView from './TherapistSoapNoteView';

export default function TherapistSoapModal({ appointmentId, sessionId, onClose }) {
  const targetId = sessionId || appointmentId;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white rounded-2xl border border-[#132A24]/10 shadow-xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden"
      >
        <div className="overflow-y-auto p-4 sm:p-6 flex-1">
          <TherapistSoapNoteView
            sessionId={targetId}
            onClose={onClose}
            onBack={onClose}
            isEmbedded={true}
          />
        </div>
      </motion.div>
    </div>
  );
}
