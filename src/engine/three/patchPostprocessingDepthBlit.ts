/**
 * postprocessing@6.39 EffectComposer.createDepthTexture() builds the "stable"
 * depth via DepthTexture.clone(). Three.js Texture.copy() shares `source`, and
 * WebGLTextures caches the GL texture per Source — so input + stable depth end
 * up as the *same* WebGL image. RenderPass.needsDepthBlit then calls
 * glBlitFramebuffer with identical read/write depth-stencil attachments →
 * GL_INVALID_OPERATION every frame (and can cascade into composer crashes).
 *
 * Patch createDepthTexture to allocate independent DepthTextures (unique Source)
 * and skip blitDepthBuffer when sources still collide.
 *
 * @see https://github.com/mrdoob/three.js/issues/30540
 * @see https://github.com/pmndrs/postprocessing/pull/740
 */
import {
  DepthStencilFormat,
  DepthTexture,
  FloatType,
  UnsignedInt248Type,
  WebGLRenderTarget,
  type Texture,
  type WebGLRenderer,
} from 'three';
import { EffectComposer } from 'postprocessing';

type DepthBlitComposer = {
  inputBuffer: WebGLRenderTarget & { stencilBuffer?: boolean };
  depthTexture: DepthTexture | null;
  depthRenderTarget: WebGLRenderTarget | null;
  renderer: WebGLRenderer | null;
  createDepthTexture: () => DepthTexture | void;
  blitDepthBuffer: (renderTarget: WebGLRenderTarget) => void;
};

const PATCHED = Symbol.for('volodka.postprocessing.depthBlitPatched');

function copyDepthTextureParams(from: DepthTexture, to: DepthTexture): void {
  to.format = from.format;
  to.type = from.type;
  to.magFilter = from.magFilter;
  to.minFilter = from.minFilter;
  to.generateMipmaps = false;
  to.flipY = false;
}

/** Fresh DepthTexture — never clone(); clone shares Source → same GL image. */
export function createIndependentDepthTexture(template?: DepthTexture | null): DepthTexture {
  // Width/height are resized when attached to a render target; unique Source matters.
  const tex = new DepthTexture(1, 1);
  if (template) {
    copyDepthTextureParams(template, tex);
  }
  return tex;
}

export function depthTexturesShareGpuImage(a: Texture | null | undefined, b: Texture | null | undefined): boolean {
  if (!a || !b) return false;
  return a.source === b.source;
}

function patchCreateDepthTexture(proto: DepthBlitComposer): void {
  proto.createDepthTexture = function createDepthTexturePatched(this: DepthBlitComposer) {
    const inputBuffer = this.inputBuffer;
    const depthTexture = createIndependentDepthTexture();
    depthTexture.name = 'EffectComposer.InputDepth';
    this.depthTexture = depthTexture;

    if (inputBuffer.stencilBuffer) {
      depthTexture.format = DepthStencilFormat;
      depthTexture.type = UnsignedInt248Type;
    } else {
      depthTexture.type = FloatType;
    }

    const stableDepthTexture = createIndependentDepthTexture(depthTexture);
    stableDepthTexture.name = 'EffectComposer.StableDepth';

    this.depthRenderTarget = new WebGLRenderTarget(inputBuffer.width, inputBuffer.height, {
      depthBuffer: true,
      stencilBuffer: Boolean(inputBuffer.stencilBuffer),
      depthTexture: stableDepthTexture,
    });

    return stableDepthTexture;
  };
}

function patchBlitDepthBuffer(proto: DepthBlitComposer): void {
  const original = proto.blitDepthBuffer;
  proto.blitDepthBuffer = function blitDepthBufferPatched(
    this: DepthBlitComposer,
    renderTarget: WebGLRenderTarget,
  ) {
    const depthRenderTarget = this.depthRenderTarget;
    if (!depthRenderTarget) return;

    const srcDepth = renderTarget.depthTexture as Texture | null | undefined;
    const dstDepth = depthRenderTarget.depthTexture as Texture | null | undefined;
    if (depthTexturesShareGpuImage(srcDepth, dstDepth)) {
      // Shared Source → identical GL image; blit is illegal and would spam
      // GL_INVALID_OPERATION. Skip until createDepthTexture patch is active.
      return;
    }

    original.call(this, renderTarget);
  };
}

/** Idempotent — safe to import from ExplorationPostFX before EffectComposer mounts. */
export function patchPostprocessingDepthBlit(): void {
  const proto = EffectComposer.prototype as unknown as DepthBlitComposer & {
    [PATCHED]?: boolean;
  };
  if (proto[PATCHED]) return;
  proto[PATCHED] = true;
  patchCreateDepthTexture(proto);
  patchBlitDepthBuffer(proto);
}

patchPostprocessingDepthBlit();
