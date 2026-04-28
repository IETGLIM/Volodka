"use client";

import { useEffect } from 'react';
import { eventBus } from '@/engine/EventBus';

/**
 * Краткий сигнал «можно жать E» при появлении доступного взаимодействия (подписчики на `ui:interaction_hint`).
 */
export function useInteractionAnticipation(canInteract: boolean) {
  useEffect(() => {
    if (canInteract) {
      eventBus.emit('ui:interaction_hint', { text: 'E' });
    }
  }, [canInteract]);
}
