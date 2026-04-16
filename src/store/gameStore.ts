import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { 
  PlayerState, 
  PlayerSkills, 
  NPCRelation, 
  InventoryItem,
  PanicTimer,
  MoralChoice,
  ChoiceLogEntry,
} from '../data/types';
import type {
  PlayerPosition,
  NPCState,
  TriggerState,
  WorldItem,
  GameMode,
  InteractionPrompt,
  ExplorationState,
} from '../data/rpgTypes';
import type { SceneId } from '../data/types';
import type { FactionId, FactionReputation } from '../data/factions';
import { QUEST_DEFINITIONS } from '../data/quests';
import { getItemById } from '../data/items';
import { ENERGY_COSTS, INITIAL_PLAYER_ENERGY, MAX_PLAYER_ENERGY } from '@/lib/energyConfig';
import { eventBus } from '@/engine/EventBus';

export type TravelToSceneResult =
  | { ok: true }
  | { ok: false; reason: 'same_scene' | 'locked' | 'no_energy' };

export type TravelToSceneOptions = {
  /** Сцена следует за узлом сюжета — без проверки unlock и без траты энергии */
  narrativeDriven?: boolean;
  energyCost?: number;
  /** Если задано (например из useEnergySystem), отвечает за списание и побочные эффекты */
  consumeEnergy?: (amount: number) => boolean;
};

// ============================================
// INITIAL STATE - Defined inline to avoid circular imports
// ============================================

const INITIAL_SKILLS: PlayerSkills = {
  writing: 10,
  perception: 15,
  empathy: 20,
  imagination: 25,
  logic: 15,
  coding: 10,
  persuasion: 5,
  intuition: 10,
  resilience: 15,
  introspection: 10,
  skillPoints: 0,
};

const INITIAL_STATE: PlayerState = {
  mood: 50,
  creativity: 30,
  stability: 60,
  energy: INITIAL_PLAYER_ENERGY,
  karma: 50,
  selfEsteem: 40,
  stress: 0,
  panicMode: false,
  poemsCollected: [],
  path: 'none',
  act: 1,
  visitedNodes: [],
  playTime: 0,
  skills: INITIAL_SKILLS,
  collections: {
    poems: [],
    memories: [],
    secrets: [],
    achievements: [],
    endings: [],
  },
  flags: {},
  statistics: {
    choicesMade: 0,
    poemsCreated: 0,
    npcsMet: 0,
    locationsVisited: 0,
    timeInDreams: 0,
    moralChoices: [],
  },
  panicTimers: [],
};

const INITIAL_NPC_RELATIONS: NPCRelation[] = [
  { 
    id: 'maria', 
    name: 'Виктория', 
    value: 0, 
    stage: 'stranger',
    trust: 0,
    respect: 0,
    intimacy: 0,
    flags: {},
    interactions: []
  },
  { 
    id: 'alexey', 
    name: 'Алексей', 
    value: 0, 
    stage: 'stranger',
    trust: 0,
    respect: 0,
    intimacy: 0,
    flags: {},
    interactions: []
  },
  { 
    id: 'friend', 
    name: 'Денис', 
    value: 0, 
    stage: 'stranger',
    trust: 0,
    respect: 0,
    intimacy: 0,
    flags: {},
    interactions: []
  },
  {
    id: 'vera',
    name: 'Вера',
    value: 0,
    stage: 'stranger',
    trust: 0,
    respect: 0,
    intimacy: 0,
    flags: {},
    interactions: []
  },
  {
    id: 'stranger',
    name: 'Незнакомец',
    value: 0,
    stage: 'stranger',
    trust: 0,
    respect: 0,
    intimacy: 0,
    flags: {},
    interactions: []
  },
  { id: 'zarema', name: 'Заремушка (Зарема)', value: 15, stage: 'friend', trust: 20, respect: 15, intimacy: 10, flags: {}, interactions: [] },
  { id: 'albert', name: 'Альберт', value: 10, stage: 'acquaintance', trust: 15, respect: 20, intimacy: 5, flags: {}, interactions: [] },
  { id: 'district_vika', name: 'Вика с Зелёнки', value: 12, stage: 'friend', trust: 18, respect: 10, intimacy: 8, flags: {}, interactions: [] },
  { id: 'district_renata', name: 'Рената', value: 8, stage: 'acquaintance', trust: 12, respect: 10, intimacy: 6, flags: {}, interactions: [] },
  { id: 'district_damien', name: 'Дамьен', value: 8, stage: 'acquaintance', trust: 12, respect: 10, intimacy: 5, flags: {}, interactions: [] },
  { id: 'district_konstantin', name: 'Константин', value: 10, stage: 'friend', trust: 15, respect: 12, intimacy: 4, flags: {}, interactions: [] },
  { id: 'district_timur', name: 'Тимур', value: 10, stage: 'friend', trust: 14, respect: 12, intimacy: 4, flags: {}, interactions: [] },
  { id: 'district_polikarp', name: 'Поликарп', value: 12, stage: 'acquaintance', trust: 20, respect: 25, intimacy: 3, flags: {}, interactions: [] },
  { id: 'district_rimma', name: 'Римма', value: 6, stage: 'acquaintance', trust: 10, respect: 10, intimacy: 5, flags: {}, interactions: [] },
  { id: 'district_nastya', name: 'Настя', value: 6, stage: 'acquaintance', trust: 10, respect: 10, intimacy: 5, flags: {}, interactions: [] },
  { id: 'office_alexander', name: 'Александр', value: 5, stage: 'acquaintance', trust: 12, respect: 18, intimacy: 2, flags: {}, interactions: [] },
  { id: 'office_dmitry', name: 'Дмитрий', value: 8, stage: 'friend', trust: 16, respect: 14, intimacy: 3, flags: {}, interactions: [] },
  { id: 'office_andrey', name: 'Андрей (коллега)', value: 0, stage: 'stranger', trust: 8, respect: 10, intimacy: 2, flags: {}, interactions: [] },
  { id: 'office_artyom', name: 'Артём', value: 4, stage: 'acquaintance', trust: 10, respect: 16, intimacy: 2, flags: {}, interactions: [] },
];

// ============================================
// INITIAL FACTION REPUTATIONS
// ============================================

import { FACTIONS, createInitialReputation, updateReputationValue, getStandingLevel } from '../data/factions';

const INITIAL_FACTION_REPUTATIONS: Record<FactionId, FactionReputation> = {
  poets: createInitialReputation('poets'),
  it_workers: createInitialReputation('it_workers'),
  dreamers: createInitialReputation('dreamers'),
  locals: createInitialReputation('locals'),
  shadow_network: createInitialReputation('shadow_network'),
};

// ============================================
// INITIAL RPG STATE
// ============================================

const INITIAL_EXPLORATION_STATE: ExplorationState = {
  playerPosition: { x: 0, y: 1, z: 3, rotation: 0 },
  currentSceneId: 'kitchen_night',
  npcStates: {},
  triggerStates: {},
  worldItems: [],
  exploredAreas: [],
  lastSceneTransition: 0,
};

// ============================================
// TYPES
// ============================================

interface GameState {
  // Main state
  playerState: PlayerState;
  currentNodeId: string;
  npcRelations: NPCRelation[];
  inventory: InventoryItem[];
  
  // Flags
  revealedPoemId: string | null;
  collectedPoemIds: string[];
  unlockedAchievementIds: string[];
  unlockedLocations: string[];
  
  // Panic timers
  activePanicTimer: PanicTimer | null;
  
  // UI state
  phase: 'loading' | 'intro' | 'menu' | 'game';
  
  // RPG state
  gameMode: GameMode;
  exploration: ExplorationState;
  currentNPCId: string | null;
  interactionPrompt: InteractionPrompt | null;
  
  // Quest state
  activeQuestIds: string[];
  completedQuestIds: string[];
  questProgress: Record<string, Record<string, number>>; // questId -> objectiveId -> value

  /** Журнал последних выборов в визуальной новелле */
  choiceLog: ChoiceLogEntry[];
  
  // Faction reputation
  factionReputations: Record<FactionId, FactionReputation>;
  
  // Actions
  setPhase: (phase: GameState['phase']) => void;
  setCurrentNode: (nodeId: string) => void;
  
  // Game mode
  setGameMode: (mode: GameMode) => void;
  
  // Stats
  addStat: (stat: 'mood' | 'creativity' | 'stability' | 'energy' | 'karma' | 'selfEsteem', amount: number) => void;
  addStress: (amount: number) => void;
  reduceStress: (amount: number) => void;
  triggerPanicMode: () => void;
  clearPanicMode: () => void;

  // Play time
  incrementPlayTime: () => void;
  setPlayerAct: (act: number) => void;
  
  // Skills
  addSkill: (skill: keyof PlayerSkills, amount: number) => void;
  addSkillPoints: (points: number) => void;
  
  // Inventory
  addItem: (itemId: string, quantity?: number) => void;
  removeItem: (itemId: string, quantity?: number) => void;
  hasItem: (itemId: string) => boolean;
  
  // NPC
  updateNPCRelation: (npcId: string, change: number) => void;
  
  // NPC RPG
  setNPCState: (npcId: string, state: NPCState) => void;
  setCurrentNPC: (npcId: string | null) => void;
  
  // Poems
  collectPoem: (poemId: string) => void;
  revealPoem: (poemId: string | null) => void;
  
  // Achievements
  unlockAchievement: (achievementId: string) => void;
  
  // Flags
  setFlag: (flag: string) => void;
  unsetFlag: (flag: string) => void;
  hasFlag: (flag: string) => boolean;
  
  // Visit node
  visitNode: (nodeId: string) => void;
  
  // Panic timers
  startPanicTimer: (timer: PanicTimer) => void;
  clearPanicTimer: () => void;
  
  // Moral choices
  addMoralChoice: (choice: MoralChoice) => void;
  
  // RPG Actions
  setPlayerPosition: (position: PlayerPosition) => void;
  setCurrentScene: (sceneId: SceneId) => void;
  travelToScene: (sceneId: SceneId, options?: TravelToSceneOptions) => TravelToSceneResult;
  setTriggerState: (triggerId: string, state: TriggerState) => void;
  addWorldItem: (item: WorldItem) => void;
  collectWorldItem: (itemId: string) => void;
  setInteractionPrompt: (prompt: InteractionPrompt | null) => void;
  addExploredArea: (areaId: string) => void;
  
  // Quest Actions
  activateQuest: (questId: string) => void;
  completeQuest: (questId: string) => void;
  updateQuestObjective: (questId: string, objectiveId: string, value?: number) => void;
  incrementQuestObjective: (questId: string, objectiveId: string) => void;
  isQuestActive: (questId: string) => boolean;
  isQuestCompleted: (questId: string) => boolean;
  getQuestProgress: (questId: string) => Record<string, number>;
  
  // Faction Actions
  updateFactionReputation: (factionId: FactionId, change: number) => void;
  getFactionReputation: (factionId: FactionId) => number;
  completeQuestForFaction: (questId: string, factionId: FactionId) => void;

  pushChoiceLog: (entry: Omit<ChoiceLogEntry, 'id' | 'at'> & { id?: string; at?: number }) => void;
  
  // Save/Load
  saveGame: () => void;
  loadGame: () => boolean;
  resetGame: () => void;
  /** Merge persisted snapshot from localStorage (client-only; call once after mount). */
  hydrateFromLocalStorage: () => void;
}

// ============================================
// UTILITIES
// ============================================

const clamp = (value: number, min: number, max: number) => 
  Math.max(min, Math.min(max, value));

const SAVE_KEY = 'volodka_save_v3';
const DEFAULT_ACTIVE_QUEST_IDS = ['main_goal'] as const;

const getNPCStage = (value: number): NPCRelation['stage'] => {
  if (value >= 50) return 'close';
  if (value >= 20) return 'friend';
  if (value >= 0) return 'acquaintance';
  if (value < -20) return 'estranged';
  return 'stranger';
};

// Safe localStorage check
const getLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

// Load saved state from localStorage
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

type SavedInventoryEntry = {
  itemId?: string;
  item?: { id: string };
  quantity?: number;
  obtainedAt?: number;
};

type SavedGameData = {
  playerState?: PlayerState;
  currentNodeId?: string;
  npcRelations?: NPCRelation[];
  inventory?: SavedInventoryEntry[];
  collectedPoemIds?: string[];
  unlockedAchievementIds?: string[];
  unlockedLocations?: string[];
  gameMode?: GameMode;
  exploration?: ExplorationState;
  activeQuestIds?: string[];
  completedQuestIds?: string[];
  questProgress?: Record<string, Record<string, number>>;
  factionReputations?: Record<FactionId, FactionReputation>;
  choiceLog?: ChoiceLogEntry[];
};

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

const deserializeInventory = (entries: SavedInventoryEntry[] = []): InventoryItem[] => {
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

/** Ensures auto-load runs at most once per tab (Strict Mode double-invokes effects in dev). */
let storageHydrationApplied = false;

const normalizeLoadedState = (data: SavedGameData) => ({
  playerState: data.playerState || INITIAL_STATE,
  currentNodeId: data.currentNodeId || 'start',
  npcRelations: data.npcRelations || INITIAL_NPC_RELATIONS,
  inventory: deserializeInventory(data.inventory),
  collectedPoemIds: data.collectedPoemIds || [],
  unlockedAchievementIds: data.unlockedAchievementIds || [],
  unlockedLocations: data.unlockedLocations || [],
  gameMode: data.gameMode || 'visual-novel',
  exploration: data.exploration || INITIAL_EXPLORATION_STATE,
  activeQuestIds: data.activeQuestIds || [...DEFAULT_ACTIVE_QUEST_IDS],
  completedQuestIds: data.completedQuestIds || [],
  questProgress: data.questProgress || {},
  factionReputations: data.factionReputations || INITIAL_FACTION_REPUTATIONS,
  choiceLog: Array.isArray(data.choiceLog)
    ? data.choiceLog
        .filter(
          (e): e is ChoiceLogEntry =>
            e != null &&
            typeof e === 'object' &&
            typeof (e as ChoiceLogEntry).fromNodeId === 'string' &&
            typeof (e as ChoiceLogEntry).toNodeId === 'string',
        )
        .slice(-48)
    : [],
});

// ============================================
// ZUSTAND STORE - Proper hook pattern
// ============================================

export const useGameStore = create<GameState>()((set, get) => ({
  // Initial state
  playerState: INITIAL_STATE,
  currentNodeId: 'start',
  npcRelations: INITIAL_NPC_RELATIONS,
  inventory: [],
  revealedPoemId: null,
  collectedPoemIds: [],
  unlockedAchievementIds: [],
  unlockedLocations: [],
  activePanicTimer: null,
  phase: 'loading',
  
  // RPG initial state
  gameMode: 'visual-novel',
  exploration: INITIAL_EXPLORATION_STATE,
  currentNPCId: null,
  interactionPrompt: null,
  
  // Quest initial state
  activeQuestIds: [...DEFAULT_ACTIVE_QUEST_IDS],
  completedQuestIds: [],
  questProgress: {},

  choiceLog: [],
  
  // Faction initial state
  factionReputations: INITIAL_FACTION_REPUTATIONS,
  
  // Phase
  setPhase: (phase) => set({ phase }),
  
  // Game mode
  setGameMode: (mode) => set({ gameMode: mode }),
  
  // Node
  setCurrentNode: (nodeId) => {
    const { playerState } = get();
    set({ 
      currentNodeId: nodeId,
      playerState: {
        ...playerState,
        visitedNodes: playerState.visitedNodes.includes(nodeId) 
          ? playerState.visitedNodes 
          : [...playerState.visitedNodes, nodeId]
      }
    });
  },
  
  // Stats
  addStat: (stat, amount) => {
    const { playerState } = get();
    const currentValue = playerState[stat];
    if (typeof currentValue === 'number') {
      set({
        playerState: {
          ...playerState,
          [stat]: clamp(currentValue + amount, 0, stat === 'energy' ? MAX_PLAYER_ENERGY : 100)
        }
      });
    }
  },
  
  // Stress
  addStress: (amount) => {
    const { playerState } = get();
    const newStress = clamp(playerState.stress + amount, 0, 100);
    const panicMode = newStress >= 100;
    
    set({
      playerState: {
        ...playerState,
        stress: newStress,
        panicMode
      }
    });
    
    if (panicMode && !playerState.panicMode) {
      console.log('🔥 KERNEL PANIC TRIGGERED!');
    }
  },
  
  reduceStress: (amount) => {
    const { playerState } = get();
    const newStress = clamp(playerState.stress - amount, 0, 100);
    
    set({
      playerState: {
        ...playerState,
        stress: newStress,
        panicMode: newStress >= 100
      }
    });
  },
  
  triggerPanicMode: () => {
    const { playerState } = get();
    set({
      playerState: {
        ...playerState,
        stress: 100,
        panicMode: true
      }
    });
  },
  
  clearPanicMode: () => {
    const { playerState } = get();
    set({
      playerState: {
        ...playerState,
        stress: Math.max(0, playerState.stress - 30),
        panicMode: false
      }
    });
  },

  // Play time
  incrementPlayTime: () => {
    const { playerState } = get();
    set({
      playerState: {
        ...playerState,
        playTime: playerState.playTime + 1
      }
    });
  },

  setPlayerAct: (act) => {
    const { playerState } = get();
    set({
      playerState: {
        ...playerState,
        act: act as 1 | 2 | 3 | 4
      }
    });
  },

  // Skills
  addSkill: (skill, amount) => {
    const { playerState } = get();
    const currentSkill = playerState.skills[skill] as number;
    set({
      playerState: {
        ...playerState,
        skills: {
          ...playerState.skills,
          [skill]: clamp(currentSkill + amount, 0, 100)
        }
      }
    });
  },
  
  addSkillPoints: (points) => {
    const { playerState } = get();
    set({
      playerState: {
        ...playerState,
        skills: {
          ...playerState.skills,
          skillPoints: playerState.skills.skillPoints + points
        }
      }
    });
  },
  
  // Inventory — uses real item data from items.ts
  addItem: (itemId, quantity = 1) => {
    const { inventory } = get();
    const itemData = getItemById(itemId);
    
    // Fallback: if item not found in database, create a basic entry
    const item = itemData || {
      id: itemId,
      name: itemId,
      description: '',
      type: 'artifact' as const,
      rarity: 'common' as const,
      icon: '📦',
      droppable: true,
      stackable: true,
      maxStack: 99,
    };
    
    const existing = inventory.find(i => i.item.id === itemId);
    
    if (existing) {
      const maxStack = item.maxStack || 99;
      const newQuantity = Math.min(existing.quantity + quantity, maxStack);
      set({
        inventory: inventory.map(i => 
          i.item.id === itemId 
            ? { ...i, quantity: newQuantity }
            : i
        )
      });
    } else {
      set({
        inventory: [...inventory, {
          item,
          quantity: Math.min(quantity, item.maxStack || 99),
          obtainedAt: Date.now()
        }]
      });
    }
  },
  
  removeItem: (itemId, quantity = 1) => {
    const { inventory } = get();
    const existing = inventory.find(i => i.item.id === itemId);
    
    if (existing && existing.quantity > quantity) {
      set({
        inventory: inventory.map(i => 
          i.item.id === itemId 
            ? { ...i, quantity: i.quantity - quantity }
            : i
        )
      });
    } else {
      set({
        inventory: inventory.filter(i => i.item.id !== itemId)
      });
    }
  },
  
  hasItem: (itemId) => {
    return get().inventory.some(i => i.item.id === itemId);
  },
  
  // NPC Relations
  updateNPCRelation: (npcId, change) => {
    const { npcRelations } = get();
    set({
      npcRelations: npcRelations.map(rel => {
        if (rel.id === npcId) {
          const newValue = clamp(rel.value + change, -100, 100);
          return {
            ...rel,
            value: newValue,
            stage: getNPCStage(newValue)
          };
        }
        return rel;
      })
    });
  },
  
  // NPC RPG State
  setNPCState: (npcId, state) => {
    const { exploration } = get();
    set({
      exploration: {
        ...exploration,
        npcStates: {
          ...exploration.npcStates,
          [npcId]: state
        }
      }
    });
  },
  
  setCurrentNPC: (npcId) => set({ currentNPCId: npcId }),
  
  // Poems
  collectPoem: (poemId) => {
    const { collectedPoemIds, playerState } = get();
    if (!collectedPoemIds.includes(poemId)) {
      set({
        collectedPoemIds: [...collectedPoemIds, poemId],
        playerState: {
          ...playerState,
          poemsCollected: [...playerState.poemsCollected, poemId]
        }
      });
    }
  },
  
  revealPoem: (poemId) => set({ revealedPoemId: poemId }),
  
  // Achievements
  unlockAchievement: (achievementId) => {
    const { unlockedAchievementIds } = get();
    if (!unlockedAchievementIds.includes(achievementId)) {
      set({
        unlockedAchievementIds: [...unlockedAchievementIds, achievementId]
      });
    }
  },
  
  // Flags
  setFlag: (flag) => {
    const { playerState } = get();
    set({
      playerState: {
        ...playerState,
        flags: { ...playerState.flags, [flag]: true }
      }
    });
  },
  
  unsetFlag: (flag) => {
    const { playerState } = get();
    const newFlags = { ...playerState.flags };
    delete newFlags[flag];
    set({
      playerState: {
        ...playerState,
        flags: newFlags
      }
    });
  },
  
  hasFlag: (flag) => {
    return get().playerState.flags[flag] === true;
  },
  
  // Visit node
  visitNode: (nodeId) => {
    const { playerState } = get();
    if (!playerState.visitedNodes.includes(nodeId)) {
      set({
        playerState: {
          ...playerState,
          visitedNodes: [...playerState.visitedNodes, nodeId]
        }
      });
    }
  },
  
  // Panic timers
  startPanicTimer: (timer) => set({ activePanicTimer: timer }),
  clearPanicTimer: () => set({ activePanicTimer: null }),
  
  // Moral choices
  addMoralChoice: (choice) => {
    const { playerState } = get();
    set({
      playerState: {
        ...playerState,
        statistics: {
          ...playerState.statistics,
          moralChoices: [...playerState.statistics.moralChoices, choice]
        }
      }
    });
  },
  
  // RPG Actions
  setPlayerPosition: (position) => {
    const { exploration } = get();
    set({
      exploration: {
        ...exploration,
        playerPosition: position
      }
    });
  },
  
  setCurrentScene: (sceneId) => {
    const { exploration } = get();
    set({
      exploration: {
        ...exploration,
        currentSceneId: sceneId,
        lastSceneTransition: Date.now()
      }
    });
  },

  travelToScene: (sceneId, options = {}) => {
    const narrative = options.narrativeDriven === true;
    const { exploration, unlockedLocations, playerState } = get();

    if (narrative) {
      set({
        exploration: {
          ...exploration,
          currentSceneId: sceneId,
          lastSceneTransition: Date.now(),
        },
      });
      return { ok: true as const };
    }

    if (exploration.currentSceneId === sceneId) {
      return { ok: false as const, reason: 'same_scene' as const };
    }

    if (unlockedLocations.length > 0 && !unlockedLocations.includes(sceneId)) {
      return { ok: false as const, reason: 'locked' as const };
    }

    const cost = options.energyCost ?? ENERGY_COSTS.sceneTravel;
    const consume = options.consumeEnergy;

    if (cost > 0) {
      if (consume) {
        if (!consume(cost)) {
          return { ok: false as const, reason: 'no_energy' as const };
        }
      } else if (playerState.energy < cost) {
        get().addStress(5);
        eventBus.emit('stat:changed', {
          stat: 'energy',
          oldValue: playerState.energy,
          newValue: playerState.energy,
          delta: 0,
        });
        return { ok: false as const, reason: 'no_energy' as const };
      } else {
        const oldE = playerState.energy;
        get().addStat('energy', -cost);
        const newE = get().playerState.energy;
        eventBus.emit('stat:changed', {
          stat: 'energy',
          oldValue: oldE,
          newValue: newE,
          delta: -cost,
        });
      }
    }

    const ex = get().exploration;
    set({
      exploration: {
        ...ex,
        currentSceneId: sceneId,
        lastSceneTransition: Date.now(),
      },
    });
    return { ok: true as const };
  },
  
  setTriggerState: (triggerId, state) => {
    const { exploration } = get();
    set({
      exploration: {
        ...exploration,
        triggerStates: {
          ...exploration.triggerStates,
          [triggerId]: state
        }
      }
    });
  },
  
  addWorldItem: (item) => {
    const { exploration } = get();
    set({
      exploration: {
        ...exploration,
        worldItems: [...exploration.worldItems, item]
      }
    });
  },
  
  collectWorldItem: (itemId) => {
    const { exploration } = get();
    set({
      exploration: {
        ...exploration,
        worldItems: exploration.worldItems.map(item => 
          item.id === itemId ? { ...item, collected: true } : item
        )
      }
    });
  },
  
  setInteractionPrompt: (prompt) => set({ interactionPrompt: prompt }),
  
  addExploredArea: (areaId) => {
    const { exploration } = get();
    if (!exploration.exploredAreas.includes(areaId)) {
      set({
        exploration: {
          ...exploration,
          exploredAreas: [...exploration.exploredAreas, areaId]
        }
      });
    }
  },
  
  // Quest Actions
  activateQuest: (questId) => {
    const { activeQuestIds, completedQuestIds } = get();
    if (!activeQuestIds.includes(questId) && !completedQuestIds.includes(questId)) {
      set({
        activeQuestIds: [...activeQuestIds, questId]
      });
    }
  },
  
  completeQuest: (questId) => {
    const { activeQuestIds, completedQuestIds, questProgress } = get();
    if (!activeQuestIds.includes(questId)) return;
    
    const newQuestProgress = { ...questProgress };
    delete newQuestProgress[questId];
    
    // Получаем награды из определения квеста
    const questDef = QUEST_DEFINITIONS[questId];
    const reward = questDef?.reward;
    
    if (reward) {
      const state = get();
      const updates: Partial<PlayerState> = {};
      
      // Характеристики
      if (reward.creativity) updates.creativity = clamp((state.playerState.creativity || 50) + reward.creativity, 0, 100);
      if (reward.mood) updates.mood = clamp((state.playerState.mood || 50) + reward.mood, 0, 100);
      if (reward.stability) updates.stability = clamp((state.playerState.stability || 50) + reward.stability, 0, 100);
      if (reward.karma) updates.karma = clamp((state.playerState.karma || 50) + reward.karma, 0, 100);
      
      // Навыки
      const skillGains: Partial<Record<keyof PlayerSkills, number>> = {};
      if (reward.perception) skillGains.perception = reward.perception;
      if (reward.introspection) skillGains.introspection = reward.introspection;
      if (reward.writing) skillGains.writing = reward.writing;
      if (reward.empathy) skillGains.empathy = reward.empathy;
      if (reward.persuasion) skillGains.persuasion = reward.persuasion;
      if (reward.intuition) skillGains.intuition = reward.intuition;
      if (reward.resilience) skillGains.resilience = reward.resilience;
      
      const newSkills = Object.keys(skillGains).length > 0
        ? { ...state.playerState.skills, ...Object.fromEntries(
            Object.entries(skillGains).map(([k, v]) => [k, clamp((state.playerState.skills[k as keyof PlayerSkills] || 0) + (v || 0), 0, 100)])
          )}
        : state.playerState.skills;
      
      // Очки навыков
      const newSkillPoints = (state.playerState.skills.skillPoints || 0) + (reward.skillPoints || 0);
      
      // Предметы
      if (reward.itemRewards) {
        reward.itemRewards.forEach(itemId => {
          state.addItem(itemId, 1);
        });
      }
      
      // Флаги
      if (reward.unlockFlags) {
        reward.unlockFlags.forEach(flag => {
          state.setFlag(flag);
        });
      }
      
      set({
        activeQuestIds: activeQuestIds.filter(id => id !== questId),
        completedQuestIds: [...completedQuestIds, questId],
        questProgress: newQuestProgress,
        playerState: {
          ...state.playerState,
          ...updates,
          skills: { ...newSkills, skillPoints: newSkillPoints },
        },
      });
    } else {
      // Нет награды — просто перемещаем
      set({
        activeQuestIds: activeQuestIds.filter(id => id !== questId),
        completedQuestIds: [...completedQuestIds, questId],
        questProgress: newQuestProgress,
      });
    }
  },
  
  updateQuestObjective: (questId, objectiveId, value) => {
    const { questProgress } = get();
    const questObj = questProgress[questId] || {};
    
    set({
      questProgress: {
        ...questProgress,
        [questId]: {
          ...questObj,
          [objectiveId]: value !== undefined ? value : (questObj[objectiveId] || 0) + 1
        }
      }
    });
  },
  
  incrementQuestObjective: (questId, objectiveId) => {
    const { questProgress } = get();
    const questObj = questProgress[questId] || {};
    const currentValue = questObj[objectiveId] || 0;
    
    set({
      questProgress: {
        ...questProgress,
        [questId]: {
          ...questObj,
          [objectiveId]: currentValue + 1
        }
      }
    });
  },
  
  isQuestActive: (questId) => {
    return get().activeQuestIds.includes(questId);
  },
  
  isQuestCompleted: (questId) => {
    return get().completedQuestIds.includes(questId);
  },
  
  getQuestProgress: (questId) => {
    return get().questProgress[questId] || {};
  },
  
  // Faction Actions
  updateFactionReputation: (factionId, change) => {
    const { factionReputations } = get();
    const current = factionReputations[factionId];
    const faction = FACTIONS[factionId];
    
    if (!current || !faction) return;
    
    // Получаем репутации других фракций для расчёта бонусов
    const otherReps = Object.fromEntries(
      Object.entries(factionReputations).map(([id, rep]) => [id, rep.value])
    ) as Record<FactionId, number>;
    
    const newValue = updateReputationValue(current.value, change, faction, otherReps);
    
    set({
      factionReputations: {
        ...factionReputations,
        [factionId]: {
          ...current,
          value: newValue,
          standing: getStandingLevel(newValue),
          interactions: current.interactions + 1,
          lastInteraction: Date.now()
        }
      }
    });
  },
  
  getFactionReputation: (factionId) => {
    return get().factionReputations[factionId]?.value || 0;
  },
  
  completeQuestForFaction: (questId, factionId) => {
    const { factionReputations } = get();
    const current = factionReputations[factionId];
    
    if (!current) return;
    
    set({
      factionReputations: {
        ...factionReputations,
        [factionId]: {
          ...current,
          questsCompleted: [...current.questsCompleted, questId]
        }
      }
    });
  },

  pushChoiceLog: (entry) => {
    const id =
      entry.id ||
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
    const full: ChoiceLogEntry = {
      id,
      at: entry.at ?? Date.now(),
      fromNodeId: entry.fromNodeId,
      choiceText: entry.choiceText,
      toNodeId: entry.toNodeId,
      kind: entry.kind,
      skillRollSuccess: entry.skillRollSuccess,
    };
    set((s) => ({
      choiceLog: [...s.choiceLog, full].slice(-48),
    }));
  },
  
  // Save
  saveGame: () => {
    const storage = getLocalStorage();
    if (!storage) return;
    
    const state = get();
    storage.setItem(SAVE_KEY, JSON.stringify({
      version: 4,
      playerState: state.playerState,
      currentNodeId: state.currentNodeId,
      npcRelations: state.npcRelations,
      inventory: state.inventory.map(i => ({
        itemId: i.item.id,
        quantity: i.quantity,
        obtainedAt: i.obtainedAt
      })),
      collectedPoemIds: state.collectedPoemIds,
      unlockedAchievementIds: state.unlockedAchievementIds,
      unlockedLocations: state.unlockedLocations,
      gameMode: state.gameMode,
      exploration: state.exploration,
      // Quest state
      activeQuestIds: state.activeQuestIds,
      completedQuestIds: state.completedQuestIds,
      questProgress: state.questProgress,
      // Faction state
      factionReputations: state.factionReputations,
      choiceLog: state.choiceLog,
      savedAt: Date.now()
    }));
  },
  
  loadGame: () => {
    const storage = getLocalStorage();
    if (!storage) return false;
    
    const saved = storage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved) as SavedGameData;
        const normalized = normalizeLoadedState(data);
        set({
          ...normalized,
          phase: 'game'
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },
  
  resetGame: () => {
    const storage = getLocalStorage();
    
    set({
      playerState: INITIAL_STATE,
      currentNodeId: 'start',
      npcRelations: INITIAL_NPC_RELATIONS,
      inventory: [],
      collectedPoemIds: [],
      unlockedAchievementIds: [],
      unlockedLocations: [],
      activePanicTimer: null,
      phase: 'menu',
      gameMode: 'visual-novel',
      exploration: INITIAL_EXPLORATION_STATE,
      currentNPCId: null,
      interactionPrompt: null,
      // Quest state
      activeQuestIds: [...DEFAULT_ACTIVE_QUEST_IDS],
      completedQuestIds: [],
      questProgress: {},
      // Faction state
      factionReputations: INITIAL_FACTION_REPUTATIONS,
      choiceLog: [],
    });
    
    if (storage) {
      storage.removeItem(SAVE_KEY);
    }
  },

  hydrateFromLocalStorage: () => {
    if (typeof window === 'undefined' || storageHydrationApplied) return;
    storageHydrationApplied = true;
    const savedData = loadSavedState();
    if (!savedData) return;
    const normalized = normalizeLoadedState(savedData as SavedGameData);
    set({ ...normalized });
  },
}));

// ============================================
// SELECTOR HOOKS (for convenience)
// ============================================

export const usePlayerStats = () => useGameStore(useShallow((state) => ({
  mood: state.playerState.mood,
  creativity: state.playerState.creativity,
  stability: state.playerState.stability,
  energy: state.playerState.energy,
  karma: state.playerState.karma,
  stress: state.playerState.stress
})));

export const usePlayerSkills = () => useGameStore((state) => state.playerState.skills); // primitive — no useShallow needed

export const useStress = () => useGameStore(useShallow((state) => ({
  stress: state.playerState.stress,
  panicMode: state.playerState.panicMode,
  addStress: state.addStress,
  reduceStress: state.reduceStress,
  triggerPanicMode: state.triggerPanicMode,
  clearPanicMode: state.clearPanicMode
})));

export const useExploration = () => useGameStore(useShallow((state) => ({
  playerPosition: state.exploration.playerPosition,
  currentSceneId: state.exploration.currentSceneId,
  npcStates: state.exploration.npcStates,
  triggerStates: state.exploration.triggerStates,
  worldItems: state.exploration.worldItems,
  setPlayerPosition: state.setPlayerPosition,
  setCurrentScene: state.setCurrentScene,
  travelToScene: state.travelToScene,
  setNPCState: state.setNPCState,
  setTriggerState: state.setTriggerState,
})));

export const useGameMode = () => useGameStore(useShallow((state) => ({
  gameMode: state.gameMode,
  setGameMode: state.setGameMode,
  currentNPCId: state.currentNPCId,
  setCurrentNPC: state.setCurrentNPC,
  interactionPrompt: state.interactionPrompt,
  setInteractionPrompt: state.setInteractionPrompt,
})));

// ============================================
// DIRECT STORE ACCESS (for non-hook contexts)
// ============================================

export const getGameStore = () => useGameStore;
