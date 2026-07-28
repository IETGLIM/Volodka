/* ─── Volodka RPG – Compass POI Markers ───
   Renders directional markers around the compass indicator for active quest objectives.
   Shows small glowing dots with labels at the correct angle relative to player facing.
*/

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useActiveQuests, getQuestMarker } from '@/store/selectors/questSelectors';
import { usePlayerPosition, usePlayerRotation, useCurrentSceneId } from '@/store/selectors';
import { SCENE_CONFIG } from '@/config/scenes';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

const COMPASS_RADIUS_PX = 32; // distance from compass center to POI markers
const MAX_MARKERS = 4;

export function CompassPOIMarkers() {
  const activeQuests = useActiveQuests();
  const playerPos = usePlayerPosition();
  const playerRot = usePlayerRotation();
  const sceneId = useCurrentSceneId();
  const reducedMotion = useEffectiveReducedMotion();

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
      className="absolute inset-0 pointer-events-none"
      style={{ width: 50, height: 50 }}
      aria-hidden="true"
    >
      {markers.map((m, i) => {
        const x = 25 + Math.sin(m.angle) * COMPASS_RADIUS_PX;
        const y = 25 - Math.cos(m.angle) * COMPASS_RADIUS_PX;
        const _isOffscreen = Math.abs(m.angle) > Math.PI * 0.85;

        return (
          <motion.div
            key={m.questId}
            className="compass-poi-marker"
            initial={reducedMotion ? false : { scale: 0 }}
            animate={{
              scale: 1,
              left: x - 4,
              top: y - 4,
              opacity: m.inScene ? 1 : 0.5,
            }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            style={{
              position: 'absolute',
              background: m.inScene ? 'var(--cyber-cyan)' : 'rgba(251,191,36,0.8)',
              boxShadow: m.inScene
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