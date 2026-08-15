import { CanvasTexture } from 'three';
import {
  getCachedCanvasTexture,
  releaseCachedCanvasTexture,
} from '@/engine/three/cachedCanvasTexture';

export type ContactShadowVariant = 'player' | 'playerFp' | 'npc';

export interface ContactShadowTextureParams {
  variant: ContactShadowVariant;
  size?: number;
}

interface ContactShadowPreset {
  size: number;
  /** Radial alpha stops — soft penumbra (more stops = smoother falloff). */
  stops: readonly [number, number][];
}

/** Soft-falloff radial presets — dense core, long penumbra, no hard rim. */
export const CONTACT_SHADOW_PRESETS: Record<ContactShadowVariant, ContactShadowPreset> = {
  player: {
    size: 128,
    stops: [
      [0, 0.48],
      [0.18, 0.36],
      [0.38, 0.2],
      [0.58, 0.09],
      [0.78, 0.03],
      [0.92, 0.008],
      [1, 0],
    ],
  },
  /** Tighter, denser core for first-person capsule grounding. */
  playerFp: {
    size: 96,
    stops: [
      [0, 0.58],
      [0.16, 0.42],
      [0.34, 0.24],
      [0.52, 0.11],
      [0.72, 0.04],
      [0.9, 0.01],
      [1, 0],
    ],
  },
  npc: {
    size: 64,
    stops: [
      [0, 0.4],
      [0.22, 0.26],
      [0.45, 0.12],
      [0.68, 0.045],
      [0.88, 0.01],
      [1, 0],
    ],
  },
};

export const CONTACT_SHADOW_CACHE_KEYS = {
  player: contactShadowCacheKey({ variant: 'player' }),
  playerFp: contactShadowCacheKey({ variant: 'playerFp' }),
  npc: contactShadowCacheKey({ variant: 'npc' }),
} as const;

function contactShadowCacheKey(params: ContactShadowTextureParams): string {
  const preset = CONTACT_SHADOW_PRESETS[params.variant];
  const size = params.size ?? preset.size;
  return `contact_shadow:${params.variant}:${size}`;
}

export function createContactShadowTexture(
  params: ContactShadowTextureParams,
): CanvasTexture {
  const preset = CONTACT_SHADOW_PRESETS[params.variant];
  const size = params.size ?? preset.size;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to acquire 2D context for contact shadow texture');
  }
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  for (const [stop, alpha] of preset.stops) {
    gradient.addColorStop(stop, `rgba(0, 0, 0, ${alpha})`);
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

/** Ref-counted global cache — shared across player/NPC remounts. */
export function getContactShadowTexture(
  params: ContactShadowTextureParams,
): CanvasTexture {
  const key = contactShadowCacheKey(params);
  return getCachedCanvasTexture(key, () => createContactShadowTexture(params));
}

export function releaseContactShadowTexture(params: ContactShadowTextureParams): void {
  releaseCachedCanvasTexture(contactShadowCacheKey(params));
}
