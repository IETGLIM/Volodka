import { describe, expect, it } from 'vitest';
import { SAVE_VERSION, SavePayloadSchema, validateSaveData, parseNpcStatesFromSave } from './saveSchema';
import { createDefaultPersistedState } from '@/store/persistedState';

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

  it('rejects invalid exploration scene id', () => {
    const bad = {
      ...buildValidSavePayload(),
      exploration: {
        ...buildValidSavePayload().exploration,
        currentSceneId: 'not_a_real_scene',
      },
    };
    const result = SavePayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('rejects currentAct above MAX_STORY_ACT', () => {
    const bad = {
      ...buildValidSavePayload(),
      playerState: {
        ...buildValidSavePayload().playerState,
        progression: {
          ...buildValidSavePayload().playerState.progression,
          currentAct: 99,
        },
      },
    };
    const result = SavePayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('migrates legacy combat mode to exploration default', () => {
    const legacy = { ...buildValidSavePayload(), mode: 'combat' as const };
    const result = SavePayloadSchema.safeParse(legacy);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mode).toBe('combat');
    }
  });

  it('drops invalid npcStates entries during parseNpcStatesFromSave', () => {
    const parsed = parseNpcStatesFromSave({
      maria: { position: [0, 0, 0], sceneId: 'volodka_room' },
      broken: { position: 'bad', sceneId: 'volodka_room' },
      ghost: { position: [1, 0, 1], sceneId: 'unknown_scene' },
    });
    expect(Object.keys(parsed)).toEqual(['maria']);
  });
});
