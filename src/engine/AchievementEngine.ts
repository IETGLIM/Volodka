/* ─── Volodka RPG – Achievement Engine ───
   Checks achievement conditions based on game state changes.
   Called periodically and on significant state transitions.
   Delegates unlocking to the Zustand store (single source of truth).

   ARCHITECTURE: The engine is a PURE condition checker. All tracking
   state lives in the Zustand store's achievementProgress field, so it
   persists across page refreshes (F5). The store's unlockAchievement()
   is the single source of truth for all unlock state, events, rewards,
   and persistence. */

import {
  dispatchGameAction,
  getGameSnapshot,
  type AchievementProgressSnapshot,
} from '@/engine/GameActionDispatcher';
import { ACHIEVEMENT_MAP, ACHIEVEMENTS, TOTAL_ACHIEVEMENTS } from '@/data/achievements';
import { hasAllMainPoems } from '@/data/poemCollectionMeta';
import type { EnemyType } from '@/shared/types/game';

/* ─── Session-only tracking (not persisted — ephemeral per page load) ─── */

/** Previous game mode for transition detection */
let prevMode: string | null = null;

/** Previous energy value for recovery detection */
let prevEnergy = 0;

/** Whether we already checked the "first awakening" this session */
let firstAwakeningChecked = false;

/** Initialize the engine — now a no-op (store is the source of truth). */
export function initAchievementEngine(): void {
  // No-op: store already has achievement state from save/load or default.
  // Kept for backward compatibility with useAchievementChecker.
}

/** Get the set of unlocked achievement IDs from the store (read-only) */
export function getUnlockedAchievementIds(): Set<string> {
  return new Set(getGameSnapshot().unlockedAchievements.map((a) => a.id));
}

/** Get unlocked achievements with timestamps from the store */
export function getUnlockedAchievementsWithTimestamps(): Array<{ id: string; unlockedAt: number }> {
  return [...getGameSnapshot().unlockedAchievements];
}

/* ─── Core unlock logic ─── */

function tryUnlock(achievementId: string): void {
  const snapshot = getGameSnapshot();

  if (snapshot.unlockedAchievements.some((a) => a.id === achievementId)) return;

  const def = ACHIEVEMENT_MAP[achievementId];
  if (!def) return;

  dispatchGameAction({ type: 'achievement/unlock', achievementId });
}

/* ─── State check interface ─── */

export interface AchievementCheckState {
  mode: string;
  currentSceneId: string;
  collectedPoems: string[];
  karma: number;
  energy: number;
  stress: number;
  npcRelations: Array<{ npcId: string; value: number }>;
  flags: Record<string, boolean>;
  timeOfDay: number;
  combatComboCount?: number;
  combatMaxCombo?: number;
  combatLastCritical?: boolean;
  combatStatus?: string;
  combatEnemyType?: string;
  poemPowerUsed?: boolean;
  currentAct?: number;
  unlockedAchievements: Array<{ id: string; unlockedAt: number }>;
}

/* ─── Main check function ─── */

function projectCheckProgressUpdates(
  progress: AchievementProgressSnapshot,
  sceneId: string,
  timeOfDay: number,
): {
  progress: AchievementProgressSnapshot;
  batch: { sceneVisit?: string; trackNightHour?: boolean };
} {
  let nextProgress = progress;
  const batch: { sceneVisit?: string; trackNightHour?: boolean } = {};

  if (!progress.visitedScenes.includes(sceneId)) {
    batch.sceneVisit = sceneId;
    nextProgress = {
      ...nextProgress,
      visitedScenes: [...nextProgress.visitedScenes, sceneId],
    };
  }

  if (timeOfDay >= 22 || timeOfDay < 6) {
    batch.trackNightHour = true;
    nextProgress = {
      ...nextProgress,
      nightTimeHours: nextProgress.nightTimeHours + 0.01,
    };
  }

  return { progress: nextProgress, batch };
}

export function checkAchievements(state: AchievementCheckState): void {
  const mode = state.mode;
  const sceneId = state.currentSceneId;
  const poems = state.collectedPoems;
  const energy = state.energy;
  const flags = state.flags;
  const npcRelations = state.npcRelations;
  const timeOfDay = state.timeOfDay;
  const karma = state.karma;

  const snapshot = getGameSnapshot();
  const { progress, batch } = projectCheckProgressUpdates(
    snapshot.achievementProgress,
    sceneId,
    timeOfDay,
  );

  if (batch.sceneVisit !== undefined || batch.trackNightHour) {
    dispatchGameAction({ type: 'achievement/batchCheckProgress', ...batch });
  }

  // ─── STORY ACHIEVEMENTS ───

  if (!firstAwakeningChecked && prevMode === 'intro' && mode === 'exploration') {
    firstAwakeningChecked = true;
    tryUnlock('story_first_awakening');
  }

  if (sceneId === 'office_day') {
    tryUnlock('story_guild_shadow');
  }

  if (flags['met_maria'] || flags['met_victoria']) {
    tryUnlock('story_meet_victoria');
  }

  if (flags['poetry_broadcast_sent'] || flags['poetry_transmitted']) {
    tryUnlock('story_poetry_broadcast');
  }

  if (flags['maria_truth_revealed'] || flags['maria_truth_accepted'] || flags['victoria_ai_revealed']) {
    tryUnlock('story_living_code');
  }

  if (
    flags['ending_reached'] || flags['ending_sacrifice'] || flags['ending_freedom'] ||
    flags['ending_poetry'] || flags['ending_guild'] || flags['act5_ending'] ||
    flags['game_completed']
  ) {
    tryUnlock('story_dawn');
  }

  if (flags['quiet_song_ritka'] && flags['tolpa_guitar_heard']) {
    tryUnlock('collection_quiet_songs');
  }

  if (karma >= 90) {
    tryUnlock('karma_saint');
  }

  if (progress.goodKarmaStreak >= 5) {
    tryUnlock('karma_virtuous_streak');
  }

  if (progress.badKarmaStreak >= 5) {
    tryUnlock('karma_ruthless_streak');
  }

  // Flag-gated achievements (Act 6–7, CHK, minigames, endings)
  for (const def of ACHIEVEMENTS) {
    if (!def.unlockFlag) continue;
    if (flags[def.unlockFlag]) {
      tryUnlock(def.id);
    }
  }

  // ─── COMBAT ACHIEVEMENTS ───

  if (progress.combatVictories >= 1) {
    tryUnlock('combat_first_blood');
  }

  if (progress.maxComboAchieved >= 3) {
    tryUnlock('combat_combo_master');
  }

  if (progress.hasCriticalHit) {
    tryUnlock('combat_critical_hit');
  }

  if (progress.consecutiveVictories >= 5) {
    tryUnlock('combat_invincible');
  }

  const allEnemyTypes: EnemyType[] = [
    'system_daemon', 'corporate_golem', 'shadow_agent', 'data_phantom',
    'code_inquisitor', 'guild_enforcer', 'data_wraith', 'censor_drone', 'poetry_hunter',
  ];
  if (allEnemyTypes.every((t) => progress.defeatedEnemyTypes.includes(t))) {
    tryUnlock('combat_demon_hunter');
  }

  // ─── EXPLORATION ACHIEVEMENTS ───

  if (progress.visitedScenes.length >= 5) {
    tryUnlock('explorer_explorer');
  }

  const allScenes: string[] = [
    'volodka_room', 'volodka_corridor', 'home_evening', 'street_night',
    'street_winter', 'cafe_evening', 'office_day', 'park_day',
    'library_day', 'sleep_dream', 'rooftop_edge', 'abandoned_factory',
    'zarema_albert_room', 'chk_forest_zorge',
  ];
  if (allScenes.every((s) => progress.visitedScenes.includes(s))) {
    tryUnlock('explorer_wanderer');
  }

  if (timeOfDay >= 22 || timeOfDay < 6) {
    if (progress.nightTimeHours >= 2) {
      tryUnlock('explorer_night_owl');
    }
  }

  if (sceneId === 'rooftop_edge') {
    tryUnlock('explorer_rooftops');
  }

  // ─── POETRY ACHIEVEMENTS ───

  if (poems.length >= 1) {
    tryUnlock('poetry_first_verse');
  }

  if (poems.length >= 10) {
    tryUnlock('poetry_rhyme_collector');
  }

  if (hasAllMainPoems(poems)) {
    tryUnlock('poetry_word_keeper');
  }

  if (progress.poemPowerUsedInCombat) {
    tryUnlock('poetry_power_verse');
  }

  // ─── SOCIAL ACHIEVEMENTS ───

  const zaremaRelation = npcRelations.find((r) => r.npcId === 'zarema');
  if (zaremaRelation && zaremaRelation.value >= 80) {
    tryUnlock('social_zarema_friend');
  }

  if (flags['network_member'] || flags['network_oath_taken']) {
    tryUnlock('social_network_ally');
  }

  const highRelationCount = npcRelations.filter((r) => r.value >= 80).length;
  if (highRelationCount >= 3) {
    tryUnlock('social_negotiator');
  }

  // ─── HIDDEN ACHIEVEMENTS (non-flag) ───

  if (flags['easter_egg_found'] || flags['found_easter_egg']) {
    tryUnlock('hidden_between_lines');
  }

  prevMode = mode;
  prevEnergy = energy;
}

/* ─── Event-driven updates ─── */

export function notifyCombatVictory(enemyType: string): void {
  dispatchGameAction({ type: 'achievement/trackCombatVictory', enemyType, combo: 0 });
}

export function notifyCombatDefeat(): void {
  dispatchGameAction({ type: 'achievement/resetConsecutiveVictories' });
}

export function notifyCombo(comboCount: number): void {
  dispatchGameAction({ type: 'achievement/trackMaxCombo', comboCount });
}

export function notifyCriticalHit(): void {
  dispatchGameAction({ type: 'achievement/trackCriticalHit' });
}

export function notifyPoemPowerUsed(): void {
  dispatchGameAction({ type: 'achievement/trackPoemPowerInCombat' });
}

export function resetAchievementTracking(): void {
  prevMode = null;
  prevEnergy = 0;
  firstAwakeningChecked = false;
}
