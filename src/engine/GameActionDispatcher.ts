/* ─── Volodka RPG – engine→store action bridge ─── */
/* Engine modules dispatch typed actions here instead of importing gameStore.
 * The store registers a handler at startup (see gameStore.ts). */

import type {
  SceneId,
  QuestState,
  GameMode,
  TrainablePlayerSkill,
  InventoryItem,
} from '@/shared/types/game';
import type { NotificationType } from '@/store/shared';

export interface ActiveTTLFlagSnapshot {
  key: string;
  poemId: string;
  expiryTimestamp: number;
}

export interface AchievementProgressSnapshot {
  visitedScenes: string[];
  combatVictories: number;
  consecutiveVictories: number;
  maxComboAchieved: number;
  hasCriticalHit: boolean;
  defeatedEnemyTypes: string[];
  nightTimeHours: number;
  poemPowerUsedInCombat: boolean;
}

/** Read-only snapshot for engine systems that observe game state. */
export interface GameStoreSnapshot {
  mode: GameMode;
  currentNodeId: string | null;
  showStoryOverlay: boolean;
  exploration: {
    currentSceneId: SceneId;
    timeOfDay: number;
  };
  playerState: {
    flags: Record<string, boolean>;
    inventory: Array<{ id: string }>;
    skills: Record<TrainablePlayerSkill, number>;
    energy: number;
    karma: number;
    stress: number;
    visitedNodes: string[];
    progression: {
      level: number;
      currentAct: number;
      skillPoints: number;
      unlockedSkills: string[];
    };
  };
  collectedPoems: string[];
  quests: QuestState[];
  activeTTLFlags: ActiveTTLFlagSnapshot[];
  poemPowers: Record<string, { lastUsed: number; cooldownMs: number }>;
  npcRelations: Array<{ npcId: string; value: number }>;
  unlockedAchievements: Array<{ id: string; unlockedAt: number }>;
  achievementProgress: AchievementProgressSnapshot;
}

/** Typed mutations engine may request from the store. */
export type GameAction =
  /* ── Quests ── */
  | { type: 'quest/completeObjective'; questId: string; objectiveId: string }
  | { type: 'quest/complete'; questId: string }
  | { type: 'quest/completeAndApplyRewards'; questId: string }
  | { type: 'quest/fail'; questId: string }
  | { type: 'quest/activate'; questId: string }
  /* ── Player stats ── */
  | { type: 'player/addSkill'; skill: TrainablePlayerSkill; amount: number }
  | { type: 'player/addEnergy'; amount: number }
  | { type: 'player/addStress'; amount: number }
  | { type: 'player/addKarma'; amount: number }
  | { type: 'player/addXp'; amount: number }
  | { type: 'player/addCredits'; amount: number }
  | { type: 'player/setFlag'; key: string; value: boolean }
  | { type: 'player/setNpcRelation'; npcId: string; delta: number }
  /* ── Poem powers ── */
  | { type: 'poem/setTTLFlags'; flags: ActiveTTLFlagSnapshot[] }
  | { type: 'poem/clearAllEffects' }
  /* ── Story / UI mode ── */
  | { type: 'story/setMode'; mode: GameMode }
  | { type: 'story/setCurrentNodeId'; nodeId: string }
  | { type: 'story/setShowStoryOverlay'; show: boolean }
  | { type: 'story/openNarrativeOverlay'; nodeId: string; kind?: 'story' | 'dialogue' }
  | { type: 'story/closeNarrativeOverlay' }
  | { type: 'story/advanceAct' }
  /* ── Inventory ── */
  | { type: 'inventory/addItem'; item: InventoryItem }
  /* ── Achievements ── */
  | { type: 'achievement/unlock'; achievementId: string }
  | { type: 'achievement/trackSceneVisit'; sceneId: string }
  | { type: 'achievement/trackNightHour' }
  | { type: 'achievement/trackCombatVictory'; enemyType: string; combo: number }
  | { type: 'achievement/resetConsecutiveVictories' }
  | { type: 'achievement/trackMaxCombo'; comboCount: number }
  | { type: 'achievement/trackCriticalHit' }
  | { type: 'achievement/trackPoemPowerInCombat' }
  /* ── Skill tree ── */
  | { type: 'skill/unlockTreeNode'; skillId: string }
  /* ── Notifications ── */
  | { type: 'notification/push'; notificationType: NotificationType; text: string }
  | { type: 'notification/dismiss'; id: string };

/** Optional selector + equality for narrow store subscriptions (avoids firing on unrelated mutations). */
export interface GameSnapshotSubscribeOptions<T> {
  selector: (snapshot: GameStoreSnapshot) => T;
  equalityFn: (a: T, b: T) => boolean;
}

export interface GameActionBridge {
  dispatch(action: GameAction): void;
  getSnapshot(): GameStoreSnapshot;
  subscribe<T>(
    listener: (snapshot: GameStoreSnapshot) => void,
    options?: GameSnapshotSubscribeOptions<T>,
  ): () => void;
  tryAddItem(item: InventoryItem): boolean;
  tryActivatePoemPower(poemId: string): boolean;
}

let bridge: GameActionBridge | null = null;

export function registerGameActionBridge(next: GameActionBridge): void {
  bridge = next;
}

export function dispatchGameAction(action: GameAction): void {
  if (!bridge) {
    if (import.meta.env.DEV) {
      console.warn('[GameActionDispatcher] No bridge registered — action dropped:', action.type);
    }
    return;
  }
  bridge.dispatch(action);
}

export function getGameSnapshot(): GameStoreSnapshot {
  if (!bridge) {
    throw new Error('[GameActionDispatcher] No bridge registered');
  }
  return bridge.getSnapshot();
}

export function subscribeGameSnapshot(
  listener: (snapshot: GameStoreSnapshot) => void,
): () => void;
export function subscribeGameSnapshot<T>(
  listener: (snapshot: GameStoreSnapshot) => void,
  options: GameSnapshotSubscribeOptions<T>,
): () => void;
export function subscribeGameSnapshot<T>(
  listener: (snapshot: GameStoreSnapshot) => void,
  options?: GameSnapshotSubscribeOptions<T>,
): () => void {
  if (!bridge) {
    throw new Error('[GameActionDispatcher] No bridge registered');
  }
  return bridge.subscribe(listener, options);
}

export function tryAddInventoryItem(item: InventoryItem): boolean {
  if (!bridge) return false;
  return bridge.tryAddItem(item);
}

export function tryActivatePoemPower(poemId: string): boolean {
  if (!bridge) return false;
  return bridge.tryActivatePoemPower(poemId);
}

/** Test helper — reset bridge between unit tests. */
export function resetGameActionBridge(): void {
  bridge = null;
}
