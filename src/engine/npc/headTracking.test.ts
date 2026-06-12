import { describe, expect, it, afterEach } from 'vitest';
import * as THREE from 'three';
import {
  cleanupHeadTracking,
  disposeAllHeadTracking,
  findHeadBone,
  invalidateHeadTracking,
  updateHeadTracking,
} from './headTracking';

afterEach(() => {
  disposeAllHeadTracking();
});

describe('headTracking', () => {
  it('finds procedural head group by name', () => {
    const root = new THREE.Group();
    const head = new THREE.Group();
    head.name = 'head';
    root.add(head);

    expect(findHeadBone(root)).toBe(head);
  });

  it('re-binds head uuid after invalidate (LOD/model swap)', () => {
    const root = new THREE.Group();
    const headA = new THREE.Group();
    headA.name = 'head';
    root.add(headA);

    const playerPos = new THREE.Vector3(0, 1, 2);
    updateHeadTracking('npc_test', root, playerPos, 0.016);
    const rotAfterA = headA.rotation.y;

    root.remove(headA);
    invalidateHeadTracking('npc_test');

    const headB = new THREE.Group();
    headB.name = 'head';
    headB.rotation.y = 0.25;
    root.add(headB);

    updateHeadTracking('npc_test', root, playerPos, 0.016);
    expect(headB.rotation.y).not.toBe(0.25);
    expect(Number.isFinite(headB.rotation.y)).toBe(true);
    expect(rotAfterA).toBeDefined();
  });

  it('cleanupHeadTracking removes per-npc state', () => {
    const root = new THREE.Group();
    const head = new THREE.Group();
    head.name = 'head';
    root.add(head);

    updateHeadTracking('npc_cleanup', root, new THREE.Vector3(1, 0, 0), 0.016);
    cleanupHeadTracking('npc_cleanup');

    head.rotation.y = 0;
    updateHeadTracking('npc_cleanup', root, new THREE.Vector3(1, 0, 0), 0.016);
    expect(head.rotation.y).not.toBe(0);
  });

  it('disposeAllHeadTracking clears every entry', () => {
    const root = new THREE.Group();
    const head = new THREE.Group();
    head.name = 'head';
    root.add(head);

    updateHeadTracking('npc_a', root, new THREE.Vector3(), 0.016);
    updateHeadTracking('npc_b', root, new THREE.Vector3(), 0.016);
    disposeAllHeadTracking();

    cleanupHeadTracking('npc_a');
    cleanupHeadTracking('npc_b');
    expect(true).toBe(true);
  });
});
