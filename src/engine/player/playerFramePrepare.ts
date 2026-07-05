import { getInteractionState, isInteractionLocked } from '@/engine/interaction/interactionSession';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { forceEmitInteractionEnd } from '@/engine/interaction/interactionEndDedup';
import { eventBus } from '@/engine/EventBus';
import { setPlayerRigidBody } from '@/engine/PlayerRigidBodyState';
import { devWarn } from '@/shared/utils/devLog';
import { resolveCachedGroundY } from '@/engine/physics/groundProbeCache';
import { WARMUP_DURATION_S } from '@/engine/player/playerConstants';
import { clearSharedVirtualControls } from '@/engine/VirtualControlsState';
import { resetKeyboardInputState } from '@/engine/keyboardInputState';
import type { FrameGameSnapshot } from '@/engine/frame/frameGameSnapshot';
import type { PlayerMovementDeps } from '@/engine/player/playerFrameTypes';

/** Warmup, locks, mobile detect — returns false to skip remaining stages. */
export function preparePlayerFrame(
  deps: PlayerMovementDeps,
  delta: number,
  game: FrameGameSnapshot,
): boolean {
  const scratch = deps.frameScratchRef.current;
  const rb = deps.rigidBodyRef.current;
  if (!rb) return false;

  let controller = deps.controllerRef.current;
  if (!controller) {
    controller = deps.recreateCharacterController();
  }
  if (!controller) return false;

  scratch.rb = rb;
  scratch.controller = controller;
  scratch.floorY = deps.config.floorY;
  scratch.vel = deps.velocityRef.current;

  if (!rb.isValid()) {
    deps.rbBoundRef.current = false;
    return false;
  }

  if (!deps.rbBoundRef.current) {
    setPlayerRigidBody(rb);
    deps.rbBoundRef.current = true;
  }

  const vel = scratch.vel;
  const fallbackFloorY = scratch.floorY;

  /**
   * [roadmap:PLYR-05] Previously clamped dt to 0.05 (50ms), which capped the
   * substep count at 2 (ceil(0.05 / (1/30)) = 2) even though MAX_PHYSICS_STEPS=4.
   * The 4-substep path was dead code. Raised clamp to 0.133 (133ms = ~8 frames
   * at 60fps) so the full 4-substep path activates on severe frame hitches
   * (e.g., tab refocus, GC pause). 0.133 = 4 × (1/30) — exactly enough for
   * MAX_PHYSICS_STEPS=4 substeps at the physics timestep of 1/30s.
   */
  const dt = Math.min(delta, 0.133);
  scratch.dt = dt;

  const phase = game.gamePhase;
  const inCinematic = phase === 'cutscene' || phase === 'intro';

  if (!inCinematic && deps.warmupTimerRef.current < WARMUP_DURATION_S) {
    deps.warmupTimerRef.current += dt;
  }

  if (deps.warmupTimerRef.current < WARMUP_DURATION_S) {
    vel.set(0, 0, 0);
    const storePos = game.playerPosition;
    const holdX = storePos[0];
    const holdY = storePos[1];
    const holdZ = storePos[2];
    rb.setTranslation({ x: holdX, y: holdY, z: holdZ }, true);
    deps.livePlayerPositionRef.current.set(holdX, holdY, holdZ);
    deps.isGroundedRef.current = true;
    deps.currentAnimRef.current = 'idle';
    return false;
  }

  const currentPos = rb.translation();
  const airborne =
    !deps.isGroundedRef.current || scratch.vel.y > 0.2;
  const rescueGroundY = resolveCachedGroundY(
    deps.world,
    deps.rapier,
    deps.groundProbeCacheRef.current,
    {
      sceneId: deps.sceneId,
      x: currentPos.x,
      feetY: currentPos.y,
      z: currentPos.z,
      fallbackFloorY,
      dt,
      airborne,
      excludeCollider: deps.capsuleColliderRef.current,
      excludeRigidBody: rb,
    },
  );
  scratch.groundY = rescueGroundY;

  if (currentPos.y < rescueGroundY - 0.1) {
    rb.setTranslation({ x: currentPos.x, y: rescueGroundY, z: currentPos.z }, true);
    vel.set(0, 0, 0);
    deps.isGroundedRef.current = true;
    deps.coyoteTimerRef.current = 0;
    deps.livePlayerPositionRef.current.set(currentPos.x, rescueGroundY, currentPos.z);
    return false;
  }

  if (deps.jumpCooldownRef.current > 0) deps.jumpCooldownRef.current -= dt;
  if (deps.coyoteTimerRef.current > 0) deps.coyoteTimerRef.current -= dt;

  const currentMode = game.gamePhase;
  const showStoryOverlay = game.showStoryOverlay;
  const isLocked =
    game.movementLocked ||
    isInteractionLocked();

  scratch.isLocked = isLocked;
  scratch.currentMode = currentMode;

  if (isLocked && !deps.prevLocomotionLockedRef.current) {
    vel.set(0, 0, 0);
    resetKeyboardInputState();
    clearSharedVirtualControls();
  }
  deps.prevLocomotionLockedRef.current = isLocked;

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
    deps.stuckLockTimerRef.current += dt;
    if (deps.stuckLockTimerRef.current > 2.0) {
      devWarn('[PhysicsPlayer] Interaction lock stuck for 2s — force-unlocking');
      forceEmitInteractionEnd();
      eventBus.emit('player:stand_up', {});
      deps.stuckLockTimerRef.current = 0;
    }
  } else if (!isLocked) {
    deps.stuckLockTimerRef.current = 0;
  }

  return true;
}
