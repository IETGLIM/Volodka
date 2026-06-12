import { describe, it, expect } from 'vitest';
import { SCENE_DEFINITIONS } from './sceneDefinitions';
import {
  generateBoundaryWallSegments,
  generateColliders,
} from './sceneDefinitionGenerator';
import type { ColliderDef } from '@/shared/types/sceneDefinition';

function segmentsOnSide(
  segments: ColliderDef[],
  side: 'left' | 'right' | 'back' | 'front',
): ColliderDef[] {
  return segments.filter((s) => s.name?.includes(`wall_${side}`));
}

function backstopsOnSide(
  segments: ColliderDef[],
  side: 'left' | 'right' | 'back' | 'front',
): ColliderDef[] {
  return segments.filter((s) => s.name?.includes(`backstop_${side}`));
}

describe('generateBoundaryWallSegments', () => {
  it('keeps four solid walls when no doorway sits on the boundary (street_night)', () => {
    const segments = generateBoundaryWallSegments(SCENE_DEFINITIONS.street_night);
    // Street doorways are interior building entrances — boundary stays closed.
    expect(segments).toHaveLength(4);
    expect(segments.filter((s) => s.name?.includes('backstop'))).toHaveLength(0);
  });

  it('cuts an opening with a backstop for the room→corridor doorway (volodka_room)', () => {
    const def = SCENE_DEFINITIONS.volodka_room; // door at [0, 1, 3.5] on front plane z=3.5
    const segments = generateBoundaryWallSegments(def);

    const front = segmentsOnSide(segments, 'front');
    expect(front).toHaveLength(2); // wall split around the opening

    const backstops = backstopsOnSide(segments, 'front');
    expect(backstops).toHaveLength(1);
    // Backstop sits behind the boundary plane (alcove), not on it
    expect(backstops[0].position[2]).toBeGreaterThan(3.5);

    // The opening itself is clear: no front-wall segment overlaps door span x ∈ [-0.5, 0.5]
    for (const seg of front) {
      const [halfX] = seg.size;
      const x = seg.position[0];
      const overlaps = x - halfX < 0.5 && x + halfX > -0.5;
      expect(overlaps).toBe(false);
    }
  });

  it('cuts side openings for corridor kitchen/street doors (volodka_corridor)', () => {
    const segments = generateBoundaryWallSegments(SCENE_DEFINITIONS.volodka_corridor);
    // Doors at x=±2.7 with halfW=3 sit on the left/right planes
    expect(segmentsOnSide(segments, 'left').length).toBeGreaterThanOrEqual(2);
    expect(segmentsOnSide(segments, 'right').length).toBeGreaterThanOrEqual(2);
    expect(backstopsOnSide(segments, 'left')).toHaveLength(1);
    expect(backstopsOnSide(segments, 'right')).toHaveLength(2);
  });

  it('covers the full span with segments + opening per side', () => {
    for (const def of Object.values(SCENE_DEFINITIONS)) {
      const segments = generateBoundaryWallSegments(def);
      expect(segments.length).toBeGreaterThanOrEqual(4);
      for (const seg of segments) {
        // All segments stand on the floor and have positive extents
        expect(seg.size.every((v) => v > 0)).toBe(true);
      }
    }
  });
});

describe('generateColliders perimeter dedup', () => {
  it('drops definition walls lying on the boundary (volodka_room)', () => {
    const def = SCENE_DEFINITIONS.volodka_room;
    const { walls } = generateColliders(def);
    // All four definition walls of the room sit exactly on the perimeter
    expect(walls).toHaveLength(0);
  });

  it('keeps interior obstacles untouched', () => {
    const def = SCENE_DEFINITIONS.volodka_room;
    const { obstacles } = generateColliders(def);
    expect(obstacles).toHaveLength(def.obstacles.length);
  });
});
