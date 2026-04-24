import { SIM_ARCHETYPE_MV_HEALTH } from './archetypeKeys';
import type { ISimSystem } from './ISimSystem';
import { simDeltaSeconds, type SimContext } from './SimContext';

/**
 * Пакетная «пассивная регенерация» в пределах maxHealth. Пример для боя/толп без React.
 */
export class HealthSimSystem implements ISimSystem {
  readonly name = 'health_sim';
  readonly order = 200;

  /** HP/сек к max при неполном здоровье. */
  private readonly regenPerSecond = 2;

  fixedUpdate(ctx: SimContext): void {
    const t = ctx.registry.getTable(SIM_ARCHETYPE_MV_HEALTH);
    if (!t || t.count === 0) return;
    const dt = simDeltaSeconds(ctx);
    const n = t.count;
    for (let i = 0; i < n; i++) {
      const max = t.maxHealth[i]!;
      let h = t.health[i]!;
      if (h < max) {
        h = Math.min(max, h + this.regenPerSecond * dt);
        t.health[i] = h;
      }
    }
  }
}
