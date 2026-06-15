/* ─── Volodka RPG – game session recovery actions ─── */

import { ACCESSIBILITY_LS_KEYS } from '@/engine/accessibility/AccessibilityManager';
import {
  forceReloadCurrentScene,
  restartCurrentSceneAtDefaultSpawn,
} from '@/engine/scene/sceneTransition';
import { GRAPHICS_SETTINGS_KEY } from '@/engine/graphics/qualityPresets';
import {
  clearAllPersistedGameData,
  removePersistedKeys,
  type PersistedStorage,
} from '@/shared/persistence/persistedStorageOps';

export class RecoveryManager {
  constructor(private readonly storage: PersistedStorage | null = getBrowserStorage()) {}

  attemptRecovery(): boolean {
    return forceReloadCurrentScene();
  }

  restartCurrentScene(): boolean {
    return restartCurrentSceneAtDefaultSpawn();
  }

  resetSettings(): void {
    removePersistedKeys(this.storage, RECOVERY_SETTINGS_KEYS);
  }

  resetAllData(): void {
    clearAllPersistedGameData(this.storage);
  }
}

export const recoveryManager = new RecoveryManager();

function getBrowserStorage(): PersistedStorage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Keys cleared by resetSettings — exported for tests. */
export const RECOVERY_SETTINGS_KEYS = [
  ...Object.values(ACCESSIBILITY_LS_KEYS),
  GRAPHICS_SETTINGS_KEY,
  'volodka_tutorial_disabled',
  'volodka_music_volume',
  'volodka_postfx',
  'volodka_particles',
  'volodka_guidance_dismissed_sig',
] as const;
