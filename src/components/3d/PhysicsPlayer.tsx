
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

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, useRapier, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';

import { useGameStore } from '@/store/gameStore';
import { usePlayerControls, type VirtualControls } from '@/hooks/useGamePhysics';

import {
  getSceneConfig,
  getExplorationCharacterModelScale,
  getExplorationLocomotionScale,
} from '@/config/scenes';

import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';

import { isInteractionLocked } from './InteractionSystemBridge';
import { setPlayerRigidBody, getPlayerExternalVelocity, clearPlayerRigidBody } from '@/engine/PlayerRigidBodyState';
import { ProceduralPlayerModel } from './ProceduralPlayerModel';

/** Lerp angle with wraparound — smooth rotation without 360 jumps */
function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * Math.min(t, 1);
}

/* ─── Physics Constants ─── */
const WALK_SPEED = 4;
const RUN_SPEED = 7;
const ACCEL = 20;
const DAMPING = 10;
const JUMP_FORCE = 5.5;
const GRAVITY = -15;
const FOOTSTEP_INTERVAL = 0.4;
const PLAYER_HEIGHT = 1.75;
const PLAYER_RADIUS = 0.3;
const ROTATION_SPEED = 10;

/* ─── Character Controller Constants ─── */
const SKIN_WIDTH = 0.08;             // 8cm collision skin — increased from 2cm to prevent
                                     // tunneling through thin trimesh furniture colliders
const MAX_SLOPE_CLIMB = Math.PI / 4; // 45° — walkable slopes
const MIN_SLOPE_SLIDE = Math.PI / 6;  // 30° — auto-slide steeper
const AUTOSTEP_HEIGHT = 0.3;         // 30cm max step height
const AUTOSTEP_WIDTH = 0.2;          // 20cm min step width
const SNAP_DISTANCE = 0.5;           // 50cm snap-to-ground distance
const COYOTE_TIME = 0.15;            // 150ms jump grace after leaving edge
const JUMP_COOLDOWN = 0.3;           // 300ms between jumps
const TERMINAL_VELOCITY = GRAVITY * 2; // max fall speed

/* ─── Character Controller Constants ─── */

interface PhysicsPlayerProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
  virtualControlsRef?: React.MutableRefObject<VirtualControls>;
  onInteractPress?: () => void;
}

/** Get the first collider attached to a RigidBody from the physics world.
 *  We need the Collider object (not handle) for computeColliderMovement().
 *
 *  FIX: @react-three/rapier's RapierRigidBody is a Proxy wrapper around the
 *  raw RAPIER.RigidBody. The raw body is accessible via `rb.raw()` in
 *  @react-three/rapier v1.x+, or via internal properties in older versions.
 *  Once we have the raw body, colliderHandles() gives us the collider handles.
 *
 *  Fallback: iterate the world's collider list and match by parent handle.
 */
function getPlayerCollider(rb: RapierRigidBody, world: any, rapierModule: any): any {
  try {
    // Approach 1: Try rb.raw() — @react-three/rapier v1.x+ exposes the raw RAPIER body
    let rawBody: any = null;
    if (typeof (rb as any).raw === 'function') {
      rawBody = (rb as any).raw();
    }
    // Fallback: try internal property names used by different wrapper versions
    if (!rawBody) {
      rawBody = (rb as any)._raw ?? (rb as any)._body ?? (rb as any).inner;
    }
    // Fallback: try using the handle to look up the raw body from the world
    if (!rawBody) {
      const handle = (rb as any).handle ?? (rb as any)._handle;
      if (handle !== undefined) {
        rawBody = world.getRigidBody(handle);
      }
    }

    // If we have a raw body, get collider handles from it
    if (rawBody && typeof rawBody.colliderHandles === 'function') {
      const handles = rawBody.colliderHandles();
      // handles is a FloatArray/Array-like of collider handle indices
      if (handles) {
        const len = typeof handles.length === 'number' ? handles.length : 0;
        for (let i = 0; i < len; i++) {
          const handle = handles[i];
          const collider = world.getCollider(handle);
          if (collider) return collider;
        }
      }
    }

    // Approach 2: Iterate all colliders in the world and find one whose
    // parent() matches our RigidBody handle.
    // This is O(n) but there are typically < 50 colliders per scene.
    const rbHandle = (rb as any).handle ?? (rb as any)._handle;
    if (rbHandle !== undefined) {
      try {
        // Try forEachCollider (RAPIER World method)
        if (typeof world.forEachCollider === 'function') {
          let found: any = null;
          world.forEachCollider((collider: any) => {
            if (!found) {
              try {
                const parent = collider.parent();
                if (parent === rbHandle) {
                  found = collider;
                }
              } catch {
                // Some collider types don't have parent() — skip
              }
            }
          });
          if (found) return found;
        }
      } catch {
        // forEachCollider not available — skip
      }

      // Approach 3: Manual iteration via colliders() iterator
      try {
        const colliders = world.colliders();
        if (colliders) {
          const len = typeof colliders.len === 'function' ? colliders.len() : (colliders.length ?? 0);
          for (let i = 0; i < len; i++) {
            const c = typeof colliders.at === 'function' ? colliders.at(i) : colliders[i];
            if (c) {
              try {
                if (c.parent() === rbHandle) return c;
              } catch {
                // skip
              }
            }
          }
        }
      } catch {
        // Iterator not available — skip
      }
    }

    return null;
  } catch {
    return null;
  }
}

/** Player character with FULL Rapier physics via KinematicCharacterController.
 *
 *  The controller handles:
 *  ─ collision resolution (slopes, walls, corners)
 *  ─ step climbing (autostep)
 *  ─ ground snapping (no hovering on edges)
 *  ─ slope sliding (too steep → slide down)
 *  ─ impulse transfer to dynamic bodies (push objects)
 *  ─ combat collision manifold (accurate contact data)
 *
 *  We handle manually:
 *  ─ horizontal velocity (acceleration/damping for game feel)
 *  ─ vertical velocity (gravity + jump)
 *  ─ rotation (camera-relative facing)
 *  ─ animation state
 *  ─ footstep audio
 *  ─ external velocity from InteractionSystemBridge
 */
export function PhysicsPlayer({
  livePlayerPositionRef,
  livePlayerRotationRef,
  virtualControlsRef,
  onInteractPress,
}: PhysicsPlayerProps) {
  const controls = usePlayerControls(onInteractPress);
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const karma = useGameStore((s) => s.playerState.karma);

  const rigidBodyRef = useRef<RapierRigidBody>(null!);
  const controllerRef = useRef<any>(null); // Rapier KinematicCharacterController
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
  const warmupFramesRef = useRef(0);
  const prevRbPosRef = useRef(new THREE.Vector3());
  const noMovementFramesRef = useRef(0);

  const { world, rapier } = useRapier();

  // Track whether character controller works — if it fails consistently,
  // switch to direct movement mode (no collision resolution, but the player MOVES).
  const controllerFailCountRef = useRef(0);
  const movementBlockedCountRef = useRef(0);
  const useDirectMovementRef = useRef(false);
  const successfulMovementTimerRef = useRef(0);

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
    controller.setCharacterMass(75); // 75 kg — pushes dynamic objects realistically
    controller.setNormalNudgeFactor(0.5);
    controllerRef.current = controller;

    return () => {
      try {
        world.removeCharacterController(controller);
      } catch { /* already removed during scene transition */ }
      controllerRef.current = null;
    };
  }, [world]);

  // Share rigid body ref with the interaction system
  useEffect(() => {
    if (rigidBodyRef.current) {
      setPlayerRigidBody(rigidBodyRef.current);
    }
    return () => {
      clearPlayerRigidBody();
    };
  }, []);

  const locomotionScale = getExplorationLocomotionScale(sceneId);
  const modelScale = getExplorationCharacterModelScale(sceneId);
  const config = getSceneConfig(sceneId);

  // Teleport player on scene change
  useEffect(() => {
    if (sceneId !== prevSceneIdRef.current) {
      prevSceneIdRef.current = sceneId;
      const newConfig = getSceneConfig(sceneId);
      const spawn = newConfig.spawnPoint;
      if (rigidBodyRef.current) {
        rigidBodyRef.current.setTranslation(
          { x: spawn[0], y: spawn[1], z: spawn[2] },
          true,
        );
        velocityRef.current.set(0, 0, 0);
      }
      livePlayerRotationRef.current = newConfig.initialRotation ?? 0;
      isGroundedRef.current = true;
      coyoteTimerRef.current = 0;

      // Reset direct movement mode — new scene gets a fresh character controller
      useDirectMovementRef.current = false;
      controllerFailCountRef.current = 0;
      movementBlockedCountRef.current = 0;
      successfulMovementTimerRef.current = 0;
    }
  }, [sceneId, livePlayerRotationRef]);

  // Pre-allocated temp vectors (avoid GC in useFrame)
  const tempCameraForward = useRef(new THREE.Vector3());
  const tempCameraRight = useRef(new THREE.Vector3());
  const tempUp = useRef(new THREE.Vector3(0, 1, 0));
  const tempMoveDir = useRef(new THREE.Vector3());

  // ─── Main physics loop ───
  useFrame((state, delta) => {
    const rb = rigidBodyRef.current;
    const controller = controllerRef.current;
    if (!rb || !controller) return;

    // Guard against disposed RigidBody during scene transitions
    if (!rb.isValid()) return;

    const vel = velocityRef.current;

    // Clamp delta to avoid physics explosions on tab-switch
    const dt = Math.min(delta, 0.05);

    // ─── Physics warmup: skip gravity for first N frames ───
    // The KinematicCharacterController needs a few frames to initialize.
    // During warmup, we hold the player at spawn height and skip gravity.
    warmupFramesRef.current++;
    if (warmupFramesRef.current < 10) {
      vel.set(0, 0, 0);
      const spawn = config.spawnPoint;
      if (rb) {
        rb.setTranslation({ x: spawn[0], y: spawn[1], z: spawn[2] }, true);
      }
      livePlayerPositionRef.current.set(spawn[0], spawn[1], spawn[2]);
      isGroundedRef.current = true;
      return;
    }

    // ─── Safety: if player fell below the scene floor, snap back ───
    // The CuboidCollider floor top is at y=0.01. If the player drops
    // below FLOOR_Y - 0.1 (i.e. y < -0.09), something went wrong —
    // teleport back to floor level. This catches tunneling through
    // both the trimesh and CuboidCollider.
    // The capsule bottom = rb.y (since CapsuleCollider offset = PLAYER_HEIGHT/2,
    // capsule bottom = rb.y).
    const currentPos = rb.translation();
    const FLOOR_Y = 0.01; // Matches CuboidCollider top + spawn point
    if (currentPos.y < FLOOR_Y - 0.1) {
      // Player fell below floor — snap back to spawn point
      const spawn = config.spawnPoint;
      rb.setTranslation({ x: currentPos.x, y: FLOOR_Y, z: currentPos.z }, true);
      vel.set(0, 0, 0);
      isGroundedRef.current = true;
      coyoteTimerRef.current = 0;
      livePlayerPositionRef.current.set(currentPos.x, FLOOR_Y, currentPos.z);
      return;
    }

    // ─── Tick cooldowns ───
    if (jumpCooldownRef.current > 0) jumpCooldownRef.current -= dt;
    if (coyoteTimerRef.current > 0) coyoteTimerRef.current -= dt;

    // ─── Check interaction lock ───
    // CRITICAL: Read mode DIRECTLY from store (not from React state) to avoid
    // stale closures — React state may lag behind the actual store state by
    // one render cycle, causing the player to remain frozen even after mode
    // has already changed to 'exploration'.
    const currentMode = useGameStore.getState().mode;
    const showStoryOverlay = useGameStore.getState().showStoryOverlay;
    // ── World Director: lock movement during narrative overlay or cutscene ──
    // Before: locked when mode === 'visual-novel' (separate mode)
    // Now: locked when showStoryOverlay is true (narrative overlay on exploration)
    const isLocked = showStoryOverlay || currentMode === 'cutscene' || currentMode === 'intro' || isInteractionLocked();

    // Stuck lock safety — if interaction lock is stuck in exploration mode
    if (isLocked && isInteractionLocked() && currentMode === 'exploration') {
      stuckLockTimerRef.current += dt;
      if (stuckLockTimerRef.current > 3.0) {
        console.warn('[PhysicsPlayer] Interaction lock stuck for 3s — emitting interaction:end');
        eventBus.emit('interaction:end', {});
        stuckLockTimerRef.current = 0;
      }
    } else {
      stuckLockTimerRef.current = 0;
    }

    // ─── Check for external velocity from InteractionSystemBridge ───
    const external = getPlayerExternalVelocity();

    if (isLocked) {
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
      {
        const pos = rb.translation();
        if (pos.y <= FLOOR_Y + 0.02 && vel.y < 0) {
          rb.setTranslation({ x: pos.x, y: FLOOR_Y, z: pos.z }, true);
          vel.y = 0;
          isGroundedRef.current = true;
        }
      }

      // Compute collision-safe displacement via character controller
      const desiredDisp = { x: vel.x * dt, y: vel.y * dt, z: vel.z * dt };
      const posBeforeMovement = rb.translation(); // fresh position after ground enforcement
      const lockedCollider = getPlayerCollider(rb, world, rapier);
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

      currentAnimRef.current = 'idle';
      const pos = rb.translation();

      // ─── Ground enforcement in locked state (cutscenes/dialogues) ───
      // Same as the main movement path: if player is at floor level and falling,
      // snap to floor. This prevents the character from sinking during cutscenes.
      if (pos.y <= FLOOR_Y + 0.02 && vel.y < 0) {
        rb.setTranslation({ x: pos.x, y: FLOOR_Y, z: pos.z }, true);
        vel.y = 0;
        isGroundedRef.current = true;
        livePlayerPositionRef.current.set(pos.x, FLOOR_Y, pos.z);
      } else {
        livePlayerPositionRef.current.set(pos.x, pos.y, pos.z);
      }
      return;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  MAIN MOVEMENT — KinematicCharacterController with full physics
    // ══════════════════════════════════════════════════════════════════════════

    const wasGrounded = isGroundedRef.current;

    // ─── Camera-relative movement direction ───
    const camFwd = tempCameraForward.current;
    const camRight = tempCameraRight.current;
    const up = tempUp.current;
    const moveDir = tempMoveDir.current;

    state.camera.getWorldDirection(camFwd);
    camFwd.y = 0;
    if (camFwd.length() > 0.001) camFwd.normalize();
    else camFwd.set(0, 0, -1);
    camRight.crossVectors(camFwd, up).normalize();

    // ─── Input reading ───
    const keys = controls.getKeys();
    const virtual = virtualControlsRef?.current;
    const fwd = (keys.forward ? 1 : 0) + (virtual?.forward ?? 0);
    const bwd = (keys.backward ? 1 : 0) + (virtual?.backward ?? 0);
    const lft = (keys.left ? 1 : 0) + (virtual?.left ?? 0);
    const rgt = (keys.right ? 1 : 0) + (virtual?.right ?? 0);
    const running = keys.run || (virtual?.run ?? 0) > 0;

    // ─── Mobile debug: disabled in production to reduce console noise ───
    // Previously logged every 2s — caused rAF violations and console spam.
    // Re-enable with debug flag if needed for mobile input debugging.
    // if (virtual && (fwd || bwd || lft || rgt)) { ... }

    moveDir.set(0, 0, 0);
    moveDir.addScaledVector(camFwd, fwd - bwd);
    moveDir.addScaledVector(camRight, rgt - lft);

    const moveLen = moveDir.length();
    const isMoving = moveLen > 0.01;
    const speed = (running ? RUN_SPEED : WALK_SPEED) * locomotionScale;

    // ─── Horizontal velocity with acceleration / damping ───
    if (isMoving) {
      moveDir.normalize();
      const targetVx = moveDir.x * speed;
      const targetVz = moveDir.z * speed;
      vel.x = THREE.MathUtils.damp(vel.x, targetVx, ACCEL, dt);
      vel.z = THREE.MathUtils.damp(vel.z, targetVz, ACCEL, dt);

      // Rotation — frame-rate-independent exponential decay
      const targetYaw = Math.atan2(moveDir.x, moveDir.z);
      const rotT = 1 - Math.exp(-ROTATION_SPEED * dt);
      livePlayerRotationRef.current = lerpAngle(
        livePlayerRotationRef.current, targetYaw, rotT,
      );
    } else {
      vel.x = THREE.MathUtils.damp(vel.x, 0, DAMPING, dt);
      vel.z = THREE.MathUtils.damp(vel.z, 0, DAMPING, dt);
    }

    // ─── Vertical velocity — gravity + jump ───
    // Always apply gravity; the character controller resolves ground collision
    vel.y += GRAVITY * dt;
    if (vel.y < TERMINAL_VELOCITY) vel.y = TERMINAL_VELOCITY;

    // Jump — check grounded OR coyote time
    if (keys.jump && (isGroundedRef.current || coyoteTimerRef.current > 0) && jumpCooldownRef.current <= 0) {
      vel.y = JUMP_FORCE;
      isGroundedRef.current = false;
      jumpCooldownRef.current = JUMP_COOLDOWN;
      coyoteTimerRef.current = 0;
    }

    // ─── Ground enforcement: if player is at floor level and falling (not jumping), snap to floor ───
    // This prevents the character from slowly sinking through the floor due to
    // floating-point drift or the controller not detecting ground on a particular frame.
    // The CuboidCollider floor top is at FLOOR_Y (0.01). If the player's RigidBody
    // is at or below this level AND falling AND not jumping, force them to floor level.
    {
      const pos = rb.translation();
      if (pos.y <= FLOOR_Y + 0.02 && vel.y < 0 && !keys.jump) {
        rb.setTranslation({ x: pos.x, y: FLOOR_Y, z: pos.z }, true);
        vel.y = 0;
        isGroundedRef.current = true;
        coyoteTimerRef.current = 0;
        livePlayerPositionRef.current.set(pos.x, FLOOR_Y, pos.z);
      }
    }

    // ─── Compute desired displacement (input → desired movement) ───
    const desiredDisplacement = {
      x: vel.x * dt,
      y: vel.y * dt,
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
    const collider = getPlayerCollider(rb, world, rapier);

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
          console.warn('[PhysicsPlayer] Collider not found for 60 frames — switching to direct movement mode');
          useDirectMovementRef.current = true;
        }
      } else if (collider && controllerFailCountRef.current > 0) {
        // Collider appeared! Reset failure count and restore physics.
        controllerFailCountRef.current = 0;
        if (useDirectMovementRef.current) {
          console.log('[PhysicsPlayer] Collider found — restoring full physics mode');
          useDirectMovementRef.current = false;
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

      // Ground enforcement
      if (newY <= FLOOR_Y + 0.02 && vel.y < 0) {
        newY = FLOOR_Y;
        vel.y = 0;
        isGroundedRef.current = true;
        coyoteTimerRef.current = 0;
      }

      rb.setTranslation({ x: clampedX, y: newY, z: clampedZ }, true);
      livePlayerPositionRef.current.set(clampedX, newY, clampedZ);
      return;
    }

    // Reset fail counter — collider was found
    controllerFailCountRef.current = 0;

    controller.computeColliderMovement(collider, desiredDisplacement);

    const actualDisplacement = controller.computedMovement();
    const isGroundedNow = controller.computedGrounded();

    // ─── MOVEMENT FAILSAFE ───
    // If the character controller is blocking horizontal movement
    // (actual displacement near zero while desired is significant),
    // apply the desired horizontal displacement directly with boundary clamping.
    // This ensures the player can ALWAYS move when there's input,
    // even if the Rapier character controller is misbehaving.
    const desiredHLen = Math.sqrt(desiredDisplacement.x ** 2 + desiredDisplacement.z ** 2);
    const actualHLen = Math.sqrt(actualDisplacement.x ** 2 + actualDisplacement.z ** 2);
    const movementBlocked = desiredHLen > 0.001 && actualHLen < desiredHLen * 0.3;

    if (movementBlocked) {
      // Character controller blocked most horizontal movement — bypass it
      // Use desired horizontal displacement + actual vertical displacement
      const newX = posAfterGroundEnforcement.x + desiredDisplacement.x;
      const newZ = posAfterGroundEnforcement.z + desiredDisplacement.z;
      const newY = posAfterGroundEnforcement.y + actualDisplacement.y;

      // Boundary clamping
      const clampedX = Math.max(-halfW, Math.min(halfW, newX));
      const clampedZ = Math.max(-halfD, Math.min(halfD, newZ));

      // Ground enforcement for Y
      let finalY = newY;
      if (finalY <= FLOOR_Y + 0.02 && vel.y < 0) {
        finalY = FLOOR_Y;
        vel.y = 0;
        isGroundedRef.current = true;
        coyoteTimerRef.current = 0;
      } else {
        if (isGroundedNow) {
          vel.y = 0;
          isGroundedRef.current = true;
          coyoteTimerRef.current = 0;
        }
      }

      rb.setTranslation({ x: clampedX, y: finalY, z: clampedZ }, true);
      livePlayerPositionRef.current.set(clampedX, finalY, clampedZ);

      // Track how often the controller blocks movement
      movementBlockedCountRef.current++;
      if (movementBlockedCountRef.current === 30) {
        console.warn('[PhysicsPlayer] Character controller blocked movement for 30 frames — consider switching to direct mode');
      }
      // Reset successful movement timer while stuck
      successfulMovementTimerRef.current = 0;

      if (movementBlockedCountRef.current >= 45) {
        // Controller has been blocking movement consistently — switch to direct mode
        console.warn('[PhysicsPlayer] Character controller consistently blocking movement — switching to direct movement mode');
        useDirectMovementRef.current = true;
      }
    } else {
      // Reset blocked counter — controller is working
      movementBlockedCountRef.current = 0;

      // Periodic reset: after 5 seconds of continuous successful movement,
      // hard-reset the stuck counter. This prevents false positives from
      // slow walking or brief wall touches that accumulate over time.
      successfulMovementTimerRef.current += dt;
      if (successfulMovementTimerRef.current >= 5.0) {
        movementBlockedCountRef.current = 0;
        successfulMovementTimerRef.current = 0;
      }

      // ─── Apply computed movement (normal path) ───
      rb.setTranslation({
        x: posAfterGroundEnforcement.x + actualDisplacement.x,
        y: posAfterGroundEnforcement.y + actualDisplacement.y,
        z: posAfterGroundEnforcement.z + actualDisplacement.z,
      }, true);

      // ─── Post-movement velocity correction ───
      // The controller may have changed the displacement (slope slide,
      // wall collision, ceiling hit). We correct velocity to match
      // the actual movement so the next frame's input is coherent.
      if (isGroundedNow) {
        vel.y = 0;
        if (!wasGrounded) {
          // Just landed — reset jump state
          jumpCooldownRef.current = 0;
        }
        isGroundedRef.current = true;
        coyoteTimerRef.current = 0;
      } else {
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
    }

    // ─── Floor material from scene config (single source of truth) ───
    // Previously, we read the collider name (fs:<material>) via raycast.
    // Now, with auto-colliders from visual geometry (trimesh), the collider
    // name is the scene geometry ID, not a footstep material.
    // Floor material is determined by SceneConfig.floorMaterial — no raycast needed.
    currentFloorMaterialRef.current = config.floorMaterial;

    // ─── Animation state ───
    const horizontalSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    if (!isGroundedRef.current) {
      currentAnimRef.current = vel.y > 0.5 ? 'jump' : 'fall';
    } else if (horizontalSpeed > 0.5) {
      currentAnimRef.current = horizontalSpeed > WALK_SPEED * 0.8 ? 'run' : 'walk';
    } else {
      currentAnimRef.current = 'idle';
    }

    // ─── Footsteps ───
    if (isMoving && isGroundedRef.current) {
      footstepTimerRef.current += dt;
      if (footstepTimerRef.current >= FOOTSTEP_INTERVAL) {
        footstepTimerRef.current = 0;
        const pos = rb.translation();
        eventBus.emit('exploration:footstep', {
          position: [pos.x, pos.y, pos.z],
          yaw: livePlayerRotationRef.current,
        });
        audioEngine.playFootstep(currentFloorMaterialRef.current);
      }
    } else {
      footstepTimerRef.current = 0;
    }

    // ─── Update position ref for camera + other systems ───
    const finalPos = rb.translation();
    livePlayerPositionRef.current.set(finalPos.x, finalPos.y, finalPos.z);

    // ─── EMERGENCY MOBILE FALLBACK ───
    // If the player has input (isMoving) but the RigidBody position hasn't
    // changed for 15+ frames, the character controller is silently blocking
    // movement. This happens on some mobile devices where Rapier WASM
    // computeColliderMovement returns near-zero displacement despite valid input.
    // Fix: force-apply velocity directly as a last resort.
    if (isMoving) {
      const dx = finalPos.x - prevRbPosRef.current.x;
      const dz = finalPos.z - prevRbPosRef.current.z;
      const posDelta = Math.sqrt(dx * dx + dz * dz);
      if (posDelta < 0.001) {
        noMovementFramesRef.current++;
        if (noMovementFramesRef.current >= 15 && !useDirectMovementRef.current) {
          console.warn('[PhysicsPlayer] Position unchanged for 15 frames despite input — forcing direct movement mode (mobile fallback)');
          useDirectMovementRef.current = true;
        }
        // Even in direct mode, if position still doesn't change, force-apply
        if (noMovementFramesRef.current >= 30) {
          const emergencyX = finalPos.x + vel.x * dt;
          const emergencyZ = finalPos.z + vel.z * dt;
          const clampedEmerX = Math.max(-halfW, Math.min(halfW, emergencyX));
          const clampedEmerZ = Math.max(-halfD, Math.min(halfD, emergencyZ));
          rb.setTranslation({ x: clampedEmerX, y: finalPos.y, z: clampedEmerZ }, true);
          livePlayerPositionRef.current.set(clampedEmerX, finalPos.y, clampedEmerZ);
          noMovementFramesRef.current = 15; // Keep in emergency mode but don't let counter grow forever
        }
      } else {
        noMovementFramesRef.current = 0;
      }
    } else {
      noMovementFramesRef.current = 0;
    }
    prevRbPosRef.current.set(finalPos.x, finalPos.y, finalPos.z);
  });

  // Determine karma glow color
  const karmaGlow = useMemo(() => {
    if (karma >= 65) return '#00cccc';
    if (karma <= 35) return '#cc3333';
    return '#888888';
  }, [karma]);

  const spawnPoint = config.spawnPoint;

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      position={[spawnPoint[0], spawnPoint[1] + 0.05, spawnPoint[2]]}
      colliders={false}
      lockRotations
    >
      <CapsuleCollider
        args={[PLAYER_HEIGHT / 2 - PLAYER_RADIUS, PLAYER_RADIUS]}
        position={[0, PLAYER_HEIGHT / 2, 0]}
        friction={0.7}
        restitution={0}
      />

      {/* Contact shadow — flat circle at player feet */}
      <ContactShadow />

      {/* Procedural model — default for cyberpunk aesthetic, no external GLB dependency */}
      <ProceduralPlayerModel modelScale={modelScale} karmaGlow={karmaGlow} currentAnimRef={currentAnimRef} rotationRef={livePlayerRotationRef} />

      {/* Karma glow point light — strong aura for visibility in dark scenes */}
      <pointLight
        position={[0, 1.0, 0]}
        color={karmaGlow}
        intensity={1.2}
        distance={4}
      />
      {/* Rim light behind player — warm, very dim, for silhouette separation */}
      <pointLight
        position={[0, 1.2, -0.5]}
        color="#ffaa66"
        intensity={0.15}
        distance={2}
      />
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
