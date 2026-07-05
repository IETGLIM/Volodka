/* ─── Top-level game runtime state ─── */

import type { GameMode } from '../definitions/story';
import type { ExplorationState } from './exploration';
import type { PlayerState } from './player';
import type { QuestState } from './quest';

export interface GameState {
  mode: GameMode;
  currentNodeId: string;
  playerState: PlayerState;
  exploration: ExplorationState;
  quests: QuestState[];
  collectedPoems: string[];
  tutorialFlags: {
    tutorial_seen_movement: boolean;
    tutorial_seen_interact: boolean;
    tutorial_seen_controls: boolean;
    tutorialsDisabled: boolean;
    tutorialsCompleted: boolean;
  };
  lastSaveTimestamp: number | null;
}
