/**
 * Editorial Dark Ink Footer matching source HTML content.
 */
export default function PublicFooter({ onSelectTab, onOpenPolicy }) {
  const handleNav = (tabId, e) => {
    e.preventDefault();
    if (onSelectTab) onSelectTab(tabId);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePolicy = (policyKey, e) => {
    e.preventDefault();
    if (onOpenPolicy) onOpenPolicy(policyKey);
    else if (onSelectTab) onSelectTab('policies');
  };

  return (
    <footer data-dark-section="true" className="relative z-20 bg-[#011627] text-[#DCE2E7] py-20 sm:py-28 px-6 sm:px-8 lg:px-12 border-t border-[rgba(246,241,234,0.14)] overflow-hidden">
      <div className="max-w-6xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 sm:gap-12 pb-14 border-b border-white/10">
          
          {/* Brand Info */}
          <div className="space-y-3 md:pr-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo-mark-light.png"
                alt="Ingress Within"
                className="w-8 h-8 object-contain flex-shrink-0"
              />
              <span className="font-editorial text-2xl text-white">Ingress Within</span>
            </div>
            <p className="font-mono-code text-[10px] tracking-[0.16em] uppercase text-[#BFCAD7] font-medium">
              Understand · Grow · Continue
            </p>
            <p className="font-zen text-xs text-[#8D98A3] leading-relaxed pt-1">
              One platform for different ways of working on your mental health.
            </p>
          </div>

          {/* Explore Links */}
          <div className="space-y-3">
            <div className="font-editorial text-sm text-white font-medium">Explore</div>
            <ul className="space-y-2 text-xs font-zen text-[#8D98A3]">
              <li>
                <a href="/solution" onClick={(e) => handleNav('solution', e)} className="hover:text-white transition-colors">
                  Our Solution
                </a>
              </li>
              <li>
                <a href="/how-it-works" onClick={(e) => handleNav('how', e)} className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="/pricing" onClick={(e) => handleNav('pricing', e)} className="hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/start" onClick={(e) => handleNav('start', e)} className="hover:text-white transition-colors">
                  Start Here
                </a>
              </li>
            </ul>
          </div>

          {/* Trust & Safety Links */}
          <div className="space-y-3">
            <div className="font-editorial text-sm text-white font-medium">Trust</div>
            <ul className="space-y-2 text-xs font-zen text-[#8D98A3]">
              <li>
                <a href="/ai-data" onClick={(e) => handleNav('ai', e)} className="hover:text-white transition-colors">
                  AI & Data
                </a>
              </li>
              <li>
                <a href="/evidence" onClick={(e) => handleNav('evidence', e)} className="hover:text-white transition-colors">
                  Evidence & Research
                </a>
              </li>
              <li>
                <a href="/about" onClick={(e) => handleNav('about', e)} className="hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="/crisis" onClick={(e) => handleNav('crisis', e)} className="hover:text-[#E0A898] transition-colors font-medium">
                  In Crisis Right Now?
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <div className="font-editorial text-sm text-white font-medium">Legal</div>
            <ul className="space-y-2 text-xs font-zen text-[#8D98A3]">
              <li>
                <a href="/privacy-policy" className="text-left text-xs text-[#8D98A3] hover:text-white transition-colors cursor-pointer block">
                  Privacy policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-left text-xs text-[#8D98A3] hover:text-white transition-colors cursor-pointer block">
                  Terms of service
                </a>
              </li>
              <li>
                <a href="/terms" className="text-left text-xs text-[#8D98A3] hover:text-white transition-colors cursor-pointer block">
                  Refund & cancellation policy
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono-code text-[#606E7A] gap-4">
          <div>
            © {new Date().getFullYear()} Ingress Within. All rights reserved.
          </div>
          <div className="text-center sm:text-right text-[10.5px]">
            Designed for India · Non-clinical inquiry & structured psychological reflection
          </div>
        </div>

      </div>
    </footer>
  );
}
