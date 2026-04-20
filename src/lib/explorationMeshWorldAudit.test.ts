import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  collectMeshWorldAuditRows,
  findGeometryPlacementDuplicates,
  findNamePlacementDuplicates,
} from './explorationMeshWorldAudit';

describe('explorationMeshWorldAudit', () => {
  it('findGeometryPlacementDuplicates flags same geometry at same world position', () => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    const m1 = new THREE.Mesh(g, new THREE.MeshBasicMaterial());
    const m2 = new THREE.Mesh(g, new THREE.MeshBasicMaterial());
    m1.position.set(2, 0, 0);
    m2.position.set(2, 0, 0);
    const root = new THREE.Scene();
    root.add(m1, m2);

    const rows = collectMeshWorldAuditRows(root);
    const dups = findGeometryPlacementDuplicates(rows);
    expect(dups.length).toBe(1);
    expect(dups[0].length).toBe(2);
  });

  it('findNamePlacementDuplicates flags same name at same position', () => {
    const g1 = new THREE.BoxGeometry(1, 1, 1);
    const g2 = new THREE.SphereGeometry(0.5);
    const m1 = new THREE.Mesh(g1, new THREE.MeshBasicMaterial());
    const m2 = new THREE.Mesh(g2, new THREE.MeshBasicMaterial());
    m1.name = 'Twin';
    m2.name = 'Twin';
    m1.position.set(0, 1, 0);
    m2.position.set(0, 1, 0);
    const root = new THREE.Scene();
    root.add(m1, m2);

    const rows = collectMeshWorldAuditRows(root);
    const dups = findNamePlacementDuplicates(rows);
    expect(dups.length).toBe(1);
    expect(dups[0].length).toBe(2);
  });
});
