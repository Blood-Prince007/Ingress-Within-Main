import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Save, CheckCircle2, Shield, User, Award, Clock,
  Globe, DollarSign, AlertCircle, LogOut, Upload, FileCheck2, CalendarDays,
  ClipboardCheck, HeartPulse, BriefcaseBusiness
} from 'lucide-react';

const TOTAL_STEPS = 11;
const CONCERN_TAGS = ['Overthinking','Anxiety','Low mood','Stress','Burnout','Relationship issues','Family issues','Career stress','Academic stress','Self-confidence','Loneliness','Anger','Grief','Sleep problems','Low motivation','Emotional overwhelm','Identity','Trauma / PTSD'];
const MODALITIES = ['CBT','DBT','Psychodynamic','EMDR','Family Systems','Somatic','Acceptance & Commitment Therapy','Existential','Attachment-focused','Emotionally Focused Therapy','Interpersonal/Relational','Spiritually-integrated'];
const LANGUAGES = ['English','Hindi','Gujarati','Marathi','Tamil','Bengali'];
const FORMATS = ['Telehealth','In-person','Either'];
const AGE_GROUPS = ['Children','Adolescents','Adults','Couples','Families','Older adults'];
const VIGNETTES = [
  { prompt: "A client goes quiet mid-session after you ask about a painful topic. What's closest to how you'd respond?", options: [
    { label: 'Gently name what I’m noticing and let them decide when to continue', modalities: ['Attachment-focused','Emotionally Focused Therapy'] },
    { label: 'Ask a direct follow-up to keep momentum', modalities: ['CBT','Acceptance & Commitment Therapy'] },
    { label: 'Sit in the silence without prompting', modalities: ['Psychodynamic','Existential'] },
  ]},
  { prompt: 'A client says they already know their pattern but keep repeating it anyway. Your instinct?', options: [
    { label: 'Explore where the pattern first came from', modalities: ['Psychodynamic','Attachment-focused'] },
    { label: 'Set a concrete behavioural experiment for the week', modalities: ['CBT','Acceptance & Commitment Therapy'] },
    { label: 'Point out the gap between insight and action directly', modalities: ['Existential','Acceptance & Commitment Therapy'] },
  ]},
  { prompt: 'How do you typically structure a session?', options: [
    { label: 'Loose — we follow whatever comes up', modalities: ['Psychodynamic','Existential','Interpersonal/Relational'] },
    { label: 'A rough agenda, but I stay flexible', modalities: ['Family Systems','Somatic'] },
    { label: 'Clear structure — check-in, focus area, close', modalities: ['CBT','Acceptance & Commitment Therapy','Family Systems'] },
  ]},
];

const STAGES = [
  { label: 'Public profile', range: [1,3], icon: User },
  { label: 'Matching profile', range: [4,7], icon: ClipboardCheck },
  { label: 'Verification', range: [8,9], icon: Shield },
  { label: 'Submit', range: [10,11], icon: FileCheck2 },
];

const DEFAULTS = {
  fullName: '', contact_email: '', email: '', photo: null, credentials: '', yearsOfExperience: '', city: '', bio: '', specialties: [], broadSpecialtyTags: [],
  languages: [], sessionFormats: [], feePerSession: '', modalities: [], customModalities: [], primaryModalities: [],
  vignetteAnswers: {}, vignetteEvidence: {}, calibration: {}, capacitySource: '', currentCapacity: '', maxCapacity: '',
  soonestOpeningDays: '', severityCeiling: 3, gender: '', ageGroups: [], state: '', licenseNumber: '', issuingBody: '',
  degreeCertificate: null, traumaListed: '', traumaCertification: null, primaryCertificates: {}, secondaryCertificates: {},
  backgroundCheckConsent: false, supervision: { status: '', format: '', supervisorContact: '', confirmationLetter: null },
  higherAcuityInterest: '', higherAcuityExperience: '', ethicsDeclaration: false, truthfulnessConfirmed: false,
};

function normaliseInitial(initialData) {
  const saved = initialData?.application?.answers || {};
  const profileEmail = initialData?.profile?.contact_email || '';
  const appEmail = initialData?.application?.contact_email || '';
  const accountEmail = initialData?.account?.email || '';
  const merged = { ...DEFAULTS, ...saved };
  if (!merged.contact_email) {
    merged.contact_email = saved.contact_email || saved.email || appEmail || profileEmail || accountEmail || '';
  }
  merged.email = merged.contact_email;
  const arrays = ['specialties','broadSpecialtyTags','languages','sessionFormats','modalities','customModalities','primaryModalities','ageGroups'];
  arrays.forEach((k) => { if (!Array.isArray(merged[k])) merged[k] = []; });
  merged.vignetteAnswers = merged.vignetteAnswers && typeof merged.vignetteAnswers === 'object' ? merged.vignetteAnswers : {};
  merged.vignetteEvidence = merged.vignetteEvidence && typeof merged.vignetteEvidence === 'object' ? merged.vignetteEvidence : {};
  merged.calibration = merged.calibration && typeof merged.calibration === 'object' ? merged.calibration : {};
  merged.primaryCertificates = merged.primaryCertificates && typeof merged.primaryCertificates === 'object' ? merged.primaryCertificates : {};
  merged.secondaryCertificates = merged.secondaryCertificates && typeof merged.secondaryCertificates === 'object' ? merged.secondaryCertificates : {};
  merged.supervision = { ...DEFAULTS.supervision, ...(merged.supervision || {}) };
  return merged;
}

function Field({ label, hint, children }) {
  return <div className="space-y-1.5"><label className="block text-xs font-semibold text-[#132A24]/75">{label}</label>{children}{hint && <p className="text-[11px] text-[#132A24]/50 leading-relaxed">{hint}</p>}</div>;
}

function Chip({ selected, disabled, children, onClick, primary = false }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`px-3 py-2 rounded-full border text-xs transition-all ${selected ? (primary ? 'bg-[#132A24] text-white border-[#132A24]' : 'bg-[#4E7A66]/10 text-[#132A24] border-[#4E7A66] font-semibold') : 'bg-white border-[#132A24]/15 text-[#132A24]/70 hover:bg-[#132A24]/5'} ${disabled ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'}`}>{children}</button>;
}

function FilePicker({ label, value, accept, onChange, required = false }) {
  return <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-dashed border-[#132A24]/20 bg-[#FAFAF8]">
    <div className="min-w-0"><div className="text-xs font-medium text-[#132A24]">{label}{required ? ' *' : ''}</div><div className="text-[10px] text-[#132A24]/45 truncate">{value?.name || value?.filename || 'No file selected'}</div></div>
    <label className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#132A24]/15 bg-white text-xs cursor-pointer hover:bg-[#132A24]/5"><Upload size={13}/>{value ? 'Replace' : 'Upload'}<input type="file" className="hidden" accept={accept} onChange={(e) => onChange(e.target.files?.[0] || null)} /></label>
  </div>;
}

export default function TherapistOnboardingView({ initialData, onComplete, onLogout }) {
  const [step, setStep] = useState(Math.min(TOTAL_STEPS, Math.max(1, Number(initialData?.application?.step) || 1)));
  const [answers, setAnswers] = useState(() => normaliseInitial(initialData));
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [calibrationReady, setCalibrationReady] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const allModalities = useMemo(() => [...answers.modalities, ...answers.customModalities], [answers.modalities, answers.customModalities]);
  const unsupportedPrimary = useMemo(() => answers.primaryModalities.filter((m) => !answers.calibration?.[m]?.supported && !answers.calibration?.[m]?.resolved), [answers.primaryModalities, answers.calibration]);

  useEffect(() => {
    if (answers.primaryModalities.length && Object.keys(answers.vignetteAnswers || {}).length === 3) {
      const inferred = {};
      VIGNETTES.forEach((v, i) => {
        const pick = answers.vignetteAnswers[String(i)];
        const option = v.options.find((o) => o.label === pick);
        (option?.modalities || []).forEach((m) => { inferred[m] = [...(inferred[m] || []), pick]; });
      });
      const next = {};
      answers.primaryModalities.forEach((m) => { next[m] = { supported: Boolean(inferred[m]?.length), evidence: inferred[m] || [], resolved: answers.calibration?.[m]?.resolved || false }; });
      setAnswers((prev) => ({ ...prev, vignetteEvidence: inferred, calibration: next }));
      setCalibrationReady(true);
    }
  }, [answers.vignetteAnswers, answers.primaryModalities]);

  const set = (key, value) => { setAnswers((p) => ({ ...p, [key]: value })); setError(''); };
  const toggle = (key, value, cap) => set(key, (answers[key] || []).includes(value) ? (answers[key] || []).filter((x) => x !== value) : ((answers[key] || []).length >= cap ? answers[key] : [...(answers[key] || []), value]));

  async function uploadFile(file, category, extra = {}) {
    if (!file) return null;
    if (file.size > 10 * 1024 * 1024) throw new Error('Each uploaded file must be 10 MB or smaller.');
    setUploading(true); setError('');
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('category', category); fd.append('metadata', JSON.stringify(extra));
      const res = await fetch('/api/therapist/onboarding/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'File upload failed.');
      return data.document;
    } finally { setUploading(false); }
  }

  async function attach(key, file, category, extra = {}) {
    if (!file) return;
    try { const doc = await uploadFile(file, category, extra); set(key, doc); } catch (e) { setError(e.message); }
  }

  async function attachPrimaryCertificate(modality, file, primary = true) {
    if (!file) return;
    try {
      const doc = await uploadFile(file, primary ? 'primary_modality_certificate' : 'secondary_modality_certificate', { modality });
      set(primary ? 'primaryCertificates' : 'secondaryCertificates', { ...(primary ? answers.primaryCertificates : answers.secondaryCertificates), [modality]: doc });
    } catch (e) { setError(e.message); }
  }

  async function attachSupervisionLetter(file) {
    if (!file) return;
    try { const doc = await uploadFile(file, 'supervision_confirmation'); set('supervision', { ...answers.supervision, confirmationLetter: doc }); } catch (e) { setError(e.message); }
  }

  async function saveDraft(stepToSave = step) {
    setSaving(true); setNotice(''); setError('');
    try {
      const clean = JSON.parse(JSON.stringify(answers));
      const res = await fetch('/api/therapist/onboarding/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: stepToSave, answers: clean, documents: collectDocuments(clean) }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error?.message || 'Failed to save draft.');
      setNotice('Progress saved.'); setTimeout(() => setNotice(''), 2500);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  function collectDocuments(a) {
    const docs = [];
    const add = (value, type) => { if (value && typeof value === 'object' && (value.path || value.filename)) docs.push({ ...value, type }); };
    add(a.photo, 'profile_photo'); add(a.degreeCertificate, 'degree_certificate'); add(a.traumaCertification, 'trauma_certification');
    add(a.supervision?.confirmationLetter, 'supervision_confirmation');
    Object.entries(a.primaryCertificates || {}).forEach(([modality, doc]) => add(doc, 'primary_modality_certificate:' + modality));
    Object.entries(a.secondaryCertificates || {}).forEach(([modality, doc]) => add(doc, 'secondary_modality_certificate:' + modality));
    return docs;
  }

  function validateCurrent() {
    if (step === 2) {
      if (!answers.fullName.trim() || !answers.credentials.trim() || answers.yearsOfExperience === '' || !answers.city.trim()) return 'Please complete name, credentials, years of experience and city.';
      const rawEmail = (answers.contact_email || answers.email || '').trim();
      if (!rawEmail) return 'Email address is required for application and verification updates.';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawEmail)) return 'Please provide a valid email address (e.g. name@example.com).';
    }
    if (step === 3 && (!answers.bio.trim() || answers.specialties.length < 1 || answers.specialties.length > 5 || !answers.languages.length || !answers.sessionFormats.length || answers.feePerSession === '')) return 'Please complete your bio, at least one specialty, language, session format and fee.';
    if (step === 4 && (!answers.modalities.length && !answers.customModalities.length || !answers.primaryModalities.length || answers.primaryModalities.length > 5)) return 'Select at least one therapeutic approach and mark at least one primary approach (maximum 5).';
    if (step === 5 && Object.keys(answers.vignetteAnswers || {}).length !== 3) return 'Please answer all 3 scenarios before continuing.';
    if (step === 7 && (!answers.capacitySource || answers.currentCapacity === '' || answers.maxCapacity === '' || !answers.gender || !answers.ageGroups.length || !answers.state.trim())) return 'Please complete availability, capacity, gender, age groups and licensure state.';
    if (step === 8 && (!answers.licenseNumber.trim() || !answers.issuingBody.trim() || !answers.degreeCertificate || !answers.backgroundCheckConsent)) return 'Please provide registration details, upload the degree certificate and consent to the background check.';
    if (step === 8 && answers.primaryModalities.some((m) => !answers.primaryCertificates?.[m])) return 'Please upload verification proof for each primary approach.';
    if (step === 8 && Number(answers.yearsOfExperience || 0) < 3 && !answers.supervision.status) return 'Under 3 years of experience requires a supervision path before submission.';
    if (step === 8 && Number(answers.yearsOfExperience || 0) < 3 && answers.supervision.status === 'own' && (!answers.supervision.format || !answers.supervision.supervisorContact || !answers.supervision.confirmationLetter)) return 'Please provide supervision format, supervisor contact and confirmation letter.';
    if (step === 9 && !answers.higherAcuityInterest) return 'Please select whether you want to be considered for higher-acuity referrals.';
    if (step === 10 && (!answers.ethicsDeclaration || !answers.truthfulnessConfirmed)) return 'Please accept both declarations before submitting.';
    return '';
  }

  async function next() {
    const validation = validateCurrent(); if (validation) { setError(validation); return; }
    if (step === 5) setCalibrationReady(true);
    const nextStep = Math.min(TOTAL_STEPS, step + 1); setStep(nextStep); await saveDraft(nextStep);
  }

  function resolveCalibration(modality, action) {
    setAnswers((p) => ({ ...p, primaryModalities: action === 'demote' ? p.primaryModalities.filter((m) => m !== modality) : p.primaryModalities, calibration: { ...p.calibration, [modality]: { ...(p.calibration?.[modality] || {}), resolved: true } } }));
  }

  async function submit() {
    const validation = validateCurrent(); if (validation) { setError(validation); return; }
    setSubmitting(true); setError('');
    try {
      const clean = JSON.parse(JSON.stringify(answers));
      const res = await fetch('/api/therapist/onboarding/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: clean, documents: collectDocuments(clean) }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error?.message || 'Submission failed.');
      setSubmitResult(data); setStep(11); if (onComplete) onComplete(data);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  }

  const inputClass = 'w-full text-sm border border-[#132A24]/15 rounded-lg px-3.5 py-2.5 outline-none focus:border-[#4E7A66] focus:ring-1 focus:ring-[#4E7A66] bg-white';
  const stage = STAGES.findIndex((s) => step >= s.range[0] && step <= s.range[1]);

  if (step === 11 && submitResult) return <div className="min-h-screen bg-[#FAFAF8] text-[#132A24] flex items-center justify-center p-6"><div className="max-w-xl w-full bg-white border border-[#132A24]/10 rounded-2xl p-8 shadow-sm text-center space-y-5"><CheckCircle2 className="mx-auto text-[#4E7A66]" size={44}/><h1 className="font-serif text-3xl">Application submitted</h1><p className="text-sm text-[#132A24]/65 leading-relaxed">Your therapist application is now in <strong>credentialing review</strong>. Your profile will not be visible to clients until the required verification and clinical review are complete.</p><div className="rounded-xl bg-[#FAFAF8] p-4 text-left text-xs space-y-2"><div><strong>Status:</strong> credentialing_in_review</div><div><strong>Verification:</strong> pending</div><div><strong>Next:</strong> Clinical/admin review of credentials and any flagged approach or safety-related items.</div></div><button onClick={onLogout} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#132A24] text-white text-xs"><LogOut size={14}/> Sign out</button></div></div>;

  return <div className="min-h-screen bg-[#FAFAF8] text-[#132A24] font-sans">
    <header className="border-b border-[#132A24]/10 bg-white px-6 py-4 sticky top-0 z-30"><div className="max-w-6xl mx-auto flex items-center justify-between gap-4"><div className="flex items-center gap-3"><img src="/logo-mark-transparent.png" alt="Ingress Within" className="w-7 h-7 object-contain"/><div><div className="font-serif text-base font-semibold">ingress <span className="font-normal text-[#4E7A66]">within</span></div><span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#4E7A66]">Therapist Onboarding</span></div></div><div className="flex items-center gap-3 text-xs">{notice && <span className="text-[#4E7A66] font-medium">{notice}</span>}<button onClick={() => saveDraft()} disabled={saving || uploading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#132A24]/15 bg-white"><Save size={13}/>{saving ? 'Saving...' : 'Save draft'}</button><button onClick={onLogout} className="inline-flex items-center gap-1 text-[#132A24]/50"><LogOut size={13}/> Sign out</button></div></div></header>
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-7"><div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.16em] text-[#132A24]/50 mb-2"><span>Step {step} of 11</span><span>{STAGES[stage]?.label}</span></div><div className="grid grid-cols-4 gap-1">{STAGES.map((s,i)=><div key={s.label} className={`h-1.5 rounded-full ${i <= stage ? 'bg-[#4E7A66]' : 'bg-[#132A24]/10'}`}/>)}</div></div>
      {error && <div className="mb-5 p-3.5 rounded-xl border border-red-200 bg-red-50 text-xs text-red-800 flex gap-2"><AlertCircle size={15} className="shrink-0 mt-0.5"/><span>{error}</span></div>}
      <div className="bg-white border border-[#132A24]/10 rounded-2xl shadow-sm overflow-hidden"><AnimatePresence mode="wait"><motion.div key={step} initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-8}} className="p-6 md:p-8">
        {step === 1 && <div className="space-y-6"><div><div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#132A24]/5 text-[10px] font-bold uppercase tracking-wider">Getting started</div><h1 className="font-serif text-3xl mt-3">Your therapist application</h1><p className="text-sm text-[#132A24]/60 mt-2 leading-relaxed">This onboarding collects your public profile, matching information, and verification details. You can save a draft and return later.</p></div><div className="grid md:grid-cols-3 gap-3">{[['Public profile','What clients can see once you are approved.'],['Matching profile','Information used by the matching engine; it is not shown raw to clients.'],['Credential verification','Documents and review required before your profile can go live.']].map(([t,d])=><div key={t} className="rounded-xl border border-[#132A24]/10 bg-[#FAFAF8] p-4"><div className="text-sm font-semibold">{t}</div><p className="text-xs text-[#132A24]/55 mt-1.5 leading-relaxed">{d}</p></div>)}</div></div>}
        {step === 2 && <div className="space-y-5"><h2 className="font-serif text-2xl">Basic info</h2><div className="grid md:grid-cols-2 gap-4"><Field label="Full name"><input className={inputClass} value={answers.fullName} onChange={e=>set('fullName',e.target.value)}/></Field><Field label={<span>Email address <span className="text-red-500">*</span></span>} hint="This email will be used for application and verification updates."><input type="email" required className={inputClass} value={answers.contact_email || ''} onChange={e=>{set('contact_email',e.target.value);set('email',e.target.value);}} placeholder="doctor@example.com"/></Field><Field label="Photo" hint="Use a professional profile photo. It will remain gated until approval."><FilePicker label="Profile photo" value={answers.photo} accept="image/png,image/jpeg,image/webp" onChange={f=>attach('photo',f,'profile_photo')}/></Field><Field label="Credentials (e.g. PhD Clinical Psychology)"><input className={inputClass} value={answers.credentials} onChange={e=>set('credentials',e.target.value)}/></Field><Field label="Years of experience" hint="This also determines whether supervision may be required later — no need to enter it twice."><input type="number" min="0" className={inputClass} value={answers.yearsOfExperience} onChange={e=>set('yearsOfExperience',e.target.value)}/></Field><Field label="City you're based in" hint="General area only; do not enter an exact address."><input className={inputClass} value={answers.city} onChange={e=>set('city',e.target.value)}/></Field></div></div>}
        {step === 3 && <div className="space-y-5"><h2 className="font-serif text-2xl">Your bio & specialties</h2><Field label="Bio"><textarea rows={5} className={inputClass} value={answers.bio} onChange={e=>set('bio',e.target.value)} placeholder="Tell clients about your approach and experience."/></Field><Field label="Your top 5 specialties" hint={`${answers.specialties.length} of 5 selected`}><div className="flex flex-wrap gap-2">{CONCERN_TAGS.map(x=><Chip key={x} selected={answers.specialties.includes(x)} disabled={!answers.specialties.includes(x)&&answers.specialties.length>=5} onClick={()=>toggle('specialties',x,5)}>{x}</Chip>)}</div></Field><Field label="Languages"><div className="flex flex-wrap gap-2">{LANGUAGES.map(x=><Chip key={x} selected={answers.languages.includes(x)} onClick={()=>toggle('languages',x)}>{x}</Chip>)}</div></Field><Field label="Session format"><div className="flex flex-wrap gap-2">{FORMATS.map(x=><Chip key={x} selected={answers.sessionFormats.includes(x)} onClick={()=>toggle('sessionFormats',x)}>{x}</Chip>)}</div></Field><Field label="Fee per session (₹)"><input type="number" min="0" className={inputClass} value={answers.feePerSession} onChange={e=>set('feePerSession',e.target.value)}/></Field></div>}
        {step === 4 && <div className="space-y-5"><h2 className="font-serif text-2xl">Your therapeutic approach</h2><Field label="Approaches you practice"><div className="flex flex-wrap gap-2">{MODALITIES.map(x=><Chip key={x} selected={answers.modalities.includes(x)} onClick={()=>toggle('modalities',x)}>{x}</Chip>)}{answers.customModalities.map(x=><Chip key={x} selected onClick={()=>set('customModalities',answers.customModalities.filter(m=>m!==x))}>{x} ×</Chip>)}</div></Field><div className="flex gap-2"><input id="custom-modality" className={inputClass} placeholder="e.g. Narrative Therapy"/><button type="button" onClick={()=>{const el=document.getElementById('custom-modality');const v=el.value.trim();if(v&&!allModalities.some(m=>m.toLowerCase()===v.toLowerCase())){set('customModalities',[...answers.customModalities,v]);el.value='';}}} className="px-4 rounded-lg bg-[#132A24] text-white text-xs">Add</button></div><Field label="Mark your top 5 primary approaches" hint="Primary approaches are the approaches that carry the most weight in matching and require verification."><div className="flex flex-wrap gap-2">{allModalities.map(x=><Chip key={x} primary selected={answers.primaryModalities.includes(x)} disabled={!answers.primaryModalities.includes(x)&&answers.primaryModalities.length>=5} onClick={()=>toggle('primaryModalities',x,5)}>{x}</Chip>)}</div></Field></div>}
        {step === 5 && <div className="space-y-5"><h2 className="font-serif text-2xl">A quick consistency check</h2><p className="text-sm text-[#132A24]/60">These 3 scenarios check whether the approaches you selected are reflected in how you work in practice. Please answer all three.</p>{VIGNETTES.map((v,i)=><div key={i} className="rounded-xl border border-[#132A24]/10 p-4"><p className="text-sm font-medium mb-3">{v.prompt}</p><div className="space-y-2">{v.options.map(o=><button key={o.label} type="button" onClick={()=>set('vignetteAnswers',{...answers.vignetteAnswers,[String(i)]:o.label})} className={`w-full text-left p-3 rounded-lg border text-xs ${answers.vignetteAnswers[String(i)]===o.label?'border-[#4E7A66] bg-[#EEF6F3] font-semibold':'border-[#132A24]/10 hover:bg-[#FAFAF8]'}`}>{o.label}</button>)}</div></div>)}</div>}
        {step === 6 && <div className="space-y-5"><h2 className="font-serif text-2xl">Does this match your primary approaches?</h2><p className="text-sm text-[#132A24]/60">Primary approaches are what get certificate-verified and carry the most weight in matching. Each one below shows the scenario evidence supporting it.</p>{answers.primaryModalities.map(m=>{const c=answers.calibration?.[m]||{};return <div key={m} className="border-b border-dashed border-[#132A24]/15 py-4"><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">{m}</span><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${c.supported||c.resolved?'bg-[#DCE9E6] text-[#132A24]':'bg-[#F3DCC8] text-[#7A4A1B]'}`}>{c.supported?'Backed by answers':c.resolved?'Kept as primary':'No scenario support'}</span></div>{c.evidence?.length ? <p className="text-[11px] text-[#132A24]/55 mt-2">Backed by: {c.evidence.map(e=>`“${e}”`).join(', ')}</p> : !c.resolved && <div className="mt-3"><p className="text-xs text-[#132A24]/55 mb-2">None of the scenarios pointed toward this approach. That does not automatically mean it is wrong.</p><div className="flex gap-2"><button type="button" onClick={()=>resolveCalibration(m,'keep')} className="px-3 py-2 rounded-lg border text-xs">Keep as primary</button><button type="button" onClick={()=>resolveCalibration(m,'demote')} className="px-3 py-2 rounded-lg border text-xs">Move to secondary</button></div></div>}</div>})}</div>}
        {step === 7 && <div className="space-y-5"><h2 className="font-serif text-2xl">Practical matching details</h2><Field label="How do you want to manage your availability?"><div className="flex flex-wrap gap-2"><Chip selected={answers.capacitySource==='manual'} onClick={()=>set('capacitySource','manual')}>I’ll update this manually</Chip><Chip selected={answers.capacitySource==='calendar'} onClick={()=>set('capacitySource','calendar')}>Connect my calendar (recommended)</Chip></div></Field><div className="grid md:grid-cols-2 gap-4"><Field label="How many clients can you take on right now?"><input type="number" min="0" className={inputClass} value={answers.currentCapacity} onChange={e=>set('currentCapacity',e.target.value)}/></Field><Field label="Roughly, what does a full caseload look like for you?"><input type="number" min="0" className={inputClass} value={answers.maxCapacity} onChange={e=>set('maxCapacity',e.target.value)}/></Field><Field label="Soonest opening (days)" hint="Keep this current; stale availability can affect matching."><input type="number" min="0" className={inputClass} value={answers.soonestOpeningDays} onChange={e=>set('soonestOpeningDays',e.target.value)}/></Field><Field label="Highest severity you're comfortable taking on (1 = mild, 5 = acute)"><select className={inputClass} value={answers.severityCeiling} onChange={e=>set('severityCeiling',Number(e.target.value))}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></Field><Field label="Gender"><input className={inputClass} value={answers.gender} onChange={e=>set('gender',e.target.value)} placeholder="Optional self-description"/></Field><Field label="State (for licensure)"><input className={inputClass} value={answers.state} onChange={e=>set('state',e.target.value)}/></Field></div><Field label="Age groups you work with"><div className="flex flex-wrap gap-2">{AGE_GROUPS.map(x=><Chip key={x} selected={answers.ageGroups.includes(x)} onClick={()=>toggle('ageGroups',x)}>{x}</Chip>)}</div></Field></div>}
        {step === 8 && <div className="space-y-5"><h2 className="font-serif text-2xl">Verify your credentials</h2><div className="grid md:grid-cols-2 gap-4"><Field label="License / registration number"><input className={inputClass} value={answers.licenseNumber} onChange={e=>set('licenseNumber',e.target.value)}/></Field><Field label="Issuing body (e.g. RCI)"><input className={inputClass} value={answers.issuingBody} onChange={e=>set('issuingBody',e.target.value)}/></Field></div><FilePicker label="Degree certificate" value={answers.degreeCertificate} accept="application/pdf,image/png,image/jpeg" required onChange={f=>attach('degreeCertificate',f,'degree_certificate')}/><Field label="Do you want to be listed as trauma-informed?"><div className="flex gap-2"><Chip selected={answers.traumaListed==='Yes'} onClick={()=>set('traumaListed','Yes')}>Yes</Chip><Chip selected={answers.traumaListed==='No'} onClick={()=>set('traumaListed','No')}>No</Chip></div></Field>{answers.traumaListed==='Yes' && <FilePicker label="Trauma-focused training/certification" value={answers.traumaCertification} accept="application/pdf,image/png,image/jpeg" required onChange={f=>attach('traumaCertification',f,'trauma_certification')}/>}<div><div className="text-xs font-semibold text-[#132A24]/75 mb-2">Supervision</div><p className="text-xs text-[#132A24]/55 mb-3">3+ years: supervision is optional. Under 3 years: supervision is required before practice authorization.</p>{Number(answers.yearsOfExperience||0) >= 3 ? <div className="flex gap-2"><Chip selected={answers.supervision.status==='opted_in'} onClick={()=>set('supervision',{...answers.supervision,status:'opted_in'})}>Yes, I want supervision</Chip><Chip selected={answers.supervision.status==='not_required'} onClick={()=>set('supervision',{...answers.supervision,status:'not_required'})}>No thanks</Chip></div> : <div className="space-y-3"><div className="flex gap-2"><Chip selected={answers.supervision.status==='arranged'} onClick={()=>set('supervision',{...answers.supervision,status:'arranged'})}>Join supervision arranged by us</Chip><Chip selected={answers.supervision.status==='own'} onClick={()=>set('supervision',{...answers.supervision,status:'own'})}>I already have supervision</Chip></div>{answers.supervision.status==='own' && <div className="grid md:grid-cols-2 gap-3"><input className={inputClass} placeholder="Format: Individual / Group" value={answers.supervision.format} onChange={e=>set('supervision',{...answers.supervision,format:e.target.value})}/><input className={inputClass} placeholder="Supervisor / group contact" value={answers.supervision.supervisorContact} onChange={e=>set('supervision',{...answers.supervision,supervisorContact:e.target.value})}/><div className="md:col-span-2"><FilePicker label="Supervision confirmation letter" value={answers.supervision.confirmationLetter} accept="application/pdf,image/png,image/jpeg" required onChange={attachSupervisionLetter}/></div></div>}{answers.supervision.status==='arranged' && <p className="text-xs text-[#132A24]/55">We’ll be in touch to arrange supervision before approval.</p>}</div>}</div><div><div className="text-xs font-semibold text-[#132A24]/75 mb-2">Verify your primary approaches</div><p className="text-[11px] text-[#132A24]/50 mb-3">Upload proof of training for each approach marked primary. These claims remain pending until reviewed.</p><div className="space-y-2">{answers.primaryModalities.map(m=><FilePicker key={m} label={m} value={answers.primaryCertificates[m]} accept="application/pdf,image/png,image/jpeg" required onChange={f=>attachPrimaryCertificate(m,f,true)}/>)}</div></div><div><div className="text-xs font-semibold text-[#132A24]/75 mb-2">Other approaches (optional verification)</div><div className="space-y-2">{allModalities.filter(m=>!answers.primaryModalities.includes(m)).map(m=><FilePicker key={m} label={m} value={answers.secondaryCertificates[m]} accept="application/pdf,image/png,image/jpeg" onChange={f=>attachPrimaryCertificate(m,f,false)}/>)}</div></div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={answers.backgroundCheckConsent} onChange={e=>set('backgroundCheckConsent',e.target.checked)}/> I consent to a background check</label><div className="rounded-xl bg-[#FAFAF8] border border-[#132A24]/10 p-4 text-xs text-[#132A24]/60">Uploading a document does not mean it is verified. Verification is completed by the clinical/admin review process.</div></div>}
        {step === 9 && <div className="space-y-5"><h2 className="font-serif text-2xl">Higher-acuity referrals</h2><Field label="Interested in being considered for higher-acuity referrals?"><div className="flex gap-2"><Chip selected={answers.higherAcuityInterest==='Yes'} onClick={()=>set('higherAcuityInterest','Yes')}>Yes</Chip><Chip selected={answers.higherAcuityInterest==='No'} onClick={()=>set('higherAcuityInterest','No')}>Not right now</Chip></div></Field>{answers.higherAcuityInterest==='Yes' && <Field label="Relevant experience with high-acuity cases (optional)"><textarea rows={5} className={inputClass} value={answers.higherAcuityExperience} onChange={e=>set('higherAcuityExperience',e.target.value)} /></Field>}<div className="rounded-xl border border-[#F3DCC8] bg-[#FFF9F2] p-4 text-xs text-[#7A4A1B]">Higher-acuity eligibility is not granted by self-report. A clinical lead/supervisor must review and record any acuity clearance.</div></div>}
        {step === 10 && <div className="space-y-5"><h2 className="font-serif text-2xl">Review & submit</h2><div className="space-y-2">{[['Profile & specialties',answers.fullName&&answers.specialties.length?'Provided':'Incomplete'],['Contact email',answers.contact_email||answers.email?(answers.contact_email||answers.email):'Incomplete'],['Approaches + primary approaches',answers.primaryModalities.length?`${answers.primaryModalities.length} primary selected`:'Incomplete'],['Consistency check',Object.keys(answers.vignetteAnswers).length===3?(unsupportedPrimary.length?`${unsupportedPrimary.length} needs your input`:'Complete'):'Incomplete'],['Matching details',answers.capacitySource&&answers.ageGroups.length?'Provided':'Incomplete'],['License & degree',answers.licenseNumber&&answers.degreeCertificate?'Provided — pending verification':'Incomplete'],['Background check',answers.backgroundCheckConsent?'Consented — pending':'Not consented'],['Higher-acuity',answers.higherAcuityInterest?`${answers.higherAcuityInterest} — clinical review required`:'Not selected']].map(([l,v])=><div key={l} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#FAFAF8] text-xs"><span>{l}</span><span className="font-semibold">{v}</span></div>)}</div><div className="rounded-xl border border-[#132A24]/10 p-4 space-y-3 text-xs text-[#132A24]/65"><p>By submitting, you understand that the application enters <strong>credentialing review</strong>. Self-reported claims are not treated as verified until the required review is completed.</p><label className="flex gap-2"><input type="checkbox" checked={answers.ethicsDeclaration} onChange={e=>set('ethicsDeclaration',e.target.checked)}/> I agree to the Ingress Within Clinical Code of Ethics and Privacy Charter.</label><label className="flex gap-2"><input type="checkbox" checked={answers.truthfulnessConfirmed} onChange={e=>set('truthfulnessConfirmed',e.target.checked)}/> I confirm that the degrees, registration details and clinical information provided are accurate.</label></div></div>}
      </motion.div></AnimatePresence><div className="border-t border-[#132A24]/10 p-5 flex items-center justify-between gap-3"><button type="button" onClick={()=>setStep(s=>Math.max(1,s-1))} disabled={step===1||submitting||uploading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#132A24]/15 text-xs disabled:opacity-30"><ArrowLeft size={14}/> Back</button>{step < 10 ? <button type="button" onClick={next} disabled={saving||uploading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#132A24] text-white text-xs disabled:opacity-50">{saving?'Saving...':'Continue'}<ArrowRight size={14}/></button> : <button type="button" onClick={submit} disabled={submitting||saving||uploading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#4E7A66] text-white text-xs disabled:opacity-50">{submitting?'Submitting...':'Submit application'}<CheckCircle2 size={14}/></button>}</div></div>
      <p className="mt-4 text-[11px] text-[#132A24]/45 text-center">Your profile stays non-client-visible until credentialing and clinical review are complete.</p>
    </main>
  </div>;
}
