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

/**
 * True when renderer string looks like an integrated desktop/laptop GPU
 * (Intel UHD/Iris/Xe, AMD Radeon Vega/Ryzen iGPU, Apple M-series).
 *
 * FIX (v4.65.0) — репорт игрока: GL_OUT_OF_MEMORY (D3D11 Texture2D) на
 * Windows-ноутбуке с iGPU. Интегрированные GPU делят системную память и
 * сообщают завышенный MAX_TEXTURE_SIZE, а navigator.deviceMemory на
 * Windows отсутствует — capQualityTierForGpuMemory их не замечал и выдавал
 * high-пресет с dpr до 1.5. На масштабе Windows 150% это 2880×1620 ×
 * ~18 постэффект-таргетов RGBA16F ≈ 280 МБ только рендер-таргетов,
 * плюс float-HDRI 2k (33 МБ) и PMREM-цепочка — пик ~450 МБ на iGPU со
 * shared memory → D3D11 OOM → CONTEXT_LOST → белый экран.
 */
export function isIntegratedGpuRenderer(renderer: string | undefined): boolean {
  if (!renderer) return false;
  // Intel UHD/Iris Plus/Xe (8th-12th gen laptops); Apple M1/M2 (iGPU, но
  // с unified memory — попадает под тот же консервативный бюджет);
  // AMD Radeon Vega/Radeon Graphics (Ryzen iGPU). Дискретные карты
  // (GTX/RTX/RX) в паттерн не входят.
  return /intel\(r\)? (uhd|iris|hd graphics)|intel\(r\).*graphics|apple m\d|radeon(?:\(tm\))? (vega|graphics)/i.test(renderer);
}
