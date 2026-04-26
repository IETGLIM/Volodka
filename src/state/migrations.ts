import type { SavePayload } from '@/server/persistence/save-manager';
import type { PlayerState } from '@/data/types';
import type { FactionId, FactionReputation } from '@/shared/types/factions';
import { createInitialReputation } from '@/shared/types/factions';
import { INITIAL_PLAYER } from './playerStore'; // Will be exported

export const CURRENT_PERSIST_VERSION = 6;

/**
 * Versioned migration for SavePayload → current stores.
 * Handles upgrade from older versions (e.g. before factionReputations, v5 → v6).
 * Called by Zustand persist.migrate and manual load flows.
 */
export function migrateSaveData(persisted: any, version: number): SavePayload {
  const data = { ...persisted };

  // v1-v4 → v5 (example legacy upgrades - extend as needed)
  if (version < 5) {
    data.version = 5;
    if (!data.factionReputations) {
      data.factionReputations = {
        poets: createInitialReputation('poets'),
        it_workers: createInitialReputation('it_workers'),
        dreamers: createInitialReputation('dreamers'),
        locals: createInitialReputation('locals'),
        shadow_network: createInitialReputation('shadow_network'),
      };
    }
    if (!data.exploration) data.exploration = {};
    if (!data.questProgress) data.questProgress = {};
  }

  // v5 → v6: Ensure full FactionReputation shape, clamp values, add any new fields
  if (version < 6) {
    data.version = CURRENT_PERSIST_VERSION;

    // Ensure factionReputations is proper Record with full shape
    const initialReps: Record<FactionId, FactionReputation> = {
      poets: createInitialReputation('poets'),
      it_workers: createInitialReputation('it_workers'),
      dreamers: createInitialReputation('dreamers'),
      locals: createInitialReputation('locals'),
      shadow_network: createInitialReputation('shadow_network'),
    };

    data.factionReputations = {
      ...initialReps,
      ...data.factionReputations,
    };

    // Clamp reputation values
    Object.keys(data.factionReputations).forEach((fid) => {
      const rep = data.factionReputations[fid as FactionId];
      if (rep && typeof rep.value === 'number') {
        rep.value = Math.max(-100, Math.min(100, rep.value));
        // standing can be recalculated on load if needed
      }
    });

    // Ensure playerState has all fields (merge with INITIAL)
    if (data.playerState) {
      data.playerState = {
        ...INITIAL_PLAYER,
        ...data.playerState,
        skills: { ...INITIAL_PLAYER.skills, ...(data.playerState.skills || {}) },
        flags: { ...INITIAL_PLAYER.flags, ...(data.playerState.flags || {}) },
      };
    }

    if (!data.collectedPoemIds) data.collectedPoemIds = [];
    if (!data.unlockedAchievementIds) data.unlockedAchievementIds = [];
    if (!data.unlockedLocations) data.unlockedLocations = [];
  }

  return data as SavePayload;
}

/** Helper to apply migrated data to stores (called from rehydrate or manual load) */
export function applyMigratedSaveToStores(payload: SavePayload) {
  // This will be called from a top-level hook or onRehydrate
  // For now, stores will use their own deserialize methods
  console.log('[Persist Migration] Applied v' + payload.version + ' save', {
    node: payload.currentNodeId,
    factions: Object.keys(payload.factionReputations || {}),
  });
  return payload;
}
