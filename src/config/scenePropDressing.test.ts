import { describe, expect, it } from 'vitest';
import { GltfPreloadPriority } from '@/engine/assets/gltfPreloadScheduler';
import {
  resolvePropDressingPreloadPriority,
  splitScenePropDressing,
} from './scenePropDressing';

describe('scenePropDressing', () => {
  it('splits volodka_room into critical essentials and deferred dressing', () => {
    const { critical, deferred } = splitScenePropDressing('volodka_room');

    expect(critical.map((p) => p.propModelId)).toEqual([
      'kenney_desk',
      'kenney_bed',
      'kenney_terminal',
      'kenney_door_open',
    ]);
    expect(deferred.map((p) => p.propModelId)).toEqual([
      'kenney_wardrobe',
      'kenney_bookshelf',
      'kenney_window',
      'ai3dgen_poetic_compiler',
      'ai3dgen_neural_filter',
      'ai3dgen_digital_amulet',
    ]);
  });

  it('treats unspecified loadTier as critical', () => {
    const { critical, deferred } = splitScenePropDressing('volodka_corridor');
    expect(critical).toHaveLength(1);
    expect(deferred).toHaveLength(0);
  });

  it('maps load tiers to preload priorities', () => {
    expect(
      resolvePropDressingPreloadPriority({
        propModelId: 'kenney_desk',
        position: [0, 0, 0],
        loadTier: 'critical',
      }),
    ).toBe(GltfPreloadPriority.High);

    expect(
      resolvePropDressingPreloadPriority({
        propModelId: 'kenney_window',
        position: [0, 0, 0],
        loadTier: 'deferred',
      }),
    ).toBe(GltfPreloadPriority.Deferred);
  });
});
