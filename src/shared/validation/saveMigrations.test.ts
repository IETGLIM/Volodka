import { describe, expect, it } from 'vitest';
import { migrateSave } from './saveMigrations';
import { SAVE_VERSION } from './saveSchema';
import { createDefaultPersistedState } from '@/store/persistedState';

function buildRawSave(overrides: Record<string, unknown> = {}) {
  return {
    saveVersion: SAVE_VERSION,
    savedAt: Date.now(),
    ...createDefaultPersistedState(),
    ...overrides,
  };
}

describe('migrateSave', () => {
  it('is identity for current-version payloads', () => {
    const raw = buildRawSave();
    const result = migrateSave(raw, SAVE_VERSION);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.saveVersion).toBe(SAVE_VERSION);
      expect(result.data.activeTTLFlags).toEqual(raw.activeTTLFlags);
    }
  });

  it('defaults missing saveVersion to 1 and upgrades to current', () => {
    const { saveVersion: _drop, ...withoutVersion } = buildRawSave({
      saveVersion: 1,
      activeTTLFlags: {
        truth_voice_active: {
          key: 'truth_voice_active',
          poemId: 'poem_1',
          expiryTimestamp: 123,
        },
      },
    });
    void _drop;

    const result = migrateSave(withoutVersion, SAVE_VERSION);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.saveVersion).toBe(SAVE_VERSION);
      expect(result.data.activeTTLFlags).toEqual({
        truth_voice_active: {
          key: 'truth_voice_active',
          poemId: 'poem_1',
          expiryTimestamp: 123,
        },
      });
    }
  });

  it('migrates v1 activeTTLFlags array to keyed map (v1→v2)', () => {
    const raw = buildRawSave({
      saveVersion: 1,
      activeTTLFlags: [
        { key: 'truth_voice_active', poemId: 'poem_1', expiryTimestamp: 123 },
        { key: 'storm_wind_active', poemId: 'poem_5', expiryTimestamp: 456 },
      ],
    });

    const result = migrateSave(raw, SAVE_VERSION);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.saveVersion).toBe(2);
      expect(result.data.activeTTLFlags).toEqual({
        truth_voice_active: {
          key: 'truth_voice_active',
          poemId: 'poem_1',
          expiryTimestamp: 123,
        },
        storm_wind_active: {
          key: 'storm_wind_active',
          poemId: 'poem_5',
          expiryTimestamp: 456,
        },
      });
    }
  });

  it('rejects future / unknown major versions', () => {
    const raw = buildRawSave({ saveVersion: SAVE_VERSION + 99 });
    const result = migrateSave(raw, SAVE_VERSION);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/будущей версии/);
      expect(result.error).toContain(String(SAVE_VERSION + 99));
    }
  });

  it('rejects non-integer saveVersion', () => {
    const raw = buildRawSave({ saveVersion: 1.5 });
    const result = migrateSave(raw, SAVE_VERSION);
    expect(result.success).toBe(false);
  });

  it('rejects non-object payloads', () => {
    expect(migrateSave(null, SAVE_VERSION).success).toBe(false);
    expect(migrateSave([], SAVE_VERSION).success).toBe(false);
    expect(migrateSave('save', SAVE_VERSION).success).toBe(false);
  });
});
