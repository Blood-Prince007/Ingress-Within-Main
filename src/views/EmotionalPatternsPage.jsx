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

export default function EmotionalPatternsPage({ onOpenPolicy }) {
  const handleStartWriting = () => {
    if (window.navigateTo) {
      window.navigateTo('/auth');
    } else {
      window.location.pathname = '/auth';
    }
  };

  const faqData = [
    {
      question: "What are emotional patterns?",
      answer: "Emotional patterns are recurring sequences of emotional, cognitive, and behavioural responses that surface when you encounter familiar situations, interpersonal dynamics, or specific types of pressure."
    },
    {
      question: "How can I identify my emotional patterns?",
      answer: "You can identify emotional patterns by regularly noting your reactions to daily events, examining the thoughts that accompanied those reactions, and comparing multiple experiences across weeks to spot common themes."
    },
    {
      question: "Why do I react the same way in similar situations?",
      answer: "Repeated reactions often develop as habitual cognitive responses shaped by past experiences, learned coping strategies, unspoken expectations, and familiar relational environments."
    },
    {
      question: "How long does it take to notice emotional patterns?",
      answer: "While individual reactions become visible immediately upon reflection, deeper behavioral and emotional pattern threads usually take consistent observation across one or two structured 30-day reflection cycles to clearly surface."
    },
    {
      question: "Can journaling help me notice recurring patterns?",
      answer: "Yes. Structured journaling creates an external written record of your thoughts and feelings, making it easier to step back and observe recurring themes that might otherwise be forgotten in day-to-day life."
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
              Emotional Patterns &amp; Awareness
            </span>
            <h1 className="font-serif text-[40px] md:text-[54px] lg:text-[60px] leading-[1.15] font-normal text-primary">
              How to Identify Emotional Patterns
            </h1>
            <div className="w-10 h-[1px] bg-accent mx-auto my-6" />
            <p className="font-sans text-[17px] font-light text-mid leading-relaxed max-w-[680px] mx-auto">
              Learn how to identify recurring emotional patterns, understand repeated reactions, and notice recurring thoughts and behaviours through structured self-reflection.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 1: What Are Emotional Patterns? */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Core Concepts
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            What Are Emotional Patterns?
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            An emotional pattern is a repeated tendency in how you react, think, feel, and interpret situations when familiar circumstances arise. They are natural cognitive and emotional shortcuts our minds develop over time to process everyday events.
          </p>
          <p>
            Rather than isolated events, emotional patterns are sequences that tend to follow recognizable arcs across five key dimensions:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">1. How You React</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Initial instinctive reactions, such as feeling sudden defensiveness or immediate tension.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">2. How You Think</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Automatic assumptions, mental narratives, and internal explanations you form about an event.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">3. How You Feel</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Specific emotional nuances—such as quiet apprehension, frustration, or withdrawal.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">4. How You Interpret Circumstances</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                The meaning you attach to ambiguous feedback, delayed communication, or unexpected changes.
              </p>
            </div>
          </div>
          <p>
            Noticing a pattern is not about finding fault with yourself. It is simply about bringing unconscious tendencies into clear, non-judgmental awareness.
          </p>
        </ScrollReveal>
      </section>

      {/* SECTION 2: Why Do We Repeat Similar Emotional Reactions? */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-8">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Underlying Drivers
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              Why Do We Repeat Similar Emotional Reactions?
            </h2>
          </ScrollReveal>
          <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-light-mid leading-relaxed">
            <p>
              Human responses are naturally shaped by repetition. When you encounter a situation that feels familiar, your mind rapidly applies existing mental frameworks rather than evaluating the event from scratch.
            </p>
            <p>
              Several everyday factors can reinforce repeated emotional reactions:
            </p>
            <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-light-mid pl-4">
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Familiar Situations &amp; Environments:</strong> High-pressure workplace meetings, family gatherings, or collaborative projects often evoke habitual responses.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Unspoken Expectations:</strong> Implicit beliefs about how conversations should proceed or how others ought to behave.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Cognitive Habits:</strong> Well-worn thinking loops, such as anticipating worst-case scenarios or filtering out positive feedback.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Past Experiences:</strong> Previous encounters that taught you to be cautious, accommodating, or overly self-reliant under specific conditions.</span>
              </li>
            </ul>
            <p>
              Understanding these influences allows you to examine your reactions with empathy and curiosity.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 3: Examples of Emotional Patterns */}
      <section className="max-w-[1060px] mx-auto px-6 md:px-[8%] py-20 md:py-24">
        <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4 mb-16">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Practical Illustrations
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Examples of Emotional Patterns
          </h2>
          <p className="font-sans text-[15px] font-light text-mid leading-relaxed">
            Here are common, everyday emotional patterns people frequently notice during self-reflection. These examples serve as illustrations rather than formal diagnostic categories:
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3">
            <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary-dark">Example 1</span>
            <h3 className="font-serif text-lg text-primary font-medium">Repeated Worry Before Decisions</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Experiencing intense hesitation and second-guessing options before making even minor everyday commitments.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3" delay={0.1}>
            <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary-dark">Example 2</span>
            <h3 className="font-serif text-lg text-primary font-medium">Frustration With Ambiguity</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Feeling acute irritation or urgency when project guidelines, deadlines, or interpersonal expectations are unclear.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3" delay={0.2}>
            <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary-dark">Example 3</span>
            <h3 className="font-serif text-lg text-primary font-medium">Withdrawing After Conflict</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Shutting down or becoming emotionally distant following uncomfortable conversations or disagreements.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3" delay={0.3}>
            <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary-dark">Example 4</span>
            <h3 className="font-serif text-lg text-primary font-medium">Overthinking Delayed Responses</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Assuming someone is upset with you when a message or email is not answered immediately.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3" delay={0.4}>
            <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary-dark">Example 5</span>
            <h3 className="font-serif text-lg text-primary font-medium">Self-Criticism After Mistakes</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Ruminating extensively over small errors, interpreting minor slip-ups as proof of personal incompetence.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3" delay={0.5}>
            <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary-dark">Example 6</span>
            <h3 className="font-serif text-lg text-primary font-medium">Automatic People-Pleasing</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Agreeing to requests instinctively to avoid tension, only to feel resentment or exhaustion later.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 4: How to Notice Your Emotional Patterns */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[1060px] mx-auto px-6 md:px-[8%] space-y-16">
          <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Observational Sequence
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              How to Notice Your Emotional Patterns
            </h2>
            <p className="font-sans text-[15px] font-light text-light-mid leading-relaxed">
              By deconstructing an event into sequential steps, you can observe where automatic reactions turn into recurring loops.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.05}>
              <span className="font-serif text-2xl text-secondary font-light">01</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Situation</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                The objective trigger or event that occurred.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.1}>
              <span className="font-serif text-2xl text-secondary font-light">02</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Reaction</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Your initial physical and instinctive response.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.15}>
              <span className="font-serif text-2xl text-secondary font-light">03</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Thought</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                The internal story or assumption created.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.2}>
              <span className="font-serif text-2xl text-secondary font-light">04</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Emotion</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                The feeling state that deepened from the thought.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.25}>
              <span className="font-serif text-2xl text-secondary font-light">05</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Response</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                The visible action or withdrawal you chose.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.3}>
              <span className="font-serif text-2xl text-secondary font-light">06</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Pattern</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                The repeated sequence seen across multiple days.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 5: Questions That Can Help You Notice Recurring Patterns */}
      <section className="max-w-[1060px] mx-auto px-6 md:px-[8%] py-20 md:py-24">
        <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4 mb-16">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Inquiry Tools
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Questions That Can Help You Notice Recurring Patterns
          </h2>
          <p className="font-sans text-[15px] font-light text-mid leading-relaxed">
            When reviewing an experience, use these reflective questions to uncover underlying pattern threads:
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-2">
            <h3 className="font-serif text-lg text-primary font-medium">"What happened?"</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Record the objective details of what occurred without exaggerating or minimizing.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-2" delay={0.1}>
            <h3 className="font-serif text-lg text-primary font-medium">"How did I react?"</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Identify bodily tension, immediate impulse, or verbal reply that arose instantly.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-2" delay={0.2}>
            <h3 className="font-serif text-lg text-primary font-medium">"What was I thinking?"</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Notice the assumptions you made about what the situation meant for you.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-2" delay={0.3}>
            <h3 className="font-serif text-lg text-primary font-medium">"What emotion stood out?"</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Give a specific name to the primary feeling rather than settling for generic terms.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-2" delay={0.4}>
            <h3 className="font-serif text-lg text-primary font-medium">"What did I do next?"</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Observe how your emotional state translated into subsequent behavior.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-2" delay={0.5}>
            <h3 className="font-serif text-lg text-primary font-medium">"Have I reacted this way before?"</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Connect this event to previous situations where a similar sequence played out.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 6: Emotional Patterns and Self-Understanding */}
      <section className="bg-mint-grey border-t border-b border-primary/5 py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-8">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              Self-Understanding
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
              Emotional Patterns and Self-Understanding
            </h2>
          </ScrollReveal>
          <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
            <p>
              Identifying your emotional patterns can help demystify reactions that previously felt sudden or uncontrollable. When you understand the underlying triggers, recurring tendencies become predictable and easier to navigate.
            </p>
            <p>
              Observing patterns over time may reveal:
            </p>
            <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-mid pl-4">
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Recurring Reactions:</strong> Noticing the specific interpersonal styles or deadlines that consistently evoke defensiveness or anxiety.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Core Preferences &amp; Boundaries:</strong> Recognizing environments that drain your energy versus spaces where you feel composed.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Underlying Assumptions:</strong> Uncovering hidden beliefs about responsibility, perfectionism, or communication.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Habitual Responses:</strong> Gaining the awareness needed to choose thoughtful responses instead of automatic reactions.</span>
              </li>
            </ul>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 7: How to Track Emotional Patterns Over Time */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Long-Term Observation
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            How to Track Emotional Patterns Over Time
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            A single journal entry provides a snapshot of a moment. However, true pattern recognition requires longitudinal comparison across weeks and months.
          </p>
          <p>
            To effectively observe pattern threads over time:
          </p>
          <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-mid pl-4">
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Engage in Regular Reflection:</strong> Short, daily reflections capture authentic reactions before memory edits or rationalizes them. (Learn <a href="/how-to-practice-self-reflection" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">how to practice self-reflection</a> using our 5-step framework.)</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Compare Similar Situations:</strong> Look across multiple workplace interactions or family conversations to find recurring themes.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Notice Vocabulary Trends:</strong> Pay attention to the specific emotion words you repeatedly use across different entries.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Observe Evolutionary Shifts:</strong> Track how your awareness of a pattern gradually alters how you respond in future situations.</span>
            </li>
          </ul>
        </ScrollReveal>
      </section>

      {/* SECTION 8: How Ingress Within Helps You Notice Patterns */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[1060px] mx-auto px-6 md:px-[8%] space-y-12">
          <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Platform Features
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              How Ingress Within Helps You Notice Patterns
            </h2>
            <p className="font-sans text-[15px] font-light text-light-mid leading-relaxed">
              Ingress Within provides intelligent tools to help organize your reflection and surface recurring themes from your own entries.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ScrollReveal className="bg-white/5 border border-white/12 rounded-premium p-6 space-y-3">
              <h3 className="font-serif text-xl text-mint-grey font-medium">30-Day Structured Reflection Cycles</h3>
              <p className="font-sans text-xs md:text-sm font-light text-light-mid leading-relaxed">
                Rather than open-ended logging, our 30-day cycles give your reflection a clear rhythm, allowing patterns to develop and consolidate over time.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-premium p-6 space-y-3" delay={0.1}>
              <h3 className="font-serif text-xl text-mint-grey font-medium">Recurring Pattern Insights</h3>
              <p className="font-sans text-xs md:text-sm font-light text-light-mid leading-relaxed">
                Our pattern intelligence reads across your past entries to highlight recurring themes, behavioral loops, and emotional threads.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-premium p-6 space-y-3" delay={0.2}>
              <h3 className="font-serif text-xl text-mint-grey font-medium">Emotional Vocabulary Expansion</h3>
              <p className="font-sans text-xs md:text-sm font-light text-light-mid leading-relaxed">
                Enhance your self-awareness with nuanced emotional vocabulary suggestions that help you pinpoint exact feelings beyond generic labels.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-premium p-6 space-y-3" delay={0.3}>
              <h3 className="font-serif text-xl text-mint-grey font-medium">Cycle Summary Reports</h3>
              <p className="font-sans text-xs md:text-sm font-light text-light-mid leading-relaxed">
                Receive comprehensive end-of-cycle reports synthesizing the major questions, themes, and patterns observed across your reflection period.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 9: Frequently Asked Questions About Emotional Patterns */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-12 border-t border-primary/5">
        <ScrollReveal className="text-center space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Common Questions
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Frequently Asked Questions About Emotional Patterns
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
            Discover the Patterns Running Through Your Life
          </h2>
          <p className="font-sans text-sm md:text-base text-mid max-w-md mx-auto leading-relaxed">
            Begin reflecting with structured daily entries and unlock insights into your recurring thoughts and emotional reactions.
          </p>
          <button
            onClick={handleStartWriting}
            className="bg-primary hover:bg-[#2A3A3E] text-[#ECEFF0] px-8 py-3.5 rounded font-sans text-xs font-bold tracking-wider uppercase inline-block shadow-sm transition-all duration-200 cursor-pointer mt-4"
          >
            Start Identifying Patterns Free &rarr;
          </button>
        </ScrollReveal>
      </section>

      {/* INTERNAL CROSS-LINKS SECTION */}
      <section className="bg-mint-grey py-12 px-6 border-t border-primary/5 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h3 className="font-serif text-lg font-normal text-primary">Explore Ingress Within</h3>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider">
            <a href="/guided-journaling" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Guided Journaling Guide &rarr;</a>
            <a href="/self-reflection" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Self-Reflection Guide &rarr;</a>
            <a href="/how-to-practice-self-reflection" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">How to Practice Self-Reflection &rarr;</a>
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
