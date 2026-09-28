'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Home,
  BookOpen,
  Compass,
  Sparkles,
  ShoppingBag,
  Library,
  Search,
  Bell,
  ArrowRight,
  Edit3,
  Mic,
  Shuffle,
  Lock
} from 'lucide-react';

export default function DashboardScrollPreview({ onActionClick }) {
  const containerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight || 800;

            // Start rising when container approaches viewport bottom
            // Reach full upright position when container top reaches 30% from the viewport top
            const start = windowHeight * 0.95;
            const end = windowHeight * 0.25;
            const progress = Math.min(Math.max((start - rect.top) / (start - end), 0), 1);
            setScrollProgress(progress);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Smooth transform values calculated directly from scroll position
  const translateY = Math.round((1 - scrollProgress) * 55);
  const rotateX = ((1 - scrollProgress) * 7.5).toFixed(1);
  const scale = (0.97 + 0.03 * scrollProgress).toFixed(3);
  const shadowSpread = Math.round(30 + scrollProgress * 40);
  const shadowOpacity = (0.12 + scrollProgress * 0.08).toFixed(2);

  return (
    <div
      ref={containerRef}
      className="w-full [perspective:1400px] select-none relative"
    >
      {/* Soft ambient watercolor glow behind the dashboard */}
      <div className="absolute -inset-4 sm:-inset-8 bg-gradient-to-b from-[#8AA688]/20 via-[#795663]/10 to-transparent rounded-[36px] blur-2xl pointer-events-none -z-10" />

      {/* Outer frame: solid opaque background and upward shadow to physically cover text beneath */}
      <div
        style={{
          transform: `perspective(1400px) translateY(${translateY}px) rotateX(${rotateX}deg) scale(${scale})`,
          boxShadow: `0 -18px 45px -10px rgba(22, 39, 35, 0.16), 0 28px ${shadowSpread}px -12px rgba(22, 39, 35, ${shadowOpacity})`,
          transition: 'box-shadow 0.3s ease-out'
        }}
        className="w-full p-2 sm:p-3 rounded-[28px] sm:rounded-[36px] bg-[#FAF7F2] border border-[#D5CBC0] text-left relative"
      >
        {/* Inner Window Container */}
        <div className="w-full rounded-[20px] sm:rounded-[28px] border border-[#2D3748]/25 bg-[#FAF7F2] overflow-hidden relative shadow-inner">
          
          <div className="flex flex-col md:flex-row min-h-[580px] bg-[#FAF7F2]">
            
            {/* 1. LEFT SIDEBAR */}
            <aside className="w-full md:w-[210px] lg:w-[230px] bg-[#F4EFEA]/80 border-b md:border-b-0 md:border-r border-[#E7DECF] p-5 flex flex-col justify-between shrink-0">
              <div className="space-y-6">
                
                {/* Traffic lights (macOS dots) */}
                <div className="flex items-center gap-2 pt-1 pb-1">
                  <span className="w-3 h-3 rounded-full bg-[#E07A5F] border border-[#C6654C] inline-block shadow-2xs" />
                  <span className="w-3 h-3 rounded-full bg-[#E9C46A] border border-[#CEA84E] inline-block shadow-2xs" />
                  <span className="w-3 h-3 rounded-full bg-[#81B29A] border border-[#689880] inline-block shadow-2xs" />
                </div>

                {/* Brand mark */}
                <div className="flex items-center gap-3 pt-1">
                  <img
                    src="/logo-mark-transparent.png"
                    alt="Ingress Within"
                    className="w-8 h-8 object-contain shrink-0"
                  />
                  <div>
                    <div className="font-editorial text-sm font-semibold tracking-wider text-[#162723] leading-tight">
                      Ingress
                    </div>
                    <div className="font-editorial text-xs tracking-widest text-[#795663] leading-none">
                      Within
                    </div>
                  </div>
                </div>

                {/* Navigation Items */}
                <nav className="space-y-1.5 pt-2" aria-label="Dashboard preview menu">
                  <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#E2EAE4] text-[#162723] font-zen text-xs font-semibold cursor-default">
                    <Home className="w-4 h-4 text-[#2E7A70]" />
                    <span>Home</span>
                  </div>

                  <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-[#5C6873] hover:text-[#162723] hover:bg-[#EAE4DC]/50 font-zen text-xs transition-colors cursor-pointer">
                    <BookOpen className="w-4 h-4 text-[#7D8E87]" />
                    <span>Journal</span>
                  </div>

                  <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-[#5C6873] hover:text-[#162723] hover:bg-[#EAE4DC]/50 font-zen text-xs transition-colors cursor-pointer">
                    <Compass className="w-4 h-4 text-[#7D8E87]" />
                    <span>Journeys</span>
                  </div>

                  <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-[#5C6873] hover:text-[#162723] hover:bg-[#EAE4DC]/50 font-zen text-xs transition-colors cursor-pointer">
                    <Sparkles className="w-4 h-4 text-[#7D8E87]" />
                    <span>Insights</span>
                  </div>

                  <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-[#5C6873] hover:text-[#162723] hover:bg-[#EAE4DC]/50 font-zen text-xs transition-colors cursor-pointer">
                    <ShoppingBag className="w-4 h-4 text-[#7D8E87]" />
                    <span>Therapy</span>
                  </div>

                  <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-[#5C6873] hover:text-[#162723] hover:bg-[#EAE4DC]/50 font-zen text-xs transition-colors cursor-pointer">
                    <Library className="w-4 h-4 text-[#7D8E87]" />
                    <span>Library</span>
                  </div>
                </nav>
              </div>

              {/* Sidebar Footer Callout */}
              <div className="pt-8 md:pt-12">
                <p className="font-editorial text-xs italic text-[#7D8E87] leading-relaxed">
                  Progress looks different for everyone.
                </p>
              </div>
            </aside>

            {/* 2. MAIN WORKSPACE / CENTER AREA */}
            <main className="flex-1 p-5 sm:p-7 lg:p-8 space-y-6 overflow-hidden">
              {/* Top Toolbar */}
              <div className="flex items-center justify-between gap-4">
                <div />
                <div className="flex items-center gap-3.5">
                  <div className="flex items-center gap-2 bg-white/85 border border-[#E7DECF] rounded-full px-3.5 py-1.5 shadow-2xs">
                    <Search className="w-3.5 h-3.5 text-[#7D8E87]" />
                    <span className="font-zen text-xs text-[#7D8E87]">Search...</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/85 border border-[#E7DECF] flex items-center justify-center text-[#5C6873] shadow-2xs relative">
                    <Bell className="w-3.5 h-3.5" />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#795663] rounded-full" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#E5DFD7] border border-[#D5CFC5] text-[#162723] font-editorial text-xs font-semibold flex items-center justify-center shadow-2xs">
                    A
                  </div>
                </div>
              </div>

              {/* Greeting Header */}
              <div className="space-y-1">
                <h2 className="font-editorial text-2xl sm:text-3xl lg:text-[34px] text-[#162723] font-normal leading-tight">
                  Good morning, Alex.
                </h2>
                <p className="font-zen text-xs sm:text-sm text-[#5C6873]">
                  How are you feeling today?
                </p>
              </div>

              {/* Prompt Input Box Card */}
              <div className="rounded-2xl p-4 sm:p-5 bg-white/90 border border-[#E7DECF] shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-3 bg-[#FAF7F2] border border-[#E7DECF]/80 rounded-xl px-4 py-3.5">
                  <span className="font-zen text-xs sm:text-sm text-[#7D8E87]">
                    What's on your mind right now?
                  </span>
                  <button
                    type="button"
                    onClick={onActionClick}
                    className="w-8 h-8 rounded-full bg-[#162723] hover:bg-[#2A3A3E] text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer shrink-0"
                    aria-label="Submit reflection"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Action Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onActionClick}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E7DECF] hover:border-[#795663]/40 font-zen text-[11px] text-[#5C6873] hover:text-[#162723] transition-all cursor-pointer shadow-2xs"
                  >
                    <Edit3 className="w-3 h-3 text-[#795663]" />
                    <span>Write</span>
                  </button>
                  <button
                    type="button"
                    onClick={onActionClick}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E7DECF] hover:border-[#795663]/40 font-zen text-[11px] text-[#5C6873] hover:text-[#162723] transition-all cursor-pointer shadow-2xs"
                  >
                    <Mic className="w-3 h-3 text-[#2E7A70]" />
                    <span>Voice</span>
                  </button>
                  <button
                    type="button"
                    onClick={onActionClick}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E7DECF] hover:border-[#795663]/40 font-zen text-[11px] text-[#5C6873] hover:text-[#162723] transition-all cursor-pointer shadow-2xs"
                  >
                    <Shuffle className="w-3 h-3 text-[#B8964A]" />
                    <span>Guided</span>
                  </button>
                  <button
                    type="button"
                    onClick={onActionClick}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E7DECF] hover:border-[#795663]/40 font-zen text-[11px] text-[#5C6873] hover:text-[#162723] transition-all cursor-pointer shadow-2xs"
                  >
                    <Lock className="w-3 h-3 text-[#4A6D88]" />
                    <span>Private</span>
                  </button>
                </div>
              </div>

              {/* "Your Patterns" Connected Graph Card */}
              <div className="rounded-2xl p-5 sm:p-6 bg-white/90 border border-[#E7DECF] shadow-xs space-y-4">
                <div>
                  <h3 className="font-editorial text-base sm:text-lg font-medium text-[#162723]">
                    Your Patterns
                  </h3>
                  <p className="font-zen text-xs text-[#5C6873]">
                    Connections from your recent reflections
                  </p>
                </div>

                {/* Node Graph SVG Visual */}
                <div className="w-full pt-2">
                  <svg
                    viewBox="0 0 540 220"
                    className="w-full h-auto overflow-visible select-none"
                    aria-label="Connected graph of personal reflection patterns"
                  >
                    <defs>
                      <linearGradient id="curve-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2E7A70" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#8B4A58" stopOpacity="0.45" />
                      </linearGradient>
                      <linearGradient id="curve-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4A6D88" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#8B4A58" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>

                    {/* Interconnecting bezier lines */}
                    <path
                      d="M 230 45 C 270 50, 260 85, 270 95"
                      fill="none"
                      stroke="#C7BCAC"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    <path
                      d="M 120 160 C 180 180, 230 110, 270 95"
                      fill="none"
                      stroke="url(#curve-gradient-2)"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M 230 45 C 160 80, 140 130, 120 160"
                      fill="none"
                      stroke="#D8CFBF"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M 270 95 C 310 80, 350 75, 380 98"
                      fill="none"
                      stroke="#C7BCAC"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M 270 95 C 290 140, 330 165, 360 180"
                      fill="none"
                      stroke="#D8CFBF"
                      strokeWidth="1.4"
                    />
                    <path
                      d="M 380 98 C 400 130, 390 160, 360 180"
                      fill="none"
                      stroke="#C7BCAC"
                      strokeWidth="1.3"
                      strokeDasharray="2 2"
                    />

                    {/* Node 1: Overthinking */}
                    <g className="cursor-pointer">
                      <circle cx="230" cy="45" r="7" fill="#2E7A70" />
                      <circle cx="230" cy="45" r="13" fill="#2E7A70" fillOpacity="0.18" />
                      <text
                        x="230"
                        y="26"
                        textAnchor="middle"
                        className="font-zen text-[11px] fill-[#162723] font-medium"
                      >
                        Overthinking
                      </text>
                    </g>

                    {/* Node 2: Anxiety (Center) */}
                    <g className="cursor-pointer">
                      <circle cx="270" cy="95" r="8" fill="#8B4A58" />
                      <circle cx="270" cy="95" r="14" fill="#8B4A58" fillOpacity="0.2" />
                      <text
                        x="290"
                        y="85"
                        className="font-zen text-[11px] fill-[#162723] font-medium"
                      >
                        Anxiety
                      </text>
                    </g>

                    {/* Node 3: Self-doubt */}
                    <g className="cursor-pointer">
                      <circle cx="380" cy="98" r="7" fill="#795663" />
                      <circle cx="380" cy="98" r="13" fill="#795663" fillOpacity="0.18" />
                      <text
                        x="406"
                        y="92"
                        className="font-zen text-[11px] fill-[#162723] font-medium"
                      >
                        Self-doubt
                      </text>
                    </g>

                    {/* Node 4: Emotional Triggers */}
                    <g className="cursor-pointer">
                      <circle cx="120" cy="160" r="7.5" fill="#4A6D88" />
                      <circle cx="120" cy="160" r="13" fill="#4A6D88" fillOpacity="0.18" />
                      <text
                        x="145"
                        y="190"
                        textAnchor="middle"
                        className="font-zen text-[11px] fill-[#5C6873]"
                      >
                        Emotional Triggers
                      </text>
                    </g>

                    {/* Node 5: Relationships */}
                    <g className="cursor-pointer">
                      <circle cx="360" cy="180" r="7" fill="#A66B4A" />
                      <circle cx="360" cy="180" r="13" fill="#A66B4A" fillOpacity="0.18" />
                      <text
                        x="395"
                        y="192"
                        className="font-zen text-[11px] fill-[#5C6873]"
                      >
                        Relationships
                      </text>
                    </g>
                  </svg>
                </div>
              </div>
            </main>

            {/* 3. RIGHT WIDGET PANEL */}
            <aside className="w-full md:w-[220px] lg:w-[240px] bg-[#F7F3EC]/70 border-t md:border-t-0 md:border-l border-[#E7DECF] p-5 space-y-4 shrink-0">
              {/* Header: Today · Day 06 */}
              <div className="space-y-2">
                <div className="font-editorial text-xs font-semibold text-[#162723]">
                  Today · Day 06
                </div>
                {/* Progress Dots */}
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i <= 5 ? 'bg-[#2E7A70]' : 'bg-[#D6CEBF]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Inspiration Card with Misty Mountain Watercolor */}
              <div className="rounded-2xl bg-white border border-[#E7DECF] shadow-xs overflow-hidden flex flex-col justify-between min-h-[170px]">
                <div className="p-4 space-y-2.5">
                  <p className="font-editorial text-sm text-[#162723] leading-snug font-normal">
                    A small step today, a calmer tomorrow.
                  </p>
                  <div className="w-6 h-[1.5px] bg-[#E7DECF]" />
                </div>

                {/* Watercolor layered mountain SVG */}
                <div className="w-full h-24 mt-auto">
                  <svg
                    viewBox="0 0 240 100"
                    className="w-full h-full object-cover"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="mountain-grad-1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#C4D7C7" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#8AA688" stopOpacity="0.8" />
                      </linearGradient>
                      <linearGradient id="mountain-grad-2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#8AA688" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#3B5A4D" stopOpacity="0.9" />
                      </linearGradient>
                      <linearGradient id="mountain-grad-3" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#D9E5DC" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#A8C1B0" stopOpacity="0.7" />
                      </linearGradient>
                    </defs>
                    {/* Far mountains */}
                    <path
                      d="M 0 65 Q 60 25, 120 45 T 240 30 L 240 100 L 0 100 Z"
                      fill="url(#mountain-grad-3)"
                    />
                    {/* Mid mountains */}
                    <path
                      d="M 0 75 Q 80 40, 160 55 T 240 50 L 240 100 L 0 100 Z"
                      fill="url(#mountain-grad-1)"
                    />
                    {/* Fore mountains */}
                    <path
                      d="M 0 85 Q 90 60, 180 70 T 240 68 L 240 100 L 0 100 Z"
                      fill="url(#mountain-grad-2)"
                    />
                  </svg>
                </div>
              </div>

              {/* Consistency Tracker Widget */}
              <div className="rounded-2xl p-4 bg-white/90 border border-[#E7DECF] shadow-xs space-y-3">
                <p className="font-zen text-xs text-[#5C6873] leading-relaxed">
                  You've been more consistent this week.
                </p>

                {/* Weekly Frequency Bars */}
                <div className="flex items-end justify-between gap-1.5 h-14 pt-1 px-1">
                  {[
                    { day: 'M', height: '40%' },
                    { day: 'T', height: '55%' },
                    { day: 'W', height: '70%' },
                    { day: 'T', height: '45%' },
                    { day: 'F', height: '85%' },
                    { day: 'S', height: '95%' },
                    { day: 'S', height: '80%' }
                  ].map((bar, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div
                        style={{ height: bar.height }}
                        className="w-full max-w-[12px] bg-[#2E7A70]/85 hover:bg-[#2E7A70] transition-colors rounded-xs shadow-2xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

            </aside>

          </div>
        </div>
      </div>
    </div>
  );
}
