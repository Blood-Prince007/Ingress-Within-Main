import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Bell, CheckCircle2, Clock, Calendar, Users, Shield } from 'lucide-react';

export default function TherapistNotificationsModal({ onClose, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/therapist/notifications');
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (notifId, link) => {
    try {
      await fetch(`/api/therapist/notifications/${notifId}/read`, { method: 'POST' });
      await fetchNotifications();
      if (link && onNavigate) {
        onClose();
        if (link.includes('clients')) onNavigate('clients');
        else if (link.includes('requests')) onNavigate('requests');
        else if (link.includes('calendar')) onNavigate('calendar');
      }
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border border-[#132A24]/10 shadow-xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="p-5 border-b border-[#132A24]/10 flex items-center justify-between bg-[#FAFAF8]">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-[#4E7A66]" />
            <h3 className="font-serif text-lg font-medium text-[#132A24]">
              Notifications
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-[#132A24]/40 hover:text-[#132A24]">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto divide-y divide-[#132A24]/5 flex-grow text-xs">
          {loading ? (
            <div className="p-8 text-center text-[#132A24]/40 animate-pulse">Loading updates...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-[#132A24]/50">No notifications right now.</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n.id, n.link)}
                className={`p-3.5 hover:bg-[#FAFAF8] transition-colors cursor-pointer rounded-lg ${
                  !n.is_read ? 'bg-[#4E7A66]/5 font-medium' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#132A24] font-semibold">{n.title}</span>
                  <span className="text-[10px] text-[#132A24]/40">
                    {new Date(n.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-[#132A24]/70 leading-relaxed">{n.message}</p>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-[#132A24]/10 bg-[#FAFAF8] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#132A24] text-white text-xs font-medium"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
