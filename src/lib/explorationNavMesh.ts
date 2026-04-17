import * as THREE from 'three';
import { Pathfinding } from 'three-pathfinding';

const ZONE_ID = 'explore_floor';

export type NavPathPoint = { x: number; z: number };

export type FindNavPathXZ = (
  from: { x: number; z: number },
  to: { x: number; z: number },
  y: number,
) => NavPathPoint[] | null;

/**
 * Плоский navmesh по размеру пола (XZ). Отступ от краёв — чтобы не «липнуть» к невидимым стенам.
 * Используется three-pathfinding: {@link https://github.com/donmccurdy/three-pathfinding}
 */
export function createFloorNavPathfinder(
  floorWidth: number,
  floorDepth: number,
  wallInset = 1.35,
): { findPathXZ: FindNavPathXZ } | null {
  const w = Math.max(2, floorWidth - wallInset * 2);
  const d = Math.max(2, floorDepth - wallInset * 2);
  const segs = Math.min(14, Math.max(4, Math.floor(Math.min(w, d) / 2.5)));
  const geo = new THREE.PlaneGeometry(w, d, segs, segs);
  geo.rotateX(-Math.PI / 2);

  let zone: ReturnType<typeof Pathfinding.createZone>;
  try {
    zone = Pathfinding.createZone(geo, 1e-3);
  } catch {
    return null;
  }

  const pathfinding = new Pathfinding();
  pathfinding.setZoneData(ZONE_ID, zone);

  const findPathXZ: FindNavPathXZ = (from, to, y) => {
    const start = new THREE.Vector3(from.x, y, from.z);
    const end = new THREE.Vector3(to.x, y, to.z);
    const group = pathfinding.getGroup(ZONE_ID, start);
    if (typeof group !== 'number' || group < 0) return null;
    const path = pathfinding.findPath(start, end, ZONE_ID, group);
    if (!path?.length) return null;
    return path.map((p) => ({ x: p.x, z: p.z }));
  };

  return { findPathXZ };
}
