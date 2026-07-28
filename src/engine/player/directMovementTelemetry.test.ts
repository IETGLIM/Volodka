import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  logKccRecreateAttempt,
  notifyControlsDegraded,
  notifyKccUnstuck,
  restoreKccMovementMode,
  type DirectMovementTelemetryRefs,
} from './directMovementTelemetry';

const eventBusEmit = vi.fn();
const devLog = vi.fn();
const devWarn = vi.fn();

vi.mock('@/engine/EventBus', () => ({
  eventBus: {
    emit: (...args: unknown[]) => eventBusEmit(...args),
  },
}));

vi.mock('@/shared/utils/devLog', () => ({
  devLog: (...args: unknown[]) => devLog(...args),
  devWarn: (...args: unknown[]) => devWarn(...args),
}));

function createRefs(): DirectMovementTelemetryRefs {
  return {
    controlsDegradedRef: { current: false },
    degradedLoggedRef: { current: false },
    degradedReasonRef: { current: null },
    recreateAttemptsRef: { current: 0 },
  };
}

describe('directMovementTelemetry', () => {
  beforeEach(() => {
    eventBusEmit.mockClear();
    devLog.mockClear();
    devWarn.mockClear();
  });

  it('logs recreate attempts without enabling movement bypass', () => {
    const refs = createRefs();
    logKccRecreateAttempt(refs, 'input_no_displacement', {
      sceneId: 'home_evening',
      stuckFrames: 15,
    });

    expect(refs.recreateAttemptsRef.current).toBe(1);
    expect(refs.controlsDegradedRef.current).toBe(false);
    expect(devLog).toHaveBeenCalledWith(
      '[PhysicsPlayer][KCC-recreate]',
      'input_no_displacement',
      expect.objectContaining({ attempt: 1, sceneId: 'home_evening' }),
    );
  });

  it('emits stuck-recovery exploration toast', () => {
    notifyKccUnstuck({ sceneId: 'home_evening' });
    expect(eventBusEmit).toHaveBeenCalledWith('ui:exploration_message', {
      text: expect.stringContaining('Застревание'),
    });
  });

  it('notifies controls degraded once per reason', () => {
    const refs = createRefs();
    notifyControlsDegraded(refs, 'kcc_unavailable', {
      sceneId: 'home_evening',
      failFrames: 60,
    });
    notifyControlsDegraded(refs, 'kcc_unavailable', {
      sceneId: 'home_evening',
      failFrames: 61,
    });

    expect(refs.controlsDegradedRef.current).toBe(true);
    expect(devWarn).toHaveBeenCalledTimes(1);
    expect(eventBusEmit).toHaveBeenCalledTimes(2);
    expect(eventBusEmit).toHaveBeenCalledWith('player:physics_degraded', {
      degraded: true,
      sceneId: 'home_evening',
      reason: 'kcc_unavailable',
    });
    expect(eventBusEmit).toHaveBeenCalledWith('ui:exploration_message', {
      text: expect.stringContaining('Controls degraded'),
    });
  });

  it('restores KCC telemetry state', () => {
    const refs = createRefs();
    notifyControlsDegraded(refs, 'kcc_unavailable', { sceneId: 'home_evening', failFrames: 60 });
    refs.recreateAttemptsRef.current = 3;

    restoreKccMovementMode(refs, { sceneId: 'home_evening' });

    expect(refs.controlsDegradedRef.current).toBe(false);
    expect(refs.degradedLoggedRef.current).toBe(false);
    expect(refs.degradedReasonRef.current).toBeNull();
    expect(refs.recreateAttemptsRef.current).toBe(0);
    expect(eventBusEmit).toHaveBeenCalledWith('player:physics_degraded', {
      degraded: false,
      sceneId: 'home_evening',
    });
  });
});
