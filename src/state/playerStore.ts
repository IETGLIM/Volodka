// ============================================
// PLAYER STORE — Доменный стор: состояние игрока
// ============================================
// Отвечает за: характеристики, навыки, стресс,
// самооценку, энергию, карму, флаги, моральные выборы.
// Не содержит: NPC, инвентарь, квесты, фракции, UI-фазы.
//
// События порогов (стресс, паника, низкая энергия) — `eventBus` (`player:*`).
// Селекторы-объекты: `usePlayerStats` / `useStress` уже на `useShallow`; для своих
// `usePlayerStore(s => ({ ... }))` используйте `useShallow` из `zustand/react/shallow`.
// Флаги: конвенция имён с префиксом (`quest:…`, `npcs:…`) снижает риск коллизий.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { PlayerState, PlayerSkills, PlayerPath, MoralChoice, ChoiceLogEntry } from '@/data/types';
import { INITIAL_PLAYER_ENERGY, MAX_PLAYER_ENERGY } from '@/lib/energyConfig';
import { experienceRequiredForNextLevel, applyExperienceGain, RPG_XP_SKILL_POINTS_PER_LEVEL } from '@/lib/rpgLeveling';
import { eventBus } from '@/engine/EventBus';
import { selectEnergyPercentageFromPlayer } from './playerStoreSelectors';
import { migrateSaveData, CURRENT_PERSIST_VERSION } from './migrations';
import type { SavePayload } from '@/server/persistence/save-manager';
import { saveGame, loadGame, resetGame, hydrateFromLocalStorage } from './saveManager';

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

export const INITIAL_PLAYER: PlayerState = {
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
  choiceLog: ChoiceLogEntry[];
  revealedPoemId: string | null;
}

/** Поля для пакетного обновления числовых кор-статов (один `set`). */
export type PlayerCoreStatsBatch = Partial<
  Pick<PlayerState, 'mood' | 'creativity' | 'stability' | 'energy' | 'karma' | 'selfEsteem' | 'stress'>
>;

interface PlayerStoreActions {
  setCurrentNode: (nodeId: string) => void;
  addStat: (stat: 'mood' | 'creativity' | 'stability' | 'energy' | 'karma' | 'selfEsteem', amount: number) => void;
  /** Несколько кор-статов за один рендер Zustand. */
  updateStatsBatch: (changes: PlayerCoreStatsBatch) => void;
  addStress: (amount: number) => void;
  reduceStress: (amount: number) => void;
  triggerPanicMode: () => void;
  clearPanicMode: () => void;
  incrementPlayTime: () => void;
  setPlayerAct: (act: number) => void;
  /** Путь развития (`StoryEffect.pathShift`). */
  setPlayerPath: (path: PlayerPath) => void;
  addSkill: (skill: keyof PlayerSkills, amount: number) => void;
  addSkillPoints: (points: number) => void;
  setFlag: (flag: string) => void;
  unsetFlag: (flag: string) => void;
  hasFlag: (flag: string) => boolean;
  visitNode: (nodeId: string) => void;
  addExperience: (amount: number, source?: string) => void;
  addMoralChoice: (choice: MoralChoice) => void;
  setPlayerState: (state: Partial<PlayerState>) => void;
  /** Синхронизация RPG-полей с внешним источником (например основной `gameStore`). */
  setRpgProgress: (experience: number, characterLevel: number, experienceToNextLevel?: number) => void;
  /** Снимок `playerState` для персиста / отладки. */
  serializePlayerState: () => PlayerState;
  /** Восстановление с валидацией чисел; неизвестные поля отбрасываются на уровне merge. */
  deserializePlayerState: (data: Partial<PlayerState>) => void;
  resetPlayer: () => void;
  pushChoiceLog: (entry: Omit<ChoiceLogEntry, 'id' | 'at'> & { id?: string; at?: number }) => void;
  setRevealedPoemId: (poemId: string | null) => void;
  saveGame: (options?: { source?: 'auto' | 'manual' }) => void;
  loadGame: () => boolean;
  hydrateFromLocalStorage: () => boolean;
}

type PlayerStore = PlayerStoreState & PlayerStoreActions;

// ============================================
// UTILITIES
// ============================================

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const LOW_ENERGY_THRESHOLD = 20;
const STRESS_HIGH_THRESHOLD = 80;

function emitStressAndPanicEdges(
  prev: PlayerState,
  nextStress: number,
  nextPanic: boolean,
) {
  if (nextPanic && !prev.panicMode) {
    eventBus.emit('player:panic_enter', { stress: nextStress });
    eventBus.emit('panic:triggered', { stress: nextStress });
  } else if (!nextPanic && prev.panicMode) {
    eventBus.emit('player:panic_leave', { stress: nextStress });
    eventBus.emit('panic:cleared', { stress: nextStress });
  }
  if (nextStress >= STRESS_HIGH_THRESHOLD && prev.stress < STRESS_HIGH_THRESHOLD) {
    eventBus.emit('player:stress_high', { stress: nextStress, previousStress: prev.stress });
  }
}

function emitLowEnergyIfCrossed(prevEnergy: number, nextEnergy: number) {
  if (nextEnergy <= LOW_ENERGY_THRESHOLD && prevEnergy > LOW_ENERGY_THRESHOLD) {
    eventBus.emit('player:low_energy', { energy: nextEnergy, threshold: LOW_ENERGY_THRESHOLD });
  }
}

// ============================================
// STORE
// ============================================
// Производные поля (проценты, агрегаты) не добавлять методами в state —
// см. playerStoreSelectors + хуки ниже (или useShallow для объектов).

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      playerState: INITIAL_PLAYER,
      currentNodeId: 'explore_hub_welcome',
      choiceLog: [],
      revealedPoemId: null,

      saveGame,
      loadGame,
      resetGame,
      hydrateFromLocalStorage,

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
    if (!Number.isFinite(amount)) {
      console.error('[playerStore] addStat: amount is not finite', { stat, amount });
      return;
    }
    const { playerState } = get();
    const currentValue = playerState[stat];
    if (typeof currentValue !== 'number') return;
    const maxV = stat === 'energy' ? MAX_PLAYER_ENERGY : 100;
    const newVal = clamp(currentValue + amount, 0, maxV);
    set({
      playerState: {
        ...playerState,
        [stat]: newVal,
      },
    });
    if (stat === 'energy') {
      emitLowEnergyIfCrossed(currentValue, newVal);
    }
  },

  updateStatsBatch: (changes) => {
    const prev = get().playerState;
    const next = { ...prev };
    const apply = (key: keyof PlayerCoreStatsBatch, maxV: number) => {
      const raw = changes[key];
      if (raw === undefined) return;
      if (!Number.isFinite(raw)) {
        console.error('[playerStore] updateStatsBatch: value is not finite', { key, raw });
        return;
      }
      const prevVal = next[key];
      const bounded = clamp(raw, 0, maxV);
      switch (key) {
        case 'mood':
          next.mood = bounded;
          break;
        case 'creativity':
          next.creativity = bounded;
          break;
        case 'stability':
          next.stability = bounded;
          break;
        case 'energy':
          next.energy = bounded;
          emitLowEnergyIfCrossed(prevVal, bounded);
          break;
        case 'karma':
          next.karma = bounded;
          break;
        case 'selfEsteem':
          next.selfEsteem = bounded;
          break;
        case 'stress':
          next.stress = bounded;
          break;
        default:
          break;
      }
    };
    apply('mood', 100);
    apply('creativity', 100);
    apply('stability', 100);
    apply('energy', MAX_PLAYER_ENERGY);
    apply('karma', 100);
    apply('selfEsteem', 100);
    apply('stress', 100);
    next.panicMode = next.stress >= 100;
    emitStressAndPanicEdges(prev, next.stress, next.panicMode);
    set({ playerState: next });
  },

  addStress: (amount) => {
    if (!Number.isFinite(amount)) {
      console.error('[playerStore] addStress: amount is not finite', { amount });
      return;
    }
    const { playerState } = get();
    const newStress = clamp(playerState.stress + amount, 0, 100);
    const panicMode = newStress >= 100;
    emitStressAndPanicEdges(playerState, newStress, panicMode);
    set({ playerState: { ...playerState, stress: newStress, panicMode } });
  },

  reduceStress: (amount) => {
    if (!Number.isFinite(amount)) {
      console.error('[playerStore] reduceStress: amount is not finite', { amount });
      return;
    }
    const { playerState } = get();
    const newStress = clamp(playerState.stress - amount, 0, 100);
    const panicMode = newStress >= 100;
    emitStressAndPanicEdges(playerState, newStress, panicMode);
    set({ playerState: { ...playerState, stress: newStress, panicMode } });
  },

  triggerPanicMode: () => {
    const { playerState } = get();
    const next = { ...playerState, stress: 100, panicMode: true };
    emitStressAndPanicEdges(playerState, 100, true);
    set({ playerState: next });
  },

  clearPanicMode: () => {
    const { playerState } = get();
    const newStress = Math.max(0, playerState.stress - 30);
    const next = { ...playerState, stress: newStress, panicMode: false };
    emitStressAndPanicEdges(playerState, newStress, false);
    set({ playerState: next });
  },

  incrementPlayTime: () => {
    const { playerState } = get();
    set({ playerState: { ...playerState, playTime: playerState.playTime + 1 } });
  },

  setPlayerAct: (act) => {
    const { playerState } = get();
    set({ playerState: { ...playerState, act: act as 1 | 2 | 3 | 4 } });
  },

  setPlayerPath: (path) => {
    const { playerState } = get();
    const oldPath = playerState.path;
    if (oldPath === path) return;
    set({ playerState: { ...playerState, path } });
    eventBus.emit('path:changed', { oldPath, newPath: path });
  },

  addSkill: (skill, amount) => {
    if (!Number.isFinite(amount)) {
      console.error('[playerStore] addSkill: amount is not finite', { skill, amount });
      return;
    }
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
    if (!Number.isFinite(points)) {
      console.error('[playerStore] addSkillPoints: points is not finite', { points });
      return;
    }
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

  addExperience: (amount, source) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const { playerState } = get();
    const res = applyExperienceGain(
      playerState.characterLevel,
      playerState.experience,
      amount,
    );
    const spGain = res.levelsGained * RPG_XP_SKILL_POINTS_PER_LEVEL;
    set({
      playerState: {
        ...playerState,
        characterLevel: res.characterLevel,
        experience: res.experience,
        experienceToNextLevel: res.experienceToNextLevel,
        skills: {
          ...playerState.skills,
          skillPoints: playerState.skills.skillPoints + spGain,
        },
      },
    });
    if (res.levelsGained > 0) {
      eventBus.emit('player:level_up', {
        newLevel: res.characterLevel,
        levelsGained: res.levelsGained,
        source,
      });
      eventBus.emit('ui:exploration_message', {
        text:
          res.levelsGained === 1
            ? `Уровень ${res.characterLevel}. +${spGain} оч. навыков.`
            : `Уровни +${res.levelsGained} → ${res.characterLevel}. +${spGain} оч. навыков.`,
      });
    }
  },

  setRpgProgress: (experience, characterLevel, experienceToNextLevel) => {
    if (!Number.isFinite(experience) || !Number.isFinite(characterLevel)) {
      console.error('[playerStore] setRpgProgress: non-finite arguments', {
        experience,
        characterLevel,
      });
      return;
    }
    const level = Math.max(1, Math.floor(characterLevel));
    const { playerState } = get();
    const toNext =
      experienceToNextLevel !== undefined && Number.isFinite(experienceToNextLevel) && experienceToNextLevel > 0
        ? experienceToNextLevel
        : experienceRequiredForNextLevel(level);
    set({
      playerState: {
        ...playerState,
        experience,
        characterLevel: level,
        experienceToNextLevel: toNext,
      },
    });
  },

  serializePlayerState: () => {
    const { playerState } = get();
    return JSON.parse(JSON.stringify(playerState)) as PlayerState;
  },

  deserializePlayerState: (data) => {
    const merged: PlayerState = {
      ...INITIAL_PLAYER,
      ...data,
      skills: { ...INITIAL_PLAYER.skills, ...(data.skills ?? {}) },
      flags: { ...INITIAL_PLAYER.flags, ...(data.flags ?? {}) },
      statistics: { ...INITIAL_PLAYER.statistics, ...(data.statistics ?? {}) },
      visitedNodes: Array.isArray(data.visitedNodes) ? data.visitedNodes : INITIAL_PLAYER.visitedNodes,
      collections: { ...INITIAL_PLAYER.collections, ...(data.collections ?? {}) },
    };
    const clampNum = (v: unknown, min: number, max: number, fallback: number) =>
      typeof v === 'number' && Number.isFinite(v) ? clamp(v, min, max) : fallback;
    merged.mood = clampNum(merged.mood, 0, 100, INITIAL_PLAYER.mood);
    merged.creativity = clampNum(merged.creativity, 0, 100, INITIAL_PLAYER.creativity);
    merged.stability = clampNum(merged.stability, 0, 100, INITIAL_PLAYER.stability);
    merged.energy = clampNum(merged.energy, 0, MAX_PLAYER_ENERGY, INITIAL_PLAYER.energy);
    merged.karma = clampNum(merged.karma, 0, 100, INITIAL_PLAYER.karma);
    merged.selfEsteem = clampNum(merged.selfEsteem, 0, 100, INITIAL_PLAYER.selfEsteem);
    merged.stress = clampNum(merged.stress, 0, 100, INITIAL_PLAYER.stress);
    merged.experience = clampNum(merged.experience, 0, Number.MAX_SAFE_INTEGER, INITIAL_PLAYER.experience);
    merged.characterLevel = Math.max(1, Math.floor(clampNum(merged.characterLevel, 1, 999, INITIAL_PLAYER.characterLevel)));
    merged.experienceToNextLevel = Math.max(
      1,
      Math.floor(clampNum(merged.experienceToNextLevel, 1, Number.MAX_SAFE_INTEGER, experienceRequiredForNextLevel(merged.characterLevel))),
    );
    merged.panicMode = Boolean(merged.panicMode) && merged.stress >= 100;
    set({ playerState: merged });
  },

  resetPlayer: () =>
    set({
      playerState: INITIAL_PLAYER,
      currentNodeId: 'explore_hub_welcome',
      choiceLog: [],
      revealedPoemId: null,
    }),

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

  setRevealedPoemId: (poemId) => set({ revealedPoemId: poemId }),
    }),
    {
      name: 'player-storage',
      version: CURRENT_PERSIST_VERSION,
      partialize: (state) => ({
        playerState: state.playerState,
        currentNodeId: state.currentNodeId,
      }),
    }
  )
);

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
