/* ─── Volodka RPG – Player Progression Slice ─── */
/* XP, leveling, skill tree, and perks. */

import type { StateCreator } from 'zustand';
import type { TrainablePlayerSkill } from '@/shared/types/game';
import type { PerkEffect } from '@/data/perks';
import { applyXpGain, pushNotification } from '../shared';
import type { GameStoreState } from '../types';
import { eventBus } from '@/engine/EventBus';
import { SKILL_TREE_MAP, SKILL_EFFECT_MAP } from '@/data/skillTree';
import { PERKS_MAP } from '@/data/perks';

/* ─── Slice types ─── */

export interface PlayerProgressionSliceActions {
  addXp: (amount: number) => void;
  unlockSkillTreeNode: (skillId: string) => void;
  canUnlockSkill: (nodeId: string) => boolean;
  /** Acquire a perk by ID (deducts a perk point) */
  acquirePerk: (perkId: string) => void;
  /** Check if the player can acquire a specific perk */
  canAcquirePerk: (perkId: string) => boolean;
  /** Get all active perk effects from acquired perks */
  getActivePerkEffects: () => PerkEffect[];
}

export type PlayerProgressionSlice = PlayerProgressionSliceActions;

/* ─── Slice creator ─── */

export const createPlayerProgressionSlice: StateCreator<
  GameStoreState,
  [],
  [],
  PlayerProgressionSlice
> = (set, get) => ({
  addXp: (amount) =>
    set((state) => {
      const result = applyXpGain(state.playerState.progression, amount);
      const { progression, prevLevel, levelsGained, perkPointsGained } = result;
      const newLevel = progression.level;

      const levelUpMessage = (() => {
        if (levelsGained <= 0) return '';
        const skillPart =
          levelsGained === 1
            ? '+1 очко навыка'
            : `+${levelsGained} очков навыка`;
        if (perkPointsGained === 0) {
          return `Уровень ${newLevel}! ${skillPart}`;
        }
        const perkPart =
          perkPointsGained === 1
            ? '+1 очко черты'
            : `+${perkPointsGained} очков черты`;
        return `Уровень ${newLevel}! ${skillPart} ${perkPart}!`;
      })();

      const notifications = levelsGained > 0
        ? pushNotification(state.notifications, 'skill', levelUpMessage)
        : state.notifications;

      if (levelsGained > 0) {
        queueMicrotask(() => {
          eventBus.emit('player:levelup', {
            newLevel,
            prevLevel,
            levelsGained,
            perkPointsGained,
            perkPointGained: perkPointsGained > 0,
          });
        });
      }

      return {
        playerState: {
          ...state.playerState,
          progression,
        },
        notifications,
      };
    }),

  unlockSkillTreeNode: (skillId) =>
    set((state) => {
      const prog = state.playerState.progression;
      if (prog.skillPoints <= 0) return state;
      if (prog.unlockedSkills.includes(skillId)) return state;

      const nodeDef = SKILL_TREE_MAP[skillId];
      if (nodeDef) {
        const prereqsMet = nodeDef.requires.every((req) =>
          prog.unlockedSkills.includes(req),
        );
        if (!prereqsMet) return state;
      }

      const effect = SKILL_EFFECT_MAP[skillId];
      const newSkills = { ...state.playerState.skills };
      if (effect) {
        newSkills[effect.skill] = Math.max(0, newSkills[effect.skill] + effect.value);
      }

      const nodeName = nodeDef?.name ?? skillId;

      return {
        playerState: {
          ...state.playerState,
          skills: newSkills,
          progression: {
            ...prog,
            skillPoints: prog.skillPoints - 1,
            unlockedSkills: [...prog.unlockedSkills, skillId],
          },
        },
        notifications: pushNotification(state.notifications, 'skill', `Навык разблокирован: ${nodeName}`),
      };
    }),

  canUnlockSkill: (nodeId) => {
    const state = get();
    const prog = state.playerState.progression;
    if (prog.skillPoints <= 0) return false;
    if (prog.unlockedSkills.includes(nodeId)) return false;
    const nodeDef = SKILL_TREE_MAP[nodeId];
    if (!nodeDef) return false;
    return nodeDef.requires.every((req) => prog.unlockedSkills.includes(req));
  },

  acquirePerk: (perkId) =>
    set((state) => {
      const prog = state.playerState.progression;
      if (prog.perkPoints <= 0) return state;
      if (prog.unlockedPerks.includes(perkId)) return state;

      const perkDef = PERKS_MAP[perkId];
      if (!perkDef) return state;

      if (prog.level < perkDef.minLevel) return state;

      const prereqsMet = perkDef.requiredPerks.every((req) =>
        prog.unlockedPerks.includes(req),
      );
      if (!prereqsMet) return state;

      if (perkDef.mutuallyExclusiveWith) {
        const hasExclusive = perkDef.mutuallyExclusiveWith.some((exId) =>
          prog.unlockedPerks.includes(exId),
        );
        if (hasExclusive) return state;
      }

      const newSkills = { ...state.playerState.skills };
      for (const effect of perkDef.effects) {
        if (effect.type === 'skill_bonus' && effect.skill) {
          newSkills[effect.skill as TrainablePlayerSkill] = Math.max(
            0,
            newSkills[effect.skill as TrainablePlayerSkill] + effect.value,
          );
        }
      }

      return {
        playerState: {
          ...state.playerState,
          skills: newSkills,
          progression: {
            ...prog,
            perkPoints: prog.perkPoints - 1,
            unlockedPerks: [...prog.unlockedPerks, perkId],
          },
        },
        notifications: pushNotification(
          state.notifications,
          'skill',
          `Черта получена: ${perkDef.name}`,
        ),
      };
    }),

  canAcquirePerk: (perkId) => {
    const state = get();
    const prog = state.playerState.progression;
    if (prog.perkPoints <= 0) return false;
    if (prog.unlockedPerks.includes(perkId)) return false;

    const perkDef = PERKS_MAP[perkId];
    if (!perkDef) return false;
    if (prog.level < perkDef.minLevel) return false;

    const prereqsMet = perkDef.requiredPerks.every((req) =>
      prog.unlockedPerks.includes(req),
    );
    if (!prereqsMet) return false;

    if (perkDef.mutuallyExclusiveWith) {
      const hasExclusive = perkDef.mutuallyExclusiveWith.some((exId) =>
        prog.unlockedPerks.includes(exId),
      );
      if (hasExclusive) return false;
    }

    return true;
  },

  getActivePerkEffects: () => {
    const state = get();
    const prog = state.playerState.progression;
    const allEffects: PerkEffect[] = [];
    for (const perkId of prog.unlockedPerks) {
      const perkDef = PERKS_MAP[perkId];
      if (perkDef) {
        allEffects.push(...perkDef.effects);
      }
    }
    return allEffects;
  },
});
