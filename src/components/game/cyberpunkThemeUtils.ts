/* ─── Cyberpunk theme style helpers ─── */

import type { CSSProperties } from 'react';
import {
  CYBERPUNK_COLORS,
  type CyberpunkColorKey,
} from '@/shared/constants/cyberPalette';

export function cyberGlowText(color: CyberpunkColorKey | string): string {
  const hex = color in CYBERPUNK_COLORS
    ? CYBERPUNK_COLORS[color as CyberpunkColorKey]
    : color;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `0 0 7px rgba(${r}, ${g}, ${b}, 0.6), 0 0 20px rgba(${r}, ${g}, ${b}, 0.3), 0 0 40px rgba(${r}, ${g}, ${b}, 0.15)`;
}

export function cyberBorderGlow(color: CyberpunkColorKey | string): CSSProperties {
  const hex = color in CYBERPUNK_COLORS
    ? CYBERPUNK_COLORS[color as CyberpunkColorKey]
    : color;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return {
    borderColor: `rgba(${r}, ${g}, ${b}, 0.4)`,
    boxShadow: `0 0 8px rgba(${r}, ${g}, ${b}, 0.15), inset 0 0 8px rgba(${r}, ${g}, ${b}, 0.05)`,
  };
}
