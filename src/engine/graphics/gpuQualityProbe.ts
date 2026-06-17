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

/** Probe WebGL limits once (creates a throwaway canvas). */
export function probeWebGlGpu(): WebGlGpuProbe {
  const fallback: WebGlGpuProbe = {
    maxTextureSize: undefined,
    renderer: undefined,
    isSoftwareRenderer: false,
  };

  if (typeof document === 'undefined') return fallback;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl')
      ?? canvas.getContext('experimental-webgl');
    if (!gl || !(gl instanceof WebGLRenderingContext)) return fallback;

    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;

    const debugExt = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugExt
      ? String(gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL)).toLowerCase()
      : undefined;

    const isSoftwareRenderer = renderer != null
      && /swiftshader|llvmpipe|software rasterizer|microsoft basic render/i.test(renderer);

    return { maxTextureSize, renderer, isSoftwareRenderer };
  } catch {
    return fallback;
  }
}

/** True when renderer string looks like a low-tier mobile GPU. */
export function isWeakMobileGpuRenderer(renderer: string | undefined): boolean {
  if (!renderer) return false;
  return /adreno \(tm\) [1-5]\d{2}|mali-[gt][1-5]\d|powervr sgx|videocore/i.test(renderer);
}
