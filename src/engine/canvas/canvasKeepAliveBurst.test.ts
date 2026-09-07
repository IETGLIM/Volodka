import { describe, it, expect, afterEach } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import {
  GESTURE_BURST_MS,
  NPC_TRANSITION_BURST_MS,
  startKeepAliveBurst,
  type KeepAliveBurstHandle,
} from './canvasKeepAliveBurst';

/** Управляемые часы и планировщик кадров для детерминированных тестов. */
function createFakeFrameClock() {
  let time = 1000;
  let frameId = 0;
  const pending = new Map<number, () => void>();
  const scheduled: number[] = [];
  return {
    advance(ms: number): void {
      const steps = Math.ceil(ms / 16);
      for (let i = 0; i < steps; i += 1) {
        time += 16;
        const callbacks = [...pending.values()];
        pending.clear();
        for (const cb of callbacks) cb();
      }
      time += ms % 16;
    },
    now: () => time,
    scheduleFrame: (cb: () => void) => {
      frameId += 1;
      pending.set(frameId, cb);
      scheduled.push(frameId);
      return frameId;
    },
    cancelFrame: (id: number) => {
      pending.delete(id);
    },
    pendingCount: () => pending.size,
    scheduledCount: () => scheduled.length,
  };
}

function startBurstWith(clock: ReturnType<typeof createFakeFrameClock>, opts?: {
  isStaticScreen?: () => boolean;
}): { handle: KeepAliveBurstHandle; getInvalidations: () => number } {
  let invalidations = 0;
  const handle = startKeepAliveBurst({
    isStaticScreen: opts?.isStaticScreen ?? (() => true),
    invalidate: () => {
      invalidations += 1;
    },
    scheduleFrame: clock.scheduleFrame,
    cancelFrame: clock.cancelFrame,
    now: clock.now,
  });
  return { handle, getInvalidations: () => invalidations };
}

describe('canvasKeepAliveBurst (аудит этап 64)', () => {
  let active: { handle: KeepAliveBurstHandle; getInvalidations: () => number } | null = null;

  afterEach(() => {
    active?.handle.dispose();
    active = null;
  });

  it('интервалов нет: без событий invalidate не вызывается вовсе', () => {
    const clock = createFakeFrameClock();
    active = startBurstWith(clock);
    clock.advance(10_000);
    expect(active.getInvalidations()).toBe(0);
    expect(clock.scheduledCount()).toBe(0);
  });

  it('npc:entry_start открывает окно: invalidate идёт кадрами и самозавершается по дедлайну', () => {
    const clock = createFakeFrameClock();
    active = startBurstWith(clock);

    eventBus.emit('npc:entry_start', {
      npcId: 'npc-victoria',
      targetPosition: [-1.5, 0, -2.5],
      sceneId: 'guild_mainframe',
    });

    // Окно = NPC_TRANSITION_BURST_MS; на 16-мс шагах это ~217 кадров.
    clock.advance(NPC_TRANSITION_BURST_MS / 2);
    const half = active.getInvalidations();
    expect(half).toBeGreaterThan(50);

    clock.advance(NPC_TRANSITION_BURST_MS);
    // Дедлайн истёк — цепочка остановлена, новых кадров не запланировано.
    expect(clock.pendingCount()).toBe(0);
    const after = active.getInvalidations();
    clock.advance(2000);
    expect(active.getInvalidations()).toBe(after);
  });

  it('в always-режиме (isStaticScreen=false) пробуждение не инвалидирует', () => {
    const clock = createFakeFrameClock();
    active = startBurstWith(clock, { isStaticScreen: () => false });

    eventBus.emit('npc:animation', { npcId: 'npc-1', state: 'talk' });
    clock.advance(2000);

    expect(active.getInvalidations()).toBe(0);
    expect(clock.pendingCount()).toBe(0);
  });

  it('перекрывающиеся события расширяют окно (max), а не перезапускают', () => {
    const clock = createFakeFrameClock();
    active = startBurstWith(clock);

    eventBus.emit('npc:animation', { npcId: 'npc-1', state: 'gesture' });
    clock.advance(GESTURE_BURST_MS / 2);
    eventBus.emit('quest:pulse_marker', { questId: 'q1' });
    clock.advance(GESTURE_BURST_MS / 2);
    // Второе событие продлило окно — инвалидации продолжаются.
    const mid = active.getInvalidations();
    expect(mid).toBeGreaterThan(20);

    clock.advance(GESTURE_BURST_MS + 100);
    const done = active.getInvalidations();
    clock.advance(1000);
    expect(active.getInvalidations()).toBe(done);
    expect(clock.pendingCount()).toBe(0);
  });

  it('dispose гасит цепочку и отписывает события', () => {
    const clock = createFakeFrameClock();
    const local = startBurstWith(clock);
    eventBus.emit('npc:exit_start', { npcId: 'npc-2', sceneId: 'city_square' });
    expect(clock.pendingCount()).toBe(1);

    local.handle.dispose();
    expect(clock.pendingCount()).toBe(0);

    // События после dispose больше не открывают окна.
    eventBus.emit('npc:animation', { npcId: 'npc-3', state: 'idle' });
    expect(clock.pendingCount()).toBe(0);
    clock.advance(2000);
    expect(local.getInvalidations()).toBe(0);
  });

  it('окна событий реестра согласованы с константами переходов NPC', () => {
    // 3.0 с (EXIT_TIMEOUT_S) + 500 мс запаса.
    expect(NPC_TRANSITION_BURST_MS).toBe(3500);
    expect(GESTURE_BURST_MS).toBe(700);
  });
});
