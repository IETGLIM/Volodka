/* ─── Volodka RPG – Player Core Slice ─── */
/* Vitals, skills, karma, energy, stress, flags, notifications, and rest. */

import type { StateCreator } from 'zustand';
import type { TrainablePlayerSkill } from '@/shared/types/game';
import type { PlayerState } from '@/shared/types/game';
import { clamp, createDefaultPlayerState, pushNotification, type GameNotification } from '../shared';
import type { GameStoreState } from '../types';
import { pickPlayerCoreCrossActions, readPlayerFromExploration } from '../crossSliceReads';
import { eventBus } from '@/engine/EventBus';
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
  removeActiveTTLFlags: (keys: string[]) => void;
  clearActiveTTLFlags: () => void;
  /** Advance to the next act. No-op if already at {@link MAX_STORY_ACT}. */
  advanceAct: () => void;
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

  visitNode: (id) =>
    set((state) => {
      if (hasVisitedNode(state.playerState.visitedNodes, id)) return state;
      return {
        playerState: {
          ...state.playerState,
          visitedNodes: [...state.playerState.visitedNodes, id],
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
    set((state) => ({
      playerState: {
        ...state.playerState,
        karma: clamp(state.playerState.karma + amount, 0, 100),
      },
      notifications: pushNotification(state.notifications, 'karma', `${amount > 0 ? '+' : ''}${amount} Карма`),
    }));

    if (Math.abs(amount) >= 5) {
      eventBus.emit('choice:made', { karmaChange: amount });
    }
  },

  addStress: (amount) =>
    set((state) => ({
      playerState: {
        ...state.playerState,
        stress: clamp(state.playerState.stress + amount, 0, 100),
      },
      notifications: amount !== 0
        ? pushNotification(state.notifications, 'stress', `${amount > 0 ? '+' : ''}${amount} Стресс`)
        : state.notifications,
    })),

  addEnergy: (amount) =>
    set((state) => ({
      playerState: {
        ...state.playerState,
        energy: clamp(state.playerState.energy + amount, 0, 100),
      },
      notifications: amount !== 0
        ? pushNotification(state.notifications, 'energy', `${amount > 0 ? '+' : ''}${amount} Энергия`)
        : state.notifications,
    })),

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

    set((state) => ({
      playerState: {
        ...state.playerState,
        energy: 100,
        stress: clamp(state.playerState.stress - 30, 0, 100),
      },
      notifications: pushNotification(state.notifications, 'energy', 'Отдых: Энергия +100, Стресс -30'),
    }));
  },

  autoRegenBetweenScenes: () =>
    set((state) => ({
      playerState: {
        ...state.playerState,
        energy: clamp(state.playerState.energy + 5, 0, 100),
        stress: clamp(state.playerState.stress - 3, 0, 100),
      },
    })),

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
