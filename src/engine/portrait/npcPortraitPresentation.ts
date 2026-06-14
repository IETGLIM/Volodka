import type { CSSProperties } from 'react';
import type { ColorBlindMode } from '@/engine/accessibility/accessibilityTypes';
import type { NPCAppearance } from '@/shared/types/game';

export function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function neonGlowFromSeed(seed: number): string {
  const hue = Math.floor(mulberry32(seed)() * 360);
  return `hsl(${hue}, 85%, 58%)`;
}

export function fallbackAppearance(seed: number): NPCAppearance {
  return {
    bodyColor: '#2a3142',
    accentColor: '#4a5568',
    headAccessory: 'none',
    height: 1.0,
    glowColor: neonGlowFromSeed(seed),
    silhouette: 'average',
  };
}

export function resolveNpcAppearance(npcId: string, appearance?: NPCAppearance): NPCAppearance {
  return appearance ?? fallbackAppearance(hashString(npcId));
}

export function getPortraitInitial(name: string): string {
  return (name.trim().charAt(0) || '?').toUpperCase();
}

export function appearanceCacheToken(appearance: NPCAppearance): string {
  return [
    appearance.bodyColor,
    appearance.accentColor,
    appearance.headAccessory,
    appearance.height,
    appearance.glowColor,
    appearance.silhouette,
  ].join('|');
}

export function buildPortraitCacheKey(
  npcId: string,
  name: string,
  appearance: NPCAppearance,
  colorBlindMode: ColorBlindMode,
): string {
  return `${npcId}|${getPortraitInitial(name)}|${appearanceCacheToken(appearance)}|${colorBlindMode}`;
}

/** Boost contrast for color-vision modes — keeps silhouettes readable. */
export function adaptPortraitAppearance(
  appearance: NPCAppearance,
  colorBlindMode: ColorBlindMode,
): NPCAppearance {
  if (colorBlindMode === 'none') return appearance;
  return {
    ...appearance,
    glowColor: '#facc15',
    accentColor: '#f5f5f5',
  };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return { r: 128, g: 128, b: 128 };

  if (clean.startsWith('hsl')) {
    return { r: 250, g: 204, b: 21 };
  }

  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

export function rgbaColor(color: string, alpha: number): string {
  if (color.startsWith('hsl(')) {
    return color.replace('hsl(', 'hsla(').replace(/\)$/, `, ${alpha})`);
  }
  const { r, g, b } = hexToRgb(color);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function shadeColor(hex: string, amount: number): string {
  if (hex.startsWith('hsl')) {
    return amount > 0 ? '#e2e8f0' : '#1e293b';
  }
  const { r, g, b } = hexToRgb(hex);
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const mix = (c: number) => Math.round(c + (target - c) * t);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

export function getPortraitFrameStyle(glowColor: string): CSSProperties {
  return {
    borderColor: rgbaColor(glowColor, 0.55),
    boxShadow: `0 0 10px ${rgbaColor(glowColor, 0.3)}, inset 0 0 6px ${rgbaColor(glowColor, 0.15)}`,
    background: '#04060a',
  };
}

export function buildPortraitAccessibleLabel(name: string): string {
  return `Портрет персонажа ${name}`;
}

export function isRevocablePortraitUrl(url: string): boolean {
  return url.startsWith('blob:');
}

export function revokePortraitUrl(url: string): void {
  if (isRevocablePortraitUrl(url)) {
    URL.revokeObjectURL(url);
  }
}
