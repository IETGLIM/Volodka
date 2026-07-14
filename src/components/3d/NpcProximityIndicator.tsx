/* ─── Volodka RPG – NPC Proximity Indicator ─── */
/* Enhanced 3D billboard that floats above NPCs showing:
 *  - NPC name with relationship color (green/yellow/red)
 *  - Pulsing "!" indicator when dialogue is available
 *  - Distance-based fade (visible within 8m, fades 6-8m)
 *  - Cyberpunk glass styling with neon border */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { findNpcById } from '@/data/allNpcDefinitions';
import type { NpcProximityRuntime } from '@/engine/interaction/interactiveTriggerProximity';

/* ─── Distance thresholds ─── */
const VISIBLE_MAX = 8.0;
const FADE_START = 6.0;

/* ─── Relationship color map ─── */
function getRelationColor(value: number): string {
  if (value >= 65) return '#4ade80';  // green — friendly
  if (value >= 35) return '#facc15';  // yellow — neutral
  return '#f87171';                    // red — hostile
}

function getRelationLabel(value: number): string {
  if (value >= 65) return 'дружелюбен';
  if (value >= 35) return 'нейтрален';
  return 'враждебен';
}

/* ─── Component ─── */

export function NpcProximityIndicator({
  npcId,
  position,
  runtime,
  playerPositionRef,
}: {
  npcId: string;
  position: [number, number, number];
  runtime: NpcProximityRuntime;
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const npcDef = findNpcById(npcId);
  const hasDialogue = Boolean(npcDef?.dialogueNodeId);
  const npcName = npcDef?.name ?? npcId;

  // Read relation from store (non-reactive — read in useFrame)
  const opacityRef = useRef(0);
  const [opacity, setOpacity] = useState(0);
  const updateTimerRef = useRef(0);
  const htmlStyleRef = useRef<React.CSSProperties>({});

  // Compute relation color and label
  const relationInfo = useMemo(() => {
    const relations = useGameStore.getState().npcRelations;
    const rel = relations.find((r) => r.npcId === npcId);
    const value = rel?.value ?? 50;
    return {
      color: getRelationColor(value),
      label: getRelationLabel(value),
      value,
    };
  }, [npcId]);

  useFrame((_, delta) => {
    const dist = new THREE.Vector3(...position).distanceTo(playerPositionRef.current);

    // Compute target opacity based on distance
    let target = 0;
    if (dist <= FADE_START) {
      target = 1;
    } else if (dist <= VISIBLE_MAX) {
      target = 1 - (dist - FADE_START) / (VISIBLE_MAX - FADE_START);
    }

    opacityRef.current = target;

    // Throttle React state updates to ~10fps
    updateTimerRef.current += delta;
    if (updateTimerRef.current > 0.1) {
      updateTimerRef.current = 0;
      setOpacity((prev) => Math.abs(prev - target) > 0.05 ? target : prev);
    }
  });

  if (opacity <= 0.01) return null;

  return (
    <group position={position}>
      <Html
        position={[0, 2.8, 0]}
        center
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          opacity,
          transition: 'opacity 0.15s ease-out',
        }}
        zIndexRange={[0, 0]}
      >
        <div className="npc-proximity-indicator-wrapper">
          {/* Name + relation badge */}
          <div className="npc-prox-name-row">
            <span
              className="npc-prox-name"
              style={{ borderColor: relationInfo.color }}
            >
              {npcName}
            </span>
            <span
              className="npc-prox-relation-dot"
              style={{ backgroundColor: relationInfo.color, boxShadow: `0 0 6px ${relationInfo.color}` }}
              title={relationInfo.label}
            />
          </div>

          {/* Dialogue indicator */}
          {hasDialogue && (
            <div className="npc-prox-dialogue-mark">
              !
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}