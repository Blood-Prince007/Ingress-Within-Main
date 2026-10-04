/**
 * Card Emergence Scroll Animation Utility
 * STRICTLY SIDEWAYS (Pure Horizontal Translation - No vertical Y shift, No Skew, No Rotation)
 * 
 * Configured for an ultra-smooth, non-elastic slide emerging outward from center:
 * - Pure tween interpolation with a luxury deceleration curve ([0.16, 1, 0.3, 1])
 * - Zero elastic bounce, zero spring oscillations, zero snapping
 * - Cards visibly appear from center sliding left or right into their columns in unison
 */

export function getCardEmergence(index, total, is2D = false, cols = 3) {
  // Ultra-smooth, non-elastic deceleration curve (Cubic Bezier - no spring/bounce)
  const ease = [0.16, 1, 0.3, 1];
  const duration = 0.55;

  // 2D Grid calculation (e.g. 6 cards in 2x3): animate sideways outward from center column
  if (is2D && cols > 1) {
    const col = index % cols;
    const colCenter = (cols - 1) / 2;
    const colDiff = col - colCenter;
    let xOffset = 0;

    if (cols % 2 === 1) {
      if (colDiff < 0) {
        xOffset = 50; // Left column: starts toward center, slides left
      } else if (colDiff > 0) {
        xOffset = -50; // Right column: starts toward center, slides right
      }
    } else {
      xOffset = colDiff < 0 ? 45 : -45;
    }

    return {
      initial: {
        opacity: 0,
        x: xOffset
      },
      whileInView: {
        opacity: 1,
        x: 0
      },
      viewport: { once: true, amount: 0.15 },
      transition: {
        type: 'tween',
        duration,
        ease,
        delay: 0
      }
    };
  }

  // EVEN TOTAL (e.g. 2 cards, 4 cards): split sideways outward from center
  if (total % 2 === 0) {
    const center = (total - 1) / 2;
    const diff = index - center;
    const isLeft = diff < 0;
    const rank = Math.abs(diff);

    // Left cards start shifted right (+x) towards center and slide left to 0
    // Right cards start shifted left (-x) towards center and slide right to 0
    const distance = total === 2 ? 50 : 30 + (rank - 0.5) * 30;
    const xOffset = isLeft ? distance : -distance;

    return {
      initial: {
        opacity: 0,
        x: xOffset
      },
      whileInView: {
        opacity: 1,
        x: 0
      },
      viewport: { once: true, amount: 0.15 },
      transition: {
        type: 'tween',
        duration,
        ease,
        delay: 0
      }
    };
  }

  // ODD TOTAL (e.g. 3 cards, 5 cards): emerge sideways outward from anchor center
  const centerIndex = Math.floor(total / 2);

  if (index === centerIndex) {
    // Center Anchor Card: remains firmly in its resting place, smoothly fades in
    return {
      initial: {
        opacity: 0,
        x: 0
      },
      whileInView: {
        opacity: 1,
        x: 0
      },
      viewport: { once: true, amount: 0.15 },
      transition: {
        type: 'tween',
        duration,
        ease,
        delay: 0
      }
    };
  }

  // Outer cards: appear from center and slide left/right into position
  const isLeft = index < centerIndex;
  const dist = Math.abs(index - centerIndex);
  const xOffset = isLeft ? dist * 50 : -dist * 50;

  return {
    initial: {
      opacity: 0,
      x: xOffset
    },
    whileInView: {
      opacity: 1,
      x: 0
    },
    viewport: { once: true, amount: 0.15 },
    transition: {
      type: 'tween',
      duration,
      ease,
      delay: 0
    }
  };
}
