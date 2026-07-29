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
});
