/* ─── Dialogue definitions ─── */

import type { SceneId } from '@/config/sceneDefinitions';
import type { ChoiceCondition } from '../common/conditions';
import type { StoryEffect } from '../common/effects';
import type { NarrativeTextVariants, KarmaThresholds } from './narrative';

export interface DialogueChoice {
  readonly text: string;
  readonly next: string | null;
  readonly effects?: StoryEffect[];
  readonly condition?: ChoiceCondition;
}

export type DialogueTextVariants = NarrativeTextVariants;

export interface DialogueNode {
  readonly id: string;
  /** Display name shown in the dialogue UI (locale-specific). */
  readonly speaker: string;
  /** Canonical NPC registry id for lookup; prefer over `speaker` when set (i18n-safe). */
  readonly speakerId?: string;
  readonly text: string;
  readonly textVariants?: DialogueTextVariants;
  readonly karmaThresholds?: KarmaThresholds;
  /** Screen-reader context spoken before dialogue text when present */
  readonly contextNote?: string;
  readonly condition?: ChoiceCondition;
  readonly choices: DialogueChoice[];
  readonly effects?: StoryEffect[];
  readonly sceneId?: SceneId;
  /** Directed performance — overrides regex emotion detection */
  readonly emotion?: 'calm' | 'angry' | 'sad' | 'happy' | 'whisper';
  readonly voiceLineId?: string;
  readonly cameraShot?: 'close' | 'medium' | 'wide';
}
