import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Physical Painted Watercolor Background
 * High-resolution authentic watercolor artwork on heavy cold-press warm ivory paper (#FAF7F2).
 */
export default function WatercolorBackground({ className = '', activeTab = 'default' }) {
  const [currentPath, setCurrentPath] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : ''
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      handleLocationChange();
      return result;
    };

    window.history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      handleLocationChange();
      return result;
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  const transitionKey = `${activeTab}-${currentPath}`;

  return (
    <div
      className={`fixed inset-0 pointer-events-none select-none z-0 overflow-hidden bg-[#FAF7F2] ${className}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes ambientCanvasFloat {
          0% {
            transform: translate3d(0px, 0px, 0px);
          }
          50% {
            transform: translate3d(-7px, 5px, 0px);
          }
          100% {
            transform: translate3d(0px, 0px, 0px);
          }
        }
        .ambient-canvas-drift {
          animation: ambientCanvasFloat 28s ease-in-out infinite alternate;
          backface-visibility: hidden;
          will-change: transform;
        }
      `}</style>

      {/* Hardware-accelerated Framer Motion AnimatePresence fade on initial load AND every page/tab switch */}
      <AnimatePresence mode="wait">
        <motion.div
          key={transitionKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18, ease: 'easeOut' } }}
          transition={{
            duration: 2.2,
            delay: 0.15,
            ease: [0.25, 0.1, 0.25, 1]
          }}
          className="w-full h-full"
        >
          {/* Inner wrapper: gentle ambient drift */}
          <div className="absolute -inset-[32px] ambient-canvas-drift">
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

          {/* Soft Warm Ivory Center Vignette: guarantees wide, calm, legible center column for typography */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 50% 48%, rgba(250, 247, 242, 0.92) 0%, rgba(250, 247, 242, 0.65) 40%, transparent 80%)'
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

