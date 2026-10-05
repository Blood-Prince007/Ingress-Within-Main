import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, ArrowRight, BookOpen, Compass, Activity, Sparkles, Layers, CornerDownLeft } from 'lucide-react';

const CATEGORY_ICONS = {
  modules: BookOpen,
  interventions: Compass,
  knowledge: Sparkles,
  patterns: Activity,
  exercises: Layers,
};

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const listRef = useRef(null);

  // Flattened list of items for keyboard navigation
  const flatItems = React.useMemo(() => {
    if (!results || !results.groups) return [];
    return results.groups.flatMap((g) =>
      g.items.map((item) => ({
        ...item,
        groupKey: g.key,
        groupCategory: g.category,
      }))
    );
  }, [results]);

  // Execute search request with debounce
  const executeSearch = useCallback(async (searchTerm) => {
    const q = (searchTerm || '').trim();
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.status === 401) {
        setError('Please sign in to search self-help resources.');
        setResults(null);
        return;
      }
      if (!res.ok) {
        throw new Error('Search temporarily unavailable');
      }
      const data = await res.json();
      if (data.success) {
        setResults(data);
        setSelectedIndex(0);
      } else {
        setError(data.error?.message || 'Search failed');
      }
    } catch (err) {
      console.error('[GlobalSearchModal] Search error:', err);
      setError('Search is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle query input with 300ms debounce
  const handleQueryChange = (val) => {
    setQuery(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(val);
    }, 300);
  };

  // Keyboard navigation & Shortcut listeners
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Toggle modal with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (flatItems.length > 0) {
          setSelectedIndex((prev) => (prev + 1) % flatItems.length);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (flatItems.length > 0) {
          setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
        }
      } else if (e.key === 'Enter') {
        if (flatItems.length > 0 && flatItems[selectedIndex]) {
          e.preventDefault();
          handleNavigate(flatItems[selectedIndex].path);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, flatItems, selectedIndex, onClose]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults(null);
      setError(null);
      setSelectedIndex(0);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  const handleNavigate = (path) => {
    onClose();
    if (window.navigateTo) {
      window.navigateTo(path);
    } else {
      window.location.href = path;
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!isOpen) return null;

  let flatIndexCounter = -1;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4"
        role="dialog"
        aria-modal="true"
        aria-label="Global self-help search"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#1E2A2E]/60 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-white-paper rounded-2xl shadow-2xl border border-primary/15 overflow-hidden z-10 flex flex-col max-h-[82vh]"
        >
          {/* Search Header Bar */}
          <div className="relative flex items-center px-4 sm:px-5 py-3.5 border-b border-primary/10 bg-warm-paper/40">
            <div className="text-mid/60 mr-3 flex items-center justify-center">
              {loading ? (
                <Loader2 size={18} className="animate-spin text-accent" />
              ) : (
                <Search size={18} />
              )}
            </div>

            <input
              ref={inputRef}
              type="search"
              role="searchbox"
              aria-label="Search self-help resources"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search self-help resources, techniques, modules..."
              className="flex-1 bg-transparent border-none text-primary placeholder:text-mid/50 text-sm sm:text-[15px] focus:outline-none"
            />

            <div className="flex items-center gap-2 ml-2">
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Clear search query"
                  className="p-1 rounded-full text-mid/60 hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer border-none bg-transparent"
                >
                  <X size={15} />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-mid/60 bg-primary/5 border border-primary/10 px-2 py-0.5 rounded">
                ESC
              </kbd>
            </div>
          </div>

          {/* Results Area */}
          <div ref={listRef} className="overflow-y-auto p-3 sm:p-4 space-y-4 flex-1 overscroll-contain">
            {/* Initial suggestion prompt if no query */}
            {!query.trim() && (
              <div className="py-8 px-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-secondary/15 text-primary flex items-center justify-center mx-auto">
                  <Sparkles size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-primary">Discover self-help resources</h4>
                  <p className="text-xs text-mid leading-relaxed max-w-sm mx-auto">
                    Type a feeling, concern, or practice to discover evidence-based modules, techniques, and insights.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                  <span className="text-[11px] text-mid/70 mr-1">Try:</span>
                  {['Anxiety', 'Grief', 'Sleep', 'Boundaries', 'Overthinking', 'Self-criticism'].map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleQueryChange(term)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-warm-paper hover:bg-accent/10 hover:text-accent border border-primary/10 text-primary transition-all cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="py-6 px-4 text-center space-y-1">
                <p className="text-xs text-[#b45309] font-medium">{error}</p>
              </div>
            )}

            {/* Results Grouping */}
            {results && results.groups && results.groups.length > 0 && (
              <div className="space-y-4">
                {results.groups.map((group) => {
                  const Icon = CATEGORY_ICONS[group.key] || Sparkles;

                  return (
                    <div key={group.key} className="space-y-1.5">
                      <div className="flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-wider text-secondary">
                        <Icon size={12} className="shrink-0" />
                        <span>{group.category}</span>
                        <span className="text-mid/50 font-normal">({group.items.length})</span>
                      </div>

                      <div className="space-y-1">
                        {group.items.map((item) => {
                          flatIndexCounter += 1;
                          const currentFlatIdx = flatIndexCounter;
                          const isSelected = currentFlatIdx === selectedIndex;

                          return (
                            <div
                              key={item.id}
                              onClick={() => handleNavigate(item.path)}
                              onMouseEnter={() => setSelectedIndex(currentFlatIdx)}
                              className={`p-3 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-3 text-left border ${
                                isSelected
                                  ? 'bg-accent/10 border-accent/30 shadow-xs'
                                  : 'bg-warm-paper/30 hover:bg-warm-paper/70 border-primary/5'
                              }`}
                            >
                              <div className="space-y-0.5 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[13px] font-bold transition-colors ${
                                    isSelected ? 'text-accent' : 'text-primary'
                                  }`}>
                                    {item.title}
                                  </span>
                                  {item.badge && (
                                    <span className="text-[9.5px] font-semibold px-2 py-0.2 rounded-full bg-primary/5 text-mid/80 border border-primary/10">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>

                                {item.subtitle && (
                                  <div className="text-[11px] font-medium text-secondary">
                                    {item.subtitle}
                                  </div>
                                )}

                                <p className="text-[11.5px] text-mid line-clamp-1 leading-normal font-light">
                                  {item.description}
                                </p>
                              </div>

                              <div className="shrink-0 pt-1 text-mid/40">
                                <ArrowRight size={14} className={isSelected ? 'text-accent translate-x-0.5 transition-transform' : ''} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State: query entered with 0 results */}
            {results && results.groups && results.groups.length === 0 && !loading && (
              <div className="py-12 px-4 text-center space-y-2">
                <h4 className="text-sm font-semibold text-primary">No results found for "{query}"</h4>
                <p className="text-xs text-mid leading-relaxed max-w-sm mx-auto">
                  Try searching with a broader topic like <span className="font-medium text-primary">stress</span>, <span className="font-medium text-primary">sleep</span>, <span className="font-medium text-primary">calm</span>, or browse our techniques catalog.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleNavigate('/interventions')}
                    className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-[#654652] transition-colors cursor-pointer border-none"
                  >
                    Browse All Techniques
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Guide */}
          <div className="px-4 py-2.5 border-t border-primary/10 bg-warm-paper/50 flex items-center justify-between text-[11px] text-mid/70">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="font-mono text-[9px] bg-primary/5 border border-primary/10 px-1 py-0.5 rounded">↑</kbd>
                <kbd className="font-mono text-[9px] bg-primary/5 border border-primary/10 px-1 py-0.5 rounded">↓</kbd> to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="font-mono text-[9px] bg-primary/5 border border-primary/10 px-1 py-0.5 rounded flex items-center">
                  <CornerDownLeft size={9} />
                </kbd> to open
              </span>
            </div>
            <span className="text-[10px] text-mid/60">Strictly confidential · Ingress Within</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
