/** Dev-only logging — keeps production console clean for players. */

export function devLog(...args: unknown[]): void {
  if (import.meta.env.DEV) console.log(...args);
}

export function devWarn(...args: unknown[]): void {
  if (import.meta.env.DEV) console.warn(...args);
}

export function devInfo(...args: unknown[]): void {
  if (import.meta.env.DEV) console.info(...args);
}
