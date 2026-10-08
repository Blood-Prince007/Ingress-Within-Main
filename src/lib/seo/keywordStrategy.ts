/**
 * Keyword & Search Intent Architecture for Ingress Within
 * 
 * Strict Compliance:
 * - NO clinical/diagnostic claims (no "treat anxiety", "cure depression", "diagnose", "replace therapy").
 * - Target long-tail, high-intent searches centered around guided journaling, self-reflection, and emotional patterns.
 */

export interface KeywordCluster {
  id: string;
  name: string;
  primaryPositioning: string;
  keywords: string[];
}

export const KEYWORD_CLUSTERS: Record<string, KeywordCluster> = {
  guidedJournaling: {
    id: 'guidedJournaling',
    name: 'Guided Journaling',
    primaryPositioning: 'Guided Journaling for Self-Understanding',
    keywords: [
      'guided journaling',
      'guided journaling app',
      'journaling for self reflection',
      'structured journaling',
      'journaling prompts for self discovery',
      'daily reflection journal',
      'guided self reflection'
    ]
  },
  selfUnderstanding: {
    id: 'selfUnderstanding',
    name: 'Self-Understanding',
    primaryPositioning: 'Understanding Yourself & Improving Self-Awareness',
    keywords: [
      'how to understand yourself better',
      'self understanding exercises',
      'improve self awareness',
      'understand emotional patterns',
      'learn about yourself',
      'self reflection exercises'
    ]
  },
  emotionalPatterns: {
    id: 'emotionalPatterns',
    name: 'Emotional Patterns',
    primaryPositioning: 'Identifying & Understanding Emotional Patterns',
    keywords: [
      'how to identify emotional patterns',
      'understand recurring emotions',
      'identify behaviour patterns',
      'emotional self awareness',
      'recurring thought patterns',
      'understand your reactions'
    ]
  },
  psychologyInformed: {
    id: 'psychologyInformed',
    name: 'Psychology-Informed Self-Reflection',
    primaryPositioning: 'Psychology-Informed Exercises for Self-Reflection',
    keywords: [
      'psychology exercises for self reflection',
      'psychology based journaling',
      'structured self reflection exercises',
      'cognitive reflection exercises',
      'self awareness exercises'
    ]
  },
  mentalWellness: {
    id: 'mentalWellness',
    name: 'Mental Wellness',
    primaryPositioning: 'Journaling & Self-Reflection for Mental Wellness',
    keywords: [
      'mental wellness journaling',
      'journaling for mental wellness',
      'emotional wellness app',
      'self reflection for mental wellness',
      'emotional wellbeing exercises'
    ]
  }
};

/**
 * Single Primary Search Intent per Public Route
 */
export const ROUTE_INTENT_MAP: Record<string, { title: string; description: string; clusterId: string }> = {
  home: {
    title: 'A Continuous Psychological Journey | Ingress Within',
    description: 'Start on your own, work with a therapist, or move between the two. Ingress Within is one connected space for self-guided work and professional support.',
    clusterId: 'psychologyInformed'
  },
  guidedJournaling: {
    title: 'What Is Guided Journaling? | Ingress Within',
    description: 'Learn what guided journaling is, how it differs from regular journaling, and how structured self-reflection can help you better understand your thoughts, emotions, and patterns.',
    clusterId: 'guidedJournaling'
  },
  selfReflection: {
    title: 'What Is Self-Reflection? | Ingress Within',
    description: 'Learn what self-reflection is, how to practice it, and how structured reflection can help you better understand your thoughts, reactions, and patterns.',
    clusterId: 'selfUnderstanding'
  },
  emotionalPatterns: {
    title: 'How to Identify Emotional Patterns | Ingress Within',
    description: 'Learn how to identify recurring emotional patterns, understand repeated reactions, and notice recurring thoughts and behaviours through structured self-reflection.',
    clusterId: 'emotionalPatterns'
  },
  selfAwareness: {
    title: 'How to Become More Self-Aware | Ingress Within',
    description: 'Learn what self-awareness is, how to develop it, and how noticing your thoughts, emotions, reactions, habits, and values can support self-understanding.',
    clusterId: 'selfUnderstanding'
  },
  journalingPrompts: {
    title: '50 Journaling Prompts for Self-Discovery | Ingress Within',
    description: 'Explore 50 journaling prompts for self-discovery designed to help you reflect on your thoughts, emotions, reactions, values, and future.',
    clusterId: 'guidedJournaling'
  },
  howToStartJournaling: {
    title: 'How to Start Journaling: A Simple Guide for Beginners | Ingress Within',
    description: 'Learn how to start journaling with a simple beginner-friendly approach, including what to write, how often to journal, and how to make reflection easier.',
    clusterId: 'guidedJournaling'
  },
  howToPracticeSelfReflection: {
    title: 'How to Practice Self-Reflection | Ingress Within',
    description: 'Learn how to practice self-reflection with simple daily techniques, practical reflection questions, and a structured 5-step framework for greater self-understanding.',
    clusterId: 'selfUnderstanding'
  },
  whatItIs: {
    title: 'What is Guided Journaling? | Ingress Within',
    description: 'Discover how guided journaling and structured self-reflection help you gain clarity on your emotions, thought patterns, and personal growth.',
    clusterId: 'selfUnderstanding'
  },
  howItWorks: {
    title: 'How Guided Journaling Works | Ingress Within',
    description: 'Learn how daily reflection prompts, psychology-informed exercises, and pattern intelligence translate your writing into actionable self-understanding.',
    clusterId: 'psychologyInformed'
  },
  about: {
    title: 'About Ingress Within | Guided Journaling Platform',
    description: 'Built to give urban Indians a quiet, structured space for guided journaling, emotional pattern recognition, and honest self-reflection.',
    clusterId: 'guidedJournaling'
  },
  pricing: {
    title: 'Guided Journaling Platform Pricing | Ingress Within',
    description: 'Start free with guided daily journaling and pattern analysis. Simple, transparent pricing for long-term self-reflection and personal growth.',
    clusterId: 'mentalWellness'
  },
  faq: {
    title: 'Guided Journaling & Self-Reflection FAQ | Ingress Within',
    description: 'Answers to common questions about guided journaling, emotional pattern identification, data privacy, and how Ingress Within supports self-reflection.',
    clusterId: 'emotionalPatterns'
  },
  aiData: {
    title: 'AI Journaling Privacy & Data Security | Ingress Within',
    description: 'Learn how Ingress Within protects your personal reflection data with end-to-end security, transparent controls, and private intelligence.',
    clusterId: 'psychologyInformed'
  },
  contact: {
    title: 'Contact Ingress Within | Guided Journaling Support',
    description: 'Get in touch with the Ingress Within team for questions, feedback, or support with your guided journaling journey.',
    clusterId: 'guidedJournaling'
  },
  auth: {
    title: 'Sign In & Register | Ingress Within',
    description: 'Access your private guided journaling account, view your pattern reports, and continue your daily self-reflection.',
    clusterId: 'guidedJournaling'
  },
  therapistAuth: {
    title: 'Therapist Portal — Clinical Practitioner Access | Ingress Within',
    description: 'Secure, dedicated portal for clinical practitioners and therapists at Ingress Within.',
    clusterId: 'psychologyInformed'
  }
};

/**
 * Content Gap & Future Landing Page Strategy Roadmap
 * Avoids keyword cannibalization by assigning distinct primary intents.
 */
export const CONTENT_ROADMAP = [
  { slug: '/guided-journaling', primaryIntent: 'Guided Journaling Guide & Best Practices' },
  { slug: '/self-reflection', primaryIntent: 'Structured Self-Reflection Techniques' },
  { slug: '/emotional-patterns', primaryIntent: 'Identifying & Understanding Emotional Patterns' },
  { slug: '/self-awareness', primaryIntent: 'Improving Self-Awareness Through Daily Writing' },
  { slug: '/journaling-prompts-for-self-discovery', primaryIntent: '50 Journaling Prompts for Self-Discovery & Personal Clarity' },
  { slug: '/how-to-start-journaling', primaryIntent: 'Beginner Instructions for Starting a Journaling Practice' },
  { slug: '/how-to-practice-self-reflection', primaryIntent: 'Practical Step-by-Step Guide on How to Practice Self-Reflection' }
];
