/* ─── Volodka RPG – World Slice ─── */
/* Quests, collected poems, poem powers, NPC relationships, and achievements. */

import type { StateCreator } from 'zustand';
import type {
  QuestState,
  NPCRelation,
  AcceptedDailyMission,
} from '@/shared/types/game';
import { getPoemById, getQuestDefinitions, getAchievementMap, getDailyMissionById, getTotalAchievements } from '@/data/gameDataLoader';
import {
  emitAchievementFx,
  emitAchievementUnlocked,
  emitPoemCollected,
  runAfterStoreCommit,
  scheduleQuestAccepted,
  scheduleQuestCompleted,
  scheduleQuestFailed,
  scheduleQuestObjectiveUpdated,
  scheduleQuestRetried,
} from '../storeEffects';
import { resolveAchievementAnnounce } from '@/data/achievementHelpers';
import { applyEffects } from '@/shared/utils/applyEffects';
import { clamp, type PoemPowerState } from '../shared';
import { applyFairmathRelation } from '@/shared/fairmath';
import { scaleNpcRelationDelta } from '@/engine/skills/passiveSkillModifiers';
import { resolveCanonicalNpcId } from '@/shared/npcIdAliases';
import type { GameStoreState } from '../types';
import { getUIStore } from '../storeBindings';
import {
  pickPlayerRewardBatchActions,
  pickWorldCrossActions,
  readWorldFromExploration,
} from '../crossSliceReads';
import { QUEST_BOARD_MAX_ACTIVE_MISSIONS } from '@/shared/quest/questBoardConstants';
import { questCanRetry } from '@/shared/quest/questRetry';
import { parseTrainablePlayerSkill } from '../skillHelpers';
import {
  batchAddCredits,
  batchAddKarma,
  batchAddSkill,
  batchAddXp,
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
    /** Consecutive story choices with positive karma */
    goodKarmaStreak: number;
    /** Consecutive story choices with negative karma */
    badKarmaStreak: number;
  };
}

export interface WorldSliceActions {
  activateQuest: (questId: string) => void;
  retryQuest: (questId: string) => void;
  completeQuestObjective: (questId: string, objectiveId: string) => void;
  /** Internal status transition — use completeQuestAndApplyRewards / quest/complete action. */
  completeQuest: (questId: string) => void;
  failQuest: (questId: string, reason?: string) => void;
  setQuestHoursElapsed: (questId: string, hoursElapsed: number) => void;
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
  /** Track moral karma choice streaks (positive or negative) */
  trackKarmaChoice: (karmaDelta: number) => void;
  /** Reset combat consecutive victories (on defeat) */
  resetConsecutiveVictories: () => void;
  /** Update max combo if the new value is higher (does not increment victories) */
  trackMaxCombo: (combo: number) => void;
  /** Apply scene-visit and night-hour tracking from checkAchievements in one set pass */
  batchCheckAchievementProgress: (updates: { sceneVisit?: string; trackNightHour?: boolean }) => void;
}

export type WorldSlice = WorldSliceState & WorldSliceActions;

function findNpcRelationIndex(relations: NPCRelation[], npcId: string): number {
  const canonical = resolveCanonicalNpcId(npcId);
  return relations.findIndex((r) => resolveCanonicalNpcId(r.npcId) === canonical);
}

function readCanonicalAffinity(affinity: Record<string, number>, npcId: string): number {
  const canonical = resolveCanonicalNpcId(npcId);
  if (canonical in affinity) return affinity[canonical] ?? 0;
  for (const [key, value] of Object.entries(affinity)) {
    if (resolveCanonicalNpcId(key) === canonical) return value;
  }
  return 0;
}

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
    goodKarmaStreak: 0,
    badKarmaStreak: 0,
  },

  /* ── Actions ── */

  activateQuest: (questId) => {
    const state = get();
    const existing = state.quests.find((q) => q.questId === questId);
    if (existing && existing.status !== 'inactive') return;

    const definition = getQuestDefinitions().find((d) => d.id === questId);
    if (!definition) return;

    const objectives: Record<string, boolean> = {};
    for (const obj of definition.objectives) {
      objectives[obj.id] = false;
    }

    const quests = state.quests.filter((q) => q.questId !== questId);
    const { timeOfDay } = readWorldFromExploration();
    quests.push({ questId, status: 'active', objectives, startedAtTime: timeOfDay, hoursElapsed: 0 });

    set({ quests });
    scheduleQuestAccepted(questId, definition.title);
    pickWorldCrossActions().pushNotification('quest', `Новое задание: ${definition.title}`);
  },

  retryQuest: (questId) => {
    const state = get();
    const existing = state.quests.find((q) => q.questId === questId);
    if (!existing || existing.status !== 'failed') return;

    const definition = getQuestDefinitions().find((d) => d.id === questId);
    if (!definition || !questCanRetry(definition)) return;

    const objectives: Record<string, boolean> = {};
    for (const obj of definition.objectives) {
      objectives[obj.id] = false;
    }

    const { timeOfDay } = readWorldFromExploration();
    const quests = state.quests.map((q) =>
      q.questId === questId
        ? { questId, status: 'active' as const, objectives, startedAtTime: timeOfDay }
        : q,
    );

    set({ quests });
    scheduleQuestRetried(questId, definition.title);
    scheduleQuestAccepted(questId, definition.title);
    pickWorldCrossActions().pushNotification('quest', `Задание возобновлено: ${definition.title}`);
  },

  completeQuestObjective: (questId, objectiveId) => {
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

      return { quests };
    });

    scheduleQuestObjectiveUpdated(questId, objectiveId);
  },

  completeQuest: (questId) => {
    if (import.meta.env.DEV) {
      console.warn(
        `[worldSlice] completeQuest("${questId}") skips reward batch — dispatch quest/complete instead`,
      );
    }

    const questDef = getQuestDefinitions().find((d) => d.id === questId);
    const questTitle = questDef?.title ?? questId;

    set((state) => ({
      quests: state.quests.map((q) => {
        if (q.questId !== questId) return q;
        return {
          ...q,
          status: 'completed' as const,
          objectives: Object.fromEntries(
            Object.keys(q.objectives).map((k) => [k, true]),
          ),
        };
      }),
    }));

    scheduleQuestCompleted(questId, questDef?.questGiverNpcId);
    pickWorldCrossActions().pushNotification('quest', `Задание выполнено: ${questTitle}`);
  },

  failQuest: (questId, reason) => {
    const state = get();
    const quest = state.quests.find((q) => q.questId === questId);
    if (!quest || quest.status !== 'active') return;

    const questDef = getQuestDefinitions().find((d) => d.id === questId);
    const questTitle = questDef?.title ?? questId;

    set((prev) => ({
      quests: prev.quests.map((q) => {
        if (q.questId !== questId) return q;
        if (q.status !== 'active') return q;
        return {
          ...q,
          status: 'failed' as const,
        };
      }),
    }));

    scheduleQuestFailed({
      questId,
      questTitle,
      reason,
      canRetry: questCanRetry(questDef),
    });
  },

  setQuestHoursElapsed: (questId, hoursElapsed) => {
    set((state) => ({
      quests: state.quests.map((q) => {
        if (q.questId !== questId) return q;
        if (q.status !== 'active') return q;
        return { ...q, hoursElapsed };
      }),
    }));
  },

  collectPoem: (poemId) => {
    const state = get();
    if (state.collectedPoems.includes(poemId)) return;
    const poem = getPoemById(poemId);
    if (!poem) return;

    set({ collectedPoems: [...state.collectedPoems, poemId] });
    runAfterStoreCommit(() => emitPoemCollected(poemId));
    pickWorldCrossActions().pushNotification('poem', `Стих собран: ${poem.title}`);
  },

  setNpcRelation: (npcId, delta) =>
    set((state) => {
      const canonicalId = resolveCanonicalNpcId(npcId);
      const scaledDelta = scaleNpcRelationDelta(
        delta,
        state.playerState.progression.unlockedSkills,
        state.playerState.flags,
      );
      const relations = [...state.npcRelations];
      const idx = findNpcRelationIndex(relations, canonicalId);

      if (idx >= 0) {
        const updated = { ...relations[idx], npcId: canonicalId };
        updated.value = clamp(applyFairmathRelation(updated.value, scaledDelta), 0, 100);
        relations[idx] = updated;
      } else {
        relations.push({
          npcId: canonicalId,
          value: clamp(applyFairmathRelation(50, scaledDelta), 0, 100), // Start at neutral 50
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

    set({
      unlockedAchievements: [...state.unlockedAchievements, { id: achievementId, unlockedAt: timestamp }],
    });

    if (def.rewards.length > 0) {
      applyEffects(def.rewards);
    }

    runAfterStoreCommit(() => {
      emitAchievementUnlocked({
        achievementId,
        title: def.title,
        description: def.description,
        icon: def.icon,
        category: def.category,
        rarity: def.rarity,
        soundEffect: def.soundEffect,
        accessibilityAnnounce: resolveAchievementAnnounce(def),
      });
      emitAchievementFx({
        title: def.title,
        description: def.description,
        icon: def.icon,
      });
    });

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

  acceptDailyMission: (missionId) => {
    const state = get();
    if (state.acceptedDailyMissions.some((m) => m.missionId === missionId)) return;
    const activeCount = state.acceptedDailyMissions.filter((m) => !m.completed && !m.claimed).length;
    if (activeCount >= QUEST_BOARD_MAX_ACTIVE_MISSIONS) return;

    const newMission: AcceptedDailyMission = {
      missionId,
      acceptedAt: Date.now(),
      progress: {},
      completed: false,
      claimed: false,
    };

    set({ acceptedDailyMissions: [...state.acceptedDailyMissions, newMission] });
    pickWorldCrossActions().pushNotification('quest', 'Ежедневное задание принято');
  },

  abandonDailyMission: (missionId) =>
    set((state) => {
      const mission = state.acceptedDailyMissions.find((m) => m.missionId === missionId);
      if (!mission || mission.claimed) return state;

      return {
        acceptedDailyMissions: state.acceptedDailyMissions.filter((m) => m.missionId !== missionId),
      };
    }),

  updateDailyMissionProgress: (missionId, objectiveId, delta) => {
    const missionDef = getDailyMissionById(missionId);
    if (!missionDef) return;

    let newlyCompletedTitle: string | null = null;

    set((state) => {
      const missions = state.acceptedDailyMissions.map((m) => {
        if (m.missionId !== missionId || m.completed || m.claimed) return m;

        const currentProgress = m.progress[objectiveId] ?? 0;
        const objectiveDef = missionDef.objectives.find((o) => o.id === objectiveId);
        const target = objectiveDef?.target ?? 1;
        const newProgress = Math.min(currentProgress + delta, target);

        const updatedProgress = { ...m.progress, [objectiveId]: newProgress };

        const allComplete = missionDef.objectives.every(
          (o) => (updatedProgress[o.id] ?? 0) >= o.target,
        );

        return {
          ...m,
          progress: updatedProgress,
          completed: allComplete,
        };
      });

      const newlyCompleted = missions.find(
        (m) => m.missionId === missionId && m.completed && !state.acceptedDailyMissions.find((om) => om.missionId === missionId)?.completed,
      );

      if (newlyCompleted) {
        newlyCompletedTitle = missionDef.title;
      }

      return { acceptedDailyMissions: missions };
    });

    if (newlyCompletedTitle) {
      pickWorldCrossActions().pushNotification(
        'quest',
        `Ежедневное задание выполнено: ${newlyCompletedTitle}`,
      );
    }
  },

  claimDailyMissionReward: (missionId) => {
    const state = get();
    const mission = state.acceptedDailyMissions.find((m) => m.missionId === missionId);
    if (!mission || !mission.completed || mission.claimed) return;

    const missionDef = getDailyMissionById(missionId);
    if (!missionDef) return;

    set({
      acceptedDailyMissions: state.acceptedDailyMissions.map((m) =>
        m.missionId === missionId ? { ...m, claimed: true } : m,
      ),
    });

    const rewards = missionDef.rewards;
    pickPlayerRewardBatchActions().applyPlayerRewardBatch((draft, sideEffects) => {
      if (rewards.xp) batchAddXp(draft, sideEffects, rewards.xp);
      if (rewards.karma) batchAddKarma(draft, sideEffects, rewards.karma);
      if (rewards.credits) batchAddCredits(draft, rewards.credits);
      if (rewards.skillXp) {
        for (const [skillKey, xp] of Object.entries(rewards.skillXp)) {
          const skill = parseTrainablePlayerSkill(
            skillKey,
            `daily mission "${missionId}" skillXp`,
          );
          if (skill && xp) batchAddSkill(draft, skill, xp);
        }
      }
    });
  },

  checkDailyMissionResets: () => {
    const state = get();
    const now = Date.now();
    const MS_PER_DAY = 86400000;

    // Legacy saves without lastDailyReset: use last save time as baseline
    let lastReset = state.lastDailyReset;
    if (lastReset === 0) {
      lastReset = getUIStore().lastSaveTimestamp ?? now;
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
      const canonicalId = resolveCanonicalNpcId(npcId);
      const currentAffinity = readCanonicalAffinity(state.npcAffinity, canonicalId);
      const newAffinity = clamp(currentAffinity + delta, -100, 100);
      return {
        npcAffinity: {
          ...state.npcAffinity,
          [canonicalId]: newAffinity,
        },
      };
    }),

  getNpcAffinity: (npcId) => {
    return readCanonicalAffinity(get().npcAffinity, npcId);
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

  trackKarmaChoice: (karmaDelta) =>
    set((state) => {
      if (karmaDelta === 0) return state;
      const prev = state.achievementProgress;
      if (karmaDelta > 0) {
        return {
          achievementProgress: {
            ...prev,
            goodKarmaStreak: prev.goodKarmaStreak + 1,
            badKarmaStreak: 0,
          },
        };
      }
      return {
        achievementProgress: {
          ...prev,
          badKarmaStreak: prev.badKarmaStreak + 1,
          goodKarmaStreak: 0,
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

  batchCheckAchievementProgress: (updates) =>
    set((state) => {
      let nextProgress = state.achievementProgress;
      let changed = false;

      if (updates.sceneVisit && !nextProgress.visitedScenes.includes(updates.sceneVisit)) {
        nextProgress = {
          ...nextProgress,
          visitedScenes: [...nextProgress.visitedScenes, updates.sceneVisit],
        };
        changed = true;
      }

      if (updates.trackNightHour) {
        nextProgress = {
          ...nextProgress,
          nightTimeHours: nextProgress.nightTimeHours + 0.01,
        };
        changed = true;
      }

      if (!changed) return state;
      return { achievementProgress: nextProgress };
    }),
});
