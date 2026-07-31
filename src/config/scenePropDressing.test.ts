import { describe, expect, it } from 'vitest';
import { GltfPreloadPriority } from '@/engine/assets/gltfPreloadScheduler';
import {
  getScenePropDressing,
  resolvePropDressingPreloadPriority,
  splitScenePropDressing,
} from './scenePropDressing';

describe('scenePropDressing', () => {
  it('keeps volodka_room apartment clutter deferred without kenney openings', () => {
    const { critical, deferred } = splitScenePropDressing('volodka_room');

    // Door/windows are always procedural in VolodkaRoomVisual — no GLB openings here.
    expect(critical.map((p) => p.propModelId)).toEqual([]);
    expect(deferred.map((p) => p.propModelId)).toEqual([
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
    expect(deferred.some((p) => p.propModelId === 'kenney_door')).toBe(false);
    expect(deferred.some((p) => p.propModelId === 'kenney_window')).toBe(false);
    // Desk gadgets must not sit on ThinMonitor slots (y≈0.82, z≈-2.4).
    const deskGadgets = deferred.filter(
      (p) =>
        p.propModelId === 'ai3dgen_poetic_compiler' || p.propModelId === 'ai3dgen_neural_filter',
    );
    for (const g of deskGadgets) {
      const [, y, z] = g.position;
      const onMonitorDesk = Math.abs(y - 0.82) < 0.12 && z < -2.1 && z > -2.9;
      expect(onMonitorDesk, `${g.propModelId} @ ${g.position}`).toBe(false);
    }
  });

  it('treats unspecified loadTier as critical', () => {
    const { critical, deferred } = splitScenePropDressing('volodka_corridor');
    expect(critical.map((p) => p.propModelId)).toEqual(['kenney_door']);
    expect(deferred.map((p) => p.propModelId)).toEqual([
      'kenney_door',
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

  it('office_day prop dressing does not stack table/terminal on the live desk grid', () => {
    // Kenney office shell blocked → full 12-desk procedural owns [-1.5,-1.0] etc.
    const office = getScenePropDressing('office_day');
    expect(office.some((p) => p.propModelId === 'polyhaven_painted_wooden_table')).toBe(false);
    expect(office.some((p) => p.propModelId === 'kenney_terminal')).toBe(false);
    // Meeting-room chair stays off the desk grid.
    const chair = office.find((p) => p.propModelId === 'kenney_city_chair');
    expect(chair).toBeTruthy();
    expect(chair!.position[0]).toBeGreaterThan(3);
  });

  it('densifies hero hub scenes with Poly Haven props in Stage 5', () => {
    expect(getScenePropDressing('river_pier').map((p) => p.propModelId)).toContain('polyhaven_bench');
    expect(getScenePropDressing('library_day').map((p) => p.propModelId)).toContain('polyhaven_gothic_statue');
    expect(getScenePropDressing('abandoned_factory').map((p) => p.propModelId)).toContain('polyhaven_industrial_lamp');
    // Forest keeps sparse overlay (bench) — wine crate is procedural, not prop-dressing.
    expect(getScenePropDressing('chk_forest_zorge').map((p) => p.propModelId)).toContain('polyhaven_bench');
  });

  it('cafe High coffee_machine is floor kitbash — not bar-counter espresso at (-0.5, 1.13, -3.9)', () => {
    // Shell is blocked; procedural counter espresso must stay. Prop dressing must not
    // be treated as owner of that counter slot (Tick 36 empty-prop gap).
    const coffee = getScenePropDressing('cafe_evening').find(
      (p) => p.propModelId === 'kenney_city_coffee_machine',
    );
    expect(coffee).toBeTruthy();
    expect(coffee!.position[0]).not.toBeCloseTo(-0.5, 1);
    expect(coffee!.position[2]).not.toBeCloseTo(-3.9, 1);
  });

  it('pier/forest prop seating is sparse overlay — not a full procedural seat-ring replace', () => {
    const pierBenches = getScenePropDressing('river_pier').filter(
      (p) => p.propModelId === 'polyhaven_bench',
    );
    const forestBenches = getScenePropDressing('chk_forest_zorge').filter(
      (p) => p.propModelId === 'polyhaven_bench',
    );
    // Procedural pier has 3 crate seats; forest has 5 log seats — prop dressing ≤1 each.
    expect(pierBenches.length).toBeLessThan(3);
    expect(forestBenches.length).toBeLessThan(5);
  });

  it('pier/forest prop dressing does not stack on procedural fire/wine/guitar anchors', () => {
    const pier = getScenePropDressing('river_pier');
    // Procedural barrel fire [0,0,-2] + wine crate [-0.7,0,-2.9]
    expect(pier.some((p) => p.propModelId === 'polyhaven_barrel' && p.position[0] === 0 && p.position[2] === -2)).toBe(false);
    expect(pier.some((p) => p.propModelId === 'polyhaven_wooden_crate' && p.position[0] === -0.7 && p.position[2] === -2.9)).toBe(false);
    expect(pier.some((p) => p.propModelId === 'polyhaven_painted_wooden_table')).toBe(false);

    const forest = getScenePropDressing('chk_forest_zorge');
    // Procedural wine crate [1.8,0,1.6] + guitar lean [-1.6,0,-1.2]
    expect(forest.some((p) => p.propModelId === 'polyhaven_wooden_crate' && p.position[0] === 1.8 && p.position[2] === 1.6)).toBe(false);
    expect(forest.some((p) => p.propModelId === 'polyhaven_barrel' && p.position[0] === -1.6 && p.position[2] === -1.2)).toBe(false);
  });
});
