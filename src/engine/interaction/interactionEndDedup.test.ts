import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InteractionState } from '@/engine/interaction/interactionMachine';

const emitMock = vi.fn();

vi.mock('@/engine/EventBus', () => ({
  eventBus: { emit: (...args: unknown[]) => emitMock(...args) },
}));

const getInteractionState = vi.fn(() => InteractionState.Dialogue);
const isInteractionLocked = vi.fn(() => true);

vi.mock('@/engine/interaction/interactionSession', () => ({
  getInteractionState: () => getInteractionState(),
  isInteractionLocked: () => isInteractionLocked(),
}));

import {
  emitInteractionEndIfNeeded,
  forceEmitInteractionEnd,
  resetInteractionEndDedup,
  wasInteractionEndEmitted,
} from './interactionEndDedup';

describe('interactionEndDedup', () => {
  beforeEach(() => {
    emitMock.mockClear();
    resetInteractionEndDedup();
    getInteractionState.mockReturnValue(InteractionState.Dialogue);
    isInteractionLocked.mockReturnValue(true);
  });

  it('emits interaction:end once per session when interaction is active', () => {
    expect(emitInteractionEndIfNeeded()).toBe(true);
    expect(emitMock).toHaveBeenCalledWith('interaction:end', {});
    expect(wasInteractionEndEmitted()).toBe(true);

    expect(emitInteractionEndIfNeeded()).toBe(false);
    expect(emitMock).toHaveBeenCalledTimes(1);
  });

  it('skips emit when idle and unlocked', () => {
    getInteractionState.mockReturnValue(InteractionState.Idle);
    isInteractionLocked.mockReturnValue(false);

    expect(emitInteractionEndIfNeeded()).toBe(false);
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('forceEmitInteractionEnd dedupes within session', () => {
    expect(forceEmitInteractionEnd()).toBe(true);
    expect(forceEmitInteractionEnd()).toBe(false);
    expect(emitMock).toHaveBeenCalledTimes(1);
  });

  it('resetInteractionEndDedup allows a new emit', () => {
    emitInteractionEndIfNeeded();
    resetInteractionEndDedup();
    expect(wasInteractionEndEmitted()).toBe(false);
    expect(emitInteractionEndIfNeeded()).toBe(true);
    expect(emitMock).toHaveBeenCalledTimes(2);
  });
});
