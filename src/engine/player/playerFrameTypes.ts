import type { RootState } from '@react-three/fiber';
import type * as THREE from 'three';
import type { RapierRigidBody, RapierCollider } from '@react-three/rapier';
import type { RapierCharacterController } from '@/engine/physics/rapierTypes';
import type { SceneId } from '@/shared/types/game';
import type { VirtualControls, PlayerControls } from '@/hooks/useGamePhysics';
import type { DirectMovementTelemetryRefs } from '@/engine/player/directMovementTelemetry';
import type { VirtualHoldTimes } from '@/engine/VirtualInputHold';
import type { getSceneConfig, getExplorationMovementTuning } from '@/config/scenes';

/** Per-frame scratch shared across sequential player tick stages. */
export interface PlayerFrameScratch {
  tickState: RootState | null;
  dt: number;
  rb: RapierRigidBody | null;
  controller: RapierCharacterController | null;
  vel: THREE.Vector3;
  floorY: number;
  isLocked: boolean;
  currentMode: string;
  wasGrounded: boolean;
  isMoving: boolean;
  running: boolean;
  keyboardDrivesMove: boolean;
  blockedByWall: boolean;
  onFlatGround: boolean;
  airborneIntent: boolean;
  floorSlack: number;
  isGroundedNow: boolean;
  isOutdoor: boolean;
  groundY: number;
}

export interface PlayerMovementDeps {
  sceneId: SceneId;
  config: ReturnType<typeof getSceneConfig>;
  locomotionScale: number;
  movementTuning: ReturnType<typeof getExplorationMovementTuning>;
  world: { createCharacterController: (offset: number) => RapierCharacterController };
  rapier: unknown;
  controls: PlayerControls;
  frameScratchRef: React.MutableRefObject<PlayerFrameScratch>;
  rigidBodyRef: React.MutableRefObject<RapierRigidBody>;
  capsuleColliderRef: React.MutableRefObject<RapierCollider | null>;
  controllerRef: React.MutableRefObject<RapierCharacterController | null>;
  velocityRef: React.MutableRefObject<THREE.Vector3>;
  isGroundedRef: React.MutableRefObject<boolean>;
  coyoteTimerRef: React.MutableRefObject<number>;
  jumpCooldownRef: React.MutableRefObject<number>;
  footstepTimerRef: React.MutableRefObject<number>;
  currentAnimRef: React.MutableRefObject<string>;
  stuckLockTimerRef: React.MutableRefObject<number>;
  warmupTimerRef: React.MutableRefObject<number>;
  noMovementFramesRef: React.MutableRefObject<number>;
  kccRecoveryFramesRef: React.MutableRefObject<number>;
  controllerFailCountRef: React.MutableRefObject<number>;
  useDirectMovementRef: React.MutableRefObject<boolean>;
  snapAirborneRef: React.MutableRefObject<boolean>;
  rbBoundRef: React.MutableRefObject<boolean>;
  prevRbPosRef: React.MutableRefObject<THREE.Vector3>;
  currentFloorMaterialRef: React.MutableRefObject<string>;
  virtualHoldTimesRef: React.MutableRefObject<VirtualHoldTimes>;
  directMovementTelemetry: DirectMovementTelemetryRefs;
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
  virtualControlsRef?: React.MutableRefObject<VirtualControls>;
  moveBlendRef?: React.MutableRefObject<number>;
  tempCameraForward: React.MutableRefObject<THREE.Vector3>;
  tempCameraRight: React.MutableRefObject<THREE.Vector3>;
  tempUp: React.MutableRefObject<THREE.Vector3>;
  tempMoveDir: React.MutableRefObject<THREE.Vector3>;
}
