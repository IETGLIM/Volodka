import { describe, it, expect, afterEach } from 'vitest';
import type { RootState } from '@react-three/fiber';
import {
  getNpcFrameBatchEntryCount,
  registerNpcFrameCallback,
  resetNpcFrameBatchForTests,
  runNpcFrameBatch,
} from './npcFrameBatch';
import { DEFAULT_FRAME_GAME_SNAPSHOT } from '@/engine/frame/frameGameSnapshot';

const frameCtx = { state: {} as RootState, delta: 1 / 60, game: DEFAULT_FRAME_GAME_SNAPSHOT };

describe('npcFrameBatch', () => {
  afterEach(() => {
    resetNpcFrameBatchForTests();
  });

  it('runs all registered NPC callbacks in one batch pass', () => {
    const calls: string[] = [];
    const unsubs = Array.from({ length: 20 }, (_, index) =>
      registerNpcFrameCallback(`npc-${index}`, 'main', () => {
        calls.push(`npc-${index}`);
      }),
    );

    runNpcFrameBatch(frameCtx);
    expect(calls).toHaveLength(20);

    for (const unsub of unsubs) {
      unsub();
    }
    expect(getNpcFrameBatchEntryCount()).toBe(0);
  });

  it('skips disabled entries without unregistering', () => {
    let calls = 0;
    registerNpcFrameCallback('npc-a', 'mixer', () => {
      calls += 1;
    }, { enabled: () => false });

    runNpcFrameBatch(frameCtx);
    expect(calls).toBe(0);
    expect(getNpcFrameBatchEntryCount()).toBe(1);
  });
});
