/**
 * Canonical UI colors «Ночная тетрадь» — must stay in sync with :root in src/styles/tokens.css.
 * Use cyberCyan() / cyberMatrix() for canvas; use var(--cyber-cyan) in inline DOM styles.
 *
 * v4.45.0: палитра переведена с неонового киберпанка на ночной фонарь:
 * лунная сталь (быв. циан), шалфей-матрица, фонарь-янтарь, кирпич.
 * Имена сохранены — весь canvas-код (миникарта, цифры урона, компас)
 * перекрашивается автоматически.
 */

export const CYBER_CYAN = '#9db3c8' as const;
export const CYBER_CYAN_RGB = '157, 179, 200' as const;
export const CYBER_CYAN_DIM = '#8497ab' as const;

export const CYBER_MATRIX = '#46b96e' as const;
export const CYBER_MATRIX_RGB = '70, 185, 110' as const;

export const CYBER_GREEN = '#57a874' as const;
export const CYBER_AMBER = '#e2a84b' as const;

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
  amberGold: '#e2a84b',
  deepCrimson: '#b23c31',
  mutedOlive: '#6f8a5c',
} as const;

export type CyberpunkColorKey = keyof typeof CYBERPUNK_COLORS;

export function cyberColorRgba(key: CyberpunkColorKey, alpha: number): string {
  const hex = CYBERPUNK_COLORS[key];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
