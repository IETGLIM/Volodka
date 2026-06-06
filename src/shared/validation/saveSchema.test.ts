import { describe, expect, it } from 'vitest';
import { SAVE_VERSION, SavePayloadSchema, validateSaveData } from './saveSchema';
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
});
