/* ─── Volodka RPG – Player Core Slice ─── */
/* Vitals, skills, karma, energy, stress, flags, notifications, and rest. */

import type { StateCreator } from 'zustand';
import type { TrainablePlayerSkill } from '@/shared/types/game';
import type { PlayerState } from '@/shared/types/game';
import { clamp, createDefaultPlayerState, pushNotification, type GameNotification } from '../shared';
import type { GameStoreState } from '../types';
import { pickPlayerCoreCrossActions, readPlayerFromExploration } from '../crossSliceReads';
import { scheduleChoiceMade } from '../storeEffects';
import {
  resolveEnergyMaxFlatBonus,
  resolveEnergyRegenMultiplier,
  resolveKarmaGainMultiplier,
  resolveStressResistFraction,
} from '@/shared/perks/perkModifiers';
import {
  createEmptyActiveTTLFlagMap,
  type ActiveTTLFlag,
  type ActiveTTLFlagMap,
} from '../activeTTLFlags';
import { MAX_STORY_ACT } from '@/data/constants';
import { hasVisitedNode } from '../visitedNodesIndex';
import {
  createRewardBatchDraft,
  createRewardBatchSideEffects,
  finalizeRewardBatch,
  flushRewardBatchSideEffects,
  type RewardBatchDraft,
  type RewardBatchSideEffects,
} from '../rewardBatchHelpers';

/* ─── Slice types ─── */

export interface PlayerCoreSliceState {
  playerState: PlayerState;
  notifications: GameNotification[];
  /** TTL-based active flags keyed by flag key (survives save/load) */
  activeTTLFlags: ActiveTTLFlagMap;
  /** Last successfully activated poem — for rhythm synergy combos (session). */
  lastUsedPoemId: string | null;
  lastUsedPoemTimestamp: number | null;
  /** Poem awaiting PoemReadingCutscene completion (session). */
  pendingPoemReadingId: string | null;
}

export interface PlayerCoreSliceActions {
  visitNode: (id: string) => void;
  addSkill: (skill: TrainablePlayerSkill, amount: number) => void;
  addKarma: (amount: number) => void;
  addStress: (amount: number) => void;
  addEnergy: (amount: number) => void;
  setFlag: (key: string, value: boolean) => void;
  pushNotification: (type: GameNotification['type'], text: string) => void;
  dismissNotification: (id: string) => void;
  restAtHome: () => void;
  autoRegenBetweenScenes: () => void;
  upsertActiveTTLFlag: (flag: ActiveTTLFlag) => void;
  upsertActiveTTLFlags: (flags: ActiveTTLFlag[]) => void;
  /** Set a world-hint flag and its TTL entry in one state update. */
  upsertHintFlagWithTTL: (flag: ActiveTTLFlag) => void;
  removeActiveTTLFlags: (keys: string[]) => void;
  clearActiveTTLFlags: () => void;
  recordLastUsedPoem: (poemId: string, timestamp: number) => void;
  setPendingPoemReadingId: (poemId: string | null) => void;
  /** Advance to the next act. No-op if already at {@link MAX_STORY_ACT}. */
  advanceAct: () => void;
  /** Increment combat encounter counter for RNG derivation. */
  bumpCombatEncounterSeq: () => void;
  /** Override master RNG seed (dev / test reproducibility). */
  setRngSeed: (seed: number) => void;
  /** Batched player + notification updates (single set pass) for cross-slice reward flows. */
  applyPlayerRewardBatch: (
    apply: (draft: RewardBatchDraft, sideEffects: RewardBatchSideEffects) => void,
  ) => RewardBatchSideEffects;
}

export type PlayerCoreSlice = PlayerCoreSliceState & PlayerCoreSliceActions;

/* ─── Slice creator ─── */

export const createPlayerCoreSlice: StateCreator<
  GameStoreState,
  [],
  [],
  PlayerCoreSlice
> = (set, get) => ({
  playerState: createDefaultPlayerState(),
  notifications: [],
  activeTTLFlags: createEmptyActiveTTLFlagMap(),
  lastUsedPoemId: null,
  lastUsedPoemTimestamp: null,
  pendingPoemReadingId: null,

  visitNode: (id) =>
    set((state) => {
      if (hasVisitedNode(state.playerState.visitedNodes, id)) return state;
      return {
        playerState: {
          ...state.playerState,
          visitedNodes: [...state.playerState.visitedNodes, id],
          visitedNodeTimestamps: {
            ...state.playerState.visitedNodeTimestamps,
            [id]: Date.now(),
          },
        },
      };
    }),

  addSkill: (skill, amount) =>
    set((state) => {
      const newSkillValue = Math.max(0, state.playerState.skills[skill] + amount);
      return {
        playerState: {
          ...state.playerState,
          skills: {
            ...state.playerState.skills,
            [skill]: newSkillValue,
          },
        },
        notifications: amount > 0
          ? pushNotification(state.notifications, 'skill', `Способность разблокирована: ${skill} +${amount}`)
          : state.notifications,
      };
    }),

  addKarma: (amount) => {
    // Perk karma_gain multiplier (authority, poetic_soul, poem_mastery, guild_diplomat)
    // amplifies positive karma only — dark path choices are not punished harder.
    const unlockedPerks = get().playerState?.progression?.unlockedPerks ?? [];
    const effectiveAmount = amount > 0
      ? Math.round(amount * resolveKarmaGainMultiplier(unlockedPerks))
      : amount;

    set((state) => ({
      playerState: {
        ...state.playerState,
        karma: clamp(state.playerState.karma + effectiveAmount, 0, 100),
      },
      notifications: pushNotification(state.notifications, 'karma', `${effectiveAmount > 0 ? '+' : ''}${effectiveAmount} Карма`),
    }));

    if (Math.abs(effectiveAmount) >= 5) {
      scheduleChoiceMade({ karmaChange: effectiveAmount });
    }
  },

  addStress: (amount) => {
    // Perk stress_resist fraction (stress_resistance, iron_stomach, iron_will,
    // stress_mastery) reduces incoming stress only — relief passes through.
    const unlockedPerks = get().playerState?.progression?.unlockedPerks ?? [];
    const effectiveAmount = amount > 0
      ? Math.round(amount * (1 - resolveStressResistFraction(unlockedPerks)))
      : amount;

    set((state) => ({
      playerState: {
        ...state.playerState,
        stress: clamp(state.playerState.stress + effectiveAmount, 0, 100),
      },
      notifications: effectiveAmount !== 0
        ? pushNotification(state.notifications, 'stress', `${effectiveAmount > 0 ? '+' : ''}${effectiveAmount} Стресс`)
        : state.notifications,
    }));
  },

  addEnergy: (amount) => {
    // Perk energy_max flat bonus (night_watch at night +10, factory_rat +15)
    // raises the clamp ceiling above 100.
    const { timeOfDay } = readPlayerFromExploration();
    const unlockedPerks = get().playerState?.progression?.unlockedPerks ?? [];
    const maxBonus = resolveEnergyMaxFlatBonus(unlockedPerks, { timeOfDay });
    const ceiling = 100 + maxBonus;

    set((state) => ({
      playerState: {
        ...state.playerState,
        energy: clamp(state.playerState.energy + amount, 0, ceiling),
      },
      notifications: amount !== 0
        ? pushNotification(state.notifications, 'energy', `${amount > 0 ? '+' : ''}${amount} Энергия`)
        : state.notifications,
    }));
  },

  setFlag: (key, value) =>
    set((state) => ({
      playerState: {
        ...state.playerState,
        flags: { ...state.playerState.flags, [key]: value },
      },
    })),

  pushNotification: (type, text) =>
    set((state) => ({
      notifications: pushNotification(state.notifications, type, text),
    })),

  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  restAtHome: () => {
    const { currentSceneId } = readPlayerFromExploration();
    const { advanceTime } = pickPlayerCoreCrossActions();

    if (currentSceneId !== 'volodka_room' && currentSceneId !== 'home_evening') return;

    advanceTime(8);

    // Re-read timeOfDay AFTER advanceTime so perk ceiling (night_watch) uses the new time.
    const { timeOfDay } = readPlayerFromExploration();
    // Rest fills energy to the perk-adjusted ceiling (night_watch/factory_rat).
    const unlockedPerks = get().playerState?.progression?.unlockedPerks ?? [];
    const maxBonus = resolveEnergyMaxFlatBonus(unlockedPerks, { timeOfDay });
    const ceiling = 100 + maxBonus;

    set((state) => ({
      playerState: {
        ...state.playerState,
        energy: ceiling,
        stress: clamp(state.playerState.stress - 30, 0, 100),
      },
      notifications: pushNotification(state.notifications, 'energy', 'Отдых: Энергия восстановлена, Стресс -30'),
    }));
  },

  autoRegenBetweenScenes: () => {
    const { timeOfDay } = readPlayerFromExploration();
    const perks = get().playerState?.progression?.unlockedPerks ?? [];
    // coffee_master / fast_metabolism each add +0.5 to regen.
    const regenMult = resolveEnergyRegenMultiplier(perks);
    const maxBonus = resolveEnergyMaxFlatBonus(perks, { timeOfDay });
    const ceiling = 100 + maxBonus;
    const regenAmount = Math.round(5 * regenMult);

    set((state) => ({
      playerState: {
        ...state.playerState,
        energy: clamp(state.playerState.energy + regenAmount, 0, ceiling),
        stress: clamp(state.playerState.stress - 3, 0, 100),
      },
    }));
  },

  upsertActiveTTLFlag: (flag) =>
    set((state) => ({
      activeTTLFlags: { ...state.activeTTLFlags, [flag.key]: flag },
    })),

  upsertActiveTTLFlags: (flags) =>
    set((state) => {
      if (flags.length === 0) return state;
      const activeTTLFlags = { ...state.activeTTLFlags };
      for (const flag of flags) {
        activeTTLFlags[flag.key] = flag;
      }
      return { activeTTLFlags };
    }),

  upsertHintFlagWithTTL: (flag) =>
    set((state) => ({
      playerState: {
        ...state.playerState,
        flags: { ...state.playerState.flags, [flag.key]: true },
      },
      activeTTLFlags: { ...state.activeTTLFlags, [flag.key]: flag },
    })),

  removeActiveTTLFlags: (keys) =>
    set((state) => {
      if (keys.length === 0) return state;
      const activeTTLFlags = { ...state.activeTTLFlags };
      for (const key of keys) {
        delete activeTTLFlags[key];
      }
      return { activeTTLFlags };
    }),

  clearActiveTTLFlags: () => set({ activeTTLFlags: createEmptyActiveTTLFlagMap() }),

  recordLastUsedPoem: (poemId, timestamp) =>
    set({ lastUsedPoemId: poemId, lastUsedPoemTimestamp: timestamp }),

  setPendingPoemReadingId: (poemId) => set({ pendingPoemReadingId: poemId }),

  advanceAct: () =>
    set((state) => {
      const currentAct = state.playerState.progression.currentAct;
      if (currentAct >= MAX_STORY_ACT) return state;
      return {
        playerState: {
          ...state.playerState,
          progression: {
            ...state.playerState.progression,
            currentAct: currentAct + 1,
          },
        },
        notifications: pushNotification(state.notifications, 'quest', `Акт ${currentAct + 1} начинается!`),
      };
    }),

  bumpCombatEncounterSeq: () =>
    set((state) => ({
      playerState: {
        ...state.playerState,
        combatEncounterSeq: state.playerState.combatEncounterSeq + 1,
      },
    })),

  setRngSeed: (seed) =>
    set((state) => ({
      playerState: {
        ...state.playerState,
        rngSeed: seed >>> 0,
      },
    })),

  applyPlayerRewardBatch: (apply) => {
    const sideEffects = createRewardBatchSideEffects();
    set((state) => {
      const draft = createRewardBatchDraft(state.playerState, state.notifications);
      apply(draft, sideEffects);
      finalizeRewardBatch(draft, sideEffects);
      return {
        playerState: draft.playerState,
        notifications: draft.notifications,
      };
    });
    flushRewardBatchSideEffects(sideEffects);
    return sideEffects;
  },
});
