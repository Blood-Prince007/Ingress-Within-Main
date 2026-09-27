'use client';

import React from 'react';
import { motion } from 'framer-motion';

import { getCardEmergence } from '../../utils/cardEmergence';

/**
 * Section 02 · Choose Your Starting Point
 * Features an editorial 3-card splitting scroll animation where cards
 * emerge purely sideways into their positions as the user scrolls in.
 */
export default function ThreeWaysSection({ onSelectTab }) {
  const cards = [
    {
      number: '01',
      eyebrow: 'INDEPENDENT INQUIRY',
      title: 'Work on yourself',
      description:
        'Understand what is happening within you with structured learning, reflective prompts, and longitudinal pattern recognition.',
      badgeBg: 'bg-[#E7EFE5]',
      badgeColor: 'text-[#5C7D64]',
      eyebrowColor: 'text-[#5C7D64]',
      targetTab: 'solution',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
        </svg>
      )
    },
    {
      number: '02',
      eyebrow: 'CLINICAL GUIDANCE',
      title: 'Work with a therapist',
      description:
        'Experienced, verified therapists who understand modern stress, trauma, and identity. Regular 50-minute video sessions.',
      badgeBg: 'bg-[#F5ECE8]',
      badgeColor: 'text-[#795663]',
      eyebrowColor: 'text-[#795663]',
      targetTab: 'start',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
          <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    },
    {
      number: '03',
      eyebrow: 'INTEGRATED RHYTHM',
      title: 'Move between the two',
      description:
        "Your journey doesn't have to follow one route. Switch, combine or explore, whatever works for you.",
      badgeBg: 'bg-[#EBEFF2]',
      badgeColor: 'text-[#4A6478]',
      eyebrowColor: 'text-[#4A6478]',
      targetTab: 'how-it-works',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
          <path d="M4 12 A8 8 0 0 1 18.5 7.5" strokeLinecap="round" />
          <polyline points="15 4 19 8 15 12" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 12 A8 8 0 0 1 5.5 16.5" strokeLinecap="round" />
          <polyline points="9 20 5 16 9 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    }
  ];

  return (
    <section className="relative py-16 sm:py-20 lg:py-24 px-6 sm:px-8 lg:px-12 overflow-hidden">
      <div className="max-w-6xl mx-auto text-center space-y-3 sm:space-y-4">
        
        {/* Section Heading with smooth fade-up */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-2.5 sm:space-y-3"
        >
          {/* Section Eyebrow with brand accent */}
          <div className="flex flex-col items-center gap-2">
            <span className="brand-rule-thistle mx-auto" />
            <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723]">
              02 · CHOOSE YOUR STARTING POINT
            </div>
          </div>

          {/* Section Heading */}
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[42px] text-[#162723] font-normal tracking-tight max-w-3xl lg:max-w-4xl mx-auto leading-[1.15]">
            Three ways to work on your <span className="italic accent-thistle">mental health</span>.
          </h2>

          {/* Section Subtext */}
          <p className="font-zen text-xs sm:text-sm md:text-[15px] text-[#5C6873] max-w-2xl lg:max-w-3xl mx-auto leading-relaxed">
            Different needs. A connected journey. Choose what works for you right now, or move between them whenever your life changes.
          </p>
        </motion.div>

        {/* Three Editorial Paper Cards with Splitting Animation */}
        <div className="pt-8 sm:pt-10 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-5 lg:gap-0 text-left">
          {cards.map((card, idx) => (
            <React.Fragment key={card.number}>
              {/* Paper Card with Splitting Motion */}
              <motion.div
                {...getCardEmergence(idx, 3)}
                onClick={() => onSelectTab && onSelectTab(card.targetTab)}
                className="group relative rounded-xl p-6 sm:p-7 min-h-[250px] sm:min-h-[270px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
              >
                <div>
                  {/* Top Bar: Minimal Tag Pill & Number */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <span className="inline-flex items-center font-mono-code text-[9px] sm:text-[9.5px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                      {card.eyebrow}
                    </span>
                    <span className="font-mono-code text-[10px] tracking-wider text-[#8D98A3]">
                      {card.number}
                    </span>
                  </div>

                  {/* Card Title */}
                  <h3 className="font-editorial text-xl sm:text-2xl text-[#162723] font-normal mb-2 leading-snug group-hover:text-[#795663] transition-colors">
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p className="font-zen text-xs sm:text-[13px] text-[#5C6873] leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Minimal Footer */}
                <div className="pt-3 mt-4 border-t border-[#E7DECF]/60 flex items-center justify-between font-mono-code text-[11px] text-[#795663] group-hover:text-[#162723] transition-colors">
                  <span className="font-medium">Learn more</span>
                  <span className="text-xs transition-transform duration-200 group-hover:translate-x-1">→</span>
                </div>
              </motion.div>

              {/* "or" Separator between cards on desktop */}
              {idx < cards.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  className="hidden lg:flex flex-col items-center justify-center px-4 relative"
                >
                  <div className="w-[1px] h-full bg-[#E7DECF]/80 absolute top-0" />
                  <span className="relative z-10 bg-[#FAF7F2] py-2 px-2 text-xs font-editorial italic text-[#8D98A3]">
                    or
                  </span>
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>

      </div>
    </section>
  );
}
