/* ─── Volodka RPG – Compass POI Markers ───
   Renders directional markers around the compass indicator for active quest objectives.
   Shows small glowing dots with labels at the correct angle relative to player facing.
   Journal `quest:pulse_marker` briefly boosts the matching POI pulse.
*/

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useActiveQuests, getQuestMarker } from '@/store/selectors/questSelectors';
import { usePlayerPosition, usePlayerRotation, useCurrentSceneId } from '@/store/selectors';
import { SCENE_CONFIG } from '@/config/scenes';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { eventBus } from '@/engine/EventBus';

const COMPASS_RADIUS_PX = 32; // distance from compass center to POI markers
const MAX_MARKERS = 4;
const PULSE_DECAY_MS = 1800;

export function CompassPOIMarkers() {
  const activeQuests = useActiveQuests();
  const playerPos = usePlayerPosition();
  const playerRot = usePlayerRotation();
  const sceneId = useCurrentSceneId();
  const reducedMotion = useEffectiveReducedMotion();
  const [pulseQuestId, setPulseQuestId] = useState<string | null>(null);
  const pulseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const unsub = eventBus.on('quest:pulse_marker', ({ questId }) => {
      setPulseQuestId(questId);
      if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = window.setTimeout(() => {
        setPulseQuestId(null);
        pulseTimerRef.current = null;
      }, PULSE_DECAY_MS);
    });
    return () => {
      unsub();
      if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
    };
  }, []);

  const markers = useMemo(() => {
    const result: Array<{
      questId: string;
      label: string;
      angle: number;
      inScene: boolean;
      distance: number;
    }> = [];

    for (const quest of activeQuests) {
      const m = getQuestMarker(quest.questId);
      if (!m) continue;

      const sceneConfig = SCENE_CONFIG[m.sceneId];
      if (!sceneConfig) continue;

      // Calculate angle from player to target
      const dx = m.position[0] - playerPos[0];
      const dz = m.position[2] - playerPos[2];
      const worldAngle = Math.atan2(dx, dz); // 0 = north (+Z)
      const relativeAngle = worldAngle - playerRot;

      // Normalize to -PI..PI
      const normalized = ((relativeAngle + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

      const distance = Math.sqrt(dx * dx + dz * dz);
      const inScene = m.sceneId === sceneId;

      result.push({
        questId: quest.questId,
        label: sceneConfig.name ?? m.sceneId,
        angle: normalized,
        inScene,
        distance,
      });
    }

    // Sort: in-scene first, then by distance
    result.sort((a, b) => {
      if (a.inScene !== b.inScene) return a.inScene ? -1 : 1;
      return a.distance - b.distance;
    });

    return result.slice(0, MAX_MARKERS);
  }, [activeQuests, playerPos, playerRot, sceneId]);

  if (markers.length === 0) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none hud-filmic-poi-ping"
      style={{ width: 50, height: 50 }}
      aria-hidden="true"
    >
      {markers.map((m, i) => {
        const x = 25 + Math.sin(m.angle) * COMPASS_RADIUS_PX;
        const y = 25 - Math.cos(m.angle) * COMPASS_RADIUS_PX;
        const pulsed = pulseQuestId === m.questId;

        return (
          <motion.div
            key={m.questId}
            className="compass-poi-marker"
            initial={reducedMotion ? false : { scale: 0 }}
            animate={{
              scale: pulsed ? [1, 1.55, 1.15] : 1,
              left: x - 4,
              top: y - 4,
              opacity: pulsed ? 1 : m.inScene ? 1 : 0.5,
            }}
            transition={
              pulsed && !reducedMotion
                ? { duration: 0.55, repeat: 2, ease: 'easeInOut' }
                : { duration: 0.3, delay: i * 0.05 }
            }
            style={{
              position: 'absolute',
              background: pulsed
                ? 'var(--cyber-magenta, #f0abfc)'
                : m.inScene
                  ? 'var(--cyber-cyan)'
                  : 'rgba(251,191,36,0.8)',
              boxShadow: pulsed
                ? '0 0 10px rgb(240 171 252 / 0.75)'
                : m.inScene
                  ? '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.5)'
                  : '0 0 4px rgba(251,191,36,0.4)',
            }}
            title={`${m.label}${m.inScene ? ` · ${Math.round(m.distance)}м` : ''}`}
          />
        );
      })}
    </div>
  );
}
