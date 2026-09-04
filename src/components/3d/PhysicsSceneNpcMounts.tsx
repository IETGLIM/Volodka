/* ─── NPC + ambient life mounts (extracted from PhysicsSceneInner) ───
 *
 * Must mount after world dressing and before cinematic/trigger overlays.
 * See physicsSceneMountOrder.ts for full invariant list.
 */

import { memo, useEffect, useMemo, useState } from 'react';
import type * as THREE from 'three';
import { AmbientNPCs } from './AmbientNPCs';
import { NPCSystem } from './NPCSystem';
import { UmkaDog } from './UmkaDog';
import { FootstepDust } from './FootstepDust';
import { DialogueFocusTracker } from './DialogueFocusTracker';
import { DynamicProps } from './DynamicProps';
import { PatrollingCreeps } from './PatrollingCreeps';
import { MeleeStrikeFx } from './MeleeStrikeFx';
import { useNpcAmbientBarkSystem } from '@/engine/npc/npcAmbientBarkSystem';
import { eventBus } from '@/engine/EventBus';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import {
  getInteractionState,
  getInteractionTargetNPCId,
} from './InteractionSystemBridge';

export interface PhysicsSceneNpcMountsProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

type InteractionSnapshot = {
  state: InteractionState;
  targetNPCId: string | null;
};

const NPCSystemWrapper = memo(function NPCSystemWrapper({
  livePlayerPositionRef,
}: {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const initialInteraction = useMemo<InteractionSnapshot>(
    () => ({
      state: getInteractionState(),
      targetNPCId: getInteractionTargetNPCId(),
    }),
    [],
  );

  const [interaction, setInteraction] = useState<InteractionSnapshot>(initialInteraction);

  useEffect(() => {
    const unsub = eventBus.on('interaction:state_change', ({ state, npcId }) => {
      const targetNPCId = state === InteractionState.Idle ? null : (npcId ?? null);
      setInteraction((prev) => {
        if (prev.state === state && prev.targetNPCId === targetNPCId) return prev;
        return { state, targetNPCId };
      });
    });
    return unsub;
  }, []);

  const npcInteractionProps = useMemo(
    () => ({
      interactionState: interaction.state,
      interactionTargetNPCId: interaction.targetNPCId,
    }),
    [interaction.state, interaction.targetNPCId],
  );

  return (
    <NPCSystem
      livePlayerPositionRef={livePlayerPositionRef}
      interactionState={npcInteractionProps.interactionState}
      interactionTargetNPCId={npcInteractionProps.interactionTargetNPCId}
    />
  );
});

/**
 * Mounts the ambient bark system alongside NPCSystemWrapper so the per-frame
 * distance scan runs only while NPCs are mounted in the scene.
 */
function NpcAmbientBarkMount({
  livePlayerPositionRef,
}: {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}) {
  useNpcAmbientBarkSystem(livePlayerPositionRef);
  return null;
}

export function PhysicsSceneNpcMounts({ livePlayerPositionRef }: PhysicsSceneNpcMountsProps) {
  return (
    <>
      <NPCSystemWrapper livePlayerPositionRef={livePlayerPositionRef} />
      <NpcAmbientBarkMount livePlayerPositionRef={livePlayerPositionRef} />
      <UmkaDog livePlayerPositionRef={livePlayerPositionRef} />
      <FootstepDust />
      <DialogueFocusTracker />
      <AmbientNPCs livePlayerPositionRef={livePlayerPositionRef} />
      <DynamicProps />
      <PatrollingCreeps livePlayerPositionRef={livePlayerPositionRef} />
      {/* v4.8.7: искры «Опережающего удара» — рядом с крипами, тот же слой. */}
      <MeleeStrikeFx />
    </>
  );
}
