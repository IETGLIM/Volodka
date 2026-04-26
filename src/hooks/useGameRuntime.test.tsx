import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { PlayerState, NPCRelation } from '@/data/types';
import { useGameRuntime } from './useGameRuntime';
import { coreLoop } from '@/engine/CoreLoop';
import { sceneManager } from '@/engine/SceneManager';
import { eventBus } from '@/engine/EventBus';
import { poemMechanics } from '@/engine/PoemMechanics';
import { initConsequencesSystem } from '@/engine/ConsequencesSystem';
import { experienceRequiredForNextLevel } from '@/lib/rpgLeveling';
import { useAppStore } from '@/state/appStore';
import { useGameStore } from '@/state';

/** Минимальная шина, чтобы `useGameRuntime` мог подписаться на `poem:collected` / `achievement:unlocked`. */
const eventBusTestHarness = vi.hoisted(() => {
  const subs: Record<string, Set<(p: unknown) => void>> = {};
  return {
    add(event: string, fn: (p: unknown) => void) {
      if (!subs[event]) subs[event] = new Set();
      subs[event].add(fn);
    },
    remove(event: string, fn: (p: unknown) => void) {
      subs[event]?.delete(fn);
    },
    dispatch(event: string, payload: unknown) {
      for (const fn of subs[event] ?? []) (fn as (p: unknown) => void)(payload);
    },
    clear() {
      for (const k of Object.keys(subs)) subs[k]?.clear();
    },
    hasSubscribers(event: string) {
      return (subs[event]?.size ?? 0) > 0;
    },
  };
});

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
    emit: vi.fn((event: string, payload: unknown) => {
      eventBusTestHarness.dispatch(event, payload);
    }),
    on: vi.fn((event: string, fn: (p: unknown) => void) => {
      eventBusTestHarness.add(event, fn);
      return () => eventBusTestHarness.remove(event, fn);
    }),
    once: vi.fn(() => () => {}),
    off: vi.fn(),
    hasSubscribers: vi.fn((event: string) => eventBusTestHarness.hasSubscribers(event)),
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

const gameStoreTestState = vi.hoisted(() => ({
  state: {
    playerState: { flags: {}, visitedNodes: ['start'] as string[], equippedItemIds: [] as string[] },
    npcRelations: [] as NPCRelation[],
    activeQuestIds: [] as string[],
    completedQuestIds: [] as string[],
    inventory: [] as { item: { id: string } }[],
    gameMode: 'exploration' as const,
    currentNPCId: null as string | null,
    interactionPrompt: null,
    unlockedLocations: [] as string[],
    revealedPoemId: null as string | null,
    exploration: {
      currentSceneId: 'kitchen_night' as const,
      timeOfDay: 12,
      npcStates: {},
      triggerStates: {},
      worldItems: [],
      exploredAreas: [],
      lastSceneTransition: 0,
      playerPosition: { x: 0, y: 0, z: 0, rotation: 0 },
      streaming: {
        activeChunkIds: [] as string[],
        unloadingChunkIds: [] as string[],
        prefetchQueueLength: 0,
        prefetchTargetsPreview: [] as string[],
        budgetTextureBytesApprox: 0,
        rapierActiveBodiesApprox: 0,
      },
    },
  },
  setRevealedPoemId(id: string | null) {
    gameStoreTestState.state.revealedPoemId = id;
  },
}));

vi.mock('@/state/gameStore', () => ({
  useGameStore: Object.assign(
    (selector: (s: typeof gameStoreTestState.state & { setRevealedPoemId: (id: string | null) => void }) => unknown) =>
      selector({
        ...gameStoreTestState.state,
        setRevealedPoemId: gameStoreTestState.setRevealedPoemId,
      }),
    {
      getState: () => ({
        ...gameStoreTestState.state,
        setRevealedPoemId: gameStoreTestState.setRevealedPoemId,
      }),
      setState: vi.fn((updater: unknown) => {
        const s = gameStoreTestState.state;
        const patch = typeof updater === 'function' ? (updater as (prev: typeof s) => unknown)(s) : updater;
        if (!patch || typeof patch !== 'object') return;
        const p = patch as Partial<typeof s> & { exploration?: Partial<(typeof s)['exploration']> };
        if (p.exploration) {
          const ex = p.exploration;
          gameStoreTestState.state.exploration = {
            ...s.exploration,
            ...ex,
            streaming:
              ex.streaming != null
                ? { ...(s.exploration.streaming ?? {}), ...ex.streaming }
                : s.exploration.streaming,
          };
        }
      }),
    }
  ),
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
    characterLevel: 1,
    experience: 0,
    experienceToNextLevel: experienceRequiredForNextLevel(1),
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
    collectPoem: vi.fn((poemId: string) => {
      vi.mocked(eventBus.emit)('poem:collected', { poemId });
    }),
    addStat: vi.fn(),
    addSkill: vi.fn(),
    setFlag: vi.fn(),
    unlockAchievement: vi.fn((achievementId: string) => {
      vi.mocked(eventBus.emit)('achievement:unlocked', { achievementId });
    }),
    showEffectNotif: vi.fn(),
  };
}

describe('useGameRuntime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventBusTestHarness.clear();
    useAppStore.setState({ phase: 'game' });
    gameStoreTestState.state.revealedPoemId = null;
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

  it('applies poem side effects and reveals poem after blocking cutscene completes', async () => {
    const params = createBaseParams();
    const { result } = renderHook(() => useGameRuntime(params));
    await act(async () => {
      await Promise.resolve();
    });

    expect(poemMechanics.setCollectedPoems).toHaveBeenCalledWith([]);
    expect(params.collectPoem).toHaveBeenCalledWith('poem_1');
    expect(params.addStat).toHaveBeenCalledWith('mood', 3);
    expect(params.addSkill).toHaveBeenCalledWith('writing', 2);
    expect(params.setFlag).toHaveBeenCalledWith('poem_unlock_flag');
    expect(eventBus.emit).toHaveBeenCalledWith('poem:collected', { poemId: 'poem_1' });
    expect(result.current.activeCutsceneId).toBe('cutscene_1');
    expect(useGameStore.getState().revealedPoemId).toBeNull();

    await act(async () => {
      result.current.completeCutscene();
      await Promise.resolve();
    });
    expect(useGameStore.getState().revealedPoemId).toBe('poem_1');
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
