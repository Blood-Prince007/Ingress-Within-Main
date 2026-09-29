import React from 'react';
import { motion } from 'framer-motion';
import { getCardEmergence } from '../../utils/cardEmergence';

/**
 * Section 05 · The 4-Stage Rhythm
 * Recreates media_1789581839979.jpg:
 * "From a daily reaction to lasting clarity."
 * A horizontal editorial timeline with 4 colored nodes and deckled paper cards.
 */
export default function FourStageRhythmSection() {
  const stages = [
    {
      number: '01',
      dotColor: 'bg-[#7E9E82]',
      category: 'EXPERIENCE',
      title: 'Something happens.',
      description:
        'An unexpected reaction, a difficult conversation, a moment of fatigue, or an unexplained spark of clarity in your daily life.',
      isDeckled: true,
      cardBg: 'bg-[#FDFBF8]'
    },
    {
      number: '02',
      dotColor: 'bg-[#C49A8F]',
      category: 'REFLECT',
      title: 'You write it down.',
      description:
        'Using five gentle prompts, you untangle what took place, why it resonated, and what bodily signals arose without judgment.',
      cardBg: 'bg-[#FDFBF8]'
    },
    {
      number: '03',
      dotColor: 'bg-[#8CA2B5]',
      category: 'NOTICE',
      title: 'Connections emerge.',
      description:
        'Over weeks of practice, subtle themes, recurring triggers, and behavioral costs become unmistakably visible in longitudinal reports.',
      isDeckled: true,
      cardBg: 'bg-[#F1F6F9]'
    },
    {
      number: '04',
      dotColor: 'bg-[#C7A356]',
      category: 'UNDERSTAND',
      title: 'Clarity builds over time.',
      description:
        'Rather than fighting habitual reactions, you gain the quiet composure to choose conscious, values-aligned responses.',
      cardBg: 'bg-[#FDFBF8]'
    }
  ];

  return (
    <section className="relative py-24 md:py-32 px-4 sm:px-8 overflow-hidden bg-[#FAF7F2]">
      <div className="max-w-6xl mx-auto space-y-4 relative">
        
        {/* Editorial Margin Notes on Left & Right */}
        <div className="hidden xl:flex flex-col justify-between absolute -left-16 top-10 bottom-10 font-mono-code text-[8px] tracking-[0.2em] text-[#9AA59F] uppercase select-none pointer-events-none">
          <div>SMALL<br />STEPS<br />DEEPER<br />UNDERSTANDING</div>
          <div>YOUR<br />EXPERIENCES<br />MATTER</div>
        </div>
        <div className="hidden xl:flex flex-col justify-between absolute -right-16 top-10 bottom-10 font-mono-code text-[8px] tracking-[0.2em] text-[#9AA59F] uppercase text-right select-none pointer-events-none">
          <div>A MORE<br />GROUNDED<br />YOU</div>
          <div>INSIGHT<br />INTO<br />ACTION</div>
        </div>

        {/* Eyebrow */}
        <div className="text-center font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase text-[#7D8E87] font-semibold">
          THE 4-STAGE RHYTHM
        </div>

        {/* Heading */}
        <h2 className="text-center font-editorial text-3xl sm:text-4xl md:text-5xl text-[#162723] font-normal tracking-tight max-w-3xl mx-auto leading-[1.18]">
          From a daily reaction to lasting clarity.
        </h2>

        {/* Subtitle */}
        <p className="text-center font-zen text-sm sm:text-base text-[#5C6873] max-w-2xl mx-auto leading-relaxed pt-1">
          A consistent sequence that turns raw daily experiences into integrated wisdom.
        </p>

        {/* Timeline Canvas */}
        <div className="pt-16 sm:pt-20 relative">
          
          {/* Horizontal Timeline Line with Arrow on Desktop */}
          <div className="hidden md:block absolute top-[110px] left-8 right-8 h-[1.5px] bg-[#E7DECF]">
            <div className="absolute right-0 -top-1 border-t-[5px] border-b-[5px] border-l-[8px] border-t-transparent border-b-transparent border-l-[#C4B7A5]" />
          </div>

          {/* 4 Stage Nodes and Cards: Even total (4) -> Inner cards split from center, outer cards emerge outwards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 text-left relative z-10">
            {stages.map((stage, idx) => (
              <motion.div
                key={stage.number}
                {...getCardEmergence(idx, 4)}
                className="flex flex-col items-start md:items-center cursor-pointer"
              >
                {/* Number & Node Dot */}
                <div className="flex flex-col items-center mb-6">
                  <span className="font-mono-code text-xs text-[#7D8E87] font-semibold mb-2">
                    {stage.number}
                  </span>
                  <div className={`w-3.5 h-3.5 rounded-full ${stage.dotColor} ring-4 ring-[#FAF7F2] shadow-xs`} />
                </div>

                {/* Paper Card */}
                <div
                  className={`w-full p-6 sm:p-7 rounded-xl border border-[#E7DECF]/80 shadow-[0_4px_18px_rgba(1,22,39,0.03)] hover:shadow-md transition-all ${
                    stage.cardBg
                  } ${stage.isDeckled ? 'shadow-sm' : ''}`}
                >
                  <div className="font-mono-code text-[9.5px] tracking-[0.14em] uppercase font-semibold text-[#7D8E87] mb-2">
                    {stage.category}
                  </div>
                  <h3 className="font-editorial text-xl text-[#162723] font-normal mb-2.5">
                    {stage.title}
                  </h3>
                  <p className="font-zen text-[13px] text-[#5C6873] leading-relaxed">
                    {stage.description}
                  </p>
                </div>

              </motion.div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
