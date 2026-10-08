'use client';

import React, { useEffect } from 'react';
import { ArrowLeft, Shield, Lock, Calendar, FileText, CheckCircle2, AlertTriangle, Mail } from 'lucide-react';

export default function PrivacyPolicyView() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#132A24] font-sans antialiased selection:bg-[#4E7A66]/20">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-[#FBFBF9]/90 backdrop-blur-md border-b border-[#132A24]/10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#132A24]/70 hover:text-[#132A24] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Ingress Within
          </a>
          <div className="flex items-center gap-2">
            <img src="/logo-mark.png" alt="Ingress Within" className="w-6 h-6 object-contain" />
            <span className="font-serif font-medium text-sm tracking-tight">Ingress Within</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        {/* Header Hero */}
        <div className="border-b border-[#132A24]/10 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#4E7A66]/10 text-[#4E7A66] mb-4">
            <Shield size={13} /> Official Privacy Charter
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-normal text-[#132A24] tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-xs md:text-sm text-[#132A24]/60">
            Effective Date: January 1, 2025 · Last Updated: September 29, 2026 · Complies with Google API User Data Policy & Indian DPDPA
          </p>
        </div>

        {/* Highlight Callout: Google Limited Use Notice */}
        <div className="p-6 rounded-2xl bg-white border border-[#4E7A66]/30 shadow-xs mb-10 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#132A24]">
            <CheckCircle2 size={18} className="text-[#4E7A66]" />
            <span>Google API Services User Data Policy Compliance</span>
          </div>
          <p className="text-xs md:text-sm text-[#132A24]/80 leading-relaxed">
            Ingress Within's use and transfer to any other app of information received from Google APIs will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4E7A66] font-semibold underline underline-offset-2 hover:text-[#132A24]"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements. We never sell your Google data, never use it for targeted advertising, and never use it to train generalized AI/ML models without your explicit consent.
          </p>
        </div>

        {/* Policy Sections */}
        <article className="prose prose-slate max-w-none space-y-10 text-sm md:text-base leading-relaxed text-[#132A24]/85">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl md:text-2xl font-normal text-[#132A24] border-b border-[#132A24]/10 pb-2">
              1. Introduction & Overview
            </h2>
            <p>
              Welcome to <strong>Ingress Within</strong> (<a href="https://ingresswithin.com" className="text-[#4E7A66] underline">https://ingresswithin.com</a>). Ingress Within is a psychological wellness platform providing guided self-reflection, psychometric inquiry, emotional pattern recognition, and teletherapy session coordination with licensed mental health practitioners in India.
            </p>
            <p>
              We believe your emotional reflections and mental health journey are deeply personal. This Privacy Policy details our transparent commitments: what data we collect, how it is secured, how Google Calendar and Google Meet integrations function, and how you retain complete ownership and control over your records.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="font-serif text-xl md:text-2xl font-normal text-[#132A24] border-b border-[#132A24]/10 pb-2">
              2. Information We Collect
            </h2>
            <p>We only collect information strictly required to provide our reflective and teletherapy services:</p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>Authentication & Profile Data:</strong> Mobile phone number (verified via one-time OTP for passwordless login), preferred name or alias, age bracket, and profile preferences.
              </li>
              <li>
                <strong>Journaling & Self-Work Data:</strong> Personal journal entries, emotional check-ins, psychometric questionnaire responses (e.g., OCEAN Big Five traits, MHPI psychological scores), and prompt answers.
              </li>
              <li>
                <strong>Therapy & Clinical Records:</strong> Client intake questionnaires, appointment booking schedules, SOAP session notes written by consulting therapists, and clinical care status.
              </li>
              <li>
                <strong>Google Account & Calendar Data (Optional):</strong> When you explicitly connect your Google Calendar, we collect your authorized Google email address and query external event start/end timestamps (Free/Busy intervals) to prevent scheduling conflicts.
              </li>
              <li>
                <strong>Transactional & Billing Data:</strong> Payment order identifiers, transaction amounts, and refund records processed securely through Razorpay. We <em>never</em> see or store debit/credit card numbers or banking PINs.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-4 bg-white p-6 md:p-8 rounded-2xl border border-[#132A24]/10">
            <div className="flex items-center gap-2 text-base font-semibold text-[#132A24]">
              <Calendar size={20} className="text-[#4E7A66]" />
              <h2 className="font-serif text-xl md:text-2xl font-normal text-[#132A24] m-0">
                3. Google Calendar & Google Meet Integration
              </h2>
            </div>
            <p className="text-sm">
              Ingress Within offers seamless integration with Google Calendar and Google Meet for therapists and clients. Here is exactly how Google user data is handled:
            </p>
            <div className="space-y-3 text-sm">
              <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#132A24]/5">
                <strong className="text-[#132A24] block mb-1">Scopes Requested:</strong>
                <code className="text-xs bg-[#132A24]/5 px-2 py-0.5 rounded text-[#132A24]">
                  https://www.googleapis.com/auth/calendar.events
                </code>
                <span className="mx-2 text-xs text-[#132A24]/40">and</span>
                <code className="text-xs bg-[#132A24]/5 px-2 py-0.5 rounded text-[#132A24]">
                  https://www.googleapis.com/auth/userinfo.email
                </code>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm">
                <li>
                  <strong>Busy Slot Detection:</strong> We inspect start and end times of external calendar events to prevent clients from booking when a therapist is occupied. <em>We strictly strip and discard all event summaries, descriptions, attendee emails, and personal details.</em>
                </li>
                <li>
                  <strong>Automated Session Events & Google Meet:</strong> When an appointment is booked and paid for, our system creates a calendar event on the consulting therapist's calendar with an official Google Meet conference link (<code>meet.google.com/...</code>) and updates the client's session details.
                </li>
                <li>
                  <strong>Token Security:</strong> Google OAuth 2.0 access and refresh tokens are encrypted at rest using industry-standard AES-256 encryption. They are stored with strict Row-Level Security (RLS) and are never exposed in client JavaScript.
                </li>
                <li>
                  <strong>Revocation & Disconnection:</strong> You can disconnect your Google Calendar at any time with one click from Settings or the Calendar view. Upon disconnection, all stored tokens are permanently deleted from our database.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="font-serif text-xl md:text-2xl font-normal text-[#132A24] border-b border-[#132A24]/10 pb-2">
              4. Artificial Intelligence & Processing Boundaries
            </h2>
            <p>
              Ingress Within uses advanced language models (e.g. Anthropic Claude) strictly to provide reflective questions, summarize weekly themes, and calculate structured emotional indices.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>Zero Training on Personal Data:</strong> We maintain strict commercial API agreements that prohibit AI vendors from using your journal entries or personal data to train public or foundational models.
              </li>
              <li>
                <strong>Client Self-Work Privacy Boundary:</strong> Private journal entries and self-guided reflections are exclusively accessible by the client. Even when connected with a consulting therapist, a client's private journals are <em>never</em> visible to the therapist unless explicitly shared by the client.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="font-serif text-xl md:text-2xl font-normal text-[#132A24] border-b border-[#132A24]/10 pb-2">
              5. Data Security & Storage Architecture
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white border border-[#132A24]/10 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-xs text-[#4E7A66]">
                  <Lock size={15} /> Encryption at Rest & Transit
                </div>
                <p className="text-xs text-[#132A24]/75">
                  All HTTP transmissions are encrypted with TLS 1.3. Journal contents are encrypted at the field level with AES-256-GCM.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#132A24]/10 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-xs text-[#4E7A66]">
                  <Shield size={15} /> Strict Database RLS Isolation
                </div>
                <p className="text-xs text-[#132A24]/75">
                  PostgreSQL Row-Level Security (RLS) ensures each user’s records can only be queried by their verified cryptographic JWT session.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="font-serif text-xl md:text-2xl font-normal text-[#132A24] border-b border-[#132A24]/10 pb-2">
              6. Your Rights & Data Deletion
            </h2>
            <p>
              You maintain total authority over your personal information. Under India’s Digital Personal Data Protection Act (DPDPA 2023) and global privacy principles, you have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li><strong>Inspect & Export:</strong> Request a complete machine-readable archive of all journal entries, assessment scores, and appointment history.</li>
              <li><strong>Correction:</strong> Update personal details or communication preferences at any time.</li>
              <li><strong>Permanent Account Deletion:</strong> You can permanently wipe your account directly from <em>Settings &gt; Delete Account</em>. This immediately deletes all journal entries, reflection history, OAuth tokens, and session records with zero retention.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h2 className="font-serif text-xl md:text-2xl font-normal text-[#132A24] border-b border-[#132A24]/10 pb-2">
              7. Children's Privacy
            </h2>
            <p>
              Ingress Within is designed for individuals aged 18 and older. We do not knowingly collect or solicit personal information from minors under 18 years of age without verifiable parental consent.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-4 bg-white p-6 rounded-2xl border border-[#132A24]/10">
            <h2 className="font-serif text-xl md:text-2xl font-normal text-[#132A24] border-b border-[#132A24]/10 pb-2 m-0">
              8. Grievance Officer & Contact Information
            </h2>
            <p className="text-sm">
              If you have any questions, feedback, or grievances regarding your data privacy, please contact our designated Grievance Officer:
            </p>
            <div className="space-y-1.5 text-xs md:text-sm text-[#132A24]/80">
              <p><strong>Entity:</strong> Ingress Within</p>
              <p><strong>Website:</strong> <a href="https://ingresswithin.com" className="text-[#4E7A66] underline">https://ingresswithin.com</a></p>
              <p><strong>Privacy Inquiries:</strong> <a href="mailto:privacy@ingresswithin.com" className="text-[#4E7A66] underline">privacy@ingresswithin.com</a></p>
              <p><strong>General Support:</strong> <a href="mailto:hello@ingresswithin.com" className="text-[#4E7A66] underline">hello@ingresswithin.com</a></p>
              <p><strong>Location:</strong> Mumbai, Maharashtra, India</p>
            </div>
          </section>

        </article>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-[#132A24]/10 text-center text-xs text-[#132A24]/50 space-y-2">
          <p>© {new Date().getFullYear()} Ingress Within. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 text-[#4E7A66]">
            <a href="/terms" className="hover:underline">Terms of Service</a>
            <span>·</span>
            <a href="/privacy-policy" className="hover:underline font-semibold">Privacy Policy</a>
            <span>·</span>
            <a href="/" className="hover:underline">Home</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
