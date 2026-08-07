/* ─────────────────────────────────────────────────────────────────────────────
   Volodka RPG – QuestState + QuestDefinition → QuestData adapter

   Bridges the runtime quest state shape (QuestState from the store: a sparse
   Record<string, boolean> of objective completion + status enum) and the
   static quest definition (QuestDefinition: title, description, questType,
   difficulty, objectives[], rewards[], rewardItems, timeLimitHours,
   requiresQuests, spineOrder) into the rich QuestData shape that the
   QuestObjectiveCard HUD component expects.

   This adapter is PURE: no store mutations, no side effects. All derived
   data is computed synchronously from the quest definition + quest state
   snapshot. The accompanying `useActiveQuestCardData()` hook subscribes to
   the quests slice via `useActiveQuests()` and re-derives the card data
   whenever the underlying state reference changes (memoized).

   @module questObjectiveCardAdapter
   @see QuestObjectiveCard
────────────────────────────────────────────────────────────────────────────── */

import { useMemo } from 'react';
import type { QuestState } from '@/shared/types/game';
import type { QuestDefinition } from '@/shared/types/definitions/quest';
import type { StoryEffect } from '@/shared/types/common/effects';
import { getQuestDefinitions } from '@/data/gameDataLoader';
import { getQuestProgress, useActiveQuests } from '@/store/questStore';
import type {
  QuestData,
  QuestDifficulty as CardQuestDifficulty,
  QuestObjective as CardQuestObjective,
  QuestReward,
  QuestStatus as CardQuestStatus,
} from './QuestObjectiveCard';

/* ─── Internal mappers ─── */

/**
 * Map the runtime QuestState.status enum to the QuestData.status enum
 * expected by QuestObjectiveCard. QuestState has 'inactive' | 'active' |
 * 'completed' | 'failed' — QuestData has 'available' | 'active' |
 * 'completed' | 'failed' | 'abandoned'. The shared values map directly;
 * 'inactive' is surfaced as 'available' (the closest semantic match —
 * the quest exists in the world but is not yet underway).
 */
function mapStatus(status: QuestState['status']): CardQuestStatus {
  switch (status) {
    case 'active':
      return 'active';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'inactive':
    default:
      return 'available';
  }
}

/**
 * Map QuestDefinition.difficulty ('easy' | 'medium' | 'hard') to the
 * QuestData.difficulty spectrum ('trivial' | 'easy' | 'normal' | 'hard' |
 * 'nightmare' | 'impossible'). 'medium' is the closest semantic match for
 * 'normal'. Defaults to 'normal' when difficulty is undefined.
 */
function mapDifficulty(difficulty: QuestDefinition['difficulty']): CardQuestDifficulty {
  switch (difficulty) {
    case 'easy':
      return 'easy';
    case 'medium':
      return 'normal';
    case 'hard':
      return 'hard';
    default:
      return 'normal';
  }
}

/**
 * Derive QuestReward[] from a quest's StoryEffect[] rewards and its
 * rewardItems list. Maps:
 *   - addXp        → xp reward (value = effect.value)
 *   - addCredits   → currency reward (value = effect.value)
 *   - addItem      → item reward (value/name = itemId, rarity = 'common')
 *   - addSkill     → skill_point reward (value = effect.value, name = skill)
 *   - addKarma     → reputation reward (value = effect.value)
 *   - all other StoryEffect types are skipped (setFlag, transitionScene,
 *     triggerQuest, etc. — these are world-state mutations, not player
 *     rewards, so they don't belong on the reward card)
 * rewardItems are mapped to 'item' rewards with the itemId as name and a
 * 'common' rarity fallback. If no rewards are derivable, a default XP
 * reward of 50 is emitted so the card never renders an empty reward
 * section (matches the QuestObjectiveCard design intent).
 */
function mapRewards(
  rewards: readonly StoryEffect[] | undefined,
  rewardItems: readonly { readonly itemId: string; readonly quantity: number }[] | undefined,
): QuestReward[] {
  const out: QuestReward[] = [];

  if (rewards) {
    for (const effect of rewards) {
      switch (effect.type) {
        case 'addXp':
          out.push({
            type: 'xp',
            value: effect.value ?? 0,
            name: 'Опыт',
          });
          break;
        case 'addCredits':
          out.push({
            type: 'currency',
            value: effect.value ?? 0,
            name: 'Кредиты',
          });
          break;
        case 'addItem':
          if (effect.itemId) {
            out.push({
              type: 'item',
              value: effect.itemId,
              name: effect.itemId,
              rarity: 'common',
            });
          }
          break;
        case 'addSkill':
          out.push({
            type: 'skill_point',
            value: effect.value ?? 1,
            name: effect.skill ?? 'Навык',
          });
          break;
        case 'addKarma':
          out.push({
            type: 'reputation',
            value: effect.value ?? 0,
            name: 'Карма',
          });
          break;
        default:
          // Non-reward StoryEffect types are intentionally skipped.
          break;
      }
    }
  }

  if (rewardItems) {
    for (const item of rewardItems) {
      out.push({
        type: 'item',
        value: item.itemId,
        name: item.itemId,
        rarity: 'common',
      });
    }
  }

  // Fallback per adapter spec — never return an empty rewards array.
  if (out.length === 0) {
    out.push({ type: 'xp', value: 50, name: 'Опыт' });
  }

  return out;
}

/* ─── Public adapter ─── */

/**
 * Adapt a runtime QuestState into a QuestData payload suitable for the
 * QuestObjectiveCard component. Looks up the matching QuestDefinition
 * (by id) from the loaded quest definitions module. Returns null when
 * the definition is missing — the caller is expected to skip rendering
 * the card in that case (treated as an orphan / data-load mismatch).
 *
 * Pure: no side effects, no store mutations. Safe to call inside a
 * useMemo with the QuestState as a dependency.
 */
export function adaptQuestToCardData(questState: QuestState): QuestData | null {
  const def = getQuestDefinitions().find((d) => d.id === questState.questId);
  if (!def) return null;

  const objectives: CardQuestObjective[] = def.objectives.map((objDef) => {
    const isCompleted = questState.objectives[objDef.id] === true;
    return {
      id: objDef.id,
      description: objDef.description,
      // Binary objectives (Record<string, boolean>) → 0 or 1 of 1 target.
      current: isCompleted ? 1 : 0,
      target: 1,
      isCompleted,
      isHidden: false,
      isOptional: false,
    };
  });

  const progress = getQuestProgress(questState.questId);
  const rewards = mapRewards(def.rewards, def.rewardItems);

  // Convert hour-based time limit to ms for the card's countdown math.
  const timeLimit = def.timeLimitHours
    ? def.timeLimitHours * 3600 * 1000
    : undefined;

  const data: QuestData = {
    id: questState.questId,
    title: def.title,
    description: def.description,
    questType: def.questType,
    status: mapStatus(questState.status),
    difficulty: mapDifficulty(def.difficulty),
    objectives,
    progress,
    rewards,
    isTracked: false,
    isActive: questState.status === 'active',
    timeLimit,
    // timeRemaining intentionally undefined — computed elsewhere if needed
    // (would require wall-clock ticking which the HUD does not drive).
    // minLevel / recommendedLevel intentionally undefined — QuestDefinition
    // does not carry level-gating data.
    prerequisites: def.requiresQuests,
  };

  return data;
}

/* ─── React hook for ExplorationHUD ─── */

/**
 * Subscribe to the active-quests slice and return the QuestData for the
 * quest the HUD should surface in the QuestObjectiveCard. Picks the
 * active quest with the lowest QuestDefinition.spineOrder (the main
 * spine takes priority over side/daily quests); falls back to the first
 * active quest when spineOrder is undefined or no definitions match.
 *
 * Returns null when:
 *   - there are no active quests, OR
 *   - the picked quest's definition is missing (orphan state)
 *
 * Memoized on the activeQuests array reference — `useActiveQuests()`
 * returns a fresh array only when the underlying quests slice changes,
 * so this hook does not re-render thrash.
 */
export function useActiveQuestCardData(): QuestData | null {
  const activeQuests = useActiveQuests();

  return useMemo(() => {
    if (activeQuests.length === 0) return null;

    // Resolve definitions once per memo pass — getQuestDefinitions() is a
    // stable reference, but the .find() inside the sort comparator would
    // otherwise be O(n²) on lookups. Cache the spineOrder per quest.
    const definitions = getQuestDefinitions();
    const spineOrderById = new Map<string, number>();
    for (const def of definitions) {
      if (def.spineOrder !== undefined) {
        spineOrderById.set(def.id, def.spineOrder);
      }
    }

    const sorted = [...activeQuests].sort((a, b) => {
      const aOrder = spineOrderById.get(a.questId) ?? Number.MAX_SAFE_INTEGER;
      const bOrder = spineOrderById.get(b.questId) ?? Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder;
    });

    const target = sorted[0];
    if (!target) return null;
    return adaptQuestToCardData(target);
  }, [activeQuests]);
}
