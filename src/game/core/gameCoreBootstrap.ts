import { startExplorationAmbienceService } from '@/game/core/explorationAmbienceService';
import { startExplorationDialogueHintService } from '@/game/core/explorationDialogueHintService';
import { startObjectInteractionService } from '@/game/core/objectInteractionService';

/**
 * Подключает сервисы ядра игры (без React): интеракции объектов, амбиент стресса, подсказка квест/карма.
 * Вызывать один раз при монтировании корня игры; возвращённая функция — отписка.
 */
export function initGameCore(): () => void {
  const teardowns = [
    startObjectInteractionService(),
    startExplorationAmbienceService(),
    startExplorationDialogueHintService(),
  ];
  return () => {
    for (const t of teardowns) t();
  };
}
