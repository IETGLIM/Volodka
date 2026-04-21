import { eventBus } from '@/engine/events/EventBus';

/**
 * Оркестратор сценариев обхода: подписки на шину, без прямого доступа к ECS.
 * Сюда переносятся реакции на фазы интро, брифинг, тосты — не в `RPGGameCanvas`.
 */
export function mountExplorationController(): () => void {
  const unsubs: Array<() => void> = [];

  unsubs.push(
    eventBus.on('exploration:interaction_detected', (_payload) => {
      // TODO: resolve → emit `exploration:interaction_resolved` из gameplay.
    }),
  );

  return () => {
    for (const u of unsubs) {
      u();
    }
  };
}
