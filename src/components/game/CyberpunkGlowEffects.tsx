'use client';

/* ─── Volodka RPG – Cyberpunk Ambient Glow Effects ───
   CSS-only neon edge glow, stress response, location signature,
   and combat intensity overlays. Pure CSS, no canvas/WebGL. */

import { useMemo } from 'react';
import { useCurrentSceneId } from '@/store/selectors/explorationSelectors';
import { usePlayerStress } from '@/store/selectors/playerSelectors';
import { useGamePhase } from '@/store/selectors/uiSelectors';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

/** Map scene IDs to location glow color class */
function resolveLocationGlowClass(sceneId: string): string {
  // Underground scenes → purple
  if (sceneId.includes('underground') || sceneId.includes('bunker') || sceneId.includes('tunnel')) {
    return 'cpglow-location-purple';
  }
  // Dream scenes → magenta
  if (sceneId.includes('dream') || sceneId.includes('sleep_dream') || sceneId.includes('nightmare')) {
    return 'cpglow-location-magenta';
  }
  // Forest/outdoor nature scenes → emerald
  if (sceneId.includes('forest') || sceneId.includes('park') || sceneId.includes('garden')) {
    return 'cpglow-location-emerald';
  }
  // Street night / urban → default cyan (no extra class needed)
  return '';
}

export function CyberpunkGlowEffects() {
  const sceneId = useCurrentSceneId();
  const stress = usePlayerStress();
  const gamePhase = useGamePhase();
  const reducedMotion = useEffectiveReducedMotion();

  const isCombat = gamePhase === 'combat';
  const locationClass = resolveLocationGlowClass(sceneId);

  // Stress intensity: 0 at 0 stress, ramps up above 60, max at 100
  const stressIntensity = useMemo(() => {
    if (stress <= 60) return 0;
    return Math.min(0.25, ((stress - 60) / 40) * 0.25);
  }, [stress]);

  const stressBeating = stress > 80;

  // Edge glow intensity: base 0.08, stronger in combat, location modulated
  const edgeIntensity = isCombat ? 0.18 : 0.08;
  const pulseSpeed = isCombat ? '1.8s' : '4s';

  if (reducedMotion) {
    // Render minimal version: just stress overlay when high stress
    if (stressIntensity <= 0) return null;
    return (
      <div
        className="cpglow-stress-overlay"
        style={{ '--cpglow-stress-intensity': stressIntensity } as React.CSSProperties}
      />
    );
  }

  return (
    <>
      {/* Neon edge glow — location-colored */}
      <div
        className={`cpglow-neon-edge ${locationClass}`}
        style={{
          '--cpglow-edge-intensity': edgeIntensity,
          '--cpglow-pulse-speed': pulseSpeed,
        } as React.CSSProperties}
        aria-hidden="true"
      />

      {/* Stress response glow — red ambient */}
      {stressIntensity > 0 && (
        <div
          className={`cpglow-stress-overlay ${stressBeating ? 'cpglow-stress-beating' : ''}`}
          style={{ '--cpglow-stress-intensity': stressIntensity } as React.CSSProperties}
          aria-hidden="true"
        />
      )}
    </>
  );
}
