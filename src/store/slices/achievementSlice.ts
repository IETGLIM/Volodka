/* ─── Volodka RPG – Achievement (Trophy) Slice ─── */
/* Notification queue for condition-based trophy achievements.
 * Trophy unlock state is persisted via WorldSlice.unlockedAchievements.
 * This slice only manages the ephemeral notification queue + tracking counters. */

import type { StateCreator } from 'zustand';
import type { GameStoreSnapshot } from '@/shared/gameBridge/gameActionBridge';
import type { TrophyAchievement } from '@/data/achievements';
import { TROPHY_ACHIEVEMENTS } from '@/data/achievements';
import { evaluateTrophyCondition } from '@/shared/achievements/evaluateTrophyCondition';
import type { GameStoreState } from '../types';
import { getWorldStore } from '../storeBindings';

/* ─── Types ─── */

export interface TrophyNotification {
  id: string;
  trophy: TrophyAchievement;
  unlockedAt: number;
}

export interface AchievementSliceState {
  /** Pending trophy notifications (max 5, auto-expire after 5 s). */
  trophyNotifications: TrophyNotification[];
  /** Tracking counters used by condition evaluation (persisted). */
  trophyTracking: {
    craftCount: number;
    poemPowersUsedCount: number;
    highStressWin: boolean;
  };
}

export interface AchievementSliceActions {
  /** Evaluate all trophy conditions against a snapshot, unlock & notify new ones. */
  checkTrophies: (snapshot: GameStoreSnapshot) => void;
  /** Dismiss a notification by id. */
  dismissTrophyNotification: (id: string) => void;
  /** Track a crafting action for craft_count conditions. */
  trackCraft: () => void;
  /** Track a poem power use for poem_powers_used conditions. */
  trackPoemPowerUse: () => void;
  /** Track a combat win with stress above threshold. */
  trackHighStressWin: () => void;
}

export type AchievementSlice = AchievementSliceState & AchievementSliceActions;

const MAX_NOTIFICATIONS = 5;
// Notification expiry is handled by the AchievementPopup component (5s timer).

let notificationSeq = 0;

/* ─── Slice creator ─── */

export const createAchievementSlice: StateCreator<
  GameStoreState,
  [],
  [],
  AchievementSlice
> = (set, _get) => ({
  trophyNotifications: [],
  trophyTracking: {
    craftCount: 0,
    poemPowersUsedCount: 0,
    highStressWin: false,
  },

  checkTrophies: (snapshot) => {
    const state = _get();
    const alreadyUnlocked = new Set(snapshot.unlockedAchievements.map((a) => a.id));
    const newNotifications: TrophyNotification[] = [];

    for (const trophy of TROPHY_ACHIEVEMENTS) {
      if (alreadyUnlocked.has(trophy.id)) continue;
      // Also skip if already pending in notifications
      if (state.trophyNotifications.some((n) => n.trophy.id === trophy.id)) continue;

      if (evaluateTrophyCondition(trophy.condition, snapshot, state.trophyTracking)) {
        // Persist unlock through WorldSlice
        getWorldStore().unlockAchievement(trophy.id);

        newNotifications.push({
          id: `trophy-${++notificationSeq}-${Date.now()}`,
          trophy,
          unlockedAt: Date.now(),
        });
      }
    }

    if (newNotifications.length === 0) return;

    set((s) => {
      const merged = [...s.trophyNotifications, ...newNotifications];
      // Keep at most MAX_NOTIFICATIONS (most recent)
      return {
        trophyNotifications: merged.slice(-MAX_NOTIFICATIONS),
      };
    });
  },

  dismissTrophyNotification: (id) => {
    set((s) => ({
      trophyNotifications: s.trophyNotifications.filter((n) => n.id !== id),
    }));
  },

  trackCraft: () => {
    set((s) => ({
      trophyTracking: {
        ...s.trophyTracking,
        craftCount: s.trophyTracking.craftCount + 1,
      },
    }));
  },

  trackPoemPowerUse: () => {
    set((s) => ({
      trophyTracking: {
        ...s.trophyTracking,
        poemPowersUsedCount: s.trophyTracking.poemPowersUsedCount + 1,
      },
    }));
  },

  trackHighStressWin: () => {
    set((s) => ({
      trophyTracking: {
        ...s.trophyTracking,
        highStressWin: true,
      },
    }));
  },
});
