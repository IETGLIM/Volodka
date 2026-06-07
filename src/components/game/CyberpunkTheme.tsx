
/* ─── Volodka RPG – Cyberpunk Theme Provider ───
 * Applies [data-cyberpunk] scope. Palette lives in tokens.css + cyberPalette.ts.
 */

import { createContext, type ReactNode } from 'react';
import {
  CYBERPUNK_COLORS,
  cyberColorRgba,
  type CyberpunkColorKey,
} from '@/shared/constants/cyberPalette';

export { CYBERPUNK_COLORS, type CyberpunkColorKey };

interface CyberpunkThemeContextValue {
  colors: typeof CYBERPUNK_COLORS;
  rgba: (key: CyberpunkColorKey, alpha: number) => string;
  cssVar: (key: CyberpunkColorKey) => string;
}

const CyberpunkThemeContext = createContext<CyberpunkThemeContextValue | null>(null);

const CSS_VAR_MAP: Record<CyberpunkColorKey, string> = {
  matrixGreen: 'var(--cyber-matrix-green)',
  neonCyan: 'var(--cyber-neon-cyan)',
  amberGold: 'var(--cyber-amber-gold)',
  deepCrimson: 'var(--cyber-deep-crimson)',
  mutedOlive: 'var(--cyber-muted-olive)',
};

interface CyberpunkThemeProviderProps {
  children: ReactNode;
}

export function CyberpunkThemeProvider({ children }: CyberpunkThemeProviderProps) {
  const contextValue: CyberpunkThemeContextValue = {
    colors: CYBERPUNK_COLORS,
    rgba: cyberColorRgba,
    cssVar: (key) => CSS_VAR_MAP[key],
  };

  return (
    <CyberpunkThemeContext.Provider value={contextValue}>
      <div data-cyberpunk style={{ display: 'contents' }}>
        {children}
      </div>
    </CyberpunkThemeContext.Provider>
  );
}

export function cyberGlowText(color: CyberpunkColorKey | string): string {
  const hex = color in CYBERPUNK_COLORS
    ? CYBERPUNK_COLORS[color as CyberpunkColorKey]
    : color;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `0 0 7px rgba(${r}, ${g}, ${b}, 0.6), 0 0 20px rgba(${r}, ${g}, ${b}, 0.3), 0 0 40px rgba(${r}, ${g}, ${b}, 0.15)`;
}

export function cyberBorderGlow(color: CyberpunkColorKey | string): React.CSSProperties {
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
