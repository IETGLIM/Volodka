
/* ─── Volodka RPG – Cyberpunk Theme Provider ───
 * Shared theme provider that applies consistent cyberpunk visual effects
 * across the game: scanlines, CRT vignette, glitch animations, and
 * a React context for theme color values.
 */

import { createContext, type ReactNode } from 'react'
import '@/styles/cyberpunk-theme.css';

/* ─── Theme Color Constants ─── */

export const CYBERPUNK_COLORS = {
  /** Matrix-green accent */
  matrixGreen: '#00ff41',
  /** Neon cyan for interactive elements */
  neonCyan: '#00e5ff',
  /** Amber/gold for important elements */
  amberGold: '#d4920a',
  /** Deep crimson for danger */
  deepCrimson: '#cc2020',
  /** Muted olive for machine/nature blend */
  mutedOlive: '#6a8a30',
} as const

export type CyberpunkColorKey = keyof typeof CYBERPUNK_COLORS

/* ─── Theme Context ─── */

interface CyberpunkThemeContextValue {
  colors: typeof CYBERPUNK_COLORS
  /** Get an rgba string for a named color */
  rgba: (key: CyberpunkColorKey, alpha: number) => string
  /** Get a CSS variable string for a named color */
  cssVar: (key: CyberpunkColorKey) => string
}

const CyberpunkThemeContext = createContext<CyberpunkThemeContextValue | null>(null)

/* ─── Helper: hex to rgba ─── */

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/* ─── Theme Provider Component ─── */

interface CyberpunkThemeProviderProps {
  children: ReactNode
}

export function CyberpunkThemeProvider({ children }: CyberpunkThemeProviderProps) {
  const contextValue: CyberpunkThemeContextValue = {
    colors: CYBERPUNK_COLORS,
    rgba: (key, alpha) => hexToRgba(CYBERPUNK_COLORS[key], alpha),
    cssVar: (key) => {
      const map: Record<CyberpunkColorKey, string> = {
        matrixGreen: 'var(--cyber-matrix-green)',
        neonCyan: 'var(--cyber-neon-cyan)',
        amberGold: 'var(--cyber-amber-gold)',
        deepCrimson: 'var(--cyber-deep-crimson)',
        mutedOlive: 'var(--cyber-muted-olive)',
      }
      return map[key]
    },
  }

  return (
    <CyberpunkThemeContext.Provider value={contextValue}>
      {/* CSS custom properties for theme colors */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --cyber-matrix-green: ${CYBERPUNK_COLORS.matrixGreen};
          --cyber-neon-cyan: ${CYBERPUNK_COLORS.neonCyan};
          --cyber-amber-gold: ${CYBERPUNK_COLORS.amberGold};
          --cyber-deep-crimson: ${CYBERPUNK_COLORS.deepCrimson};
          --cyber-muted-olive: ${CYBERPUNK_COLORS.mutedOlive};
        }
      `}} />
      <div data-cyberpunk style={{ display: 'contents' }}>
        {children}
      </div>
    </CyberpunkThemeContext.Provider>
  )
}

/* ─── Utility: Get glow text shadow for a color ─── */

export function cyberGlowText(color: CyberpunkColorKey | string): string {
  const hex = color in CYBERPUNK_COLORS
    ? CYBERPUNK_COLORS[color as CyberpunkColorKey]
    : color
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `0 0 7px rgba(${r}, ${g}, ${b}, 0.6), 0 0 20px rgba(${r}, ${g}, ${b}, 0.3), 0 0 40px rgba(${r}, ${g}, ${b}, 0.15)`
}

/* ─── Utility: Get neon border glow for a color ─── */

export function cyberBorderGlow(color: CyberpunkColorKey | string): React.CSSProperties {
  const hex = color in CYBERPUNK_COLORS
    ? CYBERPUNK_COLORS[color as CyberpunkColorKey]
    : color
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return {
    borderColor: `rgba(${r}, ${g}, ${b}, 0.4)`,
    boxShadow: `0 0 8px rgba(${r}, ${g}, ${b}, 0.15), inset 0 0 8px rgba(${r}, ${g}, ${b}, 0.05)`,
  }
}
