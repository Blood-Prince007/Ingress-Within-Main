import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  User,
  Calendar,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Plus,
  ChevronRight
} from 'lucide-react';
import TherapistClientModal from './TherapistClientModal';

export default function TherapistClientsView({ onOpenSchedule, onOpenSoap }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedClientTab, setSelectedClientTab] = useState('overview');

  const fetchClients = async () => {
    try {
      const res = await fetch(`/api/therapist/clients${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`);
      if (res.ok) {
        const json = await res.json();
        setClients(json.clients || []);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [searchQuery]);

  const getStageColor = (stage) => {
    switch (stage) {
      case 'intake':
        return 'bg-amber-100 text-amber-800';
      case 'active_care':
        return 'bg-emerald-100 text-emerald-800';
      case 'maintenance':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-[#132A24]/5 text-[#132A24]/60';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#132A24]/10 pb-6">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#4E7A66]">
            Clinical Caseload
          </span>
          <h1 className="font-serif text-3xl font-normal text-[#132A24] mt-1">
            My Clients
          </h1>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-3 text-[#132A24]/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#132A24]/15 rounded-lg text-xs outline-hidden focus:border-[#4E7A66] focus:ring-1 focus:ring-[#4E7A66]"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#132A24]/50 animate-pulse">
          Loading clinical caseload...
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white border border-[#132A24]/10 rounded-2xl p-12 text-center space-y-3">
          <Users size={36} className="mx-auto text-[#132A24]/30" />
          <h3 className="font-serif text-xl font-normal text-[#132A24]">No Clients Found</h3>
          <p className="text-xs text-[#132A24]/60 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? 'No client matched your search criteria.'
              : 'You currently have no active clients. Accept client matching requests to build your caseload.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#132A24]/10 rounded-2xl overflow-hidden shadow-xs">
          <div className="divide-y divide-[#132A24]/10">
            {clients.map((c) => {
              const startedDate = new Date(c.startedAt).toLocaleDateString('en-IN', {
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={c.clientId}
                  onClick={() => setSelectedClientId(c.clientId)}
                  className="p-5 flex items-center justify-between hover:bg-[#FAFAF8] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#132A24]/5 border border-[#132A24]/10 flex items-center justify-center text-[#132A24] font-serif font-semibold text-sm">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-base font-medium text-[#132A24]">{c.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${getStageColor(c.careStage)}`}>
                          {c.careStage.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#132A24]/50 mt-0.5 block">
                        Client since {startedDate} &bull; {c.totalSessions} sessions completed
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClientId(c.clientId);
                        setSelectedClientTab('journey');
                      }}
                      className="px-3 py-1.5 rounded-lg border border-[#132A24]/15 bg-white text-xs text-[#132A24] hover:bg-[#132A24]/5 transition-colors cursor-pointer"
                    >
                      Care Journey
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSchedule && onOpenSchedule(c.clientId, c.name);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-[#132A24]/15 bg-white text-xs text-[#132A24] hover:bg-[#132A24]/5 transition-colors cursor-pointer"
                    >
                      Book Session
                    </button>
                    <ChevronRight size={16} className="text-[#132A24]/40" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedClientId && (
        <TherapistClientModal
          clientId={selectedClientId}
          initialTab={selectedClientTab}
          onClose={() => {
            setSelectedClientId(null);
            setSelectedClientTab('overview');
          }}
          onOpenSchedule={onOpenSchedule}
          onOpenSoap={onOpenSoap}
          onReloadCaseload={fetchClients}
        />
      )}
    </div>
  );
}
