/* ─── Volodka RPG – World Slice ─── */
/* Quests, collected poems, poem powers, NPC relationships, and achievements. */

import type { StateCreator } from 'zustand';
import type {
  QuestState,
  NPCRelation,
  AcceptedDailyMission,
  TrainablePlayerSkill,
} from '@/shared/types/game';
import { getPoemById, getQuestDefinitions, getAchievementMap, getDailyMissionById, getTotalAchievements } from '@/data/gameDataLoader';
import { eventBus } from '@/engine/EventBus';
import { clamp, pushNotification, type GameNotification, type PoemPowerState } from '../shared';
import { applyFairmathRelation } from '@/shared/fairmath';
import type { GameStoreState } from '../types';
import { readWorldFromExploration, readWorldFromPlayer } from '../crossSliceReads';
import {
  batchAddCredits,
  batchAddKarma,
  batchAddSkill,
  batchAddXp,
  batchSetFlag,
  createRewardBatchDraft,
  createRewardBatchSideEffects,
  flushRewardBatchSideEffects,
} from '../rewardBatchHelpers';

/* ─── Slice types ─── */

export interface UnlockedAchievement {
  id: string;
  unlockedAt: number;
}

export interface WorldSliceState {
  quests: QuestState[];
  collectedPoems: string[];
  npcRelations: NPCRelation[];
  poemPowers: Record<string, PoemPowerState>;
  /** Achievement IDs that have been unlocked, with timestamps */
  unlockedAchievements: UnlockedAchievement[];
  /** Accepted daily/weekly missions with progress tracking */
  acceptedDailyMissions: AcceptedDailyMission[];
  /** Timestamp of last daily reset check */
  lastDailyReset: number;
  /** NPC affinity scores: npcId → affinity (-100 to 100) */
  npcAffinity: Record<string, number>;
  /** Persisted achievement tracking data (survives page refresh) */
  achievementProgress: {
    visitedScenes: string[];
    combatVictories: number;
    consecutiveVictories: number;
    maxComboAchieved: number;
    hasCriticalHit: boolean;
    defeatedEnemyTypes: string[];
    nightTimeHours: number;
    poemPowerUsedInCombat: boolean;
  };
}

export interface WorldSliceActions {
  activateQuest: (questId: string) => void;
  completeQuestObjective: (questId: string, objectiveId: string) => void;
  completeQuest: (questId: string) => void;
  failQuest: (questId: string) => void;
  collectPoem: (poemId: string) => void;
  setNpcRelation: (npcId: string, delta: number) => void;
  activatePoemPower: (poemId: string) => boolean;
  getAvailablePowers: () => string[];
  /** Unlock an achievement by ID. Returns true if newly unlocked. */
  unlockAchievement: (achievementId: string) => boolean;
  /** Check if an achievement is unlocked */
  isAchievementUnlocked: (achievementId: string) => boolean;
  /** Get all unlocked achievement IDs */
  getUnlockedAchievementIds: () => string[];
  /** Accept a daily mission */
  acceptDailyMission: (missionId: string) => void;
  /** Abandon an accepted daily mission */
  abandonDailyMission: (missionId: string) => void;
  /** Update progress on a daily mission objective */
  updateDailyMissionProgress: (missionId: string, objectiveId: string, delta: number) => void;
  /** Claim the reward for a completed daily mission */
  claimDailyMissionReward: (missionId: string) => void;
  /** Check if missions should reset based on time */
  checkDailyMissionResets: () => void;
  /** Adjust NPC affinity by a delta. Clamps to -100..100. Creates entry if needed. */
  adjustNpcAffinity: (npcId: string, delta: number) => void;
  /** Get NPC affinity score. Returns 0 if no entry exists. */
  getNpcAffinity: (npcId: string) => number;
  /** Track a scene visit for achievement progress */
  trackSceneVisit: (sceneId: string) => void;
  /** Track a combat victory for achievement progress */
  trackCombatVictory: (enemyType: string, combo: number) => void;
  /** Track a critical hit for achievement progress */
  trackCriticalHit: () => void;
  /** Track a night-time hour for achievement progress */
  trackNightHour: () => void;
  /** Track poem power used in combat for achievement progress */
  trackPoemPowerInCombat: () => void;
  /** Reset combat consecutive victories (on defeat) */
  resetConsecutiveVictories: () => void;
  /** Update max combo if the new value is higher (does not increment victories) */
  trackMaxCombo: (combo: number) => void;
}

export type WorldSlice = WorldSliceState & WorldSliceActions;

/* ─── Slice creator ─── */
export const createWorldSlice: StateCreator<
  GameStoreState,
  [],
  [],
  WorldSlice
> = (set, get) => ({
  /* ── Initial state ── */
  quests: [],
  collectedPoems: [],
  npcRelations: [],
  poemPowers: {},
  unlockedAchievements: [],
  acceptedDailyMissions: [],
  lastDailyReset: 0,
  npcAffinity: {},
  achievementProgress: {
    visitedScenes: [],
    combatVictories: 0,
    consecutiveVictories: 0,
    maxComboAchieved: 0,
    hasCriticalHit: false,
    defeatedEnemyTypes: [],
    nightTimeHours: 0,
    poemPowerUsedInCombat: false,
  },

  /* ── Actions ── */

  activateQuest: (questId) =>
    set((state) => {
      const existing = state.quests.find((q) => q.questId === questId);
      if (existing && existing.status !== 'inactive') return state;

      const definition = getQuestDefinitions().find((d) => d.id === questId);
      if (!definition) return state;

      const objectives: Record<string, boolean> = {};
      for (const obj of definition.objectives) {
        objectives[obj.id] = false;
      }

      const quests = state.quests.filter((q) => q.questId !== questId);
      const { timeOfDay } = readWorldFromExploration(get());
      quests.push({ questId, status: 'active', objectives, startedAtTime: timeOfDay });

      eventBus.emit('quest:accepted', { questId, questTitle: definition.title });

      const questTitle = definition.title;
      const { notifications: currentNotifications } = readWorldFromPlayer(get());
      return {
        quests,
        notifications: pushNotification(currentNotifications, 'quest', `Новое задание: ${questTitle}`),
      };
    }),

  completeQuestObjective: (questId, objectiveId) =>
    set((state) => {
      const quests = state.quests.map((q) => {
        if (q.questId !== questId) return q;
        if (q.status !== 'active') return q;
        if (q.objectives[objectiveId] === true) return q;

        return {
          ...q,
          objectives: { ...q.objectives, [objectiveId]: true },
        };
      });

      eventBus.emit('quest:objective_updated', { questId, objectiveId });

      return { quests };
    }),

  completeQuest: (questId) =>
    set((state) => {
      const quests = state.quests.map((q) => {
        if (q.questId !== questId) return q;
        return {
          ...q,
          status: 'completed' as const,
          objectives: Object.fromEntries(
            Object.keys(q.objectives).map((k) => [k, true]),
          ),
        };
      });

      const questDef = getQuestDefinitions().find((d) => d.id === questId);

      eventBus.emit('quest:completed', { questId, npcId: questDef?.questGiverNpcId });
      const questTitle = questDef?.title ?? questId;
      const { notifications: currentNotifications } = readWorldFromPlayer(get());
      return {
        quests,
        notifications: pushNotification(currentNotifications, 'quest', `Задание выполнено: ${questTitle}`),
      };
    }),

  failQuest: (questId) =>
    set((state) => {
      const quests = state.quests.map((q) => {
        if (q.questId !== questId) return q;
        if (q.status !== 'active') return q;
        return {
          ...q,
          status: 'failed' as const,
        };
      });

      return { quests };
    }),

  collectPoem: (poemId) =>
    set((state) => {
      if (state.collectedPoems.includes(poemId)) return state;
      const poem = getPoemById(poemId);
      if (!poem) return state;
      const poemTitle = poem.title;
      try { eventBus.emit('poem:collected', { poemId }); } catch { /* ignore */ }
      const { notifications: currentNotifications } = readWorldFromPlayer(get());
      return {
        collectedPoems: [...state.collectedPoems, poemId],
        notifications: pushNotification(currentNotifications, 'poem', `Стих собран: ${poemTitle}`),
      };
    }),

  setNpcRelation: (npcId, delta) =>
    set((state) => {
      const relations = [...state.npcRelations];
      const idx = relations.findIndex((r) => r.npcId === npcId);

      if (idx >= 0) {
        const updated = { ...relations[idx] };
        updated.value = clamp(applyFairmathRelation(updated.value, delta), 0, 100);
        relations[idx] = updated;
      } else {
        relations.push({
          npcId,
          value: clamp(applyFairmathRelation(50, delta), 0, 100), // Start at neutral 50
        });
      }

      return { npcRelations: relations };
    }),

  activatePoemPower: (poemId) => {
    const state = get();
    if (!state.collectedPoems.includes(poemId)) return false;

    const existing = state.poemPowers[poemId];
    const cooldownMs = 60000;
    const now = Date.now();

    if (existing) {
      const elapsed = now - existing.lastUsed;
      if (elapsed < existing.cooldownMs) return false;
    }

    set({
      poemPowers: {
        ...state.poemPowers,
        [poemId]: { lastUsed: now, cooldownMs },
      },
    });

    return true;
  },

  getAvailablePowers: () => {
    const state = get();
    const now = Date.now();
    return state.collectedPoems.filter((poemId) => {
      const ps = state.poemPowers[poemId];
      if (!ps) return true;
      return now - ps.lastUsed >= ps.cooldownMs;
    });
  },

  unlockAchievement: (achievementId) => {
    const state = get();
    // Already unlocked?
    if (state.unlockedAchievements.some((a) => a.id === achievementId)) return false;

    const def = getAchievementMap()[achievementId];
    if (!def) return false;

    const timestamp = Date.now();
    const sideEffects = createRewardBatchSideEffects();

    set((state) => {
      const draft = createRewardBatchDraft(state.playerState, state.notifications);

      for (const reward of def.rewards) {
        switch (reward.type) {
          case 'xp':
            if (reward.value) batchAddXp(draft, sideEffects, reward.value);
            break;
          case 'karma':
            if (reward.value) batchAddKarma(draft, sideEffects, reward.value);
            break;
          case 'skill':
            if (reward.skill && reward.value) {
              batchAddSkill(draft, reward.skill as TrainablePlayerSkill, reward.value);
            }
            break;
          case 'credits':
            if (reward.value) batchAddCredits(draft, reward.value);
            break;
          case 'flag':
            if (reward.flag) batchSetFlag(draft, reward.flag, reward.flagValue ?? true);
            break;
        }
      }

      return {
        unlockedAchievements: [...state.unlockedAchievements, { id: achievementId, unlockedAt: timestamp }],
        playerState: draft.playerState,
        notifications: draft.notifications,
      };
    });

    // Emit achievement events for UI
    eventBus.emit('achievement:unlocked', {
      achievementId,
      title: def.title,
      description: def.description,
      icon: def.icon,
      category: def.category,
    });

    eventBus.emit('fx:achievement', {
      title: def.title,
      description: def.description,
      icon: def.icon,
    });

    flushRewardBatchSideEffects(sideEffects);

    // Check for "all achievements" meta-achievement
    const newUnlockedCount = state.unlockedAchievements.length + 1;
    if (achievementId !== 'hidden_all_achievements' && newUnlockedCount >= getTotalAchievements() - 1) {
      // -1 because meta-achievement itself hasn't been counted yet
      const store = get();
      if (!store.unlockedAchievements.some((a) => a.id === 'hidden_all_achievements')) {
        // Defer to avoid recursive set() calls
        setTimeout(() => {
          get().unlockAchievement('hidden_all_achievements');
        }, 100);
      }
    }

    return true;
  },

  isAchievementUnlocked: (achievementId) => {
    return get().unlockedAchievements.some((a) => a.id === achievementId);
  },

  getUnlockedAchievementIds: () => {
    return get().unlockedAchievements.map((a) => a.id);
  },

  /* ── Daily Mission Actions ── */

  acceptDailyMission: (missionId) =>
    set((state) => {
      // Already accepted?
      if (state.acceptedDailyMissions.some((m) => m.missionId === missionId)) return state;
      // Max 3 active daily missions
      const activeCount = state.acceptedDailyMissions.filter((m) => !m.completed && !m.claimed).length;
      if (activeCount >= 3) return state;

      const newMission: AcceptedDailyMission = {
        missionId,
        acceptedAt: Date.now(),
        progress: {},
        completed: false,
        claimed: false,
      };

      const { notifications: currentNotifications } = readWorldFromPlayer(get());
      return {
        acceptedDailyMissions: [...state.acceptedDailyMissions, newMission],
        notifications: pushNotification(currentNotifications, 'quest', `Ежедневное задание принято`),
      };
    }),

  abandonDailyMission: (missionId) =>
    set((state) => {
      const mission = state.acceptedDailyMissions.find((m) => m.missionId === missionId);
      if (!mission || mission.claimed) return state;

      return {
        acceptedDailyMissions: state.acceptedDailyMissions.filter((m) => m.missionId !== missionId),
      };
    }),

  updateDailyMissionProgress: (missionId, objectiveId, delta) =>
    set((state) => {
      const missionDef = getDailyMissionById(missionId);
      if (!missionDef) return state;

      const missions = state.acceptedDailyMissions.map((m) => {
        if (m.missionId !== missionId || m.completed || m.claimed) return m;

        const currentProgress = m.progress[objectiveId] ?? 0;
        const objectiveDef = missionDef.objectives.find((o) => o.id === objectiveId);
        const target = objectiveDef?.target ?? 1;
        const newProgress = Math.min(currentProgress + delta, target);

        const updatedProgress = { ...m.progress, [objectiveId]: newProgress };

        // Check if all objectives are complete
        const allComplete = missionDef.objectives.every(
          (o) => (updatedProgress[o.id] ?? 0) >= o.target,
        );

        return {
          ...m,
          progress: updatedProgress,
          completed: allComplete,
        };
      });

      // Check for newly completed missions
      const newlyCompleted = missions.find(
        (m) => m.missionId === missionId && m.completed && !state.acceptedDailyMissions.find((om) => om.missionId === missionId)?.completed,
      );

      if (newlyCompleted) {
        const { notifications: currentNotifications } = readWorldFromPlayer(get());
        return {
          acceptedDailyMissions: missions,
          notifications: pushNotification(currentNotifications, 'quest', `Ежедневное задание выполнено: ${missionDef.title}`),
        };
      }

      return { acceptedDailyMissions: missions };
    }),

  claimDailyMissionReward: (missionId) => {
    const sideEffects = createRewardBatchSideEffects();

    set((state) => {
      const mission = state.acceptedDailyMissions.find((m) => m.missionId === missionId);
      if (!mission || !mission.completed || mission.claimed) return state;

      const missionDef = getDailyMissionById(missionId);
      if (!missionDef) return state;

      const draft = createRewardBatchDraft(state.playerState, state.notifications);
      const rewards = missionDef.rewards;

      if (rewards.xp) batchAddXp(draft, sideEffects, rewards.xp);
      if (rewards.karma) batchAddKarma(draft, sideEffects, rewards.karma);
      if (rewards.credits) batchAddCredits(draft, rewards.credits);
      if (rewards.skillXp) {
        for (const [skill, xp] of Object.entries(rewards.skillXp)) {
          if (xp) batchAddSkill(draft, skill as TrainablePlayerSkill, xp);
        }
      }

      const missions = state.acceptedDailyMissions.map((m) =>
        m.missionId === missionId ? { ...m, claimed: true } : m,
      );

      return {
        acceptedDailyMissions: missions,
        playerState: draft.playerState,
        notifications: draft.notifications,
      };
    });

    flushRewardBatchSideEffects(sideEffects);
  },

  checkDailyMissionResets: () => {
    const state = get();
    const now = Date.now();
    const MS_PER_DAY = 86400000;

    // Legacy saves without lastDailyReset: use last save time as baseline
    let lastReset = state.lastDailyReset;
    if (lastReset === 0) {
      lastReset = state.lastSaveTimestamp ?? now;
      if (now - lastReset < MS_PER_DAY) {
        set({ lastDailyReset: lastReset });
        return;
      }
    } else if (now - lastReset < MS_PER_DAY) {
      return;
    }

    const acceptedDailyMissions = state.acceptedDailyMissions
      .filter((m) => !m.claimed)
      .map((m) => {
        // Completed-but-unclaimed: keep for reward pickup
        if (m.completed) return m;

        const missionDef = getDailyMissionById(m.missionId);
        // Weekly missions survive daily reset with progress intact
        if (missionDef?.resetSchedule === 'weekly') return m;

        // Daily incomplete: reset progress but keep the accepted slot
        return {
          ...m,
          progress: {},
          completed: false,
          acceptedAt: now,
        };
      });

    set({
      acceptedDailyMissions,
      lastDailyReset: now,
    });
  },

  adjustNpcAffinity: (npcId, delta) =>
    set((state) => {
      const currentAffinity = state.npcAffinity[npcId] ?? 0;
      const newAffinity = clamp(currentAffinity + delta, -100, 100);
      return {
        npcAffinity: {
          ...state.npcAffinity,
          [npcId]: newAffinity,
        },
      };
    }),

  getNpcAffinity: (npcId) => {
    return get().npcAffinity[npcId] ?? 0;
  },

  /* ── Achievement progress tracking actions ── */

  trackSceneVisit: (sceneId) =>
    set((state) => {
      if (state.achievementProgress.visitedScenes.includes(sceneId)) return state;
      return {
        achievementProgress: {
          ...state.achievementProgress,
          visitedScenes: [...state.achievementProgress.visitedScenes, sceneId],
        },
      };
    }),

  trackCombatVictory: (enemyType, combo) =>
    set((state) => {
      const newDefeated = state.achievementProgress.defeatedEnemyTypes.includes(enemyType)
        ? state.achievementProgress.defeatedEnemyTypes
        : [...state.achievementProgress.defeatedEnemyTypes, enemyType];
      return {
        achievementProgress: {
          ...state.achievementProgress,
          combatVictories: state.achievementProgress.combatVictories + 1,
          consecutiveVictories: state.achievementProgress.consecutiveVictories + 1,
          maxComboAchieved: Math.max(state.achievementProgress.maxComboAchieved, combo),
          defeatedEnemyTypes: newDefeated,
        },
      };
    }),

  trackCriticalHit: () =>
    set((state) => {
      if (state.achievementProgress.hasCriticalHit) return state;
      return {
        achievementProgress: {
          ...state.achievementProgress,
          hasCriticalHit: true,
        },
      };
    }),

  trackNightHour: () =>
    set((state) => ({
      achievementProgress: {
        ...state.achievementProgress,
        nightTimeHours: state.achievementProgress.nightTimeHours + 0.01,
      },
    })),

  trackPoemPowerInCombat: () =>
    set((state) => {
      if (state.achievementProgress.poemPowerUsedInCombat) return state;
      return {
        achievementProgress: {
          ...state.achievementProgress,
          poemPowerUsedInCombat: true,
        },
      };
    }),

  resetConsecutiveVictories: () =>
    set((state) => ({
      achievementProgress: {
        ...state.achievementProgress,
        consecutiveVictories: 0,
      },
    })),

  trackMaxCombo: (combo) =>
    set((state) => {
      if (combo <= state.achievementProgress.maxComboAchieved) return state;
      return {
        achievementProgress: {
          ...state.achievementProgress,
          maxComboAchieved: combo,
        },
      };
    }),
});
