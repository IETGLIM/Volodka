import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  isUnsafeIdleClipName,
  pickSafeIdleClipAction,
  pickPlayerClipAction,
  PLAYER_IDLE_CLIP_NAMES,
} from './playerClipResolution';

function mockActions(names: string[]): Record<string, THREE.AnimationAction> {
  const mixer = new THREE.AnimationMixer(new THREE.Object3D());
  const record: Record<string, THREE.AnimationAction> = {};
  for (const name of names) {
    const clip = new THREE.AnimationClip(name, 1, []);
    record[name] = mixer.clipAction(clip);
  }
  return record;
}

describe('playerClipResolution', () => {
  it('flags combat and death clip names as unsafe idle fallbacks', () => {
    expect(isUnsafeIdleClipName('Death')).toBe(true);
    expect(isUnsafeIdleClipName('Idle_Neutral')).toBe(false);
  });

  it('pickSafeIdleClipAction prefers Idle_Neutral over Death', () => {
    const actions = mockActions(['Death', 'Idle_Neutral', 'Walk']);
    expect(pickSafeIdleClipAction(actions)?.getClip().name).toBe('Idle_Neutral');
  });

  it('pickPlayerClipAction resolves Quaternius idle names', () => {
    const actions = mockActions(['Idle_Neutral', 'Walk']);
    expect(pickPlayerClipAction(actions, PLAYER_IDLE_CLIP_NAMES)?.getClip().name).toBe(
      'Idle_Neutral',
    );
  });
});
