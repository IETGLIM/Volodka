import type { ArchetypeRegistry } from './ArchetypeRegistry';

/**
 * Контекст пакетного сим-кадра: только dt и доступ к SoA. Без React, без Zustand.
 */
export interface SimContext {
  /** Шаг фазы в миллисекундах (`fixedUpdate` из Runner — тот же шаг, что у ECSWorld). */
  deltaTimeMs: number;
  readonly registry: ArchetypeRegistry;
}

export function simDeltaSeconds(ctx: SimContext): number {
  return ctx.deltaTimeMs * 0.001;
}
