/**
 * Unique street building geometries — one intentional composition per archetype.
 * Merged BufferGeometry per building ID so the plaza silhouette is not “same GLB × N”.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export type StreetBuildingArchetype =
  | 'narrow_tower'
  | 'bay_midrise'
  | 'terrace_setback'
  | 'warehouse_low'
  | 'arcade_wing'
  | 'corner_chamfer'
  | 'water_tower'
  | 'ruin_gap';

export interface UniqueBuildingSpec {
  id: string;
  archetype: StreetBuildingArchetype;
  position: [number, number, number];
  rotationY: number;
  neon: string;
  /** Uniform scale for the whole composition. */
  scale?: number;
}

function boxAt(
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

function cylAt(
  rTop: number,
  rBot: number,
  h: number,
  x: number,
  y: number,
  z: number,
  radial = 8,
): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, radial);
  g.translate(x, y, z);
  return g;
}

function buildArchetype(arch: StreetBuildingArchetype): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  switch (arch) {
    case 'narrow_tower': {
      // Tall thin shaft + pitched roof slabs + balcony slabs
      parts.push(boxAt(5.2, 22, 5.2, 0, 11, 0));
      parts.push(boxAt(5.8, 1.8, 5.8, 0, 0.9, 0)); // plinth
      parts.push(boxAt(6.0, 0.45, 6.0, 0, 22.4, 0)); // cornice
      parts.push(boxAt(4.2, 1.6, 0.35, 0, 14, 2.75)); // balcony
      parts.push(boxAt(4.2, 1.6, 0.35, 0, 18.2, 2.75));
      // Pitched roof (two slanted boxes approximated as stacked wedges via thin slabs)
      parts.push(boxAt(5.6, 0.35, 3.2, 0, 23.1, -0.9));
      parts.push(boxAt(5.6, 0.35, 3.2, 0, 23.1, 0.9));
      parts.push(boxAt(5.4, 0.9, 1.4, 0, 23.7, 0));
      break;
    }
    case 'bay_midrise': {
      // Wider body + protruding bay windows at mid floors
      parts.push(boxAt(9.5, 16, 6.2, 0, 9.2, 0));
      parts.push(boxAt(10.2, 2.4, 6.6, 0, 1.2, 0));
      parts.push(boxAt(3.4, 5.5, 2.2, -2.4, 8.5, 3.6)); // left bay
      parts.push(boxAt(3.4, 5.5, 2.2, 2.4, 12.5, 3.6)); // right bay offset floors
      parts.push(boxAt(10.6, 0.5, 6.9, 0, 17.5, 0));
      parts.push(boxAt(2.2, 2.8, 2.2, 0, 19.2, 0)); // rooftop penthouse
      break;
    }
    case 'terrace_setback': {
      // Stepped massing — each floor setback reads unique
      parts.push(boxAt(11, 4.5, 7.5, 0, 2.25, 0));
      parts.push(boxAt(9.5, 4.2, 6.5, 0, 6.6, -0.3));
      parts.push(boxAt(8, 4.0, 5.5, 0, 10.7, -0.7));
      parts.push(boxAt(6.2, 3.6, 4.5, 0, 14.5, -1.1));
      parts.push(boxAt(4.5, 2.8, 3.5, 0, 17.7, -1.4));
      parts.push(boxAt(12, 0.35, 8, 0, 0.18, 0)); // sidewalk lip
      break;
    }
    case 'warehouse_low': {
      // Low industrial shed + loading dock wing
      parts.push(boxAt(14, 7.5, 8, 0, 3.75, 0));
      parts.push(boxAt(5, 5.2, 6, 6.5, 2.6, 2));
      parts.push(boxAt(14.5, 0.55, 8.5, 0, 7.9, 0));
      parts.push(boxAt(3.5, 1.2, 0.4, -4, 4.2, 4.15)); // loading door frame
      parts.push(cylAt(0.35, 0.35, 9, -6.5, 4.5, -3.2, 6)); // chimney
      parts.push(cylAt(0.55, 0.45, 1.2, -6.5, 9.3, -3.2, 6));
      break;
    }
    case 'arcade_wing': {
      // Ground arcade mass + asymmetric tower wing
      parts.push(boxAt(12, 3.2, 7, 0, 1.6, 0));
      parts.push(boxAt(10.5, 10, 6, -0.4, 8.2, -0.3));
      parts.push(boxAt(4.5, 16, 4.5, 4.2, 11, 0.5)); // tower wing
      parts.push(boxAt(5.2, 0.4, 5.2, 4.2, 19.2, 0.5));
      // Arcade pier columns
      for (const x of [-4.5, -1.5, 1.5, 4.5]) {
        parts.push(boxAt(0.45, 3.0, 0.55, x, 1.5, 3.4));
      }
      break;
    }
    case 'corner_chamfer': {
      // L-shaped corner + chamfer mass
      parts.push(boxAt(8, 14, 5.5, -2, 7, 0));
      parts.push(boxAt(5.5, 14, 9, 3, 7, -2));
      parts.push(boxAt(4.2, 14, 4.2, 1.5, 7, 1.5)); // chamfer fill
      parts.push(boxAt(10, 2.2, 10, 0.5, 1.1, -0.5));
      parts.push(boxAt(9.5, 0.45, 9.5, 0.5, 14.4, -0.5));
      break;
    }
    case 'water_tower': {
      // Midrise + rooftop water tower cylinder
      parts.push(boxAt(8.5, 15, 7, 0, 8.5, 0));
      parts.push(boxAt(9.2, 2.2, 7.6, 0, 1.1, 0));
      parts.push(boxAt(9.0, 0.5, 7.4, 0, 16.2, 0));
      parts.push(cylAt(1.6, 1.6, 3.2, -1.5, 18.5, -1, 10));
      parts.push(cylAt(0.25, 0.25, 4.5, -1.5, 16.5, -1, 6));
      parts.push(boxAt(3.5, 1.4, 3.5, 2.2, 17.2, 1.5)); // roof hut
      break;
    }
    case 'ruin_gap': {
      // Broken silhouette — missing upper corner, exposed floors
      parts.push(boxAt(9, 11, 6, 0, 5.5, 0));
      parts.push(boxAt(9.5, 2.4, 6.4, 0, 1.2, 0));
      parts.push(boxAt(4.5, 6, 5.5, -2.2, 14, -0.2)); // partial upper
      parts.push(boxAt(2.8, 0.35, 5.2, 2.5, 11.2, 0)); // exposed floor plate
      parts.push(boxAt(2.8, 0.35, 5.2, 2.5, 13.5, 0));
      parts.push(boxAt(0.35, 8, 0.35, 4.2, 9, 2.8)); // rebar pier
      parts.push(boxAt(0.35, 6.5, 0.35, 4.2, 9.5, -2.5));
      break;
    }
    default: {
      parts.push(boxAt(8, 14, 6, 0, 7, 0));
    }
  }

  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  if (!merged) {
    return new THREE.BoxGeometry(8, 14, 6).translate(0, 7, 0);
  }
  merged.computeVertexNormals();
  return merged;
}

const geometryCache = new Map<StreetBuildingArchetype, THREE.BufferGeometry>();

export function getUniqueBuildingGeometry(arch: StreetBuildingArchetype): THREE.BufferGeometry {
  let g = geometryCache.get(arch);
  if (!g) {
    g = buildArchetype(arch);
    geometryCache.set(arch, g);
  }
  return g;
}

/** Directed plaza block — each slot a distinct archetype (no visual module repetition). */
export const STREET_NIGHT_UNIQUE_BLOCK: UniqueBuildingSpec[] = [
  { id: 'left_tower', archetype: 'narrow_tower', position: [-12.5, 0, -16], rotationY: 0.06, neon: '#ff2a7a', scale: 1.05 },
  { id: 'left_bay', archetype: 'bay_midrise', position: [-13.2, 0, -5.5], rotationY: 0.1, neon: '#aa44ff', scale: 0.95 },
  { id: 'left_arcade', archetype: 'arcade_wing', position: [-12.0, 0, 6.5], rotationY: Math.PI / 2 + 0.04, neon: '#22e0ff', scale: 0.9 },
  { id: 'right_terrace', archetype: 'terrace_setback', position: [13.0, 0, -19], rotationY: Math.PI - 0.05, neon: '#33ffcc', scale: 1.0 },
  { id: 'right_warehouse', archetype: 'warehouse_low', position: [14.5, 0, -7], rotationY: Math.PI + 0.08, neon: '#4488ff', scale: 0.92 },
  { id: 'right_corner', archetype: 'corner_chamfer', position: [12.5, 0, 5], rotationY: -Math.PI / 2 - 0.06, neon: '#ffaa22', scale: 0.88 },
  { id: 'rear_watertower', archetype: 'water_tower', position: [0.8, 0, -26.5], rotationY: 0.03, neon: '#ff4488', scale: 1.15 },
  { id: 'alley_ruin', archetype: 'ruin_gap', position: [-10.2, 0, 14.5], rotationY: Math.PI / 2, neon: '#66aaff', scale: 0.85 },
];
