/* ─── Volodka RPG – Achievement Engine ───
   Checks achievement conditions based on game state changes.
   Called periodically and on significant state transitions.
   Delegates unlocking to the Zustand store (single source of truth).

   ARCHITECTURE: The engine is a PURE condition checker — no local state,
   no localStorage. The store's unlockAchievement() is the single source of
   truth for all unlock state, events, rewards, and persistence. This eliminates
   the desync bug that occurred when the engine and store had separate state. */

import { getGameStore } from '@/store/gameStore';
import { ACHIEVEMENT_MAP, TOTAL_ACHIEVEMENTS } from '@/data/achievements';
import type { SceneId, EnemyType } from '@/shared/types/game';

/* ─── Tracking state (session-only, not persisted) ─── */

/** Set of scene IDs visited during this session (accumulated) */
const visitedScenes = new Set<string>();

/** Previous game mode for transition detection */
let prevMode: string | null = null;

/** Previous energy value for recovery detection */
let prevEnergy = 0;

/** Combat stats accumulated across the session */
let combatVictories = 0;
let consecutiveVictories = 0;
let maxComboAchieved = 0;
let hasCriticalHit = false;
const defeatedEnemyTypes = new Set<string>();

/** Night time accumulation (in-game hours) */
let nightTimeHours = 0;

/** Whether a poem power was used in combat */
let poemPowerUsedInCombat = false;

/** Whether we already checked the "first awakening" this session */
let firstAwakeningChecked = false;

/** Initialize the engine — now a no-op (store is the source of truth). */
export function initAchievementEngine(): void {
  // No-op: store already has achievement state from save/load or default.
  // Kept for backward compatibility with useAchievementChecker.
}

/** Get the set of unlocked achievement IDs from the store (read-only) */
export function getUnlockedAchievementIds(): Set<string> {
  const store = getGameStore();
  return new Set(store.unlockedAchievements.map((a) => a.id));
}

/** Get unlocked achievements with timestamps from the store */
export function getUnlockedAchievementsWithTimestamps(): Array<{ id: string; unlockedAt: number }> {
  const store = getGameStore();
  return [...store.unlockedAchievements];
}

/* ─── Core unlock logic ─── */

function tryUnlock(achievementId: string): void {
  const store = getGameStore();

  // Check if already unlocked in the store
  if (store.unlockedAchievements.some((a) => a.id === achievementId)) return;

  const def = ACHIEVEMENT_MAP[achievementId];
  if (!def) return;

  // Delegate to the store — it handles:
  //   - Adding to unlockedAchievements array
  //   - Emitting 'achievement:unlocked' and 'fx:achievement' events
  //   - Applying rewards (xp, karma, skill, credits, flags)
  //   - Checking meta-achievement ("Полное собрание")
  store.unlockAchievement(achievementId);
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

export function checkAchievements(state: AchievementCheckState): void {
  const mode = state.mode;
  const sceneId = state.currentSceneId;
  const poems = state.collectedPoems;
  const karma = state.karma;
  const energy = state.energy;
  const flags = state.flags;
  const npcRelations = state.npcRelations;
  const timeOfDay = state.timeOfDay;

  // Track visited scenes
  visitedScenes.add(sceneId);

  // ─── STORY ACHIEVEMENTS ───

  // "Первое пробуждение" — mode transitioned from intro → exploration
  if (!firstAwakeningChecked && prevMode === 'intro' && mode === 'exploration') {
    firstAwakeningChecked = true;
    tryUnlock('story_first_awakening');
  }

  // "Тень Гильдии" — visit office_day
  if (sceneId === 'office_day') {
    tryUnlock('story_guild_shadow');
  }

  // "Встреча с Викторией" — flag met_victoria or visited street_night
  if (flags['met_maria'] || flags['met_victoria']) {
    tryUnlock('story_meet_victoria');
  }

  // "Выбор сердца" — zarema rescued
  if (flags['zarema_rescued']) {
    tryUnlock('story_save_zarema');
  }

  // "Голос города" — poetry broadcast sent
  if (flags['poetry_broadcast_sent'] || flags['poetry_transmitted']) {
    tryUnlock('story_poetry_broadcast');
  }

  // "Живой код" — Victoria is AI revealed
  if (flags['maria_truth_revealed'] || flags['maria_truth_accepted'] || flags['victoria_ai_revealed']) {
    tryUnlock('story_living_code');
  }

  // "Рассвет" — any ending reached
  if (flags['ending_reached'] || flags['ending_sacrifice'] || flags['ending_freedom'] ||
      flags['ending_poetry'] || flags['ending_guild'] || flags['act5_ending']) {
    tryUnlock('story_dawn');
  }

  // ─── COMBAT ACHIEVEMENTS ───

  // "Первая кровь" — first combat victory
  if (combatVictories >= 1) {
    tryUnlock('combat_first_blood');
  }

  // "Комбо-мастер" — combo 3x
  if (maxComboAchieved >= 3) {
    tryUnlock('combat_combo_master');
  }

  // "Критический удар"
  if (hasCriticalHit) {
    tryUnlock('combat_critical_hit');
  }

  // "Непобедимый" — 5 victories without defeat
  if (consecutiveVictories >= 5) {
    tryUnlock('combat_invincible');
  }

  // "Охотник на демонов" — defeat all enemy types
  const allEnemyTypes: EnemyType[] = [
    'system_daemon', 'corporate_golem', 'shadow_agent', 'data_phantom',
    'code_inquisitor', 'guild_enforcer', 'data_wraith', 'censor_drone', 'poetry_hunter',
  ];
  if (allEnemyTypes.every((t) => defeatedEnemyTypes.has(t))) {
    tryUnlock('combat_demon_hunter');
  }

  // ─── EXPLORATION ACHIEVEMENTS ───

  // "Исследователь" — 5 scenes
  if (visitedScenes.size >= 5) {
    tryUnlock('explorer_explorer');
  }

  // "Странник" — all scenes
  const allScenes: string[] = [
    'volodka_room', 'volodka_corridor', 'home_evening', 'street_night',
    'street_winter', 'cafe_evening', 'office_day', 'park_day',
    'library_day', 'sleep_dream', 'rooftop_edge', 'abandoned_factory',
    'zarema_albert_room',
  ];
  if (allScenes.every((s) => visitedScenes.has(s))) {
    tryUnlock('explorer_wanderer');
  }

  // "Ночная сова" — night time (22:00 - 06:00)
  if (timeOfDay >= 22 || timeOfDay < 6) {
    nightTimeHours += 0.01; // Each check is ~1 second, so ~0.01 game hours
    if (nightTimeHours >= 2) {
      tryUnlock('explorer_night_owl');
    }
  }

  // "Крыши города" — visit rooftop
  if (sceneId === 'rooftop_edge') {
    tryUnlock('explorer_rooftops');
  }

  // ─── POETRY ACHIEVEMENTS ───

  // "Первый стих"
  if (poems.length >= 1) {
    tryUnlock('poetry_first_verse');
  }

  // "Собиратель рифм"
  if (poems.length >= 10) {
    tryUnlock('poetry_rhyme_collector');
  }

  // "Хранитель слова" — all 23 poems (21 base + 2 bonus = 23 in the game)
  if (poems.length >= 21) {
    tryUnlock('poetry_word_keeper');
  }

  // "Сила стиха"
  if (poemPowerUsedInCombat) {
    tryUnlock('poetry_power_verse');
  }

  // ─── SOCIAL ACHIEVEMENTS ───

  // "Друг Заремы" — 80+ with Zarema
  const zaremaRelation = npcRelations.find((r) => r.npcId === 'zarema');
  if (zaremaRelation && zaremaRelation.value >= 80) {
    tryUnlock('social_zarema_friend');
  }

  // "Союзник Сети" — network member flag
  if (flags['network_member'] || flags['network_oath_taken']) {
    tryUnlock('social_network_ally');
  }

  // "Мастер переговоров" — 80+ with 3 NPCs
  const highRelationCount = npcRelations.filter((r) => r.value >= 80).length;
  if (highRelationCount >= 3) {
    tryUnlock('social_negotiator');
  }

  // ─── HIDDEN ACHIEVEMENTS ───

  // "Между строк" — easter egg flag
  if (flags['easter_egg_found'] || flags['found_easter_egg'] || flags['between_lines']) {
    tryUnlock('hidden_between_lines');
  }

  // "Жертва" — sacrifice ending
  if (flags['ending_sacrifice'] || flags['sacrifice_ending']) {
    tryUnlock('hidden_sacrifice');
  }

  // Update previous state
  prevMode = mode;
  prevEnergy = energy;
}

/* ─── Event-driven updates ─── */

/** Call when combat victory occurs */
export function notifyCombatVictory(enemyType: string): void {
  combatVictories++;
  consecutiveVictories++;
  defeatedEnemyTypes.add(enemyType);
}

/** Call when combat defeat occurs */
export function notifyCombatDefeat(): void {
  consecutiveVictories = 0;
}

/** Call when combo reaches a new max */
export function notifyCombo(comboCount: number): void {
  if (comboCount > maxComboAchieved) {
    maxComboAchieved = comboCount;
  }
}

/** Call when critical hit lands */
export function notifyCriticalHit(): void {
  hasCriticalHit = true;
}

/** Call when poem power used in combat */
export function notifyPoemPowerUsed(): void {
  poemPowerUsedInCombat = true;
}

/** Reset tracking state (for new game) */
export function resetAchievementTracking(): void {
  visitedScenes.clear();
  prevMode = null;
  prevEnergy = 0;
  combatVictories = 0;
  consecutiveVictories = 0;
  maxComboAchieved = 0;
  hasCriticalHit = false;
  defeatedEnemyTypes.clear();
  nightTimeHours = 0;
  poemPowerUsedInCombat = false;
  firstAwakeningChecked = false;
  // No need to clear localStorage — the store is the source of truth.
  // Clearing the store's unlockedAchievements is handled by the save system.
}
