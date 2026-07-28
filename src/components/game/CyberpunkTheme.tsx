/* ─── Volodka RPG – Cyberpunk Theme Provider ───
 * Applies [data-cyberpunk] scope. Palette lives in tokens.css + cyberPalette.ts.
 */

import { createContext, type ReactNode } from 'react';
import {
  CYBERPUNK_COLORS,
  cyberColorRgba,
  type CyberpunkColorKey,
} from '@/shared/constants/cyberPalette';

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
