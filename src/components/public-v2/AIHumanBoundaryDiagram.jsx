import { motion } from 'framer-motion';
import { getCardEmergence } from '../../utils/cardEmergence';

/**
 * Editorial System Diagram: Where the line sits (AI Zone vs Human Zone).
 * Clearly communicates that AI organizes and surfaces patterns while clinical
 * and personal interpretation remains strictly with the human.
 */
export default function AIHumanBoundaryDiagram() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      
      {/* Visual Boundary Diagram */}
      <div className="paper-card rounded-2xl py-10 sm:py-12 px-6 sm:px-10 relative overflow-hidden bg-[#FDFBF8]">
        <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-8 items-stretch">
          
          {/* AI ZONE */}
          <div className="p-6 rounded-xl bg-[#EFE3E4]/35 border border-[#E7DECF] flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono-code text-[10px] tracking-[0.16em] uppercase font-bold text-[#B8964A]">
                  AI ZONE
                </span>
                <span className="text-[11px] text-[#7D8E87] font-mono-code">Pattern Recognition</span>
              </div>

              {/* Three Steps: Read -> Tag -> Aggregate */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                <div className="p-3 bg-white rounded-lg border border-[#E7DECF]/80 shadow-2xs">
                  <span className="font-mono-code text-[9px] text-[#9AA59F] block mb-1">01</span>
                  <span className="font-editorial text-sm font-medium text-[#162723]">Read</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E7DECF]/80 shadow-2xs">
                  <span className="font-mono-code text-[9px] text-[#9AA59F] block mb-1">02</span>
                  <span className="font-editorial text-sm font-medium text-[#162723]">Tag</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E7DECF]/80 shadow-2xs">
                  <span className="font-mono-code text-[9px] text-[#9AA59F] block mb-1">03</span>
                  <span className="font-editorial text-sm font-medium text-[#162723]">Aggregate</span>
                </div>
              </div>
            </div>

            {/* Pattern Surfacing Node */}
            <div className="p-4 bg-white rounded-xl border border-[#E7DECF] shadow-xs text-center">
              <span className="font-mono-code text-[10px] tracking-wider uppercase text-[#795663] block font-semibold mb-1">
                Output
              </span>
              <span className="font-editorial text-base text-[#162723]">
                Possible pattern surfaced
              </span>
            </div>
          </div>

          {/* HUMAN ZONE */}
          <div className="p-6 rounded-xl bg-white border-2 border-[#795663]/30 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono-code text-[10px] tracking-[0.16em] uppercase font-bold text-[#795663]">
                  HUMAN ZONE
                </span>
                <span className="text-[11px] text-[#7D8E87] font-mono-code">Agency & Care</span>
              </div>

              {/* Human Decision Box */}
              <div className="p-5 bg-[#FAF7F2] rounded-xl border border-[#E7DECF] text-center space-y-1">
                <div className="font-editorial text-lg text-[#162723]">
                  You interpret it
                </div>
                <div className="font-editorial italic text-sm text-[#795663]">
                  or your therapist
                </div>
              </div>
            </div>

            {/* Core Human Principles */}
            <div className="space-y-2 pt-2 border-t border-[#E7DECF]/60 text-xs font-zen text-[#5C6873]">
              <div className="flex items-center gap-2">
                <span className="text-[#8AA688]">✓</span>
                <span>Therapy relationship is never replaced</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8AA688]">✓</span>
                <span>No automated diagnoses or prescriptions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8AA688]">✓</span>
                <span>Decision stays entirely with a person</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Three Limitation Cards: Odd total (3) -> Center card anchors, left/right emerge outward */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <motion.div
          {...getCardEmergence(0, 3)}
          className="paper-card paper-card-hover rounded-xl p-5 bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#795663]/40 shadow-xs hover:shadow-md transition-shadow cursor-pointer"
        >
          <h4 className="font-editorial text-lg text-[#162723] mb-1">No diagnosis</h4>
          <p className="font-zen text-xs text-[#5C6873]">
            The system identifies repeating vocabulary and themes, never clinical disorders.
          </p>
        </motion.div>
        <motion.div
          {...getCardEmergence(1, 3)}
          className="paper-card paper-card-hover rounded-xl p-5 bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#795663]/40 shadow-xs hover:shadow-md transition-shadow cursor-pointer"
        >
          <h4 className="font-editorial text-lg text-[#162723] mb-1">No autonomous treatment</h4>
          <p className="font-zen text-xs text-[#5C6873]">
            No algorithms prescribing medical action. Growth is self-directed or therapist-led.
          </p>
        </motion.div>
        <motion.div
          {...getCardEmergence(2, 3)}
          className="paper-card paper-card-hover rounded-xl p-5 bg-[#FDFBF8] hover:bg-white border border-[#E7DECF] hover:border-[#795663]/40 shadow-xs hover:shadow-md transition-shadow cursor-pointer"
        >
          <h4 className="font-editorial text-lg text-[#162723] mb-1">No invisible path</h4>
          <p className="font-zen text-xs text-[#5C6873]">
            You see exactly why a pattern or suggestion appeared and what entries sparked it.
          </p>
        </motion.div>
      </div>

    </div>
  );
}
