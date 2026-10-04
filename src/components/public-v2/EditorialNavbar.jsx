import { useState, useEffect } from 'react';

/**
 * Editorial Navbar matching the screenshot visual design.
 * Features dynamic translucent glass styling that adapts to its background:
 * When scrolling over dark navy/blue bands ([data-dark-section="true"] or footer),
 * it turns into a rich frosty deep blue with glowing legible light accents.
 */
export default function EditorialNavbar({ activeTab = 'home', onSelectTab }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOnBlue, setIsOnBlue] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let lastScrolled = typeof window !== 'undefined' ? window.scrollY > 20 : false;
    setIsScrolled(lastScrolled);

    const handleScroll = () => {
      const currentScrolled = window.scrollY > 20;
      if (currentScrolled !== lastScrolled) {
        lastScrolled = currentScrolled;
        setIsScrolled(currentScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Use IntersectionObserver to track dark sections & footer without layout thrashing
    let observer = null;
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
        const navHeight = 88;
        const activeIntersections = new Set();

        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                activeIntersections.add(entry.target);
              } else {
                activeIntersections.delete(entry.target);
              }
            });
            setIsOnBlue(activeIntersections.size > 0);
          },
          {
            rootMargin: `0px 0px -${Math.max(window.innerHeight - navHeight, 100)}px 0px`,
            threshold: 0
          }
        );

        const darkElements = document.querySelectorAll('[data-dark-section="true"], footer');
        darkElements.forEach((el) => observer.observe(el));
      }
    }, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
      if (observer) observer.disconnect();
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
    } else if (typeof window !== 'undefined') {
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
        background: isOnBlue
          ? 'linear-gradient(to bottom, rgba(1, 22, 39, 0.92) 0%, rgba(1, 22, 39, 0.85) 100%)'
          : isScrolled
          ? 'linear-gradient(to bottom, rgba(246, 241, 234, 0.94) 0%, rgba(246, 241, 234, 0.88) 100%)'
          : 'linear-gradient(to bottom, rgba(246, 241, 234, 0.82) 0%, rgba(246, 241, 234, 0.60) 100%)',
        backdropFilter: isOnBlue ? 'blur(16px) saturate(160%)' : 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: isOnBlue ? 'blur(16px) saturate(160%)' : 'blur(14px) saturate(140%)',
        border: 'none',
        borderBottom: isOnBlue
          ? '1px solid rgba(255, 255, 255, 0.08)'
          : isScrolled
          ? '1px solid rgba(22, 39, 35, 0.08)'
          : '1px solid rgba(22, 39, 35, 0.05)',
        boxShadow: isOnBlue
          ? '0 10px 30px -10px rgba(0, 0, 0, 0.45)'
          : isScrolled
          ? '0 10px 30px -10px rgba(22, 39, 35, 0.04)'
          : 'none',
        transform: 'translate3d(0, 0, 0)',
        transition: 'background 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease'
      }}
      className="sticky top-0 z-50 w-full"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-20 sm:h-22 flex items-center justify-between">
        
        {/* Brand Logo: Logo Mark slightly heightened relative to Ingress Within and tagline combined */}
        <a
          href="/"
          onClick={(e) => handleNavClick({ id: 'home', path: '/' }, e)}
          className="flex items-center gap-3.5 group text-left cursor-pointer select-none py-0.5"
        >
          {/* Logo Mark: Dynamically switches to light version on dark blue background */}
          <img
            src={isOnBlue ? "/logo-mark-light.png" : "/logo-mark-transparent.png"}
            alt="Ingress Within"
            className="w-[44px] h-[44px] sm:w-[48px] sm:h-[48px] object-contain flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
          />

          {/* Wordmark + Tagline Combined Block */}
          <div className="flex flex-col justify-center">
            <div
              className={`font-editorial text-[22px] sm:text-[24px] tracking-tight leading-none transition-colors duration-300 ${
                isOnBlue ? 'text-white' : 'text-[#162723]'
              }`}
            >
              Ingress{' '}
              <span
                className={`font-medium transition-colors duration-300 ${
                  isOnBlue ? 'text-[#E8A598]' : 'text-[#795663]'
                }`}
              >
                Within
              </span>
            </div>
            <div
              className={`font-mono-code text-[8px] sm:text-[8.5px] tracking-[0.16em] uppercase transition-colors duration-300 mt-1.5 leading-none ${
                isOnBlue ? 'text-[#9AAAB8]' : 'text-[#7D8E87]'
              }`}
            >
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
                    ? isOnBlue
                      ? 'text-[#FF8A7A] hover:text-[#FFA092] font-semibold'
                      : 'text-[#9A4232] hover:text-[#7A2F22] font-semibold'
                    : isActive
                    ? isOnBlue
                      ? 'text-white font-semibold'
                      : 'text-[#162723] font-semibold'
                    : isOnBlue
                    ? 'text-[#C2D1DE] hover:text-white'
                    : 'text-[#4F635E] hover:text-[#162723]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                      isOnBlue ? 'bg-white' : 'bg-[#162723]'
                    }`}
                  />
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
              isOnBlue
                ? 'text-[#C2D1DE] hover:text-white'
                : 'text-[#4F635E] hover:text-[#162723]'
            }`}
          >
            Log in
          </a>
          <a
            href="/login"
            onClick={(e) => handleAuthClick('/login', e)}
            className={`inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-medium px-5 py-2.5 rounded-full shadow-sm hover:shadow transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
              isOnBlue
                ? 'bg-white hover:bg-[#FAF7F2] text-[#011627]'
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
              isOnBlue
                ? 'bg-white text-[#011627]'
                : 'bg-[#162723] text-white'
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
              isOnBlue ? 'text-white hover:bg-white/10' : 'text-[#162723] hover:bg-black/5'
            }`}
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span
                className={`w-full h-0.5 rounded-full transition-all ${
                  isOnBlue ? 'bg-white' : 'bg-[#162723]'
                } ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}
              />
              <span
                className={`w-full h-0.5 rounded-full transition-all ${
                  isOnBlue ? 'bg-white' : 'bg-[#162723]'
                } ${mobileMenuOpen ? 'opacity-0' : ''}`}
              />
              <span
                className={`w-full h-0.5 rounded-full transition-all ${
                  isOnBlue ? 'bg-white' : 'bg-[#162723]'
                } ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}
              />
            </div>
          </button>
        </div>

      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: isOnBlue ? 'rgba(1, 22, 39, 0.96)' : 'rgba(253, 251, 248, 0.95)',
            backdropFilter: 'blur(36px) saturate(200%)',
            WebkitBackdropFilter: 'blur(36px) saturate(200%)',
          }}
          className={`sm:hidden px-6 py-5 space-y-4 shadow-[0_16px_36px_rgba(22,39,35,0.06)] animate-fadeDown border-b ${
            isOnBlue ? 'text-white border-white/10' : 'text-[#162723] border-[#E7DECF]/40'
          }`}
        >
          <div className={`pb-3 border-b ${isOnBlue ? 'border-white/10' : 'border-[#E7DECF]/40'}`}>
            <div className="flex items-center gap-3">
              <img
                src={isOnBlue ? "/logo-mark-light.png" : "/logo-mark-transparent.png"}
                alt="Ingress Within"
                className="w-10 h-10 object-contain flex-shrink-0"
              />
              <div className="flex flex-col justify-center">
                <div className={`font-editorial text-lg leading-none ${isOnBlue ? 'text-white' : 'text-[#162723]'}`}>
                  Ingress{' '}
                  <span className={`font-medium ${isOnBlue ? 'text-[#E8A598]' : 'text-[#795663]'}`}>
                    Within
                  </span>
                </div>
                <div
                  className={`font-mono-code text-[8px] tracking-[0.14em] uppercase mt-1 leading-none ${
                    isOnBlue ? 'text-[#9AAAB8]' : 'text-[#7D8E87]'
                  }`}
                >
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
                    ? isOnBlue
                      ? 'font-bold text-white'
                      : 'font-bold text-[#162723]'
                    : isOnBlue
                    ? 'text-[#C2D1DE]'
                    : 'text-[#4F635E]'
                } ${item.highlight ? (isOnBlue ? 'text-[#FF8A7A]' : 'text-[#9A4232]') : ''}`}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className={`pt-4 border-t flex flex-col gap-2 ${isOnBlue ? 'border-white/10' : 'border-[#E7DECF]'}`}>
            <a
              href="/login"
              onClick={(e) => handleAuthClick('/login', e)}
              className={`w-full text-center py-2.5 text-xs font-semibold rounded-full ${
                isOnBlue ? 'bg-white text-[#011627]' : 'text-white bg-[#162723]'
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
