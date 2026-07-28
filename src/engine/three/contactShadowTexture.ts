import * as THREE from 'three';
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
  stops: readonly [number, number][];
}

const CONTACT_SHADOW_PRESETS: Record<ContactShadowVariant, ContactShadowPreset> = {
  player: {
    size: 128,
    stops: [
      [0, 0.42],
      [0.32, 0.26],
      [0.58, 0.1],
      [0.82, 0.025],
      [1, 0],
    ],
  },
  /** Tighter, denser core for first-person capsule grounding. */
  playerFp: {
    size: 96,
    stops: [
      [0, 0.55],
      [0.28, 0.32],
      [0.52, 0.12],
      [0.78, 0.03],
      [1, 0],
    ],
  },
  npc: {
    size: 64,
    stops: [
      [0, 0.38],
      [0.4, 0.18],
      [0.7, 0.055],
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
): THREE.CanvasTexture {
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
  return new THREE.CanvasTexture(canvas);
}

/** Ref-counted global cache — shared across player/NPC remounts. */
export function getContactShadowTexture(
  params: ContactShadowTextureParams,
): THREE.CanvasTexture {
  const key = contactShadowCacheKey(params);
  return getCachedCanvasTexture(key, () => createContactShadowTexture(params));
}

export function releaseContactShadowTexture(params: ContactShadowTextureParams): void {
  releaseCachedCanvasTexture(contactShadowCacheKey(params));
}
