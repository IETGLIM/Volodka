"use client";

import { useEffect } from 'react';
import { eventBus } from '@/engine/EventBus';
import { useInteractionHintStore } from '@/state/interactionHintStore';

/**
 * Синхронизирует `ui:interaction_hint` / `ui:interaction_feedback` со стором HUD (десктоп + моб. кнопка E).
 */
export function InteractionHintListener() {
  const show = useInteractionHintStore((s) => s.show);
  const hide = useInteractionHintStore((s) => s.hide);

  useEffect(() => {
    const offHint = eventBus.on('ui:interaction_hint', ({ text }) => {
      show(text);
    });

    const offFeedback = eventBus.on('ui:interaction_feedback', ({ kind }) => {
      if (kind === 'success' || kind === 'hint_clear') {
        hide();
      }
    });

    return () => {
      offHint();
      offFeedback();
    };
  }, [show, hide]);

  return null;
}
