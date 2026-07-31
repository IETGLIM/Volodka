import { getInteractionState, isInteractionLocked } from '@/engine/interaction/interactionSession';
import { forceEmitInteractionEnd } from '@/engine/interaction/interactionEndDedup';
import { eventBus } from '@/engine/EventBus';
import { setPlayerRigidBody } from '@/engine/PlayerRigidBodyState';
import { devWarn } from '@/shared/utils/devLog';
import { resolveCachedGroundY } from '@/engine/physics/groundProbeCache';
import { WARMUP_DURATION_S } from '@/engine/player/playerConstants';
import { setSharedVirtualControlsWritable } from '@/engine/VirtualControlsState';
import { resetKeyboardInputState } from '@/engine/keyboardInputState';
import { isMovementEpochStale } from '@/engine/player/playerMovementSceneSync';
import { SIM_DELTA_MAX } from '@/engine/player/playerOwnership';
import { addPlayerMovementLockReasons } from '@/engine/player/playerMovementContract';
import type { FrameGameSnapshot } from '@/engine/frame/frameGameSnapshot';
import type { PlayerMovementDeps } from '@/engine/player/playerFrameTypes';

/** Warmup, locks, mobile detect — returns false to skip remaining stages. */
export function preparePlayerFrame(
  deps: PlayerMovementDeps,
  delta: number,
  game: FrameGameSnapshot,
  currentMovementEpoch: number,
): boolean {
  // H3: Abort stale frames from the old scene (e.g. 1 frame after scene
  // transition before the EventBus handler bumps the epoch).
  if (isMovementEpochStale(deps, currentMovementEpoch)) return false;

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

  // Same cap as FollowCamera / InteractionSystemBridge — hitch frames must not
  // advance player farther than camera/interaction assume.
  const dt = Math.min(delta, SIM_DELTA_MAX);
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
    // Reset currentAnimRef to idle on rescue — without this, a stale
    // 'jump'/'fall' animation persists for one frame because preparePlayerFrame
    // returns false (finalizePlayerFrame is skipped). The warmup path above
    // already does this; the rescue path was missing it.
    deps.currentAnimRef.current = 'idle';
    return false;
  }

  if (deps.jumpCooldownRef.current > 0) deps.jumpCooldownRef.current -= dt;
  if (deps.coyoteTimerRef.current > 0) deps.coyoteTimerRef.current -= dt;

  const currentMode = game.gamePhase;
  const interactionState = getInteractionState();
  const interactionLocked = isInteractionLocked();
  const lockContract = addPlayerMovementLockReasons(
    game.movementLock,
    interactionLocked ? ['interaction_lock'] : [],
    { interactionState },
  );
  const isLocked = lockContract.locked;

  scratch.isLocked = isLocked;
  scratch.lockContract = lockContract;
  scratch.currentMode = currentMode;

  if (isLocked) {
    if (lockContract.shouldResetInputOnEnter && !deps.prevLocomotionLockedRef.current) {
      vel.set(0, 0, 0);
      resetKeyboardInputState();
    }
    // Keep write gate closed for the whole lock so mouse-both-buttons cannot
    // re-assert forward after gamepad / clearSharedVirtualControls zeros axes.
    setSharedVirtualControlsWritable(false);
  } else if (deps.prevLocomotionLockedRef.current) {
    setSharedVirtualControlsWritable(true);
  }
  deps.prevLocomotionLockedRef.current = isLocked;

  // MEDIUM-2 (audit-4 follow-up): suppress the 2s stuck-lock recovery when a
  // diegetic (in-world) narrative panel is open. Diegetic panels don't set
  // showStoryOverlay, so without this guard the watchdog would force-emit
  // interaction:end after 2s and silently break in-world dialogues.
  const shouldWatchStuckLock = currentMode === 'exploration' && lockContract.shouldWatchStuckInteraction;

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
