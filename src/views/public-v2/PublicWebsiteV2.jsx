import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WatercolorBackground from '../../components/public-v2/WatercolorBackground';
import EditorialNavbar from '../../components/public-v2/EditorialNavbar';
import ThreeWaysSection from '../../components/public-v2/ThreeWaysSection';
import AIHumanBoundaryDiagram from '../../components/public-v2/AIHumanBoundaryDiagram';
import DashboardScrollPreview from '../../components/public-v2/DashboardScrollPreview';
import PublicFooter from '../../components/public-v2/PublicFooter';
import { getCardEmergence } from '../../utils/cardEmergence';

/**
 * Ingress Within Public Website UI V2
 * Complete transformation of the source HTML content into the premium editorial /
 * watercolour / psychological self-reflection design system shown in reference screenshots.
 */
export default function PublicWebsiteV2({ initialTab = 'home', onOpenPolicy }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedChips, setSelectedChips] = useState(new Set());
  const [orientDate, setOrientDate] = useState('');
  const [orientTime, setOrientTime] = useState('10:00 AM');
  const [bookingNotice, setBookingNotice] = useState('');

  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(initialTab);
  }

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      const urlMap = {
        home: '/',
        solution: '/solution',
        how: '/how-it-works',
        pricing: '/pricing',
        ai: '/ai-data',
        evidence: '/evidence',
        about: '/about',
        policies: '/policies',
        start: '/start',
        crisis: '/crisis'
      };
      const newPath = urlMap[tabId] || `/${tabId}`;
      window.history.pushState({}, '', newPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleFamiliarChip = (chip) => {
    const next = new Set(selectedChips);
    if (next.has(chip)) next.delete(chip);
    else next.add(chip);
    setSelectedChips(next);
  };

  const handleAuthRedirect = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  // -------------------------------------------------------------
  // TAB 1: HOME
  // -------------------------------------------------------------
  const renderHome = () => (
    <div className="space-y-0">
      
      {/* 1. HERO SECTION & DASHBOARD PREVIEW */}
      <section className="relative w-full">

        {/* Hero Header Container (Centered vertically and horizontally in initial viewport) */}
        <div
          className="relative z-10 flex flex-col justify-center items-center text-center px-6 sm:px-10 max-w-5xl 2xl:max-w-[1340px] mx-auto pointer-events-auto"
          style={{ minHeight: 'calc(100vh - 5.5rem)' }}
        >
          <div className="w-full flex flex-col items-center justify-center text-center my-auto py-8 sm:py-12 space-y-6">
            {/* Headline matching user reference image */}
            <h1 className="font-editorial text-4xl sm:text-6xl md:text-[68px] text-[#162723] font-normal tracking-tight leading-[1.08] max-w-4xl mx-auto text-center">
              Whatever brings you here, <br className="hidden sm:inline" />
              <span className="italic text-[#795663]">you can start there.</span>
            </h1>

            {/* Subtitle from user reference */}
            <p className="font-zen text-base sm:text-lg md:text-xl text-[#5C6873] max-w-2xl sm:max-w-3xl mx-auto leading-relaxed text-center">
              A continuous psychological growth ecosystem that brings together self-guided learning, therapist support and AI guidance, all in one place.
            </p>

            {/* Dual Action CTAs: 2 Types Only */}
            <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full mx-auto">
              <a
                href="/login"
                onClick={handleAuthRedirect}
                className="w-full sm:w-auto min-w-[270px] inline-flex items-center justify-center gap-2.5 bg-[#162723] hover:bg-[#203631] text-white font-zen text-sm sm:text-[15px] font-semibold px-7 sm:px-8 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer text-center whitespace-nowrap"
              >
                <span>Start your independent journey</span>
                <span className="text-base">→</span>
              </a>
              <button
                type="button"
                onClick={() => handleSelectTab('start')}
                className="w-full sm:w-auto min-w-[270px] inline-flex items-center justify-center gap-2.5 bg-[#FAF7F2] hover:bg-white text-[#162723] border border-[#795663]/30 hover:border-[#795663]/60 font-zen text-sm sm:text-[15px] font-semibold px-7 sm:px-8 py-3.5 rounded-full shadow-xs hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] text-center whitespace-nowrap"
              >
                <span>Start with a professional</span>
                <span className="text-base text-[#795663]">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Preview Section */}
        <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-8 w-full pb-20 sm:pb-32">
          <DashboardScrollPreview onActionClick={handleAuthRedirect} />
        </div>
      </section>

      {/* 2. SECTION 02: THREE WAYS TO WORK ON YOUR MENTAL HEALTH */}
      <ThreeWaysSection onSelectTab={handleSelectTab} />

      {/* 7. SOUND FAMILIAR? (With Staggered Floating Chips Scroll Reveal) */}
      <section className="py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-rose">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl mx-auto text-center space-y-6"
        >
          <div className="flex flex-col items-center">
            <div className="badge-rose inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border">
              SOUND FAMILIAR?
            </div>
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl text-[#162723] font-normal leading-snug">
            Most of this starts as{' '}
            <span className="italic accent-rose">ordinary life</span>,{' '}
            not a clinical complaint.
          </h2>
          <div className="pt-4 flex flex-wrap justify-center gap-3">
            {[
              '"Log kya kahenge"',
              '"Beta, adjust kar lo"',
              'Saying yes when you mean no',
              'Being the strong one for everyone else',
              'Guilt about resting'
            ].map((chip, idx) => {
              const active = selectedChips.has(chip);
              return (
                <motion.button
                  key={chip}
                  type="button"
                  initial={{ opacity: 0, y: 20, scale: 0.92 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.06 * idx }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleFamiliarChip(chip)}
                  className={`font-zen text-xs sm:text-[13.5px] px-5 py-2.5 rounded-full border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#795663] text-white border-transparent shadow-sm'
                      : 'bg-white text-[#162723] border-[#E7DECF] hover:border-[#795663]/40'
                  }`}
                >
                  {chip}
                </motion.button>
              );
            })}
          </div>

          {/* Distinct Action Block for Sound Familiar */}
          <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-[#E7DECF]/70 max-w-4xl mx-auto flex flex-col items-center space-y-4">
            <p className="font-zen text-xs sm:text-sm text-[#5C6873]">
              Start working through these patterns:
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full">
              <a
                href="/login"
                onClick={handleAuthRedirect}
                className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 bg-[#162723] hover:bg-[#203631] text-white font-zen text-xs sm:text-sm font-semibold px-6 sm:px-7 py-3 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
              >
                <span>Reflect on these moments on your own</span>
                <span>→</span>
              </a>
              <button
                type="button"
                onClick={() => handleSelectTab('start')}
                className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#162723] border border-[#795663]/30 hover:border-[#795663]/60 font-zen text-xs sm:text-sm font-semibold px-6 sm:px-7 py-3 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
              >
                <span>Talk through this with a therapist</span>
                <span className="text-[#795663]">→</span>
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 8. WHY PEOPLE START HERE (3 Cards Splitting Animation) */}
      <section className="relative py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-fog">
        <div className="max-w-6xl mx-auto space-y-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="text-center space-y-3"
          >
            <div className="flex flex-col items-center">
              <div className="badge-fog inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border">
                WHY PEOPLE START HERE
              </div>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#162723] font-normal">
              Three common <span className="italic accent-fog">starting points</span>.
            </h2>
          </motion.div>

          {/* 3 Quote Cards: Odd total (3) -> Center card 1 anchors, Cards 0 and 2 emerge out from the center */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              {
                num: '01',
                tag: 'SELF-WORK FIRST',
                quote: '"I just want to understand myself first."',
                desc: 'Not ready for therapy, but want more than guessing at why you feel a certain way.',
                cta: 'Start self-work'
              },
              {
                num: '02',
                tag: 'RETURNING TO CARE',
                quote: '"I don\'t want to repeat my whole story again."',
                desc: 'Been to therapy before, tired of starting from zero with someone new.',
                cta: 'With a therapist'
              },
              {
                num: '03',
                tag: 'BETWEEN SESSIONS',
                quote: '"I have a therapist, but weeks in between feel unsupported."',
                desc: 'Want somewhere structured to put thoughts and milestones down between sessions.',
                cta: 'Use both'
              }
            ].map((card, idx) => (
              <motion.div
                key={card.num}
                {...getCardEmergence(idx, 3)}
                className="card-hover-fog group relative rounded-xl p-6 sm:p-7 min-h-[190px] sm:min-h-[210px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs cursor-pointer"
              >
                <div>
                  {/* Top Bar: Minimal Tag Pill & Number */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                      {card.tag}
                    </span>
                    <span className="font-mono-code text-[10px] tracking-wider text-[#8D98A3]">
                      {card.num}
                    </span>
                  </div>

                  {/* Quote Headline */}
                  <h3 className="font-editorial text-base sm:text-[17px] text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                    {card.quote}
                  </h3>

                  {/* Description */}
                  <p className="font-zen text-xs sm:text-[12.5px] text-[#5C6873] leading-relaxed">
                    {card.desc}
                  </p>
                </div>

              </motion.div>
            ))}
          </div>

          {/* Dual CTAs after Starting Points */}
          <div className="pt-8 sm:pt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full">
            <a
              href="/login"
              onClick={handleAuthRedirect}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 bg-[#162723] hover:bg-[#203631] text-white font-zen text-xs sm:text-sm font-semibold px-6 sm:px-7 py-3 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>Begin private self-reflection</span>
              <span>→</span>
            </a>
            <button
              type="button"
              onClick={() => handleSelectTab('start')}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#162723] border border-[#795663]/30 hover:border-[#795663]/60 font-zen text-xs sm:text-sm font-semibold px-6 sm:px-7 py-3 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>Book a confidential therapy session</span>
              <span className="text-[#795663]">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* 9. A QUICK LOOK (3 Steps Flow: Odd total (3) -> Center Step 02 anchors, Steps 01 and 03 emerge out from center) */}
      <section className="relative py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-royal">
        <div className="max-w-5xl mx-auto text-center space-y-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3"
          >
            <div className="flex flex-col items-center">
              <div className="badge-royal inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border">
                A QUICK LOOK
              </div>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#162723] font-normal">
              From a journal entry to a <span className="italic accent-royal">clearer pattern</span>, in three steps.
            </h2>
          </motion.div>

          {/* 3 Step Flow Container */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="paper-card rounded-2xl py-10 sm:py-14 px-6 sm:px-10 bg-white border border-[#E7DECF] shadow-xs"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {[
                {
                  num: '01',
                  tag: 'INPUT',
                  title: 'Write',
                  desc: 'A few minutes a day, guided or free-flow.'
                },
                {
                  num: '02',
                  tag: 'REFLECTION',
                  title: 'See the report',
                  desc: 'Weekly summary surfaces themes, tone shifts, and recurring patterns.'
                },
                {
                  num: '03',
                  tag: 'INTEGRATION',
                  title: 'Understand, act',
                  desc: 'Conscious choices aligned with your values.'
                }
              ].map((step, idx) => (
                <motion.div
                  key={step.num}
                  {...getCardEmergence(idx, 3)}
                  className="card-hover-royal group relative rounded-xl p-6 sm:p-7 min-h-[180px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs text-left"
                >
                  <div>
                    {/* Top Bar: Minimal Tag Pill & Step Number */}
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                        STEP {step.num}
                      </span>
                      <span className="font-mono-code text-[10px] tracking-wider text-[#8D98A3]">
                        {step.tag}
                      </span>
                    </div>

                    {/* Step Title */}
                    <h3 className="font-editorial text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                </motion.div>
              ))}
            </div>

            <div className="pt-8 flex flex-col items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => handleSelectTab('how')}
                className="text-xs sm:text-sm font-editorial text-[#795663] hover:underline font-medium cursor-pointer"
              >
                See the full walkthrough, including therapy →
              </button>
              <a
                href="/login"
                onClick={handleAuthRedirect}
                className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 bg-[#162723] hover:bg-[#203631] text-white font-zen text-xs sm:text-sm font-semibold px-6 sm:px-7 py-3.5 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
              >
                <span>Start your Journal</span>
                <span>→</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 10. PRICING IN SHORT: Even total (2 cards) -> Both split smoothly from the center outward */}
      <section className="relative py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-thistle">
        <div className="max-w-5xl mx-auto space-y-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="text-center space-y-3"
          >
            <div className="flex flex-col items-center">
              <div className="badge-thistle inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border">
                PRICING, IN SHORT
              </div>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#162723] font-normal">
              Simple, <span className="italic accent-thistle">transparent</span>, in rupees.
            </h2>
          </motion.div>

          {/* Two Pricing Cards: Even total (2) -> Both split smoothly from the center outward */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* Plan 1 */}
            <motion.div
              {...getCardEmergence(0, 2)}
              className="group relative rounded-xl p-7 sm:p-8 min-h-[290px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between space-y-6 transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    SELF-WORK
                  </span>
                  <span className="font-mono-code text-[10px] tracking-wider text-[#8D98A3]">
                    MONTHLY
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="font-mono-code text-4xl text-[#795663] font-semibold">₹499</span>
                  <span className="font-zen text-xs text-[#5C6873]">/ month (GST inclusive)</span>
                </div>
                <p className="font-zen text-xs sm:text-sm text-[#5C6873] leading-relaxed pt-3">
                  Journal, weekly & monthly reports included. Psychoeducation modules purchased separately, only when relevant.
                </p>
              </div>
              <a
                href="/login"
                onClick={handleAuthRedirect}
                className="w-full text-center py-3 bg-[#FAF7F2] hover:bg-[#162723] hover:text-white text-[#162723] border border-[#E7DECF] rounded-full text-xs font-semibold cursor-pointer transition-all font-zen"
              >
                Start self-guided work →
              </a>
            </motion.div>

            {/* Plan 2 */}
            <motion.div
              {...getCardEmergence(1, 2)}
              className="group relative rounded-xl p-7 sm:p-8 min-h-[290px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between space-y-6 transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    WITH A THERAPIST
                  </span>
                  <span className="font-mono-code text-[10px] tracking-wider text-[#8D98A3]">
                    PER SESSION
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="font-mono-code text-4xl text-[#162723] font-semibold">From ₹999</span>
                  <span className="font-zen text-xs text-[#5C6873]">/ session</span>
                </div>
                <p className="font-zen text-xs sm:text-sm text-[#5C6873] leading-relaxed pt-3">
                  Licensed, verified therapists. Shared milestone dashboards and homework continuity. No lock-in packages.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSelectTab('start')}
                className="w-full text-center py-3 bg-[#FAF7F2] hover:bg-[#162723] hover:text-white text-[#162723] border border-[#E7DECF] rounded-full text-xs font-semibold cursor-pointer transition-all font-zen"
              >
                Book therapist session →
              </button>
            </motion.div>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => handleSelectTab('pricing')}
              className="text-xs sm:text-sm font-editorial text-[#795663] hover:underline font-medium cursor-pointer"
            >
              See full pricing details →
            </button>
          </div>
        </div>
      </section>

      {/* 11. PHILOSOPHY / CLOSING STATEMENT BAND */}
      <section data-dark-section="true" className="py-28 sm:py-36 px-6 sm:px-8 lg:px-12 bg-[#011627] text-white text-center relative overflow-hidden border-t border-[#F6F1EA]/10 border-b border-[#F6F1EA]/10">
        {/* Understated hairline brand boundary dividers */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-[#B8964A]/25 to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-[#66876A]/20 to-transparent" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto space-y-6 relative z-10"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="inline-block font-mono-code text-[10.5px] tracking-[0.2em] uppercase text-[#B8964A] font-semibold bg-[#B8964A]/10 border border-[#B8964A]/20 px-4 py-1.5 rounded-full">
              UNDERSTAND. GROW. CONTINUE.
            </div>
          </div>
          <h2 className="font-editorial text-3xl sm:text-5xl font-normal leading-tight text-white">
            The philosophy behind the platform:{' '}
            <span className="italic text-[#B8964A]/90">not a sequence</span>{' '}you have to follow.
          </h2>
          <p className="font-zen text-sm sm:text-base text-[#C7CDD3] max-w-2xl sm:max-w-3xl mx-auto leading-relaxed pt-2">
            You might start with therapy. You might start by practising. You might just want to know what's going on. Ingress Within meets you where you are.
          </p>
          <div className="pt-8 sm:pt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full">
            <a
              href="/login"
              onClick={handleAuthRedirect}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 bg-white text-[#011627] hover:bg-[#FAF7F2] font-zen text-xs sm:text-sm font-semibold px-6 sm:px-7 py-3.5 rounded-full transition-all cursor-pointer shadow-sm hover:scale-[1.02] text-center whitespace-nowrap"
            >
              <span>Walk your own path first</span>
            </a>
            <button
              type="button"
              onClick={() => handleSelectTab('start')}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/25 hover:border-white/50 font-zen text-xs sm:text-sm font-semibold px-6 sm:px-7 py-3.5 rounded-full transition-all cursor-pointer hover:scale-[1.02] text-center whitespace-nowrap"
            >
              <span>Begin with therapist guidance</span>
            </button>
          </div>
        </motion.div>
      </section>

    </div>
  );

  // -------------------------------------------------------------
  // TAB 2: SOLUTION / WHAT IT IS
  // -------------------------------------------------------------
  const renderSolution = () => (
    <div className="w-full space-y-0">
      
      {/* 1. HERO SECTION (Subtle Parchment Gradient with Watercolor Bleeds & Brushstroke) */}
      <section className="relative w-full min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-5.5rem)] flex flex-col justify-center items-center py-16 sm:py-20 px-6 sm:px-8 lg:px-12 overflow-hidden">
        {/* Ambient Top-Right Watercolor Wash (Dusty Rose) */}
        <svg
          className="absolute -top-16 -right-20 w-[420px] sm:w-[540px] h-auto opacity-60 pointer-events-none mix-blend-multiply"
          viewBox="0 0 600 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="sol-rose-wash" cx="70%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#C49A8F" stopOpacity="0.38" />
              <stop offset="45%" stopColor="#D9BCAF" stopOpacity="0.22" />
              <stop offset="75%" stopColor="#EFE3DE" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
            </radialGradient>
            <filter id="sol-bleed-1" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>
          <path
            d="M500 40 C410 0 300 50 240 130 C180 210 180 320 230 400 C290 470 410 500 500 460 C580 420 620 320 630 210 C640 120 590 60 500 40 Z"
            fill="url(#sol-rose-wash)"
            filter="url(#sol-bleed-1)"
          />
          <circle cx="210" cy="180" r="3.5" fill="#C49A8F" opacity="0.28" />
          <circle cx="240" cy="220" r="2.5" fill="#C49A8F" opacity="0.22" />
          <circle cx="180" cy="270" r="4" fill="#C49A8F" opacity="0.18" />
        </svg>

        {/* Ambient Top-Left Watercolor Wash (Sage Green) */}
        <svg
          className="absolute -top-12 -left-16 w-[380px] sm:w-[480px] h-auto opacity-55 pointer-events-none mix-blend-multiply"
          viewBox="0 0 550 450"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="sol-sage-wash" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#7E9E82" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#96B49A" stopOpacity="0.2" />
              <stop offset="80%" stopColor="#C4D7C7" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path
            d="M80 50 C160 -10 290 20 380 80 C460 130 510 240 460 330 C410 410 290 440 210 420 C130 400 50 340 30 250 C10 160 10 90 80 50 Z"
            fill="url(#sol-sage-wash)"
            filter="url(#sol-bleed-1)"
          />
          <circle cx="410" cy="130" r="4" fill="#8AA688" opacity="0.25" />
          <circle cx="440" cy="160" r="2.5" fill="#8AA688" opacity="0.2" />
        </svg>

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10 w-full my-auto flex flex-col items-center justify-center">
          <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
            OUR SOLUTION
          </div>
          
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#162723] font-normal leading-[1.12] max-w-3xl sm:max-w-4xl mx-auto">
            One platform. Different ways to work on your mental health.
          </h1>

          <p className="font-zen text-base sm:text-lg text-[#5C6873] leading-relaxed max-w-2xl sm:max-w-3xl mx-auto">
            Some people just want to understand themselves better. Some want a therapist. Some want both, at different times. Here is what each path looks like in practice.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                const el = document.getElementById('sol-independent');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-mono-code font-semibold tracking-wider uppercase bg-[#162723] text-white hover:bg-[#203631] transition-all cursor-pointer shadow-xs"
            >
              <span>Explore Self-Work</span>
              <span>&rarr;</span>
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('sol-collaborative');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-mono-code font-medium tracking-wider uppercase bg-white/90 border border-[#E7DECF] text-[#162723] hover:border-[#795663] transition-all cursor-pointer shadow-2xs"
            >
              <span>Explore Therapy</span>
              <span>&darr;</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. SECTION 01: INDEPENDENT INQUIRY (Treatment B: Subtle Dynamic Thistle) */}
      <section id="sol-independent" className="relative w-full py-16 sm:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-thistle">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-3xl sm:max-w-4xl mx-auto space-y-2.5 sm:space-y-3"
          >
            <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
              INDEPENDENT INQUIRY
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[40px] text-[#162723] font-normal leading-[1.18] mx-auto">
              Write it down. Let the platform show you what you can't see day to day.
            </h2>
          </motion.div>

          {/* 3 Core Pillars: Odd total (3) -> Center card (Reports) anchors, left/right emerge outward */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            <motion.div
              {...getCardEmergence(0, 3)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[240px] sm:min-h-[260px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    JOURNAL
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    01 / 03
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  Free-flow, or a guided 5-prompt journal.
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Write freely about your day, or use the guided journal, which asks what happened, why, and how it affected you: five prompts, a few minutes a day.
                </p>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(1, 3)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[240px] sm:min-h-[260px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    REPORTS
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    02 / 03
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  Entries become reports, automatically.
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Every Sunday, a weekly report groups entries by theme, surfaces your most frequent emotional words, and notes shifts in tone. Every month, a deeper report connects themes across weeks.
                </p>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(2, 3)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[240px] sm:min-h-[260px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    PATTERNS
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    03 / 03
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  Patterns surfaced early, named clearly.
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Interventions explain what a recurring pattern or emotional word might mean, in plain language, as soon as it appears. This part is included, not a paywall. If it's still showing up after about two months, we'll suggest one focused module that speaks directly to it.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. SECTION 02: THE GUIDED JOURNAL & PROGRESS TIMELINE (Treatment B: Subtle Dynamic Dusky Rose) */}
      <section className="relative w-full py-16 sm:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-rose">
        <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10 relative z-10">
          {/* The 5 Prompts */}
          <div className="space-y-5">
            <div className="text-center max-w-3xl sm:max-w-4xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
                THE GUIDED JOURNAL
              </div>
              <h3 className="font-editorial text-2xl sm:text-3xl text-[#162723] pt-1">
                Five short prompts, so you're not staring at a blank page.
              </h3>
            </div>
            
            {/* 5 Prompts Cards: Odd total (5) -> Center card (03) anchors, others emerge outward */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
              {['What happened?', 'Why do you think so?', 'How did you react?', 'What did you feel?', 'What would you tell a friend?'].map((p, idx) => (
                <motion.div
                  key={p}
                  {...getCardEmergence(idx, 5)}
                  className="p-4 sm:p-5 bg-white/95 rounded-2xl border border-[#E7DECF] shadow-2xs text-left hover:border-[#795663]/40 transition-shadow transition-colors duration-200 flex flex-col justify-between space-y-2.5 cursor-pointer"
                >
                  <div className="inline-flex items-center font-mono-code text-[9px] tracking-[0.16em] uppercase font-semibold px-2 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/70 self-start">
                    0{idx + 1}
                  </div>
                  <p className="font-editorial text-[14px] sm:text-base text-[#162723] leading-snug font-medium">{p}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sample Weekly Report with Watercolor Chips */}
          <div className="paper-card rounded-2xl p-6 sm:p-7 bg-white border border-[#E7DECF] shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E7DECF]/80 pb-3 gap-2">
              <span className="font-mono-code text-[11px] uppercase tracking-wider text-[#795663] font-bold">
                SAMPLE WEEKLY REPORT · WEEK 3
              </span>
              <span className="font-mono-code text-xs text-[#5C6873]">5 entries recorded</span>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-3.5 py-1 rounded-full bg-[#EAF2ED] text-[#2E7A70] font-mono-code text-xs font-medium border border-[#8AA688]/30 shadow-2xs">
                Work / Boundaries (3 entries)
              </span>
              <span className="px-3.5 py-1 rounded-full bg-[#F7EFE9] text-[#795663] font-mono-code text-xs font-medium border border-[#C49A8F]/30 shadow-2xs">
                Guilt (frequent word)
              </span>
              <span className="px-3.5 py-1 rounded-full bg-[#FDF6E9] text-[#8C6D23] font-mono-code text-xs font-medium border border-[#D4AF37]/35 shadow-2xs">
                Evening (most common time)
              </span>
            </div>
            
            <p className="font-zen text-xs sm:text-sm text-[#5C6873] leading-relaxed pt-1">
              <strong className="text-[#162723] font-medium">Recurring loop:</strong> Agreeing to help others at your own cost. <strong className="text-[#162723] font-medium">Suggested focus:</strong> Notice the moment right before you say "yes."
            </p>
          </div>

          {/* How a suggestion forms diagram matching SAMPLE WEEKLY REPORT card dimensions */}
          <div className="paper-card rounded-2xl p-6 sm:p-7 bg-[#FAF8F5] border border-[#E7DECF] shadow-xs relative overflow-hidden">
            
            {/* Top Bar: Eyebrow with dash & Longitudinal pill badge */}
            <div className="flex flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-[1.5px] bg-[#8C5F6D] rounded-full inline-block" />
                <span className="font-mono-code text-[10px] sm:text-[10.5px] uppercase tracking-[0.2em] font-semibold text-[#8C7A77]">
                  HOW A <span className="text-[#6A3D4E] font-bold">SUGGESTION</span> FORMS
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-[#E3ECE5] px-3.5 py-1 rounded-full">
                <svg width="16" height="8" viewBox="0 0 20 10" fill="none" className="text-[#56795A]">
                  <path d="M1 5C4 2 6 8 10 5C14 2 16 8 19 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
                <span className="font-mono-code text-[10px] sm:text-[10.5px] text-[#4A6B4F] font-semibold tracking-wide">
                  100% From longitudinal tracking
                </span>
              </div>
            </div>
            
            {/* Heading */}
            <h3 className="font-editorial text-2xl sm:text-[32px] md:text-[35px] text-[#162723] font-normal leading-[1.12] tracking-tight mt-4 mb-2">
              Free the whole way, until <span className="italic text-[#6A3D4E]">one point.</span>
            </h3>

            {/* Visual SVG Journey Chart scaled to match full card width */}
            <div className="w-full overflow-x-auto pt-1 pb-0">
              <svg
                viewBox="0 0 823 241"
                role="img"
                aria-label="How a suggestion forms chart showing a pattern appearing in week 1, repeating through week 8, where one module is offered"
                className="w-full min-w-[620px] h-auto select-none"
              >
                <defs>
                  {/* Smooth multi-stop curve stroke gradient aligned to exact reference colors */}
                  <linearGradient id="sol-curve-grad" x1="84" y1="0" x2="747" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#526A56" />
                    <stop offset="18%" stopColor="#556E5A" />
                    <stop offset="35%" stopColor="#6D4754" />
                    <stop offset="68%" stopColor="#654C5F" />
                    <stop offset="85%" stopColor="#9A693E" />
                    <stop offset="100%" stopColor="#C4963C" />
                  </linearGradient>

                  {/* Horizontal baseline gradient matching reference transition across weeks */}
                  <linearGradient id="sol-baseline-grad" x1="29" y1="0" x2="803" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#8E998B" />
                    <stop offset="25%" stopColor="#937A82" />
                    <stop offset="60%" stopColor="#998A91" />
                    <stop offset="100%" stopColor="#C39859" />
                  </linearGradient>
                </defs>

                {/* --- Exact Physical Watercolor Wash Extracted From Reference --- */}
                <image
                  href="/chart-watercolor-wash.png"
                  x="0"
                  y="0"
                  width="823"
                  height="241"
                  preserveAspectRatio="none"
                  style={{ mixBlendMode: 'multiply' }}
                  className="pointer-events-none select-none opacity-95"
                />

                {/* Horizontal Baseline */}
                <line x1="29" y1="197" x2="803" y2="197" stroke="url(#sol-baseline-grad)" strokeWidth="1.2" />

                {/* Baseline Tick Marks */}
                <line x1="84" y1="194" x2="84" y2="200" stroke="#8E998B" strokeWidth="1.2" />
                <line x1="313" y1="194" x2="313" y2="200" stroke="#937A82" strokeWidth="1.2" />
                <line x1="538" y1="194" x2="538" y2="200" stroke="#998A91" strokeWidth="1.2" />
                <line x1="747" y1="194" x2="747" y2="200" stroke="#C39859" strokeWidth="1.2" />

                {/* Ascending Main S-Curve Line matching reference trajectory exactly */}
                <path
                  d="M 84,165 C 160,165 245,148 313,130 C 390,127 465,102 538,90 C 615,84 675,66 747,46"
                  fill="none"
                  stroke="url(#sol-curve-grad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* --- 01. WEEK 1 (Green) --- */}
                {/* Dashed vertical indicator line */}
                <line x1="84" y1="165" x2="84" y2="197" stroke="#7E9E82" strokeWidth="1.2" strokeDasharray="3 3" />
                {/* Dot with authentic white halo ring */}
                <circle cx="84" cy="165" r="6.5" fill="#587560" stroke="#FFFFFF" strokeWidth="1.8" />
                {/* Baseline Label */}
                <text x="84" y="215" textAnchor="middle" className="font-mono-code" fontFamily="monospace" fontSize="10" fontWeight="700" fill="#4B6353" letterSpacing="0.14em">
                  WEEK 1
                </text>
                {/* Handwritten Annotation: First noticed */}
                <text x="88" y="130" textAnchor="middle" className="font-handwriting" fontFamily="var(--font-hand, 'Kalam', cursive)" fontSize="14" fill="#3E5445" transform="rotate(-6 88 130)">
                  First noticed
                </text>
                {/* Curved Arrow pointing down into green dot */}
                <path d="M 96,138 Q 103,150 91,158" fill="none" stroke="#3E5445" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M 89,152 L 91,158 L 98,155" fill="none" stroke="#3E5445" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

                {/* --- 02. WEEK 3 (Plum) --- */}
                {/* Dashed vertical indicator line */}
                <line x1="313" y1="130" x2="313" y2="197" stroke="#8A5B68" strokeWidth="1.2" strokeDasharray="3 3" />
                {/* Dot with authentic white halo ring */}
                <circle cx="313" cy="130" r="6.5" fill="#6E4354" stroke="#FFFFFF" strokeWidth="1.8" />
                {/* Baseline Label */}
                <text x="313" y="215" textAnchor="middle" className="font-mono-code" fontFamily="monospace" fontSize="10" fontWeight="700" fill="#6E4354" letterSpacing="0.14em">
                  WEEK 3
                </text>
                {/* Handwritten Annotation: Repeating */}
                <text x="322" y="103" textAnchor="middle" className="font-handwriting" fontFamily="var(--font-hand, 'Kalam', cursive)" fontSize="14" fill="#6E4354" transform="rotate(-5 322 103)">
                  Repeating
                </text>
                {/* Curved Arrow pointing down into plum dot */}
                <path d="M 326,110 Q 333,121 321,126" fill="none" stroke="#6E4354" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M 319,120 L 321,126 L 328,123" fill="none" stroke="#6E4354" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

                {/* --- 03. WEEK 6 (Mauve / Slate) --- */}
                {/* Dashed vertical indicator line */}
                <line x1="538" y1="90" x2="538" y2="197" stroke="#8A5B68" strokeWidth="1.2" strokeDasharray="3 3" />
                {/* Dot with authentic white halo ring */}
                <circle cx="538" cy="90" r="6.5" fill="#63485A" stroke="#FFFFFF" strokeWidth="1.8" />
                {/* Baseline Label */}
                <text x="538" y="215" textAnchor="middle" className="font-mono-code" fontFamily="monospace" fontSize="10" fontWeight="700" fill="#4A5C66" letterSpacing="0.14em">
                  WEEK 6
                </text>
                {/* Handwritten Annotation: Intervention shown */}
                <text x="555" y="58" textAnchor="middle" className="font-handwriting" fontFamily="var(--font-hand, 'Kalam', cursive)" fontSize="14" fill="#3D505D" transform="rotate(-3 555 58)">
                  Intervention shown
                </text>
                {/* Curved Arrow pointing down into slate dot */}
                <path d="M 561,66 Q 568,77 546,85" fill="none" stroke="#3D505D" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M 545,79 L 546,85 L 553,83" fill="none" stroke="#3D505D" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

                {/* --- 04. WEEK 8 (Gold Sunburst Point) --- */}
                {/* Dashed vertical indicator line */}
                <line x1="747" y1="46" x2="747" y2="197" stroke="#C4963C" strokeWidth="1.2" strokeDasharray="3 3" />
                {/* Gold Sunburst Rays matching reference angles and lengths */}
                <line x1="760" y1="34" x2="771" y2="25" stroke="#C4963C" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="766" y1="46" x2="778" y2="46" stroke="#C4963C" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="761" y1="58" x2="771" y2="67" stroke="#C4963C" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="747" y1="28" x2="747" y2="18" stroke="#C4963C" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="764" y1="71" x2="769" y2="81" stroke="#C4963C" strokeWidth="1.8" strokeLinecap="round" />
                {/* Main Gold Dot with white halo ring */}
                <circle cx="747" cy="46" r="7" fill="#C4963C" stroke="#FFFFFF" strokeWidth="1.8" />
                {/* Baseline Label */}
                <text x="747" y="215" textAnchor="middle" className="font-mono-code" fontFamily="monospace" fontSize="10" fontWeight="700" fill="#BD8F48" letterSpacing="0.14em">
                  WEEK 8
                </text>
                {/* Handwritten Annotation: 1 module offered */}
                <text x="728" y="16" textAnchor="middle" className="font-handwriting" fontFamily="var(--font-hand, 'Kalam', cursive)" fontSize="14.5" fontWeight="bold" fill="#794255" transform="rotate(-4 728 16)">
                  1 module offered
                </text>
                {/* Curved Arrow pointing down into gold dot */}
                <path d="M 732,22 Q 741,31 743,39" fill="none" stroke="#794255" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M 737,34 L 743,39 L 747,32" fill="none" stroke="#794255" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Divider Line */}
            <div className="w-full h-px bg-[#EADFCF]/70 mt-3.5 mb-3" />

            {/* Info Box Callout with circular 'i' icon */}
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full border border-[#B8964A]/80 flex items-center justify-center text-[#B8964A] text-[10px] font-editorial italic flex-shrink-0">
                i
              </div>
              <p className="font-editorial italic text-xs sm:text-[12.5px] text-[#5C6873] leading-snug">
                Everything on the line is included with your <strong className="text-[#162723] font-semibold not-italic">₹499/month subscription</strong>. Only the single point at the end, the module, is a separate, optional purchase.
              </p>
            </div>

            {/* Dual Contextual CTAs matching exact reference proportions */}
            <div className="mt-4 flex flex-row items-center justify-center gap-3 w-full">
              <a
                href="/login"
                onClick={handleAuthRedirect}
                className="h-[38px] px-5 inline-flex items-center justify-center gap-2 bg-[#162723] hover:bg-[#203631] text-white font-zen text-xs font-medium rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
              >
                <span>Start guided daily journaling</span>
                <span>→</span>
              </a>
              <button
                type="button"
                onClick={() => handleSelectTab('start')}
                className="h-[38px] px-5 inline-flex items-center justify-center gap-2 bg-[#FAF8F5] hover:bg-[#F3ECE0] text-[#162723] border border-[#D9CEBF] hover:border-[#162723]/40 font-zen text-xs font-medium rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
              >
                <span>Bring your journal into therapy</span>
                <span className="text-[#B8964A]">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION 03: COLLABORATIVE CARE (Treatment B: Subtle Dynamic Fog Blue) */}
      <section id="sol-collaborative" className="relative w-full py-16 sm:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-fog">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-3xl sm:max-w-4xl mx-auto space-y-2.5 sm:space-y-3"
          >
            <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
              COLLABORATIVE CARE
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[40px] text-[#162723] font-normal leading-[1.18] mx-auto">
              Not just the session, but a dashboard that shows the work between sessions too.
            </h2>
          </motion.div>

          {/* 3 Collaborative Care Cards: Odd total (3) -> Center card anchors, left/right emerge outward */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            <motion.div
              {...getCardEmergence(0, 3)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[230px] sm:min-h-[240px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    YOUR DASHBOARD
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    01 / 03
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  See what happened last session, and what's due next.
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  A recap of your last session, any homework your therapist assigned, and your goals, so therapy isn't only what you remember from the room.
                </p>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(1, 3)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[230px] sm:min-h-[240px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    ASSIGNED WORK
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    02 / 03
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  Homework and psychoeducation, set by your therapist.
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Your therapist can assign homework and psychoeducation modules directly, tailored to what came up in session.
                </p>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(2, 3)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[230px] sm:min-h-[240px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    CONTINUITY
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    03 / 03
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  Keep your history if the support changes.
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Selected goals, session recaps and self-work can move with you when you change therapists.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. SECTION 04: A LOOK AT THE DASHBOARD (Treatment B: Subtle Dynamic Royal Scepter) */}
      <section className="relative w-full py-14 sm:py-16 lg:py-20 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-royal">
        {/* Watercolor wash background drop */}
        <div className="absolute top-1/3 -right-24 w-88 h-88 rounded-full bg-[#7E9E82]/10 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 relative z-10">
          <div className="text-center max-w-3xl sm:max-w-4xl mx-auto space-y-2 sm:space-y-2.5">
            <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
              A LOOK AT THE DASHBOARD
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl lg:text-[34px] text-[#162723] mx-auto leading-snug">
              What you and your therapist both see.
            </h2>
          </div>

          {/* Dual Dashboard Cards: Even total (2) -> Both split smoothly outward from center line */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            {/* Your Side */}
            <motion.div
              {...getCardEmergence(0, 2)}
              className="group relative rounded-xl p-5 sm:p-6 bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    YOUR SIDE
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    CLIENT PORTAL
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="p-3 sm:p-3.5 rounded-lg bg-white/80 border border-[#E7DECF]/80 space-y-0.5 group-hover:border-[#162723]/20 transition-colors">
                    <b className="font-editorial text-sm text-[#162723] block leading-snug">Last session: 12 Aug</b>
                    <p className="font-zen text-xs text-[#5C6873]">
                      Talked through the tension with your manager about weekend calls.
                    </p>
                  </div>
                  <div className="p-3 sm:p-3.5 rounded-lg bg-white/80 border border-[#E7DECF]/80 space-y-0.5 group-hover:border-[#162723]/20 transition-colors">
                    <b className="font-editorial text-sm text-[#162723] block leading-snug">Homework due</b>
                    <p className="font-zen text-xs text-[#5C6873]">
                      Write down one moment this week you wanted to say no and didn't.
                    </p>
                  </div>
                  <div className="p-3 sm:p-3.5 rounded-lg bg-white/80 border border-[#E7DECF]/80 space-y-0.5 group-hover:border-[#162723]/20 transition-colors">
                    <b className="font-editorial text-sm text-[#162723] block leading-snug">Psychoeducation assigned</b>
                    <p className="font-zen text-xs text-[#5C6873]">
                      Understanding people-pleasing patterns · 8 min read
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Your Therapist's Side */}
            <motion.div
              {...getCardEmergence(1, 2)}
              className="group relative rounded-xl p-5 sm:p-6 bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    THERAPIST SIDE
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    CLINICIAN VIEW
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="p-3 sm:p-3.5 rounded-lg bg-white/80 border border-[#E7DECF]/80 space-y-0.5 group-hover:border-[#162723]/20 transition-colors">
                    <b className="font-editorial text-sm text-[#162723] block leading-snug">Active client · Week 3 of care</b>
                    <p className="font-zen text-xs text-[#5C6873]">
                      Goal: Boundary-setting at work without residual guilt.
                    </p>
                  </div>
                  <div className="p-3 sm:p-3.5 rounded-lg bg-white/80 border border-[#E7DECF]/80 space-y-0.5 group-hover:border-[#162723]/20 transition-colors">
                    <b className="font-editorial text-sm text-[#162723] block leading-snug">Homework assigned</b>
                    <p className="font-zen text-xs text-[#5C6873]">
                      Due before Session 4 · 1 entry logged by client
                    </p>
                  </div>
                  <div className="p-3 sm:p-3.5 rounded-lg bg-white/80 border border-[#E7DECF]/80 space-y-0.5 group-hover:border-[#162723]/20 transition-colors">
                    <b className="font-editorial text-sm text-[#162723] block leading-snug">Client-shared entries</b>
                    <p className="font-zen text-xs text-[#5C6873]">
                      2 journal entries the client chose to share this week
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Dual Contextual CTAs for A Look at the Dashboard */}
          <div className="pt-5 sm:pt-6 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a
              href="/login"
              onClick={handleAuthRedirect}
              className="w-full sm:w-auto min-w-[240px] inline-flex items-center justify-center gap-2 bg-[#203631] hover:bg-[#162723] text-white font-zen text-xs sm:text-sm font-medium px-6 py-2.5 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center"
            >
              <span>Begin private self-work</span>
              <span>→</span>
            </a>
            <button
              type="button"
              onClick={() => handleSelectTab('start')}
              className="w-full sm:w-auto min-w-[240px] inline-flex items-center justify-center gap-2 bg-white hover:bg-[#FAF7F2] text-[#162723] border border-[#E7DECF] font-zen text-xs sm:text-sm font-medium px-6 py-2.5 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center"
            >
              <span>Start with a therapist</span>
              <span className="text-[#795663]">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* 6. SECTION 05: PSYCHOEDUCATION LIBRARY (Treatment B: Subtle Dynamic Thistle) */}
      <section className="relative w-full py-16 sm:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-thistle">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10 relative z-10">
          <div className="text-center max-w-3xl sm:max-w-4xl mx-auto space-y-2 sm:space-y-2.5">
            <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
              PSYCHOEDUCATION LIBRARY
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl lg:text-[34px] text-[#162723] mx-auto leading-snug">
              A few examples of what a module actually covers.
            </h2>
          </div>

          {/* 6 Psychoeducation Modules: Even 2D grid (6 cards) -> Splits smoothly from center in all 4 directions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              {
                title: 'Understanding people-pleasing patterns',
                desc: 'Why saying yes feels safer than saying no, and how to notice the moment before you agree.',
                tag: 'PEOPLE-PLEASING',
                duration: '8–12 MIN'
              },
              {
                title: 'Managing family expectations',
                desc: 'Working with, not against, obligation, without losing yourself in it.',
                tag: 'FAMILY SYSTEMS',
                duration: '8–12 MIN'
              },
              {
                title: 'Setting boundaries without guilt',
                desc: 'Practical language for saying no to people you care about.',
                tag: 'BOUNDARIES',
                duration: '8–12 MIN'
              },
              {
                title: 'Recognising burnout early',
                desc: 'The difference between a hard week and a pattern that needs attention.',
                tag: 'BURNOUT',
                duration: '8–12 MIN'
              },
              {
                title: 'Breaking the overthinking spiral',
                desc: 'Cognitive defusion techniques when your brain won\'t turn down the volume.',
                tag: 'RUMINATION',
                duration: '8–12 MIN'
              },
              {
                title: 'Navigating professional transitions',
                desc: 'Separating your core self-worth from temporary career uncertainty.',
                tag: 'CAREER & IDENTITY',
                duration: '8–12 MIN'
              }
            ].map((module, idx) => (
              <motion.div
                key={module.title}
                {...getCardEmergence(idx, 6, true, 3)}
                className="group relative rounded-xl p-5 sm:p-6 min-h-[190px] sm:min-h-[200px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
              >
                <div>
                  {/* Top Bar: Minimal Tag Pill & Duration */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                      {module.tag}
                    </span>
                    <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                      {module.duration}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-editorial text-[17px] sm:text-[18px] text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                    {module.title}
                  </h3>

                  {/* Description */}
                  <p className="font-zen text-xs sm:text-[12.5px] text-[#5C6873] leading-relaxed">
                    {module.desc}
                  </p>
                </div>

              </motion.div>
            ))}
          </div>

          {/* Dual Contextual CTAs for Psychoeducation Library */}
          <div className="pt-6 sm:pt-7 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full">
            <a
              href="/login"
              onClick={handleAuthRedirect}
              className="w-full sm:w-auto min-w-[240px] inline-flex items-center justify-center gap-2 bg-[#162723] hover:bg-[#203631] text-white font-zen text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>Explore modules via self-work</span>
              <span>→</span>
            </a>
            <button
              type="button"
              onClick={() => handleSelectTab('start')}
              className="w-full sm:w-auto min-w-[240px] inline-flex items-center justify-center gap-2 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#162723] border border-[#795663]/30 hover:border-[#795663]/60 font-zen text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>Have a therapist assign your modules</span>
              <span className="text-[#795663]">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. SECTION 06: WHAT PEOPLE ACTUALLY BRING IN (Treatment B: Subtle Dusty Rose) */}
      <section className="relative w-full py-16 sm:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-rose">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10 relative z-10">
          <div className="text-center max-w-3xl sm:max-w-4xl mx-auto space-y-2 sm:space-y-2.5">
            <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
              WHAT PEOPLE ACTUALLY BRING IN
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl lg:text-[34px] text-[#162723] mx-auto leading-snug">
              A few examples of what this looks like in practice.
            </h2>
          </div>

          {/* 3 Practical Example Cards: Odd total (3) -> Center card anchors, left/right emerge outward */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <motion.div
              {...getCardEmergence(0, 3)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[170px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    SHARED WITH THERAPIST
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    01 / 03
                  </span>
                </div>
                <p className="font-editorial italic text-base sm:text-[17px] text-[#162723] leading-relaxed group-hover:text-[#795663] transition-colors my-2">
                  "I got anxious before my sister's wedding and couldn't figure out why."
                </p>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(1, 3)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[170px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    SHARED WITH THERAPIST
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    02 / 03
                  </span>
                </div>
                <p className="font-editorial italic text-base sm:text-[17px] text-[#162723] leading-relaxed group-hover:text-[#795663] transition-colors my-2">
                  "My in-laws commented on my job again and I just went quiet."
                </p>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(2, 3)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[170px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    SHARED WITH THERAPIST
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    03 / 03
                  </span>
                </div>
                <p className="font-editorial italic text-base sm:text-[17px] text-[#162723] leading-relaxed group-hover:text-[#795663] transition-colors my-2">
                  "I said yes to extra work again even though I'm exhausted."
                </p>
              </div>
            </motion.div>
          </div>

          <p className="font-editorial italic text-xs sm:text-sm text-[#7D8E87] pt-1 text-center">
            The same selected history also carries over if you switch therapists, or move to self-work only after finishing therapy.
          </p>
        </div>
      </section>

      {/* 8. SECTION 07: THE PLATFORM, NOT TWO PRODUCTS (Treatment C: Deep Brand Surface) */}
      <section data-dark-section="true" className="relative w-full py-28 sm:py-36 px-6 sm:px-8 lg:px-12 bg-[#011627] text-white overflow-hidden border-t border-[#F6F1EA]/10 border-b border-[#F6F1EA]/10">
        {/* Subtle celestial gold watercolor glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#B8964A]/12 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="font-mono-code text-xs tracking-widest uppercase text-[#C5A880] font-semibold">
            THE PLATFORM, NOT TWO PRODUCTS
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-white font-normal leading-tight">
            The same capabilities can be used at different levels of support.
          </h2>
          <p className="font-zen text-sm sm:text-base text-[#9AA59F] max-w-2xl sm:max-w-3xl mx-auto leading-relaxed">
            The difference is who is involved in guiding the work: you, or you and a licensed therapist.
          </p>
          <div className="pt-8 sm:pt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full">
            <a
              href="/login"
              onClick={handleAuthRedirect}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-zen font-semibold bg-[#C5A880] text-[#011627] hover:bg-[#D8BE9B] transition-all cursor-pointer shadow-sm text-center whitespace-nowrap"
            >
              <span>Start self-work independently</span>
              <span>→</span>
            </a>
            <button
              type="button"
              onClick={() => handleSelectTab('start')}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-zen font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/25 hover:border-white/50 transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>Start with a licensed therapist</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  // -------------------------------------------------------------
  // TAB 3: HOW IT WORKS / OUR APPROACH
  // -------------------------------------------------------------
  const renderHowItWorks = () => (
    <div className="space-y-0 w-full">
      
      {/* 1. HERO SECTION (Subtle Parchment Gradient with Watercolor Bleeds & Brushstroke) */}
      <section className="relative w-full min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-5.5rem)] flex flex-col justify-center items-center py-16 sm:py-20 px-6 sm:px-8 lg:px-12 overflow-hidden">
        {/* Ambient Top-Right Watercolor Wash (Dusty Rose) */}
        <svg
          className="absolute -top-16 -right-20 w-[420px] sm:w-[540px] h-auto opacity-60 pointer-events-none mix-blend-multiply"
          viewBox="0 0 600 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="how-rose-wash" cx="70%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#C49A8F" stopOpacity="0.38" />
              <stop offset="45%" stopColor="#D9BCAF" stopOpacity="0.22" />
              <stop offset="75%" stopColor="#EFE3DE" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
            </radialGradient>
            <filter id="how-bleed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>
          <path
            d="M500 40 C410 0 300 50 240 130 C180 210 180 320 230 400 C290 470 410 500 500 460 C580 420 620 320 630 210 C640 120 590 60 500 40 Z"
            fill="url(#how-rose-wash)"
            filter="url(#how-bleed)"
          />
          <circle cx="210" cy="180" r="3.5" fill="#C49A8F" opacity="0.28" />
          <circle cx="240" cy="220" r="2.5" fill="#C49A8F" opacity="0.22" />
        </svg>

        {/* Ambient Top-Left Watercolor Wash (Sage Green) */}
        <svg
          className="absolute -top-12 -left-16 w-[380px] sm:w-[480px] h-auto opacity-55 pointer-events-none mix-blend-multiply"
          viewBox="0 0 550 450"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="how-sage-wash" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#7E9E82" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#96B49A" stopOpacity="0.2" />
              <stop offset="80%" stopColor="#C4D7C7" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path
            d="M80 50 C160 -10 290 20 380 80 C460 130 510 240 460 330 C410 410 290 440 210 420 C130 400 50 340 30 250 C10 160 10 90 80 50 Z"
            fill="url(#how-sage-wash)"
            filter="url(#how-bleed)"
          />
          <circle cx="410" cy="130" r="4" fill="#8AA688" opacity="0.25" />
        </svg>

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10 w-full my-auto flex flex-col items-center justify-center">
          <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
            HOW IT WORKS
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#162723] font-normal leading-[1.12] max-w-3xl sm:max-w-4xl mx-auto">
            Different entry points. Shared capabilities.
          </h1>
          <p className="font-zen text-base sm:text-lg text-[#5C6873] leading-relaxed max-w-2xl sm:max-w-3xl mx-auto">
            Two distinct paths (working alone with our pattern engine, and working with a licensed therapist), designed to give you clarity without comfort-traps.
          </p>
          {/* Dual Action CTAs */}
          <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full">
            <a
              href="/login"
              onClick={handleAuthRedirect}
              className="w-full sm:w-auto min-w-[270px] inline-flex items-center justify-center gap-2.5 bg-[#162723] hover:bg-[#203631] text-white font-zen text-sm sm:text-[15px] font-semibold px-7 sm:px-8 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer text-center whitespace-nowrap"
            >
              <span>Start your independent journey</span>
              <span className="text-base">→</span>
            </a>
            <button
              type="button"
              onClick={() => handleSelectTab('start')}
              className="w-full sm:w-auto min-w-[270px] inline-flex items-center justify-center gap-2.5 bg-[#FAF7F2] hover:bg-white text-[#162723] border border-[#795663]/30 hover:border-[#795663]/60 font-zen text-sm sm:text-[15px] font-semibold px-7 sm:px-8 py-3.5 rounded-full shadow-xs hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] text-center whitespace-nowrap"
            >
              <span>Start with a professional</span>
              <span className="text-base text-[#795663]">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. CORE PHILOSOPHY / OUR APPROACH (Treatment B: Subtle Dynamic Thistle) */}
      <section id="approach-principles" className="relative w-full py-16 sm:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-thistle">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2.5 sm:space-y-3">
            <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
              CORE PHILOSOPHY
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[42px] text-[#162723] font-normal leading-[1.18] mx-auto">
              Clarity comes from truth, not comfort.
            </h2>
            <p className="font-zen text-sm sm:text-base text-[#5C6873] leading-relaxed max-w-2xl mx-auto">
              Three things we will never do, and why.
            </p>
          </div>

          {/* Three Principles Cards: Odd total (3) -> Center card anchors, left/right emerge outward */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            <motion.div
              {...getCardEmergence(0, 3)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[260px] sm:min-h-[280px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    PRINCIPLE 01
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    01 / 03
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  We don't validate blindly.
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  There is a version of emotional support that agrees with everything and changes nothing. It is comfortable. It is also useless. If you are writing the same entry for the fifth time with different characters, we will name the loop.
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-[#E7DECF]/60">
                <p className="font-editorial text-xs italic text-[#795663] group-hover:text-[#162723] transition-colors leading-relaxed">
                  "Not harshly. Not with a diagnosis. Just: this pattern has shown up before."
                </p>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(1, 3)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[260px] sm:min-h-[280px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    PRINCIPLE 02
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    02 / 03
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  We don't give solutions.
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  The moment we start telling you what to do, we've removed you from the equation. People don't build self-awareness by following instructions. They build it by sitting with hard questions long enough to find their own answers.
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-[#E7DECF]/60">
                <p className="font-editorial text-xs italic text-[#795663] group-hover:text-[#162723] transition-colors leading-relaxed">
                  "Our job is the question, not the answer."
                </p>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(2, 3)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[260px] sm:min-h-[280px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    PRINCIPLE 03
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    03 / 03
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  We don't create dependency.
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  This product should make itself progressively less necessary, not more. A person using it for a year should know themselves well enough that they need it less, not feel like they cannot function without checking in.
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-[#E7DECF]/60">
                <p className="font-editorial text-xs italic text-[#795663] group-hover:text-[#162723] transition-colors leading-relaxed">
                  "The measure of success is how clearly you see yourself without it."
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. DAY ONE: WHAT ACTUALLY HAPPENS (Treatment B: Subtle Dynamic Dusky Rose) */}
      <section className="relative w-full py-16 sm:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-rose">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2.5 sm:space-y-3">
            <div className="flex flex-col items-center">
              <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723]">
                DAY ONE: WHAT HAPPENS
              </div>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[42px] text-[#162723] font-normal leading-[1.18] mx-auto">
              What actually happens when you <span className="italic accent-rose">sign up</span>.
            </h2>
            <p className="font-zen text-sm sm:text-base text-[#5C6873] leading-relaxed max-w-2xl mx-auto">
              Zero confusion. Here is what your first hour looks like on either path.
            </p>
          </div>

          {/* Two Paths Cards: Even total (2) -> Both split smoothly outward from center line */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Self-work panel */}
            <motion.div
              {...getCardEmergence(0, 2)}
              className="group relative rounded-xl p-6 sm:p-8 min-h-[300px] sm:min-h-[320px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    SELF-WORK PLATFORM
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    OPTION 01 / 02
                  </span>
                </div>
                <h3 className="font-editorial text-2xl sm:text-3xl text-[#162723] font-normal leading-snug group-hover:text-[#795663] transition-colors">
                  Starting with self-work
                </h3>
                <p className="font-zen text-xs sm:text-sm text-[#5C6873] leading-relaxed">
                  Subscribe (₹499/month), answer a few quick questions about what's on your mind, and write your first journal entry, free-flow or guided. Nothing else is required before you begin.
                </p>
                <div className="pt-2 space-y-2 font-zen text-xs sm:text-sm text-[#162723]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#8AA688] font-bold">✓</span> No waitlists or onboarding barriers
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#8AA688] font-bold">✓</span> Free-flow and guided 5-prompt modes
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#8AA688] font-bold">✓</span> Instant, reflective AI insight on submission
                  </div>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-[#E7DECF]/60">
                <a
                  href="/login"
                  onClick={handleAuthRedirect}
                  className="w-full py-3 px-5 rounded-full font-mono-code text-xs tracking-wider uppercase font-semibold text-center bg-[#162723] text-white hover:bg-[#203631] transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>Start independent onboarding</span>
                  <span>→</span>
                </a>
              </div>
            </motion.div>

            {/* Therapist panel */}
            <motion.div
              {...getCardEmergence(1, 2)}
              className="group relative rounded-xl p-6 sm:p-8 min-h-[300px] sm:min-h-[320px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    THERAPIST-SUPPORTED
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    OPTION 02 / 02
                  </span>
                </div>
                <h3 className="font-editorial text-2xl sm:text-3xl text-[#162723] font-normal leading-snug group-hover:text-[#795663] transition-colors">
                  Starting with a therapist
                </h3>
                <p className="font-zen text-xs sm:text-sm text-[#5C6873] leading-relaxed">
                  Browse therapist profiles filtered by language, gender, specialty and availability, book a first session at ₹999+ per session, and set up your shared dashboard together in that first session.
                </p>
                <div className="pt-2 space-y-2 font-zen text-xs sm:text-sm text-[#162723]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#8AA688] font-bold">✓</span> Verified clinical credentials & video intro
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#8AA688] font-bold">✓</span> Joint goal-setting in session one
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#8AA688] font-bold">✓</span> Shared recap & homework dashboard activated
                  </div>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-[#E7DECF]/60">
                <button
                  type="button"
                  onClick={() => handleSelectTab('start')}
                  className="w-full py-3 px-5 rounded-full font-mono-code text-xs tracking-wider uppercase font-semibold text-center bg-[#795663] text-white hover:bg-[#654652] transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>Book your therapist orientation</span>
                  <span>→</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. SIDE BY SIDE COMPARISON */}
      <section className="relative w-full py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-fog">
        <div className="max-w-5xl mx-auto space-y-12 sm:space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="flex flex-col items-center">
              <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723]">
                SIDE BY SIDE
              </div>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#162723] font-normal leading-tight mx-auto">
              What each option actually <span className="italic accent-fog">includes</span>.
            </h2>
            <p className="font-zen text-base sm:text-lg text-[#5C6873] leading-relaxed max-w-2xl mx-auto">
              Transparent breakdown across capabilities, human guidance, and pricing structure.
            </p>
          </div>

          <div className="paper-card rounded-2xl p-8 sm:p-12 bg-white border border-[#E7DECF] shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm font-zen min-w-[540px]">
              <thead>
                <tr className="border-b-2 border-[#E7DECF] text-[#795663] font-mono-code text-[11px] tracking-wider uppercase">
                  <th className="py-4 pr-6">Capability</th>
                  <th className="py-4 px-6">Self-work</th>
                  <th className="py-4 pl-6">Therapist-supported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DECF]/70 text-[#5C6873]">
                <tr>
                  <td className="py-4 pr-6 text-[#162723] font-medium">Journal (free-flow + guided)</td>
                  <td className="py-4 px-6 text-[#2E7A70] font-semibold">✓ Included</td>
                  <td className="py-4 pl-6 text-[#2E7A70] font-semibold">✓ Included</td>
                </tr>
                <tr>
                  <td className="py-4 pr-6 text-[#162723] font-medium">Weekly & monthly reports</td>
                  <td className="py-4 px-6 text-[#2E7A70] font-semibold">✓ Included</td>
                  <td className="py-4 pl-6 text-[#2E7A70] font-semibold">✓ Included</td>
                </tr>
                <tr>
                  <td className="py-4 pr-6 text-[#162723] font-medium">Pattern & emotional vocabulary detection</td>
                  <td className="py-4 px-6 text-[#2E7A70] font-semibold">✓ Included</td>
                  <td className="py-4 pl-6 text-[#2E7A70] font-semibold">✓ Included</td>
                </tr>
                <tr>
                  <td className="py-4 pr-6 text-[#162723] font-medium">Psychoeducation modules</td>
                  <td className="py-4 px-6">Self-selected, paid per module</td>
                  <td className="py-4 pl-6">Therapist-assigned, paid per module</td>
                </tr>
                <tr>
                  <td className="py-4 pr-6 text-[#162723] font-medium">Licensed therapist sessions</td>
                  <td className="py-4 px-6 text-[#9AA59F]">-</td>
                  <td className="py-4 pl-6 text-[#2E7A70] font-semibold">✓ Included</td>
                </tr>
                <tr>
                  <td className="py-4 pr-6 text-[#162723] font-medium">Shared dashboard with recap & homework</td>
                  <td className="py-4 px-6 text-[#9AA59F]">-</td>
                  <td className="py-4 pl-6 text-[#2E7A70] font-semibold">✓ Included</td>
                </tr>
                <tr className="font-semibold text-[#162723] bg-[#FDFBF8]/60">
                  <td className="py-4 pr-6 font-medium text-sm">Typical cost</td>
                  <td className="py-4 px-6 font-mono-code text-sm text-[#795663]">₹499 / month</td>
                  <td className="py-4 pl-6 font-mono-code text-sm text-[#162723]">From ₹999 / session</td>
                </tr>
                <tr className="border-t border-[#E7DECF]/80">
                  <td className="py-5 pr-6"></td>
                  <td className="py-5 px-6">
                    <a
                      href="/login"
                      onClick={handleAuthRedirect}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-[#162723] hover:bg-[#203631] text-white font-zen text-xs font-semibold py-2.5 px-4 rounded-full shadow-xs hover:shadow transition-all cursor-pointer whitespace-nowrap text-center"
                    >
                      <span>Start self-work</span>
                      <span>→</span>
                    </a>
                  </td>
                  <td className="py-5 pl-6">
                    <button
                      type="button"
                      onClick={() => handleSelectTab('start')}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#162723] border border-[#795663]/30 hover:border-[#795663]/60 font-zen text-xs font-semibold py-2.5 px-4 rounded-full shadow-xs hover:shadow transition-all cursor-pointer whitespace-nowrap text-center"
                    >
                      <span>With a therapist</span>
                      <span className="text-[#795663]">→</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. WORKING ON YOURSELF (Treatment B: Subtle Dynamic Royal Scepter) */}
      <section id="walkthrough-self" className="relative w-full py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-royal">
        <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="flex flex-col items-center">
              <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723]">
                WORKING ON YOURSELF
              </div>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#162723] font-normal leading-tight mx-auto">
              Example: “Why do I feel guilty resting instead of helping at home?”
            </h2>
            <p className="font-zen text-base sm:text-lg text-[#5C6873] leading-relaxed max-w-3xl mx-auto">
              Here is how a persistent feeling moves from raw reflection into long-term behavioral change.
            </p>
          </div>

          {/* 4 Self-Work Steps: Even total (4) -> Inner cards split from center line, outer cards emerge outward */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              {...getCardEmergence(0, 4)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[220px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    STEP 01
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    01 / 04
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  Journal
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Write freely, or use the guided 5-prompt journal: what happened, why, how you reacted, what you felt, and what you'd tell a friend.
                </p>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(1, 4)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[220px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    STEP 02
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    02 / 04
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  Get your report
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Weekly and monthly reports show recurring situations and the emotional vocabulary showing up most in your entries.
                </p>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(2, 4)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[220px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    STEP 03
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    03 / 04
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  See the pattern
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  An intervention explains the pattern in plain language. If it holds for roughly two months, a specific psychoeducation module is recommended, not forced.
                </p>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(3, 4)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[220px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    STEP 04
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    04 / 04
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  Practise & review
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Apply what you learned in real situations that week, then check the next report to see if anything shifted.
                </p>
              </div>
            </motion.div>
          </div>

          {/* 2 Realistic Week Cards: Even total (2) -> Both split smoothly from center line */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <motion.div
              {...getCardEmergence(0, 2)}
              className="group relative rounded-xl p-6 sm:p-7 bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    REALISTIC CADENCE
                  </span>
                </div>
                <h3 className="font-editorial text-lg text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  A realistic week
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Mon–Fri: 2–3 short journal entries. Sunday: weekly report lands, 5 minutes to read. Once a pattern repeats for weeks, a module gets recommended, and you decide if or when to take it.
                </p>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(1, 2)}
              className="group relative rounded-xl p-6 sm:p-7 bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    OUR COMMITMENT
                  </span>
                </div>
                <h3 className="font-editorial text-lg text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  What you're not getting
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  No daily notifications guilting you into writing, no automatic diagnosis, and no module purchase without you actively choosing it.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. WITH A THERAPIST (Treatment B: Subtle Dynamic Thistle) */}
      <section className="relative w-full py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-thistle">
        <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="flex flex-col items-center">
              <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723]">
                WITH A THERAPIST
              </div>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#162723] font-normal leading-tight mx-auto">
              Same journal and reports. Plus a therapist, and a <span className="italic accent-thistle">dashboard for both of you</span>.
            </h2>
            <p className="font-zen text-base sm:text-lg text-[#5C6873] leading-relaxed max-w-3xl mx-auto">
              Care that doesn't evaporate the moment you hang up the video call.
            </p>
          </div>

          {/* 4 Therapist Steps: Even total (4) -> Inner cards split from center line, outer cards emerge outward */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              {...getCardEmergence(0, 4)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[220px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    STEP 01
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    01 / 04
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  Set goals
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Define what matters to the client in the first session or two, visible on both dashboards afterward.
                </p>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(1, 4)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[220px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    STEP 02
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    02 / 04
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  Session recap
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  After each session, your dashboard shows a recap, any homework, and any psychoeducation your therapist assigned.
                </p>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(2, 4)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[220px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    STEP 03
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    03 / 04
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  Practise between
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Complete homework, or journal independently. Many clients keep journaling even on weeks with a session.
                </p>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(3, 4)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[220px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    STEP 04
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    04 / 04
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  Review & continue
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Every few weeks, revisit goals together. Continue, change direction, graduate, or change therapists, without losing your history.
                </p>
              </div>
            </motion.div>
          </div>

          <div className="rounded-xl p-7 sm:p-8 bg-[#FDFBF8] border border-[#E7DECF] shadow-2xs space-y-2">
            <div className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 mb-1">
              CLINICAL CADENCE
            </div>
            <h3 className="font-editorial text-xl text-[#162723] font-normal">A realistic cadence</h3>
            <p className="font-zen text-xs sm:text-sm text-[#5C6873] leading-relaxed">
              Most clients start weekly or fortnightly, review goals every 4–6 sessions, and taper to monthly check-ins as things stabilise, and your therapist adjusts this with you, not on a fixed schedule.
            </p>
          </div>
        </div>
      </section>

      {/* 7. USE BOTH: BIDIRECTIONAL INTEGRATION (Treatment B: Subtle Dynamic Dusky Rose) */}
      <section className="relative w-full py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-rose">
        <div className="max-w-5xl mx-auto space-y-12 sm:space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="flex flex-col items-center">
              <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723]">
                USE BOTH
              </div>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#162723] font-normal leading-tight mx-auto">
              The two sides can <span className="italic accent-rose">feed each other</span>.
            </h2>
            <p className="font-zen text-base sm:text-lg text-[#5C6873] leading-relaxed max-w-2xl mx-auto">
              The platform connects self-directed reflection with clinical guidance without locking you into either.
            </p>
          </div>

          {/* SVG Diagram */}
          <div className="paper-card rounded-2xl p-8 sm:p-12 bg-white border border-[#E7DECF] shadow-xs">
            <div className="w-full max-w-2xl mx-auto">
              <svg viewBox="0 0 700 170" role="img" aria-label="Diagram of two boxes, self-work and therapy, connected by two arrows: share an entry going from self-work to therapy, and continue practice going from therapy to self-work" className="w-full h-auto">
                <rect x="30" y="45" width="230" height="80" rx="16" fill="#FDFBF8" stroke="#E7DECF" strokeWidth="2"/>
                <text x="145" y="90" textAnchor="middle" fontFamily="Lora, Georgia, serif" fontSize="18" fill="#162723" fontWeight="500">Self-work</text>
                
                <rect x="440" y="45" width="230" height="80" rx="16" fill="#FDFBF8" stroke="#E7DECF" strokeWidth="2"/>
                <text x="555" y="90" textAnchor="middle" fontFamily="Lora, Georgia, serif" fontSize="18" fill="#162723" fontWeight="500">Therapy</text>
                
                <path d="M262,70 C330,52 380,52 438,68" fill="none" stroke="#795663" strokeWidth="2.5" markerEnd="url(#arrowu1-v2)"/>
                <text x="350" y="46" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#795663" letterSpacing="0.5">share a selected entry &rarr;</text>
                
                <path d="M438,102 C380,120 330,120 262,103" fill="none" stroke="#2E7A70" strokeWidth="2.5" markerEnd="url(#arrowu2-v2)"/>
                <text x="350" y="142" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#2E7A70" letterSpacing="0.5">&larr; continue practice after</text>
                
                <defs>
                  <marker id="arrowu1-v2" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                    <path d="M0,0 L9,4.5 L0,9 z" fill="#795663"/>
                  </marker>
                  <marker id="arrowu2-v2" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                    <path d="M0,0 L9,4.5 L0,9 z" fill="#2E7A70"/>
                  </marker>
                </defs>
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-[#E7DECF]/80">
              <div className="space-y-2">
                <h4 className="font-editorial text-lg text-[#162723] font-medium">Self-work &rarr; Therapy</h4>
                <p className="font-zen text-xs sm:text-sm text-[#5C6873] leading-relaxed">
                  E.g. three weeks of entries about a specific relative, brought into session instead of retold from memory.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-editorial text-lg text-[#162723] font-medium">Therapy &rarr; Self-work</h4>
                <p className="font-zen text-xs sm:text-sm text-[#5C6873] leading-relaxed">
                  E.g. keep journaling on boundary-setting after your last session, with reports still tracking whether it holds.
                </p>
              </div>
            </div>
            <p className="font-mono-code text-xs text-[#795663] text-center pt-6 mt-4 border-t border-[#E7DECF]/60">
              Switch direction anytime: nothing is locked in.
            </p>

            {/* Dual Contextual CTAs for Use Both */}
            <div className="pt-8 sm:pt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full">
              <a
                href="/login"
                onClick={handleAuthRedirect}
                className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 bg-[#162723] hover:bg-[#203631] text-white font-zen text-xs sm:text-sm font-semibold px-6 sm:px-7 py-3 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
              >
                <span>Begin private self-work</span>
                <span>→</span>
              </a>
              <button
                type="button"
                onClick={() => handleSelectTab('start')}
                className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#162723] border border-[#795663]/30 hover:border-[#795663]/60 font-zen text-xs sm:text-sm font-semibold px-6 sm:px-7 py-3 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
              >
                <span>Work with a therapist</span>
                <span className="text-[#795663]">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. COMMON QUESTIONS (FAQ) (Treatment B: Subtle Dynamic Fog Blue) */}
      <section className="relative w-full py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-fog">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="flex flex-col items-center">
              <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723]">
                COMMON QUESTIONS
              </div>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#162723] font-normal leading-tight mx-auto">
              The <span className="italic accent-fog">practical</span> stuff.
            </h2>
            <p className="font-zen text-base sm:text-lg text-[#5C6873] leading-relaxed max-w-2xl mx-auto">
              Straightforward answers about subscriptions, pauses, and combining formats.
            </p>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            {[
              {
                q: 'What if I miss a few days of journaling?',
                a: "Nothing happens automatically. Your next report simply reflects fewer entries. There's no streak to lose or penalty for gaps."
              },
              {
                q: 'Can I change or stop my therapist?',
                a: 'Yes, anytime. You can switch therapists and choose what history moves with you, or stop therapy altogether and continue on self-work only.'
              },
              {
                q: 'Do I have to buy a psychoeducation module when it is recommended?',
                a: "No. It's a suggestion based on a repeating pattern: buying it is always your choice, in both self-work and therapy."
              },
              {
                q: 'What happens if I pause my subscription?',
                a: "Your journal history and past reports stay saved. You won't get new weekly or monthly reports until you resume."
              },
              {
                q: 'Can I use self-work and therapy in the same week?',
                a: 'Yes, many people journal on non-session weeks and bring select entries into their next session.'
              }
            ].map((faq) => (
              <details key={faq.q} className="paper-card rounded-xl p-5 sm:p-6 bg-white border border-[#E7DECF] group transition-all">
                <summary className="font-editorial text-base sm:text-lg text-[#162723] cursor-pointer font-medium list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <span className="text-[#795663] text-xl font-bold group-open:rotate-45 transition-transform duration-200">+</span>
                </summary>
                <p className="font-zen text-xs sm:text-sm text-[#5C6873] pt-4 leading-relaxed border-t border-[#E7DECF]/60 mt-4">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 9. DARK INK CLOSING BAND (Treatment C: Deep Brand Surface) */}
      <section data-dark-section="true" className="w-full bg-[#011627] py-28 sm:py-36 px-6 sm:px-8 lg:px-12 text-white border-t border-[#F6F1EA]/10 border-b border-[#F6F1EA]/10">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="font-mono-code text-xs tracking-widest uppercase text-[#C5A880] font-semibold">
            UNDERSTAND · GROW · CONTINUE
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-white font-normal leading-tight">
            Self-work, therapy, or both. Your pace.
          </h2>
          <p className="font-zen text-base sm:text-lg text-[#9AA59F] leading-relaxed max-w-xl mx-auto">
            Different entry points, same dedication to truth over comfort. Start exploring your own patterns today.
          </p>
          <div className="pt-8 sm:pt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full">
            <a
              href="/login"
              onClick={handleAuthRedirect}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-zen font-semibold bg-[#C5A880] text-[#011627] hover:bg-[#D8BE9B] transition-all cursor-pointer shadow-sm text-center whitespace-nowrap"
            >
              <span>Start self-work on your terms</span>
              <span>→</span>
            </a>
            <button
              type="button"
              onClick={() => handleSelectTab('start')}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-zen font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/25 hover:border-white/50 transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>Start therapist sessions</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  // -------------------------------------------------------------
  // TAB 4: PRICING (Dynamic ₹499/mo & ₹999/session)
  // -------------------------------------------------------------
  const renderPricing = () => (
    <div className="w-full space-y-0">
      
      {/* 1. HERO SECTION (Subtle Parchment Gradient with Watercolor Bleeds & Brushstroke) */}
      <section className="relative w-full min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-5.5rem)] flex flex-col justify-center items-center py-16 sm:py-20 px-6 sm:px-8 lg:px-12 overflow-hidden">
        {/* Ambient Top-Right Watercolor Wash (Dusty Rose) */}
        <svg
          className="absolute -top-16 -right-20 w-[420px] sm:w-[540px] h-auto opacity-60 pointer-events-none mix-blend-multiply"
          viewBox="0 0 600 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="price-rose-wash" cx="70%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#C49A8F" stopOpacity="0.38" />
              <stop offset="45%" stopColor="#D9BCAF" stopOpacity="0.22" />
              <stop offset="75%" stopColor="#EFE3DE" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
            </radialGradient>
            <filter id="price-bleed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>
          <path
            d="M500 40 C410 0 300 50 240 130 C180 210 180 320 230 400 C290 470 410 500 500 460 C580 420 620 320 630 210 C640 120 590 60 500 40 Z"
            fill="url(#price-rose-wash)"
            filter="url(#price-bleed)"
          />
          <circle cx="220" cy="180" r="3.5" fill="#C49A8F" opacity="0.28" />
          <circle cx="250" cy="220" r="2.5" fill="#C49A8F" opacity="0.22" />
        </svg>

        {/* Ambient Top-Left Watercolor Wash (Sage Green) */}
        <svg
          className="absolute -top-12 -left-16 w-[380px] sm:w-[480px] h-auto opacity-55 pointer-events-none mix-blend-multiply"
          viewBox="0 0 550 450"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="price-sage-wash" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#7E9E82" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#96B49A" stopOpacity="0.2" />
              <stop offset="80%" stopColor="#C4D7C7" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path
            d="M80 50 C160 -10 290 20 380 80 C460 130 510 240 460 330 C410 410 290 440 210 420 C130 400 50 340 30 250 C10 160 10 90 80 50 Z"
            fill="url(#price-sage-wash)"
            filter="url(#price-bleed)"
          />
          <circle cx="410" cy="130" r="4" fill="#8AA688" opacity="0.25" />
        </svg>

        <div className="max-w-5xl mx-auto space-y-8 relative z-10 text-center w-full my-auto flex flex-col items-center justify-center">
          <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
            PRICING & MEMBERSHIP
          </div>

          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#162723] font-normal leading-[1.12] max-w-3xl sm:max-w-4xl mx-auto">
            A monthly plan for self-work. Pay per session for therapy.
          </h1>

          <p className="font-zen text-base sm:text-lg text-[#5C6873] leading-relaxed max-w-2xl sm:max-w-3xl mx-auto">
            Prices shown in ₹ (INR). Pay by UPI, card or netbanking. No hidden charges, and no long-term lock-ins.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            <span className="font-mono-code text-xs text-[#4F635E] bg-white/80 border border-[#E7DECF] px-3.5 py-1.5 rounded-full shadow-2xs">
              ✓ UPI
            </span>
            <span className="font-mono-code text-xs text-[#4F635E] bg-white/80 border border-[#E7DECF] px-3.5 py-1.5 rounded-full shadow-2xs">
              ✓ Cards (Debit & Credit)
            </span>
            <span className="font-mono-code text-xs text-[#4F635E] bg-white/80 border border-[#E7DECF] px-3.5 py-1.5 rounded-full shadow-2xs">
              ✓ Netbanking
            </span>
            <span className="font-mono-code text-xs text-[#4F635E] bg-white/80 border border-[#E7DECF] px-3.5 py-1.5 rounded-full shadow-2xs">
              ✓ GST Inclusive
            </span>
          </div>
        </div>
      </section>

      {/* 2. THE TWO CORE OPTIONS (Treatment B: Subtle Dynamic Thistle) */}
      <section className="relative w-full py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-thistle">
        <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16 relative z-10">
          {/* Two Core Pricing Cards: Even total (2) -> Both split smoothly from center line */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Card 1: Self-Work Platform */}
            <motion.div
              {...getCardEmergence(0, 2)}
              className="group relative rounded-xl p-8 sm:p-10 min-h-[500px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 shadow-2xs hover:shadow-xs flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 cursor-pointer"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    SELF-WORK PLATFORM
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    TIER 01 / 02
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono-code text-5xl font-semibold text-[#795663]">₹499</span>
                    <span className="font-zen text-sm text-[#5C6873]">/ month (GST inclusive)</span>
                  </div>
                  <p className="font-zen text-xs text-[#2E7A70] font-medium pt-1">
                    First 7 days free • Cancel anytime in 1 click
                  </p>
                </div>
                <p className="font-zen text-xs sm:text-sm text-[#5C6873] leading-relaxed">
                  Journal (free-flow + guided), and weekly & monthly reports with pattern and emotional vocabulary tracking, included in your subscription.
                </p>
                <div className="h-[1px] bg-[#E7DECF]/80" />
                <ul className="space-y-2.5 text-xs sm:text-sm font-zen text-[#162723]">
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#8AA688] font-bold">✓</span> Unlimited daily journal entries
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#8AA688] font-bold">✓</span> Weekly summary & monthly pattern reports
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#8AA688] font-bold">✓</span> Longitudinal pattern engine (4-state lifecycle)
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#8AA688] font-bold">✓</span> Free plain-language pattern interventions
                  </li>
                </ul>
                <p className="font-zen text-xs text-[#7D8E87] pt-2 border-t border-[#E7DECF]/60 italic">
                  Psychoeducation modules are priced and purchased separately, inside the app.
                </p>
              </div>
              <div className="pt-6">
                <a
                  href="/login"
                  onClick={handleAuthRedirect}
                  className="w-full text-center py-3.5 bg-[#162723] hover:bg-[#203631] text-white rounded-full font-mono-code text-xs uppercase tracking-wider font-semibold shadow-xs cursor-pointer transition-colors inline-block"
                >
                  Start independent self-work &rarr;
                </a>
              </div>
            </motion.div>

            {/* Card 2: Therapy */}
            <motion.div
              {...getCardEmergence(1, 2)}
              className="group relative rounded-xl p-8 sm:p-10 min-h-[500px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 shadow-2xs hover:shadow-xs flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 cursor-pointer"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    THERAPIST-SUPPORTED
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    TIER 02 / 02
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono-code text-5xl font-semibold text-[#162723]">From ₹999</span>
                    <span className="font-zen text-sm text-[#5C6873]">/ session</span>
                  </div>
                  <p className="font-zen text-xs text-[#795663] font-medium pt-1">
                    Pay per session • No package commitment required
                  </p>
                </div>
                <p className="font-zen text-xs sm:text-sm text-[#5C6873] leading-relaxed">
                  Licensed therapist, goal setting, between-session practice and progress review. Journal and reports can be added alongside.
                </p>
                <div className="h-[1px] bg-[#E7DECF]/80" />
                <ul className="space-y-2.5 text-xs sm:text-sm font-zen text-[#162723]">
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#8AA688] font-bold">✓</span> Verified licensed clinical psychologists
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#8AA688] font-bold">✓</span> Shared milestone dashboard between sessions
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#8AA688] font-bold">✓</span> Therapist-assigned homework & session recaps
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#8AA688] font-bold">✓</span> Seamless continuity if you change therapists
                  </li>
                </ul>
                <p className="font-zen text-xs text-[#7D8E87] pt-2 border-t border-[#E7DECF]/60 italic">
                  Psychoeducation modules assigned by your therapist are priced and purchased separately.
                </p>
              </div>
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => handleSelectTab('start')}
                  className="w-full text-center py-3.5 bg-[#795663] hover:bg-[#654652] text-white rounded-full font-mono-code text-xs uppercase tracking-wider font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  Book a pay-per-session therapist &rarr;
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. PSYCHOEDUCATION MODULES (Treatment B: Subtle Dynamic Dusky Rose) */}
      <section className="relative w-full py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-rose">
        <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16 relative z-10">
          <div className="text-center max-w-3xl sm:max-w-4xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
              PSYCHOEDUCATION MODULES
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[42px] text-[#162723] font-normal leading-tight pt-1 mx-auto">
              Bought one at a time, only when it's relevant.
            </h2>
            <p className="font-zen text-sm sm:text-base text-[#5C6873] leading-relaxed max-w-2xl sm:max-w-3xl mx-auto">
              The plain-language explanation of a pattern is always free, as soon as it shows up, as part of your subscription or session, not an upsell. Only the deeper, structured module is separate: on self-work, offered once a pattern has repeated for about two months; in therapy, assignable by your therapist whenever they judge it's useful. Either way, it's a one-time purchase you choose, never automatic.
            </p>
          </div>

          {/* 2 Timeline Example Cards: Even total (2) -> Both split smoothly from center line */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pt-2">
            {/* Card 1: Month 1, Self-work only */}
            <motion.div
              {...getCardEmergence(0, 2)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[140px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    MONTH 1 · SELF-WORK ONLY
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    EXAMPLE 01 / 02
                  </span>
                </div>
                <p className="font-zen text-sm sm:text-base text-[#5C6873] leading-relaxed">
                  ₹499 subscription. That's it: modules only if you choose one later.
                </p>
              </div>
            </motion.div>

            {/* Card 2: Month 1, Therapy (Weekly) */}
            <motion.div
              {...getCardEmergence(1, 2)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[140px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    MONTH 1 · THERAPY (WEEKLY)
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    EXAMPLE 02 / 02
                  </span>
                </div>
                <p className="font-zen text-sm sm:text-base text-[#5C6873] leading-relaxed">
                  ≈₹999–1,500 × 4 sessions, depending on therapist. No subscription fee on top.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Dual Contextual CTAs for Psychoeducation section */}
          <div className="pt-8 sm:pt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full">
            <a
              href="/login"
              onClick={handleAuthRedirect}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 bg-[#162723] hover:bg-[#203631] text-white font-zen text-xs sm:text-sm font-semibold px-6 sm:px-7 py-3 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>Track your patterns with self-work</span>
              <span>→</span>
            </a>
            <button
              type="button"
              onClick={() => handleSelectTab('start')}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#162723] border border-[#795663]/30 hover:border-[#795663]/60 font-zen text-xs sm:text-sm font-semibold px-6 sm:px-7 py-3 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>Let a therapist assign your modules</span>
              <span className="text-[#795663]">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. COMMON QUESTIONS ABOUT PRICING (Treatment B: Subtle Dynamic Fog Blue) */}
      <section className="relative w-full py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-fog">
        <div className="max-w-4xl mx-auto space-y-12 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
              PRICING FAQS
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#162723] mx-auto">
              Clear answers, zero fine print.
            </h2>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            {[
              {
                q: 'What happens if I pause or cancel my self-work subscription?',
                a: 'You can cancel anytime in one click from your settings. Your past journal entries and historical reports stay saved forever. You simply will not receive new weekly and monthly reports until you restart.'
              },
              {
                q: 'Do I have to commit to multiple therapy sessions upfront?',
                a: 'No. Ingress Within operates strictly on a pay-per-session model. You can book one session at a time with no requirement to buy packages or commit to bundles.'
              },
              {
                q: 'Are psychoeducation modules ever billed automatically?',
                a: 'Never. Psychoeducation modules are always optional, one-time individual purchases. The plain-language explanation of your patterns is completely free and included.'
              },
              {
                q: 'Which payment methods are accepted?',
                a: 'We accept UPI (Google Pay, PhonePe, Paytm, BHIM), Indian & international credit and debit cards, and netbanking across all major banks in India.'
              }
            ].map((faq) => (
              <details key={faq.q} className="paper-card rounded-xl p-5 sm:p-6 bg-white border border-[#E7DECF] group transition-all">
                <summary className="font-editorial text-base sm:text-lg text-[#162723] cursor-pointer font-medium list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <span className="text-[#795663] text-xl font-bold group-open:rotate-45 transition-transform duration-200">+</span>
                </summary>
                <p className="font-zen text-xs sm:text-sm text-[#5C6873] pt-4 leading-relaxed border-t border-[#E7DECF]/60 mt-4">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 5. DARK INK CLOSING BAND (Treatment C: Deep Brand Surface) */}
      <section data-dark-section="true" className="relative w-full py-28 sm:py-36 px-6 sm:px-8 lg:px-12 bg-[#011627] text-white overflow-hidden text-center border-t border-[#F6F1EA]/10 border-b border-[#F6F1EA]/10">
        {/* Subtle celestial gold watercolor glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#B8964A]/12 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="font-mono-code text-xs tracking-widest uppercase text-[#C5A880] font-semibold">
            START FREE · CONTINUE ONLY IF IT HELPS
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-white font-normal leading-tight">
            Start free. Continue only if it's honest enough to.
          </h2>
          <p className="font-zen text-base sm:text-lg text-[#9AA59F] leading-relaxed max-w-2xl sm:max-w-3xl mx-auto">
            We don't ask for commitment before we've earned it. Begin with our 7-day self-work trial or schedule a session with a therapist.
          </p>
          <div className="pt-8 sm:pt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full">
            <a
              href="/login"
              onClick={handleAuthRedirect}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-zen font-semibold bg-[#C5A880] text-[#011627] hover:bg-[#D8BE9B] transition-all cursor-pointer shadow-sm text-center whitespace-nowrap"
            >
              <span>Start 7-day free self-work trial</span>
              <span>→</span>
            </a>
            <button
              type="button"
              onClick={() => handleSelectTab('start')}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-zen font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/25 hover:border-white/50 transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>Book your first session</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  // -------------------------------------------------------------
  // TAB 5: AI & DATA
  // -------------------------------------------------------------
  const renderAiData = () => (
    <div className="w-full space-y-0">
      
      {/* 1. HERO SECTION (Subtle Parchment Gradient with Watercolor Bleeds & Brushstroke) */}
      <section className="relative w-full min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-5.5rem)] flex flex-col justify-center items-center py-16 sm:py-20 px-6 sm:px-8 lg:px-12 overflow-hidden">
        {/* Ambient Top-Right Watercolor Wash (Dusty Rose) */}
        <svg
          className="absolute -top-16 -right-20 w-[420px] sm:w-[540px] h-auto opacity-60 pointer-events-none mix-blend-multiply"
          viewBox="0 0 600 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="ai-rose-wash" cx="70%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#C49A8F" stopOpacity="0.38" />
              <stop offset="45%" stopColor="#D9BCAF" stopOpacity="0.22" />
              <stop offset="75%" stopColor="#EFE3DE" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
            </radialGradient>
            <filter id="ai-bleed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>
          <path
            d="M500 40 C410 0 300 50 240 130 C180 210 180 320 230 400 C290 470 410 500 500 460 C580 420 620 320 630 210 C640 120 590 60 500 40 Z"
            fill="url(#ai-rose-wash)"
            filter="url(#ai-bleed)"
          />
          <circle cx="220" cy="180" r="3.5" fill="#C49A8F" opacity="0.28" />
          <circle cx="250" cy="220" r="2.5" fill="#C49A8F" opacity="0.22" />
        </svg>

        {/* Ambient Top-Left Watercolor Wash (Sage Green) */}
        <svg
          className="absolute -top-12 -left-16 w-[380px] sm:w-[480px] h-auto opacity-55 pointer-events-none mix-blend-multiply"
          viewBox="0 0 550 450"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="ai-sage-wash" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#7E9E82" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#96B49A" stopOpacity="0.2" />
              <stop offset="80%" stopColor="#C4D7C7" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path
            d="M80 50 C160 -10 290 20 380 80 C460 130 510 240 460 330 C410 410 290 440 210 420 C130 400 50 340 30 250 C10 160 10 90 80 50 Z"
            fill="url(#ai-sage-wash)"
            filter="url(#ai-bleed)"
          />
          <circle cx="410" cy="130" r="4" fill="#8AA688" opacity="0.25" />
        </svg>

        <div className="max-w-5xl mx-auto space-y-8 relative z-10 text-center w-full my-auto flex flex-col items-center justify-center">
          <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
            AI & DATA PRINCIPLES
          </div>

          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#162723] font-normal leading-[1.12] max-w-3xl sm:max-w-4xl mx-auto">
            AI helps connect the information. It does not become the authority.
          </h1>

          <p className="font-zen text-base sm:text-lg text-[#5C6873] leading-relaxed max-w-2xl sm:max-w-3xl mx-auto">
            AI can organise information, surface possible patterns and connect relevant learning. In therapist-supported care, it can help structure information for professional review.
          </p>
        </div>
      </section>

      {/* 2. THE THREE CAPABILITY CARDS (Treatment B: Subtle Dynamic Thistle) */}
      <section className="relative w-full py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-thistle">
        <div className="max-w-6xl mx-auto relative z-10">
          {/* 3 Capability Cards: Odd total (3) -> Center card anchors, left/right emerge outward */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1: Journal Analysis */}
            <motion.div
              {...getCardEmergence(0, 3)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[250px] sm:min-h-[260px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    JOURNAL ANALYSIS
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    01 / 03
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl border border-[#E7DECF]/80 bg-white/70 flex items-center justify-center mb-3 group-hover:border-[#162723]/30 transition-colors">
                  <svg
                    viewBox="0 0 64 64"
                    fill="none"
                    stroke="#2E7A70"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                    aria-hidden="true"
                  >
                    <rect x="14" y="10" width="36" height="44" rx="5" />
                    <line x1="22" y1="20" x2="42" y2="20" />
                    <line x1="22" y1="28" x2="42" y2="28" />
                    <line x1="22" y1="36" x2="34" y2="36" />
                    <circle cx="42" cy="42" r="6" />
                    <line x1="46" y1="46" x2="51" y2="51" />
                  </svg>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  Journal analysis
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Entries become weekly & monthly reports.
                </p>
              </div>
            </motion.div>

            {/* Card 2: Pattern Trigger */}
            <motion.div
              {...getCardEmergence(1, 3)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[250px] sm:min-h-[260px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    PATTERN TRIGGER
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    02 / 03
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl border border-[#E7DECF]/80 bg-white/70 flex items-center justify-center mb-3 group-hover:border-[#162723]/30 transition-colors">
                  <svg
                    viewBox="0 0 64 64"
                    fill="none"
                    stroke="#3D5265"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                    aria-hidden="true"
                  >
                    <path d="M10 44 L22 30 L32 38 L44 18 L54 26" fill="none" />
                    <circle cx="44" cy="18" r="3.5" fill="#B8964A" stroke="none" />
                    <line x1="10" y1="50" x2="54" y2="50" />
                  </svg>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  Pattern trigger
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Named for free, always, with a module only after ~2 months, and only if you choose.
                </p>
              </div>
            </motion.div>

            {/* Card 3: Therapist Support */}
            <motion.div
              {...getCardEmergence(2, 3)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[250px] sm:min-h-[260px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    CLINICAL SUPPORT
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    03 / 03
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl border border-[#E7DECF]/80 bg-white/70 flex items-center justify-center mb-3 group-hover:border-[#162723]/30 transition-colors">
                  <svg
                    viewBox="0 0 64 64"
                    fill="none"
                    stroke="#795663"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                    aria-hidden="true"
                  >
                    <circle cx="32" cy="22" r="9" />
                    <path d="M16 52 C16 40 23 34 32 34 C41 34 48 40 48 52" />
                    <path d="M40 44 L44 48 L52 38" />
                  </svg>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  Therapist support
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Organised for clinical review, never a diagnosis on its own.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. WHERE THE LINE SITS (Treatment B: Subtle Cool Fog) */}
      <section className="relative w-full py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-fog">
        <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
              WHERE THE LINE SITS
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[42px] text-[#162723] font-normal leading-tight mx-auto">
              AI organises the information. A person decides what it means.
            </h2>
          </div>

          {/* Boundary Diagram Component */}
          <AIHumanBoundaryDiagram />

          {/* Dual Contextual CTAs for AI Human Boundary */}
          <div className="pt-10 sm:pt-12 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full">
            <a
              href="/login"
              onClick={handleAuthRedirect}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 bg-[#162723] hover:bg-[#203631] text-white font-zen text-xs sm:text-sm font-semibold px-6 sm:px-7 py-3 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>Use AI as your private mirror</span>
              <span>→</span>
            </a>
            <button
              type="button"
              onClick={() => handleSelectTab('start')}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#162723] border border-[#795663]/30 hover:border-[#795663]/60 font-zen text-xs sm:text-sm font-semibold px-6 sm:px-7 py-3 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>Bring AI pattern summaries to therapy</span>
              <span className="text-[#795663]">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. DATA & PRIVACY (Treatment B: Subtle Dynamic Royal Scepter) */}
      <section className="relative w-full py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-royal">
        <div className="max-w-4xl mx-auto space-y-12 sm:space-y-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#F7EFE9] font-mono-code text-[11px] uppercase tracking-wider text-[#795663] font-semibold border border-[#C49A8F]/30 mx-auto">
              DATA & PRIVACY
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[42px] text-[#162723] font-normal leading-tight pt-1 mx-auto">
              Continuity needs trust.
            </h2>
            <p className="font-zen text-sm sm:text-base text-[#5C6873] leading-relaxed max-w-2xl sm:max-w-3xl mx-auto">
              The platform may hold emotional experiences, self-work, goals, progress and therapy-related information. The Privacy Notice will set out, in full, what's collected, why, who can access it (including therapists), how AI processes it, how long it's kept, and how India's data protection law applies.
            </p>
          </div>

          {/* Collapsible Questions List with Clean Dividing Lines */}
          <div className="border-t border-[#E7DECF] divide-y divide-[#E7DECF] pt-2 max-w-3xl mx-auto">
            {[
              {
                q: 'Can I keep self-work private?',
                a: 'Yes. Self-work is private by default, including from family: the intended model supports private self-work and explicit sharing into professional care.'
              },
              {
                q: 'Can I choose what goes to a new therapist?',
                a: 'Yes. The continuity model is designed around selecting the relevant history instead of transferring everything automatically.'
              },
              {
                q: 'Is everything processed by AI?',
                a: 'AI use depends on the feature. The Privacy Notice will set out exactly what is processed and for what purpose.'
              }
            ].map((item) => (
              <details key={item.q} className="group py-5 sm:py-6 transition-colors">
                <summary className="font-editorial text-base sm:text-lg text-[#162723] cursor-pointer font-medium list-none flex items-center gap-3 select-none hover:text-[#795663] transition-colors">
                  <span className="text-[10px] sm:text-xs text-[#162723] group-open:rotate-90 transition-transform duration-200 inline-block font-sans">
                    ▶
                  </span>
                  <span>{item.q}</span>
                </summary>
                <p className="font-zen text-xs sm:text-sm text-[#5C6873] pt-3 pl-6 leading-relaxed max-w-2xl sm:max-w-3xl">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 5. DARK INK CLOSING BAND (Treatment C: Deep Brand Surface) */}
      <section data-dark-section="true" className="relative w-full py-28 sm:py-36 px-6 sm:px-8 lg:px-12 bg-[#011627] text-white overflow-hidden text-center border-t border-[#F6F1EA]/10 border-b border-[#F6F1EA]/10">
        {/* Subtle celestial gold watercolor glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#B8964A]/12 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="font-mono-code text-xs tracking-widest uppercase text-[#C5A880] font-semibold">
            AGENCY OVER AUTOMATION
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-white font-normal leading-tight">
            No automated diagnosis. No autonomous treatment.
          </h2>
          <p className="font-zen text-base sm:text-lg text-[#9AA59F] leading-relaxed max-w-2xl sm:max-w-3xl mx-auto">
            The platform surfaces patterns so you and your therapist have clarity, but the judgment, direction, and authority remain entirely with a person.
          </p>
          <div className="pt-8 sm:pt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full">
            <a
              href="/login"
              onClick={handleAuthRedirect}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-zen font-semibold bg-[#C5A880] text-[#011627] hover:bg-[#D8BE9B] transition-all cursor-pointer shadow-sm text-center whitespace-nowrap"
            >
              <span>Start private, agency-led self-work</span>
              <span>→</span>
            </a>
            <button
              type="button"
              onClick={() => handleSelectTab('start')}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-zen font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/25 hover:border-white/50 transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>Work with a human psychologist</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  // -------------------------------------------------------------
  // TAB 6: EVIDENCE & RESEARCH
  // -------------------------------------------------------------
  const renderEvidence = () => (
    <div className="w-full space-y-0">
      
      {/* 1. HERO SECTION (Subtle Parchment Gradient with Watercolor Bleeds & Brushstroke) */}
      <section className="relative w-full min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-5.5rem)] flex flex-col justify-center items-center py-16 sm:py-20 px-6 sm:px-8 lg:px-12 overflow-hidden">
        {/* Ambient Top-Right Watercolor Wash (Dusty Rose) */}
        <svg
          className="absolute -top-16 -right-20 w-[420px] sm:w-[540px] h-auto opacity-60 pointer-events-none mix-blend-multiply"
          viewBox="0 0 600 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="ev-rose-wash" cx="70%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#C49A8F" stopOpacity="0.38" />
              <stop offset="45%" stopColor="#D9BCAF" stopOpacity="0.22" />
              <stop offset="75%" stopColor="#EFE3DE" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
            </radialGradient>
            <filter id="ev-bleed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>
          <path
            d="M500 40 C410 0 300 50 240 130 C180 210 180 320 230 400 C290 470 410 500 500 460 C580 420 620 320 630 210 C640 120 590 60 500 40 Z"
            fill="url(#ev-rose-wash)"
            filter="url(#ev-bleed)"
          />
          <circle cx="210" cy="180" r="3.5" fill="#C49A8F" opacity="0.28" />
          <circle cx="240" cy="220" r="2.5" fill="#C49A8F" opacity="0.22" />
        </svg>

        {/* Ambient Top-Left Watercolor Wash (Sage Green) */}
        <svg
          className="absolute -top-12 -left-16 w-[380px] sm:w-[480px] h-auto opacity-55 pointer-events-none mix-blend-multiply"
          viewBox="0 0 550 450"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="ev-sage-wash" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#7E9E82" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#96B49A" stopOpacity="0.2" />
              <stop offset="80%" stopColor="#C4D7C7" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path
            d="M80 50 C160 -10 290 20 380 80 C460 130 510 240 460 330 C410 410 290 440 210 420 C130 400 50 340 30 250 C10 160 10 90 80 50 Z"
            fill="url(#ev-sage-wash)"
            filter="url(#ev-bleed)"
          />
          <circle cx="410" cy="130" r="4" fill="#8AA688" opacity="0.25" />
        </svg>

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10 w-full my-auto flex flex-col items-center justify-center">
          <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
            EVIDENCE & RESEARCH
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#162723] font-normal leading-[1.12] max-w-3xl sm:max-w-4xl mx-auto">
            Why these building blocks make sense.
          </h1>
          <p className="font-zen text-base sm:text-lg text-[#5C6873] leading-relaxed max-w-2xl sm:max-w-3xl mx-auto">
            Ingress Within combines several evidence-informed mechanisms rather than presenting one feature as a complete answer.
          </p>
        </div>
      </section>

      {/* 2. EVIDENCE CARDS (Treatment B: Subtle Dynamic Thistle) */}
      <section className="relative w-full py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-thistle">
        <div className="max-w-5xl mx-auto space-y-10 sm:space-y-12 relative z-10">
        {/* Card 1: Digital Psychological Interventions */}
        <div className="group relative rounded-xl p-7 sm:p-9 bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs space-y-5 cursor-pointer">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7DECF]/60 pb-3.5">
            <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
              DIGITAL PSYCHOLOGICAL INTERVENTIONS
            </span>
            <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
              2024 Meta-Analysis · PubMed 39579466
            </span>
          </div>

          <h3 className="font-editorial text-2xl sm:text-3xl text-[#162723] font-normal leading-snug group-hover:text-[#795663] transition-colors">
            Structured online psychological work can help some people.
          </h3>

          {/* Key Study Highlights Strip */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-2.5 py-0.5 rounded-full border border-[#E7DECF] font-mono-code text-[10px] text-[#5C6873]">
              154 RCTs Included
            </span>
            <span className="px-2.5 py-0.5 rounded-full border border-[#E7DECF] font-mono-code text-[10px] text-[#5C6873]">
              45,335 Participants
            </span>
            <span className="px-2.5 py-0.5 rounded-full border border-[#2E7A70]/40 font-mono-code text-[10px] text-[#2E7A70] font-medium">
              Sustained CBT Effects
            </span>
          </div>

          <p className="font-zen text-sm sm:text-base text-[#5C6873] leading-relaxed max-w-4xl">
            A 2024 meta-analysis of 154 randomised controlled trials involving 45,335 participants found sustained effects for internet-delivered CBT across several outcomes, with results varying by intervention, outcome and guidance.
          </p>

          <div className="pt-2 border-t border-[#E7DECF]/60 flex items-center justify-between">
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/39579466/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-mono-code text-xs text-[#2E7A70] hover:text-[#162723] font-semibold transition-colors group/link"
            >
              <span>Read the study on PubMed</span>
              <span className="transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5">↗</span>
            </a>
            <span className="font-mono-code text-[10px] text-[#8D98A3]">Evidence item 01 / 03</span>
          </div>
        </div>

        {/* Card 2: Practice & Homework */}
        <div className="group relative rounded-xl p-7 sm:p-9 bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs space-y-5 cursor-pointer">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7DECF]/60 pb-3.5">
            <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
              PRACTICE & HOMEWORK
            </span>
            <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
              Systematic Review · PubMed 37104804
            </span>
          </div>

          <h3 className="font-editorial text-2xl sm:text-3xl text-[#162723] font-normal leading-snug group-hover:text-[#795663] transition-colors">
            Learning needs a chance to become behaviour.
          </h3>

          {/* Key Study Highlights Strip */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-2.5 py-0.5 rounded-full border border-[#E7DECF] font-mono-code text-[10px] text-[#5C6873]">
              Between-Session Practice
            </span>
            <span className="px-2.5 py-0.5 rounded-full border border-[#E7DECF] font-mono-code text-[10px] text-[#5C6873]">
              Collaborative Planning
            </span>
            <span className="px-2.5 py-0.5 rounded-full border border-[#795663]/40 font-mono-code text-[10px] text-[#795663] font-medium">
              Action Over Passive Recall
            </span>
          </div>

          <p className="font-zen text-sm sm:text-base text-[#5C6873] leading-relaxed max-w-4xl">
            A systematic review of between-session homework highlights the value of collaboratively planning, explaining and reviewing tasks. That supports making practice central to the product.
          </p>

          <div className="pt-2 border-t border-[#E7DECF]/60 flex items-center justify-between">
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/37104804/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-mono-code text-xs text-[#795663] hover:text-[#162723] font-semibold transition-colors group/link"
            >
              <span>Read the review on PubMed</span>
              <span className="transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5">↗</span>
            </a>
            <span className="font-mono-code text-[10px] text-[#8D98A3]">Evidence item 02 / 03</span>
          </div>
        </div>

        {/* Card 3: Therapeutic Relationship */}
        <div className="group relative rounded-xl p-7 sm:p-9 bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs space-y-5 cursor-pointer">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7DECF]/60 pb-3.5">
            <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
              THERAPEUTIC RELATIONSHIP
            </span>
            <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
              Alliance Meta-Analysis · PubMed 29792475
            </span>
          </div>

          <h3 className="font-editorial text-2xl sm:text-3xl text-[#162723] font-normal leading-snug group-hover:text-[#795663] transition-colors">
            The platform supports the therapist; it does not replace the relationship.
          </h3>

          {/* Key Study Highlights Strip */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-2.5 py-0.5 rounded-full border border-[#E7DECF] font-mono-code text-[10px] text-[#5C6873]">
              Alliance & Outcomes
            </span>
            <span className="px-2.5 py-0.5 rounded-full border border-[#E7DECF] font-mono-code text-[10px] text-[#5C6873]">
              Internet-Delivered Care
            </span>
            <span className="px-2.5 py-0.5 rounded-full border border-[#3D5265]/40 font-mono-code text-[10px] text-[#3D5265] font-medium">
              Human-In-The-Loop
            </span>
          </div>

          <p className="font-zen text-sm sm:text-base text-[#5C6873] leading-relaxed max-w-4xl">
            A large meta-analysis found a positive association between therapeutic alliance and psychotherapy outcomes, including internet-based psychotherapy.
          </p>

          <div className="pt-2 border-t border-[#E7DECF]/60 flex items-center justify-between">
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/29792475/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-mono-code text-xs text-[#3D5265] hover:text-[#162723] font-semibold transition-colors group/link"
            >
              <span>Read the meta-analysis on PubMed</span>
              <span className="transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5">↗</span>
            </a>
            <span className="font-mono-code text-[10px] text-[#8D98A3]">Evidence item 03 / 03</span>
          </div>
        </div>

        {/* Card 4: Critical Limits Card (Maintained as Card, No Section Background) */}
        <div className="rounded-2xl sm:rounded-3xl p-10 sm:p-14 bg-[#011627] text-white border border-[#C5A880]/30 shadow-lg relative overflow-hidden space-y-6">
          {/* Subtle Warm Celestial Glow inside the card */}
          <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-[#B8964A]/15 blur-2xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C5A880]/15 text-[#C5A880] font-mono-code text-[11px] font-semibold tracking-wider uppercase border border-[#C5A880]/30">
            <span>●</span>
            SCIENTIFIC BOUNDARY · LIMITS
          </div>

          <h3 className="font-editorial text-2xl sm:text-3xl text-white font-normal leading-snug">
            Evidence for an approach is not proof that this exact product works.
          </h3>

          <p className="font-zen text-sm sm:text-base text-[#9AA59F] leading-relaxed max-w-4xl">
            We keep those claims separate as our own evidence develops. Ingress Within draws upon proven behavioral and psychotherapeutic literature while conducting independent longitudinal evaluation.
          </p>
          <div className="pt-8 sm:pt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full">
            <a
              href="/login"
              onClick={handleAuthRedirect}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-zen font-semibold bg-[#C5A880] text-[#011627] hover:bg-[#D8BE9B] transition-all cursor-pointer shadow-sm text-center whitespace-nowrap"
            >
              <span>Practice evidence-based self-reflection</span>
              <span>→</span>
            </a>
            <button
              type="button"
              onClick={() => handleSelectTab('start')}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-zen font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/25 hover:border-white/50 transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>Work with a licensed psychologist</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
      </section>
    </div>
  );

  // -------------------------------------------------------------
  // TAB 7: ABOUT
  // -------------------------------------------------------------
  const renderAbout = () => (
    <div className="space-y-0 w-full">
      {/* 1. HERO SECTION */}
      <section className="relative w-full min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-5.5rem)] flex flex-col justify-center items-center py-16 sm:py-20 px-6 sm:px-8 lg:px-12 overflow-hidden">
        {/* Ambient Top-Right Watercolor Wash */}
        <svg
          className="absolute -top-10 -right-16 w-[420px] sm:w-[540px] h-auto opacity-50 pointer-events-none mix-blend-multiply"
          viewBox="0 0 600 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="about-rose-wash" cx="40%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#C49A8F" stopOpacity="0.38" />
              <stop offset="45%" stopColor="#D5ABA0" stopOpacity="0.22" />
              <stop offset="75%" stopColor="#EAD8CE" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path
            d="M90 60 C180 10 320 30 420 90 C510 150 560 270 510 370 C460 460 330 490 240 470 C150 450 60 380 35 280 C10 180 20 100 90 60 Z"
            fill="url(#about-rose-wash)"
          />
        </svg>

        <div className="max-w-5xl mx-auto space-y-8 relative z-10 text-center w-full my-auto flex flex-col items-center justify-center">
          <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
            ABOUT INGRESS WITHIN
          </div>

          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#162723] font-normal leading-[1.12] max-w-3xl sm:max-w-4xl mx-auto">
            One place for the different ways people work on their psychological health.
          </h1>

          <p className="font-zen text-base sm:text-lg text-[#5C6873] leading-relaxed max-w-2xl sm:max-w-3xl mx-auto">
            Sometimes you want to work on something yourself. Sometimes you want a therapist. Sometimes you want both. Ingress Within is built around that reality rather than forcing one route.
          </p>
        </div>
      </section>

      {/* 2. BUILT FOR INDIA (Treatment B: Subtle Dynamic Thistle) */}
      <section className="relative w-full py-14 sm:py-18 lg:py-20 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-thistle">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-2 sm:space-y-2.5">
            <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
              BUILT FOR INDIA
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl lg:text-[36px] text-[#162723] font-normal leading-[1.18] mx-auto">
              People often start with life, not clinical terminology.
            </h2>
            <p className="font-zen text-xs sm:text-sm md:text-[14px] text-[#5C6873] leading-relaxed max-w-2xl sm:max-w-3xl mx-auto">
              “I'm overthinking.” “I can't say no.” “My career is stressing me out.” “My relationship keeps repeating the same fight.” “I have everything, so why don't I feel okay?” The language can start there while the psychological depth sits underneath it.
            </p>
          </div>

          {/* Conversational quotes cards: Odd total (5) -> Center card anchors, others emerge outward */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {[
              { quote: "I'm overthinking.", theme: "Cognitive loop" },
              { quote: "I can't say no.", theme: "Boundaries" },
              { quote: "My career is stressing me out.", theme: "Work & Identity" },
              { quote: "My relationship keeps repeating the same fight.", theme: "Relational patterns" },
              { quote: "I have everything, so why don't I feel okay?", theme: "Inner alignment" }
            ].map((item, idx) => (
              <motion.div
                key={item.quote}
                {...getCardEmergence(idx, 5)}
                className="group relative rounded-xl p-5 sm:p-6 min-h-[130px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                      {item.theme}
                    </span>
                    <span className="font-editorial text-lg text-[#C49A8F]/60 group-hover:text-[#795663] transition-colors leading-none">“</span>
                  </div>
                  <p className="font-editorial text-base sm:text-[17px] text-[#162723] italic leading-snug group-hover:text-[#795663] transition-colors">
                    "{item.quote}"
                  </p>
                </div>
                <div className="pt-2.5 mt-3 border-t border-[#E7DECF]/60 flex items-center justify-between font-mono-code text-[10.5px] text-[#795663] group-hover:text-[#162723] transition-colors">
                  <span className="font-medium">Everyday entry point</span>
                  <span className="text-xs transition-transform duration-200 group-hover:translate-x-1">→</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Dual Contextual CTAs for Built For India */}
          <div className="pt-5 sm:pt-6 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full">
            <a
              href="/login"
              onClick={handleAuthRedirect}
              className="w-full sm:w-auto min-w-[240px] inline-flex items-center justify-center gap-2 bg-[#162723] hover:bg-[#203631] text-white font-zen text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>Explore your thoughts privately</span>
              <span>→</span>
            </a>
            <button
              type="button"
              onClick={() => handleSelectTab('start')}
              className="w-full sm:w-auto min-w-[240px] inline-flex items-center justify-center gap-2 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#162723] border border-[#795663]/30 hover:border-[#795663]/60 font-zen text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>Speak to an Indian psychologist</span>
              <span className="text-[#795663]">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. WHO'S BEHIND THIS (Treatment B: Subtle Dynamic Dusky Rose) */}
      <section className="relative w-full py-16 sm:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-rose">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-2.5 sm:space-y-3">
            <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
              WHO'S BEHIND THIS
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[40px] text-[#162723] font-normal leading-[1.18] mx-auto">
              Care from qualified professionals.
            </h2>
          </div>

          {/* 3 Therapist Profiles: Odd total (3) -> Center card anchors, left/right emerge outward */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {/* Card 1 */}
            <motion.div
              {...getCardEmergence(0, 3)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[250px] sm:min-h-[260px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    VERIFIED CARE
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    01 / 03
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl border border-[#E7DECF]/80 bg-white/70 flex items-center justify-center mb-3 group-hover:border-[#162723]/30 transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#2E7A70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  Verified therapist profiles
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Every therapist's qualifications and experience are reviewed before they're listed, and shown on their profile so you know who you're speaking with.
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-[#E7DECF]/60 flex items-center justify-between font-mono-code text-[11px] text-[#795663] group-hover:text-[#162723] transition-colors">
                <span className="font-medium">Clinical credentialing</span>
                <span className="text-xs transition-transform duration-200 group-hover:translate-x-1">→</span>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              {...getCardEmergence(1, 3)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[250px] sm:min-h-[260px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    CLIENT AUTONOMY
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    02 / 03
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl border border-[#E7DECF]/80 bg-white/70 flex items-center justify-center mb-3 group-hover:border-[#162723]/30 transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#3D5265" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="m19 8 2 2 4-4" />
                  </svg>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  You choose your therapist
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Browse profiles and areas of focus before you book. Nobody is assigned to you without a choice.
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-[#E7DECF]/60 flex items-center justify-between font-mono-code text-[11px] text-[#795663] group-hover:text-[#162723] transition-colors">
                <span className="font-medium">Direct selection</span>
                <span className="text-xs transition-transform duration-200 group-hover:translate-x-1">→</span>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              {...getCardEmergence(2, 3)}
              className="group relative rounded-xl p-6 sm:p-7 min-h-[250px] sm:min-h-[260px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    LOCAL RELEVANCE
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    03 / 03
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl border border-[#E7DECF]/80 bg-white/70 flex items-center justify-center mb-3 group-hover:border-[#162723]/30 transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#795663" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug mb-2 group-hover:text-[#795663] transition-colors">
                  Built with real conversations
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Features are shaped by talking to people who journal, and people who've been in therapy in India, not designed in a vacuum.
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-[#E7DECF]/60 flex items-center justify-between font-mono-code text-[11px] text-[#795663] group-hover:text-[#162723] transition-colors">
                <span className="font-medium">Cultural nuance</span>
                <span className="text-xs transition-transform duration-200 group-hover:translate-x-1">→</span>
              </div>
            </motion.div>
          </div>

          {/* Dual Contextual CTAs for Who's Behind This */}
          <div className="pt-6 sm:pt-7 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full">
            <a
              href="/login"
              onClick={handleAuthRedirect}
              className="w-full sm:w-auto min-w-[240px] inline-flex items-center justify-center gap-2 bg-[#162723] hover:bg-[#203631] text-white font-zen text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>Try self-reflection first</span>
              <span>→</span>
            </a>
            <button
              type="button"
              onClick={() => handleSelectTab('start')}
              className="w-full sm:w-auto min-w-[240px] inline-flex items-center justify-center gap-2 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#162723] border border-[#795663]/30 hover:border-[#795663]/60 font-zen text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-full shadow-xs hover:shadow transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>Browse verified therapists</span>
              <span className="text-[#795663]">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. PRIVATE, EVEN FROM FAMILY (Treatment B: Subtle Dynamic Fog Blue) */}
      <section className="relative w-full py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-fog">
        <div className="max-w-5xl mx-auto space-y-10 relative z-10 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-3.5 py-1 rounded-full border border-[#162723]/30 text-[#162723]/90 mx-auto">
              PRIVATE, EVEN FROM FAMILY
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[42px] text-[#162723] font-normal leading-tight mx-auto">
              What you share here stays yours to share.
            </h2>
            <p className="font-zen text-base sm:text-lg text-[#5C6873] leading-relaxed max-w-2xl sm:max-w-3xl mx-auto">
              Self-work stays private by default. Nobody, including family members, can see it unless you choose to share it, and a therapist only sees what you explicitly bring into session.
            </p>
          </div>

          {/* 3 Privacy Pillars: Odd total (3) -> Center card anchors, left/right emerge outward */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2 text-left">
            <motion.div
              {...getCardEmergence(0, 3)}
              className="group relative rounded-xl p-6 sm:p-7 bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#2E7A70]/30 text-[#2E7A70] group-hover:border-[#2E7A70]/60 transition-colors">
                    PRIVACY
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    BY DEFAULT
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug group-hover:text-[#2E7A70] transition-colors mb-2">
                  Default Private
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  No automatic sharing with anyone, including loved ones or family members.
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-[#E7DECF]/60 flex items-center justify-between font-mono-code text-[11px] text-[#2E7A70] group-hover:text-[#162723] transition-colors">
                <span>Personal sanctuary</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(1, 3)}
              className="group relative rounded-xl p-6 sm:p-7 bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#795663]/30 text-[#795663] group-hover:border-[#795663]/60 transition-colors">
                    SELECTION
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    CONTROLLED
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug group-hover:text-[#795663] transition-colors mb-2">
                  Explicit Selection
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  A therapist only receives what you intentionally select and bring to session.
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-[#E7DECF]/60 flex items-center justify-between font-mono-code text-[11px] text-[#795663] group-hover:text-[#162723] transition-colors">
                <span>Session boundaries</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(2, 3)}
              className="group relative rounded-xl p-6 sm:p-7 bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#3D5265]/30 text-[#3D5265] group-hover:border-[#3D5265]/60 transition-colors">
                    DPDP ACT
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    COMPLIANT
                  </span>
                </div>
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal leading-snug group-hover:text-[#3D5265] transition-colors mb-2">
                  Indian DPDP Aligned
                </h3>
                <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                  Engineered under India's Digital Personal Data Protection regulatory safeguards.
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-[#E7DECF]/60 flex items-center justify-between font-mono-code text-[11px] text-[#3D5265] group-hover:text-[#162723] transition-colors">
                <span>Regulatory safeguards</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. WHY NOW (Treatment B: Subtle Dynamic Royal Scepter) */}
      <section className="relative w-full py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-royal">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10 text-center">
          <span className="inline-flex items-center font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-3.5 py-1 rounded-full border border-[#162723]/30 text-[#162723]/90 mx-auto">
            WHY NOW
          </span>
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[42px] text-[#162723] font-normal leading-tight mx-auto">
            This conversation is already happening around you.
          </h2>
          <p className="font-zen text-base sm:text-lg text-[#5C6873] leading-relaxed max-w-2xl sm:max-w-3xl mx-auto">
            More people in India are talking openly about burnout, overthinking and family pressure than five years ago, in the news, at work, among friends. What's often missing isn't awareness, it's a place to actually work through it at your own pace, privately, without waiting for a crisis.
          </p>
        </div>
      </section>

      {/* 6. COMMON QUESTIONS (Treatment B: Subtle Dynamic Thistle) */}
      <section className="relative w-full py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden section-tint-thistle">
        <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-3.5 py-1 rounded-full border border-[#162723]/30 text-[#162723]/90 mx-auto">
              COMMON QUESTIONS
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[42px] text-[#162723] font-normal leading-tight mx-auto">
              Before you start.
            </h2>
          </div>

          {/* Collapsible Questions List with Clean Dividing Lines */}
          <div className="border-t border-[#E7DECF] divide-y divide-[#E7DECF] pt-2 max-w-3xl mx-auto">
            {[
              {
                q: 'Do I need to know if I want self-work or therapy?',
                a: 'No. Start with whichever feels easier, and switch or combine them whenever you want.'
              },
              {
                q: 'Is this only for people with a diagnosed condition?',
                a: 'No. Most people here are dealing with everyday emotional patterns (stress, guilt, overthinking, family or work pressure) before they build into something bigger, not a diagnosed disorder.'
              },
              {
                q: 'Can my family see what I write?',
                a: 'No. Your journal and self-work stay private by default, and nothing is shared without you choosing to.'
              },
              {
                q: 'Do I need to speak English?',
                a: 'English is supported at launch, with Hindi and other Indian languages planned next.'
              },
              {
                q: 'What if I want to stop?',
                a: 'You can cancel your self-work subscription anytime, and you\'re never locked into ongoing therapy sessions.'
              }
            ].map((item) => (
              <details key={item.q} className="group py-5 sm:py-6 transition-colors">
                <summary className="font-editorial text-base sm:text-lg text-[#162723] cursor-pointer font-medium list-none flex items-center gap-3 select-none hover:text-[#795663] transition-colors">
                  <span className="text-[10px] sm:text-xs text-[#162723] group-open:rotate-90 transition-transform duration-200 inline-block font-sans">
                    ▶
                  </span>
                  <span>{item.q}</span>
                </summary>
                <p className="font-zen text-xs sm:text-sm text-[#5C6873] pt-3 pl-6 leading-relaxed max-w-2xl sm:max-w-3xl">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 7. DARK INK CLOSING BAND (Treatment C: Deep Brand Surface) */}
      <section data-dark-section="true" className="relative w-full py-28 sm:py-36 px-6 sm:px-8 lg:px-12 bg-[#011627] text-white overflow-hidden text-center border-t border-[#F6F1EA]/10 border-b border-[#F6F1EA]/10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#B8964A]/12 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="font-mono-code text-xs tracking-widest uppercase text-[#C5A880] font-semibold">
            UNDERSTAND. GROW. CONTINUE.
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-white font-normal leading-tight">
            If any of this sounded familiar, that's the point to start.
          </h2>
          <p className="font-zen text-base sm:text-lg text-[#9AA59F] leading-relaxed max-w-2xl sm:max-w-3xl mx-auto">
            You don't have to wait for a breaking point to give your mental health structured care.
          </p>
          <div className="pt-8 sm:pt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full">
            <a
              href="/login"
              onClick={handleAuthRedirect}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-zen font-semibold bg-[#C5A880] text-[#011627] hover:bg-[#D8BE9B] transition-all cursor-pointer shadow-sm text-center whitespace-nowrap"
            >
              <span>Take the first step on your own</span>
              <span>→</span>
            </a>
            <button
              type="button"
              onClick={() => handleSelectTab('start')}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-zen font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/25 hover:border-white/50 transition-all cursor-pointer text-center whitespace-nowrap"
            >
              <span>Take the first step with a therapist</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  // -------------------------------------------------------------
  // TAB 8: POLICIES
  // -------------------------------------------------------------
  const renderPolicies = () => (
    <div className="w-full space-y-0">
      
      {/* 1. HERO SECTION (Subtle Parchment Gradient with Watercolor Bleeds & Brushstroke) */}
      <section className="relative w-full min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-5.5rem)] flex flex-col justify-center items-center py-16 sm:py-20 px-6 sm:px-8 lg:px-12 overflow-hidden">
        {/* Ambient Top-Right Watercolor Wash (Dusty Rose) */}
        <svg
          className="absolute -top-16 -right-20 w-[420px] sm:w-[540px] h-auto opacity-60 pointer-events-none mix-blend-multiply"
          viewBox="0 0 600 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="pol-rose-wash" cx="70%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#C49A8F" stopOpacity="0.38" />
              <stop offset="45%" stopColor="#D9BCAF" stopOpacity="0.22" />
              <stop offset="75%" stopColor="#EFE3DE" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
            </radialGradient>
            <filter id="pol-bleed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>
          <path
            d="M500 40 C410 0 300 50 240 130 C180 210 180 320 230 400 C290 470 410 500 500 460 C580 420 620 320 630 210 C640 120 590 60 500 40 Z"
            fill="url(#pol-rose-wash)"
            filter="url(#pol-bleed)"
          />
          <circle cx="210" cy="180" r="3.5" fill="#C49A8F" opacity="0.28" />
        </svg>

        {/* Ambient Top-Left Watercolor Wash (Sage Green) */}
        <svg
          className="absolute -top-12 -left-16 w-[380px] sm:w-[480px] h-auto opacity-55 pointer-events-none mix-blend-multiply"
          viewBox="0 0 550 450"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="pol-sage-wash" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#7E9E82" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#96B49A" stopOpacity="0.2" />
              <stop offset="80%" stopColor="#C4D7C7" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path
            d="M80 50 C160 -10 290 20 380 80 C460 130 510 240 460 330 C410 410 290 440 210 420 C130 400 50 340 30 250 C10 160 10 90 80 50 Z"
            fill="url(#pol-sage-wash)"
            filter="url(#pol-bleed)"
          />
        </svg>

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10 w-full my-auto flex flex-col items-center justify-center">
          <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
            POLICIES & LEGAL
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#162723] font-normal leading-[1.12] max-w-3xl sm:max-w-4xl mx-auto">
            Privacy, terms & refunds.
          </h1>
          <p className="font-zen text-base sm:text-lg text-[#5C6873] leading-relaxed max-w-2xl sm:max-w-3xl mx-auto">
            These are working drafts, shared for transparency ahead of launch. Final versions are reviewed by legal counsel.
          </p>
        </div>
      </section>

      {/* 2. POLICY CARDS (Treatment B: Clean Warm Paper) */}
      <section className="relative w-full py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden bg-warm-paper paper-grain">
        <div className="space-y-10 max-w-4xl mx-auto">
          <div className="group relative rounded-xl p-7 sm:p-8 bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-3 border-b border-[#E7DECF]/60 pb-3 mb-4">
                <h3 className="font-editorial text-2xl text-[#162723] group-hover:text-[#795663] transition-colors">Privacy Policy</h3>
                <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                  DPDP ACT COMPLIANT
                </span>
              </div>
              <p className="font-zen text-sm sm:text-base text-[#5C6873] leading-relaxed max-w-4xl">
                Covers what's collected (journal entries, session information, payment details), why it's collected, who can access it, how AI is used, how long data is retained, how to request deletion, and your rights under applicable Indian data protection law (Digital Personal Data Protection Act, 2023).
              </p>
            </div>
          </div>

          <div className="group relative rounded-xl p-7 sm:p-8 bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-3 border-b border-[#E7DECF]/60 pb-3 mb-4">
                <h3 className="font-editorial text-2xl text-[#162723] group-hover:text-[#2E7A70] transition-colors">Terms of Use</h3>
                <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                  PLATFORM RULES
                </span>
              </div>
              <p className="font-zen text-sm sm:text-base text-[#5C6873] leading-relaxed max-w-4xl">
                Covers eligibility, account responsibilities, acceptable use, the non-clinical role of AI-generated observations and reports, therapist-client conduct, and limitation of liability.
              </p>
            </div>
          </div>

          <div className="group relative rounded-xl p-7 sm:p-8 bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-3 border-b border-[#E7DECF]/60 pb-3 mb-4">
                <h3 className="font-editorial text-2xl text-[#162723] group-hover:text-[#A77C38] transition-colors">Cancellation & Refund Policy</h3>
                <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                  CLEAR & FAIR
                </span>
              </div>
              <p className="font-zen text-sm sm:text-base text-[#5C6873] leading-relaxed max-w-4xl">
                In line with standard practice across therapy platforms in India, individual therapy sessions are not eligible for a refund once booked, as a therapist has reserved that time for you. You can reschedule free of charge at least 24 hours before your session. The monthly self-work subscription (₹499/mo) can be cancelled anytime with one click for future cycles.
              </p>
            </div>
          </div>

          <div className="pt-6 text-center">
            <p className="font-zen text-xs sm:text-sm text-[#7D8E87]">
              Questions about any policy before it's finalised?{' '}
              <a
                href="mailto:hello@ingresswithin.com?subject=Question%20about%20policies"
                className="text-[#795663] font-semibold underline underline-offset-4 hover:text-[#5C3E49] transition-colors"
              >
                Write to hello@ingresswithin.com →
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );

  // -------------------------------------------------------------
  // TAB 9: START HERE / CONTACT
  // -------------------------------------------------------------
  const renderStart = () => (
    <div className="w-full space-y-0">
      
      {/* 1. HERO SECTION (Subtle Parchment Gradient with Watercolor Bleeds & Brushstroke) */}
      <section className="relative w-full min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-5.5rem)] flex flex-col justify-center items-center py-16 sm:py-20 px-6 sm:px-8 lg:px-12 overflow-hidden">
        {/* Ambient Top-Right Watercolor Wash (Dusty Rose) */}
        <svg
          className="absolute -top-16 -right-20 w-[420px] sm:w-[540px] h-auto opacity-60 pointer-events-none mix-blend-multiply"
          viewBox="0 0 600 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="start-rose-wash" cx="70%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#C49A8F" stopOpacity="0.38" />
              <stop offset="45%" stopColor="#D9BCAF" stopOpacity="0.22" />
              <stop offset="75%" stopColor="#EFE3DE" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
            </radialGradient>
            <filter id="start-bleed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>
          <path
            d="M500 40 C410 0 300 50 240 130 C180 210 180 320 230 400 C290 470 410 500 500 460 C580 420 620 320 630 210 C640 120 590 60 500 40 Z"
            fill="url(#start-rose-wash)"
            filter="url(#start-bleed)"
          />
          <circle cx="210" cy="180" r="3.5" fill="#C49A8F" opacity="0.28" />
        </svg>

        {/* Ambient Top-Left Watercolor Wash (Sage Green) */}
        <svg
          className="absolute -top-12 -left-16 w-[380px] sm:w-[480px] h-auto opacity-55 pointer-events-none mix-blend-multiply"
          viewBox="0 0 550 450"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="start-sage-wash" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#7E9E82" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#96B49A" stopOpacity="0.2" />
              <stop offset="80%" stopColor="#C4D7C7" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path
            d="M80 50 C160 -10 290 20 380 80 C460 130 510 240 460 330 C410 410 290 440 210 420 C130 400 50 340 30 250 C10 160 10 90 80 50 Z"
            fill="url(#start-sage-wash)"
            filter="url(#start-bleed)"
          />
        </svg>

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10 w-full my-auto flex flex-col items-center justify-center">
          <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
            START HERE
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#162723] font-normal leading-[1.12] max-w-3xl sm:max-w-4xl mx-auto">
            What would be useful to you right now?
          </h1>
          <p className="font-zen text-base sm:text-lg text-[#5C6873] leading-relaxed max-w-2xl sm:max-w-3xl mx-auto">
            Choose the kind of work or support you want today: no required order.
          </p>
        </div>
      </section>

      {/* 2. THREE STARTING PATHS (Treatment B: Clean Warm Paper) */}
      <section className="relative w-full py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden bg-warm-paper paper-grain">
        <div className="max-w-6xl mx-auto space-y-16 sm:space-y-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <motion.div
              {...getCardEmergence(0, 3)}
              className="group relative rounded-xl p-7 sm:p-8 bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#2E7A70]/30 text-[#2E7A70] group-hover:border-[#2E7A70]/60 transition-colors">
                    WORK ON YOURSELF
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    SELF-LED
                  </span>
                </div>
                <h3 className="font-editorial text-2xl text-[#162723] leading-snug group-hover:text-[#2E7A70] transition-colors mb-2.5">
                  I want to work on something independently.
                </h3>
                <p className="font-zen text-xs sm:text-sm text-[#5C6873] leading-relaxed">
                  Start with the journal, weekly reports and pattern detection.
                </p>
              </div>
              <div className="pt-5 mt-6 border-t border-[#E7DECF]/60">
                <a
                  href="/login"
                  onClick={handleAuthRedirect}
                  className="w-full text-center py-3.5 px-6 bg-[#162723] hover:bg-[#203631] text-white rounded-full text-sm font-semibold transition-all hover:scale-[1.01] shadow-2xs inline-block cursor-pointer"
                >
                  Start journaling independently →
                </a>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(1, 3)}
              className="group relative rounded-xl p-7 sm:p-8 bg-[#FDFBF8] hover:bg-white border border-[#795663]/40 hover:border-[#795663] transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#795663]/40 text-[#795663] group-hover:border-[#795663] transition-colors">
                    WITH A THERAPIST
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#795663]">
                    CLINICAL CARE
                  </span>
                </div>
                <h3 className="font-editorial text-2xl text-[#162723] leading-snug group-hover:text-[#795663] transition-colors mb-2.5">
                  I want professional support.
                </h3>
                <p className="font-zen text-xs sm:text-sm text-[#5C6873] leading-relaxed">
                  See goals, dashboard, homework, psychoeducation and continuity.
                </p>
              </div>
              <div className="pt-5 mt-6 border-t border-[#E7DECF]/60">
                <span
                  className="w-full text-center py-3.5 px-6 bg-[#795663] text-white rounded-full text-sm font-semibold shadow-2xs inline-block cursor-default select-none"
                >
                  Coming Soon
                </span>
              </div>
            </motion.div>

            <motion.div
              {...getCardEmergence(2, 3)}
              className="group relative rounded-xl p-7 sm:p-8 bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#3D5265]/30 text-[#3D5265] group-hover:border-[#3D5265]/60 transition-colors">
                    USE BOTH
                  </span>
                  <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#8D98A3]">
                    INTEGRATED
                  </span>
                </div>
                <h3 className="font-editorial text-2xl text-[#162723] leading-snug group-hover:text-[#3D5265] transition-colors mb-2.5">
                  I want the two to work together.
                </h3>
                <p className="font-zen text-xs sm:text-sm text-[#5C6873] leading-relaxed">
                  Bring selected self-work into therapy and continue learning independently.
                </p>
              </div>
              <div className="pt-5 mt-6 border-t border-[#E7DECF]/60">
                <button
                  type="button"
                  onClick={() => handleSelectTab('how')}
                  className="w-full text-center py-3.5 px-6 bg-[#FAF7F2] hover:bg-white text-[#162723] border border-[#E7DECF] hover:border-[#162723]/40 rounded-full text-sm font-semibold transition-all hover:scale-[1.01] shadow-2xs cursor-pointer"
                >
                  Show me how it connects →
                </button>
              </div>
            </motion.div>
          </div>

          {/* ========================================================================= */}
          {/* JOIN OUR WHATSAPP COMMUNITY CARD: The Unsaid by Ingress Within */}
          {/* ========================================================================= */}
          <div className="w-full rounded-2xl p-8 sm:p-12 bg-[#FDFBF8] border border-[#E7DECF] shadow-xs relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Title, Opening & Primary CTA */}
              <div className="md:col-span-7 space-y-5">
                <h3 className="font-editorial text-2xl sm:text-3xl lg:text-4xl text-[#162723] leading-tight flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="text-[#795663]">The Unsaid</span>
                  <span className="font-editorial italic font-normal text-lg sm:text-xl lg:text-2xl text-[#5C6873]">
                    by Ingress Within
                  </span>
                </h3>
                <p className="font-zen text-base sm:text-lg text-[#162723]/90 font-medium leading-relaxed">
                  For the thoughts, questions and experiences we rarely say out loud.
                </p>
                <p className="font-zen text-sm sm:text-base text-[#5C6873] leading-relaxed">
                  The Unsaid is a community for talking about them. A place to share what’s on your mind, ask difficult questions, hear different perspectives, and have honest conversations about mental and emotional wellbeing.
                </p>
                <div className="pt-2">
                  <a
                    href="https://chat.whatsapp.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 py-3.5 px-7 bg-[#162723] hover:bg-[#203631] text-white text-sm font-semibold rounded-full cursor-pointer transition-all hover:scale-[1.01] shadow-xs group"
                  >
                    <svg
                      className="w-4 h-4 text-[#25D366] fill-current flex-shrink-0"
                      viewBox="0 0 24 24"
                    >
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                    <span>Join WhatsApp Community</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </a>
                </div>
              </div>

              {/* Right Column: QR Code to Join */}
              <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-[#E7DECF] pt-6 md:pt-0 md:pl-8 lg:pl-10 flex flex-col items-center justify-center text-center">
                <div className="p-2 sm:p-2.5 bg-white rounded-2xl border border-[#E7DECF] shadow-xs inline-block relative group">
                  <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-xl overflow-hidden bg-white flex items-center justify-center p-1">
                    <img
                      src="/whatsapp-community-qr.svg"
                      alt="Scan QR to join The Unsaid WhatsApp Community"
                      className="w-full h-full object-contain"
                    />
                    {/* Centered WhatsApp icon badge */}
                    <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-white shadow-md border border-[#E7DECF]/80 flex items-center justify-center p-1.5 pointer-events-none">
                      <svg
                        className="w-full h-full text-[#25D366] fill-current"
                        viewBox="0 0 24 24"
                      >
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="pt-3 space-y-1">
                  <span className="font-mono-code text-[10.5px] uppercase tracking-wider text-[#795663] font-semibold block">
                    SCAN TO JOIN
                  </span>
                  <p className="font-zen text-xs text-[#5C6873]">
                    Scan with your phone to open WhatsApp
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PREVIOUS ORIENTATION BOOKING CARD (HIDDEN - PRESERVED AS REQUESTED) */}
          {/* ========================================================================= */}
          <div className="hidden" aria-hidden="true">
            <div>
              <div className="inline-flex items-center gap-2 font-mono-code text-[9.5px] sm:text-[10px] uppercase tracking-wider text-[#795663] px-3 py-0.5 rounded-full border border-[#795663]/30 font-semibold mb-2">
                <span>●</span> NOT SURE WHICH ONE YET?
              </div>
              <h3 className="font-editorial text-2xl sm:text-3xl text-[#162723] pt-1">
                Talk to us first: no commitment, no charge.
              </h3>
              <p className="font-zen text-sm sm:text-base text-[#5C6873] pt-2 max-w-2xl sm:max-w-3xl leading-relaxed">
                A free 15-minute orientation call to explain which option (self-work, therapy, or both) is likely to fit, so you are not guessing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 items-center">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono-code text-[10.5px] uppercase tracking-wider text-[#7D8E87] block mb-1.5 font-semibold">DATE</label>
                    <input
                      type="date"
                      value={orientDate}
                      onChange={(e) => setOrientDate(e.target.value)}
                      className="w-full p-3 bg-white rounded-xl border border-[#E7DECF] text-xs font-zen text-[#162723] focus:outline-none focus:border-[#795663]"
                    />
                  </div>
                  <div>
                    <label className="font-mono-code text-[10.5px] uppercase tracking-wider text-[#7D8E87] block mb-1.5 font-semibold">TIME</label>
                    <select
                      value={orientTime}
                      onChange={(e) => setOrientTime(e.target.value)}
                      className="w-full p-3 bg-white rounded-xl border border-[#E7DECF] text-xs font-zen text-[#162723] focus:outline-none focus:border-[#795663]"
                    >
                      <option>10:00 AM</option>
                      <option>12:00 PM</option>
                      <option>3:00 PM</option>
                      <option>5:30 PM</option>
                      <option>7:00 PM</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBookingNotice('Orientation slot selected! Our care team will confirm via email.')}
                  className="w-full py-3.5 px-7 bg-[#162723] hover:bg-[#203631] text-white text-sm font-semibold rounded-full cursor-pointer transition-all hover:scale-[1.01] shadow-xs"
                >
                  Reserve my free call
                </button>
                {bookingNotice && (
                  <p className="text-xs font-zen text-[#2E7A70] font-semibold">{bookingNotice}</p>
                )}
              </div>

              <div className="border-t md:border-t-0 md:border-l border-[#E7DECF] pt-6 md:pt-0 md:pl-8 space-y-3">
                <span className="font-mono-code text-xs text-[#795663] font-semibold tracking-wider uppercase">PREFER EMAIL?</span>
                <h4 className="font-editorial text-xl text-[#162723]">Write to our care team directly.</h4>
                <p className="font-zen text-xs sm:text-sm text-[#5C6873] leading-relaxed">
                  Tell us a little about what is going on — we will reply with an honest suggestion within one business day.
                </p>
                <div className="pt-2">
                  <a
                    href="mailto:hello@ingresswithin.com?subject=Not%20sure%20where%20to%20start"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold bg-white hover:bg-[#FAF7F2] text-[#795663] border border-[#795663]/40 hover:border-[#795663] transition-all cursor-pointer shadow-2xs"
                  >
                    <span>hello@ingresswithin.com</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  // -------------------------------------------------------------
  // TAB 10: CRISIS RESOURCES (Clear, Accessible, Emergency-First)
  // -------------------------------------------------------------
  const renderCrisis = () => (
    <div className="w-full space-y-0">
      
      {/* 1. HERO SECTION (Treatment B: Clean Warm Paper) */}
      <section className="relative w-full min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-5.5rem)] flex flex-col justify-center items-center py-16 sm:py-20 px-6 sm:px-8 lg:px-12 overflow-hidden bg-warm-paper paper-grain">
        {/* Ambient Top-Right Watercolor Wash (Dusty Rose) */}
        <svg
          className="absolute -top-16 -right-20 w-[420px] sm:w-[540px] h-auto opacity-60 pointer-events-none mix-blend-multiply"
          viewBox="0 0 600 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="crisis-rose-wash" cx="70%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#C49A8F" stopOpacity="0.38" />
              <stop offset="45%" stopColor="#D9BCAF" stopOpacity="0.22" />
              <stop offset="75%" stopColor="#EFE3DE" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
            </radialGradient>
            <filter id="crisis-bleed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>
          <path
            d="M500 40 C410 0 300 50 240 130 C180 210 180 320 230 400 C290 470 410 500 500 460 C580 420 620 320 630 210 C640 120 590 60 500 40 Z"
            fill="url(#crisis-rose-wash)"
            filter="url(#crisis-bleed)"
          />
          <circle cx="210" cy="180" r="3.5" fill="#C49A8F" opacity="0.28" />
        </svg>

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10 w-full my-auto flex flex-col items-center justify-center">
          <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#9A4232]/60 text-[#9A4232] mx-auto">
            EMERGENCY RESOURCES · 24×7
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#162723] font-normal leading-[1.12] max-w-3xl sm:max-w-4xl mx-auto">
            If you're in crisis, start here, not on the rest of this site.
          </h1>
          <p className="font-zen text-base sm:text-lg text-[#5C6873] leading-relaxed max-w-2xl sm:max-w-3xl mx-auto">
            Ingress Within is a self-work and therapist platform. It is not built or staffed to respond in real time, so it cannot be your safety net in an emergency. The services below can.
          </p>
        </div>
      </section>

      {/* 2. EMERGENCY HELPLINES CONTAINER (Treatment B: Clean Warm Paper) */}
      <section className="relative w-full py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden bg-warm-paper paper-grain">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="rounded-xl p-8 sm:p-12 bg-[#FDFBF8] border border-[#E7DECF] shadow-xs space-y-8">
            <div className="p-6 rounded-xl bg-white border border-[#E8C5BE]/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#9A4232]/40 text-[#9A4232]">
                  IMMEDIATE DANGER
                </span>
                <span className="font-mono-code text-[9.5px] sm:text-[10px] tracking-wider text-[#9A4232]">
                  CALL 112
                </span>
              </div>
              <h3 className="font-editorial text-xl sm:text-2xl text-[#9A4232] font-medium">
                If there is immediate danger to life
              </h3>
              <p className="font-zen text-xs sm:text-sm text-[#7D382B] leading-relaxed">
                Call <a href="tel:112" className="text-base font-mono-code font-bold underline underline-offset-4 text-[#9A4232]">112</a> (National Emergency Number) or go directly to the nearest hospital emergency room.
              </p>
            </div>

            <div className="space-y-3.5 border-t border-[#E7DECF]/80 pt-6">
              {[
                {
                  name: 'Tele MANAS (Govt. of India)',
                  desc: 'National mental health helpline · 24×7 · Multiple Indian languages',
                  actionLabel: 'Call 14416',
                  href: 'tel:14416',
                  tag: 'GOVT · 24×7',
                  primary: true,
                },
                {
                  name: 'AASRA',
                  desc: 'Suicide prevention and crisis counselling · 24×7',
                  actionLabel: '+91 98204 66726',
                  href: 'tel:+919820466726',
                  tag: '24×7 CRISIS',
                  primary: false,
                },
                {
                  name: 'Vandrevala Foundation',
                  desc: 'Free mental health counselling · 24×7 · Call & WhatsApp',
                  actionLabel: '1860-266-2345',
                  href: 'tel:18602662345',
                  tag: 'CALL & WHATSAPP',
                  primary: false,
                },
                {
                  name: 'iCall (TISS)',
                  desc: 'Psychosocial helpline · Mon–Sat, 8am–10pm',
                  actionLabel: '+91 9152987821',
                  href: 'tel:+919152987821',
                  tag: 'MON–SAT · 8AM–10PM',
                  primary: false,
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className="group rounded-xl p-4 sm:p-5 bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-200 shadow-2xs hover:shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <b className="font-editorial text-base sm:text-lg text-[#162723] font-medium">{item.name}</b>
                      <span className="inline-flex items-center font-mono-code text-[8.5px] tracking-wider uppercase font-medium px-2 py-0.5 rounded-full border border-[#162723]/20 text-[#162723]/70">
                        {item.tag}
                      </span>
                    </div>
                    <span className="font-zen text-xs text-[#5C6873] block">{item.desc}</span>
                  </div>
                  <a
                    href={item.href}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full font-mono-code font-semibold text-xs tracking-wider transition-all whitespace-nowrap ${
                      item.primary
                        ? 'bg-[#162723] hover:bg-[#203631] text-white shadow-2xs'
                        : 'bg-[#FAF7F2] hover:bg-white text-[#795663] border border-[#795663]/40 hover:border-[#795663]'
                    }`}
                  >
                    <span>{item.actionLabel}</span>
                    <span>↗</span>
                  </a>
                </div>
              ))}
            </div>

            <p className="font-zen text-xs text-[#7D8E87] leading-relaxed border-t border-[#E7DECF]/80 pt-4">
              Ingress Within does not operate these helplines and cannot guarantee wait times or availability, as they are independent emergency services provided here for your safety.
            </p>
          </div>

          <div className="text-center pt-2">
            <p className="font-zen text-sm text-[#5C6873]">
              Once you're safe and want to think about ongoing self-work or therapy,{' '}
              <button
                type="button"
                onClick={() => handleSelectTab('start')}
                className="text-[#795663] font-semibold underline underline-offset-4 hover:text-[#5C3E49] cursor-pointer"
              >
                come back and explore the platform →
              </button>
            </p>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#162723] font-zen selection:bg-[#EFE3E4] selection:text-[#795663] relative">
      {/* 1. Ambient SVG Watercolor Bleeds */}
      <WatercolorBackground activeTab={activeTab} />

      {/* 2. Editorial Top Navbar */}
      <EditorialNavbar activeTab={activeTab} onSelectTab={handleSelectTab} />

      {/* 3. Main Content Area */}
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.85, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'home' && renderHome()}
            {activeTab === 'solution' && renderSolution()}
            {activeTab === 'how' && renderHowItWorks()}
            {activeTab === 'pricing' && renderPricing()}
            {activeTab === 'ai' && renderAiData()}
            {activeTab === 'evidence' && renderEvidence()}
            {activeTab === 'about' && renderAbout()}
            {activeTab === 'policies' && renderPolicies()}
            {activeTab === 'start' && renderStart()}
            {activeTab === 'crisis' && renderCrisis()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 4. Editorial Dark Ink Footer */}
      <PublicFooter onSelectTab={handleSelectTab} onOpenPolicy={onOpenPolicy} />
    </div>
  );
}
