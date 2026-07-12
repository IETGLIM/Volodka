import { useEffect } from 'react';
import type { NpcProximityRuntime } from '@/engine/interaction/interactiveTriggerProximity';
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
    </group>
  );
}
