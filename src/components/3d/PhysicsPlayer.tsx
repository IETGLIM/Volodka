
/* ─── Volodka RPG – Player character with Rapier KinematicCharacterController ───
 *
 *  FULL physics simulation — not a "collision-backed movement shell".
 *
 *  Architecture:
 *  ─────────────
 *  RigidBody type:  kinematicPosition
 *  Movement:        Rapier KinematicCharacterController.computeColliderMovement()
 *  Ground detect:   controller.computedGrounded()
 *  Slopes:          controller.setMaxSlopeClimbAngle() + setMinSlopeSlideAngle()
 *  Steps:           controller.enableAutostep()
 *  Snap-to-ground:  controller.enableSnapToGround()
 *  Combat collision: controller.numComputedCollisions() / computedCollision()
 *  Gravity:         Manual (vel.y += GRAVITY * dt)
 *  Jump:            Manual velocity burst (vel.y = JUMP_FORCE)
 *  Root-motion:     Add root displacement to desiredTranslation (future)
 *
 *  Why kinematicPosition + KinematicCharacterController?
 *  ─────────────────────────────────────────────────────
 *  • Proper collision resolution on slopes, steps, moving colliders
 *  • No jitter from fighting Rapier's dynamic body solver
 *  • Root-motion compatible (add root displacement to desiredTranslation)
 *  • Combat collision manifold is correct (contacts match visual position)
 *  • Player pushes dynamic bodies via setApplyImpulsesToDynamicBodies()
 *  • Ground snapping prevents "hovering" on edges
 *  • Autostep handles stairs and small obstacles
 */

import { useRef, useEffect, useLayoutEffect } from 'react';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import {
  CONTACT_SHADOW_CACHE_KEYS,
  createContactShadowTexture,
} from '@/engine/three/contactShadowTexture';
import type { RootState } from '@react-three/fiber';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { RigidBody, CapsuleCollider, useRapier, type RapierRigidBody, type RapierCollider } from '@react-three/rapier';
import * as THREE from 'three';

import { getGameStore } from '@/store/gameStore';
import { useCurrentSceneId, usePlayerPresentationState } from '@/store/selectors';
import { usePlayerControls, type VirtualControls } from '@/hooks/useGamePhysics';

import {
  getSceneConfig,
  getExplorationLocomotionScale,
  getExplorationMovementTuning,
} from '@/config/scenes';

import { eventBus } from '@/engine/EventBus';
import { setPlayerRigidBody, clearPlayerRigidBody } from '@/engine/PlayerRigidBodyState';
import {
  isIntroWakeupCutscene,
  shouldShowThirdPersonAvatar,
} from '@/engine/camera/cinematicPresentation';
import { CinematicPlayerAvatar } from './CinematicPlayerAvatar';
import type { RapierCharacterController } from '@/engine/physics/rapierTypes';
import {
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
  SKIN_WIDTH,
} from '@/engine/player/playerConstants';
import {
  restoreKccMovementMode,
  type DirectMovementTelemetryRefs,
} from '@/engine/player/directMovementTelemetry';
import {
  createConfiguredCharacterController,
  disposeCharacterController,
  recreateCharacterController,
} from '@/engine/player/characterControllerLifecycle';
import type { PlayerFrameScratch, PlayerMovementDeps } from '@/engine/player/playerFrameTypes';
import { preparePlayerFrame } from '@/engine/player/playerFramePrepare';
import { runLockedPlayerMovement } from '@/engine/player/playerLockedMovement';
import { runMainPlayerMovement } from '@/engine/player/playerMainMovement';
import { finalizePlayerFrame } from '@/engine/player/playerFinalizeFrame';
import {
  createGroundProbeCache,
} from '@/engine/physics/groundProbeCache';

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
  const controls = usePlayerControls(onInteractPress, virtualControlsRef);
  const sceneId = useCurrentSceneId();
  const { activeCutsceneId, gameMode } = usePlayerPresentationState();
  const hideForWakeup = isIntroWakeupCutscene(activeCutsceneId);
  const showThirdPersonBody =
    shouldShowThirdPersonAvatar(gameMode, activeCutsceneId) && !hideForWakeup;

  const rigidBodyRef = useRef<RapierRigidBody | null>(null);
  const capsuleColliderRef = useRef<RapierCollider | null>(null);
  const controllerRef = useRef<RapierCharacterController | null>(null);
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const isGroundedRef = useRef(true);
  const coyoteTimerRef = useRef(0);
  const jumpCooldownRef = useRef(0);
  const footstepTimerRef = useRef(0);
  const currentAnimRef = useRef<string>('idle');
  const prevSceneIdRef = useRef(sceneId);
  const currentFloorMaterialRef = useRef<string>('default');
  const stuckLockTimerRef = useRef(0);
  const warmupTimerRef = useRef(0);
  const prevRbPosRef = useRef(new THREE.Vector3());
  const noMovementFramesRef = useRef(0);
  const virtualHoldTimesRef = useRef({});
  const rbBoundRef = useRef(false);
  const snapAirborneRef = useRef(false);
  const mountedRef = useRef(true);

  const { world, rapier } = useRapier();

  const controllerFailCountRef = useRef(0);
  const controlsDegradedRef = useRef(false);
  const degradedLoggedRef = useRef(false);
  const degradedReasonRef = useRef<string | null>(null);
  const recreateAttemptsRef = useRef(0);
  const directMovementTelemetry: DirectMovementTelemetryRefs = {
    controlsDegradedRef,
    degradedLoggedRef,
    degradedReasonRef,
    recreateAttemptsRef,
  };

  const recreateCharacterControllerFn = useRef<(() => RapierCharacterController | null) | null>(null);
  recreateCharacterControllerFn.current = () => {
    const next = recreateCharacterController(world, controllerRef.current, SKIN_WIDTH);
    controllerRef.current = next;
    return next;
  };

  useEffect(() => {
    if (controllerRef.current) {
      disposeCharacterController(world, controllerRef.current);
    }
    controllerRef.current = createConfiguredCharacterController(world, SKIN_WIDTH);

    return () => {
      if (controllerRef.current) {
        disposeCharacterController(world, controllerRef.current);
        controllerRef.current = null;
      }
    };
  }, [world]);

  useLayoutEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearPlayerRigidBody();
      rbBoundRef.current = false;
    };
  }, []);

  const locomotionScale = getExplorationLocomotionScale(sceneId);
  const movementTuning = getExplorationMovementTuning(sceneId);
  const config = getSceneConfig(sceneId);
  const groundProbeCacheRef = useRef(createGroundProbeCache(config.floorY, sceneId));

  useEffect(() => {
    if (sceneId !== prevSceneIdRef.current) {
      prevSceneIdRef.current = sceneId;
      const newConfig = getSceneConfig(sceneId);
      const storeSpawn = getGameStore().exploration.playerPosition;
      const spawn = storeSpawn ?? newConfig.spawnPoint;

      jumpCooldownRef.current = 0;
      noMovementFramesRef.current = 0;
      if (moveBlendRef) moveBlendRef.current = 0;

      if (rigidBodyRef.current?.isValid()) {
        rigidBodyRef.current.setTranslation(
          { x: spawn[0], y: spawn[1], z: spawn[2] },
          true,
        );
        velocityRef.current.set(0, 0, 0);
      }
      livePlayerPositionRef.current.set(spawn[0], spawn[1], spawn[2]);
      livePlayerRotationRef.current = newConfig.initialRotation ?? 0;
      isGroundedRef.current = true;
      coyoteTimerRef.current = 0;

      restoreKccMovementMode(directMovementTelemetry, { sceneId });
      controllerFailCountRef.current = 0;
      groundProbeCacheRef.current = createGroundProbeCache(newConfig.floorY, sceneId);
    }
  }, [sceneId, livePlayerRotationRef, livePlayerPositionRef]);

  useEffect(() => {
    const unsub = eventBus.on('scene:enter', ({ sceneId: enteredScene }) => {
      const spawn = getGameStore().exploration.playerPosition;
      prevSceneIdRef.current = enteredScene;
      jumpCooldownRef.current = 0;
      if (moveBlendRef) moveBlendRef.current = 0;
      noMovementFramesRef.current = 0;
      velocityRef.current.set(0, 0, 0);
      isGroundedRef.current = true;
      coyoteTimerRef.current = 0;

      const sceneConfig = getSceneConfig(enteredScene);
      livePlayerRotationRef.current = sceneConfig.initialRotation ?? 0;

      if (rigidBodyRef.current?.isValid()) {
        rigidBodyRef.current.setTranslation(
          { x: spawn[0], y: spawn[1], z: spawn[2] },
          true,
        );
      }
      livePlayerPositionRef.current.set(spawn[0], spawn[1], spawn[2]);

      restoreKccMovementMode(directMovementTelemetry, { sceneId: enteredScene });
      controllerFailCountRef.current = 0;
      groundProbeCacheRef.current = createGroundProbeCache(sceneConfig.floorY, enteredScene);
    });
    return unsub;
  }, [livePlayerPositionRef, livePlayerRotationRef]);

  const tempCameraForward = useRef(new THREE.Vector3());
  const tempCameraRight = useRef(new THREE.Vector3());
  const tempUp = useRef(new THREE.Vector3(0, 1, 0));
  const tempMoveDir = useRef(new THREE.Vector3());

  const frameScratchRef = useRef<PlayerFrameScratch>({
    tickState: null as RootState | null,
    dt: 0,
    rb: null,
    controller: null,
    vel: velocityRef.current,
    floorY: config.floorY,
    isLocked: false,
    currentMode: 'exploration',
    wasGrounded: true,
    isMoving: false,
    running: false,
    keyboardDrivesMove: false,
    blockedByWall: false,
    onFlatGround: false,
    airborneIntent: false,
    floorSlack: 0.05,
    isGroundedNow: false,
    isOutdoor: false,
    groundY: config.floorY,
  });

  const movementDepsRef = useRef<PlayerMovementDeps>({
    sceneId,
    config,
    locomotionScale,
    movementTuning,
    world,
    rapier,
    groundProbeCacheRef,
    controls,
    frameScratchRef,
    rigidBodyRef,
    capsuleColliderRef,
    controllerRef,
    velocityRef,
    isGroundedRef,
    coyoteTimerRef,
    jumpCooldownRef,
    footstepTimerRef,
    currentAnimRef,
    stuckLockTimerRef,
    warmupTimerRef,
    noMovementFramesRef,
    controllerFailCountRef,
    controlsDegradedRef,
    recreateCharacterController: () => recreateCharacterControllerFn.current?.() ?? null,
    snapAirborneRef,
    rbBoundRef,
    prevRbPosRef,
    currentFloorMaterialRef,
    virtualHoldTimesRef,
    directMovementTelemetry,
    livePlayerPositionRef,
    livePlayerRotationRef,
    virtualControlsRef,
    moveBlendRef,
    tempCameraForward,
    tempCameraRight,
    tempUp,
    tempMoveDir,
  });

  useEffect(() => {
    movementDepsRef.current = {
      sceneId,
      config,
      locomotionScale,
      movementTuning,
      world,
      rapier,
      groundProbeCacheRef,
      controls,
      frameScratchRef,
      rigidBodyRef,
      capsuleColliderRef,
      controllerRef,
      velocityRef,
      isGroundedRef,
      coyoteTimerRef,
      jumpCooldownRef,
      footstepTimerRef,
      currentAnimRef,
      stuckLockTimerRef,
      warmupTimerRef,
      noMovementFramesRef,
      controllerFailCountRef,
      controlsDegradedRef,
      recreateCharacterController: () => recreateCharacterControllerFn.current?.() ?? null,
      snapAirborneRef,
      rbBoundRef,
      prevRbPosRef,
      currentFloorMaterialRef,
      virtualHoldTimesRef,
      directMovementTelemetry,
      livePlayerPositionRef,
      livePlayerRotationRef,
      virtualControlsRef,
      moveBlendRef,
      tempCameraForward,
      tempCameraRight,
      tempUp,
      tempMoveDir,
    };
  }, [
    sceneId,
    config,
    locomotionScale,
    movementTuning,
    world,
    rapier,
    controls,
    virtualControlsRef,
    moveBlendRef,
    livePlayerPositionRef,
    livePlayerRotationRef,
    directMovementTelemetry,
  ]);

  const pendingFinalizeRef = useRef(false);

  useFrameTick('player', ({ state, delta, game }) => {
    if (!mountedRef.current) return;
    pendingFinalizeRef.current = false;
    const deps = movementDepsRef.current;
    deps.frameScratchRef.current.tickState = state;
    if (!preparePlayerFrame(deps, delta, game)) return;
    if (deps.frameScratchRef.current.isLocked) {
      runLockedPlayerMovement(deps);
      pendingFinalizeRef.current = true;
      return;
    }
    if (!runMainPlayerMovement(deps)) {
      pendingFinalizeRef.current = true;
      return;
    }
    pendingFinalizeRef.current = true;
  }, { label: 'PhysicsPlayer', phase: 'pre_physics', enabled: !physicsPaused });

  useFrameTick('player', () => {
    if (!mountedRef.current || !pendingFinalizeRef.current) return;
    finalizePlayerFrame(movementDepsRef.current);
  }, { label: 'PhysicsPlayerFinalize', phase: 'post_physics', enabled: !physicsPaused });

  const spawnPoint = config.spawnPoint;

  return (
    <RigidBody
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

      {showThirdPersonBody && (
        <>
          <CinematicPlayerAvatar
            currentAnimRef={currentAnimRef}
            rotationRef={livePlayerRotationRef}
          />
          <ContactShadow />
        </>
      )}
    </RigidBody>
  );
}

/** Contact shadow — flat circle mesh under player feet with radial gradient */
function ContactShadow() {
  const shadowTexture = useCachedCanvasTexture(
    CONTACT_SHADOW_CACHE_KEYS.player,
    () => createContactShadowTexture({ variant: 'player' }),
  );

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={[0, 0.005, 0]}
    >
      <circleGeometry args={[0.4, 24]} />
      <meshBasicMaterial
        map={shadowTexture}
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </mesh>
  );
}
