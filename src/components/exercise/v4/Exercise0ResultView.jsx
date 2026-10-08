import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  X,
  RotateCw,
  TrendingUp,
  Brain,
  ShieldCheck,
  Compass,
  AlertCircle
} from 'lucide-react';

export default function Exercise0ResultView({ instanceId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [instance, setInstance] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResult();
  }, [instanceId]);

  const fetchResult = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/exercises/result?instance_id=${instanceId}`);
      if (!res.ok) {
        throw new Error(`Failed to load result (HTTP ${res.status})`);
      }
      const data = await res.json();
      setResult(data.result);
      setInstance(data.instance);
    } catch (err) {
      console.error('[Exercise0ResultView] Fetch error:', err);
      setError(err.message || 'Unable to load exercise analysis.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0]/90 backdrop-blur-md flex items-center justify-center p-6">
        <div className="bg-white/80 border border-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
            <div className="absolute w-12 h-12 rounded-full border-2 border-secondary/20 animate-ping" />
            <RotateCw className="w-7 h-7 text-primary animate-spin" />
          </div>
          <p className="text-sm font-serif italic text-primary">Loading Exercise 0 Baseline Analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0]/90 backdrop-blur-md flex items-center justify-center p-6">
        <div className="bg-white/80 border border-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="font-serif italic text-xl text-primary">Analysis Processing</h3>
          <p className="text-xs text-mid">
            {error || 'Your baseline exercise analysis is being processed in the background. Please check back in a moment.'}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const rawSummary = result.summary || result.analysis?.summaryText || result.analysis?.reflection_text || result.analysis?.summary || 'Your baseline psychometric profile has been synthesized and recorded.';
  const summary = formatSecondPerson(rawSummary);

  return (
    <div className="fixed inset-0 z-50 bg-[#ECEFF0] overflow-y-auto p-4 md:p-8 font-sans flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto space-y-6 pb-8">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between gap-4 pb-4 border-b border-black/5">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-mark-transparent.png" 
              alt="Ingress Within" 
              className="w-9 h-9 object-contain flex-shrink-0" 
            />
            <div>
              <h2 className="font-serif italic text-xl text-primary">Baseline Assessment Analysis</h2>
              <p className="text-xs text-mid flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Immutable Stored Assessment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/70 hover:bg-white border border-white/90 flex items-center justify-center text-primary transition-all cursor-pointer shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Executive Synthesis Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md border border-white/90 rounded-3xl p-8 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-mid uppercase tracking-widest">
              Executive Synthesis
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> Complete
            </span>
          </div>

          <p className="text-base text-primary font-serif italic leading-relaxed">
            "{summary}"
          </p>
        </motion.div>

        {/* Footer Bar */}
        <div className="text-center pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function formatSecondPerson(text) {
  if (!text || typeof text !== 'string') return text;
  let formatted = text
    .replace(/^"|"$/g, '')
    .replace(/\bThis person tends to\b/gi, 'You tend to')
    .replace(/\bThis person is\b/gi, 'You are')
    .replace(/\bThis person has\b/gi, 'You have')
    .replace(/\bThis person\b/gi, 'You')
    .replace(/\bTheir mind stays\b/gi, 'Your mind stays')
    .replace(/\bTheir mind\b/gi, 'Your mind')
    .replace(/\bThey're generally\b/gi, "You're generally")
    .replace(/\bThey're\b/gi, "You're")
    .replace(/\bThey are\b/gi, 'You are')
    .replace(/\bThey tend to\b/gi, 'You tend to')
    .replace(/\bThey value\b/gi, 'You value')
    .replace(/\bThey feel\b/gi, 'You feel')
    .replace(/\bThey have\b/gi, 'You have')
    .replace(/\bThey carry\b/gi, 'You carry')
    .replace(/\bThey show\b/gi, 'You show')
    .replace(/\bThey notice\b/gi, 'You notice')
    .replace(/\bThey experience\b/gi, 'You experience')
    .replace(/\bThey\b/g, 'You')
    .replace(/\bthey\b/g, 'you')
    .replace(/\btheir\b/g, 'your')
    .replace(/\bTheir\b/g, 'Your')
    .replace(/\bthemselves\b/g, 'yourself')
    .replace(/\bThemselves\b/g, 'Yourself');
  return formatted.trim();
}
