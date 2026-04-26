// ============================================
// AUTO-SAVE HOOK
// ============================================
// Автоматически сохраняет игру каждые N секунд
// и при критических событиях (смена сцены, выбор).

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/state/gameStore';
import { useAppStore } from '@/state/appStore';
import { eventBus } from '@/engine/EventBus';

interface AutoSaveOptions {
  /** Интервал авто-сохранения в мс (по умолчанию 120000 = 2 мин) */
  intervalMs?: number;
  /** Сохранять ли при смене сцены */
  saveOnSceneChange?: boolean;
  /** Сохранять ли при каждом выборе */
  saveOnChoice?: boolean;
  /** Минимальная задержка между сохранениями (для предотвращения частых записей) */
  minDelayMs?: number;
}

export function useAutoSave(options: AutoSaveOptions = {}) {
  const {
    intervalMs = 120_000,
    saveOnSceneChange = true,
    saveOnChoice = false,
    minDelayMs = 30_000,
  } = options;

  const saveGame = useGameStore(s => s.saveGame);
  const phase = useAppStore((s) => s.phase);
  const lastSaveRef = useRef<number>(0);

  const doSave = useCallback(() => {
    const now = Date.now();
    if (now - lastSaveRef.current < minDelayMs) return;
    lastSaveRef.current = now;
    saveGame({ source: 'auto' });
  }, [saveGame, minDelayMs]);

  // Периодическое авто-сохранение
  useEffect(() => {
    if (phase !== 'game') return;

    const interval = setInterval(doSave, intervalMs);
    return () => clearInterval(interval);
  }, [phase, intervalMs, doSave]);

  // Сохранение при смене сцены
  useEffect(() => {
    if (!saveOnSceneChange) return;

    const unsub = eventBus.on('scene:enter', () => {
      doSave();
    });

    return unsub;
  }, [saveOnSceneChange, doSave]);

  // Сохранение при выборе
  useEffect(() => {
    if (!saveOnChoice) return;

    const unsub = eventBus.on('choice:made', () => {
      doSave();
    });

    return unsub;
  }, [saveOnChoice, doSave]);

  return { saveNow: doSave };
}
