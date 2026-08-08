/* ─── Volodka RPG – HUD Ambient Color Overlay ───
   Full-screen, very low-opacity color wash that shifts based on:
   - Time of day (warm sunset, cool night, neutral day)
   - Location (factory amber, forest green, city cyan, etc.)
   - Stress level (rose tint at high stress)

   Respects reduced motion (CSS transitions only, no animations).
   Layers below HUD (z-index 2), above canvas (z-index 1).
*/

import { useMemo } from 'react';
import { useHUDControllerState } from '@/store/selectors/hudSelectors';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

/* ── Location color map ── */
type LocationColor = {
  /** RGBA string for the overlay tint */
  tint: string;
  /** Overlay opacity (2-5% range) */
  opacity: number;
};

/** Map scene IDs to their ambient color signatures */
function getLocationColor(sceneId: string): LocationColor | null {
  // Factory / industrial scenes — warm amber
  if (sceneId.includes('factory') || sceneId.includes('basement') || sceneId === 'guild_mainframe') {
    return { tint: '255, 160, 40', opacity: 0.04 };
  }
  // Forest / outdoor nature — deep green
  if (sceneId.includes('forest') || sceneId.includes('chk_') || sceneId.includes('park')) {
    return { tint: '40, 180, 80', opacity: 0.03 };
  }
  // City / urban — cool cyan
  if (sceneId.includes('street') || sceneId.includes('city_square') || sceneId.includes('office')) {
    return { tint: '0, 200, 240', opacity: 0.025 };
  }
  // Rooftop — cool blue-violet, open sky
  if (sceneId.includes('rooftop') || sceneId.includes('roof')) {
    return { tint: '100, 140, 255', opacity: 0.025 };
  }
  // River / pier — blue-teal
  if (sceneId.includes('pier') || sceneId.includes('river')) {
    return { tint: '40, 180, 200', opacity: 0.03 };
  }
  // Library — warm paper, dusty
  if (sceneId.includes('library')) {
    return { tint: '200, 180, 130', opacity: 0.025 };
  }
  // Cafe / home / warm interior
  if (sceneId.includes('cafe') || sceneId.includes('home') || sceneId.includes('solnysh') || sceneId.includes('zarema')) {
    return { tint: '220, 180, 100', opacity: 0.03 };
  }
  // Dream — surreal violet
  if (sceneId.includes('dream') || sceneId.includes('sleep')) {
    return { tint: '180, 100, 255', opacity: 0.04 };
  }
  // Bunker — military green
  if (sceneId.includes('bunker')) {
    return { tint: '60, 140, 60', opacity: 0.035 };
  }
  // Default: no location tint
  return null;
}

/** Time-of-day color shift */
function getTimeColor(hour: number): LocationColor | null {
  // Early morning sunrise — warm orange
  if (hour >= 5 && hour < 8) {
    return { tint: '255, 140, 60', opacity: 0.03 };
  }
  // Sunset — deep amber-orange
  if (hour >= 18 && hour < 21) {
    return { tint: '220, 100, 40', opacity: 0.04 };
  }
  // Night — cool blue
  if (hour >= 21 || hour < 5) {
    return { tint: '30, 60, 140', opacity: 0.04 };
  }
  // Day (8-18) — no time tint
  return null;
}

/** Stress tint — rose at high stress levels (0-100 scale) */
function getStressColor(stress: number): LocationColor | null {
  if (stress >= 70) {
    // High stress — visible rose tint
    const intensity = ((stress - 70) / 30); // 0..1
    return { tint: '255, 23, 68', opacity: 0.02 + intensity * 0.03 };
  }
  return null;
}

/** Combine all color layers into a single CSS background */
function buildOverlayStyle(
  locationColor: LocationColor | null,
  timeColor: LocationColor | null,
  stressColor: LocationColor | null,
): React.CSSProperties {
  const layers: string[] = [];

  if (locationColor) {
    layers.push(`rgba(${locationColor.tint}, ${locationColor.opacity})`);
  }
  if (timeColor) {
    layers.push(`rgba(${timeColor.tint}, ${timeColor.opacity})`);
  }
  if (stressColor) {
    layers.push(`rgba(${stressColor.tint}, ${stressColor.opacity})`);
  }

  if (layers.length === 0) {
    return { backgroundColor: 'transparent' };
  }

  // Layer all tints as a single solid color (they're all very low opacity,
  // so additive approximation is fine — the visual difference is negligible)
  return {
    background: layers.join(', '),
    backgroundBlendMode: 'normal',
  };
}

export function HudAmbientOverlay() {
  const reducedMotion = useEffectiveReducedMotion();
  const { timeOfDay, currentSceneId, stress } = useHUDControllerState();

  const locationColor = useMemo(() => getLocationColor(currentSceneId), [currentSceneId]);
  const timeColor = useMemo(() => getTimeColor(timeOfDay), [timeOfDay]);
  const stressColor = useMemo(() => getStressColor(stress), [stress]);

  const overlayStyle = useMemo(
    () => buildOverlayStyle(locationColor, timeColor, stressColor),
    [locationColor, timeColor, stressColor],
  );

  // Skip rendering if there's nothing visible to show
  const hasEffect = locationColor || timeColor || stressColor;
  if (!hasEffect) return null;

  return (
    <div
      className="hud-ambient-overlay"
      style={{
        ...overlayStyle,
        transition: reducedMotion ? 'none' : 'background-color 3s ease-in-out, opacity 3s ease-in-out',
      }}
      aria-hidden="true"
    />
  );
}
