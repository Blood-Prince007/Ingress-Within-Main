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

export default function HowToPracticeSelfReflectionPage({ onOpenPolicy }) {
  const handleStartWriting = () => {
    if (window.navigateTo) {
      window.navigateTo('/auth');
    } else {
      window.location.pathname = '/auth';
    }
  };

  const faqData = [
    {
      question: "How do I start practicing self-reflection?",
      answer: "Start by choosing one specific experience from your day, pausing for a few quiet minutes, and writing down what happened, what you thought, and how you responded without judging yourself."
    },
    {
      question: "How often should I practice self-reflection?",
      answer: "Practicing a few times a week or engaging in a short 5-minute daily check-in is enough to build steady momentum. You can also practice situationally after challenging or meaningful events."
    },
    {
      question: "How long should self-reflection take?",
      answer: "A meaningful reflection session can take anywhere from 5 to 15 minutes. Consistency and honest observation matter far more than long writing sessions."
    },
    {
      question: "What should I ask myself during self-reflection?",
      answer: "Ask open-ended questions that explore your experience: 'What happened?', 'What was I thinking?', 'What did I feel?', 'How did I react?', and 'What might this teach me about my priorities?'"
    },
    {
      question: "Is journaling a form of self-reflection?",
      answer: "Yes. Writing down your thoughts and reactions is one of the most effective ways to practice self-reflection because it slows your thinking and gives structure to complex feelings."
    },
    {
      question: "Is Ingress Within a replacement for therapy?",
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
              Practical Reflection Guide
            </span>
            <h1 className="font-serif text-[40px] md:text-[54px] lg:text-[60px] leading-[1.15] font-normal text-primary">
              How to Practice Self-Reflection
            </h1>
            <div className="w-10 h-[1px] bg-accent mx-auto my-6" />
            <p className="font-sans text-[17px] font-light text-mid leading-relaxed max-w-[700px] mx-auto">
              Learn practical methods to step back from daily busyness, observe your thoughts and emotional reactions, and build lasting self-understanding.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 1: What Does It Mean to Practice Self-Reflection? */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Core Understanding
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            What Does It Mean to Practice Self-Reflection?
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            Practicing self-reflection is different from merely replaying a day's events in your head. Passive thinking often revolves around rumination—revisiting what went wrong without gaining clarity. In contrast, active self-reflection is a deliberate inquiry into your internal experience.
          </p>
          <p>
            When you actively practice self-reflection, you intentionally examine:
          </p>
          <ul className="space-y-2 font-sans text-xs md:text-sm font-light text-mid pl-4">
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>What happened:</strong> The objective facts of an event or interaction.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>What you thought:</strong> The internal assumptions, expectations, and stories you formed.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>What you felt:</strong> The subtle emotions and bodily sensations you experienced.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>How you reacted:</strong> The choices you made—whether to speak, withdraw, defend, or accommodate.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Why you reacted that way:</strong> The underlying values, boundaries, or past experiences that shaped your response.</span>
            </li>
          </ul>
          <p>
            To understand the broader foundations of this practice, explore our educational guide on <a href="/self-reflection" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">what self-reflection is and how it works</a>.
          </p>
        </ScrollReveal>
      </section>

      {/* SECTION 2: Why Can Self-Reflection Be Difficult? */}
      <section className="bg-white border-t border-b border-primary/5 py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-8">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              Common Challenges
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
              Why Can Self-Reflection Be Difficult?
            </h2>
          </ScrollReveal>
          <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
            <p>
              Even when we want to understand ourselves better, regular reflection can feel challenging due to routine, everyday obstacles:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              <div className="bg-mint-grey/50 border border-primary/8 rounded-lg p-5 space-y-1.5">
                <h3 className="font-serif text-base text-primary font-medium">Fast-Paced Schedules</h3>
                <p className="font-sans text-xs font-light text-mid leading-relaxed">
                  Moving quickly from one meeting, task, or message to the next leaves little margin for quiet pauses.
                </p>
              </div>
              <div className="bg-mint-grey/50 border border-primary/8 rounded-lg p-5 space-y-1.5">
                <h3 className="font-serif text-base text-primary font-medium">Discomfort of Re 一visiting Tension</h3>
                <p className="font-sans text-xs font-light text-mid leading-relaxed">
                  Looking closely at moments of conflict or disappointment can bring up uncomfortable emotions.
                </p>
              </div>
              <div className="bg-mint-grey/50 border border-primary/8 rounded-lg p-5 space-y-1.5">
                <h3 className="font-serif text-base text-primary font-medium">Difficulty Articulating Feelings</h3>
                <p className="font-sans text-xs font-light text-mid leading-relaxed">
                  Complex inner states often feel difficult to capture in precise words.
                </p>
              </div>
              <div className="bg-mint-grey/50 border border-primary/8 rounded-lg p-5 space-y-1.5">
                <h3 className="font-serif text-base text-primary font-medium">Focusing Solely on External Events</h3>
                <p className="font-sans text-xs font-light text-mid leading-relaxed">
                  It is easy to focus on what others did while overlooking our own internal responses.
                </p>
              </div>
            </div>
            <p>
              Acknowledging these natural barriers helps you approach reflection with patience rather than frustration.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 3: How to Practice Self-Reflection in 5 Steps */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[1060px] mx-auto px-6 md:px-[8%] space-y-16">
          <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Actionable Framework
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              How to Practice Self-Reflection in 5 Steps
            </h2>
            <p className="font-sans text-[15px] font-light text-light-mid leading-relaxed">
              Use this structured five-step method to turn any everyday moment into personal insight:
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.05}>
              <span className="font-serif text-2xl text-secondary font-light">01</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Pause and Choose One Experience</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Step back and focus on a single interaction, conversation, or task that lingered in your mind.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.12}>
              <span className="font-serif text-2xl text-secondary font-light">02</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Describe What Happened</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Record the objective facts clearly: who was involved, what was said, and the setting.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.19}>
              <span className="font-serif text-2xl text-secondary font-light">03</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Notice Your Thoughts and Emotions</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Identify what you told yourself during the situation and the feelings that arose.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.26}>
              <span className="font-serif text-2xl text-secondary font-light">04</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Look at Your Reaction</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Examine what you did next—whether you spoke up, withdrew, defended, or compromised.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/5 border border-white/12 rounded-lg p-5 space-y-2 text-center" delay={0.33}>
              <span className="font-serif text-2xl text-secondary font-light">05</span>
              <h3 className="font-serif text-base text-mint-grey font-medium">Ask What You Can Learn or Notice</h3>
              <p className="font-sans text-[11px] font-light text-light-mid leading-relaxed">
                Reflect on whether this response is part of a recurring tendency in similar situations.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 4: Questions to Ask Yourself During Self-Reflection */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Inquiry Prompts
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Questions to Ask Yourself During Self-Reflection
          </h2>
          <p className="font-sans text-[15px] font-light text-mid leading-relaxed">
            Use these open-ended questions to guide your reflections and uncover deeper context:
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "What happened?",
            "What stood out to me?",
            "What was I thinking?",
            "What was I feeling?",
            "How did I react?",
            "What did I need in that moment?",
            "What surprised me?",
            "What would I notice if I looked at this situation differently?",
            "Have I reacted similarly before?",
            "What might this experience teach me about myself?",
            "What boundary or value felt important in this situation?",
            "What is one thing I would handle differently next time?"
          ].map((q, idx) => (
            <ScrollReveal key={idx} className="bg-white border border-primary/8 rounded-lg p-4 flex items-start gap-3" delay={idx * 0.03}>
              <span className="text-secondary font-bold mt-0.5">•</span>
              <p className="font-sans text-xs md:text-sm font-light text-primary leading-relaxed">
                {q}
              </p>
            </ScrollReveal>
          ))}
        </div>

        <div className="pt-4 text-center">
          <p className="font-sans text-xs md:text-sm font-light text-mid">
            Looking for more themed question lists? Explore our curated library of{' '}
            <a href="/journaling-prompts-for-self-discovery" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">
              50 journaling prompts for self-discovery
            </a>.
          </p>
        </div>
      </section>

      {/* SECTION 5: Simple Self-Reflection Techniques */}
      <section className="bg-white border-t border-b border-primary/5 py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-10">
          <ScrollReveal className="space-y-4 text-center max-w-2xl mx-auto">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              Practical Methods
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
              Simple Self-Reflection Techniques
            </h2>
            <p className="font-sans text-[15px] font-light text-mid leading-relaxed">
              Incorporate these five structured techniques into your personal routine:
            </p>
          </ScrollReveal>

          <div className="space-y-6">
            <ScrollReveal className="bg-mint-grey/50 border border-primary/8 rounded-lg p-6 space-y-2">
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-secondary-dark">Technique 01</span>
              <h3 className="font-serif text-xl text-primary font-medium">Daily Check-In</h3>
              <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
                Take five quiet minutes in the evening to summarize what happened, what stood out, and what primary emotion defined your day.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-mint-grey/50 border border-primary/8 rounded-lg p-6 space-y-2" delay={0.08}>
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-secondary-dark">Technique 02</span>
              <h3 className="font-serif text-xl text-primary font-medium">Situation–Thought–Reaction Review</h3>
              <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
                Break a single interaction into distinct components: Situation &rarr; Thought &rarr; Emotion &rarr; Reaction. This separates objective events from subjective interpretations.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-mint-grey/50 border border-primary/8 rounded-lg p-6 space-y-2" delay={0.16}>
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-secondary-dark">Technique 03</span>
              <h3 className="font-serif text-xl text-primary font-medium">The "Why Did That Affect Me?" Question</h3>
              <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
                When a comment or situation creates lingering irritation or restlessness, ask why that specific moment felt significant to explore underlying expectations.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-mint-grey/50 border border-primary/8 rounded-lg p-6 space-y-2" delay={0.24}>
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-secondary-dark">Technique 04</span>
              <h3 className="font-serif text-xl text-primary font-medium">Compare Similar Experiences</h3>
              <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
                Ask yourself: <em>"Have I reacted this way before?"</em> Comparing multiple events helps you identify recurring responses—learn more about <a href="/emotional-patterns" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">identifying emotional patterns</a>.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-mint-grey/50 border border-primary/8 rounded-lg p-6 space-y-2" delay={0.32}>
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-secondary-dark">Technique 05</span>
              <h3 className="font-serif text-xl text-primary font-medium">Values Check</h3>
              <p className="font-sans text-xs md:text-sm font-light text-mid leading-relaxed">
                Ask: <em>"Did my actions today reflect what truly matters to me?"</em> Evaluating choices against your core values deepens your <a href="/self-awareness" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">personal self-awareness</a>.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 6: How to Make Self-Reflection a Habit */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Habit Building
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            How to Make Self-Reflection a Habit
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            Consistency in self-reflection comes from creating sustainable, low-friction habits rather than rigid regimens:
          </p>
          <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-mid pl-4">
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Choose a consistent time:</strong> Anchor your reflection to an established routine, like morning tea or before turning off the lights.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Keep sessions short:</strong> Five to ten minutes of honest observation is far more sustainable than hour-long marathons.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Focus on one experience:</strong> Avoid trying to analyze your entire day; picking one clear moment yields greater depth.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Use prompts when stuck:</strong> Structured questions eliminate blank-page hesitation.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Review previous reflections:</strong> Periodically glancing back at past notes reveals progress and recurring themes.</span>
            </li>
          </ul>
        </ScrollReveal>
      </section>

      {/* SECTION 7: Daily Self-Reflection: A Simple 5-Minute Practice */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-10">
          <ScrollReveal className="space-y-4 text-center max-w-2xl mx-auto">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Daily Practice
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              Daily Self-Reflection: A Simple 5-Minute Practice
            </h2>
            <p className="font-sans text-[15px] font-light text-light-mid leading-relaxed">
              Use this rapid 6-question check-in whenever you want a quick, actionable reflection:
            </p>
          </ScrollReveal>

          <div className="bg-white/5 border border-white/12 rounded-lg p-6 space-y-4 max-w-xl mx-auto font-sans text-xs md:text-sm font-light text-light-mid">
            <div className="flex items-start gap-3">
              <span className="text-secondary font-bold">1.</span>
              <span><strong>What happened today?</strong> (Brief overview of the day's events)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-secondary font-bold">2.</span>
              <span><strong>What stood out?</strong> (The one moment that created an internal shift)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-secondary font-bold">3.</span>
              <span><strong>What was I thinking?</strong> (The story or expectation in my mind)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-secondary font-bold">4.</span>
              <span><strong>What did I feel?</strong> (The specific emotional state present)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-secondary font-bold">5.</span>
              <span><strong>How did I react?</strong> (What action or hesitation followed)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-secondary font-bold">6.</span>
              <span><strong>What do I notice?</strong> (Key insight or takeaway for tomorrow)</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: How Self-Reflection Can Help You Notice Patterns */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Pattern Recognition
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            How Self-Reflection Can Help You Notice Patterns
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            An isolated reflection on a single day provides immediate clarity, but regular reflection across several weeks may help you notice larger themes:
          </p>
          <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-mid pl-4">
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Recurring reactions:</strong> Noticing how you consistently respond with withdrawal or defensiveness under similar pressures.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Repeated thoughts:</strong> Catching default internal assumptions before they dictate your choices.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Emotional themes:</strong> Identifying subtle feeling states that frequently reoccur—learn more about <a href="/emotional-patterns" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">tracking recurring emotional patterns</a>.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-secondary font-bold mt-1">•</span>
              <span><strong>Behavioural tendencies:</strong> Recognizing habits of overcommitting or avoiding difficult feedback.</span>
            </li>
          </ul>
        </ScrollReveal>
      </section>

      {/* SECTION 9: Self-Reflection and Journaling */}
      <section className="bg-white border-t border-b border-primary/5 py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-8">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              Writing &amp; Reflection
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
              Self-Reflection and Journaling
            </h2>
          </ScrollReveal>
          <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
            <p>
              While reflection can occur purely in the mind, writing makes the process significantly clearer and more grounded:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs text-secondary-dark bg-mint-grey/60 p-4 rounded-lg my-4">
              <span>Experience</span>
              <span>&rarr;</span>
              <span>Writing</span>
              <span>&rarr;</span>
              <span>Questions</span>
              <span>&rarr;</span>
              <span>Reflection</span>
              <span>&rarr;</span>
              <span>Patterns Over Time</span>
            </div>
            <p>
              Putting thoughts into writing forces vague sensations into concrete words. To start developing a steady writing practice, explore our guides on <a href="/guided-journaling" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">guided journaling principles</a> and <a href="/how-to-start-journaling" className="text-secondary-dark hover:text-primary font-medium underline underline-offset-4">how to start journaling for beginners</a>.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 10: Common Mistakes When Practicing Self-Reflection */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-8">
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Reflective Traps
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Common Mistakes When Practicing Self-Reflection
          </h2>
        </ScrollReveal>
        <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-mid leading-relaxed">
          <p>
            Avoid these common pitfalls to keep your self-reflection practice constructive:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">Trying to Reflect on Everything</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Attempting to analyze every single minute leads to cognitive exhaustion. Focus on one significant moment.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">Self-Judgment vs Observation</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Harsh self-criticism shuts down honest exploration. Approach your reactions with neutral curiosity.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">Focusing Exclusively on Negatives</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Remember to reflect on satisfying moments, smooth interactions, and healthy boundary-setting.
              </p>
            </div>
            <div className="bg-white border border-primary/8 rounded-lg p-5 space-y-1.5">
              <h3 className="font-serif text-base text-primary font-medium">Confusing Reflection With Overthinking</h3>
              <p className="font-sans text-xs font-light text-mid leading-relaxed">
                Reflection asks structured, purposeful questions. When you find yourself looping endlessly, close the notebook and return later.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* SECTION 11: How Ingress Within Supports Structured Self-Reflection */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 space-y-8">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Platform Features
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              How Ingress Within Supports Structured Self-Reflection
            </h2>
          </ScrollReveal>
          <ScrollReveal className="space-y-5 font-sans text-sm md:text-base font-light text-light-mid leading-relaxed">
            <p>
              Ingress Within provides a structured digital environment for guided journaling and self-reflection:
            </p>
            <ul className="space-y-3 font-sans text-xs md:text-sm font-light text-light-mid pl-4">
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>30-Day Guided Reflection Cycles:</strong> Structured progression that builds reflection momentum one day at a time.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Daily Contextual Prompts:</strong> Thoughtful reflection questions tailored to your current stage in the cycle.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Psychology-Informed Exercises:</strong> Exercises such as word association and perception checks to expand self-understanding.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Pattern Intelligence:</strong> Private observations that connect insights across multiple entries.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-secondary font-bold mt-1">•</span>
                <span><strong>Emotional Vocabulary Tools:</strong> Interactive glossaries that help you articulate subtle feeling states clearly.</span>
              </li>
            </ul>
            <div className="pt-4">
              <button
                onClick={handleStartWriting}
                className="bg-accent hover:opacity-95 text-primary px-8 py-3.5 rounded font-sans text-xs font-bold tracking-wider uppercase inline-block shadow-sm transition-all duration-200 cursor-pointer"
              >
                Start Practicing Self-Reflection Free &rarr;
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 12: Frequently Asked Questions */}
      <section className="max-w-[900px] mx-auto px-6 md:px-12 py-20 md:py-24 space-y-12 border-t border-primary/5">
        <ScrollReveal className="text-center space-y-4">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            Common Questions
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Frequently Asked Questions About Practicing Self-Reflection
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
            <a href="/self-reflection" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Self-Reflection Guide &rarr;</a>
            <a href="/guided-journaling" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Guided Journaling Guide &rarr;</a>
            <a href="/how-to-start-journaling" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">How to Start Journaling &rarr;</a>
            <a href="/journaling-prompts-for-self-discovery" className="text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">Journaling Prompts &rarr;</a>
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
