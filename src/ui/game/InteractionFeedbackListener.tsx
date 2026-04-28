"use client";

import { useEffect } from 'react';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';

/**
 * Централизованный consumer `ui:interaction_feedback`: звук + короткий hit-toast через `ui:effect_notif`
 * (обрабатывается в `GameOrchestrator`). Тряска камеры — модуль `explorationCameraShake.ts`.
 */
const SUCCESS_DEBOUNCE_MS = 250;
const SUCCESS_TTL_MS = 2000;
const FAIL_COOLDOWN_MS = 400;
const KEY_TTL_MS = 2000;

let lastSuccessMap = new Map<string, number>();
let lastFailMap = new Map<string, number>();

function gcStaleKeys(map: Map<string, number>, now: number, ttlMs: number): void {
  for (const [k, ts] of map) {
    if (now - ts > ttlMs) {
      map.delete(k);
    }
  }
}

export function InteractionFeedbackListener() {
  useEffect(() => {
    const off = eventBus.on('ui:interaction_feedback', ({ kind, timestamp, actionId }) => {
      if (kind === 'hint_clear') return;

      if (kind === 'success') {
        const key = actionId ?? 'default';
        const last = lastSuccessMap.get(key) ?? 0;
        if (timestamp - last < SUCCESS_DEBOUNCE_MS) return;
        lastSuccessMap.set(key, timestamp);
        gcStaleKeys(lastSuccessMap, timestamp, SUCCESS_TTL_MS);

        audioEngine.playSfx('ui_success', 0.32);
        eventBus.emit('ui:effect_notif', {
          text: 'OK',
          type: 'system',
          durationMs: 600,
          priority: 'low',
        });
      } else if (kind === 'fail') {
        const key = actionId ?? 'default';
        const lastF = lastFailMap.get(key) ?? 0;
        if (timestamp - lastF < FAIL_COOLDOWN_MS) return;
        lastFailMap.set(key, timestamp);
        gcStaleKeys(lastFailMap, timestamp, KEY_TTL_MS);

        audioEngine.playSfx('ui_fail', 0.26);
        eventBus.emit('ui:effect_notif', {
          text: 'Нет доступных действий',
          type: 'system',
          durationMs: 900,
        });
      }
    });
    return () => {
      lastSuccessMap.clear();
      lastFailMap.clear();
      off();
    };
  }, []);

  return null;
}
