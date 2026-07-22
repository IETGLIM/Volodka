/* ─── Volodka RPG – NPC Proximity Indicator ───
   Shows a floating card near the crosshair when the player is close to an NPC.
   Displays: NPC name, relationship level, and a breathing glow dot.
   Uses exploration:npcStates for position data and store for relations.
*/

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNpcStates, usePlayerPosition, useCurrentSceneId } from '@/store/selectors';
import { selectNpcRelations } from '@/store/selectors';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

const PROXIMITY_THRESHOLD = 4.5; // world units
const DISPLAY_Y_OFFSET = 80; // pixels above crosshair center

interface NearbyNPC {
  id: string;
  name: string;
  distance: number;
  relation: number;
}

function relationColor(r: number): string {
  if (r >= 70) return 'rgb(var(--cyber-cyan-rgb) / 0.9)';
  if (r >= 40) return 'rgba(251, 191, 36, 0.9)';
  return 'rgba(251, 113, 133, 0.9)';
}

function relationLabel(r: number): string {
  if (r >= 80) return 'ДРУГ';
  if (r >= 60) return 'ЗНАКОМЫЙ';
  if (r >= 40) return 'НЕЙТРАЛ';
  if (r >= 20) return 'НАТЯНУТЫЕ';
  return 'ВРАЖДЕБНЫЕ';
}

export function NPCProximityIndicator() {
  const npcStates = useNpcStates();
  const playerPos = usePlayerPosition();
  const sceneId = useCurrentSceneId();
  const reducedMotion = useEffectiveReducedMotion();
  const rafRef = useRef<number>(0);
  const [nearest, setNearest] = useState<NearbyNPC | null>(null);

  const relations = useMemo(() => selectNpcRelations(), [npcStates]);

  // Calculate nearest NPC in current scene
  useEffect(() => {
    let running = true;
    const check = () => {
      if (!running) return;
      const px = playerPos[0];
      const pz = playerPos[2];
      let closest: NearbyNPC | null = null;
      let closestDist = Infinity;

      for (const def of ALL_NPC_DEFINITIONS) {
        const state = npcStates[def.id];
        if (!state || state.sceneId !== sceneId) continue;

        const dx = px - state.position[0];
        const dz = pz - state.position[2];
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < PROXIMITY_THRESHOLD && dist < closestDist) {
          const rel = relations.find((r) => r.npcId === def.id);
          closest = {
            id: def.id,
            name: def.name,
            distance: dist,
            relation: rel?.value ?? 50,
          };
          closestDist = dist;
        }
      }

      setNearest(closest);
      rafRef.current = requestAnimationFrame(check);
    };
    rafRef.current = requestAnimationFrame(check);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [npcStates, playerPos, sceneId, relations]);

  return (
    <AnimatePresence>
      {nearest && (
        <motion.div
          key={nearest.id}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none"
          style={{
            position: 'fixed',
            top: `calc(50% - ${DISPLAY_Y_OFFSET}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: UI_LAYERS.HUD,
          }}
          aria-label={`${nearest.name}, ${relationLabel(nearest.relation)}`}
          role="status"
        >
          <div className="npc-proximity-card flex items-center gap-2.5 px-3 py-1.5">
            <div className="npc-proximity-dot" style={{ background: relationColor(nearest.relation) }} />
            <div className="flex flex-col gap-0.5">
              <span className="npc-proximity-name" style={{ color: relationColor(nearest.relation) }}>
                {nearest.name}
              </span>
              <span
                className="npc-proximity-relation"
                style={{
                  color: relationColor(nearest.relation),
                  borderColor: `${relationColor(nearest.relation)}25`,
                  background: `${relationColor(nearest.relation)}10`,
                }}
              >
                {relationLabel(nearest.relation)} · {nearest.relation}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}