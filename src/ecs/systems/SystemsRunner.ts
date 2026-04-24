import type { ECSWorld } from '@/shared/ecs';
import type { SimPipeline } from '@/ecs/sim/SimPipeline';

/**
 * Кадровый раннер: fixed-step в **миллисекундах** (согласовано с `ECSWorld` / `ctx.deltaTime`),
 * variable `update` + `lateUpdate` получают тот же масштаб из `deltaSeconds` R3F.
 *
 * Порядок в одном кадре:
 * 1. Ноль или несколько `world.fixedUpdate(fixedStepMs)` (legacy ECS, Map-компоненты).
 * 2. После **каждого** такого же фиксированного шага — `simPipeline.fixedUpdate` (SoA / толпы / бой).
 * 3. `world.update(deltaMs)` — variable.
 * 4. `simPipeline.update(deltaMs)` — variable сим до late ECS.
 * 5. `world.lateUpdate(deltaMs)`.
 *
 * `delta` из `useFrame((_, delta) => …)` — **секунды** (three.js / R3F).
 */
export class SystemsRunner {
  private accumulatorMs = 0;
  /** 60 Гц в миллисекундах */
  private readonly fixedStepMs = 1000 / 60;

  constructor(
    private readonly world: ECSWorld,
    private readonly simPipeline?: SimPipeline,
  ) {}

  /**
   * @param deltaSeconds шаг кадра из `useFrame`, в секундах.
   */
  update(deltaSeconds: number): void {
    const deltaMs = deltaSeconds * 1000;
    this.accumulatorMs += deltaMs;

    while (this.accumulatorMs >= this.fixedStepMs) {
      this.world.fixedUpdate(this.fixedStepMs);
      this.simPipeline?.fixedUpdate(this.fixedStepMs);
      this.accumulatorMs -= this.fixedStepMs;
    }

    this.world.update(deltaMs);
    this.simPipeline?.update(deltaMs);
    this.world.lateUpdate(deltaMs);
  }
}
