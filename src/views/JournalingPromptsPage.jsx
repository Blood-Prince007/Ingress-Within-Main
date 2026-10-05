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

export default function JournalingPromptsPage({ onOpenPolicy }) {
  const handleStartWriting = () => {
    if (window.navigateTo) {
      window.navigateTo('/auth');
    } else {
      window.location.pathname = '/auth';
    }
  };

  const faqData = [
    {
      question: "What are journaling prompts?",
      answer: "Journaling prompts are focused questions or reflective cues designed to give you a clear starting point for your writing, helping you move past blank-page hesitation and explore specific thoughts, emotions, or experiences."
    },
    {
      question: "How do journaling prompts help with self-discovery?",
      answer: "Prompts direct your attention toward areas of your life you might otherwise overlook. By answering specific, open-ended questions, you can observe your reactions, clarify your values, and notice recurring themes in your thoughts."
    },
    {
      question: "How often should I use journaling prompts?",
      answer: "There is no rigid rule. Many people find value in using one prompt daily during a regular reflection practice, while others use prompts whenever they feel stuck, encounter a challenging situation, or want to explore a specific theme."
    },
    {
      question: "What should I write if I do not know how to answer a prompt?",
      answer: "You can write honestly about your hesitation itself. Describing why a question feels difficult, vague, or uncomfortable is often just as revealing as having an immediate, polished answer."
    },
    {
      question: "Can I use the same journaling prompt more than once?",
      answer: "Yes. Returning to the same prompt weeks or months later allows you to compare your responses across time, revealing how your perspectives, priorities, and emotional responses evolve."
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
              Self-Discovery &amp; Reflection Questions
            </span>
            <h1 className="font-serif text-[40px] md:text-[54px] lg:text-[60px] leading-[1.15] font-normal text-primary">
              50 Journaling Prompts for Self-Discovery
            </h1>
            <div className="w-10 h-[1px] bg-accent mx-auto my-6" />
            <p className="font-sans text-[17px] font-light text-mid leading-relaxed max-w-[700px] mx-auto">
              Journaling prompts provide a structured starting point when it is difficult to know what to write. Use these 50 reflective questions to explore your thoughts, emotions, reactions, values, and future.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 1: What Are Journaling Prompts for Self-Discovery? */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Core Concepts
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            What Are Journaling Prompts for Self-Discovery?
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            Journaling prompts for self-discovery are focused questions designed to initiate honest self-observation. When you open a blank journal, it is easy to default to surface-level summaries of your day or feel uncertain about where to begin. Prompts act as entry points into deeper reflection.
          </p>
          <p>
            Rather than looking for correct or impressive answers, self-discovery prompts encourage you to observe:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">Thoughts &amp; Assumptions</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Observing the internal narratives and expectations that quietly guide your day.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">Emotions &amp; Feeling States</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Noticing emotional shifts with vocabulary that goes beyond broad labels.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">Reactions &amp; Habits</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Recognizing automatic instincts to defend, withdraw, explain, or please others.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">Core Values &amp; Priorities</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Clarifying what genuinely matters to you versus what is driven by external pressure.
              </p>
            </div>
          </div>
          <p>
            By exploring these dimensions on paper, you create a private reflective space to understand who you are and how you operate.
          </p>
        </ScrollReveal>
      </section>

      {/* SECTION 2: How to Use Journaling Prompts */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[1060px] mx-auto px-6 md:px-[8%] space-y-16">
          <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Practical Method
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              How to Use Journaling Prompts
            </h2>
            <p className="font-sans text-[15px] font-light text-light-mid leading-relaxed">
              To get the most out of reflective writing, follow this practical five-step approach:
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.05}>
              <span className="font-serif text-2xl text-secondary font-light">01</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Choose One Prompt</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Pick a single question that feels relevant or creates a slight spark of curiosity.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.12}>
              <span className="font-serif text-2xl text-secondary font-light">02</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Write Without Editing</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Write freely without trying to produce a polished answer or perform for an audience.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.19}>
              <span className="font-serif text-2xl text-secondary font-light">03</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Notice What Matters</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Pay attention to specific sentences, words, or emotions that carry genuine weight.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.26}>
              <span className="font-serif text-2xl text-secondary font-light">04</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Ask Follow-Ups</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Inquire deeper: "Why did I write that?" or "What was I expecting in that situation?"
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.33}>
              <span className="font-serif text-2xl text-secondary font-light">05</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Return Over Time</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Revisit recurring themes across multiple days to see how your perspectives evolve.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 3: Journaling Prompts to Understand Yourself Better */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-10">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Category 01
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Journaling Prompts to Understand Yourself Better
          </h2>
          <p className="font-sans text-[15px] font-light text-mid leading-relaxed">
            Use these ten prompts to examine your current state of mind, recurring thoughts, and personal tendencies:
          </p>
        </ScrollReveal>

        <div className="space-y-4">
          {[
            "What is something happening in your daily life right now that occupies more of your mental energy than you would like?",
            "When did you last feel completely like yourself, and what were you doing in that moment?",
            "Which parts of your current weekly routine feel genuinely grounding, and which feel depleting?",
            "What is a belief about yourself that you have begun to question recently?",
            "In what situations do you find yourself holding back what you really want to say?",
            "What parts of your life currently feel clear and stable, and what parts feel uncertain?",
            "What is something you frequently explain away or minimize when talking to others?",
            "If you could look at your daily choices through the eyes of an objective observer, what would stand out?",
            "What is a recurring thought you find yourself returning to when you are alone and quiet?",
            "What do you wish you understood better about how you handle pressure or conflict?"
          ].map((prompt, idx) => (
            <ScrollReveal key={idx} className="bg-white border border-primary/8 rounded-lg p-5 flex items-start gap-4" delay={idx * 0.04}>
              <span className="font-serif text-base text-secondary-dark font-medium shrink-0 w-6">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <p className="font-sans text-sm md:text-base font-light text-primary leading-relaxed">
                {prompt}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* SECTION 4: Journaling Prompts About Your Emotions */}
      <section className="bg-white border-t border-b border-primary/5 py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-10">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              Category 02
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
              Journaling Prompts About Your Emotions
            </h2>
            <p className="font-sans text-[15px] font-light text-mid leading-relaxed">
              These ten prompts encourage emotional precision, helping you name nuanced feeling states without judgment:
            </p>
          </ScrollReveal>

          <div className="space-y-4">
            {[
              "What specific emotion has been most present for you over the past few days, and when does it tend to appear?",
              "Describe a moment this week when your mood shifted noticeably. What immediately preceded that shift?",
              "What feelings do you find easiest to express openly, and which feelings do you tend to keep to yourself?",
              "Beyond broad words like 'stressed' or 'fine', what subtle emotional words best describe your current state?",
              "When you feel disappointed, what does that experience feel like in your body before you put it into words?",
              "Is there a feeling you have been trying to push aside because you feel you shouldn't be feeling it?",
              "What environment or interaction consistently brings up feelings of ease and lightness for you?",
              "How do you typically respond when you feel misunderstood by someone close to you?",
              "What emotional tone or undercurrent seems to repeat across different areas of your life right now?",
              "If your current primary emotion could speak without being judged, what would it want to acknowledge?"
            ].map((prompt, idx) => (
              <ScrollReveal key={idx} className="bg-mint-grey/50 border border-primary/8 rounded-lg p-5 flex items-start gap-4" delay={idx * 0.04}>
                <span className="font-serif text-base text-secondary-dark font-medium shrink-0 w-6">
                  {String(idx + 11).padStart(2, '0')}
                </span>
                <p className="font-sans text-sm md:text-base font-light text-primary leading-relaxed">
                  {prompt}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: Journaling Prompts About Your Reactions */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-10">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Category 03
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Journaling Prompts About Your Reactions
          </h2>
          <p className="font-sans text-[15px] font-light text-mid leading-relaxed">
            Examine your automatic behavioral responses, defensive instincts, and pauses with these ten prompts:
          </p>
        </ScrollReveal>

        <div className="space-y-4">
          {[
            "What is an automatic reaction you notice yourself having whenever a plan changes unexpectedly?",
            "When you feel criticized or questioned, what is your immediate instinct—to explain, defend, apologize, or withdraw?",
            "Recall a recent interaction that left you feeling drained or unsettled. How did you react in the moment?",
            "In what situations do you catch yourself saying 'yes' before you have actually considered whether you want to?",
            "What triggers you to rush, multitask, or feel urgent even when there is no immediate deadline?",
            "How do you react when someone asks you for support while you are already overwhelmed?",
            "What habit or response do you default to when you want to avoid dealing with an uncomfortable conversation?",
            "Can you identify a time this week when you paused before reacting? What difference did that pause make?",
            "What repeated dynamic in a relationship tends to produce the exact same reaction from you each time?",
            "What alternative response would you like to experiment with next time you encounter a familiar trigger?"
          ].map((prompt, idx) => (
            <ScrollReveal key={idx} className="bg-white border border-primary/8 rounded-lg p-5 flex items-start gap-4" delay={idx * 0.04}>
              <span className="font-serif text-base text-secondary-dark font-medium shrink-0 w-6">
                {String(idx + 21).padStart(2, '0')}
              </span>
              <p className="font-sans text-sm md:text-base font-light text-primary leading-relaxed">
                {prompt}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* SECTION 6: Journaling Prompts About Your Values */}
      <section className="bg-white border-t border-b border-primary/5 py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-10">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              Category 04
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
              Journaling Prompts About Your Values
            </h2>
            <p className="font-sans text-[15px] font-light text-mid leading-relaxed">
              Clarify your principles, evaluate your daily alignment, and reflect on meaningful choices with these ten prompts:
            </p>
          </ScrollReveal>

          <div className="space-y-4">
            {[
              "What three principles or core values are most important to you in this season of your life?",
              "Look back at your calendar or spending over the past month. Does it reflect what you claim to value most?",
              "When was the last time you made a difficult choice because it was aligned with your integrity?",
              "What is something you currently spend time on that feels out of alignment with your deeper priorities?",
              "What qualities do you respect most in the people you choose to surround yourself with?",
              "In what area of your life are you living according to someone else's expectations rather than your own values?",
              "What kind of boundary do you need to set or maintain in order to honor what truly matters to you?",
              "What does a truly meaningful day look like for you, stripped of outside validation or achievement pressure?",
              "What is a personal value you used to hold strongly that has evolved or softened over time?",
              "If your choices today were guided purely by your own inner values, what is one small thing you would do differently?"
            ].map((prompt, idx) => (
              <ScrollReveal key={idx} className="bg-mint-grey/50 border border-primary/8 rounded-lg p-5 flex items-start gap-4" delay={idx * 0.04}>
                <span className="font-serif text-base text-secondary-dark font-medium shrink-0 w-6">
                  {String(idx + 31).padStart(2, '0')}
                </span>
                <p className="font-sans text-sm md:text-base font-light text-primary leading-relaxed">
                  {prompt}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: Journaling Prompts for Your Future */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-10">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Category 05
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Journaling Prompts for Your Future
          </h2>
          <p className="font-sans text-[15px] font-light text-mid leading-relaxed">
            Reflect on your direction, evolving hopes, decisions, and uncertainties with these ten prompts:
          </p>
        </ScrollReveal>

        <div className="space-y-4">
          {[
            "What is one direction in your life or career that feels intriguing to explore, even if you feel uncertain about it?",
            "What kind of daily rhythm or pace would you like to cultivate over the coming six months?",
            "What is a decision you know you will need to make soon, and what makes it feel challenging?",
            "What is one fear about the future that you can acknowledge and examine with curiosity rather than dread?",
            "What habits or mental patterns would you like to leave behind as you move into your next chapter?",
            "What kind of relationship with yourself do you want to develop over the next year?",
            "If you imagine yourself two years from now feeling grounded and clear, what might you be spending your time on?",
            "What skill, practice, or area of self-understanding would you most like to deepen moving forward?",
            "What is one area where you are currently holding back from taking the next step, and what is holding you back?",
            "What question about your future would be most helpful for you to live with and reflect on right now?"
          ].map((prompt, idx) => (
            <ScrollReveal key={idx} className="bg-white border border-primary/8 rounded-lg p-5 flex items-start gap-4" delay={idx * 0.04}>
              <span className="font-serif text-base text-secondary-dark font-medium shrink-0 w-6">
                {String(idx + 41).padStart(2, '0')}
              </span>
              <p className="font-sans text-sm md:text-base font-light text-primary leading-relaxed">
                {prompt}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* SECTION 8: What Can You Notice Over Time? */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-8">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Long-Term Observation
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              What Can You Notice Over Time?
            </h2>
          </ScrollReveal>
          <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-light-mid leading-relaxed">
            <p>
              A single journal entry captures a moment, but consistent reflection creates an ongoing record of your inner life. When you write across weeks and months, subtle tendencies that were previously invisible start to surface.
            </p>
            <p>
              Repeated journaling allows you to observe:
            </p>
            <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-light-mid pl-4">
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Recurring Situations:</strong> The specific environments, conversations, or dynamics that consistently challenge your composure.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Repeated Thoughts:</strong> The default interpretations and mental assumptions you automatically apply to everyday events.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Emotional Patterns:</strong> How certain triggers reliably precede predictable feeling states—<a href="/emotional-patterns" className="text-secondary hover:text-white underline underline-offset-4">learn more about identifying emotional patterns</a>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Common Reactions:</strong> Habits of withdrawing, over-explaining, or appeasing that show up across different relationships.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Changing Priorities:</strong> The gradual shift in what feels genuinely important versus what you have outgrown.</span>
              </li>
            </ul>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 9: From Random Prompts to Structured Reflection */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Practice Evolution
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            From Random Prompts to Structured Reflection
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            While standalone prompts offer quick inspiration, understanding yourself deeply requires moving from disjointed entries to a cohesive reflective practice.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-2">
              <h3 className="font-serif text-base text-primary font-medium">Random Journaling</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Writing whatever comes to mind without a consistent structure or clear follow-through.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-2">
              <h3 className="font-serif text-base text-primary font-medium">Prompted Journaling</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Starting with a targeted question to direct your attention toward a specific area of inquiry.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-2">
              <h3 className="font-serif text-base text-primary font-medium">Structured Reflection</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Revisiting entries, comparing reactions over time, and connecting themes into lasting self-understanding.
              </p>
            </div>
          </div>
          <p>
            To deepen your practice, explore our beginner guide on <a href="/how-to-start-journaling" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">how to start journaling</a>, our tutorial on <a href="/how-to-practice-self-reflection" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">how to practice self-reflection</a>, our deep-dive on <a href="/guided-journaling" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">guided journaling principles</a>, the methodology of <a href="/self-reflection" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">structured self-reflection</a>, and frameworks for <a href="/self-awareness" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">improving self-awareness</a>.
          </p>
        </ScrollReveal>
      </section>

      {/* SECTION 10: Using Journaling Prompts With Ingress Within */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-8">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Platform Features
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              Using Journaling Prompts With Ingress Within
            </h2>
          </ScrollReveal>
          <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-light-mid leading-relaxed">
            <p>
              Ingress Within translates standalone journaling questions into an integrated reflection framework designed for long-term insight:
            </p>
            <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-light-mid pl-4">
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>30-Day Guided Cycles:</strong> Structured cycles that introduce contextual prompts at the right stage of your practice.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Psychology-Informed Exercises:</strong> Word association, baseline perceptions, and reflection modules that expand your self-understanding.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Pattern Threads:</strong> Private insights that connect observations across different days and surface recurring dynamics.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Emotional Vocabulary Tools:</strong> Interactive glossaries that help you articulate subtle feeling states accurately.</span>
              </li>
            </ul>
            <div className="pt-4">
              <button
                onClick={handleStartWriting}
                className="bg-accent hover:opacity-95 text-primary px-8 py-3.5 rounded font-sans text-xs font-bold tracking-wider uppercase inline-block shadow-sm transition-all duration-200 cursor-pointer"
              >
                Start Writing With Guided Prompts &rarr;
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 11: Frequently Asked Questions */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-12 border-t border-primary/5">
        <ScrollReveal className="text-center space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Common Inquiries
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Frequently Asked Questions About Journaling Prompts
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
            <a href="/self-reflection" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Self-Reflection Guide &rarr;</a>
            <a href="/how-to-practice-self-reflection" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">How to Practice Self-Reflection &rarr;</a>
            <a href="/emotional-patterns" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Emotional Patterns Guide &rarr;</a>
            <a href="/self-awareness" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Self-Awareness Guide &rarr;</a>
            <a href="/how-to-start-journaling" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">How to Start Journaling &rarr;</a>
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
