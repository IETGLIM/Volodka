import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecoveryManager } from './recoveryManager';
import { SAVE_BACKUP_KEY, SAVE_KEY } from '@/store/slices/saveStorage';
import {
  forceReloadCurrentScene,
  restartCurrentSceneAtDefaultSpawn,
} from '@/engine/scene/sceneTransition';

vi.mock('@/engine/scene/sceneTransition', () => ({
  forceReloadCurrentScene: vi.fn(() => true),
  restartCurrentSceneAtDefaultSpawn: vi.fn(() => true),
}));

describe('RecoveryManager', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage;
    vi.mocked(forceReloadCurrentScene).mockClear();
    vi.mocked(restartCurrentSceneAtDefaultSpawn).mockClear();
  });

  it('attemptRecovery reloads the current scene', () => {
    const manager = new RecoveryManager(storage);
    expect(manager.attemptRecovery()).toBe(true);
    expect(forceReloadCurrentScene).toHaveBeenCalledTimes(1);
  });

  it('restartCurrentScene uses default spawn restart', () => {
    const manager = new RecoveryManager(storage);
    expect(manager.restartCurrentScene()).toBe(true);
    expect(restartCurrentSceneAtDefaultSpawn).toHaveBeenCalledTimes(1);
  });

  it('resetAllData clears save keys from injected storage', () => {
    const manager = new RecoveryManager(storage);
    manager.resetAllData();

    expect(storage.removeItem).toHaveBeenCalledWith(SAVE_KEY);
    expect(storage.removeItem).toHaveBeenCalledWith(SAVE_BACKUP_KEY);
  });

  it('resetSettings removes accessibility and graphics keys', () => {
    const manager = new RecoveryManager(storage);
    manager.resetSettings();

    expect(storage.removeItem).toHaveBeenCalledWith('volodka_color_blind_mode');
    expect(storage.removeItem).toHaveBeenCalledWith('volodka_quality_preset');
  });
});
