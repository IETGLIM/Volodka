import { eventBus } from '@/engine/EventBus';

/**
 * Тактиальный отклик на E в обходе. Потребители: `InteractionFeedbackListener` (звук + «OK» / «Нет действий»),
 * `explorationCameraShake`, `InteractionHintListener`. Используйте осмысленный `actionId` для дедупа и интенсивности тряски.
 * Для сброса хинта без звука шина шлёт `hint_clear` напрямую (`useInteractionAnticipation`), не через эту функцию.
 */
export function emitInteractionFeedback(kind: 'success' | 'fail', actionId?: string): void {
  eventBus.emit('ui:interaction_feedback', {
    kind,
    timestamp: performance.now(),
    ...(actionId !== undefined ? { actionId } : {}),
  });
}
