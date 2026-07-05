import { eventBus } from '@/engine/EventBus';

/** Subtle HUD reminder after the cinematic celebration closes (rewards already shown in-overlay). */
export function emitFirstReadingCompletionFeedback(): void {
  eventBus.emit('ui:highlight_poem_badge', { poemId: 'poem_2' });
  eventBus.emit('game:notification', {
    title: 'Первое чтение',
    subtitle: 'Стих «Смерть есть лишь начало» сохранён в сборнике — значок 📖 справа.',
    type: 'quest',
  });
}
