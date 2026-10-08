'use client';

import React, { useEffect } from 'react';
import { ArrowLeft, ShieldCheck, AlertCircle, FileText, Scale, Clock, RefreshCw } from 'lucide-react';

export default function TermsOfServiceView() {
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
            <Scale size={13} /> Terms of Use & Clinical Charter
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-normal text-[#132A24] tracking-tight mb-3">
            Terms of Service
          </h1>
          <p className="text-xs md:text-sm text-[#132A24]/60">
            Effective Date: January 1, 2025 · Last Updated: September 29, 2026 · Governed by the Laws of India
          </p>
        </div>

        {/* Critical Emergency Disclaimer Callout */}
        <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-xs mb-10 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
            <AlertCircle size={18} className="text-amber-700 shrink-0" />
            <span>CRITICAL: Not an Emergency or Crisis Response Service</span>
          </div>
          <p className="text-xs md:text-sm text-amber-900/90 leading-relaxed">
            Ingress Within is a psychological reflection and scheduled teletherapy matching platform. <strong>It is NOT an emergency response facility, psychiatric hospital, or suicide prevention hotline.</strong> If you or someone you know is in immediate danger, experiencing acute distress, or having thoughts of self-harm, please immediately contact emergency services:
          </p>
          <div className="grid sm:grid-cols-3 gap-3 pt-2 text-xs font-semibold text-amber-950">
            <div className="p-2.5 bg-white/80 rounded-lg border border-amber-200/80">
              Tele-MANAS: <span className="text-[#8A3020]">14416 / 1800-891-4416</span>
            </div>
            <div className="p-2.5 bg-white/80 rounded-lg border border-amber-200/80">
              Vandrevala Foundation: <span className="text-[#8A3020]">+91 9999 666 555</span>
            </div>
            <div className="p-2.5 bg-white/80 rounded-lg border border-amber-200/80">
              National Emergency: <span className="text-[#8A3020]">112</span>
            </div>
          </div>
        </div>

        {/* Terms Sections */}
        <article className="prose prose-slate max-w-none space-y-10 text-sm md:text-base leading-relaxed text-[#132A24]/85">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl md:text-2xl font-normal text-[#132A24] border-b border-[#132A24]/10 pb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or creating an account on <strong>Ingress Within</strong> (<a href="https://ingresswithin.com" className="text-[#4E7A66] underline">https://ingresswithin.com</a>), you acknowledge that you have read, understood, and agreed to be legally bound by these Terms of Service and our <a href="/privacy-policy" className="text-[#4E7A66] underline">Privacy Policy</a>. If you do not agree to these terms, you must discontinue using the platform immediately.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl md:text-2xl font-normal text-[#132A24] border-b border-[#132A24]/10 pb-2">
              2. Eligibility & User Accounts
            </h2>
            <p>
              You must be at least 18 years of age and legally competent to enter into a binding contract under the Indian Contract Act, 1872. Accounts are accessed passwordlessly via a verified mobile phone number with SMS OTP. You are responsible for maintaining the confidentiality of your device and notifying Ingress Within immediately of any unauthorized access.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="font-serif text-xl md:text-2xl font-normal text-[#132A24] border-b border-[#132A24]/10 pb-2">
              3. Teletherapy Services & Independent Practitioners
            </h2>
            <p>
              Ingress Within facilitates connections between clients and independent consulting psychologists/therapists.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>Independent Practitioner Relationship:</strong> Mental health practitioners on Ingress Within are independent clinical contractors, not employees. While Ingress Within verifies relevant degree certificates, RCI registrations, and clinical qualifications prior to platform onboarding, the therapeutic relationship is solely between the therapist and the client.
              </li>
              <li>
                <strong>Non-Medical Scope:</strong> Teletherapy sessions are intended for psychological counseling, emotional regulation, and psychotherapy. Therapists do not prescribe scheduled pharmacological drugs on this platform.
              </li>
              <li>
                <strong>Client Self-Work Privacy:</strong> Your private journal entries, psychometric responses, and self-guided exercises remain strictly confidential and are never revealed to therapists without your explicit consent.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-4 bg-white p-6 md:p-8 rounded-2xl border border-[#132A24]/10">
            <div className="flex items-center gap-2 text-base font-semibold text-[#132A24]">
              <Clock size={20} className="text-[#4E7A66]" />
              <h2 className="font-serif text-xl md:text-2xl font-normal text-[#132A24] m-0">
                4. Session Bookings, Rescheduling & Refund Policy
              </h2>
            </div>
            <p className="text-sm">
              Our cancellation and refund policies are automated and transparent, strictly protecting both client rights and practitioner time commitments:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-xs md:text-sm pt-2">
              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10 space-y-1.5">
                <strong className="text-[#132A24] block font-semibold text-sm">
                  Cancellations ≥ 48 Hours Prior
                </strong>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#4E7A66]/10 text-[#4E7A66]">
                  100% AUTOMATED REFUND
                </span>
                <p className="text-[#132A24]/75">
                  Clients receive an automated full refund (100% of the session fee including GST) credited back to their original payment method within 5–7 banking days via Razorpay.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10 space-y-1.5">
                <strong className="text-[#132A24] block font-semibold text-sm">
                  Rescheduling ≥ 24 Hours Prior
                </strong>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#4E7A66]/10 text-[#4E7A66]">
                  FREE RESCHEDULING
                </span>
                <p className="text-[#132A24]/75">
                  Clients may reschedule an appointment to any available therapist slot up to 24 hours prior to the session start time without incurring penalty fees.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10 space-y-1.5">
                <strong className="text-[#132A24] block font-semibold text-sm">
                  Cancellations &lt; 48h / Client No-Show
                </strong>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  NON-REFUNDABLE
                </span>
                <p className="text-[#132A24]/75">
                  Because the practitioner has reserved their time exclusively, late cancellations (&lt; 48 hours) and client no-shows are non-refundable. The therapist fee is disbursed to the practitioner.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#132A24]/10 space-y-1.5">
                <strong className="text-[#132A24] block font-semibold text-sm">
                  Therapist No-Show or Cancellation
                </strong>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#4E7A66]/10 text-[#4E7A66]">
                  100% REFUND OR PRIORITY REBOOK
                </span>
                <p className="text-[#132A24]/75">
                  If a therapist cancels or fails to attend a session, the client is granted an immediate 100% refund or priority booking at no additional charge.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="font-serif text-xl md:text-2xl font-normal text-[#132A24] border-b border-[#132A24]/10 pb-2">
              5. Google Calendar & Google Meet Integration
            </h2>
            <p>
              By connecting your Google Account via OAuth 2.0, you authorize Ingress Within to create Google Calendar events and Google Meet links for booked sessions, and to query external free/busy availability. You may disconnect your calendar at any time via your dashboard. Our handling of Google user data strictly adheres to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4E7A66] font-semibold underline"
              >
                Google API Services User Data Policy
              </a>
              .
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl md:text-2xl font-normal text-[#132A24] border-b border-[#132A24]/10 pb-2">
              6. User Content & Intellectual Property
            </h2>
            <p>
              <strong>You retain 100% intellectual property ownership</strong> over all personal reflections, journal entries, and thoughts submitted on Ingress Within. We do not claim any copyright over your personal writings.
            </p>
            <p>
              Ingress Within retains all intellectual property rights to the platform design, psychometric algorithms, software, trademarks, logos, and UI components. You may not reverse engineer, copy, or scrape the platform.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl md:text-2xl font-normal text-[#132A24] border-b border-[#132A24]/10 pb-2">
              7. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, Ingress Within, its founders, and affiliates shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from your use of the platform. The platform is provided on an "as-is" and "as-available" basis without warranties of any kind.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-4 bg-white p-6 rounded-2xl border border-[#132A24]/10">
            <h2 className="font-serif text-xl md:text-2xl font-normal text-[#132A24] border-b border-[#132A24]/10 pb-2 m-0">
              8. Governing Law & Dispute Resolution
            </h2>
            <p className="text-sm">
              These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any legal disputes arising out of or related to these Terms or the platform shall be subject to the exclusive jurisdiction of the competent courts in <strong>Mumbai, Maharashtra, India</strong>.
            </p>
            <div className="pt-2 text-xs md:text-sm text-[#132A24]/80 space-y-1">
              <p><strong>Legal Inquiries:</strong> <a href="mailto:legal@ingresswithin.com" className="text-[#4E7A66] underline">legal@ingresswithin.com</a></p>
              <p><strong>General Support:</strong> <a href="mailto:hello@ingresswithin.com" className="text-[#4E7A66] underline">hello@ingresswithin.com</a></p>
            </div>
          </section>

        </article>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-[#132A24]/10 text-center text-xs text-[#132A24]/50 space-y-2">
          <p>© {new Date().getFullYear()} Ingress Within. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 text-[#4E7A66]">
            <a href="/terms" className="hover:underline font-semibold">Terms of Service</a>
            <span>·</span>
            <a href="/privacy-policy" className="hover:underline">Privacy Policy</a>
            <span>·</span>
            <a href="/" className="hover:underline">Home</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
