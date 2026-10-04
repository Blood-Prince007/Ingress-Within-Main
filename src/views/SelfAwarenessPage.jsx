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

export default function SelfAwarenessPage({ onOpenPolicy }) {
  const handleStartWriting = () => {
    if (window.navigateTo) {
      window.navigateTo('/auth');
    } else {
      window.location.pathname = '/auth';
    }
  };

  const faqData = [
    {
      question: "What is self-awareness?",
      answer: "Self-awareness is the ongoing practice of clearly noticing, understanding, and observing your own thoughts, emotions, automatic reactions, habits, values, and personal preferences."
    },
    {
      question: "How can I become more self-aware?",
      answer: "You can develop self-awareness through intentional daily observation: pausing when reactions occur, asking open-ended reflective questions, and comparing responses across different situations over time."
    },
    {
      question: "What are examples of self-awareness?",
      answer: "Examples include catching yourself becoming impatient in meetings, noticing a tendency to withdraw during difficult conversations, or recognising the core personal values that drive your key decisions."
    },
    {
      question: "Can journaling support self-awareness?",
      answer: "Yes. Structured journaling provides an external reflective space where you can capture thoughts and feelings authentically, making recurring patterns and habits easier to see and understand."
    },
    {
      question: "What is the difference between self-awareness and self-reflection?",
      answer: "Self-awareness is the broader state of understanding who you are and how you operate. Self-reflection is one specific, deliberate practice used to build and deepen that awareness."
    },
    {
      question: "How do emotional patterns relate to self-awareness?",
      answer: "Recognising recurring emotional patterns is a core component of self-awareness. When you understand your repeated emotional reactions, you gain greater clarity on your personal triggers and responses."
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
              Self-Awareness &amp; Personal Insight
            </span>
            <h1 className="font-serif text-[40px] md:text-[54px] lg:text-[60px] leading-[1.15] font-normal text-primary">
              How to Become More Self-Aware
            </h1>
            <div className="w-10 h-[1px] bg-accent mx-auto my-6" />
            <p className="font-sans text-[17px] font-light text-mid leading-relaxed max-w-[680px] mx-auto">
              Learn what self-awareness is, how to develop it, and how noticing your thoughts, emotions, reactions, habits, and values can support self-understanding.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 1: What Is Self-Awareness? */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Foundations
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            What Is Self-Awareness?
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            Self-awareness is the capacity to clearly observe and understand the various elements that shape your daily experience. It is not about constant self-monitoring or harsh self-evaluation, but about developing an objective, curious perspective toward your internal life.
          </p>
          <p>
            True self-awareness encompasses several interconnected areas of personal functioning:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">Thoughts &amp; Internal Stories</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Noticing mental narratives, underlying assumptions, and self-talk as they occur.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">Emotions &amp; Feeling States</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Recognising emotional shifts with precision rather than broad, generalized labels.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">Reactions &amp; Impulses</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Observing automatic instincts to defend, withdraw, overcommit, or explain yourself.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">Habits &amp; Core Values</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Understanding the behavioral routines you default to and the principles that truly matter to you.
              </p>
            </div>
          </div>
          <p>
            Developing self-awareness allows you to step back from being consumed by an experience and instead view it with compassionate understanding.
          </p>
        </ScrollReveal>
      </section>

      {/* SECTION 2: Why Is Self-Awareness Important? */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-8">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Value of Awareness
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              Why Is Self-Awareness Important?
            </h2>
          </ScrollReveal>
          <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-light-mid leading-relaxed">
            <p>
              When we lack self-awareness, we tend to navigate life on autopilot—reacting to events without understanding what prompted our reaction. Cultivating self-awareness can help create a valuable pause between a stimulus and your response.
            </p>
            <p>
              Strengthening self-awareness may make it easier to:
            </p>
            <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-light-mid pl-4">
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Notice Recurring Reactions:</strong> Catch habitual defensive or avoidant reactions before they dictate your behavior.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Clarify Authentic Preferences:</strong> Differentiate between what you genuinely value and what you pursue out of social expectation.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Make Grounded Decisions:</strong> Choose actions aligned with your long-term priorities rather than temporary emotional impulses.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Communicate With Clarity:</strong> Articulate your feelings and boundaries with honesty and composure.</span>
              </li>
            </ul>
            <p>
              Increased awareness can provide a clearer perspective on your life without requiring harsh self-criticism.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 3: Examples of Self-Awareness */}
      <section className="max-w-[1060px] mx-auto px-6 md:px-[8%] py-20 md:py-24">
        <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4 mb-16">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Real-Life Scenarios
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Examples of Self-Awareness
          </h2>
          <p className="font-sans text-[15px] font-light text-mid leading-relaxed">
            Self-awareness is practiced in everyday moments. These examples illustrate how personal insight manifests in routine situations:
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3">
            <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary-dark">Example 1</span>
            <h3 className="font-serif text-lg text-primary font-medium">Noticing Impatience</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Recognising that your frustration in a slow meeting is fueled by your own anxiety about an upcoming deadline rather than others' pace.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3" delay={0.1}>
            <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary-dark">Example 2</span>
            <h3 className="font-serif text-lg text-primary font-medium">Recognising Discomfort</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Noticing physical tension in your shoulders during certain conversations and acknowledging that a boundary is being crossed.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3" delay={0.2}>
            <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary-dark">Example 3</span>
            <h3 className="font-serif text-lg text-primary font-medium">Catching Avoidance</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Observing a tendency to delay responding to a colleague because you feel uncomfortable delivering direct feedback.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3" delay={0.3}>
            <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary-dark">Example 4</span>
            <h3 className="font-serif text-lg text-primary font-medium">Clarifying Core Values</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Recognising that saying no to an extra commitment is necessary to protect quality time with family or personal rest.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3" delay={0.4}>
            <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary-dark">Example 5</span>
            <h3 className="font-serif text-lg text-primary font-medium">Spotting Self-Critical Loops</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Noticing when an internal monologue turns self-punishing after a minor mistake and intentionally choosing to step out of that loop.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3" delay={0.5}>
            <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary-dark">Example 6</span>
            <h3 className="font-serif text-lg text-primary font-medium">Auditing Energy Drains</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Identifying which environments, tasks, or social dynamics leave you energized versus those that consistently deplete your stamina.
            </p>
          </ScrollReveal>
        </div>
        <p className="font-sans text-xs text-mid text-center italic mt-8">
          *These examples are educational illustrations rather than clinical or diagnostic categories.
        </p>
      </section>

      {/* SECTION 4: How to Develop Self-Awareness */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[1060px] mx-auto px-6 md:px-[8%] space-y-16">
          <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Development Framework
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              How to Develop Self-Awareness
            </h2>
            <p className="font-sans text-[15px] font-light text-light-mid leading-relaxed">
              Developing self-awareness is a skill honed through consistent, non-judgmental observation across five natural stages:
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.05}>
              <span className="font-serif text-2xl text-secondary font-light">01</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Notice</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Catch a feeling, physical sensation, or thought as it happens.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.12}>
              <span className="font-serif text-2xl text-secondary font-light">02</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Pause</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Step back for a brief moment before taking immediate action.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.19}>
              <span className="font-serif text-2xl text-secondary font-light">03</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Reflect</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Inquire into the underlying thoughts and expectations present.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.26}>
              <span className="font-serif text-2xl text-secondary font-light">04</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Compare</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Observe how this response compares with similar past events.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.33}>
              <span className="font-serif text-2xl text-secondary font-light">05</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Understand</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Formulate clear insight into your personal tendencies.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 5: Questions That Can Help You Understand Yourself Better */}
      <section className="max-w-[1060px] mx-auto px-6 md:px-[8%] py-20 md:py-24">
        <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4 mb-16">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Reflective Inquiries
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Questions That Can Help You Understand Yourself Better
          </h2>
          <p className="font-sans text-[15px] font-light text-mid leading-relaxed">
            Use these open-ended prompts during your reflection practice to foster deeper personal clarity:
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-2">
            <h3 className="font-serif text-lg text-primary font-medium">"What am I feeling right now?"</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Name the subtle feeling state rather than dismissing it or defaulting to a vague summary.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-2" delay={0.1}>
            <h3 className="font-serif text-lg text-primary font-medium">"What happened before I reacted this way?"</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Trace the event, interaction, or thought that immediately preceded your emotional shift.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-2" delay={0.2}>
            <h3 className="font-serif text-lg text-primary font-medium">"What was I expecting?"</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Examine the implicit assumptions you held about how the situation was supposed to unfold.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-2" delay={0.3}>
            <h3 className="font-serif text-lg text-primary font-medium">"What matters to me in this situation?"</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Identify the underlying priority, boundary, or value that felt threatened or supported.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-2" delay={0.4}>
            <h3 className="font-serif text-lg text-primary font-medium">"Have I experienced something similar before?"</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Notice if this emotional response echoes a familiar pattern across past relationships or tasks.
            </p>
          </ScrollReveal>

          <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-2" delay={0.5}>
            <h3 className="font-serif text-lg text-primary font-medium">"What patterns do I notice?"</h3>
            <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
              Synthesize your observations to recognize broad themes in how you operate under pressure.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 6: Self-Awareness and Emotional Patterns */}
      <section className="bg-mint-grey border-t border-b border-primary/5 py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-8">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              Pattern Recognition
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
              Self-Awareness and Emotional Patterns
            </h2>
          </ScrollReveal>
          <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
            <p>
              A crucial milestone in developing self-awareness is the ability to recognise your <a href="/emotional-patterns" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">emotional patterns</a>. While individual reactions can feel random, repeated observation often reveals consistent sequences across time.
            </p>
            <p>
              When you become aware of how specific triggers spark predictable thoughts and emotional responses, you no longer feel blindsided by your own reactions. Repeated observation can make recurring tendencies easier to notice, giving you the clarity needed to respond deliberately rather than automatically.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 7: Self-Awareness and Self-Reflection */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Practice &amp; State
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Self-Awareness and Self-Reflection
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            While the terms are often used interchangeably, self-awareness and <a href="/self-reflection" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">self-reflection</a> represent different facets of personal growth.
          </p>
          <p>
            Self-awareness is the ongoing state of understanding your internal processes and values. Self-reflection, on the other hand, is the structured practice you use to develop that state. Practicing regular reflection—whether through <a href="/guided-journaling" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">guided journaling</a>, our tutorial on <a href="/how-to-practice-self-reflection" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">how to practice self-reflection</a>, or quiet contemplation—acts as the primary vehicle for expanding your self-awareness over time.
          </p>
        </ScrollReveal>
      </section>

      {/* SECTION 8: Practical Self-Awareness Exercises */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[1060px] mx-auto px-6 md:px-[8%] space-y-12">
          <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Actionable Routines
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              Practical Self-Awareness Exercises
            </h2>
            <p className="font-sans text-[15px] font-light text-light-mid leading-relaxed">
              Incorporate these accessible, structured exercises into your routine to build stronger self-understanding:
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScrollReveal className="bg-white/5 border border-white/12 rounded-premium p-6 space-y-3">
              <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary">Exercise 01</span>
              <h3 className="font-serif text-lg text-mint-grey font-medium">Daily Observation</h3>
              <p className="font-sans text-xs md:text-sm font-light text-light-mid leading-relaxed">
                Take five minutes at the end of each day to record one moment that caused tension and one moment that brought satisfaction.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-premium p-6 space-y-3" delay={0.1}>
              <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary">Exercise 02</span>
              <h3 className="font-serif text-lg text-mint-grey font-medium">Reaction Review</h3>
              <p className="font-sans text-xs md:text-sm font-light text-light-mid leading-relaxed">
                After a stressful interaction, write out the sequence: what was said, what you thought, and what you chose to do next.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-premium p-6 space-y-3" delay={0.2}>
              <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary">Exercise 03</span>
              <h3 className="font-serif text-lg text-mint-grey font-medium">Values Check</h3>
              <p className="font-sans text-xs md:text-sm font-light text-light-mid leading-relaxed">
                List your top personal values and evaluate whether your calendar and commitments over the past week reflected those priorities.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-premium p-6 space-y-3" delay={0.3}>
              <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary">Exercise 04</span>
              <h3 className="font-serif text-lg text-mint-grey font-medium">Pattern Comparison</h3>
              <p className="font-sans text-xs md:text-sm font-light text-light-mid leading-relaxed">
                Review notes from different days to compare how you responded to similar challenges at work or at home.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-premium p-6 space-y-3" delay={0.4}>
              <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary">Exercise 05</span>
              <h3 className="font-serif text-lg text-mint-grey font-medium">Experience Review</h3>
              <p className="font-sans text-xs md:text-sm font-light text-light-mid leading-relaxed">
                Reflect on a recent decision to observe the assumptions and emotional states that guided your eventual choice.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-premium p-6 space-y-3" delay={0.5}>
              <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary">Exercise 06</span>
              <h3 className="font-serif text-lg text-mint-grey font-medium">Emotional Nuance Log</h3>
              <p className="font-sans text-xs md:text-sm font-light text-light-mid leading-relaxed">
                Replace simple labels like "fine" with precise words like "hesitant", "fatigued", or "optimistic" to build emotional vocabulary.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 9: How Ingress Within Supports Self-Understanding */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Platform Capabilities
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            How Ingress Within Supports Self-Understanding
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            Ingress Within provides a quiet, dedicated digital space for structured self-reflection, helping you organize themes and patterns that emerge from your own writing:
          </p>
          <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-mid pl-4">
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Guided Journaling Cycles:</strong> 30-day reflection cycles that establish steady momentum without overwhelming you with blank pages.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Daily Contextual Prompts:</strong> Thoughtful inquiries tailored to where you are in your cycle to encourage authentic self-examination.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Psychology-Informed Exercises:</strong> Exercises such as word association and baseline self-perception assessments to deepen your personal insight.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Pattern Intelligence &amp; Vocabulary:</strong> Private insights that highlight recurring themes and help you articulate subtle feeling states.</span>
            </li>
          </ul>
        </ScrollReveal>
      </section>

      {/* SECTION 10: FAQ Section */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-12 border-t border-primary/5">
        <ScrollReveal className="text-center space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Common Questions
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Frequently Asked Questions About Self-Awareness
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
            Deepen Your Self-Awareness
          </h2>
          <p className="font-sans text-sm md:text-base text-mid max-w-md mx-auto leading-relaxed">
            Begin reflecting with structured prompts and discover the thoughts, values, and patterns that shape who you are.
          </p>
          <button
            onClick={handleStartWriting}
            className="bg-primary hover:bg-[#2A3A3E] text-[#ECEFF0] px-8 py-3.5 rounded font-sans text-xs font-bold tracking-wider uppercase inline-block shadow-sm transition-all duration-200 cursor-pointer mt-4"
          >
            Start Developing Self-Awareness Free &rarr;
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
            <a href="/emotional-patterns" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Emotional Patterns Guide &rarr;</a>
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
