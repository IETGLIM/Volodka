import { describe, expect, it } from 'vitest';
import { SAVE_VERSION } from '@/shared/validation/saveSchema';
import { createDefaultPersistedState, storePatchFromSave } from './persistedState';

function buildValidSavePayload() {
  return {
    saveVersion: SAVE_VERSION,
    savedAt: Date.now(),
    ...createDefaultPersistedState(),
  };
}

describe('storePatchFromSave closed-overlay hubs', () => {
  it('forces overlay closed when resuming at closed-overlay hub', () => {
    const patch = storePatchFromSave({
      ...buildValidSavePayload(),
      currentNodeId: 'cafe_explore_mode',
      showStoryOverlay: true,
      narrativeKind: 'story',
    });
    expect(patch.showStoryOverlay).toBe(false);
    expect(patch.narrativeKind).toBeNull();
    expect(patch.currentNodeId).toBe('cafe_explore_mode');
  });

  it('preserves overlay state for open-overlay hub nodes', () => {
    const patch = storePatchFromSave({
      ...buildValidSavePayload(),
      currentNodeId: 'park_explore_mode',
      showStoryOverlay: true,
      narrativeKind: 'story',
    });
    expect(patch.showStoryOverlay).toBe(true);
    expect(patch.narrativeKind).toBe('story');
  });
});
