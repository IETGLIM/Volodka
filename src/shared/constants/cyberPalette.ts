/**
 * Canonical cyber UI colors — must stay in sync with :root in src/styles/tokens.css.
 * Use cyberCyan() / cyberMatrix() for canvas; use var(--cyber-cyan) in inline DOM styles.
 */

export const CYBER_CYAN = '#00e5ff' as const;
export const CYBER_CYAN_RGB = '0, 229, 255' as const;
export const CYBER_CYAN_DIM = '#00ccdd' as const;

export const CYBER_MATRIX = '#00ff64' as const;
export const CYBER_MATRIX_RGB = '0, 255, 100' as const;

export const CYBER_GREEN = '#39ff14' as const;
export const CYBER_AMBER = '#ffab00' as const;

/** rgba() for canvas / WebGL — CSS variables do not work on canvas fillStyle. */
export function cyberCyan(alpha: number): string {
  return `rgba(${CYBER_CYAN_RGB}, ${alpha})`;
}

export function cyberMatrix(alpha: number): string {
  return `rgba(${CYBER_MATRIX_RGB}, ${alpha})`;
}

/** Shared with CyberpunkThemeProvider context */
export const CYBERPUNK_COLORS = {
  matrixGreen: CYBER_MATRIX,
  neonCyan: CYBER_CYAN,
  amberGold: '#d4920a',
  deepCrimson: '#cc2020',
  mutedOlive: '#6a8a30',
} as const;

export type CyberpunkColorKey = keyof typeof CYBERPUNK_COLORS;

export function cyberColorRgba(key: CyberpunkColorKey, alpha: number): string {
  const hex = CYBERPUNK_COLORS[key];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
