
/* ─── Volodka RPG – Noir Atmosphere Overlay ─── */
/* Film grain + warm flicker for Noir atmosphere.
   Vignette is handled by Three.js PostFX (ExplorationPostFX),
   so this CSS overlay only provides grain and subtle flicker.
   Darkness increases with stress level.
   CSS-based for performance — no 3D rendering. */

import { useNoirOverlayState } from '@/store/selectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/** Scenes that auto-enable noir overlay regardless of store flag */
const NOIR_SCENES = new Set([
  'volodka_room',
  'volodka_corridor',
  'cafe_evening',
  'rooftop_edge',
  'home_evening',
]);

export function NoirOverlay() {
  const { sceneId, noirMode, stress } = useNoirOverlayState();

  // Determine if noir should be active for this scene
  const isNoirScene = NOIR_SCENES.has(sceneId);
  const active = noirMode || isNoirScene;

  // Stress factor (0-1)
  const stressFactor = stress / 100;

  // Subtle chromatic shift on edges — increases with stress
  const chromaticShift = 1 + stressFactor * 2; // 1px to 3px

  if (!active) return null;

  return (
    <>
      {/* CSS keyframes defined in globals.css to avoid accessibility tree pollution */}

      {/* Subtle chromatic edge shift — NOT a vignette (vignette is in Three.js PostFX) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: UI_LAYERS.NOIR_OVERLAY,
          // Only a very subtle warm-to-cool edge tint, no darkening
          boxShadow: `inset ${chromaticShift}px 0 0 rgba(255, 120, 50, 0.02), inset -${chromaticShift}px 0 0 rgba(50, 120, 255, 0.02)`,
          // Slight desaturation filter for noir mode only
          filter: noirMode
            ? 'saturate(0.9)'
            : 'none',
        }}
        aria-hidden="true"
      />

      {/* Film grain overlay — animated for organic feel */}
      <div
        style={{
          position: 'fixed',
          top: '-10%',
          left: '-10%',
          width: '120%',
          height: '120%',
          pointerEvents: 'none',
          zIndex: UI_LAYERS.NOIR_OVERLAY,
          // CSS noise-like pattern via repeating gradients
          backgroundImage: `
            repeating-radial-gradient(circle at 17% 32%, rgba(255,255,255,0.01) 0px, transparent 1px),
            repeating-radial-gradient(circle at 62% 78%, rgba(0,0,0,0.02) 0px, transparent 1px),
            repeating-radial-gradient(circle at 83% 15%, rgba(255,255,255,0.01) 0px, transparent 1px)
          `,
          backgroundSize: '3px 3px, 4px 4px, 5px 5px',
          animation: 'noirGrain 0.3s steps(4) infinite',
          opacity: 0.03 + stressFactor * 0.02,
          mixBlendMode: 'overlay',
        }}
        aria-hidden="true"
      />

      {/* Subtle warm flicker (like old film projector) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: UI_LAYERS.NOIR_OVERLAY,
          background: 'rgba(255, 200, 120, 0.015)',
          animation: 'noirFlicker 3s ease-in-out infinite',
          mixBlendMode: 'overlay',
        }}
        aria-hidden="true"
      />
    </>
  );
}
