import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ScrollReveal = React.memo(({ children, delay = 0, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

// Self-contained Hero Typing Mockup Card to prevent re-rendering the full LandingPage every 30ms
const HeroTypingCard = React.memo(() => {
  const [typedText, setTypedText] = useState('');
  const [showReflection, setShowReflection] = useState(false);
  const fullPromptText = "I keep saying everything is fine, but I've been avoiding calling my sister back for three days now. I tell myself I'm just busy, but she said something last week that I haven't let myself fully hear yet...";

  useEffect(() => {
    let isMounted = true;
    let currentTimeout = null;

    const runLoop = () => {
      if (!isMounted) return;

      setTypedText('');
      setShowReflection(false);

      currentTimeout = setTimeout(() => {
        if (!isMounted) return;

        let charIdx = 0;
        const type = () => {
          if (!isMounted) return;
          if (charIdx < fullPromptText.length) {
            setTypedText(fullPromptText.substring(0, charIdx + 1));
            charIdx++;
            currentTimeout = setTimeout(type, 35);
          } else {
            currentTimeout = setTimeout(() => {
              if (!isMounted) return;
              setShowReflection(true);
              currentTimeout = setTimeout(runLoop, 6000);
            }, 800);
          }
        };

        type();
      }, 1000);
    };

    runLoop();

    return () => {
      isMounted = false;
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
    };
  }, []);

  return (
    <div className="bg-white/6 border border-white/12 rounded-card p-6 lg:p-8 w-full max-w-[420px] lg:max-w-[460px] shadow-2xl flex flex-col gap-5 text-left">
      <div className="font-sans text-[10px] lg:text-[11px] font-medium tracking-[0.12em] uppercase text-secondary">
        Today &middot; Day 6
      </div>
      <div className="font-serif text-lg md:text-xl lg:text-2xl font-normal text-mint-grey leading-tight">
        What's on your mind right now?
      </div>
      <div className="bg-white/5 border border-white/15 rounded-md p-4 lg:p-5 min-h-[140px] lg:min-h-[160px] relative font-serif text-sm lg:text-base text-[#D8ECEA] leading-relaxed">
        <span>{typedText}</span>
        <span className="inline-block w-[2px] h-[18px] bg-accent animate-[blink_1.1s_infinite] ml-[2px] align-middle" />
      </div>
      <button className="w-full bg-accent text-white border-none rounded-md py-3 font-sans text-[13px] lg:text-sm font-medium tracking-[0.04em] cursor-default transition-opacity shadow-xs">
        Reflect &rarr;
      </button>

      <AnimatePresence>
        {showReflection && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-secondary/10 border-l-2 border-secondary rounded-r-md p-4"
          >
            <p className="font-serif text-[13.5px] lg:text-[14.5px] font-normal text-[#D8ECEA] leading-relaxed italic">
              You've written about this situation three times now. Each time the ending is the same — but you describe yourself differently in each version.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default function LandingPage({ onOpenPolicy }) {
  return (
    <div className="min-h-screen bg-mint-grey text-primary selection:bg-accent/30 font-sans">

      <Navbar isSubpage={false} />

      {/* HERO */}
      <section className="min-h-screen pt-[68px] grid grid-cols-1 lg:grid-cols-2 items-center relative overflow-hidden px-[5%] lg:px-[8%] py-12 lg:py-0">

        {/* Left column */}
        <div className="space-y-8 lg:pr-[10%] text-center lg:text-left pt-12 lg:pt-0">
          <div className="flex items-center justify-center lg:justify-start gap-2">
            <span className="w-7 h-[1.5px] bg-secondary-dark hidden lg:block" />
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark">
              Guided Journaling for Self-Understanding
            </span>
          </div>

          <h1 className="font-serif text-[42px] sm:text-[54px] lg:text-[72px] leading-[1.12] tracking-tight font-normal text-primary">
            Guided Journaling for Self-Understanding.<br />
            <span className="text-[32px] sm:text-[40px] block font-light text-mid mt-2">The things you avoid naming shape you <em className="italic text-accent font-normal">anyway.</em></span>
          </h1>

          <p className="font-sans text-[16px] lg:text-[17px] font-light text-mid leading-relaxed max-w-[460px] mx-auto lg:mx-0">
            We gave it a framework. You fill it in — one entry at a time. The more clearly you see what you're actually carrying, the more clearly it reflects it back.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5">
            <a
              href="#auth"
              className="bg-accent text-white hover:bg-[#654652] hover:translate-y-[-2px] px-8 py-4 rounded font-sans text-sm font-medium tracking-[0.04em] transition-all duration-200 no-underline shadow-sm"
            >
              Start writing free
            </a>
            <a
              href="/what-it-is"
              className="font-sans text-sm font-normal text-primary hover:gap-3 flex items-center gap-1.5 no-underline transition-all duration-200"
            >
              Read why it exists &rarr;
            </a>
          </div>

          <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-sans text-mid opacity-90 pt-2">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="stroke-mid shrink-0">
              <rect x="1" y="5" width="11" height="8" rx="1.5" strokeWidth="1" />
              <path d="M4 5V3.5a2.5 2.5 0 0 1 5 0V5" strokeWidth="1" />
            </svg>
            <span>Private by design. Your writing stays yours.</span>
          </div>
        </div>

        {/* Right column */}
        <div className="relative w-full flex items-center justify-center py-8 lg:py-16 mt-8 lg:mt-0">
          <div className="w-full max-w-[540px] lg:max-w-[600px] bg-primary rounded-3xl p-8 lg:p-12 shadow-2xl flex items-center justify-center relative">
            <HeroTypingCard />
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="bg-primary text-mint-grey py-[7rem] px-[8%] border-t border-white/5 relative overflow-hidden" id="problem">
        <div className="max-w-[960px] mx-auto space-y-14 text-center relative z-10">
          <ScrollReveal className="space-y-4 max-w-[640px] mx-auto">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              The gap no one is filling
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey leading-snug font-normal">
              Understand the Patterns Behind Your Thoughts and Emotions
            </h2>
            <div className="w-12 h-[1px] bg-accent mx-auto" />
            <p className="font-sans text-[16px] font-light text-light-mid leading-relaxed max-w-[520px] mx-auto">
              The space between "I should probably think about this" and "I need professional help" is enormous and almost entirely unaddressed.
            </p>
          </ScrollReveal>

          {/* Grid stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[900px] mx-auto">
            <ScrollReveal className="h-full flex" delay={0.05}>
              <div className="bg-white/5 border border-white/10 rounded-card p-8 text-left space-y-3 hover:border-white/20 transition-all duration-300 flex flex-col justify-between w-full">
                <span className="font-serif text-5xl md:text-6xl text-accent font-light leading-none block">150M+</span>
                <div>
                  <h4 className="font-sans text-sm font-normal text-mint-grey mb-2 uppercase tracking-wide">Indians living with sub-clinical distress</h4>
                  <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed">
                    Not in crisis. Not broken. Just carrying something that has no good place to go.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal className="h-full flex" delay={0.15}>
              <div className="bg-white/5 border border-white/10 rounded-card p-8 text-left space-y-3 hover:border-white/20 transition-all duration-300 flex flex-col justify-between w-full">
                <span className="font-serif text-5xl md:text-6xl text-accent font-light leading-none block">&lt; 1%</span>
                <div>
                  <h4 className="font-sans text-sm font-normal text-mint-grey mb-2 uppercase tracking-wide">ever access any form of professional support</h4>
                  <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed">
                    Therapy carries weight in India it doesn't carry elsewhere. Most people are not ready to make that admission.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal className="h-full flex" delay={0.25}>
              <div className="bg-white/5 border border-white/10 rounded-card p-8 text-left space-y-3 hover:border-white/20 transition-all duration-300 flex flex-col justify-between w-full">
                <span className="font-serif text-5xl md:text-6xl text-accent font-light leading-none block">167hrs</span>
                <div>
                  <h4 className="font-sans text-sm text-mint-grey mb-2 uppercase tracking-wide font-normal">hours a week where most people have no structured space to process what they're carrying</h4>
                  <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed">
                    A weekly session covers 0.6% of your waking life. Whatever you're carrying sits with you the rest of the time with nothing at all.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal className="h-full flex" delay={0.35}>
              <div className="bg-white/5 border border-white/10 rounded-card p-8 text-left space-y-3 hover:border-white/20 transition-all duration-300 flex flex-col justify-between w-full">
                <span className="font-serif text-3xl md:text-[2.2rem] text-supporting font-light leading-none block py-1.5">No language</span>
                <div>
                  <h4 className="font-sans text-sm font-normal text-mint-grey mb-2 uppercase tracking-wide">for what sits between fine and help</h4>
                  <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed">
                    Most urban Indians grew up in homes where the interior life was not a legitimate subject. There are no words for what you're carrying.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Quote block */}
            <ScrollReveal className="col-span-1 md:col-span-2 border-l-3 border-supporting bg-supporting/8 p-8 rounded-r-card text-left mt-4">
              <p className="font-serif text-xl md:text-2xl font-light italic text-mint-grey leading-relaxed">
                "Most people are not broken. They are stuck inside a story they have been telling themselves for long enough that it feels like the truth."
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* WHAT IS IT */}
      <section className="py-[7rem] px-[8%] bg-mint-grey" id="what">
        <div className="max-w-[960px] mx-auto space-y-12 text-center">
          <ScrollReveal className="space-y-4 max-w-[640px] mx-auto">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              What Ingress Within is and isn't
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
              A More Structured Way to Reflect
            </h2>
            <div className="w-12 h-[1px] bg-accent mx-auto" />
            <p className="font-sans text-[16px] font-light text-mid leading-relaxed max-w-[520px] mx-auto">
              Four things exist in this space. Three of them leave you where you started.
            </p>
          </ScrollReveal>

          {/* What it is grid */}
          <ScrollReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-primary/10 rounded-card overflow-hidden gap-[1px]">
            {/* Card 1 */}
            <div className="bg-mint-grey p-8 flex flex-col gap-4 text-left hover:bg-white transition-all duration-300">
              <svg className="w-9 h-9 opacity-65 text-primary shrink-0" viewBox="0 0 36 36" fill="none">
                <rect x="8" y="6" width="20" height="24" rx="2" stroke="currentColor" strokeWidth="1.2" />
                <line x1="12" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1" />
                <line x1="12" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="1" />
                <line x1="12" y1="20" x2="19" y2="20" stroke="currentColor" strokeWidth="1" />
              </svg>
              <h3 className="font-serif text-lg font-medium text-primary">This is not journaling.</h3>
              <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed">
                A blank page with no one listening. You write into a void. The void writes nothing back.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-mint-grey p-8 flex flex-col gap-4 text-left hover:bg-white transition-all duration-300">
              <svg className="w-9 h-9 opacity-65 text-primary shrink-0" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="14" r="5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M8 28c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <h3 className="font-serif text-lg font-medium text-primary">This is not therapy.</h3>
              <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed">
                It works before therapy, during it, after it, or entirely on its own. What it isn't is a substitute — it is a different thing, useful for a different purpose.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-mint-grey p-8 flex flex-col gap-4 text-left hover:bg-white transition-all duration-300">
              <svg className="w-9 h-9 opacity-65 text-primary shrink-0" viewBox="0 0 36 36" fill="none">
                <path d="M18 8 C12 8 8 13 8 18 C8 24 12 28 18 28 C24 28 28 24 28 18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M22 10 L28 8 L26 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="1" />
              </svg>
              <h3 className="font-serif text-lg font-medium text-primary">This is not wellness.</h3>
              <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed">
                Observe your thoughts without giving you anything honest to do with them. Calm is useful. It is not clarity.
              </p>
            </div>

            {/* Card 4 (Teal) */}
            <div className="bg-primary p-8 flex flex-col gap-4 text-left hover:bg-[#243035] transition-all duration-300 text-mint-grey">
              <svg className="w-9 h-9 text-[#ECEFF0] shrink-0" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="3" fill="currentColor" />
                <circle cx="18" cy="18" r="7" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.8" />
                <circle cx="18" cy="18" r="11" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
                <circle cx="18" cy="18" r="15" stroke="currentColor" strokeWidth="0.7" fill="none" opacity="0.28" />
              </svg>
              <h3 className="font-serif text-lg font-medium text-mint-grey">This is reflection.</h3>
              <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed">
                We built the framework. You fill it in — one entry at a time. Writing without editing yourself first is what gives it something real to work with.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* WHY TRUST IT */}
      <section className="py-[7rem] px-[8%] bg-white" id="trust">
        <div className="max-w-[960px] mx-auto space-y-12 text-center">
          <ScrollReveal className="space-y-4 max-w-[640px] mx-auto">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">Why trust it</span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">Turn Everyday Experiences Into Meaningful Insights</h2>
            <div className="w-12 h-[1px] bg-accent mx-auto" />
            <p className="font-sans text-[16px] font-light text-mid leading-relaxed max-w-[520px] mx-auto">
              We built the framework. The AI knows what patterns look like and how to ask about them. But it only knows your patterns because you showed it — one entry at a time. The more you write without editing yourself first, the sharper the picture becomes.
            </p>
          </ScrollReveal>

          {/* Trust cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[900px] mx-auto text-left">
            <ScrollReveal className="p-8 border-t-2 border-accent space-y-4" delay={0.05}>
              <h3 className="font-serif text-[19px] font-medium text-primary leading-snug">It starts knowing nothing about you.</h3>
              <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed">
                No assumptions, no defaults, no pre-loaded psychology. It reads what you write. That is all it has to work with.
              </p>
            </ScrollReveal>

            <ScrollReveal className="p-8 border-t-2 border-secondary space-y-4" delay={0.15}>
              <h3 className="font-serif text-[19px] font-medium text-primary leading-snug">Writing without editing yourself first makes it sharper.</h3>
              <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed">
                The quality of what you get back is a direct reflection of what you put in. There is no way to cheat this without cheating yourself.
              </p>
            </ScrollReveal>

            <ScrollReveal className="p-8 border-t-2 border-supporting space-y-4" delay={0.25}>
              <h3 className="font-serif text-[19px] font-medium text-primary leading-snug">You can always see everything it has seen.</h3>
              <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed">
                Every pattern it names, every connection it draws — it comes from your own entries. Nothing is inferred from anywhere else. You built what it knows.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* THE PRACTICE */}
      <section className="bg-primary text-mint-grey py-[7rem] px-[8%]" id="how">
        <div className="max-w-[960px] mx-auto space-y-14 text-center">
          <ScrollReveal className="space-y-4 max-w-[640px] mx-auto">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">The practice</span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">Psychology-Informed Exercises for Self-Reflection</h2>
            <div className="w-12 h-[1px] bg-accent mx-auto" />
            <p className="font-sans text-[16px] font-light text-light-mid leading-relaxed max-w-[520px] mx-auto">
              Not a program. Not a checklist. A daily practice that gets less edited the longer you do it. Most people begin seeing real patterns across two cycles.
            </p>
          </ScrollReveal>

          {/* Steps */}
          <div className="how-steps grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 max-w-[960px] mx-auto relative">
            <div className="how-step space-y-4 text-center z-10 px-4">
              <div className="how-num w-14 h-14 rounded-full bg-white/5 border border-secondary/30 flex items-center justify-center font-serif text-xl text-accent mx-auto">01</div>
              <h3 className="font-serif text-xl font-medium text-mint-grey">Write</h3>
              <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed">
                Whatever is actually in your head. Read our <a href="/how-to-start-journaling" className="text-secondary hover:underline">guide on how to start journaling</a> or use <a href="/journaling-prompts-for-self-discovery" className="text-secondary hover:underline">self-discovery prompts</a> to begin.
              </p>
            </div>

            <div className="how-step space-y-4 text-center z-10 px-4">
              <div className="how-num w-14 h-14 rounded-full bg-white/5 border border-secondary/30 flex items-center justify-center font-serif text-xl text-accent mx-auto">02</div>
              <h3 className="font-serif text-xl font-medium text-mint-grey">Reflect</h3>
              <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed">
                The AI names what you were circling around without quite landing on. Discover <a href="/how-to-practice-self-reflection" className="text-secondary hover:underline">how to practice self-reflection</a> with actionable structure.
              </p>
            </div>

            <div className="how-step space-y-4 text-center z-10 px-4">
              <div className="how-num w-14 h-14 rounded-full bg-white/5 border border-secondary/30 flex items-center justify-center font-serif text-xl text-accent mx-auto">03</div>
              <h3 className="font-serif text-xl font-medium text-mint-grey">Question</h3>
              <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed">
                One question. No easy answer. It comes with you through the day, surfacing when you least expect it.
              </p>
            </div>

            <div className="how-step space-y-4 text-center z-10 px-4">
              <div className="how-num w-14 h-14 rounded-full bg-white/5 border border-secondary/30 flex items-center justify-center font-serif text-xl text-accent mx-auto">04</div>
              <h3 className="font-serif text-xl font-medium text-mint-grey">Pattern</h3>
              <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed">
                Over cycles, loops, contradictions, and shapes become visible. You get a choice you didn't have before.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="py-[7rem] px-[8%] bg-mint-grey" id="who">
        <div className="max-w-[960px] mx-auto space-y-12 text-center">
          <ScrollReveal className="space-y-4 max-w-[640px] mx-auto">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">Who it's for</span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">Build a Better Understanding of Yourself</h2>
            <div className="w-12 h-[1px] bg-accent mx-auto" />
            <p className="font-sans text-[16px] font-light text-mid leading-relaxed max-w-[520px] mx-auto">
              Two kinds of people come to this product. Both grew up in environments where the interior life was not a legitimate subject.
            </p>
          </ScrollReveal>

          {/* Who grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[900px] mx-auto text-left">
             <ScrollReveal className="bg-white rounded-card flex flex-col justify-between shadow-sm hover:translate-y-[-2px] transition-transform duration-300 h-full">
              <div className="p-8 space-y-4">
                <span className="font-sans text-[10px] font-semibold text-[#8A4A38] bg-[#E0A898]/15 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                  Self-aware staller
                </span>
                <h3 className="font-serif text-2xl font-medium text-primary leading-snug">
                  Knows something is off.<br />Has nowhere honest to take it.
                </h3>
                <p className="font-sans text-[14px] font-light text-mid leading-relaxed">
                  Self-aware enough to sense the pattern, honest enough to admit something isn't working. Whether they are in therapy or not, journaling feels like shouting into a void. They don't need to be fixed. They need a space that pays attention.
                </p>
              </div>
              <div className="p-6 bg-mint-grey/60 border-t border-primary/5 rounded-b-card">
                <p className="font-serif text-[15px] font-normal italic text-primary">
                  "I know something's wrong. I just don't know what to do with that."
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal className="bg-white rounded-card flex flex-col justify-between shadow-sm hover:translate-y-[-2px] transition-transform duration-300 h-full" delay={0.1}>
              <div className="p-8 space-y-4">
                <span className="font-sans text-[10px] font-semibold text-[#2A6A60] bg-[#8DBFB4]/15 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                  Quietly accumulating
                </span>
                <h3 className="font-serif text-2xl font-medium text-primary leading-snug">
                  Functional by every measure.<br />Something is quietly building.
                </h3>
                <p className="font-sans text-[14px] font-light text-mid leading-relaxed">
                  Shows up. Manages. By every external measure, fine. But a low hum of dissatisfaction, a recurring situation that never resolves, a feeling they keep calling tiredness because they don't have another word for it.
                </p>
              </div>
              <div className="p-6 bg-mint-grey/60 border-t border-primary/5 rounded-b-card">
                <p className="font-serif text-[15px] font-normal italic text-primary">
                  "I'm fine. I'm just tired. I think."
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* OUR APPROACH */}
      <section className="bg-primary text-mint-grey py-[7rem] px-[8%]" id="approach">
        <div className="max-w-[960px] mx-auto space-y-12 text-center">
          <ScrollReveal className="space-y-4 max-w-[640px] mx-auto">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">Our approach</span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">Clarity comes from truth,<br />not comfort.</h2>
            <div className="w-12 h-[1px] bg-accent mx-auto" />
            <p className="font-sans text-[16px] font-light text-light-mid leading-relaxed max-w-[520px] mx-auto">
              Three things we will never do and why.
            </p>
          </ScrollReveal>

          {/* Grid Approach */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 max-w-[900px] mx-auto text-left md:grid-rows-[auto_1fr_auto]">
            <ScrollReveal className="border-t border-secondary/25 pt-6 flex flex-col gap-y-3 md:row-span-3 md:grid md:grid-rows-subgrid" delay={0.05}>
              <h3 className="font-serif text-[21px] font-medium text-mint-grey">We don't validate blindly.</h3>
              <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed">
                There is a version of emotional support that agrees with everything and changes nothing. It is comfortable. It is also useless. If you are writing the same entry for the fifth time with different characters, we will name the loop.
              </p>
              <p className="font-serif text-[13px] italic text-[#C8B8E4] leading-relaxed pt-2 border-t border-white/5">
                "Not harshly. Not with a diagnosis. Just: this pattern has shown up before."
              </p>
            </ScrollReveal>

            <ScrollReveal className="border-t border-secondary/25 pt-6 flex flex-col gap-y-3 md:row-span-3 md:grid md:grid-rows-subgrid" delay={0.15}>
              <h3 className="font-serif text-[21px] font-medium text-mint-grey">We don't give solutions.</h3>
              <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed">
                The moment we start telling you what to do, we've removed you from the equation. People don't build self-awareness by following instructions. They build it by sitting with hard questions long enough to find their own answers.
              </p>
              <p className="font-serif text-[13px] italic text-[#C8B8E4] leading-relaxed pt-2 border-t border-white/5">
                "Our job is the question, not the answer."
              </p>
            </ScrollReveal>

            <ScrollReveal className="border-t border-secondary/25 pt-6 flex flex-col gap-y-3 md:row-span-3 md:grid md:grid-rows-subgrid" delay={0.25}>
              <h3 className="font-serif text-[21px] font-medium text-mint-grey">We don't create dependency.</h3>
              <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed">
                This product should make itself progressively less necessary, not more. A person using it for a year should know themselves well enough that they need it less, not feel like they cannot function without checking in.
              </p>
              <p className="font-serif text-[13px] italic text-[#C8B8E4] leading-relaxed pt-2 border-t border-white/5">
                "The measure of success is how clearly you see yourself without it."
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-[7rem] px-[8%] bg-mint-grey" id="pricing">
        <div className="max-w-[960px] mx-auto space-y-12 text-center">
          <ScrollReveal className="space-y-4 max-w-[640px] mx-auto">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">Simple pricing</span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">Start free. Continue only<br />if it's honest enough to.</h2>
            <div className="w-12 h-[1px] bg-accent mx-auto" />
            <p className="font-sans text-[16px] font-light text-mid leading-relaxed max-w-[520px] mx-auto">
              We don't ask for commitment before we've earned it. The first seven days are free.
            </p>
          </ScrollReveal>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[760px] mx-auto text-left items-stretch">
            {/* Free */}
            <ScrollReveal className="bg-white rounded-card p-8 flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-300 w-full h-full" delay={0.05}>
              <div className="space-y-5">
                <div className="font-sans text-[11px] font-medium tracking-[0.12em] uppercase text-secondary">First 7 days</div>
                <div className="font-serif text-5xl font-light text-primary leading-none">Free</div>
                <div className="font-sans text-xs font-light text-mid">No card required</div>
                <div className="h-[1.5px] bg-mint-grey" />
                <ul className="list-none space-y-2 p-0">
                  <li className="font-sans text-[13.5px] font-light text-mid flex items-start gap-2 leading-relaxed">
                    <span className="text-accent">&rarr;</span> Full access, no restrictions
                  </li>
                  <li className="font-sans text-[13.5px] font-light text-mid flex items-start gap-2 leading-relaxed">
                    <span className="text-accent">&rarr;</span> One entry a day with AI reflection
                  </li>
                  <li className="font-sans text-[13.5px] font-light text-mid flex items-start gap-2 leading-relaxed">
                    <span className="text-accent">&rarr;</span> Pattern tracking begins
                  </li>
                  <li className="font-sans text-[13.5px] font-light text-mid flex items-start gap-2 leading-relaxed">
                    <span className="text-accent">&rarr;</span> If it's not honest enough, stop
                  </li>
                </ul>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); document.getElementById('auth').scrollIntoView({ behavior: 'smooth' }); }}
                className="w-full mt-6 py-3 px-4 rounded border border-primary/20 bg-transparent text-primary hover:border-primary font-sans text-sm font-medium tracking-wide transition-all cursor-pointer text-center"
              >
                Start free &rarr;
              </button>
            </ScrollReveal>

            {/* Ingress Within Self-Work */}
            <ScrollReveal className="bg-primary text-mint-grey rounded-card p-8 flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-300 relative overflow-hidden w-full h-full" delay={0.15}>
              <div className="space-y-5">
                <div className="font-sans text-[11px] font-medium tracking-[0.12em] uppercase text-secondary">Ingress Within Self-Work</div>
                <div className="font-serif text-5xl font-light text-mint-grey leading-none">&#8377;499</div>
                <div className="font-sans text-xs font-light text-light-mid">per month (GST inclusive)</div>
                <div className="font-sans text-xs font-light text-[#A8D4CE]">Unlimited daily entries, pattern reports, and therapeutic exercises</div>
                <div className="h-[1.5px] bg-white/15" />
                <ul className="list-none space-y-2 p-0">
                  <li className="font-sans text-[13.5px] font-light text-light-mid flex items-start gap-2 leading-relaxed">
                    <span className="text-accent">&rarr;</span> One entry a day, every day
                  </li>
                  <li className="font-sans text-[13.5px] font-light text-light-mid flex items-start gap-2 leading-relaxed">
                    <span className="text-accent">&rarr;</span> Longitudinal pattern engine (4-state lifecycle)
                  </li>
                  <li className="font-sans text-[13.5px] font-light text-light-mid flex items-start gap-2 leading-relaxed">
                    <span className="text-accent">&rarr;</span> Weekly summary &amp; monthly cycle reports
                  </li>
                  <li className="font-sans text-[13.5px] font-light text-light-mid flex items-start gap-2 leading-relaxed">
                    <span className="text-accent">&rarr;</span> Cancel anytime with one click
                  </li>
                </ul>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); document.getElementById('auth').scrollIntoView({ behavior: 'smooth' }); }}
                className="w-full mt-6 py-3 px-4 rounded bg-accent text-primary hover:bg-[#D49888] border-none font-sans text-sm font-medium tracking-wide transition-all cursor-pointer text-center"
              >
                Get started &rarr;
              </button>
            </ScrollReveal>
          </div>

          <ScrollReveal className="pricing-addon font-sans text-sm font-light text-mid pt-8">
            <strong>Add-ons coming soon</strong> &mdash; therapy reports, group reflection sessions, and therapist referrals. Early users get first access.
          </ScrollReveal>

          {/* Pricing detail subpage anchor link */}
          <ScrollReveal className="text-center pt-2">
            <a
              href="/pricing"
              className="font-sans text-xs font-bold uppercase tracking-wider text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark hover:border-primary pb-1 no-underline"
            >
              Compare features &amp; view founding members waitlist &rarr;
            </a>
          </ScrollReveal>
        </div>
      </section>

      {/* AUTH SECTION (NOW SIMPLIFIED CTA) */}
      <section className="bg-primary text-mint-grey text-center py-[7rem] px-[8%]" id="auth">
        <div className="max-w-[640px] mx-auto space-y-8">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">Begin</span>
            <h2 className="font-serif text-3xl md:text-5xl text-mint-grey leading-tight font-normal">Start where<br />clarity begins.</h2>
            <div className="w-12 h-[1px] bg-accent mx-auto" />
            <p className="font-sans text-[15.5px] font-light text-light-mid leading-relaxed max-w-[500px] mx-auto">
              Seven days free. No card needed. Write without editing yourself — or don't bother.
            </p>
          </ScrollReveal>

          <ScrollReveal className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4" delay={0.15}>
            <a
              href="/auth"
              className="w-full sm:w-auto bg-accent text-primary hover:bg-[#D49888] hover:translate-y-[-2px] px-8 py-4 rounded font-sans text-sm font-medium tracking-[0.04em] transition-all duration-200 no-underline shadow-md text-center"
            >
              Start writing free &rarr;
            </a>
            <a
              href="/auth/login"
              className="w-full sm:w-auto bg-transparent border border-white/20 hover:border-white hover:bg-white/5 hover:translate-y-[-2px] text-mint-grey px-8 py-4 rounded font-sans text-sm font-medium tracking-[0.04em] transition-all duration-200 no-underline text-center"
            >
              Sign in to your account
            </a>
          </ScrollReveal>
        </div>
      </section>

      {/* INTERNAL CROSS-LINKS SECTION */}
      <section className="bg-mint-grey py-12 px-6 border-t border-primary/5 text-center">
        <div className="max-w-xl mx-auto space-y-4">
          <h3 className="font-serif text-lg font-normal text-primary">Explore Guided Reflection</h3>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider">
            <a href="/guided-journaling" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Guided Journaling Guide &rarr;</a>
            <a href="/self-reflection" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Self-Reflection Guide &rarr;</a>
            <a href="/how-to-practice-self-reflection" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">How to Practice Self-Reflection &rarr;</a>
            <a href="/emotional-patterns" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Emotional Patterns Guide &rarr;</a>
            <a href="/self-awareness" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Self-Awareness Guide &rarr;</a>
            <a href="/journaling-prompts-for-self-discovery" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Self-Discovery Prompts &rarr;</a>
            <a href="/how-to-start-journaling" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">How to Start Journaling &rarr;</a>
            <a href="/what-it-is" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">What It Is &rarr;</a>
            <a href="/how-it-works" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">How It Works &rarr;</a>
          </div>
        </div>
      </section>

      <Footer onOpenPolicy={onOpenPolicy} />

    </div>
  );
}
