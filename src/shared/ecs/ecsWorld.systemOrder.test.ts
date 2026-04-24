import { describe, expect, it } from 'vitest';
import type { ISystem, SystemContext } from './index';
import { ECSWorld } from './index';

describe('ECSWorld system order', () => {
  it('при равном priority сортирует по name (детерминизм)', () => {
    const w = new ECSWorld();
    const noop = (_ctx: SystemContext) => {};
    const z: ISystem = { name: 'zeta', priority: 10, update: noop };
    const a: ISystem = { name: 'alpha', priority: 10, update: noop };
    const m: ISystem = { name: 'mu', priority: 5, update: noop };
    w.registerSystem(z);
    w.registerSystem(a);
    w.registerSystem(m);
    expect(w.getSystemNamesInOrder()).toEqual(['mu', 'alpha', 'zeta']);
  });
});
