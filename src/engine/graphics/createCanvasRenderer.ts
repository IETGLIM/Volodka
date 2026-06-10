import * as THREE from 'three';
import type { WebGLRenderer } from 'three';
import { isWebgpuRendererEnabled } from '@/config/featureFlags';
import { devWarn } from '@/shared/utils/devLog';
import type { QualityPreset } from '@/engine/graphics/qualityPresets';

/** Matches R3F DefaultGLProps.canvas (DOM + minimal OffscreenCanvas stub). */
type CanvasGlProps = {
  canvas: HTMLCanvasElement | OffscreenCanvas | EventTarget;
};

function applyRendererDefaults(renderer: {
  toneMapping: THREE.ToneMapping;
  toneMappingExposure: number;
  setClearColor: (color: number, alpha?: number) => void;
}): void {
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 1);
}

function createWebGLRenderer(
  canvas: CanvasGlProps['canvas'],
  preset: QualityPreset,
): WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas as HTMLCanvasElement,
    antialias: preset.antialias,
    stencil: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  applyRendererDefaults(renderer);
  return renderer;
}

async function tryCreateWebGPURenderer(
  canvas: CanvasGlProps['canvas'],
): Promise<WebGLRenderer | null> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator) || !navigator.gpu) {
    return null;
  }

  if (!(canvas instanceof HTMLCanvasElement)) {
    return null;
  }

  try {
    const { WebGPURenderer } = await import('three/webgpu');
    const renderer = new WebGPURenderer({ canvas, antialias: true });
    await renderer.init();
    applyRendererDefaults(renderer);
    return renderer as unknown as WebGLRenderer;
  } catch {
    return null;
  }
}

/** R3F `gl` factory — WebGPU canary when flagged, WebGL is always the fallback default. */
export async function createCanvasRenderer(
  props: CanvasGlProps,
  preset: QualityPreset,
): Promise<WebGLRenderer> {
  if (isWebgpuRendererEnabled()) {
    const webgpuRenderer = await tryCreateWebGPURenderer(props.canvas);
    if (webgpuRenderer) {
      return webgpuRenderer;
    }
    devWarn('[RPGGameCanvas] WebGPU canary unavailable (no GPU API or three/webgpu); using WebGL');
  }

  return createWebGLRenderer(props.canvas, preset);
}
