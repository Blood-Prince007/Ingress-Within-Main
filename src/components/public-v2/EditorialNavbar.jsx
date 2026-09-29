import { useState, useEffect } from 'react';

/**
 * Editorial Navbar matching the screenshot visual design.
 * Features the brand mark, refined serif typography, small mono subtitle,
 * active indicator dot, and clean routing to production authentication.
 */
export default function EditorialNavbar({ activeTab = 'home', onSelectTab }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let currentScrolled = window.scrollY > 20;
    setIsScrolled(currentScrolled);

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const nextScrolled = window.scrollY > 20;
          if (nextScrolled !== currentScrolled) {
            currentScrolled = nextScrolled;
            setIsScrolled(nextScrolled);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeTab]);

  const navItems = [
    { id: 'solution', label: 'Our Solution', path: '/solution' },
    { id: 'how', label: 'How It Works', path: '/how-it-works' },
    { id: 'pricing', label: 'Pricing', path: '/pricing' },
    { id: 'ai', label: 'AI & Data', path: '/ai-data' },
    { id: 'evidence', label: 'Evidence', path: '/evidence' },
    { id: 'about', label: 'About', path: '/about' },
    { id: 'crisis', label: 'In Crisis?', path: '/crisis', highlight: true }
  ];

  const handleNavClick = (item, e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (onSelectTab) {
      onSelectTab(item.id);
    }
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', item.path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAuthClick = (path, e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  return (
    <header
      style={{
        background: isScrolled
          ? 'linear-gradient(to bottom, rgba(255, 255, 255, 0.62) 0%, rgba(254, 252, 249, 0.48) 100%)'
          : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.38) 0%, rgba(253, 251, 247, 0.22) 100%)',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        border: 'none',
        borderBottom: 'none',
        boxShadow: isScrolled
          ? '0 10px 30px -10px rgba(22, 39, 35, 0.04)'
          : 'none',
        transform: 'translate3d(0, 0, 0)',
      }}
      className="sticky top-0 z-50 w-full transition-[background,box-shadow] duration-200"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-20 sm:h-22 flex items-center justify-between">
        
        {/* Brand Logo: Logo Mark slightly heightened relative to Ingress Within and tagline combined */}
        <a
          href="/"
          onClick={(e) => handleNavClick({ id: 'home', path: '/' }, e)}
          className="flex items-center gap-3.5 group text-left cursor-pointer select-none py-0.5"
        >
          {/* Logo Mark: Slightly taller than the combined text block */}
          <img
            src="/logo-mark-transparent.png"
            alt="Ingress Within"
            className="w-[44px] h-[44px] sm:w-[48px] sm:h-[48px] object-contain flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
          />

          {/* Wordmark + Tagline Combined Block */}
          <div className="flex flex-col justify-center">
            <div className="font-editorial text-[22px] sm:text-[24px] tracking-tight leading-none text-[#162723] transition-colors duration-300">
              Ingress <span className="font-medium text-[#795663] transition-colors duration-300">Within</span>
            </div>
            <div className="font-mono-code text-[8px] sm:text-[8.5px] tracking-[0.16em] uppercase text-[#7D8E87] transition-colors duration-300 mt-1.5 leading-none">
              Understand · Grow · Continue
            </div>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-[13.5px]">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={item.path}
                onClick={(e) => handleNavClick(item, e)}
                className={`relative py-2 font-medium transition-colors duration-300 cursor-pointer ${
                  item.highlight
                    ? 'text-[#9A4232] hover:text-[#7A2F22] font-semibold'
                    : isActive
                    ? 'text-[#162723] font-semibold'
                    : 'text-[#4F635E] hover:text-[#162723]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#162723] transition-colors duration-300" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Desktop CTA / Login Buttons */}
        <div className="hidden sm:flex items-center gap-4">
          <a
            href="/login"
            onClick={(e) => handleAuthClick('/login', e)}
            className="text-xs sm:text-[13px] font-medium px-3 py-2 text-[#4F635E] hover:text-[#162723] transition-colors duration-300 cursor-pointer"
          >
            Log in
          </a>
          <a
            href="/login"
            onClick={(e) => handleAuthClick('/login', e)}
            className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-medium px-5 py-2.5 rounded-full shadow-sm hover:shadow transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-[#162723] hover:bg-[#203631] text-[#FAF7F2]"
          >
            <span>Get Started</span>
            <span className="text-[14px]">→</span>
          </a>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex items-center gap-2 sm:hidden">
          <a
            href="/login"
            onClick={(e) => handleAuthClick('/login', e)}
            className="inline-flex items-center text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors duration-300 bg-[#162723] text-white"
          >
            Log in
          </a>
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg transition-colors text-[#162723] hover:bg-black/5"
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className={`w-full h-0.5 rounded-full bg-[#162723] transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`w-full h-0.5 rounded-full bg-[#162723] transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`w-full h-0.5 rounded-full bg-[#162723] transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: 'rgba(253, 251, 248, 0.95)',
            backdropFilter: 'blur(36px) saturate(200%)',
            WebkitBackdropFilter: 'blur(36px) saturate(200%)',
          }}
          className="sm:hidden px-6 py-5 space-y-4 shadow-[0_16px_36px_rgba(22,39,35,0.06)] animate-fadeDown text-[#162723] border-b border-[#E7DECF]/40"
        >
          <div className="pb-3 border-b border-[#E7DECF]/40">
            <div className="flex items-center gap-3">
              <img
                src="/logo-mark-transparent.png"
                alt="Ingress Within"
                className="w-10 h-10 object-contain flex-shrink-0"
              />
              <div className="flex flex-col justify-center">
                <div className="font-editorial text-lg leading-none text-[#162723]">
                  Ingress <span className="font-medium text-[#795663]">Within</span>
                </div>
                <div className="font-mono-code text-[8px] tracking-[0.14em] uppercase text-[#7D8E87] mt-1 leading-none">
                  Understand · Grow · Continue
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.path}
                onClick={(e) => handleNavClick(item, e)}
                className={`block py-2 text-sm ${
                  activeTab === item.id
                    ? 'font-bold text-[#162723]'
                    : 'text-[#4F635E]'
                } ${item.highlight ? 'text-[#9A4232]' : ''}`}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="pt-4 border-t border-[#E7DECF] flex flex-col gap-2">
            <a
              href="/login"
              onClick={(e) => handleAuthClick('/login', e)}
              className="w-full text-center py-2.5 text-xs font-semibold rounded-full text-white bg-[#162723]"
            >
              Get Started →
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
