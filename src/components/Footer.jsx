
export default function Footer({ onOpenPolicy }) {
  const getCopyrightYear = () => {
    return new Date().getFullYear();
  };

  const handlePolicyClick = (e, key) => {
    e.preventDefault();
    if (onOpenPolicy) {
      onOpenPolicy(key);
    }
  };

  return (
    <footer className="bg-primary border-t border-white/8 py-[3.5rem] px-[8%] text-left text-mint-grey/50">
      <div className="max-w-[1060px] mx-auto grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
        {/* Column 1: Brand descriptor */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-mark-light.png" 
              alt="Ingress Within" 
              className="w-8 h-8 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] flex-shrink-0" 
            />
            <div className="footer-logo-name font-serif text-xl font-normal text-white/95 leading-none">
              ingress <span className="font-semibold text-accent">within</span>
            </div>
          </div>
          <div className="footer-tagline font-sans text-[10px] font-medium text-white/45 tracking-[0.14em] uppercase">
            Understand. Grow. Continue
          </div>
          <p className="footer-desc font-sans text-[13px] font-light text-[#C8DDD9]/55 leading-relaxed max-w-[260px]">
            A space to process what you are carrying — before therapy, during it, after it, or entirely on your own.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <a
              href="https://www.instagram.com/ingresswithin"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Instagram: @ingresswithin"
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/company/ingress-within"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              title="LinkedIn: Ingress Within"
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a
              href="https://chat.whatsapp.com/LEw8xXpBuRg2ZYzZR9FH7T"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Community"
              title="WhatsApp Community: The Unsaid"
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-[#25D366]/20 text-white/60 hover:text-[#25D366] flex items-center justify-center transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Column 2: Product */}
        <div className="footer-col flex flex-col gap-3">
          <div className="footer-col-title font-sans text-[11px] font-semibold tracking-[0.1em] uppercase text-white/35">
            Product
          </div>
          <ul className="list-none space-y-2.5 p-0">
            <li><a href="/what-it-is" className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">What it is</a></li>
            <li><a href="/how-it-works" className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">How it works</a></li>
            <li><a href="/pricing" className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">Pricing</a></li>
            <li><a href="/auth" className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">Start writing</a></li>
          </ul>
        </div>

        {/* Column 3: Company */}
        <div className="footer-col flex flex-col gap-3">
          <div className="footer-col-title font-sans text-[11px] font-semibold tracking-[0.1em] uppercase text-white/35">
            Company
          </div>
          <ul className="list-none space-y-2.5 p-0">
            <li><a href="/about" className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">About</a></li>
            <li><a href="/ai-data" className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">AI &amp; Data</a></li>
            <li><a href="/contact" className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">Contact us</a></li>
            <li><a href="/faq" className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">FAQ</a></li>
          </ul>
        </div>

        {/* Column 4: Legal */}
        <div className="footer-col flex flex-col gap-3">
          <div className="footer-col-title font-sans text-[11px] font-semibold tracking-[0.1em] uppercase text-white/35">
            Legal
          </div>
          <ul className="list-none space-y-2.5 p-0">
            <li><a href="/" onClick={(e) => handlePolicyClick(e, 'privacy')} className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">Privacy policy</a></li>
            <li><a href="/" onClick={(e) => handlePolicyClick(e, 'terms')} className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">Terms of use</a></li>
            <li><a href="/" onClick={(e) => handlePolicyClick(e, 'cookies')} className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">Cookie policy</a></li>
            <li><a href="/" onClick={(e) => handlePolicyClick(e, 'data')} className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">Data &amp; security</a></li>
            <li><a href="/" onClick={(e) => handlePolicyClick(e, 'refund')} className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">Refund policy</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1060px] mx-auto border-t border-white/7 pt-7 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="footer-copy font-sans text-xs font-light text-white/50">
          &copy; {getCopyrightYear()} Ingress Within. All rights reserved.
        </div>
        <div className="footer-legal flex gap-6">
          <a href="/" onClick={(e) => handlePolicyClick(e, 'privacy')} className="font-sans text-xs font-light text-white/50 hover:text-white/75 no-underline transition-colors">Privacy policy</a>
          <a href="/" onClick={(e) => handlePolicyClick(e, 'terms')} className="font-sans text-xs font-light text-white/50 hover:text-white/75 no-underline transition-colors">Terms</a>
          <a href="/contact" className="font-sans text-xs font-light text-white/50 hover:text-white/75 no-underline transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}
