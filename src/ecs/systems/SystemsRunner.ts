import type { ECSWorld } from '@/shared/ecs';

/**
 * Кадровый раннер: fixed-step в **миллисекундах** (согласовано с `ECSWorld` / `ctx.deltaTime`),
 * variable `update` + `lateUpdate` получают тот же масштаб из `deltaSeconds` R3F.
 *
 * `delta` из `useFrame((_, delta) => …)` — **секунды** (three.js / R3F).
 */
export class SystemsRunner {
  private accumulatorMs = 0;
  /** 60 Гц в миллисекундах */
  private readonly fixedStepMs = 1000 / 60;

  constructor(private readonly world: ECSWorld) {}

  /**
   * @param deltaSeconds шаг кадра из `useFrame`, в секундах.
   */
  update(deltaSeconds: number): void {
    const deltaMs = deltaSeconds * 1000;
    this.accumulatorMs += deltaMs;

    while (this.accumulatorMs >= this.fixedStepMs) {
      this.world.fixedUpdate(this.fixedStepMs);
      this.accumulatorMs -= this.fixedStepMs;
    }

    this.world.update(deltaMs);
    this.world.lateUpdate(deltaMs);
  }
}
