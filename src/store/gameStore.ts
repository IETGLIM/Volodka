import { create } from 'zustand';
import type { 
  PlayerState, 
  PlayerSkills, 
  NPCRelation, 
  InventoryItem,
  PanicTimer,
  MoralChoice 
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
  energy: 5,
  karma: 50,
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
    name: 'Мария', 
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
];

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
  
  // Actions
  setPhase: (phase: GameState['phase']) => void;
  setCurrentNode: (nodeId: string) => void;
  
  // Game mode
  setGameMode: (mode: GameMode) => void;
  
  // Stats
  addStat: (stat: 'mood' | 'creativity' | 'stability' | 'energy' | 'karma', amount: number) => void;
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
  setTriggerState: (triggerId: string, state: TriggerState) => void;
  addWorldItem: (item: WorldItem) => void;
  collectWorldItem: (itemId: string) => void;
  setInteractionPrompt: (prompt: InteractionPrompt | null) => void;
  addExploredArea: (areaId: string) => void;
  
  // Save/Load
  saveGame: () => void;
  loadGame: () => boolean;
  resetGame: () => void;
}

// ============================================
// UTILITIES
// ============================================

const clamp = (value: number, min: number, max: number) => 
  Math.max(min, Math.min(max, value));

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
  
  const saved = storage.getItem('volodka_save_v3');
  if (!saved) return null;
  
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

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
          [stat]: clamp(currentValue + amount, 0, stat === 'energy' ? 10 : 100)
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
        act
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
  
  // Inventory
  addItem: (itemId, quantity = 1) => {
    const { inventory } = get();
    const existing = inventory.find(i => i.item.id === itemId);
    
    if (existing) {
      set({
        inventory: inventory.map(i => 
          i.item.id === itemId 
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      });
    } else {
      set({
        inventory: [...inventory, {
          item: {
            id: itemId,
            name: itemId,
            description: '',
            type: 'artifact',
            rarity: 'common',
            icon: '📦',
            droppable: true,
            stackable: true,
            maxStack: 99
          },
          quantity,
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
  
  // Save
  saveGame: () => {
    const storage = getLocalStorage();
    if (!storage) return;
    
    const state = get();
    storage.setItem('volodka_save_v3', JSON.stringify({
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
      savedAt: Date.now()
    }));
  },
  
  loadGame: () => {
    const storage = getLocalStorage();
    if (!storage) return false;
    
    const saved = storage.getItem('volodka_save_v3');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        set({
          playerState: data.playerState || INITIAL_STATE,
          currentNodeId: data.currentNodeId || 'start',
          npcRelations: data.npcRelations || INITIAL_NPC_RELATIONS,
          inventory: data.inventory || [],
          collectedPoemIds: data.collectedPoemIds || [],
          unlockedAchievementIds: data.unlockedAchievementIds || [],
          unlockedLocations: data.unlockedLocations || [],
          gameMode: data.gameMode || 'visual-novel',
          exploration: data.exploration || INITIAL_EXPLORATION_STATE,
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
      interactionPrompt: null
    });
    
    if (storage) {
      storage.removeItem('volodka_save_v3');
    }
  }
}));

// ============================================
// INITIALIZE FROM LOCALSTORAGE (client-side)
// ============================================

if (typeof window !== 'undefined') {
  const savedData = loadSavedState();
  if (savedData) {
    useGameStore.setState({
      playerState: savedData.playerState || INITIAL_STATE,
      currentNodeId: savedData.currentNodeId || 'start',
      npcRelations: savedData.npcRelations || INITIAL_NPC_RELATIONS,
      inventory: savedData.inventory || [],
      collectedPoemIds: savedData.collectedPoemIds || [],
      unlockedAchievementIds: savedData.unlockedAchievementIds || [],
      unlockedLocations: savedData.unlockedLocations || [],
      gameMode: savedData.gameMode || 'visual-novel',
      exploration: savedData.exploration || INITIAL_EXPLORATION_STATE,
    });
  }
}

// ============================================
// SELECTOR HOOKS (for convenience)
// ============================================

export const usePlayerStats = () => useGameStore((state) => ({
  mood: state.playerState.mood,
  creativity: state.playerState.creativity,
  stability: state.playerState.stability,
  energy: state.playerState.energy,
  karma: state.playerState.karma,
  stress: state.playerState.stress
}));

export const usePlayerSkills = () => useGameStore((state) => state.playerState.skills);

export const useStress = () => useGameStore((state) => ({
  stress: state.playerState.stress,
  panicMode: state.playerState.panicMode,
  addStress: state.addStress,
  reduceStress: state.reduceStress,
  triggerPanicMode: state.triggerPanicMode,
  clearPanicMode: state.clearPanicMode
}));

export const useExploration = () => useGameStore((state) => ({
  playerPosition: state.exploration.playerPosition,
  currentSceneId: state.exploration.currentSceneId,
  npcStates: state.exploration.npcStates,
  triggerStates: state.exploration.triggerStates,
  worldItems: state.exploration.worldItems,
  setPlayerPosition: state.setPlayerPosition,
  setCurrentScene: state.setCurrentScene,
  setNPCState: state.setNPCState,
  setTriggerState: state.setTriggerState,
}));

export const useGameMode = () => useGameStore((state) => ({
  gameMode: state.gameMode,
  setGameMode: state.setGameMode,
  currentNPCId: state.currentNPCId,
  setCurrentNPC: state.setCurrentNPC,
  interactionPrompt: state.interactionPrompt,
  setInteractionPrompt: state.setInteractionPrompt,
}));

// ============================================
// DIRECT STORE ACCESS (for non-hook contexts)
// ============================================

export const getGameStore = () => useGameStore;
