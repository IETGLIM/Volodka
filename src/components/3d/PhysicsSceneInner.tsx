/**

 * Lazy-loaded Rapier physics subtree — keeps WASM + @react-three/rapier

 * out of the game-canvas entry chunk (avoids circular init with three/r3f).

 *

 * Thin orchestrator: each child wrapper maps to a section in physicsSceneMountOrder.ts.

 */



import { useRef } from 'react';

import { Physics } from '@react-three/rapier';

import type * as THREE from 'three';

import { PhysicsSceneLifecycleMounts } from './PhysicsSceneLifecycleMounts';

import { PhysicsSceneInteractionBridges } from './PhysicsSceneInteractionBridges';

import { PhysicsScenePlayerMounts } from './PhysicsScenePlayerMounts';

import { PhysicsSceneCameraMounts } from './PhysicsSceneCameraMounts';

import { PhysicsSceneWorldDressingMounts } from './PhysicsSceneWorldDressingMounts';

import { PhysicsSceneProximityQuestMounts } from './PhysicsSceneProximityQuestMounts';

import { PhysicsSceneNpcMounts } from './PhysicsSceneNpcMounts';

import { PhysicsSceneCinematicMounts } from './PhysicsSceneCinematicMounts';

import { PhysicsSceneTransitionMounts } from './PhysicsSceneTransitionMounts';

import { PhysicsSceneInteractionSystemMounts } from './PhysicsSceneInteractionSystemMounts';

import { PhysicsSceneLightingMounts } from './PhysicsSceneLightingMounts';
import { EnvironmentalHazardSystem } from './EnvironmentalHazardSystem';

import { GRAVITY } from '@/engine/player/playerConstants';

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

      <PhysicsScenePlayerMounts

        livePlayerPositionRef={livePlayerPositionRef}

        livePlayerRotationRef={livePlayerRotationRef}

        virtualControlsRef={virtualControlsRef}

        moveBlendRef={moveBlendRef}

        physicsPaused={physicsPaused}

      />

      <PhysicsSceneCameraMounts

        livePlayerPositionRef={livePlayerPositionRef}

        livePlayerRotationRef={livePlayerRotationRef}

        moveBlendRef={moveBlendRef}

      />

      <PhysicsSceneWorldDressingMounts />

      <PhysicsSceneNpcMounts livePlayerPositionRef={livePlayerPositionRef} />

      <PhysicsSceneCinematicMounts

        livePlayerPositionRef={livePlayerPositionRef}

        livePlayerRotationRef={livePlayerRotationRef}

      />

      <PhysicsSceneInteractionBridges />

      <PhysicsSceneProximityQuestMounts livePlayerPositionRef={livePlayerPositionRef} />

      <PhysicsSceneTransitionMounts />

      <PhysicsSceneLifecycleMounts />

      <PhysicsSceneInteractionSystemMounts

        livePlayerPositionRef={livePlayerPositionRef}

        livePlayerRotationRef={livePlayerRotationRef}

      />

      <PhysicsSceneLightingMounts />
      <EnvironmentalHazardSystem livePlayerPositionRef={livePlayerPositionRef} />

    </Physics>

  );

}



export { PhysicsSceneInner };



export default PhysicsSceneInner;

