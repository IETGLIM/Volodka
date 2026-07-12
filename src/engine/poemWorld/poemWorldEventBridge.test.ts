import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import { executePoemWorldVisuals } from '@/engine/poemWorld/executePoemWorldVisuals';
import {
  bindPoemWorldEventBridge,
  emitPoemWorldEvent,
  unbindPoemWorldEventBridge,
} from '@/engine/poemWorld/poemWorldEventBridge';
import { resolvePoemWorldEffect } from '@/engine/poemWorld/poemWorldEffectResolver';

vi.mock('@/engine/poemWorld/executePoemWorldVisuals', () => ({
  executePoemWorldVisuals: vi.fn(),
}));

vi.mock('@/engine/accessibility/accessibilitySettings', () => ({
  isEffectiveReducedMotion: vi.fn(() => false),
}));

vi.mock('@/engine/GameActionDispatcher', () => ({
  dispatchGameAction: vi.fn(),
}));

import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';

describe('poemWorldEventBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unbindPoemWorldEventBridge();
    vi.mocked(isEffectiveReducedMotion).mockReturnValue(false);
  });

  it('emitPoemWorldEvent fires visuals and poem:world_event', () => {
    const handler = vi.fn();
    const unsub = eventBus.on('poem:world_event', handler);

    emitPoemWorldEvent('poem_3', 'Путеводная Звезда');

    expect(executePoemWorldVisuals).toHaveBeenCalledWith(
      expect.objectContaining({ visualPreset: 'god_rays_gold' }),
      { reducedMotion: false },
    );
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        poemId: 'poem_3',
        powerName: 'Путеводная Звезда',
        profile: expect.objectContaining({ category: 'exploration' }),
      }),
    );
    expect(dispatchGameAction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'world/upsertHintFlag',
        flag: expect.objectContaining({ key: 'poem_hint_exit_glow_active', poemId: 'poem_3' }),
      }),
    );

    unsub();
  });

  it('skips shake-like hints when reduced motion is on', () => {
    vi.mocked(isEffectiveReducedMotion).mockReturnValue(true);
    emitPoemWorldEvent('poem_5', 'Штормовой Ветер');
    expect(executePoemWorldVisuals).toHaveBeenCalledWith(
      expect.objectContaining({ visualPreset: 'storm_break' }),
      { reducedMotion: true },
    );
  });

  it('bindPoemWorldEventBridge relays poem:power_used', () => {
    bindPoemWorldEventBridge();
    const handler = vi.fn();
    const unsub = eventBus.on('poem:world_event', handler);

    eventBus.emit('poem:power_used', { poemId: 'poem_1', powerName: 'Правда Глас' });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]![0].profile).toEqual(resolvePoemWorldEffect('poem_1'));

    unsub();
    unbindPoemWorldEventBridge();
  });

  it('bindPoemWorldEventBridge is idempotent', () => {
    bindPoemWorldEventBridge();
    bindPoemWorldEventBridge();
    const handler = vi.fn();
    const unsub = eventBus.on('poem:world_event', handler);

    eventBus.emit('poem:power_used', { poemId: 'poem_1', powerName: 'Правда Глас' });

    expect(handler).toHaveBeenCalledTimes(1);

    unsub();
  });

  it('unbindPoemWorldEventBridge removes relay listeners', () => {
    bindPoemWorldEventBridge();
    const handler = vi.fn();
    const unsub = eventBus.on('poem:world_event', handler);

    unbindPoemWorldEventBridge();
    eventBus.emit('poem:power_used', { poemId: 'poem_1', powerName: 'Правда Глас' });

    expect(handler).not.toHaveBeenCalled();

    unsub();
  });
});
