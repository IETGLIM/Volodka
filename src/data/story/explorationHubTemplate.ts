import type { SceneId } from '@/config/sceneDefinitions';
import type { StoryChoice, StoryNode } from '@/shared/types/game';
import type { StoryEffect } from '@/shared/types/game';
import type { ChoiceCondition } from '@/shared/types/common/conditions';

export interface ExplorationHubChoice {
  readonly text: string;
  readonly next: string;
  readonly goldenPath?: boolean;
  readonly effects?: StoryEffect[];
  readonly condition?: ChoiceCondition;
}

export interface FreeRoamPass {
  readonly flag: string;
  readonly effects?: StoryEffect[];
}

export interface ExplorationHubDefinition {
  readonly id: string;
  readonly sceneId: SceneId;
  readonly text: string;
  readonly contextNote?: string;
  readonly accessibilityAnnounce?: string;
  readonly guidanceHint?: string;
  readonly guidanceNpcId?: string;
  readonly guidanceSceneLabel?: string;
  readonly guidanceObjectiveType?: StoryNode['guidanceObjectiveType'];
  readonly choices: readonly ExplorationHubChoice[];
  readonly freeRoamLabel?: string;
  /** Sequential free-roam passes — only one visible at a time via missingFlag chain */
  readonly freeRoamPasses?: readonly FreeRoamPass[];
}

/** Build a scene exploration hub node with optional capped free-roam self-loop. */
export function buildExplorationHubNode(def: ExplorationHubDefinition): StoryNode {
  const freeRoamLabel = def.freeRoamLabel ?? 'Свободно исследовать';
  const hubId = def.id;

  const freeRoamChoices: StoryChoice[] = (def.freeRoamPasses ?? []).map((pass, index) => {
    const condition: ChoiceCondition = index === 0
      ? { missingFlag: pass.flag }
      : {
          flag: def.freeRoamPasses![index - 1]!.flag,
          missingFlag: pass.flag,
        };

    return {
      text: freeRoamLabel,
      next: hubId,
      condition,
      effects: [
        ...(pass.effects ?? []),
        { type: 'setFlag', flag: pass.flag, flagValue: true },
      ],
    };
  });

  return {
    id: def.id,
    text: def.text,
    speaker: 'narrator',
    sceneId: def.sceneId,
    contextNote: def.contextNote,
    accessibilityAnnounce: def.accessibilityAnnounce,
    guidanceHint: def.guidanceHint,
    guidanceNpcId: def.guidanceNpcId,
    guidanceSceneLabel: def.guidanceSceneLabel,
    guidanceObjectiveType: def.guidanceObjectiveType,
    choices: [...def.choices, ...freeRoamChoices],
  };
}
