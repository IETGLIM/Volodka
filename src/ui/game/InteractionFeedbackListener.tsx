"use client";

import { useEffect } from 'react';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';

/**
 * Централизованный consumer `ui:interaction_feedback`: звук + короткий hit-toast через `ui:effect_notif`
 * (обрабатывается в `GameOrchestrator`). Тряска камеры — модуль `explorationCameraShake.ts`.
 */
let lastSuccessTs = 0;
const SUCCESS_DEBOUNCE_MS = 250;

export function InteractionFeedbackListener() {
  useEffect(() => {
    return eventBus.on('ui:interaction_feedback', ({ kind, timestamp }) => {
      if (kind === 'success') {
        if (timestamp - lastSuccessTs < SUCCESS_DEBOUNCE_MS) return;
        lastSuccessTs = timestamp;

        audioEngine.playSfx('ui_success', 0.32);
        eventBus.emit('ui:effect_notif', {
          text: 'OK',
          type: 'system',
          durationMs: 600,
        });
      } else {
        audioEngine.playSfx('ui_fail', 0.26);
        eventBus.emit('ui:effect_notif', {
          text: 'Нет доступных действий',
          type: 'system',
          durationMs: 900,
        });
      }
    });
  }, []);

  return null;
}
