import { getGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { isNarrativeMovementLocked } from '@/shared/exploreHubNodes';
import { getInteractionState, isInteractionLocked } from '@/engine/interaction/interactionSession';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { forceEmitInteractionEnd } from '@/engine/interaction/interactionEndDedup';
import { eventBus } from '@/engine/EventBus';
import { setPlayerRigidBody } from '@/engine/PlayerRigidBodyState';
import { devWarn } from '@/shared/utils/devLog';
import { probeGroundY } from '@/engine/physics/groundProbe';
import { WARMUP_DURATION_S } from '@/engine/player/playerConstants';
import type { PlayerMovementDeps } from '@/engine/player/playerFrameTypes';

/** Warmup, locks, mobile detect — returns false to skip remaining stages. */
export function preparePlayerFrame(deps: PlayerMovementDeps, delta: number): boolean {
  const scratch = deps.frameScratchRef.current;
  const rb = deps.rigidBodyRef.current;
  const controller = deps.controllerRef.current;
  if (!rb || !controller) return false;

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

  const dt = Math.min(delta, 0.05);
  scratch.dt = dt;

  const storeSnapshot = getGameStore();
  const phase = readGamePhase(storeSnapshot);
  const inCinematic = phase === 'cutscene' || phase === 'intro';

  if (!inCinematic && deps.warmupTimerRef.current < WARMUP_DURATION_S) {
    deps.warmupTimerRef.current += dt;
  }

  if (deps.warmupTimerRef.current < WARMUP_DURATION_S) {
    vel.set(0, 0, 0);
    const storePos = getGameStore().exploration.playerPosition;
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
  const rescueGroundY = probeGroundY(
    deps.world as unknown as Parameters<typeof probeGroundY>[0],
    deps.rapier as Parameters<typeof probeGroundY>[1],
    currentPos.x,
    currentPos.y,
    currentPos.z,
    fallbackFloorY,
    deps.capsuleColliderRef.current,
    rb,
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

  const lockState = getGameStore();
  const currentMode = readGamePhase(lockState);
  const showStoryOverlay = lockState.showStoryOverlay;
  const currentNodeId = lockState.currentNodeId;
  const isLocked =
    isNarrativeMovementLocked(showStoryOverlay, currentNodeId) ||
    currentMode === 'cutscene' ||
    currentMode === 'intro' ||
    currentMode === 'combat' ||
    isInteractionLocked();

  scratch.isLocked = isLocked;
  scratch.currentMode = currentMode;

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
