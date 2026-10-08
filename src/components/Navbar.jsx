import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar({ user, profile }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePath, setActivePath] = useState('/');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActivePath(window.location.pathname || '/');
    }
    const handleLocation = () => {
      setActivePath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handleLocation);
    return () => window.removeEventListener('popstate', handleLocation);
  }, []);

  const handleStartWriting = (e) => {
    e.preventDefault();
    const destination = user
      ? (profile && !profile.onboarding_completed ? '/onboarding' : '/dashboard')
      : '/auth';
    if (window.navigateTo) {
      window.navigateTo(destination);
    } else {
      window.location.pathname = destination;
    }
    setMobileMenuOpen(false);
  };

  const getLinkClass = (path) => {
    const isActive = activePath === path;
    return `font-sans text-[13.5px] border-b-2 pb-[4px] transition-all no-underline ${isActive
      ? 'text-primary font-medium border-accent'
      : 'text-mid font-normal border-transparent hover:text-primary hover:border-primary/10'
      }`;
  };

  const getMobileLinkClass = (path) => {
    const isActive = activePath === path;
    return `font-sans text-sm transition-all py-2 border-b border-primary/5 no-underline ${isActive ? 'text-primary font-medium pl-2 border-l-2 border-accent' : 'text-mid font-normal hover:text-primary'
      }`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-[5%] h-[68px] flex items-center justify-between bg-mint-grey/95 backdrop-blur-[12px] border-b border-primary/8 transition-all duration-300">

      {/* Logo block */}
      <a href="/" className="logo flex items-center gap-3 no-underline group cursor-pointer">
        <img 
          src="/logo-mark-transparent.png" 
          alt="Ingress Within" 
          className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-105 flex-shrink-0" 
        />
        <div className="flex flex-col justify-center">
          <span className="logo-name font-serif text-xl font-normal text-primary tracking-[0.01em] leading-none">
            ingress <span className="font-semibold text-accent">within</span>
          </span>
          <span className="logo-tagline font-sans text-[9px] font-medium text-mid/75 tracking-[0.14em] uppercase leading-tight mt-1">
            Understand. Grow. Continue
          </span>
        </div>
      </a>

      {/* Nav Links */}
      <ul className="nav-links hidden md:flex items-center gap-6 list-none">
        <li><a href="/" className={getLinkClass('/')}>Home</a></li>
        <li><a href="/what-it-is" className={getLinkClass('/what-it-is')}>What it is</a></li>
        <li><a href="/how-it-works" className={getLinkClass('/how-it-works')}>How it works</a></li>
        {/* <li><a href="/about" className={getLinkClass('/about')}>About</a></li> */}
        <li><a href="/pricing" className={getLinkClass('/pricing')}>Pricing</a></li>
        <li><a href="/ai-data" className={getLinkClass('/ai-data')}>AI &amp; Data</a></li>
        {/* <li><a href="/contact" className={getLinkClass('/contact')}>Contact</a></li> */}
        <li>
          <a
            href={user ? '/dashboard' : '/auth'}
            onClick={handleStartWriting}
            className="nav-cta bg-accent text-white hover:bg-[#654652] hover:translate-y-[-1px] px-[22px] py-[9px] rounded font-medium tracking-[0.03em] transition-all no-underline shadow-xs"
          >
            {user ? 'Dashboard' : 'Start writing'}
          </a>
        </li>
      </ul>

      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden text-primary p-1 bg-transparent border-none cursor-pointer focus:outline-none"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu dropdown overlay */}
      {mobileMenuOpen && (
        <div className="absolute top-[68px] left-0 right-0 bg-mint-grey border-b border-primary/8 shadow-md flex flex-col p-6 gap-4 md:hidden animate-[fadeIn_0.2s_ease-out]">
          <a href="/" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkClass('/')}>Home</a>
          <a href="/what-it-is" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkClass('/what-it-is')}>What it is</a>
          <a href="/how-it-works" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkClass('/how-it-works')}>How it works</a>
          <a href="/about" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkClass('/about')}>About</a>
          <a href="/pricing" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkClass('/pricing')}>Pricing</a>
          <a href="/ai-data" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkClass('/ai-data')}>AI &amp; Data</a>
          <a href="/contact" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkClass('/contact')}>Contact</a>
          <a
            href={user ? '/dashboard' : '/auth'}
            onClick={handleStartWriting}
            className="bg-primary text-mint-grey py-3 rounded text-center font-medium tracking-wide mt-2"
          >
            {user ? 'Dashboard' : 'Start writing'}
          </a>
        </div>
      )}
    </nav>
  );
}
