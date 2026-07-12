import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  applyQuaterniusRigToComposer,
  QUATERNIUS_PROCEDURAL_BINDINGS,
} from '@/engine/npc/quaterniusRigRetarget';

function buildMockRig(): THREE.Group {
  const root = new THREE.Group();
  const head = new THREE.Bone();
  head.name = 'Head';
  head.rotation.y = 0.5;
  const chest = new THREE.Bone();
  chest.name = 'Chest';
  chest.position.y = 0.2;
  root.add(chest);
  root.add(head);
  return root;
}

function buildMockComposer(): THREE.Group {
  const root = new THREE.Group();
  for (const binding of QUATERNIUS_PROCEDURAL_BINDINGS) {
    const part = new THREE.Group();
    part.name = binding.partName;
    root.add(part);
  }
  return root;
}

describe('quaterniusRigRetarget', () => {
  it('maps Quaternius bones onto procedural composer groups', () => {
    const rig = buildMockRig();
    const composer = buildMockComposer();

    const applied = applyQuaterniusRigToComposer('test', rig, composer, 1.05);
    expect(applied).toBe(true);

    const head = composer.getObjectByName('head') as THREE.Group;
    expect(Math.abs(head.rotation.y - 0.5)).toBeLessThan(0.01);

    const torso = composer.getObjectByName('torso') as THREE.Group;
    expect(torso.position.y).toBeGreaterThan(1.05);
  });
});
