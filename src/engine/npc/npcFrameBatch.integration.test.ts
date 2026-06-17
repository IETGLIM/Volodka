import { describe, it, expect, afterEach } from 'vitest';
import type { RootState } from '@react-three/fiber';
import {
  getRegisteredTickCount,
  registerFrameTick,
  unregisterFrameTick,
} from '@/engine/frame/FrameBudgetRegistry';
import {
  registerNpcFrameCallback,
  resetNpcFrameBatchForTests,
  runNpcFrameBatch,
} from '@/engine/npc/npcFrameBatch';
import { runFrameBudget } from '@/engine/frame/FrameBudgetRegistry';
import { DEFAULT_FRAME_GAME_SNAPSHOT } from '@/engine/frame/frameGameSnapshot';

const frameCtx = { state: {} as RootState, delta: 1 / 60, game: DEFAULT_FRAME_GAME_SNAPSHOT };

describe('npc frame batch vs useFrameTick', () => {
  afterEach(() => {
    resetNpcFrameBatchForTests();
  });

  it('20 background NPC batch entries use one coordinator tick, not 20', () => {
    let batchTickCalls = 0;
    const coordinatorId = registerFrameTick('npc', () => {
      batchTickCalls += 1;
      runNpcFrameBatch(frameCtx);
    }, { label: 'NpcFrameBatch-test' });

    for (let i = 0; i < 20; i += 1) {
      registerNpcFrameCallback(`bg-${i}`, 'main', () => {});
    }

    runFrameBudget(frameCtx);

    expect(batchTickCalls).toBe(1);
    expect(getRegisteredTickCount()).toBe(1);

    unregisterFrameTick(coordinatorId);
  });
});
