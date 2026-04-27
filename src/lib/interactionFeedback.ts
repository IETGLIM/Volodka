import { eventBus } from '@/engine/EventBus';

export function emitInteractionFeedback(kind: 'success' | 'fail'): void {
  eventBus.emit('ui:interaction_feedback', {
    kind,
    timestamp: performance.now(),
  });
}
