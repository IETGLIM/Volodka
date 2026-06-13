
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

import { useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import type { RootState } from '@react-three/fiber';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { RigidBody, CapsuleCollider, useRapier, type RapierRigidBody, type RapierCollider } from '@react-three/rapier';
import * as THREE from 'three';

import { getGameStore, useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { useCurrentSceneId } from '@/store/selectors';
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
  MAX_SLOPE_CLIMB,
  MIN_SLOPE_SLIDE,
  AUTOSTEP_HEIGHT,
  AUTOSTEP_WIDTH,
  SNAP_DISTANCE,
} from '@/engine/player/playerConstants';
import {
  activateDirectMovementMode,
  restoreKccMovementMode,
  type DirectMovementTelemetryRefs,
} from '@/engine/player/directMovementTelemetry';
import { disposeCharacterController } from '@/engine/player/characterControllerLifecycle';
import type { PlayerFrameScratch, PlayerMovementDeps } from '@/engine/player/playerFrameTypes';
import { preparePlayerFrame } from '@/engine/player/playerFramePrepare';
import { runLockedPlayerMovement } from '@/engine/player/playerLockedMovement';
import { runMainPlayerMovement } from '@/engine/player/playerMainMovement';
import { finalizePlayerFrame } from '@/engine/player/playerFinalizeFrame';

interface PhysicsPlayerProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
  virtualControlsRef?: React.MutableRefObject<VirtualControls>;
  onInteractPress?: () => void;
  moveBlendRef?: React.MutableRefObject<number>;
}


export function PhysicsPlayer({
  livePlayerPositionRef,
  livePlayerRotationRef,
  virtualControlsRef,
  onInteractPress,
  moveBlendRef,
}: PhysicsPlayerProps) {
  const controls = usePlayerControls(onInteractPress);
  const sceneId = useCurrentSceneId();
  const activeCutsceneId = useGameStore((s) => s.activeCutsceneId);
  const gameMode = useGameStore((s) => readGamePhase(s));
  const hideForWakeup = isIntroWakeupCutscene(activeCutsceneId);
  const showThirdPersonBody =
    shouldShowThirdPersonAvatar(gameMode, activeCutsceneId) && !hideForWakeup;

  const rigidBodyRef = useRef<RapierRigidBody>(null!);
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
  const kccRecoveryFramesRef = useRef(0);
  const virtualHoldTimesRef = useRef({});
  const rbBoundRef = useRef(false);
  const snapAirborneRef = useRef(false);

  const { world, rapier } = useRapier();

  const controllerFailCountRef = useRef(0);
  const useDirectMovementRef = useRef(false);
  const directMovementLoggedRef = useRef(false);
  const directMovementReasonRef = useRef<string | null>(null);
  const directMovementTelemetry: DirectMovementTelemetryRefs = {
    useDirectRef: useDirectMovementRef,
    loggedRef: directMovementLoggedRef,
    reasonRef: directMovementReasonRef,
  };

  useEffect(() => {
    const controller = world.createCharacterController(SKIN_WIDTH);
    controller.setUp({ x: 0, y: 1, z: 0 });
    controller.setMaxSlopeClimbAngle(MAX_SLOPE_CLIMB);
    controller.setMinSlopeSlideAngle(MIN_SLOPE_SLIDE);
    controller.enableAutostep(AUTOSTEP_HEIGHT, AUTOSTEP_WIDTH, true);
    controller.enableSnapToGround(SNAP_DISTANCE);
    controller.setSlideEnabled(true);
    controller.setApplyImpulsesToDynamicBodies(true);
    controller.setCharacterMass(75);
    controller.setNormalNudgeFactor(0.5);
    controllerRef.current = controller;

    return () => {
      disposeCharacterController(world, controller);
      controllerRef.current = null;
    };
  }, [world]);

  useLayoutEffect(() => {
    return () => {
      clearPlayerRigidBody();
      rbBoundRef.current = false;
    };
  }, []);

  const locomotionScale = getExplorationLocomotionScale(sceneId);
  const movementTuning = getExplorationMovementTuning(sceneId);
  const config = getSceneConfig(sceneId);

  useEffect(() => {
    if (sceneId !== prevSceneIdRef.current) {
      prevSceneIdRef.current = sceneId;
      const newConfig = getSceneConfig(sceneId);
      const storeSpawn = getGameStore().exploration.playerPosition;
      const spawn = storeSpawn ?? newConfig.spawnPoint;

      warmupTimerRef.current = 0;
      jumpCooldownRef.current = 0;
      noMovementFramesRef.current = 0;

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
    }
  }, [sceneId, livePlayerRotationRef, livePlayerPositionRef]);

  useEffect(() => {
    const unsub = eventBus.on('scene:enter', ({ sceneId: enteredScene }) => {
      const spawn = getGameStore().exploration.playerPosition;
      prevSceneIdRef.current = enteredScene;
      warmupTimerRef.current = 0;
      jumpCooldownRef.current = 0;
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
    currentMode: readGamePhase(getGameStore()),
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

  const movementDepsRef = useRef<PlayerMovementDeps | null>(null);
  if (!movementDepsRef.current) {
    movementDepsRef.current = {
      sceneId,
      config,
      locomotionScale,
      movementTuning,
      world,
      rapier,
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
      kccRecoveryFramesRef,
      controllerFailCountRef,
      useDirectMovementRef,
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
  } else {
    const deps = movementDepsRef.current;
    deps.sceneId = sceneId;
    deps.config = config;
    deps.locomotionScale = locomotionScale;
    deps.movementTuning = movementTuning;
    deps.world = world;
    deps.rapier = rapier;
    deps.controls = controls;
    deps.virtualControlsRef = virtualControlsRef;
    deps.moveBlendRef = moveBlendRef;
  }

  useFrameTick('player', ({ state, delta }) => {
    const deps = movementDepsRef.current!;
    deps.frameScratchRef.current.tickState = state;
    if (!preparePlayerFrame(deps, delta)) return;
    if (deps.frameScratchRef.current.isLocked) {
      runLockedPlayerMovement(deps);
      return;
    }
    if (!runMainPlayerMovement(deps)) return;
    finalizePlayerFrame(deps);
  }, { label: 'PhysicsPlayer' });

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
  const shadowTexture = useMemo(() => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.25)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.08)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }, []);

  useEffect(() => {
    return () => { shadowTexture.dispose(); };
  }, [shadowTexture]);

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
