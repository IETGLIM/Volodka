'use client';

import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { SystemsRunner } from '@/ecs/systems/SystemsRunner';
import { world } from '@/shared/ecs';

/**
 * Один кадр ECS поверх глобального `world` (пока без регистрации систем — почти no-op).
 * `delta` — секунды (R3F); внутри `SystemsRunner` конвертируется в мс для `ECSWorld`.
 */
export const ExplorationSystemsTick = memo(function ExplorationSystemsTick() {
  const runnerRef = useRef<SystemsRunner | null>(null);
  if (runnerRef.current === null) {
    runnerRef.current = new SystemsRunner(world);
  }

  useFrame((_, delta) => {
    runnerRef.current!.update(delta);
  });

  return null;
});
