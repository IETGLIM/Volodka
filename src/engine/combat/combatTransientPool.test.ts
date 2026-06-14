import { describe, expect, it, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  acquireCombatHitSpark,
  disposeCombatTransientPools,
  releaseCombatHitSpark,
} from './combatTransientPool';
import { disposeAllModuleGeometries } from '@/engine/three/moduleGeometryRegistry';

describe('combatTransientPool', () => {
  beforeEach(() => {
    disposeCombatTransientPools();
    disposeAllModuleGeometries();
  });

  it('disposes shared hit spark geometry via moduleGeometryRegistry', () => {
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
    disposeAllModuleGeometries();
    expect(disposed).toBe(true);
  });

  it('recreates geometry after dispose on next acquire', () => {
    const mesh1 = acquireCombatHitSpark();
    const geometry1 = mesh1.geometry;
    releaseCombatHitSpark(mesh1);
    disposeCombatTransientPools();
    disposeAllModuleGeometries();

    const mesh2 = acquireCombatHitSpark();
    expect(mesh2.geometry).not.toBe(geometry1);
    releaseCombatHitSpark(mesh2);
  });
});
