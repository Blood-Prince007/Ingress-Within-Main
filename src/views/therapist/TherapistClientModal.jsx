import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  User,
  Shield,
  Clock,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  Lock,
  Plus,
  Milestone
} from 'lucide-react';
import TherapistCareJourneyView from './TherapistCareJourneyView';

export default function TherapistClientModal({
  clientId,
  initialTab = 'overview',
  onClose,
  onOpenSchedule,
  onOpenSoap,
  onReloadCaseload,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [stageNotice, setStageNotice] = useState('');

  const fetchClientProfile = async () => {
    try {
      const res = await fetch(`/api/therapist/clients/${clientId}`);
      if (res.ok) {
        const json = await res.json();
        setProfile(json);
      }
    } catch (err) {
      console.error('Failed to load client profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientProfile();
  }, [clientId]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const targetPath = tab === 'journey'
        ? `/therapist/clients/${clientId}/journey`
        : `/therapist/clients/${clientId}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  };

  const handleStageChange = async (newStage) => {
    setUpdatingStage(true);
    setStageNotice('');
    try {
      const res = await fetch(`/api/therapist/clients/${clientId}/journey/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ careStage: newStage }),
      });
      if (res.ok) {
        setStageNotice('Care stage updated.');
        await fetchClientProfile();
        onReloadCaseload && onReloadCaseload();
        setTimeout(() => setStageNotice(''), 3000);
      }
    } catch (err) {
      console.error('Failed to update stage:', err);
    } finally {
      setUpdatingStage(false);
    }
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'journey', label: 'Care Journey', icon: Milestone },
    { id: 'sessions', label: 'Sessions', icon: Calendar },
    { id: 'soap', label: 'SOAP Notes', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border border-[#132A24]/10 shadow-xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Modal Top Bar */}
        <div className="p-6 border-b border-[#132A24]/10 flex items-center justify-between bg-[#FAFAF8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#132A24] text-white flex items-center justify-center font-serif font-bold text-sm">
              {profile?.client?.name ? profile.client.name.charAt(0) : 'C'}
            </div>
            <div>
              <h3 className="font-serif text-xl font-normal text-[#132A24]">
                {profile?.client?.name || 'Client Clinical Record'}
              </h3>
              <span className="text-[11px] text-[#132A24]/50">
                Authorized Clinical Relationship &bull; Caseload Record
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#132A24]/40 hover:text-[#132A24] hover:bg-[#132A24]/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Workspace Tab Navigation */}
        <div className="px-6 border-b border-[#132A24]/10 bg-white flex items-center gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`py-3 px-3.5 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#132A24] text-[#132A24] font-semibold'
                    : 'border-transparent text-[#132A24]/60 hover:text-[#132A24] hover:border-[#132A24]/20'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[#132A24]' : 'text-[#132A24]/50'} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          {activeTab === 'journey' ? (
            <TherapistCareJourneyView
              clientId={clientId}
              onOpenSchedule={onOpenSchedule}
              onOpenSoap={onOpenSoap}
              onReloadCaseload={onReloadCaseload}
            />
          ) : loading ? (
            <div className="p-12 text-center text-xs text-[#132A24]/50 animate-pulse">
              Loading clinical records...
            </div>
          ) : !profile ? (
            <div className="p-8 text-center text-xs text-red-600">
              Unable to load authorized client profile.
            </div>
          ) : activeTab === 'overview' ? (
            <>
              {/* Care Stage Control Banner */}
              <div className="bg-[#FAFAF8] border border-[#132A24]/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#4E7A66]">
                    Current Care Stage
                  </span>
                  <div className="font-serif text-base text-[#132A24] capitalize font-medium">
                    {profile.relationship?.careStage?.replace('_', ' ')}
                  </div>
                  {stageNotice && (
                    <span className="text-[11px] text-[#4E7A66] animate-pulse">{stageNotice}</span>
                  )}
                </div>

                <button
                  onClick={() => handleTabChange('journey')}
                  className="px-3 py-1.5 rounded-lg bg-[#132A24] text-white text-xs font-medium hover:bg-[#132A24]/90 transition-colors cursor-pointer"
                >
                  Manage in Care Journey &rarr;
                </button>
              </div>

              {/* Clinical Intake Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A24]/60">
                  Intake & Presenting Concerns
                </h4>

                <div className="bg-white border border-[#132A24]/10 rounded-xl p-4 space-y-3 text-xs">
                  <div>
                    <span className="font-semibold text-[#132A24] block mb-1">Primary Reason for Therapy:</span>
                    <p className="text-[#132A24]/80 leading-relaxed">
                      {profile.clinicalIntake?.presentingReason || 'Not specified in intake.'}
                    </p>
                  </div>

                  {Array.isArray(profile.clinicalIntake?.concerns) && profile.clinicalIntake.concerns.length > 0 && (
                    <div>
                      <span className="font-semibold text-[#132A24] block mb-1">Identified Concerns:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.clinicalIntake.concerns.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-[#FAFAF8] border border-[#132A24]/10 text-[11px] text-[#132A24]/70">
                            {typeof c === 'string' ? c : c?.label || JSON.stringify(c)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.safetyAssessment && (
                    <div className="pt-2 border-t border-[#132A24]/5 flex items-center justify-between text-[11px]">
                      <span className="text-[#132A24]/60">Safety Evaluation:</span>
                      <span className="font-medium text-[#132A24]">
                        Triage: {profile.safetyAssessment.triageLevel} &bull; Status: {profile.safetyAssessment.safetyStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* PRIVACY BOUNDARY NOTICE */}
              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10 flex gap-3 items-start text-xs text-[#132A24]/70">
                <Lock size={16} className="text-[#4E7A66] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-[#132A24] block">Client Self-Work Privacy Boundary</span>
                  <p className="text-[11px] leading-relaxed">
                    Personal journal entries, reflections, and self-help modules completed by the client are strictly private to the client and are never accessible through this clinical portal.
                  </p>
                </div>
              </div>
            </>
          ) : activeTab === 'sessions' ? (
            /* Sessions List */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A24]/60">
                  Scheduled Consultations
                </h4>
                {profile.relationship?.careStage !== 'completed' && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSchedule && onOpenSchedule(clientId, profile.client.name);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-[#4E7A66] font-semibold hover:underline cursor-pointer"
                  >
                    <Plus size={13} /> Schedule Session
                  </button>
                )}
              </div>

              {profile.appointments.length === 0 ? (
                <p className="text-xs text-[#132A24]/50 italic">No sessions scheduled yet.</p>
              ) : (
                <div className="space-y-2">
                  {profile.appointments.map((appt) => {
                    const apptDate = new Date(appt.scheduled_start).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });
                    const apptTime = new Date(appt.scheduled_start).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={appt.id}
                        className="bg-white border border-[#132A24]/10 rounded-xl p-3.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#132A24]">{apptDate} at {apptTime}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#132A24]/5 uppercase">
                              {appt.status}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#132A24]/50 mt-0.5 block capitalize">
                            Modality: {appt.session_type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* SOAP Notes List */
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A24]/60">
                Clinical SOAP Records
              </h4>

              {profile.appointments.length === 0 ? (
                <p className="text-xs text-[#132A24]/50 italic">No sessions on record to write SOAP notes.</p>
              ) : (
                <div className="space-y-2">
                  {profile.appointments.map((appt) => {
                    const apptDate = new Date(appt.scheduled_start).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });
                    const apptTime = new Date(appt.scheduled_start).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const existingSoap = (profile.soapNotes || []).find((s) => s.appointment_id === appt.id);

                    return (
                      <div
                        key={appt.id}
                        className="bg-white border border-[#132A24]/10 rounded-xl p-3.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#132A24]">{apptDate} at {apptTime}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                existingSoap
                                  ? existingSoap.is_draft
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-emerald-100 text-emerald-900'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {existingSoap ? (existingSoap.is_draft ? 'Draft Note' : 'Finalized Note') : 'No SOAP'}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#132A24]/50 mt-0.5 block">
                            {existingSoap && existingSoap.finalized_at
                              ? `Locked ${new Date(existingSoap.finalized_at).toLocaleDateString('en-IN')}`
                              : 'Session documentation'}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            onClose();
                            onOpenSoap && onOpenSoap(appt.id);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-[#132A24]/15 bg-white text-xs hover:bg-[#132A24]/5 cursor-pointer"
                        >
                          {existingSoap ? (existingSoap.is_draft ? 'Edit Draft' : 'View Note') : 'Write Note'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#132A24]/10 bg-[#FAFAF8] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#132A24] text-white text-xs font-medium hover:bg-[#132A24]/90 cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </motion.div>
    </div>
  );
}
