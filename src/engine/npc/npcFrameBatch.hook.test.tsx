import { describe, it, expect, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { RootState } from '@react-three/fiber';
import {
  getNpcFrameBatchEntryCount,
  getNpcFrameBatchRebuildCount,
  resetNpcFrameBatchForTests,
  runNpcFrameBatch,
  useRegisterNpcFrame,
} from './npcFrameBatch';
import { DEFAULT_FRAME_GAME_SNAPSHOT } from '@/engine/frame/frameGameSnapshot';

const frameCtx = { state: {} as RootState, delta: 1 / 60, game: DEFAULT_FRAME_GAME_SNAPSHOT };

describe('useRegisterNpcFrame (аудит этап 110 — churn)', () => {
  afterEach(() => {
    resetNpcFrameBatchForTests();
  });

  it('ре-рендеры с новой инлайн-идентичностью enabled не перерегистрируют запись', () => {
    const phase = 'thinking';
    const { rerender } = renderHook(
      ({ enabled }: { enabled?: boolean | (() => boolean) }) =>
        useRegisterNpcFrame('npc-sprite', 'sprite', () => {}, { enabled }),
      { initialProps: { enabled: () => phase === 'thinking' } },
    );

    // 50 ре-рендеров, каждый с новой инлайн-стрелкой (как в npcWorldSprite).
    for (let i = 0; i < 50; i += 1) {
      rerender({ enabled: () => phase === 'thinking' });
    }

    runNpcFrameBatch(frameCtx);
    expect(getNpcFrameBatchEntryCount()).toBe(1);
    // Единственная пересортировка — первичная (после регистрации); churn нет.
    expect(getNpcFrameBatchRebuildCount()).toBe(1);
  });

  it('семантика enabled сохраняется: false глушит, true возвращает без перерегистрации', () => {
    let calls = 0;
    const { rerender } = renderHook(
      ({ enabled }: { enabled?: boolean }) =>
        useRegisterNpcFrame('npc-layers', 'overlay', () => {
          calls += 1;
        }, { enabled }),
      { initialProps: { enabled: true } },
    );

    runNpcFrameBatch(frameCtx);
    expect(calls).toBe(1);

    rerender({ enabled: false });
    runNpcFrameBatch(frameCtx);
    expect(calls).toBe(1); // заглушено
    expect(getNpcFrameBatchEntryCount()).toBe(1);

    rerender({ enabled: true });
    runNpcFrameBatch(frameCtx);
    expect(calls).toBe(2); // снова активно
    expect(getNpcFrameBatchEntryCount()).toBe(1);
    expect(getNpcFrameBatchRebuildCount()).toBe(1);
  });

  it('enabled-функция вызывается на каждый прогон бэтча', () => {
    let gate = false;
    let calls = 0;
    renderHook(() =>
      useRegisterNpcFrame('npc-gate', 'main', () => {
        calls += 1;
      }, { enabled: () => gate }),
    );

    runNpcFrameBatch(frameCtx);
    expect(calls).toBe(0);

    gate = true;
    runNpcFrameBatch(frameCtx);
    expect(calls).toBe(1);

    gate = false;
    runNpcFrameBatch(frameCtx);
    expect(calls).toBe(1);
  });

  it('без опций enabled запись всегда активна', () => {
    let calls = 0;
    renderHook(() => useRegisterNpcFrame('npc-main', 'main', () => {
      calls += 1;
    }));
    runNpcFrameBatch(frameCtx);
    runNpcFrameBatch(frameCtx);
    expect(calls).toBe(2);
  });

  it('смена ownerKey перерегистрирует (смена NPC), смена колбэка — нет', () => {
    const { rerender } = renderHook(
      ({ owner, cb }: { owner: string; cb: () => void }) =>
        useRegisterNpcFrame(owner, 'mixer', cb),
      { initialProps: { owner: 'npc-a', cb: () => {} } },
    );

    rerender({ owner: 'npc-a', cb: () => {} });
    runNpcFrameBatch(frameCtx);
    expect(getNpcFrameBatchEntryCount()).toBe(1);

    rerender({ owner: 'npc-b', cb: () => {} });
    expect(getNpcFrameBatchEntryCount()).toBe(1); // старая снята, новая встала
    rerender({ owner: 'npc-b', cb: () => {} });
    runNpcFrameBatch(frameCtx);
    expect(getNpcFrameBatchEntryCount()).toBe(1);
  });

  it('размонтирование снимает регистрацию', () => {
    const { unmount } = renderHook(() =>
      useRegisterNpcFrame('npc-tmp', 'sprite', () => {}),
    );
    expect(getNpcFrameBatchEntryCount()).toBe(1);
    unmount();
    expect(getNpcFrameBatchEntryCount()).toBe(0);
  });
});
