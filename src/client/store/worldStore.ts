// ============================================
// WORLD STORE — Доменный стор: мир, сцены, NPC
// ============================================
// Отвечает за: NPC-отношения, исследование, RPG-режим,
// текущего NPC, подсказки взаимодействия.

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { ENERGY_COSTS } from '@/lib/energyConfig';
import { eventBus } from '@/engine/EventBus';
import type { NPCRelation, SceneId } from '@/shared/types/game';
import type {
  PlayerPosition,
  NPCState,
  TriggerState,
  WorldItem,
  GameMode,
  InteractionPrompt,
  ExplorationState,
} from '@/shared/types/rpg';
import { usePlayerStore } from './playerStore';

// ============================================
// TRAVEL TYPES (зеркало gameStore для клиентского домена)
// ============================================

export type TravelToSceneResult =
  | { ok: true }
  | { ok: false; reason: 'same_scene' | 'locked' | 'no_energy' };

export type TravelToSceneOptions = {
  narrativeDriven?: boolean;
  energyCost?: number;
  consumeEnergy?: (amount: number) => boolean;
};

// ============================================
// INITIAL STATE
// ============================================

const INITIAL_NPC_RELATIONS: NPCRelation[] = [
  { id: 'maria', name: 'Виктория', value: 0, stage: 'stranger', trust: 0, respect: 0, intimacy: 0, flags: {}, interactions: [] },
  { id: 'alexey', name: 'Алексей', value: 0, stage: 'stranger', trust: 0, respect: 0, intimacy: 0, flags: {}, interactions: [] },
  { id: 'friend', name: 'Денис', value: 0, stage: 'stranger', trust: 0, respect: 0, intimacy: 0, flags: {}, interactions: [] },
  { id: 'vera', name: 'Вера', value: 0, stage: 'stranger', trust: 0, respect: 0, intimacy: 0, flags: {}, interactions: [] },
  { id: 'stranger', name: 'Незнакомец', value: 0, stage: 'stranger', trust: 0, respect: 0, intimacy: 0, flags: {}, interactions: [] },
];

const INITIAL_EXPLORATION: ExplorationState = {
  /** Как в `gameStore` / `SCENE_CONFIG.volodka_room.spawnPoint` */
  playerPosition: { x: 2.2, y: 0.06, z: 1.8, rotation: 0 },
  currentSceneId: 'volodka_room',
  timeOfDay: 20,
  npcStates: {},
  triggerStates: {},
  worldItems: [],
  exploredAreas: [],
  lastSceneTransition: 0,
};

// ============================================
// TYPES
// ============================================

interface WorldStoreState {
  npcRelations: NPCRelation[];
  gameMode: GameMode;
  exploration: ExplorationState;
  currentNPCId: string | null;
  interactionPrompt: InteractionPrompt | null;
  phase: 'loading' | 'intro' | 'menu' | 'game';
  unlockedLocations: string[];
}

interface WorldStoreActions {
  setPhase: (phase: WorldStoreState['phase']) => void;
  setGameMode: (mode: GameMode) => void;
  updateNPCRelation: (npcId: string, change: number) => void;
  setNPCState: (npcId: string, state: NPCState) => void;
  setCurrentNPC: (npcId: string | null) => void;
  setPlayerPosition: (position: PlayerPosition) => void;
  advanceTime: (deltaHours: number) => void;
  setCurrentScene: (sceneId: SceneId) => void;
  travelToScene: (sceneId: SceneId, options?: TravelToSceneOptions) => TravelToSceneResult;
  setTriggerState: (triggerId: string, state: TriggerState) => void;
  addWorldItem: (item: WorldItem) => void;
  collectWorldItem: (itemId: string) => void;
  setInteractionPrompt: (prompt: InteractionPrompt | null) => void;
  addExploredArea: (areaId: string) => void;
  resetWorld: () => void;
}

type WorldStore = WorldStoreState & WorldStoreActions;

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

// ============================================
// STORE
// ============================================

export const useWorldStore = create<WorldStore>()((set, get) => ({
  npcRelations: INITIAL_NPC_RELATIONS,
  gameMode: 'visual-novel',
  exploration: INITIAL_EXPLORATION,
  currentNPCId: null,
  interactionPrompt: null,
  phase: 'loading',
  unlockedLocations: [],

  setPhase: (phase) => set({ phase }),
  setGameMode: (mode) => set({ gameMode: mode }),

  updateNPCRelation: (npcId, change) => {
    set({
      npcRelations: get().npcRelations.map((rel) => {
        if (rel.id === npcId) {
          const newValue = clamp(rel.value + change, -100, 100);
          return { ...rel, value: newValue, stage: getNPCStage(newValue) };
        }
        return rel;
      }),
    });
  },

  setNPCState: (npcId, state) => {
    const { exploration } = get();
    set({ exploration: { ...exploration, npcStates: { ...exploration.npcStates, [npcId]: state } } });
  },

  setCurrentNPC: (npcId) => set({ currentNPCId: npcId }),

  setPlayerPosition: (position) => {
    const { exploration } = get();
    set({ exploration: { ...exploration, playerPosition: position } });
  },

  advanceTime: (deltaHours) => {
    const { exploration } = get();
    const next = exploration.timeOfDay + deltaHours;
    const normalized = ((next % 24) + 24) % 24;
    set({ exploration: { ...exploration, timeOfDay: normalized } });
  },

  setCurrentScene: (sceneId) => {
    const { exploration } = get();
    set({ exploration: { ...exploration, currentSceneId: sceneId, lastSceneTransition: Date.now() } });
  },

  travelToScene: (sceneId, options = {}) => {
    const narrative = options.narrativeDriven === true;
    const { exploration, unlockedLocations } = get();

    if (narrative) {
      if (exploration.currentSceneId === sceneId) {
        return { ok: true as const };
      }
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
    const player = usePlayerStore.getState();

    if (cost > 0) {
      if (consume) {
        if (!consume(cost)) {
          return { ok: false as const, reason: 'no_energy' as const };
        }
      } else {
        const oldE = player.playerState.energy;
        if (oldE < cost) {
          player.addStress(5);
          eventBus.emit('stat:changed', {
            stat: 'energy',
            oldValue: oldE,
            newValue: oldE,
            delta: 0,
          });
          return { ok: false as const, reason: 'no_energy' as const };
        }
        player.addStat('energy', -cost);
        const newE = usePlayerStore.getState().playerState.energy;
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
    set({ exploration: { ...exploration, triggerStates: { ...exploration.triggerStates, [triggerId]: state } } });
  },

  addWorldItem: (item) => {
    const { exploration } = get();
    set({ exploration: { ...exploration, worldItems: [...exploration.worldItems, item] } });
  },

  collectWorldItem: (itemId) => {
    const { exploration } = get();
    set({
      exploration: {
        ...exploration,
        worldItems: exploration.worldItems.map((item) =>
          item.id === itemId ? { ...item, collected: true } : item
        ),
      },
    });
  },

  setInteractionPrompt: (prompt) => set({ interactionPrompt: prompt }),

  addExploredArea: (areaId) => {
    const { exploration } = get();
    if (!exploration.exploredAreas.includes(areaId)) {
      set({ exploration: { ...exploration, exploredAreas: [...exploration.exploredAreas, areaId] } });
    }
  },

  resetWorld: () =>
    set({
      npcRelations: INITIAL_NPC_RELATIONS,
      gameMode: 'visual-novel',
      exploration: INITIAL_EXPLORATION,
      currentNPCId: null,
      interactionPrompt: null,
      phase: 'menu',
      unlockedLocations: [],
    }),
}));

// ============================================
// SELECTOR HOOKS
// ============================================

export const useExploration = () =>
  useWorldStore(
    useShallow((state) => ({
      playerPosition: state.exploration.playerPosition,
      currentSceneId: state.exploration.currentSceneId,
      timeOfDay: state.exploration.timeOfDay,
      npcStates: state.exploration.npcStates,
      triggerStates: state.exploration.triggerStates,
      worldItems: state.exploration.worldItems,
      setPlayerPosition: state.setPlayerPosition,
      advanceTime: state.advanceTime,
      setCurrentScene: state.setCurrentScene,
      travelToScene: state.travelToScene,
      setNPCState: state.setNPCState,
      setTriggerState: state.setTriggerState,
    }))
  );

export const useGameMode = () =>
  useWorldStore(
    useShallow((state) => ({
      gameMode: state.gameMode,
      setGameMode: state.setGameMode,
      currentNPCId: state.currentNPCId,
      setCurrentNPC: state.setCurrentNPC,
      interactionPrompt: state.interactionPrompt,
      setInteractionPrompt: state.setInteractionPrompt,
    }))
  );
