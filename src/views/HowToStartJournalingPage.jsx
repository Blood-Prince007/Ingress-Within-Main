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

export default function HowToStartJournalingPage({ onOpenPolicy }) {
  const handleStartWriting = () => {
    if (window.navigateTo) {
      window.navigateTo('/auth');
    } else {
      window.location.pathname = '/auth';
    }
  };

  const faqData = [
    {
      question: "How do I start journaling for the first time?",
      answer: "Start simply by setting aside 5 minutes, choosing one recent event or feeling, and writing down what happened without editing yourself. You do not need special stationery or elaborate routines to begin."
    },
    {
      question: "What should beginners write in a journal?",
      answer: "Beginners can write about something that happened during the day, an interaction that lingered in their mind, a decision they are weighing, or an emotion they felt. If you feel stuck, focused prompts can provide an immediate starting point."
    },
    {
      question: "How long should a journal entry be?",
      answer: "A journal entry can be as short as two or three sentences or several paragraphs long. Consistency and honest expression matter far more than word count."
    },
    {
      question: "Do I need to journal every day?",
      answer: "No. While daily journaling creates steady momentum, writing a few times a week or whenever a meaningful situation occurs is equally valuable. Choose a rhythm that fits your lifestyle."
    },
    {
      question: "What if I do not know what to write?",
      answer: "If you feel stuck, describe your current hesitation, write down the factual details of your morning, or use structured prompts to focus your attention on a specific question."
    },
    {
      question: "Is journaling the same as therapy?",
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
        <div className="max-w-[840px] mx-auto relative z-10">
          <ScrollReveal className="space-y-5">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              Beginner's Guide to Journaling
            </span>
            <h1 className="font-serif text-[40px] md:text-[54px] lg:text-[60px] leading-[1.15] font-normal text-primary">
              How to Start Journaling: A Simple Guide for Beginners
            </h1>
            <div className="w-10 h-[1px] bg-accent mx-auto my-6" />
            <p className="font-sans text-[17px] font-light text-mid leading-relaxed max-w-[700px] mx-auto">
              Starting a journal does not require perfect prose, lengthy entries, or complex rituals. Learn a simple, practical approach to begin noticing your experiences and building personal clarity.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 1: What Is Journaling? */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Foundations
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            What Is Journaling?
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            At its core, journaling is the practice of capturing your personal experiences, thoughts, and feelings in written form. It serves as an external space where you can slow down, observe what is happening in your life, and examine your reactions without judgment.
          </p>
          <p>
            When you write things down, you give structure to thoughts that otherwise remain vague or noisy in your head. Whether you record daily events, explore recurring emotions, or experiment with <a href="/guided-journaling" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">guided journaling methods</a>, journaling creates a clear, personal record that helps you understand yourself better over time.
          </p>
        </ScrollReveal>
      </section>

      {/* SECTION 2: Why Is It Sometimes Difficult to Start Journaling? */}
      <section className="bg-white border-t border-b border-primary/5 py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-8">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              Common Hurdles
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
              Why Is It Sometimes Difficult to Start Journaling?
            </h2>
          </ScrollReveal>
          <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
            <p>
              Many people want to journal but find themselves staring at a blank page feeling hesitant. This resistance is entirely normal and usually stems from a few understandable expectations:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              <div className="bg-mint-grey/50 border border-primary/8 rounded-lg p-5 space-y-1.5">
                <h3 className="font-serif text-base text-primary font-medium">Not Knowing What to Write</h3>
                <p className="font-sans text-xs font-light text-mid leading-relaxed">
                  Feeling overwhelmed by the vast openness of a blank page without a starting cue.
                </p>
              </div>
              <div className="bg-mint-grey/50 border border-primary/8 rounded-lg p-5 space-y-1.5">
                <h3 className="font-serif text-base text-primary font-medium">Perfectionism &amp; Self-Editing</h3>
                <p className="font-sans text-xs font-light text-mid leading-relaxed">
                  Worrying that your writing needs to sound profound, eloquent, or well-structured.
                </p>
              </div>
              <div className="bg-mint-grey/50 border border-primary/8 rounded-lg p-5 space-y-1.5">
                <h3 className="font-serif text-base text-primary font-medium">Feeling Nothing Important Happened</h3>
                <p className="font-sans text-xs font-light text-mid leading-relaxed">
                  Believing that ordinary daily routines are not worth recording or reflecting upon.
                </p>
              </div>
              <div className="bg-mint-grey/50 border border-primary/8 rounded-lg p-5 space-y-1.5">
                <h3 className="font-serif text-base text-primary font-medium">Expecting Immediate Breakthroughs</h3>
                <p className="font-sans text-xs font-light text-mid leading-relaxed">
                  Anticipating life-changing insights from every single sentence instead of trusting gradual observation.
                </p>
              </div>
            </div>
            <p>
              Recognizing these hurdles makes it easier to let go of unrealistic standards and approach journaling with ease.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 3: How to Start Journaling in 5 Simple Steps */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[1060px] mx-auto px-6 md:px-[8%] space-y-16">
          <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Core Framework
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              How to Start Journaling in 5 Simple Steps
            </h2>
            <p className="font-sans text-[15px] font-light text-light-mid leading-relaxed">
              Follow this straightforward five-step routine to build a steady, unforced journaling habit:
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.05}>
              <span className="font-serif text-2xl text-secondary font-light">01</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Choose a Simple Time</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Pick a quiet, consistent moment in your day—like morning tea or before bed.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.12}>
              <span className="font-serif text-2xl text-secondary font-light">02</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Start With What Happened</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Describe one concrete event, conversation, or moment from your day in plain facts.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.19}>
              <span className="font-serif text-2xl text-secondary font-light">03</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Notice Thoughts &amp; Reactions</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Write down what you felt or thought during that event without judging your feelings.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.26}>
              <span className="font-serif text-2xl text-secondary font-light">04</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Ask One Question</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Prompt yourself with a simple question: "What was I expecting?" or "Why did that linger?"
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.33}>
              <span className="font-serif text-2xl text-secondary font-light">05</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Stop When You Have Said Enough</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Close your journal once your thought feels complete. There is no quota to meet.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 4: What Should You Write in a Journal? */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Writing Topics
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            What Should You Write in a Journal?
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            You do not need dramatic milestones to write meaningful entries. Everyday situations offer the richest material for reflection:
          </p>
          <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-mid pl-4">
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Something that happened today:</strong> A brief recount of a meeting, task, or encounter that felt memorable.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Something you keep thinking about:</strong> A thought or concern that continues to loop in your mind.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>An interaction with another person:</strong> A conversation where something was left unsaid or felt slightly tense.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>A difficult decision:</strong> Weighing priorities and uncertainties around a choice you are preparing to make.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>An unexpected reaction:</strong> A moment where your emotional response surprised or puzzled you.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Something you enjoyed:</strong> A quiet moment of satisfaction, relief, or gratitude.</span>
            </li>
          </ul>
          <div className="pt-4 text-center">
            <p className="font-sans text-xs md:text-sm font-light text-mid">
              If you prefer structured writing questions, explore our collection of{' '}
              <a href="/journaling-prompts-for-self-discovery" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">
                50 journaling prompts for self-discovery
              </a>.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* SECTION 5: A Simple Journaling Template for Beginners */}
      <section className="bg-white border-t border-b border-primary/5 py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-12">
          <ScrollReveal className="space-y-4 text-center max-w-2xl mx-auto">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              Reusable Structure
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
              A Simple Journaling Template for Beginners
            </h2>
            <p className="font-sans text-[15px] font-light text-mid leading-relaxed">
              When starting out, this five-stage sequence provides a natural flow from raw experience to clear reflection:
            </p>
          </ScrollReveal>

          <div className="space-y-4 max-w-xl mx-auto">
            <ScrollReveal className="bg-mint-grey/50 border border-primary/8 rounded-lg p-5 space-y-1">
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-secondary-dark">Stage 1</span>
              <h3 className="font-serif text-lg text-primary font-medium">Experience</h3>
              <p className="font-sans text-xs md:text-sm font-light text-mid">
                <em>What happened?</em> State the situation, context, or event in clear, objective facts.
              </p>
            </ScrollReveal>

            <div className="text-center text-secondary text-sm">↓</div>

            <ScrollReveal className="bg-mint-grey/50 border border-primary/8 rounded-lg p-5 space-y-1">
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-secondary-dark">Stage 2</span>
              <h3 className="font-serif text-lg text-primary font-medium">Thoughts</h3>
              <p className="font-sans text-xs md:text-sm font-light text-mid">
                <em>What was going through your mind?</em> Note the assumptions and internal dialogue you experienced.
              </p>
            </ScrollReveal>

            <div className="text-center text-secondary text-sm">↓</div>

            <ScrollReveal className="bg-mint-grey/50 border border-primary/8 rounded-lg p-5 space-y-1">
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-secondary-dark">Stage 3</span>
              <h3 className="font-serif text-lg text-primary font-medium">Emotions</h3>
              <p className="font-sans text-xs md:text-sm font-light text-mid">
                <em>What did you feel?</em> Name the feeling states (hesitation, relief, frustration) present in the moment.
              </p>
            </ScrollReveal>

            <div className="text-center text-secondary text-sm">↓</div>

            <ScrollReveal className="bg-mint-grey/50 border border-primary/8 rounded-lg p-5 space-y-1">
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-secondary-dark">Stage 4</span>
              <h3 className="font-serif text-lg text-primary font-medium">Reaction</h3>
              <p className="font-sans text-xs md:text-sm font-light text-mid">
                <em>How did you respond?</em> Describe what you said, did, or chose to avoid doing.
              </p>
            </ScrollReveal>

            <div className="text-center text-secondary text-sm">↓</div>

            <ScrollReveal className="bg-mint-grey/50 border border-primary/8 rounded-lg p-5 space-y-1">
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-secondary-dark">Stage 5</span>
              <h3 className="font-serif text-lg text-primary font-medium">Reflection</h3>
              <p className="font-sans text-xs md:text-sm font-light text-mid">
                <em>What does this reveal?</em> Ask what this experience indicates about your priorities, boundaries, or expectations.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 6: How Long Should You Journal? */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Time &amp; Pacing
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            How Long Should You Journal?
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            There is no mandatory time requirement for journaling. Some days a quick two-minute note is sufficient to capture a key thought. On other days, spending ten to fifteen minutes untangling a complex situation feels natural and helpful.
          </p>
          <p>
            The value of journaling comes from honest expression rather than the number of minutes spent writing. Allow your sessions to vary according to what feels genuinely useful that day.
          </p>
        </ScrollReveal>
      </section>

      {/* SECTION 7: How Often Should You Journal? */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-8">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Frequency &amp; Routine
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              How Often Should You Journal?
            </h2>
          </ScrollReveal>
          <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-light-mid leading-relaxed">
            <p>
              Different journaling frequencies serve different personal needs:
            </p>
            <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-light-mid pl-4">
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Daily entries:</strong> Build steady rhythm and make subtle daily patterns easier to spot over time.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>A few times per week:</strong> Allow you to reflect on key highlights without feeling pressured by daily commitments.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Situational reflection:</strong> Writing specifically after meaningful conversations, stressful moments, or major decisions.</span>
              </li>
            </ul>
            <p>
              There is no single correct cadence. Choose a frequency that feels sustainable rather than burdensome.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 8: What If You Do Not Know What to Write? */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Overcoming Hesitation
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            What If You Do Not Know What to Write?
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            If you open your journal and draw a blank, try one of these simple entry points:
          </p>
          <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-mid pl-4">
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Describe what happened:</strong> Write a factual summary of what you did in the last few hours.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Write your first thought:</strong> Put down whatever sentence is currently at the top of your mind, even if it feels mundane.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Describe what feels unresolved:</strong> Note any topic or conversation that feels incomplete.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Ask one question:</strong> Write down a question you do not currently have the answer to.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Use a structured prompt:</strong> Pick a question from our <a href="/journaling-prompts-for-self-discovery" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">50 self-discovery prompts</a> to jumpstart your writing.</span>
            </li>
          </ul>
        </ScrollReveal>
      </section>

      {/* SECTION 9: How Journaling Can Become More Reflective Over Time */}
      <section className="bg-white border-t border-b border-primary/5 py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-8">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              Skill Progression
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
              How Journaling Can Become More Reflective Over Time
            </h2>
          </ScrollReveal>
          <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
            <p>
              As you continue writing, your practice naturally matures from simple daily logging into deeper <a href="/self-reflection" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">structured self-reflection</a> and intentional exercises—learn <a href="/how-to-practice-self-reflection" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">how to practice self-reflection</a> step-by-step:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs text-secondary-dark bg-mint-grey/60 p-4 rounded-lg my-4">
              <span>Event</span>
              <span>&rarr;</span>
              <span>Reaction</span>
              <span>&rarr;</span>
              <span>Reflection</span>
              <span>&rarr;</span>
              <span>Recurring Themes</span>
            </div>
            <p>
              With regular entries, you begin to observe overarching patterns across weeks and months:
            </p>
            <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-mid pl-4">
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Repeated Situations:</strong> Recognizing which environments or interactions consistently challenge your boundaries.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Recurring Thoughts:</strong> Identifying automatic interpretations you apply to everyday circumstances.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Emotional Patterns:</strong> Learning how specific triggers precede familiar emotional reactions—explore our guide on <a href="/emotional-patterns" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">identifying emotional patterns</a>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Changing Priorities:</strong> Noticing how your core values evolve over time.</span>
              </li>
            </ul>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 10: Common Mistakes Beginners Make When Journaling */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Helpful Reminders
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Common Mistakes Beginners Make When Journaling
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            Avoid these common traps to keep your journaling experience rewarding and sustainable:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">Trying to Write Perfectly</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Journaling is for your own clarity, not an audience. Spelling, grammar, and style do not matter.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">Forcing Deep Insights</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Not every entry needs to produce a profound epiphany. Simple, honest recording is just as valuable.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">Quitting After Missed Days</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Missing a few days does not ruin your practice. Simply pick up where you left off when you return.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">Thinking Short Entries Don't Count</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                A brief three-line observation maintains connection to your inner life just as effectively as a long essay.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* SECTION 11: How Ingress Within Supports Structured Journaling */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-8">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Platform Features
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              How Ingress Within Supports Structured Journaling
            </h2>
          </ScrollReveal>
          <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-light-mid leading-relaxed">
            <p>
              Ingress Within offers a dedicated digital environment designed to make structured reflection effortless:
            </p>
            <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-light-mid pl-4">
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>30-Day Guided Reflection Cycles:</strong> Structured progression that removes the pressure of endless unguided writing.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Daily Contextual Prompts:</strong> Dynamic questions adapted to where you are in your cycle to keep your practice fresh.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Psychology-Informed Exercises:</strong> Specialized reflection tools—including word association and perception checks—to explore your thoughts.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Pattern Threads:</strong> Intelligent synthesis that surfaces recurring themes across your entries over time.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Emotional Vocabulary Tools:</strong> Precise language aids that help you articulate nuanced feeling states.</span>
              </li>
            </ul>
            <div className="pt-4">
              <button
                onClick={handleStartWriting}
                className="bg-accent hover:opacity-95 text-primary px-8 py-3.5 rounded font-sans text-xs font-bold tracking-wider uppercase inline-block shadow-sm transition-all duration-200 cursor-pointer"
              >
                Start Journaling Free &rarr;
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 12: Frequently Asked Questions */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-12 border-t border-primary/5">
        <ScrollReveal className="text-center space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Common Inquiries
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Frequently Asked Questions About Starting a Journal
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

      {/* EXPLORE / INTERNAL LINKS SECTION */}
      <section className="bg-mint-grey py-12 px-6 border-t border-primary/5 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h3 className="font-serif text-lg font-normal text-primary">Explore Ingress Within</h3>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider">
            <a href="/guided-journaling" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Guided Journaling Guide &rarr;</a>
            <a href="/journaling-prompts-for-self-discovery" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Journaling Prompts &rarr;</a>
            <a href="/self-reflection" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Self-Reflection Guide &rarr;</a>
            <a href="/how-to-practice-self-reflection" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">How to Practice Self-Reflection &rarr;</a>
            <a href="/emotional-patterns" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Emotional Patterns Guide &rarr;</a>
            <a href="/self-awareness" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Self-Awareness Guide &rarr;</a>
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
