import { SIM_ARCHETYPE_MV_HEALTH } from './archetypeKeys';
import type { ISimSystem } from './ISimSystem';
import { simDeltaSeconds, type SimContext } from './SimContext';

/**
 * Пакетный интегратор позиции из горизонтальной скорости (метры/сек).
 * Порядок относительно `HealthSimSystem` задаётся полем `order`.
 */
export class MovementSimSystem implements ISimSystem {
  readonly name = 'movement_sim';
  readonly order = 100;

  fixedUpdate(ctx: SimContext): void {
    const t = ctx.registry.getTable(SIM_ARCHETYPE_MV_HEALTH);
    if (!t || t.count === 0) return;
    const dt = simDeltaSeconds(ctx);
    const n = t.count;
    for (let i = 0; i < n; i++) {
      t.posX[i] += t.velX[i] * dt;
      t.posZ[i] += t.velZ[i] * dt;
    }
  }
}
