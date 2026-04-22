// ============================================
// PLAYER STORE — Доменный стор: состояние игрока
// ============================================
// Отвечает за: характеристики, навыки, стресс,
// самооценку, энергию, карму, флаги, моральные выборы.
// Не содержит: NPC, инвентарь, квесты, фракции, UI-фазы.

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { PlayerState, PlayerSkills, MoralChoice } from '@/shared/types/game';
import { INITIAL_PLAYER_ENERGY, MAX_PLAYER_ENERGY } from '@/lib/energyConfig';
import { experienceRequiredForNextLevel } from '@/lib/rpgLeveling';
import { selectEnergyPercentageFromPlayer } from './playerStoreSelectors';

// ============================================
// INITIAL STATE
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

const INITIAL_PLAYER: PlayerState = {
  mood: 50,
  creativity: 30,
  stability: 60,
  energy: INITIAL_PLAYER_ENERGY,
  karma: 50,
  selfEsteem: 40,
  stress: 0,
  panicMode: false,
  characterLevel: 1,
  experience: 0,
  experienceToNextLevel: experienceRequiredForNextLevel(1),
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

// ============================================
// TYPES
// ============================================

interface PlayerStoreState {
  playerState: PlayerState;
  currentNodeId: string;
}

interface PlayerStoreActions {
  setCurrentNode: (nodeId: string) => void;
  addStat: (stat: 'mood' | 'creativity' | 'stability' | 'energy' | 'karma' | 'selfEsteem', amount: number) => void;
  addStress: (amount: number) => void;
  reduceStress: (amount: number) => void;
  triggerPanicMode: () => void;
  clearPanicMode: () => void;
  incrementPlayTime: () => void;
  setPlayerAct: (act: number) => void;
  addSkill: (skill: keyof PlayerSkills, amount: number) => void;
  addSkillPoints: (points: number) => void;
  setFlag: (flag: string) => void;
  unsetFlag: (flag: string) => void;
  hasFlag: (flag: string) => boolean;
  visitNode: (nodeId: string) => void;
  addMoralChoice: (choice: MoralChoice) => void;
  setPlayerState: (state: Partial<PlayerState>) => void;
  resetPlayer: () => void;
}

type PlayerStore = PlayerStoreState & PlayerStoreActions;

// ============================================
// UTILITIES
// ============================================

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

// ============================================
// STORE
// ============================================
// Производные поля (проценты, агрегаты) не добавлять методами в state —
// см. playerStoreSelectors + хуки ниже (или useShallow для объектов).

export const usePlayerStore = create<PlayerStore>()((set, get) => ({
  playerState: INITIAL_PLAYER,
  currentNodeId: 'start',

  setCurrentNode: (nodeId) => {
    const { playerState } = get();
    // Узел попадает в visitedNodes здесь; visitNode нужен отдельно,
    // если нужно отметить посещение без смены currentNodeId (без двойного set подряд с setCurrentNode).
    set({
      currentNodeId: nodeId,
      playerState: {
        ...playerState,
        visitedNodes: playerState.visitedNodes.includes(nodeId)
          ? playerState.visitedNodes
          : [...playerState.visitedNodes, nodeId],
      },
    });
  },

  addStat: (stat, amount) => {
    const { playerState } = get();
    const currentValue = playerState[stat];
    if (typeof currentValue === 'number') {
      set({
        playerState: {
          ...playerState,
          [stat]: clamp(currentValue + amount, 0, stat === 'energy' ? MAX_PLAYER_ENERGY : 100),
        },
      });
    }
  },

  addStress: (amount) => {
    const { playerState } = get();
    const newStress = clamp(playerState.stress + amount, 0, 100);
    const panicMode = newStress >= 100;
    set({ playerState: { ...playerState, stress: newStress, panicMode } });
    if (panicMode && !playerState.panicMode) {
      console.log('🔥 KERNEL PANIC TRIGGERED!');
    }
  },

  reduceStress: (amount) => {
    const { playerState } = get();
    const newStress = clamp(playerState.stress - amount, 0, 100);
    set({ playerState: { ...playerState, stress: newStress, panicMode: newStress >= 100 } });
  },

  triggerPanicMode: () => {
    const { playerState } = get();
    set({ playerState: { ...playerState, stress: 100, panicMode: true } });
  },

  clearPanicMode: () => {
    const { playerState } = get();
    set({ playerState: { ...playerState, stress: Math.max(0, playerState.stress - 30), panicMode: false } });
  },

  incrementPlayTime: () => {
    const { playerState } = get();
    set({ playerState: { ...playerState, playTime: playerState.playTime + 1 } });
  },

  setPlayerAct: (act) => {
    const { playerState } = get();
    set({ playerState: { ...playerState, act: act as 1 | 2 | 3 | 4 } });
  },

  addSkill: (skill, amount) => {
    const { playerState } = get();
    const currentSkill = playerState.skills[skill] as number;
    set({
      playerState: {
        ...playerState,
        skills: { ...playerState.skills, [skill]: clamp(currentSkill + amount, 0, 100) },
      },
    });
  },

  addSkillPoints: (points) => {
    const { playerState } = get();
    set({
      playerState: {
        ...playerState,
        skills: {
          ...playerState.skills,
          skillPoints: Math.max(0, playerState.skills.skillPoints + points),
        },
      },
    });
  },

  setFlag: (flag) => {
    const { playerState } = get();
    set({ playerState: { ...playerState, flags: { ...playerState.flags, [flag]: true } } });
  },

  unsetFlag: (flag) => {
    const { playerState } = get();
    const newFlags = { ...playerState.flags };
    delete newFlags[flag];
    set({ playerState: { ...playerState, flags: newFlags } });
  },

  hasFlag: (flag) => get().playerState.flags[flag] === true,

  /** Отметить узел в visitedNodes без смены currentNodeId (не дублируйте с setCurrentNode для того же id). */
  visitNode: (nodeId) => {
    const { playerState } = get();
    if (!playerState.visitedNodes.includes(nodeId)) {
      set({ playerState: { ...playerState, visitedNodes: [...playerState.visitedNodes, nodeId] } });
    }
  },

  addMoralChoice: (choice) => {
    const { playerState } = get();
    set({
      playerState: {
        ...playerState,
        statistics: {
          ...playerState.statistics,
          moralChoices: [...playerState.statistics.moralChoices, choice],
        },
      },
    });
  },

  setPlayerState: (partial) => {
    const { playerState } = get();
    set({ playerState: { ...playerState, ...partial } });
  },

  resetPlayer: () => set({ playerState: INITIAL_PLAYER, currentNodeId: 'start' }),
}));

// ============================================
// SELECTOR HOOKS
// ============================================

export const usePlayerStats = () =>
  usePlayerStore(
    useShallow((state) => ({
      mood: state.playerState.mood,
      creativity: state.playerState.creativity,
      stability: state.playerState.stability,
      energy: state.playerState.energy,
      karma: state.playerState.karma,
      stress: state.playerState.stress,
      selfEsteem: state.playerState.selfEsteem,
      panicMode: state.playerState.panicMode,
    }))
  );

export const usePlayerSkills = () => usePlayerStore((state) => state.playerState.skills);

export const useStress = () =>
  usePlayerStore(
    useShallow((state) => ({
      stress: state.playerState.stress,
      panicMode: state.playerState.panicMode,
      addStress: state.addStress,
      reduceStress: state.reduceStress,
      triggerPanicMode: state.triggerPanicMode,
      clearPanicMode: state.clearPanicMode,
    }))
  );

/** Доля энергии 0–100; пересчёт только при смене `playerState.energy` в сторе. */
export const useEnergyPercentage = () =>
  usePlayerStore((state) => selectEnergyPercentageFromPlayer(state.playerState));
