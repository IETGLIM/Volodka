import type { StoryEffect } from '@/shared/types/game';

/**
 * Payload for `minigame:complete`.
 *
 * `reward` is informational / for UI. When `rewardsApplied` is true (set by
 * `completeMinigame`), listeners must NOT call applyEffects on `reward` —
 * see `src/engine/minigame/claimMinigameRewards.ts`. Quest objectives use only
 * `gameType` + `success`.
 */
export type MinigameCompletePayload = {
  gameType: string;
  success: boolean;
  reward?: StoryEffect[];
  /** Producer already applied rewards — do not re-apply `reward`. */
  rewardsApplied?: boolean;
};

/** Minigame hub open/close/complete — MinigameQuestBridge, useInteractionOrchestrator. */
export interface MinigameEvents {
  'minigame:open': { gameType: string };
  'minigame:close': Record<string, never>;
  'minigame:complete': MinigameCompletePayload;
}
