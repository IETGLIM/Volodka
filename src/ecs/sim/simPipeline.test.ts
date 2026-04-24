import { describe, expect, it } from 'vitest';
import { HealthSimSystem } from './HealthSimSystem';
import { MovementSimSystem } from './MovementSimSystem';
import { SimPipeline } from './SimPipeline';

describe('SimPipeline', () => {
  it('выполняет системы в порядке order, при равенстве — по name', () => {
    const p = new SimPipeline();
    p.register(new HealthSimSystem());
    p.register(new MovementSimSystem());
    expect(p.getSystemOrder()).toEqual(['movement_sim', 'health_sim']);
  });

  it('MovementSimSystem интегрирует позицию по dt (fixed)', () => {
    const p = new SimPipeline();
    p.register(new MovementSimSystem());
    const t = p.registry.getMovableHealthTable();
    t.addRow({ posX: 0, posY: 0, posZ: 0, velX: 3, velZ: -1, health: 10, maxHealth: 10 });
    p.fixedUpdate(1000);
    expect(t.posX[0]).toBeCloseTo(3, 5);
    expect(t.posZ[0]).toBeCloseTo(-1, 5);
  });

  it('HealthSimSystem не поднимает выше max', () => {
    const p = new SimPipeline();
    p.register(new HealthSimSystem());
    const t = p.registry.getMovableHealthTable();
    t.addRow({ health: 9, maxHealth: 10, velX: 0, velZ: 0 });
    p.fixedUpdate(10_000);
    expect(t.health[0]).toBe(10);
  });
});
