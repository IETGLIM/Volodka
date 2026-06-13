/* ─── Story / narrative definitions ─── */

import type { SceneId } from '@/config/sceneDefinitions';
import type { ChoiceCondition } from '../common/conditions';
import type { StoryEffect } from '../common/effects';

export type GameMode = 'exploration';

export type LegacyGamePhase = 'menu' | 'intro' | 'exploration' | 'cutscene' | 'combat';

export type StoryGuidanceObjectiveType =
  | 'talk_to_npc'
  | 'visit_location'
  | 'complete_quest'
  | 'collect_item'
  | 'make_choice';

export interface StoryChoice {
  readonly text: string;
  readonly next: string | null;
  readonly effects?: StoryEffect[];
  readonly condition?: ChoiceCondition;
  readonly goldenPath?: boolean;
}

export interface StoryNode {
  readonly id: string;
  readonly text: string;
  readonly speaker?: string;
  readonly sceneId: SceneId;
  readonly choices: StoryChoice[];
  readonly effects?: StoryEffect[];
  readonly poemId?: string;
  readonly cutsceneId?: string;
  readonly guidanceHint?: string;
  readonly guidanceNpcId?: string;
  readonly guidanceSceneLabel?: string;
  readonly guidanceObjectiveType?: StoryGuidanceObjectiveType;
  readonly actEntry?: number;
}
