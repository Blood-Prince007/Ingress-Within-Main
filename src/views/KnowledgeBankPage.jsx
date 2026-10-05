import React, { useState, useEffect, useMemo, useRef } from 'react';
import DashboardNavbar from '../components/DashboardNavbar';
import './KnowledgeBankPage.css';
import { FAMILIES, DICTIONARY_EMOTIONS, SURFACE, PATTERNS, SITUATIONS, WORD_INDEX } from '../lib/knowledge/dictionaryData';

// Inline Tabler SVG Icons mapping to ensure completely offline-independent rendering
const ICON_PATHS = {
  'activity': '<polyline points="3 12 8 12 10 18 14 6 16 12 21 12"/>',
  'alert-circle': '<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.3" r="0.6" fill="currentColor" stroke="none"/>',
  'alert-triangle': '<path d="M12 3 L22 20 L2 20 Z"/><line x1="12" y1="9.5" x2="12" y2="14"/><circle cx="12" cy="16.8" r="0.6" fill="currentColor" stroke="none"/>',
  'align-left': '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="17" y2="18"/>',
  'arrow-back': '<line x1="20" y1="12" x2="4" y2="12"/><polyline points="10 6 4 12 10 18"/>',
  'arrow-left': '<line x1="20" y1="12" x2="4" y2="12"/><polyline points="10 6 4 12 10 18"/>',
  'arrow-right': '<line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/>',
  'arrows-minimize': '<polyline points="9 15 4 15 4 20"/><polyline points="15 9 20 9 20 4"/><line x1="4" y1="20" x2="9" y2="15"/><line x1="20" y1="4" x2="15" y2="9"/>',
  'arrows-shuffle': '<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>',
  'arrows-transfer-up': '<line x1="8" y1="21" x2="8" y2="6"/><polyline points="4 10 8 6 12 10"/><line x1="16" y1="21" x2="16" y2="10"/><polyline points="12 14 16 10 20 14"/>',
  'award': '<circle cx="12" cy="8" r="5"/><path d="M9 12.5 L7 21 L12 18 L17 21 L15 12.5"/>',
  'barrier-block': '<line x1="3" y1="17" x2="21" y2="17"/><line x1="6" y1="17" x2="6" y2="10"/><line x1="12" y1="17" x2="12" y2="7"/><line x1="18" y1="17" x2="18" y2="10"/>',
  'bolt': '<polygon points="13 2 4 14 11 14 10 22 20 10 13 10 13 2"/>',
  'building-community': '<rect x="3" y="9" width="7" height="12"/><rect x="14" y="4" width="7" height="17"/><circle cx="5" cy="13" r="0.5" fill="currentColor" stroke="none"/><circle cx="8" cy="13" r="0.5" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="0.5" fill="currentColor" stroke="none"/><circle cx="19" cy="8" r="0.5" fill="currentColor" stroke="none"/>',
  'bulb': '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  'check': '<polyline points="4 12 9 17 20 6"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/>',
  'chevron-down': '<polyline points="6 9 12 15 18 9"/>',
  'chevron-right': '<polyline points="9 6 15 12 9 18"/>',
  'circle': '<circle cx="12" cy="12" r="8"/>',
  'circle-check': '<circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/>',
  'clock': '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>',
  'clock-hour-4': '<circle cx="12" cy="12" r="9"/><line x1="12" y1="12" x2="12" y2="7"/><line x1="12" y1="12" x2="15.5" y2="15"/>',
  'clock-pause': '<circle cx="12" cy="12" r="9"/><line x1="10" y1="9" x2="10" y2="15"/><line x1="14" y1="9" x2="14" y2="15"/>',
  'cloud': '<path d="M7 18a4 4 0 0 1-1-7.9A5 5 0 0 1 15.9 8h.1a4.5 4.5 0 0 1 .5 9H7z"/>',
  'cloud-rain': '<path d="M7 15a4 4 0 0 1-1-7.9A5 5 0 0 1 15.9 5h.1a4.5 4.5 0 0 1 .5 9H7z"/><line x1="8" y1="19" x2="8" y2="21"/><line x1="12" y1="19" x2="12" y2="21"/><line x1="16" y1="19" x2="16" y2="21"/>',
  'eye': '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M3 3l18 18"/><path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.5 6.6A17 17 0 0 0 2 12s3.5 7 10 7c1.3 0 2.5-.2 3.6-.6"/><path d="M9.5 9.6a3 3 0 0 0 4.2 4.2"/>',
  'flame': '<path d="M12 2c1 4-3 5-3 9a3 3 0 0 0 6 0c0-1-.5-2-1-2.5.8 3 3 3.5 3 6.5a5 5 0 0 1-10 0c0-5 3-6 5-13z"/>',
  'flask': '<path d="M9 3h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  'git-compare': '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H14a4 4 0 0 1 4 4v5.5"/><path d="M15.5 18H10a4 4 0 0 1-4-4V8.5"/>',
  'hand-stop': '<path d="M8 12V6a1.5 1.5 0 0 1 3 0v5"/><path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11"/><path d="M14 11V6a1.5 1.5 0 0 1 3 0v8"/><path d="M8 12l-1.5 1.5a2 2 0 0 0 0 3l3 3A5 5 0 0 0 13 21h1a5 5 0 0 0 5-5v-3"/>',
  'heart': '<path d="M12 20s-7-4.6-9.5-9A5.5 5.5 0 0 1 12 5.5 5.5 5.5 0 0 1 21.5 11c-2.5 4.4-9.5 9-9.5 9z"/>',
  'heart-broken': '<path d="M12 20s-7-4.6-9.5-9A5.5 5.5 0 0 1 12 5.5 5.5 5.5 0 0 1 21.5 11c-2.5 4.4-9.5 9-9.5 9z"/><polyline points="10.5 8 13 12 10.5 14 13 18"/>',
  'heart-filled': '<path d="M12 20s-7-4.6-9.5-9A5.5 5.5 0 0 1 12 5.5 5.5 5.5 0 0 1 21.5 11c-2.5 4.4-9.5 9-9.5 9z" fill="currentColor"/>',
  'heart-handshake': '<path d="M3.5 12A5.5 5.5 0 0 1 12 7a5.5 5.5 0 0 1 8.5 5c-2 3.5-8.5 8-8.5 8s-6.5-4.5-8.5-8z"/><polyline points="8 12 10.3 14.3 12 12.5 13.7 14.3 16 12"/>',
  'home': '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/><rect x="10" y="14" width="4" height="5"/>',
  'layout-grid': '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  'leaf': '<path d="M5 21c0-9 4-15 14-16-1 10-7 14-14 16z"/>',
  'link': '<path d="M9 15l6-6"/><path d="M13 5l1.5-1.5a3.5 3.5 0 0 1 5 5L18 10"/><path d="M11 19l-1.5 1.5a3.5 3.5 0 0 1-5-5L6 14"/>',
  'lock': '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  'map-2': '<polygon points="9 4 3 6 3 20 9 18 15 20 21 18 21 4 15 6 9 4"/><line x1="9" y1="4" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="20"/>',
  'map-pin': '<path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  'mood-sad': '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="0.6" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="0.6" fill="currentColor" stroke="none"/><path d="M8.5 16a4 4 0 0 1 7 0"/>',
  'mood-search': '<circle cx="10" cy="10" r="7"/><circle cx="8" cy="9" r="0.6" fill="currentColor" stroke="none"/><circle cx="12.5" cy="9" r="0.6" fill="currentColor" stroke="none"/><path d="M7.5 12.5a3.5 3.5 0 0 0 4.7 0"/><line x1="15.3" y1="15.3" x2="20" y2="20"/>',
  'question-mark': '<path d="M9 8.5a3 3 0 1 1 4 2.8c-1 .4-1.5 1-1.5 2.2"/><circle cx="12" cy="17.5" r="0.6" fill="currentColor" stroke="none"/>',
  'refresh': '<path d="M4 12a8 8 0 0 1 14-5.3L20 8"/><polyline points="20 4 20 8 16 8"/><path d="M20 12a8 8 0 0 1-14 5.3L4 16"/><polyline points="4 20 4 16 8 16"/>',
  'rings': '<circle cx="9" cy="14" r="5"/><circle cx="16" cy="14" r="5"/>',
  'ripple': '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7" stroke-dasharray="2 3"/>',
  'road': '<path d="M9 3L4 21"/><path d="M15 3l5 18"/><line x1="12" y1="3" x2="12" y2="7"/><line x1="12" y1="11" x2="12" y2="15"/><line x1="12" y1="19" x2="12" y2="21"/>',
  'rocket': '<path d="M12 2c3 1 5.5 4 5.5 8.5 0 2-1 4-2 5.5l-1 3-2-1.5-2 1.5-1-3c-1-1.5-2-3.5-2-5.5C7.5 6 10 3 12 2z"/><circle cx="12" cy="9" r="1.5"/><path d="M9 16l-2.5 2.5"/><path d="M15 16l2.5 2.5"/>',
  'rotate-clockwise': '<path d="M19.5 12a7.5 7.5 0 1 1-2.3-5.4"/><polyline points="20 3 20 8 15 8"/>',
  'route': '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h6a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4h-2"/>',
  'scale': '<line x1="12" y1="3" x2="12" y2="21"/><line x1="5" y1="7" x2="19" y2="7"/><path d="M5 7l-3 6a3.5 3.5 0 0 0 6 0z"/><path d="M19 7l-3 6a3.5 3.5 0 0 0 6 0z"/>',
  'scan': '<path d="M4 8V5a1 1 0 0 1 1-1h3"/><path d="M16 4h3a1 1 0 0 1 1 1v3"/><path d="M20 16v3a1 1 0 0 1-1 1h-3"/><path d="M8 20H5a1 1 0 0 1-1-1v-3"/><line x1="5" y1="12" x2="19" y2="12"/>',
  'sparkles': '<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  'stack-2': '<polygon points="12 4 21 9 12 14 3 9"/><polyline points="3 14 12 19 21 14"/>',
  'stars': '<path d="M12 3l1.2 3.6L17 8l-3.8 1.4L12 13l-1.2-3.6L7 8l3.8-1.4z"/><path d="M18 14l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6z"/>',
  'sun': '<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4" y1="12" x2="2" y2="12"/><line x1="22" y1="12" x2="20" y2="12"/><line x1="5.6" y1="5.6" x2="4.2" y2="4.2"/><line x1="19.8" y1="19.8" x2="18.4" y2="18.4"/><line x1="5.6" y1="18.4" x2="4.2" y2="19.8"/><line x1="19.8" y1="4.2" x2="18.4" y2="5.6"/>',
  'sunrise': '<path d="M3 18h18"/><path d="M7 18a5 5 0 0 1 10 0"/><line x1="12" y1="5" x2="12" y2="9"/><line x1="5" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="19" y2="12"/><line x1="6.5" y1="7.5" x2="8" y2="9"/><line x1="17.5" y1="7.5" x2="16" y2="9"/>',
  'trophy': '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 5H5a3 3 0 0 0 3 5"/><path d="M16 5h3a3 3 0 0 1-3 5"/><line x1="12" y1="13" x2="12" y2="17"/><path d="M9 21h6"/><path d="M9.5 21c0-2 1-3 2.5-4 1.5 1 2.5 2 2.5 4"/>',
  'user': '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  'user-off': '<path d="M3 3l18 18"/><path d="M15.5 10.5A4 4 0 0 0 8.3 6.7"/><circle cx="12" cy="8" r="4" stroke-dasharray="1 2.4"/><path d="M4 21a8 8 0 0 1 12.8-6.4"/>',
  'users-group': '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20a6 6 0 0 1 12 0"/><path d="M14.5 20a5 5 0 0 1 7.5-4.3"/>',
  'wand': '<line x1="4" y1="20" x2="16" y2="8"/><path d="M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>',
  'wave-sine': '<path d="M2 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0"/>',
  'wave-square': '<path d="M2 8h4v8h4V8h4v8h4V8h4"/>',
  'wind': '<path d="M4 8h9a2.5 2.5 0 1 0-2-4"/><path d="M2 13h14a2.5 2.5 0 1 1-2 4"/><path d="M2 18h8"/>'
};

function TiIcon({ name, className = '', style = {}, ...props }) {
  const cleanName = (name || '').replace(/^ti-/, '');
  const path = ICON_PATHS[cleanName] || ICON_PATHS[name];
  if (!path) {
    return (
      <svg viewBox="0 0 24 24" className={`ti-icon ${className}`} style={{ width: '1em', height: '1em', display: 'inline-block', strokeWidth: 2, stroke: 'currentColor', fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round', ...style }} {...props}>
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className={`ti-icon ${className}`}
      style={{
        width: '1em',
        height: '1em',
        display: 'inline-block',
        strokeWidth: 2,
        stroke: 'currentColor',
        fill: 'none',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        ...style
      }}
      dangerouslySetInnerHTML={{ __html: path }}
      {...props}
    />
  );
}

const REFRAMES_FALLBACK = [
  { text: "You can love your family deeply and still feel suffocated by them.", sub: "Both things are true at the same time. Feeling burdened doesn't make you a bad son, daughter, or sibling." },
  { text: "'What will people think' is a fear, not a fact.", sub: "What people will think is almost always worse in anticipation than in reality. And most people are too busy worrying about themselves." },
  { text: "Feeling guilty for wanting something for yourself is not humility.", sub: "It's a sign that your needs were never treated as valid. That's worth examining." },
  { text: "Adjustment is not the same as acceptance.", sub: "Adjusting means swallowing what hurts and moving on. Acceptance means actually making peace with it. Most of us were taught the first and called it the second." },
  { text: "Anger often looks like silence, withdrawal, or sarcasm here — not shouting.", sub: "We learned to bend the anger into shapes that were safer to express. But it's still anger." },
  { text: "Comparison with others is a habit, not a truth.", sub: "Someone else's rank, salary, or wedding date says nothing about the validity of where you are." },
  { text: "Feeling lonely in a house full of people is one of the most common unspoken experiences there is.", sub: "Physical proximity is not the same as being seen or understood." },
  { text: "Grief isn't just for death.", sub: "You can grieve a career path you didn't take, a version of yourself that was slowly trained out of you, or a relationship that never became what you needed." },
  { text: "Duty and desire are not opposites.", sub: "Wanting something for yourself is not betrayal. The belief that they are in conflict is something we inherited, not something that is simply true." },
  { text: "Anxiety and pressure feel identical in the body.", sub: "The difference is whether the threat is real and present, or imagined and future. Most pressure we carry is future-facing." },
  { text: "Saying 'I'm fine' when you are not is a survival skill — but it has a cost.", sub: "The more often you perform okayness, the harder it becomes to locate what you actually feel." },
  { text: "Feeling responsible for your parents' happiness is a weight a lot of people carry into adulthood.", sub: "It is real. It is also not entirely yours to carry." }
];

export default function KnowledgeBankPage({ user, profile: initialProfile, onSignOut }) {
  const [activeTab, setActiveTab] = useState('explore');
  const [innerPatternTab, setInnerPatternTab] = useState('your-patterns');
  const [exploreScreen, setExploreScreen] = useState('home');
  const [activeEmotionName, setActiveEmotionName] = useState(null);

  // Database states
  const [profile, setProfile] = useState(initialProfile || null);
  const [cards, setCards] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [vocabOverview, setVocabOverview] = useState(null);
  const [patternsData, setPatternsData] = useState(null);
  const [visited, setVisited] = useState([]);
  const [resonanceData, setResonanceData] = useState({ cards: [], patterns: [] });
  const [quizHistory, setQuizHistory] = useState([]);

  // Local UI States
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [reframeIndex, setReframeIndex] = useState(0);
  const [expandedFamilies, setExpandedFamilies] = useState({});
  const [expandedPatterns, setExpandedPatterns] = useState({});
  const [expandedSituations, setExpandedSituations] = useState({});
  const [recognisedSituations, setRecognisedSituations] = useState({});

  // Slide-over Drawer card detail state
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardEvidence, setCardEvidence] = useState(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  // Dynamic Resonance Rating inputs
  const [cardResonanceScore, setCardResonanceScore] = useState(3);
  const [cardResonanceNote, setCardResonanceNote] = useState('');
  const [patternResonanceScores, setPatternResonanceScores] = useState({});
  const [patternResonanceNotes, setPatternResonanceNotes] = useState({});

  // Interactive Quiz / Assessment Engine State
  const [quizPhase, setQuizPhase] = useState('intro'); // 'intro' | 'question' | 'feedback' | 'summary'
  const [quizQuestionNumber, setQuizQuestionNumber] = useState(0);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizRecentNames, setQuizRecentNames] = useState([]);
  const [quizAnswersRecord, setQuizAnswersRecord] = useState([]);
  const [quizSummary, setQuizSummary] = useState(null);

  const patternBodyRefs = useRef({});

  // Fetch all user and dictionary data
  const loadAllData = async () => {
    try {
      const [profRes, cardsRes, relsRes, snapsRes, vocabRes, trailRes, resRes, quizRes, patternsRes] = await Promise.all([
        fetch('/api/knowledge/profile').then(r => r.json()).catch(() => ({ profile: null })),
        fetch('/api/knowledge/cards').then(r => r.json()).catch(() => ({ cards: [] })),
        fetch('/api/knowledge/relationships').then(r => r.json()).catch(() => ({ relationships: [] })),
        fetch('/api/knowledge/snapshots').then(r => r.json()).catch(() => ({ snapshots: [] })),
        fetch('/api/vocab/overview').then(r => r.json()).catch(() => ({ data: null })),
        fetch('/api/knowledge/trail').then(r => r.json()).catch(() => ({ visited: [] })),
        fetch('/api/knowledge/resonance').then(r => r.json()).catch(() => ({ cards: [], patterns: [] })),
        fetch('/api/knowledge/quiz').then(r => r.json()).catch(() => ({ history: [] })),
        fetch('/api/patterns').then(r => r.json()).catch(() => ({ patterns: [] }))
      ]);

      if (profRes.success) setProfile(profRes.profile);
      if (cardsRes.success) setCards(cardsRes.cards);
      if (relsRes.success) setRelationships(relsRes.relationships);
      if (snapsRes.success) setSnapshots(snapsRes.snapshots);
      if (vocabRes.success) setVocabOverview(vocabRes.data);
      if (trailRes.success) setVisited(trailRes.visited || []);
      if (resRes.success) setResonanceData({ cards: resRes.cards || [], patterns: resRes.patterns || [] });
      if (quizRes.success) setQuizHistory(quizRes.history || []);
      if (patternsRes.success || patternsRes.patterns) {
        setPatternsData(patternsRes);
        if (patternsRes.patterns && patternsRes.patterns.length > 0) {
          setInnerPatternTab('your-patterns');
        } else {
          setInnerPatternTab('by-pattern');
        }
      }
    } catch (err) {
      console.error('Failed to load Knowledge Bank data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Fetch card evidence on card select
  useEffect(() => {
    if (!selectedCard) {
      setCardEvidence(null);
      return;
    }
    const entries = selectedCard.supporting_entries?.join(',') || '';
    const reports = selectedCard.supporting_reports?.join(',') || '';
    if (!entries && !reports) {
      setCardEvidence({ journals: [], reports: [] });
      return;
    }

    setEvidenceLoading(true);
    fetch(`/api/knowledge/evidence?entries=${entries}&reports=${reports}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setCardEvidence(data.evidence);
      })
      .catch(e => console.error('Failed to load card evidence:', e))
      .finally(() => setEvidenceLoading(false));

    // Reset resonance form inputs for selected card
    const existing = resonanceData.cards.find(c => c.concept_id === selectedCard.id);
    if (existing) {
      setCardResonanceScore(existing.score);
      setCardResonanceNote(existing.notes || '');
    } else {
      setCardResonanceScore(3);
      setCardResonanceNote('');
    }
  }, [selectedCard, resonanceData]);

  // Compute profile insights for the Reframe Banner (High/Medium confidence)
  const profileInsights = useMemo(() => {
    if (!profile) return REFRAMES_FALLBACK;
    const keys = [
      'stress_model', 'values_model', 'relationship_model', 'decision_model', 
      'growth_model', 'communication_model', 'identity_model', 'emotion_model'
    ];
    const realInsights = keys
      .map(k => ({ key: k, model: profile[k] }))
      .filter(item => item.model && (item.model.confidence === 'High' || item.model.confidence === 'Medium'))
      .map(item => ({
        text: item.model.summary,
        sub: `Based on your written patterns in ${item.model.supporting_vocabulary?.join(', ') || 'reflection history'}.`
      }));

    return realInsights.length > 0 ? realInsights : REFRAMES_FALLBACK;
  }, [profile]);

  // Compute confidence dimensions
  const confidenceDimensions = useMemo(() => {
    if (!profile) return [];
    const keys = [
      'stress_model', 'values_model', 'relationship_model', 'decision_model', 
      'growth_model', 'communication_model', 'identity_model', 'emotion_model'
    ];
    return keys
      .map(k => ({ key: k, model: profile[k] }))
      .filter(item => item.model && (item.model.confidence === 'High' || item.model.confidence === 'Medium'));
  }, [profile]);

  // Vocabulary words derived from real Vocab Intelligence snapshots
  const userWords = useMemo(() => {
    if (!vocabOverview || !vocabOverview.allWords) return [];
    const all = vocabOverview.allWords;
    const merged = [
      ...(all.frequent || []).map(w => ({ ...w, tier: 'frequent' })),
      ...(all.occasional || []).map(w => ({ ...w, tier: 'occasional' })),
      ...(all.usedOnce || []).map(w => ({ ...w, tier: 'usedOnce' }))
    ];
    // Map words to standard dictionary or keep as custom
    return merged.map(w => {
      const norm = w.normalized_word.toLowerCase().trim();
      const stdName = Object.keys(DICTIONARY_EMOTIONS).find(k => k.toLowerCase() === norm);
      if (stdName) {
        return { name: stdName, original: w.word, isStandard: true, ...DICTIONARY_EMOTIONS[stdName] };
      }
      // Check if it's a known search synonym mapping
      const mappedEmos = WORD_INDEX[norm]?.matches || [];
      return {
        name: w.word,
        original: w.word,
        isStandard: false,
        aka: WORD_INDEX[norm]?.hint || 'discovered vocab word',
        fam: 'Custom',
        color: 'rgba(141,191,180,0.12)',
        ic: '#3A9E8A',
        icon: 'ti-sparkles',
        matches: mappedEmos
      };
    });
  }, [vocabOverview]);

  // User personal detected patterns from Pattern Engine
  const userPatterns = useMemo(() => {
    if (patternsData?.patterns && Array.isArray(patternsData.patterns) && patternsData.patterns.length > 0) {
      return patternsData.patterns;
    }
    return [];
  }, [patternsData]);

  // Active pattern names
  const activePatterns = useMemo(() => {
    const fromApi = userPatterns.map(p => p.name);
    if (fromApi.length > 0) return fromApi;
    if (!profile || !profile.pattern_model || !profile.pattern_model.referenced_nodes) return [];
    return profile.pattern_model.referenced_nodes;
  }, [userPatterns, profile]);

  // Emotional Landscape stats derived from Vocab Overview
  const emotionalLandscape = useMemo(() => {
    if (!vocabOverview) return null;
    const mostUsed = vocabOverview.mostUsed || [];
    const newWords = vocabOverview.new_words || [];
    const droppedWords = vocabOverview.dropped_words || [];
    const stats = vocabOverview.stats || { distinctWordCount: 0, entriesCount: 0 };
    return {
      frequent: mostUsed.slice(0, 4),
      emerging: newWords.slice(0, 4),
      quiet: droppedWords.slice(0, 4),
      distinctCount: stats.distinctWordCount || 0,
      entriesCount: stats.entriesCount || 0
    };
  }, [vocabOverview]);

  // Sorted situations based on active patterns and resonance
  const sortedSituations = useMemo(() => {
    const getSituationScore = (sit) => {
      return sit.patterns.reduce((total, pname) => {
        const hasPattern = activePatterns.includes(pname);
        const resRating = resonanceData.patterns.find(p => p.concept_name === pname)?.score || 0;
        let score = 0;
        if (hasPattern) score += 3;
        if (resRating >= 4) score += 2;
        return total + score;
      }, 0);
    };

    return [...SITUATIONS].sort((a, b) => getSituationScore(b) - getSituationScore(a));
  }, [activePatterns, resonanceData]);

  // Visible relationships
  const visibleRelationships = useMemo(() => {
    return relationships.filter(r => r.confidence === 'High' || r.confidence === 'Medium');
  }, [relationships]);

  // Graph connected cards logic
  const graphRelatedCards = useMemo(() => {
    if (!selectedCard) return [];
    const refs = selectedCard.referenced_nodes || [];
    if (refs.length === 0) return [];

    const neighbors = new Set();
    relationships.forEach(r => {
      const src = r.source_node.toLowerCase();
      const tgt = r.target_node.toLowerCase();
      refs.forEach(ref => {
        const lowerRef = ref.toLowerCase();
        if (src === lowerRef) neighbors.add(tgt);
        else if (tgt === lowerRef) neighbors.add(src);
      });
    });

    return cards.filter(c => {
      if (c.id === selectedCard.id) return false;
      const cRefs = c.referenced_nodes || [];
      return cRefs.some(cr => neighbors.has(cr.toLowerCase()));
    });
  }, [selectedCard, cards, relationships]);

  // Log visited concept in database trail
  const logVisit = async (name) => {
    try {
      const res = await fetch('/api/knowledge/trail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept_name: name })
      });
      const data = await res.json();
      if (data.success) {
        setVisited(data.visited);
      }
    } catch (e) {
      console.error('Failed to log exploration visit:', e);
    }
  };

  // Navigations
  const goHome = () => {
    setExploreScreen('home');
    setActiveEmotionName(null);
  };

  const goMatches = () => {
    if (searchResults) {
      setExploreScreen('matches');
    } else {
      setExploreScreen('home');
    }
  };

  const openEmotionDirect = (name) => {
    if (!DICTIONARY_EMOTIONS[name]) return;
    logVisit(name);
    setActiveEmotionName(name);
    setExploreScreen('detail');
    setActiveTab('explore');
  };

  const viewMatch = (name) => {
    if (!DICTIONARY_EMOTIONS[name]) return;
    logVisit(name);
    setActiveEmotionName(name);
    setExploreScreen('detail');
  };

  const pickSurface = (word, hint, matches) => {
    setSearchResults({
      breadcrumb: word,
      transMsg: `You said <strong>${word}</strong> — ${hint.toLowerCase()}. Here's what that might actually be underneath:`,
      list: matches,
      noMatch: false
    });
    setExploreScreen('matches');
    setActiveTab('explore');
  };

  // Free text search
  const handleSearch = async (e, queryOverride) => {
    if (e && e.preventDefault) e.preventDefault();
    const query = (typeof queryOverride === 'string' ? queryOverride : searchQuery).trim();
    if (!query) return;

    if (query !== searchQuery) {
      setSearchQuery(query);
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/knowledge/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        const { matchedEmotions } = data.results;
        if (matchedEmotions && matchedEmotions.length > 0) {
          setSearchResults({
            breadcrumb: query,
            transMsg: `Search results for "<strong>${query}</strong>" mapped in dictionary:`,
            list: matchedEmotions.map(m => m.name),
            noMatch: false
          });
        } else {
          setSearchResults({
            breadcrumb: query,
            transMsg: '',
            list: [],
            noMatch: true,
            noMatchWord: query
          });
        }
        setExploreScreen('matches');
        setActiveTab('explore');
      }
    } catch (err) {
      console.error('Failed to run keyword search:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Save Card Resonance Response
  const handleSaveCardResonance = async (cardId) => {
    try {
      const res = await fetch('/api/knowledge/resonance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept_id: cardId,
          concept_name: selectedCard?.title,
          concept_type: 'card',
          score: cardResonanceScore,
          notes: cardResonanceNote
        })
      });
      const data = await res.json();
      if (data.success) {
        // Update local resonance state
        setResonanceData(prev => {
          const cardsFiltered = prev.cards.filter(c => c.concept_id !== cardId);
          return {
            ...prev,
            cards: [...cardsFiltered, data.resonance]
          };
        });
        alert('Resonance rating and notes saved successfully.');
      }
    } catch (e) {
      console.error('Failed to save card resonance:', e);
    }
  };

  // Save Pattern Resonance Response
  const handleSavePatternResonance = async (patternName) => {
    const score = patternResonanceScores[patternName] || 3;
    const notes = patternResonanceNotes[patternName] || '';
    try {
      const res = await fetch('/api/knowledge/resonance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept_name: patternName,
          concept_type: 'pattern',
          score,
          notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setResonanceData(prev => {
          const patternsFiltered = prev.patterns.filter(p => p.concept_name !== patternName);
          return {
            ...prev,
            patterns: [...patternsFiltered, data.resonance]
          };
        });
        alert('Resonance response saved.');
      }
    } catch (e) {
      console.error('Failed to save pattern resonance:', e);
    }
  };

  // ─── Interactive Assessment Engine ───
  const shuffleArr = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  const getQuizPool = () => {
    return Object.keys(DICTIONARY_EMOTIONS).filter(n => {
      const e = DICTIONARY_EMOTIONS[n];
      return (e.rl || []).length > 0 && (e.cw || []).length > 0;
    });
  };

  const startQuiz = (forcedName) => {
    setQuizScore({ correct: 0, total: 0 });
    setQuizQuestionNumber(0);
    setQuizRecentNames([]);
    setQuizAnswersRecord([]);
    setQuizSummary(null);
    setQuizPhase('intro');
    setExploreScreen('quiz');
    setActiveTab('explore');
  };

  const beginQuizQuestions = (forcedName) => {
    setQuizPhase('question');
    buildQuizQuestion(forcedName, []);
  };

  const buildQuizQuestion = (forcedName, recentList) => {
    const pool = getQuizPool();
    if (!pool.length) {
      setCurrentQuiz(null);
      return;
    }

    let name = (forcedName && DICTIONARY_EMOTIONS[forcedName] && DICTIONARY_EMOTIONS[forcedName].rl?.length && DICTIONARY_EMOTIONS[forcedName].cw?.length) ? forcedName : null;
    if (!name) {
      const recents = recentList || quizRecentNames;
      const candidates = pool.filter(n => !recents.includes(n));
      const usable = candidates.length ? candidates : pool;
      name = usable[Math.floor(Math.random() * usable.length)];
    }

    const updatedRecents = [...(recentList || quizRecentNames), name];
    if (updatedRecents.length > 5) updatedRecents.shift();
    setQuizRecentNames(updatedRecents);

    const e = DICTIONARY_EMOTIONS[name];
    const scenario = e.rl[Math.floor(Math.random() * e.rl.length)];
    const wrongPairs = e.cw.slice(0, 3);
    const options = shuffleArr(
      [{ n: name, correct: true }].concat(wrongPairs.map(c => ({ n: c.n, correct: false, d: c.d })))
    );

    setQuizQuestionNumber(prev => prev + 1);
    setCurrentQuiz({ name, scenario, options, answered: false, picked: null, microInsight: '' });
  };

  const answerQuiz = async (idx) => {
    if (!currentQuiz || currentQuiz.answered) return;
    const pickedOption = currentQuiz.options[idx];
    const correct = pickedOption.correct;
    const newCorrectCount = quizScore.correct + (correct ? 1 : 0);
    const newTotalCount = quizScore.total + 1;

    // Generate supportive contextual micro-insight
    let microInsight = '';
    if (correct) {
      const insights = [
        "You seem to notice this pattern clearly when it happens — identifying the exact nuance makes it easier to respond intentionally.",
        "Clear discernment here. Distinguishing between surface tension and the deeper feeling creates room for genuine clarity.",
        "Spot on — recognizing subtle emotional shifts before they escalate is a valuable skill in your reflection practice."
      ];
      microInsight = insights[Math.floor(Math.random() * insights.length)];
    } else {
      const insights = [
        `That's useful context. Notice how situational pressure can make ${pickedOption.n.toLowerCase()} feel similar to ${currentQuiz.name.toLowerCase()}.`,
        `An important distinction — while both feel intense, ${currentQuiz.name.toLowerCase()} carries specific roots worth sitting with.`,
        `Interesting observation. In demanding moments, our first instinct is often to name ${pickedOption.n.toLowerCase()} before noticing ${currentQuiz.name.toLowerCase()}.`
      ];
      microInsight = insights[Math.floor(Math.random() * insights.length)];
    }

    setQuizScore({ correct: newCorrectCount, total: newTotalCount });
    setCurrentQuiz(prev => ({ ...prev, answered: true, picked: idx, microInsight }));
    setQuizPhase('feedback');

    const updatedAnswers = [...quizAnswersRecord, { concept: currentQuiz.name, picked: pickedOption.n, correct }];
    setQuizAnswersRecord(updatedAnswers);
  };

  const nextQuizQuestion = () => {
    if (quizQuestionNumber < 5) {
      setQuizPhase('question');
      buildQuizQuestion();
    } else {
      // Completed 5 questions: generate final 4-part observational analysis
      const correctRatio = quizScore.correct / Math.max(1, quizScore.total);
      let noticed = "You demonstrate thoughtful emotional reflection, taking time to explore how subtle interpersonal tensions show up.";
      let context = "This pattern appears most noticeably during moments of uncertainty or social expectations.";
      let strength = "Your reflective stance helps you recognize nuanced emotional states before they turn into prolonged reactivity.";
      let watch = "Notice if analyzing an emotion intellectually sometimes takes the place of simply allowing yourself to feel it.";

      if (correctRatio >= 0.8) {
        noticed = "You have high emotional granularity, accurately pinpointing underlying feelings even in complex social scenarios.";
        strength = "Your ability to name exact emotional states prevents ambiguity and helps you clarify personal boundaries.";
      } else if (correctRatio >= 0.5) {
        noticed = "You are developing strong discernment between reactive emotions and deeper internal feelings.";
        watch = "When situational pressure rises, notice when multiple feelings overlap before jumping to a conclusion.";
      }

      const summary = { noticed, context, strength, watch };
      setQuizSummary(summary);
      setQuizPhase('summary');

      // Persist completed assessment to database
      fetch('/api/knowledge/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept_name: 'Emotional Granularity Assessment',
          score_correct: quizScore.correct,
          score_total: quizScore.total,
          summary
        })
      })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.result) {
          setQuizHistory(prev => [data.result, ...prev]);
        }
      })
      .catch(e => console.error('Failed to log assessment result:', e));
    }
  };

  const toggleFamily = (name) => {
    setExpandedFamilies(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const togglePatternAccordion = (id) => {
    setExpandedPatterns(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSituation = (id) => {
    setExpandedSituations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRecogniseSituation = (id) => {
    setRecognisedSituations(prev => ({ ...prev, [id]: true }));
  };

  const scrollToPattern = (id) => {
    setActiveTab('patterns');
    setInnerPatternTab('by-pattern');
    setExpandedPatterns(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      const el = patternBodyRefs.current[id];
      if (el) {
        el.closest('.ptn-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ECEFF0] text-[#1E2A2E] font-sans pb-20">
        <DashboardNavbar activeTab="knowledge" />
        <main className="max-w-[680px] mx-auto px-6 pt-32 flex flex-col items-center justify-center gap-4">
          <div className="trail-spinner"></div>
          <div className="text-xs text-[#4A6A64] font-medium tracking-wider uppercase">Loading Knowledge Bank…</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f5] text-[#1E2A2E] font-sans pb-20">
      <DashboardNavbar activeTab="knowledge" />

      <div className="kb-app">
        {/* Navigation Tab Bar */}
        <div className="tab-bar" role="tablist">
          <button 
            className={`tab-btn ${activeTab === 'explore' ? 'active' : ''}`} 
            role="tab" 
            aria-selected={activeTab === 'explore'} 
            onClick={() => setActiveTab('explore')}
          >
            <TiIcon name="map-2" /> Explore
          </button>
          <button 
            className={`tab-btn ${activeTab === 'patterns' ? 'active' : ''}`} 
            role="tab" 
            aria-selected={activeTab === 'patterns'} 
            onClick={() => setActiveTab('patterns')}
          >
            <TiIcon name="arrows-shuffle" /> Patterns
          </button>
          <button 
            className={`tab-btn ${activeTab === 'trail' ? 'active' : ''}`} 
            role="tab" 
            aria-selected={activeTab === 'trail'} 
            onClick={() => setActiveTab('trail')}
          >
            <TiIcon name="route" /> Your trail
            {visited.length > 0 && <span className="trail-badge" style={{ display: 'inline-block' }}>{visited.length}</span>}
          </button>
        </div>

        <main className="content">
          {/* ======================= EXPLORE TAB ======================= */}
          {activeTab === 'explore' && (
            <div className="screen active">
              
              {/* Explorer HOME SCREEN */}
              {exploreScreen === 'home' && (
                <div className="screen active">
                  {/* Reframe Banner */}
                  {profileInsights.length > 0 && (
                    <div 
                      className="reframe-banner" 
                      onClick={() => setReframeIndex(prev => (prev + 1) % profileInsights.length)}
                      role="button" 
                      aria-label="Next insight"
                    >
                      <div className="rf-glyph">
                        <TiIcon name="bulb" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="rf-kicker">Did you know</div>
                        <div className="rf-text">{profileInsights[reframeIndex].text}</div>
                        <div className="rf-sub">{profileInsights[reframeIndex].sub}</div>
                      </div>
                      <div className="rf-meta">
                        <TiIcon name="refresh" style={{ fontSize: '14px', color: 'var(--muted-dark)' }} />
                        <span className="rf-count">{reframeIndex + 1} / {profileInsights.length}</span>
                      </div>
                    </div>
                  )}

                  {/* Personal Emotional Landscape Widget */}
                  <div className="landscape-container">
                    <div className="landscape-header">
                      <span className="landscape-title">
                        <TiIcon name="activity" style={{ color: 'var(--logo-sage)' }} />
                        Your Emotional Landscape
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--body-light)', fontWeight: 600 }}>
                        {emotionalLandscape?.distinctCount || userWords.length} active words
                      </span>
                    </div>

                    <div className="landscape-grid">
                      <div className="landscape-col">
                        <div className="landscape-col-label">
                          <TiIcon name="sparkles" style={{ color: 'var(--terracotta)' }} />
                          Frequently appearing
                        </div>
                        <div className="landscape-tags">
                          {emotionalLandscape?.frequent && emotionalLandscape.frequent.length > 0 ? (
                            emotionalLandscape.frequent.map((item, idx) => (
                              <span key={idx} className="landscape-tag" onClick={() => openEmotionDirect(item.word)}>
                                {item.word}
                                <span className="landscape-tag-freq">{item.frequency}×</span>
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--body-light)', fontStyle: 'italic' }}>Observing ongoing entries...</span>
                          )}
                        </div>
                      </div>

                      <div className="landscape-col">
                        <div className="landscape-col-label">
                          <TiIcon name="sunrise" style={{ color: 'var(--ocean-sage)' }} />
                          Recently emerging
                        </div>
                        <div className="landscape-tags">
                          {emotionalLandscape?.emerging && emotionalLandscape.emerging.length > 0 ? (
                            emotionalLandscape.emerging.map((word, idx) => (
                              <span key={idx} className="landscape-tag" onClick={() => openEmotionDirect(word)}>
                                {word}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--body-light)', fontStyle: 'italic' }}>No newly emerging words yet.</span>
                          )}
                        </div>
                      </div>

                      <div className="landscape-col">
                        <div className="landscape-col-label">
                          <TiIcon name="wind" style={{ color: 'var(--soft-iris)' }} />
                          Less present recently
                        </div>
                        <div className="landscape-tags">
                          {emotionalLandscape?.quiet && emotionalLandscape.quiet.length > 0 ? (
                            emotionalLandscape.quiet.map((word, idx) => (
                              <span key={idx} className="landscape-tag" style={{ opacity: 0.75 }}>
                                {word}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--body-light)', fontStyle: 'italic' }}>Stable register across cycles.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Your Words */}
                  <div className="eyebrow"><TiIcon name="sparkles" /> Your living vocabulary</div>
                  {userWords.length === 0 ? (
                    <div className="kb-empty-box">
                      <div className="kb-empty-icon"><TiIcon name="sparkles" /></div>
                      <div className="kb-empty-title">Your personal vocabulary is gathering</div>
                      <p className="kb-empty-text">
                        As you write in your daily journals and reflect, meaningful emotional words, state descriptions, and recurring expressions will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="your-words-list" style={{ marginBottom: '28px' }}>
                      {userWords.slice(0, 12).map((w, idx) => (
                        <div 
                          key={idx} 
                          className="your-word-card" 
                          onClick={() => {
                            if (w.isStandard) {
                              openEmotionDirect(w.name);
                            } else if (w.matches && w.matches.length > 0) {
                              pickSurface(w.original, w.aka || 'expression from your diaries', w.matches);
                            } else {
                              handleSearch(null, w.original);
                            }
                          }}
                        >
                          <div className="your-word-glyph" style={{ background: w.color }}><TiIcon name={w.icon} style={{ color: w.ic }} /></div>
                          <div className="your-word-body">
                            <div className="your-word-name">
                              {w.original}
                              {w.frequency ? <span className="yours-badge" style={{ marginLeft: '6px' }}>Used {w.frequency}×</span> : <span className="yours-badge">Yours</span>}
                            </div>
                            <div className="your-word-plain">{w.aka}</div>
                          </div>
                          <TiIcon name="chevron-right" className="match-chev" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Your Trail Chip Strip */}
                  <div className="eyebrow"><TiIcon name="route" /> Your trail</div>
                  <div className="trail-row">
                    {visited.length === 0 ? (
                      <div className="empty-trail">Nothing explored yet — start below.</div>
                    ) : (
                      visited.slice(-8).reverse().map((name, idx) => {
                        const emo = DICTIONARY_EMOTIONS[name];
                        const famColor = emo ? (FAMILIES.find(f => f.name === emo.fam)?.color || '#8DBFB4') : '#8DBFB4';
                        return (
                          <div key={idx} className="trail-chip" onClick={() => openEmotionDirect(name)}>
                            <span className="trail-chip-dot" style={{ background: famColor }}></span>
                            {name}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Test Yourself CTA Card */}
                  <div className="quiz-cta-card" onClick={() => startQuiz()}>
                    <div className="quiz-cta-glyph"><TiIcon name="flask" /></div>
                    <div className="quiz-cta-body">
                      <div className="quiz-cta-title">Test yourself — Emotional Granularity</div>
                      <div className="quiz-cta-sub">Guided micro-exploration of situational emotions with supportive observational feedback</div>
                    </div>
                    <TiIcon name="chevron-right" className="match-chev" />
                  </div>

                  {/* Mood Search */}
                  <div className="eyebrow" style={{ marginBottom: '10px' }}>
                    <TiIcon name="mood-search" /> Or find a starting word
                  </div>
                  <form onSubmit={handleSearch} className="mood-search-row">
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="mood-search-input" 
                      placeholder='Type your own word — e.g. "burnt out", "on edge", "numb"…' 
                    />
                    <button type="submit" className="mood-search-btn" aria-label="Search">
                      {searchLoading ? <TiIcon name="refresh" className="animate-spin" /> : <TiIcon name="arrow-right" />}
                    </button>
                  </form>

                  {/* Mood Split Grid */}
                  <div className="mood-split">
                    <div style={{ background: 'var(--mint-grey)', borderRadius: '12px', padding: '12px', border: '1px solid var(--border-teal)' }}>
                      <div className="mood-col-label" style={{ color: 'var(--soft-iris)' }}>
                        <TiIcon name="cloud-rain" /> Difficult
                      </div>
                      <div className="surface-grid">
                        {SURFACE.neg.map((sw, idx) => (
                          <div key={idx} className="surface-card neg" onClick={() => pickSurface(sw.word, sw.hint, sw.matches)}>
                            <div className="surface-glyph"><TiIcon name={sw.icon} /></div>
                            <div className="surface-text">
                              <span className="surface-word">{sw.word}</span>
                              <span className="surface-hint">{sw.hint}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: 'var(--mint-grey)', borderRadius: '12px', padding: '12px', border: '1px solid var(--border-teal)' }}>
                      <div className="mood-col-label" style={{ color: 'var(--ocean-sage)' }}>
                        <TiIcon name="sun" /> Positive
                      </div>
                      <div className="surface-grid">
                        {SURFACE.pos.map((sw, idx) => (
                          <div key={idx} className="surface-card pos" onClick={() => pickSurface(sw.word, sw.hint, sw.matches)}>
                            <div className="surface-glyph"><TiIcon name={sw.icon} /></div>
                            <div className="surface-text">
                              <span className="surface-word">{sw.word}</span>
                              <span className="surface-hint">{sw.hint}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* The Full Dictionary */}
                  <div className="eyebrow" style={{ marginBottom: '2px' }}>
                    <TiIcon name="layout-grid" /> The full dictionary
                  </div>
                  <div className="section-subtext">The built-in starting set — always here if you want it, whether or not it's shown up in your words yet.</div>
                  <div className="family-list">
                    {FAMILIES.map((f, fIdx) => {
                      const isExpanded = !!expandedFamilies[f.name];
                      return (
                        <div key={fIdx} className="family-row">
                          <div className="family-header" onClick={() => toggleFamily(f.name)}>
                            <div className="family-glyph" style={{ background: f.bg }}>
                              <TiIcon name={f.icon} style={{ color: f.color }} />
                            </div>
                            <div className="family-meta">
                              <div className="family-name">{f.name}</div>
                              <div className="family-desc">{f.desc}</div>
                            </div>
                            <div className="family-count">{f.emotions.length} emotions</div>
                            <TiIcon 
                              name="chevron-down" 
                              className="family-chev" 
                              style={{ transform: isExpanded ? 'rotate(180deg)' : '' }} 
                            />
                          </div>
                          <div className={`family-pills ${isExpanded ? 'open' : ''}`}>
                            {f.emotions.map((name, eIdx) => (
                              <div key={eIdx} className="emo-pill" onClick={() => openEmotionDirect(name)}>
                                {visited.includes(name) && <span className="visited-dot"></span>}
                                <span>{name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Explorer MATCHES SCREEN */}
              {exploreScreen === 'matches' && searchResults && (
                <div className="screen active">
                  <div className="back-row">
                    <button className="back-btn" onClick={goHome}><TiIcon name="arrow-left" /> Back</button>
                    <span className="breadcrumb">{searchResults.breadcrumb}</span>
                  </div>
                  <div className="trans-card">
                    {searchResults.noMatch ? (
                      <span>We don't have "<strong>{searchResults.noMatchWord}</strong>" mapped to a dictionary emotion yet.</span>
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: searchResults.transMsg }} />
                    )}
                  </div>
                  <div className="match-list">
                    {searchResults.noMatch ? (
                      <div className="no-match-box">
                        <TiIcon name="mood-search" />
                        Try a different word, or browse by family from the home screen instead.
                        <br />
                        <button className="back-btn" style={{ margin: '14px auto 0' }} onClick={goHome}>
                          <TiIcon name="arrow-left" /> Back to browse by family
                        </button>
                      </div>
                    ) : (
                      searchResults.list.map((name, idx) => {
                        const emo = DICTIONARY_EMOTIONS[name];
                        if (!emo) return null;
                        const isVisited = visited.includes(name);
                        const scenario = emo.rl && emo.rl[0];
                        return (
                          <div key={idx} className={`match-card ${isVisited ? 'visited' : ''}`} onClick={() => viewMatch(name)}>
                            <div className="match-glyph" style={{ background: emo.color }}>
                              <TiIcon name={emo.icon} style={{ color: emo.ic }} />
                            </div>
                            <div className="match-body">
                              <div className="match-name">
                                {name}
                                {isVisited && <span className="visited-badge">visited</span>}
                              </div>
                              {scenario ? (
                                <>
                                  <div className="match-scenario-tag">{scenario.s}</div>
                                  <div className="match-plain">{scenario.f}</div>
                                </>
                              ) : (
                                <div className="match-plain">{emo.aka}</div>
                              )}
                            </div>
                            <TiIcon name="chevron-right" className="match-chev" />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Explorer EMOTION DETAIL SCREEN */}
              {exploreScreen === 'detail' && activeEmotionName && DICTIONARY_EMOTIONS[activeEmotionName] && (
                <div className="screen active">
                  {(() => {
                    const e = DICTIONARY_EMOTIONS[activeEmotionName];
                    const isKnown = userWords.some(w => w.name === activeEmotionName);
                    return (
                      <div className="screen active">
                        <div className="back-row">
                          <button className="back-btn" onClick={goMatches}><TiIcon name="arrow-left" /> Back</button>
                          <span className="breadcrumb">{e.fam}</span>
                        </div>
                        <div className="edc">
                          <div className="edc-header">
                            <div className="edc-glyph" style={{ background: e.color }}>
                              <TiIcon name={e.icon} style={{ color: e.ic }} />
                            </div>
                            <div>
                              <div className="edc-name">
                                {activeEmotionName}
                                {isKnown && <span className="yours-badge" style={{ marginLeft: '6px' }}>Yours</span>}
                              </div>
                              <div className="edc-aka">{e.aka}</div>
                              <div className="depth-row">
                                <div className="depth-bars">
                                  {[1, 2, 3].map(i => (
                                    <div key={i} className={`depth-bar ${i <= e.depth ? 'filled' : ''}`}></div>
                                  ))}
                                </div>
                                <div className="depth-label">
                                  {e.depth === 1 ? 'Everyday word' : e.depth === 2 ? 'Goes a layer deeper' : 'Often left unsaid'}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="edc-body">
                            <div>
                              <div className="edc-sec-label"><TiIcon name="align-left" /> What this really is</div>
                              <div className="edc-plain">{e.plain}</div>
                            </div>

                            {e.body && e.body.length > 0 && (
                              <div>
                                <div className="edc-sec-label"><TiIcon name="activity" /> In your body</div>
                                <div className="body-tags">
                                  {e.body.map((b, i) => (
                                    <span key={i} className="signal-tag">{b}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {e.rl && e.rl.length > 0 && (
                              <div>
                                <div className="edc-sec-label"><TiIcon name="map-pin" /> Real life</div>
                                <div className="rl-grid">
                                  {e.rl.map((r, i) => (
                                    <div key={i} className="rl-card">
                                      <div className="rl-sit">{r.s}</div>
                                      {r.f}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {e.cw && e.cw.length > 0 && (
                              <div>
                                <div className="edc-sec-label"><TiIcon name="git-compare" /> Often confused with</div>
                                <div className="cw-list">
                                  {e.cw.map((c, i) => {
                                    const hasPill = !!DICTIONARY_EMOTIONS[c.n];
                                    return (
                                      <div 
                                        key={i} 
                                        className="cw-row" 
                                        onClick={() => hasPill && openEmotionDirect(c.n)}
                                        style={{ cursor: hasPill ? 'pointer' : 'default' }}
                                      >
                                        <div className="cw-body">
                                          <div className="cw-name">
                                            {c.n}
                                            {!hasPill && <span style={{ fontWeight: 400, color: 'var(--body-light)', fontSize: '10px' }}> (not in this KB)</span>}
                                          </div>
                                          <div className="cw-diff">{c.d}</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {e.patterns && e.patterns.length > 0 && (
                              <div>
                                <div className="edc-sec-label"><TiIcon name="arrows-shuffle" /> Can feed into</div>
                                <div className="pat-rows">
                                  {e.patterns.map((pn, i) => {
                                    const p = PATTERNS.find(x => x.name === pn);
                                    if (!p) return null;
                                    return (
                                      <div key={i} className="pat-row" style={{ cursor: 'pointer' }} onClick={() => scrollToPattern(p.id)}>
                                        <div className="pat-glyph" style={{ background: p.gc }}>
                                          <TiIcon name={p.icon} style={{ color: p.ic }} />
                                        </div>
                                        <div>
                                          <div className="pat-name">{p.name}</div>
                                          <div className="pat-desc">{p.sub}</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          <div style={{ padding: '0 20px 20px' }}>
                            <button className="quiz-next-btn" onClick={() => startQuiz(activeEmotionName)}>
                              <TiIcon name="flask" /> Test yourself on this word
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Explorer QUIZ / INTERACTIVE ASSESSMENT SCREEN */}
              {exploreScreen === 'quiz' && (
                <div className="screen active">
                  <div className="back-row">
                    <button className="back-btn" onClick={goHome}><TiIcon name="arrow-left" /> Back to Knowledge Hub</button>
                    <span className="breadcrumb">Emotional Granularity Exploration</span>
                  </div>

                  {/* INTRO SCREEN */}
                  {quizPhase === 'intro' && (
                    <div className="assessment-card">
                      <div className="quiz-scenario-eyebrow" style={{ color: 'var(--logo-sage)' }}>About this exploration</div>
                      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--teal-black)', margin: '8px 0 12px' }}>
                        Exploring Emotional Granularity
                      </h2>
                      <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--body-light)', marginBottom: '16px' }}>
                        This 5-question exploration examines how you differentiate subtle emotional nuances across real-world situations. There are no right or wrong judgments — our goal is to help you sharpen emotional discernment and notice what holds true in your experience.
                      </p>
                      <button 
                        className="quiz-next-btn" 
                        onClick={() => beginQuizQuestions(activeEmotionName)}
                        style={{ marginTop: '8px' }}
                      >
                        Begin Exploration <TiIcon name="arrow-right" />
                      </button>
                    </div>
                  )}

                  {/* QUESTION / FEEDBACK SCREEN */}
                  {(quizPhase === 'question' || quizPhase === 'feedback') && currentQuiz && (
                    <div id="quiz-body" className="assessment-card">
                      <div className="assessment-progress-wrap">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--body-light)' }}>
                          <span>Question {quizQuestionNumber} of 5</span>
                          <span>{5 - quizQuestionNumber} remaining</span>
                        </div>
                        <div className="assessment-progress-bar">
                          <div className="assessment-progress-fill" style={{ width: `${(quizQuestionNumber / 5) * 100}%` }} />
                        </div>
                      </div>

                      <div className="quiz-scenario-card">
                        <div className="quiz-scenario-eyebrow">The Situation</div>
                        <div className="quiz-scenario-sit">{currentQuiz.scenario.s}</div>
                        <div className="quiz-scenario-text">{currentQuiz.scenario.f}</div>
                      </div>

                      <div className="quiz-question">What descriptor best captures this underlying experience?</div>
                      <div className="quiz-options">
                        {currentQuiz.options.map((o, idx) => {
                          let cls = 'quiz-option';
                          if (currentQuiz.answered) {
                            cls += ' quiz-option-disabled';
                            if (o.correct) cls += ' quiz-option-correct';
                            else if (currentQuiz.picked === idx) cls += ' quiz-option-wrong';
                          }
                          return (
                            <button 
                              key={idx} 
                              className={cls}
                              disabled={currentQuiz.answered}
                              onClick={() => answerQuiz(idx)}
                            >
                              {o.n}
                              {currentQuiz.answered && o.correct && <TiIcon name="check-circle" className="quiz-option-icon" />}
                              {currentQuiz.answered && currentQuiz.picked === idx && !o.correct && <TiIcon name="alert-circle" className="quiz-option-icon" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Immediate Micro-Insight Acknowledgement */}
                      {quizPhase === 'feedback' && currentQuiz.answered && (
                        <div style={{ marginTop: '16px' }}>
                          <div className="assessment-micro-insight">
                            <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <TiIcon name="bulb" />
                              Observation
                            </div>
                            {currentQuiz.microInsight}
                          </div>
                          <button className="quiz-next-btn" onClick={nextQuizQuestion} style={{ marginTop: '16px' }}>
                            {quizQuestionNumber < 5 ? (
                              <>Continue to next question <TiIcon name="arrow-right" /></>
                            ) : (
                              <>View assessment findings <TiIcon name="sparkles" /></>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FINAL OBSERVATIONAL SUMMARY SCREEN */}
                  {quizPhase === 'summary' && quizSummary && (
                    <div className="assessment-summary-card">
                      <div className="quiz-scenario-eyebrow" style={{ color: 'var(--logo-sage)' }}>Assessment Result</div>
                      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--teal-black)', margin: '8px 0 6px' }}>
                        What We Noticed
                      </h2>
                      <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--body-light)', marginBottom: '16px' }}>
                        Observational feedback on your emotional granularity and situational discernment:
                      </p>

                      <div className="assessment-summary-grid">
                        <div className="assessment-summary-block">
                          <div className="assessment-summary-label"><TiIcon name="sparkles" /> Primary Observation</div>
                          <div className="assessment-summary-text">{quizSummary.noticed}</div>
                        </div>

                        <div className="assessment-summary-block">
                          <div className="assessment-summary-label"><TiIcon name="map-pin" /> When This Shows Up</div>
                          <div className="assessment-summary-text">{quizSummary.context}</div>
                        </div>

                        <div className="assessment-summary-block">
                          <div className="assessment-summary-label"><TiIcon name="award" /> A Strength</div>
                          <div className="assessment-summary-text">{quizSummary.strength}</div>
                        </div>

                        <div className="assessment-summary-block">
                          <div className="assessment-summary-label"><TiIcon name="eye" /> Something to Watch</div>
                          <div className="assessment-summary-text">{quizSummary.watch}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button className="quiz-next-btn" onClick={() => startQuiz()} style={{ flex: 1 }}>
                          Take another exploration <TiIcon name="refresh" />
                        </button>
                        <button className="back-btn" onClick={goHome} style={{ padding: '10px 18px' }}>
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================= PATTERNS TAB ======================= */}
          {activeTab === 'patterns' && (
            <div className="screen active">
              <div className="inner-tab-bar">
                <button 
                  className={`inner-tab ${innerPatternTab === 'your-patterns' ? 'active' : ''}`} 
                  onClick={() => setInnerPatternTab('your-patterns')}
                >
                  <TiIcon name="sparkles" /> Your patterns ({userPatterns.length})
                </button>
                <button 
                  className={`inner-tab ${innerPatternTab === 'by-pattern' ? 'active' : ''}`} 
                  onClick={() => setInnerPatternTab('by-pattern')}
                >
                  By pattern
                </button>
                <button 
                  className={`inner-tab ${innerPatternTab === 'by-situation' ? 'active' : ''}`} 
                  onClick={() => setInnerPatternTab('by-situation')}
                >
                  By situation
                </button>
              </div>

              {/* inner tab YOUR PATTERNS */}
              {innerPatternTab === 'your-patterns' && (
                <div id="inner-your-patterns">
                  <div className="eyebrow"><TiIcon name="sparkles" /> Patterns detected in your writing</div>
                  
                  {userPatterns.length === 0 ? (
                    <div className="kb-empty-box">
                      <div className="kb-empty-icon"><TiIcon name="sparkles" /></div>
                      <div className="kb-empty-title">We're still getting to know your patterns</div>
                      <p className="kb-empty-text">
                        As you continue writing, recurring themes, behavioral tendencies, and emotional patterns will begin to appear here.
                      </p>
                      <button className="empty-cta" onClick={() => setInnerPatternTab('by-pattern')}>
                        Explore known patterns in our library <TiIcon name="arrow-right" />
                      </button>
                    </div>
                  ) : (
                    <div className="ptn-list" style={{ marginBottom: '28px' }}>
                      {userPatterns.map((p, idx) => {
                        const ptnDef = PATTERNS.find(x => x.name.toLowerCase() === p.name.toLowerCase()) || {};
                        const isExpanded = !!expandedPatterns[p.id || idx];
                        const resVal = resonanceData.patterns.find(x => x.concept_name === p.name);
                        const statusClass = (p.status || 'present').toLowerCase();

                        return (
                          <div key={idx} className="personal-ptn-card">
                            <div className="personal-ptn-header">
                              <div>
                                <div className="personal-ptn-title-row">
                                  <span className="personal-ptn-name">{p.name}</span>
                                  <span className={`status-badge ${statusClass}`}>
                                    {p.status || 'Present'}
                                  </span>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--body-light)', marginTop: '4px' }}>
                                  {p.meta || p.orientation || ptnDef.sub || 'Recurring cognitive pattern'}
                                </div>
                              </div>
                              <button 
                                onClick={() => togglePatternAccordion(p.id || idx)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--body-light)' }}
                              >
                                <TiIcon name="chevron-down" style={{ transform: isExpanded ? 'rotate(180deg)' : '' }} />
                              </button>
                            </div>

                            <div className="personal-ptn-body">
                              {p.body || p.summary || ptnDef.desc || 'Pattern observed across writing entries.'}
                            </div>

                            <div className="personal-ptn-meta-row">
                              {p.firstAppeared && (
                                <div className="personal-ptn-meta-item">
                                  <TiIcon name="calendar" />
                                  <span>First noticed: {p.firstAppeared}</span>
                                </div>
                              )}
                              {p.totalOccurrences && (
                                <div className="personal-ptn-meta-item">
                                  <TiIcon name="activity" />
                                  <span>Observed in {p.totalOccurrences} cycles</span>
                                </div>
                              )}
                              {p.connectedPatterns && p.connectedPatterns.length > 0 && (
                                <div className="personal-ptn-meta-item">
                                  <TiIcon name="link" />
                                  <span>Connected to: {p.connectedPatterns.join(', ')}</span>
                                </div>
                              )}
                            </div>

                            {isExpanded && (
                              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-teal)' }}>
                                {ptnDef.signs && (
                                  <div style={{ marginBottom: '12px' }}>
                                    <div className="ptn-sec">Common signs</div>
                                    <div className="signs-text">{ptnDef.signs}</div>
                                  </div>
                                )}
                                {ptnDef.actions && ptnDef.actions.length > 0 && (
                                  <div>
                                    <div className="ptn-sec">What you can try</div>
                                    <div className="action-list">
                                      {ptnDef.actions.map((act, aIdx) => (
                                        <div key={aIdx} className="action-row">
                                          <span className="action-num">{aIdx + 1}</span>
                                          <span>{act}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Resonance Block */}
                                <div className="trail-resonance" style={{ borderTop: '1px solid var(--border-teal)', marginTop: '16px', paddingTop: '16px' }}>
                                  {resVal ? (
                                    <div className="trail-resonance-saved">
                                      <TiIcon name="check" /> Resonance: <strong>{resVal.score}/5</strong>
                                      {resVal.notes ? ` · "${resVal.notes}"` : ''}
                                    </div>
                                  ) : (
                                    <>
                                      <div className="trail-resonance-label">Does this resonate with you?</div>
                                      <div className="trail-slider-labels">
                                        <span>Not really</span>
                                        <span>Strongly</span>
                                      </div>
                                      <div className="trail-slider-wrap">
                                        <input 
                                          type="range" 
                                          min="1" 
                                          max="5" 
                                          value={patternResonanceScores[p.name] || 3} 
                                          onChange={e => setPatternResonanceScores(prev => ({ ...prev, [p.name]: parseInt(e.target.value) }))}
                                          className="trail-slider" 
                                        />
                                        <span className="trail-slider-val">{patternResonanceScores[p.name] || 3}</span>
                                      </div>
                                      <textarea 
                                        className="trail-note" 
                                        placeholder="What specifically feels true? (optional)" 
                                        rows={2}
                                        value={patternResonanceNotes[p.name] || ''}
                                        onChange={e => setPatternResonanceNotes(prev => ({ ...prev, [p.name]: e.target.value }))}
                                      />
                                      <button className="trail-resonance-save" onClick={() => handleSavePatternResonance(p.name)}>
                                        Save resonance
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* inner tab BY PATTERN (Educational Catalog) */}
              {innerPatternTab === 'by-pattern' && (
                <div id="inner-by-pattern">
                  <div className="eyebrow"><TiIcon name="layout-grid" /> All known patterns</div>
                  <div className="section-subtext">The complete educational library of behavioral and cognitive patterns.</div>
                  
                  <div className="ptn-list">
                    {PATTERNS.map((p, idx) => {
                      const isExpanded = !!expandedPatterns[p.id];
                      const isDetected = activePatterns.includes(p.name);
                      return (
                        <div key={idx} className="ptn-card">
                          <div className="ptn-header" onClick={() => togglePatternAccordion(p.id)}>
                            <div className="ptn-left">
                              <div className="ptn-glyph" style={{ background: p.gc }}>
                                <TiIcon name={p.icon} style={{ color: p.ic }} />
                              </div>
                              <div>
                                <div className="ptn-title">
                                  {p.name}
                                  {isDetected && <span className="yours-badge" style={{ marginLeft: '6px' }}>Detected in you</span>}
                                </div>
                                <div className="ptn-sub">{p.sub}</div>
                              </div>
                            </div>
                            <TiIcon 
                              name="chevron-down" 
                              className="ptn-chev" 
                              style={{ transform: isExpanded ? 'rotate(180deg)' : '' }} 
                            />
                          </div>
                          <div className={`ptn-body ${isExpanded ? 'open' : ''}`}>
                            <div>
                              <div className="ptn-sec">What this looks like</div>
                              <div className="ptn-desc">{p.desc}</div>
                            </div>
                            {p.signs && (
                              <div>
                                <div className="ptn-sec">Common signs</div>
                                <div className="signs-text">{p.signs}</div>
                              </div>
                            )}
                            {p.emotions && p.emotions.length > 0 && (
                              <div>
                                <div className="ptn-sec">Often shows up with</div>
                                <div className="tag-row">
                                  {p.emotions.map((emName, eIdx) => (
                                    <span key={eIdx} className="tag-item" onClick={() => openEmotionDirect(emName)}>
                                      {emName}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {p.actions && p.actions.length > 0 && (
                              <div>
                                <div className="ptn-sec">What you can try</div>
                                <div className="action-list">
                                  {p.actions.map((act, aIdx) => (
                                    <div key={aIdx} className="action-row">
                                      <span className="action-num">{aIdx + 1}</span>
                                      <span>{act}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* inner tab BY SITUATION */}
              {innerPatternTab === 'by-situation' && (
                <div id="inner-by-situation">
                  <div className="sit-list">
                    {sortedSituations.map((s, idx) => {
                      const hasAISignal = s.patterns.some(p => activePatterns.includes(p));
                      const isRecognised = recognisedSituations[s.id];
                      const isExpanded = !!expandedSituations[s.id];

                      let cardClass = 'sit-card';
                      let badge = null;
                      if (isRecognised) {
                        cardClass += ' sit-recognised';
                        badge = (
                          <div style={{ marginBottom: '4px' }}>
                            <span className="sit-recognised-badge">You recognised this</span>
                          </div>
                        );
                      } else if (hasAISignal) {
                        cardClass += ' sit-featured';
                        badge = (
                          <div style={{ marginBottom: '4px' }}>
                            <span className="sit-featured-badge">Showing up for you</span>
                          </div>
                        );
                      }

                      return (
                        <div key={idx} className={cardClass}>
                          <div className="sit-header" onClick={() => toggleSituation(s.id)}>
                            <div className="sit-glyph" style={{ background: s.gc }}>
                              <TiIcon name={s.glyph} style={{ color: s.ic }} />
                            </div>
                            <div className="sit-meta">
                              {badge}
                              <div className="sit-title">{s.title}</div>
                              <div className="sit-hint">{s.hint}</div>
                            </div>
                            <TiIcon 
                              name="chevron-down" 
                              className="sit-chev" 
                              style={{ transform: isExpanded ? 'rotate(180deg)' : '' }} 
                            />
                          </div>
                          <div className={`sit-body ${isExpanded ? 'open' : ''}`}>
                            <div className="sit-desc">{s.desc}</div>
                            <div>
                              <div className="sit-sec">Patterns behind this</div>
                              <div className="sit-pattern-pills">
                                {s.patterns.map((pname, pIdx) => {
                                  const p = PATTERNS.find(x => x.name === pname);
                                  return (
                                    <div key={pIdx} className="sit-pattern-pill" onClick={() => p && scrollToPattern(p.id)}>
                                      <TiIcon 
                                        name={p ? p.icon : 'circle'} 
                                        className="sit-pattern-pill-icon" 
                                        style={{ color: p ? p.ic : '#888' }} 
                                      />
                                      {pname}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <div>
                              <div className="sit-sec">What you can try</div>
                              <div className="sit-what-rows">
                                {s.what.map((w, wIdx) => (
                                  <div key={wIdx} className="sit-what-row">
                                    <span className="sit-what-num">{wIdx + 1}</span>
                                    <span>{w}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {!isRecognised ? (
                              <div style={{ marginTop: '12px' }}>
                                <button className="trail-resonance-save" onClick={() => handleRecogniseSituation(s.id)}>
                                  <TiIcon name="check" /> I recognise this in myself
                                </button>
                              </div>
                            ) : (
                              <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--ocean-sage)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <TiIcon name="check-circle" /> You recognised this
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* ======================= TRAIL TAB ======================= */}
          {activeTab === 'trail' && (
            <div className="screen active">
              
              {/* Trail analysis overview banner */}
              <div className="trail-analysis-banner">
                <span className="trail-analysis-title">Your Trail Analysis</span>
                <p className="trail-analysis-quote">
                  "We trace the emotional language, patterns, and growth markers appearing in your writing over time."
                </p>
                <div className="trail-stats-grid">
                  <div className="trail-stat-card">
                    <span className="trail-stat-label">Active Lexicon</span>
                    <span className="trail-stat-value">{userWords.length} words</span>
                  </div>
                  <div className="trail-stat-card">
                    <span className="trail-stat-label">Milestones Tracked</span>
                    <span className="trail-stat-value">{snapshots.length} summaries</span>
                  </div>
                </div>
              </div>

              {/* Visited Emotions */}
              <div className="trail-section-label">Visited emotions</div>
              <div className="trail-row" style={{ marginBottom: '28px' }}>
                {visited.length === 0 ? (
                  <div className="empty-trail">No emotions visited in this session yet. Explore emotions in the Explore tab.</div>
                ) : (
                  visited.slice().reverse().map((name, idx) => {
                    const emo = DICTIONARY_EMOTIONS[name];
                    const famColor = emo ? (FAMILIES.find(f => f.name === emo.fam)?.color || '#8DBFB4') : '#8DBFB4';
                    return (
                      <div key={idx} className="trail-chip" onClick={() => openEmotionDirect(name)}>
                        <span className="trail-chip-dot" style={{ background: famColor }}></span>
                        {name}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Recent Discoveries (Knowledge Cards) */}
              <div className="trail-section-label">Recent discoveries</div>
              <div className="discoveries-grid">
                {cards.map((c, idx) => (
                  <div 
                    key={idx} 
                    className="discovery-card"
                    onClick={() => setSelectedCard(c)}
                  >
                    <div>
                      <span className="discovery-tag">
                        {c.card_type.replace('_', ' ')}
                      </span>
                      <h4 className="discovery-title">{c.title}</h4>
                      <p className="discovery-body">{c.body || c.content}</p>
                    </div>
                    <div className="discovery-footer">
                      <span>View details & reflect</span>
                      <TiIcon name="chevron-right" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Saved Insights & Reflection Notes */}
              <div className="trail-section-label">Saved Insights & Notes</div>
              <div className="saved-insights-wrap">
                {resonanceData.cards.length === 0 && resonanceData.patterns.length === 0 ? (
                  <div className="your-words-empty">No saved insights yet. Rate how cards or patterns resonate with you to save them.</div>
                ) : (
                  [
                    ...resonanceData.cards.map(c => ({ ...c, label: 'Knowledge Card' })),
                    ...resonanceData.patterns.map(p => ({ ...p, label: 'Behavioral Pattern' }))
                  ].map((item, idx) => (
                    <div key={idx} className="saved-insight-card">
                      <div className="saved-insight-header">
                        <span className="saved-insight-tag">{item.label}</span>
                        <span className="saved-insight-score">{item.score}/5 Resonance</span>
                      </div>
                      <h5 className="saved-insight-title">{item.concept_name}</h5>
                      {item.notes && (
                        <p className="saved-insight-notes">
                          "{item.notes}"
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Quiz History Logs */}
              <div className="trail-section-label">Quiz history</div>
              <div className="quiz-history-wrap">
                {quizHistory.length === 0 ? (
                  <div className="your-words-empty">No quiz attempts logged yet. Test yourself from the Explore screen!</div>
                ) : (
                  quizHistory.map((q, idx) => (
                    <div key={idx} className="quiz-history-card">
                      <div className="quiz-history-meta">
                        <span className="quiz-history-label">Concept Tested</span>
                        <span className="quiz-history-concept">{q.concept_name}</span>
                      </div>
                      <div className="quiz-history-stats">
                        <span className="quiz-history-score">{q.score_correct} / {q.score_total} correct</span>
                        <span className="quiz-history-date">
                          {new Date(q.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Depth Path / Emotional Progression Graph */}
              <div className="trail-section-label">Your Depth Path</div>
              <div className="depth-path-card">
                <p className="depth-path-intro">Dynamic progress showing which categories and depths of emotions you've visited:</p>
                
                <div className="family-list">
                  {Object.entries(DEPTH_MAP).map(([fam, nodes], idx) => {
                    const color = FAMILY_COLORS[fam] || '#8DBFB4';
                    const activeNodes = nodes.filter(n => visited.includes(n.name));
                    if (activeNodes.length === 0) return null;

                    return (
                      <div key={idx} className="depth-path-row">
                        <div className="depth-path-family-header" style={{ color }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, display: 'inline-block', marginRight: '6px' }}></span>
                          {fam}
                        </div>
                        <div className="depth-path-track-list">
                          {nodes.map((node, nIdx) => {
                            const isVis = visited.includes(node.name);
                            return (
                              <React.Fragment key={nIdx}>
                                {nIdx > 0 && (
                                  <div className={`depth-path-connection-line ${isVis && visited.includes(nodes[nIdx - 1].name) ? 'active' : ''}`} style={{ color }}></div>
                                )}
                                <div 
                                  onClick={() => openEmotionDirect(node.name)}
                                  className="depth-path-node-item"
                                >
                                  <div 
                                    className={`depth-path-node-dot ${isVis ? 'active' : ''}`} 
                                    style={{ color: isVis ? color : undefined }}
                                  ></div>
                                  <span className={`depth-path-node-name ${isVis ? 'active' : ''}`}>
                                    {node.name}
                                  </span>
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </main>
      </div>

      {/* Slide-over Drawer for Card Detail */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
          <div className="absolute inset-0 bg-[#1E2A2E]/60 backdrop-blur-xs" onClick={() => setSelectedCard(null)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30, 42, 46, 0.6)', backdropFilter: 'blur(2px)' }} />

          <div className="absolute inset-y-0 right-0 max-w-full pl-10 flex" style={{ position: 'absolute', top: 0, bottom: 0, right: 0, display: 'flex' }}>
            <div className="w-screen max-w-md bg-white shadow-xl flex flex-col" style={{ width: '100vw', maxWidth: '420px', display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Header */}
              <div className="px-6 py-5 border-b border-[#1E2A2E]/10 flex items-center justify-between bg-[#ECEFF0]" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-teal)', background: 'var(--mint-grey)' }}>
                <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button 
                    onClick={() => setSelectedCard(null)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--body-light)', display: 'flex', alignItems: 'center' }}
                  >
                    <TiIcon name="arrow-left" style={{ fontSize: '18px' }} />
                  </button>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4A6A64]">
                    Knowledge Card
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedCard(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', color: 'var(--body-light)', letterSpacing: '0.04em', textTransform: 'uppercase' }}
                >
                  Close
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="space-y-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit block bg-[#ECEFF0] text-[#1E2A2E]">
                    {selectedCard.card_type.replace('_', ' ')}
                  </span>
                  <h2 className="text-lg font-bold text-[#1E2A2E] leading-snug">{selectedCard.title}</h2>
                  {selectedCard.subtitle && (
                    <p className="text-xs text-[#4A6A64] font-medium leading-relaxed italic border-l-2 border-[#E0A898]/40 pl-3" style={{ borderLeft: '3px solid var(--terracotta)', paddingLeft: '12px' }}>
                      "{selectedCard.subtitle}"
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] block">Observation</span>
                  <p className="text-xs text-[#1E2A2E] leading-relaxed">{selectedCard.body || selectedCard.content}</p>
                </div>

                {/* Evidence View */}
                <div className="space-y-3 pt-4 border-t border-[#1E2A2E]/5" style={{ borderTop: '1px solid var(--border-teal)', paddingTop: '16px' }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] block">Why am I seeing this?</span>
                  
                  {evidenceLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--body-light)' }}>
                      <TiIcon name="refresh" className="animate-spin" />
                      <span>Resolving writing excerpts...</span>
                    </div>
                  ) : cardEvidence ? (
                    <div className="space-y-3" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {cardEvidence.journals.map((e, idx) => (
                        <div key={idx} className="p-3 bg-[#ECEFF0]/60 border border-[#1E2A2E]/5 rounded-xl space-y-1" style={{ background: 'rgba(236,239,240,0.6)', border: '1px solid var(--border-teal)', borderRadius: '12px', padding: '12px' }}>
                          <span className="text-[9px] text-[#4A6A64] uppercase block font-bold">Your Writing Excerpt</span>
                          <p className="text-xs text-[#1E2A2E] font-serif italic">"{e.text}"</p>
                          <span className="text-[9px] text-[#4A6A64] block" style={{ marginTop: '4px' }}>Day {e.cycle_day}</span>
                        </div>
                      ))}
                      {cardEvidence.reports.map((r, idx) => (
                        <div key={idx} className="p-3 bg-[#ECEFF0]/60 border border-[#1E2A2E]/5 rounded-xl space-y-1" style={{ background: 'rgba(236,239,240,0.6)', border: '1px solid var(--border-teal)', borderRadius: '12px', padding: '12px' }}>
                          <span className="text-[9px] text-[#4A6A64] uppercase block font-bold">Weekly Report theme</span>
                          <h5 className="text-xs font-semibold text-[#1E2A2E]">{r.title}</h5>
                          <p className="text-xs text-[#4A6A64] line-clamp-3">"{r.text}"</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Related Cards */}
                {graphRelatedCards.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-[#1E2A2E]/5" style={{ borderTop: '1px solid var(--border-teal)', paddingTop: '16px' }}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] block">Related Knowledge Cards</span>
                    <div className="space-y-2">
                      {graphRelatedCards.map((rc, idx) => (
                        <div 
                          key={idx}
                          onClick={() => setSelectedCard(rc)}
                          className="p-3 bg-[#ECEFF0]/50 hover:bg-[#ECEFF0] rounded-xl border border-[#1E2A2E]/5 cursor-pointer flex items-center justify-between"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(236,239,240,0.5)', border: '1px solid var(--border-teal)', borderRadius: '12px', cursor: 'pointer' }}
                        >
                          <div>
                            <h5 className="text-xs font-bold text-[#1E2A2E]">{rc.title}</h5>
                            <span className="text-[9px] text-[#4A6A64] uppercase">{rc.card_type.replace('_', ' ')}</span>
                          </div>
                          <TiIcon name="chevron-right" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resonance Form */}
                <div className="trail-resonance" style={{ borderTop: '1px solid var(--border-teal)', marginTop: '16px', paddingTop: '16px' }}>
                  <div className="trail-resonance-label">Does this observation feel true to you?</div>
                  <div className="trail-slider-labels">
                    <span>Not really</span>
                    <span>Strongly</span>
                  </div>
                  <div className="trail-slider-wrap">
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      value={cardResonanceScore}
                      onChange={e => setCardResonanceScore(parseInt(e.target.value))}
                      className="trail-slider" 
                    />
                    <span className="trail-slider-val">{cardResonanceScore}</span>
                  </div>
                  <textarea 
                    className="trail-note" 
                    placeholder="Write down any notes or reflections about this..." 
                    rows={3}
                    value={cardResonanceNote}
                    onChange={e => setCardResonanceNote(e.target.value)}
                  />
                  <button className="trail-resonance-save" onClick={() => handleSaveCardResonance(selectedCard.id)}>
                    Save rating & note
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const DEPTH_MAP = {
  "Sadness": [{ name: "Sadness", depth: 1 }, { name: "Loneliness", depth: 2 }, { name: "Grief", depth: 3 }],
  "Fear": [{ name: "Anxiety", depth: 1 }, { name: "Overwhelm", depth: 2 }, { name: "Fear", depth: 3 }],
  "Anger": [{ name: "Frustration", depth: 1 }, { name: "Anger", depth: 1 }, { name: "Resentment", depth: 3 }],
  "Shame": [{ name: "Guilt", depth: 2 }, { name: "Shame", depth: 3 }, { name: "Remorse", depth: 3 }],
  "Joy": [{ name: "Excitement", depth: 1 }, { name: "Joy", depth: 1 }, { name: "Contentment", depth: 1 }, { name: "Gratitude", depth: 2 }],
  "Warmth": [{ name: "Relief", depth: 1 }, { name: "Pride", depth: 2 }, { name: "Love", depth: 3 }],
  "Peace": [{ name: "Anticipation", depth: 1 }, { name: "Hope", depth: 2 }, { name: "Awe", depth: 3 }, { name: "Serenity", depth: 3 }]
};

const FAMILY_COLORS = {
  "Sadness": "#378ADD",
  "Fear": "#7F77DD",
  "Anger": "#E24B4A",
  "Shame": "#D85A30",
  "Joy": "#639922",
  "Warmth": "#E07B3A",
  "Peace": "#3A9E8A"
};
