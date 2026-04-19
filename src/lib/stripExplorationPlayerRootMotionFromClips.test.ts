import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  cloneAnimationClipsWithoutExplorationPlayerRootMotion,
  isExplorationPlayerRootMotionPositionTrack,
  stripExplorationPlayerRootMotionTranslationInPlace,
} from './stripExplorationPlayerRootMotionFromClips';

describe('stripExplorationPlayerRootMotionFromClips', () => {
  it('flags root and rootx .position tracks', () => {
    expect(
      isExplorationPlayerRootMotionPositionTrack(
        new THREE.VectorKeyframeTrack('root.position', [0, 1], [0, 0, 0, 1, 0, 0]),
      ),
    ).toBe(true);
    expect(
      isExplorationPlayerRootMotionPositionTrack(
        new THREE.VectorKeyframeTrack('rootx.position', [0, 1], [0, 0, 0, 1, 0, 0]),
      ),
    ).toBe(true);
  });

  it('flags Mixamo hips translation', () => {
    expect(
      isExplorationPlayerRootMotionPositionTrack(
        new THREE.VectorKeyframeTrack('mixamorigHips.position', [0, 1], [0, 0, 0, 1, 0, 0]),
      ),
    ).toBe(true);
  });

  it('does not flag chest helper translation', () => {
    expect(
      isExplorationPlayerRootMotionPositionTrack(
        new THREE.VectorKeyframeTrack('chestl.position', [0, 1], [0, 0, 0, 1, 0, 0]),
      ),
    ).toBe(false);
  });

  it('does not flag quaternion tracks on root', () => {
    expect(
      isExplorationPlayerRootMotionPositionTrack(
        new THREE.QuaternionKeyframeTrack('root.quaternion', [0, 1], [0, 0, 0, 1, 0, 0, 0, 1]),
      ),
    ).toBe(false);
  });

  it('stripRootMotionTranslationInPlace removes root.position only', () => {
    const clip = new THREE.AnimationClip(
      'Test',
      -1,
      [
        new THREE.VectorKeyframeTrack('root.position', [0, 1], [0, 0, 0, 1, 0, 0]),
        new THREE.QuaternionKeyframeTrack('chestl.quaternion', [0, 1], [0, 0, 0, 1, 0, 0, 0, 1]),
        new THREE.VectorKeyframeTrack('chestl.position', [0, 1], [0, 0, 0, 0.01, 0, 0]),
      ],
    );
    stripExplorationPlayerRootMotionTranslationInPlace(clip);
    expect(clip.tracks.map((t) => t.name).sort()).toEqual(['chestl.position', 'chestl.quaternion']);
  });

  it('cloneAnimationClipsWithoutExplorationPlayerRootMotion returns new clips', () => {
    const original = new THREE.AnimationClip('A', -1, [
      new THREE.VectorKeyframeTrack('root.position', [0, 1], [0, 0, 0, 1, 0, 0]),
    ]);
    const out = cloneAnimationClipsWithoutExplorationPlayerRootMotion([original]);
    expect(out).toHaveLength(1);
    expect(out[0]).not.toBe(original);
    expect(out[0].tracks).toHaveLength(0);
    expect(original.tracks).toHaveLength(1);
  });
});
