import { useState } from 'react';
import '../styles/v2.css';

export default function V2LandingPage({ initialTab = 'home' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(initialTab);
  }

  const go = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleChip = (e) => {
    e.currentTarget.classList.toggle('on');
    const isPressed = e.currentTarget.classList.contains('on');
    e.currentTarget.setAttribute('aria-pressed', isPressed.toString());
  };

  return (
    <div className="v2-wrapper">
      <div className="wrap">
        <nav>
          <div className="logo" onClick={() => go('home')}>
            <svg className="mark" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M32,34 C32,28 27,24 22,26 C16,28 15,36 20,40 C25,44 33,42 35,35 C37,27 30,20 22,21" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round"/>
              <line x1="22" y1="21" x2="18" y2="10" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="16" cy="7" r="5" fill="var(--primary)"/>
              <line x1="35" y1="35" x2="46" y2="30" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="49" cy="28" r="5" fill="var(--thistle)"/>
              <line x1="20" y1="40" x2="14" y2="50" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="11" cy="53" r="5" fill="var(--fog)"/>
            </svg>
            Ingress <span style={{ color: 'var(--thistle, #795663)' }}>Within</span>
          </div>
          <div className="links">
            <a onClick={() => go('solution')}>Our Solution</a>
            <a onClick={() => go('how')}>How It Works</a>
            <a onClick={() => go('pricing')}>Pricing</a>
            <a onClick={() => go('ai')}>AI & Data</a>
            <a onClick={() => go('evidence')}>Evidence</a>
            <a onClick={() => go('about')}>About</a>
            <a onClick={() => go('crisis')}>In Crisis?</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="cta secondary" style={{ padding: '9px 16px', fontSize: '13px' }} onClick={() => go('signup')}>Self-work</button>
            <button className="cta primary" style={{ padding: '9px 16px', fontSize: '13px' }} onClick={() => go('intake')}>With a therapist</button>
            <button
              className="burger"
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mlinks"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </nav>
        <div id="mlinks" className={`mlinks wrap ${mobileMenuOpen ? 'open' : ''}`}>
          <a onClick={() => { go('solution'); closeMenu(); }}>Our Solution</a>
          <a onClick={() => { go('how'); closeMenu(); }}>How It Works</a>
          <a onClick={() => { go('pricing'); closeMenu(); }}>Pricing</a>
          <a onClick={() => { go('ai'); closeMenu(); }}>AI & Data</a>
          <a onClick={() => { go('evidence'); closeMenu(); }}>Evidence</a>
          <a onClick={() => { go('about'); closeMenu(); }}>About</a>
          <a onClick={() => { go('crisis'); closeMenu(); }}>In Crisis?</a>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px 0', borderTop: '1px solid var(--line)' }}>
            <button className="btn secondary" style={{ width: '100%' }} onClick={() => { go('signup'); closeMenu(); }}>Start your independent journey</button>
            <button className="btn primary" style={{ width: '100%' }} onClick={() => { go('intake'); closeMenu(); }}>Start with a professional</button>
          </div>
        </div>
      </div>

      <main>
        {/* ========================================================================= */}
        {/* 1. HOME                                                                   */}
        {/* ========================================================================= */}
        <div id="home" className={`page ${activeTab === 'home' ? 'active' : ''}`}>
          <section className="hero">
            <div className="wrap grid">
              <div>
                <div className="ey">START WHERE YOU ARE</div>
                <h1>Whatever brings you here, you can start there.</h1>
                <p className="lede">
                  Most of what brings people here isn't a disorder — it's feelings that got pushed aside for too long. You may want to work on something yourself. You may want a therapist. You may want both. Ingress Within brings those ways of working on your mental health into one platform.
                </p>
                <div className="actions">
                  <button className="btn primary" onClick={() => go('signup')}>Start your independent journey</button>
                  <button className="btn secondary" onClick={() => go('intake')}>Start with a professional</button>
                </div>
                <p className="note" style={{ marginTop: '16px' }}>There is no required order.</p>
                <div className="chips" style={{ marginTop: '18px' }}>
                  <span className="chip">✓ Verified therapists</span>
                  <span className="chip">✓ Private by default</span>
                  <span className="chip">✓ Priced in ₹</span>
                  <span className="chip">✓ Built for India</span>
                </div>
              </div>
              <div className="illus-wrap">
                <svg viewBox="0 0 400 460" role="img" aria-label="Illustration of a person sitting cross-legged, writing in an open journal">
                  <path d="M55,225 C5,145 55,35 178,28 C302,20 382,92 368,212 C356,332 278,424 168,432 C58,440 108,308 55,225 Z" fill="var(--primary-soft)"/>
                  <circle cx="335" cy="110" r="7" fill="var(--gold)"/>
                  <circle cx="90" cy="90" r="6" fill="var(--thistle)"/>
                  <circle cx="325" cy="340" r="8" fill="var(--fog)"/>
                  <path d="M120,432 C138,388 170,382 200,398 C230,382 262,388 280,432 L280,455 L120,455 Z" fill="var(--gold)"/>
                  <rect x="188" y="286" width="24" height="26" fill="#D99A6C"/>
                  <rect x="150" y="288" width="100" height="122" rx="32" fill="var(--primary)"/>
                  <path d="M150,318 C120,328 110,358 130,380" stroke="var(--primary)" strokeWidth="18" fill="none" strokeLinecap="round"/>
                  <path d="M250,318 C280,328 292,358 272,380" stroke="var(--primary)" strokeWidth="18" fill="none" strokeLinecap="round"/>
                  <ellipse cx="200" cy="222" rx="47" ry="55" fill="#5B3A2A"/>
                  <circle cx="200" cy="253" r="40" fill="#D99A6C"/>
                  <rect x="148" y="368" width="104" height="68" rx="10" fill="#fff" stroke="var(--line)"/>
                  <line x1="200" y1="368" x2="200" y2="436" stroke="var(--line)"/>
                  <line x1="158" y1="388" x2="191" y2="388" stroke="var(--line)"/>
                  <line x1="158" y1="403" x2="187" y2="403" stroke="var(--line)"/>
                  <line x1="158" y1="418" x2="192" y2="418" stroke="var(--line)"/>
                  <line x1="209" y1="388" x2="242" y2="388" stroke="var(--line)"/>
                  <line x1="209" y1="403" x2="238" y2="403" stroke="var(--line)"/>
                  <line x1="209" y1="418" x2="240" y2="418" stroke="var(--line)"/>
                  <line x1="128" y1="378" x2="150" y2="398" stroke="#2E2A3D" strokeWidth="4" strokeLinecap="round"/>
                </svg>
                <div className="illus-badge">
                  <span className="chip">Journal</span>
                  <span className="chip">Therapy</span>
                  <span className="chip">Both</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">SOUND FAMILIAR?</div>
              <h2>Most of this starts as ordinary life, not a clinical complaint.</h2>
              <div className="chips" style={{ marginTop: '20px' }}>
                <span className="chip">"Log kya kahenge"</span>
                <span className="chip">"Beta, adjust kar lo"</span>
                <span className="chip">Saying yes when you mean no</span>
                <span className="chip">Being the strong one for everyone else</span>
                <span className="chip">Guilt about resting</span>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">WHY PEOPLE START HERE</div>
              <h2>Three common starting points.</h2>
              <div className="three">
                <div className="card">
                  <div className="share">
                    <b>"I just want to understand myself first."</b><br/>
                    <span className="muted">Not ready for therapy, but want more than guessing at why they feel a certain way.</span>
                  </div>
                </div>
                <div className="card">
                  <div className="share">
                    <b>"I don't want to repeat my whole story again."</b><br/>
                    <span className="muted">Been to therapy before, tired of starting from zero with someone new.</span>
                  </div>
                </div>
                <div className="card">
                  <div className="share">
                    <b>"I have a therapist, but weeks in between feel unsupported."</b><br/>
                    <span className="muted">Wants somewhere to put thoughts down between sessions.</span>
                  </div>
                </div>
              </div>
              <div className="actions" style={{ justifyContent: 'center', marginTop: '28px' }}>
                <button className="btn secondary" onClick={() => go('signup')}>Start your independent journey</button>
                <button className="btn primary" onClick={() => go('intake')}>Start with a professional</button>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">A QUICK LOOK</div>
              <h2>From a journal entry to a clearer pattern, in three steps.</h2>
              <div className="diagram">
                <svg viewBox="0 0 700 150" role="img" aria-label="Flow diagram: write, then see the report, then understand and act">
                  <rect x="15" y="40" width="190" height="70" rx="14" fill="var(--surface)" stroke="var(--line)"/>
                  <text x="110" y="70" textAnchor="middle" fontFamily="Arial" fontSize="10" letterSpacing="1" fill="var(--gold)" fontWeight="700">01</text>
                  <text x="110" y="92" textAnchor="middle" fontFamily="Georgia, serif" fontSize="16" fill="var(--ink)">Write</text>
                  <rect x="255" y="40" width="190" height="70" rx="14" fill="var(--surface)" stroke="var(--line)"/>
                  <text x="350" y="70" textAnchor="middle" fontFamily="Arial" fontSize="10" letterSpacing="1" fill="var(--gold)" fontWeight="700">02</text>
                  <text x="350" y="92" textAnchor="middle" fontFamily="Georgia, serif" fontSize="16" fill="var(--ink)">See the report</text>
                  <rect x="495" y="40" width="190" height="70" rx="14" fill="var(--surface)" stroke="var(--primary)" strokeWidth="1.5"/>
                  <text x="590" y="70" textAnchor="middle" fontFamily="Arial" fontSize="10" letterSpacing="1" fill="var(--gold)" fontWeight="700">03</text>
                  <text x="590" y="92" textAnchor="middle" fontFamily="Georgia, serif" fontSize="16" fill="var(--ink)">Understand, act</text>
                  <path d="M205,75 L253,75" stroke="var(--muted)" strokeWidth="2" markerEnd="url(#arrowh)"/>
                  <path d="M445,75 L493,75" stroke="var(--muted)" strokeWidth="2" markerEnd="url(#arrowh)"/>
                  <defs>
                    <marker id="arrowh" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                      <path d="M0,0 L9,4.5 L0,9 z" fill="var(--muted)"/>
                    </marker>
                  </defs>
                </svg>
              </div>
              <p className="note" style={{ marginTop: '20px' }}>
                <a onClick={() => go('how')} style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer' }}>
                  See the full walkthrough, including therapy →
                </a>
              </p>
              <div className="actions" style={{ justifyContent: 'center', marginTop: '16px' }}>
                <button className="btn primary" onClick={() => go('signup')}>Start your Journal →</button>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">PRICING, IN SHORT</div>
              <h2>Simple, transparent, in rupees.</h2>
              <div className="two">
                <div className="price">
                  <div className="ey">SELF-WORK PLATFORM</div>
                  <div className="amt">₹499 <small>/ month</small></div>
                  <p className="muted">Journal, weekly & monthly reports included. Psychoeducation modules purchased separately, only when relevant.</p>
                  <button className="btn secondary" style={{ marginTop: '16px', width: '100%' }} onClick={() => go('signup')}>Start self-guided work →</button>
                </div>
                <div className="price">
                  <div className="ey">THERAPY</div>
                  <div className="amt">From ₹999 <small>/ session</small></div>
                  <p className="muted">Licensed, verified therapists. No lock-in packages.</p>
                  <button className="btn primary" style={{ marginTop: '16px', width: '100%' }} onClick={() => go('intake')}>Book therapist session →</button>
                </div>
              </div>
              <p className="note" style={{ marginTop: '20px' }}>
                <a onClick={() => go('pricing')} style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer' }}>
                  See full pricing details →
                </a>
              </p>
            </div>
          </section>

          <section className="band">
            <div className="wrap center">
              <div className="ey">UNDERSTAND. GROW. CONTINUE.</div>
              <h2>The philosophy behind the platform — not a sequence you have to follow.</h2>
              <p className="lede muted">You might start with therapy. You might start by practising. You might just want to know what's going on. Ingress Within meets you where you are.</p>
              <div className="actions" style={{ justifyContent: 'center', marginTop: '26px' }}>
                <button className="btn primary" onClick={() => go('signup')}>Walk your own path first</button>
                <button className="btn secondary" onClick={() => go('intake')}>Begin with therapist guidance</button>
              </div>
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* 2. SOLUTION                                                               */}
        {/* ========================================================================= */}
        <div id="solution" className={`page ${activeTab === 'solution' ? 'active' : ''}`}>
          <section className="hero">
            <div className="wrap">
              <div className="ey">OUR SOLUTION</div>
              <h1>One platform. Different ways to work on your mental health.</h1>
              <p className="lede">Some people just want to understand themselves better. Some want a therapist. Some want both, at different times. Here's what each looks like.</p>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">WHEN YOU WORK ON YOURSELF</div>
              <h2>Write it down. Let the platform show you what you can't see day to day.</h2>
              <div className="three">
                <div className="panel">
                  <div className="num">JOURNAL</div>
                  <h3>Free-flow, or a guided 5-prompt journal.</h3>
                  <p className="muted">Write freely about your day, or use the guided journal, which asks what happened, why, and how it affected you — five prompts, a few minutes a day.</p>
                  <div className="chips">
                    <span className="chip">Overwhelmed</span>
                    <span className="chip">Guilty</span>
                    <span className="chip">Anxious</span>
                    <span className="chip">Hurt</span>
                  </div>
                </div>
                <div className="panel">
                  <div className="num">WEEKLY & MONTHLY REPORTS</div>
                  <h3>See what keeps repeating.</h3>
                  <p className="muted">Included with platform access — your entries become a weekly and monthly report showing recurring situations, feelings and emotional vocabulary AI picks up over time.</p>
                  <div className="goal">
                    <span className="tag">This month's pattern</span><br/>
                    <b>Agree first. Feel guilty later.</b>
                  </div>
                </div>
                <div className="panel">
                  <div className="num">INTERVENTIONS & PSYCHOEDUCATION</div>
                  <h3>When a pattern keeps showing up, we name it — gently.</h3>
                  <p className="muted">Interventions explain what a recurring pattern or emotional word might mean, in plain language, as soon as it appears — this part is included, not a paywall. If it's still showing up after about two months, we'll suggest one focused module that speaks directly to it. You decide if and when to take it — reading the free intervention is often enough on its own.</p>
                </div>
              </div>
              <div className="actions" style={{ marginTop: '28px' }}>
                <button className="btn primary" onClick={() => go('signup')}>Start your independent journey →</button>
                <button className="btn secondary" onClick={() => go('intake')}>Start with a professional</button>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">THE GUIDED JOURNAL</div>
              <h2>Five short prompts, so you're not staring at a blank page.</h2>
              <div className="steps steps-5" style={{ marginTop: '30px' }}>
                <div className="step"><div className="num">01</div><h3>What happened?</h3></div>
                <div className="step"><div className="num">02</div><h3>Why do you think so?</h3></div>
                <div className="step"><div className="num">03</div><h3>How did you react?</h3></div>
                <div className="step"><div className="num">04</div><h3>What did you feel?</h3></div>
                <div className="step"><div className="num">05</div><h3>What would you tell a friend?</h3></div>
              </div>

              <div className="panel" style={{ marginTop: '34px' }}>
                <div className="ey">SAMPLE WEEKLY REPORT</div>
                <div className="chips" style={{ marginTop: '12px' }}>
                  <span className="chip">Guilty ×4</span>
                  <span className="chip">Overwhelmed ×3</span>
                  <span className="chip">Relieved ×1</span>
                </div>
                <p className="muted" style={{ marginTop: '14px' }}>Recurring: agreeing to help others at your own cost. Suggested focus: notice the moment right before you say "yes."</p>
              </div>

              <div className="diagram" style={{ width: '100%', marginTop: '36px', background: '#FAF8F5', borderRadius: '16px', padding: '24px 28px', border: '1px solid #E7DECF', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '24px', height: '1.5px', background: '#8C5F6D', borderRadius: '9999px', display: 'inline-block' }} />
                    <span className="ey" style={{ margin: 0, fontSize: '10.5px' }}>HOW A <strong style={{ color: '#6A3D4E' }}>SUGGESTION</strong> FORMS</span>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#E3ECE5', padding: '4px 12px', borderRadius: '9999px' }}>
                    <svg width="16" height="8" viewBox="0 0 20 10" fill="none" style={{ color: '#56795A' }}>
                      <path d="M1 5C4 2 6 8 10 5C14 2 16 8 19 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    </svg>
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '10.5px', color: '#4A6B4F', fontWeight: 600, letterSpacing: '0.04em' }}>
                      100% From longitudinal tracking
                    </span>
                  </div>
                </div>

                <h3 style={{ fontSize: '32px', color: '#162723', fontWeight: 400, marginTop: '8px', marginBottom: '8px', lineHeight: 1.15 }}>
                  Free the whole way, until <span style={{ fontStyle: 'italic', color: '#6A3D4E' }}>one point.</span>
                </h3>

                <div style={{ width: '100%', overflowX: 'auto', paddingTop: '4px' }}>
                  <svg
                    viewBox="0 0 823 241"
                    role="img"
                    aria-label="How a suggestion forms chart showing a pattern appearing in week 1, repeating through week 8, where one module is offered"
                    style={{ width: '100%', minWidth: '620px', height: 'auto', display: 'block', userSelect: 'none' }}
                  >
                    <defs>
                      {/* Smooth multi-stop curve stroke gradient aligned to exact reference colors */}
                      <linearGradient id="v2-curve-grad" x1="84" y1="0" x2="747" y2="0" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#526A56" />
                        <stop offset="18%" stopColor="#556E5A" />
                        <stop offset="35%" stopColor="#6D4754" />
                        <stop offset="68%" stopColor="#654C5F" />
                        <stop offset="85%" stopColor="#9A693E" />
                        <stop offset="100%" stopColor="#C4963C" />
                      </linearGradient>

                      {/* Horizontal baseline gradient matching reference transition across weeks */}
                      <linearGradient id="v2-baseline-grad" x1="29" y1="0" x2="803" y2="0" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#8E998B" />
                        <stop offset="25%" stopColor="#937A82" />
                        <stop offset="60%" stopColor="#998A91" />
                        <stop offset="100%" stopColor="#C39859" />
                      </linearGradient>
                    </defs>

                    {/* --- Exact Physical Watercolor Wash Extracted From Reference --- */}
                    <image
                      href="/chart-watercolor-wash.png"
                      x="0"
                      y="0"
                      width="823"
                      height="241"
                      preserveAspectRatio="none"
                      style={{ mixBlendMode: 'multiply' }}
                      className="pointer-events-none select-none opacity-95"
                    />

                    {/* Horizontal Baseline */}
                    <line x1="29" y1="197" x2="803" y2="197" stroke="url(#v2-baseline-grad)" strokeWidth="1.2" />

                    {/* Baseline Tick Marks */}
                    <line x1="84" y1="194" x2="84" y2="200" stroke="#8E998B" strokeWidth="1.2" />
                    <line x1="313" y1="194" x2="313" y2="200" stroke="#937A82" strokeWidth="1.2" />
                    <line x1="538" y1="194" x2="538" y2="200" stroke="#998A91" strokeWidth="1.2" />
                    <line x1="747" y1="194" x2="747" y2="200" stroke="#C39859" strokeWidth="1.2" />

                    {/* Ascending Main S-Curve Line matching reference trajectory exactly */}
                    <path
                      d="M 84,165 C 160,165 245,148 313,130 C 390,127 465,102 538,90 C 615,84 675,66 747,46"
                      fill="none"
                      stroke="url(#v2-curve-grad)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* --- 01. WEEK 1 (Green) --- */}
                    {/* Dashed vertical indicator line */}
                    <line x1="84" y1="165" x2="84" y2="197" stroke="#7E9E82" strokeWidth="1.2" strokeDasharray="3 3" />
                    {/* Dot with authentic white halo ring */}
                    <circle cx="84" cy="165" r="6.5" fill="#587560" stroke="#FFFFFF" strokeWidth="1.8" />
                    {/* Baseline Label */}
                    <text x="84" y="215" textAnchor="middle" fontFamily="monospace" fontSize="10" fontWeight="700" fill="#4B6353" letterSpacing="0.14em">
                      WEEK 1
                    </text>
                    {/* Handwritten Annotation: First noticed */}
                    <text x="88" y="130" textAnchor="middle" fontFamily="var(--font-hand, 'Kalam', cursive)" fontSize="14" fill="#3E5445" transform="rotate(-6 88 130)">
                      First noticed
                    </text>
                    {/* Curved Arrow pointing down into green dot */}
                    <path d="M 96,138 Q 103,150 91,158" fill="none" stroke="#3E5445" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M 89,152 L 91,158 L 98,155" fill="none" stroke="#3E5445" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

                    {/* --- 02. WEEK 3 (Plum) --- */}
                    {/* Dashed vertical indicator line */}
                    <line x1="313" y1="130" x2="313" y2="197" stroke="#8A5B68" strokeWidth="1.2" strokeDasharray="3 3" />
                    {/* Dot with authentic white halo ring */}
                    <circle cx="313" cy="130" r="6.5" fill="#6E4354" stroke="#FFFFFF" strokeWidth="1.8" />
                    {/* Baseline Label */}
                    <text x="313" y="215" textAnchor="middle" fontFamily="monospace" fontSize="10" fontWeight="700" fill="#6E4354" letterSpacing="0.14em">
                      WEEK 3
                    </text>
                    {/* Handwritten Annotation: Repeating */}
                    <text x="322" y="103" textAnchor="middle" fontFamily="var(--font-hand, 'Kalam', cursive)" fontSize="14" fill="#6E4354" transform="rotate(-5 322 103)">
                      Repeating
                    </text>
                    {/* Curved Arrow pointing down into plum dot */}
                    <path d="M 326,110 Q 333,121 321,126" fill="none" stroke="#6E4354" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M 319,120 L 321,126 L 328,123" fill="none" stroke="#6E4354" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

                    {/* --- 03. WEEK 6 (Mauve / Slate) --- */}
                    {/* Dashed vertical indicator line */}
                    <line x1="538" y1="90" x2="538" y2="197" stroke="#8A5B68" strokeWidth="1.2" strokeDasharray="3 3" />
                    {/* Dot with authentic white halo ring */}
                    <circle cx="538" cy="90" r="6.5" fill="#63485A" stroke="#FFFFFF" strokeWidth="1.8" />
                    {/* Baseline Label */}
                    <text x="538" y="215" textAnchor="middle" fontFamily="monospace" fontSize="10" fontWeight="700" fill="#4A5C66" letterSpacing="0.14em">
                      WEEK 6
                    </text>
                    {/* Handwritten Annotation: Intervention shown */}
                    <text x="555" y="58" textAnchor="middle" fontFamily="var(--font-hand, 'Kalam', cursive)" fontSize="14" fill="#3D505D" transform="rotate(-3 555 58)">
                      Intervention shown
                    </text>
                    {/* Curved Arrow pointing down into slate dot */}
                    <path d="M 561,66 Q 568,77 546,85" fill="none" stroke="#3D505D" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M 545,79 L 546,85 L 553,83" fill="none" stroke="#3D505D" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

                    {/* --- 04. WEEK 8 (Gold Sunburst Point) --- */}
                    {/* Dashed vertical indicator line */}
                    <line x1="747" y1="46" x2="747" y2="197" stroke="#C4963C" strokeWidth="1.2" strokeDasharray="3 3" />
                    {/* Gold Sunburst Rays matching reference angles and lengths */}
                    <line x1="760" y1="34" x2="771" y2="25" stroke="#C4963C" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="766" y1="46" x2="778" y2="46" stroke="#C4963C" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="761" y1="58" x2="771" y2="67" stroke="#C4963C" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="747" y1="28" x2="747" y2="18" stroke="#C4963C" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="764" y1="71" x2="769" y2="81" stroke="#C4963C" strokeWidth="1.8" strokeLinecap="round" />
                    {/* Main Gold Dot with white halo ring */}
                    <circle cx="747" cy="46" r="7" fill="#C4963C" stroke="#FFFFFF" strokeWidth="1.8" />
                    {/* Baseline Label */}
                    <text x="747" y="215" textAnchor="middle" fontFamily="monospace" fontSize="10" fontWeight="700" fill="#BD8F48" letterSpacing="0.14em">
                      WEEK 8
                    </text>
                    {/* Handwritten Annotation: 1 module offered */}
                    <text x="728" y="16" textAnchor="middle" fontFamily="var(--font-hand, 'Kalam', cursive)" fontSize="14.5" fontWeight="bold" fill="#794255" transform="rotate(-4 728 16)">
                      1 module offered
                    </text>
                    {/* Curved Arrow pointing down into gold dot */}
                    <path d="M 732,22 Q 741,31 743,39" fill="none" stroke="#794255" strokeWidth="1.3" strokeLinecap="round" />
                    <path d="M 737,34 L 743,39 L 747,32" fill="none" stroke="#794255" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div style={{ width: '100%', height: '1px', background: 'rgba(234, 223, 207, 0.7)', margin: '14px 0 12px' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid rgba(184, 150, 74, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B8964A', fontSize: '10px', fontStyle: 'italic', fontFamily: 'serif', flexShrink: 0 }}>
                    i
                  </div>
                  <p style={{ fontStyle: 'italic', fontSize: '12.5px', color: '#5C6873', margin: 0, lineHeight: 1.4 }}>
                    Everything on the line is included with your <strong style={{ color: '#162723', fontWeight: 600, fontStyle: 'normal' }}>₹499/month subscription</strong>. Only the single point at the end, the module, is a separate, optional purchase.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">WHEN YOU WORK WITH A THERAPIST</div>
              <h2>Not just the session — a dashboard that shows the work between sessions too.</h2>
              <div className="three">
                <div className="panel">
                  <div className="num">YOUR DASHBOARD</div>
                  <h3>See what happened last session, and what's due next.</h3>
                  <p className="muted">A recap of your last session, any homework your therapist assigned, and your goals — so therapy isn't only what you remember from the room.</p>
                  <div className="goal">
                    <b>Speak up in family discussions without over-explaining</b>
                    <div className="progress"><i style={{ width: '72%' }}></i></div>
                    <small className="muted">Review this month</small>
                  </div>
                </div>
                <div className="panel">
                  <div className="num">THERAPIST-ASSIGNED WORK</div>
                  <h3>Homework and psychoeducation, set by your therapist.</h3>
                  <p className="muted">Your therapist can assign homework and psychoeducation modules directly, tailored to what came up in session.</p>
                </div>
                <div className="panel">
                  <div className="num">CONTINUITY</div>
                  <h3>Keep your history if the support changes.</h3>
                  <p className="muted">Selected goals, session recaps and self-work can move with you when you change therapists — your therapist also gets a dashboard per client, so nothing depends on memory alone.</p>
                </div>
              </div>
              <div className="actions" style={{ marginTop: '28px' }}>
                <button className="btn primary" onClick={() => go('intake')}>Start with a professional →</button>
                <button className="btn secondary" onClick={() => go('signup')}>Start your independent journey</button>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">A LOOK AT THE DASHBOARD</div>
              <h2>What you and your therapist both see.</h2>
              <div className="two">
                <div className="panel">
                  <div className="ey">YOUR SIDE</div>
                  <div className="goal">
                    <b>Last session — 12 Aug</b><br/>
                    <span className="muted">Talked through the tension with your manager about weekend calls.</span>
                  </div>
                  <div className="goal">
                    <b>Homework due</b><br/>
                    <span className="muted">Write down one moment this week you wanted to say no and didn't.</span>
                  </div>
                  <div className="goal">
                    <b>Psychoeducation assigned</b><br/>
                    <span className="muted">Understanding people-pleasing patterns — 8 min read</span>
                  </div>
                </div>
                <div className="panel">
                  <div className="ey">YOUR THERAPIST'S SIDE</div>
                  <div className="goal">
                    <b>Client goal progress</b><br/>
                    <span className="muted">Boundary-setting at work — 3 of 4 milestones</span>
                  </div>
                  <div className="goal">
                    <b>Notes from last session</b><br/>
                    <span className="muted">Visible only to the therapist, never shown to you automatically</span>
                  </div>
                  <div className="goal">
                    <b>Relevant self-work</b><br/>
                    <span className="muted">2 journal entries the client chose to share this week</span>
                  </div>
                </div>
              </div>
              <div className="actions" style={{ justifyContent: 'center', marginTop: '28px', gap: '16px' }}>
                <button className="btn secondary" style={{ minWidth: '260px', textAlign: 'center', justifyContent: 'center' }} onClick={() => go('signup')}>Begin private self-work →</button>
                <button className="btn primary" style={{ minWidth: '260px', textAlign: 'center', justifyContent: 'center' }} onClick={() => go('intake')}>Start with a therapist →</button>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">PSYCHOEDUCATION LIBRARY</div>
              <h2>A few examples of what a module actually covers.</h2>
              <div className="cards">
                <div className="card"><h3>Understanding people-pleasing patterns</h3><p className="muted">Why saying yes feels safer than saying no, and how to notice the moment before you agree.</p></div>
                <div className="card"><h3>Managing family expectations</h3><p className="muted">Working with — not against — obligation, without losing yourself in it.</p></div>
                <div className="card"><h3>Setting boundaries without guilt</h3><p className="muted">Practical language for saying no to people you care about.</p></div>
                <div className="card"><h3>Recognising burnout early</h3><p className="muted">The difference between a hard week and a pattern that needs attention.</p></div>
                <div className="card"><h3>Overthinking & rumination</h3><p className="muted">Interrupting the loop before it takes over an evening.</p></div>
                <div className="card"><h3>Navigating comparison</h3><p className="muted">Working through "everyone else seems to have it figured out."</p></div>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">WHAT PEOPLE ACTUALLY BRING IN</div>
              <h2>A few examples of what this looks like in practice.</h2>
              <div className="three">
                <div className="card">
                  <div className="share"><b>Shared with therapist</b><br/><span className="muted">"I got anxious before my sister's wedding and couldn't figure out why."</span></div>
                </div>
                <div className="card">
                  <div className="share"><b>Shared with therapist</b><br/><span className="muted">"My in-laws commented on my job again and I just went quiet."</span></div>
                </div>
                <div className="card">
                  <div className="share"><b>Shared with therapist</b><br/><span className="muted">"I said yes to extra work again even though I'm exhausted."</span></div>
                </div>
              </div>
              <p className="note" style={{ marginTop: '22px' }}>The same selected history also carries over if you switch therapists, or move to self-work only after finishing therapy.</p>
            </div>
          </section>

          <section className="band">
            <div className="wrap center">
              <div className="ey">THE PLATFORM, NOT TWO PRODUCTS</div>
              <h2>The same capabilities can be used at different levels of support.</h2>
              <p className="lede muted">The difference is who is involved in guiding the work — you, or you and a therapist.</p>
              <div className="actions" style={{ justifyContent: 'center', marginTop: '26px' }}>
                <button className="btn primary" onClick={() => go('signup')}>Start your independent journey</button>
                <button className="btn secondary" onClick={() => go('intake')}>Start with a professional</button>
              </div>
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* 3. HOW IT WORKS                                                           */}
        {/* ========================================================================= */}
        <div id="how" className={`page ${activeTab === 'how' ? 'active' : ''}`}>
          <section className="hero">
            <div className="wrap">
              <div className="ey">HOW IT WORKS</div>
              <h1>Different entry points. Shared capabilities.</h1>
              <div className="actions" style={{ justifyContent: 'center', marginTop: '24px' }}>
                <button className="btn primary" onClick={() => go('signup')}>Start your independent journey</button>
                <button className="btn secondary" onClick={() => go('intake')}>Start with a professional</button>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">OUR APPROACH</div>
              <h2>Clarity comes from truth, not comfort.</h2>
              <p className="lede">Three things we will never do — and why.</p>
              <div className="three" style={{ marginTop: '28px' }}>
                <div className="panel">
                  <div className="num">01</div>
                  <h3>We don't validate blindly.</h3>
                  <p className="muted">There is a version of emotional support that agrees with everything and changes nothing. It is comfortable. It is also useless. If you are writing the same entry for the fifth time with different characters, we will name the loop.</p>
                  <p className="note" style={{ marginTop: '12px' }}>"Not harshly. Not with a diagnosis. Just: this pattern has shown up before."</p>
                </div>
                <div className="panel">
                  <div className="num">02</div>
                  <h3>We don't give solutions.</h3>
                  <p className="muted">The moment we start telling you what to do, we've removed you from the equation. People don't build self-awareness by following instructions. They build it by sitting with hard questions long enough to find their own answers.</p>
                  <p className="note" style={{ marginTop: '12px' }}>"Our job is the question, not the answer."</p>
                </div>
                <div className="panel">
                  <div className="num">03</div>
                  <h3>We don't create dependency.</h3>
                  <p className="muted">This product should make itself progressively less necessary, not more. A person using it for a year should know themselves well enough that they need it less, not feel like they cannot function without checking in.</p>
                  <p className="note" style={{ marginTop: '12px' }}>"The measure of success is how clearly you see yourself without it."</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">DAY ONE</div>
              <h2>What actually happens when you sign up.</h2>
              <div className="two">
                <div className="panel">
                  <h3>Starting with self-work</h3>
                  <p className="muted">Subscribe (₹499/month), answer a few quick questions about what's on your mind, and write your first journal entry — free-flow or guided. Nothing else is required before you begin.</p>
                  <button className="btn secondary" style={{ marginTop: '16px', width: '100%' }} onClick={() => go('signup')}>Start your independent journey</button>
                </div>
                <div className="panel">
                  <h3>Starting with a therapist</h3>
                  <p className="muted">Browse therapist profiles filtered by language, gender, specialty and availability, book a first session at ₹999+ per session, and set up your dashboard together in that first session.</p>
                  <button className="btn primary" style={{ marginTop: '16px', width: '100%' }} onClick={() => go('intake')}>Start with a professional</button>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">SIDE BY SIDE</div>
              <h2>What each option actually includes.</h2>
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>Self-work</th>
                    <th>Therapist-supported</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Journal (free-flow + guided)</td><td>✓</td><td>✓</td></tr>
                  <tr><td>Weekly & monthly reports</td><td>✓</td><td>✓</td></tr>
                  <tr><td>Pattern & emotional vocabulary detection</td><td>✓</td><td>✓</td></tr>
                  <tr><td>Psychoeducation modules</td><td>Self-selected, paid per module</td><td>Therapist-assigned, paid per module</td></tr>
                  <tr><td>Licensed therapist</td><td>—</td><td>✓</td></tr>
                  <tr><td>Dashboard with session recap & homework</td><td>—</td><td>✓</td></tr>
                  <tr>
                    <td>Typical cost</td>
                    <td>₹499/month</td>
                    <td>From ₹999/session</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid var(--line)' }}>
                    <td></td>
                    <td style={{ paddingTop: '16px', paddingBottom: '16px' }}>
                      <button className="btn secondary" style={{ width: '100%', padding: '10px 16px', fontSize: '13px', borderRadius: '9999px', textAlign: 'center', justifyContent: 'center' }} onClick={() => go('signup')}>Start self-work →</button>
                    </td>
                    <td style={{ paddingTop: '16px', paddingBottom: '16px' }}>
                      <button className="btn primary" style={{ width: '100%', padding: '10px 16px', fontSize: '13px', borderRadius: '9999px', textAlign: 'center', justifyContent: 'center' }} onClick={() => go('intake')}>With a therapist →</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">WORKING ON YOURSELF</div>
              <h2>Example: “Why do I feel guilty resting instead of helping at home?”</h2>
              <div className="steps">
                <div className="step"><div className="num">01</div><h3>Journal</h3><p className="muted">Write freely, or use the guided 5-prompt journal — what happened, why, how you reacted, what you felt, and what you'd tell a friend.</p></div>
                <div className="step"><div className="num">02</div><h3>Get your report</h3><p className="muted">Weekly and monthly reports show recurring situations and the emotional vocabulary showing up most in your entries.</p></div>
                <div className="step"><div className="num">03</div><h3>See the pattern, learn</h3><p className="muted">An intervention explains the pattern in plain language. If it holds for roughly two months, a specific psychoeducation module is recommended — not forced.</p></div>
                <div className="step"><div className="num">04</div><h3>Practise & review</h3><p className="muted">Apply what you learned in real situations that week, then check the next report to see if anything shifted.</p></div>
              </div>
              <div className="two" style={{ marginTop: '38px' }}>
                <div className="panel">
                  <h3>A realistic week</h3>
                  <p className="muted">Mon–Fri: 2–3 short journal entries. Sunday: weekly report lands, 5 minutes to read. Once a pattern repeats for weeks, a module gets recommended — you decide if or when to take it.</p>
                </div>
                <div className="panel">
                  <h3>What you're not getting</h3>
                  <p className="muted">No daily notifications guilting you into writing, no automatic diagnosis, and no module purchase without you actively choosing it.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">WITH A THERAPIST</div>
              <h2>Same journal and reports. Plus a therapist, and a dashboard for both of you.</h2>
              <div className="steps">
                <div className="step"><div className="num">01</div><h3>Set goals</h3><p className="muted">Define what matters to the client in the first session or two — visible on both dashboards afterward.</p></div>
                <div className="step"><div className="num">02</div><h3>Session, then dashboard</h3><p className="muted">After each session, your dashboard shows a recap, any homework, and any psychoeducation your therapist assigned.</p></div>
                <div className="step"><div className="num">03</div><h3>Practise between sessions</h3><p className="muted">Complete homework, or journal independently — many clients keep journaling even on weeks with a session.</p></div>
                <div className="step"><div className="num">04</div><h3>Review & continue</h3><p className="muted">Every few weeks, revisit goals together. Continue, change direction, graduate, or change therapists — without losing your history.</p></div>
              </div>
              <div className="panel" style={{ marginTop: '38px' }}>
                <h3>A realistic cadence</h3>
                <p className="muted">Most clients start weekly or fortnightly, review goals every 4–6 sessions, and taper to monthly check-ins as things stabilise — your therapist adjusts this with you, not on a fixed schedule.</p>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">USE BOTH</div>
              <h2>The two sides can feed each other.</h2>
              <div className="diagram">
                <svg viewBox="0 0 700 170" role="img" aria-label="Diagram of two boxes, self-work and therapy, connected by two arrows: share an entry going from self-work to therapy, and continue practice going from therapy to self-work">
                  <rect x="30" y="45" width="230" height="80" rx="16" fill="var(--surface)" stroke="var(--line)"/>
                  <text x="145" y="90" textAnchor="middle" fontFamily="Georgia, serif" fontSize="17" fill="var(--ink)">Self-work</text>
                  <rect x="440" y="45" width="230" height="80" rx="16" fill="var(--surface)" stroke="var(--line)"/>
                  <text x="555" y="90" textAnchor="middle" fontFamily="Georgia, serif" fontSize="17" fill="var(--ink)">Therapy</text>
                  <path d="M262,70 C330,55 380,55 438,68" fill="none" stroke="var(--primary)" strokeWidth="2.5" markerEnd="url(#arrowu1)"/>
                  <text x="350" y="50" textAnchor="middle" fontFamily="Arial" fontSize="11.5" fill="var(--primary)">share a selected entry</text>
                  <path d="M438,102 C380,118 330,118 262,103" fill="none" stroke="var(--gold)" strokeWidth="2.5" markerEnd="url(#arrowu2)"/>
                  <text x="350" y="138" textAnchor="middle" fontFamily="Arial" fontSize="11.5" fill="var(--gold)">continue practice after</text>
                  <defs>
                    <marker id="arrowu1" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="var(--primary)"/></marker>
                    <marker id="arrowu2" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="var(--gold)"/></marker>
                  </defs>
                </svg>
              </div>
              <div className="two" style={{ marginTop: '20px' }}>
                <div className="panel">
                  <h3>Self-work → therapy</h3>
                  <p className="muted">E.g. three weeks of entries about a specific relative, brought into session instead of retold from memory.</p>
                </div>
                <div className="panel">
                  <h3>Therapy → self-work</h3>
                  <p className="muted">E.g. keep journaling on boundary-setting after your last session, with reports still tracking whether it holds.</p>
                </div>
              </div>
              <p className="note" style={{ marginTop: '22px' }}>Switch direction anytime — nothing is locked in.</p>
              <div className="actions" style={{ marginTop: '24px', justifyContent: 'center' }}>
                <button className="btn secondary" onClick={() => go('signup')}>Start your independent journey</button>
                <button className="btn primary" onClick={() => go('intake')}>Start with a professional</button>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">COMMON QUESTIONS</div>
              <h2>The practical stuff.</h2>
              <div className="faq">
                <details><summary>What if I miss a few days of journaling?</summary><p className="muted">Nothing happens automatically — your next report simply reflects fewer entries. There's no streak to lose or penalty for gaps.</p></details>
                <details><summary>Can I change or stop my therapist?</summary><p className="muted">Yes, anytime. You can switch therapists and choose what history moves with you, or stop therapy altogether and continue on self-work only.</p></details>
                <details><summary>Do I have to buy a psychoeducation module when it's recommended?</summary><p className="muted">No. It's a suggestion based on a repeating pattern — buying it is always your choice, in both self-work and therapy.</p></details>
                <details><summary>What happens if I pause my subscription?</summary><p className="muted">Your journal history and past reports stay saved. You won't get new weekly or monthly reports until you resume.</p></details>
                <details><summary>Can I use self-work and therapy in the same week?</summary><p className="muted">Yes — many people journal on non-session weeks and bring select entries into their next session.</p></details>
              </div>
            </div>
          </section>

          <section className="band">
            <div className="wrap center">
              <div className="ey">READY TO BEGIN?</div>
              <h2>Pick the starting point that fits you best today.</h2>
              <p className="lede muted">You can always transition between independent self-work and therapist-guided care later.</p>
              <div className="actions" style={{ justifyContent: 'center', marginTop: '26px' }}>
                <button className="btn primary" onClick={() => go('signup')}>Start your independent journey</button>
                <button className="btn secondary" onClick={() => go('intake')}>Start with a professional</button>
              </div>
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* 4. PRICING                                                                */}
        {/* ========================================================================= */}
        <div id="pricing" className={`page ${activeTab === 'pricing' ? 'active' : ''}`}>
          <section className="hero">
            <div className="wrap">
              <div className="ey">PRICING & PLANS</div>
              <h1>A monthly plan for self-work. Pay per session for therapy.</h1>
              <p className="lede">Prices shown in ₹ (INR). Pay by UPI, card or netbanking. No hidden charges.</p>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="two">
                <div className="price">
                  <div className="ey">SELF-WORK PLATFORM</div>
                  <h3>Monthly access</h3>
                  <div className="amt">₹499 <small>/ month</small></div>
                  <p className="muted">Journal (free-flow + guided), and weekly & monthly reports with pattern and emotional vocabulary tracking — included in your subscription.</p>
                  <ul className="muted" style={{ paddingLeft: '18px', margin: '6px 0' }}>
                    <li>Unlimited journal entries</li>
                    <li>Weekly & monthly reports included</li>
                    <li>Cancel anytime</li>
                  </ul>
                  <p className="note">Psychoeducation modules are priced and purchased separately, inside the app.</p>
                  <button className="btn secondary" onClick={() => go('signup')}>Start your independent journey →</button>
                </div>
                <div className="price" style={{ borderColor: 'var(--primary)' }}>
                  <div className="ey">THERAPIST-SUPPORTED</div>
                  <h3>Per session</h3>
                  <div className="amt">From ₹999 <small>/ session</small></div>
                  <p className="muted">Licensed therapist, goal setting, between-session practice and progress review. Journal and reports can be added alongside. Price can vary by therapist.</p>
                  <div className="paychips">
                    <span className="paychip">UPI</span>
                    <span className="paychip">Cards</span>
                    <span className="paychip">Netbanking</span>
                  </div>
                  <p className="note">Psychoeducation modules assigned by your therapist are priced and purchased separately.</p>
                  <button className="btn primary" onClick={() => go('intake')}>Start with a professional →</button>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">PSYCHOEDUCATION MODULES</div>
              <h2>Bought one at a time, only when it's relevant.</h2>
              <p className="lede">The plain-language explanation of a pattern is always free, as soon as it shows up — that's part of your subscription or session, not an upsell. Only the deeper, structured module is separate: on self-work, offered once a pattern has repeated for about two months; in therapy, assignable by your therapist whenever they judge it's useful. Either way, it's a one-time purchase you choose, never automatic.</p>
              <div className="two" style={{ marginTop: '26px' }}>
                <div className="panel">
                  <div className="ey">MONTH 1, SELF-WORK ONLY</div>
                  <p className="muted">₹499 subscription. That's it — modules only if you choose one later.</p>
                </div>
                <div className="panel">
                  <div className="ey">MONTH 1, THERAPY (WEEKLY)</div>
                  <p className="muted">≈₹999–1,500 × 4 sessions, depending on therapist. No subscription fee on top.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="band">
            <div className="wrap center">
              <div className="ey">CLEAR & TRANSPARENT</div>
              <h2>Ready to start your path?</h2>
              <p className="lede muted">Pick the level of guidance that matches what you need right now.</p>
              <div className="actions" style={{ justifyContent: 'center', marginTop: '24px' }}>
                <button className="btn primary" onClick={() => go('signup')}>Start your independent journey</button>
                <button className="btn secondary" onClick={() => go('intake')}>Start with a professional</button>
              </div>
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* 5. AI & DATA                                                              */}
        {/* ========================================================================= */}
        <div id="ai" className={`page ${activeTab === 'ai' ? 'active' : ''}`}>
          <section className="hero">
            <div className="wrap">
              <div className="ey">AI & DATA PRINCIPLES</div>
              <h1>AI helps connect the information. It does not become the authority.</h1>
              <p className="lede">AI can organise information, surface possible patterns and connect relevant learning. In therapist-supported care, it can help structure information for professional review.</p>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="three">
                <div className="featcard">
                  <div className="featicon">
                    <svg viewBox="0 0 64 64" fill="none" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="12" y="8" width="40" height="48" rx="6"/>
                      <line x1="20" y1="20" x2="44" y2="20"/>
                      <line x1="20" y1="29" x2="44" y2="29"/>
                      <line x1="20" y1="38" x2="36" y2="38"/>
                      <circle cx="44" cy="45" r="7"/>
                      <line x1="49" y1="50" x2="54" y2="55"/>
                    </svg>
                  </div>
                  <h3>Journal analysis</h3>
                  <p className="muted">Entries become weekly & monthly reports.</p>
                </div>
                <div className="featcard">
                  <div className="featicon">
                    <svg viewBox="0 0 64 64" fill="none" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 46 L20 30 L30 38 L44 16 L56 26" fill="none"/>
                      <circle cx="44" cy="16" r="4" fill="var(--gold)" stroke="none"/>
                      <line x1="8" y1="54" x2="56" y2="54"/>
                    </svg>
                  </div>
                  <h3>Pattern trigger</h3>
                  <p className="muted">Named for free, always — a module only after ~2 months, and only if you choose.</p>
                </div>
                <div className="featcard">
                  <div className="featicon">
                    <svg viewBox="0 0 64 64" fill="none" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="32" cy="20" r="10"/>
                      <path d="M14 54 C14 40 22 34 32 34 C42 34 50 40 50 54"/>
                      <path d="M40 44 L44 48 L52 38"/>
                    </svg>
                  </div>
                  <h3>Therapist support</h3>
                  <p className="muted">Organised for clinical review — never a diagnosis on its own.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">WHERE THE LINE SITS</div>
              <h2>AI organises the information. A person decides what it means.</h2>
              <div className="diagram">
                <svg viewBox="0 0 700 260" role="img" aria-label="Diagram showing journal entries flow through AI steps of read, tag and aggregate inside an AI zone, then cross a boundary into a human zone where you or your therapist interpret and decide">
                  <rect x="10" y="20" width="430" height="220" rx="16" fill="var(--primary-soft)"/>
                  <rect x="460" y="20" width="230" height="220" rx="16" fill="#fff8fb" stroke="var(--primary)" strokeWidth="1.5"/>
                  <text x="30" y="45" fontFamily="Arial" fontSize="11" fontWeight="700" letterSpacing="1" fill="var(--gold)">AI ZONE</text>
                  <text x="480" y="45" fontFamily="Arial" fontSize="11" fontWeight="700" letterSpacing="1" fill="var(--primary)">HUMAN ZONE</text>
                  <rect x="30" y="65" width="110" height="60" rx="10" fill="var(--surface)" stroke="var(--line)"/>
                  <text x="85" y="99" textAnchor="middle" fontFamily="Georgia, serif" fontSize="13" fill="var(--ink)">Read</text>
                  <rect x="165" y="65" width="110" height="60" rx="10" fill="var(--surface)" stroke="var(--line)"/>
                  <text x="220" y="99" textAnchor="middle" fontFamily="Georgia, serif" fontSize="13" fill="var(--ink)">Tag</text>
                  <rect x="300" y="65" width="120" height="60" rx="10" fill="var(--surface)" stroke="var(--line)"/>
                  <text x="360" y="99" textAnchor="middle" fontFamily="Georgia, serif" fontSize="13" fill="var(--ink)">Aggregate</text>
                  <path d="M140,95 L165,95" stroke="var(--muted)" strokeWidth="2" markerEnd="url(#arrow)"/>
                  <path d="M275,95 L300,95" stroke="var(--muted)" strokeWidth="2" markerEnd="url(#arrow)"/>
                  <rect x="90" y="160" width="270" height="55" rx="10" fill="var(--surface)" stroke="var(--line)"/>
                  <text x="225" y="192" textAnchor="middle" fontFamily="Georgia, serif" fontSize="13" fill="var(--ink)">Possible pattern surfaced</text>
                  <path d="M220,125 L220,160" stroke="var(--muted)" strokeWidth="2" markerEnd="url(#arrow)"/>
                  <path d="M360,215 C400,235 430,235 460,180" fill="none" stroke="var(--primary)" strokeWidth="2.5" markerEnd="url(#arrowp)"/>
                  <rect x="500" y="90" width="160" height="55" rx="10" fill="var(--surface)" stroke="var(--primary)"/>
                  <text x="580" y="112" textAnchor="middle" fontFamily="Georgia, serif" fontSize="12.5" fill="var(--ink)">You interpret it</text>
                  <text x="580" y="130" textAnchor="middle" fontFamily="Georgia, serif" fontSize="12.5" fill="var(--ink)">— or your therapist</text>
                  <text x="580" y="185" textAnchor="middle" fontFamily="Arial" fontSize="11" fill="var(--muted)">No diagnosis. No auto-treatment.</text>
                  <text x="580" y="200" textAnchor="middle" fontFamily="Arial" fontSize="11" fill="var(--muted)">Decision stays with a person.</text>
                  <defs>
                    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--muted)"/></marker>
                    <marker id="arrowp" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--primary)"/></marker>
                  </defs>
                </svg>
              </div>
              <div className="cards" style={{ marginTop: '34px' }}>
                <div className="card"><h3>No diagnosis</h3></div>
                <div className="card"><h3>No autonomous treatment</h3></div>
                <div className="card"><h3>No invisible path</h3></div>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">DATA & PRIVACY</div>
              <h2>Continuity needs trust.</h2>
              <p className="lede">The platform may hold emotional experiences, self-work, goals, progress and therapy-related information. The Privacy Notice will set out, in full, what's collected, why, who can access it (including therapists), how AI processes it, how long it's kept, and how India's data protection law applies.</p>
              <div className="faq">
                <details><summary>Can I keep self-work private?</summary><p className="muted">Yes. Self-work is private by default, including from family — the intended model supports private self-work and explicit sharing into professional care.</p></details>
                <details><summary>Can I choose what goes to a new therapist?</summary><p className="muted">Yes. The continuity model is designed around selecting the relevant history instead of transferring everything automatically.</p></details>
                <details><summary>Is everything processed by AI?</summary><p className="muted">AI use depends on the feature. The Privacy Notice will state exactly what is processed and for what purpose.</p></details>
              </div>
            </div>
          </section>

          <section className="band">
            <div className="wrap center">
              <div className="ey">YOUR DATA, YOUR CHOICE</div>
              <h2>Private by default. Supported on your terms.</h2>
              <p className="lede muted">Begin with independent self-work or connect with a licensed professional.</p>
              <div className="actions" style={{ justifyContent: 'center', marginTop: '26px' }}>
                <button className="btn primary" onClick={() => go('signup')}>Start your independent journey</button>
                <button className="btn secondary" onClick={() => go('intake')}>Start with a professional</button>
              </div>
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* 6. EVIDENCE                                                               */}
        {/* ========================================================================= */}
        <div id="evidence" className={`page ${activeTab === 'evidence' ? 'active' : ''}`}>
          <section className="hero">
            <div className="wrap">
              <div className="ey">EVIDENCE & RESEARCH</div>
              <h1>Why these building blocks make sense.</h1>
              <p className="lede">Ingress Within combines several evidence-informed mechanisms rather than presenting one feature as a complete answer.</p>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">DIGITAL PSYCHOLOGICAL INTERVENTIONS</div>
              <h2>Structured online psychological work can help some people.</h2>
              <p className="lede">A 2024 meta-analysis of 154 randomised controlled trials involving 45,335 participants found sustained effects for internet-delivered CBT across several outcomes, with results varying by intervention, outcome and guidance.</p>
              <p><a className="research" href="https://pubmed.ncbi.nlm.nih.gov/39579466/" target="_blank" rel="noopener noreferrer">Read the study →</a></p>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">PRACTICE</div>
              <h2>Learning needs a chance to become behaviour.</h2>
              <p className="lede">A systematic review of between-session homework highlights the value of collaboratively planning, explaining and reviewing tasks. That supports making practice central to the product.</p>
              <p><a className="research" href="https://pubmed.ncbi.nlm.nih.gov/37104804/" target="_blank" rel="noopener noreferrer">Read the review →</a></p>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">THERAPEUTIC RELATIONSHIP</div>
              <h2>The platform supports the therapist; it does not replace the relationship.</h2>
              <p className="lede">A large meta-analysis found a positive association between therapeutic alliance and psychotherapy outcomes, including internet-based psychotherapy.</p>
              <p><a className="research" href="https://pubmed.ncbi.nlm.nih.gov/29792475/" target="_blank" rel="noopener noreferrer">Read the meta-analysis →</a></p>
            </div>
          </section>

          <section className="band">
            <div className="wrap center">
              <div className="ey">LIMITS</div>
              <h2>Evidence for an approach is not proof that this exact product works.</h2>
              <p className="lede muted">We keep those claims separate as our own evidence develops. You can start either way.</p>
              <div className="actions" style={{ justifyContent: 'center', marginTop: '26px' }}>
                <button className="btn primary" onClick={() => go('signup')}>Start your independent journey</button>
                <button className="btn secondary" onClick={() => go('intake')}>Start with a professional</button>
              </div>
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* 7. ABOUT                                                                  */}
        {/* ========================================================================= */}
        <div id="about" className={`page ${activeTab === 'about' ? 'active' : ''}`}>
          <section className="hero">
            <div className="wrap">
              <div className="ey">ABOUT INGRESS WITHIN</div>
              <h1>One place for the different ways people work on their psychological health.</h1>
              <p className="lede">Sometimes you want to work on something yourself. Sometimes you want a therapist. Sometimes you want both. Ingress Within is built around that reality rather than forcing one route.</p>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">BUILT FOR INDIA</div>
              <h2>People often start with life, not clinical terminology.</h2>
              <p className="lede">“I'm overthinking.” “I can't say no.” “My career is stressing me out.” “My relationship keeps repeating the same fight.” “I have everything, so why don't I feel okay?” The language can start there while the psychological depth sits underneath it.</p>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">WHO'S BEHIND THIS</div>
              <h2>Care from qualified professionals.</h2>
              <div className="trust">
                <div className="card"><h3>Verified therapist profiles</h3><p className="muted">Every therapist's qualifications and experience are reviewed before they're listed, and shown on their profile so you know who you're speaking with.</p></div>
                <div className="card"><h3>You choose your therapist</h3><p className="muted">Browse profiles and areas of focus before you book — nobody is assigned to you without a choice.</p></div>
                <div className="card"><h3>Built with real conversations</h3><p className="muted">Features are shaped by talking to people who journal, and people who've been in therapy in India — not designed in a vacuum.</p></div>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">PRIVATE, EVEN FROM FAMILY</div>
              <h2>What you share here stays yours to share.</h2>
              <p className="lede">Self-work stays private by default. Nobody — including family members — can see it unless you choose to share it, and a therapist only sees what you explicitly bring into session.</p>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">COMMON QUESTIONS</div>
              <h2>Before you start.</h2>
              <div className="faq">
                <details><summary>Do I need to know if I want self-work or therapy?</summary><p className="muted">No. Start with whichever feels easier, and switch or combine them whenever you want.</p></details>
                <details><summary>Is this only for people with a diagnosed condition?</summary><p className="muted">No. Most people here are dealing with everyday emotional patterns — stress, guilt, overthinking, family or work pressure — before they build into something bigger, not a diagnosed disorder.</p></details>
                <details><summary>Can my family see what I write?</summary><p className="muted">No. Your journal and self-work stay private by default, and nothing is shared without you choosing to.</p></details>
                <details><summary>Do I need to speak English?</summary><p className="muted">English is supported at launch, with Hindi and other Indian languages planned next.</p></details>
                <details><summary>What if I want to stop?</summary><p className="muted">You can cancel your self-work subscription anytime, and you're never locked into ongoing therapy sessions.</p></details>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">WHY NOW</div>
              <h2>This conversation is already happening around you.</h2>
              <p className="lede">More people in India are talking openly about burnout, overthinking and family pressure than five years ago — in the news, at work, among friends. What's often missing isn't awareness, it's a place to actually work through it at your own pace, privately, without waiting for a crisis.</p>
            </div>
          </section>

          <section className="band">
            <div className="wrap center">
              <div className="ey">UNDERSTAND. GROW. CONTINUE.</div>
              <h2>If any of this sounded familiar, that's the point to start.</h2>
              <div className="actions" style={{ justifyContent: 'center', marginTop: '26px' }}>
                <button className="btn primary" onClick={() => go('signup')}>Start your independent journey</button>
                <button className="btn secondary" onClick={() => go('intake')}>Start with a professional</button>
              </div>
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* 8. POLICIES                                                               */}
        {/* ========================================================================= */}
        <div id="policies" className={`page ${activeTab === 'policies' ? 'active' : ''}`}>
          <section className="hero">
            <div className="wrap">
              <div className="ey">POLICIES & LEGAL</div>
              <h1>Privacy, terms & refunds.</h1>
              <p className="lede">These are working drafts, shared for transparency ahead of launch. Final versions will be reviewed by legal counsel and linked here before the platform goes live.</p>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">PRIVACY POLICY</div>
              <h2>What we collect and how it's used.</h2>
              <p className="lede">Will cover: what's collected (journal entries, session information, payment details), why it's collected, who can access it, how AI is used, how long data is retained, how to request deletion, and your rights under applicable Indian data protection law.</p>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">TERMS OF USE</div>
              <h2>What using the platform means.</h2>
              <p className="lede">Will cover: eligibility, account responsibilities, acceptable use, the role of AI-generated content and reports, therapist-client conduct, and limitation of liability.</p>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">CANCELLATION & REFUND POLICY</div>
              <h2>Rescheduling, not refunds, for therapy sessions.</h2>
              <p className="lede">In line with standard practice across therapy platforms in India, individual therapy sessions are not eligible for a refund once booked — a therapist has reserved that time for you. You can reschedule free of charge if you do so at least 24 hours before your session; the same applies if your therapist needs to reschedule. Cancellations within 24 hours, or no-shows, forfeit that session. The monthly self-work subscription can be cancelled anytime for future billing cycles, but part-used months are not refunded. Psychoeducation modules are non-refundable once purchased. Exceptions may be considered case by case for genuine emergencies, and nothing here limits your rights under the Consumer Protection Act, 2019.</p>
            </div>
          </section>

          <section>
            <div className="wrap center">
              <p className="note">Questions about any policy before it's finalised? <a href="mailto:hello@ingresswithin.com?subject=Question%20about%20policies" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'underline' }}>Write to hello@ingresswithin.com →</a></p>
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* 9. CONTACT / START HERE                                                   */}
        {/* ========================================================================= */}
        <div id="contact" className={`page ${activeTab === 'contact' ? 'active' : ''}`}>
          <section className="hero">
            <div className="wrap center">
              <div className="ey">START HERE</div>
              <h1>What would be useful to you right now?</h1>
              <p className="lede">Choose the kind of work or support you want today — no required order.</p>
            </div>
          </section>

          <section>
            <div className="three wrap">
              <div className="panel">
                <div className="ey">WORK ON YOURSELF</div>
                <h3>I want to work on something independently.</h3>
                <p className="muted">Start with the journal, weekly reports and pattern detection.</p>
                <button className="btn primary" onClick={() => go('signup')}>Start your independent journey →</button>
              </div>
              <div className="panel">
                <div className="ey">WITH A THERAPIST</div>
                <h3>I want professional support.</h3>
                <p className="muted">See goals, dashboard, homework, psychoeducation and continuity.</p>
                <button className="btn primary" onClick={() => go('intake')}>Start with a professional →</button>
              </div>
              <div className="panel">
                <div className="ey">USE BOTH</div>
                <h3>I want the two to work together.</h3>
                <p className="muted">Bring selected self-work into therapy and continue therapist-guided learning independently.</p>
                <button className="btn primary" onClick={() => go('how')}>Show me how it connects</button>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <div className="ey">NOT SURE WHICH ONE YET?</div>
              <h2>Talk to us first — no commitment, no charge.</h2>
              <p className="lede">If you're not sure whether you need self-work, a therapist, or just want to understand the platform before deciding anything, this is for that. It's a short call or an email, not a therapy session — nothing is booked or charged from this.</p>
              <div className="two" style={{ alignItems: 'start', marginTop: '34px' }}>
                <div className="panel">
                  <div className="ey">PICK A SLOT</div>
                  <h3>Book a free 15-minute orientation call.</h3>
                  <p className="muted">We'll ask a few questions about what's going on and explain which option — self-work, therapy, or both — is likely to fit, so you're not guessing.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
                    <div>
                      <label className="note" htmlFor="orient-date" style={{ display: 'block', marginBottom: '6px' }}>DATE</label>
                      <input id="orient-date" type="date" style={{ width: '100%', padding: '12px', border: '1px solid var(--line)', borderRadius: '10px', background: 'var(--bg)', font: 'inherit', color: 'var(--ink)' }}/>
                    </div>
                    <div>
                      <label className="note" htmlFor="orient-time" style={{ display: 'block', marginBottom: '6px' }}>TIME</label>
                      <select id="orient-time" style={{ width: '100%', padding: '12px', border: '1px solid var(--line)', borderRadius: '10px', background: 'var(--bg)', font: 'inherit', color: 'var(--ink)' }}>
                        <option>10:00 AM</option>
                        <option>12:00 PM</option>
                        <option>3:00 PM</option>
                        <option>5:30 PM</option>
                        <option>7:00 PM</option>
                      </select>
                    </div>
                  </div>
                  <button className="btn primary" style={{ marginTop: '16px', width: '100%' }} onClick={() => alert('This is a preview — booking will be connected to a live calendar before launch.')}>Reserve my free call</button>
                </div>
                <div className="panel">
                  <div className="ey">OR WRITE TO US</div>
                  <h3>Prefer email?</h3>
                  <p className="muted">Tell us a little about what's going on — we'll reply with what we'd suggest, within one business day. No pressure to sign up for anything.</p>
                  <a href="mailto:hello@ingresswithin.com?subject=Not%20sure%20where%20to%20start" style={{ display: 'inline-block', marginTop: '16px', padding: '11px 19px', border: '1px solid var(--primary)', borderRadius: '28px', color: 'var(--primary)', fontWeight: '700' }}>hello@ingresswithin.com →</a>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* 10. SIGNUP                                                                */}
        {/* ========================================================================= */}
        <div id="signup" className={`page ${activeTab === 'signup' ? 'active' : ''}`}>
          <section className="hero">
            <div className="wrap center">
              <div className="ey">SELF-WORK PLATFORM</div>
              <h1>Create your account.</h1>
              <p className="lede">Set up your login, then start your first journal entry — free-flow or guided.</p>
            </div>
          </section>

          <section>
            <div className="wrap" style={{ maxWidth: '480px', margin: 'auto' }}>
              <div className="panel">
                <label className="flabel" htmlFor="su-name">FULL NAME</label>
                <input className="field" id="su-name" name="name" type="text" placeholder="Your name" autoComplete="name"/>
                <div style={{ marginTop: '16px' }}>
                  <label className="flabel" htmlFor="su-contact">EMAIL OR MOBILE NUMBER</label>
                  <input className="field" id="su-contact" name="contact" type="text" placeholder="you@email.com or 98765 43210" autoComplete="email"/>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <label className="flabel" htmlFor="su-pass">CREATE PASSWORD</label>
                  <input className="field" id="su-pass" name="password" type="password" placeholder="••••••••" autoComplete="new-password"/>
                </div>
                <button className="btn primary" style={{ marginTop: '20px', width: '100%' }} onClick={() => alert('This is a preview — account creation and payment (₹499/month) will be connected before launch.')}>Create account & continue</button>
                <p className="note" style={{ marginTop: '14px', textAlign: 'center' }}>You'll set up payment (₹499/month) on the next step. Cancel anytime.</p>
                <p className="note" style={{ marginTop: '10px', textAlign: 'center' }}>This isn't a crisis service. If you need help right now, <a onClick={() => go('crisis')} style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer' }}>see crisis resources →</a></p>
              </div>
              <p className="note center" style={{ marginTop: '20px', textAlign: 'center' }}>Already have an account? <a onClick={() => alert('Preview only — login will be connected before launch.')} style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer' }}>Log in</a></p>
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* 11. INTAKE                                                                */}
        {/* ========================================================================= */}
        <div id="intake" className={`page ${activeTab === 'intake' ? 'active' : ''}`}>
          <section className="hero">
            <div className="wrap center">
              <div className="ey">THERAPIST INTAKE</div>
              <h1>Tell us a bit about you.</h1>
              <p className="lede">A few quick questions so we can match you with the right therapist. Takes about 2 minutes — no commitment yet.</p>
            </div>
          </section>

          <section>
            <div className="wrap" style={{ maxWidth: '620px', margin: 'auto' }}>
              <div className="panel">
                <div className="fgrid">
                  <div>
                    <label className="flabel" htmlFor="in-name">FULL NAME</label>
                    <input className="field" id="in-name" name="name" type="text" placeholder="Your name" autoComplete="name"/>
                  </div>
                  <div>
                    <label className="flabel" htmlFor="in-contact">EMAIL OR MOBILE NUMBER</label>
                    <input className="field" id="in-contact" name="contact" type="text" placeholder="you@email.com or 98765 43210" autoComplete="email"/>
                  </div>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <span className="flabel" id="in-support-label">WHAT WOULD YOU LIKE SUPPORT WITH? (SELECT ANY)</span>
                  <div className="chips" role="group" aria-labelledby="in-support-label" style={{ marginTop: '8px' }}>
                    <button type="button" className="selchip" aria-pressed="false" onClick={toggleChip}>Anxiety & overthinking</button>
                    <button type="button" className="selchip" aria-pressed="false" onClick={toggleChip}>Family & relationships</button>
                    <button type="button" className="selchip" aria-pressed="false" onClick={toggleChip}>Work & career stress</button>
                    <button type="button" className="selchip" aria-pressed="false" onClick={toggleChip}>Grief or loss</button>
                    <button type="button" className="selchip" aria-pressed="false" onClick={toggleChip}>Low mood</button>
                    <button type="button" className="selchip" aria-pressed="false" onClick={toggleChip}>Not sure yet</button>
                  </div>
                </div>
                <div className="fgrid">
                  <div>
                    <label className="flabel" htmlFor="in-lang">PREFERRED LANGUAGE</label>
                    <select className="field" id="in-lang">
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Marathi</option>
                      <option>Tamil</option>
                      <option>Bengali</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="flabel" htmlFor="in-gender">THERAPIST GENDER PREFERENCE</label>
                    <select className="field" id="in-gender">
                      <option>No preference</option>
                      <option>Female</option>
                      <option>Male</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <label className="flabel" htmlFor="in-prior">HAVE YOU BEEN IN THERAPY BEFORE?</label>
                  <select className="field" id="in-prior">
                    <option>No, this is my first time</option>
                    <option>Yes, in the past</option>
                    <option>Yes, currently with someone else</option>
                  </select>
                </div>
                <button className="btn primary" style={{ marginTop: '20px', width: '100%' }} onClick={() => alert('This is a preview — this will submit to our matching team and show suggested therapists before launch.')}>Submit & see matched therapists</button>
                <p className="note" style={{ marginTop: '14px', textAlign: 'center' }}>First session from ₹999. No package required — pay per session.</p>
                <p className="note" style={{ marginTop: '10px', textAlign: 'center' }}>Booking a session takes a few days to arrange. If you're in crisis right now, please don't wait for it — <a onClick={() => go('crisis')} style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer' }}>see immediate help here →</a></p>
              </div>
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* 12. CRISIS                                                                */}
        {/* ========================================================================= */}
        <div id="crisis" className={`page ${activeTab === 'crisis' ? 'active' : ''}`}>
          <section className="hero">
            <div className="wrap center">
              <div className="ey" style={{ borderColor: 'rgba(154, 66, 50, 0.55)', color: '#9A4232' }}>EMERGENCY RESOURCES · 24×7</div>
              <h1>If you're in crisis, start here — not on the rest of this site.</h1>
              <p className="lede">Ingress Within is a self-work and therapist-booking platform. It is not built or staffed to respond in real time, so it can't be your safety net in an emergency. The services below can.</p>
            </div>
          </section>

          <section>
            <div className="wrap" style={{ maxWidth: '760px', margin: 'auto' }}>
              <div className="crisis-box">
                <h3>If there is immediate danger to life</h3>
                <p className="muted">Call <b>112</b> (national emergency number) or go to the nearest hospital emergency room.</p>
                <div className="helpline"><b>Tele MANAS (Govt. of India)</b><span className="muted">14416 or 1-800-891-4416 · 24×7 · many languages</span></div>
                <div className="helpline"><b>AASRA</b><span className="muted">+91 98204 66726 · 24×7</span></div>
                <div className="helpline"><b>Vandrevala Foundation</b><span className="muted">1860-266-2345 · 24×7 · call, chat & WhatsApp</span></div>
                <div className="helpline"><b>iCall (TISS)</b><span className="muted">+91 9152987821 · Mon–Sat, 8am–10pm · phone & email counselling</span></div>
                <p className="note" style={{ marginTop: '16px' }}>Ingress Within does not operate these helplines and can't guarantee wait times or availability — they're independent services included here for your safety. If one line is busy, please try another or call 112.</p>
              </div>
              <p className="lede" style={{ marginTop: '30px' }}>Once you're safe and want to think about ongoing support, <a onClick={() => go('contact')} style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer' }}>come back and explore the platform</a> — no rush.</p>
            </div>
          </section>
        </div>
      </main>

      <footer>
        <div className="wrap foot">
          <div>
            <div className="logo" onClick={() => go('home')}>
              <svg className="mark" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M32,34 C32,28 27,24 22,26 C16,28 15,36 20,40 C25,44 33,42 35,35 C37,27 30,20 22,21" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round"/>
                <line x1="22" y1="21" x2="18" y2="10" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="16" cy="7" r="5" fill="var(--primary)"/>
                <line x1="35" y1="35" x2="46" y2="30" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="49" cy="28" r="5" fill="var(--thistle)"/>
                <line x1="20" y1="40" x2="14" y2="50" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="11" cy="53" r="5" fill="var(--fog)"/>
              </svg>
              Ingress Within
            </div>
            <p className="muted">Understand. Grow. Continue.</p>
            <p className="muted">One platform for different ways of working on your mental health.</p>
          </div>
          <div>
            <b>Explore</b>
            <p>
              <a onClick={() => go('signup')}>Start independent journey</a><br/>
              <a onClick={() => go('intake')}>Start with a professional</a><br/>
              <a onClick={() => go('solution')}>Our solution</a><br/>
              <a onClick={() => go('how')}>How it works</a><br/>
              <a onClick={() => go('pricing')}>Pricing</a><br/>
              <a onClick={() => go('contact')}>Start here</a>
            </p>
          </div>
          <div>
            <b>Trust</b>
            <p>
              <a onClick={() => go('ai')}>AI & data</a><br/>
              <a onClick={() => go('evidence')}>Evidence & research</a><br/>
              <a onClick={() => go('about')}>About</a><br/>
              <a onClick={() => go('crisis')}>In crisis right now?</a>
            </p>
          </div>
          <div>
            <b>Legal</b>
            <p>
              <a onClick={() => go('policies')}>Privacy policy</a><br/>
              <a onClick={() => go('policies')}>Terms of use</a><br/>
              <a onClick={() => go('policies')}>Refund policy</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
