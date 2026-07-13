import { useEffect } from 'react';
import { Html } from '@react-three/drei';
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
      {hasDialogue && (
        <Html
          position={[0, 2.8, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
          zIndexRange={[0, 0]}
        >
          <div
            style={{
              color: '#ffb828',
              fontSize: '14px',
              fontFamily: 'monospace',
              fontWeight: 700,
              textShadow: '0 0 8px rgba(255,184,40,0.6), 0 0 16px rgba(255,184,40,0.3)',
              lineHeight: 1,
              animation: 'npc-dialogue-pulse 2.5s ease-in-out infinite',
            }}
          >
            !
          </div>
        </Html>
      )}
    </group>
  );
}
