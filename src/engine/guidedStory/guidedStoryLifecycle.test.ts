import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import {
  bindGuidedStoryLifecycleListeners,
  unbindGuidedStoryLifecycleListeners,
} from '@/engine/GuidedStoryManager';
import * as storyGraphIndex from '@/engine/story/storyGraphIndex';

describe('bindGuidedStoryLifecycleListeners', () => {
  const invalidateSpy = vi.spyOn(storyGraphIndex, 'invalidateStoryGraphIndex');

  beforeEach(() => {
    invalidateSpy.mockClear();
    unbindGuidedStoryLifecycleListeners();
    bindGuidedStoryLifecycleListeners();
  });

  afterEach(() => {
    unbindGuidedStoryLifecycleListeners();
  });

  it('invalidates story graph on game:loaded', () => {
    eventBus.emit('game:loaded', {} as Record<string, never>);
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });

  it('invalidates story graph on game:reset', () => {
    eventBus.emit('game:reset', {} as Record<string, never>);
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });
});
