// ============================================
// SAVE MANAGER — Server-side save/load logic
// ============================================
// Версионированные сохранения, авто-сохранение,
// снапшоты прогресса. Работает с Prisma + localStorage.

import type { PlayerState, NPCRelation, SaveData } from '@/shared/types/game';
import type { FactionReputation } from '@/shared/types/factions';
import type { ExplorationState } from '@/shared/types/rpg';
import { getItemById } from '@/data/items';
import type { InventoryItem } from '@/shared/types/game';

// ============================================
// TYPES
// ============================================

export interface SavePayload {
  version: number;
  playerState: PlayerState;
  currentNodeId: string;
  npcRelations: NPCRelation[];
  inventory: Array<{ itemId: string; quantity: number; obtainedAt: number }>;
  collectedPoemIds: string[];
  unlockedAchievementIds: string[];
  unlockedLocations: string[];
  gameMode: string;
  exploration: ExplorationState;
  activeQuestIds: string[];
  completedQuestIds: string[];
  questProgress: Record<string, Record<string, number>>;
  factionReputations: Record<string, FactionReputation>;
  savedAt: number;
}

export interface SaveMetadata {
  id: string;
  slot: number;
  label?: string;
  version: number;
  currentNodeId: string;
  playTime: number;
  act: number;
  path: string;
  mood: number;
  creativity: number;
  stability: number;
  stress: number;
  energy: number;
  savedAt: number;
}

export const CURRENT_SAVE_VERSION = 5;

// ============================================
// LOCAL STORAGE PERSISTENCE (client-side)
// ============================================

const SAVE_KEY = 'volodka_save_v5';
const SAVE_SLOTS_KEY = 'volodka_slots';

/** Serialize game state for storage */
export function serializeGameState(state: {
  playerState: PlayerState;
  currentNodeId: string;
  npcRelations: NPCRelation[];
  inventory: InventoryItem[];
  collectedPoemIds: string[];
  unlockedAchievementIds: string[];
  unlockedLocations: string[];
  gameMode: string;
  exploration: ExplorationState;
  activeQuestIds: string[];
  completedQuestIds: string[];
  questProgress: Record<string, Record<string, number>>;
  factionReputations: Record<string, FactionReputation>;
}): SavePayload {
  return {
    version: CURRENT_SAVE_VERSION,
    playerState: state.playerState,
    currentNodeId: state.currentNodeId,
    npcRelations: state.npcRelations,
    inventory: state.inventory.map((i) => ({
      itemId: i.item.id,
      quantity: i.quantity,
      obtainedAt: i.obtainedAt,
    })),
    collectedPoemIds: state.collectedPoemIds,
    unlockedAchievementIds: state.unlockedAchievementIds,
    unlockedLocations: state.unlockedLocations,
    gameMode: state.gameMode,
    exploration: state.exploration,
    activeQuestIds: state.activeQuestIds,
    completedQuestIds: state.completedQuestIds,
    questProgress: state.questProgress,
    factionReputations: state.factionReputations,
    savedAt: Date.now(),
  };
}

/** Reconstruct inventory from saved item IDs */
export function reconstructInventory(
  savedItems: Array<{ itemId?: string; item?: { id: string }; quantity: number; obtainedAt: number }>
): InventoryItem[] {
  return (savedItems || []).map((saved) => {
    const itemId = saved.itemId || saved.item?.id || '';
    const itemData = getItemById(itemId);
    return {
      item: itemData || {
        id: itemId,
        name: itemId,
        description: '',
        type: 'artifact' as const,
        rarity: 'common' as const,
        icon: '\uD83D\uDCE6',
        droppable: true,
        stackable: true,
        maxStack: 99,
      },
      quantity: saved.quantity || 1,
      obtainedAt: saved.obtainedAt || Date.now(),
    };
  });
}

// ============================================
// AUTO-SAVE MANAGER
// ============================================

export class AutoSaveManager {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastSaveTime = 0;
  private isDirty = false;

  /** Start auto-save with interval (default 2 minutes) */
  start(getState: () => unknown, intervalMs = 120_000): void {
    this.stop();
    this.intervalId = setInterval(() => {
      if (this.isDirty) {
        this.save(getState);
        this.isDirty = false;
      }
    }, intervalMs);
  }

  /** Stop auto-save */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Mark state as dirty (needs saving) */
  markDirty(): void {
    this.isDirty = true;
  }

  /** Force an immediate save */
  save(getState: () => unknown): void {
    const state = getState() as Record<string, unknown>;
    if (!state) return;

    try {
      const serialized = serializeGameState({
        playerState: state.playerState as PlayerState,
        currentNodeId: state.currentNodeId as string,
        npcRelations: state.npcRelations as NPCRelation[],
        inventory: state.inventory as InventoryItem[],
        collectedPoemIds: state.collectedPoemIds as string[],
        unlockedAchievementIds: state.unlockedAchievementIds as string[],
        unlockedLocations: state.unlockedLocations as string[],
        gameMode: state.gameMode as string,
        exploration: state.exploration as ExplorationState,
        activeQuestIds: state.activeQuestIds as string[],
        completedQuestIds: state.completedQuestIds as string[],
        questProgress: state.questProgress as Record<string, Record<string, number>>,
        factionReputations: state.factionReputations as Record<string, FactionReputation>,
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(SAVE_KEY, JSON.stringify(serialized));
      }
      this.lastSaveTime = Date.now();
    } catch (err) {
      console.error('[AutoSave] Failed:', err);
    }
  }

  /** Load the most recent save from localStorage */
  load(): SavePayload | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SavePayload;
    } catch {
      return null;
    }
  }

  /** Get the last save timestamp */
  getLastSaveTime(): number {
    return this.lastSaveTime;
  }
}

// Singleton
export const autoSaveManager = new AutoSaveManager();
