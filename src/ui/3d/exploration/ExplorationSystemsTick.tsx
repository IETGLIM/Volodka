'use client';

import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { SystemsRunner } from '@/ecs/systems/SystemsRunner';
import { HealthSimSystem, MovementSimSystem, SimPipeline } from '@/ecs/sim';
import { world } from '@/shared/ecs';

/**
 * Один кадр ECS поверх глобального `world` + пакетный SoA-контур `SimPipeline` (толпы/бой вне React).
 * `delta` — секунды (R3F); внутри `SystemsRunner` конвертируется в мс для `ECSWorld` и сим-пайплайна.
 */
export const ExplorationSystemsTick = memo(function ExplorationSystemsTick() {
  const runnerRef = useRef<SystemsRunner | null>(null);
  if (runnerRef.current === null) {
    const sim = new SimPipeline();
    sim.register(new MovementSimSystem());
    sim.register(new HealthSimSystem());
    runnerRef.current = new SystemsRunner(world, sim);
  }

  useFrame((_, delta) => {
    runnerRef.current!.update(delta);
  });

  return null;
});
