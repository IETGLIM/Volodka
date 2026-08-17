import type { PlayerMovementDeps } from '@/engine/player/playerFrameTypes';

export interface MovementScratchSyncContract {
  isGroundedNow: boolean;
  onFlatGround: boolean;
  airborneIntent: boolean;
  isMoving: boolean;
  running: boolean;
  keyboardDrivesMove: boolean;
  blockedByWall: boolean;
  justLanded: boolean;
  landingImpactVel: number;
  prevVelY: number;
}

export type MutableMovementScratch = MovementScratchSyncContract;

export interface SyncMovementScratchOptions {
  isGroundedNow: boolean;
  onFlatGround: boolean;
  airborneIntent: boolean;
  isMoving: boolean;
  running?: boolean;
  keyboardDrivesMove?: boolean;
  blockedByWall?: boolean;
  justLanded?: boolean;
  landingImpactVel?: number;
  prevVelY?: number;
}

export function syncMovementScratchFields(
  scratch: MutableMovementScratch,
  options: SyncMovementScratchOptions,
): void {
  scratch.isGroundedNow = options.isGroundedNow;
  scratch.onFlatGround = options.onFlatGround;
  scratch.airborneIntent = options.airborneIntent;
  scratch.isMoving = options.isMoving;
  scratch.running = options.running ?? false;
  scratch.keyboardDrivesMove = options.keyboardDrivesMove ?? false;
  scratch.blockedByWall = options.blockedByWall ?? false;
  scratch.justLanded = options.justLanded ?? false;
  scratch.landingImpactVel = options.landingImpactVel ?? 0;
  scratch.prevVelY = options.prevVelY ?? scratch.prevVelY;
}

export function createIdleMovementScratch(): MovementScratchSyncContract {
  return {
    isGroundedNow: true,
    onFlatGround: true,
    airborneIntent: false,
    isMoving: false,
    running: false,
    keyboardDrivesMove: false,
    blockedByWall: false,
    justLanded: false,
    landingImpactVel: 0,
    prevVelY: 0,
  };
}

/** Keep finalizePlayerFrame's authoritative scratch view aligned on non-KCC paths. */
export function syncResolvedMovementScratch(
  deps: PlayerMovementDeps,
  options: SyncMovementScratchOptions,
): void {
  const scratch = deps.frameScratchRef.current;

  syncMovementScratchFields(scratch, {
    ...options,
    prevVelY: options.prevVelY ?? scratch.vel.y,
  });
}
