import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { stripRootTranslationTracks } from './filterClipTracks';

describe('stripRootTranslationTracks', () => {
  it('removes Hips.position while keeping Hips.quaternion', () => {
    const pos = new THREE.VectorKeyframeTrack('Hips.position', [0, 1], [0, 0, 0, 0.1, 0, 0]);
    const quat = new THREE.QuaternionKeyframeTrack(
      'Hips.quaternion',
      [0, 1],
      [0, 0, 0, 1, 0, 0, 0, 1],
    );
    const arm = new THREE.QuaternionKeyframeTrack(
      'LeftArm.quaternion',
      [0, 1],
      [0, 0, 0, 1, 0, 0, 0, 1],
    );
    const clip = new THREE.AnimationClip('walking', 1, [pos, quat, arm]);
    const stripped = stripRootTranslationTracks(clip);
    expect(stripped.tracks.map((t) => t.name)).toEqual([
      'Hips.quaternion',
      'LeftArm.quaternion',
    ]);
  });

  it('returns same clip when no root translation present', () => {
    const quat = new THREE.QuaternionKeyframeTrack(
      'Hips.quaternion',
      [0, 1],
      [0, 0, 0, 1, 0, 0, 0, 1],
    );
    const clip = new THREE.AnimationClip('idle', 1, [quat]);
    expect(stripRootTranslationTracks(clip)).toBe(clip);
  });
});
