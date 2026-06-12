/* ─── Push overlapping NPCs apart on the same scene frame ─── */

export interface NpcPlacement {
  position: [number, number, number];
}

export interface SeparateNpcBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const DEFAULT_STREET_BOUNDS: SeparateNpcBounds = {
  minX: -2.8,
  maxX: 2.8,
  minZ: -9.5,
  maxZ: 9.5,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Separate NPCs that share nearly the same schedule point (sidewalk crowding). */
export function separateNpcPositions<T extends NpcPlacement>(
  npcs: T[],
  minDistance = 1.25,
  bounds: SeparateNpcBounds = DEFAULT_STREET_BOUNDS,
): T[] {
  if (npcs.length < 2) return npcs;

  const out = npcs.map((npc) => ({
    ...npc,
    position: [...npc.position] as [number, number, number],
  }));

  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i].position;
        const b = out[j].position;
        const dx = b[0] - a[0];
        const dz = b[2] - a[2];
        const dist = Math.hypot(dx, dz);
        if (dist >= minDistance) continue;

        const push = dist > 0.001 ? (minDistance - dist) / 2 : minDistance / 2;
        const nx = dist > 0.001 ? dx / dist : 1;
        const nz = dist > 0.001 ? dz / dist : 0;

        a[0] -= nx * push;
        a[2] -= nz * push;
        b[0] += nx * push;
        b[2] += nz * push;

        a[0] = clamp(a[0], bounds.minX, bounds.maxX);
        a[2] = clamp(a[2], bounds.minZ, bounds.maxZ);
        b[0] = clamp(b[0], bounds.minX, bounds.maxX);
        b[2] = clamp(b[2], bounds.minZ, bounds.maxZ);
      }
    }
  }

  return out;
}
