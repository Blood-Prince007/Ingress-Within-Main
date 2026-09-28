import React from 'react';

/**
 * Section 04 · The Spectrum of Inquiry
 * Exact recreation of media_1789631755771.jpg:
 * - Investigation/pinboard canvas with realistic deckled/torn paper cards
 * - 6 distinct watercolor-tinted paper swatches with organic rotations & vertical offsets
 * - Exact 3D brass pins with metallic bevel & cast drop shadows
 * - Exact 8 interconnected copper/red twine strings connecting the pins
 * - Exact washi tape strips, folded dog-eared corners, and handwritten Kalam notes & curved arrows
 */
export default function SpectrumOfInquirySection() {
  return (
    <section className="relative py-20 md:py-28 px-4 sm:px-6 overflow-hidden bg-[#FAF6F0]">

      <div className="max-w-7xl mx-auto text-center space-y-4">
        {/* Eyebrow */}
        <div className="font-mono-code text-[11px] sm:text-[11.5px] tracking-[0.24em] uppercase text-[#7A8580] font-semibold">
          THE SPECTRUM OF INQUIRY
        </div>

        {/* Heading */}
        <h2 className="font-editorial text-4xl sm:text-5xl md:text-[56px] text-[#162723] font-normal tracking-tight max-w-3xl mx-auto leading-[1.12]">
          What Ingress Within helps you <br className="hidden sm:inline" />
          explore.
        </h2>

        {/* Subtitle */}
        <p className="font-zen text-sm sm:text-base text-[#606E6B] max-w-2xl mx-auto leading-relaxed pt-1">
          Six interconnected dimensions of self-awareness designed to build psychological maturity.
        </p>

        {/* ======================================================= */}
        {/* DESKTOP PINBOARD CANVAS (>= 1024px)                     */}
        {/* ======================================================= */}
        <div className="hidden lg:block relative mx-auto mt-12 w-[1160px] h-[760px] select-none text-left">
          {/* SVG COPPER STRINGS NETWORK */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 1160 760"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="string-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#1a0f0a" floodOpacity="0.22" />
              </filter>
            </defs>

            {/*
              Exact Pin Coordinates on Canvas:
              Pin 1 (Thoughts): (200, 72)
              Pin 2 (Emotions): (565, 126)
              Pin 3 (Reactions): (905, 82)
              Pin 4 (Patterns): (270, 395)
              Pin 5 (Values): (605, 412)
              Pin 6 (Self-Understanding): (850, 422)
            */}
            <g filter="url(#string-shadow)" stroke="#A8533C" strokeWidth="1.8" strokeLinecap="round">
              {/* Pin 1 -> Pin 2 */}
              <line x1="200" y1="72" x2="565" y2="126" />
              {/* Pin 1 -> Pin 4 */}
              <line x1="200" y1="72" x2="270" y2="395" />
              {/* Pin 2 -> Pin 3 */}
              <line x1="565" y1="126" x2="905" y2="82" />
              {/* Pin 2 -> Pin 4 */}
              <line x1="565" y1="126" x2="270" y2="395" />
              {/* Pin 2 -> Pin 5 */}
              <line x1="565" y1="126" x2="605" y2="412" />
              {/* Pin 3 -> Pin 4 (long diagonal detective crossing) */}
              <line x1="905" y1="82" x2="270" y2="395" />
              {/* Pin 3 -> Pin 6 */}
              <line x1="905" y1="82" x2="850" y2="422" />
              {/* Pin 5 -> Pin 6 */}
              <line x1="605" y1="412" x2="850" y2="422" />
            </g>
          </svg>

          {/* ---------------------------------------------------- */}
          {/* CARD 01: THOUGHTS                                     */}
          {/* ---------------------------------------------------- */}
          <div
            className="absolute z-20"
            style={{
              left: '115px',
              top: '52px',
              width: '275px',
              transform: 'rotate(-1.2deg)'
            }}
          >
            {/* Note Left Callout: "What am I telling myself?" */}
            <div
              className="absolute -left-[95px] top-[15px] font-handwriting text-[#5A635E] text-[15px] leading-tight select-none pointer-events-none -rotate-6 text-right"
              style={{ width: '85px' }}
            >
              <span>What<br />am I telling<br />myself?</span>
              {/* Curved arrow pointing down-right toward card */}
              <svg className="w-8 h-8 ml-auto mt-0.5 text-[#5A635E]" viewBox="0 0 32 32" fill="none">
                <path d="M6 4 C14 10, 20 18, 22 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M16 26 L22 26 L22 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Paper Card */}
            <div
              className="relative p-6 bg-[#F9F6F0] rounded-xs border border-[#E8E0D2]/70 shadow-[0_8px_25px_rgba(40,30,20,0.08),0_2px_6px_rgba(40,30,20,0.04)]"
            >
              {/* Brass Pushpin at (85px, 20px) inside card */}
              <div
                className="absolute z-30 pointer-events-none"
                style={{ left: '85px', top: '20px' }}
              >
                <div className="brass-pin-realistic" />
              </div>

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-[#1E2A2E]/10 pb-3 mb-3.5">
                <span className="font-mono-code text-[11px] font-bold text-[#1E2A2E]/70">01</span>
                <span className="font-mono-code text-[9px] tracking-[0.16em] uppercase font-semibold text-[#6C7872]">
                  COGNITIVE OBSERVATION
                </span>
              </div>

              {/* Title & Body */}
              <h3 className="font-editorial text-[25px] text-[#162723] font-normal mb-2 leading-none">
                Thoughts
              </h3>
              <p className="font-zen text-[12.5px] text-[#4F635E] leading-[1.6]">
                Notice what repeatedly occupies your mind, the assumptions you make under uncertainty, and the narratives you tell yourself.
              </p>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* CARD 02: EMOTIONS                                     */}
          {/* ---------------------------------------------------- */}
          <div
            className="absolute z-20"
            style={{
              left: '425px',
              top: '110px',
              width: '275px',
              transform: 'rotate(1.5deg)'
            }}
          >
            {/* Callout Above Card 2 & 3: "Feel it to understand it." */}
            <div
              className="absolute left-[255px] -top-[65px] font-handwriting text-[#5A635E] text-[15px] leading-tight select-none pointer-events-none -rotate-2 whitespace-nowrap"
            >
              <span>Feel<br />it to<br />understand<br />it.</span>
            </div>

            {/* Paper Card */}
            <div
              className="relative p-6 bg-[#F5EBE6] rounded-xs border border-[#E8D6CE]/80 shadow-[0_8px_25px_rgba(40,30,20,0.08),0_2px_6px_rgba(40,30,20,0.04)]"
            >
              {/* Brass Pushpin at (140px, 16px) inside card */}
              <div
                className="absolute z-30 pointer-events-none"
                style={{ left: '140px', top: '16px' }}
              >
                <div className="brass-pin-realistic" />
              </div>

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-[#795663]/15 pb-3 mb-3.5">
                <span className="font-mono-code text-[11px] font-bold text-[#1E2A2E]/70">02</span>
                <span className="font-mono-code text-[9px] tracking-[0.16em] uppercase font-semibold text-[#8C6270]">
                  GRANULAR REGISTRATION
                </span>
              </div>

              {/* Title & Body */}
              <h3 className="font-editorial text-[25px] text-[#162723] font-normal mb-2 leading-none">
                Emotions
              </h3>
              <p className="font-zen text-[12.5px] text-[#4F635E] leading-[1.6]">
                Explore the nuance behind how experiences affect you. Move beyond simple labels toward exact emotional vocabulary.
              </p>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* CARD 03: REACTIONS                                    */}
          {/* ---------------------------------------------------- */}
          <div
            className="absolute z-20"
            style={{
              left: '770px',
              top: '64px',
              width: '275px',
              transform: 'rotate(-0.8deg)'
            }}
          >
            {/* Note Right Callout: "What sets this off?" */}
            <div
              className="absolute -right-[75px] top-[15px] font-handwriting text-[#5A635E] text-[15px] leading-tight select-none pointer-events-none rotate-3 text-left"
              style={{ width: '70px' }}
            >
              <span>What<br />sets this<br />off?</span>
              {/* Curved arrow pointing down-left toward card */}
              <svg className="w-8 h-8 mt-1 text-[#5A635E]" viewBox="0 0 32 32" fill="none">
                <path d="M24 4 C18 12, 12 18, 6 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12 24 L6 24 L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Paper Card */}
            <div
              className="relative p-6 bg-[#E3ECF1] rounded-xs border border-[#CDDCE4]/80 shadow-[0_8px_25px_rgba(40,30,20,0.08),0_2px_6px_rgba(40,30,20,0.04)]"
            >
              {/* Brass Pushpin at (135px, 18px) inside card */}
              <div
                className="absolute z-30 pointer-events-none"
                style={{ left: '135px', top: '18px' }}
              >
                <div className="brass-pin-realistic" />
              </div>

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-[#4A6478]/15 pb-3 mb-3.5">
                <span className="font-mono-code text-[11px] font-bold text-[#1E2A2E]/70">03</span>
                <span className="font-mono-code text-[9px] tracking-[0.16em] uppercase font-semibold text-[#537085]">
                  BEHAVIORAL TRIGGERS
                </span>
              </div>

              {/* Title & Body */}
              <h3 className="font-editorial text-[25px] text-[#162723] font-normal mb-2 leading-none">
                Reactions
              </h3>
              <p className="font-zen text-[12.5px] text-[#4F635E] leading-[1.6]">
                Understand how you instinctively respond in high-friction, conflict, or vulnerable moments before automatic habits take over.
              </p>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* CARD 04: PATTERNS                                     */}
          {/* ---------------------------------------------------- */}
          <div
            className="absolute z-20"
            style={{
              left: '125px',
              top: '372px',
              width: '275px',
              transform: 'rotate(1.2deg)'
            }}
          >
            {/* Washi tape at top-left corner */}
            <div
              className="absolute -top-3 -left-4 w-16 h-5.5 washi-tape-realistic -rotate-12 z-30 pointer-events-none"
            />

            {/* Note Left Callout: "A bigger picture emerges." */}
            <div
              className="absolute -left-[95px] top-[70px] font-handwriting text-[#5A635E] text-[15px] leading-tight select-none pointer-events-none -rotate-6 text-right"
              style={{ width: '85px' }}
            >
              <span>A bigger<br />picture<br />emerges.</span>
              {/* Curved arrow */}
              <svg className="w-8 h-8 ml-auto mt-0.5 text-[#5A635E]" viewBox="0 0 32 32" fill="none">
                <path d="M6 6 C12 12, 18 18, 24 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M18 22 L24 22 L24 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Paper Card */}
            <div
              className="relative p-6 bg-[#DFE8DC] rounded-xs border border-[#CCDBC8]/80 shadow-[0_8px_25px_rgba(40,30,20,0.08),0_2px_6px_rgba(40,30,20,0.04)]"
            >
              {/* Brass Pushpin at (145px, 23px) inside card */}
              <div
                className="absolute z-30 pointer-events-none"
                style={{ left: '145px', top: '23px' }}
              >
                <div className="brass-pin-realistic" />
              </div>

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-[#5C7D64]/15 pb-3 mb-3.5">
                <span className="font-mono-code text-[11px] font-bold text-[#1E2A2E]/70">04</span>
                <span className="font-mono-code text-[9px] tracking-[0.16em] uppercase font-semibold text-[#5A7961]">
                  THEMATIC CONNECTIONS
                </span>
              </div>

              {/* Title & Body */}
              <h3 className="font-editorial text-[25px] text-[#162723] font-normal mb-2 leading-none">
                Patterns
              </h3>
              <p className="font-zen text-[12.5px] text-[#4F635E] leading-[1.6]">
                See the recurring loops that connect disparate events across weeks and months, revealing unseen behavioral costs.
              </p>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* CARD 05: VALUES                                       */}
          {/* ---------------------------------------------------- */}
          <div
            className="absolute z-20"
            style={{
              left: '460px',
              top: '395px',
              width: '275px',
              transform: 'rotate(-0.5deg)'
            }}
          >
            {/* Note Below Card: Hand-drawn loop encircling "What do I want this to be about?" */}
            <div
              className="absolute -left-[75px] -bottom-[48px] font-handwriting text-[#5A635E] text-[14px] leading-tight select-none pointer-events-none -rotate-3 z-30"
            >
              <div className="relative px-5 py-2.5">
                <svg
                  className="absolute inset-0 w-full h-full text-[#6B7570] pointer-events-none"
                  viewBox="0 0 160 70"
                  fill="none"
                >
                  <path
                    d="M 25 15 C 65 5, 135 8, 150 28 C 165 48, 125 65, 75 66 C 25 67, 5 52, 10 32 C 15 14, 60 8, 105 10"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="relative z-10 block text-center">
                  What<br />do I want<br />this to be about?
                </span>
              </div>
            </div>

            {/* Paper Card */}
            <div
              className="relative p-6 bg-[#F7F2E4] rounded-xs border border-[#E8DFC9]/80 shadow-[0_8px_25px_rgba(40,30,20,0.08),0_2px_6px_rgba(40,30,20,0.04)]"
            >
              {/* Brass Pushpin at (145px, 17px) inside card */}
              <div
                className="absolute z-30 pointer-events-none"
                style={{ left: '145px', top: '17px' }}
              >
                <div className="brass-pin-realistic" />
              </div>

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-[#8C7A4E]/15 pb-3 mb-3.5">
                <span className="font-mono-code text-[11px] font-bold text-[#1E2A2E]/70">05</span>
                <span className="font-mono-code text-[9px] tracking-[0.16em] uppercase font-semibold text-[#80724C]">
                  INTERNAL COMPASS
                </span>
              </div>

              {/* Title & Body */}
              <h3 className="font-editorial text-[25px] text-[#162723] font-normal mb-2 leading-none">
                Values
              </h3>
              <p className="font-zen text-[12.5px] text-[#4F635E] leading-[1.6]">
                Clarify what genuinely matters to you and distinguish authentic principles from inherited obligations or social expectations.
              </p>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* CARD 06: SELF-UNDERSTANDING                           */}
          {/* ---------------------------------------------------- */}
          <div
            className="absolute z-20"
            style={{
              left: '765px',
              top: '400px',
              width: '275px',
              transform: 'rotate(0.8deg)'
            }}
          >
            {/* Washi tape at bottom-right edge */}
            <div
              className="absolute -bottom-3 -right-3 w-14 h-5 washi-tape-realistic rotate-12 z-30 pointer-events-none"
            />
            {/* Washi tape at top-right edge */}
            <div
              className="absolute -top-3.5 right-6 w-12 h-5 washi-tape-realistic -rotate-6 z-30 pointer-events-none"
            />

            {/* Note Right Callout: "A calmer, clearer me." */}
            <div
              className="absolute -right-[80px] top-[90px] font-handwriting text-[#5A635E] text-[15px] leading-tight select-none pointer-events-none rotate-3 text-left"
              style={{ width: '80px' }}
            >
              <span>A calmer,<br />clearer me.</span>
              {/* Curved arrow pointing down-left toward card */}
              <svg className="w-8 h-8 mt-1 text-[#5A635E]" viewBox="0 0 32 32" fill="none">
                <path d="M22 6 C16 14, 10 20, 4 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M10 24 L4 24 L4 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Paper Card with Dog-Eared Bottom Right */}
            <div
              className="relative p-6 bg-[#ECE8F0] rounded-xs border border-[#DDD6E4]/80 shadow-[0_8px_25px_rgba(40,30,20,0.08),0_2px_6px_rgba(40,30,20,0.04)] overflow-hidden"
            >
              {/* Realistic Dog-Eared Fold on Bottom Right */}
              <div
                className="absolute bottom-0 right-0 w-6 h-6 z-10 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, transparent 50%, rgba(200, 192, 210, 0.9) 50%)',
                  boxShadow: '-1px -1px 3px rgba(0,0,0,0.12)'
                }}
              />

              {/* Brass Pushpin at (85px, 22px) inside card */}
              <div
                className="absolute z-30 pointer-events-none"
                style={{ left: '85px', top: '22px' }}
              >
                <div className="brass-pin-realistic" />
              </div>

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-[#6E5D7A]/15 pb-3 mb-3.5">
                <span className="font-mono-code text-[11px] font-bold text-[#1E2A2E]/70">06</span>
                <span className="font-mono-code text-[9px] tracking-[0.16em] uppercase font-semibold text-[#73637E]">
                  INTEGRATED WISDOM
                </span>
              </div>

              {/* Title & Body */}
              <h3 className="font-editorial text-[25px] text-[#162723] font-normal mb-2 leading-none">
                Self-Understanding
              </h3>
              <p className="font-zen text-[12.5px] text-[#4F635E] leading-[1.6]">
                Bring these observations together over time into a calm, coherent sense of identity that withstands daily volatility.
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* MOBILE / TABLET RESPONSIVE VIEW (< 1024px)              */}
        {/* ======================================================= */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-7 sm:gap-8 pt-10 text-left">
          {/* Card 01 */}
          <div className="relative p-6 bg-[#F9F6F0] rounded-sm border border-[#E8E0D2] shadow-sm -rotate-1">
            <div className="absolute -top-2 left-6"><div className="brass-pin-realistic" /></div>
            <div className="flex items-center justify-between border-b border-[#1E2A2E]/10 pb-2.5 mb-3">
              <span className="font-mono-code text-[11px] font-bold text-[#1E2A2E]/70">01</span>
              <span className="font-mono-code text-[9px] tracking-[0.16em] uppercase font-semibold text-[#6C7872]">COGNITIVE OBSERVATION</span>
            </div>
            <h3 className="font-editorial text-2xl text-[#162723] font-normal mb-2">Thoughts</h3>
            <p className="font-zen text-xs text-[#4F635E] leading-relaxed">
              Notice what repeatedly occupies your mind, the assumptions you make under uncertainty, and the narratives you tell yourself.
            </p>
            <div className="mt-3 pt-2 border-t border-[#1E2A2E]/5 font-handwriting text-xs text-[#5A635E]">
              What am I telling myself? ↳
            </div>
          </div>

          {/* Card 02 */}
          <div className="relative p-6 bg-[#F5EBE6] rounded-sm border border-[#E8D6CE] shadow-sm rotate-1 sm:translate-y-4">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2"><div className="brass-pin-realistic" /></div>
            <div className="flex items-center justify-between border-b border-[#795663]/15 pb-2.5 mb-3">
              <span className="font-mono-code text-[11px] font-bold text-[#1E2A2E]/70">02</span>
              <span className="font-mono-code text-[9px] tracking-[0.16em] uppercase font-semibold text-[#8C6270]">GRANULAR REGISTRATION</span>
            </div>
            <h3 className="font-editorial text-2xl text-[#162723] font-normal mb-2">Emotions</h3>
            <p className="font-zen text-xs text-[#4F635E] leading-relaxed">
              Explore the nuance behind how experiences affect you. Move beyond simple labels toward exact emotional vocabulary.
            </p>
            <div className="mt-3 pt-2 border-t border-[#1E2A2E]/5 font-handwriting text-xs text-[#5A635E]">
              Feel it to understand it.
            </div>
          </div>

          {/* Card 03 */}
          <div className="relative p-6 bg-[#E3ECF1] rounded-sm border border-[#CDDCE4] shadow-sm -rotate-1">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2"><div className="brass-pin-realistic" /></div>
            <div className="flex items-center justify-between border-b border-[#4A6478]/15 pb-2.5 mb-3">
              <span className="font-mono-code text-[11px] font-bold text-[#1E2A2E]/70">03</span>
              <span className="font-mono-code text-[9px] tracking-[0.16em] uppercase font-semibold text-[#537085]">BEHAVIORAL TRIGGERS</span>
            </div>
            <h3 className="font-editorial text-2xl text-[#162723] font-normal mb-2">Reactions</h3>
            <p className="font-zen text-xs text-[#4F635E] leading-relaxed">
              Understand how you instinctively respond in high-friction, conflict, or vulnerable moments before automatic habits take over.
            </p>
            <div className="mt-3 pt-2 border-t border-[#1E2A2E]/5 font-handwriting text-xs text-[#5A635E]">
              What sets this off? ↵
            </div>
          </div>

          {/* Card 04 */}
          <div className="relative p-6 bg-[#DFE8DC] rounded-sm border border-[#CCDBC8] shadow-sm rotate-1 sm:translate-y-4">
            <div className="absolute -top-3 -left-3 w-12 h-5 washi-tape-realistic -rotate-12" />
            <div className="absolute -top-2 right-6"><div className="brass-pin-realistic" /></div>
            <div className="flex items-center justify-between border-b border-[#5C7D64]/15 pb-2.5 mb-3">
              <span className="font-mono-code text-[11px] font-bold text-[#1E2A2E]/70">04</span>
              <span className="font-mono-code text-[9px] tracking-[0.16em] uppercase font-semibold text-[#5A7961]">THEMATIC CONNECTIONS</span>
            </div>
            <h3 className="font-editorial text-2xl text-[#162723] font-normal mb-2">Patterns</h3>
            <p className="font-zen text-xs text-[#4F635E] leading-relaxed">
              See the recurring loops that connect disparate events across weeks and months, revealing unseen behavioral costs.
            </p>
            <div className="mt-3 pt-2 border-t border-[#1E2A2E]/5 font-handwriting text-xs text-[#5A635E]">
              A bigger picture emerges. ↳
            </div>
          </div>

          {/* Card 05 */}
          <div className="relative p-6 bg-[#F7F2E4] rounded-sm border border-[#E8DFC9] shadow-sm -rotate-0.5">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2"><div className="brass-pin-realistic" /></div>
            <div className="flex items-center justify-between border-b border-[#8C7A4E]/15 pb-2.5 mb-3">
              <span className="font-mono-code text-[11px] font-bold text-[#1E2A2E]/70">05</span>
              <span className="font-mono-code text-[9px] tracking-[0.16em] uppercase font-semibold text-[#80724C]">INTERNAL COMPASS</span>
            </div>
            <h3 className="font-editorial text-2xl text-[#162723] font-normal mb-2">Values</h3>
            <p className="font-zen text-xs text-[#4F635E] leading-relaxed">
              Clarify what genuinely matters to you and distinguish authentic principles from inherited obligations or social expectations.
            </p>
            <div className="mt-3 pt-2 border-t border-[#1E2A2E]/5 font-handwriting text-xs text-[#5A635E]">
              What do I want this to be about?
            </div>
          </div>

          {/* Card 06 */}
          <div className="relative p-6 bg-[#ECE8F0] rounded-sm border border-[#DDD6E4] shadow-sm rotate-0.5 sm:translate-y-4">
            <div className="absolute -top-3 right-6 w-12 h-5 washi-tape-realistic -rotate-6" />
            <div className="absolute -top-2 left-6"><div className="brass-pin-realistic" /></div>
            <div className="flex items-center justify-between border-b border-[#6E5D7A]/15 pb-2.5 mb-3">
              <span className="font-mono-code text-[11px] font-bold text-[#1E2A2E]/70">06</span>
              <span className="font-mono-code text-[9px] tracking-[0.16em] uppercase font-semibold text-[#73637E]">INTEGRATED WISDOM</span>
            </div>
            <h3 className="font-editorial text-2xl text-[#162723] font-normal mb-2">Self-Understanding</h3>
            <p className="font-zen text-xs text-[#4F635E] leading-relaxed">
              Bring these observations together over time into a calm, coherent sense of identity that withstands daily volatility.
            </p>
            <div className="mt-3 pt-2 border-t border-[#1E2A2E]/5 font-handwriting text-xs text-[#5A635E]">
              A calmer, clearer me. ↵
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
