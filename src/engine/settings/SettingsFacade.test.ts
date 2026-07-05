import { describe, expect, it, beforeEach, vi } from 'vitest';
import { applyAudioSettings } from '@/engine/audio/AudioSettings';
import { applyGameSettings, readGameSettings, syncMusicFromSave } from '@/engine/settings/SettingsFacade';
import { resetDefaultAccessibilityManager } from '@/engine/accessibility/accessibilitySettings';

function mockLocalStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    key() {
      return null;
    },
  } as Storage;
}

describe('SettingsFacade', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage());
    resetDefaultAccessibilityManager();
  });

  it('reads a unified settings snapshot', () => {
    const snapshot = readGameSettings();
    expect(snapshot.audio.musicVolume).toBeGreaterThan(0);
    expect(snapshot.visual.postfxEnabled).toBeTypeOf('boolean');
    expect(snapshot.accessibility.textSpeed).toBeTruthy();
    expect(snapshot.graphicsQuality).toBe('auto');
    expect(snapshot.combatDifficulty).toBe('normal');
  });

  it('applyGameSettings does not throw on boot path', () => {
    expect(() => applyGameSettings()).not.toThrow();
  });

  it('syncMusicFromSave updates music volume scale', () => {
    syncMusicFromSave(true, 42);
    const applied = applyAudioSettings();
    expect(applied.musicEnabled).toBe(true);
    expect(applied.musicVolume).toBeCloseTo(0.42);
  });
});
