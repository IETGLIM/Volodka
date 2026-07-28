import { describe, expect, it } from 'vitest';
import { SAVE_VERSION, SavePayloadSchema, validateSaveData } from './saveSchema';
import { createDefaultPersistedState, storePatchFromSave } from '@/store/persistedState';

function buildValidSavePayload() {
  return {
    saveVersion: SAVE_VERSION,
    savedAt: Date.now(),
    ...createDefaultPersistedState(),
  };
}

describe('SavePayloadSchema', () => {
  it('accepts default persisted state', () => {
    const result = SavePayloadSchema.safeParse(buildValidSavePayload());
    expect(result.success).toBe(true);
  });

  it('migrates legacy activeTTLFlags array to keyed map', () => {
    const legacy = {
      ...buildValidSavePayload(),
      activeTTLFlags: [
        { key: 'truth_voice_active', poemId: 'poem_1', expiryTimestamp: 123 },
        { key: 'storm_wind_active', poemId: 'poem_5', expiryTimestamp: 456 },
      ],
    };
    const result = SavePayloadSchema.safeParse(legacy);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.activeTTLFlags).toEqual({
        truth_voice_active: { key: 'truth_voice_active', poemId: 'poem_1', expiryTimestamp: 123 },
        storm_wind_active: { key: 'storm_wind_active', poemId: 'poem_5', expiryTimestamp: 456 },
      });
    }
  });

  it('rejects empty currentNodeId', () => {
    const bad = { ...buildValidSavePayload(), currentNodeId: '' };
    const result = SavePayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});

describe('validateSaveData', () => {
  it('round-trips valid JSON', () => {
    const raw = JSON.stringify(buildValidSavePayload());
    const result = validateSaveData(raw);
    expect(result.success).toBe(true);
  });

  it('rejects malformed JSON', () => {
    const result = validateSaveData('{not json');
    expect(result.success).toBe(false);
  });

  it('runs migrate then Zod: upgrades v1 array TTL flags', () => {
    const v1 = {
      ...buildValidSavePayload(),
      saveVersion: 1,
      activeTTLFlags: [
        { key: 'truth_voice_active', poemId: 'poem_1', expiryTimestamp: 123 },
      ],
    };
    const result = validateSaveData(JSON.stringify(v1));
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

  it('rejects future saveVersion before Zod', () => {
    const future = { ...buildValidSavePayload(), saveVersion: SAVE_VERSION + 10 };
    const result = validateSaveData(JSON.stringify(future));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/будущей версии/);
    }
  });
});

describe('storePatchFromSave', () => {
  it('migrates read_poem_2 when poem_2 collected without flag (pre-4262626)', () => {
    const payload = {
      ...buildValidSavePayload(),
      collectedPoems: ['poem_2'],
      playerState: {
        ...buildValidSavePayload().playerState,
        flags: {},
      },
    };
    const patch = storePatchFromSave(payload);
    expect(patch.playerState?.flags?.read_poem_2).toBe(true);
  });
});
