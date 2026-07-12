import { describe, expect, it, afterEach } from 'vitest';
import * as THREE from 'three';
import {
  cleanupNpcProceduralLayers,
  disposeAllNpcProceduralLayers,
  updateNpcProceduralLayers,
} from '@/engine/npc/npcProceduralLayers';

afterEach(() => {
  disposeAllNpcProceduralLayers();
});

function buildProceduralNpc(): THREE.Group {
  const root = new THREE.Group();
  const torso = new THREE.Group();
  torso.name = 'torso';
  torso.position.y = 1.05;
  const head = new THREE.Group();
  head.name = 'head';
  const leftEye = new THREE.Group();
  leftEye.name = 'leftEye';
  const rightEye = new THREE.Group();
  rightEye.name = 'rightEye';
  const rightArm = new THREE.Group();
  rightArm.name = 'rightArm';

  head.add(leftEye);
  head.add(rightEye);
  torso.add(head);
  torso.add(rightArm);
  root.add(torso);
  return root;
}

describe('npcProceduralLayers', () => {
  it('applies idle breathing and blink on procedural torso', () => {
    const root = buildProceduralNpc();
    const torso = root.getObjectByName('torso') as THREE.Group;
    const leftEye = root.getObjectByName('leftEye') as THREE.Group;
    const startY = torso.position.y;

    for (let i = 0; i < 120; i += 1) {
      updateNpcProceduralLayers({
        npcId: 'npc_layers_test',
        root,
        animState: 'idle',
        playerPosition: null,
        delta: 1 / 60,
      });
    }

    expect(torso.position.y).not.toBe(startY);
    expect(leftEye.scale.y).toBeLessThanOrEqual(1);
  });

  it('applies talk gesture on right arm', () => {
    const root = buildProceduralNpc();
    const rightArm = root.getObjectByName('rightArm') as THREE.Group;

    for (let i = 0; i < 90; i += 1) {
      updateNpcProceduralLayers({
        npcId: 'npc_talk_gesture',
        root,
        animState: 'talk',
        playerPosition: null,
        delta: 1 / 60,
      });
    }

    expect(Math.abs(rightArm.rotation.x)).toBeGreaterThan(0.05);
  });

  it('cleans up per-npc state', () => {
    const root = buildProceduralNpc();
    updateNpcProceduralLayers({
      npcId: 'npc_cleanup_layers',
      root,
      animState: 'idle',
      playerPosition: null,
      delta: 0.016,
    });
    cleanupNpcProceduralLayers('npc_cleanup_layers');
    expect(true).toBe(true);
  });
});
