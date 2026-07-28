/**
 * Lazy-loaded Rapier physics subtree — keeps WASM + @react-three/rapier
 * out of the game-canvas entry chunk (avoids circular init with three/r3f).
 */

import { memo, useEffect, useMemo, useState } from 'react';
import { Physics } from '@react-three/rapier';
import type * as THREE from 'three';
import { SceneColliderSelector } from './SceneColliderSelector';
import { PhysicsPlayer } from './PhysicsPlayer';
import { FollowCamera } from './FollowCamera';
import { AmbientNPCs } from './AmbientNPCs';
import { InteractiveTriggers } from './InteractiveTriggers';
import { InteractionHighlight } from './InteractionHighlight';
import { SceneExitIndicator } from './SceneExitIndicator';
import { QuestWaypoints } from './QuestWaypoints';
import { ChoiceReactivity } from './ChoiceReactivity';
import { SceneTransitionHandler } from './SceneTransitionHandler';
import { SceneGpuLifecycleBridge } from './SceneGpuLifecycleBridge';
import { RapierWorldLifecycleBridge } from './RapierWorldLifecycleBridge';
import { ExplorationLighting } from './Lighting';
import { SceneEnvironment } from './SceneEnvironment';
import { EnvironmentalAnimator } from './EnvironmentalAnimator';
import { ProximityReactivityRenderer } from './ProximityReactivityRenderer';
import { InteractionQueryBridge } from './InteractionQueryBridge';
import { InteractionSystemBridge } from './InteractionSystemBridge';
import {
  getInteractionState,
  getInteractionTargetNPCId,
} from '@/engine/interaction/interactionSession';
import { WakeUpSequence } from './WakeUpSequence';
import { NPCSystem } from './NPCSystem';
import { RotationSyncBridge } from './RotationSyncBridge';
import { eventBus } from '@/engine/EventBus';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import type { VirtualControls } from '@/hooks/useGamePhysics';

export interface PhysicsSceneInnerProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
  virtualControlsRef: React.MutableRefObject<VirtualControls>;
  physicsPaused: boolean;
}

function PhysicsSceneInner({
  livePlayerPositionRef,
  livePlayerRotationRef,
  virtualControlsRef,
  physicsPaused,
}: PhysicsSceneInnerProps) {
  return (
    <Physics
      gravity={[0, -15, 0]}
      timeStep={1 / 60}
      interpolate={false}
      debug={false}
      paused={physicsPaused}
    >
      <SceneColliderSelector livePlayerPositionRef={livePlayerPositionRef} />
      <EnvironmentalAnimator livePlayerPositionRef={livePlayerPositionRef} />
      <PhysicsPlayer
        livePlayerPositionRef={livePlayerPositionRef}
        livePlayerRotationRef={livePlayerRotationRef}
        virtualControlsRef={virtualControlsRef}
        onInteractPress={() => {}}
      />
      <FollowCamera
        livePlayerPositionRef={livePlayerPositionRef}
        livePlayerRotationRef={livePlayerRotationRef}
      />
      <NPCSystemWrapper livePlayerPositionRef={livePlayerPositionRef} />
      <AmbientNPCs livePlayerPositionRef={livePlayerPositionRef} />
      <WakeUpSequence />
      <InteractiveTriggers
        livePlayerPositionRef={livePlayerPositionRef}
        livePlayerRotationRef={livePlayerRotationRef}
      />
      <InteractionQueryBridge />
      <InteractionHighlight />
      <ProximityReactivityRenderer livePlayerPositionRef={livePlayerPositionRef} />
      <SceneExitIndicator livePlayerPositionRef={livePlayerPositionRef} />
      <QuestWaypoints livePlayerPositionRef={livePlayerPositionRef} />
      <ChoiceReactivity />
      <SceneTransitionHandler />
      <SceneGpuLifecycleBridge />
      <RapierWorldLifecycleBridge />
      <InteractionSystemBridge
        livePlayerPositionRef={livePlayerPositionRef}
        livePlayerRotationRef={livePlayerRotationRef}
      />
      <RotationSyncBridge livePlayerRotationRef={livePlayerRotationRef} />
      <ExplorationLighting />
      <SceneEnvironment />
    </Physics>
  );
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

export { PhysicsSceneInner };
export default PhysicsSceneInner;
