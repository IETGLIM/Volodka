/* ─── Volodka RPG – HUD Chromatic Edge ───
 * Subtle chromatic aberration effect at screen edges.
 * Adds a thin RGB split on the very edge of the viewport,
 * creating a cyberpunk "damaged optics" aesthetic.
 * Intensifies during low energy or high stress.
 */

import { motion } from 'framer-motion';
import { useHUDControllerState } from '@/store/selectors';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

export function HUDChromaticEdge() {
  const reducedMotion = useEffectiveReducedMotion();
  const { energy, stress } = useHUDControllerState();

  const intensity = energy < 25 || stress > 70 ? 0.8 : 0.25;

  if (reducedMotion) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none chromatic-edge-container hud-filmic-chromatic-shift"
      aria-hidden="true"
      style={{ zIndex: 3 }}
    >
      {/* Left edge — red shift */}
      <motion.div
        className="absolute top-0 left-0 bottom-0 chromatic-edge-red"
        style={{
          width: 3,
          background: 'linear-gradient(90deg, rgba(255, 60, 60, 0.12), transparent)',
          opacity: intensity,
        }}
        animate={{ opacity: [intensity * 0.7, intensity, intensity * 0.7] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Right edge — blue shift */}
      <motion.div
        className="absolute top-0 right-0 bottom-0 chromatic-edge-blue"
        style={{
          width: 3,
          background: 'linear-gradient(270deg, rgba(60, 100, 255, 0.12), transparent)',
          opacity: intensity,
        }}
        animate={{ opacity: [intensity * 0.7, intensity, intensity * 0.7] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      {/* Top edge — green shift */}
      <motion.div
        className="absolute top-0 left-0 right-0 chromatic-edge-green"
        style={{
          height: 2,
          background: 'linear-gradient(180deg, rgba(60, 255, 120, 0.08), transparent)',
          opacity: intensity * 0.5,
        }}
        animate={{ opacity: [intensity * 0.3, intensity * 0.5, intensity * 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
    </div>
  );
}