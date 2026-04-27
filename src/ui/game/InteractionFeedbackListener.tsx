"use client";

import { useEffect } from 'react';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';

/**
 * Централизованный consumer `ui:interaction_feedback`: звук + короткий hit-toast через `ui:effect_notif`
 * (обрабатывается в `GameOrchestrator`). Тряска камеры — модуль `explorationCameraShake.ts`.
 */
export function InteractionFeedbackListener() {
  useEffect(() => {
    return eventBus.on('ui:interaction_feedback', ({ kind }) => {
      if (kind === 'success') {
        audioEngine.playSfx('ui_success', 0.32);
        eventBus.emit('ui:effect_notif', {
          text: 'Взаимодействие выполнено',
          type: 'system',
          durationMs: 1200,
        });
      } else {
        audioEngine.playSfx('ui_fail', 0.26);
        eventBus.emit('ui:effect_notif', {
          text: 'Ничего не произошло',
          type: 'system',
          durationMs: 900,
        });
      }
    });
  }, []);

  return null;
}
