import { describe, expect, it } from 'vitest';
import { STORY_NODES } from '@/data/storyNodes';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import { POEMS } from '@/data/poems';
import { SCENE_CONFIG } from '@/config/scenes';
import { items } from '@/data/items';
import { INITIAL_NPC_RELATIONS } from '@/data/constants';
import type { StoryEffect, StoryNode } from '@/data/types';

type ValidationIssue = {
  code: string;
  message: string;
};

const sceneIds = new Set(Object.keys(SCENE_CONFIG));
const nodeIds = new Set(Object.keys(STORY_NODES));
const questIds = new Set(Object.keys(QUEST_DEFINITIONS));
const npcIds = new Set(Object.keys(NPC_DEFINITIONS));
const relationNpcIds = new Set(INITIAL_NPC_RELATIONS.map((npc) => npc.id));
const knownNpcIds = new Set([...npcIds, ...relationNpcIds]);
const itemIds = new Set(Object.keys(items));

function collectNodeEffects(node: StoryNode): StoryEffect[] {
  const effects: StoryEffect[] = [];
  if (node.effect) effects.push(node.effect);
  if (node.onEnter) effects.push(node.onEnter);
  for (const choice of node.choices ?? []) {
    if (choice.effect) effects.push(choice.effect);
    if (choice.skillCheck?.successEffect) effects.push(choice.skillCheck.successEffect);
    if (choice.skillCheck?.failEffect) effects.push(choice.skillCheck.failEffect);
  }
  return effects;
}

function validateStoryGraph(): { errors: ValidationIssue[]; warnings: ValidationIssue[] } {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  for (const [nodeKey, node] of Object.entries(STORY_NODES)) {
    if (node.id !== nodeKey) {
      errors.push({
        code: 'NODE_ID_MISMATCH',
        message: `Node key "${nodeKey}" has id "${node.id}"`,
      });
    }

    if (node.scene && !sceneIds.has(node.scene)) {
      errors.push({
        code: 'NODE_SCENE_MISSING',
        message: `Node "${nodeKey}" references missing scene "${node.scene}"`,
      });
    }

    if (node.autoNext && !nodeIds.has(node.autoNext)) {
      errors.push({
        code: 'NODE_AUTO_NEXT_MISSING',
        message: `Node "${nodeKey}" autoNext points to missing node "${node.autoNext}"`,
      });
    }

    for (const choice of node.choices ?? []) {
      if (choice.next && !nodeIds.has(choice.next)) {
        errors.push({
          code: 'CHOICE_NEXT_MISSING',
          message: `Node "${nodeKey}" choice "${choice.text}" points to missing node "${choice.next}"`,
        });
      }

      if (choice.dialogueNpcId && !npcIds.has(choice.dialogueNpcId)) {
        errors.push({
          code: 'CHOICE_DIALOGUE_NPC_MISSING',
          message: `Node "${nodeKey}" choice references unknown dialogueNpcId "${choice.dialogueNpcId}"`,
        });
      }

      if (choice.skillCheck) {
        if (!nodeIds.has(choice.skillCheck.successNext)) {
          errors.push({
            code: 'SKILLCHECK_SUCCESS_NEXT_MISSING',
            message: `Node "${nodeKey}" skill check successNext missing: "${choice.skillCheck.successNext}"`,
          });
        }
        if (!nodeIds.has(choice.skillCheck.failNext)) {
          errors.push({
            code: 'SKILLCHECK_FAIL_NEXT_MISSING',
            message: `Node "${nodeKey}" skill check failNext missing: "${choice.skillCheck.failNext}"`,
          });
        }
      }
    }

    for (const effect of collectNodeEffects(node)) {
      if (effect.questStart && !questIds.has(effect.questStart)) {
        errors.push({
          code: 'EFFECT_QUEST_START_MISSING',
          message: `Node "${nodeKey}" references missing questStart "${effect.questStart}"`,
        });
      }
      if (effect.questComplete && !questIds.has(effect.questComplete)) {
        errors.push({
          code: 'EFFECT_QUEST_COMPLETE_MISSING',
          message: `Node "${nodeKey}" references missing questComplete "${effect.questComplete}"`,
        });
      }
      if (effect.questObjective && !questIds.has(effect.questObjective.questId)) {
        errors.push({
          code: 'EFFECT_QUEST_OBJECTIVE_MISSING',
          message: `Node "${nodeKey}" references missing questObjective quest "${effect.questObjective.questId}"`,
        });
      }
      for (const operation of effect.questOperations ?? []) {
        if (!questIds.has(operation.questId)) {
          errors.push({
            code: 'EFFECT_QUEST_OPERATION_MISSING',
            message: `Node "${nodeKey}" quest operation references missing quest "${operation.questId}"`,
          });
        }
      }
      if (effect.npcId && !knownNpcIds.has(effect.npcId)) {
        warnings.push({
          code: 'EFFECT_NPC_MISSING',
          message: `Node "${nodeKey}" references missing npcId "${effect.npcId}"`,
        });
      }
      if (effect.itemReward && !itemIds.has(effect.itemReward)) {
        errors.push({
          code: 'EFFECT_ITEM_REWARD_MISSING',
          message: `Node "${nodeKey}" references missing itemReward "${effect.itemReward}"`,
        });
      }
      if (effect.itemRemove && !itemIds.has(effect.itemRemove)) {
        errors.push({
          code: 'EFFECT_ITEM_REMOVE_MISSING',
          message: `Node "${nodeKey}" references missing itemRemove "${effect.itemRemove}"`,
        });
      }
    }
  }

  return { errors, warnings };
}

function validateQuests(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const [questId, quest] of Object.entries(QUEST_DEFINITIONS)) {
    if (quest.id !== questId) {
      issues.push({
        code: 'QUEST_ID_MISMATCH',
        message: `Quest key "${questId}" has id "${quest.id}"`,
      });
    }
    if (quest.startNode && !nodeIds.has(quest.startNode)) {
      issues.push({
        code: 'QUEST_START_NODE_MISSING',
        message: `Quest "${questId}" startNode missing: "${quest.startNode}"`,
      });
    }
    for (const objective of quest.objectives ?? []) {
      if (objective.targetLocation && !sceneIds.has(objective.targetLocation)) {
        issues.push({
          code: 'QUEST_TARGET_LOCATION_MISSING',
          message: `Quest "${questId}" objective "${objective.id}" targetLocation missing: "${objective.targetLocation}"`,
        });
      }
      if (objective.targetNPC && !npcIds.has(objective.targetNPC)) {
        issues.push({
          code: 'QUEST_TARGET_NPC_MISSING',
          message: `Quest "${questId}" objective "${objective.id}" targetNPC missing: "${objective.targetNPC}"`,
        });
      }
      if (objective.targetItem && !itemIds.has(objective.targetItem)) {
        issues.push({
          code: 'QUEST_TARGET_ITEM_MISSING',
          message: `Quest "${questId}" objective "${objective.id}" targetItem missing: "${objective.targetItem}"`,
        });
      }
    }
    for (const rewardItem of quest.reward?.itemRewards ?? []) {
      if (!itemIds.has(rewardItem)) {
        issues.push({
          code: 'QUEST_REWARD_ITEM_MISSING',
          message: `Quest "${questId}" reward item missing: "${rewardItem}"`,
        });
      }
    }
  }
  return issues;
}

function validatePoems(): { errors: ValidationIssue[]; warnings: ValidationIssue[] } {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  for (const poem of POEMS) {
    if (!poem.unlocksAt || !nodeIds.has(poem.unlocksAt)) {
      warnings.push({
        code: 'POEM_UNLOCK_NODE_MISSING',
        message: `Poem "${poem.id}" unlocksAt missing node "${poem.unlocksAt}"`,
      });
    }
  }
  return { errors, warnings };
}

function validateNpcDefinitions(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const [npcId, npc] of Object.entries(NPC_DEFINITIONS)) {
    if (npc.id !== npcId) {
      issues.push({
        code: 'NPC_ID_MISMATCH',
        message: `NPC key "${npcId}" has id "${npc.id}"`,
      });
    }
    if (npc.sceneId && !sceneIds.has(npc.sceneId)) {
      issues.push({
        code: 'NPC_SCENE_MISSING',
        message: `NPC "${npcId}" sceneId missing: "${npc.sceneId}"`,
      });
    }
  }
  return issues;
}

describe('Content Validator', () => {
  it('has no broken content references in core data', () => {
    const story = validateStoryGraph();
    const poems = validatePoems();
    const errors = [
      ...story.errors,
      ...validateQuests(),
      ...validateNpcDefinitions(),
      ...poems.errors,
    ];
    const warnings = [...story.warnings, ...poems.warnings];

    const errorReport = errors.map((issue) => `[${issue.code}] ${issue.message}`).join('\n');
    const warningReport = warnings.map((issue) => `[${issue.code}] ${issue.message}`).join('\n');
    if (warningReport) {
      console.warn(`Content validation warnings:\n${warningReport}`);
    }
    expect(errors, errorReport).toEqual([]);
  });
});
