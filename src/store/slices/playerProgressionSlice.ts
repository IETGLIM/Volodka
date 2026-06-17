/* ─── Volodka RPG – Player Progression Slice ─── */
/* XP, leveling, skill tree, and perks. */

import type { StateCreator } from 'zustand';
import type { PerkEffect } from '@/data/perks';
import { applySkillDelta } from '../skillHelpers';
import { pushNotification } from '../shared';
import type { GameStoreState } from '../types';
import { getSkillTreeMap, getPerksMap } from '@/data/gameDataLoader';
import {
  resolveSkillUnlockEffects,
  warnUnmatchedSkillEffectParts,
} from '@/shared/skills/applySkillUnlockEffects';
import { queuePlayerXp } from '../playerXpBatch';

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
  addXp: (amount) => {
    queuePlayerXp(amount, set);
  },

  unlockSkillTreeNode: (skillId) =>
    set((state) => {
      const prog = state.playerState.progression;
      if (prog.skillPoints <= 0) return state;
      if (prog.unlockedSkills.includes(skillId)) return state;

      const nodeDef = getSkillTreeMap()[skillId];
      if (nodeDef) {
        const prereqsMet = nodeDef.requires.every((req) =>
          prog.unlockedSkills.includes(req),
        );
        if (!prereqsMet) return state;
      }

      const unlockEffects = resolveSkillUnlockEffects(skillId, nodeDef?.effect);
      warnUnmatchedSkillEffectParts(skillId, unlockEffects.unmatchedEffectParts);

      const newSkills = { ...state.playerState.skills };
      for (const delta of unlockEffects.statDeltas) {
        newSkills[delta.skill] = Math.max(0, newSkills[delta.skill] + delta.amount);
      }

      const newFlags = { ...state.playerState.flags };
      for (const flagKey of unlockEffects.passiveFlags) {
        newFlags[flagKey] = true;
      }
      for (const legacy of unlockEffects.legacyPercentFlags) {
        newFlags[legacy.key] = true;
      }

      const nodeName = nodeDef?.name ?? skillId;

      return {
        playerState: {
          ...state.playerState,
          skills: newSkills,
          flags: newFlags,
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
    const nodeDef = getSkillTreeMap()[nodeId];
    if (!nodeDef) return false;
    return nodeDef.requires.every((req) => prog.unlockedSkills.includes(req));
  },

  acquirePerk: (perkId) =>
    set((state) => {
      const prog = state.playerState.progression;
      if (prog.perkPoints <= 0) return state;
      if (prog.unlockedPerks.includes(perkId)) return state;

      const perkDef = getPerksMap()[perkId];
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
          applySkillDelta(
            newSkills,
            effect.skill,
            effect.value,
            `perk "${perkId}" skill_bonus`,
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

    const perkDef = getPerksMap()[perkId];
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
      const perkDef = getPerksMap()[perkId];
      if (perkDef) {
        allEffects.push(...perkDef.effects);
      }
    }
    return allEffects;
  },
});
