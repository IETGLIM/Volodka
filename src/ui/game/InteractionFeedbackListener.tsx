"use client";

import { useEffect } from 'react';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';

/**
 * Централизованный consumer `ui:interaction_feedback`: звук + короткий hit-toast через `ui:effect_notif`
 * (обрабатывается в `GameOrchestrator`). Тряска камеры — модуль `explorationCameraShake.ts`.
 */
const lastSuccessMap = new Map<string, number>();
const SUCCESS_DEBOUNCE_MS = 250;
let lastFailTs = 0;
const FAIL_COOLDOWN_MS = 400;

export function InteractionFeedbackListener() {
  useEffect(() => {
    return eventBus.on('ui:interaction_feedback', ({ kind, timestamp, actionId }) => {
      if (kind === 'success') {
        const key = actionId ?? 'default';
        const last = lastSuccessMap.get(key) ?? 0;
        if (timestamp - last < SUCCESS_DEBOUNCE_MS) return;
        lastSuccessMap.set(key, timestamp);

        audioEngine.playSfx('ui_success', 0.32);
        eventBus.emit('ui:effect_notif', {
          text: 'OK',
          type: 'system',
          durationMs: 600,
          priority: 'low',
        });
      } else {
        if (timestamp - lastFailTs < FAIL_COOLDOWN_MS) return;
        lastFailTs = timestamp;

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
