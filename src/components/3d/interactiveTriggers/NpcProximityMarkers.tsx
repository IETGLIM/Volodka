import { useEffect } from 'react';
import type { MutableRefObject } from 'react';
import type { NpcQueryTarget } from '@/engine/interaction/interactionTargetQuery';
import {
  createNpcProximityRuntime,
  type NpcProximityRuntime,
} from '@/engine/interaction/interactiveTriggerProximity';
import { NPCProximityMarker } from './NPCProximityMarker';

/**
 * NPC proximity god-ray markers — proximity tick runs in InteractiveTriggers parent.
 */
export function NPCProximityTriggers({
  npcQueryTargets,
  npcRuntimeRef,
  unregisterPrompt,
}: {
  npcQueryTargets: NpcQueryTarget[];
  npcRuntimeRef: MutableRefObject<Map<string, NpcProximityRuntime>>;
  unregisterPrompt: (id: string) => void;
}) {
  return (
    <group>
      {npcQueryTargets.map((npc) => {
        let runtime = npcRuntimeRef.current.get(npc.npcId);
        if (!runtime) {
          runtime = createNpcProximityRuntime();
          npcRuntimeRef.current.set(npc.npcId, runtime);
        }
        return (
          <NPCProximityMarker
            key={npc.npcId}
            npcId={npc.npcId}
            position={npc.position}
            runtime={runtime}
            unregisterPrompt={unregisterPrompt}
          />
        );
      })}
    </group>
  );
}
