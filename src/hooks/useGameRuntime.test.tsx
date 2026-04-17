import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { PlayerState, NPCRelation } from '@/data/types';
import { useGameRuntime } from './useGameRuntime';
import { coreLoop } from '@/engine/CoreLoop';
import { sceneManager } from '@/engine/SceneManager';
import { eventBus } from '@/engine/EventBus';
import { poemMechanics } from '@/engine/PoemMechanics';
import { initConsequencesSystem } from '@/engine/ConsequencesSystem';

vi.mock('@/engine/CoreLoop', () => ({
  coreLoop: {
    init: vi.fn(),
    startLoop: vi.fn(),
    stopLoop: vi.fn(),
  },
}));

vi.mock('@/engine/SceneManager', () => ({
  sceneManager: {
    transitionTo: vi.fn(),
  },
}));

vi.mock('@/engine/EventBus', () => ({
  eventBus: {
    emit: vi.fn(),
  },
}));

vi.mock('@/engine/PoemMechanics', () => ({
  poemMechanics: {
    setCollectedPoems: vi.fn(),
    collectPoem: vi.fn(() => ({
      statBonuses: { mood: 3 },
      skillBonuses: { writing: 2 },
    })),
    getUnlockedChoices: vi.fn(() => [{ flag: 'poem_unlock_flag' }]),
  },
}));

vi.mock('@/engine/ConsequencesSystem', () => ({
  initConsequencesSystem: vi.fn(),
}));

vi.mock('@/data/storyNodes', () => ({
  STORY_NODES: {
    start: {
      id: 'start',
      type: 'story',
      cutscene: 'cutscene_1',
      scene: 'kitchen_night',
    },
  },
}));

vi.mock('@/data/poems', () => ({
  POEMS: [{ id: 'poem_1', title: 'Тестовый стих', unlocksAt: 'start' }],
}));

vi.mock('@/data/achievements', () => ({
  ACHIEVEMENTS: [{ id: 'ach_1' }],
  checkAchievement: vi.fn(() => true),
}));

vi.mock('@/store/gameStore', () => ({
  useGameStore: {
    getState: vi.fn(() => ({
      playerState: { flags: {}, visitedNodes: ['start'] },
      npcRelations: [],
      activeQuestIds: [],
      completedQuestIds: [],
      inventory: [],
      exploration: { currentSceneId: 'kitchen_night' },
    })),
  },
}));

function createPlayerState(): PlayerState {
  return {
    mood: 50,
    creativity: 30,
    stability: 60,
    energy: 5,
    karma: 50,
    selfEsteem: 40,
    stress: 0,
    panicMode: false,
    poemsCollected: [],
    path: 'none',
    act: 1,
    visitedNodes: ['start'],
    playTime: 0,
    skills: {
      writing: 10,
      perception: 10,
      empathy: 10,
      imagination: 10,
      logic: 10,
      coding: 10,
      persuasion: 10,
      intuition: 10,
      resilience: 10,
      introspection: 10,
      skillPoints: 0,
    },
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
}

function createBaseParams() {
  return {
    phase: 'game' as const,
    currentNodeId: 'start',
    currentSceneId: 'kitchen_night' as const,
    playerState: createPlayerState(),
    npcRelations: [] as NPCRelation[],
    collectedPoems: [] as string[],
    unlockedAchievements: [] as string[],
    dialogueStoreActions: {
      addStat: vi.fn(),
      addStress: vi.fn(),
      reduceStress: vi.fn(),
      setFlag: vi.fn(),
      unsetFlag: vi.fn(),
      updateNPCRelation: vi.fn(),
      addItem: vi.fn(),
      removeItem: vi.fn(),
      activateQuest: vi.fn(),
      updateQuestObjective: vi.fn(),
      collectPoem: vi.fn(),
      addSkill: vi.fn(),
    },
    incrementPlayTime: vi.fn(),
    travelToScene: vi.fn(() => ({ ok: true as const })),
    collectPoem: vi.fn(),
    addStat: vi.fn(),
    addSkill: vi.fn(),
    setFlag: vi.fn(),
    unlockAchievement: vi.fn(),
    showEffectNotif: vi.fn(),
  };
}

describe('useGameRuntime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes runtime systems and core loop in game phase', () => {
    const params = createBaseParams();
    const { unmount } = renderHook(() => useGameRuntime(params));

    expect(initConsequencesSystem).toHaveBeenCalledTimes(1);
    expect(sceneManager.transitionTo).toHaveBeenCalledWith('kitchen_night');
    expect(params.travelToScene).toHaveBeenCalledWith('kitchen_night', { narrativeDriven: true });
    expect(coreLoop.init).toHaveBeenCalledTimes(1);
    expect(coreLoop.startLoop).toHaveBeenCalledWith('start', 'kitchen_night');

    unmount();
    expect(coreLoop.stopLoop).toHaveBeenCalled();
  });

  it('applies poem side effects and emits poem event', async () => {
    const params = createBaseParams();
    renderHook(() => useGameRuntime(params));
    await act(async () => {
      await Promise.resolve();
    });

    expect(poemMechanics.setCollectedPoems).toHaveBeenCalledWith([]);
    expect(params.collectPoem).toHaveBeenCalledWith('poem_1');
    expect(params.addStat).toHaveBeenCalledWith('mood', 3);
    expect(params.addSkill).toHaveBeenCalledWith('writing', 2);
    expect(params.setFlag).toHaveBeenCalledWith('poem_unlock_flag');
    expect(eventBus.emit).toHaveBeenCalledWith('poem:collected', { poemId: 'poem_1' });
  });

  it('unlocks achievement and emits achievement event when condition passes', async () => {
    const params = createBaseParams();
    renderHook(() => useGameRuntime(params));
    await act(async () => {
      await Promise.resolve();
    });

    expect(params.unlockAchievement).toHaveBeenCalledWith('ach_1');
    expect(eventBus.emit).toHaveBeenCalledWith('achievement:unlocked', { achievementId: 'ach_1' });
  });

  it('does not restart the same cutscene after completeCutscene', async () => {
    const params = createBaseParams();
    const { result } = renderHook(() => useGameRuntime(params));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.activeCutsceneId).toBe('cutscene_1');

    await act(async () => {
      result.current.completeCutscene();
      await Promise.resolve();
    });
    expect(result.current.activeCutsceneId).toBeNull();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.activeCutsceneId).toBeNull();
  });

  it('in explore_mode updates sceneManager from exploration scene without travelToScene', () => {
    const params = {
      ...createBaseParams(),
      currentNodeId: 'explore_mode',
      explorationCurrentSceneId: 'zarema_albert_room' as const,
    };
    renderHook(() => useGameRuntime(params));

    expect(sceneManager.transitionTo).toHaveBeenCalledWith('zarema_albert_room');
    expect(params.travelToScene).not.toHaveBeenCalled();
  });
});
