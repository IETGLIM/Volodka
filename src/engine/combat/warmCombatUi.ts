/** Warm CombatUI chunk during encounter presentation (~820ms lead time). */
let warmPromise: Promise<void> | null = null;

export function warmCombatUiModule(): void {
  if (warmPromise) return;
  warmPromise = import('@/components/game/CombatUI').then(() => undefined);
}

/** Test-only reset */
export function resetCombatUiWarmForTests(): void {
  warmPromise = null;
}
