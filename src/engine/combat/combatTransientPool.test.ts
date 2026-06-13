import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  acquireCombatHitSpark,
  disposeCombatTransientPools,
  releaseCombatHitSpark,
} from './combatTransientPool';

describe('combatTransientPool', () => {
  it('disposes shared hit spark geometry on pool teardown', () => {
    const mesh = acquireCombatHitSpark();
    const geometry = mesh.geometry;
    releaseCombatHitSpark(mesh);

    let disposed = false;
    const originalDispose = geometry.dispose.bind(geometry);
    geometry.dispose = () => {
      disposed = true;
      originalDispose();
    };

    disposeCombatTransientPools();
    expect(disposed).toBe(true);
  });

  it('recreates geometry after dispose on next acquire', () => {
    const mesh1 = acquireCombatHitSpark();
    const geometry1 = mesh1.geometry;
    releaseCombatHitSpark(mesh1);
    disposeCombatTransientPools();

    const mesh2 = acquireCombatHitSpark();
    expect(mesh2.geometry).not.toBe(geometry1);
    releaseCombatHitSpark(mesh2);
  });
});
