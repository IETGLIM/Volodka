import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bindAppEventBus, resetAppEventBusForTests } from '@/shared/events/appEventBus';
import { emitQuestFailed, emitQuestRetried } from './storeEffects';

describe('emitQuestFailed', () => {
  beforeEach(() => {
    resetAppEventBusForTests();
  });

  it('forwards quest:failed to bound bus with full payload', () => {
    const emit = vi.fn();
    const handler = vi.fn();
    bindAppEventBus({
      emit: (event, payload) => {
        emit(event, payload);
        if (event === 'quest:failed') handler(payload);
      },
      on: vi.fn(() => () => undefined),
    });

    const payload = {
      questId: 'data_heist',
      questTitle: 'Похищение данных',
      reason: 'Истекло время задания',
      canRetry: true,
    };

    emitQuestFailed(payload);

    expect(emit).toHaveBeenCalledWith('quest:failed', payload);
    expect(handler).toHaveBeenCalledWith(payload);
  });

  it('forwards quest:retried to bound bus', () => {
    const emit = vi.fn();
    bindAppEventBus({
      emit,
      on: vi.fn(() => () => undefined),
    });

    emitQuestRetried('data_heist', 'Похищение данных');

    expect(emit).toHaveBeenCalledWith('quest:retried', {
      questId: 'data_heist',
      questTitle: 'Похищение данных',
    });
  });
});
