import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  filterClipTracksToExistingNodes,
  remapClipTracksToSkeleton,
  stripRootTranslationTracks,
} from './filterClipTracks';
import {
  normalizeBoneAliasKey,
  resolveDestinationBoneName,
} from './mixamoQuaterniusBoneMap';

function bone(name: string): THREE.Bone {
  const b = new THREE.Bone();
  b.name = name;
  return b;
}

function quaterniusRoot(): THREE.Object3D {
  const root = new THREE.Object3D();
  root.name = 'Scene';
  for (const name of [
    'CharacterArmature',
    'Hips',
    'Body',
    'Wrist.L',
    'Wrist.R',
    'UpperArm.L',
    'UpperArm.R',
  ]) {
    root.add(bone(name));
  }
  return root;
}

describe('mixamoQuaterniusBoneMap', () => {
  it('normalizes Mixamo prefixes', () => {
    expect(normalizeBoneAliasKey('mixamorig:LeftArm')).toBe('leftarm');
    expect(normalizeBoneAliasKey('mixamorigHips')).toBe('hips');
    expect(normalizeBoneAliasKey('hand.l')).toBe('hand.l');
  });

  it('resolves Mixamo and KayKit aliases onto Quaternius bones', () => {
    const dest = new Set(['Hips', 'UpperArm.L', 'Wrist.L', 'CharacterArmature']);
    expect(resolveDestinationBoneName('mixamorig:LeftArm', dest)).toBe('UpperArm.L');
    expect(resolveDestinationBoneName('hand.l', dest)).toBe('Wrist.L');
    expect(resolveDestinationBoneName('Rig_Medium', dest)).toBe('CharacterArmature');
    expect(resolveDestinationBoneName('UnknownBone', dest)).toBeNull();
  });

  it('resolves Mixamo aliases onto undotted modular _rigs bones', () => {
    const dest = new Set([
      'Hips',
      'UpperArmL',
      'WristL',
      'ShoulderL',
      'FootL',
      'PTL',
      'CharacterArmature',
    ]);
    expect(resolveDestinationBoneName('mixamorig:LeftArm', dest)).toBe('UpperArmL');
    expect(resolveDestinationBoneName('mixamorig:LeftShoulder', dest)).toBe('ShoulderL');
    expect(resolveDestinationBoneName('hand.l', dest)).toBe('WristL');
    expect(resolveDestinationBoneName('LeftFoot', dest)).toBe('FootL');
    expect(resolveDestinationBoneName('LeftToeBase', dest)).toBe('PTL');
  });

  it('maps Mixamo finger chains to matching Quaternius fingers, not wrists', () => {
    const dest = new Set(['Wrist.L', 'Index1.L', 'Thumb3R']);
    expect(resolveDestinationBoneName('mixamorig:LeftHandIndex1', dest)).toBe('Index1.L');
    expect(resolveDestinationBoneName('mixamorig:RightHandThumb3', dest)).toBe('Thumb3R');
  });
});


describe('remapClipTracksToSkeleton', () => {
  it('remaps KayKit hand.l onto Wrist.L when Wrist has no conflicting track', () => {
    const root = quaterniusRoot();
    const hand = new THREE.QuaternionKeyframeTrack(
      'hand.l.quaternion',
      [0, 1],
      [0, 0, 0, 1, 0, 0, 0, 1],
    );
    const clip = new THREE.AnimationClip('sleeping', 1, [hand]);
    const remapped = remapClipTracksToSkeleton(clip, root);
    expect(remapped.tracks.map((t) => t.name)).toEqual(['Wrist.L.quaternion']);
  });

  it('does not overwrite an existing Wrist.L track', () => {
    const root = quaterniusRoot();
    const wrist = new THREE.QuaternionKeyframeTrack(
      'Wrist.L.quaternion',
      [0, 1],
      [0, 0, 0, 1, 0, 0, 0, 1],
    );
    const hand = new THREE.QuaternionKeyframeTrack(
      'hand.l.quaternion',
      [0, 1],
      [0, 0.1, 0, 0.9, 0, 0.1, 0, 0.9],
    );
    const clip = new THREE.AnimationClip('sleeping', 1, [wrist, hand]);
    const remapped = remapClipTracksToSkeleton(clip, root);
    expect(remapped.tracks.map((t) => t.name)).toEqual([
      'Wrist.L.quaternion',
      'hand.l.quaternion',
    ]);
    const filtered = filterClipTracksToExistingNodes(remapped, root);
    expect(filtered.tracks.map((t) => t.name)).toEqual(['Wrist.L.quaternion']);
  });

  it('remaps classic Mixamo LeftArm onto UpperArm.L', () => {
    const root = quaterniusRoot();
    const arm = new THREE.QuaternionKeyframeTrack(
      'mixamorig:LeftArm.quaternion',
      [0, 1],
      [0, 0, 0, 1, 0, 0, 0, 1],
    );
    const clip = new THREE.AnimationClip('talking', 1, [arm]);
    const remapped = remapClipTracksToSkeleton(clip, root);
    expect(remapped.tracks[0]?.name).toBe('UpperArm.L.quaternion');
  });
});

describe('stripRootTranslationTracks', () => {
  it('removes horizontal Hips motion while preserving vertical pose motion', () => {
    const pos = new THREE.VectorKeyframeTrack('Hips.position', [0, 1], [0, 1, 0, 0.1, 0.8, 0.2]);
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
      'Hips.position',
      'Hips.quaternion',
      'LeftArm.quaternion',
    ]);
    // FIX S13-15: use toBeCloseTo per-element — GLB float32 buffer gives
    // 0.800000011920929 instead of exact 0.8. Strict toEqual fails on float32 precision.
    const vals = Array.from(stripped.tracks[0]?.values ?? []);
    expect(vals.length).toBe(6);
    expect(vals[0]).toBeCloseTo(0, 5);
    expect(vals[1]).toBeCloseTo(1, 5);
    expect(vals[2]).toBeCloseTo(0, 5);
    expect(vals[3]).toBeCloseTo(0, 5);
    expect(vals[4]).toBeCloseTo(0.8, 5);
    expect(vals[5]).toBeCloseTo(0, 5);
  });

  it('makes Quaternius Body.position root translation in-place', () => {
    const pos = new THREE.VectorKeyframeTrack('Body.position', [0, 1], [0, 0, 0, 0.2, 0, 0]);
    const quat = new THREE.QuaternionKeyframeTrack(
      'Body.quaternion',
      [0, 1],
      [0, 0, 0, 1, 0, 0, 0, 1],
    );
    const clip = new THREE.AnimationClip('idle', 1, [pos, quat]);
    const stripped = stripRootTranslationTracks(clip);
    expect(stripped.tracks.map((t) => t.name)).toEqual([
      'Body.position',
      'Body.quaternion',
    ]);
    expect(Array.from(stripped.tracks[0]?.values ?? [])).toEqual([0, 0, 0, 0, 0, 0]);
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
