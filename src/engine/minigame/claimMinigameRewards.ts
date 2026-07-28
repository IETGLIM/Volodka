/* ─── Minigame reward claim (single apply path) ───
 *
 * Dual-path finding (Phase 6 / Sprint 0):
 * Minigames historically called `store.addXp` / `addKarma` / … AND mirrored the
 * same effects as `reward[]` on `minigame:complete`. No listener applies
 * `payload.reward` today — QuestTracker and MinigameQuestBridge only use
 * `gameType` + `success` for quest objectives. That is a latent double-apply
 * risk if a future listener calls `applyEffects(payload.reward)`.
 *
 * Contract:
 * - Producers apply rewards exactly once via `completeMinigame`, then emit with
 *   `rewardsApplied: true`.
 * - Listeners MUST NOT apply `payload.reward` when `rewardsApplied` is true
 *   (use `shouldApplyMinigameEventRewards`).
 * - Quest objectives remain event-driven (`gameType` / `success` only).
 * - Optional `claimedKeys` + `claimKey` make apply idempotent for a single
 *   completion attempt — do NOT key by gameType alone (replays must still pay).
 */

import { eventBus } from '@/engine/EventBus';
import type { MinigameCompletePayload } from '@/engine/events/minigameEvents';
import { applyEffects } from '@/engine/effects/applyEffects';
import type { StoryEffect } from '@/shared/types/game';

/** True when a listener is allowed to apply `payload.reward` (legacy / unclaimed). */
export function shouldApplyMinigameEventRewards(
  payload: Pick<MinigameCompletePayload, 'reward' | 'rewardsApplied'>,
): boolean {
  if (payload.rewardsApplied === true) return false;
  return Array.isArray(payload.reward) && payload.reward.length > 0;
}

export interface ClaimMinigameRewardsInput {
  /** Per-completion idempotency key (unique for each play attempt). */
  claimKey: string;
  rewards: StoryEffect[];
  apply: (effects: StoryEffect[]) => void;
  claimedKeys: Set<string>;
}

export interface ClaimMinigameRewardsResult {
  /** False when this claimKey was already used. */
  claimed: boolean;
  /** True when apply() ran with a non-empty rewards list. */
  applied: boolean;
}

/** Idempotent reward apply — second call with the same claimKey is a no-op. */
export function claimMinigameRewards(input: ClaimMinigameRewardsInput): ClaimMinigameRewardsResult {
  if (input.claimedKeys.has(input.claimKey)) {
    return { claimed: false, applied: false };
  }
  input.claimedKeys.add(input.claimKey);
  if (input.rewards.length === 0) {
    return { claimed: true, applied: false };
  }
  input.apply(input.rewards);
  return { claimed: true, applied: true };
}

/**
 * Safe consumer-side apply: no-ops when `rewardsApplied` is set, otherwise
 * claims once via `claimKey` so producer+listener cannot double-pay.
 */
export function tryApplyMinigameEventRewards(
  payload: MinigameCompletePayload,
  apply: (effects: StoryEffect[]) => void,
  claimedKeys: Set<string>,
  claimKey: string,
): ClaimMinigameRewardsResult {
  if (!shouldApplyMinigameEventRewards(payload)) {
    return { claimed: false, applied: false };
  }
  return claimMinigameRewards({
    claimKey,
    rewards: payload.reward ?? [],
    apply,
    claimedKeys,
  });
}

export interface CompleteMinigameInput {
  gameType: string;
  success: boolean;
  rewards?: StoryEffect[];
  /**
   * Optional idempotency. When both are set, duplicate completeMinigame calls
   * with the same key skip re-apply (emit still fires for quest listeners).
   */
  claimKey?: string;
  claimedKeys?: Set<string>;
  apply?: (effects: StoryEffect[]) => void;
  emit?: (payload: MinigameCompletePayload) => void;
}

export interface CompleteMinigameResult {
  claimed: boolean;
  applied: boolean;
  payload: MinigameCompletePayload;
}

/**
 * Apply rewards once, then emit `minigame:complete` with `rewardsApplied: true`
 * so listeners never re-apply `payload.reward`. Quest listeners still receive
 * the event for objectives.
 */
export function completeMinigame(input: CompleteMinigameInput): CompleteMinigameResult {
  const rewards = input.rewards ?? [];
  const apply = input.apply ?? applyEffects;
  const emit =
    input.emit ??
    ((payload: MinigameCompletePayload) => {
      eventBus.emit('minigame:complete', payload);
    });

  let claimed = true;
  let applied = false;

  if (input.claimKey && input.claimedKeys) {
    const result = claimMinigameRewards({
      claimKey: input.claimKey,
      rewards,
      apply,
      claimedKeys: input.claimedKeys,
    });
    claimed = result.claimed;
    applied = result.applied;
  } else if (rewards.length > 0) {
    apply(rewards);
    applied = true;
  }

  const payload: MinigameCompletePayload = {
    gameType: input.gameType,
    success: input.success,
    rewardsApplied: true,
    ...(rewards.length > 0 ? { reward: rewards } : {}),
  };

  emit(payload);

  return { claimed, applied, payload };
}
