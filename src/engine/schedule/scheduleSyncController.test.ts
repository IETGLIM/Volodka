import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import {
  dispatchGameAction,
  registerGameActionBridge,
  resetGameActionBridge,
  type GameAction,
  type GameActionBridge,
  type GameStoreSnapshot,
} from '@/engine/GameActionDispatcher';
import {
  bindScheduleSyncController,
  rebuildNpcStatesForHour,
  unbindScheduleSyncController,
} from '@/engine/schedule/scheduleSyncController';
import { resetScheduleContextCache } from '@/shared/scheduleContext';
import { resetScheduleEngineCache } from '@/engine/ScheduleEngine';

function minimalSnapshot(overrides?: Partial<GameStoreSnapshot>): GameStoreSnapshot {
  return {
    mode: 'exploration',
    currentNodeId: null,
    showStoryOverlay: false,
    exploration: {
      currentSceneId: 'volodka_room',
      timeOfDay: 12,
      playerPosition: [0, 0, 0],
    },
    interactiveObjectStates: {},
    playerState: {
      flags: {},
      inventory: [],
      skills: {
        logic: 1,
        coding: 1,
        empathy: 1,
        persuasion: 1,
        intuition: 1,
        writing: 1,
        rhythm: 1,
      },
      energy: 100,
      karma: 0,
      stress: 0,
      visitedNodes: [],
      progression: {
        level: 1,
        currentAct: 1,
        skillPoints: 0,
        unlockedSkills: [],
      },
    },
    collectedPoems: [],
    quests: [],
    activeTTLFlags: {},
    poemPowers: {},
    npcRelations: [],
    unlockedAchievements: [],
    achievementProgress: {
      visitedScenes: [],
      combatVictories: 0,
      consecutiveVictories: 0,
      maxComboAchieved: 0,
      hasCriticalHit: false,
      defeatedEnemyTypes: [],
      nightTimeHours: 0,
      poemPowerUsedInCombat: false,
    },
    ...overrides,
  };
}

describe('rebuildNpcStatesForHour', () => {
  beforeEach(() => {
    resetScheduleContextCache();
    resetScheduleEngineCache();
  });

  it('returns NPC placements for a given hour', () => {
    const states = rebuildNpcStatesForHour(12, {
      playerState: { progression: { currentAct: 1 }, flags: {} },
      quests: [],
      activeTTLFlags: {},
    });
    expect(Object.keys(states).length).toBeGreaterThan(0);
    for (const entry of Object.values(states)) {
      expect(entry.position).toHaveLength(3);
      expect(typeof entry.sceneId).toBe('string');
    }
  });
});

describe('scheduleSyncController', () => {
  const dispatch = vi.fn();
  let hourChanged: Array<{
    hour: number;
    previousHour: number;
    npcStates: Record<string, unknown>;
  }> = [];
  let unsubHour: (() => void) | null = null;

  beforeEach(() => {
    resetGameActionBridge();
    resetScheduleContextCache();
    resetScheduleEngineCache();
    unbindScheduleSyncController();
    unsubHour?.();
    dispatch.mockReset();
    hourChanged = [];

    const bridge: GameActionBridge = {
      dispatch: (action: GameAction) => dispatch(action),
      getSnapshot: () => minimalSnapshot(),
      subscribe: () => () => {},
      tryAddItem: () => false,
      tryActivatePoemPower: () => false,
    };
    registerGameActionBridge(bridge);
    bindScheduleSyncController();

    unsubHour = eventBus.on('world:hour_changed', (payload) => {
      hourChanged.push(payload);
    });
  });

  it('rebuilds NPC states and dispatches exploration/setNpcStates', () => {
    eventBus.emit('schedule:sync_npcs', { hour: 14, previousHour: 12 });

    expect(dispatch).toHaveBeenCalledTimes(1);
    const action = dispatch.mock.calls[0][0] as GameAction;
    expect(action.type).toBe('exploration/setNpcStates');
    if (action.type === 'exploration/setNpcStates') {
      expect(Object.keys(action.npcStates).length).toBeGreaterThan(0);
    }

    expect(hourChanged).toHaveLength(1);
    expect(hourChanged[0]?.hour).toBe(14);
    expect(hourChanged[0]?.previousHour).toBe(12);
  });

  it('no-ops when bridge is missing', () => {
    unbindScheduleSyncController();
    resetGameActionBridge();
    bindScheduleSyncController();

    eventBus.emit('schedule:sync_npcs', { hour: 10, previousHour: 9 });
    expect(dispatch).not.toHaveBeenCalled();
    expect(hourChanged).toHaveLength(0);
  });
});

describe('dispatchGameAction exploration/setNpcStates', () => {
  it('is accepted by the dispatcher API', () => {
    resetGameActionBridge();
    const dispatch = vi.fn();
    registerGameActionBridge({
      dispatch: (action: GameAction) => dispatch(action),
      getSnapshot: () => {
        throw new Error('unused');
      },
      subscribe: () => () => {},
      tryAddItem: () => false,
      tryActivatePoemPower: () => false,
    });

    const npcStates = {
      npc_a: {
        position: [1, 0, 2] as [number, number, number],
        sceneId: 'cafe_evening' as const,
      },
    };
    dispatchGameAction({ type: 'exploration/setNpcStates', npcStates });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'exploration/setNpcStates',
      npcStates,
    });
  });
});
