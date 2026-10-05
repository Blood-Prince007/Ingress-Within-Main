import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Plus, Minus } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ScrollReveal = ({ children, delay = 0, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const FAQ_CATEGORIES = [
  { id: 'product', label: 'The product', introTitle: 'The product', introSub: 'What Ingress Within is, how guided journaling works, what you actually get from it — and what it is not.' },
  { id: 'privacy', label: 'Privacy & data', introTitle: 'Privacy & data', introSub: 'What happens to what you write, who can see it, and how your data is handled. These are not small questions for a product like this.' },
  { id: 'pricing', label: 'Pricing & billing', introTitle: 'Pricing & billing', introSub: 'What things cost, what the founding 50 offer actually means, and how cancellation works.' },
  { id: 'mental', label: 'Mental health & crisis', introTitle: 'Mental health & crisis', introSub: 'Where the product sits in relation to professional support, what happens in a crisis, and what we will and won\'t do.' }
];

const FAQ_DATA = {
  product: [
    {
      q: "What is guided journaling?",
      a: [
        "Guided journaling is a structured self-reflection practice that provides intentional prompts, questions, and psychological exercises rather than a blank page. It helps you explore your thoughts, notice recurring emotional patterns, and cultivate self-awareness.",
        "Ingress Within pairs guided daily prompts with AI-driven pattern intelligence, reading your entries across time to reflect your personal progress and cognitive tendencies."
      ]
    },
    {
      q: "What exactly is Ingress Within?",
      a: [
        "Ingress Within is a daily guided journaling practice with an intelligent reader that notices what keeps coming back, asking you one meaningful question at the end of each entry. Over time, it builds a clear picture of your emotional patterns — not by diagnosing you, but by reflecting what you keep showing it.",
        "It is not therapy. It is not a generic diary app. It is structured, continuous self-reflection designed for self-understanding."
      ]
    },
    {
      q: "How can journaling help with self-reflection and self-understanding?",
      a: [
        "Journaling helps externalize internal thoughts so you can examine them objectively. By translating raw feelings into written words, you slow down reactive thinking and gain distance from daily stressors.",
        "With Ingress Within, self-reflection becomes structured: the platform connects current entries with past themes, helping you notice recurring emotional triggers and habit loops."
      ]
    },
    {
      q: "How do I understand my emotional patterns?",
      a: [
        "Understanding emotional patterns begins with consistent daily writing without self-censorship. When you document your experiences across weeks, subtle trends surface — such as specific situations that trigger stress or recurring communication responses.",
        "Ingress Within automatically analyzes your vocabulary and weekly themes to map these emotional patterns into high-resolution weekly and monthly cycle reports."
      ]
    },
    {
      q: "What is structured self-reflection?",
      a: [
        "Structured self-reflection is a deliberate method of examining your internal experiences using targeted prompts, psychological frameworks, and thematic synthesis. Unlike unguided stream-of-consciousness writing, structured reflection guides your attention toward core values, triggers, and cognitive shifts."
      ]
    },
    {
      q: "How is Ingress Within different from a regular journal?",
      a: [
        "A regular journal gives you a blank page into which you write into a void, with no tracking or feedback.",
        "Ingress Within reads what you write, connects it to past entries, and names what you keep circling without quite landing on. The reflection and question that return are unique to your writing — helping you build genuine self-understanding."
      ],
      note: "The goal is not to give generic affirmations. It is to help you see your thoughts and emotional patterns clearly."
    },
    {
      q: "What does \"writing without editing yourself\" mean?",
      a: [
        "Most people write their constructed narrative — the story they have made up around an event. Writing without editing yourself means writing the version before you made it make sense: the raw feeling before you qualified or renamed it.",
        "That raw writing provides the system with honest material to reveal genuine underlying patterns."
      ]
    },
    {
      q: "What is a cycle?",
      a: [
        "A cycle is roughly one month of daily entries. At the end of a cycle, you receive a full report of what surfaced: emotional patterns identified, recurring questions, and how your language shifted over time."
      ]
    }
  ],
  privacy: [
    {
      q: "Is my writing private?",
      a: [
        "Yes. Your entries are private by design. They are not read by humans, not shared with third parties, and not used to train global AI models on other users. Your writing stays yours."
      ]
    },
    {
      q: "Who can see my entries?",
      a: [
        "Only you. No human at Ingress Within reads your entries. The system processes them algorithmically to generate your reflections in a secure, isolated pipeline."
      ]
    },
    {
      q: "Can I delete my data?",
      a: [
        "Yes. You can request complete deletion of your account and all associated data at any time. Deletion is permanent."
      ]
    }
  ],
  pricing: [
    {
      q: "What does the free trial include?",
      a: [
        "The first 7 days are completely free — full access, no credit card required. You receive daily guided entries, AI reflections, and pattern tracking from day one."
      ]
    },
    {
      q: "What does the membership cost?",
      a: [
        "Ingress Within Self-Work is ₹499 per month (GST inclusive), which includes unlimited daily guided entries, weekly pattern reports, 30-day synthesis, and therapeutic self-work exercises. Cancel anytime."
      ]
    }
  ],
  mental: [
    {
      q: "Does Ingress Within provide therapy?",
      a: [
        "No. Ingress Within is designed for guided self-reflection and self-understanding and is not a replacement for professional mental health care or therapy.",
        "It provides a structured space to examine your thoughts and emotional patterns, but does not offer clinical diagnosis, medical treatment, or crisis intervention."
      ]
    },
    {
      q: "Is this a mental health product?",
      a: [
        "It is a self-reflection platform operating in the mental wellness space. It is not a clinical tool or therapy platform. It helps you recognize patterns in your thinking and behavior over time."
      ]
    },
    {
      q: "What happens if I write something suggesting a crisis?",
      a: [
        "If the system detects language indicating acute distress or crisis, it will surface immediate confidential helpline resources. Ingress Within is not a crisis response service."
      ],
      warn: "If you are in crisis right now: iCall (India) — 9152987821. Vandrevala Foundation — 1860-2662-345 (24/7)."
    }
  ]
};

export default function FaqPage({ onOpenPolicy }) {
  const [activeTab, setActiveTab] = useState('product');
  const [openIndex, setOpenIndex] = useState(null);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setOpenIndex(null);
  };

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const currentCategory = FAQ_CATEGORIES.find(c => c.id === activeTab);
  const currentFaqList = FAQ_DATA[activeTab] || [];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": Object.values(FAQ_DATA).flat().map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": Array.isArray(item.a) ? item.a.join(' ') : item.a
      }
    }))
  };

  return (
    <div className="min-h-screen bg-mint-grey text-primary selection:bg-accent/30 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      {/* Navigation */}
      <Navbar />

      {/* Hero Section (Treatment A: Watercolor Paper) */}
      <section className="treatment-watercolor-hero pt-[148px] pb-20 md:pt-[180px] md:pb-28 px-6 md:px-16 text-center border-b border-primary/5">
        <div className="max-w-[700px] mx-auto space-y-5 relative z-10">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">FAQ</span>
          <h1 className="font-serif text-[40px] md:text-[54px] lg:text-[60px] leading-[1.15] font-normal text-primary">
            Guided Journaling &amp; Self-Reflection Questions
          </h1>
          <div className="w-10 h-[1px] bg-accent mx-auto my-6" />
          <p className="font-sans text-[17px] font-light text-mid leading-relaxed max-w-[580px] mx-auto">
            Honest answers about guided journaling, emotional patterns, privacy, and how Ingress Within supports self-understanding.
          </p>
        </div>
      </section>

      {/* Tabs list */}
      <div className="bg-white border-b border-primary/5 sticky top-[68px] z-40 overflow-x-auto no-scrollbar shadow-[0_1px_3px_rgba(30,42,46,0.01)]">
        <div className="max-w-3xl mx-auto px-6 flex justify-start md:justify-center gap-8 md:gap-12">
          {FAQ_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => handleTabChange(category.id)}
              className={`py-5 text-sm font-label-md font-bold uppercase tracking-wider transition-all relative cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === category.id 
                  ? 'border-accent text-primary font-extrabold' 
                  : 'border-transparent text-primary/50 hover:text-primary'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion Questions Content */}
      <section className="py-16 md:py-24 px-6 md:px-16 max-w-3xl mx-auto space-y-12">
        
        {/* Active Category Intro */}
        {currentCategory && (
          <ScrollReveal className="space-y-3" key={activeTab + "-intro"}>
            <h2 className="font-headline-md text-2xl md:text-3xl text-primary font-bold">{currentCategory.introTitle}</h2>
            <p className="font-body-md text-sm md:text-base text-on-surface-variant leading-relaxed opacity-85">
              {currentCategory.introSub}
            </p>
          </ScrollReveal>
        )}

        {/* Accordions */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {currentFaqList.map((item, index) => {
                const isOpen = openIndex === index;
                return (
                  <div 
                    key={index}
                    className="bg-white border border-primary/5 rounded-xl overflow-hidden hover:border-primary/15 hover:shadow-xs transition-all duration-300"
                  >
                    <button
                      onClick={() => toggleAccordion(index)}
                      className="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none cursor-pointer group"
                    >
                      <span className="font-headline-md text-base md:text-lg font-semibold text-primary group-hover:text-secondary-dark transition-colors duration-300 pr-4">
                        {item.q}
                      </span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isOpen ? 'bg-accent/10 text-accent rotate-180' : 'bg-primary/5 text-primary/60 group-hover:bg-primary/10'
                      }`}>
                        {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pt-2 font-body-md text-sm md:text-base text-on-surface-variant leading-relaxed space-y-4 border-t border-primary/5 pt-4">
                            {item.a.map((paragraph, pIdx) => (
                              <p key={pIdx} dangerouslySetInnerHTML={{ __html: paragraph }} />
                            ))}

                            {item.note && (
                              <div className="bg-mint-grey/50 border-l-2 border-secondary rounded-r-lg p-4 mt-4 text-xs md:text-sm text-primary italic leading-relaxed">
                                {item.note}
                              </div>
                            )}

                            {item.warn && (
                              <div className="bg-accent/5 border-l-2 border-accent rounded-r-lg p-4 mt-4 text-xs md:text-sm text-primary leading-relaxed">
                                {item.warn}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Internal Cross-Linking Navigation */}
        <div className="bg-white border border-primary/10 rounded-2xl p-8 space-y-4 text-center mt-12">
          <h3 className="font-serif text-xl font-normal text-primary">Explore More About Ingress Within</h3>
          <p className="font-sans text-xs text-mid leading-relaxed max-w-md mx-auto">
            Learn more about guided journaling principles, platform architecture, and privacy protections.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a href="/guided-journaling" className="text-xs font-bold uppercase tracking-wider text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">
              Guided Journaling Guide &rarr;
            </a>
            <a href="/self-reflection" className="text-xs font-bold uppercase tracking-wider text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">
              Self-Reflection Guide &rarr;
            </a>
            <a href="/emotional-patterns" className="text-xs font-bold uppercase tracking-wider text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">
              Emotional Patterns Guide &rarr;
            </a>
            <a href="/self-awareness" className="text-xs font-bold uppercase tracking-wider text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">
              Self-Awareness Guide &rarr;
            </a>
            <a href="/journaling-prompts-for-self-discovery" className="text-xs font-bold uppercase tracking-wider text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">
              Journaling Prompts &rarr;
            </a>
            <a href="/how-to-start-journaling" className="text-xs font-bold uppercase tracking-wider text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">
              How to Start Journaling &rarr;
            </a>
            <a href="/how-to-practice-self-reflection" className="text-xs font-bold uppercase tracking-wider text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">
              How to Practice Self-Reflection &rarr;
            </a>
            <a href="/what-it-is" className="text-xs font-bold uppercase tracking-wider text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">
              What is Guided Journaling &rarr;
            </a>
            <a href="/how-it-works" className="text-xs font-bold uppercase tracking-wider text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">
              How It Works &rarr;
            </a>
            <a href="/pricing" className="text-xs font-bold uppercase tracking-wider text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">
              Membership &amp; Pricing &rarr;
            </a>
            <a href="/ai-data" className="text-xs font-bold uppercase tracking-wider text-secondary-dark hover:text-primary transition-colors border-b border-secondary-dark pb-0.5 no-underline">
              AI &amp; Data Privacy &rarr;
            </a>
          </div>
        </div>

      </section>

      {/* Still Have Questions Banner */}
      <section className="bg-primary text-on-primary py-20 px-6 md:px-16 text-center border-t border-b border-white/5">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="font-headline-md text-2xl md:text-3xl text-white font-medium">Still have a question?</h2>
          <p className="font-body-md text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
            Write to us directly. We read every message and reply to all of them.
          </p>
          <a 
            href="mailto:hello@ingresswithin.com" 
            className="bg-accent hover:opacity-95 text-primary py-3 px-8 rounded-xl font-label-md text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 shadow-md transition-all duration-300"
          >
            <Mail size={14} /> hello@ingresswithin.com
          </a>
        </div>
      </section>

      {/* Footer */}
      <Footer onOpenPolicy={onOpenPolicy} />
    </div>
  );
}
