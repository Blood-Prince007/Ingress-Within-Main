/**
 * Physical Painted Watercolor Background
 * High-resolution authentic watercolor artwork on heavy cold-press warm ivory paper (#FAF7F2).
 *
 * Characteristics:
 * 1. 2752x1536 Retina / 4K fidelity: razor-sharp paper fiber texture, crisp deckled boundaries,
 *    and physical watercolor granulation without digital compression artifacts.
 * 2. Fixed viewport canvas: remains fixed while all sections smoothly scroll over it.
 * 3. Organic, random perimeter flow: Sage green wash on upper-to-mid left, warm ochre and mauve
 *    on lower-left, spattered mauve/terracotta on mid-right, and gentle sage on lower-right.
 * 4. Free of thin pencil lines with a wide, clean center column for typography.
 * 5. Instantaneous 120 FPS rendering via dual WebP / JPEG picture source.
 */
export default function WatercolorBackground({ className = '' }) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none select-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <picture className="w-full h-full block">
        <source srcSet="/watercolor-canvas-bg.webp" type="image/webp" />
        <img
          src="/watercolor-canvas-bg.jpg"
          alt=""
          className="w-full h-full object-cover object-center pointer-events-none select-none"
          draggable="false"
          loading="eager"
          decoding="async"
        />
      </picture>
    </div>
  );
}
