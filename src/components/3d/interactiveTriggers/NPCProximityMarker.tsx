import { useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useGameStore } from '@/store/gameStore';
import type { NpcProximityRuntime } from '@/engine/interaction/interactiveTriggerProximity';
import { findNpcById } from '@/data/allNpcDefinitions';
import { ProximityGodRay } from '../ProximityGodRay';

/** Visual marker for a single NPC proximity highlight */
export function NPCProximityMarker({
  npcId,
  position,
  runtime,
  unregisterPrompt,
}: {
  npcId: string;
  position: [number, number, number];
  runtime: NpcProximityRuntime;
  unregisterPrompt: (id: string) => void;
}) {
  const promptId = `npc_${npcId}`;
  const npcDef = findNpcById(npcId);
  const hasDialogue = Boolean(npcDef?.dialogueNodeId);
  const npcName = npcDef?.name ?? npcId;

  // Read NPC relation for color coding
  const npcRelations = useGameStore((s) => s.npcRelations);
  const relation = npcRelations.find((r) => r.npcId === npcId);
  const relationValue = relation?.value ?? 50;

  // Resolve relationship color: green (≥65), yellow (≥35), red (<35)
  const relationColor = relationValue >= 65
    ? '#4ade80'
    : relationValue >= 35
      ? '#facc15'
      : '#f87171';

  useEffect(() => {
    return () => {
      unregisterPrompt(promptId);
    };
  }, [promptId, unregisterPrompt]);

  return (
    <group position={position}>
      <ProximityGodRay
        activeRef={runtime.showIndicatorRef}
        color="#ffb828"
        beamHeight={2.6}
        baseY={0.2}
        proximityRef={runtime.proximityRef}
        pulsePhaseRef={runtime.pulsePhaseRef}
      />

      <Html
        position={[0, 2.8, 0]}
        center
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        zIndexRange={[0, 0]}
      >
        <div className="npc-proximity-indicator-wrapper">
          {/* Name with relation color accent */}
          <div className="npc-prox-name-row">
            <span
              className="npc-prox-name"
              style={{ borderColor: relationColor, color: relationColor }}
            >
              {npcName}
            </span>
            <span
              className="npc-prox-relation-dot"
              style={{
                backgroundColor: relationColor,
                boxShadow: `0 0 6px ${relationColor}`,
              }}
            />
          </div>

          {/* Dialogue "!" indicator */}
          {hasDialogue && (
            <div className="npc-dialogue-indicator npc-prox-dialogue-pulse">
              !
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}