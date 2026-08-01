/* ─── Volodka RPG – store↔engine action bridge (shared layer) ─── */
/* Engine dispatches typed actions; store registers handler at bootstrap.
 * Lives in shared/ so neither store nor engine owns the other at import time. */

import type {
  SceneId,
  QuestState,
  TrainablePlayerSkill,
  InventoryItem,
} from '@/shared/types/game';
import type { GamePhase } from '@/shared/gamePhase';
import type { NotificationType } from '@/shared/types/notifications';
import type { ActiveTTLFlagMap } from '@/shared/activeTTLFlags';

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
  goodKarmaStreak: number;
  badKarmaStreak: number;
}

/** Read-only snapshot for engine systems that observe game state. */
export interface GameStoreSnapshot {
  mode: GamePhase;
  currentNodeId: string | null;
  showStoryOverlay: boolean;
  exploration: {
    currentSceneId: SceneId;
    playerPosition: [number, number, number];
    timeOfDay: number;
    interactiveObjectStates: Record<string, boolean>;
  };
  playerState: {
    flags: Record<string, boolean>;
    inventory: Array<{ id: string }>;
    skills: Record<TrainablePlayerSkill, number>;
    energy: number;
    karma: number;
    stress: number;
    visitedNodes: string[];
    equippedThoughtIds: string[];
    progression: {
      level: number;
      currentAct: number;
      skillPoints: number;
      unlockedSkills: string[];
      unlockedPerks: string[];
      perkPoints: number;
    };
    rngSeed?: number;
    combatEncounterSeq?: number;
    /** JSON-stringified choice log (populated by narrativeChoiceExecutor). */
    choiceLog: string[];
    /** JSON-stringified moral choice log. */
    moralChoices: string[];
  };
  collectedPoems: string[];
  quests: QuestState[];
  activeTTLFlags: ActiveTTLFlagMap;
  poemPowers: Record<string, { lastUsed: number; cooldownHours: number }>;
  npcRelations: Array<{ npcId: string; value: number }>;
  unlockedAchievements: Array<{ id: string; unlockedAt: number }>;
  achievementProgress: AchievementProgressSnapshot;
  diegeticNarrative: { nodeId: string; kind: string } | null;
  activeCutsceneId: string | null;
  triggeredCutscenes: string[];
  lastUsedPoemId: string | null;
  lastUsedPoemTimestamp: number | null;
  pendingPoemReadingId: string | null;
  /** World weather — locomotion / FX readers use snapshot, not store import. */
  weatherEnabled: boolean;
  rainIntensity: number;
  /** Acquired thought cabinet IDs — used by engine for poem-gated thought checks. */
  acquiredThoughtIds: string[];
}

/** Typed mutations engine may request from the store. */
export type GameAction =
  | { type: 'quest/completeObjective'; questId: string; objectiveId: string }
  | { type: 'quest/complete'; questId: string }
  | { type: 'quest/completeAndApplyRewards'; questId: string }
  | { type: 'quest/fail'; questId: string; reason?: string }
  | { type: 'quest/retry'; questId: string }
  | { type: 'game/newGamePlus' }
  | {
      type: 'game/resetForNewPlaythrough';
      preserveAchievements?: boolean;
      skipIntro?: boolean;
    }
  | { type: 'game/save'; source?: 'auto' | 'manual' }
  | { type: 'quest/activate'; questId: string }
  | { type: 'quest/setHoursElapsed'; questId: string; hoursElapsed: number }
  | { type: 'quest/syncWallClockAnchors' }
  | { type: 'player/addSkill'; skill: TrainablePlayerSkill; amount: number }
  | { type: 'player/addEnergy'; amount: number }
  | { type: 'player/addStress'; amount: number }
  | { type: 'player/addKarma'; amount: number }
  | { type: 'player/addXp'; amount: number }
  | { type: 'player/addCredits'; amount: number }
  | { type: 'player/setFlag'; key: string; value: boolean }
  | { type: 'player/setRngSeed'; seed: number }
  | { type: 'player/bumpCombatEncounterSeq' }
  | { type: 'player/setNpcRelation'; npcId: string; delta: number }
  | { type: 'player/logChoice'; nodeId: string; choiceText: string; kind: 'story' | 'dialogue' }
  | { type: 'player/logMoralChoice'; nodeId: string; choiceText: string }
  | { type: 'poem/upsertTTLFlag'; flag: ActiveTTLFlagSnapshot }
  | { type: 'poem/upsertTTLFlags'; flags: ActiveTTLFlagSnapshot[] }
  | { type: 'poem/removeTTLFlags'; keys: string[] }
  | { type: 'poem/clearAllEffects' }
  | { type: 'poem/recordLastUsed'; poemId: string; timestamp: number }
  | { type: 'poem/setPendingReading'; poemId: string | null }
  | { type: 'story/setCombatActive'; active: boolean }
  | { type: 'story/setIntroActive'; active: boolean }
  | { type: 'story/setMainMenuOpen'; open: boolean }
  | { type: 'story/setCurrentNodeId'; nodeId: string }
  | { type: 'story/setShowStoryOverlay'; show: boolean }
  | { type: 'story/openNarrativeOverlay'; nodeId: string; kind?: 'story' | 'dialogue' }
  | { type: 'story/closeNarrativeOverlay' }
  | { type: 'story/openDiegeticNarrative'; nodeId: string; kind?: 'story' | 'dialogue' }
  | { type: 'story/closeDiegeticNarrative' }
  | { type: 'story/visitNode'; nodeId: string }
  | { type: 'story/advanceAct' }
  | { type: 'inventory/addItem'; item: InventoryItem }
  | { type: 'inventory/removeItem'; itemId: string; quantity?: number }
  | { type: 'world/collectPoem'; poemId: string }
  | { type: 'world/upsertHintFlag'; flag: ActiveTTLFlagSnapshot }
  | { type: 'lore/discover'; entryId: string }
  | { type: 'achievement/unlock'; achievementId: string }
  | { type: 'achievement/trackSceneVisit'; sceneId: string }
  | { type: 'achievement/trackNightHour' }
  | { type: 'achievement/trackCombatVictory'; enemyType: string; combo: number }
  | { type: 'achievement/resetConsecutiveVictories' }
  | { type: 'achievement/trackMaxCombo'; comboCount: number }
  | { type: 'achievement/trackCriticalHit' }
  | { type: 'achievement/trackPoemPowerInCombat' }
  | { type: 'achievement/trackKarmaChoice'; karmaDelta: number }
  | {
      type: 'achievement/batchCheckProgress';
      sceneVisit?: string;
      trackNightHour?: boolean;
    }
  | { type: 'skill/unlockTreeNode'; skillId: string }
  | { type: 'notification/push'; notificationType: NotificationType; text: string }
  | { type: 'notification/dismiss'; id: string }
  | { type: 'exploration/toggleInteractiveObject'; objectId: string }
  | {
      type: 'exploration/applySceneTransition';
      targetScene: SceneId;
      spawnAt: [number, number, number];
    }
  | { type: 'cutscene/clear' }
  | { type: 'phase/clearGameplayFlags' }
  | { type: 'journal/addThought'; text: string; sceneId: string }
  | { type: 'thoughtCabinet/acquire'; thoughtId: string }
  | { type: 'thoughtCabinet/equip'; thoughtId: string }
  | { type: 'thoughtCabinet/unequip'; thoughtId: string };

export interface GameSnapshotSubscribeOptions<T> {
  selector: (snapshot: GameStoreSnapshot) => T;
  equalityFn: (a: T, b: T) => boolean;
}

export interface GameActionBridge {
  dispatch(action: GameAction): void;
  getSnapshot(): GameStoreSnapshot;
  subscribe(listener: (snapshot: GameStoreSnapshot) => void): () => void;
  subscribe<T>(
    listener: (selected: T) => void,
    options: GameSnapshotSubscribeOptions<T>,
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
    if (import.meta.env?.DEV) {
      console.warn('[GameActionBridge] No bridge registered — action dropped:', action.type);
    }
    return;
  }
  bridge.dispatch(action);
}

export function getGameSnapshot(): GameStoreSnapshot {
  if (!bridge) {
    throw new Error('[GameActionBridge] No bridge registered');
  }
  return bridge.getSnapshot();
}

export function subscribeGameSnapshot(
  listener: (snapshot: GameStoreSnapshot) => void,
): () => void;
export function subscribeGameSnapshot<T>(
  listener: (selected: T) => void,
  options: GameSnapshotSubscribeOptions<T>,
): () => void;
export function subscribeGameSnapshot<T>(
  listener: ((snapshot: GameStoreSnapshot) => void) | ((selected: T) => void),
  options?: GameSnapshotSubscribeOptions<T>,
): () => void {
  if (!bridge) {
    throw new Error('[GameActionBridge] No bridge registered');
  }
  if (options) {
    return bridge.subscribe(listener as (selected: T) => void, options);
  }
  return bridge.subscribe(listener as (snapshot: GameStoreSnapshot) => void);
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
