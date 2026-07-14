import { STORY_NODE_ALIASES, NPC_ID_ALIASES } from '@/data/goldenPath';
import { MinSkillCheckSchema } from '@/shared/validation/skillCheck';
import { isTrainablePlayerSkill } from '@/shared/validation/typeGuards';
import type { ChoiceCondition } from '@/shared/types/common/conditions';
import type { StoryEffect, StoryNode } from '@/shared/types/game';

export interface StoryNodeValidationRegistry {
  readonly storyNodeIds: ReadonlySet<string>;
  readonly dialogueNodeIds: ReadonlySet<string>;
  readonly questIds: ReadonlySet<string>;
  readonly poemIds: ReadonlySet<string>;
  readonly itemIds: ReadonlySet<string>;
  readonly npcIds: ReadonlySet<string>;
  readonly sceneIds: ReadonlySet<string>;
  readonly loreIds: ReadonlySet<string>;
  readonly enemyTypes: ReadonlySet<string>;
  readonly storyNodeAliases?: Readonly<Record<string, string>>;
  readonly npcIdAliases?: Readonly<Record<string, string>>;
}

export interface StoryNodeValidationError {
  path: string;
  message: string;
}

function isKnownNpcId(npcId: string, reg: StoryNodeValidationRegistry): boolean {
  const aliases = reg.npcIdAliases ?? NPC_ID_ALIASES;
  return reg.npcIds.has(npcId) || npcId in aliases;
}

function resolveNodeRef(
  next: string | null | undefined,
  reg: StoryNodeValidationRegistry,
): boolean {
  if (next == null) return true;
  const aliases = reg.storyNodeAliases ?? STORY_NODE_ALIASES;
  const resolved = aliases[next] ?? next;
  return (
    reg.storyNodeIds.has(resolved) ||
    reg.storyNodeIds.has(next) ||
    reg.dialogueNodeIds.has(next)
  );
}

function pushError(
  out: StoryNodeValidationError[],
  path: string,
  message: string,
): void {
  out.push({ path, message });
}

export function validateStoryEffects(
  effects: StoryEffect[] | undefined,
  path: string,
  reg: StoryNodeValidationRegistry,
  out: StoryNodeValidationError[],
): void {
  if (!effects) return;
  for (let i = 0; i < effects.length; i++) {
    const e = effects[i];
    const ep = `${path}.effects[${i}]`;
    if (e.type === 'showThought') {
      if (!e.thought) {
        pushError(out, ep, 'showThought missing thought text');
      }
      continue;
    }
    switch (e.type) {
      case 'collectPoem':
        if (!e.poemId) {
          pushError(out, ep, 'collectPoem missing poemId');
        } else if (!reg.poemIds.has(e.poemId)) {
          pushError(out, ep, `unknown poemId "${e.poemId}"`);
        }
        break;
      case 'triggerQuest':
        if (!e.questId) {
          pushError(out, ep, 'triggerQuest missing questId');
        } else if (!reg.questIds.has(e.questId)) {
          pushError(out, ep, `unknown questId "${e.questId}"`);
        }
        break;
      case 'addItem':
      case 'removeItem':
        if (!e.itemId) {
          pushError(out, ep, `${e.type} missing itemId`);
        } else if (!reg.itemIds.has(e.itemId)) {
          pushError(out, ep, `unknown itemId "${e.itemId}"`);
        }
        break;
      case 'setFlag':
        if (!e.flag) {
          pushError(out, ep, 'setFlag missing flag');
        }
        break;
      case 'npcChange':
        if (!e.npcId) {
          pushError(out, ep, 'npcChange missing npcId');
        } else if (!isKnownNpcId(e.npcId, reg)) {
          pushError(out, ep, `unknown npcId "${e.npcId}"`);
        }
        break;
      case 'discoverLore':
        if (!e.loreId) {
          pushError(out, ep, 'discoverLore missing loreId');
        } else {
          for (const lid of e.loreId.split(',').map((s) => s.trim()).filter(Boolean)) {
            if (!reg.loreIds.has(lid)) {
              pushError(out, ep, `unknown loreId "${lid}"`);
            }
          }
        }
        break;
      case 'combat':
        if (!e.enemyType) {
          pushError(out, ep, 'combat missing enemyType');
        } else if (!reg.enemyTypes.has(e.enemyType)) {
          pushError(out, ep, `unknown enemyType "${e.enemyType}"`);
        }
        break;
      case 'transitionScene':
        if (!e.sceneId) {
          pushError(out, ep, 'transitionScene missing sceneId');
        } else if (!reg.sceneIds.has(e.sceneId)) {
          pushError(out, ep, `unknown sceneId "${e.sceneId}"`);
        }
        break;
      case 'visitStoryNode':
        if (!e.nodeId) {
          pushError(out, ep, 'visitStoryNode missing nodeId');
        } else if (
          !reg.storyNodeIds.has(e.nodeId) &&
          !reg.dialogueNodeIds.has(e.nodeId)
        ) {
          pushError(out, ep, `unknown nodeId "${e.nodeId}"`);
        }
        break;
      case 'addSkill':
        if (!e.skill) {
          pushError(out, ep, 'addSkill missing skill');
        } else if (!isTrainablePlayerSkill(e.skill)) {
          pushError(out, ep, `unknown skill "${e.skill}"`);
        }
        if (e.value === undefined) {
          pushError(out, ep, 'addSkill missing value');
        }
        break;
      case 'addStat':
        if (!e.stat) {
          pushError(out, ep, 'addStat missing stat');
        }
        if (e.value === undefined) {
          pushError(out, ep, 'addStat missing value');
        }
        break;
      case 'addKarma':
      case 'addXp':
      case 'addCredits':
        if (e.value === undefined) {
          pushError(out, ep, `${e.type} missing value`);
        }
        break;
      case 'openDataTerminal':
        // Validated at runtime — terminalDifficulty, terminalTitle, terminalReward are optional
        break;
      default: {
        const unknownType = (e as StoryEffect).type;
        pushError(out, ep, `unknown effect type "${unknownType}"`);
      }
    }
  }
}

export function validateStoryCondition(
  condition: ChoiceCondition | undefined,
  path: string,
  reg: StoryNodeValidationRegistry,
  out: StoryNodeValidationError[],
): void {
  if (!condition) return;

  if (condition.collectedPoem && !reg.poemIds.has(condition.collectedPoem)) {
    pushError(out, path, `unknown collectedPoem "${condition.collectedPoem}"`);
  }
  if (condition.missingPoem && !reg.poemIds.has(condition.missingPoem)) {
    pushError(out, path, `unknown missingPoem "${condition.missingPoem}"`);
  }
  if (condition.hasItem && !reg.itemIds.has(condition.hasItem)) {
    pushError(out, path, `unknown hasItem "${condition.hasItem}"`);
  }

  if (condition.minSkillCheck) {
    const result = MinSkillCheckSchema.safeParse(condition.minSkillCheck);
    if (!result.success) {
      pushError(out, path, 'invalid minSkillCheck (skill + integer difficulty 1–20)');
    }
  }

  if (condition.minSkill) {
    for (const skill of Object.keys(condition.minSkill)) {
      if (!isTrainablePlayerSkill(skill)) {
        pushError(out, path, `unknown minSkill key "${skill}"`);
      }
    }
  }

  if (
    condition.requiredAct !== undefined &&
    (!Number.isInteger(condition.requiredAct) || condition.requiredAct < 1)
  ) {
    pushError(out, path, `invalid requiredAct ${condition.requiredAct}`);
  }

  for (const [field, value] of [
    ['minTimeOfDay', condition.minTimeOfDay],
    ['maxTimeOfDay', condition.maxTimeOfDay],
  ] as const) {
    if (value !== undefined && (value < 0 || value > 24)) {
      pushError(out, path, `invalid ${field} ${value} (expected 0–24)`);
    }
  }
}

export function validateSingleStoryNode(
  key: string,
  node: StoryNode,
  reg: StoryNodeValidationRegistry,
): StoryNodeValidationError[] {
  const out: StoryNodeValidationError[] = [];
  const base = `story:${key}`;

  if (node.id !== key) {
    pushError(out, base, `record key "${key}" !== node.id "${node.id}"`);
  }
  if (node.sceneId && !reg.sceneIds.has(node.sceneId)) {
    pushError(out, base, `unknown sceneId "${node.sceneId}"`);
  }

  validateStoryCondition(node.condition, base, reg, out);
  validateStoryEffects(node.effects, base, reg, out);

  for (let i = 0; i < (node.choices?.length ?? 0); i++) {
    const choice = node.choices![i];
    const cp = `${base}.choices[${i}]`;
    if (!resolveNodeRef(choice.next, reg)) {
      pushError(out, cp, `next "${choice.next}" not in STORY_NODES or DIALOGUE_NODES`);
    }
    validateStoryCondition(choice.condition, cp, reg, out);
    validateStoryEffects(choice.effects, cp, reg, out);
  }

  return out;
}

export function validateStoryNodeGraph(
  nodes: Record<string, StoryNode>,
  reg: StoryNodeValidationRegistry,
): StoryNodeValidationError[] {
  const errors: StoryNodeValidationError[] = [];
  for (const [key, node] of Object.entries(nodes)) {
    errors.push(...validateSingleStoryNode(key, node, reg));
  }
  return errors;
}

export function formatStoryNodeValidationErrors(
  errors: StoryNodeValidationError[],
): string[] {
  return errors.map((e) => `${e.path}: ${e.message}`);
}
