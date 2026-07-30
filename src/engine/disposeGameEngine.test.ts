import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  disposeGameEngine,
  reviveGameEngine,
  isGameEngineDisposed,
} from '@/engine/disposeGameEngine';
import { eventBus } from '@/engine/EventBus';
import { questTracker } from '@/engine/QuestTracker';
import {
  activatePoemPowerById,
  clearAllPowerTimers,
  getActiveEffects,
} from '@/engine/PoemPowerSystem';
import { useGameStore } from '@/store/gameStore';
import { getWorldEventDirector } from '@/engine/world/WorldEventDirector';
import { getWorldStreamManager } from '@/engine/world/WorldStreamManager';
import { getNavMeshLayer } from '@/engine/world/NavMeshLayer';
import { isWorldComputeWorkerAvailable, getWorldComputeWorker } from '@/engine/workers/computeWorkerClient';
import { bindKeyboardInput, sampleKeyboardMovement } from '@/engine/keyboardInputState';
import {
  getInteractionSession,
  writeInteractionSession,
} from '@/engine/interaction/interactionSession';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { bindSceneLoadedBridge, scheduleSceneLoaded } from '@/engine/core/sceneLoadedGate';
import {
  getRegisteredGlobalCleanupHandlerCount,
  runGlobalUnmountCleanup,
} from '@/engine/core/GlobalCleanupService';
import {
  getRegisteredModuleGeometryCount,
  getSharedBoxGeometry,
} from '@/engine/three/moduleGeometryRegistry';

describe('disposeGameEngine', () => {
  beforeEach(() => {
    clearAllPowerTimers();
    reviveGameEngine();
  });

  it('is idempotent', () => {
    disposeGameEngine();
    expect(isGameEngineDisposed()).toBe(true);
    disposeGameEngine();
    expect(isGameEngineDisposed()).toBe(true);
  });

  it('clears EventBus handlers', () => {
    const calls: string[] = [];
    eventBus.on('scene:enter', () => {
      calls.push('enter');
    });

    disposeGameEngine();

    eventBus.emit('scene:enter', {
      sceneId: 'volodka_room',
      fromSceneId: 'volodka_room',
    });
    expect(calls).toHaveLength(0);
  });

  it('reviveGameEngine allows a second dispose cycle', () => {
    disposeGameEngine();
    reviveGameEngine();
    expect(isGameEngineDisposed()).toBe(false);

    disposeGameEngine();
    expect(isGameEngineDisposed()).toBe(true);
  });

  it('reviveGameEngine re-binds poem:reset_all_effects listener', () => {
    useGameStore.setState({ collectedPoems: ['poem_1'] });
    expect(activatePoemPowerById('poem_1')).toBe(true);
    expect(getActiveEffects().length).toBeGreaterThan(0);

    disposeGameEngine();
    eventBus.emit('poem:reset_all_effects', {});
    expect(getActiveEffects().length).toBeGreaterThan(0);

    reviveGameEngine();
    eventBus.emit('poem:reset_all_effects', {});
    expect(getActiveEffects()).toHaveLength(0);
  });

  it('reviveGameEngine re-enables EventBus handlers', () => {
    const calls: string[] = [];
    eventBus.on('scene:enter', () => {
      calls.push('enter');
    });

    disposeGameEngine();
    reviveGameEngine();

    eventBus.on('scene:enter', () => {
      calls.push('enter');
    });
    eventBus.emit('scene:enter', {
      sceneId: 'volodka_room',
      fromSceneId: 'volodka_room',
    });
    expect(calls).toHaveLength(1);
  });

  it('reviveGameEngine re-arms QuestTracker subscriptions', () => {
    questTracker.start();

    disposeGameEngine();
    reviveGameEngine();

    expect(() => questTracker.start()).not.toThrow();
  });

  it('reviveGameEngine re-arms WorldEventDirector', () => {
    const before = getWorldEventDirector();
    before.start();

    disposeGameEngine();
    reviveGameEngine();

    const after = getWorldEventDirector();
    expect(after).not.toBe(before);
  });

  it('reviveGameEngine recreates WorldStreamManager singleton after dispose', () => {
    const before = getWorldStreamManager();
    before.setStreamingEnabled(true);
    expect(before.isStreamingEnabled()).toBe(true);

    disposeGameEngine();
    reviveGameEngine();

    const after = getWorldStreamManager();
    expect(after).not.toBe(before);
    expect(after.isStreamingEnabled()).toBe(false);
  });

  it('reviveGameEngine recreates NavMeshLayer singleton after dispose', () => {
    const before = getNavMeshLayer();

    disposeGameEngine();
    reviveGameEngine();

    expect(getNavMeshLayer()).not.toBe(before);
  });

  it('reviveGameEngine recreates world compute worker when available', () => {
    if (!isWorldComputeWorkerAvailable()) return;

    const before = getWorldComputeWorker();

    disposeGameEngine();
    reviveGameEngine();

    const after = getWorldComputeWorker();
    expect(after).not.toBe(before);
  });

  it('reviveGameEngine re-registers module global cleanup handlers', () => {
    const handlerCount = getRegisteredGlobalCleanupHandlerCount();
    expect(handlerCount).toBeGreaterThan(0);

    getSharedBoxGeometry(1, 1, 1);
    expect(getRegisteredModuleGeometryCount()).toBeGreaterThan(0);

    disposeGameEngine();
    expect(getRegisteredGlobalCleanupHandlerCount()).toBe(0);

    reviveGameEngine();
    expect(getRegisteredGlobalCleanupHandlerCount()).toBe(handlerCount);

    getSharedBoxGeometry(2, 2, 2);
    runGlobalUnmountCleanup('volodka_room');
    expect(getRegisteredModuleGeometryCount()).toBe(0);
  });

  it('disposeGameEngine detaches keyboard listeners', () => {
    const handlers = new Map<string, EventListener>();
    vi.stubGlobal('window', {
      addEventListener: (type: string, handler: EventListener) => {
        handlers.set(type, handler);
      },
      removeEventListener: (type: string, handler: EventListener) => {
        if (handlers.get(type) === handler) handlers.delete(type);
      },
      dispatchEvent: vi.fn(),
    });

    bindKeyboardInput();
    handlers.get('keydown')?.({
      code: 'KeyW',
      target: null,
      repeat: false,
    } as KeyboardEvent);
    expect(sampleKeyboardMovement().forward).toBe(true);

    disposeGameEngine();
    expect(sampleKeyboardMovement().forward).toBe(false);

    handlers.get('keydown')?.({
      code: 'KeyW',
      target: null,
      repeat: false,
    } as KeyboardEvent);
    expect(sampleKeyboardMovement().forward).toBe(false);

    vi.unstubAllGlobals();
  });

  it('reviveGameEngine re-binds interaction session reset on scene:transition_start', () => {
    writeInteractionSession(InteractionState.Dialogue, 'npc_maria', { force: true });

    disposeGameEngine();
    // dispose resets session to Idle; re-arm Dialogue to prove listener is gone.
    writeInteractionSession(InteractionState.Dialogue, 'npc_maria', { force: true });
    eventBus.emit('scene:transition_start', {
      targetScene: 'volodka_corridor',
      fromSceneId: 'volodka_room',
      spawnAt: [0, 0, 0],
    });
    expect(getInteractionSession().state).toBe(InteractionState.Dialogue);

    reviveGameEngine();
    writeInteractionSession(InteractionState.Dialogue, 'npc_maria', { force: true });
    eventBus.emit('scene:transition_start', {
      targetScene: 'volodka_corridor',
      fromSceneId: 'volodka_room',
      spawnAt: [0, 0, 0],
    });
    expect(getInteractionSession().state).toBe(InteractionState.Idle);
  });

  it('reviveGameEngine re-binds scene:loaded bridge after dispose cycle', () => {
    bindSceneLoadedBridge();

    disposeGameEngine();
    reviveGameEngine();

    const loaded = vi.fn();
    eventBus.on('scene:loaded', loaded);

    scheduleSceneLoaded({ sceneId: 'cafe_evening', fromSceneId: 'volodka_room' });
    eventBus.emit('canvas:first-frame', { generation: 1 });

    expect(loaded).toHaveBeenCalledWith({
      sceneId: 'cafe_evening',
      fromSceneId: 'volodka_room',
    });
  });
});
