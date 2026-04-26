import { usePlayerStore } from './playerStore';
import { useWorldStore } from './worldStore';
import { useQuestStore } from './questMetaStore';
import { useFactionStore } from './factionStore';
import { useInventoryStore } from './inventoryStore';
import { useAppStore } from './appStore';
import { useGamePhaseStore } from './gamePhaseStore';
import { eventBus } from '@/engine/EventBus';
import { getExplorationLivePlayerPositionOrNull } from '@/lib/explorationLivePlayerBridge';
import {
  buildLocalSavePayload,
  estimateJsonUtf8Bytes,
  LOCAL_SAVE_WARN_BYTES,
} from '@/lib/persistedGameSnapshot';
import { sanitizeExplorationSceneId } from '@/config/scenes';
import { VERTICAL_SLICE_ENTRY_NODE_ID } from '@/data/verticalSliceStoryNodes';
import type { GameMode, ExplorationState, NPCState, PlayerPosition } from '@/data/rpgTypes';
import type { PlayerState, ChoiceLogEntry, NPCRelation } from '@/data/types';
import type { FactionId, FactionReputation } from '@/shared/types/factions';
import { experienceRequiredForNextLevel } from '@/lib/rpgLeveling';
import { INITIAL_PLAYER } from './playerStore';
import { getItemById } from '@/data/items';

const SAVE_KEY = 'volodka_save_v3';

export type SaveGameOptions = {
  source?: 'auto' | 'manual';
};

const getLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const saveGame = (options?: SaveGameOptions) => {
  const storage = getLocalStorage();
  if (!storage) return;

  const worldStore = useWorldStore.getState();
  const playerStore = usePlayerStore.getState();
  const questStore = useQuestStore.getState();
  const factionStore = useFactionStore.getState();
  const inventoryStore = useInventoryStore.getState();

  const live = getExplorationLivePlayerPositionOrNull();
  if (live && worldStore.gameMode === 'exploration') {
    worldStore.setPlayerPosition(live);
  }

  const payload = buildLocalSavePayload({
    playerState: playerStore.playerState,
    currentNodeId: playerStore.currentNodeId,
    npcRelations: worldStore.npcRelations,
    inventory: inventoryStore.inventory,
    collectedPoemIds: inventoryStore.collectedPoemIds,
    unlockedAchievementIds: inventoryStore.unlockedAchievementIds,
    unlockedLocations: worldStore.unlockedLocations,
    gameMode: worldStore.gameMode,
    exploration: worldStore.exploration,
    activeQuestIds: questStore.activeQuestIds,
    completedQuestIds: questStore.completedQuestIds,
    questProgress: questStore.questProgress,
    factionReputations: factionStore.factionReputations,
    choiceLog: playerStore.choiceLog || [],
  });

  const json = JSON.stringify(payload);
  if (typeof console !== 'undefined' && console.warn) {
    const bytes = estimateJsonUtf8Bytes(payload);
    if (bytes > LOCAL_SAVE_WARN_BYTES) {
      console.warn(
        `[Volodka] Сохранение крупное (~${(bytes / 1_000_000).toFixed(2)} MB UTF-8). Риск лимита localStorage.`,
      );
    }
  }
  storage.setItem(SAVE_KEY, json);
  eventBus.emit('game:saved', {
    timestamp: Date.now(),
    source: options?.source ?? 'manual',
  });
};

function normalizePlayerStateForLoad(raw: PlayerState | undefined): PlayerState {
  const INITIAL_SKILLS = INITIAL_PLAYER.skills;
  const merged: PlayerState = raw
    ? { ...INITIAL_PLAYER, ...raw, skills: { ...INITIAL_SKILLS, ...raw.skills } }
    : { ...INITIAL_PLAYER };
  let level =
    typeof merged.characterLevel === 'number' && merged.characterLevel >= 1
      ? Math.floor(merged.characterLevel)
      : 1;
  let xp = typeof merged.experience === 'number' && merged.experience >= 0 ? merged.experience : 0;
  let toNext =
    typeof merged.experienceToNextLevel === 'number' && merged.experienceToNextLevel > 0
      ? merged.experienceToNextLevel
      : experienceRequiredForNextLevel(level);
  while (toNext > 0 && xp >= toNext) {
    xp -= toNext;
    level += 1;
    toNext = experienceRequiredForNextLevel(level);
  }
  return {
    ...merged,
    characterLevel: level,
    experience: xp,
    experienceToNextLevel: toNext,
  };
}

const createFallbackInventoryItem = (itemId: string) => ({
  id: itemId,
  name: itemId,
  description: '',
  type: 'artifact' as const,
  rarity: 'common' as const,
  icon: '📦',
  droppable: true,
  stackable: true,
  maxStack: 99,
});

const deserializeInventory = (entries: any[] = []) => {
  return entries.map((saved) => {
    const itemId = saved.itemId || saved.item?.id || '';
    const itemData = getItemById(itemId);
    return {
      item: itemData || createFallbackInventoryItem(itemId),
      quantity: saved.quantity || 1,
      obtainedAt: saved.obtainedAt || Date.now(),
    };
  });
};

const normalizeGameModeForLoad = (raw: unknown): GameMode => {
  if (raw === 'visual-novel') return 'exploration';
  if (typeof raw === 'string' && ['exploration', 'dialogue', 'cutscene', 'combat'].includes(raw)) return raw as GameMode;
  return 'exploration';
};

const loadSavedState = () => {
  if (typeof window === 'undefined') return null;
  const storage = getLocalStorage();
  if (!storage) return null;
  const saved = storage.getItem(SAVE_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

export const loadGame = () => {
  const savedData = loadSavedState();
  if (!savedData) return false;

  const playerState = normalizePlayerStateForLoad(savedData.playerState);
  const currentNodeId = typeof savedData.currentNodeId === 'string' && savedData.currentNodeId.length > 0 ? savedData.currentNodeId : VERTICAL_SLICE_ENTRY_NODE_ID;
  const choiceLog = Array.isArray(savedData.choiceLog) ? savedData.choiceLog.slice(-48) : [];
  
  usePlayerStore.setState({ playerState, currentNodeId, choiceLog });
  
  if (savedData.npcRelations) useWorldStore.setState({ npcRelations: savedData.npcRelations });
  if (savedData.unlockedLocations) useWorldStore.setState({ unlockedLocations: savedData.unlockedLocations });
  if (savedData.gameMode) useWorldStore.setState({ gameMode: normalizeGameModeForLoad(savedData.gameMode) });
  
  if (savedData.exploration) {
    const raw = savedData.exploration;
    useWorldStore.setState(s => ({
      exploration: {
        ...s.exploration,
        ...raw,
        currentSceneId: sanitizeExplorationSceneId(raw.currentSceneId),
        npcStates: raw.npcStates || {},
      }
    }));
  }

  if (savedData.inventory) useInventoryStore.setState({ inventory: deserializeInventory(savedData.inventory) });
  if (savedData.collectedPoemIds) useInventoryStore.setState({ collectedPoemIds: savedData.collectedPoemIds });
  if (savedData.unlockedAchievementIds) useInventoryStore.setState({ unlockedAchievementIds: savedData.unlockedAchievementIds });

  if (savedData.activeQuestIds) useQuestStore.setState({ activeQuestIds: savedData.activeQuestIds });
  if (savedData.completedQuestIds) useQuestStore.setState({ completedQuestIds: savedData.completedQuestIds });
  if (savedData.questProgress) useQuestStore.setState({ questProgress: savedData.questProgress });

  if (savedData.factionReputations) useFactionStore.setState({ factionReputations: savedData.factionReputations });

  useAppStore.getState().setPhase('game');
  usePlayerStore.setState({ revealedPoemId: null });
  useGamePhaseStore.getState().completeIntroCutscene();
  eventBus.emit('game:loaded', { timestamp: Date.now() });

  return true;
};

export const resetGame = () => {
  const storage = getLocalStorage();
  usePlayerStore.getState().resetPlayer();
  useWorldStore.getState().resetWorld();
  useQuestStore.getState().resetQuests();
  useInventoryStore.getState().resetInventory();
  useFactionStore.getState().resetFactions();
  
  useAppStore.getState().setPhase('menu');
  useGamePhaseStore.getState().completeIntroCutscene();

  if (storage) {
    storage.removeItem(SAVE_KEY);
  }
};

let storageHydrationApplied = false;

export const hydrateFromLocalStorage = () => {
  if (typeof window === 'undefined' || storageHydrationApplied) return false;
  storageHydrationApplied = true;
  return loadGame();
};
