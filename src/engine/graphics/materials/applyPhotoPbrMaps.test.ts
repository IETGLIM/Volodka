import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  applyPhotoPbrMapSetToRoot,
  classifyShellSurfaceRole,
  polyHavenIdForEnvironmentMood,
  polyHavenIdsForMood,
} from './applyPhotoPbrMaps';

function mkTex() {
  const t = new THREE.Texture();
  t.needsUpdate = true;
  return t;
}

function mkMaps() {
  return {
    map: mkTex(),
    normalMap: mkTex(),
    roughnessMap: mkTex(),
    aoMap: mkTex(),
    repeat: 2.5,
  };
}

describe('applyPhotoPbrMaps', () => {
  it('maps environment moods to shipped Poly Haven ids', () => {
    expect(polyHavenIdForEnvironmentMood('street')).toBe('asphalt_02');
    expect(polyHavenIdForEnvironmentMood('plaza')).toBe('concrete_floor_painted');
    expect(polyHavenIdForEnvironmentMood('interior')).toBe('plastered_wall');
    expect(polyHavenIdForEnvironmentMood('prop')).toBe('wood_floor');
  });

  it('splits floor/wall/ceiling material ids per mood', () => {
    const interior = polyHavenIdsForMood('interior');
    expect(interior.floor).toBe('wood_floor');
    expect(interior.wall).toBe('plastered_wall');
    expect(interior.ceiling).toBe('plastered_wall');

    const street = polyHavenIdsForMood('street');
    expect(street.floor).toBe('asphalt_02');
    expect(street.wall).toBe('concrete_floor_painted');
    expect(street.ceiling).toBe('metal_plate');
  });

  it('classifies mesh roles by name', () => {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 4));
    floor.name = 'Floor_01';
    expect(classifyShellSurfaceRole(floor)).toBe('floor');

    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 4));
    wall.name = 'Wall_Shell';
    expect(classifyShellSurfaceRole(wall)).toBe('wall');

    const ceil = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 4));
    ceil.name = 'Ceiling';
    expect(classifyShellSurfaceRole(ceil)).toBe('ceiling');
  });

  it('applies distinct photo maps by surface role', () => {
    const root = new THREE.Group();
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 0.2),
      new THREE.MeshStandardMaterial({ color: '#ffffff' }),
    );
    wall.name = 'Wall_Shell';
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.1, 4),
      new THREE.MeshStandardMaterial({ color: '#ffffff' }),
    );
    floor.name = 'Floor';
    root.add(wall, floor);

    const wallMaps = mkMaps();
    const floorMaps = mkMaps();
    applyPhotoPbrMapSetToRoot(root, {
      wall: wallMaps,
      floor: floorMaps,
      ceiling: mkMaps(),
    }, 1);

    expect((wall.material as THREE.MeshStandardMaterial).map).toBeTruthy();
    expect((floor.material as THREE.MeshStandardMaterial).map).toBeTruthy();
    expect((wall.material as THREE.MeshStandardMaterial).map).not.toBe(
      (floor.material as THREE.MeshStandardMaterial).map,
    );
  });
});
