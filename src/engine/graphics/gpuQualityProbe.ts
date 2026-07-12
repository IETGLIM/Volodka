/** WebGL / device probes for auto quality tier heuristics. */

export interface WebGlGpuProbe {
  maxTextureSize: number | undefined;
  /** Lowercased UNMASKED_RENDERER_WEBGL when debug extension is available. */
  renderer: string | undefined;
  isSoftwareRenderer: boolean;
}

/** Physical framebuffer pixels: CSS viewport × DPR². */
export function computePhysicalPixelCount(
  viewportWidth: number,
  viewportHeight: number,
  devicePixelRatio: number,
): number {
  const w = Math.max(0, viewportWidth);
  const h = Math.max(0, viewportHeight);
  const dpr = Math.max(1, devicePixelRatio);
  return Math.round(w * h * dpr * dpr);
}

const PROBE_FALLBACK: WebGlGpuProbe = {
  maxTextureSize: undefined,
  renderer: undefined,
  isSoftwareRenderer: false,
};

let cachedProbe: WebGlGpuProbe | null = null;

function loseThrowawayWebGlContext(gl: WebGLRenderingContext): void {
  const loseExt = gl.getExtension('WEBGL_lose_context');
  loseExt?.loseContext();
}

/** Probe WebGL limits once (creates a throwaway canvas). */
export function probeWebGlGpu(): WebGlGpuProbe {
  if (typeof document === 'undefined') return PROBE_FALLBACK;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl')
      ?? canvas.getContext('experimental-webgl');
    if (!gl || !(gl instanceof WebGLRenderingContext)) return PROBE_FALLBACK;

    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;

    const debugExt = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugExt
      ? String(gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL)).toLowerCase()
      : undefined;

    const isSoftwareRenderer = renderer != null
      && /swiftshader|llvmpipe|software rasterizer|microsoft basic render/i.test(renderer);

    loseThrowawayWebGlContext(gl);

    return { maxTextureSize, renderer, isSoftwareRenderer };
  } catch {
    return PROBE_FALLBACK;
  }
}

/** Session-cached GPU probe — avoids allocating a WebGL context per React render. */
export function getCachedWebGlGpuProbe(): WebGlGpuProbe {
  if (!cachedProbe) {
    cachedProbe = probeWebGlGpu();
  }
  return cachedProbe;
}

/** Test-only reset */
export function resetCachedWebGlGpuProbeForTests(): void {
  cachedProbe = null;
}

/** True when renderer string looks like a low-tier mobile GPU. */
export function isWeakMobileGpuRenderer(renderer: string | undefined): boolean {
  if (!renderer) return false;
  return /adreno \(tm\) [1-5]\d{2}|mali-[gt][1-5]\d|powervr sgx|videocore/i.test(renderer);
}
