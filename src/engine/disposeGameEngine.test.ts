import { describe, it, expect, beforeEach } from 'vitest';
import {
  disposeGameEngine,
  reviveGameEngine,
  isGameEngineDisposed,
} from '@/engine/disposeGameEngine';
import { eventBus } from '@/engine/EventBus';

describe('disposeGameEngine', () => {
  beforeEach(() => {
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
});
