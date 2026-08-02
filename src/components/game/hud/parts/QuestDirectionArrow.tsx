/* ─── Volodka RPG – Quest Direction Arrow ───
 * Edge-of-screen arrow pointing toward the active quest objective
 * relative to camera look (Max Payne OTS-friendly).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useActiveQuests, getQuestMarker } from '@/store/selectors/questSelectors';
import { useCurrentSceneId, usePlayerPosition } from '@/store/selectors';
import { sharedCameraYawRef } from '@/engine/PlayerRotationState';
import { SCENE_CONFIG } from '@/config/scenes';

const ARROW_SIZE = 28;
const UPDATE_INTERVAL_MS = 200;
const MIN_DISTANCE_M = 2.5;

export function QuestDirectionArrow() {
  const [rotationDeg, setRotationDeg] = useState(0);
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState('');
  const [exitHint, setExitHint] = useState<{ deg: number; label: string } | null>(null);
  const reducedMotion = useEffectiveReducedMotion();
  const activeQuests = useActiveQuests();
  const playerPos = usePlayerPosition();
  const sceneId = useCurrentSceneId();
  const pulseBoostRef = useRef(false);

  const primary = useMemo(() => {
    for (const quest of activeQuests) {
      const m = getQuestMarker(quest.questId);
      if (!m) continue;
      return { questId: quest.questId, marker: m };
    }
    return null;
  }, [activeQuests]);

  useEffect(() => {
    const unsub = eventBus.on('quest:pulse_marker', () => {
      pulseBoostRef.current = true;
      window.setTimeout(() => {
        pulseBoostRef.current = false;
      }, 1600);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const tick = () => {
      if (!primary) {
        setVisible((v) => (v ? false : v));
        setExitHint((prev) => (prev ? null : prev));
        return;
      }

      const { marker } = primary;
      const inScene = marker.sceneId === sceneId;
      const dx = marker.position[0] - playerPos[0];
      const dz = marker.position[2] - playerPos[2];
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Hide when standing on the objective in-scene.
      if (inScene && dist < MIN_DISTANCE_M && !pulseBoostRef.current) {
        setVisible((v) => (v ? false : v));
        setExitHint((prev) => (prev ? null : prev));
        return;
      }

      const worldAngle = Math.atan2(dx, dz);
      const camYaw = sharedCameraYawRef.current;
      let relative = worldAngle - camYaw;
      while (relative > Math.PI) relative -= Math.PI * 2;
      while (relative < -Math.PI) relative += Math.PI * 2;

      // Screen arrow: 0° = up (camera forward). CSS rotate clockwise positive.
      const deg = (relative * 180) / Math.PI;
      setRotationDeg((prev) => (Math.abs(prev - deg) < 1.5 ? prev : deg));

      const sceneName = SCENE_CONFIG[marker.sceneId]?.name ?? marker.sceneId;
      setLabel(inScene ? `${Math.round(dist)}м` : sceneName);
      setVisible(true);

      // Cross-scene exit bearing: when the quest marker is in a different scene,
      // find the nearest exit trigger zone in the current scene and compute its
      // bearing. This gives the player a "→ выход" sub-label pointing toward the
      // door they need to take, instead of just showing the target scene name.
      if (!inScene) {
        const exits = SCENE_CONFIG[sceneId]?.exits;
        if (exits && exits.length > 0) {
          // Pick the exit whose target scene is on the shortest path (heuristic:
          // nearest by world distance to the player). This is a safe read-only
          // lookup — no state writes, no scene-graph mutation.
          let bestExit = exits[0]!;
          let bestDist = Infinity;
          for (const exit of exits) {
            const ex = exit.position[0] - playerPos[0];
            const ez = exit.position[2] - playerPos[2];
            const ed = Math.sqrt(ex * ex + ez * ez);
            if (ed < bestDist) {
              bestDist = ed;
              bestExit = exit;
            }
          }
          const exitDx = bestExit.position[0] - playerPos[0];
          const exitDz = bestExit.position[2] - playerPos[2];
          const exitAngle = Math.atan2(exitDx, exitDz);
          let exitRel = exitAngle - camYaw;
          while (exitRel > Math.PI) exitRel -= Math.PI * 2;
          while (exitRel < -Math.PI) exitRel += Math.PI * 2;
          const exitDeg = (exitRel * 180) / Math.PI;
          const exitLabel = bestExit.label || 'выход';
          setExitHint((prev) => {
            if (prev && Math.abs(prev.deg - exitDeg) < 2 && prev.label === exitLabel) return prev;
            return { deg: exitDeg, label: exitLabel };
          });
        } else {
          setExitHint((prev) => (prev ? null : prev));
        }
      } else {
        setExitHint((prev) => (prev ? null : prev));
      }
    };

    tick();
    const id = window.setInterval(tick, UPDATE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [primary, playerPos, sceneId]);

  if (reducedMotion || !visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed pointer-events-none flex flex-col items-center gap-1"
          style={{
            bottom: 140,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: UI_LAYERS.HUD,
          }}
          aria-hidden="true"
        >
          <div
            className="relative flex items-center justify-center quest-arrow-bob"
            style={{
              width: ARROW_SIZE,
              height: ARROW_SIZE,
              transform: `rotate(${rotationDeg}deg)`,
            }}
          >
            <div
              className="absolute"
              style={{
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: '14px solid rgb(var(--cyber-cyan-rgb) / 0.9)',
                filter: 'drop-shadow(0 0 6px rgb(var(--cyber-cyan-rgb) / 0.6))',
                transform: 'translateY(-3px)',
              }}
            />
            <div
              className="absolute inset-0 rounded-full quest-arrow-ring-pulse"
              style={{
                border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.25)',
                background:
                  'radial-gradient(circle, rgb(var(--cyber-cyan-rgb) / 0.08) 0%, transparent 70%)',
              }}
            />
          </div>
          {label ? (
            <span
              className="font-mono text-[9px] tracking-wide uppercase"
              style={{ color: 'rgb(var(--cyber-cyan-rgb) / 0.75)' }}
            >
              {label}
            </span>
          ) : null}
          {exitHint ? (
            <span
              className="flex items-center gap-1 font-mono text-[8px] tracking-wide uppercase whitespace-nowrap"
              style={{ color: 'rgba(251, 191, 36, 0.8)' }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  transform: `rotate(${exitHint.deg}deg)`,
                  transition: 'transform 0.2s linear',
                }}
              >
                ↑
              </span>
              <span>→ {exitHint.label}</span>
            </span>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
