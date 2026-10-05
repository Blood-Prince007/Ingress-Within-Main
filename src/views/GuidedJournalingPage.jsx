import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ScrollReveal = ({ children, delay = 0, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default function GuidedJournalingPage({ onOpenPolicy }) {
  const handleStartWriting = () => {
    if (window.navigateTo) {
      window.navigateTo('/auth');
    } else {
      window.location.pathname = '/auth';
    }
  };

  const faqData = [
    {
      question: "What is guided journaling?",
      answer: "Guided journaling is a structured writing practice that uses prompts, frameworks, and targeted questions to help individuals reflect on their thoughts, emotions, and daily experiences with clarity."
    },
    {
      question: "How is Ingress Within different from a simple notes app?",
      answer: "Unlike a blank note app, Ingress Within organizes your reflection into structured 30-day cycles, provides daily guided prompts, surfaces emotional vocabulary, and identifies recurring pattern threads across your writing."
    },
    {
      question: "Is Ingress Within therapy or a mental health treatment?",
      answer: "No. Ingress Within is designed for guided self-reflection and self-understanding and is not a replacement for professional mental health care. It offers a private space for personal self-awareness."
    },
    {
      question: "How often should I practice guided journaling?",
      answer: "Consistency matters more than length. Taking 5 to 10 minutes each day—or whenever you feel the need to process an experience—helps build strong self-reflection momentum."
    },
    {
      question: "Is my journaling data private and secure?",
      answer: "Yes. Your reflection entries are strictly private. We enforce strict data isolation, encryption, and transparent security controls so your personal thoughts remain entirely yours."
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-mint-grey text-primary selection:bg-accent/30 font-sans">
      {/* FAQPage JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Navbar isSubpage={true} />

      {/* HERO SECTION (Treatment A: Watercolor Paper) */}
      <section className="treatment-watercolor-hero pt-[148px] pb-20 md:pt-[180px] md:pb-28 px-6 md:px-16 text-center border-b border-primary/5">
        <div className="max-w-[820px] mx-auto relative z-10">
          <ScrollReveal className="space-y-5">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              Guided Journaling Guide &amp; Principles
            </span>
            <h1 className="font-serif text-[40px] md:text-[54px] lg:text-[60px] leading-[1.15] font-normal text-primary">
              What Is Guided Journaling?
            </h1>
            <div className="w-10 h-[1px] bg-accent mx-auto my-6" />
            <p className="font-sans text-[17px] font-light text-mid leading-relaxed max-w-[680px] mx-auto">
              A structured, psychology-informed approach to self-reflection that helps you look past daily surface noise, understand your emotions, and discover recurring patterns.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 1: Guided Journaling vs Regular Journaling */}
      <section className="max-w-[1060px] mx-auto px-6 md:px-[8%] py-20 md:py-24">
        <ScrollReveal className="max-w-3xl mx-auto space-y-6 text-center mb-16">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Core Distinction
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            How Is Guided Journaling Different From Regular Journaling?
          </h2>
          <p className="font-sans text-[15px] font-light text-mid leading-relaxed">
            Traditional freeform journaling is like speaking your thoughts aloud into an open room. Guided journaling adds structure, thoughtful prompts, and analytical perspective to help you make sense of what you write.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ScrollReveal className="bg-white border border-primary/8 rounded-premium p-8 space-y-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-secondary/15 flex items-center justify-center text-lg mb-2">
              ✍️
            </div>
            <h3 className="font-serif text-xl text-primary font-medium">Regular Freeform Journaling</h3>
            <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-secondary font-bold">•</span>
                Starts with a blank page without direction or gentle boundaries.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary font-bold">•</span>
                Often turns into vent-writing or listing daily events without deeper processing.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary font-bold">•</span>
                Can feel overwhelming when you do not know where to begin or what to examine.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary font-bold">•</span>
                Patterns across weeks or months often remain hidden in filled notebooks.
              </li>
            </ul>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-accent/20 rounded-premium p-8 space-y-4 shadow-sm" delay={0.1}>
            <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-lg mb-2">
              💡
            </div>
            <h3 className="font-serif text-xl text-primary font-medium">Guided Self-Reflection</h3>
            <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Provides targeted prompts and structured frameworks to focus your attention.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Encourages honest inquiry into emotional triggers, reactions, and unspoken thoughts.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Helps you articulate subtle feeling states using richer emotional vocabulary.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Connects individual daily entries to uncover underlying behavioral patterns over time.
              </li>
            </ul>
          </ScrollReveal>
        </div>

        <ScrollReveal className="text-center pt-6">
          <p className="font-sans text-xs md:text-sm font-light text-mid">
            New to journaling? Learn the essentials in our{' '}
            <a href="/how-to-start-journaling" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">
              beginner's guide on how to start journaling
            </a>, discover{' '}
            <a href="/how-to-practice-self-reflection" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">
              how to practice self-reflection
            </a>, or browse our curated library of{' '}
            <a href="/journaling-prompts-for-self-discovery" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">
              50 journaling prompts for self-discovery
            </a>.
          </p>
        </ScrollReveal>
      </section>

      {/* SECTION 2: A More Structured Way to Reflect */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[1060px] mx-auto px-6 md:px-[8%] space-y-16">
          <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              The 4-Step Framework
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              A More Structured Way to Reflect
            </h2>
            <p className="font-sans text-[15px] font-light text-light-mid leading-relaxed">
              Guided journaling turns raw personal writing into clear, progressive self-awareness through a four-stage process.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-6 space-y-3" delay={0.05}>
              <span className="font-serif text-3xl text-secondary font-light">01</span>
              <h3 className="font-serif text-lg text-mint-grey font-medium">Experience</h3>
              <p className="font-sans text-xs font-light text-light-mid leading-relaxed">
                Record what happened during your day—the events, conversations, and moments that stood out.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-6 space-y-3" delay={0.15}>
              <span className="font-serif text-3xl text-secondary font-light">02</span>
              <h3 className="font-serif text-lg text-mint-grey font-medium">Reflection</h3>
              <p className="font-sans text-xs font-light text-light-mid leading-relaxed">
                Examine your internal reaction: what emotions, physical sensations, or thoughts arose in response.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-6 space-y-3" delay={0.25}>
              <span className="font-serif text-3xl text-secondary font-light">03</span>
              <h3 className="font-serif text-lg text-mint-grey font-medium">Patterns</h3>
              <p className="font-sans text-xs font-light text-light-mid leading-relaxed">
                Observe how similar reactions repeat across different days, situations, or interpersonal dynamics.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-6 space-y-3" delay={0.35}>
              <span className="font-serif text-3xl text-secondary font-light">04</span>
              <h3 className="font-serif text-lg text-mint-grey font-medium">Self-Understanding</h3>
              <p className="font-sans text-xs font-light text-light-mid leading-relaxed">
                Gain grounded clarity on your core motivations, emotional habits, and personal boundaries.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 3: What Can You Explore */}
      <section className="max-w-[1060px] mx-auto px-6 md:px-[8%] py-20 md:py-24">
        <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4 mb-16">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Scope of Reflection
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            What Can You Explore Through Guided Journaling?
          </h2>
          <p className="font-sans text-[15px] font-light text-mid leading-relaxed">
            Guided journaling provides a safe, non-judgmental space to explore five primary dimensions of inner life.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3">
            <h3 className="font-serif text-lg text-primary font-medium">1. Recurring Thoughts</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Catch internal monologues, self-critical narratives, and assumptions before they quietly dictate your choices.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3" delay={0.1}>
            <h3 className="font-serif text-lg text-primary font-medium">2. Emotional Nuance</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Move beyond generic labels like "stressed" or "fine" to identify specific feeling states like anticipatory apprehension or quiet burnout.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3" delay={0.2}>
            <h3 className="font-serif text-lg text-primary font-medium">3. Automatic Reactions</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Understand why certain comments, workplace pressure, or relationship changes trigger defensive or avoidant responses.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3" delay={0.3}>
            <h3 className="font-serif text-lg text-primary font-medium">4. Behavioral Patterns</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Identify habits like people-pleasing, overcommitting, procrastination, or retreating under stress.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3" delay={0.4}>
            <h3 className="font-serif text-lg text-primary font-medium">5. Core Values &amp; Desires</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Clarify what truly matters to you when external expectations and daily demands are set aside.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3" delay={0.5}>
            <h3 className="font-serif text-lg text-primary font-medium">6. Unspoken Conflict</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Give voice to subtle contradictions between what you say in public and what you actually feel in private.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 4: Guided Journaling and Self-Reflection */}
      <section className="bg-mint-grey border-t border-b border-primary/5 py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-8">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              Deep Dive
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
              Guided Journaling and Self-Reflection
            </h2>
          </ScrollReveal>
          <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
            <p>
              Self-reflection is the intentional practice of paying attention to your internal experience. While everyone experiences self-reflection spontaneously—often during late-night thoughts or quiet moments—guided journaling transforms spontaneous reflection into a reliable habit.
            </p>
            <p>
              Without structure, self-reflection can easily deteriorate into rumination: spinning in circles around a problem without reaching insight. Guided reflection breaks this loop by prompting you to separate what happened from how you interpreted it, helping you examine your assumptions with compassionate objectivity.
            </p>
            <div className="border-l-2 border-accent pl-5 my-6">
              <p className="font-serif text-base md:text-lg italic text-primary">
                "Writing down a thought forces it out of the background haze into explicit form. Once it is on the page, you can look at it instead of living inside it."
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 5: How Guided Journaling Can Help You Notice Patterns */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Pattern Recognition
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            How Guided Journaling Can Help You Notice Patterns
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            Most of our emotional reactions are governed by underlying patterns developed over years. Because we experience life day by day, we rarely notice that the anger we felt on Tuesday at work shares the exact same root as the withdrawal we experienced on Sunday with family.
          </p>
          <p>
            When you engage in guided journaling over time, your written records create a reflective mirror. Themes begin to recur:
          </p>
          <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-mid pl-4">
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Temporal Patterns:</strong> Noticing feeling low or anxious on specific days, times, or during transition periods.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Relational Triggers:</strong> Recognizing how specific communication styles from colleagues or loved ones trigger defensiveness.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Cognitive Loops:</strong> Spotting black-and-white thinking or catastrophic expectations before they shape your decisions.</span>
            </li>
          </ul>
          <p>
            Recognizing a pattern is the crucial first step toward changing how you respond to it.
          </p>
        </ScrollReveal>
      </section>

      {/* SECTION 6: How Ingress Within Uses Guided Reflection */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[1060px] mx-auto px-6 md:px-[8%] space-y-12">
          <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              The Platform Experience
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              How Ingress Within Uses Guided Reflection
            </h2>
            <p className="font-sans text-[15px] font-light text-light-mid leading-relaxed">
              Ingress Within translates principles of structured journaling into an intelligent, private experience designed around your personal pace.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ScrollReveal className="bg-white/5 border border-white/12 rounded-premium p-6 space-y-3">
              <h3 className="font-serif text-xl text-mint-grey font-medium">30-Day Guided Reflection Cycles</h3>
              <p className="font-sans text-xs md:text-sm font-light text-light-mid leading-relaxed">
                Rather than infinite unguided logging, Ingress Within operates on structured 30-day reflection cycles that offer progressive clarity, rhythm, and gentle momentum.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-premium p-6 space-y-3" delay={0.1}>
              <h3 className="font-serif text-xl text-mint-grey font-medium">Daily Contextual Prompts</h3>
              <p className="font-sans text-xs md:text-sm font-light text-light-mid leading-relaxed">
                Each day brings dynamic prompts adapted to where you are in your cycle, helping you transition smoothly from observation to deeper pattern analysis.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-premium p-6 space-y-3" delay={0.2}>
              <h3 className="font-serif text-xl text-mint-grey font-medium">Psychology-Informed Exercises</h3>
              <p className="font-sans text-xs md:text-sm font-light text-light-mid leading-relaxed">
                Unlock specialized reflection exercises—such as baseline assessments, word association, inkblot projective reflections, and self-perception evaluations—as your entry milestone grows.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-premium p-6 space-y-3" delay={0.3}>
              <h3 className="font-serif text-xl text-mint-grey font-medium">Emotional Vocabulary &amp; Intelligence</h3>
              <p className="font-sans text-xs md:text-sm font-light text-light-mid leading-relaxed">
                Expand your emotional lexicon with precise vocabulary insights and receive synthesis reports that map recurring themes across your entries.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 7: FAQ Section with Mandatory Non-Clinical Disclaimer */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-12">
        <ScrollReveal className="text-center space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Common Questions
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Frequently Asked Questions About Guided Journaling
          </h2>
        </ScrollReveal>

        <div className="space-y-6">
          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3">
            <h3 className="font-serif text-lg text-primary font-medium">What is guided journaling?</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Guided journaling is a structured writing practice that uses prompts, frameworks, and targeted questions to help individuals reflect on their thoughts, emotions, and daily experiences with clarity.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3">
            <h3 className="font-serif text-lg text-primary font-medium">How is Ingress Within different from a simple notes app?</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Unlike a blank note app, Ingress Within organizes your reflection into structured 30-day cycles, provides daily guided prompts, surfaces emotional vocabulary, and identifies recurring pattern threads across your writing.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3">
            <h3 className="font-serif text-lg text-primary font-medium">Is Ingress Within therapy or a mental health treatment?</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              No. Ingress Within is designed for guided self-reflection and self-understanding and is not a replacement for professional mental health care. It offers a private space for personal self-awareness.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3">
            <h3 className="font-serif text-lg text-primary font-medium">How often should I practice guided journaling?</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Consistency matters more than length. Taking 5 to 10 minutes each day—or whenever you feel the need to process an experience—helps build strong self-reflection momentum.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3">
            <h3 className="font-serif text-lg text-primary font-medium">Is my journaling data private and secure?</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Yes. Your reflection entries are strictly private. We enforce strict data isolation, encryption, and transparent security controls so your personal thoughts remain entirely yours.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-white py-20 px-6 text-center border-t border-primary/5">
        <ScrollReveal className="max-w-xl mx-auto space-y-6">
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Begin Your Guided Journaling Journey
          </h2>
          <p className="font-sans text-sm md:text-base text-mid max-w-md mx-auto leading-relaxed">
            Start reflecting with structured prompts and discover the pattern threads running through your daily life.
          </p>
          <button
            onClick={handleStartWriting}
            className="bg-primary hover:bg-[#2A3A3E] text-[#ECEFF0] px-8 py-3.5 rounded font-sans text-xs font-bold tracking-wider uppercase inline-block shadow-sm transition-all duration-200 cursor-pointer mt-4"
          >
            Start Guided Journaling Free &rarr;
          </button>
        </ScrollReveal>
      </section>

      {/* INTERNAL CROSS-LINKS SECTION */}
      <section className="bg-mint-grey py-12 px-6 border-t border-primary/5 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h3 className="font-serif text-lg font-normal text-primary">Explore Ingress Within</h3>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider">
            <a href="/self-reflection" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Self-Reflection Guide &rarr;</a>
            <a href="/how-to-practice-self-reflection" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">How to Practice Self-Reflection &rarr;</a>
            <a href="/emotional-patterns" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Emotional Patterns Guide &rarr;</a>
            <a href="/self-awareness" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Self-Awareness Guide &rarr;</a>
            <a href="/journaling-prompts-for-self-discovery" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Journaling Prompts &rarr;</a>
            <a href="/how-to-start-journaling" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">How to Start Journaling &rarr;</a>
            <a href="/what-it-is" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">What It Is &rarr;</a>
            <a href="/how-it-works" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">How It Works &rarr;</a>
            <a href="/pricing" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Pricing &amp; Plans &rarr;</a>
            <a href="/faq" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">FAQ &rarr;</a>
            <a href="/about" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">About Us &rarr;</a>
          </div>
        </div>
      </section>

      <Footer onOpenPolicy={onOpenPolicy} />
    </div>
  );
}
