import type { Transition } from 'framer-motion';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { findNpcById } from '@/data/allNpcDefinitions';
import { resolveCanonicalNpcId } from '@/data/goldenPath';
import {
  QUEST_ACCEPT_DIALOG_LABELS,
  QUEST_TYPE_BADGE_COLORS,
} from '@/engine/quest/questAcceptDialogConstants';
import type {
  NPCDefinition,
  QuestDefinition,
  QuestDifficulty,
  QuestObjective,
  QuestType,
  StoryEffect,
} from '@/shared/types/game';

export type QuestAcceptContext = {
  questDef: QuestDefinition;
  resolvedNpcId: string | undefined;
  npcDef: NPCDefinition | null;
};

export function findQuestDefinition(questId: string | null): QuestDefinition | null {
  if (!questId) return null;
  return QUEST_DEFINITIONS.find((definition) => definition.id === questId) ?? null;
}

export function resolveQuestAcceptContext(
  questDef: QuestDefinition,
  npcId?: string,
): Pick<QuestAcceptContext, 'resolvedNpcId' | 'npcDef'> {
  const raw = npcId ?? questDef.questGiverNpcId ?? undefined;
  const resolvedNpcId = raw ? resolveCanonicalNpcId(raw) : undefined;
  const npcDef = resolvedNpcId ? findNpcById(resolvedNpcId) ?? null : null;
  return { resolvedNpcId, npcDef };
}

export function getQuestTypeLabel(questType: QuestType): string {
  return QUEST_ACCEPT_DIALOG_LABELS.questType[questType];
}

export function getQuestTypeBadgeColor(questType: QuestType): string {
  return QUEST_TYPE_BADGE_COLORS[questType];
}

export function getDifficultyDiamondCount(difficulty: QuestDifficulty | undefined): number {
  switch (difficulty) {
    case 'easy':
      return 1;
    case 'medium':
      return 2;
    case 'hard':
      return 3;
    default:
      return 2;
  }
}

export function isMainQuest(questDef: QuestDefinition): boolean {
  return questDef.questType === 'main';
}

export function hasPoemPowerBypass(objectives: readonly QuestObjective[]): boolean {
  return objectives.some((objective) => objective.poemPowerBypass);
}

export function getObjectivesWithPoemHints(objectives: readonly QuestObjective[]): QuestObjective[] {
  return objectives.filter((objective) => objective.poemPowerHint);
}

export function getObjectiveTypeLabel(objective: QuestObjective): string {
  return QUEST_ACCEPT_DIALOG_LABELS.objectiveType[objective.type];
}

export function getObjectiveIcon(objective: QuestObjective): string {
  switch (objective.type) {
    case 'npc_talked':
      return '💬';
    case 'location_visited':
      return '📍';
    case 'item_collected':
      return '📦';
    case 'poem_collected':
      return '📜';
    case 'flag_set':
      return '⚡';
    case 'minigame_completed':
      return '🎮';
    case 'custom':
      return '○';
    default: {
      const _exhaustive: never = objective.type;
      return _exhaustive;
    }
  }
}

export function buildObjectiveAriaLabel(objective: QuestObjective): string {
  return `${getObjectiveTypeLabel(objective)}: ${objective.description}`;
}

export function getRewardIcon(reward: StoryEffect): string {
  switch (reward.type) {
    case 'addSkill':
      return '🧠';
    case 'addKarma':
      return '⚖️';
    case 'addXp':
      return '✨';
    case 'addCredits':
      return '💰';
    case 'addItem':
      return '🎁';
    case 'setFlag':
      return '⚡';
    default:
      return '◆';
  }
}

export function buildRewardLabel(reward: StoryEffect): string {
  switch (reward.type) {
    case 'addSkill':
      return QUEST_ACCEPT_DIALOG_LABELS.reward.addSkill(reward.skill ?? 'навык', reward.value ?? 0);
    case 'addKarma':
      return QUEST_ACCEPT_DIALOG_LABELS.reward.addKarma(reward.value ?? 0);
    case 'addXp':
      return QUEST_ACCEPT_DIALOG_LABELS.reward.addXp(reward.value ?? 0);
    case 'addCredits':
      return QUEST_ACCEPT_DIALOG_LABELS.reward.addCredits(reward.value ?? 0);
    case 'addItem':
      return QUEST_ACCEPT_DIALOG_LABELS.reward.addItem(reward.itemId ?? 'неизвестно');
    case 'setFlag':
      return QUEST_ACCEPT_DIALOG_LABELS.reward.setFlag(reward.flag ?? 'неизвестно');
    default:
      return QUEST_ACCEPT_DIALOG_LABELS.reward.fallback(reward.type);
  }
}

export function buildRewardAriaLabel(reward: StoryEffect): string {
  return `Награда: ${buildRewardLabel(reward)}`;
}

export function getGiverFallbackLabel(questDef: QuestDefinition, hasNpcDef: boolean): string | null {
  if (hasNpcDef) return null;
  return questDef.questGiverNpcId
    ? QUEST_ACCEPT_DIALOG_LABELS.giverNotFound
    : QUEST_ACCEPT_DIALOG_LABELS.selfInitiated;
}

export function getOverlayMotion(reducedMotion: boolean): {
  initial: false | { opacity: number };
  animate: { opacity: number };
  exit: { opacity: number };
  transition: Transition;
} {
  if (reducedMotion) {
    return {
      initial: false,
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  };
}

export function getDialogMotion(reducedMotion: boolean): {
  initial: false | { x: number; opacity: number };
  animate: { x: number; opacity: number };
  exit: { x: number; opacity: number };
  transition: Transition;
} {
  if (reducedMotion) {
    return {
      initial: false,
      animate: { x: 0, opacity: 1 },
      exit: { x: 0, opacity: 0 },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 },
    transition: { duration: 0.5, ease: 'easeOut' },
  };
}

export function getObjectiveRowMotion(
  reducedMotion: boolean,
  index: number,
): {
  initial: false | { opacity: number; x: number };
  animate: { opacity: number; x: number };
  transition: Transition;
} {
  if (reducedMotion) {
    return {
      initial: false,
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    transition: { delay: 0.15 + index * 0.08 },
  };
}

export function isRelationDotFilled(relationValue: number, dotIndex: number): boolean {
  return relationValue >= dotIndex * 20;
}
