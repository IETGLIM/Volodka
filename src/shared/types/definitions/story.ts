/* ─── Story / narrative definitions ─── */

import type { SceneId } from '@/config/sceneDefinitions';
import type { AmbientSoundType } from '@/shared/types/ambientSound';
import type { ChoiceCondition } from '../common/conditions';
import type { StoryEffect } from '../common/effects';
import type {
  KarmaThresholds,
  NarrativeTextVariants,
  StoryMusicCue,
} from './narrative';

export type { KarmaThresholds, NarrativeTextVariants, StoryMusicCue } from './narrative';

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
  readonly textVariants?: NarrativeTextVariants;
  readonly karmaThresholds?: KarmaThresholds;
  /** Atmospheric detail for screen readers (spoken before main text) */
  readonly contextNote?: string;
  /** First-visit explore-hub location toast (closed-overlay model). */
  readonly hubIntroText?: string;
  /** Shorter revisit toast when re-entering an explore hub. */
  readonly hubRevisitText?: string;
  /** Optional ambient bed path — layered when node opens */
  readonly ambientSound?: string;
  /** Override procedural ambient profile while this node is active */
  readonly proceduralAmbientOverride?: AmbientSoundType;
  /** Location/state change announcement for assistive tech */
  readonly accessibilityAnnounce?: string;
  readonly soundEffect?: string;
  readonly musicCue?: StoryMusicCue;
  /** Trigger autosave when the node is first visited */
  readonly autoSave?: boolean;
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
  /** Gate entire node — redirects away if condition fails */
  readonly condition?: ChoiceCondition;
}
