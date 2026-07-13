/* ─── Physics player movement hook (refs, frame ticks, scene transitions) ─── */

import { useRef, useEffect, useLayoutEffect } from 'react';
import type { RootState } from '@react-three/fiber';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useRapier, type RapierRigidBody, type RapierCollider } from '@react-three/rapier';
import * as THREE from 'three';

import { getGameStore } from '@/store/gameStore';
import { useCurrentSceneId } from '@/store/selectors';
import { usePlayerControls, type VirtualControls } from '@/hooks/useGamePhysics';
import {
  getSceneConfig,
  getExplorationLocomotionScale,
  getExplorationMovementTuning,
} from '@/config/scenes';
import { eventBus } from '@/engine/EventBus';
import { clearPlayerRigidBody } from '@/engine/PlayerRigidBodyState';
import type { RapierCharacterController } from '@/engine/physics/rapierTypes';
import { SKIN_WIDTH } from '@/engine/player/playerConstants';
import {
  restoreKccMovementMode,
  type DirectMovementTelemetryRefs,
} from '@/engine/player/directMovementTelemetry';
import { setPlayerMovementMode } from '@/engine/player/playerMovementMode';
import {
  syncMovementSceneContext,
} from '@/engine/player/playerMovementSceneSync';
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
import { createGroundProbeCache } from '@/engine/physics/groundProbeCache';

export interface UsePhysicsPlayerMovementOptions {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
  virtualControlsRef?: React.MutableRefObject<VirtualControls>;
  physicsPaused?: boolean;
  onInteractPress?: () => void;
  moveBlendRef?: React.MutableRefObject<number>;
}

export interface PhysicsPlayerMovementRefs {
  rigidBodyRef: React.MutableRefObject<RapierRigidBody | null>;
  capsuleColliderRef: React.MutableRefObject<RapierCollider | null>;
  currentAnimRef: React.MutableRefObject<string>;
}

export function usePhysicsPlayerMovement({
  livePlayerPositionRef,
  livePlayerRotationRef,
  virtualControlsRef,
  physicsPaused = false,
  onInteractPress,
  moveBlendRef,
}: UsePhysicsPlayerMovementOptions): PhysicsPlayerMovementRefs {
  const controls = usePlayerControls(onInteractPress, virtualControlsRef);
  const sceneId = useCurrentSceneId();

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
  const prevLocomotionLockedRef = useRef(false);
  const warmupTimerRef = useRef(0);
  const prevRbPosRef = useRef(new THREE.Vector3());
  const noMovementFramesRef = useRef(0);
  const virtualHoldTimesRef = useRef({});
  const rbBoundRef = useRef(false);
  const snapAirborneRef = useRef(false);
  const mountedRef = useRef(true);
  const movementEpochRef = useRef(0);

  const { world, rapier } = useRapier();

  const controllerFailCountRef = useRef(0);
  const kccHealthyFramesRef = useRef(0);
  const controlsDegradedRef = useRef(false);
  const degradedLoggedRef = useRef(false);
  const degradedReasonRef = useRef<string | null>(null);
  const recreateAttemptsRef = useRef(0);
  const directMovementTelemetry = useRef<DirectMovementTelemetryRefs>({
    controlsDegradedRef,
    degradedLoggedRef,
    degradedReasonRef,
    recreateAttemptsRef,
  }).current;

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
    setPlayerMovementMode('kcc');
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
    movementEpoch: movementEpochRef.current,
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
    prevLocomotionLockedRef,
    warmupTimerRef,
    noMovementFramesRef,
    controllerFailCountRef,
    kccHealthyFramesRef,
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

  useLayoutEffect(() => {
    if (sceneId !== prevSceneIdRef.current) {
      prevSceneIdRef.current = sceneId;
      movementEpochRef.current += 1;
      const newConfig = getSceneConfig(sceneId);

      jumpCooldownRef.current = 0;
      noMovementFramesRef.current = 0;
      kccHealthyFramesRef.current = 0;
      currentAnimRef.current = 'idle';
      if (moveBlendRef) moveBlendRef.current = 0;

      // Position reset is handled by the scene:enter EventBus handler below,
      // which receives the canonical spawn point. Avoiding a duplicate
      // setTranslation here prevents a visible physics snap on scene changes.
      // We only set the position if the EventBus hasn't fired yet (fallback).
      const spawn = getGameStore().exploration.playerPosition ?? newConfig.spawnPoint;
      livePlayerPositionRef.current.set(spawn[0], spawn[1], spawn[2]);
      livePlayerRotationRef.current = newConfig.initialRotation ?? 0;
      isGroundedRef.current = true;
      coyoteTimerRef.current = 0;

      restoreKccMovementMode(directMovementTelemetry, { sceneId });
      controllerFailCountRef.current = 0;
      groundProbeCacheRef.current = createGroundProbeCache(newConfig.floorY, sceneId);
      syncMovementSceneContext(movementDepsRef.current, sceneId, movementEpochRef.current);
    }
  }, [sceneId, livePlayerRotationRef, livePlayerPositionRef, moveBlendRef, directMovementTelemetry]);

  useEffect(() => {
    const unsub = eventBus.on('scene:enter', ({ sceneId: enteredScene }) => {
      movementEpochRef.current += 1;
      const spawn = getGameStore().exploration.playerPosition;
      prevSceneIdRef.current = enteredScene;
      jumpCooldownRef.current = 0;
      currentAnimRef.current = 'idle';
      if (moveBlendRef) moveBlendRef.current = 0;
      noMovementFramesRef.current = 0;
      velocityRef.current.set(0, 0, 0);
      isGroundedRef.current = true;
      coyoteTimerRef.current = 0;

      const sceneConfig = getSceneConfig(enteredScene);
      livePlayerRotationRef.current = sceneConfig.initialRotation ?? 0;

      if (rigidBodyRef.current?.isValid()) {
        rigidBodyRef.current.setTranslation({ x: spawn[0], y: spawn[1], z: spawn[2] }, true);
      }
      livePlayerPositionRef.current.set(spawn[0], spawn[1], spawn[2]);

      restoreKccMovementMode(directMovementTelemetry, { sceneId: enteredScene });
      controllerFailCountRef.current = 0;
      kccHealthyFramesRef.current = 0;
      groundProbeCacheRef.current = createGroundProbeCache(sceneConfig.floorY, enteredScene);
      syncMovementSceneContext(
        movementDepsRef.current,
        enteredScene,
        movementEpochRef.current,
      );
    });
    return unsub;
  }, [livePlayerPositionRef, livePlayerRotationRef, moveBlendRef, directMovementTelemetry]);

  useEffect(() => {
    movementDepsRef.current = {
      ...movementDepsRef.current,
      sceneId,
      config,
      locomotionScale,
      movementTuning,
      world,
      rapier,
      groundProbeCacheRef,
      controls,
      virtualControlsRef,
      moveBlendRef,
      livePlayerPositionRef,
      livePlayerRotationRef,
      directMovementTelemetry,
      movementEpoch: movementEpochRef.current,
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

  return { rigidBodyRef, capsuleColliderRef, currentAnimRef };
}
