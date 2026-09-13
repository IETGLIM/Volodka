/**
 * Post-render frame budget — runs AFTER the WebGL draw via addAfterEffect.
 * Profiler bridges and canvas guards register here via usePostFrameTick().
 *
 * v4.39.0 КРИТИЧЕСКИЙ ФИКС ЧЁРНОГО ЭКРАНА: раньше фаза подписывалась через
 * useFrame(cb, 1000) — положительный priority ОТКЛЮЧАЕТ автоматический
 * gl.render в R3F (исходник: `if (!state.internal.priority && state.gl.render)`),
 * gl.render не вызывал никто → 0 drawcalls → чёрный экран (runtime-замер:
 * internal.priority=3, internal.frames=0, GPU полностью простаивал).
 * Теперь: state/delta последнего кадра захватываются в useFrame(−700)
 * (не влияет на авторендер), а пост-тики исполняются в addAfterEffect —
 * r3f вызывает их сразу ПОСЛЕ gl.render в том же rAF-тике.
 */

import { useEffect, useRef } from 'react';
import { addAfterEffect, useFrame } from '@react-three/fiber';
import { runPostFrameBudget } from '@/engine/frame/FrameBudgetRegistry';
import { isFrameSimulationActive } from '@/engine/frame/frameVisibility';
import { getLatestFrameGameSnapshot } from '@/engine/frame/frameGameSnapshot';
import type { FrameTickContext } from '@/engine/frame/types';

export function PostFrameBudgetRunner() {
  // Последний известный (state, delta) кадра — захват в отрицательном
  // приоритете (безопасно для авторендера). addAfterEffect получает только
  // timestamp, поэтому контекст кадра берём из рефа.
  const latestFrameRef = useRef<{ state: FrameTickContext['state']; delta: number } | null>(null);

  useFrame((state, delta) => {
    latestFrameRef.current = { state, delta: Math.min(delta, 0.05) };
  }, -700);

  useEffect(() => {
    const unsub = addAfterEffect(() => {
      if (!isFrameSimulationActive()) return;
      const latest = latestFrameRef.current;
      if (!latest) return;

      /* FIX (perf GC): переиспользуем game-снапшот, созданный pre_physics-фазой
       * этого же кадра (FrameBudgetRunner), — без пересоздания объекта и
       * пересчёта locomotion-lock ещё раз за кадр. */
      runPostFrameBudget({
        state: latest.state,
        delta: latest.delta,
        game: getLatestFrameGameSnapshot(),
      });
    });
    return unsub;
  }, []);

  return null;
}
