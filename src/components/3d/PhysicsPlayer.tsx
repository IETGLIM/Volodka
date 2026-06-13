
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
import { setPhysicsStepMs } from '@/engine/frame/FrameBudgetRegistry';
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
  getTouchLocomotionFactor,
} from '@/config/scenes';

import { eventBus } from '@/engine/EventBus';
import { forceEmitInteractionEnd } from '@/engine/interaction/interactionEndDedup';
import { audioEngine } from '@/engine/AudioEngine';

import { sampleHeldVirtualControls, type VirtualHoldTimes } from '@/engine/VirtualInputHold';
import { getInteractionState, isInteractionLocked } from '@/engine/interaction/interactionSession';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { setPlayerRigidBody, getPlayerExternalVelocity, clearPlayerRigidBody } from '@/engine/PlayerRigidBodyState';
import { devLog, devWarn } from '@/shared/utils/devLog';
import { isNarrativeMovementLocked } from '@/shared/exploreHubNodes';
import { FIRST_PERSON_ENABLED } from '@/engine/camera/cameraConstants';
import {
  isIntroWakeupCutscene,
  shouldShowThirdPersonAvatar,
} from '@/engine/camera/cinematicPresentation';
import { CinematicPlayerAvatar } from './CinematicPlayerAvatar';
import type { RapierCharacterController } from '@/engine/physics/rapierTypes';
import { probeGroundY } from '@/engine/physics/groundProbe';
import type { SceneId } from '@/shared/types/game';
import {
  WALK_SPEED,
  RUN_SPEED,
  KEYBOARD_ACCEL,
  JUMP_FORCE,
  GRAVITY,
  FOOTSTEP_INTERVAL,
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
  ROTATION_SPEED,
  SKIN_WIDTH,
  MAX_SLOPE_CLIMB,
  MIN_SLOPE_SLIDE,
  AUTOSTEP_HEIGHT,
  AUTOSTEP_WIDTH,
  SNAP_DISTANCE,
  BLOCKED_RATIO,
  COYOTE_TIME,
  JUMP_COOLDOWN,
  TERMINAL_VELOCITY,
  WARMUP_DURATION_S,
} from '@/engine/player/playerConstants';
import { lerpAngle, enforceFloor } from '@/engine/player/playerMath';
import {
  activateDirectMovementMode,
  restoreKccMovementMode,
  type DirectMovementTelemetryRefs,
} from '@/engine/player/directMovementTelemetry';
import { disposeCharacterController } from '@/engine/player/characterControllerLifecycle';

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
  // Wake-up uses a dedicated avatar in WakeUpSequence — hide the physics-body duplicate.
  const hideForWakeup = isIntroWakeupCutscene(activeCutsceneId);
  const showThirdPersonBody =
    shouldShowThirdPersonAvatar(gameMode, activeCutsceneId) && !hideForWakeup;

  const rigidBodyRef = useRef<RapierRigidBody>(null!);
  const capsuleColliderRef = useRef<RapierCollider | null>(null); // Direct Rapier Collider ref from CapsuleCollider JSX
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
  const lastDebugLogRef = useRef(0);
  const warmupTimerRef = useRef(0);
  const prevRbPosRef = useRef(new THREE.Vector3());
  const noMovementFramesRef = useRef(0);
  const kccRecoveryFramesRef = useRef(0);
  const virtualHoldTimesRef = useRef<VirtualHoldTimes>({});
  const rbBoundRef = useRef(false);
  const snapAirborneRef = useRef(false);

  const { world, rapier } = useRapier();

  // Track whether character controller works — if it fails consistently,
  // switch to direct movement mode (no collision resolution, but the player MOVES).
  const controllerFailCountRef = useRef(0);
  const useDirectMovementRef = useRef(false);
  const directMovementLoggedRef = useRef(false);
  const directMovementReasonRef = useRef<string | null>(null);
  const directMovementTelemetry: DirectMovementTelemetryRefs = {
    useDirectRef: useDirectMovementRef,
    loggedRef: directMovementLoggedRef,
    reasonRef: directMovementReasonRef,
  };

  // ─── Create & configure KinematicCharacterController ───
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

  // Share rigid body ref with the interaction system once Rapier marks it valid.
  useLayoutEffect(() => {
    return () => {
      clearPlayerRigidBody();
      rbBoundRef.current = false;
    };
  }, []);

  const locomotionScale = getExplorationLocomotionScale(sceneId);
  const movementTuning = getExplorationMovementTuning(sceneId);
  const config = getSceneConfig(sceneId);

  // Teleport player on scene change — use store spawn (set by SceneTransitionHandler)
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

  // Immediate teleport on scene:enter — runs before React re-renders sceneId,
  // closing the one-frame gap where store position and RigidBody diverge.
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

      const config = getSceneConfig(enteredScene);
      livePlayerRotationRef.current = config.initialRotation ?? 0;

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

  // Pre-allocated temp vectors (avoid GC in useFrame)
  const tempCameraForward = useRef(new THREE.Vector3());
  const tempCameraRight = useRef(new THREE.Vector3());
  const tempUp = useRef(new THREE.Vector3(0, 1, 0));
  const tempMoveDir = useRef(new THREE.Vector3());

  /** Per-frame scratch shared across sequential player tick stages. */
  const frameScratchRef = useRef({
    tickState: null as RootState | null,
    dt: 0,
    rb: null as RapierRigidBody | null,
    controller: null as RapierCharacterController | null,
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

  /** Warmup, locks, mobile detect — returns false to skip remaining stages. */
  function prepareFrame(delta: number): boolean {
    const scratch = frameScratchRef.current;
    const rb = rigidBodyRef.current;
    const controller = controllerRef.current;
    if (!rb || !controller) return false;

    scratch.rb = rb;
    scratch.controller = controller;
    scratch.floorY = config.floorY;
    scratch.vel = velocityRef.current;

    // Guard against disposed RigidBody during scene transitions
    if (!rb.isValid()) {
      rbBoundRef.current = false;
      return false;
    }

    if (!rbBoundRef.current) {
      setPlayerRigidBody(rb);
      rbBoundRef.current = true;
    }

    const vel = scratch.vel;
    const fallbackFloorY = scratch.floorY;

    // Clamp delta to avoid physics explosions on tab-switch
    const dt = Math.min(delta, 0.05);
    scratch.dt = dt;

    // ─── Physics warmup: skip gravity for WARMUP_DURATION_S ───
    // The KinematicCharacterController needs a short settle window to initialize.
    // During warmup, we hold the player at spawn height and skip gravity.
    // Hold warmup only during intro/cutscene modes where Rapier may still be settling.
    // Narrative overlay (showStoryOverlay) and tutorials use the isLocked branch below —
    // resetting warmup for those caused infinite warmup (player frozen, camera stuck).
    const storeSnapshot = getGameStore();
    const phase = readGamePhase(storeSnapshot);
    const inCinematic = phase === 'cutscene' || phase === 'intro';

    // Pause warmup during cinematics — resetting every frame caused a post-cutscene
    // locomotion freeze (sprint/WASD felt stuck).
    if (!inCinematic && warmupTimerRef.current < WARMUP_DURATION_S) {
      warmupTimerRef.current += dt;
    }

    if (warmupTimerRef.current < WARMUP_DURATION_S) {
      vel.set(0, 0, 0);
      const storePos = getGameStore().exploration.playerPosition;
      const holdX = storePos[0];
      const holdY = storePos[1];
      const holdZ = storePos[2];
      rb.setTranslation({ x: holdX, y: holdY, z: holdZ }, true);
      livePlayerPositionRef.current.set(holdX, holdY, holdZ);
      isGroundedRef.current = true;
      currentAnimRef.current = 'idle';
      return false;
    }
    const currentPos = rb.translation();
    const rescueGroundY = probeGroundY(
      world,
      rapier,
      currentPos.x,
      currentPos.y,
      currentPos.z,
      fallbackFloorY,
      capsuleColliderRef.current,
      rb,
    );
    scratch.groundY = rescueGroundY;

    // If the RigidBody drops well below detected ground, snap back to that level.
    if (currentPos.y < rescueGroundY - 0.1) {
      rb.setTranslation({ x: currentPos.x, y: rescueGroundY, z: currentPos.z }, true);
      vel.set(0, 0, 0);
      isGroundedRef.current = true;
      coyoteTimerRef.current = 0;
      livePlayerPositionRef.current.set(currentPos.x, rescueGroundY, currentPos.z);
      return false;
    }

    // ─── Tick cooldowns ───
    if (jumpCooldownRef.current > 0) jumpCooldownRef.current -= dt;
    if (coyoteTimerRef.current > 0) coyoteTimerRef.current -= dt;

    // ─── Check interaction lock ───
    // CRITICAL: Read mode DIRECTLY from store (not from React state) to avoid
    // stale closures — React state may lag behind the actual store state by
    // one render cycle, causing the player to remain frozen even after mode
    // has already changed to 'exploration'.
    const lockState = getGameStore();
    const currentMode = readGamePhase(lockState);
    const showStoryOverlay = lockState.showStoryOverlay;
    const currentNodeId = lockState.currentNodeId;
    // ── World Director: lock movement during narrative overlay or cutscene ──
    // Later-act explore hubs keep overlay open but allow walking; Act I uses closed overlay.
    const isLocked =
      isNarrativeMovementLocked(showStoryOverlay, currentNodeId) ||
      currentMode === 'cutscene' ||
      currentMode === 'intro' ||
      currentMode === 'combat' ||
      isInteractionLocked();

    scratch.isLocked = isLocked;
    scratch.currentMode = currentMode;

    // Stuck lock safety — only when interaction state is wedged without narrative UI.
    // Do NOT fire during Approach/Cutscene (normal flow exceeds 2s) or while overlay is open.
    const interactionState = getInteractionState();
    const inExpectedLongInteractionPhase =
      interactionState === InteractionState.Approach ||
      interactionState === InteractionState.Cutscene;
    const shouldWatchStuckLock =
      isInteractionLocked() &&
      currentMode === 'exploration' &&
      !showStoryOverlay &&
      !inExpectedLongInteractionPhase;

    if (shouldWatchStuckLock) {
      stuckLockTimerRef.current += dt;
      if (stuckLockTimerRef.current > 2.0) {
        devWarn('[PhysicsPlayer] Interaction lock stuck for 2s — force-unlocking');
        forceEmitInteractionEnd();
        eventBus.emit('player:stand_up', {});
        stuckLockTimerRef.current = 0;
      }
    } else if (!isLocked) {
      stuckLockTimerRef.current = 0;
    }

    return true;
  }

  /** Locked branch — combat anim, external velocity, KCC/direct when interaction holds movement. */
  function lockedMovement(): void {
    const scratch = frameScratchRef.current;
    const rb = scratch.rb!;
    const controller = scratch.controller!;
    if (!rb.isValid()) return;
    const vel = scratch.vel;
    const groundY = scratch.groundY;
    const dt = scratch.dt;
    const currentMode = scratch.currentMode;

    const external = getPlayerExternalVelocity();

    // ──── LOCKED STATE: interaction system controls movement ────
    // External velocity (approach/align) goes through the character
    // controller for collision resolution — no wall clipping!
    if (external.active) {
      vel.x = external.vx;
      vel.z = external.vz;

      // Rotation follows movement direction during approach
      const hSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
      if (hSpeed > 0.1) {
        const targetYaw = Math.atan2(vel.x, vel.z);
        const rotT = 1 - Math.exp(-ROTATION_SPEED * dt);
        livePlayerRotationRef.current = lerpAngle(
          livePlayerRotationRef.current, targetYaw, rotT,
        );
      }
    } else {
      vel.x = 0;
      vel.z = 0;
    }

    // Always apply gravity even when locked (so player doesn't float)
    vel.y += GRAVITY * dt;
    if (vel.y < TERMINAL_VELOCITY) vel.y = TERMINAL_VELOCITY;

    // ─── CRITICAL FIX: Pre-movement ground enforcement in locked state ───
    // Same as the main movement path: if player is at floor level and falling,
    // zero out vertical velocity BEFORE computing displacement.
    // Without this, the player can tunnel through the floor during cutscenes
    // because the desiredDisplacement has a large downward component.
    if (enforceFloor(rb, vel, groundY)) {
      isGroundedRef.current = true;
    }

    // Compute collision-safe displacement via character controller
    const desiredDisp = { x: vel.x * dt, y: vel.y * dt, z: vel.z * dt };
    const posBeforeMovement = rb.translation(); // fresh position after ground enforcement
    const lockedCollider = capsuleColliderRef.current;
    if (lockedCollider && controller) {
      controller.computeColliderMovement(lockedCollider, desiredDisp);
      const actual = controller.computedMovement();
      const grounded = controller.computedGrounded();

      rb.setTranslation({
        x: posBeforeMovement.x + actual.x,
        y: posBeforeMovement.y + actual.y,
        z: posBeforeMovement.z + actual.z,
      }, true);

      if (grounded) {
        vel.y = 0;
        isGroundedRef.current = true;
      } else {
        // Correct vertical velocity based on actual movement
        if (dt > 0.001) {
          const actualVy = actual.y / dt;
          if (vel.y < 0 && actualVy > vel.y + 2.0) vel.y = actualVy;
          if (vel.y > 0 && actualVy < vel.y - 2.0) vel.y = 0;
        }
        isGroundedRef.current = false;
      }
    } else {
      // Fallback: apply displacement directly when collider not available
      rb.setTranslation({
        x: posBeforeMovement.x + desiredDisp.x,
        y: posBeforeMovement.y + desiredDisp.y,
        z: posBeforeMovement.z + desiredDisp.z,
      }, true);
    }

    if (currentMode === 'combat') {
      currentAnimRef.current = 'combat';
    } else {
      currentAnimRef.current = 'idle';
    }
    if (enforceFloor(rb, vel, groundY)) {
      isGroundedRef.current = true;
    }
    const pos = rb.translation();
    livePlayerPositionRef.current.set(pos.x, pos.y, pos.z);
  }

  /** Main KCC/direct movement path — returns false when fallback handled the frame. */
  function mainMovement(): boolean {
    const scratch = frameScratchRef.current;
    const rb = scratch.rb!;
    const controller = scratch.controller!;
    if (!rb.isValid()) return false;
    const vel = scratch.vel;
    const dt = scratch.dt;
    const tickState = scratch.tickState!;

    // ══════════════════════════════════════════════════════════════════════════
    //  MAIN MOVEMENT — KinematicCharacterController with full physics
    // ══════════════════════════════════════════════════════════════════════════

    scratch.wasGrounded = isGroundedRef.current;

    // ─── Camera-relative movement direction ───
    const camFwd = tempCameraForward.current;
    const camRight = tempCameraRight.current;
    const up = tempUp.current;
    const moveDir = tempMoveDir.current;

    tickState.camera.getWorldDirection(camFwd);
    camFwd.y = 0;
    if (camFwd.length() > 0.001) camFwd.normalize();
    else camFwd.set(0, 0, -1);
    camRight.crossVectors(camFwd, up).normalize();

    // ─── Input reading ───
    const keys = controls.getKeys();
    const virtual = sampleHeldVirtualControls(
      virtualControlsRef?.current,
      tickState.clock.elapsedTime,
      virtualHoldTimesRef.current,
    );
    const keyboardDrivesMove = keys.hasMovement;
    const mergeVirtual = !keyboardDrivesMove;

    const fwd = (keys.forward ? 1 : 0) + (mergeVirtual ? (virtual?.forward ?? 0) : 0);
    const bwd = (keys.backward ? 1 : 0) + (mergeVirtual ? (virtual?.backward ?? 0) : 0);
    const lft = (keys.left ? 1 : 0) + (mergeVirtual ? (virtual?.left ?? 0) : 0);
    const rgt = (keys.right ? 1 : 0) + (mergeVirtual ? (virtual?.right ?? 0) : 0);
    const running = keys.run || (virtual?.run ?? 0) > 0;
    const jumping = keys.jump || (virtual?.jump ?? 0) > 0;

    // ─── Mobile debug: disabled in production to reduce console noise ───
    // Previously logged every 2s — caused rAF violations and console spam.
    // Re-enable with debug flag if needed for mobile input debugging.
    // if (virtual && (fwd || bwd || lft || rgt)) { ... }

    moveDir.set(0, 0, 0);
    moveDir.addScaledVector(camFwd, fwd - bwd);
    moveDir.addScaledVector(camRight, rgt - lft);

    const moveLen = moveDir.length();
    const isMoving = moveLen > 0.01;
    if (moveBlendRef) {
      moveBlendRef.current = THREE.MathUtils.damp(
        moveBlendRef.current,
        isMoving ? 1 : 0,
        8,
        dt,
      );
    }
    const isOutdoor = !config.hasCeiling;
    const touchScale = keyboardDrivesMove ? 1 : getTouchLocomotionFactor();
    const speed = (running ? RUN_SPEED : WALK_SPEED) * locomotionScale * touchScale;
    const moveAccel = keyboardDrivesMove ? KEYBOARD_ACCEL : movementTuning.accel;
    const stopDamping = keyboardDrivesMove ? movementTuning.damping * 0.55 : movementTuning.damping;

    scratch.isMoving = isMoving;
    scratch.running = running;
    scratch.keyboardDrivesMove = keyboardDrivesMove;
    scratch.isOutdoor = isOutdoor;

    // ─── Horizontal velocity with acceleration / damping ───
    if (isMoving) {
      moveDir.normalize();
      const targetVx = moveDir.x * speed;
      const targetVz = moveDir.z * speed;
      if (keyboardDrivesMove) {
        const kbAccel = moveAccel * 1.35;
        vel.x = THREE.MathUtils.damp(vel.x, targetVx, kbAccel, dt);
        vel.z = THREE.MathUtils.damp(vel.z, targetVz, kbAccel, dt);
      } else {
        vel.x = THREE.MathUtils.damp(vel.x, targetVx, moveAccel, dt);
        vel.z = THREE.MathUtils.damp(vel.z, targetVz, moveAccel, dt);
      }

      // Rotation — frame-rate-independent exponential decay
      const targetYaw = Math.atan2(moveDir.x, moveDir.z);
      const rotT = 1 - Math.exp(-ROTATION_SPEED * dt);
      livePlayerRotationRef.current = lerpAngle(
        livePlayerRotationRef.current, targetYaw, rotT,
      );
    } else {
      vel.x = THREE.MathUtils.damp(vel.x, 0, stopDamping, dt);
      vel.z = THREE.MathUtils.damp(vel.z, 0, stopDamping, dt);
    }

    // ─── Vertical velocity — gravity + jump ───
    // Do NOT accumulate gravity while grounded: vel.y += GRAVITY each frame then
    // snap-to-ground / floor enforcement causes visible Y oscillation when walking.
    const wantsJump =
      jumping &&
      jumpCooldownRef.current <= 0 &&
      (isGroundedRef.current || coyoteTimerRef.current > 0);

    const posForGroundCheck = rb.translation();
    const groundY = scratch.groundY;
    scratch.groundY = groundY;
    const floorSlack = isOutdoor ? 0.08 : 0.05;
    const nearFloor = posForGroundCheck.y <= groundY + floorSlack;

    const airborneIntent = wantsJump || vel.y > 0.2;
    scratch.airborneIntent = airborneIntent;
    scratch.floorSlack = floorSlack;

    if (wantsJump) {
      vel.y = JUMP_FORCE;
      isGroundedRef.current = false;
      jumpCooldownRef.current = JUMP_COOLDOWN;
      coyoteTimerRef.current = 0;
    } else if (
      !airborneIntent &&
      (isGroundedRef.current || (nearFloor && vel.y <= 0 && !jumping))
    ) {
      // Only snap to floor when falling or idle — not while moving upward after a jump.
      // Previously `nearFloor && !jumping` cancelled tap-jumps on the very next frame.
      vel.y = 0;
      if (nearFloor) {
        isGroundedRef.current = true;
        coyoteTimerRef.current = 0;
      }
    } else {
      vel.y += GRAVITY * dt;
      if (vel.y < TERMINAL_VELOCITY) vel.y = TERMINAL_VELOCITY;
    }

    // ─── Compute desired displacement (input → desired movement) ───
    const onFlatGround = (isGroundedRef.current || nearFloor) && !airborneIntent;
    scratch.onFlatGround = onFlatGround;
    const desiredDisplacement = {
      x: vel.x * dt,
      y: onFlatGround ? 0 : vel.y * dt,
      z: vel.z * dt,
    };

    // ─── Re-read position after ground enforcement (fix stale currentPos) ───
    // Ground enforcement may have changed the RigidBody position above.
    // Use the CURRENT position as the base for displacement.
    const posAfterGroundEnforcement = rb.translation();

    // ─── Compute collision-safe movement via character controller ───
    // This is the CORE: the controller checks the physics world state,
    // resolves collisions with slopes/steps/walls, and returns the
    // actual safe displacement. No more fighting Rapier's solver!
    const collider = capsuleColliderRef.current;

    if (collider && controller && useDirectMovementRef.current) {
      restoreKccMovementMode(directMovementTelemetry, { sceneId });
    }

    // Pre-compute boundary clamping values (shared between fallback and failsafe)
    const [sceneW, sceneD] = config.size;
    const BOUNDARY_MARGIN = 0.3;
    const halfW = sceneW / 2 - BOUNDARY_MARGIN;
    const halfD = sceneD / 2 - BOUNDARY_MARGIN;

    if (!collider || !controller || useDirectMovementRef.current) {
      // ─── FALLBACK: Direct movement without character controller ───
      // When the collider isn't found or the character controller has failed,
      // apply velocity directly with simple boundary clamping.
      // This ensures the player can ALWAYS move, even if Rapier's
      // character controller has issues.
      if (!collider && !useDirectMovementRef.current) {
        controllerFailCountRef.current++;
        if (controllerFailCountRef.current === 60) {
          // Retry for 60 frames (~1s) before giving up.
          // Rapier sometimes needs more time to initialize colliders
          // in production builds where WASM loads asynchronously.
          activateDirectMovementMode(directMovementTelemetry, 'collider_missing_60f', {
            sceneId,
            failFrames: controllerFailCountRef.current,
          });
        }
      } else if (collider && controllerFailCountRef.current > 0) {
        // Collider appeared! Reset failure count and restore physics.
        controllerFailCountRef.current = 0;
        if (useDirectMovementRef.current) {
          restoreKccMovementMode(directMovementTelemetry, { sceneId });
        }
      }

      // NOTE: Do NOT apply gravity again — it was already applied above at line ~483.
      // The old code had a double-gravity bug here.

      // Apply horizontal displacement directly
      const newX = posAfterGroundEnforcement.x + vel.x * dt;
      const newZ = posAfterGroundEnforcement.z + vel.z * dt;
      let newY = posAfterGroundEnforcement.y + vel.y * dt;

      // Simple boundary clamping
      const clampedX = Math.max(-halfW, Math.min(halfW, newX));
      const clampedZ = Math.max(-halfD, Math.min(halfD, newZ));

      rb.setTranslation({ x: clampedX, y: newY, z: clampedZ }, true);
      if (enforceFloor(rb, vel, groundY)) {
        isGroundedRef.current = true;
        coyoteTimerRef.current = 0;
      }
      const pos = rb.translation();
      livePlayerPositionRef.current.set(pos.x, pos.y, pos.z);
      return false;
    }

    // Reset fail counter — collider was found
    controllerFailCountRef.current = 0;

    // Disable snap-to-ground while jumping — otherwise KCC cancels upward velocity.
    if (airborneIntent !== snapAirborneRef.current) {
      snapAirborneRef.current = airborneIntent;
      controller.enableSnapToGround(airborneIntent ? 0 : SNAP_DISTANCE);
    }

    let physicsT0: number | undefined;
    if (import.meta.env.DEV) physicsT0 = performance.now();
    controller.computeColliderMovement(collider, desiredDisplacement);
    if (import.meta.env.DEV) setPhysicsStepMs(performance.now() - physicsT0!);

    const actualDisplacement = controller.computedMovement();
    const isGroundedNow = controller.computedGrounded();
    scratch.isGroundedNow = isGroundedNow;

    // Always apply collision-resolved displacement — never bypass the controller
    // when it blocks horizontal movement (walls, obstacles, slopes).
    rb.setTranslation({
      x: posAfterGroundEnforcement.x + actualDisplacement.x,
      y: posAfterGroundEnforcement.y + actualDisplacement.y,
      z: posAfterGroundEnforcement.z + actualDisplacement.z,
    }, true);

    // ─── Post-movement velocity correction ───
    // The controller may have changed the displacement (slope slide,
    // wall collision, ceiling hit). We correct velocity to match
    // the actual movement so the next frame's input is coherent.
    const wasGrounded = scratch.wasGrounded;
    if (isGroundedNow && !airborneIntent) {
      vel.y = 0;
      if (!wasGrounded) {
        // Just landed — reset jump state
        jumpCooldownRef.current = 0;
      }
      isGroundedRef.current = true;
      coyoteTimerRef.current = 0;
    } else if (!isGroundedNow) {
      if (wasGrounded && !isGroundedNow && vel.y <= 0) {
        // Walked off an edge (not jumping) — start coyote time
        coyoteTimerRef.current = COYOTE_TIME;
      }
      isGroundedRef.current = false;

      // Correct vertical velocity based on actual movement
      // Controller may reduce displacement on slopes/contacts
      if (dt > 0.001) {
        const actualVy = actualDisplacement.y / dt;
        const desiredVy = vel.y;
        // Slope sliding: controller prevented downward movement
        if (desiredVy < 0 && actualVy > desiredVy + 2.0) {
          vel.y = actualVy;
        }
        // Ceiling hit: controller stopped upward movement
        if (desiredVy > 0 && actualVy < desiredVy - 2.0) {
          vel.y = 0;
        }
      }
    }

    const desiredHLen = Math.sqrt(desiredDisplacement.x ** 2 + desiredDisplacement.z ** 2);
    const actualHLen = Math.sqrt(actualDisplacement.x ** 2 + actualDisplacement.z ** 2);
    const blockedByCollider = desiredHLen > 0.001 && actualHLen < desiredHLen * BLOCKED_RATIO;
    const collisionCount =
      typeof controller.numComputedCollisions === 'function'
        ? controller.numComputedCollisions()
        : 0;
    const blockedByWall = blockedByCollider && collisionCount > 0;
    scratch.blockedByWall = blockedByWall;

    // Don't let velocity build against walls — reduces keyboard stutter in tight rooms.
    if (blockedByCollider && desiredHLen > 0.001 && actualHLen < desiredHLen * BLOCKED_RATIO) {
      const slideRatio = Math.max(actualHLen / desiredHLen, 0.15);
      vel.x *= slideRatio;
      vel.z *= slideRatio;
    }

    return true;
  }

  /** Animations, footsteps, position sync, ground enforce, DEV timing. */
  function finalizeFrame(): void {
    const scratch = frameScratchRef.current;
    const rb = scratch.rb!;
    if (!rb.isValid()) return;
    const vel = scratch.vel;
    const dt = scratch.dt;
    const {
      airborneIntent,
      floorSlack,
      isGroundedNow,
      onFlatGround,
      isOutdoor,
      isMoving,
      running,
      keyboardDrivesMove,
      blockedByWall,
      groundY,
    } = scratch;

    // ─── Floor material from scene config (single source of truth) ───
    currentFloorMaterialRef.current = config.floorMaterial;

    // ─── Animation state ───
    const horizontalSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    const animPos = rb.translation();
    // If feet are at floor level with low vertical velocity, treat as grounded
    // even when the character controller briefly loses ground contact while walking.
    if (
      !airborneIntent &&
      animPos.y <= groundY + floorSlack &&
      Math.abs(vel.y) < 0.75
    ) {
      isGroundedRef.current = true;
      if (Math.abs(vel.y) < 0.25) vel.y = 0;
    }
    if (!isGroundedRef.current) {
      const clearlyAirborne = animPos.y > groundY + 0.08 || vel.y > 0.35;
      if (clearlyAirborne) {
        currentAnimRef.current = vel.y > 0.5 ? 'jump' : 'fall';
      } else {
        isGroundedRef.current = true;
        vel.y = 0;
      }
    } else if (horizontalSpeed > 0.5) {
      currentAnimRef.current = running ? 'run' : 'walk';
    } else {
      currentAnimRef.current = 'idle';
    }

    // ─── Footsteps ───
    if (isMoving && isGroundedRef.current) {
      footstepTimerRef.current += dt;
      const stepInterval = running ? FOOTSTEP_INTERVAL * 0.65 : FOOTSTEP_INTERVAL;
      if (footstepTimerRef.current >= stepInterval) {
        footstepTimerRef.current = 0;
        const pos = rb.translation();
        eventBus.emit('exploration:footstep', {
          position: [pos.x, pos.y, pos.z],
          yaw: livePlayerRotationRef.current,
        });
        audioEngine.playFootstep(currentFloorMaterialRef.current, {
          sourceId: 'player-footstep',
        });
      }
    } else {
      footstepTimerRef.current = 0;
    }

    // ─── Update position ref for camera + other systems ───
    let finalPos = rb.translation();
    const finalGroundY = groundY;

    // Lock Y on flat ground — skip when KCC already grounded to avoid fighting snap-to-ground.
    const floorSnapEps = isOutdoor ? 0.02 : 0.008;
    if (
      onFlatGround &&
      !isGroundedNow &&
      Math.abs(finalPos.y - finalGroundY) > floorSnapEps
    ) {
      rb.setTranslation({ x: finalPos.x, y: finalGroundY, z: finalPos.z }, true);
      vel.y = 0;
      isGroundedRef.current = true;
      finalPos = rb.translation();
    }

    livePlayerPositionRef.current.set(finalPos.x, finalPos.y, finalPos.z);

    // ─── EMERGENCY MOBILE FALLBACK ───
    // If the player has input but position hasn't changed, the controller may
    // be broken (common on some mobile WASM builds). Do NOT treat legitimate
    // wall blocking as a failure — that would re-enable collision bypass.
    // Emergency direct-movement fallback — touch/gamepad only (keyboard uses KCC wall slide).
    if (isMoving && !blockedByWall && !keyboardDrivesMove) {
      const dx = finalPos.x - prevRbPosRef.current.x;
      const dz = finalPos.z - prevRbPosRef.current.z;
      const posDelta = Math.sqrt(dx * dx + dz * dz);
      if (posDelta < 0.001) {
        noMovementFramesRef.current++;
        if (noMovementFramesRef.current >= 15 && !useDirectMovementRef.current) {
          activateDirectMovementMode(directMovementTelemetry, 'input_no_displacement_15f', {
            sceneId,
            stuckFrames: noMovementFramesRef.current,
          });
        }
      } else {
        noMovementFramesRef.current = 0;
        if (useDirectMovementRef.current) {
          kccRecoveryFramesRef.current++;
          if (kccRecoveryFramesRef.current >= 6) {
            restoreKccMovementMode(directMovementTelemetry, { sceneId });
            kccRecoveryFramesRef.current = 0;
          }
        }
      }
    } else {
      noMovementFramesRef.current = 0;
      if (!useDirectMovementRef.current) {
        kccRecoveryFramesRef.current = 0;
      }
    }
    prevRbPosRef.current.set(finalPos.x, finalPos.y, finalPos.z);
  }

  // ─── Main physics loop ───
  useFrameTick('player', ({ state, delta }) => {
    frameScratchRef.current.tickState = state;
    if (!prepareFrame(delta)) return;
    if (frameScratchRef.current.isLocked) {
      lockedMovement();
      return;
    }
    if (!mainMovement()) return;
    finalizeFrame();
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

  // Dispose texture on unmount to prevent memory leak
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
