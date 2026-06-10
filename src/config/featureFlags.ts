/**
 * Runtime feature flags — localStorage overrides + Vite env.
 * WebGPU is experimental; WebGL remains the default renderer.
 */

const WEBGPU_STORAGE_KEY = 'volodka_webgpu';

function readEnvFlag(value: string | undefined): boolean {
  return value === '1' || value === 'true';
}

/** Experimental WebGPU renderer canary (Settings + VITE_ENABLE_WEBGPU). */
export function isWebgpuRendererEnabled(): boolean {
  if (readEnvFlag(import.meta.env.VITE_ENABLE_WEBGPU)) return true;
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(WEBGPU_STORAGE_KEY) === '1';
}

export function setWebgpuRendererEnabled(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(WEBGPU_STORAGE_KEY, enabled ? '1' : '0');
}

export interface FeatureFlags {
  webgpuRenderer: boolean;
}

export function getFeatureFlags(): FeatureFlags {
  return {
    webgpuRenderer: isWebgpuRendererEnabled(),
  };
}
