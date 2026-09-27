import { motion } from 'framer-motion';
import { getCardEmergence } from '../../utils/cardEmergence';

/**
 * Section 01 · A Continuous Journey
 * Recreates media_1789581839975.jpg:
 * "A continuous path from reflection to clarity"
 * 5 editorial cards representing the five core phases.
 */
export default function ContinuousJourneySection() {
  const steps = [
    {
      number: '01',
      title: 'REFLECT',
      description: 'Notice what is present right now'
    },
    {
      number: '02',
      title: 'UNDERSTAND',
      description: 'Give words to unnamed feelings'
    },
    {
      number: '03',
      title: 'NOTICE',
      description: 'Observe recurring emotional loops'
    },
    {
      number: '04',
      title: 'GROW',
      description: 'Align choices with core values'
    },
    {
      number: '05',
      title: 'CONTINUE',
      description: 'Build sustainable self-clarity'
    }
  ];

  return (
    <section className="relative py-28 md:py-36 px-6 sm:px-8 lg:px-12 overflow-hidden bg-[#FAF7F2]">
      <div className="max-w-6xl mx-auto text-center space-y-4">
        
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 font-mono-code text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold px-4 py-1.5 rounded-full border border-[#162723]/60 text-[#162723] mx-auto">
          01 · A CONTINUOUS JOURNEY
        </div>

        {/* Heading */}
        <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl text-[#162723] font-normal tracking-tight max-w-3xl lg:max-w-4xl mx-auto leading-[1.18]">
          A continuous path from{' '}
          <span className="block sm:inline">reflection to clarity.</span>
        </h2>

        {/* Subtitle */}
        <p className="font-zen text-sm sm:text-base text-[#5C6873] max-w-2xl lg:max-w-3xl mx-auto leading-relaxed pt-1">
          Self-awareness doesn't happen in a single breakthrough. It builds through consistent daily registration, noticing loops, and intentional reframing.
        </p>

        {/* 5 Sequential Paper Cards: Odd total (5) -> Center card (03 NOTICE) anchors, others emerge outward */}
        <div className="pt-10 sm:pt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 text-left">
          {steps.map((step, idx) => (
            <motion.div
              key={step.number}
              {...getCardEmergence(idx, 5)}
              className="group relative rounded-xl p-5 sm:p-6 min-h-[190px] bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#162723]/35 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div>
                {/* Top Bar: Minimal Tag Pill & Number */}
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center font-mono-code text-[9px] tracking-[0.16em] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-[#162723]/25 text-[#162723]/80 group-hover:border-[#162723]/60 group-hover:text-[#162723] transition-colors">
                    PHASE {step.number}
                  </span>
                  <span className="font-mono-code text-[10px] tracking-wider text-[#8D98A3]">
                    {step.number} / 05
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-editorial text-lg sm:text-xl text-[#162723] font-normal tracking-tight mb-2 group-hover:text-[#795663] transition-colors">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="font-zen text-xs sm:text-[12.5px] text-[#5C6873] leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Minimal Footer */}
              <div className="pt-3 mt-4 border-t border-[#E7DECF]/60 flex items-center justify-between font-mono-code text-[11px] text-[#795663] group-hover:text-[#162723] transition-colors">
                <span className="font-medium">Explore phase</span>
                <span className="text-xs transition-transform duration-200 group-hover:translate-x-1">→</span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
