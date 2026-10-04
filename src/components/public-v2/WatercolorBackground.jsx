import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Physical Painted Watercolor Background
 * High-resolution authentic watercolor artwork on heavy cold-press warm ivory paper (#FAF7F2).
 * Smooth meditative emergence animation (2.2s duration, 0.15s delay) that triggers
 * reliably on initial load, page refresh, and every page/tab switch.
 */
export default function WatercolorBackground({ className = '', activeTab = 'home' }) {
  const [currentPath, setCurrentPath] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : ''
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePop = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // Use a single clean transition key to ensure AnimatePresence runs smoothly without race conditions
  const transitionKey = activeTab || currentPath || 'home';

  return (
    <div
      className={`fixed inset-0 pointer-events-none select-none z-0 overflow-hidden bg-[#FAF7F2] ${className}`}
      aria-hidden="true"
    >
      {/* Hardware-accelerated Framer Motion AnimatePresence fade on initial load AND every page/tab switch */}
      <AnimatePresence mode="wait">
        <motion.div
          key={transitionKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18, ease: 'easeOut' } }}
          transition={{
            duration: 1.2,
            delay: 0.15,
            ease: 'easeIn'
          }}
          className="w-full h-full"
        >
          {/* Inner wrapper: stable authentic watercolor canvas without GPU-heavy continuous drift */}
          <div className="absolute inset-0">
            <picture className="w-full h-full block">
              <source srcSet="/soft-watercolor-bg.webp?v=perimeter" type="image/webp" />
              <img
                src="/soft-watercolor-bg.jpg?v=perimeter"
                alt=""
                className="w-full h-full object-cover object-center pointer-events-none select-none scale-[1.04]"
                draggable="false"
                loading="eager"
              />
            </picture>
          </div>

          {/* Soft Warm Ivory Center Vignette: guarantees wide, calm, quiet, highly legible center column for typography while keeping perimeter watercolor expressive */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 72% 62% at 50% 46%, rgba(246, 241, 234, 0.86) 0%, rgba(246, 241, 234, 0.62) 38%, rgba(246, 241, 234, 0.20) 70%, transparent 95%)'
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
