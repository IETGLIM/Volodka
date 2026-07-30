
/* ─── Volodka RPG – Player character with Rapier KinematicCharacterController ───
 *
 *  Movement logic lives in usePhysicsPlayerMovement + engine/player/* modules.
 */

import type * as THREE from 'three';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';

import { useCurrentSceneId, usePlayerPresentationState, usePlayerPosition } from '@/store/selectors';
import type { VirtualControls } from '@/hooks/useGamePhysics';
import {
  isIntroWakeupCutscene,
  shouldShowThirdPersonAvatar,
} from '@/engine/camera/cinematicPresentation';
import { useCinematicTimelineActive } from '@/hooks/useCinematicTimelineActive';
import { CinematicPlayerAvatar } from './CinematicPlayerAvatar';
import {
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
} from '@/engine/player/playerConstants';
import { getSceneConfig } from '@/config/scenes';
import { usePhysicsPlayerMovement } from './usePhysicsPlayerMovement';
import { PhysicsPlayerContactShadow } from './PhysicsPlayerContactShadow';

interface PhysicsPlayerProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
  virtualControlsRef?: React.MutableRefObject<VirtualControls>;
  physicsPaused?: boolean;
  onInteractPress?: () => void;
  moveBlendRef?: React.MutableRefObject<number>;
}

export function PhysicsPlayer({
  livePlayerPositionRef,
  livePlayerRotationRef,
  virtualControlsRef,
  physicsPaused = false,
  onInteractPress,
  moveBlendRef,
}: PhysicsPlayerProps) {
  const sceneId = useCurrentSceneId();
  const storeSpawn = usePlayerPosition();
  const { activeCutsceneId, gameMode } = usePlayerPresentationState();
  const timelineActive = useCinematicTimelineActive();
  const hideForCinematicAvatar =
    isIntroWakeupCutscene(activeCutsceneId) || timelineActive;
  const showThirdPersonBody =
    shouldShowThirdPersonAvatar(gameMode, activeCutsceneId) && !hideForCinematicAvatar;

  const { rigidBodyRef, capsuleColliderRef, currentAnimRef } = usePhysicsPlayerMovement({
    livePlayerPositionRef,
    livePlayerRotationRef,
    virtualControlsRef,
    physicsPaused,
    onInteractPress,
    moveBlendRef,
  });

  // Prefer transition spawn from store over config default — avoids one-frame
  // doorway remount pop (config spawn ≠ exit spawnAt).
  const configSpawn = getSceneConfig(sceneId).spawnPoint;
  const spawnPoint = storeSpawn ?? configSpawn;

  // Force RigidBody to remount on scene change to prevent stale position.
  // Without this key, React may reuse the RigidBody instance when sceneId
  // changes, leaving the player at the old scene's coordinates for 1+ frames.
  const playerKey = `physics-player-${sceneId}`;

  return (
    <RigidBody
      key={playerKey}
      ref={rigidBodyRef}
      type="kinematicPosition"
      position={[spawnPoint[0], spawnPoint[1], spawnPoint[2]]}
      colliders={false}
      lockRotations
    >
      <CapsuleCollider
        ref={capsuleColliderRef}
        args={[PLAYER_HEIGHT / 2 - PLAYER_RADIUS, PLAYER_RADIUS]}
        position={[0, PLAYER_HEIGHT / 2, 0]}
        friction={0.7}
        restitution={0}
      />

      {/* Contact blob always under capsule (TP body + FP-ready foot mark). */}
      <PhysicsPlayerContactShadow firstPerson={!showThirdPersonBody} />

      {showThirdPersonBody && (
        <CinematicPlayerAvatar
          currentAnimRef={currentAnimRef}
          rotationRef={livePlayerRotationRef}
        />
      )}
    </RigidBody>
  );
}
