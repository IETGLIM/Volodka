import { describe, expect, it } from 'vitest';
import {
  DepthStencilFormat,
  DepthTexture,
  FloatType,
  UnsignedInt248Type,
  WebGLRenderTarget,
} from 'three';
import { EffectComposer } from 'postprocessing';
import {
  createIndependentDepthTexture,
  depthTexturesShareGpuImage,
  patchPostprocessingDepthBlit,
} from '@/engine/three/patchPostprocessingDepthBlit';

type DepthComposerStub = {
  inputBuffer: WebGLRenderTarget & { stencilBuffer: boolean };
  depthTexture: DepthTexture | null;
  depthRenderTarget: WebGLRenderTarget | null;
  createDepthTexture: () => DepthTexture;
};

function makeComposerStub(stencilBuffer: boolean): DepthComposerStub {
  patchPostprocessingDepthBlit();

  const composer = Object.create(EffectComposer.prototype) as DepthComposerStub;
  composer.inputBuffer = new WebGLRenderTarget(4, 4, {
    depthBuffer: true,
    stencilBuffer,
  }) as WebGLRenderTarget & { stencilBuffer: boolean };
  composer.inputBuffer.stencilBuffer = stencilBuffer;
  composer.depthTexture = null;
  composer.depthRenderTarget = null;
  return composer;
}

function disposeComposerStub(composer: DepthComposerStub): void {
  composer.depthRenderTarget?.dispose();
  composer.inputBuffer.dispose();
  composer.depthTexture?.dispose();
}

describe('patchPostprocessingDepthBlit', () => {
  it('createIndependentDepthTexture never shares Source with a clone template', () => {
    const a = new DepthTexture(1, 1);
    a.type = FloatType;
    const b = createIndependentDepthTexture(a);
    expect(depthTexturesShareGpuImage(a, b)).toBe(false);
    expect(b.type).toBe(FloatType);
    // Contrast: Three.js clone() shares Source (the bug we work around).
    expect(depthTexturesShareGpuImage(a, a.clone())).toBe(true);
  });

  it('patched createDepthTexture returns a stable depth with a distinct Source', () => {
    const composer = makeComposerStub(false);
    const stable = composer.createDepthTexture();

    expect(composer.depthTexture).toBeInstanceOf(DepthTexture);
    expect(stable).toBeInstanceOf(DepthTexture);
    expect(composer.depthRenderTarget?.depthTexture).toBe(stable);
    expect(depthTexturesShareGpuImage(composer.depthTexture, stable)).toBe(false);
    expect(stable.type).toBe(FloatType);

    disposeComposerStub(composer);
  });

  it('patched createDepthTexture mirrors stencil depth format without sharing Source', () => {
    const composer = makeComposerStub(true);
    const stable = composer.createDepthTexture();

    expect(composer.depthTexture?.format).toBe(DepthStencilFormat);
    expect(composer.depthTexture?.type).toBe(UnsignedInt248Type);
    expect(stable.format).toBe(DepthStencilFormat);
    expect(stable.type).toBe(UnsignedInt248Type);
    expect(depthTexturesShareGpuImage(composer.depthTexture, stable)).toBe(false);

    disposeComposerStub(composer);
  });

  it('blitDepthBuffer self-heals when src/dst depth share Source (reallocates then blits)', () => {
    patchPostprocessingDepthBlit();

    const shared = new DepthTexture(2, 2);
    const inputBuffer = new WebGLRenderTarget(2, 2, { depthTexture: shared });
    const depthRenderTarget = new WebGLRenderTarget(2, 2, {
      depthTexture: shared.clone(),
    });

    // Stub composer — renderer is null so the original blit will no-op/throw;
    // we verify that the self-heal reallocation replaces the stale depthRenderTarget.
    const composer = Object.create(EffectComposer.prototype) as EffectComposer & {
      depthRenderTarget: WebGLRenderTarget | null;
      renderer: null;
      inputBuffer: WebGLRenderTarget & { stencilBuffer?: boolean };
      depthTexture: DepthTexture | null;
      blitDepthBuffer: (rt: WebGLRenderTarget) => void;
    };
    composer.inputBuffer = inputBuffer;
    composer.depthTexture = shared;
    composer.depthRenderTarget = depthRenderTarget;
    composer.renderer = null;

    expect(depthTexturesShareGpuImage(inputBuffer.depthTexture, depthRenderTarget.depthTexture)).toBe(true);

    // Capture the old RT reference
    const oldRT = composer.depthRenderTarget;

    // The patched blit should reallocate (self-heal) instead of silently skipping.
    // It will then call the original blit which may throw with renderer=null,
    // but the reallocation itself must have occurred.
    try {
      composer.blitDepthBuffer(inputBuffer);
    } catch {
      // Expected: original blit fails with null renderer, but reallocation succeeded
    }

    // Verify: depthRenderTarget was replaced (self-healed)
    expect(composer.depthRenderTarget).not.toBe(oldRT);
    // Verify: new depth texture has a unique Source (no longer shares with input)
    expect(depthTexturesShareGpuImage(
      inputBuffer.depthTexture,
      composer.depthRenderTarget!.depthTexture,
    )).toBe(false);

    inputBuffer.dispose();
    oldRT.dispose();
    composer.depthRenderTarget!.dispose();
    shared.dispose();
  });
});
