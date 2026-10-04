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

export default function SelfReflectionPage({ onOpenPolicy }) {
  const handleStartWriting = () => {
    if (window.navigateTo) {
      window.navigateTo('/auth');
    } else {
      window.location.pathname = '/auth';
    }
  };

  const faqData = [
    {
      question: "What is self-reflection?",
      answer: "Self-reflection is the intentional practice of stepping back to examine your daily experiences, emotional reactions, thought habits, and personal decisions with curiosity and non-judgmental clarity."
    },
    {
      question: "How do I practice self-reflection?",
      answer: "You can practice self-reflection by pausing regularly to ask yourself open-ended questions about what happened during your day, how you reacted, and what underlying beliefs or patterns influenced your response."
    },
    {
      question: "What are some good self-reflection questions?",
      answer: "Effective self-reflection questions include: What happened today? How did I react? What might have influenced my reaction? Have I experienced something similar before? What do I want to understand better?"
    },
    {
      question: "What is the difference between self-reflection and journaling?",
      answer: "Self-reflection is the internal process of examining your thoughts and emotions. Journaling is a written tool that supports self-reflection by giving form to unspoken thoughts and helping you visualize patterns over time."
    },
    {
      question: "Does Ingress Within provide therapy?",
      answer: "No. Ingress Within is designed for guided self-reflection and self-understanding and is not a replacement for professional mental health care."
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
              Self-Reflection Guide &amp; Practice
            </span>
            <h1 className="font-serif text-[40px] md:text-[54px] lg:text-[60px] leading-[1.15] font-normal text-primary">
              What Is Self-Reflection?
            </h1>
            <div className="w-10 h-[1px] bg-accent mx-auto my-6" />
            <p className="font-sans text-[17px] font-light text-mid leading-relaxed max-w-[680px] mx-auto">
              Learn what self-reflection is, how to practice reflective thinking, and how structured reflection helps you examine your thoughts, reactions, and patterns with quiet clarity.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 1: Why Is Self-Reflection Important? */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Foundational Understanding
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Why Is Self-Reflection Important?
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            In a fast-paced environment, it is easy to react automatically to events without pausing to understand why we responded the way we did. Self-reflection is the intentional practice of pausing to examine your internal experience.
          </p>
          <p>
            Rather than letting daily experiences pass in a blur, reflective thinking allows you to examine five core elements of your inner life:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">1. Experiences</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Looking back at key events, interactions, and moments from your day without immediate judgment.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">2. Thoughts</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Noticing internal monologues, assumptions, and narratives running in the background.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">3. Reactions</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Observing emotional and physiological responses triggered by unexpected pressure or interpersonal dynamics.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">4. Decisions</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Understanding the underlying priorities and trade-offs that guided your choices.
              </p>
            </div>
          </div>
          <p>
            Regular self-reflection helps you transition from reactive living to conscious self-awareness, allowing you to observe your behavior with clarity and grace.
          </p>
        </ScrollReveal>
      </section>

      {/* SECTION 2: How to Practice Self-Reflection */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[1060px] mx-auto px-6 md:px-[8%] space-y-16">
          <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Practical Framework
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              How to Practice Self-Reflection
            </h2>
            <p className="font-sans text-[15px] font-light text-light-mid leading-relaxed">
              Effective self-reflection follows a simple, repeatable process that moves from raw observation to grounded insight.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.05}>
              <span className="font-serif text-2xl text-secondary font-light">01</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Experience</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Identify a specific event or situation to examine.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.12}>
              <span className="font-serif text-2xl text-secondary font-light">02</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Pause</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Step back from immediate reactions to create mental space.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.19}>
              <span className="font-serif text-2xl text-secondary font-light">03</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Questions</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Ask open-ended questions about feelings and motivations.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.26}>
              <span className="font-serif text-2xl text-secondary font-light">04</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Patterns</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Observe similarities across past responses and situations.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.33}>
              <span className="font-serif text-2xl text-secondary font-light">05</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Understanding</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Formulate clear, actionable self-insights.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 3: Questions to Ask Yourself During Self-Reflection */}
      <section className="max-w-[1060px] mx-auto px-6 md:px-[8%] py-20 md:py-24">
        <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4 mb-16">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Reflection Prompts
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Questions to Ask Yourself During Self-Reflection
          </h2>
          <p className="font-sans text-[15px] font-light text-mid leading-relaxed">
            Good reflection starts with powerful, non-judgmental questions. Here are foundational inquiries to guide your personal practice:
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-2">
            <h3 className="font-serif text-lg text-primary font-medium">"What happened?"</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Describe the objective facts of the situation without adding interpretations or blame.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-2" delay={0.1}>
            <h3 className="font-serif text-lg text-primary font-medium">"What stood out to me?"</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Identify specific moments, words, or gestures that triggered a strong internal response.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-2" delay={0.2}>
            <h3 className="font-serif text-lg text-primary font-medium">"How did I react?"</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Notice emotional responses, bodily sensations, and immediate behavioral reactions.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-2" delay={0.3}>
            <h3 className="font-serif text-lg text-primary font-medium">"What might have influenced my reaction?"</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Examine underlying factors such as stress, energy levels, past experiences, or unspoken expectations.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-2" delay={0.4}>
            <h3 className="font-serif text-lg text-primary font-medium">"Have I experienced something similar before?"</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Check if this emotional or behavioral response matches a recurring theme in your life.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-2" delay={0.5}>
            <h3 className="font-serif text-lg text-primary font-medium">"What do I want to understand better?"</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Focus your curiosity on what this experience reveals about your core values or personal needs.
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal className="text-center pt-8">
          <p className="font-sans text-xs md:text-sm font-light text-mid">
            Looking for more structured writing ideas? Explore our full collection of{' '}
            <a href="/journaling-prompts-for-self-discovery" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">
              50 journaling prompts for self-discovery
            </a>.
          </p>
        </ScrollReveal>
      </section>

      {/* SECTION 4: Self-Reflection and Self-Understanding */}
      <section className="bg-mint-grey border-t border-b border-primary/5 py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-8">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              Deep Insight
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
              Self-Reflection and Self-Understanding
            </h2>
          </ScrollReveal>
          <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
            <p>
              Self-reflection is not an end in itself; it is the pathway to self-understanding. When reflection is practiced consistently over time, isolated observations aggregate into meaningful personal self-awareness. For a structured, practical walk-through with daily templates, explore our guide on <a href="/how-to-practice-self-reflection" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">how to practice self-reflection</a>.
            </p>
            <p>
              Through observational self-reflection, you gradually begin to notice:
            </p>
            <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-mid pl-4">
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Recurring Reactions:</strong> Understanding why certain situations consistently trigger defensiveness, avoidance, or excitement.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Personal Preferences:</strong> Identifying environments and boundaries that help you feel grounded.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Core Values:</strong> Clarifying what matters most to you versus what you carry out of habit or external expectation.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Cognitive Habits:</strong> Recognizing automatic thought patterns before they influence your choices.</span>
              </li>
            </ul>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 5: Self-Reflection Exercises */}
      <section className="max-w-[1060px] mx-auto px-6 md:px-[8%] py-20 md:py-24">
        <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4 mb-16">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Structured Practices
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Self-Reflection Exercises
          </h2>
          <p className="font-sans text-[15px] font-light text-mid leading-relaxed">
            Here are four accessible self-reflection exercises you can incorporate into your daily routine:
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ScrollReveal className="bg-white border border-primary/8 rounded-premium p-8 space-y-3 shadow-sm">
            <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary-dark">Exercise 01</span>
            <h3 className="font-serif text-xl text-primary font-medium">Daily Reflection Check-In</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Spend 5 minutes at the end of each day writing down one experience that went well and one situation that felt challenging, noting how you felt during both.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-premium p-8 space-y-3 shadow-sm" delay={0.1}>
            <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary-dark">Exercise 02</span>
            <h3 className="font-serif text-xl text-primary font-medium">Reviewing a Difficult Situation</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              After an uncomfortable conversation or stressful event, write out the timeline neutrally. Separate what was said from what you assumed or felt.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-premium p-8 space-y-3 shadow-sm" delay={0.2}>
            <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary-dark">Exercise 03</span>
            <h3 className="font-serif text-xl text-primary font-medium">Noticing Recurring Reactions</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Track your emotional responses across a week. Look for repeated themes—such as feeling rushed or defensive—and identify common triggers.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-premium p-8 space-y-3 shadow-sm" delay={0.3}>
            <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary-dark">Exercise 04</span>
            <h3 className="font-serif text-xl text-primary font-medium">Values Alignment Audit</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              List your top three personal values. Reflect on your activities over the past week to observe where your time and energy aligned with those values.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 6: How Structured Reflection Can Help You Notice Patterns */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[1060px] mx-auto px-6 md:px-[8%] space-y-12">
          <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Methodology
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              How Structured Reflection Can Help You Notice Patterns
            </h2>
            <p className="font-sans text-[15px] font-light text-light-mid leading-relaxed">
              Unstructured reflection often leads to rumination. Structured reflection creates a clear pathway to pattern identification.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ScrollReveal className="bg-white/5 border border-white/12 rounded-premium p-8 space-y-4">
              <h3 className="font-serif text-xl text-mint-grey font-medium">Random Reflection</h3>
              <p className="font-sans text-xs md:text-sm font-light text-light-mid leading-relaxed">
                Occurs spontaneously during stress. It tends to focus heavily on immediate emotions, spinning in circles without organizing thoughts or tracking progress over time.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-accent/30 rounded-premium p-8 space-y-4" delay={0.1}>
              <h3 className="font-serif text-xl text-mint-grey font-medium">Structured Reflection</h3>
              <p className="font-sans text-xs md:text-sm font-light text-light-mid leading-relaxed">
                Follows a progressive cycle: <strong>Experience → Reflection → Pattern → Understanding</strong>. By using structured prompts and regular rhythms, patterns become visible across entries.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 7: Self-Reflection With Ingress Within */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Platform Capabilities
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Self-Reflection With Ingress Within
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            Ingress Within provides a quiet, dedicated digital environment designed specifically for structured self-reflection:
          </p>
          <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-mid pl-4">
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Guided Journaling:</strong> Structured 30-day reflection cycles that build steady self-reflection momentum.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Daily Contextual Prompts:</strong> Thoughtful, non-intrusive questions that help you move past surface details.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Psychology-Informed Exercises:</strong> Milestone exercises like baseline assessments and word association to deepen reflection.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Pattern Intelligence:</strong> Private insights that connect recurring themes and emotional threads across your entries.</span>
            </li>
          </ul>
        </ScrollReveal>
      </section>

      {/* SECTION 8: FAQ Section */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-12 border-t border-primary/5">
        <ScrollReveal className="text-center space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Common Questions
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Frequently Asked Questions About Self-Reflection
          </h2>
        </ScrollReveal>

        <div className="space-y-6">
          {faqData.map((item, idx) => (
            <ScrollReveal key={idx} className="bg-white border border-primary/8 rounded-lg p-6 space-y-3">
              <h3 className="font-serif text-lg text-primary font-medium">{item.question}</h3>
              <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">{item.answer}</p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-white py-20 px-6 text-center border-t border-primary/5">
        <ScrollReveal className="max-w-xl mx-auto space-y-6">
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Start Your Self-Reflection Practice Today
          </h2>
          <p className="font-sans text-sm md:text-base text-mid max-w-md mx-auto leading-relaxed">
            Begin exploring your experiences with structured prompts and discover the patterns running through your daily life.
          </p>
          <button
            onClick={handleStartWriting}
            className="bg-primary hover:bg-[#2A3A3E] text-[#ECEFF0] px-8 py-3.5 rounded font-sans text-xs font-bold tracking-wider uppercase inline-block shadow-sm transition-all duration-200 cursor-pointer mt-4"
          >
            Start Self-Reflection Free &rarr;
          </button>
        </ScrollReveal>
      </section>

      {/* INTERNAL CROSS-LINKS SECTION */}
      <section className="bg-mint-grey py-12 px-6 border-t border-primary/5 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h3 className="font-serif text-lg font-normal text-primary">Explore Ingress Within</h3>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider">
            <a href="/guided-journaling" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Guided Journaling Guide &rarr;</a>
            <a href="/how-to-practice-self-reflection" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">How to Practice Self-Reflection &rarr;</a>
            <a href="/emotional-patterns" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Emotional Patterns Guide &rarr;</a>
            <a href="/self-awareness" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Self-Awareness Guide &rarr;</a>
            <a href="/journaling-prompts-for-self-discovery" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Journaling Prompts &rarr;</a>
            <a href="/what-it-is" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">What It Is &rarr;</a>
            <a href="/how-it-works" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">How It Works &rarr;</a>
            <a href="/pricing" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Pricing &amp; Plans &rarr;</a>
            <a href="/faq" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">FAQ &rarr;</a>
          </div>
        </div>
      </section>

      <Footer onOpenPolicy={onOpenPolicy} />
    </div>
  );
}
