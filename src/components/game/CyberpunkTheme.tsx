'use client'

/* ─── Volodka RPG – Cyberpunk Theme Provider ───
 * Shared theme provider that applies consistent cyberpunk visual effects
 * across the game: scanlines, CRT vignette, glitch animations, and
 * a React context for theme color values.
 */

import { createContext, useContext, type ReactNode } from 'react'

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

export function useCyberpunkTheme(): CyberpunkThemeContextValue {
  const ctx = useContext(CyberpunkThemeContext)
  if (!ctx) {
    // Return a default value if used outside provider
    return {
      colors: CYBERPUNK_COLORS,
      rgba: (key, alpha) => {
        const hex = CYBERPUNK_COLORS[key]
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      },
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
  }
  return ctx
}

/* ─── CSS Module Styles ─── */

export const CYBERPUNK_CSS = `
/* ── Scanlines overlay ── */
.cyber-scanlines {
  position: relative;
}
.cyber-scanlines::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 255, 65, 0.03) 2px,
    rgba(0, 255, 65, 0.03) 4px
  );
  z-index: 1;
}

/* ── CRT vignette effect ── */
.cyber-vignette {
  position: relative;
}
.cyber-vignette::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse at center,
    transparent 50%,
    rgba(0, 0, 0, 0.35) 100%
  );
  z-index: 2;
}

/* ── Glitch effect animation ── */
@keyframes cyberGlitch {
  0% {
    transform: translate(0);
    filter: none;
  }
  7% {
    transform: translate(-2px, 1px);
    filter: hue-rotate(90deg);
  }
  10% {
    transform: translate(1px, -1px);
    filter: none;
  }
  27% {
    transform: translate(0);
    filter: none;
  }
  30% {
    transform: translate(3px, -2px);
    filter: hue-rotate(-45deg) saturate(2);
  }
  35% {
    transform: translate(-1px, 1px);
    filter: none;
  }
  52% {
    transform: translate(0);
    filter: none;
  }
  55% {
    transform: translate(-2px, 0);
    filter: hue-rotate(180deg) brightness(1.2);
  }
  60% {
    transform: translate(0);
    filter: none;
  }
  100% {
    transform: translate(0);
    filter: none;
  }
}

.cyber-glitch {
  animation: cyberGlitch 4s ease-in-out infinite;
}

.cyber-glitch-intense {
  animation: cyberGlitch 1.5s ease-in-out infinite;
}

/* ── Neon glow text ── */
.cyber-glow-green {
  color: #00ff41;
  text-shadow: 0 0 7px rgba(0, 255, 65, 0.6), 0 0 20px rgba(0, 255, 65, 0.3), 0 0 40px rgba(0, 255, 65, 0.15);
}

.cyber-glow-cyan {
  color: #00e5ff;
  text-shadow: 0 0 7px rgba(0, 229, 255, 0.6), 0 0 20px rgba(0, 229, 255, 0.3), 0 0 40px rgba(0, 229, 255, 0.15);
}

.cyber-glow-amber {
  color: #d4920a;
  text-shadow: 0 0 7px rgba(212, 146, 10, 0.6), 0 0 20px rgba(212, 146, 10, 0.3), 0 0 40px rgba(212, 146, 10, 0.15);
}

.cyber-glow-crimson {
  color: #cc2020;
  text-shadow: 0 0 7px rgba(204, 32, 32, 0.6), 0 0 20px rgba(204, 32, 32, 0.3), 0 0 40px rgba(204, 32, 32, 0.15);
}

/* ── Neon border glow ── */
.cyber-border-green {
  border-color: rgba(0, 255, 65, 0.4);
  box-shadow: 0 0 8px rgba(0, 255, 65, 0.15), inset 0 0 8px rgba(0, 255, 65, 0.05);
}

.cyber-border-cyan {
  border-color: rgba(0, 229, 255, 0.4);
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.15), inset 0 0 8px rgba(0, 229, 255, 0.05);
}

.cyber-border-amber {
  border-color: rgba(212, 146, 10, 0.4);
  box-shadow: 0 0 8px rgba(212, 146, 10, 0.15), inset 0 0 8px rgba(212, 146, 10, 0.05);
}

.cyber-border-crimson {
  border-color: rgba(204, 32, 32, 0.4);
  box-shadow: 0 0 8px rgba(204, 32, 32, 0.15), inset 0 0 8px rgba(204, 32, 32, 0.05);
}

/* ── Flicker animation ── */
@keyframes cyberFlicker {
  0%, 100% { opacity: 1; }
  3% { opacity: 0.4; }
  6% { opacity: 1; }
  7% { opacity: 0.7; }
  8% { opacity: 1; }
  50% { opacity: 1; }
  52% { opacity: 0.6; }
  53% { opacity: 1; }
}

.cyber-flicker {
  animation: cyberFlicker 5s ease-in-out infinite;
}

/* ── Typing cursor blink ── */
@keyframes cyberCursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.cyber-cursor::after {
  content: '█';
  animation: cyberCursor 1s step-end infinite;
  color: #00ff41;
}

/* ── Data stream background ── */
.cyber-data-stream {
  background-image:
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 2px,
      rgba(0, 255, 65, 0.015) 2px,
      rgba(0, 255, 65, 0.015) 4px
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 229, 255, 0.008) 2px,
      rgba(0, 229, 255, 0.008) 4px
    );
}
` as const

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
  /** Whether to inject the CSS styles into the DOM (default: true) */
  injectStyles?: boolean
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
      {children}
    </CyberpunkThemeContext.Provider>
  )
}

/* ─── Utility: Apply scanlines + vignette to a container ─── */

export function cyberOverlayStyle(): React.CSSProperties {
  return {
    position: 'relative',
  }
}

export function cyberScanlineStyle(): React.CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: `repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 255, 65, 0.03) 2px,
      rgba(0, 255, 65, 0.03) 4px
    )`,
    zIndex: 1,
  }
}

export function cyberVignetteStyle(): React.CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: `radial-gradient(
      ellipse at center,
      transparent 50%,
      rgba(0, 0, 0, 0.35) 100%
    )`,
    zIndex: 2,
  }
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
