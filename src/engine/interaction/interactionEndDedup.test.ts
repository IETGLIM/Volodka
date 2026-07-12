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
  beginInteractionEndCycle,
  emitInteractionEndIfNeeded,
  forceEmitInteractionEnd,
  getInteractionEndCycleId,
  resetInteractionEndDedup,
  resetInteractionEndDedupState,
  wasInteractionEndEmitted,
} from './interactionEndDedup';

describe('interactionEndDedup', () => {
  beforeEach(() => {
    emitMock.mockClear();
    resetInteractionEndDedupState();
    getInteractionState.mockReturnValue(InteractionState.Dialogue);
    isInteractionLocked.mockReturnValue(true);
  });

  it('emits interaction:end once per cycle when interaction is active', () => {
    beginInteractionEndCycle();
    expect(emitInteractionEndIfNeeded()).toBe(true);
    expect(emitMock).toHaveBeenCalledWith('interaction:end', {});
    expect(wasInteractionEndEmitted()).toBe(true);

    expect(emitInteractionEndIfNeeded()).toBe(false);
    expect(emitMock).toHaveBeenCalledTimes(1);
  });

  it('skips emit when idle and unlocked', () => {
    beginInteractionEndCycle();
    getInteractionState.mockReturnValue(InteractionState.Idle);
    isInteractionLocked.mockReturnValue(false);

    expect(emitInteractionEndIfNeeded()).toBe(false);
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('forceEmitInteractionEnd dedupes within cycle', () => {
    beginInteractionEndCycle();
    expect(forceEmitInteractionEnd()).toBe(true);
    expect(forceEmitInteractionEnd()).toBe(false);
    expect(emitMock).toHaveBeenCalledTimes(1);
  });

  it('beginInteractionEndCycle allows a new emit after previous cycle ended', () => {
    beginInteractionEndCycle();
    emitInteractionEndIfNeeded();
    expect(wasInteractionEndEmitted()).toBe(true);

    beginInteractionEndCycle();
    expect(wasInteractionEndEmitted()).toBe(false);
    expect(getInteractionEndCycleId()).toBe(2);
    expect(emitInteractionEndIfNeeded()).toBe(true);
    expect(emitMock).toHaveBeenCalledTimes(2);
  });

  it('resetInteractionEndDedup is an alias for beginInteractionEndCycle', () => {
    beginInteractionEndCycle();
    emitInteractionEndIfNeeded();
    resetInteractionEndDedup();
    expect(wasInteractionEndEmitted()).toBe(false);
    expect(emitInteractionEndIfNeeded()).toBe(true);
    expect(emitMock).toHaveBeenCalledTimes(2);
  });

  it('allows emit for NPC B after NPC A without interaction:start if cycle advanced', () => {
    beginInteractionEndCycle();
    emitInteractionEndIfNeeded();
    expect(wasInteractionEndEmitted()).toBe(true);

    beginInteractionEndCycle();
    expect(emitInteractionEndIfNeeded()).toBe(true);
    expect(emitMock).toHaveBeenCalledTimes(2);
  });
});
