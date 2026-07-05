import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import {
  disposeEffectComposer,
  disposeObject3DTree,
  disposeAnimationMixer,
} from '@/engine/three/disposeThreeResources';

describe('disposeObject3DTree', () => {
  it('disposes mesh geometry, material, and all standard texture maps', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const map = new THREE.Texture();
    const normalMap = new THREE.Texture();
    const material = new THREE.MeshStandardMaterial({ map, normalMap });
    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    group.add(mesh);

    vi.spyOn(geometry, 'dispose');
    vi.spyOn(material, 'dispose');
    vi.spyOn(map, 'dispose');
    vi.spyOn(normalMap, 'dispose');

    disposeObject3DTree(group);

    expect(geometry.dispose).toHaveBeenCalled();
    expect(material.dispose).toHaveBeenCalled();
    expect(map.dispose).toHaveBeenCalled();
    expect(normalMap.dispose).toHaveBeenCalled();
  });

  it('disposes SkinnedMesh geometry, material, and skeleton boneTexture', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: '#fff' });
    const skinned = new THREE.SkinnedMesh(geometry, material);
    const bone = new THREE.Bone();
    const boneTexture = new THREE.DataTexture(new Float32Array(16), 4, 4, THREE.RGBAFormat, THREE.FloatType);
    const skeleton = new THREE.Skeleton([bone]);
    skeleton.boneTexture = boneTexture;
    skinned.bind(skeleton, new THREE.Matrix4());
    const group = new THREE.Group();
    group.add(skinned);

    vi.spyOn(geometry, 'dispose');
    vi.spyOn(material, 'dispose');
    vi.spyOn(boneTexture, 'dispose');

    disposeObject3DTree(group);

    expect(geometry.dispose).toHaveBeenCalled();
    expect(material.dispose).toHaveBeenCalled();
    expect(boneTexture.dispose).toHaveBeenCalled();
    expect(skinned.skeleton).toBeNull();
  });

  it('disposeAnimationMixer stops actions and uncaches root', () => {
    const root = new THREE.Group();
    const mixer = new THREE.AnimationMixer(root);
    const clip = new THREE.AnimationClip('idle', 1, []);
    const action = mixer.clipAction(clip);
    action.play();

    vi.spyOn(mixer, 'stopAllAction');
    vi.spyOn(mixer, 'uncacheRoot');

    disposeAnimationMixer(mixer);

    expect(mixer.stopAllAction).toHaveBeenCalled();
    expect(mixer.uncacheRoot).toHaveBeenCalledWith(root);
  });

  it('skips shared resources listed in options.skip', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: '#fff' });
    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    group.add(mesh);

    vi.spyOn(geometry, 'dispose');
    vi.spyOn(material, 'dispose');

    disposeObject3DTree(group, {
      skip: {
        geometries: new Set([geometry]),
        materials: new Set([material]),
      },
    });

    expect(geometry.dispose).not.toHaveBeenCalled();
    expect(material.dispose).not.toHaveBeenCalled();
  });

  it('disposeEffectComposer calls removePass, pass.dispose, and composer.dispose', () => {
    const passDispose = vi.fn();
    const pass = { dispose: passDispose };
    const composer = {
      dispose: vi.fn(),
      removePass: vi.fn(),
      removeAllPasses: vi.fn(),
      passes: [pass],
    };

    disposeEffectComposer(composer);
    disposeEffectComposer(composer);

    expect(composer.removePass).toHaveBeenCalledWith(pass);
    expect(passDispose).toHaveBeenCalledTimes(1);
    expect(composer.removeAllPasses).toHaveBeenCalledTimes(1);
    expect(composer.dispose).toHaveBeenCalledTimes(1);
  });

  it('disposeEffectComposer calls composer.dispose once and is idempotent', () => {
    const passDispose = vi.fn();
    const pass = { dispose: passDispose };
    const composer = {
      dispose: vi.fn(),
      removePass: vi.fn(),
      removeAllPasses: vi.fn(),
      passes: [pass],
    };

    disposeEffectComposer(composer);
    disposeEffectComposer(composer);

    expect(composer.dispose).toHaveBeenCalledTimes(1);
    expect(passDispose).toHaveBeenCalledTimes(1);
  });

  it('disposeEffectComposer disposes passes when composer.dispose throws', () => {
    const passDispose = vi.fn();
    const composer = {
      dispose: vi.fn(() => {
        throw new Error('partial init');
      }),
      removePass: vi.fn(),
      removeAllPasses: vi.fn(function (this: { passes: unknown[] }) {
        this.passes.length = 0;
      }),
      passes: [{ dispose: passDispose }, { dispose: passDispose }],
    };

    disposeEffectComposer(composer);
    disposeEffectComposer(composer);

    expect(passDispose).toHaveBeenCalledTimes(2);
    expect(composer.passes).toHaveLength(0);
  });

  it('is idempotent for duplicate material references', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: '#fff' });
    const a = new THREE.Mesh(geometry, material);
    const b = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    group.add(a, b);

    vi.spyOn(material, 'dispose');

    disposeObject3DTree(group);

    expect(material.dispose).toHaveBeenCalledTimes(1);
  });
});
