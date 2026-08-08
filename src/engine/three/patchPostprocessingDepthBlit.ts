/**
 * postprocessing@6.39 EffectComposer.createDepthTexture() builds the "stable"
 * depth via DepthTexture.clone(). Three.js Texture.copy() shares `source`, and
 * WebGLTextures caches the GL texture per Source — so input + stable depth end
 * up as the *same* WebGL image. RenderPass.needsDepthBlit then calls
 * glBlitFramebuffer with identical read/write depth-stencil attachments →
 * GL_INVALID_OPERATION every frame (and can cascade into composer crashes).
 *
 * This module replaces the fragile silent-skip workaround with a robust two-
 * layer fix:
 *
 * 1. **Primary**: patchCreateDepthTexture allocates independent DepthTextures
 *    (unique Source) — prevents the collision entirely.
 * 2. **Self-healing fallback**: patchBlitDepthBuffer detects if sources STILL
 *    collide (e.g. after a library update or edge-case RT reuse) and
 *    reallocates the depth render target with a guaranteed-fresh texture,
 *    then falls through to the original blit. No depth data is ever silently
 *    dropped — depth-dependent effects (DOF, N8AO, GodRays) always receive
 *    valid depth information.
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

/**
 * Self-healing fallback: if depth sources still share a GPU image despite the
 * createDepthTexture patch (edge case: library update, RT reuse, hot reload),
 * dispose the stale depth render target and reallocate with a guaranteed-fresh
 * depth texture. This ensures depth data is NEVER silently dropped — the blit
 * proceeds with valid, independent textures.
 */
function reallocateDepthRenderTarget(composer: DepthBlitComposer): void {
  const inputBuffer = composer.inputBuffer;
  const oldRT = composer.depthRenderTarget;

  // Dispose old GPU resources to prevent memory leak
  if (oldRT) {
    oldRT.dispose();
  }

  // Create a fresh independent depth texture (new Source guaranteed)
  const freshDepthTexture = createIndependentDepthTexture(composer.depthTexture);
  freshDepthTexture.name = 'EffectComposer.StableDepth.Reallocated';

  composer.depthRenderTarget = new WebGLRenderTarget(inputBuffer.width, inputBuffer.height, {
    depthBuffer: true,
    stencilBuffer: Boolean(inputBuffer.stencilBuffer),
    depthTexture: freshDepthTexture,
  });
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
      // Shared Source → identical GL image; glBlitFramebuffer would spam
      // GL_INVALID_OPERATION. Self-heal: reallocate with fresh texture and
      // proceed with the blit so depth-dependent effects still work.
      reallocateDepthRenderTarget(this);
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
