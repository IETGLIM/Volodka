import { eventBus } from '@/engine/EventBus';

export function emitInteractionFeedback(kind: 'success' | 'fail', actionId?: string): void {
  eventBus.emit('ui:interaction_feedback', {
    kind,
    timestamp: performance.now(),
    ...(actionId !== undefined ? { actionId } : {}),
  });
}
