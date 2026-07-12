import { describe, expect, it } from 'vitest';
import { CUTSCENES } from '@/data/cutscenes';
import { resolveCutsceneWaypoints } from '@/engine/camera/resolveCutsceneWaypoints';

describe('resolveCutsceneWaypoints', () => {
  it('returns world waypoints unchanged for legacy cutscenes', () => {
    const legacy = Object.values(CUTSCENES).find((c) => c.waypointSpace !== 'spawn_offset');
    expect(legacy).toBeDefined();
    if (!legacy) return;
    expect(resolveCutsceneWaypoints(legacy, 'volodka_room')).toEqual(legacy.waypoints);
  });

  it('offsets spawn-relative waypoints by scene default spawn', () => {
    const anchored = CUTSCENES.act1_prologue;
    expect(anchored.waypointSpace).toBe('spawn_offset');
    const resolved = resolveCutsceneWaypoints(anchored, 'volodka_room');
    expect(resolved[0]?.position[2]).toBeCloseTo(-2.2, 3);
    expect(resolved[0]?.position[1]).toBeCloseTo(1.2, 3);
  });

  it('uses anchorSceneId when playback scene differs', () => {
    const corridor = CUTSCENES.act1_corridor_solnysh;
    const resolved = resolveCutsceneWaypoints(corridor, 'volodka_room');
    expect(resolved[0]?.position[2]).toBeCloseTo(4.5, 3);
  });
});
