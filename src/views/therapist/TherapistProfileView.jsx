import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  ShieldCheck,
  Save,
  Award,
  Globe,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Lock,
  Camera,
  Trash2,
  Clock,
  Calendar,
  Bell,
  Laptop,
  Smartphone,
  LogOut,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  X,
  Building,
  MapPin,
  Mail,
  Phone,
  Info,
  Check,
  AlertTriangle,
  FileText,
  Sliders,
  Sparkles,
} from 'lucide-react';
import TherapistCalendarIntegrationCard from '../../components/therapist/TherapistCalendarIntegrationCard';

const TIMEZONE_OPTIONS = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
];

const PREDEFINED_SPECIALTIES = [
  'Cognitive Behavioral Therapy (CBT)',
  'Acceptance & Commitment Therapy (ACT)',
  'Anxiety & Panic Disorders',
  'Depression & Mood Disorders',
  'Trauma & PTSD',
  'Somatic Grounding',
  'Mindfulness & Stress Management',
  'Relationship & Family Therapy',
  'Workplace Burnout',
  'ADHD & Neurodivergence',
  'Grief & Bereavement',
];

const PREDEFINED_LANGUAGES = [
  'English',
  'Hindi',
  'Bengali',
  'Marathi',
  'Telugu',
  'Tamil',
  'Gujarati',
  'Kannada',
  'Malayalam',
  'Punjabi',
];

export default function TherapistProfileView({ onNavigateTab, onLogout }) {
  // Navigation / Active Section
  const [activeSection, setActiveSection] = useState('personal'); // 'personal' | 'practice' | 'integrations' | 'financial' | 'notifications' | 'security' | 'account'

  // Server Data
  const [account, setAccount] = useState(null);
  const [profile, setProfile] = useState(null);
  const [summaryStats, setSummaryStats] = useState(null);
  const [payoutAccounts, setPayoutAccounts] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Loading & Feedback
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modals
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [deactivationReadiness, setDeactivationReadiness] = useState(null);
  const [deactivationLoading, setDeactivationLoading] = useState(false);
  const [deactivationSubmitting, setDeactivationSubmitting] = useState(false);
  const [deactivationFeedback, setDeactivationFeedback] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    contactEmail: '',
    title: '',
    bio: '',
    qualification: '',
    experienceYears: 0,
    specializations: [],
    languages: [],
    sessionFormats: ['telehealth'],
    practiceName: '',
    practiceAddress: '',
    city: '',
    state: '',
    timezone: 'Asia/Kolkata',
    notificationPreferences: {
      email_appointment_reminders: true,
      email_booking_notifications: true,
      email_cancellation_alerts: true,
      email_homework_submissions: true,
      in_app_session_alerts: true,
      security_alerts: true,
    },
  });

  const [initialFormData, setInitialFormData] = useState(null);

  // Fetch Full Profile Hub Data
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const [profileRes, payoutsRes] = await Promise.all([
        fetch('/api/therapist/profile'),
        fetch('/api/therapist/payouts/accounts').catch(() => null),
      ]);

      if (profileRes.ok) {
        const json = await profileRes.json();
        setAccount(json.account);
        setProfile(json.profile);
        setSummaryStats(json.summary || null);

        const initial = {
          fullName: json.profile?.full_name || '',
          contactEmail: json.profile?.contact_email || '',
          title: json.profile?.title || 'Consultant Psychologist',
          bio: json.profile?.bio || '',
          qualification: json.profile?.qualification || '',
          experienceYears: json.profile?.experience_years ?? 0,
          specializations: Array.isArray(json.profile?.specializations) ? json.profile.specializations : [],
          languages: Array.isArray(json.profile?.languages) ? json.profile.languages : ['English', 'Hindi'],
          sessionFormats: (() => {
            const raw = Array.isArray(json.profile?.session_formats) ? json.profile.session_formats : ['telehealth'];
            const norm = Array.from(
              new Set(
                raw.flatMap((f) => {
                  const s = String(f || '').trim().toLowerCase().replace(/-/g, '_');
                  if (s === 'either' || s === 'both') return ['telehealth', 'in_person'];
                  if (s === 'telehealth' || s === 'in_person') return [s];
                  return [];
                })
              )
            );
            return norm.length > 0 ? norm : ['telehealth'];
          })(),
          practiceName: json.profile?.practice_name || '',
          practiceAddress: json.profile?.practice_address || '',
          city: json.profile?.city || '',
          state: json.profile?.state || '',
          timezone: json.profile?.timezone || 'Asia/Kolkata',
          notificationPreferences: json.profile?.notification_preferences || {
            email_appointment_reminders: true,
            email_booking_notifications: true,
            email_cancellation_alerts: true,
            email_homework_submissions: true,
            in_app_session_alerts: true,
            security_alerts: true,
          },
        };

        setFormData(initial);
        setInitialFormData(initial);
      } else {
        const errJson = await profileRes.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to load profile.');
      }

      if (payoutsRes && payoutsRes.ok) {
        const pJson = await payoutsRes.json();
        setPayoutAccounts(pJson.accounts || []);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const res = await fetch('/api/therapist/auth/sessions');
      if (res.ok) {
        const json = await res.json();
        setActiveSessions(json.sessions || []);
      }
    } catch (err) {
      console.error('Sessions fetch error:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (activeSection === 'security') {
      fetchSessions();
    }
  }, [activeSection]);

  // Dirty State Detection
  const isDirty = useMemo(() => {
    if (!initialFormData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  }, [formData, initialFormData]);

  // Profile Completeness Calculation (Strict real fields, no arbitrary percentages)
  const completeness = useMemo(() => {
    const fields = [
      { key: 'fullName', label: 'Full Name', valid: Boolean(formData.fullName?.trim()) },
      { key: 'contactEmail', label: 'Contact Email', valid: Boolean(formData.contactEmail?.trim()) },
      { key: 'title', label: 'Clinical Title', valid: Boolean(formData.title?.trim()) },
      { key: 'bio', label: 'Professional Bio', valid: Boolean(formData.bio?.trim()) },
      { key: 'qualification', label: 'Qualification', valid: Boolean(formData.qualification?.trim()) },
      { key: 'experienceYears', label: 'Experience Years', valid: Number(formData.experienceYears) > 0 },
      { key: 'city', label: 'City', valid: Boolean(formData.city?.trim()) },
      { key: 'state', label: 'State', valid: Boolean(formData.state?.trim()) },
      { key: 'specializations', label: 'Specialties', valid: formData.specializations?.length > 0 },
      { key: 'languages', label: 'Languages', valid: formData.languages?.length > 0 },
      { key: 'photo', label: 'Profile Photo', valid: Boolean(profile?.profile_image_url) },
    ];

    const completed = fields.filter((f) => f.valid).length;
    const total = fields.length;
    const percentage = Math.round((completed / total) * 100);
    const missing = fields.filter((f) => !f.valid).map((f) => f.label);

    return { completed, total, percentage, missing };
  }, [formData, profile]);

  // Handle Save
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveNotice('');
    setErrorMessage('');

    try {
      const cleanFormats = Array.from(
        new Set(
          (Array.isArray(formData.sessionFormats) ? formData.sessionFormats : ['telehealth']).flatMap((f) => {
            const s = String(f || '').trim().toLowerCase().replace(/-/g, '_');
            if (s === 'either' || s === 'both') return ['telehealth', 'in_person'];
            if (s === 'telehealth' || s === 'in_person') return [s];
            return [];
          })
        )
      );
      const finalFormats = cleanFormats.length > 0 ? cleanFormats : ['telehealth'];

      const res = await fetch('/api/therapist/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.fullName.trim(),
          contact_email: formData.contactEmail ? formData.contactEmail.trim().toLowerCase() : null,
          title: formData.title.trim(),
          bio: formData.bio.trim(),
          qualification: formData.qualification.trim(),
          experience_years: Number(formData.experienceYears),
          specializations: formData.specializations,
          languages: formData.languages,
          session_formats: finalFormats,
          practice_name: formData.practiceName.trim(),
          practice_address: formData.practiceAddress.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          timezone: formData.timezone,
          notification_preferences: formData.notificationPreferences,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to update profile.');
      }

      setProfile(data.profile);
      const syncedForm = { ...formData, sessionFormats: finalFormats };
      setFormData(syncedForm);
      setInitialFormData(syncedForm);
      setSaveNotice('Profile updated successfully.');
      setTimeout(() => setSaveNotice(''), 3500);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (initialFormData) {
      setFormData({ ...initialFormData });
      setErrorMessage('');
    }
  };

  // Photo Upload Handler
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Only JPEG, PNG, or WebP images are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size must be under 5 MB.');
      return;
    }

    setPhotoError('');
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return;
    setPhotoUploading(true);
    setPhotoError('');

    try {
      const data = new FormData();
      data.append('file', photoFile);

      const res = await fetch('/api/therapist/profile/photo', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to upload photo.');
      }

      setProfile((prev) => ({ ...prev, profile_image_url: json.profile_image_url }));
      setIsPhotoModalOpen(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      setSaveNotice('Profile photo updated.');
      setTimeout(() => setSaveNotice(''), 3000);
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Remove profile photo? Your profile will display your monogram avatar.')) return;
    setPhotoUploading(true);

    try {
      const res = await fetch('/api/therapist/profile/photo', { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to remove photo.');
      }

      setProfile((prev) => ({ ...prev, profile_image_url: null }));
      setIsPhotoModalOpen(false);
      setSaveNotice('Profile photo removed.');
      setTimeout(() => setSaveNotice(''), 3000);
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  // Revoke Sessions Handler
  const handleRevokeSession = async (deviceId) => {
    try {
      const res = await fetch('/api/therapist/auth/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      if (res.ok) {
        fetchSessions();
      }
    } catch (err) {
      console.error('Revoke session error:', err);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    if (!window.confirm('Sign out of all other active browser and mobile sessions?')) return;
    try {
      const res = await fetch('/api/therapist/auth/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revokeAllOther: true }),
      });
      if (res.ok) {
        fetchSessions();
        setSaveNotice('Signed out of other sessions.');
        setTimeout(() => setSaveNotice(''), 3000);
      }
    } catch (err) {
      console.error('Revoke all other sessions error:', err);
    }
  };

  // Deactivation Check Handler
  const handleOpenDeactivateModal = async () => {
    setIsDeactivateModalOpen(true);
    setDeactivationFeedback(null);
    setDeactivationLoading(true);

    try {
      const res = await fetch('/api/therapist/profile/deactivate');
      if (res.ok) {
        const json = await res.json();
        setDeactivationReadiness(json.readiness);
      }
    } catch (err) {
      console.error('Deactivation readiness check error:', err);
    } finally {
      setDeactivationLoading(false);
    }
  };

  const handleRequestDeactivation = async () => {
    setDeactivationSubmitting(true);
    try {
      const res = await fetch('/api/therapist/profile/deactivate', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Deactivation request could not be processed.');
      }
      setDeactivationFeedback(json.message);
    } catch (err) {
      setDeactivationFeedback(err.message);
    } finally {
      setDeactivationSubmitting(false);
    }
  };

  // Helper toggle for array fields
  const toggleArrayItem = (key, item) => {
    setFormData((prev) => {
      const current = prev[key] || [];
      if (key === 'sessionFormats' && current.includes(item) && current.length <= 1) {
        return prev;
      }
      const updated = current.includes(item) ? current.filter((x) => x !== item) : [...current, item];
      return { ...prev, [key]: updated };
    });
  };

  // Helper toggle for notification preferences
  const toggleNotification = (key) => {
    if (key === 'security_alerts') return; // Cannot turn off security alerts
    setFormData((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: !prev.notificationPreferences?.[key],
      },
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl animate-pulse">
        <div className="h-44 bg-white border border-[#132A24]/10 rounded-2xl p-6" />
        <div className="h-96 bg-white border border-[#132A24]/10 rounded-2xl p-6" />
      </div>
    );
  }

  const defaultPayout = payoutAccounts.find((a) => a.is_default) || payoutAccounts[0];

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & HERO SUMMARY CARD                                         */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#132A24]/10 pb-5">
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#4E7A66]">
              Practitioner Center
            </span>
            <h1 className="font-serif text-3xl font-normal text-[#132A24] mt-0.5">
              My Profile & Practice Settings
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {saveNotice && (
              <span className="text-xs text-[#4E7A66] font-semibold flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 size={14} /> {saveNotice}
              </span>
            )}
            {isDirty && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#132A24] text-white text-xs font-semibold hover:bg-[#132A24]/90 transition-all cursor-pointer shadow-xs"
              >
                <Save size={13} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage('')} className="text-red-600 hover:text-red-900 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Hero Card */}
        <div className="bg-white border border-[#132A24]/10 rounded-2xl p-6 lg:p-7 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar with Photo Upload Trigger */}
              <div className="relative group shrink-0">
                {profile?.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt={formData.fullName}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-sm ring-1 ring-[#132A24]/10"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[#132A24] text-white flex items-center justify-center font-serif text-2xl font-bold shadow-sm">
                    {formData.fullName ? formData.fullName.charAt(0) : 'T'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  title="Update profile photo"
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-white border border-[#132A24]/15 shadow-xs flex items-center justify-center text-[#132A24] hover:bg-[#FAFAF8] cursor-pointer transition-all"
                >
                  <Camera size={13} />
                </button>
              </div>

              {/* Identity & Badges */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif text-2xl font-medium text-[#132A24]">
                    {formData.fullName || 'Verified Practitioner'}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#4E7A66]/10 text-[#4E7A66] text-[10px] font-bold uppercase tracking-wider">
                    <ShieldCheck size={12} /> {account?.verification_status || 'Verified'}
                  </span>
                  {account?.rci_registered && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold">
                      <Award size={11} /> RCI: {account.rci_number || 'Registered'}
                    </span>
                  )}
                </div>

                <p className="text-xs font-medium text-[#132A24]/75">
                  {formData.title} &bull; {formData.qualification || 'Licensed Practitioner'}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#132A24]/60 pt-0.5">
                  {(formData.city || formData.state) && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-[#4E7A66]" />
                      {[formData.city, formData.state].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {formData.experienceYears > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-[#4E7A66]" />
                      {formData.experienceYears} Years Experience
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-[#4E7A66]" />
                    {account?.phone_number}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail size={12} className="text-[#4E7A66]" />
                    {formData.contactEmail || 'No contact email set'}
                  </span>
                </div>

                {formData.specializations?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {formData.specializations.slice(0, 4).map((spec) => (
                      <span
                        key={spec}
                        className="px-2.5 py-0.5 rounded-md bg-[#FAFAF8] border border-[#132A24]/10 text-[#132A24]/70 text-[11px]"
                      >
                        {spec}
                      </span>
                    ))}
                    {formData.specializations.length > 4 && (
                      <span className="px-2 py-0.5 text-[11px] text-[#132A24]/50">
                        +{formData.specializations.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Completeness Badge */}
            <div className="bg-[#FAFAF8] border border-[#132A24]/10 rounded-xl p-4 min-w-[210px] space-y-2 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#132A24]">Profile Completeness</span>
                <span className="font-bold text-[#4E7A66]">{completeness.percentage}%</span>
              </div>
              <div className="w-full bg-[#132A24]/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#4E7A66] h-full rounded-full transition-all duration-500"
                  style={{ width: `${completeness.percentage}%` }}
                />
              </div>
              {completeness.missing.length > 0 ? (
                <p className="text-[10px] text-[#132A24]/55 leading-tight">
                  Missing: {completeness.missing.slice(0, 2).join(', ')}
                  {completeness.missing.length > 2 && ` +${completeness.missing.length - 2} more`}
                </p>
              ) : (
                <p className="text-[10px] text-[#4E7A66] font-medium flex items-center gap-1">
                  <CheckCircle2 size={11} /> All clinical profile fields complete
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-NAVIGATION TABS                                                     */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1 border-b border-[#132A24]/10 overflow-x-auto pb-px">
        {[
          { id: 'personal', label: 'Personal & Professional', icon: User },
          { id: 'practice', label: 'Practice & Sessions', icon: Sliders },
          { id: 'integrations', label: 'Google Calendar & Meet', icon: Calendar },
          { id: 'financial', label: 'Earnings & Payouts', icon: DollarSign },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'security', label: 'Security & Sessions', icon: Lock },
          { id: 'account', label: 'Account & Practice Status', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-[#4E7A66] text-[#132A24] bg-white shadow-2xs'
                  : 'border-transparent text-[#132A24]/60 hover:text-[#132A24] hover:bg-[#FAFAF8]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-[#4E7A66]' : 'text-[#132A24]/40'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB 1: PERSONAL & PROFESSIONAL INFORMATION                             */}
      {/* ========================================================================= */}
      {activeSection === 'personal' && (
        <form onSubmit={handleSave} className="bg-white border border-[#132A24]/10 rounded-2xl p-6 lg:p-8 shadow-xs space-y-7">
          <div className="border-b border-[#132A24]/10 pb-4">
            <h3 className="font-serif text-lg font-medium text-[#132A24]">
              Personal & Professional Identity
            </h3>
            <p className="text-xs text-[#132A24]/60 mt-0.5">
              Manage your clinical bio, qualifications, and specialties shown to prospective clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-semibold text-[#132A24] mb-1.5">
                Full Professional Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full border border-[#132A24]/15 rounded-xl px-3.5 py-2.5 outline-hidden focus:border-[#4E7A66]"
                placeholder="Dr. Jane Doe"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#132A24] mb-1.5">
                Clinical Title / Designation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-[#132A24]/15 rounded-xl px-3.5 py-2.5 outline-hidden focus:border-[#4E7A66]"
                placeholder="Consultant Clinical Psychologist"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-semibold text-[#132A24] mb-1.5">
                Professional Contact Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full border border-[#132A24]/15 rounded-xl px-3.5 py-2.5 outline-hidden focus:border-[#4E7A66]"
                placeholder="doctor@example.com"
                required
              />
              <p className="text-[11px] text-[#132A24]/50 mt-1">
                Used for client match requests, client acceptance confirmations, and session alerts.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-[#132A24] mb-1.5">
                Highest Professional Qualification
              </label>
              <input
                type="text"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                className="w-full border border-[#132A24]/15 rounded-xl px-3.5 py-2.5 outline-hidden focus:border-[#4E7A66]"
                placeholder="M.Phil / Ph.D. in Clinical Psychology"
              />
            </div>
          </div>

          <div className="text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-[#132A24]">
                Professional Bio & Therapeutic Approach
              </label>
              <span className="text-[11px] text-[#132A24]/40">
                {formData.bio.length} / 3000 chars
              </span>
            </div>
            <textarea
              rows={5}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full border border-[#132A24]/15 rounded-xl p-3.5 outline-hidden focus:border-[#4E7A66] leading-relaxed"
              placeholder="Describe your therapeutic modality, clinical philosophy, and clinical focus areas..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-semibold text-[#132A24] mb-1.5">
                Years of Post-Qualification Experience
              </label>
              <input
                type="number"
                min="0"
                max="70"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                className="w-full border border-[#132A24]/15 rounded-xl px-3.5 py-2.5 outline-hidden focus:border-[#4E7A66]"
              />
            </div>
          </div>

          {/* Specialties Multi-Select */}
          <div className="space-y-2 text-xs">
            <label className="block font-semibold text-[#132A24]">
              Clinical Specialties & Modalities
            </label>
            <p className="text-[11px] text-[#132A24]/55">
              Select key therapeutic approaches clients can filter by when matching.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {PREDEFINED_SPECIALTIES.map((spec) => {
                const isSelected = formData.specializations.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleArrayItem('specializations', spec)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#132A24] text-white border-[#132A24]'
                        : 'bg-[#FAFAF8] text-[#132A24]/75 border-[#132A24]/15 hover:border-[#132A24]/30'
                    }`}
                  >
                    {isSelected && <Check size={12} className="inline mr-1 -mt-0.5" />}
                    {spec}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Languages Multi-Select */}
          <div className="space-y-2 text-xs">
            <label className="block font-semibold text-[#132A24]">
              Languages for Consultation
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {PREDEFINED_LANGUAGES.map((lang) => {
                const isSelected = formData.languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleArrayItem('languages', lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#4E7A66] text-white border-[#4E7A66]'
                        : 'bg-[#FAFAF8] text-[#132A24]/75 border-[#132A24]/15 hover:border-[#132A24]/30'
                    }`}
                  >
                    {isSelected && <Check size={12} className="inline mr-1 -mt-0.5" />}
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Practice Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs pt-2 border-t border-[#132A24]/10">
            <div>
              <label className="block font-semibold text-[#132A24] mb-1.5">Practice / Clinic Name</label>
              <input
                type="text"
                value={formData.practiceName}
                onChange={(e) => setFormData({ ...formData, practiceName: e.target.value })}
                className="w-full border border-[#132A24]/15 rounded-xl px-3.5 py-2.5 outline-hidden focus:border-[#4E7A66]"
                placeholder="Ingress Wellness Suite / Private Clinic"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#132A24] mb-1.5">Consultation Address</label>
              <input
                type="text"
                value={formData.practiceAddress}
                onChange={(e) => setFormData({ ...formData, practiceAddress: e.target.value })}
                className="w-full border border-[#132A24]/15 rounded-xl px-3.5 py-2.5 outline-hidden focus:border-[#4E7A66]"
                placeholder="Suite 402, Lotus Business Park, Bandra West"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#132A24] mb-1.5">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full border border-[#132A24]/15 rounded-xl px-3.5 py-2.5 outline-hidden focus:border-[#4E7A66]"
                placeholder="Mumbai"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#132A24] mb-1.5">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full border border-[#132A24]/15 rounded-xl px-3.5 py-2.5 outline-hidden focus:border-[#4E7A66]"
                placeholder="Maharashtra"
              />
            </div>
          </div>

          {/* Governance Notice */}
          <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10 flex items-start gap-3">
            <Lock size={15} className="shrink-0 text-[#4E7A66] mt-0.5" />
            <div className="text-[11px] text-[#132A24]/65 leading-relaxed">
              <strong>Clinical Governance Safeguard:</strong> Practice authorization, RCI registration details, and client fee agreements are maintained by the Ingress Within Clinical Operations Board. Contact operations if you require updates to registered credentials.
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#132A24]/10">
            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-[#132A24]/60 hover:text-[#132A24] cursor-pointer"
              >
                Reset Changes
              </button>
            )}
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#132A24] text-white text-xs font-semibold hover:bg-[#132A24]/90 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB 2: PRACTICE & SESSION PREFERENCES                                  */}
      {/* ========================================================================= */}
      {activeSection === 'practice' && (
        <form onSubmit={handleSave} className="bg-white border border-[#132A24]/10 rounded-2xl p-6 lg:p-8 shadow-xs space-y-7">
          <div className="border-b border-[#132A24]/10 pb-4">
            <h3 className="font-serif text-lg font-medium text-[#132A24]">
              Session & Practice Preferences
            </h3>
            <p className="text-xs text-[#132A24]/60 mt-0.5">
              Manage consultation delivery modes, timezone configuration, and weekly clinical hours.
            </p>
          </div>

          {/* Consultation Formats */}
          <div className="space-y-3 text-xs">
            <label className="block font-semibold text-[#132A24]">Consultation Delivery Modes</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => toggleArrayItem('sessionFormats', 'telehealth')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.sessionFormats.includes('telehealth')
                    ? 'border-[#4E7A66] bg-[#4E7A66]/5'
                    : 'border-[#132A24]/10 bg-[#FAFAF8]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#132A24]">Telehealth (Video & Audio)</span>
                  <input
                    type="checkbox"
                    checked={formData.sessionFormats.includes('telehealth')}
                    onChange={() => {}}
                    className="accent-[#4E7A66]"
                  />
                </div>
                <p className="text-[11px] text-[#132A24]/60 mt-1">
                  1-on-1 private video sessions via encrypted Google Meet integration.
                </p>
              </div>

              <div
                onClick={() => toggleArrayItem('sessionFormats', 'in_person')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.sessionFormats.includes('in_person')
                    ? 'border-[#4E7A66] bg-[#4E7A66]/5'
                    : 'border-[#132A24]/10 bg-[#FAFAF8]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#132A24]">In-Person Consultations</span>
                  <input
                    type="checkbox"
                    checked={formData.sessionFormats.includes('in_person')}
                    onChange={() => {}}
                    className="accent-[#4E7A66]"
                  />
                </div>
                <p className="text-[11px] text-[#132A24]/60 mt-1">
                  In-clinic sessions at your registered physical practice address.
                </p>
              </div>
            </div>
          </div>

          {/* Canonical Timezone */}
          <div className="text-xs space-y-1.5 max-w-md">
            <label className="block font-semibold text-[#132A24]">
              Canonical Practice Timezone <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full border border-[#132A24]/15 rounded-xl px-3.5 py-2.5 outline-hidden focus:border-[#4E7A66] bg-white"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#132A24]/55">
              All client bookings, session alerts, and Google Calendar syncs use this timezone.
            </p>
          </div>

          {/* Financial Breakdown Summary */}
          <div className="p-5 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#132A24]">Standard Session Financial Breakdown</span>
              <span className="text-[10px] text-[#4E7A66] font-bold uppercase tracking-wider">Governed Rate</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-[#132A24]/10">
                <span className="text-[10px] text-[#132A24]/50 block">Standard Fee (Gross)</span>
                <span className="font-serif text-base font-semibold text-[#132A24]">
                  ₹{Number(account?.per_session_fee || 1500).toFixed(2)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#132A24]/10">
                <span className="text-[10px] text-[#132A24]/50 block">Platform Commission ({account?.commission_rate || 15}%)</span>
                <span className="font-serif text-base font-semibold text-amber-900">
                  ₹{((Number(account?.per_session_fee || 1500) * Number(account?.commission_rate || 15)) / 100).toFixed(2)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#132A24]/10">
                <span className="text-[10px] text-[#4E7A66] font-semibold block">Therapist Net Payout</span>
                <span className="font-serif text-base font-semibold text-[#4E7A66]">
                  ₹{(Number(account?.per_session_fee || 1500) * (1 - Number(account?.commission_rate || 15) / 100)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Availability Overview Card */}
          <div className="p-5 rounded-xl border border-[#132A24]/10 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-xs text-[#132A24]">Clinical Working Hours & Calendar Slots</h4>
                <p className="text-[11px] text-[#132A24]/60">
                  Manage weekly booking hours and slot intervals directly on your interactive calendar.
                </p>
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('calendar')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#132A24] text-white text-xs font-medium hover:bg-[#132A24]/90 cursor-pointer"
                >
                  <Calendar size={13} /> Manage Availability <ChevronRight size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#132A24] text-white text-xs font-semibold hover:bg-[#132A24]/90 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 3: GOOGLE CALENDAR & MEET INTEGRATION                               */}
      {/* ========================================================================= */}
      {activeSection === 'integrations' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#132A24]/10 rounded-2xl p-6 lg:p-8 shadow-xs space-y-5">
            <div>
              <h3 className="font-serif text-lg font-medium text-[#132A24]">
                Google Calendar & Google Meet Integration
              </h3>
              <p className="text-xs text-[#132A24]/60 mt-0.5">
                Automatically synchronize confirmed appointments with your external Google Calendar and generate instant Google Meet links for telehealth sessions.
              </p>
            </div>

            <TherapistCalendarIntegrationCard />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 4: EARNINGS & PAYOUTS HUB                                          */}
      {/* ========================================================================= */}
      {activeSection === 'financial' && (
        <div className="bg-white border border-[#132A24]/10 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#132A24]/10 pb-4">
            <div>
              <h3 className="font-serif text-lg font-medium text-[#132A24]">
                Earnings & Secure Payout Destinations
              </h3>
              <p className="text-xs text-[#132A24]/60 mt-0.5">
                Review available funds and verified bank or UPI withdrawal destinations.
              </p>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('earnings')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#132A24] text-white text-xs font-semibold hover:bg-[#132A24]/90 cursor-pointer"
              >
                <DollarSign size={14} /> View Full Earnings & Withdraw <ChevronRight size={13} />
              </button>
            )}
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10 space-y-1">
              <span className="text-[11px] text-[#132A24]/60 font-medium">Available to Withdraw</span>
              <div className="font-serif text-3xl font-medium text-[#4E7A66]">
                ₹{Number(summaryStats?.availableBalance || 0).toFixed(2)}
              </div>
              <p className="text-[10px] text-[#132A24]/50">
                Collected from completed & client no-show sessions.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10 space-y-2">
              <span className="text-[11px] text-[#132A24]/60 font-medium">Default Payout Destination</span>
              {defaultPayout ? (
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="font-medium text-xs text-[#132A24]">
                      {defaultPayout.beneficiary_name}
                    </div>
                    <div className="text-xs text-[#132A24]/60">
                      {defaultPayout.account_type === 'bank' ? defaultPayout.bank_name || 'Bank Account' : 'UPI ID'}:{' '}
                      <span className="font-mono">{defaultPayout.masked_identifier}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#4E7A66]/10 text-[#4E7A66] text-[10px] font-bold uppercase">
                    Verified
                  </span>
                </div>
              ) : (
                <div className="text-xs text-amber-800 pt-1">
                  No verified payout account linked yet. Link a bank account or UPI ID in the Earnings tab.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 5: NOTIFICATION PREFERENCES                                        */}
      {/* ========================================================================= */}
      {activeSection === 'notifications' && (
        <form onSubmit={handleSave} className="bg-white border border-[#132A24]/10 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#132A24]/10 pb-4">
            <h3 className="font-serif text-lg font-medium text-[#132A24]">
              Communication & Alert Preferences
            </h3>
            <p className="text-xs text-[#132A24]/60 mt-0.5">
              Control email alerts and in-app notifications for clinical workflow milestones.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                key: 'email_appointment_reminders',
                title: 'Appointment Reminders',
                desc: 'Email alerts 24 hours and 1 hour before scheduled therapy sessions.',
              },
              {
                key: 'email_booking_notifications',
                title: 'New Booking Alerts',
                desc: 'Immediate notifications when a client completes intake and books a session.',
              },
              {
                key: 'email_cancellation_alerts',
                title: 'Cancellation & Reschedule Notices',
                desc: 'Prompt notification when an appointment is modified or cancelled.',
              },
              {
                key: 'email_homework_submissions',
                title: 'Homework & Clinical Journal Submissions',
                desc: 'Alerts when assigned client reflection exercises are submitted for review.',
              },
              {
                key: 'in_app_session_alerts',
                title: 'In-App Clinical Alerts',
                desc: 'Interactive banner reminders inside your practitioner workspace.',
              },
              {
                key: 'security_alerts',
                title: 'Account Security Alerts',
                desc: 'Critical security notifications (login from new device, session revocation). Cannot be disabled.',
                locked: true,
              },
            ].map((pref) => {
              const isChecked = Boolean(formData.notificationPreferences?.[pref.key]);
              return (
                <div
                  key={pref.key}
                  onClick={() => !pref.locked && toggleNotification(pref.key)}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    pref.locked
                      ? 'border-[#132A24]/10 bg-[#FAFAF8] opacity-80 cursor-not-allowed'
                      : 'border-[#132A24]/10 bg-white hover:border-[#132A24]/20 cursor-pointer'
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <div className="font-semibold text-xs text-[#132A24] flex items-center gap-2">
                      <span>{pref.title}</span>
                      {pref.locked && <Lock size={12} className="text-[#132A24]/40" />}
                    </div>
                    <p className="text-[11px] text-[#132A24]/60">{pref.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={pref.locked}
                    onChange={() => {}}
                    className="accent-[#4E7A66] shrink-0"
                  />
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#132A24] text-white text-xs font-semibold hover:bg-[#132A24]/90 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save Notification Preferences'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 8. TAB 6: SECURITY & ACTIVE SESSIONS                                      */}
      {/* ========================================================================= */}
      {activeSection === 'security' && (
        <div className="bg-white border border-[#132A24]/10 rounded-2xl p-6 lg:p-8 shadow-xs space-y-7">
          <div className="border-b border-[#132A24]/10 pb-4">
            <h3 className="font-serif text-lg font-medium text-[#132A24]">
              Security & Active Device Sessions
            </h3>
            <p className="text-xs text-[#132A24]/60 mt-0.5">
              Review active browser sessions and manage device security.
            </p>
          </div>

          {/* Auth Identity Card */}
          <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-[#132A24]/50 font-bold uppercase tracking-wider">
                Primary Authentication & Contact
              </span>
              <div className="font-semibold text-[#132A24] flex items-center gap-2">
                <Phone size={14} className="text-[#4E7A66]" />
                <span>Verified Phone OTP: {account?.phone_number}</span>
              </div>
              <div className="text-xs text-[#132A24]/75 flex items-center gap-2">
                <Mail size={13} className="text-[#4E7A66]" />
                <span>Contact Email: {formData.contactEmail || 'Not configured'}</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#4E7A66]/10 text-[#4E7A66] text-xs font-semibold self-start sm:self-auto">
              <ShieldCheck size={13} /> Secure Verified
            </span>
          </div>

          {/* Active Sessions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#132A24]">Active Device Sessions</span>
              {activeSessions.length > 1 && (
                <button
                  type="button"
                  onClick={handleRevokeAllOtherSessions}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                >
                  Sign Out Other Sessions
                </button>
              )}
            </div>

            {sessionsLoading ? (
              <div className="p-8 text-center text-xs text-[#132A24]/40 animate-pulse">
                Loading session activity...
              </div>
            ) : activeSessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#132A24]/50 bg-[#FAFAF8] rounded-xl border border-[#132A24]/10">
                No external active sessions detected.
              </div>
            ) : (
              <div className="divide-y divide-[#132A24]/10 border border-[#132A24]/10 rounded-xl overflow-hidden">
                {activeSessions.map((sess) => (
                  <div key={sess.id} className="p-4 bg-white flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#4E7A66]/10 text-[#4E7A66] flex items-center justify-center shrink-0">
                        {sess.deviceName?.toLowerCase().includes('mobile') || sess.userAgent?.includes('Mobile') ? (
                          <Smartphone size={17} />
                        ) : (
                          <Laptop size={17} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#132A24]">{sess.deviceName}</span>
                          {sess.isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-[#4E7A66]/15 text-[#4E7A66] text-[10px] font-bold">
                              Current Device
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#132A24]/55 mt-0.5">
                          IP: {sess.ipAddress} &bull; Last active:{' '}
                          {new Date(sess.lastActiveAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                    </div>

                    {!sess.isCurrent && (
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(sess.deviceId)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium px-2.5 py-1 rounded-md hover:bg-red-50 cursor-pointer"
                      >
                        Sign Out
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. TAB 7: ACCOUNT STATUS & DEACTIVATION                                   */}
      {/* ========================================================================= */}
      {activeSection === 'account' && (
        <div className="bg-white border border-[#132A24]/10 rounded-2xl p-6 lg:p-8 shadow-xs space-y-7">
          <div className="border-b border-[#132A24]/10 pb-4">
            <h3 className="font-serif text-lg font-medium text-[#132A24]">
              Account Lifecycle & Practice Status
            </h3>
            <p className="text-xs text-[#132A24]/60 mt-0.5">
              Review platform practice authorization, membership dates, and offboarding workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10 space-y-1">
              <span className="text-[10px] text-[#132A24]/50 font-bold uppercase tracking-wider">
                Practice Authorization
              </span>
              <div className="font-semibold text-sm text-[#132A24] flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#4E7A66]" />
                <span>Authorized to Practice ({account?.application_status})</span>
              </div>
              <p className="text-[11px] text-[#132A24]/60">
                Can accept new clients and conduct telehealth/in-person sessions.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10 space-y-1">
              <span className="text-[10px] text-[#132A24]/50 font-bold uppercase tracking-wider">
                Member Since
              </span>
              <div className="font-semibold text-sm text-[#132A24]">
                {account?.created_at ? new Date(account.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' }) : 'Verified Practitioner'}
              </div>
              <p className="text-[11px] text-[#132A24]/60">
                Practitioner ID: <span className="font-mono">{account?.id?.slice(0, 13)}...</span>
              </p>
            </div>
          </div>

          {/* Offboarding / Deactivation Section */}
          <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm text-amber-950">
              <AlertTriangle size={17} className="text-amber-700" />
              <span>Practice Offboarding & Deactivation</span>
            </div>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              As a healthcare platform, Ingress Within strictly safeguards client care continuity. Account closure requires that all active care relationships are completed or transitioned, scheduled appointments concluded, and earnings disbursed.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenDeactivateModal}
                className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-amber-900 hover:bg-amber-100/50 cursor-pointer shadow-2xs"
              >
                Check Deactivation Readiness
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHOTO UPLOAD MODAL                                                        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isPhotoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#132A24]/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#132A24]/10 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#132A24]/10 pb-3">
                <h3 className="font-serif text-lg font-medium text-[#132A24]">
                  Update Profile Photo
                </h3>
                <button
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="text-[#132A24]/40 hover:text-[#132A24] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {photoError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-800 text-xs border border-red-200">
                  {photoError}
                </div>
              )}

              <div className="flex flex-col items-center justify-center space-y-4 py-2">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-28 h-28 rounded-2xl object-cover border-2 border-[#4E7A66] shadow-sm"
                  />
                ) : profile?.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt="Current"
                    className="w-28 h-28 rounded-2xl object-cover border border-[#132A24]/10 shadow-sm"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-[#132A24] text-white flex items-center justify-center font-serif text-3xl font-bold">
                    {formData.fullName ? formData.fullName.charAt(0) : 'T'}
                  </div>
                )}

                <label className="cursor-pointer px-4 py-2 rounded-xl bg-[#FAFAF8] border border-[#132A24]/15 hover:border-[#132A24]/30 text-xs font-semibold text-[#132A24] inline-flex items-center gap-2">
                  <Camera size={14} />
                  <span>Choose Image File</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-[#132A24]/50">JPEG, PNG, or WebP &bull; Max 5 MB</p>
              </div>

              <div className="flex items-center justify-between border-t border-[#132A24]/10 pt-4">
                {profile?.profile_image_url ? (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={photoUploading}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Trash2 size={13} /> Remove Photo
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-[#132A24]/60 hover:text-[#132A24] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!photoFile || photoUploading}
                    onClick={handleUploadPhoto}
                    className="px-4 py-2 rounded-xl bg-[#132A24] text-white text-xs font-semibold hover:bg-[#132A24]/90 disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    {photoUploading ? 'Uploading...' : 'Save Photo'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DEACTIVATION READINESS MODAL                                              */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isDeactivateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#132A24]/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#132A24]/10 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#132A24]/10 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-700" />
                  <h3 className="font-serif text-lg font-medium text-[#132A24]">
                    Practice Deactivation Readiness
                  </h3>
                </div>
                <button
                  onClick={() => setIsDeactivateModalOpen(false)}
                  className="text-[#132A24]/40 hover:text-[#132A24] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {deactivationLoading ? (
                <div className="p-8 text-center text-xs text-[#132A24]/50 animate-pulse">
                  Verifying clinical care journeys and financial balances...
                </div>
              ) : deactivationFeedback ? (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-2">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Info size={15} /> Request Status
                  </div>
                  <p className="leading-relaxed">{deactivationFeedback}</p>
                </div>
              ) : deactivationReadiness ? (
                <div className="space-y-4 text-xs">
                  {deactivationReadiness.canDeactivate ? (
                    <div className="p-4 rounded-xl bg-[#4E7A66]/10 border border-[#4E7A66]/20 text-[#132A24] space-y-2">
                      <div className="font-semibold text-[#4E7A66] flex items-center gap-1.5">
                        <CheckCircle2 size={16} /> Ready for Offboarding Review
                      </div>
                      <p className="text-[11px] text-[#132A24]/70 leading-relaxed">
                        You have zero active client care relationships, zero upcoming appointments, and zero unwithdrawn earnings. You may submit a request for clinical practice offboarding.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2.5">
                      <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                        <AlertTriangle size={15} /> Action Required Before Account Closure
                      </div>
                      <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-amber-900/90">
                        {deactivationReadiness.blockingReasons.map((reason, idx) => (
                          <li key={idx} className="leading-relaxed">{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2.5 text-center text-[11px]">
                    <div className="p-2.5 rounded-lg bg-[#FAFAF8] border border-[#132A24]/10">
                      <span className="text-[#132A24]/50 block">Active Clients</span>
                      <span className="font-semibold text-[#132A24]">{deactivationReadiness.activeClients}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FAFAF8] border border-[#132A24]/10">
                      <span className="text-[#132A24]/50 block">Upcoming Appts</span>
                      <span className="font-semibold text-[#132A24]">{deactivationReadiness.upcomingSessions}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FAFAF8] border border-[#132A24]/10">
                      <span className="text-[#132A24]/50 block">Available Funds</span>
                      <span className="font-semibold text-[#132A24]">₹{Number(deactivationReadiness.availableBalance).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2 border-t border-[#132A24]/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsDeactivateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#132A24]/60 hover:text-[#132A24] cursor-pointer"
                >
                  Close
                </button>
                {deactivationReadiness?.canDeactivate && !deactivationFeedback && (
                  <button
                    type="button"
                    disabled={deactivationSubmitting}
                    onClick={handleRequestDeactivation}
                    className="px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 cursor-pointer shadow-xs"
                  >
                    {deactivationSubmitting ? 'Submitting...' : 'Request Practice Closure'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
