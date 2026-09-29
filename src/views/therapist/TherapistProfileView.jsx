import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, ShieldCheck, Save, Award, Globe, DollarSign, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import TherapistCalendarIntegrationCard from '../../components/therapist/TherapistCalendarIntegrationCard';

export default function TherapistProfileView() {
  const [profile, setProfile] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Editable fields
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/therapist/profile');
      if (res.ok) {
        const json = await res.json();
        setAccount(json.account);
        setProfile(json.profile);
        setFullName(json.profile?.full_name || '');
        setTitle(json.profile?.title || '');
        setBio(json.profile?.bio || '');
        setQualification(json.profile?.qualification || '');
        setExperienceYears(json.profile?.experience_years || 0);
        setCity(json.profile?.city || '');
        setState(json.profile?.state || '');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveNotice('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/therapist/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          title,
          bio,
          qualification,
          experience_years: Number(experienceYears),
          city,
          state,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to update profile.');
      }

      setProfile(data.profile);
      setSaveNotice('Profile updated successfully.');
      setTimeout(() => setSaveNotice(''), 3000);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#132A24]/50 animate-pulse">
        Loading practitioner profile...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b border-[#132A24]/10 pb-6 flex items-center justify-between">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#4E7A66]">
            Practitioner Identity
          </span>
          <h1 className="font-serif text-3xl font-normal text-[#132A24] mt-1">
            Clinical Profile & Credentials
          </h1>
        </div>

        {saveNotice && (
          <span className="text-xs text-[#4E7A66] font-medium animate-pulse">{saveNotice}</span>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Verified Status Banner */}
      <div className="bg-white border border-[#132A24]/10 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#132A24] text-white flex items-center justify-center font-serif text-xl font-bold">
            {fullName ? fullName.charAt(0) : 'T'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-medium text-[#132A24]">{fullName}</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#4E7A66]/10 text-[#4E7A66] text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck size={12} /> {account?.verification_status || 'Verified'}
              </span>
            </div>
            <p className="text-xs text-[#132A24]/60 mt-0.5">{title}</p>
          </div>
        </div>

        <div className="text-xs text-right border-t md:border-t-0 pt-3 md:pt-0 border-[#132A24]/10 text-[#132A24]/60">
          <div><span className="font-medium text-[#132A24]">Phone: </span>{account?.phone_number}</div>
          <div><span className="font-medium text-[#132A24]">RCI Registration: </span>{account?.rci_registered ? account.rci_number || 'Yes' : 'Not RCI'}</div>
        </div>
      </div>

      {/* Calendar & Meetings Integration */}
      <div className="space-y-3">
        <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#4E7A66] block">
          Calendar & Meetings Integration
        </span>
        <TherapistCalendarIntegrationCard />
      </div>

      {/* Editable Form */}
      <form onSubmit={handleSave} className="bg-white border border-[#132A24]/10 rounded-2xl p-8 shadow-xs space-y-6 text-xs">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-[#132A24] mb-1.5">Full Professional Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-[#132A24]/15 rounded-lg px-3.5 py-2.5 outline-hidden focus:border-[#4E7A66]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#132A24] mb-1.5">Clinical Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-[#132A24]/15 rounded-lg px-3.5 py-2.5 outline-hidden focus:border-[#4E7A66]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#132A24] mb-1.5">Professional Bio & Approach</label>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full border border-[#132A24]/15 rounded-lg px-3.5 py-2.5 outline-hidden focus:border-[#4E7A66]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-[#132A24] mb-1.5">Highest Qualification</label>
            <input
              type="text"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className="w-full border border-[#132A24]/15 rounded-lg px-3.5 py-2.5 outline-hidden focus:border-[#4E7A66]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#132A24] mb-1.5">Years of Experience</label>
            <input
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="w-full border border-[#132A24]/15 rounded-lg px-3.5 py-2.5 outline-hidden focus:border-[#4E7A66]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-[#132A24] mb-1.5">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-[#132A24]/15 rounded-lg px-3.5 py-2.5 outline-hidden focus:border-[#4E7A66]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#132A24] mb-1.5">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full border border-[#132A24]/15 rounded-lg px-3.5 py-2.5 outline-hidden focus:border-[#4E7A66]"
            />
          </div>
        </div>

        {/* Protected Administrative Fields Info */}
        <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-[#132A24]">
            <Lock size={13} className="text-[#4E7A66]" />
            <span>Governance-Protected Fields</span>
          </div>
          <p className="text-[11px] text-[#132A24]/60 leading-relaxed">
            Practice authorization (can_practice), RCI verification state, application status, and platform commission rates are maintained by the clinical governance board and cannot be altered from this screen.
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#132A24] text-white text-xs font-semibold hover:bg-[#132A24]/90 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
