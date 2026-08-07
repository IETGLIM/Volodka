/* ─── Volodka RPG – Scene Entry Nudge ───
 * A gentle directional hint when entering a new scene for the first time.
 * Briefly highlights the direction of the nearest point of interest
 * with a subtle amber vignette gradient that fades out after 1.5s.
 *
 * "Show don't tell" — the vignette draws the eye toward where
 * something interesting is, without a popup or text.
 *
 * Design:
 *  - On scene:loaded, check if this scene was visited before
 *    (module-level session Set — per-session only, resets on reload)
 *  - If first visit: render a 1.5s vignette gradient pointing toward
 *    the nearest POI (quest marker direction)
 *  - The vignette is a CSS radial gradient overlay fading from
 *    slight amber at the POI direction edge to transparent
 *  - Only fires once per scene per session
 *  - Gated on reduced-motion
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { getQuestMarker } from '@/store/selectors/questSelectors';
import { usePlayerPosition } from '@/store/selectors';
import { getGameStore } from '@/store/gameStore';
import { sharedCameraYawRef } from '@/engine/PlayerRotationState';
import type { SceneId } from '@/shared/types/game';

const NUDGE_DURATION_MS = 1500;
const AMBER_RGB = '255, 179, 71';

/** Per-session set of visited scene IDs — ensures nudge only fires once per scene. */
const visitedScenes = new Set<string>();

/** Compute the screen-space direction (0°=up, clockwise) toward a world position
 *  relative to the camera yaw. Returns null if no direction can be computed. */
function computeScreenDirection(
  targetX: number,
  targetZ: number,
  playerX: number,
  playerZ: number,
): number | null {
  const dx = targetX - playerX;
  const dz = targetZ - playerZ;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist < 0.5) return null;

  const worldAngle = Math.atan2(dx, dz);
  const camYaw = sharedCameraYawRef.current;
  let relative = worldAngle - camYaw;
  while (relative > Math.PI) relative -= Math.PI * 2;
  while (relative < -Math.PI) relative += Math.PI * 2;

  return (relative * 180) / Math.PI;
}

/** Map a screen direction angle to a CSS gradient position (0-100% on the edge). */
function directionToGradientOrigin(deg: number): { x: number; y: number } {
  // deg: 0=up, 90=right, 180=down, -90=left
  const rad = (deg * Math.PI) / 180;
  // Map to a point on the unit circle, then to screen percentages
  const x = 50 + Math.sin(rad) * 45;
  const y = 50 - Math.cos(rad) * 45;
  return { x: Math.round(x), y: Math.round(y) };
}

export function SceneEntryNudge() {
  const [nudgeScene, setNudgeScene] = useState<SceneId | null>(null);
  const [gradientOrigin, setGradientOrigin] = useState<{ x: number; y: number }>({ x: 50, y: 10 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useEffectiveReducedMotion();
  const playerPos = usePlayerPosition();

  // Listen for scene:loaded and check if first visit
  useEffect(() => {
    const unsub = eventBus.on('scene:loaded', (payload) => {
      const { sceneId: newSceneId } = payload;

      // Check if already visited this session
      if (visitedScenes.has(newSceneId)) return;

      // Mark as visited immediately so we don't re-trigger
      visitedScenes.add(newSceneId);

      // Find the direction toward the nearest POI (quest marker)
      const quests = getGameStore().quests.filter((q: { status: string }) => q.status === 'active');
      let bestDir: number | null = null;

      for (const quest of quests) {
        const marker = getQuestMarker(quest.questId);
        if (!marker) continue;
        // Use the marker position if in the same scene
        if (marker.sceneId === newSceneId) {
          const dir = computeScreenDirection(
            marker.position[0],
            marker.position[2],
            playerPos[0],
            playerPos[2],
          );
          if (dir !== null) {
            bestDir = dir;
            break;
          }
        }
      }

      // If no quest marker direction, skip the nudge (no POI to point at)
      if (bestDir === null) return;

      const origin = directionToGradientOrigin(bestDir);
      setGradientOrigin(origin);
      setNudgeScene(newSceneId);

      // Auto-dismiss after duration
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setNudgeScene(null);
        timerRef.current = null;
      }, NUDGE_DURATION_MS);
    });

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playerPos]);

  if (reducedMotion || !nudgeScene) return null;

  const gradientX = gradientOrigin.x;
  const gradientY = gradientOrigin.y;

  return (
    <AnimatePresence>
      {nudgeScene && (
        <motion.div
          key={`scene-nudge-${nudgeScene}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 pointer-events-none scene-entry-nudge-vignette"
          style={{
            zIndex: UI_LAYERS.HUD - 1,
            background: `radial-gradient(ellipse at ${gradientX}% ${gradientY}%, rgba(${AMBER_RGB}, 0.06) 0%, rgba(${AMBER_RGB}, 0.02) 30%, transparent 55%)`,
          }}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
}
