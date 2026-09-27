import { useState, useEffect } from 'react';

/**
 * Editorial Navbar matching the screenshot visual design.
 * Features the brand mark, refined serif typography, small mono subtitle,
 * active indicator dot, and clean routing to production authentication.
 */
export default function EditorialNavbar({ activeTab = 'home', onSelectTab }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOverDark, setIsOverDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Check if navbar currently overlaps the dark footer or dark closing sections
      const navHeight = 88;
      const darkSections = Array.from(document.querySelectorAll('footer, section')).filter(
        (el) => el.tagName.toLowerCase() === 'footer' || el.classList.contains('bg-[#011627]')
      );
      let overDark = false;
      for (const el of darkSections) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= navHeight && rect.bottom >= 0) {
          overDark = true;
          break;
        }
      }
      setIsOverDark(overDark);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const navItems = [
    { id: 'solution', label: 'Our solution', path: '/solution' },
    { id: 'how', label: 'How it works', path: '/how-it-works' },
    { id: 'pricing', label: 'Pricing', path: '/pricing' },
    { id: 'ai', label: 'AI & data', path: '/ai-data' },
    { id: 'evidence', label: 'Evidence', path: '/evidence' },
    { id: 'about', label: 'About', path: '/about' },
    { id: 'crisis', label: 'In crisis?', path: '/crisis', highlight: true }
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
        backgroundColor: isOverDark
          ? 'rgba(1, 22, 39, 0.82)'
          : isScrolled
          ? 'rgba(250, 247, 242, 0.45)'
          : 'rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(8px) saturate(180%)',
        WebkitBackdropFilter: 'blur(8px) saturate(180%)',
      }}
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isOverDark
          ? 'shadow-[0_4px_30px_rgba(0,0,0,0.3)]'
          : isScrolled
          ? 'shadow-[0_4px_24px_rgba(22,39,35,0.035)]'
          : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-20 sm:h-22 flex items-center justify-between">
        
        {/* Brand Logo */}
        <a
          href="/"
          onClick={(e) => handleNavClick({ id: 'home', path: '/' }, e)}
          className="flex items-center gap-3 group text-left cursor-pointer"
        >
          {/* Official Brand Logo */}
          <img
            src={isOverDark ? '/logo-mark-light.png' : '/logo-mark-transparent.png'}
            alt="Ingress Within"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
          />

          <div>
            <div className={`font-editorial text-[21px] sm:text-[23px] tracking-tight leading-none transition-colors duration-300 ${
              isOverDark ? 'text-white' : 'text-[#162723]'
            }`}>
              Ingress <span className={`font-medium transition-colors duration-300 ${
                isOverDark ? 'text-[#8AA688]' : 'text-[#2E7A70]'
              }`}>Within</span>
            </div>
            <div className={`font-mono-code text-[8.5px] sm:text-[9px] tracking-[0.16em] uppercase mt-1 transition-colors duration-300 ${
              isOverDark ? 'text-[#BFCAD7]' : 'text-[#7D8E87]'
            }`}>
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
                    ? isOverDark
                      ? 'text-[#E0A898] hover:text-[#F4C5BA] font-semibold'
                      : 'text-[#9A4232] hover:text-[#7A2F22] font-semibold'
                    : isActive
                    ? isOverDark
                      ? 'text-white font-semibold'
                      : 'text-[#162723] font-semibold'
                    : isOverDark
                    ? 'text-[#DCE2E7]/80 hover:text-white'
                    : 'text-[#4F635E] hover:text-[#162723]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                    isOverDark ? 'bg-white' : 'bg-[#162723]'
                  }`} />
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
            className={`text-xs sm:text-[13px] font-medium px-3 py-2 transition-colors duration-300 cursor-pointer ${
              isOverDark ? 'text-[#DCE2E7]/85 hover:text-white' : 'text-[#4F635E] hover:text-[#162723]'
            }`}
          >
            Log in
          </a>
          <a
            href="/login"
            onClick={(e) => handleAuthClick('/login', e)}
            className={`inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-medium px-5 py-2.5 rounded-full shadow-sm hover:shadow transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
              isOverDark
                ? 'bg-[#C5A880] hover:bg-[#D8BE9B] text-[#011627]'
                : 'bg-[#162723] hover:bg-[#203631] text-[#FAF7F2]'
            }`}
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
            className={`inline-flex items-center text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors duration-300 ${
              isOverDark ? 'bg-[#C5A880] text-[#011627]' : 'bg-[#162723] text-white'
            }`}
          >
            Log in
          </a>
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-lg transition-colors ${
              isOverDark ? 'text-white hover:bg-white/10' : 'text-[#162723] hover:bg-black/5'
            }`}
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className={`w-full h-0.5 rounded-full transition-transform ${isOverDark ? 'bg-white' : 'bg-[#162723]'} ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`w-full h-0.5 rounded-full transition-opacity ${isOverDark ? 'bg-white' : 'bg-[#162723]'} ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`w-full h-0.5 rounded-full transition-transform ${isOverDark ? 'bg-white' : 'bg-[#162723]'} ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: isOverDark ? 'rgba(1, 22, 39, 0.95)' : 'rgba(253, 251, 248, 0.75)',
            backdropFilter: 'blur(36px) saturate(200%)',
            WebkitBackdropFilter: 'blur(36px) saturate(200%)',
          }}
          className={`sm:hidden px-6 py-5 space-y-4 shadow-[0_16px_36px_rgba(22,39,35,0.06)] animate-fadeDown ${
            isOverDark ? 'text-white border-b border-white/10' : 'text-[#162723]'
          }`}
        >
          <div className={`flex items-center gap-3 pb-3 border-b ${
            isOverDark ? 'border-white/10' : 'border-[#E7DECF]/40'
          }`}>
            <img
              src={isOverDark ? '/logo-mark-light.png' : '/logo-mark-transparent.png'}
              alt="Ingress Within"
              className="w-7 h-7 object-contain flex-shrink-0"
            />
            <div>
              <div className={`font-editorial text-lg leading-none ${
                isOverDark ? 'text-white' : 'text-[#162723]'
              }`}>
                Ingress <span className={`font-medium ${
                  isOverDark ? 'text-[#8AA688]' : 'text-[#2E7A70]'
                }`}>Within</span>
              </div>
              <div className={`font-mono-code text-[8px] tracking-[0.14em] uppercase mt-1 ${
                isOverDark ? 'text-[#BFCAD7]' : 'text-[#7D8E87]'
              }`}>
                Understand · Grow · Continue
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
                    ? isOverDark
                      ? 'font-bold text-white'
                      : 'font-bold text-[#162723]'
                    : isOverDark
                    ? 'text-[#DCE2E7]/80 hover:text-white'
                    : 'text-[#4F635E]'
                } ${item.highlight ? (isOverDark ? 'text-[#E0A898]' : 'text-[#9A4232]') : ''}`}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className={`pt-4 border-t flex flex-col gap-2 ${
            isOverDark ? 'border-white/10' : 'border-[#E7DECF]'
          }`}>
            <a
              href="/login"
              onClick={(e) => handleAuthClick('/login', e)}
              className={`w-full text-center py-2.5 text-xs font-semibold rounded-full ${
                isOverDark
                  ? 'bg-[#C5A880] text-[#011627] hover:bg-[#D8BE9B]'
                  : 'text-white bg-[#162723]'
              }`}
            >
              Get Started →
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
