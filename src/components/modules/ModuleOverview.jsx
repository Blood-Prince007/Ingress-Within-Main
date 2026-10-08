import React from 'react';
import { ArrowLeft, BookOpen, Clock, Sparkles } from 'lucide-react';

export default function ModuleOverview({ catalog, content, playerState, onStartIntro, onResume, onReset }) {
  const name = catalog?.name || content?.brief?.moduleName || 'Psychoeducation Module';
  const price = catalog?.price ? `₹${catalog.price} ${catalog.currency || 'INR'}` : 'Core Program';
  const durationWeeks = catalog?.duration_weeks || content?.weeks?.length || 7;
  const mechanisms = content?.brief?.mechanisms || [];
  const completedCount = playerState?.completedTouches?.length || 0;
  const totalTouches = content?.weeks ? content.weeks.reduce((acc, w) => acc + w.touches.length, 0) : 35;
  const isStarted = completedCount > 0 || playerState?.mhpiData?.baseline !== null;

  return (
    <div className="space-y-6">
      {/* Topbar */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.navigateTo ? window.navigateTo('/dashboard') : window.location.href = '/dashboard'}
            className="text-xs font-semibold text-mid hover:text-accent flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Back to Dashboard</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-primary/10">
            <img 
              src="/logo-mark-transparent.png" 
              alt="Ingress Within" 
              className="w-5 h-5 object-contain" 
            />
            <span className="font-serif text-xs text-primary font-medium">
              ingress <em className="text-accent not-italic font-semibold">within</em>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-accent border border-accent/25 px-3 py-1 rounded-full bg-accent/5 font-sans font-semibold">
            {price}
          </span>
          <span className="text-[11px] text-primary border border-secondary/40 px-3 py-1 rounded-full bg-secondary/15 font-sans font-semibold">
            {durationWeeks} Weeks
          </span>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white-paper border border-primary/10 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-accent font-bold">
          <Sparkles size={13} />
          <span>Psychoeducation Program</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-primary leading-tight">
          {name}
        </h1>
        <p className="text-mid leading-relaxed text-sm sm:text-[15px]">
          {catalog?.description || "A structured evidence-based program targeting self-criticism, duty-driven guilt, and self-doubt with structured cognitive, somatic, and behavioural tools."}
        </p>

        {/* Taxonomy Badges */}
        {catalog?.taxonomy_concerns && catalog.taxonomy_concerns.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-primary/5">
            <span className="text-xs text-mid font-medium">Focus Areas:</span>
            {catalog.taxonomy_concerns.map(code => (
              <span key={code} className="text-xs bg-warm-paper border border-primary/15 text-primary px-2.5 py-0.5 rounded-full font-mono">
                {code}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Mechanisms Card */}
      <div className="bg-white-paper border border-primary/10 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-primary">
            Targeted Mechanisms ({mechanisms.length})
          </h2>
          <span className="text-xs text-mid">Clinical Focus</span>
        </div>

        <div className="grid gap-3">
          {mechanisms.map(m => (
            <div key={m.key} className="bg-warm-paper border border-primary/10 rounded-xl p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-serif text-base font-semibold text-primary">
                  Mechanism {m.key}: {m.name}
                </span>
                <span className="text-xs text-mid bg-white-paper border border-primary/15 px-2.5 py-0.5 rounded-full font-sans font-medium">
                  Need: {m.need}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-mid leading-relaxed">{m.def}</p>
              <div className="text-xs text-accent italic pt-1">
                Contrast case: <strong className="text-primary not-italic font-semibold">{m.contrast.who}</strong> — {m.contrast.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action CTA */}
      <div className="space-y-3 pt-2">
        {isStarted ? (
          <div className="space-y-3">
            <button
              onClick={onResume}
              className="w-full py-4 px-5 bg-accent hover:bg-[#654652] active:bg-[#533842] text-white font-semibold rounded-xl text-base transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              Resume Module ({completedCount}/{totalTouches} Touches Complete)
            </button>
            <div className="flex gap-3">
              <button
                onClick={onStartIntro}
                className="flex-1 py-3 px-4 bg-white-paper border border-primary/15 hover:border-accent hover:bg-accent/5 text-primary text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Review Intro Sequence
              </button>
              <button
                onClick={onReset}
                className="py-3 px-4 bg-transparent border border-error/30 hover:bg-error-subtle text-error text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Reset Progress
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onStartIntro}
            className="w-full py-4 px-5 bg-accent hover:bg-[#654652] active:bg-[#533842] text-white font-semibold rounded-xl text-base transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            Start Module — Step 1: Overview & Intro
          </button>
        )}
      </div>
    </div>
  );
}
