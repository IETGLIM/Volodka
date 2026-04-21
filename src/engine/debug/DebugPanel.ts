/**
 * Заготовка под overlay отладки (fixed step, FPS, подписчики EventBus).
 * UI-реализацию лучше вынести в отдельный React-компонент под флагом `NEXT_PUBLIC_*`.
 */
export const explorationDebug = {
  enabled: false,
  logFrame(_info: { deltaMs: number; fixedSteps: number }): void {
    if (!this.enabled) return;
  },
} as const;
