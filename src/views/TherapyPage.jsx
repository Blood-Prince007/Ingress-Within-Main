import React, {useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  MessageCircle,
  Phone,
  ShieldCheck,
  Users,
} from 'lucide-react';

/*
 * Ingress Within — Therapy intake
 * Based on the supplied intake_conversational.html prototype.
 *
 * This file is the frontend implementation only.
 * Production persistence, server-side AI, clinical triage and booking must
 * remain backend-controlled. The therapist roster below is illustrative
 * prototype data and must not be treated as a production clinical directory.
 */

const CONCERNS = [
  'Overthinking',
  'Anxiety',
  'Low mood',
  'Stress',
  'Burnout',
  'Relationship issues',
  'Family issues',
  'Career stress',
  'Academic stress',
  'Self-confidence',
  'Loneliness',
  'Anger',
  'Grief',
  'Sleep problems',
  'Low motivation',
  'Emotional overwhelm',
  'Identity',
  'Trauma / PTSD',
  'Other',
];

const LIFE_AREAS = [
  'Family',
  'Romantic Relationship',
  'Work/Career',
  'Studies',
  'Physical Health',
  'Finances',
  'Self-confidence',
  'Future/Uncertainty',
];

const SATISFACTION_AREAS = [
  'Sleep',
  'Energy',
  'Physical Health',
  'Work/Studies',
  'Relationships',
  'Family',
  'Daily Routine',
  'Self-confidence',
];

const SUPPORT_AREAS = [
  'I have someone I can talk to.',
  'I feel understood by people close to me.',
  'I feel emotionally supported in daily life.',
];

const SCENARIOS_1 = [
  ['sit1', 'Someone doesn’t reply to your message.', [
    'They’re probably busy',
    'I keep checking my phone',
    'I think I did something wrong',
    'I stop messaging',
  ]],
  ['sit2', 'You make a mistake.', [
    'I fix it and move on',
    'I keep thinking about it',
    'I become very critical of myself',
    'I avoid similar situations',
  ]],
  ['sit3', 'Someone criticizes your work.', [
    'I listen and improve',
    'I defend myself',
    'I feel bad for days',
    'I avoid showing my work again',
  ]],
  ['sit4', 'You have an important deadline.', [
    'I start early',
    'I delay until pressure builds',
    'I keep planning but don’t start',
    'I feel overwhelmed',
  ]],
];

const SCENARIOS_2 = [
  ['sit5', 'At a family gathering…', [
    'I feel comfortable',
    'I stay quiet',
    'I feel judged',
    'I want to leave early',
  ]],
  ['sit6', 'Someone compliments you.', [
    'I accept it',
    'I think they don’t mean it',
    'I feel awkward',
    'I dismiss it',
  ]],
  ['sit7', 'When I have free time…', [
    'I relax',
    'I feel guilty',
    'I scroll endlessly',
    'I don’t know what to do',
  ]],
  ['sit8', 'Thinking about the future…', [
    'I feel hopeful',
    'I feel uncertain',
    'I feel stuck',
    'I avoid thinking about it',
  ]],
];

const THERAPISTS = [
  {
    id: 't1',
    name: 'Dr. Ananya Iyer',
    credentials: 'PhD Clinical Psychology',
    experienceYears: 9,
    state: 'Gujarat',
    city: 'Ahmedabad',
    gender: 'Female',
    formats: ['Telehealth', 'In-person'],
    specialties: ['Relationship issues', 'Grief', 'Family issues'],
    modalities: ['Psychodynamic', 'Attachment-focused', 'Emotionally Focused Therapy'],
    fee: 1200,
    capacity: { current: 7, max: 9 },
    availability: 'Tue/Thu evenings',
    traumaExpertise: true,
    bio: 'Works with individuals and couples navigating loss, family friction and relationship concerns.',
  },
  {
    id: 't2',
    name: 'Rohan Mehta',
    credentials: 'MSc Counselling Psychology',
    experienceYears: 6,
    state: 'Maharashtra',
    city: 'Mumbai',
    gender: 'Male',
    formats: ['Telehealth'],
    specialties: ['Anxiety', 'Career stress', 'Burnout'],
    modalities: ['Somatic', 'Acceptance & Commitment Therapy', 'Existential'],
    fee: 800,
    capacity: { current: 9, max: 10 },
    availability: 'Mon/Wed mornings',
    traumaExpertise: false,
    bio: 'Works mostly with professionals dealing with burnout, anxiety and work pressure.',
  },
  {
    id: 't3',
    name: 'Dr. Priya Nair',
    credentials: 'PhD Family Therapy',
    experienceYears: 11,
    state: 'Karnataka',
    city: 'Bengaluru',
    gender: 'Female',
    formats: ['Telehealth', 'In-person'],
    specialties: ['Family issues', 'Loneliness', 'Identity'],
    modalities: ['Family Systems', 'Interpersonal/Relational', 'Psychodynamic'],
    fee: 1500,
    capacity: { current: 5, max: 8 },
    availability: 'Weekday afternoons',
    traumaExpertise: true,
    bio: 'Specialises in family dynamics, expectations, identity and relationship concerns.',
  },
  {
    id: 't4',
    name: 'Kabir Singh',
    credentials: 'MA Psychotherapy',
    experienceYears: 5,
    state: 'Gujarat',
    city: 'Ahmedabad',
    gender: 'Male',
    formats: ['Telehealth', 'In-person'],
    specialties: ['Stress', 'Sleep problems', 'Emotional overwhelm'],
    modalities: ['Somatic', 'Existential'],
    fee: 600,
    capacity: { current: 6, max: 6 },
    availability: 'Fri/Sat',
    traumaExpertise: false,
    bio: 'Works with stress, sleep concerns and emotional overwhelm.',
  },
  {
    id: 't5',
    name: 'Dr. Meera Rao',
    credentials: 'PhD Clinical Psychology',
    experienceYears: 8,
    state: 'Delhi',
    city: 'New Delhi',
    gender: 'Female',
    formats: ['Telehealth'],
    specialties: ['Relationship issues', 'Low mood', 'Grief'],
    modalities: ['Emotionally Focused Therapy', 'Attachment-focused', 'Family Systems'],
    fee: 1000,
    capacity: { current: 4, max: 9 },
    availability: 'Tue/Fri evenings',
    traumaExpertise: true,
    bio: 'Works with relationship concerns, bereavement and low mood.',
  },
  {
    id: 't6',
    name: 'Ananya Rao',
    credentials: 'MSc Psychology',
    experienceYears: 4,
    state: 'Karnataka',
    city: 'Bengaluru',
    gender: 'Female',
    formats: ['Telehealth', 'In-person'],
    specialties: ['Career stress', 'Overthinking', 'Self-confidence'],
    modalities: ['CBT'],
    fee: 900,
    capacity: { current: 3, max: 8 },
    availability: 'Weekday mornings',
    traumaExpertise: false,
    bio: 'Works with young professionals and students dealing with overthinking and self-confidence.',
  },
  {
    id: 't7',
    name: 'Sana Kapoor',
    credentials: 'MA Clinical Psychology',
    experienceYears: 5,
    state: 'Maharashtra',
    city: 'Mumbai',
    gender: 'Female',
    formats: ['Telehealth'],
    specialties: ['Anxiety', 'Academic stress', 'Overthinking'],
    modalities: ['CBT', 'Acceptance & Commitment Therapy'],
    fee: 450,
    capacity: { current: 8, max: 10 },
    availability: 'Weekday evenings',
    traumaExpertise: false,
    bio: 'Works with students and early-career clients managing exam pressure and anxiety.',
  },
  {
    id: 't8',
    name: 'Vikram Nair',
    credentials: 'MA Counselling',
    experienceYears: 7,
    state: 'Gujarat',
    city: 'Ahmedabad',
    gender: 'Male',
    formats: ['Telehealth', 'In-person'],
    specialties: ['Anger', 'Low motivation', 'Identity'],
    modalities: ['Acceptance & Commitment Therapy', 'Existential'],
    fee: 700,
    capacity: { current: 5, max: 7 },
    availability: 'Weekday mornings',
    traumaExpertise: false,
    bio: 'Works with low motivation, feeling stuck and anger.',
  },
];

const CSS = `
.iw{min-height:100vh;background:#f4f1ec;color:#263238;padding:32px 20px 60px}
.iw *{box-sizing:border-box}
.iw-shell,.iw-flow{max-width:980px;margin:auto}
.iw-flow{max-width:760px}
.iw-top,.iw-flowhead{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:24px}
.iw-k{color:#7b6a72;text-transform:uppercase;letter-spacing:.18em;font-size:10px;font-weight:700;margin-bottom:8px}
.iw h1{font-family:Georgia,'Times New Roman',serif;font-size:clamp(30px,5vw,44px);font-weight:400;line-height:1.12;margin:0 0 12px}
.iw h2{font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;line-height:1.2;margin:0 0 10px;color:#263238}
.iw h3{font-family:Georgia,'Times New Roman',serif;font-weight:400;color:#263238;margin:0 0 10px}
.iw p{color:#66747a;line-height:1.65}
.iw-lede{font-size:16px;max-width:700px}
.iw-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:28px}
.iw-card{background:#fff;border:1px solid rgba(38,50,56,.10);border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(38,50,56,.04)}
.iw-journey{min-height:300px;display:flex;flex-direction:column}
.iw-journey p{font-size:14px;flex:1}
.iw-icon{width:44px;height:44px;border-radius:12px;background:rgba(38,50,56,.05);color:#263238;display:flex;align-items:center;justify-content:center;margin-bottom:18px}
.iw-back,.iw-primary,.iw-secondary,.iw-option{border-radius:12px;padding:11px 14px;font:inherit;cursor:pointer}
.iw-back,.iw-secondary{background:#fff;color:#263238;border:1px solid rgba(38,50,56,.10)}
.iw-back{display:flex;align-items:center;gap:7px;color:#66747a}
.iw-primary{background:#263238;color:#fff;border:1px solid #263238;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;width:100%;transition:background .2s}
.iw-primary:hover{background:#2A3A3E}
.iw-primary:disabled{opacity:.45;cursor:not-allowed}
.iw-secondary{display:flex;align-items:center;justify-content:center;width:100%}
.iw-progress{height:5px;background:rgba(38,50,56,.10);border-radius:99px;overflow:hidden;margin-bottom:24px}
.iw-progress>div{height:100%;background:#263238;transition:width .2s}
.iw-optiongrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.iw-option{text-align:left;background:#fff;border:1px solid rgba(38,50,56,.10);color:#263238}
.iw-option:hover{border-color:rgba(38,50,56,.25)}
.iw-option.selected{border-color:#263238;background:rgba(38,50,56,.05)}
.iw-field{margin:0 0 18px}
.iw-field label{display:block;color:#263238;font-size:13px;font-weight:600;margin-bottom:7px}
.iw-field input,.iw-field textarea,.iw-field select{width:100%;background:#fff;color:#263238;border:1px solid rgba(38,50,56,.10);border-radius:12px;padding:12px;font:inherit;outline:none}
.iw-field textarea{min-height:110px;resize:vertical}
.iw-nav{display:flex;gap:12px;margin-top:22px}
.iw-nav>*{flex:1}
.iw-note{margin-top:20px;padding:14px 16px;border:1px solid rgba(38,50,56,.10);border-radius:12px;background:#fff;color:#66747a;font-size:13px;line-height:1.55}
.iw-safety{border:1px solid #ead8b8;background:#fff8ea;color:#76552d;border-radius:12px;padding:14px;font-size:13px;line-height:1.55;margin-bottom:18px}
.iw-safety strong{display:block;margin-bottom:5px;color:#5e482a}
.iw-danger{border-color:#d99a86;background:#fbefeb;color:#75402f}
.iw-success{text-align:center}
.iw-successicon{width:54px;height:54px;border-radius:50%;background:rgba(38,50,56,.05);color:#263238;margin:0 auto 16px;display:flex;align-items:center;justify-content:center}
.iw-summary{background:#f8f6f2;border:1px solid rgba(38,50,56,.10);border-radius:12px;padding:12px;margin:18px 0;text-align:left}
.iw-row{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid rgba(38,50,56,.08);font-size:13px}
.iw-row:last-child{border:0}
.iw-row span{color:#66747a}
.iw-row strong{color:#263238;text-align:right}
.iw-chat{max-height:390px;overflow:auto;display:flex;flex-direction:column;gap:12px;margin-bottom:15px}
.iw-bubble{max-width:82%;padding:12px 14px;border-radius:15px;line-height:1.55;font-size:14px}
.iw-bot{background:#f4f1ec;border:1px solid rgba(38,50,56,.08);color:#66747a}
.iw-user{align-self:flex-end;background:#263238;border:1px solid #263238;color:#fff}
.iw-chatinput{display:flex;gap:8px}
.iw-chatinput input{flex:1}
.iw-chatinput button{width:55px}
.iw-table{width:100%;border-collapse:collapse;font-size:13px}
.iw-table td{padding:9px 0;border-bottom:1px solid rgba(38,50,56,.08);vertical-align:top}
.iw-table td:first-child{color:#66747a;width:42%}
.iw-match{border:1px solid rgba(38,50,56,.12);border-radius:14px;padding:16px;margin-top:12px;background:#fff;cursor:pointer}
.iw-match.selected{border-color:#263238;background:#f8f6f2}
.iw-matchhead{display:flex;gap:12px;align-items:flex-start}
.iw-avatar{width:42px;height:42px;border-radius:50%;background:rgba(38,50,56,.07);display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-size:18px;flex:none}
.iw-matchname{font-weight:700;color:#263238}
.iw-tags{font-size:12px;color:#66747a;line-height:1.55;margin-top:3px}
.iw-fit{font-size:12px;color:#263238;margin-top:9px;line-height:1.5}
.iw-check{margin-left:auto;width:20px;height:20px;border:1px solid rgba(38,50,56,.2);border-radius:50%;flex:none}
.iw-match.selected .iw-check{background:#263238;box-shadow:inset 0 0 0 5px #fff}
.iw-grid5{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}
.iw-scale-label{font-size:11px;color:#66747a;margin-bottom:7px}
.iw-section{padding-top:4px;margin-bottom:24px}
.iw-section+.iw-section{border-top:1px solid rgba(38,50,56,.08);padding-top:22px}
.iw-error{color:#8d3e2d;font-size:12px;margin-top:7px}
@media(max-width:800px){
  .iw-grid,.iw-optiongrid{grid-template-columns:1fr}
  .iw-card{padding:20px}
  .iw-grid5{grid-template-columns:repeat(2,1fr)}
}
`;

function Option({ children, selected, onClick, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`iw-option${selected ? ' selected' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Header({ name, step, total, onBack }) {
  return (
    <>
      <div className="iw-flowhead">
        <button type="button" className="iw-back" onClick={onBack}>
          <ArrowLeft size={15} /> Back
        </button>
        <span style={{ color: '#9fb0c2', fontSize: 13 }}>{name} · {step}/{total}</span>
      </div>
      <div className="iw-progress">
        <div style={{ width: `${Math.min(100, (step / total) * 100)}%` }} />
      </div>
    </>
  );
}

function Safety({ value, setValue, allowEmergencyExit = true }) {
  const set = (key, next) => setValue((current) => ({ ...current, [key]: next }));
  const immediate =
    value.physical === 'Yes' ||
    (value.answer === 'Yes' && (
      value.recency === 'Today or this week' ||
      value.plan === 'Yes' ||
      value.attempt === 'Yes'
    ));

  if (value.needSupport === 'Yes') {
    return (
      <div className="iw-safety iw-danger">
        <strong><ShieldCheck size={16} style={{ verticalAlign: '-3px' }} /> Please get support now</strong>
        <div>
          If you feel you may act on thoughts of harming yourself or someone else, or you are
          in immediate danger, please contact emergency support rather than continuing this intake.
        </div>
        <div style={{ marginTop: 10 }}>
          <strong>Tele-MANAS: 14416 / 1-800-891-4416</strong>
          <br />
          <span>For immediate danger in India, call 112.</span>
        </div>
        {allowEmergencyExit && (
          <div className="iw-note" style={{ marginTop: 12 }}>
            This intake intentionally stops here when immediate support is needed.
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="iw-safety">
        <strong><ShieldCheck size={16} style={{ verticalAlign: '-3px' }} /> Safety check</strong>
        <div>
          We ask everyone these questions. This is not a diagnosis or emergency service.
          If you are in immediate danger, contact emergency support.
        </div>
      </div>

      <div className="iw-field">
        <label>
          In the past few months, have you had any thoughts of hopelessness, of not wanting to be
          here, or of harming yourself?
        </label>
        <div className="iw-optiongrid">
          {['No', 'Yes', 'Prefer not to say'].map((item) => (
            <Option key={item} selected={value.answer === item} onClick={() => set('answer', item)}>
              {item}
            </Option>
          ))}
        </div>
      </div>

      {value.answer === 'Yes' && (
        <>
          <div className="iw-field">
            <label>Do you need support right now?</label>
            <div className="iw-optiongrid">
              {['No, I’m okay to continue', 'Yes'].map((item) => (
                <Option
                  key={item}
                  selected={value.needSupport === (item === 'Yes' ? 'Yes' : 'No')}
                  onClick={() => set('needSupport', item === 'Yes' ? 'Yes' : 'No')}
                >
                  {item}
                </Option>
              ))}
            </div>
          </div>

          {value.needSupport !== 'Yes' && (
            <>
              <div className="iw-field">
                <label>How recently?</label>
                <div className="iw-optiongrid">
                  {['Today or this week', 'This month', 'A few months ago'].map((item) => (
                    <Option key={item} selected={value.recency === item} onClick={() => set('recency', item)}>
                      {item}
                    </Option>
                  ))}
                </div>
              </div>

              <div className="iw-field">
                <label>Do you have a specific plan, or access to a way to act on these thoughts?</label>
                <div className="iw-optiongrid">
                  {['Yes', 'No', 'Prefer not to say'].map((item) => (
                    <Option key={item} selected={value.plan === item} onClick={() => set('plan', item)}>
                      {item}
                    </Option>
                  ))}
                </div>
              </div>

              <div className="iw-field">
                <label>Have you ever made an attempt to harm yourself before?</label>
                <div className="iw-optiongrid">
                  {['Yes', 'No', 'Prefer not to say'].map((item) => (
                    <Option key={item} selected={value.attempt === item} onClick={() => set('attempt', item)}>
                      {item}
                    </Option>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      <div className="iw-field">
        <label>
          One more, unrelated to the above, that we ask everyone: is anyone currently putting
          your physical safety at risk — for example, violence at home?
        </label>
        <div className="iw-optiongrid">
          {['No', 'Yes', 'Prefer not to say'].map((item) => (
            <Option key={item} selected={value.physical === item} onClick={() => set('physical', item)}>
              {item}
            </Option>
          ))}
        </div>
      </div>

      <div className="iw-field">
        <label>
          Are you currently under psychiatric care for a serious mental health condition, or have
          you been hospitalized for a mental health reason in the past year?
        </label>
        <div className="iw-optiongrid">
          {['No', 'Yes'].map((item) => (
            <Option key={item} selected={value.psych === item} onClick={() => set('psych', item)}>
              {item}
            </Option>
          ))}
        </div>
      </div>

      {immediate && (
        <div className="iw-safety iw-danger">
          <strong>Additional support may be needed</strong>
          <div>
            Based on these answers, the intake should be reviewed by a human care/clinical team
            before algorithmic therapist matching.
          </div>
        </div>
      )}
    </>
  );
}

function Conversation({ exit }) {
  const [step, setStep] = useState(0);
  const [therapySessionId, setTherapySessionId] = useState(null);
  const [input, setInput] = useState('');
  const [contact, setContact] = useState({
    name: '',
    email: '',
    phone: '',
    consent: false,
  });
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: 'Hi. We can take this at your pace. What’s been weighing on you lately?',
    },
  ]);
  const [safety, setSafety] = useState({});
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionError, setSessionError] = useState('');

  const createSession = async () => {
    if (therapySessionId) return therapySessionId;

    try {
      setSessionError('');

      const response = await fetch('/api/therapy/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journeyType: 'conversation',
          metadata: { source: 'therapy_conversation' },
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create therapy session');
      }

      const sessionId = data?.session?.id || data?.id;
      if (!sessionId) {
        throw new Error('Therapy session ID was not returned');
      }

      setTherapySessionId(sessionId);
      return sessionId;
    } catch (error) {
      console.error('Therapy session creation failed:', error);
      setSessionError(error instanceof Error ? error.message : 'Unable to start therapy session');
      return null;
    }
  };

  useEffect(() => {
    createSession();
  }, []);

  const saveIntake = async (sessionId = therapySessionId) => {
    if (!sessionId) return false;

    const response = await fetch('/api/therapy/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        therapySessionId: sessionId,
        fullName: contact.name.trim(),
        email: contact.email.trim(),
        phoneNumber: contact.phone.trim(),
        consents: {
          intake: contact.consent,
        },
        contactPreferences: {
          email: contact.email.trim(),
          phone: contact.phone.trim(),
        },
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || 'Failed to save therapy intake');
    }

    return true;
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const sessionId = therapySessionId || await createSession();
    if (!sessionId) return;

    setInput('');
    setLoading(true);

    setMessages((items) => [...items, { from: 'user', text }]);

    try {
      const response = await fetch('/api/therapy/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapySessionId: sessionId,
          role: 'user',
          content: text,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save therapy message');
      }

      const assistantText =
        'Thank you for sharing that. Can you tell me a little more about when you notice this most strongly?';

      setMessages((items) => [...items, { from: 'bot', text: assistantText }]);

      const assistantResponse = await fetch('/api/therapy/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapySessionId: sessionId,
          role: 'assistant',
          content: assistantText,
        }),
      });

      const assistantData = await assistantResponse.json().catch(() => ({}));
      if (!assistantResponse.ok) {
        console.error('Assistant message save failed:', assistantData?.error);
      }
    } catch (error) {
      console.error('Therapy message save failed:', error);
      setMessages((items) => [
        ...items,
        {
          from: 'bot',
          text: 'I’m having trouble saving this message right now. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const saveSafety = async (sessionId = therapySessionId) => {
    if (!sessionId) return false;

    const answer = safety.answer;
    const safetyStatus =
      answer === 'Yes'
        ? 'positive'
        : answer === 'Prefer not to say'
          ? 'declined'
          : answer === 'No'
            ? 'negative'
            : 'not_assessed';

    const triageLevel =
      safety.physical === 'Yes' ||
      (answer === 'Yes' &&
        (safety.recency === 'Today or this week' ||
          safety.plan === 'Yes' ||
          safety.attempt === 'Yes'))
        ? 'immediate'
        : answer === 'Yes' || answer === 'Prefer not to say' || safety.psych === 'Yes'
          ? 'priority'
          : 'standard';

    const response = await fetch('/api/therapy/safety', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        therapySessionId: sessionId,
        safetyStatus,
        triageLevel,
        recentTiming: safety.recency || null,
        planOrMeans: safety.plan || null,
        priorAttempt: safety.attempt || null,
        physicalSafety: safety.physical || null,
        psychiatricCare: safety.psych || null,
        answers: safety,
        evaluatedBy: 'deterministic',
        evaluationMetadata: { source: 'therapy_conversation_frontend' },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to save safety assessment');
    }

    return true;
  };

  const submitTherapyIntake = async () => {
    const sessionId = therapySessionId || await createSession();
    if (!sessionId) return false;

    try {
      await saveIntake(sessionId);
      await saveSafety(sessionId);

      const response = await fetch('/api/therapy/submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapySessionId: sessionId,
          submissionType: 'conversation',
          payload: {
            messageCount: messages.length,
            contactProvided: Boolean(contact.name || contact.email || contact.phone),
            safetyProvided: Boolean(safety.answer || safety.physical || safety.psych),
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to submit therapy intake');
      }

      return true;
    } catch (error) {
      console.error('Therapy intake submission failed:', error);
      setSessionError(error instanceof Error ? error.message : 'Unable to submit therapy intake');
      return false;
    }
  };

  const goNext = async () => {
    if (loading) return;

    if (step === 2) {
      if (!contact.name.trim() || !contact.email.trim() || !contact.phone.trim() || !contact.consent) {
        setSessionError('Please complete your contact details and consent before continuing.');
        return;
      }

      setLoading(true);
      try {
        const sessionId = therapySessionId || await createSession();
        if (!sessionId) return;
        await saveIntake(sessionId);
        setSessionError('');
        setStep(3);
      } catch (error) {
        console.error('Therapy intake save failed:', error);
        setSessionError(error instanceof Error ? error.message : 'Unable to save intake details');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 4) {
      if (!safety.answer || !safety.physical || !safety.psych) {
        setSessionError('Please complete the safety questions before continuing.');
        return;
      }

      if (
        safety.answer === 'Yes' &&
        safety.needSupport !== 'Yes' &&
        (!safety.recency || !safety.plan || !safety.attempt)
      ) {
        setSessionError('Please complete the remaining safety questions before continuing.');
        return;
      }

      setLoading(true);
      try {
        const sessionId = therapySessionId || await createSession();
        if (!sessionId) return;
        await saveSafety(sessionId);
        setSessionError('');
        setStep(5);
      } catch (error) {
        console.error('Safety save failed:', error);
        setSessionError(error instanceof Error ? error.message : 'Unable to save safety assessment');
      } finally {
        setLoading(false);
      }
      return;
    }

    setSessionError('');
    setStep((value) => Math.min(6, value + 1));
  };

  const finish = async () => {
    if (loading) return;

    setLoading(true);
    setSessionError('');

    try {
      const submitted = await submitTherapyIntake();
      if (submitted) setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="iw-flow">
        <Header name="Talk it through" step={7} total={7} onBack={exit} />
        <div className="iw-card iw-success">
          <div className="iw-successicon"><Check /></div>
          <h2>Your intake is complete</h2>
          <p>
            Your conversation and safety information are ready for the next care-team step.
            In production, the AI brief and approved triage/matching services run on the server.
          </p>
          <button type="button" className="iw-primary" onClick={exit}>Back to Therapy</button>
        </div>
      </div>
    );
  }

  return (
    <div className="iw-flow">
      <Header
        name="Talk it through"
        step={step + 1}
        total={7}
        onBack={step ? () => setStep(step - 1) : exit}
      />

      <div className="iw-card">
        {step === 0 && (
          <>
            <div className="iw-k">Talk it through</div>
            <h2>Start with a conversation</h2>
            <p>
              Share what has been on your mind in a guided conversational experience.
              Take it at your own pace.
            </p>
            <div className="iw-note">
              This is an intake conversation, not a diagnosis or emergency service.
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="iw-k">Before we start</div>
            <h2>A quick age check</h2>
            <p>This therapy intake is currently designed for adults 18 and over.</p>
            <div className="iw-optiongrid">
              <Option onClick={() => setStep(2)}>I am 18 or older</Option>
              <Option onClick={() => setStep(0)}>I am under 18</Option>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="iw-k">Before we begin</div>
            <h2>A few things to confirm</h2>
            <div className="iw-field">
              <label>Full name</label>
              <input
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
              />
            </div>
            <div className="iw-field">
              <label>Email</label>
              <input
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
              />
            </div>
            <div className="iw-field">
              <label>Phone number</label>
              <input
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              />
            </div>
            <label style={{ display: 'flex', gap: 9, fontSize: 13, color: '#263238' }}>
              <input
                type="checkbox"
                checked={contact.consent}
                onChange={(e) => setContact({ ...contact, consent: e.target.checked })}
              />
              I understand this intake prepares information for therapist matching and does not diagnose or treat a condition.
            </label>
          </>
        )}

        {step === 3 && (
          <>
            <div className="iw-k">Conversation</div>
            <h2>Let’s talk it through</h2>
            <div className="iw-chat">
              {messages.map((message, index) => (
                <div
                  key={`${message.from}-${index}`}
                  className={`iw-bubble ${message.from === 'bot' ? 'iw-bot' : 'iw-user'}`}
                >
                  {message.text}
                </div>
              ))}
            </div>
            <div className="iw-chatinput">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send();
                }}
                disabled={loading || !therapySessionId}
                placeholder={therapySessionId ? 'Write what has been on your mind...' : 'Starting secure session...'}
              />
              <button
                type="button"
                className="iw-primary"
                onClick={send}
                disabled={loading || !therapySessionId}
              >
                {loading ? '…' : '→'}
              </button>
            </div>
            <div className="iw-note">
              Production note: the browser must not call Anthropic directly. The real AI conversation belongs behind the server API.
            </div>
            {therapySessionId && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#78909c' }}>
                Secure therapy session connected
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <div className="iw-k">Safety</div>
            <h2>One more thing, for your safety</h2>
            <Safety value={safety} setValue={setSafety} />
          </>
        )}

        {step === 5 && (
          <>
            <div className="iw-k">Preparing your intake</div>
            <h2>What happens next</h2>
            <p>
              In the production journey, the conversation is converted into an approved
              pre-session brief and reviewed through the appropriate safety/triage path.
            </p>
            <div className="iw-note">
              No diagnosis is generated by this frontend. Therapist recommendations should only use the approved backend matching service.
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <div className="iw-k">Ready</div>
            <h2>Review and finish</h2>
            <div className="iw-summary">
              <div className="iw-row"><span>Name</span><strong>{contact.name || '—'}</strong></div>
              <div className="iw-row"><span>Contact</span><strong>{contact.phone || contact.email || '—'}</strong></div>
              <div className="iw-row"><span>Safety</span><strong>{safety.answer || '—'}</strong></div>
            </div>
          </>
        )}

        {sessionError && <div className="iw-error">{sessionError}</div>}

        <div className="iw-nav">
          <button
            type="button"
            className="iw-secondary"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={loading}
          >
            Back
          </button>

          {step < 6 ? (
            <button
              type="button"
              className="iw-primary"
              onClick={goNext}
              disabled={loading}
            >
              {loading ? 'Saving…' : 'Continue'}
            </button>
          ) : (
            <button
              type="button"
              className="iw-primary"
              onClick={finish}
              disabled={loading}
            >
              {loading ? 'Submitting…' : 'Finish'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Guided({ exit }) {
  const total = 17;
  const [step, setStep] = useState(1);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [therapySessionId, setTherapySessionId] = useState(null);
  const [safety, setSafety] = useState({});
  const [loading, setLoading] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [consents, setConsents] = useState([false, false, false, false]);
  const [d, setD] = useState({
    name: '', email: '', phone: '',
    age: '', gender: '', genderOther: '',
    occupation: '', occupationOther: '', city: '', living: '', livingOther: '',
    reason: '', concerns: [], concernSeverity: {}, concernsOther: '',
    bodySignal: '', duration: '',
    lifeArea: {}, ownWords: '',
    talked: [], priorTherapy: '', stopped: [], stoppedOther: '',
    medication: '', prescribed: '', diagnosed: '', currentSupport: '',
    satisfaction: {}, coping: '', copingOther: '', support: {},
    scenarios: {}, improve: [], worry: '',
    therapistGender: '', budget: '', frequency: '',
    styleStructure: '', stylePace: '', styleLead: '', termApproach: '',
    finalNotes: '',
  });
  
  const createSession = async () => {
    try {
      setSessionError('');

      const response = await fetch('/api/therapy/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journeyType: 'guided',
          metadata: { source: 'therapy_guided' },
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error || 'Failed to create therapy session'
        );
      }

      const sessionId = data?.session?.id || data?.id;

      if (!sessionId) {
        throw new Error('Therapy session ID was not returned');
      }

      setTherapySessionId(sessionId);
      return sessionId;
    } catch (error) {
      console.error('Guided therapy session creation failed:', error);
      setSessionError(
        error instanceof Error
          ? error.message
          : 'Unable to start guided therapy session'
      );
      return null;
    }
  };

  useEffect(() => {
    createSession();
  }, []);

  const set = (key, value) => setD((current) => ({ ...current, [key]: value }));
  const toggle = (key, value, max) => {
    setD((current) => {
      const currentValues = current[key] || [];
      const next = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : currentValues.length >= max
          ? currentValues
          : [...currentValues, value];
      return { ...current, [key]: next };
    });
  };

  const setGrid = (key, row, value) => {
    setD((current) => ({
      ...current,
      [key]: { ...current[key], [row]: value },
    }));
  };

  const valid = useMemo(() => {
    if (step === 3) return d.name && d.email && d.phone && consents.every(Boolean);
    if (step === 4) return d.age && d.gender && (d.gender !== 'Self-describe' || d.genderOther) &&
      d.occupation && (d.occupation !== 'Other' || d.occupationOther) && d.city &&
      d.living && (d.living !== 'Other' || d.livingOther);
    if (step === 5) return d.reason && d.concerns.length && d.concerns.every((c) => d.concernSeverity[c]) &&
      (d.concerns.includes('Other') ? d.concernsOther : true) && d.bodySignal && d.duration;
    if (step === 6) return LIFE_AREAS.every((area) => d.lifeArea[area]) && d.ownWords.trim();
    if (step === 7) return d.talked.length && d.priorTherapy && d.medication && d.diagnosed && d.currentSupport &&
      (!['1–3 sessions', '4–10 sessions', '10+ sessions'].includes(d.priorTherapy) || d.stopped.length) &&
      (!['Currently taking', 'Took in the past', 'Prescribed but didn’t take'].includes(d.medication) || d.prescribed);
    if (step === 8) return SATISFACTION_AREAS.every((area) => d.satisfaction[area]);
    if (step === 9) return d.coping && SUPPORT_AREAS.every((area) => d.support[area]);
    if (step === 10) return safety.answer && safety.physical && safety.psych &&
      (safety.answer !== 'Yes' || (safety.needSupport !== 'Yes' && safety.recency && safety.plan && safety.attempt));
    if (step === 11 || step === 12) return SCENARIOS_1.concat(SCENARIOS_2).slice(step === 11 ? 0 : 4, step === 11 ? 4 : 8).every(([key]) => d.scenarios[key]);
    if (step === 13) return d.improve.length && d.worry && d.therapistGender && d.budget && d.frequency &&
      d.styleStructure && d.stylePace && d.styleLead && d.termApproach;
    if (step === 16) return !!selectedTherapist;
    return true;
  }, [step, d, safety, consents, selectedTherapist]);

  const triageTier = useMemo(() => {
    if (safety.physical === 'Yes' || safety.answer === 'Yes' && (
      safety.plan === 'Yes' || safety.attempt === 'Yes' || safety.recency === 'Today or this week'
    )) return 'immediate';
    if (safety.answer === 'Yes' || safety.answer === 'Prefer not to say' || safety.psych === 'Yes') return 'priority';
    return 'standard';
  }, [safety]);

  const matches = useMemo(() => {
    if (triageTier !== 'standard') return [];
    const maxBudget = {
      'Under ₹500': 500,
      '₹500–1000': 1000,
      '₹1000–1500': 1500,
      '₹1500+': Infinity,
    }[d.budget] ?? Infinity;

    const selectedConcerns = d.concerns.map((c) => c === 'Other' ? d.concernsOther : c);
    return THERAPISTS
      .filter((t) => t.capacity.current < t.capacity.max)
      .filter((t) => !d.city || t.city.toLowerCase() !== d.city.trim().toLowerCase())
      .filter((t) => !d.therapistGender || d.therapistGender === 'No preference' || t.gender === d.therapistGender)
      .filter((t) => !selectedConcerns.includes('Trauma / PTSD') || t.traumaExpertise)
      .map((t) => {
        const concernHits = selectedConcerns.filter((c) => t.specialties.includes(c)).length;
        const budgetFit = t.fee <= maxBudget ? 1 : 0;
        const genderFit = d.therapistGender === 'No preference' ? 0.5 : (t.gender === d.therapistGender ? 1 : 0);
        const score = Math.round((concernHits * 45) + (budgetFit * 35) + (genderFit * 20));
        return { ...t, score, concernHits };
      })
      .filter((t) => t.concernHits > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [d, triageTier]);

  const ensureSession = async () => {
    if (therapySessionId) return therapySessionId;
    return createSession();
  };

  const saveGuidedIntake = async (sessionId) => {
    const response = await fetch('/api/therapy/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        therapySessionId: sessionId,
        fullName: d.name.trim(),
        email: d.email.trim(),
        phoneNumber: d.phone.trim(),
        age: d.age,
        gender: d.gender === 'Self-describe' ? d.genderOther : d.gender,
        occupation: d.occupation === 'Other' ? d.occupationOther : d.occupation,
        city: d.city.trim(),
        livingSituation: d.living === 'Other' ? d.livingOther : d.living,
        presentingReason: d.reason,
        concerns: {
          selected: d.concerns,
          other: d.concernsOther,
          severity: d.concernSeverity,
          bodySignal: d.bodySignal,
          duration: d.duration,
        },
        affectedLifeAreas: d.lifeArea,
        ownWords: d.ownWords.trim(),
        mentalHealthHistory: {
          talked: d.talked,
          priorTherapy: d.priorTherapy,
          stopped: d.stopped,
          stoppedOther: d.stoppedOther,
          medication: d.medication,
          prescribed: d.prescribed,
          diagnosed: d.diagnosed,
          currentSupport: d.currentSupport,
        },
        copingAndSupport: {
          coping: d.coping,
          copingOther: d.copingOther,
          support: d.support,
        },
        expectations: {
          improve: d.improve,
          worry: d.worry,
          therapistGender: d.therapistGender,
          budget: d.budget,
          frequency: d.frequency,
          styleStructure: d.styleStructure,
          stylePace: d.stylePace,
          styleLead: d.styleLead,
          termApproach: d.termApproach,
          finalNotes: d.finalNotes,
        },
        contactPreferences: {
          email: d.email.trim(),
          phone: d.phone.trim(),
        },
        consents,
        answers: {
          satisfaction: d.satisfaction,
          scenarios: d.scenarios,
        },
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data?.error || 'Failed to save guided therapy intake'
      );
    }

    return data;
  };

  const saveGuidedSafety = async (sessionId) => {
    const answer = safety.answer;

    const safetyStatus =
      answer === 'Yes'
        ? 'positive'
        : answer === 'Prefer not to say'
          ? 'declined'
          : answer === 'No'
            ? 'negative'
            : 'not_assessed';

    const triageLevel =
      safety.physical === 'Yes' ||
      (answer === 'Yes' &&
        (
          safety.recency === 'Today or this week' ||
          safety.plan === 'Yes' ||
          safety.attempt === 'Yes'
        ))
        ? 'immediate'
        : answer === 'Yes' ||
          answer === 'Prefer not to say' ||
          safety.psych === 'Yes'
          ? 'priority'
          : 'standard';

    const response = await fetch('/api/therapy/safety', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        therapySessionId: sessionId,
        safetyStatus,
        triageLevel,
        recentTiming: safety.recency || null,
        planOrMeans: safety.plan || null,
        priorAttempt: safety.attempt || null,
        physicalSafety: safety.physical || null,
        psychiatricCare: safety.psych || null,
        answers: safety,
        evaluatedBy: 'deterministic',
        evaluationMetadata: {
          source: 'therapy_guided_frontend',
        },
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data?.error || 'Failed to save guided safety assessment'
      );
    }

    return data;
  };

  const saveGuidedMatches = async (sessionId) => {
    if (triageTier !== 'standard') return;

    const payload = matches.map((therapist, index) => ({
      therapistAccountId: null,
      matchStatus: selectedTherapist?.id === therapist.id
        ? 'selected'
        : 'candidate',
      matchRank: index + 1,
      matchScore: therapist.score,
      matchReasons: [
        therapist.concernHits > 0
          ? `${therapist.concernHits} concern specialization match(es)`
          : null,
        therapist.fee <= ({
          'Under ₹500': 500,
          '₹500–1000': 1000,
          '₹1000–1500': 1500,
          '₹1500+': Infinity,
        }[d.budget] ?? Infinity)
          ? 'Within selected budget'
          : 'Outside selected budget',
        d.therapistGender === 'No preference'
          ? 'No gender preference'
          : therapist.gender === d.therapistGender
            ? 'Matches therapist gender preference'
            : null,
      ].filter(Boolean),
      matchingMetadata: {
        source: 'therapy_guided_prototype',
        prototypeTherapistId: therapist.id,
        city: therapist.city,
        formats: therapist.formats,
        specialties: therapist.specialties,
        modalities: therapist.modalities,
        availability: therapist.availability,
      },
    }));

    if (!payload.length) return;

    const response = await fetch('/api/therapy/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        matches: payload,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data?.error || 'Failed to save therapist matches'
      );
    }

    return data;
  };

  const submitGuided = async () => {
    const sessionId = await ensureSession();

    if (!sessionId) return false;

    await saveGuidedIntake(sessionId);
    await saveGuidedSafety(sessionId);

    if (triageTier === 'standard') {
      await saveGuidedMatches(sessionId);
    }

    const response = await fetch('/api/therapy/submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        therapySessionId: sessionId,
        submissionType: 'guided',
        payload: {
          selectedTherapistPrototypeId: selectedTherapist?.id || null,
          selectedTherapistName: selectedTherapist?.name || null,
          triageLevel: triageTier,
          matchCount: matches.length,
        },
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data?.error || 'Failed to submit guided therapy intake'
      );
    }

    return true;
  };

  const next = async () => {
    if (loading) return;

    if (step === 10 && safety.needSupport === 'Yes') return;

    setLoading(true);
    setSessionError('');

    try {
      const sessionId = await ensureSession();

      if (!sessionId) return;

      // Save the complete intake before the summary/matching stage.
      if (step === 13) {
        await saveGuidedIntake(sessionId);
      }

      // Safety is persisted immediately after the safety step.
      if (step === 10) {
        await saveGuidedSafety(sessionId);
      }

      // Persist the prototype shortlist when the user enters the matching step.
      if (step === 15 && triageTier === 'standard') {
        await saveGuidedMatches(sessionId);
      }

      if (step === 15 && triageTier !== 'standard') {
        setStep(17);
        return;
      }

      setStep((value) => Math.min(total - 1, value + 1));
    } catch (error) {
      console.error('Guided therapy step save failed:', error);
      setSessionError(
        error instanceof Error
          ? error.message
          : 'Unable to save your therapy intake'
      );
    } finally {
      setLoading(false);
    }
  };

  const previous = () => {
    if (loading) return;

    if (step === 17 && triageTier !== 'standard') {
      setStep(13);
      return;
    }

    setStep((value) => Math.max(1, value - 1));
  };

  const finish = async () => {
    if (loading) return;

    setLoading(true);
    setSessionError('');

    try {
      const submitted = await submitGuided();

      if (submitted) {
        setStep(17);
      }
    } catch (error) {
      console.error('Guided therapy submission failed:', error);
      setSessionError(
        error instanceof Error
          ? error.message
          : 'Unable to submit your therapy intake'
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === 17) {
    return (
      <div className="iw-flow">
        <Header name="Guided form" step={17} total={17} onBack={exit} />
        <div className="iw-card iw-success">
          <div className="iw-successicon"><Check /></div>
          {selectedTherapist ? (
            <>
              <h2>You’re all set</h2>
              <p>Your selected therapist preference has been recorded for the next booking/review step.</p>
              <div className="iw-summary">
                <div className="iw-row"><span>Therapist</span><strong>{selectedTherapist.name}</strong></div>
                <div className="iw-row"><span>Availability</span><strong>{selectedTherapist.availability}</strong></div>
                <div className="iw-row"><span>Fee</span><strong>₹{selectedTherapist.fee}/session</strong></div>
              </div>
            </>
          ) : (
            <>
              <h2>Your intake is ready for review</h2>
              <p>
                Because of the safety information provided, this prototype does not show an
                algorithmic therapist match. A human care/clinical review comes first.
              </p>
            </>
          )}
          <div className="iw-note">
            Prototype only: final booking, therapist communication and clinical review must be handled by the production backend/team.
          </div>
          <button type="button" className="iw-primary" onClick={exit}>Back to Therapy</button>
        </div>
      </div>
    );
  }

  return (
    <div className="iw-flow">
      <Header name="Guided form" step={step} total={17} onBack={step === 1 ? exit : previous} />
      <div className="iw-card">
        {step === 1 && (
          <>
            <div className="iw-k">Guided form</div>
            <h2>Mental Health Intake Form</h2>
            <p>Estimated time: 12–15 minutes, across 6 short sections. Please answer honestly — there are no right or wrong answers.</p>
            <div className="iw-note">
              This covers your background, current concerns and impact on daily life, mental health history,
              everyday functioning, scenarios and therapy preferences.
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="iw-k">Before we start</div>
            <h2>A quick age check</h2>
            <p>This intake is currently designed for adults 18 and over.</p>
            <div className="iw-optiongrid">
              <Option onClick={() => setStep(3)}>I am 18 or older</Option>
              <Option onClick={() => setStep(1)}>I am under 18</Option>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="iw-k">Before we begin</div>
            <h2>A few things to confirm</h2>
            <p>Please read and check each of these — they matter.</p>
            {[
              'I understand this form prepares a summary for therapist matching — it does not diagnose or treat any condition.',
              'I understand my therapist will form their own independent clinical assessment.',
              'I consent to my answers being stored securely and shared only with the therapist I choose to book.',
              'I understand this is not a crisis service and I will contact emergency/helpline support if I am in crisis.',
            ].map((text, index) => (
              <label key={text} style={{ display: 'flex', gap: 9, marginBottom: 13, fontSize: 13, color: '#263238' }}>
                <input
                  type="checkbox"
                  checked={consents[index]}
                  onChange={(e) => {
                    const nextConsents = [...consents];
                    nextConsents[index] = e.target.checked;
                    setConsents(nextConsents);
                  }}
                />
                {text}
              </label>
            ))}
            <div className="iw-field">
              <label>Full name</label>
              <input value={d.name} onChange={(e) => set('name', e.target.value)} placeholder="Your name" />
            </div>
            <div className="iw-field">
              <label>Email</label>
              <input type="email" value={d.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="iw-field">
              <label>Phone number</label>
              <input value={d.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Your phone number" />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="iw-k">Section A</div>
            <h2>About you</h2>
            <div className="iw-field"><label>Age</label><input value={d.age} onChange={(e) => set('age', e.target.value)} placeholder="Your age" /></div>
            <div className="iw-field">
              <label>Gender</label>
              <div className="iw-optiongrid">
                {['Female', 'Male', 'Non-binary', 'Prefer not to say', 'Self-describe'].map((item) => (
                  <Option key={item} selected={d.gender === item} onClick={() => set('gender', item)}>{item}</Option>
                ))}
              </div>
              {d.gender === 'Self-describe' && <input style={{ marginTop: 9 }} value={d.genderOther} onChange={(e) => set('genderOther', e.target.value)} placeholder="Self-describe" />}
            </div>
            <div className="iw-field">
              <label>Occupation</label>
              <div className="iw-optiongrid">
                {['Student', 'Competitive Exam Aspirant', 'Working Professional', 'Business', 'Homemaker', 'Looking for Work', 'Other'].map((item) => (
                  <Option key={item} selected={d.occupation === item} onClick={() => set('occupation', item)}>{item}</Option>
                ))}
              </div>
              {d.occupation === 'Other' && <input style={{ marginTop: 9 }} value={d.occupationOther} onChange={(e) => set('occupationOther', e.target.value)} placeholder="Please specify" />}
            </div>
            <div className="iw-field"><label>Current city</label><input value={d.city} onChange={(e) => set('city', e.target.value)} placeholder="Your city" /></div>
            <div className="iw-field">
              <label>Who do you currently live with?</label>
              <div className="iw-optiongrid">
                {['Alone', 'Parents', 'Partner/Spouse', 'Friends/Roommates', 'Hostel/PG', 'Other'].map((item) => (
                  <Option key={item} selected={d.living === item} onClick={() => set('living', item)}>{item}</Option>
                ))}
              </div>
              {d.living === 'Other' && <input style={{ marginTop: 9 }} value={d.livingOther} onChange={(e) => set('livingOther', e.target.value)} placeholder="Please specify" />}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <div className="iw-k">Section B</div>
            <h2>Why are you here?</h2>
            <div className="iw-field">
              <label>What made you decide to seek support now?</label>
              <div className="iw-optiongrid">
                {[
                  'Something happened recently',
                  'I’ve been struggling for a few months',
                  'I’ve struggled for years',
                  'Someone suggested therapy',
                  'I want to understand myself better',
                  'I’m just exploring',
                  'Not sure',
                ].map((item) => <Option key={item} selected={d.reason === item} onClick={() => set('reason', item)}>{item}</Option>)}
              </div>
            </div>
            <div className="iw-field">
              <label>Which concerns best describe what you’re experiencing today?</label>
              <div className="iw-scale-label">Choose up to 5</div>
              <div className="iw-optiongrid">
                {CONCERNS.map((item) => (
                  <Option key={item} selected={d.concerns.includes(item)} onClick={() => toggle('concerns', item, 5)}>
                    {item}
                  </Option>
                ))}
              </div>
              {d.concerns.includes('Other') && (
                <input style={{ marginTop: 9 }} value={d.concernsOther} onChange={(e) => set('concernsOther', e.target.value)} placeholder="Please specify" />
              )}
            </div>
            {d.concerns.length > 0 && (
              <div className="iw-section">
                <div className="iw-field">
                  <label>How much is each of these affecting you right now?</label>
                  {d.concerns.map((concern) => (
                    <div key={concern} style={{ marginBottom: 12 }}>
                      <div className="iw-scale-label">{concern}</div>
                      <div className="iw-optiongrid">
                        {['Mild', 'Moderate', 'Severe'].map((level) => (
                          <Option key={level} selected={d.concernSeverity[concern] === level} onClick={() => setGrid('concernSeverity', concern, level)}>{level}</Option>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="iw-field">
              <label>Do you notice this in your body, not just your thoughts?</label>
              <p style={{ fontSize: 12 }}>Things like a racing heart, tight chest, shallow breathing, tension you can’t release, or feeling frozen/shut down.</p>
              <div className="iw-optiongrid">
                {['Often, and it’s hard to shake', 'Sometimes', 'Rarely or not really'].map((item) => <Option key={item} selected={d.bodySignal === item} onClick={() => set('bodySignal', item)}>{item}</Option>)}
              </div>
            </div>
            <div className="iw-field">
              <label>How long have these concerns been affecting you?</label>
              <div className="iw-optiongrid">
                {['Less than 1 month', '1–3 months', '3–12 months', '1–2 years', 'More than 2 years'].map((item) => <Option key={item} selected={d.duration === item} onClick={() => set('duration', item)}>{item}</Option>)}
              </div>
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <div className="iw-k">Section B, continued</div>
            <h2>How much different areas are affected</h2>
            {LIFE_AREAS.map((area) => (
              <div key={area} className="iw-field">
                <label>{area}</label>
                <div className="iw-grid5">
                  {['Not at all', 'A little', 'Moderately', 'Quite a lot', 'Extremely'].map((item) => (
                    <Option key={item} selected={d.lifeArea[area] === item} onClick={() => setGrid('lifeArea', area, item)}>{item}</Option>
                  ))}
                </div>
              </div>
            ))}
            <div className="iw-field">
              <label>In your own words, what has been bothering you lately?</label>
              <textarea value={d.ownWords} onChange={(e) => set('ownWords', e.target.value)} placeholder="Write as much or as little as feels right." />
            </div>
          </>
        )}

        {step === 7 && (
          <>
            <div className="iw-k">Section C</div>
            <h2>Your mental health journey</h2>
            <div className="iw-note">Everything here, including medication and diagnosis history, should only be shared according to the product’s consent and privacy controls.</div>
            <div className="iw-field">
              <label>Have you spoken to anyone about this?</label>
              <div className="iw-optiongrid">
                {['No', 'Friend', 'Family', 'Therapist', 'Psychiatrist', 'Doctor'].map((item) => <Option key={item} selected={d.talked.includes(item)} onClick={() => toggle('talked', item, 6)}>{item}</Option>)}
              </div>
            </div>
            <div className="iw-field">
              <label>Have you attended therapy before?</label>
              <div className="iw-optiongrid">
                {['Never', '1–3 sessions', '4–10 sessions', '10+ sessions', 'Currently in therapy'].map((item) => <Option key={item} selected={d.priorTherapy === item} onClick={() => set('priorTherapy', item)}>{item}</Option>)}
              </div>
            </div>
            {['1–3 sessions', '4–10 sessions', '10+ sessions'].includes(d.priorTherapy) && (
              <div className="iw-field">
                <label>If therapy stopped, why?</label>
                <div className="iw-optiongrid">
                  {['Felt better', 'Too expensive', 'Didn’t connect with therapist', 'Didn’t help', 'Didn’t have time', 'Family reasons', 'Other'].map((item) => <Option key={item} selected={d.stopped.includes(item)} onClick={() => toggle('stopped', item, 7)}>{item}</Option>)}
                </div>
                {d.stopped.includes('Other') && <input style={{ marginTop: 9 }} value={d.stoppedOther} onChange={(e) => set('stoppedOther', e.target.value)} placeholder="Please specify" />}
              </div>
            )}
            <div className="iw-field">
              <label>Medication?</label>
              <div className="iw-optiongrid">
                {['Never', 'Currently taking', 'Took in the past', 'Prescribed but didn’t take', 'Prefer not to say'].map((item) => <Option key={item} selected={d.medication === item} onClick={() => set('medication', item)}>{item}</Option>)}
              </div>
            </div>
            {['Currently taking', 'Took in the past', 'Prescribed but didn’t take'].includes(d.medication) && (
              <div className="iw-field">
                <label>Who prescribed it?</label>
                <div className="iw-optiongrid">
                  {['Psychiatrist', 'General Physician', 'Neurologist', 'Other'].map((item) => <Option key={item} selected={d.prescribed === item} onClick={() => set('prescribed', item)}>{item}</Option>)}
                </div>
              </div>
            )}
            <div className="iw-field">
              <label>Diagnosed with a mental health condition?</label>
              <div className="iw-optiongrid">
                {['No', 'Yes', 'Not sure', 'Prefer not to say'].map((item) => <Option key={item} selected={d.diagnosed === item} onClick={() => set('diagnosed', item)}>{item}</Option>)}
              </div>
            </div>
            <div className="iw-field">
              <label>Currently receiving support?</label>
              <div className="iw-optiongrid">
                {['No', 'Therapy', 'Medication', 'Both'].map((item) => <Option key={item} selected={d.currentSupport === item} onClick={() => set('currentSupport', item)}>{item}</Option>)}
              </div>
            </div>
          </>
        )}

        {step === 8 && (
          <>
            <div className="iw-k">Section D</div>
            <h2>Rate your satisfaction</h2>
            {SATISFACTION_AREAS.map((area) => (
              <div key={area} className="iw-field">
                <label>{area}</label>
                <div className="iw-grid5">
                  {['Very Poor', 'Poor', 'Average', 'Good', 'Very Good'].map((item) => <Option key={item} selected={d.satisfaction[area] === item} onClick={() => setGrid('satisfaction', area, item)}>{item}</Option>)}
                </div>
              </div>
            ))}
          </>
        )}

        {step === 9 && (
          <>
            <div className="iw-k">Section D, continued</div>
            <h2>Coping & support system</h2>
            <div className="iw-field">
              <label>When you’re emotionally struggling, what do you usually do first?</label>
              <div className="iw-optiongrid">
                {['Talk to someone', 'Keep it to myself', 'Pray/Meditate', 'Scroll social media', 'Watch videos', 'Sleep', 'Work/Study more', 'Exercise', 'Cry', 'Other'].map((item) => <Option key={item} selected={d.coping === item} onClick={() => set('coping', item)}>{item}</Option>)}
              </div>
              {d.coping === 'Other' && <input style={{ marginTop: 9 }} value={d.copingOther} onChange={(e) => set('copingOther', e.target.value)} placeholder="Please specify" />}
            </div>
            {SUPPORT_AREAS.map((area) => (
              <div key={area} className="iw-field">
                <label>{area}</label>
                <div className="iw-grid5">
                  {['Not at all', 'A little', 'Sometimes', 'Mostly', 'Completely'].map((item) => <Option key={item} selected={d.support[area] === item} onClick={() => setGrid('support', area, item)}>{item}</Option>)}
                </div>
              </div>
            ))}
          </>
        )}

        {step === 10 && (
          <>
            <div className="iw-k">Before we continue</div>
            <h2>One more thing, for your safety</h2>
            <p>We ask this of everyone, early on and on purpose — not because of anything you’ve said.</p>
            <Safety value={safety} setValue={setSafety} />
          </>
        )}

        {step === 11 && (
          <>
            <div className="iw-k">Section E</div>
            <h2>A few quick scenarios</h2>
            <p>Go with your first instinct — there’s no right answer.</p>
            {SCENARIOS_1.map(([key, question, options]) => (
              <div key={key} className="iw-field">
                <label>{question}</label>
                <div className="iw-optiongrid">
                  {options.map((item) => <Option key={item} selected={d.scenarios[key] === item} onClick={() => setGrid('scenarios', key, item)}>{item}</Option>)}
                </div>
              </div>
            ))}
          </>
        )}

        {step === 12 && (
          <>
            <div className="iw-k">Section E, continued</div>
            <h2>A few more scenarios</h2>
            {SCENARIOS_2.map(([key, question, options]) => (
              <div key={key} className="iw-field">
                <label>{question}</label>
                <div className="iw-optiongrid">
                  {options.map((item) => <Option key={item} selected={d.scenarios[key] === item} onClick={() => setGrid('scenarios', key, item)}>{item}</Option>)}
                </div>
              </div>
            ))}
          </>
        )}

        {step === 13 && (
          <>
            <div className="iw-k">Section F</div>
            <h2>Therapy expectations</h2>
            <div className="iw-field">
              <label>What are you hoping will improve?</label>
              <div className="iw-scale-label">Choose up to 3</div>
              <div className="iw-optiongrid">
                {['Anxiety', 'Mood', 'Relationships', 'Confidence', 'Sleep', 'Productivity', 'Emotions', 'Family', 'Career', 'Self-understanding'].map((item) => <Option key={item} selected={d.improve.includes(item)} onClick={() => toggle('improve', item, 3)}>{item}</Option>)}
              </div>
            </div>
            <div className="iw-field">
              <label>In a session, would you rather…</label>
              <div className="iw-optiongrid">
                <Option selected={d.styleStructure === 'Structured'} onClick={() => set('styleStructure', 'Structured')}>Have structure — tools, homework, a plan</Option>
                <Option selected={d.styleStructure === 'Open'} onClick={() => set('styleStructure', 'Open')}>Have open space — talk and see where it goes</Option>
              </div>
            </div>
            <div className="iw-field">
              <label>And when it comes to being challenged…</label>
              <div className="iw-optiongrid">
                <Option selected={d.stylePace === 'Gentle'} onClick={() => set('stylePace', 'Gentle')}>I’d prefer gentle and supportive</Option>
                <Option selected={d.stylePace === 'Direct'} onClick={() => set('stylePace', 'Direct')}>I’m okay being challenged directly</Option>
              </div>
            </div>
            <div className="iw-field">
              <label>And who takes the lead?</label>
              <div className="iw-optiongrid">
                <Option selected={d.styleLead === 'TherapistLed'} onClick={() => set('styleLead', 'TherapistLed')}>I’d rather the therapist guide the session</Option>
                <Option selected={d.styleLead === 'ClientLed'} onClick={() => set('styleLead', 'ClientLed')}>I’d rather lead and bring what’s on my mind</Option>
              </div>
            </div>
            <div className="iw-field">
              <label>What are you looking for right now?</label>
              <div className="iw-optiongrid">
                {[
                  ['ShortTerm', 'Focused, shorter-term help with something specific'],
                  ['LongTerm', 'Longer-term work — patterns, not just the current situation'],
                  ['NotSure', 'Not sure yet — open to what my therapist suggests'],
                ].map(([key, label]) => <Option key={key} selected={d.termApproach === key} onClick={() => set('termApproach', key)}>{label}</Option>)}
              </div>
            </div>
            <div className="iw-field">
              <label>Biggest worry about therapy?</label>
              <div className="iw-optiongrid">
                {['Cost', 'Being judged', 'Opening up', 'It won’t help', 'Finding the right therapist', 'Nothing'].map((item) => <Option key={item} selected={d.worry === item} onClick={() => set('worry', item)}>{item}</Option>)}
              </div>
            </div>
            <div className="iw-field">
              <label>Therapist gender preference?</label>
              <div className="iw-optiongrid">
                {['No preference', 'Female', 'Male'].map((item) => <Option key={item} selected={d.therapistGender === item} onClick={() => set('therapistGender', item)}>{item}</Option>)}
              </div>
            </div>
            <div className="iw-field">
              <label>Affordable budget per session?</label>
              <div className="iw-optiongrid">
                {['Under ₹500', '₹500–1000', '₹1000–1500', '₹1500+'].map((item) => <Option key={item} selected={d.budget === item} onClick={() => set('budget', item)}>{item}</Option>)}
              </div>
            </div>
            <div className="iw-field">
              <label>Preferred frequency?</label>
              <div className="iw-optiongrid">
                {['Weekly', 'Every 2 weeks', 'Monthly', 'Not sure'].map((item) => <Option key={item} selected={d.frequency === item} onClick={() => set('frequency', item)}>{item}</Option>)}
              </div>
            </div>
            <div className="iw-field">
              <label>Anything important you’d like us to know?</label>
              <textarea value={d.finalNotes} onChange={(e) => set('finalNotes', e.target.value)} placeholder="Optional — anything at all." />
            </div>
          </>
        )}

        {step === 14 && (
          <>
            <div className="iw-k">Before we match you</div>
            <h2>Here’s what we’ve put together</h2>
            <div className="iw-note"><strong>This is the summary your therapist/care team will read.</strong></div>
            <div className="iw-summary">
              <div className="iw-row"><span>Presenting concerns</span><strong>{d.concerns.join(', ') || '—'}</strong></div>
              <div className="iw-row"><span>In your own words</span><strong>{d.ownWords || '—'}</strong></div>
              <div className="iw-row"><span>Most affected areas</span><strong>{Object.entries(d.lifeArea).filter(([, value]) => ['Quite a lot', 'Extremely'].includes(value)).map(([key]) => key).join(', ') || 'No area rated significantly affected'}</strong></div>
              <div className="iw-row"><span>Mental health history</span><strong>{[d.priorTherapy && `Therapy: ${d.priorTherapy}`, d.medication && `Medication: ${d.medication}`, d.diagnosed && `Diagnosis: ${d.diagnosed}`, d.currentSupport && `Support: ${d.currentSupport}`].filter(Boolean).join(' · ') || '—'}</strong></div>
              <div className="iw-row"><span>Hoping to improve</span><strong>{d.improve.join(', ') || '—'}</strong></div>
              <div className="iw-row"><span>Budget & frequency</span><strong>{d.budget} · {d.frequency}</strong></div>
            </div>
          </>
        )}

        {step === 15 && (
          <>
            <div className="iw-k">Not a random list</div>
            <h2>How we shortlisted your therapists</h2>
            <p>Here’s the prototype logic in plain language.</p>
            <div className="iw-note">
              <strong>Your concerns → specialization</strong><br />
              We look for overlap between the concerns you selected and listed therapist specialties.
            </div>
            <div className="iw-note">
              <strong>Your preferences → approach fit</strong><br />
              Plain-language preferences and scenario answers can be translated into approach signals.
              These mappings are technical starting points and require licensed clinical review before production use.
            </div>
            <div className="iw-note">
              <strong>Budget/frequency → eligibility</strong><br />
              Price and availability are considered before the shortlist.
            </div>
            <div className="iw-note">
              <strong>Safety → routing</strong><br />
              Standard-risk users may see computed prototype matches. Priority/immediate cases go to human review first.
            </div>
          </>
        )}

        {step === 16 && (
          <>
            <div className="iw-k">Therapist matching</div>
            <h2>A few therapists who could be a good fit</h2>
            <p>These are illustrative prototype results, not a clinically validated recommendation.</p>
            {triageTier !== 'standard' ? (
              <div className="iw-safety iw-danger">
                <strong>Human review first</strong>
                <div>
                  Based on the safety information provided, this prototype does not display algorithmic
                  matches. The care/clinical team should review first.
                </div>
              </div>
            ) : matches.length ? (
              matches.map((therapist) => (
                <button
                  type="button"
                  key={therapist.id}
                  className={`iw-match${selectedTherapist?.id === therapist.id ? ' selected' : ''}`}
                  onClick={() => setSelectedTherapist(therapist)}
                >
                  <div className="iw-matchhead">
                    <div className="iw-avatar">{therapist.name.replace(/^Dr\\.\\s?/, '').charAt(0)}</div>
                    <div style={{ flex: 1 }}>
                      <div className="iw-matchname">{therapist.name}</div>
                      <div className="iw-tags">
                        {therapist.credentials} · {therapist.experienceYears} yrs · {therapist.specialties.join(', ')}
                      </div>
                      <div className="iw-fit">
                        ₹{therapist.fee}/session · {therapist.availability}<br />
                        {therapist.bio}
                      </div>
                    </div>
                    <div className="iw-check" />
                  </div>
                </button>
              ))
            ) : (
              <div className="iw-note">
                We couldn’t find a confident prototype match from the available illustrative roster.
                Rather than guess, the team should help choose the next step.
              </div>
            )}
            <div className="iw-note">
              The supplied prototype uses hard eligibility filters such as capacity, format/state
              constraints and a same-city exclusion, followed by concern/modality/gender/budget scoring.
              The production version should use one shared backend matching service.
            </div>
          </>
        )}

        {sessionError && (
          <div className="iw-error">{sessionError}</div>
        )}

        <div className="iw-nav">
          <button
            type="button"
            className="iw-secondary"
            onClick={previous}
            disabled={loading}
          >
            Back
          </button>
          {step < 16 && (
            <button
              type="button"
              className="iw-primary"
              disabled={!valid || loading || !therapySessionId || (step === 10 && safety.needSupport === 'Yes')}
              onClick={next}
            >
              {loading ? 'Saving…' : 'Continue'} <ArrowRight size={16} />
            </button>
          )}
          {step === 16 && (
            <button
              type="button"
              className="iw-primary"
              disabled={triageTier === 'standard' && !selectedTherapist}
              onClick={finish}
            >
              {triageTier === 'standard' ? 'Continue' : 'Continue to review'} <Check size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Team({ exit }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [therapySessionId, setTherapySessionId] = useState(null);
  const [safety, setSafety] = useState({});
  const [form, setForm] = useState({ name: '', email: '', phone: '', reason: '', callback: '' });

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const createSession = async () => {
    if (therapySessionId) return therapySessionId;

    try {
      setSessionError('');
      const response = await fetch('/api/therapy/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journeyType: 'team',
          metadata: { source: 'therapy_team' },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create therapy session');
      }

      const sessionId = data?.session?.id || data?.id;
      if (!sessionId) throw new Error('Therapy session ID was not returned');

      setTherapySessionId(sessionId);
      return sessionId;
    } catch (error) {
      console.error('Team therapy session creation failed:', error);
      setSessionError(error instanceof Error ? error.message : 'Unable to start therapy request');
      return null;
    }
  };

  useEffect(() => {
    createSession();
  }, []);

  const saveTeamIntake = async (sessionId) => {
    const response = await fetch('/api/therapy/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        therapySessionId: sessionId,
        fullName: form.name.trim(),
        email: form.email.trim(),
        phoneNumber: form.phone.trim(),
        presentingReason: form.reason.trim(),
        contactPreferences: {
          email: form.email.trim(),
          phone: form.phone.trim(),
          callbackPreference: form.callback,
        },
        consents: { teamContact: true },
        answers: { journey: 'team' },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || 'Failed to save team intake');
    return data;
  };

  const saveTeamSafety = async (sessionId) => {
    const answer = safety.answer;
    const safetyStatus =
      answer === 'Yes'
        ? 'positive'
        : answer === 'Prefer not to say'
          ? 'declined'
          : answer === 'No'
            ? 'negative'
            : 'not_assessed';

    const triageLevel =
      safety.physical === 'Yes' ||
      (answer === 'Yes' &&
        (safety.recency === 'Today or this week' ||
          safety.plan === 'Yes' ||
          safety.attempt === 'Yes'))
        ? 'immediate'
        : answer === 'Yes' || answer === 'Prefer not to say'
          ? 'priority'
          : 'standard';

    const response = await fetch('/api/therapy/safety', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        therapySessionId: sessionId,
        safetyStatus,
        triageLevel,
        recentTiming: safety.recency || null,
        planOrMeans: safety.plan || null,
        priorAttempt: safety.attempt || null,
        physicalSafety: safety.physical || null,
        psychiatricCare: safety.psych || null,
        answers: safety,
        evaluatedBy: 'deterministic',
        evaluationMetadata: { source: 'therapy_team_frontend' },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || 'Failed to save team safety assessment');
    return data;
  };

  const submitTeamRequest = async () => {
    const sessionId = therapySessionId || await createSession();
    if (!sessionId) return false;

    await saveTeamIntake(sessionId);
    await saveTeamSafety(sessionId);

    const response = await fetch('/api/therapy/submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        therapySessionId: sessionId,
        submissionType: 'team',
        callbackPreference: form.callback,
        notes: form.reason.trim(),
        metadata: {
          source: 'therapy_team_frontend',
          contactProvided: true,
        },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || 'Failed to submit team request');
    return data;
  };

  const next = async () => {
    if (loading) return;

    if (step === 1) {
      if (!safety.answer || (safety.answer === 'Yes' && (!safety.recency || !safety.plan || !safety.attempt)) || !safety.physical) {
        setSessionError('Please complete the safety questions before continuing.');
        return;
      }
    }

    if (step < 3) {
      setSessionError('');
      setStep((value) => value + 1);
      return;
    }

    setLoading(true);
    setSessionError('');
    try {
      await submitTeamRequest();
      setDone(true);
    } catch (error) {
      console.error('Team therapy submission failed:', error);
      setSessionError(error instanceof Error ? error.message : 'Unable to submit therapy request');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="iw-flow">
        <Header name="Talk to the team" step={4} total={4} onBack={exit} />
        <div className="iw-card iw-success">
          <div className="iw-successicon"><Check /></div>
          <h2>Request received</h2>
          <p>Your request, contact details and safety assessment have been securely submitted to the Therapy backend.</p>
          <button type="button" className="iw-primary" onClick={exit}>Back to Therapy</button>
        </div>
      </div>
    );
  }

  return (
    <div className="iw-flow">
      <Header name="Talk to the team" step={step + 1} total={4} onBack={step ? () => setStep((value) => value - 1) : exit} />
      <div className="iw-card">
        {sessionError && <div className="iw-note" style={{ marginTop: 0, marginBottom: 18 }}>{sessionError}</div>}

        {step === 0 && (
          <>
            <div className="iw-k">Talk to the team</div>
            <h2>How should we reach you?</h2>
            <p>No AI conversation or therapist matching is needed for this route.</p>
            <div className="iw-field"><label>Name</label><input value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div className="iw-field"><label>Email</label><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
            <div className="iw-field"><label>Phone number</label><input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
            <div className="iw-field"><label>What would you like help with?</label><textarea value={form.reason} onChange={(e) => set('reason', e.target.value)} /></div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="iw-k">Safety</div>
            <h2>One more thing, for your safety</h2>
            <Safety value={safety} setValue={setSafety} />
          </>
        )}

        {step === 2 && (
          <>
            <div className="iw-k">Callback</div>
            <h2>Preferred callback</h2>
            <p>Choose when the team should contact you.</p>
            <div className="iw-optiongrid">
              {['Morning', 'Afternoon', 'Evening', 'No preference'].map((item) => (
                <Option key={item} selected={form.callback === item} onClick={() => set('callback', item)}>{item}</Option>
              ))}
            </div>
            <div className="iw-note"><Phone size={15} style={{ verticalAlign: '-3px' }} /> Immediate safety concerns should use emergency support rather than waiting for a callback.</div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="iw-k">Review</div>
            <h2>Ready to send the request?</h2>
            <div className="iw-summary">
              <div className="iw-row"><span>Name</span><strong>{form.name}</strong></div>
              <div className="iw-row"><span>Phone</span><strong>{form.phone}</strong></div>
              <div className="iw-row"><span>Callback</span><strong>{form.callback}</strong></div>
              <div className="iw-row"><span>Safety triage</span><strong>{safety.answer === 'Yes' || safety.answer === 'Prefer not to say' ? 'Human review' : 'Standard'}</strong></div>
            </div>
          </>
        )}

        <div className="iw-nav">
          <button type="button" className="iw-secondary" disabled={!step || loading} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</button>
          <button
            type="button"
            className="iw-primary"
            disabled={
              loading ||
              (step === 0 && (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.reason.trim())) ||
              (step === 1 && (!safety.answer || !safety.physical || (safety.answer === 'Yes' && (!safety.recency || !safety.plan || !safety.attempt)))) ||
              (step === 2 && !form.callback)
            }
            onClick={next}
          >
            {step < 3 ? <>Continue <ArrowRight size={16} /></> : <>Request callback <Check size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TherapyPage({ user, profile, onSignOut }) {
  const [journey, setJourney] = useState(null);

  const dashboard = () => {
    if (typeof window !== 'undefined' && window.navigateTo) window.navigateTo('/dashboard');
    else if (typeof window !== 'undefined') window.history.back();
  };

  return (
    <div className="iw">
      <style>{CSS}</style>

      {!journey && (
        <div className="iw-shell">
          <div className="iw-top">
            <button type="button" className="iw-back" onClick={dashboard}>
              <ArrowLeft size={15} /> Dashboard
            </button>
            <span style={{ color: '#9fb0c2', fontSize: 13 }}>Therapy</span>
          </div>

          <div className="iw-k">Support, at your pace</div>
          <h1>Let’s find the right way in.</h1>
          <p className="iw-lede">
            Choose how you’d like to begin. You can talk it through, answer a guided set of
            questions, or speak with the team directly.
          </p>

          <div className="iw-grid">
            <div className="iw-card iw-journey">
              <div className="iw-icon"><MessageCircle /></div>
              <div className="iw-k">Talk it through</div>
              <h3>Start with a conversation</h3>
              <p>Share what has been on your mind in a guided conversational experience.</p>
              <button type="button" className="iw-primary" onClick={() => setJourney('conversation')}>
                Talk it through <ArrowRight size={15} />
              </button>
            </div>

            <div className="iw-card iw-journey">
              <div className="iw-icon"><ClipboardList /></div>
              <div className="iw-k">Guided form</div>
              <h3>Tell us about yourself</h3>
              <p>Answer structured questions about your background, concerns, history, safety and preferences.</p>
              <button type="button" className="iw-primary" onClick={() => setJourney('guided')}>
                Start guided form <ArrowRight size={15} />
              </button>
            </div>

            <div className="iw-card iw-journey">
              <div className="iw-icon"><Users /></div>
              <div className="iw-k">Talk to the team</div>
              <h3>Prefer to speak with us directly?</h3>
              <p>Skip the intake conversation and leave your details for a callback.</p>
              <button type="button" className="iw-primary" onClick={() => setJourney('team')}>
                Talk to the team <ArrowRight size={15} />
              </button>
            </div>
          </div>

          <div className="iw-note">
            <strong>Prototype status:</strong> the three journeys now follow the supplied intake
            structure more closely. Production AI, persistence, clinical triage and booking remain
            server-side integration work.
          </div>
        </div>
      )}

      {journey === 'conversation' && <Conversation exit={() => setJourney(null)} />}
      {journey === 'guided' && <Guided exit={() => setJourney(null)} />}
      {journey === 'team' && <Team exit={() => setJourney(null)} />}
    </div>
  );
}
