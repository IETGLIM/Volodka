/**

 * Lazy-loaded Rapier physics subtree — keeps WASM + @react-three/rapier

 * out of the game-canvas entry chunk (avoids circular init with three/r3f).

 */



import { useRef } from 'react';

import { Physics } from '@react-three/rapier';

import type * as THREE from 'three';

import { SceneColliderSelector } from './SceneColliderSelector';

import { PhysicsPlayer } from './PhysicsPlayer';

import { FollowCamera } from './FollowCamera';

import { SceneTransitionHandler } from './SceneTransitionHandler';

import { PhysicsSceneLifecycleMounts } from './PhysicsSceneLifecycleMounts';

import { PhysicsSceneInteractionBridges } from './PhysicsSceneInteractionBridges';

import { PhysicsSceneWorldDressingMounts } from './PhysicsSceneWorldDressingMounts';

import { PhysicsSceneProximityQuestMounts } from './PhysicsSceneProximityQuestMounts';

import { PhysicsSceneNpcMounts } from './PhysicsSceneNpcMounts';

import { PhysicsSceneCinematicMounts } from './PhysicsSceneCinematicMounts';

import { ExplorationLighting } from './Lighting';

import { SceneEnvironment } from './SceneEnvironment';

import { EnvironmentalAnimator } from './EnvironmentalAnimator';

import { GRAVITY } from '@/engine/player/playerConstants';

import { InteractionSystemBridge } from './InteractionSystemBridge';

import { RotationSyncBridge } from './RotationSyncBridge';

import { FirstPersonHands } from './FirstPersonHands';

import { eventBus } from '@/engine/EventBus';

import { FRAME_PHYSICS_R3F_PRIORITY } from '@/engine/frame/types';

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

      <PhysicsSceneWorldDressingMounts />

      <PhysicsSceneNpcMounts livePlayerPositionRef={livePlayerPositionRef} />

      <PhysicsSceneCinematicMounts

        livePlayerPositionRef={livePlayerPositionRef}

        livePlayerRotationRef={livePlayerRotationRef}

      />

      <PhysicsSceneInteractionBridges />

      <PhysicsSceneProximityQuestMounts livePlayerPositionRef={livePlayerPositionRef} />

      <SceneTransitionHandler />

      <PhysicsSceneLifecycleMounts />

      <InteractionSystemBridge

        livePlayerPositionRef={livePlayerPositionRef}

        livePlayerRotationRef={livePlayerRotationRef}

      />

      <RotationSyncBridge

        livePlayerRotationRef={livePlayerRotationRef}

        livePlayerPositionRef={livePlayerPositionRef}

      />

      <ExplorationLighting />

      <SceneEnvironment />

    </Physics>

  );

}



export { PhysicsSceneInner };

export default PhysicsSceneInner;


