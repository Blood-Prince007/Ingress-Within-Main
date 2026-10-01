import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ShieldCheck, CheckCircle2, FileText, ArrowRight, LogOut, HelpCircle, AlertCircle } from 'lucide-react';

export default function TherapistApplicationReviewView({ applicationData, onLogout, onRefresh, onEditApplication }) {
  const account = applicationData?.account;
  const profile = applicationData?.profile;
  const application = applicationData?.application;

  const isRejected = account?.applicationStatus === 'rejected' || account?.application_status === 'rejected';
  const rejectionReason = application?.rejectionReason || application?.reviewerNotes || account?.rejection_reason;

  const submittedAtDate = application?.submittedAt
    ? new Date(application.submittedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recently';

  const verificationStages = [
    { title: 'Identity & Mobile Verification', status: 'completed', desc: 'Phone OTP confirmed' },
    { title: 'Clinical Onboarding Submission', status: 'completed', desc: '11-step application profile recorded' },
    {
      title: 'Degrees & License Review',
      status: isRejected ? 'rejected' : 'in_progress',
      desc: isRejected ? 'Revisions requested by clinical reviewer' : 'Verification of clinical credentials',
    },
    {
      title: 'Practice Authorization',
      status: 'pending',
      desc: isRejected ? 'Awaiting application resubmission' : 'Unlocking clinical caseload & dashboard',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#132A24] font-sans flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-[#132A24]/10 bg-white px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-mark-transparent.png" alt="Ingress Within" className="w-7 h-7 object-contain" />
            <div>
              <div className="font-serif text-base font-semibold leading-tight tracking-tight">
                ingress <span className="font-normal text-[#4E7A66]">within</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#4E7A66]">
                Practitioner Network
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 text-xs text-[#132A24]/60 hover:text-[#132A24] transition-colors cursor-pointer"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </header>

      {/* Main Review Status Card */}
      <main className="max-w-2xl mx-auto w-full px-6 py-12 flex-grow flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#132A24]/10 rounded-2xl p-8 md:p-10 shadow-sm space-y-8"
        >
          {/* Header Status */}
          <div className="text-center space-y-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              isRejected ? 'bg-amber-500/10 text-amber-700' : 'bg-amber-500/10 text-amber-600'
            }`}>
              {isRejected ? <AlertCircle size={32} /> : <Clock size={32} />}
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
              isRejected ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-amber-100 text-amber-800'
            }`}>
              {isRejected ? 'Application Requires Revision' : 'Application Under Review'}
            </div>
            <h1 className="font-serif text-3xl font-normal text-[#132A24]">
              Welcome, {profile?.fullName || 'Practitioner'}
            </h1>
            <p className="text-sm text-[#132A24]/60 max-w-md mx-auto leading-relaxed">
              {isRejected ? (
                <>Our clinical review team has reviewed your application submitted on <span className="font-medium text-[#132A24]">{submittedAtDate}</span> and requested updates before granting practice authorization.</>
              ) : (
                <>Your clinical application was submitted on <span className="font-medium text-[#132A24]">{submittedAtDate}</span>. Our clinical governance team is reviewing your profile and credentials.</>
              )}
            </p>
          </div>

          {/* Rejection Feedback Banner */}
          {isRejected && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-900">
                <AlertCircle size={15} className="text-amber-700 shrink-0" />
                <span>Review Feedback & Action Items</span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed font-sans bg-white/70 p-3 rounded-lg border border-amber-200/50 whitespace-pre-wrap">
                {rejectionReason || 'Please review your uploaded credentials and experience details. Re-verify document clarity and ensure all certificates are legible.'}
              </p>
              <p className="text-[11px] text-amber-800/80">
                You can update your answers and replace verification documents directly, then resubmit your application for immediate re-evaluation.
              </p>
            </div>
          )}

          {/* Verification Pipeline Checklist */}
          <div className="border border-[#132A24]/10 rounded-xl divide-y divide-[#132A24]/10 bg-[#FAFAF8]/50">
            {verificationStages.map((stage, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  {stage.status === 'completed' ? (
                    <CheckCircle2 size={16} className="text-[#4E7A66] shrink-0" />
                  ) : stage.status === 'in_progress' ? (
                    <Clock size={16} className="text-amber-600 shrink-0 animate-pulse" />
                  ) : stage.status === 'rejected' ? (
                    <AlertCircle size={16} className="text-amber-700 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#132A24]/20 shrink-0" />
                  )}
                  <div>
                    <span className="font-semibold block text-[#132A24]">{stage.title}</span>
                    <span className="text-[11px] text-[#132A24]/50">{stage.desc}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase ${
                  stage.status === 'completed'
                    ? 'bg-[#4E7A66]/10 text-[#4E7A66]'
                    : stage.status === 'in_progress'
                    ? 'bg-amber-100 text-amber-800'
                    : stage.status === 'rejected'
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-[#132A24]/5 text-[#132A24]/40'
                }`}>
                  {stage.status === 'completed' ? 'Verified' : stage.status === 'in_progress' ? 'In Review' : stage.status === 'rejected' ? 'Revision Needed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>

          {/* Reviewer Notice */}
          <div className="p-4 rounded-xl bg-[#4E7A66]/5 border border-[#4E7A66]/20 text-xs text-[#132A24]/80 flex gap-3 items-start">
            <ShieldCheck size={18} className="text-[#4E7A66] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block text-[#132A24]">Clinical Integrity Guarantee</span>
              <p className="text-[11px] leading-relaxed text-[#132A24]/70">
                To protect client safety, therapist workspaces and caseload assignment require verified qualifications before clinical practice is activated. Clinical reviews are typically completed within 24 to 48 business hours.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            {isRejected ? (
              <button
                onClick={onEditApplication}
                className="flex-1 py-3 px-4 rounded-lg bg-[#4E7A66] text-white text-xs font-semibold hover:bg-[#3D6353] transition-all cursor-pointer text-center inline-flex items-center justify-center gap-2 shadow-xs"
              >
                <FileText size={14} /> Update Application & Resubmit
              </button>
            ) : (
              <button
                onClick={onRefresh}
                className="flex-1 py-3 px-4 rounded-lg bg-[#132A24] text-white text-xs font-semibold hover:bg-[#132A24]/90 transition-all cursor-pointer text-center"
              >
                Check Status
              </button>
            )}
            <a
              href="mailto:clinical@ingresswithin.com"
              className="flex-1 py-3 px-4 rounded-lg border border-[#132A24]/15 text-[#132A24] text-xs font-medium hover:bg-[#132A24]/5 transition-all cursor-pointer text-center no-underline"
            >
              Contact Clinical Governance
            </a>
          </div>

        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-[#132A24]/40">
        Ingress Within Clinical Practitioner Network &bull; Rehabilitation & Psychological Services
      </footer>
    </div>
  );
}
