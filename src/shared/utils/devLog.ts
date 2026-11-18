/** Dev-only logging — keeps production console clean for players. */
/* eslint-disable no-console -- санкционированный логгер проекта: консоль —
 * его рабочий инструмент, гейт DEV внутри каждой функции. */

export function devLog(...args: unknown[]): void {
  if (import.meta.env.DEV) console.log(...args);
}

export function devWarn(...args: unknown[]): void {
  if (import.meta.env.DEV) console.warn(...args);
}

export function devInfo(...args: unknown[]): void {
  if (import.meta.env.DEV) console.info(...args);
}
