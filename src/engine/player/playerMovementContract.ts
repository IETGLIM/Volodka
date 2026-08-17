import { InteractionState } from '@/engine/interaction/interactionMachine';

export type PlayerMovementLockReason =
  | 'dialogue'
  | 'cutscene'
  | 'cinematic_timeline'
  | 'story_overlay'
  | 'diegetic_narrative'
  | 'gameplay_overlay'
  | 'interaction_lock';

export type PlayerExternalVelocityConsumer = 'kcc_locked_movement' | 'simple_locked_movement';

export interface PlayerMovementLockContract {
  locked: boolean;
  reasons: readonly PlayerMovementLockReason[];
  allowsExternalVelocity: boolean;
  shouldResetInputOnEnter: boolean;
  shouldWatchStuckInteraction: boolean;
}

export interface PlayerFinalizeFrameContract {
  publishLivePosition: 'post_physics' | 'inline_direct';
  enforceFloor: boolean;
  resolveAnimation: boolean;
  emitFootsteps: boolean;
}

export interface PlayerMovementFrameContract {
  lock: PlayerMovementLockContract;
  externalVelocityConsumers: readonly PlayerExternalVelocityConsumer[];
  finalizeFrame: PlayerFinalizeFrameContract;
}

export const KCC_FINALIZE_FRAME_CONTRACT: PlayerFinalizeFrameContract = {
  publishLivePosition: 'post_physics',
  enforceFloor: true,
  resolveAnimation: true,
  emitFootsteps: true,
};

export const SIMPLE_PLAYER_FINALIZE_FRAME_CONTRACT: PlayerFinalizeFrameContract = {
  publishLivePosition: 'inline_direct',
  enforceFloor: true,
  resolveAnimation: true,
  emitFootsteps: true,
};

const EXTERNAL_VELOCITY_BLOCKERS = new Set<PlayerMovementLockReason>([
  'dialogue',
  'cutscene',
  'cinematic_timeline',
  'story_overlay',
  'diegetic_narrative',
  'gameplay_overlay',
]);

export function createPlayerMovementLockContract(
  reasons: readonly PlayerMovementLockReason[],
  options: {
    interactionState?: InteractionState;
  } = {},
): PlayerMovementLockContract {
  const uniqueReasons = [...new Set(reasons)];
  const interactionLocked = uniqueReasons.includes('interaction_lock');
  const allowsExternalVelocity =
    interactionLocked &&
    uniqueReasons.every((reason) => !EXTERNAL_VELOCITY_BLOCKERS.has(reason));
  const shouldWatchStuckInteraction =
    interactionLocked &&
    options.interactionState !== InteractionState.Approach &&
    options.interactionState !== InteractionState.Cutscene &&
    !uniqueReasons.includes('dialogue') &&
    !uniqueReasons.includes('story_overlay') &&
    !uniqueReasons.includes('diegetic_narrative') &&
    !uniqueReasons.includes('cutscene') &&
    !uniqueReasons.includes('cinematic_timeline');

  return {
    locked: uniqueReasons.length > 0,
    reasons: uniqueReasons,
    allowsExternalVelocity,
    shouldResetInputOnEnter: uniqueReasons.length > 0,
    shouldWatchStuckInteraction,
  };
}

export function addPlayerMovementLockReasons(
  contract: PlayerMovementLockContract,
  reasons: readonly PlayerMovementLockReason[],
  options: {
    interactionState?: InteractionState;
  } = {},
): PlayerMovementLockContract {
  return createPlayerMovementLockContract([...contract.reasons, ...reasons], options);
}

export function shouldConsumeExternalVelocity(
  contract: PlayerMovementLockContract,
  consumer: PlayerExternalVelocityConsumer,
  externalActive: boolean,
): boolean {
  void consumer;
  return externalActive && contract.locked && contract.allowsExternalVelocity;
}

export function createPlayerMovementFrameContract(
  lock: PlayerMovementLockContract,
  options: {
    finalizeFrame: PlayerFinalizeFrameContract;
    externalVelocityConsumers?: readonly PlayerExternalVelocityConsumer[];
  },
): PlayerMovementFrameContract {
  return {
    lock,
    externalVelocityConsumers: options.externalVelocityConsumers ?? [],
    finalizeFrame: options.finalizeFrame,
  };
}
