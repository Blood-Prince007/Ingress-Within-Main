import React, { useState, useEffect } from 'react';
import { User, Home, PenLine, FileText, TrendingUp, Settings, BookOpen, Compass, Search } from 'lucide-react';
import GlobalSearchModal from './search/GlobalSearchModal';

export default function DashboardNavbar({ activeTab }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isMobileNavHidden = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/session') || 
    window.location.pathname.startsWith('/write')
  );

  const getTabClass = (tab) => {
    const isActive = activeTab === tab;
    return `text-[12px] font-semibold uppercase tracking-wider pb-0.5 border-b-2 transition-all cursor-pointer ${
      isActive 
        ? 'text-accent border-accent font-semibold' 
        : 'text-mid hover:text-primary border-transparent hover:border-accent/30 font-medium'
    }`;
  };

  const getMobileTabClass = (tab) => {
    const isActive = activeTab === tab;
    return `flex flex-col items-center justify-center flex-1 py-1 text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer border-none bg-transparent relative ${
      isActive ? 'text-accent font-semibold' : 'text-mid/50 hover:text-primary font-medium'
    }`;
  };

  return (
    <>
      <header className="glass-nav border-b border-primary/5 px-4 sm:px-6 py-3.5 sm:py-4 sticky top-0 z-50 bg-warm-paper/85 backdrop-blur-md">
        <div className="max-w-[1140px] mx-auto w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 font-semibold text-[15px] cursor-pointer group shrink-0" onClick={() => window.navigateTo('/dashboard')}>
            <img 
              src="/logo-mark-transparent.png" 
              alt="Ingress Within" 
              className="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-105" 
            />
            <span className="tracking-tight font-serif text-[16px] text-primary">
              ingress <em className="text-accent font-serif not-italic font-semibold">within</em>
            </span>
          </div>
          
          <nav className="hidden md:flex gap-5 lg:gap-6 shrink-0">
            <button className={getTabClass('home')} onClick={() => window.navigateTo('/dashboard')}>Home</button>
            <button className={getTabClass('write')} onClick={() => window.navigateTo('/write')}>Write</button>
            <button className={getTabClass('interventions')} onClick={() => window.navigateTo('/interventions')}>Interventions</button>
            <button className={getTabClass('reports')} onClick={() => window.navigateTo('/reports')}>Reports</button>
            <button className={getTabClass('patterns')} onClick={() => window.navigateTo('/patterns')}>Patterns</button>
            <button className={getTabClass('knowledge')} onClick={() => window.navigateTo('/knowledge')}>Knowledge</button>
            <button className={getTabClass('settings')} onClick={() => window.navigateTo('/settings')}>Settings</button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Search Trigger (Desktop) */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-warm-paper/70 hover:bg-white border border-primary/10 text-mid/70 hover:text-primary transition-all text-xs cursor-pointer shadow-xs"
              title="Search self-help resources (Ctrl+K)"
              aria-label="Search self-help resources"
            >
              <Search size={14} className="text-mid/60" />
              <span className="font-normal text-[12px]">Search resources...</span>
              <kbd className="text-[10px] font-mono bg-primary/5 border border-primary/10 px-1.5 py-0.5 rounded text-mid/60 ml-1">
                ⌘K
              </kbd>
            </button>

            {/* Global Search Trigger (Mobile & Tablet) */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="lg:hidden w-8 h-8 rounded-full border border-primary/10 bg-white-paper flex items-center justify-center text-mid hover:text-primary hover:border-accent/40 transition-all cursor-pointer"
              aria-label="Open self-help search"
              title="Search self-help resources"
            >
              <Search size={15} />
            </button>

            <button 
              onClick={() => window.navigateTo('/support')}
              className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                activeTab === 'support' 
                  ? 'bg-accent border-accent text-white' 
                  : 'bg-supporting/20 border-supporting/40 text-primary hover:bg-supporting/30'
              }`}
            >
              Find Support
            </button>
            <button 
              onClick={() => window.navigateTo('/settings')}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                activeTab === 'settings' 
                  ? 'bg-accent border-accent text-white' 
                  : 'bg-white-paper border-primary/10 text-mid hover:border-accent/40'
              }`}
              title="Settings"
            >
              <User size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Mobile Bottom Navigation Bar */}
      {!isMobileNavHidden && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-warm-paper/95 backdrop-blur-md border-t border-primary/10 flex items-center justify-around py-1 shadow-[0_-4px_24px_rgba(40,61,56,0.04)] px-2 pb-safe">
          <button onClick={() => window.navigateTo('/dashboard')} className={getMobileTabClass('home')}>
            <Home size={17} className={activeTab === 'home' ? 'text-accent mb-0.5' : 'text-mid/50 mb-0.5'} />
            <span>Home</span>
            {activeTab === 'home' && <div className="absolute bottom-0 w-1 h-1 rounded-full bg-accent" />}
          </button>
          <button onClick={() => window.navigateTo('/write')} className={getMobileTabClass('write')}>
            <PenLine size={17} className={activeTab === 'write' ? 'text-accent mb-0.5' : 'text-mid/50 mb-0.5'} />
            <span>Write</span>
            {activeTab === 'write' && <div className="absolute bottom-0 w-1 h-1 rounded-full bg-accent" />}
          </button>
          <button onClick={() => window.navigateTo('/interventions')} className={getMobileTabClass('interventions')}>
            <Compass size={17} className={activeTab === 'interventions' ? 'text-accent mb-0.5' : 'text-mid/50 mb-0.5'} />
            <span>Practice</span>
            {activeTab === 'interventions' && <div className="absolute bottom-0 w-1 h-1 rounded-full bg-accent" />}
          </button>
          <button onClick={() => window.navigateTo('/reports')} className={getMobileTabClass('reports')}>
            <FileText size={17} className={activeTab === 'reports' ? 'text-accent mb-0.5' : 'text-mid/50 mb-0.5'} />
            <span>Reports</span>
            {activeTab === 'reports' && <div className="absolute bottom-0 w-1 h-1 rounded-full bg-accent" />}
          </button>
          <button onClick={() => window.navigateTo('/patterns')} className={getMobileTabClass('patterns')}>
            <TrendingUp size={17} className={activeTab === 'patterns' ? 'text-accent mb-0.5' : 'text-mid/50 mb-0.5'} />
            <span>Patterns</span>
            {activeTab === 'patterns' && <div className="absolute bottom-0 w-1 h-1 rounded-full bg-accent" />}
          </button>
          <button onClick={() => window.navigateTo('/knowledge')} className={getMobileTabClass('knowledge')}>
            <BookOpen size={17} className={activeTab === 'knowledge' ? 'text-accent mb-0.5' : 'text-mid/50 mb-0.5'} />
            <span>Knowledge</span>
            {activeTab === 'knowledge' && <div className="absolute bottom-0 w-1 h-1 rounded-full bg-accent" />}
          </button>
          <button onClick={() => window.navigateTo('/settings')} className={getMobileTabClass('settings')}>
            <Settings size={17} className={activeTab === 'settings' ? 'text-accent mb-0.5' : 'text-mid/50 mb-0.5'} />
            <span>Settings</span>
            {activeTab === 'settings' && <div className="absolute bottom-0 w-1 h-1 rounded-full bg-accent" />}
          </button>
        </nav>
      )}
    </>
  );
}
