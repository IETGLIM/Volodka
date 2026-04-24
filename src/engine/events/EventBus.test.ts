import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { eventBus } from '@/engine/events/EventBus';

describe('EventBus', () => {
  beforeEach(() => {
    eventBus.clear();
  });

  afterEach(() => {
    eventBus.clear();
  });

  it('delivers emit to on() subscribers with typed payload', () => {
    const seen: unknown[] = [];
    const unsub = eventBus.on('flag:set', (p) => {
      seen.push(p.flag);
    });
    eventBus.emit('flag:set', { flag: 'test_flag' });
    expect(seen).toEqual(['test_flag']);
    unsub();
    eventBus.emit('flag:set', { flag: 'after' });
    expect(seen).toEqual(['test_flag']);
  });

  it('once() fires only once', () => {
    let n = 0;
    eventBus.once('quest:completed', () => {
      n += 1;
    });
    eventBus.emit('quest:completed', { questId: 'q1' });
    eventBus.emit('quest:completed', { questId: 'q2' });
    expect(n).toBe(1);
  });

  it('off() removes handler', () => {
    let n = 0;
    const h = () => {
      n += 1;
    };
    eventBus.on('stat:changed', h);
    eventBus.off('stat:changed', h);
    eventBus.emit('stat:changed', {
      stat: 'mood',
      oldValue: 0,
      newValue: 10,
      delta: 10,
    });
    expect(n).toBe(0);
  });

  it('usePreEmit can cancel emission', () => {
    let n = 0;
    eventBus.on('poem:collected', () => {
      n += 1;
    });
    const remove = eventBus.usePreEmit(() => null);
    eventBus.emit('poem:collected', { poemId: 'p1' });
    expect(n).toBe(0);
    remove();
    eventBus.emit('poem:collected', { poemId: 'p2' });
    expect(n).toBe(1);
  });

  it('usePreEmit can rewrite payload', () => {
    let id = '';
    eventBus.on('quest:activated', (p) => {
      id = p.questId;
    });
    const remove = eventBus.usePreEmit((_e, payload) => ({
      ...payload,
      questId: 'rewritten',
    }));
    eventBus.emit('quest:activated', { questId: 'orig' });
    expect(id).toBe('rewritten');
    remove();
  });

  it('usePostEmit runs after handlers with handler count', () => {
    let lastCount = -1;
    eventBus.on('game:saved', () => {});
    eventBus.on('game:saved', () => {});
    const remove = eventBus.usePostEmit((_e, _p, count) => {
      lastCount = count;
    });
    eventBus.emit('game:saved', { timestamp: 1 });
    expect(lastCount).toBe(2);
    remove();
  });

  it('getLog and getLastEvent track emissions', () => {
    eventBus.emit('dialogue:ended', { npcId: 'n', dialogueId: 'd' });
    const last = eventBus.getLastEvent();
    expect(last?.event).toBe('dialogue:ended');
    expect(eventBus.getLog().length).toBe(1);
  });

  it('getEventStats aggregates by event name', () => {
    eventBus.emit('flag:set', { flag: 'a' });
    eventBus.emit('flag:set', { flag: 'b' });
    eventBus.emit('flag:unset', { flag: 'a' });
    expect(eventBus.getEventStats()).toEqual({
      'flag:set': 2,
      'flag:unset': 1,
    });
  });

  it('clear() wipes listeners, once, middleware, log', () => {
    eventBus.on('achievement:unlocked', () => {});
    eventBus.once('achievement:unlocked', () => {});
    eventBus.usePreEmit((e, p) => p);
    eventBus.emit('achievement:unlocked', { achievementId: 'x' });
    eventBus.clear();
    expect(eventBus.getLog().length).toBe(0);
    expect(eventBus.getSubscriberCounts()).toEqual({});
    expect(eventBus.hasSubscribers('achievement:unlocked')).toBe(false);
  });

  it('hasSubscribers reflects on and once', () => {
    expect(eventBus.hasSubscribers('scene:enter')).toBe(false);
    eventBus.once('scene:enter', () => {});
    expect(eventBus.hasSubscribers('scene:enter')).toBe(true);
  });

  it('survives handler throw without breaking other handlers', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let second = false;
    eventBus.on('ui:exploration_message', () => {
      throw new Error('boom');
    });
    eventBus.on('ui:exploration_message', () => {
      second = true;
    });
    eventBus.emit('ui:exploration_message', { text: 'hi' });
    expect(second).toBe(true);
    spy.mockRestore();
  });
});
