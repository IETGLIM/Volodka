/* ─── Volodka RPG – Objective Beacon ───
 * A subtle pulsing chevron at the screen edge pointing toward the
 * current quest objective. "Show don't tell" — only appears after
 * the player has been searching 15+ seconds without reaching the
 * objective. Fades in gently over 2s, breathes with warm amber glow.
 *
 * Conditions:
 *  - Active quest objective exists
 *  - Player hasn't reached the target in 15+ seconds
 *  - Not in combat or cutscene
 *  - respects reduced-motion & mobile scaling
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useIsMobileVisual } from '@/hooks/use-mobile';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useActiveQuests, getQuestMarker } from '@/store/selectors/questSelectors';
import { useCurrentSceneId, usePlayerPosition, useGamePrimitive } from '@/store/selectors';
import { sharedCameraYawRef } from '@/engine/PlayerRotationState';

const DELAY_BEFORE_SHOW_MS = 15_000;
const MIN_DISTANCE_M = 2.5;
const UPDATE_INTERVAL_MS = 300;
const BEACON_SIZE_DESKTOP = 18;
const BEACON_SIZE_MOBILE = 14;
const AMBER_RGB = '255, 179, 71'; // #FFB347
const AMBER_OPACITY = 0.3;

export function ObjectiveBeacon() {
  const [rotationDeg, setRotationDeg] = useState(0);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useEffectiveReducedMotion();
  const isMobile = useIsMobileVisual();
  const activeQuests = useActiveQuests();
  const playerPos = usePlayerPosition();
  const sceneId = useCurrentSceneId();
  const combatActive = useGamePrimitive((s) => s.combatActive);
  const activeCutsceneId = useGamePrimitive((s) => s.activeCutsceneId);

  // Track how long the player has had an objective without reaching it
  const objectiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [delayExpired, setDelayExpired] = useState(false);

  const primary = useMemo(() => {
    for (const quest of activeQuests) {
      const m = getQuestMarker(quest.questId);
      if (!m) continue;
      return { questId: quest.questId, marker: m };
    }
    return null;
  }, [activeQuests]);

  // Reset the 15s delay timer whenever the primary objective changes
  useEffect(() => {
    setDelayExpired(false);
    if (objectiveTimerRef.current) clearTimeout(objectiveTimerRef.current);

    if (primary) {
      objectiveTimerRef.current = setTimeout(() => {
        setDelayExpired(true);
      }, DELAY_BEFORE_SHOW_MS);
    }

    return () => {
      if (objectiveTimerRef.current) clearTimeout(objectiveTimerRef.current);
    };
  }, [primary]);

  // Update the direction and visibility
  useEffect(() => {
    const tick = () => {
      // No objective, or in combat/cutscene, or delay not expired → hide
      if (!primary || combatActive || activeCutsceneId) {
        setVisible((v) => (v ? false : v));
        return;
      }

      const { marker } = primary;
      const inScene = marker.sceneId === sceneId;
      const dx = marker.position[0] - playerPos[0];
      const dz = marker.position[2] - playerPos[2];
      const dist = Math.sqrt(dx * dx + dz * dz);

      // If within range, hide and reset delay
      if (inScene && dist < MIN_DISTANCE_M) {
        setVisible((v) => (v ? false : v));
        setDelayExpired(false);
        // Restart the timer so it shows again if player wanders away
        if (objectiveTimerRef.current) clearTimeout(objectiveTimerRef.current);
        objectiveTimerRef.current = setTimeout(() => {
          setDelayExpired(true);
        }, DELAY_BEFORE_SHOW_MS);
        return;
      }

      // Only show after the 15s delay
      if (!delayExpired) {
        setVisible((v) => (v ? false : v));
        return;
      }

      const worldAngle = Math.atan2(dx, dz);
      const camYaw = sharedCameraYawRef.current;
      let relative = worldAngle - camYaw;
      while (relative > Math.PI) relative -= Math.PI * 2;
      while (relative < -Math.PI) relative += Math.PI * 2;

      // Convert to screen angle: 0° = up, clockwise positive (CSS)
      const deg = (relative * 180) / Math.PI;
      setRotationDeg((prev) => (Math.abs(prev - deg) < 1.5 ? prev : deg));
      setVisible(true);
    };

    tick();
    const id = window.setInterval(tick, UPDATE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [primary, playerPos, sceneId, combatActive, activeCutsceneId, delayExpired]);

  if (reducedMotion || !visible) return null;

  const beaconSize = isMobile ? BEACON_SIZE_MOBILE : BEACON_SIZE_DESKTOP;

  // Position the chevron at the screen edge — map the rotation to an edge position
  // We place it at a fixed spot on the bottom edge (like QuestDirectionArrow) but
  // with our own visual identity: warm amber chevron with breathing glow
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed pointer-events-none flex items-center justify-center"
          style={{
            bottom: isMobile ? 100 : 120,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: UI_LAYERS.HUD,
          }}
          aria-hidden="true"
        >
          <div
            className="relative flex items-center justify-center objective-beacon-breathe hud-filmic-beacon-pulse"
            style={{
              width: beaconSize,
              height: beaconSize,
              transform: `rotate(${rotationDeg}deg)`,
            }}
          >
            {/* Chevron arrow — warm amber */}
            <div
              className="absolute"
              style={{
                width: 0,
                height: 0,
                borderLeft: `${beaconSize * 0.45}px solid transparent`,
                borderRight: `${beaconSize * 0.45}px solid transparent`,
                borderBottom: `${beaconSize * 0.78}px solid rgba(${AMBER_RGB}, ${AMBER_OPACITY})`,
                filter: `drop-shadow(0 0 4px rgba(${AMBER_RGB}, 0.18))`,
                transform: 'translateY(-2px)',
              }}
            />
            {/* Breathing ring */}
            <div
              className="absolute inset-0 rounded-full objective-beacon-ring-pulse"
              style={{
                border: `1px solid rgba(${AMBER_RGB}, 0.12)`,
                background: `radial-gradient(circle, rgba(${AMBER_RGB}, 0.06) 0%, transparent 70%)`,
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
