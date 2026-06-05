import type { StoryEffect } from '@/shared/types/game';

/** Minigame hub open/close/complete — MinigameQuestBridge, useInteractionOrchestrator. */
export interface MinigameEvents {
  'minigame:open': { gameType: string };
  'minigame:close': Record<string, never>;
  'minigame:complete': { gameType: string; success: boolean; reward?: StoryEffect[] };
}
