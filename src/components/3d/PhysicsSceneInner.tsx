/**
 * Lazy-loaded Rapier physics subtree — keeps WASM + @react-three/rapier
 * out of the game-canvas entry chunk (avoids circular init with three/r3f).
 */

import { memo, useEffect, useMemo, useRef, useState } from 'react';
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
import { GRAVITY } from '@/engine/player/playerConstants';
import {
  InteractionSystemBridge,
  getInteractionState,
  getInteractionTargetNPCId,
} from './InteractionSystemBridge';
import { CinematicTimelineRunner } from './CinematicTimelineRunner';
import { NPCSystem } from './NPCSystem';
import { useNpcAmbientBarkSystem } from '@/engine/npc/npcAmbientBarkSystem';
import { DynamicProps } from './DynamicProps';
import { PatrollingCreeps } from './PatrollingCreeps';
import { RotationSyncBridge } from './RotationSyncBridge';
import { FirstPersonHands } from './FirstPersonHands';
import { UmkaDog } from './UmkaDog';
import { FootstepDust } from './FootstepDust';
import { DialogueFocusTracker } from './DialogueFocusTracker';
import { TriggerZoneProps } from './TriggerZoneProp';
import { WorldItemPickupGlows } from './WorldItemPickupGlow';
import { ScenePropDressing } from './ScenePropDressing';
import { SceneManifestAssets } from './SceneManifestAssets';
import { SceneInteriorAssets } from './SceneInteriorAssets';
import { eventBus } from '@/engine/EventBus';
import { FRAME_PHYSICS_R3F_PRIORITY } from '@/engine/frame/types';
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
  const moveBlendRef = useRef(0);

  return (
    <Physics
      gravity={[0, GRAVITY, 0]}
      timeStep={1 / 60}
      // FIX 1.1: Disable Rapier interpolation for the kinematic player body.
      // The player RigidBody is `type="kinematicPosition"` and its position
      // is set imperatively every frame inside the KCC substep loop
      // (physicsSubstep.ts). With `interpolate` enabled, @react-three/rapier
      // lerps the visual rigid-body transform between physics steps, so the
      // GLB avatar (child of <RigidBody>) is rendered at
      // `lerp(prevPos, currentPos, alpha)` while the camera (driven by
      // `livePlayerPositionRef = rb.translation()` from finalizePlayerFrame)
      // is positioned at `currentPos`. The avatar lags the camera by one
      // interpolation step → visible jitter/twitch during continuous movement,
      // exactly matching the user's report ("model twitches like a rerender
      // happens during movement"). Interpolation is designed for dynamic
      // bodies moved by forces, not kinematic bodies moved imperatively.
      // Other dynamic bodies in the scene (PatrollingCreeps, AmbientNPCs
      // physics props) lose interpolation smoothness, but the player is the
      // dominant focus — they are set directly via refs every frame anyway.
      interpolate={false}
      debug={false}
      paused={physicsPaused}
      updatePriority={FRAME_PHYSICS_R3F_PRIORITY}
    >
      <SceneColliderSelector livePlayerPositionRef={livePlayerPositionRef} />
      <EnvironmentalAnimator livePlayerPositionRef={livePlayerPositionRef} />
      <PhysicsPlayer
        livePlayerPositionRef={livePlayerPositionRef}
        livePlayerRotationRef={livePlayerRotationRef}
        virtualControlsRef={virtualControlsRef}
        moveBlendRef={moveBlendRef}
        physicsPaused={physicsPaused}
        onInteractPress={() => {
          eventBus.emit('interact:press', { source: 'player' });
        }}
      />
      <FollowCamera
        livePlayerPositionRef={livePlayerPositionRef}
        livePlayerRotationRef={livePlayerRotationRef}
        moveBlendRef={moveBlendRef}
      />
      <FirstPersonHands moveBlendRef={moveBlendRef} />
      <TriggerZoneProps />
      <WorldItemPickupGlows />
      <ScenePropDressing />
      <SceneManifestAssets />
      <SceneInteriorAssets />
      <NPCSystemWrapper livePlayerPositionRef={livePlayerPositionRef} />
      <NpcAmbientBarkMount livePlayerPositionRef={livePlayerPositionRef} />
      <UmkaDog livePlayerPositionRef={livePlayerPositionRef} />
      <FootstepDust />
      <DialogueFocusTracker />
      <AmbientNPCs livePlayerPositionRef={livePlayerPositionRef} />
      <DynamicProps />
      <PatrollingCreeps livePlayerPositionRef={livePlayerPositionRef} />
      <CinematicTimelineRunner />
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

/**
 * Mounts the ambient bark system alongside NPCSystemWrapper so the per-frame
 * distance scan runs only while NPCs are mounted in the scene. Reads the
 * shared livePlayerPositionRef to avoid prop-drilling.
 */
function NpcAmbientBarkMount({
  livePlayerPositionRef,
}: {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}) {
  useNpcAmbientBarkSystem(livePlayerPositionRef);
  return null;
}

export { PhysicsSceneInner };
export default PhysicsSceneInner;
