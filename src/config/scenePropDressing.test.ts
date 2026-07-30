import { describe, expect, it } from 'vitest';
import { GltfPreloadPriority } from '@/engine/assets/gltfPreloadScheduler';
import {
  getScenePropDressing,
  resolvePropDressingPreloadPriority,
  splitScenePropDressing,
} from './scenePropDressing';

describe('scenePropDressing', () => {
  it('keeps volodka_room apartment openings and clutter deferred', () => {
    const { critical, deferred } = splitScenePropDressing('volodka_room');

    expect(critical.map((p) => p.propModelId)).toEqual([]);
    expect(deferred.map((p) => p.propModelId)).toEqual([
      'kenney_door',
      'kenney_window',
      'kenney_window',
      'polyhaven_industrial_lamp',
      'polyhaven_barrel',
      'polyhaven_cardboard_box',
      'polyhaven_cardboard_box',
      'polyhaven_metal_trash_can',
      'polyhaven_trashbag',
      'ai3dgen_poetic_compiler',
      'ai3dgen_neural_filter',
      'ai3dgen_digital_amulet',
    ]);
  });

  it('treats unspecified loadTier as critical', () => {
    const { critical, deferred } = splitScenePropDressing('volodka_corridor');
    expect(critical.map((p) => p.propModelId)).toEqual(['kenney_door']);
    expect(deferred.map((p) => p.propModelId)).toEqual([
      'polyhaven_shutter_door',
      'polyhaven_cardboard_box',
      'polyhaven_trashbag',
    ]);
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

  it('uses apartment-scale chairs for cafe and office seating', () => {
    expect(getScenePropDressing('office_day').map((p) => p.propModelId)).toContain('kenney_city_chair');

    const cafeChairPlacements = getScenePropDressing('cafe_evening')
      .filter((p) => p.propModelId === 'kenney_city_chair');
    expect(cafeChairPlacements).toHaveLength(3);
  });

  it('densifies hero hub scenes with Poly Haven props in Stage 5', () => {
    expect(getScenePropDressing('river_pier').map((p) => p.propModelId)).toContain('polyhaven_bench');
    expect(getScenePropDressing('library_day').map((p) => p.propModelId)).toContain('polyhaven_gothic_statue');
    expect(getScenePropDressing('abandoned_factory').map((p) => p.propModelId)).toContain('polyhaven_industrial_lamp');
    expect(getScenePropDressing('chk_forest_zorge').map((p) => p.propModelId)).toContain('polyhaven_wooden_crate');
  });
});
