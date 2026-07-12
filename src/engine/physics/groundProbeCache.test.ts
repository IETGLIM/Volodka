import { describe, expect, it, vi } from 'vitest';
import {
  createGroundProbeCache,
  invalidateGroundProbeCache,
  resolveCachedGroundY,
  shouldRefreshGroundProbe,
  GROUND_PROBE_HORIZ_THRESHOLD,
  GROUND_PROBE_REFRESH_INTERVAL_S,
} from '@/engine/physics/groundProbeCache';
import * as groundProbe from '@/engine/physics/groundProbe';

describe('groundProbeCache', () => {
  const world = {} as groundProbe.GroundProbeWorld;
  const rapier = {} as groundProbe.GroundProbeRapier;

  it('probes on first resolve and caches the result', () => {
    const probeSpy = vi.spyOn(groundProbe, 'probeGroundY').mockReturnValue(1.25);
    const cache = createGroundProbeCache(0, 'home_evening');

    const groundY = resolveCachedGroundY(world, rapier, cache, {
      sceneId: 'home_evening',
      x: 2,
      feetY: 1.5,
      z: 3,
      fallbackFloorY: 0,
      dt: 0.016,
      airborne: false,
    });

    expect(groundY).toBe(1.25);
    expect(probeSpy).toHaveBeenCalledTimes(1);
    expect(cache.probeX).toBe(2);
    expect(cache.probeZ).toBe(3);

    const cached = resolveCachedGroundY(world, rapier, cache, {
      sceneId: 'home_evening',
      x: 2,
      feetY: 1.5,
      z: 3,
      fallbackFloorY: 0,
      dt: 0.016,
      airborne: false,
    });

    expect(cached).toBe(1.25);
    expect(probeSpy).toHaveBeenCalledTimes(1);
    probeSpy.mockRestore();
  });

  it('re-probes when scene, horizontal move, airborne, interval, or teleport invalidates', () => {
    const cache = createGroundProbeCache(0, 'home_evening');
    cache.forceRefresh = false;
    cache.probeX = 0;
    cache.probeZ = 0;
    cache.timeSinceProbe = 0;

    expect(shouldRefreshGroundProbe(cache, 'other_scene', 0, 0, false)).toBe(true);
    expect(shouldRefreshGroundProbe(cache, 'home_evening', 0, 0, true)).toBe(true);
    expect(
      shouldRefreshGroundProbe(
        cache,
        'home_evening',
        GROUND_PROBE_HORIZ_THRESHOLD + 0.1,
        0,
        false,
      ),
    ).toBe(true);

    cache.timeSinceProbe = GROUND_PROBE_REFRESH_INTERVAL_S;
    expect(shouldRefreshGroundProbe(cache, 'home_evening', 0, 0, false)).toBe(true);

    invalidateGroundProbeCache(cache);
    expect(shouldRefreshGroundProbe(cache, 'home_evening', 0, 0, false)).toBe(true);
  });
});
