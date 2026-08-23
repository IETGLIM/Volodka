import type { GameStoreSnapshot } from '@/shared/gameBridge/gameActionBridge';
import type { GameStoreState } from './types';

/** Reference-equality fingerprint of snapshot inputs — avoids deep walks on large trees. */
type SnapshotCacheKey = readonly unknown[];

let cachedSnapshot: GameStoreSnapshot | null = null;
let cachedSnapshotKey: SnapshotCacheKey | null = null;

function buildSnapshotCacheKey(state: GameStoreState): SnapshotCacheKey {
  const progression = state.playerState.progression;
  return [
    state.mainMenuOpen,
    state.introActive,
    state.combatActive,
    state.activeCutsceneId,
    state.currentNodeId,
    state.showStoryOverlay,
    state.exploration.currentSceneId,
    state.exploration.playerPosition,
    state.exploration.timeOfDay,
    state.interactiveObjectStates,
    state.playerState.flags,
    state.playerState.inventory,
    state.playerState.skills,
    state.playerState.energy,
    state.playerState.karma,
    state.playerState.stress,
    state.playerState.visitedNodes,
    state.playerState.choiceLog ?? [],
    state.playerState.moralChoices ?? [],
    progression?.level ?? 1,
    progression?.currentAct ?? 1,
    progression?.skillPoints ?? 0,
    progression?.unlockedSkills,
    state.collectedPoems,
    state.quests,
    state.activeTTLFlags,
    state.poemPowers,
    state.npcRelations,
    state.unlockedAchievements,
    state.achievementProgress,
    state.triggeredCutscenes,
    state.diegeticNarrative,
    state.lastUsedPoemId,
    state.lastUsedPoemTimestamp,
    state.pendingPoemReadingId,
    // FIX (P2): these fields are published by buildGameSnapshot but were not
    // part of the cache key — isolated changes produced stale engine snapshots.
    state.difficultySettings,
    state.playerState.equippedItems,
    state.dialogueHistory,
    state.trophyTracking,
    state.weatherEnabled,
    state.rainIntensity,
    state.acquiredThoughtIds,
    state.equippedThoughtIds,
  ];
}

function snapshotCacheKeysEqual(a: SnapshotCacheKey | null, b: SnapshotCacheKey): boolean {
  if (!a || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function getCachedGameSnapshot(
  state: GameStoreState,
  build: (state: GameStoreState) => GameStoreSnapshot,
): GameStoreSnapshot {
  const key = buildSnapshotCacheKey(state);
  if (cachedSnapshot && snapshotCacheKeysEqual(cachedSnapshotKey, key)) {
    return cachedSnapshot;
  }
  const snapshot = build(state);
  cachedSnapshotKey = key;
  cachedSnapshot = snapshot;
  return snapshot;
}

/** Test harness — drop cached snapshot between cases. */
export function resetGameSnapshotCacheForTests(): void {
  cachedSnapshot = null;
  cachedSnapshotKey = null;
}
