// ============================================
// AUTO-SAVE HOOK
// ============================================
// Периодический тик + события (смена сцены / выбор). Клиентский throttle: debounce на шине,
// затем `minDelayMs` между реальными вызовами `saveGame` (снижает частоту записи и будущих POST к `/api/save`).

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/state';
import { useAppStore } from '@/state/appStore';
import { eventBus } from '@/engine/EventBus';

interface AutoSaveOptions {
  /** Интервал таймера «попробовать сохранить» в мс (по умолчанию 120_000) */
  intervalMs?: number;
  /** Сохранять ли при смене сцены */
  saveOnSceneChange?: boolean;
  /** Сохранять ли при каждом выборе */
  saveOnChoice?: boolean;
  /** Минимум между успешными `saveGame` (мс), по умолчанию 30_000 */
  minDelayMs?: number;
  /** После всплеска событий ждать тишину (мс) перед попыткой сохранения; по умолчанию 5_000 */
  debounceMs?: number;
}

export function useAutoSave(options: AutoSaveOptions = {}) {
  const {
    intervalMs = 120_000,
    saveOnSceneChange = true,
    saveOnChoice = false,
    minDelayMs = 30_000,
    debounceMs = 5_000,
  } = options;

  const saveGame = useGameStore(s => s.saveGame);
  const phase = useAppStore((s) => s.phase);
  const lastSaveRef = useRef<number>(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDebounce = useCallback(() => {
    if (debounceRef.current != null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const doSave = useCallback(() => {
    const now = Date.now();
    if (now - lastSaveRef.current < minDelayMs) return;
    lastSaveRef.current = now;
    saveGame({ source: 'auto' });
  }, [saveGame, minDelayMs]);

  const scheduleDebouncedSave = useCallback(() => {
    clearDebounce();
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      doSave();
    }, debounceMs);
  }, [clearDebounce, debounceMs, doSave]);

  // Периодическое авто-сохранение (без debounce: тик сам реже событий)
  useEffect(() => {
    if (phase !== 'game') {
      clearDebounce();
      return;
    }

    const interval = setInterval(doSave, intervalMs);
    return () => {
      clearInterval(interval);
      clearDebounce();
    };
  }, [phase, intervalMs, doSave, clearDebounce]);

  // Сохранение при смене сцены
  useEffect(() => {
    if (!saveOnSceneChange) return;

    const unsub = eventBus.on('scene:enter', scheduleDebouncedSave);

    return () => {
      unsub();
      clearDebounce();
    };
  }, [saveOnSceneChange, scheduleDebouncedSave, clearDebounce]);

  // Сохранение при выборе
  useEffect(() => {
    if (!saveOnChoice) return;

    const unsub = eventBus.on('choice:made', scheduleDebouncedSave);

    return () => {
      unsub();
      clearDebounce();
    };
  }, [saveOnChoice, scheduleDebouncedSave, clearDebounce]);

  return { saveNow: doSave };
}
